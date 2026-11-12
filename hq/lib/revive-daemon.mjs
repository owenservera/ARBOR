// @ts-check
/**
 * @hq:context The revive daemon's planning core: one cycle that detects a dead model or a stalled lane,
 *   picks the next best safe model, plans the reroute and the revive order, and returns a decision.
 *   Pure: every input arrives as an argument, every decision returns data. The IO shell (hq/bin/revive.mjs)
 *   reads the session DB and writes the journal; this module never touches either.
 * @hq:owner hq-agent
 * @hq:task revive-daemon
 * @hq:invariant pure: no fs, no child_process, no clock read. `now` is an argument and is required.
 * @hq:invariant a budget-blocked or capped model is NEVER chosen as the safe model, and every sibling on
 *   the same failed provider is excluded too — credit exhaustion is a provider-level pool, not a model.
 * @hq:invariant a reroute is only planned for an agent whose CURRENT model is dead. A healthy pin is left
 *   alone: the router's own rule is that a dead model is not a pin to keep, and a working one is.
 * @hq:invariant every refusal is a stable code from REVIVE_CODES, never free prose alone.
 * @hq:see hq/lib/revive-lane.mjs · hq/lib/model-router.mjs · hq/lib/model-budget.mjs
 */

import { classifyHealth, summarizeUsage } from './model-router.mjs';
import { assessLane, chooseSafeModel, orderRevive, REVIVE_CODES } from './revive-lane.mjs';

/**
 * @typedef {Object} ReviveAgent
 * @property {string} name
 * @property {string} model
 * @property {string} [path]
 */

/**
 * One cycle of the daemon.
 *
 * @param {{
 *   agents?: Array<ReviveAgent>,
 *   usageRows?: Array<Object>,
 *   catalog?: Record<string, Object>,
 *   lanes?: Array<Object>,
 *   now?: number,
 *   opts?: {
 *     windowMs?: number,
 *     minReliability?: number,
 *     maxUsdPerCall?: number,
 *     stallAfterMs?: number,
 *     failAfterMs?: number,
 *     requireMajorityHealthy?: boolean,
 *   },
 * }} input
 * @returns {{
 *   schema: string,
 *   now: string,
 *   deadModels: Array<{key: string, state: string, reason: string}>,
 *   healthyModels: Array<{key: string, reliability: number}>,
 *   safeModel: Object|null,
 *   reroutes: Array<{agent: string, from: string, to: string, reason: string}>,
 *   revives: Array<{id: string, reviveOf: string, model: string, task: string, file: string, proofCommand: string}>,
 *   skipped: Array<{agent: string, reason: string}>,
 *   actions: string[],
 *   code: string,
 * }}
 */
