# DSH MCP Connector Registry

`dsh-mcp-connector` 的独立公共连接器目录。新卡片在本仓库通过 PR 上架，无需重新发布插件 npm 包。

## 公共目录

```text
https://raw.githubusercontent.com/duhu2000/dsh-mcp-connector-registry/main/catalog.json
```

插件会把远程目录与内置目录合并；断网或远程目录不可用时，继续使用本地内置目录。

## 当前公共连接器

| 连接器 | 主要能力 | 鉴权 |
|---|---|---|
| 北大法宝·法律检索 | 法规、法条、司法案例和引用核验 | Bearer Token |
| Wind·股票数据 | 全球股票档案、行情、技术指标和财务数据 | Bearer Token |
| 盈米·基金投顾 | 基金检索、组合诊断、资产配置和投资风险分析 | `x-api-key` |
| QVeris·通用能力网络 | AI 能力发现、参数检查、零成本询价与按需调用 | Bearer Token |

连接器目录只保存公开接入参数；Token 和 API Key 均由用户在 DSH 本机录入。

## 上架流程

如果您是服务商或社区贡献者，可以直接[发起连接器收录请求](https://github.com/duhu2000/dsh-mcp-connector-registry/issues/new?template=connector-request.yml)，也可以 fork 本仓库并提交 Connector PR。

1. 复制 `connectors/example.sample.json` 为 `connectors/<connector-id>.json`，文件名必须与 `id` 完全一致。
2. 只提交公开元数据；禁止 Token、API Key、密码、Cookie 和 Client Secret。
3. 运行 `npm ci --legacy-peer-deps && npm run check`。
4. 提交 PR，通过 Schema、重复 ID/ServerName、URL 和密钥审计后合并。
5. `main/catalog.json` 是唯一公开产物；每周健康巡检会生成探针报告 artifact。

`featured` 由维护者管理。第三方收录不代表服务商官方背书，实际权限、费用和可用性以服务商为准。

## 维护命令

```bash
npm run build
npm run validate
npm run probe
```

完整描述格式见 [`schema/connector.schema.json`](schema/connector.schema.json)，贡献和安全规则见 [`CONTRIBUTING.md`](CONTRIBUTING.md) 与 [`SECURITY.md`](SECURITY.md)。PR 模板会要求提供服务官网、MCP 配置文档、鉴权方式和 Logo 来源，便于维护者核验。
