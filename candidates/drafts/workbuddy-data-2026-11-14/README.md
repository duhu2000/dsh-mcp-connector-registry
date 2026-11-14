# WorkBuddy 数据连接器分批上架准备

更新日期：2026-11-14。用户授权按批次推进；本目录不参与市场目录构建。

第一批已有两份可校验的描述符草案，均 `published=false`；对应记录的人工审核保持
`pending`、业务运行验收保持 `not-run`。这不是正式上架批准，也不沿用其他连接器的
DuHu 签名。没有读取任何账号凭据、客户数据或调用任何 `tools/call`。

## 批次与下一步

| 批次 | 项目 | 当前阶段 | 放行条件 |
|---|---|---|---|
| 1 | 晨星基金与投资研究 | 官方 OAuth 元数据、401 行为已核实；卡片草案完成 | 授权账号、DCR/PKCE/刷新流程、工具发现、一次授权只读调用、订阅条款、具名审核 |
| 1 | OpenBoost 跨境数据 | 官方 HTTP + `secret-key` 配置、匿名 MCP 握手及 104 工具发现完成；卡片草案完成 | 本机录入 Key、确认套餐与计费、一次授权只读调用、交易工具权限评审、服务条款、具名审核 |
| 2 | 万方数据 | 已定位官方开放平台与文档中心；MCP 上线有平台说明 | 补独立 MCP 端点、授权方式、检索/全文下载权益及范围；不能用开放 API 或浏览器自动化冒充官方 MCP |
| 2 | 森浦 qeubee | 官方产品归属明确；MCP 接入配置待补 | 官方端点、Header/OAuth、授权账户、固收数据范围与许可；不从终端介绍推断 MCP 配置 |
| 2 | 克而瑞·深度智联地产数据 | 厂商公告提供 `mcp.dichanai.com` 开放平台和 API Key 入口 | 补真正的 MCP 协议端点及 Header；门户内部 `/api/v1/mcp` 是管理 API 基址线索，不能据此建卡 |
| 3 | 外贸公社 Tradesparq | 待取得官方独立接入文档 | 提单/海关数据授权范围、运营主体与地域、MCP 配置及真实验收 |
| 3 | 烯牛数据 | 官方平台公开 HTTP MCP，文档使用 URL query API Key | 先解决凭据安全表达，不在目录或日志保存带 Key URL；比较与 IT桔子的 LP/基金等增量能力 |
| 3 | 执中 | 官方 MCP/CLI 产品页已定位 | 具体 MCP 配置、LP/GP/资金链路增量能力、许可及真实验收 |
| 3 | 亿欧数据 | 官方公告说明 Client ID/Client Secret | 核实实际鉴权流程，不能误标通用 API Key；优先比较产业研报/观点增量 |
| 3 | 有赞 | 店铺授权业务连接器候选 | 官方 MCP 配置、授权店铺隔离、最小权限、只读验收；不读取真实订单/会员作公开报告 |
| 4 | 腾讯自选股 | 低优先级，行情覆盖重叠 | 评估自选同步的增量；分开读取、提醒和模拟交易权限 |
| 4 | 腾讯健康药箱企业数据洞察 | 按需合作型候选 | 药企品牌租户及数据授权、独立 MCP 接入；无实际客户需求暂缓 |
| 4 | 上奇产业通 | 业务边界待评审 | 先明确产业/区域能力是否引入；工商、经营、风险画像与 QCC 重叠，不自动列入技术上架批次 |

晨星为海外品牌。其余服务的运营/签约主体、服务地域与数据覆盖分别核验；不能因为
覆盖跨境数据就把提供方标为海外，也不能仅根据中文品牌认定实际签约主体。上述第三、四批
是候选路线，不是全量收录承诺。明确排除的启信、水滴、TextIn 和暂停的国家统计局不在本批范围。

## 第一批真实探测

脱敏结果位于 `evidence/public-probe.json`，工具名称/注解/必填字段位于
`evidence/openboost-tools-summary.json`。请求经本机 HTTPS 代理完成，不能证明大陆直连可用。
仅请求公开元数据、匿名 `initialize` 和匿名 `tools/list`，没有注册 OAuth 客户端或执行登录。

晨星：

