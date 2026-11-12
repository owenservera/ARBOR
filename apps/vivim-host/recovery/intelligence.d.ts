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
  readonly actionId?:string;
  readonly targetId?:string;
  readonly receiptRef?:string;
  readonly observationRef?:string;
  readonly observer?:string;
  readonly executor?:string;
  readonly expectedObservation?:string;
  readonly result?:'satisfied'|'not_satisfied'|'unknown';
}
export interface RecoveryMemoryEntry {
  readonly schema:'vivim.recovery-memory/1';
  readonly key:string;
  readonly signature:string;
  readonly actionId:string;
  readonly environmentKey:string;
  readonly successes:number;
  readonly failures:number;
  readonly harms:number;
  readonly evidenceRefs:readonly string[];
  readonly unsafeConditions:readonly string[];
}
export declare const RECOVERY_PLAN_SCHEMA:'vivim.recovery-plan/1';
export declare const RECOVERY_HISTORY_SCHEMA:'vivim.recovery-history/1';
export declare const RECOVERY_MEMORY_SCHEMA:'vivim.recovery-memory/1';
export declare const FAILURE_CATALOG_SCHEMA:'vivim.failure-signatures/1';
export declare const RECOVERY_ACTIONS:Readonly<Record<string,Readonly<{level:RecoveryLevel;owner:'vivim-host';effect:string;existing:string;targetKind:string;admission:string}>>>;
export declare const FAILURE_SIGNATURES:Readonly<{schema:'vivim.failure-signatures/1';version:1;entries:Readonly<Record<string,Readonly<{target:string;evidence:string;hypothesis:string;first:string|null}>>>}>;
export declare function validateFinding(finding:DiagnosticFinding):DiagnosticFinding;
export declare function diagnoseRecovery(finding:DiagnosticFinding):{classification:DiagnosticClassification;hypotheses:readonly {code:string;explanation:string;confidence:number}[];evidenceRefs:string[];escalation:string|null};
export declare function planRecovery(finding:DiagnosticFinding,context:RecoveryContext):RecoveryPlan;
export declare function proposeManualRecovery(finding:DiagnosticFinding,actionId:string,context:RecoveryContext):RecoveryPlan;
export declare function beginRecovery(plan:RecoveryPlan):RecoveryHistory;
export declare function transitionRecovery(history:RecoveryHistory,plan:RecoveryPlan,event:RecoveryEvent):RecoveryHistory;
export declare function learnRecovery(memory:readonly RecoveryMemoryEntry[],outcome:{signature:string;actionId:string;environmentKey:string;observationRef:string;independentObserver:string;executor:string;result:'verified_success'|'verified_failure'|'verified_harm';unsafeCondition?:string}):RecoveryMemoryEntry[];
export declare function rankRecoveryActions(actionIds:readonly string[],opts:{signature:string;environmentKey:string;memory?:readonly RecoveryMemoryEntry[]}):{actionId:string;score:number;sampleCount:number;admission:string}[];
export declare function recoveryHistoryView(plan:RecoveryPlan,history:RecoveryHistory):{schema:'vivim.recovery-history-view/1';planId:string;findingId:string;state:RecoveryState;failureCode:string;targetKind:string;verification:'independently_observed'|'not_verified';explanation:string|null;requiresOwner:boolean;receiptRefs:string[];evidenceRefs:string[];suggestedTierFlowStage:'applied'|'uncertain'|'failed'};
