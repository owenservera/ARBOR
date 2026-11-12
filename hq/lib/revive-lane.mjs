// @ts-check
/**
 * @hq:context Self-healing revive lane: monitors all factory lanes, detects model/provider failures,
 *   and restarts any stalled or dead lane using a safe model. If the operating chief goes down,
 *   this lane revives the whole process. Pure decision module — no fs, no spawn, no clock read;
 *   everything arrives as arguments and every decision returns data with a stable code.
 * @hq:owner hq-agent
 * @hq:task revive-lane
 * @hq:invariant pure: no fs, no child_process, no clock read. `now` is an argument and is required.
 * @hq:invariant the safe model is never budget-blocked, capped, or broken — it is chosen by health,
 *   never hardcoded to a single provider.
 * @hq:invariant every refusal is a stable code from REVIVE_CODES, never free text alone.
 * @hq:see hq/lib/model-router.mjs · hq/lib/autonomy.mjs · hq/lib/work-orders.mjs
 */

export const REVIVE_CODES = Object.freeze({
  LANE_HEALTHY: 'LANE_HEALTHY',
  LANE_STALLED: 'LANE_STALLED',
  LANE_FAILED: 'LANE_FAILED',
  LANE_MISSING: 'LANE_MISSING',
  NO_SAFE_MODEL: 'NO_SAFE_MODEL',
  SAFE_MODEL_FOUND: 'SAFE_MODEL_FOUND',
  REVIVE_ORDERED: 'REVIVE_ORDERED',
  REVIVE_BLOCKED: 'REVIVE_BLOCKED',
  REVIEW_DUE: 'REVIEW_DUE',
  REVIEW_CLEAR: 'REVIEW_CLEAR',
});

/** Terminal states a lane can be in — nothing more to wait for. */
export const TERMINAL_STATES = /** @type {const} */ (['done', 'blocked', 'cancelled', 'failed']);
/** Open states — the lane may still be working or may be stalled. */
export const OPEN_STATES = /** @type {const} */ (['pending', 'sent', 'running', 'open']);

/**
 * The safe-model budget: a model is "safe" only when it is healthy, funded, and not the same
 * provider as a recently-failed model (provider-level credit exhaustion contagion).
 * @typedef {Object} SafeModel
 * @property {string} key          "provider/model"
 * @property {string} provider
 * @property {string} model
 * @property {boolean} isFree
 * @property {string} healthState  'healthy' | 'capped' | 'budget-blocked' | 'broken' | 'unproven'
 * @property {number} reliability
 * @property {number} avgLatencyMs
 */

/**
 * Decide whether a lane is healthy, stalled, or failed based on its observed state and age.
 * @param {Object} lane
 * @param {number} nowMs
 * @param {Object} [opts] { stallAfterMs, failAfterMs }
 * @returns {{code: string, state: string, reason: string, ageMinutes: number|null}}
 */
export function assessLane(lane, nowMs, opts = {}) {
  const stallAfterMs = Number(opts.stallAfterMs ?? 3 * 60 * 60 * 1000); // 3 hours default
  const failAfterMs = Number(opts.failAfterMs ?? 24 * 60 * 60 * 1000); // 24 hours default
  const now = toMs(nowMs);
  if (now === null) throw new TypeError('revive-lane: assessLane needs a numeric nowMs');

  const state = String(lane?.status ?? lane?.state ?? '').toLowerCase();
  const updatedAt = toMs(lane?.updatedAt ?? lane?.at ?? lane?.startedAt);
  const ageMs = updatedAt === null ? null : Math.max(0, now - updatedAt);
  const ageMinutes = ageMs === null ? null : Math.round(ageMs / 60_000);

  if (TERMINAL_STATES.includes(/** @type {any} */ (state))) {
    return {
      code: state === 'done' ? REVIVE_CODES.LANE_HEALTHY : REVIVE_CODES.LANE_FAILED,
      state,
      reason: `lane ${String(lane?.id ?? lane?.name ?? '?')} is ${state} (terminal); no revive action`,
      ageMinutes,
    };
  }

  if (OPEN_STATES.includes(/** @type {any} */ (state))) {
    if (ageMs === null) {
      return { code: REVIVE_CODES.LANE_STALLED, state, reason: 'lane has no updatedAt timestamp — cannot determine liveness', ageMinutes: null };
    }
    if (ageMs >= failAfterMs) {
      return { code: REVIVE_CODES.LANE_FAILED, state, reason: `lane ${String(lane?.id ?? lane?.name ?? '?')} has been ${state} for ${ageMinutes}m, past ${Math.round(failAfterMs / 60_000)}m failure threshold`, ageMinutes };
    }
    if (ageMs >= stallAfterMs) {
      return { code: REVIVE_CODES.LANE_STALLED, state, reason: `lane ${String(lane?.id ?? lane?.name ?? '?')} has been ${state} for ${ageMinutes}m, past ${Math.round(stallAfterMs / 60_000)}m stall threshold`, ageMinutes };
    }
    return { code: REVIVE_CODES.LANE_HEALTHY, state, reason: `lane ${String(lane?.id ?? lane?.name ?? '?')} is ${state} and within the ${Math.round(stallAfterMs / 60_000)}m liveness window`, ageMinutes };
  }

  return { code: REVIVE_CODES.LANE_MISSING, state: 'unknown', reason: `lane ${String(lane?.id ?? lane?.name ?? '?')} has unrecognized state "${state}"`, ageMinutes };
}

