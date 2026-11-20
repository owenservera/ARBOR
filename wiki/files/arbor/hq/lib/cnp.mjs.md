# File: hq/lib/cnp.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/cnp.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8534 B |
| Lines | 190 |
| Hash | 8379bfef7d44 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CNP_SCHEMA | const | 14 | yes | export const CNP_SCHEMA = &#39;cnp/1&#39;; |
| STEM | const | 15 | yes | export const STEM = /^cnp1;d=([a-z0-9-]{1,32});l=([0-9]+(?:\\.[0-9]+)*);o=([a-z0-9][a-z0-9-]{0,16});c=([a-z0-9][a-z0-9-]{0,16});$/; |
| MAX_DEPTH | const | 16 | yes | export const MAX_DEPTH = 8; |
| nid | function | 19 | yes | export function nid({ domain, lineage, owner, cls }) { |
| d | const | 20 | no | const d = slug(domain, 32); |
| o | const | 21 | no | const o = slug(owner, 17); |
| c | const | 22 | no | const c = slug(cls, 17); |
| l | const | 23 | no | const l = String(lineage); |
| parseNid | function | 28 | yes | export function parseNid(stem) { |
| m | const | 29 | no | const m = STEM.exec(String(stem ?? &#39;&#39;)); |
| isLineage | function | 38 | yes | export function isLineage(value) { |
| parts | const | 39 | no | const parts = String(value).split(&#39;.&#39;); |
| depthOf | function | 44 | yes | export function depthOf(lineage) { |
| nextChild | function | 49 | yes | export function nextChild(lineage) { |
| parentOf | function | 53 | yes | export function parentOf(lineage) { |
| parts | const | 54 | no | const parts = String(lineage).split(&#39;.&#39;); |
| isDescendant | function | 59 | yes | export function isDescendant(ancestor, lineage) { |
| lca | function | 63 | yes | export function lca(a, b) { |
| sa | const | 64 | no | const sa = String(a).split(&#39;.&#39;); |
| sb | const | 65 | no | const sb = String(b).split(&#39;.&#39;); |
| common | const | 67 | no | const common = []; |
| slug | function | 75 | no | function slug(value, max) { |
| s | const | 76 | no | const s = String(value ?? &#39;&#39;).toLowerCase().replace(/[^a-z0-9-]+/g, &#39;-&#39;).replace(/^-+\|-+$/g, &#39;&#39;).slice(0, max); |
| Registry | class | 85 | yes | export class Registry { |
| constructor | method | 87 | yes | constructor(file) { |
| loaded | const | 93 | no | const loaded = JSON.parse(readFileSync(file, &#39;utf8&#39;)); |
| get | method | 99 | yes | get(key) { return this.doc.byKey[key] ?? null; } |
| byNid | method | 100 | yes | byNid(nidValue) { const key = this.doc.byNid[nidValue]; return key ? this.doc.byKey[key] ?? null : null; } |
| assign | method | 106 | yes | assign(key, { domain = &#39;chat&#39;, owner = &#39;unknown&#39;, cls = &#39;chat&#39; } = {}) { |
| existing | const | 107 | no | const existing = this.doc.byKey[key]; |
| d | const | 109 | no | const d = slug(domain, 32); |
| next | const | 110 | no | const next = (this.doc.nextLineage[d] ?? 0) + 1; |
| stem | const | 112 | no | const stem = nid({ domain: d, lineage: next, owner, cls }); |
| entry | const | 113 | no | const entry = { nid: stem, key, domain: d, owner: slug(owner, 17), cls: slug(cls, 17), boundAt: new Date().toISOString() }; |
| size | method | 119 | yes | size() { return Object.keys(this.doc.byKey).length; } |
| save | method | 121 | yes | save() { |
| tmp | const | 123 | no | const tmp = `${this.file}.tmp`; |
| resolveThread | function | 139 | yes | export function resolveThread(registry, record, { domain, owner } = {}) { |
| raw | const | 140 | no | const raw = record.threadId ?? null; |
| placeholder | const | 141 | no | const placeholder = raw === null \|\| /live-tab$/i.test(raw) \|\| /^(new\|t\\d+)$/i.test(raw) \|\| /-new$/i.test(raw); |
| entry | const | 143 | no | const entry = registry.assign(record.key ?? record.id, { domain: domain ?? &#39;chat&#39;, owner: owner ?? &#39;unknown&#39;, cls: &#39;chat&#39; }); |
| registerFor | function | 152 | no | function registerFor(registry, raw, { domain, owner } = {}) { |
| existing | const | 153 | no | const existing = registry.get(`thread:${raw}`); |
| resolveChannelThreads | function | 167 | yes | export function resolveChannelThreads({ channelRoot, registryFile, write = false }) { |
| registry | const | 168 | no | const registry = new Registry(registryFile); |
| dir | const | 169 | no | const dir = `${channelRoot.replace(/[\\\\/]+$/, &#39;&#39;)}/receipts`; |
| files | variable | 170 | no | let files = []; |
| entries | const | 172 | no | const entries = []; |
| summary | const | 173 | no | const summary = { stored: 0, &#39;assigned-placeholder&#39;: 0, &#39;assigned-missing&#39;: 0, unreadable: 0 }; |
| doc | variable | 175 | no | let doc = null; |
| key | const | 177 | no | const key = doc.receiptId ?? file.replace(/\\.json$/, &#39;&#39;); |
| siteScope | const | 180 | no | const siteScope = (doc.scopes ?? []).find((s) =&gt; typeof s === &#39;string&#39; &amp;&amp; s.includes(&#39;.&#39;)); |
| domain | const | 181 | no | const domain = siteScope ? siteScope.split(&#39;.&#39;)[0] : (doc.actor?.kind ?? &#39;chat&#39;); |
| owner | const | 182 | no | const owner = doc.actor?.id ?? &#39;unknown&#39;; |
| raw | const | 183 | no | const raw = doc.thread?.after \|\| doc.thread?.before \|\| null; |
| out | const | 184 | no | const out = resolveThread(registry, { key, id: key, threadId: raw }, { domain, owner }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 12 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/cnp.mjs |
| [hq/lib/comms-roof.mjs](./comms-roof.mjs.md) | ./cnp.mjs |
| [hq/lib/thread-resolve.mjs](./thread-resolve.mjs.md) | ./cnp.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | CNP/1 — the chat naming protocol: a stable stem for a conversation, per-domain lineage, |
| 5 | owner | channel-manager | — | channel-manager |
| 6 | task | — | — | cnp-registry |
| 7 | invariant | — | — | the stem is the only indexed part: desc/affinity never enter it |
| 8 | invariant | — | — | lineage segments are terminated, so &quot;4.2.&quot; can never match &quot;4.20&quot; |
| 9 | invariant | — | — | the Registry never rewrites a record it names; it maps ids to names beside them |
| 10 | see | — | research/cnp-reference | research/cnp-reference (Python reference, 105 tests) · docs/AGENT-BUS.md |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context CNP/1 — the chat naming protocol: a stable stem for a conversation, per-domain lineage,
 *   and the Registry that binds a session/request id to a name so a thread survives edits.
 * @hq:owner channel-manager
 * @hq:task cnp-registry
 * @hq:invariant the stem is the only indexed part: desc/affinity never enter it
 * @hq:invariant lineage segments are terminated, so "4.2." can never match "4.20"
 * @hq:invariant the Registry never rewrites a record it names; it maps ids to names beside them
 * @hq:see research/cnp-reference (Python reference, 105 tests) · docs/AGENT-BUS.md
 */
import { existsSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';

export const CNP_SCHEMA = 'cnp/1';
export const STEM = /^cnp1;d=([a-z0-9-]{1,32});l=([0-9]+(?:\.[0-9]+)*);o=([a-z0-9][a-z0-9-]{0,16});c=([a-z0-9][a-z0-9-]{0,16});$/;
export const MAX_DEPTH = 8;

/** Build a stem. Owner and class are attributes: transfer/reclass never move a node. */
export function nid({ domain, lineage, owner, cls }) {
  const d = slug(domain, 32);
  const o = slug(owner, 17);
  const c = slug(cls, 17);
  const l = String(lineage);
  if (!isLineage(l)) throw new Error(`E_LINEAGE: ${l}`);
  return `cnp1;d=${d};l=${l};o=${o};c=${c};`;
}

export function parseNid(stem) {
  const m = STEM.exec(String(stem ?? ''));
  if (!m) return { ok: false, error: 'E_STEM' };
  // The regex admits any digit run, so the lineage rule is enforced here too:
  // a stem carrying `l=0` is well-formed and still illegal.
  if (!isLineage(m[2])) return { ok: false, error: 'E_LINEAGE' };
  return { ok: true, domain: m[1], lineage: m[2], owner: m[3], cls: m[4] };
}

/** A lineage is 1..9999 segments, depth <= MAX_DEPTH. "0" is never a segment. */
export function isLineage(value) {
  const parts = String(value).split('.');
  if (parts.length > MAX_DEPTH) return false;
  return parts.every((p) => /^[1-9][0-9]{0,3}$/.test(p));
}

export function depthOf(lineage) {
  return String(lineage).split('.').length;
}

/** Highest direct child + 1 — monotonic, never reuses a number. */
export function nextChild(lineage) {
  return `${lineage}.1`;
}

export function parentOf(lineage) {
  const parts = String(lineage).split('.');
  return parts.length === 1 ? null : parts.slice(0, -1).join('.');
}

/** Terminated prefix: "4.2." matches 4.2.1 and not 4.20.1. */
export function isDescendant(ancestor, lineage) {
  return `${lineage}.`.startsWith(`${ancestor}.`);
}

export function lca(a, b) {
  const sa = String(a).split('.');
  const sb = String(b).split('.');
  if (sa[0] !== sb[0] && false) return null;
  const common = [];
  for (let i = 0; i < Math.min(sa.length, sb.length); i++) {
    if (sa[i] !== sb[i]) break;
    common.push(sa[i]);
  }
  return common.length ? common.join('.') : null;
}

function slug(value, max) {
  const s = String(value ?? '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, max);
  return s || 'x';
}

/**
```

_First 80 of 191 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
