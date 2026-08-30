#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { writeFile } from 'node:fs/promises';
import { request as httpsRequest } from 'node:https';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { canonicalPublicUrl, sanitizeText } from './discovery/candidate-model.mjs';
import { pinnedHttpsPost, publicAddresses } from './discovery/public-probe.mjs';

const MAX_RESPONSE_BYTES = 2_000_000;
const PROTOCOL_VERSION = '2025-06-18';

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

function isPlaceholder(value) {
  return /(?:your|example|placeholder|redacted|masked|dummy|sample|xxxx)/i.test(value);
}

export function detectCredentialExposure(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  const findings = new Set();
  const contextual = /\b(Bearer|api[_ -]?key|access[_ -]?token|refresh[_ -]?token|client[_ -]?secret|private[_ -]?key|secret)\b\s*(?:is|[:=])?\s*["']?([A-Za-z0-9._~+\/-]{20,})/gi;
  for (const match of text.matchAll(contextual)) {
    if (!isPlaceholder(match[2])) findings.add(`credential-shaped ${match[1].toLowerCase().replaceAll('_', ' ')} value`);
  }
  const prefixed = /\b([a-z][a-z0-9]{1,15}_(?:(?:live|test|anon|prod)_)?[A-Za-z0-9]{24,})\b/gi;
  for (const match of text.matchAll(prefixed)) {
    if (!isPlaceholder(match[1])) findings.add('credential-shaped prefixed key');
  }
  return [...findings].sort();
}

export function parseMcpResponse(body, contentType = '') {
  const candidates = [];
  if (String(contentType).toLowerCase().includes('text/event-stream')) {
    for (const line of body.split(/\r?\n/)) {
      if (line.startsWith('data:')) candidates.push(line.slice(5).trim());
    }
  } else {
    candidates.push(body.trim());
  }
  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    if (!candidates[index]) continue;
    try {
      return JSON.parse(candidates[index]);
    } catch {
      // Continue to the previous complete SSE data event.
    }
  }
  throw new Error('MCP response did not contain a complete JSON-RPC object');
}

function protocolHeaders(sessionId) {
  return {
    Accept: 'application/json, text/event-stream',
    'Content-Type': 'application/json',
    'MCP-Protocol-Version': PROTOCOL_VERSION,
    'User-Agent': 'dsh-mcp-connector-registry-runtime-acceptance/1',
    ...(sessionId ? { 'mcp-session-id': sessionId } : {}),
  };
}

export async function publicMcpPost(targetUrl, message, {
  timeoutMs = 20_000,
  lookupImpl = lookup,
  requestImpl = httpsRequest,
  sessionId,
} = {}) {
  const safeUrl = canonicalPublicUrl(targetUrl, { stripQuery: true });
  if (!safeUrl) throw new Error('Runtime acceptance requires a public HTTPS endpoint without URL credentials');
  const addresses = await publicAddresses(new URL(safeUrl).hostname, lookupImpl);
  if (addresses.length === 0) throw new Error('Runtime acceptance blocked a private, local, or unresolved endpoint');
  const body = JSON.stringify(message);
  const { response, body: responseBody } = await pinnedHttpsPost(safeUrl, addresses, {
    timeoutMs,
    headers: protocolHeaders(sessionId),
    body,
    limit: MAX_RESPONSE_BYTES,
    stopOnRecognized: false,
    requestImpl,
  });
  if (response.status >= 300 && response.status < 400) throw new Error('Runtime acceptance refuses endpoint redirects');
  if (!response.ok && response.status !== 202) throw new Error(`MCP request returned HTTP ${response.status}`);
  const responseSessionId = response.headers.get('mcp-session-id');
  if (message.method?.startsWith('notifications/')) {
    return { message: null, sessionId: responseSessionId ?? sessionId ?? null, rawBody: responseBody };
  }
  return {
    message: parseMcpResponse(responseBody, response.headers.get('content-type') ?? ''),
    sessionId: responseSessionId ?? sessionId ?? null,
    rawBody: responseBody,
  };
}

function assertJsonRpcSuccess(response, operation) {
  if (!response || response.jsonrpc !== '2.0') throw new Error(`${operation} did not return JSON-RPC 2.0`);
  if (response.error) throw new Error(`${operation} returned a JSON-RPC error`);
  if (!('result' in response)) throw new Error(`${operation} did not return a result`);
  return response.result;
}

function safeServerInfo(value) {
  return {
    name: sanitizeText(value?.name, 100) || null,
    version: sanitizeText(value?.version, 100) || null,
    title: sanitizeText(value?.title, 100) || null,
  };
}

