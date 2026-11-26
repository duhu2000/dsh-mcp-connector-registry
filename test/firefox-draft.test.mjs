import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { firefoxNpxArgs } from '../scripts/build-firefox-draft.mjs';
import { validateRegistryDescriptors } from '../node_modules/dsh-mcp-connector/lib/probe.js';

test('approved Firefox listing preserves the exact macOS-accepted pages-only configuration', async () => {
  const draft = JSON.parse(await readFile(new URL('../connectors/firefox-devtools.json', import.meta.url), 'utf8'));
  assert.equal(validateRegistryDescriptors([draft]).length, 1);
  assert.equal(draft.published, true);
  assert.equal(draft.featured, false);
  assert.equal(draft.probeStatus, 'pass');
  assert.equal(draft.auth.mode, 'none');
  assert.equal(draft.servers.length, 1);
  assert.equal(draft.servers[0].transport, 'stdio');
  assert.equal(draft.servers[0].command, 'npx');
  assert.deepEqual(draft.servers[0].args, await firefoxNpxArgs());
  assert.deepEqual(draft.servers[0].args.slice(-8), ['--', '--headless', '--no-auto-profile', '--no-connect-existing', '--tools', 'pages', '--start-url', 'about:blank']);
  assert.equal(draft.servers[0].env, undefined);
  assert.match(draft.description, /不是全只读/);
  assert.match(draft.description, /独立 profile 不是操作系统沙箱/);
  assert.match(draft.description, /本仓库维护的兼容启动器/);
  assert.match(draft.description, /空缓存首次安装及 Windows\/Linux Desktop 未验收/);
  assert.match(draft.prompts[0].text, /不传 saveTo/);
});
