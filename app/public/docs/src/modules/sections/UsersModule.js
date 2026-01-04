import ApiCard from '../components/ApiCard.js';

const { defineComponent } = window.Vue || Vue;

export default defineComponent({
  name: 'UsersModule',
  components: { ApiCard },
  props: {
    full: { type: Function, required: true },
    tokenHeader: { type: [String, Object], required: true },
    loginBody: { type: String, required: true },
    createBody: { type: String, required: true },
    updateBody: { type: String, required: true },
  },
  template: `
    <div class="stack">
      <section id="login">
        <api-card method="POST" path="/api/login" pill="post" title="登录" description="使用用户名与密码登录，返回访问令牌与用户信息。">
          <template #curl>
<pre><code>curl -X POST {{full('/api/login')}} \
  -H "Content-Type: application/json" \
  -d '{{ loginBody }}'</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userGuid": 1,
      "userName": "admin",
      "userRealName": "管理员",
      "userEmail": "admin@example.com",
      "userLev": 1,
      "userStatus": 1,
      "userAvatar": "https://example.com/avatar.jpg"
    }
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="current">
        <api-card method="GET" path="/api/user/current" pill="get" title="当前用户" description="携带 Token 获取当前登录用户信息">
          <template #curl>
<pre><code>curl -X GET {{full('/api/user/current')}} \
  -H "Authorization: {{tokenHeader}}"</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "success",
  "data": {
    "userGuid": 1,
    "userName": "admin",
    "userRealName": "管理员",
    "userEmail": "admin@example.com",
    "userLev": 1,
    "userStatus": 1,
    "userAvatar": "https://example.com/avatar.jpg",
    "mobile": "13800138000"
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="list">
        <api-card method="GET" path="/api/users" pill="get" title="用户列表" description="分页参数：page、pageSize">
          <template #curl>
<pre><code>curl -X GET "{{full('/api/users')}}?page=1&pageSize=10" \
  -H "Authorization: {{tokenHeader}}"</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "userGuid": 1,
        "userName": "admin",
        "userRealName": "管理员",
        "userEmail": "admin@example.com",
        "userLev": 1,
        "userStatus": 1,
        "userAvatar": "https://example.com/avatar.jpg"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="detail">
        <api-card method="GET" path="/api/users/:id" pill="get" title="查询用户详情" description="根据用户ID查询用户详情，所有用户都可以调用">
          <template #curl>
<pre><code>curl -X GET {{full('/api/users/123')}} \
  -H "Authorization: {{tokenHeader}}"</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "success",
  "data": {
    "userGuid": 123,
    "userName": "dev001",
    "userRealName": "开发者一号",
    "userEmail": "dev001@example.com",
    "userLev": 2,
    "userStatus": 1,
    "userAvatar": "https://example.com/avatar.jpg",
    "mobile": "13800138000"
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="create">
        <api-card method="POST" path="/api/users" pill="post" title="创建用户" description="仅 USER_LEVEL.SUPER_ADMIN（1-超级管理员）可用">
          <template #curl>
<pre><code>curl -X POST {{full('/api/users')}} \
  -H "Authorization: {{tokenHeader}}" \
  -H "Content-Type: application/json" \
  -d '{{ createBody }}'</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "创建成功",
  "data": {
    "userGuid": 200,
    "userName": "dev001",
    "userRealName": "开发者一号",
    "userEmail": "dev001@example.com",
    "userLev": 2,
    "userStatus": 1,
    "userAvatar": null,
    "mobile": null
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="upload">
        <api-card method="POST" path="/api/upload" pill="post" title="统一文件上传" description="multipart/form-data 上传文件，支持多种类型：avatar（头像）、icon（应用图标）、package（安装包）、rag-image（RAG知识库图片）、other（其他）。文件字段名：file，type参数可通过query、body或form-data传递。type=avatar时会自动更新当前用户头像。">
          <template #body>
<pre><code>// form-data 格式
file: [文件]
type: avatar  // 或 icon、package、rag-image、other

// 文件大小限制：
// - avatar: 5MB
// - icon: 2MB  
// - package: 200MB
// - rag-image: 5MB（RAG知识库图片）
// - other: 20MB

// 支持的文件格式：
// - avatar/icon/rag-image: .jpg, .jpeg, .png, .gif, .webp, .svg
// - package: .apk, .xapk
// - other: 根据实际需求</code></pre>
          </template>
          <template #curl>
<pre><code># 上传头像（type可通过query传递）
curl -X POST "{{full('/api/upload')}}?type=avatar" \
  -H "Authorization: {{tokenHeader}}" \
  -F "file=@C:/path/to/avatar.jpg"

# 上传应用图标（type通过form-data传递）
curl -X POST {{full('/api/upload')}} \
  -H "Authorization: {{tokenHeader}}" \
  -F "file=@C:/path/to/icon.png" \
  -F "type=icon"

# 上传APK安装包
curl -X POST "{{full('/api/upload')}}?type=package" \
  -H "Authorization: {{tokenHeader}}" \
  -F "file=@C:/path/to/app.apk"

# 上传RAG知识库图片（用于Markdown编辑器）
curl -X POST "{{full('/api/upload')}}?type=rag-image" \
  -H "Authorization: {{tokenHeader}}" \
  -F "file=@C:/path/to/image.png"</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "上传成功",
  "data": {
    "url": "https://oss.example.com/uploads/avatar/2024/01/01/abc123.jpg",
    "type": "avatar",
    "size": 102400,
    "filename": "avatar.jpg"
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="update">
        <api-card method="PUT" path="/api/users/:id" pill="post" title="更新用户信息" description="仅允许更新：userRealName、email、mobile、userStatus（仅级 USER_LEVEL.SUPER_ADMIN 超级管理员可修改userStatus，非管理员传递此字段时静默忽略）。仅 USER_LEVEL.SUPER_ADMIN（1-超级管理员）可修改所有用户，级别2、3只能修改自己的信息。">
          <template #curl>
<pre><code>curl -X PUT {{full('/api/users/123')}} \
  -H "Authorization: {{tokenHeader}}" \
  -H "Content-Type: application/json" \
  -d '{{ updateBody }}'</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "更新成功",
  "data": {
    "userGuid": 123,
    "userName": "dev001",
    "userRealName": "更新的真实姓名",
    "userEmail": "updated@example.com",
    "userLev": 2,
    "userStatus": 1,
    "userAvatar": "https://example.com/avatar.jpg",
    "mobile": "13800138000"
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="delete">
        <api-card
          method="DELETE"
          path="/api/users"
          pill="del"
          title="删除/批量删除用户"
          description="仅 USER_LEVEL.SUPER_ADMIN（1-超级管理员）可用；Body 传 userIds 数组（长度≥1），会同时清理用户在 mobile_app_user 中的全部应用权限。">
          <template #curl>
<pre><code>curl -X DELETE {{full('/api/users')}} \
  -H "Authorization: {{tokenHeader}}" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": [101, 105, 110]
  }'</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "删除成功",
  "data": {
    "deletedCount": 3
  }
}</code></pre>
          </template>
        </api-card>
      </section>
    </div>
  `
});

