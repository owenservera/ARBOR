// Proves the lane L5 receipt runner builds an honest agent_dry_run receipt:
// measured local hops (Host -> SQLite -> projection -> revision/Undo) with
// command ids and elapsed ms, and not_run: device_unavailable for the phone /
// on-device hops. This is not P1 evidence.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildReceipt, writeReceipt } from '../receipt-runner.mjs';

test('receipt runner: agent_dry_run has 6 measured local hops and 2 not_run device hops', () => {
  const out = mkdtempSync(path.join(tmpdir(), 'vivim-receipt-test-'));
  try {
    const receipt = buildReceipt({ label: 'agent_dry_run', date: '2026-11-03' });

    assert.equal(receipt.schema, 'vivim.receipt/1');
    assert.equal(receipt.label, 'agent_dry_run');
    assert.equal(receipt.kind, 'dry_run');
    assert.ok(receipt.notes.includes('not P1 evidence'), 'dry run must disclaim P1 evidence');
    assert.equal(receipt.scope, 'device-free local portion (Host -> SQLite -> projection -> revision/Undo)');

    assert.equal(receipt.hops.length, 8);
    const measured = receipt.hops.filter(h => h.measured);
    const notRun = receipt.hops.filter(h => !h.measured);
    assert.equal(measured.length, 6);
    assert.equal(notRun.length, 2);

    // Every measured hop carries a command id, request id and real elapsed ms.
    for (const h of measured) {
      assert.ok(h.commandId, 'measured hop ' + h.hop + ' needs a command id');
      assert.ok(h.requestId, 'measured hop ' + h.hop + ' needs a request id');
      assert.ok(typeof h.elapsedMs === 'number' && h.elapsedMs >= 0, 'measured hop ' + h.hop + ' needs elapsed ms');
      assert.ok(typeof h.startedAt === 'string' && typeof h.finishedAt === 'string');
      assert.equal(h.status, 'applied');
    }

    // The not_run hops are the phone relay and the on-device repaint.
    assert.deepEqual(notRun.map(h => ({ hop: h.hop, reason: h.reason })), [
      { hop: 1, reason: 'device_unavailable' },
      { hop: 6, reason: 'device_unavailable' }
    ]);
    for (const h of notRun) {
      assert.equal(h.elapsedMs, null);
      assert.equal(h.commandId, null);
    }

    // Revision 2 committed, then Undo restores revision 1 (history kept).
    const rev2 = receipt.hops.find(h => h.revision === 2);
    assert.ok(rev2, 'revision 2 must be committed');
    const undo = receipt.hops.find(h => h.domain === 'Host+SQLite' && h.revision === 1 && h.parentRevision === 2);
    assert.ok(undo, 'Undo must restore revision 1 after revision 2');
    assert.equal(receipt.result.activeRevision, 1);
    assert.equal(receipt.result.projectionReady, true);

    // Totals agree with the hop list.
    assert.equal(receipt.totals.hops, 8);
    assert.equal(receipt.totals.measured, 6);
    assert.equal(receipt.totals.notRun, 2);
    assert.equal(receipt.totals.elapsedMs,
      Math.round(measured.reduce((s, h) => s + (h.elapsedMs ?? 0), 0) * 100) / 100);

    // writeReceipt emits both dated artifacts.
    const written = writeReceipt(receipt, out);
    const json = JSON.parse(readFileSync(written.json, 'utf8'));
    assert.equal(json.receiptId, receipt.receiptId);
    assert.equal(json.label, 'agent_dry_run');
    const md = readFileSync(written.markdown, 'utf8');
    assert.ok(md.includes('agent_dry_run'), 'markdown must carry the dry-run label');
    assert.ok(md.includes('not P1 evidence'), 'markdown must disclaim P1 evidence');
    assert.ok(md.includes('device_unavailable'), 'markdown must state the device-unavailable distinction');
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
