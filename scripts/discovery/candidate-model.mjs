import { createHash } from 'node:crypto';
import { isIP } from 'node:net';

export const OFFICIAL_REGISTRY_API = 'https://registry.modelcontextprotocol.io';

const DATA_DOMAINS = Object.freeze({
  finance: ['finance', 'financial', 'stock', 'market data', 'trading', 'investment', 'portfolio', 'crypto', 'fund', 'banking', 'sec filing'],
  business: ['company data', 'business data', 'business intelligence', 'analytics', 'metrics', 'customer data', 'sales data'],
  research: ['research', 'dataset', 'database', 'knowledge base', 'literature', 'citation', 'paper', 'scholar'],
  science: ['scientific', 'genomic', 'protein', 'chemical', 'chemistry', 'material', 'clinical trial', 'biomedical'],
  geospatial: ['geospatial', 'geographic', 'mapping', 'map data', 'location data', 'weather', 'climate'],
  public: ['public data', 'open data', 'government data', 'economic data', 'statistics', 'census'],
  legal: ['legal data', 'case law', 'regulatory data', 'patent', 'trademark'],
  web: ['web data', 'web search', 'search data', 'web intelligence', 'scraping', 'crawl'],
});

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function sanitizeText(value, maxLength = 500) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted-email]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function slugify(value) {
  const slug = String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
  return slug || 'unnamed-candidate';
}

export function candidateId(registryName) {
  const digest = createHash('sha256').update(String(registryName)).digest('hex').slice(0, 10);
  return `${slugify(registryName).slice(0, 100)}-${digest}`;
}

export function canonicalPublicUrl(value, { stripQuery = false } = {}) {
  if (!value) return null;
  try {
    const url = new URL(String(value));
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    const hostname = url.hostname.toLowerCase();
    if (!hostname || hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.internal') || isIP(hostname)) return null;
    url.hostname = hostname;
    url.hash = '';
    if (stripQuery) url.search = '';
    if (url.port === '443') url.port = '';
    if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '');
    return url.toString();
  } catch {
    return null;
  }
}

function normalizeRepository(repository) {
  const url = canonicalPublicUrl(repository?.url);
  if (!url) return null;
  return {
    url,
    source: sanitizeText(repository?.source, 40) || 'unknown',
    id: repository?.id == null ? null : sanitizeText(repository.id, 100),
    subfolder: repository?.subfolder == null ? null : sanitizeText(repository.subfolder, 200),
  };
}

function normalizeHeaders(remotes) {
  const headers = [];
  for (const remote of remotes) {
    for (const header of Array.isArray(remote?.headers) ? remote.headers : []) {
      const name = sanitizeText(header?.name, 100);
      if (!name) continue;
      headers.push({ name, required: header?.isRequired === true, secret: header?.isSecret === true });
    }
  }
  return [...new Map(headers.map((header) => [header.name.toLowerCase(), header])).values()]
    .sort((a, b) => a.name.localeCompare(b.name));
}

function inferAuthentication(remotes) {
  const requiredHeaders = normalizeHeaders(remotes);
  const names = requiredHeaders.map((header) => header.name.toLowerCase());
  if (names.some((name) => /(?:x-)?api[-_]?key/.test(name))) {
    return { mode: 'api-key', requiredHeaders, reason: 'Official Registry declares an API-key header; no value was copied.' };
  }
  if (names.includes('authorization')) {
    return { mode: 'bearer', requiredHeaders, reason: 'Official Registry declares an Authorization header; no value was copied.' };
  }
  return {
    mode: 'unknown',
    requiredHeaders,
    reason: requiredHeaders.length > 0
      ? 'Official Registry declares headers, but the authentication scheme is not safely inferable.'
      : 'No credential header is declared; OAuth or another challenge may still be required.',
  };
}

