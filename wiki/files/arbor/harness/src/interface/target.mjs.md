# File: harness/src/interface/target.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/interface/target.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5462 B |
| Lines | 87 |
| Hash | e6c02af3142e |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| LAB_PORT | const | 12 | yes | export const LAB_PORT = 9333; |
| DENIED_PORTS | const | 13 | no | const DENIED_PORTS = new Set([9222]); |
| coded | function | 14 | no | const coded = (code, message) =&gt; Object.assign(new Error(message), { code }); |
| pathImpl | function | 16 | no | const pathImpl = platform =&gt; platform === &#39;win32&#39; ? win32 : posix; |
| profileKey | function | 17 | no | const profileKey = (profile, platform) =&gt; { |
| full | const | 18 | no | const full = pathImpl(platform).resolve(profile); |
| resolveTarget | function | 22 | yes | export function resolveTarget(env = process.env, platform = process.platform) { |
| portRaw | const | 23 | no | const portRaw = env.WH_CDP_PORT, profile = env.WH_ATTACH_PROFILE; |
| port | const | 25 | no | const port = Number(portRaw); |
| paths | const | 28 | no | const paths = pathImpl(platform); |
| supplied | variable | 30 | no | let supplied = platform === &#39;win32&#39; ? profile.replaceAll(posix.sep, paths.sep) : profile; |
| root | const | 31 | no | const root = paths.parse(supplied).root; |
| canonical | const | 33 | no | const canonical = paths.resolve(profile); |
| commandLineMatches | function | 39 | yes | export function commandLineMatches(argv, { profile, port }, platform = process.platform) { |
| line | const | 41 | no | const line = String(argv); |
| parts | const | 42 | no | const parts = line.split(&#39;\\0&#39;).filter(Boolean); |
| args | const | 43 | no | const args = Array.isArray(argv) ? argv : parts.length &gt; 1 ? parts |
| value | function | 45 | no | const value = name =&gt; { |
| flag | const | 46 | no | const flag = `--${name}`; |
| hits | const | 47 | no | const hits = args.map((a, i) =&gt; a === flag ? args[i + 1] : a.startsWith(`${flag}=`) ? a.slice(flag.length + 1) : undefined).filter(v =&gt; v !== undefined); |
| dir | const | 50 | no | const dir = value(&#39;user-data-dir&#39;); |
| verifyAttachTarget | function | 54 | yes | export function verifyAttachTarget(target, { run = (cmd, args) =&gt; execFileSync(cmd, args, { encoding: &#39;utf8&#39;, timeout: 20000, windowsHide: true, env: process.platform === &#39;win32&#39; ? { ...process.env, … |
| ok | variable | 65 | no | let ok = false; |
| port | const | 68 | no | const port = Number(target.port); |
| script | const | 70 | no | const script = ` |
| browser | const | 78 | no | const browser = JSON.parse(run(&#39;powershell.exe&#39;, [&#39;-NoLogo&#39;, &#39;-NoProfile&#39;, &#39;-NonInteractive&#39;, &#39;-Command&#39;, script])); |
| pid | const | 81 | no | const pid = parseSsListenerPid(run(&#39;ss&#39;, [&#39;-ltnpH&#39;]), target.port); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 7 | external |
| node:fs | import | 8 | external |
| node:path | import | 9 | external |
| ./standing.mjs | import | 10 | [harness/src/interface/standing.mjs](./standing.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/bin/wh.mjs](../../bin/wh.mjs.md) | ../src/interface/target.mjs |
| [harness/src/interface/deps.mjs](./deps.mjs.md) | ./target.mjs |
| [harness/src/interface/router.mjs](./router.mjs.md) | ./target.mjs |
| [harness/test/interface/attach-target.test.mjs](../../test/interface/attach-target.test.mjs.md) | ../../src/interface/target.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Resolves which loopback Chrome CDP endpoint the harness may drive.
// Default: the lab Chrome on 127.0.0.1:9333 (launched by the harness, runtime/chrome-profile).
// Opt-in attach-only mode: WH_CDP_PORT=<port> AND WH_ATTACH_PROFILE=<absolute --user-data-dir>.
// Attach mode never launches or kills that browser and never closes tabs; it only opens NEW tabs.
// Before every connect, the process listening on 127.0.0.1:<port> must be Chrome running with
// exactly --user-data-dir=<WH_ATTACH_PROFILE>. Profiles/cookies are never read or copied.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, posix, win32 } from 'node:path';
import { parseSsListenerPid } from './standing.mjs';

export const LAB_PORT = 9333;
const DENIED_PORTS = new Set([9222]);
const coded = (code, message) => Object.assign(new Error(message), { code });

const pathImpl = platform => platform === 'win32' ? win32 : posix;
const profileKey = (profile, platform) => {
  const full = pathImpl(platform).resolve(profile);
  return platform === 'win32' ? full.toLowerCase() : full;
};

export function resolveTarget(env = process.env, platform = process.platform) {
  const portRaw = env.WH_CDP_PORT, profile = env.WH_ATTACH_PROFILE;
  if (portRaw === undefined && profile === undefined) return { host: '127.0.0.1', port: LAB_PORT, mode: 'lab' };
  const port = Number(portRaw);
  if (!Number.isInteger(port) || port < 1024 || port > 65535 || DENIED_PORTS.has(port)) throw coded('ATTACH_PORT_REFUSED', 'WH_CDP_PORT refused');
  if (port === LAB_PORT && profile === undefined) return { host: '127.0.0.1', port, mode: 'lab' };
  const paths = pathImpl(platform);
  if (typeof profile !== 'string' || !paths.isAbsolute(profile)) throw coded('ATTACH_PROFILE_REQUIRED', 'Attach mode needs WH_CDP_PORT and an absolute WH_ATTACH_PROFILE');
  let supplied = platform === 'win32' ? profile.replaceAll(posix.sep, paths.sep) : profile;
  const root = paths.parse(supplied).root;
  while (supplied.length > root.length && supplied.endsWith(paths.sep)) supplied = supplied.slice(0, -1);
  const canonical = paths.resolve(profile);
  if ((platform === 'win32' ? canonical.toLowerCase() !== supplied.toLowerCase() : canonical !== supplied)) throw coded('ATTACH_PROFILE_REQUIRED', 'Attach profile must be an absolute canonical path');
  return { host: '127.0.0.1', port, mode: 'attach', profile: canonical };
}

// Pure: does this Chrome command line use exactly this --user-data-dir and debug port?
export function commandLineMatches(argv, { profile, port }, platform = process.platform) {
  // Preserve real argv boundaries and quoted paths, including profile directories with spaces.
  const line = String(argv);
  const parts = line.split('\0').filter(Boolean);
  const args = Array.isArray(argv) ? argv : parts.length > 1 ? parts
    : ((parts[0] || '').match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? []).map(a => a.replace(/["']/g, ''));
  const value = name => {
    const flag = `--${name}`;
    const hits = args.map((a, i) => a === flag ? args[i + 1] : a.startsWith(`${flag}=`) ? a.slice(flag.length + 1) : undefined).filter(v => v !== undefined);
    return hits.length === 1 ? hits[0] : undefined;
  };
  const dir = value('user-data-dir');
  return !!dir && pathImpl(platform).isAbsolute(dir) && profileKey(dir, platform) === profileKey(profile, platform) && Number(value('remote-debugging-port')) === Number(port);
}

export function verifyAttachTarget(target, {
  run = (cmd, args) => execFileSync(cmd, args, {
    encoding: 'utf8', timeout: 20000, windowsHide: true,
    env: process.platform === 'win32' ? { ...process.env,
      PSModulePath: join(process.env.SystemRoot || process.env.WINDIR, 'System32', 'WindowsPowerShell', 'v1.0', 'Modules'),
    } : process.env,
  }),
  readCmdline = pid => readFileSync(join(posix.sep, 'proc', String(pid), 'cmdline'), 'utf8'),
  platform = process.platform,
} = {}) {
  if (target.mode !== 'attach') return true;
  let ok = false;
  try {
    if (platform === 'win32') {
      const port = Number(target.port);
      if (!Number.isInteger(port) || port < 1024 || port > 65535 || DENIED_PORTS.has(port)) throw new Error('Invalid attach port');
      const script = `
$ErrorActionPreference = 'Stop'
$listeners = @(Get-NetTCPConnection -State Listen -LocalPort ${port} | Where-Object { $_.LocalAddress -eq '127.0.0.1' })
if ($listeners.Count -ne 1) { throw 'Expected exactly one loopback listener' }
$browser = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $listeners[0].OwningProcess)
if ($browser.Name -ne 'chrome.exe') { throw 'Listener is not Chrome' }
[pscustomobject]@{ pid = $browser.ProcessId; name = $browser.Name; commandLine = $browser.CommandLine } | ConvertTo-Json -Compress
`;
      const browser = JSON.parse(run('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', script]));
      ok = Number.isInteger(browser.pid) && browser.pid > 0 && browser.name === 'chrome.exe' && commandLineMatches(browser.commandLine, target, platform);
    } else {
```

_First 80 of 88 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
