import assert from 'node:assert/strict';
import test from 'node:test';
import {
  detectCredentialExposure,
  parseMcpResponse,
  renderRuntimeAcceptance,
  runRuntimeAcceptance,
} from '../scripts/run-runtime-acceptance.mjs';

function response(message, sessionId = null) {
  return { message, sessionId, rawBody: JSON.stringify(message) };
}

function fakePost(callResult) {
  return async (_url, message) => {
    if (message.method === 'initialize') {
      return response({
        jsonrpc: '2.0',
        id: 1,
        result: { protocolVersion: '2025-06-18', serverInfo: { name: 'safe-data', version: '1.0.0' } },
      }, 'session-value-never-reported');
    }
    if (message.method === 'notifications/initialized') return { message: null, sessionId: null, rawBody: '' };
    if (message.method === 'tools/list') {
      return response({
        jsonrpc: '2.0',
        id: 2,
        result: {
          tools: [{
            name: 'lookup',
            annotations: { readOnlyHint: true, destructiveHint: false },
            inputSchema: { type: 'object' },
          }],
        },
      });
    }
    return response({ jsonrpc: '2.0', id: 3, result: callResult });
  };
}

test('runtime runner saves only a safe summary for an explicit read-only tool', async () => {
  const report = await runRuntimeAcceptance({
    url: 'https://data.example.com/mcp',
    tool: 'lookup',
    args: { query: 'public statistics' },
    checkedAt: '2026-08-30T00:00:00.000Z',
    postImpl: fakePost({ content: [{ type: 'text', text: 'safe public result' }], isError: false }),
  });
  assert.equal(report.decision, 'pass');
  assert.equal(report.credentialScan.status, 'pass');
  assert.equal(report.toolsList.selectedTool.readOnlyHint, true);
  const rendered = renderRuntimeAcceptance(report);
  assert.match(rendered, /Decision: \*\*pass\*\*/);
  assert.doesNotMatch(rendered, /safe public result|session-value-never-reported/);
});

test('runtime runner fails closed when a tool result emits a credential-shaped value', async () => {
  const report = await runRuntimeAcceptance({
    url: 'https://data.example.com/mcp',
    tool: 'lookup',
    postImpl: fakePost({
      content: [{ type: 'text', text: 'API key: svc_anon_abcdefghijklmnopqrstuvwxyz012345' }],
      isError: false,
    }),
  });
  assert.equal(report.decision, 'fail');
  assert.equal(report.credentialScan.status, 'fail');
  assert.deepEqual(report.credentialScan.findings, [
    'credential-shaped api key value',
    'credential-shaped prefixed key',
  ]);
  assert.doesNotMatch(JSON.stringify(report), /svc_anon_/);
});

test('runtime runner refuses secret-bearing arguments and tools without read-only annotations', async () => {
  await assert.rejects(runRuntimeAcceptance({
    url: 'https://data.example.com/mcp',
    tool: 'lookup',
    args: { token: 'svc_live_abcdefghijklmnopqrstuvwxyz012345' },
    postImpl: fakePost({ content: [] }),
  }), /refuses secret-bearing arguments/);

  const postImpl = fakePost({ content: [] });
  await assert.rejects(runRuntimeAcceptance({
    url: 'https://data.example.com/mcp',
    tool: 'missing',
    postImpl,
  }), /not present/);
});

test('MCP parser accepts JSON and event-stream data events', () => {
  assert.equal(parseMcpResponse('{"jsonrpc":"2.0","id":1,"result":{}}').id, 1);
  assert.equal(parseMcpResponse('event: message\ndata: {"jsonrpc":"2.0","id":2,"result":{}}\n\n', 'text/event-stream').id, 2);
});

test('credential detector ignores explicit placeholders but flags concrete bearer values', () => {
  assert.deepEqual(detectCredentialExposure('Authorization: Bearer YOUR_API_KEY'), []);
  assert.deepEqual(detectCredentialExposure('Authorization: Bearer abcdefghijklmnopqrstuvwxyz012345'), [
    'credential-shaped bearer value',
  ]);
});
