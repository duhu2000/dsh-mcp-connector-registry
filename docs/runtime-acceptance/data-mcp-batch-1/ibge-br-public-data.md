# IBGE 巴西公共统计 MCP 运行预检

- Checked at: 2026-08-30T10:42:21.010Z
- Reviewer: codex-preflight
- Endpoint: https://ibge.sidneybissoli.com/mcp
- Server: ibge-br-mcp 4.0.2
- Protocol: 2025-06-18
- Tools listed: 21
- Safe tool: `ibge_estados`
- Tool result: success
- Response SHA-256: `d08b9cbdb555756c193de108d43ea7beb6707d7fd58ba6d29d96098571902aa3`
- Credential scan: pass
- Decision: **pass**

`initialize`、`tools/list` 与一个明确标注只读、非破坏性的工具调用通过。报告未保存原始 MCP
响应正文、会话标识或凭据。

本记录是自动运行预检，不等同于维护者人工来源审核。
