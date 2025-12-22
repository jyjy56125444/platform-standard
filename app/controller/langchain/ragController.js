'use strict';

const Controller = require('egg').Controller;
const pdfParse = require('pdf-parse');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');

/**
 * LangChain RAG 控制器
 * 提供问答与文档入库接口
 */
class RAGController extends Controller {
  /**
   * RAG 问答
   * POST /api/rag/ask/:appId
   * Body: { question: string, stream?: boolean, sessionId?: number }
   * Query: ?stream=1&sessionId=xxx 也支持
   * 说明：sessionId 可选，前端推荐先调用 createSession 获取会话ID，再携带 sessionId 发起问答
   */
  async ask() {
    const { ctx } = this;
    try {
      const appId = Number(ctx.params.appId);
      const { question, stream: bodyStream, sessionId: bodySessionId } = ctx.request.body || {};
      const queryStream = ctx.query.stream;
      const querySessionId = ctx.query.sessionId;
      const isStream = bodyStream === true || bodyStream === '1' || queryStream === '1' || queryStream === 'true';
      const sessionId = Number(
        bodySessionId !== undefined && bodySessionId !== null
          ? bodySessionId
          : (querySessionId !== undefined && querySessionId !== null ? querySessionId : NaN)
      ) || null;

      if (!appId || !Number.isFinite(appId)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'appId 参数无效' };
        return;
      }
      if (!question || typeof question !== 'string' || question.trim().length === 0) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'question 不能为空' };
        return;
      }

      const q = question.trim();

      // 非流式：直接返回 RAG 结果（会话与消息已在服务层写入）
      if (!isStream) {
        const result = await ctx.service.langchain.ragService.ask(appId, q, {
          sessionId,
        });

        ctx.body = { code: 200, message: 'success', data: result };
        return;
      }

      // 流式输出：真正流式，边生成边推送
      ctx.set('Content-Type', 'text/event-stream; charset=utf-8');
      ctx.set('Cache-Control', 'no-cache');
      ctx.set('Connection', 'keep-alive');
      ctx.status = 200;
      ctx.respond = false;

      const res = ctx.res;

      // 写入一个帮助函数
      const writeEvent = (event, data) => {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      // 先发送一个握手事件
      writeEvent('ready', { message: 'stream start' });

      // 调用流式问答服务：内部会调用 LLM 流式接口，并通过回调把增量结果推送出来（会话与消息已在服务层写入）
      const result = await ctx.service.langchain.ragService.askStream(appId, q, { sessionId }, chunk => {
        const { delta, done } = chunk || {};
        // 只要有内容就推送
        if (delta && delta.length > 0) {
          writeEvent('answer', {
            delta,
            done: false,
          });
        }
        // done 标记由 end 事件统一下发
      });

      // 发送结束事件，附带 meta 信息
      writeEvent('end', {
        done: true,
        responseTime: result.responseTime || 0,
        usage: result.usage || {},
        sessionId: result.sessionId || null,
      });

      res.end();
    } catch (error) {
      ctx.logger.error('RAG 问答失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: 'RAG 问答失败', error: error.message };
    }
  }

  /**
   * 获取 RAG 配置（完整配置，包含所有字段）
   * GET /api/rag/config/:appId
   */
  async getRAGConfig() {
    const { ctx } = this;
    try {
      const appId = Number(ctx.params.appId);
      if (!appId || !Number.isFinite(appId)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'appId 参数无效' };
        return;
      }

      const config = await ctx.service.langchain.ragService.getRAGConfig(appId);
      ctx.body = { code: 200, message: 'success', data: ctx.app.utils.case.toCamelCaseKeys(config) };
    } catch (error) {
      ctx.logger.error('获取 RAG 配置失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '获取 RAG 配置失败', error: error.message };
    }
  }

  /**
   * 设置 RAG 配置（支持部分更新）
   * PUT /api/rag/config/:appId
   * Body: { milvusCollection?, vectorDimension?, embeddingModel?, llmModel?, topK?, similarityThreshold?, 
   *         indexType?, indexParams?, rerankEnabled?, rerankModel?, rerankTopK?, rerankParams?,
   *         chunkMaxLength?, chunkOverlap?, chunkSeparators?, status?, remark? }
   */
  async setRAGConfig() {
    const { ctx } = this;
    try {
      const appId = Number(ctx.params.appId);
      if (!appId || !Number.isFinite(appId)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'appId 参数无效' };
        return;
      }

      const body = ctx.request.body || {};
      const result = await ctx.service.langchain.ragService.setRAGConfig(appId, body);
      ctx.body = { code: 200, message: 'success', data: ctx.app.utils.case.toCamelCaseKeys(result) };
    } catch (error) {
      ctx.logger.error('设置 RAG 配置失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '设置 RAG 配置失败', error: error.message };
    }
  }

  /**
   * 删除 RAG 配置（重置为默认值）
   * DELETE /api/rag/config/:appId
   */
  async deleteRAGConfig() {
    const { ctx } = this;
    try {
      const appId = Number(ctx.params.appId);
      if (!appId || !Number.isFinite(appId)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'appId 参数无效' };
        return;
      }

      await ctx.service.langchain.ragService.deleteRAGConfig(appId);
      ctx.body = { code: 200, message: 'success', data: { appId } };
    } catch (error) {
      ctx.logger.error('删除 RAG 配置失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '删除 RAG 配置失败', error: error.message };
    }
  }

  /**
   * 文档入库（支持 JSON 与 multipart，含分段处理）
   * POST /api/rag/documents/:appId
   * - application/json: { documents: [{ text, metadata?, id? }] }
   * - multipart/form-data: files[]=<pdf/md/txt> 或 texts[]=<string>
   *
   * 分段配置从数据库 rag_config 表读取（按 APP_ID 维度）
   * PDF 优先转 Markdown（建议）——若 DashScope Parse 未接入，则退化为 pdf-parse 纯文本
   */
  async addDocuments() {
    const { ctx } = this;
    try {
      // 从路径参数获取 appId
      const appId = Number(ctx.params.appId);
      if (!appId || !Number.isFinite(appId)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'appId 参数无效' };
        return;
      }

      const contentType = ctx.get('content-type') || '';
      const rawTexts = [];

      if (contentType.includes('multipart/form-data')) {
        const parts = ctx.multipart();
        let part;
        while ((part = await parts()) != null) {
          if (Array.isArray(part)) {
            const [ field, value ] = part;
            // 移除 appId 字段处理，因为已经从路径参数获取
            if (field === 'texts' || field === 'texts[]') rawTexts.push(String(value));
          } else {
            const { buffer, filename, mime } = await readFilePart(part);
            const { text } = await extractTextFromFile(ctx, buffer, filename, mime);
            if (text && text.trim()) rawTexts.push(text);
          }
        }
      } else {
        // JSON
        const body = ctx.request.body || {};
        const docs = Array.isArray(body.documents) ? body.documents : [];
        rawTexts.push(...docs.filter(d => d && d.text).map(d => d.text));
      }
      if (rawTexts.length === 0) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '请提供文本文档或上传附件(pdf/md/txt)' };
        return;
      }

      // 从数据库读取分段配置
      const chunkConfig = await ctx.service.langchain.ragService.getChunkConfig(appId);
      const chunks = await chunkTexts(rawTexts, chunkConfig);

      if (chunks.length === 0) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '分段结果为空，请检查输入' };
        return;
      }

      // 组装入库文档
      const documents = chunks.map((text, idx) => ({
        id: `chunk_${Date.now()}_${idx}`,
        text,
        metadata: { chunkIndex: idx, chunkTotal: chunks.length },
      }));

      const result = await ctx.service.langchain.ragService.addDocuments(appId, documents);
      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          ...result,
          chunkCount: chunks.length,
          chunkConfig, // 返回使用的分段配置
        },
      };
    } catch (error) {
      ctx.logger.error('RAG 文档入库失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: 'RAG 文档入库失败', error: error.message };
    }
  }
}

