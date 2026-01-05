# Egg.js 最小项目

这是一个基于阿里Egg框架的最小可运行Node.js项目，支持多种数据库包括国产数据库。

## 项目结构

```
├── app/
│   ├── controller/     # 控制器目录
│   │   └── home.js    # 首页控制器
│   ├── service/       # 服务层目录
│   │   └── user.js    # 用户服务
│   ├── model/         # 数据模型目录
│   │   ├── user.js    # 用户模型
│   │   └── article.js # 文章模型
│   ├── middleware/    # 中间件目录
│   └── router.js      # 路由配置
├── config/            # 配置文件目录
│   ├── config.default.js  # 默认配置
│   ├── config.local.js    # 本地开发配置
│   ├── config.prod.js     # 生产环境配置
│   ├── config.database.js # 国产数据库配置示例
│   └── plugin.js      # 插件配置
├── database/          # 数据库脚本
│   └── init.sql      # 初始化SQL脚本
├── package.json       # 项目依赖配置
└── index.js          # 应用启动文件
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置数据库

#### MySQL配置（默认）
```javascript
// config/config.default.js
config.mysql = {
  client: {
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'password',
    database: 'egg_minimal',
  },
};
```

#### 国产数据库配置
```javascript
// 达梦数据库
config.sequelize = {
  dialect: 'dm',
  host: 'localhost',
  port: 5236,
  database: 'EGG_MINIMAL',
  username: 'SYSDBA',
  password: 'SYSDBA',
};

