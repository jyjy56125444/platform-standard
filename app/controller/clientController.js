'use strict';

const Controller = require('egg').Controller;

class ClientController extends Controller {
  /**
   * 获取应用访问票据（移动端）
   * POST /api/mobile/client/rag/tickets
   * Body: { appId, appUserId, signature }
   * 说明：移动端用户登录后调用此接口获取 ticket，用于后续访问应用接口
   * 
   * 握手协议：
   * 1. 移动端使用 HMAC-SHA256(appId + appUserId, signKey) 生成签名
   * 2. signKey = appId + appUserId + 全局盐值（RAG_TICKET_SIGN_SECRET）
   * 3. 签名内容 = appId + appUserId
   * 4. 后端使用相同的 appId + appUserId + 盐值生成签名，使用 crypto.timingSafeEqual 比较
   * 
   * 用户区分：
   * - 每个 app 的每个用户（appUserId）都有独立的 ticket
   * - appUserId 可以是 UUID（字符串）或 int（数字）形式
   * - 同一用户在同一 app 下，2 小时内返回同一个 ticket
   */
  async obtainRagTicket() {
    const { ctx } = this;
    try {
      const { appId, appUserId, signature } = ctx.request.body || {};

      // 验证 appId
      const appIdNum = Number(appId);
      if (!appIdNum || !Number.isFinite(appIdNum)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'appId 参数无效' };
        return;
      }

      // 验证 appUserId（可以是字符串 UUID 或数字），并转换为字符串
      const appUserIdStr = appUserId != null ? String(appUserId).trim() : '';
      if (!appUserIdStr) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'appUserId 不能为空' };
        return;
      }

      // 验证签名
      if (!signature || typeof signature !== 'string' || signature.trim().length === 0) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'signature 不能为空' };
        return;
      }

      // 验证应用是否存在
      const appExists = await ctx.service.ragTicketService.validateApp(appIdNum);
      if (!appExists) {
        ctx.status = 404;
        ctx.body = { code: 404, message: '应用不存在' };
        return;
      }

      // 验证签名（握手协议的核心验证，使用 appId + appUserId + 盐值，仅比较签名是否匹配）
      const signatureValidation = await ctx.service.ragTicketService.validateSignature(
        appIdNum,
        appUserIdStr,
        signature.trim()
      );

      if (!signatureValidation.valid) {
        ctx.status = 401;
        ctx.body = {
          code: 401,
          message: `签名验证失败: ${signatureValidation.reason}`,
        };
        return;
      }

      // 签名验证通过，获取 ticket（传入用户标识，确保每个用户有独立的 ticket）
      const defaultExpireTime = ctx.app.config.ragTicket?.defaultExpireTime || 7200;
      const result = await ctx.service.ragTicketService.obtainTicket(
        appIdNum,
        appUserIdStr,
        ctx.ip,
        defaultExpireTime
      );

      ctx.body = {
        code: 200,
        message: 'success',
        data: result,
      };
    } catch (error) {
      ctx.logger.error('获取 App Ticket 失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '获取 App Ticket 失败',
        error: error.message,
      };
    }
  }

  /**
   * 客户端记录应用/版本操作日志
   * POST /api/mobile/client/logs
   * Header: X-App-Ticket: <ticket> 或 Query: ?ticket=<ticket>
   * 说明：移动端使用 ticket 访问此接口
   */
  async createAppLog() {
    const { ctx } = this;
    try {
      const {
        appId,
        versionId,
        action,
        actionDetail,
        resultStatus,
        extraData,
        operatorId,
        operatorName,
      } = ctx.request.body || {};

      const appIdNum = parseInt(appId, 10);
      if (!appIdNum || Number.isNaN(appIdNum)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'appId 为必填且必须是数字' };
        return;
      }

      // 提取 ticket（优先从 Header 获取，其次从 Query 获取）
      const ticket = ctx.get('x-app-ticket') || ctx.query.ticket;
      if (!ticket || typeof ticket !== 'string') {
        ctx.status = 401;
        ctx.body = { code: 401, message: '未提供 ticket，请先获取 ticket' };
        return;
      }

      // 验证 ticket
      const validation = await ctx.service.ragTicketService.validateTicket(ticket, appIdNum);
      if (!validation.valid) {
        ctx.status = 401;
        ctx.body = { code: 401, message: `ticket 验证失败: ${validation.reason}` };
        return;
      }

      if (!action) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'action 为必填字段' };
        return;
      }

      const operatorIdNum = parseInt(operatorId, 10);
      if (!operatorIdNum || Number.isNaN(operatorIdNum)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'operatorId 为必填且必须是数字' };
        return;
      }

      if (!operatorName) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'operatorName 为必填字段' };
        return;
      }

      const log = await ctx.service.mobileAppLogService.createLog({
        appId: appIdNum,
        versionId: versionId ? Number(versionId) : null,
        action,
        actionDetail,
        resultStatus,
        extraData,
        operatorId: operatorIdNum,
        operatorName,
        clientIp: ctx.ip,
      });

      ctx.body = {
        code: 200,
        message: '记录成功',
        data: ctx.app.utils.case.toCamelCaseKeys(log),
      };
    } catch (error) {
      ctx.logger.error('客户端创建应用操作日志失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '创建应用操作日志失败',
        error: error.message,
      };
    }
  }

  /**
   * 获取某应用某平台最新版本（按 versionCode 最大值）
   * GET /api/mobile/client/apps/:appId/latest-version?versionType=1&ticket=<ticket>
   * Header: X-App-Ticket: <ticket> 或 Query: ?ticket=<ticket>
   * 说明：移动端使用 ticket 访问此接口
   */
  async getLatestVersion() {
    const { ctx } = this;
    try {
      const { appId } = ctx.params;
      const { versionType } = ctx.query;

      const appIdNum = parseInt(appId, 10);
      if (!appIdNum || Number.isNaN(appIdNum)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'appId 为必填且必须是数字' };
        return;
      }

      // 提取 ticket（优先从 Header 获取，其次从 Query 获取）
      const ticket = ctx.get('x-app-ticket') || ctx.query.ticket;
      if (!ticket || typeof ticket !== 'string') {
        ctx.status = 401;
        ctx.body = { code: 401, message: '未提供 ticket，请先获取 ticket' };
        return;
      }

      // 验证 ticket
      const validation = await ctx.service.ragTicketService.validateTicket(ticket, appIdNum);
      if (!validation.valid) {
        ctx.status = 401;
        ctx.body = { code: 401, message: `ticket 验证失败: ${validation.reason}` };
        return;
      }

      if (versionType === undefined || versionType === null || versionType === '') {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'versionType 为必填参数' };
        return;
      }

      const versionTypeNum = parseInt(versionType, 10);
      if (!versionTypeNum || Number.isNaN(versionTypeNum)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'versionType 必须是数字' };
        return;
      }

      const latest = await ctx.service.mobileVersionService.getLatestByAppAndType(appIdNum, versionTypeNum);
      if (!latest) {
        ctx.status = 404;
        ctx.body = { code: 404, message: '未找到对应平台的版本信息' };
        return;
      }

      ctx.body = {
        code: 200,
        message: 'success',
        data: ctx.app.utils.case.toCamelCaseKeys(latest),
      };
    } catch (error) {
      ctx.logger.error('客户端获取最新版本失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '获取最新版本失败',
        error: error.message,
      };
    }
  }

  /**
   * 移动端 RAG 问答（使用 ticket 验证）
   * POST /api/mobile/client/rag/ask/:appId
   * Header: X-App-Ticket: <ticket> 或 Query: ?ticket=<ticket>
   * Body: { question, stream?: boolean }
   * 说明：移动端用户使用 ticket 访问 ask 接口，暂不支持会话管理
   */
  async askRag() {
    const { ctx } = this;
    try {
      const appId = Number(ctx.params.appId);
      const { question, stream: bodyStream } = ctx.request.body || {};
      const queryStream = ctx.query.stream;

      // 验证 appId
      if (!appId || !Number.isFinite(appId)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'appId 参数无效' };
        return;
      }

      // 验证 question
      if (!question || typeof question !== 'string' || question.trim().length === 0) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'question 不能为空' };
        return;
      }

      // 提取 ticket（优先从 Header 获取，其次从 Query 获取）
      const ticket = ctx.get('x-app-ticket') || ctx.query.ticket;
      if (!ticket || typeof ticket !== 'string') {
        ctx.status = 401;
        ctx.body = { code: 401, message: '未提供 ticket，请先获取 ticket' };
        return;
      }

      // 验证 ticket
      const validation = await ctx.service.ragTicketService.validateTicket(ticket, appId);
      if (!validation.valid) {
        ctx.status = 401;
        ctx.body = { code: 401, message: `ticket 验证失败: ${validation.reason}` };
        return;
      }

      const q = question.trim();
      const isStream = bodyStream === true || bodyStream === '1' || queryStream === '1' || queryStream === 'true';

      // 非流式：直接返回 RAG 结果（不传 sessionId，不做会话管理）
      if (!isStream) {
        const result = await ctx.service.langchain.ragService.ask(appId, q, {
          sessionId: null, // 移动端暂不支持会话管理
        });

        ctx.body = { code: 200, message: 'success', data: result };
        return;
      }

      // 流式输出：真正流式，边生成边推送
      ctx.set('Content-Type', 'text/event-stream; charset=utf-8');
      ctx.set('Cache-Control', 'no-cache');
      ctx.set('Connection', 'keep-alive');
      ctx.status = 200;
      ctx.respond = false;

      const res = ctx.res;

      // 写入一个帮助函数
      const writeEvent = (event, data) => {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      // 先发送一个握手事件
      writeEvent('ready', { message: 'stream start' });

      // 调用流式问答服务（不传 sessionId，不做会话管理）
      const result = await ctx.service.langchain.ragService.askStream(
        appId,
        q,
        {
          sessionId: null, // 移动端暂不支持会话管理
        },
        chunk => {
          const { delta, done } = chunk || {};
          // 只要有内容就推送
          if (delta && delta.length > 0) {
            writeEvent('answer', {
              delta,
              done: false,
            });
          }
        }
      );

      // 发送结束事件，附带 meta 信息
      writeEvent('end', {
        done: true,
        responseTime: result.responseTime || 0,
        usage: result.usage || {},
      });

      res.end();
    } catch (error) {
      ctx.logger.error('移动端 RAG 问答失败:', error);
      
      // 如果是流式返回，通过流式返回错误
      if (ctx.respond === false) {
        const res = ctx.res;
        res.write(`event: error\n`);
        res.write(`data: ${JSON.stringify({ message: 'RAG 问答失败', error: error.message })}\n\n`);
        res.end();
      } else {
        ctx.status = 500;
        ctx.body = { code: 500, message: 'RAG 问答失败', error: error.message };
      }
    }
  }
}

module.exports = ClientController;


