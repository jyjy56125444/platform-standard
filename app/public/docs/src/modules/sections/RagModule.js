import ApiCard from '../components/ApiCard.js';

const { defineComponent } = window.Vue || Vue;

export default defineComponent({
  name: 'RagModule',
  components: { ApiCard },
  props: {
    full: { type: Function, required: true },
    tokenHeader: { type: [String, Object], required: true },
    askBody: { type: String, required: true },
    createSessionBody: { type: String, required: true },
    setRAGConfigBody: { type: String, required: true },
  },
  template: `
    <div class="stack">
      <section id="rag-config-get">
        <api-card
          method="GET"
          path="/api/rag/config/:appId"
          pill="get"
          title="查询应用 RAG 配置"
          description="获取指定应用的完整 RAG 配置信息，包括向量维度、模型配置、检索参数等。">
          <template #curl>
<pre><code>curl -X GET {{full('/api/rag/config/15')}} \
  -H "Authorization: {{tokenHeader}}"</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "success",
  "data": {
    "configId": 1,                    // 配置ID
    "appId": 15,                      // 应用ID
    "milvusCollection": "rag_app_15", // Milvus集合名称（每个应用一个集合）
    "vectorDimension": 1024,          // 向量维度（如：1024）
    "embeddingModel": "text-embedding-v4", // Embedding模型名称
    "llmModel": "qwen-plus",          // LLM模型名称
    "systemPrompt": null,              // 系统提示词（NULL时使用代码默认值）
    "userPromptTemplate": "请根据文档内容回答用户问题。", // 用户提示词模板（用户自定义，不支持变量替换，直接使用）
    "llmTemperature": 0.7,            // LLM 温度参数（0.0-2.0），控制输出随机性，默认0.7
    "llmMaxTokens": 2000,             // LLM 最大 Token 数（1-8000），控制输出长度，默认2000
    "llmTopP": 0.8,                   // LLM Top P 参数（0.0-1.0），控制核采样，默认0.8
    "topK": 5,                        // 检索Top K数量，默认5
    "similarityThreshold": 0.4,      // 相似度阈值（0-1），默认0.4
    "indexType": "HNSW",              // 索引类型（HNSW/IVF_FLAT/IVF_PQ/AUTOINDEX），默认HNSW
    "indexParams": {"M": 16, "efConstruction": 200}, // 索引参数（JSON对象），NULL时使用默认参数
    "rerankEnabled": 0,               // 是否启用Rerank重排序（1-启用，0-禁用）
    "rerankModel": null,              // Rerank模型名称（如：bge-reranker-base）
    "rerankTopK": 10,                 // Rerank的Top K数量，默认10
    "rerankParams": null,             // Rerank参数（JSON对象）
    "chunkMaxLength": 2048,           // 分块最大长度（字符数），默认2048
    "chunkOverlap": 100,              // 分块重叠长度（字符数），默认100
    "chunkSeparators": ["\\n\\n\\n", "\\n\\n", "\\n", "。", "！", "？"], // 分隔符列表（JSON数组），NULL时使用默认分隔符
    "commonQuestions": [              // 常用问题列表（JSON数组），最多3个，NULL时表示未配置
      {"question": "简要介绍一下这个app", "order": 1},
      {"question": "AQI等级是如何定义的？", "order": 2},
      {"question": "怎么更换绑定邮箱", "order": 3}
    ],
    "status": 1,                      // 配置状态（1-启用，0-禁用）
    "remark": null,                   // 备注说明
    "createTime": "2024-01-01 10:00:00", // 创建时间
    "updateTime": "2024-01-02 09:30:00"  // 更新时间
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="rag-config-put">
        <api-card
          method="PUT"
          path="/api/rag/config/:appId"
          pill="post"
          title="更新应用 RAG 配置"
          description="">
          <template #desc>
            <p>支持部分更新 RAG 配置，所有字段均为可选。只传入需要更新的字段即可。字段说明请参考「查询应用 RAG 配置」接口的返回数据。</p>
            <p>权限说明：需要 USER_LEVEL.DEVELOPER（2-开发人员）或更高级别 USER_LEVEL.SUPER_ADMIN（1-超级管理员）。USER_LEVEL.SUPER_ADMIN（1-超级管理员）可以更新任意应用的 RAG 配置；其他用户需要拥有该应用的授权记录，可以通过 /api/mobile/apps/:appId/access 或者 /api/mobile/apps/:appId/permission 接口判断开发人员是否拥有该应用 RAG 配置的更新权限。</p>
          </template>
          <template #body>
<pre><code>{
  "embeddingModel": "text-embedding-v4", // Embedding模型名称（文本模型：text-embedding-v4，多模态模型：qwen2.5-vl-embedding）
  "userPromptTemplate": "请根据文档内容回答用户问题。", // 用户提示词模板（用户自定义，不支持变量替换，直接使用）
  "topK": 5,                             // 检索Top K数量，默认5
  "similarityThreshold": 0.4,            // 相似度阈值（0-1），默认0.4
  "llmTemperature": 0.7,                 // LLM 温度参数（0.0-2.0），控制输出随机性，默认0.7
  "llmMaxTokens": 2000,                  // LLM 最大 Token 数（1-8000），控制输出长度，默认2000
  "llmTopP": 0.8,                        // LLM Top P 参数（0.0-1.0），控制核采样，默认0.8
  "chunkMaxLength": 2048,               // 分块最大长度（字符数），默认2048
  "chunkOverlap": 100,                   // 分块重叠长度（字符数），默认100
  "indexType": "HNSW",                   // 索引类型（HNSW/IVF_FLAT/IVF_PQ/AUTOINDEX），默认HNSW
  "indexParams": {"M": 16, "efConstruction": 200}, // 索引参数（JSON对象），NULL时使用默认参数
  "rerankEnabled": 0,                    // 是否启用Rerank重排序（1-启用，0-禁用）
  "rerankModel": "bge-reranker-base",   // Rerank模型名称（如：bge-reranker-base）
  "rerankTopK": 10,                     // Rerank的Top K数量，默认10
  "commonQuestions": [                  // 常用问题列表（JSON数组），最多3个。格式：[{question: "问题内容", order?: 1}, ...]，question必传，order选填（不传时使用数组索引从1开始）。传null或空数组可还原为NULL
    {"question": "简要介绍一下这个app", "order": 1},
    {"question": "AQI等级是如何定义的？", "order": 2},
    {"question": "怎么更换绑定邮箱", "order": 3}
  ],
  "remark": "配置备注"                    // 备注说明
  // 注意：status 字段不允许修改
}</code></pre>
          </template>
          <template #curl>
<pre><code>curl -X PUT {{full('/api/rag/config/15')}} \
  -H "Authorization: {{tokenHeader}}" \
  -H "Content-Type: application/json" \
  -d '{{ setRAGConfigBody }}'</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "success",
  "data": {
    "configId": 1,
    "appId": 15,
    "topK": 5,
    "similarityThreshold": 0.4,
    "llmTemperature": 0.7,
    "llmMaxTokens": 2000,
    "llmTopP": 0.8,
    "chunkMaxLength": 2048,
    "chunkOverlap": 100,
    "indexType": "HNSW",
    "indexParams": {"M": 16, "efConstruction": 200},
    "rerankEnabled": 0,
    "rerankTopK": 10,
    "status": 1,
    "remark": "配置备注",
    "updateTime": "2024-01-02 10:00:00"
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="rag-config-delete">
        <api-card
          method="DELETE"
          path="/api/rag/config/:appId"
          pill="del"
          title="还原应用 RAG 配置"
          description="">
          <template #desc>
            <p>删除/重置 RAG 配置为默认值。配置不会被物理删除，而是重置为系统默认配置。</p>
            <p>权限说明：需要 USER_LEVEL.DEVELOPER（2-开发人员）或更高级别 USER_LEVEL.SUPER_ADMIN（1-超级管理员）。USER_LEVEL.SUPER_ADMIN（1-超级管理员）可以删除任意应用的 RAG 配置；其他用户需要拥有该应用的授权记录，可以通过 /api/mobile/apps/:appId/access 或者 /api/mobile/apps/:appId/permission 接口判断开发人员是否拥有该应用 RAG 配置的删除权限。</p>
          </template>
          <template #curl>
<pre><code>curl -X DELETE {{full('/api/rag/config/15')}} \
  -H "Authorization: {{tokenHeader}}"</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "success",
  "data": {
    "appId": 15
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="rag-documents-upload">
        <api-card
          method="POST"
          path="/api/rag/documents/:appId"
          pill="post"
          title="上传文件至知识库"
          description="">
          <template #desc>
            <p>支持 JSON 格式和 multipart/form-data 格式上传文档。multipart 格式支持通过阿里云文档解析（大模型版）将文档/音视频解析为 Markdown，然后自动分段并向量化存储到 Milvus。</p>
            <p>权限说明：需要 USER_LEVEL.DEVELOPER（2-开发人员）或更高级别 USER_LEVEL.SUPER_ADMIN（1-超级管理员）。USER_LEVEL.SUPER_ADMIN（1-超级管理员）可以为任意应用上传文档；其他用户需要拥有该应用的授权记录，可以通过 /api/mobile/apps/:appId/access 或者 /api/mobile/apps/:appId/permission 接口判断开发人员是否拥有该应用文档上传权限。</p>
            <p><strong>重要说明：</strong></p>
            <ul>
              <li>本接口调用<strong>阿里云文档解析（大模型版）服务（DocMind）</strong>进行文档解析，为<strong>计费项目</strong>，请合理控制文件数量和大小</li>
              <li><strong>建议前端限制：</strong>每个文件大小不超过 <strong>10MB</strong></li>
            </ul>
            <p><strong>支持的文件格式：</strong></p>
            <ul>
              <li><strong>文档格式：</strong>PDF、Word (doc/docx)、PowerPoint (ppt/pptx)、Excel (xls/xlsx/xlsm)、Markdown (md)、HTML (html/htm)、EPUB、MOBI、RTF、TXT</li>
              <li><strong>图片格式：</strong>JPG、JPEG、PNG、BMP、GIF</li>
              <li><strong>音视频格式：</strong>MP4、MKV、AVI、MOV、WMV、MP3、WAV、AAC</li>
            </ul>
            <p><strong>流式返回：</strong>multipart/form-data 格式支持流式返回进度（通过 <code>?stream=1</code> 或 <code>body.stream=true</code> 开启），实时推送文档解析和入库进度。</p>
            <p><strong>流式事件说明：</strong></p>
            <ul>
              <li><code>ready</code> - 流式连接建立</li>
              <li><code>file_uploaded</code> - 文件上传完成</li>
              <li><code>file_progress</code> - 文档解析进度（包含 stage: task_submitted | status_polling | result_fetching）</li>
              <li><code>file_completed</code> - 单个文件处理完成（docmind 解析完成，尚未向量化入库）</li>
              <li><code>file_all_completed</code> - 所有文件处理完成（包括向量化入库）</li>
              <li><code>error</code> - 处理失败</li>
            </ul>
          </template>
          <template #curl>
<pre><code># JSON 格式上传
curl -X POST {{full('/api/rag/documents/15')}} \
  -H "Authorization: {{tokenHeader}}" \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "text": "这是文档内容...",
        "metadata": {}
      }
    ]
  }'

# multipart 格式上传 PDF（普通返回）
curl -X POST {{full('/api/rag/documents/15')}} \
  -H "Authorization: {{tokenHeader}}" \
  -F "files[]=@/path/to/document.pdf"

# multipart 格式上传（流式返回）
curl -X POST "{{full('/api/rag/documents/15')}}?stream=1" \
  -H "Authorization: {{tokenHeader}}" \
  -F "files[]=@/path/to/document.pdf"</code></pre>
          </template>
          <template #response>
<pre><code>// 普通返回（JSON 或 multipart 非流式）
{
  "code": 200,
  "message": "success",
  "data": {
    "success": true,
    "count": 10,
    "chunkCount": 25,
    "skippedFiles": [...],  // 跳过的文件（如有）
    "failedFiles": [...],   // 处理失败的文件（如有）
    "summary": {
      "totalProcessed": 2,
      "skipped": 1,
      "failed": 0
  }
  }
}

// 流式返回（Server-Sent Events，仅 multipart/form-data）
// Content-Type: text/event-stream

event: ready
data: {"message":"stream start"}

event: file_uploaded
data: {"filename":"document.pdf","size":1234567}

event: file_progress
data: {"filename":"document.pdf","stage":"task_submitted","taskId":"docmind-xxx"}

event: file_progress
data: {"filename":"document.pdf","stage":"status_polling","attempts":5,"maxAttempts":120,"status":"Processing","progress":0.04}

event: file_progress
data: {"filename":"document.pdf","stage":"result_fetching","layoutCount":70}

event: file_completed
data: {"filename":"document.pdf"}

event: file_all_completed
data: {
  "successCount": 2,
  "failedFiles": [...],
  "skippedFiles": [...],
  "chunkCount": 150,
  "summary": {
    "totalProcessed": 2,
    "skipped": 1,
    "failed": 0
  }
}

// 错误事件
event: error
data: {"message":"RAG 文档入库失败","error":"错误详情"}</code></pre>
            <div class="tip" style="margin-top:8px;">前端使用示例</div>
            <pre><code>// 方式1：使用 Fetch API + ReadableStream（推荐，支持自定义 headers）
const formData = new FormData();
formData.append('files[]', file);

const response = await fetch('/api/rag/documents/15?stream=1', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token },
  body: formData
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() || ''; // 保留不完整的行
  
  let eventType = 'message';
  for (const line of lines) {
    if (line.startsWith('event: ')) {
      eventType = line.substring(7).trim();
    } else if (line.startsWith('data: ')) {
      const data = JSON.parse(line.substring(6));
      // 处理事件
      if (eventType === 'file_uploaded') {
        console.log('文件上传完成:', data.filename);
      } else if (eventType === 'file_progress') {
        console.log('处理进度:', data);
      } else if (eventType === 'file_completed') {
        console.log('文件处理完成:', data.filename);
      } else if (eventType === 'file_all_completed') {
        console.log('全部完成:', data);
      } else if (eventType === 'error') {
        console.error('处理失败:', data);
      }
    }
  }
}

// 方式2：使用 EventSource（不推荐，不支持自定义 headers，token 需通过 URL 参数传递，存在安全风险）
const eventSource = new EventSource('/api/rag/documents/15?stream=1&token=YOUR_TOKEN');

eventSource.addEventListener('file_uploaded', (e) => {
  const data = JSON.parse(e.data);
  console.log('文件上传完成:', data.filename);
});

eventSource.addEventListener('file_progress', (e) => {
  const data = JSON.parse(e.data);
  console.log('处理进度:', data);
});

eventSource.addEventListener('file_completed', (e) => {
  const data = JSON.parse(e.data);
  console.log('文件处理完成:', data.filename);
});

eventSource.addEventListener('file_all_completed', (e) => {
  const data = JSON.parse(e.data);
  console.log('全部完成:', data);
  eventSource.close();
});

eventSource.addEventListener('error', (e) => {
  const data = JSON.parse(e.data);
  console.error('处理失败:', data);
  eventSource.close();
});</code></pre>
          </template>
        </api-card>
      </section>

      <section id="rag-collections-list">
        <api-card
          method="GET"
          path="/api/milvus/collections"
          pill="get"
          title="查询知识库集合列表"
          description="列出所有 Milvus 集合（Collection），用于查看知识库集合信息。">
          <template #curl>
<pre><code>curl -X GET {{full('/api/milvus/collections')}} \
  -H "Authorization: {{tokenHeader}}"</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "success",
  "data": {
    "collections": [
      {
        "name": "rag_app_15",
        "description": "RAG collection for app 15",
        "numEntities": 1000
      }
    ]
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="rag-collections-data">
        <api-card
          method="GET"
          path="/api/milvus/collections/:collectionName/data"
          pill="get"
          title="查询知识库文档"
          description="查询指定集合中的文档数据。支持分页和表达式过滤。">
          <template #body>
<pre><code>Query 参数：
- page: 页码（默认 1）
- pageSize: 每页数量（默认 20，最大 100）
- expr: 过滤表达式（可选，如：id == 'xxx' 或 text like '%keyword%'）</code></pre>
          </template>
          <template #curl>
<pre><code># 基本查询
curl -X GET "{{full('/api/milvus/collections/rag_app_15/data')}}?page=1&pageSize=20" \
  -H "Authorization: {{tokenHeader}}"

# 带过滤表达式的查询
curl -X GET "{{full('/api/milvus/collections/rag_app_15/data')}}?page=1&pageSize=20&expr=id%20like%20'chunk_%'" \
  -H "Authorization: {{tokenHeader}}"</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "success",
  "data": {
    "list": {
      "collectionName": "rag_app_20",
      "total": 3,
      "limit": 10,
      "offset": 20,
      "data": [
      {
          "id": "chunk_1767060626567_4",
          "text": "通过"ISV管理...",
          "metadata": {
            "chunkIndex": 4,
            "chunkTotal": 7
          },
          "vector": "[1024 dimensions]"
        },
        {
          "id": "chunk_1767060626567_5",
          "text": "在应用管理中...",
          "metadata": {
            "chunkIndex": 5,
            "chunkTotal": 7
          },
          "vector": "[1024 dimensions]"
      }
      ]
    },
    "total": 23,
    "page": 3,
    "pageSize": 10
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="rag-collections-delete">
        <api-card
          method="DELETE"
          path="/api/milvus/collections/:collectionName/data"
          pill="del"
          title="删除知识库文档"
          description="">
          <template #desc>
            <p>删除指定集合中的文档。支持通过 ids 数组或 expr 表达式删除。</p>
            <p>权限说明：需要 USER_LEVEL.DEVELOPER（2-开发人员）或更高级别 USER_LEVEL.SUPER_ADMIN（1-超级管理员）。USER_LEVEL.SUPER_ADMIN（1-超级管理员）可以删除任意应用的文档；其他用户需要拥有该应用的授权记录，可以通过 /api/mobile/apps/:appId/access 或者 /api/mobile/apps/:appId/permission 接口判断开发人员是否拥有该应用文档删除权限。集合名称格式必须为 <code>rag_app_:appId</code>，例如：<code>rag_app_15</code>。</p>
            <p><strong>注意：</strong>通过表达式删除所有文档时，可能因为 Milvus 性能限制和批量删除限制，无法一次性完全删除所有数据。如果需要清空整个知识库，推荐使用"删除知识库集合"接口（DELETE /api/milvus/collections/:collectionName），该接口会删除整个集合及其所有数据。</p>
          </template>
          <template #body>
<pre><code>// 方式1：通过 ids 数组删除
{
  "ids": ["chunk_1766719162484_0", "chunk_1766719162484_1"]
}

// 方式2：通过表达式删除（删除所有相关文档）
{
  "expr": "id like 'chunk_%'"
}</code></pre>
          </template>
          <template #curl>
<pre><code># 方式1：通过 ids 数组删除
curl -X DELETE {{full('/api/milvus/collections/rag_app_15/data')}} \
  -H "Authorization: {{tokenHeader}}" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["chunk_1766719162484_0", "chunk_1766719162484_1"]
  }'

# 方式2：通过表达式删除（删除所有相关文档）
curl -X DELETE {{full('/api/milvus/collections/rag_app_15/data')}} \
  -H "Authorization: {{tokenHeader}}" \
  -H "Content-Type: application/json" \
  -d '{
    "expr": "id like '\''chunk_%'\''"
  }'</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "success",
  "data": {
    "deletedCount": 2
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="rag-collections-drop">
        <api-card
          method="DELETE"
          path="/api/milvus/collections/:collectionName"
          pill="del"
          title="删除知识库集合"
          description="">
          <template #desc>
            <p>删除指定的集合（包括所有数据）。此操作不可恢复，请谨慎使用。</p>
            <p>权限说明：需要 USER_LEVEL.DEVELOPER（2-开发人员）或更高级别 USER_LEVEL.SUPER_ADMIN（1-超级管理员）。USER_LEVEL.SUPER_ADMIN（1-超级管理员）可以删除任意应用的集合；其他用户需要拥有该应用的授权记录，可以通过 /api/mobile/apps/:appId/access 或者 /api/mobile/apps/:appId/permission 接口判断开发人员是否拥有该应用集合删除权限。集合名称格式必须为 <code>rag_app_:appId</code>，例如：<code>rag_app_15</code>。</p>
          </template>
          <template #curl>
<pre><code>curl -X DELETE {{full('/api/milvus/collections/rag_app_15')}} \
  -H "Authorization: {{tokenHeader}}"</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "success",
  "data": {
    "collectionName": "rag_app_15",
    "deleted": true
  }
}

// 如果集合不存在
{
  "code": 200,
  "message": "success",
  "data": {
    "collectionName": "rag_app_15",
    "deleted": false,
    "reason": "Collection 不存在"
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="rag-session-create">
        <api-card
          method="POST"
          path="/api/rag/sessions/:appId"
          pill="post"
          title="创建会话"
          description="">
          <template #desc>
            <p>创建一个新的 RAG 会话。会话标题可选，如果不传则默认为「新会话」。会话创建后会自动使用用户最后一条提问作为标题。</p>
            <p>权限说明：所有平台用户（USER_LEVEL: 1-超级管理员、2-开发人员、3-访客）均可使用，无需应用权限。</p>
          </template>
          <template #body>
<pre><code>{
  "title": "新会话"
}</code></pre>
          </template>
          <template #curl>
<pre><code>curl -X POST {{full('/api/rag/sessions/15')}} \
  -H "Authorization: {{tokenHeader}}" \
  -H "Content-Type: application/json" \
  -d '{{ createSessionBody }}'</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "success",
  "data": {
    "sessionId": 123
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="rag-sessions-list">
        <api-card
          method="GET"
          path="/api/rag/sessions/:appId"
          pill="get"
          title="获取会话列表"
          description="获取指定应用的会话列表，支持分页和筛选。权限说明：管理员可以查询其他用户的会话（传入 userId），普通用户只能查询自己的会话（传入的 userId 会被忽略）。">
          <template #body>
<pre><code>Query 参数：
- page: 页码（默认 1）
- pageSize: 每页数量（默认 20，最大 100）
- userId: 用户ID（可选，管理员可用，普通用户会被忽略）
- status: 状态（可选，0-正常，1-归档）</code></pre>
          </template>
          <template #curl>
<pre><code>curl -X GET "{{full('/api/rag/sessions/15')}}?page=1&pageSize=20" \
  -H "Authorization: {{tokenHeader}}"</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "success",
  "data": {
    "total": 10,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1,
    "list": [
      {
        "sessionId": 123,
        "appId": 15,
        "userId": 456,
        "userName": "张三",
        "sessionTitle": "如何退出登录？",
        "status": 0,
        "createTime": "2024-01-15 10:30:00",
        "updateTime": "2024-01-15 10:35:00"
      }
    ]
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="rag-session-messages">
        <api-card
          method="GET"
          path="/api/rag/sessions/:appId/:sessionId/messages"
          pill="get"
          title="获取会话对话列表"
          description="获取指定会话的所有消息列表，支持分页和角色筛选。权限说明：管理员可以获取任何会话的消息，普通用户只能获取自己的会话消息。">
          <template #body>
<pre><code>Query 参数：
- page: 页码（默认 1）
- pageSize: 每页数量（默认 50，最大 200）
- role: 角色筛选（可选，'user' 或 'assistant'）</code></pre>
          </template>
          <template #curl>
<pre><code>curl -X GET "{{full('/api/rag/sessions/15/123/messages')}}?page=1&pageSize=50" \
  -H "Authorization: {{tokenHeader}}"</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "success",
  "data": {
    "total": 6,
    "page": 1,
    "pageSize": 50,
    "totalPages": 1,
    "list": [
      {
        "messageId": 1,
        "sessionId": 123,
        "role": "user",
        "content": "如何退出登录？",
        "createTime": "2024-01-15 10:30:00"
      },
      {
        "messageId": 2,
        "sessionId": 123,
        "role": "assistant",
        "content": "您可以通过以下方式退出登录...",
        "sourceDocs": [
          {
            "text": "退出登录的方法...",
            "score": 0.85
          }
        ],
        "tokensUsed": 150,
        "responseTime": 1200,
        "createTime": "2024-01-15 10:30:02"
      }
    ]
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="rag-session-delete">
        <api-card
          method="DELETE"
          path="/api/rag/sessions/:appId/:sessionId"
          pill="del"
          title="删除会话"
          description="删除指定会话，会级联删除该会话的所有消息。权限说明：管理员可以删除任何会话，普通用户只能删除自己的会话。">
          <template #curl>
<pre><code>curl -X DELETE {{full('/api/rag/sessions/15/123')}} \
  -H "Authorization: {{tokenHeader}}"</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "success",
  "data": {
    "sessionId": 123
  }
}</code></pre>
          </template>
        </api-card>
      </section>

      <section id="rag-ask">
        <api-card
          method="POST"
          path="/api/rag/ask/:appId"
          pill="post"
          title="知识库问答"
          description="">
          <template #desc>
            <p>基于知识库进行问答，支持流式和非流式两种模式。如果传入 sessionId，会自动记录对话历史，实现上下文记忆功能。</p>
            <p>权限说明：所有平台用户（USER_LEVEL: 1-超级管理员、2-开发人员、3-访客）均可使用，无需应用权限。</p>
          </template>
          <template #body>
<pre><code>{
  "question": "如何退出登录？",
  "stream": false,
  "sessionId": 123
}

// 或通过 Query 参数传递
?stream=1&sessionId=123</code></pre>
          </template>
          <template #curl>
<pre><code># 非流式问答
curl -X POST {{full('/api/rag/ask/15')}} \
  -H "Authorization: {{tokenHeader}}" \
  -H "Content-Type: application/json" \
  -d '{{ askBody }}'

# 流式问答
curl -X POST "{{full('/api/rag/ask/15')}}?stream=1" \
  -H "Authorization: {{tokenHeader}}" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "如何退出登录？",
    "sessionId": 123
  }'</code></pre>
          </template>
          <template #response>
<pre><code>// 非流式响应
{
  "code": 200,
  "message": "success",
  "data": {
    "answer": "您可以通过以下方式退出登录...",
    "sources": [
      {
        "text": "退出登录的方法...",
        "score": 0.85
      }
    ],
    "usage": {
      "inputTokens": 100,
      "outputTokens": 50,
      "totalTokens": 150
    },
    "responseTime": 1200,
    "sessionId": 123
  }
}

// 流式响应（Server-Sent Events）
event: ready
data: {"message":"stream start"}

event: answer
data: {"delta":"您","done":false}

event: answer
data: {"delta":"好","done":false}

event: end
data: {"done":true,"responseTime":1200}</code></pre>
          </template>
        </api-card>
      </section>
    </div>
  `
});
