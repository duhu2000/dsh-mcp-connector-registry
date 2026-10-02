import { createInterface } from 'node:readline';

if (process.argv.includes('--emit-secret')) {
  process.stderr.write('api_key=credentialvalueforfixture0123456789\n');
}

const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of lines) {
  const message = JSON.parse(line);
  if (message.method === 'initialize') {
    process.stdout.write(`${JSON.stringify({
      jsonrpc: '2.0',
      id: message.id,
      result: {
        protocolVersion: '2025-06-18',
        capabilities: { tools: {} },
        serverInfo: { name: 'fixture-server', version: '1.0.0' },
      },
    })}\n`);
  } else if (message.method === 'tools/list') {
    process.stdout.write(`${JSON.stringify({
      jsonrpc: '2.0',
      id: message.id,
      result: {
        tools: [{
          name: 'fixture_read',
          description: 'Fixture read tool.',
          inputSchema: { type: 'object', properties: {} },
          annotations: { readOnlyHint: true, destructiveHint: false },
        }],
      },
    })}\n`);
  } else if (message.method === 'tools/call') {
    process.stdout.write(`${JSON.stringify({
      jsonrpc: '2.0',
      id: message.id,
      result: { content: [{ type: 'text', text: 'fixture-result' }] },
    })}\n`);
  }
}
