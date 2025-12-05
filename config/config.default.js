'use strict';

const path = require('path');

module.exports = appInfo => {
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1234567890';

  // add your middleware config here
  config.middleware = [ 'auth' ];

  // JWT配置
  config.jwt = {
    secret: appInfo.name + '_jwt_secret_key_change_in_production',
    expiresIn: '2h', // Token过期时间：2小时
    refreshExpiresIn: '7d', // 刷新Token过期时间
  };

  // 安全配置 - 全局关闭 CSRF 校验（适用于纯后端API + JWT）
  config.security = {
    csrf: {
      enable: false,
    },
  };

  // 文件上传配置
  config.multipart = {
    mode: 'stream', // 使用流模式
    fileSize: '200mb', // 最大文件大小：200MB（支持APK安装包）
    // 允许的文件扩展名：图片、APK安装包等
    whitelist: [ 
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', // 图片格式
      '.apk', '.xapk', // APK安装包格式
    ],
    // 自定义文件名验证函数，允许中文字符
    checkFile(fieldName, fileStream, fileName) {
      // 如果没有文件，直接返回
      if (!fileStream || !fileName) return null;
      
      // 获取文件扩展名（转换为小写）
      const ext = path.extname(fileName).toLowerCase();
      
      // 检查扩展名是否在 whitelist 中
      const allowedExts = [ 
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
        '.apk', '.xapk',
      ];
      
      if (!allowedExts.includes(ext)) {
        const err = new Error(`不支持的文件类型: ${ext}，仅支持: ${allowedExts.join(', ')}`);
        err.status = 400;
        return err;
      }
      
      // 验证通过，返回 null
      return null;
    },
  };

  // MySQL 配置（从环境变量读取，如果没有环境变量则使用默认值）
  // 正式部署时通过环境变量配置，调试环境在 config.local.js 中配置
  config.mysql = {
    client: {
      host: process.env.MYSQL_HOST || 'dbconn.sealoshzh.site',
      port: process.env.MYSQL_PORT || '42548',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'egg_minimal',
    },
    app: true,
    agent: false,
  };

  // Sequelize ORM 配置（从环境变量读取）
  config.sequelize = {
    dialect: 'mysql',
    host: process.env.MYSQL_HOST || 'dbconn.sealoshzh.site',
    port: parseInt(process.env.MYSQL_PORT || '42548'),
    database: process.env.MYSQL_DATABASE || 'egg_minimal',
    username: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    timezone: '+08:00',
    define: {
      freezeTableName: true,
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  };

  // Redis 配置（从环境变量读取）
  config.redis = {
    client: {
      port: parseInt(process.env.REDIS_PORT || '30725'),
      host: process.env.REDIS_HOST || 'dbconn.sealoshzh.site',
      username: process.env.REDIS_USERNAME || 'default',
      password: process.env.REDIS_PASSWORD || '',
      db: parseInt(process.env.REDIS_DB || '0'),
    },
  };

  // 阿里云OSS配置（敏感信息在 config.local.js 和 config.prod.js 中配置）
  // 这些文件已在 .gitignore 中，不会被提交到 Git
  config.oss = {
    region: process.env.OSS_REGION || 'oss-cn-hangzhou', // OSS区域
    accessKeyId: process.env.OSS_ACCESS_KEY_ID || '', // 从环境变量或 local/prod 配置读取
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '', // 从环境变量或 local/prod 配置读取
    bucket: process.env.OSS_BUCKET || 'platform-standard', // Bucket 名称
    endpoint: process.env.OSS_ENDPOINT || '', // 可选：自定义域名
    // 上传配置
    upload: {
      dir: 'avatars/', // 上传目录前缀
      maxSize: 5 * 1024 * 1024, // 最大文件大小：5MB
      allowedMimeTypes: [ 'image/jpeg', 'image/png', 'image/gif', 'image/webp' ], // 允许的文件类型
    },
  };

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  return {
    ...config,
    ...userConfig,
  };
};