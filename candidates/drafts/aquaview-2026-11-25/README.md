# AQUAVIEW 上架草案 — 2026-11-25

- 名称：AQUAVIEW · 海洋与环境数据；分类：调研分析；海外数据。
- 官方公共 Streamable HTTP 入口免 Key，已直接核验 initialize、tools/list（6 个工具）。用户另已报告 DSH 连接成功。
- 一次 search_datasets：夏威夷周边 bbox=-161,18,-154,23，2025 年全年，limit=3，无 assets；命中 4,957 条，返回 3 条 SkyTruth Cerulean 目录记录，许可 CC-BY-SA-4.0。未翻页、未下载、未调用 get_data。目录模型检测不等于真实漏油事件或责任认定。
- 官方接入：https://aquaview.org/mcp-overview
- 服务条款：https://aquaview.org/terms-of-service 。商业用途需授权，数据许可逐来源核对；不以 MIT 代码许可替代托管服务/数据条款。
- 技术代表性验收 PASS；2026-11-26 用户以 DuHu 署名批准上架，正式卡片已迁入 connectors/，published=true。草案卡片保留 published=false 作为准备阶段快照；分类目录及“近期新增”已重建。
- 两条中文示例可直接发送，无“研究问题”必填占位符。
- 无凭据、会话标识或分页 token 入库；仅保存公开元数据摘录、参数 Schema 和完整响应的摘要值。
- 后续：维护者私有 registry_review、公开 CI，再合并。无需 npm 发版。
