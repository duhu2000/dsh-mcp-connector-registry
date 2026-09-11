# 插件市场 OAuth MCP 候选复核（第 1 轮）

复核日期：2026-09-11

## 范围与边界

本轮从 DSH 插件市场中检索 MCP、OAuth、PKCE、授权、登录和 Token 等线索，
再按 Connector Registry 的收录边界复核。插件包本身不是 Connector；只有能被通用
MCP 客户端独立启动或连接的 Server，才能进入市场候选。

本轮没有读取、写入或发送任何用户 Token，也没有调用任何会产生业务副作用的工具。

## 结论摘要

| 项目 | 结论 | 当前动作 |
|---|---|---|
| GitHub 官方远程 MCP | 远程端点同时接受 OAuth 获得的 Access Token 和 PAT，但当前 Registry Schema/UI 只能声明一个 `auth.mode`；DSH 通用 OAuth 客户端还强制要求 DCR，而 GitHub 明确不支持 DCR | 保留现有 PAT 卡片；将“静态 OAuth App/GitHub App 客户端 + PKCE”与“多授权选项”作为连接器插件后续能力 |
| SHOPLINE Developer MCP | 官方 npm 包可以本地 stdio 启动，免鉴权；`initialize` 和 `tools/list` 已通过 | 进入候选池，分类为“开发工具”，不标记 OAuth |
| AtomGit 托管 MCP | 端点从当前网络可达，但 MCP 层使用 Bearer PAT，不是可发现的 MCP OAuth | 进入待鉴权验收队列；需专用最小权限 PAT 后才能完成 `tools/list` 和只读工具验收 |
| TextIn xParse | 用户确认为竞品；且当前形态是 DSH Tool + CLI，不是独立 MCP Server | 明确排除，不进入市场 |

## P0：GitHub OAuth + PAT 双入口验证

### 现状

- Registry 中已有 `github` Connector，连接 `https://api.githubcopilot.com/mcp/`，当前声明 `auth.mode: bearer`。
- 无凭据 `initialize` 返回 HTTP 401，并通过 `WWW-Authenticate` 提供
  `https://api.githubcopilot.com/.well-known/oauth-protected-resource/mcp/`。
- Protected Resource Metadata 声明的授权服务器为 `https://github.com/login/oauth`，
  Bearer Token 仅通过 Header 传递。
- GitHub 官方文档说明：远程 MCP 本身不负责注册 OAuth 客户端，宿主需事先配置
  GitHub App 或 OAuth App，且当前不支持 Dynamic Client Registration。
- DSH 当前的 `oauth2-pkce` 路径依赖 RFC 8414 元数据与 DCR；对
  `https://github.com/login/oauth/.well-known/oauth-authorization-server` 的实测返回 HTTP 404。

### 结论

GitHub 服务端在概念上支持“OAuth Token 或 PAT”，但当前 `dsh-mcp-connector`
不能直接把同一张卡片表达成可选双授权入口，也无法使用现有 DCR 流程完成 GitHub
远程 OAuth。本轮验证结论为“有条件支持，当前客户端阻塞”。

在下列能力实现前，不修改现有 `github` 卡片的 PAT 默认入口：

1. Descriptor 与 UI 支持同一 Connector 的多个授权选项；
2. OAuth 客户端支持预注册 `client_id` 与安全存储的 `client_secret`，不强制 DCR；
3. 支持 GitHub App/OAuth App 的回调、组织准入提示、Token 刷新/失效和 PAT 回退回归测试。

## P1：SHOPLINE Developer MCP 候选记录

| 字段 | 已核验值 |
|---|---|
| 候选 ID | `shopline-developer-mcp` |
| 名称 | SHOPLINE Developer MCP |
| 厂商 | SHOPLINE |
| 建议分类 | `开发工具` |
| 包 | `@shoplineos/shopline-developer-mcp@1.1.0` |
| 启动方式 | `npx -y @shoplineos/shopline-developer-mcp@1.1.0` |
| 传输 | `stdio` |
| 鉴权 | `none` |
| 许可证 | MIT（npm 元数据） |
| 包维护者 | `shopline-developer <developer@shopline.com>` |
| 上游文档 | https://developer.shopline.com/docs/apps/development-tool/shopline-developer-mcp/ |

### 无凭据 stdio 预检

- `initialize`：通过；Server `shopline-developer-mcp` `1.1.0`，协议版本 `2025-06-18`。
- `tools/list`：通过；共 9 个工具：
  `search_shopline_docs`、`read_full_docs`、`get_rest_api_definition`、
  `search_admin_rest_endpoints`、`get_admin_rest_endpoint_detail`、
  `get_graphql_schema`、`validate_graphql_codes`、`shopline_mcp_feedback`、
  `shopline_readme`。
- 本轮未调用任何业务工具。

### 安全复核项

- 工具描述包含“必须先调用某工具”类行为指令，客户端应将服务端工具描述视为不可信元数据，
  不应覆盖用户意图或宿主安全规则。
- `shopline_mcp_feedback` 可向第三方提交反馈；市场卡片必须说明只有在用户明确同意后才可调用。
- 其他工具主要检索和读取 SHOPLINE 开发文档/API Schema；正式卡片 Prompt 应默认限定为只读。
- 正式上架前还需确认软件包与官方文档中的版本固定策略，并完成人工批准。

## P1：AtomGit 托管 MCP 预检

| 字段 | 已核验值 |
|---|---|
| 候选 ID | `atomgit` |
| 名称 | AtomGit |
| 建议分类 | `开发工具` |
| 端点 | `https://api.atomgit.com/mcp-server/v1/mcp` |
| 传输 | `streamable-http` |
| MCP 层鉴权 | `bearer` PAT |
| 预期能力 | 仓库、分支、Issue、Pull Request 和搜索 |

### 无凭据与可达性预检

- 从当前运行环境解析和连接成功，HTTPS 握手约 0.11 秒，完整请求约 0.14 秒。
- 无凭据 `initialize` 返回 HTTP 401：`missing Authorization header`。
- 响应未提供 `WWW-Authenticate` 中的 `resource_metadata`，因此不能按 MCP OAuth 发现流程一键授权。
- 未使用真实 PAT，因此本轮无法继续执行 `tools/list`。

### PAT 验收边界

AtomGit 公开 API 文档支持在 `Authorization: Bearer <PAT>` 中传递个人访问令牌。
正式验收需用专用测试账号创建最小权限 PAT，首先只允许读取公开仓库；不使用日常账号的广权限 Token。
验收顺序为：

1. `initialize`；
2. `notifications/initialized`；
3. `tools/list`，记录工具数量、读写注解和参数 Schema，不保存私有数据；
4. 仅选择明确声明只读的公开仓库查询工具；
5. 确认无写入权限时写操作被服务端拒绝，但不实际提交 Issue、PR、合并或修改代码。

AtomGit 在插件市场的集成资料来自社区仓库；正式上架还需服务商官方 MCP 文档或可验证的官方归属证据。

## 明确排除

| 项目 | 排除原因 |
|---|---|
| `dsh-qixin-insight-mcp-oauth` | 用户确认为企业数据竞品，不收录、不合并、不以其端点生成 Connector。 |
| `dsh-plugin-xparse` / TextIn xParse | 用户确认为文档解析竞品，不收录、不合并、不以其 OAuth/AppKey 或 CLI 生成 Connector。 |

