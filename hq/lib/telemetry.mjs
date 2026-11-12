// hq/lib/telemetry.mjs — native execution timing, budgets, priorities, optimizer.
// Every span is local. No file contents, no secrets, no network.
import { nowISO, canonicalJson, safeJsonParse } from './util.mjs';

export const PERFORMANCE_PROFILES = Object.freeze({
  speed: {
    limits: { search: 10, find: 20, contextMaxFiles: 10, contextBudgetTokens: 3500, wikiMaxFilePages: 1500, briefMaxBytes: 3000 },
    budgets: { search: 150, find: 150, context: 350, brief: 200, index: 10000, wiki: 12000, lint: 700, mcp: 350, ask: 500, verify: 1200 },
  },
  balanced: {
    limits: { search: 20, find: 30, contextMaxFiles: 24, contextBudgetTokens: 6000, wikiMaxFilePages: 5000, briefMaxBytes: 6000 },
    budgets: { search: 250, find: 250, context: 600, brief: 300, index: 15000, wiki: 20000, lint: 1000, mcp: 600, ask: 800, verify: 2000 },
  },
  quality: {
    limits: { search: 40, find: 60, contextMaxFiles: 40, contextBudgetTokens: 9000, wikiMaxFilePages: 10000, briefMaxBytes: 12000 },
    budgets: { search: 500, find: 500, context: 1200, brief: 500, index: 30000, wiki: 45000, lint: 2000, mcp: 1200, ask: 1500, verify: 4000 },
  },
});

export const OPERATIONS = Object.freeze([
  'search', 'find', 'context', 'brief', 'index', 'wiki', 'lint', 'mcp', 'ask',
  'verify', 'watch', 'hooks', 'doctor', 'check', 'status', 'route', 'handoff', 'since',
]);

const TUNABLES = {
  search: { path: 'performance.limits.search', min: 5, max: 100, unit: 'results' },
  find: { path: 'performance.limits.find', min: 5, max: 200, unit: 'results' },
  context: { path: 'performance.limits.contextMaxFiles', min: 4, max: 60, unit: 'files' },
  brief: { path: 'performance.limits.briefMaxBytes', min: 2000, max: 20000, unit: 'bytes' },
  wiki: { path: 'performance.limits.wikiMaxFilePages', min: 100, max: 20000, unit: 'pages' },
  index: { path: 'maxFileBytes', min: 200000, max: 5000000, unit: 'bytes' },
  lint: { path: 'performance.limits.lintMaxFindings', min: 50, max: 1000, unit: 'findings' },
  mcp: { path: 'performance.limits.search', min: 5, max: 100, unit: 'results' },
  ask: { path: 'performance.limits.search', min: 5, max: 100, unit: 'results' },
  verify: { path: 'performance.limits.lintMaxFindings', min: 50, max: 1000, unit: 'findings' },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function budgetValue(budget) {
  if (typeof budget === 'number') return budget;
  if (budget && typeof budget.p95Ms === 'number') return budget.p95Ms;
  return null;
}

/**
 * Merge a component tag into a span's meta without touching the caller's
 * object. A span that names no component keeps exactly the meta it was given,
 * so the stored shape of every existing span is unchanged.
 *
 * @param {any} meta
 * @param {any} component
 * @returns {any}
 */
function taggedMeta(meta, component) {
  const name = component == null ? '' : String(component).trim();
  if (!name) return meta ?? null;
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    return { ...meta, component: name };
  }
  if (meta == null) return { component: name };
  return { component: name, meta };
}

