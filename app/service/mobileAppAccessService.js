'use strict';

const Service = require('egg').Service;

/**
 * 应用访问授权相关数据库操作
 */
class MobileAppAccessService extends Service {
  /**
   * 判断用户是否拥有指定应用的维护权限
   * 仅依据 mobile_app_user 表记录校验
   * @param {number} appId
   * @param {number} userGuid
   * @returns {Promise<boolean>}
   */
  async hasAccess(appId, userGuid) {
    const { ctx } = this;
    const targetId = Number(appId);
    if (!targetId || Number.isNaN(targetId)) return false;
    if (!userGuid) return false;

    const access = await ctx.app.mysql.get('mobile_app_user', {
      APP_ID: targetId,
      USER_GUID: userGuid,
    });
    if (access) {
      return true;
    }

    return false;
  }

  /**
   * 获取用户在应用中的权限等级
   * @param {number} appId 应用ID
   * @param {number} userGuid 用户ID
   * @returns {Promise<number|null>} 权限值（1-创建者，2-开发者），如果不存在返回null
   */
  async getUserPermission(appId, userGuid) {
    const { ctx } = this;
    const targetAppId = Number(appId);
    const targetUserGuid = Number(userGuid);

    const access = await ctx.app.mysql.get('mobile_app_user', {
      APP_ID: targetAppId,
      USER_GUID: targetUserGuid,
    });

    return access ? access.PERMISSIONS : null;
  }

  /**
   * 添加用户到应用权限表（仅数据库操作，参数验证在 controller 层）
   * @param {number} appId 应用ID（已验证）
   * @param {number} userGuid 用户ID（已验证）
   * @param {string} creator 创建人（用户名）
   * @param {number} permissions 权限：1-应用创建者，2-应用开发者（已验证）
   * @param {string} remark 备注说明
   * @returns {Promise<Object>} 插入的记录
   */
  async addUser(appId, userGuid, creator, permissions, remark = null) {
    const { ctx } = this;
    const targetAppId = Number(appId);
    const targetUserGuid = Number(userGuid);

    // 检查是否已存在
    const existing = await ctx.app.mysql.get('mobile_app_user', {
      APP_ID: targetAppId,
      USER_GUID: targetUserGuid,
    });

    if (existing) {
      // 如果已存在，返回现有记录
      return existing;
    }

    // 插入新记录
    const result = await ctx.app.mysql.insert('mobile_app_user', {
      APP_ID: targetAppId,
      USER_GUID: targetUserGuid,
      PERMISSIONS: permissions,
      REMARK: remark,
      CREATOR: creator || null,
      UPDATER: creator || null,
    });

    // 返回插入的记录
    return await ctx.app.mysql.get('mobile_app_user', {
      ID: result.insertId,
    });
  }

  /**
   * 从应用权限表中批量移除用户（仅数据库操作，参数验证在 controller 层）
   * @param {number} appId 应用ID（已验证）
   * @param {Array<number>} userGuids 用户ID数组（已验证）
   * @returns {Promise<number>} 删除的记录数
   */
  async removeUsers(appId, userGuids) {
    const { ctx } = this;
    const targetAppId = Number(appId);
    
    if (!Array.isArray(userGuids) || userGuids.length === 0) {
      return 0;
    }

    // 过滤有效的用户ID
    const validUserGuids = userGuids
      .map(id => Number(id))
      .filter(id => !Number.isNaN(id) && id > 0);

    if (validUserGuids.length === 0) {
      return 0;
    }

    // 批量删除：使用 IN 查询
    const placeholders = validUserGuids.map(() => '?').join(',');
    const sql = `DELETE FROM mobile_app_user WHERE APP_ID = ? AND USER_GUID IN (${placeholders})`;
    const params = [targetAppId, ...validUserGuids];

    const result = await ctx.app.mysql.query(sql, params);

    return result.affectedRows || 0;
  }

  /**
   * 获取应用的用户权限列表
   * @param {number} appId 应用ID
   * @returns {Promise<Array>} 用户权限列表
   */
  async listUsers(appId) {
    const { ctx } = this;
    const targetAppId = Number(appId);

    // 查询应用的用户权限列表，关联用户表获取用户信息
    const users = await ctx.app.mysql.query(
      `SELECT 
        mau.ID,
        mau.APP_ID,
        mau.USER_GUID,
        mau.PERMISSIONS,
        mau.REMARK,
        mau.CREATE_TIME,
        mau.UPDATE_TIME,
        mau.CREATOR,
        mau.UPDATER,
        pu.USER_NAME,
        pu.USER_REAL_NAME,
        pu.USER_EMAIL,
        pu.USER_AVATAR
      FROM mobile_app_user mau
      LEFT JOIN plat_users pu ON mau.USER_GUID = pu.USER_GUID
      WHERE mau.APP_ID = ?
      ORDER BY mau.CREATE_TIME DESC`,
      [targetAppId]
    );

    return users;
  }

  /**
   * 获取用户拥有访问权限的应用（仅 mobile_app 主表字段）
   * @param {number} userGuid 用户ID
   * @returns {Promise<Array>}
   */
  async listAuthorizedApps(userGuid) {
    const { ctx } = this;
    const targetUserGuid = Number(userGuid);
    if (!targetUserGuid || Number.isNaN(targetUserGuid)) {
      return [];
    }

    const apps = await ctx.app.mysql.query(
      `SELECT
        ma.APP_ID,
        ma.APP_NAME,
        ma.APP_FULLNAME,
        ma.APP_TYPE,
        ma.APP_ICON,
        ma.CREATE_TIME,
        ma.UPDATE_TIME,
        ma.CREATOR,
        ma.UPDATER,
        mau.PERMISSIONS
      FROM mobile_app ma
      INNER JOIN mobile_app_user mau ON ma.APP_ID = mau.APP_ID
      WHERE mau.USER_GUID = ?
      ORDER BY ma.CREATE_TIME DESC`,
      [targetUserGuid]
    );

    return apps;
  }
}

module.exports = MobileAppAccessService;


