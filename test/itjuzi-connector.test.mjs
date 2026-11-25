import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('IT桔子付费数据卡片保留 API Key、使用限制和有限运行验收边界', async () => {
  const descriptor = JSON.parse(await readFile(new URL(
    '../connectors/itjuzi-venture-capital-data.json',
    import.meta.url,
  ), 'utf8'));
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
});
