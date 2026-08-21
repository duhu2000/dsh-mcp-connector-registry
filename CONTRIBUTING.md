# Contributing

## Connector PR checklist

- 一个文件只包含一个 ConnectorDescriptor，文件名与 `id` 一致。
- `id` 和所有 `serverName` 在全局唯一，不在上架后随意变更。
- 公网 MCP、官网、帮助页和图标使用 HTTPS。
- 目录不得包含任何用户或服务商凭据。
- Bearer/API Key 卡片只声明凭据表单，真实值仅在用户 DSH 本机保存。
- OAuth 卡片需提供可验证的受保护资源与授权服务器元数据。
- 使用第三方名称和 Logo 时，提供官网来源并保留“第三方收录”标识。
- 本地运行 `npm ci --legacy-peer-deps && npm run check`。

CI 使用已发布的 `dsh-mcp-connector` 校验器，确保远程目录与客户端 Schema 一致。
