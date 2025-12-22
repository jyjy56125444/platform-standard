'use strict';

const Service = require('egg').Service;
const { MilvusClient, DataType } = require('@zilliz/milvus2-sdk-node');

/**
 * LangChain Milvus Vector Store 封装
 * 提供与 LangChain 兼容的 Milvus 向量存储操作
 */
class MilvusVectorStoreService extends Service {
  /**
   * 获取 Milvus 客户端
   * @param {Object} options - 连接选项
   * @returns {MilvusClient} Milvus 客户端实例
   */
  getClient(options = {}) {
    const config = this.config.milvus || {};
    
    return new MilvusClient({
      address: options.address || config.address || 'dbconn.sealoshzh.site:49174',
      username: options.username || config.username,
      password: options.password || config.password,
    });
  }

  /**
   * 创建或获取 Collection
   * @param {String} collectionName - Collection 名称
   * @param {Number} dimension - 向量维度
   * @param {Object} options - 可选参数
   * @returns {Promise<Object>} Collection 信息
   */
  async createCollection(collectionName, dimension, options = {}) {
    const { ctx } = this;
    const client = this.getClient();

    try {
      // 检查 Collection 是否已存在
      const hasCollection = await client.hasCollection({ collection_name: collectionName });
      
      if (hasCollection.value) {
        ctx.logger.info(`Collection ${collectionName} 已存在`);
        return { exists: true, collectionName };
      }

      // 创建 Collection Schema
      const schema = {
        collection_name: collectionName,
        description: options.description || `RAG Collection for ${collectionName}`,
        fields: [
          {
            name: 'id',
            data_type: DataType.VarChar,
            max_length: 100,
            is_primary_key: true,
          },
          {
            name: 'text',
            data_type: DataType.VarChar,
            max_length: 65535,
          },
          {
            name: 'vector',
            data_type: DataType.FloatVector,
            dim: dimension,
          },
          {
            name: 'metadata',
            data_type: DataType.JSON,
          },
        ],
      };

      // 创建 Collection
      await client.createCollection(schema);

      // 创建索引（如果指定了索引类型）
      if (options.indexType) {
        await this.createIndex(collectionName, options.indexType, options.indexParams);
      }

      ctx.logger.info(`Collection ${collectionName} 创建成功，向量维度: ${dimension}`);
      return { exists: false, collectionName };
    } catch (error) {
      ctx.logger.error(`创建 Collection 失败:`, error);
      throw new Error(`创建 Collection 失败: ${error.message}`);
    }
  }

  /**
   * 创建索引
   * @param {String} collectionName - Collection 名称
   * @param {String} indexType - 索引类型（HNSW/IVF_FLAT/IVF_PQ/AUTOINDEX）
   * @param {Object} indexParams - 索引参数
   */
  async createIndex(collectionName, indexType = 'HNSW', indexParams = {}) {
    const { ctx } = this;
    const client = this.getClient();

    try {
      let params = {};

      // 根据索引类型设置参数
      if (indexType === 'HNSW') {
        params = {
          M: indexParams.M || 16,
          efConstruction: indexParams.efConstruction || 200,
        };
      } else if (indexType === 'IVF_FLAT' || indexType === 'IVF_PQ') {
        params = {
          nlist: indexParams.nlist || 1024,
        };
        if (indexType === 'IVF_PQ') {
          params.m = indexParams.m || 8;
        }
      } else if (indexType === 'AUTOINDEX') {
        // AUTOINDEX 不需要参数
      }

      const indexParam = {
        collection_name: collectionName,
        field_name: 'vector',
        index_type: indexType,
        metric_type: 'COSINE',
        params,
      };

      await client.createIndex(indexParam);
      ctx.logger.info(`Collection ${collectionName} 索引创建成功，类型: ${indexType}`);
    } catch (error) {
      ctx.logger.error(`创建索引失败:`, error);
      throw new Error(`创建索引失败: ${error.message}`);
    }
  }

