import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { normalizeOfficialServer, scoreCandidate } from '../scripts/discovery/candidate-model.mjs';
import { prepareCuratedCandidate, renderBatchSummary } from '../scripts/prepare-curated-candidate-batch.mjs';
import { buildConnectorDescriptor } from '../scripts/promote-curated-candidate-batch.mjs';

const PUBLIC_DATA_CARDS = [
  'agentnative-government-open-data',
  'bis-global-statistics',
  'bls-us-labour-statistics',
  'eia-us-energy-data',
  'eur-lex-eu-law',
  'faostat-food-agriculture',
  'fred-economic-data',
  'gbif-global-biodiversity',
  'imf-macroeconomic-statistics',
  'noaa-climate-data',
  'noodle-biomedical-literature',
  'nws-us-weather',
  'oecd-public-statistics',
  'openalex-research-catalog',
  'openfec-campaign-finance',
  'openstreetmap-geospatial-data',
  'pubmed-biomedical-literature',
  'sec-edgar-company-filings',
  'starwell-world-statistics',
  'uniprot-protein-data',
  'us-treasury-fiscaldata',
  'usaspending-federal-awards',
  'usgs-earthquake-catalog',
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
    runtimeReportPath: 'reviews/example.md',
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
  assert.throws(() => prepareCuratedCandidate(source, { ...manifestItem(), runtimeReportPath: '../outside.md' }, {
    repositoryBaseUrl: 'https://github.com/example/registry',
    generatedAt: '2026-08-31T02:00:00.000Z',
  }), /relative Markdown path/);
  assert.throws(() => prepareCuratedCandidate(source, { ...manifestItem(), endpoint: 'https://other.example.com/mcp' }, {
    repositoryBaseUrl: 'https://github.com/example/registry',
    generatedAt: '2026-08-31T02:00:00.000Z',
  }), /endpoint must match/);
});

test('curated candidate supports service terms when no source repository is published', async () => {
  const source = await fixtureCandidate();
  source.officialLinks.repository = null;
  source.officialLinks.websiteUrl = 'https://data.example.com';
  source.evidence = source.evidence.filter((item) => item.type !== 'official-repository');
  const item = {
    ...manifestItem(),
    licenseStatus: 'not-applicable',
    softwareLicenseSpdx: null,
    licenseUrl: 'https://data.example.com/terms',
    repositorySummary: null,
  };
  const candidate = prepareCuratedCandidate(source, item, {
    repositoryBaseUrl: 'https://github.com/example/registry',
    generatedAt: '2026-08-31T02:00:00.000Z',
  });
  assert.equal(candidate.license.status, 'not-applicable');
  assert.equal(candidate.license.spdxId, null);
  assert.equal(candidate.license.evidenceUrl, 'https://data.example.com/terms');
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

test('published data cards retain direct prompts and third-party disclosures', async () => {
  for (const id of PUBLIC_DATA_CARDS) {
    const card = JSON.parse(await readFile(new URL(`../connectors/${id}.json`, import.meta.url), 'utf8'));
    assert.equal(card.id, id);
    assert.equal(card.auth.mode, 'none');
    assert.equal(card.probeStatus, 'pass');
    assert.equal(card.prompts.length, 2);
    assert.equal('promptVariables' in card, false);
    for (const prompt of card.prompts) assert.doesNotMatch(prompt.text, /\{\{|研究问题|请填写/);
    assert.match(card.description, /独立社区|社区独立|独立项目|独立服务|第三方/);
    assert.match(card.description, /(?:并非|不是|非).{0,40}官方/);
  }
  const fred = JSON.parse(await readFile(new URL('../connectors/fred-economic-data.json', import.meta.url), 'utf8'));
  const pubmed = JSON.parse(await readFile(new URL('../connectors/pubmed-biomedical-literature.json', import.meta.url), 'utf8'));
  assert.match(fred.description, /API Key/);
  assert.match(fred.description, /未获圣路易斯联储认可或认证/);
  assert.match(pubmed.description, /文章级许可/);
  assert.match(pubmed.description, /不构成医疗诊断或治疗建议/);
});

function cardFixture() {
  const item = {
    ...manifestItem(),
    icon: '📊',
    promptTitlesZh: ['查询', '比较'],
    cardSummaryZh: '查询示例数据。',
    cardDescriptionZh: '由独立社区维护，并非官方产品。',
    tagsZh: ['示例', '市场', '公开', '数据'],
  };
  const record = {
    id: item.id,
    probe: { targetUrl: item.endpoint, checkedAt: item.probeCheckedAt },
    officialLinks: { websiteUrl: 'https://data.example.com' },
  };
  return { item, record };
}

test('Connector generation refuses a placeholder prompt', () => {
  const { record, item } = cardFixture();
  assert.throws(() => buildConnectorDescriptor(record, {
    ...item,
    starterPromptsZh: ['查询 {{researchQuestion}}', item.starterPromptsZh[1]],
  }), /without template placeholders/);
});

test('Connector generation accepts a reviewed website-only third-party service and category', () => {
  const { record, item } = cardFixture();
  const descriptor = buildConnectorDescriptor(record, {
    ...item,
    categoryZh: '法律合规',
    cardDescriptionZh: '连接公开数据完成合规研究。本连接器由 Example 独立服务维护，并非数据机构官方产品。',
  });
  assert.equal(descriptor.homepage, 'https://data.example.com');
  assert.equal(descriptor.category, '法律合规');
});
