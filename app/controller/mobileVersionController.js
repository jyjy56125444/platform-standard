'use strict';

const Controller = require('egg').Controller;
const { PermissionUtil, USER_LEVEL } = require('../utils/permission');
const { toCamelCaseKeys } = require('../utils/case');
const { validateVersionType } = require('../utils/bitmask');
const { withLog } = require('../utils/logDecorator');

class MobileVersionController extends Controller {
  // 列表（所有人可查） GET /api/mobile/apps/:appId/versions
  async list() {
    const { ctx } = this;
    try {
      const appId = parseInt(ctx.params.appId, 10);
      if (!appId || Number.isNaN(appId)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '无效的应用ID' };
        return;
      }
      const { versionType, page = 1, pageSize = 10 } = ctx.query;
      const data = await ctx.service.mobileVersionService.listByApp(appId, { versionType, page, pageSize });
      const responseData = toCamelCaseKeys(data);
      ctx.body = { code: 200, message: 'success', data: responseData };
    } catch (error) {
      ctx.logger.error('查询版本列表失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '查询版本列表失败', error: error.message };
    }
  }

  // 详情（所有人可查） GET /api/mobile/versions/:id
  async detail() {
    const { ctx } = this;
    try {
      const id = parseInt(ctx.params.id, 10);
      if (!id || Number.isNaN(id)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '无效的版本ID' };
        return;
      }
      const version = await ctx.service.mobileVersionService.getById(id);
      if (!version) {
        ctx.status = 404;
        ctx.body = { code: 404, message: '版本不存在' };
        return;
      }
      ctx.body = { code: 200, message: 'success', data: toCamelCaseKeys(version) };
    } catch (error) {
      ctx.logger.error('查询版本详情失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '查询版本详情失败', error: error.message };
    }
  }

  // 创建（需要开发人员或更高级别权限）
  // 超级管理员可以为所有应用创建版本，开发者只能为有权限的应用创建版本
  // POST /api/mobile/apps/:appId/versions
  async create() {
    const { ctx } = this;
    try {
      const appId = parseInt(ctx.params.appId, 10);
      if (!appId || Number.isNaN(appId)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '无效的应用ID' };
        return;
      }

      if (!(await PermissionUtil.hasAppAccess(ctx, appId, '没有权限操作该应用'))) {
        return;
      }

      const userName = ctx.auth.username;

      const { versionType, version, versionCode, comment, downloadSize, downloadUrl, downloadScanImg } = ctx.request.body || {};
      if (!versionType || !version || versionCode === undefined || versionCode === null || versionCode === '') {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'versionType、version 与 versionCode 不能为空' };
        return;
      }

