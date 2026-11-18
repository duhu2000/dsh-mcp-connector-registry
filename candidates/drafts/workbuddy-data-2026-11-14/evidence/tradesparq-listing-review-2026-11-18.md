# 外贸公社 · 贸易数据：上架待审材料

## 拟上架内容

名称：外贸公社 · 贸易数据。提供方：外贸公社 Tradesparq（国内服务商，数据覆盖全球）。分类：调研分析。简介：海关贸易 / 进出口趋势 / 供应链研究。使用用户提供的红色 Logo，OAuth 2.0 PKCE，商业订阅服务。

拟采用现有 connection-only 上架路径：正式卡片 published=true、featured=false、probeStatus=partial；首句明确“业务查询尚未验收”。当前交付仍是 published=false 草案，审核 pending，未宣称人工批准。

## 已取得证据与边界

- 用户确认 OAuth 授权成功；DSH v0.2.109 截图显示已连接、19 个工具、1 个服务入口，缓存时间 2026-11-18 15:57:52 +08:00。
- 用户按已加载描述整理了 19 个工具；所有工具计费未知，没有按缺少计费字段推断免费。
- 用户报告 init_session 实际调用 1 次成功；resources/read 为 0 次，search_stats_overview 为 0 次。因为当前对话没有资源读取工具，按停止条件终止。
- 本记录未独立重放真实账号调用，不包含 sid、Token、客户数据或原始贸易明细。
- 资源读取修复：https://github.com/duhu2000/dsh-mcp-connector/pull/264 。读取所需 URI 为 resource://params/enums.json；不能用 HTTP 地址代替或猜测枚举。
- 还未验证贸易业务结果、OAuth 刷新、覆盖范围、统计单位及实际扣费。

## 服务依据

公开产品页面：https://opens.tradesparq.com/public/ 。官方 MCP 资源及授权元数据使用 mcp.tradesparq.com，同域公开 OAuth 端点，用户已在 DSH 完成授权。

公开通用条款：https://www.tradesparq.com/cn/terms 。条款 1.2 提醒具体服务可能需要附加条款；3.1.8 涉及自动获取平台内容的限制。现有证据不构成完整 MCP 合同、数据导出或再分发权核验通过。本卡片只指向厂商 MCP 服务，由用户自行授权；不分发软件包、账号、商业数据，不提供网页抓取或绕过订阅能力。后续如使用 not-applicable 许可证标记，只表示未分发开源软件包，不能表示服务条款不适用。

## 待确认决策

仓库 scripts/check-new-connectors.mjs 的 connection-only 路径要求具体候选的具名批准与连接证据。建议由 DuHu 明确批准“仅连接及工具发现已验收”的 partial 上架范围；不将会话初始化替代贸易业务验收，不将其他候选的批准复用于本候选。

若选择完整 PASS 路径，先发布资源读取修复、读取真实枚举并执行尚未消耗的单次汇总验收；原业务 sid 失效时停止，不能自动再次 init_session。

本材料不会增加已批准的收费调用次数，也不会自行生成 approved 信息。
