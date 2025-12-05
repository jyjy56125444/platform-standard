'use strict';

const Controller = require('egg').Controller;
const { PermissionUtil, APP_USER_PERMISSION, USER_LEVEL } = require('../utils/permission');
const { withLog } = require('../utils/logDecorator');

class MobileAppAccessController extends Controller {
  /**
   * 添加用户到应用权限表（添加为开发者）
   * 只有创建者(permission=1)和超级管理员可以添加用户
   * 创建者只能通过创建应用时自动添加，后续不能再增加创建者
   * POST /api/mobile/apps/:appId/users
   */
  async addUser() {
    const { ctx } = this;
    try {
      const { appId } = ctx.params;
      const appIdNum = parseInt(appId, 10);
      if (!appIdNum || Number.isNaN(appIdNum)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '无效的应用ID' };
        return;
      }

      const { userId, remark } = ctx.request.body;
      const userIdNum = parseInt(userId, 10);
      
      if (!userIdNum || Number.isNaN(userIdNum)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '无效的用户ID' };
        return;
      }

      // 只有创建者(permission=1)和超级管理员可以添加用户
      if (!(await PermissionUtil.requireCreatorOrSuperAdmin(ctx, appIdNum, '只有应用创建者或超级管理员可以添加用户'))) {
        return;
      }

      // 检查要添加的用户是否存在，并验证用户级别
      const targetUser = await ctx.service.userService.findById(userIdNum);
      if (!targetUser) {
        ctx.status = 404;
        ctx.body = { code: 404, message: '用户不存在' };
        return;
      }

