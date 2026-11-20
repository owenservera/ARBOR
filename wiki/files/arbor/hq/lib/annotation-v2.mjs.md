# File: hq/lib/annotation-v2.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/annotation-v2.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13362 B |
| Lines | 363 |
| Hash | c9340b52f9af |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ANNOTATION_V2_SCHEMA | const | 24 | yes | export const ANNOTATION_V2_SCHEMA = &#39;hq.annotation/2&#39;; |
| SOURCE_LINK_SCHEMA | const | 25 | yes | export const SOURCE_LINK_SCHEMA = &#39;hq.source-link/1&#39;; |
| ANNOTATION_V2_TAGS | const | 27 | yes | export const ANNOTATION_V2_TAGS = [ |
| TAG_SET | const | 31 | no | const TAG_SET = new Set(ANNOTATION_V2_TAGS); |
| VERSIONED_TAGS | const | 34 | no | const VERSIONED_TAGS = new Set([&#39;type&#39;, &#39;capability&#39;, &#39;contract&#39;, &#39;emits&#39;, &#39;consumes&#39;, &#39;action&#39;]); |
| compare | function | 36 | no | const compare = (a, b) =&gt; (a &lt; b ? -1 : a &gt; b ? 1 : 0); |
| textOrNull | function | 37 | no | const textOrNull = (value) =&gt; { |
| trimmed | const | 39 | no | const trimmed = value.trim(); |
| VERSIONED_ID_RE | const | 47 | no | const VERSIONED_ID_RE = /^[a-z0-9][a-z0-9._-]*@\\d+(?:\\.\\d+)*$/; |
| EFFECT_CLASS_RE | const | 48 | no | const EFFECT_CLASS_RE = /^[a-z0-9-]+:[a-z0-9-]+$/; |
| isVersionedId | function | 51 | yes | export function isVersionedId(value) { |
| isEffectClass | function | 56 | yes | export function isEffectClass(value) { |
| isEvidenceRef | function | 61 | yes | export function isEvidenceRef(value) { |
| GRAMMAR | const | 67 | no | const GRAMMAR = { |
| SECRET_BASENAMES | const | 85 | no | const SECRET_BASENAMES = new Set([ &#39;session.json&#39;, &#39;storage-state.json&#39;, &#39;release-profile.json&#39;, &#39;cookies&#39;, &#39;login data&#39;, ]); |
| isSecretSegment | function | 89 | no | function isSecretSegment(segment) { |
| name | const | 90 | no | const name = String(segment ?? &#39;&#39;).trim().toLowerCase(); |
| hasSecretPath | function | 99 | no | function hasSecretPath(value) { |
| REGEX_PREFIX | const | 108 | no | const REGEX_PREFIX = new Set([ &#39;(&#39;, &#39;,&#39;, &#39;=&#39;, &#39;:&#39;, &#39;[&#39;, &#39;!&#39;, &#39;&amp;&#39;, &#39;\|&#39;, &#39;?&#39;, &#39;{&#39;, &#39;;&#39;, &#39;+&#39;, &#39;-&#39;, &#39;*&#39;, &#39;%&#39;, &#39;&lt;&#39;, &#39;&gt;&#39;, &#39;~&#39;, &#39;^&#39;, &#39;/&#39;, ]); const REGEX_KEYWORD = /(?:^\|[^\\w$])(?:return\|typeof\|instanceof\|c… |
| REGEX_KEYWORD | const | 111 | no | const REGEX_KEYWORD = /(?:^\|[^\\w$])(?:return\|typeof\|instanceof\|case\|in\|of\|new\|delete\|void\|do\|else\|yield\|await\|throw)$/; |
| lineStarts | function | 113 | no | function lineStarts(text) { |
| starts | const | 114 | no | const starts = [0]; |
| lineAt | function | 119 | no | function lineAt(starts, index) { |
| lo | variable | 120 | no | let lo = 0; |
| hi | variable | 121 | no | let hi = starts.length - 1; |
| mid | const | 123 | no | const mid = (lo + hi + 1) &gt;&gt; 1; |
| skipQuoted | function | 133 | no | function skipQuoted(text, start, quote) { |
| n | const | 134 | no | const n = text.length; |
| i | variable | 135 | no | let i = start + 1; |
| ch | const | 137 | no | const ch = text[i]; |
| skipRegex | function | 147 | no | function skipRegex(text, start) { |
| n | const | 148 | no | const n = text.length; |
| i | variable | 149 | no | let i = start + 1; |
| inClass | variable | 150 | no | let inClass = false; |
| ch | const | 152 | no | const ch = text[i]; |
| scanCommentSpans | function | 168 | no | function scanCommentSpans(text) { |
| spans | const | 169 | no | const spans = []; |
| n | const | 170 | no | const n = text.length; |
| i | variable | 171 | no | let i = 0; |
| previous | variable | 172 | no | let previous = &#39;&#39;; // last significant character outside a comment or literal |
| word | variable | 173 | no | let word = &#39;&#39;; // last identifier/number token outside a comment or literal |
| ch | const | 176 | no | const ch = text[i]; |
| next | const | 177 | no | const next = text[i + 1]; |
| close | const | 190 | no | const close = text.indexOf(&#39;*/&#39;, i + 2); |
| skipped | const | 205 | no | const skipped = skipRegex(text, i); |
| j | variable | 217 | no | let j = i; |
| emptyResult | function | 237 | no | function emptyResult() { |
| diagnostic | function | 246 | no | function diagnostic(code, severity, kind, value, line, message) { |
| lookupRef | function | 250 | no | function lookupRef(registry, id) { |
| entry | const | 253 | no | const entry = registry.lookup(id); |
| parseAnnotationV2 | function | 274 | yes | export function parseAnnotationV2(source, options = {}) { |
| result | const | 275 | no | const result = emptyResult(); |
| opts | const | 278 | no | const opts = options &amp;&amp; typeof options === &#39;object&#39; ? options : {}; |
| ctx | const | 279 | no | const ctx = { |
| starts | const | 288 | no | const starts = lineStarts(source); |
| seen | const | 289 | no | const seen = new Set(); |
| records | const | 290 | no | const records = []; |
| diagnostics | const | 291 | no | const diagnostics = []; |
| body | const | 294 | no | const body = source.slice(span.start, span.end); |
| re | const | 295 | no | const re = /@hq:([a-z][a-z0-9-]*)/g; |
| kind | const | 298 | no | const kind = match[1]; |
| valueStart | const | 303 | no | const valueStart = match.index + match[0].length; |
| valueEnd | variable | 304 | no | let valueEnd = body.indexOf(&#39;\\n&#39;, valueStart); |
| nextTag | const | 306 | no | const nextTag = body.indexOf(&#39;@hq:&#39;, valueStart); |
| value | const | 308 | no | const value = body.slice(valueStart, valueEnd).trim(); |
| line | const | 309 | no | const line = lineAt(starts, span.start + match.index); |
| key | const | 311 | no | const key = `${line}\|${kind}\|${value}`; |
| entry | const | 332 | no | const entry = lookupRef(ctx.registry, value); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/annotation-v2.mjs |
| [hq/bin/wave1-lane-a.mjs](../bin/wave1-lane-a.mjs.md) | ../lib/annotation-v2.mjs |
| [hq/lib/arbor-service.mjs](./arbor-service.mjs.md) | ./annotation-v2.mjs |
| [hq/lib/comment-wiki-bridge.mjs](./comment-wiki-bridge.mjs.md) | ./annotation-v2.mjs |
| [hq/lib/context.mjs](./context.mjs.md) | ./annotation-v2.mjs |
| [hq/lib/indexer.mjs](./indexer.mjs.md) | ./annotation-v2.mjs |
| [hq/lib/search.mjs](./search.mjs.md) | ./annotation-v2.mjs |
| [hq/lib/semantic-registry.mjs](./semantic-registry.mjs.md) | ./annotation-v2.mjs |
| [hq/test/annotation-v2.test.mjs](../test/annotation-v2.test.mjs.md) | ../lib/annotation-v2.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Additive v2 annotation grammar: typed semantic tags parsed from source comments only. |
| 3 | owner | hq | — | hq |
| 4 | task | — | — | semantic-kernel-annotation-v2 |
| 5 | invariant | — | — | Pure: no database, filesystem, network, clock or randomness. Never throws on bad input. |
| 6 | invariant | — | — | A comment never creates a registered executable action; unknown refs are reported, never accepted. |
| 7 | invariant | — | — | v1 tags (`context`, `why`, `invariant`, `see`, `todo`, `owner`, `task`, `risk`, `deprecated`) |
| 9 | see | — | hq/lib/protocol.mjs | hq/lib/protocol.mjs |
| 10 | see | — | docs/research/semantic-language-kernel/ARCHITECTURE.md | docs/research/semantic-language-kernel/ARCHITECTURE.md |

## Excerpt

```javascript
/**
 * @hq:context Additive v2 annotation grammar: typed semantic tags parsed from source comments only.
 * @hq:owner hq
 * @hq:task semantic-kernel-annotation-v2
 * @hq:invariant Pure: no database, filesystem, network, clock or randomness. Never throws on bad input.
 * @hq:invariant A comment never creates a registered executable action; unknown refs are reported, never accepted.
 * @hq:invariant v1 tags (`context`, `why`, `invariant`, `see`, `todo`, `owner`, `task`, `risk`, `deprecated`)
 *   stay owned by hq/lib/protocol.mjs. This module ignores them, so a v1-only file yields zero output here.
 * @hq:see hq/lib/protocol.mjs
 * @hq:see docs/research/semantic-language-kernel/ARCHITECTURE.md
 *
 * Design notes
 * - protocol.mjs keeps its comment scanner private and returns one `{line, text}` per
 *   block comment, which cannot give the exact line of each tag inside a multi-line
 *   block. This module therefore ships its own character scanner (quotes, template
 *   literals and regex literals are skipped, so tags inside strings never count).
 * - The registry is injected. This module imports nothing and knows no other module.
 * - Malformed input is a no-op: a non-string `source` returns an empty result with
 *   no diagnostic, because "there was no text" is not a finding about the text.
 * - Generated and vendor file exclusion happens in the walker, before this parser:
 *   the parser is pure and sees only text a caller decided to scan.
 */

export const ANNOTATION_V2_SCHEMA = 'hq.annotation/2';
export const SOURCE_LINK_SCHEMA = 'hq.source-link/1';

export const ANNOTATION_V2_TAGS = [
  'type', 'capability', 'effect', 'evidence', 'contract', 'emits', 'consumes', 'action', 'test',
];

const TAG_SET = new Set(ANNOTATION_V2_TAGS);

// versioned-id tags resolve through the injected registry; effect/evidence/test do not.
const VERSIONED_TAGS = new Set(['type', 'capability', 'contract', 'emits', 'consumes', 'action']);

const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const textOrNull = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

// ---------------------------------------------------------------------------
// Value grammar
// ---------------------------------------------------------------------------

const VERSIONED_ID_RE = /^[a-z0-9][a-z0-9._-]*@\d+(?:\.\d+)*$/;
const EFFECT_CLASS_RE = /^[a-z0-9-]+:[a-z0-9-]+$/;

/** Validate `name@version`: lowercase name, numeric dotted version. */
export function isVersionedId(value) {
  return typeof value === 'string' && VERSIONED_ID_RE.test(value);
}

/** Validate an effect class such as `host:config-write`. */
export function isEffectClass(value) {
  return typeof value === 'string' && EFFECT_CLASS_RE.test(value);
}

/** Validate an evidence ref: a `test:` prefix plus a non-empty remainder. */
export function isEvidenceRef(value) {
  if (typeof value !== 'string') return false;
  if (!value.startsWith('test:')) return false;
  return value.slice('test:'.length).trim().length > 0;
}

const GRAMMAR = {
  type: isVersionedId,
  capability: isVersionedId,
  contract: isVersionedId,
  emits: isVersionedId,
  consumes: isVersionedId,
  action: isVersionedId,
  effect: isEffectClass,
  evidence: isEvidenceRef,
  test: isEvidenceRef,
};

// ---------------------------------------------------------------------------
// Secret paths
```

_First 80 of 364 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
