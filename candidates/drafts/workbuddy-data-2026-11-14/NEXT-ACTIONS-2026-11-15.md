# 万方上架后的剩余候选推进（2026-11-15）

原始 13 项已上架 3 项：OpenBoost、克而瑞、万方。剩余 10 项（其中外贸公社用户明确暂停），飞常准属于批次外。本轮无新增正式卡片，无业务调用、注册账号、试用申请提交或付费。

用户确认：暂无亿欧、烯牛账号及试用额度；此前已确认暂无晨星、森浦授权。有赞有账号及测试店铺。没有把普通网站账号或第三方平台可用误认为 DSH 可用。

## 逐项处理清单

| 候选 | 现状 / 本轮新增核实 | 可继续推进的下一步 | 状态 |
|---|---|---|---|
| 亿欧 | 官方公告提供登录申请免费试用；用户暂无账号。公开申请页本轮返回校验脚本，未取得新的官方鉴权文档。历史匿名 4 工具，不等于业务权限 | 取得试用 Client ID/Secret；厂商确认 Header 名；开发并验收 HTTP 多凭据绑定；比较与 IT桔子的投融资增量 | DEFERRED |
| 晨星 | 官方 MCP 页面明确 Request a free trial；属于申请制，未公布当前额度/期限。现有 OAuth 草案未完成账号验收 | 用户申请 MCP 专项试用并确认允许第三方客户端；随后授权、工具发现、只读查询 | DEFERRED |
| 烯牛 | 官网提供注册/API Key；本轮访问仍 TLS EOF，经代理也失败。7 月赠送 1000 积分不能作为 11 月现行权益；用户暂无账号 | 用户注册核实当前额度；排查网络（不关闭 TLS 校验）；解决 URL query 密钥本机绑定，比较 LP/区域数据增量 | DEFERRED |
| 执中 | 官方公开前端可读，存在账号与 API Key 管理流程，但未提供免费的 MCP 配额证据。页面通用 Authorization 是网站登录使用，不能据此证明 MCP 接受 Bearer | 取得账号/商业许可；官方确认 MCP Header 替代方案，或安全实现 query 密钥绑定；只读 LP/GP 验收 | DEFERRED |
| 森浦 qeubee | 既有 X-Access-Key 草案；用户暂无授权；试用申请页本轮抓取超时，未新增免费 MCP 证据 | 厂商确认测试账号/额度和数据许可；取得 Key 后列工具与单次固收查询 | DEFERRED |
| 有赞 | 用户已有测试店铺。本轮官方 AS 仍声明 DCR、S256、youzan_query；历史 DSH 注册被拒 unsupported DCR client。主页“注册领1000算力”是有赞龙虾产品活动，不能证明外部 MCP 权益 | 厂商确认 DSH 客户端注册要求，或正式分配应用接入方式；没有新配置依据，不反复注册或改用其他客户端身份 | DEFERRED |
| 腾讯自选股 | 历史 DCR 明确只接受 WorkBuddy scheme；本轮未重放注册。普通 QQ/微信登录不能解除客户端限制 | 厂商支持 DSH loopback/正式客户端后再做授权；优先只读自选，不开提醒/模拟交易 | DEFERRED |
| 腾讯健康药箱 | 历史 401 指向的 PRM 返回 404；品牌租户数据服务，非公共医药数据源 | 厂商修复发现链、明确合作药企测试租户与授权数据范围 | DEFERRED |
| 上奇产业通 | 保留官方/平台公告线索；尚缺可核验的独立配置与许可，企业画像与 QCC 重叠 | 先明确仅产业链/区域迁移/招商的增量范围，再取得官方配置及测试权益 | DEFERRED |
| 外贸公社 | 用户确认仅采购客户可取得 MCP 账号，并明确暂不处理 | 保留历史证据，暂停申请、授权和探测；用户恢复后再继续 | DEFERRED（用户暂停） |

DEFERRED 是保留候选，不删除，也不擅自标记 PASS。本轮不更改此前评分，历史工具数量和结果不得标成新运行。

## v0.2.109 适配核实及后续开发项

读取已发布版本的 schema.js、catalog.js、index.js：credentialFields 支持输入定义，但 credentialBindings 运行时通过 bindStdioCredentials 注入环境变量，descriptorToMarket 中只保留 stdio 的 bindings。不能据此声称 HTTP 多 Header 或 secret query 已经支持。