  /**
   * 确保 Collection 已加载到内存（搜索前必须加载）
   * @param {String} collectionName - Collection 名称
   */
  async ensureCollectionLoaded(collectionName) {
    const { ctx } = this;
    const client = this.getClient();

    try {
      // 检查 Collection 是否存在
      const hasCollection = await client.hasCollection({ collection_name: collectionName });
      if (!hasCollection.value) {
        return;
      }

      // 检查加载状态（兼容枚举和字符串格式）
      try {
        const loadState = await client.getLoadState({ collection_name: collectionName });
        const stateValue = loadState.state?.toString() || String(loadState.state);
        const isLoaded = stateValue.includes('Loaded');
        
        if (!isLoaded) {
          await client.loadCollection({ collection_name: collectionName });
        }
      } catch (loadError) {
        // 如果 getLoadState 失败，尝试直接 load
        await client.loadCollection({ collection_name: collectionName });
      }
    } catch (error) {
      ctx.logger.error(`[确保加载] Collection "${collectionName}" 加载失败: ${error.message}`);
      throw new Error(`确保 Collection 加载失败: ${error.message}`);
    }
  }

  /**
   * 添加文档到 Vector Store
   * @param {String} collectionName - Collection 名称
   * @param {Array<Object>} documents - 文档数组，格式: [{id, text, vector, metadata}]
   */
  async addDocuments(collectionName, documents) {
    const { ctx } = this;
    const client = this.getClient();

    try {
      const data = documents.map(doc => ({
        id: doc.id,
        text: doc.text,
        vector: doc.vector,
        metadata: JSON.stringify(doc.metadata || {}),
      }));

      await client.insert({
        collection_name: collectionName,
        data,
      });

      // 刷新数据
      await client.flush({ collection_names: [collectionName] });

      // 确保 Collection 已加载（搜索前必须加载）
      await this.ensureCollectionLoaded(collectionName);

      ctx.logger.info(`成功添加 ${documents.length} 条文档到 Collection ${collectionName}`);
    } catch (error) {
      ctx.logger.error(`添加文档失败:`, error);
      throw new Error(`添加文档失败: ${error.message}`);
    }
  }

  /**
   * 向量相似度搜索
   * @param {String} collectionName - Collection 名称
   * @param {Array<Number>} queryVector - 查询向量
   * @param {Number} topK - 返回 Top K 结果
   * @param {Number} threshold - 相似度阈值（0-1）
   * @returns {Promise<Array<Object>>} 搜索结果
   */
  async similaritySearch(collectionName, queryVector, topK = 5, threshold = 0.7) {
    const { ctx } = this;
    const client = this.getClient();

    try {
      // 检查 Collection 是否存在
      const hasCollection = await client.hasCollection({ collection_name: collectionName });
      if (!hasCollection.value) {
        ctx.logger.error(`[向量搜索] Collection "${collectionName}" 不存在`);
        return [];
      }

      // 确保 Collection 已加载（必需：Milvus Collection 必须加载到内存才能搜索）
      await this.ensureCollectionLoaded(collectionName);

      // 验证查询向量格式
      if (!Array.isArray(queryVector) || queryVector.length === 0) {
        throw new Error('查询向量格式错误：必须是非空数组');
      }
      const normalizedVector = queryVector.map(v => Number(v));
      if (normalizedVector.some(v => !Number.isFinite(v))) {
        throw new Error('查询向量包含非数字值');
      }

      // 构建搜索请求（Milvus 2.4.x 格式）
      const ef = Math.max(topK * 2, 100);
      const results = await client.search({
        collection_name: collectionName,
        data: [normalizedVector],
        anns_field: 'vector',
        search_params: {
          metric_type: 'COSINE',
          params: JSON.stringify({ ef }),
          topk: topK,
        },
        limit: topK,
        output_fields: ['text'],
      });

      // 解析结果（Milvus 2.4.x：results.results 本身就是结果数组，每个元素包含 score 和 text）
      if (!results?.results || !Array.isArray(results.results) || results.results.length === 0) {
        ctx.logger.info(`[向量搜索] 原始结果: 0 条 (topK=${topK}, threshold=${threshold})`);
        return [];
      }

      // 简单输出原始结果条数和相似度
      const rawScores = results.results.map((item, idx) => ({
        index: idx,
        score: item.score !== undefined ? item.score : 0,
      }));
      ctx.logger.info(
        `[向量搜索] 原始结果: ${results.results.length} 条 (topK=${topK}, threshold=${threshold}), 相似度: ` +
        rawScores.map(s => `[${s.index}]${s.score}`).join(', ')
      );

      // 格式化结果并过滤
      const formattedResults = results.results
        .map((item, idx) => ({
          id: item.id || `result_${idx}`,
          text: item.text || '',
          metadata: item.metadata || {},
          score: item.score !== undefined ? item.score : 0,
        }))
        .filter(item => item.score >= threshold && item.text && item.text.trim().length > 0);
      
      ctx.logger.info(
        `[向量搜索] 过滤后结果: ${formattedResults.length} 条 (阈值=${threshold})`
      );
      
      return formattedResults;
    } catch (error) {
      ctx.logger.error(`[向量搜索] 搜索失败:`, error);
      throw new Error(`向量搜索失败: ${error.message}`);
    }
  }

