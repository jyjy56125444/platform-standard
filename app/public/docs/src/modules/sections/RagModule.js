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
    "userPromptTemplate": null,       // 用户提示词模板（支持 {context} 和 {question} 变量）
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
          description="支持部分更新 RAG 配置，所有字段均为可选。只传入需要更新的字段即可。字段说明请参考「查询应用 RAG 配置」接口的返回数据。">
          <template #body>
<pre><code>{
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
  "rerankModel": "bge-reranker-base",
  "rerankTopK": 10,
  "status": 1,
  "remark": "配置备注"
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
          description="删除/重置 RAG 配置为默认值。配置不会被物理删除，而是重置为系统默认配置。">
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
          description="支持 JSON 格式和 multipart/form-data 格式上传文档。支持 PDF、Markdown、TXT 等格式。文档会自动分段并向量化存储到 Milvus。">
          <template #body>
<pre><code>// JSON 格式
{
  "documents": [
    {
      "text": "文档内容...",
      "metadata": {}
    }
  ]
}

// multipart/form-data 格式
files[]: [PDF/MD/TXT 文件]</code></pre>
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

# multipart 格式上传 PDF
curl -X POST {{full('/api/rag/documents/15')}} \
  -H "Authorization: {{tokenHeader}}" \
  -F "files[]=@/path/to/document.pdf"</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "success",
  "data": {
    "success": true,
    "count": 10,
    "chunkCount": 25
  }
}</code></pre>
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
- pageSize: 每页数量（默认 20）
- expr: 过滤表达式（可选）</code></pre>
          </template>
          <template #curl>
<pre><code>curl -X GET "{{full('/api/milvus/collections/rag_app_15/data')}}?page=1&pageSize=20" \
  -H "Authorization: {{tokenHeader}}"</code></pre>
          </template>
          <template #response>
<pre><code>{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "doc_001",
        "text": "文档内容...",
        "metadata": {}
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
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
          description="删除指定集合中的文档。支持通过 ids 数组或 expr 表达式删除。">
          <template #body>
<pre><code>// 方式1：通过 ids 数组删除
{
  "ids": ["doc_001", "doc_002"]
}

// 方式2：通过表达式删除
{
  "expr": "id like 'doc_%'"
}</code></pre>
          </template>
          <template #curl>
<pre><code>curl -X DELETE {{full('/api/milvus/collections/rag_app_15/data')}} \
  -H "Authorization: {{tokenHeader}}" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["doc_001", "doc_002"]
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

      <section id="rag-session-create">
        <api-card
          method="POST"
          path="/api/rag/sessions/:appId"
          pill="post"
          title="创建会话"
          description="创建一个新的 RAG 会话。会话标题可选，如果不传则默认为「新会话」。会话创建后会自动使用用户最后一条提问作为标题。">
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
          description="基于知识库进行问答，支持流式和非流式两种模式。如果传入 sessionId，会自动记录对话历史，实现上下文记忆功能。">
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

event: end
data: {"done":true,"responseTime":1200}</code></pre>
          </template>
        </api-card>
      </section>
    </div>
  `
});
