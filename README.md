# DSH MCP Connector Registry

`dsh-mcp-connector` 的独立公共连接器目录。新卡片在本仓库通过 PR 上架，无需重新发布插件 npm 包。

## 公共目录

```text
https://raw.githubusercontent.com/duhu2000/dsh-mcp-connector-registry/main/catalog.json
```

插件会把远程目录与内置目录合并；断网或远程目录不可用时，继续使用本地内置目录。

## 上架流程

1. 复制 `connectors/example.sample.json` 为 `connectors/<connector-id>.json`。
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

完整描述格式见 [`schema/connector.schema.json`](schema/connector.schema.json)，贡献和安全规则见 [`CONTRIBUTING.md`](CONTRIBUTING.md) 与 [`SECURITY.md`](SECURITY.md)。
