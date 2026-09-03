import assert from 'node:assert/strict';
import test from 'node:test';
import {
  auditCuratedSources,
  auditGitHubRepository,
  auditPackage,
  assertNoCredentialValues,
  buildLastGoodSnapshot,
  collectCuratedSources,
  fetchCuratedSource,
  mergeCuratedEntries,
  renderCuratedSourceReport,
} from '../scripts/discovery/curated-source-audit.mjs';
import {
  normalizeCuratedSourceEntry,
  parseBridgeReadmeVerification,
  parsePanelCatalog,
} from '../scripts/discovery/curated-source-parsers.mjs';

const NOW = '2026-09-03T00:00:00.000Z';
const REVISION = 'a'.repeat(40);

function npmResponse(name, {
  version = '1.2.3',
  repository = 'git+https://github.com/example/server.git',
  homepage,
  deprecated,
} = {}) {
  return new Response(JSON.stringify({
    name,
    'dist-tags': { latest: version },
    versions: {
      [version]: {
        name,
        version,
        ...(repository ? { repository: { url: repository } } : {}),
        ...(homepage ? { homepage } : {}),
        ...(deprecated ? { deprecated } : {}),
      },
    },
    time: { modified: '2026-09-01T00:00:00.000Z' },
  }), { status: 200, headers: { 'content-type': 'application/json' } });
}

function githubResponse(fullName, overrides = {}) {
  return new Response(JSON.stringify({
    full_name: fullName,
    archived: false,
    pushed_at: '2026-09-01T00:00:00.000Z',
    license: { spdx_id: 'Apache-2.0' },
    ...overrides,
  }), { status: 200, headers: { 'content-type': 'application/json' } });
}

function sourceEntry(overrides = {}) {
  return normalizeCuratedSourceEntry({
    id: 'example',
    name: 'Example Data',
    description: 'Public data and statistics for research.',
    homepage: 'https://github.com/example/server',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@example/server@latest'],
    ...overrides,
  }, { sourceId: 'example-source', sourceFormat: 'market-json' });
}

test('panel parser accepts only the static built-in catalog shape', () => {
  const entries = parsePanelCatalog(`
    export const DEFAULT_CATALOG: readonly CatalogEntry[] = Object.freeze([
      { id: 'alpha', name: 'Alpha', description: 'Public data search.', transport: 'stdio', command: 'npx', args: ['-y', '@example/alpha@latest'], envKeys: ['ALPHA_KEY'] },
      { id: 'beta', name: 'Beta', description: 'Remote public statistics.', transport: 'streamable-http', url: 'https://data.example.com/mcp' },
    ])
  `);
  assert.equal(entries.length, 2);
  assert.deepEqual(entries[0].args, ['-y', '@example/alpha@latest']);
  assert.deepEqual(entries[0].envKeys, ['ALPHA_KEY']);
  assert.equal(entries[1].url, 'https://data.example.com/mcp');
});

test('bridge README verification fills tool counts and exposes source-internal drift', () => {
  const readme = parseBridgeReadmeVerification('| `filesystem` | files | root | ✅ 14 tools |');
  const entry = normalizeCuratedSourceEntry({
    id: 'mcp-filesystem',
    serverName: 'filesystem',
    title: 'Filesystem',
    description: 'Filesystem access under an explicitly granted root.',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', 'C:/path/to/allowed/root'],
    requiredEnv: [],
    verify: { status: 'needs-config', date: '2026-08-15', note: 'Server verified working (13 tools) when given a real directory.' },
  }, { sourceId: 'bridge', sourceFormat: 'bridge-json-directory', readmeVerification: readme });
  assert.equal(entry.verification.status, 'DEFERRED');
  assert.equal(entry.verification.toolCount, null);
  assert.match(entry.verification.reason, /definition says 13, README says 14/);
  assert.equal(entry.access.mode, 'requires-configuration');
});

test('remote URL userinfo is discarded without copying its value', () => {
  const entry = normalizeCuratedSourceEntry({
    id: 'unsafe-remote', name: 'Unsafe Remote', description: 'Public data endpoint.',
    transport: 'streamable-http', url: 'https://alice:never-copy-this@example.com/mcp',
  }, { sourceId: 'market', sourceFormat: 'market-json' });
  assert.equal(entry.url, null);
  assert.equal(entry.urlSanitization.rejectedUserInfo, true);
  assert.equal(entry.verification.status, 'DEFERRED');
  assert.equal(entry.access.mode, 'requires-configuration');
  assert.doesNotMatch(JSON.stringify(entry), /alice|never-copy-this/);
});

