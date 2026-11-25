import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const json = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));

test('DataSinking card requires official Bearer credentials without public secrets or anonymous fallback', async () => {
  const card = await json('../connectors/datasinking.json');
  assert.equal(card.auth.mode, 'bearer');
  assert.equal(card.servers[0].url, 'https://api.datasink.ing/mcp');
  assert.match(card.summary, /财报.*API Key/);
  assert.match(card.auth.credentialName, /API Key/);
  assert.match(card.auth.credentialDescription, /DSH 本机/);
  assert.equal(new URL(card.servers[0].url).search, '');
  assert.equal(Object.keys(card.servers[0].headers).some(key => key.toLowerCase() === 'authorization'), false);
  assert.doesNotMatch(card.summary + card.description, /匿名试用|无需.*Key|仅使用匿名/);
  assert.match(card.description, /Bearer/);
  assert.doesNotMatch(card.description, /8,191|524,287|31 篇|\$31/);
  for (const prompt of card.prompts) {
    for (const term of ['财报期', '币种', '单位', '来源', '章节', '链接']) {
      assert.ok(prompt.text.includes(term), term);
    }
  }
});