export function recordTiming(db, {
  operation, project = null, startedAt = nowISO(), durationMs,
  ok = true, bytes = 0, tokens = 0, meta = null, component = null,
}) {
  if (!operation) throw new Error('TELEMETRY_OPERATION_REQUIRED');
  const duration = Number(durationMs);
  if (!Number.isFinite(duration) || duration < 0) throw new Error('TELEMETRY_DURATION_INVALID');
  const tagged = taggedMeta(meta, component);
  db.prepare(`
    INSERT INTO timings(operation, project, started_at, duration_ms, ok, bytes, tokens, meta)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(
    operation, project, startedAt, Math.round(duration * 1000) / 1000,
    ok ? 1 : 0, Number(bytes) || 0, Number(tokens) || 0,
    tagged == null ? null : canonicalJson(tagged),
  );
}

export function startSpan(db, { operation, project = null, meta = null, component = null } = {}) {
  const startedAt = nowISO();
  const start = performance.now();
  let ended = false;
  return {
    end(extra = {}) {
      if (ended) return null;
      ended = true;
      const durationMs = performance.now() - start;
      const record = {
        operation, project, startedAt,
        durationMs: Math.round(durationMs * 1000) / 1000,
        ok: extra.ok !== false,
        bytes: Number(extra.bytes || 0),
        tokens: Number(extra.tokens || 0),
        meta: extra.meta ?? meta,
      };
      // The component key is present only when a component was named, so the
      // record shape of every pre-existing span is unchanged.
      const named = extra.component ?? component;
      if (named != null && String(named).trim() !== '') record.component = named;
      recordTiming(db, record);
      return record;
    },
  };
}

export function timeSync(db, context, fn) {
  const span = startSpan(db, context);
  try {
    const result = fn();
    span.end({ ok: true });
    return result;
  } catch (error) {
    span.end({ ok: false, meta: { ...(context.meta || {}), error: error.message } });
    throw error;
  }
}

export async function timeAsync(db, context, fn) {
  const span = startSpan(db, context);
  try {
    const result = await fn();
    span.end({ ok: true });
    return result;
  } catch (error) {
    span.end({ ok: false, meta: { ...(context.meta || {}), error: error.message } });
    throw error;
  }
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[index];
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

export function timingReport(db, { operation = null, since = null, limit = 5000 } = {}) {
  const where = [];
  const params = [];
  if (operation) { where.push('operation = ?'); params.push(operation); }
  if (since) { where.push('started_at >= ?'); params.push(since); }
  const sql = `SELECT operation, project, started_at, duration_ms, ok, bytes, tokens, meta
    FROM timings ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY id DESC LIMIT ?`;
  const spans = db.prepare(sql).all(...params, Math.max(1, Number(limit) || 5000));
  const byOperation = new Map();
  for (const span of spans) {
    const bucket = byOperation.get(span.operation) || [];
    bucket.push(span);
    byOperation.set(span.operation, bucket);
  }
  const aggregates = [];
  for (const [op, rows] of [...byOperation.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const durations = rows.map((r) => r.duration_ms).sort((a, b) => a - b);
    const errors = rows.filter((r) => !r.ok).length;
    const total = durations.reduce((sum, n) => sum + n, 0);
    aggregates.push({
      operation: op,
      count: rows.length,
      errors,
      errorRate: rows.length ? errors / rows.length : 0,
      meanMs: round(total / rows.length),
      p50Ms: round(percentile(durations, 0.5)),
      p95Ms: round(percentile(durations, 0.95)),
      maxMs: round(durations[durations.length - 1]),
      totalMs: round(total),
      bytes: rows.reduce((sum, r) => sum + (r.bytes || 0), 0),
      tokens: rows.reduce((sum, r) => sum + (r.tokens || 0), 0),
    });
  }
  const totals = {
    spans: spans.length,
    operations: aggregates.length,
    totalMs: round(aggregates.reduce((sum, a) => sum + a.totalMs, 0)),
    errors: aggregates.reduce((sum, a) => sum + a.errors, 0),
  };
  return {
    schema: 'hq.timing-report/1',
    generatedAt: nowISO(),
    operation, since, totals, aggregates, spans,
  };
}

export function budgetReport(db, config, { since = null } = {}) {
  const report = timingReport(db, { since, limit: 5000 });
  const budgets = config?.performance?.budgets || {};
  const priorities = config?.performance?.priorities || {};
  const rows = [];
  for (const [operation, budgetRaw] of Object.entries(budgets)) {
    const budget = budgetValue(budgetRaw);
    if (budget == null) continue;
    const aggregate = report.aggregates.find((a) => a.operation === operation) || null;
    const p95 = aggregate ? aggregate.p95Ms : 0;
    const ratio = budget > 0 ? p95 / budget : 0;
    rows.push({
      operation,
      budget,
      p95Ms: p95,
      ratio: round(ratio),
      priority: Number(priorities[operation] || 1),
      count: aggregate ? aggregate.count : 0,
      errors: aggregate ? aggregate.errors : 0,
      ok: ratio <= 1 && (aggregate ? aggregate.errors === 0 : true),
    });
  }
  rows.sort((a, b) => (b.ratio - a.ratio) || (b.priority - a.priority) || a.operation.localeCompare(b.operation));
  return {
    schema: 'hq.timing-budgets/1',
    generatedAt: nowISO(),
    profile: config?.performance?.profile || 'balanced',
    rows,
    violations: rows.filter((r) => !r.ok),
  };
}

// --- component attribution (HQ-089) -----------------------------------------
//
// A span names the source component that produced it through
// `meta.component` (written by `recordTiming({ component })`). The tag is
// optional: an untagged span is unattributed, never guessed at.

/** The meta key that names the component a span belongs to. */
export const COMPONENT_META_KEY = 'component';

/**
 * The component a span belongs to, read from its meta tag.
 * Returns null when the span names no component.
 *
 * @param {{meta?: string|null}} span
 * @returns {string|null}
 */
export function spanComponent(span) {
  const meta = span?.meta ? safeJsonParse(span.meta, null) : null;
  const name = meta && typeof meta === 'object' ? meta[COMPONENT_META_KEY] : null;
  const text = typeof name === 'string' ? name.trim() : '';
  return text || null;
}

/**
 * @param {Array<{duration_ms: number}>} spans
 * @returns {{spans: number, totalMs: number, p95Ms: number, maxMs: number}}
 */
function spanStats(spans) {
  const durations = spans.map((s) => Number(s.duration_ms) || 0).sort((a, b) => a - b);
  const total = durations.reduce((sum, n) => sum + n, 0);
  return {
    spans: spans.length,
    totalMs: round(total),
    p95Ms: round(percentile(durations, 0.95)),
    maxMs: durations.length ? round(durations[durations.length - 1]) : 0,
  };
}

/**
 * componentAttribution — which components are responsible for a performance
 * regression (AII scenario HQ-089).
 *
 * A regression is a change between two windows of the timing ledger: the
 * baseline window (before `baselineSince`) and the current window (from
 * `baselineSince` on). Spans are grouped by the component they name, so the
 * answer names components rather than operations.
 *
 * Responsibility is decided by evidence, in two steps:
 *   1. a component whose OWN p95 exceeds the operation's budget is
 *      responsible — it alone blows the budget;
 *   2. otherwise, the components whose own p95 GREW against the baseline are
 *      responsible, largest growth first.
 * A component that is neither is listed but is not blamed.
 *
 * Spans that name no component are reported as unattributed, never folded
 * into a component that did not do the work.
 *
 * Pure and read-only: it reads the ledger and writes nothing.
 *
 * @param {any} db open HQ index
 * @param {any} config HQ config (performance.budgets supplies the budget)
 * @param {{operation?: string|null, since?: string|null, baselineSince?: string|null, limit?: number}} [opts]
 */
export function componentAttribution(db, config, {
  operation = null,
  since = null,
  baselineSince = null,
  limit = 5000,
} = {}) {
  const where = [];
  const params = [];
  if (operation) { where.push('operation = ?'); params.push(String(operation)); }
  if (since) { where.push('started_at >= ?'); params.push(String(since)); }
  const rows = db.prepare(`
    SELECT operation, project, started_at, duration_ms, ok, bytes, tokens, meta
    FROM timings ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY id ASC LIMIT ?
  `).all(...params, Math.max(1, Number(limit) || 5000));

  const baselineRows = [];
  const currentRows = [];
  for (const row of rows) {
    if (baselineSince && String(row.started_at) < String(baselineSince)) baselineRows.push(row);
    else currentRows.push(row);
  }

  const budgetMs = operation ? budgetValue((config?.performance?.budgets || {})[operation]) : null;

  /** @type {Map<string, {baseline: any[], current: any[]}>} */
  const groups = new Map();
  const groupOf = (name) => {
    const key = name ?? '';
    let g = groups.get(key);
    if (!g) { g = { baseline: [], current: [] }; groups.set(key, g); }
    return g;
  };
  for (const row of baselineRows) groupOf(spanComponent(row)).baseline.push(row);
  for (const row of currentRows) groupOf(spanComponent(row)).current.push(row);

  const components = [];
  let unattributed = { spans: 0, totalMs: 0 };
  for (const [name, g] of groups) {
    const current = spanStats(g.current);
    const baseline = spanStats(g.baseline);
    if (!name) {
      unattributed = { spans: current.spans, totalMs: current.totalMs };
      continue;
    }
    components.push({
      component: name,
      operations: [...new Set(g.current.map((r) => r.operation))].sort(),
      baselineSpans: baseline.spans,
      baselineP95Ms: baseline.p95Ms,
      currentSpans: current.spans,
      currentP95Ms: current.p95Ms,
      currentTotalMs: current.totalMs,
      deltaP95Ms: baseline.spans ? round(current.p95Ms - baseline.p95Ms) : null,
      overBudget: budgetMs != null && current.p95Ms > budgetMs,
    });
  }

  const currentTotal = currentRows.length;
  const totalMs = components.reduce((sum, c) => sum + c.currentTotalMs, 0) + unattributed.totalMs;
  for (const c of components) {
    c.shareOfCurrentMs = totalMs > 0 ? round(c.currentTotalMs / totalMs) : 0;
  }
  components.sort((a, b) => (b.currentP95Ms - a.currentP95Ms) || a.component.localeCompare(b.component));

  const overBudget = components.filter((c) => c.overBudget);
  const grown = components
    .filter((c) => c.deltaP95Ms != null && c.deltaP95Ms > 0)
    .sort((a, b) => (b.deltaP95Ms - a.deltaP95Ms) || (b.currentP95Ms - a.currentP95Ms) || a.component.localeCompare(b.component));
  const blamed = overBudget.length ? overBudget : grown;

  return {
    schema: 'hq.timing-component-attribution/1',
    generatedAt: nowISO(),
    operation,
    since,
    baselineSince,
    budgetMs,
    baseline: { ...spanStats(baselineRows), until: baselineSince },
    current: { ...spanStats(currentRows), from: baselineSince },
    regressionMs: baselineSince && baselineRows.length
      ? round(spanStats(currentRows).p95Ms - spanStats(baselineRows).p95Ms)
      : null,
    overBudget: budgetMs != null && spanStats(currentRows).p95Ms > budgetMs,
    components,
    unattributed: { ...unattributed, shareOfCurrentMs: totalMs > 0 ? round(unattributed.totalMs / totalMs) : 0 },
    currentSpans: currentTotal,
    responsible: blamed.map((c) => ({
      component: c.component,
      reason: c.overBudget ? 'own p95 exceeds the operation budget' : 'own p95 grew against the baseline',
      currentP95Ms: c.currentP95Ms,
      deltaP95Ms: c.deltaP95Ms,
    })),
  };
}

// --- consumption attribution (HQ-091) ---------------------------------------

/**
 * A span delivered something observable when it produced output bytes, spent
 * tokens, or recorded structured evidence in its meta. A span that ran and
 * produced nothing observable consumed resources without delivering a result.
 *
 * @param {{ok: number, bytes: number, tokens: number, meta: string|null}} span
 * @returns {boolean}
 */
function spanDelivered(span) {
  if (Number(span.bytes) > 0) return true;
  if (Number(span.tokens) > 0) return true;
  const meta = span.meta ? safeJsonParse(span.meta, null) : null;
  return !!meta && typeof meta === 'object' && Object.keys(meta).length > 0;
}

/**
 * wastedConsumption — which background operations consume resources without
 * delivering a useful result (AII scenario HQ-091).
 *
 * The ledger records what each span consumed (time, tokens, bytes) and what
 * it produced. Three facts are read off it, and they are kept apart because
 * they mean different things:
 *   - `failed`: the span recorded ok = 0 — time was spent on work that did
 *     not succeed. That is a ledger fact, not an inference.
 *   - `noResultEvidence`: the span reported ok = 1 but recorded no output
 *     bytes, no tokens and no structured evidence in its meta. The ledger
 *     holds no evidence that the span produced a result; whether the caller
 *     saw one anyway is outside what the ledger knows, so this is reported as
 *     absent evidence, never as a proven absence.
 *   - `overBudget`: the operation's p95 exceeds the budget configured for
 *     it, so it consumed more than it was allowed.
 *
 * `wastefulOperations` names the operations that both exceeded their budget
 * and carry no result evidence — the ones whose time bought nothing the
 * ledger can show. Pure and read-only: it reads the ledger and writes
 * nothing.
 *
 * @param {any} db open HQ index
 * @param {any} config HQ config (performance.budgets supplies the budgets)
 * @param {{since?: string|null, limit?: number}} [opts]
 */
export function wastedConsumption(db, config, { since = null, limit = 5000 } = {}) {
  const where = [];
  const params = [];
  if (since) { where.push('started_at >= ?'); params.push(String(since)); }
  const rows = db.prepare(`
    SELECT operation, project, started_at, duration_ms, ok, bytes, tokens, meta
    FROM timings ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY id DESC LIMIT ?
  `).all(...params, Math.max(1, Number(limit) || 5000));

  const budgets = config?.performance?.budgets || {};
  const failed = [];
  const noResultEvidence = [];
  let failedMs = 0;
  let noResultEvidenceMs = 0;
  let failedTokens = 0;
  let noResultEvidenceTokens = 0;
  let deliveredSpans = 0;
  let deliveredMs = 0;

  for (const row of rows) {
    const durationMs = Number(row.duration_ms) || 0;
    const tokens = Number(row.tokens) || 0;
    const base = {
      operation: row.operation,
      project: row.project,
      startedAt: row.started_at,
      durationMs,
      tokens,
      bytes: Number(row.bytes) || 0,
    };
    if (!row.ok) {
      failed.push({ ...base, reason: 'the span recorded ok = 0' });
      failedMs += durationMs;
      failedTokens += tokens;
    } else if (!spanDelivered(row)) {
      noResultEvidence.push({ ...base, reason: 'the span recorded no output bytes, tokens or structured evidence' });
      noResultEvidenceMs += durationMs;
      noResultEvidenceTokens += tokens;
    } else {
      deliveredSpans += 1;
      deliveredMs += durationMs;
    }
  }

  /** @type {Map<string, {spans: any[], failed: number, failedMs: number, noResultEvidence: number, noResultEvidenceMs: number}>} */
  const byOperation = new Map();
  const opOf = (name) => {
    let o = byOperation.get(name);
    if (!o) { o = { spans: [], failed: 0, failedMs: 0, noResultEvidence: 0, noResultEvidenceMs: 0 }; byOperation.set(name, o); }
    return o;
  };
  for (const row of rows) opOf(row.operation).spans.push(row);
  for (const row of failed) { const o = opOf(row.operation); o.failed += 1; o.failedMs += row.durationMs; }
  for (const row of noResultEvidence) { const o = opOf(row.operation); o.noResultEvidence += 1; o.noResultEvidenceMs += row.durationMs; }

  const operations = [...byOperation.entries()].map(([operation, o]) => {
    const stats = spanStats(o.spans);
    const budgetMs = budgetValue(budgets[operation]);
    return {
      operation,
      count: o.spans.length,
      totalMs: stats.totalMs,
      p95Ms: stats.p95Ms,
      budgetMs,
      overBudget: budgetMs != null && stats.p95Ms > budgetMs,
      ratio: budgetMs != null && budgetMs > 0 ? round(stats.p95Ms / budgetMs) : null,
      failedSpans: o.failed,
      failedMs: round(o.failedMs),
      noResultEvidenceSpans: o.noResultEvidence,
      noResultEvidenceMs: round(o.noResultEvidenceMs),
      wastedMs: round(o.failedMs + o.noResultEvidenceMs),
    };
  }).sort((a, b) => (b.wastedMs - a.wastedMs) || a.operation.localeCompare(b.operation));

  const wastedMs = failedMs + noResultEvidenceMs;
  const wastefulOperations = operations
    .filter((o) => o.overBudget && o.noResultEvidenceSpans > 0)
    .map((o) => ({
      operation: o.operation,
      p95Ms: o.p95Ms,
      budgetMs: o.budgetMs,
      ratio: o.ratio,
      noResultEvidenceSpans: o.noResultEvidenceSpans,
      noResultEvidenceMs: o.noResultEvidenceMs,
      reason: 'the operation exceeded its budget and recorded no result evidence',
    }));

  const wasted = [...failed, ...noResultEvidence]
    .sort((a, b) => (b.durationMs - a.durationMs) || a.operation.localeCompare(b.operation));

  return {
    schema: 'hq.timing-wasted-consumption/1',
    generatedAt: nowISO(),
    since,
    totals: {
      spans: rows.length,
      failedSpans: failed.length,
      failedMs: round(failedMs),
      failedTokens,
      noResultEvidenceSpans: noResultEvidence.length,
      noResultEvidenceMs: round(noResultEvidenceMs),
      noResultEvidenceTokens,
      deliveredSpans,
      deliveredMs: round(deliveredMs),
      wastedMs: round(wastedMs),
      wastedSpans: failed.length + noResultEvidence.length,
    },
    operations,
    wastefulOperations,
    wasted: wasted.slice(0, 50),
  };
}

function getPath(object, path) {
  return path.split('.').reduce((value, key) => (value == null ? undefined : value[key]), object);
}

function setPath(object, path, value) {
  const keys = path.split('.');
  let cursor = object;
  for (const key of keys.slice(0, -1)) {
    if (cursor[key] == null || typeof cursor[key] !== 'object') cursor[key] = {};
    cursor = cursor[key];
  }
  cursor[keys[keys.length - 1]] = value;
}

function clampTunable(value, tunable) {
  return Math.max(tunable.min, Math.min(tunable.max, Math.round(value)));
}

function currentTunable(config, operation) {
  const tunable = TUNABLES[operation];
  if (!tunable) return null;
  return getPath(config, tunable.path);
}

function recommendation({ operation, action, direction, priority, expectedGain, reason, tradeoff, patchPath, patchValue, safeToApply = true }) {
  const id = `${operation}:${action}`;
  return {
    id, operation, action, direction, priority,
    expectedGain: round(Math.max(0, expectedGain)),
    score: round(Number(priority || 1) * Math.max(0, expectedGain)),
    reason, tradeoff,
    configPatch: patchPath ? { path: patchPath, value: patchValue } : null,
    safeToApply,
    resource: patchPath || null,
  };
}

export function optimize(db, config, { since = null } = {}) {
  const budgets = budgetReport(db, config, { since });
  const weights = config?.performance?.weights || { speed: 1, quality: 1 };
  const speedWeight = Number(weights.speed || 0);
  const qualityWeight = Number(weights.quality || 0);
  const recommendations = [];

  for (const row of budgets.rows) {
    const tunable = TUNABLES[row.operation];
    if (row.errors > 0) {
      recommendations.push(recommendation({
        operation: row.operation,
        action: 'investigate-errors',
        direction: 'reliability',
        priority: row.priority,
        expectedGain: row.errors / Math.max(1, row.count),
        reason: `${row.errors}/${row.count} spans failed`,
        tradeoff: 'none — correctness before speed',
        safeToApply: false,
      }));
    }
    if (!tunable) continue;

    const current = Number(currentTunable(config, row.operation));
    if (!Number.isFinite(current)) continue;

    const weightSum = Math.max(1e-9, speedWeight + qualityWeight);

    if (row.ratio > 1) {
      const next = clampTunable(current * 0.7, tunable);
      if (next < current) {
        recommendations.push(recommendation({
          operation: row.operation,
          action: 'reduce-load',
          direction: 'speed',
          priority: row.priority,
          expectedGain: (row.ratio - 1) * (speedWeight / weightSum),
          reason: `p95 ${row.p95Ms}ms exceeds budget ${row.budget}ms`,
          tradeoff: `less ${tunable.unit} per run; faster but lower recall/coverage`,
          patchPath: tunable.path,
          patchValue: next,
        }));
      }
      recommendations.push(recommendation({
        operation: row.operation,
        action: 'raise-budget',
        direction: 'quality',
        priority: row.priority,
        expectedGain: (row.ratio - 1) * (qualityWeight / weightSum),
        reason: `p95 ${row.p95Ms}ms exceeds budget ${row.budget}ms; keep coverage and accept the time`,
        tradeoff: 'slower command accepted to preserve quality',
        patchPath: `performance.budgets.${row.operation}`,
        patchValue: Math.max(50, Math.ceil(row.p95Ms * 1.25)),
      }));
    } else if (row.ratio > 0 && row.ratio < 0.5) {
      if (row.priority >= 3) {
        const next = clampTunable(current * 1.3, tunable);
        if (next > current) {
          recommendations.push(recommendation({
            operation: row.operation,
            action: 'raise-quality',
            direction: 'quality',
            priority: row.priority,
            expectedGain: (0.5 - row.ratio) * (qualityWeight / weightSum),
            reason: `p95 ${row.p95Ms}ms uses under half the ${row.budget}ms budget`,
            tradeoff: `more ${tunable.unit} per run and more latency`,
            patchPath: tunable.path,
            patchValue: next,
          }));
        }
      }
      recommendations.push(recommendation({
        operation: row.operation,
        action: 'tighten-budget',
        direction: 'speed',
        priority: row.priority,
        expectedGain: (0.5 - row.ratio) * (speedWeight / weightSum),
        reason: `p95 ${row.p95Ms}ms leaves most of the ${row.budget}ms budget unused`,
        tradeoff: 'earlier warning if the command regresses; headroom shrinks',
        patchPath: `performance.budgets.${row.operation}`,
        patchValue: Math.max(50, Math.ceil(row.p95Ms * 1.5)),
      }));
    }
  }

  // Conflicts: same resource or same operation, opposite directions.
  for (const rec of recommendations) {
    rec.conflictsWith = [];
    for (const other of recommendations) {
      if (other === rec) continue;
      const sameResource = rec.resource && rec.resource === other.resource;
      const sameOperation = rec.operation === other.operation;
      const opposite = rec.direction !== other.direction
        && rec.direction !== 'reliability' && other.direction !== 'reliability';
      if (opposite && (sameResource || sameOperation)) rec.conflictsWith.push(other.id);
    }
  }

  recommendations.sort((a, b) => (b.score - a.score) || a.id.localeCompare(b.id));
  const conflicts = [];
  for (let i = 0; i < recommendations.length; i++) {
    for (let j = i + 1; j < recommendations.length; j++) {
      const a = recommendations[i];
      const b = recommendations[j];
      const sameResource = a.resource && a.resource === b.resource;
      const sameOperation = a.operation === b.operation;
      const opposite = a.direction !== b.direction
        && a.direction !== 'reliability' && b.direction !== 'reliability';
      if (opposite && (sameResource || sameOperation)) {
        conflicts.push({ a: a.id, b: b.id, resource: a.resource || a.operation });
      }
    }
  }

  const highest = [...budgets.violations].sort((a, b) => (b.priority - a.priority) || (b.ratio - a.ratio))[0];
  const nextAction = recommendations.length
    ? (highest
      ? `Address ${highest.operation} first (priority ${highest.priority}, p95 ${highest.p95Ms}ms vs ${highest.budget}ms)`
      : recommendations[0].reason)
    : 'No changes needed.';

  return {
    schema: 'hq.timing-optimize/1',
    generatedAt: nowISO(),
    profile: budgets.profile,
    weights,
    priorities: config?.performance?.priorities || {},
    budgets: budgets.rows,
    violations: budgets.violations,
    recommendations,
    conflicts,
    summary: {
      profile: budgets.profile,
      violations: budgets.violations.length,
      recommendations: recommendations.length,
      conflicts: conflicts.length,
      nextAction,
    },
  };
}

export function applyPatch(config, patch) {
  if (!patch || !patch.path) return config;
  setPath(config, patch.path, patch.value);
  return config;
}

export function applyRecommendations(config, result, { onlySafe = true } = {}) {
  const next = clone(config);
  const applied = [];
  const skippedConflicts = [];
  const appliedIds = new Set();
  for (const rec of result.recommendations || []) {
    if (!rec.configPatch) continue;
    if (onlySafe && !rec.safeToApply) continue;
    if ((rec.conflictsWith || []).some((id) => appliedIds.has(id))) {
      skippedConflicts.push(rec.id);
      continue;
    }
    applyPatch(next, rec.configPatch);
    appliedIds.add(rec.id);
    applied.push({ id: rec.id, ...rec.configPatch });
  }
  return { config: next, applied, skippedConflicts };
}

export function applyProfile(config, profileName) {
  const profile = PERFORMANCE_PROFILES[profileName];
  if (!profile) throw new Error(`unknown profile: ${profileName}`);
  const next = clone(config);
  next.performance = next.performance || {};
  next.performance.profile = profileName;
  next.performance.limits = { ...(next.performance.limits || {}), ...profile.limits };
  next.performance.budgets = { ...(next.performance.budgets || {}), ...profile.budgets };
  return {
    config: next,
    changes: { profile: profileName, limits: profile.limits, budgets: profile.budgets },
  };
}

export function setPriority(config, operation, priority) {
  const next = clone(config);
  next.performance = next.performance || {};
  next.performance.priorities = next.performance.priorities || {};
  next.performance.priorities[operation] = Math.max(1, Math.min(10, Math.round(Number(priority) || 1)));
  return next;
}

export function setBudget(config, operation, p95Ms) {
  const next = clone(config);
  next.performance = next.performance || {};
  next.performance.budgets = next.performance.budgets || {};
  next.performance.budgets[operation] = Math.max(1, Math.round(Number(p95Ms) || 1));
  return next;
}

export function profileOptions(config, operation) {
  const limits = config?.performance?.limits || {};
  const budgets = config?.performance?.budgets || {};
  return {
    searchLimit: limits.search,
    findLimit: limits.find,
    contextMaxFiles: limits.contextMaxFiles,
    contextBudgetTokens: limits.contextBudgetTokens,
    wikiMaxFilePages: limits.wikiMaxFilePages,
    briefMaxBytes: limits.briefMaxBytes,
    lintMaxFindings: limits.lintMaxFindings,
    maxFileBytes: config?.maxFileBytes,
    budgetMs: budgetValue(budgets[operation]),
  };
}

export function formatTimingReport(report) {
  const lines = [];
  lines.push(`Timing report — ${report.totals.spans} spans across ${report.totals.operations} operations (${report.totals.totalMs} ms total)`);
  lines.push('');
  lines.push('Operation        Count  Errors   p50      p95      max');
  for (const row of report.aggregates) {
    lines.push(`${row.operation.padEnd(16)} ${String(row.count).padStart(5)}  ${String(row.errors).padStart(6)}  ${String(row.p50Ms).padStart(7)}  ${String(row.p95Ms).padStart(7)}  ${String(row.maxMs).padStart(7)}`);
  }
  if (!report.aggregates.length) lines.push('(no spans recorded yet)');
  return lines.join('\n');
}

export function formatOptimize(result) {
  const lines = [];
  lines.push(`Optimization — profile ${result.profile}, ${result.violations.length} violation(s), ${result.conflicts.length} conflict(s)`);
  lines.push(`Next: ${result.summary.nextAction}`);
  if (result.recommendations.length) {
    lines.push('');
    for (const rec of result.recommendations) {
      lines.push(`[${rec.priority}] ${rec.operation} ${rec.action} (${rec.direction}) score ${rec.score}`);
      lines.push(`    ${rec.reason}`);
      lines.push(`    tradeoff: ${rec.tradeoff}`);
      if (rec.configPatch) lines.push(`    patch: ${rec.configPatch.path} = ${rec.configPatch.value}`);
      if (rec.conflictsWith.length) lines.push(`    conflicts: ${rec.conflictsWith.join(', ')}`);
    }
  }
  return lines.join('\n');
}
