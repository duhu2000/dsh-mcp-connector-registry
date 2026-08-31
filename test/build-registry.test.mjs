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

test('第二批连接器覆盖远程 OAuth 与多字段 stdio 凭据映射', async () => {
  const readConnector = async (id) => JSON.parse(
    await readFile(resolve('connectors', `${id}.json`), 'utf8'),
  );
  const batchIds = [
    'amap', 'bocha-search', 'dingtalk', 'figma', 'gitlab',
    'google-calendar', 'langfuse', 'm365', 'mixpanel', 'neon',
    'producthunt', 'slack', 'temporal', 'tushare', 'vercel',
  ];
  const batch = await Promise.all(batchIds.map(readConnector));
  const byId = Object.fromEntries(batch.map((connector) => [connector.id, connector]));

  assert.ok(batch.every((connector) => connector.published === true));
  assert.ok(batch.every((connector) => connector.featured === false));
  assert.ok(batch.every((connector) => connector.probeStatus === 'unverified'));

  assert.equal(byId.gitlab.servers[0].url, 'https://gitlab.com/api/v4/mcp');
  assert.equal(byId.gitlab.auth.tokenEndpointAuthMethod, 'client_secret_basic');
  assert.equal(byId.neon.servers[0].url, 'https://mcp.neon.tech/mcp');
  assert.equal(byId.neon.auth.tokenEndpointAuthMethod, 'client_secret_post');
  assert.equal(byId.figma.auth.scope, 'mcp:connect');
  assert.equal(byId.temporal.servers[0].serverName, 'temporal-docs');

  assert.deepEqual(
    byId.dingtalk.auth.credentialFields.map((field) => field.key),
    ['clientId', 'clientSecret'],
  );
  assert.deepEqual(byId.dingtalk.servers[0].credentialBindings, {
    DINGTALK_Client_ID: 'clientId',
    DINGTALK_Client_Secret: 'clientSecret',
  });
  assert.deepEqual(byId.langfuse.servers[0].credentialBindings, {
    LANGFUSE_PUBLIC_KEY: 'publicKey',
    LANGFUSE_SECRET_KEY: 'secretKey',
    LANGFUSE_BASE_URL: 'baseUrl',
  });
  assert.deepEqual(byId.mixpanel.servers[0].credentialBindings, {
    MIXPANEL_SERVICE_ACCOUNT: 'serviceAccount',
    MIXPANEL_SERVICE_SECRET: 'serviceSecret',
    MIXPANEL_PROJECT_ID: 'projectId',
  });
  assert.deepEqual(byId.m365.servers[0].credentialBindings, {
    M365_CLIENT_ID: 'clientId',
    M365_TENANT_ID: 'tenantId',
  });

  const serialized = JSON.stringify(batch);
  assert.doesNotMatch(serialized, /Bearer\s+[A-Za-z0-9._~-]{12,}/i);
  assert.doesNotMatch(serialized, /(?:api[_-]?key|token|secret)\s*[=:]\s*[A-Za-z0-9._~-]{16,}/i);
});

test('第三批连接器使用可配置传输且不携带真实凭据', async () => {
  const readConnector = async (id) => JSON.parse(
    await readFile(resolve('connectors', `${id}.json`), 'utf8'),
  );
  const batchIds = [
    'eastmoney-mcp', 'feishu', 'financial-modeling', 'gangtise', 'huayu-legal',
    'jenkins', 'line', 'mastergo', 'netease-mail', 'obsidian', 'pixso',
    'polardb', 'qingliu', 'qq-mail', 'stock-analysis', 'tongdaxin-mcp',
    'wecom', 'wolterskluwer',
  ];
  const batch = await Promise.all(batchIds.map(readConnector));
  const byId = Object.fromEntries(batch.map((connector) => [connector.id, connector]));

  assert.equal(batch.length, 18);
  assert.ok(batch.every((connector) => connector.published === true));
  assert.ok(batch.every((connector) => connector.featured === false));
  assert.ok(batch.every((connector) => connector.probeStatus === 'unverified'));

  assert.equal(byId.pixso.auth.apiKeyHeader, 'Token');
  assert.equal(byId.pixso.servers[0].url, 'https://pixso.cn/mcp');
  assert.equal(byId['huayu-legal'].servers.length, 4);
  assert.equal(byId.wolterskluwer.servers[0].url, 'https://mcp.wkinfo.com.cn/mcp-servers/integrated/');
  assert.deepEqual(byId.feishu.servers[0].credentialBindings, {
    APP_ID: 'appId',
    APP_SECRET: 'appSecret',
  });
  assert.equal(byId.obsidian.servers[0].env.OBSIDIAN_READ_ONLY, 'true');
  assert.equal(byId['netease-mail'].servers[0].env.SMTP_HOST, 'smtp.163.com');
  assert.equal(byId['qq-mail'].servers[0].env.SMTP_HOST, 'smtp.qq.com');

  const serialized = JSON.stringify(batch);
  assert.doesNotMatch(serialized, /Bearer\s+[A-Za-z0-9._~-]{12,}/i);
  assert.doesNotMatch(serialized, /(?:api[_-]?key|token|secret)\s*[=:]\s*[A-Za-z0-9._~-]{16,}/i);
});

