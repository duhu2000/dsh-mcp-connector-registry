# 企业 OA 连接器验收边界

本批次覆盖飞书、钉钉和企业微信。市场卡片的“连接”仅表示完成本机配置并由 Host 注册工具，不代表用户自动拥有整个企业的数据权限。

## 来源与授权

| 连接器 | 上游 | 身份模型 | 当前状态 |
|---|---|---|---|
| 飞书开放平台 | 飞书官方 `@larksuiteoapi/lark-mcp` | 自建应用 App ID/Secret；用户私有数据另需用户 OAuth | 已发布，需租户权限验收 |
| 钉钉工作台 | 钉钉官方 `dws` CLI + MCP 连接器受控桥接 | 卡片固定 `dingtalk-workspace-cli@1.0.61`；使用 `npx -y dingtalk-workspace-cli@1.0.61 auth login` 完成 OAuth，企业管理员开启 CLI 访问 | 待 Connector 0.2.48 发布后上线 |
| 企业微信（社区） | 社区 `@qwang007/wecom-mcp` | 自建应用 Corp ID/Secret、管理员 UserID、可信 IP | 已发布，保持社区标识 |

## 运行验收

每个平台至少在一个测试租户完成：

1. 首次授权及管理员审批提示准确。
   钉钉未登录或 Token 无法刷新时，`tools/list` 必须返回脱敏的未就绪诊断，市场不得显示“已连接”。
2. 重启 DSH、升级 Connector 后授权状态仍可用。
3. 只读工具只能返回当前身份和应用权限范围内的数据。
4. 多人同名、多组织、多账号场景不自动选择身份。
5. Token、Secret、Authorization Header 不出现在 UI、诊断、日志和导出文件中。
6. 网络错误、权限不足、Token 过期、CLI 缺失和上游命令漂移有不同诊断。
7. 任何创建、发送、审批、拒绝、删除、修改或上传操作必须由独立的写入 Provider 承载并经过显式确认；不得混入当前只读钉钉 Provider。

钉钉真实租户验收要求使用 ISO 8601 的开始/结束时间分别调用待审批列表和收到的日志列表；文档搜索必须走当前官方 `drive search`，不使用已弃用的 `doc search`。

## 发布顺序

1. 合并并发布包含 `dsh-mcp-cli-bridge` 的 Connector 0.2.48。
2. 在干净 profile 安装 0.2.48，完成 MCP initialize、tools/list 和至少五项只读工具的真实租户验收。
3. 合并 Registry 变更并验证 jsDelivr 目录同步。
4. 在 DSH Web 与 Desktop 分别连接、重启和复验。
