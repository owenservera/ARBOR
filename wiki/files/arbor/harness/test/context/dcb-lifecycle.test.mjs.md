# File: harness/test/context/dcb-lifecycle.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/context/dcb-lifecycle.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6261 B |
| Lines | 111 |
| Hash | 1b84116f1b3a |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| T | const | 9 | no | const T = &#39;2026-11-10T06:00:00.000Z&#39;; |
| T2 | const | 10 | no | const T2 = &#39;2026-11-10T07:00:00.000Z&#39;; |
| T3 | const | 11 | no | const T3 = &#39;2026-11-11T06:00:00.000Z&#39;; |
| SHA | const | 12 | no | const SHA = &#39;a&#39;.repeat(64); |
| base | function | 13 | no | const base = (override = {}) =&gt; ({ id: &#39;dcb:alpha&#39;, ownerRef: &#39;owner:one&#39;, mode: &#39;persistent&#39;, createdAt: T, policyVersion: &#39;v2&#39;, activityRef: null, flavorRefs: [&#39;project&#39;, &#39;research&#39;], sourceRefs: [… |
| make | function | 18 | no | const make = override =&gt; createDcbDefinition(base(override)); |
| d | const | 21 | no | const d = make({ flavorRefs: [&#39;research&#39;, &#39;project&#39;, &#39;project&#39;] }); |
| d | const | 33 | no | const d = make({ mode: &#39;session&#39;, expiresAt: T2 }); |
| expired | const | 35 | no | const expired = assessDcbDefinition(d, { at: T2 }); |
| d | const | 41 | no | const d = make(); |
| noop | const | 42 | no | const noop = reviseDcbDefinition(d, { activityRef: null }, { expectedRevision: 1, at: T2 }); |
| next | const | 44 | no | const next = reviseDcbDefinition(d, { activityRef: &#39;activity:research&#39; }, { expectedRevision: 1, at: T2 }); |
| d | const | 53 | no | const d = make(); |
| retired | const | 54 | no | const retired = reviseDcbDefinition(d, { status: &#39;retired&#39; }, { expectedRevision: 1, at: T2 }); |
| session | const | 58 | no | const session = make({ mode: &#39;session&#39;, expiresAt: T2 }); |
| d | const | 63 | no | const d = make(); |
| stale | const | 64 | no | const stale = assessDcbDefinition(d, { at: T, changedSourceRefs: [&#39;source:1&#39;] }); |
| sourceBlock | const | 67 | no | const sourceBlock = assessDcbDefinition(d, { at: T, revokedSourceRefs: [&#39;source:2&#39;] }); |
| grantBlock | const | 69 | no | const grantBlock = assessDcbDefinition(d, { at: T, grantRevoked: true }); |
| first | const | 74 | no | const first = make(); |
| second | const | 75 | no | const second = make({ id: &#39;dcb:beta&#39;, mode: &#39;session&#39;, expiresAt: T3 }); |
| d | const | 76 | no | const d = createCompositeDcbDefinition({ id: &#39;dcb:merged&#39;, parents: [second, first], createdAt: T, flavorRefs: [&#39;research&#39;, &#39;personal&#39;], policyVersion: &#39;v2&#39;, }); |
| d | const | 89 | no | const d = make(); |
| sourceRevisions | const | 90 | no | const sourceRevisions = [{ ref: &#39;source:2&#39;, revision: &#39;v2&#39;, sha256: SHA }, |
| args | const | 92 | no | const args = { definition: d, destinationRef: &#39;provider:claude&#39;, requestDigest: SHA, |
| first | const | 94 | no | const first = dcbMaterializationInput(args); |
| second | const | 95 | no | const second = dcbMaterializationInput({ ...args, sourceRevisions: [...sourceRevisions].reverse() }); |
| d | const | 102 | no | const d = make(); |
| args | const | 103 | no | const args = { definition: d, destinationRef: &#39;provider:claude&#39;, requestDigest: SHA, |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| ../../src/context/dcb-lifecycle.mjs | import | 4 | [harness/src/context/dcb-lifecycle.mjs](../../src/context/dcb-lifecycle.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Synthetic contract tests only. No Host, browser, provider or device effects.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDcbDefinition, reviseDcbDefinition, assessDcbDefinition,
  createCompositeDcbDefinition, dcbMaterializationInput,
} from '../../src/context/dcb-lifecycle.mjs';

const T = '2026-11-10T06:00:00.000Z';
const T2 = '2026-11-10T07:00:00.000Z';
const T3 = '2026-11-11T06:00:00.000Z';
const SHA = 'a'.repeat(64);
const base = (override = {}) => ({
  id: 'dcb:alpha', ownerRef: 'owner:one', mode: 'persistent', createdAt: T,
  policyVersion: 'v2', activityRef: null, flavorRefs: ['project', 'research'],
  sourceRefs: ['source:2', 'source:1'], ...override,
});
const make = override => createDcbDefinition(base(override));

test('persistent definition keeps stable identity and normalized refs without private bodies', () => {
  const d = make({ flavorRefs: ['research', 'project', 'project'] });
  assert.deepEqual(d.flavorRefs, ['project', 'research']);
  assert.deepEqual(d.sourceRefs, ['source:1', 'source:2']);
  assert.equal(d.revision, 1);
  assert.equal(d.status, 'active');
  assert.equal(d.schema, 'vivim.dcb-definition/1');
  assert.equal(JSON.stringify(d).includes('source content'), false);
  assert.ok(Object.isFrozen(d));
});
test('short-lived bundles require expiry and expiration blocks planning', () => {
  assert.throws(() => make({ mode: 'session' }), { code: 'DCB_DEFINITION_EXPIRY' });
  assert.throws(() => make({ mode: 'ephemeral', expiresAt: T }), { code: 'DCB_DEFINITION_EXPIRY' });
  const d = make({ mode: 'session', expiresAt: T2 });
  assert.equal(assessDcbDefinition(d, { at: T }).status, 'candidate_current');
  const expired = assessDcbDefinition(d, { at: T2 });
  assert.equal(expired.status, 'blocked');
  assert.ok(expired.reasons.includes('expired'));
  assert.equal(expired.isSendAuthorized, false);
});
test('deterministic versioning and optimistic concurrency preserve no-op revisions', () => {
  const d = make();
  const noop = reviseDcbDefinition(d, { activityRef: null }, { expectedRevision: 1, at: T2 });
  assert.strictEqual(noop, d);
  const next = reviseDcbDefinition(d, { activityRef: 'activity:research' }, { expectedRevision: 1, at: T2 });
  assert.equal(next.revision, 2);
  assert.equal(d.revision, 1);
  assert.throws(() => reviseDcbDefinition(next, { status: 'suspended' }, { expectedRevision: 1, at: T3 }),
    { code: 'DCB_DEFINITION_CONFLICT' });
  assert.throws(() => reviseDcbDefinition(d, { id: 'dcb:other' }, { expectedRevision: 1, at: T2 }),
    { code: 'DCB_DEFINITION_PATCH' });
});
test('retirement is terminal and expired definitions cannot reactivate', () => {
  const d = make();
  const retired = reviseDcbDefinition(d, { status: 'retired' }, { expectedRevision: 1, at: T2 });
  assert.equal(assessDcbDefinition(retired, { at: T3 }).status, 'blocked');
  assert.throws(() => reviseDcbDefinition(retired, { status: 'active' }, { expectedRevision: 2, at: T3 }),
    { code: 'DCB_DEFINITION_RETIRED' });
  const session = make({ mode: 'session', expiresAt: T2 });
  assert.throws(() => reviseDcbDefinition(session, { status: 'active' }, { expectedRevision: 1, at: T3 }),
    { code: 'DCB_DEFINITION_EXPIRY' });
});
test('source changes invalidate; revocation or grant loss block; no planner status authorizes send', () => {
  const d = make();
  const stale = assessDcbDefinition(d, { at: T, changedSourceRefs: ['source:1'] });
  assert.deepEqual(stale.reasons, ['source_changed']);
  assert.equal(stale.status, 'stale');
  const sourceBlock = assessDcbDefinition(d, { at: T, revokedSourceRefs: ['source:2'] });
  assert.equal(sourceBlock.status, 'blocked');
  const grantBlock = assessDcbDefinition(d, { at: T, grantRevoked: true });
  assert.deepEqual(grantBlock.reasons, ['grant_revoked']);
  assert.equal(grantBlock.isSendAuthorized, false);
});
test('composite references two same-owner parents but never merges facts or grants', () => {
  const first = make();
  const second = make({ id: 'dcb:beta', mode: 'session', expiresAt: T3 });
  const d = createCompositeDcbDefinition({
    id: 'dcb:merged', parents: [second, first], createdAt: T,
    flavorRefs: ['research', 'personal'], policyVersion: 'v2',
  });
  assert.deepEqual(d.parentRefs, ['dcb:alpha', 'dcb:beta']);
```

_First 80 of 112 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
