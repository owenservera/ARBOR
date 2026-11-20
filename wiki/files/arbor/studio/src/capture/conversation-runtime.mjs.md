# File: studio/src/capture/conversation-runtime.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/conversation-runtime.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 65143 B |
| Lines | 883 |
| Hash | 6483aca38a3f |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| fail | function | 21 | no | const fail = (status, code) =&gt; Object.assign(new Error(code), { status, code }); |
| outward | function | 22 | no | function outward(e) { |
| leaseFailure | function | 28 | no | const leaseFailure = (e) =&gt; ({ code: /^[A-Z][A-Z0-9_]{0,79}$/.test(e?.code ?? &#39;&#39;) ? e.code : &#39;LEASE_RELEASE_FAILED&#39;, at: new Date().toISOString(), message: String(e?.message ?? e).slice(0, 300) }); |
| boundedReplyWait | function | 30 | no | async function boundedReplyWait(promise, ms) { |
| timer | variable | 31 | no | let timer; |
| createConversationRuntime | function | 37 | yes | export function createConversationRuntime({ paths, profileStore, familyStore, port = 9222, dependencies = {} } = {}) { |
| d | const | 38 | no | const d = { listTargets, getAdapter, createAdapter: createConversationBrowserAdapter, acquireLease: acquireDriveLease, |
| directory | const | 42 | no | const directory = path.join(paths.root, &#39;conversations&#39;); |
| entries | const | 44 | no | const entries = new Map(); let closed = false; |
| active | function | 45 | no | const active = () =&gt; { if (closed) throw fail(503, &#39;RUNTIME_CLOSED&#39;); }; |
| THREAD_REF | const | 47 | no | const THREAD_REF = THREAD_REF_PATTERN; |
| CHATGPT_THREAD_REF | const | 48 | no | const CHATGPT_THREAD_REF = /^chatgpt-c:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/; |
| collectThreadDenylist | function | 49 | no | async function collectThreadDenylist(site) { |
| refs | const | 50 | no | const refs = new Set(); |
| accept | function | 51 | no | const accept = (ref) =&gt; { if (THREAD_REF.test(ref ?? &#39;&#39;)) refs.add(ref); }; |
| prior | variable | 54 | no | let prior; try { prior = JSON.parse(readFileSync(path.join(directory, `${priorId}.conversation.json`), &#39;utf8&#39;)); } |
| scheduleBudget | function | 60 | no | function scheduleBudget(entry) { |
| tabs | function | 67 | no | const tabs = async () =&gt; { try { return await d.listTargets({ port }); } catch { throw fail(503, &#39;BROWSER_UNAVAILABLE&#39;); } }; |
| validId | function | 68 | no | const validId = (id) =&gt; /^[a-z0-9][a-z0-9_-]{0,127}$/i.test(id ?? &#39;&#39;); |
| ids | function | 69 | no | const ids = () =&gt; readdirSync(directory).filter((n) =&gt; n.endsWith(&#39;.conversation.json&#39;)).map((n) =&gt; n.slice(0, -&#39;.conversation.json&#39;.length)); |
| load | function | 70 | no | function load(id) { |
| owned | const | 76 | no | const owned = d.listSessions(paths.sessions).filter((s) =&gt; s.conversationOwner?.conversationId === id); |
| header | variable | 77 | no | let header; try { header = JSON.parse(readFileSync(path.join(directory, `${id}.conversation.json`), &#39;utf8&#39;)); } |
| pid | const | 79 | no | const pid = owned[0]?.conversationOwner?.pid ?? header?.owner?.pid; |
| adapter | const | 81 | no | const adapter = { async reconcile() { return null; }, async stop() { throw fail(409, &#39;RECOVERED_CAPTURE_INCOMPLETE&#39;); } }; |
| service | const | 82 | no | const service = createConversationService({ dataDir: directory, id, adapter, recover: !readOnly, context: { restarted: true, recoveredSessionId: owned[0]?.id } }); |
| entry | const | 83 | no | const entry = { service, adapter, recovered: true, readOnly, registration: Promise.resolve(), work: Promise.resolve(), lease: null, leaseReleaseError: null }; |
| peek | function | 89 | no | function peek(id) { |
| disk | variable | 92 | no | let disk; try { disk = JSON.parse(readFileSync(path.join(directory, `${id}.conversation.json`), &#39;utf8&#39;)); } |
| header | variable | 98 | no | let header; try { header = JSON.parse(readFileSync(path.join(directory, `${id}.conversation.json`), &#39;utf8&#39;)); } |
| service | variable | 100 | no | let service; try { service = createConversationService({ dataDir: directory, id, adapter: {}, recover: false }); } |
| pid | const | 102 | no | const pid = header?.owner?.pid; |
| noteEvidence | function | 108 | no | function noteEvidence(entry, event, data = {}) { |
| dcbJournalCandidate | function | 124 | no | async function dcbJournalCandidate({ id, body, snapshot }) { |
| dcb | const | 125 | no | const dcb = d.dcb; |
| at | const | 127 | no | const at = new Date().toISOString(); |
| input | const | 128 | no | const input = { |
| candidate | const | 140 | no | const candidate = await dcb.facade.prepareJournalCandidate(input); |
| assembled | const | 141 | no | const assembled = record({ bundleId: input.planInput.bundleId ?? null, definitionRevisions: candidate.definitionRevisions ?? [], sourceRefs: candidate.sourceRefs ?? [], packetDigest: candidate.packet… |
| preserveEvidence | function | 156 | no | function preserveEvidence(entry, trigger) { |
| run | function | 157 | no | const run = async () =&gt; { |
| at | const | 158 | no | const at = new Date().toISOString(); |
| snapshot | const | 160 | no | const snapshot = entry.service.read(); |
| journal | variable | 161 | no | let journal = null, journalError = null; |
| out | const | 164 | no | const out = await d.captureEvidence({ directory, id: entry.service.id, view: snapshot, journal, journalError, trigger, paths, timeline: entry.evidenceTimeline ?? [] }); |
| read | variable | 169 | no | let read = null; |
| verified | const | 172 | no | const verified = read?.state === &#39;verified&#39;; |
| gaps | const | 173 | no | const gaps = verified ? (Array.isArray(read.gaps) ? read.gaps : []) : (out.gaps ?? []); |
| view | function | 189 | no | function view(entry, summary = false, selectedTurn) { |
| s | const | 190 | no | const s = entry.service.read(), a = selectedTurn ?? s.attempts.at(-1); |
| pending | const | 191 | no | const pending = !!entry.pure &amp;&amp; !s.finish.requested &amp;&amp; s.state !== &#39;disconnected&#39; &amp;&amp; !entry.ownerAlive; |
| reply | const | 192 | no | const reply = { ...(a?.reply ?? s.reply) }; if (summary) delete reply.text; |
| turnView | function | 193 | no | const turnView = (turn) =&gt; { |
| r | const | 194 | no | const r = { ...turn.reply }; if (summary) delete r.text; |
| capture | const | 204 | no | const capture = { ...s.capture, bytesWritten: entry.recovered \|\| entry.pure ? s.capture.bytesWritten ?? 0 : entry.adapter.bytesWritten ?? 0 }; |
| observeReply | function | 228 | no | function observeReply(entry, attempt = entry.service.read().attempts.at(-1)) { |
| work | function | 235 | no | const work = (async () =&gt; { await entry.service.recordReply({ turnId: attempt.id, state: &#39;waiting&#39; }); let writes = Promise.resolve(), ended = false, terminalHandled = false; const persistUpdate = (u… |
| writes | variable | 237 | no | let writes = Promise.resolve(), ended = false, terminalHandled = false; |
| persistUpdate | function | 238 | no | const persistUpdate = (update) =&gt; { |
| saved | const | 240 | no | const saved = await entry.service.recordReply(update); |
| reply | const | 241 | no | const reply = saved.attempts.find(a =&gt; a.id === attempt.id)?.reply; |
| stopped | variable | 248 | no | let stopped = true; |
| publish | function | 261 | no | const publish = update =&gt; ended \|\| entry.finishing \|\| update.turnId !== attempt.id ? Promise.resolve() : persistUpdate(update); |
| reader | const | 264 | no | const reader = Promise.resolve().then(() =&gt; entry.adapter.readReply(publish, { turnId: attempt.id, payloadDigest: attempt.payloadDigest, boundary: attempt.boundary, threadKey: attempt.journal?.thread… |
| result | const | 267 | no | const result = await boundedReplyWait(reader, d.replyObservationMs); |
| saved | const | 271 | no | const saved = await publish({ ...result, turnId: attempt.id }); |
| reply | const | 272 | no | const reply = saved?.attempts.find(a =&gt; a.id === attempt.id)?.reply; |
| finishEntry | function | 293 | no | async function finishEntry(entry, body = {}) { |
| abortFailedConnect | function | 322 | no | async function abortFailedConnect(entry, lease) { |
| unaccounted | variable | 323 | no | let unaccounted = null; |
| out | variable | 327 | no | let out = { captureFinalized: true, tab: &#39;none&#39; }; |
| notes | const | 331 | no | const notes = []; |
| writerWindow | function | 358 | no | function writerWindow(entry) { |
| lease | const | 367 | no | const lease = entry.lease; entry.lease = null; |
| prefixLease | function | 384 | no | async function prefixLease(fn) { |
| lease | variable | 385 | no | let lease; |
| result | variable | 388 | no | let result, failure; |
| detail | const | 391 | no | const detail = leaseFailure(e); |
| prefixSnapshots | function | 398 | no | function prefixSnapshots(sourceId) { |
| value | variable | 400 | no | let value; |
| prefixSourceEvidence | function | 411 | no | function prefixSourceEvidence(records, request, targetId, origin) { |
| source | const | 412 | no | const source = records.find((s) =&gt; s.id === request.conversationId); |
| matches | const | 414 | no | const matches = source.attempts.filter((a) =&gt; a.id === request.attemptId); |
| attempt | const | 416 | no | const attempt = matches[0]; |
| session | variable | 422 | no | let session; |
| kv | variable | 429 | no | let kv = null; |
| prefixThreadFence | function | 437 | no | function prefixThreadFence(records, threadRef, sourceId, currentId = null) { |
| checkPrefixRequest | function | 444 | no | function checkPrefixRequest(body, sourceField = &#39;source&#39;) { |
| source | const | 445 | no | const source = body[sourceField]; |
| prefixMatch | function | 452 | no | function prefixMatch(records, request, expectedThread, targetId, attestation) { |
| found | const | 453 | no | const found = records.filter((s) =&gt; s.prefix?.source.conversationId === request.conversationId &amp;&amp; s.prefix?.source.attemptId === request.attemptId); |
| p | const | 456 | no | const p = found[0].prefix; |
| prefixRead | function | 463 | no | async function prefixRead(adapter, targetId, origin, threadRef) { |
| page | const | 465 | no | const page = await adapter.readPrefixEvidence({ targetId, origin, expectedThread: threadRef }); |
| readStamp | function | 469 | no | const readStamp = (page) =&gt; ({ at: new Date().toISOString(), assistantDigest: sha256Hex(page.messages[1].text), controls: &#39;idle&#39; }); |
| verifyPrefixReads | function | 470 | no | async function verifyPrefixReads(adapter, { targetId, origin, threadRef }, saved = null) { |
| first | const | 471 | no | const first = await prefixRead(adapter, targetId, origin, threadRef); |
| second | variable | 474 | no | let second; |
| changed | const | 477 | no | const changed = comparePrefixReads(first, second); |
| bindPrefix | function | 482 | no | async function bindPrefix(body) { |
| records | const | 485 | no | const records = prefixSnapshots(body.source.conversationId); |
| previous | const | 486 | no | const previous = prefixMatch(records, body.source, body.expectedThread, body.targetId, body.promptAttestation); |
| siteAdapter | const | 488 | no | const siteAdapter = await d.getAdapter(body.site); |
| targets | variable | 490 | no | let targets; try { targets = await tabs(); } catch { throw fail(409, &#39;PREFIX_TARGET_NOT_FOUND&#39;); } |
| target | const | 491 | no | const target = targets.find((t) =&gt; t.id === body.targetId); |
| origin | variable | 494 | no | let origin; try { origin = new URL(target.url).origin; } catch { throw fail(409, &#39;PREFIX_TARGET_ORIGIN_MISMATCH&#39;); } |
| source | const | 496 | no | const source = prefixSourceEvidence(records, body.source, body.targetId, origin); |
| id | const | 498 | no | const id = previous?.id ?? randomUUID(); |
| existing | const | 499 | no | const existing = entries.get(id); |
| adapter | const | 500 | no | const adapter = existing?.adapter ?? d.createAdapter({ paths, profileStore, familyStore, port, siteAdapter, targetId: body.targetId, freshTab: false, conversationId: id, ownerToken: null, maxBytes: d… |
| retained | variable | 502 | no | let retained = !!existing; |
| sampled | const | 504 | no | const sampled = await verifyPrefixReads(adapter, { targetId: body.targetId, origin, threadRef: body.expectedThread }, previous?.prefix); |
| prompt | const | 505 | no | const prompt = resolvePromptTier({ digest: source.attempt.payloadDigest, kv: source.kv, pageUserText: sampled.first.messages[0].text, attestation: body.promptAttestation ?? null, corroboration: sourc… |
| prefix | const | 509 | no | const prefix = { kind: &#39;observed-prefix&#39;, schema: 1, state: &#39;pending&#39;, |
| service | const | 520 | no | const service = createConversationService({ dataDir: directory, id, adapter, io: d.io, recover: false, context: { site: body.site, owner: { pid: process.pid, token: null, port } } }); |
| entry | const | 522 | no | const entry = { service, adapter, lease: null, registration: Promise.resolve(), work: Promise.resolve(), recovered: false, leaseReleaseError: null }; |
| connectPrefix | function | 530 | no | async function connectPrefix(body) { |
| records | const | 534 | no | const records = prefixSnapshots(body.prefixSource.conversationId); |
| stored | const | 535 | no | const stored = prefixMatch(records, body.prefixSource, body.expectedThread, body.targetId); |
| p | const | 537 | no | const p = stored.prefix; |
| source | const | 540 | no | const source = prefixSourceEvidence(records, body.prefixSource, body.targetId, p.target.origin); |
| entry | variable | 548 | no | let entry = entries.get(stored.id); |
| siteAdapter | const | 551 | no | const siteAdapter = await d.getAdapter(body.site); |
| adapter | const | 554 | no | const adapter = d.createAdapter({ paths, profileStore, familyStore, port, siteAdapter, targetId: body.targetId, freshTab: false, conversationId: stored.id, ownerToken: null, maxBytes: d.maxBytes }); |
| service | const | 556 | no | const service = createConversationService({ dataDir: directory, id: stored.id, adapter, io: d.io, recover: false }); |
| attached | const | 563 | no | const attached = await entry.service.connect({ targetId: p.target.targetId, origin: p.target.origin, ownedByStudio: false, thread: p.thread, identity: { state: &#39;bound&#39;, reason: null }, expectedRevisi… |
| page | const | 566 | no | const page = await prefixRead(entry.adapter, p.target.targetId, p.target.origin, p.thread.ref); |
| entry | const | 582 | no | const entry = entries.has(id) ? entries.get(id) : peek(id); |
| sites | function | 596 | no | const sites = (await Promise.all(ADAPTER_IDS.map(async (id) =&gt; { const a = await d.getAdapter(id); return a ? { id, adapter: a.id, url: a.url } : null; }))).filter(Boolean); |
| targets | const | 597 | no | const targets = []; |
| discovered | const | 598 | no | const discovered = await tabs(); |
| ownedTargetIds | const | 599 | no | const ownedTargetIds = ownedFreshTargetIds(entries.values(), discovered); |
| recordings | const | 602 | no | const recordings = discovered.some(t =&gt; String(t.url ?? &#39;&#39;).startsWith(&#39;https:&#39;)) |
| url | variable | 606 | no | let url; try { url = new URL(t.url); } catch { continue; } |
| a | const | 608 | no | const a = await d.getAdapter(url.href); if (!a \|\| !ADAPTER_IDS.includes(a.id)) continue; |
| recording | const | 609 | no | const recording = recordings.find((s) =&gt; s.target?.id === t.id); |
| thread | const | 611 | no | const thread = parseThread(a.id, t.url); |
| identity | const | 612 | no | const identity = threadSupported(a.id) ? (thread ? { state: &#39;bound&#39;, reason: null } : { state: &#39;unverified&#39;, reason: &#39;UNSUPPORTED_PATH&#39; }) : { state: &#39;unbound&#39;, reason: &#39;SITE_UNSUPPORTED&#39; }; |
| unknown | const | 627 | no | const unknown = Object.keys(body ?? {}).filter((k) =&gt; ![&#39;maxMessages&#39;, &#39;maxChars&#39;].includes(k)); |
| L | const | 628 | no | const L = TRANSCRIPT_LIMITS, count = (v, spec) =&gt; v === undefined ? spec.default : v; |
| maxMessages | const | 629 | no | const maxMessages = count(body.maxMessages, L.maxMessages), maxChars = count(body.maxChars, L.maxChars); |
| entry | const | 632 | no | const entry = entries.get(id); |
| s | const | 635 | no | const s = entry.service.read(); |
| out | variable | 639 | no | let out; |
| now | const | 642 | no | const now = entry.service.read(); |
| finished | function | 655 | no | const finished = (s) =&gt; s.finish.captureStopped === true \|\| s.finish.phase === &#39;done&#39;; |
| snapshot | const | 660 | no | const snapshot = { sessions: new Set(), pendingOwners: new Set(), uncertain: false }; |
| memory | const | 661 | no | const memory = new Map([...entries].map(([key, entry]) =&gt; [key, entry.service.read()])); |
| s | variable | 663 | no | let s; |
| snapshot | const | 673 | no | const snapshot = request.sessionActivity; |
| owned | const | 676 | no | const owned = JSON.parse(readFileSync(path.join(paths.sessions, id, &#39;session.json&#39;), &#39;utf8&#39;)); |
| freshTab | const | 690 | no | const freshTab = body.freshTab ?? !body.targetId; |
| siteAdapter | const | 693 | no | const siteAdapter = await d.getAdapter(body.site); |
| origin | variable | 695 | no | let origin = new URL(siteAdapter.url).origin; |
| thread | variable | 698 | no | let thread = null, identity = { state: &#39;unverified&#39;, reason: &#39;SITE_UNSUPPORTED&#39; }, threadDenylist; |
| target | const | 703 | no | const target = (await tabs()).find((t) =&gt; t.id === body.targetId); |
| matched | const | 705 | no | const matched = await d.getAdapter(target.url); |
| priorThreadRef | function | 721 | no | const priorThreadRef = (prior) =&gt; { |
| url | const | 725 | no | const url = JSON.parse(readFileSync(path.join(paths.sessions, prior.sessionId, &#39;session.json&#39;), &#39;utf8&#39;))?.target?.url; |
| prior | variable | 730 | no | let prior; try { prior = JSON.parse(readFileSync(path.join(directory, `${priorId}.conversation.json`), &#39;utf8&#39;)); } |
| id | const | 736 | no | const id = randomUUID(); |
| lease | const | 743 | no | const lease = freshTab ? d.acquireLease({ port, root: d.leaseRoot, holder: { kind: &#39;conversation&#39;, id } }) : null; |
| entry | variable | 744 | no | let entry; |
| adapter | const | 746 | no | const adapter = d.createAdapter({ paths, profileStore, familyStore, port, siteAdapter, targetId: body.targetId, freshTab, conversationId: id, ownerToken: lease?.token ?? null, maxBytes: d.maxBytes }); |
| service | const | 748 | no | const service = createConversationService({ dataDir: directory, id, adapter, io: d.io, context: { site: body.site, owner: { pid: process.pid, token: lease?.token ?? null, port }, capture: { endsAt: n… |
| connected | const | 756 | no | const connected = service.read(); |
| unaccounted | const | 764 | no | const unaccounted = await abortFailedConnect(entry, lease); |
| leaseReleaseError | const | 765 | no | const leaseReleaseError = entry?.leaseReleaseError ?? unaccounted; |
| stored | const | 775 | no | const stored = peek(id); |
| replay | const | 777 | no | const replay = stored.service.lookupRequest({ key: body.key, payloadDigest: createHash(&#39;sha256&#39;).update(body.prompt, &#39;utf8&#39;).digest(&#39;hex&#39;) }); |
| prefixState | const | 780 | no | const prefixState = stored.service.read().prefix?.state; |
| entry | const | 783 | no | const entry = load(id); |
| registered | const | 784 | no | const registered = entry.registration.then(async () =&gt; { const s = entry.service.read(), original = s.attempts.find((a) =&gt; a.key === body.key); // Idempotent replay is a pure read and is honoured eve… |
| s | const | 785 | no | const s = entry.service.read(), original = s.attempts.find((a) =&gt; a.key === body.key); |
| candidate | const | 799 | no | const candidate = await dcbJournalCandidate({ id: s.id, body, snapshot: s }); |
| prior | const | 810 | no | const prior = s.attempts.at(-1); |
| resolve | variable | 816 | no | let resolve, reject; |
| ack | const | 817 | no | const ack = new Promise((yes, no) =&gt; { resolve = yes; reject = no; }); |
| execution | const | 818 | no | const execution = entry.service.submit(body, { registered: (_, attempt) =&gt; { if (!s.prefix) resolve(view(entry, false, attempt)); }, writer: entry.writer }); |
| entry | const | 849 | no | const entry = load(id); |
| attempt | const | 854 | no | const attempt = body.turnId ? entry.service.read().attempts.find((a) =&gt; a.id === body.turnId) : entry.service.read().attempts.at(-1); |
| entry | const | 869 | no | const entry = peek(id); |
| snapshot | const | 870 | no | const snapshot = view(entry, true); |
| profile | const | 871 | no | const profile = snapshot.site ? await d.getAdapter(snapshot.site) : null; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 2 | external |
| node:path | import | 3 | external |
| node:crypto | import | 4 | external |
| node:timers/promises | import | 5 | external |
| ../cdp/discovery.mjs | import | 6 | [studio/src/cdp/discovery.mjs](../cdp/discovery.mjs.md) |
| ../profiles/sites/index.mjs | import | 7 | [studio/src/profiles/sites/index.mjs](../profiles/sites/index.mjs.md) |
| ../store/session.mjs | import | 8 | [studio/src/store/session.mjs](../store/session.mjs.md) |
| ./conversation-service.mjs | import | 9 | [studio/src/capture/conversation-service.mjs](./conversation-service.mjs.md) |
| ./conversation-browser-adapter.mjs | import | 10 | [studio/src/capture/conversation-browser-adapter.mjs](./conversation-browser-adapter.mjs.md) |
| ./conversation-prefix.mjs | import | 11 | [studio/src/capture/conversation-prefix.mjs](./conversation-prefix.mjs.md) |
| ./drive-lease.mjs | import | 13 | [studio/src/capture/drive-lease.mjs](./drive-lease.mjs.md) |
| ./conversation-thread.mjs | import | 14 | [studio/src/capture/conversation-thread.mjs](./conversation-thread.mjs.md) |
| ./conversation-capsule.mjs | import | 15 | [studio/src/capture/conversation-capsule.mjs](./conversation-capsule.mjs.md) |
| ./conversation-evidence.mjs | import | 16 | [studio/src/capture/conversation-evidence.mjs](./conversation-evidence.mjs.md) |
| ./chatgpt-chat-index-reader.mjs | import | 17 | [studio/src/capture/chatgpt-chat-index-reader.mjs](./chatgpt-chat-index-reader.mjs.md) |
| ./conversation-ownership.mjs | import | 18 | [studio/src/capture/conversation-ownership.mjs](./conversation-ownership.mjs.md) |
| ../agents/dcb-context-runtime.mjs | import | 19 | [studio/src/agents/dcb-context-runtime.mjs](../agents/dcb-context-runtime.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/conversation-api.mjs](../studio/conversation-api.mjs.md) | ../capture/conversation-runtime.mjs |
| [studio/test/unit/capture-conversation-evidence.test.mjs](../../test/unit/capture-conversation-evidence.test.mjs.md) | ../../src/capture/conversation-runtime.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// §15 shared library runtime. Browser effects live in the injected adapter, never GET/list.
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import { listTargets } from '../cdp/discovery.mjs';
import { getAdapter, ADAPTER_IDS } from '../profiles/sites/index.mjs';
import { listSessions } from '../store/session.mjs';
import { createConversationService, validConversationSnapshot } from './conversation-service.mjs';
import { createConversationBrowserAdapter } from './conversation-browser-adapter.mjs';
import { isPrefixCode, prefixId, preimageDigest, resolvePromptTier, checkPrefixPage, comparePrefixRead, comparePrefixReads,
  prefixGuardSource, sha256Hex, PREFIX_ORIGINS, validPrefixRecord } from './conversation-prefix.mjs';
import { acquireDriveLease } from './drive-lease.mjs';
import { parseThread, threadSupported, THREAD_REF_PATTERN, TRANSCRIPT_LIMITS } from './conversation-thread.mjs';
import { buildCapabilityCapsule } from './conversation-capsule.mjs';
import { captureConversationEvidence, readConversationEvidence } from './conversation-evidence.mjs';
import { readChatIndex } from './chatgpt-chat-index-reader.mjs';
import { ownedFreshTargetIds } from './conversation-ownership.mjs';
import { DCB_HOST_FACADE_SCHEMA } from '../agents/dcb-context-runtime.mjs';

const fail = (status, code) => Object.assign(new Error(code), { status, code });
function outward(e) {
  if (e.status) return e;
  return Object.assign(e, { status: /INVALID_|CONFIRM_REQUIRED/.test(e.code ?? '') ? 400 : 409 });
}
// Accounting shape for a lease release that could not be proven complete: the directory may still
// be occupied, so callers keep reporting it instead of silently claiming a free host.
const leaseFailure = (e) => ({ code: /^[A-Z][A-Z0-9_]{0,79}$/.test(e?.code ?? '') ? e.code : 'LEASE_RELEASE_FAILED',
  at: new Date().toISOString(), message: String(e?.message ?? e).slice(0, 300) });
async function boundedReplyWait(promise, ms) {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => {
    timer = setTimeout(() => reject(fail(504, 'REPLY_OBSERVATION_TIMEOUT')), ms);
  })]); } finally { clearTimeout(timer); }
}

export function createConversationRuntime({ paths, profileStore, familyStore, port = 9222, dependencies = {} } = {}) {
  const d = { listTargets, getAdapter, createAdapter: createConversationBrowserAdapter, acquireLease: acquireDriveLease,
    listSessions, readChatIndex, captureEvidence: captureConversationEvidence, readEvidence: readConversationEvidence,
    ownerIsAlive: (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code !== 'ESRCH'; } },
    maxDurationMs: 15 * 60 * 1000, maxBytes: 256 * 1024 * 1024, replyObservationMs: 125000, replyFinalizationMs: 10000, sleep, prefixStabilityMs: 1500, ...dependencies };
  const directory = path.join(paths.root, 'conversations');
  mkdirSync(directory, { recursive: true });
  const entries = new Map(); let closed = false;
  const active = () => { if (closed) throw fail(503, 'RUNTIME_CLOSED'); };
  // Denylist refs are per-site thread refs; the exact-prefix bind path below stays ChatGPT-only (its own `chatgpt-c:` check).
  const THREAD_REF = THREAD_REF_PATTERN;
  const CHATGPT_THREAD_REF = /^chatgpt-c:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  async function collectThreadDenylist(site) {
    const refs = new Set();
    const accept = (ref) => { if (THREAD_REF.test(ref ?? '')) refs.add(ref); };
    if (threadSupported(site)) for (const t of await tabs()) accept(parseThread(site, t.url)?.ref);
    for (const priorId of ids()) {
      let prior; try { prior = JSON.parse(readFileSync(path.join(directory, `${priorId}.conversation.json`), 'utf8')); }
      catch { throw fail(409, 'CORRUPT_OR_UNREADABLE_SNAPSHOT'); }
      accept(prior?.binding?.thread?.ref);
    }
    return [...refs];
  }
  function scheduleBudget(entry) {
    if (entry.timer || entry.recovered) return;
    entry.timer = setTimeout(() => {
      entry.service.recordCapture({ limitReason: 'duration-budget' }).then(() => finishEntry(entry)).catch(() => {});
    }, d.maxDurationMs); entry.timer.unref?.();
  }
  // An unreachable DevTools endpoint is an environment condition, not an internal error.
  const tabs = async () => { try { return await d.listTargets({ port }); } catch { throw fail(503, 'BROWSER_UNAVAILABLE'); } };
  const validId = (id) => /^[a-z0-9][a-z0-9_-]{0,127}$/i.test(id ?? '');
  const ids = () => readdirSync(directory).filter((n) => n.endsWith('.conversation.json')).map((n) => n.slice(0, -'.conversation.json'.length));
  function load(id) {
    if (!/^[a-z0-9][a-z0-9_-]{0,127}$/i.test(id ?? '')) throw fail(400, 'INVALID_CONVERSATION_ID');
    if (entries.has(id)) return entries.get(id);
    if (!ids().includes(id)) throw fail(404, 'CONVERSATION_NOT_FOUND');
    // No browser/recorder reattachment on restart. Owner metadata repairs the attach/save window
    // without making an interrupted capture appear finalized or replaying any action.
    const owned = d.listSessions(paths.sessions).filter((s) => s.conversationOwner?.conversationId === id);
    let header; try { header = JSON.parse(readFileSync(path.join(directory, `${id}.conversation.json`), 'utf8')); }
    catch { throw fail(409, 'CORRUPT_OR_UNREADABLE_SNAPSHOT'); }
    const pid = owned[0]?.conversationOwner?.pid ?? header?.owner?.pid;
    const readOnly = Number.isInteger(pid) && pid > 0 && d.ownerIsAlive(pid);
```

_First 80 of 884 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
