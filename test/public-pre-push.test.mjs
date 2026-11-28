import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const installer = fileURLToPath(new URL('../scripts/install-public-pre-push.mjs', import.meta.url));
const sampleCard = JSON.parse(readFileSync(new URL('../connectors/example.sample.json', import.meta.url), 'utf8'));

function fixture(t, { installHook = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'registry-public-pre-push-'));
  const cwd = join(root, 'local checkout');
  const remote = join(root, 'synthetic remote.git');
  mkdirSync(cwd);
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const env = {
    ...process.env,
    GIT_ALLOW_PROTOCOL: 'file',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null',
  };
  const run = (command, args) => spawnSync(command, args, { cwd, env, encoding: 'utf8' });
  function ok(result) {
    assert.equal(result.status, 0, result.stderr || result.error?.message);
    return result.stdout.trim();
  }
  const git = (...args) => ok(run('git', args));
  const install = (...args) => run(process.execPath, [installer, ...args]);
  function add(path, content = 'Synthetic Registry fixture\n') {
    const destination = join(cwd, path);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, content);
    git('add', '--', path);
  }

  git('init', '-q', '--initial-branch=main');
  git('init', '-q', '--bare', '--initial-branch=main', remote);
  git('config', 'user.name', 'Synthetic Registry Test');
  git('config', 'user.email', 'registry-test@example.invalid');
  git('remote', 'add', 'origin', remote);
  add('catalog.json', '{"connectors":[]}\n');
  add('docs/CATEGORY-OVERVIEW.md');
  git('commit', '-qm', 'Public Registry fixture baseline');
  git('push', '-u', 'origin', 'main');
  if (installHook) ok(install());
  git('switch', '-qc', 'topic');

  const push = ref => run('git', ['push', 'origin', 'HEAD:' + ref]);
  const remoteRefs = () => git('ls-remote', '--refs', 'origin');
  const remoteHas = ref => remoteRefs().split('\n').some(line => line.endsWith('\t' + ref));
  return { cwd, add, git, ok, install, push, remoteHas, remoteRefs };
}

test('a synthetic public card and existing generated catalog files can be pushed', t => {
  const { add, git, ok, push, remoteRefs } = fixture(t);
  const card = structuredClone(sampleCard);
  card.id = 'synthetic-public-card';
  card.name = 'Synthetic Registry Card';
  card.servers[0].serverName = card.id;
  add('connectors/synthetic-public-card.json', JSON.stringify(card, null, 2) + '\n');
  add('catalog.json', JSON.stringify({ connectors: [card] }, null, 2) + '\n');
  add('docs/CATEGORY-OVERVIEW.md', 'Synthetic category overview with one connector.\n');
  git('commit', '-qm', 'Add a synthetic public connector');
  ok(push('refs/heads/topic'));
  assert.ok(remoteRefs().split('\n').includes(git('rev-parse', 'HEAD') + '\trefs/heads/topic'));
});

test('an unregistered document outside docs blocks creation of the remote branch', t => {
  const { add, git, push, remoteHas } = fixture(t);
  add('new-area/nested/summary.md');
  add('scripts/check-public-paths.mjs', 'console.log("Synthetic worktree replacement");\n');
  git('commit', '-qm', 'Add an unregistered synthetic document');
  const result = push('refs/heads/topic');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /new-area\/nested\/summary\.md.*unregistered public document/);
  assert.equal(remoteHas('refs/heads/topic'), false);
});

test('adding and deleting an unregistered document in separate commits still blocks an update', t => {
  const { add, git, ok, push, remoteRefs } = fixture(t);
  ok(push('refs/heads/topic'));
  const before = remoteRefs();
  const previous = git('rev-parse', 'HEAD');
  add('new-area/journal.txt');
  git('commit', '-qm', 'Temporarily add a synthetic note');
  const introducing = git('rev-parse', 'HEAD');
  git('rm', '--', 'new-area/journal.txt');
  git('commit', '-qm', 'Remove the synthetic note');
  assert.equal(git('diff', '--name-only', previous, 'HEAD'), '');

  const result = push('refs/heads/topic');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /new-area\/journal\.txt.*unregistered public document/);
  assert.ok(result.stderr.includes(introducing));
  assert.equal(remoteRefs(), before);
});

test('exact public registration preserves Registry private-path rules', t => {
  const { add, git, ok, push, remoteHas } = fixture(t);
  const reviewed = 'docs/verification/reviewed guide.md';
  const restricted = 'docs/runtime-acceptance/reference.md';
  git('config', '--local', '--add', 'dshPublic.documentPath', reviewed);
  git('config', '--local', '--add', 'dshPublic.documentPath', restricted);
  add(reviewed);
  git('commit', '-qm', 'Add a reviewed synthetic public guide');
  ok(push('refs/heads/topic'));
  add('docs/verification/other guide.md');
  add(restricted);
  git('commit', '-qm', 'Add synthetic notes');
  const result = push('refs/tags/synthetic');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /docs\/verification\/other guide\.md.*unregistered public document/);
  assert.match(result.stderr, /docs\/runtime-acceptance\/reference\.md.*reserved for private working materials/);
  assert.equal(remoteHas('refs/tags/synthetic'), false);
});

test('installation preserves an unrelated pre-push hook', t => {
  const { cwd, git, install } = fixture(t, { installHook: false });
  const hook = join(cwd, git('rev-parse', '--git-path', 'hooks'), 'pre-push');
  const custom = '#!/bin/sh\nexit 0\n';
  writeFileSync(hook, custom);
  const result = install();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Existing hook preserved/);
  assert.equal(readFileSync(hook, 'utf8'), custom);
});
