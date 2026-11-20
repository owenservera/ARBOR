# File: packages/tierflow/tests/visual-runtime/wave4-f-device-snapshot.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/wave4-f-device-snapshot.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 15880 B |
| Lines | 300 |
| Hash | dc3ee77c0f6a |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NOW | const | 11 | no | const NOW = Date.parse(&#39;2026-11-07T00:00:00.000Z&#39;); |
| ID | const | 12 | no | const ID = &#39;kn_f452af3&#39;; |
| RESTRICTED | const | 13 | no | const RESTRICTED = &#39;kn_s3_4f2e&#39;; |
| card | function | 14 | no | const card = (changes: Partial&lt;ScopedFeedCard&gt; = {}): ScopedFeedCard =&gt; ({ stableId: ID, projectRef: &#39;project_one&#39;, kind: &#39;project_note&#39;, title: &#39;Workspace project&#39;, summary: &#39;Authorized summary only… |
| ok | const | 22 | no | const ok = (cards: readonly ScopedFeedCard[] = [card()], overrides: Partial&lt;ScopedFeedResult&gt; = {}): ScopedFeedResult =&gt; ({ state: &#39;ready&#39;, reason: &#39;NONE&#39;, cards, changes: [], removedStableIds: [], p… |
| ctx | function | 26 | no | const ctx = (surface: &#39;pc&#39; \| &#39;android&#39;, overrides: Partial&lt;TrustedKnowledgeContext&gt; = {}): TrustedKnowledgeContext =&gt; ({ ownerRef: &#39;owner_a&#39;, sessionRef: &#39;session_a&#39;, deviceRef: surface === &#39;pc&#39; ? &#39;d… |
| query | function | 32 | no | const query = (surface: &#39;pc&#39; \| &#39;android&#39;, overrides: Partial&lt;KnowledgeQuery&gt; = {}): KnowledgeQuery =&gt; ({ schema: &#39;vivim.knowledge-query/1&#39;, requestId: &#39;request_a&#39;, personalWorldRef: &#39;world_a&#39;, purpos… |
| boundary | const | 36 | no | const boundary = (surface: &#39;pc&#39; \| &#39;android&#39;, result: ScopedFeedResult = ok()) =&gt; { |
| context | variable | 37 | no | let context: TrustedKnowledgeContext \| null = ctx(surface); |
| current | variable | 38 | no | let current = result; |
| count | variable | 39 | no | let count = 0; |
| cleared | variable | 40 | no | let cleared = 0; |
| hints | const | 41 | no | const hints: SourceFeedNotice[] = []; |
| feed | const | 42 | no | const feed: ScopedKnowledgeFeed = { |
| broker | const | 48 | no | const broker = { readContext: () =&gt; context }; |
| adapter | const | 49 | no | const adapter = createDeviceKnowledgeSnapshotAdapter(feed, broker, { surface, now: () =&gt; NOW }); |
| noPrivate | function | 56 | no | function noPrivate(snapshot: DeviceKnowledgeSnapshot): void { |
| pc | const | 68 | no | const pc = await boundary(&#39;pc&#39;).adapter.poll(query(&#39;pc&#39;)); |
| android | const | 69 | no | const android = await boundary(&#39;android&#39;).adapter.poll(query(&#39;android&#39;)); |
| b | const | 87 | no | const b = boundary(&#39;android&#39;); |
| after | const | 90 | no | const after = await b.adapter.poll(query(&#39;android&#39;)); |
| b | const | 97 | no | const b = boundary(&#39;pc&#39;, ok([card({ availability: &#39;stale&#39;, asOf: new Date(NOW - 4 * 86400000).toISOString() })], { state: &#39;partial&#39; })); |
| value | const | 98 | no | const value = await b.adapter.poll(query(&#39;pc&#39;)); |
| b | const | 106 | no | const b = boundary(&#39;android&#39;, ok([card({ stableId: RESTRICTED, title: &#39;Private S3 name&#39; })])); |
| b | const | 114 | no | const b = boundary(&#39;android&#39;); |
| b | const | 122 | no | const b = boundary(&#39;android&#39;); |
| b | const | 130 | no | const b = boundary(&#39;android&#39;); |
| b | const | 142 | no | const b = boundary(&#39;android&#39;); |
| snapshot | const | 144 | no | const snapshot = await b.adapter.poll(query(&#39;android&#39;)); |
| b | const | 152 | no | const b = boundary(&#39;android&#39;); |
| offline | const | 155 | no | const offline = await b.adapter.poll(query(&#39;android&#39;)); |
| release | variable | 164 | no | let release!: () =&gt; void; |
| gate | const | 165 | no | const gate = new Promise&lt;void&gt;(r =&gt; { release = r; }); |
| context | variable | 166 | no | let context: TrustedKnowledgeContext \| null = ctx(&#39;android&#39;); |
| feed | const | 167 | no | const feed: ScopedKnowledgeFeed = { poll: async () =&gt; { await gate; return ok(); }, resnapshot: async () =&gt; ok(), notice: () =&gt; {}, clear: () =&gt; {} }; |
| adapter | const | 168 | no | const adapter = createDeviceKnowledgeSnapshotAdapter(feed, { readContext: () =&gt; context }, { surface: &#39;android&#39;, now: () =&gt; NOW }); |
| pending | const | 169 | no | const pending = adapter.poll(query(&#39;android&#39;)); |
| got | const | 172 | no | const got = await pending; |
| b | const | 180 | no | const b = boundary(&#39;android&#39;); |
| b | const | 189 | no | const b = boundary(&#39;android&#39;, ok([])); // represents already-authorized upstream fixture result |
| snapshot | const | 190 | no | const snapshot = await b.adapter.poll(query(&#39;android&#39;, { query: &#39;Private S3 name&#39; })); |
| b | const | 198 | no | const b = boundary(&#39;android&#39;, ok([card({ sensitivity: &#39;S2&#39; as never })])); |
| b | const | 210 | no | const b = boundary(&#39;android&#39;, ok([card(mutation)])); |
| got | const | 211 | no | const got = await b.adapter.poll(query(&#39;android&#39;)); |
| injected | const | 218 | no | const injected = { ...card(), execute: () =&gt; &#39;bad&#39;, bearer: &#39;secret_bearer&#39;, grantId: &#39;grant_secret&#39; } as ScopedFeedCard; |
| got | const | 219 | no | const got = await boundary(&#39;pc&#39;, ok([injected])).adapter.poll(query(&#39;pc&#39;)); |
| variants | const | 225 | no | const variants = [ |
| got | const | 232 | no | const got = await boundary(&#39;android&#39;, value).adapter.poll(query(&#39;android&#39;)); |
| b | const | 240 | no | const b = boundary(&#39;android&#39;, ok([card()], { asOf })); |
| got | const | 241 | no | const got = await b.adapter.poll(query(&#39;android&#39;)); |
| b | const | 248 | no | const b = boundary(&#39;android&#39;); |
| gap | const | 252 | no | const gap = await b.adapter.poll(query(&#39;android&#39;)); |
| snapshot | const | 256 | no | const snapshot = await b.adapter.resnapshot(query(&#39;android&#39;)); |
| b | const | 265 | no | const b = boundary(&#39;pc&#39;, ok([], { removedStableIds: [ID] })); |
| b | const | 272 | no | const b = boundary(&#39;android&#39;, ok([card()], { nextCursor: &#39;kc_opaque&#39; })); |
| release | variable | 279 | no | let release!: () =&gt; void; |
| gate | const | 280 | no | const gate = new Promise&lt;void&gt;(r =&gt; { release = r; }); |
| n | variable | 281 | no | let n = 0; |
| feed | const | 282 | no | const feed: ScopedKnowledgeFeed = { |
| adapter | const | 286 | no | const adapter = createDeviceKnowledgeSnapshotAdapter(feed, { readContext: () =&gt; ctx(&#39;pc&#39;) }, { surface: &#39;pc&#39;, now: () =&gt; NOW }); |
| first | const | 287 | no | const first = adapter.poll(query(&#39;pc&#39;)); |
| b | const | 294 | no | const b = boundary(&#39;pc&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/visual-runtime/knowledge/wave4-device-snapshot-adapter.ts | import | 3 | [packages/tierflow/src/visual-runtime/knowledge/wave4-device-snapshot-adapter.ts](../../src/visual-runtime/knowledge/wave4-device-snapshot-adapter.ts.md) |
| ../../src/visual-runtime/knowledge/client.ts | import | 7 | [packages/tierflow/src/visual-runtime/knowledge/client.ts](../../src/visual-runtime/knowledge/client.ts.md) |
| ../../src/visual-runtime/knowledge/wave3-feed-projection.ts | import | 8 | [packages/tierflow/src/visual-runtime/knowledge/wave3-feed-projection.ts](../../src/visual-runtime/knowledge/wave3-feed-projection.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEVICE_KNOWLEDGE_SNAPSHOT_SCHEMA, createDeviceKnowledgeSnapshotAdapter,
  type DeviceKnowledgeSnapshot,
} from '../../src/visual-runtime/knowledge/wave4-device-snapshot-adapter.ts';
import type { KnowledgeQuery, TrustedKnowledgeContext } from '../../src/visual-runtime/knowledge/client.ts';
import type { ScopedFeedCard, ScopedFeedResult, ScopedKnowledgeFeed, SourceFeedNotice } from '../../src/visual-runtime/knowledge/wave3-feed-projection.ts';

/** Explicitly synthetic boundary: no live HQ broker, token or physical device. */
const NOW = Date.parse('2026-11-07T00:00:00.000Z');
const ID = 'kn_f452af3';
const RESTRICTED = 'kn_s3_4f2e';
const card = (changes: Partial<ScopedFeedCard> = {}): ScopedFeedCard => ({
  stableId: ID, projectRef: 'project_one', kind: 'project_note', title: 'Workspace project',
  summary: 'Authorized summary only', statusLabel: 'Observed (not an authorization)',
  provenanceLabel: 'synthetic.corpus/1', sourceVersion: 'rev-3', asOf: new Date(NOW - 60000).toISOString(),
  interactive: false, availability: 'present', claimStatus: 'observed', sensitivity: 'enforced-upstream-not-disclosed',
  source: { authority: 'fixture.hq', nativeId: 'record_one', nativeVersion: 'rev-3', digest: 'sha256:synthetic-a' },
  evidenceRefs: ['fixture-evidence:one'], provenance: ['synthetic.corpus/1'], ...changes,
});
const ok = (cards: readonly ScopedFeedCard[] = [card()], overrides: Partial<ScopedFeedResult> = {}): ScopedFeedResult => ({
  state: 'ready', reason: 'NONE', cards, changes: [], removedStableIds: [],
  projectionRevision: 'fixture-epoch-1', asOf: new Date(NOW).toISOString(), ...overrides,
});
const ctx = (surface: 'pc' | 'android', overrides: Partial<TrustedKnowledgeContext> = {}): TrustedKnowledgeContext => ({
  ownerRef: 'owner_a', sessionRef: 'session_a', deviceRef: surface === 'pc' ? 'desktop_1' : 'phone_1',
  personalWorldRef: 'world_a', surface, allowedPurposes: ['task', 'help'], allowPhoneS1: false,
  policyRevision: 'policy_1', sessionExpiresAt: NOW + 60000, grantExpiresAt: NOW + 30000,
  revoked: false, offline: false, ...overrides,
});
const query = (surface: 'pc' | 'android', overrides: Partial<KnowledgeQuery> = {}): KnowledgeQuery => ({
  schema: 'vivim.knowledge-query/1', requestId: 'request_a', personalWorldRef: 'world_a',
  purpose: 'task', surface, query: 'Workspace project', limit: 50, ...overrides,
});
const boundary = (surface: 'pc' | 'android', result: ScopedFeedResult = ok()) => {
  let context: TrustedKnowledgeContext | null = ctx(surface);
  let current = result;
  let count = 0;
  let cleared = 0;
  const hints: SourceFeedNotice[] = [];
  const feed: ScopedKnowledgeFeed = {
    poll: async () => { count++; return current; },
    resnapshot: async () => { count++; return current; },
    notice: hint => { hints.push(hint); },
    clear: () => { cleared++; },
  };
  const broker = { readContext: () => context };
  const adapter = createDeviceKnowledgeSnapshotAdapter(feed, broker, { surface, now: () => NOW });
  return {
    adapter, broker, setContext: (next: TrustedKnowledgeContext | null) => { context = next; },
    setResult: (next: ScopedFeedResult) => { current = next; },
    metrics: () => ({ count, cleared, hints }), feed,
  };
};
function noPrivate(snapshot: DeviceKnowledgeSnapshot): void {
  assert.deepEqual(snapshot.cards, []);
  assert.deepEqual(snapshot.removedStableIds, []);
  assert.equal(snapshot.projectionRevision, null);
  assert.equal(snapshot.asOf, null);
  assert.equal(snapshot.expiresAt, null);
  assert.ok(!('nextCursor' in snapshot));
  assert.ok(!JSON.stringify(snapshot).includes(RESTRICTED));
  assert.ok(!JSON.stringify(snapshot).includes('owner_'));
}

test('PC and Android preserve ONE canonical project identity, native source version, evidence and provenance', async () => {
  const pc = await boundary('pc').adapter.poll(query('pc'));
  const android = await boundary('android').adapter.poll(query('android'));
  assert.equal(pc.schema, DEVICE_KNOWLEDGE_SNAPSHOT_SCHEMA);
  assert.deepEqual(android.cards, pc.cards);
  assert.equal(pc.cards[0]?.stableId, ID);
  assert.equal(pc.cards[0]?.source.nativeVersion, 'rev-3');
  assert.equal(pc.cards[0]?.source.nativeId, 'record_one');
  assert.equal(pc.cards[0]?.projectRef, 'project_one');
  assert.equal(pc.cards[0]?.source.digest, 'sha256:synthetic-a');
  assert.equal(pc.cards[0]?.evidenceRefs[0], 'fixture-evidence:one');
  assert.equal(pc.cards[0]?.interactive, false);
  assert.ok(!('execute' in pc.cards[0]!));
  assert.equal(pc.retainOffline, false);
```

_First 80 of 301 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
