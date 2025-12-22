'use strict';

/**
 * 时间格式化工具
 * 将 ISO 格式时间（如 "2025-12-02T17:21:42.000Z"）转换为 "2025-12-02 17:21:42" 格式
 */

/**
 * 格式化单个时间值
 * @param {String|Date|null|undefined} dateValue - 时间值（ISO 字符串、Date 对象或 null/undefined）
 * @returns {String|null} 格式化后的时间字符串 "YYYY-MM-DD HH:mm:ss"，如果输入为 null/undefined 则返回 null
 */
function formatDateTime(dateValue) {
  if (!dateValue) {
    return null;
  }

  let date;
  if (dateValue instanceof Date) {
    date = dateValue;
  } else if (typeof dateValue === 'string') {
    // 处理 ISO 格式字符串
    date = new Date(dateValue);
    // 如果解析失败，返回原值
    if (isNaN(date.getTime())) {
      return dateValue;
    }
  } else {
    return null;
  }

  // 使用 UTC 时间（保持数据库返回的 UTC 时间值，不转换为本地时间）
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化对象中的时间字段
 * @param {Object} obj - 要处理的对象
 * @param {Array<String>} dateFields - 时间字段名数组（如 ['createTime', 'updateTime']）
 * @returns {Object} 处理后的对象
 */
function formatObjectDates(obj, dateFields = []) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // 默认的时间字段名（支持多种命名风格）
  const defaultDateFields = [
    'createTime', 'updateTime', 'create_time', 'CREATE_TIME', 'UPDATE_TIME',
    'feedbackTime', 'feedback_time', 'FEEDBACK_TIME',
    'deleteTime', 'delete_time', 'DELETE_TIME',
  ];

  const fieldsToFormat = dateFields.length > 0 ? dateFields : defaultDateFields;
  const result = Array.isArray(obj) ? [ ...obj ] : { ...obj };

  if (Array.isArray(result)) {
    return result.map(item => formatObjectDates(item, dateFields));
  }

  for (const key of Object.keys(result)) {
    const value = result[key];
    
    // 检查是否是时间字段
    if (fieldsToFormat.includes(key) || 
        (typeof key === 'string' && (key.toLowerCase().endsWith('time') || key.toLowerCase().endsWith('_time')))) {
      result[key] = formatDateTime(value);
    } else if (value && typeof value === 'object') {
      // 递归处理嵌套对象
      result[key] = formatObjectDates(value, dateFields);
    }
  }

  return result;
}

/**
 * 格式化数组中的时间字段
 * @param {Array} arr - 要处理的数组
 * @param {Array<String>} dateFields - 时间字段名数组
 * @returns {Array} 处理后的数组
 */
function formatArrayDates(arr, dateFields = []) {
  if (!Array.isArray(arr)) {
    return arr;
  }
  return arr.map(item => formatObjectDates(item, dateFields));
}

module.exports = {
  formatDateTime,
  formatObjectDates,
  formatArrayDates,
};

