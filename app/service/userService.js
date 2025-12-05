'use strict';

const Service = require('egg').Service;
const bcrypt = require('bcryptjs');

class UserService extends Service {
  // 创建用户（写入 plat_users）
  async create(userData) {
    const { ctx } = this;
    try {
      // 将通用字段映射到 plat_users 列
      // 对密码进行 bcrypt 加密
      const hashedPwd = await bcrypt.hash(userData.password, 10);
      const row = {
        USER_NAME: userData.username,
        USER_REAL_NAME: userData.userRealName || null,
        USER_PWD: hashedPwd,
        USER_EMAIL: userData.email || null,
        USER_MOBILE: userData.mobile || null,
        USER_LEV: userData.userLev !== undefined && userData.userLev !== null ? userData.userLev : 2, // 如果传入了userLev则使用，否则默认2（开发人员）
        USER_STATUS: userData.userStatus !== undefined && userData.userStatus !== null ? userData.userStatus : 1,
      };

      const result = await ctx.app.mysql.insert('plat_users', row);
      if (!result || result.affectedRows !== 1) {
        throw new Error('插入用户失败');
      }
      const insertedId = result.insertId;
      // 仅返回必要字段，避免泄露敏感信息
      const created = await ctx.app.mysql.get(
        'plat_users',
        { USER_GUID: insertedId },
        {
          columns: [
            'USER_GUID',
            'USER_NAME',
            'USER_REAL_NAME',
            'USER_EMAIL',
            'USER_MOBILE',
            'USER_AVATAR',
            'USER_LEV',
            'USER_STATUS',
          ],
        }
      );
      return created;
    } catch (error) {
      ctx.logger.error('创建用户失败:', error);
      throw error;
    }
  }

  // 根据ID查找用户（plat_users）
  // 仅返回必要字段，排除密码等敏感信息
  async findById(id) {
    const { ctx } = this;
    return await ctx.app.mysql.get(
      'plat_users',
      { USER_GUID: id },
      {
        columns: [
          'USER_GUID',
          'USER_NAME',
          'USER_REAL_NAME',
          'USER_EMAIL',
          'USER_MOBILE',
          'USER_AVATAR',
          'USER_LEV',
          'USER_STATUS',
        ],
      }
    );
  }

  // 根据用户名查找用户（plat_users）
  // 仅返回必要字段，排除密码等敏感信息
  async findByUsername(username) {
    const { ctx } = this;
    return await ctx.app.mysql.get(
      'plat_users',
      { USER_NAME: username },
      {
        columns: [
          'USER_GUID',
          'USER_NAME',
          'USER_REAL_NAME',
          'USER_EMAIL',
          'USER_MOBILE',
          'USER_AVATAR',
          'USER_LEV',
          'USER_STATUS',
        ],
      }
    );
  }

  // 根据用户名查找用户（plat_users表）
  async findByPlatUsername(username) {
    const { ctx } = this;
    try {
      // 仅返回必要字段，排除密码
      const result = await ctx.app.mysql.get(
        'plat_users',
        {
          USER_NAME: username,
          USER_STATUS: 1,
        },
        {
          columns: [
            'USER_GUID',
            'USER_NAME',
            'USER_REAL_NAME',
            'USER_EMAIL',
            'USER_MOBILE',
            'USER_AVATAR',
            'USER_LEV',
            'USER_STATUS',
          ],
        }
      );
      return result || null;
    } catch (error) {
      ctx.logger.error('查询用户失败:', error);
      return null;
    }
  }

  // 验证用户密码（使用 bcrypt 比较）
  async validatePassword(username, password) {
    const { ctx } = this;
    try {
      // 独立查询包含密码的字段，用于校验
      const userWithPwd = await ctx.app.mysql.get(
        'plat_users',
        { USER_NAME: username, USER_STATUS: 1 },
        { columns: ['USER_PWD'] }
      );
      if (!userWithPwd) {
        return false;
      }
      // 使用 bcrypt 比较明文与哈希
      return await bcrypt.compare(password, userWithPwd.USER_PWD);
    } catch (error) {
      ctx.logger.error('密码验证失败:', error);
      return false;
    }
  }

  // 获取用户列表（读取 plat_users 表）
  async getList(page = 1, pageSize = 10) {
    const { ctx } = this;
    const offset = (page - 1) * pageSize;

    // 原实现：使用原生 SQL（保留作参考）
    // const countRows = await ctx.app.mysql.query(
    //   'SELECT COUNT(1) AS cnt FROM `plat_users`'
    // );
    // const total = countRows && countRows[0] ? Number(countRows[0].cnt) : 0;
    // const list = await ctx.app.mysql.query(
    //   'SELECT `USER_GUID`, `USER_NAME`, `USER_REAL_NAME`, `USER_EMAIL`, `USER_MOBILE`, `USER_LEV`, `USER_STATUS`, `CREATE_TIME`, `UPDATE_TIME`\\
    //    FROM `plat_users`\\
    //    ORDER BY `CREATE_TIME` DESC\\
    //    LIMIT ?, ?',
    //   [ offset, pageSize ]
    // );

    // 新实现：使用 select / count 辅助方法
    const total = await ctx.app.mysql.count('plat_users', {});
    const list = await ctx.app.mysql.select('plat_users', {
      columns: [
        'USER_GUID',
        'USER_NAME',
        'USER_REAL_NAME',
        'USER_EMAIL',
        'USER_MOBILE',
        'USER_AVATAR',
        'USER_LEV',
        'USER_STATUS',
        'CREATE_TIME',
        'UPDATE_TIME',
      ],
      orders: [[ 'CREATE_TIME', 'desc' ]],
      limit: Number(pageSize),
      offset: Number(offset),
    });

    return {
      list,
      total: Number(total) || 0,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: pageSize ? Math.ceil(total / pageSize) : 0,
    };
  }

