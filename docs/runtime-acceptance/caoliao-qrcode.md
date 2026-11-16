# 草料二维码接入验收

## 服务来源与使用边界

- [草料二维码官网](https://cli.im/)
- [官方 MCP 文档与授权范围](https://cli.im/open-api/agent/open-platform-mcp.html)
- [额度与费用](https://cli.im/open-api/start/quota-and-pricing.html)
- [服务条款](https://cli.im/help/policy-and-terms/user-agreement) · [隐私政策](https://cli.im/help/policy-and-terms/privacy-policy)
- [维护与问题反馈](https://github.com/caoliao/dsh-caoliao-qrcode/issues)

服务提供方为宁波邻家网络科技有限公司。配套插件的 MIT 许可证不替代在线服务条款。

此配置申请 `mcp:tools records.read templates.read templates.write qrcodes.write assets.write`，包含创建、编辑及上传权限。模板修改可能影响已有子码；只读提示词不会缩小 OAuth 授权范围。仅查询可使用 `mcp:tools records.read` 的最小授权配置。授权范围不会扩大用户在所选组织内的资源访问权限。

管理类 MCP 的实际额度通过 `usage_get` 查询；具体功能、额度及费用以账号套餐和权限为准。

## 公开接入检查

检查日期：2026-11-13。

| 项目 | 结果 |
|---|---|
| OAuth 授权服务器元数据 | HTTP 200；issuer 为 https://oauth.cli.im；支持 PKCE S256、授权码、refresh_token、动态客户端注册及公共客户端 none 鉴权 |
| 受保护资源元数据 | HTTP 200；resource 为 https://open.cli.im/mcp；授权服务器与描述符一致 |
| 图标 | HTTP 200，image/png；允许跨域加载；固定至厂商仓库版本标签 |

## 第三方连接器运行验收

验收日期：2026-11-16。验收方：草料二维码提交方。结论：通过。

验收对象为第三方 `dsh-mcp-connector` 的草料连接配置，由提交方按授权、工具发现、只读调用、重连和撤销授权流程人工验收并确认结果。

| 项目 | 结果 |
|---|---|
| DSH 桌面版 | `@deepseek-ai/dsh-desktop` `0.2.2-rc.3` |
| MCP 连接器 | `dsh-mcp-connector` `0.2.109` |
| 登录授权及回调 | 通过 |
| 连接建立与工具发现 | 通过 |
| 最小只读调用 | `usage_get`，参数 `request: {}`，调用成功 |
| 重连后只读调用 | 通过 |
| 撤销授权后访问检查 | 通过 |

只读调用的返回摘要：成功取得当前授权组织的使用额度，无报错或降级提示；未创建或修改业务数据。

本次验证包含重连，不单独声明 Token 到期后的自动刷新已经验证。报告不附账号、组织标识或授权凭据。

### 撤销授权后的访问结果

提交方确认手动撤销授权。以下时间均为北京时间（UTC+8），日期为 2026-11-16。

| 时间 | 调用 | 结果 |
|---|---|---|
| 13:35 | `usage_get`，`request: {}` | 成功，无错误码或错误信息 |
| 13:36 | 手动撤销授权后的 `usage_get`，`request: {}` | 访问被拒绝，错误码 `invalid_token`，未返回额度数据 |

错误信息：

```text
Authentication failed. The provided bearer token is invalid, expired, or no longer recognized by the server. To resolve: clear authentication tokens in your MCP client and reconnect. Your client should automatically re-register and obtain new tokens.
```

外层异常：`SdkHttpError: Error POSTing to endpoint`。
