# File: studio/src/capture/conversation-service.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/conversation-service.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 58602 B |
| Lines | 773 |
| Hash | 8d8c6f7eba1e |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| now | function | 32 | no | const now = () =&gt; new Date().toISOString(); |
| error | function | 33 | no | const error = (code) =&gt; Object.assign(new Error(code), { code }); |
| exactBinding | function | 35 | no | const exactBinding = (a, b) =&gt; a?.targetId === b?.targetId &amp;&amp; a?.origin === b?.origin &amp;&amp; sameThread(a?.thread, b?.thread); |
| phases | const | 36 | no | const phases = [&#39;preparing&#39;, &#39;dispatching&#39;, &#39;observed&#39;, &#39;uncertain&#39;, &#39;needs-reconciliation&#39;, &#39;blocked&#39;]; |
| validBaseline | function | 39 | no | const validBaseline = (b) =&gt; !!b &amp;&amp; typeof b === &#39;object&#39; |
| baselineOf | function | 42 | no | const baselineOf = (b) =&gt; validBaseline(b) |
| hex64 | function | 48 | no | const hex64 = (v) =&gt; typeof v === &#39;string&#39; &amp;&amp; /^[a-f0-9]{64}$/.test(v); |
| count | function | 49 | no | const count = (v) =&gt; Number.isSafeInteger(v) &amp;&amp; v &gt;= 0; |
| cursorOf | function | 50 | no | const cursorOf = (c) =&gt; !!c &amp;&amp; typeof c === &#39;object&#39; &amp;&amp; count(c.messageCount) &amp;&amp; count(c.userCount) &amp;&amp; count(c.assistantCount) |
| expectedFloor | function | 56 | no | const expectedFloor = (a) =&gt; a.cursor ? a.cursor.messageCount + (a.send?.state === &#39;observed&#39; ? 1 : 0) + (a.reply?.state === &#39;ready&#39; ? 1 : 0) : 0; |
| validSnapshot | function | 58 | no | function validSnapshot(s, id) { |
| validConversationSnapshot | const | 88 | yes | export const validConversationSnapshot = validSnapshot; |
| createConversationService | function | 90 | yes | export function createConversationService({ dataDir, id = randomUUID(), adapter, io = fs, context = {}, recover = true } = {}) { |
| file | const | 93 | no | const file = path.join(dataDir, `${id}.conversation.json`); |
| snapshot | variable | 94 | no | let snapshot, existed = false; |
| poisoned | variable | 113 | no | let poisoned = false, chain = Promise.resolve(), finishPromise = null; |
| submissionStopped | variable | 114 | no | let submissionStopped = false; |
| journal | function | 115 | no | let journal; |
| threadJournal | function | 116 | no | const threadJournal = () =&gt; { |
| journalTurn | function | 121 | no | function journalTurn(a) { |
| turn | const | 122 | no | const turn = threadJournal().read().turns.find((t) =&gt; t.id === a.id); |
| view | function | 126 | no | const view = () =&gt; { |
| s | const | 127 | no | const s = structuredClone(snapshot); |
| turns | const | 129 | no | const turns = threadJournal().read().turns; |
| turn | const | 131 | no | const turn = turns.find((t) =&gt; t.id === a.id); |
| replyView | function | 140 | no | function replyView(a) { |
| reply | const | 141 | no | const reply = { ...a.reply }, turn = a.journal, evidence = turn?.reply?.evidence; |
| text | const | 142 | no | const text = typeof reply.text === &#39;string&#39; ? reply.text : &#39;&#39;; |
| serial | function | 158 | no | const serial = (fn) =&gt; { const result = chain.then(() =&gt; { if (poisoned) throw error(&#39;PERSISTENCE_FAILED_REOPEN_REQUIRED&#39;); return fn(); }); chain = result.catch(() =&gt; {}); return result; }; |
| save | function | 161 | no | function save() { |
| tmp | const | 163 | no | const tmp = `${file}.${randomUUID()}.tmp`; |
| fd | variable | 164 | no | let fd; |
| revision | function | 180 | no | function revision(expected) { if (expected !== snapshot.revision) throw error(&#39;STALE_REVISION&#39;); } |
| writable | function | 181 | no | function writable() { if (snapshot.finish.requested) throw error(&#39;CONVERSATION_FINISHED&#39;); } |
| updateAttempt | function | 182 | no | function updateAttempt(a, phase, send) { a.phase = phase; a.send.state = send; a.updatedAt = now(); } |
| observe | function | 183 | no | function observe(a, observation) { |
| e | const | 184 | no | const e = observation?.evidence; |
| applyReply | function | 200 | no | function applyReply(reply) { |
| a | const | 201 | no | const a = snapshot.attempts.find((a) =&gt; a.id === reply.turnId); |
| e | const | 203 | no | const e = reply.evidence, text = String(reply.text ?? &#39;&#39;); |
| applyPriorReplies | function | 216 | no | function applyPriorReplies(updates = []) { for (const update of updates) applyReply(update); } |
| blockPreEffect | function | 217 | no | function blockPreEffect(a) { |
| unknown | function | 222 | no | function unknown(a, reason) { |
| replayRequest | function | 225 | no | function replayRequest(key, payloadDigest) { |
| local | const | 226 | no | const local = view().attempts.find((a) =&gt; a.key === key); |
| prior | const | 227 | no | const prior = local ?? (snapshot.binding?.thread &amp;&amp; snapshot.identity.state === &#39;bound&#39; ? threadJournal().read().turns.find((a) =&gt; a.key === key) : null); |
| replay | const | 232 | no | const replay = { ...prior, journal: prior, phase: prior.phase === &#39;delivered&#39; ? &#39;observed&#39; : prior.phase, |
| invalidatePrior | function | 238 | no | function invalidatePrior(ids = []) { |
| turn | const | 240 | no | const turn = threadJournal().read().turns.find((t) =&gt; t.id === id); |
| ensureCapture | function | 244 | no | async function ensureCapture() { |
| sessionId | const | 246 | no | const sessionId = await adapter.armCapture(); |
| creatingNow | function | 250 | no | const creatingNow = () =&gt; snapshot.identity?.state === &#39;unbound&#39; &amp;&amp; snapshot.identity?.reason === &#39;NEW_CHAT&#39; &amp;&amp; !snapshot.binding?.thread &amp;&amp; snapshot.binding?.ownedByStudio === true; |
| deniedRef | function | 251 | no | const deniedRef = (ref) =&gt; !Array.isArray(snapshot.threadDenylist) \|\| snapshot.threadDenylist.includes(ref); |
| effectPermit | function | 252 | no | function effectPermit(a, phase, page) { |
| turns | const | 253 | no | const turns = threadJournal().read().turns; |
| r | const | 256 | no | const r = prior.reply.evidence, message = page.messages?.find((m) =&gt; m.id === r.identity &amp;&amp; m.role === &#39;assistant&#39;); |
| interrupted | const | 263 | no | const interrupted = snapshot.attempts.at(-1); |
| recovered | variable | 264 | no | let recovered = false; |
| submitCreation | function | 288 | no | async function submitCreation({ key, prompt, payloadDigest, registered, writer }) { |
| attempt | const | 290 | no | const attempt = { id: randomUUID(), key, payloadDigest, phase: &#39;preparing&#39;, createdAt: now(), updatedAt: now(), creation: true, |
| finish | function | 292 | no | const finish = () =&gt; { save(); const viewAttempt = view().attempts.find((a) =&gt; a.key === key); registered?.(view(), viewAttempt); return viewAttempt; }; |
| prove | function | 293 | no | const prove = () =&gt; { |
| uncertain | function | 303 | no | const uncertain = (reason) =&gt; { |
| creationFailure | function | 312 | no | const creationFailure = (subStep, e, detail) =&gt; { |
| preflight | variable | 321 | no | let preflight; |
| code | const | 324 | no | const code = /^[A-Z][A-Z0-9_]{0,79}$/.test(e?.code ?? &#39;&#39;) ? e.code : &#39;PREFLIGHT_FAILED&#39;; |
| threadless | const | 337 | no | const threadless = preflight?.creation?.threadless === true &amp;&amp; !preflight?.targetThread &amp;&amp; !preflight?.pageThread; |
| controls | const | 338 | no | const controls = preflight?.controls; |
| idle | const | 339 | no | const idle = controls?.observed === true &amp;&amp; [&#39;idle&#39;, &#39;terminal&#39;].includes(controls.state) &amp;&amp; controls.idleControlPresent === true &amp;&amp; controls.stopPresent === false &amp;&amp; controls.composerEnabled === tru… |
| draftOk | const | 340 | no | const draftOk = preflight?.draft?.present === false &amp;&amp; preflight?.draft?.chars === 0 &amp;&amp; preflight?.ready === true; |
| boundaryOk | const | 341 | no | const boundaryOk = Number.isSafeInteger(preflight?.boundary?.sequence) &amp;&amp; preflight.boundary.sequence &gt;= 0 &amp;&amp; Number.isSafeInteger(preflight?.boundary?.transcriptCount) &amp;&amp; preflight.boundary.transcri… |
| stopEarly | function | 357 | no | const stopEarly = () =&gt; { |
| report | variable | 373 | no | let report; |
| target | const | 381 | no | const target = report?.targetThread, page = report?.pageThread; |
| same | const | 382 | no | const same = target &amp;&amp; page &amp;&amp; validThread(target) &amp;&amp; target.ref === page.ref &amp;&amp; target.id === page.id; |
| rejection | const | 384 | no | const rejection = {c:report?.creation,d:report?.dispatched,same:!!same,t:target?.ref,p:page?.ref}; |
| pinned | const | 388 | no | const pinned = typeof adapter.pinThread === &#39;function&#39; ? await adapter.pinThread(target, snapshot.threadDenylist) : null; |
| reservation | const | 392 | no | const reservation = threadJournal().reserve({ key, payloadDigest, conversationId: id }); |
| observation | const | 399 | no | const observation = await adapter.reconcile({ binding: structuredClone(snapshot.binding), turnId: attempt.id, payloadDigest, boundary: structuredClone(attempt.boundary) }); |
| parsed | variable | 423 | no | let parsed; try { parsed = new URL(origin); } catch { throw error(&#39;INVALID_BINDING&#39;); } |
| resolved | const | 426 | no | const resolved = identity ?? (thread ? { state: &#39;bound&#39;, reason: null } : { state: &#39;unbound&#39;, reason: &#39;NOT_PROVIDED&#39; }); |
| threadRef | const | 429 | no | const threadRef = THREAD_REF_PATTERN; |
| attached | variable | 434 | no | let attached; |
| deferred | const | 450 | no | const deferred = attached?.deferredCapture === true &amp;&amp; attached.sessionId == null; |
| creating | const | 456 | no | const creating = snapshot.identity.state === &#39;unbound&#39; &amp;&amp; snapshot.identity.reason === &#39;NEW_CHAT&#39; &amp;&amp; !snapshot.binding.thread; |
| creationReady | const | 457 | no | const creationReady = creating &amp;&amp; attached.readiness?.ready === true &amp;&amp; attached.readiness?.creation?.threadless === true |
| diagnostic | const | 463 | no | const diagnostic = typeof attached.readiness?.diagnostic === &#39;string&#39; &amp;&amp; attached.readiness.diagnostic ? attached.readiness.diagnostic.slice(0, 500) : null; |
| acquired | variable | 477 | no | let acquired = false; // True only while the writer window THIS call opened is still held. |
| payloadDigest | const | 480 | no | const payloadDigest = createHash(&#39;sha256&#39;).update(prompt, &#39;utf8&#39;).digest(&#39;hex&#39;); |
| original | const | 481 | no | const original = snapshot.attempts.find((a) =&gt; a.key === key); |
| prior | const | 485 | no | const prior = threadJournal().read().turns.find((a) =&gt; a.key === key); |
| replay | const | 488 | no | const replay = { ...prior, journal: prior, phase: prior.phase === &#39;delivered&#39; ? &#39;observed&#39; : prior.phase, |
| reservation | const | 523 | no | const reservation = threadJournal().reserve({ key, payloadDigest, conversationId: id }); |
| attempt | const | 525 | no | const attempt = { id: reservation.turn.id, key, payloadDigest, phase: &#39;preparing&#39;, createdAt: now(), updatedAt: now(), journal: reservation.turn, |
| stopped | function | 529 | no | const stopped = () =&gt; { |
| turn | const | 531 | no | const turn = journalTurn(attempt); |
| preEffect | const | 535 | no | const preEffect = turn.conversationId === id &amp;&amp; turn.phase === &#39;preparing&#39; |
| preflight | variable | 547 | no | let preflight; |
| audit | const | 562 | no | const audit = preflight?.prefixAudit; |
| reason | const | 570 | no | const reason = /^PREFIX_[A-Z0-9_]{1,70}$/.test(audit.reason ?? &#39;&#39;) ? audit.reason : &#39;PREFIX_REPLY_CHANGED&#39;; |
| cursor | const | 589 | no | const cursor = cursorOf(preflight.cursor); |
| floor | const | 590 | no | const floor = Math.max(0, ...snapshot.attempts.filter((a) =&gt; a.id !== attempt.id).map(expectedFloor)); |
| observation | variable | 607 | no | let observation; |
| attempt | const | 643 | no | const attempt = turnId ? snapshot.attempts.find((a) =&gt; a.id === turnId) : snapshot.attempts.at(-1); |
| deferredIdle | const | 648 | no | const deferredIdle = !snapshot.sessionId &amp;&amp; !snapshot.finish.requested &amp;&amp; [&#39;ready&#39;, &#39;blocked&#39;].includes(snapshot.state) |
| settled | function | 652 | no | const settled = (a) =&gt; !!a &amp;&amp; replyView({ ...a, journal: a.journal ? journalTurn(a) : null }).settled; |
| preflight | variable | 659 | no | let preflight; |
| bound | const | 666 | no | const bound = exactBinding(snapshot.binding, preflight?.binding); |
| validDraft | const | 667 | no | const validDraft = typeof preflight?.draft?.present === &#39;boolean&#39; &amp;&amp; Number.isSafeInteger(preflight?.draft?.chars) |
| validBoundary | const | 669 | no | const validBoundary = Number.isSafeInteger(preflight?.boundary?.sequence) &amp;&amp; preflight.boundary.sequence &gt;= 0 |
| unverified | const | 671 | no | const unverified = snapshot.identity.state === &#39;unverified&#39;; |
| refused | const | 673 | no | const refused = preflight?.ready === false; |
| code | const | 674 | no | const code = /^[A-Z][A-Z0-9_]{0,79}$/.test(preflight?.reason ?? &#39;&#39;) ? preflight.reason : null; |
| ready | const | 675 | no | const ready = bound &amp;&amp; validDraft &amp;&amp; validBoundary &amp;&amp; !preflight.draft.present &amp;&amp; !unverified &amp;&amp; !refused; |
| observation | variable | 683 | no | let observation; |
| value | const | 700 | no | const value = String(text ?? &#39;&#39;).slice(0, 300); |
| p | const | 727 | no | const p = snapshot.prefix; |
| next | const | 732 | no | const next = { ...p, state: &#39;active&#39;, adoptedAt: now(), reads: reads.slice(-4) }; |
| p | const | 740 | no | const p = snapshot.prefix; |
| next | const | 742 | no | const next = { ...p, state: &#39;invalidated&#39;, adoptedAt: p.adoptedAt ?? null, |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 25 | external |
| node:path | import | 26 | external |
| node:crypto | import | 27 | external |
| ./conversation-thread.mjs | import | 28 | [studio/src/capture/conversation-thread.mjs](./conversation-thread.mjs.md) |
| ./thread-turn-journal.mjs | import | 29 | [studio/src/capture/thread-turn-journal.mjs](./thread-turn-journal.mjs.md) |
| ./conversation-prefix.mjs | import | 30 | [studio/src/capture/conversation-prefix.mjs](./conversation-prefix.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/capture/conversation-runtime.mjs](./conversation-runtime.mjs.md) | ./conversation-service.mjs |
| [studio/src/studio/relay-journal-correlation.mjs](../studio/relay-journal-correlation.mjs.md) | ../capture/conversation-service.mjs |
| [studio/src/studio/world-conversation-activity.mjs](../studio/world-conversation-activity.mjs.md) | ../capture/conversation-service.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
/**
 * Lifecycle foundation. Browser implementation and cross-process lease are runtime responsibilities.
 * One service instance owns one conversation; callers MUST NOT open the same snapshot twice.
 * A shared browser/CLI lease is required before live use. Cancellation is deliberately deferred.
 *
 * Injected adapter contract (all async; no retries, fallback sends or implicit navigation):
 * connect(binding) -> { binding, sessionId }; attaches/arms capture on that exact target only.
 * preflight(binding) -> { binding, draft:{present,chars}, boundary:{sequence,transcriptCount}, baseline?:{userTurns,assistantTurns,sampledAt} };
 *   read-only, current composer/binding check immediately before type; never clears a draft.
 * type({binding,turnId,prompt}) -> void; types once, never submits or clears existing content.
 * submit({binding,turnId,payloadDigest}) -> observation|null; ONE send action, never types.
 * reconcile({binding,turnId,payloadDigest,boundary}) -> observation|null; strictly read-only.
 * stop({binding,sessionId}) -> void; resolves only after capture stop/flush succeeds.
 * closeTab(binding) -> void; closes precisely the Studio-owned bound target.
 *
 * Observation: { binding, evidence:{turnId,payloadDigest,sessionId,sequence,kind,source} }.
 * kind='outgoing-request'/'new-user-turn'; source='network'/'page' respectively. Evidence must
 * be attributable to THIS attempt, with sequence > persisted pre-typing boundary; timestamps,
 * old DOM, user assertions and arbitrary response-stream text are not submission evidence.
 * The adapter is a trusted evidence boundary, not a user-supplied observation API. A real adapter
 * must prove this correlation from durable capture records, not manufacture it from timing.
 * The attempt journal has no prompt/reply bodies; recordReply stores protected local reply data.
 * This is not reply assembly or acceptance. Runtime list/history must strip reply bodies.
 */
import * as fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { sameThread, validThread, validIdentity, THREAD_REF_PATTERN } from './conversation-thread.mjs';
import { createThreadTurnJournal } from './thread-turn-journal.mjs';
import { validPrefixRecord, prefixDescriptor } from './conversation-prefix.mjs';

const now = () => new Date().toISOString();
const error = (code) => Object.assign(new Error(code), { code });
// A bound thread is part of the binding: same target and origin on another thread is NOT the same binding.
const exactBinding = (a, b) => a?.targetId === b?.targetId && a?.origin === b?.origin && sameThread(a?.thread, b?.thread);
const phases = ['preparing', 'dispatching', 'observed', 'uncertain', 'needs-reconciliation', 'blocked'];
// Pre-send acceptance-freshness cursor supplied by the adapter preflight (acceptance G1/G2).
// Persisted verbatim per attempt; malformed shapes persist as null so evaluation stays honest.
const validBaseline = (b) => !!b && typeof b === 'object'
  && Number.isSafeInteger(b.userTurns) && b.userTurns >= 0
  && Number.isSafeInteger(b.assistantTurns) && b.assistantTurns >= 0;
const baselineOf = (b) => validBaseline(b)
  ? { userTurns: b.userTurns, assistantTurns: b.assistantTurns, ...(typeof b.sampledAt === 'string' ? { sampledAt: b.sampledAt } : {}) }
  : null;

// Pre-send per-turn cursor from the adapter preflight (count/role split/ordered-id digest/content digest of what
// already exists on the page, plus the prior stream cursor). Metadata only. Malformed or absent persists as null.
const hex64 = (v) => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const count = (v) => Number.isSafeInteger(v) && v >= 0;
const cursorOf = (c) => !!c && typeof c === 'object' && count(c.messageCount) && count(c.userCount) && count(c.assistantCount)
  && c.userCount + c.assistantCount <= c.messageCount && hex64(c.idsDigest) && hex64(c.contentDigest) && count(c.streamSequence)
  ? { messageCount: c.messageCount, userCount: c.userCount, assistantCount: c.assistantCount, idsDigest: c.idsDigest, contentDigest: c.contentDigest, streamSequence: c.streamSequence }
  : null;
// A delivered turn adds its user message; a recorded reply adds its assistant message. The next turn's page can never
// hold fewer messages than that, or history was removed/rewritten between turns.
const expectedFloor = (a) => a.cursor ? a.cursor.messageCount + (a.send?.state === 'observed' ? 1 : 0) + (a.reply?.state === 'ready' ? 1 : 0) : 0;

function validSnapshot(s, id) {
  if (!s || s.version !== 1 || s.id !== id || !Number.isSafeInteger(s.revision) || s.revision < 0
    || !['disconnected', 'attaching', 'ready', 'busy', 'blocked', 'needs-reconciliation', 'finalizing', 'closed'].includes(s.state)
    || !Array.isArray(s.attempts) || s.attempts.length > 1000 || !Array.isArray(s.assertions)
    || !s.finish || typeof s.finish.requested !== 'boolean'
    || !['idle', 'stopping', 'stopped', 'closing', 'done', 'failed', 'interrupted'].includes(s.finish.phase)
    || s.finish.requested !== (s.finish.phase !== 'idle')
    || !(s.sessionId === null || typeof s.sessionId === 'string' && s.sessionId.length > 0)
    || !(s.uncertainty === null || typeof s.uncertainty === 'string')
    || !Number.isFinite(Date.parse(s.createdAt)) || !Number.isFinite(Date.parse(s.updatedAt))) return false;
  if (s.binding && (typeof s.binding.targetId !== 'string' || !s.binding.targetId || typeof s.binding.origin !== 'string' || typeof s.binding.ownedByStudio !== 'boolean')) return false;
  if (s.binding && !validThread(s.binding.thread)) return false;
  // Absent identity is a legacy snapshot (handled on load); a present one must be consistent with the binding.
  if (s.identity !== undefined && !validIdentity(s.identity, s.binding?.thread)) return false;
  if (s.binding) {
    try { const url = new URL(s.binding.origin); if (url.origin !== s.binding.origin || url.protocol !== 'https:') return false; } catch { return false; }
  }
  if (s.state !== 'disconnected' && !s.binding) return false;
  // Observed-prefix recovery is additive: absent means an ordinary snapshot, present must be exact.
  if (s.prefix !== undefined && !validPrefixRecord(s.prefix)) return false;
  // Old saved snapshots may contain several attempts from earlier releases; never promote multiple observed sends.
  if (s.attempts.filter((a) => a?.send?.state === 'observed').length > 1 && s.attempts.some((a) => a.journal?.id !== a.id)) return false;
  return s.attempts.every((a) => typeof a.key === 'string' && a.key.length > 0 && typeof a.id === 'string'
```

_First 80 of 774 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
