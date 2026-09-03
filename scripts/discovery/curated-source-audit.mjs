import { createHash } from 'node:crypto';
import {
  buildConnectorIndex,
  canonicalPackageName,
  canonicalPublicUrl,
  classifyDataService,
  dedupeCandidate,
  sanitizeText,
  slugify,
} from './candidate-model.mjs';
import { parseAndNormalizeSource } from './curated-source-parsers.mjs';

const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const NON_DATA_TOOL_PATTERNS = [
  /filesystem/i,
  /sqlite database operations/i,
  /redis database operations/i,
  /knowledge[- ]graph (?:based )?(?:persistent )?memory/i,
  /reference server exercising every mcp feature/i,
  /browser automation/i,
  /git repository operations|natural-language git operations/i,
  /structured,? revisable chain-of-thought|step-by-step reasoning/i,
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function safeError(error) {
  return sanitizeText(error instanceof Error ? error.message : String(error), 300)
    .replace(/(token|secret|password|api[-_ ]?key)=[^\s&]+/gi, '$1=[redacted]');
}

function githubHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'dsh-mcp-connector-registry-curated-source-audit/1',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function boundedResponse(url, {
  fetchImpl = fetch,
  headers = {},
  requestTimeoutMs = 20_000,
  acceptStatuses = [],
} = {}) {
  const response = await fetchImpl(url, {
    headers,
    redirect: 'error',
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  if (!response.ok && !acceptStatuses.includes(response.status)) throw new Error(`${new URL(url).hostname} returned HTTP ${response.status}`);
  const declaredLength = Number(response.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_RESPONSE_BYTES) throw new Error(`${new URL(url).hostname} response exceeds ${MAX_RESPONSE_BYTES} bytes`);
  const text = await response.text();
  if (Buffer.byteLength(text) > MAX_RESPONSE_BYTES) throw new Error(`${new URL(url).hostname} response exceeds ${MAX_RESPONSE_BYTES} bytes`);
  return { response, text };
}

async function fetchJson(url, options) {
  const { response, text } = await boundedResponse(url, options);
  if (!response.ok) return { status: response.status, value: null };
  try {
    return { status: response.status, value: JSON.parse(text) };
  } catch {
    throw new Error(`${new URL(url).hostname} did not return valid JSON`);
  }
}

function requireSourceConfig(source) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(source?.id ?? '')) throw new Error('Curated source id must be a lowercase slug');
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(source?.repository ?? '')) throw new Error(`${source.id} repository must be owner/name`);
  if (!/^[A-Za-z0-9._/-]+$/.test(source?.ref ?? '')) throw new Error(`${source.id} ref is invalid`);
  if (!['panel-typescript', 'market-json', 'bridge-json-directory'].includes(source?.format)) throw new Error(`${source.id} format is invalid`);
  const configuredPath = source.format === 'bridge-json-directory' ? source.pathPrefix : source.path;
  const pathSegments = typeof configuredPath === 'string' ? configuredPath.split('/') : [];
  if (source.format === 'bridge-json-directory' && pathSegments.at(-1) === '') pathSegments.pop();
  if (typeof configuredPath !== 'string'
    || configuredPath.length === 0
    || configuredPath.startsWith('/')
    || pathSegments.length === 0
    || pathSegments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    throw new Error(`${source.id} source path must be a repository-relative path without traversal segments`);
  }
  return source;
}

function rawGithubUrl(repository, revision, path) {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return `https://raw.githubusercontent.com/${repository}/${revision}/${encodedPath}`;
}

