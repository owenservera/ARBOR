# File: hq/test/context-budget.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/context-budget.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10037 B |
| Lines | 247 |
| Hash | 68672a5f5c53 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NOW | const | 22 | no | const NOW = Date.UTC(2026, 10, 4, 12, 0, 0); |
| MIN | const | 23 | no | const MIN = 60 * 1000; |
| DAY | const | 24 | no | const DAY = 24 * 60 * MIN; |
| usage | function | 27 | no | function usage(over = {}) { |
| session | function | 47 | no | function session(id, over = {}) { |
| report | const | 53 | no | const report = census([usage(), usage({ input_tokens: 50000, cache_read_input_tokens: 40000, output_tokens: 500, computed_total_tokens: 50500 })], { now: NOW, windowMs: 3 * DAY }); |
| report | const | 66 | no | const report = census([usage(), usage({ started_at: NOW - 4 * DAY })], { now: NOW, windowMs: 3 * DAY }); |
| report | const | 72 | no | const report = census([usage({ status: &#39;error&#39;, retry_count: 2 }), usage({ status: &#39;cancelled&#39; })], { now: NOW, windowMs: 3 * DAY }); |
| report | const | 78 | no | const report = census([ usage({ started_at: NOW - 2 * DAY, model_id: &#39;a&#39;, computed_total_tokens: 10, input_tokens: 10 }), usage({ started_at: NOW - MIN, model_id: &#39;b&#39;, computed_total_tokens: 900, inp… |
| report | const | 92 | no | const report = census([usage({ computed_total_tokens: null, input_tokens: 100, output_tokens: 20 })], { now: NOW, windowMs: 3 * DAY }); |
| report | const | 97 | no | const report = census([], { now: NOW, windowMs: 3 * DAY }); |
| rows | const | 106 | no | const rows = [ |
| rows | const | 118 | no | const rows = [ |
| ctx | const | 123 | no | const ctx = sessionContexts([session(&#39;sess_a&#39;, { parent_id: &#39;sess_root&#39; })], rows, { now: NOW })[0]; |
| r | const | 138 | no | const r = resolveCeiling(); |
| r | const | 146 | no | const r = resolveCeiling({ ceiling: 150000, window: 1000000, utilization: 0.8 }); |
| plan | function | 163 | no | const plan = (over = {}) =&gt; planCompactions({ sessions: [session(&#39;sess_hot&#39;)], usageRows: [usage({ session_id: &#39;sess_hot&#39;, input_tokens: 400000, started_at: NOW - 30 * MIN })], now: NOW, ceiling: 150… |
| p | const | 173 | no | const p = plan(); |
| p | const | 182 | no | const p = planCompactions({ sessions: [session(&#39;sess_hot&#39;)], usageRows: [usage({ session_id: &#39;sess_hot&#39;, input_tokens: 400000, started_at: NOW - 30 * MIN })], now: NOW, idleMs: 5 * MIN, |
| p | const | 195 | no | const p = plan({ usageRows: [usage({ session_id: &#39;sess_hot&#39;, input_tokens: 150000, started_at: NOW - 30 * MIN })] }); |
| p | const | 201 | no | const p = plan({ usageRows: [usage({ session_id: &#39;sess_hot&#39;, input_tokens: 400000, started_at: NOW - MIN })] }); |
| p | const | 208 | no | const p = plan({ sessions: [session(&#39;sess_hot&#39;, { time_compacting: NOW - MIN })] }); |
| p | const | 213 | no | const p = plan({ usageRows: [] }); |
| p | const | 218 | no | const p = planCompactions({ sessions: [session(&#39;sess_small&#39;), session(&#39;sess_big&#39;), session(&#39;sess_mid&#39;)], usageRows: [ usage({ session_id: &#39;sess_small&#39;, input_tokens: 160000, started_at: NOW - 30 * MI… |
| rows | const | 239 | no | const rows = [usage({ session_id: &#39;sess_hot&#39;, input_tokens: 400000, started_at: NOW - 30 * MIN })]; |
| report | const | 240 | no | const report = census(rows, { now: NOW, windowMs: 3 * DAY }); |
| p | const | 241 | no | const p = planCompactions({ sessions: [session(&#39;sess_hot&#39;)], usageRows: rows, now: NOW, ceiling: 150000, idleMs: 5 * MIN }); |
| text | const | 242 | no | const text = renderContextBudget(report, p); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 7 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Context budget tests: pure row fixtures only. No sqlite, no ZCode database, no file reads. |
| 3 | owner | agent-platform-ceo | — | agent-platform-ceo |
| 4 | task | — | — | token-budget |
| 5 | invariant | — | — | every fixture is constructed here; these tests never open db.sqlite or .hq/index.db. |

## Excerpt

```javascript
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
```

_First 80 of 248 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