- MCP：`https://mcp.morningstar.com/mcp`，匿名 initialize 与 tools/list 均 HTTP 401。
- Protected Resource Metadata：`https://mcp.morningstar.com/.well-known/oauth-protected-resource`。
- Authorization Server Metadata：`https://mcp.morningstar.com/.well-known/oauth-authorization-server`。
- 元数据 issuer 为 `https://mcp.morningstar.com/mcp`，声明 `S256`、动态注册、刷新令牌、
  `none`/`client_secret_post`/`client_secret_basic`；这些是声明，不是授权流程验收结果。
- 元数据声明 `resource_indicators_supported=false`；需检查当前 DSH 的 resource 参数兼容性。
- 草案拟使用 `openid offline_access` 最小 scopes；需通过真实授权确认，不能据此保证准入。
- [网站通用条款](https://www.morningstar.com/company/terms-and-conditions) 不等于 MCP 商业数据许可；
  仍需核验账号的 MCP 订阅条款。record 的 license 保持 unknown。

OpenBoost：

- [官方配置页](https://openboostai.com/mcp-list) 的公开前端资源
  `https://openboostai.com/main-DLCEKYHB.js` 含 `manualHttpJson` 配置：
  `https://mcp.openboostai.com/mcp-servers/openboost-all-mcp`，Header 为 `secret-key`。
- 官方另有 SSE 与 OAuth 示例；本批仅准备 API Key + Streamable HTTP，不混用端点。
- 匿名 initialize 与 tools/list 均 HTTP 200；工具列表共 104 项，没有 nextCursor。
  匿名发现成功不代表业务数据免鉴权或免费。
- 本次 104 项均未提供 annotations，不能自动视为只读。`account_order_create` 的公开
  description 明确为按套餐下单并返回支付链接/二维码；未调用。
- 默认示例不使用下单/购买/支付、账号订单工具。Prompt 限定不是权限隔离，正式上架前须
  评审 DSH 工具治理策略，并在测试连接中禁用 `account_order_create`；工具列表更新后重新核验。
- 本机填写 Key 后，拟只读验收 `amz_keyword_research_trends`，参数
  `{"webSiteId":"1","keyword":"wireless charger"}`。须先确认套餐及调用成本；未经批准不调用。
- 官方前端组织信息标注“小数汇智”；确切签约主体、服务条款与使用范围仍待核验。

## 第二批官方证据入口

- 万方：[开放平台](https://apps.wanfangdata.com.cn/open)、
  [文档中心](https://apps.wanfangdata.com.cn/open/docs)、
  [阿里云平台发布说明](https://developer.aliyun.com/article/1761210)。
- 森浦：[官方产品](https://www.sumscope.com/app/mobile/index/senpuchanpin.html)。
  公开报道及 WorkBuddy 文案只作线索，不能代替官方配置与权限说明。
- 克而瑞：[厂商发布](https://www.haofangdp.com/fjdpbj/newslist/reviewconsultation?itemId=7503278518458578731)、
  [官方数据接口平台](https://mcp.dichanai.com/)。公开前端包含用户服务协议、积分充值及 Key 管理，
  未检出可直接使用的 `mcpServers` 配置；不把管理 API 的 Bearer 认证误当作数据 MCP Header。

## 验证与发布路径

1. 独立验证草案：
   `node scripts/build-registry.mjs candidates/drafts/workbuddy-data-2026-11-14/connectors /tmp/workbuddy-draft-catalog.json`，
   再执行 `node_modules/.bin/dsh-mcp-connector-probe /tmp/workbuddy-draft-catalog.json --validate-only`。
2. 使用专用授权账号在 DSH 本机验收。记录工具数、一次只读结果的脱敏摘要、时间和局限；
   不提交 Token、Key、Cookie、个人或客户数据。付费调用遵守用户另行批准的次数/预算。
3. 完成条款与业务边界核对后提交具名审核；再将卡片/记录迁入 `connectors/`、
   `candidates/records/`，把已验收证据链接写入正式记录。
4. 正式 PR 合并后由 CI 构建目录、刷新 CDN，再在 DSH 点击“刷新连接器目录”验收。
   当前是 Registry 资料与卡片草案，不需要发布 npm 或打插件版本 tag。

`records/*.json` 中的 registryName 是域名派生的内部候选身份，来源为 official-vendor，
不声称来自 Official MCP Registry。评分保守计入未知条款/维护情况，业务 runtime 为 0；
分数不能替代账号验收和具名批准。
