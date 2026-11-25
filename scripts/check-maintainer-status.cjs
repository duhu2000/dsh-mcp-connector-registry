// Called with a read-only token. The workflow loads this file from the PR base.
module.exports = async function checkMaintainerStatus({ github, context, core }) {
  const { owner, repo } = context.repo;
  const { number, head } = context.payload.pull_request;
  const label = `registry/private-review/pr-${number}`;
  const upstream = `${context.apiUrl}/repos/${owner}/${repo}/statuses/${head.sha}`.toLowerCase();

  for await (const page of github.paginate.iterator(github.rest.repos.listCommitStatusesForRef, {
    owner, repo, ref: head.sha, per_page: 100
  })) {
    // GitHub returns newest first; a later failure supersedes an earlier pass.
    const status = page.data.find(s => s.context.toLowerCase() === label && s.url.toLowerCase() === upstream);
    if (!status) continue;
    if (status.state === 'success' && status.creator?.type === 'User') {
      const { data } = await github.rest.repos.getCollaboratorPermissionLevel({
        owner, repo, username: status.creator.login
      });
      if (['write', 'maintain', 'admin'].includes(data.permission)) {
        core.info(`Maintainer verification passed for PR #${number} at ${head.sha}.`);
        return;
      }
    }
    break;
  }
  throw new Error(`Awaiting maintainer verification for PR #${number} at ${head.sha}. See feedback in this PR. Contributors do not need private credentials.`);
};
