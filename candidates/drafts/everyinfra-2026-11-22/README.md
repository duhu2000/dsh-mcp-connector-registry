# EveryInfra 万有引擎上架评估

当前状态：代表性免费能力目录调用 PASS，DuHu 于 2026-11-23 具名批准上架；正式卡片和候选记录已准备，待 PR 合并发布。drafts 下卡片保留 published=false 的草案快照，正式卡片位于 connectors/everyinfra-public-data.json。

## 验收范围

默认入口 https://api.everyinfra.com/mcp，Streamable HTTP + Bearer API Key。无凭据 initialize/tools/list 均 HTTP 200，发现12个工具；这些公开请求本身不能证明 Key 有效。

用户报告在已配置凭据的 DSH 仅调用一次 everyinfra_list_capabilities({}) 成功，返回110个平台并包含 Amazon。证据见 evidence/runtime-success-2026-11-23.json。仅免费能力目录验收通过，其余工具、收费数据查询未验收。未获取原始响应；exact execution timestamp 未提供，记录 checkedAt 为证据复核时间。价格及平台数量为返回快照，不承诺固定价格或未来覆盖范围。

此前 platform=amazon 的一次调用返回 fetch failed，保留失败证据。用户曾要求忽略，后明确恢复测试并提供成功结果；本次成功不证明上次失败原因，不将两次独立授权执行写成自动重试。

## 接入和服务边界

公开服务条款 https://everyinfra.com/terms 已核实，无需条款例外。运营地域为海外（新加坡/美国，官方自述，未独立核验工商主体）。EveryInfra 为第三方聚合服务，并非来源平台官方接口，使用者仍须遵守来源平台条款。

默认12工具中含客服工单写入，不能整体宣称只读。本卡片不接入 /mcp/all。默认示例先空参数读取免费目录并从结果筛选 Amazon，不自动追加收费查询、账户操作或工单。无凭据、个人数据或客户数据入库。

## 发布

仅更新 Registry 卡片、验收记录和生成目录，无插件代码变更，不需要 tag 或 npm 发布。
