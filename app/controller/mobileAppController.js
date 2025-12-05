'use strict';

const Controller = require('egg').Controller;
const { PermissionUtil, USER_LEVEL, APP_USER_PERMISSION } = require('../utils/permission');
const { arrayToBitmask, bitmaskToArray } = require('../utils/bitmask');
const { withLog } = require('../utils/logDecorator');

class MobileAppController extends Controller {
  /**
   * 获取应用列表（所有人可查看）
   * GET /api/mobile/apps
   */
  async list() {
    const { ctx } = this;
    try {
      const { page = 1, pageSize = 10 } = ctx.query;
      const result = await ctx.service.mobileAppService.getList(parseInt(page), parseInt(pageSize));
      const data = {
        ...result,
        list: result.list.map(item => {
          const camelItem = ctx.app.utils.case.toCamelCaseKeys(item);
          // 将 appType（位掩码）转换为数组形式
          if (camelItem.appType !== null && camelItem.appType !== undefined) {
            camelItem.appType = bitmaskToArray(camelItem.appType);
          }
          return {
            ...camelItem,
            info: ctx.app.utils.case.toCamelCaseKeys(item.info || {}),
          };
        }),
      };
      ctx.body = {
        code: 200,
        message: '获取成功',
        data,
      };
    } catch (error) {
      ctx.logger.error('获取应用列表失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '获取应用列表失败',
        error: error.message,
      };
    }
  }

