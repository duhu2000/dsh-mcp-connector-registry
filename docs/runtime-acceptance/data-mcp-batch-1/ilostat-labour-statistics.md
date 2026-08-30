# ILOSTAT 全球劳工统计 MCP 运行预检

- Checked at: 2026-08-30T10:42:46.446Z
- Reviewer: codex-preflight
- Endpoint: https://ilo.sidneybissoli.com/mcp
- Server: ilo-mcp-server 0.3.2
- Protocol: 2025-06-18
- Tools listed: 4
- Safe tool: `ilo_search_indicators`
- Tool result: success
- Response SHA-256: `49f657837f8bfe07c8b9a09bca40c6e34f871619cd8feee5f4e7c06a6ce841eb`
- Credential scan: pass
- Decision: **pass**

`initialize`、`tools/list` 与一个明确标注只读、非破坏性的工具调用通过。报告未保存原始 MCP
响应正文、会话标识或凭据。

本记录是自动运行预检，不等同于维护者人工来源审核。
