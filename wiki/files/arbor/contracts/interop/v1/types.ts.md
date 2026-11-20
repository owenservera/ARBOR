# File: contracts/interop/v1/types.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | contracts/interop/v1/types.ts |
| Language | TypeScript |
| Kind | source |
| Size | 1346 B |
| Lines | 12 |
| Hash | e20ec8324525 |
| Test | no |
| Generated | no |
| Component | contracts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SourceDomain | type | 2 | yes | export type SourceDomain = &#39;development&#39;\|&#39;personal&#39;\|&#39;control&#39;\|&#39;ui&#39;; |
| SourceRef | interface | 3 | yes | export interface SourceRef { readonly id:string; readonly domain:SourceDomain; readonly ownerRef:string\|null; readonly revision:number; } |
| Confidence | type | 4 | yes | export type Confidence = &#39;rule&#39;\|&#39;accepted-pattern&#39;\|&#39;source-observed&#39;\|&#39;model-proposed&#39;; |
| EvidenceRef | interface | 5 | yes | export interface EvidenceRef { readonly source:SourceRef; readonly digest:string; readonly confidence:Confidence; } |
| EventKind | type | 6 | yes | export type EventKind = &#39;draft&#39;\|&#39;accept&#39;\|&#39;submit&#39;\|&#39;cancel&#39;\|&#39;approve&#39;\|&#39;receipt&#39;\|&#39;observation&#39;; |
| RevisionEvent | interface | 7 | yes | export interface RevisionEvent { readonly eventId:string; readonly kind:EventKind; readonly source:SourceRef; readonly expectedRevision:number; } |
| HostRisk | type | 8 | yes | export type HostRisk = &#39;R0&#39;\|&#39;R1&#39;\|&#39;R2&#39;\|&#39;R3&#39;; |
| CapabilityRef | interface | 9 | yes | export interface CapabilityRef { readonly id:string; readonly owner:string; readonly risk:HostRisk\|null; readonly source:SourceRef; } |
| HostJournalState | type | 10 | yes | export type HostJournalState = &#39;planned&#39;\|&#39;approved&#39;\|&#39;uncertain&#39;\|&#39;applied&#39;\|&#39;failed&#39;; |
| InertViewProjection | interface | 11 | yes | export interface InertViewProjection { readonly schema:&#39;arbor.inert-view/1&#39;; readonly source:SourceRef; readonly inert:true; readonly status:&#39;candidate&#39;\|&#39;grounded&#39;\|&#39;ambiguous&#39;\|&#39;stale&#39;\|&#39;unavailable&#39;; … |
| GraduationStatus | type | 12 | yes | export type GraduationStatus=&#39;IMPLEMENTED&#39;\|&#39;VERIFIED&#39;\|&#39;DESIGN_ONLY&#39;\|&#39;PREVIEW&#39;\|&#39;DEFERRED&#39;\|&#39;BLOCKED&#39;; |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
