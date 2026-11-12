import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { createHash } from 'node:crypto';
import { createGrantStore, ttyConfirm } from '../../src/onboarding/grant.mjs';

const digest = text => createHash('sha256').update(text, 'utf8').digest('hex');
const PROMPT = 'SECRET ONBOARDING PROMPT';
const DIGEST = digest(PROMPT);
const NEW = 'new';
const NATIVE = 'https://chatgpt.com/c/0f0f0f0f-0f0f-0f0f-0f0f-0f0f0f0f0f0f';
const POSIX = process.platform !== 'win32';

async function setup(t, { clock = { t: 1000 }, maxSends = 2, expiresInMs = 60000, issue = true, providers = ['chatgpt'] } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'harness-grant-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const store = createGrantStore({ dir, now: () => clock.t, confirm: async () => true });
  const grant = issue ? await store.issue({ providers, profile: 'lab', port: 9333, promptDigest: DIGEST, maxSends, expiresInMs, fresh: true }) : null;
  const req = (over = {}) => ({ provider: 'chatgpt', profile: 'lab', port: 9333, promptDigest: DIGEST, threadUrl: NEW, requestId: 'req-1', ...over });
  return { dir, store, grant, clock, req };
}

test('issue writes a grant with digest only, never prompt text', async t => {
  const { dir, store } = await setup(t, { issue: false });
  await store.issue({ providers: ['chatgpt'], profile: 'lab', port: 9333, promptDigest: DIGEST, maxSends: 1, expiresInMs: 1000, fresh: true, prompt: PROMPT });
  const raw = await readFile(join(dir, 'onboarding-grant.json'), 'utf8');
  assert.ok(raw.includes(DIGEST));
  assert.ok(!raw.includes(PROMPT));
  assert.ok(!/"prompt"\s*:/.test(raw));
});

test('grant file is mode 0600 and written atomically (no tmp left behind)', { skip: !POSIX && 'POSIX mode bits' }, async t => {
  const { dir, store } = await setup(t, { issue: false });
  await store.issue({ providers: ['chatgpt'], profile: 'lab', port: 9333, promptDigest: DIGEST, maxSends: 1, expiresInMs: 1000, fresh: true });
  assert.equal((await stat(join(dir, 'onboarding-grant.json'))).mode & 0o777, 0o600);
  assert.deepEqual((await readdir(dir)).filter(n => n.endsWith('.tmp')), []);
});

test('issue refuses port 9222 and bad inputs before any confirmation', async t => {
  const { store } = await setup(t, { issue: false });
  let asked = 0;
  const base = { providers: ['chatgpt'], profile: 'lab', port: 9333, promptDigest: DIGEST, maxSends: 1, expiresInMs: 1000, fresh: true, confirm: async () => { asked++; return true; } };
  await assert.rejects(store.issue({ ...base, port: 9222 }), { code: 'GRANT_PORT_REFUSED' });
  await assert.rejects(store.issue({ ...base, fresh: false }), { code: 'GRANT_NOT_FRESH' });
  await assert.rejects(store.issue({ ...base, promptDigest: 'short' }), { code: 'GRANT_BAD_DIGEST' });
  await assert.rejects(store.issue({ ...base, maxSends: 0 }), { code: 'GRANT_BAD_MAX' });
  assert.equal(asked, 0);
});

test('issue requires confirm callback to return exactly true; otherwise nothing is written', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'harness-grant-confirm-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  // No injected confirm anywhere: the TTY default must apply, and with no TTY it throws.
  const store = createGrantStore({ dir, now: () => 1000, stdin: new PassThrough(), stdout: new PassThrough() });
  const base = { providers: ['chatgpt'], profile: 'lab', port: 9333, promptDigest: DIGEST, maxSends: 1, expiresInMs: 1000, fresh: true };
  await assert.rejects(store.issue({ ...base, confirm: async () => false }), { code: 'GRANT_NOT_CONFIRMED' });
  await assert.rejects(store.issue({ ...base, confirm: async () => 'yes' }), { code: 'GRANT_NOT_CONFIRMED' });
  await assert.rejects(store.issue({ ...base, confirm: async () => { throw new Error('denied'); } }), { message: 'denied' });
  await assert.rejects(store.issue({ ...base, confirm: undefined }), { code: 'GRANT_NO_TTY' });
  assert.deepEqual((await readdir(dir)), []);
});

test('default confirm throws GRANT_NO_TTY without an interactive terminal', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'harness-grant-tty-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const store = createGrantStore({ dir, now: () => 1, stdin: new PassThrough(), stdout: new PassThrough() });
  await assert.rejects(store.issue({ providers: ['chatgpt'], profile: 'lab', port: 9333, promptDigest: DIGEST, maxSends: 1, expiresInMs: 1000, fresh: true }), { code: 'GRANT_NO_TTY' });
  await assert.rejects(ttyConfirm({ summary: { providers: ['chatgpt'] }, stdin: { isTTY: false }, stdout: { isTTY: true } }), { code: 'GRANT_NO_TTY' });
  assert.deepEqual(await readdir(dir), []);
});

test('default confirm with a TTY requires the exact typed phrase', async t => {
  const mkTty = () => { const s = new PassThrough(); s.isTTY = true; return s; };
  const summary = { providers: ['chatgpt'], profile: 'lab', port: 9333, maxSends: 1, expiresInMs: 1000 };
  const out = mkTty(); out.resume();
  const good = mkTty(); setTimeout(() => good.write('ISSUE chatgpt\n'), 5);
  assert.equal(await ttyConfirm({ summary, stdin: good, stdout: out }), true);
  const bad = mkTty(); setTimeout(() => bad.write('yes\n'), 5);
  assert.equal(await ttyConfirm({ summary, stdin: bad, stdout: out }), false);
});

