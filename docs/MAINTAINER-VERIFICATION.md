# 维护者核验连接器 PR

贡献者在原 PR 提供服务的公开资料。GitHub 的 `public-checks` 和 `rebuild-catalog` 使用只读权限。首次贡献者的工作流需要放行时，维护者先检查工作流变更。

1. 核对 PR 编号、最新完整 head SHA 和本次涉及的所有卡片。私下核对官方来源、适用条款、鉴权和实际验收范围，将具名记录与卡片 SHA-256 绑定。在私有默认分支运行 `registry_review`，传入 `REGISTRY_PR` 和 `REGISTRY_HEAD`。
2. 核对正式任务的 PR、完整 SHA、卡片数量及结果。核验通过后，在原 PR 提交一条 **Comment** 类型的 Review。第一行写 `Registry verification: pass`，随后写贡献者可读的验收范围和限制。需要补材料或撤回时，提交一条新的 Comment Review，第一行写 `Registry verification: withdraw`，随后说明原因和下一步。原始记录和凭据留在私有仓库。
3. 在可信的维护者工作副本使用下例登记结论。将可公开的范围或需要修改的事项写入 UTF-8 的 `feedback.txt`。例如“已核对工具发现和一次只读查询。批量查询尚未验收，当前无需补材料”。脚本使用上游写权限，读取本机 GitHub 的 Git 凭据或 `GH_TOKEN`。

   ```bash
   python scripts/record-maintainer-review.py pass "$PR" "$SHA" feedback.txt
   # 撤回时用 withdraw，并在文件中说明原因。已就绪的 PR 会先转回草案。
   ```

4. 打开返回的原 PR Review 链接，核对正文。登记命令自动重新排队原 PR 的 `validate` 作业。查看返回的同一运行页面，等该 SHA 的检查完成。撤回后应显示失败，重新核验并提交通过 Review 后应恢复成功。恢复后由维护者按通常流程将草案送审。网络中断时如 Review 已送达，可用 `python scripts/record-maintainer-review.py refresh "$PR" "$SHA"` 重试检查，沿用同一条反馈。

默认分支上线后，GitHub 也会监听 Review 的提交、编辑和撤销，自动刷新原检查。fork 只发出只读通知；具备排队权限的处理程序从默认分支运行。已发布说明需要修正时提交新的核验 Review。每个新 SHA 都需要独立核验；维护者可按需另行发起代码评审，合并由具有合并权限的维护者处理。
