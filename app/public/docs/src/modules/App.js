import ApiCard from './components/ApiCard.js';
import PermissionMatrixModule from './sections/PermissionMatrixModule.js';
import UsersModule from './sections/UsersModule.js';
import LogsModule from './sections/LogsModule.js';
import AppLogsModule from './sections/AppLogsModule.js';
import MobileClientModule from './sections/MobileClientModule.js';
import MobileAppsModule from './sections/MobileAppsModule.js';
import MobileVersionsModule from './sections/MobileVersionsModule.js';
import RagModule from './sections/RagModule.js';

const { ref, computed, defineComponent, h } = window.Vue || Vue;

export default defineComponent({
  name: 'App',
  components: { ApiCard, PermissionMatrixModule, UsersModule, LogsModule, MobileAppsModule, MobileVersionsModule, AppLogsModule, MobileClientModule, RagModule },
  setup(){
    const base = ref('http://localhost:7001');
    const token = ref('Bearer YOUR_TOKEN');
    const loginBody = ref(JSON.stringify({ userName:'admin', password:'123456' }, null, 2));
    const createBody = ref(JSON.stringify({
      userName: 'dev001',
      userEmail: 'dev001@example.com',
      password: '123456',
      userRealName: '开发者一号',
      userLev: 2
    }, null, 2));
    const updateBody = ref(JSON.stringify({
      userRealName: '更新的真实姓名',
      email: 'updated@example.com',
      mobile: '13800138000',
      userStatus: 1
    }, null, 2));

    const createAppBody = ref(JSON.stringify({
      appName: '我的应用',
      appFullname: '我的移动应用',
      appType: [1, 2],
      appIcon: 'https://example.com/icon.png',
      developer: '张三',
      interfaceDeveloper: '李四',
      designer: '王五',
      remark: '这是应用的备注信息'
    }, null, 2));
    const updateAppBody = ref(JSON.stringify({
      appName: '我的应用-改',
      appFullname: '我的移动应用-改',
      appType: [4],
      appIcon: 'https://example.com/new-icon.png',
      developer: '张三',
      interfaceDeveloper: '李四',
      designer: '王五',
      remark: '更新备注信息'
    }, null, 2));

    const createVersionBody = ref(JSON.stringify({
      versionType: 1,
      version: '2.0.2',
      versionCode: 202,
      comment: '适配鸿蒙系统，修复若干已知问题',
      downloadSize: '52.8MB',
      downloadUrl: 'https://oss.example.com/apps/packages/app-v2.0.2.apk',
      downloadScanImg: 'https://oss.example.com/apps/packages/app-v2.0.2-qrcode.png'
    }, null, 2));
    const updateVersionBody = ref(JSON.stringify({
      version: '2.0.3-hotfix',
      versionCode: 203,
      comment: '优化启动速度并修复崩溃问题',
      downloadUrl: 'https://oss.example.com/apps/packages/app-v2.0.3.apk'
    }, null, 2));

    const askBody = ref(JSON.stringify({
      question: '如何退出登录？',
      stream: false,
      sessionId: 123
    }, null, 2));
    const createSessionBody = ref(JSON.stringify({
      title: '新会话'
    }, null, 2));
    const setRAGConfigBody = ref(JSON.stringify({
      topK: 5,
      similarityThreshold: 0.4,
      llmTemperature: 0.7,
      llmMaxTokens: 2000,
      llmTopP: 0.8,
      chunkMaxLength: 2048,
      chunkOverlap: 100,
      indexType: 'HNSW',
      indexParams: { M: 16, efConstruction: 200 },
      rerankEnabled: 0,
      rerankModel: 'bge-reranker-base',
      rerankTopK: 10,
      status: 1,
      remark: '配置备注'
    }, null, 2));

    const full = (path)=> `${base.value || ''}${path}`;
    const tokenHeader = computed(()=> token.value || 'Bearer YOUR_TOKEN');
    const permissionMatrixOpen = ref(true);
    const usersOpen = ref(true);
    const logsOpen = ref(true);
    const appLogsOpen = ref(true);
    const clientOpen = ref(true);
    const appsOpen = ref(true);
    const versionsOpen = ref(true);
    const ragOpen = ref(true);

    return { base, token, loginBody, createBody, updateBody, createAppBody, updateAppBody, createVersionBody, updateVersionBody, askBody, createSessionBody, setRAGConfigBody, full, tokenHeader, permissionMatrixOpen, usersOpen, logsOpen, appLogsOpen, clientOpen, appsOpen, versionsOpen, ragOpen };
  },
  template: `
  <div class="container">
    <div class="hdr">
      <h1>平台标准接口文档</h1>
      <div class="small">环境 · 本地开发</div>
    </div>

    <div class="layout">
      <aside class="sidebar">
        <div class="sidebar-content">
          <h2>
            <a href="#permission-overview" class="section-link">用户权限说明</a>
            <button class="collapse-btn" @click="permissionMatrixOpen = !permissionMatrixOpen" :aria-expanded="permissionMatrixOpen">
              {{ permissionMatrixOpen ? '▾' : '▸' }}
            </button>
          </h2>
          <ul class="nav" v-show="permissionMatrixOpen">
            <li><a href="#permission-overview">权限体系概述</a></li>
            <li><a href="#permission-constants">权限常量定义</a></li>
            <li><a href="#permission-matrix">功能权限矩阵</a></li>
            <li><a href="#permission-logic">权限判断逻辑</a></li>
            <li><a href="#permission-examples">权限组合示例</a></li>
            <li><a href="#permission-apis">用户权限接口</a></li>
            <li><a href="#frontend-guide">前端开发指南</a></li>
            <li><a href="#api-permissions">API 权限要求</a></li>
            <li><a href="#faq">常见问题</a></li>
          </ul>

          <h2 style="margin-top:16px;">
            <a href="#login" class="section-link">用户管理</a>
            <button class="collapse-btn" @click="usersOpen = !usersOpen" :aria-expanded="usersOpen">
              {{ usersOpen ? '▾' : '▸' }}
            </button>
          </h2>
          <ul class="nav" v-show="usersOpen">
            <li><a href="#login">登录 /api/login</a></li>
            <li><a href="#current">当前用户 /api/user/current</a></li>
            <li><a href="#list">用户列表 /api/users</a></li>
            <li><a href="#detail">查询用户详情 /api/users/:id</a></li>
            <li><a href="#create">创建用户 /api/users</a></li>
            <li><a href="#upload">统一文件上传 /api/upload</a></li>
            <li><a href="#update">更新用户信息 /api/users/:id</a></li>
            <li><a href="#delete">删除用户 /api/users/:id</a></li>
          </ul>

          <h2 style="margin-top:16px;">
            <a href="#apps-list" class="section-link">应用信息</a>
            <button class="collapse-btn" @click="appsOpen = !appsOpen" :aria-expanded="appsOpen">
              {{ appsOpen ? '▾' : '▸' }}
            </button>
          </h2>
          <ul class="nav" v-show="appsOpen">
            <li><a href="#apps-list">应用列表 /api/mobile/apps</a></li>
            <li><a href="#apps-detail">应用详情 /api/mobile/apps/:id</a></li>
            <li><a href="#apps-create">创建应用 /api/mobile/apps</a></li>
            <li><a href="#apps-update">更新应用 /api/mobile/apps/:id</a></li>
            <li><a href="#apps-delete">删除应用 /api/mobile/apps/:id</a></li>
          </ul>

          <h2 style="margin-top:16px;">
            <a href="#versions-list" class="section-link">应用版本信息</a>
            <button class="collapse-btn" @click="versionsOpen = !versionsOpen" :aria-expanded="versionsOpen">
              {{ versionsOpen ? '▾' : '▸' }}
            </button>
          </h2>
          <ul class="nav" v-show="versionsOpen">
            <li><a href="#versions-list">版本列表 /api/mobile/apps/:appId/versions</a></li>
            <li><a href="#versions-detail">版本详情 /api/mobile/versions/:id</a></li>
            <li><a href="#versions-create">创建版本 /api/mobile/apps/:appId/versions</a></li>
            <li><a href="#versions-update">更新版本 /api/mobile/versions/:id</a></li>
            <li><a href="#versions-delete">删除版本 /api/mobile/versions/:id</a></li>
          </ul>

          <h2 style="margin-top:16px;">
            <a href="#logs-list" class="section-link">用户日志</a>
            <button class="collapse-btn" @click="logsOpen = !logsOpen" :aria-expanded="logsOpen">
              {{ logsOpen ? '▾' : '▸' }}
            </button>
          </h2>
          <ul class="nav" v-show="logsOpen">
            <li><a href="#logs-list">查询日志 /api/user/logs</a></li>
            <li><a href="#logs-create">插入日志 /api/user/logs</a></li>
            <li><a href="#logs-delete">删除日志 /api/user/logs/:id</a></li>
          </ul>

          <h2 style="margin-top:16px;">
            <a href="#app-logs-list" class="section-link">应用操作日志</a>
            <button class="collapse-btn" @click="appLogsOpen = !appLogsOpen" :aria-expanded="appLogsOpen">
              {{ appLogsOpen ? '▾' : '▸' }}
            </button>
          </h2>
          <ul class="nav" v-show="appLogsOpen">
            <li><a href="#app-logs-list">查询应用日志 /api/mobile/apps/:appId/logs</a></li>
            <li><a href="#app-logs-delete">删除应用日志 /api/mobile/apps/:appId/logs/:logId</a></li>
          </ul>

          <h2 style="margin-top:16px;">
            <a href="#client-logs" class="section-link">移动端客户端接口</a>
            <button class="collapse-btn" @click="clientOpen = !clientOpen" :aria-expanded="clientOpen">
              {{ clientOpen ? '▾' : '▸' }}
            </button>
          </h2>
          <ul class="nav" v-show="clientOpen">
            <li><a href="#client-logs">客户端记录操作日志 /api/mobile/client/logs</a></li>
            <li><a href="#client-latest-version">获取最新版本信息 /api/mobile/client/apps/:appId/latest-version</a></li>
          </ul>

          <h2 style="margin-top:16px;">
            <a href="#rag-config-get" class="section-link">RAG 知识库</a>
            <button class="collapse-btn" @click="ragOpen = !ragOpen" :aria-expanded="ragOpen">
              {{ ragOpen ? '▾' : '▸' }}
            </button>
          </h2>
          <ul class="nav" v-show="ragOpen">
            <li><a href="#rag-config-get">查询应用 RAG 配置</a></li>
            <li><a href="#rag-config-put">更新应用 RAG 配置</a></li>
            <li><a href="#rag-config-delete">还原应用 RAG 配置</a></li>
            <li><a href="#rag-documents-upload">上传文件至知识库</a></li>
            <li><a href="#rag-collections-list">查询知识库集合列表</a></li>
            <li><a href="#rag-collections-data">查询知识库文档</a></li>
            <li><a href="#rag-collections-delete">删除知识库文档</a></li>
            <li><a href="#rag-session-create">创建会话</a></li>
            <li><a href="#rag-sessions-list">获取会话列表</a></li>
            <li><a href="#rag-session-messages">获取会话对话列表</a></li>
            <li><a href="#rag-session-delete">删除会话</a></li>
            <li><a href="#rag-ask">知识库问答</a></li>
          </ul>
        </div>
      </aside>
      <main>
        <div class="card" style="margin-bottom:16px">
          <div class="tip">可选：配置基础地址与 Token，方便复制示例</div>
          <div class="row">
            <div>
              <div class="small">Base URL</div>
              <input type="text" v-model="base" placeholder="例如 http://localhost:7001" />
            </div>
            <div>
              <div class="small">Authorization Token</div>
              <input type="text" v-model="token" placeholder="Bearer xxxxx" />
            </div>
          </div>
        </div>

        <section>
          <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;">用户权限说明</h2>
          <permission-matrix-module />
        </section>

        <section style="margin-top:32px;">
          <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;">用户管理</h2>
          <users-module :full="full" :tokenHeader="tokenHeader" :loginBody="loginBody" :createBody="createBody" :updateBody="updateBody" />
        </section>

        <section style="margin-top:32px;">
          <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;">应用信息</h2>
          <mobile-apps-module
            :full="full"
            :tokenHeader="tokenHeader"
            :createAppBody="createAppBody"
            :updateAppBody="updateAppBody"
          />
        </section>

        <section style="margin-top:40px;">
          <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;">应用版本信息</h2>
          <mobile-versions-module
            :full="full"
            :tokenHeader="tokenHeader"
            :createVersionBody="createVersionBody"
            :updateVersionBody="updateVersionBody"
          />
        </section>
        <section style="margin-top:32px;">
          <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;">用户日志</h2>
          <logs-module :full="full" :tokenHeader="tokenHeader" />
        </section>
        <section style="margin-top:32px;">
          <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;">应用操作日志</h2>
          <app-logs-module :full="full" :tokenHeader="tokenHeader" />
        </section>
        <section style="margin-top:32px;">
          <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;">移动端客户端接口</h2>
          <mobile-client-module :full="full" :tokenHeader="tokenHeader" />
        </section>
        <section style="margin-top:32px;">
          <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;">RAG 知识库</h2>
          <rag-module :full="full" :tokenHeader="tokenHeader" :askBody="askBody" :createSessionBody="createSessionBody" :setRAGConfigBody="setRAGConfigBody" />
        </section>
      </main>
    </div>

    <div class="tip" style="margin-top:16px">说明：返回字段统一为驼峰；密码使用 bcrypt 加密存储；头像存储于 OSS。</div>
  </div>
  `
});

