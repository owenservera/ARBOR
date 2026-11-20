# File: hq/lib/model-budget.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/model-budget.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 15829 B |
| Lines | 381 |
| Hash | a3ed60db1cff |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CAP_RE | const | 10 | no | const CAP_RE = /rate[ _-]?limit\|usage_limit\|cooling down\|daily[ _-]?cap\|quota\|free-models-per-day\|token plan usage limit\|usage limit reached\|\\(2056\\)/i; |
| BUDGET_RE | const | 11 | no | const BUDGET_RE = /insufficient[\\s_-]*balance\|status=402\|payment required\|auth_failed\|authentication failed\|purchase credits\|upgrade your token plan/i; |
| SHAPE_RE | const | 12 | no | const SHAPE_RE = /unsupported parameter\|invalid_request\|validation:/i; |
| AUTH_RE | const | 13 | no | const AUTH_RE = /auth_failed\|authentication failed/i; |
| DEFAULT_WINDOW_MS | const | 15 | no | const DEFAULT_WINDOW_MS = 5 * 60 * 60 * 1000; |
| MIN_RELIABILITY | const | 16 | no | const MIN_RELIABILITY = 0.5; |
| errorGroup | function | 46 | no | function errorGroup(row) { |
| aggregateUsage | function | 64 | no | function aggregateUsage(usageRows, now, windowMs) { |
| floor | const | 65 | no | const floor = now - windowMs; |
| stats | const | 67 | no | const stats = new Map(); |
| key | const | 70 | no | const key = `${String(row.provider_id)}/${String(row.model_id)}`; |
| rec | variable | 71 | no | let rec = stats.get(key); |
| group | const | 84 | no | const group = rec.errors.find((e) =&gt; e.errorType === row.error_type &amp;&amp; e.errorCode === row.error_code &amp;&amp; e.errorMessage === row.error_message); |
| indexCatalog | function | 97 | no | function indexCatalog(catalog) { |
| index | const | 99 | no | const index = new Map(); |
| sources | const | 100 | no | const sources = catalog &amp;&amp; catalog.sources ? catalog.sources : {}; |
| id | const | 104 | no | const id = String(row.id); |
| base | const | 106 | no | const base = id.split(&#39;/&#39;).pop(); |
| lookupCatalog | function | 119 | no | function lookupCatalog(index, modelId) { |
| classifyHealth | function | 129 | no | function classifyHealth(stats) { |
| s | const | 130 | no | const s = stats \|\| {}; |
| completed | const | 131 | no | const completed = Number(s.completed) \|\| 0; |
| error | const | 132 | no | const error = Number(s.error) \|\| 0; |
| total | const | 133 | no | const total = Number(s.total) \|\| 0; |
| errors | const | 134 | no | const errors = Array.isArray(s.errors) ? s.errors : []; |
| reliability | const | 135 | no | const reliability = completed + error &gt; 0 ? completed / (completed + error) : 0; |
| blob | const | 136 | no | const blob = errors.map((e) =&gt; `${e.errorType \|\| &#39;&#39;} ${e.errorCode \|\| &#39;&#39;} ${e.errorMessage \|\| &#39;&#39;}`).join(&#39; \\n &#39;); |
| planCredit | const | 141 | no | const planCredit = /token plan usage limit\|usage limit reached\|\\(2056\\)\|(?:^\|\\D)2056(?:\\D\|$)\|purchase credits\|upgrade your token plan/i.test(blob); |
| isBudget | const | 142 | no | const isBudget = BUDGET_RE.test(blob) \|\| planCredit; |
| shapeErrors | const | 153 | no | const shapeErrors = errors.filter((e) =&gt; SHAPE_RE.test(`${e.errorType} ${e.errorCode} ${e.errorMessage}`)).reduce((sum, e) =&gt; sum + e.count, 0); |
| isFreeRow | function | 171 | no | function isFreeRow(row) { |
| priceIn | const | 174 | no | const priceIn = Number(row.priceIn); |
| priceOut | const | 175 | no | const priceOut = Number(row.priceOut); |
| budgetStatusFromUsage | function | 190 | yes | export function budgetStatusFromUsage(usageRows, providerConfig, opts = {}) { |
| now | const | 191 | no | const now = Number(opts.now) \|\| Date.now(); |
| windowMs | const | 192 | no | const windowMs = Number.isFinite(opts.windowMs) ? opts.windowMs : DEFAULT_WINDOW_MS; |
| catalogIndex | const | 193 | no | const catalogIndex = indexCatalog(opts.catalog); |
| rules | const | 195 | no | const rules = new Map(); |
| stats | const | 200 | no | const stats = aggregateUsage(usageRows, now, windowMs); |
| out | const | 203 | no | const out = new Map(); |
| consider | function | 205 | no | const consider = (providerId, modelId) =&gt; { |
| key | const | 206 | no | const key = `${String(providerId)}/${String(modelId)}`; |
| rule | const | 208 | no | const rule = rules.get(String(providerId)); |
| providerEnabled | const | 209 | no | const providerEnabled = rule ? rule.enabled === true : false; |
| personalIds | const | 210 | no | const personalIds = rule ? (rule.config &amp;&amp; Array.isArray(rule.config.personalModelIds) ? rule.config.personalModelIds : []) : []; |
| modelOrder | const | 211 | no | const modelOrder = rule ? (rule.config &amp;&amp; Array.isArray(rule.config.modelOrder) ? rule.config.modelOrder : []) : []; |
| modelListed | const | 212 | no | const modelListed = personalIds.includes(String(modelId)) \|\| modelOrder.includes(String(modelId)); |
| stat | const | 214 | no | const stat = stats.get(key); |
| row | const | 215 | no | const row = lookupCatalog(catalogIndex, String(modelId)); |
| isFree | const | 216 | no | const isFree = isFreeRow(row); |
| priceIn | const | 217 | no | const priceIn = row ? Number(row.priceIn) : 0; |
| priceOut | const | 218 | no | const priceOut = row ? Number(row.priceOut) : 0; |
| health | const | 220 | no | const health = classifyHealth(stat); |
| hasAuthFailed | const | 221 | no | const hasAuthFailed = stat &amp;&amp; stat.errors.some((e) =&gt; AUTH_RE.test(`${e.errorType \|\| &#39;&#39;} ${e.errorMessage \|\| &#39;&#39;}`)); |
| budgetState | variable | 223 | no | let budgetState; |
| reasons | const | 224 | no | const reasons = []; |
| listed | const | 289 | no | const listed = [ |
| completedOrZero | function | 299 | no | function completedOrZero(stat) { |
| isBudgetBlocked | function | 309 | yes | export function isBudgetBlocked(key, budgetStatusMap) { |
| entry | const | 310 | no | const entry = budgetStatusMap &amp;&amp; budgetStatusMap.get(String(key)); |
| summarizeBudget | function | 320 | yes | export function summarizeBudget(budgetStatusMap) { |
| summary | const | 321 | no | const summary = { total: 0, funded: 0, warn: 0, blocked: 0, unverified: 0, blockedKeys: [], warnKeys: [] }; |
| renderBudgetTable | function | 339 | yes | export function renderBudgetTable(budgetStatusMap, opts = {}) { |
| lines | const | 340 | no | const lines = []; |
| showReasons | const | 341 | no | const showReasons = opts.showReasons !== false; |
| maxReason | const | 342 | no | const maxReason = Number.isFinite(opts.maxReasonLen) ? opts.maxReasonLen : 60; |
| entries | const | 353 | no | const entries = Array.from(budgetStatusMap.values()).sort((a, b) =&gt; { const order = { blocked: 0, warn: 1, unverified: 2, funded: 3 }; const oa = order[a.budgetState] ?? 9; const ob = order[b.budgetS… |
| order | const | 354 | no | const order = { blocked: 0, warn: 1, unverified: 2, funded: 3 }; |
| oa | const | 355 | no | const oa = order[a.budgetState] ?? 9; |
| ob | const | 356 | no | const ob = order[b.budgetState] ?? 9; |
| key | const | 361 | no | const key = String(e.key).padEnd(29).slice(0, 29); |
| en | const | 362 | no | const en = e.providerEnabled ? &#39;yes &#39; : &#39;no &#39;; |
| lst | const | 363 | no | const lst = e.modelListed ? &#39;yes &#39; : &#39;no &#39;; |
| free | const | 364 | no | const free = e.isFree ? &#39;yes &#39; : &#39;no &#39;; |
| completed | const | 365 | no | const completed = String(e.completed).padStart(3); |
| error | const | 366 | no | const error = String(e.error).padStart(5); |
| total | const | 367 | no | const total = String(e.total).padStart(5); |
| state | const | 368 | no | const state = String(e.budgetState).padEnd(8); |
| reason | variable | 369 | no | let reason = &#39;&#39;; |
| summary | const | 377 | no | const summary = summarizeBudget(budgetStatusMap); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/console.mjs](../bin/console.mjs.md) | ../lib/model-budget.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/model-budget.mjs |
| [hq/lib/model-inventory.mjs](./model-inventory.mjs.md) | ./model-budget.mjs |
| [hq/lib/model-router.mjs](./model-router.mjs.md) | ./model-budget.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Automated model budget tracking: per-provider/model budget status computed from usage + provider config, for smart routing that never sends to a dead model. |
| 3 | owner | hq-agent | — | hq-agent |
| 4 | task | — | — | model-budget |
| 5 | invariant | — | — | this module decides and explains; it never mutates a config, an agent file or a provider. Pure in-memory; no console.log; never prints an API key. |
| 6 | see | — | hq/lib/model-router.mjs | hq/lib/model-router.mjs |

## Excerpt

```javascript
/**
 * @hq:context Automated model budget tracking: per-provider/model budget status computed from usage + provider config, for smart routing that never sends to a dead model.
 * @hq:owner hq-agent
 * @hq:task model-budget
 * @hq:invariant this module decides and explains; it never mutates a config, an agent file or a provider. Pure in-memory; no console.log; never prints an API key.
 * @hq:see hq/lib/model-router.mjs
 */

/** Budget/reasoning regexes mirrored from the router's classifyHealth so this module stays self-contained. */
const CAP_RE = /rate[ _-]?limit|usage_limit|cooling down|daily[ _-]?cap|quota|free-models-per-day|token plan usage limit|usage limit reached|\(2056\)/i;
const BUDGET_RE = /insufficient[\s_-]*balance|status=402|payment required|auth_failed|authentication failed|purchase credits|upgrade your token plan/i;
const SHAPE_RE = /unsupported parameter|invalid_request|validation:/i;
const AUTH_RE = /auth_failed|authentication failed/i;

const DEFAULT_WINDOW_MS = 5 * 60 * 60 * 1000;
const MIN_RELIABILITY = 0.5;

/** @typedef {Object} BudgetStatus
 * @property {string} key             "provider/model"
 * @property {string} provider
 * @property {string} model
 * @property {boolean} providerEnabled
 * @property {boolean} modelListed
 * @property {boolean} isFree
 * @property {number} priceInPerMillion
 * @property {number} priceOutPerMillion
 * @property {number} completed
 * @property {number} error
 * @property {number} cancelled
 * @property {number} total
 * @property {string} [lastError]
 * @property {'funded'|'warn'|'blocked'|'unverified'} budgetState
 * @property {string[]} reasons
 */

/** @typedef {Object} CatalogRow
 * @property {string} id
 * @property {number} [priceIn]
 * @property {number} [priceOut]
 * @property {boolean} [free]
 */

/**
 * Coerce a raw usage row's error fields into a normalized error group.
 */
function errorGroup(row) {
  return {
    errorType: row.error_type ?? 'unknown',
    errorCode: row.error_code ?? null,
    errorMessage: row.error_message ?? '',
    count: 1,
  };
}

/**
 * Aggregate usage rows within a time window into one stats record per `provider/model` key.
 * Mirrors the router's summarizeUsage windowing so budget and health agree on what "recent" means.
 *
 * @param {Array<Object>} usageRows
 * @param {number} now
 * @param {number} windowMs
 * @returns {Map<string, Object>}
 */
function aggregateUsage(usageRows, now, windowMs) {
  const floor = now - windowMs;
  /** @type {Map<string, Object>} */
  const stats = new Map();
  for (const row of Array.isArray(usageRows) ? usageRows : []) {
    if (!row || typeof row.started_at !== 'number' || row.started_at < floor) continue;
    const key = `${String(row.provider_id)}/${String(row.model_id)}`;
    let rec = stats.get(key);
    if (!rec) {
      rec = { key, provider: String(row.provider_id), model: String(row.model_id), completed: 0, error: 0, cancelled: 0, total: 0, errors: [], lastError: undefined };
      stats.set(key, rec);
    }
    rec.total += 1;
    if (row.status === 'completed') {
      rec.completed += 1;
    } else if (row.status === 'cancelled') {
      rec.cancelled += 1;
```

_First 80 of 382 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
