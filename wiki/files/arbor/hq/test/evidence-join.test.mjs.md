# File: hq/test/evidence-join.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/evidence-join.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8234 B |
| Lines | 189 |
| Hash | dc2872fa08d0 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NID | const | 14 | no | const NID = &#39;cnp1;d=chatgpt;l=1;o=chatgpt;c=chat;&#39;; |
| receipt | function | 16 | no | const receipt = (over = {}) =&gt; ({ receiptId: &#39;R1&#39;, requestId: &#39;q1&#39;, actor: { kind: &#39;agent&#39;, id: &#39;chatgpt&#39; }, effect: &#39;OK&#39;, |
| outcome | function | 26 | no | const outcome = (over = {}) =&gt; ({ requestId: &#39;q1&#39;, effect: &#39;OK&#39;, evidenceState: &#39;VERIFIED&#39;, ...over }); |
| noRequest | const | 70 | no | const noRequest = joinEvidence({ receipts: [receipt({ receiptId: &#39;R3&#39;, requestId: null, thread: { after: &#39;uuid-3333&#39; } })], outcomes: [outcome({ requestId: null })], }); |
| registry | const | 103 | no | const registry = { |
| registry | const | 123 | no | const registry = { get: () =&gt; &#39;named-by-string&#39; }; |
| join | variable | 131 | no | let join; |
| registry | const | 145 | no | const registry = { get: () =&gt; { throw new Error(&#39;registry on fire&#39;); } }; |
| join | variable | 146 | no | let join; |
| registry | const | 158 | no | const registry = { get: (key) =&gt; (key === &#39;R2&#39; ? { nid: NID } : null) }; |
| receipts | const | 159 | no | const receipts = [ |
| outcomes | const | 164 | no | const outcomes = [outcome(), outcome({ requestId: &#39;q4&#39; })]; |
| decisions | const | 165 | no | const decisions = [ |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 11 | external |
| ../lib/evidence-join.mjs | import | 12 | [hq/lib/evidence-join.mjs](../lib/evidence-join.mjs.md) |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | The evidence join must match a receipt to its outcome by requestId, say where a thread id |
| 4 | owner | channel-manager | — | channel-manager |
| 5 | task | — | — | evidence-join |
| 6 | invariant | — | — | a join is proved by requestId only; a matching filename or id without the matching request is a miss |
| 7 | invariant | — | — | every unnamed placeholder stays visible as basis &#39;unknown&#39;; nothing is guessed |
| 8 | see | — | hq/lib/evidence-join.mjs | hq/lib/evidence-join.mjs |
| 9 | see | — | hq/lib/comms-roof.mjs | hq/lib/comms-roof.mjs |

## Excerpt

```javascript
/**
 * @hq:context The evidence join must match a receipt to its outcome by requestId, say where a thread id
 *   came from, and count what it could not name — with no registry and with no throw.
 * @hq:owner channel-manager
 * @hq:task evidence-join
 * @hq:invariant a join is proved by requestId only; a matching filename or id without the matching request is a miss
 * @hq:invariant every unnamed placeholder stays visible as basis 'unknown'; nothing is guessed
 * @hq:see hq/lib/evidence-join.mjs
 * @hq:see hq/lib/comms-roof.mjs
 */
import { describe, expect, test } from 'bun:test';
import { joinEvidence, isPlaceholderThread } from '../lib/evidence-join.mjs';

const NID = 'cnp1;d=chatgpt;l=1;o=chatgpt;c=chat;';

const receipt = (over = {}) => ({
  receiptId: 'R1',
  requestId: 'q1',
  actor: { kind: 'agent', id: 'chatgpt' },
  effect: 'OK',
  thread: { before: '', after: 'uuid-1111' },
  createdAt: '2026-11-01T00:00:00.000Z',
  ...over,
});

const outcome = (over = {}) => ({ requestId: 'q1', effect: 'OK', evidenceState: 'VERIFIED', ...over });

describe('the join', () => {
  test('a receipt joins its outcome by requestId', () => {
    const { records, summary } = joinEvidence({ receipts: [receipt()], outcomes: [outcome()] });

    expect(records).toHaveLength(1);
    expect(records[0]).toEqual({
      receiptId: 'R1',
      requestId: 'q1',
      actor: 'chatgpt',
      effect: 'OK',
      storedThreadId: 'uuid-1111',
      threadId: 'uuid-1111',
      basis: 'stored',
      outcomeEffect: 'OK',
      evidenceState: 'VERIFIED',
      joinable: true,
    });
    expect(summary.joinable).toBe(1);
  });

  test('a matching filename or receipt id is not a join key', () => {
    const { records } = joinEvidence({
      receipts: [receipt()],
      outcomes: [{ id: 'R1', file: 'R1.json', requestId: 'q2', effect: 'FAILED', evidenceState: 'CLAIMED' }],
    });

    expect(records[0].joinable).toBe(false);
    expect(records[0].outcomeEffect).toBeNull();
    expect(records[0].evidenceState).toBeNull();
  });

  test('a receipt with no outcome is not joinable', () => {
    const { records, summary } = joinEvidence({
      receipts: [receipt(), receipt({ receiptId: 'R2', requestId: 'q2', thread: { after: 'uuid-2222' } })],
      outcomes: [outcome()],
    });

    expect(records.map((r) => r.joinable)).toEqual([true, false]);
    expect(summary.receipts).toBe(2);
    expect(summary.joinable).toBe(1);

    // A null requestId is not a key, so two records that both lack one do not join.
    const noRequest = joinEvidence({
      receipts: [receipt({ receiptId: 'R3', requestId: null, thread: { after: 'uuid-3333' } })],
      outcomes: [outcome({ requestId: null })],
    });
    expect(noRequest.records[0].joinable).toBe(false);
  });
});

describe('thread identity', () => {
  test('placeholder thread ids are detected', () => {
    for (const id of ['chatgpt-live-tab', 'chatgpt-main-new', 't1', 'T12', 'new', '', null, undefined]) {
```

_First 80 of 190 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
