// Round-robin: plan shape, the uncertainty fence, thread continuity, the budget, and the adapters.
// The fake router mirrors main's contract: ask() creates the journal record (state 'accepted', submitted 'no')
// BEFORE it returns, and wait() ends on the terminal status. That ordering is what makes "no record" and
// "submitted === 'no'" proofs that nothing was ever dispatched.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { seededOrder, planRoundRobin, turnPrompt, runRoundRobin, createFileStore, createJournalReader, defaultStorePath, providerOf } from '../../src/agents/roundrobin.mjs';
import { roundrobinCommand } from '../../src/agents/cli.mjs';

const M = ['chatgpt:gpt-6', 'gemini:gemini-3-pro'];

// One fake world: router, journal and store, all backed by the same record map.
function fakeWorld({ waitStatus = () => 'complete', threadFor = (n) => `https://chat.example/t/${n}`, readBack = null } = {}) {
  const records = new Map(); // requestId -> { provider, threadUrl, submitted, state, prompt }
  const calls = [];
  const readbacks = [];
  let inFlight = 0;
  let maxInFlight = 0;
  const router = {
    calls,
    async ask({ provider, threadUrl, prompt, requestId }) {
      // main: journal.create() happens inside router.ask before anything can be typed; a duplicate id throws.
      if (records.has(requestId)) throw new Error('Request already exists');
      records.set(requestId, { provider, prompt, submitted: 'no', state: 'accepted', threadUrl: threadUrl === 'new' ? null : threadUrl });
      calls.push({ provider, threadUrl, prompt, requestId });
      inFlight++; maxInFlight = Math.max(maxInFlight, inFlight);
      return { requestId, status: 'pending_approval' };
    },
    async wait(id) {
      inFlight--;
      const rec = records.get(id);
      const status = waitStatus(rec, id);
      if (status === 'complete') {
        // main journals the dispatch as unknown first, then the observation as yes with the thread URL.
        Object.assign(rec, { submitted: 'yes', state: 'observed', threadUrl: rec.threadUrl ?? threadFor(calls.length) });
        return { requestId: id, status, reply: `reply from ${rec.provider}` };
      }
      Object.assign(rec, { submitted: status === 'uncertain' ? 'unknown' : 'no', state: status });
      return { requestId: id, status };
    },
  };
  const journal = async (id) => {
    const r = records.get(id);
    return r ? { submitted: r.submitted, threadUrl: r.threadUrl ?? null, state: r.state } : null;
  };
  const read = readBack ?? (async ({ provider, threadUrl }) => { readbacks.push({ provider, threadUrl }); return { complete: true, text: `recovered for ${provider}` }; });
  return { router, journal, readBack: read, records, calls, readbacks, maxInFlight: () => maxInFlight };
}

function memStore(initial = null) {
  let saved = initial ? structuredClone(initial) : null;
  return {
    async load() { return saved ? structuredClone(saved) : null; },
    async save(state) { saved = structuredClone(state); },
    peek() { return saved; },
  };
}

const ids = () => { let n = 0; return () => `req-${++n}`; };
const seq = (prefix) => { let n = 0; return () => `${prefix}-${++n}`; };

test('seededOrder is deterministic per seed and keeps the given order without a seed', () => {
  assert.deepEqual(seededOrder(M, ''), M);
  assert.deepEqual(seededOrder(M), M);
  const four = ['a:a', 'b:b', 'c:c', 'd:d'];
  assert.deepEqual(seededOrder(four, 'same-seed'), seededOrder(four, 'same-seed'));
  assert.deepEqual([...seededOrder(four, 'x')].sort(), [...four].sort()); // a permutation, nothing lost
  assert.deepEqual(seededOrder(four, 0), seededOrder(four, '0')); // the seed is stringified
  assert.deepEqual(seededOrder(four, 'a'), seededOrder(four, 'a'));
});

