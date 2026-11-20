# File: packages/tierflow/src/visual-runtime/final-wave/lane-d/knowledge-presentation.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/final-wave/lane-d/knowledge-presentation.ts |
| Language | TypeScript |
| Kind | source |
| Size | 9540 B |
| Lines | 158 |
| Hash | 03e64fe2dbff |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| KNOWLEDGE_PRESENTATION_SCHEMA | const | 15 | yes | export const KNOWLEDGE_PRESENTATION_SCHEMA = &#39;vivim.final-knowledge-presentation/1&#39; as const; |
| REF | const | 16 | no | const REF = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/; |
| TrustedCapabilityReadPort | interface | 17 | yes | export interface TrustedCapabilityReadPort { |
| ExplanationRequest | interface | 21 | yes | export interface ExplanationRequest { |
| KnowledgePresentation | interface | 26 | yes | export interface KnowledgePresentation { |
| KnowledgePresentationPort | interface | 39 | yes | export interface KnowledgePresentationPort { |
| PresentationOptions | interface | 44 | yes | export interface PresentationOptions { |
| allowed | function | 54 | no | function allowed(ctx: TrustedKnowledgeContext \| null, q: KnowledgeQuery, surface: DeviceKnowledgeSurface, at: number): ctx is TrustedKnowledgeContext { |
| binding | function | 65 | no | function binding(ctx: TrustedKnowledgeContext): string { |
| context | function | 70 | no | function context(broker: TrustedKnowledgeBroker): TrustedKnowledgeContext \| null { |
| empty | function | 73 | no | function empty(state: &#39;denied&#39; \| &#39;unavailable&#39; \| &#39;resnapshot-required&#39;): KnowledgePresentation { |
| validExplanation | function | 81 | no | function validExplanation(e: ExplanationRequest \| undefined): boolean { |
| sourceKb | function | 87 | no | function sourceKb(card: DeviceKnowledgeCard, revision: string): AuthorizedKbHelp { |
| safeResult | function | 94 | no | function safeResult(snapshot: DeviceKnowledgeSnapshot, help: HelpView \| null): KnowledgePresentation { |
| createKnowledgePresentation | function | 108 | yes | export function createKnowledgePresentation( feed: ScopedKnowledgeFeed, broker: TrustedKnowledgeBroker, options: PresentationOptions, ): KnowledgePresentationPort { |
| now | const | 113 | no | const now = options.now ?? Date.now; |
| device | const | 114 | no | const device = createDeviceKnowledgeSnapshotAdapter(feed, broker, options); |
| generation | variable | 115 | no | let generation = 0; |
| ticket | const | 118 | no | const ticket = ++generation; |
| start | const | 119 | no | const start = now(); |
| before | const | 120 | no | const before = context(broker); |
| expected | const | 124 | no | const expected = binding(before); |
| snapshot | const | 126 | no | const snapshot = await device.resnapshot(query); |
| help | variable | 130 | no | let help: HelpView \| null = null; |
| descriptor | const | 133 | no | const descriptor = await options.capabilityReader.read(explain.actionId); |
| matchingCard | const | 139 | no | const matchingCard = explain.kbStableId |
| kb | const | 141 | no | const kb = matchingCard ? sourceKb(matchingCard, snapshot.projectionRevision!) : null; |
| proposed | const | 142 | no | const proposed = projectCapabilityHelp(descriptor, kb); |
| completed | const | 147 | no | const completed = now(); |
| after | const | 148 | no | const after = context(broker); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../../knowledge/wave4-device-snapshot-adapter.ts | import | 8 | [packages/tierflow/src/visual-runtime/knowledge/wave4-device-snapshot-adapter.ts](../../knowledge/wave4-device-snapshot-adapter.ts.md) |
| ../../knowledge/wave4-device-snapshot-adapter.ts | import | 9 | [packages/tierflow/src/visual-runtime/knowledge/wave4-device-snapshot-adapter.ts](../../knowledge/wave4-device-snapshot-adapter.ts.md) |
| ../../knowledge/client.ts | import | 10 | [packages/tierflow/src/visual-runtime/knowledge/client.ts](../../knowledge/client.ts.md) |
| ../../knowledge/wave3-feed-projection.ts | import | 11 | [packages/tierflow/src/visual-runtime/knowledge/wave3-feed-projection.ts](../../knowledge/wave3-feed-projection.ts.md) |
| ../../experience/help.ts | import | 12 | [packages/tierflow/src/visual-runtime/experience/help.ts](../../experience/help.ts.md) |
| ../../experience/help.ts | import | 13 | [packages/tierflow/src/visual-runtime/experience/help.ts](../../experience/help.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/final-wave/integration/master.ts](../integration/master.ts.md) | ../lane-d/knowledge-presentation.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-d/knowledge-presentation.test.ts](../../../../tests/visual-runtime/final-wave/lane-d/knowledge-presentation.test.ts.md) | ../../../../src/visual-runtime/final-wave/lane-d/knowledge-presentation.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Final Wave Lane D — read-only presentation atop the already scoped Wave 3/4
 * KnowledgeClient -> ScopedKnowledgeFeed -> DeviceKnowledgeSnapshot adapter.
 * The injected broker and capability reader MUST be trusted Host-side bindings,
 * not objects accepted from a browser, phone, Oracle or template payload.
 * No KB, grant, action, publisher or persistent cache is created here.
 */
import { createDeviceKnowledgeSnapshotAdapter } from '../../knowledge/wave4-device-snapshot-adapter.ts';
import type { DeviceKnowledgeCard, DeviceKnowledgeSurface, DeviceKnowledgeSnapshot } from '../../knowledge/wave4-device-snapshot-adapter.ts';
import type { KnowledgeQuery, TrustedKnowledgeBroker, TrustedKnowledgeContext } from '../../knowledge/client.ts';
import type { ScopedKnowledgeFeed, SourceFeedNotice } from '../../knowledge/wave3-feed-projection.ts';
import { projectCapabilityHelp } from '../../experience/help.ts';
import type { CapabilityDescriptor, HelpView, AuthorizedKbHelp } from '../../experience/help.ts';

export const KNOWLEDGE_PRESENTATION_SCHEMA = 'vivim.final-knowledge-presentation/1' as const;
const REF = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
export interface TrustedCapabilityReadPort {
  /** Host-verifiable catalog/readiness source; never a client-supplied descriptor. */
  read(actionId: string): Promise<CapabilityDescriptor | null>;
}
export interface ExplanationRequest {
  readonly actionId: string;
  /** Optional exact reference into the current authorized page. Never an existence probe. */
  readonly kbStableId?: string;
}
export interface KnowledgePresentation {
  readonly schema: typeof KNOWLEDGE_PRESENTATION_SCHEMA;
  readonly state: DeviceKnowledgeSnapshot['state'];
  readonly reason: DeviceKnowledgeSnapshot['reason'];
  readonly cards: readonly DeviceKnowledgeCard[];
  readonly help: HelpView | null;
  readonly source: Readonly<{ projectionRevision: string; asOf: string; expiresAt: string }> | null;
  readonly nextCursor?: string;
  /** Always replace the preceding UI view; no retained tombstone IDs or hidden totals. */
  readonly replace: true;
  readonly retainOffline: false;
  readonly runnable: false;
}
export interface KnowledgePresentationPort {
  read(query: KnowledgeQuery, explain?: ExplanationRequest): Promise<KnowledgePresentation>;
  notice(event: SourceFeedNotice): void;
  clear(): void;
}
export interface PresentationOptions {
  readonly surface: DeviceKnowledgeSurface;
  readonly now?: () => number;
  readonly maxProjectionAgeMs?: number;
  readonly maxEvidenceAgeMs?: number;
  readonly maxCards?: number;
  /** Absent reader means no feature-help enrichment, never a permission fallback. */
  readonly capabilityReader?: TrustedCapabilityReadPort;
}

function allowed(ctx: TrustedKnowledgeContext | null, q: KnowledgeQuery, surface: DeviceKnowledgeSurface, at: number): ctx is TrustedKnowledgeContext {
  return !!ctx && ctx.revoked === false && ctx.offline === false
    && ctx.surface === surface && q.surface === surface && ctx.personalWorldRef === q.personalWorldRef
    && typeof ctx.ownerRef === 'string' && REF.test(ctx.ownerRef)
    && typeof ctx.sessionRef === 'string' && REF.test(ctx.sessionRef)
    && typeof ctx.deviceRef === 'string' && REF.test(ctx.deviceRef)
    && typeof ctx.policyRevision === 'string' && REF.test(ctx.policyRevision)
    && Array.isArray(ctx.allowedPurposes) && ctx.allowedPurposes.includes(q.purpose)
    && Number.isFinite(ctx.grantExpiresAt) && ctx.grantExpiresAt > at
    && Number.isFinite(ctx.sessionExpiresAt) && ctx.sessionExpiresAt > at;
}
function binding(ctx: TrustedKnowledgeContext): string {
  return JSON.stringify([ctx.ownerRef, ctx.sessionRef, ctx.deviceRef, ctx.personalWorldRef,
    ctx.surface, ctx.policyRevision, ctx.grantExpiresAt, ctx.sessionExpiresAt,
    [...ctx.allowedPurposes].sort(), ctx.allowPhoneS1, ctx.maySeeRedactedMarkers === true]);
}
function context(broker: TrustedKnowledgeBroker): TrustedKnowledgeContext | null {
  try { return broker.readContext(); } catch { return null; }
}
function empty(state: 'denied' | 'unavailable' | 'resnapshot-required'): KnowledgePresentation {
  // Uniform no-existence/no-count envelope, including absence of source, IDs and cursors.
  return Object.freeze({ schema: KNOWLEDGE_PRESENTATION_SCHEMA, state,
    reason: state === 'denied' ? 'ACCESS_DENIED' as const :
      state === 'unavailable' ? 'SOURCE_UNAVAILABLE' as const : 'RESNAPSHOT_REQUIRED' as const,
    cards: Object.freeze([]), help: null, source: null, replace: true as const,
    retainOffline: false as const, runnable: false as const });
}
```

_First 80 of 159 lines._

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)
