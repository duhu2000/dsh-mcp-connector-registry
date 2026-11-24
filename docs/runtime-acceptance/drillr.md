# drillr — 提交方验收记录（2026-11-18；2026-11-23 补充 OAuth 验收；2026-11-24 补充刷新边界、回退发现上线、Facts 回归样例）

记录人：drillr 团队（Little Grebe Inc.，提交方）。本文件是服务商自测记录，不是维护者审核结论；维护者审批与评分仍待完成。不含 Token、API Key、Cookie、授权码或个人数据。

## 1. 服务与来源

| 项目 | 内容 |
|---|---|
| 服务 | drillr 金融数据与研究 MCP |
| 端点 | `https://gateway.drillr.ai/mcp/data`（Streamable HTTP） |
| Official MCP Registry | `ai.drillr/drillr` 2.3.0，active，remote 与本卡片端点一致 |
| 官方文档 | https://drillr.ai/docs/mcp ；安装与鉴权说明 https://drillr.ai/developer/mcp-install.md |
| 官方仓库 | https://github.com/Little-Grebe-Inc/drillr-mcp-server |
| 服务条款 / 隐私 / 价格 | https://drillr.ai/legal/terms ， https://drillr.ai/legal/privacy ， https://drillr.ai/pricing |
| Logo | https://raw.githubusercontent.com/Little-Grebe-Inc/dsh-drillr/v0.1.3/assets/icon.png （厂商仓库，固定到 tag；HTTP 200、image/png、`access-control-allow-origin: *`） |

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

## 4. 经 dsh-mcp-connector 的 OAuth 运行验收（2026-11-23）

环境：macOS，DeepSeek Harness Desktop 0.2.2-rc.5，`dsh-mcp-connector` 0.2.119。卡片从提交分支的连接器描述 URL 安装（「添加连接 → 市场卡片」），连接范围为当前项目。验收期间停用了 dsh-drillr 插件，避免两个 `drillr` 服务名并存。授权账号是提交方自己的 drillr 账号。时间为 UTC，服务端证据取自 drillr 生产库的只读查询。本节不含 Token、授权码、Client ID 或账号标识。

| 环节 | 操作 | 观察结果 | 服务端证据 |
|---|---|---|---|
| 授权回调 | 点「验证并安装」，浏览器完成 drillr 登录授权 | 浏览器回调页显示「授权成功」，DSH 显示 OAuth「已连接」 | 15:34:34 动态注册客户端「DeepSeek Harness - drillr」；15:35:00 生成该账号的 OAuth 凭据（resource `/mcp/data`）和 refresh token |
| 工具发现 | 打开连接的「工具」详情 | 「10 个工具 · 1 个服务入口」，最近发现成功 15:35:01 | — |
| 只读调用 | 新会话提问「用 drillr 查一下苹果公司的股票代码」 | 回答 Apple Inc. / AAPL | 15:36:13 `ticker_lookup {"query":"Apple"}` HTTP 200 |
| 重连 | 在「已安装」停用连接（「已停用」），再启用 | 状态回到「已连接」，最近成功 15:36:51 | 15:37:07 新会话 `ticker_lookup {"query":"NVIDIA","market":"us"}` HTTP 200，返回 NVDA |
| 撤销授权 | 在 drillr.ai/account/api-keys 的 Authorized clients 撤销该客户端 | 新会话提问后，DSH 报 `HTTP 401（OAuth 凭据已过期/无效）`；连接显示「需重新授权」，鉴权 HTTP 401 | 15:39:32 凭据标记撤销；15:40:03–15:40:37 五次请求均为 401 `unauthenticated`，没有生成新凭据。网关刷新时会检查关联凭据是否已撤销，所以 refresh token 也换不出新凭据 |

验收完成后在连接器里「断开」了这条连接。

**未覆盖：access token 过期后的自动刷新。** 上表的「重连」是停用再启用连接，用的仍是同一枚未过期的 access token，不能证明 token 过期后连接器会用 refresh token 换到新凭据并继续工作。drillr 签发的 access token 有效期为 7 天，本次验收窗口内没有发生过期，也没有在 DSH 里观察到任何一次刷新请求。所以「过期驱动的刷新」这一项本次没有验证，状态是未测。已经覆盖的只有反方向：撤销授权后，refresh token 换不出新凭据（见「撤销授权」一行）。

首次点「验证并安装」时报过一次「受保护资源发现失败（HTTP 404）」，重试即成功。按 `lib/oauth.js`：连接器先发 `initialize`，从 401 的 `WWW-Authenticate` 读 `resource_metadata`；如果这一步没拿到，就回退到 `https://gateway.drillr.ai/mcp/.well-known/oauth-protected-resource/data`，而当时 drillr 没有提供这个地址，所以返回 404。同一段发现逻辑在本机终端里直接运行，走代理和不走代理都成功，首次失败应是 DSH 刚启动时的偶发情况。

**回退地址已上线（2026-11-23）。** drillr 网关已提供这个回退地址，返回的文档和 401 挑战指向的文档相同（`resource` 为 `https://gateway.drillr.ai`，`authorization_servers` 为 `https://gateway.drillr.ai`），所以连接器无论从哪条路发现，拿到的都是同一份元数据。2026-11-24T03:00Z 无凭据复查：`GET /mcp/.well-known/oauth-protected-resource/data` 返回 HTTP 200。上线之后没有在 DSH 里重做一次「挑战读取失败、走回退」的安装，因为这条路径无法稳定触发；上面的复查只证明回退地址可用。

## 5. 数据正确性：filing_search 金额倍率（回应审核意见）

