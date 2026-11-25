import assert from 'node:assert/strict';
import test from 'node:test';
import checkMaintainerStatus from '../scripts/check-maintainer-status.cjs';

test('accept only the latest upstream maintainer result for this PR and commit', async () => {
  const sha = 'a'.repeat(40);
  const context = { apiUrl: 'https://api.github.com', repo: { owner: 'up', repo: 'registry' },
    payload: { pull_request: { number: 9, head: { sha } } } };
  const valid = { url: `https://api.github.com/repos/up/registry/statuses/${sha}`,
    context: 'registry/private-review/pr-9', creator: { type: 'User', login: 'maintainer' }, state: 'success' };
  function run(pages, permission = 'write') {
    const repos = { listCommitStatusesForRef() {}, async getCollaboratorPermissionLevel(args) {
      assert.deepEqual(args, { owner: 'up', repo: 'registry', username: 'maintainer' });
      return { data: { permission } };
    } };
    const paginate = { async *iterator(method, args) {
      assert.equal(method, repos.listCommitStatusesForRef);
      assert.deepEqual(args, { owner: 'up', repo: 'registry', ref: sha, per_page: 100 });
      for (const data of pages) yield { data };
    } };
    return checkMaintainerStatus({ github: { rest: { repos }, paginate }, context, core: { info() {} } });
  }
  const waiting = /Awaiting maintainer verification/;
  await run([[], [valid]]);
  await assert.rejects(run([[]]), waiting);
  for (const change of [
    { url: valid.url.replace('/up/', '/fork/') },
    { url: valid.url.replace(sha, 'b'.repeat(40)) },
    { context: 'registry/private-review/pr-10' },
    { creator: { type: 'Bot' } },
  ]) await assert.rejects(run([[{ ...valid, ...change }]]), waiting);
  await assert.rejects(run([[{ ...valid, state: 'failure' }], [valid]]), waiting);
  await assert.rejects(run([[valid]], 'read'), waiting);
});
