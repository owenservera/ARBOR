# File: studio/src/capture/thread-turn-journal.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/thread-turn-journal.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 28008 B |
| Lines | 436 |
| Hash | a25283fea42b |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| now | function | 46 | no | const now = () =&gt; new Date().toISOString(); |
| error | function | 47 | no | const error = (code) =&gt; Object.assign(new Error(code), { code }); |
| hash | function | 48 | no | const hash = (value) =&gt; createHash(&#39;sha256&#39;).update(value, &#39;utf8&#39;).digest(&#39;hex&#39;); |
| digest | function | 49 | no | const digest = (value) =&gt; typeof value === &#39;string&#39; &amp;&amp; /^[a-f0-9]{64}$/.test(value); |
| id | function | 50 | no | const id = (value) =&gt; typeof value === &#39;string&#39; &amp;&amp; value.length &gt; 0 &amp;&amp; value.length &lt;= 200 &amp;&amp; !/[\\u0000-\\u001f\\u007f]/.test(value); |
| count | function | 51 | no | const count = (value) =&gt; Number.isSafeInteger(value) &amp;&amp; value &gt;= 0; |
| date | function | 52 | no | const date = (value) =&gt; typeof value === &#39;string&#39; &amp;&amp; Number.isFinite(Date.parse(value)); |
| phases | const | 53 | no | const phases = [&#39;preparing&#39;, &#39;typing&#39;, &#39;dispatching&#39;, &#39;unknown&#39;, &#39;blocked&#39;, &#39;delivered&#39;]; |
| MAX_TURNS | const | 54 | no | const MAX_TURNS = 1000; // Never evict old request keys to make room for a retry. |
| ADMISSION_MODES | const | 55 | no | const ADMISSION_MODES = [&#39;interactive-ready&#39;, &#39;network-completion&#39;]; |
| INTERACTIVE_READINESS_RULE | const | 56 | yes | export const INTERACTIVE_READINESS_RULE = Object.freeze({ id: &#39;chatgpt-controls-idle&#39;, version: 1 }); |
| digestTurnPayload | function | 58 | yes | export function digestTurnPayload(payload) { |
| canonicalThreadKey | function | 63 | yes | export function canonicalThreadKey({ namespace, origin, thread } = {}) { |
| url | variable | 64 | no | let url; |
| uuid | const | 66 | no | const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/; |
| validBoundary | function | 75 | no | const validBoundary = (b) =&gt; !!b &amp;&amp; id(b.sessionId) &amp;&amp; count(b.sequence) &amp;&amp; count(b.transcriptCount); |
| attributed | function | 76 | no | function attributed(e, a) { |
| validDelivery | function | 80 | no | function validDelivery(e, a) { |
| validReply | function | 83 | no | function validReply(e, a, complete = false) { |
| sameReplyMetadata | function | 88 | no | const sameReplyMetadata = (a, b) =&gt; !!a &amp;&amp; !!b &amp;&amp; a.identity === b.identity &amp;&amp; a.revision === b.revision |
| validReadiness | function | 90 | no | function validReadiness(e, a, threadKey) { |
| r | const | 91 | no | const r = a.reply.evidence; |
| validProof | function | 104 | no | function validProof(e, a) { |
| evidenceView | function | 108 | no | function evidenceView(e, withRevision = false, withContent = false) { |
| readinessView | function | 113 | no | function readinessView(e) { |
| resolved | function | 121 | no | const resolved = (a, mode) =&gt; a.phase === &#39;blocked&#39; \|\| a.delivery.state === &#39;observed&#39; |
| validTurn | function | 125 | no | function validTurn(a, threadKey) { |
| validSnapshot | function | 145 | no | function validSnapshot(s, threadKey) { |
| readThreadTurnJournalEvidence | function | 170 | yes | export function readThreadTurnJournalEvidence({dataDir,namespace,origin,thread,conversationId,io=fs}={}) { |
| threadKey | const | 171 | no | const threadKey=canonicalThreadKey({namespace,origin,thread}); |
| file | const | 174 | no | const file=path.join(dataDir,hash(threadKey)+&#39;.turn-journal.json&#39;); |
| base | const | 175 | no | const base={source:&#39;thread-turn-journal&#39;,file,checksum:null,revision:null,turns:[],gaps:[{code:&#39;JOURNAL_MISSING&#39;}]}; |
| raw | variable | 176 | no | let raw; |
| stat | const | 178 | no | const stat=io.lstatSync(file); |
| envelope | variable | 187 | no | let envelope; |
| mine | const | 194 | no | const mine=envelope.snapshot.turns.filter(t=&gt;t.conversationId===conversationId); |
| gaps | const | 195 | no | const gaps=[]; |
| createThreadTurnJournal | function | 221 | yes | export function createThreadTurnJournal({ dataDir, namespace, origin, thread, admissionMode = &#39;interactive-ready&#39;, io = fs } = {}) { |
| threadKey | const | 222 | no | const threadKey = canonicalThreadKey({ namespace, origin, thread }); |
| name | const | 226 | no | const name = hash(threadKey), file = path.join(dataDir, `${name}.turn-journal.json`); |
| lockRoot | const | 229 | no | const lockRoot = path.join(dataDir, &#39;.thread-turn-locks&#39;, name); |
| poisoned | variable | 230 | no | let poisoned = false; |
| admittedHere | const | 231 | no | const admittedHere = new Set(); |
| load | function | 232 | no | function load() { |
| envelope | variable | 233 | no | let envelope; |
| save | function | 244 | no | function save(snapshot) { |
| temporary | const | 245 | no | const temporary = `${file}.${randomUUID()}.tmp`; |
| fd | variable | 246 | no | let fd; |
| healthy | function | 263 | no | function healthy() { if (poisoned) throw error(&#39;JOURNAL_PERSISTENCE_FAILED_REOPEN_REQUIRED&#39;); } |
| transaction | function | 264 | no | function transaction(fn) { |
| lease | variable | 266 | no | let lease; |
| update | function | 275 | no | function update({ turnId, expectedRevision } = {}, fn) { |
| a | const | 277 | no | const a = snapshot.turns.find((a) =&gt; a.id === turnId); |
| original | function | 288 | no | function original(snapshot, key, payloadDigest) { |
| a | const | 289 | no | const a = snapshot.turns.find((a) =&gt; a.key === key); |
| evidencePhase | function | 293 | no | const evidencePhase = (a) =&gt; { |
| checkEvidenceOwner | function | 296 | no | function checkEvidenceOwner(snapshot, a, e, outgoing = false) { |
| snapshot | const | 309 | no | const snapshot = load(), a = snapshot.turns.find((a) =&gt; a.id === turnId); |
| replay | const | 319 | no | const replay = original(load(), key, payloadDigest); |
| result | const | 321 | no | const result = transaction((snapshot) =&gt; { const raced = original(snapshot, key, payloadDigest); if (raced) return { admitted: false, turn: structuredClone(raced) }; if (snapshot.turns.some((a) =&gt; !r… |
| raced | const | 322 | no | const raced = original(snapshot, key, payloadDigest); |
| at | const | 326 | no | const at = now(), a = { id: randomUUID(), key, conversationId, payloadDigest, revision: 1, phase: &#39;preparing&#39;, |
| b | const | 342 | no | const b = options.boundary; |
| e | const | 365 | no | const e = options.evidence; |
| e | const | 375 | no | const e = options.evidence; |
| e | const | 389 | no | const e = options.evidence; |
| previous | const | 392 | no | const previous = a.reply.evidence, terminal = a.completion.evidence; |
| e | const | 407 | no | const e = options.evidence; |
| evidence | const | 409 | no | const evidence = readinessView(e); |
| e | const | 425 | no | const e = options.evidence; |
| previous | const | 428 | no | const previous = a.completion.evidence, observed = a.reply.evidence; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 40 | external |
| node:path | import | 41 | external |
| node:crypto | import | 42 | external |
| ./drive-lease.mjs | import | 43 | [studio/src/capture/drive-lease.mjs](./drive-lease.mjs.md) |
| ./conversation-thread.mjs | import | 44 | [studio/src/capture/conversation-thread.mjs](./conversation-thread.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/test/conversation-native-knowledge.test.mjs](../../../apps/vivim-host/test/conversation-native-knowledge.test.mjs.md) | ../../../studio/src/capture/thread-turn-journal.mjs |
| [apps/vivim-host/test/studio-journal-evidence.test.mjs](../../../apps/vivim-host/test/studio-journal-evidence.test.mjs.md) | ../../../studio/src/capture/thread-turn-journal.mjs |
| [studio/src/capture/conversation-evidence.mjs](./conversation-evidence.mjs.md) | ./thread-turn-journal.mjs |
| [studio/src/capture/conversation-service.mjs](./conversation-service.mjs.md) | ./thread-turn-journal.mjs |
| [studio/src/studio/relay-journal-correlation.mjs](../studio/relay-journal-correlation.mjs.md) | ../capture/thread-turn-journal.mjs |
| [studio/src/studio/world-conversation-activity.mjs](../studio/world-conversation-activity.mjs.md) | ../capture/thread-turn-journal.mjs |
| [studio/test/unit/capture-conversation-evidence.test.mjs](../../test/unit/capture-conversation-evidence.test.mjs.md) | ../../src/capture/thread-turn-journal.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
/**
 * Local metadata only; no actuator, transcript bodies, automatic recovery writes or browser retries.
 * All clients for an owner MUST share dataDir + namespace + canonical origin/thread. Conversation,
 * target and capture-session ids are deliberately NOT the thread's exclusion/idempotency scope.
 *
 * reserve -> markTyping(boundary) -> markDispatching must each return successfully BEFORE its
 * corresponding effect. A returned replay is NOT a new effect permit: only the caller that created
 * an admitted reservation may progress it, using its turn revision. reserve returns {admitted,turn};
 * admitted=false always means inspection/reconciliation only. Effect transitions also require the
 * same journal instance that admitted the turn; reopen never resumes typing/submission. This
 * journal does not replace the runtime's live driver lease across the actual browser effects.
 * Every unresolved reservation fences its thread, including after a crash before/after an effect.
 * Interactive admission requires positive delivery + turn-owned reply + versioned adapter
 * readiness (stable reply metadata AND positively observed idle/terminal generation controls).
 * Strict 'network-completion' mode additionally requires network terminal completion. Neither
 * mode admits unknown delivery. A trusted positive no-effects audit may permit a fresh key;
 * 'not found', timeout, notDispatched alone, user assertion or DOM quiet cannot.
 * Readiness is cached evidence, NOT current browser authorization: runtime MUST freshly preflight
 * exact thread, current reply identity/revision/content, generation controls and empty draft after
 * reserve and immediately before typing; re-preflight before dispatch if binding/control state
 * may have changed. Never perform an effect on stale preflight or a replayed/loaded turn.
 *
 * Evidence methods are INTERNAL trusted-adapter inputs, not public user assertion endpoints.
 * An actuator-audit proof must positively establish BOTH typing and dispatch never executed;
 * the journal validates attribution/shape, not the truth of an external proof reference.
 * Delivery, reply revisions, interactive readiness and terminal completion are independent. No
 * completion is inferred from DOM stability; terminal completion requires network evidence.
 * The internal adapter's fixed readiness rule must observe the SAME identity/revision/SHA-256
 * content digest/JS character count in two ordered samples, with current exact-thread controls
 * and observed delivery FIRST; both samples must be strictly after its captured sequence,
 * positively idle/terminal at the latter sample. Two quiet samples or absent Stop alone are NOT
 * the rule. New reply revisions clear readiness; readiness never asserts capture acceptance.
 * Evidence identity/reference fields are opaque durable IDs, never text; capture-local IDs must
 * be capture-qualified by the adapter. One outgoing/reply identity cannot belong to two turns.
 * Files use flushed atomic replacement + final-file fsync, as in conversation-service. Directory
 * fsync is not portable on Windows: no power-loss/host-filesystem losslessness claim is made.
 * Schema v2 persists admissionMode; older/incompatible stores are rejected, never auto-upgraded
 * or silently reopened under a weaker policy. Thread-key/file identity is unchanged by policy.
 */
import * as fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { acquireDriveLease } from './drive-lease.mjs';
import { THREAD_KINDS, THREAD_HOSTS_BY_KIND } from './conversation-thread.mjs';

const now = () => new Date().toISOString();
const error = (code) => Object.assign(new Error(code), { code });
const hash = (value) => createHash('sha256').update(value, 'utf8').digest('hex');
const digest = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const id = (value) => typeof value === 'string' && value.length > 0 && value.length <= 200 && !/[\u0000-\u001f\u007f]/.test(value);
const count = (value) => Number.isSafeInteger(value) && value >= 0;
const date = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));
const phases = ['preparing', 'typing', 'dispatching', 'unknown', 'blocked', 'delivered'];
const MAX_TURNS = 1000; // Never evict old request keys to make room for a retry.
const ADMISSION_MODES = ['interactive-ready', 'network-completion'];
export const INTERACTIVE_READINESS_RULE = Object.freeze({ id: 'chatgpt-controls-idle', version: 1 });

export function digestTurnPayload(payload) {
  if (typeof payload !== 'string' || !payload.length) throw error('INVALID_TURN_PAYLOAD');
  return hash(payload);
}

export function canonicalThreadKey({ namespace, origin, thread } = {}) {
  let url;
  try { url = new URL(origin); } catch { throw error('INVALID_THREAD_SCOPE'); }
  const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
  if (typeof namespace !== 'string' || !/^[a-z0-9][a-z0-9_.-]{0,127}$/i.test(namespace)
    || url.protocol !== 'https:' || url.origin !== origin || !THREAD_KINDS.includes(thread?.kind)
    // A known provider host may only carry that provider's thread kind. Other origins stay namespaced by origin.
    || Object.entries(THREAD_HOSTS_BY_KIND).some(([kind, hosts]) => hosts.includes(url.hostname) && kind !== thread.kind)
    || typeof thread.id !== 'string' || !uuid.test(thread.id) || thread.ref !== `${thread.kind}:${thread.id}`) throw error('INVALID_THREAD_SCOPE');
  return JSON.stringify(['thread-turn-journal-v1', namespace, origin, thread.ref]);
}

const validBoundary = (b) => !!b && id(b.sessionId) && count(b.sequence) && count(b.transcriptCount);
function attributed(e, a) {
  return !!e && !!a.boundary && e.turnId === a.id && e.payloadDigest === a.payloadDigest
    && e.sessionId === a.boundary.sessionId && count(e.sequence) && e.sequence > a.boundary.sequence && id(e.identity);
}
function validDelivery(e, a) {
```

_First 80 of 437 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
