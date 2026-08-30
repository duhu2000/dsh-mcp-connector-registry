# Contributing

本仓库接受 MCP 服务商和社区贡献者提交的公开连接器描述。连接器收录只代表目录兼容，
不代表 `dsh-mcp-connector` 或企查查对第三方服务的官方背书。

## 提交方式

1. Fork 本仓库并从 `main` 创建分支。
2. 复制 `connectors/example.sample.json` 为 `connectors/<connector-id>.json`。
3. 文件名必须与描述中的 `id` 完全一致；一个文件只包含一个 ConnectorDescriptor。
4. 只提交公开元数据和公开 URL，不提交任何真实凭据。
5. 运行 `npm ci --legacy-peer-deps`，再依次执行 `npm test && npm run validate && npm run assets:check`。
6. 提交 PR，并完整填写自动生成的 Connector PR checklist。

完整字段说明、示例和常见问题见 [`docs/ONBOARDING.md`](docs/ONBOARDING.md)。请只提交连接器源文件和相关公开资源，不要手动修改或提交 `catalog.json`、`catalog-stats.json` 或 README 数量区块；PR 合并到 `main` 后，CI 会自动重建目录与产品统计。

如果暂时不熟悉 Descriptor，也可以使用
[Connector request](https://github.com/duhu2000/dsh-mcp-connector-registry/issues/new?template=connector-request.yml)
提供公开资料，由维护者评估是否代为建卡。

## 鉴权模式

| `auth.mode` | 目录中填写 | 用户侧行为 |
|---|---|---|
| `none` | 公共 MCP URL | 直接执行 MCP initialize 验证 |
| `bearer` | HTTP 卡片填写凭据说明；stdio 卡片用 `credentialFields` + `credentialBindings` 声明本机环境变量映射，不填写 Token | 用户在 DSH 本机录入 Bearer Token |
| `api-key` | HTTP 卡片填写 Header 名与凭据说明；stdio 卡片用 `credentialFields` + `credentialBindings` 声明本机环境变量映射，不填写 Key | 用户在 DSH 本机录入 API Key 或应用凭据 |
| `oauth2-pkce` | 公开 issuer、scope、客户端名称及服务端支持的 `tokenEndpointAuthMethod` | 客户端发现 OAuth 元数据并执行 PKCE |

OAuth 卡片必须提供可验证的 Protected Resource Metadata 和 Authorization Server
Metadata。DCR 如果签发 Client Secret，可声明 `client_secret_post` 或
`client_secret_basic`；密钥与 Token 一样只存于 DSH 本机。若服务只支持固定 Client Secret
或非标准网页登录，不应标注为 OAuth 一键授权。

## Connector PR checklist

- `id` 和所有 `serverName` 在全局唯一，上架后不随意变更。
- 公网 MCP、官网、帮助页和图标全部使用 HTTPS。
- 目录不包含 Token、API Key、密码、Cookie、Client Secret 或带值的鉴权 Header。
- Bearer/API Key 卡片只声明凭据表单；真实值仅保存在用户 DSH 本机。
- stdio 的 `credentialBindings` 只能引用 `credentialFields`，且不得和公开 `env` 重复。
- `featured` 保持 `false`；精选状态由维护者根据稳定性和用户反馈管理。
- Prompt 使用通用示例，不包含真实客户、个人信息或受限数据。
- 使用第三方名称和 Logo 时，在 PR 中提供官网来源。
- 已在本地运行 `npm ci --legacy-peer-deps` 和 `npm test && npm run validate && npm run assets:check`。
- 新增 Connector 必须同时提交 `candidates/records/<connector-id>.json`；维护者在核验官方资料、许可证/服务条款和鉴权后填写人工批准，并链接不含凭据或个人数据的真实运行验收报告。未完成该记录时 CI 会阻断描述符 PR。

CI 使用已发布的 `dsh-mcp-connector` 校验器检查 Schema、重复 Connector ID、重复
ServerName、URL 与潜在密钥。合并到 `main` 后，独立 CI job 会重建 `catalog.json`、
`catalog-stats.json` 和 README 数量区块，仅在产物发生变化时由 `github-actions[bot]` 自动提交；随后 `purge-cdn` job 清理 jsDelivr 分支缓存，
并以完整 SHA-256 校验 CDN 内容与 `main` 产物一致。需要凭据的服务不会
在公共 CI 中获得真实 Key，因此健康探针可能保持 `unverified`；这不会降低凭据安全要求。

## 审核与维护

- 维护者会核验官网、MCP 配置文档、鉴权方式、Logo 来源和公开可达性。
- 服务地址、鉴权方式或品牌信息变化时，请提交更新 PR。
- 每周健康巡检仅使用无凭据探测；连续失败不会自动删除卡片，由维护者复核后处理。
- 安全问题和疑似凭据泄漏请按 [`SECURITY.md`](SECURITY.md) 私密报告。
