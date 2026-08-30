import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { verifyRuntimeAcceptance } from '../scripts/check-new-connectors.mjs';

function acceptedRecord() {
  return {
    schemaVersion: 1,
    id: 'com-example-approved-data-0123456789',
    registryName: 'com.example/approved-data',
    classification: { isDataService: true },
    source: { kind: 'official-mcp-registry', status: 'active' },
    score: {
      total: 90,
      band: 'selected',
      dimensions: {
        authority: 25,
        accessibility: 25,
        maintenanceSecurity: 15,
        runtime: 15,
        marketGap: 5,
        documentation: 5,
      },
    },
    review: {
      decision: 'approved',
      proposedConnectorId: 'approved-data',
      reviewedAt: '2026-08-30T00:00:00.000Z',
      reviewedBy: 'registry-maintainer',
      notes: 'Official vendor, endpoint, auth, terms, and safety boundaries reviewed.',
    },
    probe: { status: 'pass' },
    authentication: { mode: 'bearer' },
    license: { status: 'not-applicable', evidenceUrl: 'https://example.com/terms' },
    runtimeAcceptance: {
      status: 'pass',
      checkedAt: '2026-08-30T01:00:00.000Z',
      reviewedBy: 'runtime-reviewer',
      reportUrl: 'https://github.com/example/reports/runtime-acceptance.md',
      notes: 'Initialize, tools/list, and a safe read-only tool call passed; credentials were redacted.',
    },
    evidence: [
      { type: 'official-registry', url: 'https://registry.modelcontextprotocol.io/v0.1/servers/com.example%2Fapproved-data/versions/1.0.0' },
      { type: 'license', url: 'https://example.com/terms' },
      { type: 'runtime-acceptance', url: 'https://github.com/example/reports/runtime-acceptance.md' },
    ],
  };
}

test('new Connector acceptance requires human approval and a matching real runtime report', () => {
  assert.deepEqual(verifyRuntimeAcceptance({ id: 'approved-data' }, acceptedRecord()), []);

  const incomplete = acceptedRecord();
  incomplete.review.decision = 'pending';
  incomplete.authentication.mode = 'unknown';
  incomplete.license.status = 'unknown';
  incomplete.runtimeAcceptance.status = 'not-run';
  incomplete.evidence = [];
  const errors = verifyRuntimeAcceptance({ id: 'approved-data' }, incomplete);
  assert.ok(errors.some((error) => /decision must be approved/.test(error)));
  assert.ok(errors.some((error) => /authentication mode/.test(error)));
  assert.ok(errors.some((error) => /license or service-terms/.test(error)));
  assert.ok(errors.some((error) => /runtime acceptance must pass/.test(error)));
  assert.ok(errors.some((error) => /evidence must match/.test(error)));
  assert.ok(errors.some((error) => /Official Registry evidence/.test(error)));
});

test('runtime acceptance gate rejects mismatched IDs, non-HTTPS evidence, and credential-looking values', () => {
  const record = acceptedRecord();
  record.review.proposedConnectorId = 'another-id';
  record.runtimeAcceptance.reportUrl = 'http://example.com/report';
  record.runtimeAcceptance.notes = 'token=abcdefghijklmnopqrstuvwxyz';
  const errors = verifyRuntimeAcceptance({ id: 'approved-data' }, record);
  assert.ok(errors.some((error) => /must match/.test(error)));
  assert.ok(errors.some((error) => /must use HTTPS/.test(error)));
  assert.ok(errors.some((error) => /credential value/.test(error)));
});

test('CI runs the acceptance gate only for newly added Connector descriptors', async () => {
  const workflow = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const template = await readFile(new URL('../.github/PULL_REQUEST_TEMPLATE.md', import.meta.url), 'utf8');
  assert.match(workflow, /fetch-depth: 0/);
  assert.match(workflow, /check-new-connectors\.mjs --base/);
  assert.match(workflow, /github\.event_name == 'pull_request'/);
  assert.match(template, /real runtime acceptance report/);
});
