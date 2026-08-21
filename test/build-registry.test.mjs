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
