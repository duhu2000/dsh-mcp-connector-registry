import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { assessIconResponse } from '../scripts/check-icon-assets.mjs';

const script = resolve('scripts/build-registry.mjs');

async function fixture() {
  const root = await mkdtemp(resolve(tmpdir(), 'dsh-registry-'));
  const connectors = resolve(root, 'connectors');
  const output = resolve(root, 'catalog.json');
  await mkdir(connectors);
  return { root, connectors, output };
}

function descriptor(id) {
  return {
    schemaVersion: 1,
    id,
    name: id,
    servers: [
      {
        serverKey: 'main',
        serverName: id,
        url: `https://example.com/${id}/mcp`,
      },
    ],
  };
}

test('build-registry sorts connector output deterministically', async (t) => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));
  await writeFile(resolve(paths.connectors, 'zeta.json'), JSON.stringify(descriptor('zeta')));
  await writeFile(resolve(paths.connectors, 'alpha.json'), JSON.stringify(descriptor('alpha')));

  const result = spawnSync(process.execPath, [script, paths.connectors, paths.output], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  const catalog = JSON.parse(await readFile(paths.output, 'utf8'));
  assert.deepEqual(catalog.connectors.map((item) => item.id), ['alpha', 'zeta']);
});

test('build-registry rejects a filename that differs from connector id', async (t) => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));
  await writeFile(resolve(paths.connectors, 'wrong-name.json'), JSON.stringify(descriptor('actual-id')));

  const result = spawnSync(process.execPath, [script, paths.connectors, paths.output], {
    encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /filename must match connector id \(actual-id\.json\)/);
});

test('已上架连接器均使用标准分类且推荐位仅保留关联连接器', async () => {
  const files = (await readdir(resolve('connectors')))
    .filter((file) => file.endsWith('.json') && !file.endsWith('.sample.json'));
  const connectors = await Promise.all(files.map(async (file) => JSON.parse(
    await readFile(resolve('connectors', file), 'utf8'),
  )));
  const standardCategories = new Set([
    '企业数据', '金融投资', '法律合规', '开发工具', '办公协作',
    '调研分析', '设计创意', '效率工具', '其他',
  ]);

  assert.ok(connectors.length >= 10);
  assert.ok(connectors.every((connector) => connector.published === true));
  assert.ok(connectors.every((connector) => standardCategories.has(connector.category)));
  assert.deepEqual(
    connectors.filter((connector) => connector.featured).map((connector) => connector.id).sort(),
    ['pkulaw-legal', 'wind-stock-data'],
  );
});

test('新增官方推荐连接器固定使用已核验的远程 MCP 配置', async () => {
  const readConnector = async (id) => JSON.parse(
    await readFile(resolve('connectors', `${id}.json`), 'utf8'),
  );
  const [github, cloudflare, notion, tavily] = await Promise.all([
    readConnector('github'),
    readConnector('cloudflare-api'),
    readConnector('notion'),
    readConnector('tavily-search'),
  ]);

  assert.equal(github.auth.mode, 'bearer');
  assert.equal(github.servers[0].url, 'https://api.githubcopilot.com/mcp/');
  assert.equal(cloudflare.auth.issuer, 'https://mcp.cloudflare.com');
  assert.equal(cloudflare.auth.tokenEndpointAuthMethod, 'none');
  assert.equal(cloudflare.servers[0].url, 'https://mcp.cloudflare.com/mcp');
  assert.equal(notion.auth.issuer, 'https://mcp.notion.com');
  assert.equal(notion.auth.scope, 'default');
  assert.equal(notion.servers[0].url, 'https://mcp.notion.com/mcp');
  assert.equal(tavily.auth.issuer, 'https://mcp.tavily.com/');
  assert.equal(tavily.auth.scope, 'openid offline_access');
  assert.equal(tavily.servers[0].url, 'https://mcp.tavily.com/mcp');
});

test('盈米连接器使用公开 x-api-key 接入参数且不包含凭据', async () => {
  const connector = JSON.parse(
    await readFile(resolve('connectors/yingmi-wealth-management.json'), 'utf8'),
  );

  assert.equal(connector.auth.mode, 'api-key');
  assert.equal(connector.auth.apiKeyHeader, 'x-api-key');
  assert.equal(connector.servers[0].url, 'https://stargate.yingmi.com/mcp/v2');
  assert.deepEqual(connector.servers[0].headers, {
    Accept: 'application/json, text/event-stream',
  });
  assert.equal(connector.prompts.length, 4);
  assert.equal(connector.toolsSnapshot[0].tools.length, 69);

  const serialized = JSON.stringify(connector);
  assert.doesNotMatch(serialized, /x-api-key\s*[:=]\s*(?!Header)/i);
  assert.doesNotMatch(serialized, /Bearer\s+[A-Za-z0-9._~-]{12,}/i);
});

