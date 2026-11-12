/**
 * @hq:context Per-session context census and compaction planner over ZCode usage rows: names the token-cost driver (context size per request) and the sessions over a ceiling.
 * @hq:owner agent-platform-ceo
 * @hq:task token-budget
 * @hq:invariant pure: no I/O, no clock read, no console; every selection is explained by a stable code.
 * @hq:why measured 2026-11-04: 1.866B input tokens in 3 days, 53% of them in requests carrying >250k context, and 0 of 1,278 sessions ever compacted.
 * @hq:see hq/bin/hq.mjs
 */

export const CONTEXT_BUDGET_SCHEMA = 'hq.context-budget/1';
export const COMPACTION_PLAN_SCHEMA = 'hq.compaction-plan/1';

/**
 * Most current models ship a 1M-token window, so the ceiling is derived from the window
 * and a utilisation fraction rather than a fixed number: a 150k session is 15% of a 1M
 * window and compacting it destroys context for no benefit. `ceiling` overrides the
 * derivation when the intent is a spend budget instead of an overflow guard.
 */
export const DEFAULT_WINDOW_TOKENS = 1000000;
export const DEFAULT_UTILIZATION = 0.8;

const DAY_MS = 86400000;
const num = (v) => (Number.isFinite(v) ? v : 0);

/** Resolve the effective ceiling and say where it came from. */
export function resolveCeiling(input = {}) {
  const window = Number.isFinite(input.window) && input.window > 0 ? input.window : DEFAULT_WINDOW_TOKENS;
  const utilization = Number.isFinite(input.utilization) && input.utilization > 0 && input.utilization <= 1
    ? input.utilization
    : DEFAULT_UTILIZATION;
  const explicit = Number.isFinite(input.ceiling) && input.ceiling > 0 ? input.ceiling : null;
  return {
    ceiling: explicit ?? Math.round(window * utilization),
    window,
    utilization,
    source: explicit ? 'explicit' : 'window',
  };
}

/** A row counts only when it has a usable timestamp inside the window. */
function inWindow(rows, now, windowMs) {
  const floor = now - windowMs;
  return (Array.isArray(rows) ? rows : [])
    .filter((r) => r && Number.isFinite(r.started_at) && r.started_at >= floor);
}

/** Provider totals are authoritative when present; fall back to input+output. */
function rowTotal(row) {
  const computed = num(row.computed_total_tokens);
  return computed > 0 ? computed : num(row.input_tokens) + num(row.output_tokens);
}

