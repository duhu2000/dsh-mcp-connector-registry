import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  DEFAULT_CDN_URL,
  DEFAULT_PURGE_URL,
  purgeAndVerifyCatalog,
} from '../scripts/purge-jsdelivr-cache.mjs';

const expectedCatalog = `${JSON.stringify({
  schemaVersion: 1,
  connectors: [{ id: 'alpha' }, { id: 'beta' }],
}, null, 2)}\n`;
const staleCatalog = `${JSON.stringify({ schemaVersion: 1, connectors: [{ id: 'alpha' }] }, null, 2)}\n`;

async function withCatalog(run) {
  const directory = await mkdtemp(join(tmpdir(), 'registry-jsdelivr-'));
  const catalogPath = join(directory, 'catalog.json');
  await writeFile(catalogPath, expectedCatalog);
  try {
    await run(catalogPath);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function purgeResponse(overrides = {}) {
  return new Response(JSON.stringify({
    status: 'finished',
    paths: {
      '/gh/duhu2000/dsh-mcp-connector-registry@main/catalog.json': {
        throttled: false,
        providers: { CF: true, FY: true },
      },
    },
    ...overrides,
  }), { status: 200, headers: { 'content-type': 'application/json' } });
}

test('purges the branch URL and retries until CDN bytes match catalog.json', async () => {
  await withCatalog(async (catalogPath) => {
    const calls = [];
    let cdnAttempts = 0;
    const result = await purgeAndVerifyCatalog({
      catalogPath,
      verifyAttempts: 3,
      verifyDelayMs: 0,
      sleep: async () => {},
      log: () => {},
      fetchImpl: async (url) => {
        calls.push(String(url));
        if (url === DEFAULT_PURGE_URL) return purgeResponse();
        assert.equal(url, DEFAULT_CDN_URL);
        cdnAttempts += 1;
        return new Response(cdnAttempts === 1 ? staleCatalog : expectedCatalog, { status: 200 });
      },
    });

    assert.equal(result.count, 2);
    assert.equal(result.attempts, 2);
    assert.deepEqual(calls, [DEFAULT_PURGE_URL, DEFAULT_CDN_URL, DEFAULT_CDN_URL]);
  });
});

test('fails before verification when jsDelivr throttles the purge', async () => {
  await withCatalog(async (catalogPath) => {
    await assert.rejects(
      purgeAndVerifyCatalog({
        catalogPath,
        log: () => {},
        fetchImpl: async () => purgeResponse({
          paths: {
            '/gh/duhu2000/dsh-mcp-connector-registry@main/catalog.json': { throttled: true },
          },
        }),
      }),
      /purge was throttled/,
    );
  });
});

test('fails with expected and observed metadata when CDN stays stale', async () => {
  await withCatalog(async (catalogPath) => {
    await assert.rejects(
      purgeAndVerifyCatalog({
        catalogPath,
        verifyAttempts: 2,
        verifyDelayMs: 0,
        sleep: async () => {},
        log: () => {},
        fetchImpl: async (url) => (
          url === DEFAULT_PURGE_URL
            ? purgeResponse()
            : new Response(staleCatalog, { status: 200 })
        ),
      }),
      /did not match.*after 2 attempts.*expected 2 connectors.*last observed 1 connectors/s,
    );
  });
});

test('only accepts the official HTTPS CDN and purge hosts for CI overrides', async () => {
  await assert.rejects(
    purgeAndVerifyCatalog({ cdnUrl: 'http://cdn.jsdelivr.net/catalog.json' }),
    /CDN URL must use https:\/\/cdn\.jsdelivr\.net/,
  );
  await assert.rejects(
    purgeAndVerifyCatalog({ purgeUrl: 'https://example.com/catalog.json' }),
    /purge URL must use https:\/\/purge\.jsdelivr\.net/,
  );
});
