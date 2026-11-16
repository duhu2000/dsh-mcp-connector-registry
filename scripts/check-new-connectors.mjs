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
  const scope = record?.review?.scope ?? 'full-runtime';
  const connectionOnly = scope === 'connection-only';
  if (!['full-runtime', 'connection-only'].includes(scope)) errors.push('unsupported human review scope');
  const sourceKind = record?.source?.kind;
  const isOfficialRegistrySource = sourceKind === 'official-mcp-registry';
  const isOfficialVendorSource = sourceKind === 'official-vendor';
  if (!descriptor?.id) errors.push('descriptor is missing id');
  if (record?.schemaVersion !== 1 || !record?.id || !record?.registryName) errors.push('candidate record identity and schemaVersion 1 are required');
  if (!isOfficialRegistrySource && !isOfficialVendorSource) errors.push('candidate must retain an Official Registry or official vendor source');
  if (record?.source?.status !== 'active') errors.push('candidate source must be active');
  if (isOfficialRegistrySource && record?.classification?.isDataService !== true) {
    errors.push('Official Registry discovery candidate must be classified as a data service');
  }
  if (isOfficialVendorSource && !isHttps(record?.source?.detailUrl)) {
    errors.push('official vendor source must include an HTTPS detailUrl');
  }
  // Connection-only listings preserve their lower discovery score; human approval
  // must explicitly select this scope instead of fabricating runtime points.
  if (!connectionOnly && (record?.score?.band !== 'selected' || record?.score?.total < 80)) errors.push('candidate must pass the selected score gate');
  if (connectionOnly && (record?.score?.band !== 'watchlist' || record?.score?.total < 60
    || record?.score?.dimensions?.runtime !== 0)) errors.push('connection-only listing must retain watchlist score >= 60 and zero runtime points');
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
  // An explicit human exception preserves unknown terms instead of fabricating
  // license evidence. It cannot waive source, auth, score or runtime checks.
  const termsException = record?.review?.serviceTermsException;
  const hasTermsException = termsException != null;
  const termsExceptionValid = hasTermsException
    && termsException.reasonCode === 'official-terms-unavailable'
    && termsException.decision === 'approved'
    && termsException.connectorId === descriptor?.id
    && typeof termsException.reviewedBy === 'string' && termsException.reviewedBy.trim()
    && termsException.reviewedBy === record?.review?.reviewedBy
    && Number.isFinite(Date.parse(termsException.reviewedAt))
    && termsException.reviewedAt === record?.review?.reviewedAt
    && typeof termsException.notes === 'string' && termsException.notes.trim()
    && isHttps(termsException.reportUrl)
    && record?.evidence?.some(e => e.type === 'service-terms-exception' && e.url === termsException.reportUrl)
    && record?.review?.decision === 'approved'
    && isOfficialVendorSource && !connectionOnly
    && record?.runtimeAcceptance?.status === 'pass'
    && ['api-key', 'bearer', 'oauth2'].includes(record?.authentication?.mode)
    && record?.license?.status === 'unknown'
    && record.license.spdxId === null && record.license.evidenceUrl === null
    && descriptor?.published === true && descriptor?.featured === false
    && descriptor?.probeStatus === 'pass'
    && descriptor?.description?.includes('服务条款未公开，尚未核验');
  if (hasTermsException && !termsExceptionValid) errors.push('service-terms exception requires explicit matching named approval, runtime PASS and market disclosure');
  if (!termsExceptionValid) {
    if (record?.license?.status === 'unknown') errors.push('license or service-terms applicability must be verified');
    if (!isHttps(record?.license?.evidenceUrl)) errors.push('license or service-terms evidenceUrl must use HTTPS');
  }
  if (connectionOnly) {
    const connection = record?.connectionAcceptance;
    if (!Number.isFinite(Date.parse(record?.review?.reviewedAt)) || typeof record?.review?.reviewedBy !== 'string'
      || !record.review.reviewedBy.trim() || !record?.review?.notes?.trim()) errors.push('connection-only listing requires dated named human approval');
    if (!isOfficialVendorSource) errors.push('connection-only listing requires an official vendor source');
    if (record?.dedupe?.level !== 'none') errors.push('connection-only listing must not duplicate an existing connector');
    if (!['api-key', 'bearer', 'oauth2'].includes(record?.authentication?.mode)) errors.push('connection-only listing requires verified credential configuration');
    const runtime = record?.runtimeAcceptance;
    // A later successful representative business call advances the market badge;
    // original approval scope and discovery score remain historical facts.
    const expectedStatus = runtime?.status === 'pass' ? 'pass' : 'partial';
    if (descriptor?.published !== true || descriptor?.featured !== false || descriptor?.probeStatus !== expectedStatus) {
      errors.push('connection-only follow-up card must be published, not featured, and match runtime status');
    }
    const followup = ['pass', 'fail'].includes(runtime?.status);
    if (followup) {
      // Later observations update runtime facts, not the original approval scope or score.
      if (!Number.isFinite(Date.parse(runtime.checkedAt))
        || Date.parse(runtime.checkedAt) <= Date.parse(record.review.reviewedAt)
        || !runtime.reviewedBy?.trim() || !runtime.notes?.trim()
        || !isHttps(runtime.reportUrl)
        || !record.evidence?.some(e => e.type === 'runtime-acceptance' && e.url === runtime.reportUrl)) {
        errors.push('follow-up runtime requires dated post-approval evidence and reviewer');
      }
      if (!descriptor?.description?.includes(runtime.status === 'pass' ? '运行验收通过' : '有限验收') || !descriptor.description.includes('尚未验收')
        || !descriptor.description.includes(runtime.status === 'pass' ? '业务查询通过' : '业务查询未通过')) {
        errors.push('follow-up card must disclose its runtime outcome and remaining limitations');
      }
    } else {
      if (!descriptor?.description?.includes('业务查询尚未验收')) errors.push('connection-only card must disclose untested business queries');
      if (runtime?.status !== 'not-run' || runtime.checkedAt != null
      || record.runtimeAcceptance.reviewedBy != null || record.runtimeAcceptance.reportUrl != null
      || !record.runtimeAcceptance.notes) errors.push('connection-only business runtime must remain not-run with no claimed runtime evidence');
    }
    if (connection?.status !== 'pass' || !Number.isInteger(connection?.toolCount) || connection.toolCount < 1) {
      errors.push('successful connection and nonempty tool discovery are required');
    }
    if (!connection?.checkedAt || !Number.isFinite(Date.parse(connection.checkedAt))
      || !connection?.reviewedBy?.trim() || !connection?.notes?.trim()) errors.push('connection acceptance timestamp, reviewer, and notes are required');
    if (!isHttps(connection?.reportUrl)) errors.push('connection acceptance reportUrl must use HTTPS');
    if (!record?.evidence?.some((item) => item.type === 'connection-acceptance' && item.url === connection?.reportUrl)) {
      errors.push('connection-acceptance evidence must match reportUrl');
    }
  } else {
    if (record?.runtimeAcceptance?.status !== 'pass') errors.push('real runtime acceptance must pass');
    if (!record?.runtimeAcceptance?.checkedAt || !record?.runtimeAcceptance?.reviewedBy) errors.push('runtime acceptance timestamp and reviewer are required');
    if (!isHttps(record?.runtimeAcceptance?.reportUrl)) errors.push('runtime acceptance reportUrl must use HTTPS');
    if (!record?.runtimeAcceptance?.notes) errors.push('runtime acceptance notes are required');
    if (!record?.evidence?.some((item) => item.type === 'runtime-acceptance' && item.url === record.runtimeAcceptance.reportUrl)) {
      errors.push('runtime-acceptance evidence must match reportUrl');
    }
  }
  const authorityEvidenceType = isOfficialVendorSource ? 'official-vendor' : 'official-registry';
  const hasAuthorityEvidence = record?.evidence?.some((item) => item.type === authorityEvidenceType
    && (!isOfficialVendorSource || item.url === record?.source?.detailUrl));
  if (!hasAuthorityEvidence) {
    errors.push(`${isOfficialVendorSource ? 'official vendor' : 'Official Registry'} evidence is required`);
  }
  if (!termsExceptionValid && !record?.evidence?.some((item) => item.type === 'license' && item.url === record?.license?.evidenceUrl)) {
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
    'diff', '--no-renames', '--name-only', '--diff-filter=A', `${base}...HEAD`, '--', 'connectors/*.json',
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
