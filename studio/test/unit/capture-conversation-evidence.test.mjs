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
  const root = tmp(t, 'capture-journal-evidence-');
  const { dataDir, journal } = makeJournal(root);
  driveDeliveredTurn(journal, 'conv1', 'k1', 'hello');
  driveUncertainTurn(journal, 'conv2', 'k2', 'second', 20);

  const ok = readThreadTurnJournalEvidence({ dataDir, namespace: 'local-owner', origin, thread, conversationId: 'conv1' });
  assert.equal(ok.state, 'verified');
  assert.equal(ok.source, 'thread-turn-journal');
  assert.match(ok.checksum, /^[a-f0-9]{64}$/);
  assert.ok(existsSync(ok.file) && ok.file.startsWith(dataDir) && ok.file.endsWith('.turn-journal.json'));
  assert.equal(ok.turns.length, 1);
  assert.equal(ok.turns[0].deliveryObserved, true);
  assert.equal(ok.turns[0].replyObserved, true);
  assert.equal(ok.turns[0].readiness, 'ready');
  assert.ok(ok.gaps.some((g) => g.code === 'COMPLETION_UNKNOWN'), 'delivered+ready without completion is an explicit gap');

  const uncertain = readThreadTurnJournalEvidence({ dataDir, namespace: 'local-owner', origin, thread, conversationId: 'conv2' });
  assert.equal(uncertain.state, 'verified');
  assert.equal(uncertain.turns.length, 1);
  assert.equal(uncertain.turns[0].deliveryObserved, false, 'uncertain delivery must not read as observed');
  assert.equal(uncertain.turns[0].uncertainty, true);
  assert.ok(uncertain.gaps.some((g) => g.code === 'DELIVERY_NOT_OBSERVED' && g.turnId === uncertain.turns[0].id));
  assert.ok(uncertain.gaps.some((g) => g.code === 'TURN_UNCERTAIN' && g.reason === 'ACK_LOST'));

  const none = readThreadTurnJournalEvidence({ dataDir, namespace: 'local-owner', origin, thread, conversationId: 'conv-none' });
  assert.equal(none.state, 'verified', 'existing journal file: unknown owner just has no turns');
  assert.deepEqual(none.turns, []);
  assert.deepEqual(none.gaps, []);

  const emptyDir = path.join(root, 'no-journal-here');
  mkdirSync(emptyDir, { recursive: true });
  const missing = readThreadTurnJournalEvidence({ dataDir: emptyDir, namespace: 'local-owner', origin, thread, conversationId: 'conv1' });
  assert.equal(missing.state, 'missing');
  assert.deepEqual(missing.turns, []);
  assert.ok(missing.gaps.some((g) => g.code === 'JOURNAL_MISSING'));
});

test('preserved checkpoint is retrievable with source identity, explicit gaps and prefix revocation', (t) => {
  const root = tmp(t, 'capture-checkpoint-evidence-');
  const dataRoot = path.join(root, 'data');
  const conversations = path.join(dataRoot, 'conversations');
  mkdirSync(path.join(conversations, 'thread-turns'), { recursive: true });
  const journal = createThreadTurnJournal({ dataDir: path.join(conversations, 'thread-turns'), namespace: 'local-owner', origin, thread });
  const { turn, digest } = driveDeliveredTurn(journal, 'conv1', 'k1', 'hello');

  const view = { id: 'conv1', revision: 7, state: 'ready', site: 'chatgpt', sessionId: 'cap-1',
    identity: { state: 'bound', reason: null },
    binding: { targetId: 'tab-1', origin, ownedByStudio: true, thread },
    prefix: { state: 'invalidated', reason: 'PREFIX_INVALIDATED', prefixId: 'px-1', invalidatedAt: stamp,
      adoptedAt: null, thread: { ref: thread.ref }, target: { targetId: 'tab-1', origin } },
    capture: { state: 'idle' }, finish: { requested: false, phase: 'idle' },
    diagnostic: null, writer: null, limitations: [], attempts: [] };
  const out = captureConversationEvidence({ directory: conversations, id: 'conv1', view, journal: journal.read(),
    trigger: 'test', paths: { root: dataRoot, sessions: path.join(dataRoot, 'sessions') } });
  assert.equal(out.revision, 1);
  assert.ok(out.gaps.includes('PREFIX_REVOKED'), 'revoked prefix is an explicit gap');
  assert.ok(out.gaps.includes('REPLY_COMPLETION_UNKNOWN'));

  const onDisk = JSON.parse(readFileSync(out.file, 'utf8'));
  assert.equal(onDisk.conversation.prefix.state, 'invalidated', 'revocation persisted in the checkpoint');
  assert.equal(onDisk.conversation.prefix.reason, 'PREFIX_INVALIDATED');

  const read = readConversationEvidence({ directory: conversations, id: 'conv1' });
  assert.equal(read.state, 'verified');
  assert.equal(read.source, EVIDENCE_SOURCE);
  assert.equal(read.file, out.file);
  assert.equal(read.sha256, sha256File(out.file), 'source identity: sha256 of the persisted bytes');
  assert.equal(read.revision, 1);
  assert.equal(read.turns.length, 1);
  assert.equal(read.turns[0].id, turn.id);
  assert.equal(read.turns[0].deliveryObserved, true);
  assert.equal(read.turns[0].replyObserved, true);
  assert.ok(read.gaps.some((g) => g.code === 'PREFIX_REVOKED'));
  assert.ok(read.gaps.some((g) => g.code === 'REPLY_COMPLETION_UNKNOWN'));
  assert.equal(read.revocation.prefix.state, 'invalidated');
  assert.equal(read.revocation.prefix.prefixId, 'px-1');

  const missing = readConversationEvidence({ directory: conversations, id: 'nope' });
  assert.equal(missing.state, 'missing');
  assert.equal(missing.source, EVIDENCE_SOURCE);
  assert.throws(() => readConversationEvidence({ directory: conversations, id: '../evil' }));
  assert.equal(digest.length, 64);
});

