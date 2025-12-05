'use strict';

const Controller = require('egg').Controller;
const { PermissionUtil, USER_LEVEL } = require('../utils/permission');

class LogController extends Controller {
  /**
   * 插入用户操作日志（仅超级管理员可用）
   * POST /api/user/logs
   * body: { operate: '操作描述' }
   */
  async createLog() {
    const { ctx } = this;
    try {
      // 仅超级管理员可插入日志
      if (!PermissionUtil.requireSuperAdmin(ctx, '仅超级管理员可插入日志')) {
        return;
      }

      const operate = (ctx.request.body && ctx.request.body.operate) || '';
      if (!operate) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'operate不能为空' };
        return;
      }
      const ok = await ctx.service.logService.createUserOperateLog({
        userGuid: ctx.auth.userId,
        userName: ctx.auth.username,
        operate,
      });
      ctx.body = { code: 200, message: ok ? '插入成功' : '未插入' };
    } catch (error) {
      ctx.logger.error('插入用户日志失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '插入用户日志失败', error: error.message };
    }
  }

  /**
   * 查看当前用户的操作日志（分页）
   * GET /api/user/logs?page=1&pageSize=10
   */
  async listLogs() {
    const { ctx } = this;
    try {
      const { page = 1, pageSize = 10, userGuid } = ctx.query;
      const isAdmin = PermissionUtil.isSuperAdmin(ctx.auth.userLev);
      const targetUserGuid = isAdmin ? (userGuid ? parseInt(userGuid) : undefined) : ctx.auth.userId;
      const result = await ctx.service.logService.getUserLogs(targetUserGuid, parseInt(page), parseInt(pageSize));
      const data = {
        ...result,
        list: ctx.app.utils.case.toCamelCaseKeys(result.list),
      };
      ctx.body = { code: 200, message: 'success', data };
    } catch (error) {
      ctx.logger.error('获取用户日志失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '获取用户日志失败', error: error.message };
    }
  }

  /**
   * 删除/批量删除日志
   * DELETE /api/user/logs
   * Body: { logIds: [1,2,3] }
   * 仅管理员（1级）可删除日志；普通用户（2/3级）无权删除
   */
  async deleteLog() {
    const { ctx } = this;
    try {
      if (!PermissionUtil.requireSuperAdmin(ctx, '仅管理员可删除日志')) {
        return;
      }

      const { logIds, logId } = ctx.request.body || {};
      let ids = Array.isArray(logIds) ? logIds : [];

      if ((!ids || ids.length === 0) && (logId !== undefined && logId !== null)) {
        ids = [logId];
      }

      if (!Array.isArray(ids) || ids.length === 0) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'logIds 必须是非空数组' };
        return;
      }

      const validIds = [...new Set(ids)]
        .map(id => parseInt(id, 10))
        .filter(id => !Number.isNaN(id) && id > 0);

      if (validIds.length === 0) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '缺少有效的日志ID' };
        return;
      }

      const deletedCount = await ctx.service.logService.deleteLogs(validIds);
      if (!deletedCount) {
        ctx.status = 404;
        ctx.body = { code: 404, message: '未找到可删除的日志' };
        return;
      }

      ctx.body = { code: 200, message: '删除成功', data: { deletedCount } };
    } catch (error) {
      ctx.logger.error('删除日志失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '删除日志失败', error: error.message };
    }
  }
}

module.exports = LogController;