test('planRoundRobin builds a round-major turn list with a 16-hex digest', () => {
  const plan = planRoundRobin({ task: 'Why is the sky blue?', members: M, rounds: 2 });
  assert.equal(plan.pattern, 'roundrobin');
  assert.deepEqual(plan.turns.map((t) => [t.i, t.round, t.slot, t.member]), [
    [0, 1, 0, M[0]], [1, 1, 1, M[1]], [2, 2, 0, M[0]], [3, 2, 1, M[1]],
  ]);
  assert.equal(plan.budget.maxSends, 4);
  assert.match(plan.digest, /^[0-9a-f]{16}$/);
  assert.equal(planRoundRobin({ task: 'Why is the sky blue?', members: M, rounds: 2 }).digest, plan.digest); // stable
  assert.notEqual(planRoundRobin({ task: 'other task', members: M, rounds: 2 }).digest, plan.digest);
  assert.notEqual(planRoundRobin({ task: 'Why is the sky blue?', members: M, rounds: 3 }).digest, plan.digest);
  // A seed changes the order and therefore the digest.
  const seeded = planRoundRobin({ task: 'Why is the sky blue?', members: M, rounds: 2, seed: 'abc' });
  assert.notEqual(seeded.digest, plan.digest);
  assert.deepEqual([...seeded.members].sort(), [...M].sort());
});

test('planRoundRobin rejects bad tasks, members, rounds, duplicate models and budgets', () => {
  const base = { task: 't', members: M };
  assert.throws(() => planRoundRobin({ ...base, task: '' }), { code: 'SWARM_INVALID' });
  assert.throws(() => planRoundRobin({ ...base, task: 'x'.repeat(10001) }), { code: 'SWARM_INVALID' });
  assert.throws(() => planRoundRobin({ ...base, members: ['chatgpt:gpt-6'] }), { code: 'SWARM_INVALID' });
  assert.throws(() => planRoundRobin({ ...base, members: ['a:a', 'b:b', 'c:c', 'd:d', 'e:e', 'f:f', 'g:g'] }), { code: 'SWARM_INVALID' });
  assert.throws(() => planRoundRobin({ ...base, members: ['chatgpt:gpt-6', 'nope'] }), { code: 'SWARM_INVALID' });
  assert.throws(() => planRoundRobin({ ...base, members: ['auto:gpt-6', 'gemini:pro'] }), { code: 'SWARM_INVALID' });
  // Two members with the same provider:model would be one site model taking two voices, and they would share a
  // thread, so the plan is refused.
  assert.throws(() => planRoundRobin({ ...base, members: ['chatgpt:gpt-6', 'chatgpt:gpt-6'] }), { code: 'SWARM_INVALID' });
  assert.throws(() => planRoundRobin({ ...base, members: ['chatgpt:gpt-6', 'chatgpt:gpt-6@high'] }), { code: 'SWARM_INVALID' });
  assert.throws(() => planRoundRobin({ ...base, rounds: 0 }), { code: 'SWARM_INVALID' });
  assert.throws(() => planRoundRobin({ ...base, rounds: 7 }), { code: 'SWARM_INVALID' });
  assert.throws(() => planRoundRobin({ ...base, rounds: 1.5 }), { code: 'SWARM_INVALID' });
  assert.throws(() => planRoundRobin({ ...base, budget: { maxSends: 0 } }), { code: 'SWARM_BUDGET' });
  assert.throws(() => planRoundRobin({ ...base, budget: { maxSends: 13 } }), { code: 'SWARM_BUDGET' });
  // 6 members x 6 rounds is 36 turns; the default budget caps at the harness hard cap, so this cannot be planned.
  assert.throws(() => planRoundRobin({ task: 't', members: ['a:a', 'b:b', 'c:c', 'd:d', 'e:e', 'f:f'], rounds: 6 }), { code: 'SWARM_BUDGET' });
});

