'use strict';

/**
 * 位掩码工具函数
 * 用于处理多选平台类型的数组和位掩码之间的转换
 */

// 平台类型枚举（均为 2 的幂次，用于位掩码）
const PLATFORM_TYPE = {
  ANDROID: 1,          // Android
  IOS: 2,              // iOS
  HARMONYOS: 4,        // 鸿蒙
  WECHAT_H5: 8,        // 微信H5
  DINGTALK_H5: 16,     // 钉钉H5
  WEB_H5: 32,          // 独立网页H5
  WECHAT_MINI: 64,     // 微信小程序
  DINGTALK_MINI: 128,  // 钉钉小程序
};

const VALID_PLATFORM_VALUES = Object.values(PLATFORM_TYPE).sort((a, b) => a - b);
const ALLOWED_BITMASK = VALID_PLATFORM_VALUES.reduce((mask, value) => mask | value, 0);

function createPlatformError(message) {
  const error = new Error(message);
  error.code = 'INVALID_PLATFORM_VALUE';
  return error;
}

function normalizeToInteger(value) {
  const num = Number(value);
  if (!Number.isInteger(num)) {
    throw createPlatformError('平台值必须为整数');
  }
  return num;
}

function ensureValidPlatformBit(value) {
  if (!VALID_PLATFORM_VALUES.includes(value)) {
    throw createPlatformError(`不支持的平台值: ${value}`);
  }
}

function ensureValidBitmask(mask, { allowCombined = true } = {}) {
  if (mask <= 0) {
    throw createPlatformError('平台值必须大于 0');
  }
  if ((mask & ~ALLOWED_BITMASK) !== 0) {
    throw createPlatformError(`包含未定义的平台位: ${mask}`);
  }
  if (!allowCombined && !VALID_PLATFORM_VALUES.includes(mask)) {
    throw createPlatformError(`不支持的平台值: ${mask}`);
  }
}

/**
 * 将平台数组转换为位掩码
 * @param {Array<Number>|Number} platforms - 平台数组或单个平台值
 * @returns {Number} 位掩码值
 * @example
 * arrayToBitmask([1, 2, 4]) => 7
 * arrayToBitmask(7) => 7 (如果传入数字，直接返回)
 */
function arrayToBitmask(platforms) {
  if (platforms === null || platforms === undefined || platforms === '') {
    return null;
  }

  // 如果传入单个数字（或字符串形式的数字）
  if (!Array.isArray(platforms)) {
    const value = normalizeToInteger(platforms);
    ensureValidBitmask(value, { allowCombined: false });
    return value;
  }

  if (platforms.length === 0) {
    return null;
  }

  let mask = 0;
  for (const platform of platforms) {
    const value = normalizeToInteger(platform);
    ensureValidPlatformBit(value);
    mask |= value;
  }

  if (mask === 0) {
    return null;
  }

  ensureValidBitmask(mask);
  return mask;
}

/**
 * 将位掩码转换为平台数组
 * @param {Number} bitmask - 位掩码值
 * @returns {Array<Number>} 平台数组
 * @example
 * bitmaskToArray(7) => [1, 2, 4]
 * bitmaskToArray(null) => []
 */
function bitmaskToArray(bitmask) {
  if (bitmask === null || bitmask === undefined || bitmask === 0) {
    return [];
  }

  const mask = Number(bitmask);
  if (!Number.isInteger(mask) || mask <= 0) {
    return [];
  }

  const platforms = [];
  for (const value of VALID_PLATFORM_VALUES) {
    if ((mask & value) === value) {
      platforms.push(value);
    }
  }

  return platforms;
}

/**
 * 检查位掩码中是否包含指定平台
 * @param {Number} bitmask - 位掩码值
 * @param {Number} platform - 平台值
 * @returns {Boolean}
 * @example
 * hasPlatform(7, 1) => true
 * hasPlatform(7, 8) => false
 */
function hasPlatform(bitmask, platform) {
  if (!bitmask || !platform) {
    return false;
  }
  const mask = Number(bitmask);
  const value = Number(platform);
  if (!Number.isInteger(mask) || !Number.isInteger(value)) {
    return false;
  }
  return (mask & value) !== 0;
}

/**
 * 校验版本平台类型（versionType）
 * 1. 必须是单个有效的平台值（不能是组合值）
 * 2. 必须在应用支持的平台集合中
 * @param {Number} versionType - 版本平台类型
 * @param {Number} appType - 应用支持的平台位掩码
 * @throws {Error} 如果校验失败，抛出带有 code 的错误
 * @example
 * validateVersionType(1, 3) => 通过（app支持1和2，versionType是1）
 * validateVersionType(3, 3) => 抛出错误（versionType不能是组合值）
 * validateVersionType(4, 3) => 抛出错误（versionType不在app支持的平台中）
 */
function validateVersionType(versionType, appType) {
  if (versionType === null || versionType === undefined || versionType === '') {
    throw createPlatformError('版本平台类型不能为空');
  }

  const vt = normalizeToInteger(versionType);
  
  // 1. 校验 versionType 必须是单个有效的平台位（不能是组合值）
  ensureValidBitmask(vt, { allowCombined: false });

  // 2. 校验 versionType 是否在 appType 中
  if (!appType || appType === 0) {
    throw createPlatformError('应用未配置支持的平台');
  }

  const appMask = Number(appType);
  if (!Number.isInteger(appMask) || appMask <= 0) {
    throw createPlatformError('应用平台配置无效');
  }

  if (!hasPlatform(appMask, vt)) {
    const error = new Error('版本平台不在应用已支持的平台中');
    error.code = 'PLATFORM_NOT_ALLOWED';
    throw error;
  }
}

module.exports = {
  PLATFORM_TYPE,
  arrayToBitmask,
  bitmaskToArray,
  hasPlatform,
  validateVersionType,
};

