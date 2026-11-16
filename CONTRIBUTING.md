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
- 无鉴权候选可用 `npm run candidates:accept -- --url <HTTPS MCP URL> --tool <只读工具> --args '<JSON>' --output <报告.md>` 生成最小化验收摘要。该命令只允许公网 HTTPS 和明确声明为只读、非破坏性的工具，不保存原始响应，并会在落盘前扫描工具结果中的疑似凭据。需要鉴权的候选必须使用独立、最小权限测试账号人工验收，不得把凭据放入命令行或报告。

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

### 目录与上新宣传同步

`npm run build` 会从正式 `catalog.json` 自动生成分类目录和 README 分类数量。
新卡片合并后，在 `docs/catalog-additions.json` 记录正式上架日期、对应 PR 编号及准确验收边界；日期不得使用文案修改日期替代。不补写无法核实的历史上架日期。
构建同时生成 `docs/RECENT-ADDITIONS.md` 和 `docs/ANNOUNCEMENT-DRAFT.md`，后者仅供运营审核，不自动发帖。卡片更新不要求发布插件 npm。

## 具名批准的有限连接验收

默认仍要求真实只读业务运行验收通过。用户/维护者明确批准仅连接验收时，可在
`review.scope` 记录 `connection-only`，同时提供 `connectionAcceptance`（成功时间、
审核人、非零工具数、脱敏报告）和同 URL 的 `connection-acceptance` 证据。
初次仅连接验收时，不得将连接成功改写为业务通过：`runtimeAcceptance` 必须保持 `not-run`，无业务验收时间、
审核人或报告；评分保留 `watchlist`、总分至少 60、runtime=0。该路径不用于自动发现批量发布。

有限路径仍要求官方厂商来源、明确鉴权配置、条款适用性证据、无重复和具名批准。
初次仅连接验收的卡片必须 `published=true`、`featured=false`、`probeStatus=partial`，描述包含
“业务查询尚未验收”。不能只加 partial 就绕过批准或证据要求；未知 scope 一律失败。
`connectionAcceptance` 不证明业务套餐权限或收费数据可用，未验证事项须在报告和卡片中保留。
付费测试上限及订阅购买仍遵守用户单独授权。模板迁入正式目录同样触发新增卡片校验。

### 上架后的业务验收与市场状态

后续真实代表性业务调用通过后，`runtimeAcceptance.status=pass`，市场卡片更新为
`probeStatus=pass`，`probeCheckedAt` 对应真实测试时间。pass 不等于所有工具、所有账号
权益或长期稳定性均已验收；卡片必须说明已通过的业务范围及尚未验收范围。
后续验收失败或尚未调用业务工具的有限验收卡片继续 partial，不得伪造通过。

原 `connection-only` 批准记录及评分保留为历史事实。后续结果必须具有晚于原批准时间
的测试时间、检查人、HTTPS 报告和匹配的 runtime-acceptance 证据；成功卡片描述包含
“运行验收通过”“业务查询通过”及剩余未验收范围，失败卡片保留“有限验收”及准确失败说明。
候选记录中的历史匿名 probe 不用授权业务结果覆盖；featured 仍为 false。


### 官方服务条款未公开的具名例外

当维护者知晓条款未公开仍明确批准某一连接器上架时，可在正式记录的 `review.serviceTermsException` 中记录例外。该路径仅适用于官方厂商、已验证凭据配置且真实业务 runtime PASS 的非推荐卡片；不能用于自动发现或 connection-only 上架。

必填：`connectorId` 匹配卡片；`decision=approved`；`reasonCode=official-terms-unavailable`；`reviewedBy`、`reviewedAt` 与主审核记录一致；非空 `notes`；HTTPS `reportUrl` 与 `service-terms-exception` 类型证据一致。报告保留用户明确指令与缺失事实，不冒充厂商授权。来源、评分、真实运行报告等校验照常执行。

`license.status` 必须保留 `unknown`，`spdxId` 和 `evidenceUrl` 必须为 null。已发布卡片必须为 `pass`、`featured=false`，描述须包含“服务条款未公开，尚未核验”。该例外不授予额外数据许可，不能推广到其他候选；取得官方协议后需重新核验。


### 同步近期新增文档

`docs/CONNECTOR-DIRECTORY.md` 由正式卡片自动生成；`docs/RECENT-ADDITIONS.md` 与运营草稿则读取 `docs/catalog-additions.json`。发布新卡片后，应根据实际合并 PR 和北京时间的合并日期补充该索引，不以文件修改日期代替上架日期。后续业务验收变化时，也要同步对应 acceptance 文案，保留初次有限验收与后续结果的区别。运行 `npm run build` 重新生成文档；不要只编辑生成文件。
