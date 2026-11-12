import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { resolveTarget, commandLineMatches, verifyAttachTarget } from '../../src/interface/target.mjs';
import { createApprovals } from '../../src/interface/approval.mjs';
import { createRouter } from '../../src/interface/router.mjs';

const PROFILE = join(tmpdir(), 'wh-attach-profile', 'Fork-12');
const ss = 'LISTEN 0 10 127.0.0.1:9234 0.0.0.0:* users:(("chrome",pid=42,fd=88))\nLISTEN 0 10 127.0.0.1:9333 0.0.0.0:* users:(("chrome",pid=7,fd=9))';
const argv = (dir, port = 9234) => ['/opt/chrome', `--user-data-dir=${dir}`, `--remote-debugging-port=${port}`].join('\0');

test('default target is the lab endpoint', () => {
  assert.deepEqual(resolveTarget({}), { host: '127.0.0.1', port: 9333, mode: 'lab' });
});
test('attach mode is opt-in and needs both port and absolute profile', () => {
  assert.deepEqual(resolveTarget({ WH_CDP_PORT: '9234', WH_ATTACH_PROFILE: PROFILE }), { host: '127.0.0.1', port: 9234, mode: 'attach', profile: PROFILE });
  assert.throws(() => resolveTarget({ WH_CDP_PORT: '9234' }), { code: 'ATTACH_PROFILE_REQUIRED' });
  assert.throws(() => resolveTarget({ WH_CDP_PORT: '9234', WH_ATTACH_PROFILE: 'rel/dir' }), { code: 'ATTACH_PROFILE_REQUIRED' });
  assert.throws(() => resolveTarget({ WH_CDP_PORT: '9234', WH_ATTACH_PROFILE: '/a/../etc' }), { code: 'ATTACH_PROFILE_REQUIRED' });
  for (const p of ['9222', 'abc', '80', '70000']) assert.throws(() => resolveTarget({ WH_CDP_PORT: p, WH_ATTACH_PROFILE: PROFILE }), { code: 'ATTACH_PORT_REFUSED' });
});
test('command line must match profile and port exactly', () => {
  assert.equal(commandLineMatches(argv(PROFILE), { profile: PROFILE, port: 9234 }), true);
  assert.equal(commandLineMatches(argv(PROFILE + '-other'), { profile: PROFILE, port: 9234 }), false);
  assert.equal(commandLineMatches(argv(PROFILE, 9333), { profile: PROFILE, port: 9234 }), false);
  assert.equal(commandLineMatches(`/opt/chrome --no-sandbox --user-data-dir=${PROFILE} --remote-debugging-port=9234\0`, { profile: PROFILE, port: 9234 }), true);
  assert.equal(commandLineMatches('/opt/chrome', { profile: PROFILE, port: 9234 }), false);
});
test('verifyAttachTarget checks the actual listener process', () => {
  const profile = '/home/box/chrome-profile/Fork-12';
  const target = resolveTarget({ WH_CDP_PORT: '9234', WH_ATTACH_PROFILE: profile }, 'linux');
  assert.equal(verifyAttachTarget(target, { platform: 'linux', run: () => ss, readCmdline: pid => pid === 42 ? argv(profile) : '' }), true);
  assert.throws(() => verifyAttachTarget(target, { platform: 'linux', run: () => ss, readCmdline: () => argv('/tmp/x') }), { code: 'ATTACH_PROFILE_MISMATCH' });
  assert.throws(() => verifyAttachTarget(target, { platform: 'linux', run: () => '', readCmdline: () => argv(profile) }), { code: 'ATTACH_PROFILE_MISMATCH' });
  assert.throws(() => verifyAttachTarget(target, { platform: 'linux', run: () => { throw new Error('no ss'); } }), { code: 'ATTACH_PROFILE_MISMATCH' });
  assert.equal(verifyAttachTarget({ mode: 'lab', port: 9333 }), true);
});

test('Windows attach validates the listener image, profile, port, and unavailable process metadata', () => {
  const target = resolveTarget({ WH_CDP_PORT: '9234', WH_ATTACH_PROFILE: 'C:\\Vivim Profile' }, 'win32');
  const browser = { pid: 42, name: 'chrome.exe', commandLine: '"C:\\Program Files\\Google\\Chrome\\chrome.exe" --user-data-dir="c:\\vivim profile" --remote-debugging-port=9234' };
  const check = record => verifyAttachTarget(target, { platform: 'win32', run: cmd => { assert.equal(cmd, 'powershell.exe'); return JSON.stringify(record); } });
  assert.equal(check(browser), true);
  for (const bad of [
    { ...browser, pid: 0 }, { ...browser, name: 'other.exe' }, { ...browser, commandLine: '' },
    { ...browser, commandLine: browser.commandLine.replace('vivim profile', 'wrong profile') },
    { ...browser, commandLine: browser.commandLine.replace('9234', '9333') },
  ]) assert.throws(() => check(bad), { code: 'ATTACH_PROFILE_MISMATCH' });
  assert.throws(() => verifyAttachTarget(target, { platform: 'win32', run: () => { throw Error('No listener metadata'); } }), { code: 'ATTACH_PROFILE_MISMATCH' });
  assert.throws(() => verifyAttachTarget(target, { platform: 'win32', run: () => 'invalid JSON' }), { code: 'ATTACH_PROFILE_MISMATCH' });
});

