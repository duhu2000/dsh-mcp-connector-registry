import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [workflow, readme, contributing, onboarding] = await Promise.all([
  readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8'),
  readFile(new URL('../README.md', import.meta.url), 'utf8'),
  readFile(new URL('../CONTRIBUTING.md', import.meta.url), 'utf8'),
  readFile(new URL('../docs/ONBOARDING.md', import.meta.url), 'utf8'),
]);

test('CI 分离校验与 main 合并后的 catalog 自动重建', () => {
  assert.match(workflow, /permissions:\s*\n\s+contents: write/);
  assert.match(workflow, /validate:\s*[\s\S]*?- run: npm test[\s\S]*?- run: npm run validate[\s\S]*?- run: npm run assets:check/);
  assert.match(workflow, /rebuild-catalog:/);
  assert.match(workflow, /if: github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /needs: validate/);
  assert.match(workflow, /git diff --quiet -- catalog\.json/);
  assert.match(workflow, /chore: rebuild catalog\.json \[skip ci\]/);
  assert.match(workflow, /git push/);
  assert.match(workflow, /outputs:\s*[\s\S]*?catalog_changed:/);
  assert.match(workflow, /purge-cdn:/);
  assert.match(workflow, /needs: rebuild-catalog/);
  assert.match(workflow, /needs\['rebuild-catalog'\]\.outputs\.catalog_changed == 'true'/);
  assert.match(workflow, /ref: main/);
  assert.match(workflow, /node scripts\/purge-jsdelivr-cache\.mjs catalog\.json/);
  assert.doesNotMatch(workflow, /npm run check/);
  assert.doesNotMatch(workflow, /git diff --exit-code/);
});

test('main 目录变化后自动清理并验证 jsDelivr 缓存', () => {
  assert.match(workflow, /JSDELIVR_VERIFY_ATTEMPTS: 6/);
  assert.match(workflow, /JSDELIVR_VERIFY_DELAY_MS: 2000/);
  assert.match(readme, /自动清理并校验 jsDelivr/);
  assert.match(contributing, /完整 SHA-256/);
  assert.match(onboarding, /purge-cdn/);
});

test('贡献文档使用独立校验命令并说明 catalog 由 CI 生成', () => {
  for (const document of [readme, contributing, onboarding]) {
    assert.match(document, /npm test && npm run validate && npm run assets:check/);
    assert.match(document, /不要手动修改或提交.*`catalog\.json`/s);
  }
  assert.match(readme, /docs\/ONBOARDING\.md/);
  assert.match(contributing, /docs\/ONBOARDING\.md/);
  assert.match(onboarding, /stdio 进程由 `dsh-mcp-client` 管理/);
  assert.match(onboarding, /健康探针不得执行本地 stdio 命令/);
});
