# File: studio/src/studio/cdp-owner-lock.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/cdp-owner-lock.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9349 B |
| Lines | 177 |
| Hash | e0273022b25a |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| STARTUP_GRACE_MS | const | 19 | no | const STARTUP_GRACE_MS = 30_000; |
| TAKEOVER_STALE_MS | const | 20 | no | const TAKEOVER_STALE_MS = 10_000; // a takeover guard left by a crashed process |
| PARTIAL_GRACE_MS | const | 21 | no | const PARTIAL_GRACE_MS = 5_000; // an unreadable lock younger than this may still be being written |
| RETRY_MS | const | 22 | no | const RETRY_MS = 50; |
| MAX_ATTEMPTS | const | 23 | no | const MAX_ATTEMPTS = 100; // ~5 s of contention before giving up |
| lockPath | function | 25 | yes | export const lockPath = (root, cdpPort) =&gt; path.join(root, &#39;locks&#39;, `cdp-${cdpPort}.json`); |
| sleep | function | 27 | no | const sleep = (ms) =&gt; new Promise((resolve) =&gt; setTimeout(resolve, ms)); |
| validPort | function | 28 | no | const validPort = (p) =&gt; Number.isSafeInteger(p) &amp;&amp; p &gt; 0 &amp;&amp; p &lt; 65536; |
| pidAlive | function | 30 | no | const pidAlive = (pid) =&gt; { |
| accepts | function | 36 | no | const accepts = (port, timeoutMs = 1500) =&gt; new Promise((resolve) =&gt; { const socket = net.connect({ port, host: &#39;127.0.0.1&#39; }); const done = (ok) =&gt; { socket.destroy(); resolve(ok); }; socket.setTime… |
| socket | const | 37 | no | const socket = net.connect({ port, host: &#39;127.0.0.1&#39; }); |
| done | function | 38 | no | const done = (ok) =&gt; { socket.destroy(); resolve(ok); }; |
| readLock | function | 45 | no | function readLock(file) { |
| text | variable | 46 | no | let text; |
| lock | const | 49 | no | const lock = JSON.parse(text); |
| age | variable | 52 | no | let age = Infinity; |
| sameRecord | function | 57 | no | const sameRecord = (a, b) =&gt; !!a &amp;&amp; !!b &amp;&amp; a.pid === b.pid &amp;&amp; a.startedAt === b.startedAt &amp;&amp; a.nonce === b.nonce; |
| ownerUrl | function | 59 | no | const ownerUrl = (owner) =&gt; validPort(owner?.studioPort) ? `http://127.0.0.1:${owner.studioPort}` : null; |
| CdpOwnedError | class | 61 | yes | export class CdpOwnedError extends Error { |
| constructor | method | 62 | yes | constructor(owner, cdpPort) { |
| url | const | 63 | no | const url = ownerUrl(owner); |
| ownerIsLive | function | 73 | no | async function ownerIsLive(lock, { isAlive, probe, now }) { |
| age | const | 76 | no | const age = now() - Date.parse(lock.startedAt ?? &#39;&#39;); |
| assertNoForeignCdpOwner | function | 83 | yes | export async function assertNoForeignCdpOwner(root, cdpPort, { pid = process.pid, isAlive = pidAlive, probe = accepts, now = Date.now } = {}) { |
| unique | function | 89 | no | function unique(file) { return `${file}.${process.pid}.${randomBytes(4).toString(&#39;hex&#39;)}.tmp`; } |
| createExclusive | function | 92 | no | function createExclusive(file, text) { |
| tmp | const | 93 | no | const tmp = unique(file); |
| replaceAtomic | function | 108 | no | function replaceAtomic(file, text) { |
| tmp | const | 109 | no | const tmp = unique(file); |
| withTakeoverGuard | function | 115 | no | function withTakeoverGuard(file, fn) { |
| guard | const | 116 | no | const guard = `${file}.takeover`; |
| acquireCdpOwnerLock | function | 127 | yes | export async function acquireCdpOwnerLock({ root, cdpPort, studioPort, pid = process.pid, isAlive = pidAlive, probe = accepts, now = Date.now }) { |
| file | const | 129 | no | const file = lockPath(root, cdpPort); |
| mineRecord | const | 132 | no | const mineRecord = { schema: &#39;vivim.cdp-owner-lock.v2&#39;, pid, cdpPort, studioPort: validPort(studioPort) ? studioPort : null, |
| serialize | function | 134 | no | const serialize = (r) =&gt; JSON.stringify(r, null, 1); |
| acquired | variable | 135 | no | let acquired = false; |
| seen | const | 138 | no | const seen = readLock(file); |
| removed | const | 146 | no | const removed = withTakeoverGuard(file, () =&gt; { const again = readLock(file); const unchanged = seen.lock ? sameRecord(again.lock, seen.lock) : (!again.lock &amp;&amp; again.age !== null); if (unchanged) { t… |
| again | const | 147 | no | const again = readLock(file); |
| unchanged | const | 148 | no | const unchanged = seen.lock ? sameRecord(again.lock, seen.lock) : (!again.lock &amp;&amp; again.age !== null); |
| released | variable | 156 | no | let released = false; |
| mine | function | 157 | no | const mine = () =&gt; sameRecord(readLock(file).lock, mineRecord); |
| release | function | 158 | no | const release = () =&gt; { |
| next | const | 172 | no | const next = { ...mineRecord, studioPort: port }; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 14 | external |
| node:fs | import | 15 | external |
| node:net | import | 16 | external |
| node:path | import | 17 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/capture.mjs](../../bin/commands/capture.mjs.md) | ../../src/studio/cdp-owner-lock.mjs |
| [studio/src/chrome/launch.mjs](../chrome/launch.mjs.md) | ../studio/cdp-owner-lock.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Machine-wide single-owner lock per CDP port.
//
// Two Studio processes driving the same Chrome kill/relaunch each other's browser and corrupt each
// other's in-flight turns. The first Studio to own a CDP port records `<root>/locks/cdp-<port>.json`;
// any later `serve`/`start` against the same port refuses fast and names the existing owner.
//
// Liveness: a lock is stale (and taken over) when its pid is dead, or when the pid is alive but the
// recorded Studio port refuses connections after the startup grace (pid reuse by an unrelated process;
// Node cannot read another process's start time on Windows without spawning, so the port is the proof).
//
// Races: the lock file is published complete with an atomic hard link (never seen half written), and
// a stale lock is only removed while holding `<lock>.takeover` (exclusive create), after re-reading it
// and confirming it is still the exact record that was judged stale.
import { randomBytes } from 'node:crypto';
import { linkSync, mkdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';

const STARTUP_GRACE_MS = 30_000;
const TAKEOVER_STALE_MS = 10_000; // a takeover guard left by a crashed process
const PARTIAL_GRACE_MS = 5_000; // an unreadable lock younger than this may still be being written
const RETRY_MS = 50;
const MAX_ATTEMPTS = 100; // ~5 s of contention before giving up

export const lockPath = (root, cdpPort) => path.join(root, 'locks', `cdp-${cdpPort}.json`);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const validPort = (p) => Number.isSafeInteger(p) && p > 0 && p < 65536;

const pidAlive = (pid) => {
  if (!Number.isSafeInteger(pid) || pid <= 0) return false;
  // EPERM: the process exists but belongs to another user - still alive.
  try { process.kill(pid, 0); return true; } catch (e) { return e.code !== 'ESRCH'; }
};

const accepts = (port, timeoutMs = 1500) => new Promise((resolve) => {
  const socket = net.connect({ port, host: '127.0.0.1' });
  const done = (ok) => { socket.destroy(); resolve(ok); };
  socket.setTimeout(timeoutMs, () => done(false));
  socket.once('connect', () => done(true));
  socket.once('error', () => done(false));
});

// { lock, age } - lock is null when missing (age null) or unreadable (age = file age in ms).
function readLock(file) {
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { return { lock: null, age: null } }
  try {
    const lock = JSON.parse(text);
    if (lock && typeof lock === 'object' && Number.isSafeInteger(lock.pid)) return { lock, age: 0 };
  } catch { /* fall through */ }
  let age = Infinity;
  try { age = Date.now() - statSync(file).mtimeMs; } catch { return { lock: null, age: null }; }
  return { lock: null, age };
}

const sameRecord = (a, b) => !!a && !!b && a.pid === b.pid && a.startedAt === b.startedAt && a.nonce === b.nonce;

const ownerUrl = (owner) => validPort(owner?.studioPort) ? `http://127.0.0.1:${owner.studioPort}` : null;

export class CdpOwnedError extends Error {
  constructor(owner, cdpPort) {
    const url = ownerUrl(owner);
    super(url
      ? `VIVIM is already running at ${url} - open that window, or close it first. (It is using browser port ${cdpPort}, process ${owner.pid}.)`
      : `VIVIM is already running and using browser port ${cdpPort} (process ${owner.pid}) - use that window, or close it first.`);
    this.name = 'CdpOwnedError';
    this.code = 'CDP_OWNED';
    this.owner = { pid: owner.pid, studioPort: owner.studioPort ?? null, url, startedAt: owner.startedAt ?? null };
  }
}

async function ownerIsLive(lock, { isAlive, probe, now }) {
  if (!isAlive(lock.pid)) return false;
  if (!validPort(lock.studioPort)) return true; // nothing to probe: trust the live pid
  const age = now() - Date.parse(lock.startedAt ?? '');
  if (!(age >= STARTUP_GRACE_MS)) return true; // starting up (or unparseable/future clock): trust the pid
  return probe(lock.studioPort);
}
```

_First 80 of 178 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