// 人大金仓
config.sequelize = {
  dialect: 'postgres',
  host: 'localhost',
  port: 54321,
  database: 'test',
  username: 'system',
  password: 'manager',
};
```

### 3. 初始化数据库

```bash
# 导入SQL脚本
mysql -u root -p < database/init.sql
```

### 4. 启动开发服务器

```bash
npm run dev
```

### 5. 访问应用

- 首页: http://localhost:7001
- 健康检查: http://localhost:7001/health
- API状态: http://localhost:7001/api/status
- 用户列表: http://localhost:7001/api/users
- 创建用户: POST http://localhost:7001/api/users

## 可用脚本

- `npm run dev` - 启动开发服务器
- `npm start` - 启动生产服务器
- `npm stop` - 停止生产服务器
- `npm test` - 运行测试
- `npm run lint` - 代码检查

## 技术栈

- Node.js >= 14.0.0
- Egg.js 3.x
- MySQL / 国产数据库
- Sequelize ORM
- ES6+

## 功能特性

- ✅ 基础路由与分组
- ✅ 统一鉴权中间件（JWT）
- ✅ 配置文件分环境覆盖（default/local/prod）
- ✅ 健康检查与状态接口
- ✅ 日志与安全配置
- ✅ MySQL 支持（egg-mysql）与可选 Sequelize
- ✅ 服务层架构与用户管理接口
- ✅ 阿里云 OSS 头像上传（ali-oss）

## 支持的数据库

### 开源数据库
- **MySQL** - 最流行的关系型数据库
- **PostgreSQL** - 功能强大的开源数据库
- **SQLite** - 轻量级嵌入式数据库
- **MongoDB** - 文档型NoSQL数据库

### 国产数据库
- **达梦数据库(DM)** - 国产关系型数据库
- **人大金仓(KingbaseES)** - 兼容PostgreSQL
- **南大通用(GBase)** - 支持MySQL协议
- **华为GaussDB** - 兼容PostgreSQL
- **腾讯TDSQL** - 分布式数据库
- **阿里PolarDB** - 云原生数据库

## API接口

### 用户管理
- `POST /api/login` - 用户登录，返回 `token` 与 `refreshToken`
- `POST /api/refresh` - 刷新访问令牌
- `GET /api/user/current` - 获取当前登录用户信息
- `GET /api/users` - 获取用户列表（返回包含 `userAvatar`）
- `POST /api/users` - 创建用户
- `POST /api/users/avatar` - 上传/更换头像（multipart/form-data，字段名 `file`）

### 系统接口
- `GET /` - 首页
- `GET /health` - 健康检查
- `GET /api/status` - API状态

## 开发指南

### 添加新的数据模型
1. 在 `app/model/` 目录创建模型文件
2. 在 `app/service/` 目录创建服务文件
3. 在 `app/controller/` 目录添加控制器方法
4. 在 `app/router.js` 中添加路由

### 数据库迁移
使用Sequelize CLI进行数据库迁移：
```bash
npx sequelize-cli migration:generate --name create-users-table
npx sequelize-cli db:migrate
```

# 平台标准项目

## 开发命名规范（Controller / Service / Model）

为避免不同逻辑层使用相同文件名造成混淆，约定如下：

- Controller：使用 `xxxController.js`
  - 例如：`app/controller/userController.js`
  - 在路由中使用：`controller.userController.*`
- Service：使用 `xxxService.js`
  - 例如：`app/service/userService.js`
  - 在代码中使用：`ctx.service.userService.*`
- Model（Sequelize）：建议保持与实体一致的文件名（Egg 自动加载约束）
  - 例如：`app/model/user.js`（对应 `ctx.model.User`）
  - 说明：Model 文件名会影响 `ctx.model.*` 的键名，不建议添加后缀，否则需同步调整所有引用。

其他约定：
- 目录下文件名全部小驼峰，后缀用于标识层次（Controller/Service）。
- API 路由统一放在 `app/router.js`，分组注释清晰标识模块。
- 认证相关中间件放 `app/middleware`，命名使用动词或功能词：`auth.js`。

迁移建议：
- 现已将用户相关接口迁移到 `userController.js` 与 `userService.js`。
- Sequelize 的 `app/model/user.js` 暂保留兼容；若后续完全以 `plat_users`（egg-mysql）为准，可移除该 Model 并清理相关引用。

## 鉴权与中间件规范

- 全局启用 `app/middleware/auth.js`，在 `config/config.default.js` 中通过 `config.middleware = ['auth']` 注册。
- 鉴权流程：
  - 非白名单路由自动从 `Authorization: Bearer <token>` 提取并校验 JWT。
  - 校验通过后将用户挂载到 `ctx.auth = { userId, username, userLev }`。
  - 失败返回 401，Controller 不会被执行。
- Controller 编写规范：
  - 不需要手动做 Token 校验，直接使用 `ctx.auth.userId` 等信息。
  - 权限判断统一使用 `app/utils/permission.js`：
    - `PermissionUtil.isSuperAdmin(ctx.auth.userLev)` 判断是否 1 级管理员
    - `PermissionUtil.requireSuperAdmin(ctx, '仅管理员可执行')` 在控制器内快速拦截并返回 403
    - 其他场景可用 `PermissionUtil.checkPermission(ctx, USER_LEVEL.DEVELOPER, '需要开发者权限')`

## 头像上传（阿里云 OSS）

- 接口：`POST /api/users/avatar`
- 认证：需要 `Authorization: Bearer <token>`
- Body：`multipart/form-data`，字段名 `file`（图片）
- 大小与类型：≤ 5MB；jpg、jpeg、png、gif、webp
- 行为：
  - 上传到 OSS，并将图片 URL 写入 `plat_users.USER_AVATAR`。
  - 若已有旧头像，会异步尝试删除旧文件（不影响本次响应）。
- 配置：在 `config/config.default.js` 的 `config.oss` 中直接维护（默认已写死常量）。

示例（curl）：
```bash
curl -X POST http://localhost:7001/api/users/avatar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@C:/path/to/avatar.jpg"
```

前端示例：
```javascript
const form = new FormData();
form.append('file', file);
const res = await fetch('/api/users/avatar', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: form,
});
const data = await res.json();
```

## 配置与环境说明

- 默认配置：`config/config.default.js`（已写死 `config.oss`，便于项目内维护）。
- 本地环境：`config/config.local.js`（当前不再覆盖 `config.oss`）。
- 生产环境：`config/config.prod.js`（如需要，按需覆盖）。
- 环境优先级：`default` + 当前环境文件（如 `local`/`prod` 覆盖同名键）。

## 数据表

- `plat_users`（见 `database/init.sql`）：
  - 新增字段：`USER_AVATAR VARCHAR(500)` 用于存放头像 URL。

## Milvus 2.4.x 向量数据库集成

### 关键配置

项目使用 Milvus 2.4.5 作为向量数据库，用于 RAG（检索增强生成）系统的向量存储和检索。

#### 1. Collection 加载（重要）

**Milvus 的 Collection 必须加载到内存后才能进行搜索**，否则搜索会返回空结果。

```javascript
// app/service/langchain/milvusVectorStore.js
async ensureCollectionLoaded(collectionName) {
  const client = this.getClient();
  
  // 检查 Collection 是否存在
  const hasCollection = await client.hasCollection({ collection_name: collectionName });
  if (!hasCollection.value) {
    return;
  }

  // 检查加载状态（兼容枚举和字符串格式）
  const loadState = await client.getLoadState({ collection_name: collectionName });
  const stateValue = loadState.state?.toString() || String(loadState.state);
  const isLoaded = stateValue.includes('Loaded') || stateValue === 'Loaded';
  
  if (!isLoaded) {
    // 未加载则加载 Collection
    await client.loadCollection({ collection_name: collectionName });
  }
}
```

**调用时机**：
- 在 `initRAGComponents` 中初始化时加载
- 在 `similaritySearch` 搜索前确保已加载
- 在 `addDocuments` 添加文档后确保已加载

#### 2. 搜索 API 正确格式（Milvus 2.4.x）

**关键点**：`params` 必须是 **JSON 字符串格式**，不是对象！

```javascript
// app/service/langchain/milvusVectorStore.js
const searchRequest = {
  collection_name: collectionName,
  data: [normalizedVector], // 查询向量数组
  anns_field: 'vector', // 向量字段名，在顶层
  search_params: {
    metric_type: 'COSINE', // 距离度量类型
    params: JSON.stringify({ ef: 100 }), // ⚠️ 必须是 JSON 字符串，不是对象！
    topk: topK, // 在 search_params 中设置 topk（Milvus 要求）
  },
  limit: topK, // 同时在顶层设置 limit（备选方案）
  output_fields: ['text'], // 输出字段
};

