# File: studio/src/capture/drive-lease.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/drive-lease.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7761 B |
| Lines | 121 |
| Hash | f68ee812f8e2 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| defaultLeaseRoot | function | 8 | yes | export const defaultLeaseRoot = () =&gt; path.join(process.env.LOCALAPPDATA \|\| os.tmpdir(), &#39;AION&#39;, &#39;drive-leases&#39;); |
| leaseError | function | 9 | no | const leaseError = (code) =&gt; Object.assign(new Error(code), { code, status: 409 }); |
| ownerState | function | 10 | no | function ownerState(pid) { |
| inspectDriveLease | function | 20 | yes | export function inspectDriveLease({ port = 9222, root = defaultLeaseRoot() } = {}) { |
| dir | const | 22 | no | const dir = path.join(root, String(port)), file = path.join(dir, &#39;owner.json&#39;); |
| raw | variable | 23 | no | let raw, ageMs = null, dirId = null; |
| owner | variable | 27 | no | let owner; try { owner = JSON.parse(raw); } catch { return { exists: true, port, ownerFile: &#39;unparseable&#39;, ownerState: &#39;unknown&#39;, ageMs, dirId, reclaimable: true }; } |
| hasPid | const | 29 | no | const hasPid = Number.isInteger(owner?.pid) &amp;&amp; owner.pid &gt; 0, state = hasPid ? ownerState(owner.pid) : &#39;unknown&#39;; |
| state | const | 32 | no | const state = ownerState(owner.pid); |
| recoverDriveLease | function | 35 | yes | export function recoverDriveLease({ port = 9222, root = defaultLeaseRoot(), token, pid } = {}) { |
| first | const | 36 | no | const first = inspectDriveLease({ port, root }); |
| dir | const | 39 | no | const dir = path.join(root, String(port)), marker = path.join(dir, &#39;recovering&#39;); |
| current | const | 42 | no | const current = inspectDriveLease({ port, root }); |
| reclaimStale | function | 54 | no | function reclaimStale(dir, staleGraceMs, port, root) { |
| marker | const | 55 | no | const marker = path.join(dir, &#39;recovering&#39;); |
| reclaimable | function | 56 | no | const reclaimable = () =&gt; { const i = inspectDriveLease({ port, root }); return i.exists ? i : null; }; |
| eligible | function | 57 | no | const eligible = (i) =&gt; i.reclaimable &amp;&amp; (i.ownerFile === &#39;ok&#39; \|\| i.ownerState === &#39;dead&#39; \|\| i.ageMs &gt;= staleGraceMs); |
| first | const | 58 | no | const first = reclaimable(); |
| current | const | 70 | no | const current = reclaimable(); |
| acquireDriveLease | function | 81 | yes | export function acquireDriveLease({ port = 9222, holder, root = defaultLeaseRoot(), staleGraceMs = 2000 } = {}) { |
| dir | const | 83 | no | const dir = path.join(root, String(port)), file = path.join(dir, &#39;owner.json&#39;); |
| busy | function | 85 | no | const busy = () =&gt; { |
| owner | variable | 86 | no | let owner; try { owner = JSON.parse(fs.readFileSync(file, &#39;utf8&#39;)); } catch {} |
| token | const | 98 | no | const token = randomUUID(), metadata = { version: 1, token, pid: process.pid, port, holder, createdAt: new Date().toISOString() }; |
| fd | variable | 99 | no | let fd; |
| released | variable | 110 | no | let released = false; |
| owner | variable | 115 | no | let owner; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 3 | external |
| node:path | import | 4 | external |
| node:os | import | 5 | external |
| node:crypto | import | 6 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/capture/actions.mjs](./actions.mjs.md) | ./drive-lease.mjs |
| [studio/src/capture/conversation-runtime.mjs](./conversation-runtime.mjs.md) | ./drive-lease.mjs |
| [studio/src/capture/thread-turn-journal.mjs](./thread-turn-journal.mjs.md) | ./drive-lease.mjs |
| [studio/src/studio/channels/gemini.mjs](../studio/channels/gemini.mjs.md) | ../../capture/drive-lease.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Host-local exclusion for all foreground drivers, independent of their chosen data directory.
// Only a live owner blocks acquisition: dead-pid and missing/corrupt-owner leases are reclaimed on acquire.
import * as fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';

export const defaultLeaseRoot = () => path.join(process.env.LOCALAPPDATA || os.tmpdir(), 'AION', 'drive-leases');
const leaseError = (code) => Object.assign(new Error(code), { code, status: 409 });
function ownerState(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return 'unknown';
  try { process.kill(pid, 0); return 'alive'; } catch (e) { return e.code === 'ESRCH' ? 'dead' : 'unknown'; }
}
// Owner-file classification so callers (and acquire) know which case a lease dir is in:
//   ownerFile 'ok'          valid owner.json; ownerState alive|dead|unknown from its pid
//   ownerFile 'missing'     directory without owner.json (crashed/never-finished acquire)
//   ownerFile 'unparseable' owner.json is not valid JSON
//   ownerFile 'invalid'     JSON but not a version-1 owner for this port
// `reclaimable` is the single rule acquire uses: only a LIVE (or unprovable pid) owner blocks.
export function inspectDriveLease({ port = 9222, root = defaultLeaseRoot() } = {}) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw leaseError('INVALID_PORT');
  const dir = path.join(root, String(port)), file = path.join(dir, 'owner.json');
  let raw, ageMs = null, dirId = null;
  try { const st = fs.statSync(dir); dirId = `${st.ino}:${st.birthtimeMs}`; const times = [st.mtimeMs]; try { times.push(fs.statSync(file).mtimeMs); } catch {} ageMs = Math.max(0, Date.now() - Math.max(...times)); } catch { return { exists: false, port }; }
  try { raw = fs.readFileSync(file, 'utf8'); }
  catch (e) { return { exists: true, port, ownerFile: 'missing', ownerState: 'unknown', ageMs, dirId, reclaimable: true }; }
  let owner; try { owner = JSON.parse(raw); } catch { return { exists: true, port, ownerFile: 'unparseable', ownerState: 'unknown', ageMs, dirId, reclaimable: true }; }
  if (!owner || typeof owner !== 'object' || owner.version !== 1 || owner.port !== port || typeof owner.token !== 'string' || !owner.token) {
    const hasPid = Number.isInteger(owner?.pid) && owner.pid > 0, state = hasPid ? ownerState(owner.pid) : 'unknown';
    return { exists: true, port, ownerFile: 'invalid', ownerState: state, ageMs, dirId, reclaimable: !hasPid || state === 'dead' };
  }
  const state = ownerState(owner.pid);
  return { exists: true, ...owner, ownerFile: 'ok', ownerState: state, ageMs, dirId, reclaimable: state === 'dead' };
}
export function recoverDriveLease({ port = 9222, root = defaultLeaseRoot(), token, pid } = {}) {
  const first = inspectDriveLease({ port, root });
  if (!first.exists || !token || token !== first.token || pid !== first.pid) throw leaseError('LEASE_RECOVERY_OWNER_MISMATCH');
  if (first.ownerState !== 'dead') throw leaseError('LEASE_RECOVERY_OWNER_NOT_PROVEN_DEAD');
  const dir = path.join(root, String(port)), marker = path.join(dir, 'recovering');
  fs.mkdirSync(marker); // Exclusive recovery attempt; never recursively remove owner directories.
  try {
    const current = inspectDriveLease({ port, root });
    if (current.token !== token || current.pid !== pid || current.ownerState !== 'dead') throw leaseError('LEASE_RECOVERY_OWNER_CHANGED');
    fs.unlinkSync(path.join(dir, 'owner.json'));
  } finally { fs.rmdirSync(marker); }
  fs.rmdirSync(dir);
  return { recovered: true, port, pid };
}

// A directory whose owner is gone is removed under an exclusive `recovering` marker, so two
// concurrent acquirers reclaim at most once. Unreadable/missing owner files are only reclaimed after
// a short grace so a lease that is being written right now is never taken. Returns true when the
// directory is gone (reclaimed by us or someone else) and a fresh mkdir may be attempted.
function reclaimStale(dir, staleGraceMs, port, root) {
  const marker = path.join(dir, 'recovering');
  const reclaimable = () => { const i = inspectDriveLease({ port, root }); return i.exists ? i : null; };
  const eligible = (i) => i.reclaimable && (i.ownerFile === 'ok' || i.ownerState === 'dead' || i.ageMs >= staleGraceMs);
  const first = reclaimable();
  if (!first) return true;
  if (!eligible(first)) return false;
  try { fs.mkdirSync(marker); }
  catch (e) {
    if (e.code === 'ENOENT') return true;
    if (e.code === 'EEXIST') { // a crashed reclaimer must not wedge the port forever
      try { if (Date.now() - fs.statSync(marker).mtimeMs > 30_000) fs.rmdirSync(marker); } catch {}
    }
    return false;
  }
  try {
    const current = reclaimable();
    if (!current) return true;
    // Same directory instance (a racer may have reclaimed and re-created it, mid-write, since `first`).
    // Age was proven on `first`; our own marker has since refreshed the directory mtime.
    if (!current.reclaimable || current.dirId !== first.dirId || current.token !== first.token || current.ownerFile !== first.ownerFile) return false;
    try { fs.unlinkSync(path.join(dir, 'owner.json')); } catch (e) { if (e.code !== 'ENOENT') return false; }
  } finally { try { fs.rmdirSync(marker); } catch {} }
  try { fs.rmdirSync(dir); } catch (e) { return e.code === 'ENOENT'; }
  return true;
}
```

_First 80 of 122 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
