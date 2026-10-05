# 巨潮资讯上市公司报告（独立社区维护）运行验收

- 最终检查时间：2026-10-05T07:51:36Z
- 检查与审核人：DuHu
- 包：`@duhu2000/cninfo-mcp@1.4.3`
- npm integrity：`sha512-ic9nsYaRnEPYzbbUED594uiOxJyHBnkdJQBJZG2+sjWcm5xjlyetgBFy+ya5jw7UBkAr4w72vNTi8u8p5U9/gg==`
- 仓库版本：`duhu2000/cninfo-mcp@v1.4.3`
- Official MCP Registry：`io.github.duhu2000/cninfo-mcp@1.4.3`，状态 `active`
- 工具数：1
- 运行结论：**PASS**

## 修复后的发布边界

- 纯 Node.js stdio 包；不再创建 Python 虚拟环境，也没有 `postinstall`、pip 或启动时下载。
- 查询端点和返回的巨潮资讯静态文件链接均限制为 HTTPS。
- 仅保留 `query_annual_reports_tool`；移除原下载工具，不创建目录、不下载 PDF、不接受任意写盘路径。
- 工具声明 `readOnlyHint: true`、`destructiveHint: false`。
- 支持年度报告、半年度报告、第一季度报告、第三季度报告和招股书的只读元数据查询。
- 本项目由 DSH/QCC 独立社区维护，并非巨潮资讯官方产品；卡片与 README 均不得暗示官方背书。

## 安装与供应链检查

- npm 官方 Registry 回读 `@duhu2000/cninfo-mcp@1.4.3` 成功，版本与完整性哈希一致。
- `npm pack` 仅包含 `LICENSE`、`README.md`、`bin/cninfo-mcp.mjs`、`lib/cninfo.mjs`、`package.json` 和 `server.json`。
- 在全新临时目录从打包产物安装成功，仅安装 5 个包；没有生命周期脚本和用户目录写入。
- `npm audit --omit=dev` 返回 0 个漏洞。
- Official MCP Registry 的远端校验通过并发布成功，Registry 回读状态为 `active`。

## 协议与真实只读调用

1. 全新安装后的 MCP `initialize` 成功。
2. `tools/list` 返回且仅返回 `query_annual_reports_tool`。
3. 工具 annotations 明确为只读、非破坏性。
4. 使用公开证券代码 `000001`、年度 `2024`、报告类型 `annual` 执行真实调用。
5. 返回状态 `complete`、结果数 `1`，首条记录为平安银行，并提供巨潮资讯 HTTPS 原始 PDF 链接。

验收过程没有使用凭据、个人数据或客户数据，没有下载文件，没有写入用户目录，也没有把原始响应保存到仓库。

## 历史问题处理

2026-10-02 对 `@youhaozhao/cninfo-mcp@1.4.1` 的预检结论为 `DEFERRED`，原因包括明文 HTTP、启动时创建 Python venv、下载工具写盘和缺少 annotations。整改建议保留在上游
[`youhaozhao/cninfo-mcp#8`](https://github.com/youhaozhao/cninfo-mcp/issues/8)。

正式卡片没有声称原包已修复，而是固定使用经过独立重写和验收的 `@duhu2000/cninfo-mcp@1.4.3`。原阻塞不再适用于该固定版本。
