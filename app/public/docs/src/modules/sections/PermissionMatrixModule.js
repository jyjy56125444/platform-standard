const { defineComponent } = Vue;

export default defineComponent({
  name: 'PermissionMatrixModule',
  template: `
    <div class="permission-matrix">
      <section id="permission-overview">
        <div class="card">
          <h2>一、权限体系概述</h2>
          <p>平台采用<strong>双层权限体系</strong>：</p>
          <ul>
            <li><strong>平台级权限（USER_LEVEL）</strong>：用户在整个平台的权限级别</li>
            <li><strong>应用级权限（APP_USER_PERMISSION）</strong>：用户在特定应用中的权限</li>
          </ul>
          
          <h3>权限层级关系</h3>
          <pre class="code-dark"><code>平台级权限（USER_LEVEL）
├── 1: 超级管理员（SUPER_ADMIN）
├── 2: 开发人员（DEVELOPER）
└── 3: 访客（GUEST）

应用级权限（APP_USER_PERMISSION）
├── 1: 应用创建者（APP_CREATOR）
└── 2: 应用开发者（APP_DEVELOPER）</code></pre>
          
          <div class="warning-box">
            <strong>重要说明：</strong>
            <ul>
              <li>级别数字越小，权限越高（1 &lt; 2 &lt; 3）</li>
              <li>超级管理员（USER_LEVEL=1）拥有所有权限，不受应用级权限限制</li>
              <li>开发人员（USER_LEVEL=2）需要被添加到应用权限表才能操作应用</li>
              <li>访客（USER_LEVEL=3）只能查看，不能创建应用，也不能被添加到应用权限表</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="permission-constants">
        <div class="card">
          <h2>二、权限常量定义</h2>
          
          <h3>2.1 平台级权限（USER_LEVEL）</h3>
          <table class="permission-table">
            <thead>
              <tr>
                <th>常量值</th>
                <th>数值</th>
                <th>名称</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>USER_LEVEL.SUPER_ADMIN</code></td>
                <td>1</td>
                <td>超级管理员</td>
                <td>拥有平台所有权限，不受应用级权限限制</td>
              </tr>
              <tr>
                <td><code>USER_LEVEL.DEVELOPER</code></td>
                <td>2</td>
                <td>开发人员</td>
                <td>可以创建应用，但需要被添加到应用权限表才能操作应用</td>
              </tr>
              <tr>
                <td><code>USER_LEVEL.GUEST</code></td>
                <td>3</td>
                <td>访客</td>
                <td>只能查看，不能创建应用，不能被添加到应用权限表</td>
              </tr>
            </tbody>
          </table>

          <h3>2.2 应用级权限（APP_USER_PERMISSION）</h3>
          <table class="permission-table">
            <thead>
              <tr>
                <th>常量值</th>
                <th>数值</th>
                <th>名称</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>APP_USER_PERMISSION.APP_CREATOR</code></td>
                <td>1</td>
                <td>应用创建者</td>
                <td>拥有该应用的完全控制权，可以添加/删除用户</td>
              </tr>
              <tr>
                <td><code>APP_USER_PERMISSION.APP_DEVELOPER</code></td>
                <td>2</td>
                <td>应用开发者</td>
                <td>可以维护应用，但不能添加/删除用户</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="permission-matrix">
        <div class="card">
          <h2>三、功能权限矩阵</h2>
          
          <h3>3.1 用户管理模块</h3>
          <table class="permission-table">
            <thead>
              <tr>
                <th>功能</th>
                <th class="text-center">超级管理员(1)</th>
                <th class="text-center">开发人员(2)</th>
                <th class="text-center">访客(3)</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>查看用户列表</td>
                <td class="text-center">✅</td>
                <td class="text-center">✅</td>
                <td class="text-center">✅</td>
                <td>所有人可查看</td>
              </tr>
              <tr>
                <td>创建用户</td>
                <td class="text-center">✅</td>
                <td class="text-center">❌</td>
                <td class="text-center">❌</td>
                <td>仅超级管理员</td>
              </tr>
              <tr>
                <td>更新用户信息</td>
                <td class="text-center">✅（所有用户）</td>
                <td class="text-center">✅（仅自己）</td>
                <td class="text-center">✅（仅自己）</td>
                <td>超级管理员可修改所有用户，其他只能修改自己</td>
              </tr>
              <tr>
                <td>修改用户状态</td>
                <td class="text-center">✅</td>
                <td class="text-center">❌</td>
                <td class="text-center">❌</td>
                <td>仅超级管理员</td>
              </tr>
            </tbody>
          </table>

          <h3>3.2 应用管理模块</h3>
          <table class="permission-table">
            <thead>
              <tr>
                <th>功能</th>
                <th class="text-center">超级管理员(1)</th>
                <th class="text-center">开发人员(2)</th>
                <th class="text-center">访客(3)</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>查看应用列表</td>
                <td class="text-center">✅</td>
                <td class="text-center">✅</td>
                <td class="text-center">✅</td>
                <td>所有人可查看</td>
              </tr>
              <tr>
                <td>查看应用详情</td>
                <td class="text-center">✅</td>
                <td class="text-center">✅</td>
                <td class="text-center">✅</td>
                <td>所有人可查看</td>
              </tr>
              <tr>
                <td>创建应用</td>
                <td class="text-center">✅</td>
                <td class="text-center">✅</td>
                <td class="text-center">❌</td>
                <td>创建后自动成为应用创建者</td>
              </tr>
              <tr>
                <td>更新应用</td>
                <td class="text-center">✅（所有应用）</td>
                <td class="text-center">✅（有权限的应用）</td>
                <td class="text-center">❌</td>
                <td>需要 hasAppAccess 权限</td>
              </tr>
              <tr>
                <td>删除应用</td>
                <td class="text-center">✅（所有应用）</td>
                <td class="text-center">✅（有权限的应用）</td>
                <td class="text-center">❌</td>
                <td>需要 hasAppAccess 权限</td>
              </tr>
            </tbody>
          </table>

          <h3>3.3 应用权限管理模块</h3>
          <table class="permission-table">
            <thead>
              <tr>
                <th>功能</th>
                <th class="text-center">超级管理员(1)</th>
                <th class="text-center">应用创建者</th>
                <th class="text-center">应用开发者</th>
                <th class="text-center">访客(3)</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>查看应用用户列表</td>
                <td class="text-center">✅</td>
                <td class="text-center">✅</td>
                <td class="text-center">✅</td>
                <td class="text-center">✅</td>
                <td>所有人可查看</td>
              </tr>
              <tr>
                <td>添加用户到应用</td>
                <td class="text-center">✅</td>
                <td class="text-center">✅</td>
                <td class="text-center">❌</td>
                <td class="text-center">❌</td>
                <td>需要 requireCreatorOrSuperAdmin，只能添加 USER_LEVEL=1 或 2 的用户</td>
              </tr>
              <tr>
                <td>从应用移除用户</td>
                <td class="text-center">✅</td>
                <td class="text-center">✅</td>
                <td class="text-center">❌</td>
                <td class="text-center">❌</td>
                <td>需要 requireCreatorOrSuperAdmin</td>
              </tr>
            </tbody>
          </table>
          
          <div class="warning-box">
            <strong>重要限制：</strong>
            <ul>
              <li>只能添加 USER_LEVEL 为 1（超级管理员）或 2（开发人员）的用户到应用权限表</li>
              <li>访客（USER_LEVEL=3）<strong>不能</strong>被添加到应用权限表</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="permission-logic">
        <div class="card">
          <h2>四、权限判断逻辑详解</h2>
          
          <h3>4.1 平台级权限判断</h3>
          
          <h4>checkPermission(ctx, requiredLev, errorMessage)</h4>
          <ul>
            <li><strong>功能</strong>：检查用户是否具有指定级别或更高级别</li>
            <li><strong>逻辑</strong>：<code>userLev &lt;= requiredLev</code>（数字越小权限越高）</li>
            <li><strong>示例</strong>：需要开发人员级别时，超级管理员(1) ✅、开发人员(2) ✅、访客(3) ❌</li>
          </ul>

          <h4>requireSuperAdmin(ctx, errorMessage)</h4>
          <ul>
            <li><strong>功能</strong>：检查是否为超级管理员</li>
            <li><strong>逻辑</strong>：<code>userLev === USER_LEVEL.SUPER_ADMIN</code></li>
          </ul>

          <h4>requireDeveloper(ctx, errorMessage)</h4>
          <ul>
            <li><strong>功能</strong>：检查是否为开发人员或更高</li>
            <li><strong>逻辑</strong>：<code>userLev &lt;= USER_LEVEL.DEVELOPER</code></li>
          </ul>

          <h3>4.2 应用级权限判断</h3>
          
          <h4>hasAppAccess(ctx, appId, errorMessage)</h4>
          <ul>
            <li><strong>功能</strong>：检查用户是否具备指定应用的维护权限</li>
            <li><strong>判断逻辑</strong>：
              <ol>
                <li>首先检查平台级权限：必须是开发人员或更高级别（USER_LEVEL &lt;= 2）</li>
                <li>超级管理员：直接通过 ✅</li>
                <li>开发人员：检查 mobile_app_user 表中是否存在该用户的应用权限记录</li>
              </ol>
            </li>
            <li><strong>使用场景</strong>：更新应用、删除应用等需要应用维护权限的操作</li>
          </ul>

          <h4>requireCreatorOrSuperAdmin(ctx, appId, errorMessage)</h4>
          <ul>
            <li><strong>功能</strong>：检查用户是否为应用创建者或超级管理员</li>
            <li><strong>判断逻辑</strong>：
              <ol>
                <li>首先检查平台级权限：必须是开发人员或更高级别（USER_LEVEL &lt;= 2）</li>
                <li>超级管理员：直接通过 ✅</li>
                <li>开发人员：检查 mobile_app_user 表中该用户的 PERMISSIONS 是否为 APP_CREATOR(1)</li>
              </ol>
            </li>
            <li><strong>使用场景</strong>：添加/删除应用用户等需要应用创建者权限的操作</li>
          </ul>
        </div>
      </section>

      <section id="permission-examples">
        <div class="card">
          <h2>五、权限组合示例</h2>
          
          <h3>场景1：超级管理员</h3>
          <ul>
            <li><strong>USER_LEVEL</strong>: 1（超级管理员）</li>
            <li><strong>APP_USER_PERMISSION</strong>: 无（不需要）</li>
            <li><strong>权限说明</strong>：拥有所有权限，可以操作所有应用，不受应用级权限限制</li>
          </ul>

          <h3>场景2：应用创建者</h3>
          <ul>
            <li><strong>USER_LEVEL</strong>: 2（开发人员）</li>
            <li><strong>APP_USER_PERMISSION</strong>: 1（应用创建者）</li>
            <li><strong>权限说明</strong>：
              <ul>
                <li>可以创建应用（创建后自动成为该应用的创建者）</li>
                <li>可以添加/删除该应用的用户</li>
                <li>可以更新/删除该应用</li>
                <li>不能操作其他未授权的应用</li>
              </ul>
            </li>
          </ul>

          <h3>场景3：应用开发者</h3>
          <ul>
            <li><strong>USER_LEVEL</strong>: 2（开发人员）</li>
            <li><strong>APP_USER_PERMISSION</strong>: 2（应用开发者）</li>
            <li><strong>权限说明</strong>：
              <ul>
                <li>可以查看应用列表和详情</li>
                <li>可以更新该应用（需要 hasAppAccess）</li>
                <li>可以删除该应用（需要 hasAppAccess）</li>
                <li><strong>不能</strong>添加/删除该应用的用户（需要创建者权限）</li>
              </ul>
            </li>
          </ul>

          <h3>场景4：访客</h3>
          <ul>
            <li><strong>USER_LEVEL</strong>: 3（访客）</li>
            <li><strong>APP_USER_PERMISSION</strong>: 无</li>
            <li><strong>权限说明</strong>：
              <ul>
                <li>只能查看应用列表和详情</li>
                <li>不能创建应用</li>
                <li>不能操作任何应用</li>
                <li>不能被添加到应用权限表</li>
              </ul>
            </li>
          </ul>
        </div>
      </section>

      <section id="permission-apis">
        <div class="card">
          <h2>六、用户权限接口</h2>
          <p>所有接口均需在 Header 中携带 <code>Authorization: Bearer YOUR_TOKEN</code>。其中 POST/DELETE 接口仅应用创建者或超级管理员可调用。</p>

          <div class="card" style="margin-top:12px;" id="api-access">
            <div class="pill get">GET /api/mobile/apps/:appId/access</div>
            <h3 style="margin:10px 0 6px 0;font-size:16px;">判断用户是否拥有指定应用的维护权限</h3>
            <div class="tip">默认查询当前用户，可通过 <code>userId</code> 查询其他用户</div>
            <div class="tip">cURL</div>
            <pre><code>curl -X GET "http://localhost:7001/api/mobile/apps/1/access" \\
  -H "Authorization: Bearer YOUR_TOKEN"

# 查询其他用户
curl -X GET "http://localhost:7001/api/mobile/apps/1/access?userId=123" \\
  -H "Authorization: Bearer YOUR_TOKEN"</code></pre>
          </div>

          <div class="card" style="margin-top:16px;" id="api-permission">
            <div class="pill get">GET /api/mobile/apps/:appId/permission</div>
            <h3 style="margin:10px 0 6px 0;font-size:16px;">获取用户在应用中的权限</h3>
            <div class="tip">返回 1-创建者，2-开发者，null-无权限；支持 <code>userId</code> 查询其他用户</div>
            <div class="tip">cURL</div>
            <pre><code>curl -X GET "http://localhost:7001/api/mobile/apps/1/permission" \\
  -H "Authorization: Bearer YOUR_TOKEN"

# 查询其他用户
curl -X GET "http://localhost:7001/api/mobile/apps/1/permission?userId=123" \\
  -H "Authorization: Bearer YOUR_TOKEN"</code></pre>
          </div>

          <div class="card" style="margin-top:16px;">
            <div class="pill get">GET /api/mobile/apps/:appId/users</div>
            <h3 style="margin:10px 0 6px 0;font-size:16px;">获取应用用户列表</h3>
            <div class="tip">所有人可查看，返回权限信息及用户详情</div>
            <div class="tip">cURL</div>
            <pre><code>curl -X GET "http://localhost:7001/api/mobile/apps/1/users" \\
  -H "Authorization: Bearer YOUR_TOKEN"</code></pre>
          </div>

          <div class="card" style="margin-top:16px;">
            <div class="pill get">GET /api/mobile/apps/users/authorized</div>
            <h3 style="margin:10px 0 6px 0;font-size:16px;">获取当前用户授权的应用列表</h3>
            <div class="tip">返回 mobile_app 主表字段及当前用户的 <code>permission</code> 等级</div>
            <div class="tip">cURL</div>
            <pre><code>curl -X GET "http://localhost:7001/api/mobile/apps/users/authorized" \\
  -H "Authorization: Bearer YOUR_TOKEN"</code></pre>
          </div>

          <div class="card" style="margin-top:16px;">
            <div class="pill post">POST /api/mobile/apps/:appId/users</div>
            <h3 style="margin:10px 0 6px 0;font-size:16px;">添加用户到应用权限表</h3>
            <div class="tip">仅创建者/超级管理员可调用，新增用户自动赋予开发者权限；只能添加 USER_LEVEL 为 1（超级管理员）或 2（开发人员）的用户，访客（USER_LEVEL=3）不能添加到应用权限表。</div>
            <div class="tip">cURL</div>
            <pre><code>curl -X POST "http://localhost:7001/api/mobile/apps/1/users" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "userId": 2002,
    "remark": "前端联调成员"
  }'</code></pre>
          </div>

          <div class="card" style="margin-top:16px;">
            <div class="pill del">DELETE /api/mobile/apps/:appId/users</div>
            <h3 style="margin:10px 0 6px 0;font-size:16px;">移除应用用户权限</h3>
            <div class="tip">仅创建者/超级管理员可调用，且不能删除应用创建者（permission=1）；支持批量删除</div>
            <div class="tip">cURL</div>
            <pre><code>curl -X DELETE "http://localhost:7001/api/mobile/apps/1/users" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "userIds": [2002, 2003]
  }'</code></pre>
            <div class="tip" style="margin-top:8px;">兼容单个删除：body 中传入 <code>{"userId": 2002}</code> 即可</div>
          </div>

        </div>
      </section>

      <section id="frontend-guide">
        <div class="card">
          <h2>七、前端开发指南</h2>
          
          <h3>7.1 获取用户权限信息</h3>
          <p>用户登录后，建议<strong>立即</strong>拉取授权应用列表并缓存，以便前端界面快速判断可操作的 App：</p>
          <div class="tip">
            <ol>
              <li>调用 <code>POST /api/login</code> 获取 Token。</li>
              <li>立即调用 <code>GET /api/mobile/apps/users/authorized</code>，将返回结果缓存到 Pinia/Vuex/LocalStorage 等。</li>
              <li>后续判断应用级权限时优先读取缓存，必要时再调用其他接口刷新。</li>
            </ol>
          </div>
          <p>登录返回的 Token 中仍包含基础用户信息：</p>
          <pre class="code-dark"><code>{
  userId: 1,           // 用户ID
  username: "admin",   // 用户名
  userLev: 1           // 用户级别：1-超级管理员，2-开发人员，3-访客
}</code></pre>

          <h3>7.2 前端权限判断</h3>
          
          <h4>判断平台级权限</h4>
          <pre class="code-dark"><code>// 判断是否为超级管理员
const isSuperAdmin = userLev === 1;

// 判断是否为开发人员或更高
const isDeveloperOrAbove = userLev &lt;= 2;

// 判断是否为访客
const isGuest = userLev === 3;</code></pre>

          <h4>判断应用级权限</h4>
          <p>应用级权限可直接使用缓存的“授权应用列表”，也可在局部场景调用《六、用户权限接口》中的 API。</p>

          <div class="tip" style="margin-top:12px;">缓存授权应用列表建议</div>
          <p>推荐使用 Pinia/Vuex 等全局状态管理，将 <code>/api/mobile/apps/users/authorized</code> 的响应持久化到状态或 LocalStorage，供页面快速判断。示例：</p>
          <ul>
            <li>登录成功后立即调用 <code>fetchAuthorizedApps</code> action。</li>
            <li>将接口返回的列表存入 Pinia，并根据需要写入 LocalStorage。</li>
            <li>在路由守卫或页面初始化时读取该缓存，减少重复请求。</li>
          </ul>

          <div class="tip" style="margin-top:12px;">权限判断示例</div>
          <pre class="code-dark"><code>// 判断当前用户是否有应用维护权限
const response = await fetch(\`/api/mobile/apps/\${appId}/access\`, {
  headers: { 'Authorization': \`Bearer \${token}\` }
});
const { data } = await response.json();
const hasAccess = data.hasAccess; // true/false

// 获取当前用户在应用中的具体权限
const permissionResponse = await fetch(\`/api/mobile/apps/\${appId}/permission\`, {
  headers: { 'Authorization': \`Bearer \${token}\` }
});
const { data: permissionData } = await permissionResponse.json();
const permission = permissionData.permission; // 1-创建者，2-开发者，null-无权限

// 判断是否为应用创建者
const isAppCreator = permission === 1;

// 判断是否为应用开发者
const isAppDeveloper = permission === 2;

// 注意：如需查询其他用户的权限，可在接口后添加 userId 查询参数
// 例如：GET /api/mobile/apps/:appId/permission?userId=123
// 或：GET /api/mobile/apps/:appId/access?userId=123

</code></pre>

          <h3>7.3 权限常量定义（前端）</h3>
          <p>建议在前端定义相同的常量：</p>
          <pre class="code-dark"><code>// 平台级权限
const USER_LEVEL = {
  SUPER_ADMIN: 1,    // 超级管理员
  DEVELOPER: 2,      // 开发人员
  GUEST: 3,          // 访客
};

// 应用级权限
const APP_USER_PERMISSION = {
  APP_CREATOR: 1,    // 应用创建者
  APP_DEVELOPER: 2,  // 应用开发者
};</code></pre>

          <h3>7.4 错误处理</h3>
          <p>后端会返回以下错误码：</p>
          <ul>
            <li><strong>401</strong>: 未登录或Token已过期</li>
            <li><strong>403</strong>: 权限不足</li>
            <li><strong>404</strong>: 资源不存在</li>
          </ul>
        </div>
      </section>

      <section id="api-permissions">
        <div class="card">
          <h2>八、API 权限要求汇总</h2>
          
          <h3>8.1 用户管理 API</h3>
          <table class="permission-table">
            <thead>
              <tr>
                <th>API</th>
                <th>方法</th>
                <th>权限要求</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>/api/users</code></td>
                <td>GET</td>
                <td>所有人</td>
              </tr>
              <tr>
                <td><code>/api/users</code></td>
                <td>POST</td>
                <td>仅超级管理员</td>
              </tr>
              <tr>
                <td><code>/api/users/:id</code></td>
                <td>PUT</td>
                <td>超级管理员（所有用户）或 自己</td>
              </tr>
            </tbody>
          </table>

          <h3>8.2 应用管理 API</h3>
          <table class="permission-table">
            <thead>
              <tr>
                <th>API</th>
                <th>方法</th>
                <th>权限要求</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>/api/mobile/apps</code></td>
                <td>GET</td>
                <td>所有人</td>
              </tr>
              <tr>
                <td><code>/api/mobile/apps/:id</code></td>
                <td>GET</td>
                <td>所有人</td>
              </tr>
              <tr>
                <td><code>/api/mobile/apps</code></td>
                <td>POST</td>
                <td>开发人员及以上（USER_LEVEL &lt;= 2）</td>
              </tr>
              <tr>
                <td><code>/api/mobile/apps/:id</code></td>
                <td>PUT</td>
                <td>超级管理员 或 有应用权限的开发人员</td>
              </tr>
              <tr>
                <td><code>/api/mobile/apps/:id</code></td>
                <td>DELETE</td>
                <td>超级管理员 或 有应用权限的开发人员</td>
              </tr>
            </tbody>
          </table>

          <h3>8.3 应用权限管理 API</h3>
          <table class="permission-table">
            <thead>
              <tr>
                <th>API</th>
                <th>方法</th>
                <th>权限要求</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>/api/mobile/apps/:appId/users</code></td>
                <td>GET</td>
                <td>所有人</td>
              </tr>
              <tr>
                <td><code>/api/mobile/apps/:appId/users</code></td>
                <td>POST</td>
                <td>应用创建者 或 超级管理员（只能添加 USER_LEVEL=1 或 2 的用户）</td>
              </tr>
              <tr>
                <td><code>/api/mobile/apps/:appId/users/:userId</code></td>
                <td>DELETE</td>
                <td>应用创建者 或 超级管理员</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="faq">
        <div class="card">
          <h2>九、常见问题</h2>
          
          <h3>Q1: 超级管理员需要被添加到应用权限表吗？</h3>
          <p><strong>A</strong>: 不需要。超级管理员拥有所有权限，不受应用级权限限制。</p>

          <h3>Q2: 访客可以被添加到应用权限表吗？</h3>
          <p><strong>A</strong>: 不可以。只能添加 USER_LEVEL 为 1（超级管理员）或 2（开发人员）的用户。</p>

          <h3>Q3: 应用创建者可以添加其他创建者吗？</h3>
          <p><strong>A</strong>: 不可以。创建者只能通过创建应用时自动添加，后续不能再增加创建者。只能添加应用开发者（APP_DEVELOPER）。</p>

          <h3>Q4: 如何判断用户是否有某个应用的权限？</h3>
          <p><strong>A</strong>:</p>
          <ol>
            <li>如果是超级管理员（USER_LEVEL=1），直接有权限</li>
            <li>如果是开发人员（USER_LEVEL=2），推荐调用以下接口：
              <ul>
                <li><code>GET /api/mobile/apps/:appId/access</code> - 判断是否有维护权限（返回 true/false）</li>
                <li><code>GET /api/mobile/apps/:appId/permission</code> - 获取具体权限值（1-创建者，2-开发者，null-无权限）</li>
              </ul>
            </li>
          </ol>

          <h3>Q5: 权限检查的顺序是什么？</h3>
          <p><strong>A</strong>:</p>
          <ol>
            <li>首先检查平台级权限（USER_LEVEL）</li>
            <li>如果是超级管理员，直接通过</li>
            <li>如果是开发人员，再检查应用级权限（APP_USER_PERMISSION）</li>
          </ol>
        </div>
      </section>
    </div>
  `
});

