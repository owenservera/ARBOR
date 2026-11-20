# File: packages/tierflow/src/visual-runtime/revisions/wave4-session-reconcile.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/revisions/wave4-session-reconcile.ts |
| Language | TypeScript |
| Kind | source |
| Size | 18444 B |
| Lines | 318 |
| Hash | 7700acddcba3 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WAVE4_WATERMARK_SCHEMA | const | 16 | yes | export const WAVE4_WATERMARK_SCHEMA = &#39;vivim.visual-session-watermark/1&#39; as const; |
| WAVE4_NOTICE_SCHEMA | const | 17 | yes | export const WAVE4_NOTICE_SCHEMA = &#39;vivim.visual-session-notice/1&#39; as const; |
| ReconcileState | type | 18 | yes | export type ReconcileState = &#39;offline&#39; \| &#39;ready&#39; \| &#39;stale&#39; \| &#39;resnapshot-required&#39; \| &#39;denied&#39; \| &#39;unavailable&#39;; |
| ReconcileReason | type | 19 | yes | export type ReconcileReason = &#39;NONE&#39; \| &#39;DISCONNECTED&#39; \| &#39;MISSING_AUTHORITY&#39; \| &#39;REVOKED&#39; \| &#39;SCOPE_CHANGED&#39; \| |
| SessionWatermark | interface | 24 | yes | export interface SessionWatermark { |
| SessionNotice | interface | 36 | yes | export interface SessionNotice { |
| SessionView | interface | 43 | yes | export interface SessionView { |
| ReconcileTelemetry | interface | 52 | yes | export interface ReconcileTelemetry { |
| SessionReconcileOptions | interface | 61 | yes | export interface SessionReconcileOptions { |
| SessionReconciler | interface | 76 | yes | export interface SessionReconciler { |
| REF | const | 90 | no | const REF = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/; |
| DIGEST | const | 91 | no | const DIGEST = /^sha256:[a-f0-9]{64}$/; |
| allowedKeys | const | 92 | no | const allowedKeys = new Set([&#39;schema&#39;, &#39;documentId&#39;, &#39;sequence&#39;, &#39;revision&#39;, &#39;kind&#39;]); |
| isRef | function | 93 | no | const isRef = (v: unknown): v is string =&gt; typeof v === &#39;string&#39; &amp;&amp; REF.test(v); |
| safeNatural | function | 94 | no | const safeNatural = (v: unknown): v is number =&gt; Number.isSafeInteger(v) &amp;&amp; (v as number) &gt;= 0; |
| safeRevision | function | 95 | no | const safeRevision = (v: unknown): v is number =&gt; safeNatural(v) &amp;&amp; (v as number) &gt; 0; |
| isDigest | function | 96 | no | const isDigest = (v: unknown): v is string =&gt; typeof v === &#39;string&#39; &amp;&amp; DIGEST.test(v); |
| copy | function | 97 | no | function copy&lt;T&gt;(value: T): T { return structuredClone(value); } |
| principalKey | function | 98 | no | function principalKey(p: VerifiedUiPrincipal): string { |
| validPrincipal | function | 102 | no | function validPrincipal(p: VerifiedUiPrincipal \| null): p is VerifiedUiPrincipal { |
| validRevision | function | 106 | no | function validRevision(r: UiFixtureRevision \| null, documentId: string): r is UiFixtureRevision { |
| validWatermark | function | 113 | no | function validWatermark(mark: SessionWatermark, p: VerifiedUiPrincipal, id: string): boolean { |
| validNotice | function | 119 | no | function validNotice(hint: SessionNotice, id: string): boolean { |
| validKnowledgeQuery | function | 126 | no | function validKnowledgeQuery(q: KnowledgeQuery, id: string): boolean { |
| createWave4SessionReconciler | function | 132 | yes | export function createWave4SessionReconciler(options: SessionReconcileOptions): SessionReconciler { |
| maxPending | const | 140 | no | const maxPending = options.maxPendingNotices ?? 256; |
| maxAttempts | const | 141 | no | const maxAttempts = options.maxSnapshotAttempts ?? 2; |
| generation | variable | 145 | no | let generation = 0; |
| state | variable | 146 | no | let state: ReconcileState = &#39;offline&#39;; |
| reason | variable | 147 | no | let reason: ReconcileReason = &#39;DISCONNECTED&#39;; |
| revision | variable | 148 | no | let revision: UiFixtureRevision \| null = null; |
| knowledge | variable | 149 | no | let knowledge: ScopedFeedResult \| null = null; |
| anchor | variable | 150 | no | let anchor: { sequence: number; revision: number; digest: string } \| null = null; |
| lastNotice | variable | 151 | no | let lastNotice = &#39;&#39;; |
| activeScope | variable | 152 | no | let activeScope: string \| null = null; |
| blockedScope | variable | 153 | no | let blockedScope: string \| null = null; |
| pending | variable | 154 | no | let pending = 0; |
| announcedRevision | variable | 155 | no | let announcedRevision = 0; |
| accepted | variable | 156 | no | let accepted = 0, duplicates = 0, rejected = 0, snapshots = 0, reads = 0, highWater = 0; |
| emptyView | function | 158 | no | function emptyView(): SessionView { |
| identity | const | 162 | no | const identity = principal(); |
| head | const | 165 | no | const head = readCurrent(identity.value); |
| current | const | 172 | no | const current = state === &#39;ready&#39; &amp;&amp; revision !== null &amp;&amp; anchor !== null; |
| currentAnchor | const | 173 | no | const currentAnchor = current ? anchor : null; |
| invalidate | function | 181 | no | function invalidate(next: ReconcileState, why: ReconcileReason): void { |
| principal | function | 188 | no | function principal(): { value: VerifiedUiPrincipal; key: string } \| null { |
| p | variable | 189 | no | let p: VerifiedUiPrincipal \| null; |
| samePrincipal | function | 193 | no | function samePrincipal(key: string): boolean { return principal()?.key === key; } |
| readCurrent | function | 194 | no | function readCurrent(p: VerifiedUiPrincipal): { revision: UiFixtureRevision \| null; denied: boolean } { |
| result | const | 197 | no | const result = options.revisionPort.readCurrent(p, options.documentId); |
| reconnect | function | 202 | no | async function reconnect(): Promise&lt;SessionView&gt; { |
| myGeneration | const | 204 | no | const myGeneration = generation; |
| identity | const | 205 | no | const identity = principal(); |
| error | variable | 210 | no | let error: ReconcileReason = &#39;SOURCE_UNAVAILABLE&#39;; |
| mark | variable | 214 | no | let mark: SessionWatermark; |
| read | const | 219 | no | const read = readCurrent(identity.value); |
| head | const | 221 | no | const head = read.revision; |
| freshKnowledge | variable | 224 | no | let freshKnowledge: ScopedFeedResult \| null = null; |
| request | variable | 226 | no | let request: KnowledgeQuery; |
| confirmedRead | const | 237 | no | const confirmedRead = readCurrent(identity.value); |
| confirmed | const | 239 | no | const confirmed = confirmedRead.revision; |
| notice | function | 254 | no | function notice(hint: SessionNotice): ReturnType&lt;SessionReconciler[&#39;notice&#39;]&gt; { |
| identity | const | 263 | no | const identity = principal(); |
| signature | const | 270 | no | const signature = `${hint.sequence}:${hint.revision}:${hint.kind}`; |
| resolveLostAck | function | 295 | no | function resolveLostAck(operation: &#39;publish&#39; \| &#39;rollback&#39;, command: RevisionCommand): ReturnType&lt;SessionReconciler[&#39;resolveLostAck&#39;]&gt; { |
| identity | const | 296 | no | const identity = principal(); |
| result | const | 304 | no | const result = options.revisionPort.getCommandOutcome(identity.value, operation, command); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../../ui/hash.ts | import | 10 | [packages/tierflow/src/ui/hash.ts](../../ui/hash.ts.md) |
| ./port.ts | import | 11 | [packages/tierflow/src/visual-runtime/revisions/port.ts](./port.ts.md) |
| ./port.ts | import | 12 | [packages/tierflow/src/visual-runtime/revisions/port.ts](./port.ts.md) |
| ../knowledge/client.ts | import | 13 | [packages/tierflow/src/visual-runtime/knowledge/client.ts](../knowledge/client.ts.md) |
| ../knowledge/wave3-feed-projection.ts | import | 14 | [packages/tierflow/src/visual-runtime/knowledge/wave3-feed-projection.ts](../knowledge/wave3-feed-projection.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/integration-4/compose.ts](../integration-4/compose.ts.md) | ../revisions/wave4-session-reconcile.ts |
| [packages/tierflow/tests/visual-runtime/wave4-d-session-reconcile.test.ts](../../../tests/visual-runtime/wave4-d-session-reconcile.test.ts.md) | ../../src/visual-runtime/revisions/wave4-session-reconcile.ts |
| [packages/tierflow/tests/visual-runtime/wave4-d-session-reconcile.test.ts](../../../tests/visual-runtime/wave4-d-session-reconcile.test.ts.md) | ../../src/visual-runtime/revisions/wave4-session-reconcile.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Wave 4 D: effect-free, bounded cross-device session reconciliation.
 *
 * This is NOT a transport, publisher, second World writer or mobile KB. A trusted
 * Host-side caller supplies the already-authorized Wave 3 C read port, verified
 * principal and a sequenced publisher watermark. Notices are untrusted hints;
 * only C's durable read and F's scoped read may populate a device projection.
 * The module owns no network connection, queue, timer or durable storage.
 */
import { contentHash } from '../../ui/hash.ts';
import { UI_REVISION_PORT_SCHEMA } from './port.ts';
import type { VerifiedUiPrincipal, UiFixtureRevision, RevisionCommand, UiRevisionPort } from './port.ts';
import type { KnowledgeQuery } from '../knowledge/client.ts';
import type { ScopedFeedResult, ScopedKnowledgeFeed } from '../knowledge/wave3-feed-projection.ts';

export const WAVE4_WATERMARK_SCHEMA = 'vivim.visual-session-watermark/1' as const;
export const WAVE4_NOTICE_SCHEMA = 'vivim.visual-session-notice/1' as const;
export type ReconcileState = 'offline' | 'ready' | 'stale' | 'resnapshot-required' | 'denied' | 'unavailable';
export type ReconcileReason = 'NONE' | 'DISCONNECTED' | 'MISSING_AUTHORITY' | 'REVOKED' | 'SCOPE_CHANGED' |
  'GAP_OR_REORDER' | 'SOURCE_RESET' | 'TOMBSTONE' | 'BURST_LIMIT' | 'HEAD_MISMATCH' |
  'SOURCE_UNAVAILABLE' | 'KNOWLEDGE_UNAVAILABLE';

/** Obtained from the authenticated publisher, never copied from browser events. */
export interface SessionWatermark {
  readonly schema: typeof WAVE4_WATERMARK_SCHEMA;
  readonly ownerRef: string;
  readonly deviceRef: string;
  readonly sessionRef: string;
  readonly policyRevision: string;
  readonly documentId: string;
  readonly sequence: number;
  readonly revision: number;
  readonly documentDigest: string;
}
/** Hint-only. Extra fields (including data, grants or instructions) are refused. */
export interface SessionNotice {
  readonly schema: typeof WAVE4_NOTICE_SCHEMA;
  readonly documentId: string;
  readonly sequence: number;
  readonly revision: number;
  readonly kind: 'changed' | 'tombstone' | 'revoked' | 'source-reset';
}
export interface SessionView {
  readonly state: ReconcileState;
  readonly reason: ReconcileReason;
  readonly revision: UiFixtureRevision | null;
  /** This is F's newly authorized projection, never an offline copy. */
  readonly knowledge: ScopedFeedResult | null;
  /** Authoritative only when state is ready. */
  readonly cursor: Readonly<{ sequence: number; revision: number; documentDigest: string }> | null;
}
export interface ReconcileTelemetry {
  readonly acceptedNotices: number;
  readonly duplicateNotices: number;
  readonly rejectedNotices: number;
  readonly completedSnapshots: number;
  readonly attemptedReads: number;
  readonly pendingNotices: number;
  readonly maxPendingObserved: number;
}
export interface SessionReconcileOptions {
  readonly documentId: string;
  readonly revisionPort: Pick<UiRevisionPort, 'readCurrent' | 'getCommandOutcome'>;
  /** Trusted broker input; not a principal furnished by a phone/DOM event. */
  readonly readPrincipal: () => VerifiedUiPrincipal | null;
  /** Trusted Host/publisher read; required to anchor the event sequence. */
  readonly readWatermark: (principal: VerifiedUiPrincipal, documentId: string) => Promise<SessionWatermark> | SessionWatermark;
  /** Existing scoped F feed. No records are retained independently of this port. */
  readonly knowledgeFeed?: Pick<ScopedKnowledgeFeed, 'resnapshot' | 'clear' | 'notice'>;
  readonly knowledgeRequest?: () => KnowledgeQuery;
  /** Hard cap on hints received without a fresh authoritative snapshot (1..512). */
  readonly maxPendingNotices?: number;
  /** Synchronous bounded retries on inconsistent publisher/revision reads (1..3). */
  readonly maxSnapshotAttempts?: number;
}
export interface SessionReconciler {
  view(): SessionView;
  telemetry(): ReconcileTelemetry;
  /** Explicit transport loss immediately removes every visible cached datum. */
  disconnect(): void;
```

_First 80 of 319 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
