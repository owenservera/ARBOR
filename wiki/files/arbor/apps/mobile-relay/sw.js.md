# File: apps/mobile-relay/sw.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/sw.js |
| Language | JavaScript |
| Kind | source |
| Size | 9574 B |
| Lines | 233 |
| Hash | 569add8dc06a |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CACHE | variable | 8 | no | var CACHE = &#39;vivim-relay-shell-v32&#39;; |
| CACHE_PREFIX | variable | 9 | no | var CACHE_PREFIX = &#39;vivim-relay-shell-&#39;; |
| SHELL_PATHS | variable | 12 | no | var SHELL_PATHS = [ |
| resolveBase | function | 93 | no | function resolveBase() { |
| scope | variable | 94 | no | var scope = &#39;&#39;; |
| BASE | variable | 104 | no | var BASE = resolveBase(); |
| ORIGIN | variable | 105 | no | var ORIGIN = BASE ? BASE.origin : &#39;&#39;; |
| SHELL | variable | 106 | no | var SHELL = {}; |
| INDEX_PATH | variable | 107 | no | var INDEX_PATH = &#39;&#39;; |
| i | variable | 108 | no | var i; |
| cacheKey | function | 118 | no | function cacheKey(pathname) { |
| isCacheableShell | function | 124 | no | function isCacheableShell(response) { |
| hasHeader | function | 128 | no | function hasHeader(request, name) { |
| handles | function | 137 | no | function handles(request) { |
| url | variable | 140 | no | var url; |
| jobs | variable | 161 | no | var jobs = []; |
| path | variable | 162 | no | var path; |
| target | variable | 166 | no | var target; |
| jobs | variable | 188 | no | var jobs = []; |
| request | variable | 199 | no | var request = event.request; |
| url | variable | 202 | no | var url; |
| pathname | variable | 204 | no | var pathname = url.pathname; |
| copy | variable | 210 | no | var copy; |
| stored | variable | 214 | no | var stored = cache.put(cacheKey(pathname), copy); |
| fallback | variable | 225 | no | var fallback = SHELL[pathname] === true ? pathname : INDEX_PATH; |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// VIVIM relay shell service worker. It caches ONLY the read-only app shell so a repeat open is
// served from disk and an offline open still renders the last shell. API traffic, auth-bearing
// requests, mutations and cross-origin requests are never intercepted, cached or replayed: the
// existing "no replayed writes" invariant is unchanged. Network-first, so a PC edit is picked up
// on the next load; the cache is only the fallback. ES5 syntax on purpose: older Android WebViews
// can run this file, and it deliberately avoids optional chaining, nullish coalescing, arrow
// functions and top-level await.
var CACHE = 'vivim-relay-shell-v32';
var CACHE_PREFIX = 'vivim-relay-shell-';
// Paths are relative to the worker's scope, so the same file serves both the Direct Host mount
// (scope /mobile/, files at /mobile/app.js) and the cloud deployment (scope /, files at /app.js).
var SHELL_PATHS = [
  '',
  'index.html',
  'app.js',
  'transport.mjs',
  'visual-bootstrap.mjs',
  'control-phone.mjs',
  'control-client.mjs',
  'control-chat.mjs',
  'control-language.mjs',
  'composer-assist.mjs',
  'wiki-source-view.mjs',
  'ux/model.mjs',
  'ux/mission-experience.mjs',
  'ux/render.mjs',
  'ux/readiness.mjs',
  'ux/launcher.mjs',
  'ux/launcher-ui.mjs',
  'ux/shell-inspection.mjs',
  'ux/shell-presentation.mjs',
  'ux/local-notes.mjs',
  'ux/local-notes-ui.mjs',
  'ux/voice-capture.mjs',
  'ux/local-dictation.mjs',
  'bootstrap-f02.mjs',
  'bootstrap-phone.mjs',
  'visual-theme.mjs',
  'build-composer.mjs',
  'vec-engines/compiler.mjs',
  'vec-engines/registry.mjs',
  'vec-engines/catalog.mjs',
  'vec-engines/validators.mjs',
  'vec-engines/enum-choices.mjs',
  'generative-ui/bootstrap-adapters.mjs',
  'generative-ui/catalog.mjs',
  'generative-ui/compiler.mjs',
  'generative-ui/design-composer.mjs',
  'generative-ui/phone-surface.mjs',
  'generative-ui/host-revision-guard.mjs',
  'generative-ui/portable-digest.mjs',
  'generative-ui/renderer.mjs',
  'generative-ui/workspace-live-data.mjs',
  'tierflow-runtime/document/schema.ts',
  'tierflow-runtime/document/validate.ts',
  'tierflow-runtime/document/import-legacy.ts',
  'tierflow-runtime/render/dom.ts',
  'tierflow-runtime/render/spatial-fallback.ts',
  'tierflow-runtime/final-wave/lane-c/templates.ts',
  'generative-ui/semantic-projection.mjs',
  'nlcl/frames.mjs',
  'nlcl/grammar.mjs',
  'nlcl/ground.mjs',
  'nlcl/index.mjs',
  'nlcl/interpret.mjs',
  'nlcl/lexer.mjs',
  'nlcl/project.mjs',
  'nlcl/recognize.mjs',
  'nlcl/symbols.mjs',
  'nlcl/text.mjs',
  'nlcl/types.mjs',
  'vec/compiler.mjs',
  'vec/ui-adapter.mjs',
  'vec/ui-taxonomy/catalog.mjs',
  'vec/ui-taxonomy/registry.mjs',
  'build-canvas.mjs',
  'welcome.mjs',
  'pairing-link.mjs',
  'device-enrollment.mjs',
  'browser-device-key.mjs',
```

_First 80 of 234 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
