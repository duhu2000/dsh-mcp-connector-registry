# 飞常准 Aviation MCP 上架评估（2026-11-14）

## 建议

**DuHu 已于 2026-11-14 批准有限验收上架，正式卡片保留 partial。**

飞常准已满足官方来源、市场缺口、标准远程 OAuth、服务条款和固定版本软件许可
元数据的要求，且无凭据协议探测与 stdio 工具发现已通过。随后已完成 DSH Web
API Key 连接、远程 9 个工具发现及免费日期工具真实调用。用户已明确批准
上述有限范围，审核人 DuHu；收费业务查询仍未执行，不宣称已验证业务数据。

## 已核验证据

- 官方产品文档：<https://mcp.variflight.com/docs/aviation>
- 官方服务条款：<https://mcp.variflight.com/terms>
- 官方仓库：<https://github.com/variflight/variflight-mcp>
- Official MCP Registry：`io.github.variflight/variflight-mcp@1.1.0`
- npm：<https://www.npmjs.com/package/@variflight-ai/variflight-mcp/v/1.1.0>
- 远程 MCP：`https://ai.variflight.com/servers/aviation/mcp`
- OAuth PRM：`https://ai.variflight.com/.well-known/oauth-protected-resource/servers/aviation/mcp`
- OAuth AS Metadata：`https://ai.variflight.com/.well-known/oauth-authorization-server`

## 去重与卡片设计

上架前 `connectors/` 无飞常准、VariFlight 或同等国内官方航空数据卡片，去重级别为
`none`。根据用户实际连通路径，正式卡片采用官方远程 API Key 端点与
`X-API-Key` Header；不同时混合 OAuth 和 stdio，因为当前 Connector Descriptor
的 `auth` 是卡片级单一模式。

卡片提示词会在付费查询前要求用户确认，不默认连续翻页，也不访问个人行程；
首条示例只调用免费的日期工具。

## 上架后仍待跟踪

- 一次工具发现超时后的稳定性复核及工具注解复核。
- 最小付费只读调用（需用户确认测试费用）。
- 正式 API Key 卡片表单的发布后验证。
- 具名人工批准已完成（DuHu），详见正式候选记录与运行报告。

本次正式卡片与具名记录进入 Registry；合并后 CI 重建公开目录并清理 CDN，
无需插件 tag/npm 发版。后续业务验证不作为本次有限上架的已完成项。
OAuth 端到端授权、续期及撤销属于后续升级项，不声称已经通过。
