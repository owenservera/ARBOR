#!/usr/bin/env node
// ARBOR R002 roadmap validator and deterministic read-only ready frontier.
// This file does NOT authorize or launch workers, write the roadmap, or perform Host effects.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROADMAP_URL = new URL('../../docs/product/roadmap/roadmap.v1.json', import.meta.url);
export const FACTOR_WEIGHTS = Object.freeze({
  downstreamUnlocks: 30,
  crossSystemReuse: 25,
  feedbackSpeed: 20,
  reasoningCostReduction: 15,
  implementationSimplicity: 10
});

export function accelerationScore(inputs, weights = FACTOR_WEIGHTS) {
  if (!inputs || typeof inputs !== 'object') throw new TypeError('score inputs missing');
  return Math.round(Object.entries(weights).reduce((sum, [factor, weight]) => {
    const rating = inputs[factor];
    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      throw new TypeError('factor ' + factor + ' must be an integer 0..5');
    }
    return sum + weight * rating / 5;
  }, 0));
}

export function loadRoadmap(file = ROADMAP_URL) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

export function isIndependentlyAccepted(item) {
  return Boolean(item &&
    item.execution === 'EXECUTED' &&
    item.verification === 'INDEPENDENT_PASS' &&
    item.ownerAcceptance === 'ACCEPTED');
}