test('uncertain delivery is never promoted to observed in the preserved evidence', (t) => {
  const root = tmp(t, 'capture-uncertain-evidence-');
  const dataRoot = path.join(root, 'data');
  const conversations = path.join(dataRoot, 'conversations');
  mkdirSync(path.join(conversations, 'thread-turns'), { recursive: true });
  const journal = createThreadTurnJournal({ dataDir: path.join(conversations, 'thread-turns'), namespace: 'local-owner', origin, thread });
  const { turn } = driveUncertainTurn(journal, 'conv2', 'k2', 'second', 20);

  const view = { id: 'conv2', revision: 3, state: 'needs-reconciliation', site: 'chatgpt', sessionId: 'cap-1',
    identity: { state: 'bound', reason: null },
    binding: { targetId: 'tab-1', origin, ownedByStudio: true, thread },
    capture: { state: 'incomplete' }, finish: { requested: false, phase: 'idle' },
    diagnostic: { uncertainty: 'send-acknowledgement-lost' }, writer: null, limitations: [], attempts: [] };
  const out = captureConversationEvidence({ directory: conversations, id: 'conv2', view, journal: journal.read(),
    trigger: 'turn', paths: { root: dataRoot, sessions: path.join(dataRoot, 'sessions') } });
  assert.ok(out.gaps.includes('TURN_UNCERTAIN'), `gaps were: ${JSON.stringify(out.gaps)}`);

  const read = readConversationEvidence({ directory: conversations, id: 'conv2' });
  assert.equal(read.state, 'verified');
  assert.equal(read.turns.length, 1);
  assert.equal(read.turns[0].id, turn.id);
  assert.equal(read.turns[0].phase, 'unknown');
  assert.equal(read.turns[0].deliveryObserved, false, 'uncertain delivery not promoted by the read');
  assert.ok(read.gaps.some((g) => g.code === 'TURN_UNCERTAIN' && g.reason === 'ACK_LOST'));

  // Snapshot fallback (journal not readable): the attempt's own states are kept verbatim —
  // an 'observed' phase with an uncertain send is an explicit gap, and a partial
  // ('streaming') reply is not promoted to 'observed'.
  const conversations2 = path.join(root, 'other', 'conversations');
  mkdirSync(conversations2, { recursive: true });
  const digest2 = digestTurnPayload('third');
  const view2 = { id: 'conv3', revision: 2, state: 'needs-reconciliation', site: 'chatgpt', sessionId: 'cap-1',
    identity: { state: 'bound', reason: null },
    binding: { targetId: 'tab-1', origin, ownedByStudio: true, thread },
    capture: { state: 'incomplete' }, finish: { requested: false, phase: 'idle' },
    diagnostic: null, writer: null, limitations: [],
    attempts: [{ id: 'att-1', key: 'k3', payloadDigest: digest2, phase: 'observed', reason: null,
      createdAt: stamp, updatedAt: stamp,
      boundary: { sessionId: 'cap-1', sequence: 31, transcriptCount: 1 },
      send: { state: 'uncertain', evidence: { sessionId: 'cap-1', sequence: 32, kind: 'new-user-turn', identity: 'u-1' } },
      reply: { state: 'streaming', evidence: { turnId: 'att-1', sessionId: 'cap-1', sequence: 33, kind: 'assistant-reply', identity: 'r-1' } } }] };
  const out2 = captureConversationEvidence({ directory: conversations2, id: 'conv3', view: view2, journal: null,
    trigger: 'turn', paths: { root: path.join(root, 'other'), sessions: path.join(root, 'other', 'sessions') } });
  assert.ok(out2.gaps.includes('DELIVERY_NOT_OBSERVED'), `gaps were: ${JSON.stringify(out2.gaps)}`);
  const read2 = readConversationEvidence({ directory: conversations2, id: 'conv3' });
  assert.equal(read2.turns[0].delivery.state, 'uncertain');
  assert.equal(read2.turns[0].deliveryObserved, false);
  assert.equal(read2.turns[0].reply.state, 'streaming', 'partial reply keeps its own state');
  assert.equal(read2.turns[0].replyObserved, false);
});

