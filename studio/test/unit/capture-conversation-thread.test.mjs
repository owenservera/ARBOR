// Unit gate for the NEXT:CONSOLIDATE:studio/src/capture lane acceptance:
// "Actual evidence retrievable with source identity, explicit gaps and revocation;
//  no uncertain delivery promoted to success."
//
// Covers the owned thread-identity source functions that scope conversation evidence:
//   - conversation-thread.mjs :: parseThread, sameThread, validThread, threadSupported, isNewChatPath
//   - thread-turn-journal.mjs :: canonicalThreadKey
//
// These are pure, side-effect-free functions: no browser, no Host effect, no persistence.
// canonicalThreadKey names the thread-turn journal file, so its output is the source-identity
// scope underpinning readThreadTurnJournalEvidence / journalReference.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseThread, sameThread, validThread, threadSupported, isNewChatPath, THREAD_KINDS, THREAD_HOSTS_BY_KIND,
} from '../../src/capture/conversation-thread.mjs';
import { canonicalThreadKey } from '../../src/capture/thread-turn-journal.mjs';

const uuid = '00000000-0000-0000-0000-000000000001';
const chatgptThread = { kind: 'chatgpt-c', id: uuid, ref: `chatgpt-c:${uuid}` };
const claudeThread = { kind: 'claude-chat', id: uuid, ref: `claude-chat:${uuid}` };
const origin = 'https://chatgpt.com';
const claudeOrigin = 'https://www.claude.ai';

test('parseThread yields source identity for a real chatgpt thread and null for everything else', () => {
  const t = parseThread('chatgpt', `https://chatgpt.com/c/${uuid}/`);
  assert.deepEqual(t, chatgptThread);
  // Same without trailing slash.
  assert.deepEqual(parseThread('chatgpt', `https://chatgpt.com/c/${uuid}`), chatgptThread);
  // Chat.openai.com is the same chatgpt kind.
  assert.deepEqual(parseThread('chatgpt', `https://chat.openai.com/c/${uuid}`), chatgptThread);

  // Non-thread chatgpt routes are not threads (source identity stays unverified).
  assert.equal(parseThread('chatgpt', 'https://chatgpt.com/'), null);
  assert.equal(parseThread('chatgpt', 'https://chatgpt.com/g/G-project'), null);
  assert.equal(parseThread('chatgpt', 'https://chatgpt.com/model-comparison'), null);

  // Cross-provider host cannot carry a chatgpt thread kind.
  assert.equal(parseThread('chatgpt', `https://www.claude.ai/c/${uuid}/`), null);
  // Non-https / malformed / with credentials are not threads.
  assert.equal(parseThread('chatgpt', `http://chatgpt.com/c/${uuid}/`), null);
  assert.equal(parseThread('chatgpt', `https://user:pass@chatgpt.com/c/${uuid}/`), null);
  assert.equal(parseThread('chatgpt', 'not-a-url'), null);
  assert.equal(parseThread('chatgpt', `https://chatgpt.com/c/not-a-uuid/`), null);

  // Unknown site id -> null (no thread identity fabricatable for an unsupported provider).
  assert.equal(parseThread('no-such-site', `https://example.com/c/${uuid}/`), null);
});

test('parseThread yields source identity for a claude chat thread on its own hosts only', () => {
  const t = parseThread('claude', `https://www.claude.ai/chat/${uuid}/`);
  assert.deepEqual(t, claudeThread);
  // Claude thread kind is rejected on chatgpt hosts and vice-versa (no cross-provider identity).
  assert.equal(parseThread('claude', `https://chatgpt.com/c/${uuid}/`), null);
  assert.equal(parseThread('chatgpt', `https://www.claude.ai/chat/${uuid}/`), null);
});

test('sameThread compares refs; validThread enforces exact shape', () => {
  assert.equal(sameThread(chatgptThread, { kind: 'chatgpt-c', id: uuid, ref: `chatgpt-c:${uuid}` }), true);
  assert.equal(sameThread(chatgptThread, claudeThread), false);
  assert.equal(sameThread(null, null), true);
  assert.equal(sameThread(chatgptThread, null), false);
  assert.equal(validThread(chatgptThread), true);
  assert.equal(validThread(null), true); // null thread is allowed (unbound)
  assert.equal(validThread({ kind: 'chatgpt-c', id: uuid }), false); // missing ref
  assert.equal(validThread({ kind: 'chatgpt-c', id: uuid, ref: 'chatgpt-c:other' }), false); // ref mismatch
  assert.equal(validThread({ kind: 'not-a-kind', id: uuid, ref: 'not-a-kind:' + uuid }), false);
});

test('threadSupported and isNewChatPath stay scoped to known providers', () => {
  assert.equal(threadSupported('chatgpt'), true);
  assert.equal(threadSupported('claude'), true);
  assert.equal(threadSupported('gemini'), false);
  assert.equal(isNewChatPath('chatgpt', '/'), true);
  assert.equal(isNewChatPath('chatgpt', `/c/${uuid}/`), false);
  assert.equal(isNewChatPath('claude', '/new'), true);
  assert.equal(isNewChatPath('claude', '/'), true);
});

test('canonicalThreadKey is deterministic, namespaced by origin, and host/kind-bound', () => {
  const key = canonicalThreadKey({ namespace: 'local-owner', origin, thread: chatgptThread });
  assert.equal(typeof key, 'string');
  assert.equal(key.length > 0, true);
  // Deterministic for the same scope.
  assert.equal(canonicalThreadKey({ namespace: 'local-owner', origin, thread: chatgptThread }), key);
  // Different origin -> different key (source identity is origin-scoped).
  assert.notEqual(canonicalThreadKey({ namespace: 'local-owner', origin: claudeOrigin, thread: claudeThread }), key);
  // Different namespace -> different key.
  assert.notEqual(canonicalThreadKey({ namespace: 'other-owner', origin, thread: chatgptThread }), key);
  // Same ref, different origin: a known provider host may only carry its own kind.
  assert.throws(() => canonicalThreadKey({ namespace: 'local-owner', origin: claudeOrigin, thread: chatgptThread }),
    /INVALID_THREAD_SCOPE/);
  // Rejects malformed scope.
  assert.throws(() => canonicalThreadKey({ namespace: 'bad NS!', origin, thread: chatgptThread }), /INVALID_THREAD_SCOPE/);
  assert.throws(() => canonicalThreadKey({ namespace: 'local-owner', origin: 'http://chatgpt.com', thread: chatgptThread }), /INVALID_THREAD_SCOPE/);
  assert.throws(() => canonicalThreadKey({ namespace: 'local-owner', origin, thread: null }), /INVALID_THREAD_SCOPE/);
  assert.throws(() => canonicalThreadKey({ namespace: 'local-owner', origin, thread: { kind: 'chatgpt-c', id: 'not-a-uuid', ref: 'x' } }), /INVALID_THREAD_SCOPE/);
});
