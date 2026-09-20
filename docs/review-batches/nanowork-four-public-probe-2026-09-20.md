# 纳米 Work 对标候选：四个 MCP 无凭据协议探测

探测日期：2026-09-20（UTC 08:32 左右）

## 范围与方法

- 目标：金数据、快递100、Trello、Atlassian Rovo MCP 四个服务商公开的 MCP 端点。
- 使用 Registry 的 `scripts/discovery/public-probe.mjs`，对固定 HTTPS URL 发送无凭据的 MCP `initialize`；不跟随重定向，不携带 Token、Cookie 或 API Key。
- 对返回 401 的端点，仅读取响应中的 `WWW-Authenticate`、受保护资源元数据与授权服务器元数据；未执行动态客户端注册或打开授权页面。
- 对快递100额外发送一次无凭据 `tools/list`，只记录工具名；未执行 `tools/call` 或任何业务查询。
- 初次在本地沙箱中执行时，四个域名均因沙箱 DNS 隔离而返回 `ENOTFOUND`；下表为获准联网后的重跑结果，不能把沙箱错误当作服务故障。

## 结果

| 候选 | 官方端点 | `initialize` | 公开发现结果 | 结论 |
|---|---|---|---|---|
| 金数据 | `https://jinshuju.net/mcp` | HTTP 401 | `WWW-Authenticate` 指向 `https://jinshuju.net/.well-known/oauth-protected-resource`；资源和授权服务器元数据均为 HTTP 200，公布 PKCE S256 与动态客户端注册端点 | `partial`：协议与 OAuth 发现链路可识别；未授权调用尚未验收 |
| 快递100 | `https://api.kuaidi100.com/mcp/streamable`（无 `key` Query） | HTTP 200；JSON-RPC `result`，协议版本 `2025-06-18`，Server 名 `kuaidi100-mcp` | 无凭据 `tools/list` 返回 HTTP 200、5 个工具 | `pass` **仅指无凭据协议握手和工具枚举**；未验证业务 API 可用性 |
| Trello | `https://mcp.trello.com/v1` | HTTP 401 | `WWW-Authenticate` 指向 `https://mcp.trello.com/.well-known/oauth-protected-resource/v1`；资源元数据与 Atlassian 授权服务器元数据均为 HTTP 200，公布 PKCE S256 与动态客户端注册端点 | `partial`：协议与 OAuth 发现链路可识别；未授权调用尚未验收 |
| Atlassian Rovo | `https://mcp.atlassian.com/v2/mcp` | HTTP 401 | `WWW-Authenticate` 指向 `https://mcp.atlassian.com/.well-known/oauth-protected-resource/v2/mcp`；资源元数据与 Atlassian 授权服务器元数据均为 HTTP 200，公布 PKCE S256 与动态客户端注册端点 | `partial`：协议与 OAuth 发现链路可识别；未授权调用尚未验收 |

快递100无凭据发现的 5 个工具为 `query_trace`、`estimate_time`、`estimate_price`、`estimate_time_with_logistic`、`auto_number`。工具枚举不证明这些工具无需 API Key，也不证明调用不会计费。

## 安全和上架边界

1. 金数据、Trello 和 Atlassian Rovo 的 HTTP 401 是预期鉴权挑战，不是连接失败；本轮没有登录，因此不能宣称 OAuth 授权成功或工具可用。后续需以专用测试账号完成真实授权、`tools/list` 和最小只读调用，并审查写入、删除权限。
2. 快递100官方远程配置将 API Key 放在 URL Query 中。即使匿名 `initialize` 和 `tools/list` 可用，也**不应**为公共卡片把 Key 写入 URL；优先评估官方 `uvx kuaidi100-mcp` 或 `npx @kuaidi100-mcp/kuaidi100-mcp-server` 的 stdio 方式，通过环境变量 `KUAIDI100_API_KEY` 注入凭据。尚未执行本地 stdio 包或业务调用。
3. Trello 与 Atlassian Rovo 共用 Atlassian 授权服务器，但资源 URL 和权限范围不同，应分别验证。Atlassian Rovo v2 采用按需发现工具的机制，授权后的 `tools/list` 可能只返回主工具，不能仅凭数量判断缺失。
4. 本轮是候选协议预检，**不是上架批准**。未创建 Connector、未提交凭据、未调用业务工具，也未验证 DSH Web/Desktop 的完整授权和实际使用。

## 官方依据

- [金数据 MCP 与 OAuth 协议](https://open.jinshuju.net/mcp/oauth/)
- [快递100 MCP 配置](https://api.kuaidi100.com/document/how-to-use-mcp-service)
- [Trello 官方 MCP](https://trello.com/mcp)
- [Atlassian Rovo MCP v2 接入指南](https://developer.atlassian.com/cloud/rovo-mcp/guides/getting-started/)
