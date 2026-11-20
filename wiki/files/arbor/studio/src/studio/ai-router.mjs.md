# File: studio/src/studio/ai-router.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/ai-router.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 23157 B |
| Lines | 354 |
| Hash | 5de3b9d759d4 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DEFAULT_ORDER | const | 22 | yes | export const DEFAULT_ORDER = Object.freeze([&#39;chatgpt&#39;, &#39;claude&#39;, &#39;gemini&#39;, &#39;deepseek&#39;, &#39;zai&#39;, &#39;qwen&#39;]); |
| LABELS | const | 23 | no | const LABELS = { chatgpt: &#39;ChatGPT&#39;, claude: &#39;Claude&#39;, zai: &#39;Z.ai&#39;, qwen: &#39;Qwen&#39;, deepseek: &#39;DeepSeek&#39;, gemini: &#39;Gemini&#39; }; |
| labelOf | function | 24 | yes | export const labelOf = (site) =&gt; LABELS[site] ?? (typeof site === &#39;string&#39; &amp;&amp; site ? site[0].toUpperCase() + site.slice(1) : &#39;that AI&#39;); |
| TASK_CLASSES | const | 26 | yes | export const TASK_CLASSES = Object.freeze([&#39;quick&#39;, &#39;implementation&#39;, &#39;app-design&#39;, &#39;writing&#39;, &#39;review&#39;, &#39;decision&#39;, &#39;research&#39;]); |
| PATTERNS | const | 27 | yes | export const PATTERNS = Object.freeze([&#39;single&#39;, &#39;fallback&#39;, &#39;judge&#39;, &#39;council&#39;, &#39;fan-out&#39;, &#39;race&#39;]); |
| ROLE_CLASS | const | 33 | no | const ROLE_CLASS = { reviewer: &#39;review&#39;, implementer: &#39;implementation&#39;, copywriter: &#39;writing&#39; }; |
| RE | const | 34 | no | const RE = { |
| classifyTask | function | 45 | yes | export function classifyTask({ task = &#39;&#39;, role = null, constraints = {} } = {}) { |
| text | const | 46 | no | const text = String(task ?? &#39;&#39;); |
| COLD_START_NEUTRAL | const | 66 | no | const COLD_START_NEUTRAL = 0.55; // assumed success rate with zero saved jobs: cautiously optimistic |
| WEIGHT_SUCCESS | const | 67 | no | const WEIGHT_SUCCESS = 0.5; |
| WEIGHT_LATENCY | const | 68 | no | const WEIGHT_LATENCY = 0.3; |
| WEIGHT_STRUCTURED_BONUS | const | 69 | no | const WEIGHT_STRUCTURED_BONUS = 0.12; // app-design: extra credit for the SAME combined track record (see doc limitation) |
| NEUTRAL_LATENCY_SCORE | const | 70 | no | const NEUTRAL_LATENCY_SCORE = 0.5; |
| LATENCY_SCALE_MS | const | 71 | no | const LATENCY_SCALE_MS = 45_000; // latency score reaches 0 around 45s typical reply time |
| RECENT_FAILURE_WINDOW_MS | const | 72 | no | const RECENT_FAILURE_WINDOW_MS = 15 * 60_000; // a failure in the last 15 minutes still stings |
| RECENT_FAILURE_PENALTY | const | 73 | no | const RECENT_FAILURE_PENALTY = 0.2; |
| TAB_CLOSED_PENALTY | const | 74 | no | const TAB_CLOSED_PENALTY = 0.03; // opening a fresh tab costs a little time; not disqualifying |
| COLD_START_TIEBREAK | const | 75 | no | const COLD_START_TIEBREAK = 0.001; // just enough to order otherwise-tied cold providers sensibly |
| EXPLORE_JOBS_THRESHOLD | const | 76 | no | const EXPLORE_JOBS_THRESHOLD = 5; // &quot;under-sampled&quot; = fewer than this many saved jobs |
| EXPLORE_RATE | const | 77 | no | const EXPLORE_RATE = 10; // 1 in EXPLORE_RATE, deterministically |
| EXPLORE_BONUS | const | 78 | no | const EXPLORE_BONUS = 0.22; |
| clamp | function | 80 | no | const clamp = (n, lo, hi) =&gt; Math.min(hi, Math.max(lo, n)); |
| hashStr | function | 83 | no | function hashStr(s) { let h = 5381; for (let i = 0; i &lt; s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) &gt;&gt;&gt; 0; return h; } |
| explorationPick | function | 87 | yes | export function explorationPick(providers, { task = &#39;&#39;, role = null } = {}) { |
| picks | const | 88 | no | const picks = []; |
| jobs | const | 91 | no | const jobs = Number.isFinite(p.stats?.jobs) ? p.stats.jobs : 0; |
| fmtMs | function | 98 | no | function fmtMs(ms) { |
| scoreOf | function | 105 | no | function scoreOf(provider, { taskClass, now, explored }) { |
| stats | const | 106 | no | const stats = provider.stats ?? {}; |
| jobs | const | 107 | no | const jobs = Number.isFinite(stats.jobs) ? stats.jobs : 0; |
| completed | const | 108 | no | const completed = Number.isFinite(stats.completed) ? stats.completed : 0; |
| successRate | const | 109 | no | const successRate = jobs &gt; 0 ? completed / jobs : COLD_START_NEUTRAL; |
| score | variable | 110 | no | let score = successRate * WEIGHT_SUCCESS; |
| medianMs | const | 111 | no | const medianMs = Number.isFinite(stats.medianMs) ? stats.medianMs : null; |
| p90Ms | const | 112 | no | const p90Ms = Number.isFinite(stats.p90Ms) ? stats.p90Ms : null; |
| latencyMs | const | 113 | no | const latencyMs = medianMs != null &amp;&amp; p90Ms != null ? medianMs * 0.7 + p90Ms * 0.3 : (medianMs ?? p90Ms); |
| lastErrorAt | const | 115 | no | const lastErrorAt = typeof stats.lastErrorAt === &#39;string&#39; ? Date.parse(stats.lastErrorAt) : NaN; |
| ageMs | const | 117 | no | const ageMs = Math.max(0, now - lastErrorAt); |
| idx | const | 122 | no | const idx = DEFAULT_ORDER.indexOf(provider.site); |
| whySite | function | 128 | no | function whySite(entry) { |
| stats | const | 129 | no | const stats = entry?.stats ?? {}; |
| jobs | const | 130 | no | const jobs = Number.isFinite(stats.jobs) ? stats.jobs : 0; |
| rate | const | 132 | no | const rate = Math.round((stats.completed / jobs) * 100); |
| ms | const | 133 | no | const ms = fmtMs(stats.medianMs); |
| rankProviders | function | 139 | no | function rankProviders(eligible, { taskClass, task, role, now }) { |
| explored | const | 140 | no | const explored = new Set(explorationPick(eligible, { task, role })); |
| withMustInclude | function | 148 | no | function withMustInclude(ranked, mustInclude) { |
| want | const | 149 | no | const want = (Array.isArray(mustInclude) ? mustInclude : []).filter((site) =&gt; ranked.some((p) =&gt; p.site === site)); |
| front | const | 151 | no | const front = want.map((site) =&gt; ranked.find((p) =&gt; p.site === site)); |
| PATTERN_SPEC | const | 159 | no | const PATTERN_SPEC = { |
| LATENCY_HEDGE_THRESHOLD_MS | const | 168 | no | const LATENCY_HEDGE_THRESHOLD_MS = 30_000; // constraints.maxWaitMs this tight =&gt; hedge, don&#39;t queue |
| SUBMIT_OVERHEAD_MS | const | 172 | no | const SUBMIT_OVERHEAD_MS = 8_000; |
| decidePattern | function | 174 | no | function decidePattern(taskClass, orderedCount, constraints) { |
| spec | const | 175 | no | const spec = PATTERN_SPEC[taskClass] ?? PATTERN_SPEC.quick; |
| capped | function | 176 | no | const capped = (n) =&gt; (Number.isFinite(constraints.maxSends) &amp;&amp; constraints.maxSends &gt;= 1 ? Math.min(n, constraints.maxSends) : n); |
| pattern | variable | 177 | no | let pattern = spec.base; |
| count | variable | 178 | no | let count = capped(Math.min(spec.ideal, orderedCount)); |
| buildOptions | function | 197 | no | function buildOptions(pattern, sites, taskClass, constraints, explorationPicks) { |
| options | const | 198 | no | const options = { |
| CLASS_PHRASE | const | 213 | no | const CLASS_PHRASE = { |
| reasonFor | function | 218 | no | function reasonFor({ taskClass, pattern, sites, bySite, explorationPicks, dropped }) { |
| L | const | 219 | no | const L = labelOf; |
| parts | const | 220 | no | const parts = []; |
| judgeSite | const | 229 | no | const judgeSite = sites[sites.length - 1], panel = sites.slice(0, -1); |
| buildAlternatives | function | 248 | no | function buildAlternatives({ taskClass, pattern, sites, ranked, constraints }) { |
| alts | const | 249 | no | const alts = []; |
| bench | const | 250 | no | const bench = ranked.filter((p) =&gt; !sites.includes(p.site)).slice(0, 2).map((p) =&gt; p.site); |
| blockedDecision | function | 261 | no | function blockedDecision(taskClass) { |
| route | function | 271 | yes | export function route({ task, role = null, constraints = {}, providers, now = Date.now() } = {}) { |
| c | const | 274 | no | const c = constraints ?? {}; |
| excludeSet | const | 275 | no | const excludeSet = new Set(Array.isArray(c.exclude) ? c.exclude : []); |
| taskClass | const | 277 | no | const taskClass = classifyTask({ task, role, constraints: c }); |
| known | const | 278 | no | const known = providers.filter((p) =&gt; p &amp;&amp; typeof p.site === &#39;string&#39; &amp;&amp; p.site); |
| eligible | const | 279 | no | const eligible = known.filter((p) =&gt; p.signedIn !== false &amp;&amp; !excludeSet.has(p.site)); |
| droppedMustInclude | const | 280 | no | const droppedMustInclude = (Array.isArray(c.mustInclude) ? c.mustInclude : []) |
| ranked | const | 285 | no | const ranked = withMustInclude(rankProviders(eligible, { taskClass, task, role, now }), c.mustInclude); |
| bySite | const | 286 | no | const bySite = new Map(ranked.map((p) =&gt; [p.site, p])); |
| sites | const | 288 | no | const sites = ranked.slice(0, count).map((p) =&gt; p.site); |
| explorationPicks | const | 289 | no | const explorationPicks = sites.filter((site) =&gt; bySite.get(site)?._explored); |
| signedOutRequested | const | 290 | no | const signedOutRequested = (Array.isArray(c.mustInclude) ? c.mustInclude : []).filter((site) =&gt; known.some((p) =&gt; p.site === site &amp;&amp; p.signedIn === false)); |
| options | const | 292 | no | const options = buildOptions(pattern, sites, taskClass, c, explorationPicks); |
| dropped | const | 293 | no | const dropped = [...new Set([...droppedMustInclude, ...signedOutRequested])]; |
| reason | const | 294 | no | const reason = reasonFor({ taskClass, pattern, sites, bySite, explorationPicks, dropped }); |
| alternatives | const | 295 | no | const alternatives = buildAlternatives({ taskClass, pattern, sites, ranked, constraints: c }); |
| explain | function | 300 | yes | export function explain(decision) { |
| L | const | 302 | no | const L = labelOf; |
| learnInput | function | 331 | yes | export async function learnInput({ paths, readPerformance = readProviderPerformance, readTargets = null, now } = {}) { |
| perfBySite | const | 337 | no | const perfBySite = new Map((performance?.providers ?? []).map((p) =&gt; [p.site, p])); |
| tabOpenSites | const | 338 | no | const tabOpenSites = new Set((targetsResult?.targets ?? []).map((t) =&gt; t?.site).filter(Boolean)); |
| explicitSignedIn | const | 339 | no | const explicitSignedIn = targetsResult?.signedIn &amp;&amp; typeof targetsResult.signedIn === &#39;object&#39; ? targetsResult.signedIn : {}; |
| sites | const | 340 | no | const sites = new Set([...perfBySite.keys(), ...tabOpenSites, ...DEFAULT_ORDER]); |
| perf | const | 343 | no | const perf = perfBySite.get(site); |
| signed | const | 344 | no | const signed = explicitSignedIn[site]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./provider-performance.mjs | import | 18 | [studio/src/studio/provider-performance.mjs](./provider-performance.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/src/interface/brain.mjs](../../../harness/src/interface/brain.mjs.md) | ../../../studio/src/studio/ai-router.mjs |
| [studio/src/studio/ai-orchestrator.mjs](./ai-orchestrator.mjs.md) | ./ai-router.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Auto router: decides WHICH AI pattern (single ask, a fallback chain, a review panel + judge, a
// council of independent opinions, a race/hedge, a fan-out for research, …) and WHICH of the
// person's own signed-in AI accounts to use for one task. This module is the brain behind
// `pattern: "auto"` on the central orchestrator (src/studio/ai-orchestrator.mjs); it never talks to
// a browser, a provider or the filesystem itself.
//
// Purity contract: `route()` and `classifyTask()` are pure functions of their arguments. No
// network, no fs, no Date.now() side effects beyond the optional `now` input (defaulted once, at
// the top, never re-read). Anything that needs to WATCH the real world (saved job history, which
// browser tabs are open) lives in `learnInput()`, a small async helper that calls injected readers
// and shapes their output into the plain `providers[]` array `route()` expects. See
// docs/architecture/AI-ROUTER.md for the full design write-up, scoring weights and worked examples.
//
// Nothing here duplicates the REAL safety gates. compare-service.mjs still re-checks sign-in before
// ever typing into a page; this router's "never route to signed-out sites" rule is a courtesy (ask
// a useless site) layer, not the enforcement point.

import { readProviderPerformance } from './provider-performance.mjs';

// Cold-start order (no saved history anywhere yet): the four accounts VIVIM ships adapters for
// today plus two more in the compare roster, in a sensible "most people have these" order.
export const DEFAULT_ORDER = Object.freeze(['chatgpt', 'claude', 'gemini', 'deepseek', 'zai', 'qwen']);
const LABELS = { chatgpt: 'ChatGPT', claude: 'Claude', zai: 'Z.ai', qwen: 'Qwen', deepseek: 'DeepSeek', gemini: 'Gemini' };
export const labelOf = (site) => LABELS[site] ?? (typeof site === 'string' && site ? site[0].toUpperCase() + site.slice(1) : 'that AI');

export const TASK_CLASSES = Object.freeze(['quick', 'implementation', 'app-design', 'writing', 'review', 'decision', 'research']);
export const PATTERNS = Object.freeze(['single', 'fallback', 'judge', 'council', 'fan-out', 'race']);

// --- classification -------------------------------------------------------------------------
// role (from ask-prompts.mjs's ROLE_NAMES) is the strongest signal when given; free text is a
// best-effort heuristic on top. Neither is "smart"; both are deliberately simple and documented
// so a wrong guess is easy to see and tune.
const ROLE_CLASS = { reviewer: 'review', implementer: 'implementation', copywriter: 'writing' };
const RE = {
  review: /\b(diff|patch|pull request|\bpr\b|code review|review (this|the) code|unified diff)\b/i,
  implementation: /\b(implement|write the code|add a (function|feature|endpoint)|fix the bug|refactor|make the change|write a patch)\b/i,
  appDesign: /\b(app design|ui design|wireframe|screen design|component tree|design the (screen|app|flow|ui)|structured (json|reply)|json shape|schema for)\b/i,
  decision: /\b(should we|which (option|approach|provider|strategy|plan)|go\/no-go|trade-?offs?|pros and cons|strategic decision|decide between)\b/i,
  research: /\b(research|comprehensive|deep dive|survey|literature|exhaustive|in-depth|long report|investigate thoroughly)\b/i,
  writing: /\b(write (a|the) (copy|headline|caption|tagline|message|email|blog)|rewrite|copywriting|marketing copy|plain-language wording)\b/i,
  question: /\?\s*$/,
};

// @serves ai-orchestrator (pattern: "auto")
export function classifyTask({ task = '', role = null, constraints = {} } = {}) {
  const text = String(task ?? '');
  if (constraints?.structuredReply === true) return 'app-design'; // explicit beats every heuristic
  if (role && ROLE_CLASS[role]) return ROLE_CLASS[role];
  if (RE.review.test(text)) return 'review';
  if (RE.implementation.test(text)) return 'implementation';
  if (RE.appDesign.test(text)) return 'app-design';
  if (RE.decision.test(text)) return 'decision';
  if (RE.research.test(text) && text.length > 300) return 'research';
  if (RE.writing.test(text)) return 'writing';
  if (text.length <= 160 && RE.question.test(text.trim())) return 'quick';
  return text.length > 300 ? 'research' : 'quick';
}

// --- scoring ---------------------------------------------------------------------------------
// Weighted blend of: success rate, latency (median weighted more than p90, both lower-is-better),
// a penalty for a still-recent failure, a small nudge for an already-open tab, a tiny deterministic
// tie-break toward the cold-start default order, and an occasional deterministic "go learn about
// this one" exploration bonus for an under-sampled provider. Every weight is a named constant so
// the balance is easy to see and retune; none of it is calibrated against real data yet (see the
// "left for later" note in the doc).
const COLD_START_NEUTRAL = 0.55;   // assumed success rate with zero saved jobs: cautiously optimistic
const WEIGHT_SUCCESS = 0.5;
const WEIGHT_LATENCY = 0.3;
const WEIGHT_STRUCTURED_BONUS = 0.12; // app-design: extra credit for the SAME combined track record (see doc limitation)
const NEUTRAL_LATENCY_SCORE = 0.5;
const LATENCY_SCALE_MS = 45_000;   // latency score reaches 0 around 45s typical reply time
const RECENT_FAILURE_WINDOW_MS = 15 * 60_000; // a failure in the last 15 minutes still stings
const RECENT_FAILURE_PENALTY = 0.2;
const TAB_CLOSED_PENALTY = 0.03;   // opening a fresh tab costs a little time; not disqualifying
const COLD_START_TIEBREAK = 0.001; // just enough to order otherwise-tied cold providers sensibly
const EXPLORE_JOBS_THRESHOLD = 5;  // "under-sampled" = fewer than this many saved jobs
const EXPLORE_RATE = 10;           // 1 in EXPLORE_RATE, deterministically
const EXPLORE_BONUS = 0.22;

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
```

_First 80 of 355 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
