'use strict';

const Service = require('egg').Service;

/**
 * RAG 会话管理服务
 * 负责：会话创建、更新、消息管理、历史查询
 */
class RAGSessionService extends Service {
  /**
   * 创建新会话（前端显式调用）
   * @param {number} appId
   * @param {string} title
   * @returns {Promise<number>} SESSION_ID
   */
  async createSession(appId, title = '新会话') {
    const { ctx, app } = this;

    // 会话强依赖用户ID，否则无法通过外键约束
    const auth = ctx.auth || {};
    const rawUserId = auth.userId;
    const userId = rawUserId !== undefined && rawUserId !== null ? Number(rawUserId) : NaN;
    const userName = auth.username || null;

    if (!Number.isFinite(userId) || userId <= 0) {
      throw new Error('创建会话失败：缺少有效的用户ID');
    }

    const finalTitle = (title || '').trim().slice(0, 50) || '新会话';

    try {
      const result = await app.mysql.insert('rag_session', {
        APP_ID: appId,
        USER_ID: userId,
        USER_NAME: userName,
        SESSION_TITLE: finalTitle,
        STATUS: 0,
        EXTRA: null,
      });

      if (!result || result.affectedRows !== 1) {
        throw new Error('插入 rag_session 失败');
      }

      return result.insertId;
    } catch (error) {
      ctx.logger.error('[RAG 会话] 创建会话失败:', error);
      throw error;
    }
  }

  /**
   * 获取会话信息
   * @param {number} sessionId
   * @returns {Promise<{sessionId, appId, userId, userName, sessionTitle, status, extra, createTime, updateTime}|null>}
   */
  async getSession(sessionId) {
    const { ctx, app } = this;
    if (!sessionId || !Number.isFinite(sessionId)) {
      return null;
    }

    try {
      const rows = await app.mysql.query(
        `SELECT 
           SESSION_ID,
           APP_ID,
           USER_ID,
           USER_NAME,
           SESSION_TITLE,
           STATUS,
           EXTRA,
           CREATE_TIME,
           UPDATE_TIME
         FROM rag_session
         WHERE SESSION_ID = ?
         LIMIT 1`,
        [ sessionId ]
      );

      if (!rows || rows.length === 0) {
        return null;
      }

      const row = rows[0];
      return {
        sessionId: row.SESSION_ID,
        appId: row.APP_ID,
        userId: row.USER_ID,
        userName: row.USER_NAME,
        sessionTitle: row.SESSION_TITLE,
        status: row.STATUS,
        extra: row.EXTRA ? (typeof row.EXTRA === 'string' ? JSON.parse(row.EXTRA) : row.EXTRA) : null,
        createTime: row.CREATE_TIME,
        updateTime: row.UPDATE_TIME,
      };
    } catch (error) {
      ctx.logger.error('获取会话信息失败:', error);
      return null;
    }
  }

  /**
   * 删除会话（级联删除所有消息）
   * @param {number} sessionId
   * @returns {Promise<boolean>}
   */
  async deleteSession(sessionId) {
    const { ctx, app } = this;
    if (!sessionId || !Number.isFinite(sessionId)) {
      throw new Error('sessionId 参数无效');
    }

    try {
      // 由于外键约束 ON DELETE CASCADE，删除会话会自动删除所有相关消息
      const result = await app.mysql.query(
        'DELETE FROM rag_session WHERE SESSION_ID = ?',
        [ sessionId ]
      );

      return result && result.affectedRows > 0;
    } catch (error) {
      ctx.logger.error('[RAG 会话] 删除会话失败:', error);
      throw new Error(`删除会话失败: ${error.message}`);
    }
  }

  /**
   * 更新会话标题
   * @param {number} sessionId
   * @param {string} title - 标题（会自动截取到50字符）
   */
  async updateSessionTitle(sessionId, title) {
    const { ctx, app } = this;
    if (!sessionId || !Number.isFinite(sessionId)) {
      return;
    }

    const finalTitle = (title || '').trim().slice(0, 50) || '新会话';
    try {
      await app.mysql.update('rag_session', {
        SESSION_TITLE: finalTitle,
      }, {
        where: { SESSION_ID: sessionId },
      });
    } catch (error) {
      ctx.logger.warn('[RAG 会话] 更新会话标题失败:', error.message);
    }
  }

