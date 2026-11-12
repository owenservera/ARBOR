// Bounded Host bootstrap grants: the cap, the expiry, the prompt binding and the
// owner-authenticated issuance path. These tests use the real bootstrap ledger, so the
// atomic claim is exercised through the same SQLite write lock the Host uses in production.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { createBootstrapService, GRANT_MAX_SENDS, GRANT_MAX_EXPIRY_MS, GRANT_REASONS } from '../bootstrap/service.mjs';
import { openLedger } from '../bootstrap/ledger.mjs';
import { createBootstrapRuntime } from '../bootstrap/runtime.mjs';
import { createBootstrapScheduler } from '../bootstrap/scheduler.mjs';
import { createHostServer } from '../server.mjs';

const TOKEN = 'test-owner-token-0123456789abcdef0123456789abcdef';
const ISO = '2026-11-02T10:00:00.000Z';
const DIGEST_A = 'a'.repeat(64);
const DIGEST_B = 'b'.repeat(64);
const F02 = {
  schema: 'vivim.bootstrap-f02/2', pass: 'F02',
  visual: { background: '#101820', secondary: '#1d2b3a', accent: '#e8b04b', appearance: 'dark',
    texture: 'aurora', mood: 'cinematic', fontFamily: 'editorial', fontSizePx: 16, headingSizePx: 32,
    radiusPx: 18, spacingScale: 1.05, density: 'comfortable', motion: 'slow' },
  preferences: [], dislikes: [], unknowns: [], provisional: false
};

function tempDir(prefix) {
  return mkdtempSync(path.join(os.tmpdir(), prefix));
}
// A service over a file-backed ledger: two service instances can then observe the same
// grant record, which is what the Host does when the server and the worker both run.
function openService(dir, { now = () => ISO, grant = null } = {}) {
  const ledger = openLedger({ file: path.join(dir, 'ledger.db') });
  const svc = createBootstrapService({ ledger, now });
  if (grant) svc.grantBootstrap(grant);
  return { ledger, svc };
}

test('a new grant is issued with explicit bounds and keeps the legacy fields', t => {
  const dir = tempDir('vivim-grant-bounds-');
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const { ledger, svc } = openService(dir);
  const grant = svc.grantBootstrap({ scope: 'full-bootstrap' });
  assert.equal(grant.scope, 'full-bootstrap');
  assert.equal(grant.worldId, 'world-local');
  assert.equal(grant.source, 'owner');
  assert.equal(grant.at, ISO);
  assert.equal(typeof grant.id, 'string');
  assert.equal(grant.maxSends, GRANT_MAX_SENDS);
  assert.equal(grant.sendsUsed, 0);
  assert.equal(grant.promptDigest, null);
  assert.equal(grant.freshThreadOnly, true);
  assert.equal(grant.expiresAt, new Date(Date.parse(ISO) + GRANT_MAX_EXPIRY_MS).toISOString());
  // The record is what the ledger holds, not only what the caller got back.
  const stored = JSON.parse(ledger.meta.get('grant.bootstrap'));
  assert.equal(stored.maxSends, GRANT_MAX_SENDS);
  assert.equal(stored.expiresAt, grant.expiresAt);
  ledger.close();
});

test('an expired grant is refused with its own code on the write path and the send path', t => {
  const dir = tempDir('vivim-grant-expired-');
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  let clock = ISO;
  const { ledger, svc } = openService(dir, { now: () => clock });
  svc.grantBootstrap({ scope: 'full-bootstrap', expiresInMs: 60000 });
  clock = new Date(Date.parse(ISO) + 60001).toISOString();
  assert.throws(() => svc.choosePreset({ preset: 'grove', requestId: 'owner-expired' }),
    error => error.code === GRANT_REASONS.expired);
  assert.throws(() => svc.consumeGrantSend({ requestId: 'send-expired' }),
    error => error.code === GRANT_REASONS.expired);
  // A fresh owner grant restores the authority.
  clock = ISO;
  svc.grantBootstrap({ scope: 'full-bootstrap' });
  clock = new Date(Date.parse(ISO) + 1).toISOString();
  const claim = svc.consumeGrantSend({ requestId: 'send-renewed' });
  assert.equal(claim.ok, true);
  ledger.close();
});

