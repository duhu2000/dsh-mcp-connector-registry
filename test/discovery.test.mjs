import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import test from 'node:test';
import {
  buildConnectorIndex,
  candidateId,
  dedupeCandidate,
  normalizeOfficialServer,
  scoreCandidate,
} from '../scripts/discovery/candidate-model.mjs';
import {
  collectOfficialRegistry,
  discoverOfficialCandidates,
} from '../scripts/discovery/official-registry.mjs';
import {
  probeCandidate,
  probeRemoteUrl,
} from '../scripts/discovery/public-probe.mjs';

const NOW = '2026-08-30T00:00:00.000Z';

function officialEntry({
  name = 'com.example/market-data',
  title = 'Example Market Data',
  description = 'Financial market data, company analytics, and public statistics.',
  version = '1.2.3',
  url = 'https://data.example.com/mcp',
  repository = { url: 'https://github.com/example/market-data', source: 'github', id: '123' },
  websiteUrl = 'https://data.example.com/docs',
  headers = [{ name: 'Authorization', isRequired: true, isSecret: true, description: 'Bearer secret-is-not-copied' }],
  status = 'active',
} = {}) {
  return {
    server: {
      name,
      title,
      description,
      version,
      repository,
      websiteUrl,
      remotes: [{ type: 'streamable-http', url, headers }],
    },
    _meta: {
      'io.modelcontextprotocol.registry/official': {
        status,
        publishedAt: '2026-08-20T00:00:00.000Z',
        updatedAt: '2026-08-29T00:00:00.000Z',
        isLatest: true,
      },
      'publisher/private-extension': {
        contactEmail: 'person@example.com',
        token: 'must-not-be-copied',
      },
    },
  };
}

