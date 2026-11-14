# OpenBoost 本机连接预检（不等于业务运行验收）

复核日期：2026-11-14；时区：Asia/Shanghai。

## 观察结果

- 用户确认已有 OpenBoost 套餐，自行在本机输入 Key 并提交连接；助手不记录 Key。
- 客户端：DSH MCP连接器 v0.2.106；通过 Chrome 已登录的本机 DSH 界面复核。
- 手动连接名：OpenBoost 跨境数据（验收）。
- 服务名：`openboost_cross_border_data`。
- 公开端点：`https://mcp.openboostai.com/mcp-servers/openboost-all-mcp`。
- 配置方式：API Key，官方 Header 名 `secret-key`；不保存实际 Header 值。
- 已安装页：已连接，可用性确认 ok。
- 最近成功工具发现：2026-11-14 21:39:07 +08:00；缓存 104 个工具。
- 全局工具搜索可定位 `account_order_create` 与 `account_order_status`；只查看工具描述和参数。
- 下单工具描述表示按 planId 创建订单并返回支付链接/二维码；连接详情显示“已允许 · 默认策略”。
- 手动连接详情及全局工具视图未发现独立禁用控件；未修改权限，未宣称已禁用。

## 结论与边界

连接及工具发现：通过本机 UI 复核。真实业务运行：未执行，保持 not-run。
匿名 initialize/tools/list 同样成功，故上述结果不能单独证明 Key 有效、业务数据访问权限
或套餐权益。没有执行任何 tools/call、创建订单、购买或付费查询；不保存截图中的其他
会话、账号资料、凭据或客户数据。此记录不证明大陆直连或长期稳定性。

## 后续放行条件

1. 核实一个只读查询的实际费用/套餐额度规则，并取得具体次数和预算授权后验收。
2. 落实下单工具权限隔离；Prompt 中禁止下单不能代替 Host 层拒绝策略。
3. 核对服务条款、运营/签约主体、数据使用边界。
4. 完成具名人工审核，再迁入正式目录。当前记录与卡片草案仍为 pending / published=false。
