# FlyBest 酒店 MCP：OAuth 运行验收

验收日期：2026-09-30。审核人：`DuHu`。候选描述提交：`500c5b0`。

## 公开来源与协议预检

- Official MCP Registry 的 [`org.flybest/travel-hotels` 1.0.1](https://registry.modelcontextprotocol.io/v0.1/servers/org.flybest%2Ftravel-hotels/versions/1.0.1) 状态为 `active`，远程 Streamable HTTP 端点为 `https://ai.flybest.org/mcp`。
- 无凭据 `initialize` 返回预期的 HTTP 401 OAuth challenge；Protected Resource Metadata 与 Authorization Server Metadata 可读取。授权服务器公开动态客户端注册、Authorization Code、Refresh Token、public client (`none`) 与 PKCE S256，scope 为 `mcp`。
- [服务条款](https://ai.flybest.org/terms)和[隐私政策](https://ai.flybest.org/privacy)均显示 `Version 2026-09-29. Effective 2026-09-29.`，不再标记为草案。条款页面列出 Coastline Travel Advisors 的 CST 2040360-40 与 ARC 05582905。

## DSH OAuth 与工具发现

- 在 DSH 本机 Web/Desktop 同源运行环境、MCP 连接器 v0.2.62 中安装 PR 候选市场卡片。安装流程完成 DCR + PKCE 授权，并于 `2026-09-30T04:07:15.805Z` 写入新的本机授权记录。
- 脱敏核验结果：issuer 为 `https://ai.flybest.org`，scope 为 `mcp`，`token_endpoint_auth_method` 为 `none`，授权资源为 `https://ai.flybest.org/mcp`；Access Token 与 Refresh Token 均存在。没有记录账号、邮箱、验证码、Client ID、Token 或授权 URL 参数。
- `initialize` 与 `tools/list` 成功；协议会话发现 1 个 Server、8 个工具。
- 直接读取原始 `tools/list` 的 annotations 后确认：

| 工具 | readOnly | destructive | idempotent | openWorld |
| --- | --- | --- | --- | --- |
| `sabre_hotel_search` | true | false | true | true |
| `sabre_hotel_content` | true | false | true | true |
| `sabre_hotel_rates_coded` | true | false | true | true |
| `sabre_hotel_card_link` | false | false | false | true |
| `sabre_currency_convert` | true | false | true | false |
| `my_trips` | true | false | true | false |
| `my_trip` | true | false | true | false |
| `cancel_my_trip` | false | true | true | true |

MCP annotations 只是服务端提示，不是免审批的信任边界。付款页与取消工具仍应视为有副作用操作。

## 最小只读调用

1. `sabre_hotel_search`
   - 输入：`location=Kyoto`、`check_in=2026-11-12`、`check_out=2026-11-15`、`adults=2`。
   - 结果：成功返回京都 48 家候选酒店，界面展示前 40 家，其中 12 家标记可提供顾问合作礼遇。
2. `sabre_hotel_content`
   - 输入：公开搜索结果中的 `hotel_code=605327`，`image_size=thumb`。
   - 结果：成功返回 Six Senses Kyoto 的名称、地址、15:00 入住时间与 12:00 退房时间。

首次使用目录示例 Prompt 时，Agent 在搜索成功后曾计划追加批量房价查询；维护者立即停止该轮，后续调用未形成成功结果。随后使用严格限定的独立会话只调用一次 `sabre_hotel_content` 并成功完成。本次验收没有调用 `sabre_hotel_card_link`、`my_trips`、`my_trip` 或 `cancel_my_trip`。

## 结论与边界

OAuth、初始化、8 个工具发现、annotations 核验和两项只读业务调用通过。没有生成付款页、没有提交旅客资料或支付资料、没有创建预订、没有查询真实订单、没有取消订单。目录卡片已经披露付款页生成和取消操作的副作用，以及服务由 FlyBest 提供且目录收录不构成背书；本次验收批准该候选进入公共目录。
