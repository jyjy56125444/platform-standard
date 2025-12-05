'use strict';

const Service = require('egg').Service;

class LogService extends Service {
  /**
   * 通用：写入用户操作日志
   * @param {Object} payload
   * @param {number} payload.userGuid
   * @param {string} payload.userName
   * @param {string} payload.operate 操作描述
   * @param {string} [payload.userIp]
   */
  async createUserOperateLog(payload = {}) {
    const { ctx } = this;
    const userIp = payload.userIp || this._extractIp(ctx);
    const row = {
      USER_GUID: payload.userGuid,
      USER_NAME: payload.userName || null,
      OPERATE: payload.operate || null,
      USER_IP: userIp || null,
      // CREATE_TIME/UPDATE_TIME 由数据库默认值处理
    };
    const res = await ctx.app.mysql.insert('plat_user_log', row);
    return !!(res && res.affectedRows === 1);
  }

  _extractIp(ctx) {
    // 1) 可信代理传递的客户端链路，取第一个有效 IP
    const xf = ctx.get('x-forwarded-for');
    if (xf) {
      const first = xf.split(',').map(s => s.trim()).find(Boolean);
      if (first) return this._normalizeIp(first);
    }
    // 2) Koa 提供的 ip / request.ip
    const raw = ctx.ip || ctx.request.ip || '';
    return this._normalizeIp(raw) || null;
  }

  _normalizeIp(ip) {
    if (!ip) return ip;
    // 去除端口（形如 1.2.3.4:5678）
    const noPort = ip.includes(':') && ip.includes('.') ? ip.split(':')[0] : ip;
    // IPv6 回环地址 → 127.0.0.1
    if (noPort === '::1') return '127.0.0.1';
    // IPv4 映射到 IPv6 的形式 ::ffff:127.0.0.1 → 127.0.0.1
    if (noPort.startsWith('::ffff:')) return noPort.substring(7);
    return noPort;
  }

  /**
   * 获取某用户的操作日志（分页）
   * @param {number} userGuid
   * @param {number} page
   * @param {number} pageSize
   */
  async getUserLogs(userGuid, page = 1, pageSize = 10) {
    const { ctx } = this;
    const offset = (Number(page) - 1) * Number(pageSize);
    const where = userGuid ? { USER_GUID: userGuid } : {};
    const total = await ctx.app.mysql.count('plat_user_log', where);
    const list = await ctx.app.mysql.select('plat_user_log', {
      where,
      columns: [ 'ID', 'USER_GUID', 'USER_NAME', 'OPERATE', 'USER_IP', 'CREATE_TIME', 'UPDATE_TIME' ],
      orders: [[ 'CREATE_TIME', 'desc' ]],
      limit: Number(pageSize),
      offset,
    });
    return {
      list,
      total: Number(total) || 0,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: pageSize ? Math.ceil(total / pageSize) : 0,
    };
  }

  /** 批量删除日志（控制器已做管理员校验） */
  async deleteLogs(logIds = []) {
    const { ctx } = this;
    if (!Array.isArray(logIds) || logIds.length === 0) {
      return 0;
    }

    const validIds = [...new Set(logIds)]
      .map(id => parseInt(id, 10))
      .filter(id => !Number.isNaN(id) && id > 0);

    if (validIds.length === 0) {
      return 0;
    }

    const placeholders = validIds.map(() => '?').join(',');
    const res = await ctx.app.mysql.query(
      `DELETE FROM plat_user_log WHERE ID IN (${placeholders})`,
      validIds
    );
    return res.affectedRows || 0;
  }
}

module.exports = LogService;


