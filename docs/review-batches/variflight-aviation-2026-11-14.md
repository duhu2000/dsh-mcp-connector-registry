# 飞常准 Aviation MCP 上架评估（2026-11-14）

## 建议

**继续推进，当前保持 DEFERRED / pending。**

飞常准已满足官方来源、市场缺口、标准远程 OAuth、服务条款和固定版本软件许可
元数据的要求，且无凭据协议探测与 stdio 工具发现已通过。随后已完成 DSH Web
API Key 连接、远程 9 个工具发现及免费日期工具真实调用。尚未完成一次经用户确认的最小业务查询，也没有本批次
具名人工批准，因此不得迁入正式目录。

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

当前 `connectors/` 无飞常准、VariFlight 或同等国内官方航空数据卡片，去重级别为
`none`。根据用户实际连通路径，草案采用官方远程 API Key 端点与
`X-API-Key` Header；不同时混合 OAuth 和 stdio，因为当前 Connector Descriptor
的 `auth` 是卡片级单一模式。

草案提示词会在付费查询前要求用户确认，不默认连续翻页，也不访问个人行程。

## 未完成项

- 一次工具发现超时后的稳定性复核及工具注解复核。
- 最小付费只读调用（需用户确认测试费用）。
- API Key 草案卡片表单验收。
- 具名人工批准。

未完成以上项目前，不创建正式 Connector、不更新公开数量、不打 tag、不发布 npm。
OAuth 端到端授权、续期及撤销属于后续升级项，不声称已经通过。