module.exports = RAGController;

// ---------- 分段与文件处理工具 ----------
async function chunkTexts(texts = [], opts = {}) {
  const { maxLength = 2048, overlap = 100, separators } = opts;
  const normalized = Array.isArray(texts) ? texts : [];
  const defaultSeparators = separators || [
    '\n\n\n', '\n\n', '\n', '。', '！', '？', '. ', '! ', '? ', ' ', '',
  ];
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: maxLength,
    chunkOverlap: overlap,
    separators: defaultSeparators,
  });
  const out = [];
  for (const text of normalized) {
    if (!text || typeof text !== 'string') continue;
    const normalizedText = text.replace(/\r\n/g, '\n');
    const parts = await splitter.splitText(normalizedText);
    out.push(...parts.filter(p => p.trim().length > 0));
  }
  return out;
}

async function readFilePart(part) {
  const buffer = await new Promise((resolve, reject) => {
    const chunks = [];
    part.on('data', chunk => chunks.push(chunk));
    part.on('end', () => resolve(Buffer.concat(chunks)));
    part.on('error', reject);
  });
  const mime = part.mime || part.mimeType || 'application/octet-stream';
  const filename = part.filename || '';
  return { buffer, mime, filename };
}

async function extractTextFromFile(ctx, buffer, filename = '', mime = '') {
  const ext = path.extname(filename || '').toLowerCase();
  const isPdf = mime === 'application/pdf' || ext === '.pdf';
  const isMarkdown = mime === 'text/markdown' || ext === '.md';
  const isTextLike = mime.startsWith('text/') || ext === '.txt';

  // PDF 处理：优先调用阿里 DashScope Parse 接口转换为 Markdown，失败则回退到本地 pdf-parse
  if (isPdf) {
    // 1. 优先：调用 DashScope Parse API 将 PDF 转换为 Markdown（高质量转换，保留格式）
    const parsed = await dashScopeParsePdf(ctx, buffer, filename);
    if (parsed) {
      // DashScope 转换成功，对 Markdown 进行轻度文本化后返回
      const cleaned = cleanMarkdownToText(parsed);
      return { text: cleaned };
    }
    // 2. 回退：DashScope 转换失败，使用本地 pdf-parse 提取纯文本，再转换为 Markdown
    const pdfData = await pdfParse(buffer);
    const md = pdfToMarkdown(pdfData.text || '');
    const cleaned = cleanMarkdownToText(md);
    return { text: cleaned };
  }

  if (isMarkdown) {
    const content = buffer.toString('utf8');
    return await parseMarkdown(content);
  }

  if (isTextLike) {
    const md = txtToMarkdown(buffer.toString('utf8'));
    const cleaned = cleanMarkdownToText(md);
    return { text: cleaned };
  }

  return { text: buffer.toString('utf8') };
}

