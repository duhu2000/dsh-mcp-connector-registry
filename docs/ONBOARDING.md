# DSH MCP 连接器上架指南

本指南面向希望把 MCP 服务加入 DSH MCP Connector Registry 的服务商和社区贡献者。连接器通过本仓库独立上架，无需等待 `dsh-mcp-connector` 插件重新发布 npm 包。

公开目录地址：

```text
https://raw.githubusercontent.com/duhu2000/dsh-mcp-connector-registry/main/catalog.json
```

## 1. 选择提交方式

### 方式 A：提交 Connector PR（推荐）

适合能够维护 JSON Descriptor 的贡献者：

1. Fork 本仓库并从 `main` 创建分支。
2. 复制 `connectors/example.sample.json` 为 `connectors/<connector-id>.json`。
3. 填写公开接入参数、说明和示例 Prompt。
4. 本地完成测试和校验。
5. 只提交 Connector 源文件及必要的公开图标资源，然后发起 PR。

### 方式 B：提交收录请求

如果暂时不熟悉 Descriptor，可以使用 [Connector request](https://github.com/duhu2000/dsh-mcp-connector-registry/issues/new?template=connector-request.yml) 提供服务官网、MCP 文档、鉴权方式和 Logo 来源，由维护者评估是否代为建卡。

## 2. 环境与本地校验

建议使用 Node.js 24，并在仓库根目录运行：

```bash
npm ci --legacy-peer-deps
npm test && npm run validate && npm run assets:check
```

- `npm test` 检查构建逻辑和现有连接器约束。
- `npm run validate` 重建并校验 Schema、重复 ID/ServerName、URL 和潜在密钥。
- `npm run assets:check` 检查远程图标的内容类型和跨域兼容性。

`npm run validate` 会在本地生成或更新 `catalog.json`，但贡献者不要手动修改或提交该文件。PR 合并到 `main` 后，CI 会自动重建并仅在产物变化时提交。

## 3. Descriptor 模板

下面是一个 Hosted MCP 的完整起点。实际字段以 [`schema/connector.schema.json`](../schema/connector.schema.json) 为准。

```json
{
  "schemaVersion": 1,
  "id": "vendor-service",
  "name": "厂商·服务名称",
  "vendor": "厂商名称",
  "icon": "https://example.com/icon.svg",
  "category": "开发工具",
  "summary": "一句话说明连接器能力",
  "description": "完整说明、适用场景、数据范围和必要限制。",
  "tags": ["示例", "MCP"],
  "published": true,
  "featured": false,
  "homepage": "https://example.com",
  "probeStatus": "unverified",
  "auth": {
    "mode": "oauth2-pkce",
    "issuer": "https://auth.example.com",
    "scope": "mcp:tools",
    "clientName": "DeepSeek Harness - MCP 连接器",
    "tokenEndpointAuthMethod": "none"
  },
  "servers": [
    {
      "serverKey": "main",
      "serverName": "vendor-service",
      "url": "https://mcp.example.com/mcp",
      "transport": "streamable-http"
    }
  ],
  "promptVariables": [
    {
      "name": "topic",
      "label": "查询主题",
      "placeholder": "例如：季度经营分析",
      "required": true
    }
  ],
  "prompts": [
    {
      "title": "快速查询",
      "text": "帮我查询 {{topic}}"
    }
  ]
}
```

文件名必须与 `id` 完全一致，例如 `connectors/vendor-service.json`。`id` 和 `serverName` 上架后应保持稳定，避免用户已有连接失效。

## 4. 关键字段

| 字段 | 要求 |
|---|---|
| `id` | 全局唯一，推荐使用小写英文和连字符。 |
| `name` / `vendor` | 使用用户可识别的正式服务名称和厂商名称。 |
| `summary` | 卡片上的简短能力说明，避免宣传性空话。 |
| `description` | 说明能力、适用范围、重要限制和可能产生的费用或副作用。 |
| `category` | 必须使用下方标准分类之一。 |
| `published` | 正式上架填写 `true`。 |
| `featured` | 新提交保持 `false`；推荐位由维护者统一管理。 |
| `homepage` | 服务官网或 MCP 产品页，必须是 HTTPS。 |
| `icon` | 官方公开图标 URL，必须可被 DSH Desktop 跨域读取。 |
| `probeStatus` | 新连接器填写 `unverified`，由维护流程更新状态。 |
| `servers` | 至少一个 MCP Server；每个 `serverKey`、`serverName` 均需稳定且唯一。 |
| `prompts` | 提供通用、可安全执行的示例，不包含真实客户或个人数据。 |

## 5. 标准分类

`category` 只能使用以下 9 个值：

- 企业数据
- 金融投资
- 法律合规
- 开发工具
- 办公协作
- 调研分析
- 设计创意
- 效率工具
- 其他

优先选择最能表达主要用途的单一分类。不要新增近义分类，例如“金融数据”“法律数据”“数据采集”或“通用工具”。

## 6. 传输方式

### Hosted MCP

公网服务使用 `streamable-http`：

```json
{
  "serverKey": "main",
  "serverName": "vendor-service",
  "url": "https://mcp.example.com/mcp",
  "transport": "streamable-http"
}
```

公网 URL 必须使用 HTTPS。Registry 健康探针只探测公开网络端点，不会注入真实用户凭据。

### 本地 stdio

只有确实需要在用户机器上启动的官方客户端才使用 `stdio`：

```json
{
  "serverKey": "main",
  "serverName": "vendor-service",
  "command": "npx",
  "args": ["-y", "@vendor/mcp-server"],
  "transport": "stdio"
}
```

stdio 进程由 `dsh-mcp-client` 管理，目录只透传公开的 `command`、`args`、`env` 和 `cwd`。Registry CI 和健康探针不得执行本地 stdio 命令。

## 7. 鉴权模式

| `auth.mode` | 适用场景 | Descriptor 中填写 |
|---|---|---|
| `none` | 无需凭据的公开服务 | 公共 MCP URL。 |
| `bearer` | 用户自行获取 Bearer Token | 凭据名称、说明和帮助链接；不填写 Token。 |
| `api-key` | 使用指定 Header 的 API Key | `apiKeyHeader`、凭据说明和帮助链接；不填写 Key。 |
| `oauth2-pkce` | 支持标准 OAuth 2.1/PKCE | 公开 issuer、scope、客户端名称和 `tokenEndpointAuthMethod: none`。 |

OAuth 卡片必须提供可验证的 Protected Resource Metadata 和 Authorization Server Metadata。只支持固定 Client Secret、非标准网页登录或无法完成 PKCE 的服务，不应标注为 OAuth 一键授权。

Bearer/API Key 示例：

```json
{
  "auth": {
    "mode": "api-key",
    "apiKeyHeader": "x-api-key",
    "credentialName": "API Key",
    "credentialPlaceholder": "请输入服务商签发的 API Key",
    "credentialDescription": "仅保存在用户的 DSH 本机。",
    "credentialHelpLabel": "获取 API Key"
  }
}
```

## 8. 安全与内容检查清单

提交前请逐项确认：

- Descriptor、Prompt、URL 和 Header 中不包含 Token、API Key、密码、Cookie、Client Secret 或其他真实凭据。
- 不在 `env`、`args`、查询参数或示例文本中夹带密钥；需要用户填写的值由本机配置表单收集。
- 公网 MCP、官网、帮助页和图标均使用 HTTPS。
- Header 只包含无敏感值的公开协议参数，例如 `Accept`；不提交带值的 `Authorization`。
- Prompt 不包含真实客户、个人信息、受限数据或不可逆操作的默认确认。
- 会产生费用、写入、删除、发布或停止任务的能力，在说明和 Prompt 中明确要求用户确认。
- 使用第三方名称或 Logo 时，在 PR 中提供官方来源。
- stdio 命令来自官方公开包，并说明运行方式；不得要求 Registry 探针执行本地命令。

真实 OAuth 授权结果、Token 和 API Key 只应保存在用户的 DSH 本机，不进入 Registry。

## 9. PR 提交范围

通常只需提交：

```text
connectors/<connector-id>.json
assets/<connector-id>.*   # 仅在确实需要仓库托管图标时
```

不要提交：

- `catalog.json` 的手工改动；
- `node_modules` 或符号链接；
- 本地测试凭据、日志和用户配置；
- 与本次连接器无关的格式化或清理改动。

PR 模板会要求服务官网、MCP 文档、鉴权方式、Logo 来源和本地校验结果。CI 通过后，由维护者复核公开可达性、品牌来源和交互安全性。

## 10. 常见问题

### 为什么本地运行 `validate` 后出现 `catalog.json` 差异？

这是确定性构建的正常结果。不要把该差异加入 PR；合并后 CI 会自动重建公开目录。

### 需要凭据的服务为什么显示 `unverified`？

公共 CI 不持有用户的 Token 或 API Key。无凭据探针无法完成深度验证时可保持 `unverified`，但服务的公开端点、元数据和配置仍需可核验。

### 可以把同一厂商的多个 MCP Server 放在一张卡片里吗？

可以。每个 Server 使用稳定、唯一的 `serverKey` 和 `serverName`，并确保同一鉴权配置适用于这组 Server；否则应拆成独立连接器。

### 合并后多久出现在市场？

合并到 `main` 后，CI 会自动重建并提交 `catalog.json`。用户刷新远程目录后即可获得新卡片；若远程目录暂时不可用，插件会继续使用内置目录。
