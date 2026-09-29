import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { canonicalPackageName, canonicalPublicUrl } from './candidate-model.mjs';

function canonicalName(value) {
  return String(value ?? '').trim().toLowerCase();
}

function canonicalUrl(value) {
  return canonicalPublicUrl(value, { stripQuery: true })?.replace(/\/$/, '') ?? null;
}

function stringArray(value, label) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
    throw new Error(`${label} must be an array of non-empty strings`);
  }
  return value;
}

export function validateExclusionPolicy(policy) {
  if (!policy || policy.schemaVersion !== 1 || !Array.isArray(policy.exclusions)) {
    throw new Error('Discovery exclusion policy must use schemaVersion 1 and contain an exclusions array');
  }
  const ids = new Set();
  for (const exclusion of policy.exclusions) {
    if (!exclusion || typeof exclusion.id !== 'string' || !exclusion.id.trim()) throw new Error('Every discovery exclusion must have an id');
    if (ids.has(exclusion.id)) throw new Error(`Duplicate discovery exclusion id: ${exclusion.id}`);
    ids.add(exclusion.id);
    if (exclusion.decision !== 'do-not-list') throw new Error(`${exclusion.id} decision must be do-not-list`);
    if (typeof exclusion.decidedBy !== 'string' || !exclusion.decidedBy.trim()) throw new Error(`${exclusion.id} must record decidedBy`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(exclusion.decidedAt ?? '')) throw new Error(`${exclusion.id} decidedAt must be YYYY-MM-DD`);
    if (typeof exclusion.reason !== 'string' || !exclusion.reason.trim()) throw new Error(`${exclusion.id} must record a reason`);
    const match = exclusion.match ?? {};
    const registryNames = stringArray(match.registryNames, `${exclusion.id}.match.registryNames`);
    const packages = stringArray(match.packages, `${exclusion.id}.match.packages`);
    const repositories = stringArray(match.repositories, `${exclusion.id}.match.repositories`);
    const remoteUrls = stringArray(match.remoteUrls, `${exclusion.id}.match.remoteUrls`);
    if (registryNames.length + packages.length + repositories.length + remoteUrls.length === 0) {
      throw new Error(`${exclusion.id} must contain at least one stable identity`);
    }
    if (packages.some((item) => !canonicalPackageName(item))) throw new Error(`${exclusion.id} contains an invalid package identity`);
    if ([...repositories, ...remoteUrls].some((item) => !canonicalUrl(item))) throw new Error(`${exclusion.id} contains an invalid public HTTPS URL`);
  }
  return policy;
}

export async function loadExclusionPolicy(path = 'discovery-sources/exclusions.json') {
  return validateExclusionPolicy(JSON.parse(await readFile(resolve(path), 'utf8')));
}

function candidateIdentities(candidate) {
  const registryNames = new Set([
    candidate?.registryName,
    candidate?.name,
    candidate?.serverName,
  ].map(canonicalName).filter(Boolean));
  const packages = new Set([
    candidate?.package?.name,
    ...(candidate?.transports ?? []).map((transport) => transport?.package?.identifier),
  ].map(canonicalPackageName).filter(Boolean));
  const repositories = new Set([
    candidate?.officialLinks?.repository?.url,
    candidate?.repository?.url,
    candidate?.repositoryAudit?.url,
    ...(candidate?.homepages ?? []),
  ].map(canonicalUrl).filter(Boolean));
  const remoteUrls = new Set([
    candidate?.url,
    ...(candidate?.transports ?? []).map((transport) => transport?.url),
  ].map(canonicalUrl).filter(Boolean));
  return { registryNames, packages, repositories, remoteUrls };
}

export function matchExclusion(candidate, policy) {
  const identities = candidateIdentities(candidate);
  for (const exclusion of validateExclusionPolicy(policy).exclusions) {
    const match = exclusion.match;
    const matchedBy = [];
    if (match.registryNames.map(canonicalName).some((item) => identities.registryNames.has(item))) matchedBy.push('registry-name');
    if (match.packages.map(canonicalPackageName).some((item) => identities.packages.has(item))) matchedBy.push('package');
    if (match.repositories.map(canonicalUrl).some((item) => identities.repositories.has(item))) matchedBy.push('repository');
    if (match.remoteUrls.map(canonicalUrl).some((item) => identities.remoteUrls.has(item))) matchedBy.push('remote-url');
    if (matchedBy.length > 0) {
      return {
        id: exclusion.id,
        decision: exclusion.decision,
        decidedBy: exclusion.decidedBy,
        decidedAt: exclusion.decidedAt,
        reason: exclusion.reason,
        matchedBy,
      };
    }
  }
  return null;
}