async function parseMarkdown(content) {
  // 这里只保留文本，图片不入库；如需保留可扩展 metadata
  const images = [];
  // 去除图片后做轻度文本化
  const mdImageRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
  const htmlImageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const stripped = content.replace(mdImageRegex, '').replace(htmlImageRegex, '');
  const cleaned = cleanMarkdownToText(stripped);
  return { text: cleaned.trim(), images };
}

// ---------- Markdown 轻度文本化与格式转换 ----------
function pdfToMarkdown(raw = '') {
  // 简单行合并：连续空行分段，保留段落与可能的标题行
  const lines = raw.split(/\r?\n/).map(l => l.trim());
  const merged = [];
  let buf = [];
  const flush = () => {
    if (buf.length) {
      merged.push(buf.join(' '));
      buf = [];
    }
  };
  for (const line of lines) {
    if (!line) {
      flush();
    } else {
      buf.push(line);
    }
  }
  flush();
  return merged.map(p => p.trim()).filter(Boolean).join('\n\n');
}

function txtToMarkdown(raw = '') {
  // 保留列表项与段落，将多余空行折叠
  const lines = raw.split(/\r?\n/).map(l => l.trimEnd());
  return lines.join('\n');
}

function cleanMarkdownToText(md = '') {
  let text = md;
  // 移除代码块
  text = text.replace(/```[\s\S]*?```/g, '');
  // 链接 [txt](url) -> txt
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
  // 粗体/斜体符号
  text = text.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1');
  // 标题 # ### -> 文本
  text = text.replace(/^\s{0,3}#{1,6}\s+/gm, '');
  // 列表符号
  text = text.replace(/^\s*[-*+]\s+/gm, '');
  text = text.replace(/^\s*\d+\.\s+/gm, '');
  // HTML 标签简单去除
  text = text.replace(/<[^>]+>/g, '');
  // 折叠多余空行
  text = text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

/**
 * 调用 DashScope Parse 将 PDF 解析为 Markdown
 * 成功返回 markdown 字符串，失败返回 null
 */
async function dashScopeParsePdf(ctx, buffer, filename = 'document.pdf') {
  const { apiKey, baseUrl } = ctx.app.config.dashscope || {};
  if (!apiKey || !baseUrl) return null;

  try {
    const fileBase64 = buffer.toString('base64');
    const payload = {
      model: 'dashscope-parser-v1',
      input: {
        file: fileBase64,
        file_name: filename,
      },
    };

    const url = new URL('/services/file/parse', baseUrl);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    const postData = JSON.stringify(payload);

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const result = await new Promise((resolve, reject) => {
      const req = httpModule.request(options, res => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(responseData);
            if (res.statusCode !== 200) {
              reject(new Error(`DashScope Parse 失败(${res.statusCode}): ${json.message || responseData}`));
            } else {
              resolve(json);
            }
          } catch (err) {
            reject(new Error(`解析 DashScope Parse 响应失败: ${err.message}`));
          }
        });
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    // 预期 output.content 为 markdown
    const md = result?.output?.content;
    if (md && typeof md === 'string' && md.trim()) {
      return md;
    }
    return null;
  } catch (error) {
    ctx.logger.warn('DashScope Parse 调用失败，回退本地 pdf-parse:', error.message);
    return null;
  }
}

