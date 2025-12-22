'use strict';

const Service = require('egg').Service;
const https = require('https');
const http = require('http');

/**
 * DashScope/Qwen LLM Service
 * 封装 DashScope LLM API 调用，提供 LangChain 兼容的接口
 */
class LLMService extends Service {
  /**
   * 调用 DashScope LLM API（兼容 OpenAI 格式）
   * @param {String} prompt - 提示词
   * @param {Object} options - 可选参数
   * @returns {Promise<String>} LLM 响应文本
   */
  async generate(prompt, options = {}) {
    const { ctx } = this;
    const { llmModel = 'qwen-plus', temperature = 0.7, maxTokens = 2000 } = options;
    const { apiKey, baseUrl, endpoint } = this.config.llm;

    if (!apiKey) {
      throw new Error('DashScope LLM API Key 未配置');
    }

    try {
      // 使用兼容 OpenAI 格式的接口
      const response = await this.callLLMAPI(endpoint, {
        model: llmModel,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
        top_p: options.topP || 0.8,
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error('DashScope LLM API 返回的响应为空');
      }

      const text = response.choices[0].message.content;
      const usage = response.usage || {};
      
      ctx.logger.debug(`LLM 生成成功，模型: ${llmModel}, Token 使用: ${usage.total_tokens || 0}`);
      
      return {
        text,
        usage: {
          input_tokens: usage.prompt_tokens || 0,
          output_tokens: usage.completion_tokens || 0,
          total_tokens: usage.total_tokens || 0,
        },
      };
    } catch (error) {
      ctx.logger.error('LLM 生成失败:', error);
      throw new Error(`LLM 生成失败: ${error.message}`);
    }
  }

  /**
   * 调用 DashScope LLM API（兼容 OpenAI 格式，流式）
   * @param {String} prompt - 提示词
   * @param {Object} options - 可选参数
   * @param {(chunk: { delta: string, done: boolean }) => void} onDelta - 每次增量回调
   * @returns {Promise<void>}
   */
  async generateStream(prompt, options = {}, onDelta) {
    const { ctx } = this;
    const { llmModel = 'qwen-plus', temperature = 0.7, maxTokens = 2000 } = options;
    const { apiKey, baseUrl, endpoint } = this.config.llm;

    if (!apiKey) {
      throw new Error('DashScope LLM API Key 未配置');
    }
    if (typeof onDelta !== 'function') {
      throw new Error('generateStream 需要提供 onDelta 回调函数');
    }

    const url = new URL(`${baseUrl}${endpoint}`);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    const postData = JSON.stringify({
      model: llmModel,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature,
      max_tokens: maxTokens,
      top_p: options.topP || 0.8,
      stream: true,
    });

    const requestOptions = {
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

    return new Promise((resolve, reject) => {
      const req = httpModule.request(requestOptions, res => {
        const statusCode = res.statusCode || 0;
        let buffer = '';
        let errorBuffer = '';

        if (statusCode !== 200) {
          res.on('data', chunk => {
            errorBuffer += chunk.toString('utf8');
          });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(errorBuffer);
              const msg = parsed.error?.message || parsed.message || errorBuffer;
              reject(new Error(`DashScope LLM 流式调用失败 (${statusCode}): ${msg}`));
            } catch (e) {
              reject(new Error(`DashScope LLM 流式调用失败 (${statusCode}): ${errorBuffer || e.message}`));
            }
          });
          return;
        }

        res.on('data', chunk => {
          buffer += chunk.toString('utf8');

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line || !line.startsWith('data:')) continue;

            const dataStr = line.slice(5).trim();
            if (!dataStr) continue;

            if (dataStr === '[DONE]') {
              try {
                onDelta({ delta: '', done: true });
              } catch (e) {
                ctx.logger.warn('LLM 流式 onDelta 回调异常（done）:', e);
              }
              continue;
            }

            try {
              const parsed = JSON.parse(dataStr);
              const deltaContent = parsed.choices?.[0]?.delta?.content || '';
              if (deltaContent) {
                try {
                  onDelta({ delta: deltaContent, done: false });
                } catch (e) {
                  ctx.logger.warn('LLM 流式 onDelta 回调异常:', e);
                }
              }
            } catch (e) {
              ctx.logger.warn('LLM 流式解析数据失败:', e);
            }
          }
        });

        res.on('end', () => {
          resolve();
        });
      });

      req.on('error', error => {
        reject(new Error(`LLM 流式请求失败: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * 调用 DashScope LLM API（兼容 OpenAI 格式）
   * @param {String} endpoint - API 端点路径（如：/chat/completions）
   * @param {Object} data - 请求数据
   * @returns {Promise<Object>} 响应数据
   */
  async callLLMAPI(endpoint, data) {
    const { apiKey, baseUrl } = this.config.llm;

    return new Promise((resolve, reject) => {
      const url = new URL(`${baseUrl}${endpoint}`);
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
          'Authorization': `Bearer ${apiKey}`,
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
              const errorMsg = result.error?.message || result.message || responseData;
              reject(new Error(`DashScope LLM API 调用失败 (${res.statusCode}): ${errorMsg}`));
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
}

module.exports = LLMService;

