'use strict';

const Service = require('egg').Service;
const DashScopeEmbedding = require('./dashscopeEmbedding');
const PromptTemplates = require('../../utils/promptTemplates');

/**
 * LangChain RAG Service
 * 负责：加载配置、初始化嵌入与向量库、问答与文档入库
 */
class RAGService extends Service {
  /**
   * 初始化 RAG 组件
   * @param {number} appId - 应用ID
   * @returns {Promise<{embedding, collectionName: string, config: object}>}
   */
  async initRAGComponents(appId) {
    const { ctx } = this;

    // 读取应用配置
    const config = await this.getAppConfig(appId);
    if (!config) {
      throw new Error(`应用 ${appId} 的 RAG 配置不存在`);
    }

    // 初始化 Embedding
    const embedding = new DashScopeEmbedding({
      apiKey: this.config.dashscope.apiKey,
      baseUrl: this.config.dashscope.baseUrl,
      embeddingModel: config.EMBEDDING_MODEL || this.config.dashscope.embeddingModel,
      embeddingDimension: config.VECTOR_DIMENSION || this.config.dashscope.embeddingDimension,
    });

    // 确保 Collection 存在
    const collectionName = config.MILVUS_COLLECTION || `rag_app_${appId}`;
    await ctx.service.langchain.milvusVectorStore.createCollection(
      collectionName,
      config.VECTOR_DIMENSION || 1024,
      {
        indexType: config.INDEX_TYPE || 'HNSW',
        indexParams: config.INDEX_PARAMS ? JSON.parse(config.INDEX_PARAMS) : {},
      }
    );

    // 确保 Collection 已加载（搜索前必须加载）
    await ctx.service.langchain.milvusVectorStore.ensureCollectionLoaded(collectionName);

    return { embedding, collectionName, config };
  }

  /**
   * 获取应用 RAG 配置
   * @param {number} appId
   * @returns {Promise<object|null>}
   */
  async getAppConfig(appId) {
    const { ctx, app } = this;
    try {
      const rows = await app.mysql.query(
        'SELECT * FROM rag_config WHERE APP_ID = ? AND STATUS = 1 LIMIT 1',
        [ appId ]
      );
      return rows && rows.length > 0 ? rows[0] : null;
    } catch (error) {
      ctx.logger.error('获取 RAG 配置失败:', error);
      throw new Error(`获取 RAG 配置失败: ${error.message}`);
    }
  }

