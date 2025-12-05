import ApiCard from '../components/ApiCard.js';

const { defineComponent } = Vue;

export default defineComponent({
  name: 'MobileAppsModule',
  components: { ApiCard },
  props: {
    full: { type: Function, required: true },
    tokenHeader: { type: [String, Object], required: true },
    createAppBody: { type: String, required: true },
    updateAppBody: { type: String, required: true },
  },
  template: `
    <div class="stack">
      <section id="apps-list">
        <api-card method="GET" path="/api/mobile/apps" pill="get" title="应用列表" description="分页参数：page、pageSize。权限说明：所有用户（USER_LEVEL: 1-超级管理员、2-开发人员、3-访客）均可查看。">
          <template #curl>
<pre><code>curl -X GET "{{full('/api/mobile/apps')}}?page=1&pageSize=10" \
  -H "Authorization: {{tokenHeader}}"</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "appId": 1,
        "appName": "考勤助手",
        "appFullname": "公司考勤助手应用",
        "appType": [1, 2],
        "appIcon": "https://example.com/icons/attendance.png",
        "creator": "admin",
        "updater": "admin",
        "createTime": "2024-01-01 10:00:00",
        "updateTime": "2024-01-02 09:30:00"
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="apps-detail">
        <api-card method="GET" path="/api/mobile/apps/:id" pill="get" title="应用详情" description="根据 ID 获取应用详情。权限说明：所有用户（USER_LEVEL: 1-超级管理员、2-开发人员、3-访客）均可查看。">
          <template #curl>
<pre><code>curl -X GET {{full('/api/mobile/apps/1')}} \
  -H "Authorization: {{tokenHeader}}"</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "success",
  "data": {
    "appId": 1,
    "appName": "考勤助手",
    "appFullname": "公司考勤助手应用",
    "appType": [1, 2],
    "appIcon": "https://example.com/icons/attendance.png",
    "developer": "张三",
    "interfaceDeveloper": "李四",
    "designer": "王五",
    "remark": "用于员工日常考勤打卡",
    "creator": "admin",
    "updater": "admin",
    "createTime": "2024-01-01 10:00:00",
    "updateTime": "2024-01-02 09:30:00"
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="apps-create">
        <api-card method="POST" path="/api/mobile/apps" pill="post" title="创建应用">
          <template #desc>
            <p>
              <strong>权限说明：</strong>需要 USER_LEVEL.DEVELOPER（2-开发人员）或更高级别 USER_LEVEL.SUPER_ADMIN（1-超级管理员）。创建成功后，创建者会自动被添加到应用权限表（mobile_app_user），并获得 APP_USER_PERMISSION.APP_CREATOR（1-应用创建者）权限。
            </p>
            <p>
              <strong>必填字段：</strong><code>appName</code><br />
              <strong>appType 说明：</strong>支持传单个平台整数或数组（前端建议传数组）。平台枚举：1-Android、2-iOS、4-鸿蒙、8-微信H5、16-钉钉H5、32-独立网页H5、64-微信小程序、128-钉钉小程序。
            </p>
          </template>
          <template #curl>
<pre><code>curl -X POST {{full('/api/mobile/apps')}} \
  -H "Authorization: {{tokenHeader}}" \
  -H "Content-Type: application/json" \
  -d '{{ createAppBody }}'</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "创建成功",
  "data": {
    "appId": 2,
    "appName": "审批中心",
    "appFullname": "移动审批中心",
    "appType": [1, 8],
    "appIcon": "https://example.com/icons/approve.png",
    "developer": "张三",
    "interfaceDeveloper": "李四",
    "designer": "王五",
    "remark": "用于日常审批流转",
    "creator": "admin",
    "updater": "admin",
    "createTime": "2024-01-03 11:00:00",
    "updateTime": "2024-01-03 11:00:00"
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="apps-update">
        <api-card method="PUT" path="/api/mobile/apps/:id" pill="post" title="更新应用">
          <template #desc>
            <p>
              <strong>权限说明：</strong>需要 USER_LEVEL.DEVELOPER（2-开发人员）或更高级别 USER_LEVEL.SUPER_ADMIN（1-超级管理员）。USER_LEVEL.SUPER_ADMIN（1-超级管理员）可以更新所有应用；其他用户需要拥有该应用的授权记录，可以通过 <a href="#api-access"><code>/api/mobile/apps/:appId/access</code></a> 或者 <a href="#api-permission"><code>/api/mobile/apps/:appId/permission</code></a> 接口判断开发人员是否拥有该应用修改权限。
            </p>
            <p>
              <strong>可更新字段：</strong>主表（appName/appFullname/appType/appIcon）；扩展表（developer/interfaceDeveloper/designer/remark）
            </p>
          </template>
          <template #curl>
<pre><code>curl -X PUT {{full('/api/mobile/apps/1')}} \
  -H "Authorization: {{tokenHeader}}" \
  -H "Content-Type: application/json" \
  -d '{{ updateAppBody }}'</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "更新成功",
  "data": {
    "appId": 1,
    "appName": "考勤助手-改",
    "appFullname": "公司考勤助手应用（新版）",
    "appType": [4],
    "appIcon": "https://example.com/icons/attendance-new.png",
    "developer": "张三",
    "interfaceDeveloper": "李四",
    "designer": "王五",
    "remark": "更新图标与说明文案",
    "creator": "admin",
    "updater": "admin",
    "createTime": "2024-01-01 10:00:00",
    "updateTime": "2024-01-05 09:30:00"
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="apps-delete">
        <api-card method="DELETE" path="/api/mobile/apps/:id" pill="del" title="删除应用">
          <template #desc>
            <p>
              <strong>权限说明：</strong>需要 USER_LEVEL.DEVELOPER（2-开发人员）或更高级别 USER_LEVEL.SUPER_ADMIN（1-超级管理员）。USER_LEVEL.SUPER_ADMIN（1-超级管理员）可以删除所有应用；USER_LEVEL.DEVELOPER（2-开发人员）需要为 APP_USER_PERMISSION.APP_CREATOR（1-应用创建者），可以通过 <a href="#api-permission"><code>/api/mobile/apps/:appId/permission</code></a> 接口判断开发人员是否拥有该应用删除权限。
            </p>
            <p>
              <strong>注意：</strong>此接口仅支持单应用删除，不支持批量操作。
            </p>
          </template>
          <template #curl>
<pre><code>curl -X DELETE {{full('/api/mobile/apps/1')}} \
  -H "Authorization: {{tokenHeader}}"</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "删除成功"
}</code></pre>
          </template>
        </api-card>
      </section>
    </div>
  `
});


