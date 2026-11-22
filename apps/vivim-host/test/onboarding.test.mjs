import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { generateKeyPairSync, sign, randomBytes } from 'node:crypto';
import { createBootstrapRuntime } from '../bootstrap/runtime.mjs';
import { createOnboardingService } from '../onboarding/service.mjs';
import { createStudioPort, defaultStudioOrigin } from '../onboarding/studio-port.mjs';
import { detectEnvironment } from '../onboarding/environment.mjs';
import { createHostServer } from '../server.mjs';
import { createEnrollment } from '../apk/enrollment.mjs';

// A closed runtime/server can keep Windows file handles busy for a few hundred ms;
// a teardown rm must never turn a passing suite red. EBUSY/EPERM/ENOTEMPTY retire.
const rmTolerant = (dir, attempts = 10) => {
  for (let i = 0; i < attempts; i++) {
    try { rmSync(dir, { recursive: true, force: true }); return; }
    catch (error) {
      if (error.code !== 'EBUSY' && error.code !== 'EPERM' && error.code !== 'ENOTEMPTY') throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
  }
  rmSync(dir, { recursive: true, force: true }); // last try: let a real failure surface
};

const THREAD = 'chatgpt-c:6ae55c0e-65bc-83eb-a0d3-8cef6db604c9';
const F02 = {
  schema: 'vivim.bootstrap-f02/2', pass: 'F02', provisional: false,
  visual: { background: '#101820', secondary: '#1d2b3a', accent: '#e8b04b', appearance: 'dark', texture: 'aurora', mood: 'cinematic', fontFamily: 'editorial', fontSizePx: 16, headingSizePx: 32, radiusPx: 18, spacingScale: 1.05, density: 'comfortable', motion: 'slow' },
  preferences: [{ trait: 'warm amber highlights', basis: 'recurring', confidence: 0.7, scope: 'global' }],
  dislikes: [], unknowns: ['exact favourite typeface']
};
const f01 = generationId => ({
  schema: 'vivim.bootstrap-fast/1', generationId, passId: 'F01',
  communication: { language: 'English', tone: 'direct', responseStyle: 'short answers first' },
  focus: [{ label: 'VIVIM local-first harness', kind: 'project', freshness: 'current', basis: 'explicitly_stated', explanation: 'Building a local-first provider harness.' }],
  unknowns: ['preferred working hours'],
  suggestedCards: [{ title: 'VIVIM project', focus: 'VIVIM local-first harness' }]
});

// A deep-pass fixture uses the exact typed contract already trusted by Host.
// It is test data, never used as a live personal corpus or AI-source substitute.
const deepPass = (pass, generationId) => {
  const category = {D03:'interest',D04:'project',D05:'tool',D06:'value',D07:'gap'}[pass];
  const section = {D03:'interest',D04:'project',D05:'tool',D06:'value',D07:'coverage'}[pass];
  return {
    schema:'vivim.bootstrap-output/1',generationId,passId:pass,
    observations:[{category,text:'A grounded '+section+' report',confidence:0.65,sensitive:pass==='D06'}],
    assertions:[{section,label:'A '+section,value:'A grounded '+section+' report',
      basis:'provider_memory_report',confidence:0.65,scope:'work',freshness:'current'}],
    unknowns:[],viewProposals:[],schemaProposals:[],
    coverage:{areas:[{name:section,state:'partial'}]}
  };
};

// A fake Studio that behaves like the real conversation API: fresh owned tabs, one journaled turn per key.
function fakeStudio({ signedIn = true, reply = 'fenced' } = {}) {
  const conversations = new Map();
  const log = { creates: 0, submits: 0, finishes: [] };
  return {
    log,
    reachable: async () => true,
    sites: async () => [{ id: 'chatgpt' }, { id: 'claude' }],
    async create({ site }) {
      log.creates++;
      const id = `conv-${log.creates}`;
      const snapshot = { id, revision: 1, site, state: signedIn ? 'ready' : 'blocked', binding: { targetId: `tab-${id}` }, readiness: signedIn ? undefined : { reason: 'AUTH_WALL' } };
      conversations.set(id, { ...snapshot, turns: [] });
      return snapshot;
    },
    async submit(id, { key, prompt }) {
      log.submits++;
      const deep = /\bD0[3-7]\b/.exec(prompt)?.[0] ?? null;
      const generationId = /generationId to "([^"]+)"/.exec(prompt)?.[1];
      const body = prompt.includes('bootstrap-f02/2') ? F02
        : deep ? deepPass(deep, generationId)
        : f01(/generationId` must equal `"([^"]+)"`/.exec(prompt)?.[1]);
      const text = reply === 'fenced' ? 'Here you go:\n```json\n' + JSON.stringify(body) + '\n```' : JSON.stringify(body);
      conversations.get(id).turns.push({ key, phase: 'observed', send: { state: 'observed' }, reply: { verified: true, settled: true, text } });
      return {};
    },
    async get(id) { const c = conversations.get(id); return { ...c, identity: { state: 'bound' }, binding: { ...c.binding, thread: { ref: THREAD } } }; },
    async finish(id, args) { log.finishes.push([id, args]); return {}; }
  };
}