export async function runRuntimeAcceptance({
  url,
  tool,
  args = {},
  checkedAt = new Date().toISOString(),
  reviewer = 'local-runtime-reviewer',
  postImpl = publicMcpPost,
} = {}) {
  const targetUrl = canonicalPublicUrl(url, { stripQuery: true });
  if (!targetUrl) throw new Error('A public HTTPS --url is required');
  if (!/^[A-Za-z0-9_.:-]+$/.test(tool ?? '')) throw new Error('A safe --tool name is required');
  const argumentLeaks = detectCredentialExposure(args);
  if (argumentLeaks.length > 0) throw new Error('Tool arguments appear to contain a credential; runtime acceptance refuses secret-bearing arguments');

  const initializeRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: 'dsh-registry-runtime-acceptance', version: '1.0.0' },
    },
  };
  const initialized = await postImpl(targetUrl, initializeRequest);
  const initializeResult = assertJsonRpcSuccess(initialized.message, 'initialize');
  let sessionId = initialized.sessionId;
  await postImpl(targetUrl, { jsonrpc: '2.0', method: 'notifications/initialized' }, { sessionId });

  const listed = await postImpl(targetUrl, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }, { sessionId });
  sessionId = listed.sessionId ?? sessionId;
  const toolsResult = assertJsonRpcSuccess(listed.message, 'tools/list');
  const tools = Array.isArray(toolsResult.tools) ? toolsResult.tools : [];
  const selected = tools.find((item) => item?.name === tool);
  if (!selected) throw new Error(`Selected tool ${tool} was not present in tools/list`);
  if (selected.annotations?.readOnlyHint !== true || selected.annotations?.destructiveHint === true) {
    throw new Error(`Selected tool ${tool} is not explicitly read-only and non-destructive`);
  }

  const called = await postImpl(targetUrl, {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: { name: tool, arguments: args },
  }, { sessionId });
  const callResult = assertJsonRpcSuccess(called.message, 'tools/call');
  const findings = detectCredentialExposure(callResult);
  const toolError = callResult?.isError === true;
  const passed = findings.length === 0 && !toolError;
  const contentTypes = [...new Set((Array.isArray(callResult?.content) ? callResult.content : [])
    .map((item) => sanitizeText(item?.type, 40)).filter(Boolean))].sort();

  return {
    schemaVersion: 1,
    checkedAt,
    reviewedBy: sanitizeText(reviewer, 100),
    targetUrl,
    protocolVersion: sanitizeText(initializeResult?.protocolVersion, 40) || null,
    serverInfo: safeServerInfo(initializeResult?.serverInfo),
    toolsList: {
      count: tools.length,
      selectedTool: {
        name: tool,
        readOnlyHint: selected.annotations?.readOnlyHint === true,
        destructiveHint: selected.annotations?.destructiveHint === true,
      },
    },
    call: {
      status: toolError ? 'tool-error' : 'success',
      contentTypes,
      responseSha256: digest(called.rawBody),
    },
    credentialScan: {
      status: findings.length === 0 ? 'pass' : 'fail',
      findings,
    },
    decision: passed ? 'pass' : 'fail',
    notes: passed
      ? 'Initialize, tools/list, and one explicitly read-only tool call passed. Raw response content was not saved.'
      : 'Acceptance failed because the tool returned an error or credential-shaped output. Raw response content was not saved.',
  };
}

export function renderRuntimeAcceptance(report) {
  return `# MCP runtime acceptance\n\n`
    + `- Checked at: ${report.checkedAt}\n`
    + `- Reviewer: ${report.reviewedBy}\n`
    + `- Endpoint: ${report.targetUrl}\n`
    + `- Server: ${report.serverInfo.name ?? 'unknown'} ${report.serverInfo.version ?? ''}\n`
    + `- Protocol: ${report.protocolVersion ?? 'unknown'}\n`
    + `- Tools listed: ${report.toolsList.count}\n`
    + `- Safe tool: ${report.toolsList.selectedTool.name}\n`
    + `- Tool result: ${report.call.status}\n`
    + `- Response SHA-256: ${report.call.responseSha256}\n`
    + `- Credential scan: ${report.credentialScan.status}\n`
    + `- Decision: **${report.decision}**\n\n`
    + `${report.notes}\n\n`
    + `Raw MCP response bodies, session identifiers, and credentials are intentionally omitted.\n`;
}

function parseCliArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) throw new Error(`Unknown argument: ${arg}`);
    const key = arg.slice(2);
    if (!['url', 'tool', 'args', 'output', 'reviewer'].includes(key)) throw new Error(`Unknown option: ${arg}`);
    if (!argv[index + 1] || argv[index + 1].startsWith('--')) throw new Error(`${arg} requires a value`);
    values[key] = argv[index + 1];
    index += 1;
  }
  return values;
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2));
  let args = {};
  if (options.args) {
    try {
      args = JSON.parse(options.args);
    } catch {
      throw new Error('--args must be a JSON object');
    }
    if (!args || Array.isArray(args) || typeof args !== 'object') throw new Error('--args must be a JSON object');
  }
  const report = await runRuntimeAcceptance({
    url: options.url,
    tool: options.tool,
    args,
    reviewer: options.reviewer,
  });
  const markdown = renderRuntimeAcceptance(report);
  if (options.output) {
    await writeFile(resolve(options.output), markdown, { encoding: 'utf8', mode: 0o600 });
    console.log(`runtime acceptance ${report.decision}: ${resolve(options.output)}`);
  } else {
    process.stdout.write(markdown);
  }
  if (report.decision !== 'pass') process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
