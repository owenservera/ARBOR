# File: studio/src/chrome/launch.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/chrome/launch.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7945 B |
| Lines | 143 |
| Hash | f9f9c5047508 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| searchDirs | function | 12 | no | function searchDirs(env, platform) { |
| variable | const | 14 | no | const variable = platform === &#39;win32&#39; ? (env.Path ?? env.PATH ?? env.path) : env.PATH; |
| chromeCandidates | function | 17 | yes | export function chromeCandidates(env = process.env, platform = process.platform) { |
| c | const | 18 | no | const c = [], impl = platform === &#39;win32&#39; ? path.win32 : path.posix; |
| dirs | const | 19 | no | const dirs = searchDirs(env, platform); |
| names | const | 41 | no | const names = platform === &#39;win32&#39; |
| findChrome | function | 47 | yes | export function findChrome(env = process.env, platform = process.platform) { |
| hit | const | 48 | no | const hit = chromeCandidates(env, platform).find((p) =&gt; p &amp;&amp; existsSync(p)); |
| launchChrome | function | 53 | yes | export async function launchChrome({ profileDir, port = 9222, url = &#39;about:blank&#39;, headless = false, extraArgs = [], dataRoot = null } = {}) { |
| v | const | 58 | no | const v = await browserVersion({ port }); |
| ownership | const | 59 | no | const ownership = await verifyBrowserOwner({ profileDir, port, version: v }); |
| exe | const | 67 | no | const exe = findChrome(); |
| envArgs | const | 71 | no | const envArgs = String(process.env.CAPTURE_STUDIO_CHROME_ARGS ?? &#39;&#39;).split(/\\s+/).filter(Boolean); |
| args | const | 72 | no | const args = [ |
| child | const | 83 | no | const child = spawn(exe, args, { detached: true, stdio: &#39;ignore&#39;, windowsHide: false }); |
| spawnError | variable | 86 | no | let spawnError = null; |
| v | const | 92 | no | const v = await browserVersion({ port }); |
| ownership | const | 93 | no | const ownership = recordBrowserOwner({ profileDir, port, version: v, pid: child.pid }); |
| ensureChrome | function | 104 | yes | export async function ensureChrome({ profileDir, port = 9222, url = &#39;about:blank&#39;, headless = false, extraArgs = [], attempts = 2, readyTimeoutMs = 20_000 } = {}) { |
| last | variable | 105 | no | let last; |
| r | const | 108 | no | const r = await launchChrome({ profileDir, port, url, headless, extraArgs }); |
| chromeStatus | function | 118 | yes | export async function chromeStatus({ port = 9222, profileDir = null } = {}) { |
| probe | const | 119 | no | const probe = await discoveryProbe({ port }); |
| ownership | variable | 120 | no | let ownership = { verified: false, reason: profileDir ? &#39;BROWSER_PROFILE_UNVERIFIED&#39; : &#39;BROWSER_PROFILE_REQUIRED&#39; }; |
| chromeInstalls | function | 141 | yes | export function chromeInstalls(env = process.env, platform = process.platform) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 4 | external |
| node:fs | import | 5 | external |
| node:path | import | 6 | external |
| ../cdp/discovery.mjs | import | 7 | [studio/src/cdp/discovery.mjs](../cdp/discovery.mjs.md) |
| ./browser-ownership.mjs | import | 8 | [studio/src/chrome/browser-ownership.mjs](./browser-ownership.mjs.md) |
| ../studio/cdp-owner-lock.mjs | import | 9 | [studio/src/studio/cdp-owner-lock.mjs](../studio/cdp-owner-lock.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/capture.mjs](../../bin/commands/capture.mjs.md) | ../../src/chrome/launch.mjs |
| [studio/bin/commands/chat.mjs](../../bin/commands/chat.mjs.md) | ../../src/chrome/launch.mjs |
| [studio/bin/commands/drive.mjs](../../bin/commands/drive.mjs.md) | ../../src/chrome/launch.mjs |
| [studio/bin/commands/selftest.mjs](../../bin/commands/selftest.mjs.md) | ../../src/chrome/launch.mjs |
| [studio/bin/commands/system.mjs](../../bin/commands/system.mjs.md) | ../../src/chrome/launch.mjs |
| [studio/scripts/always-on.mjs](../../scripts/always-on.mjs.md) | ../src/chrome/launch.mjs |
| [studio/src/studio/server.mjs](../studio/server.mjs.md) | ../chrome/launch.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Launch a dedicated, loopback-only Chrome profile for capture.
// Chrome 136+ refuses remote debugging on the default profile, so a separate --user-data-dir
// is both required and safer: the person signs in to the sites they want captured once, there.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { isReachable, browserVersion, waitForReachable, discoveryProbe } from '../cdp/discovery.mjs';
import { browserMarkerPath, recordBrowserOwner, verifyBrowserOwner } from './browser-ownership.mjs';
import { assertNoForeignCdpOwner } from '../studio/cdp-owner-lock.mjs';

// One implementation for native Windows, Linux, and macOS: no which/where shell.
function searchDirs(env, platform) {
  const impl = platform === 'win32' ? path.win32 : path.posix;
  const variable = platform === 'win32' ? (env.Path ?? env.PATH ?? env.path) : env.PATH;
  return String(variable ?? '').split(impl.delimiter).filter(Boolean);
}
export function chromeCandidates(env = process.env, platform = process.platform) {
  const c = [], impl = platform === 'win32' ? path.win32 : path.posix;
  const dirs = searchDirs(env, platform);
  if (env.CHROME_PATH) {
    c.push(env.CHROME_PATH);
    if (!impl.isAbsolute(env.CHROME_PATH) && !env.CHROME_PATH.includes('/') && !env.CHROME_PATH.includes('\\'))
      for (const dir of dirs) c.push(impl.join(dir, env.CHROME_PATH));
  }
  if (platform === 'win32') {
    for (const base of [env.PROGRAMFILES, env['PROGRAMFILES(X86)'], env.LOCALAPPDATA].filter(Boolean)) {
      c.push(impl.join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'));
      c.push(impl.join(base, 'Google', 'Chrome Beta', 'Application', 'chrome.exe'));
      c.push(impl.join(base, 'Google', 'Chrome SxS', 'Application', 'chrome.exe'));
      c.push(impl.join(base, 'Chromium', 'Application', 'chrome.exe'));
      c.push(impl.join(base, 'Microsoft', 'Edge', 'Application', 'msedge.exe'));
    }
  } else if (platform === 'darwin') {
    c.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
    c.push('/Applications/Chromium.app/Contents/MacOS/Chromium');
  } else {
    c.push('/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium',
      '/usr/bin/chromium-browser', '/snap/bin/chromium', '/opt/google/chrome/chrome',
      '/opt/microsoft/msedge/msedge');
  }
  const names = platform === 'win32'
    ? ['chrome.exe', 'chromium.exe', 'msedge.exe']
    : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge', 'microsoft-edge-stable'];
  for (const dir of dirs) for (const name of names) c.push(impl.join(dir, name));
  return [...new Set(c)];
}
export function findChrome(env = process.env, platform = process.platform) {
  const hit = chromeCandidates(env, platform).find((p) => p && existsSync(p));
  if (!hit) throw new Error('Chrome/Chromium/Edge not found. Install one or set CHROME_PATH to its executable.');
  return hit;
}

export async function launchChrome({ profileDir, port = 9222, url = 'about:blank', headless = false, extraArgs = [], dataRoot = null } = {}) {
  // Even when CDP is already reachable, it may belong to an unrelated browser.
  // No tab operations or sends are permitted before proving continuity with this profile.
  browserMarkerPath(profileDir);
  if (await isReachable({ port })) {
    const v = await browserVersion({ port });
    const ownership = await verifyBrowserOwner({ profileDir, port, version: v });
    return { alreadyRunning: true, port, browser: v.Browser, pid: null, ...ownership };
  }
  // Not reachable, about to spawn. A caller that is not the CDP-port owner (chat/drive passing dataRoot)
  // must not start a second Chrome on the owner's profile; the owner Studio or `studio launch` does that.
  if (dataRoot) await assertNoForeignCdpOwner(dataRoot, port);
  // Chrome 136+ refuses remote debugging on the default profile.
  mkdirSync(profileDir, { recursive: true });
  const exe = findChrome();
  // Local-integrator escape hatch (owner machines and synthetic-https test fixtures): extra,
  // explicitly operator-provided Chrome flags. Opt-in via environment only; never set by
  // Capture Studio itself, and the listener stays loopback-only regardless of the flags.
  const envArgs = String(process.env.CAPTURE_STUDIO_CHROME_ARGS ?? '').split(/\s+/).filter(Boolean);
  const args = [
    `--remote-debugging-port=${port}`,
    '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    ...(headless ? ['--headless=new'] : []),
    ...extraArgs,
    ...envArgs,
```

_First 80 of 144 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
