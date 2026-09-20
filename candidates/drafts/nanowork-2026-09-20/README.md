# 纳米 Work 对标：三个待验收 Connector 草案

状态：`pending`，不是正式市场卡片，也不计入公开目录。这里的 JSON 仅供维护者评审；
`connectors/` 下没有对应文件。无凭据预检见
[`docs/review-batches/nanowork-four-public-probe-2026-09-20.md`](../../../docs/review-batches/nanowork-four-public-probe-2026-09-20.md)。

审核人署名（2026-09-20 用户确认）：`Duhu`。用户随后明确将金数据的连接与工具发现
视为有限验收通过，金数据已单独迁入正式目录；该决定**不批准**余下三项。

| 草案 | 已完成 | 上架前仍需 |
|---|---|---|
| `kuaidi100-logistics.json` | 官方包与无 Key 远程 `initialize`、5 个工具名；已静态审计 npm `1.0.4` 包 | **暂停上架**：该版本向 stderr 打印含 Key 的请求数据，且向 stdout 写非协议日志；须先有经复核的修复版本或安全实现，再做 stdio 启动、最小权限 Key 调用、费用与配额验收。不得改用含 Key 的 URL Query |
| `trello.json` | 官方地址、401 挑战、资源/授权元数据、DCR/PKCE S256 | 专用工作区完成 DSH OAuth、只读工具发现与查询；核对请求 scope、工作区选择和组织策略 |
| `atlassian-rovo.json` | 官方 v2 地址、401 挑战、资源/授权元数据、DCR/PKCE S256 | 专用站点完成 DSH OAuth、按需工具发现和 Jira/Confluence 只读查询；核对组织策略及 Rovo credits |

2026-09-20 本机 DSH Web 验收补充：金数据在当前 `workspace` 显示已连接、健康检查
`ok`，发现 60 个工具；用户明确接受未执行 `tools/call` 的有限验收，风险如
[`docs/runtime-acceptance/nanowork-2026-09-20/jinshuju-forms.md`](../../../docs/runtime-acceptance/nanowork-2026-09-20/jinshuju-forms.md)
所述。Trello 授权页提示当前账号没有 Trello 工作区；Rovo 安装请求超时。
用户决定跳过 Atlassian 测试，本轮不再重试这两项。快递100继续暂停。
详见上方探测报告的“DSH Web 本机运行验收”一节。

余下三项仍须补齐官方来源与条款证据、脱敏真实运行验收报告、候选正式记录和维护者署名批准，
才能迁入 `connectors/` 并通过 `scripts/check-new-connectors.mjs`。本草案不得用于创建发布标签或 npm 版本。

特别注意：快递100的远程端点允许匿名握手和工具枚举，不代表业务工具无需凭据；
其官方远程示例将 Key 放在 URL Query，故草案只采用通过环境变量绑定 Key 的官方 stdio 形式。
官方 npm 包 `1.0.4` 的发布包静态审计进一步确认：`dist/http-request.js` 将含 `key` 的
请求体写入 stderr，还记录响应；`dist/index.js` 在 stdio 连接后向 stdout 写入普通文本，
不符合 stdout 仅用于 JSON-RPC 消息的要求。其 `package.json` 还包含同名包自依赖。
因此当前 `npx` 草案**不得执行或发布**；后续即使取得测试 Key，也不能用该版本做真实业务验收。
审计证据与替代方案边界见上方探测报告。
Atlassian 官方工具目录的 `read_jira` 组内也列有 watch、上传附件等可改变状态的工具，
因此只请求 `read:*` scope 和写“只读”提示词都不能替代逐工具策略审查与真实验收。
