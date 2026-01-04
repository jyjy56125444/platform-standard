'use strict';

const Controller = require('egg').Controller;
const path = require('path');

class UploadController extends Controller {
  /**
   * 统一上传接口
   * POST /api/upload
   * form: file (必填)
   * query/body: type=avatar|icon|package|rag-image|other (必填)
   * 注意：使用 ctx.multipart() 处理，不依赖字段顺序
   */
  async upload() {
    const { ctx } = this;
    try {
      // 读取 type（优先 query，其次 body）
      let typeRaw = (ctx.query.type || ctx.request.body?.type || '').toString();
      let stream = null;
      let filename = '';
      let mime = '';

      // 使用 multipart() 遍历所有字段，不依赖字段顺序
      // 关键：需要完整遍历所有字段，确保所有信息都被收集
      const parts = ctx.multipart();
      let part;
      
      // 用于临时存储文件流的数据
      let fileBuffer = null;
      let fileBufferChunks = [];
      
      while ((part = await parts()) != null) {
        if (Array.isArray(part)) {
          // 普通表单字段：立即处理
          const [ field, value ] = part;
          if (field === 'type') {
            typeRaw = String(value);
          }
        } else {
          // 文件字段：需要立即读取流数据，避免阻塞后续字段的读取
          // 这是关键：在流模式下，如果不读取文件流，后续字段可能无法正确读取
          if (!stream) {
            filename = part.filename || '';
            mime = part.mime || part.mimeType || '';
            
            // 立即读取文件流到 buffer，确保流被完全消费
            // 这样后续字段才能正确读取
            fileBufferChunks = [];
            part.on('data', chunk => {
              fileBufferChunks.push(chunk);
            });
            
            // 等待文件流读取完成
            await new Promise((resolve, reject) => {
              part.on('end', () => {
                fileBuffer = Buffer.concat(fileBufferChunks);
                // 将 buffer 转换为可读流，供后续使用
                const { Readable } = require('stream');
                stream = Readable.from(fileBuffer);
                resolve();
              });
              part.on('error', reject);
            });
          }
        }
      }

      // 验证 type 参数
      const type = typeRaw.toLowerCase();
      if (!type) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '缺少type参数' };
        return;
      }

      const allowedTypes = [ 'avatar', 'icon', 'package', 'rag-image', 'other' ];
      if (!allowedTypes.includes(type)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'type无效，应为 avatar|icon|package|rag-image|other' };
        return;
      }

      // 验证文件
      if (!stream || !filename) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '请选择要上传的文件' };
        return;
      }

      // 基于type做校验
      const ext = path.extname(filename).toLowerCase();

      // 大小（如框架未提供size，可在网关层限制；此处仅示例）
      const sizeLimitMap = {
        'avatar': 5 * 1024 * 1024,
        'icon': 2 * 1024 * 1024,
        'package': 200 * 1024 * 1024,
        'rag-image': 5 * 1024 * 1024, // RAG 知识库图片，限制 5MB
        'other': 20 * 1024 * 1024,
      };

      // 仅当获取得到大小时校验（部分运行时不提供）
      if (typeof stream._readableState?.length === 'number') {
        const est = stream._readableState.length; // 估算
        if (est > sizeLimitMap[type]) {
          ctx.status = 400;
          ctx.body = { code: 400, message: '文件过大' };
          return;
        }
      }

      const imageExts = [ '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg' ];
      const apkExts = [ '.apk', '.xapk' ];

      if (type === 'avatar' || type === 'icon' || type === 'rag-image') {
        if (!imageExts.includes(ext)) {
          ctx.status = 400;
          ctx.body = { code: 400, message: '仅支持图片类型：jpg、jpeg、png、gif、webp、svg' };
          return;
        }
        if (mime && !mime.startsWith('image/')) {
          ctx.status = 400;
          ctx.body = { code: 400, message: 'MIME类型不合法，应为image/*' };
          return;
        }
      } else if (type === 'package') {
        if (!apkExts.includes(ext)) {
          ctx.status = 400;
          ctx.body = { code: 400, message: '安装包仅支持 .apk/.xapk' };
          return;
        }
        // 常见APK MIME：application/vnd.android.package-archive
        if (mime && !/android|package|apk/i.test(mime)) {
          ctx.status = 400;
          ctx.body = { code: 400, message: '安装包MIME类型不合法' };
          return;
        }
      } else {
        // other 可扩展白名单；此处放宽，只做基本检查
      }

      const userId = ctx.auth?.userId || 0;

      // 上传到OSS（传递type参数用于生成目录结构）
      const result = await ctx.service.ossService.uploadFile(stream, filename, userId, type);

      // 如果是头像，自动写入用户资料（与原 /api/users/avatar 行为一致）
      if (type === 'avatar' && ctx.auth?.userId) {
        try {
          const currentUser = await ctx.service.userService.findById(ctx.auth.userId);
          const oldAvatarUrl = currentUser?.USER_AVATAR;
          await ctx.service.userService.update(ctx.auth.userId, { avatar: result.url });

          if (oldAvatarUrl) {
            try {
              const urlObj = new URL(oldAvatarUrl);
              const oldPath = urlObj.pathname.substring(1);
              ctx.service.ossService.deleteFile(oldPath).catch(() => {});
            } catch (e) {
              const match = oldAvatarUrl.match(/\/avatars\/.+/) || oldAvatarUrl.match(/\/apps\/.+/) || oldAvatarUrl.match(/\/uploads\/.+/);
              if (match) {
                const oldPath = match[0].replace(/^\//, '');
                ctx.service.ossService.deleteFile(oldPath).catch(() => {});
              }
            }
          }
        } catch (e) {
          ctx.logger.warn('头像写入/清理失败:', e && e.message);
        }
      }

      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          url: result.url,
          path: result.path,
          type,
          filename,
          mime,
        },
      };
    } catch (error) {
      ctx.logger.error('统一上传失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '上传失败', error: error.message };
    }
  }
}

module.exports = UploadController;


