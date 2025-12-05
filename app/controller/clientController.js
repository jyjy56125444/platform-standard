'use strict';

const Controller = require('egg').Controller;

class ClientController extends Controller {
  /**
   * 客户端记录应用/版本操作日志
   * POST /api/mobile/client/logs
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
   * GET /api/mobile/client/apps/:appId/latest-version?versionType=1
   * 对移动客户端开放，无需平台登录态
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
}

module.exports = ClientController;


