/**
 * @hq:context Context budget tests: pure row fixtures only. No sqlite, no ZCode database, no file reads.
 * @hq:owner agent-platform-ceo
 * @hq:task token-budget
 * @hq:invariant every fixture is constructed here; these tests never open db.sqlite or .hq/index.db.
 */
import { describe, expect, test } from 'bun:test';
import {
  census,
  sessionContexts,
  planCompactions,
  resolveCeiling,
  formatTokens,
  renderContextBudget,
  CONTEXT_BUDGET_SCHEMA,
  COMPACTION_PLAN_SCHEMA,
  DEFAULT_WINDOW_TOKENS,
  DEFAULT_UTILIZATION,
  SKIP_CODES,
} from '../lib/context-budget.mjs';

const NOW = Date.UTC(2026, 10, 4, 12, 0, 0);
const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;

/** One usage row; provider/model/status default to the common case. */
function usage(over = {}) {
  return {
    session_id: 'sess_a',
    turn_id: 'turn_1',
    agent: 'zcode-agent',
    provider_id: 'deepseek',
    model_id: 'deepseek-flash',
    status: 'completed',
    started_at: NOW - MIN,
    input_tokens: 100000,
    output_tokens: 1000,
    reasoning_tokens: 0,
    cache_read_input_tokens: 90000,
    cache_creation_input_tokens: 0,
    computed_total_tokens: 101000,
    retry_count: 0,
    ...over,
  };
}

function session(id, over = {}) {
  return { id, parent_id: null, time_updated: NOW - MIN, time_compacting: null, ...over };
}

describe('census', () => {
  test('totals the window and splits cached from fresh input', () => {
    const report = census([usage(), usage({ input_tokens: 50000, cache_read_input_tokens: 40000, output_tokens: 500, computed_total_tokens: 50500 })], { now: NOW, windowMs: 3 * DAY });
    expect(report.schema).toBe(CONTEXT_BUDGET_SCHEMA);
    expect(report.requests).toBe(2);
    expect(report.inputTokens).toBe(150000);
    expect(report.outputTokens).toBe(1500);
    expect(report.cacheReadTokens).toBe(130000);
    expect(report.freshInputTokens).toBe(20000);
    expect(report.cacheHitRatio).toBeCloseTo(130000 / 150000, 6);
    expect(report.avgInputPerRequest).toBe(75000);
    expect(report.totalTokens).toBe(151500);
  });

  test('excludes rows outside the window', () => {
    const report = census([usage(), usage({ started_at: NOW - 4 * DAY })], { now: NOW, windowMs: 3 * DAY });
    expect(report.requests).toBe(1);
    expect(report.inputTokens).toBe(100000);
  });

  test('counts non-completed requests and retries as waste', () => {
    const report = census([usage({ status: 'error', retry_count: 2 }), usage({ status: 'cancelled' })], { now: NOW, windowMs: 3 * DAY });
    expect(report.nonCompletedRequests).toBe(2);
    expect(report.retries).toBe(2);
  });

  test('aggregates by day, model and agent with deterministic ordering', () => {
    const report = census([
      usage({ started_at: NOW - 2 * DAY, model_id: 'a', computed_total_tokens: 10, input_tokens: 10 }),
      usage({ started_at: NOW - MIN, model_id: 'b', computed_total_tokens: 900, input_tokens: 900 }),
      usage({ started_at: NOW - MIN, model_id: 'b', agent: 'zcode-forge', computed_total_tokens: 900, input_tokens: 900 }),
    ], { now: NOW, windowMs: 3 * DAY });
    expect(report.byDay.map((d) => d.day)).toEqual(['2026-11-02', '2026-11-04']);
    expect(report.byModel[0].model).toBe('b');
    expect(report.byModel[0].requests).toBe(2);
    expect(report.byModel[0].totalTokens).toBe(1800);
    expect(report.byAgent[0].agent).toBe('zcode-agent');
    expect(report.byAgent.find((a) => a.agent === 'zcode-forge').requests).toBe(1);
  });

  test('falls back to input+output when computed_total is absent', () => {
    const report = census([usage({ computed_total_tokens: null, input_tokens: 100, output_tokens: 20 })], { now: NOW, windowMs: 3 * DAY });
    expect(report.totalTokens).toBe(120);
  });

  test('an empty window is zero, not NaN', () => {
    const report = census([], { now: NOW, windowMs: 3 * DAY });
    expect(report.requests).toBe(0);
    expect(report.cacheHitRatio).toBe(0);
    expect(report.avgInputPerRequest).toBe(0);
  });
});

describe('sessionContexts', () => {
  test('uses the most recent request as the context size', () => {
    const rows = [
      usage({ started_at: NOW - 10 * MIN, input_tokens: 20000 }),
      usage({ started_at: NOW - MIN, input_tokens: 250000 }),
    ];
    const [ctx] = sessionContexts([session('sess_a')], rows, { now: NOW });
    expect(ctx.contextTokens).toBe(250000);
    expect(ctx.idleMs).toBe(MIN);
    expect(ctx.turns).toBe(1);
    expect(ctx.hasUsage).toBe(true);
  });

  test('labels child sessions and counts distinct turns', () => {
    const rows = [
      usage({ turn_id: 't1', started_at: NOW - 5 * MIN }),
      usage({ turn_id: 't2', started_at: NOW - 4 * MIN }),
      usage({ turn_id: 't2', started_at: NOW - 3 * MIN }),
    ];
    const ctx = sessionContexts([session('sess_a', { parent_id: 'sess_root' })], rows, { now: NOW })[0];
    expect(ctx.kind).toBe('child');
    expect(ctx.parentId).toBe('sess_root');
    expect(ctx.turns).toBe(2);
  });

  test('a session with no usage reports no usage rather than zero context', () => {
    const [ctx] = sessionContexts([session('sess_quiet')], [], { now: NOW });
    expect(ctx.hasUsage).toBe(false);
    expect(ctx.contextTokens).toBe(0);
  });
});

