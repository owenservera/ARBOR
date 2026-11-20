# File: studio/src/studio/ai-orchestrator.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/ai-orchestrator.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 48607 B |
| Lines | 723 |
| Hash | 15e5275ae850 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PATTERNS | export | 31 | yes | export { PATTERNS, PATTERN_NAMES, PATTERN_CHOICES, STEP_ROLES } |
| PATTERN_CHOICES | export | 31 | yes | export { PATTERNS, PATTERN_NAMES, PATTERN_CHOICES, STEP_ROLES } |
| PATTERN_NAMES | export | 31 | yes | export { PATTERNS, PATTERN_NAMES, PATTERN_CHOICES, STEP_ROLES } |
| STEP_ROLES | export | 31 | yes | export { PATTERNS, PATTERN_NAMES, PATTERN_CHOICES, STEP_ROLES } |
| SCHEMA | const | 32 | no | const SCHEMA = &#39;vivim.orchestrate/1&#39;; |
| ID | const | 33 | no | const ID = /^orc-[a-f0-9]{24}$/; |
| CODE | const | 34 | no | const CODE = /^[A-Z][A-Z0-9_]{1,79}$/; |
| ACTIVE | const | 35 | no | const ACTIVE = new Set([&#39;queued&#39;, &#39;running&#39;]); |
| TERMINAL | const | 36 | no | const TERMINAL = new Set([&#39;ready&#39;, &#39;failed&#39;, &#39;skipped&#39;, &#39;stopped&#39;, &#39;cancelled&#39;]); |
| BUSY | const | 37 | no | const BUSY = new Set([&#39;DRIVE_LEASE_BUSY&#39;, &#39;THREAD_JOURNAL_BUSY&#39;, &#39;PREFIX_WRITER_BUSY&#39;, &#39;WRITER_WINDOW_BUSY&#39;]); |
| MAX_KEPT | const | 38 | no | const MAX_KEPT = 60, MAX_EVENTS = 80; |
| MAX_EMBED | const | 39 | no | const MAX_EMBED = 8000, MAX_PROMPT = 40000; // other AIs&#39; answers embedded in a follow-up prompt |
| LIVE_OWNERS | const | 40 | no | const LIVE_OWNERS = new Set(); // tokens of orchestrators alive in THIS process (PID-reuse guard) |
| DEFAULT_TIMING | const | 41 | no | const DEFAULT_TIMING = Object.freeze({ pollMs: 2500, tickMs: 1000, busyMs: 180000, // how long a busy browser is waited out (same key, backoff) replyMs: 600000, // patience for one reply (also capped… |
| LANE | const | 56 | no | const LANE = { tail: Promise.resolve(), holders: 0, waiting: 0 }; |
| acquireBrowserLane | function | 57 | yes | export function acquireBrowserLane() { |
| open | variable | 58 | no | let open; |
| gate | const | 59 | no | const gate = new Promise((resolve) =&gt; { open = resolve; }); |
| previous | const | 60 | no | const previous = LANE.tail; |
| released | variable | 65 | no | let released = false; |
| SITE_TURNS | const | 69 | no | const SITE_TURNS = new Map(); // site -&gt; number of turns in flight (0 or 1 in practice) |
| schedulerState | function | 70 | yes | export const schedulerState = () =&gt; ({ laneHeld: LANE.holders &gt; 0, laneWaiting: LANE.waiting, sitesBusy: [...SITE_TURNS.entries()].filter(([, n]) =&gt; n &gt; 0).map(([site]) =&gt; site) }); |
| routerModule | variable | 77 | no | let routerModule; |
| loadRouter | function | 78 | no | async function loadRouter() { |
| ROUTER_PATTERN | const | 87 | no | const ROUTER_PATTERN = Object.freeze({ &#39;fan-out&#39;: &#39;fanout&#39;, fanout: &#39;fanout&#39;, single: &#39;single&#39;, fallback: &#39;fallback&#39;, race: &#39;race&#39;, judge: &#39;judge&#39;, council: &#39;council&#39; }); |
| coded | function | 91 | no | const coded = (code) =&gt; Object.assign(new Error(code), { code }); |
| codeOf | function | 92 | no | const codeOf = (e) =&gt; typeof e?.code === &#39;string&#39; &amp;&amp; CODE.test(e.code) ? e.code : &#39;ORCHESTRATE_FAILED&#39;; |
| authBlocked | function | 93 | no | const authBlocked = (value) =&gt; value?.signedIn === false \|\| value?.authWall === true \|\| value?.authWall?.present === true |
| turnFor | function | 95 | no | const turnFor = (stored, key) =&gt; (Array.isArray(stored?.turns) ? stored.turns : stored?.turn ? [stored.turn] : []).find((turn) =&gt; turn?.key === key); |
| pidAlive | function | 96 | no | const pidAlive = (pid) =&gt; { |
| clip | function | 100 | no | const clip = (text, max) =&gt; text.length &lt;= max ? text : text.slice(0, max) + &#39;\\n…(shortened)&#39;; |
| iso | function | 101 | no | const iso = () =&gt; new Date().toISOString(); |
| msBetween | function | 102 | no | const msBetween = (a, b) =&gt; { const x = Date.parse(a ?? &#39;&#39;), y = Date.parse(b ?? &#39;&#39;); return Number.isFinite(x) &amp;&amp; Number.isFinite(y) &amp;&amp; y &gt;= x ? y - x : null; }; |
| looseJson | function | 103 | no | function looseJson(text) { |
| t | const | 104 | no | const t = String(text ?? &#39;&#39;).replace(/[\\u201c\\u201d]/g, &#39;&quot;&#39;).trim(); |
| start | const | 105 | no | const start = t.search(/[[{]/), end = Math.max(t.lastIndexOf(&#39;}&#39;), t.lastIndexOf(&#39;]&#39;)); |
| failureMessage | function | 110 | no | function failureMessage(code, label) { |
| validPlan | function | 126 | no | const validPlan = (plan, id) =&gt; plan?.schema === SCHEMA &amp;&amp; plan.id === id &amp;&amp; typeof plan.question === &#39;string&#39; &amp;&amp; typeof plan.state === &#39;string&#39; |
| createOrchestrator | function | 129 | yes | export function createOrchestrator({ paths, conversations, sleep = (ms) =&gt; new Promise((resolve) =&gt; { setTimeout(resolve, ms).unref?.(); }), timing = {}, onEvent = null } = {}) { |
| t | const | 131 | no | const t = { ...DEFAULT_TIMING, ...timing }; |
| directory | const | 132 | no | const directory = path.join(paths.root, &#39;orchestrate-plans&#39;); |
| token | const | 134 | no | const token = randomBytes(8).toString(&#39;hex&#39;); |
| plans | const | 136 | no | const plans = new Map(), running = new Map(), lastSaved = new Map(), signals = new Map(), cleanups = new Map(); |
| closed | variable | 137 | no | let closed = false; |
| tool | function | 138 | no | const tool = (name, args = {}) =&gt; executeConversationTool(conversations, name, args); |
| fileOf | function | 139 | no | const fileOf = (id) =&gt; path.join(directory, id + &#39;.json&#39;); |
| ours | function | 140 | no | const ours = (plan) =&gt; plan.ownerPid === process.pid &amp;&amp; plan.ownerToken === token; |
| byId | function | 141 | no | const byId = (plan, id) =&gt; plan.steps.find((s) =&gt; s.id === id); |
| done | function | 142 | no | const done = (step) =&gt; TERMINAL.has(step.state); |
| save | function | 145 | no | function save(plan) { // strict: callers that must not proceed on a failed write use this |
| file | const | 148 | no | const file = fileOf(plan.id), tmp = file + &#39;.&#39; + process.pid + &#39;.tmp&#39;; |
| persist | function | 152 | no | function persist(plan) { if (closed) return; try { save(plan); } catch (e) { console.warn(&#39;orchestrator: could not save plan&#39;, plan.id, e?.code ?? e?.message); } } |
| loadFromDisk | function | 153 | no | const loadFromDisk = (id) =&gt; { try { const plan = JSON.parse(readFileSync(fileOf(id), &#39;utf8&#39;)); return validPlan(plan, id) ? plan : null; } catch { return null; } }; |
| notify | function | 156 | no | function notify(plan) { const s = signals.get(plan.id); if (s) { signals.delete(plan.id); s(); } } |
| changed | function | 157 | no | const changed = (plan, ms) =&gt; new Promise((resolve) =&gt; { signals.set(plan.id, resolve); sleep(ms).then(resolve); }); |
| event | function | 158 | no | function event(plan, text, step = null) { |
| update | function | 166 | no | function update(plan, step, patch, { say = null, strict = false } = {}) { |
| finish | function | 175 | no | const finish = (plan, step, state, reason, message) =&gt; update(plan, step, { state, reason, message, endedAt: iso() }, { say: message }); |
| bounded | function | 178 | no | async function bounded(promise, ms = t.operationMs) { |
| timer | variable | 179 | no | let timer; |
| halted | function | 184 | no | const halted = (plan, step) =&gt; closed \|\| !ACTIVE.has(plan.state) \|\| done(step); |
| busy | function | 185 | no | async function busy(plan, step, fn) { |
| deadline | const | 186 | no | const deadline = Date.now() + t.busyMs, before = step.message; let delay = Math.min(2000, t.pollMs), waited = false; |
| out | const | 192 | no | const out = await fn(); |
| signedOut | function | 203 | no | async function signedOut(site) { // only explicit auth-wall evidence skips; the runtime&#39;s readiness stays authoritative |
| discovery | variable | 204 | no | let discovery; |
| entries | const | 207 | no | const entries = [...(discovery?.sites ?? []), ...(discovery?.targets ?? [])].filter((item) =&gt; (item?.site?.id ?? item?.site ?? item?.id) === site); |
| skipSignedOut | function | 210 | no | function skipSignedOut(plan, step) { |
| render | function | 216 | no | function render(plan, step) { |
| deps | const | 217 | no | const deps = step.after.map((id) =&gt; byId(plan, id)).filter((s) =&gt; s.state === &#39;ready&#39; &amp;&amp; s.valid); |
| candidates | const | 218 | no | const candidates = []; |
| prompt | const | 219 | no | const prompt = step.template.replace(/\\{\\{(question\|previous\|answers\|answer:s\\d{1,2})\\}\\}/g, (_, slot) =&gt; { if (slot === &#39;question&#39;) return plan.question; if (slot === &#39;previous&#39;) return clip(deps.at… |
| per | const | 223 | no | const per = Math.max(1500, Math.min(MAX_EMBED, Math.floor(MAX_PROMPT / Math.max(1, deps.length)))); |
| ref | const | 226 | no | const ref = byId(plan, slot.slice(7)); |
| isValid | function | 231 | no | const isValid = (plan, text) =&gt; !!text.trim() &amp;&amp; (plan.options.expect !== &#39;json&#39; \|\| looseJson(text) !== null); |
| decide | function | 234 | no | function decide(plan, step) { |
| w | const | 236 | no | const w = step.when ?? {}; |
| target | const | 238 | no | const target = byId(plan, w.hedge.step); |
| deps | const | 244 | no | const deps = step.after.map((id) =&gt; byId(plan, id)); |
| ready | const | 246 | no | const ready = deps.filter((d) =&gt; d.state === &#39;ready&#39; &amp;&amp; d.valid); |
| ref | const | 250 | no | const ref = byId(plan, w.skipIf.step); |
| startText | function | 255 | no | const startText = (step) =&gt; ({ answer: `Asking ${step.label}…`, synthesize: `Asking ${step.label} to combine the answers…`, judge: `Asking ${step.label} to pick the best answer…`, improve: `Asking ${… |
| maybeWin | function | 261 | no | function maybeWin(plan, step) { |
| acquireSite | function | 272 | no | async function acquireSite(plan, step) { |
| said | variable | 273 | no | let said = false; |
| released | variable | 281 | no | let released = false; |
| runStep | function | 285 | no | async function runStep(plan, step, resumed) { |
| ctx | const | 286 | no | const ctx = { pending: null, outcome: null, read: null }; |
| releaseSite | variable | 287 | no | let releaseSite = null, releaseLane = null; |
| stale | const | 301 | no | const stale = step.conversationId; step.conversationId = null; |
| created | const | 305 | no | const created = await busy(plan, step, () =&gt; { const call = tool(&#39;create_conversation&#39;, { site: step.site }); return bounded(call).catch((error) =&gt; { if (codeOf(error) === &#39;CONNECT_TIMEOUT&#39;) call.the… |
| call | const | 306 | no | const call = tool(&#39;create_conversation&#39;, { site: step.site }); |
| stored | const | 316 | no | const stored = await ctx.read(); |
| latest | const | 325 | no | const latest = await ctx.read(); |
| lane | const | 331 | no | const lane = releaseLane; releaseLane = null; |
| reason | const | 343 | no | const reason = codeOf(error); |
| work | function | 349 | no | const work = (async () =&gt; { if (ctx.pending &amp;&amp; !ctx.outcome) await Promise.race([ctx.pending, sleep(t.fenceMs)]); if (step.conversationId &amp;&amp; !closed) { await bounded(tool(&#39;finish_conversation&#39;, { con… |
| list | const | 356 | no | const list = cleanups.get(plan.id) ?? []; list.push(work); cleanups.set(plan.id, list); |
| observe | function | 363 | no | async function observe(plan, step, resumed, ctx) { |
| deadline | const | 366 | no | const deadline = resumed ? Date.now() + t.resumeMs : Math.min(Date.now() + t.replyMs, Date.parse(plan.deadlineAt) \|\| Infinity); |
| lastReconcile | variable | 367 | no | let lastReconcile = Date.now(), reconciles = 0, misses = 0; |
| settledBefore | const | 371 | no | const settledBefore = ctx.outcome; |
| stored | variable | 372 | no | let stored; |
| turn | const | 375 | no | const turn = turnFor(stored, step.key); |
| answer | const | 381 | no | const answer = typeof turn.reply?.text === &#39;string&#39; ? turn.reply.text : &#39;&#39;; |
| first | const | 383 | no | const first = !step.answer &amp;&amp; answer; |
| valid | const | 387 | no | const valid = isValid(plan, answer); |
| uncertain | const | 397 | no | const uncertain = turn.send?.state === &#39;uncertain&#39; \|\| [&#39;uncertain&#39;, &#39;needs-reconciliation&#39;].includes(turn.phase) \|\| stored.state === &#39;needs-reconciliation&#39;; |
| unwatched | const | 398 | no | const unwatched = turn.reply?.state === &#39;unknown&#39; &amp;&amp; turn.send?.state === &#39;observed&#39;; |
| choose | function | 410 | no | function choose(plan) { |
| rule | const | 411 | no | const rule = plan.choose, good = (id) =&gt; { const s = byId(plan, id); return s?.state === &#39;ready&#39; &amp;&amp; s.valid ? s : null; }; |
| earliest | function | 412 | no | const earliest = (ids) =&gt; ids.map(good).filter(Boolean).sort((a, b) =&gt; String(a.answeredAt).localeCompare(String(b.answeredAt)))[0] ?? null; |
| picked | variable | 414 | no | let picked = null, notes = null, summary = null; |
| answers | const | 416 | no | const answers = rule.steps.map(good).filter(Boolean).map((s) =&gt; ({ step: s.id, site: s.site, label: s.label, answer: s.answer })); |
| judge | const | 422 | no | const judge = good(rule.judge); |
| n | const | 423 | no | const n = judge ? Number(/WINNER\\s*:\\s*\\**\\s*(\\d+)/i.exec(judge.answer)?.[1]) : NaN; |
| check | const | 430 | no | const check = good(rule.check); |
| verdict | const | 432 | no | const verdict = /VERDICT\\s*:\\s*\\**\\s*(OK\|PROBLEMS)/i.exec(check.answer)?.[1]?.toUpperCase() ?? null; |
| finalize | function | 440 | no | function finalize(plan) { |
| result | const | 441 | no | const result = choose(plan); |
| has | const | 442 | no | const has = result.answer \|\| result.answers?.length; |
| problems | const | 443 | no | const problems = plan.steps.some((s) =&gt; s.state === &#39;failed&#39; \|\| (s.state === &#39;skipped&#39; &amp;&amp; s.reason === &#39;SIGNED_OUT&#39;) \|\| (s.state === &#39;ready&#39; &amp;&amp; !s.valid)); |
| expire | function | 452 | no | function expire(plan, inflight) { |
| runPlan | function | 459 | no | async function runPlan(plan, resumed) { |
| inflight | const | 460 | no | const inflight = new Map(); |
| verdict | const | 473 | no | const verdict = decide(plan, step); |
| launch | function | 493 | no | function launch(plan, resumed = false) { |
| work | const | 495 | no | const work = runPlan(plan, resumed).catch((e) =&gt; console.warn(&#39;orchestrator: plan stopped unexpectedly&#39;, plan.id, e?.code ?? e?.message)); |
| prune | function | 499 | no | function prune() { |
| finished | const | 500 | no | const finished = [...plans.values()].filter((p) =&gt; !ACTIVE.has(p.state) &amp;&amp; !running.has(p.id)).sort((a, b) =&gt; String(b.updatedAt).localeCompare(String(a.updatedAt))); |
| abandoned | function | 506 | no | const abandoned = (plan) =&gt; { |
| stepView | function | 513 | no | const stepView = (s) =&gt; ({ id: s.id, site: s.site, label: s.label, role: s.role, state: s.state, message: s.message, answer: s.answer, valid: s.valid, conversationId: s.conversationId, startedAt: s.s… |
| view | function | 516 | no | const view = (plan) =&gt; ({ id: plan.id, pattern: plan.pattern, requestedPattern: plan.requestedPattern ?? plan.pattern, title: PATTERNS[plan.requestedPattern === &#39;auto&#39; ? &#39;auto&#39; : plan.pattern]?.title… |
| tmp | const | 524 | no | const tmp = /^orc-[a-f0-9]{24}\\.json\\.(\\d+)\\.tmp$/.exec(file); |
| id | const | 526 | no | const id = file.replace(/\\.json$/, &#39;&#39;); |
| plan | const | 528 | no | const plan = loadFromDisk(id); // unreadable files stay on disk for support and are never replayed |
| need | function | 539 | no | function need(id) { |
| plan | variable | 541 | no | let plan = plans.get(id); |
| resolveAuto | function | 548 | no | async function resolveAuto(input) { |
| router | const | 549 | no | const router = await loadRouter(); |
| question | const | 553 | no | const question = typeof input.question === &#39;string&#39; ? input.question.trim() : &#39;&#39;; |
| options | const | 555 | no | const options = input.options &amp;&amp; typeof input.options === &#39;object&#39; &amp;&amp; !Array.isArray(input.options) ? input.options : {}; |
| providers | const | 557 | no | const providers = await router.learnInput({ paths, readTargets: async () =&gt; { let discovery = null; try { discovery = await bounded(tool(&#39;conversation_targets&#39;), t.probeMs); } catch { /* no browser: … |
| discovery | variable | 558 | no | let discovery = null; |
| targets | const | 560 | no | const targets = [], signedIn = {}; |
| site | const | 562 | no | const site = typeof item?.site === &#39;string&#39; ? item.site : item?.site?.id ?? item?.id; |
| decision | const | 569 | no | const decision = router.route({ task: question, role: options.role ?? null, constraints: options.constraints ?? {}, providers }); |
| plain | const | 570 | no | const plain = typeof router.explain === &#39;function&#39; ? router.explain(decision) : decision.reason; |
| pattern | const | 574 | no | const pattern = ROUTER_PATTERN[decision.pattern]; |
| sites | const | 576 | no | const sites = decision.sites.filter((site) =&gt; Object.hasOwn(SITE_LABELS, site)); |
| mapped | const | 579 | no | const mapped = pattern === &#39;judge&#39; ? { ...options, by: decision.options?.judgeSite ?? sites.at(-1) } : options; |
| createPlan | function | 592 | no | function createPlan(input, { routing = null } = {}) { |
| spec | const | 593 | no | const spec = buildPlanSpec(input); // throws ORCHESTRATE_INVALID for a bad pattern/question (no &#39;auto&#39;) |
| id | const | 594 | no | const id = &#39;orc-&#39; + randomBytes(12).toString(&#39;hex&#39;), now = Date.now(); |
| plan | const | 595 | no | const plan = { schema: SCHEMA, id, ownerPid: process.pid, ownerToken: token, fingerprint: null, |
| launch | function | 607 | no | function launch(plan, resumed = false) { |
| work | const | 609 | no | const work = runPlan(plan, resumed).catch((e) =&gt; console.warn(&#39;orchestrator: plan stopped unexpectedly&#39;, plan.id, e?.code ?? e?.message)); |
| appendStep | function | 613 | no | function appendStep(plan, { site, role, template, after = [], when = null, agent = false } = {}) { |
| stepId | const | 618 | no | const stepId = &#39;s&#39; + (plan.steps.length + 1); |
| step | const | 619 | no | const step = { id: stepId, site, label: SITE_LABELS[site], role, template: template.trim(), after: [...after], when, agent, |
| handlePlannerDecision | function | 632 | no | function handlePlannerDecision(plan, step) { |
| decision | variable | 634 | no | let decision; |
| wantsAuto | const | 652 | no | const wantsAuto = input?.pattern === &#39;auto&#39;; |
| planInput | variable | 653 | no | let planInput, spec, routing = null; |
| resolved | const | 656 | no | const resolved = await resolveAuto(input); |
| fingerprint | const | 670 | no | const fingerprint = JSON.stringify([wantsAuto ? &#39;auto&#39; : spec.pattern, spec.question, spec.sites, spec.options]); |
| existing | const | 671 | no | const existing = [...plans.values()].find((p) =&gt; ACTIVE.has(p.state) &amp;&amp; p.fingerprint === fingerprint); |
| id | const | 673 | no | const id = &#39;orc-&#39; + randomBytes(12).toString(&#39;hex&#39;), now = Date.now(); |
| plan | const | 689 | no | const plan = need(id); |
| answered | const | 698 | no | const answered = plan.steps.filter((s) =&gt; s.state === &#39;ready&#39; &amp;&amp; s.valid); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 24 | external |
| node:crypto | import | 25 | external |
| node:fs | import | 26 | external |
| ./conversation-tools.mjs | import | 27 | [studio/src/studio/conversation-tools.mjs](./conversation-tools.mjs.md) |
| ./http.mjs | import | 28 | [studio/src/studio/http.mjs](./http.mjs.md) |
| ./orchestrator-patterns.mjs | import | 29 | [studio/src/studio/orchestrator-patterns.mjs](./orchestrator-patterns.mjs.md) |
| ./orchestrator-patterns.mjs | export_from | 31 | [studio/src/studio/orchestrator-patterns.mjs](./orchestrator-patterns.mjs.md) |
| ./ai-router.mjs | dynamic | 80 | [studio/src/studio/ai-router.mjs](./ai-router.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/orchestrator-routes.mjs](./orchestrator-routes.mjs.md) | ./ai-orchestrator.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Central multi-AI orchestrator: ONE engine that every multi-site flow can use instead of each job
// runner re-implementing create → submit → observe → reconcile → finish. Plans are built by the pure
// builders in ./orchestrator-patterns.mjs (single, fan-out, race, fallback, hedge, council, judge,
// relay, critique-revise, verify) and run here through the ONE shared conversation runtime.
//
// Safety contract (same as compare-service.mjs, enforced in one place):
//  - One stable key per step: `<plan id>-<step id>`, assigned when the plan is created and never
//    regenerated. The rendered prompt is persisted BEFORE `attempted` is saved, and `attempted` is
//    saved (strictly — a failed write means nothing is sent) BEFORE submit. A step that is attempted
//    is only ever observed or reconciled read-only afterwards; it is never submitted again.
//  - One shared browser: a process-wide FIFO "browser lane" serializes every lease-holding phase
//    (create tab → readiness → type → submit) across ALL plans in this Studio. The lane is released as
//    soon as the runtime acknowledges the submit (or after fenceMs if that never settles), so reply
//    observation — plain stored-conversation reads — runs concurrently for every step.
//  - One tab-turn per site at a time: a step never starts on a site whose earlier turn (any plan in
//    this process) is still being answered.
//  - "Cancel", "race lost" and "deadline" only STOP WAITING. A question already sent stays sent and
//    may still finish in its tab; a question not yet sent is never sent.
//  - Restart: a plan whose owner process is gone is resumed. Attempted steps are observed only
//    (stored conversation + capped read-only reconcile); never-attempted steps may still be asked
//    (nothing was ever typed for them) unless the plan's deadline has passed.
//  - Never freeze: every wait sleeps on an unref'd timer and every runtime call is time-bounded.
//  - Plain language: user-facing messages never contain raw codes; codes stay in `reason`.
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { executeConversationTool } from './conversation-tools.mjs';
import { problem } from './http.mjs';
import { SITE_LABELS, PATTERNS, PATTERN_NAMES, PATTERN_CHOICES, STEP_ROLES, MAX_STEPS, buildPlanSpec, describeResult, parsePlannerReply } from './orchestrator-patterns.mjs';

export { PATTERNS, PATTERN_NAMES, PATTERN_CHOICES, STEP_ROLES } from './orchestrator-patterns.mjs';
const SCHEMA = 'vivim.orchestrate/1';
const ID = /^orc-[a-f0-9]{24}$/;
const CODE = /^[A-Z][A-Z0-9_]{1,79}$/;
const ACTIVE = new Set(['queued', 'running']);
const TERMINAL = new Set(['ready', 'failed', 'skipped', 'stopped', 'cancelled']);
const BUSY = new Set(['DRIVE_LEASE_BUSY', 'THREAD_JOURNAL_BUSY', 'PREFIX_WRITER_BUSY', 'WRITER_WINDOW_BUSY']);
const MAX_KEPT = 60, MAX_EVENTS = 80;
const MAX_EMBED = 8000, MAX_PROMPT = 40000; // other AIs' answers embedded in a follow-up prompt
const LIVE_OWNERS = new Set(); // tokens of orchestrators alive in THIS process (PID-reuse guard)
const DEFAULT_TIMING = Object.freeze({
  pollMs: 2500, tickMs: 1000,
  busyMs: 180000,       // how long a busy browser is waited out (same key, backoff)
  replyMs: 600000,      // patience for one reply (also capped by the plan deadline)
  resumeMs: 180000,     // patience for a reply observed only after a VIVIM restart
  operationMs: 300000,  // ceiling for one awaited runtime call (the call itself keeps running)
  probeMs: 15000,       // ceiling for the browser target listing
  reconcileMs: 10000, maxReconciles: 8,
  fenceMs: 600000,      // how long the browser lane stays fenced behind a submit that never settles
  heartbeatMs: 60000, staleMs: 900000,
});

// ---------------------------------------------------------------------------------------------
// Process-wide scheduler. Shared by every orchestrator instance (and available to other runners)
// so two plans can never type into the one shared browser at the same time.
const LANE = { tail: Promise.resolve(), holders: 0, waiting: 0 };
export function acquireBrowserLane() {
  let open;
  const gate = new Promise((resolve) => { open = resolve; });
  const previous = LANE.tail;
  LANE.tail = previous.then(() => gate);
  LANE.waiting++;
  return previous.then(() => {
    LANE.waiting--; LANE.holders++;
    let released = false;
    return () => { if (!released) { released = true; LANE.holders--; open(); } };
  });
}
const SITE_TURNS = new Map(); // site -> number of turns in flight (0 or 1 in practice)
export const schedulerState = () => ({ laneHeld: LANE.holders > 0, laneWaiting: LANE.waiting,
  sitesBusy: [...SITE_TURNS.entries()].filter(([, n]) => n > 0).map(([site]) => site) });

// ---- auto routing seam ---------------------------------------------------------------------
// src/studio/ai-router.mjs (owned by its own lane) decides pattern + sites + plain-language reason.
// Loaded lazily and tolerantly: if it is missing or broken, Studio still boots and every explicit
// pattern keeps working; only `pattern: "auto"` reports that the chooser is unavailable.
let routerModule;
async function loadRouter() {
  if (routerModule !== undefined) return routerModule;
  try { routerModule = await import('./ai-router.mjs'); } catch (e) {
```

_First 80 of 724 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
