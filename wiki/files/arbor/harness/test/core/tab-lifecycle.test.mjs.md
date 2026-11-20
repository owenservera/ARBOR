# File: harness/test/core/tab-lifecycle.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/core/tab-lifecycle.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5853 B |
| Lines | 137 |
| Hash | 6d23375f5586 |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| makeStore | function | 5 | no | function makeStore() { |
| data | const | 6 | no | const data = new Map(); |
| makeOwner | function | 13 | no | function makeOwner() { |
| owned | const | 14 | no | const owned = new Set([&#39;tab-1&#39;, &#39;tab-2&#39;]); |
| store | const | 23 | no | const store = makeStore(); |
| owner | const | 24 | no | const owner = makeOwner(); |
| tl | const | 25 | no | const tl = createTabLifecycle({ stateStore: store, owner }); |
| r | const | 26 | no | const r = await tl.reserve({ requestId: &#39;t1&#39;, provider: &#39;chatgpt&#39;, jobKind: &#39;chat&#39; }); |
| store | const | 35 | no | const store = makeStore(); |
| owner | const | 36 | no | const owner = makeOwner(); |
| tl | const | 37 | no | const tl = createTabLifecycle({ stateStore: store, owner }); |
| r | const | 39 | no | const r = await tl.bind({ requestId: &#39;t1&#39;, targetId: &#39;tab-1&#39; }); |
| store | const | 45 | no | const store = makeStore(); |
| owner | const | 46 | no | const owner = makeOwner(); |
| tl | const | 47 | no | const tl = createTabLifecycle({ stateStore: store, owner }); |
| store | const | 53 | no | const store = makeStore(); |
| owner | const | 54 | no | const owner = makeOwner(); |
| tl | const | 55 | no | const tl = createTabLifecycle({ stateStore: store, owner }); |
| r | const | 58 | no | const r = await tl.advance({ requestId: &#39;t1&#39;, to: &#39;sending&#39;, proof: { requestId: &#39;t1&#39;, targetId: &#39;tab-1&#39;, ownerVerified: true }, }); |
| store | const | 66 | no | const store = makeStore(); |
| owner | const | 67 | no | const owner = makeOwner(); |
| tl | const | 68 | no | const tl = createTabLifecycle({ stateStore: store, owner }); |
| store | const | 75 | no | const store = makeStore(); |
| owner | const | 76 | no | const owner = makeOwner(); |
| tl | const | 77 | no | const tl = createTabLifecycle({ stateStore: store, owner }); |
| before | const | 80 | no | const before = (await tl.records()).find(r =&gt; r.id === &#39;t1&#39;).lastHeartbeatAt; |
| after | const | 83 | no | const after = (await tl.records()).find(r =&gt; r.id === &#39;t1&#39;).lastHeartbeatAt; |
| store | const | 88 | no | const store = makeStore(); |
| owner | const | 89 | no | const owner = makeOwner(); |
| tl | const | 90 | no | const tl = createTabLifecycle({ stateStore: store, owner, now: () =&gt; 35000 }); |
| recs | const | 92 | no | const recs = JSON.parse(store.read(&#39;tab.lifecycle.v1&#39;)); |
| r | const | 97 | no | const r = await tl.sweep({ restarting: false }); |
| store | const | 104 | no | const store = makeStore(); |
| owner | const | 105 | no | const owner = makeOwner(); |
| tl | const | 106 | no | const tl = createTabLifecycle({ stateStore: store, owner, policy: { maxPerProvider: 1 } }); |
| store | const | 114 | no | const store = makeStore(); |
| owner | const | 115 | no | const owner = makeOwner(); |
| tl | const | 116 | no | const tl = createTabLifecycle({ stateStore: store, owner }); |
| r | const | 123 | no | const r = await tl.closeCompleted({ requestId: &#39;t1&#39; }); |
| store | const | 128 | no | const store = makeStore(); |
| owner | const | 129 | no | const owner = makeOwner(); |
| tl | const | 130 | no | const tl = createTabLifecycle({ stateStore: store, owner }); |
| snap | const | 132 | no | const snap = tl.records(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/core/tab-lifecycle.mjs | import | 3 | [harness/src/core/tab-lifecycle.mjs](../../src/core/tab-lifecycle.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTabLifecycle } from '../../src/core/tab-lifecycle.mjs';

function makeStore() {
  const data = new Map();
  return {
    read: (key) => data.get(key) ?? null,
    write: (key, value) => { data.set(key, value); },
  };
}

function makeOwner() {
  const owned = new Set(['tab-1', 'tab-2']);
  return {
    isOwned: async (id) => owned.has(id),
    targets: async () => [...owned].map(id => ({ id })),
    closeOwned: async (id) => { owned.delete(id); },
  };
}

test('reserve creates a tab in open state', async () => {
  const store = makeStore();
  const owner = makeOwner();
  const tl = createTabLifecycle({ stateStore: store, owner });
  const r = await tl.reserve({ requestId: 't1', provider: 'chatgpt', jobKind: 'chat' });
  assert.equal(r.state, 'open');
  assert.equal(r.provider, 'chatgpt');
  assert.equal(r.targetId, null);
  assert.equal(r.transitions.length, 1);
  assert.equal(r.transitions[0].to, 'open');
});

test('bind transitions open -> ready', async () => {
  const store = makeStore();
  const owner = makeOwner();
  const tl = createTabLifecycle({ stateStore: store, owner });
  await tl.reserve({ requestId: 't1', provider: 'chatgpt' });
  const r = await tl.bind({ requestId: 't1', targetId: 'tab-1' });
  assert.equal(r.state, 'ready');
  assert.equal(r.targetId, 'tab-1');
});

test('bind fails for unowned target', async () => {
  const store = makeStore();
  const owner = makeOwner();
  const tl = createTabLifecycle({ stateStore: store, owner });
  await tl.reserve({ requestId: 't1', provider: 'chatgpt' });
  await assert.rejects(tl.bind({ requestId: 't1', targetId: 'unowned-tab' }), { code: 'TAB_NOT_OWNED' });
});

test('advance transitions open -> ready -> sending with proof', async () => {
  const store = makeStore();
  const owner = makeOwner();
  const tl = createTabLifecycle({ stateStore: store, owner });
  await tl.reserve({ requestId: 't1', provider: 'chatgpt' });
  await tl.bind({ requestId: 't1', targetId: 'tab-1' });
  const r = await tl.advance({
    requestId: 't1', to: 'sending',
    proof: { requestId: 't1', targetId: 'tab-1', ownerVerified: true },
  });
  assert.equal(r.state, 'sending');
});

test('advance rejects without proof for sending', async () => {
  const store = makeStore();
  const owner = makeOwner();
  const tl = createTabLifecycle({ stateStore: store, owner });
  await tl.reserve({ requestId: 't1', provider: 'chatgpt' });
  await tl.bind({ requestId: 't1', targetId: 'tab-1' });
  await assert.rejects(tl.advance({ requestId: 't1', to: 'sending' }), { code: 'TAB_PROOF_REQUIRED' });
});

test('heartbeat updates lastHeartbeatAt', async () => {
  const store = makeStore();
  const owner = makeOwner();
  const tl = createTabLifecycle({ stateStore: store, owner });
  await tl.reserve({ requestId: 't1', provider: 'chatgpt' });
  await tl.bind({ requestId: 't1', targetId: 'tab-1' });
  const before = (await tl.records()).find(r => r.id === 't1').lastHeartbeatAt;
```

_First 80 of 138 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
