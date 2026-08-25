# 第三方连接器上架指南

本指南面向 MCP 服务商与社区贡献者：如何让你的 MCP 服务出现在 DSH「MCP连接器」市场。

上架只需要在 `dsh-mcp-connector-registry` 提交一份公开 Connector Descriptor；不需要改动 `dsh-mcp-connector` 插件代码，也不需要等待插件重新发布 npm 包。合并后，用户点击市场中的“刷新”即可获取新卡片。

公开目录地址：

```text
https://raw.githubusercontent.com/duhu2000/dsh-mcp-connector-registry/main/catalog.json
```

## 1. 上架前准备

请先准备以下公开资料：

| # | 资料 | 要求 |
|---|---|---|
| 1 | MCP 接入方式 | Hosted MCP 提供公开 HTTPS URL；本地 MCP 提供官方 stdio 命令与包说明。 |
| 2 | 鉴权方式 | `none`、`bearer`、`api-key`、`oauth2-pkce` 四选一。 |
| 3 | 官网与文档 | 服务官网、MCP 配置文档、凭据申请或 OAuth 说明。 |
| 4 | 名称与图标 | 正式服务名称；HTTPS 可访问且允许 DSH Desktop 读取的 Logo URL，或 emoji。 |
| 5 | 能力与边界 | 一句话简介、完整说明、适用范围、费用和写入/删除等副作用。 |
| 6 | 安全示例 | 不含真实客户、个人信息、受限数据和真实凭据的 Prompt。 |

目录只保存公开参数。Token、API Key、密码、Cookie、Client Secret、授权码和带值的鉴权 Header 一律不进入 Descriptor；真实凭据只保存在用户的 DSH 本机。

Hosted MCP 可以要求鉴权。公共 CI 不持有真实用户凭据；对于 Bearer/API Key 服务，无凭据探测返回 HTTP 401/403 是可预期结果，不要求匿名 `initialize` 成功。

## 2. 两条上架路径

### 路径 A：服务商提交 Connector PR（推荐）

适合能够维护 JSON Descriptor 的服务商或贡献者。你负责提交和后续更新自己的 `connectors/<id>.json`。

### 路径 B：提交收录请求

