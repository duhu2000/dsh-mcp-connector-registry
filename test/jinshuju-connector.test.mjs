import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

test('Jinshuju publishes its authentication and write boundaries', async () => {
  const descriptor = JSON.parse(await readFile(resolve('connectors/jinshuju-forms.json'), 'utf8'));
  assert.equal(descriptor.published, true);
  assert.equal(descriptor.auth.mode, 'oauth2-pkce');
  assert.equal(descriptor.probeStatus, 'partial');
  assert.match(descriptor.description, /写入或删除前须明确确认/);
});
