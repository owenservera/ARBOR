# File: packages/tierflow/src/visual-runtime/knowledge/client.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/knowledge/client.ts |
| Language | TypeScript |
| Kind | source |
| Size | 14089 B |
| Lines | 249 |
| Hash | 6fcde2ad6583 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| KNOWLEDGE_QUERY_SCHEMA | const | 2 | yes | export const KNOWLEDGE_QUERY_SCHEMA = &#39;vivim.knowledge-query/1&#39; as const; |
| KNOWLEDGE_RESULT_SCHEMA | const | 3 | yes | export const KNOWLEDGE_RESULT_SCHEMA = &#39;vivim.knowledge-result/1&#39; as const; |
| KnowledgeSurface | type | 4 | yes | export type KnowledgeSurface = &#39;pc&#39; \| &#39;android&#39; \| &#39;wiki&#39;; |
| KnowledgePurpose | type | 5 | yes | export type KnowledgePurpose = &#39;task&#39; \| &#39;explain&#39; \| &#39;help&#39;; |
| KnowledgeSensitivity | type | 6 | yes | export type KnowledgeSensitivity = &#39;S0&#39; \| &#39;S1&#39; \| &#39;S2&#39; \| &#39;S3&#39;; |
| KnowledgeAvailability | type | 7 | yes | export type KnowledgeAvailability = &#39;present&#39; \| &#39;missing&#39; \| &#39;stale&#39; \| &#39;redacted&#39; \| &#39;revoked&#39; \| &#39;deleted&#39; \| &#39;unknown&#39; \| &#39;unavailable&#39;; |
| KnowledgeClaim | type | 8 | yes | export type KnowledgeClaim = &#39;observed&#39; \| &#39;proposed&#39; \| &#39;confirmed&#39; \| &#39;conflicted&#39; \| &#39;retracted&#39;; |
| KnowledgeQuery | interface | 10 | yes | export interface KnowledgeQuery { |
| TrustedKnowledgeContext | interface | 24 | yes | export interface TrustedKnowledgeContext { |
| TrustedKnowledgeBroker | interface | 40 | yes | export interface TrustedKnowledgeBroker { |
| CanonicalKnowledgeRecord | interface | 45 | yes | export interface CanonicalKnowledgeRecord { |
| KnowledgeItem | interface | 65 | yes | export interface KnowledgeItem { |
| KnowledgePage | interface | 79 | yes | export interface KnowledgePage { |
| FixtureSourceEvent | type | 89 | yes | export type FixtureSourceEvent = |
| KnowledgeClient | interface | 92 | yes | export interface KnowledgeClient { |
| FixtureKnowledgeClient | interface | 95 | yes | export interface FixtureKnowledgeClient extends KnowledgeClient { |
| REF | const | 101 | no | const REF = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/; |
| KIND | const | 102 | no | const KIND = /^[a-z][a-z0-9_-]{0,47}$/; |
| QUERY_KEYS | const | 103 | no | const QUERY_KEYS = new Set([&#39;schema&#39;, &#39;requestId&#39;, &#39;personalWorldRef&#39;, &#39;purpose&#39;, &#39;surface&#39;, &#39;query&#39;, &#39;entityRef&#39;, &#39;kinds&#39;, &#39;limit&#39;, &#39;cursor&#39;]); |
| PURPOSES | const | 104 | no | const PURPOSES = new Set&lt;KnowledgePurpose&gt;([&#39;task&#39;, &#39;explain&#39;, &#39;help&#39;]); |
| SURFACES | const | 105 | no | const SURFACES = new Set&lt;KnowledgeSurface&gt;([&#39;pc&#39;, &#39;android&#39;, &#39;wiki&#39;]); |
| MAX_QUERY | const | 106 | no | const MAX_QUERY = 256; |
| MAX_KINDS | const | 107 | no | const MAX_KINDS = 8; |
| MAX_LIMIT | const | 108 | no | const MAX_LIMIT = 50; |
| CURSOR_TTL_MS | const | 109 | no | const CURSOR_TTL_MS = 60_000; |
| denied | function | 111 | no | function denied(reasonCode: NonNullable&lt;KnowledgePage[&#39;reasonCode&#39;]&gt;): KnowledgePage { |
| unavailable | function | 115 | no | function unavailable(): KnowledgePage { |
| validRef | function | 118 | no | function validRef(s: unknown): s is string { return typeof s === &#39;string&#39; &amp;&amp; REF.test(s); } |
| queryShape | function | 119 | no | function queryShape(req: unknown): req is KnowledgeQuery { |
| q | const | 121 | no | const q = req as Record&lt;string, unknown&gt;; |
| contextValid | function | 132 | no | function contextValid(ctx: TrustedKnowledgeContext \| null, now: number): ctx is TrustedKnowledgeContext { |
| scopeKey | function | 140 | no | function scopeKey(ctx: TrustedKnowledgeContext): string { |
| allowed | function | 143 | no | function allowed(row: CanonicalKnowledgeRecord, ctx: TrustedKnowledgeContext, query: KnowledgeQuery): boolean { |
| toItem | function | 155 | no | function toItem(row: CanonicalKnowledgeRecord): KnowledgeItem { |
| redacted | const | 156 | no | const redacted = row.availability === &#39;redacted&#39;; |
| createFixtureKnowledgeClient | function | 174 | yes | export function createFixtureKnowledgeClient( sourceRows: readonly CanonicalKnowledgeRecord[], broker: TrustedKnowledgeBroker, options: { readonly now?: () =&gt; number } = {}, ): FixtureKnowledgeClient… |
| rows | const | 181 | no | const rows = sourceRows.map(row =&gt; structuredClone(row)); |
| now | const | 182 | no | const now = options.now ?? Date.now; |
| cursors | const | 183 | no | const cursors = new Map&lt;string, { key: string; filter: string; offset: number; epoch: number; expires: number }&gt;(); |
| epoch | variable | 184 | no | let epoch = 1; |
| discoveryScans | variable | 185 | no | let discoveryScans = 0; |
| currentTime | const | 189 | no | const currentTime = now(); |
| ctx | const | 190 | no | const ctx = broker.readContext(); |
| filter | const | 196 | no | const filter = JSON.stringify([request.query?.toLocaleLowerCase().trim() ?? &#39;&#39;, request.entityRef ?? &#39;&#39;, [...(request.kinds ?? [])].sort(), request.limit, request.purpose]); |
| key | const | 197 | no | const key = scopeKey(ctx); |
| offset | variable | 198 | no | let offset = 0; |
| cursor | const | 200 | no | const cursor = cursors.get(request.cursor); |
| needle | const | 206 | no | const needle = request.query?.toLocaleLowerCase().trim(); |
| permitted | const | 207 | no | const permitted = rows.filter(row =&gt; allowed(row, ctx, request)); |
| matched | const | 208 | no | const matched = permitted.filter(row =&gt; (request.entityRef === undefined \|\| row.stableId === request.entityRef) &amp;&amp; (!request.kinds \|\| request.kinds.includes(row.kind)) &amp;&amp; (!needle \|\| [row.label, row.… |
| slice | const | 215 | no | const slice = matched.slice(offset, offset + request.limit).map(toItem); |
| nextOffset | const | 216 | no | const nextOffset = offset + slice.length; |
| nextCursor | variable | 217 | no | let nextCursor: string \| undefined; |
| partial | const | 222 | no | const partial = slice.some(item =&gt; [&#39;stale&#39;, &#39;unknown&#39;, &#39;unavailable&#39;].includes(item.availability)); |
| row | const | 236 | no | const row = rows.find(r =&gt; r.stableId === event.stableId); |
| at | const | 239 | no | const at = rows.indexOf(row); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/experience/wave3-journey-fixture.ts](../experience/wave3-journey-fixture.ts.md) | ../knowledge/client.ts |
| [packages/tierflow/src/visual-runtime/final-wave/integration/master.ts](../final-wave/integration/master.ts.md) | ../../knowledge/client.ts |
| [packages/tierflow/src/visual-runtime/final-wave/lane-d/knowledge-presentation.ts](../final-wave/lane-d/knowledge-presentation.ts.md) | ../../knowledge/client.ts |
| [packages/tierflow/src/visual-runtime/integration-2/compose.ts](../integration-2/compose.ts.md) | ../knowledge/client.ts |
| [packages/tierflow/src/visual-runtime/integration-3/compose.ts](../integration-3/compose.ts.md) | ../knowledge/client.ts |
| [packages/tierflow/src/visual-runtime/integration-4/compose.ts](../integration-4/compose.ts.md) | ../knowledge/client.ts |
| [packages/tierflow/src/visual-runtime/knowledge/fixtures.ts](./fixtures.ts.md) | ./client.ts |
| [packages/tierflow/src/visual-runtime/knowledge/projection.ts](./projection.ts.md) | ./client.ts |
| [packages/tierflow/src/visual-runtime/knowledge/wave3-feed-projection.ts](./wave3-feed-projection.ts.md) | ./client.ts |
| [packages/tierflow/src/visual-runtime/knowledge/wave4-device-snapshot-adapter.ts](./wave4-device-snapshot-adapter.ts.md) | ./client.ts |
| [packages/tierflow/src/visual-runtime/revisions/wave4-session-reconcile.ts](../revisions/wave4-session-reconcile.ts.md) | ../knowledge/client.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-d/knowledge-presentation.test.ts](../../../tests/visual-runtime/final-wave/lane-d/knowledge-presentation.test.ts.md) | ../../../../src/visual-runtime/knowledge/client.ts |
| [packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts](../../../tests/visual-runtime/integration-2/real-a-h.test.ts.md) | ../../../src/visual-runtime/knowledge/client.ts |
| [packages/tierflow/tests/visual-runtime/integration-3.test.ts](../../../tests/visual-runtime/integration-3.test.ts.md) | ../../src/visual-runtime/knowledge/client.ts |
| [packages/tierflow/tests/visual-runtime/integration-4/fixture.ts](../../../tests/visual-runtime/integration-4/fixture.ts.md) | ../../../src/visual-runtime/knowledge/client.ts |
| [packages/tierflow/tests/visual-runtime/knowledge-privacy.test.ts](../../../tests/visual-runtime/knowledge-privacy.test.ts.md) | ../../src/visual-runtime/knowledge/client.ts |
| [packages/tierflow/tests/visual-runtime/knowledge.test.ts](../../../tests/visual-runtime/knowledge.test.ts.md) | ../../src/visual-runtime/knowledge/client.ts |
| [packages/tierflow/tests/visual-runtime/wave3-e-experience.test.ts](../../../tests/visual-runtime/wave3-e-experience.test.ts.md) | ../../src/visual-runtime/knowledge/client.ts |
| [packages/tierflow/tests/visual-runtime/wave3-f-knowledge.test.ts](../../../tests/visual-runtime/wave3-f-knowledge.test.ts.md) | ../../src/visual-runtime/knowledge/client.ts |
| [packages/tierflow/tests/visual-runtime/wave4-f-device-snapshot.test.ts](../../../tests/visual-runtime/wave4-f-device-snapshot.test.ts.md) | ../../src/visual-runtime/knowledge/client.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/** KnowledgeClient/1 — isolated read-only fixture. No KB/Host/network imports or writes. */
export const KNOWLEDGE_QUERY_SCHEMA = 'vivim.knowledge-query/1' as const;
export const KNOWLEDGE_RESULT_SCHEMA = 'vivim.knowledge-result/1' as const;
export type KnowledgeSurface = 'pc' | 'android' | 'wiki';
export type KnowledgePurpose = 'task' | 'explain' | 'help';
export type KnowledgeSensitivity = 'S0' | 'S1' | 'S2' | 'S3';
export type KnowledgeAvailability = 'present' | 'missing' | 'stale' | 'redacted' | 'revoked' | 'deleted' | 'unknown' | 'unavailable';
export type KnowledgeClaim = 'observed' | 'proposed' | 'confirmed' | 'conflicted' | 'retracted';

export interface KnowledgeQuery {
  readonly schema: typeof KNOWLEDGE_QUERY_SCHEMA;
  readonly requestId: string;
  readonly personalWorldRef: string;
  readonly purpose: KnowledgePurpose;
  readonly surface: KnowledgeSurface;
  readonly query?: string;
  readonly entityRef?: string;
  readonly kinds?: readonly string[];
  readonly limit: number;
  readonly cursor?: string;
}

/** Supplied ONLY through the broker constructor, never copied from request JSON. */
export interface TrustedKnowledgeContext {
  readonly ownerRef: string;
  readonly sessionRef: string;
  readonly deviceRef: string;
  readonly personalWorldRef: string;
  readonly surface: KnowledgeSurface;
  readonly allowedPurposes: readonly KnowledgePurpose[];
  readonly allowPhoneS1: boolean;
  readonly policyRevision: string;
  readonly sessionExpiresAt: number;
  readonly grantExpiresAt: number;
  readonly revoked: boolean;
  readonly offline: boolean;
  /** An explicit trusted policy may permit existence-only markers for redacted rows. */
  readonly maySeeRedactedMarkers?: boolean;
}
export interface TrustedKnowledgeBroker {
  /** Trusted implementation must authenticate and verify the current session/grant. */
  readContext(): Readonly<TrustedKnowledgeContext> | null;
}

export interface CanonicalKnowledgeRecord {
  readonly stableId: string;
  readonly ownerRef: string;
  readonly personalWorldRef: string;
  readonly projectRef: string;
  readonly kind: string;
  readonly label: string;
  readonly summary: string;
  readonly path?: string;
  readonly allowedDeviceRefs?: readonly string[];
  readonly allowedPurposes?: readonly KnowledgePurpose[];
  readonly allowedSurfaces?: readonly KnowledgeSurface[];
  readonly sensitivity: KnowledgeSensitivity;
  readonly availability: KnowledgeAvailability;
  readonly claimStatus: KnowledgeClaim;
  readonly source: { readonly authority: string; readonly nativeId: string; readonly nativeVersion: string; readonly digest: string };
  readonly evidenceRefs: readonly string[];
  readonly provenance: readonly string[];
  readonly asOf: string;
}
export interface KnowledgeItem {
  readonly stableId: string;
  readonly kind: string;
  readonly projectRef: string;
  readonly label: string;
  readonly summary: string;
  readonly availability: KnowledgeAvailability;
  readonly visibility: 'visible' | 'redacted';
  readonly claimStatus: KnowledgeClaim;
  readonly source: CanonicalKnowledgeRecord['source'];
  readonly evidenceRefs: readonly string[];
  readonly provenance: readonly string[];
  readonly asOf: string;
}
export interface KnowledgePage {
  readonly schema: typeof KNOWLEDGE_RESULT_SCHEMA;
```

_First 80 of 250 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