  /**
   * 获取应用 RAG 配置（完整配置，包含所有字段）
   * @param {number} appId
   * @returns {Promise<object>} RAG 配置对象
   */
  async getRAGConfig(appId) {
    const config = await this.getAppConfig(appId);
    if (!config) {
      throw new Error(`应用 ${appId} 的 RAG 配置不存在`);
    }

    // 解析 JSON 字段
    let indexParams = null;
    if (config.INDEX_PARAMS) {
      try {
        indexParams = typeof config.INDEX_PARAMS === 'string' 
          ? JSON.parse(config.INDEX_PARAMS) 
          : config.INDEX_PARAMS;
      } catch (e) {
        this.ctx.logger.warn('解析 INDEX_PARAMS 失败:', e.message);
      }
    }

    let rerankParams = null;
    if (config.RERANK_PARAMS) {
      try {
        rerankParams = typeof config.RERANK_PARAMS === 'string' 
          ? JSON.parse(config.RERANK_PARAMS) 
          : config.RERANK_PARAMS;
      } catch (e) {
        this.ctx.logger.warn('解析 RERANK_PARAMS 失败:', e.message);
      }
    }

    let separators = null;
    if (config.CHUNK_SEPARATORS) {
      try {
        separators = typeof config.CHUNK_SEPARATORS === 'string' 
          ? JSON.parse(config.CHUNK_SEPARATORS) 
          : config.CHUNK_SEPARATORS;
        if (!Array.isArray(separators)) separators = null;
      } catch (e) {
        this.ctx.logger.warn('解析 CHUNK_SEPARATORS 失败，使用默认值:', e.message);
      }
    }

    // 默认分隔符
    if (!separators || separators.length === 0) {
      separators = [
        '\n\n\n', '\n\n', '\n', '。', '！', '？', '. ', '! ', '? ', ' ', '',
      ];
    }

    // 解析常用问题
    let commonQuestions = null;
    if (config.COMMON_QUESTIONS) {
      try {
        commonQuestions = typeof config.COMMON_QUESTIONS === 'string' 
          ? JSON.parse(config.COMMON_QUESTIONS) 
          : config.COMMON_QUESTIONS;
        if (!Array.isArray(commonQuestions)) commonQuestions = null;
      } catch (e) {
        this.ctx.logger.warn('解析 COMMON_QUESTIONS 失败:', e.message);
      }
    }

    // 返回原始数据库字段名，由 controller 层统一使用 toCamelCaseKeys 处理
    // 保留业务逻辑：JSON 解析、默认值设置等
    return {
      CONFIG_ID: config.CONFIG_ID,
      APP_ID: config.APP_ID,
      // Milvus Collection 配置
      MILVUS_COLLECTION: config.MILVUS_COLLECTION || `rag_app_${appId}`,
      VECTOR_DIMENSION: config.VECTOR_DIMENSION || 1024,
      // 模型配置
      EMBEDDING_MODEL: config.EMBEDDING_MODEL || 'text-embedding-v4',
      LLM_MODEL: config.LLM_MODEL || 'qwen-plus',
      // LLM Prompt 配置
      SYSTEM_PROMPT: config.SYSTEM_PROMPT || null,
      USER_PROMPT_TEMPLATE: config.USER_PROMPT_TEMPLATE || null,
      // LLM 参数配置
      LLM_TEMPERATURE: config.LLM_TEMPERATURE !== null && config.LLM_TEMPERATURE !== undefined 
        ? Number(config.LLM_TEMPERATURE) 
        : 0.7,
      LLM_MAX_TOKENS: config.LLM_MAX_TOKENS || 2000,
      LLM_TOP_P: config.LLM_TOP_P !== null && config.LLM_TOP_P !== undefined 
        ? Number(config.LLM_TOP_P) 
        : 0.8,
      // 检索配置
      TOP_K: config.TOP_K || 5,
      SIMILARITY_THRESHOLD: Number(config.SIMILARITY_THRESHOLD) || 0.4,
      // 索引配置
      INDEX_TYPE: config.INDEX_TYPE || 'HNSW',
      INDEX_PARAMS: indexParams || {},
      // Rerank 配置
      RERANK_ENABLED: Boolean(config.RERANK_ENABLED),
      RERANK_MODEL: config.RERANK_MODEL || null,
      RERANK_TOP_K: config.RERANK_TOP_K || 10,
      RERANK_PARAMS: rerankParams || {},
      // 文本分段配置
      CHUNK_MAX_LENGTH: config.CHUNK_MAX_LENGTH || 2048,
      CHUNK_OVERLAP: config.CHUNK_OVERLAP || 100,
      CHUNK_SEPARATORS: separators,
      // 常用问题配置
      COMMON_QUESTIONS: commonQuestions,
      // 系统字段
      STATUS: config.STATUS || 1,
      REMARK: config.REMARK || null,
      CREATE_TIME: config.CREATE_TIME,
      UPDATE_TIME: config.UPDATE_TIME,
      CREATOR: config.CREATOR || null,
      UPDATER: config.UPDATER || null,
    };
  }