      const versionCodeNum = parseInt(versionCode, 10);
      if (!versionCodeNum || Number.isNaN(versionCodeNum) || versionCodeNum <= 0) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'versionCode 必须为大于 0 的整数' };
        return;
      }

      // 获取应用信息并校验版本平台类型
      const app = await ctx.service.mobileAppService.findById(appId);
      if (!app) {
        ctx.status = 404;
        ctx.body = { code: 404, message: '应用不存在' };
        return;
      }

      try {
        validateVersionType(versionType, app.APP_TYPE);
      } catch (error) {
        if (error.code === 'INVALID_PLATFORM_VALUE') {
          ctx.status = 400;
          ctx.body = { code: 400, message: error.message };
          return;
        }
        if (error.code === 'PLATFORM_NOT_ALLOWED') {
          ctx.status = 400;
          ctx.body = { code: 400, message: error.message };
          return;
        }
        throw error;
      }

      const creator = userName || null;
      const data = await ctx.service.mobileVersionService.create(appId, {
        versionType,
        version,
        versionCode: versionCodeNum,
        comment,
        downloadSize,
        downloadUrl,
        downloadScanImg,
      }, creator);

      ctx.body = { code: 200, message: '创建成功', data: toCamelCaseKeys(data) };
    } catch (error) {
      ctx.logger.error('创建版本失败:', error);
      if (error.message && error.message.includes('Duplicate entry')) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '同一平台下该版本号已存在' };
        return;
      }
      ctx.status = 500;
      ctx.body = { code: 500, message: '创建版本失败', error: error.message };
    }
  }

  // 更新（需要开发人员或更高级别权限）
  // 超级管理员可以更新所有应用的版本，开发者只能更新有权限应用的版本
  // PUT /api/mobile/versions/:id
  async update() {
    const { ctx } = this;
    try {
      const id = parseInt(ctx.params.id, 10);
      if (!id || Number.isNaN(id)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '无效的版本ID' };
        return;
      }

      const existing = await ctx.service.mobileVersionService.getById(id);
      if (!existing) {
        ctx.status = 404;
        ctx.body = { code: 404, message: '版本不存在' };
        return;
      }

      const userName = ctx.auth.username;
      if (!(await PermissionUtil.hasAppAccess(ctx, existing.APP_ID, '没有权限操作该应用'))) {
        return;
      }

      // 如果传了 versionType，需要校验
      const { versionType, versionCode } = ctx.request.body || {};
      if (versionType !== undefined && versionType !== null && versionType !== '') {
        const app = await ctx.service.mobileAppService.findById(existing.APP_ID);
        if (!app) {
          ctx.status = 404;
          ctx.body = { code: 404, message: '应用不存在' };
          return;
        }

        try {
          validateVersionType(versionType, app.APP_TYPE);
        } catch (error) {
          if (error.code === 'INVALID_PLATFORM_VALUE') {
            ctx.status = 400;
            ctx.body = { code: 400, message: error.message };
            return;
          }
          if (error.code === 'PLATFORM_NOT_ALLOWED') {
            ctx.status = 400;
            ctx.body = { code: 400, message: error.message };
            return;
          }
          throw error;
        }
      }

      // 如果传了 versionCode，需要在控制层校验为大于 0 的整数
      let body = ctx.request.body || {};
      if (versionCode !== undefined && versionCode !== null && versionCode !== '') {
        const versionCodeNum = parseInt(versionCode, 10);
        if (!versionCodeNum || Number.isNaN(versionCodeNum) || versionCodeNum <= 0) {
          ctx.status = 400;
          ctx.body = { code: 400, message: 'versionCode 必须为大于 0 的整数' };
          return;
        }
        body = {
          ...body,
          versionCode: versionCodeNum,
        };
      }

      const updater = userName || null;
      const updated = await ctx.service.mobileVersionService.updateById(id, body, updater);
      if (!updated) {
        ctx.status = 404;
        ctx.body = { code: 404, message: '版本不存在' };
        return;
      }
      ctx.body = { code: 200, message: '更新成功', data: toCamelCaseKeys(updated) };
    } catch (error) {
      ctx.logger.error('更新版本失败:', error);
      if (error.message && error.message.includes('Duplicate entry')) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '同一平台下该版本号已存在' };
        return;
      }
      ctx.status = 500;
      ctx.body = { code: 500, message: '更新版本失败', error: error.message };
    }
  }

  // 删除/批量删除版本（需要开发人员或更高级别权限）
  // 超级管理员可以删除所有应用的版本，开发者只能删除有权限应用的版本
  // DELETE /api/mobile/versions/:appId
  // Body: { versionIds: [1,2,3] }
  async delete() {
    const { ctx } = this;
    try {
      const appId = parseInt(ctx.params.appId, 10);
      if (!appId || Number.isNaN(appId)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '无效的应用ID' };
        return;
      }

      // 权限检查：需要对该应用有访问权限
      if (!(await PermissionUtil.hasAppAccess(ctx, appId, '没有权限操作该应用'))) {
        return;
      }

      const { versionIds, versionId } = ctx.request.body || {};
      let ids = Array.isArray(versionIds) ? versionIds : [];

      // 兼容单个删除：允许传 versionId
      if ((!ids || ids.length === 0) && (versionId !== undefined && versionId !== null)) {
        ids = [ versionId ];
      }

      if (!Array.isArray(ids) || ids.length === 0) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'versionIds 必须是非空数组' };
        return;
      }

      const validIds = [...new Set(ids)]
        .map(id => parseInt(id, 10))
        .filter(id => !Number.isNaN(id) && id > 0);

      if (validIds.length === 0) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '缺少有效的版本ID' };
        return;
      }

      const deletedCount = await ctx.service.mobileVersionService.deleteByIds(appId, validIds);
      if (!deletedCount) {
        ctx.status = 404;
        ctx.body = { code: 404, message: '未找到可删除的版本' };
        return;
      }

      ctx.body = { code: 200, message: '删除成功', data: { deletedCount } };
    } catch (error) {
      ctx.logger.error('删除版本失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '删除版本失败', error: error.message };
    }
  }
}

// 使用装饰器自动记录操作日志（类似AOP）
MobileVersionController.prototype.create = withLog(
  MobileVersionController.prototype.create,
  (ctx) => {
    const version = ctx.request.body?.version;
    return `创建版本：AppID=${ctx.params.appId}, Version=${version || '未知'}`;
  }
);

MobileVersionController.prototype.update = withLog(
  MobileVersionController.prototype.update,
  (ctx) => `更新版本：ID=${ctx.params.id}`
);

MobileVersionController.prototype.delete = withLog(
  MobileVersionController.prototype.delete,
  (ctx) => `删除版本：ID=${ctx.params.id}`
);

module.exports = MobileVersionController;




