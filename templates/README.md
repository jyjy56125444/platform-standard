# RAG 提示词模板

本目录包含 RAG（检索增强生成）系统使用的提示词模板文件。

## 模板文件

- `rag-system-prompt.md` - 系统提示词模板
- `rag-user-prompt.md` - 用户提示词模板

## 使用方法

### 在代码中使用

```javascript
const PromptTemplates = require('../utils/promptTemplates');

// 生成系统提示词
const systemPrompt = PromptTemplates.generateSystemPrompt('移动办公助手');

// 生成用户提示词模板
const userPromptTemplate = PromptTemplates.generateUserPromptTemplate('移动办公助手');
```

### 模板变量

模板支持以下变量：

- `{{appName}}` - 应用名称（在系统提示词和用户提示词模板中使用）

用户提示词模板还支持以下占位符（在运行时替换）：

- `{context}` - 检索到的文档内容
- `{question}` - 用户问题

## 修改模板

直接编辑对应的 `.md` 文件即可，修改后重启服务生效。

## 注意事项

1. 模板文件使用 UTF-8 编码
2. 变量使用双花括号 `{{variableName}}` 格式
3. 运行时占位符使用单花括号 `{placeholder}` 格式
4. 修改模板后需要重启服务才能生效

