# File: apps/vivim-host/test/bootstrap-command-apply.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/bootstrap-command-apply.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6763 B |
| Lines | 144 |
| Hash | cce6901fa04b |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| runtime | function | 12 | no | function runtime() { |
| dir | const | 13 | no | const dir = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-apply-&#39;)); |
| host | const | 14 | no | const host = createBootstrapRuntime({ dataRoot: dir, file: &#39;:memory:&#39; }); |
| surface | function | 19 | no | function surface() { return createSurface({ surfaceId: &#39;my-space&#39; }); } |
| insertOp | function | 20 | no | function insertOp(target, component, { opId = &#39;op.tap&#39;, baseRevision = target.revision } = {}) { |
| card | function | 24 | no | const card = (id) =&gt; ({ id, type: &#39;card&#39;, props: { title: &#39;Known topic&#39;, description: &#39;Grounded summary&#39; }, children: [] }); |
| command | function | 26 | no | function command(action, proposal) { |
| makeStore | function | 31 | no | function makeStore() { |
| records | const | 32 | no | const records = new Map(); |
| r | const | 40 | no | const r = records.get(id); |
| next | const | 42 | no | const next = { ...r, status: &#39;claimed&#39;, claimToken: token }; |
| r | const | 47 | no | const r = records.get(id); |
| env | const | 54 | no | const env = runtime(); |
| start | const | 56 | no | const start = surface(); |
| body | const | 57 | no | const body = insertOp(start, card(&#39;item1&#39;)); |
| compiled | const | 58 | no | const compiled = compileUiProposal({ proposal: body, surface: start, approvedRefs: [] }); |
| cmd | const | 61 | no | const cmd = command(&#39;apply-proposal&#39;, body); |
| store | const | 62 | no | const store = makeStore(); |
| worker | const | 66 | no | const worker = createBootstrapCommandWorker({ root: os.tmpdir(), runtime: env.host, store }); |
| done | const | 67 | no | const done = worker.tick(); |
| env | const | 78 | no | const env = runtime(); |
| start | const | 80 | no | const start = surface(); |
| first | const | 81 | no | const first = insertOp(start, card(&#39;item1&#39;)); |
| one | const | 82 | no | const one = env.host.applyUiProposal({ proposal: first, surface: start, approvedRefs: [], requestId: &#39;req-1&#39; }); |
| stale | const | 86 | no | const stale = insertOp(start, card(&#39;item2&#39;)); // baseRevision 0 |
| store | const | 87 | no | const store = makeStore(); |
| cmd | const | 88 | no | const cmd = command(&#39;apply-proposal&#39;, stale); |
| worker | const | 92 | no | const worker = createBootstrapCommandWorker({ root: os.tmpdir(), runtime: env.host, store }); |
| done | const | 93 | no | const done = worker.tick(); |
| env | const | 103 | no | const env = runtime(); |
| start | const | 105 | no | const start = surface(); |
| one | const | 106 | no | const one = env.host.applyUiProposal({ proposal: insertOp(start, card(&#39;item1&#39;)), surface: start, approvedRefs: [], requestId: &#39;req-undo-1&#39; }); |
| mid | const | 108 | no | const mid = env.host.uiRevision(); |
| two | const | 109 | no | const two = env.host.applyUiProposal({ proposal: insertOp(mid, card(&#39;item2&#39;), { opId: &#39;op.tap2&#39; }), surface: mid, approvedRefs: [], requestId: &#39;req-undo-2&#39; }); |
| store | const | 113 | no | const store = makeStore(); |
| cmd | const | 114 | no | const cmd = command(&#39;undo-ui-revision&#39;); |
| worker | const | 118 | no | const worker = createBootstrapCommandWorker({ root: os.tmpdir(), runtime: env.host, store }); |
| done | const | 119 | no | const done = worker.tick(); |
| env | const | 130 | no | const env = runtime(); |
| store | const | 132 | no | const store = makeStore(); |
| noProposal | const | 133 | no | const noProposal = command(&#39;apply-proposal&#39;, undefined); |
| worker | const | 137 | no | const worker = createBootstrapCommandWorker({ root: os.tmpdir(), runtime: env.host, store }); |
| done | const | 138 | no | const done = worker.tick(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| node:fs | import | 4 | external |
| node:os | import | 5 | external |
| node:path | import | 6 | external |
| ../bootstrap/runtime.mjs | import | 7 | [apps/vivim-host/bootstrap/runtime.mjs](../bootstrap/runtime.mjs.md) |
| ../bootstrap/command-worker.mjs | import | 8 | [apps/vivim-host/bootstrap/command-worker.mjs](../bootstrap/command-worker.mjs.md) |
| ../../mobile-relay/generative-ui/catalog.mjs | import | 9 | [apps/mobile-relay/generative-ui/catalog.mjs](../../mobile-relay/generative-ui/catalog.mjs.md) |
| ../../mobile-relay/generative-ui/compiler.mjs | import | 10 | [apps/mobile-relay/generative-ui/compiler.mjs](../../mobile-relay/generative-ui/compiler.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Legacy unbound relay visual commands must fail closed; Host control owns approval.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createBootstrapRuntime } from '../bootstrap/runtime.mjs';
import { createBootstrapCommandWorker } from '../bootstrap/command-worker.mjs';
import { createSurface } from '../../mobile-relay/generative-ui/catalog.mjs';
import { compileUiProposal } from '../../mobile-relay/generative-ui/compiler.mjs';

function runtime() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'vivim-apply-'));
  const host = createBootstrapRuntime({ dataRoot: dir, file: ':memory:' });
  host.grantBootstrap({ scope: 'full-bootstrap' });
  return { dir, host, close() { host.close(); rmSync(dir, { recursive: true, force: true }); } };
}

function surface() { return createSurface({ surfaceId: 'my-space' }); }
function insertOp(target, component, { opId = 'op.tap', baseRevision = target.revision } = {}) {
  return { schema: 'vivim.ui-proposal/1', surfaceId: target.surfaceId, baseRevision,
    operations: [{ opId, type: 'insert', parentId: 'root', component }], explanation: 'Tap', assumptions: [], unknowns: [] };
}
const card = (id) => ({ id, type: 'card', props: { title: 'Known topic', description: 'Grounded summary' }, children: [] });

function command(action, proposal) {
  return { id: 'cmd-' + Array.from(crypto.getRandomValues(new Uint8Array(8)), b => b.toString(16).padStart(2, '0')).join(''), text: action, action,
    consumer: 'bootstrap', mode: 'bootstrap', origin: 'relay', proposal };
}

function makeStore() {
  const records = new Map();
  return {
    records,
    list({ status, consumer } = {}) {
      return { items: [...records.values()].filter(r => (!status || r.status === status) && (!consumer || r.consumer === consumer)) };
    },
    get(id) { const r = records.get(id); if (!r) throw new Error('missing ' + id); return r; },
    claim(id, { token } = {}) {
      const r = records.get(id);
      if (!r || r.status !== 'queued') return null;
      const next = { ...r, status: 'claimed', claimToken: token };
      records.set(id, next);
      return next;
    },
    reply(id, text, { status }) {
      const r = records.get(id);
      records.set(id, { ...r, status, result: text });
    }
  };
}

test('unbound apply-proposal cannot commit through the worker', () => {
  const env = runtime();
  try {
    const start = surface();
    const body = insertOp(start, card('item1'));
    const compiled = compileUiProposal({ proposal: body, surface: start, approvedRefs: [] });
    assert.equal(compiled.surface.revision, 0);

    const cmd = command('apply-proposal', body);
    const store = makeStore();
    store.records.set(cmd.id, { id: cmd.id, status: 'queued', consumer: 'bootstrap', mode: 'bootstrap',
      action: 'apply-proposal', text: 'apply-proposal', origin: 'relay', proposal: body, rev: 1 });

    const worker = createBootstrapCommandWorker({ root: os.tmpdir(), runtime: env.host, store });
    const done = worker.tick();
    assert.equal(done.length, 1);
    assert.equal(done[0].status, 'failed');
    assert.match(done[0].reason,/fresh Host control plan/);
    assert.equal(env.host.uiRevision(),null);
    assert.equal(store.records.get(cmd.id).status, 'failed');
    worker.close();
  } finally { env.close(); }
});

test('apply-proposal rejects a stale base revision and does not advance', () => {
  const env = runtime();
  try {
    const start = surface();
```

_First 80 of 145 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
