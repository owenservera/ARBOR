// Unit gate for NEXT:D05-C-COMPANION-CLOSURE acceptance:
// "Host-authorized operation and evidence binding; revoked data excluded; no native direct browser."
//
// Covers studio/src/studio/browser-companion/ingress.mjs after retiring the broken
// apps/browser-companion/protocol.mjs import: the module must load without it, the
// credential/pair/revoke/state functions must behave, and the ingress must authorize
// observations only through the loopback Host port contract — feeding verified inert
// results to the ingestVisits bridge (never touching a browser directly).
//
// Pure, side-effect-free except for writing credential/state JSON under a temp root:
// no browser, no CDP, no Host effect, no network.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pairCompanion, revokeCompanion, companionState, companionIngress } from '../../src/studio/browser-companion/ingress.mjs';

const extId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'; // 32 lowercase a-p
const sessionId = '11111111-1111-1111-1111-111111111111';
const installationId = '22222222-2222-2222-2222-222222222222';
const at = '2026-11-20T12:00:00.000Z';

function makeRoot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arbor-companion-test-'));
  return dir;
}

function makeReq(overrides = {}) {
  return {
    method: 'POST',
    headers: {
      host: '127.0.0.1:7878',
      origin: `chrome-extension://${extId}`,
      authorization: `Bearer ${overrides.token ?? 'placeholder'}`,
      'content-type': 'application/json',
      ...overrides.headers,
    },
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  };
}

function makeVisitEvent(id = '33333333-3333-3333-3333-333333333333') {
  return {
    id,
    type: 'visit.observed',
    at,
    page: { browserTabId: 1, site: 'example.com', url: 'https://example.com/' },
  };
}

test('module loads without the retired apps/browser-companion/protocol.mjs dependency', () => {
  // If the import resolved, this line would already have thrown. Reaching it is the assertion.
  assert.equal(typeof pairCompanion, 'function');
  assert.equal(typeof revokeCompanion, 'function');
  assert.equal(typeof companionState, 'function');
  assert.equal(typeof companionIngress, 'function');
});

