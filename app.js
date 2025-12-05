'use strict';

module.exports = app => {
  // 加载完成，注册工具类
  const JwtUtil = require('./app/utils/jwt');
  app.utils = app.utils || {};
  app.utils.jwt = new JwtUtil(app);
  // 注册大小写转换工具
  app.utils.case = require('./app/utils/case');
};

