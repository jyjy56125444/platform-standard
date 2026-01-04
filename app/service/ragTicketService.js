'use strict';

const Service = require('egg').Service;
const crypto = require('crypto');

/**
 * App Ticket 服务
 * 管理移动端访问应用接口的凭据
 * 
 * 设计说明：
 * - Redis 作为主要存储，key = app_ticket:{ticket}, value = {appId, appUserId}, TTL = 过期时间
 * - MySQL 仅用于统计和审计，不参与验证逻辑
 * - ticket 的有效性和过期完全由 Redis TTL 管理
 * - 每个 app 的每个用户（appUserId）都有独立的 ticket
 * - appUserId 可以是 UUID（字符串）或 int（数字）形式，统一转换为字符串存储
 */
class RagTicketService extends Service {
  /**
   * 生成签名密钥（基于 appId + appUserId + 全局盐值）
   * @param {Number} appId - 应用ID
   * @param {String} appUserId - 应用用户ID
   * @returns {String} 签名密钥
   */
  getSignKey(appId, appUserId) {
    const { ctx } = this;
    const secret = ctx.app.config.ragTicket?.signSecret || '';
    // 使用 appId + appUserId + 盐值生成密钥，确保不同 app 和不同用户的签名不同
    return `${appId}_${appUserId}_${secret}`;
  }

  /**
   * 生成 HMAC 签名（用于握手协议）
   * @param {Number} appId - 应用ID
   * @param {String} appUserId - 应用用户ID
   * @returns {String} HMAC-SHA256 签名（hex 格式）
   */
  generateSignature(appId, appUserId) {
    const signKey = this.getSignKey(appId, appUserId);
    // 签名内容：appId + appUserId
    const signContent = `${appId}_${appUserId}`;
    // 使用 HMAC-SHA256 生成签名
    const hmac = crypto.createHmac('sha256', signKey);
    hmac.update(signContent);
    return hmac.digest('hex');
  }

  /**
   * 验证签名（用于握手协议）
   * @param {Number} appId - 应用ID
   * @param {String} appUserId - 应用用户ID
   * @param {String} signature - 客户端提供的签名
   * @returns {Object} { valid: boolean, reason?: string }
   */
  validateSignature(appId, appUserId, signature) {
    // 生成服务端签名（使用 appId + appUserId + 盐值）
    const serverSignature = this.generateSignature(appId, appUserId);

    // 3. 比对签名（使用时间安全比较，防止时序攻击）
    // 注意：timingSafeEqual 要求两个 Buffer 长度相同，否则会抛出异常
    const serverSigBuffer = Buffer.from(serverSignature, 'hex');
    const clientSigBuffer = Buffer.from(signature, 'hex');

    if (serverSigBuffer.length !== clientSigBuffer.length) {
      return {
        valid: false,
        reason: '签名长度不匹配，请检查签名算法是否正确',
      };
    }

    if (!crypto.timingSafeEqual(serverSigBuffer, clientSigBuffer)) {
      return {
        valid: false,
        reason: '签名验证失败，请检查签名算法和密钥是否正确',
      };
    }

    return { valid: true };
  }

  /**
   * 生成唯一的 ticket 字符串
   * @returns {String} ticket
   */
  generateTicket() {
    // 生成 32 位随机字符串，前缀 app_ticket_
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return `app_ticket_${randomBytes}`;
  }

  /**
   * 获取 Redis Key
   * @param {String} ticket - ticket 字符串
   * @returns {String} Redis Key
   */
  getRedisKey(ticket) {
    return `app_ticket:${ticket}`;
  }

