import { lookup } from 'node:dns/promises';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';
import { canonicalPublicUrl, sanitizeText, scoreCandidate } from './candidate-model.mjs';

export function isPrivateAddress(address) {
  if (!address) return true;
  if (address.includes(':')) {
    const value = address.toLowerCase();
    return value === '::1' || value === '::' || value.startsWith('fc') || value.startsWith('fd')
      || value.startsWith('fe8') || value.startsWith('fe9') || value.startsWith('fea') || value.startsWith('feb');
  }
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) return true;
  return octets[0] === 10
    || octets[0] === 127
    || octets[0] === 0
    || (octets[0] === 169 && octets[1] === 254)
    || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
    || (octets[0] === 192 && octets[1] === 168)
    || (octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127)
    || octets[0] >= 224;
}

export async function publicAddresses(hostname, lookupImpl) {
  if (isIP(hostname)) return [];
  const addresses = await lookupImpl(hostname, { all: true, verbatim: true });
  if (!Array.isArray(addresses) || addresses.length === 0) return [];
  return addresses.every((item) => !isPrivateAddress(item.address)) ? addresses : [];
}

function responseAdapter(status, headers) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {
      get(name) {
        const value = headers[String(name).toLowerCase()];
        return Array.isArray(value) ? value.join(', ') : value ?? null;
      },
    },
  };
}

export function pinnedHttpsPost(targetUrl, addresses, {
  timeoutMs,
  headers,
  body,
  limit = 65_536,
  stopOnRecognized = true,
  requestImpl = httpsRequest,
}) {
  const selected = addresses[0];
  return new Promise((resolve, reject) => {
    let settled = false;
    let timer;
    const finish = (value, error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(value);
    };
    const request = requestImpl(targetUrl, {
      method: 'POST',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(body) },
      lookup(_hostname, options, callback) {
        if (options?.all) callback(null, [selected]);
        else callback(null, selected.address, selected.family);
      },
    }, (response) => {
      const chunks = [];
      let bytes = 0;
      response.on('data', (chunk) => {
        if (settled) return;
        const value = Buffer.from(chunk);
        const remaining = Math.max(0, limit - bytes);
        if (remaining > 0) chunks.push(value.subarray(0, remaining));
        bytes += value.length;
        const text = Buffer.concat(chunks).toString('utf8');
        const recognized = /"jsonrpc"\s*:\s*"2\.0"/.test(text) && /"(?:result|error)"\s*:/.test(text);
        if (bytes >= limit || (stopOnRecognized && recognized)) {
          finish({ response: responseAdapter(response.statusCode ?? 0, response.headers), body: text });
          response.destroy();
        }
      });
      response.on('end', () => finish({
        response: responseAdapter(response.statusCode ?? 0, response.headers),
        body: Buffer.concat(chunks).toString('utf8'),
      }));
      response.on('error', (error) => finish(null, error));
    });
    timer = setTimeout(() => request.destroy(new Error(`Probe timed out after ${timeoutMs}ms`)), timeoutMs);
    request.on('error', (error) => finish(null, error));
    request.end(body);
  });
}

async function readLimitedBody(response, limit = 65_536) {
  if (!response.body?.getReader) return (await response.text()).slice(0, limit);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  while (text.length < limit) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    if (text.length >= limit) {
      await reader.cancel('probe response limit reached');
      break;
    }
  }
  return text.slice(0, limit);
}

function classifyResponse(response, body) {
  const contentType = String(response.headers.get('content-type') ?? '').toLowerCase();
  if (response.status === 401 || response.status === 403) {
    return { status: 'partial', reason: `Endpoint requires authentication (HTTP ${response.status}).` };
  }
  if (response.ok) {
    const jsonRpc = /"jsonrpc"\s*:\s*"2\.0"/.test(body) && /"(?:result|error)"\s*:/.test(body);
    const eventStream = contentType.includes('text/event-stream') && /(?:event:\s*message|"jsonrpc"\s*:)/.test(body);
    if (jsonRpc || eventStream) return { status: 'pass', reason: 'MCP initialize returned a JSON-RPC or event-stream response.' };
    return { status: 'partial', reason: `Initialize returned HTTP ${response.status} without a recognizable MCP body.` };
  }
  if ([400, 405, 406, 415, 422].includes(response.status)) {
    return { status: 'partial', reason: `Endpoint answered initialize with HTTP ${response.status}; manual protocol review is required.` };
  }
  return { status: 'fail', reason: `Endpoint returned HTTP ${response.status}; one failure only creates evidence.` };
}

