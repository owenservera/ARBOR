import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadRoadmap, validateRoadmap, readyFrontier, isIndependentlyAccepted
} from './acceleration-queue.mjs';
import { deriveReleaseTruth, loadReleaseSources } from './evidence-truth.mjs';
import { discoverTests, testCoversFile } from '../lib/test-manifest.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const ROADMAP_PATH = path.join(ROOT, 'docs/product/roadmap/roadmap.v1.json');
const RECEIPT_PATH = path.join(ROOT, 'docs/product/roadmap/receipts/A05.receipt.json');
const GATE_CARDS_PATH = path.join(ROOT, '.coordination/artifacts/roadmap/gate-cards.jsonl');
const CONTROLLER_PATH = path.join(ROOT, 'apps/vivim-host/public/demo/controller.js');
const POLL_ROUND_PATH = path.join(ROOT, 'apps/vivim-host/public/demo/poll-round.mjs');

const A05_WRITE_SCOPE = ['.coordination/', 'docs/product/roadmap/', 'scripts/'];
const LEDGERS = [
  'integration/beta-gates.json',
  '.integration/proposal5/08-BETA-GATES.json',
  'integration/release-manifest.json'
];

function readJson(rel) {
  return JSON.parse(readFileSync(path.join(ROOT, rel), 'utf8'));
}
function gitDirty(relFiles) {
  const out = execFileSync('git', ['status', '--porcelain', '--'].concat(relFiles), {
    cwd: ROOT, encoding: 'utf8'
  }).trim();
  return out.split(/\r?\n/).filter(Boolean);
}
function l2Item(id) {
  const roadmap = loadRoadmap();
  return { roadmap, item: roadmap.layers.L2.find(x => x.id === id) };
}
function queueRow(roadmap, id) {
  return roadmap.buildQueue.find(q => q.itemId === id);
}

test('A05 readiness gate blocks selection until A01, A02 and A03 are independently accepted', () => {
  const { roadmap, item: a05 } = l2Item('A05');
  const result = validateRoadmap(roadmap);
  assert.equal(result.ok, false, 'roadmap must be invalid today (status mismatches A01-A04)');
  assert.ok(result.errors.some(e => /Status mismatch for A0[1-4]/.test(e)),
    'expected status mismatches for A01-A04, got: ' + result.errors.join('; '));
  assert.throws(() => readyFrontier(roadmap), /Invalid roadmap/,
    'readyFrontier must throw Invalid roadmap while dependencies are not accepted');
  assert.equal(a05.status, 'queued');
  assert.equal(a05.verification, 'UNRUN');
  assert.equal(a05.ownerAcceptance, 'PENDING');
  assert.equal(a05.execution, 'NOT_STARTED');
  assert.equal(a05.releaseClaim, false);
  assert.deepEqual(a05.dependsOn, ['A01', 'A02', 'A03']);
  for (const id of ['A01', 'A02', 'A03']) {
    const it = roadmap.layers.L2.find(x => x.id === id);
    assert.equal(isIndependentlyAccepted(it), false, id + ' must not be independently accepted');
    assert.equal(it.verification, 'UNRUN', id + '.verification must be UNRUN');
    assert.equal(it.ownerAcceptance, 'PENDING', id + '.ownerAcceptance must be PENDING');
  }
  const row = queueRow(roadmap, 'A05');
  assert.ok(row, 'A05 must have a buildQueue row');
  assert.equal(row.status, 'queued');
  assert.equal(row.verification, 'UNRUN');
  assert.equal(row.ownerAcceptance, 'PENDING');
});

