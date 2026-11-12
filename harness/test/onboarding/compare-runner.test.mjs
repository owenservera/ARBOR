import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createGrantStore } from '../../src/onboarding/grant.mjs';
import { runComparison, threadUrlKind, assertSaveDirAllowed } from '../../src/onboarding/compare-runner.mjs';

const digest = text => createHash('sha256').update(text, 'utf8').digest('hex');
const PROMPT = 'compare this onboarding prompt';
const DIGEST = digest(PROMPT);
const POSIX = process.platform !== 'win32';
const UUID = '0f0f0f0f-0f0f-0f0f-0f0f-0f0f0f0f0f0f';
const NATIVE = `https://chatgpt.com/c/${UUID}`;
const BASE = 'https://chatgpt.com/';

// Local stand-in for the router's journal-backed surface. Unlike the shared fake, it honours the requestId the
// runner passes, keeps a journal-style record per request, and can return a threadUrl from wait() on purpose.
function fakeRouter({ statusFor = () => 'complete', replyFor = c => `reply text from ${c.provider}`, waitThreadFor = null, recordFor = c => ({ requestId: c.requestId, provider: c.provider, state: 'observed', submitted: 'yes' }), askError = null } = {}) {
  const asks = [], waits = [], records = new Map(), attempts = [];
  let approvals = 0;
  const approval = { approve() { approvals++; throw new Error('runner must never approve'); }, consume() { approvals++; throw new Error('runner must never approve'); } };
  return {
    asks, waits, records, attempts, approval,
    get approvalCalls() { return approvals; },
    async ask(req) {
      attempts.push(req.requestId);
      if (askError && askError(req)) { const e = new Error('journal write failed'); e.code = 'JOURNAL_FAILED'; throw e; }
      asks.push(req);
      records.set(req.requestId, recordFor({ ...req }));
      return { requestId: req.requestId, status: 'pending_approval', provider: req.provider };
    },
    async wait(id) {
      waits.push(id);
      const call = asks.find(c => c.requestId === id);
      const status = statusFor(call);
      return { requestId: id, status, ...(status === 'complete' ? { reply: replyFor(call) } : {}), ...(waitThreadFor ? { threadUrl: waitThreadFor(call) } : {}) };
    }
  };
}

async function setup(t, { maxSends = 5, providers = ['chatgpt'], issue = true } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'harness-runner-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const grantDir = join(root, 'grants');
  const saveDir = join(root, 'out');
  const grants = createGrantStore({ dir: grantDir, now: () => 1000, confirm: async () => true });
  if (issue) await grants.issue({ providers, profile: 'lab', port: 9333, promptDigest: DIGEST, maxSends, expiresInMs: 60000, fresh: true });
  let n = 0;
  const base = { providers, prompt: PROMPT, grants, saveDir, now: () => 1000, idFor: p => `cmp-${p}-${++n}`, profile: 'lab', port: 9333, waitMs: 1, getRecord: null };
  return { root, saveDir, grants, base, grantDir };
}

test('calls ask once per provider with threadUrl new and a unique requestId', async t => {
  const { base, saveDir } = await setup(t, { providers: ['chatgpt', 'claude'] });
  const router = fakeRouter();
  const out = await runComparison({ ...base, providers: ['chatgpt', 'claude'], router, getRecord: async id => router.records.get(id) ?? null, saveDir });
  assert.equal(router.asks.length, 2);
  assert.ok(router.asks.every(a => a.threadUrl === 'new' && a.prompt === PROMPT));
  assert.notEqual(router.asks[0].requestId, router.asks[1].requestId);
  assert.deepEqual(out.results.map(r => r.status), ['complete', 'complete']);
});

test('uses a grant: a send with no grant is denied and never asked', async t => {
  const { base, saveDir } = await setup(t, { issue: false });
  const router = fakeRouter();
  const out = await runComparison({ ...base, router, getRecord: async id => router.records.get(id) ?? null, saveDir });
  assert.equal(router.attempts.length, 0);
  assert.equal(out.results[0].status, 'denied');
  assert.equal(out.results[0].error, 'NO_GRANT');
});

test('grant consumption is one-shot per provider: a second run cannot reuse the same slot', async t => {
  const { base, saveDir } = await setup(t, { maxSends: 1 });
  const router = fakeRouter();
  const g = { ...base, router, getRecord: async id => router.records.get(id) ?? null, saveDir };
  assert.equal((await runComparison(g)).results[0].status, 'complete');
  const again = await runComparison({ ...g, idFor: () => 'cmp-second' });
  assert.equal(again.results[0].status, 'denied');
  assert.equal(again.results[0].error, 'EXHAUSTED');
  assert.equal(router.asks.length, 1);
});

