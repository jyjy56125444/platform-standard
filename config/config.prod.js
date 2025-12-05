'use strict';

module.exports = () => {
  const config = exports = {};

  // 日志配置（生产环境）
  config.logger = {
    level: 'INFO',
    consoleLevel: 'INFO',
  };

  // 生产环境数据库配置
  config.mysql = {
    client: {
      host: 'dbconn.sealoshzh.site',
      port: '42548',
      user: 'root',
      password: 'hn4sdk5v',
      database: 'egg_minimal_prod', // 生产环境使用独立的数据库
    },
    app: true,
    agent: false,
  };

  // Sequelize ORM 配置（生产环境）
  config.sequelize = {
    dialect: 'mysql', // 支持 mysql, postgres, sqlite, mariadb, mssql, db2, snowflake, oracle, dm, kingbase
    host: 'dbconn.sealoshzh.site',
    port: 42548,
    database: 'egg_minimal_prod', // 生产环境使用独立的数据库
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

  // Redis 配置（生产环境）
  config.redis = {
    client: {
      port: 30725,
      host: 'dbconn.sealoshzh.site',
      username: 'default',
      password: 'txs8k6nf',
      db: 1, // 生产环境使用 db 1
    },
  };

  return config;
};
