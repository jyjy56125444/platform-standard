'use strict';

module.exports = {
  // 启用数据库插件
  mysql: {
    enable: true,
    package: 'egg-mysql',
  },

  // 启用Sequelize ORM插件
  sequelize: {
    enable: true,
    package: 'egg-sequelize',
  },

  // 启用Redis插件
  redis: {
    enable: true,
    package: 'egg-redis',
  },
};