test('profile comparison folds Windows case only and preserves quoted or NUL-delimited spaces', () => {
  assert.equal(commandLineMatches('chrome.exe --user-data-dir="C:\\User Profile" --remote-debugging-port=9234', { profile: 'c:\\user profile', port: 9234 }, 'win32'), true);
  assert.equal(commandLineMatches(['/opt/chrome', '--user-data-dir=/tmp/User Profile', '--remote-debugging-port=9234'], { profile: '/tmp/User Profile', port: 9234 }, 'linux'), true);
  assert.equal(commandLineMatches(argv('/tmp/User Profile'), { profile: '/tmp/user profile', port: 9234 }, 'linux'), false);
  assert.equal(commandLineMatches(argv('/tmp/User Profile'), { profile: '/tmp/User Profile', port: 9234 }, 'linux'), true);
  assert.equal(commandLineMatches('chrome --user-data-dir=relative --remote-debugging-port=9234', { profile: '/tmp/relative', port: 9234 }, 'linux'), false);
  assert.equal(commandLineMatches('chrome --user-data-dir=/tmp/a --user-data-dir=/tmp/b --remote-debugging-port=9234', { profile: '/tmp/a', port: 9234 }, 'linux'), false);
});

test('attach resolution uses target-platform path rules without accepting relative or traversing paths', () => {
  assert.equal(resolveTarget({ WH_CDP_PORT: '9234', WH_ATTACH_PROFILE: 'c:/User Profile/' }, 'win32').profile, 'c:\\User Profile');
  assert.equal(resolveTarget({ WH_CDP_PORT: '9234', WH_ATTACH_PROFILE: '/tmp/User Profile/' }, 'linux').profile, '/tmp/User Profile');
  for (const [platform, profile] of [['linux', '/tmp/a/../b'], ['win32', 'C:\\a\\..\\b'], ['win32', 'C:relative'], ['linux', 'relative']]) {
    assert.throws(() => resolveTarget({ WH_CDP_PORT: '9234', WH_ATTACH_PROFILE: profile }, platform), { code: 'ATTACH_PROFILE_REQUIRED' });
  }
});

async function fixture(t, { verifyTarget = () => true, standingOk = true } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'wh-attach-')); t.after(() => rm(dir, { recursive: true, force: true }));
  const records = new Map(); const calls = { connect: [], open: [], closed: 0, sends: 0 };
  const journal = { async create(r) { if (records.has(r.requestId)) return { created: false, existing: records.get(r.requestId) }; records.set(r.requestId, { ...r, state: 'accepted', submitted: 'no' }); return { created: true }; }, async read(id) { return records.get(id); }, async update(id, p) { Object.assign(records.get(id), p); return records.get(id); }, async list() { return [...records.values()]; } };
  const page = { close: async () => { calls.closed++; } };
  const deps = { createJournal: () => journal, getProvider: id => ({ id, url: 'https://chatgpt.com/', status: 'measured' }), listProviders: () => [], digestPayload: x => createHash('sha256').update(x).digest('hex'), threadKeyFor: (p, u) => `${p.id}:${u}`,
    connect: opts => { calls.connect.push(opts); return { openPage: url => { calls.open.push(url); return page; } }; },
    sendOnce: async () => { calls.sends++; return { state: 'observed' }; }, readReply: () => ({ complete: true, text: 'OK' }) };
  const approvals = createApprovals({ dir: join(dir, 'approvals'), print: () => {} });
  const standing = { check: async () => ({ ok: standingOk }), recordSend: async () => {} };
  const target = { host: '127.0.0.1', port: 9234, mode: 'attach', profile: PROFILE };
  const router = await createRouter({ dir, deps, approvals, standing, target, verifyTarget, pollMs: 1 });
  return { router, approvals, calls };
}
test('attach mode: per-request approval required (standing ignored), opens a new tab on the attach port, never closes', async t => {
  const f = await fixture(t);
  const r = await f.router.ask({ provider: 'chatgpt', prompt: 'Reply with OK' });
  assert.equal((await f.router.result(r.requestId)).status, 'pending_approval'); assert.equal(f.calls.sends, 0);
  await f.approvals.approve(r.requestId);
  const done = await f.router.wait(r.requestId, 1000);
  assert.equal(done.status, 'complete'); assert.equal(done.reply, 'OK');
  assert.deepEqual(f.calls.connect, [{ host: '127.0.0.1', port: 9234 }]); assert.deepEqual(f.calls.open, ['https://chatgpt.com/']); assert.equal(f.calls.closed, 0);
});
test('attach mode: profile verification failure blocks before connecting or sending', async t => {
  const f = await fixture(t, { verifyTarget: () => { throw Object.assign(new Error('mismatch'), { code: 'ATTACH_PROFILE_MISMATCH' }); } });
  const r = await f.router.ask({ provider: 'chatgpt', prompt: 'Reply with OK' }); await f.approvals.approve(r.requestId);
  const done = await f.router.wait(r.requestId, 1000);
  assert.equal(done.status, 'failed'); assert.equal(f.calls.connect.length, 0); assert.equal(f.calls.sends, 0);
});
