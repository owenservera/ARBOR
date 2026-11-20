# File: studio/test/unit/consolidate-studio-src.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/test/unit/consolidate-studio-src.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13003 B |
| Lines | 237 |
| Hash | f51726bf7e1e |
| Test | yes |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| hex64 | function | 30 | no | const hex64 = (c) =&gt; c.repeat(64); |
| runWith | function | 34 | no | const runWith = (status = &#39;uncertain&#39;) =&gt; ({ id: &#39;run-1&#39;, conversationId: &#39;conv-1&#39;, steps: [{ key: &#39;s1&#39;, tool: &#39;submit_conversation_turn&#39;, argsDigest: hex64(&#39;a&#39;), status }], }); |
| reconciler | function | 38 | no | const reconciler = (verdict) =&gt; () =&gt; ({ verdict, reason: &#39;TEST_RECONCILER&#39; }); |
| fullBinding | const | 39 | no | const fullBinding = { |
| fullJournal | const | 44 | no | const fullJournal = { |
| result | const | 51 | no | const result = reconcileLifecycle({ run: runWith(), stepKey: &#39;s1&#39;, journal: { version: 2, threadKey: &#39;th-1&#39;, turns: [] }, binding: null, reconcileUncertainStep: reconciler(&#39;executed&#39;), origin: &#39;https… |
| result | const | 63 | no | const result = reconcileLifecycle({ run: runWith(), stepKey: &#39;s1&#39;, journal: fullJournal, binding: fullBinding, reconcileUncertainStep: reconciler(&#39;executed&#39;), origin: &#39;https://chat.example&#39; }); |
| result | const | 72 | no | const result = reconcileLifecycle({ run: runWith(), stepKey: &#39;s1&#39;, journal: fullJournal, binding: fullBinding, reconcileUncertainStep: reconciler(&#39;not_executed&#39;), origin: &#39;https://chat.example&#39; }); |
| fakeSession | function | 83 | no | const fakeSession = (store) =&gt; ({ kv: { get: (k, d) =&gt; (Object.hasOwn(store, k) ? store[k] : d) } }); |
| view | const | 86 | no | const view = knowledgeView(fakeSession({ KNOWLEDGE_STATUS: { schema: KNOWLEDGE_STATUS_SCHEMA, status: &#39;complete&#39;, completedAt: &#39;2026-11-20T00:00:00.000Z&#39;, entityCount: 0 }, MODEL: { types: [] }, })); |
| code | function | 98 | no | const code = (e) =&gt; e.code === &#39;KNOWLEDGE_UNAVAILABLE&#39;; |
| view | const | 108 | no | const view = knowledgeView(fakeSession({ MODEL: { types: [] } })); |
| mockRes | function | 115 | no | function mockRes(req) { |
| makeHub | function | 126 | no | function makeHub(t, { knowledgeStatus, model } = {}) { |
| root | const | 127 | no | const root = mkdtempSync(path.join(os.tmpdir(), &#39;studio-consolidate-&#39;)); |
| paths | const | 129 | no | const paths = { root, sessions: path.join(root, &#39;sessions&#39;), learner: path.join(root, &#39;learner&#39;) }; |
| s | const | 130 | no | const s = Session.create(paths.sessions, { site: &#39;test&#39; }); |
| recorder | const | 135 | no | const recorder = Object.assign(new EventEmitter(), { state: &#39;idle&#39;, session: null, status: () =&gt; ({ state: &#39;idle&#39; }) }); |
| calls | const | 136 | no | const calls = []; |
| deriveSession | function | 137 | no | const deriveSession = async (session, profileName) =&gt; { |
| hub | const | 141 | no | const hub = createIntegrationHub({ paths, profileStore: { load: () =&gt; ({}) }, learner: null, recorder, conversationRuntime: { isSessionActive: () =&gt; false }, harnessApi: null, deriveSession, previewR… |
| call | function | 149 | no | async function call(hub, method, pathname, body = {}) { |
| req | const | 150 | no | const req = { method, headers: {}, url: pathname }; |
| res | const | 151 | no | const res = mockRes(req); |
| handled | const | 152 | no | const handled = await hub.handle(req, res, new URL(`http://127.0.0.1${pathname}`), body); |
| res | const | 158 | no | const res = await call(hub, &#39;POST&#39;, `/api/v1/sessions/${sessionId}/derive`, {}); |
| res | const | 171 | no | const res = await call(hub, &#39;GET&#39;, `/api/v1/sessions/${sessionId}/knowledge`, {}); |
| res | const | 182 | no | const res = await call(hub, &#39;GET&#39;, `/api/v1/sessions/${sessionId}/knowledge`, {}); |
| planId | const | 190 | no | const planId = &#39;ctl-0123456789abcdef&#39;; |
| out | const | 191 | no | const out = projectControlLineageSnapshot({ plans: [{ planId, actionId: &#39;send.reply&#39;, risk: &#39;R1&#39;, state: &#39;applied&#39;, source: &#39;host-ui&#39;, createdAt: &#39;2026-11-20T00:00:00.000Z&#39; }] }); |
| plan | const | 198 | no | const plan = out.nodes.find((n) =&gt; n.kind === &#39;control-plan&#39;); |
| planId | const | 206 | no | const planId = &#39;ctl-0123456789abcdef&#39;; |
| base | const | 207 | no | const base = { planId, actionId: &#39;send.reply&#39;, risk: &#39;R2&#39;, state: &#39;failed&#39;, source: &#39;host-ui&#39; }; |
| ok | const | 208 | no | const ok = projectControlLineageSnapshot({ plans: [{ ...base, receipt: { id: planId, status: &#39;failed&#39; } }] }); |
| out | const | 217 | no | const out = projectControlLineageSnapshot({ plans: [{ planId: &#39;ctl-0123456789abcdef&#39;, actionId: &#39;send.reply&#39;, risk: &#39;R3&#39;, state: &#39;uncertain&#39;, source: &#39;host-ui&#39; }], rules: [{ id: &#39;rule-1&#39;, actionId: &#39;… |
| plan | const | 222 | no | const plan = out.nodes.find((n) =&gt; n.kind === &#39;control-plan&#39;); |
| rule | const | 224 | no | const rule = out.nodes.find((n) =&gt; n.kind === &#39;personal-command-rule&#39;); |
| plans | const | 234 | no | const plans = Array.from({ length: 101 }, (_, i) =&gt; ({ planId: `ctl-${String(i).padStart(16, &#39;0&#39;)}`, actionId: &#39;a.b&#39;, risk: &#39;R0&#39;, state: &#39;planned&#39;, source: &#39;x&#39; })); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 18 | external |
| node:assert/strict | import | 19 | external |
| node:events | import | 20 | external |
| node:fs | import | 21 | external |
| node:os | import | 22 | external |
| node:path | import | 23 | external |
| ../../src/studio/core-runtime-bridge.mjs | import | 25 | [studio/src/studio/core-runtime-bridge.mjs](../../src/studio/core-runtime-bridge.mjs.md) |
| ../../src/studio/world-control-lineage.mjs | import | 26 | [studio/src/studio/world-control-lineage.mjs](../../src/studio/world-control-lineage.mjs.md) |
| ../../src/studio/integration-hub.mjs | import | 27 | [studio/src/studio/integration-hub.mjs](../../src/studio/integration-hub.mjs.md) |
| ../../src/store/session.mjs | import | 28 | [studio/src/store/session.mjs](../../src/store/session.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Unit tests for the NEXT:CONSOLIDATE:studio/src/studio build unit (ARBOR).
//
// Owned anchors covered here:
//  - studio/src/studio/core-runtime-bridge.mjs :: reconcileLifecycle (AT-ECC846F6B5BA)
//      the uncertain-outcome boundary: an uncertain step is never promoted to 'executed'
//      without a proven durable binding<->journal join, and nothing ever dispatches/retries.
//  - studio/src/studio/integration-hub.mjs :: knowledge (AT-EE5630007A77)
//      producer (session kv, written by replay/derive.mjs) -> knowledgeView guard -> the
//      versioned /sessions/{id}/knowledge and /sessions/{id}/derive routes (real consumers).
//  - studio/src/studio/world-control-lineage.mjs :: projectControlLineageSnapshot (AT-5E05C518128E)
//      exact Host receipt references (plan id + Host-recorded status), no false effect claim.
//  - studio/src/studio/server.mjs :: deriveSession (AT-64713736D0D1) is NOT imported here:
//      server.mjs currently cannot be loaded in this tree because
//      apps/browser-companion/protocol.mjs (imported by browser-companion/ingress.mjs) is
//      absent; that missing dependency is reported in the unit result, not worked around.
//      Its hub wiring is proven instead through createIntegrationHub's derive route below,
//      which is exactly the call server.mjs makes (server.mjs L164 -> integration-hub L157).
import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { reconcileLifecycle } from '../../src/studio/core-runtime-bridge.mjs';
import { CONTROL_LINEAGE_SCHEMA, projectControlLineageSnapshot } from '../../src/studio/world-control-lineage.mjs';
import { KNOWLEDGE_STATUS_SCHEMA, createIntegrationHub, knowledgeView } from '../../src/studio/integration-hub.mjs';
import { Session } from '../../src/store/session.mjs';

const hex64 = (c) => c.repeat(64);

// ---- core-runtime-bridge.mjs :: reconcileLifecycle --------------------------------

const runWith = (status = 'uncertain') => ({
  id: 'run-1', conversationId: 'conv-1',
  steps: [{ key: 's1', tool: 'submit_conversation_turn', argsDigest: hex64('a'), status }],
});
const reconciler = (verdict) => () => ({ verdict, reason: 'TEST_RECONCILER' });
const fullBinding = {
  source: 'trusted-pre-effect', runId: 'run-1', stepKey: 's1',
  stepTool: 'submit_conversation_turn', argsDigest: hex64('a'), conversationId: 'conv-1',
  threadKey: 'th-1', journalTurnKey: 'turn-1', journalPayloadDigest: hex64('b'),
};
const fullJournal = {
  version: 2, threadKey: 'th-1',
  turns: [{ key: 'turn-1', id: 't1', conversationId: 'conv-1', payloadDigest: hex64('b'),
    boundary: { sessionId: 'sess-1', sequence: 5 } }],
};

test('reconcileLifecycle never promotes an uncertain step to executed without the proven durable join', () => {
  const result = reconcileLifecycle({ run: runWith(), stepKey: 's1', journal: { version: 2, threadKey: 'th-1', turns: [] },
    binding: null, reconcileUncertainStep: reconciler('executed'), origin: 'https://chat.example' });
  // The injected reconciler said 'executed', but with no durable join the projection must not.
  assert.equal(result.effect.verdict, 'still_unknown');
  assert.equal(result.effect.reason, 'DURABLE_JOIN_MISSING_OR_MISMATCHED');
  assert.equal(result.effect.retryAuthorized, false);
  assert.equal(result.dispatched, false);
  assert.equal(result.readOnly, true);
  assert.equal(result.delivery.state, 'unknown');
});

test('reconcileLifecycle projects an executed verdict only with the proven binding-journal join, and never dispatches', () => {
  const result = reconcileLifecycle({ run: runWith(), stepKey: 's1', journal: fullJournal, binding: fullBinding,
    reconcileUncertainStep: reconciler('executed'), origin: 'https://chat.example' });
  assert.equal(result.effect.verdict, 'executed'); // proven join: verified evidence resolves status
  assert.equal(result.effect.retryAuthorized, false);
  assert.equal(result.dispatched, false);
  assert.equal(result.readOnly, true);
});

test('reconcileLifecycle keeps a non-success verdict and never authorizes retry for an unresolved step', () => {
  const result = reconcileLifecycle({ run: runWith(), stepKey: 's1', journal: fullJournal, binding: fullBinding,
    reconcileUncertainStep: reconciler('not_executed'), origin: 'https://chat.example' });
  assert.equal(result.effect.verdict, 'not_executed');
  assert.equal(result.effect.reason, 'UNRESOLVED_EFFECT_NOT_POSITIVELY_RECONCILED');
  assert.equal(result.effect.retryAuthorized, false);
  assert.equal(result.dispatched, false);
  assert.equal(result.readOnly, true);
});
```

_First 80 of 238 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
