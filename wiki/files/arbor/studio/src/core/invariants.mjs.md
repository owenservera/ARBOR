# File: studio/src/core/invariants.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/core/invariants.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3821 B |
| Lines | 66 |
| Hash | a95eb4116668 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NSP_SCHEMA | const | 4 | yes | export const NSP_SCHEMA = &#39;capture-studio.nsp/1&#39;; |
| NSP_RULES | const | 6 | yes | export const NSP_RULES = Object.freeze({ &#39;NSP-001&#39;: Object.freeze({ domain: &#39;evidence&#39;, rule: &#39;Persisted raw evidence is not silently rewritten&#39;, phase: &#39;design&#39; }), &#39;NSP-002&#39;: Object.freeze({ domain… |
| allowedDisposition | const | 17 | no | const allowedDisposition = new Set([&#39;rejected&#39;, &#39;isolated&#39;, &#39;noted&#39;]); |
| safeIdentifier | function | 18 | no | const safeIdentifier = (value) =&gt; |
| invariantReceipt | function | 23 | yes | export function invariantReceipt(code, { boundary = &#39;unknown&#39;, disposition = &#39;noted&#39;, reason = &#39;invariant-violated&#39;, source = null, entityId = null, count = null, } = {}) { |
| definition | const | 27 | no | const definition = NSP_RULES[code]; |
| safeSource | const | 29 | no | const safeSource = source &amp;&amp; typeof source === &#39;object&#39; |
| InvariantViolation | class | 45 | yes | export class InvariantViolation extends Error { |
| constructor | method | 46 | yes | constructor(code, context = {}) { |
| receipt | const | 47 | no | const receipt = invariantReceipt(code, context); |
| assertInvariant | function | 57 | yes | export function assertInvariant(condition, code, context = {}) { |
| observeInvariant | function | 64 | yes | export function observeInvariant(condition, code, context = {}) { |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/intel/graph.mjs](../intel/graph.mjs.md) | ../core/invariants.mjs |
| [studio/src/intel/history.mjs](../intel/history.mjs.md) | ../core/invariants.mjs |
| [studio/src/replay/derive.mjs](../replay/derive.mjs.md) | ../core/invariants.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// AION Negative Space Programming — executable correctness boundaries.
// No approval engine, policy service, telemetry, or additional authority.
// Violation receipts contain ONLY whitelisted locator metadata, never raw evidence.
export const NSP_SCHEMA = 'capture-studio.nsp/1';

export const NSP_RULES = Object.freeze({
  'NSP-001': Object.freeze({ domain: 'evidence', rule: 'Persisted raw evidence is not silently rewritten', phase: 'design' }),
  'NSP-002': Object.freeze({ domain: 'epistemic', rule: 'Inference is never represented as direct observation', phase: 'design' }),
  'NSP-003': Object.freeze({ domain: 'temporal', rule: 'Absence never implies deletion; a revision cannot both write and remove one field', phase: 'runtime' }),
  'NSP-004': Object.freeze({ domain: 'identity', rule: 'Incompatible identities cannot occupy the same graph node', phase: 'runtime' }),
  'NSP-005': Object.freeze({ domain: 'effects', rule: 'An uncertain external dispatch cannot be silently repeated', phase: 'existing' }),
  'NSP-006': Object.freeze({ domain: 'learning', rule: 'Learning corrections preserve sources and prior interpretation', phase: 'design' }),
  'NSP-007': Object.freeze({ domain: 'provenance', rule: 'Derived knowledge cannot claim a verified source when its inputs are unknown', phase: 'design' }),
  'NSP-008': Object.freeze({ domain: 'runtime', rule: 'Concurrent writers cannot own the same browser target without coordination', phase: 'existing' }),
});

const allowedDisposition = new Set(['rejected', 'isolated', 'noted']);
const safeIdentifier = (value) =>
  typeof value === 'string' && /^[A-Za-z0-9_.:@-]{1,160}$/.test(value) ? value : null;

// Only explicit, compact metadata. Never spread a caller-provided object into a
// receipt: it could contain passwords, prompts, raw URLs, headers or screenshots.
export function invariantReceipt(code, {
  boundary = 'unknown', disposition = 'noted', reason = 'invariant-violated',
  source = null, entityId = null, count = null,
} = {}) {
  const definition = NSP_RULES[code];
  if (!definition) throw new RangeError('Unknown NSP invariant code');
  const safeSource = source && typeof source === 'object'
    ? { session: safeIdentifier(source.session), sid: safeIdentifier(source.sid),
        seq: Number.isSafeInteger(source.seq) && source.seq >= 0 ? source.seq : null }
    : null;
  return {
    schema: NSP_SCHEMA, code, domain: definition.domain, status: 'violated',
    boundary: safeIdentifier(boundary) ?? 'unknown',
    disposition: allowedDisposition.has(disposition) ? disposition : 'noted',
    reason: safeIdentifier(reason) ?? 'invariant-violated',
    ...(safeSource && Object.values(safeSource).some((v) => v !== null)
      ? { source: safeSource } : {}),
    ...(safeIdentifier(entityId) ? { entityId } : {}),
    ...(Number.isSafeInteger(count) && count >= 0 ? { count } : {}),
  };
}

export class InvariantViolation extends Error {
  constructor(code, context = {}) {
    const receipt = invariantReceipt(code, context);
    super(`NSP invariant violation: ${code} at ${receipt.boundary}`);
    this.name = 'InvariantViolation';
    this.code = code;
    this.receipt = receipt;
  }
}

// Enforce only genuine contradictions. The caller controls the affected
// operation's scope; this must not become an application-wide approval gate.
export function assertInvariant(condition, code, context = {}) {
  if (!condition) throw new InvariantViolation(code, context);
  return true;
}

// For partial projections, note the contradiction and quarantine only the
// affected projection rather than aborting otherwise usable evidence.
export function observeInvariant(condition, code, context = {}) {
  return condition ? null : invariantReceipt(code, context);
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
