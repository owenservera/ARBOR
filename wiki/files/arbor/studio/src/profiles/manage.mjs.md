# File: studio/src/profiles/manage.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/profiles/manage.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11681 B |
| Lines | 211 |
| Hash | 6cc3486be36e |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NAME_RE | const | 7 | no | const NAME_RE = /^[a-z0-9][a-z0-9._-]{0,63}$/i; |
| DELTA_DIALECTS | const | 8 | no | const DELTA_DIALECTS = [&#39;auto&#39;, &#39;none&#39;, &#39;json-patch&#39;, &#39;typed-events&#39;, &#39;path-ops&#39;]; |
| PROTECTED_KEYS | const | 9 | no | const PROTECTED_KEYS = new Set([&#39;name&#39;, &#39;version&#39;, &#39;savedAt&#39;, &#39;changeNote&#39;]); |
| ProfileError | class | 11 | yes | export class ProfileError extends Error { |
| constructor | method | 12 | yes | constructor(message, code = &#39;PROFILE_ERROR&#39;) { super(message); this.name = &#39;ProfileError&#39;; this.code = code; } |
| isValidProfileName | function | 15 | yes | export const isValidProfileName = (n) =&gt; typeof n === &#39;string&#39; &amp;&amp; NAME_RE.test(n); |
| summarizeProfile | function | 17 | yes | export function summarizeProfile(store, name) { |
| p | const | 18 | no | const p = store.load(name); |
| versions | const | 19 | no | const versions = store.versions(name); |
| listProfileSummaries | function | 35 | yes | export function listProfileSummaries(store) { |
| explainMatch | function | 41 | yes | export function explainMatch(store, url) { |
| host | variable | 42 | no | let host = &#39;&#39;; |
| candidates | const | 44 | no | const candidates = []; |
| p | const | 46 | no | const p = store.load(name); |
| best | variable | 47 | no | let best = null; |
| score | const | 49 | no | const score = hostMatchScore(host, pattern); |
| selected | const | 55 | no | const selected = store.selectFor(url); |
| lintProfile | function | 60 | yes | export function lintProfile(profile) { |
| issues | const | 61 | no | const issues = []; |
| add | function | 62 | no | const add = (level, path, message) =&gt; issues.push({ level, path, message }); |
| p | const | 63 | no | const p = profile ?? {}; |
| hosts | const | 65 | no | const hosts = p.match?.hosts; |
| names | const | 79 | no | const names = new Set(); |
| at | const | 81 | no | const at = `records[${i}]`; |
| parseAssignment | function | 100 | yes | export function parseAssignment(text) { |
| m | const | 101 | no | const m = /^([A-Za-z0-9_.\\[\\]-]+?)(\\+=\|-=\|=)([\\s\\S]*)$/.exec(String(text)); |
| value | variable | 104 | no | let value = raw; |
| splitPath | function | 109 | no | const splitPath = (p) =&gt; p.replace(/\\[(\\d+)\\]/g, &#39;.$1&#39;).split(&#39;.&#39;).filter(Boolean); |
| walkTo | function | 111 | no | function walkTo(root, parts, create) { |
| cur | variable | 112 | no | let cur = root; |
| part | const | 114 | no | const part = parts[i]; |
| assertEditable | function | 122 | no | function assertEditable(parts) { |
| applyAssignments | function | 128 | yes | export function applyAssignments(profile, assignments) { |
| p | const | 129 | no | const p = structuredClone(profile); |
| changes | const | 130 | no | const changes = []; |
| parts | const | 133 | no | const parts = splitPath(path); |
| parent | const | 135 | no | const parent = walkTo(p, parts, true); |
| key | const | 136 | no | const key = parts.at(-1); |
| before | const | 137 | no | const before = parent[key]; |
| arr | const | 140 | no | const arr = before === undefined ? [] : before; |
| unsetPaths | function | 152 | yes | export function unsetPaths(profile, paths) { |
| p | const | 153 | no | const p = structuredClone(profile); |
| changes | const | 154 | no | const changes = []; |
| parts | const | 156 | no | const parts = splitPath(path); |
| parent | const | 158 | no | const parent = walkTo(p, parts, false); |
| key | const | 159 | no | const key = parts.at(-1); |
| before | const | 161 | no | const before = parent[key]; |
| editHosts | function | 171 | yes | export function editHosts(profile, { add = [], remove = [] } = {}) { |
| p | const | 172 | no | const p = structuredClone(profile); |
| set | const | 174 | no | const set = new Set(p.match.hosts ?? []); |
| buildProfile | function | 182 | yes | export function buildProfile(base, { name, hosts, description, family }) { |
| hostList | const | 184 | no | const hostList = (hosts ?? []).filter(Boolean); |
| p | const | 186 | no | const p = normalizeProfile(structuredClone(base)); |
| validateImport | function | 197 | yes | export function validateImport(obj, { requireName = true } = {}) { |
| issues | const | 200 | no | const issues = lintProfile(normalizeProfile(obj)); |
| errors | const | 201 | no | const errors = issues.filter((i) =&gt; i.level === &#39;error&#39;); |
| profileUsage | function | 207 | yes | export function profileUsage(sessions) { |
| out | const | 208 | no | const out = {}; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./profiles.mjs | import | 5 | [studio/src/profiles/profiles.mjs](./profiles.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/profiles.mjs](../../bin/commands/profiles.mjs.md) | ../../src/profiles/manage.mjs |
| [studio/bin/commands/system.mjs](../../bin/commands/system.mjs.md) | ../../src/profiles/manage.mjs |
| [studio/src/families/build.mjs](../families/build.mjs.md) | ../profiles/manage.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Profile management helpers used by the CLI: summaries, URL matching explanation, linting,
// path-based edits, host editing and creation. Pure functions over profile objects plus thin
// readers over a ProfileStore; every mutation returns a new profile and leaves saving (which
// creates a new immutable version) to the caller.
import { normalizeProfile, hostMatchScore, siteOf } from './profiles.mjs';

const NAME_RE = /^[a-z0-9][a-z0-9._-]{0,63}$/i;
const DELTA_DIALECTS = ['auto', 'none', 'json-patch', 'typed-events', 'path-ops'];
const PROTECTED_KEYS = new Set(['name', 'version', 'savedAt', 'changeNote']);

export class ProfileError extends Error {
  constructor(message, code = 'PROFILE_ERROR') { super(message); this.name = 'ProfileError'; this.code = code; }
}

export const isValidProfileName = (n) => typeof n === 'string' && NAME_RE.test(n);

export function summarizeProfile(store, name) {
  const p = store.load(name);
  const versions = store.versions(name);
  return {
    name,
    current: store.current(name),
    versions: versions.length,
    updatedAt: versions.at(-1)?.savedAt ?? null,
    family: p.family ?? null,
    hosts: p.match?.hosts ?? [],
    records: (p.records ?? []).length,
    familyMappings: (p.familyMappings ?? []).length,
    accepted: (p.shapes?.accepted ?? []).length,
    rejected: (p.shapes?.excluded ?? []).length,
    description: p.description ?? '',
  };
}

export function listProfileSummaries(store) {
  return store.names().map((n) => summarizeProfile(store, n));
}

// Which profiles match a URL and how strongly; mirrors ProfileStore.selectFor so the answer is the same
// profile the recorder would pick.
export function explainMatch(store, url) {
  let host = '';
  try { host = new URL(url).hostname; } catch { throw new ProfileError(`"${url}" is not a valid URL (include http:// or https://).`, 'BAD_URL'); }
  const candidates = [];
  for (const name of store.names()) {
    const p = store.load(name);
    let best = null;
    for (const pattern of p.match?.hosts ?? []) {
      const score = hostMatchScore(host, pattern);
      if (score >= 0 && (!best || score > best.score)) best = { pattern, score };
    }
    if (best) candidates.push({ name, version: p.version, pattern: best.pattern, score: best.score });
  }
  candidates.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const selected = store.selectFor(url);
  return { url, host, site: siteOf(host), selected: { name: selected.name, version: selected.version }, candidates };
}

// Structural lint: returns [{ level: 'error'|'warn', path, message }].
export function lintProfile(profile) {
  const issues = [];
  const add = (level, path, message) => issues.push({ level, path, message });
  const p = profile ?? {};
  if (!isValidProfileName(p.name)) add('error', 'name', `invalid profile name "${p.name}" (letters, digits, . _ -; max 64)`);
  const hosts = p.match?.hosts;
  if (!Array.isArray(hosts) || !hosts.length) add('error', 'match.hosts', 'at least one host pattern is required (use "*" for any site)');
  else for (const [i, h] of hosts.entries()) {
    if (typeof h !== 'string' || !h.trim()) add('error', `match.hosts[${i}]`, 'host pattern must be a non-empty string');
    else if (/[\s/:]/.test(h)) add('error', `match.hosts[${i}]`, `"${h}" must be a bare hostname or "*.domain" pattern (no scheme, port or path)`);
    else if (h !== '*' && h.includes('*') && !h.startsWith('*.')) add('error', `match.hosts[${i}]`, `"${h}": wildcards are only supported as "*" or a leading "*."`);
  }
  for (const key of ['include', 'exclude', 'sensitive']) {
    for (const [i, pat] of (p.capture?.[key] ?? []).entries()) {
      try { new RegExp(pat); } catch (e) { add('error', `capture.${key}[${i}]`, `invalid regular expression: ${e.message}`); }
    }
  }
  if (p.decode?.delta !== undefined && !DELTA_DIALECTS.includes(p.decode.delta)) add('warn', 'decode.delta', `unknown dialect "${p.decode.delta}" (known: ${DELTA_DIALECTS.join(', ')})`);
  if (!Array.isArray(p.scope?.origins) || !p.scope.origins.length) add('warn', 'scope.origins', 'no scope origins: nothing will be captured');
  const names = new Set();
  for (const [i, r] of (p.records ?? []).entries()) {
```

_First 80 of 212 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