test('a grant bound to one prompt digest refuses a different digest and a missing digest', t => {
  const dir = tempDir('vivim-grant-digest-');
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const { ledger, svc } = openService(dir);
  svc.grantBootstrap({ scope: 'full-bootstrap', promptDigest: DIGEST_A });
  assert.throws(() => svc.consumeGrantSend({ promptDigest: DIGEST_B, requestId: 'send-b' }),
    error => error.code === GRANT_REASONS.digest);
  assert.throws(() => svc.consumeGrantSend({ requestId: 'send-none' }),
    error => error.code === GRANT_REASONS.digest);
  const claim = svc.consumeGrantSend({ promptDigest: DIGEST_A, requestId: 'send-a' });
  assert.equal(claim.ok, true);
  assert.equal(claim.used, 1);
  ledger.close();
});

test('the send cap is exhausted after exactly N sends and the grant stays usable until then', t => {
  const dir = tempDir('vivim-grant-cap-');
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const { ledger, svc } = openService(dir);
  svc.grantBootstrap({ scope: 'full-bootstrap', maxSends: 3 });
  for (let i = 0; i < 3; i++) {
    const claim = svc.consumeGrantSend({ requestId: 'send-' + i });
    assert.equal(claim.ok, true);
    assert.equal(claim.used, i + 1);
    assert.equal(claim.remaining, 3 - i - 1);
  }
  assert.throws(() => svc.consumeGrantSend({ requestId: 'send-over' }),
    error => error.code === GRANT_REASONS.exhausted);
  assert.equal(svc.grantState().sendsUsed, 3);
  assert.equal(svc.grantState().sendsRemaining, 0);
  // The cap bounds sends, not the owner's local writes.
  const preset = svc.choosePreset({ preset: 'grove', requestId: 'owner-after-cap' });
  assert.equal(preset.ok, true);
  ledger.close();
});

test('the cap is enforced across separate reads, not only inside one call', t => {
  const dir = tempDir('vivim-grant-shared-');
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const writer = openService(dir, { grant: { scope: 'full-bootstrap', maxSends: 2 } });
  const reader = openService(dir);
  assert.equal(reader.svc.grantState().sendsUsed, 0);
  writer.svc.consumeGrantSend({ requestId: 'shared-1' });
  // A second reader of the same ledger sees the consumed send.
  assert.equal(reader.svc.grantState().sendsUsed, 1);
  assert.equal(reader.svc.grantState().sendsRemaining, 1);
  reader.svc.consumeGrantSend({ requestId: 'shared-2' });
  assert.equal(writer.svc.grantState().sendsUsed, 2);
  // Both readers now refuse: the cap is exhausted for everyone.
  assert.throws(() => writer.svc.consumeGrantSend({ requestId: 'shared-3' }),
    error => error.code === GRANT_REASONS.exhausted);
  assert.throws(() => reader.svc.consumeGrantSend({ requestId: 'shared-4' }),
    error => error.code === GRANT_REASONS.exhausted);
  writer.ledger.close();
  reader.ledger.close();
});

test('two Host processes can never spend the same send', async t => {
  const dir = tempDir('vivim-grant-race-');
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const ledgerFile = path.join(dir, 'ledger.db');
  const issuer = openLedger({ file: ledgerFile });
  createBootstrapService({ ledger: issuer, now: () => ISO }).grantBootstrap({ scope: 'full-bootstrap', maxSends: 3 });
  issuer.close();

  const serviceUrl = new URL('../bootstrap/service.mjs', import.meta.url).href;
  const ledgerUrl = new URL('../bootstrap/ledger.mjs', import.meta.url).href;
  const child = `
import { writeFileSync } from 'node:fs';
const { createBootstrapService } = await import(${JSON.stringify(serviceUrl)});
const { openLedger } = await import(${JSON.stringify(ledgerUrl)});
const ledger = openLedger({ file: process.env.VIVIM_TEST_LEDGER });
const svc = createBootstrapService({ ledger, worldId: 'world-local', now: () => ${JSON.stringify(ISO)} });
let out;
try {
  const claim = svc.consumeGrantSend({ requestId: process.env.VIVIM_TEST_REQ });
  out = { ok: true, used: claim.used };
} catch (error) {
  out = { ok: false, code: error?.code ?? 'ERROR' };
}
writeFileSync(process.env.VIVIM_TEST_RESULT, JSON.stringify(out));
ledger.close();
`;
  const run = (index) => new Promise((resolve, reject) => {
    const result = path.join(dir, 'result-' + index + '.json');
    const childProcess = spawn(process.execPath, ['--input-type=module', '-e', child], {
      env: { ...process.env, VIVIM_TEST_LEDGER: ledgerFile, VIVIM_TEST_REQ: 'race-' + index, VIVIM_TEST_RESULT: result },
      stdio: 'ignore'
    });
    childProcess.on('error', reject);
    childProcess.on('exit', code => {
      if (code !== 0) return reject(new Error('child ' + index + ' exited with ' + code));
      resolve(JSON.parse(readFileSync(result, 'utf8')));
    });
  });
  const results = await Promise.all([0, 1, 2, 3, 4].map(run));
  const granted = results.filter(r => r.ok);
  const refused = results.filter(r => !r.ok);
  assert.equal(granted.length, 3, 'exactly the capped number of sends is granted');
  assert.deepEqual(granted.map(r => r.used).sort(), [1, 2, 3]);
  assert.equal(refused.length, 2);
  for (const refusal of refused) assert.equal(refusal.code, GRANT_REASONS.exhausted);
  const after = openLedger({ file: ledgerFile });
  const state = createBootstrapService({ ledger: after, now: () => ISO }).grantState();
  assert.equal(state.sendsUsed, 3);
  after.close();
});

