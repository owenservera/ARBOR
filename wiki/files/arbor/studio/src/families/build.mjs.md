# File: studio/src/families/build.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/families/build.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 16920 B |
| Lines | 324 |
| Hash | 6233a0e676f1 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SIG_NOTE | const | 18 | no | const SIG_NOTE = &#39;family shape set v1&#39;; |
| cmp | function | 20 | no | const cmp = (a, b) =&gt; (a &lt; b ? -1 : a &gt; b ? 1 : 0); |
| sorted | function | 21 | no | const sorted = (iterable) =&gt; [...iterable].sort(cmp); |
| pathPattern | function | 24 | yes | export function pathPattern(endpoint) { |
| s | const | 25 | no | const s = String(endpoint ?? &#39;&#39;); |
| i | const | 26 | no | const i = s.indexOf(&#39; &#39;); |
| rest | const | 27 | no | const rest = i &gt; 0 ? s.slice(i + 1) : s; |
| u | variable | 28 | no | let u = null; |
| p | variable | 30 | no | let p = u ? u.pathname : rest.split(&#39;?&#39;)[0].split(&#39;#&#39;)[0]; |
| dominantTransport | function | 42 | no | function dominantTransport(ep) { |
| entries | const | 43 | no | const entries = Object.entries(ep?.transports ?? {}); |
| hostOf | function | 49 | no | function hostOf(session) { |
| pageOrigin | function | 55 | no | function pageOrigin(session) { |
| u | const | 57 | no | const u = new URL(session.meta?.target?.url); |
| endpointOrigin | function | 61 | no | function endpointOrigin(endpoint) { |
| raw | const | 63 | no | const raw = String(endpoint ?? &#39;&#39;); |
| rest | const | 64 | no | const rest = raw.includes(&#39; &#39;) ? raw.slice(raw.indexOf(&#39; &#39;) + 1) : raw; |
| u | const | 65 | no | const u = new URL(rest); |
| groupOrigin | function | 70 | no | function groupOrigin(group) { |
| direct | const | 71 | no | const direct = endpointOrigin(group.endpoint); |
| observed | const | 74 | no | const observed = endpointOrigin(group.origins[0]); |
| label | const | 77 | no | const label = String(group.endpoint ?? &#39;&#39;).replace(/^\\S+\\s+/, &#39;&#39;); |
| collectSessions | function | 84 | yes | export function collectSessions({ sessionsDir, host, site } = {}) { |
| wanted | const | 85 | no | const wanted = [host, site].map((x) =&gt; String(x ?? &#39;&#39;).toLowerCase().trim()).filter(Boolean); |
| out | const | 86 | no | const out = []; |
| s | const | 88 | no | const s = new Session(path.join(sessionsDir, meta.id)); |
| h | const | 89 | no | const h = hostOf(s); |
| slug | variable | 90 | no | let slug = &#39;&#39;; |
| haystack | const | 92 | no | const haystack = [h, slug, String(s.meta?.site ?? &#39;&#39;).toLowerCase()]; |
| shapes | const | 94 | no | const shapes = s.kv.get(&#39;SHAPES&#39;, null); |
| acceptance | const | 95 | no | const acceptance = readAcceptance(s); // Rechecks current raw digest and G1–G7 binding. |
| knowledge | const | 96 | no | const knowledge = s.kv.get(&#39;KNOWLEDGE_STATUS&#39;, null); |
| origin | const | 97 | no | const origin = pageOrigin(s); |
| eligible | const | 98 | no | const eligible = !!shapes &amp;&amp; origin !== null &amp;&amp; knowledge?.status === &#39;complete&#39; |
| assembledKv | const | 100 | no | const assembledKv = s.kv.get(&#39;ASSEMBLED&#39;, null) ?? {}; |
| assembled | const | 101 | no | const assembled = Object.fromEntries(Object.entries(assembledKv) .filter(([, a]) =&gt; a &amp;&amp; typeof a === &#39;object&#39; &amp;&amp; a.endpoint) .map(([sid, a]) =&gt; [sid, { endpoint: a.endpoint, revisions: a.revisions ?… |
| normaliseShapes | function | 141 | no | function normaliseShapes(sessions) { |
| streams | const | 142 | no | const streams = new Map(); |
| outOfOriginGroups | variable | 143 | no | let outOfOriginGroups = 0; |
| epIndex | const | 146 | no | const epIndex = new Map(s.endpoints.map((e) =&gt; [e.endpoint, e])); |
| dialects | const | 147 | no | const dialects = new Map(); |
| set | const | 149 | no | const set = dialects.get(a.endpoint) ?? new Set(); |
| ep | const | 158 | no | const ep = epIndex.get(g.endpoint) ?? null; |
| transport | const | 159 | no | const transport = dominantTransport(ep); |
| endpoint | const | 160 | no | const endpoint = pathPattern(g.endpoint ?? ep?.endpoint ?? &#39;&#39;); |
| key | const | 161 | no | const key = `${transport} ${endpoint}`; |
| entry | variable | 162 | no | let entry = streams.get(key); |
| cur | const | 170 | no | const cur = entry.fields.get(p) ?? { path: p, count: 0, sessions: new Set() }; |
| cur | const | 177 | no | const cur = entry.collections.get(c.path) ?? { path: c.path, groups: 0, avgItems: 0, keys: new Set() }; |
| familySignature | function | 207 | yes | export function familySignature(input) { |
| shapes | const | 208 | no | const shapes = Array.isArray(input) ? input : input?.shapes ?? []; |
| canon | const | 209 | no | const canon = JSON.stringify({ note: SIG_NOTE, streams: shapes.map((s) =&gt; ({ transport: s.transport ?? &#39;UNKNOWN&#39;, endpoint: s.endpoint ?? &#39;/&#39;, |
| slugHost | function | 223 | no | const slugHost = (h) =&gt; String(h ?? &#39;&#39;).toLowerCase().replace(/[^a-z0-9.-]+/g, &#39;-&#39;).replace(/^-+\|-+$/g, &#39;&#39;).slice(0, 64); |
| draftProfile | function | 227 | no | function draftProfile(profilesDir, id, hosts) { |
| store | const | 230 | no | const store = new ProfileStore(profilesDir); |
| p | const | 231 | no | const p = buildProfile(store.load(&#39;generic&#39;), { name: id, hosts, family: id, description: `Site family consolidated from derived sessions (${hosts.join(&#39;, &#39;)})` }); |
| buildFamily | function | 240 | yes | export function buildFamily({ sessionsDir, host, site, profilesDir = null, minSessions = 1 } = {}) { |
| ref | const | 241 | no | const ref = host ?? site; |
| sessions | const | 242 | no | const sessions = collectSessions({ sessionsDir, host, site }); |
| derived | const | 243 | no | const derived = sessions.filter((s) =&gt; s.hasDerived); |
| accepted | const | 244 | no | const accepted = sessions.filter((s) =&gt; s.eligible); |
| origin | const | 248 | no | const origin = sorted(new Set(accepted.map((s) =&gt; s.origin)))[0] ?? null; |
| contributing | const | 249 | no | const contributing = accepted.filter((s) =&gt; s.origin === origin); |
| signature | const | 251 | no | const signature = familySignature(shapes); |
| hosts | const | 253 | no | const hosts = sorted(new Set(contributing.map((s) =&gt; s.host).filter(Boolean))); |
| primary | const | 254 | no | const primary = hosts[0] ?? String(site ?? host ?? &#39;site&#39;).toLowerCase(); |
| id | const | 255 | no | const id = slugHost(primary) \|\| &#39;site&#39;; |
| siteName | function | 256 | no | const siteName = (() =&gt; { try { return siteOf(primary); } catch { return &#39;&#39;; } })(); |
| family | const | 257 | no | const family = { |
| warnings | const | 265 | no | const warnings = []; |
| noDerived | const | 267 | no | const noDerived = sessions.filter((s) =&gt; !s.hasDerived); |
| differentOrigins | const | 272 | no | const differentOrigins = accepted.filter((s) =&gt; s.origin !== origin); |
| draft | const | 276 | no | const draft = contributing.length &amp;&amp; shapes.length ? draftProfile(profilesDir, id, hosts) |
| transports | const | 280 | no | const transports = sorted(new Set(shapes.map((s) =&gt; s.transport))); |
| writeFamily | function | 298 | yes | export function writeFamily({ familiesDir, built, family, profile, shapes, coverage, warnings } = {}) { |
| b | const | 299 | no | const b = built ?? null; |
| fam | const | 300 | no | const fam = family ?? b?.family; |
| c | const | 302 | no | const c = coverage ?? b?.coverage; |
| groups | const | 303 | no | const groups = shapes ?? b?.shapes ?? []; |
| error | const | 305 | no | const error = new Error(&#39;Family publication withheld: no accepted, exact-origin, source-linked shapes&#39;); |
| store | const | 309 | no | const store = new FamilyStore(familiesDir); |
| rec | const | 310 | no | const rec = store.save(fam.id, { ...fam, kind: &#39;site-family&#39;, profile: profile ?? b?.profile ?? null, shapes: shapes ?? b?.shapes ?? [], |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 10 | external |
| node:crypto | import | 11 | external |
| ../store/session.mjs | import | 12 | [studio/src/store/session.mjs](../store/session.mjs.md) |
| ./families.mjs | import | 13 | [studio/src/families/families.mjs](./families.mjs.md) |
| ../profiles/profiles.mjs | import | 14 | [studio/src/profiles/profiles.mjs](../profiles/profiles.mjs.md) |
| ../profiles/manage.mjs | import | 15 | [studio/src/profiles/manage.mjs](../profiles/manage.mjs.md) |
| ../capture/acceptance.mjs | import | 16 | [studio/src/capture/acceptance.mjs](../capture/acceptance.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/library.mjs](../../bin/commands/library.mjs.md) | ../../src/families/build.mjs |
| [studio/src/capture/campaign.mjs](../capture/campaign.mjs.md) | ../families/build.mjs |
| [studio/src/families/core.mjs](./core.mjs.md) | ./build.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Family/shape consolidation: turn every derived session of one site into ONE normalised
// family shape set. Reuses the existing artifacts, never a second store or format:
//   - sessions and their kv      src/store/session.mjs  (listSessions, Session.open)
//   - derived shape report       src/shapes/infer.mjs   (SHAPES: endpoints[], groups[] written by derive)
//   - delta dialects             src/replay/derive.mjs  (ASSEMBLED: {sid: {endpoint, dialects}})
//   - family records + versions  src/families/families.mjs (FamilyStore -> VersionedStore vNNNN.json + CURRENT)
//   - profile draft              src/profiles/profiles.mjs + src/profiles/manage.mjs (buildProfile)
// Determinism: every collection is sorted and the signature hashes only the normalised shape set,
// so two runs over the same sessions produce byte-identical objects.
import path from 'node:path';
import { createHash } from 'node:crypto';
import { Session, listSessions } from '../store/session.mjs';
import { FamilyStore } from './families.mjs';
import { siteOf, ProfileStore } from '../profiles/profiles.mjs';
import { buildProfile } from '../profiles/manage.mjs';
import { readAcceptance } from '../capture/acceptance.mjs';

const SIG_NOTE = 'family shape set v1';

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const sorted = (iterable) => [...iterable].sort(cmp);

// Endpoint string ("GET https://host/a/123", "WS wss://host/x") -> stable path pattern.
export function pathPattern(endpoint) {
  const s = String(endpoint ?? '');
  const i = s.indexOf(' ');
  const rest = i > 0 ? s.slice(i + 1) : s;
  let u = null;
  try { u = new URL(rest); } catch { if (rest.startsWith('//')) { try { u = new URL(`http:${rest}`); } catch { u = null; } } }
  let p = u ? u.pathname : rest.split('?')[0].split('#')[0];
  if (!u) p = /^\/\//.test(rest) ? p.replace(/^\/\/[^/]*/, '') : rest.startsWith('/') ? p : p.replace(/^[^/]*/, '');
  p = p
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi, '/{id}')
    .replace(/\/[0-9a-f]{16,}(?=\/|$)/gi, '/{id}')
    .replace(/\/\d+(?=\/|$)/g, '/{id}')
    .replace(/\/{2,}/g, '/');
  if (!p.startsWith('/')) p = `/${p}`;
  return p || '/';
}

// The transport that carried most of this endpoint's streams (ties broken by name).
function dominantTransport(ep) {
  const entries = Object.entries(ep?.transports ?? {});
  if (!entries.length) return 'UNKNOWN';
  entries.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0) || cmp(a[0], b[0]));
  return entries[0][0];
}

function hostOf(session) {
  try { return new URL(session.meta?.target?.url).hostname.toLowerCase(); } catch { return ''; }
}

// A site slug / common hostname is not an identity or an account boundary.
// Only an exact HTTP(S) page origin can be used for a published family shape.
function pageOrigin(session) {
  try {
    const u = new URL(session.meta?.target?.url);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.origin : null;
  } catch { return null; }
}
function endpointOrigin(endpoint) {
  try {
    const raw = String(endpoint ?? '');
    const rest = raw.includes(' ') ? raw.slice(raw.indexOf(' ') + 1) : raw;
    const u = new URL(rest);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.origin : null;
  } catch { return null; }
}

function groupOrigin(group) {
  const direct = endpointOrigin(group.endpoint);
  if (!Array.isArray(group.origins)) return direct; // Legacy absolute labels only.
  if (group.origins.length !== 1) return null;
  const observed = endpointOrigin(group.origins[0]);
  if (!observed || observed !== group.origins[0]) return null;
  if (direct) return direct === observed ? direct : null;
  const label = String(group.endpoint ?? '').replace(/^\S+\s+/, '');
  // Provenance supplies the scheme, not the page or an invented URL default.
  return label.split('/')[0] === new URL(observed).host ? observed : null;
}
```

_First 80 of 325 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