  /**
   * 删除文档（通过 ID 数组）
   * @param {String} collectionName - Collection 名称
   * @param {Array<String>} ids - 文档 ID 数组
   */
  async deleteDocuments(collectionName, ids) {
    const { ctx } = this;
    const client = this.getClient();

    try {
      await client.delete({
        collection_name: collectionName,
        ids,
      });

      ctx.logger.info(`成功删除 ${ids.length} 条文档，Collection: ${collectionName}`);
    } catch (error) {
      ctx.logger.error(`删除文档失败:`, error);
      throw new Error(`删除文档失败: ${error.message}`);
    }
  }

  /**
   * 删除文档（通过表达式）
   * @param {String} collectionName - Collection 名称
   * @param {String} expr - 过滤表达式，如：id == 'xxx' 或 text like '%keyword%'
   */
  async deleteByExpr(collectionName, expr) {
    const { ctx } = this;
    const client = this.getClient();

    try {
      await client.delete({
        collection_name: collectionName,
        filter: expr,
      });

      ctx.logger.info(`成功通过表达式删除文档，Collection: ${collectionName}, Expr: ${expr}`);
    } catch (error) {
      ctx.logger.error(`通过表达式删除文档失败:`, error);
      throw new Error(`通过表达式删除文档失败: ${error.message}`);
    }
  }

  /**
   * 获取 Collection 详细信息
   * @param {String} collectionName - Collection 名称
   * @returns {Promise<Object>} Collection 信息
   */
  async getCollectionInfo(collectionName) {
    const { ctx } = this;
    const client = this.getClient();

    try {
      // 检查 Collection 是否存在
      const hasCollection = await client.hasCollection({ collection_name: collectionName });
      if (!hasCollection.value) {
        throw new Error(`Collection ${collectionName} 不存在`);
      }

      // 获取 Collection Schema
      const schemaResult = await client.describeCollection({ collection_name: collectionName });
      
      // 获取 Collection 统计信息
      const statsResult = await client.getCollectionStatistics({ collection_name: collectionName });
      
      // 获取索引信息
      let indexes = [];
      try {
        const indexInfo = await client.describeIndex({ collection_name: collectionName });
        indexes = indexInfo.index_descriptions || [];
      } catch (err) {
        ctx.logger.warn(`获取索引信息失败: ${err.message}`);
      }

      return {
        collectionName,
        collectionID: schemaResult.collectionID || '',
        schema: schemaResult.schema || [],
        stats: statsResult.stats || [],
        statsData: statsResult.data || {},
        indexes,
        rowCount: statsResult.data?.row_count || 0,
      };
    } catch (error) {
      ctx.logger.error(`获取 Collection 信息失败:`, error);
      throw new Error(`获取 Collection 信息失败: ${error.message}`);
    }
  }