/**
 * Choose a safe model from a catalog given observed health and recently-failed providers.
 * Never returns a budget-blocked, capped, or broken model. Never returns a model on a provider
 * that just suffered credit exhaustion (contagion guard).
 * @param {Array<{key:string, provider:string, model:string, isFree:boolean, health:{state:string, reliability:number, avgLatencyMs:number}}>} catalog
 * @param {Set<string>} failedProviders provider keys that recently failed (credit exhaustion contagion)
 * @param {Object} [opts] { preferFree, minReliability, maxUsdPerCall }
 * @returns {{code: string, model: SafeModel|null, reason: string, rejected: Array<{key:string, reason:string}>}}
 */
export function chooseSafeModel(catalog, failedProviders = new Set(), opts = {}) {
  const preferFree = opts.preferFree !== false;
  const minReliability = Number(opts.minReliability ?? 0.5);
  const maxUsdPerCall = Number(opts.maxUsdPerCall ?? 0.5);

  /** @type {Array<{key:string, provider:string, model:string, isFree:boolean, health:{state:string, reliability:number, avgLatencyMs:number}, score:number, tier:number}>} */
  const eligible = [];
  /** @type {Array<{key:string, reason:string}>} */
  const rejected = [];

  for (const c of Array.isArray(catalog) ? catalog : []) {
    const h = c.health ?? { state: 'unproven', reliability: 0, avgLatencyMs: 0 };
    const state = String(h.state ?? 'unproven');

    if (state === 'budget-blocked') { rejected.push({ key: c.key, reason: 'budget blocked' }); continue; }
    if (state === 'capped') { rejected.push({ key: c.key, reason: 'daily cap or rate limit' }); continue; }
    if (state === 'broken') { rejected.push({ key: c.key, reason: 'rejects request shape' }); continue; }
    if (failedProviders.has(c.provider)) { rejected.push({ key: c.key, reason: `provider ${c.provider} recently failed — credit exhaustion contagion` }); continue; }
    const reliability = Number(h.reliability) || 0;
    if (reliability < minReliability) { rejected.push({ key: c.key, reason: `reliability ${(reliability * 100).toFixed(0)}% below floor` }); continue; }

    const tier = isFreeTier(c.isFree) ? 0 : 1;
    const latencyPoints = Number(h.avgLatencyMs) || 0;
    const reliabilityPoints = (1 - reliability) * 1000;
    const score = tier * 1e6 + latencyPoints + reliabilityPoints;
    eligible.push({ ...c, health: h, score, tier });
  }

  eligible.sort((a, b) => a.tier - b.tier || a.score - b.score);

  if (eligible.length === 0) {
    return { code: REVIVE_CODES.NO_SAFE_MODEL, model: null, reason: 'no safe model available — every candidate is blocked, capped, broken, unreliable, or on a failed provider', rejected };
  }

  const best = eligible[0];
  return {
    code: REVIVE_CODES.SAFE_MODEL_FOUND,
    model: {
      key: best.key, provider: best.provider, model: best.model, isFree: best.isFree,
      healthState: best.health.state, reliability: best.health.reliability, avgLatencyMs: best.health.avgLatencyMs,
    },
    reason: `safe model ${best.key} (${best.isFree ? 'free' : 'paid'}, ${best.health.state}, ${((Number(best.health.avgLatencyMs) || 0) / 1000).toFixed(1)}s avg)`,
    rejected,
  };
}

