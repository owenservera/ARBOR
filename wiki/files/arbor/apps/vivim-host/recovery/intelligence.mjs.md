# File: apps/vivim-host/recovery/intelligence.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/recovery/intelligence.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 19239 B |
| Lines | 230 |
| Hash | b70d38a757c2 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| RECOVERY_PLAN_SCHEMA | const | 9 | yes | export const RECOVERY_PLAN_SCHEMA = &#39;vivim.recovery-plan/1&#39;; |
| RECOVERY_HISTORY_SCHEMA | const | 10 | yes | export const RECOVERY_HISTORY_SCHEMA = &#39;vivim.recovery-history/1&#39;; |
| RECOVERY_MEMORY_SCHEMA | const | 11 | yes | export const RECOVERY_MEMORY_SCHEMA = &#39;vivim.recovery-memory/1&#39;; |
| FAILURE_CATALOG_SCHEMA | const | 12 | yes | export const FAILURE_CATALOG_SCHEMA = &#39;vivim.failure-signatures/1&#39;; |
| ID | const | 13 | no | const ID = /^[A-Za-z0-9_.:-]{1,100}$/; |
| LEVELS | const | 14 | no | const LEVELS = Object.freeze([&#39;R0&#39;, &#39;R1&#39;, &#39;R2&#39;, &#39;R3&#39;, &#39;R4&#39;]); |
| plain | function | 15 | no | const plain = x =&gt; !!x &amp;&amp; typeof x === &#39;object&#39; &amp;&amp; !Array.isArray(x) &amp;&amp; (Object.getPrototypeOf(x) === Object.prototype \|\| Object.getPrototypeOf(x) === null); |
| stable | function | 16 | no | const stable = x =&gt; Array.isArray(x) ? x.map(stable) : plain(x) ? Object.fromEntries(Object.keys(x).sort().map(k =&gt; [k, stable(x[k])])) : x; |
| hash | function | 17 | no | const hash = x =&gt; createHash(&#39;sha256&#39;).update(JSON.stringify(stable(x))).digest(&#39;hex&#39;); |
| fail | function | 18 | no | const fail = code =&gt; { const e = new Error(code); e.code = code; throw e; }; |
| validId | function | 19 | no | const validId = x =&gt; typeof x === &#39;string&#39; &amp;&amp; ID.test(x); |
| validTime | function | 20 | no | const validTime = x =&gt; typeof x === &#39;string&#39; &amp;&amp; Number.isFinite(Date.parse(x)) &amp;&amp; new Date(x).toISOString() === x; |
| RECOVERY_ACTIONS | const | 25 | yes | export const RECOVERY_ACTIONS = Object.freeze({ &#39;host.worker.heartbeat.inspect&#39;: Object.freeze({ level:&#39;R0&#39;, owner:&#39;vivim-host&#39;, effect:&#39;read&#39;, existing:&#39;apps/vivim-host/diagnostics.mjs:workerHealth&#39;… |
| FAILURE_SIGNATURES | const | 35 | yes | export const FAILURE_SIGNATURES = Object.freeze({ schema: FAILURE_CATALOG_SCHEMA, version: 1, entries: Object.freeze({ NO_HEARTBEAT: { target:&#39;worker&#39;, evidence:&#39;missing_heartbeat&#39;, hypothesis:&#39;worke… |
| validateFinding | function | 54 | yes | export function validateFinding(f) { |
| diagnoseRecovery | function | 66 | yes | export function diagnoseRecovery(finding) { |
| f | const | 67 | no | const f = validateFinding(finding), signature = FAILURE_SIGNATURES.entries[f.code]; |
| observed | const | 69 | no | const observed = f.evidence.some(e=&gt;e.kind === signature.evidence); |
| latestFailureAt | const | 70 | no | const latestFailureAt = Math.max(0,...f.evidence.filter(e=&gt;e.kind===signature.evidence).map(e=&gt;Date.parse(e.at))); |
| healthy | const | 71 | no | const healthy = f.evidence.some(e=&gt;e.kind === &#39;authoritative_healthy&#39; &amp;&amp; Date.parse(e.at)&gt;latestFailureAt); |
| classification | const | 72 | no | const classification = healthy &amp;&amp; observed ? &#39;already_recovered&#39; : !observed ? &#39;missing_observability&#39; : |
| planRecovery | function | 84 | yes | export function planRecovery(finding, { now, policyVersion, authorityEpoch, worldRevision = null, environmentKey = &#39;unknown&#39; } = {}) { |
| f | const | 85 | no | const f = validateFinding(finding); |
| diagnosis | const | 88 | no | const diagnosis = diagnoseRecovery(f); |
| signature | const | 89 | no | const signature = FAILURE_SIGNATURES.entries[f.code]; |
| blocked | const | 90 | no | const blocked = [&#39;already_recovered&#39;,&#39;unknown&#39;].includes(diagnosis.classification) \|\| !signature \|\| signature.target !== f.target.kind; |
| actionId | const | 91 | no | const actionId = !blocked &amp;&amp; signature.first ? signature.first : null; |
| action | const | 92 | no | const action = actionId ? RECOVERY_ACTIONS[actionId] : null; |
| operations | const | 93 | no | const operations = action ? [{ actionId, owner:action.owner, existingExecutor:action.existing, level:action.level, |
| mustEscalate | const | 99 | no | const mustEscalate = !operations.length \|\| [&#39;CONTROL_UNCERTAIN&#39;,&#39;SEND_OUTCOME_UNCERTAIN&#39;,&#39;GRANT_REVOKED&#39;,&#39;SCHEMA_MISMATCH&#39;].includes(f.code); |
| body | const | 100 | no | const body = { schema:RECOVERY_PLAN_SCHEMA, signatureVersion:FAILURE_SIGNATURES.version, |
| planDigest | const | 108 | no | const planDigest = hash(body); |
| proposeManualRecovery | function | 113 | yes | export function proposeManualRecovery(finding, actionId, ctx) { |
| f | const | 114 | no | const f=validateFinding(finding); |
| proposed | const | 115 | no | const proposed=planRecovery(f,ctx); |
| action | const | 116 | no | const action=RECOVERY_ACTIONS[actionId]; |
| kinds | const | 119 | no | const kinds=new Set(f.evidence.map(e=&gt;e.kind)); |
| body | const | 123 | no | const body={...base,operations:[{actionId,owner:action.owner,existingExecutor:action.existing,level:action.level, |
| planDigest | const | 129 | no | const planDigest=hash(body); |
| beginRecovery | function | 133 | yes | export function beginRecovery(plan) { |
| transitionRecovery | function | 142 | yes | export function transitionRecovery(history, plan, event) { |
| s | const | 150 | no | const s = history.state; |
| op | const | 152 | no | const op = plan.operations[history.stepIndex]; |
| next | const | 153 | no | const next = { ...history, eventIds:[...history.eventIds,event.id], receipts:[...history.receipts], evidenceRefs:[...history.evidenceRefs] }; |
| learnRecovery | function | 187 | yes | export function learnRecovery(memory = [], outcome) { |
| key | const | 194 | no | const key = [outcome.signature,outcome.actionId,outcome.environmentKey].join(&#39;\|&#39;); |
| current | const | 195 | no | const current = memory.find(x=&gt;x.key===key) ?? {schema:RECOVERY_MEMORY_SCHEMA,key,signature:outcome.signature, |
| updated | const | 200 | no | const updated = { ...current,successes:current.successes+(outcome.result===&#39;verified_success&#39;?1:0), |
| rankRecoveryActions | function | 210 | yes | export function rankRecoveryActions(actionIds, { signature, environmentKey, memory = [] } = {}) { |
| m | const | 214 | no | const m=memory.find(x=&gt;x.key===[signature,actionId,environmentKey].join(&#39;\|&#39;)); |
| total | const | 215 | no | const total=m ? m.successes+m.failures+m.harms : 0; |
| score | const | 216 | no | const score=total&gt;=5 ? (m.successes+1)/(total+2) - 0.5*m.harms : 0; |
| recoveryHistoryView | function | 222 | yes | export function recoveryHistoryView(plan, history) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 7 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/recovery/host-adapter.mjs](./host-adapter.mjs.md) | ./intelligence.mjs |
| [apps/vivim-host/test/recovery-intelligence.test.mjs](../test/recovery-intelligence.test.mjs.md) | ../recovery/intelligence.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
/**
 * VIVIM Lane D / v1 — pure recovery decisions, NOT a recovery executor.
 * No IO, networking, shell, timers, Host mutations, provider sends or permission grants.
 * All execution remains with the existing authorized Host owners. A recovery plan is
 * advisory even if its state machine records an external authorization event.
 */
import { createHash } from 'node:crypto';

export const RECOVERY_PLAN_SCHEMA = 'vivim.recovery-plan/1';
export const RECOVERY_HISTORY_SCHEMA = 'vivim.recovery-history/1';
export const RECOVERY_MEMORY_SCHEMA = 'vivim.recovery-memory/1';
export const FAILURE_CATALOG_SCHEMA = 'vivim.failure-signatures/1';
const ID = /^[A-Za-z0-9_.:-]{1,100}$/;
const LEVELS = Object.freeze(['R0', 'R1', 'R2', 'R3', 'R4']);
const plain = x => !!x && typeof x === 'object' && !Array.isArray(x) && (Object.getPrototypeOf(x) === Object.prototype || Object.getPrototypeOf(x) === null);
const stable = x => Array.isArray(x) ? x.map(stable) : plain(x) ? Object.fromEntries(Object.keys(x).sort().map(k => [k, stable(x[k])])) : x;
const hash = x => createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
const fail = code => { const e = new Error(code); e.code = code; throw e; };
const validId = x => typeof x === 'string' && ID.test(x);
const validTime = x => typeof x === 'string' && Number.isFinite(Date.parse(x)) && new Date(x).toISOString() === x;

// Readiness and authority are reported as evidence, not inferred from a method's name.
// R0...R4 are RECOVERY levels, separate from the existing Host action R0...R3 risks.
// No registry entry directly binds an arbitrary function, URL, PID, file or command.
export const RECOVERY_ACTIONS = Object.freeze({
  'host.worker.heartbeat.inspect': Object.freeze({ level:'R0', owner:'vivim-host', effect:'read', existing:'apps/vivim-host/diagnostics.mjs:workerHealth', targetKind:'worker', admission:'existing_read_only' }),
  'host.worker.lease.inspect': Object.freeze({ level:'R0', owner:'vivim-host', effect:'read', existing:'apps/vivim-host/bootstrap/worker-supervisor.mjs:status', targetKind:'worker', admission:'existing_read_only' }),
  'host.control.outcome.inspect': Object.freeze({ level:'R0', owner:'vivim-host', effect:'read', existing:'apps/vivim-host/control/dispatcher.mjs:status', targetKind:'control', admission:'existing_read_only' }),
  'host.world.projection.inspect': Object.freeze({ level:'R0', owner:'vivim-host', effect:'read', existing:'apps/vivim-host/bootstrap/runtime.mjs:projection', targetKind:'world', admission:'existing_read_only' }),
  'host.worker.lease.recover': Object.freeze({ level:'R2', owner:'vivim-host', effect:'lease_change', existing:'apps/vivim-host/bootstrap/worker-supervisor.mjs:recover', targetKind:'worker', admission:'blocked_pending_route_authorization_proof' }),
  'host.world.revision.undo': Object.freeze({ level:'R3', owner:'vivim-host', effect:'persistent_world_mutation', existing:'apps/vivim-host/bootstrap/runtime.mjs:undoUiRevision', targetKind:'world', admission:'owner_approved_host_path_only' }),
});

// Versioned, source-linked signature hypotheses. A code alone is never proof.
export const FAILURE_SIGNATURES = Object.freeze({
  schema: FAILURE_CATALOG_SCHEMA,
  version: 1,
  entries: Object.freeze({
    NO_HEARTBEAT: { target:'worker', evidence:'missing_heartbeat', hypothesis:'worker not observed; process death not established', first:'host.worker.heartbeat.inspect' },
    HEARTBEAT_STALE: { target:'worker', evidence:'stale_heartbeat', hypothesis:'worker may be delayed, disconnected or stopped', first:'host.worker.lease.inspect' },
    WORKER_CYCLE_FAILED: { target:'worker', evidence:'worker_cycle_error', hypothesis:'worker reported an unsuccessful cycle', first:'host.worker.lease.inspect' },
    PROCESS_ENDED: { target:'worker', evidence:'process_exit', hypothesis:'process exited; pending effects may be uncertain', first:'host.worker.lease.inspect' },
    HOST_TRANSPORT_DISCONNECTED: { target:'worker', evidence:'transport_disconnected', hypothesis:'transport may be offline, expired or owned by a dead worker', first:'host.worker.lease.inspect' },
    CONTROL_UNCERTAIN: { target:'control', evidence:'control_claim_without_receipt', hypothesis:'claimed effect has no terminal receipt; outcome unknown', first:'host.control.outcome.inspect' },
    SEND_OUTCOME_UNCERTAIN: { target:'control', evidence:'send_outcome_uncertain', hypothesis:'provider send may have occurred; do not resend', first:'host.control.outcome.inspect' },
    PHONE_PROJECTION_STALE: { target:'world', evidence:'revision_gap', hypothesis:'phone projection may lag the authoritative World', first:'host.world.projection.inspect' },
    GRANT_REVOKED: { target:'world', evidence:'grant_revocation', hypothesis:'permission is revoked; cached sensitive projections must not be restored', first:null },
    SCHEMA_MISMATCH: { target:'world', evidence:'schema_mismatch', hypothesis:'consumer and publisher schemas may be incompatible', first:'host.world.projection.inspect' },
    WORLD_REVISION_CONFLICT: { target:'world', evidence:'revision_conflict', hypothesis:'World revision conflict needs canonical state inspection', first:'host.world.projection.inspect' },
  }),
});

/** Only metadata, source references and whitelisted kinds cross this boundary. */
export function validateFinding(f) {
  if (!plain(f) || f.schema !== 'vivim.diagnostic-finding/1' || !validId(f.id) ||
      !plain(f.target) || !validId(f.target.id) || !['worker','control','world'].includes(f.target.kind) ||
      !validTime(f.observedAt) || !['low','medium','high','critical'].includes(f.severity) ||
      typeof f.code !== 'string' || f.code.length > 80 || !/^[A-Z0-9_]+$/.test(f.code) ||
      !Number.isFinite(f.confidence) || f.confidence < 0 || f.confidence > 1 ||
      !Array.isArray(f.evidence) || f.evidence.length > 16 ||
      !f.evidence.every(e => plain(e) && validId(e.ref) && validId(e.kind) && validTime(e.at) && Object.keys(e).every(k=>['ref','kind','at'].includes(k)))) fail('RECOVERY_FINDING_INVALID');
  return f;
}

/** Diagnostic state is separate from treatment readiness. */
export function diagnoseRecovery(finding) {
  const f = validateFinding(finding), signature = FAILURE_SIGNATURES.entries[f.code];
  if (!signature || signature.target !== f.target.kind) return { classification:'unknown', hypotheses:[], evidenceRefs:f.evidence.map(e=>e.ref), escalation:'unknown_or_mismatched_signature' };
  const observed = f.evidence.some(e=>e.kind === signature.evidence);
  const latestFailureAt = Math.max(0,...f.evidence.filter(e=>e.kind===signature.evidence).map(e=>Date.parse(e.at)));
  const healthy = f.evidence.some(e=>e.kind === 'authoritative_healthy' && Date.parse(e.at)>latestFailureAt);
  const classification = healthy && observed ? 'already_recovered' : !observed ? 'missing_observability' :
    ['CONTROL_UNCERTAIN','SEND_OUTCOME_UNCERTAIN','GRANT_REVOKED'].includes(f.code) ? 'confirmed_state_not_effect_outcome' :
    f.confidence >= 0.9 ? 'confirmed_failure_signal' : 'suspected';
  return { classification, hypotheses:[{ code:f.code, explanation:signature.hypothesis, confidence:observed?f.confidence:0 }],
    evidenceRefs:f.evidence.map(e=>e.ref), escalation:null };
}

/**
 * Builds a non-executing, digest-pinned suggestion. No policy object passed here
```

_First 80 of 231 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
