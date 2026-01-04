'use strict';

const Controller = require('egg').Controller;
const path = require('path');
const { Readable } = require('stream');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const Client = require('@alicloud/docmind-api20220711');
const Util = require('@alicloud/tea-util');
const { PermissionUtil } = require('../../utils/permission');

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

      // 权限检查：只有超管和拥有应用权限的用户可以操作
      if (!(await PermissionUtil.hasAppAccess(ctx, appId, '没有权限操作该应用'))) {
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

      // 权限检查：只有超管和拥有应用权限的用户可以操作
      if (!(await PermissionUtil.hasAppAccess(ctx, appId, '没有权限操作该应用'))) {
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

      // 权限检查：只有超管和拥有应用权限的用户可以操作
      if (!(await PermissionUtil.hasAppAccess(ctx, appId, '没有权限操作该应用'))) {
        return;
      }

      const contentType = ctx.get('content-type') || '';
      const queryStream = ctx.query.stream;
      const bodyStream = ctx.request.body?.stream;
      const isStream = (bodyStream === true || bodyStream === '1' || queryStream === '1' || queryStream === 'true') && contentType.includes('multipart/form-data');
      
      const rawTexts = [];
      const skippedFiles = []; // 记录跳过的文件
      const failedFiles = []; // 记录处理失败的文件
      const successFiles = []; // 记录成功处理的文件

      // 流式返回：仅支持 multipart/form-data
      // 定义通用事件写入函数
      let writeEvent = null;
      if (isStream) {
        ctx.set('Content-Type', 'text/event-stream; charset=utf-8');
        ctx.set('Cache-Control', 'no-cache');
        ctx.set('Connection', 'keep-alive');
        ctx.status = 200;
        ctx.respond = false;

        const res = ctx.res;
        writeEvent = (event, data) => {
          res.write(`event: ${event}\n`);
          res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        writeEvent('ready', { message: 'stream start' });
      }

      if (contentType.includes('multipart/form-data')) {
        const parts = ctx.multipart();
        let part;
        const fileList = []; // 记录所有文件，用于统计
        
        while ((part = await parts()) != null) {
          if (Array.isArray(part)) {
            const [ field, value ] = part;
            // 移除 appId 字段处理，因为已经从路径参数获取
            if (field === 'texts' || field === 'texts[]') rawTexts.push(String(value));
          } else {
            const { buffer, filename, mime } = await readFilePart(part);
            const currentFilename = filename || '未知文件';
            
            // 流式返回：文件上传完成
            if (isStream) {
              writeEvent('file_uploaded', { filename: currentFilename, size: buffer.length });
            }
            
            // 创建进度回调函数
            const onProgress = isStream ? (progressData) => {
              writeEvent('file_progress', { filename: currentFilename, ...progressData });
            } : null;
            
            const result = await extractTextFromFile(ctx, buffer, currentFilename, mime, onProgress);
            
            if (result.skipped) {
              // 不支持的文件格式
              skippedFiles.push({
                filename: currentFilename,
                reason: result.error || '不支持的文件格式'
              });
            } else if (result.error) {
              // 处理失败的文件
              failedFiles.push({
                filename: currentFilename,
                reason: result.error
              });
            } else if (result.text && result.text.trim()) {
              // 成功处理的文件
              rawTexts.push(result.text);
              successFiles.push({ filename: currentFilename });
              
              // 流式返回：文件处理完成
              if (isStream) {
                writeEvent('file_completed', { filename: currentFilename });
              }
            }
          }
        }
      } else {
        // JSON
        const body = ctx.request.body || {};
        const docs = Array.isArray(body.documents) ? body.documents : [];
        rawTexts.push(...docs.filter(d => d && d.text).map(d => d.text));
      }
      
      if (rawTexts.length === 0) {
        if (isStream) {
          writeEvent('file_all_completed', {
            successCount: 0,
            failedFiles,
            skippedFiles,
            summary: {
              totalProcessed: 0,
              skipped: skippedFiles.length,
              failed: failedFiles.length
            }
          });
          ctx.res.end();
        } else {
        ctx.status = 400;
          ctx.body = { 
            code: 400, 
            message: '没有成功处理的文档',
            data: {
              skippedFiles,
              failedFiles
            }
          };
        }
        return;
      }

      // 从数据库读取分段配置
      const chunkConfig = await ctx.service.langchain.ragService.getChunkConfig(appId);
      const chunks = await chunkTexts(rawTexts, chunkConfig);

      if (chunks.length === 0) {
        if (isStream) {
          writeEvent('file_all_completed', {
            successCount: 0,
            failedFiles,
            skippedFiles,
            summary: {
              totalProcessed: 0,
              skipped: skippedFiles.length,
              failed: failedFiles.length
            }
          });
          ctx.res.end();
        } else {
        ctx.status = 400;
        ctx.body = { code: 400, message: '分段结果为空，请检查输入' };
        }
        return;
      }

      // 组装入库文档
      const documents = chunks.map((text, idx) => ({
        id: `chunk_${Date.now()}_${idx}`,
        text,
        metadata: { chunkIndex: idx, chunkTotal: chunks.length },
      }));

      const result = await ctx.service.langchain.ragService.addDocuments(appId, documents);
      
      if (isStream) {
        writeEvent('file_all_completed', {
          successCount: successFiles.length,
          failedFiles: failedFiles.length > 0 ? failedFiles : undefined,
          skippedFiles: skippedFiles.length > 0 ? skippedFiles : undefined,
          chunkCount: chunks.length,
          summary: {
            totalProcessed: rawTexts.length,
            skipped: skippedFiles.length,
            failed: failedFiles.length
          }
        });
        ctx.res.end();
      } else {
      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          ...result,
          chunkCount: chunks.length,
          chunkConfig, // 返回使用的分段配置
            // 返回文件处理统计信息
            ...(skippedFiles.length > 0 || failedFiles.length > 0 ? {
              skippedFiles: skippedFiles.length > 0 ? skippedFiles : undefined,
              failedFiles: failedFiles.length > 0 ? failedFiles : undefined,
              summary: {
                totalProcessed: rawTexts.length,
                skipped: skippedFiles.length,
                failed: failedFiles.length
              }
            } : {})
        },
      };
      }
    } catch (error) {
      ctx.logger.error('RAG 文档入库失败:', error);
      
      // 如果是流式返回，通过流式返回错误
      if (writeEvent) {
        writeEvent('error', { message: 'RAG 文档入库失败', error: error.message });
        ctx.res.end();
      } else {
      ctx.status = 500;
      ctx.body = { code: 500, message: 'RAG 文档入库失败', error: error.message };
      }
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

/**
 * 检查文件格式是否支持
 * @param {String} filename - 文件名
 * @param {String} mime - MIME类型
 * @returns {Object} { supported: boolean, type: 'document'|'media'|null, reason?: string }
 */
function checkFileFormat(filename = '', mime = '') {
  const ext = path.extname(filename || '').toLowerCase().replace('.', '');
  
  // 支持的文档格式
  const documentFormats = {
    // Office文档
    pdf: ['application/pdf'],
    doc: ['application/msword', 'application/vnd.ms-word'],
    docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ppt: ['application/vnd.ms-powerpoint'],
    pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    xls: ['application/vnd.ms-excel'],
    xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    xlsm: ['application/vnd.ms-excel.sheet.macroEnabled.12'],
    // 图片格式
    jpg: ['image/jpeg'],
    jpeg: ['image/jpeg'],
    png: ['image/png'],
    bmp: ['image/bmp'],
    gif: ['image/gif'],
    // 其他文档格式
    md: ['text/markdown', 'text/x-markdown'],
    markdown: ['text/markdown', 'text/x-markdown'],
    html: ['text/html'],
    htm: ['text/html'],
    epub: ['application/epub+zip'],
    mobi: ['application/x-mobipocket-ebook'],
    rtf: ['application/rtf', 'text/rtf'],
    txt: ['text/plain'],
  };
  
  // 支持的音视频格式
  const mediaFormats = {
    mp4: ['video/mp4'],
    mkv: ['video/x-matroska'],
    avi: ['video/x-msvideo', 'video/avi'],
    mov: ['video/quicktime'],
    wmv: ['video/x-ms-wmv'],
    mp3: ['audio/mpeg', 'audio/mp3'],
    wav: ['audio/wav', 'audio/wave', 'audio/x-wav'],
    aac: ['audio/aac', 'audio/x-aac'],
  };
  
  // 检查文档格式
  if (documentFormats[ext]) {
    const supportedMimes = documentFormats[ext];
    if (mime && supportedMimes.includes(mime)) {
      return { supported: true, type: 'document' };
    }
    // 如果没有MIME类型或MIME不匹配，但扩展名匹配，也认为支持
    if (!mime || mime === 'application/octet-stream') {
      return { supported: true, type: 'document' };
    }
  }
  
  // 检查音视频格式
  if (mediaFormats[ext]) {
    const supportedMimes = mediaFormats[ext];
    if (mime && supportedMimes.includes(mime)) {
      return { supported: true, type: 'media' };
    }
    // 如果没有MIME类型或MIME不匹配，但扩展名匹配，也认为支持
    if (!mime || mime === 'application/octet-stream') {
      return { supported: true, type: 'media' };
    }
  }
  
  // 通过MIME类型检查（备用方案）
  if (mime && mime !== 'application/octet-stream') {
    // 检查文档MIME
    for (const [format, mimes] of Object.entries(documentFormats)) {
      if (mimes.includes(mime)) {
        return { supported: true, type: 'document' };
      }
    }
    // 检查音视频MIME
    for (const [format, mimes] of Object.entries(mediaFormats)) {
      if (mimes.includes(mime)) {
        return { supported: true, type: 'media' };
      }
    }
  }
  
  return { 
    supported: false, 
    type: null, 
    reason: `不支持的文件格式: ${ext || '未知扩展名'}${mime ? ` (${mime})` : ''}` 
  };
}

async function extractTextFromFile(ctx, buffer, filename = '', mime = '', onProgress = null) {
  // 检查文件格式是否支持
  const formatCheck = checkFileFormat(filename, mime);
  
  if (!formatCheck.supported) {
    return { 
      text: null, 
      error: formatCheck.reason || '不支持的文件格式',
      skipped: true 
    };
  }
  
  // 所有支持的文档或音视频格式，都调用阿里云文档解析（大模型版）API
  if (formatCheck.type === 'document' || formatCheck.type === 'media') {
    try {
      const parsed = await documentMindParse(ctx, buffer, filename, onProgress);
      if (!parsed || !parsed.trim()) {
        throw new Error('文档解析结果为空');
      }
      
      // 如果配置了OSS托管，将临时URL转换为永久URL
      let processedMarkdown = parsed;
      const { ossBucket, ossEndpoint } = ctx.app.config.documentMind || {};
      if (ossBucket && ossEndpoint) {
        processedMarkdown = replaceOssTempUrlsInMarkdown(parsed);
      }
      
      // 对 Markdown 进行轻度文本化后返回
      const cleaned = cleanMarkdownToText(processedMarkdown);
      return { text: cleaned };
    } catch (error) {
      ctx.logger.error(`文档解析失败 [${filename}]:`, error);
      return { 
        text: null, 
        error: `文档解析失败: ${error.message}`,
        skipped: false 
      };
    }
  }
  
  // 如果到这里说明格式检查有问题，返回错误
  return { 
    text: null, 
    error: '文件格式处理异常',
    skipped: true 
  };
}

// ---------- Markdown 轻度文本化与格式转换 ----------
function cleanMarkdownToText(md = '') {
  let text = md;
  // 只折叠多余空行，保留所有 Markdown 特性（图片、代码块、列表、HTML等）
  text = text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

/**
 * 处理Markdown中的OSS临时URL，转换为永久URL
 * 简单处理：去掉查询参数，将 http 替换为 https
 * @param {String} markdown - Markdown内容
 * @returns {String} 处理后的Markdown
 */
function replaceOssTempUrlsInMarkdown(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return markdown;
  }

  // 匹配Markdown图片语法：![alt](url)
  const imageRegex = /!\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/g;
  
  return markdown.replace(imageRegex, (match, alt, url) => {
    // 去掉查询参数，将 http 替换为 https
    let permanentUrl = url;
    try {
      const urlObj = new URL(url);
      urlObj.search = ''; // 去掉查询参数
      urlObj.protocol = 'https:'; // 统一使用 https
      permanentUrl = urlObj.toString();
    } catch (error) {
      // URL解析失败，使用简单字符串替换
      permanentUrl = url
        .replace(/\?.*$/, '') // 去掉查询参数
        .replace(/^http:/, 'https:'); // http 替换为 https
    }
    return `![${alt}](${permanentUrl})`;
  });
}

/**
 * 获取阿里云文档解析客户端
 * @param {Object} ctx - Egg context
 * @returns {Object} 客户端实例
 */
function getDocumentMindClient(ctx) {
  const { accessKeyId, accessKeySecret, region, endpoint, connectTimeout, readTimeout } = ctx.app.config.documentMind || {};
  
  if (!accessKeyId || !accessKeySecret) {
    throw new Error('文档解析服务配置不完整，请检查 accessKeyId 和 accessKeySecret');
  }

  // endpoint 应该是域名，不包含协议（根据官方文档）
  const finalEndpoint = endpoint || `docmind-api.${region}.aliyuncs.com`;
  // 移除可能的协议前缀
  const cleanEndpoint = finalEndpoint.replace(/^https?:\/\//, '');

  // 创建文档解析客户端（按照官方文档的方式）
  // 注意：超时时间应该在 RuntimeOptions 中设置，而不是在客户端配置中
  const client = new Client.default({
    endpoint: cleanEndpoint,
    accessKeyId,
    accessKeySecret,
    type: 'access_key',
    regionId: region || 'cn-hangzhou',
  });

  return client;
}

/**
 * 步骤一：提交文档解析任务（本地文件上传）
 * @param {Object} ctx - Egg context
 * @param {Buffer} buffer - 文件 Buffer
 * @param {String} filename - 文件名
 * @returns {Promise<String>} TaskId
 */
async function submitDocParserJob(ctx, buffer, filename = 'document.pdf') {
  const client = getDocumentMindClient(ctx);
  
  // 将 Buffer 转换为 Stream
  const fileStream = Readable.from(buffer);
  
  const advanceRequest = new Client.SubmitDocParserJobAdvanceRequest();
  advanceRequest.fileUrlObject = fileStream;
  advanceRequest.fileName = filename;
  
  // OSS托管配置：如果配置了ossBucket和ossEndpoint，解析结果会存储到指定的OSS Bucket
  // 这样返回的图片URL就是永久链接，而不是临时链接
  const { ossBucket, ossEndpoint } = ctx.app.config.documentMind || {};
  if (ossBucket && ossEndpoint) {
    advanceRequest.ossBucket = ossBucket;
    advanceRequest.ossEndpoint = ossEndpoint;
    ctx.logger.info(`使用OSS托管: bucket=${ossBucket}, endpoint=${ossEndpoint}`);
  }
  
  const runtimeObject = new Util.RuntimeOptions({});
  
  try {
    const response = await client.submitDocParserJobAdvance(advanceRequest, runtimeObject);
    
    if (!response.body) {
      throw new Error('提交文档解析任务失败：响应 body 为空');
    }
    
    if (!response.body.data) {
      throw new Error(`提交文档解析任务失败：未返回 data，响应: ${JSON.stringify(response.body)}`);
    }
    
    if (!response.body.data.id) {
      throw new Error(`提交文档解析任务失败：未返回 TaskId，data: ${JSON.stringify(response.body.data)}`);
    }
    
    const taskId = response.body.data.id;
    return taskId;
  } catch (error) {
    ctx.logger.error(`提交文档解析任务失败 [${filename}]:`, error.message);
    throw error;
  }
}

/**
 * 步骤二：查询文档解析任务状态
 * @param {Object} ctx - Egg context
 * @param {String} taskId - 任务ID
 * @returns {Promise<Object>} 任务状态信息
 */
async function queryDocParserStatus(ctx, taskId) {
  const client = getDocumentMindClient(ctx);
  
  const resultRequest = new Client.QueryDocParserStatusRequest();
  resultRequest.id = taskId;
  
  const response = await client.queryDocParserStatus(resultRequest);
  
  if (!response.body || !response.body.data) {
    throw new Error('查询文档解析任务状态失败：未返回 Data');
  }
  
  return response.body.data;
}

/**
 * 步骤三：获取文档解析结果
 * @param {Object} ctx - Egg context
 * @param {String} taskId - 任务ID
 * @param {Number} layoutNum - 布局块索引（从 0 开始）
 * @param {Number} layoutStepSize - 增量获取步长
 * @returns {Promise<Object>} 解析结果
 */
async function getDocParserResult(ctx, taskId, layoutNum = 0, layoutStepSize = 10) {
  const client = getDocumentMindClient(ctx);
  
  const resultRequest = new Client.GetDocParserResultRequest();
  resultRequest.id = taskId;
  resultRequest.layoutStepSize = layoutStepSize;
  resultRequest.layoutNum = layoutNum;
  
  const response = await client.getDocParserResult(resultRequest);
  
  if (!response.body || !response.body.data) {
    throw new Error('获取文档解析结果失败：未返回 Data');
  }
  
  return response.body.data;
}

/**
 * 从解析结果中提取 Markdown 内容
 * @param {Array} layouts - 布局块数组
 * @returns {String} Markdown 内容
 */
function extractMarkdownFromLayouts(layouts) {
  if (!Array.isArray(layouts)) {
    return '';
  }

  let markdownContent = '';
  for (const layout of layouts) {
    // 优先使用 markdownContent 字段
    if (layout.markdownContent) {
      markdownContent += layout.markdownContent + '\n\n';
    } else if (layout.text) {
      // 如果没有 markdownContent，使用 text 字段
      markdownContent += layout.text + '\n\n';
    }
  }

  return markdownContent.trim();
}

/**
 * 调用阿里云文档解析（大模型版）将文档/音视频解析为 Markdown
 * 支持格式：pdf、word、ppt、pptx、xls、xlsx、xlsm、图片、markdown、html、epub、mobi、rtf、txt、音视频等
 * 成功返回 markdown 字符串，失败抛出异常
 * @param {Object} ctx - Egg context
 * @param {Buffer} buffer - 文件 Buffer
 * @param {String} filename - 文件名
 * @param {Function} onProgress - 进度回调函数，接收 { stage, attempts?, maxAttempts?, status?, layoutCount? }
 */
async function documentMindParse(ctx, buffer, filename = 'document', onProgress = null) {
  const { pollInterval, maxPollAttempts, layoutStepSize } = ctx.app.config.documentMind || {};
  const pollIntervalMs = pollInterval || 5000;
  const maxAttempts = maxPollAttempts || 120;
  const stepSize = layoutStepSize || 10;

  // 步骤一：提交任务
  const taskId = await submitDocParserJob(ctx, buffer, filename);
  if (onProgress) {
    onProgress({ stage: 'task_submitted', taskId });
  }

  // 步骤二：轮询查询状态
  let attempts = 0;
  let status = 'Processing';
  
  while (status && status.toLowerCase() === 'processing' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    attempts++;
    
    const statusData = await queryDocParserStatus(ctx, taskId);
    status = statusData.status || statusData.Status;
    
    // 推送进度
    if (onProgress) {
      onProgress({
        stage: 'status_polling',
        attempts,
        maxAttempts,
        status,
        progress: attempts / maxAttempts
      });
    }
    
    if (status && (status.toLowerCase() === 'failed')) {
      throw new Error(`文档解析任务失败: ${statusData.message || statusData.Message || '未知错误'}`);
    }
  }

  // 使用不区分大小写的方式检查成功状态
  if (!status || status.toLowerCase() !== 'success') {
    throw new Error(`文档解析任务超时或状态异常: ${status}`);
  }

  // 步骤三：获取解析结果（增量获取所有结果）
  let allLayouts = [];
  let layoutNum = 0;
  let hasMore = true;

  while (hasMore) {
    const resultData = await getDocParserResult(ctx, taskId, layoutNum, stepSize);
    const layouts = resultData.layouts || resultData.Layouts || [];
    
    if (layouts.length > 0) {
      allLayouts.push(...layouts);
      layoutNum += stepSize;
      
      // 推送获取结果进度
      if (onProgress) {
        onProgress({
          stage: 'result_fetching',
          layoutCount: allLayouts.length
        });
      }
      
      // 如果返回的布局数量小于 stepSize，说明已经获取完所有数据
      if (layouts.length < stepSize) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  // 提取 Markdown 内容
  const markdown = extractMarkdownFromLayouts(allLayouts);
  
  if (!markdown || !markdown.trim()) {
    throw new Error('文档解析结果为空');
  }

  ctx.logger.info(`文档解析完成 [${filename}]: ${allLayouts.length} 个布局块, ${markdown.length} 字符`);
  
  return markdown;
}


