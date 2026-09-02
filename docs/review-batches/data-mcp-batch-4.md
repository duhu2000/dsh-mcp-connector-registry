# 数据 MCP 自动发现第 4 批审核归档

生成时间：2026-09-02T04:29:34Z

Official MCP Registry 快照：2026-09-02T04:28:05.118Z

审核时间：2026-09-02T04:29:34Z

审核人：DuHu

本批 4 个候选均已通过公开端点探测和一次明确只读的脱敏运行预检；DuHu 已逐项确认来源、鉴权、软件许可证或公开服务条款、上游数据使用边界、独立维护关系及运行报告，批准迁入正式候选记录并生成 Connector 卡片。

| 建议中文卡片 | 首个直接提问示例 | 领域 | 分数 | 公开探测 | 运行预检 | 人工审核 |
|---|---|---|---:|---|---|---|
| Noodle 生物医学文献发现<br><code>io.github.helena-bioinformatics/noodle</code> | 检索 2020—2026 年 CRISPR 碱基编辑脱靶检测相关生物医学论文，列出 PMID、DOI、发表年份、来源链接和检索条件，并说明语义相关性不等同于研究结论。 | research, science | 94 | pass | pass | approved |
| Starwell 全球公共统计<br><code>dev.starwell/world-data-statistics</code> | 先列出 Starwell 可用数据源，再定位美国失业率和十年期国债收益率序列，查询 2020—2026 年观察值；保留 source、seriesId、单位、频率、修订状态、许可和引用链接。 | public, research | 100 | pass | pass | approved |
| Proposition 65 加州化学品清单<br><code>dev.toolstop/prop65</code> | 检查 Benzene（CAS 71-43-2）是否列入 California Proposition 65 清单，列出官方名称、CAS 号、列入日期和分类；说明清单状态不等同于对具体产品警示义务的法律结论。 | legal, science | 100 | pass | pass | approved |
| AgentNative 政府公共数据<br><code>com.cazimedia.agentnative/government-public-open-data-datasets-federal-state-city-statistics-census-records-police-education-schools</code> | 列出 AgentNative 当前可查询的官方政府数据来源，按联邦、州和城市层级整理覆盖领域、来源机构、更新时间和免费样例限制；不要发起数据物化、能力申请或付费访问。 | public, research | 85 | pass | pass | approved |

## 建议的“试试这样用”

### Noodle 生物医学文献发现

- 检索 2020—2026 年 CRISPR 碱基编辑脱靶检测相关生物医学论文，列出 PMID、DOI、发表年份、来源链接和检索条件，并说明语义相关性不等同于研究结论。
- 查询 PMID 35008774 的完整文献记录，并获取一跳引用与语义关联文献；保留边类型、工作标识和来源链接，不把引用关系解释为因果证据。

### Starwell 全球公共统计

- 先列出 Starwell 可用数据源，再定位美国失业率和十年期国债收益率序列，查询 2020—2026 年观察值；保留 source、seriesId、单位、频率、修订状态、许可和引用链接。
- 查找能够比较中国、美国和欧元区 2015—2025 年通胀变化的公开统计序列，逐项核对覆盖期和口径后再比较；列出数据机构、序列 ID、单位、缺失值及不可直接比较之处。

### Proposition 65 加州化学品清单

- 检查 Benzene（CAS 71-43-2）是否列入 California Proposition 65 清单，列出官方名称、CAS 号、列入日期和分类；说明清单状态不等同于对具体产品警示义务的法律结论。
- 列出 2020 年以来新增到 Proposition 65 清单的化学品，按列入年份整理名称、CAS 号和分类，并注明数据更新时间及需要进一步核对的 OEHHA 官方来源。

### AgentNative 政府公共数据

- 列出 AgentNative 当前可查询的官方政府数据来源，按联邦、州和城市层级整理覆盖领域、来源机构、更新时间和免费样例限制；不要发起数据物化、能力申请或付费访问。
- 查询最近 30 天美国 Federal Register 的公开记录，按文件类型和发布机构汇总，并列出原始来源、发布日期、摘要覆盖和查询限制；不要发起任何付费或写入操作。

## 审核结论与持续监控

- 本批 4 个 MCP 分别由 Helena Bioinformatics、Starwell、Toolstop 和 CaziMedia AgentNative 维护，来源相互独立，均属于海外数据服务提供方或海外独立项目。
- Noodle、Starwell 和 Proposition 65 的服务端源代码分别使用 Apache-2.0 或 MIT 许可证；AgentNative 为闭源公共服务，本次核验的是其公开服务条款，不将其误写为开源软件。
- 软件许可证或服务条款均不自动覆盖上游数据授权。PubMed 衍生文献、各统计机构数据、OEHHA 清单及政府数据源的署名、使用政策、更新频率与商用边界仍须逐项复核。
- 卡片均明确“独立维护、非上游数据机构官方产品”，不得把 Official MCP Registry 收录误写成数据机构官方背书。
- Starwell 的监控工具，以及 AgentNative 的数据物化、能力申请或付费访问可能产生外部副作用；卡片已要求执行前取得用户明确确认，本次运行验收仅调用公开只读工具。
- Pasal.id、EU Trade Explorer 和 Cenogram 因鉴权或只读声明不足继续保留在延期队列，并非拒绝收录；不会为达到数量目标降低运行验收标准。
- 已填写 `approved` 并迁入 `candidates/records/`；Connector 描述符随同一 PR 接受 CI 和人工合并审核。
- 按当前去重口径，本批合并并由 CI 重建目录后，公共 Registry 预计由 97 条增至 101 条，市场可见连接器预计由 101 条增至 105 条。
