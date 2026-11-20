# File: studio/src/studio/systems-probes.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/systems-probes.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12220 B |
| Lines | 200 |
| Hash | 85d283e17c24 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SCHEMA | const | 6 | yes | export const SCHEMA = &#39;aion.systems-s1/1&#39;; |
| key | function | 7 | no | const key = (v) =&gt; JSON.stringify(v); |
| uniq | function | 8 | no | const uniq = (items) =&gt; new Set(items); |
| nonempty | function | 9 | no | const nonempty = (v) =&gt; typeof v === &#39;string&#39; &amp;&amp; v.length &gt; 0; |
| obj | function | 10 | no | const obj = (v) =&gt; v !== null &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v); |
| scopeKey | function | 11 | yes | export const scopeKey = (s) =&gt; key([s?.siteId ?? null, s?.origin ?? null, s?.account ?? null, s?.surface ?? null]); |
| deny | function | 12 | no | const deny = (reason, detail = {}) =&gt; ({ ok: false, decision: &#39;abstain&#39;, reason, ...detail }); |
| qualifyHoldout | function | 18 | yes | export function qualifyHoldout({ train, heldout, expectedScope } = {}) { |
| seenIds | const | 21 | no | const seenIds = new Set(), seenLineage = new Set(); |
| assessDrift | function | 43 | yes | export function assessDrift({ scope, incumbent, proposal, observations, minSessions = 3, minWindows = 2 } = {}) { |
| sessions | const | 47 | no | const sessions = new Map(), windows = new Map(); |
| id | const | 55 | no | const id = key([o.lineage, o.candidate]); |
| prev | const | 56 | no | const prev = sessions.get(id); |
| positives | const | 61 | no | const positives = [...sessions.values()].filter(o =&gt; o.candidate === proposal &amp;&amp; o.outcome === &#39;present&#39;); |
| negativeOld | const | 62 | no | const negativeOld = [...sessions.values()].filter(o =&gt; o.candidate === incumbent &amp;&amp; o.outcome === &#39;absent&#39;); |
| ordered | const | 64 | no | const ordered = [...windows.keys()].sort((a,b)=&gt;a-b); |
| consecutive | variable | 65 | no | let consecutive = 0, best = 0, prev = -2; |
| auditEffectTrace | function | 79 | yes | export function auditEffectTrace({ binding, events = [] } = {}) { |
| dispatched | variable | 83 | no | let dispatched = 0, delivered = 0, blocked = 0, completed = 0; |
| lastSeq | variable | 84 | no | let lastSeq = -1; |
| createBoundedProjection | function | 110 | yes | export function createBoundedProjection({ maxStreams = 64, maxChars = 8192 } = {}) { |
| state | const | 113 | no | const state = new Map(); |
| metrics | const | 114 | no | const metrics = { accepted: 0, stale: 0, overflow: 0, uiGaps: 0, maxTracked: 0 }; |
| id | const | 120 | no | const id = key([e.scopeKey, e.streamId]); |
| old | const | 121 | no | const old = state.get(id); |
| clipped | const | 124 | no | const clipped = e.text.length &gt; maxChars; |
| qualifyProvenance | function | 141 | yes | export function qualifyProvenance({ acceptance, validatedByCore = false, source, expectedScope, refs } = {}) { |
| exploreAdmissionSchedules | function | 169 | yes | export function exploreAdmissionSchedules({ conflictingIntent = false } = {}) { |
| orders | const | 170 | no | const orders=[]; |
| enumerate | function | 171 | no | function enumerate(a,b,out) { |
| simulate | function | 177 | no | const simulate=(schedule, atomic)=&gt;{ |
| owner | variable | 178 | no | let owner=null, dispatch=0, conflicts=0; |
| sawEmpty | const | 179 | no | const sawEmpty={A:false,B:false},admitted={A:false,B:false}; |
| who | const | 181 | no | const who=instruction[0], step=Number(instruction[1]); |
| count | function | 192 | no | const count=(atomic)=&gt;{ |
| a | const | 193 | no | const a=orders.map(x=&gt;simulate(x,atomic)); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/scripts/bench-agent14-systems.mjs](../../scripts/bench-agent14-systems.mjs.md) | ../src/studio/systems-probes.mjs |
| [studio/src/studio/four-lane-gates.mjs](./four-lane-gates.mjs.md) | ./systems-probes.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
/**
 * AION Systems S1: pure, read-only contract probes for an integration candidate.
 * No CDP, filesystem writes, network, sending, acceptance mutation, or browser effects.
 * Node >=22. Synthetic diagnostics, NOT installed runtime safeguards.
 */
export const SCHEMA = 'aion.systems-s1/1';
const key = (v) => JSON.stringify(v);
const uniq = (items) => new Set(items);
const nonempty = (v) => typeof v === 'string' && v.length > 0;
const obj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
export const scopeKey = (s) => key([s?.siteId ?? null, s?.origin ?? null, s?.account ?? null, s?.surface ?? null]);
const deny = (reason, detail = {}) => ({ ok: false, decision: 'abstain', reason, ...detail });

/** Both sides must be SERVER-SOURCED immutable session manifests. IDs alone are inadequate
 * because reexports and remounts can have new IDs sharing the same evidence lineage.
 * There is no implicit cross-account or partial-capture fallback.
 */
export function qualifyHoldout({ train, heldout, expectedScope } = {}) {
  if (!Array.isArray(train) || !Array.isArray(heldout) || train.length === 0 || heldout.length === 0)
    return deny('MISSING_INDEPENDENT_SETS');
  const seenIds = new Set(), seenLineage = new Set();
  for (const [name, set] of [['train', train], ['heldout', heldout]]) {
    for (const s of set) {
      if (!obj(s) || !nonempty(s.id) || !nonempty(s.lineage) || !obj(s.scope) ||
          !nonempty(s.scope.origin) || !nonempty(s.scope.siteId) || !nonempty(s.scope.account) || !nonempty(s.scope.surface) ||
          !nonempty(s.sourceDigest) || s.coverage !== 'complete' || s.coreAccepted !== true || s.sourceQualified !== true)
        return deny('UNQUALIFIED_SESSION', { set: name });
      if (expectedScope && scopeKey(s.scope) !== scopeKey(expectedScope))
        return deny('SCOPE_MISMATCH', { set: name });
      if (seenIds.has(s.id)) return deny('SESSION_ID_REUSED', { set: name });
      if (seenLineage.has(s.lineage)) return deny('EVIDENCE_LINEAGE_REUSED', { set: name });
      seenIds.add(s.id); seenLineage.add(s.lineage);
    }
  }
  return { ok: true, decision: 'qualify-shadow-only', trainSessions: train.length,
    heldoutSessions: heldout.length, independentLineages: seenLineage.size, sendPermission: false };
}

/** A drift candidate earns read-only-review eligibility only when positive observations
 * span independent qualified sessions and consecutive windows, with old-selector negatives
 * qualified separately. This never promotes profiles or grants effects.
 */
export function assessDrift({ scope, incumbent, proposal, observations, minSessions = 3, minWindows = 2 } = {}) {
  if (!obj(scope) || !nonempty(incumbent) || !nonempty(proposal) || incumbent === proposal || !Array.isArray(observations))
    return deny('INVALID_DRIFT_INPUT');
  if (minSessions < 2 || minWindows < 2) return deny('INSUFFICIENT_INDEPENDENCE_POLICY');
  const sessions = new Map(), windows = new Map();
  for (const o of observations) {
    if (!obj(o) || !obj(o.scope) || scopeKey(o.scope) !== scopeKey(scope)) return deny('SCOPE_MISMATCH');
    if (!nonempty(o.session) || !nonempty(o.lineage) || !Number.isSafeInteger(o.window) || o.window < 0 ||
        !['present','absent','unknown'].includes(o.outcome) || ![incumbent,proposal].includes(o.candidate))
      return deny('INVALID_OBSERVATION');
    if (o.sourceQualified !== true || o.coreAccepted !== true || o.coverage !== 'complete')
      return deny('UNQUALIFIED_DRIFT_EVIDENCE');
    const id = key([o.lineage, o.candidate]);
    const prev = sessions.get(id);
    if (prev && (prev.outcome !== o.outcome || prev.window !== o.window || prev.session !== o.session))
      return deny('CONFLICTING_SESSION_EVIDENCE');
    sessions.set(id, o);
  }
  const positives = [...sessions.values()].filter(o => o.candidate === proposal && o.outcome === 'present');
  const negativeOld = [...sessions.values()].filter(o => o.candidate === incumbent && o.outcome === 'absent');
  for (const o of positives) windows.set(o.window, (windows.get(o.window) || 0) + 1);
  const ordered = [...windows.keys()].sort((a,b)=>a-b);
  let consecutive = 0, best = 0, prev = -2;
  for (const w of ordered) { consecutive = w === prev + 1 ? consecutive + 1 : 1; best = Math.max(best, consecutive); prev = w; }
  if (uniq(positives.map(x=>x.lineage)).size < minSessions || best < minWindows ||
      uniq(negativeOld.map(x=>x.lineage)).size < 2)
    return { ...deny('MORE_INDEPENDENT_EVIDENCE_REQUIRED'), proposalVotes: positives.length,
      incumbentNegativeVotes: negativeOld.length, consecutiveWindows: best };
  return { ok: true, decision: 'shadow-revalidate-read-only', proposalVotes: positives.length,
    incumbentNegativeVotes: negativeOld.length, consecutiveWindows: best,
    rollbackPointerRequired: true, sendPermission: false };
}

/** An intent trace is a diagnostic cross-layer consistency check, not journal ownership.
 * Never infer not-dispatched from absence of a delivery, or successful reply from a send.
 */
export function auditEffectTrace({ binding, events = [] } = {}) {
  if (!obj(binding) || !['runId','stepKey','tool','argsDigest','conversationId','threadKey','journalTurnKey','journalPayloadDigest']
```

_First 80 of 201 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
