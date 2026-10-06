# IT桔子创投数据：有限运行验收

验收时间：2026-10-06T10:20:42Z。审核人：`DuHu`。

## 结论

协议层有限验收通过，公共探针状态保留为 `partial`。IT桔子官方托管端点可以完成真实 `initialize` 与 `tools/list`，无凭据业务调用被正确拒绝；本次没有使用付费 API Key，也没有读取、保存或导出任何业务数据。

用户确认 IT桔子创投数据与企查查无直接竞争关系，批准生成正式 Connector 卡片并合并到市场。本次批准不改变 IT桔子价格权益和数据使用限制，也不代表 DSH/QCC 对服务可用性或数据质量作背书。

## 真实协议探测

目标端点：`https://mcp.itjuzi.com/mcp`，Streamable HTTP。

- 无凭据 `initialize` 返回 HTTP 200，协商 MCP `2025-06-18`；服务端标识为 `IT桔子 MCP`，版本 `1.27.1`。
- 无凭据 `tools/list` 返回 HTTP 200，实时发现 21 个工具。官方落地页和公开客户端文档仍写 15 个工具，说明远程服务迭代快于静态文档；Connector 因此不固化 `toolsSnapshot`，连接后以服务端实时清单为准。
- 对只读字典工具 `get_lookup_options` 发起无凭据最小调用，返回 `isError: true` 和“缺少 API Key”；这确认业务数据调用受凭据控制，没有产生付费数据查询。
- 请求和报告均未包含 API Key、个人数据、客户数据或业务查询结果。

实时发现的 21 个工具为：

`search_companies`、`count_companies`、`search_closed_companies`、`count_closed_companies`、`analyze_closed_company_cohort`、`resolve_companies`、`get_company_profile`、`get_company_funding_events`、`search_events`、`rank_companies_by_funding`、`aggregate_funding_by_tags`、`search_investors`、`get_investor_profile`、`search_people`、`get_person_profile`、`search_investor_cases`、`search_person_investment_cases`、`search_company_investment_cases`、`search_fa_cases`、`get_lookup_options`、`search_tags`。

## 鉴权与计费

公开客户端仓库要求把 IT桔子 MCP API Key 放入 `Authorization: Bearer <API Key>`。Connector 使用 `auth.mode = bearer`，这样 DSH 会在本机保存用户输入的 API Key 并自动添加 `Bearer` 前缀；目录本身不含凭据。

IT桔子[价格权益文档](https://github.com/lgyers/itjuzi-mcp/blob/main/docs/pricing.md)公开尝鲜版、标准版和团队问答版，并明确团队问答适用于人在 MCP 客户端中进行投研问答，不支持批量导出、系统入库或平台分发。实际价格、工具权限、配额和可见字段以服务商与用户账号为准。

## 风险与后续补测

- 当前 `tools/list` 返回的工具没有 MCP `annotations`；虽然工具名称与描述均为查询和聚合能力，客户端仍应限制查询范围，并在服务端能力变化后重新检查工具清单。
- 服务包含人物画像、工作经历、教育经历等信息。不得提交无关个人信息或把返回内容用于超出授权目的的处理。
- 未使用真实付费 API Key 执行业务 `tools/call`，因此不能宣称已验证套餐内数据完整性、额度扣减、所有工具调用或字段权限。
- 后续可使用服务商提供的专用测试 Key，执行一次范围受限的 `get_lookup_options` 或 `search_tags` 调用，并核对 DSH 连接、工具显示、计费提示和结果字段；补测不得记录 Key 或原始敏感响应。

## 证据

- [IT桔子 MCP 官方页面](https://mcp.itjuzi.com/)
- [公开客户端仓库与接入说明](https://github.com/lgyers/itjuzi-mcp)
- [公开工具文档](https://github.com/lgyers/itjuzi-mcp/blob/main/docs/tools.md)
- [价格权益与使用限制](https://github.com/lgyers/itjuzi-mcp/blob/main/docs/pricing.md)
