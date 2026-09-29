# Proposition 65 连接器下架调查

- 连接器：`california-proposition-65`
- 调查日期：2026-09-29
- 关联 Issue：[#30](https://github.com/duhu2000/dsh-mcp-connector-registry/issues/30)
- 决策：从公共 Registry 下架；不自动删除用户本机已有连接

## 时间线

| 时间（UTC） | 证据 |
|---|---|
| 2026-09-14 09:00 | 定时健康探针仍返回 HTTP 200，MCP `initialize` 通过。 |
| 2026-09-17 03:50 | Toolstop 仓库明确说明 Hosted endpoints 已停止，而不只是停止维护。 |
| 2026-09-21 09:01 | 第一次连续健康失败，端点在 HTTP/MCP 协议前返回网络错误。 |
| 2026-09-28 09:52 | 第二次连续健康失败，达到人工调查门槛并自动创建 Issue #30。 |
| 2026-09-29 | 独立复核确认 DNS `ENOTFOUND`、Official MCP Registry 原条目返回 404，npm 包标记 deprecated。 |

## 结论

故障来自上游主动停服，不是本 Registry 的 URL 尾斜杠、鉴权或 MCP 协议配置错误。虽然
`@toolstop/prop65@0.1.0` 的源代码仍可通过 stdio 本地运行，但发布者已将包标记为 deprecated，
并说明数据冻结。将公共卡片直接改为该 stdio 包会把已知弃用的软件和陈旧数据继续推荐给用户，
不符合当前目录“没有已知弃用公告”的上架门槛。

因此删除正式 Connector 描述，保留原候选记录、批次清单和运行验收报告作为历史证据。客户端刷新
远程目录后不再展示该卡片；用户本机已经保存的连接记录不会被 Registry 自动删除。

## 证据

- [Toolstop 停服说明](https://github.com/toolstop/toolstop/blob/main/README.md)
- [npm `@toolstop/prop65`](https://www.npmjs.com/package/@toolstop/prop65)
- [历史运行验收](../runtime-acceptance/data-mcp-batch-4/california-proposition-65.md)
- [历史候选记录](../../candidates/records/california-proposition-65.json)
