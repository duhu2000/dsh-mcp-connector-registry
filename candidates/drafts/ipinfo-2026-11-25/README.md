# IPinfo 上架准备（2026-11-25）

- 名称：IPinfo · IP地理与网络数据；提供方：IPinfo（海外）；分类：开发工具。
- 官方托管 Streamable HTTP，卡片主入口 OAuth；现有 API Token 也支持手动 Bearer 接入。无须申请独立 MCP Key。
- 6 个工具发现；通过 Chrome DSH 展开的真实工具响应核实一次公共 IP Lite 查询 PASS，未读取凭据、账号额度或客户数据。
- 默认示例可直接使用，无必填“研究问题”。高级地理、代理与住宅代理检测依赖账号套餐，尚未逐项验收。
- 官方公开服务条款包含数据许可；商业集成、再分发等权利不能由连接器卡片授予。使用通用图标。
- 当前为未发布草案，待本候选具名上架批准；不改动正式 connectors、公共目录或 npm。

## 证据

[官方 MCP 文档](https://ipinfo.io/developers/mcp-server) · [服务条款](https://ipinfo.io/terms-of-service) · [使用政策](https://ipinfo.io/acceptable-use-policy)

本目录 evidence/runtime-acceptance.json 仅保存验收元数据，不保存供应商完整数据响应。官方鉴权与条款核实见 evidence/official-review.json。
