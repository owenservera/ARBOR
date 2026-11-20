# File: apps/vivim-host/bootstrap/worker-supervisor.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/bootstrap/worker-supervisor.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12851 B |
| Lines | 223 |
| Hash | 2ec3e5ff951b |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ID | const | 9 | no | const ID = /^[a-z][a-z0-9_-]{0,63}$/; |
| LEASE_TTL_MS | const | 10 | no | const LEASE_TTL_MS = 30000; |
| HEARTBEAT_DIR | const | 11 | no | const HEARTBEAT_DIR = &#39;health&#39;; |
| EVIDENCE_RANK | const | 14 | no | const EVIDENCE_RANK = { failed: 3, stale: 2, ok: 1, missing: 0 }; |
| fail | function | 16 | no | function fail(code, reason) { const e = new Error(reason); e.code = code; throw e; } |
| validId | function | 17 | no | function validId(s, label) { if (!ID.test(s)) fail(&#39;SUPERVISOR_INPUT&#39;, `${label} must be a bounded id`); return s; } |
| createWorkerSupervisor | function | 19 | yes | export function createWorkerSupervisor({ dataRoot, worldId = &#39;world-local&#39;, now = () =&gt; new Date().toISOString(), diagnostics = null } = {}) { |
| dir | const | 22 | no | const dir = path.join(dataRoot, &#39;bridge&#39;, &#39;supervisor&#39;); |
| procs | const | 24 | no | const procs = new Map(); // role -&gt; { child } |
| leasePath | function | 26 | no | function leasePath(role) { return path.join(dir, `${role}.lease.json`); } |
| heartbeatPath | function | 27 | no | function heartbeatPath(role) { return path.join(dataRoot, &#39;bridge&#39;, HEARTBEAT_DIR, `${role}.json`); } |
| readLease | function | 29 | no | function readLease(role) { |
| writeLeaseExclusive | function | 34 | no | function writeLeaseExclusive(role, lease) { |
| fd | const | 35 | no | const fd = openSync(leasePath(role), &#39;wx&#39;, 0o600); |
| removeLease | function | 39 | no | function removeLease(role) { try { unlinkSync(leasePath(role)); } catch {} } |
| processAlive | function | 41 | no | function processAlive(pid) { |
| readHeartbeatEvidence | function | 47 | no | function readHeartbeatEvidence(role) { |
| raw | variable | 48 | no | let raw; |
| hb | variable | 54 | no | let hb; |
| observedMs | const | 59 | no | const observedMs = typeof hb.observedAt === &#39;string&#39; ? Date.parse(hb.observedAt) : NaN; |
| ageMs | const | 61 | no | const ageMs = Date.now() - observedMs; |
| leaseUncertainReason | function | 66 | no | function leaseUncertainReason(lease) { |
| leaseValid | function | 74 | no | function leaseValid(role) { |
| lease | const | 75 | no | const lease = readLease(role); |
| hb | const | 79 | no | const hb = readHeartbeatEvidence(role); |
| uncertain | function | 82 | no | function uncertain(role, lease, reason) { |
| nativeEvidence | function | 89 | no | function nativeEvidence(role, lease) { |
| sources | const | 90 | no | const sources = []; |
| probe | variable | 92 | no | let probe = null; |
| state | const | 95 | no | const state = probe.state === &#39;online&#39; ? &#39;ok&#39; |
| hb | const | 108 | no | const hb = readHeartbeatEvidence(role); |
| top | const | 115 | no | const top = sources[0]; |
| lease | const | 124 | no | const lease = readLease(role); |
| evidence | const | 125 | no | const evidence = nativeEvidence(role, lease); |
| lease | const | 144 | no | const lease = readLease(role); |
| child | const | 149 | no | const child = spawn(command, args, { detached: true, stdio: [&#39;ignore&#39;, &#39;pipe&#39;, &#39;pipe&#39;], windowsHide: true }); |
| startedAt | const | 150 | no | const startedAt = now(); |
| raced | const | 156 | no | const raced = readLease(role); |
| proc | const | 170 | no | const proc = procs.get(role); |
| existing | const | 179 | no | const existing = procs.get(role); |
| lease | const | 181 | no | const lease = readLease(role); |
| lease | const | 184 | no | const lease = readLease(role); |
| startedAt | const | 197 | no | const startedAt = now(); |
| raced | const | 202 | no | const raced = readLease(role); |
| lease | const | 215 | no | const lease = readLease(role); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 5 | external |
| node:child_process | import | 6 | external |
| node:path | import | 7 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/server.mjs](../server.mjs.md) | ./bootstrap/worker-supervisor.mjs |
| [apps/vivim-host/test/host-worker-lifecycle.test.mjs](../test/host-worker-lifecycle.test.mjs.md) | ../bootstrap/worker-supervisor.mjs |
| [apps/vivim-host/test/worker-route-security.test.mjs](../test/worker-route-security.test.mjs.md) | ../bootstrap/worker-supervisor.mjs |
| [apps/vivim-host/test/worker-supervisor.test.mjs](../test/worker-supervisor.test.mjs.md) | ../bootstrap/worker-supervisor.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VIVIM host worker supervisor v1.
// Single owned instance per worker role with a verified lease (PID file + heartbeat).
// Never auto-restarts uncertain work; a stale lease is marked uncertain, not resent.
// The Host is the sole supervisor: no second controller, no implicit restart.
import { mkdirSync, writeFileSync, readFileSync, unlinkSync, openSync, closeSync, fsyncSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';

const ID = /^[a-z][a-z0-9_-]{0,63}$/;
const LEASE_TTL_MS = 30000;
const HEARTBEAT_DIR = 'health';
// Evidence severity for merging native probes: a real fault outranks staleness,
// which outranks a current sample; absent evidence never outranks a real sample.
const EVIDENCE_RANK = { failed: 3, stale: 2, ok: 1, missing: 0 };

function fail(code, reason) { const e = new Error(reason); e.code = code; throw e; }
function validId(s, label) { if (!ID.test(s)) fail('SUPERVISOR_INPUT', `${label} must be a bounded id`); return s; }

export function createWorkerSupervisor({ dataRoot, worldId = 'world-local', now = () => new Date().toISOString(), diagnostics = null } = {}) {
  if (!dataRoot || typeof dataRoot !== 'string') throw new TypeError('Worker supervisor: dataRoot required');
  if (diagnostics !== null && typeof diagnostics !== 'function') throw new TypeError('Worker supervisor: diagnostics must be a function');
  const dir = path.join(dataRoot, 'bridge', 'supervisor');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const procs = new Map(); // role -> { child }

  function leasePath(role) { return path.join(dir, `${role}.lease.json`); }
  function heartbeatPath(role) { return path.join(dataRoot, 'bridge', HEARTBEAT_DIR, `${role}.json`); }

  function readLease(role) {
    try { return JSON.parse(readFileSync(leasePath(role), 'utf8')); } catch { return null; }
  }
  // Exclusive create is the role/workspace admission point: two Host processes can
  // never both believe they own the same role. EEXIST is reported, never overwritten.
  function writeLeaseExclusive(role, lease) {
    const fd = openSync(leasePath(role), 'wx', 0o600);
    try { writeFileSync(fd, JSON.stringify(lease, null, 2) + '\n'); fsyncSync(fd); }
    finally { closeSync(fd); }
  }
  function removeLease(role) { try { unlinkSync(leasePath(role)); } catch {} }

  function processAlive(pid) {
    try { process.kill(pid, 0); return true; } catch { return false; }
  }
  // Heartbeat evidence is deliberately tri-state. A missing file is missing
  // evidence; a malformed or unreadable file is a failure; a future timestamp is
  // not "fresh" and is rejected like any other invalid sample.
  function readHeartbeatEvidence(role) {
    let raw;
    try { raw = readFileSync(heartbeatPath(role), 'utf8'); }
    catch (error) {
      if (error && error.code === 'ENOENT') return { state: 'missing' };
      return { state: 'invalid', reason: 'HEARTBEAT_UNREADABLE' };
    }
    let hb;
    try { hb = JSON.parse(raw); } catch { return { state: 'invalid', reason: 'HEARTBEAT_PARSE' }; }
    if (!hb || !Number.isInteger(hb.pid) || hb.pid <= 0 || hb.worker !== role) {
      return { state: 'invalid', reason: 'HEARTBEAT_SHAPE' };
    }
    const observedMs = typeof hb.observedAt === 'string' ? Date.parse(hb.observedAt) : NaN;
    if (!Number.isFinite(observedMs)) return { state: 'invalid', reason: 'HEARTBEAT_TIME', pid: hb.pid };
    const ageMs = Date.now() - observedMs;
    if (ageMs < 0) return { state: 'invalid', reason: 'HEARTBEAT_FROM_FUTURE', pid: hb.pid, observedAt: hb.observedAt, ageMs };
    if (ageMs > LEASE_TTL_MS) return { state: 'stale', reason: 'HEARTBEAT_STALE', pid: hb.pid, observedAt: hb.observedAt, ageMs };
    return { state: 'ok', reason: null, pid: hb.pid, observedAt: hb.observedAt, ageMs };
  }
  function leaseUncertainReason(lease) {
    if (!Number.isInteger(lease.pid) || lease.pid <= 0) return 'lease_unverified';
    if (!processAlive(lease.pid)) return 'process_ended';
    return 'lease_expired';
  }
  // A lease is valid only when the process is alive AND (for externally-spawned workers)
  // a recent heartbeat exists. Any doubt resolves to "uncertain" — never an implicit
  // restart or resend.
  function leaseValid(role) {
    const lease = readLease(role);
    if (!lease || !Number.isInteger(lease.pid) || lease.pid <= 0 || lease.role !== role || lease.worldId !== worldId) return false;
    if (!processAlive(lease.pid)) return false;
    if (lease.inProcess) return true;
    const hb = readHeartbeatEvidence(role);
    return hb.state === 'ok' && hb.pid === lease.pid;
```

_First 80 of 224 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