export function planReviveCycle(input = {}) {
  const {
    agents = [],
    usageRows = [],
    catalog = {},
    lanes = [],
    opts = {},
  } = input ?? {};

  const now = Number(input?.now ?? Date.now());
  const windowMs = Number(opts.windowMs ?? 5 * 60 * 60 * 1000);
  const stats = summarizeUsage(usageRows, { now, windowMs });

  // ---- 1. classify every observed model -------------------------------------
  /** @type {Map<string, {state: string, reliability: number, reasons: string[], avgLatencyMs: number}>} */
  const health = new Map();
  for (const [key, rec] of stats) {
    health.set(key, classifyHealth(rec));
  }
  /** @type {Array<{key: string, state: string, reason: string}>} */
  const deadModels = [];
  /** @type {Array<{key: string, reliability: number}>} */
  const healthyModels = [];
  /** @type {Set<string>} */
  const failedProviders = new Set();

  for (const [key, h] of health) {
    if (h.state === 'budget-blocked' || h.state === 'capped' || h.state === 'broken') {
      deadModels.push({ key, state: h.state, reason: h.reasons?.[0] ?? h.state });
      if (h.state === 'budget-blocked') failedProviders.add(key.split('/')[0]);
    } else if (h.state === 'healthy') {
      healthyModels.push({ key, reliability: h.reliability });
    }
  }

  // ---- 2. choose the safe model --------------------------------------------
  const catalogCandidates = Object.entries(catalog).map(([key, price]) => ({
    key,
    provider: key.split('/')[0],
    model: key.split('/').slice(1).join('/'),
    isFree: Boolean(price?.isFree),
    health: health.get(key) ?? { state: 'unproven', reliability: 0, avgLatencyMs: 0 },
  }));

  // A model that is not in the usage table has no evidence. It stays eligible for a
  // SAFE model only when it is free and explicitly listed, because an unproven paid model
  // is a gamble with the owner's credit. Free is the safe default when nothing is proven.
  const observedKeys = new Set(stats.keys());
  const candidates = catalogCandidates.map((c) => {
    if (observedKeys.has(c.key)) return c;
    if (c.isFree) return { ...c, health: { state: 'healthy', reliability: 0.6, avgLatencyMs: 0 } };
    return { ...c, health: { state: 'unproven', reliability: 0, avgLatencyMs: 0 } };
  });

  const safe = chooseSafeModel(candidates, failedProviders, {
    minReliability: Number(opts.minReliability ?? 0.5),
    maxUsdPerCall: Number(opts.maxUsdPerCall ?? 0.5),
  });

  // ---- 3. plan reroutes for agents pinned to a dead model -------------------
  /** @type {Array<{agent: string, from: string, to: string, reason: string}>} */
  const reroutes = [];
  /** @type {Array<{agent: string, reason: string}>} */
  const skipped = [];

  for (const agent of agents) {
    const name = String(agent?.name ?? '').trim();
    const model = String(agent?.model ?? '').trim();
    if (!name) continue;
    if (!model || model === 'inherit') {
      skipped.push({ agent: name, reason: 'no explicit model pin — nothing to reroute' });
      continue;
    }
    const h = health.get(model);
    const isDead = h && (h.state === 'budget-blocked' || h.state === 'capped' || h.state === 'broken');
    if (!isDead) {
      skipped.push({ agent: name, reason: h ? `current model healthy (${h.state}) — pin kept` : 'current model has no observed failure — pin kept' });
      continue;
    }
    if (!safe.model) {
      skipped.push({ agent: name, reason: `current model is ${h?.state} but no safe model is available to reroute to` });
      continue;
    }
    if (safe.model.key === model) {
      skipped.push({ agent: name, reason: 'safe model is the same as the dead model' });
      continue;
    }
    reroutes.push({
      agent: name,
      from: model,
      to: safe.model.key,
      reason: `current model ${model} is ${h?.state} (${h?.reasons?.[0] ?? 'unknown'}); safe model ${safe.model.key} chosen — ${safe.reason}`,
    });
  }

  // ---- 4. plan revives for stalled lanes ------------------------------------
  /** @type {Array<{id: string, reviveOf: string, model: string, task: string, file: string, proofCommand: string}>} */
  const revives = [];
  for (const lane of lanes) {
    const assessment = assessLane(lane, now, {
      stallAfterMs: Number(opts.stallAfterMs ?? 3 * 60 * 60 * 1000),
      failAfterMs: Number(opts.failAfterMs ?? 24 * 60 * 60 * 1000),
    });
    if (assessment.code !== REVIVE_CODES.LANE_STALLED && assessment.code !== REVIVE_CODES.LANE_FAILED) continue;
    if (!safe.model) {
      skipped.push({ agent: String(lane?.id ?? lane?.name ?? '?'), reason: `lane needs revive (${assessment.code}) but no safe model is available` });
      continue;
    }
    const ordered = orderRevive(lane, safe.model, {
      brief: `Revive lane ${String(lane?.id ?? lane?.name ?? '?')} — ${assessment.reason}`,
      file: String(lane?.file ?? 'hq/work/orders.json'),
      proofCommand: String(lane?.proofCommand ?? 'bun test'),
      reason: assessment.reason,
    });
    revives.push({
      id: ordered.order.id,
      reviveOf: ordered.order.reviveOf,
      model: ordered.order.model,
      task: ordered.order.task,
      file: ordered.order.file,
      proofCommand: ordered.order.proofCommand,
    });
  }

  // ---- 5. what this cycle will actually do ----------------------------------
  /** @type {string[]} */
  const actions = [];
  if (reroutes.length) actions.push(`reroute ${reroutes.length} agent(s) off a dead model`);
  if (revives.length) actions.push(`order ${revives.length} lane revive(s)`);
  if (!actions.length) actions.push('nothing to do — every model in use is healthy and every lane is live');

  const code = reroutes.length || revives.length
    ? REVIVE_CODES.REVIVE_ORDERED
    : (deadModels.length ? REVIVE_CODES.LANE_HEALTHY : REVIVE_CODES.LANE_HEALTHY);

  return {
    schema: 'hq.revive-cycle/1',
    now: new Date(now).toISOString(),
    deadModels,
    healthyModels,
    safeModel: safe.model,
    reroutes,
    revives,
    skipped,
    actions,
    code,
  };
}

/**
 * Render a cycle as text. The daemon's journal and its console both read this.
 * @param {ReturnType<typeof planReviveCycle>} cycle
 * @returns {string}
 */
export function renderReviveCycle(cycle) {
  const lines = [];
  lines.push(`REVIVE ${cycle.now}`);
  lines.push(`  dead models: ${cycle.deadModels.length}`);
  for (const d of cycle.deadModels) lines.push(`    ${d.key} — ${d.state}: ${d.reason}`);
  lines.push(`  healthy models: ${cycle.healthyModels.length}`);
  lines.push(`  safe model: ${cycle.safeModel ? `${cycle.safeModel.key} (${cycle.safeModel.healthState}, rel ${(cycle.safeModel.reliability * 100).toFixed(0)}%)` : 'NONE AVAILABLE'}`);
  if (cycle.reroutes.length) {
    lines.push(`  reroutes: ${cycle.reroutes.length}`);
    for (const r of cycle.reroutes) lines.push(`    ${r.agent}: ${r.from} -> ${r.to}`);
  }
  if (cycle.revives.length) {
    lines.push(`  revives: ${cycle.revives.length}`);
    for (const r of cycle.revives) lines.push(`    ${r.reviveOf} -> ${r.model} (${r.file})`);
  }
  lines.push(`  action: ${cycle.actions.join('; ')}`);
  return lines.join('\n');
}
