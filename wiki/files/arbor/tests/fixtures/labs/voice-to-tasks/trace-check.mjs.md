# File: tests/fixtures/labs/voice-to-tasks/trace-check.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | tests/fixtures/labs/voice-to-tasks/trace-check.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2790 B |
| Lines | 40 |
| Hash | 420fffd110b6 |
| Test | yes |
| Generated | no |
| Component | tests |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| fail | function | 3 | no | const fail = code =&gt; { const e = new Error(code); e.code = code; throw e; }; |
| ACTIONS | const | 4 | no | const ACTIONS = new Set([&#39;captured_local&#39;,&#39;queued&#39;,&#39;transcribed&#39;,&#39;proposed&#39;,&#39;reviewed&#39;,&#39;committed&#39;,&#39;reopened&#39;]); |
| SOURCES | const | 5 | no | const SOURCES = new Set([&#39;android&#39;,&#39;desktop&#39;,&#39;host&#39;]); |
| verifyObservedTrace | function | 6 | yes | export function verifyObservedTrace(trace) { |
| first | const | 8 | no | const first=trace[0], noteId=first?.noteId, ownerId=first?.ownerId; |
| phase | variable | 10 | no | let phase=-1, hasReviewed=false, approved=[], receiptId=null, revision=null, reopened=false; |
| expected | const | 11 | no | const expected=[&#39;captured_local&#39;,&#39;queued&#39;,&#39;transcribed&#39;,&#39;proposed&#39;,&#39;reviewed&#39;,&#39;committed&#39;,&#39;reopened&#39;]; |
| i | const | 17 | no | const i=expected.indexOf(e.action); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [tests/compatibility/wave1f.test.mjs](../../../compatibility/wave1f.test.mjs.md) | ../fixtures/labs/voice-to-tasks/trace-check.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Lane D: offline acceptance verifier for observed cross-device traces.
// This is NOT a task engine, sync implementation, Android UI, or Host effect writer.
const fail = code => { const e = new Error(code); e.code = code; throw e; };
const ACTIONS = new Set(['captured_local','queued','transcribed','proposed','reviewed','committed','reopened']);
const SOURCES = new Set(['android','desktop','host']);
export function verifyObservedTrace(trace) {
  if (!Array.isArray(trace) || trace.length < 2 || trace.length > 100) fail('TRACE_INVALID');
  const first=trace[0], noteId=first?.noteId, ownerId=first?.ownerId;
  if (typeof noteId !== 'string' || !noteId || typeof ownerId !== 'string' || !ownerId) fail('TRACE_IDENTITY');
  let phase=-1, hasReviewed=false, approved=[], receiptId=null, revision=null, reopened=false;
  const expected=['captured_local','queued','transcribed','proposed','reviewed','committed','reopened'];
  for (const e of trace) {
    if (!e || typeof e !== 'object' || Array.isArray(e) ||
        Object.keys(e).some(k=>!['noteId','ownerId','source','action','revision','approvedProposalIds','receiptId'].includes(k)) ||
        e.noteId!==noteId || e.ownerId!==ownerId || !SOURCES.has(e.source) || !ACTIONS.has(e.action) ||
        !Number.isSafeInteger(e.revision) || e.revision < 1) fail('TRACE_EVENT_INVALID');
    const i=expected.indexOf(e.action);
    if (i < phase || i > phase+1) fail('TRACE_UNAUTHORIZED_TRANSITION');
    if (i===phase && e.action !== 'queued' && e.action !== 'reopened') fail('TRACE_DUPLICATE_EVENT');
    if (i===0 && !['android','desktop'].includes(e.source)) fail('TRACE_CAPTURE_SOURCE');
    if (i===5 && e.source!=='host') fail('TRACE_HOST_COMMIT_REQUIRED');
    if (i===6 && !['android','desktop'].includes(e.source)) fail('TRACE_REOPEN_SOURCE');
    if (phase > -1 && e.revision < revision) fail('TRACE_STALE_REVISION');
    if (i===4) {
      if (!Array.isArray(e.approvedProposalIds) || new Set(e.approvedProposalIds).size!==e.approvedProposalIds.length ||
          !e.approvedProposalIds.every(x=>typeof x==='string'&&x.startsWith('vp-'))) fail('TRACE_REVIEW_INVALID');
      hasReviewed=true; approved=e.approvedProposalIds;
    }
    if (i===5) {
      if (!hasReviewed || !Array.isArray(approved) || typeof e.receiptId!=='string' || !e.receiptId.startsWith('receipt:'))
        fail('TRACE_UNVERIFIED_COMMIT');
      if (receiptId && receiptId!==e.receiptId) fail('TRACE_RECEIPT_CONFLICT');
      receiptId=e.receiptId;
    }
    if (i===6) reopened=true;
    phase=i;revision=e.revision;
  }
  return {classification:'OBSERVED_TRACE_CONTRACT_ONLY',noteId,ownerId,finalAction:expected[phase],
    receiptId,approvedCount:approved.length,reopened,passed:reopened&&Boolean(receiptId)};
}
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