export async function fetchCuratedSource(sourceInput, {
  fetchImpl = fetch,
  githubToken,
  retrievedAt = new Date().toISOString(),
  requestTimeoutMs = 20_000,
} = {}) {
  const source = requireSourceConfig(sourceInput);
  const headers = githubHeaders(githubToken);
  const commitUrl = `https://api.github.com/repos/${source.repository}/commits/${encodeURIComponent(source.ref)}`;
  const commit = (await fetchJson(commitUrl, { fetchImpl, headers, requestTimeoutMs })).value;
  const revision = String(commit?.sha ?? '');
  if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error(`${source.id} commit response did not include a full SHA`);
  const committedAt = commit?.commit?.committer?.date ?? null;
  let parsed;
  let paths;
  if (source.format === 'bridge-json-directory') {
    const treeUrl = `https://api.github.com/repos/${source.repository}/git/trees/${revision}?recursive=1`;
    const tree = (await fetchJson(treeUrl, { fetchImpl, headers, requestTimeoutMs })).value;
    if (!Array.isArray(tree?.tree) || tree.truncated === true) throw new Error(`${source.id} tree is missing or truncated`);
    paths = tree.tree
      .filter((item) => item?.type === 'blob' && typeof item.path === 'string' && item.path.startsWith(source.pathPrefix) && item.path.endsWith('.json'))
      .map((item) => item.path)
      .sort();
    if (paths.length === 0 || paths.length > 100) throw new Error(`${source.id} JSON definition count ${paths.length} is outside 1-100`);
    const documents = await Promise.all(paths.map(async (path) => {
      const { text } = await boundedResponse(rawGithubUrl(source.repository, revision, path), { fetchImpl, requestTimeoutMs });
      return { path, text };
    }));
    const { text: readmeText } = await boundedResponse(rawGithubUrl(source.repository, revision, 'README.md'), { fetchImpl, requestTimeoutMs });
    parsed = parseAndNormalizeSource({ format: source.format, sourceId: source.id, documents, readmeText });
  } else {
    paths = [source.path];
    const { text } = await boundedResponse(rawGithubUrl(source.repository, revision, source.path), { fetchImpl, requestTimeoutMs });
    parsed = parseAndNormalizeSource({ format: source.format, sourceId: source.id, text });
  }
  return {
    id: source.id,
    repository: `https://github.com/${source.repository}`,
    revision,
    committedAt,
    retrievedAt,
    mode: 'live',
    paths,
    entries: parsed,
    error: null,
  };
}

export async function collectCuratedSources(config, lastGood = {}, options = {}) {
  if (config?.schemaVersion !== 1 || !Array.isArray(config.sources) || config.sources.length === 0) throw new Error('Curated source config must contain sources');
  const lastGoodById = new Map((lastGood.sources ?? []).map((source) => [source.id, source]));
  const sources = [];
  for (const source of config.sources) {
    try {
      const live = await fetchCuratedSource(source, options);
      const previous = lastGoodById.get(source.id);
      if (previous?.entries?.length > 0) {
        const currentByEntryId = new Map(live.entries.map((entry) => [entry.entryId, entry]));
        const retained = [];
        const drifts = [];
        for (const oldEntry of previous.entries) {
          const current = currentByEntryId.get(oldEntry.entryId);
          if (!current) {
            retained.push({
              ...clone(oldEntry),
              retainedFromLastGood: true,
              verification: {
                ...clone(oldEntry.verification),
                status: 'DEFERRED',
                reason: 'Entry disappeared from the live source and is retained from last-good pending human review.',
              },
            });
            drifts.push(`${oldEntry.entryId}: removed`);
          } else {
            const oldIdentity = identityForEntry(oldEntry, source.id);
            const currentIdentity = identityForEntry(current, source.id);
            if (oldIdentity !== currentIdentity) {
              current.verification = {
                ...current.verification,
                status: 'DEFERRED',
                reason: `Entry identity changed from ${oldIdentity} to ${currentIdentity}; human review is required.`,
              };
              retained.push({
                ...clone(oldEntry),
                entryId: `${oldEntry.entryId}-last-good`,
                retainedFromLastGood: true,
                verification: {
                  ...clone(oldEntry.verification),
                  status: 'DEFERRED',
                  reason: `Previous identity ${oldIdentity} is retained because the live source now declares ${currentIdentity}.`,
                },
              });
              drifts.push(`${oldEntry.entryId}: ${oldIdentity} -> ${currentIdentity}`);
            }
          }
        }
        if (retained.length > 0) {
          live.entries.push(...retained);
          live.entries.sort((a, b) => a.entryId.localeCompare(b.entryId));
          live.mode = 'live-with-drift';
          live.error = `Last-good reconciliation retained ${retained.length} removed or renamed entr${retained.length === 1 ? 'y' : 'ies'}: ${drifts.join('; ')}`;
        }
      }
      sources.push(live);
    } catch (error) {
      const fallback = lastGoodById.get(source.id);
      if (fallback?.entries?.length > 0) {
        sources.push({
          ...clone(fallback),
          retrievedAt: options.retrievedAt ?? new Date().toISOString(),
          mode: 'last-good',
          error: safeError(error),
        });
      } else {
        sources.push({
          id: source.id,
          repository: `https://github.com/${source.repository}`,
          revision: null,
          committedAt: null,
          retrievedAt: options.retrievedAt ?? new Date().toISOString(),
          mode: 'failed',
          paths: [],
          entries: [],
          error: safeError(error),
        });
      }
    }
  }
  return sources;
}

function identityForEntry(entry, sourceId) {
  if (entry.package?.name) return `${entry.package.registry}:${entry.package.name.toLowerCase()}`;
  if (entry.url) {
    const canonical = canonicalPublicUrl(entry.url, { stripQuery: true });
    if (canonical) return `url:${canonical}`;
  }
  return `template:${sourceId}:${slugify(entry.entryId)}`;
}