function dayOf(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function bump(map, key, seed) {
  let rec = map.get(key);
  if (!rec) { rec = seed(); map.set(key, rec); }
  return rec;
}

/**
 * Aggregate usage rows into the census an owner reads: totals, cache split, and the
 * three cuts that explain them (day, model, agent).
 *
 * @param {Array<Object>} usageRows
 * @param {{now?: number, windowMs?: number}} [opts]
 * @returns {Object}
 */
export function census(usageRows, opts = {}) {
  const now = Number.isFinite(opts.now) ? opts.now : 0;
  const windowMs = Number.isFinite(opts.windowMs) ? opts.windowMs : 3 * DAY_MS;
  const rows = inWindow(usageRows, now, windowMs);

  const byDay = new Map();
  const byModel = new Map();
  const byAgent = new Map();
  const sessions = new Set();
  let inputTokens = 0;
  let outputTokens = 0;
  let reasoningTokens = 0;
  let cacheReadTokens = 0;
  let cacheCreationTokens = 0;
  let totalTokens = 0;
  let nonCompleted = 0;
  let retries = 0;

  for (const row of rows) {
    const total = rowTotal(row);
    const input = num(row.input_tokens);
    const output = num(row.output_tokens);
    const reasoning = num(row.reasoning_tokens);
    const cacheRead = num(row.cache_read_input_tokens);
    const cacheCreation = num(row.cache_creation_input_tokens);

    sessions.add(String(row.session_id ?? ''));
    inputTokens += input;
    outputTokens += output;
    reasoningTokens += reasoning;
    cacheReadTokens += cacheRead;
    cacheCreationTokens += cacheCreation;
    totalTokens += total;
    if (row.status && row.status !== 'completed') nonCompleted += 1;
    retries += num(row.retry_count);

    const day = dayOf(row.started_at);
    const d = bump(byDay, day, () => ({ day, requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 }));
    d.requests += 1; d.inputTokens += input; d.outputTokens += output; d.totalTokens += total;

    const modelKey = `${row.provider_id ?? '?'}/${row.model_id ?? '?'}`;
    const m = bump(byModel, modelKey, () => ({ key: modelKey, provider: String(row.provider_id ?? '?'), model: String(row.model_id ?? '?'), requests: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, totalTokens: 0 }));
    m.requests += 1; m.inputTokens += input; m.outputTokens += output; m.cacheReadTokens += cacheRead; m.totalTokens += total;

    const agentKey = String(row.agent ?? '(none)');
    const a = bump(byAgent, agentKey, () => ({ agent: agentKey, requests: 0, inputTokens: 0, totalTokens: 0 }));
    a.requests += 1; a.inputTokens += input; a.totalTokens += total;
  }

  const freshInput = Math.max(0, inputTokens - cacheReadTokens);
  return {
    schema: CONTEXT_BUDGET_SCHEMA,
    windowMs,
    requests: rows.length,
    sessions: sessions.size,
    inputTokens,
    outputTokens,
    reasoningTokens,
    cacheReadTokens,
    cacheCreationTokens,
    freshInputTokens: freshInput,
    totalTokens,
    cacheHitRatio: inputTokens > 0 ? cacheReadTokens / inputTokens : 0,
    avgInputPerRequest: rows.length > 0 ? Math.round(inputTokens / rows.length) : 0,
    nonCompletedRequests: nonCompleted,
    retries,
    byDay: [...byDay.values()].sort((x, y) => x.day.localeCompare(y.day)),
    byModel: [...byModel.values()].sort((x, y) => y.totalTokens - x.totalTokens),
    byAgent: [...byAgent.values()].sort((x, y) => y.totalTokens - x.totalTokens),
  };
}

/**
 * One row per session: the context it carried on its most recent request, how long it
 * has been idle, and whether a compaction is already in flight.
 *
 * @param {Array<Object>} sessions   rows of {id, parent_id, time_updated, time_compacting}
 * @param {Array<Object>} usageRows  unfiltered usage rows; only the newest per session is used
 * @param {{now?: number}} [opts]
 * @returns {Array<Object>}
 */
export function sessionContexts(sessions, usageRows, opts = {}) {
  const now = Number.isFinite(opts.now) ? opts.now : 0;
  const latest = new Map();
  const turns = new Map();

  for (const row of Array.isArray(usageRows) ? usageRows : []) {
    if (!row || typeof row.session_id !== 'string' || !Number.isFinite(row.started_at)) continue;
    const id = row.session_id;
    const prev = latest.get(id);
    if (!prev || row.started_at > prev.started_at) latest.set(id, row);
    if (row.turn_id) {
      let set = turns.get(id);
      if (!set) { set = new Set(); turns.set(id, set); }
      set.add(row.turn_id);
    }
  }

  const out = [];
  for (const s of Array.isArray(sessions) ? sessions : []) {
    if (!s || typeof s.id !== 'string') continue;
    const last = latest.get(s.id) ?? null;
    const lastAt = last ? last.started_at : (Number.isFinite(s.time_updated) ? s.time_updated : null);
    out.push({
      sessionId: s.id,
      parentId: s.parent_id ?? null,
      kind: s.parent_id ? 'child' : 'root',
      agent: last?.agent ?? s.agent ?? null,
      contextTokens: last ? num(last.input_tokens) : 0,
      lastRequestAt: lastAt,
      idleMs: lastAt === null ? Infinity : Math.max(0, now - lastAt),
      turns: turns.get(s.id)?.size ?? 0,
      compacting: s.time_compacting !== null && s.time_compacting !== undefined,
      hasUsage: Boolean(last),
    });
  }
  return out;
}

/** Stable, explainable skip codes. Order is the order they are evaluated. */
export const SKIP_CODES = Object.freeze({
  NO_USAGE: 'no_usage',
  RUNNING: 'running',
  ALREADY_COMPACTING: 'already_compacting',
  BELOW_CEILING: 'below_ceiling',
});

/**
 * Decide which sessions should be compacted. A session is selected only when it has a
 * measured context above the ceiling, has been idle for at least `idleMs`, and is not
 * already compacting. Nothing is executed here; this is the plan.
 *
 * @param {{sessions: Array<Object>, usageRows: Array<Object>, now?: number, ceiling?: number, idleMs?: number}} input
 * @returns {Object}
 */
export function planCompactions(input = {}) {
  const now = Number.isFinite(input.now) ? input.now : 0;
  const ceilingInfo = resolveCeiling({ ceiling: input.ceiling, window: input.window, utilization: input.utilization });
  const ceiling = ceilingInfo.ceiling;
  const idleThreshold = Number.isFinite(input.idleMs) ? input.idleMs : 300000;

  const contexts = sessionContexts(input.sessions, input.usageRows, { now });
  const compact = [];
  const skipped = [];

  for (const ctx of contexts) {
    if (ctx.compacting) { skipped.push({ sessionId: ctx.sessionId, code: SKIP_CODES.ALREADY_COMPACTING }); continue; }
    if (!ctx.hasUsage) { skipped.push({ sessionId: ctx.sessionId, code: SKIP_CODES.NO_USAGE }); continue; }
    if (ctx.contextTokens <= ceiling) { skipped.push({ sessionId: ctx.sessionId, code: SKIP_CODES.BELOW_CEILING }); continue; }
    if (ctx.idleMs < idleThreshold) { skipped.push({ sessionId: ctx.sessionId, code: SKIP_CODES.RUNNING }); continue; }
    compact.push({
      sessionId: ctx.sessionId,
      agent: ctx.agent,
      kind: ctx.kind,
      contextTokens: ctx.contextTokens,
      idleMs: ctx.idleMs,
      reason: `context ${ctx.contextTokens} exceeds ceiling ${ceiling}`,
    });
  }

  compact.sort((a, b) => b.contextTokens - a.contextTokens || a.sessionId.localeCompare(b.sessionId));
  skipped.sort((a, b) => a.sessionId.localeCompare(b.sessionId));

  const counts = {};
  for (const s of skipped) counts[s.code] = (counts[s.code] ?? 0) + 1;

  return {
    schema: COMPACTION_PLAN_SCHEMA,
    ceiling,
    window: ceilingInfo.window,
    utilization: ceilingInfo.utilization,
    ceilingSource: ceilingInfo.source,
    idleMs: idleThreshold,
    sessions: contexts.length,
    overCeiling: compact.length + (counts[SKIP_CODES.RUNNING] ?? 0),
    compact,
    skipped,
    skippedCounts: counts,
  };
}

/** Token counts as a reader-friendly magnitude. */
export function formatTokens(value) {
  const n = num(value);
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(n);
}

function duration(ms) {
  if (!Number.isFinite(ms)) return 'n/a';
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  return `${hr}h${String(min % 60).padStart(2, '0')}m`;
}

/**
 * Render the census and the plan as the text an owner or a seat reads.
 *
 * @param {Object} report
 * @param {Object} plan
 * @param {{top?: number}} [opts]
 * @returns {string}
 */
export function renderContextBudget(report, plan, opts = {}) {
  const top = Number.isFinite(opts.top) ? opts.top : 6;
  const days = Math.round((report.windowMs ?? 0) / DAY_MS);
  const lines = [
    `Context budget — ${days}d window`,
    `requests ${report.requests}  sessions ${report.sessions}  total ${formatTokens(report.totalTokens)}  fresh ${formatTokens(report.freshInputTokens)}  cache ${(report.cacheHitRatio * 100).toFixed(1)}%  avg/request ${formatTokens(report.avgInputPerRequest)}`,
    `waste: ${report.nonCompletedRequests} non-completed, ${report.retries} retries`,
  ];

  if (report.byDay.length) {
    lines.push('', 'by day');
    for (const d of report.byDay) lines.push(`  ${d.day}  req ${String(d.requests).padStart(5)}  in ${formatTokens(d.inputTokens).padStart(8)}  total ${formatTokens(d.totalTokens).padStart(8)}`);
  }
  if (report.byModel.length) {
    lines.push('', 'by model');
    for (const m of report.byModel.slice(0, top)) {
      const share = report.totalTokens > 0 ? ((m.totalTokens / report.totalTokens) * 100).toFixed(0) : '0';
      lines.push(`  ${`${m.provider}/${m.model}`.padEnd(48)} req ${String(m.requests).padStart(5)}  total ${formatTokens(m.totalTokens).padStart(8)}  ${share.padStart(2)}%`);
    }
  }
  if (report.byAgent.length) {
    lines.push('', 'by agent');
    for (const a of report.byAgent.slice(0, top)) {
      lines.push(`  ${a.agent.padEnd(26)} req ${String(a.requests).padStart(5)}  total ${formatTokens(a.totalTokens).padStart(8)}`);
    }
  }

  const derived = plan.ceilingSource === 'window'
    ? ` (${formatTokens(plan.window)} window × ${plan.utilization})`
    : ' (explicit budget)';
  lines.push('', `compaction plan — ceiling ${formatTokens(plan.ceiling)}${derived}, idle >= ${duration(plan.idleMs)}, ${plan.sessions} sessions`);
  if (plan.compact.length) {
    for (const c of plan.compact.slice(0, 20)) {
      lines.push(`  COMPACT ${c.sessionId.padEnd(24)} ${String(c.agent ?? '-').padEnd(22)} ${formatTokens(c.contextTokens).padStart(7)}  idle ${duration(c.idleMs)}  ${c.kind}`);
    }
    if (plan.compact.length > 20) lines.push(`  … ${plan.compact.length - 20} more`);
  } else {
    lines.push('  nothing over ceiling');
  }
  const counts = Object.entries(plan.skippedCounts).map(([k, v]) => `${k} ${v}`).join(' · ');
  lines.push(`  skipped: ${counts || 'none'}`);
  return lines.join('\n');
}
