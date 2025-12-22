'use strict';

module.exports = app => {
  const { router, controller } = app;
  
  // 首页路由
  router.get('/', controller.homeController.index);
  
  // 健康检查路由
  router.get('/health', controller.homeController.health);
  
  // API路由示例
  router.get('/api/status', controller.homeController.index);
  
  // ========== 认证相关接口 ==========
  router.post('/api/login', controller.authController.login);        // 用户登录
  router.get('/api/user/current', controller.authController.currentUser);  // 获取当前用户信息
  router.post('/api/logout', controller.authController.logout);      // 用户登出
  router.post('/api/refresh', controller.authController.refresh);    // 刷新访问令牌
  
  // ========== 用户相关API（需要Token验证）==========
  router.get('/api/users', controller.userController.users);        // 获取用户列表
  router.get('/api/users/:id', controller.userController.getUserDetail); // 查询用户详情（所有人可查询）
  router.post('/api/users', controller.userController.createUser);   // 创建用户
  router.put('/api/users/:id', controller.userController.updateUser); // 更新用户信息（级别1可修改所有，级别2、3只能修改自己的）
  router.delete('/api/users', controller.userController.deleteUser); // 删除/批量删除用户

  // ========== 统一上传接口 ==========
  router.post('/api/upload', controller.uploadController.upload);    // 统一上传：type=avatar|icon|package|other

  // ========== 日志相关 ==========
  router.post('/api/user/logs', controller.logController.createLog);   // 插入用户操作日志
  router.get('/api/user/logs', controller.logController.listLogs);     // 查看当前用户日志
  router.delete('/api/user/logs', controller.logController.deleteLog); // 删除/批量删除日志

  // ========== 移动应用管理相关API（需要Token验证）==========
  router.get('/api/mobile/apps', controller.mobileAppController.list);        // 获取应用列表（所有人可查看）
  router.get('/api/mobile/apps/:id', controller.mobileAppController.detail);   // 获取应用详情（所有人可查看）
  router.post('/api/mobile/apps', controller.mobileAppController.create);     // 创建应用（1、2级别）
  router.put('/api/mobile/apps/:id', controller.mobileAppController.update);  // 更新应用（1级别可更新所有，2级别只能更新自己创建的）
  router.delete('/api/mobile/apps/:id', controller.mobileAppController.delete); // 删除应用（1级别可删除所有，2级别只能删除自己创建的）

  // ========== 移动应用版本管理相关API（需要Token验证）==========
  router.get('/api/mobile/apps/:appId/versions', controller.mobileVersionController.list); // 获取某应用的版本列表（所有人可查看）
  router.get('/api/mobile/versions/:id', controller.mobileVersionController.detail);       // 获取版本详情（所有人可查看）
  router.post('/api/mobile/apps/:appId/versions', controller.mobileVersionController.create); // 创建版本（管理员任意，开发者仅自己创建的应用）
  router.put('/api/mobile/versions/:id', controller.mobileVersionController.update);       // 更新版本（管理员任意，开发者仅自己创建的应用）
  router.delete('/api/mobile/versions/:appId', controller.mobileVersionController.delete); // 删除/批量删除版本（按应用维度）

  // ========== 移动应用用户权限管理相关API（需要Token验证）==========
  router.get('/api/mobile/apps/:appId/access', controller.mobileAppAccessController.hasAccess);  // 判断用户是否拥有指定应用的维护权限
  router.get('/api/mobile/apps/:appId/permission', controller.mobileAppAccessController.getUserPermission);  // 获取用户在应用中的权限等级
  router.get('/api/mobile/apps/:appId/users', controller.mobileAppAccessController.listUsers);  // 获取应用的用户权限列表
  router.post('/api/mobile/apps/:appId/users', controller.mobileAppAccessController.addUser); // 添加用户到应用权限表
  router.delete('/api/mobile/apps/:appId/users', controller.mobileAppAccessController.removeUser); // 从应用权限表中移除用户/批量移除用户
  router.get('/api/mobile/apps/users/authorized', controller.mobileAppAccessController.listAuthorizedApps); // 获取当前用户授权的应用列表
  
  // ========== 应用操作日志相关API（需要Token验证）==========
  router.get('/api/mobile/apps/:appId/logs', controller.mobileAppLogController.list); // 获取应用操作日志
  router.delete('/api/mobile/apps/:appId/logs', controller.mobileAppLogController.delete); // 删除/批量删除应用操作日志

  // ========== 移动端客户端专用接口 ==========
  router.post('/api/mobile/client/logs', controller.clientController.createAppLog); // 客户端上报操作日志
  router.get('/api/mobile/client/apps/:appId/latest-version', controller.clientController.getLatestVersion); // 客户端获取某应用某平台最新版本

  // ========== LangChain RAG 接口 ==========
  // 会话管理接口
  router.post('/api/rag/sessions/:appId', controller.langchain.ragSessionController.createSession); // 创建 RAG 会话
  router.get('/api/rag/sessions/:appId', controller.langchain.ragSessionController.getSessions); // 获取会话列表（支持分页）
  router.delete('/api/rag/sessions/:appId/:sessionId', controller.langchain.ragSessionController.deleteSession); // 删除会话（级联删除所有消息）
  router.get('/api/rag/sessions/:appId/:sessionId/messages', controller.langchain.ragSessionController.getSessionMessages); // 获取会话消息列表（支持分页）
  // RAG 问答（appId 通过路径传递）
  router.post('/api/rag/ask/:appId', controller.langchain.ragController.ask);
  // 问答历史列表
  router.get('/api/rag/questions/:appId', controller.langchain.ragController.getQuestions);
  // 单条问答详情
  router.get('/api/rag/questions/:appId/:questionId', controller.langchain.ragController.getQuestionDetail);
  router.post('/api/rag/documents/:appId', controller.langchain.ragController.addDocuments); // 文档入库
  router.get('/api/rag/config/:appId', controller.langchain.ragController.getRAGConfig); // 获取 RAG 配置（完整配置）
  router.put('/api/rag/config/:appId', controller.langchain.ragController.setRAGConfig); // 设置 RAG 配置（支持部分更新）
  router.delete('/api/rag/config/:appId', controller.langchain.ragController.deleteRAGConfig); // 删除 RAG 配置（重置为默认值）

  // ========== Milvus 向量库查询接口 ==========
  router.get('/api/milvus/collections', controller.langchain.milvusController.listCollections); // 列出所有 Collections
  router.get('/api/milvus/collections/:collectionName', controller.langchain.milvusController.getCollectionInfo); // 获取 Collection 详细信息
  router.get('/api/milvus/collections/:collectionName/data', controller.langchain.milvusController.queryCollection); // 查询 Collection 数据
  router.get('/api/milvus/collections/:collectionName/count', controller.langchain.milvusController.countCollection); // 统计 Collection 文档数量
  router.delete('/api/milvus/collections/:collectionName/data', controller.langchain.milvusController.deleteDocuments); // 删除 Collection 文档（支持 ids 或 expr）
};