test('a revoked grant is refused as revoked, and a never-granted Host as not granted', t => {
  const dir = tempDir('vivim-grant-revoked-');
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const { ledger, svc } = openService(dir);
  assert.throws(() => svc.choosePreset({ preset: 'grove', requestId: 'owner-none' }),
    error => error.code === GRANT_REASONS.notGranted);
  svc.grantBootstrap({ scope: 'full-bootstrap' });
  svc.revokeGrant();
  assert.throws(() => svc.choosePreset({ preset: 'grove', requestId: 'owner-revoked' }),
    error => error.code === GRANT_REASONS.revoked);
  assert.throws(() => svc.consumeGrantSend({ requestId: 'send-revoked' }),
    error => error.code === GRANT_REASONS.revoked);
  ledger.close();
});

test('a grant record written before bounded grants keeps its unbounded meaning', t => {
  const dir = tempDir('vivim-grant-legacy-');
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const ledger = openLedger({ file: path.join(dir, 'ledger.db') });
  // Exactly the record shape main wrote before this change.
  ledger.meta.set('grant.bootstrap', JSON.stringify({
    scope: 'full-bootstrap', worldId: 'world-local', at: '2026-10-01T00:00:00.000Z', source: 'owner'
  }));
  const svc = createBootstrapService({ ledger, now: () => ISO });
  const preset = svc.choosePreset({ preset: 'grove', requestId: 'owner-legacy' });
  assert.equal(preset.ok, true);
  const claim = svc.consumeGrantSend({ promptDigest: DIGEST_B, requestId: 'send-legacy' });
  assert.equal(claim.ok, true);
  assert.equal(claim.unbounded, true);
  assert.equal(claim.remaining, null);
  const state = svc.grantState();
  assert.equal(state.maxSends, null);
  assert.equal(state.sendsRemaining, null);
  ledger.close();
});

test('an absent or unverified owner token cannot issue a grant', async t => {
  const dir = tempDir('vivim-grant-owner-');
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const runtime = createBootstrapRuntime({ dataRoot: dir, file: ':memory:' });
  const server = createHostServer({ dataRoot: dir, bootstrap: runtime, ownerToken: TOKEN });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const post = (headers = {}) => fetch(base + '/api/host/bootstrap/grant', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-vivim-bootstrap': '1', ...headers },
    body: JSON.stringify({ scope: 'full-bootstrap' })
  });
  try {
    const noToken = await post();
    assert.equal(noToken.status, 401);
    const wrongToken = await post({ authorization: 'Bearer wrong-owner-token-0123456789abcdef0123456789abcdef' });
    assert.equal(wrongToken.status, 401);
    const notBearer = await post({ authorization: TOKEN });
    assert.equal(notBearer.status, 401);
    // No grant exists after the refused attempts.
    assert.equal(runtime.status().grant, null);
    const granted = await post({ authorization: 'Bearer ' + TOKEN });
    assert.equal(granted.status, 200);
    const record = await granted.json();
    assert.equal(record.source, 'owner');
    assert.equal(record.maxSends, GRANT_MAX_SENDS);
    assert.equal(typeof record.expiresAt, 'string');
    assert.equal(record.sendsUsed, 0);
    assert.equal(runtime.status().grant.source, 'owner');
  } finally {
    await new Promise(resolve => server.close(resolve));
    runtime.close();
  }
});

