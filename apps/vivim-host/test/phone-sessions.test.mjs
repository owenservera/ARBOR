// WO-034 — the shipped Host phone route is VIVIM-owned.
// Pins the absence of the OpenCode CLI dependency and proves the VIVIM-owned
// session route works from local VIVIM state alone.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readdirSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBridgeStore } from '../../../studio/src/studio/bridge-commands.mjs';
import { createSourceVerifiedLiveProjection } from '../conversations/live-projection.mjs';
import { createPhoneSessions } from '../phone-sessions.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const hostRoot = path.resolve(here, '..');
const appsRoot = path.resolve(hostRoot, '..');
const conversation = 'c-' + 'a'.repeat(16);

// Prose in a comment may name the removed dependency; executable code may not.
const codeLines = (source) => source.split(/\r?\n/)
  .filter(line => !/^\s*(\/\/|\/\*|\*)/.test(line));

test('no shipped app depends on the OpenCode CLI', () => {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === 'test' || entry.name === 'fixtures') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (/\.(mjs|js|cjs)$/.test(entry.name)) files.push(full);
    }
  };
  walk(appsRoot);
  assert.ok(files.length > 10, 'the shipped apps must be scanned');
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const code = codeLines(source).join('\n');
    const relative = path.relative(appsRoot, file).replace(/\\/g, '/');
    assert.equal(/@opencode[\\/]cli/.test(code), false, `${relative} must not reference the OpenCode CLI package`);
    assert.equal(/opencode\.exe/i.test(code), false, `${relative} must not reference the OpenCode native executable`);
  }
});

test('the phone session route starts no child process and needs no OpenCode install', () => {
  for (const relative of ['phone-sessions.mjs', 'direct-phone.mjs']) {
    const source = readFileSync(path.join(hostRoot, relative), 'utf8');
    const code = codeLines(source).join('\n');
    assert.equal(/child_process/.test(code), false, `${relative} must not import a child process`);
    assert.equal(/\b(execFile|execSync|spawn|spawnSync|fork)\s*\(/.test(code), false, `${relative} must not spawn a process`);
    assert.equal(/APPDATA/.test(code), false, `${relative} must not resolve an OpenCode CLI install`);
  }
  const source = readFileSync(path.join(hostRoot, 'phone-sessions.mjs'), 'utf8');
  assert.equal(/createOpenCodePhone/.test(source), false, 'the OpenCode CLI bridge factory is gone');
});

function harness(dataRoot) {
  const bridge = createBridgeStore({ root: dataRoot });
  const live = createSourceVerifiedLiveProjection({ dataRoot, worldId: 'world-local' });
  // The same durable acceptance the Host performs for a relay-chat command.
  const store = {
    async putCommand(record) {
      const chat = { ...Object.fromEntries(
        ['mode', 'conversationId', 'newChat', 'target', 'attachments', 'action', 'preset', 'messageId']
          .filter(key => record[key] !== undefined).map(key => [key, record[key]])), transport: 'direct' };
      bridge.create({ id: record.id, origin: 'relay', text: record.text, kind: record.kind,
        consumer: record.consumer, stage: record.stage, chat });
      if (record.mode === 'relay-chat' && record.conversationId) {
        try { await live.recordAcceptedRelay(record.id); } catch { /* projection is recoverable */ }
      }
    },
  };
  return { bridge, live, store, route: createPhoneSessions({ dataRoot, worldId: 'world-local', bridge, live, store }) };
}

test('the phone session route serves VIVIM conversations and their transcript', async t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'phone-sessions-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { bridge, route } = harness(root);
  // A VIVIM relay-chat command: the canonical ledger is the only source.
  const record = bridge.create({
    id: 'cmd-' + 'b'.repeat(16), origin: 'relay', kind: 'command', consumer: 'harness',
    text: '@chatgpt first question', chat: { mode: 'relay-chat', conversationId: conversation, target: { provider: 'chatgpt' } },
  });
  const sessions = await route({ method: 'GET', relayPath: 'sessions' });
  assert.equal(sessions.sessions.length, 1);
  assert.equal(sessions.sessions[0].id, conversation);
  assert.equal(sessions.sessions[0].provider, 'chatgpt');
  assert.equal(sessions.sessions[0].title, 'first question');
  // The legacy prefix is only a client alias for the same VIVIM route.
  const legacy = await route({ method: 'GET', relayPath: 'opencode/sessions' });
  assert.deepEqual(legacy.sessions, sessions.sessions);

  const before = await route({ method: 'GET', relayPath: `sessions/${conversation}/messages` });
  assert.equal(before.messages.length, 1);
  assert.equal(before.messages[0].type, 'user');
  assert.equal(before.messages[0].text, 'first question');
  assert.equal(before.messages[0].id, 'msg-' + record.id.slice(4));

  bridge.claim(record.id, { by: 'harness' });
  bridge.reply(record.id, '[chatgpt] the answer');
  const after = await route({ method: 'GET', relayPath: `sessions/${conversation}/messages` });
  assert.equal(after.messages.length, 2);
  assert.equal(after.messages[1].type, 'assistant');
  assert.equal(after.messages[1].text, 'the answer');
  assert.equal(after.messages[1].completed, true);
});

