# 有赞、森浦、亿欧及其余候选推进

更新：2026-11-14（北京时间）。本轮新增 2 张 unpublished 描述符、3 份候选记录。
本批累计 5 张描述符、8 份候选记录；本地安装草案用于验收不等于公共市场上架。

| 候选 | 提供方/属性 | 新证据 | 状态与下一步 |
|---|---|---|---|
| 有赞店铺经营数据 | 有赞，国内服务 | 官方域名 401 challenge、资源及授权服务器元数据齐全；S256/DCR/refresh_token，scope=youzan_query | DEFERRED：OAuth 卡片完成；用户已有测试店铺，但本机 DCR 返回 unsupported DCR client；需厂商确认注册规则，再做授权/工具发现与只读验收 |
| 森浦 qeubee 固收数据 | 森浦，国内服务 | 服务明确返回 missing X-Access-Key；官方资源元数据确认 MCP 地址；另有 OAuth 元数据 | DEFERRED：API Key 卡片完成；需最小权限账号、真实工具发现与只读查询。OAuth 尚未实测，不能因元数据存在宣布双入口均可用 |
| 亿欧产业投融资数据 | 亿欧，国内服务 | 匿名 initialize/tools/list 成功，4 个工具，serverInfo=mcp-iyiou-adapter 1.0.0 | DEFERRED：正式候选草案记录完成；双 Header 仍为第三方配置线索，先获厂商确认并解决客户端绑定 |
| 外贸公社 Tradesparq | 外贸公社，国内服务商；数据覆盖海外 | 官方开放平台可确认海关/贸易 API 与趋势、地区分析，尚无独立 MCP 配置证据 | DEFERRED：补官方 MCP URL、鉴权、额度及数据许可，不能把 REST API 当 MCP |
| 万方 | 万方数据，国内服务 | 本轮未补出可独立验证的 MCP URL；已有 AI HUB/API Skill 不等同 MCP | DEFERRED：继续官方接入文档核验 |
| 腾讯健康药箱、腾讯自选股、上奇 | 国内服务候选 | 维持前轮业务边界及公开资料状态 | 按需：合作药企租户、提醒/交易权限、产业增量分别评审，未晋级 |

## 一手证据与目录线索分开

搜索定位到第三方 WorkBuddy 文件镜像，只用于发现公开地址。未安装/执行其代码，未复制技能正文。
其中有赞和森浦已用服务本身的官方域名响应交叉核验；亿欧只验证了协议和工具发现，
不能由匿名可列工具推断无需凭据或免费业务查询。

线索索引：
https://github.com/ahang1598/doubao-workbuddy-qwenwork-skills/tree/main/workbuddy/connectors/marketplace/connectors

- 有赞：`youzan-workbuddy/mcp.json` 给出 `/mcp/sse/v1`。路径有 sse 字样，但配置和 POST 行为采用 Streamable HTTP；不改成猜测的 `/mcp`。
- 森浦：`sumscope-data/mcp.json` 给出 X-Access-Key。其 token 表单文字写作 X_ACCESS_KEY，这是表单变量名；服务实际 401 明确要求 **X-Access-Key**，卡片使用横线形式。
- 亿欧：`iyiou-connector/mcp.json` 显示 X-Client-Id、X-Client-Secret，两项都须保密；厂商公告只证实 Client ID/Secret，未独立确认 Header 规则。未将它们写进公开 headers，未创建假 OAuth 或单 API Key 描述符。

正式证据：

- [有赞官方产品](https://claw.youzan.com/)
- [有赞资源元数据](https://claw.youzan.com/.well-known/oauth-protected-resource)
- [有赞授权元数据](https://claw.youzan.com/.well-known/oauth-authorization-server)
- [森浦产品](https://www.sumscope.com/app/mobile/index/senpuchanpin.html)、[接入联系入口](https://www.sumscope.com/app/apply.html)
- [森浦资源元数据](https://data-api.qeubee.cn/.well-known/oauth-protected-resource)
- [森浦授权元数据](https://auth.qeubee.cn/.well-known/oauth-authorization-server)
- [亿欧官方上线说明](https://www.iyiou.com/news/202609041139916)、协议实测 `https://mcp.iyiou.com/data`
- [外贸公社官方开放平台](https://opens.tradesparq.com/public/)
- [有赞开放文档索引](https://doc.youzanyun.com/llms.txt)：开放 API/SDK 文档不能直接替代 MCP 授权证据。

## 鉴权和验收边界

有赞元数据声明公开客户端、DCR、S256 和刷新令牌；初期只读取这些声明；随后本机授权在 DCR 阶段失败，见 [有赞预检](evidence/youzan-dsh-oauth-preflight.md)，未完成登录或授权。
`youzan_query` 不能单独证明所有工具都是只读，必须在授权后审阅工具清单和权限。
用户确认有有赞账号及测试店铺；仅准备 OAuth、连接与工具发现，不查询订单、会员或修改店铺。

森浦 OAuth 公布 read/write/offline_access；当前草案选择有服务错误证据支持的 X-Access-Key 路径，
不申请 write scope，也不把 API Key 当 Bearer Token。工具数和真实业务运行时间保持未知。

亿欧实测 4 个工具：search_companies、query_company_invest_events、batch_query_company_invest_events、
filter_invest_events。均未提供 annotations，不能据此确认只读性或计费。
当前仓库描述符约定仅有一个 HTTP apiKeyHeader；credentialBindings 用于 stdio 环境变量。
随仓校验依赖的 mcp-provision.js 也仅映射单项 HTTP Key。
双 Header 能否通过最新版客户端安全绑定须单独核对；不以静态公开 Header 或自制代理规避。
与 IT桔子已有投融资能力存在重叠，补充价值要基于字段、覆盖、更新时效和许可比较。

外贸公社拟卡片文案：在账户许可范围内查询商品/HS 编码相关贸易统计与趋势，用于市场和供应链分析；
保留国家、时间、单位和覆盖限制，不将局部提单样本等同全量海关数据。先拿官方 MCP 配置再生成可安装卡片。
具体示例：查询 2025 年美国 HS 8504 相关进口月度趋势，先核实支持的 HS 位数、国家覆盖和单位，
只返回汇总统计及来源，不导出个人联系方式；如无此覆盖直接说明。

所有草案均 published=false、review=pending、runtimeAcceptance=not-run。没有执行 tools/call 或付费业务查询。
匿名证据见 [协议摘要](evidence/remaining-batch-public-probe.json)、[OAuth 元数据快照](evidence/youzan-sumscope-oauth-metadata.json)。
请求经本机代理，不代表大陆直连；不保留 Cookie、会话 ID、凭据或客户数据。
