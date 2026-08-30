import { readFile } from 'node:fs/promises';
import {
  OFFICIAL_REGISTRY_API,
  buildConnectorIndex,
  dedupeCandidate,
  normalizeOfficialServer,
  rankCandidates,
  scoreCandidate,
} from './candidate-model.mjs';

function requireRegistryPage(payload) {
  if (!payload || !Array.isArray(payload.servers)) throw new Error('Official Registry response must contain a servers array');
  if (payload.metadata != null && typeof payload.metadata !== 'object') throw new Error('Official Registry response metadata must be an object');
  return payload;
}

export async function collectOfficialRegistry({
  apiBase = OFFICIAL_REGISTRY_API,
  updatedSince,
  limit = 100,
  maxPages = 1000,
  requestTimeoutMs = 20_000,
  onPage = () => {},
  fetchImpl = fetch,
} = {}) {
  const records = [];
  const seenCursors = new Set();
  let cursor;
  let pages = 0;
  do {
    if (pages >= maxPages) throw new Error(`Official Registry pagination exceeded ${maxPages} pages`);
    const url = new URL('/v0.1/servers', apiBase);
    url.searchParams.set('version', 'latest');
    url.searchParams.set('limit', String(limit));
    if (updatedSince) {
      url.searchParams.set('updated_since', updatedSince);
      url.searchParams.set('include_deleted', 'true');
    }
    if (cursor) url.searchParams.set('cursor', cursor);
    const response = await fetchImpl(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'dsh-mcp-connector-registry-discovery/1' },
      redirect: 'error',
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
    if (!response.ok) throw new Error(`Official Registry request failed with HTTP ${response.status}`);
    const payload = requireRegistryPage(await response.json());
    records.push(...payload.servers);
    pages += 1;
    onPage({ page: pages, count: payload.servers.length, total: records.length });
    const nextCursor = payload.metadata?.nextCursor || null;
    if (nextCursor && seenCursors.has(nextCursor)) throw new Error(`Official Registry repeated pagination cursor ${nextCursor}`);
    if (nextCursor) seenCursors.add(nextCursor);
    cursor = nextCursor;
  } while (cursor);
  return { records, pages };
}

export async function discoverOfficialCandidates({
  entries,
  connectors = [],
  retrievedAt = new Date().toISOString(),
  apiBase = OFFICIAL_REGISTRY_API,
} = {}) {
  const index = buildConnectorIndex(connectors);
  const candidates = [];
  const rejected = [];
  for (const entry of entries ?? []) {
    try {
      const candidate = normalizeOfficialServer(entry, { retrievedAt, apiBase });
      candidates.push(scoreCandidate(dedupeCandidate(candidate, index)));
    } catch (error) {
      rejected.push({
        registryName: String(entry?.server?.name ?? 'unknown').slice(0, 200),
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { candidates: rankCandidates(candidates), rejected };
}

export async function loadConnectorCatalog(path = 'catalog.json') {
  const payload = JSON.parse(await readFile(path, 'utf8'));
  if (!payload || !Array.isArray(payload.connectors)) throw new Error(`${path} must contain a connectors array`);
  return payload.connectors;
}
