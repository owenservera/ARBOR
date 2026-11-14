// Source-level W1 integration fence: not a substitute for real Host, CI, browser or device tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = rel => readFileSync(path.join(ROOT, rel), 'utf8');
const server = read('apps/vivim-host/server.mjs');
const wiki = read('apps/vivim-host/public/pages/wiki.js');
const runner = read('scripts/acceleration/live-host-check.mjs');
const evidence = read('scripts/batch-evidence/WIKI-BASELINE.mjs');
const compiler = read('scripts/feedback-loop/compiler.mjs');
const roadmap = JSON.parse(read('docs/product/roadmap/roadmap.v1.json'));

test('Host is the sole guarded product journal mutation authority', () => {
  assert.match(server, /createProductJournal/);
  assert.match(server, /verifyOwnerToken\(req\.headers\.authorization, owner\)/);
  assert.match(server, /uiSessions\.authorized\(req, \{ mutate: true \}\)/);
  assert.match(server, /x-vivim-control/);
  assert.match(server, /OWNER_AUTH/);
});
test('Wiki editor consumes native owner session and uses CSRF with same-origin cookie', () => {
  assert.match(wiki, /\/api\/host\/control\/ui-state/);
  assert.match(wiki, /\/api\/host\/control\/ui-exchange/);
  assert.match(wiki, /'x-vivim-ui-csrf': csrf/);
  assert.match(wiki, /credentials: 'same-origin'/);
  assert.match(wiki, /if \(result\.status === 401\) ownerCsrf = null/);
  assert.doesNotMatch(wiki, /Bearer |VIVIM_BOOTSTRAP_TOKEN|ownerTokenPath/);
});
test('isolated runner issues an ephemeral bearer only to the isolated Host and evidence child', () => {
  assert.match(runner, /randomBytes\(32\)\.toString\('hex'\)/);
  assert.match(runner, /ownerToken: isolatedOwnerToken/);
  assert.match(runner, /ARBOR_WIKI_EVIDENCE_OWNER_TOKEN: isolatedOwnerToken/);
  assert.match(runner, /actor and Origin header are not an owner grant/);
  assert.match(evidence, /Isolated live edit requires an ephemeral Host owner capability/);
  assert.match(evidence, /authorization: 'Bearer ' \+ ownerToken/);
});
test('feedback compiler remains a review-only work-order suggestion, not an effect executor', () => {
  assert.match(compiler, /arbor\.feedback-work-order-suggestion\/1/);
  assert.match(compiler, /noSourceEffects: true/);
  assert.doesNotMatch(compiler, /createHostServer|execFile\(|spawn\(|writeFile\(|appendFile\(/);
});
test('canonical owner acceptance and release blockers are preserved', () => {
  assert.equal(roadmap.acceleration.activeBatch, 'ACCEL-A');
  assert.deepEqual(roadmap.buildQueue.slice(0, 3).map(row => row.itemId), ['A00','A01','A02']);
  assert.ok(roadmap.buildQueue.every(row => row.verification === 'UNRUN'));
  assert.ok(roadmap.buildQueue.every(row => row.ownerAcceptance === 'PENDING'));
});