test('第四批收尾连接器使用官方固定端点并使市场达到验收数量', async () => {
  const readConnector = async (id) => JSON.parse(
    await readFile(resolve('connectors', `${id}.json`), 'utf8'),
  );
  const allFiles = (await readdir(resolve('connectors')))
    .filter((file) => file.endsWith('.json') && !file.endsWith('.sample.json'));
  const batchIds = ['patsnap', 'tencent-docs', 'wps-docs'];
  const batch = await Promise.all(batchIds.map(readConnector));
  const byId = Object.fromEntries(batch.map((connector) => [connector.id, connector]));

  assert.ok(allFiles.length >= 60);
  assert.ok(batch.every((connector) => connector.published === true));
  assert.ok(batch.every((connector) => connector.featured === false));
  assert.ok(batch.every((connector) => connector.probeStatus === 'unverified'));

  assert.equal(byId.patsnap.auth.mode, 'bearer');
  assert.equal(byId.patsnap.servers[0].url, 'https://connect.patsnap.com/1458a4/mcp');
  assert.equal(byId['tencent-docs'].auth.mode, 'api-key');
  assert.equal(byId['tencent-docs'].auth.apiKeyHeader, 'Authorization');
  assert.equal(byId['tencent-docs'].servers[0].url, 'https://docs.qq.com/openapi/mcp');
  assert.equal(byId['wps-docs'].auth.mode, 'bearer');
  assert.equal(
    byId['wps-docs'].servers[0].url,
    'https://openapi.wps.cn/mcp/v2/kso-yundoc/message',
  );

  const serialized = JSON.stringify(batch);
  assert.doesNotMatch(serialized, /Bearer\s+[A-Za-z0-9._~-]{12,}/i);
  assert.doesNotMatch(serialized, /(?:api[_-]?key|token|secret)\s*[=:]\s*[A-Za-z0-9._~-]{16,}/i);
});

test('第六批精选连接器覆盖官方远程 MCP 与安全 stdio 本机配置', async () => {
  const readConnector = async (id) => JSON.parse(
    await readFile(resolve('connectors', `${id}.json`), 'utf8'),
  );
  const allFiles = (await readdir(resolve('connectors')))
    .filter((file) => file.endsWith('.json') && !file.endsWith('.sample.json'));
  const batchIds = [
    'drawio', 'google-analytics', 'minimax-mcp',
    'rcsb-pdb', 'similarweb', 'world-bank-data360',
  ];
  const batch = await Promise.all(batchIds.map(readConnector));
  const byId = Object.fromEntries(batch.map((connector) => [connector.id, connector]));

  assert.ok(allFiles.length >= 78);
  assert.equal(batch.length, 6);
  assert.ok(batch.every((connector) => connector.published === true));
  assert.ok(batch.every((connector) => connector.featured === false));
  assert.deepEqual(
    Object.fromEntries(batch.map((connector) => [connector.id, connector.probeStatus])),
    {
      drawio: 'pass',
      'google-analytics': 'partial',
      'minimax-mcp': 'partial',
      'rcsb-pdb': 'pass',
      similarweb: 'partial',
      'world-bank-data360': 'pass',
    },
  );

  assert.equal(byId.similarweb.auth.mode, 'api-key');
  assert.equal(byId.similarweb.auth.apiKeyHeader, 'api-key');
  assert.equal(byId.similarweb.servers[0].url, 'https://mcp.similarweb.com');
  assert.equal(byId['world-bank-data360'].auth.mode, 'none');
  assert.equal(
    byId['world-bank-data360'].servers[0].url,
    'https://maimcpext.worldbank.org/ext/data360/mcp',
  );
  assert.equal(byId.drawio.servers[0].url, 'https://mcp.draw.io/mcp');
  assert.match(byId.drawio.description, /MCP Apps/);

  assert.equal(byId['rcsb-pdb'].servers[0].command, 'uvx');
  assert.deepEqual(byId['rcsb-pdb'].servers[0].args, ['rcsb-mcp']);
  assert.deepEqual(byId['minimax-mcp'].servers[0].args, ['minimax-mcp', '-y']);
  assert.deepEqual(byId['minimax-mcp'].servers[0].credentialBindings, {
    MINIMAX_API_KEY: 'apiKey',
    MINIMAX_API_HOST: 'apiHost',
  });
  assert.equal(byId['minimax-mcp'].servers[0].env.MINIMAX_API_RESOURCE_MODE, 'url');

  assert.equal(byId['google-analytics'].servers[0].command, 'pipx');
  assert.deepEqual(byId['google-analytics'].servers[0].args, ['run', 'analytics-mcp']);
  assert.deepEqual(byId['google-analytics'].servers[0].credentialBindings, {
    GOOGLE_APPLICATION_CREDENTIALS: 'credentialsPath',
    GOOGLE_PROJECT_ID: 'projectId',
  });
  assert.equal(byId['google-analytics'].servers[0].env.GRPC_DNS_RESOLVER, 'native');
  assert.ok(byId['google-analytics'].auth.credentialFields.every((field) => field.secret === false));
  assert.match(byId['google-analytics'].description, /analytics\.readonly/);

  const serialized = JSON.stringify(batch);
  assert.doesNotMatch(serialized, /Bearer\s+[A-Za-z0-9._~-]{12,}/i);
  assert.doesNotMatch(serialized, /(?:api[_-]?key|token|secret)\s*[=:]\s*[A-Za-z0-9._~-]{16,}/i);
  assert.doesNotMatch(serialized, /-----BEGIN (?:PRIVATE KEY|CERTIFICATE)-----/);
});

