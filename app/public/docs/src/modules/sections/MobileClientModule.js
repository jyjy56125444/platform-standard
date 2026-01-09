import ApiCard from '../components/ApiCard.js';

const { defineComponent } = window.Vue || Vue;

export default defineComponent({
  name: 'MobileClientModule',
  components: { ApiCard },
  props: {
    full: { type: Function, required: true },
    tokenHeader: { type: [String, Object], required: true },
  },
  template: `
    <div class="stack">
      <section id="client-ticket">
        <api-card
          method="POST"
          path="/api/mobile/client/rag/tickets"
          pill="post"
          title="获取应用访问票据">
          <template #desc>
            <p>移动端专用接口，用于获取访问票据（ticket）。获取的 ticket 用于后续访问其他需要验证的接口。</p>
            <p><strong>握手协议：</strong></p>
            <p>1. 移动端使用 HMAC-SHA256(appId + appUserId, signKey) 生成签名</p>
            <p>2. signKey = appId + appUserId + 全局盐值（xxx...）</p>
            <p>3. 签名内容 = appId + appUserId</p>
            <p>4. 后端使用相同的 appId + appUserId + 盐值生成签名，使用 crypto.timingSafeEqual 比较</p>
            <p>5. 签名验证通过后，返回 ticket（有效期 2 小时，可通过环境变量 RAG_TICKET_EXPIRE_TIME 配置）</p>
            <p><strong>用户区分：</strong>每个 app 的每个用户（appUserId）都有独立的 ticket。appUserId 可以是 UUID（字符串）或 int（数字）形式。同一用户在同一 app 下，2 小时内返回同一个 ticket（未过期）。</p>
          </template>
          <template #curl>
<pre><code># appUserId 为 UUID 形式
curl -X POST "{{full('/api/mobile/client/rag/tickets')}}" \
  -H "Content-Type: application/json" \
  -d '{
    "appId": 16,
    "appUserId": "550e8400-e29b-41d4-a716-446655440000",
    "signature": "f73d8d806a5820bf37d10b66bbbcc11..."
  }'

# appUserId 为 int 形式
curl -X POST "{{full('/api/mobile/client/rag/tickets')}}" \
  -H "Content-Type: application/json" \
  -d '{
    "appId": 16,
    "appUserId": 12345,
    "signature": "f73d8d806a5820bf37d10b66bbbcc11..."
  }'</code></pre>
          </template>
          <template #code>
<pre><code>// 前端加密示例（JavaScript/TypeScript）

// 方法一：使用 Web Crypto API（推荐，浏览器原生支持）
async function generateSignature(appId, appUserId, secret) {
  // 1. 生成签名密钥：signKey = appId + appUserId + 盐值
  const signKey = appId + '_' + appUserId + '_' + secret;
  
  // 2. 签名内容：appId + appUserId
  const signContent = appId + '_' + appUserId;
  
  // 3. 使用 HMAC-SHA256 生成签名
  const encoder = new TextEncoder();
  const keyData = encoder.encode(signKey);
  const contentData = encoder.encode(signContent);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, contentData);
  const signatureHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return signatureHex;
}

// ============================================

// 方法二：使用 crypto-js 库（需要安装：npm install crypto-js）
// import CryptoJS from 'crypto-js';

function generateSignatureWithCryptoJS(appId, appUserId, secret) {
  // 1. 生成签名密钥：signKey = appId + appUserId + 盐值
  const signKey = appId + '_' + appUserId + '_' + secret;
  
  // 2. 签名内容：appId + appUserId
  const signContent = appId + '_' + appUserId;
  
  // 3. 使用 HMAC-SHA256 生成签名
  const signature = CryptoJS.HmacSHA256(signContent, signKey).toString(CryptoJS.enc.Hex);
  
  return signature;
}</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "success",
  "data": {
    "ticket": "app_ticket_xxxx...",
    "expireTime": "2024-01-12 11:30:00",
    "expiresIn": 7200
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="client-logs">
        <api-card
          method="POST"
          path="/api/mobile/client/logs"
          pill="post"
          title="客户端记录操作日志">
          <template #desc>
            <p>移动端专用接口，Body 必须包含 appId、action、operatorId、operatorName 等字段；后台会记录操作者快照与 IP。</p>
            <p><strong>认证方式：</strong>需要在 Header 中传入 <code>X-App-Ticket</code> 或在 Query 参数中传入 <code>ticket</code>。ticket 通过"获取应用访问票据"接口获取。</p>
          </template>
          <template #curl>
<pre><code>curl -X POST "{{full('/api/mobile/client/logs')}}" \
  -H "Content-Type: application/json" \
  -H "X-App-Ticket: app_ticket_xxxx..." \
  -d '{
    "appId": 1,
    "versionId": 10,
    "action": "clock_in",
    "actionDetail": "用户触发签到功能",
    "resultStatus": "success",
    "operatorId": 88888,
    "operatorName": "mobileUser01"
  }'</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "记录成功",
  "data": {
    "id": 100,
    "appId": 1,
    "versionId": 10,
    "action": "clock_in",
    "actionDetail": "用户触发签到功能",
    "resultStatus": "success",
    "operatorId": 88888,
    "operatorName": "mobileUser01",
    "clientIp": "10.0.0.1",
    "extraData": null,
    "createTime": "2024-01-12 09:30:00"
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="client-latest-version">
        <api-card
          method="GET"
          path="/api/mobile/client/apps/:appId/latest-version"
          pill="get"
          title="客户端获取最新版本信息">
          <template #desc>
            <p>移动端专用接口，根据 appId 与 versionType 获取指定平台下 versionCode 最大的最新版本信息。</p>
            <p><strong>认证方式：</strong>需要在 Header 中传入 <code>X-App-Ticket</code> 或在 Query 参数中传入 <code>ticket</code>。ticket 通过"获取应用访问票据"接口获取。</p>
          </template>
          <template #curl>
<pre><code>curl -X GET "{{full('/api/mobile/client/apps/1/latest-version')}}?versionType=1&ticket=app_ticket_xxxx..."</code></pre>
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
    "createTime": "2024-01-10 10:00:00",
    "updateTime": "2024-01-10 10:00:00",
    "creator": "admin",
    "updater": "admin"
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="client-download">
        <api-card
          method="GET"
          path="/api/mobile/client/apps/:appId/download"
          pill="get"
          title="固定下载地址（专供二维码使用）">
          <template #desc>
            <p>专供二维码使用的固定下载地址接口，无需 ticket 验证。该接口会根据 appId 和 versionType 查询最新版本，并根据平台类型采用不同的下载方式。</p>
            <p><strong>使用场景：</strong>生成二维码时使用此固定地址，即使版本更新，二维码地址也无需改变，始终指向最新版本的下载地址。</p>
            <p><strong>平台行为说明：</strong></p>
            <ul>
              <li><strong>Android (versionType=1)：</strong>从 OSS 代理下载 APK 文件。由于 OSS 对 APK 文件有安全限制（不允许通过 OSS endpoint 直接下载），此接口采用代理下载方式，后端从 OSS 读取文件流并返回给客户端。浏览器会直接开始下载文件。</li>
              <li><strong>非 Android 平台（如 iOS、鸿蒙、各类 H5 / 小程序 等）：</strong>统一 302 重定向到 <code>DOWNLOAD_URL</code> 指向的地址。例如：
                <ul>
                  <li>iOS：App Store 链接（如：<code>https://apps.apple.com/us/app/xxx/id123456</code>）</li>
                  <li>鸿蒙：鸿蒙应用市场链接</li>
                  <li>H5 / 小程序：H5 页面地址或小程序唤起链接</li>
                </ul>
              </li>
            </ul>
            <p><strong>注意：</strong>不同平台使用同一个接口路径，通过 <code>versionType</code> 参数区分。建议为每个平台生成独立的二维码。</p>
          </template>
          <template #curl>
<pre><code># Android 平台：直接访问（浏览器会自动下载文件）
curl -L -X GET "http://localhost:7001/api/mobile/client/apps/1/download?versionType=1"

# iOS 平台：查看重定向（会跳转到 App Store）
curl -I -X GET "http://localhost:7001/api/mobile/client/apps/1/download?versionType=2"

# 鸿蒙平台：查看重定向（会跳转到鸿蒙应用市场）
curl -I -X GET "http://localhost:7001/api/mobile/client/apps/1/download?versionType=4"

# H5/小程序平台：重定向访问（会跳转到页面地址或小程序唤起链接）
curl -I -X GET "http://localhost:7001/api/mobile/client/apps/1/download?versionType=8"</code></pre>
          </template>
          <template #response>
<pre><code># Android 平台成功响应：直接返回文件流
HTTP/1.1 200 OK
Content-Type: application/vnd.android.package-archive
Content-Disposition: attachment; filename="app-v2.0.2.apk"
Content-Length: 55234567

[文件二进制数据...]

# 非 Android 平台成功响应：302 重定向（iOS / 鸿蒙 / H5 / 小程序等）
HTTP/1.1 302 Found
Location: https://apps.apple.com/us/app/xxx/id123456
Content-Length: 0

# 如果未找到版本信息，返回 JSON
{
  "code": 404,
  "message": "未找到对应平台的版本信息"
}

# 如果版本未配置下载地址，返回 JSON
{
  "code": 404,
  "message": "该版本未配置下载地址"
}

# Android 平台：如果无法解析下载地址，返回 JSON
{
  "code": 500,
  "message": "无法解析下载地址，请确保 DOWNLOAD_URL 是有效的 OSS 地址"
}

# iOS/鸿蒙平台：如果下载地址格式无效，返回 JSON
{
  "code": 400,
  "message": "下载地址格式无效，请确保是完整的 URL"
}

# （当前实现中，所有有效的平台类型都会根据 DOWNLOAD_URL 正常处理；仅当 versionType 非数字或版本记录不存在时才会返回 4xx/5xx 错误）</code></pre>
          </template>
        </api-card>
      </section>

      <section id="client-rag-common-questions">
        <api-card
          method="GET"
          path="/api/mobile/client/rag/common-questions/:appId"
          pill="get"
          title="获取常见问题列表">
          <template #desc>
            <p>移动端专用接口，用于获取指定应用的常见问题列表。前端可以使用这些常见问题作为快捷选项，方便用户快速提问。</p>
            <p><strong>认证方式：</strong>需要在 Header 中传入 <code>X-App-Ticket</code> 或在 Query 参数中传入 <code>ticket</code>。ticket 通过"获取应用访问票据"接口获取。</p>
            <p><strong>说明：</strong>如果应用未配置自定义常见问题，则返回空数组。</p>
          </template>
          <template #curl>
<pre><code># 使用 Header 传递 ticket
curl -X GET "{{full('/api/mobile/client/rag/common-questions/16')}}" \
  -H "X-App-Ticket: app_ticket_xxxx..."

# 使用 Query 参数传递 ticket
curl -X GET "{{full('/api/mobile/client/rag/common-questions/16')}}?ticket=app_ticket_xxxx..."</code></pre>
          </template>
          <template #response>
<pre><code># 有配置常见问题
{
  "code": 200,
  "message": "success",
  "data": {
    "commonQuestions": [
      {
        "question": "简要介绍一下这个app",
        "order": 1
      },
      {
        "question": "如何使用这个功能？",
        "order": 2
      },
      {
        "question": "常见问题解答",
        "order": 3
      }
    ]
  }
}

# 未配置常见问题（返回空数组）
{
  "code": 200,
  "message": "success",
  "data": {
    "commonQuestions": []
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="client-rag-ask">
        <api-card
          method="POST"
          path="/api/mobile/client/rag/ask/:appId"
          pill="post"
          title="移动端 RAG 问答">
          <template #desc>
            <p>移动端专用接口，用于进行 RAG 知识库问答。支持流式和非流式两种模式。</p>
            <p><strong>认证方式：</strong>需要在 Header 中传入 <code>X-App-Ticket</code> 或在 Query 参数中传入 <code>ticket</code>。ticket 通过"获取应用访问票据"接口获取。</p>
            <p><strong>注意：</strong>移动端暂不支持会话管理，每次问答都是独立的，不传 sessionId。</p>
          </template>
          <template #curl>
<pre><code># 非流式
curl -X POST "{{full('/api/mobile/client/rag/ask/16')}}" \
  -H "Content-Type: application/json" \
  -H "X-App-Ticket: app_ticket_xxxx..." \
  -d '{
    "question": "你好",
    "stream": false
  }'

# 流式
curl -X POST "{{full('/api/mobile/client/rag/ask/16')}}" \
  -H "Content-Type: application/json" \
  -H "X-App-Ticket: app_ticket_xxxx..." \
  -d '{
    "question": "你好",
    "stream": true
  }'</code></pre>
          </template>
          <template #response>
<pre><code># 非流式返回
{
  "code": 200,
  "message": "success",
  "data": {
    "answer": "您好！有什么可以帮助您的吗？",
    "sources": [
      {
        "content": "这是相关的知识库内容...",
        "metadata": {}
      }
    ],
    "responseTime": 1.5,
    "usage": {
      "promptTokens": 100,
      "completionTokens": 50,
      "totalTokens": 150
    }
  }
}

# 流式返回（Server-Sent Events）
event: ready
data: {"message":"stream start"}

event: answer
data: {"delta":"您","done":false}

event: answer
data: {"delta":"好","done":false}

event: end
data: {"done":true,"responseTime":1.5,"usage":{"promptTokens":100,"completionTokens":50,"totalTokens":150}}</code></pre>
          </template>
        </api-card>
      </section>
    </div>
  `
});


