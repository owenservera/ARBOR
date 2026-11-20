# File: harness/src/interface/launch.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/interface/launch.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3829 B |
| Lines | 47 |
| Hash | 551628aec8d1 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| runtime | const | 6 | no | const runtime = resolve(fileURLToPath(new URL(&#39;../../../runtime/&#39;, import.meta.url))); |
| OWNER_PROFILE | const | 9 | yes | export const OWNER_PROFILE = resolve(process.env.CAPTURE_STUDIO_HOME \|\| &#39;C:\\\\VIVIM&#39;, &#39;chrome-profile&#39;); |
| LAB_PROFILE | const | 10 | yes | export const LAB_PROFILE = resolve(runtime, &#39;chrome-profile&#39;); |
| inside | function | 11 | no | const inside = (root, dir) =&gt; { const rel = relative(root, resolve(dir)); return !!rel &amp;&amp; !rel.startsWith(&#39;..&#39;) &amp;&amp; !isAbsolute(rel); }; |
| same | function | 12 | no | const same = (a, b) =&gt; resolve(a).toLowerCase() === resolve(b).toLowerCase(); |
| findChrome | function | 15 | yes | export function findChrome(env = process.env, platform = process.platform, exists = existsSync) { |
| c | const | 17 | no | const c = [env.CHROME_PATH, &#39;/usr/bin/google-chrome&#39;, &#39;/usr/bin/google-chrome-stable&#39;, &#39;/opt/google/chrome/chrome&#39;, &#39;/usr/bin/chromium&#39;, &#39;/usr/bin/chromium-browser&#39;].filter(Boolean); |
| bases | const | 20 | no | const bases = [env.PROGRAMFILES, env[&#39;PROGRAMFILES(X86)&#39;], env.LOCALAPPDATA].filter(Boolean); |
| c | const | 21 | no | const c = [env.CHROME_PATH, ...bases.map(b =&gt; resolve(b, &#39;Google&#39;, &#39;Chrome&#39;, &#39;Application&#39;, &#39;chrome.exe&#39;))].filter(Boolean); |
| buildLaunchCommand | function | 26 | yes | export function buildLaunchCommand({ chrome = findChrome(), host = &#39;127.0.0.1&#39;, port = 9333, userDataDir = OWNER_PROFILE } = {}) { |
| allowed | const | 27 | no | const allowed = inside(runtime, userDataDir) \|\| same(userDataDir, OWNER_PROFILE); |
| profileBusyReasons | function | 33 | yes | export function profileBusyReasons({ userDataDir, leaseRoot = resolve(process.env.LOCALAPPDATA \|\| &#39;&#39;, &#39;AION&#39;, &#39;drive-leases&#39;), runCim = defaultCim } = {}) { |
| reasons | const | 34 | no | const reasons = []; |
| parsePsOutput | function | 42 | yes | export function parsePsOutput(out) { return String(out).split(/\\r?\\n/).map(l =&gt; l.trim()).filter(l =&gt; /chrom/i.test(l)); } |
| defaultCim | function | 43 | no | function defaultCim() { |
| out | const | 45 | no | const out = execFileSync(&#39;powershell.exe&#39;, [&#39;-NoProfile&#39;, &#39;-Command&#39;, &quot;Get-CimInstance Win32_Process -Filter \\&quot;Name=&#39;chrome.exe&#39;\\&quot; \| ForEach-Object { $_.CommandLine }&quot;], { encoding: &#39;utf8&#39;, timeout: … |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 1 | external |
| node:url | import | 2 | external |
| node:fs | import | 3 | external |
| node:child_process | import | 4 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/bin/wh.mjs](../../bin/wh.mjs.md) | ../src/interface/launch.mjs |
| [harness/test/interface/interface.test.mjs](../../test/interface/interface.test.mjs.md) | ../../src/interface/launch.mjs |
| [harness/test/interface/linux-checks.test.mjs](../../test/interface/linux-checks.test.mjs.md) | ../../src/interface/launch.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const runtime = resolve(fileURLToPath(new URL('../../../runtime/', import.meta.url)));
// The only profiles the harness may drive: its own, or the owner's signed-in profile (user-directed).
// Same resolution as vivim-harness (src/config.mjs): <CAPTURE_STUDIO_HOME or C:\VIVIM>\chrome-profile.
export const OWNER_PROFILE = resolve(process.env.CAPTURE_STUDIO_HOME || 'C:\\VIVIM', 'chrome-profile');
export const LAB_PROFILE = resolve(runtime, 'chrome-profile');
const inside = (root, dir) => { const rel = relative(root, resolve(dir)); return !!rel && !rel.startsWith('..') && !isAbsolute(rel); };
const same = (a, b) => resolve(a).toLowerCase() === resolve(b).toLowerCase();

// Chrome discovery mirrors vivim-harness src/chrome/launch.mjs: CHROME_PATH, then standard install dirs.
export function findChrome(env = process.env, platform = process.platform, exists = existsSync) {
  if (platform !== 'win32') {
    const c = [env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/opt/google/chrome/chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
    return c.find(p => exists(p)) || '/usr/bin/google-chrome';
  }
  const bases = [env.PROGRAMFILES, env['PROGRAMFILES(X86)'], env.LOCALAPPDATA].filter(Boolean);
  const c = [env.CHROME_PATH, ...bases.map(b => resolve(b, 'Google', 'Chrome', 'Application', 'chrome.exe'))].filter(Boolean);
  return c.find(p => existsSync(p)) || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
}

// Default profile is the signed-in VIVIM profile (user-directed); the lab-local one is opt-in via LAB_PROFILE.
export function buildLaunchCommand({ chrome = findChrome(), host = '127.0.0.1', port = 9333, userDataDir = OWNER_PROFILE } = {}) {
  const allowed = inside(runtime, userDataDir) || same(userDataDir, OWNER_PROFILE);
  if (host !== '127.0.0.1' || port !== 9333 || !allowed) throw new Error('Unsafe Chrome launch configuration');
  return { command: chrome, args: [`--remote-debugging-address=${host}`, `--remote-debugging-port=${port}`, `--user-data-dir=${resolve(userDataDir)}`, '--no-first-run', '--no-default-browser-check'] };
}

// Single-driver guard. Returns a list of reasons the profile is NOT free (empty = free).
export function profileBusyReasons({ userDataDir, leaseRoot = resolve(process.env.LOCALAPPDATA || '', 'AION', 'drive-leases'), runCim = defaultCim } = {}) {
  const reasons = [];
  try {
    for (const line of runCim()) if (line.toLowerCase().includes(`--user-data-dir=${resolve(userDataDir).toLowerCase()}`) || line.toLowerCase().includes(`--user-data-dir="${resolve(userDataDir).toLowerCase()}"`)) { reasons.push('A Chrome process already uses this profile'); break; }
  } catch { reasons.push('Could not inspect running Chrome processes'); }
  try { if (existsSync(leaseRoot) && readdirSync(leaseRoot).length) reasons.push('A VIVIM drive lease directory is present (VIVIM may be driving a browser)'); } catch { /* none */ }
  return reasons;
}
// Linux/macOS: every process command line via ps (no PowerShell).
export function parsePsOutput(out) { return String(out).split(/\r?\n/).map(l => l.trim()).filter(l => /chrom/i.test(l)); }
function defaultCim() {
  if (process.platform !== 'win32') return parsePsOutput(execFileSync('ps', ['-eo', 'args='], { encoding: 'utf8', timeout: 20000 }));
  const out = execFileSync('powershell.exe', ['-NoProfile', '-Command', "Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: 'utf8', timeout: 20000 });
  return out.split(/\r?\n/).filter(Boolean);
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
