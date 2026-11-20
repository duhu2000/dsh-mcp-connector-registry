# 财汇 · 金融与风险数据

## 接入与验收

API Key（Header `x-api-key`），Streamable HTTP；不是 OAuth。用户已连接并发现 42 个顶层工具（40 个导航工具、execute_tool、caihui_mcp_metadata），不代表 42 个业务工具均已验收。

本轮严格执行授权的两次调用：导航 `query_fund_basics_and_issuance` 一次，`execute_tool → get_fund_basic_info` 一次查询基金 510300。不重试、不翻页、不下载。实际费用与扣费次数未知。

代表性查询链路 **PASS**，原五字段目标完整性 **partial**：返回代码、全称和管理人；基金类型、成立日期未匹配，510300.OF 全称为 null。两个代码记录不直接视为两只基金。其余能力未验收。

初评 partial；后核实[官方 FAQ](https://mcp.finchina.com/guide/mcp/tools/faq)明确 code=1 是查询成功但有兼容处理，故基于同一次实际响应复核查询链路为 PASS。未补查、未改写原始请求与限制，也没有将缺失字段写成通过。详见 evidence/runtime-acceptance.json。

## 官方文档与条款

- [接入指南](https://mcp.finchina.com/guide/mcp/tools/usage)：第三方 MCP 客户端、x-api-key、两步查询及积分规则。
- [官网用户协议入口](https://mcp.finchina.com/agreement/user)链接[2026-11-18 用户协议](https://cdn.finchina.com/app/h5/introduce/agreement/agreement-2026-11-18.html)。
- 协议包含账号权益、境内访问与数据存储使用、云网络访问、批量提取及再分发限制。第三方客户端支持不等于数据转售或境外传输许可；具体部署与处理安排以厂商合同为准。
- 使用中性图标，不复制受限制的站点图片。证据摘要和公开资源 SHA-256 见 evidence/public-review.json，未保存协议全文。

## 上架审核

依据本轮用户“请推进上架处理”的明确指令，沿用既定审核人 DuHu；审核记录位于 candidates/records/finchina-financial-risk-data.json。无条款例外，无新增收费调用。预置提示词为可直接使用的中文实例，并披露费用和返回限制。
