'use strict';

module.exports = () => {
  const config = exports = {};

  // 达梦数据库配置示例
  config.dm = {
    dialect: 'dm',
    host: 'localhost',
    port: 5236,
    database: 'EGG_MINIMAL',
    username: 'SYSDBA',
    password: 'SYSDBA',
    timezone: '+08:00',
    define: {
      freezeTableName: true,
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  };

  // 人大金仓配置示例
  config.kingbase = {
    dialect: 'postgres', // 兼容PostgreSQL协议
    host: 'localhost',
    port: 54321,
    database: 'test',
    username: 'system',
    password: 'manager',
    timezone: '+08:00',
    define: {
      freezeTableName: true,
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  };

  // 南大通用GBase配置示例
  config.gbase = {
    dialect: 'mysql', // 支持MySQL协议
    host: 'localhost',
    port: 5258,
    database: 'testdb',
    username: 'root',
    password: 'password',
    timezone: '+08:00',
    define: {
      freezeTableName: true,
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  };

  // 华为GaussDB配置示例
  config.gaussdb = {
    dialect: 'postgres', // 兼容PostgreSQL
    host: 'localhost',
    port: 5432,
    database: 'gaussdb',
    username: 'gaussdb',
    password: 'password',
    timezone: '+08:00',
    define: {
      freezeTableName: true,
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  };

  return config;
};