  /**
   * 设置应用 RAG 配置（支持部分更新）
   * @param {number} appId
   * @param {object} configData - RAG 配置对象（所有字段可选）
   * @returns {Promise<object>} 更新后的配置
   */
  async setRAGConfig(appId, configData) {
    const { ctx, app } = this;
    try {
      const existing = await this.getAppConfig(appId);
      if (!existing) {
        throw new Error(`应用 ${appId} 的 RAG 配置不存在`);
      }

      const updateFields = [];
      const updateValues = [];

      // Milvus Collection 配置
      if (configData.milvusCollection !== undefined) {
        updateFields.push('MILVUS_COLLECTION = ?');
        updateValues.push(String(configData.milvusCollection));
      }
      if (configData.vectorDimension !== undefined) {
        const dim = Math.max(1, Number(configData.vectorDimension));
        updateFields.push('VECTOR_DIMENSION = ?');
        updateValues.push(dim);
      }

      // 模型配置
      if (configData.embeddingModel !== undefined) {
        updateFields.push('EMBEDDING_MODEL = ?');
        updateValues.push(String(configData.embeddingModel));
      }
      if (configData.llmModel !== undefined) {
        updateFields.push('LLM_MODEL = ?');
        updateValues.push(String(configData.llmModel));
      }

      // LLM Prompt 配置
      // 注意：SYSTEM_PROMPT 不允许用户自定义，统一从模板文件读取，此处忽略更新
      if (configData.userPromptTemplate !== undefined) {
        updateFields.push('USER_PROMPT_TEMPLATE = ?');
        updateValues.push(configData.userPromptTemplate === null || configData.userPromptTemplate === '' 
          ? null 
          : String(configData.userPromptTemplate));
      }

      // LLM 参数配置
      if (configData.llmTemperature !== undefined) {
        const temperature = Math.max(0, Math.min(2, Number(configData.llmTemperature)));
        updateFields.push('LLM_TEMPERATURE = ?');
        updateValues.push(temperature);
      }
      if (configData.llmMaxTokens !== undefined) {
        const maxTokens = Math.max(1, Math.min(8000, Number(configData.llmMaxTokens)));
        updateFields.push('LLM_MAX_TOKENS = ?');
        updateValues.push(maxTokens);
      }
      if (configData.llmTopP !== undefined) {
        const topP = Math.max(0, Math.min(1, Number(configData.llmTopP)));
        updateFields.push('LLM_TOP_P = ?');
        updateValues.push(topP);
      }

      // 检索配置
      if (configData.topK !== undefined) {
        const topK = Math.max(1, Number(configData.topK));
        updateFields.push('TOP_K = ?');
        updateValues.push(topK);
      }
      if (configData.similarityThreshold !== undefined) {
        const threshold = Math.max(0, Math.min(1, Number(configData.similarityThreshold)));
        updateFields.push('SIMILARITY_THRESHOLD = ?');
        updateValues.push(threshold);
      }

      // 索引配置
      if (configData.indexType !== undefined) {
        updateFields.push('INDEX_TYPE = ?');
        updateValues.push(String(configData.indexType));
      }
      if (configData.indexParams !== undefined) {
        const indexParams = configData.indexParams === null || configData.indexParams === '' 
          ? null 
          : JSON.stringify(configData.indexParams);
        updateFields.push('INDEX_PARAMS = ?');
        updateValues.push(indexParams);
      }

      // Rerank 配置
      if (configData.rerankEnabled !== undefined) {
        updateFields.push('RERANK_ENABLED = ?');
        updateValues.push(configData.rerankEnabled ? 1 : 0);
      }
      if (configData.rerankModel !== undefined) {
        updateFields.push('RERANK_MODEL = ?');
        updateValues.push(configData.rerankModel === null || configData.rerankModel === '' ? null : String(configData.rerankModel));
      }
      if (configData.rerankTopK !== undefined) {
        const rerankTopK = Math.max(1, Number(configData.rerankTopK));
        updateFields.push('RERANK_TOP_K = ?');
        updateValues.push(rerankTopK);
      }
      if (configData.rerankParams !== undefined) {
        const rerankParams = configData.rerankParams === null || configData.rerankParams === '' 
          ? null 
          : JSON.stringify(configData.rerankParams);
        updateFields.push('RERANK_PARAMS = ?');
        updateValues.push(rerankParams);
      }

      // 文本分段配置
      if (configData.chunkMaxLength !== undefined) {
        const maxLength = Math.max(1, Number(configData.chunkMaxLength));
        updateFields.push('CHUNK_MAX_LENGTH = ?');
        updateValues.push(maxLength);
      }
      if (configData.chunkOverlap !== undefined) {
        const overlap = Math.max(0, Number(configData.chunkOverlap));
        updateFields.push('CHUNK_OVERLAP = ?');
        updateValues.push(overlap);
      }
      if (configData.chunkSeparators !== undefined) {
        if (Array.isArray(configData.chunkSeparators) && configData.chunkSeparators.length > 0) {
          updateFields.push('CHUNK_SEPARATORS = ?');
          updateValues.push(JSON.stringify(configData.chunkSeparators));
        } else {
          throw new Error('chunkSeparators 必须是非空数组');
        }
      }

      // 常用问题配置
      if (configData.commonQuestions !== undefined) {
        if (configData.commonQuestions === null || configData.commonQuestions === '' || 
            (Array.isArray(configData.commonQuestions) && configData.commonQuestions.length === 0)) {
          // 还原为 NULL（null、空字符串或空数组都视为还原）
          updateFields.push('COMMON_QUESTIONS = NULL');
        } else if (Array.isArray(configData.commonQuestions)) {
          // 验证数组长度（最多3个）
          if (configData.commonQuestions.length > 3) {
            throw new Error('常用问题最多只能设置3个');
          }
          // 验证并处理每个问题对象
          const processedQuestions = configData.commonQuestions.map((q, index) => {
            // 先检查对象和字段存在性
            if (!q || typeof q !== 'object') {
              throw new Error('常用问题格式错误：每个问题必须是一个对象');
            }
            if (q.question === undefined || q.question === null) {
              throw new Error('常用问题格式错误：每个问题必须包含 question 字段');
            }
            if (typeof q.question !== 'string') {
              throw new Error('常用问题格式错误：question 字段必须是字符串');
            }
            // 再检查内容是否为空
            if (q.question.trim().length === 0) {
              throw new Error('常用问题不能为空');
            }
            // 构建处理后的问题对象：question 必传，order 选填（未传时使用数组索引）
            const processed = { question: q.question.trim() };
            if (q.order !== undefined && q.order !== null) {
              processed.order = Number(q.order);
            } else {
              processed.order = index + 1; // 从1开始
            }
            return processed;
          });
          updateFields.push('COMMON_QUESTIONS = ?');
          updateValues.push(JSON.stringify(processedQuestions));
        } else {
          throw new Error('commonQuestions 必须是数组、null 或空数组');
        }
      }

      // 系统字段
      if (configData.status !== undefined) {
        updateFields.push('STATUS = ?');
        updateValues.push(configData.status ? 1 : 0);
      }
      if (configData.remark !== undefined) {
        updateFields.push('REMARK = ?');
        updateValues.push(configData.remark === null || configData.remark === '' ? null : String(configData.remark));
      }

      if (updateFields.length === 0) {
        throw new Error('至少需要提供一个配置参数');
      }

      updateFields.push('UPDATE_TIME = NOW()');
      if (ctx.user && ctx.user.USER_NAME) {
        updateFields.push('UPDATER = ?');
        updateValues.push(ctx.user.USER_NAME);
      }
      updateValues.push(appId);

      await app.mysql.query(
        `UPDATE rag_config SET ${updateFields.join(', ')} WHERE APP_ID = ?`,
        updateValues
      );

      // 返回更新后的配置
      return await this.getRAGConfig(appId);
    } catch (error) {
      ctx.logger.error('设置 RAG 配置失败:', error);
      throw new Error(`设置 RAG 配置失败: ${error.message}`);
    }
  }

