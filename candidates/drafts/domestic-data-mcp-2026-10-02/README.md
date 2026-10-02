# 国内数据 MCP 候选草案（2026-10-02）

状态：`pending`。本目录不参与市场构建，两个 JSON 均不是正式 Connector。

| 草案 | 当前证据 | 阻塞项 |
|---|---|---|
| `national-statistics-cn.json` | npm 固定版本 `2.0.0`；`initialize`、6 项 `tools/list`、`list_provinces` 和公开 GDP 搜索均通过 | 不在 Official MCP Registry；社区项目并非国家统计局官方产品；npm 元数据声明 MIT，但发布包 `License` 实为 Apache-2.0；请求参数写 stderr；工具缺少只读注解 |
| `cninfo-listed-company-reports.json` | npm 固定版本 `1.4.1`；MIT；`initialize`、2 项 `tools/list` 和 `000001` 的 2024 年报元数据查询均通过 | 不在 Official MCP Registry；社区项目并非巨潮资讯官方产品；启动器会创建 Python venv 并自动安装依赖；查询使用明文 HTTP；下载工具写本地文件；工具缺少注解 |

## 当前决策

- `national-statistics-cn`：协议和最小真实只读调用已经通过；许可证冲突、日志泄露面、工具注解和来源身份未解决前不得迁入正式目录。
- `cninfo-listed-company-reports`：隔离环境内的查询验收已经通过，保留 P1 草案；先要求 HTTPS 查询、无启动时安装副作用的固定包以及正确的工具注解。
- 两项均没有具名人工上架批准，`connectors/` 下不得创建同名文件。

证据报告：[`docs/review-batches/domestic-data-mcp-2026-10-02.md`](../../../docs/review-batches/domestic-data-mcp-2026-10-02.md)。
