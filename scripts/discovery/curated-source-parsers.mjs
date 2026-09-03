import { canonicalPackageName, canonicalPublicUrl, sanitizeText } from './candidate-model.mjs';

const ENV_NAME = /^[A-Z][A-Z0-9_]{1,99}$/;
const EXECUTABLE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;
const CREDENTIAL_NAME = /(?:^|[-_])(api[-_]?key|access[-_]?key|token|secret|password|passwd|authorization|auth)(?:$|[-_])/i;
const CREDENTIAL_FLAG = /^(?:--?(?:api[-_]?key|access[-_]?key|token|secret|password|passwd|authorization|auth|headers?|env)|-[HeE])(?:=|$)/i;

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function requiredString(value, name) {
  const normalized = sanitizeText(value, 500);
  if (!normalized) throw new Error(`${name} must be a non-empty string`);
  return normalized;
}

function scanMatching(text, start, open, close) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = start; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (lineComment) {
      if (character === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === '*' && next === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }
    if (character === '/' && next === '*') {
      blockComment = true;
      index += 1;
      continue;
    }
    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      continue;
    }
    if (character === open) depth += 1;
    else if (character === close) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error(`Unterminated ${open}${close} block`);
}

function topLevelObjects(text, start, end) {
  const objects = [];
  let index = start;
  while (index < end) {
    if (text[index] !== '{') {
      index += 1;
      continue;
    }
    const close = scanMatching(text, index, '{', '}');
    if (close > end) throw new Error('Catalog object crosses the declared array boundary');
    objects.push(text.slice(index, close + 1));
    index = close + 1;
  }
  return objects;
}

function propertyStart(block, key) {
  const match = new RegExp(`\\b${key}\\s*:`).exec(block);
  return match ? match.index + match[0].length : -1;
}

function readQuoted(block, key) {
  let index = propertyStart(block, key);
  if (index < 0) return undefined;
  while (/\s/.test(block[index] ?? '')) index += 1;
  const quote = block[index];
  if (quote !== "'" && quote !== '"') throw new Error(`${key} must use a static quoted string`);
  index += 1;
  let value = '';
  let escaped = false;
  for (; index < block.length; index += 1) {
    const character = block[index];
    if (escaped) {
      value += character;
      escaped = false;
    } else if (character === '\\') escaped = true;
    else if (character === quote) return value;
    else value += character;
  }
  throw new Error(`${key} contains an unterminated string`);
}

function readStringArray(block, key) {
  let index = propertyStart(block, key);
  if (index < 0) return [];
  index = block.indexOf('[', index);
  if (index < 0) throw new Error(`${key} must be a static array`);
  const close = scanMatching(block, index, '[', ']');
  const body = block.slice(index + 1, close);
  const values = [];
  for (let cursor = 0; cursor < body.length;) {
    if (body[cursor] !== "'" && body[cursor] !== '"') {
      cursor += 1;
      continue;
    }
    const quote = body[cursor++];
    let value = '';
    let escaped = false;
    for (; cursor < body.length; cursor += 1) {
      const character = body[cursor];
      if (escaped) {
        value += character;
        escaped = false;
      } else if (character === '\\') escaped = true;
      else if (character === quote) {
        cursor += 1;
        break;
      } else value += character;
    }
    values.push(value);
  }
  return values;
}

export function parsePanelCatalog(text) {
  const marker = text.indexOf('export const DEFAULT_CATALOG');
  if (marker < 0) throw new Error('Panel catalog does not export DEFAULT_CATALOG');
  const initializer = text.indexOf('Object.freeze', marker);
  if (initializer < 0) throw new Error('Panel DEFAULT_CATALOG must use the audited Object.freeze initializer');
  const start = text.indexOf('[', initializer);
  if (start < 0) throw new Error('Panel DEFAULT_CATALOG array is missing');
  const end = scanMatching(text, start, '[', ']');
  const entries = topLevelObjects(text, start + 1, end).map((block, index) => ({
    id: requiredString(readQuoted(block, 'id'), `panel entry ${index} id`),
    name: requiredString(readQuoted(block, 'name'), `panel entry ${index} name`),
    description: requiredString(readQuoted(block, 'description'), `panel entry ${index} description`),
    transport: requiredString(readQuoted(block, 'transport'), `panel entry ${index} transport`),
    command: readQuoted(block, 'command'),
    args: readStringArray(block, 'args'),
    url: readQuoted(block, 'url'),
    envKeys: readStringArray(block, 'envKeys'),
    headerKeys: readStringArray(block, 'headerKeys'),
    tags: readStringArray(block, 'tags'),
  }));
  if (entries.length === 0 || entries.length > 100) throw new Error(`Panel catalog entry count ${entries.length} is outside 1-100`);
  return entries;
}

