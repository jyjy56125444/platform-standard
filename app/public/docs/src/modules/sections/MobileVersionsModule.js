import ApiCard from '../components/ApiCard.js';

const { defineComponent } = window.Vue || Vue;

export default defineComponent({
  name: 'MobileVersionsModule',
  components: { ApiCard },
  props: {
    full: { type: Function, required: true },
    tokenHeader: { type: [String, Object], required: true },
    createVersionBody: { type: String, required: true },
    updateVersionBody: { type: String, required: true },
  },
  template: `
    <div class="stack">
      <section id="versions-list">
        <api-card method="GET" path="/api/mobile/apps/:appId/versions" pill="get" title="版本列表">
          <template #desc>
            <p>查询指定应用的版本列表。支持分页参数 <code>page</code>、<code>pageSize</code>，并可按 <code>versionType</code>（平台）筛选。所有用户可查看。</p>
          </template>
          <template #curl>
<pre><code>curl -X GET "{{full('/api/mobile/apps/1/versions')}}?page=1&pageSize=10&versionType=1" \
  -H "Authorization: {{tokenHeader}}"</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 10,
        "appId": 1,
        "versionType": 1,
        "version": "2.0.2",
        "versionCode": 202,
        "comment": "适配鸿蒙系统，修复若干已知问题",
        "downloadSize": "52.8MB",
        "downloadUrl": "https://oss.example.com/apps/packages/app-v2.0.2.apk",
        "downloadScanImg": "https://oss.example.com/apps/packages/app-v2.0.2-qrcode.png",
        "creator": "admin",
        "updater": "admin",
        "createTime": "2024-01-10 10:00:00",
        "updateTime": "2024-01-10 10:00:00"
      }
    ],
    "total": 5,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="versions-detail">
        <api-card method="GET" path="/api/mobile/versions/:id" pill="get" title="版本详情" description="根据版本 ID 获取详情（所有用户可查看）">
          <template #curl>
<pre><code>curl -X GET {{full('/api/mobile/versions/1')}} \
  -H "Authorization: {{tokenHeader}}"</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "success",
  "data": {
    "id": 10,
    "appId": 1,
    "versionType": 1,
    "version": "2.0.2",
    "versionCode": 202,
    "comment": "适配鸿蒙系统，修复若干已知问题",
    "downloadSize": "52.8MB",
    "downloadUrl": "https://oss.example.com/apps/packages/app-v2.0.2.apk",
    "downloadScanImg": "https://oss.example.com/apps/packages/app-v2.0.2-qrcode.png",
    "creator": "admin",
    "updater": "admin",
    "createTime": "2024-01-10 10:00:00",
    "updateTime": "2024-01-10 10:00:00"
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="versions-qrcode">
        <api-card method="GET" path="/api/mobile/apps/:appId/versions/qrcode" pill="get" title="获取下载二维码">
          <template #desc>
            <p>生成应用指定平台的下载二维码，返回 base64 格式的图片数据。所有用户可查看。</p>
            <p><strong>功能特性：</strong></p>
            <ul>
              <li>自动生成二维码，二维码内容指向固定下载地址：<code>{baseUrl}/api/mobile/client/apps/{appId}/download?versionType={versionType}</code></li>
              <li>如果应用配置了图标（<code>APP_ICON</code>），会自动将图标嵌入二维码中心，图标背景为白色</li>
              <li>如果应用未配置图标或图标获取失败，会生成无图标的二维码</li>
              <li>二维码使用高纠错级别（H），即使中心被图标遮挡也能正常扫描</li>
            </ul>
            <p><strong>baseUrl 说明：</strong>优先使用配置的环境变量 <code>BASE_URL</code>，如果没有配置则使用请求的 origin。生产环境建议配置 <code>BASE_URL</code> 环境变量，确保二维码中的地址是公网可访问的部署地址。</p>
            <p><strong>权限说明：</strong>所有用户可查看。</p>
          </template>
          <template #curl>
<pre><code># 获取 Android 平台（versionType=1）的下载二维码
curl -X GET "{{full('/api/mobile/apps/1/versions/qrcode')}}?versionType=1" \
  -H "Authorization: {{tokenHeader}}"

# 获取 iOS 平台（versionType=2）的下载二维码
curl -X GET "{{full('/api/mobile/apps/1/versions/qrcode')}}?versionType=2" \
  -H "Authorization: {{tokenHeader}}"</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "success",
  "data": {
    "qrcode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAAAAAA...",
    "downloadUrl": "https://example.com/api/mobile/client/apps/1/download?versionType=1"
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="versions-create">
        <api-card method="POST" path="/api/mobile/apps/:appId/versions" pill="post" title="创建版本">
          <template #desc>
            <p>
              <strong>权限说明：</strong>需要 USER_LEVEL.DEVELOPER（2-开发人员）或更高级别 USER_LEVEL.SUPER_ADMIN（1-超级管理员）。USER_LEVEL.SUPER_ADMIN（1-超级管理员）可以为任意应用创建版本；其他用户需要拥有该应用的授权记录，可以通过 <a href="#api-access"><code>/api/mobile/apps/:appId/access</code></a> 或者 <a href="#api-permission"><code>/api/mobile/apps/:appId/permission</code></a> 接口判断开发人员是否拥有该应用版本创建权限。
            </p>
            <p>
              <strong>versionType 说明：</strong><code>versionType</code> 仅支持传单个平台整数，并必须属于应用已支持的平台集合（即 <code>(appType & versionType) != 0</code>）。平台枚举：1-Android、2-iOS、4-鸿蒙、8-微信H5、16-钉钉H5、32-独立网页H5、64-微信小程序、128-钉钉小程序。
            </p>
            <p>
              <strong>必填字段与唯一约束：</strong>接口请求体中 <code>versionType</code>、<code>version</code>、<code>versionCode</code> 为必填字段；同一应用（<code>APP_ID</code>）与平台（<code>VERSION_TYPE</code>）下，<code>(version, versionCode)</code> 组合必须唯一，否则后端会返回 <code>400</code>，提示"同一平台下该版本号已存在"。前端无需自行校验唯一性，直接根据接口返回的错误信息进行提示即可。
            </p>
            <p>
              <strong>downloadUrl 字段说明：</strong>根据平台类型（<code>versionType</code>），<code>downloadUrl</code> 字段的含义不同：
            </p>
            <ul>
              <li><strong>Android (versionType=1)：</strong>存储 OSS 的完整 URL（如：<code>https://bucket.oss-cn-hangzhou.aliyuncs.com/apps/packages/app.apk</code>）。固定下载接口会从 OSS 代理下载 APK 文件。</li>
              <li><strong>非 Android 平台（如 iOS、鸿蒙、各类 H5 / 小程序 等）：</strong>存储对应平台的完整访问 URL，例如：
                <ul>
                  <li>iOS：App Store URL（如：<code>https://apps.apple.com/us/app/xxx/id123456</code>）</li>
                  <li>鸿蒙：鸿蒙应用市场 URL</li>
                  <li>H5 / 小程序：H5 页面地址或小程序唤起链接</li>
                </ul>
                固定下载接口会 302 重定向到此 URL。
              </li>
            </ul>
          </template>
          <template #curl>
<pre><code>curl -X POST {{full('/api/mobile/apps/1/versions')}} \
  -H "Authorization: {{tokenHeader}}" \
  -H "Content-Type: application/json" \
  -d '{{ createVersionBody }}'</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": 11,
    "appId": 1,
    "versionType": 1,
    "version": "2.0.2",
    "versionCode": 202,
    "comment": "优化启动速度并修复崩溃问题",
    "downloadSize": "53.0MB",
    "downloadUrl": "https://oss.example.com/apps/packages/app-v2.0.3.apk",
    "downloadScanImg": "https://oss.example.com/apps/packages/app-v2.0.3-qrcode.png",
    "creator": "admin",
    "updater": "admin",
    "createTime": "2024-01-12 09:00:00",
    "updateTime": "2024-01-12 09:00:00"
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="versions-update">
        <api-card method="PUT" path="/api/mobile/versions/:id" pill="post" title="更新版本">
          <template #desc>
            <p>
              <strong>权限说明：</strong>需要 USER_LEVEL.DEVELOPER（2-开发人员）或更高级别 USER_LEVEL.SUPER_ADMIN（1-超级管理员）。USER_LEVEL.SUPER_ADMIN（1-超级管理员）可以更新任意应用的版本；其他用户需要拥有该应用的授权记录，可以通过 <a href="#api-access"><code>/api/mobile/apps/:appId/access</code></a> 或者 <a href="#api-permission"><code>/api/mobile/apps/:appId/permission</code></a> 接口判断开发人员是否拥有该应用版本更新权限。
            </p>
            <p>
              <strong>更新说明：</strong>支持部分字段更新。可更新字段包括：<code>version</code>、<code>versionCode</code>、<code>comment</code>、<code>downloadSize</code>、<code>downloadUrl</code>、<code>downloadScanImg</code>、<code>versionType</code>。若传入 <code>versionType</code>，必须是单个平台整数，并且属于应用已支持的平台集合（即 <code>(appType & versionType) != 0</code>）。若传入 <code>versionCode</code>，也会受到组合键唯一约束，冲突时同样返回"同一平台下该版本号已存在"，前端无需额外校验。
            </p>
            <p>
              <strong>downloadUrl 字段说明：</strong>根据平台类型（<code>versionType</code>），<code>downloadUrl</code> 字段的含义不同：
            </p>
            <ul>
              <li><strong>Android (versionType=1)：</strong>存储 OSS 的完整 URL（如：<code>https://bucket.oss-cn-hangzhou.aliyuncs.com/apps/packages/app.apk</code>）。固定下载接口会从 OSS 代理下载 APK 文件。</li>
              <li><strong>iOS (versionType=2)：</strong>存储 App Store 的完整 URL（如：<code>https://apps.apple.com/us/app/xxx/id123456</code>）。固定下载接口会 302 重定向到此 URL。</li>
              <li><strong>鸿蒙 (versionType=4)：</strong>存储鸿蒙应用市场的完整 URL。固定下载接口会 302 重定向到此 URL。</li>
            </ul>
          </template>
          <template #curl>
<pre><code>curl -X PUT {{full('/api/mobile/versions/1')}} \
  -H "Authorization: {{tokenHeader}}" \
  -H "Content-Type: application/json" \
  -d '{{ updateVersionBody }}'</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 10,
    "appId": 1,
    "versionType": 1,
    "version": "2.0.3-hotfix",
    "versionCode": 203,
    "comment": "修复线上紧急问题",
    "downloadSize": "53.1MB",
    "downloadUrl": "https://oss.example.com/apps/packages/app-v2.0.2-hotfix.apk",
    "downloadScanImg": "https://oss.example.com/apps/packages/app-v2.0.2-hotfix-qrcode.png",
    "creator": "admin",
    "updater": "dev001",
    "createTime": "2024-01-10 10:00:00",
    "updateTime": "2024-01-15 09:30:00"
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="versions-delete">
        <api-card method="DELETE" path="/api/mobile/versions/:appId" pill="del" title="删除/批量删除版本">
          <template #desc>
            <p>
              <strong>权限说明：</strong>需要 USER_LEVEL.DEVELOPER（2-开发人员）或更高级别 USER_LEVEL.SUPER_ADMIN（1-超级管理员）。USER_LEVEL.SUPER_ADMIN（1-超级管理员）可以删除任意应用的版本；其他用户需要拥有该应用的授权记录，可以通过 <a href="#api-access"><code>/api/mobile/apps/:appId/access</code></a> 或者 <a href="#api-permission"><code>/api/mobile/apps/:appId/permission</code></a> 接口判断开发人员是否拥有该应用版本删除权限。
            </p>
            <p>
              <strong>删除方式：</strong>通过请求体中的 <code>versionIds</code> 数组传入需要删除的版本ID，支持批量或单个删除（单个时也建议传数组）。
            </p>
          </template>
          <template #curl>
<pre><code>curl -X DELETE {{full('/api/mobile/versions/1')}} \
  -H "Authorization: {{tokenHeader}}" \
  -H "Content-Type: application/json" \
  -d '{
    "versionIds": [1, 2, 3]
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

