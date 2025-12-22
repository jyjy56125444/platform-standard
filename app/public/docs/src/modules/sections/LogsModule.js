import ApiCard from '../components/ApiCard.js';

const { defineComponent } = window.Vue || Vue;

export default defineComponent({
  name: 'LogsModule',
  components: { ApiCard },
  props: {
    full: { type: Function, required: true },
    tokenHeader: { type: [String, Object], required: true },
  },
  setup(props){
    const exampleBody = JSON.stringify({ operate: '自定义操作描述' }, null, 2);
    return { exampleBody };
  },
  template: `
    <div class="stack">
      <section id="logs-list">
        <api-card method="GET" path="/api/user/logs" pill="get" title="查询日志" description="权限说明：USER_LEVEL.SUPER_ADMIN（1-超级管理员）可查看全量日志或通过 userGuid 参数指定查看某用户日志；2、3级用户仅能查看自己的日志，userGuid 参数可不传（即使传入也会被忽略，始终返回自己的日志）。支持分页查询。">
          <template #curl>
<pre><code># 普通用户或管理员查看自己的日志
curl -X GET "{{full('/api/user/logs')}}?page=1&pageSize=10" \
  -H "Authorization: {{tokenHeader}}"

# 管理员查看指定用户的日志（仅1级可用）
curl -X GET "{{full('/api/user/logs')}}?page=1&pageSize=10&userGuid=2" \
  -H "Authorization: {{tokenHeader}}"</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "userGuid": 1,
        "userName": "admin",
        "operate": "登录系统",
        "createTime": "2024-01-01 10:00:00"
      },
      {
        "id": 2,
        "userGuid": 1,
        "userName": "admin",
        "operate": "创建应用：考勤助手",
        "createTime": "2024-01-01 10:05:00"
      }
    ],
    "total": 2,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="logs-create">
        <api-card method="POST" path="/api/user/logs" pill="post" title="插入日志（管理员）" description="仅 USER_LEVEL.SUPER_ADMIN（1-超级管理员）可手动插入一条用户操作日志，系统通常会自动记录关键操作日志，除排查问题等特殊场景外不建议手动调用。">
          <template #curl> 
<pre><code>curl -X POST {{full('/api/user/logs')}} \
  -H "Authorization: {{tokenHeader}}" \
  -H "Content-Type: application/json" \
  -d '{{ exampleBody }}'</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "插入成功"
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="logs-delete">
        <api-card method="DELETE" path="/api/user/logs" pill="del" title="删除/批量删除日志（管理员）" description="仅 USER_LEVEL.SUPER_ADMIN（1-超级管理员）可用。Body 中通过 logIds 数组传需删除的日志ID，支持批量或单个。">
          <template #curl>
<pre><code>curl -X DELETE {{full('/api/user/logs')}} \
  -H "Authorization: {{tokenHeader}}" \
  -H "Content-Type: application/json" \
  -d '{
    "logIds": [1, 2, 3]
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


