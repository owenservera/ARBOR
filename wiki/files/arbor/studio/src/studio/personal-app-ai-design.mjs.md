# File: studio/src/studio/personal-app-ai-design.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/personal-app-ai-design.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 25186 B |
| Lines | 391 |
| Hash | de44f3364ec5 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| AI_DESIGN_JOB_SCHEMA | const | 24 | yes | export const AI_DESIGN_JOB_SCHEMA = &#39;vivim.personal-app-ai-job/1&#39;; |
| AI_DESIGN_SITES | const | 27 | yes | export const AI_DESIGN_SITES = CREATE_SITES; |
| SITE_LABEL | const | 28 | no | const SITE_LABEL = { chatgpt: &#39;ChatGPT&#39;, claude: &#39;Claude&#39;, zai: &#39;Z.ai&#39;, qwen: &#39;Qwen&#39;, deepseek: &#39;DeepSeek&#39;, gemini: &#39;Gemini&#39; }; |
| SITE_LIST_TEXT | const | 29 | no | const SITE_LIST_TEXT = CREATE_SITES.map(site =&gt; SITE_LABEL[site] ?? site).join(&#39;, &#39;); |
| JOB_ID | const | 30 | no | const JOB_ID = /^aid-[a-f0-9]{24}$/; |
| ACTIVE | const | 31 | no | const ACTIVE = new Set([&#39;queued&#39;, &#39;asking&#39;, &#39;waiting-reply&#39;]); |
| TERMINAL | const | 32 | no | const TERMINAL = new Set([&#39;ready-to-review&#39;, &#39;applied&#39;, &#39;discarded&#39;, &#39;failed&#39;]); |
| BUSY_CODES | const | 33 | no | const BUSY_CODES = new Set([&#39;DRIVE_LEASE_BUSY&#39;, &#39;THREAD_JOURNAL_BUSY&#39;, &#39;PREFIX_WRITER_BUSY&#39;, &#39;WRITER_WINDOW_BUSY&#39;]); |
| NO_RETRY | const | 34 | no | const NO_RETRY = /^(INVALID_\|CONFIRM_REQUIRED\|IDEMPOTENCY_CONFLICT\|CONVERSATION_(FINISHED\|NOT_WRITABLE\|NOT_FOUND\|OWNED_BY_ANOTHER_RUNTIME)\|THREAD_(FENCED\|IDENTITY_UNVERIFIED)\|PREFIX_\|CREATION_UNCERTA… |
| MAX_KEPT_JOBS | const | 35 | no | const MAX_KEPT_JOBS = 40; |
| DEFAULT_TIMING | const | 36 | no | const DEFAULT_TIMING = Object.freeze({ pollMs: 2500, // stored-conversation poll interval leaseBudgetMs: 180000, // how long a busy browser is waited out (same key, backoff) submitCeilingMs: 300000, … |
| codeOf | function | 45 | no | const codeOf = error =&gt; { |
| isBusy | function | 50 | no | const isBusy = error =&gt; BUSY_CODES.has(codeOf(error)); |
| friendly | function | 53 | no | function friendly(code, site) { |
| ai | const | 54 | no | const ai = SITE_LABEL[site] ?? &#39;your AI&#39;; |
| readableLine | function | 75 | no | const readableLine = value =&gt; typeof value === &#39;string&#39; ? value.replace(/[\\u0000-\\u001F\\u007F]+/g, &#39; &#39;).replace(/\\s+/g, &#39; &#39;).trim() : &#39;&#39;; |
| clip | function | 77 | no | const clip = (value, max) =&gt; { const line = readableLine(value); return line.length &gt; max ? line.slice(0, max - 1) + &#39;…&#39; : line; }; |
| buildAiDesignPrompt | function | 82 | yes | export function buildAiDesignPrompt({ app, request }) { |
| screens | const | 83 | no | const screens = app.screens.map(s =&gt; clip(s.label, 40) + &#39; (&#39; + s.kind + &#39;)&#39;).join(&#39;, &#39;); |
| wish | const | 84 | no | const wish = request ? clip(request, 500) : &#39;Nothing specific, suggest the most useful 1 to 3 extra screens.&#39;; |
| shape | const | 85 | no | const shape = JSON.stringify({ schema: PERSONAL_APP_CHANGE_SCHEMA, appId: app.id, baseVersion: app.version, operations: [{ type: &#39;add-screen&#39;, kind: &#39;notes&#39;, label: &#39;Study Notes&#39; }] }); |
| createAiDesignJobs | function | 96 | yes | export function createAiDesignJobs({ apps, conversations, providerReply, paths, clock = () =&gt; new Date().toISOString(), sleep = ms =&gt; new Promise(resolve =&gt; { setTimeout(resolve, ms).unref?.(); }), t… |
| t | const | 103 | no | const t = { ...DEFAULT_TIMING, ...timing }; |
| reply | const | 104 | no | const reply = providerReply ?? createProviderReplyBuilder({ apps, readStoredConversation: id =&gt; executeConversationTool(conversations, &#39;get_conversation&#39;, { conversation: id }) }); |
| directory | const | 106 | no | const directory = path.join(paths.root, &#39;personal-app-ai-jobs&#39;); |
| jobs | const | 108 | no | const jobs = new Map(); // id -&gt; job (authoritative in-process copy) |
| running | const | 109 | no | const running = new Map(); // id -&gt; promise of the background runner |
| approving | const | 110 | no | const approving = new Set(); |
| tool | function | 111 | no | const tool = (name, args) =&gt; executeConversationTool(conversations, name, args); |
| fileOf | function | 113 | no | const fileOf = id =&gt; path.join(directory, id + &#39;.json&#39;); |
| save | function | 114 | no | function save(job) { |
| target | const | 116 | no | const target = fileOf(job.id), tmp = target + &#39;.&#39; + process.pid + &#39;.tmp&#39;; |
| loadFromDisk | function | 120 | no | function loadFromDisk(id) { |
| job | const | 122 | no | const job = JSON.parse(readFileSync(fileOf(id), &#39;utf8&#39;)); |
| alive | function | 126 | no | const alive = pid =&gt; { try { process.kill(pid, 0); return true; } catch (e) { return e.code !== &#39;ESRCH&#39;; } }; |
| publicJob | function | 129 | no | const publicJob = job =&gt; ({ id: job.id, appId: job.appId, site: job.site, siteLabel: SITE_LABEL[job.site], request: job.request, state: job.state, waitingOn: job.waitingOn ?? null, baseVersion: job.b… |
| setState | function | 135 | no | const setState = (job, state, extra = {}) =&gt; { |
| cancelled | function | 140 | no | const cancelled = job =&gt; job.state === &#39;discarded&#39;; |
| stop | function | 141 | no | const stop = () =&gt; Object.assign(new Error(&#39;AI_DESIGN_CANCELLED&#39;), { code: &#39;AI_DESIGN_CANCELLED&#39;, cancelled: true }); |
| waitOutBusy | function | 144 | no | async function waitOutBusy(job, fn) { |
| started | const | 145 | no | const started = Date.now(); let delay = 2000; |
| out | const | 149 | no | const out = await fn(); |
| readStored | function | 159 | no | const readStored = job =&gt; tool(&#39;get_conversation&#39;, { conversation: job.conversationId }); |
| turnByKey | function | 160 | no | const turnByKey = (stored, key) =&gt; (Array.isArray(stored?.turns) ? stored.turns : []).find(turn =&gt; turn?.key === key) ?? null; |
| ensureConversation | function | 163 | no | async function ensureConversation(job, resumed) { |
| created | const | 169 | no | const created = await waitOutBusy(job, () =&gt; tool(&#39;create_conversation&#39;, { site: job.site })); |
| retryable | const | 173 | no | const retryable = [&#39;CONNECT_TIMEOUT&#39;, &#39;BROWSER_UNAVAILABLE&#39;].includes(codeOf(error)) \|\| error?.status &gt;= 500; |
| ensureSubmitted | function | 182 | no | async function ensureSubmitted(job, resumed) { |
| prompt | const | 184 | no | const prompt = job.prompt; // Frozen at start: the same key must always carry byte-identical text. |
| stored | const | 187 | no | const stored = await readStored(job); |
| existing | const | 188 | no | const existing = turnByKey(stored, job.key); |
| outcome | variable | 196 | no | let outcome; |
| submitting | const | 197 | no | const submitting = waitOutBusy(job, () =&gt; tool(&#39;submit_conversation_turn&#39;, { conversation: job.conversationId, key: job.key, prompt, confirm: true, expectedRevision: stored.revision })) |
| watching | variable | 200 | no | let watching = true; |
| watcher | function | 201 | no | const watcher = (async () =&gt; { const started = Date.now(); while (watching &amp;&amp; Date.now() - started &lt; t.submitCeilingMs) { await sleep(t.pollMs); if (!watching) break; |
| started | const | 202 | no | const started = Date.now(); |
| seen | const | 206 | no | const seen = turnByKey(await readStored(job).catch(() =&gt; null), job.key); |
| failure | variable | 215 | no | let failure = null; |
| after | const | 221 | no | const after = turnByKey(await readStored(job).catch(() =&gt; null), job.key); |
| code | const | 223 | no | const code = codeOf(outcome.error); |
| waitForReply | function | 229 | no | async function waitForReply(job, { inFlight, failure } = {}) { |
| deadline | const | 230 | no | const deadline = Date.now() + t.replyTimeoutMs; |
| reconciles | variable | 231 | no | let reconciles = 0, lastReconcile = Date.now(), tolerated = 0; |
| stored | variable | 235 | no | let stored; |
| turn | const | 238 | no | const turn = turnByKey(stored, job.key); |
| failed | const | 240 | no | const failed = failure?.(); |
| state | const | 246 | no | const state = turn.reply?.state; |
| uncertain | const | 252 | no | const uncertain = turn.send?.state === &#39;uncertain&#39; \|\| [&#39;uncertain&#39;, &#39;needs-reconciliation&#39;].includes(turn.phase) \|\| stored.state === &#39;needs-reconciliation&#39;; |
| unwatched | const | 253 | no | const unwatched = state === &#39;unknown&#39; &amp;&amp; turn.send?.state === &#39;observed&#39;; |
| reason | const | 261 | no | const reason = /^[A-Z][A-Z0-9_]{1,79}$/.test(turn.reason ?? &#39;&#39;) ? turn.reason : &#39;DELIVERY_UNCONFIRMED&#39;; |
| compile | function | 268 | no | async function compile(job) { |
| preview | const | 269 | no | const preview = await reply.preview({ id: job.appId, conversation: job.conversationId, turnId: job.turnId }); |
| execute | function | 276 | no | async function execute(job, resumed) { |
| mode | const | 280 | no | const mode = await ensureSubmitted(job, resumed); |
| code | const | 288 | no | const code = codeOf(error); |
| launch | function | 292 | no | function launch(job, resumed = false) { |
| pruneOld | function | 297 | no | function pruneOld() { |
| done | const | 298 | no | const done = [...jobs.values()].filter(job =&gt; TERMINAL.has(job.state) &amp;&amp; job.state !== &#39;ready-to-review&#39;) |
| job | const | 307 | no | const job = loadFromDisk(name.slice(0, -5)); |
| need | function | 316 | no | function need(jobId) { |
| job | const | 318 | no | const job = jobs.get(jobId) ?? loadFromDisk(jobId); |
| start | function | 324 | no | function start({ id, site, request } = {}) { |
| wish | variable | 327 | no | let wish = null; |
| app | const | 332 | no | const app = apps.get(id); // 404 when the app does not exist |
| live | const | 334 | no | const live = [...jobs.values()].find(job =&gt; job.appId === id &amp;&amp; ACTIVE.has(job.state)); |
| jobId | const | 336 | no | const jobId = &#39;aid-&#39; + randomBytes(12).toString(&#39;hex&#39;); |
| job | const | 337 | no | const job = { schema: AI_DESIGN_JOB_SCHEMA, id: jobId, appId: id, site, request: wish, state: &#39;queued&#39;, waitingOn: null, |
| get | function | 346 | no | const get = jobId =&gt; ({ job: publicJob(need(jobId)) }); |
| latestFor | function | 347 | no | const latestFor = appId =&gt; { |
| mine | const | 349 | no | const mine = [...jobs.values()].filter(job =&gt; job.appId === appId &amp;&amp; job.state !== &#39;discarded&#39;) |
| approve | function | 355 | no | async function approve({ jobId } = {}) { |
| job | const | 356 | no | const job = need(jobId); |
| current | const | 362 | no | const current = apps.get(job.appId); |
| result | variable | 363 | no | let result; |
| code | const | 368 | no | const code = codeOf(error); |
| discard | function | 380 | no | function discard({ jobId } = {}) { |
| job | const | 381 | no | const job = need(jobId); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 15 | external |
| node:crypto | import | 16 | external |
| node:fs | import | 17 | external |
| ./http.mjs | import | 18 | [studio/src/studio/http.mjs](./http.mjs.md) |
| ./conversation-tools.mjs | import | 19 | [studio/src/studio/conversation-tools.mjs](./conversation-tools.mjs.md) |
| ./personal-app-provider-reply.mjs | import | 20 | [studio/src/studio/personal-app-provider-reply.mjs](./personal-app-provider-reply.mjs.md) |
| ./personal-app-blueprint.mjs | import | 21 | [studio/src/studio/personal-app-blueprint.mjs](./personal-app-blueprint.mjs.md) |
| ./conversation-api.mjs | import | 22 | [studio/src/studio/conversation-api.mjs](./conversation-api.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/personal-app-routes.mjs](./personal-app-routes.mjs.md) | ./personal-app-ai-design.mjs |

## Annotations

_No annotations._

## Excerpt

````javascript
// "Design with my AI": a background job that asks the user's OWN account on any signed-in AI website
// (ChatGPT, Claude, Z.ai, Qwen, DeepSeek or Gemini — through the ONE existing in-process conversation
// runtime) to propose screens for a personal app, then hands the compiled preview to the user.
// Consumer rules baked in:
//  - one stable idempotency key per job (derived from the job id); a new key is NEVER generated, so a
//    timeout / 504 / unknown effect can never become a second provider send;
//  - after any uncertain outcome the runner reads the STORED conversation (and may ask the runtime for
//    its read-only reconcile); it re-submits only with the SAME key and only when the stored state proves
//    no turn with that key exists;
//  - a busy browser (drive lease) is waited out with backoff, never surfaced as an error to the user;
//  - nothing auto-applies: approve() is the user's explicit click and goes through the existing
//    provider-reply apply path (stored digest + current version + 'user-confirmed').
// This module opens no browser/CDP driver of its own: every effect goes through the shared conversation
// tool executor (create_conversation / submit_conversation_turn / get_conversation / reconcile / finish).
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { problem } from './http.mjs';
import { executeConversationTool } from './conversation-tools.mjs';
import { createProviderReplyBuilder } from './personal-app-provider-reply.mjs';
import { PERSONAL_APP_CHANGE_SCHEMA, PERSONAL_APP_KINDS, isPersonalAppId } from './personal-app-blueprint.mjs';
import { CREATE_SITES } from './conversation-api.mjs';

export const AI_DESIGN_JOB_SCHEMA = 'vivim.personal-app-ai-job/1';
// Any AI website the owner is signed in to in the shared Chrome (same list the conversation runtime
// accepts for a fresh conversation). Reused, not duplicated, so a newly signed-in site needs no edit here.
export const AI_DESIGN_SITES = CREATE_SITES;
const SITE_LABEL = { chatgpt: 'ChatGPT', claude: 'Claude', zai: 'Z.ai', qwen: 'Qwen', deepseek: 'DeepSeek', gemini: 'Gemini' };
const SITE_LIST_TEXT = CREATE_SITES.map(site => SITE_LABEL[site] ?? site).join(', ');
const JOB_ID = /^aid-[a-f0-9]{24}$/;
const ACTIVE = new Set(['queued', 'asking', 'waiting-reply']);
const TERMINAL = new Set(['ready-to-review', 'applied', 'discarded', 'failed']);
const BUSY_CODES = new Set(['DRIVE_LEASE_BUSY', 'THREAD_JOURNAL_BUSY', 'PREFIX_WRITER_BUSY', 'WRITER_WINDOW_BUSY']);
const NO_RETRY = /^(INVALID_|CONFIRM_REQUIRED|IDEMPOTENCY_CONFLICT|CONVERSATION_(FINISHED|NOT_WRITABLE|NOT_FOUND|OWNED_BY_ANOTHER_RUNTIME)|THREAD_(FENCED|IDENTITY_UNVERIFIED)|PREFIX_|CREATION_UNCERTAIN|LEGACY_|RUNTIME_CLOSED)/;
const MAX_KEPT_JOBS = 40;
const DEFAULT_TIMING = Object.freeze({
  pollMs: 2500,              // stored-conversation poll interval
  leaseBudgetMs: 180000,     // how long a busy browser is waited out (same key, backoff)
  submitCeilingMs: 300000,   // an in-process submit this slow is observed by polling instead of awaited
  replyTimeoutMs: 600000,    // total patience for the provider reply
  reconcileEveryMs: 10000,   // read-only nudge cadence for an uncertain/unobserved turn
  maxReconciles: 8, maxCreateTries: 3, maxSubmitTries: 3,
});

const codeOf = error => {
  if (typeof error?.code === 'string' && /^[A-Z][A-Z0-9_]{1,79}$/.test(error.code)) return error.code;
  if (typeof error?.message === 'string' && /^[A-Z][A-Z0-9_]{2,79}$/.test(error.message)) return error.message;
  return 'AI_DESIGN_FAILED';
};
const isBusy = error => BUSY_CODES.has(codeOf(error));

// What a person sees. The technical code always travels alongside for support.
function friendly(code, site) {
  const ai = SITE_LABEL[site] ?? 'your AI';
  if (BUSY_CODES.has(code)) return 'Your AI browser stayed busy with something else for a few minutes. Nothing was sent. Please try again in a moment.';
  switch (code) {
    case 'CONNECT_TIMEOUT': return 'Could not open ' + ai + ' in time. Check that you are signed in, then try again. Nothing was sent.';
    case 'BROWSER_UNAVAILABLE': return 'The AI browser is not running. Open Chat and connect your browser, then try again.';
    case 'REPLY_TIMEOUT': return ai + ' is taking longer than expected. Nothing was sent twice. Try again later or check the chat in your browser.';
    case 'REPLY_INTERRUPTED': return ai + ' stopped before finishing its answer. Try again.';
    case 'INTERRUPTED': return 'VIVIM restarted before this request finished. Please start it again.';
    case 'TURN_NOT_FOUND': return 'Could not confirm that ' + ai + ' received the request. Nothing was repeated. Please try again.';
    case 'PERSONAL_APP_VERSION_CONFLICT': return 'Your app changed while your AI was thinking, so these screens no longer fit. Ask again to get fresh ideas.';
    case 'PERSONAL_APP_SCREEN_EXISTS': return ai + ' suggested a screen your app already has. Ask again, or describe something different.';
    case 'PERSONAL_APP_LIMIT': return 'Your app already has the maximum number of screens.';
    case 'PROVIDER_REPLY_AMBIGUOUS': case 'PROVIDER_REPLY_EMPTY': case 'PERSONAL_APP_INVALID':
      return ai + ' answered, but not in a form VIVIM can safely use. Nothing was changed. Try again.';
    case 'CREATION_UNPINNED': case 'DELIVERY_UNCONFIRMED': case 'TYPING_UNCONFIRMED':
      return 'Could not confirm that ' + ai + ' received the request, so nothing was repeated. Check the ' + ai + ' tab, clear any unsent text, then try again.';
    case 'DRAFT_PRESENT': case 'DRAFT_OR_BINDING_NOT_READY': return 'The ' + ai + ' tab was not ready (it may have unsent text). Nothing was sent. Clear it and try again.';
    default: return 'Your AI could not finish this request. Nothing was changed. Please try again.';
  }
}

const readableLine = value => typeof value === 'string' ? value.replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim() : '';

const clip = (value, max) => { const line = readableLine(value); return line.length > max ? line.slice(0, max - 1) + '…' : line; };

// ONE plain line on purpose: rich chat composers (ProseMirror/Lexical) turn newlines, "- ", "1.", "#"
// and ``` into list/heading/code-block structure, so the typed text no longer reads back exactly and the
````

_First 80 of 392 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
