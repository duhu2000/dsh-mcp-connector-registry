# 外贸公社 · 贸易数据：有限验收上架批准

审核人：DuHu。批准时间：2026-11-18T10:06:16.369336+00:00。

用户明确选择“批准有限验收上架，署名 DuHu”。本次采用既有 connection-only 路径，published=true、featured=false、probeStatus=partial；描述明确“业务查询尚未验收”。保持评分 69、watchlist、runtime=0，不为上架补造业务验收分数。

## 本次验收事实

- OAuth 授权及连接：用户在 DSH v0.2.109 确认成功。
- 工具发现：19 个工具、1 个入口；截图缓存时间 2026-11-18 15:57:52 +08:00。
- 用户报告 init_session 只调用 1 次成功；参数枚举读取 0 次、search_stats_overview 0 次。
- 阻断点：DSH 对话缺少 resource://params/enums.json 的资源读取入口，遵守停止条件，没有猜测枚举或追加请求。
- 业务验收保持 not-run。OAuth 刷新、贸易汇总、覆盖范围、单位和实际扣费均未确认。
- 本仓库只保存脱敏报告，不保存 sid、凭据或贸易明细；上述是用户验收证据，不声称助手独立重放。

## 服务使用范围与证据

- [官方开放平台](https://opens.tradesparq.com/public/) 提供海关贸易与相关统计能力。
- [官方 MCP 资源元数据](https://mcp.tradesparq.com/mcp/data-search/.well-known/oauth-protected-resource) 指向同域 OAuth 授权服务；用户已在 DSH 通过该入口授权。
- [公开通用服务条款](https://www.tradesparq.com/cn/terms) 1.2 提醒具体服务可能有附加协议，3.1.8 包含自动获取平台内容的限制。MCP 专属合同适用范围仍需跟进，不据此宣称允许网页抓取、数据再分发或转售。

目录仅发布公开端点、OAuth 配置、Logo 和使用提示，用户自备账号并按订阅授权访问；不分发厂商软件包、密钥或数据。license.status=not-applicable 仅表示没有开源软件包的分发许可证问题，**不表示服务条款不适用或完整合同审核通过**。数据用途、导出和共享仍受用户与厂商协议约束。

## 后续与发布

资源读取修复为 [插件 PR #264](https://github.com/duhu2000/dsh-mcp-connector/pull/264)。该修复与本次 partial 目录发布独立，未发布时不得宣称当前插件已能完成依赖枚举的查询。

已批准的本次验收总计最多 init_session 1 次、资源读取 1 次、汇总查询 1 次；初始化次数已消耗。原 sid 失效时停止，不自动重新初始化，不重试、不翻页、不查询联系人、不充值。有限上架不扩大费用授权。

本次 Registry 合并生成完整分类目录和近期新增文档；不需要 npm 包发布。后续真实汇总验收成功并记录证据后，再将市场状态更新为 pass。
