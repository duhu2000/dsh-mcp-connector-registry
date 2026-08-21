#!/usr/bin/env node
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const directory = resolve(process.argv[2] ?? 'connectors');
const output = resolve(process.argv[3] ?? 'catalog.json');
const files = (await readdir(directory))
  .filter((file) => file.endsWith('.json') && !file.endsWith('.sample.json'))
  .sort();

const connectors = [];
for (const file of files) {
  const descriptor = JSON.parse(await readFile(resolve(directory, file), 'utf8'));
  if (!descriptor || Array.isArray(descriptor) || typeof descriptor !== 'object') {
    throw new Error(`${file}: connector descriptor must be an object`);
  }
  connectors.push(descriptor);
}

connectors.sort((a, b) => String(a.id ?? '').localeCompare(String(b.id ?? '')));
await writeFile(output, `${JSON.stringify({ schemaVersion: 1, connectors }, null, 2)}\n`);
console.log(`registry: ${connectors.length} connectors -> ${output}`);
