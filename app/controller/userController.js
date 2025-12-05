'use strict';

const Controller = require('egg').Controller;
const { PermissionUtil, USER_LEVEL } = require('../utils/permission');

class UserController extends Controller {
  // 获取用户列表（当前基于 Sequelize 的 users 表）
  async users() {
    const { ctx } = this;
    try {
      const { page = 1, pageSize = 10 } = ctx.query;
      const result = await ctx.service.userService.getList(parseInt(page), parseInt(pageSize));
      const data = {
        ...result,
        list: ctx.app.utils.case.toCamelCaseKeys(result.list),
      };
      ctx.body = {
        code: 200,
        message: 'success',
        data,
      };
    } catch (error) {
      ctx.logger.error('获取用户列表失败:', error);
      ctx.body = {
        code: 500,
        message: '服务器错误',
        error: error.message,
      };
    }
  }

  /**
   * 创建用户（仅超级管理员可操作）
   * POST /api/users
   */
  async createUser() {
    const { ctx } = this;
    try {
      // 权限检查：仅超级管理员可以创建用户
      if (!PermissionUtil.requireSuperAdmin(ctx)) {
        return;
      }

      // 接收驼峰格式参数
      const { userName, userEmail, password, userRealName, userLev } = ctx.request.body;

      // 必填字段校验（包含 userLev 有效性校验）
      if (!userName || !userEmail || !password || userLev === undefined || userLev === null || !PermissionUtil.isValidLevel(userLev)) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '用户名、邮箱、密码和用户级别不能为空，且用户级别有效值为：1-超级管理员，2-开发人员，3-访客',
        };
        return;
      } 

      // 转换为 service 层需要的格式
      const user = await ctx.service.userService.create({
        username: userName,
        email: userEmail,
        password, // 实际项目中应加密
        userRealName,
        userLev,
      });

      // 使用 case 工具统一转换字段名为驼峰命名（敏感字段已在 service 层移除）
      const safeUser = ctx.app.utils.case.toCamelCaseKeys(user);

      ctx.body = {
        code: 200,
        message: '用户创建成功',
        data: safeUser,
      };
    } catch (error) {
      ctx.logger.error('创建用户失败:', error);
      
      // 处理唯一约束错误（用户名重复）
      if (error.message && error.message.includes('Duplicate entry')) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '用户名已存在',
        };
        return;
      }

      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '创建用户失败',
        error: error.message,
      };
    }
  }

  

  /**
   * 更新用户信息
   * PUT /api/users/:id
   * 仅允许更新：USER_REAL_NAME, USER_EMAIL, USER_MOBILE, USER_STATUS
   * 权限：级别1可以修改所有用户，级别2、3只能修改自己的信息
   */
  async updateUser() {
    const { ctx } = this;
    try {
      const { id } = ctx.params;
      const userId = parseInt(id, 10);
      if (!userId || Number.isNaN(userId)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '无效的用户ID' };
        return;
      }

      const userLev = ctx.auth.userLev;
      const currentUserId = ctx.auth.userId;

      // 权限检查：级别1可以修改所有用户，级别2、3只能修改自己的信息
      if (userLev !== USER_LEVEL.SUPER_ADMIN && userId !== currentUserId) {
        ctx.status = 403;
        ctx.body = { code: 403, message: '只能修改自己的信息' };
        return;
      }

      // 接收驼峰格式参数
      const { userRealName, email, mobile, userStatus } = ctx.request.body;

      // 构建更新数据（只包含有值的字段）
      const updateData = {};
      if (userRealName !== undefined) updateData.userRealName = userRealName;
      if (email !== undefined) updateData.email = email;
      if (mobile !== undefined) updateData.mobile = mobile;
      // 只有级别1可以修改用户状态，非管理员传递此字段时静默忽略
      if (userStatus !== undefined && userLev === USER_LEVEL.SUPER_ADMIN) {
        updateData.userStatus = userStatus;
      }

      // 如果没有需要更新的字段
      if (Object.keys(updateData).length === 0) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '至少需要提供一个要更新的字段' };
        return;
      }

      // 检查用户是否存在
      const existingUser = await ctx.service.userService.findById(userId);
      if (!existingUser) {
        ctx.status = 404;
        ctx.body = { code: 404, message: '用户不存在' };
        return;
      }

      // 更新用户信息
      const user = await ctx.service.userService.updateBasicInfo(userId, updateData);

      // 使用 case 工具统一转换字段名为驼峰命名
      const safeUser = ctx.app.utils.case.toCamelCaseKeys(user);

      ctx.body = {
        code: 200,
        message: '更新成功',
        data: safeUser,
      };
    } catch (error) {
      ctx.logger.error('更新用户信息失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '更新用户信息失败',
        error: error.message,
      };
    }
  }

  /**
   * 查询用户详情
   * GET /api/users/:id
   * 所有用户都可以查询用户信息
   */
  async getUserDetail() {
    const { ctx } = this;
    try {
      const { id } = ctx.params;
      const userId = parseInt(id, 10);
      if (!userId || Number.isNaN(userId)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '无效的用户ID' };
        return;
      }

      const user = await ctx.service.userService.findById(userId);
      if (!user) {
        ctx.status = 404;
        ctx.body = { code: 404, message: '用户不存在' };
        return;
      }

      // 使用 case 工具统一转换字段名为驼峰命名（敏感字段已在 service 层移除）
      const safeUser = ctx.app.utils.case.toCamelCaseKeys(user);

        ctx.body = {
        code: 200,
        message: '获取成功',
        data: safeUser,
        };
    } catch (error) {
      ctx.logger.error('查询用户详情失败:', error);
        ctx.status = 500;
        ctx.body = {
          code: 500,
        message: '查询用户详情失败',
          error: error.message,
        };
    }
  }

  /**
   * 删除/批量删除用户（仅超级管理员）
   * DELETE /api/users
   * Body: { userIds: [1,2,3] }
   */
  async deleteUser() {
    const { ctx } = this;
    try {
      if (!PermissionUtil.requireSuperAdmin(ctx)) {
        return;
      }

      const { userIds, userId } = ctx.request.body || {};
      let ids = Array.isArray(userIds) ? userIds : [];
      if ((!ids || ids.length === 0) && (userId !== undefined && userId !== null)) {
        ids = [userId];
      }

      if (!Array.isArray(ids) || ids.length === 0) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'userIds 必须是非空数组' };
        return;
      }

      const validIds = [...new Set(ids)]
        .map(id => parseInt(id, 10))
        .filter(id => !Number.isNaN(id) && id > 0);

      if (validIds.length === 0) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '缺少有效的用户ID' };
        return;
      }

      const deletedCount = await ctx.service.userService.deleteUsers(validIds);
      if (!deletedCount) {
        ctx.status = 404;
        ctx.body = { code: 404, message: '未找到可删除的用户' };
        return;
      }

      ctx.body = {
        code: 200,
        message: '删除成功',
        data: { deletedCount },
      };
    } catch (error) {
      ctx.logger.error('删除用户失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '删除用户失败', error: error.message };
    }
  }
}

module.exports = UserController;
