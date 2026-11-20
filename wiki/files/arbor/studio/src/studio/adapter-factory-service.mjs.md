# File: studio/src/studio/adapter-factory-service.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/adapter-factory-service.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 16478 B |
| Lines | 293 |
| Hash | 2dbc06b6efa8 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| bareHost | function | 23 | no | const bareHost = (value) =&gt; { |
| v | variable | 24 | no | let v = String(value ?? &#39;&#39;).trim().toLowerCase(); |
| originOf | function | 33 | no | const originOf = (url) =&gt; { |
| AdapterFactoryError | class | 37 | yes | export class AdapterFactoryError extends Error { |
| constructor | method | 38 | yes | constructor(code, message) { super(message); this.name = &#39;AdapterFactoryError&#39;; this.code = code; } |
| sessionOrigin | function | 41 | no | function sessionOrigin(session) { |
| url | const | 42 | no | const url = session?.kv?.get?.(&#39;RECEIPT&#39;)?.pageUrl ?? session?.meta?.target?.url ?? null; |
| READ_FEATURES | const | 50 | no | const READ_FEATURES = new Set([&#39;user-turn&#39;, &#39;assistant-turn&#39;, &#39;thread-route&#39;, &#39;citation&#39;, &#39;artifact&#39;, &#39;task-progress&#39;, &#39;stream-component&#39;]); |
| learnedAdapterFromCandidate | function | 51 | yes | export function learnedAdapterFromCandidate(candidate, shadow) { |
| confirmed | const | 52 | no | const confirmed = new Set(Array.isArray(shadow?.coverage) ? shadow.coverage : []); |
| activated | const | 53 | no | const activated = [...confirmed].filter((f) =&gt; READ_FEATURES.has(f) &amp;&amp; candidate.features?.[f]?.selected?.status === &#39;shadow-ready&#39;).sort(); |
| sel | function | 54 | no | const sel = (f) =&gt; (activated.includes(f) ? candidate.features[f].selected.candidate : null); |
| userTurn | const | 55 | no | const userTurn = sel(&#39;user-turn&#39;); |
| assistantTurn | const | 56 | no | const assistantTurn = sel(&#39;assistant-turn&#39;); |
| route | const | 57 | no | const route = sel(&#39;thread-route&#39;); |
| stream | const | 58 | no | const stream = sel(&#39;stream-component&#39;); |
| host | const | 59 | no | const host = bareHost(candidate.origin); |
| createAdapterFactory | function | 85 | yes | export function createAdapterFactory({ learnedStore } = {}) { |
| collectProbes | function | 88 | no | const collectProbes = (sessions, { siteId, origin, surface }) =&gt; { |
| probes | const | 89 | no | const probes = []; |
| sessionOrigins | const | 90 | no | const sessionOrigins = new Map(); |
| o | const | 92 | no | const o = sessionOrigin(s); |
| reserved | function | 107 | no | const reserved = (name) =&gt; typeof name === &#39;string&#39; &amp;&amp; I1_NAMESPACE_RE.test(name); |
| refuseReserved | function | 108 | no | const refuseReserved = (name) =&gt; { |
| loadCandidateRecord | function | 113 | no | const loadCandidateRecord = (name) =&gt; { |
| prior | variable | 127 | no | let prior = null; |
| basis | variable | 128 | no | let basis = null; |
| priorRecord | const | 130 | no | const priorRecord = loadCandidateRecord(priorName); |
| observations | const | 135 | no | const observations = collectProbes(sessions, { siteId, origin, surface }); |
| candidate | const | 139 | no | const candidate = synthesizeWebappAdapter({ siteId, origin, surface, observations, prior }); |
| observations | const | 158 | no | const observations = collectProbes(sessions, { siteId: candidate.siteId, origin: candidate.origin, surface: candidate.surface }); |
| basis | const | 179 | no | const basis = candidate.basis ?? null; |
| recomputed | const | 188 | no | const recomputed = this.shadowEvaluate({ candidate, sessions }); |
| adapter | const | 195 | no | const adapter = learnedAdapterFromCandidate(candidate, recomputed); |
| digest | const | 198 | no | const digest = candidateDigest(candidate); |
| claimedDigest | const | 199 | no | const claimedDigest = typeof candidate.digest === &#39;string&#39; ? candidate.digest : null; |
| rec | const | 200 | no | const rec = learnedStore.compareAndSave(candidate.siteId, { schema: FACTORY_SCHEMA, candidate: { ...candidate, digest }, candidateDigest: digest, digestMatchedClaim: claimedDigest === null ? null : c… |
| rec | const | 222 | no | const rec = learnedStore.compareAndRollback(name, version, { expectedVersion }); |
| v | variable | 228 | no | let v = null; |
| versions | variable | 229 | no | let versions = []; |
| summary | variable | 231 | no | let summary = null; |
| rec | const | 233 | no | const rec = learnedStore.load(name); |
| rec | const | 249 | no | const rec = loadCandidateRecord(name); |
| rec | const | 255 | no | const rec = loadCandidateRecord(name); |
| snapshot | function | 263 | no | const snapshot = () =&gt; { |
| byHost | const | 264 | no | const byHost = new Map(); |
| rec | const | 266 | no | const rec = loadCandidateRecord(entry.name); |
| raw | const | 275 | no | const raw = String(idOrHost ?? &#39;&#39;).trim().toLowerCase(); |
| byHost | const | 277 | no | const byHost = snapshot(); |
| direct | const | 278 | no | const direct = byHost.get(raw); |
| host | const | 280 | no | const host = bareHost(raw); |
| byHost | const | 284 | no | const byHost = snapshot(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../store/versioned.mjs | import | 19 | [studio/src/store/versioned.mjs](../store/versioned.mjs.md) |
| ./adaptive-adapter-factory.mjs | import | 20 | [studio/src/studio/adaptive-adapter-factory.mjs](./adaptive-adapter-factory.mjs.md) |
| ./adapter-probes.mjs | import | 21 | [studio/src/studio/adapter-probes.mjs](./adapter-probes.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/integration-hub.mjs](./integration-hub.mjs.md) | ./adapter-factory-service.mjs |
| [studio/src/studio/server.mjs](./server.mjs.md) | ./adapter-factory-service.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Adapter factory service — the lifecycle owner for learned, data-only webapp adapters.
//
// Wires Capture Studio's existing evidence (derived sessions, live read-only DOM measurement)
// to Agent 14's pure factory module (src/studio/adaptive-adapter-factory.mjs):
//
//   synthesize(sessionIds)          -> candidate (pure; nothing persisted, nothing activated)
//   shadowEvaluate(candidate, ids)  -> held-out shadow receipt (pure)
//   promote(candidate, ids)         -> server-side RE-VERIFICATION, then a versioned save
//   rollback(name, version)         -> VersionedStore pointer move (no re-synthesis)
//   registryProvider()              -> the read-only view the sites registry exposes
//
// Non-negotiable invariants (Agent 14 Round 8 README + Core Issue #68):
//   - A learned adapter is data-only and read-only. It NEVER enters the execution path
//     (getAdapter for drive/send keeps returning handwritten seeds only) and carries
//     send.strategy 'learned-readonly' + authority.sendPermission=false as defense in depth.
//   - Promotion requires the shadow evaluation to be RE-COMPUTED server-side from held-out
//     sessions; a client-supplied receipt alone never promotes anything.
//   - No second registry, no second browser actor, no send grant, no auto-execution.
import { VersionedStore, I1_NAMESPACE_RE, validateExpectedVersion } from '../store/versioned.mjs';
import { synthesizeWebappAdapter, shadowEvaluateAdapter, candidateDigest, FACTORY_SCHEMA } from './adaptive-adapter-factory.mjs';
import { probesFromSession, scopeProbes } from './adapter-probes.mjs';

const bareHost = (value) => {
  let v = String(value ?? '').trim().toLowerCase();
  if (!v) return '';
  v = v.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');
  v = v.split('/')[0].split('?')[0].split('#')[0];
  v = v.split('@').pop();
  v = v.replace(/:\d+$/, '');
  return v.replace(/^www\./, '');
};

const originOf = (url) => {
  try { return new URL(String(url)).origin; } catch { return null; }
};

export class AdapterFactoryError extends Error {
  constructor(code, message) { super(message); this.name = 'AdapterFactoryError'; this.code = code; }
}

function sessionOrigin(session) {
  const url = session?.kv?.get?.('RECEIPT')?.pageUrl ?? session?.meta?.target?.url ?? null;
  return url ? originOf(url) : null;
}

// Build the data-only, read-only adapter object published to the registry's read view.
// Activated features = held-out-CONFIRMED (shadow.coverage) ∩ factory READ_FEATURES ∩
// candidate shadow-ready. composer/send-control/stop-control are write-surface features the
// factory never reports as read features; they can never appear on a learned adapter.
const READ_FEATURES = new Set(['user-turn', 'assistant-turn', 'thread-route', 'citation', 'artifact', 'task-progress', 'stream-component']);
export function learnedAdapterFromCandidate(candidate, shadow) {
  const confirmed = new Set(Array.isArray(shadow?.coverage) ? shadow.coverage : []);
  const activated = [...confirmed].filter((f) => READ_FEATURES.has(f) && candidate.features?.[f]?.selected?.status === 'shadow-ready').sort();
  const sel = (f) => (activated.includes(f) ? candidate.features[f].selected.candidate : null);
  const userTurn = sel('user-turn');
  const assistantTurn = sel('assistant-turn');
  const route = sel('thread-route');
  const stream = sel('stream-component');
  const host = bareHost(candidate.origin);
  return {
    id: candidate.siteId,
    label: `${candidate.siteId} (learned)`,
    hosts: [host],
    url: candidate.origin,
    learned: true,
    readOnly: true,
    // Defense in depth: even if this object ever reached a send path, the strategy is an
    // explicit refusal consumed by src/capture/actions.mjs sendMessage().
    send: { strategy: 'learned-readonly' },
    ...(userTurn ? { userTurn: { selectors: [userTurn] } } : {}),
    ...(assistantTurn ? { assistantTurn: { selectors: [assistantTurn] } } : {}),
    ...(route ? { threadRoute: { pattern: route } } : {}),
    ...(stream ? { streamHints: { urlPatterns: [stream] } } : {}),
    authority: { ...candidate.authority, sendPermission: false, autoExecution: false },
    factory: {
      schema: FACTORY_SCHEMA,
      origin: candidate.origin,
      surface: candidate.surface,
      shadow: { recommendation: shadow?.recommendation ?? null, checked: shadow?.checked ?? 0, positive: shadow?.positive ?? 0, contradicted: shadow?.contradicted ?? 0 },
      readFeatures: activated,
```

_First 80 of 294 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
