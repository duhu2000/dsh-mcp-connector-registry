# 摩知轮商标检索上架草案

2026-11-25：OAuth 连接、8 个工具发现以及单次中国商标文字检索已验收通过。DuHu 已具名批准上架，正式卡片位于 connectors/mozlen-trademark.json，正式记录位于 candidates/records/mozlen-trademark.json（均相对仓库根目录）。本目录保留草稿与验收证据。

- 卡片：connectors/mozlen-trademark.json
- 候选记录：records/mozlen-trademark.json
- 连接证据：evidence/connection-acceptance.json
- 官方元数据、计费与条款：evidence/public-evidence.json
- 业务验收：evidence/runtime-acceptance.json
- 历史核价停止记录：evidence/runtime-preflight.json（已被后续授权和验收替代）

## 真实运行结果

DSH 于 2026-11-25 15:21 显示 trademark_search 单次成功：中国、名称“摩知轮”、精确匹配、第一页最多3条。总命中69，本页3条。未重试、翻页或下载，未调用其余7个工具。依据助手观察的 DSH 工具执行及结果摘要记录，未归档原始服务端响应。实际扣费未返回，记为未知。

用户已明确撤销此前1积分限制，并授权按业务需要执行验收，不再逐次询问费用；该授权不包括充值、购买套餐，也不替代正式上架批准。

## 待办

本候选已具名批准并迁入正式目录，待 PR #115 校验、合并及发布目录核验。服务条款已核实，不推定额外的数据转售或再分发权。正式卡片未单独重走 OAuth 流程。无需重复业务查询。
