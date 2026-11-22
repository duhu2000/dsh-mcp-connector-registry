# Vostride · Agent QA 文档候选（#38）

状态：资料草案，未上架、未获得人工批准。不参与正式目录构建。

## 已核对的官方来源

- 文档及免鉴权 HTTPS MCP 配置：<https://vostride.com/docs/agent-qa/mcp>。
- 服务端点：<https://vostride.com/mcp>。
- 隐私页：<https://vostride.com/privacy>（标注更新日期 2026-10-21）。
  明确覆盖官网、公开内容 API 和文档 MCP；请求会携带 IP、User-Agent、路径等，
  Cloudflare 承载及保护服务。查询用于回答请求，服务不需要凭据，不应发送凭据。
  这不是托管服务使用条款或费用许可的替代证据。
- 官网本次页脚可定位 Privacy，未定位到独立服务条款链接；尝试 `/terms` 返回 404。
  这只说明该路径不可用，不能断言供应商不存在条款。

## 已有真实验收（不重复消耗服务）

复用 [2026-10-21 运行记录](../../../docs/review-batches/issue-triage-2026-10-21.md)：
`read_agent_qa_page({"path":"/docs/agent-qa/mcp"})` 只读调用成功，响应 SHA-256 为
`eb7a84c1dc60072cc6cb5aa17ce2543f20ae1922f1acac73a56400f4da86e4e5`。
这是单工具烟测，不是全部工具、DSH UI 或人工批准。
旧申请、官网、现场工具数量存在差异，卡片不写固定工具数量。

2026-10-24 增量验收见 [复核记录](../../../docs/review-batches/vendor-acceptance-2026-10-24.md)
和 [机器可读证据摘要](acceptance-2026-10-24.json)：当前服务为 1.3.0，已核对完整的
4 个工具名称及注解；macOS DSH Desktop 已完成隔离工作区导入、工具发现、一次公开文档
读取及停用临时连接。仅这一条业务路径通过，不代表所有工具或全部平台通过。

## 待完成

1. 供应商明确适用于公开文档 MCP 的使用/费用/限额条款及官方链接。
2. 完成正式 schema 候选记录、具名维护者审核及最终上架 head CI；不得把本次技术验收当成人工批准。
3. 上架时重新比较工具范围；此卡片仅包含公开内容阅读，不混入本地 QA 执行。

不要为了填齐许可证或评分而将未知项标成 verified；不要用源码许可证代替托管条款。
