# 国家统计局公共统计（社区）运行预检

- 检查时间：2026-10-02T03:22:40.044Z
- 检查人：codex-preflight
- 包：`national-stats-mcp@2.0.0`
- npm integrity：`sha512-0pqFKl3VDn/cQzuQkG70eCHLxZolXvmOsZ+Av2nh4jvTt87qlxC7dtuK+6s1JEbxxKokpLyAXYfPtbpiWWrvdQ==`
- 协议：`2025-06-18`
- 服务：`national-stats-mcp 2.0.0`
- 工具数：6
- 运行结论：**DEFERRED**

## 已通过

- 固定 npm 版本在禁用安装脚本的临时目录中安装。
- `initialize` 与 `tools/list` 通过。
- `list_provinces` 本地只读工具调用通过。
- 使用公开关键词 `GDP` 执行 `search_statistics`，真实国家统计局查询链路返回成功。
- 工具响应只记录 SHA-256，未保存原始数据；凭据扫描通过。
- stdout 没有非协议输出。

## 发现的工具

1. `search_statistics`
2. `browse_tree`
3. `get_indicators`
4. `get_data`
5. `search_and_get`
6. `list_provinces`

所有工具的 `readOnlyHint` 均未声明，`destructiveHint` 也未显式声明。代码语义是查询型，
但当前严格门槛不能仅凭名称或实现推断无副作用。

## 阻塞项

1. 2026-10-02 查询 Official MCP Registry 未发现 `national-stats-mcp`；当前只有社区仓库和 npm 包证据。
2. npm 元数据和 README 声明 MIT，但发布包的 `License` 文件实际为 Apache License 2.0。
3. 发布包还嵌入 `national-stats-mcp-1.1.0.tgz`、`national-stats-mcp-1.2.0.tgz`，需要维护者解释发布边界。
4. API 客户端会把搜索 URL、请求参数或数据请求 payload 写到 stderr。虽然没有凭据，仍可能记录用户研究关键词、地区和时间范围。
5. 工具缺少 MCP 只读/破坏性 annotations。

## 结论

协议、工具发现和公开数据查询链路已经证明可用，但许可证、日志与工具注解三项尚未满足正式市场门槛。
不得将本报告写成“运行验收通过”，也不得据此迁入 `connectors/`。

原始响应、进程日志和会话信息均未保存；仅保存工具名、状态与响应哈希。
