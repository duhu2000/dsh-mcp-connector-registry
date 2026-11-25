import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const publicDocs = ['CATEGORY-OVERVIEW.md', 'CONNECTOR-DIRECTORY.md', 'RECENT-ADDITIONS.md'];
const generator = fileURLToPath(new URL('../scripts/build-catalog-docs.mjs', import.meta.url));

test('catalog builds generate only public docs and leave an existing local draft alone', async t => {
  const root = await mkdtemp(join(tmpdir(), 'registry-catalog-docs-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const docs = join(root, 'docs');
  await mkdir(docs);
  const card = { id: 'example', name: 'Example', category: '其他' };
  const additions = [{ id: card.id, publishedOn: '2026-01-01', pr: 1, acceptance: 'Example scope' }];
  await writeFile(join(root, 'catalog.json'), JSON.stringify({ connectors: [card] }));
  await writeFile(join(root, 'README.md'), '# Registry\n\n## 公共目录\n');
  await writeFile(join(docs, 'bundled-overview.json'), '{"connectors":[]}');
  await writeFile(join(docs, 'catalog-additions.json'), JSON.stringify(additions));

  const build = () => execFileSync(process.execPath, [generator], { cwd: root });
  const publicOutputs = () => Promise.all([
    readFile(join(root, 'README.md'), 'utf8'),
    ...publicDocs.map(name => readFile(join(docs, name), 'utf8')),
  ]);
  build();
  const first = await publicOutputs();
  assert.deepEqual((await readdir(docs)).sort(), [...publicDocs, 'bundled-overview.json', 'catalog-additions.json'].sort());
  for (const value of first) assert.match(value, /Example/);

  const draft = join(docs, 'ANNOUNCEMENT-DRAFT.md');
  const marker = 'Local fixture outside the public catalog.';
  await writeFile(draft, marker);
  build();
  assert.deepEqual(await publicOutputs(), first);
  assert.equal(await readFile(draft, 'utf8'), marker);
});

test('the catalog patch manifest names only public products', async () => {
  const manifest = await readFile(new URL('../.github/catalog-products.txt', import.meta.url), 'utf8');
  assert.deepEqual(manifest.trim().split(/\r?\n/).sort(), [
    'catalog.json', 'catalog-stats.json', 'README.md', ...publicDocs.map(name => 'docs/' + name),
  ].sort());
});
