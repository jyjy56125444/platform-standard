# 接口文档（public/docs 子项目）编写规范

本目录包含前端静态文档，展示平台接口说明。文档采用 Vue 3 原生 ESM（无打包）方式组织，打开根路径 `/` 即会跳转到 `/public/docs/index.html`。

## 目录结构

```
app/public/
└── docs/
    ├── index.html          # 文档入口（加载 Vue 与 main.js）
    ├── style.css           # 全局样式（含布局/侧栏/卡片）
    └── src/
        ├── main.js         # 创建应用，挂载 App
        └── modules/
            ├── App.js      # 根组件（左侧大纲 + 右侧各模块拼装）
            ├── components/
            │   └── ApiCard.js        # 通用接口卡片组件
            └── sections/
                └── UsersModule.js     # 模块页面：用户管理
```

## 组件与模块

- 通用卡片 `ApiCard`
  - Props：
    - `method`：HTTP 方法（GET/POST/DELETE 等）
    - `path`：接口路径
    - `pill`：徽章样式（get/post/del）
    - `title`：卡片标题
    - `description`：简要说明（也可用 `#desc` 插槽覆盖）
  - 插槽：
    - `#desc`：描述
    - `#body`：请求体或参数示例
    - `#curl`：curl 示例

- 模块页面（建议放在 `src/modules/sections/` 下）
  - 例如 `UsersModule.js`，导出 `defineComponent`，内部用多个 `ApiCard` 表示接口，形成单列竖向列表。
  - 每个接口段落使用 `<section id="xxx">` 提供锚点，供左侧大纲跳转。

## 如何新增一个模块

1) 在 `src/modules/sections/` 新建 `XXXModule.js`，结构参考 `UsersModule.js`

2) 在 `modules/App.js` 中：

- 顶部导入：
```js
import XXXModule from './sections/XXXModule.js';
```
- 在 `components` 注册：
```js
components: { ApiCard, UsersModule, XXXModule },
```
- 左侧大纲新增一组导航（可折叠）：
```html
<h2>
  <a href="#xxx-module-first-anchor" class="section-link">模块名称</a>
  <button class="collapse-btn" @click="xxxOpen = !xxxOpen">{{ xxxOpen ? '▾' : '▸' }}</button>
  </h2>
<ul class="nav" v-show="xxxOpen">
  <li><a href="#xxx-module-first-anchor">第一个接口</a></li>
  <!-- 其他锚点 -->
</ul>
```
- 右侧主区域拼接模块组件：
```html
<xxx-module :full="full" :tokenHeader="tokenHeader" />
```
- 在 `setup()` 中新增对应的折叠状态（如 `const xxxOpen = ref(true)`）及需要向模块传递的 props（如 body 示例等）。

## 样式与布局

- 全局样式位于 `docs/style.css`，统一维护：
  - 左侧侧栏（可折叠）+ 右侧单列接口卡片
  - 颜色、卡片外观、代码区 `pre` 样式等
- 如需新增样式，优先在 `style.css` 中扩展，不建议散落在组件内联样式中。

## 约定

- 接口字段与示例统一使用驼峰；后端返回也已做驼峰转换。
- 每个接口卡片都应包含：
  - 标题/说明
  - 请求体/参数示例（如有）
  - curl 示例
- 模块命名：文件名采用帕斯卡命名（如 `UsersModule.js`），模板标签自动为 `users-module`。
- 不引入打包流程，采用 CDN 版 Vue3 与浏览器原生 ESM 模块。
- 请勿在文档中包含任何密钥/敏感信息。

## 运行

- 启动服务后访问根路径 `/` 即会打开文档页；或直接访问 `/public/docs/index.html`。

## 维护建议

- 接口增加时，优先在对应模块追加一个 `ApiCard`；
- 跨模块时，新建模块文件并在 `App.js` 中注册与拼接；
- 左侧大纲与右侧锚点保持一致（锚点 ID 与大纲链接匹配）。

