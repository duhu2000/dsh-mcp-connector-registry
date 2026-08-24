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
  assert.doesNotMatch(workflow, /npm run check/);
  assert.doesNotMatch(workflow, /git diff --exit-code/);
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
