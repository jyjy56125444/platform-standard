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
      <section id="client-logs">
        <api-card
          method="POST"
          path="/api/mobile/client/logs"
          pill="post"
          title="客户端记录操作日志"
          description="移动端专用接口，Body 必须包含 appId、action、operatorId、operatorName 等字段；后台会记录操作者快照与 IP。本接口不依赖平台登录态，无需传入 Authorization 头。">
          <template #curl>
<pre><code>curl -X POST "{{full('/api/mobile/client/logs')}}" \
  -H "Content-Type: application/json" \
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
          title="客户端获取最新版本信息"
          description="移动端专用接口，根据 appId 与 versionType 获取指定平台下 versionCode 最大的最新版本信息。本接口不依赖平台登录态，无需传入 Authorization 头。">
          <template #curl>
<pre><code>curl -X GET "{{full('/api/mobile/client/apps/1/latest-version')}}?versionType=1"</code></pre>
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
    </div>
  `
});