export async function probeRemoteUrl(url, {
  checkedAt = new Date().toISOString(),
  timeoutMs = 10_000,
  fetchImpl,
  lookupImpl = lookup,
  requestImpl = httpsRequest,
} = {}) {
  const targetUrl = canonicalPublicUrl(url, { stripQuery: true });
  if (!targetUrl) return { status: 'fail', checkedAt, targetUrl: null, httpStatus: null, reason: 'Probe blocked: unsafe public HTTPS URL.' };
  try {
    const addresses = await publicAddresses(new URL(targetUrl).hostname, lookupImpl);
    if (addresses.length === 0) {
      return { status: 'fail', checkedAt, targetUrl, httpStatus: null, reason: 'Probe blocked: DNS did not resolve exclusively to public addresses.' };
    }
    const headers = {
      Accept: 'application/json, text/event-stream',
      'Content-Type': 'application/json',
      'MCP-Protocol-Version': '2025-06-18',
      'User-Agent': 'dsh-mcp-connector-registry-public-probe/1',
    };
    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'dsh-registry-public-probe', version: '1.0.0' },
      },
    });
    let response;
    let responseBody;
    if (fetchImpl) {
      response = await fetchImpl(targetUrl, {
        method: 'POST',
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
        headers,
        body,
      });
      responseBody = await readLimitedBody(response);
    } else {
      ({ response, body: responseBody } = await pinnedHttpsPost(targetUrl, addresses, {
        timeoutMs,
        headers,
        body,
        requestImpl,
      }));
    }
    if (response.status >= 300 && response.status < 400) {
      return { status: 'fail', checkedAt, targetUrl, httpStatus: response.status, reason: 'Probe did not follow the advertised endpoint redirect.' };
    }
    return { ...classifyResponse(response, responseBody), checkedAt, targetUrl, httpStatus: response.status };
  } catch (error) {
    return {
      status: 'fail',
      checkedAt,
      targetUrl,
      httpStatus: null,
      reason: `Probe failed: ${sanitizeText(error instanceof Error ? error.message : String(error), 180)}. One failure never triggers automatic delisting.`,
    };
  }
}

export async function probeCandidate(candidate, options = {}) {
  const target = candidate.transports.find((item) => item.kind === 'remote' && item.url)?.url;
  if (!target) {
    candidate.probe = { status: 'not-run', checkedAt: null, targetUrl: null, httpStatus: null, reason: 'No public remote; automation never executes stdio packages.' };
    return scoreCandidate(candidate);
  }
  candidate.probe = await probeRemoteUrl(target, options);
  candidate.evidence = candidate.evidence.filter((item) => item.type !== 'probe');
  if (candidate.probe.targetUrl) {
    candidate.evidence.push({
      type: 'probe',
      url: candidate.probe.targetUrl,
      collectedAt: candidate.probe.checkedAt,
      summary: `${candidate.probe.status}: ${candidate.probe.reason}`,
    });
  }
  return scoreCandidate(candidate);
}

export async function probeCandidates(candidates, {
  maxProbes = 25,
  minScore = 65,
  onProbe = () => {},
  ...probeOptions
} = {}) {
  const eligible = candidates.filter((candidate) => candidate.classification.isDataService
    && candidate.dedupe.level !== 'strong'
    && candidate.source.status === 'active'
    && candidate.score.total >= minScore
    && candidate.transports.some((item) => item.kind === 'remote' && item.url)).slice(0, maxProbes);
  for (let index = 0; index < eligible.length; index += 1) {
    const candidate = eligible[index];
    await probeCandidate(candidate, probeOptions);
    onProbe({ index: index + 1, total: eligible.length, candidate });
  }
  return eligible;
}
