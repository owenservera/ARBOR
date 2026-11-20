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
  }
  function uncertain(role, lease, reason) {
    return { role, state: 'uncertain', pid: Number.isInteger(lease?.pid) ? lease.pid : null,
      reason: reason || leaseUncertainReason(lease), nextAction: 'owner_restart_or_recover' };
  }
  // Native health feed. The Host injects its existing read-only worker probe
  // (diagnostics.mjs workerHealth). A probe that is absent, throws or reports
  // "unknown" is missing evidence, never a worker failure.
  function nativeEvidence(role, lease) {
    const sources = [];
    if (typeof diagnostics === 'function') {
      let probe = null;
      try { probe = diagnostics(role); } catch { probe = null; }
      if (probe && typeof probe === 'object' && typeof probe.state === 'string') {
        const state = probe.state === 'online' ? 'ok'
          : probe.state === 'stale' ? 'stale'
          : probe.state === 'blocked' ? 'failed' : 'missing';
        sources.push({ state, diagnosticCode: typeof probe.diagnosticCode === 'string' ? probe.diagnosticCode : null,
          observedAt: typeof probe.lastHeartbeatAt === 'string' ? probe.lastHeartbeatAt : null,
          ageMs: Number.isFinite(probe.ageMs) ? probe.ageMs : null, source: 'host-worker-health' });
      } else {
        sources.push({ state: 'missing', diagnosticCode: 'NO_NATIVE_HEALTH_EVIDENCE', source: 'host-worker-health' });
      }
    }
    // An in-process worker's liveness is the Host lease itself; an external
    // heartbeat file from an earlier run must not describe it.
    if (!lease || !lease.inProcess) {
      const hb = readHeartbeatEvidence(role);
      if (hb.state === 'ok') sources.push({ state: 'ok', diagnosticCode: 'HEARTBEAT_CURRENT', observedAt: hb.observedAt, ageMs: hb.ageMs, source: 'worker-heartbeat' });
      else if (hb.state === 'stale') sources.push({ state: 'stale', diagnosticCode: hb.reason, observedAt: hb.observedAt, ageMs: hb.ageMs, source: 'worker-heartbeat' });
      else if (hb.state === 'invalid') sources.push({ state: 'failed', diagnosticCode: hb.reason, observedAt: hb.observedAt ?? null, ageMs: hb.ageMs ?? null, source: 'worker-heartbeat' });
    }
    if (!sources.length) return { state: 'missing', diagnosticCode: 'NO_HEALTH_EVIDENCE', reason: 'No validated worker heartbeat observed' };
    sources.sort((a, b) => EVIDENCE_RANK[b.state] - EVIDENCE_RANK[a.state]);
    const top = sources[0];
    return { state: top.state, diagnosticCode: top.diagnosticCode, observedAt: top.observedAt ?? null,
      ageMs: top.ageMs ?? null, source: top.source };
  }

  return {
    schema: 'vivim.worker-supervisor/1', worldId,
    status(role) {
      validId(role, 'role');
      const lease = readLease(role);
      const evidence = nativeEvidence(role, lease);
      if (!lease) return { role, state: 'not_started', pid: null, evidence };
      if (!processAlive(lease.pid)) {
        // R0 status inspection MUST NOT mutate durable evidence. Preserve a dead
        // process lease for explicit owner-authorized reconciliation/recovery.
        return { role, state: 'uncertain', pid: lease.pid, reason: 'process_ended', nextAction: 'owner_restart_or_recover', evidence };
      }
      if (!leaseValid(role)) return { role, state: 'uncertain', pid: lease.pid, reason: 'lease_expired', nextAction: 'owner_restart_or_recover', evidence };
      // A live lease with a real native fault is reported uncertain so the fault
      // is observable; the lease itself is preserved and nothing is restarted.
      if (evidence.state === 'failed') return { role, state: 'uncertain', pid: lease.pid, reason: 'native_health_failed', nextAction: 'owner_restart_or_recover', evidence };
      if (evidence.state === 'stale') return { role, state: 'uncertain', pid: lease.pid, reason: 'native_health_stale', nextAction: 'owner_restart_or_recover', evidence };
      return { role, state: 'online', pid: lease.pid, startedAt: lease.startedAt, evidence };
    },
    start(role, command, args = []) {
      validId(role, 'role');
      if (procs.has(role)) return { role, state: 'already_running', pid: procs.get(role).child.pid };
      // Verify no existing valid lease before claiming (single instance per role).
      // A stale or uncertain lease is never overwritten by an implicit restart.
      const lease = readLease(role);
      if (lease) {
        if (leaseValid(role)) return { role, state: 'already_running', pid: lease.pid };
        return uncertain(role, lease);
      }
      const child = spawn(command, args, { detached: true, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
      const startedAt = now();
      const record = { role, pid: child.pid, worldId, startedAt, schema: 'vivim.worker-lease/1' };
      try { writeLeaseExclusive(role, record); }
      catch (error) {
        try { child.kill(); } catch {}
        if (error && error.code === 'EEXIST') {
          const raced = readLease(role);
          if (raced && leaseValid(role)) return { role, state: 'already_running', pid: raced.pid };
          return uncertain(role, raced, 'lease_race');
        }
        throw error;
      }
      procs.set(role, { child });
      child.on('exit', () => { procs.delete(role); removeLease(role); });
      child.stdout.on('data', () => {}); // drain; never log provider or message content
      child.stderr.on('data', () => {});
      return { role, state: 'started', pid: child.pid, startedAt };
    },
    stop(role) {
      validId(role, 'role');
      const proc = procs.get(role);
      if (proc) { try { proc.child.kill(); } catch {} procs.delete(role); }
      removeLease(role);
      return { role, state: 'stopped' };
    },
    // Adopt an already-running in-process worker (e.g. the bootstrap command-worker tick
    // loop) under supervisor lease tracking, without spawning a second process.
    takeover(role, pid) {
      validId(role, 'role');
      const existing = procs.get(role);
      if (existing) {
        const lease = readLease(role);
        return { role, state: 'already_running', pid: lease ? lease.pid : (existing.child ? existing.child.pid : pid) };
      }
      const lease = readLease(role);
      if (lease) {
        if (leaseValid(role)) return { role, state: 'already_running', pid: lease.pid };
        // An in-process lease whose recorded owner is provably gone belongs to a
        // previous Host process of the same authority; reclaiming it lets the
        // restarted Host resume. The bridge claim fence is what prevents a
        // duplicate effect, not the lease. External/uncertain leases are never
        // reclaimed implicitly — they require explicit owner recovery.
        if (lease.inProcess !== true || !Number.isInteger(lease.pid) || processAlive(lease.pid)) {
          return uncertain(role, lease);
        }
        try { unlinkSync(leasePath(role)); } catch (error) { if (!error || error.code !== 'ENOENT') throw error; }
      }
      const startedAt = now();
      const record = { role, pid, worldId, startedAt, schema: 'vivim.worker-lease/1', inProcess: true };
      try { writeLeaseExclusive(role, record); }
      catch (error) {
        if (error && error.code === 'EEXIST') {
          const raced = readLease(role);
          if (raced && leaseValid(role)) return { role, state: 'already_running', pid: raced.pid };
          return uncertain(role, raced, 'lease_race');
        }
        throw error;
      }
      procs.set(role, { child: null, inProcess: true });
      return { role, state: 'started', pid, startedAt, inProcess: true };
    },
    // Recovery: mark a stale/uncertain worker as blocked without resending anything.
    // Owner must explicitly re-authorize any new work.
    recover(role) {
      validId(role, 'role');
      const lease = readLease(role);
      if (!lease) return { role, state: 'not_started' };
      removeLease(role);
      return { role, state: 'blocked', reason: 'owner_recovered_no_resend', pid: lease.pid };
    },
    roles() { return [...procs.keys()]; },
    heartbeatOk(role) { return leaseValid(role); }
  };
}
