# 国内数据 MCP 候选草案（2026-10-02）

状态：`pending`。本目录不参与市场构建；仅余的 JSON 不是正式 Connector。

| 草案 | 当前证据 | 阻塞项 |
|---|---|---|
| `national-statistics-cn.json` | npm 固定版本 `2.0.0`；`initialize`、6 项 `tools/list`、`list_provinces` 和公开 GDP 搜索均通过 | 不在 Official MCP Registry；社区项目并非国家统计局官方产品；npm 元数据声明 MIT，但发布包 `License` 实为 Apache-2.0；请求参数写 stderr；工具缺少只读注解 |

## 当前决策

- `national-statistics-cn`：协议和最小真实只读调用已经通过；许可证冲突、日志泄露面、工具注解和来源身份未解决前不得迁入正式目录。
- `cninfo-listed-company-reports`：原 `1.4.1` 草案已在 2026-10-05 由 DSH/QCC 维护的纯 Node.js、HTTPS-only、只读 `1.4.3` 替代；npm、Official MCP Registry、真实只读运行验收和 `DuHu` 具名批准均已完成，已迁入正式记录。
- `national-statistics-cn` 仍没有具名人工上架批准，`connectors/` 下不得创建同名文件。

证据报告：[`docs/review-batches/domestic-data-mcp-2026-10-02.md`](../../../docs/review-batches/domestic-data-mcp-2026-10-02.md)。