  /**
   * 追加会话消息
   * @param {number} appId
   * @param {number|null} sessionId
   * @param {{ role: 'user'|'assistant', content: string, sourceDocs?: any, tokensUsed?: number, responseTime?: number, streamed?: boolean }} message
   */
  async appendSessionMessage(appId, sessionId, message) {
    const { ctx, app } = this;

    if (!sessionId) return null; // 无有效会话ID时直接跳过

    const {
      role,
      content,
      sourceDocs = null,
      tokensUsed = 0,
      responseTime = 0,
      streamed = false,
    } = message || {};

    if (!role || !content) return null;

    const auth = ctx.auth || {};
    const rawUserId = auth.userId;
    const userId = rawUserId !== undefined && rawUserId !== null ? Number(rawUserId) : null;

    // user 消息带上 userId，assistant 消息可以为 null
    const isUser = role === 'user';
    const finalUserId = isUser && Number.isFinite(userId) && userId > 0 ? userId : null;

    try {
      const result = await app.mysql.insert('rag_session_message', {
        SESSION_ID: sessionId,
        APP_ID: appId,
        USER_ID: finalUserId,
        ROLE: role,
        CONTENT: content,
        SOURCE_DOCS: sourceDocs ? JSON.stringify(sourceDocs) : null,
        TOKENS_USED: tokensUsed,
        RESPONSE_TIME: responseTime || 0,
        STREAMED: streamed ? 1 : 0,
      });

      if (!result || result.affectedRows !== 1) {
        throw new Error('插入 rag_session_message 失败');
      }

      // 如果是用户消息，更新会话标题为用户的问题
      if (isUser && content) {
        await this.updateSessionTitle(sessionId, content);
      }

      return result.insertId;
    } catch (error) {
      ctx.logger.error('[RAG 会话] 保存会话消息失败:', error);
      return null;
    }
  }

  /**
   * 获取会话历史对话（最近 N 轮，用于上下文记忆）
   * @param {number} sessionId
   * @param {number} maxRounds - 最大轮次数（默认 3 轮，即 6 条消息）
   * @returns {Promise<string>} 格式化的历史对话文本，如果没有历史则返回空字符串
   */
  async getSessionHistory(sessionId, maxRounds = 3) {
    const { ctx, app } = this;
    if (!sessionId || !Number.isFinite(sessionId)) {
      return '';
    }

    try {
      // 获取最近 N*2 条消息（每轮包含 user + assistant）
      const limit = maxRounds * 2;
      const messages = await app.mysql.query(
        `SELECT ROLE, CONTENT, CREATE_TIME 
         FROM rag_session_message 
         WHERE SESSION_ID = ? 
         ORDER BY CREATE_TIME DESC 
         LIMIT ?`,
        [ sessionId, limit ]
      );

      if (!messages || messages.length === 0) {
        return '';
      }

      // 反转顺序（从旧到新），并按轮次配对
      const reversed = messages.reverse();
      const historyTexts = [];
      let currentRound = [];

      for (const msg of reversed) {
        if (msg.ROLE === 'user') {
          // 遇到新的 user 消息，先处理上一轮（如果有）
          if (currentRound.length === 2) {
            historyTexts.push(`[用户] ${currentRound[0].CONTENT}`);
            historyTexts.push(`[助手] ${currentRound[1].CONTENT}`);
          }
          currentRound = [ msg ];
        } else if (msg.ROLE === 'assistant' && currentRound.length === 1) {
          // 配对 assistant 消息
          currentRound.push(msg);
        }
      }

      // 处理最后一轮（如果完整）
      if (currentRound.length === 2) {
        historyTexts.push(`[用户] ${currentRound[0].CONTENT}`);
        historyTexts.push(`[助手] ${currentRound[1].CONTENT}`);
      }

      // 只取最后 N 轮（避免超过限制）
      const finalRounds = historyTexts.slice(-maxRounds * 2);
      if (finalRounds.length === 0) {
        return '';
      }

      return `你和用户之前的对话历史（仅供参考）：\n${finalRounds.join('\n')}\n\n`;
    } catch (error) {
      ctx.logger.warn('[RAG 会话] 获取历史对话失败:', error.message);
      return '';
    }
  }

