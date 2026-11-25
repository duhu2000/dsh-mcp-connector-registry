import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { verifyRuntimeAcceptance } from '../scripts/check-new-connectors.mjs';

function acceptedRecord() {
  return {
    schemaVersion: 1,
    id: 'com-example-approved-data-0123456789',
    registryName: 'com.example/approved-data',
    classification: { isDataService: true },
    source: { kind: 'official-mcp-registry', status: 'active' },
    score: {
      total: 90,
      band: 'selected',
      dimensions: {
        authority: 25,
        accessibility: 25,
        maintenanceSecurity: 15,
        runtime: 15,
        marketGap: 5,
        documentation: 5,
      },
    },
    review: {
      decision: 'approved',
      proposedConnectorId: 'approved-data',
      reviewedAt: '2026-08-30T00:00:00.000Z',
      reviewedBy: 'registry-maintainer',
      notes: 'Official vendor, endpoint, auth, terms, and safety boundaries reviewed.',
    },
    probe: { status: 'pass' },
    authentication: { mode: 'bearer' },
    license: { status: 'not-applicable', evidenceUrl: 'https://example.com/terms' },
    runtimeAcceptance: {
      status: 'pass',
      checkedAt: '2026-08-30T01:00:00.000Z',
      reviewedBy: 'runtime-reviewer',
      reportUrl: 'https://github.com/example/reports/runtime-acceptance.md',
      notes: 'Initialize, tools/list, and a safe read-only tool call passed; credentials were redacted.',
    },
    evidence: [
      { type: 'official-registry', url: 'https://registry.modelcontextprotocol.io/v0.1/servers/com.example%2Fapproved-data/versions/1.0.0' },
      { type: 'license', url: 'https://example.com/terms' },
      { type: 'runtime-acceptance', url: 'https://github.com/example/reports/runtime-acceptance.md' },
    ],
  };
}

function acceptedOfficialVendorRecord() {
  const record = acceptedRecord();
  record.registryName = 'npm:@example/developer-mcp';
  record.classification.isDataService = false;
  record.source = {
    kind: 'official-vendor',
    status: 'active',
    detailUrl: 'https://developer.example.com/mcp',
  };
  record.evidence = record.evidence.map((item) => (
    item.type === 'official-registry'
      ? { type: 'official-vendor', url: 'https://developer.example.com/mcp' }
      : item
  ));
  return record;
}

test('new Connector acceptance requires human approval and a matching real runtime report', () => {
  assert.deepEqual(verifyRuntimeAcceptance({ id: 'approved-data' }, acceptedRecord()), []);

  const incomplete = acceptedRecord();
  incomplete.review.decision = 'pending';
  incomplete.authentication.mode = 'unknown';
  incomplete.license.status = 'unknown';
  incomplete.runtimeAcceptance.status = 'not-run';
  incomplete.evidence = [];
  const errors = verifyRuntimeAcceptance({ id: 'approved-data' }, incomplete);
  assert.ok(errors.some((error) => /decision must be approved/.test(error)));
  assert.ok(errors.some((error) => /authentication mode/.test(error)));
  assert.ok(errors.some((error) => /license or service-terms/.test(error)));
  assert.ok(errors.some((error) => /runtime acceptance must pass/.test(error)));
  assert.ok(errors.some((error) => /evidence must match/.test(error)));
  assert.ok(errors.some((error) => /Official Registry evidence/.test(error)));
});

test('new Connector acceptance supports a reviewed official-vendor non-data MCP', () => {
  assert.deepEqual(verifyRuntimeAcceptance({ id: 'approved-data' }, acceptedOfficialVendorRecord()), []);

  const missingVendorEvidence = acceptedOfficialVendorRecord();
  missingVendorEvidence.evidence = missingVendorEvidence.evidence.filter((item) => item.type !== 'official-vendor');
  const errors = verifyRuntimeAcceptance({ id: 'approved-data' }, missingVendorEvidence);
  assert.ok(errors.some((error) => /official vendor evidence/.test(error)));
});

