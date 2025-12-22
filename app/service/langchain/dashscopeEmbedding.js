'use strict';

const { Embeddings } = require('@langchain/core/embeddings');

/**
 * DashScope Embedding 自定义类
 * 封装 DashScope API 调用，实现 LangChain Embeddings 接口
 * 支持文本模型（text-embedding-v4）和多模态模型（qwen2.5-vl-embedding）
 */
class DashScopeEmbedding extends Embeddings {
  constructor(config) {
    super();
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://dashscope.aliyuncs.com/api/v1';
    this.model = config.embeddingModel || 'text-embedding-v4';
    this.dimension = config.embeddingDimension || 1024;
    // 判断是否为文本模型
    this.isTextModel = this.model.startsWith('text-embedding');
  }

  /**
   * 调用 DashScope HTTP API
   * @param {String} path - API 路径
   * @param {Object} data - 请求数据
   * @returns {Promise<Object>} 响应数据
   */
  async callDashScopeAPI(path, data) {
    const https = require('https');
    const http = require('http');

    return new Promise((resolve, reject) => {
      const url = new URL(`${this.baseUrl}${path}`);
      const isHttps = url.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      const postData = JSON.stringify(data);

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = httpModule.request(options, res => {
        let responseData = '';

        res.on('data', chunk => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(responseData);
            if (res.statusCode !== 200) {
              reject(new Error(`DashScope API 调用失败 (${res.statusCode}): ${result.message || responseData}`));
            } else {
              resolve(result);
            }
          } catch (error) {
            reject(new Error(`解析响应失败: ${error.message}`));
          }
        });
      });

      req.on('error', error => {
        reject(new Error(`请求失败: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * LangChain 标准接口：为文档生成向量
   * @param {Array<String>} texts - 文本数组
   * @returns {Promise<Array<Array<Number>>>} 向量数组
   */
  async embedDocuments(texts) {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('文本数组不能为空');
    }

    // 文本模型使用批量接口，多模态模型逐条请求
    if (this.isTextModel) {
      // text-embedding-v4 支持批量请求
      try {
        const response = await this.callDashScopeAPI(
          '/services/embeddings/text-embedding/text-embedding',
          {
            model: this.model,
            input: {
              texts: texts,
            },
            parameters: {
              text_type: 'document', // 文档类型
              dimensions: this.dimension, // 指定向量维度
            },
          }
        );

        if (response.code && response.code !== 'Success') {
          throw new Error(`DashScope API 调用失败: ${response.message || response.code}`);
        }

        const embeddings = response.output?.embeddings || [];
        if (!Array.isArray(embeddings) || embeddings.length !== texts.length) {
          throw new Error(`DashScope API 返回的向量数量不匹配: 期望${texts.length}，实际${embeddings.length}`);
        }

        return embeddings.map(item => {
          const vector = item.embedding;
          if (!Array.isArray(vector) || vector.length === 0) {
            throw new Error('DashScope API 返回的向量数据为空');
          }
          return vector;
        });
      } catch (error) {
        throw new Error(`批量文本向量化失败: ${error.message}`);
      }
    } else {
      // 多模态模型（qwen2.5-vl-embedding）逐条请求
      const results = [];
      for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        if (!text || typeof text !== 'string') {
          throw new Error(`第 ${i + 1} 条文本无效`);
        }
        try {
          const response = await this.callDashScopeAPI(
            '/services/embeddings/multimodal-embedding/multimodal-embedding',
            {
              model: this.model,
              input: {
                texts: [ text ],
                images: [],
              },
            }
          );

          if (response.code && response.code !== 'Success') {
            throw new Error(`DashScope API 调用失败: ${response.message || response.code}`);
          }

          const vector = response.output?.embeddings?.[0]?.embedding;
          if (!Array.isArray(vector) || vector.length === 0) {
            throw new Error('DashScope API 返回的向量数据为空');
          }
          results.push(vector);
        } catch (error) {
          throw new Error(`第 ${i + 1} 条文本向量化失败: ${error.message}`);
        }
        // 简单限流
        if (i + 1 < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 80));
        }
      }

      return results;
    }
  }

  /**
   * LangChain 标准接口：为查询生成向量
   * @param {String} text - 查询文本
   * @returns {Promise<Array<Number>>} 向量数组
   */
  async embedQuery(text) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('查询文本不能为空');
    }

    // 文本模型使用 query 类型以获得更好的检索效果
    if (this.isTextModel) {
      try {
        const response = await this.callDashScopeAPI(
          '/services/embeddings/text-embedding/text-embedding',
          {
            model: this.model,
            input: {
              texts: [ text ],
            },
            parameters: {
              text_type: 'query', // 查询类型，与 document 类型配对使用可获得更好的检索效果
              dimensions: this.dimension, // 指定向量维度
            },
          }
        );

        if (response.code && response.code !== 'Success') {
          throw new Error(`DashScope API 调用失败: ${response.message || response.code}`);
        }

        const vector = response.output?.embeddings?.[0]?.embedding;
        if (!Array.isArray(vector) || vector.length === 0) {
          throw new Error('DashScope API 返回的向量数据为空');
        }
        return vector;
      } catch (error) {
        throw new Error(`查询文本向量化失败: ${error.message}`);
      }
    } else {
      // 多模态模型复用 embedDocuments
      const results = await this.embedDocuments([text]);
      return results[0];
    }
  }
}

module.exports = DashScopeEmbedding;

