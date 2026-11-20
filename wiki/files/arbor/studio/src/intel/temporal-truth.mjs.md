# File: studio/src/intel/temporal-truth.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/intel/temporal-truth.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10116 B |
| Lines | 147 |
| Hash | d366f53617dc |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TEMPORAL_CONTRACT | const | 4 | yes | export const TEMPORAL_CONTRACT = &#39;capture-studio.temporal-truth/1&#39;; |
| TEMPORAL_LENSES | const | 5 | yes | export const TEMPORAL_LENSES = Object.freeze([&#39;observed&#39;, &#39;as-known&#39;, &#39;retrospective&#39;]); |
| TemporalQueryError | class | 7 | yes | export class TemporalQueryError extends Error { |
| constructor | method | 8 | yes | constructor(code, message) { super(message); this.name = &#39;TemporalQueryError&#39;; this.code = code; } |
| fail | function | 10 | no | const fail = (code, message) =&gt; { throw new TemporalQueryError(code, message); }; |
| own | function | 11 | no | const own = (v, k) =&gt; Object.prototype.hasOwnProperty.call(v, k); |
| temporalMillis | function | 14 | yes | export function temporalMillis(value, label = &#39;timestamp&#39;) { |
| t | const | 21 | no | const t = Date.parse(value); |
| normalizeTemporalQuery | function | 26 | yes | export function normalizeTemporalQuery(query) { |
| lens | const | 28 | no | const lens = query.lens; |
| eventAsOf | const | 30 | no | const eventAsOf = temporalMillis(query.eventAsOf, &#39;eventAsOf&#39;); |
| hasKnowledge | const | 31 | no | const hasKnowledge = own(query, &#39;knowledgeAsOf&#39;) &amp;&amp; query.knowledgeAsOf != null; |
| knowledgeAsOf | const | 32 | no | const knowledgeAsOf = hasKnowledge ? temporalMillis(query.knowledgeAsOf, &#39;knowledgeAsOf&#39;) : null; |
| hasRevision | const | 33 | no | const hasRevision = own(query, &#39;modelRevision&#39;) &amp;&amp; query.modelRevision != null; |
| modelRevision | const | 34 | no | const modelRevision = hasRevision ? query.modelRevision : null; |
| observationBoundary | function | 43 | yes | export function observationBoundary(source, eventAsOf) { |
| provenance | const | 49 | no | const provenance = { session, seq, sid: typeof sid === &#39;string&#39; ? sid : null, observedAt: null }; |
| observedAt | variable | 51 | no | let observedAt; |
| gapCount | const | 56 | no | const gapCount = Number.isSafeInteger(gaps) &amp;&amp; gaps &gt;= 0 ? gaps : null; |
| complete | const | 57 | no | const complete = coverage === &#39;complete&#39; &amp;&amp; gapCount === 0 &amp;&amp; !truncated &amp;&amp; !preAttachUnknown; |
| savedAt | function | 62 | no | const savedAt = (snap) =&gt; { |
| revisions | function | 66 | no | const revisions = (journal) =&gt; { |
| all | const | 69 | no | const all = journal.versions(); |
| selectTemporalModel | function | 75 | yes | export function selectTemporalModel(journal, query) { |
| q | const | 76 | no | const q = normalizeTemporalQuery(query); |
| known | const | 78 | no | const known = revisions(journal); |
| snapshot | const | 81 | no | const snapshot = journal.at(q.modelRevision); // delegated integrity verification |
| lastTime | variable | 86 | no | let lastTime = -1, candidate = null; |
| snapshot | const | 88 | no | const snapshot = journal.at(revision); // validate each historical integrity boundary |
| t | const | 89 | no | const t = savedAt(snapshot); |
| temporalPerspective | function | 104 | yes | export function temporalPerspective({ query, source, journal, interpret, derivation = null }) { |
| q | const | 105 | no | const q = normalizeTemporalQuery(query); |
| evidence | const | 106 | no | const evidence = observationBoundary(source, q.eventAsOf); |
| selected | const | 107 | no | const selected = q.lens === &#39;observed&#39; ? { status: &#39;not-applicable&#39;, revision: null, savedAt: null } : selectTemporalModel(journal, q); |
| notYetKnown | const | 108 | no | const notYetKnown = q.lens === &#39;as-known&#39; &amp;&amp; evidence.provenance?.observedAt != null &amp;&amp; |
| eligible | const | 110 | no | const eligible = (evidence.state === &#39;observed&#39; \|\| evidence.state === &#39;partial&#39;) &amp;&amp; !notYetKnown; |
| mayInterpret | const | 111 | no | const mayInterpret = eligible &amp;&amp; selected.status === &#39;selected&#39; &amp;&amp; typeof interpret === &#39;function&#39;; |
| prediction | const | 112 | no | const prediction = mayInterpret ? interpret(selected.snapshot) : null; |
| metadataValid | const | 113 | no | const metadataValid = !!(derivation &amp;&amp; selected.status === &#39;selected&#39; &amp;&amp; derivation.modelRevision === selected.revision &amp;&amp; typeof derivation.recipeVersion === &#39;string&#39; &amp;&amp; derivation.recipeVersion.len… |
| historicalDerivation | variable | 117 | no | let historicalDerivation = false; |
| compareTemporalRevisions | function | 138 | yes | export function compareTemporalRevisions({ journal, before, after, interpret }) { |
| all | const | 140 | no | const all = revisions(journal); |
| first | const | 142 | no | const first = journal.at(before), second = journal.at(after); |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Capture Studio L4/L5 temporal truth boundary. No raw-log, graph, server or CLI writes.
// Event time describes observations; knowledge time describes availability of a model;
// a retrospective interpretation must never masquerade as a historical belief.
export const TEMPORAL_CONTRACT = 'capture-studio.temporal-truth/1';
export const TEMPORAL_LENSES = Object.freeze(['observed', 'as-known', 'retrospective']);

export class TemporalQueryError extends Error {
  constructor(code, message) { super(message); this.name = 'TemporalQueryError'; this.code = code; }
}
const fail = (code, message) => { throw new TemporalQueryError(code, message); };
const own = (v, k) => Object.prototype.hasOwnProperty.call(v, k);

// Reject local/unzoned timestamps. Numeric timestamps are epoch milliseconds only.
export function temporalMillis(value, label = 'timestamp') {
  if (typeof value === 'number') {
    if (Number.isSafeInteger(value) && value >= 0) return value;
    fail('INVALID_TIME', label + ' must be a nonnegative epoch-millisecond integer');
  }
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?(?:Z|[+-]\d\d:\d\d)$/.test(value))
    fail('INVALID_TIME', label + ' must carry an explicit UTC offset');
  const t = Date.parse(value);
  if (!Number.isSafeInteger(t) || t < 0) fail('INVALID_TIME', label + ' is not a valid instant');
  return t;
}

export function normalizeTemporalQuery(query) {
  if (!query || typeof query !== 'object' || Array.isArray(query)) fail('INVALID_QUERY', 'A temporal query object is required');
  const lens = query.lens;
  if (!TEMPORAL_LENSES.includes(lens)) fail('INVALID_LENS', 'Choose observed, as-known or retrospective explicitly');
  const eventAsOf = temporalMillis(query.eventAsOf, 'eventAsOf');
  const hasKnowledge = own(query, 'knowledgeAsOf') && query.knowledgeAsOf != null;
  const knowledgeAsOf = hasKnowledge ? temporalMillis(query.knowledgeAsOf, 'knowledgeAsOf') : null;
  const hasRevision = own(query, 'modelRevision') && query.modelRevision != null;
  const modelRevision = hasRevision ? query.modelRevision : null;
  if (hasRevision && (!Number.isSafeInteger(modelRevision) || modelRevision < 0)) fail('INVALID_REVISION', 'modelRevision must be a nonnegative safe integer');
  if (lens === 'observed' && (hasKnowledge || hasRevision)) fail('AMBIGUOUS_LENS', 'Raw observations have no model revision or knowledge-time selector');
  if (lens === 'as-known' && !hasKnowledge) fail('KNOWLEDGE_TIME_REQUIRED', 'As-known requires an explicit knowledgeAsOf');
  if (lens === 'retrospective' && !hasRevision) fail('MODEL_REVISION_REQUIRED', 'Retrospective reconstruction requires a pinned modelRevision');
  return { lens, eventAsOf, knowledgeAsOf, modelRevision };
}

// An L1/L2 locator, not proof of identity, completeness, acceptance or semantic truth.
export function observationBoundary(source, eventAsOf) {
  if (!source || typeof source !== 'object') return { state: 'unavailable', reason: 'NO_SOURCE_REFERENCE', provenance: null };
  const { session, seq, sid = null, t, coverage = 'unknown', gaps = 0, truncated = false, preAttachUnknown = false } = source;
  if (typeof session !== 'string' || !session || !Number.isSafeInteger(seq) || seq < 0)
    return { state: 'unavailable', reason: 'INVALID_SOURCE_REFERENCE', provenance: null };
  // Preserve only locator + fidelity metadata; never echo captured text, tokens or body.
  const provenance = { session, seq, sid: typeof sid === 'string' ? sid : null, observedAt: null };
  if (t == null) return { state: 'unknown-time', reason: 'UNTIMED_EVIDENCE', provenance };
  let observedAt;
  try { observedAt = temporalMillis(t, 'source.t'); }
  catch { return { state: 'unknown-time', reason: 'INVALID_SOURCE_TIME', provenance }; }
  provenance.observedAt = observedAt;
  if (observedAt > eventAsOf) return { state: 'not-yet-observed', reason: 'FUTURE_EVIDENCE', provenance };
  const gapCount = Number.isSafeInteger(gaps) && gaps >= 0 ? gaps : null;
  const complete = coverage === 'complete' && gapCount === 0 && !truncated && !preAttachUnknown;
  return { state: complete ? 'observed' : 'partial', reason: complete ? null : 'COVERAGE_UNVERIFIED',
    provenance, fidelity: { gaps: gapCount, truncated: !!truncated, preAttachUnknown: !!preAttachUnknown } };
}

const savedAt = (snap) => {
  try { return snap?.savedAt == null ? null : temporalMillis(snap.savedAt, 'snapshot.savedAt'); }
  catch { return null; }
};
const revisions = (journal) => {
  if (!journal || typeof journal.versions !== 'function' || typeof journal.at !== 'function')
    fail('JOURNAL_REQUIRED', 'A versioned immutable learner journal is required');
  const all = journal.versions();
  if (!Array.isArray(all) || all.some((r, i) => !Number.isSafeInteger(r) || r < 0 || (i > 0 && r <= all[i - 1])))
    fail('INVALID_JOURNAL', 'Learner revisions must be ordered and unique');
  return all;
};

export function selectTemporalModel(journal, query) {
  const q = normalizeTemporalQuery(query);
  if (q.lens === 'observed') return { status: 'not-applicable', revision: null, savedAt: null, snapshot: null };
  const known = revisions(journal);
  if (q.lens === 'retrospective') {
    if (!known.includes(q.modelRevision)) return { status: 'unavailable', reason: 'REVISION_NOT_FOUND', revision: q.modelRevision };
```

_First 80 of 148 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