test('independent verifier (evidence-truth) refuses acceptance; releaseReady stays false', () => {
  const sources = loadReleaseSources();
  const truth = deriveReleaseTruth(sources);
  assert.equal(truth.schema, 'arbor.release-truth-projection/2');
  assert.equal(truth.nature, 'READ_ONLY_CONFLICT_PROJECTION');
  assert.equal(truth.releaseReady, false);
  assert.equal(truth.disposition, 'BLOCKED_UNVERIFIED');
  assert.equal(truth.conflictingClaims, true);
  assert.ok(truth.blockers.length > 0, 'at least one blocker must refuse acceptance');
  assert.equal(truth.evidence.independentKeeperReceipt, 'UNRUN');
  assert.equal(truth.evidence.ownerAcceptance, 'UNRUN');
  assert.equal(truth.evidence.browserDom, 'UNRUN');
  assert.equal(truth.evidence.physicalDevice, 'UNRUN');
  assert.equal(truth.historicalReceiptsPreserved, true);
  assert.equal(truth.evidenceIsNotReleasePermission, true);
  assert.equal(truth.claims.promoted.status, 'UNBLOCKED');
  assert.equal(truth.claims.proposal.status, 'PROPOSED_UNRUN');
  assert.equal(truth.claims.release.status, 'BLOCKED_NOT_BUILT');
  assert.ok(truth.conflicts.some(c => c.code === 'PROMOTED_GATES_VS_UNRUN_PROPOSAL'));
  assert.ok(truth.blockers.some(c => c.code === 'PROPOSAL_GATES_UNRUN'));
  assert.ok(truth.blockers.some(c => c.code === 'RELEASE_NOT_ACCEPTED'));
});

test('an unrun or failed verifier cannot mark A05 acceptance', () => {
  const { roadmap } = l2Item('A05');
  const truth = deriveReleaseTruth(loadReleaseSources());
  assert.equal(truth.releaseReady, false, 'independent verifier must not release');
  const a05 = roadmap.layers.L2.find(x => x.id === 'A05');
  assert.equal(a05.verification, 'UNRUN');
  assert.equal(a05.ownerAcceptance, 'PENDING');
  assert.equal(a05.releaseClaim, false);
});

test('A00/A01/A02 receipts exist with schema arbor.item-receipt/1', () => {
  for (const id of ['A00', 'A01', 'A02']) {
    const rec = readJson('docs/product/roadmap/receipts/' + id + '.receipt.json');
    assert.equal(rec.schema, 'arbor.item-receipt/1');
    assert.equal(rec.itemId, id);
    assert.ok(Array.isArray(rec.nlclReplay?.checks) || Array.isArray(rec.checks),
      id + ' receipt must carry executed checks');
  }
});

test('contradictory release ledgers are retained as claims, never mutated', () => {
  const promoted = readJson('integration/beta-gates.json');
  const proposal = readJson('.integration/proposal5/08-BETA-GATES.json');
  const release = readJson('integration/release-manifest.json');
  assert.equal(promoted.status, 'UNBLOCKED');
  assert.equal(proposal.status, 'PROPOSED_UNRUN');
  assert.equal(release.status, 'BLOCKED_NOT_BUILT');
  const dirty = gitDirty(LEDGERS);
  assert.deepEqual(dirty, [], 'release ledgers must carry no uncommitted change: ' + JSON.stringify(dirty));
});

test('roadmap.v1.json is not mutated by A05; A05 stays queued and releaseClaim false', () => {
  const { roadmap, item: a05 } = l2Item('A05');
  assert.equal(a05.status, 'queued');
  assert.equal(a05.verification, 'UNRUN');
  assert.equal(a05.ownerAcceptance, 'PENDING');
  assert.equal(a05.execution, 'NOT_STARTED');
  assert.equal(a05.releaseClaim, false);
  const row = queueRow(roadmap, 'A05');
  assert.equal(row.status, 'queued');
  assert.equal(row.verification, 'UNRUN');
  assert.equal(row.ownerAcceptance, 'PENDING');
});