  /**
   * 删除应用 RAG 配置（重置为默认值）
   * @param {number} appId
   * @returns {Promise<boolean>}
   */
  async deleteRAGConfig(appId) {
    const { ctx, app } = this;
    try {
      const existing = await this.getAppConfig(appId);
      if (!existing) {
        throw new Error(`应用 ${appId} 的 RAG 配置不存在`);
      }

      // 查询应用名称，用于生成标准提示词
      const appRows = await app.mysql.query(
        'SELECT APP_NAME FROM mobile_app WHERE APP_ID = ? LIMIT 1',
        [ appId ]
      );
      const appName = appRows && appRows.length > 0 ? appRows[0].APP_NAME : '该应用';

      // 从模板文件生成标准提示词（根据应用名称）
      const systemPrompt = PromptTemplates.generateSystemPrompt(appName);
      const userPromptTemplate = PromptTemplates.generateUserPromptTemplate(appName);

      // 默认值
      const defaultSeparators = JSON.stringify([
        '\n\n\n', '\n\n', '\n', '。', '！', '？', '. ', '! ', '? ', ' ', '',
      ]);

      const updateFields = [
        'MILVUS_COLLECTION = ?',
        'VECTOR_DIMENSION = 1024',
        'EMBEDDING_MODEL = ?',
        'LLM_MODEL = ?',
        'SYSTEM_PROMPT = ?',
        'USER_PROMPT_TEMPLATE = ?',
        'LLM_TEMPERATURE = 0.70',
        'LLM_MAX_TOKENS = 2000',
        'LLM_TOP_P = 0.80',
        'TOP_K = 5',
        'SIMILARITY_THRESHOLD = 0.4',
        'INDEX_TYPE = ?',
        'INDEX_PARAMS = NULL',
        'RERANK_ENABLED = 0',
        'RERANK_MODEL = NULL',
        'RERANK_TOP_K = 10',
        'RERANK_PARAMS = NULL',
        'CHUNK_MAX_LENGTH = 2048',
        'CHUNK_OVERLAP = 100',
        'CHUNK_SEPARATORS = ?',
        'COMMON_QUESTIONS = NULL',
        'STATUS = 1',
        'REMARK = NULL',
        'UPDATE_TIME = NOW()',
      ];
      const updateValues = [
        `rag_app_${appId}`,
        ctx.app.config.dashscope?.embeddingModel || 'qwen2.5-vl-embedding',
        'qwen-plus',
        systemPrompt,
        userPromptTemplate,
        'HNSW',
        defaultSeparators,
      ];

      if (ctx.user && ctx.user.USER_NAME) {
        updateFields.push('UPDATER = ?');
        updateValues.push(ctx.user.USER_NAME);
      }
      updateValues.push(appId);

      await app.mysql.query(
        `UPDATE rag_config SET ${updateFields.join(', ')} WHERE APP_ID = ?`,
        updateValues
      );

      return true;
    } catch (error) {
      ctx.logger.error('删除 RAG 配置失败:', error);
      throw new Error(`删除 RAG 配置失败: ${error.message}`);
    }
  }

