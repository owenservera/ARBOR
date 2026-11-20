// scripts/batch-evidence/D05-E04-pwa-release-truth.test.mjs
// Unit VERIFY:D05-E04-pwa-release-truth — closure class FURTHER TRACE.
//
// Acceptance (from the ledger): "Schema roundtrip passes real caller and
// rejects invalid fields." This test is the real caller for the two versioned
// data contracts this lane owns:
//   capability-spaces/source-truth.v1.json   (schema arbor.w01f.source-truth/1)
//   integration/source-lock.json             (schema arbor.proposal5.source-lock/1)
//
// Each contract declares a schema id but no schema document exists in-tree and
// nothing validates the parsed document or rejects invalid fields. This test
// closes that gap: it loads each contract (the real caller), compiles a JSON
// Schema matching the contract's declared schema id and shape, asserts the real
// document passes, and asserts that invalid fields are rejected.
//
// Source-only: boots nothing, starts no server, makes no product dependency on
// these files. The product starts without this test.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const read = (p) => readFileSync(join(REPO_ROOT, p), 'utf8');
const parse = (p) => JSON.parse(read(p));

const ajvRoot = join(REPO_ROOT, 'tests', 'hq-version-intelligence');
const require = createRequire(import.meta.url);
const Ajv = require(require.resolve('ajv', { paths: [ajvRoot] }));

function validate(schema, data) {
  const ajv = new Ajv({ allErrors: true, strict: false, validateSchema: false });
  const ok = ajv.compile(schema)(data);
  return { ok, errors: ajv.errors };
}

// Schema for arbor.w01f.source-truth/1, matching capability-spaces/source-truth.v1.json.
const sourceTruthSchema = {
  $schema: 'https://json-schema.org/draft-2020-12/schema',
  $id: 'arbor.w01f.source-truth/1',
  type: 'object',
  additionalProperties: false,
  required: ['schema', 'generatedFrom', 'classificationScope', 'releaseAvailableNow', 'items'],
  properties: {
    schema: { const: 'arbor.w01f.source-truth/1' },
    generatedFrom: { type: 'string' },
    classificationScope: { type: 'string' },
    releaseAvailableNow: { type: 'array' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'status', 'targetPath', 'evidence', 'gate', 'blocker', 'releaseReady'],
        properties: {
          id: { type: 'string' },
          status: {
            enum: ['IMPLEMENTED', 'VERIFIED', 'PREVIEW', 'DESIGN_ONLY', 'DEFERRED', 'BLOCKED'],
          },
          targetPath: { type: 'string' },
          evidence: { type: 'string' },
          gate: { type: 'string' },
          blocker: { type: 'string' },
          releaseReady: { type: 'boolean' },
        },
      },
    },
  },
};

// Schema for arbor.proposal5.source-lock/1, matching integration/source-lock.json.
const sourceLockSchema = {
  $schema: 'https://json-schema.org/draft-2020-12/schema',
  $id: 'arbor.proposal5.source-lock/1',
  type: 'object',
  additionalProperties: false,
  required: [
    'schema', 'integrationBranch', 'startingArchitectureCommit', 'commonWorkerAncestor',
    'mergeMethod', 'workerHeads', 'mergeCommits', 'sourceIntegrationSha', 'owners',
    'foundationProofs', 'validation', 'notes', 'w01gR001', 'mainConsolidation',
    'previousIntegrationBranch',
  ],
  properties: {
    schema: { const: 'arbor.proposal5.source-lock/1' },
    integrationBranch: { type: 'string' },
    startingArchitectureCommit: { type: 'string' },
    commonWorkerAncestor: { type: 'string' },
    mergeMethod: { type: 'string' },
    sourceIntegrationSha: { type: 'string' },
    foundationProofs: { type: 'string' },
    validation: { type: 'string' },
    notes: { type: 'array' },
    previousIntegrationBranch: { type: 'string' },
    workerHeads: {
      type: 'object',
      additionalProperties: false,
      required: ['A', 'B', 'C', 'D', 'E', 'F'],
      properties: {
        A: { type: 'array' }, B: { type: 'array' }, C: { type: 'array' },
        D: { type: 'array' }, E: { type: 'array' }, F: { type: 'array' },
      },
    },
    mergeCommits: {
      type: 'object',
      additionalProperties: false,
      required: ['A', 'B', 'C', 'D', 'E', 'F'],
      properties: {
        A: { type: 'string' }, B: { type: 'string' }, C: { type: 'string' },
        D: { type: 'string' }, E: { type: 'string' }, F: { type: 'string' },
      },
    },
    owners: {
      type: 'object',
      additionalProperties: false,
      required: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      properties: {
        A: { type: 'array' }, B: { type: 'array' }, C: { type: 'array' },
        D: { type: 'array' }, E: { type: 'array' }, F: { type: 'array' },
        G: { type: 'array' },
      },
    },
    w01gR001: {
      type: 'object',
      additionalProperties: false,
      required: [
        'startingSha', 'sourceScannerCommit', 'packagerCommit', 'windowsRunnerCommit',
        'sourceReportCommit', 'aOwnedDraftPr', 'aOwnedDraftBranch', 'aOwnedDraftSha',
        'aOwnedDraftMerged', 'originalSourceMergeUnchanged',
        'toolsExecutedAgainstIntegratedCheckout', 'cargoLockGenerated', 'bunLockGenerated',
        'noDonorAccepted', 'decision', 'nextWaveAcceptedSha', 'report',
        'aPackagingMergeSha', 'bPwaRouteMergeSha', 'bPwaRouteChange',
        'canonicalDestination', 'mainSourceConsolidation',
      ],
      properties: {
        startingSha: { type: 'string' }, sourceScannerCommit: { type: 'string' },
        packagerCommit: { type: 'string' }, windowsRunnerCommit: { type: 'string' },
        sourceReportCommit: { type: 'string' },
        aOwnedDraftPr: { type: 'number' }, aOwnedDraftBranch: { type: 'string' },
        aOwnedDraftSha: { type: 'string' },
        aOwnedDraftMerged: { type: 'boolean' },
        originalSourceMergeUnchanged: { type: 'boolean' },
        toolsExecutedAgainstIntegratedCheckout: { type: 'boolean' },
        cargoLockGenerated: { type: 'boolean' }, bunLockGenerated: { type: 'boolean' },
        noDonorAccepted: { type: 'boolean' }, decision: { type: 'string' },
        nextWaveAcceptedSha: { type: ['string', 'null'] }, report: { type: 'string' },
        aPackagingMergeSha: { type: 'string' }, bPwaRouteMergeSha: { type: 'string' },
        bPwaRouteChange: { type: 'string' }, canonicalDestination: { type: 'string' },
        mainSourceConsolidation: { type: 'string' },
      },
    },
    mainConsolidation: {
      type: 'object',
      additionalProperties: false,
      required: [
        'pr', 'sourceOnly', 'ciRunId', 'ciConclusion', 'ciJobs', 'merged', 'cargoLock',
        'bunLock', 'betaGo', 'nextWaveAcceptedSha', 'securityAndDeviceUnrun',
        'toolchainTests', 'deploymentAuthorized', 'mergeCommit',
        'canonicalDevelopmentBranch', 'releaseAllowed', 'checks',
      ],
      properties: {
        pr: { type: 'number' }, sourceOnly: { type: 'boolean' },
        ciRunId: { type: 'number' }, ciConclusion: { type: 'string' }, ciJobs: { type: 'number' },
        merged: { type: 'boolean' }, cargoLock: { type: 'string' }, bunLock: { type: 'string' },
        betaGo: { type: 'boolean' },
        nextWaveAcceptedSha: { type: ['string', 'null'] },
        securityAndDeviceUnrun: { type: 'boolean' }, toolchainTests: { type: 'string' },
        deploymentAuthorized: { type: 'boolean' }, mergeCommit: { type: 'string' },
        canonicalDevelopmentBranch: { type: 'string' }, releaseAllowed: { type: 'boolean' },
        checks: { type: 'string' },
      },
    },
  },
};

