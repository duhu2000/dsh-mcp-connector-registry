# drillr — 提交方验收记录（2026-11-18）

记录人：drillr 团队（Little Grebe Inc.，提交方）。本文件是服务商自测记录，不是维护者审核结论；维护者审批与评分仍待完成。不含 Token、API Key、Cookie、授权码或个人数据。

## 1. 服务与来源

| 项目 | 内容 |
|---|---|
| 服务 | drillr 金融数据与研究 MCP |
| 端点 | `https://gateway.drillr.ai/mcp/data`（Streamable HTTP） |
| Official MCP Registry | `ai.drillr/drillr` 2.3.0，active，remote 与本卡片端点一致 |
| 官方文档 | https://drillr.ai/docs/mcp ；安装与鉴权说明 https://drillr.ai/developer/mcp-install.md |
| 官方仓库 | https://github.com/Little-Grebe-Inc/drillr-mcp-server |
| 服务条款 / 隐私 / 价格 | https://drillr.ai/terms ， https://drillr.ai/privacy ， https://drillr.ai/pricing |
| Logo | https://raw.githubusercontent.com/Little-Grebe-Inc/dsh-drillr/v0.1.1/assets/icon.png （厂商仓库，固定到 tag；HTTP 200、image/png、`access-control-allow-origin: *`） |

## 2. 公开协议与 OAuth 检查（2026-11-18T12:50Z，无凭据）

| 检查 | 结果 |
|---|---|
| 无凭据 `initialize` | HTTP 401，`WWW-Authenticate: Bearer resource_metadata="https://gateway.drillr.ai/.well-known/oauth-protected-resource"` |
| Protected Resource Metadata | `/.well-known/oauth-protected-resource/mcp/data`：resource `https://gateway.drillr.ai/mcp/data`，authorization_servers `https://gateway.drillr.ai` |
| Authorization Server Metadata | issuer `https://gateway.drillr.ai`；authorize `/oauth/authorize`，token `/oauth/token`，动态注册 `/oauth/register`；PKCE `S256`；`token_endpoint_auth_methods_supported: none`；grant `authorization_code`、`refresh_token` |
| 工具注解 | 10 个工具均声明 `readOnlyHint: true`、`destructiveHint: false` |

OAuth 没有自定义 scope，卡片因此不填 `scope`。

## 3. DSH Desktop 真实调用

环境：macOS，DeepSeek Harness Desktop 0.2.2-rc.2（内置 `@deepseek-ai/dsh-mcp-client` 0.2.2-rc.3）。连接方式：drillr 官方 DSH 插件 [dsh-drillr](https://github.com/Little-Grebe-Inc/dsh-drillr) 0.1.1，它用官方 `dsh-mcp-client` 连同一端点，鉴权为 drillr 账号 API key（Bearer，存于本机 DSH 凭据库）。**这一节不是经 `dsh-mcp-connector` 的 OAuth 路径**，见第 4 节。

会话 A（2026-11-18T08:00:51Z–08:01:39Z）：提问「看下 apple 的股票」，16 次 `mcp__drillr__*` 调用，14 次成功。

| 工具 | 非敏感参数 | 观察结果 |
|---|---|---|
| `ticker_lookup` | `{"query":"Apple","market":"us"}` | Apple Inc. / AAPL |
| `get_table_schema` | `price_volume_history`、`company_snapshot`、`analyst_ratings_consensus` | 返回字段与覆盖说明 |
| `run_sql` | AAPL 日线、周线、公司快照、分析师一致预期、财报 | 返回结构化行 |
| `news_search` | `{"ticker":"AAPL","since":"2026-10-15",...}` | 返回新闻故事与事件 |

2 次失败为模型自写 SQL 用了不存在的列（`period_end`、`statement_type`），服务端以工具错误返回该表结构提示，模型改写后成功；不是鉴权、额度或服务错误。

会话 B（2026-11-18T08:58:03Z–08:58:20Z）：提问「查询 NVDA 的股价和最近的事件」，12 次调用，8 次成功（`news_search`、`run_sql`、`filing_search` 等）；4 次失败同为模型自写 SQL 列名错误并获得结构提示。

另于 2026-11-18T12:49Z 用同一本机凭据直接调用一次 `tools/call ticker_lookup {"query":"Apple","market":"us"}`：HTTP 200，结果 Apple Inc. / AAPL。

## 4. 未完成项

- **经 `dsh-mcp-connector` 的 OAuth 连接**（授权回调、工具发现、只读调用、重连、撤销授权）尚未执行。完成后补充本节并更新候选记录；此前卡片保持 `published: false`。
- 已知数据问题：`filing_search` 的 `## Facts` 部分在部分样本中只显示报表打印值、丢失倍率（例如应为十亿美元的金额显示为 `100.0 currency USD`），修复进行中。卡片示例因此改为引用 `## Passages` 原文段落，不引导读取 Facts 数值。
- 公开股票工具（代码解析、公告）核心覆盖美股、日股、A 股；港股、韩股不在公开范围内。
