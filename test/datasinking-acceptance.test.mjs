import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { verifyRuntimeAcceptance } from '../scripts/check-new-connectors.mjs';

const json = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));

test('DataSinking anonymous card distinguishes local Bearer configuration and report-text extraction', async () => {
  const card = await json('../connectors/datasinking.json');
  assert.equal(card.auth.mode, 'none');
  assert.equal(card.servers[0].url, 'https://api.datasink.ing/mcp');
  assert.match(card.summary, /财报.*匿名试用/);
  assert.match(card.description, /获取 Key 不会自动提升/);
  assert.match(card.description, /Bearer/);
  assert.doesNotMatch(card.description, /8,191|524,287|31 篇|\$31/);
  for (const prompt of card.prompts) {
    for (const term of ['财报期', '币种', '单位', '来源', '章节', '链接']) {
      assert.ok(prompt.text.includes(term), term);
    }
  }
});

test('DataSinking evidence preserves historical acceptance without granting human approval', async () => {
  const card = await json('../connectors/datasinking.json');
  const record = await json('../candidates/records/datasinking.json');
  const report = await readFile(new URL('../docs/runtime-acceptance/pr-49/datasinking.md', import.meta.url), 'utf8');
  assert.equal(record.review.proposedConnectorId, card.id);
  assert.equal(record.score.total, Object.values(record.score.dimensions).reduce((a, b) => a + b, 0));
  assert.ok(record.evidence.some((e) => e.type === 'runtime-acceptance' && e.url === record.runtimeAcceptance.reportUrl));
  assert.match(report, /0a19b8050443b21958a830bcc4aaf6d55c12b222ed1d10d5b5f14c703116c4fb/);
  assert.match(report, /not newly generated measurements/);
  const errors = verifyRuntimeAcceptance(card, record);
  assert.ok(!errors.includes('candidate record appears to contain a credential value'));
  if (record.review.decision === 'pending') {
    assert.ok(errors.includes('human review decision must be approved'));
    assert.equal(record.review.reviewedBy, null);
  }
  if (record.license.status === 'unknown') {
    assert.ok(errors.includes('license or service-terms applicability must be verified'));
  }
});
