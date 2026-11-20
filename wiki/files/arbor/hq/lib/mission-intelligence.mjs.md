# File: hq/lib/mission-intelligence.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/mission-intelligence.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12357 B |
| Lines | 181 |
| Hash | ab1e79c11505 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MISSION_SCHEMA | const | 14 | yes | export const MISSION_SCHEMA = &#39;hq.mission/1&#39;; |
| MISSION_VIEW_SCHEMA | const | 15 | yes | export const MISSION_VIEW_SCHEMA = &#39;hq.mission-view/1&#39;; |
| ID | const | 16 | no | const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/; |
| DIGEST | const | 17 | no | const DIGEST = /^[a-f0-9]{64}$/; |
| PHASES | const | 18 | no | const PHASES = new Set([&#39;plan&#39;, &#39;execute&#39;, &#39;review&#39;, &#39;verify&#39;, &#39;deliver&#39;]); |
| ACTIVE | const | 19 | no | const ACTIVE = new Set([&#39;ADMITTED&#39;, &#39;STARTING&#39;, &#39;RUNNING&#39;, &#39;SUSPECT&#39;, &#39;CHECKPOINTING&#39;, &#39;VERIFYING&#39;]); |
| TERMINAL_OK | const | 22 | no | const TERMINAL_OK = new Set(); |
| HARD_LANE | const | 23 | no | const HARD_LANE = new Set([&#39;QUARANTINED&#39;, &#39;FAILED&#39;, &#39;FENCED&#39;]); |
| byId | function | 24 | no | const byId = (values) =&gt; new Map(values.map((v) =&gt; [v.id, v])); |
| validTime | function | 25 | no | const validTime = (s) =&gt; typeof s === &#39;string&#39; &amp;&amp; Number.isFinite(Date.parse(s)); |
| asArray | function | 26 | no | const asArray = (v) =&gt; Array.isArray(v) ? v : []; |
| err | function | 27 | no | const err = (code, detail) =&gt; ({ code, detail }); |
| projectMission | function | 34 | yes | export function projectMission({ mission, workOrders, taskView, lanes = [], proofs = [], delivery = null, now, staleAfterMs = 300000 } = {}) { |
| problems | const | 36 | no | const problems = []; |
| current | const | 44 | no | const current = Date.parse(now ?? &#39;&#39;); |
| steps | const | 49 | no | const steps = mission.steps; |
| stepIds | const | 50 | no | const stepIds = new Set(); |
| graph | const | 73 | no | const graph = new Map(); |
| visiting | const | 75 | no | const visiting = new Set(), visited = new Set(); |
| check | function | 76 | no | function check(id) { |
| orders | const | 88 | no | const orders = asArray(workOrders?.orders); |
| tasks | const | 89 | no | const tasks = asArray(taskView?.tasks); |
| ids | const | 94 | no | const ids = rows.map((row) =&gt; label === &#39;lane&#39; ? row.laneId : row.id); |
| orderMap | const | 100 | no | const orderMap = byId(orders), taskMap = byId(tasks); |
| laneMap | const | 101 | no | const laneMap = new Map(asArray(lanes).map((l) =&gt; [l.laneId, l])); |
| result | const | 102 | no | const result = [], state = new Map(); |
| assess | function | 104 | no | function assess(step) { |
| depStates | const | 106 | no | const depStates = step.dependsOn.map((dep) =&gt; assess(steps.find((s) =&gt; s.id === dep))); |
| phase | variable | 107 | no | let phase = &#39;READY&#39;, reason = null; |
| order | const | 113 | no | const order = step.workOrderId ? orderMap.get(step.workOrderId) : null; |
| task | const | 114 | no | const task = step.taskId ? taskMap.get(step.taskId) : null; |
| lane | const | 115 | no | const lane = step.laneId ? laneMap.get(step.laneId) : null; |
| missing | const | 116 | no | const missing = (step.workOrderId &amp;&amp; !order) \|\| (step.taskId &amp;&amp; !task) \|\| (step.laneId &amp;&amp; !lane); |
| failed | const | 117 | no | const failed = [&#39;blocked&#39;, &#39;cancelled&#39;].includes(order?.status) \|\| task?.state === &#39;failed&#39; \|\| HARD_LANE.has(lane?.status); |
| newest | const | 124 | no | const newest = lane &amp;&amp; Date.parse(lane.heartbeatAt \|\| lane.startedAt \|\| &#39;&#39;); |
| sourceDone | const | 129 | no | const sourceDone = (!order \|\| order.status === &#39;done&#39;) &amp;&amp; (!task \|\| task.state === &#39;done&#39;) &amp;&amp; |
| received | const | 131 | no | const received = []; |
| matched | const | 133 | no | const matched = proofs.find((p) =&gt; p?.missionId === mission.id &amp;&amp; p.stepId === step.id &amp;&amp; p.stepRevision === step.revision &amp;&amp; p.missionRevision === mission.revision &amp;&amp; p.kind === requirement.kind &amp;&amp; … |
| missingProofs | const | 141 | no | const missingProofs = step.requirements.filter((requirement) =&gt; !received.some((r) =&gt; r.kind === requirement.kind &amp;&amp; r.source === requirement.source)); |
| stepView | const | 149 | no | const stepView = { id: step.id, title: step.title, phase: step.phase, status: phase, |
| counts | const | 156 | no | const counts = Object.fromEntries([...new Set(result.map((s) =&gt; s.status))].sort() .map((status) =&gt; [status, result.filter((s) =&gt; s.status === status).length])); |
| allVerified | const | 158 | no | const allVerified = result.every((s) =&gt; s.status === &#39;VERIFIED&#39;); |
| digest | const | 159 | no | const digest = typeof mission.outcomeDigest === &#39;string&#39; &amp;&amp; DIGEST.test(mission.outcomeDigest) ? mission.outcomeDigest : null; |
| acknowledged | const | 160 | no | const acknowledged = allVerified &amp;&amp; digest &amp;&amp; delivery?.missionId === mission.id &amp;&amp; |
| has | function | 165 | no | const has = (s) =&gt; result.some((step) =&gt; step.status === s); |
| nextAction | variable | 166 | no | let nextAction = &#39;CONTINUE&#39;, status = &#39;ACTIVE&#39;; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/lib/mission-evaluator.mjs](./mission-evaluator.mjs.md) | ./mission-intelligence.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Mission Intelligence v1 — read-only outcome-aware projection over existing |
| 4 | owner | mission-intelligence | — | mission-intelligence |
| 5 | invariant | — | — | No disk/clock reads, network, dispatch, retries, approvals or delivery effects. |
| 6 | invariant | — | — | A done order, closed task, exited agent, or AI claim never proves an outcome. |
| 7 | invariant | — | — | Input `proofs` MUST come from a caller that independently checked the |
| 9 | invariant | — | — | Delivery acknowledgment is separate from verified answer readiness; |
| 11 | invariant | — | — | This pure projection consumes already-authenticated evidence from the trusted |

## Excerpt

```javascript
/**
 * @hq:context Mission Intelligence v1 — read-only outcome-aware projection over existing
 *   HQ work orders, task lifecycle, supervisor lanes, and independently checked evidence.
 * @hq:owner mission-intelligence
 * @hq:invariant No disk/clock reads, network, dispatch, retries, approvals or delivery effects.
 * @hq:invariant A done order, closed task, exited agent, or AI claim never proves an outcome.
 * @hq:invariant Input `proofs` MUST come from a caller that independently checked the
 *   underlying authoritative receipt/source. `verified: true` is not itself authentication.
 * @hq:invariant Delivery acknowledgment is separate from verified answer readiness;
 *   a phone-render acknowledgment does NOT prove an actual mission outcome was delivered.
 * @hq:invariant This pure projection consumes already-authenticated evidence from the trusted
 *   evaluateMissionFromSources entry point; callers must not expose it to model input directly.
 */
export const MISSION_SCHEMA = 'hq.mission/1';
export const MISSION_VIEW_SCHEMA = 'hq.mission-view/1';
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/;
const DIGEST = /^[a-f0-9]{64}$/;
const PHASES = new Set(['plan', 'execute', 'review', 'verify', 'deliver']);
const ACTIVE = new Set(['ADMITTED', 'STARTING', 'RUNNING', 'SUSPECT', 'CHECKPOINTING', 'VERIFYING']);
// The current HQ supervisor emits EXITED as an event, not trusted lane-success proof.
// No lane status may certify success until a separate verified completion source exists.
const TERMINAL_OK = new Set();
const HARD_LANE = new Set(['QUARANTINED', 'FAILED', 'FENCED']);
const byId = (values) => new Map(values.map((v) => [v.id, v]));
const validTime = (s) => typeof s === 'string' && Number.isFinite(Date.parse(s));
const asArray = (v) => Array.isArray(v) ? v : [];
const err = (code, detail) => ({ code, detail });

/**
 * @param {{mission:object, workOrders?:object, taskView?:object, lanes?:object[],
 * proofs?:object[], delivery?:object, now?:string, staleAfterMs?:number}} input
 * @returns {object} An advisory projection. Never executable authority.
 */
export function projectMission({ mission, workOrders, taskView, lanes = [], proofs = [],
  delivery = null, now, staleAfterMs = 300000 } = {}) {
  const problems = [];
  if (!mission || mission.schema !== MISSION_SCHEMA || !ID.test(mission.id ?? '') ||
      typeof mission.objective !== 'string' || !mission.objective.trim() ||
      !Number.isSafeInteger(mission.revision) || mission.revision < 1 ||
      !Array.isArray(mission.steps) || mission.steps.length === 0 || mission.steps.length > 2048) {
    return { ok: false, schema: MISSION_VIEW_SCHEMA, code: 'MISSION_INVALID',
      errors: [err('BAD_MISSION', 'A versioned mission with objective and steps is required')], nextAction: 'INSPECT' };
  }
  const current = Date.parse(now ?? '');
  if (!Number.isFinite(current) || !Number.isSafeInteger(staleAfterMs) || staleAfterMs < 0) {
    return { ok: false, schema: MISSION_VIEW_SCHEMA, code: 'MISSION_INVALID',
      errors: [err('BAD_CLOCK', 'An explicit ISO observation time and non-negative stale threshold are required')], nextAction: 'INSPECT' };
  }
  const steps = mission.steps;
  const stepIds = new Set();
  for (const step of steps) {
    if (!step || !ID.test(step.id ?? '') || typeof step.title !== 'string' || !step.title.trim() ||
        !PHASES.has(step.phase) || !Number.isSafeInteger(step.revision) || step.revision < 1) {
      problems.push(err('BAD_STEP', String(step?.id ?? '(unknown)')));
      continue;
    }
    if (stepIds.has(step.id)) problems.push(err('DUPLICATE_STEP', step.id));
    stepIds.add(step.id);
    if (!Array.isArray(step.dependsOn) || step.dependsOn.length > 2048 ||
        !Array.isArray(step.requirements) || step.requirements.length === 0 || step.requirements.length > 64 || ![step.workOrderId, step.taskId, step.laneId].some(Boolean)) {
      problems.push(err('BAD_STEP_LINK', step.id));
    }
    if (asArray(step.requirements).some((r) => !r || !ID.test(r.kind ?? '') || !ID.test(r.source ?? ''))) {
      problems.push(err('BAD_REQUIREMENT', step.id));
    }
    if (new Set(asArray(step.requirements).map((r) => `${r?.kind}:${r?.source}`)).size !== asArray(step.requirements).length) {
      problems.push(err('DUPLICATE_REQUIREMENT', step.id));
    }
    if (step.risk === 'high' && !asArray(step.requirements).some((r) => r.kind === 'review')) {
      problems.push(err('HIGH_RISK_REVIEW_REQUIRED', step.id));
    }
  }
  const graph = new Map();
  for (const step of steps) if (step && typeof step.id === 'string' && !graph.has(step.id)) graph.set(step.id, asArray(step.dependsOn));
  const visiting = new Set(), visited = new Set();
  function check(id) {
    if (visiting.has(id)) { problems.push(err('DEPENDENCY_CYCLE', id)); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dep of graph.get(id) ?? []) {
```

_First 80 of 182 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
