# 新数据源宣传素材草稿（未发布）

供运营审核选用；不得将部分验证宣传为全部业务可用。未自动发布到任何平台。

### 2026-11-25 · 摩知轮商标检索

国内外商标 / 图形近似 / 公告 / 商标裁文。接入方式：oauth2-pkce；探测状态：pass。

DuHu 具名批准。DSH OAuth 连接及8个工具发现通过；一次中国“摩知轮”精确商标检索通过，总命中69条、第一页3条。其余7个工具未逐项验收，实际扣费未返回。公开用户协议已核实，按账号权益与积分规则使用；检索结果不等同于可注册性或侵权判断。

[上架 PR #115](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/115) · [卡片详情](../connectors/mozlen-trademark.json)

### 2026-11-23 · 享科 · 期货数据

期货行情 / 基差仓单 / 持仓席位 / 研报资讯。接入方式：oauth2-pkce；探测状态：pass。

DuHu 批准上架。用户报告 OAuth 连接及21工具发现成功；一次螺纹钢行情技术查询通过，K线与基差各60/60条、MACD/BOLL可用，数据日期2026-11-23。原始响应及实际扣费未独立核对，其余20工具未验收。公开超7汇服务协议已核实，按账号权益使用；建议插件 v0.2.120+。

[上架 PR #106](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/106) · [卡片详情](../connectors/xiangke-futures.json)

### 2026-11-23 · EveryInfra 万有引擎 · 公开数据与搜索

电商与社媒公开数据 / 网页搜索 / 内容提取。接入方式：bearer；探测状态：pass。

DuHu 具名批准；免费能力目录单次调用按用户报告验收 PASS，返回110个平台并包含Amazon。其他工具及收费数据查询尚未验收；公开服务条款已核实。

[上架 PR #104](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/104) · [卡片详情](../connectors/everyinfra-public-data.json)

### 2026-11-22 · 新一线城市数据库

城市指标 / 城市魅力指数 / 跨城比较 / 产业研究与报告。接入方式：bearer；探测状态：pass。

DuHu 具名批准上架及条款未知例外。已发现25个工具，单次 city_overview 查询杭州市画像通过，状态 pass；其余24个工具未逐项验收。基础指标统计期2025、产业数据日期2026-11-20；2026版城市魅力榜单不等于事实统计期。实际扣费未返回，服务条款未公开，尚未核验。

[上架 PR #102](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/102) · [卡片详情](../connectors/yicai-zhicheng-city-data.json)

### 2026-11-22 · Agent Rynku · 波兰证券数据

波兰上市公司 / 季度财报 / 财务比率 / 历史行情与分红。接入方式：none；探测状态：pass。

DuHu 具名批准。免账号、免 Key 的公共 Streamable HTTP 入口，实际发现6个工具；单次 KGHM 公司检索运行验收通过，其余5个工具未逐项验收。公开服务条款已核实，使用限于条款允许范围，不包含付费或账号专属能力；不代表 GPW 官方产品。

[上架 PR #101](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/101) · [卡片详情](../connectors/agentrynku-gpw-data.json)

### 2026-11-21 · 极鲸云 · SHEIN市场数据

SHEIN 商品 / 店铺 / 类目 / 关键词 / 评论与图搜同款。接入方式：none；探测状态：pass。

DuHu 具名批准。官方 stdio 程序通过厂商网页登录授权，连接阶段无需填 Key，非 DSH 标准 OAuth。截图及源码确认7个工具；依据用户报告，shein_site_list 返回 code 0、31个站点，站点元数据验收通过，其余6个工具未验收。原始轨迹及实际扣费未独立核对。公开服务协议已核实，数据使用及费用以账号权益和厂商规则为准。固定官方源码提交；用户实测 master 的确切版本未独立核对。

[上架 PR #100](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/100) · [卡片详情](../connectors/geekbi-shein-data.json)

### 2026-11-21 · 西柚洞察 · 亚马逊运营数据

ASIN 商品 / 关键词 / 广告流量 / 类目研究。接入方式：bearer；探测状态：pass。

DuHu 具名批准。DSH 已发现62个工具；依据用户回报，美国站单关键词 get_keyword_info 周快照查询通过，周期2026-11-08至2026-11-14，实际消耗1 Credit。原始轨迹未独立核对，其余61个工具未逐项验收。使用 Bearer MCP Token，公开开放平台协议已核实；组织内部使用，对外分发需另行授权。

[上架 PR #99](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/99) · [卡片详情](../connectors/xydc-amazon-data.json)

### 2026-11-21 · 东方财富妙想 · 金融数据

多市场金融指标 / 宏观数据 / 研报资讯 / 公告检索。接入方式：api-key；探测状态：pass。

DuHu 具名批准。已发现12个工具；按用户提供的 DSH 单次实测结果，东方财富证券简称与首发上市日期查询验收通过，原始调用轨迹未独立核对。其他11个工具未逐项验收，实际费用未知。API Key 通过 em_api_key 原样传入，按平台账号规则计费；公开妙想服务协议已核实。

[上架 PR #98](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/98) · [卡片详情](../connectors/eastmoney-miaoxiang.json)

### 2026-11-21 · 同花顺 iFinD · 金融数据

证券指标 / 宏观经济 / 公告资讯 / 市场统计。接入方式：api-key；探测状态：pass。

DuHu 具名批准。已发现11个工具；单次 A 股证券指标查询返回同花顺证券简称及上市日期，验收通过。其余10个工具未逐项验收，实际扣减额度未回传。Authorization 原样传入 MCP 密钥，不添加 Bearer 前缀；遵守官方会员协议及账号合同，不包含快查企业或法智服务。

[上架 PR #97](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/97) · [卡片详情](../connectors/ifind-financial-data.json)

### 2026-11-20 · 财汇 · 金融与风险数据

债券与基金 / 宏观区域经济 / 企业财务与风险。接入方式：api-key；探测状态：pass。

已确认 42 个顶层工具，单次基金档案查询链路通过；官方将 code=1 定义为带参数兼容处理的成功。基金类型、成立日期未匹配，部分记录为空，原五字段目标不完整，其余工具未验收。API Key 鉴权，使用与费用以账号权益及官方协议为准。

[上架 PR #96](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/96) · [卡片详情](../connectors/finchina-financial-risk-data.json)

### 2026-11-20 · 聚源金融综合问数

金融产品 / 财务报表 / 宏观行业数据问数。接入方式：api-key；探测状态：pass。

DuHu 具名批准本候选上架及条款例外，服务条款未公开，尚未核验。直连 FinQuery 单次公司年度财务问数验收通过；安全 stdio 桥接连接及9工具发现通过，无追加业务调用。其他8工具未验收，费用未回传。通过固定官方端点适配并在本机填写 Token。

[上架 PR #95](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/95) · [卡片详情](../connectors/gildata-financial-query.json)

### 2026-11-20 · 大智慧 · 金融数据

股票 / 基金 / 期货行情与财务资讯。接入方式：oauth2-pkce；探测状态：pass。

DuHu 具名批准。已发现17个工具；SH601519 公司简况单次查询验收通过，其他16工具尚未验收。参数保护修复已通过新旧 Host 本地回归并部署验收；费用未返回，按账号套餐执行。正式卡片 OAuth 流程尚未单独测试。

[上架 PR #93](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/93) · [卡片详情](../connectors/dzh-financial-data.json)

### 2026-11-19 · ZooData · 电商市场数据

Amazon 类目画像 / 市场趋势 / 价格与竞争分析。接入方式：bearer；探测状态：pass。

DuHu 批准上架。Bearer API Key 连接官方 MCP，发现47个工具；单次美国 Amazon 女士平底鞋类目市场画像验收成功，快照2026-11-18，状态 pass。DSH 报告消耗1 credit；其余46个工具未验收。14个市场工具未标记弃用，33个工具在清单中标记已弃用。未重试、翻页或下载；按账号套餐及公开服务条款使用。

[上架 PR #92](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/92) · [卡片详情](../connectors/zoodata-commerce-data.json)

### 2026-11-19 · FastMoss · TikTok电商数据

TikTok 商品 / 达人 / 店铺 / 广告与类目研究。接入方式：oauth2-pkce；探测状态：pass。

DuHu 批准上架。OAuth 连接官方 MCP，DSH 发现79个工具；助手核对单次美国2026-11-18日热销商品榜单调用成功返回3条，包含GMV、销量及USD币种字段，状态 pass。其余78个工具未验收；最多1 credit授权，实际扣费未回传。未重试、翻页、下载或查询联系人；按本人套餐权益及公开服务条款使用。

[上架 PR #91](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/91) · [卡片详情](../connectors/fastmoss-tiktok-commerce.json)

### 2026-11-19 · 亿欧数据 · 产业投融资

企业融资历史 / 投资方 / 投融资事件筛选。接入方式：api-key；探测状态：pass。

已完成双凭据连接、4工具发现和单次投融资事件筛选查询；其余3工具未逐项验收。DuHu 批准服务条款未公开例外，卡片明确披露。市场双凭据表单需插件 v0.2.116+。

[上架 PR #90](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/90) · [卡片详情](../connectors/iyiou-financing-data.json)

### 2026-11-19 · 权大师商标查询

商标检索 / 公告查询 / 全球商标数据。接入方式：bearer；探测状态：pass。

DuHu 批准上架。Bearer AppKey 直连官方 MCP，DSH 发现23个工具；用户回传一次尼斯分类查询“计算机软件”命中第42类4220群，20个候选中6项完整可见，状态 pass。未重试、翻页、下载或访问客户档案；其余工具未逐项验收，实际费用未知。schema_version不代表尼斯分类数据版次；按本人账号权益及服务协议使用。

[上架 PR #89](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/89) · [卡片详情](../connectors/quandashi-trademark.json)

### 2026-11-19 · Patentics 专利检索与分析

专利检索 / 权利要求 / 法律状态 / 技术分析。接入方式：api-key；探测状态：pass。

DuHu 批准上架。官方 Streamable HTTP 与 apikey 鉴权；DSH 发现21个工具，助手核对一次 get_patent_abstract 查询 CN106257978A 成功返回有效摘要，状态 pass。未重试、未追加查询、未下载全文；其余20个工具未逐项实测。授权及说明价0.1积分，实际扣费未回传。官方服务条款已核实，具体使用权按账号约定。

[上架 PR #88](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/88) · [卡片详情](../connectors/patentics-patent-research.json)

### 2026-11-19 · 摩熵 · 医药研发数据

药物研发 / 临床试验 / 医药专利 / 医药监管。接入方式：api-key；探测状态：pass。

DuHu 批准上架。通过本机 SSE 兼容程序连接官方服务，发现114个工具；用户回传一次司美格鲁肽中国临床试验列表查询成功，返回10条、total 92，状态 pass。未翻页、下载或重试，其余工具未逐项验收。列表未返回独立试验名称和状态，实际费用未知；按本人账号订阅与服务协议使用。

[上架 PR #87](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/87) · [卡片详情](../connectors/bcpmdata-pharma-research.json)

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
