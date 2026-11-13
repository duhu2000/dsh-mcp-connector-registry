# 草料二维码：公开接入检查与验收状态

检查日期：2026-11-13。本文不含账号、组织数据或凭据。

## 官方来源

- 官网：https://cli.im/
- 官方 MCP 配置：https://cli.im/open-api/agent/open-platform-mcp.html
- 额度与费用：https://cli.im/open-api/start/quota-and-pricing.html
- 服务条款：https://cli.im/help/policy-and-terms/user-agreement
- 配套插件及维护入口：https://github.com/caoliao/dsh-caoliao-qrcode/issues
- 品牌使用说明：https://github.com/caoliao/dsh-caoliao-qrcode/blob/v2026.11.1/BRANDING.md

草料二维码服务提供方为宁波邻家网络科技有限公司。配套插件代码的 MIT 许可证不替代在线服务条款或品牌使用规则。

## 公开端点检查（已执行）

| 检查 | 结果 |
|---|---|
| https://oauth.cli.im/.well-known/oauth-authorization-server | HTTP 200；issuer 与描述符一致；声明 PKCE S256、授权码、refresh_token、动态客户端注册、none 客户端鉴权 |
| https://open.cli.im/.well-known/oauth-protected-resource | HTTP 200；resource 为 https://open.cli.im/mcp；authorization_servers 指向 https://oauth.cli.im；scopes 与描述符一致 |
| 描述符 icon URL | HTTP 200；image/png；Access-Control-Allow-Origin: *；Cross-Origin-Resource-Policy: cross-origin |

Logo 固定到厂商仓库 tag，不依赖 Registry 合并后的尚不存在文件。
Logo SHA-256：`c5eb2d3e5f9355f6b9f9312a53442ed851d7470e3b3dcc56a72bc99c13f24efe`。

## 验证摘要

- 描述符校验及公开 OAuth 元数据、Logo 检查通过。
- Windows / Node.js 24.13.0：132 项测试中 128 项通过，4 项 Firefox 路径、换行或 symlink 测试失败；完整检查以 PR CI 为准。
- 第三方连接器的真实账号授权、刷新和只读调用验收待补充，`probeStatus` 保持 `unverified`。
- 候选记录与 official-vendor 审批由维护者完成。
