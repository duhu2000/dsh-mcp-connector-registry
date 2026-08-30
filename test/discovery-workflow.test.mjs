import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  renderMonthlyBatch,
  selectMonthlyBatch,
} from '../scripts/build-monthly-batch.mjs';
import { upsertDiscoveryIssue } from '../scripts/discovery/github-issue.mjs';

function candidate(index, overrides = {}) {
  return {
    registryName: `com.example/data-${index}`,
    title: `Data ${index}`,
    classification: { isDataService: true, domains: ['finance'] },
    source: { status: 'active' },
    dedupe: { level: 'none' },
    score: { band: 'watchlist', total: 90 - index },
    probe: { status: 'pass' },
    authentication: { mode: 'bearer' },
    license: { status: 'unknown' },
    officialLinks: { websiteUrl: `https://data-${index}.example.com`, repository: null },
    ...overrides,
  };
}

test('monthly review batch is bounded to 5-10 and excludes unsafe or duplicate candidates', () => {
  const candidates = Array.from({ length: 14 }, (_, index) => candidate(index));
  candidates.push(candidate(20, { dedupe: { level: 'strong' }, score: { band: 'duplicate', total: 99 } }));
  candidates.push(candidate(21, { probe: { status: 'fail' }, score: { band: 'defer', total: 98 } }));
  const selected = selectMonthlyBatch(candidates, { size: 10 });
  assert.equal(selected.length, 10);
  assert.deepEqual(selected.map((item) => item.registryName), Array.from({ length: 10 }, (_, index) => `com.example/data-${index}`));
  assert.throws(() => selectMonthlyBatch(candidates, { size: 4 }), /5 to 10/);
});
test('monthly report blocks rather than weakening gates when fewer than five qualify', () => {
  const report = { generatedAt: '2026-08-30T00:00:00.000Z' };
  const body = renderMonthlyBatch(report, [candidate(1)], { size: 10 });
  assert.match(body, /Blocked: fewer than five/);
  assert.match(body, /never opens or merges/);
});

function fakeGithub(existing = []) {
  const calls = { create: [], update: [] };
  return {
    calls,
    paginate: async () => existing,
    rest: {
      issues: {
        listForRepo: async () => ({ data: existing }),
        create: async (args) => { calls.create.push(args); return { data: { number: 7 } }; },
        update: async (args) => { calls.update.push(args); return { data: { number: args.issue_number } }; },
      },
    },
  };
}

test('discovery issue upsert is idempotent and never creates a daily duplicate', async () => {
  const marker = '<!-- stable-discovery -->';
  const github = fakeGithub();
  const created = await upsertDiscoveryIssue({ github, owner: 'o', repo: 'r', title: 'Discovery', marker, body: 'report' });
  assert.deepEqual(created, { action: 'created', issueNumber: 7 });
  assert.equal(github.calls.create.length, 1);

  const body = `${marker}\nreport`;
  const unchangedGithub = fakeGithub([{ number: 7, title: 'Discovery', body, state: 'open' }]);
  const unchanged = await upsertDiscoveryIssue({ github: unchangedGithub, owner: 'o', repo: 'r', title: 'Discovery', marker, body: 'report' });
  assert.deepEqual(unchanged, { action: 'unchanged', issueNumber: 7 });
  assert.equal(unchangedGithub.calls.create.length, 0);
  assert.equal(unchangedGithub.calls.update.length, 0);

  const updateGithub = fakeGithub([{ number: 7, title: 'Discovery', body: `${marker}\nold`, state: 'closed' }]);
  const updated = await upsertDiscoveryIssue({ github: updateGithub, owner: 'o', repo: 'r', title: 'Discovery', marker, body: 'new' });
  assert.deepEqual(updated, { action: 'updated', issueNumber: 7 });
  assert.equal(updateGithub.calls.update[0].state, 'open');
});

test('discovery workflow only emits artifacts and idempotent issues', async () => {
  const workflow = await readFile(new URL('../.github/workflows/discovery.yml', import.meta.url), 'utf8');
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /issues: write/);
  assert.match(workflow, /--updated-since/);
  assert.match(workflow, /--probe --max-probes 25/);
  assert.match(workflow, /--size 10/);
  assert.match(workflow, /dsh-data-mcp-discovery-daily/);
  assert.match(workflow, /dsh-data-mcp-discovery-monthly/);
  assert.doesNotMatch(workflow, /git push|pulls\.create|connectors\//);
});