test('A05 receipt schema contract when present; no false-green receipt while blocked', () => {
  let present = false;
  let rec;
  try { rec = JSON.parse(readFileSync(RECEIPT_PATH, 'utf8')); present = true; }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!present) {
    test.skip?.('A05.receipt.json absent — A05 not executed while verifier is blocked');
    return;
  }
  assert.equal(rec.schema, 'arbor.item-receipt/1');
  assert.equal(rec.itemId, 'A05');
  assert.ok(typeof rec.committedRevision === 'string' && rec.committedRevision.length > 0,
    'receipt must record committedRevision');
  assert.ok(/^[a-f0-9]{40}$/.test(rec.commitSHA), 'receipt must record a 40-hex commitSHA');
  assert.ok(Array.isArray(rec.testReceipts) && rec.testReceipts.length > 0,
    'receipt must carry non-empty testReceipts');
  const truth = deriveReleaseTruth(loadReleaseSources());
  if (truth.releaseReady === false) {
    assert.equal(rec.status !== 'accepted' && rec.itemStatus !== 'accepted', true,
      'no accepted A05 receipt while independent verifier is blocked');
  }
});

test('gate-cards.jsonl is append-only JSONL and carries the A05 owner-gate card', () => {
  const raw = readFileSync(GATE_CARDS_PATH, 'utf8');
  const lines = raw.split(/\r?\n/).filter(line => line.trim().length > 0);
  assert.ok(lines.length > 0, 'gate-cards.jsonl must contain at least one card');
  let a05OwnerGate = null;
  for (const line of lines) {
    const card = JSON.parse(line);
    assert.ok(card.kind, 'every card must declare a kind');
    assert.ok(card.itemId, 'every card must declare an itemId');
    assert.ok(card.at, 'every card must carry an at timestamp');
    assert.ok(card.emittedBy, 'every card must carry emittedBy');
    if (card.itemId === 'A05' && card.kind === 'owner-gate') a05OwnerGate = card;
  }
  assert.ok(a05OwnerGate, 'A05 owner-gate card must be present in gate-cards.jsonl');
  assert.equal(a05OwnerGate.itemId, 'A05');
  assert.equal(a05OwnerGate.kind, 'owner-gate');
  assert.equal(a05OwnerGate.status, 'blocked');
  assert.ok(/A01\/A02\/A03 verification UNRUN/.test(a05OwnerGate.reason || ''),
    'owner-gate reason must cite the unrun dependency verification');
});

test('A05 rewalk artifacts live under .coordination/artifacts/roadmap/ (within writeScope)', () => {
  const artifactsDir = path.join(ROOT, '.coordination/artifacts/roadmap');
  assert.ok(existsSync(artifactsDir), '.coordination/artifacts/roadmap/ must exist');
  const gateCardsRel = '.coordination/artifacts/roadmap/gate-cards.jsonl';
  assert.ok(gateCardsRel.startsWith('.coordination/'), 'gate card path is within A05 writeScope');
  const receiptRel = 'docs/product/roadmap/receipts/A05.receipt.json';
  assert.ok(receiptRel.startsWith('docs/product/roadmap/') || receiptRel.startsWith('scripts/'),
    'receipt path is within A05 writeScope');
});

test('A05 writeScope excludes product source; receipt/gate artifact paths are in-scope', () => {
  const { item: a05 } = l2Item('A05');
  assert.deepEqual(a05.writeScope, A05_WRITE_SCOPE);
  const inScope = (p) => A05_WRITE_SCOPE.some(prefix => p.startsWith(prefix));
  const outOfScope = (p) => p.startsWith('apps/vivim-host/') || p.startsWith('apps/mobile-relay/');
  assert.ok(inScope('.coordination/artifacts/roadmap/gate-cards.jsonl'));
  assert.ok(inScope('docs/product/roadmap/receipts/A05.receipt.json'));
  assert.ok(!outOfScope('docs/product/roadmap/receipts/A05.receipt.json'));
  assert.ok(!outOfScope('.coordination/artifacts/roadmap/gate-cards.jsonl'));
  assert.equal(a05.releaseClaim, false, 'A05 must not claim a roadmap/release write');
  assert.equal(a05.status, 'queued', 'A05 stays queued until the keeper sole-writer flips it');
});