如果暂时不熟悉 Descriptor，可创建 [Connector request issue](https://github.com/duhu2000/dsh-mcp-connector-registry/issues/new?template=connector-request.yml)，提供官网、MCP 文档、鉴权方式、Logo 来源和联系人。维护者会评估信息是否完整以及是否代为建卡；Issue 不等于自动收录。

## 3. 路径 A：6 步完成上架

### 第 1 步：Fork 并创建分支

在 GitHub Fork 本仓库，然后：

```bash
git clone https://github.com/<你的账号>/dsh-mcp-connector-registry.git
cd dsh-mcp-connector-registry
git checkout -b add-my-connector
```

### 第 2 步：复制模板

```bash
cp connectors/example.sample.json connectors/<connector-id>.json
```

- `<connector-id>` 使用小写英文字母、数字和连字符，例如 `my-company-search`。
- 文件名必须与 Descriptor 中的 `id` 完全一致。
- 一张市场卡片对应一个文件；不要把多个无关产品塞进同一张卡片。

### 第 3 步：填写 Descriptor

按第 5～8 节填写。Hosted MCP 可参考 [`connectors/github.json`](../connectors/github.json)，完整起点见 [`connectors/example.sample.json`](../connectors/example.sample.json)。实际约束以 [`schema/connector.schema.json`](../schema/connector.schema.json) 为准。

### 第 4 步：本地验证

建议使用 CI 同款 Node.js 24：

```bash
npm ci --legacy-peer-deps
npm test && npm run validate && npm run assets:check
```

- `npm test` 检查构建逻辑、分类和连接器约束。
- `npm run validate` 确定性重建 `catalog.json`，并执行 Schema、重复 ID/ServerName、URL 与潜在密钥审计。
- `npm run assets:check` 检查远程 Logo 的图片类型和浏览器跨域兼容性。

本地验证会产生 `catalog.json` 差异，这是正常现象；不要手动修改或提交 `catalog.json`。合并后 CI 会自动重建。

### 第 5 步：提交 Connector PR

```bash
git add connectors/<connector-id>.json
git commit -m "Add <connector-id>"
git push origin add-my-connector
```

向 `duhu2000/dsh-mcp-connector-registry:main` 发起 Pull Request，并完整填写 PR checklist。通常只提交 Connector 源文件；确需仓库托管图标时，再提交 `assets/<connector-id>.*`。

### 第 6 步：等待 CI、审核与自动发布

CI 通过后，由维护者复核官网、MCP 文档、鉴权、品牌来源、公开可达性和交互安全性。PR 合并到 `main` 后：

1. `validate` job 再次执行测试、Descriptor 校验和图片检查；
2. `rebuild-catalog` job 运行确定性构建；
3. 如果 `catalog.json` 有变化，`github-actions[bot]` 自动提交 `chore: rebuild catalog.json [skip ci]` 并推送；
4. `purge-cdn` job 自动清理 jsDelivr 的 `@main/catalog.json` 缓存，并重试验证 CDN 内容与 `main` 产物的完整 SHA-256 一致；
5. 用户在 MCP连接器市场点击“刷新”即可看到新卡片，无需人工清理 CDN、重装插件或重启 DSH。

## 4. 完整 Descriptor 模板

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
  "homepage": "https://example.com/mcp-docs",
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
      "transport": "streamable-http",
      "headers": {
        "Accept": "application/json, text/event-stream"
      }
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
      "text": "帮我查询 {{topic}}",
      "server": "main"
    }
  ]
}
```

## 5. 字段说明

### 5.1 卡片字段

| 字段 | 必填 | 说明 |
|---|---|---|
| `schemaVersion` | 建议 | 当前填 `1`。 |
| `id` | 是 | 全局唯一；必须与文件名一致；上架后保持稳定。 |
| `name` | 是 | 市场显示名。 |
| `vendor` | 建议 | 正式厂商或服务商名称。 |
| `icon` | 建议 | HTTPS Logo URL 或 emoji；不得使用本机路径。 |
| `category` | 建议 | 使用第 6 节的 9 个标准分类之一。 |
| `summary` | 建议 | 卡片副标题，简洁说明主要能力。 |
| `description` | 建议 | 说明能力、适用范围、限制、费用和副作用。 |
| `tags` | 否 | 搜索标签数组。 |
| `published` | 建议 | 正式上架填 `true`。 |
| `featured` | 建议 | 新提交保持 `false`；推荐位由维护者管理。 |
| `homepage` | 建议 | HTTPS 官网或 MCP 文档。 |
| `probeStatus` | 否 | 新卡片填 `unverified`；维护流程可更新状态。 |
| `auth` | 建议 | 鉴权声明，见第 8 节。 |
| `servers` | 是 | 至少一个 MCP Server。 |
| `promptVariables` | 否 | 卡片 Prompt 的公共变量定义。 |
| `prompts` | 否 | 安全、通用的快速体验 Prompt。 |
| `toolsSnapshot` | 否 | 维护者生成或核验的公开工具快照；第三方首次 PR 通常不要手写。 |

### 5.2 Server 字段

| 字段 | 必填 | 说明 |
|---|---|---|
| `serverKey` | 是 | 卡片内唯一的稳定标识；Prompt 的 `server` 引用它。 |
| `serverName` | 是 | Registry 全局唯一；连接后形成 `mcp__<serverName>__*` 工具前缀。 |
| `transport` | 建议 | 仅 `streamable-http` 或 `stdio`。历史 `sse` 不应提交到 Registry。 |
| `url` | HTTP 必填 | Hosted MCP 的 HTTPS URL。 |
| `headers` | 否 | 只放公开协议 Header；禁止带值的 `Authorization`、Token 或 Key。 |
| `command` | stdio 必填 | 官方本地启动命令。 |
| `args` / `env` / `cwd` | 否 | stdio 公开默认参数；禁止任何真实凭据或本机专属绝对路径。 |
| `credentialBindings` | 凭据型 stdio 必填 | 把环境变量名映射到 `auth.credentialFields[].key`；只声明映射，不填写真实值。 |

## 6. 9 个标准分类

| `category` | 适用场景 |
|---|---|
| `企业数据` | 企业工商、司法、经营等企业数据能力。 |
| `金融投资` | 行情、财务、基金、投研和资产配置。 |
| `法律合规` | 法规、案例、合同、合规与风险审查。 |
| `开发工具` | 代码、CI/CD、API、云平台和数据库。 |
| `办公协作` | 文档、知识库、邮件、会议和团队协作。 |
| `调研分析` | 搜索、研究、网页信息获取和分析。 |
| `设计创意` | 设计、图像、视频、音频和创意生产。 |
| `效率工具` | 自动化、数据采集、地图和通用效率。 |
| `其他` | 无法归入以上分类的能力。 |

优先选择最能表达主要用途的一个分类。不要新增“金融数据”“法律数据”“数据采集”“通用工具”等近义值。

## 7. 传输方式

### 7.1 Hosted MCP：`streamable-http`

```json
{
  "serverKey": "main",
  "serverName": "vendor-service",
  "url": "https://mcp.example.com/mcp",
  "transport": "streamable-http"
}
```

公网 URL 必须使用 HTTPS。旧式 SSE 服务应先升级或通过兼容的 Streamable HTTP 入口上架；Registry Schema 不接受 `transport: "sse"`。

### 7.2 本地 MCP：`stdio`

```json
{
  "serverKey": "main",
  "serverName": "vendor-service",
  "command": "npx",
  "args": ["-y", "@vendor/mcp-server"],
  "transport": "stdio"
}
```

stdio 进程由 `dsh-mcp-client` 管理，插件只透传公开的 `command`、`args`、`env` 和 `cwd`。Registry CI 和健康探针不得执行本地 stdio 命令；维护者会核验命令是否来自服务商官方公开包。

需要一个或多个本机凭据时，使用 `auth.credentialFields` 声明表单字段，再通过 `servers[].credentialBindings` 绑定到进程环境变量。不要把真实值写进 `servers[].env`，也不要把密钥拼进 `args`：

```json
{
  "auth": {
    "mode": "api-key",
    "credentialFields": [
      { "key": "appId", "label": "App ID", "required": true, "secret": false },
      { "key": "appSecret", "label": "App Secret", "required": true, "secret": true }
    ]
  },
  "servers": [
    {
      "serverKey": "main",
      "serverName": "vendor-service",
      "command": "npx",
      "args": ["-y", "@vendor/mcp-server"],
      "credentialBindings": {
        "VENDOR_APP_ID": "appId",
        "VENDOR_APP_SECRET": "appSecret"
      },
      "transport": "stdio"
    }
  ]
}
```

## 8. 4 种鉴权模式

| `auth.mode` | 适用场景 | Descriptor 中填写 | 用户侧行为 |
|---|---|---|---|
| `none` | 无需凭据的公开服务 | `{ "mode": "none" }` | 直接做 MCP 连通性检查。 |
| `bearer` | 用户自行获取 Bearer Token | 凭据名称、占位、说明和帮助链接；不填 Token。 | 在 DSH 本机录入并验证。 |
| `api-key` | 指定 Header 的 API Key | `apiKeyHeader` + 凭据说明；不填 Key。 | 在 DSH 本机录入并验证。 |
| `oauth2-pkce` | 标准 OAuth 2.1/PKCE | 公开 issuer、scope、客户端名称和服务端支持的 `tokenEndpointAuthMethod`。 | 浏览器完成一键授权。 |

### `none`

```json
{ "mode": "none" }
```

### `bearer`

```json
{
  "mode": "bearer",
  "credentialName": "Access Token",
  "credentialPlaceholder": "请输入最小权限的 Token",
  "credentialDescription": "Token 仅保存在用户的 DSH 本机。",
  "credentialHelpLabel": "获取 Token"
}
```

### `api-key`

```json
{
  "mode": "api-key",
  "apiKeyHeader": "x-api-key",
  "credentialName": "API Key",
  "credentialPlaceholder": "请输入服务商签发的 API Key",
  "credentialDescription": "API Key 仅保存在用户的 DSH 本机。",
  "credentialHelpLabel": "获取 API Key"
}
```

### `oauth2-pkce`

```json
{
  "mode": "oauth2-pkce",
  "issuer": "https://auth.example.com",
  "scope": "mcp:tools",
  "clientName": "DeepSeek Harness - MCP 连接器",
  "tokenEndpointAuthMethod": "none"
}
```

动态客户端注册如果签发 Client Secret，可按服务端公开元数据填写 `client_secret_post` 或 `client_secret_basic`。Client Secret 与 Token 一样只保存在用户 DSH 本机，不进入 Registry、状态输出或日志。

OAuth 卡片必须发布可验证的 Protected Resource Metadata 与 Authorization Server Metadata，并支持 PKCE。只支持固定 Client Secret、非标准网页登录或无法完成 PKCE 的服务，不应标成 OAuth 一键授权，应使用 `bearer` 或 `api-key`。

## 9. 提交前 Checklist

- [ ] 文件名与 `id` 完全一致，`id` 和所有 `serverName` 全局唯一且稳定。
- [ ] `category` 是 9 个标准分类之一；`featured` 为 `false`。
- [ ] 公网 MCP、官网、帮助页和远程图标全部使用 HTTPS。
- [ ] Descriptor、Prompt、URL、Header、stdio `args/env/cwd` 不含 Token、API Key、密码、Cookie、Client Secret、授权码或本机专属路径。
- [ ] Header 只包含无敏感值的公开协议参数；不提交带值的 `Authorization`。
- [ ] Prompt 不含真实客户、个人信息或受限数据，不默认执行付费、写入、发布、删除或停止任务。
- [ ] 服务说明写明重要权限、费用、数据范围和副作用。
- [ ] 第三方名称和 Logo 已获得使用权，并在 PR 提供官方来源。
- [ ] stdio 命令来自官方公开包，且不要求 Registry 探针执行本地命令。
- [ ] 已运行 `npm ci --legacy-peer-deps` 和 `npm test && npm run validate && npm run assets:check`。
- [ ] 只提交 Connector 源文件和必要图片，不手动提交 `catalog.json`、`node_modules`、日志或本机配置。

## 10. 常见问题（FAQ）

### 1. 上架收费吗？

Registry 不收上架费。服务本身的订阅、调用费用和权限以服务商说明为准，并应在 Descriptor 中清楚披露。

### 2. 可以自行设置 `featured: true` 吗？

不可以。第三方首次提交保持 `false`；推荐位由维护者根据关联关系、稳定性、用户反馈和市场策略统一管理。

### 3. 合并后多久出现在市场？

合并到 `main` 后 CI 会自动重建并提交 `catalog.json`，随后自动清理和校验 jsDelivr 缓存，通常为分钟级。用户只需在 MCP连接器市场点击“刷新”。

### 4. 服务地址、鉴权方式或品牌信息变化怎么办？

提交更新 PR，修改原来的 `connectors/<id>.json`。不要通过创建新 `id` 绕过兼容性；只有产品确实成为独立连接器时才新增卡片。

### 5. 被 Registry 收录是否代表官方背书？

不代表。收录只表示目录格式兼容并通过当时的公开检查；实际服务质量、合规、费用和可用性由服务商负责。

### 6. 需要凭据的服务如何通过 CI？

公共 CI 不持有真实 Key。它会检查 Descriptor、安全约束、公开端点和可发现元数据；无凭据只能得到 401/403 时，`probeStatus` 可以保持 `unverified`，维护者再结合文档复核。

### 7. 本地 `validate` 后出现 `catalog.json` 差异怎么办？

这是确定性构建的正常结果。不要提交该差异；PR 合并后 `rebuild-catalog` job 会自动生成和提交公开产物。

### 8. 同一厂商的多个 MCP Server 能放在一张卡片吗？

可以，前提是它们属于同一产品、共享一套鉴权和用户心智。每个 Server 必须有稳定、唯一的 `serverKey` 和 `serverName`；鉴权或产品边界明显不同则拆卡。

### 9. 可以提交 stdio 或旧 SSE 连接器吗？

可以提交确需本地运行、来源官方且风险说明完整的 stdio；CI 和探针不会执行命令。Registry 不接受 `transport: "sse"`，请提供 `streamable-http` 入口。

### 10. Logo 明明能打开，为什么 `assets:check` 失败？

DSH Desktop 还需要浏览器可读取该资源。请使用正确图片 MIME 类型，并避免会被 `Cross-Origin-Resource-Policy: same-origin` 阻止的地址；无法提供兼容远程 URL 时，可在 PR 中说明来源并申请由仓库托管图片。