  /**
   * 获取会话列表（支持分页）
   * @param {number} appId
   * @param {object} options { page, pageSize, userId, status, startTime, endTime }
   */
  async getSessions(appId, options = {}) {
    const { ctx, app } = this;
    const {
      page = 1,
      pageSize = 20,
      userId,
      status,
      startTime,
      endTime,
    } = options;

    const limit = Math.min(Number(pageSize) || 20, 100);
    const offset = (Number(page) - 1) * limit;

    const where = [ 'APP_ID = ?' ];
    const params = [ appId ];

    if (userId !== undefined && userId !== null && userId !== '') {
      where.push('USER_ID = ?');
      params.push(Number(userId));
    }

    if (status !== undefined && status !== null && status !== '') {
      where.push('STATUS = ?');
      params.push(Number(status));
    }

    if (startTime) {
      where.push('CREATE_TIME >= ?');
      params.push(startTime);
    }

    if (endTime) {
      where.push('CREATE_TIME <= ?');
      params.push(endTime);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    try {
      const countRows = await app.mysql.query(
        `SELECT COUNT(1) as total FROM rag_session ${whereSql}`,
        params
      );
      const total = countRows && countRows[0] ? Number(countRows[0].total) || 0 : 0;

      const list = await app.mysql.query(
        `SELECT 
           SESSION_ID,
           APP_ID,
           USER_ID,
           USER_NAME,
           SESSION_TITLE,
           STATUS,
           EXTRA,
           CREATE_TIME,
           UPDATE_TIME
         FROM rag_session
         ${whereSql}
         ORDER BY UPDATE_TIME DESC
         LIMIT ? OFFSET ?`,
        [ ...params, limit, offset ]
      );

      const normalizedList = (list || []).map(row => ({
        sessionId: row.SESSION_ID,
        appId: row.APP_ID,
        userId: row.USER_ID,
        userName: row.USER_NAME,
        sessionTitle: row.SESSION_TITLE,
        status: row.STATUS,
        extra: row.EXTRA ? (typeof row.EXTRA === 'string' ? JSON.parse(row.EXTRA) : row.EXTRA) : null,
        createTime: row.CREATE_TIME,
        updateTime: row.UPDATE_TIME,
      }));

      return {
        total,
        page: Number(page),
        pageSize: limit,
        totalPages: limit ? Math.ceil(total / limit) : 0,
        list: normalizedList,
      };
    } catch (error) {
      ctx.logger.error('获取会话列表失败:', error);
      throw new Error(`获取会话列表失败: ${error.message}`);
    }
  }

  /**
   * 获取会话消息列表（支持分页）
   * @param {number} sessionId
   * @param {object} options { page, pageSize, role }
   */
  async getSessionMessages(sessionId, options = {}) {
    const { ctx, app } = this;
    const {
      page = 1,
      pageSize = 50,
      role,
    } = options;

    if (!sessionId || !Number.isFinite(sessionId)) {
      throw new Error('sessionId 参数无效');
    }

    const limit = Math.min(Number(pageSize) || 50, 200);
    const offset = (Number(page) - 1) * limit;

    const where = [ 'SESSION_ID = ?' ];
    const params = [ sessionId ];

    if (role === 'user' || role === 'assistant') {
      where.push('ROLE = ?');
      params.push(role);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    try {
      const countRows = await app.mysql.query(
        `SELECT COUNT(1) as total FROM rag_session_message ${whereSql}`,
        params
      );
      const total = countRows && countRows[0] ? Number(countRows[0].total) || 0 : 0;

      const list = await app.mysql.query(
        `SELECT 
           MESSAGE_ID,
           SESSION_ID,
           APP_ID,
           USER_ID,
           ROLE,
           CONTENT,
           SOURCE_DOCS,
           TOKENS_USED,
           RESPONSE_TIME,
           STREAMED,
           CREATE_TIME
         FROM rag_session_message
         ${whereSql}
         ORDER BY CREATE_TIME ASC
         LIMIT ? OFFSET ?`,
        [ ...params, limit, offset ]
      );

      const normalizedList = (list || []).map(row => ({
        messageId: row.MESSAGE_ID,
        sessionId: row.SESSION_ID,
        appId: row.APP_ID,
        userId: row.USER_ID,
        role: row.ROLE,
        content: row.CONTENT,
        sourceDocs: row.SOURCE_DOCS ? (typeof row.SOURCE_DOCS === 'string' ? JSON.parse(row.SOURCE_DOCS) : row.SOURCE_DOCS) : null,
        tokensUsed: row.TOKENS_USED,
        responseTime: row.RESPONSE_TIME,
        streamed: row.STREAMED === 1,
        createTime: row.CREATE_TIME,
      }));

      return {
        total,
        page: Number(page),
        pageSize: limit,
        totalPages: limit ? Math.ceil(total / limit) : 0,
        list: normalizedList,
      };
    } catch (error) {
      ctx.logger.error('获取会话消息列表失败:', error);
      throw new Error(`获取会话消息列表失败: ${error.message}`);
    }
  }
}

module.exports = RAGSessionService;

