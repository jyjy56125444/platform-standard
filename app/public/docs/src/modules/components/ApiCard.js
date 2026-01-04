const { defineComponent } = window.Vue || Vue;

export default defineComponent({
  name: 'ApiCard',
  props: {
    method: { type: String, required: true },
    path: { type: String, required: true },
    pill: { type: String, default: 'get' },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  template: `
  <div class="card">
    <div class="pill" :class="pill">{{ method }} {{ path }}</div>
    <h3 v-if="title" style="margin:10px 0 6px 0;font-size:16px;">{{ title }}</h3>
    <div class="tip" v-if="description && !($slots.desc)">{{ description }}</div>
    <div class="tip" v-else><slot name="desc"></slot></div>
    <slot name="body"></slot>
    <template v-if="$slots.code">
      <div class="tip" style="margin-top:8px;">前端加密代码示例</div>
      <slot name="code"></slot>
    </template>
    <div class="tip" style="margin-top:8px;">cURL</div>
    <slot name="curl"></slot>
    <template v-if="$slots.response">
      <div class="tip" style="margin-top:8px;">返回示例</div>
      <slot name="response"></slot>
    </template>
  </div>
  `
});