- 亿欧：只有官方确认准确 Header 后，才能定义多字段凭据；不可把 Client Secret 写入目录或用占位字符串冒充可用配置。
- 烯牛/执中：官方公开配置含 query api_key。需在本机凭据存储后、发送请求前安全注入，并在日志、诊断、分享、备份和错误信息中脱敏；不能直接发布含 Key 的 URL。
- 后续实现需覆盖：多 Header 正确映射、缺必填项阻断、按 URL 规范编码、限定目标域名/重定向不泄漏凭据、备份/分享/日志不包含真实值，以及旧单 Key 卡片兼容。
- 以上为待开发验收要求，本轮没有修改插件代码。执中网站登录使用 Bearer 仅是网页 API 行为，尚不能消除 MCP 的鉴权缺口。

## 注册与证据链接

- 亿欧申请：https://data.iyiou.com/ai ；厂商上线说明：https://www.iyiou.com/news/202609041139916 ；厂商发布账号的同文：https://m.sohu.com/a/1071606493_115035
- 晨星 MCP 专项免费试用：https://www.morningstar.com/business/products/mcp-server （不能用 Morningstar Direct 试用替代 MCP 权益）
- 烯牛注册及 Key：https://open.xiniudata.com/ ；7 月限期活动说明：https://finance.sina.com.cn/roll/2026-07-23/doc-iniiuwta4626312.shtml
- 执中产品：https://www.zerone.com.cn/products/mcp ；账号平台：https://ai.zerone.com.cn/ 。本轮只读公开 JS：/_next/static/chunks/app/page-aa902753a53d5924.js；未请求账户或 Key API。
- 森浦申请：https://www.sumscope.com/app/apply.html （本轮超时，不据此判断停服）
- 有赞产品：https://claw.youzan.com/ ；官方 AS：https://claw.youzan.com/.well-known/oauth-authorization-server ；[历史 DSH 注册拒绝证据](evidence/youzan-dsh-oauth-preflight.md)
- 插件发布代码：https://github.com/duhu2000/dsh-mcp-connector/blob/v0.2.109/lib/schema.js 、https://github.com/duhu2000/dsh-mcp-connector/blob/v0.2.109/lib/catalog.js 、https://github.com/duhu2000/dsh-mcp-connector/blob/v0.2.109/lib/index.js

## 推荐推进顺序

账号路径：晨星 MCP 专项试用、亿欧免费试用申请、烯牛登录核对额度。当前均需用户自行提供真实注册信息；没有代填或对外发送申请。
技术路径：HTTP 多凭据/安全 query 绑定可解除亿欧、烯牛、执中的共用适配缺口，但不代替厂商许可与运行验收。有赞/腾讯自选股需厂商准入，不能靠更换用户账号解决。

准备给厂商确认的接入信息（未发送）：DSH 为第三方 MCP 客户端，使用 OAuth Authorization Code + PKCE S256、本机 loopback callback；询问是否支持 DCR，若不支持应如何正式申请 client_id、允许的回调规则、最小只读 scope、测试额度及单次查询计费。不得索取或复用其他平台客户端凭据。

## 2026-11-16 补充：上奇开始账号验收准备

用户确认已有上奇产业通账号与 MCP Key，授权推进验证。未接收、读取或保存真实 Key。候选由缺账号线索推进为等待精确接入配置。

上奇官网 https://www.chanyedata.com/ 本轮通过代理 GET 可达，页面标题为“产业可信数据空间”；网页文档抓取器返回 502，但本机公开 HTTP 读取成功，不据此判定停服。公开第三方目录仅定位到 sq-company-dynamic（企业动态追踪）服务，不能据此替代用户账号下具体服务配置或证明产业/区域工具已开通。

等待用户提供不含密钥的服务名称、MCP Server 地址及鉴权 Header 名；若 URL 包含密钥，须先替换为 <REDACTED>。需要区分上奇直连与云平台代接入。之后生成未发布验收卡片，在本机填写 Key，仅做 initialize/tools/list，再根据实际工具和费用选择一次只读业务查询。当前尚无授权连接、工具数、业务结果或上架批准；不记录为 PASS，不新增正式卡片。

用户已补充后台配置：Streamable HTTP，上奇 api.chanyedata.com 域名，Authorization 原样 API Key，无 Bearer 前缀。新增 shangqi-industry-data 未发布验收草案及脱敏匿名预检报告；initialize 返回 401 Invalid token（请求无 Key），尚无工具发现和业务调用。接下来由用户本机填写 Key，不再要求重复提供公开配置。