test('credential query and fragment are removed from public and localhost URLs', () => {
  const remote = normalizeCuratedSourceEntry({
    id: 'remote', name: 'Remote', description: 'Public data endpoint.',
    transport: 'streamable-http', url: 'https://example.com/mcp?api_key=never-copy-query#fragment',
  }, { sourceId: 'market', sourceFormat: 'market-json' });
  assert.equal(remote.url, 'https://example.com/mcp');
  assert.equal(remote.urlSanitization.removedCredentialQuery, true);
  assert.equal(remote.verification.status, 'DEFERRED');
  assert.equal(remote.access.mode, 'requires-credentials');
  assert.doesNotMatch(JSON.stringify(remote), /never-copy-query|fragment/);

  const local = normalizeCuratedSourceEntry({
    id: 'local', name: 'Local', description: 'Local MCP template.',
    transport: 'streamable-http', url: 'http://localhost:3000/mcp?token=never-copy-local#fragment',
  }, { sourceId: 'bridge', sourceFormat: 'bridge-json-directory' });
  assert.equal(local.url, 'http://localhost:3000/mcp');
  assert.equal(local.access.mode, 'requires-credentials');
  assert.equal(local.verification.status, 'DEFERRED');
  assert.doesNotMatch(JSON.stringify(local), /never-copy-local|fragment/);

  const configuredLocal = normalizeCuratedSourceEntry({
    id: 'configured-local', name: 'Configured Local', description: 'Local MCP template.',
    transport: 'streamable-http', url: 'http://localhost:3000/mcp?workspace=never-copy-workspace',
  }, { sourceId: 'bridge', sourceFormat: 'bridge-json-directory' });
  assert.equal(configuredLocal.url, 'http://localhost:3000/mcp');
  assert.equal(configuredLocal.access.mode, 'requires-configuration');
  assert.doesNotMatch(JSON.stringify(configuredLocal), /never-copy-workspace/);

  const plainLocal = normalizeCuratedSourceEntry({
    id: 'plain-local', name: 'Plain Local', description: 'Local MCP template.',
    transport: 'streamable-http', url: 'http://localhost:3000/mcp',
  }, { sourceId: 'bridge', sourceFormat: 'bridge-json-directory' });
  assert.equal(plainLocal.url, 'http://localhost:3000/mcp');
  assert.equal(plainLocal.access.mode, 'template');
});

test('stdio output stores only an argument summary and redacts credential flag values', () => {
  const entry = normalizeCuratedSourceEntry({
    id: 'safe-args', name: 'Safe Args', description: 'Public research data.', transport: 'stdio', command: 'npx',
    args: ['-y', '@example/server@latest', '--token', 'never-copy-token', '--api-key=never-copy-key', '--mode=readonly', '/private/path'],
  }, { sourceId: 'market', sourceFormat: 'market-json' });
  assert.equal(Object.hasOwn(entry, 'args'), false);
  assert.equal(entry.package.name, '@example/server');
  assert.deepEqual(entry.argumentSummary.credentialFlags, ['--api-key', '--token']);
  assert.equal(entry.argumentSummary.redactedCredentialValueCount, 2);
  assert.equal(entry.argumentSummary.positionalValueCount, 1);
  assert.equal(entry.access.mode, 'requires-credentials');
  assert.doesNotMatch(JSON.stringify(entry), /never-copy-token|never-copy-key|readonly|\/private\/path/);
  assertNoCredentialValues(entry);
});

