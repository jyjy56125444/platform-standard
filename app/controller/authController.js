'use strict';

const Controller = require('egg').Controller;
const { withLog } = require('../utils/logDecorator');

class AuthController extends Controller {
  /**
   * 用户登录接口
   * POST /api/login
   * 请求体: { userName: 'test', password: '123456' }
   */
  async login() {
    const { ctx, app } = this;
    try {
      // 接收驼峰格式参数
      const { userName, password } = ctx.request.body;

      if (!userName || !password) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '用户名和密码不能为空' };
        return;
      }

      // 转换为 service 层需要的格式
      const isValid = await ctx.service.userService.validatePassword(userName, password);
      if (!isValid) {
        ctx.status = 401;
        ctx.body = { code: 401, message: '用户名或密码错误' };
        return;
      }

      const user = await ctx.service.userService.findByPlatUsername(userName);
      if (!user) {
        ctx.status = 401;
        ctx.body = { code: 401, message: '用户不存在或已被禁用' };
        return;
      }

      const jwtUtil = app.utils.jwt;
      const accessToken = jwtUtil.generateAccessToken({
        USER_GUID: user.USER_GUID,
        USER_NAME: user.USER_NAME,
        USER_REAL_NAME: user.USER_REAL_NAME,
        USER_LEV: user.USER_LEV,
      });
      const refreshToken = jwtUtil.generateRefreshToken({
        USER_GUID: user.USER_GUID,
        USER_NAME: user.USER_NAME,
        USER_LEV: user.USER_LEV,
        type: 'refresh',
      });

      const safeUser = ctx.app.utils.case.toCamelCaseKeys(user);

      ctx.body = {
        code: 200,
        message: '登录成功',
        data: {
          token: accessToken, // 仅保留一个访问令牌字段
          refreshToken,
          user: safeUser,
        },
      };
    } catch (error) {
      ctx.logger.error('登录失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '登录失败', error: error.message };
    }
  }

  /** 获取当前登录用户信息 */
  async currentUser() {
    const { ctx } = this;
    try {
      if (!ctx.auth) {
        ctx.status = 401;
        ctx.body = { code: 401, message: '未登录或Token已过期' };
        return;
      }
      ctx.body = { code: 200, message: '获取用户信息成功', data: ctx.auth };
    } catch (error) {
      ctx.logger.error('获取用户信息失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '获取用户信息失败', error: error.message };
    }
  }

  /** 用户登出接口 */
  async logout() {
    const { ctx } = this;
    try {
      ctx.body = { code: 200, message: '登出成功' };
    } catch (error) {
      ctx.logger.error('登出失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '登出失败', error: error.message };
    }
  }

  /** 刷新访问令牌 */
  async refresh() {
    const { ctx, app } = this;
    try {
      const jwtUtil = app.utils.jwt;
      // 从 Authorization Bearer 或 body.refreshToken 获取
      let token = jwtUtil.extractToken(ctx);
      if (!token && ctx.request.body && ctx.request.body.refreshToken) {
        token = ctx.request.body.refreshToken;
      }
      if (!token) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '缺少refreshToken' };
        return;
      }

      const decoded = jwtUtil.verifyRefreshToken(token);
      if (!decoded || decoded.type !== 'refresh') {
        ctx.status = 401;
        ctx.body = { code: 401, message: 'refreshToken无效或已过期' };
        return;
      }

      // 颁发新的访问令牌与新的刷新令牌（旋转）
      const accessToken = jwtUtil.generateAccessToken({
        USER_GUID: decoded.USER_GUID,
        USER_NAME: decoded.USER_NAME,
        USER_LEV: decoded.USER_LEV,
      });
      const refreshToken = jwtUtil.generateRefreshToken({
        USER_GUID: decoded.USER_GUID,
        USER_NAME: decoded.USER_NAME,
        USER_LEV: decoded.USER_LEV,
        type: 'refresh',
      });

      ctx.body = {
        code: 200,
        message: '刷新成功',
        data: {
          token: accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      ctx.logger.error('刷新令牌失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '刷新失败', error: error.message };
    }
  }
}

// 使用装饰器自动记录操作日志（类似AOP）
// 装饰器会自动从 ctx.body.data.user 中获取用户信息（登录接口特殊情况）
AuthController.prototype.login = withLog(
  AuthController.prototype.login,
  '登录'
);

module.exports = AuthController;
