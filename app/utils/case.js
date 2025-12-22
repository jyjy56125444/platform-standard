'use strict';

const { formatDateTime } = require('./dateFormat');

// 将 SNAKE_CASE 或 UPPER_SNAKE_CASE 转为 camelCase
function toCamelCase(str) {
  return String(str).toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * 判断是否是时间字段
 * @param {String} key - 字段名
 * @returns {Boolean}
 */
function isDateTimeField(key) {
  if (!key || typeof key !== 'string') return false;
  const lowerKey = key.toLowerCase();
  return lowerKey.endsWith('time') || lowerKey.endsWith('_time') || lowerKey === 'date' || lowerKey.endsWith('_date');
}

/**
 * 格式化时间值
 * @param {*} value - 时间值
 * @returns {String|null} 格式化后的时间字符串
 */
function formatDateTimeValue(value) {
  if (!value) return null;
  return formatDateTime(value);
}

function convertObjectKeysToCamelCase(obj) {
  if (obj == null) return obj;
  // 非普通对象（如 Date/RegExp/Buffer/Map/Set 等）直接返回
  const isPlainObject = Object.prototype.toString.call(obj) === '[object Object]';
  if (!isPlainObject) {
    if (Array.isArray(obj)) {
      return obj.map(item => (typeof item === 'object' ? convertObjectKeysToCamelCase(item) : item));
    }
    return obj;
  }
  const result = {};
  for (const key of Object.keys(obj)) {
    const camelKey = toCamelCase(key);
    const value = obj[key];
    
    // 如果是时间字段，格式化时间值
    if (isDateTimeField(key) || isDateTimeField(camelKey)) {
      result[camelKey] = formatDateTimeValue(value);
    } else if (Array.isArray(value)) {
      result[camelKey] = value.map(item => (item && typeof item === 'object' ? convertObjectKeysToCamelCase(item) : item));
    } else if (value && Object.prototype.toString.call(value) === '[object Object]') {
      result[camelKey] = convertObjectKeysToCamelCase(value);
    } else {
      result[camelKey] = value;
    }
  }
  return result;
}

function toCamelCaseKeys(input) {
  if (Array.isArray(input)) {
    return input.map(item => convertObjectKeysToCamelCase(item));
  }
  if (input && typeof input === 'object') {
    return convertObjectKeysToCamelCase(input);
  }
  return input;
}

module.exports = {
  toCamelCaseKeys,
};


