#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function updateHealthState(report, previous = {}, { checkedAt } = {}) {
  if (!Array.isArray(report?.results)) throw new Error('Probe report must contain a results array');
  const timestamp = checkedAt ?? new Date(report.checkedAt ?? Date.now()).toISOString();
  const prior = previous.connectors ?? {};
  const connectors = {};
  for (const result of [...report.results].sort((a, b) => String(a.id).localeCompare(String(b.id)))) {
    if (!result?.id || !['pass', 'partial', 'fail'].includes(result.status)) throw new Error('Probe result requires id and pass/partial/fail status');
    const priorFailures = Number(prior[result.id]?.consecutiveFailures ?? 0);
    const consecutiveFailures = result.status === 'fail' ? priorFailures + 1 : 0;
    connectors[result.id] = {
      status: result.status,
      consecutiveFailures,
      lastCheckedAt: timestamp,
      investigationRequired: consecutiveFailures >= 2,
      manualDelistReviewRequired: consecutiveFailures >= 3,
    };
  }
  const values = Object.values(connectors);
  return {
    schemaVersion: 1,
    checkedAt: timestamp,
    summary: {
      connectorCount: values.length,
      pass: values.filter((item) => item.status === 'pass').length,
      partial: values.filter((item) => item.status === 'partial').length,
      fail: values.filter((item) => item.status === 'fail').length,
      investigationCount: values.filter((item) => item.investigationRequired).length,
      manualDelistReviewCount: values.filter((item) => item.manualDelistReviewRequired).length,
    },
    connectors,
  };
}

export function renderHealthIssue(state) {
  const flagged = Object.entries(state.connectors)
    .filter(([, item]) => item.investigationRequired)
    .sort((a, b) => b[1].consecutiveFailures - a[1].consecutiveFailures || a[0].localeCompare(b[0]));
  const lines = [
    '# Registry health investigation',
    '',
    `Checked: ${state.checkedAt}`,
    '',
    `Pass ${state.summary.pass}; partial ${state.summary.partial}; fail ${state.summary.fail}; investigation ${state.summary.investigationCount}; manual delist review ${state.summary.manualDelistReviewCount}.`,
    '',
    '> One failure never triggers an issue or delisting. Two consecutive failures require investigation. Three consecutive failures require manual delist review only; automation never removes a connector.',
    '',
  ];
  if (flagged.length === 0) lines.push('No connector currently meets the investigation threshold.', '');
  else {
    lines.push('| Connector | Status | Consecutive failures | Required action |', '|---|---|---:|---|');
    for (const [id, item] of flagged) {
      lines.push(`| \`${id}\` | ${item.status} | ${item.consecutiveFailures} | ${item.manualDelistReviewRequired ? 'Manual delist review' : 'Investigate'} |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function parseArgs(argv) {
  const options = { report: 'probe-report.json', output: 'health-state.json', issueBody: 'health-issue.md' };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--report') options.report = argv[++index];
    else if (argv[index] === '--previous') options.previous = argv[++index];
    else if (argv[index] === '--output') options.output = argv[++index];
    else if (argv[index] === '--issue-body') options.issueBody = argv[++index];
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = JSON.parse(await readFile(resolve(options.report), 'utf8'));
  let previous = {};
  if (options.previous) {
    try {
      previous = JSON.parse(await readFile(resolve(options.previous), 'utf8'));
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  const state = updateHealthState(report, previous);
  await Promise.all([
    writeFile(resolve(options.output), `${JSON.stringify(state, null, 2)}\n`),
    writeFile(resolve(options.issueBody), renderHealthIssue(state)),
  ]);
  console.log(`health trend: ${state.summary.fail} fail / ${state.summary.investigationCount} investigate / ${state.summary.manualDelistReviewCount} manual delist review`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`health trend: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}

