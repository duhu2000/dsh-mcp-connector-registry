# 有赞 DSH OAuth 预检：客户端注册被拒绝

日期：2026-11-14（北京时间）。客户端 MCP连接器 v0.2.106。用户确认已有有赞账号和测试店铺。

1. DSH 手动连接表单只提供 none/Bearer/API Key，因此使用“市场卡片”入口安装未发布描述符用于本机验收。
2. GitHub raw 地址出现 fetch failed；同一提交 `33a7d53` 的 jsDelivr URL 可读，改用该地址后成功进入 OAuth 注册阶段。
3. DSH 返回 HTTP 400、invalid_client_metadata，未打开有赞登录页，未建立成功授权连接。
4. 对照公开 v0.2.106 的 lib/oauth.js，以相同 client_name、scope、grant/response types、token_endpoint_auth_method 和本地 loopback redirect 规则复现一次 DCR 校验。
5. 官方注册接口响应 error=invalid_client_metadata，error_description=unsupported DCR client，clientCreated=false。

复现公开字段：

- client_name: DeepSeek Harness - Youzan MCP
- token_endpoint_auth_method: none
- scope: youzan_query
- grant_types: authorization_code, refresh_token
- response_types: code
- redirect_uris: HTTP 127.0.0.1 本机 callback；未向第三方回调发送数据。

没有凭据输入、登录、Token 交换、tools/call 或店铺数据查询。没有保存 Cookie、Key、client credentials 或店铺资料。
未改用 WorkBuddy 等第三方客户端名称规避厂商限制；未尝试猜测 client_id/client_secret。

## 结论与下一步

元数据存在不等于任意客户端都能注册。当前阻断点是厂商拒绝 DSH 的 DCR 请求，发生在账号登录之前。
服务端未解释拒绝规则；不能仅凭此错误断言唯一原因是白名单或某个字段。
需厂商确认是否支持 DSH 通用客户端、正确注册要求或正式分配的应用接入方式。
未对外联系厂商。用户无需反复更换店铺账号或粘贴密钥来解决此阶段错误。

卡片保持 published=false；候选保持 review=pending、runtimeAcceptance=not-run。
完整业务验收仍需 OAuth 通路恢复后的工具审查、测试店铺只读查询、条款及具名批准。

证据：
- https://claw.youzan.com/.well-known/oauth-authorization-server
- https://claw.youzan.com/api/mcp/oauth/register
- https://github.com/duhu2000/dsh-mcp-connector/blob/v0.2.106/lib/oauth.js