  /**
   * 获取应用分段配置（从 rag_config 表读取，兼容旧接口）
   * @param {number} appId
   * @returns {Promise<{maxLength: number, overlap: number, separators: string[]}>}
   */
  async getChunkConfig(appId) {
    const config = await this.getRAGConfig(appId);
    return {
      maxLength: config.CHUNK_MAX_LENGTH,
      overlap: config.CHUNK_OVERLAP,
      separators: config.CHUNK_SEPARATORS,
    };
  }

  /**
   * RAG 问答（非流式，单轮）
   * @param {number} appId
   * @param {string} question
   * @param {object} options
   */
  async ask(appId, question, options = {}) {
    const { ctx } = this;
    const start = Date.now();

    try {
      const { embedding, collectionName, config } = await this.initRAGComponents(appId);

      // 补充应用名称，确保提示词中的 {{appName}} 能被正确替换
      let appName = '该应用';
      try {
        const appRows = await this.app.mysql.query(
          'SELECT APP_NAME FROM mobile_app WHERE APP_ID = ? LIMIT 1',
          [ appId ]
        );
        if (appRows && appRows.length > 0 && appRows[0].APP_NAME) {
          appName = appRows[0].APP_NAME;
        }
      } catch (e) {
        ctx.logger.warn('获取应用名称失败，将使用默认名称「该应用」:', e.message);
      }

      // 模板变量（后续如需扩展，可在此对象中继续增加）
      const templateVars = { appName };

      // SYSTEM_PROMPT：固定模板，不允许用户自定义，只从模板文件读取
      // 注意：{context} 和 {question} 将在检索完成后替换
      const systemPromptRaw = PromptTemplates.readTemplate('rag-system-prompt');
      const systemPromptWithAppName = PromptTemplates.replaceVariables(systemPromptRaw, templateVars);

      // USER_PROMPT_TEMPLATE：支持用户自定义（不包含 {context} 和 {question}，这些在 systemPrompt 中）
      const userPromptTemplateRaw = config.USER_PROMPT_TEMPLATE || PromptTemplates.readTemplate('rag-user-prompt');
      const userPromptTemplateResolved = PromptTemplates.replaceVariables(userPromptTemplateRaw, templateVars);

      const sessionId = options.sessionId !== undefined && options.sessionId !== null
        ? Number(options.sessionId)
        : null;

      // 1) 查询向量化
      const queryVector = await embedding.embedQuery(question);
      if (!Array.isArray(queryVector) || queryVector.length === 0) {
        throw new Error('查询向量生成失败：向量为空');
      }

      // 2) 检索
      const topK = options.topK || config.TOP_K || 5;
      const threshold = options.threshold !== undefined
        ? options.threshold
        : (config.SIMILARITY_THRESHOLD !== null && config.SIMILARITY_THRESHOLD !== undefined
          ? Number(config.SIMILARITY_THRESHOLD)
          : 0.4);

      const searchResults = await ctx.service.langchain.milvusVectorStore.similaritySearch(
        collectionName,
        queryVector,
        topK,
        threshold
      );

      // 3) 获取会话历史（如果有 sessionId）
      const historyText = sessionId ? await ctx.service.langchain.ragSessionService.getSessionHistory(sessionId, 3) : '';

      if (searchResults.length === 0) {
        // 检索不到相关文档时，使用无上下文提示词模板
        const noContextSystemPrompt = PromptTemplates.generateNoContextSystemPrompt(appName);
        const noContextUserPrompt = PromptTemplates.generateNoContextUserPrompt(question);
        const fullPromptNoContext = `${noContextSystemPrompt}\n\n${noContextUserPrompt}`;

        const llmResultNoContext = await ctx.service.langchain.llmService.generate(fullPromptNoContext, {
          llmModel: config.LLM_MODEL || 'qwen-plus',
          temperature: config.LLM_TEMPERATURE !== null && config.LLM_TEMPERATURE !== undefined
            ? Number(config.LLM_TEMPERATURE)
            : 0.7,
          maxTokens: config.LLM_MAX_TOKENS || 2000,
          topP: config.LLM_TOP_P !== null && config.LLM_TOP_P !== undefined
            ? Number(config.LLM_TOP_P)
            : 0.8,
        });

        const responseTime = Date.now() - start;

        // 会话消息记录
        if (sessionId) {
          await ctx.service.langchain.ragSessionService.appendSessionMessage(appId, sessionId, {
            role: 'user',
            content: question,
          });
          await ctx.service.langchain.ragSessionService.appendSessionMessage(appId, sessionId, {
            role: 'assistant',
            content: llmResultNoContext.text,
            sourceDocs: [],
            tokensUsed: llmResultNoContext.usage?.total_tokens || 0,
            responseTime,
            streamed: false,
          });
        }

        return {
          answer: llmResultNoContext.text,
          sources: [], // 无检索来源
          usage: llmResultNoContext.usage || {},
          responseTime,
          sessionId,
        };
      }

      // 4) 构建 Prompt
      const context = searchResults.map((r, idx) => `[${idx + 1}] ${r.text}`).join('\n\n');
      // 如果有历史对话，先插入历史，再插入 context
      const contextWithHistory = historyText 
        ? `${historyText}以下是关于"${appName}"的相关文档内容：\n\n${context}`
        : context;
      // 替换 systemPrompt 中的 {context} 和 {question}
      const systemPrompt = PromptTemplates.replaceVariables(systemPromptWithAppName, { context: contextWithHistory, question });
      // userPrompt 不再包含 {context} 和 {question}，直接使用
      const userPrompt = userPromptTemplateResolved || '请回答用户的问题。';
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

      // 4) 调用 LLM
      const llmResult = await ctx.service.langchain.llmService.generate(fullPrompt, {
        llmModel: config.LLM_MODEL || 'qwen-plus',
        temperature: config.LLM_TEMPERATURE !== null && config.LLM_TEMPERATURE !== undefined 
          ? Number(config.LLM_TEMPERATURE) 
          : 0.7,
        maxTokens: config.LLM_MAX_TOKENS || 2000,
        topP: config.LLM_TOP_P !== null && config.LLM_TOP_P !== undefined 
          ? Number(config.LLM_TOP_P) 
          : 0.8,
      });

      const responseTime = Date.now() - start;

      const sources = searchResults.map(r => ({ text: r.text, score: r.score, metadata: r.metadata }));

      // 会话消息记录
      if (sessionId) {
        await ctx.service.langchain.ragSessionService.appendSessionMessage(appId, sessionId, {
          role: 'user',
          content: question,
        });
        await ctx.service.langchain.ragSessionService.appendSessionMessage(appId, sessionId, {
          role: 'assistant',
          content: llmResult.text,
          sourceDocs: sources,
          tokensUsed: llmResult.usage?.total_tokens || 0,
          responseTime,
          streamed: false,
        });
      }

      return {
        answer: llmResult.text,
        sources,
        usage: llmResult.usage || {},
        responseTime,
        sessionId,
      };
    } catch (error) {
      ctx.logger.error('RAG 问答失败:', error);
      throw new Error(`RAG 问答失败: ${error.message}`);
    }
  }

