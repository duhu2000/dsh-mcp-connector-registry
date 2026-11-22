# Agent Rynku · 波兰证券数据

卡片草案已准备，尚未进入正式市场。用户已报告 DSH 连接与工具发现成功。

- 免账号、免 Key、Streamable HTTP；官方公共入口实际发现 6 个工具。
- 2026-11-22 直接通过 curl 完成一次 search_gpw_companies（KGHM，limit=1），HTTP 200、返回 1 个匹配；其余 5 个工具未验收。没有付费调用或重试。
- Python urllib 的初次 initialize 返回 403；改用 curl 的独立协议验证成功，原因尚未确定。失败发生在业务查询前，证据保留该差异。
- 服务商条款明确支持 MCP；禁止再分发、转售或系统性复制数据。仓库只记录接入配置与最小脱敏验收摘要，不保存原始市场数据。
- 卡片包含两条完整中文示例，无必填占位变量。只接入免费公共工具，非 GPW 官方产品。
- 上架审核待本候选具名确认，published=false；证据 main 链接在 PR 合并后生效。

## 后续

具名批准后迁入 connectors/ 与 candidates/records/，生成目录、运行校验、合并发布 Registry；不需为纯目录更新发布 npm。
