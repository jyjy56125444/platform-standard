'use strict';

/**
 * 权限管理工具
 * 统一管理用户权限级别和权限检查
 */

// 用户级别常量
const USER_LEVEL = {
  SUPER_ADMIN: 1,    // 超级管理员
  DEVELOPER: 2,      // 开发人员
  GUEST: 3,          // 访客
};

// 用户级别名称映射
const USER_LEVEL_NAME = {
  [USER_LEVEL.SUPER_ADMIN]: '超级管理员',
  [USER_LEVEL.DEVELOPER]: '开发人员',
  [USER_LEVEL.GUEST]: '访客',
};

// 应用用户权限常量
const APP_USER_PERMISSION = {
  APP_CREATOR: 1,    // 应用创建者
  APP_DEVELOPER: 2,  // 应用开发者
};

// 应用用户权限名称映射
const APP_USER_PERMISSION_NAME = {
  [APP_USER_PERMISSION.APP_CREATOR]: '应用创建者',
  [APP_USER_PERMISSION.APP_DEVELOPER]: '应用开发者',
};

class PermissionUtil {
  /**
   * 检查用户是否具有指定级别或更高级别
   * @param {Number} userLev - 用户当前级别
   * @param {Number} requiredLev - 所需的最低级别
   * @returns {Boolean}
   */
  static hasLevel(userLev, requiredLev) {
    // 级别数字越小，权限越高（1 < 2 < 3）
    return userLev <= requiredLev;
  }

  /**
   * 检查用户是否为超级管理员
   * @param {Number} userLev - 用户级别
   * @returns {Boolean}
   */
  static isSuperAdmin(userLev) {
    return userLev === USER_LEVEL.SUPER_ADMIN;
  }

  /**
   * 检查用户是否为开发人员或更高
   * @param {Number} userLev - 用户级别
   * @returns {Boolean}
   */
  static isDeveloperOrAbove(userLev) {
    return this.hasLevel(userLev, USER_LEVEL.DEVELOPER);
  }

  /**
   * 验证用户级别是否有效
   * @param {Number} userLev - 用户级别
   * @returns {Boolean}
   */
  static isValidLevel(userLev) {
    return Object.values(USER_LEVEL).includes(userLev);
  }

  /**
   * 获取用户级别名称
   * @param {Number} userLev - 用户级别
   * @returns {String}
   */
  static getLevelName(userLev) {
    return USER_LEVEL_NAME[userLev] || '未知级别';
  }

  /**
   * 在Controller中检查权限（快捷方法）
   * @param {Object} ctx - Egg Context
   * @param {Number} requiredLev - 所需的最低级别
   * @param {String} errorMessage - 自定义错误信息
   * @returns {Boolean} 有权限返回true，无权限已设置响应并返回false
   */
  static checkPermission(ctx, requiredLev, errorMessage) {
    const userLev = ctx.auth?.userLev;
    
    if (userLev === undefined || userLev === null) {
      ctx.status = 401;
      ctx.body = {
        code: 401,
        message: '未登录或Token已过期',
      };
      return false;
    }

    if (!this.hasLevel(userLev, requiredLev)) {
      ctx.status = 403;
      ctx.body = {
        code: 403,
        message: errorMessage || `权限不足，需要 ${this.getLevelName(requiredLev)} 或更高级别`,
      };
      return false;
    }

    return true;
  }

  /**
   * 检查是否为超级管理员（快捷方法）
   * @param {Object} ctx - Egg Context
   * @param {String} errorMessage - 自定义错误信息
   * @returns {Boolean}
   */
  static requireSuperAdmin(ctx, errorMessage) {
    return this.checkPermission(ctx, USER_LEVEL.SUPER_ADMIN, errorMessage || '仅超级管理员可执行此操作');
  }

