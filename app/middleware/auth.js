'use strict';

/**
 * Token验证中间件
 * 用于保护需要登录才能访问的接口
 */
module.exports = () => {
  return async function auth(ctx, next) {
    // 不需要验证的路径（白名单）
    const whitelist = [
      '/api/login',
      '/api/refresh',
      '/api/register',
      '/',
      '/health',
    ];

    // 检查是否在白名单中
    // 说明：
    // 1）whitelist 中的固定路径不做 Token 校验；
    // 2）/public 静态资源不做校验；
    // 3）/api/mobile/client 前缀下的接口（移动端客户端专用接口）也不做平台 Token 校验。
    if (
      whitelist.includes(ctx.path) ||
      ctx.path.startsWith('/public') ||
      ctx.path.startsWith('/api/mobile/client')
    ) {
      await next();
      return;
    }

    // 提取Token
    const JwtUtil = ctx.app.utils.jwt;
    const token = JwtUtil.extractToken(ctx);

    // 如果没有Token
    if (!token) {
      ctx.status = 401;
      ctx.body = {
        code: 401,
        message: '未提供认证Token，请先登录',
      };
      return;
    }

    // 验证Token
    const decoded = JwtUtil.verifyToken(token);

    // Token无效或过期
    if (!decoded) {
      ctx.status = 401;
      ctx.body = {
        code: 401,
        message: 'Token无效或已过期，请重新登录',
      };
      return;
    }

    // 将用户信息挂载到ctx上，方便后续使用
    ctx.auth = {
      userId: decoded.USER_GUID || decoded.userId,
      username: decoded.USER_NAME || decoded.username,
      userLev: decoded.USER_LEV || decoded.userLev,
    };

    await next();
  };
};

