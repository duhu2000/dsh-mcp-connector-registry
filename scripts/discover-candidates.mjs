#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { OFFICIAL_REGISTRY_API } from './discovery/candidate-model.mjs';
import { probeCandidates } from './discovery/public-probe.mjs';
import {
  collectOfficialRegistry,
  discoverOfficialCandidates,
  loadConnectorCatalog,
} from './discovery/official-registry.mjs';

function parseArgs(argv) {
  const options = {
    output: 'candidate-output', limit: 100, maxPages: 1000, requestTimeoutMs: 20_000,
    maxAttempts: 3, maxProbes: 25, minProbeScore: 65,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--output') options.output = argv[++index];
    else if (arg === '--input') options.input = argv[++index];
    else if (arg === '--updated-since') options.updatedSince = argv[++index];
    else if (arg === '--limit') options.limit = Number(argv[++index]);
    else if (arg === '--max-pages') options.maxPages = Number(argv[++index]);
    else if (arg === '--request-timeout-ms') options.requestTimeoutMs = Number(argv[++index]);
    else if (arg === '--max-attempts') options.maxAttempts = Number(argv[++index]);
    else if (arg === '--api-base') options.apiBase = argv[++index];
    else if (arg === '--probe') options.probe = true;
    else if (arg === '--max-probes') options.maxProbes = Number(argv[++index]);
    else if (arg === '--min-probe-score') options.minProbeScore = Number(argv[++index]);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!options.output) throw new Error('--output must not be empty');
  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 100) throw new Error('--limit must be an integer from 1 to 100');
  if (!Number.isInteger(options.maxPages) || options.maxPages < 1 || options.maxPages > 1000) throw new Error('--max-pages must be an integer from 1 to 1000');
  if (!Number.isInteger(options.requestTimeoutMs) || options.requestTimeoutMs < 1000 || options.requestTimeoutMs > 120_000) throw new Error('--request-timeout-ms must be an integer from 1000 to 120000');
  if (!Number.isInteger(options.maxAttempts) || options.maxAttempts < 1 || options.maxAttempts > 10) throw new Error('--max-attempts must be an integer from 1 to 10');
  if (!Number.isInteger(options.maxProbes) || options.maxProbes < 1 || options.maxProbes > 100) throw new Error('--max-probes must be an integer from 1 to 100');
  if (!Number.isInteger(options.minProbeScore) || options.minProbeScore < 0 || options.minProbeScore > 100) throw new Error('--min-probe-score must be an integer from 0 to 100');
  return options;
}

function scoreDistribution(candidates) {
  const distribution = { selected: 0, watchlist: 0, defer: 0, duplicate: 0, 'not-data': 0 };
  for (const candidate of candidates) distribution[candidate.score.band] += 1;
  return distribution;
}

function markdownCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

export function renderCandidateReport(report) {
  const lines = [
    '# Data MCP candidate discovery report',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Scanned ${report.summary.scanned} Official Registry record(s); normalized ${report.summary.normalized}; data candidates ${report.summary.dataCandidates}; rejected ${report.summary.rejected}.`,
    '',
    `Score distribution: selected ${report.summary.scoreDistribution.selected}, watchlist ${report.summary.scoreDistribution.watchlist}, defer ${report.summary.scoreDistribution.defer}, duplicate ${report.summary.scoreDistribution.duplicate}.`,
    '',
    '> This report only recommends candidates. It does not publish, merge, delist, or create Connector descriptors.',
    '',
    '| Candidate | Score | Band | Dedupe | Transport | Evidence |',
    '|---|---:|---|---|---|---|',
  ];
  for (const candidate of report.candidates.slice(0, 100)) {
    const evidence = candidate.evidence.map((item) => `[${item.type}](${item.url})`).join(' ');
    lines.push(`| ${markdownCell(candidate.title)}<br><code>${markdownCell(candidate.registryName)}</code> | ${candidate.score.total} | ${candidate.score.band} | ${candidate.dedupe.level} | ${candidate.transports.map((item) => item.type).join(', ')} | ${evidence} |`);
  }
  if (report.rejected.length > 0) {
    lines.push('', '## Normalization rejects', '');
    for (const item of report.rejected.slice(0, 50)) lines.push(`- \`${markdownCell(item.registryName)}\`: ${markdownCell(item.reason)}`);
  }
  lines.push('', 'Human review of vendor documentation, licensing, authentication, security boundaries, and real runtime acceptance is mandatory before a descriptor PR.', '');
  return lines.join('\n');
}

