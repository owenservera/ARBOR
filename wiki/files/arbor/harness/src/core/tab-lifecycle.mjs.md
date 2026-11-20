# File: harness/src/core/tab-lifecycle.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/core/tab-lifecycle.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11627 B |
| Lines | 244 |
| Hash | 04afcdf827f9 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TAB_LIFECYCLE_SCHEMA | const | 12 | yes | export const TAB_LIFECYCLE_SCHEMA = &#39;vivim.tab-lifecycle/1&#39;; |
| TAB_STATES | const | 13 | yes | export const TAB_STATES = Object.freeze([&#39;open&#39;, &#39;ready&#39;, &#39;sending&#39;, &#39;sent&#39;, &#39;streaming&#39;, &#39;done&#39;, &#39;failed&#39;, &#39;uncertain&#39;, &#39;closed&#39;]); |
| TERMINAL | const | 14 | yes | export const TERMINAL = new Set([&#39;done&#39;, &#39;failed&#39;, &#39;uncertain&#39;, &#39;closed&#39;]); |
| ACTIVE | const | 15 | yes | export const ACTIVE = new Set([&#39;open&#39;, &#39;ready&#39;, &#39;sending&#39;, &#39;sent&#39;, &#39;streaming&#39;]); |
| ID | const | 17 | no | const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/; |
| fail | function | 18 | no | const fail = (code, reason) =&gt; { const e = new Error(reason); e.code = code; throw e; }; |
| validId | function | 19 | no | const validId = (s, label) =&gt; { if (!ID.test(s)) fail(&#39;TAB_INVALID&#39;, `${label} must be a bounded id`); return s; }; |
| clone | function | 20 | no | const clone = v =&gt; JSON.parse(JSON.stringify(v)); |
| DEFAULT_TIMEOUTS | const | 23 | no | const DEFAULT_TIMEOUTS = Object.freeze({ open: 30000, // 30s to become ready ready: 60000, // 60s to begin sending sending: 300000, // 5min to reach sent/streaming sent: 600000, // 10m to reach strea… |
| HEARTBEAT_INTERVAL_MS | const | 31 | no | const HEARTBEAT_INTERVAL_MS = 15000; |
| SWEEP_INTERVAL_MS | const | 32 | no | const SWEEP_INTERVAL_MS = 30000; |
| MAX_PER_PROVIDER | const | 33 | no | const MAX_PER_PROVIDER = 4; |
| MAX_GLOBAL | const | 34 | no | const MAX_GLOBAL = 16; |
| isTerminal | function | 36 | no | function isTerminal(s) { return TERMINAL.has(s); } |
| isActive | function | 37 | no | function isActive(s) { return ACTIVE.has(s); } |
| EDGES | const | 40 | no | const EDGES = Object.freeze({ open: [&#39;ready&#39;, &#39;failed&#39;, &#39;uncertain&#39;], ready: [&#39;sending&#39;, &#39;failed&#39;, &#39;uncertain&#39;], sending: [&#39;sent&#39;, &#39;streaming&#39;, &#39;failed&#39;, &#39;uncertain&#39;], sent: [&#39;streaming&#39;, &#39;done&#39;, &#39;fa… |
| createTabLifecycle | function | 52 | yes | export function createTabLifecycle({ stateStore, owner, now = Date.now, policy = {} } = {}) { |
| timeouts | const | 59 | no | const timeouts = { ...DEFAULT_TIMEOUTS, ...(policy.timeouts \|\| {}) }; |
| maxPerProvider | const | 60 | no | const maxPerProvider = policy.maxPerProvider ?? MAX_PER_PROVIDER; |
| maxGlobal | const | 61 | no | const maxGlobal = policy.maxGlobal ?? MAX_GLOBAL; |
| key | const | 62 | no | const key = &#39;tab.lifecycle.v1&#39;; |
| load | function | 64 | no | const load = () =&gt; { |
| raw | variable | 65 | no | let raw; |
| persist | function | 70 | no | const persist = (records) =&gt; stateStore.write(key, JSON.stringify(records, null, 2)); |
| mutate | function | 71 | no | const mutate = (fn) =&gt; { |
| list | const | 72 | no | const list = load(); |
| records | function | 79 | no | const records = () =&gt; load(); |
| snapshot | function | 80 | no | const snapshot = () =&gt; clone(records()); |
| find | function | 82 | no | function find(id) { return records().find(r =&gt; r.id === id); } |
| countActive | function | 84 | no | function countActive(records, provider) { |
| countTotal | function | 88 | no | function countTotal(records, provider) { |
| reserve | function | 93 | no | async function reserve({ requestId, provider, jobKind = &#39;chat&#39; } = {}) { |
| existing | const | 98 | no | const existing = records.find(r =&gt; r.id === requestId); |
| t | const | 102 | no | const t = now(); |
| bind | function | 115 | no | async function bind({ requestId, targetId } = {}) { |
| r | const | 120 | no | const r = records.find(x =&gt; x.id === requestId); |
| t | const | 125 | no | const t = now(); |
| advance | function | 136 | no | async function advance({ requestId, to, proof = null, reason = null } = {}) { |
| r | const | 141 | no | const r = records.find(x =&gt; x.id === requestId); |
| t | const | 151 | no | const t = now(); |
| heartbeat | function | 163 | no | async function heartbeat({ requestId, targetId } = {}) { |
| r | const | 166 | no | const r = records.find(x =&gt; x.id === requestId); |
| sweep | function | 176 | no | async function sweep({ restarting = false } = {}) { |
| targets | const | 177 | no | const targets = await owner.targets().catch(() =&gt; null); |
| live | const | 178 | no | const live = new Set(targets ? targets.map(t =&gt; t.id) : []); |
| nowMs | const | 179 | no | const nowMs = now(); |
| changes | const | 180 | no | const changes = []; |
| all | const | 181 | no | const all = records(); |
| proof | const | 184 | no | const proof = await owner.isOwned(r.targetId).catch(() =&gt; false); |
| targetLost | const | 185 | no | const targetLost = r.targetId &amp;&amp; targets &amp;&amp; !live.has(r.targetId); |
| ownerDead | const | 186 | no | const ownerDead = r.targetId &amp;&amp; !proof; |
| expired | const | 187 | no | const expired = nowMs - r.lastHeartbeatAt &gt; (timeouts[r.state] ?? Infinity); |
| stale | const | 188 | no | const stale = restarting &amp;&amp; [&#39;sending&#39;, &#39;sent&#39;, &#39;streaming&#39;].includes(r.state); |
| nextState | variable | 190 | no | let nextState = r.state; |
| reason | variable | 191 | no | let reason = r.reason; |
| rec | const | 204 | no | const rec = await advance({ requestId: r.id, to: nextState, proof: { requestId: r.id, targetId: r.targetId, ownerVerified: true }, reason }); |
| updated | const | 208 | no | const updated = records(); |
| closeCompleted | function | 213 | no | async function closeCompleted({ requestId } = {}) { |
| r | const | 215 | no | const r = find(requestId); |
| remaining | const | 222 | no | const remaining = await owner.targets().catch(() =&gt; null); |
| tab | const | 227 | no | const tab = records.find(x =&gt; x.id === requestId); |
| t | const | 229 | no | const t = now(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 9 | external |
| node:path | import | 10 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/test/core/tab-lifecycle.test.mjs](../../test/core/tab-lifecycle.test.mjs.md) | ../../src/core/tab-lifecycle.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VIVIM Q24 — Chrome tab lifecycle coordinator.
// Each tab/job is an explicit state machine:
//   open -> ready -> sending -> sent -> streaming -> done/failed/uncertain -> closed
// Per-state timeouts/watchdogs, heartbeats, deterministic cleanup sweeps on a timer,
// logged replayable protocol. Never auto-resends uncertain sends.
// The harness is sole lifecycle authority; CDP reconciliation/fallback when extension absent.
// This module NEVER starts Chrome, creates tabs, sends, or draft-clears. It only tracks
// lifecycle state and emits transitions for the owner (Studio/harness) to act on.
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const TAB_LIFECYCLE_SCHEMA = 'vivim.tab-lifecycle/1';
export const TAB_STATES = Object.freeze(['open', 'ready', 'sending', 'sent', 'streaming', 'done', 'failed', 'uncertain', 'closed']);
export const TERMINAL = new Set(['done', 'failed', 'uncertain', 'closed']);
export const ACTIVE = new Set(['open', 'ready', 'sending', 'sent', 'streaming']);

const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const fail = (code, reason) => { const e = new Error(reason); e.code = code; throw e; };
const validId = (s, label) => { if (!ID.test(s)) fail('TAB_INVALID', `${label} must be a bounded id`); return s; };
const clone = v => JSON.parse(JSON.stringify(v));

// Default per-state timeouts (ms). Owner-configurable via policy.
const DEFAULT_TIMEOUTS = Object.freeze({
  open: 30000,      // 30s to become ready
  ready: 60000,     // 60s to begin sending
  sending: 300000,  // 5min to reach sent/streaming
  sent: 600000,     // 10m to reach streaming/done
  streaming: 600000, // 10m to reach done/failed
  closed: 30000,    // 30s to fully close
});
const HEARTBEAT_INTERVAL_MS = 15000;
const SWEEP_INTERVAL_MS = 30000;
const MAX_PER_PROVIDER = 4;
const MAX_GLOBAL = 16;

function isTerminal(s) { return TERMINAL.has(s); }
function isActive(s) { return ACTIVE.has(s); }

// EDGES: valid state transitions
const EDGES = Object.freeze({
  open: ['ready', 'failed', 'uncertain'],
  ready: ['sending', 'failed', 'uncertain'],
  sending: ['sent', 'streaming', 'failed', 'uncertain'],
  sent: ['streaming', 'done', 'failed', 'uncertain'],
  streaming: ['done', 'failed', 'uncertain'],
  done: ['closed'],
  failed: ['closed'],
  uncertain: ['closed'],
  closed: [],
});

export function createTabLifecycle({ stateStore, owner, now = Date.now, policy = {} } = {}) {
  if (!stateStore || typeof stateStore.read !== 'function' || typeof stateStore.write !== 'function') {
    fail('TAB_DEPENDENCY', 'Durable state store with read/write required');
  }
  if (!owner || typeof owner.isOwned !== 'function' || typeof owner.targets !== 'function') {
    fail('TAB_DEPENDENCY', 'Owner registry adapter required (isOwned, targets)');
  }
  const timeouts = { ...DEFAULT_TIMEOUTS, ...(policy.timeouts || {}) };
  const maxPerProvider = policy.maxPerProvider ?? MAX_PER_PROVIDER;
  const maxGlobal = policy.maxGlobal ?? MAX_GLOBAL;
  const key = 'tab.lifecycle.v1';

  const load = () => {
    let raw;
    try { raw = stateStore.read(key); } catch { return []; }
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  };
  const persist = (records) => stateStore.write(key, JSON.stringify(records, null, 2));
  const mutate = (fn) => {
    const list = load();
    const { next, result } = fn(list);
    // Always persist: fn may mutate objects in place within the same array,
    // so next === list even when state changed.
    persist(next);
    return result;
  };
  const records = () => load();
  const snapshot = () => clone(records());
```

_First 80 of 245 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