  /**
   * RAG 问答（流式，单轮）
   * @param {number} appId
   * @param {string} question
   * @param {object} options
   * @param {(chunk: { delta: string, done: boolean }) => void} onDelta - 流式增量回调
   * @returns {Promise<{ answer: string, sources: Array, usage: object, responseTime: number }>}
   */
  async askStream(appId, question, options = {}, onDelta) {
    const { ctx } = this;
    const start = Date.now();

    if (typeof onDelta !== 'function') {
      throw new Error('askStream 需要提供 onDelta 回调函数');
    }

    try {
      const { embedding, collectionName, config } = await this.initRAGComponents(appId);

      // 补充应用名称，确保提示词中的 {{appName}} 能被正确替换
      let appName = '该应用';
      try {
        const appRows = await this.app.mysql.query(
          'SELECT APP_NAME FROM mobile_app WHERE APP_ID = ? LIMIT 1',
          [ appId ]
        );
        if (appRows && appRows.length > 0 && appRows[0].APP_NAME) {
          appName = appRows[0].APP_NAME;
        }
      } catch (e) {
        ctx.logger.warn('获取应用名称失败，将使用默认名称「该应用」:', e.message);
      }

      const templateVars = { appName };

      // SYSTEM_PROMPT：固定模板
      const systemPromptRaw = PromptTemplates.readTemplate('rag-system-prompt');
      const systemPromptWithAppName = PromptTemplates.replaceVariables(systemPromptRaw, templateVars);

      // USER_PROMPT_TEMPLATE：支持用户自定义
      const userPromptTemplateRaw = config.USER_PROMPT_TEMPLATE || PromptTemplates.readTemplate('rag-user-prompt');
      const userPromptTemplateResolved = PromptTemplates.replaceVariables(userPromptTemplateRaw, templateVars);

      const sessionId = options.sessionId !== undefined && options.sessionId !== null
        ? Number(options.sessionId)
        : null;

      // 1) 查询向量化
      const queryVector = await embedding.embedQuery(question);
      if (!Array.isArray(queryVector) || queryVector.length === 0) {
        throw new Error('查询向量生成失败：向量为空');
      }

      // 2) 检索
      const topK = options.topK || config.TOP_K || 5;
      const threshold = options.threshold !== undefined
        ? options.threshold
        : (config.SIMILARITY_THRESHOLD !== null && config.SIMILARITY_THRESHOLD !== undefined
          ? Number(config.SIMILARITY_THRESHOLD)
          : 0.4);

      const searchResults = await ctx.service.langchain.milvusVectorStore.similaritySearch(
        collectionName,
        queryVector,
        topK,
        threshold
      );

      // 3) 获取会话历史（如果有 sessionId）
      const historyText = sessionId ? await ctx.service.langchain.ragSessionService.getSessionHistory(sessionId, 3) : '';

      let fullPrompt;
      let sources = [];

      if (searchResults.length === 0) {
        // 无检索结果：使用无上下文提示词模板
        const noContextSystemPrompt = PromptTemplates.generateNoContextSystemPrompt(appName);
        const noContextUserPrompt = PromptTemplates.generateNoContextUserPrompt(question);
        fullPrompt = `${noContextSystemPrompt}\n\n${noContextUserPrompt}`;
        sources = [];
      } else {
        // 有检索结果：构建带上下文的 Prompt
        const context = searchResults.map((r, idx) => `[${idx + 1}] ${r.text}`).join('\n\n');
        // 如果有历史对话，先插入历史，再插入 context
        const contextWithHistory = historyText 
          ? `${historyText}以下是关于"${appName}"的相关文档内容：\n\n${context}`
          : context;
        const systemPrompt = PromptTemplates.replaceVariables(systemPromptWithAppName, { context: contextWithHistory, question });
        const userPrompt = userPromptTemplateResolved || '请回答用户的问题。';
        fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
        sources = searchResults.map(r => ({ text: r.text, score: r.score, metadata: r.metadata }));
      }

      // 4) 流式调用 LLM
      let answer = '';
      await ctx.service.langchain.llmService.generateStream(fullPrompt, {
        llmModel: config.LLM_MODEL || 'qwen-plus',
        temperature: config.LLM_TEMPERATURE !== null && config.LLM_TEMPERATURE !== undefined
          ? Number(config.LLM_TEMPERATURE)
          : 0.7,
        maxTokens: config.LLM_MAX_TOKENS || 2000,
        topP: config.LLM_TOP_P !== null && config.LLM_TOP_P !== undefined
          ? Number(config.LLM_TOP_P)
          : 0.8,
      }, chunk => {
        const { delta, done } = chunk || {};
        if (delta) {
          answer += delta;
        }
        // 将增量向上传递给 controller
        onDelta({ delta: delta || '', done: !!done });
      });

      const responseTime = Date.now() - start;

      // 会话消息记录（完整答案）
      if (sessionId) {
        await ctx.service.langchain.ragSessionService.appendSessionMessage(appId, sessionId, {
          role: 'user',
          content: question,
        });
        await ctx.service.langchain.ragSessionService.appendSessionMessage(appId, sessionId, {
          role: 'assistant',
          content: answer,
          sourceDocs: sources,
          tokensUsed: 0, // 暂不统计
          responseTime,
          streamed: true,
        });
      }

      return {
        answer,
        sources,
        usage: {}, // 流式暂不统计用量，后续可扩展
        responseTime,
        sessionId,
      };
    } catch (error) {
      ctx.logger.error('RAG 流式问答失败:', error);
      throw new Error(`RAG 流式问答失败: ${error.message}`);
    }
  }

  /**
   * 文档入库
   * @param {number} appId
   * @param {Array<{text: string, metadata?: object, id?: string}>} documents
   */
  async addDocuments(appId, documents) {
    const { ctx } = this;
    try {
      const { embedding, collectionName } = await this.initRAGComponents(appId);

      // 批量向量化
      const texts = documents.map(doc => doc.text);
      const vectors = await embedding.embedDocuments(texts);

      // 简单校验：向量数量与文档数量一致
      if (!Array.isArray(vectors) || vectors.length !== documents.length) {
        throw new Error(`向量数量与文档数量不一致: docs=${documents.length}, vectors=${vectors?.length || 0}`);
      }

      const payload = documents.map((doc, i) => ({
        id: doc.id || `doc_${Date.now()}_${i}`,
        text: doc.text,
        vector: vectors[i],
        metadata: doc.metadata || {},
      }));

      await ctx.service.langchain.milvusVectorStore.addDocuments(collectionName, payload);
      return { success: true, count: payload.length };
    } catch (error) {
      ctx.logger.error('文档入库失败:', error);
      throw new Error(`文档入库失败: ${error.message}`);
    }
  }

}

module.exports = RAGService;

