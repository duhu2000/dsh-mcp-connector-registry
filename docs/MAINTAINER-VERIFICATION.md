# 维护者核验连接器 PR

贡献者在原 PR 提供服务的公开资料。`public-checks` 在 GitHub 上运行测试、描述符和素材检查；如 GitHub 提示首次贡献者的工作流待批准，请维护者先检查工作流变更。新增或修改正式卡片还需要维护者完成以下核验。

1. 核对原 PR 编号、最新完整 head SHA 和本次变更涉及的所有卡片。私下审阅官方来源、适用条款、鉴权及实际验收范围。将具名记录与每张卡片的 SHA-256 绑定，在私有默认分支运行 `registry_review`，传入 `REGISTRY_PR` 和 `REGISTRY_HEAD`。
2. 打开正式任务日志，核对 PR 编号、完整 SHA、卡片数量及结果。缺材料时，在原 PR 指出字段、原因和可接受的修正，例如“请补充官方鉴权文档，并注明试用账号能访问的数据范围”。私有系统地址、账号、原始响应和凭据留在私有仓库。
3. 在原 PR 留下可公开的结论。例如“此次覆盖工具发现和一次只读查询；批量查询尚未验收”。维护者用自己的上游仓库写入权限登记结果。下例变量分别取自正式核验日志和本次反馈，`FEEDBACK_URL` 使用原 GitHub PR 的评论链接。

```bash
REPO=duhu2000/dsh-mcp-connector-registry
# PR、SHA 取自实际核验的任务，避免将旧结果登记到新提交。
test "$(gh pr view "$PR" --repo "$REPO" --json headRefOid --jq .headRefOid)" = "$SHA" || exit 1
gh api --method POST "repos/$REPO/statuses/$SHA" \
  -f state=success -f context="registry/private-review/pr-$PR" \
  -f description="Maintainer verified the reviewed scope" -f target_url="$FEEDBACK_URL"
```

只有核验通过时登记 `success`。需要修正或撤回结论时，以相同 PR、SHA 和 context 登记 `failure`，在原 PR 说明原因。上游仓库同一提交的最新结果生效；每次推送都需要核验新的完整 SHA。

4. 在 GitHub Actions 重新运行原 PR 当前提交的 Registry CI。若 `validate` 在等待审核时已失败，可选 **Re-run failed jobs**；若是在改正先前的通过结论，选 **Re-run all jobs**。确认 `public-checks` 和 `validate` 的最终结果。正式的 CODEOWNER 评审与合并按仓库规则单独进行。