const results = await client.search(searchRequest);
```

**常见错误**：
- ❌ `params: { ef: 100 }` - 对象格式会导致 JSON 解析错误
- ✅ `params: JSON.stringify({ ef: 100 })` - 正确的字符串格式

#### 3. 结果解析（Milvus 2.4.x 返回格式）

Milvus 2.4.x 的返回结构中，`results.results` **本身就是结果数组**，每个元素包含 `score` 和 `text` 字段。

```javascript
// app/service/langchain/milvusVectorStore.js
if (results && results.results && Array.isArray(results.results) && results.results.length > 0) {
  const firstElement = results.results[0];
  
  if (firstElement && typeof firstElement === 'object' && firstElement.hasOwnProperty('score')) {
    // results.results 本身就是结果数组，每个元素包含 score 和 text
    rawResults = results.results;
  } else if (Array.isArray(firstElement)) {
    // 如果第一个元素是数组，说明 results.results[0] 是结果数组
    rawResults = firstElement;
  }
}

// 格式化结果
const formattedResults = rawResults.map((item, idx) => {
  // Milvus 2.4.x 直接返回的格式：{ score, text }
  if (item.score !== undefined && item.text !== undefined) {
    return {
      id: item.id || `result_${idx}`,
      text: item.text,
      metadata: item.metadata || {},
      score: item.score,
    };
  }
  // 兼容旧的 entity 结构格式
  // ...
});
```

#### 4. 完整搜索流程示例

```javascript
// 1. 确保 Collection 已加载
await this.ensureCollectionLoaded(collectionName);

// 2. 规范化查询向量（确保是数字数组）
const normalizedVector = queryVector.map(v => Number(v));

// 3. 构建搜索参数（注意 params 是 JSON 字符串）
const ef = Math.max(topK * 2, 100); // HNSW 索引的 ef 参数
const searchRequest = {
  collection_name: collectionName,
  data: [normalizedVector],
  anns_field: 'vector',
  search_params: {
    metric_type: 'COSINE',
    params: JSON.stringify({ ef }), // ⚠️ JSON 字符串格式
    topk: topK,
  },
  limit: topK,
  output_fields: ['text'],
};

// 4. 执行搜索
const results = await client.search(searchRequest);

