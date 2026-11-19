# 摩熵 · 医药研发数据上架准备（2026-11-19）

状态：DEFERRED，待本机授权连接与业务验收；尚未发布。

## 已核实

- 官方专门文档：https://open.bcpmdata.com/mcp ，用户提供配置与文档一致。
- 官方端点 https://openmcp.bcpmdata.com/general/sse ，Header apiKey，不加 Bearer。
- 匿名 GET 200 事件流、POST initialize 405。当前插件将 sse 归一为 streamable-http，因此不可将直连配置格式通过视为传输可用。
- 拟采用固定 mcp-remote@0.16.7、sse-only、stdio 兼容接入。真实 Key 从 DSH credentialBindings 注入环境变量，命令参数仅保留变量占位符。未开启 debug，使用 silent。
- 本机虚构 SSE 服务验证了 initialize、tools/list、GET/POST Header 注入、进程输出无测试凭据。此结果不是厂商验收。
- 无凭据远程工具发现被现有敏感内容检测器停止（tools/list contained credential-shaped content）。未保存原始响应，不推断实际密钥泄露，也不绕过过滤器。需用户本机观察安全工具清单。
- 中文示例已给出具体研究主题，无“研究问题”必填占位符；需在真实工具清单返回后核对能力。

## 本机连接

导入 bcpmdata-dsh-import.template.json，把 YOUR_API_KEY 只在 DSH 本机替换为真实 Key。模板从 npm 启动固定版本兼容程序，需本机 Node.js/npm 和网络。不要把填写后的文件提交或发送。
先仅连接、查看工具数量及名称，不执行查询。若此前直连出现 405，不代表 Key 失效。

## 后续验收与上架

1. 核对真实连接、工具名、参数、费用/订阅范围；官方公开限流为每秒 1 次、每日 100 次（可按签约调整），不是免费额度承诺。
2. 选择单次少量只读查询，费用未知时先取得明确额度授权。不下载全文、不查询个人数据、不自动重试。
3. 记录脱敏结果、实际测试范围和服务条款。再按实际证据申请正式 PASS 或具名 connection-only partial，不继承其他厂商的批准。
4. 迁入正式目录并生成目录文档、提交 PR、合并后核验 CDN。本方案若经真实 DSH 验证，仅需 Registry 更新，无需为它单独发布插件 npm。

适配器 MIT 许可仅适用于适配软件；厂商数据服务条款仍待核验。未保存 Key、会话标识、个人或业务数据。
