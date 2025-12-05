'use strict';

// 将 SNAKE_CASE 或 UPPER_SNAKE_CASE 转为 camelCase
function toCamelCase(str) {
  return String(str).toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase());
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
    if (Array.isArray(value)) {
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


