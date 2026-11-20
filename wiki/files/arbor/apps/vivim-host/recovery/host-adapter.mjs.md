# File: apps/vivim-host/recovery/host-adapter.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/recovery/host-adapter.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4084 B |
| Lines | 76 |
| Hash | 4465771e2292 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HOST_RECOVERY_VIEW_SCHEMA | const | 8 | yes | export const HOST_RECOVERY_VIEW_SCHEMA = &#39;vivim.host-recovery-read-model/1&#39;; |
| WORKERS | const | 9 | no | const WORKERS = Object.freeze([&#39;relay&#39;, &#39;chatWorker&#39;]); |
| WORKER_CODES | const | 10 | no | const WORKER_CODES = new Set([&#39;NO_HEARTBEAT&#39;, &#39;HEARTBEAT_STALE&#39;, &#39;WORKER_CYCLE_FAILED&#39;]); |
| ISO | function | 11 | no | const ISO = x =&gt; { |
| n | const | 12 | no | const n = typeof x === &#39;string&#39; ? Date.parse(x) : NaN; |
| plain | function | 15 | no | const plain = x =&gt; x !== null &amp;&amp; typeof x === &#39;object&#39; &amp;&amp; !Array.isArray(x); |
| CMD | const | 16 | no | const CMD = /^cmd-[a-f0-9]{16}$/; |
| project | function | 18 | no | function project(f) { |
| d | const | 19 | no | const d = diagnoseRecovery(f); |
| known | const | 20 | no | const known = FAILURE_SIGNATURES.entries[f.code]; |
| actionId | const | 21 | no | const actionId = known?.first \|\| null; |
| action | const | 22 | no | const action = actionId ? RECOVERY_ACTIONS[actionId] : null; |
| projectHostRecovery | function | 36 | yes | export function projectHostRecovery(snapshot, { maxFindings = 12 } = {}) { |
| now | const | 41 | no | const now = ISO(snapshot.observedAt); |
| evidenceAt | function | 42 | no | const evidenceAt = value =&gt; { |
| timestamp | const | 43 | no | const timestamp = ISO(value); |
| findings | const | 46 | no | const findings = []; |
| worker | const | 49 | no | const worker = snapshot.services[name]; |
| code | const | 50 | no | const code = worker?.diagnosticCode; |
| evidenceKind | const | 53 | no | const evidenceKind = FAILURE_SIGNATURES.entries[code].evidence; |
| stamp | const | 54 | no | const stamp = evidenceAt(worker?.lastHeartbeatAt); |
| evidence | const | 55 | no | const evidence = stamp &amp;&amp; code !== &#39;NO_HEARTBEAT&#39; |
| stamp | const | 66 | no | const stamp=evidenceAt(item.updatedAt); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./intelligence.mjs | import | 6 | [apps/vivim-host/recovery/intelligence.mjs](./intelligence.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/server.mjs](../server.mjs.md) | ./recovery/host-adapter.mjs |
| [apps/vivim-host/test/recovery-host-adapter.test.mjs](../test/recovery-host-adapter.test.mjs.md) | ../recovery/host-adapter.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
/**
 * VIVIM Lane D R0 Host adapter. Converts bounded existing Host diagnostics to
 * evidence-linked suggestions. Pure, owner-local, no plan or effect authority.
 * In particular, this module cannot infer successful phone delivery or retry a send.
 */
import { diagnoseRecovery, FAILURE_SIGNATURES, RECOVERY_ACTIONS } from './intelligence.mjs';

export const HOST_RECOVERY_VIEW_SCHEMA = 'vivim.host-recovery-read-model/1';
const WORKERS = Object.freeze(['relay', 'chatWorker']);
const WORKER_CODES = new Set(['NO_HEARTBEAT', 'HEARTBEAT_STALE', 'WORKER_CYCLE_FAILED']);
const ISO = x => {
  const n = typeof x === 'string' ? Date.parse(x) : NaN;
  return Number.isFinite(n) ? new Date(n).toISOString() : null;
};
const plain = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const CMD = /^cmd-[a-f0-9]{16}$/;

function project(f) {
  const d = diagnoseRecovery(f);
  const known = FAILURE_SIGNATURES.entries[f.code];
  const actionId = known?.first || null;
  const action = actionId ? RECOVERY_ACTIONS[actionId] : null;
  // An R0 read is a recommendation, not a command or permission.
  return {
    findingId: f.id, code: f.code, target: f.target, severity: f.severity,
    classification: d.classification, confidence: d.hypotheses[0]?.confidence ?? 0,
    evidenceRefs: d.evidenceRefs,
    recommendedRead: action?.level === 'R0' && action.admission === 'existing_read_only'
      ? { actionId, owner: action.owner, effect: 'read', existingExecutor: action.existing }
      : null,
    autoExecute: false, mustVerifyIndependently: true,
  };
}

/** Accept only the existing Host snapshot's bounded metadata; never raw messages. */
export function projectHostRecovery(snapshot, { maxFindings = 12 } = {}) {
  if (!plain(snapshot) || snapshot.schema !== 'vivim.host-status/1' ||
      !plain(snapshot.services) || !plain(snapshot.journey) ||
      !Number.isInteger(maxFindings) || maxFindings < 1 || maxFindings > 25 ||
      !ISO(snapshot.observedAt)) throw new TypeError('RECOVERY_HOST_SNAPSHOT_INVALID');
  const now = ISO(snapshot.observedAt);
  const evidenceAt = value => {
    const timestamp = ISO(value);
    return timestamp && Date.parse(timestamp) <= Date.parse(now) + 2000 ? timestamp : null;
  };
  const findings = [];
  for (const name of WORKERS) {
    if (findings.length >= maxFindings) break;
    const worker = snapshot.services[name];
    const code = worker?.diagnosticCode;
    if (!WORKER_CODES.has(code)) continue;
    // A missing heartbeat is missing observability, NOT evidence of process death.
    const evidenceKind = FAILURE_SIGNATURES.entries[code].evidence;
    const stamp = evidenceAt(worker?.lastHeartbeatAt);
    const evidence = stamp && code !== 'NO_HEARTBEAT'
      ? [{ ref:`host.worker.${name}.${Date.parse(stamp)}`,kind:evidenceKind,at:stamp }] : [];
    findings.push(project({ schema:'vivim.diagnostic-finding/1', id:`host.${name}.${code}`,
      code, severity:code === 'WORKER_CYCLE_FAILED' ? 'high' : 'medium',
      confidence:code === 'WORKER_CYCLE_FAILED' ? 0.95 : 0.65,
      target:{kind:'worker',id:name},observedAt:now,evidence }));
  }
  if (Array.isArray(snapshot.journey.recent)) {
    for (const item of snapshot.journey.recent.slice(0, 25)) {
      if (findings.length >= maxFindings) break;
      if (item?.currentStage !== 'send_outcome_uncertain' || !CMD.test(item?.id ?? '')) continue;
      const stamp=evidenceAt(item.updatedAt);
      findings.push(project({ schema:'vivim.diagnostic-finding/1', id:`host.${item.id}.uncertain`,
        code:'SEND_OUTCOME_UNCERTAIN', severity:'high',confidence:0.95,
        target:{kind:'control',id:item.id},observedAt:now,
        evidence:stamp ? [{ref:item.id,kind:'send_outcome_uncertain',at:stamp}] : [] }));
    }
  }
  return { schema:HOST_RECOVERY_VIEW_SCHEMA,observedAt:now,findings,
    automaticMutations:0,automaticProviderResends:0,
    note:'Diagnostic read-model only. A repair requires a separate, current Host-authorized plan and independently verified outcome.' };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
