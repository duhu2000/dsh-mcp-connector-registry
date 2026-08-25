#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const README_START = '<!-- catalog-stats:start -->';
export const README_END = '<!-- catalog-stats:end -->';

function uniqueStrings(value, name) {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string' || !item)) {
    throw new Error(`${name} must be a non-empty string array`);
  }
  if (new Set(value).size !== value.length) throw new Error(`${name} must not contain duplicates`);
  return value;
}

function shanghaiDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function coreStats(stats) {
  const { updatedOn: _updatedOn, ...core } = stats;
  return core;
}

export function calculateCatalogStats(catalog, metadata, { updatedOn } = {}) {
  if (!catalog || catalog.schemaVersion !== 1 || !Array.isArray(catalog.connectors)) {
    throw new Error('catalog must use schemaVersion 1 and contain a connectors array');
  }
  if (!metadata || metadata.schemaVersion !== 1) throw new Error('product metadata must use schemaVersion 1');

  const bundledIds = uniqueStrings(metadata.bundledUniqueConnectorIds, 'bundledUniqueConnectorIds');
  const featuredIds = uniqueStrings(metadata.featuredConnectorIds, 'featuredConnectorIds');
  const categories = uniqueStrings(metadata.categories, 'categories');
  const registryIds = new Set(catalog.connectors.map((connector) => connector.id));
  const duplicatedBundledIds = bundledIds.filter((id) => registryIds.has(id));
  if (duplicatedBundledIds.length > 0) {
    throw new Error(`bundled connector ids are no longer unique: ${duplicatedBundledIds.join(', ')}`);
  }

  const unknownCategories = [...new Set(catalog.connectors.map((connector) => connector.category))]
    .filter((category) => !categories.includes(category));
  if (unknownCategories.length > 0) throw new Error(`catalog uses unknown categories: ${unknownCategories.join(', ')}`);

  const registryFeaturedIds = catalog.connectors
    .filter((connector) => connector.featured === true)
    .map((connector) => connector.id)
    .sort();
  const expectedRegistryFeaturedIds = featuredIds.filter((id) => !bundledIds.includes(id)).sort();
  if (JSON.stringify(registryFeaturedIds) !== JSON.stringify(expectedRegistryFeaturedIds)) {
    throw new Error(`registry featured connectors differ from product metadata: ${registryFeaturedIds.join(', ')}`);
  }

  return {
    schemaVersion: 1,
    registryCount: catalog.connectors.length,
    bundledUniqueCount: bundledIds.length,
    marketCount: catalog.connectors.length + bundledIds.length,
    featuredCount: featuredIds.length,
    categoryCount: categories.length,
    categoryNames: categories,
    updatedOn,
  };
}

export function renderReadmeStats(stats) {
  return `${README_START}\n截至 ${stats.updatedOn}，公共 Registry 已发布 ${stats.registryCount} 条连接器描述；与随包的 ${stats.bundledUniqueCount} 张企查查卡片合并去重后，市场页可浏览 ${stats.marketCount} 张卡片，覆盖${stats.categoryNames.join('、')} ${stats.categoryCount} 类。推荐位严格保留 4 张企查查卡片、北大法宝和 Wind，共 ${stats.featuredCount} 张；其他连接器按业务分类展示。Registry 可独立持续更新，实际数量以客户端刷新后的市场页签徽标和 [catalog-stats.json](catalog-stats.json) 为准。\n${README_END}`;
}

export function replaceMarkedBlock(text, block) {
  const start = text.indexOf(README_START);
  const end = text.indexOf(README_END);
  if (start === -1 || end === -1 || end < start) throw new Error('README catalog stats markers are missing or invalid');
  return `${text.slice(0, start)}${block}${text.slice(end + README_END.length)}`;
}

export async function buildCatalogStats({
  catalogPath = 'catalog.json',
  metadataPath = 'product-metadata.json',
  outputPath = 'catalog-stats.json',
  readmePath = 'README.md',
  today = process.env.CATALOG_STATS_DATE || shanghaiDate(),
} = {}) {
  const [catalog, metadata, readme, previousText] = await Promise.all([
    readFile(resolve(catalogPath), 'utf8').then(JSON.parse),
    readFile(resolve(metadataPath), 'utf8').then(JSON.parse),
    readFile(resolve(readmePath), 'utf8'),
    readFile(resolve(outputPath), 'utf8').catch((error) => (error.code === 'ENOENT' ? null : Promise.reject(error))),
  ]);
  const previous = previousText ? JSON.parse(previousText) : null;
  let stats = calculateCatalogStats(catalog, metadata, { updatedOn: today });
  if (previous && JSON.stringify(coreStats(previous)) === JSON.stringify(coreStats(stats))) {
    stats = { ...stats, updatedOn: previous.updatedOn };
  }
  const statsText = `${JSON.stringify(stats, null, 2)}\n`;
  const readmeText = replaceMarkedBlock(readme, renderReadmeStats(stats));
  await Promise.all([
    writeFile(resolve(outputPath), statsText),
    writeFile(resolve(readmePath), readmeText),
  ]);
  return stats;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildCatalogStats().then((stats) => {
    console.log(`catalog-stats: ${stats.registryCount} registry / ${stats.marketCount} market connectors`);
  }).catch((error) => {
    console.error(`catalog-stats: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