test('a phone prompt is admitted once as a VIVIM relay-chat command', async t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'phone-sessions-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { bridge, route } = harness(root);
  bridge.create({
    id: 'cmd-' + 'c'.repeat(16), origin: 'relay', kind: 'command', consumer: 'harness',
    text: '@chatgpt first question', chat: { mode: 'relay-chat', conversationId: conversation, target: { provider: 'chatgpt' } },
  });
  const messageId = 'msg_' + 'd'.repeat(32);
  const accepted = await route({ method: 'POST', relayPath: `sessions/${conversation}/prompt`, body: { id: messageId, text: 'second question' } });
  assert.deepEqual(accepted, { accepted: true, id: messageId, sessionId: conversation });
  const queued = bridge.list({ limit: 20 }).items.filter(item => item.mode === 'relay-chat');
  assert.equal(queued.length, 2);
  const admitted = queued.find(item => item.messageId === messageId);
  assert.ok(admitted, 'the admitted message keeps its owner message id');
  assert.equal(admitted.text, '@chatgpt second question');
  assert.equal(admitted.target.provider, 'chatgpt');
  assert.equal(admitted.status, 'queued');
  assert.equal(admitted.consumer, 'harness');
  // The transcript shows the exact owner message id the phone will poll for.
  const transcript = await route({ method: 'GET', relayPath: `sessions/${conversation}/messages` });
  assert.equal(transcript.messages[1].id, messageId);
  assert.equal(transcript.messages[1].text, 'second question');

  // An ambiguous repeat is refused and never queued twice.
  await assert.rejects(() => route({ method: 'POST', relayPath: `sessions/${conversation}/prompt`, body: { id: messageId, text: 'second question' } }),
    error => error.status === 409);
  assert.equal(bridge.list({ limit: 20 }).items.filter(item => item.mode === 'relay-chat').length, 2);
});

test('the phone session route refuses malformed and unknown requests', async t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'phone-sessions-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { route } = harness(root);
  await assert.rejects(() => route({ method: 'POST', relayPath: `sessions/${conversation}/prompt`, body: { id: 'bad', text: 'x' } }), error => error.status === 400);
  await assert.rejects(() => route({ method: 'POST', relayPath: `sessions/${conversation}/prompt`, body: { id: 'msg_' + 'e'.repeat(32), text: '   ' } }), error => error.status === 400);
  await assert.rejects(() => route({ method: 'POST', relayPath: `sessions/${conversation}/prompt`, body: { id: 'msg_' + 'e'.repeat(32), text: 'x', extra: 1 } }), error => error.status === 400);
  await assert.rejects(() => route({ method: 'POST', relayPath: `sessions/${conversation}/prompt`, body: { id: 'msg_' + 'e'.repeat(32), text: 'x' } }), error => error.status === 404);
  await assert.rejects(() => route({ method: 'GET', relayPath: 'sessions/not-a-conversation/messages' }), error => error.status === 404);
  await assert.rejects(() => route({ method: 'POST', relayPath: 'sessions', body: {} }), error => error.status === 405);
  await assert.rejects(() => route({ method: 'GET', relayPath: `sessions/${conversation}/prompt` }), error => error.status === 405);
});
