# File: apps/vivim-host/test/data-intelligence-journal.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/data-intelligence-journal.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2341 B |
| Lines | 37 |
| Hash | 9b85c9e07996 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| base | const | 5 | no | const base = { requestId: &#39;req-abc&#39;, provider: &#39;chatgpt&#39;, submitted: &#39;yes&#39;, |
| a | const | 12 | no | const a = journalReceiptToAsset(base, { worldId: &#39;w1&#39;, capturedAt: &#39;2026-10-31T19:00:00Z&#39; }); |
| uncertain | const | 28 | no | const uncertain = journalReceiptToAsset({ ...base, submitted: &#39;unknown&#39;, state: &#39;uncertain&#39;, model: &#39;unverified-model&#39; }); |
| blocked | const | 32 | no | const blocked = journalReceiptToAsset({ ...base, submitted: &#39;no&#39;, state: &#39;blocked&#39; }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../data-intelligence/journal-adapter.mjs | import | 3 | [apps/vivim-host/data-intelligence/journal-adapter.mjs](../data-intelligence/journal-adapter.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { journalReceiptToAsset } from '../data-intelligence/journal-adapter.mjs';

const base = { requestId: 'req-abc', provider: 'chatgpt', submitted: 'yes',
  state: 'complete', requestedModel: 'gpt-test', model: 'gpt-test',
  createdAt: '2026-10-31T18:00:00Z', updatedAt: '2026-10-31T18:00:05Z',
  replyDigest: 'private-response-digest', payloadDigest: 'private-input-digest',
  reason: 'private-error-body', routing: { suggestedModel: 'private-routing-meta' } };

test('journal metadata adapter yields a source-qualified asset without copying secrets or raw evidence', () => {
  const a = journalReceiptToAsset(base, { worldId: 'w1', capturedAt: '2026-10-31T19:00:00Z' });
  assert.equal(a.schema, 'vivim.data-asset/1');
  assert.equal(a.ingressId, 'AI03');
  assert.equal(a.model.observedState, 'verified');
  assert.equal(a.model.observed, 'gpt-test');
  assert.equal(a.model.thinkingObserved, null);
  assert.equal(a.content.digestRef, null);
  assert.equal(a.policy.rights, 'review_required');
  assert.equal(a.policy.grantRef, null);
  assert.equal(a.integrity.captureState, 'observed');
  assert.doesNotMatch(JSON.stringify(a), /private-response-digest|private-input-digest|private-error-body|private-routing-meta/);
  assert.equal(journalReceiptToAsset(base, { worldId: 'w1' }).assetId, a.assetId);
  assert.notEqual(journalReceiptToAsset(base, { worldId: 'w2' }).assetId, a.assetId);
});

test('uncertain/blocked attempts cannot masquerade as verified provider executions', () => {
  const uncertain = journalReceiptToAsset({ ...base, submitted: 'unknown', state: 'uncertain', model: 'unverified-model' });
  assert.equal(uncertain.integrity.captureState, 'uncertain');
  assert.equal(uncertain.model.observedState, 'unverified');
  assert.equal(uncertain.model.observed, null);
  const blocked = journalReceiptToAsset({ ...base, submitted: 'no', state: 'blocked' });
  assert.equal(blocked.model.observed, null);
  assert.equal(blocked.integrity.captureState, 'unverified');
  assert.throws(() => journalReceiptToAsset({ ...base, submitted: 'sent-maybe' }), /Invalid harness journal receipt/);
  assert.throws(() => journalReceiptToAsset({ ...base, requestId: '../escape' }), /Invalid harness journal receipt/);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
