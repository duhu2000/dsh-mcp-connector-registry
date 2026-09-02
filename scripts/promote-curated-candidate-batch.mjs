#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function requiredString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${label} is required`);
  return value.trim();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readyText(value, label) {
  const text = requiredString(value, label);
  if (/\{\{[^}]+\}\}/.test(text)) throw new Error(`${label} must be ready to use without template placeholders`);
  return text;
}

function exactPair(values, label) {
  if (!Array.isArray(values) || values.length !== 2) throw new Error(`${label} must contain exactly two entries`);
  return values.map((value, index) => readyText(value, `${label}[${index}]`));
}

export function approveCandidateRecord(draft, item, { reviewer, reviewedAt }) {
  const record = clone(draft);
  const id = requiredString(item.id, 'manifest candidate id');
  if (record.id !== id || record.review?.proposedConnectorId !== id) throw new Error(`${id} draft identity does not match the manifest`);
  if (record.registryName !== item.registryName) throw new Error(`${id} registryName does not match the manifest`);
  if (record.review?.decision !== 'pending') throw new Error(`${id} draft review must be pending before promotion`);
  if (record.score?.band !== 'selected' || record.score?.total < 80) throw new Error(`${id} draft must pass the selected score gate`);
  if (record.probe?.status !== 'pass' || record.runtimeAcceptance?.status !== 'pass') throw new Error(`${id} probe and runtime acceptance must pass`);
  if (record.authentication?.mode === 'unknown' || record.license?.status === 'unknown') throw new Error(`${id} authentication and software license must be verified`);
  if (!record.transports?.some((transport) => transport.kind === 'remote' && transport.url === item.endpoint)) {
    throw new Error(`${id} endpoint does not match the reviewed remote transport`);
  }
  record.review = {
    decision: 'approved',
    proposedConnectorId: id,
    reviewedAt: requiredString(reviewedAt, 'reviewedAt'),
    reviewedBy: requiredString(reviewer, 'reviewer'),
    notes: `${reviewer} 已逐项复核 Official Registry 身份、独立或第三方维护边界、公开端点、鉴权、软件许可证或服务条款、上游数据条款提示和脱敏运行报告，批准迁入正式记录并生成 Connector 卡片。`,
  };
  record.runtimeAcceptance.notes = `脱敏预检通过 initialize、tools/list 和只读工具 ${requiredString(item.safeTool, `${id} safeTool`)}；未保存原始响应、会话标识或凭据。维护者 ${reviewer} 已完成来源审核。`;
  record.score.gates = [];
  return record;
}

export function buildConnectorDescriptor(record, item) {
  const id = record.id;
  const name = requiredString(item.proposedTitleZh, `${id} proposedTitleZh`);
  const promptTitles = exactPair(item.promptTitlesZh, `${id} promptTitlesZh`);
  const promptTexts = exactPair(item.starterPromptsZh, `${id} starterPromptsZh`);
  const description = requiredString(item.cardDescriptionZh, `${id} cardDescriptionZh`);
  if (!/(?:独立社区|社区独立|独立项目|独立服务|第三方)/.test(description) || !/(?:并非|不是|非).{0,40}官方/.test(description)) {
    throw new Error(`${id} description must disclose independent or third-party maintenance and non-official status`);
  }
  if (!Array.isArray(item.tagsZh) || item.tagsZh.length < 4) throw new Error(`${id} tagsZh must contain at least four tags`);
  const endpoint = requiredString(item.endpoint, `${id} endpoint`);
  if (record.probe?.targetUrl !== endpoint) throw new Error(`${id} descriptor endpoint drifted from the approved probe`);
  const homepage = item.homepage ?? record.officialLinks?.repository?.url ?? record.officialLinks?.websiteUrl;
  if (!homepage?.startsWith('https://')) throw new Error(`${id} approved repository or website homepage is required`);
  return {
    schemaVersion: 1,
    id,
    name,
    vendor: requiredString(item.vendorZh, `${id} vendorZh`),
    icon: requiredString(item.icon, `${id} icon`),
    category: item.categoryZh ?? '调研分析',
    summary: requiredString(item.cardSummaryZh, `${id} cardSummaryZh`),
    description,
    tags: [...new Set(item.tagsZh.map((tag, index) => requiredString(tag, `${id} tagsZh[${index}]`)))],
    published: true,
    featured: false,
    homepage,
    probeStatus: 'pass',
    probeCheckedAt: Date.parse(record.probe.checkedAt),
    auth: { mode: 'none' },
    servers: [{
      serverKey: 'main',
      serverName: id,
      url: endpoint,
      transport: 'streamable-http',
      headers: { Accept: 'application/json, text/event-stream' },
    }],
    prompts: promptTexts.map((text, index) => ({ title: promptTitles[index], text, server: 'main' })),
  };
}

function parseArgs(argv) {
  const options = {};
  const allowed = ['--manifest', '--drafts', '--records', '--connectors', '--reviewer', '--reviewed-at'];
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!allowed.includes(key)) throw new Error(`Unknown argument: ${key}`);
    options[key.slice(2)] = argv[++index];
  }
  for (const key of allowed.map((value) => value.slice(2))) requiredString(options[key], `--${key}`);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(options['reviewed-at'])) throw new Error('--reviewed-at must be a UTC timestamp ending in Z');
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const manifest = JSON.parse(await readFile(resolve(options.manifest), 'utf8'));
  if (!Array.isArray(manifest.candidates) || manifest.candidates.length < 4 || manifest.candidates.length > 10) {
    throw new Error('Promotion manifest must contain 4 to 10 candidates');
  }
  const outputs = [];
  for (const item of manifest.candidates) {
    const id = requiredString(item.id, 'manifest candidate id');
    const draft = JSON.parse(await readFile(resolve(options.drafts, `${id}.json`), 'utf8'));
    const record = approveCandidateRecord(draft, item, { reviewer: options.reviewer, reviewedAt: options['reviewed-at'] });
    const descriptor = buildConnectorDescriptor(record, item);
    outputs.push({ id, record, descriptor });
  }
  if (new Set(outputs.map((item) => item.id)).size !== outputs.length) throw new Error('Promotion manifest contains duplicate ids');
  await mkdir(resolve(options.records), { recursive: true });
  await mkdir(resolve(options.connectors), { recursive: true });
  for (const output of outputs) {
    await writeFile(resolve(options.records, `${output.id}.json`), `${JSON.stringify(output.record, null, 2)}\n`);
    await writeFile(resolve(options.connectors, `${output.id}.json`), `${JSON.stringify(output.descriptor, null, 2)}\n`);
  }
  console.log(`promoted batch: ${outputs.length} approved records and Connector descriptors`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`promote batch: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