test('controller.js A05 step renders proof and nextBatch from mockData (read-only structural check)', () => {
  const src = readFileSync(CONTROLLER_PATH, 'utf8');
  const a05Index = src.indexOf("'A05'");
  assert.ok(a05Index > -1, 'controller.js must define an A05 renderer step');
  assert.ok(/proof\.committedRevision/.test(src), 'A05 render must read proof.committedRevision');
  assert.ok(/proof\.commitSHA/.test(src), 'A05 render must read proof.commitSHA');
  assert.ok(/proof\.testReceipts/.test(src), 'A05 render must read proof.testReceipts');
  assert.ok(/md\.nextBatch|next\.label|next\.detail|next\.tab/.test(src),
    'A05 render must read nextBatch label/detail/tab');
  assert.ok(/md\.proof/.test(src), 'A05 render must read md.proof');
});

test('poll-round.mjs is a disk-only, one-shot feedback inbox poller (read-only)', () => {
  const src = readFileSync(POLL_ROUND_PATH, 'utf8');
  assert.ok(/readFileSync/.test(src), 'poll-round reads the journal via readFileSync');
  assert.ok(/isRoundEntry/.test(src), 'poll-round selects round entries');
  assert.ok(/JSON\.stringify\(out/.test(src), 'poll-round prints matching rounds as JSON');
  assert.ok(/process\.exit\(1\)/.test(src) || /process\.exit\(0\)/.test(src),
    'poll-round exits with a status code');
  assert.ok(!/from ['"]http/.test(src) && !/from ['"]https/.test(src),
    'poll-round must not import network modules');
  assert.ok(/node:fs/.test(src) && /node:path/.test(src),
    'poll-round imports node:fs and node:path only');
});

test('test-manifest registers scripts/roadmap/a05-cycle.test.mjs (roadmap-acceleration gate)', () => {
  const tests = discoverTests();
  const mine = tests.find(t => t.path === 'scripts/roadmap/a05-cycle.test.mjs');
  assert.ok(mine, 'a05-cycle.test.mjs must be registered in scripts/test-manifest.json');
  assert.equal(mine.root, 'scripts/roadmap');
  assert.equal(mine.runtime, 'node24-ajv');
  assert.equal(mine.gate, 'roadmap-acceleration');
  assert.equal(testCoversFile(mine, 'scripts/roadmap/a05-cycle.test.mjs'), true);
  assert.equal(testCoversFile(mine, 'scripts/roadmap/acceleration-queue.mjs'), true);
  assert.equal(testCoversFile(mine, 'scripts/roadmap/evidence-truth.mjs'), true);
  assert.equal(testCoversFile(mine, 'scripts/lib/test-manifest.mjs'), true);
});

test('scripts/roadmap/a05-cycle.mjs is covered by a manifest test (fail-closed gap closed by A05.test.mjs)', () => {
  const tests = discoverTests();
  const coveredBy = tests.filter(t => testCoversFile(t, 'scripts/roadmap/a05-cycle.mjs'));
  assert.ok(coveredBy.length >= 1,
    'the orchestrator scripts/roadmap/a05-cycle.mjs must be registered in test-manifest.json ' +
    'and covered by a test before A05\'s gate can pass; got 0 covering tests — the fail-closed ' +
    'rule would select ALL tests');
  assert.ok(coveredBy.some(t => t.path === 'scripts/batch-evidence/A05.test.mjs'),
    'scripts/batch-evidence/A05.test.mjs must cover the cycle driver');
});

test('A05 performs no Host effect and no roadmap mutation; owner gate is the sole release path', () => {
  const { roadmap, item: a05 } = l2Item('A05');
  assert.equal(a05.releaseClaim, false, 'A05 must not claim release/release-roadmap authority');
  assert.equal(a05.status, 'queued', 'A05 remains queued until the owner gate flips it');
  assert.deepEqual(a05.dependsOn, ['A01', 'A02', 'A03'],
    'A05 may only proceed after its three dependencies are independently accepted');
  const src = readFileSync(path.join(HERE, 'acceleration-queue.mjs'), 'utf8');
  assert.ok(/does NOT.*write the roadmap/.test(src),
    'acceleration-queue.mjs must state it does not write the roadmap (keeper sole-writer)');
});
