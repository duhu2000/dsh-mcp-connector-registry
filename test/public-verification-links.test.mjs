import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const repository = 'duhu2000/dsh-mcp-connector-registry';
const catalog = JSON.parse(await readFile('catalog.json', 'utf8'));

async function publicCard(id) {
  const card = JSON.parse(await readFile(`connectors/${id}.json`, 'utf8'));
  return { card, entry: catalog.connectors.find(item => item.id === id) };
}

test('the catalog points readers to scoped verification summaries', async () => {
  for (const [id, scope] of [
    ['itjuzi-venture-capital-data', '没有验证付费数据查询'],
    ['iyiou-financing-data', '实际扣费未独立核实'],
  ]) {
    const { card, entry } = await publicCard(id);
    const url = new URL(card.probeReportUrl);
    const path = `docs/verification/${id}.md`;
    assert.equal(url.origin, 'https://github.com');
    const [, owner, repo, kind, revision, ...file] = url.pathname.split('/');
    assert.equal([owner, repo].join('/'), repository);
    assert.equal(kind, 'blob');
    assert.match(revision, /^[a-f0-9]{40}$/);
    assert.equal(file.join('/'), path);
    assert.ok((await readFile(path, 'utf8')).includes(scope));
    assert.equal(entry.probeReportUrl, card.probeReportUrl);
  }
});

test('the Tradesparq catalog icon uses a versioned public PNG', async () => {
  const { card, entry } = await publicCard('tradesparq-trade-data');
  const url = new URL(card.icon);
  const [, owner, repo, revision, ...file] = url.pathname.split('/');
  assert.equal(url.origin, 'https://raw.githubusercontent.com');
  assert.equal([owner, repo].join('/'), repository);
  assert.match(revision, /^[a-f0-9]{40}$/);
  const path = file.join('/');
  assert.equal(path, 'assets/tradesparq-trade-data.png');
  assert.equal((await readFile(path)).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(entry.icon, card.icon);
});