test('never resends on status uncertain: one ask, outcome recorded, moves on', async t => {
  const { base, saveDir } = await setup(t, { providers: ['chatgpt', 'claude'] });
  const router = fakeRouter({ statusFor: c => (c.provider === 'chatgpt' ? 'uncertain' : 'complete') });
  const out = await runComparison({ ...base, providers: ['chatgpt', 'claude'], router, getRecord: async id => router.records.get(id) ?? null, saveDir });
  assert.equal(router.attempts.filter(id => id.startsWith('cmp-chatgpt')).length, 1);
  assert.equal(out.results[0].status, 'uncertain');
  assert.equal(out.results[1].status, 'complete');
});

test('any ask error is recorded and never retried', async t => {
  const { base, saveDir } = await setup(t);
  const router = fakeRouter({ askError: () => true });
  const out = await runComparison({ ...base, router, getRecord: async id => router.records.get(id) ?? null, saveDir });
  assert.equal(router.attempts.length, 1);
  assert.equal(out.results[0].status, 'error');
  assert.equal(out.results[0].error, 'JOURNAL_FAILED');
});

test('no approval call is made by the runner', async t => {
  const { base, saveDir } = await setup(t);
  const router = fakeRouter();
  await runComparison({ ...base, router, getRecord: async id => router.records.get(id) ?? null, saveDir });
  assert.equal(router.approvalCalls, 0);
  const src = await readFile(fileURLToPath(new URL('../../src/onboarding/compare-runner.mjs', import.meta.url)), 'utf8');
  assert.doesNotMatch(src, /from\s+['"][^'"]*approval/);
});

test('saves replies privately and results.json holds metadata only', async t => {
  const { base, saveDir } = await setup(t);
  const router = fakeRouter();
  const out = await runComparison({ ...base, router, getRecord: async id => router.records.get(id) ?? null, saveDir });
  const requestId = out.results[0].requestId;
  assert.equal(await readFile(join(saveDir, `${requestId}.reply.txt`), 'utf8'), 'reply text from chatgpt');
  const raw = await readFile(join(saveDir, 'results.json'), 'utf8');
  assert.ok(!raw.includes('reply text from chatgpt'));
  assert.ok(!raw.includes('https://'));
  assert.ok(!/"threadUrl"\s*:/.test(raw));
  const [entry] = JSON.parse(raw);
  assert.deepEqual(Object.keys(entry).sort(), ['finishedAt', 'provider', 'replyChars', 'replyDigest', 'requestId', 'startedAt', 'status', 'threadUrlKind'].sort());
  assert.equal(entry.replyChars, 'reply text from chatgpt'.length);
  assert.equal(entry.replyDigest, digest('reply text from chatgpt'));
  assert.equal(entry.provider, 'chatgpt');
});

test('private files are mode 0600 and no tmp files are left behind', { skip: !POSIX && 'POSIX mode bits' }, async t => {
  const { base, saveDir } = await setup(t);
  const router = fakeRouter();
  const out = await runComparison({ ...base, router, getRecord: async id => router.records.get(id) ?? null, saveDir });
  assert.equal((await stat(join(saveDir, 'results.json'))).mode & 0o777, 0o600);
  assert.equal((await stat(join(saveDir, `${out.results[0].requestId}.reply.txt`))).mode & 0o777, 0o600);
  assert.deepEqual((await readdir(saveDir)).filter(n => n.endsWith('.tmp')), []);
});

test('unsupported provider is skipped with a reason and never asked or granted', async t => {
  const { base, saveDir } = await setup(t, { providers: ['chatgpt'] });
  const router = fakeRouter();
  const out = await runComparison({ ...base, providers: ['no-such-site', 'chatgpt'], router, getRecord: async id => router.records.get(id) ?? null, saveDir });
  assert.equal(out.results[0].status, 'skipped');
  assert.equal(out.results[0].error, 'UNSUPPORTED_PROVIDER');
  assert.equal(out.results[0].requestId, null);
  assert.equal(router.asks.length, 1);
  assert.equal(out.results[1].provider, 'chatgpt');
});

test('thread URL comes from the journal record, not from wait(): wait-only native URL is ignored', async t => {
  const { base, saveDir } = await setup(t);
  const router = fakeRouter({ waitThreadFor: () => NATIVE, recordFor: c => ({ requestId: c.requestId, provider: c.provider, state: 'observed' }) });
  const out = await runComparison({ ...base, router, getRecord: async id => router.records.get(id) ?? null, saveDir });
  assert.equal(out.results[0].threadUrlKind, 'none');
});

test('journal-recorded native thread URL counts as native', async t => {
  const { base, saveDir } = await setup(t);
  const router = fakeRouter({ recordFor: c => ({ requestId: c.requestId, provider: c.provider, threadUrl: NATIVE }) });
  const out = await runComparison({ ...base, router, getRecord: async id => router.records.get(id) ?? null, saveDir });
  assert.equal(out.results[0].threadUrlKind, 'native');
});

test('base URL in the journal is not counted native', async t => {
  const { base, saveDir } = await setup(t);
  const router = fakeRouter({ recordFor: c => ({ requestId: c.requestId, provider: c.provider, threadUrl: BASE }) });
  const out = await runComparison({ ...base, router, getRecord: async id => router.records.get(id) ?? null, saveDir });
  assert.equal(out.results[0].threadUrlKind, 'base');
});

test('missing journal record reports threadUrlKind none, even when wait() returns a native URL', async t => {
  const { base, saveDir } = await setup(t);
  const router = fakeRouter({ waitThreadFor: () => NATIVE, recordFor: () => null });
  const out = await runComparison({ ...base, router, getRecord: async id => router.records.get(id) ?? null, saveDir });
  assert.equal(out.results[0].threadUrlKind, 'none');
});

test('threadUrlKind classifies against the provider threadPattern and hosts', () => {
  assert.equal(threadUrlKind(NATIVE, { hosts: ['chatgpt.com'], threadPattern: /^\/c\/(?<id>[0-9a-f-]{36})\/?$/i }), 'native');
  assert.equal(threadUrlKind(BASE, { hosts: ['chatgpt.com'], threadPattern: /^\/c\/(?<id>[0-9a-f-]{36})\/?$/i }), 'base');
  assert.equal(threadUrlKind(NATIVE, { hosts: ['chatgpt.com'], threadPattern: null }), 'base');
  assert.equal(threadUrlKind(`https://evil.test/c/${UUID}`, { hosts: ['chatgpt.com'], threadPattern: /^\/c\/(?<id>[0-9a-f-]{36})\/?$/i }), 'base');
  assert.equal(threadUrlKind('http://chatgpt.com/c/' + UUID, { hosts: ['chatgpt.com'], threadPattern: /^\/c\/(?<id>[0-9a-f-]{36})\/?$/i }), 'base');
  assert.equal(threadUrlKind(undefined, { hosts: ['chatgpt.com'], threadPattern: null }), 'none');
  assert.equal(threadUrlKind(null, { hosts: ['chatgpt.com'], threadPattern: null }), 'none');
});

test('a wait timeout that leaves the request in flight is recorded, not retried', async t => {
  const { base, saveDir } = await setup(t);
  const router = fakeRouter({ statusFor: () => 'pending_approval' });
  const out = await runComparison({ ...base, router, getRecord: async id => router.records.get(id) ?? null, saveDir });
  assert.equal(out.results[0].status, 'pending_approval');
  assert.equal(router.attempts.length, 1);
});

test('one grant covers each provider once: maxSends bounds the run', async t => {
  const { base, saveDir } = await setup(t, { maxSends: 1, providers: ['chatgpt', 'claude'] });
  const router = fakeRouter();
  const out = await runComparison({ ...base, providers: ['chatgpt', 'claude'], router, getRecord: async id => router.records.get(id) ?? null, saveDir });
  assert.deepEqual(out.results.map(r => r.status), ['complete', 'denied']);
  assert.equal(out.results[1].error, 'EXHAUSTED');
});

for (const bad of [[], ['chatgpt', 'chatgpt'], [42]]) {
  test(`invalid providers ${JSON.stringify(bad)} are rejected before any ask`, async t => {
    const { base, saveDir } = await setup(t);
    const router = fakeRouter();
    await assert.rejects(runComparison({ ...base, providers: bad, router, getRecord: async () => null, saveDir }), TypeError);
    assert.equal(router.attempts.length, 0);
  });
}

test('saveDir inside a .git ancestor is refused before any ask', async t => {
  const { base, root } = await setup(t);
  const repo = join(root, 'repo');
  await mkdir(join(repo, '.git'), { recursive: true });
  const router = fakeRouter();
  await assert.rejects(runComparison({ ...base, router, getRecord: async () => null, saveDir: join(repo, 'out') }), { code: 'SAVE_DIR_REFUSED' });
  assert.equal(router.attempts.length, 0);
});

test('saveDir under catalog/ or docs/ or with a .git segment is refused', async t => {
  const { base, root } = await setup(t);
  const router = fakeRouter();
  for (const p of [join(root, 'catalog', 'out'), join(root, 'docs', 'out'), join(root, '.git', 'out')]) {
    await assert.rejects(runComparison({ ...base, router, getRecord: async () => null, saveDir: p }), { code: 'SAVE_DIR_REFUSED' });
  }
  assert.equal(router.attempts.length, 0);
  assert.doesNotThrow(() => assertSaveDirAllowed(join(root, 'ok')));
});

test('getRecord is required', async t => {
  const { base, saveDir } = await setup(t);
  await assert.rejects(runComparison({ ...base, router: fakeRouter(), saveDir }), TypeError);
});
