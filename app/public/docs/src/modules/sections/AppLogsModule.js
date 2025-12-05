import ApiCard from '../components/ApiCard.js';

const { defineComponent } = Vue;

export default defineComponent({
  name: 'AppLogsModule',
  components: { ApiCard },
  props: {
    full: { type: Function, required: true },
    tokenHeader: { type: [String, Object], required: true },
  },
  template: `
    <div class="stack">
      <section id="app-logs-list">
        <api-card
          method="GET"
          path="/api/mobile/apps/:appId/logs"
          pill="get"
          title="获取应用操作日志">
          <template #desc>
            <p>
              <strong>权限说明：</strong>需要 USER_LEVEL.DEVELOPER（2-开发人员）或更高级别 USER_LEVEL.SUPER_ADMIN（1-超级管理员）。USER_LEVEL.SUPER_ADMIN（1-超级管理员）可以查询所有应用日志；其他用户需要拥有该应用的授权记录才可以进行查询操作，可以通过
              <a href="#api-access"><code>/api/mobile/apps/:appId/access</code></a>
              或者
              <a href="#api-permission"><code>/api/mobile/apps/:appId/permission</code></a>
              接口判断开发人员是否拥有该应用日志的查询权限。默认返回该应用所有操作日志，也可通过 <code>versionId</code>、<code>page</code>、<code>pageSize</code> 做筛选/分页。
            </p>
          </template>
          <template #curl>
<pre><code># 查询指定版本日志
curl -X GET "{{full('/api/mobile/apps/1/logs')}}?versionId=10&page=1&pageSize=20" \
  -H "Authorization: {{tokenHeader}}"

# 不传 versionId 则返回该应用的全部日志
curl -X GET "{{full('/api/mobile/apps/1/logs')}}?page=1&pageSize=20" \
  -H "Authorization: {{tokenHeader}}"</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 100,
        "appId": 1,
        "versionId": 10,
        "action": "publish",
        "actionDetail": "发布版本 2.0.2 到生产环境",
        "resultStatus": "success",
        "operatorId": 88888,
        "operatorName": "mobileUser01",
        "clientIp": "10.0.0.1",
        "extraData": "{\"env\":\"prod\"}",
        "createTime": "2024-01-12 09:30:00"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="app-logs-delete">
        <api-card
          method="DELETE"
          path="/api/mobile/apps/:appId/logs"
          pill="del"
          title="删除/批量删除操作日志">
          <template #desc>
            <p>
              <strong>权限说明：</strong>需要 USER_LEVEL.DEVELOPER（2-开发人员）或更高级别 USER_LEVEL.SUPER_ADMIN（1-超级管理员）。USER_LEVEL.SUPER_ADMIN（1-超级管理员）可以删除所有应用日志；其他用户需要拥有该应用的授权记录才可以进行删除操作，可以通过
              <a href="#api-access"><code>/api/mobile/apps/:appId/access</code></a>
              或者
              <a href="#api-permission"><code>/api/mobile/apps/:appId/permission</code></a>
              接口判断开发人员是否拥有该应用日志的删除权限。统一通过请求体传入 <code>logIds</code> 数组，长度为 1 时等同单个删除。
            </p>
          </template>
          <template #curl>
<pre><code># 删除多个日志
curl -X DELETE "{{full('/api/mobile/apps/1/logs')}}" \
  -H "Authorization: {{tokenHeader}}" \
  -H "Content-Type: application/json" \
  -d '{
    "logIds": [100, 101, 102]
  }'

# 删除单个日志（数组只放一个 ID）
curl -X DELETE "{{full('/api/mobile/apps/1/logs')}}" \
  -H "Authorization: {{tokenHeader}}" \
  -H "Content-Type: application/json" \
  -d '{
    "logIds": [100]
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


