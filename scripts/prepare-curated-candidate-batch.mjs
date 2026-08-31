#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { scoreCandidate } from './discovery/candidate-model.mjs';

function requiredString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${label} is required`);
  return value.trim();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function repositorySummary(evidence, summary) {
  return evidence.map((item) => item.type === 'official-repository' ? { ...item, summary } : item);
}

export function prepareCuratedCandidate(sourceCandidate, item, { repositoryBaseUrl, generatedAt }) {
  const candidate = clone(sourceCandidate);
  const id = requiredString(item.id, 'candidate id');
  const probeCheckedAt = requiredString(item.probeCheckedAt, `${id} probeCheckedAt`);
  const runtimeCheckedAt = requiredString(item.runtimeCheckedAt, `${id} runtimeCheckedAt`);
  const runtimeReportPath = requiredString(item.runtimeReportPath, `${id} runtimeReportPath`);
  const endpoint = requiredString(item.endpoint, `${id} endpoint`);
  if (item.probeStatus !== 'pass') throw new Error(`${id} probeStatus must be pass`);
  if (item.runtimeStatus !== 'pass') throw new Error(`${id} runtimeStatus must be pass`);
  if (!runtimeReportPath.startsWith('docs/runtime-acceptance/')) {
    throw new Error(`${id} runtimeReportPath must be under docs/runtime-acceptance/`);
  }
  if (!candidate.transports.some((transport) => transport.kind === 'remote' && transport.url === endpoint)) {
    throw new Error(`${id} endpoint must match a remote transport in the discovery snapshot`);
  }

  candidate.id = id;
  candidate.classification.domains = [...new Set(item.domains ?? candidate.classification.domains)].sort();
  candidate.authentication = {
    mode: 'none',
    requiredHeaders: [],
    reason: requiredString(item.authenticationReason, `${id} authenticationReason`),
  };
  candidate.license = {
    status: 'declared',
    spdxId: requiredString(item.softwareLicenseSpdx, `${id} softwareLicenseSpdx`),
    evidenceUrl: requiredString(item.licenseUrl, `${id} licenseUrl`),
  };
  candidate.probe = {
    status: 'pass',
    checkedAt: probeCheckedAt,
    targetUrl: endpoint,
    httpStatus: 200,
    reason: 'MCP initialize returned a JSON-RPC or event-stream response.',
  };
  candidate.review = {
    decision: 'pending',
    proposedConnectorId: id,
    reviewedAt: null,
    reviewedBy: null,
    notes: requiredString(item.reviewNotes, `${id} reviewNotes`),
  };
  const runtimeReportUrl = `${repositoryBaseUrl.replace(/\/$/, '')}/blob/main/${runtimeReportPath}`;
  candidate.runtimeAcceptance = {
    status: 'pass',
    checkedAt: runtimeCheckedAt,
    reviewedBy: 'codex-preflight',
    reportUrl: runtimeReportUrl,
    notes: `脱敏预检通过 initialize、tools/list 和只读工具 ${requiredString(item.safeTool, `${id} safeTool`)}；未保存原始响应、会话标识或凭据。人工来源批准仍为待办。`,
  };

  candidate.evidence = repositorySummary(candidate.evidence, requiredString(item.repositorySummary, `${id} repositorySummary`));
  candidate.evidence = candidate.evidence.filter((evidence) => !['license', 'probe', 'runtime-acceptance'].includes(evidence.type));
  candidate.evidence.push(
    {
      type: 'official-website',
      url: requiredString(item.upstreamDataUrl, `${id} upstreamDataUrl`),
      collectedAt: generatedAt,
      summary: requiredString(item.upstreamDataSummary, `${id} upstreamDataSummary`),
    },
    {
      type: 'license',
      url: candidate.license.evidenceUrl,
      collectedAt: generatedAt,
      summary: `${candidate.registryName} 源代码声明 ${candidate.license.spdxId}；上游数据授权、署名与使用条款仍需在人工批准时单独复核。`,
    },
    {
      type: 'probe',
      url: candidate.probe.targetUrl,
      collectedAt: probeCheckedAt,
      summary: '公开无用户凭据的 MCP initialize 探测通过，HTTP 200。',
    },
    {
      type: 'runtime-acceptance',
      url: runtimeReportUrl,
      collectedAt: runtimeCheckedAt,
      summary: `自动脱敏预检通过 ${item.safeTool} 只读调用；原始响应正文未落盘。`,
    },
  );
  scoreCandidate(candidate);
  if (candidate.score.band !== 'selected') throw new Error(`${id} did not reach selected after evidence enrichment`);
  candidate.score.gates = ['Human source and service-terms review is still required before a descriptor PR.'];
  return candidate;
}

export function renderBatchSummary(manifest, candidates) {
  const lines = [
    `# ${manifest.title}`,
    '',
    `生成时间：${manifest.generatedAt}`,
    '',
    `Official MCP Registry 快照：${manifest.sourceSnapshot}`,
    '',
    `本批 ${candidates.length} 个候选均已通过公开端点探测和一次明确只读的脱敏运行预检；所有人工审核状态仍为 \`pending\`，本目录不会参与 Connector 目录构建。`,
    '',
    '| 建议中文卡片 | 首个直接提问示例 | 领域 | 分数 | 公开探测 | 运行预检 | 人工审核 |',
    '|---|---|---|---:|---|---|---|',
  ];
  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    const item = manifest.candidates[index];
    const proposedTitleZh = requiredString(item.proposedTitleZh, `${candidate.id} proposedTitleZh`).replaceAll('|', '\\|');
    if (!Array.isArray(item.starterPromptsZh) || item.starterPromptsZh.length !== 2) {
      throw new Error(`${candidate.id} starterPromptsZh must contain exactly two ready-to-use prompts`);
    }
    const firstPrompt = requiredString(item.starterPromptsZh[0], `${candidate.id} starterPromptsZh[0]`).replaceAll('|', '\\|');
    lines.push(`| ${proposedTitleZh}<br><code>${candidate.registryName}</code> | ${firstPrompt} | ${candidate.classification.domains.join(', ')} | ${candidate.score.total} | ${candidate.probe.status} | ${candidate.runtimeAcceptance.status} | ${candidate.review.decision} |`);
  }
  lines.push('', '## 建议的“试试这样用”', '');
  for (const item of manifest.candidates) {
    lines.push(`### ${item.proposedTitleZh}`, '', ...item.starterPromptsZh.map((prompt) => `- ${prompt}`), '');
  }
  lines.push(
    '',
    '## 批次风险与后续门槛',
    '',
    '- 9 个 MCP 均由同一社区维护者 `cyanheads` 发布；虽然数据来自 OECD、IMF、FAO、BLS、NOAA、UniProt、欧盟、OpenStreetMap 和 NWS，仍需评估维护者集中度与长期可用性。',
    '- Apache-2.0 仅证明 MCP 服务端源代码许可；每个上游数据集的授权、署名、使用政策、频率限制与商用边界必须分别复核。',
    '- 卡片必须明确“社区独立维护、非数据机构官方产品”，不得把 Official MCP Registry 收录误写成数据机构官方背书。',
    '- 维护者完成来源和条款审核后，才能填写 `approved`、迁入 `candidates/records/` 并另行准备 Connector 描述符 PR。',
    '',
  );
  return lines.join('\n');
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!['--input', '--manifest', '--output'].includes(key)) throw new Error(`Unknown argument: ${key}`);
    options[key.slice(2)] = argv[++index];
  }
  for (const key of ['input', 'manifest', 'output']) requiredString(options[key], `--${key}`);
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = JSON.parse(await readFile(resolve(options.input), 'utf8'));
  const manifest = JSON.parse(await readFile(resolve(options.manifest), 'utf8'));
  if (!Array.isArray(report.candidates) || !Array.isArray(manifest.candidates)) throw new Error('Input report and manifest must contain candidates arrays');
  if (manifest.candidates.length < 5 || manifest.candidates.length > 10) throw new Error('Curated batch must contain 5 to 10 candidates');
  const names = manifest.candidates.map((item) => requiredString(item.registryName, 'registryName'));
  if (new Set(names).size !== names.length) throw new Error('Curated manifest contains duplicate registry names');
  const sourceByName = new Map(report.candidates.map((candidate) => [candidate.registryName, candidate]));
  const repositoryBaseUrl = requiredString(manifest.repositoryBaseUrl, 'repositoryBaseUrl');
  const generatedAt = requiredString(manifest.generatedAt, 'generatedAt');
  for (const item of manifest.candidates) {
    const reportPath = requiredString(item.runtimeReportPath, `${item.registryName} runtimeReportPath`);
    const runtimeReport = await readFile(resolve(reportPath), 'utf8');
    const expected = [
      '- Decision: **pass**',
      `- Checked at: ${item.runtimeCheckedAt}`,
      `- Endpoint: ${item.endpoint}`,
      `- Safe tool: ${item.safeTool}`,
    ];
    if (expected.some((line) => !runtimeReport.includes(line))) {
      throw new Error(`Runtime report does not match the pass evidence declared for ${item.registryName}`);
    }
  }
  const candidates = manifest.candidates.map((item) => {
    const source = sourceByName.get(item.registryName);
    if (!source) throw new Error(`Candidate not found in discovery report: ${item.registryName}`);
    return prepareCuratedCandidate(source, item, { repositoryBaseUrl, generatedAt });
  });
  const summary = renderBatchSummary(manifest, candidates);
  await mkdir(resolve(options.output), { recursive: true });
  for (const candidate of candidates) {
    await writeFile(resolve(options.output, `${candidate.id}.json`), `${JSON.stringify(candidate, null, 2)}\n`);
  }
  await writeFile(resolve(options.output, 'README.md'), summary);
  console.log(`curated batch: ${candidates.length} pending records -> ${resolve(options.output)} (${basename(options.manifest)})`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`curated batch: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
