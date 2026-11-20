# File: apps/vivim-host/data-intelligence/journal-adapter.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/data-intelligence/journal-adapter.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3054 B |
| Lines | 52 |
| Hash | d2971f853c40 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ID | const | 6 | no | const ID = /^[A-Za-z0-9_-]{1,128}$/; |
| VERIFIED_RECEIPT_STATES | const | 7 | no | const VERIFIED_RECEIPT_STATES = new Set([&#39;observed&#39;, &#39;complete&#39;]); |
| invalid | function | 9 | no | function invalid() { return Object.assign(new TypeError(&#39;Invalid harness journal receipt&#39;), { code: &#39;JOURNAL_RECEIPT_INVALID&#39; }); } |
| bounded | function | 10 | no | function bounded(value, max = 128) { return typeof value === &#39;string&#39; &amp;&amp; value.length &lt;= max ? value : null; } |
| time | function | 11 | no | function time(value) { return typeof value === &#39;string&#39; &amp;&amp; Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null; } |
| journalReceiptToAsset | function | 16 | yes | export function journalReceiptToAsset(receipt, { worldId = &#39;world-local&#39;, capturedAt = new Date().toISOString() } = {}) { |
| observed | const | 22 | no | const observed = receipt.submitted === &#39;yes&#39; &amp;&amp; VERIFIED_RECEIPT_STATES.has(receipt.state); |
| uncertain | const | 23 | no | const uncertain = receipt.submitted === &#39;unknown&#39; \|\| receipt.state === &#39;uncertain&#39;; |
| assetId | const | 24 | no | const assetId = &#39;ai03_&#39; + createHash(&#39;sha256&#39;).update(JSON.stringify([worldId, receipt.provider, receipt.requestId])).digest(&#39;hex&#39;).slice(0, 32); |
| observedModel | const | 25 | no | const observedModel = observed ? bounded(receipt.model) : null; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 4 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/test/data-intelligence-journal.test.mjs](../test/data-intelligence-journal.test.mjs.md) | ../data-intelligence/journal-adapter.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Pure, read-only adapter from an existing harness journal receipt.
// It never reads a browser/profile, stores the reply, changes the send journal,
// or treats a selected/requested model as evidence of successful delivery.
import { createHash } from 'node:crypto';

const ID = /^[A-Za-z0-9_-]{1,128}$/;
const VERIFIED_RECEIPT_STATES = new Set(['observed', 'complete']);

function invalid() { return Object.assign(new TypeError('Invalid harness journal receipt'), { code: 'JOURNAL_RECEIPT_INVALID' }); }
function bounded(value, max = 128) { return typeof value === 'string' && value.length <= max ? value : null; }
function time(value) { return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null; }

// Returns metadata only. Preserve unknowns: e.g. the current journal does not
// persist verified thinking effort, citations or human acceptance outcome.
// The descriptor does not grant capture or any future downstream disclosure.
export function journalReceiptToAsset(receipt, { worldId = 'world-local', capturedAt = new Date().toISOString() } = {}) {
  if (!receipt || typeof receipt !== 'object' || !ID.test(worldId) ||
      !ID.test(receipt.requestId) || !ID.test(receipt.provider) ||
      !['no', 'yes', 'unknown'].includes(receipt.submitted) ||
      typeof receipt.state !== 'string' || receipt.state.length > 64) throw invalid();

  const observed = receipt.submitted === 'yes' && VERIFIED_RECEIPT_STATES.has(receipt.state);
  const uncertain = receipt.submitted === 'unknown' || receipt.state === 'uncertain';
  const assetId = 'ai03_' + createHash('sha256').update(JSON.stringify([worldId, receipt.provider, receipt.requestId])).digest('hex').slice(0, 32);
  const observedModel = observed ? bounded(receipt.model) : null;
  return {
    schema: 'vivim.data-asset/1',
    assetId, worldId, ingressId: 'AI03', kind: 'ai.model_configuration',
    source: { authority: 'harness-journal', provider: receipt.provider,
      captureMethod: 'read-only-journal-adapter', adapterVersion: '1' },
    eventAt: time(receipt.updatedAt), capturedAt: time(capturedAt) ?? new Date().toISOString(),
    identity: { requestRef: receipt.requestId },
    content: {
      authorityRef: 'harness-journal:request/' + receipt.requestId,
      digestRef: null, availability: 'referenced'
    },
    model: {
      requested: bounded(receipt.requestedModel), observed: observedModel,
      observedState: observedModel ? 'verified' : 'unverified',
      thinkingRequested: null, thinkingObserved: null
    },
    lineage: { derivation: 'direct-observation', parents: [], evidenceRefs: [] },
    policy: {
      purpose: 'private-personal-ai', grantRef: null, sensitivity: 'unknown',
      thirdParty: 'unknown', rights: 'review_required', retention: 'owner-configured'
    },
    integrity: {
      captureState: uncertain ? 'uncertain' : observed ? 'observed' : 'unverified',
      evidenceQuality: observed ? 'source-correlated' : 'unverified'
    }
  };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
