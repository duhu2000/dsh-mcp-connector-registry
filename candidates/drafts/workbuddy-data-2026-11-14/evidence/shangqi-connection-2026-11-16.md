# 上奇连接与工具发现验收（用户截图）

记录日期：2026-11-16。依据用户提供的 DSH 截图和“已连接通”反馈；不是助手直接执行。未读取或保存 Key。

- 连接名称：上奇产业通（验收），已连接，API Key。
- 1 个服务入口，18 个工具。
- 最后成功缓存：2026/11/16 13:31:46（截图显示），只作为工具发现时间。
- 可见工具：search_company_id，企业名称关键词匹配，返回企业 ID、名称、统一社会信用代码；描述提及它是企业工商、股东信息等查询的前置工具。
- 描述中引用的 get_company_overview/get_company_shareholders 不视为已逐项看到的工具条目；其余清单尚未获得。

结论：连接与工具发现 PASS，业务 runtimeAcceptance 仍为 not-run，正式上架审核 pending。不能将 18 个工具全部认定为只读、免费或已通过，也不能据当前截图确认产业链/区域数据覆盖。手动连接页“暂无预设 Prompt”为当前观察，不等于市场草案缺失 Prompt。

下一步：从已加载工具描述整理完整 18 个工具名称、用途与参数，不执行 tools/call；区分产业/区域和企业画像能力，再选择费用明确的一次只读业务验收。当前没有业务扣费授权。

## 后续：完整工具描述汇总

用户提供 DSH 根据已加载描述整理的 18 工具清单，并明确未调用任何工具。本节为用户转述证据，不是原始 tools/list 响应或业务调用证明；更新前文“完整清单尚未获得”的历史状态。

- 产业（3）：`search_industry_id`, `get_industry_chain_graph`, `get_company_recommendation_ranking`。
- 区域（3）：`search_region_id`, `search_park_id`, `get_region_migration_overview`。
- 企业（10）：`search_company_id`, `search_company_list`, `get_company_basic_profile`, `get_company_business_profile`, `get_company_competitive_relations`, `get_company_supply_relations`, `get_company_innovation_relations`, `get_company_financing_history`, `get_company_connect_path`, `get_company_risk_overview`。
- 产业×区域（2）：`analyze_region_chain_advantages`, `get_region_industry_overview`。

复核要点：

- 用户补充“5–16 号均为企业标识二选一”与表格不一致：5 是园区匹配、6 是迁移、7 是关键词匹配、8 是筛选。按本次表格，company_name / credit_code 至少一个适用于 9–16；不能写作无参数可调用。最终以实际 schema 与说明为准。
- get_region_migration_overview 的必填项仅列产业 keyword，未给区域参数；不能据此承诺可按指定城市查询。需查看完整参数。
- search_industry_id/search_region_id 的前置调用是建议，不能机械扩大为所有工具强制依赖。get_industry_chain_graph 明示接受产业完整名称 keyword，可优先评估单次调用。
- 企业类 10 个工具与现有企业数据能力存在功能重叠；招商推荐、图谱亦可能返回企业名单。定位优先产业链与区域研究，不将推荐名单等同于权威投资结论。

拟定最小业务验收：仅 get_industry_chain_graph，一次，keyword 为“新能源汽车”；调用前确认实际参数、计费和用户预算。核对返回是否包含可解释的上下游环节及产业名称，来源/时间缺失则标记未知。不自动调用匹配工具，不重试、不分页、不查联系人、不扩展企业明细。单次失败或要求前置查询时停止，不以 mock 或描述代替业务成功。

本次没有执行业务查询；runtimeAcceptance 保持 not-run，正式上架仍 pending。单工具成功仅证明该工具及参数范围，不能代表全部 18 个工具均已验收。

## 单次业务验收授权（2026-11-16）

用户明确允许本次按账号实际单次扣费执行：仅 get_industry_chain_graph，一次，keyword="新能源汽车"；单次费用目前未知，不重试、不追加企业查询、不充值、不购买。该授权不扩展到其他工具、其他服务或后续调用。

因本会话浏览器工具此前禁止继续操作 Chrome，本轮未发送业务请求；待用户在 DSH 执行限定指令并提供脱敏结果。状态仍为 runtimeAcceptance: not-run。授权与执行结果分别记录，不将授权视为验收成功。

## 后续真实业务验收结果：PASS（用户提供执行结果）

用户报告已在 DSH 实际执行，助手仅复核其转述摘要，未直接调用也未取得原始 JSON 响应。该记录取代前文 not-run 的当前状态，保留前文作为历史过程。

- 工具：get_industry_chain_graph；参数：keyword="新能源汽车"。
- 次数：1；用户确认没有重试、前置匹配、充值或追加调用。
- 返回：status="00000"，message="请求成功"。
- 用户报告接口时间戳：2026-11-16 14:01:43。候选 checkedAt 按本地 Asia/Shanghai 记录；原始时间戳时区未提供，不视为数据统计期或更新时间。
- 结果摘要：原材料加工制造、新能源汽车零部件、新能源汽车整车制造、新能源汽车相关服务、新能源汽车相关设施制造，共五个一级环节。
- 用户汇总为 20 个二级、36 个三级环节；未取得原始树，不独立认证计数或完整性。
- 本次没有重点企业 TOP 列表。不得将工具描述中的企业名单能力记为已实测。
- 原始数据来源、统计口径、更新频率未知；实际扣费亦未核对，不宣称免费。
- 未记录联系人、企业明细、密钥或内部环节编码。

结论：连接/工具发现 PASS；get_industry_chain_graph 在本次参数范围内业务验收 PASS；其余 17 工具尚未实测。服务条款与市场范围审核未完成，正式上架批准仍 pending，草案 published=false。本轮未发起任何新的调用，不能再次使用已消耗的单次授权。

## 上架指令与剩余条件

用户随后明确要求“继续，处理上架，提交PR, 上架处理”，沿用既定审核署名 DuHu 记录人工批准。上架方向为产业链/区域研究；说明文案不构成对其他 17 工具的技术禁用或验收保证。

2026-11-16 公开条款检查：官网 https://www.chanyedata.com/ 返回应用外壳；其实际引用 https://www.chanyedata.com/api-mart/umi.68ac0b36.js 返回 HTTP 404。公开搜索未定位到可适用的官方服务协议，不以其他厂商协议或第三方转载替代。license.status 仍 unknown；正式新增卡片校验 scripts/check-new-connectors.mjs 要求条款适用性及 HTTPS 证据，因此本 PR 保持草案，不修改该校验规则。

待补充：上奇后台的用户/数据服务协议链接，或厂商明确的第三方 MCP 客户端使用条款（无密钥及账号信息）。核实后完成评分、迁入正式目录并触发目录发布；本次没有再调用收费接口。