export function parseMarketCatalog(text) {
  const document = JSON.parse(text);
  if (!document || !Array.isArray(document.servers) || document.servers.length === 0 || document.servers.length > 100) {
    throw new Error('Market catalog must contain 1-100 servers');
  }
  if (document.count != null && document.count !== document.servers.length) {
    throw new Error(`Market catalog count ${document.count} does not match ${document.servers.length} servers`);
  }
  return document.servers;
}

export function parseBridgeReadmeVerification(text) {
  const results = new Map();
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\|\s*`([^`]+)`\s*\|[^|]*\|[^|]*\|\s*(.*?)\s*\|\s*$/);
    if (!match) continue;
    const detail = sanitizeText(match[2], 300);
    const toolCount = Number(detail.match(/(\d+)\s+tools?/i)?.[1] ?? NaN);
    results.set(match[1], {
      status: /✅/.test(detail) ? 'PASS' : /⏸/.test(detail) ? 'SKIP' : 'DEFERRED',
      toolCount: Number.isInteger(toolCount) ? toolCount : null,
      reason: detail,
    });
  }
  return results;
}

function cleanPackageSpec(value) {
  const spec = sanitizeText(value, 300);
  if (!spec || spec.startsWith('-')) return null;
  const canonical = canonicalPackageName(spec);
  if (!canonical || (!canonical.startsWith('@') && !/mcp/i.test(canonical))) return null;
  return canonical;
}

function inferPackage(command, args, explicitPackage) {
  const explicit = cleanPackageSpec(explicitPackage);
  if (explicit) return { registry: 'npm', name: explicit };
  const executable = sanitizeText(command, 100).toLowerCase();
  const safeCandidates = [];
  const inputArgs = Array.isArray(args) ? args : [];
  for (let index = 0; index < inputArgs.length; index += 1) {
    const value = sanitizeText(inputArgs[index], 300);
    if (CREDENTIAL_FLAG.test(value)) {
      if (!value.includes('=') && index + 1 < inputArgs.length && !String(inputArgs[index + 1]).startsWith('-')) index += 1;
      continue;
    }
    if (!value.startsWith('-')) safeCandidates.push(value);
  }
  const packageSpec = cleanPackageSpec(safeCandidates[0]);
  if (!packageSpec) return null;
  if (executable === 'npx') return { registry: 'npm', name: packageSpec };
  if (executable === 'uvx') return { registry: 'pypi', name: packageSpec };
  return null;
}

function summarizeStdioArgs(args, packageInfo) {
  const summary = {
    count: args.length,
    flags: [],
    credentialFlags: [],
    positionalValueCount: 0,
    redactedCredentialValueCount: 0,
  };
  for (let index = 0; index < args.length; index += 1) {
    const value = sanitizeText(args[index], 300);
    if (!value) continue;
    if (value.startsWith('-')) {
      const flag = value.split('=', 1)[0].toLowerCase();
      summary.flags.push(flag);
      if (CREDENTIAL_FLAG.test(value)) {
        summary.credentialFlags.push(flag);
        if (value.includes('=')) summary.redactedCredentialValueCount += 1;
        else if (index + 1 < args.length && !String(args[index + 1]).startsWith('-')) {
          summary.redactedCredentialValueCount += 1;
          index += 1;
        }
      }
      continue;
    }
    if (packageInfo && cleanPackageSpec(value)?.toLowerCase() === packageInfo.name.toLowerCase()) continue;
    summary.positionalValueCount += 1;
  }
  summary.flags = unique(summary.flags).sort();
  summary.credentialFlags = unique(summary.credentialFlags).sort();
  return summary;
}

function sanitizeSourceUrl(value) {
  if (value == null || value === '') {
    return {
      url: null, valid: true, localTemplate: false, rejectedUserInfo: false,
      removedQuery: false, removedCredentialQuery: false, removedFragment: false,
    };
  }
  let parsed;
  try {
    parsed = new URL(String(value));
  } catch {
    return {
      url: null, valid: false, localTemplate: false, rejectedUserInfo: false,
      removedQuery: false, removedCredentialQuery: false, removedFragment: false,
    };
  }
  const rejectedUserInfo = Boolean(parsed.username || parsed.password);
  const removedQuery = Boolean(parsed.search);
  const removedCredentialQuery = [...parsed.searchParams.keys()].some((name) => CREDENTIAL_NAME.test(name));
  const removedFragment = Boolean(parsed.hash);
  const hostname = parsed.hostname.toLowerCase();
  const localTemplate = hostname === 'localhost' || hostname === '127.0.0.1';
  if (rejectedUserInfo) {
    return {
      url: null, valid: false, localTemplate, rejectedUserInfo,
      removedQuery, removedCredentialQuery, removedFragment,
    };
  }
  parsed.search = '';
  parsed.hash = '';
  if (localTemplate) {
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        url: null, valid: false, localTemplate, rejectedUserInfo: false,
        removedQuery, removedCredentialQuery, removedFragment,
      };
    }
    parsed.hostname = hostname;
    if ((parsed.protocol === 'https:' && parsed.port === '443') || (parsed.protocol === 'http:' && parsed.port === '80')) parsed.port = '';
    if (parsed.pathname !== '/') parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    return {
      url: parsed.toString(), valid: true, localTemplate, rejectedUserInfo: false,
      removedQuery, removedCredentialQuery, removedFragment,
    };
  }
  const url = canonicalPublicUrl(parsed.toString());
  return {
    url, valid: Boolean(url), localTemplate: false, rejectedUserInfo: false,
    removedQuery, removedCredentialQuery, removedFragment,
  };
}

function verificationFromBridge(entry, readmeVerification) {
  const declared = entry.verify ?? {};
  const note = sanitizeText(declared.note, 500);
  const declaredToolCount = Number(note.match(/(\d+)\s+tools?/i)?.[1] ?? NaN);
  const readme = readmeVerification?.get(entry.serverName);
  const checkedAt = /^\d{4}-\d{2}-\d{2}$/.test(declared.date ?? '') ? `${declared.date}T00:00:00.000Z` : null;
  if (Number.isInteger(declaredToolCount) && Number.isInteger(readme?.toolCount) && declaredToolCount !== readme.toolCount) {
    return {
      status: 'DEFERRED', checkedAt, toolCount: null,
      reason: `Source-internal tool-count drift: definition says ${declaredToolCount}, README says ${readme.toolCount}.`,
    };
  }
  const toolCount = Number.isInteger(declaredToolCount) ? declaredToolCount : readme?.toolCount ?? null;
  if (declared.status === 'verified') return { status: 'PASS', checkedAt, toolCount, reason: note || readme?.reason || 'Source declares a successful runtime verification.' };
  if (declared.status === 'needs-config') {
    const status = /moved|confirm the current package|no longer/i.test(note) ? 'DEFERRED' : 'SKIP';
    return { status, checkedAt, toolCount, reason: note || readme?.reason || 'Source requires configuration before runtime verification.' };
  }
  return { status: readme?.status ?? 'SKIP', checkedAt, toolCount, reason: readme?.reason || 'Source does not persist a runtime verification result.' };
}

function classifyAccess({ id, description, commandRejected, url, urlSanitization, requiredEnvNames, verification, packageInfo, args, argumentSummary }) {
  const text = `${id} ${description} ${verification.reason}`.toLowerCase();
  if (commandRejected) return { mode: 'requires-configuration', reason: 'Source command was not a safe executable name and was discarded.' };
  if (urlSanitization?.rejectedUserInfo || urlSanitization?.valid === false) {
    return { mode: 'requires-configuration', reason: 'Source URL was invalid or contained userinfo; the unsafe value was discarded.' };
  }
  if (urlSanitization?.removedCredentialQuery) return { mode: 'requires-credentials', reason: 'Credential-like URL query parameters were removed; explicit user configuration is required.' };
  if (urlSanitization?.removedQuery) return { mode: 'requires-configuration', reason: 'URL query parameters were removed; endpoint semantics require human review.' };
  if (url) {
    try {
      const hostname = new URL(url).hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') return { mode: 'template', reason: 'Localhost URL is a user template, not a public candidate endpoint.' };
    } catch {
      return { mode: 'requires-configuration', reason: 'Remote URL is not a safe absolute HTTPS endpoint.' };
    }
  }
  if (requiredEnvNames.length > 0) return { mode: 'requires-credentials', reason: `Requires user-supplied environment/header names: ${requiredEnvNames.join(', ')}.` };
  if (argumentSummary?.credentialFlags?.length > 0) return { mode: 'requires-credentials', reason: `Credential argument flags were detected and their values discarded: ${argumentSummary.credentialFlags.join(', ')}.` };
  if (/heavy|download(?:s|ing)? browsers?|chromium|first launch/i.test(text)) return { mode: 'heavy-dependency', reason: 'Source declares a heavy first-run browser dependency.' };
  if (packageInfo?.name === '@modelcontextprotocol/server-filesystem'
    || /edit (?:the )?args|existing root dir|path\/to\/allowed/i.test(text)
    || (args ?? []).some((arg) => /path\/to\/allowed|your[-_/ ]path/i.test(String(arg)))) {
    return { mode: 'requires-configuration', reason: 'A user-selected local path or equivalent runtime configuration is required.' };
  }
  return { mode: 'zero-config', reason: 'No credential, user path, or declared heavy dependency is present in the source definition.' };
}

function sourceVerification(sourceFormat, entry, readmeVerification) {
  if (sourceFormat === 'bridge-json-directory') return verificationFromBridge(entry, readmeVerification);
  return {
    status: 'SKIP', checkedAt: null, toolCount: null,
    reason: 'Source catalog does not persist a timestamped runtime tools/list result.',
  };
}

export function normalizeCuratedSourceEntry(entry, { sourceId, sourceFormat, readmeVerification } = {}) {
  const id = requiredString(entry.id ?? entry.name ?? entry.serverName, `${sourceId} entry id`);
  const title = requiredString(entry.title ?? entry.name ?? entry.serverName, `${sourceId}/${id} title`);
  const rawDescription = typeof entry.description === 'object' ? entry.description.en ?? entry.description.zh : entry.description;
  const description = requiredString(rawDescription, `${sourceId}/${id} description`);
  const transport = requiredString(entry.transport, `${sourceId}/${id} transport`);
  if (!['stdio', 'streamable-http'].includes(transport)) throw new Error(`${sourceId}/${id} uses unsupported transport ${transport}`);
  const declaredCommand = transport === 'stdio' ? requiredString(entry.command, `${sourceId}/${id} command`) : null;
  const command = declaredCommand && EXECUTABLE_NAME.test(declaredCommand) ? declaredCommand : null;
  const commandRejected = Boolean(declaredCommand && !command);
  const args = transport === 'stdio' ? (Array.isArray(entry.args) ? entry.args.map((arg) => sanitizeText(arg, 300)) : []) : [];
  const rawUrl = transport === 'streamable-http' ? entry.url : null;
  const urlSanitization = sanitizeSourceUrl(rawUrl);
  const safeUrl = urlSanitization.url;
  const requiredEnvNames = unique([
    ...(Array.isArray(entry.envKeys) ? entry.envKeys : []),
    ...(Array.isArray(entry.headerKeys) ? entry.headerKeys : []),
    ...(Array.isArray(entry.envHint) ? entry.envHint : []),
    ...(Array.isArray(entry.requiredEnv) ? entry.requiredEnv : []),
  ].map((name) => sanitizeText(name, 100)).filter((name) => ENV_NAME.test(name))).sort();
  const packageInfo = transport === 'stdio' ? inferPackage(command, args, entry.npmPackage) : null;
  const argumentSummary = transport === 'stdio' ? summarizeStdioArgs(args, packageInfo) : null;
  let verification = sourceVerification(sourceFormat, entry, readmeVerification);
  if (rawUrl && (urlSanitization.valid === false || urlSanitization.removedQuery)) {
    verification = {
      ...verification,
      status: 'DEFERRED',
      reason: urlSanitization.valid === false
        ? 'Source URL was invalid or contained userinfo; the unsafe value was discarded pending human review.'
      : 'Source URL query parameters were removed from persisted evidence; endpoint semantics require human review.',
    };
  }
  if (commandRejected) {
    verification = {
      ...verification,
      status: 'DEFERRED',
      reason: 'Source command was not a safe executable name and was discarded pending human review.',
    };
  }
  const homepage = canonicalPublicUrl(entry.homepage, { stripQuery: true });
  const access = classifyAccess({ id, description, commandRejected, url: safeUrl, urlSanitization, requiredEnvNames, verification, packageInfo, args, argumentSummary });
  return {
    entryId: id,
    title,
    description,
    homepage,
    transport,
    command,
    argumentSummary,
    url: safeUrl,
    urlSanitization,
    package: packageInfo,
    requiredEnvNames,
    access,
    verification,
  };
}

export function parseAndNormalizeSource({ format, text, documents, sourceId, readmeText }) {
  const readmeVerification = format === 'bridge-json-directory' ? parseBridgeReadmeVerification(readmeText ?? '') : null;
  let entries;
  if (format === 'panel-typescript') entries = parsePanelCatalog(text);
  else if (format === 'market-json') entries = parseMarketCatalog(text);
  else if (format === 'bridge-json-directory') entries = (documents ?? []).map((document) => JSON.parse(document.text));
  else throw new Error(`Unsupported curated source format: ${format}`);
  return entries.map((entry) => normalizeCuratedSourceEntry(entry, { sourceId, sourceFormat: format, readmeVerification }));
}
