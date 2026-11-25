# 官方公共科学数据 MCP：首批验收（2026-11-25）

两项均通过免账号 MCP 协议连接与代表性只读查询。用户已批准上架，审核人 DuHu；正式卡片及记录已迁入 connectors/ 和 candidates/records/。本目录保留最初未发布卡片快照及验收证据。公共目录可用性以合并后的 CI 产物为准。

| 候选 | 提供方属性 | 实际工具数 | 最小查询结果 | 当前建议 |
|---|---|---:|---|---|
| Open Targets · 疾病与靶点数据 | 海外，官方 Open Targets | 5 | breast carcinoma（MONDO_0004989）直接关联靶点，取前 3 条：BRCA2、CHEK2、PALB2；总数 15,620 | PASS，DuHu 已批准 |
| NASA Earthdata · 地球科学数据目录 | 海外，美国 NASA 官方 | 7 | 长三角局部矩形 119–122E、30–32N，2025-07-01 至 07-31，MODIS temperature；353 个目录匹配，返回 MOD11A1、MYD11A1、MOD11A2 共 3 个 | PASS（目录检索范围），DuHu 已批准 |

## 调用记录与边界

- Open Targets 实际 tools/call 共 4 次：Schema 元数据 1 次、首轮关联查询 1 次（EFO_0000305 返回 disease=null）、疾病名称检索 1 次、使用返回的 MONDO 标识修正关联查询 1 次。自动重试 0 次。不能称“一次通过”；首次空值未当作通过。名称由修正后的响应确认为 breast carcinoma。关联分数为研究证据评分，不是治疗效果或疾病发生概率。
- NASA tools/call 共 1 次，未翻页、未请求 granules、未下载。has_granules 仅限制数据集具有文件，不证明指定时空范围内文件可用。匹配条目仍需按分辨率与研究需要筛选。
- 均使用仓库 publicMcpPost 直连公开入口，无凭据。DSH 市场卡片端到端交互未单独测试。
- 实时工具清单以本次 tools/list 为准。NASA 文档另外列有 Harmony 等能力，但本次匿名服务只返回 7 个工具，未将文档列举计为实际发现。

## 卡片和证据

- [Open Targets 卡片](connectors/open-targets-platform.json) · [候选记录](records/open-targets-platform.json) · [运行证据](evidence/open-targets-platform-runtime.json)
- [NASA 卡片](connectors/nasa-earthdata-cmr.json) · [候选记录](records/nasa-earthdata-cmr.json) · [运行证据](evidence/nasa-earthdata-cmr-runtime.json)
- [DSH 免密导入 JSON](import-dsh.json)：仅添加连接，不会自动执行查询。
- 证据仅保存公开目录/科研摘要、实际参数、响应哈希及结果状态，不保存会话 ID、凭据或个人信息。

## 官方依据

- [Open Targets 官方 MCP 指南](https://platform-docs.opentargets.org/data-access/model-context-protocol)：托管入口，仍处于实验及持续开发阶段。
- [Open Targets 许可](https://platform-docs.opentargets.org/licence)：平台数据 CC0 1.0、代码 Apache 2.0，建议引用出版物。
- [NASA 官方 MCP 指南](https://nasa.github.io/earthdata-mcp/consumers/earthdata-mcp-server-user-guide/)：公共目录 No Auth；文件可用性应通过 granules 核验；转换需要 Earthdata Login。
- [NASA CMR Use Constraints](https://wiki.earthdata.nasa.gov/spaces/CMR/pages/121311158/Use%2BConstraints)：许可证及用途限制逐数据集保存。本次未宣称所有目录中的数据可任意再分发；通用数据使用指导页抓取失败，未冒充已核验。官方说明可接入通用 MCP 客户端，远程接入不依赖分发服务端代码。

## 下一步

正式卡片和记录已经迁入；提交 PR 后运行上架校验，通过后合并。目录文档由仓库构建生成；本批仅 Registry 数据变更，不需要插件 npm 发版。