export function validateRoadmap(roadmap) {
  const errors = [];
  const assert = (pass, message) => { if (!pass) errors.push(message); };
  if (!roadmap || roadmap.schema !== 'arbor.product-roadmap/1') {
    return { ok: false, errors: ['Unexpected roadmap schema'] };
  }
  const layers = roadmap.layers || {};
  const l2 = Array.isArray(layers.L2) ? layers.L2 : [];
  const queue = Array.isArray(roadmap.buildQueue) ? roadmap.buildQueue : [];
  const accel = roadmap.acceleration || {};
  const byId = new Map();
  for (const item of l2) {
    assert(typeof item.id === 'string' && item.id.length > 0, 'L2 missing ID');
    assert(!byId.has(item.id), 'Duplicate L2 ID ' + item.id);
    byId.set(item.id, item);
  }
  assert(accel.revision === 'R002', 'Acceleration revision must be R002');
  assert(accel.activeBatch === 'ACCEL-A', 'Active batch mismatch');
  assert(Array.isArray(layers.L0) && layers.L0.some(x => x.id === 'L0-DEMO'), 'Missing demo pillar');
  assert(Array.isArray(layers.L0) && layers.L0.some(x => x.id === 'L0-BUILD'), 'Missing build pillar');
  assert(Array.isArray(layers.L0) && layers.L0.some(x => x.id === 'L0-WININSTALL'), 'Missing independent install pillar');
  assert(Array.isArray(layers.L1) && layers.L1.some(x => x.id === 'L1-DEMO-LOOP' && x.status === 'active'), 'Demo loop not active');
  assert(JSON.stringify(accel.scoring?.weights) === JSON.stringify(FACTOR_WEIGHTS), 'Scoring weights drift');
  assert(queue.length > 0 && queue.length <= 9, 'R002 active queue must have 1..9 items');
  assert(Array.isArray(roadmap.archivedBuildBatches) &&
    roadmap.archivedBuildBatches.some(b => b.batchId === 'BATCH-1' && b.items?.length === 3),
    'Batch-1 historical evidence was lost');
  const queueIds = new Set();
  for (let index = 0; index < queue.length; index++) {
    const row = queue[index];
    const item = byId.get(row.itemId);
    assert(!queueIds.has(row.itemId), 'Duplicate queue item ' + row.itemId);
    queueIds.add(row.itemId);
    assert(row.order === index + 1, 'Queue order must be contiguous at ' + row.itemId);
    assert(item != null, 'Queue item missing from L2: ' + row.itemId);
    if (!item) continue;
    assert(item.status === row.status, 'Status mismatch for ' + item.id);
    assert(item.priority === row.priority && row.priority === row.order,
      'Priority mismatch for ' + item.id);
    assert(item.lane === row.lane && ['A', 'B', 'C'].includes(item.lane),
      'Lane mismatch for ' + item.id);
    assert(item.verification === row.verification, 'Verification mismatch ' + item.id);
    assert(item.ownerAcceptance === row.ownerAcceptance, 'Acceptance mismatch ' + item.id);
    assert(Array.isArray(item.acceptance) && item.acceptance.length > 0,
      'Missing executable acceptance contract ' + item.id);
    assert(Array.isArray(item.writeScope) && item.writeScope.length > 0,
      'Missing scoped owner files ' + item.id);
    assert(Array.isArray(item.dependsOn) && Array.isArray(row.dependsOn) &&
      JSON.stringify(item.dependsOn) === JSON.stringify(row.dependsOn),
      'Dependency mismatch for ' + item.id);
    try {
      assert(item.accelerationScore === accelerationScore(item.scoreInputs) &&
        item.accelerationScore === row.accelerationScore,
        'Acceleration score mismatch for ' + item.id);
    } catch (error) {
      errors.push(item.id + ': ' + error.message);
    }
    assert(!isIndependentlyAccepted(item) || item.status === 'executed' || item.status === 'implemented',
      'Accepted but not executed in status: ' + item.id);
    assert(!(item.verification === 'UNRUN' && item.ownerAcceptance === 'ACCEPTED'),
      'False-green acceptance: ' + item.id);
    for (const dep of item.dependsOn || []) {
      assert(dep !== item.id, 'Self-dependency for ' + item.id);
      assert(byId.has(dep), 'Missing dependency ' + dep + ' of ' + item.id);
      assert(queue.some(q => q.itemId === dep), 'Untracked dependency ' + dep + ' of ' + item.id);
    }
  }
  const visiting = new Set();
  const visited = new Set();
  function walk(id) {
    if (visiting.has(id)) { errors.push('Dependency cycle at ' + id); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    const item = byId.get(id);
    for (const dep of item?.dependsOn || []) if (queueIds.has(dep)) walk(dep);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of queueIds) walk(id);
  return {
    ok: errors.length === 0, errors,
    summary: {
      revision: accel.revision,
      activeBatch: accel.activeBatch,
      l2Count: l2.length,
      queueCount: queue.length,
      archivedBatchCount: roadmap.archivedBuildBatches?.length || 0
    }
  };
}

export function readyFrontier(roadmap) {
  const result = validateRoadmap(roadmap);
  if (!result.ok) throw new Error('Invalid roadmap: ' + result.errors.join('; '));
  const byId = new Map(roadmap.layers.L2.map(item => [item.id, item]));
  return roadmap.buildQueue
    .filter(row => ['queued', 'in-progress'].includes(row.status) &&
      row.dependsOn.every(id => isIndependentlyAccepted(byId.get(id))))
    .map(row => ({
      itemId: row.itemId,
      status: row.status,
      priority: row.priority,
      lane: row.lane,
      accelerationScore: row.accelerationScore,
      dependsOn: row.dependsOn,
      verification: row.verification,
      ownerAcceptance: row.ownerAcceptance
    }));
}

function cli() {
  const mode = process.argv[2] || '--ready';
  if (!['--ready', '--check'].includes(mode) || process.argv.length > 3) {
    process.stderr.write('Usage: node scripts/roadmap/acceleration-queue.mjs [--check|--ready]\n');
    process.exitCode = 2;
    return;
  }
  try {
    const roadmap = loadRoadmap();
    const checked = validateRoadmap(roadmap);
    if (!checked.ok) {
      process.stderr.write(JSON.stringify(checked, null, 2) + '\n');
      process.exitCode = 1;
      return;
    }
    const output = mode === '--check'
      ? { ...checked.summary, ok: true, ready: readyFrontier(roadmap).map(x => x.itemId) }
      : { activeBatch: roadmap.acceleration.activeBatch, ready: readyFrontier(roadmap), readOnly: true };
    process.stdout.write(JSON.stringify(output, null, 2) + '\n');
  } catch (error) {
    process.stderr.write('Roadmap check failed: ' + String(error.message || error) + '\n');
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) cli();