test('QVeris 连接器使用 Hosted MCP 且付费 call 需明确确认', async () => {
  const connector = JSON.parse(
    await readFile(resolve('connectors/qveris-capability-network.json'), 'utf8'),
  );

  assert.equal(connector.auth.mode, 'bearer');
  assert.equal(connector.name, 'QVerisMCP');
  assert.equal(
    connector.icon,
    'https://raw.githubusercontent.com/duhu2000/dsh-mcp-connector-registry/main/assets/qveris-logo.png',
  );
  assert.equal(connector.servers[0].url, 'https://mcp.qveris.ai/mcp');
  assert.equal(connector.servers[0].transport, 'streamable-http');
  assert.equal(connector.featured, false);
  assert.equal(connector.toolsSnapshot[0].tools.length, 8);
  assert.deepEqual(
    connector.toolsSnapshot[0].tools.map((tool) => tool.name),
    ['discover', 'inspect', 'call', 'usage_history', 'credits_ledger', 'search_tools', 'get_tools_by_ids', 'execute_tool'],
  );
  assert.match(connector.description, /call .*可能消耗 Credits/);
  assert.match(connector.description, /无需启动本地进程/);
  assert.equal(connector.prompts.length, 4);
  assert.ok(connector.prompts.every((prompt) => /(?:不要|未经我确认)/.test(prompt.text)));
  assert.ok(connector.prompts.every((prompt) => !/\bprobe\b/.test(prompt.text)));

  const serialized = JSON.stringify(connector);
  assert.doesNotMatch(serialized, /Bearer\s+[A-Za-z0-9._~-]{12,}/i);
});

test('八爪鱼连接器使用标准 OAuth PKCE 与公开 DCR 元数据', async () => {
  const connector = JSON.parse(
    await readFile(resolve('connectors/bazhuayu-cloud-collection.json'), 'utf8'),
  );

  assert.equal(connector.auth.mode, 'oauth2-pkce');
  assert.equal(connector.auth.issuer, 'https://identity.bazhuayu.com');
  assert.equal(connector.auth.scope, 'openid profile offline_access');
  assert.equal(connector.auth.tokenEndpointAuthMethod, 'none');
  assert.equal(connector.servers[0].url, 'https://mcp.bazhuayu.com/');
  assert.equal(connector.servers[0].serverName, 'bazhuayu');
  assert.equal(connector.featured, false);
  assert.equal(connector.prompts.length, 5);
  assert.equal(connector.toolsSnapshot[0].tools.length, 12);
  assert.ok(connector.toolsSnapshot[0].tools.some((tool) => tool.name === 'get_task_status'));
  assert.ok(connector.toolsSnapshot[0].tools.some((tool) => tool.name === 'describe_ecommerce_dataset'));
  assert.match(connector.description, /OAuth 2\.1 \+ PKCE/);
  assert.match(connector.prompts[0].text, /启动.*确认/);
  assert.match(connector.prompts[4].text, /停止.*确认/);

  const serialized = JSON.stringify(connector);
  assert.doesNotMatch(serialized, /client_secret/i);
  assert.doesNotMatch(serialized, /Bearer\s+[A-Za-z0-9._~-]{12,}/i);
});

test('Seedream 设计创意连接器使用第三方 Hosted MCP 且生成前要求确认', async () => {
  const connector = JSON.parse(
    await readFile(resolve('connectors/seedream-image-generation.json'), 'utf8'),
  );

  assert.equal(connector.vendor, 'Ace Data Cloud');
  assert.equal(connector.category, '设计创意');
  assert.equal(connector.featured, false);
  assert.equal(connector.auth.mode, 'bearer');
  assert.equal(connector.servers[0].url, 'https://seedream.mcp.acedata.cloud/mcp');
  assert.equal(connector.servers[0].transport, 'streamable-http');
  assert.match(connector.description, /第三方/);
  assert.ok(connector.prompts.every((prompt) => /(?:确认|不要生成)/.test(prompt.text)));

  const serialized = JSON.stringify(connector);
  assert.doesNotMatch(serialized, /Bearer\s+[A-Za-z0-9._~-]{12,}/i);
});

test('图标校验拒绝会被 Desktop 拦截的 CORP 响应', () => {
  const blocked = assessIconResponse({
    url: 'https://vendor.example/logo.png',
    status: 200,
    headers: {
      'content-type': 'image/png',
      'cross-origin-resource-policy': 'same-origin',
    },
  });
  assert.equal(blocked.ok, false);
  assert.match(blocked.errors.join('\n'), /same-origin/);

  const compatible = assessIconResponse({
    url: 'https://cdn.example/logo.png',
    status: 200,
    headers: {
      'content-type': 'image/png',
      'cross-origin-resource-policy': 'cross-origin',
      'access-control-allow-origin': '*',
    },
  });
  assert.equal(compatible.ok, true);
});

test('图标校验拒绝非图像响应', () => {
  const report = assessIconResponse({
    url: 'https://vendor.example/logo.png',
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
  assert.equal(report.ok, false);
  assert.match(report.errors.join('\n'), /Content-Type/);
});
