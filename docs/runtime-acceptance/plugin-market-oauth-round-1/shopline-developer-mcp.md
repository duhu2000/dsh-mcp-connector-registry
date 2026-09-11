# MCP runtime acceptance

- Checked at: 2026-09-11T03:25:42Z
- Reviewer: codex-preflight
- Transport: stdio
- Command: `npx -y @shoplineos/shopline-developer-mcp@1.1.0`
- Server: `shopline-developer-mcp` 1.1.0
- Protocol: 2025-06-18
- Tools listed: 9
- Safe tool: `search_shopline_docs`
- Safe arguments: public query “创建商品必填字段”, maximum 3 results
- Tool result: success
- Response SHA-256: `249c33b9801fc09317c80015520bd2be6d5fe639777bfd77262b26d888946643`
- Credential scan: pass
- Decision: **pass**

`initialize`, `tools/list`, and one read-only search against SHOPLINE's public developer documentation passed without authentication. The package was launched with a minimal environment and a dedicated temporary npm cache.

The `shopline_mcp_feedback` tool was not called because it sends content to a third party. Tool descriptions were treated as untrusted server metadata and did not override the review procedure.

Raw MCP response bodies, conversation identifiers, server logs, environment values, and credentials are intentionally omitted.