function assertNoCredentialValues(value) {
  const serialized = JSON.stringify(value);
  if (/Bearer\s+[A-Za-z0-9._~-]{12,}/i.test(serialized)) throw new Error('Candidate output appears to contain a Bearer credential');
  if (/(?:api[_-]?key|token|secret)\s*[=:]\s*[A-Za-z0-9._~-]{16,}/i.test(serialized)) throw new Error('Candidate output appears to contain a credential value');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const generatedAt = new Date().toISOString();
  const apiBase = options.apiBase ?? OFFICIAL_REGISTRY_API;
  let entries;
  let pages;
  if (options.input) {
    const payload = JSON.parse(await readFile(resolve(options.input), 'utf8'));
    entries = Array.isArray(payload) ? payload : payload.servers;
    if (!Array.isArray(entries)) throw new Error('--input must contain an array or a servers array');
    pages = 1;
  } else {
    const result = await collectOfficialRegistry({
      apiBase,
      updatedSince: options.updatedSince,
      limit: options.limit,
      maxPages: options.maxPages,
      requestTimeoutMs: options.requestTimeoutMs,
      maxAttempts: options.maxAttempts,
      onPage: ({ page, count, total, nextCursor }) => {
        if (page === 1 || page % 10 === 0 || !nextCursor) console.log(`candidate discovery: page ${page} fetched (${count} records; ${total} total)`);
      },
    });
    entries = result.records;
    pages = result.pages;
  }
  const connectors = await loadConnectorCatalog(resolve('catalog.json'));
  const discovery = await discoverOfficialCandidates({ entries, connectors, retrievedAt: generatedAt, apiBase });
  if (options.probe) {
    await probeCandidates(discovery.candidates, {
      maxProbes: options.maxProbes,
      minScore: options.minProbeScore,
      checkedAt: generatedAt,
      onProbe: ({ index, total, candidate }) => console.log(`candidate probe: ${index}/${total} ${candidate.registryName} -> ${candidate.probe.status}`),
    });
    discovery.candidates.sort((a, b) => b.score.total - a.score.total || a.registryName.localeCompare(b.registryName));
  }
  const dataCandidates = discovery.candidates.filter((candidate) => candidate.classification.isDataService);
  const report = {
    schemaVersion: 1,
    generatedAt,
    source: { kind: 'official-mcp-registry', apiBase, pages, updatedSince: options.updatedSince ?? null },
    summary: {
      scanned: entries.length,
      normalized: discovery.candidates.length,
      dataCandidates: dataCandidates.length,
      rejected: discovery.rejected.length,
      scoreDistribution: scoreDistribution(discovery.candidates),
      probeDistribution: discovery.candidates.reduce((counts, candidate) => {
        counts[candidate.probe.status] = (counts[candidate.probe.status] ?? 0) + 1;
        return counts;
      }, {}),
    },
    candidates: dataCandidates,
    rejected: discovery.rejected,
  };
  assertNoCredentialValues(report);
  const output = resolve(options.output);
  const recordsDirectory = resolve(output, 'records');
  await mkdir(recordsDirectory, { recursive: true });
  await Promise.all(dataCandidates.map((candidate) => writeFile(
    resolve(recordsDirectory, `${candidate.id}.json`),
    `${JSON.stringify(candidate, null, 2)}\n`,
  )));
  await Promise.all([
    writeFile(resolve(output, 'candidate-report.json'), `${JSON.stringify(report, null, 2)}\n`),
    writeFile(resolve(output, 'candidate-report.md'), renderCandidateReport(report)),
  ]);
  console.log(`candidate discovery: ${entries.length} scanned / ${dataCandidates.length} data candidates / ${discovery.rejected.length} rejected -> ${output}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`candidate discovery: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
