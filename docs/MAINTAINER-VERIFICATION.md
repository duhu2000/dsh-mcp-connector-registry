# 维护者核验连接器 PR

贡献者在原 PR 提供服务的公开资料。GitHub 的 `public-checks` 和 `rebuild-catalog` 使用只读权限。首次贡献者的工作流需要放行时，维护者先检查工作流变更。

1. 核对 PR 编号、最新完整 head SHA 和本次涉及的所有卡片。私下核对官方来源、适用条款、鉴权和实际验收范围，将具名记录与卡片 SHA-256 绑定。在私有默认分支运行 `registry_review`，传入 `REGISTRY_PR` 和 `REGISTRY_HEAD`。
2. 核对正式任务的 PR、完整 SHA、卡片数量及结果。核验通过后，在原 PR 提交一条 **Comment** 类型的 Review。第一行写 `Registry verification: pass`，随后写贡献者可读的验收范围和限制。需要补材料或撤回时，提交一条新的 Comment Review，第一行写 `Registry verification: withdraw`，随后说明原因和下一步。原始记录和凭据留在私有仓库。
3. 使用下例将 Review 绑定到实际核验的提交。将第一行与后续正文写入 UTF-8 文件 `review.txt`，例如：

   ```text
   Registry verification: pass

   此次覆盖工具发现和一次只读查询。批量查询尚待验证，当前无需补充材料。
   ```

   ```bash
   REPO=duhu2000/dsh-mcp-connector-registry
   # PR 与 SHA 取自本次正式核验。撤回前同样核对目标提交。
   test "$(gh pr view "$PR" --repo "$REPO" --json headRefOid --jq .headRefOid)" = "$SHA" || exit 1
   gh api --method POST "repos/$REPO/pulls/$PR/reviews" \
     -f event=COMMENT -f commit_id="$SHA" -F body=@review.txt --jq .html_url
   ```

4. 打开 GitHub 返回的原 PR Review 链接，确认贡献者能看到正文。提交、编辑或撤销 Review 会自动重新运行检查。`validate` 从上游读取当前 SHA 的最新维护者核验决定，核对权限、正文和 GitHub 生成的原 PR 链接。同一 PR 和 SHA 的检查共享并发组。撤回时等 `validate` 报告阻断；重新核验通过后，提交新的通过 Review 并核对绿色结果。编辑已发布的核验说明也需要重新提交决定。普通讨论可在 Conversation 进行。

新提交需要新的私有核验与公开反馈。每次都使用新提交的 Comment Review 登记结论。CODEOWNER 的正式 Approve 和最终合并按仓库规则另行处理。
