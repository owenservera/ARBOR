# File: packages/tierflow/src/visual-runtime/knowledge/wave3-feed-projection.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/knowledge/wave3-feed-projection.ts |
| Language | TypeScript |
| Kind | source |
| Size | 12102 B |
| Lines | 206 |
| Hash | 9523b1fac925 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ScopedFeedCard | interface | 18 | yes | export interface ScopedFeedCard extends KnowledgeCard { |
| ScopedFeedChange | interface | 28 | yes | export interface ScopedFeedChange { |
| ScopedFeedResult | interface | 32 | yes | export interface ScopedFeedResult { |
| SourceFeedNotice | type | 42 | yes | export type SourceFeedNotice = Readonly&lt;{ |
| ScopedKnowledgeFeed | interface | 46 | yes | export interface ScopedKnowledgeFeed { |
| MAX_PAGE | const | 57 | no | const MAX_PAGE = 50; |
| MAX_EVIDENCE | const | 58 | no | const MAX_EVIDENCE = 16; |
| MAX_TEXT | const | 59 | no | const MAX_TEXT = 512; |
| REF | const | 60 | no | const REF = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/; |
| EMPTY | const | 61 | no | const EMPTY: readonly ScopedFeedCard[] = Object.freeze([]); |
| empty | function | 62 | no | function empty(state: ScopedFeedResult[&#39;state&#39;]): ScopedFeedResult { |
| validRef | function | 68 | no | function validRef(value: unknown): value is string { return typeof value === &#39;string&#39; &amp;&amp; REF.test(value); } |
| validContext | function | 69 | no | function validContext(ctx: TrustedKnowledgeContext \| null, request: KnowledgeQuery, now: number): ctx is TrustedKnowledgeContext { |
| scopeKey | function | 77 | no | function scopeKey(ctx: TrustedKnowledgeContext): string { |
| queryKey | function | 84 | no | function queryKey(req: KnowledgeQuery): string { |
| validRequest | function | 87 | no | function validRequest(req: KnowledgeQuery): boolean { |
| plain | function | 94 | no | function plain(s: string): string { |
| validEvidence | function | 97 | no | function validEvidence(item: KnowledgeItem): boolean { |
| source | const | 103 | no | const source = item.source; |
| validatePage | function | 111 | no | function validatePage(page: KnowledgePage, limit: number): boolean { |
| project | function | 119 | no | function project(page: KnowledgePage): readonly ScopedFeedCard[] \| null { |
| visual | const | 120 | no | const visual = projectKnowledgePage(page); // Existing Wave 2 inert/escaped projection. |
| byId | const | 122 | no | const byId = new Map(page.items.map(item =&gt; [item.stableId, item] as const)); |
| item | const | 124 | no | const item = byId.get(card.stableId)!; |
| createScopedKnowledgeFeed | function | 136 | yes | export function createScopedKnowledgeFeed( client: KnowledgeClient, broker: TrustedKnowledgeBroker, options: Readonly&lt;{ now?: () =&gt; number }&gt; = {}, ): ScopedKnowledgeFeed { |
| now | const | 142 | no | const now = options.now ?? Date.now; |
| generation | variable | 143 | no | let generation = 0; |
| last | variable | 144 | no | let last: { scope: string; query: string; cards: readonly ScopedFeedCard[] } \| null = null; |
| sequence | variable | 145 | no | let sequence = 0; |
| needsResnapshot | variable | 146 | no | let needsResnapshot = false; |
| forget | function | 147 | no | function forget(): void { generation++; last = null; } |
| read | function | 148 | no | async function read(request: KnowledgeQuery, explicitSnapshot: boolean): Promise&lt;ScopedFeedResult&gt; { |
| before | const | 150 | no | const before = broker.readContext(); |
| scope | const | 153 | no | const scope = scopeKey(before); |
| filter | const | 154 | no | const filter = queryKey(request); |
| thisGeneration | const | 157 | no | const thisGeneration = ++generation; |
| page | variable | 158 | no | let page: KnowledgePage; |
| after | const | 161 | no | const after = broker.readContext(); |
| cards | const | 169 | no | const cards = project(page); |
| previous | const | 171 | no | const previous = !explicitSnapshot &amp;&amp; last &amp;&amp; last.scope === scope &amp;&amp; last.query === filter ? last.cards : []; |
| prior | const | 172 | no | const prior = new Map(previous.map(card =&gt; [card.stableId, card] as const)); |
| current | const | 173 | no | const current = new Set(cards.map(card =&gt; card.stableId)); |
| changes | const | 174 | no | const changes: ScopedFeedChange[] = []; |
| old | const | 176 | no | const old = prior.get(card.stableId); |
| removedStableIds | const | 179 | no | const removedStableIds = previous.filter(card =&gt; !current.has(card.stableId)).map(card =&gt; card.stableId); |
| valid | const | 194 | no | const valid = hint &amp;&amp; Number.isSafeInteger(hint.sequence) &amp;&amp; hint.sequence &gt; 0 |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./client.ts | import | 7 | [packages/tierflow/src/visual-runtime/knowledge/client.ts](./client.ts.md) |
| ./projection.ts | import | 16 | [packages/tierflow/src/visual-runtime/knowledge/projection.ts](./projection.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/final-wave/integration/master.ts](../final-wave/integration/master.ts.md) | ../../knowledge/wave3-feed-projection.ts |
| [packages/tierflow/src/visual-runtime/final-wave/lane-d/knowledge-presentation.ts](../final-wave/lane-d/knowledge-presentation.ts.md) | ../../knowledge/wave3-feed-projection.ts |
| [packages/tierflow/src/visual-runtime/integration-3/compose.ts](../integration-3/compose.ts.md) | ../knowledge/wave3-feed-projection.ts |
| [packages/tierflow/src/visual-runtime/integration-4/compose.ts](../integration-4/compose.ts.md) | ../knowledge/wave3-feed-projection.ts |
| [packages/tierflow/src/visual-runtime/knowledge/wave4-device-snapshot-adapter.ts](./wave4-device-snapshot-adapter.ts.md) | ./wave3-feed-projection.ts |
| [packages/tierflow/src/visual-runtime/revisions/wave4-session-reconcile.ts](../revisions/wave4-session-reconcile.ts.md) | ../knowledge/wave3-feed-projection.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-d/knowledge-presentation.test.ts](../../../tests/visual-runtime/final-wave/lane-d/knowledge-presentation.test.ts.md) | ../../../../src/visual-runtime/knowledge/wave3-feed-projection.ts |
| [packages/tierflow/tests/visual-runtime/integration-3.test.ts](../../../tests/visual-runtime/integration-3.test.ts.md) | ../../src/visual-runtime/knowledge/wave3-feed-projection.ts |
| [packages/tierflow/tests/visual-runtime/integration-4/fixture.ts](../../../tests/visual-runtime/integration-4/fixture.ts.md) | ../../../src/visual-runtime/knowledge/wave3-feed-projection.ts |
| [packages/tierflow/tests/visual-runtime/wave3-f-knowledge.test.ts](../../../tests/visual-runtime/wave3-f-knowledge.test.ts.md) | ../../src/visual-runtime/knowledge/wave3-feed-projection.ts |
| [packages/tierflow/tests/visual-runtime/wave4-d-session-reconcile.test.ts](../../../tests/visual-runtime/wave4-d-session-reconcile.test.ts.md) | ../../src/visual-runtime/knowledge/wave3-feed-projection.ts |
| [packages/tierflow/tests/visual-runtime/wave4-f-device-snapshot.test.ts](../../../tests/visual-runtime/wave4-f-device-snapshot.test.ts.md) | ../../src/visual-runtime/knowledge/wave3-feed-projection.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Wave 3 F: read-only scoped KB projection and bounded invalidation/delta adapter.
 * The supplied KnowledgeClient and trusted broker are the ONLY read/authorization
 * boundary. Signals are untrusted *invalidation hints*, never data or permission.
 * No persistence, KB writes, live transport, action handles or implicit retries.
 */
import {
  KNOWLEDGE_QUERY_SCHEMA,
  type KnowledgeClient,
  type KnowledgeItem,
  type KnowledgePage,
  type KnowledgeQuery,
  type TrustedKnowledgeBroker,
  type TrustedKnowledgeContext,
} from './client.ts';
import { projectKnowledgePage, type KnowledgeCard } from './projection.ts';

export interface ScopedFeedCard extends KnowledgeCard {
  readonly projectRef: string;
  readonly availability: 'present' | 'stale' | 'unknown' | 'unavailable';
  readonly claimStatus: KnowledgeItem['claimStatus'];
  /** Read port does not expose S0–S3; authorization remains upstream. */
  readonly sensitivity: 'enforced-upstream-not-disclosed';
  readonly source: Readonly<KnowledgeItem['source']>;
  readonly evidenceRefs: readonly string[];
  readonly provenance: readonly string[];
}
export interface ScopedFeedChange {
  readonly kind: 'added' | 'updated';
  readonly card: ScopedFeedCard;
}
export interface ScopedFeedResult {
  readonly state: 'ready' | 'partial' | 'denied' | 'unavailable' | 'resnapshot-required';
  readonly cards: readonly ScopedFeedCard[];
  readonly changes: readonly ScopedFeedChange[];
  readonly removedStableIds: readonly string[];
  readonly projectionRevision: string | null;
  readonly asOf: string | null;
  readonly reason: 'NONE' | 'ACCESS_DENIED' | 'SOURCE_UNAVAILABLE' | 'RESNAPSHOT_REQUIRED';
  readonly nextCursor?: string;
}
export type SourceFeedNotice = Readonly<{
  sequence: number;
  kind: 'changed' | 'tombstone' | 'source-reset' | 'revoked';
}>;
export interface ScopedKnowledgeFeed {
  /** Always re-reads the authorized upstream client, never serves stored cards. */
  poll(request: KnowledgeQuery): Promise<ScopedFeedResult>;
  /** Explicit full read after a gap, tombstone, source restart or revocation. */
  resnapshot(request: KnowledgeQuery): Promise<ScopedFeedResult>;
  /** Untrusted notice can only invalidate, never insert or delete a KB record. */
  notice(hint: SourceFeedNotice): void;
  /** Forget ephemeral comparison state (e.g. logout or component teardown). */
  clear(): void;
}

const MAX_PAGE = 50;
const MAX_EVIDENCE = 16;
const MAX_TEXT = 512;
const REF = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const EMPTY: readonly ScopedFeedCard[] = Object.freeze([]);
function empty(state: ScopedFeedResult['state']): ScopedFeedResult {
  return {
    state, cards: EMPTY, changes: [], removedStableIds: [], projectionRevision: null, asOf: null,
    reason: state === 'denied' ? 'ACCESS_DENIED' : state === 'resnapshot-required' ? 'RESNAPSHOT_REQUIRED' : 'SOURCE_UNAVAILABLE',
  };
}
function validRef(value: unknown): value is string { return typeof value === 'string' && REF.test(value); }
function validContext(ctx: TrustedKnowledgeContext | null, request: KnowledgeQuery, now: number): ctx is TrustedKnowledgeContext {
  return !!ctx && validRef(ctx.ownerRef) && validRef(ctx.sessionRef) && validRef(ctx.deviceRef)
    && validRef(ctx.personalWorldRef) && validRef(ctx.policyRevision)
    && Number.isFinite(ctx.sessionExpiresAt) && Number.isFinite(ctx.grantExpiresAt)
    && ctx.sessionExpiresAt > now && ctx.grantExpiresAt > now && ctx.revoked === false
    && ctx.personalWorldRef === request.personalWorldRef && ctx.surface === request.surface
    && Array.isArray(ctx.allowedPurposes) && ctx.allowedPurposes.includes(request.purpose);
}
function scopeKey(ctx: TrustedKnowledgeContext): string {
  return JSON.stringify([
    ctx.ownerRef, ctx.sessionRef, ctx.deviceRef, ctx.personalWorldRef, ctx.surface,
    ctx.policyRevision, ctx.sessionExpiresAt, ctx.grantExpiresAt,
```

_First 80 of 207 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