  /**
   * 检查是否为开发人员或更高（快捷方法）
   * @param {Object} ctx - Egg Context
   * @param {String} errorMessage - 自定义错误信息
   * @returns {Boolean}
   */
  static requireDeveloper(ctx, errorMessage) {
    return this.checkPermission(ctx, USER_LEVEL.DEVELOPER, errorMessage || '需要开发人员或更高级别权限');
  }

  /**
   * 确保当前登录用户具备指定应用的维护权限
   * 若无权限，会直接写入响应并返回 false
   * 需要开发人员或更高级别权限才能调用此方法
   * 超级管理员：直接返回 true
   * 开发者：仅当 mobile_app_user 表存在授权记录时返回 true
   * @param {Object} ctx Egg Context
   * @param {Number} appId 应用ID
   * @param {String} errorMessage 自定义错误提示
   * @returns {Promise<boolean>}
   */
  static async hasAppAccess(ctx, appId, errorMessage) {
    // 先检查用户级别（需要开发人员或更高级别）
    if (!this.checkPermission(ctx, USER_LEVEL.DEVELOPER, '需要开发人员或更高级别权限')) {
      return false;
    }

    // 检查应用ID有效性
    if (!appId || Number.isNaN(Number(appId))) {
      ctx.status = 400;
      ctx.body = {
        code: 400,
        message: '无效的应用ID',
      };
      return false;
    }

    const userLev = ctx.auth?.userLev;

    // 超级管理员直接通过
    if (userLev === USER_LEVEL.SUPER_ADMIN) {
      return true;
    }

    // 开发者：检查是否有应用访问权限
    const userGuid = ctx.auth?.userId;
    const hasAccess = await ctx.service.mobileAppAccessService.hasAccess(appId, userGuid);

    if (hasAccess) {
      return true;
    }

    // 没有权限，设置响应
    ctx.status = 403;
    ctx.body = {
      code: 403,
      message: errorMessage || '没有权限操作该应用',
    };
    return false;
  }

  /**
   * 检查用户是否为应用的创建者或超级管理员
   * 只有创建者(permission=1)和超级管理员可以执行某些操作（如添加/删除用户）
   * @param {Object} ctx Egg Context
   * @param {Number} appId 应用ID
   * @param {String} errorMessage 自定义错误提示
   * @returns {Promise<boolean>} 是创建者或超级管理员返回true，否则返回false并设置响应
   */
  static async requireCreatorOrSuperAdmin(ctx, appId, errorMessage) {
    // 先检查用户级别（需要开发人员或更高级别）
    if (!this.checkPermission(ctx, USER_LEVEL.DEVELOPER, '需要开发人员或更高级别权限')) {
      return false;
    }

    // 检查应用ID有效性
    if (!appId || Number.isNaN(Number(appId))) {
      ctx.status = 400;
      ctx.body = {
        code: 400,
        message: '无效的应用ID',
      };
      return false;
    }

    const userLev = ctx.auth?.userLev;

    // 超级管理员直接通过
    if (userLev === USER_LEVEL.SUPER_ADMIN) {
      return true;
    }

    // 直接通过getUserPermission判断：一次查询即可判断用户是否在应用中以及其权限
    const userGuid = ctx.auth?.userId;
    const permission = await ctx.service.mobileAppAccessService.getUserPermission(appId, userGuid);
    
    // permission === APP_CREATOR 表示创建者，有权限
    if (permission === APP_USER_PERMISSION.APP_CREATOR) {
      return true;
    }

    // permission === null 表示用户不在应用中，permission === APP_DEVELOPER 表示开发者（无权限）
    ctx.status = 403;
    ctx.body = {
      code: 403,
      message: errorMessage || '只有应用创建者或超级管理员可以执行此操作',
    };
    return false;
  }
}

module.exports = {
  USER_LEVEL,
  USER_LEVEL_NAME,
  APP_USER_PERMISSION,
  APP_USER_PERMISSION_NAME,
  PermissionUtil,
};

