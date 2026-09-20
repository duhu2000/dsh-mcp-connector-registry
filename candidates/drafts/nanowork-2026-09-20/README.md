# 纳米 Work 对标：四个待验收 Connector 草案

状态：`pending`，不是正式市场卡片，也不计入公开目录。这里的 JSON 仅供维护者评审；
`connectors/` 下没有对应文件。无凭据预检见
[`docs/review-batches/nanowork-four-public-probe-2026-09-20.md`](../../../docs/review-batches/nanowork-four-public-probe-2026-09-20.md)。

| 草案 | 已完成 | 上架前仍需 |
|---|---|---|
| `jinshuju-forms.json` | 官方地址、401 挑战、资源/授权元数据、DCR/PKCE S256 | 专用账号完成 DSH OAuth、`tools/list` 和最小只读查询；确认 `forms` scope 的实际读写边界、服务条款与个人数据保护 |
| `kuaidi100-logistics.json` | 官方包与无 Key 远程 `initialize`、5 个工具名；npm 包版本固定为 `1.0.4` | 对官方 stdio 包进行无凭据启动验收；用最小权限 Key 验证只读调用、费用与配额。不得改用含 Key 的 URL Query |
| `trello.json` | 官方地址、401 挑战、资源/授权元数据、DCR/PKCE S256 | 专用工作区完成 DSH OAuth、只读工具发现与查询；核对请求 scope、工作区选择和组织策略 |
| `atlassian-rovo.json` | 官方 v2 地址、401 挑战、资源/授权元数据、DCR/PKCE S256 | 专用站点完成 DSH OAuth、按需工具发现和 Jira/Confluence 只读查询；核对组织策略及 Rovo credits |

四项均须补齐官方来源与条款证据、脱敏真实运行验收报告、候选正式记录和维护者署名批准，
才能迁入 `connectors/` 并通过 `scripts/check-new-connectors.mjs`。本草案不得用于创建发布标签或 npm 版本。

特别注意：快递100的远程端点允许匿名握手和工具枚举，不代表业务工具无需凭据；
其官方远程示例将 Key 放在 URL Query，故草案只采用通过环境变量绑定 Key 的官方 stdio 形式。
当前 npm 元数据还显示 `1.0.4` 对同名包的自依赖；运行第三方包前须核对发布内容与依赖树。
Atlassian 官方工具目录的 `read_jira` 组内也列有 watch、上传附件等可改变状态的工具，
因此只请求 `read:*` scope 和写“只读”提示词都不能替代逐工具策略审查与真实验收。
