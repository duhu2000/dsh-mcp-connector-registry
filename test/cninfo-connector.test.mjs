import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

test('approved CNINFO connector uses the zero-setup read-only maintained package', async () => {
  const connector = JSON.parse(await readFile(resolve('connectors/cninfo-listed-company-reports.json'), 'utf8'));

  assert.equal(connector.published, true);
  assert.equal(connector.probeStatus, 'pass');
  assert.deepEqual(connector.servers[0].args, ['-y', '@duhu2000/cninfo-mcp@1.4.3']);
  assert.deepEqual(connector.toolsSnapshot[0].tools.map((tool) => tool.name), ['query_annual_reports_tool']);
  assert.equal(connector.prompts.length, 2);
  assert.ok(connector.prompts.every((prompt) => !prompt.text.includes('研究问题')));
});
