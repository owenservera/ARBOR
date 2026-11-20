# File: studio/src/studio/state-live.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/state-live.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2963 B |
| Lines | 94 |
| Hash | 047f5f35d898 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| VERSION_KEYS | const | 10 | no | const VERSION_KEYS = [&#39;Version&#39;, &#39;version&#39;]; |
| versionOf | function | 12 | no | function versionOf(body) { |
| siteOf | function | 19 | no | function siteOf(url) { |
| fetchJson | function | 27 | no | async function fetchJson(fetchImpl, url) { |
| res | const | 28 | no | const res = await fetchImpl(url); |
| enumerateBrowsers | function | 36 | yes | export async function enumerateBrowsers({ ports = [9222], fetchImpl = globalThis.fetch } = {}) { |
| browsers | const | 37 | no | const browsers = []; |
| url | const | 39 | no | const url = `http://127.0.0.1:${port}/json/version`; |
| reachable | variable | 40 | no | let reachable = false; |
| version | variable | 41 | no | let version = null; |
| body | const | 43 | no | const body = await fetchJson(fetchImpl, url); |
| sampleTabs | function | 54 | yes | export async function sampleTabs({ port = 9222, fetchImpl = globalThis.fetch } = {}) { |
| url | const | 55 | no | const url = `http://127.0.0.1:${port}/json/list`; |
| targets | variable | 56 | no | let targets; |
| tabs | const | 62 | no | const tabs = []; |
| siteSet | const | 63 | no | const siteSet = new Set(); |
| url | const | 66 | no | const url = String(t?.url ?? &#39;&#39;); |
| site | const | 67 | no | const site = siteOf(url); |
| tab | const | 68 | no | const tab = { id: t?.id, url, title: t?.title ?? &#39;&#39;, site }; |
| sampleLiveState | function | 75 | yes | export async function sampleLiveState(opts = {}) { |
| sampledAt | const | 77 | no | const sampledAt = new Date().toISOString(); |
| sampleLive | const | 94 | yes | export const sampleLive = sampleLiveState; |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Live samplers for browser and tab state via Chrome DevTools HTTP endpoints on loopback. |
| 3 | owner | atlas | — | atlas |
| 4 | task | — | — | state-live-samplers |

## Excerpt

```javascript
/**
 * @hq:context Live samplers for browser and tab state via Chrome DevTools HTTP endpoints on loopback.
 * @hq:owner atlas
 * @hq:task state-live-samplers
 *
 * Pure fetch over loopback. No CDP websocket, no new dependencies, no cookies/tokens ever returned.
 * A probe failure is data, not an exception: unreachable ports are reported with reachable:false.
 */

const VERSION_KEYS = ['Version', 'version'];

function versionOf(body) {
  for (const key of VERSION_KEYS) {
    if (body !== null && typeof body === 'object' && key in body) return body[key];
  }
  return null;
}

function siteOf(url) {
  try {
    return new URL(String(url ?? '')).hostname;
  } catch {
    return '';
  }
}

async function fetchJson(fetchImpl, url) {
  const res = await fetchImpl(url);
  if (res !== null && typeof res === 'object' && typeof res.json === 'function') {
    if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
    return await res.json();
  }
  return res;
}

export async function enumerateBrowsers({ ports = [9222], fetchImpl = globalThis.fetch } = {}) {
  const browsers = [];
  for (const port of ports) {
    const url = `http://127.0.0.1:${port}/json/version`;
    let reachable = false;
    let version = null;
    try {
      const body = await fetchJson(fetchImpl, url);
      reachable = true;
      version = versionOf(body);
    } catch {
      // Probe failure is data, not an exception: report reachable:false.
    }
    browsers.push({ port, reachable, version });
  }
  return { count: browsers.filter((b) => b.reachable).length, browsers };
}

export async function sampleTabs({ port = 9222, fetchImpl = globalThis.fetch } = {}) {
  const url = `http://127.0.0.1:${port}/json/list`;
  let targets;
  try {
    targets = await fetchJson(fetchImpl, url);
  } catch {
    return { count: 0, tabs: [], sites: [] };
  }
  const tabs = [];
  const siteSet = new Set();
  for (const t of targets ?? []) {
    if (t?.type !== 'page') continue;
    const url = String(t?.url ?? '');
    const site = siteOf(url);
    const tab = { id: t?.id, url, title: t?.title ?? '', site };
    tabs.push(tab);
    if (site) siteSet.add(site);
  }
  return { count: tabs.length, tabs, sites: Array.from(siteSet) };
}

export async function sampleLiveState(opts = {}) {
  const { ports = [9222], port = 9222, fetchImpl = globalThis.fetch } = opts;
  const sampledAt = new Date().toISOString();
  try {
    const [browsers, tabs] = await Promise.all([
      enumerateBrowsers({ ports, fetchImpl }),
```

_First 80 of 95 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
