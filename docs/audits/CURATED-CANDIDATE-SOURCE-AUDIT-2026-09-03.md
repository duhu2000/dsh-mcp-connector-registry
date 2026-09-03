# 竞品精选目录候选源只读审计

审计时间：2026-09-03T01:01:26.967Z

审计对象：

- `dsh-mcp-panel` 内置目录，固定版本 [`edd8b27666eef8016b585ad8e2ccd64ec1655aca`](https://github.com/PerryLink/dsh-mcp-panel/commit/edd8b27666eef8016b585ad8e2ccd64ec1655aca)
- `dsh-mcp-market` Registry，固定版本 [`21155c9a48a6320155d7d0e6de8706cddcc2eae4`](https://github.com/LKMeng2001/dsh-mcp-market/commit/21155c9a48a6320155d7d0e6de8706cddcc2eae4)
- `dsh-mcp-bridge` Server 定义，固定版本 [`77cc8eae48495055f5392046b9f2317cc72fdc5c`](https://github.com/Edge-Echo/dsh-mcp-bridge/commit/77cc8eae48495055f5392046b9f2317cc72fdc5c)
- 本仓库 101 条公共 Connector，用于包名、端点、主页、名称和已知替代关系去重

## 结论

- 三个目录共有 28 条原始定义，合并为 18 个唯一身份：17 个可执行包和 1 个 localhost 配置模板。
- 其中 4 个身份被当前 Registry 强去重，1 个与现有 Google Maps 卡片形成同用途、不同服务商的弱重复。
- npm 当前明确标记 6 个旧包为 deprecated：GitHub、Google Maps、Puppeteer、Slack、Brave Search 和 Redis。
- `git-mcp` 的目录主页当前不可用，npm 元数据又未声明可核对的仓库或主页，按来源缺口进入 `DEFERRED`，不得仅凭包名自动信任。
- `@mzxrai/mcp-webresearch` 的包名与仓库可相互核对，但 GitHub 仓库当前已归档，因此整体状态提升为 `DEFERRED`，不能作为活跃维护项目直接进入上架验收。
- `dsh-mcp-bridge` 的 Filesystem 定义记录 13 个工具，而同版本 README 记录 14 个工具。系统将这种源内漂移标记为 `DEFERRED`，不猜测正确值。
- 只有 Everything 和 Memory 带有可复用的来源方 `PASS` 运行记录；其余为 `SKIP` 或 `DEFERRED`。来源方记录不替代本仓库上架前的真实只读运行验收。
- 本轮仅识别出 3 个外部数据线索，均不满足直接上架门禁；没有发现新的国内数据 MCP。

## 数据线索排期

| 身份 | 用途 | 包状态 | 最近运行证据 | 去重 | 结论 |
|---|---|---|---|---|---|
| `npm:@mzxrai/mcp-webresearch` | 公共网页研究与搜索 | 包存在，`0.1.7`；包与仓库可相互核对，但仓库已归档 | 无持久化运行时间和工具数；整体 `DEFERRED` | 无强重复 | 保留在 `P2-overseas-supplement` 观察，不进入上架批次；需先找到活跃替代方案 |
| `npm:@modelcontextprotocol/server-brave-search` | Brave 网页搜索 | npm 已标记 deprecated | 无可复用运行记录，`DEFERRED` | 无强重复 | 延期，不进入上架批次 |
| `npm:@modelcontextprotocol/server-google-maps` | 地理编码、地点和路线 | npm 已标记 deprecated | 无可复用运行记录，`DEFERRED` | 与 `google-maps` 弱重复，但服务商不同 | 延期；不得把现有 HasData 卡片当成旧包的身份背书 |

## 状态分布

| 状态 | 数量 | 含义 |
|---|---:|---|
| `PASS` | 2 | 来源方记录了连接和工具发现成功 |
| `SKIP` | 7 | 需要配置、凭据、重型依赖，或来源未持久化运行结果 |
| `FAIL` | 0 | 本次没有明确的包查询或运行失败 |
| `DEFERRED` | 9 | 包废弃、仓库归档、来源归属不足、已知名称迁移或源内数据漂移 |

## 安全和发布边界

- 竞品目录是只读候选线索，不是权威来源，也不是上架批准。
- 自动任务只生成报告和拟议 last-good 快照，不创建 `connectors/*.json`，不合并 PR，不发布 npm，也不删除现有 Connector。
- last-good 仅保存无凭据的公开字段、固定 commit SHA，以及成功获取的包与 GitHub 仓库元数据。在线源临时失败时保留旧条目并明确标注 `last-good`，不会把旧结果伪装成实时结果，也不会因一次查询失败覆盖或删除既有快照记录。
- 任一候选进入正式批次前，仍须完成官方或可问责社区来源、软件许可证或服务条款、上游数据条款、鉴权边界、真实只读运行验收和具名人工批准。
- 国内统计、金融、法律、交通、招投标、科研和政务数据仍为最高优先级；竞品目录只作海外补充。
