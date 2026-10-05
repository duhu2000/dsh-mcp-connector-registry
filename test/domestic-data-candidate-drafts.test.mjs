import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { validateRegistryDescriptors } from '../node_modules/dsh-mcp-connector/lib/probe.js';

const draftDirectory = resolve('candidates/drafts/domestic-data-mcp-2026-10-02');
const expectedIds = ['national-statistics-cn'];

test('domestic data drafts validate but remain outside the published catalog', async () => {
  const files = (await readdir(draftDirectory)).filter((file) => file.endsWith('.json')).sort();
  const drafts = await Promise.all(files.map(async (file) => {
    const descriptor = JSON.parse(await readFile(resolve(draftDirectory, file), 'utf8'));
    assert.equal(file, `${descriptor.id}.json`);
    assert.equal(descriptor.published, false);
    assert.equal(descriptor.featured, false);
    assert.equal(descriptor.probeStatus, 'unverified');
    assert.equal(descriptor.servers[0].transport, 'stdio');
    assert.ok(!descriptor.servers[0].args.some((arg) => /(?:api[_-]?key|token|secret)=/i.test(arg)));
    return descriptor;
  }));
  assert.deepEqual(drafts.map((item) => item.id), expectedIds);

  const catalog = JSON.parse(await readFile(resolve('catalog.json'), 'utf8'));
  assert.equal(validateRegistryDescriptors([...catalog.connectors, ...drafts]).length,
    catalog.connectors.length + expectedIds.length);
  for (const id of expectedIds) {
    assert.ok(!catalog.connectors.some((item) => item.id === id));
  }
});

test('remaining domestic data draft pins the reviewed npm package version', async () => {
  const national = JSON.parse(await readFile(resolve(draftDirectory, 'national-statistics-cn.json'), 'utf8'));
  assert.deepEqual(national.servers[0].args, ['-y', 'national-stats-mcp@2.0.0']);
});

test('approved CNINFO connector uses the zero-setup read-only maintained package', async () => {
  const connector = JSON.parse(await readFile(resolve('connectors/cninfo-listed-company-reports.json'), 'utf8'));
  const record = JSON.parse(await readFile(resolve('candidates/records/cninfo-listed-company-reports.json'), 'utf8'));

  assert.equal(connector.published, true);
  assert.equal(connector.probeStatus, 'pass');
  assert.deepEqual(connector.servers[0].args, ['-y', '@duhu2000/cninfo-mcp@1.4.3']);
  assert.deepEqual(connector.toolsSnapshot[0].tools.map((tool) => tool.name), ['query_annual_reports_tool']);
  assert.equal(connector.prompts.length, 2);
  assert.ok(connector.prompts.every((prompt) => !prompt.text.includes('研究问题')));
  assert.equal(record.registryName, 'io.github.duhu2000/cninfo-mcp');
  assert.equal(record.source.kind, 'official-mcp-registry');
  assert.equal(record.review.decision, 'approved');
  assert.equal(record.review.reviewedBy, 'DuHu');
  assert.equal(record.runtimeAcceptance.status, 'pass');
});
