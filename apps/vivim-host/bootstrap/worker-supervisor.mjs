// VIVIM host worker supervisor v1.
// Single owned instance per worker role with a verified lease (PID file + heartbeat).
// Never auto-restarts uncertain work; a stale lease is marked uncertain, not resent.
// The Host is the sole supervisor: no second controller, no implicit restart.
import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';

const ID = /^[a-z][a-z0-9_-]{0,63}$/;
const LEASE_TTL_MS = 30000;
const HEARTBEAT_DIR = 'health';

function fail(code, reason) { const e = new Error(reason); e.code = code; throw e; }
function validId(s, label) { if (!ID.test(s)) fail('SUPERVISOR_INPUT', `${label} must be a bounded id`); return s; }

export function createWorkerSupervisor({ dataRoot, worldId = 'world-local', now = () => new Date().toISOString() } = {}) {
  if (!dataRoot || typeof dataRoot !== 'string') throw new TypeError('Worker supervisor: dataRoot required');
  const dir = path.join(dataRoot, 'bridge', 'supervisor');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const procs = new Map(); // role -> { child }

  function leasePath(role) { return path.join(dir, `${role}.lease.json`); }
  function heartbeatPath(role) { return path.join(dataRoot, 'bridge', HEARTBEAT_DIR, `${role}.json`); }

  function readLease(role) {
    try { return JSON.parse(readFileSync(leasePath(role), 'utf8')); } catch { return null; }
  }
  function writeLease(role, lease) { writeFileSync(leasePath(role), JSON.stringify(lease, null, 2) + '\n', { mode: 0o600 }); }
  function removeLease(role) { try { unlinkSync(leasePath(role)); } catch {} }

  function processAlive(pid) {
    try { process.kill(pid, 0); return true; } catch { return false; }
  }
  function readHeartbeat(role) {
    try { return JSON.parse(readFileSync(heartbeatPath(role), 'utf8')); } catch { return null; }
  }
  // A lease is valid only when the process is alive AND (for externally-spawned workers)
  // a recent heartbeat exists. Any doubt resolves to "uncertain" — never an implicit
  // restart or resend.
  function leaseValid(role) {
    const lease = readLease(role);
    if (!lease || !Number.isInteger(lease.pid) || lease.pid <= 0 || lease.role !== role || lease.worldId !== worldId) return false;
    if (!processAlive(lease.pid)) return false;
    if (lease.inProcess) return true;
    const hb = readHeartbeat(role);
    if (!hb || !Number.isInteger(hb.pid) || hb.pid !== lease.pid || hb.worker !== role) return false;
    const age = Date.now() - Date.parse(hb.observedAt || 0);
    return age <= LEASE_TTL_MS;
  }

  return {
    schema: 'vivim.worker-supervisor/1', worldId,
    status(role) {
      validId(role, 'role');
      const lease = readLease(role);
      if (!lease) return { role, state: 'not_started', pid: null };
      if (!processAlive(lease.pid)) {
        // R0 status inspection MUST NOT mutate durable evidence. Preserve a dead
        // process lease for explicit owner-authorized reconciliation/recovery.
        return { role, state: 'uncertain', pid: lease.pid, reason: 'process_ended', nextAction: 'owner_restart_or_recover' };
      }
      if (!leaseValid(role)) return { role, state: 'uncertain', pid: lease.pid, reason: 'lease_expired', nextAction: 'owner_restart_or_recover' };
      return { role, state: 'online', pid: lease.pid, startedAt: lease.startedAt };
    },
    start(role, command, args = []) {
      validId(role, 'role');
      if (procs.has(role)) return { role, state: 'already_running', pid: procs.get(role).child.pid };
      // Verify no existing valid lease before claiming (single instance per role).
      if (leaseValid(role)) return { role, state: 'already_running', pid: readLease(role).pid };
      const child = spawn(command, args, { detached: true, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
      const startedAt = now();
      const lease = { role, pid: child.pid, worldId, startedAt, schema: 'vivim.worker-lease/1' };
      writeLease(role, lease);
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
      if (leaseValid(role)) return { role, state: 'already_running', pid: readLease(role).pid };
      const startedAt = now();
      const lease = { role, pid, worldId, startedAt, schema: 'vivim.worker-lease/1', inProcess: true };
      writeLease(role, lease);
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
