import test from 'node:test';
import assert from 'node:assert/strict';
import { createTransport, directOrigin } from '../transport.mjs';

const CLOUD = 'https://vivim-mobile-relay.vercel.app';
// A Direct device session is ephemeral and device-scoped: 32 hex ids, live expiry.
const DEVICE_SESSION = { grantId: 'a'.repeat(32), sessionId: 'b'.repeat(32), expiresAt: Date.now() + 3600000 };

function fixture(origin = CLOUD, pathname = '/mobile', fetchImpl = async () => ({ ok: true, status: 200, json: async () => ({ paired: true }) }), search = '', deviceSession = false) {
  const values = new Map(), calls = [], navigations = [];
  const storage = { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v), removeItem: k => values.delete(k) };
  const transport = createTransport({ location: { origin, pathname, search }, storage, fetchImpl: (...args) => { calls.push(args); return fetchImpl(...args); }, navigate: url => navigations.push(url) });
  if (deviceSession) transport.setDeviceSession({ ...DEVICE_SESSION });
  return { transport, calls, navigations, values };
}

test('validates direct origins and rejects paths, credentials and unknown hosts', () => {
  assert.equal(directOrigin('https://pc.tailnet.ts.net'), 'https://pc.tailnet.ts.net');
  assert.equal(directOrigin('http://127.0.0.1:3000'), 'http://127.0.0.1:3000');
  for (const value of ['https://evil.com', 'http://pc.tailnet.ts.net', 'https://a@pc.tailnet.ts.net', 'https://pc.tailnet.ts.net/private', 'https://pc.tailnet.ts.net/?x=1']) assert.equal(directOrigin(value), null);
});

test('cloud default and explicit direct navigate without cross-origin fetch', async () => {
  const f = fixture(); await f.transport.request('session');
  assert.equal(f.transport.mode(), 'auto'); assert.equal(f.calls[0][0], '/api/relay?path=session');
  f.transport.select('direct', 'https://pc.tailnet.ts.net');
  assert.deepEqual(f.navigations, ['https://pc.tailnet.ts.net/mobile/?connection=direct']);
  assert.throws(() => f.transport.select('direct', 'https://bad.example'), /Tailscale/);
});

// A Direct relay call is device-scoped: the Host rejects every relay request
// without a valid grant + session, so the transport fails closed before any fetch.
test('a direct request without a device session fails closed with 401 and makes no network call', async () => {
  const f = fixture('https://pc.tailnet.ts.net', '/mobile/', async () => { throw new TypeError('offline'); });
  await assert.rejects(f.transport.request('session'), e => e.status === 401 && /device session/.test(e.message));
  assert.equal(f.calls.length, 0);
  assert.deepEqual(f.navigations, []);
  await assert.rejects(f.transport.request('commands', { method: 'POST', body: '{}' }), e => e.status === 401);
  assert.equal(f.calls.length, 0);
  assert.deepEqual(f.navigations, []);
  // The send never left the phone, so nothing is left pending.
  assert.equal(f.transport.pending(), false);
});

// The one allowed fallback: a failed READ-ONLY session preflight in auto mode.
test('a failed read-only session preflight may fall back to the cloud relay in auto mode', async () => {
  const f = fixture(CLOUD, '/mobile', async () => { throw new TypeError('offline'); });
  await assert.rejects(f.transport.request('status'));
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0][0], '/api/relay?path=status');
  assert.deepEqual(f.navigations, []);
  await assert.rejects(f.transport.request('session'));
  assert.equal(f.calls.length, 2);
  assert.deepEqual(f.navigations, [CLOUD + '/mobile?connection=auto']);
});

// A Direct Host never navigates to Cloud implicitly, not even on a failed preflight.
test('a direct host never falls back to the cloud relay', async () => {
  const f = fixture('https://pc.tailnet.ts.net', '/mobile/', async () => { throw new TypeError('offline'); }, '', true);
  await assert.rejects(f.transport.request('status'));
  assert.equal(f.calls.length, 1);
  await assert.rejects(f.transport.request('session'));
  assert.equal(f.calls.length, 2);
  assert.deepEqual(f.navigations, []);
});

