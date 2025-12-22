'use strict';

const Controller = require('egg').Controller;
const { PermissionUtil, USER_LEVEL } = require('../../utils/permission');

/**
 * RAG 会话管理控制器
 * 提供会话创建、查询等接口
 */
class RAGSessionController extends Controller {
  /**
   * 创建 RAG 会话
   * POST /api/rag/sessions/:appId
   * Body: { title?: string }
   */
  async createSession() {
    const { ctx } = this;
    try {
      const appId = Number(ctx.params.appId);
      const { title } = ctx.request.body || {};

      if (!appId || !Number.isFinite(appId)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'appId 参数无效' };
        return;
      }

      const sessionId = await ctx.service.langchain.ragSessionService.createSession(appId, title || '新会话');

      ctx.body = {
        code: 200,
        message: 'success',
        data: { sessionId },
      };
    } catch (error) {
      ctx.logger.error('创建 RAG 会话失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '创建 RAG 会话失败', error: error.message };
    }
  }

  /**
   * 获取会话列表（支持分页）
   * GET /api/rag/sessions/:appId
   * Query: { page?, pageSize?, userId?, status?, startTime?, endTime? }
   * 权限：admin 可以获取其他用户的会话，普通用户只能获取自己的会话
   */
  async getSessions() {
    const { ctx } = this;
    try {
      const appId = Number(ctx.params.appId);
      if (!appId || !Number.isFinite(appId)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'appId 参数无效' };
        return;
      }

      const {
        page,
        pageSize,
        userId: queryUserId,
        status,
        startTime,
        endTime,
      } = ctx.query;

      // 权限判断：只有超级管理员可以查询其他用户的会话
      const isSuperAdmin = PermissionUtil.isSuperAdmin(ctx.auth?.userLev);
      const currentUserId = ctx.auth?.userId;

      // 管理员：使用传入的 userId（没传则使用当前用户 id）；非管理员：使用当前用户 id
      const finalUserId = isSuperAdmin && queryUserId ? Number(queryUserId) : Number(currentUserId);

      const options = {
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        userId: finalUserId,
        status: status !== undefined && status !== null && status !== '' ? Number(status) : undefined,
        startTime,
        endTime,
      };

      const result = await ctx.service.langchain.ragSessionService.getSessions(appId, options);
      ctx.body = { code: 200, message: 'success', data: result };
    } catch (error) {
      ctx.logger.error('获取会话列表失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '获取会话列表失败', error: error.message };
    }
  }

  /**
   * 获取会话消息列表（支持分页）
   * GET /api/rag/sessions/:appId/:sessionId/messages
   * Query: { page?, pageSize?, role? }
   * 权限：管理员可以获取任何会话的消息，普通用户只能获取自己的会话消息
   */
  async getSessionMessages() {
    const { ctx } = this;
    try {
      const appId = Number(ctx.params.appId);
      const sessionId = Number(ctx.params.sessionId);

      if (!appId || !Number.isFinite(appId)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'appId 参数无效' };
        return;
      }
      if (!sessionId || !Number.isFinite(sessionId)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'sessionId 参数无效' };
        return;
      }

      // 权限校验：先获取会话信息，检查用户是否有权限访问
      const session = await ctx.service.langchain.ragSessionService.getSession(sessionId);
      if (!session) {
        ctx.status = 404;
        ctx.body = { code: 404, message: '会话不存在' };
        return;
      }

      // 检查会话是否属于当前应用
      if (session.appId !== appId) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '会话不属于该应用' };
        return;
      }

      // 权限判断：只有管理员可以访问其他用户的会话
      const isSuperAdmin = PermissionUtil.isSuperAdmin(ctx.auth?.userLev);
      const currentUserId = Number(ctx.auth?.userId);

      if (!isSuperAdmin && Number(session.userId) !== currentUserId) {
        ctx.status = 403;
        ctx.body = { code: 403, message: '无权访问该会话的消息' };
        return;
      }

      const {
        page,
        pageSize,
        role,
      } = ctx.query;

      const options = {
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        role: role === 'user' || role === 'assistant' ? role : undefined,
      };

      const result = await ctx.service.langchain.ragSessionService.getSessionMessages(sessionId, options);
      ctx.body = { code: 200, message: 'success', data: result };
    } catch (error) {
      ctx.logger.error('获取会话消息列表失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '获取会话消息列表失败', error: error.message };
    }
  }

  /**
   * 删除会话（级联删除所有消息）
   * DELETE /api/rag/sessions/:appId/:sessionId
   * 权限：管理员可以删除任何会话，普通用户只能删除自己的会话
   */
  async deleteSession() {
    const { ctx } = this;
    try {
      const appId = Number(ctx.params.appId);
      const sessionId = Number(ctx.params.sessionId);

      if (!appId || !Number.isFinite(appId)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'appId 参数无效' };
        return;
      }
      if (!sessionId || !Number.isFinite(sessionId)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'sessionId 参数无效' };
        return;
      }

      // 权限校验：先获取会话信息，检查用户是否有权限删除
      const session = await ctx.service.langchain.ragSessionService.getSession(sessionId);
      if (!session) {
        ctx.status = 404;
        ctx.body = { code: 404, message: '会话不存在' };
        return;
      }

      // 检查会话是否属于当前应用
      if (session.appId !== appId) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '会话不属于该应用' };
        return;
      }

      // 权限判断：只有管理员可以删除其他用户的会话
      const isSuperAdmin = PermissionUtil.isSuperAdmin(ctx.auth?.userLev);
      const currentUserId = Number(ctx.auth?.userId);

      if (!isSuperAdmin && Number(session.userId) !== currentUserId) {
        ctx.status = 403;
        ctx.body = { code: 403, message: '无权删除该会话' };
        return;
      }

      // 删除会话（级联删除所有消息）
      const success = await ctx.service.langchain.ragSessionService.deleteSession(sessionId);
      if (!success) {
        ctx.status = 500;
        ctx.body = { code: 500, message: '删除会话失败' };
        return;
      }

      ctx.body = { code: 200, message: 'success', data: { sessionId } };
    } catch (error) {
      ctx.logger.error('删除会话失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '删除会话失败', error: error.message };
    }
  }
}

module.exports = RAGSessionController;

