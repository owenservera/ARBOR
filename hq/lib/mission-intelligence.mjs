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
      if (!graph.has(dep)) problems.push(err('MISSING_DEPENDENCY', `${id}:${dep}`));
      else if (dep === id) problems.push(err('DEPENDENCY_CYCLE', id));
      else check(dep);
    }
    visiting.delete(id); visited.add(id);
  }
  for (const id of graph.keys()) check(id);
  const orders = asArray(workOrders?.orders);
  const tasks = asArray(taskView?.tasks);
  if (steps.some((s) => s?.workOrderId) && workOrders?.schema !== 'hq.work-order/1') problems.push(err('BAD_WORK_ORDER_SOURCE', 'Expected the canonical work-order document'));
  if (steps.some((s) => s?.taskId) && taskView?.schema !== 'hq.task-lifecycle-view/1') problems.push(err('BAD_TASK_SOURCE', 'Expected the canonical task lifecycle projection'));
  if (!Array.isArray(lanes) || !Array.isArray(proofs)) problems.push(err('BAD_INPUT', 'lanes and proofs must be arrays'));
  for (const [label, rows] of [['order', orders], ['task', tasks], ['lane', asArray(lanes)]]) {
    const ids = rows.map((row) => label === 'lane' ? row.laneId : row.id);
    if (new Set(ids).size !== ids.length) problems.push(err('AMBIGUOUS_SOURCE', label));
  }
  if (problems.length) return { ok: false, schema: MISSION_VIEW_SCHEMA, code: 'MISSION_INVALID',
    missionId: mission.id, errors: problems, nextAction: 'INSPECT' };

  const orderMap = byId(orders), taskMap = byId(tasks);
  const laneMap = new Map(asArray(lanes).map((l) => [l.laneId, l]));
  const result = [], state = new Map();
  // Topological pass: preserves authored display order, resolves prerequisites recursively.
  function assess(step) {
    if (state.has(step.id)) return state.get(step.id);
    const depStates = step.dependsOn.map((dep) => assess(steps.find((s) => s.id === dep)));
    let phase = 'READY', reason = null;
    if (depStates.some((dep) => dep.status === 'BLOCKED')) {
      phase = 'BLOCKED'; reason = 'dependency-blocked';
    } else if (depStates.some((dep) => dep.status !== 'VERIFIED')) {
      phase = 'WAITING_DEPENDENCY'; reason = 'dependency-incomplete';
    }
    const order = step.workOrderId ? orderMap.get(step.workOrderId) : null;
    const task = step.taskId ? taskMap.get(step.taskId) : null;
    const lane = step.laneId ? laneMap.get(step.laneId) : null;
    const missing = (step.workOrderId && !order) || (step.taskId && !task) || (step.laneId && !lane);
    const failed = ['blocked', 'cancelled'].includes(order?.status) || task?.state === 'failed' || HARD_LANE.has(lane?.status);
    if (missing) { phase = 'BLOCKED'; reason = 'source-unavailable'; }
    else if (failed) { phase = 'BLOCKED'; reason = 'source-failed-or-quarantined'; }
    else if (lane?.status === 'EXPIRED') { phase = 'RECOVERY_REQUIRED'; reason = 'fenced-attempt-requires-authorized-recovery'; }
    else if (lane && !ACTIVE.has(lane.status) && !TERMINAL_OK.has(lane.status)) {
      phase = 'BLOCKED'; reason = 'unknown-lane-state';
    }
    const newest = lane && Date.parse(lane.heartbeatAt || lane.startedAt || '');
    if (phase === 'READY' && lane && ACTIVE.has(lane.status) &&
        (!Number.isFinite(newest) || current - newest > staleAfterMs)) {
      phase = 'STALE'; reason = 'heartbeat-stale-recheck-before-failure';
    }
    const sourceDone = (!order || order.status === 'done') && (!task || task.state === 'done') &&
      (!lane || TERMINAL_OK.has(lane.status));
    const received = [];
    for (const requirement of step.requirements) {
      const matched = proofs.find((p) => p?.missionId === mission.id && p.stepId === step.id &&
        p.stepRevision === step.revision && p.missionRevision === mission.revision && p.kind === requirement.kind && p.source === requirement.source &&
        p.status === 'PASS' && p.verified === true && Number.isSafeInteger(p.sourceRevision) && p.sourceRevision >= 0 && ID.test(p.sourceRef ?? '') &&
        DIGEST.test(p.digest ?? '') && ID.test(p.executor ?? '') && ID.test(p.verifier ?? '') &&
        p.executor !== p.verifier && validTime(p.at) && Date.parse(p.at) <= current + 60000 &&
        (!p.expiresAt || (validTime(p.expiresAt) && Date.parse(p.expiresAt) > current)));
      if (matched) received.push({ kind: requirement.kind, source: requirement.source, ref: matched.sourceRef });
    }
    const missingProofs = step.requirements.filter((requirement) =>
      !received.some((r) => r.kind === requirement.kind && r.source === requirement.source));
    if (phase === 'READY') {
      if (sourceDone && missingProofs.length === 0) phase = 'VERIFIED';
      else if (sourceDone) { phase = 'AWAITING_VERIFICATION'; reason = 'source-done-proof-missing'; }
      else if (order?.status === 'claimed' || ['claimed', 'working'].includes(task?.state) ||
               (lane && ACTIVE.has(lane.status))) phase = 'RUNNING';
    }
    const stepView = { id: step.id, title: step.title, phase: step.phase, status: phase,
      reason, dependencies: [...step.dependsOn], verifiedProofs: received,
      missingProofs: missingProofs.map((r) => ({ kind: r.kind, source: r.source })) };
    state.set(step.id, stepView);
    return stepView;
  }
  for (const step of steps) result.push(assess(step));
  const counts = Object.fromEntries([...new Set(result.map((s) => s.status))].sort()
    .map((status) => [status, result.filter((s) => s.status === status).length]));
  const allVerified = result.every((s) => s.status === 'VERIFIED');
  const digest = typeof mission.outcomeDigest === 'string' && DIGEST.test(mission.outcomeDigest) ? mission.outcomeDigest : null;
  const acknowledged = allVerified && digest && delivery?.missionId === mission.id &&
    delivery.outcomeDigest === digest && delivery.missionRevision === mission.revision &&
    delivery.type === 'mission-outcome' && delivery.verified === true && delivery.status === 'ACKED' &&
    delivery.source === 'host' && ID.test(delivery.receiptRef ?? '') &&
    validTime(delivery.at) && Date.parse(delivery.at) <= current + 60000;
  const has = (s) => result.some((step) => step.status === s);
  let nextAction = 'CONTINUE', status = 'ACTIVE';
  if (has('BLOCKED')) { nextAction = 'ESCALATE'; status = 'BLOCKED'; }
  else if (has('RECOVERY_REQUIRED')) { nextAction = 'PROPOSE_RECOVERY'; status = 'BLOCKED'; }
  else if (has('STALE')) { nextAction = 'RECHECK'; status = 'OBSERVATION_STALE'; }
  else if (result.some((s) => s.status === 'AWAITING_VERIFICATION' && s.phase === 'review')) { nextAction = 'REQUEST_REVIEW'; status = 'VERIFYING'; }
  else if (has('AWAITING_VERIFICATION')) { nextAction = 'VERIFY'; status = 'VERIFYING'; }
  else if (has('RUNNING')) { nextAction = 'OBSERVE'; status = 'RUNNING'; }
  else if (has('READY')) { nextAction = 'CONTINUE'; status = 'ACTIVE'; }
  else if (has('WAITING_DEPENDENCY')) { nextAction = 'OBSERVE'; status = 'WAITING'; }
  else if (allVerified && acknowledged) { nextAction = 'NONE'; status = 'DELIVERED'; }
  else if (allVerified) { nextAction = 'DELIVER'; status = 'READY_TO_DELIVER'; }
  return { ok: true, schema: MISSION_VIEW_SCHEMA, missionId: mission.id,
    missionRevision: mission.revision, objective: mission.objective, at: new Date(current).toISOString(),
    status, nextAction, counts, readyToDeliver: allVerified, delivered: Boolean(acknowledged), steps: result,
    limitations: ['PROOF_VALIDATION_IS_UPSTREAM', 'NO_EFFECT_AUTHORITY', 'DELIVERY_ACK_NOT_HUMAN_READ'] };
}
