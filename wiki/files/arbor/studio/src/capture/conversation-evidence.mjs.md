# File: studio/src/capture/conversation-evidence.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/conversation-evidence.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 26497 B |
| Lines | 396 |
| Hash | 06a54696041a |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| EVIDENCE_SCHEMA | const | 30 | yes | export const EVIDENCE_SCHEMA = &#39;aion.conversation-evidence/1&#39;; |
| EVIDENCE_VERSION | const | 31 | yes | export const EVIDENCE_VERSION = 1; |
| EVIDENCE_SUFFIX | const | 32 | yes | export const EVIDENCE_SUFFIX = &#39;.evidence.json&#39;; |
| EVIDENCE_LIMITS | const | 34 | yes | export const EVIDENCE_LIMITS = Object.freeze({ maxHashBytes: 8 * 1024 * 1024, // per file; larger files keep size/pointer but no digest maxSessions: 16, maxDatasets: 24, maxKvFiles: 16, |
| ID_RE | const | 43 | no | const ID_RE = /^[a-z0-9][a-z0-9._-]{0,127}$/i; |
| nowIso | function | 44 | no | const nowIso = () =&gt; new Date().toISOString(); |
| sha256 | function | 45 | no | const sha256 = (value) =&gt; createHash(&#39;sha256&#39;).update(value).digest(&#39;hex&#39;); |
| failure | function | 46 | no | const failure = (stage, code, message) =&gt; ({ stage, code: String(code ?? &#39;EVIDENCE_FAILURE&#39;).slice(0, 80), message: String(message ?? &#39;&#39;).slice(0, 300) }); |
| rel | function | 47 | no | const rel = (root, file) =&gt; path.relative(root, file).replaceAll(&#39;\\\\&#39;, &#39;/&#39;); |
| evidenceFileFor | function | 49 | yes | export function evidenceFileFor(directory, conversationId) { |
| boundedFile | function | 55 | no | function boundedFile(file, { io, maxHashBytes }) { |
| stat | variable | 56 | no | let stat; |
| out | const | 60 | no | const out = { present: true, bytes: stat.size, sha256: null }; |
| readJsonFile | function | 67 | no | function readJsonFile(file, { io, failures, stage }) { |
| raw | variable | 68 | no | let raw; |
| within | function | 81 | no | function within(root, candidate) { |
| a | const | 82 | no | const a = path.resolve(root), b = path.resolve(candidate); |
| journalReference | function | 86 | no | function journalReference({ directory, view, io, maxHashBytes, failures }) { |
| thread | const | 87 | no | const thread = view?.binding?.thread; |
| name | variable | 91 | no | let name; |
| file | const | 97 | no | const file = path.join(directory, &#39;thread-turns&#39;, name); |
| pointer | const | 98 | no | const pointer = { state: &#39;referenced&#39;, path: rel(directory, file), ...boundedFile(file, { io, maxHashBytes }) }; |
| collectSessionIds | function | 102 | no | function collectSessionIds(view, journal) { |
| ids | const | 103 | no | const ids = new Set(); |
| accept | function | 104 | no | const accept = (value) =&gt; { if (typeof value === &#39;string&#39; &amp;&amp; ID_RE.test(value)) ids.add(value); }; |
| KV_KEYS | const | 122 | no | const KV_KEYS = [&#39;STATE&#39;, &#39;DOM_TURNS&#39;, &#39;DOM_INSPECT&#39;, &#39;ASSEMBLED&#39;, &#39;KNOWLEDGE_STATUS&#39;, &#39;RECEIPT&#39;, &#39;STREAM_DOM_JOIN&#39;, &#39;STREAM_COMPONENTS&#39;]; |
| sessionEvidence | function | 124 | no | function sessionEvidence({ sessionsRoot, sessionId, turnIds, io, limits, failures, root }) { |
| out | const | 125 | no | const out = { sessionId, pointer: null, present: false }; |
| dir | const | 127 | no | const dir = path.join(sessionsRoot, sessionId); |
| stat | variable | 129 | no | let stat; |
| meta | const | 137 | no | const meta = readJsonFile(path.join(dir, &#39;session.json&#39;), { io, failures, stage: &#39;session.meta&#39; }); |
| m | const | 139 | no | const m = meta.value ?? {}; |
| manifest | const | 149 | no | const manifest = readJsonFile(path.join(dir, &#39;raw&#39;, &#39;manifest.json&#39;), { io, failures, stage: &#39;session.raw&#39; }); |
| datasetDir | const | 156 | no | const datasetDir = path.join(dir, &#39;datasets&#39;); |
| names | variable | 157 | no | let names = []; |
| kvDir | const | 166 | no | const kvDir = path.join(dir, &#39;kv&#39;); |
| wanted | const | 167 | no | const wanted = [...KV_KEYS, ...turnIds.map((id) =&gt; `CONVERSATION_ATTEMPT_${id}`)]; |
| file | const | 169 | no | const file = path.join(kvDir, `${key}.json`); |
| turnProjection | function | 175 | no | function turnProjection(turn) { |
| j | const | 176 | no | const j = turn?.journal ?? turn; |
| deriveGaps | function | 191 | no | function deriveGaps({ view, journal, journalState, sessions }) { |
| gaps | const | 192 | no | const gaps = []; |
| turns | const | 193 | no | const turns = journal?.turns ?? view?.attempts ?? []; |
| t | const | 195 | no | const t = turnProjection(turn); |
| coverage | function | 223 | no | function coverage({ sessions }) { |
| derived | const | 224 | no | const derived = sessions.flatMap((s) =&gt; s.datasets ?? []); |
| knowledge | const | 225 | no | const knowledge = sessions.flatMap((s) =&gt; (s.kv ?? []).filter((k) =&gt; k.key === &#39;KNOWLEDGE_STATUS&#39;)); |
| readHistory | function | 238 | no | function readHistory(file, { io, failures }) { |
| raw | variable | 239 | no | let raw; |
| parsed | const | 243 | no | const parsed = JSON.parse(raw); |
| captureConversationEvidence | function | 257 | yes | export function captureConversationEvidence({ directory, id, view, journal = null, journalError = null, trigger = &#39;turn&#39;, paths = {}, timeline = [], limits = {}, io = fs, now = nowIso } = {}) { |
| file | const | 260 | no | const file = evidenceFileFor(directory, id); |
| L | const | 261 | no | const L = { ...EVIDENCE_LIMITS, ...limits }; |
| failures | const | 262 | no | const failures = []; |
| root | const | 263 | no | const root = paths?.root ? path.resolve(paths.root) : path.dirname(directory); |
| sessionsRoot | const | 264 | no | const sessionsRoot = paths?.sessions ? path.resolve(paths.sessions) : null; |
| at | const | 265 | no | const at = now(); |
| snapshotFile | const | 267 | no | const snapshotFile = path.join(directory, `${id}.conversation.json`); |
| snapshot | const | 268 | no | const snapshot = boundedFile(snapshotFile, { io, maxHashBytes: L.maxHashBytes }); |
| journalPointer | const | 269 | no | const journalPointer = journalReference({ directory, view, io, maxHashBytes: L.maxHashBytes, failures }); |
| turnIds | const | 273 | no | const turnIds = (journal?.turns ?? view.attempts ?? []).map((t) =&gt; t?.id).filter((v) =&gt; typeof v === &#39;string&#39;); |
| sessionIds | const | 274 | no | const sessionIds = collectSessionIds(view, journal).slice(0, L.maxSessions); |
| sessions | const | 275 | no | const sessions = sessionIds.map((sessionId) =&gt; sessionEvidence({ sessionsRoot, sessionId, turnIds, io, limits: L, failures, root })); |
| turns | const | 277 | no | const turns = (journal?.turns ?? []).length ? journal.turns.map(turnProjection) : (view.attempts ?? []).map(turnProjection); |
| gaps | const | 278 | no | const gaps = deriveGaps({ view, journal, journalState: journalPointer.state, sessions }); |
| fingerprint | const | 279 | no | const fingerprint = sha256(JSON.stringify([view.revision ?? null, journal?.revision ?? null, view.state ?? null, view.capture?.state ?? null, view.finish?.phase ?? null, turns.map((t) =&gt; [t.id, t.rev… |
| previous | const | 282 | no | const previous = readHistory(file, { io, failures }); |
| history | const | 289 | no | const history = previous.history.slice(-Math.max(0, L.maxHistory - 1)); |
| checkpoint | const | 290 | no | const checkpoint = { |
| revision | const | 325 | no | const revision = previous.revision + 1; |
| body | const | 326 | no | const body = `${JSON.stringify({ ...checkpoint, revision }, null, 2)}\\n`; |
| temporary | const | 327 | no | const temporary = `${file}.${sha256(`${at}:${fingerprint}`).slice(0, 8)}.tmp`; |
| fd | variable | 328 | no | let fd; |
| EVIDENCE_SOURCE | const | 357 | yes | export const EVIDENCE_SOURCE = &#39;conversation-evidence-checkpoint&#39;; |
| readConversationEvidence | function | 358 | yes | export function readConversationEvidence({ directory, id, io = fs, maxBytes = EVIDENCE_LIMITS.maxHashBytes } = {}) { |
| file | const | 361 | no | const file = evidenceFileFor(directory, id); |
| base | const | 362 | no | const base = { source: EVIDENCE_SOURCE, schema: EVIDENCE_SCHEMA, version: EVIDENCE_VERSION, file, conversationId: id }; |
| unavailable | function | 363 | no | const unavailable = (state, reason) =&gt; ({ ...base, state, reason, sha256: null, bytes: null, revision: null, turns: [], sessions: [], gaps: [{ code: &#39;EVIDENCE_CHECKPOINT_UNAVAILABLE&#39;, reason }], fail… |
| stat | variable | 366 | no | let stat; |
| raw | variable | 370 | no | let raw; |
| parsed | variable | 373 | no | let parsed; |
| turns | const | 378 | no | const turns = (Array.isArray(parsed.turns) ? parsed.turns : []).map((t) =&gt; ({ ...t, // Honest flags recomputed from the persisted delivery/reply states: only a positively // observed delivery/reply c… |
| prefix | const | 385 | no | const prefix = parsed.conversation?.prefix ?? null; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 25 | external |
| node:fs | import | 26 | external |
| node:path | import | 27 | external |
| ./thread-turn-journal.mjs | import | 28 | [studio/src/capture/thread-turn-journal.mjs](./thread-turn-journal.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/capture/conversation-runtime.mjs](./conversation-runtime.mjs.md) | ./conversation-evidence.mjs |
| [studio/test/unit/capture-conversation-evidence.test.mjs](../../test/unit/capture-conversation-evidence.test.mjs.md) | ../../src/capture/conversation-evidence.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
/**
 * Bounded local engineering-evidence preservation for one conversation.
 *
 * This module is a READER of the runtime's existing private evidence. It never touches the
 * browser, never mutates the conversation snapshot or the thread journal, never admits/observes
 * a turn, and never grants acceptance. It writes one small, versioned checkpoint file next to
 * the conversation snapshot:
 *
 *   <paths.root>/conversations/<conversationId>.evidence.json
 *
 * A checkpoint preserves EXACT references (paths + sha256 + revisions + native turn ids) to:
 *   - the conversation snapshot revision that was current at preservation time,
 *   - the thread-turn journal revision and its turns (delivery/reply/readiness/completion),
 *   - every capture session referenced by those turns (session.json, raw manifest segments,
 *     dataset pointers/hashes, selected kv evidence pointers/hashes),
 *   - the runtime's own bounded timing observations,
 * plus honest coverage: UI / knowledge / outcome are 'unknown' because the runtime has no
 * observation that would justify anything stronger. Capture completion is never acceptance.
 *
 * Failures (missing files, unreadable hashes, unbound identity, oversized files) are recorded
 * inside the checkpoint. A failed write itself is reported to the caller, which treats it as
 * best-effort lifecycle telemetry. It cannot stop capture, resend anything, or mark a capture
 * finalized.
 */
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import path from 'node:path';
import { canonicalThreadKey } from './thread-turn-journal.mjs';

export const EVIDENCE_SCHEMA = 'aion.conversation-evidence/1';
export const EVIDENCE_VERSION = 1;
export const EVIDENCE_SUFFIX = '.evidence.json';

export const EVIDENCE_LIMITS = Object.freeze({
  maxHashBytes: 8 * 1024 * 1024, // per file; larger files keep size/pointer but no digest
  maxSessions: 16,
  maxDatasets: 24,
  maxKvFiles: 16,
  maxHistory: 16,
  maxTimeline: 200,
});

const ID_RE = /^[a-z0-9][a-z0-9._-]{0,127}$/i;
const nowIso = () => new Date().toISOString();
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const failure = (stage, code, message) => ({ stage, code: String(code ?? 'EVIDENCE_FAILURE').slice(0, 80), message: String(message ?? '').slice(0, 300) });
const rel = (root, file) => path.relative(root, file).replaceAll('\\', '/');

export function evidenceFileFor(directory, conversationId) {
  if (typeof directory !== 'string' || !directory) throw new Error('EVIDENCE_DIRECTORY_REQUIRED');
  if (!ID_RE.test(conversationId ?? '')) throw new Error('INVALID_CONVERSATION_ID');
  return path.join(directory, `${conversationId}${EVIDENCE_SUFFIX}`);
}

function boundedFile(file, { io, maxHashBytes }) {
  let stat;
  try { stat = io.statSync(file); }
  catch (e) { return { present: false, reason: e?.code === 'ENOENT' ? 'MISSING' : 'UNREADABLE', error: String(e?.code ?? e?.message ?? e) }; }
  if (!stat.isFile()) return { present: false, reason: 'NOT_A_FILE' };
  const out = { present: true, bytes: stat.size, sha256: null };
  if (stat.size > maxHashBytes) { out.reason = 'HASH_SIZE_CAP'; return out; }
  try { out.sha256 = sha256(io.readFileSync(file)); }
  catch (e) { out.reason = 'READ_FAILED'; out.error = String(e?.code ?? e?.message ?? e); }
  return out;
}

function readJsonFile(file, { io, failures, stage }) {
  let raw;
  try { raw = io.readFileSync(file, 'utf8'); }
  catch (e) {
    if (e?.code !== 'ENOENT') failures.push(failure(stage, e?.code ?? 'READ_FAILED', `${rel(path.dirname(path.dirname(file)), file)}: ${e?.message ?? e}`));
    return { state: 'absent', value: null };
  }
  try { return { state: 'present', value: JSON.parse(raw) }; }
  catch (e) {
    failures.push(failure(stage, 'CORRUPT_JSON', `${file}: ${e?.message ?? e}`));
    return { state: 'unreadable', value: null };
  }
}
```

_First 80 of 397 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
