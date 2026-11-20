# File: harness/test/agents/roundrobin.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/agents/roundrobin.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 21673 B |
| Lines | 353 |
| Hash | 939cfd5759af |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| M | const | 13 | no | const M = [&#39;chatgpt:gpt-6&#39;, &#39;gemini:gemini-3-pro&#39;]; |
| fakeWorld | function | 16 | no | function fakeWorld({ waitStatus = () =&gt; &#39;complete&#39;, threadFor = (n) =&gt; `https://chat.example/t/${n}`, readBack = null } = {}) { |
| records | const | 17 | no | const records = new Map(); // requestId -&gt; { provider, threadUrl, submitted, state, prompt } |
| calls | const | 18 | no | const calls = []; |
| readbacks | const | 19 | no | const readbacks = []; |
| inFlight | variable | 20 | no | let inFlight = 0; |
| maxInFlight | variable | 21 | no | let maxInFlight = 0; |
| router | const | 22 | no | const router = { |
| rec | const | 34 | no | const rec = records.get(id); |
| status | const | 35 | no | const status = waitStatus(rec, id); |
| journal | function | 45 | no | const journal = async (id) =&gt; { |
| r | const | 46 | no | const r = records.get(id); |
| read | const | 49 | no | const read = readBack ?? (async ({ provider, threadUrl }) =&gt; { readbacks.push({ provider, threadUrl }); return { complete: true, text: `recovered for ${provider}` }; }); |
| memStore | function | 53 | no | function memStore(initial = null) { |
| saved | variable | 54 | no | let saved = initial ? structuredClone(initial) : null; |
| ids | function | 62 | no | const ids = () =&gt; { let n = 0; return () =&gt; `req-${++n}`; }; |
| seq | function | 63 | no | const seq = (prefix) =&gt; { let n = 0; return () =&gt; `${prefix}-${++n}`; }; |
| four | const | 68 | no | const four = [&#39;a:a&#39;, &#39;b:b&#39;, &#39;c:c&#39;, &#39;d:d&#39;]; |
| plan | const | 76 | no | const plan = planRoundRobin({ task: &#39;Why is the sky blue?&#39;, members: M, rounds: 2 }); |
| seeded | const | 87 | no | const seeded = planRoundRobin({ task: &#39;Why is the sky blue?&#39;, members: M, rounds: 2, seed: &#39;abc&#39; }); |
| base | const | 93 | no | const base = { task: &#39;t&#39;, members: M }; |
| plan | const | 114 | no | const plan = planRoundRobin({ task: &#39;Task with ``` inside&#39;, members: M, rounds: 1 }); |
| p0 | const | 115 | no | const p0 = turnPrompt(plan, plan.turns[0], []); |
| p1 | const | 119 | no | const p1 = turnPrompt(plan, plan.turns[1], [{ round: 1, member: M[0], reply: &#39;earlier reply&#39; }]); |
| plan | const | 131 | no | const plan = planRoundRobin({ task: &#39;t&#39;, members: M, rounds: 2 }); |
| w | const | 132 | no | const w = fakeWorld(); |
| store | const | 133 | no | const store = memStore(); |
| res | const | 134 | no | const res = await runRoundRobin({ plan, router: w.router, store, journal: w.journal, readBack: w.readBack, newId: ids() }); |
| plan | const | 155 | no | const plan = planRoundRobin({ task: &#39;t&#39;, members: M, rounds: 2 }); |
| other | const | 156 | no | const other = planRoundRobin({ task: &#39;different task&#39;, members: M, rounds: 2 }); |
| partial | const | 157 | no | const partial = { |
| ok | const | 161 | no | const ok = fakeWorld(); |
| okRes | const | 162 | no | const okRes = await runRoundRobin({ plan, router: ok.router, store: memStore(partial), journal: ok.journal, readBack: ok.readBack, newId: ids() }); |
| bad | const | 169 | no | const bad = fakeWorld(); |
| badRes | const | 170 | no | const badRes = await runRoundRobin({ plan: other, router: bad.router, store: memStore(partial), journal: bad.journal, readBack: bad.readBack, newId: ids() }); |
| plan | const | 178 | no | const plan = planRoundRobin({ task: &#39;t&#39;, members: M, rounds: 1 }); |
| w | const | 179 | no | const w = fakeWorld(); |
| state | const | 181 | no | const state = { |
| res | const | 185 | no | const res = await runRoundRobin({ plan, router: w.router, store: memStore(state), journal: w.journal, readBack: w.readBack, newId: ids() }); |
| plan | const | 199 | no | const plan = planRoundRobin({ task: &#39;t&#39;, members: M, rounds: 1 }); |
| w | const | 200 | no | const w = fakeWorld(); |
| state | const | 202 | no | const state = { |
| res | const | 206 | no | const res = await runRoundRobin({ plan, router: w.router, store: memStore(state), journal: w.journal, readBack: w.readBack, newId: ids() }); |
| plan | const | 216 | no | const plan = planRoundRobin({ task: &#39;t&#39;, members: M, rounds: 1 }); |
| w | const | 217 | no | const w = fakeWorld(); |
| state | const | 219 | no | const state = { |
| res | const | 223 | no | const res = await runRoundRobin({ plan, router: w.router, store: memStore(state), journal: w.journal, readBack: w.readBack, newId: ids() }); |
| plan | const | 235 | no | const plan = planRoundRobin({ task: &#39;t&#39;, members: M, rounds: 1, budget: { maxSends: 3 } }); |
| w | const | 237 | no | const w = fakeWorld(); |
| state | const | 239 | no | const state = { |
| res | const | 243 | no | const res = await runRoundRobin({ plan, router: w.router, store: memStore(state), journal: w.journal, readBack: w.readBack, newId: seq(&#39;fresh&#39;) }); |
| plan | const | 253 | no | const plan = planRoundRobin({ task: &#39;t&#39;, members: M, rounds: 1 }); |
| w | const | 254 | no | const w = fakeWorld(); |
| queue | const | 255 | no | const queue = [&#39;same-id&#39;, &#39;same-id&#39;, &#39;unique-2&#39;]; |
| k | variable | 256 | no | let k = 0; |
| res | const | 257 | no | const res = await runRoundRobin({ plan, router: w.router, store: memStore(), journal: w.journal, readBack: w.readBack, newId: () =&gt; queue[Math.min(k++, queue.length - 1)] }); |
| plan | const | 263 | no | const plan = planRoundRobin({ task: &#39;t&#39;, members: M, rounds: 2 }); |
| w | const | 264 | no | const w = fakeWorld(); |
| boom | const | 265 | no | const boom = { ...w.router, async wait() { throw new Error(&#39;browser vanished&#39;); } }; |
| res | const | 266 | no | const res = await runRoundRobin({ plan, router: boom, store: memStore(), journal: w.journal, readBack: w.readBack, newId: ids() }); |
| plan | const | 274 | no | const plan = planRoundRobin({ task: &#39;t&#39;, members: M, rounds: 1 }); |
| w | const | 275 | no | const w = fakeWorld(); |
| state | const | 277 | no | const state = { |
| res | const | 281 | no | const res = await runRoundRobin({ plan, router: w.router, store: memStore(state), journal: w.journal, newId: ids(), readBack: async () =&gt; ({ complete: false, text: &#39;&#39; }), }); |
| plan | const | 293 | no | const plan = planRoundRobin({ task: &#39;t&#39;, members: M, rounds: 1 }); |
| w | const | 294 | no | const w = fakeWorld(); |
| state | const | 295 | no | const state = { |
| res | const | 299 | no | const res = await runRoundRobin({ plan, router: w.router, store: memStore(state), journal: w.journal, readBack: w.readBack, newId: ids() }); |
| plan | const | 308 | no | const plan = planRoundRobin({ task: &#39;t&#39;, members: M, rounds: 1 }); |
| w | const | 309 | no | const w = fakeWorld(); |
| dir | const | 317 | no | const dir = await mkdtemp(join(tmpdir(), &#39;roundrobin-&#39;)); |
| path | const | 318 | no | const path = join(dir, &#39;nested&#39;, &#39;plan.json&#39;); |
| store | const | 319 | no | const store = createFileStore({ path }); |
| dir | const | 330 | no | const dir = await mkdtemp(join(tmpdir(), &#39;roundrobin-journal-&#39;)); |
| read | const | 331 | no | const read = createJournalReader({ dir }); |
| journal | const | 335 | no | const journal = createJournal({ dir }); |
| printed | const | 344 | no | const printed = []; |
| res | const | 345 | no | const res = await roundrobinCommand([&#39;--task&#39;, &#39;t&#39;, &#39;--members&#39;, &#39;chatgpt:gpt-6,gemini:gemini-3-pro&#39;, &#39;--rounds&#39;, &#39;2&#39;, &#39;--dry-run&#39;], { out: (s) =&gt; printed.push(s) }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 5 | external |
| node:assert/strict | import | 6 | external |
| node:fs/promises | import | 7 | external |
| node:os | import | 8 | external |
| node:path | import | 9 | external |
| ../../src/agents/roundrobin.mjs | import | 10 | [harness/src/agents/roundrobin.mjs](../../src/agents/roundrobin.mjs.md) |
| ../../src/agents/cli.mjs | import | 11 | [harness/src/agents/cli.mjs](../../src/agents/cli.mjs.md) |
| ../../src/core/journal.mjs | dynamic | 334 | [harness/src/core/journal.mjs](../../src/core/journal.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 354 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
