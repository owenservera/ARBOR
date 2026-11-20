# File: packages/tierflow/src/visual-runtime/knowledge/wave4-device-snapshot-adapter.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/knowledge/wave4-device-snapshot-adapter.ts |
| Language | TypeScript |
| Kind | source |
| Size | 14476 B |
| Lines | 244 |
| Hash | 7c721d505564 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DEVICE_KNOWLEDGE_SNAPSHOT_SCHEMA | const | 11 | yes | export const DEVICE_KNOWLEDGE_SNAPSHOT_SCHEMA = &#39;vivim.device-knowledge-snapshot/1&#39; as const; |
| DeviceKnowledgeSurface | type | 12 | yes | export type DeviceKnowledgeSurface = &#39;pc&#39; \| &#39;android&#39;; |
| DeviceSnapshotState | type | 13 | yes | export type DeviceSnapshotState = ScopedFeedResult[&#39;state&#39;]; |
| DeviceKnowledgeCard | interface | 16 | yes | export interface DeviceKnowledgeCard { |
| DeviceKnowledgeSnapshot | interface | 36 | yes | export interface DeviceKnowledgeSnapshot { |
| DeviceSnapshotAdapter | interface | 51 | yes | export interface DeviceSnapshotAdapter { |
| DeviceSnapshotOptions | interface | 58 | yes | export interface DeviceSnapshotOptions { |
| REF | const | 69 | no | const REF = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/; |
| KIND | const | 70 | no | const KIND = /^[a-z][a-z0-9_-]{0,47}$/; |
| MAX_CARDS | const | 71 | no | const MAX_CARDS = 50; |
| MAX_EVIDENCE | const | 72 | no | const MAX_EVIDENCE = 16; |
| MAX_TEXT | const | 73 | no | const MAX_TEXT = 512; |
| MAX_QUERY | const | 74 | no | const MAX_QUERY = 256; |
| MAX_PROJECTION_AGE | const | 75 | no | const MAX_PROJECTION_AGE = 60_000; |
| MAX_EVIDENCE_AGE | const | 76 | no | const MAX_EVIDENCE_AGE = 86_400_000; |
| FUTURE_SKEW | const | 77 | no | const FUTURE_SKEW = 5_000; |
| QUERY_FIELDS | const | 78 | no | const QUERY_FIELDS = new Set([&#39;schema&#39;, &#39;requestId&#39;, &#39;personalWorldRef&#39;, &#39;purpose&#39;, &#39;surface&#39;, &#39;query&#39;, &#39;entityRef&#39;, &#39;kinds&#39;, &#39;limit&#39;, &#39;cursor&#39;]); |
| PROTOCOL | const | 79 | no | const PROTOCOL = /(?:javascript\|vbscript\|data)\\s*:/i; |
| ACTIVE_MARKUP | const | 80 | no | const ACTIVE_MARKUP = /(?:&lt;\|&amp;lt;)\\s*\\/?\\s*(?:script\|iframe\|img\|svg\|object\|embed)\\b/i; |
| REFUSAL | const | 81 | no | const REFUSAL: Readonly&lt;Record&lt;&#39;denied&#39; \| &#39;unavailable&#39; \| &#39;resnapshot-required&#39;, ScopedFeedResult[&#39;reason&#39;]&gt;&gt; = { |
| validRef | function | 84 | no | function validRef(value: unknown): value is string { return typeof value === &#39;string&#39; &amp;&amp; REF.test(value); } |
| safeText | function | 85 | no | function safeText(value: unknown, max = MAX_TEXT, allowEmpty = false): value is string { |
| validTime | function | 89 | no | function validTime(value: unknown): value is string { |
| validQuery | function | 92 | no | function validQuery(input: KnowledgeQuery, surface: DeviceKnowledgeSurface): boolean { |
| validScope | function | 106 | no | function validScope(ctx: TrustedKnowledgeContext \| null, query: KnowledgeQuery, now: number, surface: DeviceKnowledgeSurface): ctx is TrustedKnowledgeContext { |
| signature | function | 115 | no | function signature(ctx: TrustedKnowledgeContext): string { |
| blank | function | 120 | no | function blank(state: &#39;denied&#39; \| &#39;unavailable&#39; \| &#39;resnapshot-required&#39;): DeviceKnowledgeSnapshot { |
| toCard | function | 126 | no | function toCard(card: ScopedFeedCard, now: number, evidenceAge: number): DeviceKnowledgeCard \| null { |
| src | const | 133 | no | const src = card.source; |
| time | const | 141 | no | const time = Date.parse(card.asOf); |
| freshness | const | 143 | no | const freshness = card.availability !== &#39;present&#39; \|\| now - time &gt; evidenceAge ? &#39;stale&#39; : &#39;current&#39;; |
| createDeviceKnowledgeSnapshotAdapter | function | 162 | yes | export function createDeviceKnowledgeSnapshotAdapter( feed: ScopedKnowledgeFeed, broker: TrustedKnowledgeBroker, options: DeviceSnapshotOptions, ): DeviceSnapshotAdapter { |
| now | const | 171 | no | const now = options.now ?? Date.now; |
| age | const | 172 | no | const age = options.maxProjectionAgeMs ?? MAX_PROJECTION_AGE; |
| evidenceAge | const | 173 | no | const evidenceAge = options.maxEvidenceAgeMs ?? MAX_EVIDENCE_AGE; |
| maxCards | const | 174 | no | const maxCards = options.maxCards ?? MAX_CARDS; |
| epoch | variable | 178 | no | let epoch = 0; |
| boundIdentity | variable | 179 | no | let boundIdentity: string \| null = null; |
| identity | function | 180 | no | function identity(ctx: TrustedKnowledgeContext): string { |
| context | function | 183 | no | function context(): TrustedKnowledgeContext \| null { |
| purge | function | 186 | no | function purge(): void { epoch++; feed.clear(); } |
| read | function | 187 | no | async function read(query: KnowledgeQuery, replace: boolean): Promise&lt;DeviceKnowledgeSnapshot&gt; { |
| start | const | 188 | no | const start = now(); |
| before | const | 189 | no | const before = context(); |
| principal | const | 192 | no | const principal = identity(before); |
| initial | const | 195 | no | const initial = signature(before); |
| readEpoch | const | 196 | no | const readEpoch = ++epoch; |
| result | variable | 197 | no | let result: ScopedFeedResult; |
| completed | const | 200 | no | const completed = now(); |
| after | const | 201 | no | const after = context(); |
| cards | const | 219 | no | const cards = result.cards.map(c =&gt; toCard(c, completed, evidenceAge)); |
| safeCards | const | 221 | no | const safeCards = cards as DeviceKnowledgeCard[]; |
| expires | const | 226 | no | const expires = Math.min(completed + age, after.sessionExpiresAt, after.grantExpiresAt); |
| partial | const | 228 | no | const partial = result.state === &#39;partial&#39; \|\| safeCards.some(c =&gt; c.freshness === &#39;stale&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./client.ts | import | 8 | [packages/tierflow/src/visual-runtime/knowledge/client.ts](./client.ts.md) |
| ./wave3-feed-projection.ts | import | 9 | [packages/tierflow/src/visual-runtime/knowledge/wave3-feed-projection.ts](./wave3-feed-projection.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/final-wave/lane-d/knowledge-presentation.ts](../final-wave/lane-d/knowledge-presentation.ts.md) | ../../knowledge/wave4-device-snapshot-adapter.ts |
| [packages/tierflow/src/visual-runtime/final-wave/lane-d/knowledge-presentation.ts](../final-wave/lane-d/knowledge-presentation.ts.md) | ../../knowledge/wave4-device-snapshot-adapter.ts |
| [packages/tierflow/src/visual-runtime/integration-4/compose.ts](../integration-4/compose.ts.md) | ../knowledge/wave4-device-snapshot-adapter.ts |
| [packages/tierflow/tests/visual-runtime/wave4-f-device-snapshot.test.ts](../../../tests/visual-runtime/wave4-f-device-snapshot.test.ts.md) | ../../src/visual-runtime/knowledge/wave4-device-snapshot-adapter.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Wave 4 F — inert, device-scoped view of the SAME canonical Wave 3 KB feed.
 *
 * This is not a source adapter, grant broker, local KB, durable cache or event
 * subscriber. A trusted broker and source-enforcing KnowledgeClient must be
 * supplied by the Host integration owner. Never expose an unscoped page here.
 */
import type { KnowledgeQuery, TrustedKnowledgeBroker, TrustedKnowledgeContext } from './client.ts';
import type { ScopedFeedCard, ScopedFeedResult, ScopedKnowledgeFeed, SourceFeedNotice } from './wave3-feed-projection.ts';

export const DEVICE_KNOWLEDGE_SNAPSHOT_SCHEMA = 'vivim.device-knowledge-snapshot/1' as const;
export type DeviceKnowledgeSurface = 'pc' | 'android';
export type DeviceSnapshotState = ScopedFeedResult['state'];

/** Canonical identity and source facts survive projection, without authority handles. */
export interface DeviceKnowledgeCard {
  readonly stableId: string;
  readonly projectRef: string;
  readonly kind: string;
  readonly title: string;
  readonly summary: string;
  readonly statusLabel: string;
  readonly provenanceLabel: string;
  readonly sourceVersion: string;
  readonly asOf: string;
  readonly availability: ScopedFeedCard['availability'];
  readonly claimStatus: ScopedFeedCard['claimStatus'];
  readonly freshness: 'current' | 'stale';
  readonly source: Readonly<ScopedFeedCard['source']>;
  readonly evidenceRefs: readonly string[];
  readonly provenance: readonly string[];
  readonly interactive: false;
}

/** The same envelope covers PC and Android. Empty outcomes never disclose scope. */
export interface DeviceKnowledgeSnapshot {
  readonly schema: typeof DEVICE_KNOWLEDGE_SNAPSHOT_SCHEMA;
  readonly state: DeviceSnapshotState;
  readonly reason: ScopedFeedResult['reason'];
  readonly cards: readonly DeviceKnowledgeCard[];
  /** Empty after revocation/offline; no privileged deleted-ID side channel. */
  readonly removedStableIds: readonly string[];
  readonly projectionRevision: string | null;
  readonly asOf: string | null;
  readonly expiresAt: string | null;
  readonly nextCursor?: string;
  /** Consumers MUST replace/purge prior cards, including on any empty result. */
  readonly replace: boolean;
  readonly retainOffline: false;
}
export interface DeviceSnapshotAdapter {
  poll(query: KnowledgeQuery): Promise<DeviceKnowledgeSnapshot>;
  resnapshot(query: KnowledgeQuery): Promise<DeviceKnowledgeSnapshot>;
  notice(hint: SourceFeedNotice): void;
  /** Called on logout, detach, revoke and unmount; never publishes cached rows. */
  clear(): void;
}
export interface DeviceSnapshotOptions {
  /** This is a trusted shell binding, never taken from request JSON. */
  readonly surface: DeviceKnowledgeSurface;
  readonly now?: () => number;
  /** Freshness of the *projection response*, not its underlying source facts. */
  readonly maxProjectionAgeMs?: number;
  /** Age above which an observed item is explicitly marked stale. */
  readonly maxEvidenceAgeMs?: number;
  readonly maxCards?: number;
}

const REF = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const KIND = /^[a-z][a-z0-9_-]{0,47}$/;
const MAX_CARDS = 50;
const MAX_EVIDENCE = 16;
const MAX_TEXT = 512;
const MAX_QUERY = 256;
const MAX_PROJECTION_AGE = 60_000;
const MAX_EVIDENCE_AGE = 86_400_000;
const FUTURE_SKEW = 5_000;
const QUERY_FIELDS = new Set(['schema', 'requestId', 'personalWorldRef', 'purpose', 'surface', 'query', 'entityRef', 'kinds', 'limit', 'cursor']);
const PROTOCOL = /(?:javascript|vbscript|data)\s*:/i;
const ACTIVE_MARKUP = /(?:<|&lt;)\s*\/?\s*(?:script|iframe|img|svg|object|embed)\b/i;
```

_First 80 of 245 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