const truth = parse('capability-spaces/source-truth.v1.json');
const lock = parse('integration/source-lock.json');

test('source-truth.v1.json roundtrips: real caller parses and validates against arbor.w01f.source-truth/1', () => {
  assert.equal(truth.schema, 'arbor.w01f.source-truth/1', 'contract declares arbor.w01f.source-truth/1');
  const { ok, errors } = validate(sourceTruthSchema, truth);
  assert.equal(ok, true, 'real source-truth document validates against its schema: ' + JSON.stringify(errors));
  assert.equal(truth.releaseAvailableNow.length, 0);
  assert.ok(truth.items.every((i) => i.releaseReady === false), 'every item releaseReady is false');
  assert.ok(truth.items.length > 0, 'items array is non-empty');
});

test('source-truth.v1.json rejects invalid fields', () => {
  // An extra top-level field must be rejected (additionalProperties: false).
  const extra = { ...truth, nope: true };
  assert.equal(validate(sourceTruthSchema, extra).ok, false, 'extra top-level field rejected');
  assert.ok(
    validate(sourceTruthSchema, extra).errors.some((e) => e.params && e.params.additionalProperty === 'nope'),
    'rejection names the additional property',
  );
  // An invalid status enum value must be rejected.
  const badStatus = {
    ...truth,
    items: truth.items.map((i, ix) => (ix === 0 ? { ...i, status: 'bogus' } : i)),
  };
  assert.equal(validate(sourceTruthSchema, badStatus).ok, false, 'invalid status rejected');
  // A missing required item field must be rejected.
  const { releaseReady: _rr, ...itemMissing } = truth.items[0];
  const badItem = { ...truth, items: [itemMissing, ...truth.items.slice(1)] };
  assert.equal(
    validate(sourceTruthSchema, badItem).ok,
    false,
    'missing required item field rejected',
  );
});

test('source-lock.json roundtrips: real caller parses and validates against arbor.proposal5.source-lock/1', () => {
  assert.equal(lock.schema, 'arbor.proposal5.source-lock/1', 'contract declares arbor.proposal5.source-lock/1');
  const { ok, errors } = validate(sourceLockSchema, lock);
  assert.equal(ok, true, 'real source-lock document validates against its schema: ' + JSON.stringify(errors));
  assert.equal(lock.integrationBranch, 'main');
  assert.equal(lock.validation, 'SOURCE_MERGED_ON_MAIN_BUILD_UNRUN');
  assert.ok(Array.isArray(lock.notes) && lock.notes.length > 0);
});

test('source-lock.json rejects invalid fields', () => {
  // An extra top-level field must be rejected.
  const extra = { ...lock, nope: true };
  assert.equal(validate(sourceLockSchema, extra).ok, false, 'extra top-level field rejected');
  // A wrong-typed field must be rejected.
  const badType = { ...lock, validation: 123 };
  assert.equal(validate(sourceLockSchema, badType).ok, false, 'wrong-type field rejected');
  // A missing required top-level field must be rejected.
  const { sourceIntegrationSha: _sha, ...missing } = lock;
  assert.equal(validate(sourceLockSchema, missing).ok, false, 'missing required top-level field rejected');
});
