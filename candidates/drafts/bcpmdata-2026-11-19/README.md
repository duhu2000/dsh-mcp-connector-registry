# 摩熵 · 医药研发数据上架准备（2026-11-19）

状态：业务验收 PASS（单次列表查询、用户执行报告）；待条款核验及最终具名批准，尚未发布。

## 已核实

- 官方专门文档：https://open.bcpmdata.com/mcp ，用户提供配置与文档一致。
- 官方端点 https://openmcp.bcpmdata.com/general/sse ，Header apiKey，不加 Bearer。
- 匿名 GET 200 事件流、POST initialize 405。当前插件将 sse 归一为 streamable-http，因此不可将直连配置格式通过视为传输可用。
- 拟采用固定 mcp-remote@0.16.7、sse-only、stdio 兼容接入。真实 Key 从 DSH credentialBindings 注入环境变量，命令参数仅保留变量占位符。未开启 debug，使用 silent。
- 本机虚构 SSE 服务验证了 initialize、tools/list、GET/POST Header 注入、进程输出无测试凭据。此结果不是厂商验收。
- 无凭据远程工具发现被现有敏感内容检测器停止（tools/list contained credential-shaped content）。未保存原始响应，不推断实际密钥泄露，也不绕过过滤器。需用户本机观察安全工具清单。
- 中文示例已给出具体研究主题，无“研究问题”必填占位符；需在真实工具清单返回后核对能力。

## 2026-11-19 本机连接核验

用户确认兼容模板导入成功。读取 DSH 安全工具目录缓存，最近成功时间为北京时间 2026-11-19 09:50:11，bcpmdata-server 共 114 个工具，未截断。证据见 evidence/dsh-tool-discovery.json。本次核验未发起网络请求或业务查询；缓存成功不代表所有工具业务执行通过。

## 本机连接

导入 bcpmdata-dsh-import.template.json，把 YOUR_API_KEY 只在 DSH 本机替换为真实 Key。模板从 npm 启动固定版本兼容程序，需本机 Node.js/npm 和网络。不要把填写后的文件提交或发送。
先仅连接、查看工具数量及名称，不执行查询。若此前直连出现 405，不代表 Key 失效。

## 后续验收与上架

1. 核对真实连接、工具名、参数、费用/订阅范围；官方公开限流为每秒 1 次、每日 100 次（可按签约调整），不是免费额度承诺。
2. 选择单次少量只读查询，费用未知时先取得明确额度授权。不下载全文、不查询个人数据、不自动重试。
3. 记录脱敏结果、实际测试范围和服务条款。再按实际证据申请正式 PASS 或具名 connection-only partial，不继承其他厂商的批准。
4. 迁入正式目录并生成目录文档、提交 PR、合并后核验 CDN。本方案若经真实 DSH 验证，仅需 Registry 更新，无需为它单独发布插件 npm。

适配器 MIT 许可仅适用于适配软件；厂商数据服务条款仍待核验。未保存 Key、会话标识、个人或业务数据。

## 单次业务验收结果

用户在 DSH 完成 GeneralV1_CnClinicalTrialList 一次查询，page=1、search.drug_name=司美格鲁肽，报告 code 10200、message 为空、返回10条、total 92。没有重试、翻页、详情调用或下载；助手未重放请求。证据见 evidence/runtime-acceptance.json，准确执行时间未提供，记录时间不冒充执行时间。

本次列表没有独立试验名称和试验状态字段，药品名称不能替代试验名称，NA 按缺失处理。卡片首条示例已改为经核实的查询参数及实际返回字段。费用未回传，仍为未知。PASS 仅覆盖这次列表查询，不表示114个工具或全文、专利等其他能力全部通过。
