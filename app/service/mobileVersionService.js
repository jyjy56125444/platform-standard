'use strict';

const Service = require('egg').Service;

class MobileVersionService extends Service {
  async getById(id) {
    const { ctx } = this;
    return await ctx.app.mysql.get('mobile_version', { ID: id });
  }

  /**
   * 获取某应用某平台下 versionCode 最大的最新版本
   * @param {number} appId 应用ID
   * @param {number} versionType 平台类型
   * @returns {Promise<Object|null>} 最新版本记录，未找到时返回 null
   */
  async getLatestByAppAndType(appId, versionType) {
    const { ctx } = this;
    const targetAppId = Number(appId);
    const targetVersionType = Number(versionType);

    if (!targetAppId || Number.isNaN(targetAppId) || !targetVersionType || Number.isNaN(targetVersionType)) {
      return null;
    }

    const rows = await ctx.app.mysql.select('mobile_version', {
      where: {
        APP_ID: targetAppId,
        VERSION_TYPE: targetVersionType,
      },
      orders: [[ 'VERSION_CODE', 'desc' ], [ 'ID', 'desc' ]],
      limit: 1,
    });

    if (!rows || rows.length === 0) {
      return null;
    }

    return rows[0];
  }

  async listByApp(appId, { versionType, page = 1, pageSize = 10 } = {}) {
    const { ctx } = this;
    const where = { APP_ID: appId };
    if (versionType !== undefined && versionType !== null && versionType !== '') {
      where.VERSION_TYPE = Number(versionType);
    }
    const offset = (Number(page) - 1) * Number(pageSize);
    const total = await ctx.app.mysql.count('mobile_version', where);
    const list = await ctx.app.mysql.select('mobile_version', {
      where,
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

  async create(appId, data, creator) {
    const { ctx } = this;
    const vt = Number(data.versionType);
    const vc = Number(data.versionCode);

    const row = {
      APP_ID: appId,
      VERSION_TYPE: vt,
      VERSION: data.version,
      VERSION_CODE: vc,
      COMMENT: data.comment || null,
      DOWNLOAD_SIZE: data.downloadSize || null,
      DOWNLOAD_URL: data.downloadUrl || null,
      DOWNLOAD_SCAN_IMG: data.downloadScanImg || null,
      CREATOR: creator || null,
      UPDATER: creator || null,
    };

    const result = await ctx.app.mysql.insert('mobile_version', row);
    if (result.affectedRows !== 1) {
      throw new Error('插入失败');
    }
    // 返回最新记录
    const id = result.insertId;
    return await this.getById(id);
  }

  async updateById(id, data, updater) {
    const { ctx } = this;
    const existing = await this.getById(id);
    if (!existing) return null;

    const newRow = {
      VERSION: data.version !== undefined ? data.version : existing.VERSION,
      COMMENT: data.comment !== undefined ? data.comment : existing.COMMENT,
      DOWNLOAD_SIZE: data.downloadSize !== undefined ? data.downloadSize : existing.DOWNLOAD_SIZE,
      DOWNLOAD_URL: data.downloadUrl !== undefined ? data.downloadUrl : existing.DOWNLOAD_URL,
      DOWNLOAD_SCAN_IMG: data.downloadScanImg !== undefined ? data.downloadScanImg : existing.DOWNLOAD_SCAN_IMG,
      UPDATER: updater || existing.UPDATER,
    };

    // 如传了 versionType，直接更新
    if (data.versionType !== undefined && data.versionType !== null && data.versionType !== '') {
      newRow.VERSION_TYPE = Number(data.versionType);
    }

    // 如传了 versionCode，直接更新（校验已在 controller 层完成）
    if (data.versionCode !== undefined && data.versionCode !== null && data.versionCode !== '') {
      newRow.VERSION_CODE = Number(data.versionCode);
    }

    const res = await ctx.app.mysql.update('mobile_version', newRow, {
      where: { ID: id },
    });
    if (res.affectedRows !== 1) {
      throw new Error('更新失败');
    }
    return await this.getById(id);
  }

  /**
   * 按应用批量删除版本
   * @param {number} appId 应用ID
   * @param {number[]} versionIds 版本ID数组
   * @returns {Promise<number>} 实际删除条数
   */
  async deleteByIds(appId, versionIds = []) {
    const { ctx } = this;
    const targetAppId = Number(appId);
    if (!targetAppId || Number.isNaN(targetAppId)) {
      return 0;
    }

    if (!Array.isArray(versionIds) || versionIds.length === 0) {
      return 0;
    }

    const validIds = [...new Set(versionIds)]
      .map(id => parseInt(id, 10))
      .filter(id => !Number.isNaN(id) && id > 0);

    if (validIds.length === 0) {
      return 0;
    }

    const placeholders = validIds.map(() => '?').join(',');
    const res = await ctx.app.mysql.query(
      `DELETE FROM mobile_version WHERE APP_ID = ? AND ID IN (${placeholders})`,
      [ targetAppId, ...validIds ]
    );

    return res.affectedRows || 0;
  }
}

module.exports = MobileVersionService;