11-18 披露的「Facts 丢失倍率」已在生产修复。现在每条 Fact 同时给出 `printed_value`（报表打印值）和 `value`（换算后的全额），并带 `currency`、`period_start` / `period_end`、`fiscal_period` 和出处（`accession`、页码）。Markdown 输出写成 `value (printed: … ×scale)`；倍率有冲突或报告期可疑时，会单独给出 `scale conflict`、`period check` 行。

回归核对：取 2026-11-09 至 11-23 生产上全部 `filing_search` 返回，共 1,021 条带数值的 Fact。

- 888 条的打印值和全额不同，即报表按千、百万或十亿列示，全额都按倍率换算过。例如 NVDA 2026 年委托书「total target pay」：打印 `35.5`，全额 `35,500,000` USD，期末 2026-12-31。
- 全额小于 1,000 的货币类 Fact 共 13 条，逐条核对都正确：每股股息（7203.T，90 日元）、股东总回报指数（BR，基期 100）、报表上的「—」（记为 0）。没有发现「十亿美元显示成 100.0」这类倍率丢失。

### 公开来源回归样例（2026-11-24）

下表每一行都是生产 `fact_as_reported` 里的真实记录，按 Fact ID 列出。原文都可以在 SEC EDGAR 公开打开核对，我们已逐条对照原件表格确认。「filing_search 输出」一列是把同一条记录交给生产版网关格式化代码得到的那一行。

| # | 公司 · 原文位置 | 原文打印值 | 倍率（原文表头） | 换算后 `value` | 币种 | 报告期 | filing_search 输出 |
|---|---|---|---|---|---|---|---|
| 1 | AAPL 10-K，[0000320193-25-000079](https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/aapl-20250927.htm)（2025-10-31），合并利润表「Total net sales」2024 列 | `391,035` | ×1,000,000（in millions） | 391,035,000,000 | USD | 2023-10-01 → 2024-09-28 | `value: **391,035,000,000 USD** (printed: 391,035 ×1,000,000)` |
| 2 | DOCU 10-K，[0001261333-26-000021](https://www.sec.gov/Archives/edgar/data/1261333/000126133326000021/docu-20260131.htm)（2026-03-18），合并利润表「Total revenue」 | `3,219,500` | ×1,000（in thousands） | 3,219,500,000 | USD | 2025-02-01 → 2026-01-31 | `value: **3,219,500,000 USD** (printed: 3,219,500 ×1,000)` |
| 3 | AAPL 10-K，[0000320193-24-000123](https://www.sec.gov/Archives/edgar/data/320193/000032019324000123/aapl-20240928.htm)（2024-11-01），现金及有价证券表 2023-09-30「Money market funds」行「Unrealized Losses」列 | `—`（横杠） | ×1,000,000（in millions） | 0 | USD | 时点 2023-09-30 | `value: **0 USD** (printed: —)` |
| 4 | MSFT 10-K，[0000950170-24-087843](https://www.sec.gov/Archives/edgar/data/789019/000095017024087843/msft-20240630.htm)（2024-07-30），投资表 2023-06-30「Certificates of deposit」行「Equity and Other Investments」列 | `0` | ×1,000,000（in millions） | 0 | USD | 时点 2023-06-30 | `value: **0 USD**` |

Fact ID：1 `1ef9fcfda657e027f6b88770b017a36a`，2 `39a07613b46666dd7715fe75dd3ef0e6`，3 `55625b52b69047b5ea1eb5683e793206`，4 `6002f3695ba40c183e7fc075b4eaa05a`。

**横杠、缺失与真正的 0 怎么区分：**

- **横杠（样例 3）**：SEC 报表里的「—」表示无 / 零，所以 `value` 记为 0，但 `printed_value` 原样保留 `—`，输出里写成 `(printed: —)`。
- **原文就是 0（样例 4）**：打印值本身就是 `0`，和换算值相同，输出里不再附打印值。
- 所以调用方看 `printed_value` 就能分清这两种情况。之前的摘要写的「『—』记为 0」，指的就是样例 3 这种写法。
- **原文空白**：空白单元格不生成 Fact，不会被当成 0。
- **非数值**：比如区间「3.8% – 5.6%」这类打印值，`value` 为空，区间放在 `value_low` / `value_high`。输出里直接给打印值，并注明 `(as printed; no normalized value)`，不会把它当成 0。

因此卡片不再引导用户避开 Facts，卡片描述里写明了数值同时给出打印值和换算后的全额，并标注币种和报告期。

## 6. 价格、额度与数据使用

- **价格与额度**（https://drillr.ai/pricing ）：免费账号一次性 80 额度。按次计费：`ticker_lookup`、`list_tables`、`get_table_schema` 免费；`run_sql` 和公告工具每次 0.1；`news_search` 0.2；研究信号工具 1；`company_search` 3。Plus / Ultra 为月度额度，可加购。
- **数据使用与保留**（https://drillr.ai/legal/privacy ）：查询内容、调用的端点和错误日志用于安全、计费和产品改进。使用分析不发给第三方分析服务，使用日志保留 12 个月。
- **条款**：https://drillr.ai/legal/terms 。数据按服务条款使用，不附带再分发权。卡片和 PR 原先写的 `/terms`、`/privacy` 会跳转到登录页，已改为 `/legal/*`。

## 7. 待维护者

- 候选记录的审批与评分（`review.decision`、`score`）。
- 卡片的预设 Prompt 在连接详情里显示为「暂无预设 Prompt」，卡片本身写有 4 条 `prompts`。可能和 `promptVariables` 有关，请维护者确认这是否符合预期。
