/**
 * @hq:context Context budget tests: pure row fixtures only. No sqlite, no ZCode database, no file reads.
 * @hq:owner agent-platform-ceo
 * @hq:task token-budget
 * @hq:invariant every fixture is constructed here; these tests never open db.sqlite or .hq/index.db.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
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
    assert.equal(report.schema, CONTEXT_BUDGET_SCHEMA);
    assert.equal(report.requests, 2);
    assert.equal(report.inputTokens, 150000);
    assert.equal(report.outputTokens, 1500);
    assert.equal(report.cacheReadTokens, 130000);
    assert.equal(report.freshInputTokens, 20000);
    assert.ok(Math.abs(report.cacheHitRatio - (130000 / 150000)) < 1e-6);
    assert.equal(report.avgInputPerRequest, 75000);
    assert.equal(report.totalTokens, 151500);
  });

  test('excludes rows outside the window', () => {
    const report = census([usage(), usage({ started_at: NOW - 4 * DAY })], { now: NOW, windowMs: 3 * DAY });
    assert.equal(report.requests, 1);
    assert.equal(report.inputTokens, 100000);
  });

  test('counts non-completed requests and retries as waste', () => {
    const report = census([usage({ status: 'error', retry_count: 2 }), usage({ status: 'cancelled' })], { now: NOW, windowMs: 3 * DAY });
    assert.equal(report.nonCompletedRequests, 2);
    assert.equal(report.retries, 2);
  });

  test('aggregates by day, model and agent with deterministic ordering', () => {
    const report = census([
      usage({ started_at: NOW - 2 * DAY, model_id: 'a', computed_total_tokens: 10, input_tokens: 10 }),
      usage({ started_at: NOW - MIN, model_id: 'b', computed_total_tokens: 900, input_tokens: 900 }),
      usage({ started_at: NOW - MIN, model_id: 'b', agent: 'zcode-forge', computed_total_tokens: 900, input_tokens: 900 }),
    ], { now: NOW, windowMs: 3 * DAY });
    assert.deepEqual(report.byDay.map((d) => d.day), ['2026-11-02', '2026-11-04']);
    assert.equal(report.byModel[0].model, 'b');
    assert.equal(report.byModel[0].requests, 2);
    assert.equal(report.byModel[0].totalTokens, 1800);
    assert.equal(report.byAgent[0].agent, 'zcode-agent');
    assert.equal(report.byAgent.find((a) => a.agent === 'zcode-forge').requests, 1);
  });

  test('falls back to input+output when computed_total is absent', () => {
    const report = census([usage({ computed_total_tokens: null, input_tokens: 100, output_tokens: 20 })], { now: NOW, windowMs: 3 * DAY });
    assert.equal(report.totalTokens, 120);
  });

  test('an empty window is zero, not NaN', () => {
    const report = census([], { now: NOW, windowMs: 3 * DAY });
    assert.equal(report.requests, 0);
    assert.equal(report.cacheHitRatio, 0);
    assert.equal(report.avgInputPerRequest, 0);
  });
});

describe('sessionContexts', () => {
  test('uses the most recent request as the context size', () => {
    const rows = [
      usage({ started_at: NOW - 10 * MIN, input_tokens: 20000 }),
      usage({ started_at: NOW - MIN, input_tokens: 250000 }),
    ];
    const [ctx] = sessionContexts([session('sess_a')], rows, { now: NOW });
    assert.equal(ctx.contextTokens, 250000);
    assert.equal(ctx.idleMs, MIN);
    assert.equal(ctx.turns, 1);
    assert.equal(ctx.hasUsage, true);
  });

  test('labels child sessions and counts distinct turns', () => {
    const rows = [
      usage({ turn_id: 't1', started_at: NOW - 5 * MIN }),
      usage({ turn_id: 't2', started_at: NOW - 4 * MIN }),
      usage({ turn_id: 't2', started_at: NOW - 3 * MIN }),
    ];
    const ctx = sessionContexts([session('sess_a', { parent_id: 'sess_root' })], rows, { now: NOW })[0];
    assert.equal(ctx.kind, 'child');
    assert.equal(ctx.parentId, 'sess_root');
    assert.equal(ctx.turns, 2);
  });

  test('a session with no usage reports no usage rather than zero context', () => {
    const [ctx] = sessionContexts([session('sess_quiet')], [], { now: NOW });
    assert.equal(ctx.hasUsage, false);
    assert.equal(ctx.contextTokens, 0);
  });
});

describe('resolveCeiling', () => {
  test('derives the ceiling from a 1M window at 80% by default', () => {
    const r = resolveCeiling();
    assert.equal(r.window, DEFAULT_WINDOW_TOKENS);
    assert.equal(r.utilization, DEFAULT_UTILIZATION);
    assert.equal(r.ceiling, 800000);
    assert.equal(r.source, 'window');
  });

  test('an explicit ceiling wins and is labelled as a budget', () => {
    const r = resolveCeiling({ ceiling: 150000, window: 1000000, utilization: 0.8 });
    assert.equal(r.ceiling, 150000);
    assert.equal(r.source, 'explicit');
  });

  test('a smaller window lowers the ceiling', () => {
    assert.equal(resolveCeiling({ window: 200000, utilization: 0.5 }).ceiling, 100000);
  });

  test('out-of-range utilisation falls back instead of producing nonsense', () => {
    assert.equal(resolveCeiling({ utilization: 0 }).ceiling, 800000);
    assert.equal(resolveCeiling({ utilization: 2 }).ceiling, 800000);
    assert.equal(resolveCeiling({ window: -1 }).ceiling, 800000);
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
    assert.equal(p.schema, COMPACTION_PLAN_SCHEMA);
    assert.equal(p.compact.length, 1);
    assert.equal(p.compact[0].sessionId, 'sess_hot');
    assert.ok(p.compact[0].reason.includes('400000'));
    assert.equal(p.overCeiling, 1);
  });

  test('derives the ceiling from the model window when none is given', () => {
    const p = planCompactions({
      sessions: [session('sess_hot')],
      usageRows: [usage({ session_id: 'sess_hot', input_tokens: 400000, started_at: NOW - 30 * MIN })],
      now: NOW,
      idleMs: 5 * MIN,
    });
    assert.equal(p.ceiling, 800000);
    assert.equal(p.ceilingSource, 'window');
    assert.equal(p.compact.length, 0);
    assert.equal(p.skipped[0].code, SKIP_CODES.BELOW_CEILING);
  });

  test('a context exactly at the ceiling is not selected', () => {
    const p = plan({ usageRows: [usage({ session_id: 'sess_hot', input_tokens: 150000, started_at: NOW - 30 * MIN })] });
    assert.equal(p.compact.length, 0);
    assert.equal(p.skipped[0].code, SKIP_CODES.BELOW_CEILING);
  });

  test('a session that just made a request is still running', () => {
    const p = plan({ usageRows: [usage({ session_id: 'sess_hot', input_tokens: 400000, started_at: NOW - MIN })] });
    assert.equal(p.compact.length, 0);
    assert.equal(p.skipped[0].code, SKIP_CODES.RUNNING);
    assert.equal(p.overCeiling, 1);
  });

  test('a session already compacting is skipped', () => {
    const p = plan({ sessions: [session('sess_hot', { time_compacting: NOW - MIN })] });
    assert.equal(p.skipped[0].code, SKIP_CODES.ALREADY_COMPACTING);
  });

  test('a session with no usage is skipped', () => {
    const p = plan({ usageRows: [] });
    assert.equal(p.skipped[0].code, SKIP_CODES.NO_USAGE);
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
    assert.deepEqual(p.compact.map((c) => c.sessionId), ['sess_big', 'sess_mid', 'sess_small']);
  });
});

describe('rendering', () => {
  test('formatTokens uses magnitudes', () => {
    assert.equal(formatTokens(999), '999');
    assert.equal(formatTokens(1500), '1.5k');
    assert.equal(formatTokens(1866300000), '1.87B');
  });

  test('the rendered report names the plan and the skip counts', () => {
    const rows = [usage({ session_id: 'sess_hot', input_tokens: 400000, started_at: NOW - 30 * MIN })];
    const report = census(rows, { now: NOW, windowMs: 3 * DAY });
    const p = planCompactions({ sessions: [session('sess_hot')], usageRows: rows, now: NOW, ceiling: 150000, idleMs: 5 * MIN });
    const text = renderContextBudget(report, p);
    assert.ok(text.includes('Context budget — 3d window'));
    assert.ok(text.includes('COMPACT sess_hot'));
    assert.ok(text.includes('ceiling 150.0k'));
  });
});
