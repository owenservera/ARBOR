# File: hq/lib/model-router.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/model-router.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 44122 B |
| Lines | 762 |
| Hash | 570fb2b43cfe |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CAP_RE | const | 20 | no | const CAP_RE = /rate[ _-]?limit\|usage_limit\|cooling down\|daily[ _-]?cap\|quota\|free-models-per-day\|token plan usage limit\|usage limit reached\|\\(2056\\)/i; |
| BUDGET_RE | const | 22 | no | const BUDGET_RE = /insufficient[\\s_-]*balance\|status=402\|payment required\|auth_failed\|authentication failed\|purchase credits\|upgrade your token plan/i; |
| SHAPE_RE | const | 24 | no | const SHAPE_RE = /unsupported parameter\|invalid_request\|validation:/i; |
| REASONING_LEVEL_RE | const | 35 | no | const REASONING_LEVEL_RE = /reasoning[-_ ]?level[-_ ]?not[-_ ]?supported\|reasoning effort[^.]*is not supported\|unsupported reasoning\|不支持所选思考档位/i; |
| CLI_REASONING_LEVELS | const | 44 | yes | export const CLI_REASONING_LEVELS = [&#39;low&#39;, &#39;medium&#39;, &#39;high&#39;]; |
| DEFAULT_POLICY | const | 59 | yes | export const DEFAULT_POLICY = { |
| shouldApply | function | 104 | yes | export function shouldApply(flags = {}) { |
| parseSupportedLevels | function | 116 | yes | export function parseSupportedLevels(message) { |
| text | const | 117 | no | const text = String(message ?? &#39;&#39;); |
| out | const | 118 | no | const out = new Set(); |
| listed | const | 119 | no | const listed = text.match(/supportedLevels[&quot;&#39;]?\\s*[:=]\\s*\\[([^\\]]*)\\]/i); |
| plain | const | 121 | no | const plain = text.match(/supported levels?[:=]\\s*([a-z, ]+)/i); |
| v | const | 123 | no | const v = part.trim().toLowerCase(); |
| REASONING_LEVEL_NAMES | const | 136 | no | const REASONING_LEVEL_NAMES = new Set([&#39;low&#39;, &#39;medium&#39;, &#39;high&#39;, &#39;max&#39;, &#39;minimal&#39;, &#39;off&#39;, &#39;none&#39;, &#39;enabled&#39;, &#39;xhigh&#39;]); |
| parseRejectedLevel | function | 144 | yes | export function parseRejectedLevel(message) { |
| text | const | 145 | no | const text = String(message ?? &#39;&#39;); |
| candidates | const | 146 | no | const candidates = [ |
| value | const | 153 | no | const value = m[1].toLowerCase(); |
| chooseReasoningLevel | function | 168 | yes | export function chooseReasoningLevel(input) { |
| pinned | const | 170 | no | const pinned = policy.reasoningLevels?.[key]; |
| rec | const | 173 | no | const rec = stats instanceof Map ? stats.get(key) : null; |
| rejected | const | 174 | no | const rejected = new Set([...(rec?.rejectedLevels ?? [])]); |
| forbidden | const | 175 | no | const forbidden = new Set((policy.forbiddenLevels ?? []).map((l) =&gt; String(l).toLowerCase())); |
| offered | const | 176 | no | const offered = [...new Set([...(rec?.supportedLevels ?? []), ...declaredLevels].map((l) =&gt; String(l).toLowerCase()))] |
| fallback | const | 181 | no | const fallback = String(policy.reasoningLevel ?? DEFAULT_POLICY.reasoningLevel).toLowerCase(); |
| readDeclaredReasoningLevels | function | 197 | yes | export function readDeclaredReasoningLevels(providerConfig) { |
| out | const | 198 | no | const out = new Map(); |
| rules | const | 199 | no | const rules = providerConfig?.config?.modelConfigRules?.providerModelRules; |
| values | const | 201 | no | const values = rule?.config?.optionSpecs?.reasoningLevel?.values; |
| key | const | 203 | no | const key = `${rule.providerId}/${rule.modelId}`; |
| summarizeUsage | function | 216 | yes | export function summarizeUsage(rows, opts = {}) { |
| now | const | 217 | no | const now = opts.now ?? Date.now(); |
| windowMs | const | 218 | no | const windowMs = opts.windowMs ?? DEFAULT_POLICY.windowMs; |
| floor | const | 219 | no | const floor = now - windowMs; |
| out | const | 221 | no | const out = new Map(); |
| key | const | 224 | no | const key = `${row.provider_id}/${row.model_id}`; |
| rec | variable | 225 | no | let rec = out.get(key); |
| errorType | const | 242 | no | const errorType = row.error_type ?? &#39;unknown&#39;; |
| errorCode | const | 243 | no | const errorCode = row.error_code ?? null; |
| errorMessage | const | 244 | no | const errorMessage = row.error_message ?? &#39;&#39;; |
| refused | const | 250 | no | const refused = parseRejectedLevel(errorMessage); |
| group | variable | 253 | no | let group = rec.errors.find((g) =&gt; g.errorType === errorType &amp;&amp; g.errorCode === errorCode &amp;&amp; g.errorMessage === errorMessage); |
| n | const | 259 | no | const n = rec.completed \|\| 1; |
| classifyHealth | function | 277 | yes | export function classifyHealth(stats) { |
| s | const | 278 | no | const s = stats \|\| {}; |
| completed | const | 279 | no | const completed = Number(s.completed) \|\| 0; |
| error | const | 280 | no | const error = Number(s.error) \|\| 0; |
| cancelled | const | 281 | no | const cancelled = Number(s.cancelled) \|\| 0; |
| total | const | 282 | no | const total = Number(s.total) \|\| 0; |
| errors | const | 283 | no | const errors = Array.isArray(s.errors) ? s.errors : []; |
| reliability | const | 284 | no | const reliability = completed + error &gt; 0 ? completed / (completed + error) : 0; |
| avgLatencyMs | const | 285 | no | const avgLatencyMs = Number(s.avgLatencyMs) \|\| 0; |
| blob | const | 286 | no | const blob = errors.map((e) =&gt; `${e.errorType \|\| &#39;&#39;} ${e.errorCode \|\| &#39;&#39;} ${e.errorMessage \|\| &#39;&#39;}`).join(&#39; \\n &#39;); |
| planCredit | const | 291 | no | const planCredit = /token plan usage limit\|usage limit reached\|\\(2056\\)\|(?:^\|\\D)2056(?:\\D\|$)\|purchase credits\|upgrade your token plan/i.test(blob); |
| recovered | const | 295 | no | const recovered = Boolean(s.lastCompletedAt &amp;&amp; s.lastErrorAt &amp;&amp; s.lastCompletedAt &gt; s.lastErrorAt); |
| shapeErrors | const | 307 | no | const shapeErrors = errors.filter((e) =&gt; SHAPE_RE.test(`${e.errorType} ${e.errorCode} ${e.errorMessage}`)).reduce((sum, e) =&gt; sum + e.count, 0); |
| reasoningErrors | const | 311 | no | const reasoningErrors = errors.filter((e) =&gt; REASONING_LEVEL_RE.test(`${e.errorType} ${e.errorCode} ${e.errorMessage}`)).reduce((sum, e) =&gt; sum + e.count, 0); |
| modelErrors | const | 312 | no | const modelErrors = Math.max(error - reasoningErrors, 0); |
| modelReliability | const | 313 | no | const modelReliability = completed + modelErrors &gt; 0 ? completed / (completed + modelErrors) : reliability; |
| levelNotes | const | 314 | no | const levelNotes = []; |
| rejectedLevels | const | 315 | no | const rejectedLevels = Array.isArray(s.rejectedLevels) ? s.rejectedLevels : []; |
| supportedLevels | const | 316 | no | const supportedLevels = Array.isArray(s.supportedLevels) ? s.supportedLevels : []; |
| scoreCandidate | function | 346 | yes | export function scoreCandidate(input) { |
| contextWindowTokens | const | 348 | no | const contextWindowTokens = Number(input?.contextWindowTokens) \|\| null; |
| reliability | const | 349 | no | const reliability = Math.max(Number(health.reliability) \|\| 0, 0.05); |
| reject | function | 351 | no | const reject = (reason, tier = 9) =&gt; ({ key, eligible: false, reason, tier, score: Infinity, rawCostUsd: 0, effectiveCostUsd: 0 }); |
| floor | const | 361 | no | const floor = Number(policy.minReliability) ?? DEFAULT_POLICY.minReliability; |
| estInput | const | 364 | no | const estInput = Number(task.estInputTokens) \|\| 0; |
| estOutput | const | 365 | no | const estOutput = Number(task.estOutputTokens) \|\| 0; |
| minContext | const | 366 | no | const minContext = Number(task.minContextTokens) \|\| 0; |
| rawCostUsd | const | 370 | no | const rawCostUsd = (estInput * (Number(price.inputPerMillion) \|\| 0) + estOutput * (Number(price.outputPerMillion) \|\| 0)) / 1e6; |
| effectiveCostUsd | const | 375 | no | const effectiveCostUsd = rawCostUsd / reliability; |
| preferred | const | 376 | no | const preferred = Array.isArray(policy.preferredModels) &amp;&amp; policy.preferredModels.includes(key); |
| priceKnown | const | 377 | no | const priceKnown = price.priceKnown !== false; |
| tier | variable | 378 | no | let tier = isFree ? 0 : (priceKnown ? 1 : 2); |
| tierName | variable | 379 | no | let tierName; |
| selector | const | 381 | no | const selector = policy.tieredSelector; |
| evidence | const | 382 | no | const evidence = Object.hasOwn(selector.modelTiers ?? {}, key) ? selector.modelTiers[key] : undefined; |
| verifiedAt | const | 383 | no | const verifiedAt = typeof evidence?.verifiedAt === &#39;number&#39; ? evidence.verifiedAt : Date.parse(evidence?.verifiedAt); |
| maxAge | const | 384 | no | const maxAge = selector.tierMaxAgeMs ?? policy.windowMs ?? DEFAULT_POLICY.windowMs; |
| now | const | 385 | no | const now = Number(policy.now) \|\| Date.now(); |
| allowed | const | 388 | no | const allowed = [&#39;verified-free&#39;, &#39;included-plan&#39;, &#39;funded-metered&#39;, &#39;unknown-quota&#39;]; |
| budgetEntry | const | 391 | no | const budgetEntry = policy.budgetStatus instanceof Map ? policy.budgetStatus.get(key) : undefined; |
| entitlement | const | 393 | no | const entitlement = evidence.planEntitlement; |
| entitlementAt | const | 394 | no | const entitlementAt = typeof entitlement?.verifiedAt === &#39;number&#39; ? entitlement.verifiedAt : Date.parse(entitlement?.verifiedAt); |
| latencyPoints | const | 401 | no | const latencyPoints = (Number(health.avgLatencyMs) \|\| 0) * (policy.latencyWeight ?? 0.05); |
| reliabilityPoints | const | 402 | no | const reliabilityPoints = (1 - reliability) * 1000; |
| score | const | 403 | no | const score = (effectiveCostUsd * 1e6 + latencyPoints + reliabilityPoints) - (preferred ? 1e6 : 0); |
| routeTask | function | 413 | yes | export function routeTask(input) { |
| candidateList | const | 415 | no | const candidateList = Array.isArray(candidates) ? candidates : []; |
| sharedCreditExhausted | const | 416 | no | const sharedCreditExhausted = new Set(policy.creditExhaustedProviders ?? []); |
| scored | const | 425 | no | const scored = candidateList.map((c) =&gt; ({ ...c, scored: sharedCreditExhausted.has(c.provider) ? { key: c.key, eligible: false, reason: `provider ${c.provider} shared credit exhausted`, tier: 9, scor… |
| eligible | const | 436 | no | const eligible = scored.filter((c) =&gt; c.scored.eligible).sort((a, b) =&gt; (a.scored.tier - b.scored.tier) \|\| (a.scored.score - b.scored.score) \|\| a.scored.key.localeCompare(b.scored.key)); |
| rejected | const | 438 | no | const rejected = scored |
| best | const | 451 | no | const best = eligible[0]; |
| label | const | 452 | no | const label = best.scored.tierName ?? (best.isFree ? &#39;free&#39; : &#39;paid&#39;); |
| cost | const | 453 | no | const cost = best.price?.priceKnown === false &amp;&amp; !best.isFree ? &#39;unpriced&#39; : `$${best.scored.effectiveCostUsd.toFixed(4)} per call`; |
| parts | const | 454 | no | const parts = [`${best.key}: ${label}, ${best.health?.state ?? &#39;unknown&#39;}, ${cost}, ${((Number(best.health?.avgLatencyMs) \|\| 0) / 1000).toFixed(1)}s avg`]; |
| cheaperRejected | const | 455 | no | const cheaperRejected = rejected.filter((r) =&gt; !r.eligible &amp;&amp; /cap\|budget\|shape\|pinned/i.test(r.reason)); |
| buildCatalog | function | 471 | yes | export function buildCatalog(input = {}) { |
| depot | const | 472 | no | const depot = input.depotCatalog \|\| null; |
| sources | const | 473 | no | const sources = depot?.sources \|\| {}; |
| priceIndex | const | 475 | no | const priceIndex = new Map(); |
| notePrice | function | 476 | no | const notePrice = (id, row, source) =&gt; { |
| priceIn | const | 478 | no | const priceIn = Number(row.priceIn); |
| priceOut | const | 479 | no | const priceOut = Number(row.priceOut); |
| existing | const | 481 | no | const existing = priceIndex.get(id); |
| candidate | const | 482 | no | const candidate = { |
| catalog | const | 502 | no | const catalog = new Map(); |
| add | function | 503 | no | const add = (key, modelId, source) =&gt; { |
| price | const | 505 | no | const price = priceIndex.get(modelId); |
| inputPerMillion | const | 506 | no | const inputPerMillion = price?.inputPerMillion ?? 0; |
| outputPerMillion | const | 507 | no | const outputPerMillion = price?.outputPerMillion ?? 0; |
| priceKnown | const | 508 | no | const priceKnown = !!price; |
| modelId | const | 527 | no | const modelId = String(key).split(&#39;/&#39;).slice(1).join(&#39;/&#39;); |
| otherRouteKey | function | 545 | no | function otherRouteKey(decision, avoidKey, candidates, health, task, policy) { |
| eligibles | const | 546 | no | const eligibles = candidates.filter((c) =&gt; { const scored = scoreCandidate({ key: c.key, provider: c.provider, model: c.model, isFree: c.isFree, price: c.price, contextWindowTokens: c.contextWindowTo… |
| scored | const | 547 | no | const scored = scoreCandidate({ key: c.key, provider: c.provider, model: c.model, isFree: c.isFree, price: c.price, contextWindowTokens: c.contextWindowTokens, health: c.health, task, policy, }); |
| sa | const | 554 | no | const sa = scoreCandidate({ key: a.key, provider: a.provider, model: a.model, isFree: a.isFree, price: a.price, contextWindowTokens: a.contextWindowTokens, health: a.health, task, policy }); |
| sb | const | 555 | no | const sb = scoreCandidate({ key: b.key, provider: b.provider, model: b.model, isFree: b.isFree, price: b.price, contextWindowTokens: b.contextWindowTokens, health: b.health, task, policy }); |
| planRoutes | function | 568 | yes | export function planRoutes(input) { |
| budgetStatus | const | 570 | no | const budgetStatus = policy.budgetStatus ?? new Map(); |
| stats | const | 571 | no | const stats = input?.usage instanceof Map ? input.usage : summarizeUsage(input?.usage ?? [], { now, windowMs: policy.windowMs }); |
| health | const | 572 | no | const health = new Map(); |
| creditExhaustedProviders | const | 576 | no | const creditExhaustedProviders = new Set(); |
| creditError | const | 583 | no | const creditError = (s.errors ?? []).some((e) =&gt; /token plan usage limit\|usage limit reached\|(?:^\|\\D)2056(?:\\D\|$)\|purchase credits\|upgrade your token plan/i.test(`${e.errorType} ${e.errorCode} ${e.er… |
| routePolicy | const | 586 | no | const routePolicy = { ...policy, now, creditExhaustedProviders }; |
| catalogEntries | const | 587 | no | const catalogEntries = Object.entries(catalog \|\| {}); |
| routes | const | 588 | no | const routes = []; |
| skipped | const | 589 | no | const skipped = []; |
| name | const | 592 | no | const name = agent?.name ?? &#39;(unnamed)&#39;; |
| budgetBlocked | const | 596 | no | const budgetBlocked = policy.respectBudget !== false &amp;&amp; isBudgetBlocked(from, policy.budgetStatus); |
| inherits | const | 603 | no | const inherits = from === &#39;inherit&#39;; |
| currentLevel | const | 609 | no | const currentLevel = String(agent.thoughtLevel ?? &#39;&#39;).toLowerCase() \|\| null; |
| forbiddenLevels | const | 610 | no | const forbiddenLevels = new Set((policy.forbiddenLevels ?? []).map((l) =&gt; String(l).toLowerCase())); |
| observedRejected | const | 611 | no | const observedRejected = Array.isArray(stats.get(from)?.rejectedLevels) ? stats.get(from).rejectedLevels : []; |
| declaredLevels | const | 612 | no | const declaredLevels = policy.declaredLevels instanceof Map ? policy.declaredLevels.get(from) : undefined; |
| levelChoice | const | 613 | no | const levelChoice = chooseReasoningLevel({ key: from, stats, policy, declaredLevels }); |
| levelRejected | const | 614 | no | const levelRejected = Boolean(currentLevel) &amp;&amp; (forbiddenLevels.has(currentLevel) \|\| observedRejected.includes(currentLevel)); |
| agentTask | const | 638 | no | const agentTask = agent.task ?? task ?? DEFAULT_POLICY.task; |
| candidates | const | 639 | no | const candidates = catalogEntries.map(([key, price]) =&gt; { const stat = stats.get(key); return { key, provider: key.split(&#39;/&#39;)[0], model: key.split(&#39;/&#39;).slice(1).join(&#39;/&#39;), isFree: !!price?.isFree, pr… |
| stat | const | 640 | no | const stat = stats.get(key); |
| decision | const | 648 | no | const decision = routeTask({ task: agentTask, policy: routePolicy, candidates }); |
| current | const | 649 | no | const current = candidates.find((c) =&gt; c.key === from); |
| currentScored | const | 650 | no | const currentScored = inherits |
| currentProviderCreditExhausted | const | 658 | no | const currentProviderCreditExhausted = current &amp;&amp; creditExhaustedProviders.has(current.provider); |
| safeCandidates | const | 672 | no | const safeCandidates = candidates.filter((c) =&gt; c.provider !== current.provider); |
| safeDecision | const | 673 | no | const safeDecision = routeTask({ task: agentTask, policy: routePolicy, candidates: safeCandidates }); |
| budgetPlanRoutes | function | 754 | yes | export function budgetPlanRoutes(input) { |
| effectivePolicy | const | 756 | no | const effectivePolicy = { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./model-budget.mjs | import | 13 | [hq/lib/model-budget.mjs](./model-budget.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-092-best-verified-configuration.mjs](../aii/fixtures/HQ-092-best-verified-configuration.mjs.md) | ../../lib/model-router.mjs |
| [hq/aii/fixtures/HQ-101-frontier-model-candidates.mjs](../aii/fixtures/HQ-101-frontier-model-candidates.mjs.md) | ../../lib/model-router.mjs |
| [hq/aii/fixtures/HQ-103-strongest-model-only-components.mjs](../aii/fixtures/HQ-103-strongest-model-only-components.mjs.md) | ../../lib/model-router.mjs |
| [hq/aii/fixtures/HQ-106-expensive-areas.mjs](../aii/fixtures/HQ-106-expensive-areas.mjs.md) | ../../lib/model-router.mjs |
| [hq/aii/fixtures/HQ-107-work-queue-model-ranking.mjs](../aii/fixtures/HQ-107-work-queue-model-ranking.mjs.md) | ../../lib/model-router.mjs |
| [hq/aii/fixtures/HQ-110-autonomous-routing-decision.mjs](../aii/fixtures/HQ-110-autonomous-routing-decision.mjs.md) | ../../lib/model-router.mjs |
| [hq/bin/console.mjs](../bin/console.mjs.md) | ../lib/model-router.mjs |
| [hq/bin/console.mjs](../bin/console.mjs.md) | ../lib/model-router.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/model-router.mjs |
| [hq/bin/revive.mjs](../bin/revive.mjs.md) | ../lib/model-router.mjs |
| [hq/lib/autonomy.mjs](./autonomy.mjs.md) | ./model-router.mjs |
| [hq/lib/mcp-team-tools.mjs](./mcp-team-tools.mjs.md) | ./model-router.mjs |
| [hq/lib/model-inventory.mjs](./model-inventory.mjs.md) | ./model-router.mjs |
| [hq/lib/revive-daemon.mjs](./revive-daemon.mjs.md) | ./model-router.mjs |
| [hq/lib/team-automation.mjs](./team-automation.mjs.md) | ./model-router.mjs |
| [hq/lib/team-panel.mjs](./team-panel.mjs.md) | ./model-router.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Budget-aware model routing: choose the cheapest healthy model that can do the task. |
| 3 | owner | hq-agent | — | hq-agent |
| 4 | task | — | — | team-routing |
| 5 | invariant | — | — | this module decides and explains; it never mutates a config, an agent file or a provider. |
| 6 | see | — | docs/AGENT-BUS.md | docs/AGENT-BUS.md |
| 29 | why | — | — | this is its own family. On 2026-11-05 every named-agent spawn on this machine failed |
| 40 | why | — | — | `max` is absent. It parses, it appears in fifty-three agent definitions, and every |
| 79 | why | — | — | this is not a block. A block on a provider is how five lanes die together: the free |
| 92 | invariant | — | — | writing an agent&#39;s model line is opt-in: only an explicit `--apply` writes. |
| 98 | why | — | — | this is a function and not an inline expression. The old expression was |
| 111 | why | — | — | the CLI ships the supported set with the rejection. Learning the fix from the failure |
| 132 | why | — | — | the CLI&#39;s spawn error packs the MODEL into the same `selection=` field it uses for a |
| 162 | why | — | — | a route without a level is a route that may not spawn. The order is deliberate: an |
| 191 | why | — | — | this is ground truth, not inference. The provider config carries |

## Excerpt

```javascript
/**
 * @hq:context Budget-aware model routing: choose the cheapest healthy model that can do the task.
 * @hq:owner hq-agent
 * @hq:task team-routing
 * @hq:invariant this module decides and explains; it never mutates a config, an agent file or a provider.
 * @hq:see docs/AGENT-BUS.md
 *
 * Why it exists. Over five hours on 2026-11-04 this machine ran 310 turns on one paid provider,
 * 276 on a free model that then hit "free-models-per-day-high-balance" eighteen times, and lost five
 * lanes at once to that single cap. Input tokens outnumbered output tokens 160:1, so the dominant
 * cost is context, not generation. A route that ignores observed health and price repeats that loss.
 */
import {
  budgetStatusFromUsage,
  isBudgetBlocked,
  summarizeBudget,
} from './model-budget.mjs';

/** Rate-limit and quota language, including provider-specific free-tier daily caps. */
const CAP_RE = /rate[ _-]?limit|usage_limit|cooling down|daily[ _-]?cap|quota|free-models-per-day|token plan usage limit|usage limit reached|\(2056\)/i;
/** Payment or credential exhaustion — a different failure from a cap. */
const BUDGET_RE = /insufficient[\s_-]*balance|status=402|payment required|auth_failed|authentication failed|purchase credits|upgrade your token plan/i;
/** The provider rejected the shape of our request, not the request itself. */
const SHAPE_RE = /unsupported parameter|invalid_request|validation:/i;

/**
 * The provider rejected the reasoning LEVEL we asked for — not the model, not the request.
 *
 * @hq:why this is its own family. On 2026-11-05 every named-agent spawn on this machine failed
 *   with `reasoning-level-not-supported` because the roster pinned `thoughtLevel: max` onto a
 *   provider that accepts only low/medium/high. The model answered perfectly at other levels, so
 *   scoring that as "broken" would have sent the router hunting for a different model when the
 *   fix was one word in fifty-three agent definitions.
 */
const REASONING_LEVEL_RE = /reasoning[-_ ]?level[-_ ]?not[-_ ]?supported|reasoning effort[^.]*is not supported|unsupported reasoning|不支持所选思考档位/i;

/**
 * Reasoning levels this CLI accepts at all.
 *
 * @hq:why `max` is absent. It parses, it appears in fifty-three agent definitions, and every
 *   provider reached from here refuses it. A level the CLI can spell but no provider honours is
 *   the exact shape of failure this router now has to catch before it costs a whole roster.
 */
export const CLI_REASONING_LEVELS = ['low', 'medium', 'high'];

/**
 * @typedef {Object} Policy
 * @property {boolean} [preferFree]        Prefer zero-cost models when one is healthy.
 * @property {number}  [maxUsdPerCall]     Hard ceiling on the estimated cost of one call.
 * @property {number}  [latencyWeight]     Score points per millisecond of average latency.
 * @property {number}  [minReliability]    A model below this completion rate is not eligible.
 * @property {string[]} [pinnedModels]     "provider/model" keys the owner fixed; never re-route these.
 * @property {string[]} [blockedProviders] Providers this policy refuses to use.
 * @property {Map<string,any>} [budgetStatus]   Injected budget status map keyed provider/model -> {blocked, reason, source}.
 * @property {boolean} [respectBudget]          When true, budget-blocked current models are rerouted even if pinned (default true).
 * @property {{enabled:boolean,tierOrder:string[],modelTiers:Object<string,{tier:string,verifiedAt:string|number,planEntitlement?:{status:string,verifiedAt:string|number}}>,allowedUnknownQuotaModels?:string[],tierMaxAgeMs?:number}} [tieredSelector] Opt-in evidence-backed tier selection; included plans also require active entitlement and funded lane.
 */

export const DEFAULT_POLICY = {
  preferFree: true,
  // Input tokens ran 160:1 over output tokens on this machine, so a single call on a 50k context
  // at $3/M is already $0.15. A ceiling below that blocks every paid route instead of ranking them.
  maxUsdPerCall: 0.5,
  latencyWeight: 0.05,
  minReliability: 0.5,
  pinnedModels: [],
  blockedProviders: [],
  windowMs: 5 * 60 * 60 * 1000,
  respectBudget: true,
  // The reasoning level every route carries when nothing better is known. `max` is never a
  // default: no provider reached from this machine honours it, and one bad default silently
  // unspawns every agent that inherits it.
  reasoningLevel: 'high',
  /** Owner pins: "provider/model" -> reasoning level. Wins over anything observed. */
  reasoningLevels: {},
  /**
   * Models the owner wants lanes on when they are eligible.
   *
   * @hq:why this is not a block. A block on a provider is how five lanes die together: the free
   *   model caps, the blocked one is refused too, and every agent has nowhere left to go. A
```

_First 80 of 763 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
