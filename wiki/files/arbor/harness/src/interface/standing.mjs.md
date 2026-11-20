# File: harness/src/interface/standing.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/interface/standing.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7023 B |
| Lines | 119 |
| Hash | 6b507cd49662 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| harness | const | 13 | no | const harness = fileURLToPath(new URL(&#39;../../&#39;, import.meta.url)); |
| LAB_PROFILE | const | 14 | no | const LAB_PROFILE = resolve(harness, &#39;..&#39;, &#39;runtime&#39;, &#39;chrome-profile&#39;); |
| OWNER_PROFILE_LITERAL | const | 15 | no | const OWNER_PROFILE_LITERAL = &#39;C:\\\\VIVIM\\\\chrome-profile&#39;; |
| HOUR | const | 16 | no | const HOUR = 3600000; |
| MAX_PROMPT | const | 17 | no | const MAX_PROMPT = 2000; |
| MAX_THREADS | const | 18 | no | const MAX_THREADS = 10; |
| coded | function | 20 | no | const coded = (code, message) =&gt; Object.assign(new Error(message), { code }); |
| deny | function | 21 | no | const deny = reason =&gt; ({ ok: false, reason }); |
| isLabCommandLine | function | 24 | yes | export function isLabCommandLine(commandLine, labProfile = LAB_PROFILE) { |
| line | const | 25 | no | const line = String(commandLine \|\| &#39;&#39;).toLowerCase(); |
| lab | const | 27 | no | const lab = resolve(labProfile).toLowerCase().replace(/[.*+?^${}()\|[\\]\\\\]/g, &#39;\\\\$&amp;&#39;); |
| LISTENER_SCRIPT | const | 32 | no | const LISTENER_SCRIPT = &quot;$c = Get-NetTCPConnection -State Listen -LocalPort 9333 -ErrorAction SilentlyContinue \| Where-Object { $_.LocalAddress -eq &#39;127.0.0.1&#39; } \| Select-Object -First 1; if ($c) { (… |
| parseSsListenerPid | function | 34 | yes | export function parseSsListenerPid(out, port = 9333) { |
| cols | const | 36 | no | const cols = line.trim().split(/\\s+/); |
| m | const | 38 | no | const m = line.match(/pid=(\\d+)/); |
| linuxListenerCommandLine | function | 43 | yes | export async function linuxListenerCommandLine({ run = (cmd, args) =&gt; execFileSync(cmd, args, { encoding: &#39;utf8&#39;, timeout: 20000 }), readCmdline = pid =&gt; readFileSync(`/proc/${pid}/cmdline`, &#39;utf8&#39;) … |
| pid | const | 44 | no | const pid = parseSsListenerPid(run(&#39;ss&#39;, [&#39;-ltnpH&#39;])); |
| defaultVerifyLabProfile | function | 48 | yes | export async function defaultVerifyLabProfile() { |
| out | const | 53 | no | const out = execFileSync(&#39;powershell.exe&#39;, [&#39;-NoProfile&#39;, &#39;-Command&#39;, LISTENER_SCRIPT], { encoding: &#39;utf8&#39;, timeout: 20000, windowsHide: true }); |
| writeAtomic | function | 58 | no | async function writeAtomic(file, data) { |
| tmp | const | 60 | no | const tmp = `${file}.${randomUUID()}.tmp`; |
| createStanding | function | 65 | yes | export function createStanding({ dir, now = Date.now, verifyLabProfile = defaultVerifyLabProfile, env = process.env } = {}) { |
| file | const | 66 | no | const file = join(dir, &#39;standing.json&#39;); |
| read | function | 68 | no | async function read() { |
| active | const | 71 | no | const active = (r, t = now()) =&gt; !!r &amp;&amp; (r.expiresAt === null \|\| t &lt; r.expiresAt) &amp;&amp; (r.maxSends === null \|\| r.sent &lt; r.maxSends); |
| unlimitedHours | const | 77 | no | const unlimitedHours = hours === null; |
| unlimitedMax | const | 78 | no | const unlimitedMax = maxSends === null; |
| url | variable | 83 | no | let url = null; try { url = new URL(thread); } catch { url = null; } |
| createdAt | const | 86 | no | const createdAt = now(); |
| r | const | 99 | no | const r = await read(); |
| verified | variable | 106 | no | let verified = false; |
| r | const | 112 | no | const r = await read(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs/promises | import | 1 | external |
| node:path | import | 2 | external |
| node:crypto | import | 3 | external |
| node:child_process | import | 4 | external |
| node:fs | import | 5 | external |
| node:url | import | 6 | external |
| ./dev-auto-approve.mjs | import | 7 | [harness/src/interface/dev-auto-approve.mjs](./dev-auto-approve.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/bin/wh.mjs](../../bin/wh.mjs.md) | ../src/interface/standing.mjs |
| [harness/src/interface/router.mjs](./router.mjs.md) | ./standing.mjs |
| [harness/src/interface/target.mjs](./target.mjs.md) | ./standing.mjs |
| [harness/test/interface/dev-auto-approve.test.mjs](../../test/interface/dev-auto-approve.test.mjs.md) | ../../src/interface/standing.mjs |
| [harness/test/interface/linux-checks.test.mjs](../../test/interface/linux-checks.test.mjs.md) | ../../src/interface/standing.mjs |
| [harness/test/interface/standing-unlimited.test.mjs](../../test/interface/standing-unlimited.test.mjs.md) | ../../src/interface/standing.mjs |
| [harness/test/interface/standing.test.mjs](../../test/interface/standing.test.mjs.md) | ../../src/interface/standing.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { devAutoApprove } from './dev-auto-approve.mjs';

// Standing approval: one-time, time- and count-limited permission for routine sends on the LAB profile.
// It replaces only the per-request `wh approve` step. sendOnce (draft, binding, no-resend) still runs for every send.
// Records hold no prompts, replies, or tokens.

const harness = fileURLToPath(new URL('../../', import.meta.url));
const LAB_PROFILE = resolve(harness, '..', 'runtime', 'chrome-profile');
const OWNER_PROFILE_LITERAL = 'C:\\VIVIM\\chrome-profile';
const HOUR = 3600000;
const MAX_PROMPT = 2000;
const MAX_THREADS = 10;

const coded = (code, message) => Object.assign(new Error(message), { code });
const deny = reason => ({ ok: false, reason });

// Pure check on a process command line: must use the lab profile and must not reference the owner profile.
export function isLabCommandLine(commandLine, labProfile = LAB_PROFILE) {
  const line = String(commandLine || '').toLowerCase();
  if (line.includes(OWNER_PROFILE_LITERAL.toLowerCase())) return false;
  const lab = resolve(labProfile).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`--user-data-dir=["']?${lab}["']?(\\s|$)`).test(line);
}

// Finds the process listening on 127.0.0.1:9333 and checks its --user-data-dir. Any error -> false.
const LISTENER_SCRIPT = "$c = Get-NetTCPConnection -State Listen -LocalPort 9333 -ErrorAction SilentlyContinue | Where-Object { $_.LocalAddress -eq '127.0.0.1' } | Select-Object -First 1; if ($c) { (Get-CimInstance Win32_Process -Filter ('ProcessId=' + $c.OwningProcess)).CommandLine }";
// Linux: `ss -ltnpH` lists listeners with owning pid; pick the one bound to 127.0.0.1:9333. Pure parser for tests.
export function parseSsListenerPid(out, port = 9333) {
  for (const line of String(out).split(/\r?\n/)) {
    const cols = line.trim().split(/\s+/);
    if (!cols.some(c => c === `127.0.0.1:${port}`)) continue;
    const m = line.match(/pid=(\d+)/);
    if (m) return Number(m[1]);
  }
  return null;
}
export async function linuxListenerCommandLine({ run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', timeout: 20000 }), readCmdline = pid => readFileSync(`/proc/${pid}/cmdline`, 'utf8') } = {}) {
  const pid = parseSsListenerPid(run('ss', ['-ltnpH']));
  if (!pid) return '';
  return readCmdline(pid).split('\0').filter(Boolean).join(' ');
}
export async function defaultVerifyLabProfile() {
  if (process.platform !== 'win32') {
    try { return isLabCommandLine(await linuxListenerCommandLine()); } catch { return false; }
  }
  try {
    const out = execFileSync('powershell.exe', ['-NoProfile', '-Command', LISTENER_SCRIPT], { encoding: 'utf8', timeout: 20000, windowsHide: true });
    return isLabCommandLine(out.trim());
  } catch { return false; }
}

async function writeAtomic(file, data) {
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
  await rename(tmp, file);
}

export function createStanding({ dir, now = Date.now, verifyLabProfile = defaultVerifyLabProfile, env = process.env } = {}) {
  const file = join(dir, 'standing.json');
  // Unreadable or corrupt records are treated as "no standing" (deny by default).
  async function read() {
    try { return JSON.parse(await readFile(file, 'utf8')); } catch { return null; }
  }
  const active = (r, t = now()) => !!r && (r.expiresAt === null || t < r.expiresAt) && (r.maxSends === null || r.sent < r.maxSends);
  return {
    async enable({ provider, hours, maxSends, threads = [], confirmText } = {}) {
      if (typeof provider !== 'string' || !provider.trim()) throw coded('STANDING_BAD_PROVIDER', 'provider must be a non-empty string');
      // The typed confirmation is the human gate; VIVIM_DEV_AUTO_APPROVE=1 waives it for development.
      if (confirmText !== `ENABLE ${provider}` && !devAutoApprove(env)) throw coded('STANDING_CONFIRM_MISMATCH', `Confirmation must be exactly: ENABLE ${provider}`);
      const unlimitedHours = hours === null;
      const unlimitedMax = maxSends === null;
      if (!unlimitedHours && (!Number.isInteger(hours) || hours < 1 || hours > 24)) throw coded('STANDING_BAD_HOURS', 'hours must be an integer from 1 to 24, or null for no time limit');
      if (!unlimitedMax && (!Number.isInteger(maxSends) || maxSends < 1 || maxSends > 20)) throw coded('STANDING_BAD_MAX', 'maxSends must be an integer from 1 to 20, or null for no send limit');
```

_First 80 of 120 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