test('turnPrompt fences the task and the transcript and marks the final turn', () => {
  const plan = planRoundRobin({ task: 'Task with ``` inside', members: M, rounds: 1 });
  const p0 = turnPrompt(plan, plan.turns[0], []);
  assert.match(p0, /\(none yet - you go first\)/);
  assert.doesNotMatch(p0, /as the FINAL answer/);
  assert.match(p0, /````\nTask with ``` inside\n````/); // the fence is longer than the backticks inside
  const p1 = turnPrompt(plan, plan.turns[1], [{ round: 1, member: M[0], reply: 'earlier reply' }]);
  assert.match(p1, /\[round 1, chatgpt:gpt-6\]\n`{3,}\nearlier reply\n`{3,}/);
  assert.match(p1, /as the FINAL answer/);
  assert.ok(!p1.includes(plan.digest)); // the digest is bookkeeping, never prompt text
});

test('providerOf splits provider:model@effort for the read-back primitive', () => {
  assert.equal(providerOf('chatgpt:gpt-6@Extra High'), 'chatgpt');
  assert.equal(providerOf('gemini:gemini-3-pro'), 'gemini');
});

test('a complete run sends in order, keeps one thread per member and returns the final answer', async () => {
  const plan = planRoundRobin({ task: 't', members: M, rounds: 2 });
  const w = fakeWorld();
  const store = memStore();
  const res = await runRoundRobin({ plan, router: w.router, store, journal: w.journal, readBack: w.readBack, newId: ids() });
  assert.equal(res.status, 'complete');
  assert.equal(res.stoppedAt, null);
  assert.equal(res.sends, 4);
  assert.deepEqual(w.calls.map((c) => c.provider), [M[0], M[1], M[0], M[1]]);
  assert.equal(res.final, `reply from ${M[1]}`);
  assert.deepEqual(Object.keys(res.threads).sort(), ['0', '1']);
  assert.equal(w.maxInFlight(), 1); // one turn in flight at a time
  // Round 2 opens on the thread round 1 produced, not on 'new'.
  assert.equal(w.calls[2].threadUrl, w.records.get(w.calls[0].requestId).threadUrl);
  assert.equal(w.calls[2].threadUrl, 'https://chat.example/t/1');
  assert.notEqual(w.calls[2].threadUrl, 'new');
  // A later turn sees the earlier replies in its prompt.
  assert.match(w.calls[1].prompt, /reply from chatgpt:gpt-6/);
  assert.match(w.calls[3].prompt, /reply from chatgpt:gpt-6/);
  assert.match(w.calls[3].prompt, /reply from gemini:gemini-3-pro/);
  // The state file holds the same threads, so a resume continues them.
  assert.deepEqual(store.peek().threads, res.threads);
});

test('a matching plan digest resumes; a mismatched digest refuses without asking', async () => {
  const plan = planRoundRobin({ task: 't', members: M, rounds: 2 });
  const other = planRoundRobin({ task: 'different task', members: M, rounds: 2 });
  const partial = {
    digest: plan.digest, sends: 1, threads: { 0: 'https://chat.example/t/1' },
    turns: [{ i: 0, round: 1, slot: 0, member: M[0], requestId: 'done-1', status: 'complete', reply: 'first answer', threadUrl: 'https://chat.example/t/1' }],
  };
  const ok = fakeWorld();
  const okRes = await runRoundRobin({ plan, router: ok.router, store: memStore(partial), journal: ok.journal, readBack: ok.readBack, newId: ids() });
  assert.equal(okRes.status, 'complete');
  assert.equal(ok.calls.length, 3); // the completed turn is not asked again
  assert.equal(okRes.turns[0].requestId, 'done-1');
  assert.equal(okRes.turns[0].status, 'complete');
  assert.equal(okRes.turns[0].reply, undefined);

  const bad = fakeWorld();
  const badRes = await runRoundRobin({ plan: other, router: bad.router, store: memStore(partial), journal: bad.journal, readBack: bad.readBack, newId: ids() });
  assert.equal(badRes.status, 'mismatch');
  assert.equal(badRes.refused, 'STATE_MISMATCH');
  assert.deepEqual(badRes.turns, []);
  assert.equal(bad.calls.length, 0); // the router is never touched
});

test('resume with submitted:yes and a thread URL reads back and never re-asks that request', async () => {
  const plan = planRoundRobin({ task: 't', members: M, rounds: 1 });
  const w = fakeWorld();
  w.records.set('may-have-landed', { provider: 'chatgpt:gpt-6@high', submitted: 'yes', state: 'observed', threadUrl: 'https://chat.example/t/9' });
  const state = {
    digest: plan.digest, sends: 1, threads: {},
    turns: [{ i: 0, round: 1, slot: 0, member: M[0], requestId: 'may-have-landed', status: 'asking' }],
  };
  const res = await runRoundRobin({ plan, router: w.router, store: memStore(state), journal: w.journal, readBack: w.readBack, newId: ids() });
  assert.equal(res.status, 'complete');
  assert.equal(res.turns[0].recovered, true);
  assert.equal(res.turns[0].requestId, 'may-have-landed');
  assert.equal(res.turns[0].status, 'complete');
  assert.deepEqual(w.calls.map((c) => c.requestId), ['req-1']); // only the second member was asked
  assert.equal(res.sends, 2);
  // The read-back primitive gets the provider id only, never the full provider:model@effort reference.
  assert.deepEqual(w.readbacks[0], { provider: 'chatgpt', threadUrl: 'https://chat.example/t/9' });
  assert.equal(res.threads['0'], 'https://chat.example/t/9');
  assert.equal(w.calls[0].threadUrl, 'new'); // member 1 has its own thread; the rescued one belongs to member 0
});

test('resume where the journal says unknown and has no thread URL stops uncertain without sending', async () => {
  const plan = planRoundRobin({ task: 't', members: M, rounds: 1 });
  const w = fakeWorld();
  w.records.set('unknown-1', { provider: M[0], submitted: 'unknown', state: 'dispatching', threadUrl: null });
  const state = {
    digest: plan.digest, sends: 1, threads: {},
    turns: [{ i: 0, round: 1, slot: 0, member: M[0], requestId: 'unknown-1', status: 'asking' }],
  };
  const res = await runRoundRobin({ plan, router: w.router, store: memStore(state), journal: w.journal, readBack: w.readBack, newId: ids() });
  assert.equal(res.status, 'uncertain');
  assert.equal(res.stoppedAt, 0);
  assert.equal(res.turns[0].status, 'uncertain');
  assert.equal(res.final, null);
  assert.equal(w.calls.length, 0); // never resent: it may have been submitted
  assert.equal(w.readbacks.length, 0); // nothing to read back either
});

test('resume where unknown still carries a thread URL reads back instead of sending', async () => {
  const plan = planRoundRobin({ task: 't', members: M, rounds: 1 });
  const w = fakeWorld();
  w.records.set('unknown-2', { provider: M[0], submitted: 'unknown', state: 'dispatching', threadUrl: 'https://chat.example/t/7' });
  const state = {
    digest: plan.digest, sends: 1, threads: {},
    turns: [{ i: 0, round: 1, slot: 0, member: M[0], requestId: 'unknown-2', status: 'asking' }],
  };
  const res = await runRoundRobin({ plan, router: w.router, store: memStore(state), journal: w.journal, readBack: w.readBack, newId: ids() });
  assert.equal(res.status, 'complete');
  assert.equal(res.turns[0].recovered, true);
  assert.deepEqual(w.calls.map((c) => c.requestId), ['req-1']); // only the second member
  assert.equal(w.readbacks.length, 1);
  assert.deepEqual(w.readbacks[0], { provider: 'chatgpt', threadUrl: 'https://chat.example/t/7' });
});

test('resume where the journal says submitted:no or has no record resends under a NEW requestId', async () => {
  // The journal record is created inside router.ask before anything can be typed, and the dispatch only happens
  // after the record was marked submitted:'unknown'. A record that still says 'no', and a record that does not
  // exist at all, both prove that nothing was ever dispatched.
  const plan = planRoundRobin({ task: 't', members: M, rounds: 1, budget: { maxSends: 3 } });
  for (const variant of ['explicit-no', 'no-record']) {
    const w = fakeWorld();
    if (variant === 'explicit-no') w.records.set('old-1', { provider: M[0], submitted: 'no', state: 'blocked', threadUrl: null });
    const state = {
      digest: plan.digest, sends: 1, threads: {},
      turns: [{ i: 0, round: 1, slot: 0, member: M[0], requestId: 'old-1', status: 'asking' }],
    };
    const res = await runRoundRobin({ plan, router: w.router, store: memStore(state), journal: w.journal, readBack: w.readBack, newId: seq('fresh') });
    assert.equal(res.status, 'complete', variant);
    assert.deepEqual(w.calls.map((c) => c.requestId), ['fresh-1', 'fresh-2'], variant); // never re-ask 'old-1'
    assert.equal(res.turns[0].requestId, 'fresh-1', variant);
    assert.equal(res.turns[0].status, 'complete', variant);
    assert.equal(res.sends, 3, variant); // the retry is a new send and counts against the budget
  }
});

test('a repeated id is never reused for a second send', async () => {
  const plan = planRoundRobin({ task: 't', members: M, rounds: 1 });
  const w = fakeWorld();
  const queue = ['same-id', 'same-id', 'unique-2'];
  let k = 0;
  const res = await runRoundRobin({ plan, router: w.router, store: memStore(), journal: w.journal, readBack: w.readBack, newId: () => queue[Math.min(k++, queue.length - 1)] });
  assert.equal(res.status, 'complete');
  assert.deepEqual(w.calls.map((c) => c.requestId), ['same-id', 'unique-2']);
});

test('ask/wait throwing marks the turn uncertain and stops the run', async () => {
  const plan = planRoundRobin({ task: 't', members: M, rounds: 2 });
  const w = fakeWorld();
  const boom = { ...w.router, async wait() { throw new Error('browser vanished'); } };
  const res = await runRoundRobin({ plan, router: boom, store: memStore(), journal: w.journal, readBack: w.readBack, newId: ids() });
  assert.equal(res.status, 'uncertain');
  assert.equal(res.stoppedAt, 0);
  assert.equal(res.turns[0].status, 'uncertain');
  assert.equal(w.calls.length, 1);
});

test('a read-back that is not complete stops the run uncertain', async () => {
  const plan = planRoundRobin({ task: 't', members: M, rounds: 1 });
  const w = fakeWorld();
  w.records.set('landed', { provider: M[0], submitted: 'yes', state: 'observed', threadUrl: 'https://chat.example/t/5' });
  const state = {
    digest: plan.digest, sends: 1, threads: {},
    turns: [{ i: 0, round: 1, slot: 0, member: M[0], requestId: 'landed', status: 'asking' }],
  };
  const res = await runRoundRobin({
    plan, router: w.router, store: memStore(state), journal: w.journal, newId: ids(),
    readBack: async () => ({ complete: false, text: '' }),
  });
  assert.equal(res.status, 'uncertain');
  assert.equal(res.stoppedAt, 0);
  assert.equal(w.calls.length, 0);
});

test('the send budget stops the run with status budget', async () => {
  // Plan-time budgeting refuses an underfunded plan, so the reachable case is a resume whose earlier sends
  // already consumed the budget: one turn completed, its send counted, and nothing left for the rest.
  const plan = planRoundRobin({ task: 't', members: M, rounds: 1 });
  const w = fakeWorld();
  const state = {
    digest: plan.digest, sends: 2, threads: {},
    turns: [{ i: 0, round: 1, slot: 0, member: M[0], requestId: 'done-1', status: 'complete', reply: 'done' }],
  };
  const res = await runRoundRobin({ plan, router: w.router, store: memStore(state), journal: w.journal, readBack: w.readBack, newId: ids() });
  assert.equal(res.status, 'budget');
  assert.equal(res.stoppedAt, 1);
  assert.equal(res.sends, 2);
  assert.equal(w.calls.length, 0);
  assert.equal(res.final, null);
});

test('runRoundRobin refuses an incomplete plan or missing collaborators', async () => {
  const plan = planRoundRobin({ task: 't', members: M, rounds: 1 });
  const w = fakeWorld();
  await assert.rejects(() => runRoundRobin({ plan: { ...plan, turns: [] }, router: w.router, store: memStore(), journal: w.journal, readBack: w.readBack }), { code: 'SWARM_INVALID' });
  await assert.rejects(() => runRoundRobin({ plan, router: w.router, store: memStore(), journal: w.journal }), { code: 'SWARM_INVALID' });
  await assert.rejects(() => runRoundRobin({ plan, router: w.router, store: {}, journal: w.journal, readBack: w.readBack }), { code: 'SWARM_INVALID' });
  await assert.rejects(() => runRoundRobin({ plan, router: w.router, store: memStore(), journal: w.journal, readBack: w.readBack, newId: 'nope' }), { code: 'SWARM_INVALID' });
});

test('createFileStore round-trips state atomically and reports a missing file as null', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'roundrobin-'));
  const path = join(dir, 'nested', 'plan.json');
  const store = createFileStore({ path });
  assert.equal(await store.load(), null);
  await store.save({ digest: 'abc', sends: 1, threads: {}, turns: [] });
  assert.deepEqual(await store.load(), { digest: 'abc', sends: 1, threads: {}, turns: [] });
  assert.match(await readFile(path, 'utf8'), /"digest": "abc"/);
  await store.save({ digest: 'abc', sends: 2, threads: { 0: 'https://chat.example/t/1' }, turns: [] });
  assert.equal((await store.load()).sends, 2);
  assert.match(defaultStorePath('abc'), /runtime[\\/]roundrobin[\\/]abc\.json$/);
});

test('createJournalReader maps a record to the fence fields and returns null when absent', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'roundrobin-journal-'));
  const read = createJournalReader({ dir });
  assert.equal(await read('missing-1'), null);
  // A record shaped like main's journal (written by the harness's own journal module, read-only here).
  const { createJournal } = await import('../../src/core/journal.mjs');
  const journal = createJournal({ dir });
  await journal.create({ requestId: 'r1', provider: 'chatgpt', threadKey: 'chatgpt:new', payloadDigest: 'd' });
  assert.deepEqual(await read('r1'), { submitted: 'no', threadUrl: null, state: 'accepted' });
  await journal.update('r1', { state: 'observed', submitted: 'yes', threadUrl: 'https://chat.example/t/1' });
  assert.deepEqual(await read('r1'), { submitted: 'yes', threadUrl: 'https://chat.example/t/1', state: 'observed' });
  await assert.rejects(() => read('bad id/../../etc'), /Invalid requestId/);
});

test('the CLI dry run prints the plan and never touches the router', async () => {
  const printed = [];
  const res = await roundrobinCommand(['--task', 't', '--members', 'chatgpt:gpt-6,gemini:gemini-3-pro', '--rounds', '2', '--dry-run'], { out: (s) => printed.push(s) });
  assert.equal(res.dryRun, true);
  assert.equal(res.sends, 0);
  assert.equal(res.plan.turns.length, 4);
  assert.match(res.plan.digest, /^[0-9a-f]{16}$/);
  assert.equal(printed.length, 1);
  assert.equal(JSON.parse(printed[0]).plan.digest, res.plan.digest);
  await assert.rejects(() => roundrobinCommand(['--members', 'a:a,b:b'], { out: () => {} }), { code: 'CLI_USAGE' });
});
