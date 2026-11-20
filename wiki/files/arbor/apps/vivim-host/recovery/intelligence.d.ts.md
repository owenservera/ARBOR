# File: apps/vivim-host/recovery/intelligence.d.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/recovery/intelligence.d.ts |
| Language | TypeScript |
| Kind | source |
| Size | 6324 B |
| Lines | 116 |
| Hash | 77622efca1ed |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| RecoveryLevel | type | 2 | yes | export type RecoveryLevel = &#39;R0&#39; \| &#39;R1&#39; \| &#39;R2&#39; \| &#39;R3&#39; \| &#39;R4&#39;; |
| DiagnosticClassification | type | 3 | yes | export type DiagnosticClassification = &#39;unknown&#39; \| &#39;missing_observability&#39; \| &#39;suspected&#39; \| &#39;confirmed_failure_signal&#39; \| &#39;confirmed_state_not_effect_outcome&#39; \| &#39;already_recovered&#39;; |
| RecoveryState | type | 4 | yes | export type RecoveryState = &#39;proposed&#39; \| &#39;authorized&#39; \| &#39;dispatched&#39; \| &#39;observing&#39; \| &#39;verified&#39; \| &#39;failed&#39; \| &#39;uncertain&#39; \| &#39;escalated&#39;; |
| RecoveryTarget | type | 5 | yes | export type RecoveryTarget = Readonly&lt;{ kind:&#39;worker&#39;\|&#39;control&#39;\|&#39;world&#39;; id:string }&gt;; |
| EvidenceRef | type | 6 | yes | export type EvidenceRef = Readonly&lt;{ ref:string; kind:string; at:string }&gt;; |
| DiagnosticFinding | interface | 7 | yes | export interface DiagnosticFinding { |
| RecoveryContext | interface | 17 | yes | export interface RecoveryContext { |
| RecoveryOperation | interface | 24 | yes | export interface RecoveryOperation { |
| RecoveryPlan | interface | 36 | yes | export interface RecoveryPlan { |
| RecoveryHistory | interface | 61 | yes | export interface RecoveryHistory { |
| RecoveryEvent | interface | 73 | yes | export interface RecoveryEvent { |
| RecoveryMemoryEntry | interface | 90 | yes | export interface RecoveryMemoryEntry { |
| validateFinding | function | 108 | yes | export declare function validateFinding(finding:DiagnosticFinding):DiagnosticFinding; |
| diagnoseRecovery | function | 109 | yes | export declare function diagnoseRecovery(finding:DiagnosticFinding):{classification:DiagnosticClassification;hypotheses:readonly {code:string;explanation:string;confidence:number}[];evidenceRefs:stri… |
| planRecovery | function | 110 | yes | export declare function planRecovery(finding:DiagnosticFinding,context:RecoveryContext):RecoveryPlan; |
| proposeManualRecovery | function | 111 | yes | export declare function proposeManualRecovery(finding:DiagnosticFinding,actionId:string,context:RecoveryContext):RecoveryPlan; |
| beginRecovery | function | 112 | yes | export declare function beginRecovery(plan:RecoveryPlan):RecoveryHistory; |
| transitionRecovery | function | 113 | yes | export declare function transitionRecovery(history:RecoveryHistory,plan:RecoveryPlan,event:RecoveryEvent):RecoveryHistory; |
| learnRecovery | function | 114 | yes | export declare function learnRecovery(memory:readonly RecoveryMemoryEntry[],outcome:{signature:string;actionId:string;environmentKey:string;observationRef:string;independentObserver:string;executor:s… |
| rankRecoveryActions | function | 115 | yes | export declare function rankRecoveryActions(actionIds:readonly string[],opts:{signature:string;environmentKey:string;memory?:readonly RecoveryMemoryEntry[]}):{actionId:string;score:number;sampleCount… |
| recoveryHistoryView | function | 116 | yes | export declare function recoveryHistoryView(plan:RecoveryPlan,history:RecoveryHistory):{schema:&#39;vivim.recovery-history-view/1&#39;;planId:string;findingId:string;state:RecoveryState;failureCode:string;ta… |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/** Lane D v1 is a pure planning/verification projection; no declared API executes a recovery. */
export type RecoveryLevel = 'R0' | 'R1' | 'R2' | 'R3' | 'R4';
export type DiagnosticClassification = 'unknown' | 'missing_observability' | 'suspected' | 'confirmed_failure_signal' | 'confirmed_state_not_effect_outcome' | 'already_recovered';
export type RecoveryState = 'proposed' | 'authorized' | 'dispatched' | 'observing' | 'verified' | 'failed' | 'uncertain' | 'escalated';
export type RecoveryTarget = Readonly<{ kind:'worker'|'control'|'world'; id:string }>;
export type EvidenceRef = Readonly<{ ref:string; kind:string; at:string }>;
export interface DiagnosticFinding {
  readonly schema:'vivim.diagnostic-finding/1';
  readonly id:string;
  readonly code:string;
  readonly severity:'low'|'medium'|'high'|'critical';
  readonly confidence:number;
  readonly target:RecoveryTarget;
  readonly observedAt:string;
  readonly evidence:readonly EvidenceRef[];
}
export interface RecoveryContext {
  readonly now:string; // canonical ISO timestamp, supplied by owner-side caller
  readonly policyVersion:string;
  readonly authorityEpoch:string;
  readonly worldRevision?:string|null;
  readonly environmentKey?:string;
}
export interface RecoveryOperation {
  readonly actionId:string;
  readonly owner:'vivim-host';
  readonly existingExecutor:string;
  readonly level:RecoveryLevel;
  readonly target:RecoveryTarget;
  readonly effect:string;
  readonly admission:string;
  readonly preconditions:readonly string[];
  readonly expectedObservation:string;
  readonly retryBudget:0;
}
export interface RecoveryPlan {
  readonly schema:'vivim.recovery-plan/1';
  readonly signatureVersion:1;
  readonly findingId:string;
  readonly failureCode:string;
  readonly target:RecoveryTarget;
  readonly createdAt:string;
  readonly expiresAt:string;
  readonly policyVersion:string;
  readonly authorityEpoch:string;
  readonly worldRevision:string|null;
  readonly environmentKey:string;
  readonly classification:DiagnosticClassification;
  readonly evidenceRefs:readonly string[];
  readonly operations:readonly RecoveryOperation[];
  readonly requiresHostAuthorization:true;
  readonly grantsPermission:false;
  readonly automaticEffectsAllowed:false;
  readonly externalEffectRetryBudget:0;
  readonly rollback:'none_without_separate_owner_authorized_plan';
  readonly escalation:string|null;
  readonly safeguards:readonly string[];
  readonly planId:string;
  readonly planDigest:string;
}
export interface RecoveryHistory {
  readonly schema:'vivim.recovery-history/1';
  readonly planId:string;
  readonly planDigest:string;
  readonly state:RecoveryState;
  readonly stepIndex:number;
  readonly attempts:number;
  readonly eventIds:readonly string[];
  readonly receipts:readonly string[];
  readonly evidenceRefs:readonly string[];
  readonly reason:string|null;
}
export interface RecoveryEvent {
  readonly id:string;
  readonly type:'authorize'|'dispatch'|'acknowledge'|'verify'|'interrupt'|'escalate';
  readonly at:string;
  readonly planDigest?:string;
  readonly policyVersion?:string;
  readonly authorityEpoch?:string;
  readonly hostAuthorizationVerified?:boolean;
```

_First 80 of 117 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
