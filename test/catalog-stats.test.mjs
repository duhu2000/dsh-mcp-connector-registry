import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateCatalogStats,
  renderReadmeStats,
  replaceMarkedBlock,
} from '../scripts/build-catalog-stats.mjs';

const metadata = {
  schemaVersion: 1,
  bundledUniqueConnectorIds: ['qcc-company'],
  featuredConnectorIds: ['qcc-company', 'wind-stock-data'],
  categories: ['企业数据', '金融投资'],
};

const catalog = {
  schemaVersion: 1,
  connectors: [
    { id: 'wind-stock-data', category: '金融投资', featured: true },
    { id: 'another', category: '金融投资', featured: false },
  ],
};

test('catalog stats derives registry and merged marketplace counts', () => {
  const stats = calculateCatalogStats(catalog, metadata, { updatedOn: '2026-08-25' });
  assert.deepEqual(stats, {
    schemaVersion: 1,
    registryCount: 2,
    bundledUniqueCount: 1,
    marketCount: 3,
    featuredCount: 2,
    categoryCount: 2,
    categoryNames: ['企业数据', '金融投资'],
    updatedOn: '2026-08-25',
  });
  assert.match(renderReadmeStats(stats), /Registry 已发布 2 条.*市场页可浏览 3 张/s);
});

test('catalog stats rejects drift in bundled ids, categories, and featured cards', () => {
  assert.throws(
    () => calculateCatalogStats({ ...catalog, connectors: [...catalog.connectors, { id: 'qcc-company', category: '企业数据' }] }, metadata),
    /no longer unique/,
  );
  assert.throws(
    () => calculateCatalogStats({ ...catalog, connectors: [{ id: 'wind-stock-data', category: '未知', featured: true }] }, metadata),
    /unknown categories/,
  );
  assert.throws(
    () => calculateCatalogStats({ ...catalog, connectors: catalog.connectors.map((item) => ({ ...item, featured: false })) }, metadata),
    /featured connectors differ/,
  );
});

test('README replacement requires explicit generated markers', () => {
  const block = renderReadmeStats(calculateCatalogStats(catalog, metadata, { updatedOn: '2026-08-25' }));
  assert.match(replaceMarkedBlock(`before\n<!-- catalog-stats:start -->\nold\n<!-- catalog-stats:end -->\nafter`, block), /before[\s\S]*3 张[\s\S]*after/);
  assert.throws(() => replaceMarkedBlock('no markers', block), /markers are missing/);
});
