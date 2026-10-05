# 国内数据 MCP 候选推进记录（2026-10-02）

本轮目标是验证“国家统计局公共统计”和“巨潮资讯上市公司报告”是否已达到正式市场卡片门槛。

> 2026-10-05 后续处理：本文件对 `@youhaozhao/cninfo-mcp@1.4.1` 的 `DEFERRED`
> 结论作为历史快照保留。正式卡片改用 DSH/QCC 独立维护的
> `@duhu2000/cninfo-mcp@1.4.3`，已完成 HTTPS-only、零安装副作用、单一只读工具、
> npm、Official MCP Registry、真实运行验收和 `DuHu` 具名批准，现已迁入正式目录。
没有自动批准、生成正式 Connector、合并或发布。

## 2026-10-03 上游复核

两个包均没有新版本，阻塞项仍可在最新代码中复现，因此继续 `DEFERRED`：

- `national-stats-mcp` 仍为 `2.0.0`（npm 最后发布 2026-07-08）。`package.json` 和 README 声明 MIT，
  但根目录 `License` 仍是 Apache-2.0；`src/api-client.ts` 仍将查询参数、完整 URL 和
  数据请求 payload 写入 stderr；6 个工具仍未提供 `readOnlyHint` / `destructiveHint`。
- `@youhaozhao/cninfo-mcp` 仍为 `1.4.1`（npm 最后发布 2026-09-06）。查询端点仍使用
  `http://www.cninfo.com.cn`；`postinstall` 与启动器仍会在 `~/.cninfo-mcp/venv` 建立持久化
  Python 环境并自动执行 pip；下载工具仍允许传入任意 `save_path` 并写盘，两个工具均未声明
  MCP tool annotations。

可直接提交给上游的修复清单已整理至
[`domestic-data-upstream-remediation-2026-10-03.md`](domestic-data-upstream-remediation-2026-10-03.md)。
巨潮资讯候选的整改请求已于 2026-10-03 提交为
[`youhaozhao/cninfo-mcp#8`](https://github.com/youhaozhao/cninfo-mcp/issues/8)；
国家统计候选仍保留为未发送草案。提交整改请求不代表上架批准。

| 候选 | 协议与工具发现 | 最小真实调用 | 官方身份 | 安全与条款 | 结论 |
|---|---|---|---|---|---|
| 国家统计局公共统计（社区） | PASS：MCP `2025-06-18`，6 工具 | PASS：`list_provinces` 与公开 `GDP` 搜索 | DEFERRED：不在 Official MCP Registry，不是国家统计局官方产品 | DEFERRED：MIT/Apache-2.0 冲突；请求参数写 stderr；工具无 annotations | **DEFERRED** |
| 巨潮资讯上市公司报告（社区） | PASS：MCP `2025-06-18`，2 工具 | PASS：`000001` 的 2024 年报元数据查询；未下载 | DEFERRED：不在 Official MCP Registry，不是巨潮资讯官方产品 | DEFERRED：查询用 HTTP；启动器自动建 venv/pip；下载工具写盘；工具无 annotations | **DEFERRED** |

## 去重

- 国家统计局候选与现有 IBGE、OECD、IMF、BLS 等海外统计 Connector 在地域与数据源上不重复。
- 巨潮资讯候选与 AKShare、东方财富、TuShare、通达信、Wind 有领域重叠，但原始披露文件检索仍有差异化。
- AgentLadle CNINFO 继续作为备用，不与本候选并列推进。

## 源码与发布包检查

### `national-stats-mcp@2.0.0`

- npm 元数据：MIT；发布包根目录 `License`：Apache-2.0。
- 数据端点基址为 `https://data.stats.gov.cn`。
- API 客户端把查询 URL、参数或 payload 写入 stderr。
- 发布包包含两个旧版本 tgz，属于需要上游清理的包装问题。

### `@youhaozhao/cninfo-mcp@1.4.1`

- npm 与仓库：MIT。
- 启动器在用户目录创建持久化 venv 并自动安装 Python 依赖。
- 巨潮查询接口为明文 HTTP；PDF 静态下载地址为 HTTPS。
- 查询工具不写文件；下载工具创建目录并写 PDF。

## 下一步

1. 向 `national-stats-mcp` 维护者要求统一许可证、移除请求参数日志并为 6 个查询工具补 `readOnlyHint: true`、`destructiveHint: false`。
2. 跟进 [`cninfo-mcp` Issue #8](https://github.com/youhaozhao/cninfo-mcp/issues/8)：等待 HTTPS 查询、无启动时 pip 副作用的固定包，以及查询/下载工具的准确注解。
3. 两个项目申请进入 Official MCP Registry，或提供能满足本仓库权威来源门槛的发布证据。
4. 修复版本发布后重新执行固定版本安装、`initialize`、`tools/list` 和真实只读调用。
5. 只有届时达到 `selected`、具名批准并形成正式运行报告，才可迁入 `connectors/`。

## 证据

- 国家统计局候选仓库：https://github.com/Ddhjx-code/national_data
- 国家统计局候选 npm：https://www.npmjs.com/package/national-stats-mcp
- 巨潮资讯候选仓库：https://github.com/youhaozhao/cninfo-mcp
- 巨潮资讯候选 npm：https://www.npmjs.com/package/@youhaozhao/cninfo-mcp
- 巨潮资讯上游整改 Issue：https://github.com/youhaozhao/cninfo-mcp/issues/8
- 国家统计局运行预检：[`../runtime-acceptance/domestic-data-mcp-2026-10-02/national-statistics-cn.md`](../runtime-acceptance/domestic-data-mcp-2026-10-02/national-statistics-cn.md)
- 巨潮资讯运行预检：[`../runtime-acceptance/domestic-data-mcp-2026-10-02/cninfo-listed-company-reports.md`](../runtime-acceptance/domestic-data-mcp-2026-10-02/cninfo-listed-company-reports.md)
