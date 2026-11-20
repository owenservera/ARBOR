# File: studio/src/intel/profile-evidence.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/intel/profile-evidence.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7178 B |
| Lines | 90 |
| Hash | bec4937f8d81 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PROFILE_EVIDENCE_SCHEMA | const | 3 | yes | export const PROFILE_EVIDENCE_SCHEMA = &#39;capture-studio.profile-evidence/1&#39;; |
| ACCEPTANCE_SCHEMA | const | 4 | no | const ACCEPTANCE_SCHEMA = &#39;capture-studio.acceptance/1&#39;; |
| GATES | const | 5 | no | const GATES = [&#39;G1&#39;,&#39;G2&#39;,&#39;G3&#39;,&#39;G4&#39;,&#39;G5&#39;,&#39;G6&#39;,&#39;G7&#39;]; |
| object | function | 6 | no | const object = x =&gt; !!x &amp;&amp; typeof x === &#39;object&#39; &amp;&amp; !Array.isArray(x); |
| bounded | function | 7 | no | const bounded = (n, fallback, cap) =&gt; Number.isSafeInteger(n) &amp;&amp; n &gt; 0 ? Math.min(n, cap) : fallback; |
| profileAdmission | function | 9 | yes | export function profileAdmission(acceptance, { validatedByCore = false } = {}) { |
| b | const | 14 | no | const b = acceptance.binding; |
| origin | function | 21 | no | function origin(url) { |
| pathParts | function | 25 | no | const pathParts = path =&gt; String(path ?? &#39;&#39;).replace(/^\\$\\.?/, &#39;&#39;).replace(/\\[\\d+\\]/g,&#39;[*]&#39;).split(/\\.\|(?=\\[\\*\\])/).filter(Boolean); |
| canonicalPath | function | 26 | no | const canonicalPath = path =&gt; &#39;$.&#39; + pathParts(path).join(&#39;.&#39;).replace(/\\.\\[\\*\\]/g,&#39;[*]&#39;); |
| parentOf | function | 27 | no | const parentOf = path =&gt; { const parts=pathParts(path);parts.pop();return parts.length ? &#39;$.&#39;+parts.join(&#39;.&#39;).replace(/\\.\\[\\*\\]/g,&#39;[*]&#39;) : &#39;$&#39;; }; |
| idOf | function | 28 | no | const idOf = item =&gt; String(item?.id ?? item?.key ?? item?.kind ?? &#39;&#39;); |
| profileEvidenceView | function | 32 | yes | export function profileEvidenceView({ pageUrl, sessionId, account = null, shapes, partition, acceptance, validatedByCore = false, maxFields = 100 } = {}) { |
| expectedOrigin | const | 33 | no | const expectedOrigin = origin(pageUrl); |
| admitted | const | 34 | no | const admitted = profileAdmission(acceptance, { validatedByCore }); |
| scope | const | 35 | no | const scope = { origin: expectedOrigin, account: typeof account === &#39;string&#39; &amp;&amp; account ? account : null, session: sessionId ?? null }; |
| limit | const | 42 | no | const limit = bounded(maxFields, 100, 250); |
| collected | const | 43 | no | const collected = [], seen = new Set(); |
| path | const | 48 | no | const path = canonicalPath(rawPath); |
| key | const | 49 | no | const key = JSON.stringify([group.endpoint, path]); |
| suggestions | const | 58 | no | const suggestions = (Array.isArray(shapes.suggestions) ? shapes.suggestions : []).slice(0,limit) |
| partial | const | 65 | no | const partial = collected.length === limit \|\| (partition.totals?.unknown ?? 0) &gt; 0 \|\| (partition.totals?.other ?? 0) &gt; 0 \|\| |
| profileStructuralDrift | function | 80 | yes | export function profileStructuralDrift(before, after) { |
| key | function | 85 | no | const key = f =&gt; JSON.stringify([f.endpoint, f.path]); |
| A | const | 86 | no | const A = new Set(before.fields.map(key)), B = new Set(after.fields.map(key)); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/adapter-accepted-session.mjs](../studio/adapter-accepted-session.mjs.md) | ../intel/profile-evidence.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// L4/L5 read-only profile review projection; consumes, never duplicates, Core shapes,
// stream-origin partition and acceptance producer. No profile, browser or learner writes.
export const PROFILE_EVIDENCE_SCHEMA = 'capture-studio.profile-evidence/1';
const ACCEPTANCE_SCHEMA = 'capture-studio.acceptance/1';
const GATES = ['G1','G2','G3','G4','G5','G6','G7'];
const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
const bounded = (n, fallback, cap) => Number.isSafeInteger(n) && n > 0 ? Math.min(n, cap) : fallback;

export function profileAdmission(acceptance, { validatedByCore = false } = {}) {
  if (!validatedByCore) return { eligible: false, state: 'unverified', reason: 'CORE_BINDING_NOT_VALIDATED' };
  if (!object(acceptance) || acceptance.schema !== ACCEPTANCE_SCHEMA) return { eligible: false, state: 'unknown', reason: 'INVALID_ACCEPTANCE_DOCUMENT' };
  if (acceptance.verdict !== 'capture_accepted') return { eligible: false, state: acceptance.verdict || 'unknown', reason: 'CAPTURE_NOT_ACCEPTED' };
  if (!GATES.every(id => acceptance.gates?.[id]?.value === 'passed')) return { eligible: false, state: 'inconsistent', reason: 'GATES_NOT_PASSED' };
  const b = acceptance.binding;
  if (!/^[a-f0-9]{64}$/.test(b?.rawDigest ?? '') || !Number.isSafeInteger(b?.seqRange?.[0]) || !Number.isSafeInteger(b?.seqRange?.[1]) || b.seqRange[0] > b.seqRange[1] ||
      typeof b.recipe?.id !== 'string' || !b.recipe.id || !Number.isSafeInteger(b.recipe?.version))
    return { eligible: false, state: 'inconsistent', reason: 'INCOMPLETE_ACCEPTANCE_BINDING' };
  return { eligible: true, state: 'accepted', reason: null, sourceDigest: b.rawDigest, recipe: { id: b.recipe.id, version: b.recipe.version } };
}

function origin(url) {
  try { const u = new URL(url); return ['http:','https:'].includes(u.protocol) ? u.origin : null; }
  catch { return null; }
}
const pathParts = path => String(path ?? '').replace(/^\$\.?/, '').replace(/\[\d+\]/g,'[*]').split(/\.|(?=\[\*\])/).filter(Boolean);
const canonicalPath = path => '$.' + pathParts(path).join('.').replace(/\.\[\*\]/g,'[*]');
const parentOf = path => { const parts=pathParts(path);parts.pop();return parts.length ? '$.'+parts.join('.').replace(/\.\[\*\]/g,'[*]') : '$'; };
const idOf = item => String(item?.id ?? item?.key ?? item?.kind ?? '');

// Structural-only output. Ordered field lists and nested parent locators are preserved.
// Suggestions are those already produced by the Core shape engine, not relabelled facts.
export function profileEvidenceView({ pageUrl, sessionId, account = null, shapes, partition, acceptance, validatedByCore = false, maxFields = 100 } = {}) {
  const expectedOrigin = origin(pageUrl);
  const admitted = profileAdmission(acceptance, { validatedByCore });
  const scope = { origin: expectedOrigin, account: typeof account === 'string' && account ? account : null, session: sessionId ?? null };
  if (!expectedOrigin || !sessionId || typeof sessionId !== 'string' || !object(shapes)) {
    return { schema: PROFILE_EVIDENCE_SCHEMA, scope, status: 'unavailable', reason: 'MISSING_SITE_OR_SHAPES', admission: admitted, fields: [], suggestions: [], limitations: ['no-source-evidence'] };
  }
  if (!object(partition) || partition.site?.origin !== expectedOrigin) {
    return { schema: PROFILE_EVIDENCE_SCHEMA, scope, status: 'unavailable', reason: 'ORIGIN_PARTITION_UNVERIFIED', admission: admitted, fields: [], suggestions: [], limitations: ['no-origin-qualified-evidence'] };
  }
  const limit = bounded(maxFields, 100, 250);
  const collected = [], seen = new Set();
  for (const group of Array.isArray(shapes.groups) ? shapes.groups : []) {
    if (!object(group) || typeof group.endpoint !== 'string') continue;
    for (const [rawPath, detail] of Object.entries(object(group.fields) ? group.fields : {})) {
      if (collected.length >= limit) break;
      const path = canonicalPath(rawPath);
      const key = JSON.stringify([group.endpoint, path]);
      if (seen.has(key)) continue;
      seen.add(key);
      collected.push({ endpoint: group.endpoint, path, parentPath: parentOf(path), order: collected.length,
        observations: Number.isSafeInteger(detail?.count) && detail.count >= 0 ? detail.count : null,
        kind: 'observed-structural-field', source: { session: sessionId, path },
        confidence: 'unmeasured', provenance: 'SHAPES-group', status: 'observed' });
    }
  }
  const suggestions = (Array.isArray(shapes.suggestions) ? shapes.suggestions : []).slice(0,limit)
    .filter(x => object(x)).map((x, i) => ({ id: idOf(x), kind: typeof x.kind === 'string' ? x.kind : 'unknown',
      order: i, status: 'inferred-review-only', source: { session: sessionId, origin: expectedOrigin },
      acceptance: admitted.eligible ? 'capture-accepted' : 'not-verified-for-learning',
      // Existing heuristic confidences are rankings, NOT calibrated probabilities.
      score: Number.isFinite(x.confidence) && x.confidence >= 0 && x.confidence <= 1 ? x.confidence : null,
      confidenceBasis: 'heuristic-not-calibrated' }));
  const partial = collected.length === limit || (partition.totals?.unknown ?? 0) > 0 || (partition.totals?.other ?? 0) > 0 ||
    !!partition.dom?.unattributedCount || admitted.eligible === false;
  return { schema: PROFILE_EVIDENCE_SCHEMA, scope, status: partial ? 'partial' : 'reviewable',
    reason: partial ? 'COVERAGE_OR_ADMISSION_UNCERTAIN' : null,
    admission: admitted, fields: collected, suggestions,
    modelPromotion: { allowed: false, eligibleForReview: admitted.eligible && !!scope.account,
      reason: !admitted.eligible ? 'ACCEPTANCE_NOT_VERIFIED' : !scope.account ? 'ACCOUNT_SCOPE_UNKNOWN' : 'REQUIRES_REVIEWED_CORRECTION',
      status: 'not-executed' },
    limitations: [ ...(!admitted.eligible ? ['accepted-evidence-not-proven'] : []),
      ...(!scope.account ? ['account-identity-not-proven'] : []),
      ...(partition.totals?.other > 0 ? ['other-origin-evidence-excluded'] : []),
      ...(partition.totals?.unknown > 0 ? ['unknown-origin-evidence-excluded'] : []),
      ...((Array.isArray(shapes.groups) && shapes.groups.some(g => Object.keys(g.fields ?? {}).length > 0) && collected.length >= limit) ? ['field-budget-may-truncate'] : []) ] };
}

export function profileStructuralDrift(before, after) {
```

_First 80 of 91 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