  // 更新用户信息（plat_users）
  // 注意：此方法用于通用更新，支持多种字段（包括头像、密码等）
  // 如果只需要更新基本信息（USER_REAL_NAME, USER_EMAIL, USER_MOBILE, USER_STATUS），建议使用 updateBasicInfo
  async update(id, updateData) {
    const { ctx } = this;
    // 仅允许更新的字段映射（统一只使用 userRealName）
    const allow = ['userRealName', 'email', 'mobile', 'userLev', 'userStatus', 'password', 'avatar'];
    const data = Object.keys(updateData || {})
      .filter(k => allow.includes(k))
      .reduce((acc, k) => {
        switch (k) {
          case 'userRealName': acc.USER_REAL_NAME = updateData[k]; break;
          case 'email': acc.USER_EMAIL = updateData[k]; break;
          case 'mobile': acc.USER_MOBILE = updateData[k]; break;
          case 'avatar': acc.USER_AVATAR = updateData[k]; break;
          case 'userLev': acc.USER_LEV = updateData[k]; break;
          case 'userStatus': acc.USER_STATUS = updateData[k]; break;
          case 'password': acc.USER_PWD = updateData[k]; break; // 将在更新前统一加密
          default: break;
        }
        return acc;
      }, {});

    if (Object.keys(data).length === 0) {
      return await this.findById(id);
    }

    // 如果包含密码，先进行加密
    if (data.USER_PWD) {
      data.USER_PWD = await bcrypt.hash(data.USER_PWD, 10);
    }

    const result = await ctx.app.mysql.update('plat_users', data, { where: { USER_GUID: id } });
    if (!result || result.affectedRows !== 1) {
      throw new Error('更新用户失败');
    }
    return await this.findById(id);
  }

  // 更新用户基本信息（仅允许更新：USER_REAL_NAME, USER_EMAIL, USER_MOBILE, USER_STATUS）
  async updateBasicInfo(id, updateData) {
    const { ctx } = this;
    // 仅允许更新的字段
    const allow = ['userRealName', 'email', 'mobile', 'userStatus'];
    const data = Object.keys(updateData || {})
      .filter(k => allow.includes(k))
      .reduce((acc, k) => {
        switch (k) {
          case 'userRealName': acc.USER_REAL_NAME = updateData[k]; break;
          case 'email': acc.USER_EMAIL = updateData[k]; break;
          case 'mobile': acc.USER_MOBILE = updateData[k]; break;
          case 'userStatus': acc.USER_STATUS = updateData[k]; break;
          default: break;
        }
        return acc;
      }, {});

    if (Object.keys(data).length === 0) {
      return await this.findById(id);
    }

    // UPDATE_TIME 由数据库自动更新（ON UPDATE CURRENT_TIMESTAMP）
    const result = await ctx.app.mysql.update('plat_users', data, { where: { USER_GUID: id } });
    if (!result || result.affectedRows !== 1) {
      throw new Error('更新用户信息失败');
    }
    
    // 返回限制字段的用户信息（findById 已处理字段限制）
    return await this.findById(id);
  }

  // 删除用户（支持批量）
  async deleteUsers(userIds = []) {
    const { ctx } = this;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return 0;
    }

    const validIds = [...new Set(userIds)]
      .map(id => parseInt(id, 10))
      .filter(id => !Number.isNaN(id) && id > 0);

    if (validIds.length === 0) {
      return 0;
    }

    const placeholders = validIds.map(() => '?').join(',');
    const conn = await ctx.app.mysql.beginTransaction();
    try {
      // 先删除 mobile_app_user 中的权限记录（即便外键已级联，也能保证 MySQL 未启用级联时的行为）
      await conn.query(
        `DELETE FROM mobile_app_user WHERE USER_GUID IN (${placeholders})`,
        validIds
      );

      const result = await conn.query(
        `DELETE FROM plat_users WHERE USER_GUID IN (${placeholders})`,
        validIds
      );

      await conn.commit();
      return result.affectedRows || 0;
    } catch (error) {
      await conn.rollback();
      ctx.logger.error('批量删除用户失败:', error);
      throw error;
    }
  }

  // 使用原生SQL查询（适用于国产数据库）
  async queryWithSQL(sql, params = []) {
    const { ctx } = this;
    try {
      const result = await ctx.app.mysql.query(sql, params);
      return result;
    } catch (error) {
      ctx.logger.error('SQL查询失败:', error);
      throw error;
    }
  }
}

module.exports = UserService;