test('grant issuance has no caller-supplied confirmation gate', t => {
  const dir = tempDir('vivim-grant-confirm-');
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const { ledger, svc } = openService(dir);
  const source = svc.grantBootstrap.toString();
  assert.doesNotMatch(source, /confirm/i);
  assert.doesNotMatch(source, /tty|stdin|readline/i);
  const moduleSource = readFileSync(new URL('../bootstrap/service.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(moduleSource, /ttyConfirm|readline|process\.stdin/);
  ledger.close();
});

test('the scheduler refuses a lapsed or spent grant before any browser effect', async t => {
  const dir = tempDir('vivim-grant-scheduler-');
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const clock = { at: ISO };
  const dispatches = [];
  const studio = {
    dispatch: async packet => {
      dispatches.push(packet);
      return { requestId: packet.requestId, state: 'complete', provider: 'chatgpt', journalState: 'complete',
        submitted: 'yes', threadRef: 'chatgpt-c:6ae55c0e-65bc-83eb-a0d3-8cef6db604c9', reply: JSON.stringify(F02) };
    },
    inspect: async () => null
  };
  const build = ({ maxSends = 5, expiresInMs = 600000 } = {}) => {
    const ledger = openLedger({ file: path.join(dir, 'ledger.db') });
    const svc = createBootstrapService({ ledger, now: () => clock.at });
    // The grant is issued at a fixed moment so the clock can move past its expiry later.
    svc.grantBootstrap({ scope: 'full-bootstrap', maxSends, expiresInMs, at: ISO });
    const scheduler = createBootstrapScheduler({
      ledger, worldId: 'world-local', now: () => clock.at,
      runtime: {
        status: () => ({ state: 'ready', ...svc.fullStatus() }),
        ingestF02: params => svc.ingestF02(params),
        ingestF01: params => svc.ingestF01(params),
        ingestPass: params => svc.ingestPass(params)
      },
      studio,
      readiness: async () => ({ provider: 'chatgpt', state: 'signed_in', verified: true, observedAt: clock.at }),
      authorize: async packet => ({
        worldId: 'world-local', generationId: packet.generationId, pass: packet.pass, requestId: packet.requestId,
        promptDigest: packet.promptDigest, provider: 'chatgpt', scope: 'full-bootstrap', ownerApproved: true,
        approvalRef: 'owner-gen-1', expiresAt: new Date(Date.parse(clock.at) + 600000).toISOString()
      }),
      promptForPass: (pass, generationId) => 'pinned prompt for ' + pass + ' ' + generationId
    });
    return { ledger, svc, scheduler };
  };

  const live = build();
  live.scheduler.startGeneration({ generationId: 'gen-1', passes: ['F02'] });
  await live.scheduler.runOnce();
  assert.equal(dispatches.length, 1, 'an allowed send is dispatched exactly once');
  assert.equal(live.svc.grantState().sendsUsed, 1, 'the dispatch consumed one send of the grant');
  live.ledger.close();

  dispatches.length = 0;
  clock.at = new Date(Date.parse(ISO) + 700000).toISOString();
  const lapsed = build({ expiresInMs: 60000 });
  lapsed.scheduler.startGeneration({ generationId: 'gen-2', passes: ['F02'] });
  await lapsed.scheduler.runOnce();
  assert.equal(dispatches.length, 0, 'a lapsed grant sends nothing');
  assert.equal(lapsed.scheduler.snapshot().passes[0].status, 'blocked');
  assert.equal(lapsed.scheduler.snapshot().passes[0].reason, GRANT_REASONS.expired);
  lapsed.ledger.close();

  dispatches.length = 0;
  clock.at = ISO;
  const spent = build({ maxSends: 1 });
  // The single permitted send is spent by hand: the scheduler must refuse the next one.
  spent.svc.consumeGrantSend({ requestId: 'pre-spent' });
  spent.scheduler.startGeneration({ generationId: 'gen-3', passes: ['F02'] });
  await spent.scheduler.runOnce();
  assert.equal(dispatches.length, 0, 'an exhausted grant sends nothing');
  assert.equal(spent.scheduler.snapshot().passes[0].status, 'blocked');
  assert.equal(spent.scheduler.snapshot().passes[0].reason, GRANT_REASONS.exhausted);
  spent.ledger.close();
});

// The scheduler has its own write scope, so the revocation refusal is exercised through its
// own preflight and packet filter. Both cases below passed before the revocation check was
// shared: a revoked record reached the grantRefusal ordering without its revoked flag, and a
// stale preflight snapshot never saw the tombstone the service reads.
test('the scheduler refuses a revoked grant with GRANT_REVOKED, not merely the service', async t => {
  const dir = tempDir('vivim-grant-scheduler-revoked-');
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const clock = { at: ISO };
  const dispatches = [];
  const studio = {
    dispatch: async packet => {
      dispatches.push(packet);
      return { requestId: packet.requestId, state: 'complete', provider: 'chatgpt', journalState: 'complete',
        submitted: 'yes', threadRef: 'chatgpt-c:6ae55c0e-65bc-83eb-a0d3-8cef6db604c9', reply: JSON.stringify(F02) };
    },
    inspect: async () => null
  };
  // statusOf lets a case pin the grant snapshot the scheduler's runtime adapter returns, which
  // models a preflight that read the grant before the owner revoked it.
  const build = (name, statusOf = null) => {
    const ledgerDir = path.join(dir, name);
    mkdirSync(ledgerDir, { recursive: true });
    const ledger = openLedger({ file: path.join(ledgerDir, 'ledger.db') });
    const svc = createBootstrapService({ ledger, now: () => clock.at });
    svc.grantBootstrap({ scope: 'full-bootstrap', maxSends: 5, expiresInMs: 600000, at: ISO });
    const captured = svc.grantState();
    const scheduler = createBootstrapScheduler({
      ledger, worldId: 'world-local', now: () => clock.at,
      runtime: {
        status: statusOf ? () => ({ state: 'ready', ...statusOf(captured) }) : () => ({ state: 'ready', ...svc.fullStatus() }),
        ingestF02: params => svc.ingestF02(params),
        ingestF01: params => svc.ingestF01(params),
        ingestPass: params => svc.ingestPass(params)
      },
      studio,
      readiness: async () => ({ provider: 'chatgpt', state: 'signed_in', verified: true, observedAt: clock.at }),
      authorize: async packet => ({
        worldId: 'world-local', generationId: packet.generationId, pass: packet.pass, requestId: packet.requestId,
        promptDigest: packet.promptDigest, provider: 'chatgpt', scope: 'full-bootstrap', ownerApproved: true,
        approvalRef: 'owner-gen-1', expiresAt: new Date(Date.parse(clock.at) + 600000).toISOString()
      }),
      promptForPass: (pass, generationId) => 'pinned prompt for ' + pass + ' ' + generationId
    });
    return { ledger, svc, scheduler, captured };
  };

  // A record that still exists but carries the revocation flag. The service refuses it first;
  // the scheduler must refuse it with the same code, before its expiry or cap checks.
  const flagged = build('flag');
  flagged.ledger.meta.set('grant.bootstrap', JSON.stringify({ ...flagged.captured, revoked: true }));
  assert.throws(() => flagged.svc.consumeGrantSend({ requestId: 'revoked-flag-send' }),
    error => error.code === GRANT_REASONS.revoked);
  flagged.scheduler.startGeneration({ generationId: 'gen-revoked-flag', passes: ['F02'] });
  await flagged.scheduler.runOnce();
  assert.equal(dispatches.length, 0, 'a revoked record sends nothing');
  assert.equal(flagged.scheduler.snapshot().passes[0].status, 'blocked');
  assert.equal(flagged.scheduler.snapshot().passes[0].reason, GRANT_REASONS.revoked);
  assert.equal(flagged.svc.grantState().sendsUsed, 0, 'no send is claimed from a revoked record');
  flagged.ledger.close();

  // A preflight that saw the grant before revokeGrant() cleared it. The packet filter must
  // re-read the revocation signal and refuse on the tombstone alone.
  const tombstoned = build('tombstone', captured => ({ grant: captured }));
  tombstoned.svc.revokeGrant();
  tombstoned.scheduler.startGeneration({ generationId: 'gen-revoked-tombstone', passes: ['F02'] });
  await tombstoned.scheduler.runOnce();
  assert.equal(dispatches.length, 0, 'a tombstoned grant sends nothing');
  assert.equal(tombstoned.scheduler.snapshot().passes[0].status, 'blocked');
  assert.equal(tombstoned.scheduler.snapshot().passes[0].reason, GRANT_REASONS.revoked);
  tombstoned.ledger.close();
});
