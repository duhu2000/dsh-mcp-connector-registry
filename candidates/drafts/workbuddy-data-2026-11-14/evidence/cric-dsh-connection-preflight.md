# 克而瑞·深度智联本机连接预检

日期：2026-11-14。仅连接和工具发现，不是业务查询验收。

- 用户确认已有账号与 API Key，并自行在 Chrome 的 DSH 表单录入 Key、提交连接。
- 客户端 MCP连接器 v0.2.106；Streamable HTTP；服务名 `cric_deeplink_real_estate`。
- 官方端点 `https://mcp.dichanai.com/mcp-server`，Bearer 鉴权。
- 匿名 initialize/tools/list 均 HTTP 401；本机录入 Key 后工具发现成功。
- DSH 显示最近成功时间：2026-11-14 22:05:45 +08:00。
- 工具搜索发现 `deeplink_wenshu`（问数）、`deeplink_wenzhi`（问知）。
- 问数参数详情：`query` 必填；`skillVersion` 可选；`skill_version` 与 `token` 为已废弃兼容参数。
  不把 Key 放进工具参数，也不在未加载厂商技能时伪造版本号。
- 未执行 tools/call，未消费业务查询额度；不保存密钥、账号资料或原始界面截图。

## 仍待完成

- 具体查询的积分价格及授权次数/预算；一次明确的只读查询验收。
- 官方建议客户端容忍 600 秒请求；当前 Registry 描述符没有 timeout 字段，不能添加无效字段。
  DSH 真实长查询兼容性尚未验收；首测选择单城市、单指标、小时间范围。
- 服务条款及数据使用边界复核、具名人工审核。查询正常返回空结果也可能扣费，不自动重试。

官方配置与计费说明：https://mcp.dichanai.com/docs
候选记录保持 pending，runtimeAcceptance 保持 not-run。
