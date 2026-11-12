import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { createStanding, isLabCommandLine } from '../../src/interface/standing.mjs';
import { createApprovals } from '../../src/interface/approval.mjs';
import { createRouter } from '../../src/interface/router.mjs';

const HOUR = 3600000;
const enableArgs = { provider: 'test', hours: 2, maxSends: 3, threads: [], confirmText: 'ENABLE test' };
const okLab = async () => true;

async function tempDir(t) {
  const dir = await mkdtemp(join(tmpdir(), 'wh-standing-')); t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

test('enable rejects wrong confirmation, bad hours, bad send cap, and bad threads', async t => {
  const s = createStanding({ dir: await tempDir(t), verifyLabProfile: okLab });
  await assert.rejects(s.enable({ ...enableArgs, confirmText: 'enable test' }), { code: 'STANDING_CONFIRM_MISMATCH' });
  await assert.rejects(s.enable({ ...enableArgs, confirmText: 'ENABLE' }), { code: 'STANDING_CONFIRM_MISMATCH' });
  for (const hours of [0, 25, 1.5, '2', NaN]) await assert.rejects(s.enable({ ...enableArgs, hours }), { code: 'STANDING_BAD_HOURS' });
  for (const maxSends of [0, 21, 2.5]) await assert.rejects(s.enable({ ...enableArgs, maxSends }), { code: 'STANDING_BAD_MAX' });
  await assert.rejects(s.enable({ ...enableArgs, threads: ['http://example.com/c/1'] }), { code: 'STANDING_BAD_THREAD' });
  await assert.rejects(s.enable({ ...enableArgs, threads: ['not a url'] }), { code: 'STANDING_BAD_THREAD' });
  await assert.rejects(s.enable({ ...enableArgs, threads: ['new'] }), { code: 'STANDING_BAD_THREAD' });
  await assert.rejects(s.enable({ ...enableArgs, threads: Array.from({ length: 11 }, (_, i) => `https://example.com/c/${i}`) }), { code: 'STANDING_BAD_THREAD' });
  await assert.rejects(s.enable({ ...enableArgs, provider: '' , confirmText: 'ENABLE ' }), { code: 'STANDING_BAD_PROVIDER' });
  assert.deepEqual(await s.status(), { record: null, active: false });
});

test('check denies with NO_STANDING, PROVIDER_MISMATCH, THREAD_NOT_ALLOWED, PROMPT_TOO_LONG, and EXPIRED', async t => {
  const dir = await tempDir(t); let now = 1000000;
  const s = createStanding({ dir, now: () => now, verifyLabProfile: okLab });
  assert.deepEqual(await s.check({ provider: 'test', threadUrl: 'new', prompt: 'hi' }), { ok: false, reason: 'NO_STANDING' });
  await s.enable({ ...enableArgs, threads: ['https://example.com/c/abc'] });
  assert.deepEqual(await s.check({ provider: 'other', threadUrl: 'new', prompt: 'hi' }), { ok: false, reason: 'PROVIDER_MISMATCH' });
  assert.deepEqual(await s.check({ provider: 'test', threadUrl: 'https://example.com/c/zzz', prompt: 'hi' }), { ok: false, reason: 'THREAD_NOT_ALLOWED' });
  assert.deepEqual(await s.check({ provider: 'test', threadUrl: 'new', prompt: 'x'.repeat(2001) }), { ok: false, reason: 'PROMPT_TOO_LONG' });
  assert.deepEqual(await s.check({ provider: 'test', threadUrl: 'new', prompt: 'x'.repeat(2000) }), { ok: true });
  now += 2 * HOUR + 1;
  assert.deepEqual(await s.check({ provider: 'test', threadUrl: 'new', prompt: 'hi' }), { ok: false, reason: 'EXPIRED' });
  assert.equal((await s.status()).active, false);
});

test('check denies with LAB_PROFILE_NOT_VERIFIED when verification is false or throws', async t => {
  const dir = await tempDir(t);
  await createStanding({ dir, verifyLabProfile: okLab }).enable(enableArgs);
  const falsy = createStanding({ dir, verifyLabProfile: async () => false });
  const throws = createStanding({ dir, verifyLabProfile: async () => { throw new Error('boom'); } });
  assert.deepEqual(await falsy.check({ provider: 'test', threadUrl: 'new', prompt: 'hi' }), { ok: false, reason: 'LAB_PROFILE_NOT_VERIFIED' });
  assert.deepEqual(await throws.check({ provider: 'test', threadUrl: 'new', prompt: 'hi' }), { ok: false, reason: 'LAB_PROFILE_NOT_VERIFIED' });
});

test('check allows new and listed threads; recordSend counts and SEND_LIMIT stops at maxSends', async t => {
  const dir = await tempDir(t);
  const s = createStanding({ dir, verifyLabProfile: okLab });
  await s.enable({ ...enableArgs, maxSends: 2, threads: ['https://example.com/c/abc'] });
  assert.deepEqual(await s.check({ provider: 'test', threadUrl: 'https://example.com/c/abc', prompt: 'hi' }), { ok: true });
  assert.deepEqual(await s.check({ provider: 'test', threadUrl: 'new', prompt: 'hi' }), { ok: true });
  await s.recordSend();
  assert.equal((await s.status()).record.sent, 1);
  await s.recordSend();
  assert.deepEqual(await s.check({ provider: 'test', threadUrl: 'new', prompt: 'hi' }), { ok: false, reason: 'SEND_LIMIT' });
  await assert.rejects(s.recordSend(), { code: 'SEND_LIMIT' });
});

test('standing.json never contains prompt text', async t => {
  const dir = await tempDir(t); const CANARY = 'PROMPT-CANARY-7f3a-do-not-store';
  const s = createStanding({ dir, verifyLabProfile: okLab });
  await s.enable(enableArgs);
  assert.equal((await s.check({ provider: 'test', threadUrl: 'new', prompt: CANARY })).ok, true);
  await s.recordSend();
  const raw = await readFile(join(dir, 'standing.json'), 'utf8');
  assert.doesNotMatch(raw, /PROMPT-CANARY/);
  assert.deepEqual(Object.keys(JSON.parse(raw)).sort(), ['createdAt', 'expiresAt', 'maxSends', 'provider', 'sent', 'threads']);
});

test('revoke removes standing and reports whether one existed', async t => {
  const dir = await tempDir(t); const s = createStanding({ dir, verifyLabProfile: okLab });
  await s.enable(enableArgs);
  assert.deepEqual(await s.revoke(), { revoked: true });
  assert.deepEqual(await s.revoke(), { revoked: false });
  assert.deepEqual(await s.check({ provider: 'test', threadUrl: 'new', prompt: 'hi' }), { ok: false, reason: 'NO_STANDING' });
});

test('isLabCommandLine accepts only the lab profile, quoted or not, and refuses the owner profile', () => {
  const lab = resolve('C:\\proj\\web-harness\\runtime\\chrome-profile');
  assert.equal(isLabCommandLine(`chrome.exe --remote-debugging-port=9333 --user-data-dir=${lab}`, lab), true);
  assert.equal(isLabCommandLine(`"chrome.exe" --user-data-dir="${lab.toUpperCase()}" --x`, lab), true);
  assert.equal(isLabCommandLine(`chrome.exe --user-data-dir=${lab}-2`, lab), false);
  assert.equal(isLabCommandLine('chrome.exe --user-data-dir=C:\\VIVIM\\chrome-profile', lab), false);
  assert.equal(isLabCommandLine(`chrome.exe --user-data-dir=${lab} --user-data-dir=C:\\VIVIM\\chrome-profile`, lab), false);
  assert.equal(isLabCommandLine('', lab), false);
});

async function routerFixture(t, dir, standing) {
  let sends = 0; const records = new Map();
  const journal = { async create(r) { if (records.has(r.requestId)) return { created: false, existing: records.get(r.requestId) }; records.set(r.requestId, { ...r, state: 'accepted', submitted: 'no' }); return { created: true }; }, async read(id) { return records.get(id); }, async update(id, p) { Object.assign(records.get(id), p); return records.get(id); }, async list() { return [...records.values()]; } };
  const deps = { createJournal: () => journal, getProvider: id => ({ id, url: 'https://example.com', status: 'seeded-unverified' }), listProviders: () => [], digestPayload: text => createHash('sha256').update(text).digest('hex'), threadKeyFor: (p, url) => `${p.id}:${url}`, connect: () => ({ openPage: () => ({}) }), sendOnce: async () => { sends++; return { state: 'uncertain' }; }, readReply: () => ({ complete: true, text: 'answer' }) };
  const approvals = createApprovals({ dir: join(dir, 'approvals'), print: () => {} });
  const router = await createRouter({ dir, deps, approvals, pollMs: 1, standing });
  return { router, sends: () => sends };
}

test('router: enabled standing sends through sendOnce without any approve call', async t => {
  const dir = await tempDir(t);
  const standing = createStanding({ dir: join(dir, 'approvals'), verifyLabProfile: okLab });
  await standing.enable(enableArgs);
  const f = await routerFixture(t, dir, standing);
  const r = await f.router.ask({ provider: 'test', prompt: 'hello' });
  assert.equal((await f.router.wait(r.requestId, 1000)).status, 'uncertain');
  assert.equal(f.sends(), 1);
  assert.equal((await standing.status()).record.sent, 1);
});

test('router: without standing the request stays pending and sends nothing', async t => {
  const dir = await tempDir(t);
  const f = await routerFixture(t, dir, createStanding({ dir: join(dir, 'approvals'), verifyLabProfile: okLab }));
  const r = await f.router.ask({ provider: 'test', prompt: 'hello' });
  assert.equal(r.status, 'pending_approval'); assert.equal((await f.router.result(r.requestId)).status, 'pending_approval'); assert.equal(f.sends(), 0);
});

test('router: enabled standing with unverified lab profile stays pending and sends nothing', async t => {
  const dir = await tempDir(t);
  await createStanding({ dir: join(dir, 'approvals'), verifyLabProfile: okLab }).enable(enableArgs);
  const f = await routerFixture(t, dir, createStanding({ dir: join(dir, 'approvals'), verifyLabProfile: async () => false }));
  const r = await f.router.ask({ provider: 'test', prompt: 'hello' });
  assert.equal((await f.router.result(r.requestId)).status, 'pending_approval'); assert.equal(f.sends(), 0);
});
