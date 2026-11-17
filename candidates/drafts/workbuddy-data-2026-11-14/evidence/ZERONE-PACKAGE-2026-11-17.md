# 执中桥接公开包发布核验

- [npm 0.2.110](https://www.npmjs.com/package/dsh-mcp-connector/v/0.2.110)
- [GitHub Release v0.2.110](https://github.com/duhu2000/dsh-mcp-connector/releases/tag/v0.2.110)
- [发布流程成功](https://github.com/duhu2000/dsh-mcp-connector/actions/runs/43993982427)
- 插件 PR #255 与当前版本素材 PR #256 已合并。发布标签提交 dd77852。

从 npm 官方源获取公开 tarball 后，逐字节核对桥接文件与已完成真实 base 验收的源码一致：

| 文件 | SHA-256 |
|---|---|
| lib/zerone-bridge.js | 0d43e79a06235b5a035b749a183da82c34ae6f8201d1ff281fc061327cfb93a7 |
| scripts/zerone-bridge.mjs | 59eb3fb60c9fd0edaef532ac31db25a848ff67159787d3489c9bc2a977c39ffa |

## 真实安装命令检查（不带凭据）

使用独立临时 npm cache 执行与正式卡片相同的命令：

```sh
npx -y --legacy-peer-deps --registry=https://registry.npmjs.org --package=dsh-mcp-connector@0.2.110 dsh-zerone-mcp-bridge --service base
```

未传 ZERONE_API_KEY；包安装成功，程序以预期退出码 2 返回 `Missing local credential: ZERONE_API_KEY`，因此没有发送执中请求、不消耗账号额度。本检查仅证明公开包可安装并进入 CLI，不替代有凭据的业务验收。

本机默认 npm 镜像尚未同步新版本，卡片显式选择官方源。插件包的宿主 peer 依赖在独立 npx 安装时发生冲突，卡片使用 --legacy-peer-deps 跳过桥接不需要的宿主/UI peer；桥接依赖的 undici 仍由正常 dependencies 安装。不修改用户全局 npm 配置。
