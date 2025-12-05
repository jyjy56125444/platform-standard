'use strict';

const Service = require('egg').Service;

class MobileAppLogService extends Service {
  /**
   * 创建操作日志
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  async createLog(payload) {
    const { ctx } = this;
    const row = {
      APP_ID: payload.appId,
      VERSION_ID: payload.versionId || null,
      ACTION: payload.action,
      ACTION_DETAIL: payload.actionDetail || null,
      OPERATOR_ID: payload.operatorId || null,
      OPERATOR_NAME: payload.operatorName || null,
      RESULT_STATUS: payload.resultStatus || 'success',
      CLIENT_IP: payload.clientIp || null,
      EXTRA_DATA: payload.extraData ? JSON.stringify(payload.extraData) : null,
    };

    const result = await ctx.app.mysql.insert('mobile_app_log', row);
    if (result.affectedRows !== 1) {
      throw new Error('写入操作日志失败');
    }

    return await ctx.app.mysql.get('mobile_app_log', { ID: result.insertId });
  }

  /**
   * 获取应用的操作日志
   * @param {number} appId
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async listLogs(appId, options = {}) {
    const { ctx } = this;
    const page = Number(options.page) > 0 ? Number(options.page) : 1;
    const pageSize = Number(options.pageSize) > 0 ? Number(options.pageSize) : 20;
    const offset = (page - 1) * pageSize;
    const params = [appId];
    let whereSql = 'WHERE APP_ID = ?';

    if (options.versionId) {
      whereSql += ' AND VERSION_ID = ?';
      params.push(options.versionId);
    }

    const totalResult = await ctx.app.mysql.query(
      `SELECT COUNT(1) as total FROM mobile_app_log ${whereSql}`,
      params
    );
    const total = totalResult[0]?.total || 0;

    const list = await ctx.app.mysql.query(
      `SELECT
        ID,
        VERSION_ID,
        APP_ID,
        ACTION,
        ACTION_DETAIL,
        OPERATOR_ID,
        OPERATOR_NAME,
        RESULT_STATUS,
        CLIENT_IP,
        EXTRA_DATA,
        CREATE_TIME
      FROM mobile_app_log
      ${whereSql}
      ORDER BY CREATE_TIME DESC
      LIMIT ?, ?`,
      [...params, offset, pageSize]
    );

    return {
      list,
      total: Number(total),
      page,
      pageSize,
      totalPages: pageSize ? Math.ceil(total / pageSize) : 0,
    };
  }

  /**
   * 批量删除日志
   * @param {number} appId
   * @param {number[]} logIds
   * @returns {Promise<number>} 返回成功删除的数量
   */
  async deleteLogs(appId, logIds) {
    const { ctx } = this;
    if (!Array.isArray(logIds) || logIds.length === 0) {
      return 0;
    }

    // 过滤掉无效的 ID
    const validIds = logIds
      .map(id => parseInt(id, 10))
      .filter(id => !Number.isNaN(id) && id > 0);

    if (validIds.length === 0) {
      return 0;
    }

    // 使用 IN 查询批量删除，同时确保只删除属于该应用的日志
    const placeholders = validIds.map(() => '?').join(',');
    const result = await ctx.app.mysql.query(
      `DELETE FROM mobile_app_log WHERE APP_ID = ? AND ID IN (${placeholders})`,
      [appId, ...validIds]
    );

    return result.affectedRows || 0;
  }
}

module.exports = MobileAppLogService;



