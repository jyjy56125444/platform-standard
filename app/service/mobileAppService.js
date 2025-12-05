'use strict';

const Service = require('egg').Service;

class MobileAppService extends Service {
  /**
   * 创建应用（同时创建扩展信息）
   * @param {Object} appData - 应用数据
   * @param {String} creator - 创建人
   * @returns {Object} 创建的应用信息
   */
  async create(appData, creator) {
    const { ctx } = this;
    const conn = await ctx.app.mysql.beginTransaction();
    
    try {
      // 插入应用主表
      const appRow = {
        APP_NAME: appData.appName,
        APP_FULLNAME: appData.appFullname || null,
        APP_TYPE: appData.appType || null,
        APP_ICON: appData.appIcon || null,
        CREATOR: creator || null,
        UPDATER: creator || null,
      };

      const appResult = await conn.insert('mobile_app', appRow);
      if (!appResult || appResult.affectedRows !== 1) {
        throw new Error('插入应用失败');
      }
      const appId = appResult.insertId;

      // 插入扩展信息表
      const infoRow = {
        APP_ID: appId,
        DEVELOPER: appData.developer || null,
        INTERFACE_DEVELOPER: appData.interfaceDeveloper || null,
        DESIGNER: appData.designer || null,
        REMARK: appData.remark || null,
        CREATOR: creator || null,
        UPDATER: creator || null,
      };

      const infoResult = await conn.insert('mobile_app_info', infoRow);
      if (!infoResult || infoResult.affectedRows !== 1) {
        throw new Error('插入应用扩展信息失败');
      }

      await conn.commit();

      // 返回完整的应用信息（包含扩展信息）
      return await this.findById(appId);
    } catch (error) {
      await conn.rollback();
      ctx.logger.error('创建应用失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID查找应用（包含扩展信息）
   * @param {Number} id - 应用ID
   * @returns {Object} 应用信息
   */
  async findById(id) {
    const { ctx } = this;
    const app = await ctx.app.mysql.get('mobile_app', { APP_ID: id });
    if (!app) {
      return null;
    }

    // 查询扩展信息
    const info = await ctx.app.mysql.get('mobile_app_info', { APP_ID: id });
    // 仅返回必要的扩展字段
    const limitedInfo = info
      ? {
          DEVELOPER: info.DEVELOPER || null,
          INTERFACE_DEVELOPER: info.INTERFACE_DEVELOPER || null,
          DESIGNER: info.DESIGNER || null,
          REMARK: info.REMARK || null,
        }
      : {};

    return {
      ...app,
      info: limitedInfo,
    };
  }

  /**
   * 获取应用列表（包含扩展信息）
   * @param {Number} page - 页码
   * @param {Number} pageSize - 每页数量
   * @returns {Object} 列表数据
   */
  async getList(page = 1, pageSize = 10) {
    const { ctx } = this;
    const offset = (page - 1) * pageSize;

    const total = await ctx.app.mysql.count('mobile_app', {});
    const list = await ctx.app.mysql.select('mobile_app', {
      columns: [
        'APP_ID',
        'APP_NAME',
        'APP_FULLNAME',
        'APP_TYPE',
        'APP_ICON',
        'CREATE_TIME',
        'UPDATE_TIME',
        'CREATOR',
        'UPDATER',
      ],
      orders: [[ 'CREATE_TIME', 'desc' ]],
      limit: Number(pageSize),
      offset: Number(offset),
    });

    // 批量查询扩展信息
    if (list.length > 0) {
      const appIds = list.map(item => item.APP_ID);
      const infoList = await ctx.app.mysql.select('mobile_app_info', {
        where: { APP_ID: appIds },
      });

    // 将扩展信息关联到应用（仅保留必要字段）
    const infoMap = {};
    infoList.forEach(info => {
      infoMap[info.APP_ID] = {
        DEVELOPER: info.DEVELOPER || null,
        INTERFACE_DEVELOPER: info.INTERFACE_DEVELOPER || null,
        DESIGNER: info.DESIGNER || null,
        REMARK: info.REMARK || null,
      };
    });

      list.forEach(app => {
        app.info = infoMap[app.APP_ID] || {};
      });
    }

    return {
      list,
      total: Number(total) || 0,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: pageSize ? Math.ceil(total / pageSize) : 0,
    };
  }

  /**
   * 更新应用信息（同时更新扩展信息）
   * @param {Number} id - 应用ID
   * @param {Object} updateData - 更新数据
   * @param {String} updater - 更新人
   * @returns {Object} 更新后的应用信息
   */
  async update(id, updateData, updater) {
    const { ctx } = this;
    
    // 如果没有任何需要更新的字段，直接返回当前数据
    const hasAppFields = ['appName', 'appFullname', 'appType', 'appIcon'].some(key => updateData.hasOwnProperty(key));
    const hasInfoFields = ['developer', 'interfaceDeveloper', 'designer', 'remark'].some(key => updateData.hasOwnProperty(key));
    
    if (!hasAppFields && !hasInfoFields) {
      return await this.findById(id);
    }

    const conn = await ctx.app.mysql.beginTransaction();
    
    try {
      // 更新应用主表
      const appData = {};
      const allowAppFields = ['appName', 'appFullname', 'appType', 'appIcon'];
      Object.keys(updateData).forEach(key => {
        if (allowAppFields.includes(key)) {
          switch (key) {
            case 'appName': appData.APP_NAME = updateData[key]; break;
            case 'appFullname': appData.APP_FULLNAME = updateData[key]; break;
            case 'appType': appData.APP_TYPE = updateData[key]; break;
            case 'appIcon': appData.APP_ICON = updateData[key]; break;
          }
        }
      });

      if (Object.keys(appData).length > 0) {
        appData.UPDATER = updater || null;
        const appResult = await conn.update('mobile_app', appData, { where: { APP_ID: id } });
        if (!appResult || appResult.affectedRows !== 1) {
          throw new Error('更新应用失败');
        }
      }

      // 更新扩展信息表
      const infoData = {};
      const allowInfoFields = ['developer', 'interfaceDeveloper', 'designer', 'remark'];
      Object.keys(updateData).forEach(key => {
        if (allowInfoFields.includes(key)) {
          switch (key) {
            case 'developer': infoData.DEVELOPER = updateData[key]; break;
            case 'interfaceDeveloper': infoData.INTERFACE_DEVELOPER = updateData[key]; break;
            case 'designer': infoData.DESIGNER = updateData[key]; break;
            case 'remark': infoData.REMARK = updateData[key]; break;
          }
        }
      });

      if (Object.keys(infoData).length > 0) {
        infoData.UPDATER = updater || null;
        // 使用 upsert 方式更新（如果不存在则创建）
        const existingInfo = await conn.get('mobile_app_info', { APP_ID: id });
        if (existingInfo) {
          const infoResult = await conn.update('mobile_app_info', infoData, { where: { APP_ID: id } });
          if (!infoResult || infoResult.affectedRows !== 1) {
            throw new Error('更新应用扩展信息失败');
          }
        } else {
          // 如果不存在，创建扩展信息
          infoData.APP_ID = id;
          infoData.CREATOR = updater || null;
          const infoResult = await conn.insert('mobile_app_info', infoData);
          if (!infoResult || infoResult.affectedRows !== 1) {
            throw new Error('创建应用扩展信息失败');
          }
        }
      }

      await conn.commit();
      return await this.findById(id);
    } catch (error) {
      await conn.rollback();
      ctx.logger.error('更新应用失败:', error);
      throw error;
    }
  }

  /**
   * 删除应用（同时删除扩展信息、版本数据和应用用户关系）
   * @param {Number} id - 应用ID
   * @returns {Boolean} 是否删除成功
   */
  async delete(id) {
    const { ctx } = this;
    const conn = await ctx.app.mysql.beginTransaction();
    
    try {
      // 删除版本信息
      await conn.delete('mobile_version', { APP_ID: id });
      
      // 删除扩展信息
      await conn.delete('mobile_app_info', { APP_ID: id });
      
      // 清空应用用户关系
      await conn.delete('mobile_app_user', { APP_ID: id });
      
      // 删除应用主表
      const appResult = await conn.delete('mobile_app', { APP_ID: id });
      
      await conn.commit();
      return !!(appResult && appResult.affectedRows === 1);
    } catch (error) {
      await conn.rollback();
      ctx.logger.error('删除应用失败:', error);
      throw error;
    }
  }
}

module.exports = MobileAppService;

