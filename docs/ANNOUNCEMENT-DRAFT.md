# 新数据源宣传素材草稿（未发布）

供运营审核选用；不得将部分验证宣传为全部业务可用。未自动发布到任何平台。

### 2026-11-18 · 外贸公社 · 贸易数据

海关贸易 / 进出口趋势 / 供应链研究。接入方式：oauth2-pkce；探测状态：partial。

DuHu 批准有限验收上架：OAuth、19 个工具发现和一次会话初始化已确认；业务查询尚未验收，状态 partial。商业订阅与权限以服务协议为准。

[上架 PR #84](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/84) · [卡片详情](../connectors/tradesparq-trade-data.json)

### 2026-11-17 · 执中

私募股权、并购、产业链、REITs。接入方式：api-key；探测状态：pass。

DuHu 批准 PE/base 双入口及条款未知例外。PE 一次表目录读取返回 26 张表描述；base 经社区 stdio 桥接一次专利查询返回 100 条采样记录，状态 pass。其余工具、完整 DSH UI、实际费用未核验；样本不代表专利总量。服务条款未公开，尚未核验，不赋予额外数据权利。

[上架 PR #77](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/77) · [卡片详情](../connectors/zerone-private-equity.json)

### 2026-11-16 · 上奇产业通

产业链图谱 / 区域产业研究。接入方式：api-key；探测状态：pass。

DuHu 批准上架。连接及 18 个工具发现通过；用户回传一次“新能源汽车”产业链图谱查询成功，状态 pass。其余 17 个工具未实测，本次不含重点企业列表，数据来源和更新时间未知。官方服务条款未公开、尚未核验，按具名例外批准，不视为额外数据使用许可。

[上架 PR #75](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/75) · [卡片详情](../connectors/shangqi-industry-data.json)

### 2026-11-15 · 万方学术文献

中文文献检索 / 学术资料 / 引文研究。接入方式：oauth2-pkce；探测状态：pass。

DuHu 批准上架。OAuth 连接、2 个工具发现及用户回传的一次 search 元数据检索通过：2023—2025 年钠离子电池储能主题，命中 310 条、返回 3 条，状态 pass。未调用 fulltext、未下载全文或重试；检索与下载费用以账号权益为准，不声明免费。

[上架 PR #74](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/74) · [卡片详情](../connectors/wanfang-literature-data.json)

### 2026-11-15 · OpenBoost 跨境数据

Amazon / TikTok / 跨境选品与竞品研究。接入方式：api-key；探测状态：partial。

初次按连接及 104 个工具发现的有限验收上架。2026-11-15 单次 Amazon 趋势查询返回 HTTP 401 / API_KEY_INVALID，无业务数据；未重试，实际扣费未核实，保持 partial。该结果仅反映本次账号调用，不代表服务整体不可用。后续验收记录见 PR #72。

[上架 PR #67](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/67) · [卡片详情](../connectors/openboost-cross-border-data.json)

### 2026-11-15 · 克而瑞·深度智联地产数据

地产问数 / 城市对比 / 行业知识。接入方式：bearer；探测状态：pass。

初次按有限验收上架；2026-11-15 后续问数单城市、单月查询成功返回非空结构化数据，实际扣费 10 积分，状态更新为 pass（PR #72/#73）。问知、其他领域及长期稳定性尚未验收。

[上架 PR #67](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/67) · [卡片详情](../connectors/cric-deeplink-real-estate.json)

### 2026-11-14 · 飞常准航空数据

航班动态 / 中转方案 / 机场天气 / 实时位置 / 机票价格。接入方式：api-key；探测状态：pass。

API Key 连接、9 个工具发现及免费日期调用通过；2026-11-15 后续 PEK 机场天气单次查询成功，扣除赠送积分 10 分，状态更新为 pass（PR #72/#73）。其他收费工具、OAuth 及长期稳定性尚未验收。

[上架 PR #65](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/65) · [卡片详情](../connectors/variflight-aviation-data.json)