test('credential flag values cannot be misclassified and persisted as package names', () => {
  const entry = normalizeCuratedSourceEntry({
    id: 'safe-package', name: 'Safe Package', description: 'Public research data.', transport: 'stdio', command: 'npx',
    args: ['--token', 'never-package-this-secret', '@example/actual-server@latest'],
  }, { sourceId: 'market', sourceFormat: 'market-json' });
  assert.equal(entry.package.name, '@example/actual-server');
  assert.doesNotMatch(JSON.stringify(entry), /never-package-this-secret/);
  assertNoCredentialValues(entry);

  const headerEntry = normalizeCuratedSourceEntry({
    id: 'safe-header-package', name: 'Safe Header Package', description: 'Public research data.', transport: 'stdio', command: 'npx',
    args: ['--header', 'Authorization: Bearer never-package-this-header', '@example/actual-server@latest'],
  }, { sourceId: 'market', sourceFormat: 'market-json' });
  assert.equal(headerEntry.package.name, '@example/actual-server');
  assert.deepEqual(headerEntry.argumentSummary.credentialFlags, ['--header']);
  assert.doesNotMatch(JSON.stringify(headerEntry), /never-package-this-header|Authorization|Bearer/);
  assertNoCredentialValues(headerEntry);
});

test('credential defense accepts explicit placeholders and rejects concrete secrets', () => {
  assert.doesNotThrow(() => assertNoCredentialValues({
    note: 'Use --token <TOKEN>, api_key=${API_KEY}, and secret={{SECRET}}; MCP_TOKEN only if auth is required.',
    url: 'https://example.com/mcp',
  }));
  assert.throws(() => assertNoCredentialValues({ note: '--token concrete-secret-value' }), /credential assignment/);
  assert.throws(() => assertNoCredentialValues({ url: 'https://example.com/mcp?api_key=concrete-secret-value' }), /credential assignment|not stripped/);
  assert.throws(() => assertNoCredentialValues({ args: ['--token', '<TOKEN>'] }), /must not persist raw stdio args/);
});

test('last-good snapshot contains only the stripped URL, never its original query value', () => {
  const entry = normalizeCuratedSourceEntry({
    id: 'remote', name: 'Remote', description: 'Public data endpoint.',
    transport: 'streamable-http', url: 'https://example.com/mcp?token=never-copy-to-snapshot#fragment',
  }, { sourceId: 'market', sourceFormat: 'market-json' });
  const report = {
    generatedAt: NOW,
    summary: { sourceModes: { market: 'live' } },
    sources: [{ id: 'market', mode: 'live', entries: [entry], error: null }],
    leads: [{ identity: 'url:https://example.com/mcp', package: null, repositoryAudit: null }],
  };
  const snapshot = buildLastGoodSnapshot(report);
  const serialized = JSON.stringify(snapshot);
  assert.match(serialized, /https:\/\/example\.com\/mcp/);
  assert.doesNotMatch(serialized, /never-copy-to-snapshot|fragment|\?token=/);
  assertNoCredentialValues(snapshot);
});

test('failed live source fetch retains the checked-in last-good entries', async () => {
  const lastGood = {
    schemaVersion: 1,
    sources: [{
      id: 'panel', repository: 'https://github.com/example/panel', revision: REVISION,
      committedAt: NOW, retrievedAt: NOW, mode: 'live', paths: ['src/catalog.ts'], entries: [sourceEntry()], error: null,
    }],
    packages: [],
  };
  const sources = await collectCuratedSources({
    schemaVersion: 1,
    sources: [{ id: 'panel', repository: 'example/panel', ref: 'main', format: 'panel-typescript', path: 'src/catalog.ts' }],
  }, lastGood, { retrievedAt: NOW, fetchImpl: async () => { throw new Error('temporary DNS failure'); } });
  assert.equal(sources[0].mode, 'last-good');
  assert.equal(sources[0].entries.length, 1);
  assert.match(sources[0].error, /temporary DNS failure/);
});

test('source paths reject traversal before any network request', async () => {
  await assert.rejects(() => fetchCuratedSource({
    id: 'panel', repository: 'example/panel', ref: 'main', format: 'panel-typescript', path: '../catalog.ts',
  }, { fetchImpl: async () => { throw new Error('network should not be called'); } }), /without traversal segments/);
});

test('pinned GitHub file falls back to the authenticated contents API', async () => {
  const catalog = "export const DEFAULT_CATALOG = Object.freeze([{ id: 'data', name: 'Data', description: 'Public statistics.', transport: 'stdio', command: 'npx', args: ['-y', '@example/data'] }])";
  let rawAttempts = 0;
  const fetched = await fetchCuratedSource({
    id: 'panel', repository: 'example/panel', ref: 'main', format: 'panel-typescript', path: 'src/catalog.ts',
  }, {
    retrievedAt: NOW,
    fetchImpl: async (url) => {
      const value = String(url);
      if (value.includes('/commits/')) return new Response(JSON.stringify({ sha: REVISION, commit: { committer: { date: NOW } } }), { status: 200 });
      if (value.startsWith('https://raw.githubusercontent.com/')) {
        rawAttempts += 1;
        throw new Error('raw host unavailable');
      }
      return new Response(JSON.stringify({ type: 'file', encoding: 'base64', content: Buffer.from(catalog).toString('base64') }), { status: 200 });
    },
  });
  assert.equal(rawAttempts, 3);
  assert.equal(fetched.entries.length, 1);
  assert.equal(fetched.entries[0].package.name, '@example/data');
});

