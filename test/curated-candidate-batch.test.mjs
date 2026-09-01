import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { normalizeOfficialServer, scoreCandidate } from '../scripts/discovery/candidate-model.mjs';
import { prepareCuratedCandidate, renderBatchSummary } from '../scripts/prepare-curated-candidate-batch.mjs';
import { buildConnectorDescriptor } from '../scripts/promote-curated-candidate-batch.mjs';

const BATCH_TWO_IDS = [
  'bls-us-labour-statistics',
  'eur-lex-eu-law',
  'faostat-food-agriculture',
  'imf-macroeconomic-statistics',
  'noaa-climate-data',
  'nws-us-weather',
  'oecd-public-statistics',
  'openstreetmap-geospatial-data',
  'uniprot-protein-data',
];

const BATCH_THREE_IDS = [
  'gbif-global-biodiversity',
  'openalex-research-catalog',
  'openfec-campaign-finance',
  'sec-edgar-company-filings',
  'us-treasury-fiscaldata',
  'usaspending-federal-awards',
];

async function fixtureCandidate() {
  const fixture = JSON.parse(await readFile(new URL('./fixtures/official-registry.json', import.meta.url), 'utf8'));
  return scoreCandidate(normalizeOfficialServer(fixture.servers[0], { retrievedAt: '2026-08-31T00:00:00.000Z' }));
}

function manifestItem() {
  return {
    id: 'example-market-data',
    vendorZh: 'Example 数据团队',
    endpoint: 'https://data.example.com/mcp',
    domains: ['finance', 'public'],
    authenticationReason: 'Official hosted endpoint passed without user credentials.',
    softwareLicenseSpdx: 'Apache-2.0',
    licenseUrl: 'https://github.com/example/market-data/blob/main/LICENSE',
    repositorySummary: 'Official publisher repository.',
    upstreamDataUrl: 'https://data.example.com/docs',
    upstreamDataSummary: 'Official upstream documentation.',
    probeCheckedAt: '2026-08-31T01:00:00.000Z',
    probeStatus: 'pass',
    runtimeCheckedAt: '2026-08-31T01:05:00.000Z',
    runtimeStatus: 'pass',
    runtimeReportPath: 'docs/runtime-acceptance/example.md',
    safeTool: 'list_markets',
    reviewNotes: 'Human source review remains pending.',
    proposedTitleZh: '示例市场数据',
    starterPromptsZh: ['查询示例市场的最新公开指标。', '比较两个示例市场近五年的公开指标。'],
  };
}

test('curated candidate stays pending while preserving pass evidence', async () => {
  const candidate = prepareCuratedCandidate(await fixtureCandidate(), manifestItem(), {
    repositoryBaseUrl: 'https://github.com/example/registry',
    generatedAt: '2026-08-31T02:00:00.000Z',
  });
  assert.equal(candidate.id, 'example-market-data');
  assert.equal(candidate.authentication.mode, 'none');
  assert.equal(candidate.probe.status, 'pass');
  assert.equal(candidate.runtimeAcceptance.status, 'pass');
  assert.equal(candidate.review.decision, 'pending');
  assert.equal(candidate.score.band, 'selected');
  assert.deepEqual(candidate.score.gates, ['Human source and service-terms review is still required before a descriptor PR.']);
});

test('curated candidate rejects unpassed evidence and endpoint drift', async () => {
  const source = await fixtureCandidate();
  assert.throws(() => prepareCuratedCandidate(source, { ...manifestItem(), runtimeStatus: 'fail' }, {
    repositoryBaseUrl: 'https://github.com/example/registry',
    generatedAt: '2026-08-31T02:00:00.000Z',
  }), /runtimeStatus must be pass/);
  assert.throws(() => prepareCuratedCandidate(source, { ...manifestItem(), endpoint: 'https://other.example.com/mcp' }, {
    repositoryBaseUrl: 'https://github.com/example/registry',
    generatedAt: '2026-08-31T02:00:00.000Z',
  }), /endpoint must match/);
});

