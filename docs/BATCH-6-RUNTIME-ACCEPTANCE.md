# 第六批维护者精选运行验收

验收日期：2026-08-25

## 验收边界

- 只执行 MCP `initialize` 与 `tools/list`，不调用任何业务工具。
- 不读取或使用真实 API Key、Google ADC、Token、Cookie 或其他用户凭据。
- MiniMax 使用明确无效的占位 Key；Google Analytics 显式指向不存在的 ADC 文件。
- stdio 包在临时目录中启动，完成工具发现后立即关闭。
- `pass` 表示无用户凭据即可完成启动、`initialize` 和 `tools/list`；`partial` 表示协议、鉴权边界或本地包启动已核验，但真实凭据和业务调用仍需用户侧验收。

## 结果

| 连接器 | 验收方式 | 结果 | 证据摘要 |
| --- | --- | --- | --- |
| Similarweb | 对 `https://mcp.similarweb.com` 无凭据握手 | `partial` | 端点可达并被识别为 MCP，约 1.2 秒返回预期 HTTP 401 鉴权挑战；未提供 API Key，未枚举或调用付费工具。 |
| World Bank Data360 | Streamable HTTP `initialize` + `tools/list` | `pass` | `Data360 MCP Server` `0.1.0`，发现 15 个工具。 |
| draw.io | Streamable HTTP `initialize` + `tools/list` | `pass` | `drawio-mcp-app` `1.0.0`，发现 `create_diagram`、`search_shapes` 2 个工具。 |
| RCSB PDB | `uvx rcsb-mcp`，stdio `initialize` + `tools/list` | `pass` | `rcsb_mcp` `1.29.1`，发现 38 个工具；未提交序列、结构或研究数据。 |
| MiniMax MCP | `uvx minimax-mcp -y`，stdio `initialize` + `tools/list` | `partial` | 使用无效占位 Key 和中国大陆官方 API Host，发现 8 个工具；未执行图片、视频、音频或声音克隆等可能计费操作。 |
| Google Analytics | `pipx run analytics-mcp`，stdio `initialize` + `tools/list` | `partial` | `Google Analytics MCP Server` `1.0.0`，使用不存在的 ADC 路径发现 9 个只读工具；未访问任何账号、GA4 属性或报表数据。 |

## 工具发现摘要

- World Bank Data360：指标与数据集搜索、元数据、数据、拆分维度、可视化、国家排名和比较等 15 项。
- draw.io：`create_diagram`、`search_shapes`。
- RCSB PDB：全文、属性、序列、化学、结构、motif 检索及 PDB/UniProt/PubMed 数据获取等 38 项。
- MiniMax MCP：文本转音频、声音列表与克隆、图片/视频生成及任务查询等 8 项。
- Google Analytics：账号摘要、属性详情、自定义维度指标、标准/实时/漏斗/转化报表等 9 项。

## 后续用户侧验收

以下连接器需要用户在 DSH 本机使用自有凭据完成最终端到端验收：

1. Similarweb：使用具备 API 权限的 Key 完成 `initialize`、`tools/list`，并在确认 API credits 后执行一条最小只读查询。
2. MiniMax MCP：使用对应区域的 Key 与 API Host；任何生成或声音克隆操作必须再次确认费用、内容权利和数据外发范围。
3. Google Analytics：使用只读 ADC 与正确 Project ID；先列出可访问账号/属性，再执行范围受限的只读报表。

本记录是 2026-08-25 的维护者运行快照，不替代持续健康监控，也不允许公共 Registry CI 自动执行本地 stdio 命令。
