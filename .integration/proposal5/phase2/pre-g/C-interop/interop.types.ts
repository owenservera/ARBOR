/**
 * ARBOR P2-C — proposed structural TYPES ONLY, not a runtime package.
 * Post-G F owns compatibility with contracts/interop/v1/types.ts + validate.mjs.
 * No identity mint, action catalog, permission store, scheduler or publisher.
 */
export type ReadDomain = 'development' | 'personal' | 'control' | 'ui';
export interface SourceRefV1 {
 readonly id: string;
 readonly domain: ReadDomain;
 readonly ownerRef: string | null;
 readonly revision: number;
}
/** Host must supply actor and session after authentication; never trust client actor claims. */
export interface TrustedReadContext {
 readonly actorId: string;
 readonly sessionId: string;
 readonly audience: 'desktop-owner' | 'paired-phone-owner';
 readonly source: SourceRefV1;
 readonly afterSeq: number;
}
/** Projection-observation event only; submit/approve/receipt stay at B Host. */
export interface ReadObservation {
 readonly eventId: string;
 readonly kind: 'draft' | 'observation';
 readonly seq: number;
 readonly expectedRevision: number;
}
export interface InertCue {
 readonly kind: 'semantic' | 'chronos' | 'source';
 /** Static machine code, not content-bearing raw user text. */
 readonly code: string;
}
export interface InertReadEnvelope {
 readonly schema: 'arbor.p2c.inert-read/1';
 readonly actorId: string;
 readonly sessionId: string;
 readonly audience: TrustedReadContext['audience'];
 readonly source: SourceRefV1;
 readonly event: ReadObservation;
 readonly inert: true;
 readonly effectAllowed: false;
 readonly automaticRetryAllowed: false;
 readonly status: 'candidate' | 'grounded';
 readonly cues: readonly InertCue[];
}
export interface ChronosConversationReadSubset {
 readonly schema: 'vivim.chronos.conversation-read/1';
 readonly conversationId: string;
 readonly sourceRevision: number;
 readonly asOfMs: number;
 readonly clockQuality: string;
 readonly turns: readonly { readonly authoritativeSendReceipt: false }[];
 readonly responseLatencyMs: null;
 readonly effectAllowed: false;
 readonly automaticRetryAllowed: false;
}
export interface ChronosSupervisorReadSubset {
 readonly schema: 'vivim.chronos.supervisor-read/1';
 readonly observedAtMs: number;
 readonly sourceLastSeq: number;
 readonly durationAuthority: 'wall_clock_estimate_only';
 readonly effectAllowed: false;
 readonly dispatchAllowed: false;
 readonly lanes: readonly unknown[];
}
/** Status never means scheduler ran, a request executed or a receipt was written. */
export interface InertChronosVisualResult {
 readonly ok: true;
 readonly kind: 'conversation' | 'supervisor';
 readonly status: 'estimate_only' | 'degraded';
 readonly sourceRevision: number;
 readonly items: number;
 readonly effectAllowed: false;
 readonly canExecute: false;
 readonly automaticRetryAllowed: false;
}
export type ReadRefusalCode =
 'BAD_TRUSTED_CONTEXT' | 'INVALID_PROJECTION' | 'ACTOR_OR_AUDIENCE_MISMATCH' |
 'FOREIGN_OR_STALE_SOURCE' | 'STALE_OR_UNAUTHORIZED_EVENT' |
 'EFFECT_CLAIM_FORBIDDEN' | 'NOT_DISPLAYABLE' | 'UNBOUNDED_OR_RAW_CUE' |
 'CHRONOS_EFFECT_CLAIM' | 'CHRONOS_CONVERSATION_UNTRUSTED' |
 'CHRONOS_SUPERVISOR_UNTRUSTED' | 'UNSUPPORTED_CHRONOS_SCHEMA';
export type ReadResult<T> = T | Readonly<{ok:false;code:ReadRefusalCode}>;
