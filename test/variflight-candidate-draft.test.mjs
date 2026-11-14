import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { validateRegistryDescriptors } from '../node_modules/dsh-mcp-connector/lib/probe.js';

const draftUrl = new URL(
  '../candidates/drafts/variflight-2026-11-14/variflight-aviation.json',
  import.meta.url,
);

test('VariFlight aviation draft validates but remains unpublished pending OAuth runtime acceptance', async () => {
  const draft = JSON.parse(await readFile(draftUrl, 'utf8'));
  const catalog = JSON.parse(await readFile(new URL('../catalog.json', import.meta.url), 'utf8'));

  assert.equal(validateRegistryDescriptors([draft]).length, 1);
  assert.equal(draft.id, 'variflight-aviation-data');
  assert.equal(draft.published, false);
  assert.equal(draft.featured, false);
  assert.equal(draft.probeStatus, 'partial');
  assert.equal(draft.auth.mode, 'oauth2-pkce');
  assert.equal(draft.auth.scope, 'read mcp:access');
  assert.equal(draft.auth.tokenEndpointAuthMethod, 'none');
  assert.equal(draft.servers[0].url, 'https://ai.variflight.com/servers/aviation/mcp');
  assert.equal(draft.servers[0].oauthResource, draft.servers[0].url);
  assert.equal(catalog.connectors.some((item) => item.id === draft.id), false);

  for (const prompt of draft.prompts) {
    assert.match(prompt.text, /确认/);
    assert.match(prompt.text, /(?:收费|费用)/);
  }
});
