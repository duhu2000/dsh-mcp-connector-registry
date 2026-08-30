import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { syncThresholdIssue } from '../scripts/discovery/github-issue.mjs';
import { renderHealthIssue, updateHealthState } from '../scripts/update-health-state.mjs';

const CHECKED_AT = '2026-08-30T00:00:00.000Z';

function report(status) {
  return { checkedAt: Date.parse(CHECKED_AT), results: [{ id: 'example', status }] };
}

test('health trend opens investigation at two failures and only flags manual review at three', () => {
  const first = updateHealthState(report('fail'), {}, { checkedAt: CHECKED_AT });
  assert.equal(first.connectors.example.consecutiveFailures, 1);
  assert.equal(first.summary.investigationCount, 0);

  const second = updateHealthState(report('fail'), first, { checkedAt: CHECKED_AT });
  assert.equal(second.connectors.example.consecutiveFailures, 2);
  assert.equal(second.summary.investigationCount, 1);
  assert.equal(second.summary.manualDelistReviewCount, 0);

  const third = updateHealthState(report('fail'), second, { checkedAt: CHECKED_AT });
  assert.equal(third.connectors.example.consecutiveFailures, 3);
  assert.equal(third.summary.manualDelistReviewCount, 1);
  assert.match(renderHealthIssue(third), /automation never removes a connector/);

  const recovered = updateHealthState(report('partial'), third, { checkedAt: CHECKED_AT });
  assert.equal(recovered.connectors.example.consecutiveFailures, 0);
  assert.equal(recovered.summary.investigationCount, 0);
});

function fakeGithub(existing = []) {
  const calls = { create: [], update: [] };
  return {
    calls,
    paginate: async () => existing,
    rest: {
      issues: {
        listForRepo: async () => ({ data: existing }),
        create: async (args) => { calls.create.push(args); return { data: { number: 9 } }; },
        update: async (args) => { calls.update.push(args); return { data: { number: args.issue_number } }; },
      },
    },
  };
}

test('health issue is absent after one failure, created at threshold, and closed on recovery', async () => {
  const marker = '<!-- health-threshold -->';
  const absentGithub = fakeGithub();
  const absent = await syncThresholdIssue({ github: absentGithub, owner: 'o', repo: 'r', title: 'Health', marker, body: 'one failure', active: false });
  assert.equal(absent.action, 'absent');
  assert.equal(absentGithub.calls.create.length, 0);

  const activeGithub = fakeGithub();
  const active = await syncThresholdIssue({ github: activeGithub, owner: 'o', repo: 'r', title: 'Health', marker, body: 'two failures', active: true });
  assert.equal(active.action, 'created');

  const recoveryGithub = fakeGithub([{ number: 9, title: 'Health', body: `${marker}\nold`, state: 'open' }]);
  const closed = await syncThresholdIssue({ github: recoveryGithub, owner: 'o', repo: 'r', title: 'Health', marker, body: 'recovered', active: false });
  assert.equal(closed.action, 'closed');
  assert.equal(recoveryGithub.calls.update[0].state, 'closed');
});

test('health workflow persists state and cannot automatically delist', async () => {
  const workflow = await readFile(new URL('../.github/workflows/health.yml', import.meta.url), 'utf8');
  assert.match(workflow, /actions: read/);
  assert.match(workflow, /issues: write/);
  assert.match(workflow, /previous-health\/health-state\.json/);
  assert.match(workflow, /update-health-state\.mjs/);
  assert.match(workflow, /investigationCount > 0/);
  assert.match(workflow, /continue-on-error: true/);
  assert.doesNotMatch(workflow, /git push|rm .*connectors|connectors\//);
});

