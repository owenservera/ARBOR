# File: studio/src/chrome/browser-ownership.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/chrome/browser-ownership.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3768 B |
| Lines | 64 |
| Hash | 37f540fee327 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MARKER | const | 10 | no | const MARKER = &#39;.vivim-cdp-owner.json&#39;; |
| error | function | 11 | no | const error = (code, detail) =&gt; Object.assign(new Error(`${code}: ${detail}`), { code }); |
| browserIdentity | function | 13 | yes | export function browserIdentity(version, port) { |
| raw | const | 14 | no | const raw = version?.webSocketDebuggerUrl; |
| url | variable | 16 | no | let url; |
| browserMarkerPath | function | 24 | yes | export function browserMarkerPath(profileDir) { |
| checkBrowserOwner | function | 30 | yes | export function checkBrowserOwner({ profileDir, port, version, marker } = {}) { |
| profilePath | const | 32 | no | const profilePath = existsSync(profileDir) ? realpathSync(profileDir) : path.resolve(profileDir); |
| expected | const | 33 | no | const expected = browserIdentity(version, port); |
| verifyBrowserOwner | function | 43 | yes | export async function verifyBrowserOwner({ profileDir, port, version } = {}) { |
| markerPath | const | 44 | no | const markerPath = browserMarkerPath(profileDir); |
| marker | variable | 45 | no | let marker = null; |
| observed | const | 47 | no | const observed = version ?? await browserVersion({ port }); |
| recordBrowserOwner | function | 51 | yes | export function recordBrowserOwner({ profileDir, port, version, pid } = {}) { |
| markerPath | const | 52 | no | const markerPath = browserMarkerPath(profileDir); |
| dir | const | 53 | no | const dir = path.dirname(markerPath); |
| profilePath | const | 55 | no | const profilePath = realpathSync(dir); |
| marker | const | 56 | no | const marker = { schema: &#39;vivim.chrome-owner/1&#39;, profilePath, port: Number(port), |
| temp | const | 58 | no | const temp = markerPath + &#39;.&#39; + randomUUID() + &#39;.tmp&#39;; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 5 | external |
| node:path | import | 6 | external |
| node:crypto | import | 7 | external |
| ../cdp/discovery.mjs | import | 8 | [studio/src/cdp/discovery.mjs](../cdp/discovery.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/capture.mjs](../../bin/commands/capture.mjs.md) | ../../src/chrome/browser-ownership.mjs |
| [studio/scripts/windows/launcher-helper.mjs](../../scripts/windows/launcher-helper.mjs.md) | ../../src/chrome/browser-ownership.mjs |
| [studio/src/chrome/launch.mjs](./launch.mjs.md) | ./browser-ownership.mjs |
| [studio/src/studio/server.mjs](../studio/server.mjs.md) | ../chrome/browser-ownership.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Local browser ownership continuity: the reachable CDP port is NOT evidence of a VIVIM world.
// This marker is created only after this launcher starts an isolated profile and sees its
// DevTools browser identity. Subsequent attaches fail closed if port/profile/identity drift.
// It is an operational continuity check, NOT OS-level isolation or an authentication mechanism.
import { existsSync, mkdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { browserVersion } from '../cdp/discovery.mjs';

const MARKER = '.vivim-cdp-owner.json';
const error = (code, detail) => Object.assign(new Error(`${code}: ${detail}`), { code });

export function browserIdentity(version, port) {
  const raw = version?.webSocketDebuggerUrl;
  if (typeof raw !== 'string') throw error('BROWSER_IDENTITY_UNAVAILABLE', 'DevTools did not provide a browser identity');
  let url;
  try { url = new URL(raw); } catch { throw error('BROWSER_IDENTITY_UNAVAILABLE', 'Invalid DevTools identity'); }
  if (url.protocol !== 'ws:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
    || Number(url.port) !== Number(port) || !/^\/devtools\/browser\/[a-zA-Z0-9-]{8,128}$/.test(url.pathname))
    throw error('BROWSER_IDENTITY_UNAVAILABLE', 'DevTools identity is not the expected loopback browser endpoint');
  return url.pathname;
}

export function browserMarkerPath(profileDir) {
  if (typeof profileDir !== 'string' || !profileDir.trim())
    throw error('BROWSER_PROFILE_REQUIRED', 'A dedicated VIVIM Chrome profile directory is required');
  return path.join(path.resolve(profileDir), MARKER);
}

export function checkBrowserOwner({ profileDir, port, version, marker } = {}) {
  browserMarkerPath(profileDir);
  const profilePath = existsSync(profileDir) ? realpathSync(profileDir) : path.resolve(profileDir);
  const expected = browserIdentity(version, port);
  if (!marker || marker.schema !== 'vivim.chrome-owner/1'
    || marker.profilePath !== profilePath || marker.port !== Number(port) || marker.browserIdentity !== expected)
    throw error('BROWSER_PROFILE_UNVERIFIED',
      'A Chrome endpoint is reachable but its identity is not verified for this VIVIM profile. ' +
      'Do not attach or send; close only the dedicated VIVIM Chrome after saving your work, then relaunch with studio start.');
  return { verified: true, profilePath, browserIdentity: expected };
}

// @serves 005
export async function verifyBrowserOwner({ profileDir, port, version } = {}) {
  const markerPath = browserMarkerPath(profileDir);
  let marker = null;
  try { marker = JSON.parse(readFileSync(markerPath, 'utf8')); } catch { /* no marker or malformed => deny */ }
  const observed = version ?? await browserVersion({ port });
  return checkBrowserOwner({ profileDir, port, version: observed, marker });
}

export function recordBrowserOwner({ profileDir, port, version, pid } = {}) {
  const markerPath = browserMarkerPath(profileDir);
  const dir = path.dirname(markerPath);
  mkdirSync(dir, { recursive: true });
  const profilePath = realpathSync(dir);
  const marker = { schema: 'vivim.chrome-owner/1', profilePath, port: Number(port),
    browserIdentity: browserIdentity(version, port), launchedPid: pid ?? null, createdAt: new Date().toISOString() };
  const temp = markerPath + '.' + randomUUID() + '.tmp';
  try {
    writeFileSync(temp, JSON.stringify(marker, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
    renameSync(temp, markerPath);
  } finally { if (existsSync(temp)) rmSync(temp, { force: true }); }
  return { verified: true, profilePath, browserIdentity: marker.browserIdentity };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
