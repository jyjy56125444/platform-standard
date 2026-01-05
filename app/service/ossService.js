'use strict';

const Service = require('egg').Service;
const OSS = require('ali-oss');
const path = require('path');

class OssService extends Service {
  /**
   * 获取OSS客户端实例
   */
  getClient() {
    const { region, accessKeyId, accessKeySecret, bucket, endpoint } = this.config.oss;
    
    if (!accessKeyId || !accessKeySecret || !bucket) {
      throw new Error('OSS配置不完整，请检查accessKeyId、accessKeySecret和bucket配置');
    }

    const clientConfig = {
      region,
      accessKeyId,
      accessKeySecret,
      bucket,
    };

    // 如果有自定义域名，使用自定义域名
    if (endpoint) {
      clientConfig.endpoint = endpoint;
    }

    return new OSS(clientConfig);
  }

  /**
   * 生成文件路径
   * @param {String} filename 文件名
   * @param {Number} userId 用户ID（已废弃，保留以兼容现有调用）
   * @param {String} type 文件类型：avatar|icon|package|rag-image|other
   * @returns {String} 文件路径
   */
  generateFilePath(filename, userId, type = 'other') {
    const ext = path.extname(filename);
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    
    // 根据type生成不同的目录结构
    // 所有类型都使用扁平化目录结构，直接放在类型目录下
    const dirMap = {
      'avatar': 'avatars/',
      'icon': 'apps/icons/',
      'package': 'apps/packages/',
      'rag-image': 'rag/images/',
      'other': 'uploads/',
    };
    
    const baseDir = dirMap[type] || dirMap.other;
    
    // 直接放在类型目录下，文件名包含时间戳和随机字符串确保唯一性
    return `${baseDir}${timestamp}_${randomStr}${ext}`;
  }

  /**
   * 上传文件到OSS
   * @param {Buffer|Stream} fileStream 文件流
   * @param {String} filename 原始文件名
   * @param {Number} userId 用户ID
   * @param {String} type 文件类型：avatar|icon|package|rag-image|other（可选，默认为other）
   * @returns {Promise<Object>} 上传结果，包含url和path
   */
  async uploadFile(fileStream, filename, userId, type = 'other') {
    const client = this.getClient();
    const filePath = this.generateFilePath(filename, userId, type);
    
    try {
      const result = await client.put(filePath, fileStream);
      
      // 如果配置了自定义域名，使用自定义域名；否则使用OSS返回的URL
      let url = result.url;
      if (this.config.oss.endpoint) {
        // 如果endpoint是完整URL（包含http://或https://），直接拼接
        if (this.config.oss.endpoint.startsWith('http://') || this.config.oss.endpoint.startsWith('https://')) {
          url = `${this.config.oss.endpoint}/${filePath}`;
        } else {
          // 否则，使用https协议
          url = `https://${this.config.oss.endpoint}/${filePath}`;
        }
      }

      return {
        url,
        path: filePath,
      };
    } catch (error) {
      this.ctx.logger.error('OSS上传失败:', error);
      throw new Error(`文件上传失败: ${error.message}`);
    }
  }

  /**
   * 验证文件是否符合要求
   * @param {Object} stream 文件流对象（来自egg-multipart）
   * @returns {Boolean} 是否符合要求
   */
  validateFile(stream) {
    if (!stream || !stream.filename) {
      throw new Error('请选择要上传的文件');
    }

    const { maxSize, allowedMimeTypes } = this.config.oss.upload;

    // 检查文件大小（stream对象中可能没有size，需要在controller中处理）
    // 这里只检查mime类型
    if (stream.mime && !allowedMimeTypes.includes(stream.mime)) {
      throw new Error(`不支持的文件类型，仅支持: ${allowedMimeTypes.join(', ')}`);
    }

    // 检查文件扩展名作为备用验证
    const ext = path.extname(stream.filename).toLowerCase();
    const allowedExts = [ '.jpg', '.jpeg', '.png', '.gif', '.webp' ];
    if (ext && !allowedExts.includes(ext)) {
      throw new Error(`不支持的文件类型，仅支持: ${allowedExts.join(', ')}`);
    }

    return true;
  }

