'use strict';

const Controller = require('egg').Controller;

/**
 * Milvus 向量库查询控制器
 * 提供集合列表、集合信息、集合数据查询等功能
 */
class MilvusController extends Controller {
  /**
   * 列出所有 Collections
   * GET /api/milvus/collections
   */
  async listCollections() {
    const { ctx } = this;
    try {
      const collections = await ctx.service.langchain.milvusVectorStore.listCollections();
      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          collections,
          count: collections.length,
        },
      };
    } catch (error) {
      ctx.logger.error('列出 Collections 失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '列出 Collections 失败',
        error: error.message,
      };
    }
  }

  /**
   * 获取 Collection 详细信息
   * GET /api/milvus/collections/:collectionName
   */
  async getCollectionInfo() {
    const { ctx } = this;
    try {
      const collectionName = ctx.params.collectionName;
      if (!collectionName) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: 'collectionName 参数不能为空',
        };
        return;
      }

      const info = await ctx.service.langchain.milvusVectorStore.getCollectionInfo(collectionName);
      ctx.body = {
        code: 200,
        message: 'success',
        data: info,
      };
    } catch (error) {
      ctx.logger.error('获取 Collection 信息失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '获取 Collection 信息失败',
        error: error.message,
      };
    }
  }

  /**
   * 查询 Collection 数据
   * GET /api/milvus/collections/:collectionName/data
   * Query Parameters:
   *   - limit: 返回数量限制（默认 10）
   *   - offset: 偏移量（默认 0）
   *   - expr: 过滤表达式（可选，如：id == 'xxx' 或 text like '%keyword%'）
   *   - outputFields: 输出字段列表，逗号分隔（默认 id,text,metadata）
   */
  async queryCollection() {
    const { ctx } = this;
    try {
      const collectionName = ctx.params.collectionName;
      if (!collectionName) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: 'collectionName 参数不能为空',
        };
        return;
      }

      const limit = Number(ctx.query.limit) || 10;
      const offset = Number(ctx.query.offset) || 0;
      const expr = ctx.query.expr || null;
      const outputFields = ctx.query.outputFields
        ? ctx.query.outputFields.split(',').map(f => f.trim())
        : undefined; // 使用 service 层的默认值（包含 vector）

      const result = await ctx.service.langchain.milvusVectorStore.queryCollection(collectionName, {
        limit: Math.min(limit, 100), // 最大限制 100
        offset,
        expr,
        outputFields,
      });

      ctx.body = {
        code: 200,
        message: 'success',
        data: result,
      };
    } catch (error) {
      ctx.logger.error('查询 Collection 数据失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '查询 Collection 数据失败',
        error: error.message,
      };
    }
  }

  /**
   * 统计 Collection 文档数量
   * GET /api/milvus/collections/:collectionName/count
   * Query Parameters:
   *   - expr: 过滤表达式（可选）
   */
  async countCollection() {
    const { ctx } = this;
    try {
      const collectionName = ctx.params.collectionName;
      if (!collectionName) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: 'collectionName 参数不能为空',
        };
        return;
      }

      const expr = ctx.query.expr || null;
      const count = await ctx.service.langchain.milvusVectorStore.countCollection(collectionName, expr);

      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          collectionName,
          count,
          expr: expr || 'all',
        },
      };
    } catch (error) {
      ctx.logger.error('统计 Collection 文档数量失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '统计 Collection 文档数量失败',
        error: error.message,
      };
    }
  }

  /**
   * 删除 Collection 中的文档
   * DELETE /api/milvus/collections/:collectionName/data
   * Request Body:
   *   - ids: 文档 ID 数组（可选，如：["chunk_1765779403141_0", "chunk_1765780800003_0"]）
   *   - expr: 过滤表达式（可选，如：id == 'xxx' 或 text like '%keyword%'）
   * 注意：ids 和 expr 至少提供一个
   */
  async deleteDocuments() {
    const { ctx } = this;
    try {
      const collectionName = ctx.params.collectionName;
      if (!collectionName) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: 'collectionName 参数不能为空',
        };
        return;
      }

      const { ids, expr } = ctx.request.body || {};

      // 验证参数：至少提供 ids 或 expr 之一
      if (!ids && !expr) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '请提供 ids（文档 ID 数组）或 expr（过滤表达式）参数',
        };
        return;
      }

      // 如果提供了 ids，确保是数组格式
      if (ids && !Array.isArray(ids)) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: 'ids 必须是数组格式',
        };
        return;
      }

      // 如果提供了 expr，使用表达式删除；否则使用 ids 删除
      if (expr) {
        // 使用表达式删除
        await ctx.service.langchain.milvusVectorStore.deleteByExpr(collectionName, expr);
        ctx.body = {
          code: 200,
          message: 'success',
          data: {
            collectionName,
            method: 'expr',
            expr,
          },
        };
      } else {
        // 使用 ids 删除
        if (ids.length === 0) {
          ctx.status = 400;
          ctx.body = {
            code: 400,
            message: 'ids 数组不能为空',
          };
          return;
        }

        await ctx.service.langchain.milvusVectorStore.deleteDocuments(collectionName, ids);
        ctx.body = {
          code: 200,
          message: 'success',
          data: {
            collectionName,
            method: 'ids',
            deletedCount: ids.length,
            ids,
          },
        };
      }
    } catch (error) {
      ctx.logger.error('删除 Collection 文档失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '删除 Collection 文档失败',
        error: error.message,
      };
    }
  }
}

module.exports = MilvusController;