test('Official Registry collector follows opaque cursors and supports incremental sync', async () => {
  const calls = [];
  const progress = [];
  const pages = [
    { servers: [officialEntry()], metadata: { nextCursor: 'opaque:one', count: 1 } },
    { servers: [officialEntry({ name: 'org.example/research-data' })], metadata: { count: 1 } },
  ];
  const result = await collectOfficialRegistry({
    updatedSince: '2026-08-01T00:00:00.000Z',
    limit: 50,
    onPage: (value) => progress.push(value),
    fetchImpl: async (url, options) => {
      calls.push({ url: String(url), options });
      return new Response(JSON.stringify(pages[calls.length - 1]), { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });

  assert.equal(result.pages, 2);
  assert.equal(result.records.length, 2);
  assert.deepEqual(progress, [
    { page: 1, count: 1, total: 1, nextCursor: 'opaque:one' },
    { page: 2, count: 1, total: 2, nextCursor: null },
  ]);
  const first = new URL(calls[0].url);
  const second = new URL(calls[1].url);
  assert.equal(first.searchParams.get('version'), 'latest');
  assert.equal(first.searchParams.get('updated_since'), '2026-08-01T00:00:00.000Z');
  assert.equal(first.searchParams.get('include_deleted'), 'true');
  assert.equal(second.searchParams.get('cursor'), 'opaque:one');
  assert.equal(calls[0].options.redirect, 'error');
  assert.ok(calls[0].options.signal instanceof AbortSignal);
  assert.doesNotMatch(JSON.stringify(calls), /Authorization|token/i);
});

test('Official Registry collector retries transient failures and preserves bounded progress', async () => {
  let attempts = 0;
  const progress = [];
  const result = await collectOfficialRegistry({
    maxAttempts: 2,
    retryBaseMs: 0,
    onPage: (value) => progress.push(value),
    fetchImpl: async () => {
      attempts += 1;
      if (attempts === 1) return new Response('{}', { status: 503 });
      return new Response(JSON.stringify({ servers: [officialEntry()], metadata: {} }), { status: 200 });
    },
  });
  assert.equal(attempts, 2);
  assert.equal(result.records.length, 1);
  assert.deepEqual(progress, [{ page: 1, count: 1, total: 1, nextCursor: null }]);
});

test('Official Registry collector rejects unsupported page sizes before network access', async () => {
  let called = false;
  await assert.rejects(
    collectOfficialRegistry({ limit: 101, fetchImpl: async () => { called = true; } }),
    /limit must be an integer from 1 to 100/,
  );
  assert.equal(called, false);
});

test('normalization copies only allowlisted public evidence and never copies header values or arbitrary metadata', () => {
  const candidate = normalizeOfficialServer(officialEntry({
    description: 'Market data maintained by person@example.com',
    url: 'https://data.example.com/mcp?api_key=must-not-survive#fragment',
    websiteUrl: 'https://data.example.com/docs?token=website-value-must-not-survive',
    repository: {
      url: 'https://github.com/example/market-data?secret=repository-value-must-not-survive',
      source: 'github',
      id: '123',
    },
  }), { retrievedAt: NOW });
  const serialized = JSON.stringify(candidate);

  assert.equal(candidate.registryName, 'com.example/market-data');
  assert.equal(candidate.transports[0].url, 'https://data.example.com/mcp');
  assert.equal(candidate.officialLinks.websiteUrl, 'https://data.example.com/docs');
  assert.equal(candidate.officialLinks.repository.url, 'https://github.com/example/market-data');
  assert.equal(candidate.authentication.mode, 'bearer');
  assert.deepEqual(candidate.authentication.requiredHeaders, [{ name: 'Authorization', required: true, secret: true }]);
  assert.match(candidate.description, /\[redacted-email\]/);
  assert.doesNotMatch(serialized, /person@example\.com|must-not-be-copied|secret-is-not-copied|must-not-survive/);
  assert.equal(candidate.license.status, 'unknown');
  assert.equal(candidate.probe.status, 'not-run');
  assert.equal(candidate.runtimeAcceptance.status, 'not-run');
});

test('selection stays gated until probe, authentication, and license evidence are ready', () => {
  const candidate = dedupeCandidate(
    normalizeOfficialServer(officialEntry(), { retrievedAt: NOW }),
    buildConnectorIndex([]),
  );
  candidate.probe.status = 'pass';
  candidate.license = { status: 'declared', spdxId: 'MIT', evidenceUrl: 'https://example.com/license' };
  scoreCandidate(candidate);
  assert.equal(candidate.score.band, 'selected');

  candidate.authentication.mode = 'unknown';
  scoreCandidate(candidate);
  assert.equal(candidate.score.band, 'watchlist');
  assert.ok(candidate.score.gates.some((gate) => /Authentication mode/.test(gate)));
});

test('strong duplicate uses exact stable identity while host/name similarity remains a non-suppressing weak hint', () => {
  const index = buildConnectorIndex([
    {
      id: 'existing-market',
      servers: [{ serverName: 'existing-market', url: 'https://data.example.com/mcp' }],
    },
  ]);
  const strong = dedupeCandidate(normalizeOfficialServer(officialEntry(), { retrievedAt: NOW }), index);
  const weak = dedupeCandidate(normalizeOfficialServer(officialEntry({
    name: 'com.example/alternative-data',
    title: 'Alternative Data',
    url: 'https://data.example.com/another-mcp',
  }), { retrievedAt: NOW }), index);

  assert.equal(strong.dedupe.level, 'strong');
  assert.ok(strong.dedupe.strong.some((match) => match.key === 'url:https://data.example.com/mcp'));
  assert.equal(weak.dedupe.level, 'weak');
  assert.equal(weak.dedupe.strong.length, 0);
  assert.ok(weak.dedupe.weak.some((match) => match.key === 'host:data.example.com'));
});

test('explainable score is the exact sum of bounded dimensions and gates duplicates/non-data', async () => {
  const unique = scoreCandidate(dedupeCandidate(
    normalizeOfficialServer(officialEntry(), { retrievedAt: NOW }),
    buildConnectorIndex([]),
  ));
  assert.equal(unique.score.total, Object.values(unique.score.dimensions).reduce((sum, value) => sum + value, 0));
  assert.equal(unique.score.band, 'watchlist');
  assert.equal(unique.score.reasons.length, 6);
  assert.ok(unique.score.gates.some((gate) => /runtime acceptance/.test(gate)));

  const { candidates } = await discoverOfficialCandidates({
    entries: [
      officialEntry(),
      officialEntry({ name: 'com.example/task-runner', title: 'Task Runner', description: 'Run tasks and send messages.' }),
    ],
    connectors: [{ id: 'existing-market', servers: [{ serverName: 'existing-market', url: 'https://data.example.com/mcp' }] }],
    retrievedAt: NOW,
  });
  const duplicate = candidates.find((candidate) => candidate.registryName === 'com.example/market-data');
  const notData = candidates.find((candidate) => candidate.registryName === 'com.example/task-runner');
  assert.equal(duplicate.score.band, 'duplicate');
  assert.equal(notData.score.band, 'not-data');
});

test('app deployment platforms are not classified as data services from an incidental database keyword', () => {
  const platform = normalizeOfficialServer(officialEntry({
    name: 'dev.example/app-platform',
    title: 'App Platform',
    description: 'Deploy a multi-user web app from your agent: hosting, auth, database, and permissions.',
  }), { retrievedAt: NOW });
  assert.equal(platform.classification.isDataService, false);
  assert.deepEqual(platform.classification.matchedKeywords, ['database']);
  scoreCandidate(platform);
  assert.equal(platform.score.band, 'not-data');
});

test('generated candidate contains every Candidate JSON Schema root field', async () => {
  const schema = JSON.parse(await readFile(resolve('schema/candidate.schema.json'), 'utf8'));
  const candidate = scoreCandidate(dedupeCandidate(
    normalizeOfficialServer(officialEntry(), { retrievedAt: NOW }),
    buildConnectorIndex([]),
  ));
  assert.deepEqual(schema.required.filter((field) => !(field in candidate)), []);
  assert.equal(candidate.id, candidateId(candidate.registryName));
  assert.notEqual(candidateId('com.example/foo.bar'), candidateId('com.example/foo-bar'));
  assert.equal(schema.properties.score.properties.total.maximum, 100);
  assert.deepEqual(schema.properties.score.properties.band.enum, ['selected', 'watchlist', 'defer', 'duplicate', 'not-data']);
});

test('offline discovery CLI writes review-only report and candidate records deterministically', async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), 'candidate-discovery-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const input = resolve(root, 'official-registry.json');
  const output = resolve(root, 'output');
  await writeFile(input, JSON.stringify({ servers: [officialEntry()] }));

  const result = spawnSync(process.execPath, [
    resolve('scripts/discover-candidates.mjs'),
    '--input', input,
    '--output', output,
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(await readFile(resolve(output, 'candidate-report.json'), 'utf8'));
  const markdown = await readFile(resolve(output, 'candidate-report.md'), 'utf8');
  assert.equal(report.summary.scanned, 1);
  assert.equal(report.summary.dataCandidates, 1);
  assert.equal(report.candidates[0].registryName, 'com.example/market-data');
  assert.match(markdown, /only recommends candidates/i);
  assert.doesNotMatch(JSON.stringify(report), /must-not-be-copied|secret-is-not-copied/);
});

test('public probe sends only a bounded credential-free MCP initialize request', async () => {
  let observed;
  const result = await probeRemoteUrl('https://data.example.com/mcp', {
    checkedAt: NOW,
    lookupImpl: async () => [{ address: '93.184.216.34', family: 4 }],
    fetchImpl: async (url, options) => {
      observed = { url, options };
      return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: { protocolVersion: '2025-06-18' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });
  assert.equal(result.status, 'pass');
  assert.equal(observed.options.method, 'POST');
  assert.equal(observed.options.redirect, 'manual');
  assert.equal(JSON.parse(observed.options.body).method, 'initialize');
  assert.equal(observed.options.headers.Authorization, undefined);
  assert.equal(observed.options.headers.Cookie, undefined);
});

test('default public probe pins the HTTPS connection to the audited public DNS address', async () => {
  let connectedAddress;
  const requestImpl = (_url, options, callback) => {
    const request = new EventEmitter();
    request.end = () => {
      options.lookup('data.example.com', { all: false }, (error, address, family) => {
        assert.ifError(error);
        connectedAddress = { address, family };
      });
      const response = new PassThrough();
      response.statusCode = 200;
      response.headers = { 'content-type': 'application/json' };
      callback(response);
      response.end(JSON.stringify({ jsonrpc: '2.0', id: 1, result: { protocolVersion: '2025-06-18' } }));
    };
    request.destroy = (error) => { if (error) request.emit('error', error); };
    return request;
  };
  const result = await probeRemoteUrl('https://data.example.com/mcp', {
    checkedAt: NOW,
    lookupImpl: async () => [{ address: '93.184.216.34', family: 4 }],
    requestImpl,
  });
  assert.equal(result.status, 'pass');
  assert.deepEqual(connectedAddress, { address: '93.184.216.34', family: 4 });
});

test('public probe blocks private DNS and treats authentication challenges as partial reachability', async () => {
  let fetchCalled = false;
  const blocked = await probeRemoteUrl('https://internal.example.com/mcp', {
    checkedAt: NOW,
    lookupImpl: async () => [{ address: '10.0.0.5', family: 4 }],
    fetchImpl: async () => { fetchCalled = true; return new Response('', { status: 200 }); },
  });
  assert.equal(blocked.status, 'fail');
  assert.equal(fetchCalled, false);
  assert.match(blocked.reason, /public addresses/);

  const authRequired = await probeRemoteUrl('https://data.example.com/mcp', {
    checkedAt: NOW,
    lookupImpl: async () => [{ address: '93.184.216.34', family: 4 }],
    fetchImpl: async () => new Response('', { status: 401 }),
  });
  assert.equal(authRequired.status, 'partial');
  assert.equal(authRequired.httpStatus, 401);
});

test('a failed public probe defers a candidate but never changes catalog state', async () => {
  const candidate = scoreCandidate(dedupeCandidate(
    normalizeOfficialServer(officialEntry(), { retrievedAt: NOW }),
    buildConnectorIndex([]),
  ));
  await probeCandidate(candidate, {
    checkedAt: NOW,
    lookupImpl: async () => [{ address: '93.184.216.34', family: 4 }],
    fetchImpl: async () => new Response('upstream error', { status: 503 }),
  });
  assert.equal(candidate.probe.status, 'fail');
  assert.equal(candidate.score.band, 'defer');
  assert.ok(candidate.score.gates.some((gate) => /never delists/.test(gate)));
  assert.ok(candidate.evidence.some((item) => item.type === 'probe'));
});
