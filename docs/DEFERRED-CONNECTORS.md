# 延期连接器与复核队列

本清单记录对标市场中暂未安全上架的候选，以及已上架但仍需复核的健康项。它不是收录承诺，
也不保留 `id`；服务商或贡献者仍应按 [`ONBOARDING.md`](ONBOARDING.md) 提交可验证资料。

更新时间：2026-09-02。

## 上架门槛

候选只有在以下条件同时满足后才进入 `connectors/*.json`：

1. 有服务商官方资料或可明确归属、可审计的开源 MCP Server；
2. 能提供固定 HTTPS MCP 端点，或可信的 stdio 安装包与确定的 `command` / `args`；
3. 鉴权可以用 Registry Schema 的 `oauth2-pkce`、`bearer`、`api-key` 或 `none` 表达；
4. 描述文件不携带 Token、API Key、密码、Cookie、Client Secret 或其他真实凭据；
5. HTTP 端点可通过无凭据探针识别为 MCP；stdio 条目只校验描述，探针不执行本地命令；
6. Logo、主页、中文名称、分类和服务商关系可核验，且没有已知弃用公告。

## 已确认的特殊阻塞

| 候选 | 当前阻塞 | 重新评估条件 |
|---|---|---|
| `tencent-map` | 现有示例把密钥放在 URL Query，插件目录不支持也不应插入 URL 密钥 | 官方提供 Header/env 鉴权或无密钥公开 MCP 端点 |
| `modao` | 现有 CLI 示例把 Token 放在命令参数；市场 stdio 凭据只允许安全绑定到 env | 官方 Server 支持环境变量或标准 HTTP 鉴权 |
| `remotion` | 先前官方资料已标记相关 MCP 方案弃用 | 发布新的受维护官方 MCP Server |
| `agentearth` | 已找到的包是 CLI，尚不能确认其为 MCP Server | 官方给出 MCP 启动命令、协议说明和鉴权文档 |
| `tencent-meeting` | 当前方案依赖额外 Token Header、版本 Header 或本地代理，通用描述不完整 | 官方固定端点和完整鉴权/版本协商说明 |
| `sealos` | 已确认 SDK/平台资料，未确认公开 MCP Server | 官方 MCP 端点或受维护的开源 Server |
| `coderabbit` | 未确认可供第三方客户端使用的公开 MCP Server | 官方 MCP 配置文档和可探针端点 |
| `google-workspace` | Gmail、Drive、Docs、Sheets、Slides、Calendar、Chat、People 等官方 MCP 需要用户提供固定 OAuth Client ID/Secret；当前插件仅支持 DCR，无法完成该授权流程 | 插件先支持“静态 OAuth Client ID/Secret + PKCE”、本机安全存储和完整回归测试 |
| `blender` | 官方 MCP 会在 Blender 中无防护执行 LLM 生成的 Python 代码，现有市场交互不足以表达任意代码执行风险 | 完成显式风险确认、命令预览、隔离环境与安装流程验收后单独评估 |
| `fayan-legal`、`mozun-trademark`、`ths-legal`、`mingbai-lawyer` | 未核验到可公开接入的官方 MCP 端点 | 服务商提交官方端点、鉴权和 Logo 来源 |

## 本轮保留的待验收数据 MCP

以下 3 个候选来自 2026-09-02 的数据 MCP 自动发现流程，具有继续跟进价值，但尚未满足当前只读运行验收门槛。它们并非被拒绝，也不计入本批正式 Connector 数量：

| 候选 | 已确认信息 | 当前阻塞 | 重新评估条件 |
|---|---|---|---|
| `pasal-id` | 公开 MCP 端点可识别，未授权请求返回 HTTP 401，并能获取 OAuth 元数据 | 实际数据访问需要 OAuth 或个人访问令牌，当前没有最小权限测试凭据，无法完成脱敏只读运行验收 | 服务方提供测试账户或最小权限 Token，并完成一次明确只读、无副作用的运行报告 |
| `eu-trade-explorer` | 公开端点可完成初始化和工具发现 | 工具没有提供可核验的 `readOnlyHint`；当前流程不能仅凭名称推断其无副作用 | 服务方补充只读注解，或维护者形成不削弱现有门槛的明确安全验收方法并完成运行报告 |
| `cenogram` | 公开端点可识别，未授权请求返回 HTTP 401，并能获取 OAuth 2.1 / API Key 鉴权信息 | 实际数据访问需要授权，当前没有最小权限测试账户，无法完成脱敏只读运行验收 | 服务方提供最小权限测试账户或 API Key，并完成一次明确只读、无副作用的运行报告 |

## 等待权威接入资料

以下候选来自既有对标清单，但仍缺少固定端点、官方 stdio 命令、鉴权说明或服务商归属证据。
在资料补齐前不根据竞品 UI 文案猜测 URL，也不把普通 REST/SDK 包装成 MCP：

- 金融投资：`ths-ifind`、`hsjy-mcp`、`morningstar`、`jinmen-research`、`tongzhou-research`
- 办公协作：`weiyun`、`baidu-netdisk`、`jinshuju`、`tencent-survey`
- 调研分析：`jiushuyun-bi`、`ctrip`、`sorftime`、`jike-spatial`
- 科学数据：`materials-project`、`oqmd`、`chembl`、`uniprot`、`pubchem`、`pubmed-pmc`、`sec`、`imf`、`arxiv`（当前主要为社区封装或缺少稳定官方 MCP 发布）
- 设计创意：`picset-ai`、`jirui-video`
- 效率工具：`xiaoshouyi`、`fxiaoke`、`xiaobangbang`、`moka-hr`、`beisen-hr`、
  `chuanyun`、`seeyon`、`jiandaoyun`、`xinzhi`

## 已上架但需复核

### Temporal

2026-08-24 手动健康巡检
[`Registry health #3`](https://github.com/duhu2000/dsh-mcp-connector-registry/actions/runs/32733581240)
中，61 个连接器有 60 个 `pass`、1 个 `partial`。`temporal` 的 MCP 端点可达且协议识别成功，
但 OAuth 动态客户端注册地址返回 HTTP 404。当前不因一次部分异常自动下架；后续应核对 Kapa/Temporal
官方授权方式，修正 `issuer` / DCR 配置，或在官方确认无需授权时调整鉴权模式，再要求探针达到 `pass`。

## 处理原则

- 每次复核须在 PR 中链接官方资料和探针证据；没有证据就继续延期。
- 不为达到市场数量目标降低密钥边界、来源核验或可达性要求。
- 定时健康探针只生成维护报告；一次波动不自动删除社区连接器。
- 候选被安全上架或明确放弃后，从本清单移除并在 PR 中说明原因。
