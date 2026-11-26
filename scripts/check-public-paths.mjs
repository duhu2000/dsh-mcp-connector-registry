import { execFileSync } from 'node:child_process';
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

function inspect(paths, revision) {
  for (const path of paths) {
    const problem = reason(path);
    if (problem) {
      process.exitCode = 1;
      console.error('%s %s: %s', revision || 'staged', JSON.stringify(path), problem);
    }
  }
}

const args = process.argv.slice(2);
const diffOptions = ['--no-renames', '--diff-filter=AMT', '--name-only', '-z'];
if (args.length === 0 || (args.length === 1 && args[0] === '--staged')) {
  inspect(changedPaths(['diff', '--cached', ...diffOptions, '--']), '');
} else if (args.length === 3 && args[0] === '--range') {
  const [base, head] = args.slice(1).map(ref =>
    git('rev-parse', '--verify', '--end-of-options', ref + '^{commit}').trim());
  const commits = git('rev-list', '--reverse', base + '..' + head).trim();
  for (const commit of commits.split('\n').filter(Boolean)) {
    // Combined diffs check merge resolutions without rechecking inherited files.
    inspect(changedPaths(['diff-tree', '--root', '--cc', '-r', '--no-commit-id',
      ...diffOptions, commit, '--']), commit);
  }
} else {
  console.error('Usage: node scripts/check-public-paths.mjs [--staged | --range <base> <head>]');
  process.exit(2);
}

if (process.exitCode) {
  console.error('Keep working materials private. Remove them from the staged changes or outgoing commits before pushing. See CONTRIBUTING.md.');
} else {
  console.log('Public path check passed. Review the content of documents, images and attachments before sharing.');
}
