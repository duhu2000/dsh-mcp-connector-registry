#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const BLOCKED_CORP = new Set(['same-origin', 'same-site']);

function headerValue(headers, name) {
  if (typeof headers?.get === 'function') return headers.get(name) ?? '';
  const wanted = name.toLowerCase();
  const entry = Object.entries(headers ?? {}).find(([key]) => key.toLowerCase() === wanted);
  return String(entry?.[1] ?? '');
}

export function assessIconResponse({ url, status, headers }) {
  const contentType = headerValue(headers, 'content-type').split(';', 1)[0].trim().toLowerCase();
  const corp = headerValue(headers, 'cross-origin-resource-policy').trim().toLowerCase();
  const cors = headerValue(headers, 'access-control-allow-origin').trim();
  const errors = [];

  if (status < 200 || status >= 300) errors.push(`HTTP ${status}`);
  if (!contentType.startsWith('image/')) errors.push(`Content-Type 不是图像：${contentType || 'missing'}`);
  if (BLOCKED_CORP.has(corp)) {
    errors.push(`Cross-Origin-Resource-Policy=${corp} 会阻止 DSH Desktop 跨域显示`);
  }

  return {
    ok: errors.length === 0,
    url,
    status,
    contentType,
    crossOriginResourcePolicy: corp || '(omitted)',
    accessControlAllowOrigin: cors || '(omitted; <img> 直接加载时可接受)',
    errors,
  };
}

function assertPublicHttpsUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error('远程图标必须使用 HTTPS');
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local') || host === '::1'
    || /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)
    || /^169\.254\./.test(host) || /^172\.(?:1[6-9]|2\d|3[01])\./.test(host)) {
    throw new Error('远程图标不得指向本机或私有网络');
  }
  return url;
}

async function fetchWithTimeout(url, options, timeoutMs, fetchImpl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs);
  try {
    return await fetchImpl(url, { ...options, redirect: 'follow', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function checkIcon(url, { timeoutMs = 15_000, fetchImpl = fetch } = {}) {
  assertPublicHttpsUrl(url);
  let response = await fetchWithTimeout(url, { method: 'HEAD' }, timeoutMs, fetchImpl);
  const headContentType = headerValue(response.headers, 'content-type');
  if (!response.ok || !headContentType || response.status === 405 || response.status === 501) {
    response = await fetchWithTimeout(url, { method: 'GET' }, timeoutMs, fetchImpl);
    await response.body?.cancel();
  }
  assertPublicHttpsUrl(response.url || url);
  return assessIconResponse({ url: response.url || url, status: response.status, headers: response.headers });
}

export async function checkRegistryIcons({ directory = 'connectors', timeoutMs = 15_000 } = {}) {
  const root = resolve(directory);
  const files = (await readdir(root))
    .filter((file) => file.endsWith('.json') && !file.endsWith('.sample.json'))
    .sort();
  const icons = new Map();

  for (const file of files) {
    const descriptor = JSON.parse(await readFile(resolve(root, file), 'utf8'));
    const icon = String(descriptor.icon ?? '');
    if (!/^https:\/\//i.test(icon)) continue;
    const owners = icons.get(icon) ?? [];
    owners.push(descriptor.id || file);
    icons.set(icon, owners);
  }

  const reports = [];
  for (const [icon, connectorIds] of icons) {
    try {
      reports.push({ connectorIds, ...(await checkIcon(icon, { timeoutMs })) });
    } catch (error) {
      reports.push({
        connectorIds,
        url: icon,
        ok: false,
        errors: [error instanceof Error ? error.message : String(error)],
      });
    }
  }
  return reports;
}

async function main() {
  const reports = await checkRegistryIcons({ directory: process.argv[2] ?? 'connectors' });
  for (const report of reports) {
    const mark = report.ok ? '✓' : '✗';
    console.log(`${mark} ${report.connectorIds.join(', ')}: ${report.url}`);
    for (const error of report.errors ?? []) console.error(`  - ${error}`);
  }
  if (reports.some((report) => !report.ok)) process.exitCode = 1;
  else console.log(`icon-assets: ${reports.length} 个远程图标均可被 DSH Desktop 嵌入`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`icon-assets: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
