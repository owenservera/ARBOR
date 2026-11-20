# File: studio/test/unit/capture-conversation-evidence.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/test/unit/capture-conversation-evidence.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 16579 B |
| Lines | 261 |
| Hash | f28cfcd0e8d5 |
| Test | yes |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| uuid | const | 25 | no | const uuid = &#39;00000000-0000-0000-0000-000000000001&#39;; |
| thread | const | 26 | no | const thread = { kind: &#39;chatgpt-c&#39;, id: uuid, ref: `chatgpt-c:${uuid}` }; |
| origin | const | 27 | no | const origin = &#39;https://chatgpt.com&#39;; |
| stamp | const | 28 | no | const stamp = &#39;2026-11-20T12:00:00.000Z&#39;; |
| sha256File | function | 29 | no | const sha256File = (file) =&gt; createHash(&#39;sha256&#39;).update(readFileSync(file)).digest(&#39;hex&#39;); |
| tmp | function | 31 | no | function tmp(t, prefix) { |
| root | const | 32 | no | const root = mkdtempSync(path.join(os.tmpdir(), prefix)); |
| makeJournal | function | 37 | no | function makeJournal(root) { |
| dataDir | const | 38 | no | const dataDir = path.join(root, &#39;thread-turns&#39;); |
| driveDeliveredTurn | function | 44 | no | function driveDeliveredTurn(journal, conversationId, key, prompt) { |
| digest | const | 45 | no | const digest = digestTurnPayload(prompt); |
| turn | variable | 46 | no | let turn = journal.reserve({ key, conversationId, payloadDigest: digest }).turn; |
| boundary | const | 47 | no | const boundary = { sessionId: &#39;cap-1&#39;, sequence: 10, transcriptCount: 2 }; |
| replyText | const | 53 | no | const replyText = &#39;verified reply&#39;; |
| reply | const | 54 | no | const reply = { turnId: turn.id, payloadDigest: digest, sessionId: &#39;cap-1&#39;, sequence: 12, |
| meta | const | 58 | no | const meta = { identity: reply.identity, revision: reply.revision, |
| driveUncertainTurn | function | 70 | no | function driveUncertainTurn(journal, conversationId, key, prompt, boundarySequence) { |
| digest | const | 71 | no | const digest = digestTurnPayload(prompt); |
| turn | variable | 72 | no | let turn = journal.reserve({ key, conversationId, payloadDigest: digest }).turn; |
| boundary | const | 73 | no | const boundary = { sessionId: &#39;cap-1&#39;, sequence: boundarySequence, transcriptCount: 2 }; |
| root | const | 81 | no | const root = tmp(t, &#39;capture-journal-evidence-&#39;); |
| ok | const | 86 | no | const ok = readThreadTurnJournalEvidence({ dataDir, namespace: &#39;local-owner&#39;, origin, thread, conversationId: &#39;conv1&#39; }); |
| uncertain | const | 97 | no | const uncertain = readThreadTurnJournalEvidence({ dataDir, namespace: &#39;local-owner&#39;, origin, thread, conversationId: &#39;conv2&#39; }); |
| none | const | 105 | no | const none = readThreadTurnJournalEvidence({ dataDir, namespace: &#39;local-owner&#39;, origin, thread, conversationId: &#39;conv-none&#39; }); |
| emptyDir | const | 110 | no | const emptyDir = path.join(root, &#39;no-journal-here&#39;); |
| missing | const | 112 | no | const missing = readThreadTurnJournalEvidence({ dataDir: emptyDir, namespace: &#39;local-owner&#39;, origin, thread, conversationId: &#39;conv1&#39; }); |
| root | const | 119 | no | const root = tmp(t, &#39;capture-checkpoint-evidence-&#39;); |
| dataRoot | const | 120 | no | const dataRoot = path.join(root, &#39;data&#39;); |
| conversations | const | 121 | no | const conversations = path.join(dataRoot, &#39;conversations&#39;); |
| journal | const | 123 | no | const journal = createThreadTurnJournal({ dataDir: path.join(conversations, &#39;thread-turns&#39;), namespace: &#39;local-owner&#39;, origin, thread }); |
| view | const | 126 | no | const view = { id: &#39;conv1&#39;, revision: 7, state: &#39;ready&#39;, site: &#39;chatgpt&#39;, sessionId: &#39;cap-1&#39;, |
| out | const | 133 | no | const out = captureConversationEvidence({ directory: conversations, id: &#39;conv1&#39;, view, journal: journal.read(), trigger: &#39;test&#39;, paths: { root: dataRoot, sessions: path.join(dataRoot, &#39;sessions&#39;) } }… |
| onDisk | const | 139 | no | const onDisk = JSON.parse(readFileSync(out.file, &#39;utf8&#39;)); |
| read | const | 143 | no | const read = readConversationEvidence({ directory: conversations, id: &#39;conv1&#39; }); |
| missing | const | 158 | no | const missing = readConversationEvidence({ directory: conversations, id: &#39;nope&#39; }); |
| root | const | 166 | no | const root = tmp(t, &#39;capture-uncertain-evidence-&#39;); |
| dataRoot | const | 167 | no | const dataRoot = path.join(root, &#39;data&#39;); |
| conversations | const | 168 | no | const conversations = path.join(dataRoot, &#39;conversations&#39;); |
| journal | const | 170 | no | const journal = createThreadTurnJournal({ dataDir: path.join(conversations, &#39;thread-turns&#39;), namespace: &#39;local-owner&#39;, origin, thread }); |
| view | const | 173 | no | const view = { id: &#39;conv2&#39;, revision: 3, state: &#39;needs-reconciliation&#39;, site: &#39;chatgpt&#39;, sessionId: &#39;cap-1&#39;, |
| out | const | 178 | no | const out = captureConversationEvidence({ directory: conversations, id: &#39;conv2&#39;, view, journal: journal.read(), trigger: &#39;turn&#39;, paths: { root: dataRoot, sessions: path.join(dataRoot, &#39;sessions&#39;) } }… |
| read | const | 182 | no | const read = readConversationEvidence({ directory: conversations, id: &#39;conv2&#39; }); |
| conversations2 | const | 193 | no | const conversations2 = path.join(root, &#39;other&#39;, &#39;conversations&#39;); |
| digest2 | const | 195 | no | const digest2 = digestTurnPayload(&#39;third&#39;); |
| view2 | const | 196 | no | const view2 = { id: &#39;conv3&#39;, revision: 2, state: &#39;needs-reconciliation&#39;, site: &#39;chatgpt&#39;, sessionId: &#39;cap-1&#39;, |
| out2 | const | 206 | no | const out2 = captureConversationEvidence({ directory: conversations2, id: &#39;conv3&#39;, view: view2, journal: null, trigger: &#39;turn&#39;, paths: { root: path.join(root, &#39;other&#39;), sessions: path.join(root, &#39;oth… |
| read2 | const | 209 | no | const read2 = readConversationEvidence({ directory: conversations2, id: &#39;conv3&#39; }); |
| root | const | 217 | no | const root = tmp(t, &#39;capture-runtime-evidence-&#39;); |
| paths | const | 218 | no | const paths = { root: path.join(root, &#39;data&#39;), sessions: path.join(root, &#39;data&#39;, &#39;sessions&#39;) }; |
| conversations | const | 219 | no | const conversations = path.join(paths.root, &#39;conversations&#39;); |
| id | const | 221 | no | const id = &#39;conv1&#39;; |
| journal | const | 222 | no | const journal = createThreadTurnJournal({ dataDir: path.join(conversations, &#39;thread-turns&#39;), namespace: &#39;local-owner&#39;, origin, thread }); |
| snapshot | const | 225 | no | const snapshot = { version: 1, id, revision: 1, state: &#39;ready&#39;, site: &#39;chatgpt&#39;, sessionId: null, |
| runtime | const | 241 | no | const runtime = createConversationRuntime({ paths, profileStore: null, familyStore: null, port: 9222, dependencies: { listTargets: async () =&gt; [], getAdapter: async () =&gt; null, createAdapter: () =&gt; (… |
| done | const | 248 | no | const done = await runtime.finish(id); |
| read | const | 257 | no | const read = readConversationEvidence({ directory: conversations, id }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 11 | external |
| node:assert/strict | import | 12 | external |
| node:fs | import | 13 | external |
| node:os | import | 14 | external |
| node:path | import | 15 | external |
| node:crypto | import | 16 | external |
| ../../src/capture/thread-turn-journal.mjs | import | 17 | [studio/src/capture/thread-turn-journal.mjs](../../src/capture/thread-turn-journal.mjs.md) |
| ../../src/capture/conversation-evidence.mjs | import | 20 | [studio/src/capture/conversation-evidence.mjs](../../src/capture/conversation-evidence.mjs.md) |
| ../../src/capture/conversation-runtime.mjs | import | 23 | [studio/src/capture/conversation-runtime.mjs](../../src/capture/conversation-runtime.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Unit gate for the NEXT:CONSOLIDATE:studio/src/capture lane acceptance:
// "Actual evidence retrievable with source identity, explicit gaps and revocation;
//  no uncertain delivery promoted to success."
//
// Covers the read paths of the Studio conversation evidence:
//   - thread-turn-journal.mjs readThreadTurnJournalEvidence (source identity + gaps)
//   - conversation-evidence.mjs captureConversationEvidence + readConversationEvidence
//     (persisted checkpoint read back with file+sha256, gaps, prefix revocation)
//   - conversation-runtime.mjs preserveEvidence wiring (view.evidence carries the
//     verified read-back)
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  createThreadTurnJournal, digestTurnPayload, canonicalThreadKey, readThreadTurnJournalEvidence,
} from '../../src/capture/thread-turn-journal.mjs';
import {
  captureConversationEvidence, readConversationEvidence, EVIDENCE_SOURCE,
} from '../../src/capture/conversation-evidence.mjs';
import { createConversationRuntime } from '../../src/capture/conversation-runtime.mjs';

const uuid = '00000000-0000-0000-0000-000000000001';
const thread = { kind: 'chatgpt-c', id: uuid, ref: `chatgpt-c:${uuid}` };
const origin = 'https://chatgpt.com';
const stamp = '2026-11-20T12:00:00.000Z';
const sha256File = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');

function tmp(t, prefix) {
  const root = mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function makeJournal(root) {
  const dataDir = path.join(root, 'thread-turns');
  mkdirSync(dataDir, { recursive: true });
  return { dataDir, journal: createThreadTurnJournal({ dataDir, namespace: 'local-owner', origin, thread }) };
}

// Drives one turn through reserve -> typing -> dispatching -> delivered -> reply -> ready.
function driveDeliveredTurn(journal, conversationId, key, prompt) {
  const digest = digestTurnPayload(prompt);
  let turn = journal.reserve({ key, conversationId, payloadDigest: digest }).turn;
  const boundary = { sessionId: 'cap-1', sequence: 10, transcriptCount: 2 };
  turn = journal.markTyping({ turnId: turn.id, expectedRevision: turn.revision, boundary });
  turn = journal.markDispatching({ turnId: turn.id, expectedRevision: turn.revision });
  turn = journal.observeDelivery({ turnId: turn.id, expectedRevision: turn.revision, evidence: {
    turnId: turn.id, payloadDigest: digest, sessionId: 'cap-1', sequence: 11,
    kind: 'outgoing-request', source: 'network', identity: 'out-1' } });
  const replyText = 'verified reply';
  const reply = { turnId: turn.id, payloadDigest: digest, sessionId: 'cap-1', sequence: 12,
    kind: 'assistant-reply', source: 'network', identity: 'rep-1', revision: 1,
    contentDigest: digestTurnPayload(replyText), chars: replyText.length };
  turn = journal.recordReply({ turnId: turn.id, expectedRevision: turn.revision, evidence: reply });
  const meta = { identity: reply.identity, revision: reply.revision,
    contentDigest: reply.contentDigest, chars: reply.chars };
  turn = journal.recordReadiness({ turnId: turn.id, expectedRevision: turn.revision, evidence: {
    turnId: turn.id, payloadDigest: digest, sessionId: 'cap-1', boundarySequence: 10, ...meta, sequence: 14,
    kind: 'interactive-ready', source: 'adapter', rule: 'chatgpt-controls-idle', ruleVersion: 1,
    threadKey: canonicalThreadKey({ namespace: 'local-owner', origin, thread }),
    samples: [{ ...meta, sequence: 13 }, { ...meta, sequence: 14 }],
    controls: { observed: true, state: 'idle', idleControlPresent: true, stopPresent: false, composerEnabled: true } } });
  return { turn, digest };
}

// Drives one turn to an unresolved 'unknown' phase (delivery uncertain, never observed).
function driveUncertainTurn(journal, conversationId, key, prompt, boundarySequence) {
  const digest = digestTurnPayload(prompt);
  let turn = journal.reserve({ key, conversationId, payloadDigest: digest }).turn;
  const boundary = { sessionId: 'cap-1', sequence: boundarySequence, transcriptCount: 2 };
  turn = journal.markTyping({ turnId: turn.id, expectedRevision: turn.revision, boundary });
  turn = journal.markDispatching({ turnId: turn.id, expectedRevision: turn.revision });
  turn = journal.markUnknown({ turnId: turn.id, expectedRevision: turn.revision, reason: 'ACK_LOST' });
  return { turn, digest };
}

test('journal evidence read carries source identity + explicit gaps; uncertain delivery is not promoted', (t) => {
```

_First 80 of 262 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
