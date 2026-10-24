# DataSinking #49 / Vostride #38 增量验收

日期：2026-10-24。记录由助手执行公开资料复核与原生 Desktop 检查；不冒充具名人工批准。
本次不增加正式连接器，不重写已通过的历史测试，不保存 Key、Cookie、会话 Token、完整日志或私人会话截图。

## DataSinking #49：接入契约尚未闭合

- 已审 head：`3f36ae6d765e1bcf12945f516e6970e16ac88dd9`，没有新的供应商说明。
- [官方 MCP 专页](https://datasink.ing/docs/mcp) 明确提供获取免费 Key 和 Bearer 配置路径；
  [服务条款](https://datasink.ing/terms)要求 Key；[价格页](https://datasink.ing/pricing)描述 Key 级额度。
- PR 当前 `auth.mode: none`。历史匿名调用成功只证明端点当时接受请求，不能证明匿名服务适用条款、额度或长期使用权。
- 可行路径：供应商补充匿名 MCP 的官方适用规则；或改为官方 Bearer 模式，并由有权使用该 Key 的用户在本机录入后重新验收。
  不自行注册、购买或读取其它连接的凭据，不把 Key 放入查询 URL、日志或公开材料。
- 保留 2026-10-20 的三次公开财报只读烟测证据，不重复读取财报；该证据不能替代 Key 路径或 Desktop 验收。
- CI `39540580080` 的新增连接器门禁仍失败；不改评分、人工批准或条款状态来绕过门禁。
- 结论：本次不合并 #49，不上架 DataSinking。等待用户选择接入路线及供应商适用规则证据。

## Vostride #38：技术验收新增完成，条款仍待补齐

#38 是收录 Issue，不是可直接合并的 PR；现有文件仅在 `candidates/drafts/`。

### 当前协议与范围

在 `2026-10-24T05:49:35.823Z` 完成 initialize / initialized / tools/list，
服务 `vostride-docs` 1.3.0，协议 `2025-06-18`，无后续分页。
4 个工具为 `search_agent_qa_docs`、`search_vostride_content`、`search_agent_qa_library`、`read_agent_qa_page`。
全部现场声明只读、非破坏、幂等，开放世界提示为 false；注解只是服务端声明，不是安全保证。
工具输入/说明均指向 Vostride 公开内容搜索与 Markdown 阅读，不包含本地测试执行。
未把官方 `agent-qa` 本地包的执行工具计入此远程连接器。

### macOS DSH Desktop 增量回归

1. 原生应用 `dsh-app://app/`，MCP连接器界面版本 `0.2.79`。
2. JSON 导入唯一临时连接 `registry-vostride-desktop-test`，端点 `https://vostride.com/mcp`，
   Streamable HTTP、无 Key；限定既有专用隔离验收工作区，不设为全局。
3. 界面确认已连接，工具详情显示 1 个服务 / 4 个工具。
4. 新建该隔离工作区会话，明确禁止其它工具、本地仓库、QA 执行与凭据发送。
   轨迹起始时间 `2026-10-24T13:56:07+08:00`，实际仅出现一次
   `mcp__registry-vostride-desktop-test__read_agent_qa_page`，参数 `{"path":"/docs/agent-qa/mcp"}`。
5. 核对实际轨迹输出而非只采信模型结论：返回非空可读 Markdown、页面标题及
   `https://vostride.com/docs/agent-qa/mcp` canonical 来源；最终回答区分文档阅读与本地 QA 执行。
6. 完成后在界面停用临时连接，复核 `已停用` 和 checkbox=0。保留可恢复配置与验收会话，未删除个人资料或改变其它连接。

只证明本次 macOS 单工具业务路径；其它 3 个工具仅发现与契约核对，未执行，不宣称全部工具或其它平台通过。
机器可读摘要：[acceptance-2026-10-24.json](../../candidates/drafts/vostride-2026-10-22/acceptance-2026-10-24.json)。

### 仍然阻断上架的条件

- [官方文档](https://vostride.com/docs/agent-qa/mcp)支持公开免鉴权文档端点；
  [隐私页](https://vostride.com/privacy)覆盖文档 MCP，但不能代替服务使用/收费/限额规则。
- 本次 `/privacy` HTTP 200，`/terms` HTTP 404；这仅说明所查路径状态，不能证明供应商没有其它条款页面。
- 官方本地软件 FSL 许可证不替代托管服务条款。
- 仍需正式候选记录、真实维护者批准和最终上架提交 CI。草案维持 `published: false` / `probeStatus: unverified`。
- 结论：技术证据有新增，但本次不创建或合并正式上架 PR，也不宣称市场卡片上线。
