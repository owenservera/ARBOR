# File: studio/scripts/harness-crash-probe.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/harness-crash-probe.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10894 B |
| Lines | 174 |
| Hash | fd7bf673a901 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| here | const | 26 | no | const here = path.dirname(fileURLToPath(import.meta.url)); |
| dataDir | const | 27 | no | const dataDir = process.argv[2] ?? fs.mkdtempSync(path.join(os.tmpdir(), &#39;harness-crash-probe-&#39;)); |
| runsDir | const | 28 | no | const runsDir = path.join(dataDir, &#39;harness-runs&#39;); |
| sleep | function | 29 | no | const sleep = (ms) =&gt; new Promise((r) =&gt; setTimeout(r, ms)); |
| waitUntil | function | 31 | no | async function waitUntil(fn, what, timeoutMs = 15000) { |
| v | const | 34 | no | const v = fn(); |
| phase | const | 43 | no | const phase = process.env.PROBE_CHILD; |
| executed | function | 44 | no | const executed = () =&gt; fs.appendFileSync(path.join(dataDir, &#39;executor-runs&#39;), `${phase}\\n`); |
| store | const | 45 | no | const store = createHarnessRunStore({ dir: runsDir, toolExecutor: async () =&gt; { executed(); if (phase === &#39;contention&#39;) await waitUntil(() =&gt; fs.existsSync(path.join(dataDir, &#39;release&#39;)), &#39;release ma… |
| run | const | 52 | no | const run = store.create({ task: `probe ${phase}` }); |
| pending | const | 53 | no | const pending = store.step(run.id, { key: &#39;effect-1&#39;, tool: &#39;read&#39;, args: { phase } }).catch((e) =&gt; ({ fencedError: e.code })); |
| out | const | 58 | no | const out = await pending; |
| run | const | 64 | no | const run = store.create({ task: &#39;probe dead pid&#39; }); |
| failures | const | 71 | no | const failures = []; |
| check | function | 72 | no | const check = (name, ok, detail = &#39;&#39;) =&gt; { console.log(`${ok ? &#39;PASS&#39; : &#39;FAIL&#39;} ${name}${detail ? ` — ${detail}` : &#39;&#39;}`); if (!ok) failures.push(name); }; |
| spawnChild | function | 73 | no | const spawnChild = (phase) =&gt; { |
| child | const | 74 | no | const child = spawn(process.execPath, [fileURLToPath(import.meta.url), dataDir], { env: { ...process.env, PROBE_CHILD: phase }, stdio: [&#39;ignore&#39;, &#39;pipe&#39;, &#39;pipe&#39;], windowsHide: true }); |
| handle | const | 76 | no | const handle = { child, phase, out: &#39;&#39;, code: null, exitError: null, |
| awaitJson | function | 82 | no | const awaitJson = async (handle, marker, timeoutMs = 30000) =&gt; waitUntil(() =&gt; { const line = handle.out.split(&#39;\\n&#39;).filter((l) =&gt; l.includes(`&quot;child&quot;:&quot;${marker}&quot;`)).at(-1); return line ? JSON.parse(… |
| line | const | 83 | no | const line = handle.out.split(&#39;\\n&#39;).filter((l) =&gt; l.includes(`&quot;child&quot;:&quot;${marker}&quot;`)).at(-1); |
| readRun | function | 86 | no | const readRun = (id) =&gt; JSON.parse(fs.readFileSync(path.join(runsDir, `${id}.run.json`), &#39;utf8&#39;)); |
| lockPathOf | function | 87 | no | const lockPathOf = (id) =&gt; `${path.join(runsDir, `${id}.run.json`)}.lock`; |
| alive | function | 88 | no | const alive = (pid) =&gt; { try { process.kill(pid, 0); return true; } catch { return false; } }; |
| a | const | 97 | no | const a = spawnChild(&#39;contention&#39;); |
| parent | const | 100 | no | const parent = createHarnessRunStore({ dir: runsDir, toolExecutor: async () =&gt; ({ ok: true }) }); |
| bError | variable | 101 | no | let bError = null; |
| done | const | 106 | no | const done = await awaitJson(a, &#39;contention-done&#39;); |
| replay | const | 109 | no | const replay = await parent.step(runId, { key: &#39;effect-1&#39;, tool: &#39;read&#39;, args: { phase: &#39;contention&#39; } }); |
| c | const | 118 | no | const c = spawnChild(&#39;crash&#39;); |
| lockPath | const | 120 | no | const lockPath = lockPathOf(runId); |
| hadLock | const | 121 | no | const hadLock = fs.existsSync(lockPath); |
| store | const | 124 | no | const store = createHarnessRunStore({ dir: runsDir, toolExecutor: async () =&gt; ({ ok: true }) }); |
| run | const | 125 | no | const run = store.get(runId); |
| retryError | variable | 128 | no | let retryError = null; |
| finishError | variable | 131 | no | let finishError = null; |
| owner | const | 137 | no | const owner = JSON.parse(fs.readFileSync(lockPath, &#39;utf8&#39;)); |
| rec | const | 138 | no | const rec = store.recoverAbandonedLock(runId, { expectedPid: owner.pid }); |
| d | const | 147 | no | const d = spawnChild(&#39;noop&#39;); |
| store | const | 152 | no | const store = createHarnessRunStore({ dir: runsDir, toolExecutor: async () =&gt; ({ ok: true }) }); |
| mismatch | variable | 153 | no | let mismatch = null; |
| stillAlive | variable | 156 | no | let stillAlive = null; |
| live | const | 157 | no | const live = spawn(process.execPath, [&#39;-e&#39;, &#39;setTimeout(() =&gt; {}, 30000)&#39;], { windowsHide: true }); |
| rec | const | 163 | no | const rec = store.recoverAbandonedLock(runId, { expectedPid: pid }); |
| out | const | 165 | no | const out = await store.step(runId, { key: &#39;after-recovery&#39;, tool: &#39;read&#39;, args: {} }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 19 | external |
| node:fs | import | 20 | external |
| node:os | import | 21 | external |
| node:path | import | 22 | external |
| node:url | import | 23 | external |
| ../src/capture/harness-runs.mjs | import | 24 | [studio/src/capture/harness-runs.mjs](../src/capture/harness-runs.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Capture Studio — harness-run store crash / lock / cross-process recovery probe.
//
//   node scripts/harness-crash-probe.mjs [dataDir]
//
// Proves, with REAL child processes (no injected io faults):
//   P1  cross-process same-key contention: while process A's executor runs, a second
//       process sees the durable in_flight reservation and refuses with STEP_UNCERTAIN;
//       after A completes, the recorded outcome replays without re-execution.
//   P2  real SIGKILL mid-executor: after restart the step is still in_flight, the same
//       key is refused with STEP_UNCERTAIN, finish refuses with RUN_HAS_UNRESOLVED_EFFECT,
//       and the executor ran exactly once. No automatic replay, no key replacement.
//   P3  owner-verified stale-lock recovery: recoverAbandonedLock with the verified dead
//       pid releases ONLY the state-write lock; the run stays usable afterwards.
//
// This probe is the standing local test for Windows/NTFS lock and crash semantics too:
// run the same command on the owner machine and keep the console receipt.
// Exit code 0 = every invariant held; 1 = a named invariant failed.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHarnessRunStore } from '../src/capture/harness-runs.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.argv[2] ?? fs.mkdtempSync(path.join(os.tmpdir(), 'harness-crash-probe-'));
const runsDir = path.join(dataDir, 'harness-runs');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitUntil(fn, what, timeoutMs = 15000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    const v = fn();
    if (v) return v;
    await sleep(50);
  }
  throw new Error(`timeout waiting for ${what}`);
}

// Child mode: one phase, one process, real fs, real exit.
if (process.env.PROBE_CHILD) {
  const phase = process.env.PROBE_CHILD;
  const executed = () => fs.appendFileSync(path.join(dataDir, 'executor-runs'), `${phase}\n`);
  const store = createHarnessRunStore({ dir: runsDir, toolExecutor: async () => {
    executed();
    if (phase === 'contention') await waitUntil(() => fs.existsSync(path.join(dataDir, 'release')), 'release marker', 30000);
    if (phase === 'crash') await waitUntil(() => fs.existsSync(path.join(dataDir, 'unreachable')), 'never marker', 30000);
    return { ok: true, phase };
  } });
  if (phase === 'contention' || phase === 'crash') {
    const run = store.create({ task: `probe ${phase}` });
    const pending = store.step(run.id, { key: 'effect-1', tool: 'read', args: { phase } }).catch((e) => ({ fencedError: e.code }));
    await waitUntil(() => { try { return store.get(run.id).steps.some((s) => s.status === 'in_flight'); } catch { return false; } }, 'in_flight claim', 10000);
    await waitUntil(() => fs.existsSync(path.join(dataDir, 'executor-runs')), 'executor entry', 10000);
    console.log(JSON.stringify({ child: phase, runId: run.id, pid: process.pid }));
    if (phase === 'contention') {
      const out = await pending;
      console.log(JSON.stringify({ child: 'contention-done', step: out.step?.status ?? null, fenced: out.fencedError ?? null }));
    }
    if (phase === 'crash') await sleep(60000); // parent SIGKILLs us here; exit code irrelevant
  }
  if (phase === 'noop') {
    const run = store.create({ task: 'probe dead pid' });
    console.log(JSON.stringify({ child: phase, runId: run.id, pid: process.pid }));
  }
  process.exit(0);
}

// Parent mode.
const failures = [];
const check = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`); if (!ok) failures.push(name); };
const spawnChild = (phase) => {
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url), dataDir], {
    env: { ...process.env, PROBE_CHILD: phase }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  const handle = { child, phase, out: '', code: null, exitError: null,
    exited: new Promise((resolve) => child.on('exit', (code) => { handle.code = code; resolve(code); }).on('error', (e) => { handle.exitError = e; resolve(null); })) };
  child.stdout.on('data', (d) => { handle.out += d; });
  child.stderr.on('data', (d) => { handle.out += d; });
  return handle;
```

_First 80 of 175 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
