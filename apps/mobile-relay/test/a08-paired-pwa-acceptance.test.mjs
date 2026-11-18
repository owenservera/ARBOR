// A08 — Physical Windows Host and paired PWA acceptance (relay-side, build round 1).
// Exercises the PWA contracts the physical-host walkthrough depends on: single-use pairing
// redemption, device-grant revocation on reconnect, offline-shell guards and the HTTPS
// registration surface. Physical-device execution itself stays UNRUN (see roadmap A08 note).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const swSrc = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const manifest = JSON.parse(readFileSync(new URL('../manifest.webmanifest', import.meta.url), 'utf8'));
const { parsePairFragment, redeemDevicePairToken } = await import('../pairing-link.mjs');

/* ---------- physical HTTPS pairing surface ---------- */

test('PWA shell is installable: manifest is standalone with maskable icon and theme color', () => {
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.name, 'VIVIM Mobile');
  assert.ok(manifest.icons.some(i => i.purpose === 'maskable' && i.sizes === '512x512'),
    'a maskable 512 icon is required for Android adaptive install');
  assert.ok(indexHtml.includes('<link rel="manifest" href="manifest.webmanifest">'),
    'index.html must link the manifest');
  assert.match(indexHtml, /<meta name="theme-color"/, 'theme-color meta must stay for install UI');
});

test('service worker registers on the Direct mount for physical paired devices', () => {
  assert.match(app, /navigator\.serviceWorker\.register\(transport\.direct \? '\/mobile\/sw\.js' : '\/sw\.js'\)/,
    'app.js must register the SW under the Direct mount scope');
});

/* ---------- pairing: single-use redemption contracts (PWA side of physical pairing) ---------- */

test('parsePairFragment classifies device tokens, legacy secrets, ask-fragments and junk', () => {
  assert.deepEqual(parsePairFragment('a'.repeat(64)), { type: 'device', token: 'a'.repeat(64) });
  assert.equal(parsePairFragment('abc-DEF_12').type, 'legacy');
  assert.deepEqual(parsePairFragment('#ask=1'), { type: 'none' });
  assert.equal(parsePairFragment('').type, 'none');
  assert.equal(parsePairFragment('bad token!!').type, 'invalid');
});

test('redeemDevicePairToken refuses non-direct and malformed tokens before any fetch', async () => {
  let called = 0;
  const fetchImpl = async () => { called += 1; throw new Error('must not fetch'); };
  await assert.rejects(redeemDevicePairToken('x', { fetchImpl }),
    /Open this link through your private VIVIM connection\./);
  await assert.rejects(redeemDevicePairToken('zzz', { direct: true, fetchImpl }),
    /Invalid pairing code\./);
  assert.equal(called, 0, 'no network call for invalid input');
});

test('redeemDevicePairToken maps 410 to expired and 409 to already-paired single-use errors', async () => {
  const respond = (status, body = {}) => ({
    ok: status < 400, status,
    json: async () => ({ error: 'x', ...body })
  });
  await assert.rejects(
    redeemDevicePairToken('a'.repeat(64), { direct: true, fetchImpl: async () => respond(410) }),
    /This code expired\. Create a new code on the PC\./);
  await assert.rejects(
    redeemDevicePairToken('a'.repeat(64), { direct: true, fetchImpl: async () => respond(409) }),
    /This device is already paired or this code was used\./);
  const ok = await redeemDevicePairToken('a'.repeat(64), {
    direct: true,
    fetchImpl: async () => respond(200, { enrollmentRequired: true, challengeId: 'c1' })
  });
  assert.equal(ok.status, 'enrollment_required');
  assert.equal(ok.paired, false);
});

/* ---------- revocation: reconnect after revoke clears the grant (no stale session) ---------- */

const HTTPS_ORIGIN = 'https://host.example';
function withLocalStorage() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: k => store.has(k) ? store.get(k) : null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k)
  };
  // device-enrollment.mjs validates the saved grant against location.origin.
  if (!globalThis.location) globalThis.location = { origin: HTTPS_ORIGIN };
  else if (globalThis.location.origin !== HTTPS_ORIGIN) globalThis.location.origin = HTTPS_ORIGIN;
  return store;
}

test('resumeDeviceSession clears grant and device session when the Host reports revoked', async () => {
  const { resumeDeviceSession } = await import('../device-enrollment.mjs');
  const store = withLocalStorage();
  const GRANT = 'vivim.device.grant.v1';
  const grantId = 'a'.repeat(32); // grantId is validated against /^[a-f0-9]{32}$/
  store.set(GRANT, JSON.stringify({ grantId, origin: HTTPS_ORIGIN, user: 'u', kind: 'browser' }));
  let session = 'stale';
  let lastQuery = '';
  globalThis.fetch = async (url) => {
    lastQuery = String(url);
    return { ok: true, json: async () => ({ status: 'revoked' }) };
  };
  const transport = { direct: true, setDeviceSession: s => { session = s; } };
  const result = await resumeDeviceSession(transport);
  assert.equal(result.status, 'revoked');
  assert.equal(session, null, 'stale device session must be dropped');
  assert.equal(store.get(GRANT), undefined, 'revoked grant metadata must be removed');
  assert.match(lastQuery, /\/mobile\/api\/enrollment\/grant-status\?id=a{32}/);
});

test('after revocation the next reconnect is unpaired — no cached grant survives', async () => {
  const { resumeDeviceSession } = await import('../device-enrollment.mjs');
  withLocalStorage();
  globalThis.fetch = async () => { throw new Error('unpaired must not fetch'); };
  const result = await resumeDeviceSession({ direct: true, setDeviceSession: () => {} });
  assert.equal(result.status, 'unpaired');
});

/* ---------- offline/reconnect: shell SW guards (source-pinned) ---------- */

test('offline shell never intercepts API, auth-bearing or pairing-token traffic', () => {
  assert.match(swSrc, /if \(url\.pathname\.indexOf\('\/api\/'\) !== -1\) return false;/,
    'API traffic must reach the network');
  assert.match(swSrc, /if \(url\.searchParams && url\.searchParams\.has\('token'\)\) return false;/,
    'pairing links must reach the PC to redeem their token');
  assert.match(swSrc, /if \(hasHeader\(request, 'authorization'\) \|\| hasHeader\(request, 'range'\)\) return false;/,
    'auth-bearing and range reads are never intercepted');
});

test('offline shell precaches the pairing and enrollment modules plus manifest and icons', () => {
  for (const entry of ['pairing-link.mjs', 'device-enrollment.mjs', 'browser-device-key.mjs',
    'manifest.webmanifest', 'icon-192.png', 'icon-maskable-512.png']) {
    assert.ok(swSrc.includes(`'${entry}'`), `shell cache must include ${entry}`);
  }
});

test('shell is network-first so a PC edit is picked up on the next reconnect load', () => {
  assert.ok(swSrc.includes('var CACHE = \'vivim-relay-shell-'), 'cache name keeps its prefix');
  assert.match(swSrc, /fetch\(target, \{ cache: 'reload', credentials: 'same-origin' \}\)/,
    'install bypasses the HTTP cache');
  assert.match(swSrc, /resolve\(response\); \/\/ errors, redirects and 4xx\/5xx pass through uncached/,
    'fetch handler is network-first with cache only as fallback');
});
