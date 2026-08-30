# 首批数据 MCP Connector 上架草案

本目录保存首批三个 Connector 的待审批上架包。草案不会被 `build-registry` 收录，也不会绕过
`scripts/check-new-connectors.mjs` 的人工审核门禁。

| Connector ID | 数据用途 | Hosted MCP | 鉴权 | 自动运行预检 |
| --- | --- | --- | --- | --- |
| `ibge-br-public-data` | 巴西行政区划、人口普查、经济社会、健康与地理数据 | `https://ibge.sidneybissoli.com/mcp` | 无 | 21 个工具，`ibge_estados` 只读调用通过 |
| `ilostat-labour-statistics` | 全球就业、失业、工资、工时等 ILOSTAT 劳工统计 | `https://ilo.sidneybissoli.com/mcp` | 无 | 4 个工具，`ilo_search_indicators` 只读调用通过 |
| `brazil-senate-open-data` | 巴西参议院立法、行政和 e-Cidadania 开放数据 | `https://senado.sidneybissoli.com/mcp` | 无 | 67 个工具，`senado_listar_senadores` 只读调用通过 |

## 已完成

- Connector 中文名称、副标题、完整描述、标签与安全示例 Prompt 已定稿。
- Official MCP Registry 身份、Hosted MCP 地址、社区仓库和公开网站已记录。
- 无鉴权 `initialize`、`tools/list` 与一个明确只读工具调用已通过；报告不保存原始响应、会话 ID 或凭据。
- 代码许可证与数据使用边界已记录；三张卡片都明确说明连接器为独立社区项目，不冒充数据机构官方产品。
- 描述符使用 emoji 图标，不依赖远程图片、跨域响应或品牌 Logo 授权。

## 正式上架前仅剩

1. 维护者逐项复核后，把 `records/*.json` 的 `review.decision` 改为 `approved`，填写真实的
   `reviewedAt`、`reviewedBy` 和审核结论；不得把自动预检冒充人工批准。
2. 将本目录的三份运行报告发布到候选记录中预留的 HTTPS 地址，并确认链接可匿名访问。
3. 把 `connectors/*.json` 移入仓库根目录 `connectors/`，把 `records/*.json` 移入
   `candidates/records/`，再运行完整 CI 检查。

正式迁移前可先验证草案描述符：

```bash
for file in candidates/drafts/data-mcp-batch-1/connectors/*.json; do
  node_modules/.bin/dsh-mcp-connector-probe "$file" --validate-only
done
```
