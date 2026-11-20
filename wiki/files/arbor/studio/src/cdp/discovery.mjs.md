# File: studio/src/cdp/discovery.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/cdp/discovery.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6725 B |
| Lines | 150 |
| Hash | 5111af4295cc |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| endpointBase | function | 6 | yes | export function endpointBase({ host = &#39;127.0.0.1&#39;, port = 9222 } = {}) { |
| base | const | 7 | no | const base = `http://${host}:${port}`; |
| getJson | function | 12 | no | async function getJson(url, timeoutMs = 3000) { |
| ctrl | const | 13 | no | const ctrl = new AbortController(); |
| t | const | 14 | no | const t = setTimeout(() =&gt; ctrl.abort(), timeoutMs); |
| r | const | 16 | no | const r = await fetch(url, { signal: ctrl.signal }); |
| getJsonRetry | function | 23 | no | async function getJsonRetry(url, { timeoutMs = 3000, attempts = 3, delayMs = 150 } = {}) { |
| last | variable | 24 | no | let last; |
| browserVersion | function | 31 | yes | export async function browserVersion(opts) { |
| listTargets | function | 36 | yes | export async function listTargets(opts) { |
| listAllTargets | function | 43 | yes | export async function listAllTargets(opts) { |
| all | const | 44 | no | const all = await getJson(`${endpointBase(opts)}/json/list`); |
| isReachable | function | 49 | yes | export async function isReachable(opts) { |
| browserWsUrl | function | 55 | yes | export async function browserWsUrl(opts) { |
| v | const | 56 | no | const v = await getJsonRetry(`${endpointBase(opts)}/json/version`); |
| discoveryProbe | function | 63 | yes | export async function discoveryProbe(opts = {}) { |
| started | const | 64 | no | const started = Date.now(); |
| version | const | 66 | no | const version = await getJsonRetry(`${endpointBase(opts)}/json/version`); |
| targets | const | 67 | no | const targets = await listAllTargets(opts); |
| targetSummary | function | 80 | yes | export function targetSummary(t) { |
| host | variable | 81 | no | let host = &#39;&#39;; |
| waitForReachable | function | 87 | yes | export async function waitForReachable(opts = {}, { timeoutMs = 15_000, intervalMs = 250 } = {}) { |
| deadline | const | 88 | no | const deadline = Date.now() + timeoutMs; |
| waitForTarget | function | 97 | yes | export async function waitForTarget(selector, opts = {}, { timeoutMs = 30_000, intervalMs = 400 } = {}) { |
| deadline | const | 98 | no | const deadline = Date.now() + timeoutMs; |
| lastError | variable | 99 | no | let lastError = null; |
| pickTarget | function | 108 | yes | export function pickTarget(targets, selector) { |
| s | const | 116 | no | const s = String(selector); |
| exact | const | 117 | no | const exact = targets.find((t) =&gt; t.id === s); |
| prefix | const | 120 | no | const prefix = targets.filter((t) =&gt; t.id.startsWith(s)); |
| sub | const | 122 | no | const sub = targets.filter((t) =&gt; t.url.includes(s) \|\| (t.title ?? &#39;&#39;).toLowerCase().includes(s.toLowerCase())); |
| pickTargets | function | 129 | yes | export function pickTargets(targets, selector) { |
| s | const | 131 | no | const s = String(selector).toLowerCase(); |
| scored | const | 132 | no | const scored = targets.map((t) =&gt; { let score = -1; if (t.id === selector) score = 100; else if (t.id.startsWith(selector)) score = 80; else if ((t.url ?? &#39;&#39;).toLowerCase().includes(s)) score = 50; |
| score | variable | 133 | no | let score = -1; |
| targetStillPresent | function | 144 | yes | export async function targetStillPresent(targetId, opts = {}) { |
| all | const | 146 | no | const all = await listAllTargets(opts); |
| hit | const | 147 | no | const hit = all.find((t) =&gt; t.id === targetId); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./client.mjs | import | 4 | [studio/src/cdp/client.mjs](./client.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/capture.mjs](../../bin/commands/capture.mjs.md) | ../../src/cdp/discovery.mjs |
| [studio/bin/commands/selftest.mjs](../../bin/commands/selftest.mjs.md) | ../../src/cdp/discovery.mjs |
| [studio/bin/commands/system.mjs](../../bin/commands/system.mjs.md) | ../../src/cdp/discovery.mjs |
| [studio/scripts/always-on.mjs](../../scripts/always-on.mjs.md) | ../src/cdp/discovery.mjs |
| [studio/scripts/human-check.mjs](../../scripts/human-check.mjs.md) | ../src/cdp/discovery.mjs |
| [studio/scripts/probe-site.mjs](../../scripts/probe-site.mjs.md) | ../src/cdp/discovery.mjs |
| [studio/src/capture/actions.mjs](../capture/actions.mjs.md) | ../cdp/discovery.mjs |
| [studio/src/capture/chatgpt-chat-index-reader.mjs](../capture/chatgpt-chat-index-reader.mjs.md) | ../cdp/discovery.mjs |
| [studio/src/capture/conversation-browser-adapter.mjs](../capture/conversation-browser-adapter.mjs.md) | ../cdp/discovery.mjs |
| [studio/src/capture/conversation-runtime.mjs](../capture/conversation-runtime.mjs.md) | ../cdp/discovery.mjs |
| [studio/src/capture/recorder.mjs](../capture/recorder.mjs.md) | ../cdp/discovery.mjs |
| [studio/src/chrome/browser-ownership.mjs](../chrome/browser-ownership.mjs.md) | ../cdp/discovery.mjs |
| [studio/src/chrome/launch.mjs](../chrome/launch.mjs.md) | ../cdp/discovery.mjs |
| [studio/src/studio/server.mjs](../studio/server.mjs.md) | ../cdp/discovery.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// DevTools HTTP discovery on loopback only.
// Read-only: only /json/version and /json/list are used. Nothing here creates, activates or
// closes tabs, so discovery can never change what the person is looking at.
import { assertLoopbackUrl, sleep } from './client.mjs';

export function endpointBase({ host = '127.0.0.1', port = 9222 } = {}) {
  const base = `http://${host}:${port}`;
  assertLoopbackUrl(base);
  return base;
}

async function getJson(url, timeoutMs = 3000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) throw new Error(`${url} -> HTTP ${r.status}`);
    return await r.json();
  } finally { clearTimeout(t); }
}

// Same request, retried briefly: Chrome's HTTP endpoint answers a moment after the port opens.
async function getJsonRetry(url, { timeoutMs = 3000, attempts = 3, delayMs = 150 } = {}) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try { return await getJson(url, timeoutMs); } catch (e) { last = e; if (i + 1 < attempts) await sleep(delayMs * (i + 1)); }
  }
  throw last;
}

export async function browserVersion(opts) {
  return getJson(`${endpointBase(opts)}/json/version`);
}

// @serves 004
export async function listTargets(opts) {
  return (await listAllTargets(opts)).filter((t) => t?.type === 'page');
}

// Everything DevTools reports, including workers, iframes, service workers and extensions.
// Something on the port that answers /json/list with a non-array is not a Chrome DevTools
// endpoint; that is reported as such rather than as a TypeError from .filter/.find.
export async function listAllTargets(opts) {
  const all = await getJson(`${endpointBase(opts)}/json/list`);
  if (!Array.isArray(all)) throw new Error('DevTools /json/list did not return a target list');
  return all;
}

export async function isReachable(opts) {
  try { await browserVersion(opts); return true; } catch { return false; }
}

// The browser-level WebSocket endpoint, re-resolved on every call. Pass this (bound) as the
// `discover` function of ResilientCdpConnection so a Chrome restart is survivable.
export async function browserWsUrl(opts) {
  const v = await getJsonRetry(`${endpointBase(opts)}/json/version`);
  if (!v.webSocketDebuggerUrl) throw new Error('DevTools did not report a webSocketDebuggerUrl');
  assertLoopbackUrl(v.webSocketDebuggerUrl);
  return v.webSocketDebuggerUrl;
}

// Full discovery probe used by the studio health view.
export async function discoveryProbe(opts = {}) {
  const started = Date.now();
  try {
    const version = await getJsonRetry(`${endpointBase(opts)}/json/version`);
    const targets = await listAllTargets(opts);
    return {
      reachable: true, latencyMs: Date.now() - started,
      browser: version.Browser, protocol: version['Protocol-Version'], userAgent: version['User-Agent'],
      webSocketDebuggerUrl: version.webSocketDebuggerUrl,
      targets: targets.map(targetSummary),
      counts: targets.reduce((a, t) => { a[t.type] = (a[t.type] ?? 0) + 1; return a; }, {}),
    };
  } catch (e) {
    return { reachable: false, latencyMs: Date.now() - started, error: String(e?.message ?? e) };
  }
}

export function targetSummary(t) {
```

_First 80 of 151 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