describe('resolveCeiling', () => {
  test('derives the ceiling from a 1M window at 80% by default', () => {
    const r = resolveCeiling();
    expect(r.window).toBe(DEFAULT_WINDOW_TOKENS);
    expect(r.utilization).toBe(DEFAULT_UTILIZATION);
    expect(r.ceiling).toBe(800000);
    expect(r.source).toBe('window');
  });

  test('an explicit ceiling wins and is labelled as a budget', () => {
    const r = resolveCeiling({ ceiling: 150000, window: 1000000, utilization: 0.8 });
    expect(r.ceiling).toBe(150000);
    expect(r.source).toBe('explicit');
  });

  test('a smaller window lowers the ceiling', () => {
    expect(resolveCeiling({ window: 200000, utilization: 0.5 }).ceiling).toBe(100000);
  });

  test('out-of-range utilisation falls back instead of producing nonsense', () => {
    expect(resolveCeiling({ utilization: 0 }).ceiling).toBe(800000);
    expect(resolveCeiling({ utilization: 2 }).ceiling).toBe(800000);
    expect(resolveCeiling({ window: -1 }).ceiling).toBe(800000);
  });
});

describe('planCompactions', () => {
  const plan = (over = {}) => planCompactions({
    sessions: [session('sess_hot')],
    usageRows: [usage({ session_id: 'sess_hot', input_tokens: 400000, started_at: NOW - 30 * MIN })],
    now: NOW,
    ceiling: 150000,
    idleMs: 5 * MIN,
    ...over,
  });

  test('selects an idle session over the ceiling', () => {
    const p = plan();
    expect(p.schema).toBe(COMPACTION_PLAN_SCHEMA);
    expect(p.compact).toHaveLength(1);
    expect(p.compact[0].sessionId).toBe('sess_hot');
    expect(p.compact[0].reason).toContain('400000');
    expect(p.overCeiling).toBe(1);
  });

  test('derives the ceiling from the model window when none is given', () => {
    const p = planCompactions({
      sessions: [session('sess_hot')],
      usageRows: [usage({ session_id: 'sess_hot', input_tokens: 400000, started_at: NOW - 30 * MIN })],
      now: NOW,
      idleMs: 5 * MIN,
    });
    expect(p.ceiling).toBe(800000);
    expect(p.ceilingSource).toBe('window');
    expect(p.compact).toHaveLength(0);
    expect(p.skipped[0].code).toBe(SKIP_CODES.BELOW_CEILING);
  });

  test('a context exactly at the ceiling is not selected', () => {
    const p = plan({ usageRows: [usage({ session_id: 'sess_hot', input_tokens: 150000, started_at: NOW - 30 * MIN })] });
    expect(p.compact).toHaveLength(0);
    expect(p.skipped[0].code).toBe(SKIP_CODES.BELOW_CEILING);
  });

  test('a session that just made a request is still running', () => {
    const p = plan({ usageRows: [usage({ session_id: 'sess_hot', input_tokens: 400000, started_at: NOW - MIN })] });
    expect(p.compact).toHaveLength(0);
    expect(p.skipped[0].code).toBe(SKIP_CODES.RUNNING);
    expect(p.overCeiling).toBe(1);
  });

  test('a session already compacting is skipped', () => {
    const p = plan({ sessions: [session('sess_hot', { time_compacting: NOW - MIN })] });
    expect(p.skipped[0].code).toBe(SKIP_CODES.ALREADY_COMPACTING);
  });

  test('a session with no usage is skipped', () => {
    const p = plan({ usageRows: [] });
    expect(p.skipped[0].code).toBe(SKIP_CODES.NO_USAGE);
  });

  test('orders selections by context size descending', () => {
    const p = planCompactions({
      sessions: [session('sess_small'), session('sess_big'), session('sess_mid')],
      usageRows: [
        usage({ session_id: 'sess_small', input_tokens: 160000, started_at: NOW - 30 * MIN }),
        usage({ session_id: 'sess_big', input_tokens: 500000, started_at: NOW - 30 * MIN }),
        usage({ session_id: 'sess_mid', input_tokens: 300000, started_at: NOW - 30 * MIN }),
      ],
      now: NOW, ceiling: 150000, idleMs: 5 * MIN,
    });
    expect(p.compact.map((c) => c.sessionId)).toEqual(['sess_big', 'sess_mid', 'sess_small']);
  });
});

describe('rendering', () => {
  test('formatTokens uses magnitudes', () => {
    expect(formatTokens(999)).toBe('999');
    expect(formatTokens(1500)).toBe('1.5k');
    expect(formatTokens(1866300000)).toBe('1.87B');
  });

  test('the rendered report names the plan and the skip counts', () => {
    const rows = [usage({ session_id: 'sess_hot', input_tokens: 400000, started_at: NOW - 30 * MIN })];
    const report = census(rows, { now: NOW, windowMs: 3 * DAY });
    const p = planCompactions({ sessions: [session('sess_hot')], usageRows: rows, now: NOW, ceiling: 150000, idleMs: 5 * MIN });
    const text = renderContextBudget(report, p);
    expect(text).toContain('Context budget — 3d window');
    expect(text).toContain('COMPACT sess_hot');
    expect(text).toContain('ceiling 150.0k');
  });
});
