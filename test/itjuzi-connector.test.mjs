import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { verifyRuntimeAcceptance } from '../scripts/check-new-connectors.mjs';

test('IT桔子卡片与有限运行验收记录一致', async () => {
  const descriptor = JSON.parse(await readFile(new URL(
    '../connectors/itjuzi-venture-capital-data.json',
    import.meta.url,
  ), 'utf8'));
  const record = JSON.parse(await readFile(new URL(
    '../candidates/records/itjuzi-venture-capital-data.json',
    import.meta.url,
  ), 'utf8'));
  const report = await readFile(new URL(
    '../docs/runtime-acceptance/itjuzi-2026-10-06/itjuzi-venture-capital-data.md',
    import.meta.url,
  ), 'utf8');

  assert.equal(record.source.kind, 'official-vendor');
  assert.equal(record.review.decision, 'approved');
  assert.equal(record.review.reviewedBy, 'DuHu');
  assert.equal(record.runtimeAcceptance.status, 'pass');
  assert.match(record.runtimeAcceptance.notes, /未使用付费凭据、未读取业务数据/);
  assert.deepEqual(verifyRuntimeAcceptance(descriptor, record), []);

  assert.match(report, /实时发现 21 个工具/);
  assert.match(report, /缺少 API Key/);
  assert.match(report, /没有使用付费 API Key/);
});