function verificationRank(status) {
  return ({ PASS: 4, DEFERRED: 3, FAIL: 2, SKIP: 1 })[status] ?? 0;
}

function restrictiveAccess(entries) {
  const order = ['template', 'requires-credentials', 'heavy-dependency', 'requires-configuration', 'zero-config'];
  return entries.map((entry) => entry.access).sort((a, b) => order.indexOf(a.mode) - order.indexOf(b.mode))[0];
}

function mergeVerification(entries) {
  const candidates = entries.map((entry) => entry.verification).sort((a, b) => verificationRank(b.status) - verificationRank(a.status));
  const chosen = candidates[0] ?? { status: 'SKIP', checkedAt: null, toolCount: null, reason: 'No source verification exists.' };
  const timestamps = candidates.map((item) => item.checkedAt).filter(Boolean).sort();
  const toolCounts = candidates.map((item) => item.toolCount).filter(Number.isInteger);
  return {
    status: chosen.status,
    checkedAt: timestamps.at(-1) ?? null,
    toolCount: toolCounts.length > 0 ? Math.max(...toolCounts) : null,
    reason: chosen.reason,
  };
}

export function mergeCuratedEntries(sources) {
  const byIdentity = new Map();
  for (const source of sources) {
    for (const entry of source.entries ?? []) {
      const identity = identityForEntry(entry, source.id);
      const item = byIdentity.get(identity) ?? { identity, refs: [] };
      item.refs.push({ sourceId: source.id, sourceMode: source.mode, revision: source.revision, ...clone(entry) });
      byIdentity.set(identity, item);
    }
  }
  return [...byIdentity.values()].map((item) => {
    const first = item.refs[0];
    const homepages = unique(item.refs.map((entry) => entry.homepage));
    const verification = mergeVerification(item.refs);
    const classification = classifyDataService({
      name: item.identity,
      title: first.title,
      description: item.refs.map((entry) => entry.description).join(' '),
    });
    const combinedText = item.refs.map((entry) => `${entry.title} ${entry.description}`).join(' ');
    if (/\bgoogle maps\b|\bgeocod(?:e|ing)\b|\bdirections?\b/i.test(combinedText)) {
      classification.isDataService = true;
      classification.domains = unique([...classification.domains, 'geospatial']).sort();
      classification.matchedKeywords = unique([...classification.matchedKeywords, 'geocoding']).sort();
    }
    if (NON_DATA_TOOL_PATTERNS.some((pattern) => pattern.test(combinedText))) {
      classification.isDataService = false;
      classification.domains = [];
      classification.matchedKeywords = [];
    }
    return {
      id: `curated-${slugify(item.identity)}-${createHash('sha256').update(item.identity).digest('hex').slice(0, 8)}`,
      identity: item.identity,
      title: first.title,
      descriptions: unique(item.refs.map((entry) => entry.description)),
      homepages,
      transport: first.transport,
      package: first.package,
      url: first.url,
      access: restrictiveAccess(item.refs),
      verification,
      classification,
      sources: item.refs.map((entry) => ({
        sourceId: entry.sourceId,
        sourceMode: entry.sourceMode,
        revision: entry.revision,
        entryId: entry.entryId,
      })),
    };
  }).sort((a, b) => a.identity.localeCompare(b.identity));
}

