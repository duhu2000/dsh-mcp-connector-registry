import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { validateRegistryDescriptors } from '../node_modules/dsh-mcp-connector/lib/probe.js';

const draftUrl = new URL(
  '../connectors/variflight-aviation-data.json',
  import.meta.url,
);

test('VariFlight card reflects passed business acceptance and explicit paid-call confirmation', async () => {
  const draft = JSON.parse(await readFile(draftUrl, 'utf8'));

  assert.equal(validateRegistryDescriptors([draft]).length, 1);
  assert.equal(draft.id, 'variflight-aviation-data');
  assert.equal(draft.published, true);
  assert.equal(draft.featured, false);
  assert.equal(draft.probeStatus, 'pass');
  assert.equal(draft.auth.mode, 'api-key');
  assert.equal(draft.auth.apiKeyHeader, 'X-API-Key');
  assert.equal(draft.servers[0].url, 'https://ai.variflight.com/servers/aviation/mcp');
  assert.equal(draft.servers[0].oauthResource, undefined);
  assert.match(draft.description, /机场天气单次业务查询已通过/);
  assert.match(draft.description, /其他收费工具尚未验收/);
  assert.match(draft.prompts[0].text, /getTodayDate/);
  assert.match(draft.prompts[0].text, /不要调用/);

  for (const prompt of draft.prompts.slice(1)) {
    assert.match(prompt.text, /确认/);
    assert.match(prompt.text, /(?:收费|费用)/);
  }
});
