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
function validExplanation(e: ExplanationRequest | undefined): boolean {
  return e === undefined || (!!e && typeof e === 'object' && !Array.isArray(e)
    && Object.keys(e).every(k => k === 'actionId' || k === 'kbStableId')
    && typeof e.actionId === 'string' && REF.test(e.actionId)
    && (e.kbStableId === undefined || (typeof e.kbStableId === 'string' && REF.test(e.kbStableId))));
}
function sourceKb(card: DeviceKnowledgeCard, revision: string): AuthorizedKbHelp {
  // Exact identity/version/provenance already permitted by the upstream broker.
  return Object.freeze({ stableId: card.stableId, projectionRevision: revision,
    sourceAuthority: card.source.authority, sourceVersion: card.source.nativeVersion,
    evidenceRefs: card.evidenceRefs, asOf: card.asOf, visibility: 'authorized' as const,
    summary: card.summary });
}
function safeResult(snapshot: DeviceKnowledgeSnapshot, help: HelpView | null): KnowledgePresentation {
  if (snapshot.state !== 'ready' && snapshot.state !== 'partial') return empty(snapshot.state);
  if (!snapshot.projectionRevision || !snapshot.asOf || !snapshot.expiresAt) return empty('unavailable');
  // The existing Wave 4 adapter has verified source facts, redaction and policy.
  // It never returns S2/S3 cards, permission handles or deleted row markers.
  return Object.freeze({ schema: KNOWLEDGE_PRESENTATION_SCHEMA, state: snapshot.state,
    reason: snapshot.reason, cards: Object.freeze([...snapshot.cards]), help,
    source: Object.freeze({ projectionRevision: snapshot.projectionRevision,
      asOf: snapshot.asOf, expiresAt: snapshot.expiresAt }),
    ...(snapshot.nextCursor ? { nextCursor: snapshot.nextCursor } : {}),
    replace: true as const, retainOffline: false as const, runnable: false as const });
}

/** One instance per verified device session. Read-only, bounded, effect-free. */
export function createKnowledgePresentation(
  feed: ScopedKnowledgeFeed, broker: TrustedKnowledgeBroker, options: PresentationOptions,
): KnowledgePresentationPort {
  if (!options || !['pc', 'android'].includes(options.surface)) throw new TypeError('trusted device surface required');
  if (options.capabilityReader && typeof options.capabilityReader.read !== 'function') throw new TypeError('trusted capability read port required');
  const now = options.now ?? Date.now;
  const device = createDeviceKnowledgeSnapshotAdapter(feed, broker, options);
  let generation = 0;
  return {
    async read(query, explain) {
      const ticket = ++generation;
      const start = now();
      const before = context(broker);
      if (!query || !allowed(before, query, options.surface, start) || !validExplanation(explain)) {
        device.clear(); return empty('denied');
      }
      const expected = binding(before);
      // Full resnapshot prevents mixing deltas, partial histories and stale tombstones.
      const snapshot = await device.resnapshot(query);
      if (ticket !== generation) return empty('denied');
      if (snapshot.state !== 'ready' && snapshot.state !== 'partial') return empty(snapshot.state);
      if (!snapshot.expiresAt || Date.parse(snapshot.expiresAt) <= now()) { device.clear(); return empty('unavailable'); }
      let help: HelpView | null = null;
      if (explain && (query.purpose === 'help' || query.purpose === 'explain') && options.capabilityReader) {
        try {
          const descriptor = await options.capabilityReader.read(explain.actionId);
          if (ticket !== generation) return empty('denied');
          if (descriptor && descriptor.actionId === explain.actionId
            && (descriptor.surface === 'both' || descriptor.surface === (options.surface === 'pc' ? 'desktop' : 'phone'))) {
            // Missing/private KB ref is indistinguishable: the descriptor may be
            // displayed only if independently allowed by the Host capability port.
            const matchingCard = explain.kbStableId
              ? snapshot.cards.find(c => c.stableId === explain.kbStableId) : undefined;
            const kb = matchingCard ? sourceKb(matchingCard, snapshot.projectionRevision!) : null;
            const proposed = projectCapabilityHelp(descriptor, kb);
            help = proposed.visible ? proposed : null;
          }
        } catch { /* help enrichment is optional and cannot grant/disclose */ }
      }
      const completed = now();
      const after = context(broker);
      if (ticket !== generation || !allowed(after, query, options.surface, completed)
        || binding(after) !== expected || Date.parse(snapshot.expiresAt!) <= completed) {
        device.clear(); return empty('denied');
      }
      return safeResult(snapshot, help);
    },
    notice(event) { generation++; device.notice(event); },
    clear() { generation++; device.clear(); },
  };
}
