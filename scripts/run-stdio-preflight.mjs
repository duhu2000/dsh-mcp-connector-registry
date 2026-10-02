#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { basename, resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { detectCredentialExposure } from './run-runtime-acceptance.mjs';

const PROTOCOL_VERSION = '2025-06-18';
const MAX_STREAM_BYTES = 2_000_000;

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function safeEnvironment(source = process.env) {
  const allowed = ['PATH', 'TMPDIR', 'TMP', 'TEMP', 'LANG', 'LC_ALL', 'LC_CTYPE', 'SYSTEMROOT'];
  return Object.fromEntries(allowed.flatMap((key) => (
    typeof source[key] === 'string' && source[key] ? [[key, source[key]]] : []
  )));
}

function writeJsonLine(stream, message) {
  stream.write(`${JSON.stringify(message)}\n`);
}

function summarizeTool(tool) {
  return {
    name: String(tool?.name ?? '').slice(0, 200),
    title: tool?.title ? String(tool.title).slice(0, 200) : null,
    readOnlyHint: tool?.annotations?.readOnlyHint === true,
    destructiveHint: tool?.annotations?.destructiveHint === true,
  };
}

export async function runStdioPreflight({
  command,
  args = [],
  label = basename(command ?? ''),
  timeoutMs = 30_000,
  reviewer = 'local-runtime-reviewer',
  tool,
  toolArgs = {},
  spawnImpl = spawn,
} = {}) {
  if (!command || typeof command !== 'string') throw new Error('A command is required');
  if (!Array.isArray(args) || args.some((value) => typeof value !== 'string')) throw new Error('args must be strings');
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 120_000) {
    throw new Error('timeoutMs must be an integer from 1000 to 120000');
  }
  if (tool && !/^[A-Za-z0-9_.:-]+$/.test(tool)) throw new Error('tool must be a safe MCP tool name');
  if (!toolArgs || Array.isArray(toolArgs) || typeof toolArgs !== 'object') throw new Error('toolArgs must be an object');
  if (detectCredentialExposure(toolArgs).length > 0) throw new Error('toolArgs appear to contain a credential');

  const child = spawnImpl(command, args, {
    env: safeEnvironment(),
    shell: false,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let stdoutBuffer = '';
  let stderr = '';
  let nonProtocol = '';
  let initialize;
  let toolsList;
  let toolCall = null;

  const result = await new Promise((resolveResult, rejectResult) => {
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      if (!error) {
        const outputFindings = [
          ...detectCredentialExposure(stderr),
          ...detectCredentialExposure(nonProtocol),
        ];
        if (outputFindings.length > 0) {
          error = new Error('stdio server process output contained credential-shaped content');
        }
      }
      settled = true;
      clearTimeout(timer);
      if (!child.killed) child.kill('SIGTERM');
      if (error) rejectResult(error);
      else resolveResult(value);
    };
    const timer = setTimeout(() => finish(new Error(`stdio preflight timed out after ${timeoutMs}ms`)), timeoutMs);

    child.on('error', (error) => finish(error));
    child.on('exit', (code, signal) => {
      if (!settled) finish(new Error(`stdio server exited before tools/list (code ${code ?? 'null'}, signal ${signal ?? 'null'})`));
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
      if (Buffer.byteLength(stderr) > MAX_STREAM_BYTES) finish(new Error('stdio server stderr exceeded the byte limit'));
    });
    child.stdout.on('data', (chunk) => {
      stdoutBuffer += chunk.toString();
      if (Buffer.byteLength(stdoutBuffer) + Buffer.byteLength(nonProtocol) > MAX_STREAM_BYTES) {
        finish(new Error('stdio server stdout exceeded the byte limit'));
        return;
      }
      let newline;
      while ((newline = stdoutBuffer.indexOf('\n')) >= 0) {
        const line = stdoutBuffer.slice(0, newline).trim();
        stdoutBuffer = stdoutBuffer.slice(newline + 1);
        if (!line) continue;
        let message;
        try {
          message = JSON.parse(line);
        } catch {
          nonProtocol += `${line}\n`;
          continue;
        }
        if (message?.id === 1) {
          if (message.error || !message.result) {
            finish(new Error('initialize returned an error or no result'));
            return;
          }
          if (detectCredentialExposure(message.result).length > 0) {
            finish(new Error('initialize contained credential-shaped content'));
            return;
          }
          initialize = message.result;
          writeJsonLine(child.stdin, { jsonrpc: '2.0', method: 'notifications/initialized' });
          writeJsonLine(child.stdin, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
        } else if (message?.id === 2) {
          if (message.error || !Array.isArray(message.result?.tools)) {
            finish(new Error('tools/list returned an error or no tools array'));
            return;
          }
          if (detectCredentialExposure(message.result).length > 0) {
            finish(new Error('tools/list contained credential-shaped content'));
            return;
          }
          toolsList = message.result.tools;
          if (!tool) {
            finish(null, true);
            return;
          }
          if (!toolsList.some((item) => item?.name === tool)) {
            finish(new Error(`Selected tool ${tool} was not present in tools/list`));
            return;
          }
          writeJsonLine(child.stdin, {
            jsonrpc: '2.0', id: 3, method: 'tools/call',
            params: { name: tool, arguments: toolArgs },
          });
        } else if (message?.id === 3) {
          if (message.error || !message.result) {
            finish(new Error('tools/call returned an error or no result'));
            return;
          }
          const serialized = JSON.stringify(message.result);
          const findings = detectCredentialExposure(message.result);
          toolCall = {
            name: tool,
            status: message.result.isError === true ? 'tool-error' : 'success',
            contentTypes: [...new Set((Array.isArray(message.result.content) ? message.result.content : [])
              .map((item) => String(item?.type ?? '').slice(0, 40)).filter(Boolean))].sort(),
            responseSha256: sha256(serialized),
            credentialScan: { status: findings.length === 0 ? 'pass' : 'fail', findings },
          };
          if (toolCall.status !== 'success' || findings.length > 0) {
            finish(new Error('tools/call returned an error or credential-shaped output'));
            return;
          }
          finish(null, true);
          return;
        }
      }
    });

    writeJsonLine(child.stdin, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: 'dsh-registry-stdio-preflight', version: '1.0.0' },
      },
    });
  });

  if (!result || !initialize || !toolsList) throw new Error('stdio preflight did not complete');
  return {
    schemaVersion: 1,
    checkedAt: new Date().toISOString(),
    reviewedBy: String(reviewer).slice(0, 100),
    label: String(label).slice(0, 200),
    protocolVersion: String(initialize.protocolVersion ?? '').slice(0, 40) || null,
    serverInfo: {
      name: String(initialize.serverInfo?.name ?? '').slice(0, 100) || null,
      version: String(initialize.serverInfo?.version ?? '').slice(0, 100) || null,
    },
    tools: toolsList.map(summarizeTool),
    call: toolCall,
    processOutput: {
      stderrBytes: Buffer.byteLength(stderr),
      stderrSha256: sha256(stderr),
      nonProtocolStdoutBytes: Buffer.byteLength(nonProtocol),
      nonProtocolStdoutSha256: sha256(nonProtocol),
    },
    decision: 'pass',
    notes: toolCall
      ? 'initialize, tools/list, and the selected tool call passed. Raw tool content, process output, and tool descriptions were not saved.'
      : 'initialize and tools/list passed. No tools/call was performed; raw process output and tool descriptions were not saved.',
  };
}