function githubRepositoryIdentity(value) {
  const text = String(value ?? '').replace(/^git\+/, '').replace(/\.git(?:#.*)?$/, '').replace(/#.*$/, '');
  const match = text.match(/github\.com[/:]([^/]+)\/([^/?#]+)/i);
  return match ? `${match[1].toLowerCase()}/${match[2].toLowerCase()}` : null;
}

function packageRepository(metadata) {
  const repository = typeof metadata?.repository === 'string' ? metadata.repository : metadata?.repository?.url;
  return githubRepositoryIdentity(repository) ?? githubRepositoryIdentity(metadata?.homepage);
}

function sourceRepository(homepages) {
  return unique(homepages.map(githubRepositoryIdentity))[0] ?? null;
}

function repositoryFallback(identity, lastGood, error, checkedAt) {
  const fallback = lastGood?.repositories?.find((item) => item.identity === identity);
  if (fallback) {
    return {
      ...clone(fallback), checkedAt, metadataSource: 'last-good', status: 'DEFERRED',
      reason: `Live GitHub repository lookup failed; retained last-good metadata: ${safeError(error)}`,
    };
  }
  return {
    identity, exists: null, archived: null, pushedAt: null, licenseSpdx: null,
    metadataSource: 'unavailable', checkedAt, status: 'DEFERRED',
    reason: `GitHub repository lookup failed and no last-good metadata exists: ${safeError(error)}`,
  };
}

export async function auditGitHubRepository(identity, {
  fetchImpl = fetch,
  githubToken,
  lastGood,
  checkedAt = new Date().toISOString(),
  requestTimeoutMs = 20_000,
} = {}) {
  if (!identity) return null;
  try {
    const url = `https://api.github.com/repos/${identity}`;
    const result = await fetchJson(url, {
      fetchImpl,
      headers: githubHeaders(githubToken),
      requestTimeoutMs,
      acceptStatuses: [404],
    });
    if (result.status === 404) {
      return {
        identity, exists: false, archived: null, pushedAt: null, licenseSpdx: null,
        metadataSource: 'live', checkedAt, status: 'DEFERRED',
        reason: 'GitHub returned HTTP 404 for the repository declared by the source catalog.',
      };
    }
    const metadata = result.value;
    if (String(metadata?.full_name ?? '').toLowerCase() !== identity.toLowerCase()) {
      return {
        identity, exists: null, archived: null, pushedAt: null, licenseSpdx: null,
        metadataSource: 'live', checkedAt, status: 'DEFERRED',
        reason: `GitHub resolved ${metadata?.full_name ?? 'no repository name'} instead of ${identity}.`,
      };
    }
    const archived = metadata.archived === true;
    return {
      identity, exists: true, archived, pushedAt: metadata.pushed_at ?? null,
      licenseSpdx: metadata.license?.spdx_id ?? null,
      metadataSource: 'live', checkedAt,
      status: archived ? 'DEFERRED' : 'PASS',
      reason: archived ? 'GitHub repository exists but is archived.' : 'Exact GitHub repository exists and is not archived.',
    };
  } catch (error) {
    return repositoryFallback(identity, lastGood, error, checkedAt);
  }
}

function ownershipForLead(lead) {
  const repository = lead.repositoryAudit?.identity ?? sourceRepository(lead.homepages);
  if (!repository || lead.repositoryAudit?.status !== 'PASS' || lead.packageAudit?.provenance === 'missing' || lead.packageAudit?.provenance === 'mismatch') {
    return {
      kind: 'unknown',
      repository,
      reason: 'Current package-to-repository ownership is missing, inconsistent, or unavailable.',
    };
  }
  const owner = repository.split('/')[0];
  const scope = lead.package?.name?.match(/^@([^/]+)\//)?.[1]?.toLowerCase();
  const knownPublisherOwners = new Set(['modelcontextprotocol', 'microsoft', 'redis', 'upstash']);
  const kind = scope === owner || knownPublisherOwners.has(owner) ? 'official-or-publisher' : 'community';
  return {
    kind,
    repository,
    reason: kind === 'official-or-publisher'
      ? 'Package metadata and the live repository support MCP server publisher ownership; this is not upstream data-provider endorsement.'
      : 'Package metadata and the live repository support an accountable community source; this is not upstream data-provider endorsement.',
  };
}

function normalizedPyPiName(value) {
  return String(value ?? '').toLowerCase().replace(/[-_.]+/g, '-');
}

function packageFallback(identity, lastGood, error, checkedAt) {
  const fallback = lastGood?.packages?.find((item) => item.identity === identity);
  if (fallback) {
    return {
      ...clone(fallback),
      checkedAt,
      metadataSource: 'last-good',
      status: 'DEFERRED',
      reason: `Live package registry lookup failed; retained last-good metadata: ${safeError(error)}`,
    };
  }
  return {
    identity,
    registry: identity.split(':', 1)[0],
    requestedName: identity.slice(identity.indexOf(':') + 1),
    resolvedName: null,
    version: null,
    modifiedAt: null,
    exists: null,
    deprecated: null,
    repository: null,
    provenance: 'unknown',
    metadataSource: 'unavailable',
    checkedAt,
    status: 'DEFERRED',
    reason: `Package registry lookup failed and no last-good metadata exists: ${safeError(error)}`,
  };
}

export async function auditPackage(lead, {
  fetchImpl = fetch,
  lastGood,
  checkedAt = new Date().toISOString(),
  requestTimeoutMs = 20_000,
} = {}) {
  if (!lead.package) return null;
  const { registry, name } = lead.package;
  const canonicalName = canonicalPackageName(name) ?? name.toLowerCase();
  const identity = `${registry}:${canonicalName}`;
  try {
    if (registry === 'npm') {
      const url = `https://registry.npmjs.org/${encodeURIComponent(name)}`;
      const result = await fetchJson(url, { fetchImpl, requestTimeoutMs, acceptStatuses: [404] });
      if (result.status === 404) {
        return {
          identity, registry, requestedName: name, resolvedName: null, version: null, modifiedAt: null,
          exists: false, deprecated: null, repository: null, provenance: 'unknown', metadataSource: 'live', checkedAt,
          status: 'FAIL', reason: 'npm returned HTTP 404 for the exact package name.',
        };
      }
      const metadata = result.value;
      const resolvedName = metadata?.name ?? null;
      const version = metadata?.['dist-tags']?.latest ?? null;
      const latest = version ? metadata?.versions?.[version] ?? {} : {};
      const deprecated = sanitizeText(latest.deprecated, 300) || null;
      const repository = packageRepository(latest) ?? packageRepository(metadata);
      const expectedRepository = sourceRepository(lead.homepages);
      const provenance = expectedRepository && repository
        ? expectedRepository === repository ? 'verified' : 'mismatch'
        : expectedRepository ? 'missing' : repository ? 'registry-only' : 'unknown';
      let status = 'PASS';
      let reason = 'Exact npm package exists and its current metadata passed identity checks.';
      if (resolvedName !== name) {
        status = 'DEFERRED';
        reason = `npm resolved ${resolvedName ?? 'no name'} instead of the requested exact name ${name}.`;
      } else if (deprecated) {
        status = 'DEFERRED';
        reason = `npm marks the current package deprecated: ${deprecated}`;
      } else if (provenance === 'mismatch' || provenance === 'missing') {
        status = 'DEFERRED';
        reason = provenance === 'mismatch'
          ? `Package repository ${repository} does not match source repository ${expectedRepository}.`
          : `Source declares ${expectedRepository}, but npm metadata has no matching repository or homepage.`;
      }
      return {
        identity, registry, requestedName: name, resolvedName, version,
        modifiedAt: metadata?.time?.modified ?? null,
        exists: true, deprecated, repository, provenance, metadataSource: 'live', checkedAt, status, reason,
      };
    }
    if (registry === 'pypi') {
      const url = `https://pypi.org/pypi/${encodeURIComponent(name)}/json`;
      const result = await fetchJson(url, { fetchImpl, requestTimeoutMs, acceptStatuses: [404] });
      if (result.status === 404) {
        return {
          identity, registry, requestedName: name, resolvedName: null, version: null, modifiedAt: null,
          exists: false, deprecated: null, repository: null, provenance: 'unknown', metadataSource: 'live', checkedAt,
          status: 'FAIL', reason: 'PyPI returned HTTP 404 for the exact normalized package name.',
        };
      }
      const metadata = result.value;
      const resolvedName = metadata?.info?.name ?? null;
      const projectUrls = Object.values(metadata?.info?.project_urls ?? {});
      const repository = projectUrls.map(githubRepositoryIdentity).find(Boolean) ?? githubRepositoryIdentity(metadata?.info?.home_page);
      const expectedRepository = sourceRepository(lead.homepages);
      const provenance = expectedRepository && repository
        ? expectedRepository === repository ? 'verified' : 'mismatch'
        : expectedRepository ? 'missing' : repository ? 'registry-only' : 'unknown';
      let status = 'PASS';
      let reason = 'Exact normalized PyPI package exists and its current metadata passed identity checks.';
      if (normalizedPyPiName(resolvedName) !== normalizedPyPiName(name)) {
        status = 'DEFERRED';
        reason = `PyPI resolved ${resolvedName ?? 'no name'} instead of ${name}.`;
      } else if (provenance === 'mismatch') {
        status = 'DEFERRED';
        reason = `Package repository ${repository} does not match source repository ${expectedRepository}.`;
      }
      return {
        identity, registry, requestedName: name, resolvedName, version: metadata?.info?.version ?? null,
        modifiedAt: metadata?.releases?.[metadata?.info?.version]?.map((item) => item.upload_time_iso_8601).filter(Boolean).sort().at(-1) ?? null,
        exists: true, deprecated: null, repository, provenance, metadataSource: 'live', checkedAt, status, reason,
      };
    }
    throw new Error(`Unsupported package registry ${registry}`);
  } catch (error) {
    return packageFallback(identity, lastGood, error, checkedAt);
  }
}

function addDedupeMatch(target, key, connectorIds, reason) {
  if (target.some((item) => item.key === key)) return;
  target.push({ key, connectorIds: unique(connectorIds).sort(), reason });
}

function dedupeLead(lead, connectors, knownReplacements = []) {
  const pseudo = {
    id: lead.id,
    registryName: lead.identity,
    title: lead.title,
    transports: lead.package
      ? [{ kind: 'package', type: 'stdio', url: null, package: { registryType: lead.package.registry, identifier: lead.package.name, version: null } }]
      : lead.url ? [{ kind: 'remote', type: lead.transport, url: lead.url, package: null }] : [],
  };
  const dedupe = dedupeCandidate(pseudo, buildConnectorIndex(connectors)).dedupe;
  const homepageIndex = new Map();
  for (const connector of connectors) {
    const homepage = canonicalPublicUrl(connector.homepage, { stripQuery: true });
    if (homepage) homepageIndex.set(homepage, connector.id);
  }
  for (const homepage of lead.homepages) {
    const connectorId = homepageIndex.get(canonicalPublicUrl(homepage, { stripQuery: true }));
    if (connectorId) addDedupeMatch(dedupe.strong, `homepage:${homepage}`, [connectorId], 'Exact product homepage matches an existing connector.');
  }
  const replacement = knownReplacements.find((item) => item.identity === lead.identity);
  if (replacement && connectors.some((connector) => connector.id === replacement.connectorId)) {
    addDedupeMatch(dedupe.strong, `replacement:${replacement.connectorId}`, [replacement.connectorId], replacement.reason);
  }
  dedupe.level = dedupe.strong.length > 0 ? 'strong' : dedupe.weak.length > 0 ? 'weak' : 'none';
  return dedupe;
}

function scoreLead(lead) {
  const sourceCount = lead.sources.length;
  const packageAudit = lead.packageAudit;
  const authority = Math.min(25,
    4 + Math.min(6, sourceCount * 2)
    + (lead.homepages.length > 0 ? 3 : 0)
    + (packageAudit?.provenance === 'verified' && lead.repositoryAudit?.status === 'PASS' ? 5 : 0)
    + (lead.sources.every((source) => /^[a-f0-9]{40}$/.test(source.revision ?? '')) ? 3 : 0));
  const accessibility = Math.min(25,
    (lead.package ? 6 : lead.url?.startsWith('https://') ? 10 : 0)
    + (packageAudit?.exists === true ? 5 : 0)
    + ({ 'zero-config': 5, 'requires-credentials': 2, 'requires-configuration': 1, 'heavy-dependency': 0, template: 0 }[lead.access.mode] ?? 0)
    + (['stdio', 'streamable-http'].includes(lead.transport) ? 2 : 0));
  const maintenanceSecurity = Math.min(20,
    (packageAudit?.status === 'PASS' ? 6 : 0)
    + (packageAudit?.deprecated ? 0 : 3)
    + (packageAudit?.modifiedAt ? 3 : 0)
    + (lead.homepages.length > 0 ? 2 : 0));
  const runtime = lead.verification.status === 'PASS' ? 15 : 0;
  const marketGap = Math.min(10,
    (lead.classification.isDataService ? 6 : 0)
    + Math.min(2, lead.classification.domains.length)
    + (lead.dedupe.level === 'strong' ? 0 : lead.dedupe.level === 'weak' ? 1 : 2));
  const documentation = Math.min(5, (lead.descriptions.some((item) => item.length >= 30) ? 2 : 1) + (lead.homepages.length > 0 ? 2 : 0) + (sourceCount > 1 ? 1 : 0));
  const dimensions = { authority, accessibility, maintenanceSecurity, runtime, marketGap, documentation };
  const total = Object.values(dimensions).reduce((sum, value) => sum + value, 0);
  const gates = [];
  let band = 'watchlist';
  if (!lead.classification.isDataService) {
    band = 'not-data';
    gates.push('Generic local tool or infrastructure; not a high-quality external data service.');
  } else if (lead.dedupe.level === 'strong') {
    band = 'duplicate';
    gates.push('Existing Connector or an explicitly recorded replacement already covers this identity.');
  } else if (lead.packageAudit?.status === 'FAIL' || lead.verification.status === 'FAIL') {
    band = 'defer';
    gates.push('Current package or runtime verification failed.');
  } else if (lead.packageAudit?.status === 'DEFERRED' || lead.verification.status === 'DEFERRED') {
    band = 'defer';
    gates.push('Package deprecation, provenance drift, or source inconsistency requires manual review.');
  } else {
    gates.push('Third-party catalog evidence cannot select a candidate without authoritative source/terms review.');
    gates.push('A fresh, explicitly read-only runtime acceptance report and human approval are mandatory before any Connector PR.');
  }
  return { total, band, dimensions, gates };
}

function overallVerification(lead) {
  if (lead.access.mode === 'template') return { ...lead.verification, status: 'SKIP', reason: lead.access.reason };
  if (lead.packageAudit?.status === 'FAIL') return { ...lead.verification, status: 'FAIL', reason: lead.packageAudit.reason };
  if (lead.packageAudit?.status === 'DEFERRED') return { ...lead.verification, status: 'DEFERRED', reason: lead.packageAudit.reason };
  if (lead.repositoryAudit?.status === 'DEFERRED') return { ...lead.verification, status: 'DEFERRED', reason: lead.repositoryAudit.reason };
  return lead.verification;
}

async function mapConcurrent(values, concurrency, fn) {
  const results = new Array(values.length);
  let next = 0;
  const worker = async () => {
    while (next < values.length) {
      const index = next++;
      results[index] = await fn(values[index], index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker));
  return results;
}

export async function auditCuratedSources({
  config,
  sources,
  connectors = [],
  lastGood = {},
  fetchImpl = fetch,
  githubToken,
  checkedAt = new Date().toISOString(),
  requestTimeoutMs = 20_000,
} = {}) {
  const leads = mergeCuratedEntries(sources);
  const packageAudits = await mapConcurrent(leads, 4, (lead) => auditPackage(lead, { fetchImpl, lastGood, checkedAt, requestTimeoutMs }));
  const repositoryIdentities = unique(leads.map((lead, index) => sourceRepository(lead.homepages) ?? packageAudits[index]?.repository));
  const repositoryAudits = await mapConcurrent(repositoryIdentities, 4, (identity) => auditGitHubRepository(identity, {
    fetchImpl, githubToken, lastGood, checkedAt, requestTimeoutMs,
  }));
  const repositoryAuditByIdentity = new Map(repositoryAudits.map((audit) => [audit.identity, audit]));
  for (let index = 0; index < leads.length; index += 1) {
    leads[index].packageAudit = packageAudits[index];
    const repositoryIdentity = sourceRepository(leads[index].homepages) ?? packageAudits[index]?.repository;
    leads[index].repositoryAudit = repositoryIdentity ? repositoryAuditByIdentity.get(repositoryIdentity) ?? null : null;
    leads[index].ownership = ownershipForLead(leads[index]);
    leads[index].dedupe = dedupeLead(leads[index], connectors, config.knownReplacements);
    leads[index].verification = overallVerification(leads[index]);
    leads[index].score = scoreLead(leads[index]);
    leads[index].priority = leads[index].classification.isDataService && leads[index].dedupe.level !== 'strong'
      ? 'P2-overseas-supplement'
      : 'excluded';
  }
  leads.sort((a, b) => {
    const dataDifference = Number(b.classification.isDataService) - Number(a.classification.isDataService);
    return dataDifference || b.score.total - a.score.total || a.identity.localeCompare(b.identity);
  });
  const sourceModes = Object.fromEntries(sources.map((source) => [source.id, source.mode]));
  const statusDistribution = Object.fromEntries(['PASS', 'SKIP', 'FAIL', 'DEFERRED'].map((status) => [status, leads.filter((lead) => lead.verification.status === status).length]));
  const report = {
    schemaVersion: 1,
    generatedAt: checkedAt,
    policy: {
      readOnlySources: true,
      automaticPublishing: false,
      automaticDelisting: false,
      humanApprovalRequired: true,
      priority: 'Domestic statistics, finance, legal, transport, tendering, research, and government data remain P0; curated catalogs are supplemental only.',
    },
    summary: {
      rawEntries: sources.reduce((sum, source) => sum + source.entries.length, 0),
      uniqueIdentities: leads.length,
      executableIdentities: leads.filter((lead) => !lead.identity.startsWith('template:')).length,
      templates: leads.filter((lead) => lead.identity.startsWith('template:')).length,
      dataLeads: leads.filter((lead) => lead.classification.isDataService).length,
      strongDuplicates: leads.filter((lead) => lead.dedupe.level === 'strong').length,
      weakDuplicates: leads.filter((lead) => lead.dedupe.level === 'weak').length,
      sourceModes,
      statusDistribution,
    },
    sources,
    leads,
  };
  return report;
}

export function buildLastGoodSnapshot(report) {
  if (Object.values(report.summary.sourceModes).some((mode) => mode !== 'live')) {
    throw new Error('A new last-good snapshot requires every source to be live');
  }
  const unresolvedPackage = report.leads.find((lead) => lead.package && (lead.packageAudit?.metadataSource !== 'live' || lead.packageAudit?.exists !== true));
  if (unresolvedPackage) throw new Error(`A new last-good snapshot requires a live existing package result for ${unresolvedPackage.identity}`);
  const packages = report.leads
    .map((lead) => lead.packageAudit)
    .filter((audit) => audit?.metadataSource === 'live' && audit.exists === true)
    .sort((a, b) => a.identity.localeCompare(b.identity));
  const unresolvedRepository = report.leads.find((lead) => lead.repositoryAudit && lead.repositoryAudit.metadataSource !== 'live');
  if (unresolvedRepository) throw new Error(`A new last-good snapshot requires a live repository result for ${unresolvedRepository.repositoryAudit.identity}`);
  const repositories = [...new Map(report.leads
    .map((lead) => lead.repositoryAudit)
    .filter(Boolean)
    .map((audit) => [audit.identity, audit])).values()]
    .sort((a, b) => a.identity.localeCompare(b.identity));
  return {
    schemaVersion: 1,
    generatedAt: report.generatedAt,
    sources: report.sources.map((source) => ({ ...clone(source), error: null })),
    packages,
    repositories,
  };
}

function markdownCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

function matchIds(dedupe) {
  return unique([...(dedupe.strong ?? []), ...(dedupe.weak ?? [])].flatMap((match) => match.connectorIds)).join(', ') || '—';
}

export function renderCuratedSourceReport(report) {
  const lines = [
    '# Curated MCP catalog candidate-source audit',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Raw entries ${report.summary.rawEntries}; unique identities ${report.summary.uniqueIdentities}; executable ${report.summary.executableIdentities}; templates ${report.summary.templates}; data leads ${report.summary.dataLeads}.`,
    '',
    `Verification: PASS ${report.summary.statusDistribution.PASS}; SKIP ${report.summary.statusDistribution.SKIP}; FAIL ${report.summary.statusDistribution.FAIL}; DEFERRED ${report.summary.statusDistribution.DEFERRED}.`,
    '',
    '> Read-only candidate evidence only. Automation never publishes or delists Connectors; third-party catalog presence is not approval.',
    '',
    '## Data leads and review schedule',
    '',
    '| Identity | Source | Sources | Access | Package | Verification | Tools | Dedupe | Score / band | Schedule |',
    '|---|---|---|---|---|---|---:|---|---|---|',
  ];
  const dataLeads = report.leads.filter((lead) => lead.classification.isDataService);
  if (dataLeads.length === 0) lines.push('| — | — | — | — | — | — | — | — | — | No curated-source data lead passed deterministic classification. |');
  for (const lead of dataLeads) {
    lines.push(`| <code>${markdownCell(lead.identity)}</code><br>${markdownCell(lead.title)} | ${lead.ownership.kind}<br>${markdownCell(lead.ownership.repository ?? '—')} | ${lead.sources.map((source) => markdownCell(source.sourceId)).join(', ')} | ${lead.access.mode} | ${lead.packageAudit ? `${lead.packageAudit.status} ${lead.packageAudit.version ?? ''}`.trim() : 'n/a'} | ${lead.verification.status}<br>${markdownCell(lead.verification.reason)} | ${lead.verification.toolCount ?? '—'} | ${lead.dedupe.level}: ${matchIds(lead.dedupe)} | ${lead.score.total} / ${lead.score.band} | ${lead.priority} |`);
  }
  lines.push('', '## Complete deduplicated inventory', '', '| Identity | Data | Sources | Verification | Existing coverage | Decision |', '|---|---|---|---|---|---|');
  for (const lead of report.leads) {
    lines.push(`| <code>${markdownCell(lead.identity)}</code> | ${lead.classification.isDataService ? lead.classification.domains.join(', ') : 'no'} | ${lead.sources.map((source) => markdownCell(source.sourceId)).join(', ')} | ${lead.verification.status} | ${lead.dedupe.level}: ${matchIds(lead.dedupe)} | ${lead.score.band} |`);
  }
  lines.push(
    '',
    '## Mandatory gates before any Connector PR',
    '',
    '- Reconcile official or accountable community ownership, current repository/package identity, software license or service terms, and upstream data terms.',
    '- Complete a fresh real runtime acceptance using an explicitly read-only tool; credentialed and heavy dependencies stay SKIP until a bounded human test is available.',
    '- Obtain named human approval. This report cannot create a descriptor, merge a PR, publish a package, or delete an existing Connector.',
    '- Domestic statistics, finance, legal, transport, tendering, research, and government data discovery remains the highest-priority workstream.',
    '',
  );
  return lines.join('\n');
}

export function assertNoCredentialValues(value) {
  const serialized = JSON.stringify(value);
  if (/Bearer\s+[A-Za-z0-9._~-]{12,}/i.test(serialized)) throw new Error('Curated source output appears to contain a Bearer credential');
  if (/(?:api[_-]?key|token|secret|password)\s*[=:]\s*[A-Za-z0-9._~-]{16,}/i.test(serialized)) throw new Error('Curated source output appears to contain a credential value');
}
