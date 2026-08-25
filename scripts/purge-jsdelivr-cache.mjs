#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const DEFAULT_CDN_URL =
  'https://cdn.jsdelivr.net/gh/duhu2000/dsh-mcp-connector-registry@main/catalog.json';
export const DEFAULT_PURGE_URL =
  'https://purge.jsdelivr.net/gh/duhu2000/dsh-mcp-connector-registry@main/catalog.json';

function positiveInteger(value, fallback, name) {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`${name} must be a positive integer`);
  return parsed;
}

function nonNegativeInteger(value, fallback, name) {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error(`${name} must be a non-negative integer`);
  return parsed;
}

function assertEndpoint(value, expectedHost, name) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== expectedHost || url.username || url.password) {
    throw new Error(`${name} must use https://${expectedHost}`);
  }
  return url;
}

function summarizeCatalog(text, source) {
  let catalog;
  try {
    catalog = JSON.parse(text);
  } catch (error) {
    throw new Error(`${source} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!catalog || Array.isArray(catalog) || !Array.isArray(catalog.connectors)) {
    throw new Error(`${source} must contain a connectors array`);
  }
  return {
    count: catalog.connectors.length,
    sha256: createHash('sha256').update(text).digest('hex'),
  };
}

async function fetchWithTimeout(url, options, timeoutMs, fetchImpl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('request timeout')), timeoutMs);
  try {
    return await fetchImpl(url, { ...options, redirect: 'follow', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function purgeAndVerifyCatalog({
  catalogPath = 'catalog.json',
  cdnUrl = DEFAULT_CDN_URL,
  purgeUrl = DEFAULT_PURGE_URL,
  verifyAttempts = 6,
  verifyDelayMs = 2_000,
  requestTimeoutMs = 20_000,
  fetchImpl = fetch,
  sleep = (ms) => new Promise((resolveDelay) => setTimeout(resolveDelay, ms)),
  log = (message) => console.log(message),
} = {}) {
  const cdn = assertEndpoint(cdnUrl, 'cdn.jsdelivr.net', 'CDN URL');
  const purge = assertEndpoint(purgeUrl, 'purge.jsdelivr.net', 'purge URL');
  if (cdn.pathname !== purge.pathname) {
    throw new Error('CDN URL and purge URL must target the same path');
  }
  if (!Number.isSafeInteger(verifyAttempts) || verifyAttempts <= 0) {
    throw new Error('verifyAttempts must be a positive integer');
  }
  if (!Number.isSafeInteger(verifyDelayMs) || verifyDelayMs < 0) {
    throw new Error('verifyDelayMs must be a non-negative integer');
  }

  const expectedText = await readFile(resolve(catalogPath), 'utf8');
  const expected = summarizeCatalog(expectedText, catalogPath);
  log(`jsdelivr-cache: purging ${cdn.pathname} for ${expected.count} connectors`);

  const purgeResponse = await fetchWithTimeout(
    purge.href,
    { headers: { Accept: 'application/json', 'User-Agent': 'dsh-mcp-connector-registry-ci' } },
    requestTimeoutMs,
    fetchImpl,
  );
  const purgeText = await purgeResponse.text();
  if (!purgeResponse.ok) throw new Error(`jsDelivr purge failed: HTTP ${purgeResponse.status} ${purgeText}`);

  let purgeResult;
  try {
    purgeResult = JSON.parse(purgeText);
  } catch {
    throw new Error(`jsDelivr purge returned non-JSON response: ${purgeText}`);
  }
  if (purgeResult?.status !== 'finished') {
    throw new Error(`jsDelivr purge did not finish: ${purgeResult?.status ?? 'missing status'}`);
  }
  const pathResult = purgeResult.paths?.[cdn.pathname];
  if (pathResult?.throttled === true) throw new Error('jsDelivr purge was throttled');

  let lastObserved = 'no CDN response';
  for (let attempt = 1; attempt <= verifyAttempts; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        cdn.href,
        {
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
            'User-Agent': 'dsh-mcp-connector-registry-ci',
          },
        },
        requestTimeoutMs,
        fetchImpl,
      );
      const text = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const observed = summarizeCatalog(text, 'jsDelivr catalog');
      lastObserved = `${observed.count} connectors, sha256 ${observed.sha256}`;
      if (observed.sha256 === expected.sha256) {
        log(`jsdelivr-cache: verified ${observed.count} connectors on attempt ${attempt}`);
        return { attempts: attempt, cdnUrl: cdn.href, ...observed };
      }
      log(`jsdelivr-cache: attempt ${attempt}/${verifyAttempts} is stale (${lastObserved})`);
    } catch (error) {
      lastObserved = error instanceof Error ? error.message : String(error);
      log(`jsdelivr-cache: attempt ${attempt}/${verifyAttempts} failed (${lastObserved})`);
    }
    if (attempt < verifyAttempts) await sleep(Math.min(verifyDelayMs * attempt, 10_000));
  }

  throw new Error(
    `jsDelivr catalog did not match ${catalogPath} after ${verifyAttempts} attempts; `
      + `expected ${expected.count} connectors, sha256 ${expected.sha256}; last observed ${lastObserved}`,
  );
}

async function main() {
  const result = await purgeAndVerifyCatalog({
    catalogPath: process.argv[2] ?? 'catalog.json',
    cdnUrl: process.env.JSDELIVR_CDN_URL ?? DEFAULT_CDN_URL,
    purgeUrl: process.env.JSDELIVR_PURGE_URL ?? DEFAULT_PURGE_URL,
    verifyAttempts: positiveInteger(process.env.JSDELIVR_VERIFY_ATTEMPTS, 6, 'JSDELIVR_VERIFY_ATTEMPTS'),
    verifyDelayMs: nonNegativeInteger(process.env.JSDELIVR_VERIFY_DELAY_MS, 2_000, 'JSDELIVR_VERIFY_DELAY_MS'),
    requestTimeoutMs: positiveInteger(process.env.JSDELIVR_REQUEST_TIMEOUT_MS, 20_000, 'JSDELIVR_REQUEST_TIMEOUT_MS'),
  });
  console.log(`jsdelivr-cache: success (${result.sha256})`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`jsdelivr-cache: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
