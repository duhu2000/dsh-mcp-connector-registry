# 飞常准 Aviation MCP 候选草案

状态：`pending`，不是正式市场卡片，不计入公开目录。

## 结论

建议继续推进，但暂不迁入 `connectors/`。候选评分从原先的 82 分上调为
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

## 上架前必须完成

1. 在 DSH Web 使用专用测试账号完成 OAuth，核对实际 scope 不超出
   `read mcp:access`。
2. 完成远程 `initialize` 和 `tools/list`，记录服务端实际工具数与注解。
3. 先调用免费 `getTodayDate`，再由用户明确同意一次最小付费航班查询；
   报告仅保留哈希、工具名和结果状态，不保留凭据、原始航班结果或个人行程。
4. 核对 OAuth 授权页、余额/计费提示和断开后 Token 撤销行为。
5. 获得具名人工批准后，才能迁入 `candidates/records/` 和 `connectors/`。

拟上架卡片仅暴露官方远程 OAuth 入口。API Key 和 stdio 是官方支持的高级
备选方式，但当前 Descriptor 只支持单一全局鉴权模式，不在同一张卡中混合暴露。