  /**
   * 查询 Collection 数据
   * @param {String} collectionName - Collection 名称
   * @param {Object} options - 查询选项
   * @param {Number} options.limit - 返回数量限制（默认 10）
   * @param {Number} options.offset - 偏移量（默认 0）
   * @param {String} options.expr - 过滤表达式（可选，如：`id == 'xxx'` 或 `text like '%keyword%'`）
   * @param {Array<String>} options.outputFields - 输出字段列表（默认 ['id', 'text', 'metadata']）
   * @returns {Promise<Object>} 查询结果
   */
  async queryCollection(collectionName, options = {}) {
    const { ctx } = this;
    const client = this.getClient();

    try {
      const limit = options.limit || 10;
      const offset = options.offset || 0;
      const expr = options.expr || null;
      // 默认包含 vector 字段，但只返回维度提示（不返回完整向量数据）
      const outputFields = options.outputFields || ['id', 'text', 'metadata', 'vector'];

      // 构建查询参数
      const queryParams = {
        collection_name: collectionName,
        output_fields: outputFields,
        limit,
        offset,
      };

      if (expr) {
        queryParams.expr = expr;
      }

      const results = await client.query(queryParams);

      // 格式化结果
      const formattedResults = (results.data || []).map(item => ({
        id: item.id,
        text: item.text || '',
        metadata: item.metadata ? (typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata) : {},
        vector: item.vector ? `[${item.vector.length} dimensions]` : null, // 向量维度提示，不返回完整向量
      }));

      return {
        collectionName,
        total: formattedResults.length,
        limit,
        offset,
        data: formattedResults,
      };
    } catch (error) {
      ctx.logger.error(`查询 Collection 数据失败:`, error);
      throw new Error(`查询 Collection 数据失败: ${error.message}`);
    }
  }

  /**
   * 统计 Collection 中的文档数量
   * @param {String} collectionName - Collection 名称
   * @param {String} expr - 过滤表达式（可选）
   * @returns {Promise<Number>} 文档数量
   */
  async countCollection(collectionName, expr = null) {
    const { ctx } = this;
    const client = this.getClient();

    try {
      const params = {
        collection_name: collectionName,
      };

      if (expr) {
        params.expr = expr;
      }

      const result = await client.count(params);
      return result.data || 0;
    } catch (error) {
      ctx.logger.error(`统计 Collection 文档数量失败:`, error);
      throw new Error(`统计 Collection 文档数量失败: ${error.message}`);
    }
  }

  /**
   * 列出所有 Collections（使用 showCollections）
   * @returns {Promise<Array<String>>} Collection 名称列表
   */
  async listCollections() {
    const { ctx } = this;
    const client = this.getClient();

    try {
      const result = await client.showCollections();
      // showCollections 返回 CollectionData[]，包含 name, id, timestamp, loadedPercentage
      return (result.data || []).map(item => item.name || item);
    } catch (error) {
      ctx.logger.error('列出 Collections 失败:', error);
      throw new Error(`列出 Collections 失败: ${error.message}`);
    }
  }

  /**
   * 删除 Collection
   * @param {String} collectionName - Collection 名称
   * @returns {Promise<Boolean>} 是否删除成功
   */
  async deleteCollection(collectionName) {
    const { ctx } = this;
    const client = this.getClient();

    try {
      // 检查 Collection 是否存在
      const hasCollection = await client.hasCollection({ collection_name: collectionName });
      if (!hasCollection.value) {
        ctx.logger.info(`Collection ${collectionName} 不存在，跳过删除`);
        return false;
      }

      // 删除 Collection
      await client.dropCollection({ collection_name: collectionName });
      ctx.logger.info(`成功删除 Collection: ${collectionName}`);
      return true;
    } catch (error) {
      ctx.logger.error(`删除 Collection 失败:`, error);
      throw new Error(`删除 Collection 失败: ${error.message}`);
    }
  }
}

module.exports = MilvusVectorStoreService;