test('bridge source accepts a repository-relative directory prefix with a trailing slash', async () => {
  const commitResponse = new Response(JSON.stringify({ sha: REVISION, commit: { committer: { date: NOW } } }), { status: 200 });
  const treeResponse = new Response(JSON.stringify({ tree: [{ type: 'blob', path: 'servers/example.json' }], truncated: false }), { status: 200 });
  const definitionResponse = new Response(JSON.stringify({
    id: 'example', serverName: 'example', title: 'Example', description: 'Public data statistics.',
    transport: 'stdio', command: 'npx', args: ['-y', '@example/server'], requiredEnv: [],
    verify: { status: 'not-tested', date: null, note: 'Pending runtime test.' },
  }), { status: 200 });
  const readmeResponse = new Response('# Servers', { status: 200 });
  const fetched = await fetchCuratedSource({
    id: 'bridge', repository: 'example/bridge', ref: 'main', format: 'bridge-json-directory', pathPrefix: 'servers/',
  }, {
    retrievedAt: NOW,
    fetchImpl: async (url) => {
      const value = String(url);
      if (value.includes('/commits/')) return commitResponse.clone();
      if (value.includes('/git/trees/')) return treeResponse.clone();
      if (value.endsWith('/README.md')) return readmeResponse.clone();
      return definitionResponse.clone();
    },
  });
  assert.equal(fetched.entries.length, 1);
  assert.deepEqual(fetched.paths, ['servers/example.json']);
});

test('a successful source response cannot silently delete a last-good entry', async () => {
  const oldEntry = sourceEntry({ id: 'old-entry', args: ['-y', '@example/old'] });
  const lastGood = {
    schemaVersion: 1,
    sources: [{
      id: 'panel', repository: 'https://github.com/example/panel', revision: REVISION,
      committedAt: NOW, retrievedAt: NOW, mode: 'live', paths: ['src/catalog.ts'], entries: [oldEntry], error: null,
    }],
    packages: [],
  };
  const commitResponse = new Response(JSON.stringify({ sha: 'b'.repeat(40), commit: { committer: { date: NOW } } }), { status: 200 });
  const catalogResponse = new Response("export const DEFAULT_CATALOG: readonly CatalogEntry[] = Object.freeze([{ id: 'new-entry', name: 'New', description: 'New public data source.', transport: 'stdio', command: 'npx', args: ['-y', '@example/new'] }])", { status: 200 });
  const sources = await collectCuratedSources({
    schemaVersion: 1,
    sources: [{ id: 'panel', repository: 'example/panel', ref: 'main', format: 'panel-typescript', path: 'src/catalog.ts' }],
  }, lastGood, {
    retrievedAt: NOW,
    fetchImpl: async (url) => String(url).includes('/commits/') ? commitResponse.clone() : catalogResponse.clone(),
  });
  assert.equal(sources[0].mode, 'live-with-drift');
  assert.equal(sources[0].entries.length, 2);
  const retained = sources[0].entries.find((entry) => entry.entryId === 'old-entry');
  assert.equal(retained.retainedFromLastGood, true);
  assert.equal(retained.verification.status, 'DEFERRED');
});

test('last-good snapshot cannot drop a package after one failed lookup', () => {
  assert.throws(() => buildLastGoodSnapshot({
    summary: { sourceModes: { panel: 'live' } },
    generatedAt: NOW,
    sources: [],
    leads: [{ identity: 'npm:@example/server', package: { registry: 'npm', name: '@example/server' }, packageAudit: { metadataSource: 'live', exists: false } }],
  }), /requires a live existing package result/);
});