function fixture(options = {}) {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-onb-'));
  const runtime = createBootstrapRuntime({ dataRoot });
  const studio = options.studio ?? fakeStudio(options);
  let clock = Date.parse('2026-11-01T05:00:00Z');
  const svc = createOnboardingService({ dataRoot, getRuntime: () => runtime, studio, directOrigin: 'https://pc.tailnet.ts.net', now: () => clock });
  return { dataRoot, runtime, studio, svc, advance: ms => { clock += ms; }, dispose: () => { runtime.close(); try { rmTolerant(dataRoot); } catch { /* leftover temp: runtime handles can outlive close on Windows; the assertions above already decided the outcome */ } } };
}

test('environment detection finds the browser on each platform and never invents one', () => {
  const win = detectEnvironment({ platform: 'win32', env: { LOCALAPPDATA: 'C:\\Users\\o\\AppData\\Local' }, home: 'C:\\Users\\o', exists: f => f.endsWith('msedge.exe') && f.includes('(x86)'), nodeVersion: '22.3.0' });
  assert.equal(win.browser.name, 'Microsoft Edge');
  assert.equal(win.defaults.chromeProfile, 'C:\\VIVIM\\chrome-profile');
  assert.equal(win.canLaunchFromHere, true);
  const mac = detectEnvironment({ platform: 'darwin', home: '/Users/o', exists: f => f.includes('Google Chrome.app') });
  assert.equal(mac.defaults.workspaceRoot, '/Users/o/VIVIM');
  const none = detectEnvironment({ platform: 'linux', home: '/home/o', exists: () => false, nodeVersion: '20.1.0' });
  assert.equal(none.browser.found, false); assert.equal(none.node.ok, false); assert.equal(none.defaults.chromeExe, '');
});

test('studio port only talks to a loopback HTTP origin', () => {
  assert.equal(defaultStudioOrigin('win32'), 'http://127.0.0.1:38730', 'matches existing Windows VIVIM.ps1 launcher');
  assert.equal(defaultStudioOrigin('linux'), 'http://127.0.0.1:38787', 'matches existing Studio relay default');
  for (const bad of ['https://127.0.0.1:7878', 'http://example.com', 'http://user:pw@127.0.0.1:7878', 'nope'])
    assert.throws(() => createStudioPort({ url: bad }), /loopback/);
  assert.ok(createStudioPort({ url: 'http://127.0.0.1:7878' }));
});

test('sign-in check uses a fresh owned tab, closes it, and reports plain states', async () => {
  const f = fixture();
  try {
    const ready = await f.svc.check('chatgpt');
    assert.equal(ready.verified, true); assert.equal(ready.state, 'ready');
    assert.deepEqual(f.studio.log.finishes.at(-1), ['conv-1', { closeTab: true }]);
    assert.equal(f.studio.log.submits, 0);
    await assert.rejects(f.svc.check('nope'), { code: 'ONBOARDING_PROVIDER' });
  } finally { f.dispose(); }
  const out = fixture({ signedIn: false });
  try {
    const r = await out.svc.check('chatgpt');
    assert.equal(r.verified, false); assert.equal(r.state, 'signed_out'); assert.equal(r.reason, 'AUTH_WALL');
  } finally { out.dispose(); }
});

test('approved prompts run in the background, once each, and personalise the World', async () => {
  const f = fixture();
  try {
    await assert.rejects(async () => f.svc.approveAndStart({ generationId: 'x' }), { code: 'ONBOARDING_PRIMARY_UNSUPPORTED' });
    f.svc.setPrimary('chatgpt');
    await assert.rejects(async () => f.svc.approveAndStart({ generationId: 'never-reviewed' }), { code: 'ONBOARDING_STALE' });
    const review = f.svc.review();
    assert.deepEqual(review.passes.map(p => p.pass), ['F02', 'F01', 'D03', 'D04', 'D05', 'D06', 'D07']);
    assert.match(review.passes[0].digest, /^[0-9a-f]{64}$/);
    f.svc.approveAndStart({ generationId: review.generationId });
    for (let i = 0; i < 14; i++) await f.svc.pump();
    const status = await f.svc.status();
    assert.equal(status.personalization.phase, 'done');
    assert.ok(status.personalization.corpus?.claims >= 1, 'real ledger count appears in onboarding');
    assert.ok(status.personalization.corpus?.observations >= 1, 'real observations appear in onboarding');
    assert.deepEqual(status.personalization.passes.map(p => p.status), Array(7).fill('complete'));
    assert.ok(f.runtime.ledger?.claims?.list('world-local').some(c => c.pass === 'D03'), 'D03 facts must reach existing Host ledger');
    assert.equal(f.studio.log.submits, 7, 'each approved prompt is sent exactly once');
    const theme = f.runtime.status().theme;
    assert.equal(theme.source.kind, 'provider-inference', 'the visual signature came from the approved ChatGPT reply');
    assert.equal(theme.status, 'active');
    assert.equal(status.personalization.cards.length > 0, true);
    await f.svc.pump(); await f.svc.pump();
    assert.equal(f.studio.log.submits, 7, 'finished work is never resent');
  } finally { f.dispose(); }
});

