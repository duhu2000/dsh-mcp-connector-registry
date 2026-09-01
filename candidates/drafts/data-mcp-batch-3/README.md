# 数据 MCP 自动发现第 3 批候选

生成时间：2026-09-01T13:42:53Z

Official MCP Registry 快照：2026-09-01T08:53:58.917Z

本批 6 个候选均已通过公开端点探测和一次明确只读的脱敏运行预检；所有人工审核状态仍为 `pending`，本目录不会参与 Connector 目录构建。

| 建议中文卡片 | 首个直接提问示例 | 领域 | 分数 | 公开探测 | 运行预检 | 人工审核 |
|---|---|---|---:|---|---|---|
| GBIF 全球生物多样性<br><code>io.github.cyanheads/gbif-biodiversity-mcp-server</code> | 匹配大熊猫的 GBIF 标准物种名称，并比较 2010—2025 年中国四川、陕西和甘肃的出现记录数量；注明 taxonKey、记录类型、数据集许可和缺失限制。 | research, science | 94 | pass | pass | pending |
| OpenAlex 全球学术研究<br><code>io.github.cyanheads/openalex-mcp-server</code> | 检索 2020—2026 年生成式人工智能与法律服务相关研究，按年份统计论文数和被引次数，列出高影响论文、OpenAlex ID、开放获取状态及检索条件。 | research | 93 | pass | pass | pending |
| 美国财政部 FiscalData<br><code>io.github.cyanheads/treasury-fiscaldata-mcp-server</code> | 查询美国 2015—2025 年每年末未偿公共债务总额，计算年度增速，并注明 FiscalData 数据集、字段、单位、记录日期和更新时间。 | finance, public, research | 94 | pass | pass | pending |
| USAspending 美国联邦支出<br><code>io.github.cyanheads/usaspending-mcp-server</code> | 查询 2024 财年美国联邦政府包含 artificial intelligence 的合同 award，按授予机构和受款方汇总金额，列出 award ID、行动日期、金额口径和筛选条件。 | business, finance, public | 94 | pass | pass | pending |
| OpenFEC 美国竞选资金<br><code>io.github.cyanheads/openfec-mcp-server</code> | 汇总 2024 选举周期美国总统候选人主要委员会的收入、支出和期末现金，列出委员会 ID、报告期、修订状态和数据更新时间。 | finance, public, research | 94 | pass | pass | pending |
| SEC EDGAR 美国公司披露<br><code>io.github.cyanheads/secedgar-mcp-server</code> | 比较 Apple、Microsoft 和 Alphabet 最近四个完整财年的收入、净利润与经营现金流，列出 CIK、XBRL concept、单位、报告期和对应 10-K accession number。 | business, finance, public | 94 | pass | pass | pending |

## 建议的“试试这样用”

### GBIF 全球生物多样性

- 匹配大熊猫的 GBIF 标准物种名称，并比较 2010—2025 年中国四川、陕西和甘肃的出现记录数量；注明 taxonKey、记录类型、数据集许可和缺失限制。
- 检索与印度洋珊瑚礁相关的 GBIF 数据集，列出发布机构、时间覆盖、地理范围、记录数量和许可，并给出规范引用方式。

### OpenAlex 全球学术研究

- 检索 2020—2026 年生成式人工智能与法律服务相关研究，按年份统计论文数和被引次数，列出高影响论文、OpenAlex ID、开放获取状态及检索条件。
- 比较中国、美国和欧盟机构 2015—2025 年碳捕集与封存研究产出，列出主要机构、年度论文数、被引次数和主题口径，并说明覆盖限制。

### 美国财政部 FiscalData

- 查询美国 2015—2025 年每年末未偿公共债务总额，计算年度增速，并注明 FiscalData 数据集、字段、单位、记录日期和更新时间。
- 比较美国 2020—2025 财年联邦收入、支出与差额，列出数值、单位和来源字段，并说明财政年度口径与数据修订限制。

### USAspending 美国联邦支出

- 查询 2024 财年美国联邦政府包含 artificial intelligence 的合同 award，按授予机构和受款方汇总金额，列出 award ID、行动日期、金额口径和筛选条件。
- 比较 FEMA 在 2021—2025 财年的灾害相关支出，按州和受款方汇总，并区分 award 金额、obligation 与实际支付口径。

### OpenFEC 美国竞选资金

- 汇总 2024 选举周期美国总统候选人主要委员会的收入、支出和期末现金，列出委员会 ID、报告期、修订状态和数据更新时间。
- 比较 2024 选举周期支持或反对两位总统候选人的独立支出，按委员会汇总金额并保留申报来源；不要展示个人捐款人地址，也不要推断违法行为。

### SEC EDGAR 美国公司披露

- 比较 Apple、Microsoft 和 Alphabet 最近四个完整财年的收入、净利润与经营现金流，列出 CIK、XBRL concept、单位、报告期和对应 10-K accession number。
- 查询 Tesla 2025 年以来的 8-K 重大事件申报，按日期列出事项摘要、accession number 和原始文件链接，并区分公司披露与分析判断。


## 批次风险与后续门槛

- 本批 6 个 MCP 涉及 1 个维护主体（cyanheads（独立社区项目））；仍需逐项评估维护者集中度、官方或社区身份与长期可用性。
- Apache-2.0 仅证明 MCP 服务端源代码许可；每个上游数据集的授权、署名、使用政策、频率限制与商用边界必须分别复核。
- 卡片必须明确“社区独立维护、非数据机构官方产品”，不得把 Official MCP Registry 收录误写成数据机构官方背书。
- 维护者完成来源和条款审核后，才能填写 `approved`、迁入 `candidates/records/` 并另行准备 Connector 描述符 PR。
