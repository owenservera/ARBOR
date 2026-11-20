# File: apps/vivim-host/test/receipt-runner.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/receipt-runner.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3801 B |
| Lines | 75 |
| Hash | d6cf74ed905e |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| out | const | 13 | no | const out = mkdtempSync(path.join(tmpdir(), &#39;vivim-receipt-test-&#39;)); |
| receipt | const | 15 | no | const receipt = buildReceipt({ label: &#39;agent_dry_run&#39;, date: &#39;2026-11-03&#39; }); |
| measured | const | 24 | no | const measured = receipt.hops.filter(h =&gt; h.measured); |
| notRun | const | 25 | no | const notRun = receipt.hops.filter(h =&gt; !h.measured); |
| rev2 | const | 49 | no | const rev2 = receipt.hops.find(h =&gt; h.revision === 2); |
| undo | const | 51 | no | const undo = receipt.hops.find(h =&gt; h.domain === &#39;Host+SQLite&#39; &amp;&amp; h.revision === 1 &amp;&amp; h.parentRevision === 2); |
| written | const | 64 | no | const written = writeReceipt(receipt, out); |
| json | const | 65 | no | const json = JSON.parse(readFileSync(written.json, &#39;utf8&#39;)); |
| md | const | 68 | no | const md = readFileSync(written.markdown, &#39;utf8&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 5 | external |
| node:assert/strict | import | 6 | external |
| node:fs | import | 7 | external |
| node:os | import | 8 | external |
| node:path | import | 9 | external |
| ../receipt-runner.mjs | import | 10 | [apps/vivim-host/receipt-runner.mjs](../receipt-runner.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