test('signed-out ChatGPT blocks before any send and says why in plain words', async () => {
  const f = fixture({ signedIn: false });
  try {
    f.svc.setPrimary('chatgpt');
    f.svc.approveAndStart({ generationId: f.svc.review().generationId });
    for (let i = 0; i < 4; i++) await f.svc.pump();
    const { personalization } = await f.svc.status();
    assert.equal(personalization.phase, 'attention');
    assert.equal(personalization.passes[0].code, 'SCHEDULER_PROVIDER_NOT_READY');
    assert.match(personalization.passes[0].reason, /isn't signed in/);
    assert.equal(f.studio.log.submits, 0);
  } finally { f.dispose(); }
});

test('an expired approval cannot dispatch', async () => {
  const f = fixture();
  try {
    f.svc.setPrimary('chatgpt');
    f.svc.approveAndStart({ generationId: f.svc.review().generationId });
    f.advance(31 * 60 * 1000);
    for (let i = 0; i < 4; i++) await f.svc.pump();
    const { personalization } = await f.svc.status();
    assert.equal(personalization.passes[0].code, 'SCHEDULER_APPROVAL_REQUIRED');
    assert.equal(f.studio.log.submits, 0);
  } finally { f.dispose(); }
});

test('a non-ChatGPT main AI is honest that personalization is unsupported yet', async () => {
  const f = fixture();
  try {
    f.svc.setPrimary('claude');
    assert.equal((await f.svc.status()).personalization.phase, 'unsupported');
  } finally { f.dispose(); }
});

test('a proxy heartbeat does not mark an unapproved phone as connected', async () => {
  const f = fixture();
  try {
    assert.equal((await f.svc.status()).phone.connected, false);
    f.svc.phoneSeen();
    const phone = (await f.svc.status()).phone;
    assert.equal(phone.connected, false);
    assert.equal(phone.paired, false);
    assert.equal(phone.mobileUrl, 'https://pc.tailnet.ts.net/mobile/');
  } finally { f.dispose(); }
});

test('onboarding HTTP: state/pair-status read-only; privileged POSTs require owner proof, same-origin and control header', async () => {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-onb-http-'));
  const ownerToken = 'test-owner-token-onboarding-0123456789';
  const calls = [];
  const svc = {
    status: async () => ({ schema: 'vivim.onboarding/1', primary: null }),
    setPrimary: id => { calls.push(id); return id; }, pump: () => {}, start: () => {}, phoneSeen: () => {}
  };
  const server = createHostServer({ dataRoot, onboarding: svc, ownerToken });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port, host = `127.0.0.1:${port}`;
  const call = (method, route, { headers = {}, body } = {}) => new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: route, method, headers: { host, ...headers } }, res => {
      let data = ''; res.on('data', c => { data += c; }); res.on('end', () => resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null }));
    });
    req.on('error', reject); if (body) req.write(body); req.end();
  });
  try {
    const state = await call('GET', '/api/onboarding/state');
    assert.equal(state.status, 200); assert.equal(state.body.onboarding.schema, 'vivim.onboarding/1');
    assert.equal(typeof state.body.defaultWorkspaceRoot, 'string');
    const pair = await call('GET', '/api/onboarding/pair-status');
    assert.equal(pair.status, 200); assert.equal(pair.body.ok, true);
    assert.equal(typeof pair.body.paired, 'boolean');

    const json = { 'content-type': 'application/json' };
    const auth = { authorization: `Bearer ${ownerToken}` };
    const okHeaders = { ...json, ...auth, origin: `http://${host}`, 'x-vivim-control': '1' };
    const affected = [
      ['/api/onboarding/setup', '{"workspaceRoot":"w","chromeExe":"c","chromeProfile":"p"}'],
      ['/api/onboarding/start', '{}'],
      ['/api/onboarding/doctor', '{}'],
      ['/api/onboarding/apk/register', '{"apkPath":"C:\\\\nope\\\\x.apk"}'],
      ['/api/onboarding/pair/register', '{}'],
      ['/api/onboarding/primary', '{"provider":"chatgpt"}']
    ];
    for (const [route, body] of affected) {
      const unauth = await call('POST', route, { headers: { ...json, origin: `http://${host}`, 'x-vivim-control': '1' }, body });
      assert.equal(unauth.status, 401, `${route} unauthenticated must be 401`);
      const cross = await call('POST', route, { headers: { ...json, ...auth, origin: 'https://evil.example', 'x-vivim-control': '1' }, body });
      assert.equal(cross.status, 403, `${route} cross-origin must be 403`);
      const noCsrf = await call('POST', route, { headers: { ...json, ...auth, origin: `http://${host}` }, body });
      assert.equal(noCsrf.status, 403, `${route} missing csrf must be 403`);
    }

    const ok = await call('POST', '/api/onboarding/primary', { headers: okHeaders, body: '{"provider":"chatgpt"}' });
    assert.equal(ok.status, 200); assert.deepEqual(calls, ['chatgpt']);
    assert.equal((await call('GET', '/api/onboarding/primary')).status, 405);
  } finally { await new Promise(r => server.close(r)); try { rmTolerant(dataRoot); } catch { /* leftover temp on Windows */ } }
});

