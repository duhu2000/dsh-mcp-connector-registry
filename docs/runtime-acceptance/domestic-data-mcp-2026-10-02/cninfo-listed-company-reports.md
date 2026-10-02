# 巨潮资讯上市公司报告（社区）运行预检

- 检查时间：2026-10-02T03:27:08.222Z
- 检查人：codex-preflight
- 包：`@youhaozhao/cninfo-mcp@1.4.1`
- npm integrity：`sha512-lH9UmmBhm0xvyQk76rlwMuj25s3jc35K7m6AgO075LOJnm9LdbzAqxpRQbM98gYDxXnhndgobqVdI07TjRM9bw==`
- 协议：`2025-06-18`
- 服务：`cninfo-server 1.4.1`
- 工具数：2
- 运行结论：**DEFERRED**

## 已通过

- npm 发布包在禁用安装脚本的条件下解包审计；Python 依赖只安装到临时 venv。
- `initialize` 与 `tools/list` 通过。
- 使用公开证券代码 `000001`、年度 `2024` 调用 `query_annual_reports_tool`，年报元数据查询返回成功。
- 未调用 `download_annual_reports_tool`，未下载文件，也未向项目或用户目录写入报告。
- 工具响应只记录 SHA-256，未保存原始数据；凭据扫描通过。
- stdout 和 stderr 均没有非协议输出。

## 发现的工具

1. `query_annual_reports_tool`
2. `download_annual_reports_tool`

两个工具均未声明 `readOnlyHint` / `destructiveHint`。其中下载工具会创建目录并写入 PDF，属于明确副作用。

## 阻塞项

1. 2026-10-02 查询 Official MCP Registry 未发现 `cninfo`；当前只有社区仓库和 npm 包证据，并非巨潮资讯官方发布。
2. 元数据查询使用 `http://www.cninfo.com.cn/new/...` 明文 HTTP；只有静态文件下载使用 HTTPS，存在传输完整性风险。
3. npm 启动器会在 `~/.cninfo-mcp/venv` 创建持久化 Python 虚拟环境，并在启动时自动执行 pip 安装。
4. 下载工具默认写入包内 `python/pdf`，也允许调用者指定任意 `save_path`；市场当前交互不足以明确展示和确认写盘范围。
5. 工具未提供 MCP 安全 annotations，且上游数据再利用条款尚未形成可审核证据。

## 结论

协议与只读查询链路可用，但当前包的明文 HTTP、启动安装副作用和文件写入边界不满足正式市场门槛。
不得调用下载工具，也不得据此迁入 `connectors/`。

原始响应、进程日志和会话信息均未保存；仅保存工具名、状态与响应哈希。
