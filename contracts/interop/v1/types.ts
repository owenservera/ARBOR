/** W01-F: type mirror only. No action/approval authority; Host remains canonical. */
export type SourceDomain = 'development'|'personal'|'control'|'ui';
export interface SourceRef { readonly id:string; readonly domain:SourceDomain; readonly ownerRef:string|null; readonly revision:number; }
export type Confidence = 'rule'|'accepted-pattern'|'source-observed'|'model-proposed';
export interface EvidenceRef { readonly source:SourceRef; readonly digest:string; readonly confidence:Confidence; }
export type EventKind = 'draft'|'accept'|'submit'|'cancel'|'approve'|'receipt'|'observation';
export interface RevisionEvent { readonly eventId:string; readonly kind:EventKind; readonly source:SourceRef; readonly expectedRevision:number; }
export type HostRisk = 'R0'|'R1'|'R2'|'R3';
export interface CapabilityRef { readonly id:string; readonly owner:string; readonly risk:HostRisk|null; readonly source:SourceRef; }
export type HostJournalState = 'planned'|'approved'|'uncertain'|'applied'|'failed';
export interface InertViewProjection { readonly schema:'arbor.inert-view/1'; readonly source:SourceRef; readonly inert:true; readonly status:'candidate'|'grounded'|'ambiguous'|'stale'|'unavailable'; readonly actions:readonly string[]; }
export type GraduationStatus='IMPLEMENTED'|'VERIFIED'|'DESIGN_ONLY'|'PREVIEW'|'DEFERRED'|'BLOCKED';
