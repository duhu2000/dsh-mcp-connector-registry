# 巴西参议院开放数据 MCP 运行预检

- Checked at: 2026-08-30T10:45:30.905Z
- Reviewer: codex-preflight
- Endpoint: https://senado.sidneybissoli.com/mcp
- Server: senado-br-mcp 3.5.1
- Protocol: 2025-06-18
- Tools listed: 67
- Safe tool: `senado_listar_senadores`
- Tool result: success
- Response SHA-256: `72160a3cdccccac7d11dfba580b6c77f3f1cf81856bb13c7615f6b9f5a69b54d`
- Credential scan: pass
- Decision: **pass**

`initialize`、`tools/list` 与一个明确标注只读、非破坏性的工具调用通过。报告未保存原始 MCP
响应正文、会话标识或凭据。

本记录是自动运行预检，不等同于维护者人工来源审核。
