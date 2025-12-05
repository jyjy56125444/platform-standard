'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    // 跳转到前端文档页面（Vue 结构化版本）
    ctx.redirect('/public/docs/index.html');
  }

  async health() {
    const { ctx } = this;
    if (!ctx.app.mysql || typeof ctx.app.mysql.query !== 'function') {
      ctx.body = {
        status: 'unhealthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: 'not_configured',
        hint: '未启用 egg-mysql 或未正确配置数据库（config/plugin.js 或 config/config.default.js）'
      };
      return;
    }

    try {
      await ctx.app.mysql.query('SELECT 1');
      ctx.body = {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: 'connected'
      };
    } catch (error) {
      ctx.body = {
        status: 'unhealthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message
      };
    }
  }

  // 主页与健康检查以外，不再包含用户相关接口
}

module.exports = HomeController;
