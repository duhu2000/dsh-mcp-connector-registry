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

function wait(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

async function fetchRegistryPage(url, {
  fetchImpl,
  requestTimeoutMs,
  maxAttempts,
  retryBaseMs,
}) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'dsh-mcp-connector-registry-discovery/1' },
        redirect: 'error',
        signal: AbortSignal.timeout(requestTimeoutMs),
      });
      if (response.ok) return requireRegistryPage(await response.json());
      if (response.status !== 429 && response.status < 500) {
        throw new Error(`Official Registry request failed with HTTP ${response.status}`);
      }
      lastError = new Error(`Official Registry request failed with retryable HTTP ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (/HTTP 4\d\d/.test(lastError.message) && !/HTTP 429/.test(lastError.message)) throw lastError;
    }
    if (attempt < maxAttempts) await wait(retryBaseMs * (2 ** (attempt - 1)));
  }
  throw new Error(`Official Registry request failed after ${maxAttempts} attempt(s): ${lastError?.message ?? 'unknown error'}`);
}

export async function collectOfficialRegistry({
  apiBase = OFFICIAL_REGISTRY_API,
  updatedSince,
  limit = 100,
  maxPages = 1000,
  requestTimeoutMs = 20_000,
  maxAttempts = 3,
  retryBaseMs = 250,
  onPage = () => {},
  fetchImpl = fetch,
} = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error('limit must be an integer from 1 to 100');
  }
  if (!Number.isInteger(requestTimeoutMs) || requestTimeoutMs < 100 || requestTimeoutMs > 120_000) {
    throw new Error('requestTimeoutMs must be an integer from 100 to 120000');
  }
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 10) {
    throw new Error('maxAttempts must be an integer from 1 to 10');
  }
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
    const payload = await fetchRegistryPage(url, {
      fetchImpl,
      requestTimeoutMs,
      maxAttempts,
      retryBaseMs,
    });
    records.push(...payload.servers);
    pages += 1;
    const nextCursor = payload.metadata?.nextCursor || null;
    if (nextCursor && seenCursors.has(nextCursor)) throw new Error(`Official Registry repeated pagination cursor ${nextCursor}`);
    if (nextCursor) seenCursors.add(nextCursor);
    cursor = nextCursor;
    onPage({ page: pages, count: payload.servers.length, total: records.length, nextCursor: cursor });
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