test('runtime view exposes the read-back evidence checkpoint with source identity and gaps', async (t) => {
  const root = tmp(t, 'capture-runtime-evidence-');
  const paths = { root: path.join(root, 'data'), sessions: path.join(root, 'data', 'sessions') };
  const conversations = path.join(paths.root, 'conversations');
  mkdirSync(path.join(conversations, 'thread-turns'), { recursive: true });
  const id = 'conv1';
  const journal = createThreadTurnJournal({ dataDir: path.join(conversations, 'thread-turns'), namespace: 'local-owner', origin, thread });
  const { turn } = driveUncertainTurn(journal, id, 'k1', 'q', 5);

  const snapshot = { version: 1, id, revision: 1, state: 'ready', site: 'chatgpt', sessionId: null,
    binding: { targetId: 'tab-1', origin, ownedByStudio: true, thread },
    identity: { state: 'bound', reason: null }, uncertainty: 'send-acknowledgement-lost', assertions: [],
    finish: { requested: false, phase: 'idle', error: null }, createdAt: stamp, updatedAt: stamp,
    owner: { pid: 999999999, token: null, port: null },
    capture: { state: 'incomplete', integrity: null, bytesWritten: 0, limitReason: null },
    limitations: [], readiness: { ready: false, draft: { present: null, chars: null }, reason: 'NOT_CHECKED' },
    reply: { state: 'unknown', source: 'page', text: '', chars: 0, completion: 'unknown' },
    attempts: [{ id: turn.id, key: 'k1', payloadDigest: digestTurnPayload('q'), phase: 'uncertain', reason: 'ACK_LOST',
      createdAt: stamp, updatedAt: stamp,
      boundary: { sessionId: 'cap-1', sequence: 5, transcriptCount: 0 },
      send: { state: 'uncertain', observationSource: null },
      reply: { state: 'unknown', source: 'page', text: '', completion: 'unknown' },
      evidence: { state: 'recording' } }] };
  writeFileSync(path.join(conversations, `${id}.conversation.json`), JSON.stringify(snapshot));

  const runtime = createConversationRuntime({ paths, profileStore: null, familyStore: null, port: 9222, dependencies: {
    listTargets: async () => [], getAdapter: async () => null, createAdapter: () => ({}),
    acquireLease: () => ({ release() {} }), listSessions: () => [], readChatIndex: async () => ({}),
    ownerIsAlive: () => false } });
  t.after(async () => { await runtime.close().catch(() => {}); });

  await runtime.recover(id);
  const done = await runtime.finish(id);
  assert.equal(done.evidence.state, 'preserved');
  assert.equal(done.evidence.verified, true, 'checkpoint was actually retrieved after the write');
  assert.equal(done.evidence.readState, 'verified');
  assert.equal(done.evidence.source, 'conversation-evidence-checkpoint');
  assert.match(done.evidence.sha256, /^[a-f0-9]{64}$/);
  assert.equal(done.evidence.sha256, sha256File(done.evidence.file));
  assert.ok(done.evidence.gaps.some((g) => g.code === 'TURN_UNCERTAIN'), `gaps: ${JSON.stringify(done.evidence.gaps)}`);

  const read = readConversationEvidence({ directory: conversations, id });
  assert.equal(read.state, 'verified');
  assert.equal(read.turns[0].id, turn.id);
  assert.equal(read.turns[0].deliveryObserved, false, 'uncertain delivery never reads as success');
});