  /**
   * 查找有效的 ticket（通过 appId + appUserId）
   * 用于获取 ticket 时检查是否已存在未过期的 ticket
   * @param {Number} appId - 应用ID
   * @param {String} appUserId - 应用用户ID（字符串形式，可以是 UUID 或 int 转换的字符串）
   * @returns {Promise<String|null>} ticket 字符串，如果不存在则返回 null
   */
  async findValidTicket(appId, appUserId) {
    const { ctx } = this;

    // 从 MySQL 查询最近创建的 ticket（用于复用检查，按用户区分）
    const ticket = await ctx.app.mysql.get('mobile_app_ticket', {
      APP_ID: appId,
      APP_USER_ID: appUserId,
    }, {
      orders: [['CREATE_TIME', 'desc']], // 按创建时间倒序
    });

    if (!ticket) {
      return null;
    }

    // 检查 Redis 中是否存在（如果存在说明未过期）
    const redisKey = this.getRedisKey(ticket.TICKET);
    try {
      const exists = await ctx.app.redis.exists(redisKey);
      if (exists) {
        return ticket.TICKET;
      }
    } catch (error) {
      ctx.logger.warn('Redis 查询失败:', error.message);
      // Redis 失败时，无法确定是否过期，返回 null（重新生成）
      return null;
    }

    return null;
  }

  /**
   * 使同一用户（appId + appUserId）的其他 ticket 失效（删除 Redis 中的 key）
   * @param {Number} appId - 应用ID
   * @param {String} appUserId - 应用用户ID（字符串形式）
   * @returns {Promise<Number>} 删除的 Redis key 数量
   */
  async invalidateOldTickets(appId, appUserId) {
    const { ctx } = this;

    // 查询需要失效的 ticket 列表（只查询同一用户的旧 ticket）
    const oldTickets = await ctx.app.mysql.select('mobile_app_ticket', {
      where: {
        APP_ID: appId,
        APP_USER_ID: appUserId,
      },
      columns: ['TICKET'],
      orders: [['CREATE_TIME', 'desc']],
    });

    if (!oldTickets || oldTickets.length === 0) {
      return 0;
    }

    // 删除 Redis 中的 key（使旧 ticket 失效）
    const redisKeys = oldTickets.map(t => this.getRedisKey(t.TICKET));
    let deletedCount = 0;

    try {
      if (redisKeys.length > 0) {
        deletedCount = await ctx.app.redis.del(...redisKeys);
      }
    } catch (error) {
      ctx.logger.warn('Redis 删除失败:', error.message);
    }

    return deletedCount;
  }

  /**
   * 保存新的 ticket（写入 Redis 和 MySQL）
   * @param {Object} ticketData - ticket 数据
   * @param {Number} expireSeconds - 过期时间（秒）
   * @returns {Promise<Object>} { ticket, expireTime, expiresIn }
   */
  async saveTicket(ticketData, expireSeconds) {
    const { ctx } = this;

    // 1. 写入 MySQL（用于统计和审计）
    const ticketRow = {
      APP_ID: ticketData.appId,
      APP_USER_ID: ticketData.appUserId, // appUserId 统一转换为字符串存储
      PLATFORM_NAME: '', // 数据库字段保留，但不再使用，使用空字符串作为默认值
      TICKET: ticketData.ticket,
      CLIENT_IP: ticketData.clientIp || null,
    };

    try {
      await ctx.app.mysql.insert('mobile_app_ticket', ticketRow);
    } catch (error) {
      ctx.logger.warn('MySQL 写入失败（不影响主流程）:', error.message);
      // MySQL 失败不影响主流程，继续写入 Redis
    }

    // 2. 写入 Redis（主要存储，设置 TTL，包含用户信息）
    const redisKey = this.getRedisKey(ticketData.ticket);
    const redisValue = JSON.stringify({
      appId: ticketData.appId,
      appUserId: ticketData.appUserId, // appUserId 统一转换为字符串存储
    });

    try {
      await ctx.app.redis.setex(redisKey, expireSeconds, redisValue);
    } catch (error) {
      ctx.logger.error('Redis 写入失败:', error.message);
      throw new Error('保存 ticket 失败');
    }

    const now = new Date();
    const expireTime = new Date(now.getTime() + expireSeconds * 1000);

    return {
      ticket: ticketData.ticket,
      expireTime: expireTime.toISOString().replace('T', ' ').substring(0, 19),
      expiresIn: expireSeconds,
    };
  }

