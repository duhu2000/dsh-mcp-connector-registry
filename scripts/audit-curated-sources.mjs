#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  assertNoCredentialValues,
  auditCuratedSources,
  buildLastGoodSnapshot,
  collectCuratedSources,
  renderCuratedSourceReport,
} from './discovery/curated-source-audit.mjs';
import { loadConnectorCatalog } from './discovery/official-registry.mjs';

function parseArgs(argv) {
  const options = {
    config: 'discovery-sources/curated-sources.json',
    lastGood: 'discovery-sources/curated-last-good.json',
    output: 'candidate-output/curated-sources',
    requestTimeoutMs: 20_000,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--config') options.config = argv[++index];
    else if (arg === '--last-good') options.lastGood = argv[++index];
    else if (arg === '--output') options.output = argv[++index];
    else if (arg === '--request-timeout-ms') options.requestTimeoutMs = Number(argv[++index]);
    else if (arg === '--write-last-good') options.writeLastGood = argv[++index];
    else if (arg === '--offline') options.offline = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!options.config || !options.lastGood || !options.output) throw new Error('config, last-good, and output paths must not be empty');
  if (!Number.isInteger(options.requestTimeoutMs) || options.requestTimeoutMs < 1_000 || options.requestTimeoutMs > 120_000) {
    throw new Error('--request-timeout-ms must be an integer from 1000 to 120000');
  }
  return options;
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(resolve(path), 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const generatedAt = new Date().toISOString();
  const [config, lastGood, connectors] = await Promise.all([
    readJson(options.config),
    readJson(options.lastGood, { schemaVersion: 1, sources: [], packages: [] }),
    loadConnectorCatalog(resolve('catalog.json')),
  ]);
  const unavailableFetch = async () => { throw new Error('Offline mode requested'); };
  const sourceOptions = {
    retrievedAt: generatedAt,
    requestTimeoutMs: options.requestTimeoutMs,
    githubToken: process.env.GITHUB_TOKEN,
    ...(options.offline ? { fetchImpl: unavailableFetch } : {}),
  };
  const sources = await collectCuratedSources(config, lastGood, sourceOptions);
  const report = await auditCuratedSources({
    config,
    sources,
    connectors,
    lastGood,
    checkedAt: generatedAt,
    requestTimeoutMs: options.requestTimeoutMs,
    githubToken: process.env.GITHUB_TOKEN,
    ...(options.offline ? { fetchImpl: unavailableFetch } : {}),
  });
  assertNoCredentialValues(report);
  let snapshot = null;
  try {
    snapshot = buildLastGoodSnapshot(report);
  } catch (error) {
    if (options.writeLastGood) throw error;
    console.warn(`curated source audit: last-good proposal skipped: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (snapshot) assertNoCredentialValues(snapshot);
  const output = resolve(options.output);
  await mkdir(output, { recursive: true });
  const writes = [
    writeFile(resolve(output, 'source-audit.json'), `${JSON.stringify(report, null, 2)}\n`),
    writeFile(resolve(output, 'source-audit.md'), renderCuratedSourceReport(report)),
  ];
  if (snapshot) writes.push(writeFile(resolve(output, 'last-good-proposed.json'), `${JSON.stringify(snapshot, null, 2)}\n`));
  await Promise.all(writes);
  if (options.writeLastGood) {
    if (!snapshot) throw new Error('Cannot update last-good while any source uses fallback or failed mode');
    await writeFile(resolve(options.writeLastGood), `${JSON.stringify(snapshot, null, 2)}\n`);
  }
  console.log(`curated source audit: ${report.summary.rawEntries} raw / ${report.summary.uniqueIdentities} unique / ${report.summary.dataLeads} data leads -> ${output}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`curated source audit: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
