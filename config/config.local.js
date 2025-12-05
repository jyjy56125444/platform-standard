'use strict';

module.exports = () => {
  const config = exports = {};

  // 日志配置（开发环境）
  config.logger = {
    level: 'DEBUG',
    consoleLevel: 'DEBUG',
  };

  // 提升 coreLogger 的控制台级别，便于观察 egg-mysql 的 INFO 日志
  config.coreLogger = {
    consoleLevel: 'INFO',
  };

  // 开发环境数据库配置
  config.mysql = {
    client: {
      host: 'dbconn.sealoshzh.site',
      port: '42548',
      user: 'root',
      password: 'hn4sdk5v',
      database: 'egg_minimal', // 开发/测试环境
    },
    app: true,
    agent: false,
  };

  // Sequelize ORM 配置（开发环境）
  config.sequelize = {
    dialect: 'mysql', // 支持 mysql, postgres, sqlite, mariadb, mssql, db2, snowflake, oracle, dm, kingbase
    host: 'dbconn.sealoshzh.site',
    port: 42548,
    database: 'egg_minimal', // 开发/测试环境
    username: 'root',
    password: 'hn4sdk5v',
    timezone: '+08:00',
    define: {
      freezeTableName: true,
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  };

  // Redis 配置（开发环境）
  config.redis = {
    client: {
      port: 30725,
      host: 'dbconn.sealoshzh.site',
      username: 'default',
      password: 'txs8k6nf',
      db: 0, // 开发环境使用 db 0
    },
  };

  return config;
};
