# File: apps/vivim-host/receipt-runner.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/vivim-host/receipt-runner.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 15159 B |
| Lines | 280 |
| Hash | 19d034328068 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| RECEIPT_SCHEMA | const | 22 | yes | export const RECEIPT_SCHEMA = &#39;vivim.receipt/1&#39;; |
| LABEL_DEFAULT | const | 23 | no | const LABEL_DEFAULT = &#39;agent_dry_run&#39;; |
| DATE_DEFAULT | const | 24 | no | const DATE_DEFAULT = new Date().toISOString().slice(0, 10); |
| WORLD_DEFAULT | const | 25 | no | const WORLD_DEFAULT = &#39;world-local&#39;; |
| HERE | const | 26 | no | const HERE = path.dirname(fileURLToPath(import.meta.url)); |
| REPO_ROOT | const | 27 | no | const REPO_ROOT = path.resolve(HERE, &#39;..&#39;); |
| DEFAULT_OUT | const | 28 | no | const DEFAULT_OUT = path.join(REPO_ROOT, &#39;docs&#39;, &#39;receipts&#39;); |
| id | function | 30 | no | function id() { return &#39;rcp-&#39; + randomBytes(8).toString(&#39;hex&#39;); } |
| cmdId | function | 31 | no | function cmdId() { return &#39;cmd-&#39; + randomBytes(8).toString(&#39;hex&#39;); } |
| card | function | 33 | no | function card(componentId) { |
| surface | function | 37 | no | function surface() { |
| committed | function | 44 | no | function committed(out, prior, body, approvedRefs) { |
| next | const | 45 | no | const next = out.surface ?? compileUiProposal({ proposal: body, surface: prior, approvedRefs }).surface; |
| proposal | function | 49 | no | function proposal(surface, component, { opId, baseRevision = surface.revision } = {}) { |
| time | function | 58 | no | function time(fn) { |
| startedAt | const | 59 | no | const startedAt = new Date().toISOString(); |
| t0 | const | 60 | no | const t0 = process.hrtime.bigint(); |
| result | const | 61 | no | const result = fn(); |
| finishedAt | const | 62 | no | const finishedAt = new Date().toISOString(); |
| elapsedMs | const | 63 | no | const elapsedMs = Number(process.hrtime.bigint() - t0) / 1_000_000; |
| hop | function | 67 | no | function hop(n, name, domain, fields) { |
| notRunHop | function | 71 | no | function notRunHop(n, name, domain, reason) { |
| buildReceipt | function | 76 | yes | export function buildReceipt({ date = DATE_DEFAULT, label = LABEL_DEFAULT, worldId = WORLD_DEFAULT } = {}) { |
| receiptId | const | 77 | no | const receiptId = id(); |
| chain | const | 78 | no | const chain = &#39;paired phone -&gt; Host -&gt; SQLite -&gt; projection -&gt; on-device repaint -&gt; Undo&#39;; |
| dir | const | 79 | no | const dir = mkdtempSync(path.join(tmpdir(), &#39;vivim-receipt-&#39;)); |
| ledgerFile | const | 80 | no | const ledgerFile = path.join(dir, &#39;ledger.db&#39;); |
| runtime | const | 81 | no | const runtime = createBootstrapRuntime({ dataRoot: dir, worldId, file: ledgerFile }); |
| hops | const | 82 | no | const hops = []; |
| rev1ChangeId | variable | 83 | no | let rev1ChangeId = null; |
| start | const | 89 | no | const start = surface(); |
| first | const | 90 | no | const first = proposal(start, card(&#39;item1&#39;), { opId: &#39;op.insert.item1&#39; }); |
| h2 | const | 96 | no | const h2 = time(() =&gt; runtime.applyUiProposal({ proposal: first, surface: start, approvedRefs: [], requestId: &#39;req-receipt-1&#39;, actor: &#39;owner&#39; })); |
| r1 | const | 99 | no | const r1 = h2.result; |
| rev1Surface | const | 109 | no | const rev1Surface = committed(r1, start, first, []); |
| second | const | 110 | no | const second = proposal(rev1Surface, card(&#39;item2&#39;), { opId: &#39;op.insert.item2&#39;, baseRevision: 1 }); |
| h3 | const | 111 | no | const h3 = time(() =&gt; runtime.applyUiProposal({ proposal: second, surface: rev1Surface, approvedRefs: [], requestId: &#39;req-receipt-2&#39;, actor: &#39;owner&#39; })); |
| r2 | const | 114 | no | const r2 = h3.result; |
| h4 | const | 123 | no | const h4 = time(() =&gt; { const row = runtime.ledger.uiRevisions.byRevision(worldId, r2.revision); return row ? { revision: row.revision, changeId: row.change_id, status: row.status, active: row.active… |
| row | const | 124 | no | const row = runtime.ledger.uiRevisions.byRevision(worldId, r2.revision); |
| row2 | const | 127 | no | const row2 = h4.result; |
| h5 | const | 136 | no | const h5 = time(() =&gt; runtime.projection()); |
| pre | const | 137 | no | const pre = h5.result; |
| h7 | const | 149 | no | const h7 = time(() =&gt; runtime.undoUiRevision({ requestId: &#39;req-receipt-undo&#39;, actor: &#39;owner&#39; })); |
| undone | const | 150 | no | const undone = h7.result; |
| h8 | const | 159 | no | const h8 = time(() =&gt; runtime.projection()); |
| post | const | 160 | no | const post = h8.result; |
| measured | const | 168 | no | const measured = hops.filter(h =&gt; h.measured); |
| notRun | const | 169 | no | const notRun = hops.filter(h =&gt; !h.measured); |
| elapsedMs | const | 170 | no | const elapsedMs = Math.round(measured.reduce((sum, h) =&gt; sum + (h.elapsedMs ?? 0), 0) * 100) / 100; |
| elapsedCell | function | 202 | no | function elapsedCell(h) { return h.measured ? String(h.elapsedMs) + &#39; ms&#39; : &#39;—&#39;; } |
| revisionCell | function | 203 | no | function revisionCell(h) { return h.revision === null ? &#39;—&#39; : String(h.revision); } |
| boolCell | function | 204 | no | function boolCell(h) { return h.measured ? &#39;yes&#39; : &#39;no (&#39; + h.reason + &#39;)&#39;; } |
| receiptMarkdown | function | 206 | no | function receiptMarkdown(receipt) { |
| lines | const | 207 | no | const lines = []; |
| writeReceipt | function | 252 | yes | export function writeReceipt(receipt, outDir) { |
| base | const | 254 | no | const base = path.join(outDir, receipt.date + &#39;-&#39; + receipt.label); |
| parseArgs | function | 261 | no | function parseArgs(argv) { |
| out | const | 262 | no | const out = { out: DEFAULT_OUT, label: LABEL_DEFAULT, date: DATE_DEFAULT }; |
| a | const | 264 | no | const a = argv[i]; |
| args | const | 274 | no | const args = parseArgs(process.argv.slice(2)); |
| receipt | const | 275 | no | const receipt = buildReceipt({ label: args.label, date: args.date }); |
| written | const | 276 | no | const written = writeReceipt(receipt, args.out); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 13 | external |
| node:fs | import | 14 | external |
| node:os | import | 15 | external |
| node:path | import | 16 | external |
| node:url | import | 17 | external |
| ./bootstrap/runtime.mjs | import | 18 | [apps/vivim-host/bootstrap/runtime.mjs](./bootstrap/runtime.mjs.md) |
| ../mobile-relay/generative-ui/catalog.mjs | import | 19 | [apps/mobile-relay/generative-ui/catalog.mjs](../mobile-relay/generative-ui/catalog.mjs.md) |
| ../mobile-relay/generative-ui/compiler.mjs | import | 20 | [apps/mobile-relay/generative-ui/compiler.mjs](../mobile-relay/generative-ui/compiler.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/test/receipt-runner.test.mjs](./test/receipt-runner.test.mjs.md) | ../receipt-runner.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Prototype acceptance receipt runner — lane L5 (device-free local portion).
//
// Executes the part of the P1 receipt chain that does not need a phone:
//   Host -> SQLite -> projection -> revision/Undo
//
// Each hop carries a command id and an elapsed-ms timing. The paired-phone and
// on-device-repaint hops are recorded as not_run: device_unavailable — they are
// never simulated as measured. The owner runs the full chain (including a paired
// device) to produce P1 evidence; this run is an agent_dry_run only.
//
// Importable (buildReceipt / writeReceipt) and runnable directly:
//   node apps/vivim-host/receipt-runner.mjs [--out <dir>] [--label <name>] [--date <YYYY-MM-DD>]
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBootstrapRuntime } from './bootstrap/runtime.mjs';
import { createSurface } from '../mobile-relay/generative-ui/catalog.mjs';
import { compileUiProposal } from '../mobile-relay/generative-ui/compiler.mjs';

export const RECEIPT_SCHEMA = 'vivim.receipt/1';
const LABEL_DEFAULT = 'agent_dry_run';
const DATE_DEFAULT = new Date().toISOString().slice(0, 10);
const WORLD_DEFAULT = 'world-local';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..');
const DEFAULT_OUT = path.join(REPO_ROOT, 'docs', 'receipts');

function id() { return 'rcp-' + randomBytes(8).toString('hex'); }
function cmdId() { return 'cmd-' + randomBytes(8).toString('hex'); }

function card(componentId) {
  return { id: componentId, type: 'card', props: { title: 'Known topic', description: 'Grounded summary' }, children: [] };
}

function surface() {
  return createSurface({ surfaceId: 'receipt-chain-space' });
}

// Mirror the UI-revision test: derive the committed surface from the service
// outcome, stamping the real committed revision so the next compare-and-swap
// runs against the revision the Host actually holds.
function committed(out, prior, body, approvedRefs) {
  const next = out.surface ?? compileUiProposal({ proposal: body, surface: prior, approvedRefs }).surface;
  return { ...next, revision: out.revision };
}

function proposal(surface, component, { opId, baseRevision = surface.revision } = {}) {
  return {
    schema: 'vivim.ui-proposal/1', surfaceId: surface.surfaceId, baseRevision,
    operations: [{ opId, type: 'insert', parentId: 'root', component }],
    explanation: 'Receipt chain surface revision', assumptions: [], unknowns: []
  };
}

// Time one hop: ISO bookends plus real elapsed milliseconds from hrtime.
function time(fn) {
  const startedAt = new Date().toISOString();
  const t0 = process.hrtime.bigint();
  const result = fn();
  const finishedAt = new Date().toISOString();
  const elapsedMs = Number(process.hrtime.bigint() - t0) / 1_000_000;
  return { result, startedAt, finishedAt, elapsedMs: Math.round(elapsedMs * 100) / 100 };
}

function hop(n, name, domain, fields) {
  return { hop: n, name, domain, measured: fields.measured !== false, ...fields };
}

function notRunHop(n, name, domain, reason) {
  return hop(n, name, domain, { measured: false, status: 'not_run', reason, elapsedMs: null, commandId: null, requestId: null, revision: null });
}

// Build the receipt in memory (device-free local portion only).
export function buildReceipt({ date = DATE_DEFAULT, label = LABEL_DEFAULT, worldId = WORLD_DEFAULT } = {}) {
  const receiptId = id();
  const chain = 'paired phone -> Host -> SQLite -> projection -> on-device repaint -> Undo';
  const dir = mkdtempSync(path.join(tmpdir(), 'vivim-receipt-'));
  const ledgerFile = path.join(dir, 'ledger.db');
```

_First 80 of 281 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
