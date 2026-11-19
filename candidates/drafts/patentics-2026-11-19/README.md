# Patentics 上架评估与验收

状态：技术验收 PASS；DuHu 已于 2026-11-19 明确批准上架、提交 PR 和合并。正式卡片位于 connectors/patentics-patent-research.json（仓库根目录）；本目录同名卡片保留为未发布草案备份。

## 接入及验收

- 国内提供方 Patentics，运营主体为索意互动（北京）信息技术有限公司及其关联公司。
- Streamable HTTP：https://www.patentics.com/mcps/mcp；API Key Header 为 apikey，原样输入，不加 Bearer。凭据只在本机填写。
- 无凭据 initialize 返回 HTTP 401 / INVALID_API_KEY；授权连接后 DSH 发现21个工具、1个入口。
- 2026-11-19 DSH 界面14:23：经用户授权最多0.1积分，get_patent_abstract 查询 CN106257978A 一次，返回有效金属颗粒及其制造方法摘要。助手展开并核对实际调用输入输出。
- 未重试、未调用余额/报价或其他工具、未下载全文。实际扣费未回传，无法独立核实。其余20个工具未逐项实测。
- 3个高级分析工具描述要求配套 Skill，不承诺仅连接即可执行全部高级分析。

## 条款与范围

已核实[官方服务条款与隐私权政策](https://www.patentics.com/yinsi.html)及[MCP指南](https://www.patentics.com/mcph/)。条款为厂商商业服务协议，非开源数据许可；卡片仅提供本人账号连接配置，不授予额外数据再分发、转售权利。专利结果需核对权威原文，账号权益与费用按服务商约定。无需条款例外。

官网存在100积分/100次调用的体验文案差异，以实际账号为准，卡片不承诺固定免费次数。

## 证据

见 evidence/ 下的公开探测、DSH工具发现、21工具描述复核、单次业务验收、条款复核和 DuHu 批准记录。无 Key、Token、账号余额或个人数据。
