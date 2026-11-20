# File: hq/lib/context-budget.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/context-budget.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13396 B |
| Lines | 319 |
| Hash | 2486d3307627 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CONTEXT_BUDGET_SCHEMA | const | 10 | yes | export const CONTEXT_BUDGET_SCHEMA = &#39;hq.context-budget/1&#39;; |
| COMPACTION_PLAN_SCHEMA | const | 11 | yes | export const COMPACTION_PLAN_SCHEMA = &#39;hq.compaction-plan/1&#39;; |
| DEFAULT_WINDOW_TOKENS | const | 19 | yes | export const DEFAULT_WINDOW_TOKENS = 1000000; |
| DEFAULT_UTILIZATION | const | 20 | yes | export const DEFAULT_UTILIZATION = 0.8; |
| DAY_MS | const | 22 | no | const DAY_MS = 86400000; |
| num | function | 23 | no | const num = (v) =&gt; (Number.isFinite(v) ? v : 0); |
| resolveCeiling | function | 26 | yes | export function resolveCeiling(input = {}) { |
| window | const | 27 | no | const window = Number.isFinite(input.window) &amp;&amp; input.window &gt; 0 ? input.window : DEFAULT_WINDOW_TOKENS; |
| utilization | const | 28 | no | const utilization = Number.isFinite(input.utilization) &amp;&amp; input.utilization &gt; 0 &amp;&amp; input.utilization &lt;= 1 |
| explicit | const | 31 | no | const explicit = Number.isFinite(input.ceiling) &amp;&amp; input.ceiling &gt; 0 ? input.ceiling : null; |
| inWindow | function | 41 | no | function inWindow(rows, now, windowMs) { |
| floor | const | 42 | no | const floor = now - windowMs; |
| rowTotal | function | 48 | no | function rowTotal(row) { |
| computed | const | 49 | no | const computed = num(row.computed_total_tokens); |
| dayOf | function | 53 | no | function dayOf(ms) { |
| bump | function | 57 | no | function bump(map, key, seed) { |
| rec | variable | 58 | no | let rec = map.get(key); |
| census | function | 71 | yes | export function census(usageRows, opts = {}) { |
| now | const | 72 | no | const now = Number.isFinite(opts.now) ? opts.now : 0; |
| windowMs | const | 73 | no | const windowMs = Number.isFinite(opts.windowMs) ? opts.windowMs : 3 * DAY_MS; |
| rows | const | 74 | no | const rows = inWindow(usageRows, now, windowMs); |
| byDay | const | 76 | no | const byDay = new Map(); |
| byModel | const | 77 | no | const byModel = new Map(); |
| byAgent | const | 78 | no | const byAgent = new Map(); |
| sessions | const | 79 | no | const sessions = new Set(); |
| inputTokens | variable | 80 | no | let inputTokens = 0; |
| outputTokens | variable | 81 | no | let outputTokens = 0; |
| reasoningTokens | variable | 82 | no | let reasoningTokens = 0; |
| cacheReadTokens | variable | 83 | no | let cacheReadTokens = 0; |
| cacheCreationTokens | variable | 84 | no | let cacheCreationTokens = 0; |
| totalTokens | variable | 85 | no | let totalTokens = 0; |
| nonCompleted | variable | 86 | no | let nonCompleted = 0; |
| retries | variable | 87 | no | let retries = 0; |
| total | const | 90 | no | const total = rowTotal(row); |
| input | const | 91 | no | const input = num(row.input_tokens); |
| output | const | 92 | no | const output = num(row.output_tokens); |
| reasoning | const | 93 | no | const reasoning = num(row.reasoning_tokens); |
| cacheRead | const | 94 | no | const cacheRead = num(row.cache_read_input_tokens); |
| cacheCreation | const | 95 | no | const cacheCreation = num(row.cache_creation_input_tokens); |
| day | const | 107 | no | const day = dayOf(row.started_at); |
| d | const | 108 | no | const d = bump(byDay, day, () =&gt; ({ day, requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 })); |
| modelKey | const | 111 | no | const modelKey = `${row.provider_id ?? &#39;?&#39;}/${row.model_id ?? &#39;?&#39;}`; |
| m | const | 112 | no | const m = bump(byModel, modelKey, () =&gt; ({ key: modelKey, provider: String(row.provider_id ?? &#39;?&#39;), model: String(row.model_id ?? &#39;?&#39;), requests: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: … |
| agentKey | const | 115 | no | const agentKey = String(row.agent ?? &#39;(none)&#39;); |
| a | const | 116 | no | const a = bump(byAgent, agentKey, () =&gt; ({ agent: agentKey, requests: 0, inputTokens: 0, totalTokens: 0 })); |
| freshInput | const | 120 | no | const freshInput = Math.max(0, inputTokens - cacheReadTokens); |
| sessionContexts | function | 152 | yes | export function sessionContexts(sessions, usageRows, opts = {}) { |
| now | const | 153 | no | const now = Number.isFinite(opts.now) ? opts.now : 0; |
| latest | const | 154 | no | const latest = new Map(); |
| turns | const | 155 | no | const turns = new Map(); |
| id | const | 159 | no | const id = row.session_id; |
| prev | const | 160 | no | const prev = latest.get(id); |
| set | variable | 163 | no | let set = turns.get(id); |
| out | const | 169 | no | const out = []; |
| last | const | 172 | no | const last = latest.get(s.id) ?? null; |
| lastAt | const | 173 | no | const lastAt = last ? last.started_at : (Number.isFinite(s.time_updated) ? s.time_updated : null); |
| SKIP_CODES | const | 191 | yes | export const SKIP_CODES = Object.freeze({ NO_USAGE: &#39;no_usage&#39;, RUNNING: &#39;running&#39;, ALREADY_COMPACTING: &#39;already_compacting&#39;, BELOW_CEILING: &#39;below_ceiling&#39;, |
| planCompactions | function | 206 | yes | export function planCompactions(input = {}) { |
| now | const | 207 | no | const now = Number.isFinite(input.now) ? input.now : 0; |
| ceilingInfo | const | 208 | no | const ceilingInfo = resolveCeiling({ ceiling: input.ceiling, window: input.window, utilization: input.utilization }); |
| ceiling | const | 209 | no | const ceiling = ceilingInfo.ceiling; |
| idleThreshold | const | 210 | no | const idleThreshold = Number.isFinite(input.idleMs) ? input.idleMs : 300000; |
| contexts | const | 212 | no | const contexts = sessionContexts(input.sessions, input.usageRows, { now }); |
| compact | const | 213 | no | const compact = []; |
| skipped | const | 214 | no | const skipped = []; |
| counts | const | 234 | no | const counts = {}; |
| formatTokens | function | 253 | yes | export function formatTokens(value) { |
| n | const | 254 | no | const n = num(value); |
| duration | function | 261 | no | function duration(ms) { |
| min | const | 263 | no | const min = Math.round(ms / 60000); |
| hr | const | 265 | no | const hr = Math.floor(min / 60); |
| renderContextBudget | function | 277 | yes | export function renderContextBudget(report, plan, opts = {}) { |
| top | const | 278 | no | const top = Number.isFinite(opts.top) ? opts.top : 6; |
| days | const | 279 | no | const days = Math.round((report.windowMs ?? 0) / DAY_MS); |
| lines | const | 280 | no | const lines = [ |
| share | const | 293 | no | const share = report.totalTokens &gt; 0 ? ((m.totalTokens / report.totalTokens) * 100).toFixed(0) : &#39;0&#39;; |
| derived | const | 304 | no | const derived = plan.ceilingSource === &#39;window&#39; |
| counts | const | 316 | no | const counts = Object.entries(plan.skippedCounts).map(([k, v]) =&gt; `${k} ${v}`).join(&#39; · &#39;); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-093-retrieval-latency-staleness.mjs](../aii/fixtures/HQ-093-retrieval-latency-staleness.mjs.md) | ../../lib/context-budget.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/context-budget.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Per-session context census and compaction planner over ZCode usage rows: names the token-cost driver (context size per request) and the sessions over a ceiling. |
| 3 | owner | agent-platform-ceo | — | agent-platform-ceo |
| 4 | task | — | — | token-budget |
| 5 | invariant | — | — | pure: no I/O, no clock read, no console; every selection is explained by a stable code. |
| 6 | why | — | — | measured 2026-11-04: 1.866B input tokens in 3 days, 53% of them in requests carrying &gt;250k context, and 0 of 1,278 sessions ever compacted. |
| 7 | see | — | hq/bin/hq.mjs | hq/bin/hq.mjs |

## Excerpt

```javascript
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
```

_First 80 of 320 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
