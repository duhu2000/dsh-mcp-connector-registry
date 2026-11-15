# 三项真实业务测试后的目录状态更新

用户要求：基于本会话真实测试更新市场目录状态。日期：2026-11-15。

| 连接器 | 最新测试 | 目录说明 | 保留限制 |
| --- | --- | --- | --- |
| 飞常准航空数据 | PEK 机场天气一次成功，实际 10 积分 | 免费日期及机场天气业务已验收 | 其他收费工具、OAuth、长期稳定性未验收 |
| 克而瑞·深度智联地产数据 | 上海单月问数一次成功，实际 10 积分 | 问数单次业务已验收 | 问知、其他领域、长请求及长期稳定性未验收 |
| OpenBoost 跨境数据 | 美国站关键词趋势一次返回 401 / API_KEY_INVALID | 该次业务未通过，需核对密钥或接口订阅权益 | 无业务数据，未重试，扣费未核实，不能外推为全服务故障 |

三张卡片继续 published=true、featured=false。根据用户随后明确纠正“飞常准、克而瑞已经测试通过，应该是 pass”，两张卡片 probeStatus=pass，probeCheckedAt 使用已有业务测试时间；OpenBoost 仍为 partial。不新增或删除连接器，不提高评分。候选记录中的历史匿名 probe 及其时间保留。
历史 DuHu 具名批准及 review.scope 不变，runtimeAcceptance 更新为最新真实调用事实，记录检查人 codex-runtime-verification，不能将其伪装为新的具名全面验收。

原 connection-only 入库校验只允许 not-run，无法表达上架后的真实测试。现保留原初次入库要求，增加有完整证据的后续结果校验：必须晚于原批准时间，必须有检查人和匹配的 HTTPS 运行报告；业务结果 pass 时市场卡片显示 pass，fail 或 not-run 时保持 partial；仍要求非推荐、原 watchlist 评分及明确结果/未验收范围。未调整 full-runtime 门槛。

## 证据

- [飞常准](../runtime-acceptance/variflight-aviation-2026-11-14/airport-weather-single-call-2026-11-15.md)
- [克而瑞](../runtime-acceptance/workbuddy-limited-2026-11-15/cric-deeplink-wenshu-single-call.md)
- [OpenBoost](../runtime-acceptance/workbuddy-limited-2026-11-15/openboost-trends-single-call.md)

以上报告中的“未修改卡片”描述测试结束时状态，本次目录更新另由本记录说明。历史报告中的 not-run、预算限制仅描述当时阶段，后续单次授权与结果见上述新报告。
本次仅发布 Registry 元数据与验收摘要，无新增付费调用，不需要 npm 发版或插件 tag。

## 状态口径纠正

市场 `pass` 表示已完成所配置鉴权方式下的连接、工具发现和有真实证据的代表性业务调用，不要求逐项遍历所有工具，也不承诺长期稳定性。未测试范围继续在卡片及报告说明。此前以“未覆盖所有工具”为由保留 partial 的判定过严，本次修正。历史 review.scope 及评分用于追溯原始上架审批，不应永久锁定市场展示；仅连接验收不得直接标为 pass。无新增测试或扣费。
