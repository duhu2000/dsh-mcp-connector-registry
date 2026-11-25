import assert from 'node:assert/strict';
import test from 'node:test';
import check from '../scripts/check-maintainer-review.cjs';

const sha = 'a'.repeat(40);
const url = 'https://github.com/up/registry/pull/9#pullrequestreview-10';
const pass = { databaseId: 10, url, submittedAt: '2026-01-01T01:00:00Z', state: 'COMMENTED', body: 'Registry verification: pass\nRead-only lookup verified.',
  commit: { oid: sha }, author: { __typename: 'User', login: 'maintainer' } };
const withdraw = { ...pass, body: 'Registry verification: withdraw\nPlease clarify the supported scope.' };

function run(pages, currentHead = sha, review) {
  const github = {
    async graphql(query, { owner, repo, number, cursor }) {
      assert.deepEqual([owner, repo, number], ['up', 'registry', 9]);
      const i = Number(cursor || 0);
      return { repository: { pullRequest: { headRefOid: currentHead, reviews: {
        nodes: [...pages[i]], pageInfo: { hasPreviousPage: i + 1 < pages.length, startCursor: String(i + 1) }
      } } } };
    },
    rest: { repos: { async getCollaboratorPermissionLevel({ username }) {
      return { data: { permission: username === 'maintainer' ? 'write' : 'read' } };
    } } }
  };
  return check({ github, context: { serverUrl: 'https://github.com', repo: { owner: 'up', repo: 'registry' },
    payload: { review, pull_request: { number: 9, head: { sha } } } }, core: { info() {} } });
}

test('only the latest decision at the live head applies across pages and repeated runs', async () => {
  await assert.rejects(run([[]]), /Awaiting/);
  await assert.rejects(run([[pass]], sha, { commit_id: sha, id: 11, state: 'commented', body: withdraw.body }), /not yet visible/);
  await run([[pass]]);
  await assert.rejects(run([[withdraw], [pass]]), /withdrawn/);
  await run([[withdraw, { ...pass, submittedAt: '2026-01-01T01:02:00Z' }]]);
  await assert.rejects(run([[pass]], 'b'.repeat(40)), /revision changed/);
  await assert.rejects(run([[{ ...pass, commit: { oid: 'b'.repeat(40) } }]]), /Awaiting/);
});

test('a pass needs actual public feedback and its canonical link on this PR', async () => {
  for (const url of ['', 'https://github.com/up/registry/pull/8#pullrequestreview-10',
    'https://github.com/fork/registry/pull/9#pullrequestreview-10', pass.url + '1']) {
    await assert.rejects(run([[{ ...pass, url }]]), /with feedback/);
  }
  for (const feedback of ['', '   ', 'https://github.com/up/registry/pull/8']) {
    await assert.rejects(run([[{ ...pass, body: 'Registry verification: pass\n' + feedback }]]), /with feedback/);
  }
});

test('edits and dismissals fail closed; ordinary discussion and formal approvals remain separate', async () => {
  for (const changed of [{ ...pass, lastEditedAt: '2026-01-01', body: 'edited text' },
    { ...pass, state: 'DISMISSED' }, { ...pass, body: 'Registry verification: pending' }]) {
    await assert.rejects(run([[pass, changed]]), /withdrawn/);
  }
  await assert.rejects(run([[{ ...pass, state: 'APPROVED' }]]), /Awaiting/);
  await run([[pass, { ...pass, body: 'Ordinary review comment' }]]);
  for (const author of [{ __typename: 'User', login: 'external' }, { __typename: 'Bot', login: 'bot' }]) {
    await assert.rejects(run([[{ ...pass, author }]]), /Awaiting/);
    await run([[pass, { ...withdraw, author }]]);
  }
});
