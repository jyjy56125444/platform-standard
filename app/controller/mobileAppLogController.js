'use strict';

const Controller = require('egg').Controller;
const { PermissionUtil } = require('../utils/permission');

class MobileAppLogController extends Controller {
  /**
   * 获取应用操作日志列表
   * GET /api/mobile/apps/:appId/logs
   */
  async list() {
    const { ctx } = this;
    try {
      const { appId } = ctx.params;
      const { versionId, page = 1, pageSize = 20 } = ctx.query;
      const appIdNum = parseInt(appId, 10);

      if (!appIdNum || Number.isNaN(appIdNum)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '无效的应用ID' };
        return;
      }

      if (!(await PermissionUtil.hasAppAccess(ctx, appIdNum))) {
        return;
      }

      const result = await ctx.service.mobileAppLogService.listLogs(appIdNum, {
        versionId: versionId ? Number(versionId) : null,
        page,
        pageSize,
      });

      ctx.body = {
        code: 200,
        message: '获取成功',
        data: {
          ...result,
          list: result.list.map(item => ctx.app.utils.case.toCamelCaseKeys(item)),
        },
      };
    } catch (error) {
      ctx.logger.error('获取应用操作日志失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '获取应用操作日志失败',
        error: error.message,
      };
    }
  }

  /**
   * 删除日志（单个/批量）
   * DELETE /api/mobile/apps/:appId/logs
   * Body: { logIds: [1, 2, 3] }
   * 仅对该应用拥有维护权限的用户（hasAppAccess 校验通过）才可删除日志
   */
  async delete() {
    const { ctx } = this;
    try {
      const { appId } = ctx.params;
      const { logIds } = ctx.request.body;
      const appIdNum = parseInt(appId, 10);

      if (!appIdNum || Number.isNaN(appIdNum)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '无效的应用ID' };
        return;
      }

      if (!Array.isArray(logIds) || logIds.length === 0) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'logIds 必须是非空数组' };
        return;
      }

      if (!(await PermissionUtil.hasAppAccess(ctx, appIdNum))) {
        return;
      }

      const deletedCount = await ctx.service.mobileAppLogService.deleteLogs(appIdNum, logIds);
      
      if (deletedCount === 0) {
        ctx.status = 404;
        ctx.body = { code: 404, message: '没有找到可删除的日志' };
        return;
      }

      ctx.body = {
        code: 200,
        message: '删除成功',
        data: { deletedCount },
      };
    } catch (error) {
      ctx.logger.error('删除应用操作日志失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '删除应用操作日志失败',
        error: error.message,
      };
    }
  }
}

module.exports = MobileAppLogController;


