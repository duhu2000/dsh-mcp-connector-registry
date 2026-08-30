#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function selectMonthlyBatch(candidates, { size = 10 } = {}) {
  if (!Number.isInteger(size) || size < 5 || size > 10) throw new Error('Monthly batch size must be an integer from 5 to 10');
  return [...candidates]
    .filter((candidate) => candidate.classification?.isDataService
      && candidate.source?.status === 'active'
      && candidate.dedupe?.level !== 'strong'
      && ['selected', 'watchlist'].includes(candidate.score?.band)
      && ['pass', 'partial'].includes(candidate.probe?.status)
      && (candidate.officialLinks?.websiteUrl || candidate.officialLinks?.repository))
    .sort((a, b) => b.score.total - a.score.total || a.registryName.localeCompare(b.registryName))
    .slice(0, size);
}

function cell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

export function renderMonthlyBatch(report, candidates, { size }) {
  const lines = [
    '# Monthly data MCP review batch',
    '',
    `Source snapshot: ${report.generatedAt}`,
    '',
    `Requested ${size}; selected ${candidates.length}. Candidates are recommendations only and require human review plus real runtime acceptance.`,
    '',
  ];
  if (candidates.length < 5) {
    lines.push('> Blocked: fewer than five candidates met the public-reachability and evidence prerequisites. Do not lower the quality gates to fill the batch.', '');
  }
  lines.push('| Candidate | Score | Probe | Auth | License | Domains |', '|---|---:|---|---|---|---|');
  for (const candidate of candidates) {
    lines.push(`| ${cell(candidate.title)}<br><code>${cell(candidate.registryName)}</code> | ${candidate.score.total} | ${candidate.probe.status} | ${candidate.authentication.mode} | ${candidate.license.status} | ${candidate.classification.domains.join(', ')} |`);
  }
  lines.push(
    '',
    '## Required manual gates',
    '',
    '- Verify vendor ownership, official MCP documentation, endpoint, authentication, license or service terms, maintenance activity, and security boundaries.',
    '- Complete a real runtime acceptance record without including credentials, tokens, personal data, or customer data.',
    '- Only after those gates pass may a maintainer prepare a Connector descriptor PR. This automation never opens or merges that PR.',
    '',
  );
  return lines.join('\n');
}

function parseArgs(argv) {
  const options = { input: 'candidate-output/candidate-report.json', output: 'candidate-output/monthly-batch.md', size: 10 };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--input') options.input = argv[++index];
    else if (argv[index] === '--output') options.output = argv[++index];
    else if (argv[index] === '--size') options.size = Number(argv[++index]);
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = JSON.parse(await readFile(resolve(options.input), 'utf8'));
  if (!Array.isArray(report.candidates)) throw new Error('Candidate report must contain a candidates array');
  const candidates = selectMonthlyBatch(report.candidates, { size: options.size });
  await writeFile(resolve(options.output), renderMonthlyBatch(report, candidates, { size: options.size }));
  console.log(`monthly batch: ${candidates.length}/${options.size} candidates -> ${resolve(options.output)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`monthly batch: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}

