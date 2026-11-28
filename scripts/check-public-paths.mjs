import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path/posix';

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
}

const privateDirectories = [
  'private', 'internal', 'docs/private', 'docs/internal', 'candidates', 'candidate-output',
  'discovery-sources', 'audits', 'incidents', 'review-batches', 'runtime-acceptance',
  'docs/audits', 'docs/incidents', 'docs/review-batches', 'docs/runtime-acceptance',
];
const material = /\.(?:md|mdx|txt|rst|adoc|pdf|docx?|pptx?|xlsx?|csv|json|jsonl|ya?ml|html?|log|jpe?g|png|gif|svg|webp|zip)$/i;
const draftName = /(?:^|[-_. ])(?:drafts?|(?:internal|private)[-_. ](?:only|notes|schedule|evidence)|handoff|workplan|raw[-_. ](?:evidence|acceptance)|competitor[-_. ](?:analysis|strategy))(?:$|[-_. ])/i;
const internalName = /草稿|原稿|内部排期|竞品(?:分析|策略)|原始(?:验收|证据)/u;

function reason(path) {
  const lower = path.toLowerCase();
  if (privateDirectories.some(dir => lower === dir || lower.startsWith(dir + '/'))) {
    return 'reserved for private working materials';
  }
  if (/^docs\/(?:deferred-connectors\.md|[^/]+-acceptance(?:[-.][^/]*)?\.md)$/.test(lower)) {
    return 'internal disposition or acceptance record; publish a reviewed summary under docs/verification/';
  }
  if (/^(?:docs|marketing)\/(?:[^/]+\/)*(?:drafts?|internal|private)\//.test(lower)) {
    return 'private working directory';
  }
  const name = basename(lower);
  if (material.test(name) && (draftName.test(name) || internalName.test(name))) {
    return 'filename identifies an internal draft or working record';
  }
}

function changedPaths(args) {
  return git(...args).split('\0').filter(Boolean);
}

const documentOrAttachment = /\.(?:md|markdown|mdx|txt|rst|adoc|asciidoc|org|rtf|tex|pdf|doc[xm]?|ppt[xm]?|xls[xm]?|od[tfpsg]|csv|tsv|html?|ipynb|log|jpe?g|png|gif|svg|webp|avif|bmp|tiff?|zip|7z|rar|tar|tgz|gz)$/i;
const extensionlessDocument = /^(?:readme|changelog|notes?|todo|design|license|copying|guide|authors|notice|contributing)$/i;

function needsRegistration(path) {
  return path.toLowerCase().startsWith('docs/') || documentOrAttachment.test(path) ||
    extensionlessDocument.test(basename(path));
}

function inspect(paths, revision, publicPaths) {
  for (const path of paths) {
    let problem = reason(path);
    if (!problem && publicPaths && needsRegistration(path) && !publicPaths.has(path)) {
      problem = 'unregistered public document or attachment. Keep it private or register the exact path after review';
    }
    if (problem) {
      process.exitCode = 1;
      console.error('%s %s: %s', revision || 'staged', JSON.stringify(path), problem);
    }
  }
}

const diffOptions = ['--no-renames', '--diff-filter=AMT', '--name-only', '-z'];
const objectId = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;
const missingObject = /^0+$/;

function resolveCommit(ref) {
  return git('rev-parse', '--verify', '--end-of-options', ref + '^{commit}').trim();
}

function inspectCommit(commit, publicPaths) {
  // Combined diffs check merge resolutions without rechecking inherited files.
  inspect(changedPaths(['diff-tree', '--root', '--cc', '-r', '--no-commit-id',
    ...diffOptions, commit, '--']), commit, publicPaths);
}

function inspectPush(baselineRef) {
  const refs = readFileSync(0, 'utf8').split(/\r?\n/).filter(Boolean).map(line => {
    const fields = line.trim().split(/\s+/);
    const [, local, destination, previous] = fields;
    if (fields.length !== 4 || !objectId.test(local) || !objectId.test(previous)) {
      throw new Error('Invalid reference data from Git.');
    }
    return { local, destination, previous };
  }).filter(({ local }) => !missingObject.test(local));
  if (!refs.length) return;

  // Use the actual outgoing objects, even if this clone has replacement refs.
  process.env.GIT_NO_REPLACE_OBJECTS = '1';
  if (git('rev-parse', '--is-shallow-repository').trim() === 'true') {
    throw new Error('Fetch the full Git history before pushing.');
  }
  let baseline;
  try {
    baseline = resolveCommit(baselineRef);
  } catch {
    throw new Error('Cannot read public baseline ' + baselineRef + '. Fetch the configured upstream first.');
  }

  const publicPaths = new Set(changedPaths(['ls-tree', '-rz', '--name-only', baseline]));
  const registered = spawnSync('git', ['config', '--local', '--null', '--get-all', 'dshPublic.documentPath'],
    { encoding: 'utf8' });
  if (registered.status === 0) {
    for (const path of registered.stdout.split('\0').filter(Boolean)) publicPaths.add(path);
  } else if (registered.status !== 1) {
    throw new Error('Cannot read local public document registrations.');
  }

  const commits = new Set();
  for (const { local, destination, previous } of refs) {
    if (!destination.startsWith('refs/heads/') && !destination.startsWith('refs/tags/')) {
      throw new Error('Unsupported destination ref ' + destination + '. Only branches and commit tags are checked.');
    }
    const head = resolveCommit(local);
    const exclusions = [baseline];
    if (!missingObject.test(previous)) {
      try {
        exclusions.push(resolveCommit(previous));
      } catch {
        throw new Error('Cannot read the current remote commit for ' + destination + '. Fetch that ref and retry.');
      }
    }
    const outgoing = git('rev-list', '--reverse', head, '--not', ...exclusions);
    for (const commit of outgoing.trim().split('\n').filter(Boolean)) commits.add(commit);
  }
  for (const commit of commits) inspectCommit(commit, publicPaths);
}

const args = process.argv.slice(2);
if (args.length === 0 || (args.length === 1 && args[0] === '--staged')) {
  inspect(changedPaths(['diff', '--cached', ...diffOptions, '--']), '');
} else if (args.length === 3 && args[0] === '--range') {
  const [base, head] = args.slice(1).map(resolveCommit);
  const commits = git('rev-list', '--reverse', base + '..' + head).trim();
  for (const commit of commits.split('\n').filter(Boolean)) inspectCommit(commit);
} else if (args.length === 2 && args[0] === '--pre-push') {
  try {
    inspectPush(args[1]);
  } catch (error) {
    console.error('Public pre-push check could not complete: %s', error.message);
    process.exit(1);
  }
} else {
  console.error('Usage: node scripts/check-public-paths.mjs [--staged | --range <base> <head> | --pre-push <public-main-ref>]');
  process.exit(2);
}

if (process.exitCode) {
  console.error('Keep working materials private. Remove them from the staged changes or outgoing commits before pushing. See CONTRIBUTING.md.');
} else {
  console.log('Public path check passed. Review the content of documents, images and attachments before sharing.');
}
