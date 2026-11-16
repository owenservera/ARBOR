import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadRoadmap, validateRoadmap, readyFrontier,
  accelerationScore, isIndependentlyAccepted
} from './acceleration-queue.mjs';

const clone = value => JSON.parse(JSON.stringify(value));

function markAccepted(roadmap, id) {
  const item = roadmap.layers.L2.find(x => x.id === id);
  const row = roadmap.buildQueue.find(x => x.itemId === id);
  assert.ok(item && row, 'known task');
  item.status = row.status = 'executed';
  item.verification = row.verification = 'INDEPENDENT_PASS';
  item.ownerAcceptance = row.ownerAcceptance = 'ACCEPTED';
  item.execution = 'EXECUTED';
}

test('R002 canonical schema, 89 baseline + nine work orders, and history survive', () => {
  const data = loadRoadmap();
  const result = validateRoadmap(data);
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(data.layers.L2.length, 98);
  assert.equal(data.buildQueue.length, 9);
  assert.deepEqual(data.buildQueue.map(x => x.itemId),
    ['A00', 'A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08']);
  assert.equal(data.archivedBuildBatches[0].items.length, 3);
  assert.equal(data.layers.L1.find(x => x.id === 'L1-DEMO-LOOP').status, 'active');
});

test('initial ready frontier only includes independent A00, A01 and A02', () => {
  assert.deepEqual(readyFrontier(loadRoadmap()).map(x => x.itemId),
    ['A00', 'A01', 'A02']);
});

test('merely executed, source-wired or UNRUN dependency does not unlock A03', () => {
  const data = clone(loadRoadmap());
  const item = data.layers.L2.find(x => x.id === 'A00');
  const row = data.buildQueue.find(x => x.itemId === 'A00');
  item.status = row.status = 'executed';
  item.execution = 'EXECUTED';
  assert.equal(isIndependentlyAccepted(item), false);
  assert.ok(!readyFrontier(data).some(x => x.itemId === 'A03'));
});

test('independently verified and accepted A00 opens A03, not A05', () => {
  const data = clone(loadRoadmap());
  markAccepted(data, 'A00');
  assert.ok(readyFrontier(data).some(x => x.itemId === 'A03'));
  assert.ok(!readyFrontier(data).some(x => x.itemId === 'A05'));
});

test('A05 requires A01, A02 and A03 all independently accepted', () => {
  const data = clone(loadRoadmap());
  for (const id of ['A01', 'A02']) markAccepted(data, id);
  assert.ok(!readyFrontier(data).some(x => x.itemId === 'A05'));
  markAccepted(data, 'A03');
  assert.ok(readyFrontier(data).some(x => x.itemId === 'A05'));
});

test('false green, duplicate queue and dependency cycles are rejected', () => {
  const base = loadRoadmap();
  const falseGreen = clone(base);
  const a00 = falseGreen.layers.L2.find(x => x.id === 'A00');
  const row00 = falseGreen.buildQueue.find(x => x.itemId === 'A00');
  a00.ownerAcceptance = row00.ownerAcceptance = 'ACCEPTED';
  assert.equal(validateRoadmap(falseGreen).ok, false);

  const duplicate = clone(base);
  duplicate.buildQueue[1].itemId = 'A00';
  assert.equal(validateRoadmap(duplicate).ok, false);

  const cyclic = clone(base);
  const a = cyclic.layers.L2.find(x => x.id === 'A00');
  const q = cyclic.buildQueue.find(x => x.itemId === 'A00');
  a.dependsOn = q.dependsOn = ['A03'];
  assert.equal(validateRoadmap(cyclic).ok, false);
});

test('acceleration score is deterministic and rejects invalid factors', () => {
  const item = loadRoadmap().layers.L2.find(x => x.id === 'A02');
  assert.equal(accelerationScore(item.scoreInputs), 96);
  assert.throws(() => accelerationScore({ downstreamUnlocks: 8 }), /downstreamUnlocks/);
});

test('A00 is keeper-owned machine truth: B lane, priority 1, fixed write scope, no per-item owner field', () => {
  const data = loadRoadmap();
  const a00 = data.layers.L2.find(x => x.id === 'A00');
  const row = data.buildQueue.find(x => x.itemId === 'A00');
  assert.ok(a00 && row, 'A00 present in L2 and queue');
  assert.equal(a00.lane, 'B');
  assert.equal(a00.priority, 1);
  assert.equal(row.lane, 'B');
  assert.equal(row.priority, 1);
  assert.equal(row.order, 1);
  assert.deepEqual(a00.dependsOn, []);
  assert.deepEqual(row.dependsOn, []);
  assert.equal(a00.owner, undefined, 'roadmap item schema has no owner field');
  assert.deepEqual(a00.writeScope, [
    'scripts/batch-evidence/WIKI-BASELINE.mjs',
    'docs/product/roadmap/',
    'integration/beta-gates.json',
    '.integration/proposal5/08-BETA-GATES.json',
    'integration/release-manifest.json'
  ]);
  assert.equal(data.acceleration.roadmapOwner, 'arbor-roadmap keeper (sole canonical roadmap writer after owner-approved batch decision)');
});

test('Batch-1 evidence stays classified separately from A00 execution', () => {
  const data = loadRoadmap();
  const batch = data.archivedBuildBatches.find(b => b.batchId === 'BATCH-1');
  assert.ok(batch, 'BATCH-1 archived evidence retained');
  assert.equal(batch.recordedStatus, 'executed');
  assert.equal(batch.acceptanceStatus, 'OPEN_FINDINGS');
  const byId = new Map(batch.items.map(i => [i.itemId, i]));
  const chat = byId.get('CHAT-BOX-BASELINE');
  const wiki = byId.get('WIKI-BASELINE');
  const rdcb = byId.get('RDCB-BASELINE');
  assert.ok(chat && wiki && rdcb, 'all three Batch-1 baselines present');
  assert.equal(chat.acceptance, 'BASELINE_NARROW_11_OF_11');
  assert.equal(chat.independentKeeperReverification, 'UNRUN');
  assert.equal(wiki.acceptance, 'FAILED_2_OF_10');
  assert.equal(wiki.independentKeeperReverification, 'UNRUN');
  assert.equal(rdcb.acceptance, 'GENERATOR_ONLY_12_OF_12');
  assert.equal(rdcb.independentKeeperReverification, 'UNRUN');
  assert.equal(batch.items.every(i => i.independentKeeperReverification === 'UNRUN'), true);
});