  /**
   * 验证 ticket 是否有效
   * @param {String} ticket - ticket 字符串
   * @param {Number} appId - 应用ID
   * @returns {Promise<Object>} { valid: boolean, reason?: string }
   */
  async validateTicket(ticket, appId) {
    const { ctx } = this;
    const redisKey = this.getRedisKey(ticket);

    // 1. 查询 Redis（如果不存在或已过期，Redis 会自动返回 null）
    let cached;
    try {
      cached = await ctx.app.redis.get(redisKey);
    } catch (error) {
      ctx.logger.error('Redis 查询失败:', error.message);
      // Redis 是主要存储，失败时直接返回失败（MySQL 仅用于审计，无法验证过期时间）
      return { valid: false, reason: 'ticket验证服务异常，请稍后重试' };
    }

    // 2. 如果 Redis 中不存在，说明 ticket 不存在或已过期
    if (!cached) {
      return { valid: false, reason: 'ticket不存在或已过期' };
    }

    // 3. 解析 Redis value，验证 appId 是否匹配
    let data;
    try {
      data = JSON.parse(cached);
    } catch (error) {
      ctx.logger.error('Redis value 解析失败:', error.message);
      return { valid: false, reason: 'ticket数据格式错误' };
    }

    if (!data.appId || data.appId !== appId) {
      return { valid: false, reason: 'appId不匹配' };
    }

    return { valid: true };
  }

  /**
   * 获取 ticket（如果存在未过期的则返回，否则生成新的）
   * @param {Number} appId - 应用ID
   * @param {String} appUserId - 应用用户ID（字符串形式，可以是 UUID 或 int 转换的字符串）
   * @param {String} clientIp - 客户端IP
   * @param {Number} expireSeconds - 过期时间（秒），默认 7200（2小时）
   * @returns {Promise<Object>} { ticket, expireTime, expiresIn }
   */
  async obtainTicket(appId, appUserId, clientIp, expireSeconds = 7200) {
    const { ctx } = this;

    // 1. 查询是否存在未过期的有效 ticket（按用户区分）
    const existingTicket = await this.findValidTicket(appId, appUserId);

    if (existingTicket) {
      // 存在未过期的 ticket，返回现有 ticket 的剩余过期时间
      const redisKey = this.getRedisKey(existingTicket);
      try {
        const ttl = await ctx.app.redis.ttl(redisKey);
        if (ttl > 0) {
          const now = new Date();
          const expireTime = new Date(now.getTime() + ttl * 1000);
          return {
            ticket: existingTicket,
            expireTime: expireTime.toISOString().replace('T', ' ').substring(0, 19),
            expiresIn: ttl,
          };
        }
      } catch (error) {
        ctx.logger.warn('Redis TTL 查询失败:', error.message);
        // 如果查询失败，继续生成新 ticket
      }
    }

    // 2. 需要生成新 ticket
    // 先将同一用户的其他 ticket 从 Redis 中删除（使旧 ticket 失效）
    await this.invalidateOldTickets(appId, appUserId);

    // 3. 生成新 ticket
    const ticket = this.generateTicket();

    const result = await this.saveTicket({
      appId,
      appUserId,
      ticket,
      clientIp,
    }, expireSeconds);

    return result;
  }

  /**
   * 验证应用是否存在
   * @param {Number} appId - 应用ID
   * @returns {Promise<Boolean>} 应用是否存在
   */
  async validateApp(appId) {
    const { ctx } = this;

    const app = await ctx.app.mysql.get('mobile_app', {
      APP_ID: appId,
    });

    return !!app;
  }
}

module.exports = RagTicketService;
