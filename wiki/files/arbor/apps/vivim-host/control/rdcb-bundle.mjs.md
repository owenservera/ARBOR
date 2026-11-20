# File: apps/vivim-host/control/rdcb-bundle.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/rdcb-bundle.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8599 B |
| Lines | 225 |
| Hash | 634cad721aa5 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| BUNDLE_SCHEMA | const | 26 | yes | export const BUNDLE_SCHEMA = &#39;vivim.rdcb/1&#39;; |
| INHERITS | const | 27 | yes | export const INHERITS = &#39;hq.context-bundle/1&#39;; |
| PROTOCOL | const | 28 | yes | export const PROTOCOL = &#39;hq.dcb-protocol/1&#39;; |
| TRIGGER | const | 29 | yes | export const TRIGGER = &#39;edit.pre&#39;; |
| AUDIENCE | const | 30 | yes | export const AUDIENCE = &#39;agent&#39;; |
| PROJECT | const | 31 | yes | export const PROJECT = &#39;arbor&#39;; |
| SOURCE_AUTHORITY | const | 32 | yes | export const SOURCE_AUTHORITY = &#39;project_observed&#39;; |
| BUNDLE_AUTHORITY | const | 33 | yes | export const BUNDLE_AUTHORITY = &#39;read_only_projection&#39;; |
| BUDGET_MAX_TOKENS | const | 34 | yes | export const BUDGET_MAX_TOKENS = 5000; |
| BUDGET_RESERVED | const | 35 | yes | export const BUDGET_RESERVED = 800; |
| CAPACITY_SLACK | const | 36 | yes | export const CAPACITY_SLACK = 80; |
| TOKENS_PER_BYTE | const | 37 | yes | export const TOKENS_PER_BYTE = 3; |
| PINNED_NOW | const | 39 | yes | export const PINNED_NOW = &#39;2026-11-14T00:00:00.000Z&#39;; |
| FILE_SURFACE_REF | const | 41 | no | const FILE_SURFACE_REF = &#39;apps/vivim-host/data/demo-baseline/file-surface.v1.json&#39;; |
| ACTION_CATALOG_REF | const | 42 | no | const ACTION_CATALOG_REF = &#39;apps/vivim-host/control/action-catalog.v1.json&#39;; |
| LANG_BY_EXT | const | 43 | no | const LANG_BY_EXT = { &#39;.js&#39;: &#39;javascript&#39;, &#39;.mjs&#39;: &#39;javascript&#39;, &#39;.html&#39;: &#39;html&#39; }; |
| sha256Hex | function | 45 | yes | export function sha256Hex(data) { |
| estimateTokens | function | 49 | yes | export function estimateTokens(text) { |
| surfaceHeaderExcerpt | function | 55 | yes | export function surfaceHeaderExcerpt(text) { |
| delims | const | 56 | no | const delims = [ |
| found | const | 60 | no | const found = []; |
| at | variable | 62 | no | let at = 0; |
| start | const | 64 | no | const start = text.indexOf(opener, at); |
| body | const | 68 | no | const body = text.slice(start + opener.length, end); |
| startLine | const | 70 | no | const startLine = text.slice(0, start).split(&#39;\\n&#39;).length; |
| endLine | const | 71 | no | const endLine = |
| die | function | 83 | no | function die(message) { |
| composeBundle | function | 90 | yes | export function composeBundle({ relPath, bytes, now = PINNED_NOW, surface, |
| text | const | 104 | no | const text = Buffer.isBuffer(bytes) ? bytes.toString(&#39;utf8&#39;) : String(bytes); |
| excerpt | const | 105 | no | const excerpt = surfaceHeaderExcerpt(text); |
| currentDigest | const | 108 | no | const currentDigest = sha256Hex(text); |
| stale | const | 112 | no | const stale = surface.sourceDigest !== currentDigest; |
| ext | const | 121 | no | const ext = relPath.slice(relPath.lastIndexOf(&#39;.&#39;)); |
| lang | const | 122 | no | const lang = LANG_BY_EXT[ext]; |
| estimatedTokens | const | 125 | no | const estimatedTokens = estimateTokens(excerpt.text); |
| capacity | const | 126 | no | const capacity = BUDGET_MAX_TOKENS - BUDGET_RESERVED - CAPACITY_SLACK; |
| catalogSchema | const | 131 | no | const catalogSchema = (catalogMeta &amp;&amp; catalogMeta.schema) \|\| &#39;vivim.control-action-catalog/1&#39;; |
| catalogVersion | const | 132 | no | const catalogVersion = catalogMeta &amp;&amp; typeof catalogMeta.version !== &#39;undefined&#39; ? catalogMeta.version : null; |
| fileSurface | const | 134 | no | const fileSurface = { |
| source | const | 140 | no | const source = { |
| budget | const | 158 | no | const budget = { |
| bundle | const | 166 | no | const bundle = { |
| forDigest | const | 201 | no | const forDigest = { ...bundle, digest: undefined }; |
| composeBundleFromRegistry | function | 211 | yes | export function composeBundleFromRegistry({ relPath, bytes, now = PINNED_NOW, registry, catalog } = {}) { |
| catalogIds | const | 215 | no | const catalogIds = catalog &amp;&amp; catalog.ids ? catalog.ids : new Set(); |
| catalogMeta | const | 216 | no | const catalogMeta = catalog ? { schema: catalog.schema, version: catalog.version } : undefined; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 24 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// rdcb-bundle.mjs — deterministic, source-revision-pinned RDCB v1 bundle module.
//
// Importable and pure: no CLI, no file I/O, no process.exit, no Math.random,
// no provider access. Compose a single vivim.rdcb/1 bundle on top of the
// existing file-surface registry (vivim.file-surface/1) and NLCL action
// catalog (vivim.control-action-catalog/1) — no second graph authority.
//
// Contract reuse (same conventions as control/rdcb-gen.mjs):
//   - schema vivim.rdcb/1, inherits hq.context-bundle/1,
//     protocol hq.dcb-protocol/1
//   - edit.pre budget: maxTokens 5000, reserved 800,
//     capacity = maxTokens - reserved - 80
//   - estimator utf8-bytes/3; generatedAt pinned by default and excluded
//     from the digest so identical inputs yield identical bytes/digest
//   - status computed, not asserted: fresh when the source sha256 equals the
//     file-surface sourceDigest, else stale (selective invalidation signal,
//     drifted paths recorded in reprogramming.surfaceDrift)
//   - fail closed on unknown actionIds, missing surface record, or unmapped
//     extension
//
// Source-revision pin: source.sha256 is the sha256 of the exact source bytes
// the bundle was composed from, so each bundle is pinned to that source
// revision.
import { createHash } from 'node:crypto';

export const BUNDLE_SCHEMA = 'vivim.rdcb/1';
export const INHERITS = 'hq.context-bundle/1';
export const PROTOCOL = 'hq.dcb-protocol/1';
export const TRIGGER = 'edit.pre';
export const AUDIENCE = 'agent';
export const PROJECT = 'arbor';
export const SOURCE_AUTHORITY = 'project_observed';
export const BUNDLE_AUTHORITY = 'read_only_projection';
export const BUDGET_MAX_TOKENS = 5000;
export const BUDGET_RESERVED = 800;
export const CAPACITY_SLACK = 80;
export const TOKENS_PER_BYTE = 3;
// Pinned default timestamp for determinism — not "today".
export const PINNED_NOW = '2026-11-14T00:00:00.000Z';

const FILE_SURFACE_REF = 'apps/vivim-host/data/demo-baseline/file-surface.v1.json';
const ACTION_CATALOG_REF = 'apps/vivim-host/control/action-catalog.v1.json';
const LANG_BY_EXT = { '.js': 'javascript', '.mjs': 'javascript', '.html': 'html' };

export function sha256Hex(data) {
  return createHash('sha256').update(data).digest('hex');
}

export function estimateTokens(text) {
  return Math.ceil(Buffer.byteLength(text, 'utf8') / TOKENS_PER_BYTE);
}

// Locate the first block comment whose body starts with @vlang:surface and
// return it verbatim (delimiters included) with 1-based [startLine, endLine].
export function surfaceHeaderExcerpt(text) {
  const delims = [
    { opener: '/*', closer: '*/' },
    { opener: '<!--', closer: '-->' }
  ];
  const found = [];
  for (const { opener, closer } of delims) {
    let at = 0;
    for (;;) {
      const start = text.indexOf(opener, at);
      if (start === -1) break;
      const end = text.indexOf(closer, start + opener.length);
      if (end === -1) break;
      const body = text.slice(start + opener.length, end);
      if (body.trimStart().startsWith('@vlang:surface')) {
        const startLine = text.slice(0, start).split('\n').length;
        const endLine =
          startLine + text.slice(start, end + closer.length).split('\n').length - 1;
        found.push({ lines: [startLine, endLine], text: text.slice(start, end + closer.length) });
      }
      at = end + closer.length;
    }
  }
  if (found.length === 0) throw new Error('no @vlang:surface header block comment found');
  found.sort((a, b) => a.lines[0] - b.lines[0]);
  return found[0];
```

_First 80 of 226 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
