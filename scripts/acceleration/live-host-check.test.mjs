import test from 'node:test';
import assert from 'node:assert/strict';
import { runHostLoopCheck } from './live-host-check.mjs';

// Executed by Node's test runner; unlike static source assertions, this starts
// the real Host with a temporary data root, performs live HTTP probes, restarts,
// and runs the Wiki evidence script without touching the owner's persistent data.
test('A01 isolated real Host chat↔Wiki loop and A00 evidence', async () => {
  const receipt = await runHostLoopCheck();
  assert.equal(receipt.ok, true, JSON.stringify(receipt, null, 2));
  assert.equal(receipt.exitCode, 0);
  assert.ok(receipt.tests.length >= 20, 'real HTTP/revision checks emitted');
  assert.equal(receipt.wikiEvidence?.exitCode, 0);
  assert.equal(receipt.wikiEvidence?.independentKeeperAcceptance, 'UNRUN');
});