test('uncertain mutation is never retried or automatically switched', async () => {
  const f = fixture('https://pc.tailnet.ts.net', '/mobile/', async () => { throw new TypeError('offline'); }, '', true);
  await assert.rejects(f.transport.request('commands', { method: 'POST', body: '{}' }), /uncertain/);
  await assert.rejects(f.transport.request('commands', { method: 'POST', body: '{}' }), /uncertain/);
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0][1].headers['x-vivim-grant-id'], DEVICE_SESSION.grantId);
  assert.equal(f.calls[0][1].headers['x-vivim-device-session'], DEVICE_SESSION.sessionId);
  assert.equal(f.transport.pending(), true);
  assert.deepEqual(f.navigations, []);
  await assert.rejects(f.transport.request('session'));
  assert.equal(f.calls.length, 2);
  assert.deepEqual(f.navigations, []);
  assert.throws(() => f.transport.select('cloud'), /Cloud mode is disabled/);
  // A pending send blocks every transport switch, including another Direct origin.
  assert.throws(() => f.transport.select('direct', 'https://other.tailnet.ts.net'), /pending/);
});

test('a pending send blocks the cloud fallback and blocks switching transport', async () => {
  const f = fixture(CLOUD, '/mobile', async () => { throw new TypeError('offline'); });
  await assert.rejects(f.transport.request('commands', { method: 'POST', body: '{}' }), /uncertain/);
  assert.equal(f.transport.pending(), true);
  assert.deepEqual(f.navigations, []);
  await assert.rejects(f.transport.request('session'));
  assert.equal(f.calls.length, 2);
  // Pending blocks the read-only preflight fallback too.
  assert.deepEqual(f.navigations, []);
  assert.throws(() => f.transport.select('direct', 'https://pc.tailnet.ts.net'), /pending/);
  f.transport.select('direct', 'https://pc.tailnet.ts.net', true);
  assert.deepEqual(f.navigations, ['https://pc.tailnet.ts.net/mobile/?connection=direct']);
  // Acknowledging the switch never clears the uncertain marker.
  assert.equal(f.transport.pending(), true);
});

test('explicit direct mode does not auto fallback and HTTP errors retain status', async () => {
  const f = fixture('https://pc.tailnet.ts.net', '/mobile/', async () => ({ ok: false, status: 401, json: async () => ({ error: 'Unauthorized' }) }), '', true);
  f.transport.select('direct');
  await assert.rejects(f.transport.request('session'), e => e.status === 401);
  assert.deepEqual(f.navigations, []);
  // A rejected grant/session is never silently replayed with a stale bearer.
  assert.equal(f.transport.deviceHeaders(), null);
});

test('Auto from cloud navigates to the configured direct origin', () => {
  const f = fixture();
  f.transport.select('auto', 'https://pc.tailnet.ts.net');
  assert.deepEqual(f.navigations, ['https://pc.tailnet.ts.net/mobile/?connection=auto']);
});

test('mode transferred by navigation is persisted on the destination origin', async () => {
  const f = fixture('https://pc.tailnet.ts.net', '/mobile/', async () => { throw new TypeError('offline'); }, '?connection=direct', true);
  assert.equal(f.transport.mode(), 'direct');
  await assert.rejects(f.transport.request('session'));
  assert.equal(f.calls.length, 1);
  assert.deepEqual(f.navigations, []);
});

test('Auto falls back on gateway HTTP 502 and invalid session response, not authorization failures', async () => {
  for (const status of [502, 200, 401, 403]) {
    const f = fixture(CLOUD, '/mobile', async () => ({ ok: status === 200, status, json: async () => { throw new SyntaxError('HTML'); } }));
    await assert.rejects(f.transport.request('session'));
    assert.equal(f.navigations.length, status === 502 || status === 200 ? 1 : 0, `HTTP ${status}`);
  }
});

test('gateway and malformed responses never trigger fallback for POST or pending session', async () => {
  for (const status of [502, 200]) {
    const f = fixture(CLOUD, '/mobile', async () => ({ ok: status === 200, status, json: async () => { throw new SyntaxError('HTML'); } }));
    await assert.rejects(f.transport.request('commands', { method: 'POST' }), /uncertain/);
    await assert.rejects(f.transport.request('session'));
    assert.equal(f.transport.pending(), true);
    assert.deepEqual(f.navigations, []);
  }
});