  /**
   * 获取应用详情（所有人可查看）
   * GET /api/mobile/apps/:id
   */
  async detail() {
    const { ctx } = this;
    try {
      const { id } = ctx.params;
      const appId = parseInt(id, 10);
      if (!appId || Number.isNaN(appId)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '无效的应用ID' };
        return;
      }

      const app = await ctx.service.mobileAppService.findById(appId);
      if (!app) {
        ctx.status = 404;
        ctx.body = { code: 404, message: '应用不存在' };
        return;
      }

      const camelApp = ctx.app.utils.case.toCamelCaseKeys(app);
      // 将 appType（位掩码）转换为数组形式
      if (camelApp.appType !== null && camelApp.appType !== undefined) {
        camelApp.appType = bitmaskToArray(camelApp.appType);
      }

      const data = {
        ...camelApp,
        info: ctx.app.utils.case.toCamelCaseKeys(app.info || {}),
      };

      ctx.body = {
        code: 200,
        message: '获取成功',
        data,
      };
    } catch (error) {
      ctx.logger.error('获取应用详情失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '获取应用详情失败',
        error: error.message,
      };
    }
  }

  /**
   * 创建应用（1、2级别可以创建）
   * POST /api/mobile/apps
   */
  async create() {
    const { ctx } = this;
    try {
      // 权限检查：1、2级别可以创建
      if (!PermissionUtil.checkPermission(ctx, USER_LEVEL.DEVELOPER, '需要开发人员或更高级别权限')) {
        return;
      }

      const { appName, appFullname, appType, appIcon, developer, interfaceDeveloper, designer, remark } = ctx.request.body;

      // 必填字段校验
      if (!appName) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '应用名称不能为空' };
        return;
      }

      // 将 appType 数组转换为位掩码（如果传入的是数组）
      let appTypeMask;
      try {
        appTypeMask = arrayToBitmask(appType);
      } catch (error) {
        if (error.code === 'INVALID_PLATFORM_VALUE') {
          ctx.status = 400;
          ctx.body = { code: 400, message: error.message };
          return;
        }
        throw error;
      }

      const creator = ctx.auth.username || null;
      const userId = ctx.auth?.userId;
      const app = await ctx.service.mobileAppService.create({
        appName,
        appFullname,
        appType: appTypeMask,
        appIcon,
        developer,
        interfaceDeveloper,
        designer,
        remark,
      }, creator);

      // 创建应用后，自动将当前用户添加到应用权限表（权限为1-应用创建者）
      if (userId && app && app.APP_ID) {
        try {
          await ctx.service.mobileAppAccessService.addUser(
            app.APP_ID,
            userId,
            creator,
            APP_USER_PERMISSION.APP_CREATOR,
            '应用创建者'
          );
        } catch (error) {
          // 如果添加失败，记录日志但不影响应用创建流程
          ctx.logger.warn(`添加应用创建者到权限表失败: ${error.message}`, {
            appId: app.APP_ID,
            userId,
          });
        }
      }

      const camelApp = ctx.app.utils.case.toCamelCaseKeys(app);
      // 将 appType（位掩码）转换为数组形式
      if (camelApp.appType !== null && camelApp.appType !== undefined) {
        camelApp.appType = bitmaskToArray(camelApp.appType);
      }

      const data = {
        ...camelApp,
        info: ctx.app.utils.case.toCamelCaseKeys(app.info || {}),
      };

      ctx.body = {
        code: 200,
        message: '创建成功',
        data,
      };
    } catch (error) {
      ctx.logger.error('创建应用失败:', error);
      
      // 处理唯一约束错误
      if (error.message && error.message.includes('Duplicate entry')) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '应用名称已存在' };
        return;
      }

      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '创建应用失败',
        error: error.message,
      };
    }
  }

  /**
   * 更新应用（需要开发人员或更高级别权限）
   * 超级管理员可以更新所有应用，开发者只能更新有权限的应用
   * PUT /api/mobile/apps/:id
   */
  async update() {
    const { ctx } = this;
    try {
      const { id } = ctx.params;
      const appId = parseInt(id, 10);
      if (!appId || Number.isNaN(appId)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '无效的应用ID' };
        return;
      }

      const userName = ctx.auth.username;
      if (!(await PermissionUtil.hasAppAccess(ctx, appId))) {
        return;
      }

      const updateData = ctx.request.body;
      // 如果传入了 appType，将数组转换为位掩码
      if (updateData.appType !== undefined && updateData.appType !== null) {
        try {
          updateData.appType = arrayToBitmask(updateData.appType);
        } catch (error) {
          if (error.code === 'INVALID_PLATFORM_VALUE') {
            ctx.status = 400;
            ctx.body = { code: 400, message: error.message };
            return;
          }
          throw error;
        }
      }
      const updater = userName || null;

      const app = await ctx.service.mobileAppService.update(appId, updateData, updater);
      if (!app) {
        ctx.status = 404;
        ctx.body = { code: 404, message: '应用不存在' };
        return;
      }

      const camelApp = ctx.app.utils.case.toCamelCaseKeys(app);
      // 将 appType（位掩码）转换为数组形式
      if (camelApp.appType !== null && camelApp.appType !== undefined) {
        camelApp.appType = bitmaskToArray(camelApp.appType);
      }

      const data = {
        ...camelApp,
        info: ctx.app.utils.case.toCamelCaseKeys(app.info || {}),
      };

      ctx.body = {
        code: 200,
        message: '更新成功',
        data,
      };
    } catch (error) {
      ctx.logger.error('更新应用失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '更新应用失败',
        error: error.message,
      };
    }
  }

  /**
   * 删除应用（只有应用创建者或超级管理员可以删除）
   * DELETE /api/mobile/apps/:id
   */
  async delete() {
    const { ctx } = this;
    try {
      const { id } = ctx.params;
      const appId = parseInt(id, 10);
      if (!appId || Number.isNaN(appId)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '无效的应用ID' };
        return;
      }

      if (!(await PermissionUtil.requireCreatorOrSuperAdmin(ctx, appId, '只有应用创建者或超级管理员可以删除应用'))) {
        return;
      }

      const ok = await ctx.service.mobileAppService.delete(appId);
      if (!ok) {
        ctx.status = 404;
        ctx.body = { code: 404, message: '应用不存在或已删除' };
        return;
      }

      ctx.body = { code: 200, message: '删除成功' };
    } catch (error) {
      ctx.logger.error('删除应用失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '删除应用失败',
        error: error.message,
      };
    }
  }

}

// 使用装饰器自动记录操作日志（类似AOP）
MobileAppController.prototype.create = withLog(
  MobileAppController.prototype.create,
  (ctx) => `创建应用：${ctx.request.body.appName || '未知'}`
);

MobileAppController.prototype.update = withLog(
  MobileAppController.prototype.update,
  (ctx) => `更新应用：ID=${ctx.params.id}`
);

MobileAppController.prototype.delete = withLog(
  MobileAppController.prototype.delete,
  (ctx) => `删除应用：ID=${ctx.params.id}`
);

module.exports = MobileAppController;

