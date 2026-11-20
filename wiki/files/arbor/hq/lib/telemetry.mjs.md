# File: hq/lib/telemetry.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/telemetry.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 32903 B |
| Lines | 817 |
| Hash | 8171a655603d |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PERFORMANCE_PROFILES | const | 5 | yes | export const PERFORMANCE_PROFILES = Object.freeze({ speed: { limits: { search: 10, find: 20, contextMaxFiles: 10, contextBudgetTokens: 3500, wikiMaxFilePages: 1500, briefMaxBytes: 3000 }, budgets: { … |
| OPERATIONS | const | 20 | yes | export const OPERATIONS = Object.freeze([ &#39;search&#39;, &#39;find&#39;, &#39;context&#39;, &#39;brief&#39;, &#39;index&#39;, &#39;wiki&#39;, &#39;lint&#39;, &#39;mcp&#39;, &#39;ask&#39;, &#39;verify&#39;, &#39;watch&#39;, &#39;hooks&#39;, &#39;doctor&#39;, &#39;check&#39;, &#39;status&#39;, &#39;route&#39;, &#39;handoff&#39;, &#39;si… |
| TUNABLES | const | 25 | no | const TUNABLES = { |
| clone | function | 38 | no | function clone(value) { |
| budgetValue | function | 42 | no | function budgetValue(budget) { |
| taggedMeta | function | 57 | no | function taggedMeta(meta, component) { |
| name | const | 58 | no | const name = component == null ? &#39;&#39; : String(component).trim(); |
| recordTiming | function | 67 | yes | export function recordTiming(db, { operation, project = null, startedAt = nowISO(), durationMs, ok = true, bytes = 0, tokens = 0, meta = null, component = null, }) { |
| duration | const | 72 | no | const duration = Number(durationMs); |
| tagged | const | 74 | no | const tagged = taggedMeta(meta, component); |
| startSpan | function | 85 | yes | export function startSpan(db, { operation, project = null, meta = null, component = null } = {}) { |
| startedAt | const | 86 | no | const startedAt = nowISO(); |
| start | const | 87 | no | const start = performance.now(); |
| ended | variable | 88 | no | let ended = false; |
| durationMs | const | 93 | no | const durationMs = performance.now() - start; |
| named | const | 104 | no | const named = extra.component ?? component; |
| timeSync | function | 112 | yes | export function timeSync(db, context, fn) { |
| span | const | 113 | no | const span = startSpan(db, context); |
| result | const | 115 | no | const result = fn(); |
| timeAsync | function | 124 | yes | export async function timeAsync(db, context, fn) { |
| span | const | 125 | no | const span = startSpan(db, context); |
| result | const | 127 | no | const result = await fn(); |
| percentile | function | 136 | no | function percentile(sorted, p) { |
| index | const | 138 | no | const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1)); |
| round | function | 142 | no | function round(value) { |
| timingReport | function | 146 | yes | export function timingReport(db, { operation = null, since = null, limit = 5000 } = {}) { |
| params | const | 148 | no | const params = []; |
| sql | const | 151 | no | const sql = `SELECT operation, project, started_at, duration_ms, ok, bytes, tokens, meta |
| spans | const | 154 | no | const spans = db.prepare(sql).all(...params, Math.max(1, Number(limit) \|\| 5000)); |
| byOperation | const | 155 | no | const byOperation = new Map(); |
| bucket | const | 157 | no | const bucket = byOperation.get(span.operation) \|\| []; |
| aggregates | const | 161 | no | const aggregates = []; |
| durations | const | 163 | no | const durations = rows.map((r) =&gt; r.duration_ms).sort((a, b) =&gt; a - b); |
| errors | const | 164 | no | const errors = rows.filter((r) =&gt; !r.ok).length; |
| total | const | 165 | no | const total = durations.reduce((sum, n) =&gt; sum + n, 0); |
| totals | const | 180 | no | const totals = { |
| budgetReport | function | 193 | yes | export function budgetReport(db, config, { since = null } = {}) { |
| report | const | 194 | no | const report = timingReport(db, { since, limit: 5000 }); |
| budgets | const | 195 | no | const budgets = config?.performance?.budgets \|\| {}; |
| priorities | const | 196 | no | const priorities = config?.performance?.priorities \|\| {}; |
| rows | const | 197 | no | const rows = []; |
| budget | const | 199 | no | const budget = budgetValue(budgetRaw); |
| aggregate | const | 201 | no | const aggregate = report.aggregates.find((a) =&gt; a.operation === operation) \|\| null; |
| p95 | const | 202 | no | const p95 = aggregate ? aggregate.p95Ms : 0; |
| ratio | const | 203 | no | const ratio = budget &gt; 0 ? p95 / budget : 0; |
| COMPONENT_META_KEY | const | 232 | yes | export const COMPONENT_META_KEY = &#39;component&#39;; |
| spanComponent | function | 241 | yes | export function spanComponent(span) { |
| meta | const | 242 | no | const meta = span?.meta ? safeJsonParse(span.meta, null) : null; |
| name | const | 243 | no | const name = meta &amp;&amp; typeof meta === &#39;object&#39; ? meta[COMPONENT_META_KEY] : null; |
| text | const | 244 | no | const text = typeof name === &#39;string&#39; ? name.trim() : &#39;&#39;; |
| spanStats | function | 252 | no | function spanStats(spans) { |
| durations | const | 253 | no | const durations = spans.map((s) =&gt; Number(s.duration_ms) \|\| 0).sort((a, b) =&gt; a - b); |
| total | const | 254 | no | const total = durations.reduce((sum, n) =&gt; sum + n, 0); |
| componentAttribution | function | 288 | yes | export function componentAttribution(db, config, { operation = null, since = null, baselineSince = null, limit = 5000, |
| params | const | 295 | no | const params = []; |
| rows | const | 298 | no | const rows = db.prepare(` SELECT operation, project, started_at, duration_ms, ok, bytes, tokens, meta FROM timings ${where.length ? &#39;WHERE &#39; + where.join(&#39; AND &#39;) : &#39;&#39;} ORDER BY id ASC LIMIT ? `).all… |
| baselineRows | const | 304 | no | const baselineRows = []; |
| currentRows | const | 305 | no | const currentRows = []; |
| budgetMs | const | 311 | no | const budgetMs = operation ? budgetValue((config?.performance?.budgets \|\| {})[operation]) : null; |
| groups | const | 314 | no | const groups = new Map(); |
| groupOf | function | 315 | no | const groupOf = (name) =&gt; { |
| key | const | 316 | no | const key = name ?? &#39;&#39;; |
| g | variable | 317 | no | let g = groups.get(key); |
| components | const | 324 | no | const components = []; |
| unattributed | variable | 325 | no | let unattributed = { spans: 0, totalMs: 0 }; |
| current | const | 327 | no | const current = spanStats(g.current); |
| baseline | const | 328 | no | const baseline = spanStats(g.baseline); |
| currentTotal | const | 346 | no | const currentTotal = currentRows.length; |
| totalMs | const | 347 | no | const totalMs = components.reduce((sum, c) =&gt; sum + c.currentTotalMs, 0) + unattributed.totalMs; |
| overBudget | const | 353 | no | const overBudget = components.filter((c) =&gt; c.overBudget); |
| grown | const | 354 | no | const grown = components |
| blamed | const | 357 | no | const blamed = overBudget.length ? overBudget : grown; |
| spanDelivered | function | 394 | no | function spanDelivered(span) { |
| meta | const | 397 | no | const meta = span.meta ? safeJsonParse(span.meta, null) : null; |
| wastedConsumption | function | 427 | yes | export function wastedConsumption(db, config, { since = null, limit = 5000 } = {}) { |
| params | const | 429 | no | const params = []; |
| rows | const | 431 | no | const rows = db.prepare(` SELECT operation, project, started_at, duration_ms, ok, bytes, tokens, meta FROM timings ${where.length ? &#39;WHERE &#39; + where.join(&#39; AND &#39;) : &#39;&#39;} ORDER BY id DESC LIMIT ? `).al… |
| budgets | const | 437 | no | const budgets = config?.performance?.budgets \|\| {}; |
| failed | const | 438 | no | const failed = []; |
| noResultEvidence | const | 439 | no | const noResultEvidence = []; |
| failedMs | variable | 440 | no | let failedMs = 0; |
| noResultEvidenceMs | variable | 441 | no | let noResultEvidenceMs = 0; |
| failedTokens | variable | 442 | no | let failedTokens = 0; |
| noResultEvidenceTokens | variable | 443 | no | let noResultEvidenceTokens = 0; |
| deliveredSpans | variable | 444 | no | let deliveredSpans = 0; |
| deliveredMs | variable | 445 | no | let deliveredMs = 0; |
| durationMs | const | 448 | no | const durationMs = Number(row.duration_ms) \|\| 0; |
| tokens | const | 449 | no | const tokens = Number(row.tokens) \|\| 0; |
| base | const | 450 | no | const base = { |
| byOperation | const | 473 | no | const byOperation = new Map(); |
| opOf | function | 474 | no | const opOf = (name) =&gt; { |
| o | variable | 475 | no | let o = byOperation.get(name); |
| operations | const | 483 | no | const operations = [...byOperation.entries()].map(([operation, o]) =&gt; { const stats = spanStats(o.spans); const budgetMs = budgetValue(budgets[operation]); return { operation, |
| stats | const | 484 | no | const stats = spanStats(o.spans); |
| budgetMs | const | 485 | no | const budgetMs = budgetValue(budgets[operation]); |
| wastedMs | const | 502 | no | const wastedMs = failedMs + noResultEvidenceMs; |
| wastefulOperations | const | 503 | no | const wastefulOperations = operations |
| wasted | const | 515 | no | const wasted = [...failed, ...noResultEvidence] |
| getPath | function | 541 | no | function getPath(object, path) { |
| setPath | function | 545 | no | function setPath(object, path, value) { |
| keys | const | 546 | no | const keys = path.split(&#39;.&#39;); |
| cursor | variable | 547 | no | let cursor = object; |
| clampTunable | function | 555 | no | function clampTunable(value, tunable) { |
| currentTunable | function | 559 | no | function currentTunable(config, operation) { |
| tunable | const | 560 | no | const tunable = TUNABLES[operation]; |
| recommendation | function | 565 | no | function recommendation({ operation, action, direction, priority, expectedGain, reason, tradeoff, patchPath, patchValue, safeToApply = true }) { |
| id | const | 566 | no | const id = `${operation}:${action}`; |
| optimize | function | 578 | yes | export function optimize(db, config, { since = null } = {}) { |
| budgets | const | 579 | no | const budgets = budgetReport(db, config, { since }); |
| weights | const | 580 | no | const weights = config?.performance?.weights \|\| { speed: 1, quality: 1 }; |
| speedWeight | const | 581 | no | const speedWeight = Number(weights.speed \|\| 0); |
| qualityWeight | const | 582 | no | const qualityWeight = Number(weights.quality \|\| 0); |
| recommendations | const | 583 | no | const recommendations = []; |
| tunable | const | 586 | no | const tunable = TUNABLES[row.operation]; |
| current | const | 601 | no | const current = Number(currentTunable(config, row.operation)); |
| weightSum | const | 604 | no | const weightSum = Math.max(1e-9, speedWeight + qualityWeight); |
| next | const | 607 | no | const next = clampTunable(current * 0.7, tunable); |
| next | const | 634 | no | const next = clampTunable(current * 1.3, tunable); |
| sameResource | const | 668 | no | const sameResource = rec.resource &amp;&amp; rec.resource === other.resource; |
| sameOperation | const | 669 | no | const sameOperation = rec.operation === other.operation; |
| opposite | const | 670 | no | const opposite = rec.direction !== other.direction |
| conflicts | const | 677 | no | const conflicts = []; |
| a | const | 680 | no | const a = recommendations[i]; |
| b | const | 681 | no | const b = recommendations[j]; |
| sameResource | const | 682 | no | const sameResource = a.resource &amp;&amp; a.resource === b.resource; |
| sameOperation | const | 683 | no | const sameOperation = a.operation === b.operation; |
| opposite | const | 684 | no | const opposite = a.direction !== b.direction |
| highest | const | 692 | no | const highest = [...budgets.violations].sort((a, b) =&gt; (b.priority - a.priority) \|\| (b.ratio - a.ratio))[0]; |
| nextAction | const | 693 | no | const nextAction = recommendations.length |
| applyPatch | function | 719 | yes | export function applyPatch(config, patch) { |
| applyRecommendations | function | 725 | yes | export function applyRecommendations(config, result, { onlySafe = true } = {}) { |
| next | const | 726 | no | const next = clone(config); |
| applied | const | 727 | no | const applied = []; |
| skippedConflicts | const | 728 | no | const skippedConflicts = []; |
| appliedIds | const | 729 | no | const appliedIds = new Set(); |
| applyProfile | function | 744 | yes | export function applyProfile(config, profileName) { |
| profile | const | 745 | no | const profile = PERFORMANCE_PROFILES[profileName]; |
| next | const | 747 | no | const next = clone(config); |
| setPriority | function | 758 | yes | export function setPriority(config, operation, priority) { |
| next | const | 759 | no | const next = clone(config); |
| setBudget | function | 766 | yes | export function setBudget(config, operation, p95Ms) { |
| next | const | 767 | no | const next = clone(config); |
| profileOptions | function | 774 | yes | export function profileOptions(config, operation) { |
| limits | const | 775 | no | const limits = config?.performance?.limits \|\| {}; |
| budgets | const | 776 | no | const budgets = config?.performance?.budgets \|\| {}; |
| formatTimingReport | function | 790 | yes | export function formatTimingReport(report) { |
| lines | const | 791 | no | const lines = []; |
| formatOptimize | function | 802 | yes | export function formatOptimize(result) { |
| lines | const | 803 | no | const lines = []; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./util.mjs | import | 3 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-089-component-regression.mjs](../aii/fixtures/HQ-089-component-regression.mjs.md) | ../../lib/telemetry.mjs |
| [hq/aii/fixtures/HQ-089-performance-regression-components.mjs](../aii/fixtures/HQ-089-performance-regression-components.mjs.md) | ../../lib/telemetry.mjs |
| [hq/aii/fixtures/HQ-090-redundant-computation.mjs](../aii/fixtures/HQ-090-redundant-computation.mjs.md) | ../../lib/telemetry.mjs |
| [hq/aii/fixtures/HQ-090-redundant-indexing.mjs](../aii/fixtures/HQ-090-redundant-indexing.mjs.md) | ../../lib/telemetry.mjs |
| [hq/aii/fixtures/HQ-091-background-consumption.mjs](../aii/fixtures/HQ-091-background-consumption.mjs.md) | ../../lib/telemetry.mjs |
| [hq/aii/fixtures/HQ-091-background-process-consumption.mjs](../aii/fixtures/HQ-091-background-process-consumption.mjs.md) | ../../lib/telemetry.mjs |
| [hq/aii/fixtures/HQ-093-retrieval-latency-staleness.mjs](../aii/fixtures/HQ-093-retrieval-latency-staleness.mjs.md) | ../../lib/telemetry.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/telemetry.mjs |
| [hq/lib/refresh.mjs](./refresh.mjs.md) | ./telemetry.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 818 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