  /**
   * 删除OSS上的文件
   * @param {String} filePath 文件路径
   * @returns {Promise<Boolean>} 是否删除成功
   */
  async deleteFile(filePath) {
    if (!filePath) {
      return false;
    }

    const client = this.getClient();
    try {
      await client.delete(filePath);
      return true;
    } catch (error) {
      this.ctx.logger.error('OSS删除文件失败:', error);
      return false;
    }
  }

  /**
   * 从OSS URL中提取文件路径
   * @param {String} url OSS文件URL
   * @returns {String} 文件路径
   */
  extractPathFromUrl(url) {
    if (!url) {
      return null;
    }

    try {
      const urlObj = new URL(url);
      // 移除开头的斜杠
      return urlObj.pathname.substring(1);
    } catch (error) {
      // 如果不是完整URL，尝试从路径中提取
      // 例如：https://bucket.oss-cn-hangzhou.aliyuncs.com/apps/packages/file.apk
      // 或者：apps/packages/file.apk
      const match = url.match(/\/apps\/packages\/.+/) || 
                    url.match(/apps\/packages\/.+/) ||
                    url.match(/\/avatars\/.+/) ||
                    url.match(/avatars\/.+/) ||
                    url.match(/\/uploads\/.+/) ||
                    url.match(/uploads\/.+/);
      if (match) {
        return match[0].replace(/^\//, '');
      }
      return null;
    }
  }

  /**
   * 从OSS读取文件内容
   * @param {String} filePath 文件路径（OSS中的路径，如 apps/packages/file.apk）
   * @returns {Promise<Object>} 包含文件Buffer和元数据的对象 { buffer, res }
   * @description 优先使用 content（Buffer），如果返回的是 Stream 则转换为 Buffer
   */
  async getFileContent(filePath) {
    if (!filePath) {
      throw new Error('文件路径不能为空');
    }

    const client = this.getClient();
    try {
      // 使用 get() 方法，返回 { content, res }
      // content 通常是 Buffer，也可能是 Stream
      const result = await client.get(filePath);
      
      // 优先使用 content（Buffer）
      if (result.content) {
        if (Buffer.isBuffer(result.content)) {
          return {
            buffer: result.content,
            res: result.res || {},
          };
        }
        
        // 如果 content 是 Stream，转换为 Buffer
        if (typeof result.content.on === 'function') {
          const chunks = [];
          return new Promise((resolve, reject) => {
            result.content.on('data', chunk => {
              chunks.push(chunk);
            });
            result.content.on('end', () => {
              const buffer = Buffer.concat(chunks);
              resolve({
                buffer,
                res: result.res || {},
              });
            });
            result.content.on('error', error => {
              this.ctx.logger.error('OSS读取文件流失败:', error);
              reject(new Error(`读取文件流失败: ${error.message}`));
            });
          });
        }
      }
      
      // 兼容旧版本 SDK：如果返回的是 stream
      if (result.stream && typeof result.stream.on === 'function') {
        const chunks = [];
        return new Promise((resolve, reject) => {
          result.stream.on('data', chunk => {
            chunks.push(chunk);
          });
          result.stream.on('end', () => {
            const buffer = Buffer.concat(chunks);
            resolve({
              buffer,
              res: result.res || {},
            });
          });
          result.stream.on('error', error => {
            this.ctx.logger.error('OSS读取文件流失败:', error);
            reject(new Error(`读取文件流失败: ${error.message}`));
          });
        });
      }
      
      // 如果都不匹配，抛出错误
      throw new Error(`无法从OSS读取文件：返回结构异常`);
    } catch (error) {
      this.ctx.logger.error('OSS读取文件失败:', error);
      throw new Error(`读取文件失败: ${error.message}`);
    }
  }
}

module.exports = OssService;

