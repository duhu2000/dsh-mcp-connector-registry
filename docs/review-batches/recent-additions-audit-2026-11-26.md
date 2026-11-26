# 近期新增目录完整性核查（2026-11-26）

核查基线：main `cc2d05b3d7b11ced462ab25dcd1a3d52b995f584`。以 GitHub 已合并 PR 的合并时间（Asia/Shanghai）和合并差异中新增的 `connectors/*.json` 为依据，逐项对照正式卡片、`docs/catalog-additions.json` 及其生成文档。

## 结论

- 2026-11-14 至 2026-11-26：29 张新增正式卡片，修复前收录 28 张，遗漏 IPinfo（PR #121）。
- 已补齐 IPinfo 的 2026-11-26 上架记录与验收范围；29 张卡片的上架日期、PR 和正式卡片 ID 均核对一致，无重复条目或未发布候选。
- 根因：生成器只渲染 `docs/catalog-additions.json` 中的记录；正式卡片存在不会自动生成上架历史，因此构建通过不能证明历史记录完整。
- 公共目录为 141 张卡片；“近期新增”覆盖上述 29 张，较早的 112 张不属于本轮近期记录范围。历史上架时间未在本轮逐项回溯，不能将此页面称为全部历史清单；全部卡片请查看[完整分类目录](../CONNECTOR-DIRECTORY.md)。
- 同步重新生成[近期新增](../RECENT-ADDITIONS.md)及宣传素材草稿，卡片及验收状态保持不变。

## 逐项核对

| 上架日期（北京时间） | 卡片 | 合并证据 | 结果 |
|---|---|---|---|
| 2026-11-26 | [AQUAVIEW · 海洋与环境数据](../../connectors/aquaview-ocean-environment.json) | [#122](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/122) | 已收录 |
| 2026-11-26 | [IPinfo · IP地理与网络数据](../../connectors/ipinfo-ip-data.json) | [#121](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/121) | 已收录 |
| 2026-11-25 | [NASA Earthdata · 地球科学数据目录](../../connectors/nasa-earthdata-cmr.json) | [#117](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/117) | 已收录 |
| 2026-11-25 | [Open Targets · 疾病与靶点数据](../../connectors/open-targets-platform.json) | [#117](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/117) | 已收录 |
| 2026-11-25 | [摩知轮商标检索](../../connectors/mozlen-trademark.json) | [#115](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/115) | 已收录 |
| 2026-11-23 | [享科 · 期货数据](../../connectors/xiangke-futures.json) | [#106](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/106) | 已收录 |
| 2026-11-23 | [EveryInfra 万有引擎 · 公开数据与搜索](../../connectors/everyinfra-public-data.json) | [#104](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/104) | 已收录 |
| 2026-11-22 | [新一线城市数据库](../../connectors/yicai-zhicheng-city-data.json) | [#102](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/102) | 已收录 |
| 2026-11-22 | [Agent Rynku · 波兰证券数据](../../connectors/agentrynku-gpw-data.json) | [#101](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/101) | 已收录 |
| 2026-11-21 | [极鲸云 · SHEIN市场数据](../../connectors/geekbi-shein-data.json) | [#100](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/100) | 已收录 |
| 2026-11-21 | [西柚洞察 · 亚马逊运营数据](../../connectors/xydc-amazon-data.json) | [#99](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/99) | 已收录 |
| 2026-11-21 | [东方财富妙想 · 金融数据](../../connectors/eastmoney-miaoxiang.json) | [#98](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/98) | 已收录 |
| 2026-11-21 | [同花顺 iFinD · 金融数据](../../connectors/ifind-financial-data.json) | [#97](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/97) | 已收录 |
| 2026-11-20 | [财汇 · 金融与风险数据](../../connectors/finchina-financial-risk-data.json) | [#96](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/96) | 已收录 |
| 2026-11-20 | [聚源金融综合问数](../../connectors/gildata-financial-query.json) | [#95](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/95) | 已收录 |
| 2026-11-20 | [大智慧 · 金融数据](../../connectors/dzh-financial-data.json) | [#93](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/93) | 已收录 |
| 2026-11-19 | [ZooData · 电商市场数据](../../connectors/zoodata-commerce-data.json) | [#92](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/92) | 已收录 |
| 2026-11-19 | [FastMoss · TikTok电商数据](../../connectors/fastmoss-tiktok-commerce.json) | [#91](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/91) | 已收录 |
| 2026-11-19 | [亿欧数据 · 产业投融资](../../connectors/iyiou-financing-data.json) | [#90](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/90) | 已收录 |
| 2026-11-19 | [权大师商标查询](../../connectors/quandashi-trademark.json) | [#89](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/89) | 已收录 |
| 2026-11-19 | [Patentics 专利检索与分析](../../connectors/patentics-patent-research.json) | [#88](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/88) | 已收录 |
| 2026-11-19 | [摩熵 · 医药研发数据](../../connectors/bcpmdata-pharma-research.json) | [#87](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/87) | 已收录 |
| 2026-11-18 | [外贸公社 · 贸易数据](../../connectors/tradesparq-trade-data.json) | [#84](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/84) | 已收录 |
| 2026-11-17 | [执中](../../connectors/zerone-private-equity.json) | [#77](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/77) | 已收录 |
| 2026-11-16 | [上奇产业通](../../connectors/shangqi-industry-data.json) | [#75](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/75) | 已收录 |
| 2026-11-15 | [万方学术文献](../../connectors/wanfang-literature-data.json) | [#74](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/74) | 已收录 |
| 2026-11-15 | [克而瑞·深度智联地产数据](../../connectors/cric-deeplink-real-estate.json) | [#67](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/67) | 已收录 |
| 2026-11-15 | [OpenBoost 跨境数据](../../connectors/openboost-cross-border-data.json) | [#67](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/67) | 已收录 |
| 2026-11-14 | [飞常准航空数据](../../connectors/variflight-aviation-data.json) | [#65](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/65) | 已收录 |
