# File: hq/lib/channel-broker.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/channel-broker.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 50379 B |
| Lines | 1033 |
| Hash | d1ff7ea20efb |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| BROKER_SCHEMA | const | 31 | yes | export const BROKER_SCHEMA = &#39;vivim.channel-broker/1&#39;; |
| RECEIPT_SCHEMA | const | 32 | yes | export const RECEIPT_SCHEMA = &#39;vivim.channel-broker/1.receipt&#39;; |
| PROPOSALS_SCHEMA | const | 33 | yes | export const PROPOSALS_SCHEMA = &#39;vivim.channel-broker/1.proposals&#39;; |
| LOGICAL_SEATS_SCHEMA | const | 34 | yes | export const LOGICAL_SEATS_SCHEMA = &#39;vivim.channel-broker/1.logical-seats&#39;; |
| DEFAULT_CHANNEL_ROOT | export | 35 | yes | export { DEFAULT_CHANNEL_ROOT } |
| NON_DURABLE_THREAD_KEYS | const | 38 | yes | export const NON_DURABLE_THREAD_KEYS = [&#39;chatgpt-live-tab&#39;]; |
| LOGICAL_SEATS | const | 41 | yes | export const LOGICAL_SEATS = [ |
| REPO_ROOT | const | 68 | no | const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;); |
| repoMirrorPath | function | 70 | yes | export function repoMirrorPath() { |
| liveMirrorPath | function | 74 | yes | export function liveMirrorPath() { |
| brokerDir | function | 80 | yes | export function brokerDir(root = DEFAULT_CHANNEL_ROOT) { |
| requestsDir | function | 84 | no | function requestsDir(root) { |
| journalDir | function | 88 | no | function journalDir(root) { |
| receiptsDir | function | 92 | no | function receiptsDir(root) { |
| proposalsDir | function | 96 | no | function proposalsDir(root) { |
| brokerThreadsFile | function | 100 | no | function brokerThreadsFile(root) { |
| brokerRequestId | function | 111 | yes | export function brokerRequestId({ originSeat, taskId, threadKey, promptDigest }) { |
| digest | const | 112 | no | const digest = sha256([originSeat ?? &#39;&#39;, taskId ?? &#39;&#39;, threadKey ?? &#39;&#39;, promptDigest ?? &#39;&#39;].join(&#39;\|&#39;)); |
| knownThreadKey | function | 121 | yes | export function knownThreadKey(root, threadKey) { |
| key | const | 122 | no | const key = String(threadKey ?? &#39;&#39;).trim(); |
| doc | const | 130 | no | const doc = JSON.parse(readFileSync(file, &#39;utf8&#39;)); |
| byKey | const | 131 | no | const byKey = doc?.byKey ?? {}; |
| registerThread | function | 144 | yes | export function registerThread(root, { threadKey, authorizationRef, note = null, at = nowISO() } = {}) { |
| check | const | 145 | no | const check = knownThreadKey(root, threadKey); |
| file | const | 151 | no | const file = brokerThreadsFile(root); |
| doc | const | 152 | no | const doc = existsSync(file) ? JSON.parse(readFileSync(file, &#39;utf8&#39;)) : { schema: BROKER_SCHEMA, byKey: {} }; |
| loadRevocations | function | 166 | yes | export function loadRevocations(root) { |
| dir | const | 168 | no | const dir = join(root, &#39;revocations&#39;); |
| revocationFor | function | 182 | yes | export function revocationFor(request, revocations = loadRevocations(request?.channelRoot)) { |
| GRANT_SCHEMA | const | 195 | yes | export const GRANT_SCHEMA = &#39;vivim.channel-broker/1.grant&#39;; |
| validateGrant | function | 207 | yes | export function validateGrant(grant, request, { at = nowISO(), revocations = [], expectedOwner = null } = {}) { |
| revocation | const | 223 | no | const revocation = revocationFor({ requestId: grant.requestId ?? request?.requestId, scope: grant.scope, originSeat: grant.originSeat, taskId: grant.taskId ?? null, |
| mismatches | const | 232 | no | const mismatches = []; |
| SEND_FENCE_SCHEMA | const | 252 | yes | export const SEND_FENCE_SCHEMA = &#39;vivim.channel-broker/1.fence&#39;; |
| fencesDir | function | 254 | no | function fencesDir(root) { |
| sendFencePath | function | 259 | yes | export function sendFencePath(root, requestId) { |
| acquireSendFence | function | 273 | yes | export function acquireSendFence(root, requestId, { grantDigest = null, pid = process.pid, at = nowISO() } = {}) { |
| file | const | 275 | no | const file = sendFencePath(root, requestId); |
| fence | const | 276 | no | const fence = { |
| describeHeldFence | function | 294 | no | function describeHeldFence(file, requestId) { |
| holder | variable | 295 | no | let holder = null; |
| pid | const | 297 | no | const pid = holder?.holderPid; |
| alive | variable | 298 | no | let alive = null; // null = liveness cannot be proven |
| code | const | 304 | no | const code = /** @type {any} */ (error).code; |
| releaseSendFence | function | 315 | yes | export function releaseSendFence(root, requestId) { |
| appendJournal | function | 326 | no | function appendJournal(root, requestId, event, extra = {}) { |
| dir | const | 327 | no | const dir = journalDir(root); |
| line | const | 329 | no | const line = JSON.stringify({ at: nowISO(), requestId, event, ...extra }); |
| readJournal | function | 334 | no | function readJournal(root, requestId) { |
| file | const | 335 | no | const file = join(journalDir(root), `${requestId}.jsonl`); |
| TERMINAL_STATES | const | 344 | no | const TERMINAL_STATES = [&#39;SENT&#39;, &#39;UNCERTAIN&#39;, &#39;REFUSED&#39;, &#39;CANCELLED&#39;]; |
| requestState | function | 347 | yes | export function requestState(root, requestId) { |
| events | const | 348 | no | const events = readJournal(root, requestId); |
| stateEvent | const | 349 | no | const stateEvent = [...events].reverse().find((e) =&gt; TERMINAL_STATES.includes(e.event) \|\| e.event === &#39;QUEUED&#39; \|\| e.event === &#39;send-attempt&#39;); |
| readRequest | function | 356 | no | function readRequest(root, requestId) { |
| file | const | 357 | no | const file = join(requestsDir(root), `${requestId}.json`); |
| writeReceiptOnce | function | 366 | no | function writeReceiptOnce(root, requestId, receipt) { |
| dir | const | 367 | no | const dir = receiptsDir(root); |
| file | const | 369 | no | const file = join(dir, `${requestId}.json`); |
| resolveOriginSeat | function | 381 | no | function resolveOriginSeat(root, originSeat) { |
| doc | const | 382 | no | const doc = loadSeats(root); |
| logical | const | 383 | no | const logical = Array.isArray(doc.logicalSeats) ? doc.logicalSeats : []; |
| seat | const | 384 | no | const seat = roster(doc).find((s) =&gt; String(s.id).toLowerCase() === String(originSeat).toLowerCase()) |
| submitRequest | function | 400 | yes | export function submitRequest({ root = DEFAULT_CHANNEL_ROOT, originSeat, taskId, threadKey, |
| resolved | const | 419 | no | const resolved = resolveOriginSeat(root, originSeat); |
| text | const | 422 | no | const text = String(prompt ?? &#39;&#39;).trim(); |
| thread | const | 425 | no | const thread = knownThreadKey(root, threadKey); |
| promptDigest | const | 428 | no | const promptDigest = sha256(text); |
| requestId | const | 429 | no | const requestId = brokerRequestId({ originSeat, taskId, threadKey, promptDigest }); |
| queuedRevocation | const | 432 | no | const queuedRevocation = revocationFor({ taskId, requestId, originSeat, scope, channelRoot: root }, loadRevocations(root)); |
| deadlineTs | const | 437 | no | const deadlineTs = Date.parse(String(deadline)); |
| existing | const | 441 | no | const existing = readRequest(root, requestId); |
| state | const | 443 | no | const state = requestState(root, requestId).state; |
| deny | function | 483 | no | function deny(code, detail) { |
| sendBoundary | function | 491 | yes | export function sendBoundary(root, request, { at = nowISO(), revocations = null } = {}) { |
| thread | const | 492 | no | const thread = knownThreadKey(root, request.thread?.key); |
| revocation | const | 494 | no | const revocation = revocationFor(request, revocations ?? loadRevocations(root)); |
| queuedRequests | function | 506 | no | function queuedRequests(root) { |
| dir | const | 507 | no | const dir = requestsDir(root); |
| rows | const | 509 | no | const rows = []; |
| request | const | 511 | no | const request = readRequest(root, f.replace(/\\.json$/, &#39;&#39;)); |
| compareQueue | function | 519 | no | function compareQueue(a, b) { |
| p | const | 520 | no | const p = (Number(a.request.priority) \|\| 0) - (Number(b.request.priority) \|\| 0); |
| t | const | 522 | no | const t = String(a.request.createdAt).localeCompare(String(b.request.createdAt)); |
| drainLocks | const | 529 | no | const drainLocks = new Map(); |
| drain | function | 538 | yes | export function drain(opts = {}) { |
| root | const | 539 | no | const root = opts.root ?? DEFAULT_CHANNEL_ROOT; |
| key | const | 540 | no | const key = String(root); |
| prev | const | 541 | no | const prev = drainLocks.get(key) ?? Promise.resolve(); |
| next | const | 542 | no | const next = prev.catch(() =&gt; {}).then(() =&gt; drainNow({ ...opts, root })); |
| drainNow | function | 551 | no | async function drainNow({ root, transport = null, at = nowISO(), reloadRevocations = null } = {}) { |
| rereadRevocations | const | 554 | no | const rereadRevocations = reloadRevocations ?? (() =&gt; loadRevocations(root)); |
| summary | const | 555 | no | const summary = { at, attempted: 0, sent: 0, uncertain: 0, refused: 0, stillQueued: 0, results: [] }; |
| queued | const | 556 | no | const queued = queuedRequests(root).filter((r) =&gt; r.state === &#39;QUEUED&#39;).sort(compareQueue); |
| state | const | 558 | no | const state = requestState(root, request.requestId).state; |
| boundary | const | 573 | no | const boundary = sendBoundary(root, request, { at, revocations: rereadRevocations() }); |
| priorAttempt | const | 593 | no | const priorAttempt = requestState(root, request.requestId).events.some((e) =&gt; e.event === &#39;send-attempt&#39;); |
| grantDigest | variable | 602 | no | let grantDigest = null; |
| grantVerdict | const | 604 | no | const grantVerdict = validateGrant(request.grant ?? null, request, { at, revocations: rereadRevocations(), expectedOwner: transport.owner ?? null }); |
| fence | const | 622 | no | const fence = acquireSendFence(root, request.requestId, { grantDigest }); |
| postFenceRevocation | const | 642 | no | const postFenceRevocation = revocationFor(request, rereadRevocations()); |
| answer | variable | 657 | no | let answer = null; |
| threw | variable | 658 | no | let threw = null; |
| pending | const | 665 | no | const pending = threw \|\| answer?.pending === true \|\| (answer &amp;&amp; answer.accepted !== true &amp;&amp; answer.pending === undefined &amp;&amp; isTimeout(answer)); |
| proposals | const | 667 | no | const proposals = parseReplyProposals(String(answer.reply ?? &#39;&#39;)); |
| receiptPath | const | 673 | no | const receiptPath = writeReceiptOnce(root, request.requestId, { schema: RECEIPT_SCHEMA, requestId: request.requestId, at, state: &#39;SENT&#39;, effect: answer.effect ?? &#39;SENT&#39;, transport: transport.name ?? … |
| receiptPath | const | 688 | no | const receiptPath = writeReceiptOnce(root, request.requestId, { schema: RECEIPT_SCHEMA, requestId: request.requestId, at, state: &#39;UNCERTAIN&#39;, effect: &#39;UNVERIFIED&#39;, transport: transport.name ?? &#39;injec… |
| receiptPath | const | 698 | no | const receiptPath = writeReceiptOnce(root, request.requestId, { schema: RECEIPT_SCHEMA, requestId: request.requestId, at, state: &#39;REFUSED&#39;, effect: &#39;REFUSED&#39;, code: &#39;TRANSPORT_REFUSED&#39;, transport: tr… |
| isTimeout | function | 715 | no | function isTimeout(answer) { |
| cancelPending | function | 726 | yes | export function cancelPending({ root = DEFAULT_CHANNEL_ROOT, requestId, actor = null, at = nowISO() } = {}) { |
| request | const | 727 | no | const request = readRequest(root, requestId); |
| DANGEROUS_PATTERNS | const | 739 | no | const DANGEROUS_PATTERNS = [ |
| parseReplyProposals | function | 753 | yes | export function parseReplyProposals(replyText) { |
| text | const | 754 | no | const text = String(replyText ?? &#39;&#39;); |
| proposals | const | 755 | no | const proposals = []; |
| fence | const | 756 | no | const fence = /```([A-Za-z0-9_-]*)\\r?\\n([\\s\\S]*?)```/g; |
| m | variable | 757 | no | let m = null; |
| content | const | 759 | no | const content = m[2] ?? &#39;&#39;; |
| recordReply | function | 787 | yes | export function recordReply({ root = DEFAULT_CHANNEL_ROOT, requestId, replyText, at = nowISO() } = {}) { |
| request | const | 788 | no | const request = readRequest(root, requestId); |
| parsed | const | 790 | no | const parsed = parseReplyProposals(replyText); |
| dir | const | 791 | no | const dir = proposalsDir(root); |
| file | const | 793 | no | const file = join(dir, `${requestId}.json`); |
| CHAT_ASK_SCHEMA | const | 813 | no | const CHAT_ASK_SCHEMA = &#39;vivim.chat-ask-result/1&#39;; |
| CHAT_ASK_EFFECTS | const | 814 | no | const CHAT_ASK_EFFECTS = new Set([&#39;OK&#39;, &#39;UNVERIFIED&#39;, &#39;FAILED&#39;]); |
| promptAclCommand | function | 824 | yes | export function promptAclCommand(promptFile, userName = process.env.USERNAME \|\| process.env.USER \|\| &#39;&#39;) { |
| defaultPromptAcl | function | 829 | no | function defaultPromptAcl(promptFile) { |
| r | const | 832 | no | const r = spawnSync(command, args, { windowsHide: true }); |
| studioChatTransport | function | 854 | yes | export function studioChatTransport({ harnessRoot = process.env.VIVIM_HARNESS_ROOT \|\| &#39;C:/0-BlackBoxProject-0/vivim-web-harness&#39;, studioBin, timeoutSec = 120, nodeBin = process.env.HQ_NODE \|\| &#39;node&#39;,… |
| bin | const | 855 | no | const bin = studioBin ?? join(harnessRoot, &#39;studio&#39;, &#39;bin&#39;, &#39;studio.mjs&#39;); |
| promptFile | const | 864 | no | const promptFile = join(tmpdir(), `hq-broker-${request.requestId}.prompt.txt`); |
| args | const | 868 | no | const args = [ |
| r | const | 883 | no | const r = spawnSync(nodeBin, args, { encoding: &#39;utf8&#39;, timeout: (timeoutSec + 30) * 1000, windowsHide: true }); |
| parsed | variable | 887 | no | let parsed = null; |
| stdoutText | const | 888 | no | const stdoutText = String(r.stdout ?? &#39;&#39;).trim(); |
| atomicWrite | function | 924 | no | function atomicWrite(file, content) { |
| tmp | const | 925 | no | const tmp = `${file}.tmp-${Date.now()}`; |
| migrateRegistry | function | 941 | yes | export function migrateRegistry({ channelRoot = DEFAULT_CHANNEL_ROOT, repoMirror = repoMirrorPath(), liveMirror = liveMirrorPath(), backupPath = null, at = nowISO(), actor = &#39;channel-broker-migration… |
| repoHash | variable | 942 | no | let repoHash = null; |
| liveHash | variable | 943 | no | let liveHash = null; |
| file | const | 958 | no | const file = join(channelRoot, &#39;seats.json&#39;); |
| raw | const | 962 | no | const raw = readFileSync(file, &#39;utf8&#39;); |
| doc | variable | 963 | no | let doc; |
| existing | const | 973 | no | const existing = Array.isArray(doc.logicalSeats) ? doc.logicalSeats : []; |
| existingIds | const | 974 | no | const existingIds = new Set(existing.map((s) =&gt; s.id)); |
| added | const | 975 | no | const added = []; |
| changed | const | 983 | no | const changed = added.length &gt; 0; |
| renderQueueTable | function | 1013 | yes | export function renderQueueTable(root) { |
| rows | const | 1014 | no | const rows = queuedRequests(root).sort(compareQueue).map(({ request, state }) =&gt; ({ requestId: request.requestId, originSeat: request.originSeat, taskId: request.taskId, thread: request.thread?.key ?… |
| width | const | 1024 | no | const width = Math.max(10, ...rows.map((r) =&gt; r.requestId.length)); |
| lines | const | 1025 | no | const lines = [&#39;REQUEST&#39;.padEnd(width) + &#39; SEAT STATE TASK&#39;]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 23 | external |
| node:fs | import | 24 | external |
| node:os | import | 25 | external |
| node:path | import | 26 | external |
| node:url | import | 27 | external |
| ./util.mjs | import | 28 | [hq/lib/util.mjs](./util.mjs.md) |
| ./channel-seats.mjs | import | 29 | [hq/lib/channel-seats.mjs](./channel-seats.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/channel-broker.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/channel-broker.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | ChatGPT coordination broker — a queue/dispatcher ADAPTER over the existing Studio |
| 5 | owner | channel-manager | — | channel-manager |
| 6 | task | — | — | ADR-CHATGPT-COORDINATION-BROKER (Phase 2, launch-2026-11-08 handoff @48fc6e6) |
| 7 | invariant | — | — | one Studio browser owner, one drive lease, one canonical ChatGPT transport: this |
| 11 | invariant | — | — | one send attempt per requestId; a timeout is UNCERTAIN and is never auto-resent |
| 12 | invariant | — | — | revoked scope is refused at the send boundary; an unknown thread identity fails |
| 14 | invariant | — | — | a model reply is parsed into proposals only and is never routed to a shell, |
| 16 | invariant | — | — | the request record and the receipt are written once (wx) and never rewritten; the |
| 18 | invariant | — | — | the registry migration refuses to run while the two channel-manager mirrors |
| 20 | see | — | doc:docs/architecture/ADR-CHATGPT-COORDINATION-BROKER.md | doc:docs/architecture/ADR-CHATGPT-COORDINATION-BROKER.md |
| 21 | see | — | doc:docs/orchestration/intelligence-upgrade/VIVIM-LAUNCH-CHATGPT-COORDINATION-HANDOFF.md | doc:docs/orchestration/intelligence-upgrade/VIVIM-LAUNCH-CHATGPT-COORDINATION-HANDOFF.md |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context ChatGPT coordination broker — a queue/dispatcher ADAPTER over the existing Studio
 *   chat channel and journal: many logical seats submit bounded requests, one serialized send path
 * @hq:owner channel-manager
 * @hq:task ADR-CHATGPT-COORDINATION-BROKER (Phase 2, launch-2026-11-08 handoff @48fc6e6)
 * @hq:invariant one Studio browser owner, one drive lease, one canonical ChatGPT transport: this
 *   module spawns no CDP client and opens no HTTP to ChatGPT; actual sends go only through the
 *   injected transport (the existing `studio chat ask` command path), constructed only when a
 *   caller explicitly passes an owner authorization reference
 * @hq:invariant one send attempt per requestId; a timeout is UNCERTAIN and is never auto-resent
 * @hq:invariant revoked scope is refused at the send boundary; an unknown thread identity fails
 *   closed — 'chatgpt-live-tab' is not durable thread identity
 * @hq:invariant a model reply is parsed into proposals only and is never routed to a shell,
 *   GitHub, or a provider send
 * @hq:invariant the request record and the receipt are written once (wx) and never rewritten; the
 *   journal is append-only JSONL, so a crash between intent and receipt reconciles determinately
 * @hq:invariant the registry migration refuses to run while the two channel-manager mirrors
 *   differ by hash (adversarial matrix #12)
 * @hq:see doc:docs/architecture/ADR-CHATGPT-COORDINATION-BROKER.md
 * @hq:see doc:docs/orchestration/intelligence-upgrade/VIVIM-LAUNCH-CHATGPT-COORDINATION-HANDOFF.md
 */
import { spawnSync } from 'node:child_process';
import { appendFileSync, chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { nowISO, sha256, sha256File } from './util.mjs';
import { DEFAULT_CHANNEL_ROOT, loadSeats, promptCarriesSecret, roster } from './channel-seats.mjs';

export const BROKER_SCHEMA = 'vivim.channel-broker/1';
export const RECEIPT_SCHEMA = 'vivim.channel-broker/1.receipt';
export const PROPOSALS_SCHEMA = 'vivim.channel-broker/1.proposals';
export const LOGICAL_SEATS_SCHEMA = 'vivim.channel-broker/1.logical-seats';
export { DEFAULT_CHANNEL_ROOT };

/** Thread keys that were never durable identity. Always refused, even if somehow registered. */
export const NON_DURABLE_THREAD_KEYS = ['chatgpt-live-tab'];

/** The four logical seats the ADR admits. No provider-send or push authority, by name. */
export const LOGICAL_SEATS = [
  {
    id: 'lead-research', title: 'LEAD RESEARCH (ChatGPT)', kind: 'logical', site: null, session: null,
    submitsVia: 'channel-broker',
    scopes: ['chatgpt.research.request', 'chatgpt.review.request', 'coordination.submit'],
    denied: ['provider-send', 'push', 'shell-exec', 'approval'],
  },
  {
    id: 'local-supervisor', title: 'LOCAL SUPERVISOR', kind: 'logical', site: null, session: null,
    submitsVia: 'channel-broker',
    scopes: ['coordination.submit', 'coordination.execute-approved', 'receipts.publish'],
    denied: ['provider-send', 'push'],
  },
  {
    id: 'channel-broker', title: 'CHATGPT COORDINATION BROKER', kind: 'logical', site: null, session: null,
    submitsVia: 'channel-broker',
    scopes: ['coordination.queue', 'coordination.route', 'coordination.serialize-send'],
    denied: ['provider-send', 'direct-provider-send', 'push'],
  },
  {
    id: 'evidence-verifier', title: 'EVIDENCE VERIFIER', kind: 'logical', site: null, session: null,
    submitsVia: 'channel-broker',
    scopes: ['evidence.verify', 'tests.run', 'coordination.review-proposals'],
    denied: ['provider-send', 'push'],
  },
];

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function repoMirrorPath() {
  return join(REPO_ROOT, '.opencode', 'agent', 'channel-manager.md');
}

export function liveMirrorPath() {
  return join(homedir(), '.zcode', 'agents', 'channel-manager.md');
}

// ------------------------------------------------------------------ paths ----

export function brokerDir(root = DEFAULT_CHANNEL_ROOT) {
```

_First 80 of 1034 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
