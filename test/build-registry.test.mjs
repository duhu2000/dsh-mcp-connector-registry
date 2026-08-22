import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const script = resolve('scripts/build-registry.mjs');

async function fixture() {
  const root = await mkdtemp(resolve(tmpdir(), 'dsh-registry-'));
  const connectors = resolve(root, 'connectors');
  const output = resolve(root, 'catalog.json');
  await mkdir(connectors);
  return { root, connectors, output };
}

function descriptor(id) {
  return {
    schemaVersion: 1,
    id,
    name: id,
    servers: [
      {
        serverKey: 'main',
        serverName: id,
        url: `https://example.com/${id}/mcp`,
      },
    ],
  };
}

test('build-registry sorts connector output deterministically', async (t) => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));
  await writeFile(resolve(paths.connectors, 'zeta.json'), JSON.stringify(descriptor('zeta')));
  await writeFile(resolve(paths.connectors, 'alpha.json'), JSON.stringify(descriptor('alpha')));

  const result = spawnSync(process.execPath, [script, paths.connectors, paths.output], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  const catalog = JSON.parse(await readFile(paths.output, 'utf8'));
  assert.deepEqual(catalog.connectors.map((item) => item.id), ['alpha', 'zeta']);
});

test('build-registry rejects a filename that differs from connector id', async (t) => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));
  await writeFile(resolve(paths.connectors, 'wrong-name.json'), JSON.stringify(descriptor('actual-id')));

  const result = spawnSync(process.execPath, [script, paths.connectors, paths.output], {
    encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /filename must match connector id \(actual-id\.json\)/);
});

test('盈米连接器使用公开 x-api-key 接入参数且不包含凭据', async () => {
  const connector = JSON.parse(
    await readFile(resolve('connectors/yingmi-wealth-management.json'), 'utf8'),
  );

  assert.equal(connector.auth.mode, 'api-key');
  assert.equal(connector.auth.apiKeyHeader, 'x-api-key');
  assert.equal(connector.servers[0].url, 'https://stargate.yingmi.com/mcp/v2');
  assert.deepEqual(connector.servers[0].headers, {
    Accept: 'application/json, text/event-stream',
  });
  assert.equal(connector.prompts.length, 4);
  assert.equal(connector.toolsSnapshot[0].tools.length, 69);

  const serialized = JSON.stringify(connector);
  assert.doesNotMatch(serialized, /x-api-key\s*[:=]\s*(?!Header)/i);
  assert.doesNotMatch(serialized, /Bearer\s+[A-Za-z0-9._~-]{12,}/i);
});
