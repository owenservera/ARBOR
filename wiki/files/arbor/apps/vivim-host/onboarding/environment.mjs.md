# File: apps/vivim-host/onboarding/environment.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/onboarding/environment.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2429 B |
| Lines | 44 |
| Hash | bffd3b77c698 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| browserCandidates | function | 7 | no | function browserCandidates(platform, env, home) { |
| pf | const | 9 | no | const pf = env.ProgramFiles \|\| &#39;C:\\\\Program Files&#39;, pf86 = env[&#39;ProgramFiles(x86)&#39;] \|\| &#39;C:\\\\Program Files (x86)&#39;; |
| local | const | 10 | no | const local = env.LOCALAPPDATA \|\| path.win32.join(home, &#39;AppData&#39;, &#39;Local&#39;); |
| w | const | 11 | no | const w = path.win32.join; |
| detectEnvironment | function | 28 | yes | export function detectEnvironment({ platform = process.platform, env = process.env, home = os.homedir(), exists = existsSync, nodeVersion = process.versions.node } = {}) { |
| found | const | 29 | no | const found = browserCandidates(platform, env, home).find(([, file]) =&gt; exists(file)); |
| join | const | 30 | no | const join = platform === &#39;win32&#39; ? path.win32.join : path.posix.join; |
| workspaceRoot | const | 31 | no | const workspaceRoot = platform === &#39;win32&#39; ? &#39;C:\\\\VIVIM&#39; : join(home, &#39;VIVIM&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:os | import | 3 | external |
| node:path | import | 4 | external |
| node:fs | import | 5 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/server.mjs](../server.mjs.md) | ./onboarding/environment.mjs |
| [apps/vivim-host/test/onboarding.test.mjs](../test/onboarding.test.mjs.md) | ../onboarding/environment.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// What this PC offers VIVIM: platform, a usable Chromium browser and sensible defaults.
// Pure given its inputs so it can be tested for every platform from any machine.
import os from 'node:os';
import path from 'node:path';
import { existsSync } from 'node:fs';

function browserCandidates(platform, env, home) {
  if (platform === 'win32') {
    const pf = env.ProgramFiles || 'C:\\Program Files', pf86 = env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    const local = env.LOCALAPPDATA || path.win32.join(home, 'AppData', 'Local');
    const w = path.win32.join;
    return [
      ['Google Chrome', w(pf, 'Google', 'Chrome', 'Application', 'chrome.exe')],
      ['Google Chrome', w(pf86, 'Google', 'Chrome', 'Application', 'chrome.exe')],
      ['Google Chrome', w(local, 'Google', 'Chrome', 'Application', 'chrome.exe')],
      ['Microsoft Edge', w(pf86, 'Microsoft', 'Edge', 'Application', 'msedge.exe')],
      ['Microsoft Edge', w(pf, 'Microsoft', 'Edge', 'Application', 'msedge.exe')]
    ];
  }
  if (platform === 'darwin') return [
    ['Google Chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'],
    ['Microsoft Edge', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']
  ];
  return ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge']
    .flatMap(name => ['/usr/bin/', '/usr/local/bin/', '/snap/bin/'].map(dir => [name.includes('edge') ? 'Microsoft Edge' : name.includes('chromium') ? 'Chromium' : 'Google Chrome', dir + name]));
}

export function detectEnvironment({ platform = process.platform, env = process.env, home = os.homedir(), exists = existsSync, nodeVersion = process.versions.node } = {}) {
  const found = browserCandidates(platform, env, home).find(([, file]) => exists(file));
  const join = platform === 'win32' ? path.win32.join : path.posix.join;
  const workspaceRoot = platform === 'win32' ? 'C:\\VIVIM' : join(home, 'VIVIM');
  return {
    platform,
    node: { ok: Number(nodeVersion.split('.')[0]) >= 22, version: nodeVersion },
    browser: found ? { found: true, name: found[0], path: found[1] } : { found: false, name: null, path: null },
    defaults: {
      workspaceRoot,
      chromeExe: found ? found[1] : '',
      chromeProfile: join(workspaceRoot, 'chrome-profile'),
      cdpPort: 38702
    },
    canLaunchFromHere: platform === 'win32'
  };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
