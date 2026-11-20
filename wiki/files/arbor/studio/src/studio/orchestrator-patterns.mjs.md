# File: studio/src/studio/orchestrator-patterns.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/orchestrator-patterns.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 18935 B |
| Lines | 267 |
| Hash | 52a054b485bc |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SITE_LABELS | const | 15 | yes | export const SITE_LABELS = Object.freeze({ chatgpt: &#39;ChatGPT&#39;, claude: &#39;Claude&#39;, zai: &#39;Z.ai&#39;, qwen: &#39;Qwen&#39;, deepseek: &#39;DeepSeek&#39;, gemini: &#39;Gemini&#39; }); |
| ORCHESTRATE_SITES | const | 16 | yes | export const ORCHESTRATE_SITES = Object.freeze(Object.keys(SITE_LABELS)); |
| MAX_STEPS | const | 17 | yes | export const MAX_STEPS = 12; |
| STEP_ROLES | const | 20 | yes | export const STEP_ROLES = Object.freeze([&#39;answer&#39;, &#39;improve&#39;, &#39;critique&#39;, &#39;review&#39;, &#39;verify&#39;, &#39;synthesize&#39;, &#39;judge&#39;, &#39;agent&#39;, &#39;revise&#39;]); |
| MAX_QUESTION | const | 21 | no | const MAX_QUESTION = 10000; |
| invalid | function | 23 | no | const invalid = (message) =&gt; Object.assign(new Error(message), { code: &#39;ORCHESTRATE_INVALID&#39;, status: 400 }); |
| labelOf | function | 24 | no | const labelOf = (site) =&gt; SITE_LABELS[site]; |
| list | function | 25 | no | const list = (names) =&gt; names.length &lt;= 1 ? names.join(&#39;&#39;) : names.slice(0, -1).join(&#39;, &#39;) + &#39; and &#39; + names.at(-1); |
| QUESTION | const | 27 | no | const QUESTION = &#39;Question:\\n{{question}}&#39;; |
| TEMPLATES | const | 28 | no | const TEMPLATES = { |
| reviseTemplate | function | 36 | no | const reviseTemplate = (draft, review) =&gt; &#39;You answered the question below and a reviewer gave feedback. Write an improved full answer that fixes the valid points (ignore any that are wrong). Reply w… |
| step | function | 39 | no | function step(id, site, role, template, { after = [], when = null } = {}) { |
| sitesOf | function | 42 | no | function sitesOf(sites, { min = 1, max = ORCHESTRATE_SITES.length, unique = true } = {}) { |
| siteOption | function | 48 | no | function siteOption(value, fallback, what) { |
| intOption | function | 53 | no | function intOption(value, fallback, min, max, what) { |
| BUILDERS | const | 60 | no | const BUILDERS = { |
| chosen | const | 66 | no | const chosen = sitesOf(sites); |
| steps | const | 67 | no | const steps = chosen.map((site, i) =&gt; step(&#39;s&#39; + (i + 1), site, &#39;answer&#39;, TEMPLATES.answer)); |
| chosen | const | 71 | no | const chosen = sitesOf(sites, { min: 2 }); |
| steps | const | 72 | no | const steps = chosen.map((site, i) =&gt; step(&#39;s&#39; + (i + 1), site, &#39;answer&#39;, TEMPLATES.answer)); |
| ids | const | 73 | no | const ids = steps.map((s) =&gt; s.id); |
| chosen | const | 77 | no | const chosen = sitesOf(sites, { min: 2 }); |
| steps | const | 78 | no | const steps = chosen.map((site, i) =&gt; step(&#39;s&#39; + (i + 1), site, &#39;answer&#39;, TEMPLATES.answer, i ? { after: Array.from({ length: i }, (_, j) =&gt; &#39;s&#39; + (j + 1)), when: { noneReady: true } } : {})); |
| seconds | const | 84 | no | const seconds = intOption(options.hedgeAfterSeconds, 90, 5, 900, &#39;Hedge delay (seconds)&#39;); |
| steps | const | 85 | no | const steps = [step(&#39;s1&#39;, first, &#39;answer&#39;, TEMPLATES.answer), |
| members | const | 90 | no | const members = sitesOf(sites, { min: 2 }); |
| by | const | 91 | no | const by = siteOption(options.by, members[0], &#39;combines the answers&#39;); |
| steps | const | 92 | no | const steps = members.map((site, i) =&gt; step(&#39;s&#39; + (i + 1), site, &#39;answer&#39;, TEMPLATES.answer)); |
| ids | const | 93 | no | const ids = steps.map((s) =&gt; s.id); |
| candidates | const | 98 | no | const candidates = sitesOf(sites, { min: 2 }); |
| by | const | 99 | no | const by = siteOption(options.by, candidates[0], &#39;judges the answers&#39;); |
| steps | const | 100 | no | const steps = candidates.map((site, i) =&gt; step(&#39;s&#39; + (i + 1), site, &#39;answer&#39;, TEMPLATES.answer)); |
| ids | const | 101 | no | const ids = steps.map((s) =&gt; s.id); |
| judgeId | const | 102 | no | const judgeId = &#39;s&#39; + (ids.length + 1); |
| stages | const | 107 | no | const stages = sitesOf(sites, { min: 2, unique: false }); |
| custom | const | 108 | no | const custom = Array.isArray(options.instructions) ? options.instructions : []; |
| steps | const | 110 | no | const steps = stages.map((site, i) =&gt; { const extra = custom[i]?.trim(); const base = i ? TEMPLATES.improve : TEMPLATES.answer; const template = extra ? (i ? extra + &#39;\\n\\n&#39; + QUESTION + &#39;\\n\\nCurrent … |
| extra | const | 111 | no | const extra = custom[i]?.trim(); |
| base | const | 112 | no | const base = i ? TEMPLATES.improve : TEMPLATES.answer; |
| template | const | 113 | no | const template = extra ? (i ? extra + &#39;\\n\\n&#39; + QUESTION + &#39;\\n\\nCurrent answer:\\n{{previous}}&#39; : extra + &#39;\\n\\n{{question}}&#39;) : base; |
| chosen | const | 122 | no | const chosen = sitesOf(sites, { min: 2, max: 2 }); |
| rounds | const | 124 | no | const rounds = intOption(options.rounds, 1, 1, 3, &#39;Rounds&#39;); |
| steps | const | 125 | no | const steps = [step(&#39;s1&#39;, author, &#39;answer&#39;, TEMPLATES.answer)]; |
| draft | variable | 126 | no | let draft = &#39;s1&#39;; |
| review | const | 128 | no | const review = &#39;s&#39; + (steps.length + 1), revise = &#39;s&#39; + (steps.length + 2); |
| steps | const | 138 | no | const steps = [step(&#39;s1&#39;, answerer, &#39;answer&#39;, TEMPLATES.answer), step(&#39;s2&#39;, checker, &#39;verify&#39;, TEMPLATES.verify, { after: [&#39;s1&#39;], when: { minReady: 1 } })]; |
| PATTERNS | const | 144 | yes | export const PATTERNS = Object.freeze({ single: { title: &#39;Ask one AI&#39;, sites: &#39;1&#39;, summary: &#39;One question to one of your AIs.&#39; }, fanout: { title: &#39;Ask several at once&#39;, sites: &#39;1-6&#39;, summary: &#39;The s… |
| PATTERN_NAMES | const | 157 | yes | export const PATTERN_NAMES = Object.freeze(Object.keys(BUILDERS)); |
| PATTERN_CHOICES | const | 159 | yes | export const PATTERN_CHOICES = Object.freeze([...PATTERN_NAMES, &#39;auto&#39;]); |
| buildPlanSpec | function | 163 | yes | export function buildPlanSpec({ pattern, question, sites, options = {} } = {}) { |
| text | const | 165 | no | const text = typeof question === &#39;string&#39; ? question.trim() : &#39;&#39;; |
| deadlineMinutes | const | 168 | no | const deadlineMinutes = intOption(options.deadlineMinutes, 20, 1, 120, &#39;Time limit (minutes)&#39;); |
| expect | const | 169 | no | const expect = options.expect === undefined ? &#39;text&#39; : options.expect; |
| built | const | 171 | no | const built = BUILDERS[pattern]({ sites, options }); |
| describeResult | function | 178 | yes | export function describeResult(plan, picked) { |
| steps | const | 179 | no | const steps = plan.steps, ready = steps.filter((s) =&gt; s.state === &#39;ready&#39; &amp;&amp; s.valid); |
| by | function | 180 | no | const by = (id) =&gt; steps.find((s) =&gt; s.id === id); |
| before | const | 186 | no | const before = steps.slice(0, steps.indexOf(picked)).map((s) =&gt; s.label); |
| members | const | 190 | no | const members = steps.filter((s) =&gt; s.role === &#39;answer&#39; &amp;&amp; s.state === &#39;ready&#39; &amp;&amp; s.valid).map((s) =&gt; s.label); |
| FENCE | const | 206 | no | const FENCE = /```[ \\t]*([A-Za-z0-9_-]*)[ \\t]*\\r?\\n([\\s\\S]*?)\\r?\\n?```/g; |
| SMART_SINGLE | const | 207 | no | const SMART_SINGLE = /[\\u2018\\u2019\\u201a\\u201b]/g; |
| SMART_DOUBLE | const | 208 | no | const SMART_DOUBLE = /[\\u201c\\u201d\\u201e\\u201f]/g; |
| straightenQuotes | function | 209 | no | const straightenQuotes = (text) =&gt; String(text ?? &#39;&#39;).replace(SMART_SINGLE, &quot;&#39;&quot;).replace(SMART_DOUBLE, &#39;&quot;&#39;); |
| jsonObjectsIn | function | 210 | no | function jsonObjectsIn(text) { |
| found | const | 211 | no | const found = []; |
| depth | variable | 214 | no | let depth = 0, inString = false, end = -1; |
| c | const | 216 | no | const c = text[j]; |
| slice | const | 223 | no | const slice = text.slice(i, end + 1); |
| value | const | 225 | no | const value = JSON.parse(slice); |
| parsePlannerReply | function | 235 | yes | export function parsePlannerReply(text) { |
| t | const | 236 | no | const t = straightenQuotes(text); |
| blocks | const | 237 | no | const blocks = [...t.matchAll(FENCE)] |
| candidate | variable | 240 | no | let candidate; |
| whole | const | 244 | no | const whole = t.trim(); |
| objs | const | 247 | no | const objs = jsonObjectsIn(whole); |
| parsed | variable | 252 | no | let parsed; |
| stepList | const | 257 | no | const stepList = Array.isArray(steps) ? steps : []; |
| clean | const | 258 | no | const clean = []; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [harness/test/agents/roles.test.mjs](../../../harness/test/agents/roles.test.mjs.md) | ../../../studio/src/studio/orchestrator-patterns.mjs |
| [studio/bin/commands/ask.mjs](../../bin/commands/ask.mjs.md) | ../../src/studio/orchestrator-patterns.mjs |
| [studio/src/studio/ai-orchestrator.mjs](./ai-orchestrator.mjs.md) | ./orchestrator-patterns.mjs |
| [studio/src/studio/ai-orchestrator.mjs](./ai-orchestrator.mjs.md) | ./orchestrator-patterns.mjs |
| [studio/src/studio/orchestrator-routes.mjs](./orchestrator-routes.mjs.md) | ./orchestrator-patterns.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Pure plan builders for src/studio/ai-orchestrator.mjs. No filesystem, network or browser access
// here: every function turns {question, sites, options} into a small declarative plan that the
// orchestrator engine persists and runs. The CLI (bin/commands/ask.mjs) imports this module for
// pattern names and validation without loading the engine.
//
// A plan is a list of SEND steps plus a rule for choosing the result:
//   step.after   ids that must be finished (ready/failed/skipped/stopped) before this step may start
//   step.when    { minReady } | { noneReady } | { skipIf: { step, match } } | { hedge: { step, afterMs } }
//   step.template prompt text with {{question}}, {{previous}}, {{answers}}, {{answer:sN}} slots. It is
//                rendered ONCE, right before the step is sent, and the rendered prompt is persisted with
//                the step — a resumed step is never re-rendered (same key + same text, or nothing).
//   plan.firstWins ids racing each other: the first VALID answer wins, the rest stop waiting (a sent
//                question cannot be unsent) and not-yet-sent ones are never sent.
//   plan.choose  { rule: 'first' | 'all' | 'prefer' | 'judge' | 'verify', ... }
export const SITE_LABELS = Object.freeze({ chatgpt: 'ChatGPT', claude: 'Claude', zai: 'Z.ai', qwen: 'Qwen', deepseek: 'DeepSeek', gemini: 'Gemini' });
export const ORCHESTRATE_SITES = Object.freeze(Object.keys(SITE_LABELS));
export const MAX_STEPS = 12;
// Valid step roles. 'agent' is the planner step: its reply is parsed and turned into appended steps
// by the engine, so a web AI can act as the primary agent and delegate to the other web AIs.
export const STEP_ROLES = Object.freeze(['answer', 'improve', 'critique', 'review', 'verify', 'synthesize', 'judge', 'agent', 'revise']);
const MAX_QUESTION = 10000;

const invalid = (message) => Object.assign(new Error(message), { code: 'ORCHESTRATE_INVALID', status: 400 });
const labelOf = (site) => SITE_LABELS[site];
const list = (names) => names.length <= 1 ? names.join('') : names.slice(0, -1).join(', ') + ' and ' + names.at(-1);

const QUESTION = 'Question:\n{{question}}';
const TEMPLATES = {
  answer: '{{question}}',
  synthesize: 'Several AI assistants answered the same question independently. Write the single best final answer: keep what they agree on, settle any disagreement (say which view is right and why), and add anything important they all missed. Do not mention the assistants or the numbered answers — just give the final answer.\n\n' + QUESTION + '\n\n{{answers}}',
  judge: 'You are judging answers to a question. Read the question and the numbered answers, then pick the single best one: most correct first, then most complete and clear.\n\n' + QUESTION + '\n\n{{answers}}\n\nReply in exactly this format and nothing else:\nWINNER: <number>\nWHY: <one or two sentences>',
  improve: 'Here is a question and the current answer from another AI assistant. Improve it: fix mistakes, fill gaps and tighten the wording. Reply with the full improved answer only.\n\n' + QUESTION + '\n\nCurrent answer:\n{{previous}}',
  critique: 'Review this answer to the question below. List concrete problems only — factual errors, missing pieces, unclear parts. Be specific and brief. If the answer is already excellent, reply with exactly: NO CHANGES NEEDED\n\n' + QUESTION + '\n\nAnswer to review:\n{{previous}}',
  verify: 'Check this answer to the question below for mistakes. Reply in exactly this format and nothing else:\nVERDICT: OK   (or)   VERDICT: PROBLEMS\nNOTES: <a short list of any problems, or "none">\n\n' + QUESTION + '\n\nAnswer to check:\n{{previous}}',
};
const reviseTemplate = (draft, review) => 'You answered the question below and a reviewer gave feedback. Write an improved full answer that fixes the valid points (ignore any that are wrong). Reply with the improved answer only.\n\n'
  + QUESTION + '\n\nYour earlier answer:\n{{answer:' + draft + '}}\n\nReviewer feedback:\n{{answer:' + review + '}}';

function step(id, site, role, template, { after = [], when = null } = {}) {
  return { id, site, label: labelOf(site), role, template, after, when };
}
function sitesOf(sites, { min = 1, max = ORCHESTRATE_SITES.length, unique = true } = {}) {
  if (!Array.isArray(sites) || sites.some((s) => !Object.hasOwn(SITE_LABELS, s))) throw invalid('Choose from: ' + ORCHESTRATE_SITES.map(labelOf).join(', ') + '.');
  if (sites.length < min || sites.length > max) throw invalid(min === max ? `This needs exactly ${min} AI${min === 1 ? '' : 's'}.` : `Choose ${min} to ${max} AIs for this.`);
  if (unique && new Set(sites).size !== sites.length) throw invalid('Choose each AI only once.');
  return [...sites];
}
function siteOption(value, fallback, what) {
  if (value === undefined || value === null || value === '') return fallback;
  if (!Object.hasOwn(SITE_LABELS, value)) throw invalid(`Choose which AI ${what} from: ${ORCHESTRATE_SITES.map(labelOf).join(', ')}.`);
  return value;
}
function intOption(value, fallback, min, max, what) {
  if (value === undefined || value === null) return fallback;
  if (!Number.isSafeInteger(value) || value < min || value > max) throw invalid(`${what} must be a whole number from ${min} to ${max}.`);
  return value;
}

// Every builder returns { sites, options, steps, firstWins, choose, describe }.
const BUILDERS = {
  single({ sites }) {
    const [site] = sitesOf(sites, { min: 1, max: 1 });
    return { steps: [step('s1', site, 'answer', TEMPLATES.answer)], choose: { rule: 'first', steps: ['s1'] } };
  },
  fanout({ sites }) {
    const chosen = sitesOf(sites);
    const steps = chosen.map((site, i) => step('s' + (i + 1), site, 'answer', TEMPLATES.answer));
    return { steps, choose: { rule: 'all', steps: steps.map((s) => s.id) } };
  },
  race({ sites }) {
    const chosen = sitesOf(sites, { min: 2 });
    const steps = chosen.map((site, i) => step('s' + (i + 1), site, 'answer', TEMPLATES.answer));
    const ids = steps.map((s) => s.id);
    return { steps, firstWins: ids, choose: { rule: 'first', steps: ids } };
  },
  fallback({ sites }) {
    const chosen = sitesOf(sites, { min: 2 });
    const steps = chosen.map((site, i) => step('s' + (i + 1), site, 'answer', TEMPLATES.answer,
      i ? { after: Array.from({ length: i }, (_, j) => 's' + (j + 1)), when: { noneReady: true } } : {}));
    return { steps, choose: { rule: 'first', steps: steps.map((s) => s.id) } };
```

_First 80 of 268 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
