// P2-K PRE-G TEST DRIVER. Test-only, NEVER production runtime or authorization.
// Run after G only when F/B/A provide a synthetic-only, source-bound harness.
// Without a harness, case tests are deliberately SKIPPED, not falsely passed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const negative = JSON.parse(readFileSync(path.join(here, 'negative-cases.json'), 'utf8'));
const delta = JSON.parse(readFileSync(path.join(here, 'source-delta.json'), 'utf8'));
const dag = JSON.parse(readFileSync(path.join(here, 'migration-dag.json'), 'utf8'));
const HEX = /^[a-f0-9]{40}$/;
const HEX64 = /^[a-f0-9]{64}$/;
const CATEGORIES = new Set([
  'ALREADY_IMPORTED', 'TEST_ONLY', 'ADAPTER_REQUIRED',
  'DESIGN_ONLY', 'DEFERRED', 'BLOCKED'
]);

test('P2-K source evidence is exact, typed and not promoted', () => {
  assert.equal(delta.disposition, 'PREPARED_NOT_PROMOTED');
  assert.equal(delta.promotion_allowed, false);
  assert.equal(delta.production_personal_ingest_accepted, false);
  assert.equal(delta.entries.length, 40);
  assert.ok(HEX.test(delta.labs_main));
  const locations = new Set();
  for (const source of delta.entries) {
    assert.ok(CATEGORIES.has(source.classification), source.path);
    assert.ok(HEX.test(source.commit), source.path);
    assert.ok(HEX.test(source.blob_sha), source.path);
    assert.ok(typeof source.owner === 'string' && source.owner.length, source.path);
    const scoped = source.repo + ':' + source.commit + ':' + source.path;
    assert.ok(!locations.has(scoped), scoped);
    locations.add(scoped);
  }
});

test('P2-K DAG is source pinned and contains no cycle or orphan dependency', () => {
  assert.equal(dag.disposition, 'PREPARED_NOT_PROMOTED');
  const nodes = new Map(dag.nodes.map(n => [n.id, n]));
  assert.equal(nodes.size, dag.nodes.length);
  assert.ok(dag.nodes.length >= 10);
  for (const node of dag.nodes) {
    assert.ok(HEX.test(node.commit), node.id);
    assert.ok(HEX.test(node.blob_sha), node.id);
    assert.ok(node.owner, node.id);
  }
  const deps = new Map([...nodes.keys()].map(k => [k, []]));
  for (const edge of dag.edges) {
    assert.ok(nodes.has(edge.from), edge.from);
    assert.ok(nodes.has(edge.to), edge.to);
    deps.get(edge.from).push(edge.to);
  }
  const visiting = new Set(), done = new Set();
  const visit = id => {
    assert.ok(!visiting.has(id), 'DAG cycle: ' + id);
    if (done.has(id)) return;
    visiting.add(id);
    for (const to of deps.get(id)) visit(to);
    visiting.delete(id);
    done.add(id);
  };
  for (const id of nodes.keys()) visit(id);
});

test('P2-K negative cases are complete, synthetic and explicitly UNRUN', () => {
  assert.equal(negative.no_private_input, true);
  assert.equal(negative.no_provider_actions, true);
  assert.ok(negative.cases.length >= 20);
  const ids = new Set();
  for (const scenario of negative.cases) {
    assert.match(scenario.id, /^K-NEG-\d{2}$/);
    assert.ok(!ids.has(scenario.id), scenario.id);
    ids.add(scenario.id);
    assert.equal(scenario.source, 'synthetic_only');
    assert.equal(scenario.execution, 'UNRUN');
    assert.ok(scenario.synthetic_input && scenario.expected && scenario.postcondition);
    assert.ok(scenario.owner);
  }
});

// F/B/A must supply an actual synthetic fixture driver that invokes imported
// owners; never treat a mock driver as acceptance of the Host or Rust boundary.
const harnessFile = process.env.ARBOR_P2K_SYNTHETIC_HARNESS;
let driver = null;
if (harnessFile) {
  const loaded = await import(pathToFileURL(path.resolve(harnessFile)).href);
  if (typeof loaded.createSourceBoundHarness !== 'function') {
    throw new Error('P2K_HARNESS_MISSING_CREATE_SOURCE_BOUND_HARNESS');
  }
  driver = loaded.createSourceBoundHarness;
}
for (const scenario of negative.cases) {
  test(scenario.id + ' — ' + scenario.area, {
    skip: driver ? false : 'POST_G_UNRUN: owner source-bound synthetic harness not installed'
  }, async () => {
    const harness = await driver({ caseId: scenario.id, syntheticOnly: true });
    assert.equal(harness.sourceBound, true, 'must instrument actual imported owner modules');
    assert.equal(harness.hasPrivateData, false);
    const result = await harness.run(scenario);
    assert.equal(result.outcome, scenario.expected);
    assert.equal(result.userDataReads, 0);
    assert.equal(result.providerActions, 0);
    assert.equal(result.crossScopeWrites, 0);
    assert.equal(result.protectedRockDeletes, 0);
    assert.equal(result.unauthorizedCommits, 0);
    if (result.outcome !== 'DUPLICATE_NOOP' && result.outcome !== 'RECONCILE_EXISTING') {
      assert.equal(result.unauthorizedCheckpointAdvance, 0);
    }
  });
}
