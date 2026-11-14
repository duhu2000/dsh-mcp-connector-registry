# 连接器分类目录

汇总正式公共目录与插件内置卡片，按连接器 ID 去重；不包含候选草稿。来源在详情表中标明。探测状态不是全部业务能力验收，具体账号、权限与费用请查看服务商说明。

## 企业数据

共 2 个连接器。

| 数据源 / 连接器 | 用途 | 提供方 | 接入方式 | 来源 | 探测状态 |
|---|---|---|---|---|---|
| [企查查·企业工商](https://github.com/duhu2000/dsh-mcp-connector/blob/main/catalog/catalog.json) | 一站式企业工商 / 股权 / 经营信息查询 | 企查查 Qichacha | oauth2-pkce | 插件内置 | 未提供独立探测记录 |
| [企查查·招投标](https://github.com/duhu2000/dsh-mcp-connector/blob/main/catalog/catalog.json) | 招投标公告 / 中标结果 / 采购信息 | 企查查 Qichacha | oauth2-pkce | 插件内置 | 未提供独立探测记录 |

## 法律合规

共 5 个连接器。

| 数据源 / 连接器 | 用途 | 提供方 | 接入方式 | 来源 | 探测状态 |
|---|---|---|---|---|---|
| [企查查·法律数据](https://github.com/duhu2000/dsh-mcp-connector/blob/main/catalog/catalog.json) | 法规条文 / 司法案例检索与核验 | 企查查 Qichacha | oauth2-pkce | 插件内置 | 未提供独立探测记录 |
| [巴西参议院开放数据](../connectors/brazil-senate-open-data.json) | 法案进程 / 表决与委员会 / 议员活动 / 采购预算 | Sidney Bissoli（独立社区项目） | none | 公共目录 | pass |
| [元典法律数据](../connectors/huayu-legal.json) | 法规 / 案例 / 企业 / 证券法律数据 | 华宇元典 | bearer | 公共目录 | unverified |
| [北大法宝·法律检索](../connectors/pkulaw-legal.json) | 法规 / 法条 / 司法案例检索与引用核验 | 北大法宝 PKULaw | bearer | 公共目录 | unverified |
| [威科先行](../connectors/wolterskluwer.json) | 法规 / 案例 / 法律检索 / 专业内容 | Wolters Kluwer | bearer | 公共目录 | unverified |

## 效率工具

共 7 个连接器。

| 数据源 / 连接器 | 用途 | 提供方 | 接入方式 | 来源 | 探测状态 |
|---|---|---|---|---|---|
| [企查查·智能文档解析](https://github.com/duhu2000/dsh-mcp-connector/blob/main/catalog/catalog.json) | 本机文件 / 在线链接 · OCR 与结构化解析 | 企查查 Qichacha | oauth2-pkce | 插件内置 | 未提供独立探测记录 |
| [高德地图](../connectors/amap.json) | 地点搜索 / 地理编码 / 路线规划 / 天气查询 | 高德开放平台 | api-key | 公共目录 | unverified |
| [百度地图](../connectors/baidu-maps.json) | 地理编码 / 地点搜索 / 路线规划 / 天气与交通 | 百度地图开放平台 | api-key | 公共目录 | unverified |
| [八爪鱼·云采集](../connectors/bazhuayu-cloud-collection.json) | 模板搜索 / 云任务 / 进度查询 / 结构化数据导出 | 八爪鱼 Bazhuayu | oauth2-pkce | 公共目录 | unverified |
| [中华通胜 · 黄历择日 MCP](../connectors/chinese-almanac-mcp.json) | 开源中华通胜（黄历）MCP Server：每日宜忌、择日、干支八字、节气查询，适配 DeepSeek Harness 等任意 MCP 客户端。 | FUJIA / yonlandwu | api-key | 公共目录 | unverified |
| [轻流](../connectors/qingliu.json) | 无代码应用 / 表单 / 数据与流程协作 | 轻流 | none | 公共目录 | unverified |
| [Stripe](../connectors/stripe.json) | 支付数据 / 客户与订阅 / 退款 / Stripe API | Stripe | bearer | 公共目录 | unverified |

## 调研分析

共 38 个连接器。

| 数据源 / 连接器 | 用途 | 提供方 | 接入方式 | 来源 | 探测状态 |
|---|---|---|---|---|---|
| [AgentNative 政府公共数据](../connectors/agentnative-government-open-data.json) | 政府数据目录 / 联邦公报 / 官方来源 / 样例与聚合 | CaziMedia AgentNative（独立服务） | none | 公共目录 | pass |
| [BLS 美国劳工统计](../connectors/bls-us-labour-statistics.json) | CPI / 就业失业 / 工资工时 / JOLTS | cyanheads（独立社区项目） | none | 公共目录 | pass |
| [博查搜索](../connectors/bocha-search.json) | 网页搜索 / AI 搜索 / 内容检索 | 社区连接器 | api-key | 公共目录 | unverified |
| [Consensus](../connectors/consensus.json) | 同行评审论文检索 / 证据梳理 / 引用来源 | Consensus | oauth2-pkce | 公共目录 | unverified |
| [EIA 美国能源数据](../connectors/eia-us-energy-data.json) | 电力 / 石油 / 天然气 / 煤炭 / 能源预测 | cyanheads（独立社区项目） | none | 公共目录 | pass |
| [EUR-Lex 欧盟法律开放数据](../connectors/eur-lex-eu-law.json) | 欧盟立法 / CJEU 判例 / 条约 / CELEX 与 EuroVoc | cyanheads（独立社区项目） | none | 公共目录 | pass |
| [Exa·网络搜索](../connectors/exa-search.json) | 匿名语义网页搜索 / 网页抓取 / 高级检索 | Exa | none | 公共目录 | unverified |
| [FAOSTAT 全球粮农统计](../connectors/faostat-food-agriculture.json) | 农产品产量 / 单产贸易 / 食品农业 / FAOSTAT | cyanheads（独立社区项目） | none | 公共目录 | pass |
| [FRED 美国宏观经济数据](../connectors/fred-economic-data.json) | GDP / CPI / 就业 / 利率 / 经济时间序列 | Pipeworx（独立第三方服务） | none | 公共目录 | pass |
| [GBIF 全球生物多样性](../connectors/gbif-global-biodiversity.json) | 物种分类 / 出现记录 / 数据集 / 全球生物多样性 | cyanheads（独立社区项目） | none | 公共目录 | pass |
| [Google Analytics](../connectors/google-analytics.json) | GA4 属性 / 报表 / 实时数据 / 漏斗与转化分析 | Google Analytics | api-key | 公共目录 | partial |
| [Google 地图（HasData）](../connectors/google-maps.json) | 地点搜索 / 评论 / 图片 / 商户与周边信息 | HasData 社区网关 | api-key | 公共目录 | unverified |
| [IBGE 巴西公共统计](../connectors/ibge-br-public-data.json) | 人口普查 / 行政区划 / 经济社会指标 / 地理边界 | Sidney Bissoli（独立社区项目） | none | 公共目录 | pass |
| [ILOSTAT 全球劳工统计](../connectors/ilostat-labour-statistics.json) | 就业 / 失业 / 工资工时 / 劳动参与率 / 跨国比较 | Sidney Bissoli（独立社区项目） | none | 公共目录 | pass |
| [IMF 全球宏观经济统计](../connectors/imf-macroeconomic-statistics.json) | WEO / 国际收支 / CPI / 汇率 / 190 国宏观数据 | cyanheads（独立社区项目） | none | 公共目录 | pass |
| [Mixpanel](../connectors/mixpanel.json) | 产品分析 / 事件数据 / 留存 / 用户行为查询 | 社区连接器 | api-key | 公共目录 | unverified |
| [NOAA 历史气候与灾害数据](../connectors/noaa-climate-data.json) | 气候站点 / 历史观测 / 风暴事件 / 灾害损失 | cyanheads（独立社区项目） | none | 公共目录 | pass |
| [Noodle 生物医学文献发现](../connectors/noodle-biomedical-literature.json) | 生物医学论文 / PMID DOI / 引用网络 / 语义关联 | Helena Bioinformatics（独立项目） | none | 公共目录 | pass |
| [NWS 美国实时天气](../connectors/nws-us-weather.json) | 美国天气预报 / 实时警报 / 观测站 / 预报讨论 | cyanheads（独立社区项目） | none | 公共目录 | pass |
| [OECD 全球公共统计](../connectors/oecd-public-statistics.json) | 跨国经济 / 教育就业 / 环境社会 / OECD SDMX | cyanheads（独立社区项目） | none | 公共目录 | pass |
| [OpenAlex 全球学术研究](../connectors/openalex-research-catalog.json) | 论文 / 作者机构 / 主题趋势 / 引用网络 | cyanheads（独立社区项目） | none | 公共目录 | pass |
| [OpenFEC 美国竞选资金](../connectors/openfec-campaign-finance.json) | 候选人委员会 / 收支申报 / 独立支出 / 选举日历 | cyanheads（独立社区项目） | none | 公共目录 | pass |
| [OpenStreetMap 全球地理数据](../connectors/openstreetmap-geospatial-data.json) | 地点搜索 / 反向地理编码 / POI / Overpass 空间查询 | cyanheads（独立社区项目） | none | 公共目录 | pass |
| [智慧芽专利与文献](../connectors/patsnap.json) | 全球专利 / 科学文献 / 研发情报检索 | PatSnap / 智慧芽 | bearer | 公共目录 | unverified |
| [Product Hunt](../connectors/producthunt.json) | 产品发现 / 搜索 / 榜单 / GraphQL 数据分析 | 社区连接器 | bearer | 公共目录 | unverified |
| [PubMed 生物医学文献](../connectors/pubmed-biomedical-literature.json) | PubMed / Europe PMC / MeSH / 引用与开放全文 | cyanheads（独立社区项目） | none | 公共目录 | pass |
| [RCSB PDB](../connectors/rcsb-pdb.json) | 蛋白质结构 / 序列 / 配体 / 注释与交叉引用 | RCSB Protein Data Bank | none | 公共目录 | pass |
| [SEC EDGAR 美国公司披露](../connectors/sec-edgar-company-filings.json) | 上市公司申报 / XBRL 财务 / 重大事件 / 持股披露 | cyanheads（独立社区项目） | none | 公共目录 | pass |
| [Similarweb](../connectors/similarweb.json) | 网站流量 / 竞品对标 / 渠道与受众分析 | Similarweb | api-key | 公共目录 | partial |
| [Starwell 全球公共统计](../connectors/starwell-world-statistics.json) | 全球统计 / 时间序列 / 官方来源 / 引用与许可 | Starwell（独立社区项目） | none | 公共目录 | pass |
| [Tavily](../connectors/tavily-search.json) | 实时网页搜索 / 内容提取 / 站点地图 / 网页抓取 | Tavily | oauth2-pkce | 公共目录 | unverified |
| [UniProt 蛋白质数据](../connectors/uniprot-protein-data.json) | 蛋白检索 / 审校条目 / ID 映射 / 序列与蛋白组 | cyanheads（独立社区项目） | none | 公共目录 | pass |
| [美国财政部 FiscalData](../connectors/us-treasury-fiscaldata.json) | 美国国债 / 利率汇率 / 财政收支 / 官方财政数据 | cyanheads（独立社区项目） | none | 公共目录 | pass |
| [USAspending 美国联邦支出](../connectors/usaspending-federal-awards.json) | 联邦合同 / 拨款贷款 / 受款方 / 支出分析 | cyanheads（独立社区项目） | none | 公共目录 | pass |
| [USGS 全球地震目录](../connectors/usgs-earthquake-catalog.json) | 全球地震 / 震级深度 / 区域检索 / 事件详情 | Pipeworx（独立第三方服务） | none | 公共目录 | pass |
| [飞常准航空数据](../connectors/variflight-aviation-data.json) | 航班动态 / 中转方案 / 机场天气 / 实时位置 / 机票价格 | 飞常准（VariFlight） | api-key | 公共目录 | partial |
| [Wolfram](../connectors/wolfram.json) | 可计算知识 / Wolfram&#124;Alpha / 符号与数值计算 | Wolfram Research | none | 公共目录 | unverified |
| [世界银行 Data360](../connectors/world-bank-data360.json) | 发展指标 / 国家对比 / 时间序列 / 元数据与图表 | World Bank Group | none | 公共目录 | pass |

## 金融投资

共 13 个连接器。

| 数据源 / 连接器 | 用途 | 提供方 | 接入方式 | 来源 | 探测状态 |
|---|---|---|---|---|---|
| [AKShare](../connectors/akshare.json) | 股票 / 基金 / 期货 / 债券 / 宏观公开数据 | AKShare 社区 | none | 公共目录 | unverified |
| [BIS 全球银行与金融统计](../connectors/bis-global-statistics.json) | 信贷缺口 / 汇率利率 / 银行统计 / SDMX 数据流 | Pipeworx（独立第三方服务） | none | 公共目录 | pass |
| [巨潮资讯上市公司报告](../connectors/cninfo-listed-company-reports.json) | 年报 / 半年报 / 季报 / 招股书 / 原始 PDF 链接 | DuHu / QCC（独立社区维护） | none | 公共目录 | pass |
| [DataSinking](../connectors/datasinking.json) | 上市公司财报全文与章节检索 / Markdown / API Key | DataSinking | bearer | 公共目录 | unverified |
| [东方财富量化（社区）](../connectors/eastmoney-mcp.json) | A 股行情 / K 线 / 技术指标 / 量化筛选 | 社区连接器 | none | 公共目录 | unverified |
| [Excel 财务建模助手（社区）](../connectors/financial-modeling.json) | Excel 读取 / 写入 / 公式 / 表格建模 | 社区连接器 | none | 公共目录 | unverified |
| [Gangtise](../connectors/gangtise.json) | 机构调研 / 专家纪要 / 行业与公司研究 | Gangtise | bearer | 公共目录 | unverified |
| [IT桔子创投数据](../connectors/itjuzi-venture-capital-data.json) | 一级市场公司 / 融资事件 / 投资机构与人物 | IT桔子 | bearer | 公共目录 | partial |
| [Stock SDK 股票分析](../connectors/stock-analysis.json) | A 股 / 港股 / 美股 / 基金综合分析 | Stock SDK 社区 | none | 公共目录 | unverified |
| [通达信行情（社区）](../connectors/tongdaxin-mcp.json) | A 股行情 / 分时 / K 线 / 市场数据 | 社区连接器 | none | 公共目录 | unverified |
| [TuShare](../connectors/tushare.json) | A 股 / 指数 / 基金 / 财务 / 宏观数据 | TuShare 社区 | api-key | 公共目录 | unverified |
| [Wind·股票数据](../connectors/wind-stock-data.json) | 全球股票档案 / 行情 / 技术指标 / 财务与公司事件 | Wind 万得 | bearer | 公共目录 | unverified |
| [盈米·基金投顾](../connectors/yingmi-wealth-management.json) | 基金检索 / 组合诊断 / 资产配置 / 投资风险分析 | 盈米基金 / 且慢 | api-key | 公共目录 | unverified |

## 设计创意

共 10 个连接器。

| 数据源 / 连接器 | 用途 | 提供方 | 接入方式 | 来源 | 探测状态 |
|---|---|---|---|---|---|
| [Canva 可画](../connectors/canva.json) | 设计搜索 / 内容读取 / 设计与素材管理 | Canva | oauth2-pkce | 公共目录 | unverified |
| [draw.io](../connectors/drawio.json) | 流程图 / 架构图 / Mermaid / draw.io XML | JGraph / draw.io | none | 公共目录 | pass |
| [可灵 AI（AceDataCloud）](../connectors/kling.json) | 文生视频 / 图生视频 / 任务进度与结果查询 | AceDataCloud 社区网关 | bearer | 公共目录 | unverified |
| [MasterGo Magic MCP](../connectors/mastergo.json) | 设计稿解析 / 设计系统 / 代码生成辅助 | MasterGo | bearer | 公共目录 | unverified |
| [MediaKit CLI](../connectors/mediakit.json) | 音频 / 视频 / 图像处理与媒体工作流 | Agent Utility 社区 | none | 公共目录 | unverified |
| [MiniMax MCP](../connectors/minimax-mcp.json) | 语音合成 / 声音克隆 / 图片与视频生成 | MiniMax AI | api-key | 公共目录 | partial |
| [Pixso](../connectors/pixso.json) | 设计稿读取 / 节点信息 / 设计上下文 | Pixso | api-key | 公共目录 | unverified |
| [Replicate](../connectors/replicate.json) | AI 模型发现 / 对比 / 预测运行 / 结果查询 | Replicate | bearer | 公共目录 | unverified |
| [Seedance 视频生成（AceDataCloud）](../connectors/seedance.json) | 文生视频 / 图生视频 / 任务进度 / 模型与规格查询 | AceDataCloud 社区网关 | bearer | 公共目录 | unverified |
| [Seedream（图片生成）](../connectors/seedream-image-generation.json) | 文生图 / 图片编辑 / 多尺寸生成 / 任务查询 | Ace Data Cloud | bearer | 公共目录 | unverified |

## 开发工具

共 23 个连接器。

| 数据源 / 连接器 | 用途 | 提供方 | 接入方式 | 来源 | 探测状态 |
|---|---|---|---|---|---|
| [Chrome DevTools](../connectors/chrome-devtools.json) | 浏览器调试 / 网络分析 / 性能追踪 / 自动化 | Google Chrome | none | 公共目录 | unverified |
| [腾讯云 CloudBase](../connectors/cloudbase.json) | 云开发环境 / 数据库 / 云函数 / 存储与部署 | 腾讯云开发 | none | 公共目录 | unverified |
| [Cloudflare](../connectors/cloudflare-api.json) | DNS / Workers / R2 / Zero Trust / Cloudflare API | Cloudflare | oauth2-pkce | 公共目录 | unverified |
| [CNB](../connectors/cnb.json) | 组织与仓库 / Issue 与合并请求 / 构建与工作空间 | 腾讯云 CNB | api-key | 公共目录 | unverified |
| [Context7](../connectors/context7.json) | 最新版本库文档 / 代码示例 / API 查询 | Upstash | none | 公共目录 | unverified |
| [腾讯云 EdgeOne Pages](../connectors/edgeone-pages.json) | HTML 内容部署 / 即时公开预览链接 | 腾讯云 EdgeOne | none | 公共目录 | unverified |
| [Firefox · 页面检查](../connectors/firefox-devtools.json) | 本地 Firefox 页面导航与文本读取（macOS 已验收） | Mozilla | none | 公共目录 | pass |
| [Gitee](../connectors/gitee.json) | 代码仓库 / Issue / Pull Request / 通知协作 | Gitee | bearer | 公共目录 | unverified |
| [GitHub](../connectors/github.json) | 代码仓库 / Issue / Pull Request / Actions 协作 | GitHub | bearer | 公共目录 | unverified |
| [GitLab](../connectors/gitlab.json) | 代码仓库 / Merge Request / Issue / CI/CD | GitLab | oauth2-pkce | 公共目录 | unverified |
| [Jenkins](../connectors/jenkins.json) | 任务状态 / 构建日志 / 流水线与作业管理 | 社区连接器 | api-key | 公共目录 | unverified |
| [Langfuse](../connectors/langfuse.json) | LLM 追踪 / 会话 / Prompt / 可观测性分析 | 社区连接器 | api-key | 公共目录 | unverified |
| [MongoDB](../connectors/mongodb.json) | 数据库查询 / Atlas 资源 / Schema 分析 / 只读模式 | MongoDB | api-key | 公共目录 | unverified |
| [Neon](../connectors/neon.json) | Serverless Postgres / 项目 / 分支 / 数据库管理 | Neon | oauth2-pkce | 公共目录 | unverified |
| [Playwright](../connectors/playwright.json) | 浏览器自动化 / 页面检查 / 交互测试 / 可访问性快照 | Microsoft | none | 公共目录 | unverified |
| [PolarDB-X](../connectors/polardb.json) | 数据库连接 / SQL 查询 / 元数据分析 | 阿里云 | api-key | 公共目录 | unverified |
| [PostgreSQL](../connectors/postgresql.json) | 连接档案 / SQL 查询 / Schema 分析 / 数据库管理 | Microsoft | api-key | 公共目录 | unverified |
| [Render](../connectors/render.json) | 服务部署 / 日志 / 指标 / 数据库管理 | Render | bearer | 公共目录 | unverified |
| [Sentry](../connectors/sentry.json) | Issue / 事件 / Trace / 性能与生产问题分析 | Sentry | oauth2-pkce | 公共目录 | unverified |
| [SHOPLINE 开发者 MCP](../connectors/shopline-developer-mcp.json) | 开发文档 / Admin REST API / GraphQL Schema / 代码校验 | SHOPLINE | none | 公共目录 | pass |
| [Supabase](../connectors/supabase.json) | 项目 / Postgres / 边缘函数 / 分支管理 | Supabase | bearer | 公共目录 | unverified |
| [Temporal](../connectors/temporal.json) | Temporal 文档检索 / 工作流开发知识 | Temporal Technologies | oauth2-pkce | 公共目录 | unverified |
| [Vercel](../connectors/vercel.json) | 项目 / 部署 / 日志 / Serverless 应用管理 | Vercel | oauth2-pkce | 公共目录 | unverified |

## 办公协作

共 17 个连接器。

| 数据源 / 连接器 | 用途 | 提供方 | 接入方式 | 来源 | 探测状态 |
|---|---|---|---|---|---|
| [钉钉工作台](../connectors/dingtalk.json) | 通讯录 / 日历 / 文档 / 待办 / OA 审批只读查询 | 钉钉 | none | 公共目录 | unverified |
| [飞书开放平台](../connectors/feishu.json) | 消息 / 文档 / 多维表格 / 通讯录协作 | 飞书 | api-key | 公共目录 | unverified |
| [Google 日历](../connectors/google-calendar.json) | 日历事件 / 空闲时间 / 会议安排 / 日程搜索 | 社区连接器 | api-key | 公共目录 | unverified |
| [金数据表单](../connectors/jinshuju-forms.json) | 表单检索 / 提交数据查询 / 表单管理 | 金数据 | oauth2-pkce | 公共目录 | partial |
| [LINE Messaging API](../connectors/line.json) | 消息发送 / 广播 / 用户互动 | LINE | bearer | 公共目录 | unverified |
| [Linear](../connectors/linear.json) | Issue / 项目 / 团队 / 评论管理 | Linear | oauth2-pkce | 公共目录 | unverified |
| [Microsoft 365](../connectors/m365.json) | Outlook 邮件 / 日历 / Teams / OneDrive / SharePoint | 社区连接器 | api-key | 公共目录 | unverified |
| [网易邮箱（社区）](../connectors/netease-mail.json) | 邮件搜索 / 阅读 / 起草 / SMTP 发送 | 社区连接器 | api-key | 公共目录 | unverified |
| [Notion](../connectors/notion.json) | 工作区搜索 / 页面读取与创建 / 数据库协作 | Notion | oauth2-pkce | 公共目录 | unverified |
| [Obsidian（只读）](../connectors/obsidian.json) | 本地知识库搜索 / 笔记读取 / 链接分析 | 社区连接器 | api-key | 公共目录 | unverified |
| [QQ 邮箱（社区）](../connectors/qq-mail.json) | 邮件搜索 / 阅读 / 起草 / SMTP 发送 | 社区连接器 | api-key | 公共目录 | unverified |
| [Slack](../connectors/slack.json) | 频道 / 消息 / 线程 / 工作区协作 | Slack | bearer | 公共目录 | unverified |
| [腾讯文档](../connectors/tencent-docs.json) | 文档创建 / 内容查询与编辑 / 在线协作 | 腾讯 | api-key | 公共目录 | unverified |
| [Todoist](../connectors/todoist.json) | 任务 / 项目 / 日程与工作流管理 | Doist | oauth2-pkce | 公共目录 | unverified |
| [企业微信（社区）](../connectors/wecom.json) | 通讯录 / 客户联系 / 消息与企业协作 | 社区连接器 | api-key | 公共目录 | unverified |
| [WPS 云文档](../connectors/wps-docs.json) | 云文档搜索 / 内容读取 / 评论与权限管理 | 金山办公 | bearer | 公共目录 | unverified |
| [Zotero](../connectors/zotero.json) | 文献库搜索 / 元数据 / 笔记 / 引文与全文读取 | Zotero MCP 社区 | none | 公共目录 | unverified |

## 其他

共 2 个连接器。

| 数据源 / 连接器 | 用途 | 提供方 | 接入方式 | 来源 | 探测状态 |
|---|---|---|---|---|---|
| [FlyBest·AI 订酒店](../connectors/flybest-hotels.json) | 全球酒店实时房价 / 顾问礼遇对比 / 一次性付款页下单 / 订单查询与取消 | FlyBest | oauth2-pkce | 公共目录 | unverified |
| [QVerisMCP](../connectors/qveris-capability-network.json) | 10,000+ 实时能力发现 / 检查 / 审计 / 调用 | QVeris | bearer | 公共目录 | unverified |

