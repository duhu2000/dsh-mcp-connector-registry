# 国内数据 MCP 上游修复建议（2026-10-03）

本文件记录可向上游提交的 Issue 内容。
截至 2026-10-03，巨潮资讯候选已提交为
[`youhaozhao/cninfo-mcp#8`](https://github.com/youhaozhao/cninfo-mcp/issues/8)，
国家统计候选仍是未发送草案。
它只记录进入 DSH MCP Connector Registry 前的最小修复门槛，
不是上架批准或对第三方数据来源的背书。

## `national-stats-mcp`

建议 Issue 标题：

> 建议统一许可证、脱敏请求日志并补充 MCP 工具注解

建议正文：

> 我们在评估 `national-stats-mcp@2.0.0` 作为公共 Connector 时，完成了
> `initialize`、`tools/list` 和最小只读调用。协议与公开数据查询可用，
> 但仍有以下发布安全与合规问题：
>
> 1. `package.json` 及 README 声明 MIT，而根目录 `License` 实际为 Apache-2.0；
> 2. `src/api-client.ts` 会向 stderr 输出查询 URL、参数和数据请求 payload；
> 3. 查询工具没有声明 MCP `readOnlyHint: true` 和 `destructiveHint: false`；
> 4. npm 发布包建议清理历史 tgz 等与运行无关文件。
>
> 建议在下一个固定版本中统一许可证，删除或默认禁用请求参数日志，
> 为全部查询工具补充只读/非破坏性注解，并缩减发布包内容。
> 修复版本发布后，我们可以重新执行固定版本的只读运行验收。

上游证据：

- 仓库：https://github.com/Ddhjx-code/national_data
- npm：https://www.npmjs.com/package/national-stats-mcp
- 许可证声明：`package.json` 与根目录 `License`
- 日志实现：`src/api-client.ts`
- 工具实现：`src/index.ts`

## `@youhaozhao/cninfo-mcp`

提交状态：已创建
[`youhaozhao/cninfo-mcp#8`](https://github.com/youhaozhao/cninfo-mcp/issues/8)。

建议 Issue 标题：

> 建议升级 HTTPS 查询、去除启动时安装副作用并标注写盘工具

建议正文：

> 我们在评估 `@youhaozhao/cninfo-mcp@1.4.1` 作为公共 Connector 时，完成了
> `initialize`、`tools/list` 和一次不下载文件的年报元数据查询。
> 建议在下一个固定版本中处理以下问题：
>
> 1. `python/spider.py` 的查询端点及 `Origin` / `Referer` 仍使用明文 HTTP；
> 2. npm `postinstall` 和启动器会在 `~/.cninfo-mcp/venv` 建立持久化环境并自动执行 pip；
> 3. `query_annual_reports_tool` 应声明 `readOnlyHint: true` / `destructiveHint: false`；
> 4. `download_annual_reports_tool` 会写盘且允许调用方指定 `save_path`，应显式标注为有写入副作用，
>    限制到可审计的工作目录，并在写入前要求用户确认。
>
> 如上游仅支持 HTTP 查询，请在文档中明确说明原因和完整性限制；
> 如已支持 HTTPS，请将默认端点升级为 HTTPS。
> 同时建议把 Python 依赖构建为显式安装步骤或可复现的预构建产物，
> 避免 MCP Server 启动阶段访问网络并修改用户目录。

上游证据：

- 仓库：https://github.com/youhaozhao/cninfo-mcp
- npm：https://www.npmjs.com/package/@youhaozhao/cninfo-mcp
- 启动器：`bin/cninfo-mcp.js`
- npm 安装钩子：`package.json` 的 `postinstall`
- 查询与下载：`python/spider.py`
- MCP 工具：`python/mcp_server.py`

## 重验触发条件

任一上游发布新的固定版本后，再执行下列步骤：

1. 校验 npm 元数据、仓库 tag 与发布包哈希；
2. 在隔离临时目录安装固定版本，记录安装与启动副作用；
3. 执行 `initialize` 和 `tools/list`，复核 tool annotations；
4. 只调用一个无写入、无凭据、可脱敏的公开查询；
5. 记录来源、请求时间、工具数、安全边界与已知限制；
6. 重验达标后再进入具名人工批准，不自动生成或上架 Connector。