test('curated batch summary requires two ready-to-use prompts', async () => {
  const item = manifestItem();
  const candidate = prepareCuratedCandidate(await fixtureCandidate(), item, {
    repositoryBaseUrl: 'https://github.com/example/registry',
    generatedAt: '2026-08-31T02:00:00.000Z',
  });
  const manifest = {
    title: 'Example batch',
    generatedAt: '2026-08-31T02:00:00.000Z',
    sourceSnapshot: '2026-08-31T00:00:00.000Z',
    candidates: [item],
  };
  const summary = renderBatchSummary(manifest, [candidate]);
  assert.match(summary, /示例市场数据/);
  assert.match(summary, /查询示例市场的最新公开指标/);
  assert.match(summary, /本批 1 个 MCP 涉及 1 个维护主体（Example 数据团队）/);
  assert.doesNotMatch(summary, /9 个 MCP/);
  assert.throws(() => renderBatchSummary({ ...manifest, candidates: [{ ...item, starterPromptsZh: ['only one'] }] }, [candidate]), /exactly two/);
});

test('approved batch two records match ready-to-use Connector cards', async () => {
  for (const id of BATCH_TWO_IDS) {
    const record = JSON.parse(await readFile(new URL(`../candidates/records/${id}.json`, import.meta.url), 'utf8'));
    const descriptor = JSON.parse(await readFile(new URL(`../connectors/${id}.json`, import.meta.url), 'utf8'));
    assert.equal(record.review.decision, 'approved');
    assert.equal(record.review.reviewedBy, 'DuHu');
    assert.equal(record.runtimeAcceptance.status, 'pass');
    assert.equal(descriptor.id, id);
    assert.equal(descriptor.auth.mode, 'none');
    assert.equal(descriptor.prompts.length, 2);
    assert.equal('promptVariables' in descriptor, false);
    assert.equal(descriptor.prompts.some((prompt) => /\{\{[^}]+\}\}/.test(prompt.text)), false);
    assert.match(descriptor.description, /独立社区/);
    assert.match(descriptor.description, /(?:并非|非).{0,40}官方/);
  }
});

test('pending batch three keeps human approval gated and prompts ready to send', async () => {
  const manifest = JSON.parse(await readFile(new URL('../candidates/drafts/data-mcp-batch-3/manifest.json', import.meta.url), 'utf8'));
  assert.equal(manifest.candidates.length, BATCH_THREE_IDS.length);
  for (const id of BATCH_THREE_IDS) {
    const item = manifest.candidates.find((candidate) => candidate.id === id);
    const draft = JSON.parse(await readFile(new URL(`../candidates/drafts/data-mcp-batch-3/${id}.json`, import.meta.url), 'utf8'));
    assert.ok(item, `${id} is present in the review manifest`);
    assert.equal(draft.review.decision, 'pending');
    assert.equal(draft.review.reviewedBy, null);
    assert.equal(draft.probe.status, 'pass');
    assert.equal(draft.runtimeAcceptance.status, 'pass');
    assert.equal(draft.score.band, 'selected');
    assert.equal(item.starterPromptsZh.length, 2);
    assert.equal(item.starterPromptsZh.some((prompt) => /\{\{|研究问题|请填写/.test(prompt)), false);
  }
});

test('Connector generation refuses a placeholder prompt', async () => {
  const record = JSON.parse(await readFile(new URL('../candidates/records/oecd-public-statistics.json', import.meta.url), 'utf8'));
  const manifest = JSON.parse(await readFile(new URL('../docs/review-batches/data-mcp-batch-2.manifest.json', import.meta.url), 'utf8'));
  const item = manifest.candidates.find((candidate) => candidate.id === record.id);
  assert.throws(() => buildConnectorDescriptor(record, {
    ...item,
    starterPromptsZh: ['查询 {{researchQuestion}}', item.starterPromptsZh[1]],
  }), /without template placeholders/);
});
