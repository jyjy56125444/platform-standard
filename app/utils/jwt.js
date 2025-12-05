'use strict';

const jwt = require('jsonwebtoken');

/**
 * JWT工具类
 * 用于生成和验证Token
 */
class JwtUtil {
  constructor(app) {
    this.app = app;
    // 从配置文件读取密钥，默认使用应用的key
    this.secret = app.config.jwt && app.config.jwt.secret || app.config.keys;
    // Token过期时间，默认7天
    this.expiresIn = app.config.jwt && app.config.jwt.expiresIn || '7d';
    // refreshToken 过期时间
    this.refreshExpiresIn = app.config.jwt && app.config.jwt.refreshExpiresIn || '7d';
  }

  /**
   * 生成JWT Token
   * @param {Object} payload - 要编码的数据
   * @returns {String} JWT Token
   */
  generateToken(payload) {
    const token = jwt.sign(
      payload,
      this.secret,
      {
        expiresIn: this.expiresIn,
      }
    );
    return token;
  }

  /** 生成访问令牌（与 generateToken 等价，语义化） */
  generateAccessToken(payload) {
    return this.generateToken(payload);
  }

  /** 生成刷新令牌 */
  generateRefreshToken(payload) {
    return jwt.sign(payload, this.secret, { expiresIn: this.refreshExpiresIn });
  }

  /**
   * 验证JWT Token
   * @param {String} token - 要验证的Token
   * @returns {Object|null} 解析后的payload，失败返回null
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret);
      return decoded;
    } catch (error) {
      this.app.logger.error('JWT验证失败:', error.message);
      return null;
    }
  }

  /** 验证刷新令牌 */
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret);
      return decoded;
    } catch (error) {
      this.app.logger.error('刷新Token验证失败:', error.message);
      return null;
    }
  }

  /**
   * 从请求中提取Token
   * @param {Object} ctx - Egg Context
   * @returns {String|null} Token字符串
   */
  extractToken(ctx) {
    // 从Header的Authorization字段提取
    const authHeader = ctx.request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // 兼容从header直接取token
    if (ctx.request.headers.token) {
      return ctx.request.headers.token;
    }

    // 兼容从query参数获取
    if (ctx.query.token) {
      return ctx.query.token;
    }

    return null;
  }
}

module.exports = JwtUtil;