      // 只能添加 USER_LEVEL 为 1（超级管理员）或 2（开发人员）的用户，访客（3）不能添加
      const userLev = targetUser.USER_LEV;
      if (userLev !== USER_LEVEL.SUPER_ADMIN && userLev !== USER_LEVEL.DEVELOPER) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '只能添加超级管理员或开发人员到应用权限，访客不能添加' };
        return;
      }

      // 统一设置为开发者权限（permission为2）
      // 创建者只能通过创建应用时自动添加，后续不能再增加创建者
      const creator = ctx.auth.username || null;
      const result = await ctx.service.mobileAppAccessService.addUser(
        appIdNum,
        userIdNum,
        creator,
        APP_USER_PERMISSION.APP_DEVELOPER,
        remark || null
      );

      ctx.body = {
        code: 200,
        message: '添加成功',
        data: ctx.app.utils.case.toCamelCaseKeys(result),
      };
    } catch (error) {
      ctx.logger.error('添加应用用户失败:', error);
      
      // 处理唯一约束错误
      if (error.message && error.message.includes('Duplicate entry')) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '该用户已拥有该应用的权限' };
        return;
      }

      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '添加应用用户失败',
        error: error.message,
      };
    }
  }

  /**
   * 从应用权限表中移除用户/批量移除用户
   * 只有创建者(permission=1)和超级管理员可以删除用户
   * DELETE /api/mobile/apps/:appId/users
   * Body: { userIds: [2002, 2003] } 或 { userId: 2002 }（兼容单个删除）
   */
  async removeUser() {
    const { ctx } = this;
    try {
      const { appId } = ctx.params;
      const appIdNum = parseInt(appId, 10);

      if (!appIdNum || Number.isNaN(appIdNum)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '无效的应用ID' };
        return;
      }

      // 只有创建者(permission=1)和超级管理员可以删除用户
      if (!(await PermissionUtil.requireCreatorOrSuperAdmin(ctx, appIdNum, '只有应用创建者或超级管理员可以删除用户'))) {
        return;
      }

      const { userIds, userId } = ctx.request.body || {};
      let ids = Array.isArray(userIds) ? userIds : [];

      // 兼容单个 userId 参数
      if ((!ids || ids.length === 0) && (userId !== undefined && userId !== null)) {
        ids = [userId];
      }

      if (!Array.isArray(ids) || ids.length === 0) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'userIds 必须是非空数组' };
        return;
      }

      // 验证并过滤有效的用户ID
      const validIds = [...new Set(ids)]
        .map(id => parseInt(id, 10))
        .filter(id => !Number.isNaN(id) && id > 0);

      if (validIds.length === 0) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '缺少有效的用户ID' };
        return;
      }

      // 检查并分类用户：创建者、开发者、不在授权表中
      const creatorIds = [];      // 应用创建者（不能删除）
      const deletableIds = [];    // 开发者（可以删除）
      const notFoundIds = [];     // 不在授权表中的用户（跳过）
      
      for (const userIdNum of validIds) {
        const targetPermission = await ctx.service.mobileAppAccessService.getUserPermission(appIdNum, userIdNum);
        if (targetPermission === null) {
          // 用户不在授权表中
          notFoundIds.push(userIdNum);
        } else if (targetPermission === APP_USER_PERMISSION.APP_CREATOR) {
          // 应用创建者，不能删除
          creatorIds.push(userIdNum);
        } else {
          // 开发者，可以删除
          deletableIds.push(userIdNum);
        }
      }

      // 如果所有用户都是创建者或不在授权表中，返回错误
      if (deletableIds.length === 0) {
        const messages = [];
        if (creatorIds.length > 0) {
          messages.push(`${creatorIds.length} 个应用创建者不能删除`);
        }
        if (notFoundIds.length > 0) {
          messages.push(`${notFoundIds.length} 个用户不在授权表中`);
        }
        ctx.status = 400;
        ctx.body = { 
          code: 400, 
          message: messages.join('，'),
          data: { 
            skippedCreatorIds: creatorIds.length > 0 ? creatorIds : undefined,
            notFoundIds: notFoundIds.length > 0 ? notFoundIds : undefined,
          }
        };
        return;
      }

      // 批量删除（只删除开发者用户）
      const deletedCount = await ctx.service.mobileAppAccessService.removeUsers(appIdNum, deletableIds);
      
      // 构建返回结果
      const result = {
        deletedCount,
        skippedCreatorIds: creatorIds.length > 0 ? creatorIds : undefined,
        notFoundIds: notFoundIds.length > 0 ? notFoundIds : undefined,
      };

      // 构建消息
      const messageParts = [];
      if (deletedCount > 0) {
        messageParts.push(`成功删除 ${deletedCount} 个用户`);
      }
      if (creatorIds.length > 0) {
        messageParts.push(`跳过 ${creatorIds.length} 个应用创建者`);
      }
      if (notFoundIds.length > 0) {
        messageParts.push(`跳过 ${notFoundIds.length} 个不在授权表中的用户`);
      }

      if (deletedCount === 0 && creatorIds.length === 0 && notFoundIds.length === 0) {
        ctx.status = 404;
        ctx.body = { code: 404, message: '未找到可删除的用户权限记录' };
      } else {
      ctx.body = {
        code: 200,
          message: messageParts.join('，'),
          data: result,
      };
      }
    } catch (error) {
      ctx.logger.error('删除应用用户失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '删除应用用户失败',
        error: error.message,
      };
    }
  }

  /**
   * 获取应用的用户权限列表
   * 所有人都可以查看
   * GET /api/mobile/apps/:appId/users
   */
  async listUsers() {
    const { ctx } = this;
    try {
      const { appId } = ctx.params;
      const appIdNum = parseInt(appId, 10);
      
      if (!appIdNum || Number.isNaN(appIdNum)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '无效的应用ID' };
        return;
      }

      const users = await ctx.service.mobileAppAccessService.listUsers(appIdNum);
      
      ctx.body = {
        code: 200,
        message: '获取成功',
        data: users.map(user => ctx.app.utils.case.toCamelCaseKeys(user)),
      };
    } catch (error) {
      ctx.logger.error('获取应用用户列表失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '获取应用用户列表失败',
        error: error.message,
      };
    }
  }

  /**
   * 获取当前用户拥有访问权限的应用列表
   * 仅返回 mobile_app 主表信息
   * GET /api/mobile/apps/users/authorized
   */
  async listAuthorizedApps() {
    const { ctx } = this;
    try {
      const userId = ctx.auth?.userId;
      if (!userId) {
        ctx.status = 401;
        ctx.body = { code: 401, message: '未登录' };
        return;
      }

      const apps = await ctx.service.mobileAppAccessService.listAuthorizedApps(userId);

      ctx.body = {
        code: 200,
        message: '获取成功',
        data: apps.map(app => ctx.app.utils.case.toCamelCaseKeys(app)),
      };
    } catch (error) {
      ctx.logger.error('获取授权应用列表失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '获取授权应用列表失败',
        error: error.message,
      };
    }
  }

  /**
   * 判断用户是否拥有指定应用的维护权限
   * 默认查询当前登录用户，可通过 userId 查询参数查询其他用户（需要权限验证）
   * GET /api/mobile/apps/:appId/access?userId=xxx（可选）
   */
  async hasAccess() {
    const { ctx } = this;
    try {
      const { appId } = ctx.params;
      const { userId } = ctx.query;
      const appIdNum = parseInt(appId, 10);
      
      if (!appIdNum || Number.isNaN(appIdNum)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '无效的应用ID' };
        return;
      }

      // 确定要查询的用户ID
      let targetUserGuid;
      if (userId) {
        // 如果指定了 userId，查询指定用户
        const userIdNum = parseInt(userId, 10);
        if (!userIdNum || Number.isNaN(userIdNum)) {
          ctx.status = 400;
          ctx.body = { code: 400, message: '无效的用户ID' };
          return;
        }
        targetUserGuid = userIdNum;
      } else {
        // 默认查询当前登录用户
        targetUserGuid = ctx.auth.userId;
        if (!targetUserGuid) {
          ctx.status = 401;
          ctx.body = { code: 401, message: '未登录' };
          return;
        }
      }

      const hasAccess = await ctx.service.mobileAppAccessService.hasAccess(appIdNum, targetUserGuid);
      
      ctx.body = {
        code: 200,
        message: '查询成功',
        data: { hasAccess },
      };
    } catch (error) {
      ctx.logger.error('查询应用访问权限失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '查询应用访问权限失败',
        error: error.message,
      };
    }
  }

  /**
   * 获取用户在应用中的权限等级
   * 默认查询当前登录用户，可通过 userId 查询参数查询其他用户
   * GET /api/mobile/apps/:appId/permission?userId=xxx（可选）
   */
  async getUserPermission() {
    const { ctx } = this;
    try {
      const { appId } = ctx.params;
      const { userId } = ctx.query;
      const appIdNum = parseInt(appId, 10);
      
      if (!appIdNum || Number.isNaN(appIdNum)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '无效的应用ID' };
        return;
      }

      // 确定要查询的用户ID
      let targetUserGuid;
      if (userId) {
        // 如果指定了 userId，查询指定用户
        const userIdNum = parseInt(userId, 10);
        if (!userIdNum || Number.isNaN(userIdNum)) {
          ctx.status = 400;
          ctx.body = { code: 400, message: '无效的用户ID' };
          return;
        }
        targetUserGuid = userIdNum;
      } else {
        // 默认查询当前登录用户
        targetUserGuid = ctx.auth.userId;
        if (!targetUserGuid) {
          ctx.status = 401;
          ctx.body = { code: 401, message: '未登录' };
          return;
        }
      }

      const permission = await ctx.service.mobileAppAccessService.getUserPermission(appIdNum, targetUserGuid);
      
      ctx.body = {
        code: 200,
        message: '查询成功',
        data: { permission },
      };
    } catch (error) {
      ctx.logger.error('查询用户权限失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '查询用户权限失败',
        error: error.message,
      };
    }
  }
}

// 使用装饰器自动记录操作日志
MobileAppAccessController.prototype.addUser = withLog(
  MobileAppAccessController.prototype.addUser,
  (ctx) => `添加应用用户：AppID=${ctx.params.appId}, UserID=${ctx.request.body.userId}`
);

MobileAppAccessController.prototype.removeUser = withLog(
  MobileAppAccessController.prototype.removeUser,
  (ctx) => `删除应用用户：AppID=${ctx.params.appId}, UserID=${ctx.params.userId}`
);

module.exports = MobileAppAccessController;