test('首批公共数据卡片提供无需填参的差异化示例', async () => {
  const readConnector = async (id) => JSON.parse(
    await readFile(resolve('connectors', `${id}.json`), 'utf8'),
  );
  const [ibge, senate, ilostat] = await Promise.all([
    readConnector('ibge-br-public-data'),
    readConnector('brazil-senate-open-data'),
    readConnector('ilostat-labour-statistics'),
  ]);

  for (const connector of [ibge, senate, ilostat]) {
    assert.equal(connector.promptVariables, undefined);
    assert.equal(connector.prompts.length, 2);
    assert.equal(new Set(connector.prompts.map((prompt) => prompt.text)).size, 2);
    assert.ok(connector.prompts.every((prompt) => !/\{\{?\s*[A-Za-z]/.test(prompt.text)));
  }

  assert.match(ibge.prompts[0].text, /贝洛奥里藏特.*2022/);
  assert.match(ibge.prompts[1].text, /圣保罗.*里约热内卢.*人均 GDP/);
  assert.match(senate.prompts[0].text, /PEC 45\/2019.*立法进程/);
  assert.match(senate.prompts[1].text, /2024.*CEAPS.*支出/);
  assert.match(ilostat.prompts[0].text, /巴西.*2019.*失业率.*劳动参与率/);
  assert.match(ilostat.prompts[1].text, /印度尼西亚.*马来西亚.*青年失业率/);
});

test('研究类卡片提供无需填写研究问题的可直接发送示例', async () => {
  const readConnector = async (id) => JSON.parse(
    await readFile(resolve('connectors', `${id}.json`), 'utf8'),
  );
  const [data360, consensus, rcsb] = await Promise.all([
    readConnector('world-bank-data360'),
    readConnector('consensus'),
    readConnector('rcsb-pdb'),
  ]);

  for (const connector of [data360, consensus, rcsb]) {
    assert.equal(connector.promptVariables, undefined);
    assert.equal(connector.prompts.length, 2);
    assert.equal(new Set(connector.prompts.map((prompt) => prompt.text)).size, 2);
    assert.ok(connector.prompts.every((prompt) => !/\{\{?\s*[A-Za-z]/.test(prompt.text)));
  }

  assert.match(data360.prompts[0].text, /印度尼西亚.*马来西亚.*人均 GDP.*贫困/);
  assert.match(data360.prompts[1].text, /巴西.*印度.*女性劳动参与率.*Vega-Lite/);
  assert.match(consensus.prompts[0].text, /四天工作制.*员工生产率.*同行评审/);
  assert.match(consensus.prompts[1].text, /支持和反驳.*远程办公.*创新表现/);
  assert.match(rcsb.prompts[0].text, /人血红蛋白.*2\.5 Å.*PDB ID/);
  assert.match(rcsb.prompts[1].text, /TP53.*P04637.*实验结构/);
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