test('check: happy path reports remaining sends without consuming', async t => {
  const { store, req } = await setup(t, { maxSends: 2 });
  assert.deepEqual(await store.check(req()), { ok: true, reason: null, remaining: 2 });
  assert.deepEqual(await store.check(req()), { ok: true, reason: null, remaining: 2 });
});

test('deny NO_GRANT when no grant was issued', async t => {
  const { store, req } = await setup(t, { issue: false });
  assert.equal((await store.check(req())).reason, 'NO_GRANT');
  assert.equal((await store.consume(req())).reason, 'NO_GRANT');
});

test('deny NO_GRANT for a corrupt grant file', async t => {
  const { dir, store, req } = await setup(t);
  await writeFile(join(dir, 'onboarding-grant.json'), '{not json');
  assert.equal((await store.check(req())).reason, 'NO_GRANT');
});

test('deny EXPIRED after expiresAt', async t => {
  const { store, clock, req } = await setup(t, { expiresInMs: 100 });
  clock.t = 1100;
  assert.equal((await store.check(req())).reason, 'EXPIRED');
  assert.equal((await store.consume(req())).reason, 'EXPIRED');
});

test('deny REVOKED after revoke, and revoke without a grant reports nothing revoked', async t => {
  const { store, req } = await setup(t);
  assert.deepEqual(await store.revoke(), { revoked: true });
  assert.equal((await store.check(req())).reason, 'REVOKED');
  assert.equal((await store.consume(req())).reason, 'REVOKED');
  const empty = await setup(t, { issue: false });
  assert.deepEqual(await empty.store.revoke(), { revoked: false });
});

test('deny PROVIDER_NOT_GRANTED for a provider outside the grant', async t => {
  const { store, req } = await setup(t, { providers: ['chatgpt'] });
  assert.equal((await store.check(req({ provider: 'claude' }))).reason, 'PROVIDER_NOT_GRANTED');
});

test('deny PROFILE_MISMATCH for another profile', async t => {
  const { store, req } = await setup(t);
  assert.equal((await store.check(req({ profile: 'owner' }))).reason, 'PROFILE_MISMATCH');
});

test('deny PORT_MISMATCH for another port, and 9222 is always refused', async t => {
  const { store, req } = await setup(t);
  assert.equal((await store.check(req({ port: 9334 }))).reason, 'PORT_MISMATCH');
  assert.equal((await store.check(req({ port: 9222 }))).reason, 'PORT_MISMATCH');
  assert.equal((await store.consume(req({ port: 9222 }))).reason, 'PORT_MISMATCH');
});

test('deny DIGEST_MISMATCH for a different prompt', async t => {
  const { store, req } = await setup(t);
  assert.equal((await store.check(req({ promptDigest: digest('other') }))).reason, 'DIGEST_MISMATCH');
});

test('deny NEW_THREAD_REQUIRED for an existing thread URL', async t => {
  const { store, req } = await setup(t);
  assert.equal((await store.check(req({ threadUrl: NATIVE }))).reason, 'NEW_THREAD_REQUIRED');
  assert.equal((await store.check(req({ threadUrl: undefined }))).reason, 'NEW_THREAD_REQUIRED');
});

test('deny EXHAUSTED once maxSends are consumed', async t => {
  const { store, req } = await setup(t, { maxSends: 1 });
  assert.equal((await store.consume(req())).ok, true);
  assert.equal((await store.check(req())).reason, 'EXHAUSTED');
  assert.equal((await store.consume(req({ requestId: 'req-2' }))).reason, 'EXHAUSTED');
});

test('consume is one-shot per send and decrements remaining', async t => {
  const { dir, store, req } = await setup(t, { maxSends: 2 });
  assert.deepEqual(await store.consume(req()), { ok: true, reason: null, remaining: 1, slot: 0 });
  assert.deepEqual(await store.consume(req({ requestId: 'req-2' })), { ok: true, reason: null, remaining: 0, slot: 1 });
  assert.equal((await store.consume(req({ requestId: 'req-3' }))).reason, 'EXHAUSTED');
  assert.equal((await readdir(dir)).filter(n => n.includes('.slot-')).length, 2);
});

test('concurrent consumes claim each slot exactly once', async t => {
  const { store, req } = await setup(t, { maxSends: 2 });
  const results = await Promise.all([1, 2, 3, 4, 5].map(i => store.consume(req({ requestId: `req-${i}` }))));
  assert.equal(results.filter(r => r.ok).length, 2);
  assert.equal(results.filter(r => r.reason === 'EXHAUSTED').length, 3);
  assert.deepEqual(results.filter(r => r.ok).map(r => r.slot).sort(), [0, 1]);
});

test('a new issue starts with a fresh send budget', async t => {
  const { store, clock, req } = await setup(t, { maxSends: 1 });
  await store.consume(req());
  await store.issue({ providers: ['chatgpt'], profile: 'lab', port: 9333, promptDigest: DIGEST, maxSends: 1, expiresInMs: 60000, fresh: true, confirm: async () => true });
  clock.t = 1001;
  assert.equal((await store.check(req())).ok, true);
});