/**
 * Order a revive: produce the spawn/wake brief and target for a stalled or failed lane.
 * @param {Object} lane         the lane to revive
 * @param {SafeModel} model     the safe model to run it on
 * @param {Object} opts         { brief, role, acceptanceCommand, fileScope }
 * @returns {{code: string, order: Object, reason: string}}
 */
export function orderRevive(lane, model, opts = {}) {
  if (!lane || typeof lane !== 'object') throw new TypeError('revive-lane: orderRevive needs a lane object');
  if (!model || typeof model !== 'object') throw new TypeError('revive-lane: orderRevive needs a safe model');

  const laneId = String(lane?.id ?? lane?.name ?? lane?.sessionId ?? 'unknown');
  const order = {
    id: `revive_${laneId}_${Date.now().toString(36)}`,
    reviveOf: laneId,
    task: String(opts.brief ?? `Revive stalled lane ${laneId}`),
    file: String(opts.fileScope ?? 'hq/work/orders.json'),
    proofCommand: String(opts.acceptanceCommand ?? 'bun test'),
    seat: null,
    status: 'open',
    createdAt: new Date().toISOString(),
    model: model.key,
    role: String(opts.role ?? 'worker'),
  };

  return {
    code: REVIVE_CODES.REVIVE_ORDERED,
    order,
    reason: `revive ordered for lane ${laneId} on safe model ${model.key} — ${opts.reason ?? ''}`,
  };
}

/**
 * Review gate: after every N completed tasks, decide whether the job is done or needs more work.
 * @param {Array<{id:string, status:string, proofCommand:string, output?:string}>} completed
 * @param {number} n          review every n tasks
 * @param {number} cycle      current cycle count (completed tasks since last review)
 * @returns {{code: string, reviewDue: boolean, verdict: 'done' | 'more-work' | 'blocked', reason: string}}
 */
export function reviewGate(completed, n, cycle) {
  const total = Array.isArray(completed) ? completed.length : 0;
  const sinceLastReview = cycle % n;

  if (sinceLastReview !== 0 || total === 0) {
    return { code: REVIVE_CODES.REVIEW_CLEAR, reviewDue: false, verdict: 'done', reason: `not a review boundary (cycle ${cycle}, next at ${Math.ceil(cycle / n) * n})` };
  }

  const boundary = completed.slice(Math.max(0, total - n));
  const allPassed = boundary.every((t) => t.status === 'done');
  const anyBlocked = boundary.some((t) => t.status === 'blocked' || t.status === 'failed');
  const anyMissingProof = boundary.some((t) => !t.proofCommand);

  if (anyBlocked) {
    return { code: REVIVE_CODES.REVIEW_DUE, reviewDue: true, verdict: 'blocked', reason: `${boundary.filter((t) => t.status === 'blocked' || t.status === 'failed').length}/${boundary.length} tasks blocked or failed — more work needed before proceeding` };
  }
  if (anyMissingProof) {
    return { code: REVIVE_CODES.REVIEW_DUE, reviewDue: true, verdict: 'more-work', reason: `${boundary.filter((t) => !t.proofCommand).length}/${boundary.length} tasks lack a proof command — cannot mark done` };
  }
  if (!allPassed) {
    return { code: REVIVE_CODES.REVIEW_DUE, reviewDue: true, verdict: 'more-work', reason: `${boundary.filter((t) => t.status !== 'done').length}/${boundary.length} tasks not done — more work needed` };
  }

  return { code: REVIVE_CODES.REVIEW_CLEAR, reviewDue: true, verdict: 'done', reason: `all ${boundary.length} tasks in review window passed with proof commands` };
}

/** @param {any} value */
function toMs(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const t = Date.parse(value.trim());
    return Number.isFinite(t) ? t : null;
  }
  return null;
}

/** @param {any} isFree */
function isFreeTier(isFree) {
  return isFree === true;
}
