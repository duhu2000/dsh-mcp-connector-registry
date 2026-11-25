import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  buildMonthlyBatch,
  renderMonthlyBatch,
  selectMonthlyBatch,
} from '../scripts/build-monthly-batch.mjs';
import { upsertDiscoveryIssue } from '../scripts/discovery/github-issue.mjs';
import { renderCandidateReport } from '../scripts/discover-candidates.mjs';

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

test('monthly review batch is bounded to 4-10 and excludes unsafe or duplicate candidates', () => {
  const candidates = Array.from({ length: 14 }, (_, index) => candidate(index));
  candidates.push(candidate(20, { dedupe: { level: 'strong' }, score: { band: 'duplicate', total: 99 } }));
  candidates.push(candidate(21, { probe: { status: 'fail' }, score: { band: 'defer', total: 98 } }));
  const selected = selectMonthlyBatch(candidates, { size: 10 });
  assert.equal(selected.length, 10);
  assert.deepEqual(selected.map((item) => item.registryName), Array.from({ length: 10 }, (_, index) => `com.example/data-${index}`));
  assert.equal(selectMonthlyBatch(candidates, { size: 4 }).length, 4);
  assert.throws(() => selectMonthlyBatch(candidates, { size: 3 }), /4 to 10/);
});
test('monthly report blocks rather than weakening gates when fewer than four qualify', () => {
  const report = { generatedAt: '2026-08-30T00:00:00.000Z' };
  const body = renderMonthlyBatch(report, [candidate(1)], { size: 10 });
  assert.match(body, /Blocked: fewer than four/);
  assert.match(body, /never opens or merges/);
});

test('high score and passing public probe never imply runtime or human approval', () => {
  const item = candidate(0, { score: { band: 'selected', total: 100 }, evidence: [], transports: [] });
  const source = { generatedAt: '2026-10-22T00:00:00Z', source: { complete: true },
    summary: { scoreDistribution: { selected: 1 } }, candidates: [item], rejected: [], excluded: [] };
  for (const body of [renderMonthlyBatch(source, [item], { size: 4 }), renderCandidateReport(source)]) {
    assert.match(body, /Recorded runtime.*Recorded human review/);
    assert.match(body, /pass \| not-run \| pending/);
    assert.match(body, /not business acceptance/);
  }
});

test('monthly recovery refuses incomplete, unknown, incremental or malformed snapshots', () => {
  const report = { generatedAt: '2026-10-21T00:00:00Z', source: { complete: true }, candidates: [candidate(1)] };
  assert.equal(buildMonthlyBatch(report).candidates.length, 1);
  for (const complete of [false, undefined, 'true', null]) {
    assert.throws(() => buildMonthlyBatch({ ...report, source: { complete } }), /explicitly complete/);
  }
  assert.throws(() => buildMonthlyBatch(null), /explicitly complete/);
  assert.throws(() => buildMonthlyBatch({ ...report, source: { complete: true, updatedSince: '2026-10-20' } }), /incremental/);
  assert.throws(() => buildMonthlyBatch({ ...report, generatedAt: 'invalid' }), /timestamp/);
  assert.throws(() => buildMonthlyBatch({ ...report, candidates: null }), /candidates array/);
});

test('monthly CLI preserves last-good output when recovery input is incomplete', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'registry-monthly-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const input = join(directory, 'report.json');
  const output = join(directory, 'monthly.md');
  await writeFile(input, JSON.stringify({ source: { complete: false }, candidates: [] }));
  await writeFile(output, 'last good monthly report');
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/build-monthly-batch.mjs', import.meta.url)), '--input', input, '--output', output], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /explicitly complete/);
  assert.equal(await readFile(output, 'utf8'), 'last good monthly report');
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

test('public workflows do not run discovery or consume candidate reports', async () => {
  const workflows = new URL('../.github/workflows/', import.meta.url);
  const files = (await readdir(workflows)).filter(name => /\.ya?ml$/.test(name));
  assert.ok(files.includes('ci.yml'));
  assert.ok(!files.some(name => /^discovery\.ya?ml$/i.test(name)), 'retired discovery workflow');
  for (const name of files) {
    const workflow = await readFile(new URL(name, workflows), 'utf8');
    assert.doesNotMatch(workflow, /candidates:(?:discover|monthly|curated-sources)\b|(?:discover-candidates|build-monthly-batch|audit-curated-sources)\.mjs/, name);
    assert.doesNotMatch(workflow, /candidate-output|candidate-report\.(?:json|md)|monthly-batch\.md|source-audit\.(?:json|md)|dsh-data-mcp-(?:discovery|curated-sources)/, name);
  }
});