function parseArgs(argv) {
  const options = { args: [] };
  const nextValue = (index, option, allowOptionLike = false) => {
    const value = argv[index + 1];
    if (value == null || (!allowOptionLike && value.startsWith('--'))) throw new Error(`${option} requires a value`);
    return value;
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--command') options.command = nextValue(index++, arg);
    else if (arg === '--arg') options.args.push(nextValue(index++, arg, true));
    else if (arg === '--label') options.label = nextValue(index++, arg);
    else if (arg === '--timeout-ms') options.timeoutMs = Number(nextValue(index++, arg));
    else if (arg === '--reviewer') options.reviewer = nextValue(index++, arg);
    else if (arg === '--tool') options.tool = nextValue(index++, arg);
    else if (arg === '--tool-args') {
      try {
        options.toolArgs = JSON.parse(nextValue(index++, arg));
      } catch {
        throw new Error('--tool-args must be a JSON object');
      }
    }
    else if (arg === '--output') options.output = nextValue(index++, arg);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!options.command) throw new Error('--command is required');
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = await runStdioPreflight(options);
  const payload = `${JSON.stringify(report, null, 2)}\n`;
  if (options.output) {
    await writeFile(resolve(options.output), payload, { encoding: 'utf8', mode: 0o600 });
    console.log(`stdio preflight ${report.decision}: ${resolve(options.output)}`);
  } else {
    process.stdout.write(payload);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