test('SHOPLINE publishes a pinned stdio command and consent guidance', async () => {
  const descriptor = JSON.parse(await readFile(new URL(
    '../connectors/shopline-developer-mcp.json',
    import.meta.url,
  ), 'utf8'));
  assert.equal(descriptor.auth.mode, 'none');
  assert.equal(descriptor.servers[0].transport, 'stdio');
  assert.deepEqual(descriptor.servers[0].args, ['-y', '@shoplineos/shopline-developer-mcp@1.1.0']);
  assert.equal(descriptor.prompts.length, 2);
  assert.equal('promptVariables' in descriptor, false);
  assert.equal(descriptor.prompts.some((prompt) => /\{\{|研究问题|请填写/.test(prompt.text)), false);
  assert.match(descriptor.description, /明确同意/);
});

test('runtime acceptance gate rejects mismatched IDs, non-HTTPS evidence, and credential-looking values', () => {
  const record = acceptedRecord();
  record.review.proposedConnectorId = 'another-id';
  record.runtimeAcceptance.reportUrl = 'http://example.com/report';
  record.runtimeAcceptance.notes = 'token=abcdefghijklmnopqrstuvwxyz';
  const errors = verifyRuntimeAcceptance({ id: 'approved-data' }, record);
  assert.ok(errors.some((error) => /must match/.test(error)));
  assert.ok(errors.some((error) => /must use HTTPS/.test(error)));
  assert.ok(errors.some((error) => /credential value/.test(error)));
});

test('CI runs the acceptance gate only for newly added Connector descriptors', async () => {
  const workflow = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const template = await readFile(new URL('../.github/PULL_REQUEST_TEMPLATE.md', import.meta.url), 'utf8');
  assert.match(workflow, /fetch-depth: 0/);
  assert.match(workflow, /check-new-connectors\.mjs --base/);
  assert.match(workflow, /github\.event_name == 'pull_request'/);
  assert.match(template, /real runtime acceptance report/);
});

function limitedListing() {
  const record = acceptedOfficialVendorRecord();
  record.review.scope = 'connection-only';
  record.dedupe = { level: 'none' };
  record.score.total -= record.score.dimensions.runtime;
  record.score.dimensions.runtime = 0;
  record.score.band = 'watchlist';
  record.connectionAcceptance = {
    status: 'pass', toolCount: 2, checkedAt: record.review.reviewedAt,
    reviewedBy: 'connection-reviewer', reportUrl: 'https://example.com/reports/connection',
    notes: 'Connection and tool discovery succeeded.',
  };
  record.runtimeAcceptance = {
    status: 'not-run', checkedAt: null, reviewedBy: null, reportUrl: null, notes: 'No business tool was called.',
  };
  record.evidence = record.evidence.filter(e => e.type !== 'runtime-acceptance');
  record.evidence.push({ type: 'connection-acceptance', url: record.connectionAcceptance.reportUrl });
  const descriptor = { id: 'approved-data', featured: false, published: true, probeStatus: 'partial', description: '业务查询尚未验收。' };
  return { descriptor, record };
}

test('limited listings retain approval scope while recording later pass/fail evidence', () => {
  for (const status of ['pass', 'fail']) {
    const { record, descriptor } = limitedListing();
    record.runtimeAcceptance = { ...acceptedRecord().runtimeAcceptance, status };
    record.evidence.push({ type: 'runtime-acceptance', url: record.runtimeAcceptance.reportUrl });
    descriptor.probeStatus = status === 'pass' ? 'pass' : 'partial';
    descriptor.description = status === 'pass' ? '运行验收通过，业务查询通过，其他范围尚未验收。' : '有限验收，业务查询未通过，其他范围尚未验收。';
    assert.equal(record.runtimeAcceptance.status, status);
    assert.equal(descriptor.probeStatus, status === 'pass' ? 'pass' : 'partial');
    assert.deepEqual(verifyRuntimeAcceptance(descriptor, record), []);
    for (const mutate of [
      r => { r.runtimeAcceptance.checkedAt = r.review.reviewedAt; },
      r => { r.runtimeAcceptance.reviewedBy = ''; },
      r => { r.evidence = r.evidence.filter(e => e.type !== 'runtime-acceptance'); },
      r => { r.runtimeAcceptance.reportUrl = 'http://example.com'; },
    ]) {
      const copy = structuredClone(record); mutate(copy);
      assert.ok(verifyRuntimeAcceptance(descriptor, copy).length > 0);
    }
    for (const mutate of [
      d => { d.probeStatus = status === 'pass' ? 'partial' : 'pass'; },
      d => { d.featured = true; },
      d => { d.description = '业务查询通过'; },
      d => { d.description = `有限验收，业务查询${status === 'pass' ? '未通过' : '通过'}，其他范围尚未验收。`; },
    ]) {
      const copy = structuredClone(descriptor); mutate(copy);
      assert.ok(verifyRuntimeAcceptance(copy, record).length > 0);
    }
  }
});

test('named connection-only approval publishes partial cards without inventing business acceptance', () => {
  const { descriptor, record } = limitedListing();
  assert.deepEqual(verifyRuntimeAcceptance(descriptor, record), []);
  assert.equal(record.review.reviewedBy, 'registry-maintainer');
  assert.equal(record.runtimeAcceptance.status, 'not-run');
  assert.equal(record.score.dimensions.runtime, 0);
  assert.equal(record.score.band, 'watchlist');
  assert.equal(descriptor.probeStatus, 'partial');
});

test('connection-only path cannot silently replace full runtime approval', () => {
  for (const scope of [undefined, 'full-runtime', 'typo']) {
    const { descriptor, record } = limitedListing();
    record.review.scope = scope;
    const errors = verifyRuntimeAcceptance(descriptor, record);
    assert.ok(errors.includes('real runtime acceptance must pass'));
    assert.ok(errors.includes('candidate must pass the selected score gate'));
  }
});

test('connection-only path rejects missing approval, missing evidence, or disguised runtime success', () => {
  const mutations = [
    r => { r.review.decision = 'pending'; },
    r => { r.review.reviewedBy = ' '; },
    r => { r.review.reviewedAt = 'invalid'; },
    r => { delete r.connectionAcceptance; },
    r => { r.connectionAcceptance.status = 'fail'; },
    r => { r.connectionAcceptance.toolCount = 0; },
    r => { r.connectionAcceptance.checkedAt = 'invalid'; },
    r => { r.connectionAcceptance.reportUrl = 'http://example.com/report'; },
    r => { r.evidence = r.evidence.filter(e => e.type !== 'connection-acceptance'); },
    r => { r.runtimeAcceptance.status = 'pass'; },
    r => { r.runtimeAcceptance.checkedAt = '2026-11-15T00:00:00Z'; },
    r => { r.score.dimensions.runtime = 7; r.score.total += 7; },
    r => { r.dedupe.level = 'strong'; },
    r => { r.authentication.mode = 'unknown'; },
    r => { r.license.status = 'unknown'; },
    r => { r.evidence = r.evidence.filter(e => e.type !== 'license'); },
  ];
  for (const mutate of mutations) {
    const { descriptor, record } = limitedListing();
    mutate(record);
    assert.ok(verifyRuntimeAcceptance(descriptor, record).length > 0, String(mutate));
  }
});

test('connection-only cards cannot hide limitations or claim recommended/full validation', () => {
  for (const mutate of [
    d => { d.featured = true; },
    d => { d.probeStatus = 'pass'; },
    d => { d.description = '业务查询已验收'; },
    d => { d.published = false; },
  ]) {
    const { descriptor, record } = limitedListing();
    mutate(descriptor);
    assert.ok(verifyRuntimeAcceptance(descriptor, record).length > 0);
  }
});

test('moving a draft into connectors cannot skip the new-connector gate via Git rename detection', async () => {
  const { mkdtemp, mkdir, writeFile, rename, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { execFileSync, spawnSync } = await import('node:child_process');
  const cwd = await mkdtemp(join(tmpdir(), 'registry-promote-gate-'));
  const git = (...args) => execFileSync('git', args, { cwd, stdio: 'pipe' });
  try {
    git('init');
    git('config', 'user.name', 'registry-test');
    git('config', 'user.email', 'registry-test@example.invalid');
    await mkdir(join(cwd, 'drafts'));
    await mkdir(join(cwd, 'connectors'));
    await writeFile(join(cwd, 'drafts/example.json'), '{"id":"example"}\n');
    git('add', '.');
    git('-c', 'commit.gpgsign=false', 'commit', '-m', 'QMCP-2014 test draft fixture');
    const base = git('rev-parse', 'HEAD').toString().trim();
    await rename(join(cwd, 'drafts/example.json'), join(cwd, 'connectors/example.json'));
    git('add', '-A');
    git('-c', 'commit.gpgsign=false', 'commit', '-m', 'QMCP-2014 test promotion fixture');
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/check-new-connectors.mjs', import.meta.url)), '--base', base], { cwd, encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /missing candidates\/records\/example.json/);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test('unpublished service terms require a scoped named exception and preserve unknown facts', () => {
  const descriptor = { id: 'approved-data', published: true, featured: false, probeStatus: 'pass', description: '服务条款未公开，尚未核验。' };
  const record = acceptedOfficialVendorRecord();
  record.license = { status: 'unknown', spdxId: null, evidenceUrl: null };
  record.review.serviceTermsException = {
    reasonCode: 'official-terms-unavailable', decision: 'approved', connectorId: descriptor.id,
    reviewedAt: record.review.reviewedAt, reviewedBy: record.review.reviewedBy,
    notes: 'Public terms could not be verified.', reportUrl: 'https://example.com/reports/terms-review',
  };
  record.evidence = record.evidence.filter(e => e.type !== 'license');
  record.evidence.push({ type: 'service-terms-exception', url: record.review.serviceTermsException.reportUrl });
  assert.equal(record.license.status, 'unknown');
  assert.equal(record.license.evidenceUrl, null);
  assert.deepEqual(verifyRuntimeAcceptance(descriptor, record), []);
  for (const mutate of [
    r => { delete r.review.serviceTermsException; },
    r => { r.review.serviceTermsException.connectorId = 'other-connector'; },
    r => { r.review.serviceTermsException.reviewedBy = 'other-reviewer'; },
    r => { r.review.serviceTermsException.reviewedAt = 'invalid'; },
    r => { r.review.serviceTermsException.notes = ''; },
    r => { r.review.serviceTermsException.notes = 1; },
    r => { r.review.serviceTermsException.reviewedBy = 1; },
    r => { r.review.serviceTermsException.decision = 'pending'; },
    r => { r.review.decision = 'pending'; },
    r => { r.review.scope = 'connection-only'; },
    r => { r.runtimeAcceptance.status = 'not-run'; },
    r => { r.authentication.mode = 'unknown'; },
    r => { r.license.status = 'declared'; },
    r => { r.license.evidenceUrl = 'https://example.com/fake-terms'; },
    r => { r.evidence = r.evidence.filter(e => e.type !== 'service-terms-exception'); },
    r => { r.evidence = r.evidence.filter(e => e.type !== 'runtime-acceptance'); },
    r => { r.score.total = 79; },
  ]) {
    const copy = structuredClone(record); mutate(copy);
    assert.ok(verifyRuntimeAcceptance(descriptor, copy).length > 0, String(mutate));
  }
  for (const mutate of [
    d => { d.description = '仅展示工具能力'; },
    d => { d.featured = true; },
    d => { d.probeStatus = 'partial'; },
  ]) {
    const copy = structuredClone(descriptor); mutate(copy);
    assert.ok(verifyRuntimeAcceptance(copy, record).length > 0, String(mutate));
  }
});
