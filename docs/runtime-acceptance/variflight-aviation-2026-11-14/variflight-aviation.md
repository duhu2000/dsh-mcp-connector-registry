# 飞常准 Aviation MCP 分阶段运行验收

- 检查时间：2026-11-14T08:28:49.789Z
- 检查人：`codex-preflight`
- Official Registry：`io.github.variflight/variflight-mcp@1.1.0`
- npm：`@variflight-ai/variflight-mcp@1.1.0`
- 远程端点：`https://ai.variflight.com/servers/aviation/mcp`
- 结论：**partial**

## 无凭据远程探测

- Protected Resource Metadata：HTTP 200。
- Authorization Server Metadata：HTTP 200。
- 宣告能力：Dynamic Client Registration、OAuth 授权码、refresh token、PKCE S256、
  `none` 与 `client_secret_post` token endpoint auth。
- 匿名 `initialize`：HTTP 401，`WWW-Authenticate` 指向规范化的资源元数据 URL。
- 未携带 Authorization、API Key、Cookie 或任何个人数据。

## 固定版本 stdio 预检

- MCP 协议：`2025-06-18`
- 服务器：`variflight-mcp 1.1.0`
- `initialize`：通过。
- `tools/list`：通过，共 9 个工具。
- stderr：0 bytes。
- 非协议 stdout：0 bytes。
- `tools/call`：未执行。

工具名：

1. `searchFlightsByDepArr`
2. `searchFlightsByNumber`
3. `getFlightTransferInfo`
4. `flightHappinessIndex`
5. `getRealtimeLocationByAnum`
6. `getTodayDate`
7. `getFutureWeatherByAirport`
8. `searchFlightItineraries`
9. `getFlightPriceByCities`

## 安全与残余问题

- npm 包工具未宣告 `readOnlyHint=true`，因此现有自动验收器不会执行其中任何工具。
- 该包只把 API Key 放在 `X-VARIFLIGHT-KEY` 请求头，错误消息不包含请求头或 Key；
  本次未传入 Key，也未保留原始工具描述。
- npm 元数据声明 ISC，但官方 GitHub 仓库 API 未检出许可证，仓库根目录也未见
  LICENSE 文件。拟上架卡片使用远程服务，受飞常准平台服务条款约束，ISC 仅用于
  说明可选 stdio 包。
- 每次业务工具调用可产生费用。在没有用户对测试账号和最小付费调用的明确确认前，
  不执行业务 `tools/call`。

该报告不保留 OAuth 令牌、API Key、会话标识、原始航班结果或用户行程。

## DSH Web API Key 真实验收补充（2026-11-14）

- 环境：Chrome，DSH 本机 Web，MCP连接器 v0.2.106。
- 凭据由用户自行输入；本次助手未读取或复制凭据。
- 初次 401 原因：手动表单选择“无鉴权”；改用 API Key 后用户确认连接成功。
- 助手复核：17:43:21 可用性检查通过；17:47:23 工具缓存成功，共 9 个工具，
  工具名称与上文固定版本 stdio 清单一致。以上时间均为 Asia/Shanghai。
- 后续打开工具详情出现一次实时读取 timeout，页面回退到成功缓存；不能因此
  宣称持续可用或把超时归因于 Key 失效。
- 18:04 创建独立 DSH 免费验收对话，仅请求调用一次 getTodayDate，参数 {}。
- 18:05 展开实际工具调用行，确认输入 {}、输出
  `Today's date: 2026-11-14`；该轮共 1 次工具调用，页面显示工具耗时 0.5 秒。
- 免费工具运行：PASS；API Key 鉴权与工具发现：PASS（另有一次超时需跟踪）。
- 未调用航班、天气、价格或任何其他收费工具；未进行 OAuth 用户授权。
- 总体仍为 partial / DEFERRED：等待业务数据只读验收、稳定性复核、
  API Key 卡片表单验收及本批次具名人工批准，不自动上架。
- 用户随后明确选择“暂不调用付费工具”。本轮到此结束，不执行拟议的
  PEK 机场天气查询，不把免费日期工具成功等同于航空业务数据验收。