test('Direct phone shows grounded card titles but keeps preferences and hard limits on the PC', async () => {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-direct-cards-'));
  const runtime = createBootstrapRuntime({ dataRoot });
  runtime.grantBootstrap({ scope: 'full-bootstrap' });
  runtime.ingestF01({ requestId: 'req-cards', generationId: 'gen-cards',
    response: { ...f01('gen-cards'), boundaries: [{ trait: 'auto-sending messages', basis: 'explicitly_stated', hard: true }] } });
  const origin = 'https://pc.tailnet.ts.net';
  const server = createHostServer({ dataRoot, bootstrap: runtime, directPhone: { origin, user: 'owner@example.com' } });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const call = (method, route, { headers = {}, body } = {}) => new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: server.address().port, path: route, method,
      headers: { host: 'pc.tailnet.ts.net', 'x-forwarded-proto': 'https', 'tailscale-user-login': 'owner@example.com', ...headers } }, res => {
      let data = ''; res.on('data', c => { data += c; }); res.on('end', () => resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null }));
    }); req.on('error', reject); if (body) req.write(body); req.end();
  });
  try {
    // Relay reads require an approved device grant: enroll, get owner approval,
    // then open a signed device session. Tailscale identity alone is not enough.
    const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
    const json = { 'content-type': 'application/json' };
    const start = (await call('POST', '/mobile/api/enrollment/start', { headers: json, body: '{}' })).body;
    const transcript = ['vivim-enrollment-v1', start.challengeId, start.challenge, start.nonce, origin, 'owner@example.com'].join('\\n');
    const enrolled = (await call('POST', '/mobile/api/enrollment/prove', { headers: json, body: JSON.stringify({
      challengeId: start.challengeId, publicKeyPem,
      signature: sign('sha256', Buffer.from(transcript, 'utf8'), privateKey).toString('base64'),
      signedTranscript: transcript, requestedScopes: ['relay:read', 'relay:write'] }) })).body;
    assert.equal(enrolled.status, 'pending');
    createEnrollment({ dataRoot, origin: null, user: null }).approveGrant({
      grantId: enrolled.grantId, approvedScopes: ['relay:read', 'relay:write'], approvedBy: 'owner' });
    const nonce = randomBytes(16).toString('hex'), timestamp = Date.now();
    const sessionTranscript = ['vivim-session-v1', enrolled.grantId, nonce, String(timestamp), origin, 'owner@example.com'].join('\\n');
    const session = (await call('POST', '/mobile/api/enrollment/session', { headers: json, body: JSON.stringify({
      grantId: enrolled.grantId, nonce, timestamp,
      deviceKeyProof: sign('sha256', Buffer.from(sessionTranscript, 'utf8'), privateKey).toString('base64') }) })).body;
    assert.ok(session.sessionId, 'an approved device opens a signed session');

    const device = { 'x-vivim-grant-id': enrolled.grantId, 'x-vivim-device-session': session.sessionId };
    const body = (await call('GET', '/mobile/api/relay?path=status', { headers: device })).body;
    const bootstrap = body.snapshot.bootstrap;
    assert.equal(bootstrap.cards.length, 1);
    assert.deepEqual(Object.keys(bootstrap.cards[0]).sort(), ['basis', 'id', 'title']);
    assert.deepEqual(bootstrap.preferences, []);
    assert.deepEqual(bootstrap.hardNos, []);
  } finally { await new Promise(r => server.close(r)); runtime.close(); try { rmTolerant(dataRoot); } catch { /* leftover temp on Windows */ } }
});
