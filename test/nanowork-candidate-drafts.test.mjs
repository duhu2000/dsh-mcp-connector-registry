import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { validateRegistryDescriptors } from '../node_modules/dsh-mcp-connector/lib/probe.js';

const draftDirectory = resolve('candidates/drafts/nanowork-2026-09-20');
const expectedIds = ['atlassian-rovo', 'kuaidi100-logistics', 'trello'];

test('NanoWork comparison drafts are valid but cannot enter the published catalog', async () => {
  const files = (await readdir(draftDirectory)).filter((file) => file.endsWith('.json')).sort();
  const drafts = await Promise.all(files.map(async (file) => {
    const descriptor = JSON.parse(await readFile(resolve(draftDirectory, file), 'utf8'));
    assert.equal(file, `${descriptor.id}.json`);
    assert.equal(descriptor.published, false);
    assert.equal(descriptor.featured, false);
    assert.equal(descriptor.probeStatus, 'unverified');
    return descriptor;
  }));
  assert.deepEqual(drafts.map((item) => item.id), expectedIds);

  const catalog = JSON.parse(await readFile(resolve('catalog.json'), 'utf8'));
  assert.equal(validateRegistryDescriptors([...catalog.connectors, ...drafts]).length,
    catalog.connectors.length + expectedIds.length);
  for (const id of expectedIds) {
    assert.ok(!catalog.connectors.some((item) => item.id === id));
    assert.ok(!files.some((file) => file === `${id}.sample.json`));
  }
});

test('Jinshuju is promoted alone with a transparent limited-acceptance record', async () => {
  const descriptor = JSON.parse(await readFile(resolve('connectors/jinshuju-forms.json'), 'utf8'));
  const record = JSON.parse(await readFile(resolve('candidates/records/jinshuju-forms.json'), 'utf8'));
  assert.equal(descriptor.published, true);
  assert.equal(record.review.decision, 'approved');
  assert.equal(record.runtimeAcceptance.status, 'pass');
  assert.match(record.runtimeAcceptance.notes, /没有执行 tools\/call/);
  assert.equal(record.review.proposedConnectorId, descriptor.id);
});

test('NanoWork comparison drafts never put a secret in URLs or stdio arguments', async () => {
  const files = (await readdir(draftDirectory)).filter((file) => file.endsWith('.json'));
  const drafts = await Promise.all(files.map(async (file) => JSON.parse(
    await readFile(resolve(draftDirectory, file), 'utf8'),
  )));
  for (const descriptor of drafts) {
    for (const server of descriptor.servers) {
      if (server.url) {
        const url = new URL(server.url);
        assert.equal(url.protocol, 'https:');
        assert.equal(url.search, '');
        assert.equal(url.username, '');
        assert.equal(url.password, '');
      }
      assert.ok(!(server.args ?? []).some((arg) => /(?:api[_-]?key|token|secret)=/i.test(arg)));
    }
  }
  const kuaidi100 = drafts.find((item) => item.id === 'kuaidi100-logistics');
  assert.equal(kuaidi100.servers[0].transport, 'stdio');
  assert.deepEqual(kuaidi100.servers[0].credentialBindings, { KUAIDI100_API_KEY: 'apiKey' });
  assert.equal(kuaidi100.auth.credentialFields[0].secret, true);
});