test('package audit defers deprecated packages and provenance gaps', async () => {
  const lead = { package: { registry: 'npm', name: '@example/server' }, homepages: ['https://github.com/example/server'] };
  const deprecated = await auditPackage(lead, {
    checkedAt: NOW,
    fetchImpl: async () => npmResponse('@example/server', { deprecated: 'Package no longer supported.' }),
  });
  assert.equal(deprecated.status, 'DEFERRED');
  assert.match(deprecated.reason, /deprecated/);

  const unscoped = { package: { registry: 'npm', name: 'git-mcp' }, homepages: ['https://github.com/idootop/git-mcp'] };
  const missingProvenance = await auditPackage(unscoped, {
    checkedAt: NOW,
    fetchImpl: async () => npmResponse('git-mcp', { repository: null }),
  });
  assert.equal(missingProvenance.status, 'DEFERRED');
  assert.equal(missingProvenance.provenance, 'missing');
});

test('repository audit verifies exact live ownership and defers missing repositories', async () => {
  const exact = await auditGitHubRepository('microsoft/playwright-mcp', {
    checkedAt: NOW,
    fetchImpl: async () => githubResponse('microsoft/playwright-mcp'),
  });
  assert.equal(exact.status, 'PASS');
  assert.equal(exact.exists, true);

  const missing = await auditGitHubRepository('example/missing', {
    checkedAt: NOW,
    fetchImpl: async () => new Response('', { status: 404 }),
  });
  assert.equal(missing.status, 'DEFERRED');
  assert.equal(missing.exists, false);
});

test('curated audit canonicalizes package versions and never selects or publishes a lead', async () => {
  const sources = [{
    id: 'panel', repository: 'https://github.com/example/panel', revision: REVISION,
    committedAt: NOW, retrievedAt: NOW, mode: 'live', paths: ['src/catalog.ts'], entries: [sourceEntry({
      id: 'playwright', name: 'Playwright', description: 'Browser automation and page interaction.',
      homepage: 'https://github.com/microsoft/playwright-mcp', args: ['-y', '@playwright/mcp@latest'],
    })], error: null,
  }];
  const report = await auditCuratedSources({
    config: { schemaVersion: 1, knownReplacements: [] },
    sources,
    connectors: [{
      id: 'playwright', name: 'Playwright', homepage: 'https://github.com/microsoft/playwright-mcp',
      servers: [{ serverName: 'playwright', command: 'npx', args: ['-y', '@playwright/mcp@latest'] }],
    }],
    checkedAt: NOW,
    fetchImpl: async (url) => String(url).includes('api.github.com')
      ? githubResponse('microsoft/playwright-mcp')
      : npmResponse('@playwright/mcp', { repository: 'git+https://github.com/microsoft/playwright-mcp.git' }),
  });
  assert.equal(report.leads.length, 1);
  assert.equal(report.leads[0].dedupe.level, 'strong');
  assert.equal(report.leads[0].score.band, 'not-data');
  assert.equal(report.policy.automaticPublishing, false);
  assert.match(renderCuratedSourceReport(report), /never publishes or delists/i);
  const snapshot = buildLastGoodSnapshot(report);
  assert.equal(snapshot.sources.length, 1);
  assert.equal(snapshot.packages.length, 1);
  assert.equal(snapshot.repositories.length, 1);
  assert.equal(report.leads[0].ownership.kind, 'official-or-publisher');
});

test('generic storage infrastructure is excluded while public web and map data remain leads', () => {
  const sources = [{
    id: 'market', mode: 'live', revision: REVISION,
    entries: [
      sourceEntry({ id: 'sqlite', name: 'SQLite', description: 'SQLite database operations via a local community server.', args: ['-y', 'mcp-server-sqlite'] }),
      sourceEntry({ id: 'search', name: 'Research', description: 'Web research and Google search for public web data.', args: ['-y', '@example/search'] }),
      sourceEntry({ id: 'maps', name: 'Google Maps', description: 'Geocoding, places and directions.', args: ['-y', '@example/maps'] }),
    ],
  }];
  const leads = mergeCuratedEntries(sources);
  assert.equal(leads.find((lead) => lead.identity === 'npm:mcp-server-sqlite').classification.isDataService, false);
  assert.equal(leads.find((lead) => lead.identity === 'npm:@example/search').classification.isDataService, true);
  assert.equal(leads.find((lead) => lead.identity === 'npm:@example/maps').classification.isDataService, true);
});