test('pairCompanion writes a credential file and returns extensionId + token', () => {
  const root = makeRoot();
  try {
    const result = pairCompanion(root, extId);
    assert.equal(result.extensionId, extId);
    assert.match(result.token, /^[0-9a-f]{64}$/);
    const cred = JSON.parse(fs.readFileSync(path.join(root, 'browser-companion', 'credential.json'), 'utf8'));
    assert.deepEqual(cred, { extensionId: extId, token: result.token });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('pairCompanion rejects a non-conforming extension id', () => {
  const root = makeRoot();
  try {
    assert.throws(() => pairCompanion(root, 'not-32-chars'), /32 lowercase a-p/);
    assert.throws(() => pairCompanion(root, 'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ'), /32 lowercase a-p/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('revokeCompanion rotates the token and returns true when configured', () => {
  const root = makeRoot();
  try {
    const { token: before } = pairCompanion(root, extId);
    assert.equal(revokeCompanion(root), true);
    const cred = JSON.parse(fs.readFileSync(path.join(root, 'browser-companion', 'credential.json'), 'utf8'));
    assert.equal(cred.extensionId, extId);
    assert.notEqual(cred.token, before);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('revokeCompanion returns false when nothing is configured', () => {
  const root = makeRoot();
  try {
    assert.equal(revokeCompanion(root), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('companionState returns disconnected shape with no state file', () => {
  const root = makeRoot();
  try {
    const state = companionState(root);
    assert.equal(state.connected, false);
    assert.equal(state.verified, false);
    assert.equal(state.source, 'extension_observation');
    assert.deepEqual(state.providers, []);
    assert.equal(state.lastSeen, null);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('ingress rejects a request from a non-loopback IP', async () => {
  const root = makeRoot();
  try {
    pairCompanion(root, extId);
    const cred = JSON.parse(fs.readFileSync(path.join(root, 'browser-companion', 'credential.json'), 'utf8'));
    const ingestVisits = async () => ({ accepted: 0, inserted: 0 });
    const ingress = companionIngress({ root, ingestVisits });
    const req = makeReq({ token: cred.token, socket: { remoteAddress: '203.0.113.45' } });
    const reply = await ingress(req, { port: 7878, body: { schema: 'vivim.browser-companion/1', installationId, sessionId, events: [] } });
    assert.equal(reply.status, 403);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('ingress rejects a wrong Origin header', async () => {
  const root = makeRoot();
  try {
    pairCompanion(root, extId);
    const cred = JSON.parse(fs.readFileSync(path.join(root, 'browser-companion', 'credential.json'), 'utf8'));
    const ingestVisits = async () => ({ accepted: 0, inserted: 0 });
    const ingress = companionIngress({ root, ingestVisits });
    const req = makeReq({ token: cred.token, headers: { origin: 'https://attacker.example/' } });
    const reply = await ingress(req, { port: 7878, body: { schema: 'vivim.browser-companion/1', installationId, sessionId, events: [] } });
    assert.equal(reply.status, 403);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('ingress rejects a bad bearer token with 401', async () => {
  const root = makeRoot();
  try {
    pairCompanion(root, extId);
    const ingestVisits = async () => ({ accepted: 0, inserted: 0 });
    const ingress = companionIngress({ root, ingestVisits });
    const req = makeReq({ token: 'wrong-wrong-wrong-wrong-wrong-wrong-wrong-wrong' });
    const reply = await ingress(req, { port: 7878, body: { schema: 'vivim.browser-companion/1', installationId, sessionId, events: [] } });
    assert.equal(reply.status, 401);
    assert.equal(reply.body.error, 'unauthorized');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('ingress rejects malformed event schema', async () => {
  const root = makeRoot();
  try {
    pairCompanion(root, extId);
    const cred = JSON.parse(fs.readFileSync(path.join(root, 'browser-companion', 'credential.json'), 'utf8'));
    const ingestVisits = async () => ({ accepted: 0, inserted: 0 });
    const ingress = companionIngress({ root, ingestVisits });
    const req = makeReq({ token: cred.token, body: { schema: 'not-the-right-schema', installationId, sessionId, events: [] } });
    const reply = await ingress(req, { port: 7878, body: { schema: 'not-the-right-schema', installationId, sessionId, events: [] } });
    assert.equal(reply.status, 400);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('ingress accepts a valid visit.observed batch, invokes the ingestVisits bridge, and acks accepted ids', async () => {
  const root = makeRoot();
  try {
    pairCompanion(root, extId);
    const cred = JSON.parse(fs.readFileSync(path.join(root, 'browser-companion', 'credential.json'), 'utf8'));
    let received = null;
    const ingestVisits = async (payload) => { received = payload; return { accepted: 1, inserted: 1 }; };
    const publish = (type, data) => { /* UI notifications are not evidence */ };
    // The event fixture is pinned to November 20. Use the corresponding
    // deterministic observation clock instead of weakening the 24h event fence.
    const ingress = companionIngress({ root, publish, ingestVisits, now: () => Date.parse(at) });
    const req = makeReq({ token: cred.token, body: { schema: 'vivim.browser-companion/1', installationId, sessionId, events: [makeVisitEvent()] } });
    const reply = await ingress(req, { port: 7878, body: { schema: 'vivim.browser-companion/1', installationId, sessionId, events: [makeVisitEvent()] } });
    assert.equal(reply.status, 200);
    assert.deepEqual(reply.body.acceptedIds, ['33333333-3333-3333-3333-333333333333']);
    assert.equal(received.installationId, installationId);
    assert.equal(received.sessionId, sessionId);
    assert.equal(received.events.length, 1);
    assert.equal(received.events[0].type, 'visit.observed');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('ingress feeds verified inert results to native only: a 503 from the bridge fails closed', async () => {
  const root = makeRoot();
  try {
    pairCompanion(root, extId);
    const cred = JSON.parse(fs.readFileSync(path.join(root, 'browser-companion', 'credential.json'), 'utf8'));
    const ingestVisits = async () => { throw new Error('bridge down'); };
    const ingress = companionIngress({ root, ingestVisits, now: () => Date.parse(at) });
    const req = makeReq({ token: cred.token, body: { schema: 'vivim.browser-companion/1', installationId, sessionId, events: [makeVisitEvent()] } });
    const reply = await ingress(req, { port: 7878, body: { schema: 'vivim.browser-companion/1', installationId, sessionId, events: [makeVisitEvent()] } });
    assert.equal(reply.status, 503);
    assert.equal(reply.body.error, 'web_memory_core_unavailable');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('companion rejects stale visit evidence before the Rust bridge is called', async () => {
  const root = makeRoot();
  try {
    const { token } = pairCompanion(root, extId);
    let calls = 0;
    const ingress = companionIngress({ root, ingestVisits: async () => { calls++;return {accepted:1,inserted:1}; },
      now: () => Date.parse(at) + 86400001 });
    const req = makeReq({ token });
    const result = await ingress(req, { port: 7878,
      body: { schema: 'vivim.browser-companion/1', installationId, sessionId, events: [makeVisitEvent()] } });
    assert.equal(result.status,400);
    assert.equal(calls,0,'expired observation cannot be admitted to native');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
