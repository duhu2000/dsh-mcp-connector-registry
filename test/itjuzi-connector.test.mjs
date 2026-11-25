import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { verifyRuntimeAcceptance } from '../scripts/check-new-connectors.mjs';

test('IT桔子付费数据卡片保留 API Key、使用限制和有限运行验收边界', async () => {
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

  assert.equal(descriptor.name, 'IT桔子创投数据');
  assert.equal(descriptor.vendor, 'IT桔子');
  assert.equal(descriptor.category, '金融投资');
  assert.ok(descriptor.tags.includes('企业数据'));
  assert.equal(descriptor.auth.mode, 'bearer');
  assert.match(descriptor.auth.credentialName, /API Key/);
  assert.equal(descriptor.servers[0].url, 'https://mcp.itjuzi.com/mcp');
  assert.equal(descriptor.probeStatus, 'partial');
  assert.equal(descriptor.prompts.length, 2);
  assert.equal(descriptor.prompts.some((prompt) => /\{\{|研究问题|请填写/.test(prompt.text)), false);
  assert.match(descriptor.description, /付费 API Key/);
  assert.match(descriptor.description, /不支持批量导出、系统入库或平台分发/);

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
