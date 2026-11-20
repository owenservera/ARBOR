# File: apps/mobile-relay/bootstrap-phone.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/bootstrap-phone.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6238 B |
| Lines | 131 |
| Hash | 9855b5a9dc8b |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PROJECTION_SCHEMA | const | 7 | yes | export const PROJECTION_SCHEMA = &#39;vivim.bootstrap-phone/1&#39;; |
| PROJECTION_CACHE_KEY | const | 8 | yes | export const PROJECTION_CACHE_KEY = &#39;vivim.bootstrap.projection.v1&#39;; |
| CACHE_MAX_AGE_MS | const | 9 | no | const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; |
| CACHE_MAX_WORLDS | const | 10 | no | const CACHE_MAX_WORLDS = 5; |
| ID | const | 11 | no | const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/; |
| BAD_VALUE | const | 12 | no | const BAD_VALUE = /url\\(\|javascript:\|expression\\(\|[;&lt;&gt;]/i; const THEME_CSS_KEYS = new Set([&#39;--bg&#39;,&#39;--s1&#39;,&#39;--s2&#39;,&#39;--bd&#39;,&#39;--tx&#39;,&#39;--mu&#39;,&#39;--ac&#39;,&#39;--ac2&#39;, &#39;--vivim-background-image&#39;,&#39;--vivim-font-family&#39;,&#39;… |
| THEME_CSS_KEYS | const | 13 | no | const THEME_CSS_KEYS = new Set([&#39;--bg&#39;,&#39;--s1&#39;,&#39;--s2&#39;,&#39;--bd&#39;,&#39;--tx&#39;,&#39;--mu&#39;,&#39;--ac&#39;,&#39;--ac2&#39;, &#39;--vivim-background-image&#39;,&#39;--vivim-font-family&#39;,&#39;--vivim-base-font-size&#39;, &#39;--vivim-heading-font-size&#39;,&#39;--viv… |
| isPlainObject | function | 17 | no | const isPlainObject = v =&gt; !!v &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v); |
| readProjection | function | 21 | yes | export function readProjection(statusPayload) { |
| snapshot | const | 23 | no | const snapshot = statusPayload.snapshot; |
| projection | variable | 25 | no | let projection = snapshot.bootstrap; |
| personalAgent | const | 27 | no | const personalAgent = snapshot.personalAgent; |
| cacheKey | function | 39 | yes | export function cacheKey(_worldId) { |
| looksLikeProjection | function | 43 | no | function looksLikeProjection(p) { |
| safeParse | function | 49 | no | function safeParse(raw) { |
| readBlob | function | 54 | no | function readBlob(storage) { |
| raw | variable | 56 | no | let raw = null; |
| parsed | const | 58 | no | const parsed = safeParse(raw); |
| cacheProjection | function | 64 | yes | export function cacheProjection(storage, projection) { |
| blob | const | 67 | no | const blob = readBlob(storage); |
| prior | const | 68 | no | const prior = blob.worlds[projection.worldId]?.projection; |
| entries | const | 76 | no | const entries = Object.entries(blob.worlds) |
| readCachedProjection | function | 87 | yes | export function readCachedProjection(storage) { |
| blob | const | 88 | no | const blob = readBlob(storage); |
| now | const | 89 | no | const now = Date.now(); |
| best | variable | 90 | no | let best = null, bestAt = -Infinity; |
| at | const | 94 | no | const at = Date.parse(entry.observedAt); |
| cssEntries | function | 104 | yes | export function cssEntries(projection) { |
| out | const | 106 | no | const out = []; |
| PHASE_LABELS | const | 116 | no | const PHASE_LABELS = Object.freeze({ connecting: &#39;Connecting&#39;, learning: &#39;Learning your style&#39;, shaping: &#39;Shaping your look&#39;, deepening: &#39;Refining details&#39;, |
| phaseLabel | function | 125 | yes | export function phaseLabel(phase) { |
| undoCommand | function | 129 | yes | export function undoCommand() { |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/test/bootstrap-phone.test.mjs](./test/bootstrap-phone.test.mjs.md) | ../bootstrap-phone.mjs |
| [apps/mobile-relay/visual-bootstrap.mjs](./visual-bootstrap.mjs.md) | ./bootstrap-phone.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// grokbot-authored. Pure, browser-safe ESM. No DOM, no node imports, no network, no throw on bad input.
// Reads the phone-facing bootstrap projection from a host /status payload, caches it locally
// (scoped by worldId, inside one storage blob), and exposes small trusted helpers for app.js
// and visual-bootstrap.mjs. Every string from the host is treated as untrusted display text:
// callers must use textContent, never innerHTML, and must never evaluate it.

export const PROJECTION_SCHEMA = 'vivim.bootstrap-phone/1';
export const PROJECTION_CACHE_KEY = 'vivim.bootstrap.projection.v1';
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const CACHE_MAX_WORLDS = 5;
const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/;
const BAD_VALUE = /url\(|javascript:|expression\(|[;<>]/i;
const THEME_CSS_KEYS = new Set(['--bg','--s1','--s2','--bd','--tx','--mu','--ac','--ac2',
  '--vivim-background-image','--vivim-font-family','--vivim-base-font-size',
  '--vivim-heading-font-size','--vivim-corner-radius','--vivim-spacing-scale','--vivim-accent-ink','--vivim-appearance']);

const isPlainObject = v => !!v && typeof v === 'object' && !Array.isArray(v);

// Tolerates missing snapshot, missing personalAgent, wrong schema, non-object input.
// Tries the current top-level location first, then falls back to the older nested one.
export function readProjection(statusPayload) {
  if (!isPlainObject(statusPayload)) return null;
  const snapshot = statusPayload.snapshot;
  if (!isPlainObject(snapshot)) return null;
  let projection = snapshot.bootstrap;
  if (!isPlainObject(projection)) {
    const personalAgent = snapshot.personalAgent;
    projection = isPlainObject(personalAgent) ? personalAgent.bootstrap : null;
  }
  if (!isPlainObject(projection)) return null;
  if (projection.schema !== PROJECTION_SCHEMA) return null;
  if (typeof projection.worldId !== 'string' || !ID.test(projection.worldId)) return null;
  if (typeof projection.observedAt !== 'string') return null;
  return projection;
}

// One fixed storage key; worldId scoping happens inside the single JSON blob, so callers
// never need to know the live worldId before the first network round trip.
export function cacheKey(_worldId) {
  return PROJECTION_CACHE_KEY;
}

function looksLikeProjection(p) {
  return isPlainObject(p) && p.schema === PROJECTION_SCHEMA
    && typeof p.worldId === 'string' && ID.test(p.worldId)
    && typeof p.observedAt === 'string' && Number.isFinite(Date.parse(p.observedAt));
}

function safeParse(raw) {
  if (typeof raw !== 'string' || !raw) return null;
  try { const v = JSON.parse(raw); return isPlainObject(v) ? v : null; } catch { return null; }
}

function readBlob(storage) {
  if (!storage || typeof storage.getItem !== 'function') return { v: 1, worlds: {} };
  let raw = null;
  try { raw = storage.getItem(PROJECTION_CACHE_KEY); } catch { raw = null; }
  const parsed = safeParse(raw);
  if (!parsed || !isPlainObject(parsed.worlds)) return { v: 1, worlds: {} };
  return parsed;
}

// Never throws. Silently does nothing if projection or storage is unusable.
export function cacheProjection(storage, projection) {
  if (!storage || typeof storage.setItem !== 'function') return false;
  if (!looksLikeProjection(projection)) return false;
  const blob = readBlob(storage);
  const prior = blob.worlds[projection.worldId]?.projection;
  // An out-of-order relay response must never roll back approved personalization.
  if (looksLikeProjection(prior) && Number.isSafeInteger(prior.revision)) {
    if (!Number.isSafeInteger(projection.revision) || projection.revision < prior.revision) return false;
    if (projection.revision === prior.revision && Date.parse(projection.observedAt) < Date.parse(prior.observedAt)) return false;
  }
  if (Date.parse(projection.observedAt) > Date.now() + 120000) return false;
  blob.worlds[projection.worldId] = { observedAt: projection.observedAt, projection };
  const entries = Object.entries(blob.worlds)
    .filter(([, v]) => isPlainObject(v) && typeof v.observedAt === 'string' && Number.isFinite(Date.parse(v.observedAt)))
    .sort((a, b) => Date.parse(b[1].observedAt) - Date.parse(a[1].observedAt))
    .slice(0, CACHE_MAX_WORLDS);
  blob.worlds = Object.fromEntries(entries);
```

_First 80 of 132 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