function normalizeTransports(server) {
  const transports = [];
  for (const remote of Array.isArray(server?.remotes) ? server.remotes : []) {
    const rawUrl = String(remote?.url ?? '');
    transports.push({
      kind: 'remote',
      type: sanitizeText(remote?.type, 40) || 'unknown',
      url: canonicalPublicUrl(rawUrl, { stripQuery: rawUrl.includes('?') }),
      package: null,
    });
  }
  for (const pkg of Array.isArray(server?.packages) ? server.packages : []) {
    const transportType = typeof pkg?.transport === 'string' ? pkg.transport : pkg?.transport?.type;
    transports.push({
      kind: 'package',
      type: sanitizeText(transportType, 40) || 'stdio',
      url: null,
      package: {
        registryType: sanitizeText(pkg?.registryType, 40) || 'unknown',
        identifier: sanitizeText(pkg?.identifier, 300),
        version: pkg?.version == null ? null : sanitizeText(pkg.version, 255),
      },
    });
  }
  return transports.filter((item) => item.url || item.package?.identifier)
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

export function classifyDataService(server) {
  const text = [server?.name, server?.title, server?.description]
    .map((value) => String(value ?? '').toLowerCase())
    .join(' ');
  const domains = [];
  const matchedKeywords = [];
  for (const [domain, keywords] of Object.entries(DATA_DOMAINS)) {
    const matches = keywords.filter((keyword) => text.includes(keyword));
    if (matches.length > 0) domains.push(domain);
    matchedKeywords.push(...matches);
  }
  return {
    isDataService: domains.length > 0,
    domains: uniqueSorted(domains),
    matchedKeywords: uniqueSorted(matchedKeywords),
  };
}

function ageInDays(timestamp, now) {
  if (!timestamp) return null;
  const value = Date.parse(timestamp);
  const current = Date.parse(now);
  if (!Number.isFinite(value) || !Number.isFinite(current)) return null;
  return Math.max(0, Math.floor((current - value) / 86_400_000));
}

export function normalizeOfficialServer(entry, { retrievedAt = new Date().toISOString(), apiBase = OFFICIAL_REGISTRY_API } = {}) {
  const server = entry?.server;
  if (!server || typeof server !== 'object') throw new Error('Official Registry entry is missing server data');
  const registryName = sanitizeText(server.name, 200);
  const version = sanitizeText(server.version, 255);
  const description = sanitizeText(server.description, 500);
  if (!registryName || !version || !description) throw new Error('Official Registry server must include name, version, and description');

  const officialMeta = entry?._meta?.['io.modelcontextprotocol.registry/official'] ?? {};
  const status = ['active', 'deprecated', 'deleted'].includes(officialMeta.status) ? officialMeta.status : 'unknown';
  const repository = normalizeRepository(server.repository);
  const websiteUrl = canonicalPublicUrl(server.websiteUrl);
  const transports = normalizeTransports(server);
  if (transports.length === 0) throw new Error(`${registryName} has no safely normalizable transport`);
  const detailUrl = `${apiBase.replace(/\/$/, '')}/v0.1/servers/${encodeURIComponent(registryName)}/versions/${encodeURIComponent(version)}`;
  const publishedAt = officialMeta.publishedAt ?? null;
  const updatedAt = officialMeta.updatedAt ?? null;
  const evidence = [{
    type: 'official-registry',
    url: detailUrl,
    collectedAt: retrievedAt,
    summary: `Official Registry status ${status}; version ${version}.`,
  }];
  if (websiteUrl) evidence.push({ type: 'official-website', url: websiteUrl, collectedAt: retrievedAt, summary: 'Publisher-provided website URL from Official Registry.' });
  if (repository) evidence.push({ type: 'official-repository', url: repository.url, collectedAt: retrievedAt, summary: 'Publisher-provided source repository from Official Registry.' });

  return {
    schemaVersion: 1,
    id: candidateId(registryName),
    registryName,
    title: sanitizeText(server.title, 200) || registryName.split('/').at(-1),
    description,
    version,
    classification: classifyDataService(server),
    source: {
      kind: 'official-mcp-registry',
      apiUrl: `${apiBase.replace(/\/$/, '')}/v0.1/servers`,
      detailUrl,
      status,
      publishedAt,
      updatedAt,
      retrievedAt,
    },
    officialLinks: { websiteUrl, repository },
    transports,
    authentication: inferAuthentication(Array.isArray(server.remotes) ? server.remotes : []),
    license: { status: 'unknown', spdxId: null, evidenceUrl: null },
    maintenance: {
      registryStatus: status,
      registryUpdatedAt: updatedAt,
      ageDays: ageInDays(updatedAt, retrievedAt),
      repositoryActivity: 'unknown',
    },
    probe: { status: 'not-run', checkedAt: null, targetUrl: null, httpStatus: null, reason: 'Public probe has not run.' },
    dedupe: { level: 'none', strong: [], weak: [] },
    score: { total: 0, band: 'defer', dimensions: { authority: 0, accessibility: 0, maintenanceSecurity: 0, runtime: 0, marketGap: 0, documentation: 0 }, reasons: [], gates: [] },
    review: { decision: 'pending', reviewedAt: null, reviewedBy: null, notes: '' },
    runtimeAcceptance: { status: 'not-run', checkedAt: null, reviewedBy: null, reportUrl: null, notes: '' },
    evidence,
  };
}

function addIndex(index, key, id) {
  if (!key) return;
  const values = index.get(key) ?? new Set();
  values.add(id);
  index.set(key, values);
}

export function buildConnectorIndex(connectors) {
  const strong = new Map();
  const weak = new Map();
  for (const connector of connectors ?? []) {
    const id = String(connector?.id ?? '');
    if (!id) continue;
    addIndex(strong, `id:${id.toLowerCase()}`, id);
    addIndex(weak, `name:${slugify(id)}`, id);
    for (const server of Array.isArray(connector?.servers) ? connector.servers : []) {
      const serverName = String(server?.serverName ?? '').toLowerCase();
      addIndex(strong, serverName ? `registry:${serverName}` : null, id);
      addIndex(weak, serverName ? `name:${slugify(serverName)}` : null, id);
      const url = canonicalPublicUrl(server?.url, { stripQuery: true });
      addIndex(strong, url ? `url:${url}` : null, id);
      if (url) addIndex(weak, `host:${new URL(url).hostname}`, id);
      for (const arg of Array.isArray(server?.args) ? server.args : []) {
        if (/^(?:@?[a-z0-9][a-z0-9._/-]+)$/i.test(arg)) addIndex(strong, `package:${String(arg).toLowerCase()}`, id);
      }
    }
  }
  return { strong, weak };
}

function matchesFor(index, keys, reason) {
  return uniqueSorted(keys).flatMap((key) => {
    const connectorIds = uniqueSorted([...(index.get(key) ?? [])]);
    return connectorIds.length > 0 ? [{ key, connectorIds, reason }] : [];
  });
}

export function dedupeCandidate(candidate, index) {
  const strongKeys = [`id:${candidate.id}`, `registry:${candidate.registryName.toLowerCase()}`];
  const weakKeys = [`name:${slugify(candidate.registryName.split('/').at(-1))}`, `name:${slugify(candidate.title)}`];
  for (const transport of candidate.transports) {
    if (transport.url) {
      strongKeys.push(`url:${canonicalPublicUrl(transport.url, { stripQuery: true })}`);
      weakKeys.push(`host:${new URL(transport.url).hostname}`);
    }
    if (transport.package?.identifier) strongKeys.push(`package:${transport.package.identifier.toLowerCase()}`);
  }
  const strong = matchesFor(index.strong, strongKeys, 'Exact stable identity matches an existing connector.');
  const weak = matchesFor(index.weak, weakKeys, 'Name or host similarity requires human review and does not suppress the candidate.');
  candidate.dedupe = { level: strong.length > 0 ? 'strong' : weak.length > 0 ? 'weak' : 'none', strong, weak };
  return candidate;
}

function scoreRecency(ageDays) {
  if (ageDays == null) return 0;
  if (ageDays <= 90) return 6;
  if (ageDays <= 365) return 4;
  return 1;
}

export function scoreCandidate(candidate) {
  const remote = candidate.transports.filter((item) => item.kind === 'remote');
  const packages = candidate.transports.filter((item) => item.kind === 'package');
  const namespace = candidate.registryName.split('/')[0];
  const authority = Math.min(25,
    10
    + (candidate.source.status === 'active' ? 2 : 0)
    + (namespace.startsWith('io.github.') ? 4 : 6)
    + (candidate.officialLinks.repository ? 4 : 0)
    + (candidate.officialLinks.websiteUrl ? 3 : 0));
  const safeRemoteCount = remote.filter((item) => item.url?.startsWith('https://')).length;
  const pinnedPackages = packages.filter((item) => item.package?.version && item.package.version !== 'latest').length;
  const accessibility = Math.min(25,
    (remote.length > 0 ? 10 : 0)
    + (remote.length > 0 && safeRemoteCount === remote.length ? 5 : 0)
    + (packages.length > 0 ? 6 : 0)
    + (candidate.authentication.mode === 'unknown' ? 1 : 4)
    + (pinnedPackages === packages.length && packages.length > 0 ? 3 : 0)
    + (candidate.transports.every((item) => ['streamable-http', 'sse', 'stdio'].includes(item.type)) ? 2 : 0));
  const maintenanceSecurity = Math.min(20,
    (candidate.maintenance.registryStatus === 'active' ? 5 : 0)
    + scoreRecency(candidate.maintenance.ageDays)
    + (/^\d+\.\d+\.\d+(?:[-+].*)?$/.test(candidate.version) ? 3 : 0)
    + (candidate.officialLinks.repository ? 3 : 0)
    + (candidate.license.status === 'declared' ? 3 : 0));
  const runtime = ({ pass: 15, partial: 7, fail: 0, 'not-run': 0 })[candidate.probe.status] ?? 0;
  const marketGap = Math.min(10,
    (candidate.classification.isDataService ? 6 : 0)
    + Math.min(2, candidate.classification.domains.length)
    + (candidate.dedupe.level === 'strong' ? 0 : candidate.dedupe.level === 'weak' ? 1 : 2));
  const documentation = Math.min(5,
    (candidate.description.length >= 30 ? 2 : 1)
    + (candidate.officialLinks.websiteUrl ? 1 : 0)
    + (candidate.officialLinks.repository ? 1 : 0)
    + (candidate.authentication.mode !== 'unknown' ? 1 : 0));
  const dimensions = { authority, accessibility, maintenanceSecurity, runtime, marketGap, documentation };
  const total = Object.values(dimensions).reduce((sum, value) => sum + value, 0);
  const gates = [];
  let band;
  if (!candidate.classification.isDataService) {
    band = 'not-data';
    gates.push('Not classified as a data service by deterministic keywords.');
  } else if (candidate.dedupe.level === 'strong') {
    band = 'duplicate';
    gates.push('Strong duplicate must be reconciled with the existing connector.');
  } else if (candidate.source.status !== 'active') {
    band = 'defer';
    gates.push(`Official Registry status is ${candidate.source.status}.`);
  } else if (total >= 80) {
    band = 'selected';
  } else if (total >= 65) {
    band = 'watchlist';
  } else {
    band = 'defer';
  }
  if (band === 'selected' || band === 'watchlist') gates.push('Human source review and real runtime acceptance are still required before a descriptor PR.');
  candidate.score = {
    total,
    band,
    dimensions,
    reasons: [
      `authority ${authority}/25: Official Registry plus publisher links and namespace evidence`,
      `accessibility ${accessibility}/25: ${remote.length} remote and ${packages.length} package transport(s); auth ${candidate.authentication.mode}`,
      `maintenance/security ${maintenanceSecurity}/20: status ${candidate.maintenance.registryStatus}; registry age ${candidate.maintenance.ageDays ?? 'unknown'} day(s); license ${candidate.license.status}`,
      `runtime ${runtime}/15: public probe ${candidate.probe.status}`,
      `market gap ${marketGap}/10: domains ${candidate.classification.domains.join(', ') || 'none'}; dedupe ${candidate.dedupe.level}`,
      `documentation ${documentation}/5: publisher-provided description and links`,
    ],
    gates,
  };
  return candidate;
}

export function rankCandidates(candidates) {
  return [...candidates].sort((a, b) => b.score.total - a.score.total || a.registryName.localeCompare(b.registryName));
}
