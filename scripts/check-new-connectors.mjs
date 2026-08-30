#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function isHttps(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function verifyRuntimeAcceptance(descriptor, record) {
  const errors = [];
  if (!descriptor?.id) errors.push('descriptor is missing id');
  if (record?.schemaVersion !== 1 || !record?.id || !record?.registryName) errors.push('candidate record identity and schemaVersion 1 are required');
  if (record?.classification?.isDataService !== true) errors.push('candidate must be classified as a data service');
  if (record?.source?.kind !== 'official-mcp-registry' || record?.source?.status !== 'active') errors.push('candidate must retain an active Official Registry source');
  if (record?.score?.band !== 'selected' || record?.score?.total < 80) errors.push('candidate must pass the selected score gate');
  const dimensions = record?.score?.dimensions && Object.values(record.score.dimensions);
  if (!Array.isArray(dimensions) || dimensions.some((value) => !Number.isInteger(value))
    || dimensions.reduce((sum, value) => sum + value, 0) !== record?.score?.total) {
    errors.push('candidate score total must equal its integer dimensions');
  }
  if (record?.review?.proposedConnectorId !== descriptor?.id) errors.push('review.proposedConnectorId must match the Connector id');
  if (record?.review?.decision !== 'approved') errors.push('human review decision must be approved');
  if (!record?.review?.reviewedAt || !record?.review?.reviewedBy) errors.push('human review timestamp and reviewer are required');
  if (!record?.review?.notes) errors.push('human review notes are required');
  if (!['pass', 'partial'].includes(record?.probe?.status)) errors.push('public probe must pass or be partially reachable');
  if (record?.authentication?.mode === 'unknown') errors.push('authentication mode must be verified');
  if (record?.license?.status === 'unknown') errors.push('license or service-terms applicability must be verified');
  if (!isHttps(record?.license?.evidenceUrl)) errors.push('license or service-terms evidenceUrl must use HTTPS');
  if (record?.runtimeAcceptance?.status !== 'pass') errors.push('real runtime acceptance must pass');
  if (!record?.runtimeAcceptance?.checkedAt || !record?.runtimeAcceptance?.reviewedBy) errors.push('runtime acceptance timestamp and reviewer are required');
  if (!isHttps(record?.runtimeAcceptance?.reportUrl)) errors.push('runtime acceptance reportUrl must use HTTPS');
  if (!record?.runtimeAcceptance?.notes) errors.push('runtime acceptance notes are required');
  if (!record?.evidence?.some((item) => item.type === 'runtime-acceptance' && item.url === record.runtimeAcceptance.reportUrl)) {
    errors.push('runtime-acceptance evidence must match reportUrl');
  }
  if (!record?.evidence?.some((item) => item.type === 'official-registry')) {
    errors.push('Official Registry evidence is required');
  }
  if (!record?.evidence?.some((item) => item.type === 'license' && item.url === record?.license?.evidenceUrl)) {
    errors.push('license or service-terms evidence must match evidenceUrl');
  }
  const serialized = JSON.stringify(record ?? {});
  if (/Bearer\s+[A-Za-z0-9._~-]{12,}/i.test(serialized)
    || /(?:api[_-]?key|token|secret)\s*[=:]\s*[A-Za-z0-9._~-]{16,}/i.test(serialized)) {
    errors.push('candidate record appears to contain a credential value');
  }
  return errors;
}

function addedConnectorPaths(base) {
  const output = execFileSync('git', [
    'diff', '--name-only', '--diff-filter=A', `${base}...HEAD`, '--', 'connectors/*.json',
  ], { encoding: 'utf8' });
  return output.split(/\r?\n/).filter((path) => path.endsWith('.json') && !path.endsWith('.sample.json'));
}

async function main() {
  const args = process.argv.slice(2);
  const baseIndex = args.indexOf('--base');
  if (baseIndex === -1 || !args[baseIndex + 1]) throw new Error('Usage: check-new-connectors.mjs --base <git-sha>');
  const paths = addedConnectorPaths(args[baseIndex + 1]);
  const failures = [];
  for (const path of paths) {
    const descriptor = JSON.parse(await readFile(resolve(path), 'utf8'));
    const recordPath = resolve('candidates', 'records', `${descriptor.id}.json`);
    let record;
    try {
      record = JSON.parse(await readFile(recordPath, 'utf8'));
    } catch {
      failures.push(`${path}: missing candidates/records/${descriptor.id}.json`);
      continue;
    }
    for (const error of verifyRuntimeAcceptance(descriptor, record)) failures.push(`${path}: ${error}`);
  }
  if (failures.length > 0) throw new Error(`new Connector acceptance failed:\n${failures.join('\n')}`);
  console.log(`new Connector acceptance: ${paths.length} added descriptor(s) verified`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
