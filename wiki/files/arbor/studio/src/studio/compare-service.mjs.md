# File: studio/src/studio/compare-service.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/compare-service.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 27284 B |
| Lines | 404 |
| Hash | 04ebc1cf43cb |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SCHEMA | const | 26 | no | const SCHEMA = &#39;vivim.compare/1&#39;; |
| LABELS | const | 30 | no | const LABELS = { chatgpt: &#39;ChatGPT&#39;, claude: &#39;Claude&#39;, zai: &#39;Z.ai&#39;, qwen: &#39;Qwen&#39;, deepseek: &#39;DeepSeek&#39;, gemini: &#39;Gemini&#39; }; |
| COMPARE_SITES | const | 31 | yes | export const COMPARE_SITES = Object.keys(LABELS); |
| MAX_SITES | const | 32 | no | const MAX_SITES = COMPARE_SITES.length; |
| ID | const | 33 | no | const ID = /^cmp-[a-f0-9]{24}$/; |
| CODE | const | 34 | no | const CODE = /^[A-Z][A-Z0-9_]{1,79}$/; |
| ACTIVE | const | 35 | no | const ACTIVE = new Set([&#39;queued&#39;, &#39;running&#39;]); |
| DONE | const | 36 | no | const DONE = new Set([&#39;ready&#39;, &#39;skipped&#39;, &#39;failed&#39;, &#39;cancelled&#39;]); |
| BUSY | const | 37 | no | const BUSY = new Set([&#39;DRIVE_LEASE_BUSY&#39;, &#39;THREAD_JOURNAL_BUSY&#39;, &#39;PREFIX_WRITER_BUSY&#39;, &#39;WRITER_WINDOW_BUSY&#39;]); |
| MAX_KEPT | const | 38 | no | const MAX_KEPT = 40; |
| LIVE_OWNERS | const | 39 | no | const LIVE_OWNERS = new Set(); // Tokens of compare managers alive in THIS process (PID-reuse guard). |
| DEFAULT_TIMING | const | 40 | no | const DEFAULT_TIMING = Object.freeze({ pollMs: 2500, // stored-conversation poll interval busyMs: 180000, // how long a busy browser is waited out (same key, backoff) replyMs: 600000, // total patien… |
| coded | function | 54 | no | const coded = code =&gt; Object.assign(new Error(code), { code }); |
| codeOf | function | 55 | no | const codeOf = e =&gt; typeof e?.code === &#39;string&#39; &amp;&amp; CODE.test(e.code) ? e.code : &#39;COMPARE_FAILED&#39;; |
| authBlocked | function | 56 | no | const authBlocked = value =&gt; value?.signedIn === false \|\| value?.authWall === true \|\| value?.authWall?.present === true |
| turnFor | function | 58 | no | const turnFor = (stored, key) =&gt; (Array.isArray(stored?.turns) ? stored.turns : stored?.turn ? [stored.turn] : []).find(turn =&gt; turn?.key === key); |
| pidAlive | function | 59 | no | const pidAlive = pid =&gt; { |
| validJob | function | 63 | no | const validJob = (job, id) =&gt; job?.schema === SCHEMA &amp;&amp; job.id === id &amp;&amp; typeof job.question === &#39;string&#39; &amp;&amp; typeof job.state === &#39;string&#39; |
| message | function | 67 | no | function message(code, site) { |
| label | const | 68 | no | const label = LABELS[site]; |
| createCompareJobs | function | 85 | yes | export function createCompareJobs({ paths, conversations, sleep = ms =&gt; new Promise(resolve =&gt; { setTimeout(resolve, ms).unref?.(); }), timing = {} } = {}) { |
| t | const | 87 | no | const t = { ...DEFAULT_TIMING, ...timing }; |
| directory | const | 88 | no | const directory = path.join(paths.root, &#39;compare-jobs&#39;); |
| token | const | 90 | no | const token = randomBytes(8).toString(&#39;hex&#39;); |
| jobs | const | 92 | no | const jobs = new Map(), running = new Map(), lastSaved = new Map(); |
| queue | variable | 93 | no | let queue = Promise.resolve(); // All jobs AND providers share one sequential browser lane. |
| tool | function | 94 | no | const tool = (name, args = {}) =&gt; executeConversationTool(conversations, name, args); |
| fileOf | function | 95 | no | const fileOf = id =&gt; path.join(directory, id + &#39;.json&#39;); |
| ours | function | 96 | no | const ours = job =&gt; job.ownerPid === process.pid &amp;&amp; job.ownerToken === token; |
| save | function | 99 | no | function save(job) { |
| file | const | 101 | no | const file = fileOf(job.id), tmp = file + &#39;.&#39; + process.pid + &#39;.tmp&#39;; |
| persist | function | 107 | no | function persist(job) { try { save(job); } catch (e) { console.warn(&#39;compare: could not save job&#39;, job.id, e?.code ?? e?.message); } } |
| heartbeat | function | 108 | no | const heartbeat = job =&gt; { if (Date.now() - (lastSaved.get(job.id) ?? 0) &gt;= t.heartbeatMs) persist(job); }; |
| loadFromDisk | function | 109 | no | const loadFromDisk = id =&gt; { try { const job = JSON.parse(readFileSync(fileOf(id), &#39;utf8&#39;)); return validJob(job, id) ? job : null; } catch { return null; } }; |
| view | function | 111 | no | const view = job =&gt; ({ id: job.id, question: job.question, sites: job.sites, state: job.state, createdAt: job.createdAt, updatedAt: job.updatedAt, results: job.results.map(({ key, attempted, reason, … |
| checkCancel | function | 114 | no | const checkCancel = job =&gt; { if (job.state === &#39;cancelled&#39;) throw Object.assign(new Error(&#39;Cancelled&#39;), { cancelled: true }); }; |
| bounded | function | 117 | no | async function bounded(promise, ms = t.operationMs) { |
| timer | variable | 118 | no | let timer; |
| busy | function | 125 | no | async function busy(job, result, fn) { |
| deadline | const | 126 | no | const deadline = Date.now() + t.busyMs, before = result.message; let delay = Math.min(2000, t.pollMs), waited = false; |
| out | const | 130 | no | const out = await fn(); |
| signedOut | function | 142 | no | async function signedOut(site) { |
| discovery | variable | 143 | no | let discovery; |
| entries | const | 146 | no | const entries = [...(discovery?.sites ?? []), ...(discovery?.targets ?? [])].filter(item =&gt; (item?.site?.id ?? item?.site ?? item?.id) === site); |
| skip | function | 149 | no | function skip(job, result) { |
| others | const | 150 | no | const others = job.sites.filter(site =&gt; site !== result.site).map(site =&gt; LABELS[site]); |
| create | function | 158 | no | async function create(job, result) { |
| call | const | 160 | no | const call = tool(&#39;create_conversation&#39;, { site: result.site }); |
| reconcileTail | variable | 171 | no | let reconcileTail = Promise.resolve(); |
| reconcile | function | 172 | no | function reconcile(args) { |
| run | const | 173 | no | const run = reconcileTail.then(() =&gt; bounded(tool(&#39;reconcile_conversation&#39;, args), t.reconcileCallMs)); |
| cleanup | function | 181 | no | async function cleanup(result, ctx) { |
| ask | function | 193 | no | async function ask(job, result, resume) { |
| label | const | 194 | no | const label = LABELS[result.site]; |
| ctx | const | 195 | no | const ctx = { pending: null, outcome: null }; |
| observeOnly | const | 196 | no | const observeOnly = Boolean(resume) &amp;&amp; result.attempted; // Attempted before a restart: never typed again. |
| handedOff | variable | 197 | no | let handedOff = false; |
| old | const | 206 | no | const old = result.conversationId; result.conversationId = null; result.turnId = null; persist(job); |
| created | const | 216 | no | const created = await create(job, result); |
| read | function | 221 | no | const read = () =&gt; bounded(tool(&#39;get_conversation&#39;, { conversation: result.conversationId })); |
| stored | variable | 222 | no | let stored = await read(); |
| latest | const | 231 | no | const latest = await read(); |
| observe | function | 255 | no | async function observe(job, result, { read, ctx, resumed }) { |
| label | const | 256 | no | const label = LABELS[result.site]; |
| deadline | const | 258 | no | const deadline = Date.now() + (resumed ? t.resumeMs : t.replyMs); |
| stored | variable | 259 | no | let stored, lastReconcile = Date.now(), reconciles = 0, misses = 0; |
| settledBefore | const | 263 | no | const settledBefore = ctx.outcome; // Only an outcome known BEFORE this read may end the wait. |
| turn | const | 267 | no | const turn = turnFor(stored, result.key); |
| answer | const | 274 | no | const answer = typeof turn.reply?.text === &#39;string&#39; ? turn.reply.text : &#39;&#39;; |
| uncertain | const | 282 | no | const uncertain = turn.send?.state === &#39;uncertain&#39; \|\| [&#39;uncertain&#39;, &#39;needs-reconciliation&#39;].includes(turn.phase) \|\| stored.state === &#39;needs-reconciliation&#39;; |
| unwatched | const | 283 | no | const unwatched = turn.reply?.state === &#39;unknown&#39; &amp;&amp; turn.send?.state === &#39;observed&#39;; |
| execute | function | 299 | no | async function execute(job, resume) { |
| handoffs | const | 300 | no | const handoffs = [], watching = []; |
| handoff | const | 310 | no | const handoff = await ask(job, result, resume); |
| launch | function | 327 | no | function launch(job, resume = false) { |
| work | const | 329 | no | const work = queue.then(() =&gt; execute(job, resume)); |
| prune | function | 334 | no | function prune() { |
| done | const | 335 | no | const done = [...jobs.values()].filter(job =&gt; !ACTIVE.has(job.state) &amp;&amp; !running.has(job.id)) |
| abandoned | function | 346 | no | const abandoned = job =&gt; { |
| tmp | const | 353 | no | const tmp = /^cmp-[a-f0-9]{24}\\.json\\.(\\d+)\\.tmp$/.exec(file); |
| id | const | 355 | no | const id = file.replace(/\\.json$/, &#39;&#39;); |
| job | const | 357 | no | const job = loadFromDisk(id); // Unreadable files stay on disk for support and are never replayed. |
| resume | const | 360 | no | const resume = ACTIVE.has(job.state) ? abandoned(job) : null; |
| need | function | 365 | no | function need(id) { |
| job | variable | 367 | no | let job = jobs.get(id); |
| text | const | 375 | no | const text = typeof question === &#39;string&#39; ? question.trim() : &#39;&#39;; |
| existing | const | 379 | no | const existing = [...jobs.values()].find(job =&gt; ACTIVE.has(job.state) &amp;&amp; job.question === text &amp;&amp; JSON.stringify(job.sites) === JSON.stringify(sites)); |
| id | const | 381 | no | const id = &#39;cmp-&#39; + randomBytes(12).toString(&#39;hex&#39;), behind = running.size &gt; 0; |
| job | const | 382 | no | const job = { schema: SCHEMA, id, ownerPid: process.pid, ownerToken: token, question: text, sites: [...sites], |
| job | const | 393 | no | const job = need(id); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 20 | external |
| node:crypto | import | 21 | external |
| node:fs | import | 22 | external |
| ./conversation-tools.mjs | import | 23 | [studio/src/studio/conversation-tools.mjs](./conversation-tools.mjs.md) |
| ./http.mjs | import | 24 | [studio/src/studio/http.mjs](./http.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/compare-routes.mjs](./compare-routes.mjs.md) | ./compare-service.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Compare through the ONE conversation runtime. Never construct a browser or repeat an uncertain send.
//  - Fan-out: phase 1 asks every selected site in turn (create/ready/submit), holding the browser only
//    as the runtime's drive lease already does (busy() backs off on DRIVE_LEASE_BUSY exactly as before).
//    Each site's phase-2 observe loop starts the moment its ask hands off, so it runs concurrently with
//    the remaining asks and with every other observe. One site's long answer never delays another's,
//    and an uncertain site can be reconciled (lease-free) while the next site waits for the lease.
//  - One stable key per provider (job id + site). It is never replaced, so a timeout or unknown effect
//    can only be observed again, never resent. `attempted` is saved BEFORE submit.
//  - After a restart, a site that was attempted is only ever observed (stored conversation + capped
//    read-only reconcile). A site never attempted (nothing typed, proven by the strict pre-submit save)
//    is asked fresh, but only when the previous owner is provably dead and the job is recent.
//  - All jobs share one sequential lane (this module's own queue). The job's terminal state is computed
//    only after EVERY observe loop settled; the lane then stays fenced (bounded by fenceMs) behind any
//    submit that never settled, and each handed-off site is cleaned up exactly once, after its observe.
//  - Persistence: save() is synchronous write+rename of the full in-memory job on one thread, so the
//    concurrent observe loops can never interleave writes or lose another site's update.
//  - Never freeze: every wait sleeps on an unref'd timer, every runtime call is time-bounded, and the
//    read-only reconcile (it inspects the browser) is reserved for genuinely uncertain or unwatched turns,
//    capped per site and serialized across sites so six sites never inspect the browser at once.
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { executeConversationTool } from './conversation-tools.mjs';
import { problem } from './http.mjs';

const SCHEMA = 'vivim.compare/1';
// Every site here must also be accepted by conversation-api.mjs's 'create' fresh-conversation gate
// (src/studio/conversation-api.mjs) and have a working adapter in src/profiles/sites. Owner's four
// signed-in accounts (2026-10-30): ChatGPT, Claude, Z.ai, Qwen.
const LABELS = { chatgpt: 'ChatGPT', claude: 'Claude', zai: 'Z.ai', qwen: 'Qwen', deepseek: 'DeepSeek', gemini: 'Gemini' };
export const COMPARE_SITES = Object.keys(LABELS);
const MAX_SITES = COMPARE_SITES.length;
const ID = /^cmp-[a-f0-9]{24}$/;
const CODE = /^[A-Z][A-Z0-9_]{1,79}$/;
const ACTIVE = new Set(['queued', 'running']);
const DONE = new Set(['ready', 'skipped', 'failed', 'cancelled']);
const BUSY = new Set(['DRIVE_LEASE_BUSY', 'THREAD_JOURNAL_BUSY', 'PREFIX_WRITER_BUSY', 'WRITER_WINDOW_BUSY']);
const MAX_KEPT = 40;
const LIVE_OWNERS = new Set(); // Tokens of compare managers alive in THIS process (PID-reuse guard).
const DEFAULT_TIMING = Object.freeze({
  pollMs: 2500,          // stored-conversation poll interval
  busyMs: 180000,        // how long a busy browser is waited out (same key, backoff)
  replyMs: 600000,       // total patience for a provider reply
  resumeMs: 120000,      // patience for a reply observed only after a VIVIM restart
  operationMs: 300000,   // ceiling for one awaited runtime call (the call itself keeps running)
  probeMs: 15000,        // ceiling for the browser target listing
  reconcileMs: 10000, maxReconciles: 8, // min interval between reconciles of one site, and per-site cap
  reconcileCallMs: 60000, // ceiling for one awaited read-only reconcile
  resumeAskMs: 1800000,  // after a restart, a never-attempted site is asked only if the job is this recent
  fenceMs: 600000,       // how long the shared lane stays fenced behind a submit that never settles
  heartbeatMs: 60000, staleMs: 900000, // a running job last saved this long ago by a live pid is stale
});

const coded = code => Object.assign(new Error(code), { code });
const codeOf = e => typeof e?.code === 'string' && CODE.test(e.code) ? e.code : 'COMPARE_FAILED';
const authBlocked = value => value?.signedIn === false || value?.authWall === true || value?.authWall?.present === true
  || /AUTH_WALL|SIGN_IN_REQUIRED|SIGNED_OUT|LOGIN_REQUIRED/.test(String(value?.reason ?? value?.readiness?.reason ?? value?.code ?? ''));
const turnFor = (stored, key) => (Array.isArray(stored?.turns) ? stored.turns : stored?.turn ? [stored.turn] : []).find(turn => turn?.key === key);
const pidAlive = pid => {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch (e) { return e.code !== 'ESRCH'; }
};
const validJob = (job, id) => job?.schema === SCHEMA && job.id === id && typeof job.question === 'string' && typeof job.state === 'string'
  && Array.isArray(job.results) && job.results.length >= 1 && job.results.length <= MAX_SITES
  && job.results.every(r => Object.hasOwn(LABELS, r?.site) && r.key === id + '-' + r.site && typeof r.state === 'string');

function message(code, site) {
  const label = LABELS[site];
  if (BUSY.has(code)) return 'Your AI browser stayed busy with another conversation. Nothing was sent to ' + label + '. Try again when it finishes.';
  switch (code) {
    case 'REPLY_TIMEOUT': return label + ' is taking longer than expected. Nothing was sent twice. Check its tab before starting another question.';
    case 'RESUMED_UNFINISHED': return 'VIVIM restarted while ' + label + ' was answering. Nothing was sent twice. Check its tab for the full answer.';
    case 'INTERRUPTED': return 'VIVIM restarted before sending this question to ' + label + '. Start a new comparison when you are ready.';
    case 'BROWSER_UNAVAILABLE': return 'Open your VIVIM AI browser, then try again.';
    case 'CONNECT_TIMEOUT': return 'Could not open ' + label + ' in time. Nothing was sent. Check that your VIVIM AI browser is open, then try again.';
    case 'REPLY_INTERRUPTED': return label + ' stopped before finishing its answer. Nothing was repeated. Check its tab.';
    case 'TURN_NOT_FOUND': case 'DELIVERY_UNCONFIRMED': case 'CREATION_UNPINNED':
      return 'Could not confirm that ' + label + ' received your question, so nothing was repeated. Check its tab before asking again.';
    default:
      if (/DRAFT|TYPING/.test(code)) return 'Check the ' + label + ' tab for unsent text. Clear it before trying again.';
```

_First 80 of 405 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
