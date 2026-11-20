# File: studio/src/profiles/profiles.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/profiles/profiles.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4294 B |
| Lines | 99 |
| Hash | 63cae5c454a5 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DEFAULT_PROFILE | const | 7 | yes | export const DEFAULT_PROFILE = { |
| deepMerge | function | 32 | no | function deepMerge(base, over) { |
| out | const | 34 | no | const out = { ...(base ?? {}) }; |
| normalizeProfile | function | 39 | yes | export function normalizeProfile(p) { return deepMerge(structuredClone(DEFAULT_PROFILE), p ?? {}); } |
| ProfileStore | class | 41 | yes | export class ProfileStore extends VersionedStore { |
| constructor | method | 42 | yes | constructor(dir) { super(dir, { builtinDir: path.join(TOOL_ROOT, &#39;profiles&#39;), normalize: normalizeProfile, kind: &#39;profile&#39; }); } |
| selectFor | method | 45 | yes | selectFor(url) { |
| host | variable | 46 | no | let host = &#39;&#39;; |
| best | variable | 48 | no | let best = null, bestScore = -1; |
| p | const | 50 | no | const p = this.load(n); |
| score | const | 52 | no | const score = hostMatchScore(host, pat); |
| hostMatchScore | function | 60 | yes | export function hostMatchScore(host, pattern) { |
| MULTI_SUFFIX | const | 66 | no | const MULTI_SUFFIX = new Set([&#39;co.uk&#39;, &#39;org.uk&#39;, &#39;ac.uk&#39;, &#39;gov.uk&#39;, &#39;com.au&#39;, &#39;net.au&#39;, &#39;co.jp&#39;, &#39;com.br&#39;, &#39;com.mx&#39;, &#39;co.nz&#39;, &#39;com.es&#39;, &#39;com.ar&#39;, &#39;co.in&#39;, &#39;com.cn&#39;, &#39;com.tr&#39;]); |
| siteOf | function | 67 | yes | export function siteOf(host) { |
| parts | const | 68 | no | const parts = host.split(&#39;.&#39;).filter(Boolean); |
| last2 | const | 70 | no | const last2 = parts.slice(-2).join(&#39;.&#39;); |
| inScope | function | 75 | yes | export function inScope(profile, requestUrl, pageUrl) { |
| rh | variable | 76 | no | let rh, ph; |
| profileDiff | function | 88 | yes | export function profileDiff(a, b, prefix = &#39;&#39;) { |
| out | const | 89 | no | const out = []; |
| keys | const | 90 | no | const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]); |
| p | const | 93 | no | const p = prefix ? `${prefix}.${k}` : k; |
| x | const | 94 | no | const x = a?.[k], y = b?.[k]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 3 | external |
| ../config.mjs | import | 4 | [studio/src/config.mjs](../config.mjs.md) |
| ../store/versioned.mjs | import | 5 | [studio/src/store/versioned.mjs](../store/versioned.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/profiles.mjs](../../bin/commands/profiles.mjs.md) | ../../src/profiles/profiles.mjs |
| [studio/bin/lib/context.mjs](../../bin/lib/context.mjs.md) | ../../src/profiles/profiles.mjs |
| [studio/scripts/loadlab.mjs](../../scripts/loadlab.mjs.md) | ../src/profiles/profiles.mjs |
| [studio/scripts/loadlab.mjs](../../scripts/loadlab.mjs.md) | ../src/profiles/profiles.mjs |
| [studio/src/capture/actions.mjs](../capture/actions.mjs.md) | ../profiles/profiles.mjs |
| [studio/src/capture/campaign.mjs](../capture/campaign.mjs.md) | ../profiles/profiles.mjs |
| [studio/src/capture/network.mjs](../capture/network.mjs.md) | ../profiles/profiles.mjs |
| [studio/src/families/build.mjs](../families/build.mjs.md) | ../profiles/profiles.mjs |
| [studio/src/intel/continuity.mjs](../intel/continuity.mjs.md) | ../profiles/profiles.mjs |
| [studio/src/mcp/runtime.mjs](../mcp/runtime.mjs.md) | ../profiles/profiles.mjs |
| [studio/src/profiles/manage.mjs](./manage.mjs.md) | ./profiles.mjs |
| [studio/src/replay/derive.mjs](../replay/derive.mjs.md) | ../profiles/profiles.mjs |
| [studio/src/studio/server.mjs](../studio/server.mjs.md) | ../profiles/profiles.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Versioned site profiles: generic core + per-site overrides. Every save creates a new immutable
// version; CURRENT points at the active one, so a bad change is a one-command rollback.
import path from 'node:path';
import { TOOL_ROOT } from '../config.mjs';
import { VersionedStore } from '../store/versioned.mjs';

export const DEFAULT_PROFILE = {
  name: 'generic',
  version: 1,
  description: 'Site-agnostic defaults: same-site scope, stream all API-like responses, observe DOM.',
  match: { hosts: ['*'] },
  scope: { origins: ['same-site'], thirdParty: 'ignore' },
  capture: {
    bodyResourceTypes: ['Fetch', 'XHR', 'EventSource', 'Document', 'Other'],
    include: [],
    exclude: [],
    sensitive: [],
    websockets: true,
    wsSentFrames: false,
    requestBodies: false,
    retrospectiveFallback: true,
  },
  dom: { enabled: true, roots: ['main', 'body'], ignoreTags: ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'], maxBlockTextBytes: 262144, flushMs: 100 },
  decode: { delta: 'auto', overrides: [] },
  shapes: { renames: {}, excluded: [], accepted: [] },
  records: [],
  family: null,
  familyMappings: [],
  notes: [],
};

function deepMerge(base, over) {
  if (Array.isArray(over) || typeof over !== 'object' || over === null) return over === undefined ? base : over;
  const out = { ...(base ?? {}) };
  for (const [k, v] of Object.entries(over)) out[k] = (v && typeof v === 'object' && !Array.isArray(v)) ? deepMerge(base?.[k], v) : v;
  return out;
}

export function normalizeProfile(p) { return deepMerge(structuredClone(DEFAULT_PROFILE), p ?? {}); }

export class ProfileStore extends VersionedStore {
  constructor(dir) { super(dir, { builtinDir: path.join(TOOL_ROOT, 'profiles'), normalize: normalizeProfile, kind: 'profile' }); }

  // Pick the most specific profile whose host patterns match the URL; fallback "generic".
  selectFor(url) {
    let host = '';
    try { host = new URL(url).hostname; } catch { /* ignore */ }
    let best = null, bestScore = -1;
    for (const n of this.names()) {
      const p = this.load(n);
      for (const pat of p.match?.hosts ?? []) {
        const score = hostMatchScore(host, pat);
        if (score > bestScore) { best = p; bestScore = score; }
      }
    }
    return best ?? normalizeProfile({});
  }
}

export function hostMatchScore(host, pattern) {
  if (pattern === '*') return 0;
  if (pattern.startsWith('*.')) { const base = pattern.slice(2); return host === base || host.endsWith('.' + base) ? base.length : -1; }
  return host === pattern ? pattern.length + 1000 : -1;
}

const MULTI_SUFFIX = new Set(['co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'com.au', 'net.au', 'co.jp', 'com.br', 'com.mx', 'co.nz', 'com.es', 'com.ar', 'co.in', 'com.cn', 'com.tr']);
export function siteOf(host) {
  const parts = host.split('.').filter(Boolean);
  if (parts.length <= 2 || /^\d+$/.test(parts.at(-1))) return host;
  const last2 = parts.slice(-2).join('.');
  return MULTI_SUFFIX.has(last2) ? parts.slice(-3).join('.') : last2;
}

// Is a request URL inside the profile scope, relative to the page URL?
export function inScope(profile, requestUrl, pageUrl) {
  let rh, ph;
  try { rh = new URL(requestUrl).hostname; } catch { return false; }
  try { ph = new URL(pageUrl).hostname; } catch { ph = ''; }
  for (const o of profile.scope?.origins ?? ['same-site']) {
    if (o === 'same-site' && ph && siteOf(rh) === siteOf(ph)) return true;
```

_First 80 of 100 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
