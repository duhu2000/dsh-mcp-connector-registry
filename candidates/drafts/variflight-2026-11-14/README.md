# 飞常准 Aviation MCP 候选草案

状态：`approved`，审核人 `DuHu`，2026-11-14 批准按有限验收范围上架。
本目录仅保留评估历史；卡片已迁至
[`connectors/variflight-aviation-data.json`](../../../connectors/variflight-aviation-data.json)，
正式候选记录见 [审核记录](../../records/variflight-aviation-data.json)。

## 结论

初评时建议继续推进但暂不迁入正式目录。候选评分从原先的 82 分上调为
**87/100**：官方归属、Official MCP Registry、OAuth 2.1/PKCE/DCR、服务条款、
npm ISC 许可元数据、实时维护状态和无凭据协议探测均已核验。

| 维度 | 分数 | 依据 |
|---|---:|---|
| 官方权威性 | 25/25 | 飞常准官方域名文档、官方 GitHub 组织与 Official MCP Registry 记录一致 |
| 协议与鉴权 | 23/25 | 公开 PRM/AS Metadata，支持 DCR、PKCE S256、OAuth 2.1；还支持 API Key |
| 维护、许可和安全 | 16/20 | npm `1.1.0` 声明 ISC，仓库未归档；仓库根目录未检出 LICENSE，工具未声明只读注解 |
| 真实运行 | 8/15 | 固定版本 stdio `initialize`/`tools/list` 通过，远程 OAuth 挑战通过；未做授权后业务调用 |
| 市场缺口 | 10/10 | 当前 Registry 无同类国内官方航空数据 Connector |
| 文档与安全边界 | 5/5 | 官方工具、价格、OAuth、API Key、条款及错误处理文档齐全 |

## 已完成

- Official MCP Registry 存在最新 `io.github.variflight/variflight-mcp@1.1.0`记录。
- npm `@variflight-ai/variflight-mcp@1.1.0` 声明 ISC，发布于 2026-09-26。
- 公开 OAuth Protected Resource Metadata 与 Authorization Server Metadata 可读，包含 DCR、
  `authorization_code`、`refresh_token`、PKCE S256 和 `none` token endpoint auth。
- 匿名 `initialize` 返回预期 401 及规范化 `WWW-Authenticate` 资源元数据指针。
- 隔离运行固定 npm 版本，`initialize` 和 `tools/list` 通过，确认 9 个工具；
  进程未输出非协议 stdout 或 stderr。

## 验收与后续跟踪

1. API Key 已在 DSH Web 连接成功，远程工具发现确认 9 个工具。
   2026-11-14 18:05（Asia/Shanghai）免费 `getTodayDate({})` 实际调用成功。
2. 复核一次工具列表读取超时的稳定性问题；工具注解仍不得凭名称推定。
3. 由用户明确同意一次最小付费航班查询；
   报告仅保留哈希、工具名和结果状态，不保留凭据、原始航班结果或个人行程。
4. 核对 API Key 卡片凭据表单与计费提示。
5. DuHu 已批准有限验收上架：不要求本轮调用收费业务工具，保留 partial
   和未验证范围。收费业务验证仅在未来另获授权后执行。

正式卡片采用已通过真实测试的官方远程 API Key 入口，Header 为
`X-API-Key`。OAuth 仅完成元数据探测，尚未完成用户授权、续期和撤销测试，
单独保留待验证，不以 API Key 成功替代 OAuth 验收。
评分暂保留初评 87 分，待业务验收和稳定性复核后重新评定。
