# 数据 MCP 自动发现第 2 批审核归档

生成时间：2026-08-31T05:52:00.000Z

Official MCP Registry 快照：2026-08-31T05:39:33.291Z

审核时间：2026-08-31T06:44:43Z

审核人：DuHu

本批 9 个候选均已通过公开端点探测和一次明确只读的脱敏运行预检；DuHu 已逐项确认来源、鉴权、软件许可证、上游数据条款提示、社区独立维护边界及运行报告，批准迁入正式候选记录并生成 Connector 卡片。

| 建议中文卡片 | 首个直接提问示例 | 领域 | 分数 | 公开探测 | 运行预检 | 人工审核 |
|---|---|---|---:|---|---|---|
| OECD 全球公共统计<br><code>io.github.cyanheads/oecd-mcp-server</code> | 比较德国、法国和意大利 2015—2024 年实际 GDP 增速，并注明 OECD 数据集、单位和统计期。 | public, research | 94 | pass | pass | approved |
| IMF 全球宏观经济统计<br><code>io.github.cyanheads/imf-mcp-server</code> | 比较美国、中国和印度 2015—2025 年消费者价格指数变化，列出 IMF 数据流、指标代码和频率。 | finance, public, research | 94 | pass | pass | approved |
| FAOSTAT 全球粮农统计<br><code>io.github.cyanheads/faostat-mcp-server</code> | 比较中国、巴西和美国 2010—2023 年大豆产量与单产变化，注明 FAOSTAT 领域、单位和数据状态。 | public, research | 94 | pass | pass | approved |
| BLS 美国劳工统计<br><code>io.github.cyanheads/bls-labor-mcp-server</code> | 查询美国 CPI-U 全部项目指数 2015—2025 年年度变化，并列出 BLS 系列 ID、单位和最新发布日期。 | public, research | 94 | pass | pass | approved |
| NOAA 历史气候与灾害数据<br><code>io.github.cyanheads/noaa-climate-mcp-server</code> | 列出 NOAA CDO 可用的主要历史气候数据集，说明时间覆盖、常见温度和降水指标以及查询限制。 | geospatial, public, research | 94 | pass | pass | approved |
| UniProt 蛋白质数据<br><code>io.github.cyanheads/uniprot-mcp-server</code> | 获取 UniProt 条目 P69905，汇总蛋白名称、基因、物种、功能、亚细胞定位和审校状态，并保留 accession。 | research, science | 94 | pass | pass | approved |
| EUR-Lex 欧盟法律开放数据<br><code>io.github.cyanheads/eur-lex-mcp-server</code> | 检索标题包含 artificial intelligence 的欧盟法规，返回最新 10 条的 CELEX、日期、文种和是否现行。 | legal, public, research | 94 | pass | pass | approved |
| OpenStreetMap 全球地理数据<br><code>io.github.cyanheads/openstreetmap-mcp-server</code> | 反向解析坐标 39.9042, 116.4074，返回地点名称、行政层级、OSM 对象类型和数据署名。 | geospatial, public | 94 | pass | pass | approved |
| NWS 美国实时天气<br><code>io.github.cyanheads/nws-weather-mcp-server</code> | 查询西雅图坐标 47.6062, -122.3321 的未来 7 天天气预报，并列出当地时区、温度、风向和降水描述。 | geospatial, public | 94 | pass | pass | approved |

## 建议的“试试这样用”

### OECD 全球公共统计

- 比较德国、法国和意大利 2015—2024 年实际 GDP 增速，并注明 OECD 数据集、单位和统计期。
- 查找 OECD 中青年失业率相关数据集，比较日本、韩国和加拿大 2018—2024 年趋势，并说明缺失年份。

### IMF 全球宏观经济统计

- 比较美国、中国和印度 2015—2025 年消费者价格指数变化，列出 IMF 数据流、指标代码和频率。
- 查询巴西、墨西哥和智利 2018—2025 年经常账户余额占 GDP 比重，并标注估算值与缺失值。

### FAOSTAT 全球粮农统计

- 比较中国、巴西和美国 2010—2023 年大豆产量与单产变化，注明 FAOSTAT 领域、单位和数据状态。
- 查询印度尼西亚、马来西亚和泰国 2015—2023 年棕榈油出口量，列出国家、年份、数值和缺失项。

### BLS 美国劳工统计

- 查询美国 CPI-U 全部项目指数 2015—2025 年年度变化，并列出 BLS 系列 ID、单位和最新发布日期。
- 比较美国 2020—2025 年失业率与职位空缺率趋势，先确认对应 BLS 系列，再说明不可直接比较的口径差异。

### NOAA 历史气候与灾害数据

- 列出 NOAA CDO 可用的主要历史气候数据集，说明时间覆盖、常见温度和降水指标以及查询限制。
- 查询 2020 年美国华盛顿州的风暴事件类型、伤亡和财产损失，注明 NCEI 数据来源与未报告值。

### UniProt 蛋白质数据

- 获取 UniProt 条目 P69905，汇总蛋白名称、基因、物种、功能、亚细胞定位和审校状态，并保留 accession。
- 检索人类中与 BRCA1 相互作用相关的已审校蛋白，返回 accession、蛋白名称和证据摘要。

### EUR-Lex 欧盟法律开放数据

- 检索标题包含 artificial intelligence 的欧盟法规，返回最新 10 条的 CELEX、日期、文种和是否现行。
- 查询《人工智能法案》相关文件及其修订、引用和被引用关系，区分正式法案、提案与判例。

### OpenStreetMap 全球地理数据

- 反向解析坐标 39.9042, 116.4074，返回地点名称、行政层级、OSM 对象类型和数据署名。
- 查找上海人民广场 1 公里内的医院，按距离列出名称、坐标和 OSM 对象 ID，最多返回 20 条。

### NWS 美国实时天气

- 查询西雅图坐标 47.6062, -122.3321 的未来 7 天天气预报，并列出当地时区、温度、风向和降水描述。
- 查询加利福尼亚州当前生效的 Severe 或 Extreme 天气警报，返回事件、紧急程度、有效期和受影响区域。


## 审核结论与持续监控

- 9 个 MCP 均由同一社区维护者 `cyanheads` 发布；虽然数据来自 OECD、IMF、FAO、BLS、NOAA、UniProt、欧盟、OpenStreetMap 和 NWS，仍需评估维护者集中度与长期可用性。
- Apache-2.0 仅证明 MCP 服务端源代码许可；每个上游数据集的授权、署名、使用政策、频率限制与商用边界必须分别复核。
- 卡片必须明确“社区独立维护、非数据机构官方产品”，不得把 Official MCP Registry 收录误写成数据机构官方背书。
- 已填写 `approved` 并迁入 `candidates/records/`；Connector 描述符随同一 PR 接受 CI 和人工合并审核。
- 上架后继续通过健康检查监控 9 个公开端点；单次失败不自动下架，连续异常按既有人工复核流程处理。
