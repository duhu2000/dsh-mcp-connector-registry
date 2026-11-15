# OpenBoost 搜索趋势：单次真实业务验收

验收日期：2026-11-15（Asia/Shanghai）。补充此前 connection-only 证据，不改写历史记录。

## 授权与边界

用户明确允许本次 Amazon 美国站 wireless charger 搜索趋势按当前套餐实际单次扣费执行，不再限定 1 积分。
仅授权 1 次调用，不重试、不拆问、不分页、不补查、不充值、不购买。
本轮未调用账号、订单、购买或支付工具；未读取或保存凭据。

## 调用前检查

本机 DSH Web 已连接 openboost_cross_border_data，工具发现显示 104 个工具。
已查看 amz_keyword_research_trends 参数详情：keyword 与 webSiteId 均为必填字符串，站点 1 对应美国。
工具发现成功不等于密钥业务权限有效。

## 真实调用与结果

- 工具：mcp__openboost_cross_border_data__amz_keyword_research_trends。
- 入参：`{"keyword":"wireless charger","webSiteId":"1"}`。
- DSH 轨迹开始时间：2026-11-15 11:01:44.996 +08:00。
- 耗时：214 毫秒；状态：失败。
- 本轮轨迹只有 1 次工具调用，调用后没有重试。
- 原始错误：HTTP 401；code=`API_KEY_INVALID`。
- 服务端错误含义：密钥无效，或尚未开通该接口的订阅。
- 未返回 monthSearchJson、业务数据样例或时间覆盖；不能标为业务验收通过。
- 已展开 DSH 原始工具错误和计时核对，不仅依据模型总结。

## 费用与下一步

错误未返回实际扣费信息，未核对账户扣费明细；不将 401 推断为免费或已退款。
下一步应在 OpenBoost 官方账户核对该密钥是否有效、当前 MCP 套餐是否包含 Amazon 关键词月搜索趋势，以及订阅有效期。需要换 Key 时由用户在 DSH 本机填写，不发送到会话。
凭据或权益问题解决后，另行安排新的单次只读验收，本次授权不会自动延展为重试授权。

现有卡片继续保留有限验证状态；本次记录仅说明该账号的该工具调用未通过，不据单次失败自动下架或判定供应商整体不可用。
本记录未修改正式卡片、候选评分或审核范围，也未执行新的发布。

公开服务入口：https://mcp.openboostai.com/mcp-servers/openboost-all-mcp
公开套餐页面：https://openboostai.com/pricing
上述页面链接用于定位服务与权益核对，不作为本次实际扣费证据。