// 5. 解析结果（results.results 本身就是结果数组）
if (results?.results && Array.isArray(results.results)) {
  const searchResults = results.results.map(item => ({
    id: item.id || `result_${idx}`,
    text: item.text,
    score: item.score,
    metadata: item.metadata || {},
  }));
  
  // 6. 按阈值过滤
  return searchResults.filter(item => item.score >= threshold);
}
```

### 关键文件

- `app/service/langchain/milvusVectorStore.js` - Milvus 向量存储服务封装
- `app/service/langchain/ragService.js` - RAG 服务，整合向量检索和 LLM
- `config/config.default.js` - Milvus 连接配置

### 配置示例

```javascript
// config/config.default.js
config.milvus = {
  address: process.env.MILVUS_ADDRESS || 'localhost:19530',
  username: process.env.MILVUS_USERNAME || '',
  password: process.env.MILVUS_PASSWORD || '',
};
```

### 常见问题

1. **搜索返回空结果**
   - 检查 Collection 是否已加载（调用 `ensureCollectionLoaded`）
   - 检查 Collection 是否有数据（`count` 方法）

2. **JSON 解析错误**
   - 确保 `params` 是 JSON 字符串格式：`JSON.stringify({ ef: 100 })`
   - 不要使用对象格式：`{ ef: 100 }`

3. **结果解析失败**
   - Milvus 2.4.x 的 `results.results` 本身就是结果数组
   - 每个元素包含 `score` 和 `text` 字段
   - 不需要取 `results.results[0]`

## 文件下载中的 ECONNRESET 错误处理

### 问题描述

在移动端文件下载场景中（特别是 APK 文件），经常会出现 `ECONNRESET` 错误被记录到日志中，即使下载已经成功完成。这是因为：

1. **移动浏览器的行为**：移动浏览器（特别是非 WiFi 环境）在开始下载后可能会主动关闭 HTTP 连接，这是正常行为。
2. **错误触发位置**：`ECONNRESET` 错误通常在 **TCP 层（socket）** 触发，而不是在 HTTP 响应流层。
3. **误报问题**：虽然下载已经成功，但框架的默认错误处理器会将这些连接重置记录为错误日志。

### 解决方案

**核心思路**：在 TCP 层（socket）监听错误事件，过滤掉已发送响应头后的 `ECONNRESET` 错误。

#### 实现代码

```javascript
// app/controller/clientController.js
async downloadApp() {
  const { ctx } = this;
  try {
    // ... 文件读取逻辑 ...
    
    // 监听 socket 的错误事件（TCP 层），过滤客户端提前断开连接的错误
    // 移动浏览器在开始下载后可能会关闭 HTTP 连接，这是正常行为，不应该记录为错误
    if (ctx.res.socket) {
      const socketErrorHandler = err => {
        if (err.code === 'ECONNRESET' && ctx.res.headersSent) {
          // 不记录为错误，静默处理
          return;
        }
      };
      // 移除 socket 上可能存在的 error 监听器
      ctx.res.socket.removeAllListeners('error');
      ctx.res.socket.on('error', socketErrorHandler);
      
      // 清理 socket 错误处理器
      ctx.res.once('close', () => {
        if (ctx.res.socket) {
          ctx.res.socket.removeListener('error', socketErrorHandler);
        }
      });
    }
    
    // 设置响应头
    ctx.set('Content-Type', 'application/vnd.android.package-archive');
    ctx.set('Content-Disposition', `attachment; filename="${filename}"`);
    
    // 返回文件 Buffer
    ctx.body = buffer;
  } catch (error) {
    ctx.logger.error('客户端下载应用失败:', error);
    if (!ctx.res.headersSent) {
      ctx.status = 500;
      ctx.body = { code: 500, message: '下载应用失败', error: error.message };
    }
  }
}
```

### 关键点

1. **监听位置**：必须在 **socket 层**（`ctx.res.socket`）监听错误，而不是响应流层（`ctx.res`）。
2. **判断条件**：只有当 `err.code === 'ECONNRESET'` 且 `ctx.res.headersSent === true` 时才静默处理。
3. **清理监听器**：在响应关闭时清理 socket 错误监听器，避免内存泄漏。
4. **移除旧监听器**：使用 `removeAllListeners('error')` 移除可能存在的默认错误监听器。

### 为什么不在其他层处理？

经过测试验证：

- ❌ **HTTP 响应流层**（`ctx.res.on('error')`）：无法捕获 TCP 层的 `ECONNRESET` 错误
- ❌ **应用层错误监听**（`app.on('error')`）：无法在错误传播前拦截
- ❌ **配置层错误处理**（`config.onerror`）：无法在错误记录前过滤
- ❌ **Catch 块处理**：错误已经在 socket 层触发并记录，catch 块无法阻止
- ✅ **Socket 层监听**（`ctx.res.socket.on('error')`）：**唯一有效**的解决方案

### 适用场景

- 移动端文件下载（APK、IPA 等）
- 大文件流式传输
- 客户端可能在下载开始后主动断开连接的场景

### 注意事项

- 只过滤 `ECONNRESET` 且已发送响应头的情况，其他错误仍需正常记录
- 确保在设置响应头**之前**就设置 socket 错误监听器
- 记得在响应关闭时清理监听器，避免内存泄漏