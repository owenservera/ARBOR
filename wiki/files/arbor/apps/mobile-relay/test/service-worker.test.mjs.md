# File: apps/mobile-relay/test/service-worker.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/service-worker.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 17016 B |
| Lines | 387 |
| Hash | fc556c3651c3 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SW_SOURCE | const | 10 | no | const SW_SOURCE = readFileSync(new URL(&#39;../sw.js&#39;, import.meta.url), &#39;utf8&#39;); |
| SW_CACHE | const | 13 | no | const SW_CACHE = /^var CACHE = &#39;([^&#39;]+)&#39;;$/m.exec(SW_SOURCE); |
| SW_SHELL_PATHS | const | 14 | no | const SW_SHELL_PATHS = /var SHELL_PATHS = \\[([^\\]]*)\\];/.exec(SW_SOURCE)[1] |
| CACHE | const | 17 | no | const CACHE = SW_CACHE[1]; |
| ROOT | const | 19 | no | const ROOT = &#39;https://phone.example/&#39;; |
| DIRECT | const | 20 | no | const DIRECT = &#39;https://box.tailnet-example.ts.net/mobile/&#39;; |
| SHELL_FILES | const | 22 | no | const SHELL_FILES = [ |
| expectedKeys | function | 101 | no | const expectedKeys = (base) =&gt; new Set(SHELL_FILES.map((file) =&gt; new URL(file, base).href)); |
| shellResponse | function | 103 | no | function shellResponse(body = &#39;shell&#39;, { ok = true, status = 200, type = &#39;basic&#39;, redirected = false } = {}) { |
| createCache | function | 116 | no | function createCache(name) { |
| entries | const | 117 | no | const entries = new Map(); |
| createCacheStorage | function | 128 | no | function createCacheStorage(names = []) { |
| store | const | 129 | no | const store = new Map(names.map((name) =&gt; [name, createCache(name)])); |
| makeRequest | function | 142 | no | function makeRequest(url, { method = &#39;GET&#39;, mode = &#39;cors&#39;, headers = {} } = {}) { |
| h | const | 143 | no | const h = new Headers(); |
| loadWorker | function | 148 | no | function loadWorker({ scope = ROOT, script, fetchImpl, existing = [] } = {}) { |
| listeners | const | 149 | no | const listeners = new Map(); |
| fetchCalls | const | 150 | no | const fetchCalls = []; |
| calls | const | 151 | no | const calls = { skipped: 0, claimed: 0, requests: [] }; |
| caches | const | 152 | no | const caches = createCacheStorage(existing); |
| location | const | 153 | no | const location = new URL(script \|\| new URL(&#39;sw.js&#39;, scope).href); |
| self | const | 154 | no | const self = { |
| sandbox | const | 161 | no | const sandbox = { |
| handler | function | 175 | no | const handler = (type) =&gt; { |
| install | function | 180 | no | async function install() { |
| pending | variable | 181 | no | let pending; |
| activate | function | 187 | no | async function activate() { |
| pending | variable | 188 | no | let pending; |
| runFetch | function | 194 | no | async function runFetch(request) { |
| state | const | 195 | no | const state = { responded: false, response: null, resolved: null, extra: [], request }; |
| failure | const | 213 | no | const failure = new URL(&#39;app.js&#39;, ROOT).href; |
| seen | const | 214 | no | const seen = []; |
| worker | const | 215 | no | const worker = loadWorker({ fetchImpl: async (url, init) =&gt; { seen.push({ url, cache: init &amp;&amp; init.cache }); if (url === failure) throw new Error(&#39;network down&#39;); return shellResponse(url); |
| cache | const | 224 | no | const cache = worker.caches.get(CACHE); |
| keys | const | 226 | no | const keys = new Set(await cache.keys()); |
| expected | const | 227 | no | const expected = expectedKeys(ROOT); |
| cachedFailure | const | 234 | no | const cachedFailure = [...keys].some((key) =&gt; key === failure); |
| seen | const | 245 | no | const seen = []; |
| worker | const | 246 | no | const worker = loadWorker({ scope: DIRECT, script: new URL(&#39;sw.js&#39;, DIRECT).href, fetchImpl: async (url) =&gt; { seen.push(url); |
| keys | const | 256 | no | const keys = new Set(await worker.caches.get(CACHE).keys()); |
| worker | const | 265 | no | const worker = loadWorker({ existing: [&#39;vivim-relay-shell-v0&#39;, &#39;vivim-relay-shell-v1&#39;, &#39;vivim-relay-shell-v2&#39;, &#39;vivim-mobile-shell-v5&#39;, &#39;unrelated-cache&#39;], fetchImpl: async () =&gt; shellResponse() }); |
| remaining | const | 272 | no | const remaining = new Set(await worker.caches.keys()); |
| url | const | 279 | no | const url = new URL(&#39;app.js&#39;, ROOT).href; |
| worker | const | 280 | no | const worker = loadWorker({ fetchImpl: async () =&gt; shellResponse(&#39;fresh-app&#39;) }); |
| state | const | 281 | no | const state = await worker.runFetch(makeRequest(url)); |
| cached | const | 287 | no | const cached = await worker.caches.get(CACHE).match(url); |
| worker | const | 293 | no | const worker = loadWorker({ fetchImpl: async () =&gt; { throw new Error(&#39;offline&#39;); } }); |
| cache | const | 294 | no | const cache = await worker.caches.open(CACHE); |
| navigation | const | 299 | no | const navigation = await worker.runFetch(makeRequest(ROOT, { mode: &#39;navigate&#39; })); |
| startUrl | const | 303 | no | const startUrl = await worker.runFetch(makeRequest(&#39;https://phone.example/mobile&#39;, { mode: &#39;navigate&#39; })); |
| asset | const | 306 | no | const asset = await worker.runFetch(makeRequest(new URL(&#39;app.js&#39;, ROOT).href)); |
| worker | const | 311 | no | const worker = loadWorker({ fetchImpl: async () =&gt; { throw new Error(&#39;offline&#39;); } }); |
| state | const | 312 | no | const state = await worker.runFetch(makeRequest(new URL(&#39;app.js&#39;, ROOT).href)); |
| worker | const | 319 | no | const worker = loadWorker({ fetchImpl: async () =&gt; shellResponse() }); |
| cases | const | 320 | no | const cases = [ |
| state | const | 336 | no | const state = await worker.runFetch(request); |
| cache | const | 340 | no | const cache = worker.caches.get(CACHE); |
| url | const | 345 | no | const url = new URL(&#39;app.js&#39;, ROOT).href; |
| serverError | const | 346 | no | const serverError = loadWorker({ fetchImpl: async () =&gt; shellResponse(&#39;boom&#39;, { ok: false, status: 500 }) }); |
| failed | const | 347 | no | const failed = await serverError.runFetch(makeRequest(url)); |
| errorKeys | const | 349 | no | const errorKeys = await serverError.caches.get(CACHE).keys(); |
| opaque | const | 352 | no | const opaque = loadWorker({ fetchImpl: async () =&gt; shellResponse(&#39;opaque&#39;, { type: &#39;opaque&#39; }) }); |
| unknown | const | 353 | no | const unknown = await opaque.runFetch(makeRequest(url)); |
| opaqueKeys | const | 355 | no | const opaqueKeys = await opaque.caches.get(CACHE).keys(); |
| redirect | const | 358 | no | const redirect = loadWorker({ fetchImpl: async () =&gt; shellResponse(&#39;redirected&#39;, { redirected: true }) }); |
| redirectKeys | const | 360 | no | const redirectKeys = await redirect.caches.get(CACHE).keys(); |
| worker | const | 377 | no | const worker = loadWorker({ fetchImpl: async () =&gt; shellResponse(&#39;should not cache&#39;) }); |
| state | const | 379 | no | const state = await worker.runFetch(makeRequest(&#39;https://phone.example&#39;+route,{mode:&#39;navigate&#39;})); |
| direct | const | 382 | no | const direct = loadWorker({ scope:DIRECT, fetchImpl: async () =&gt; shellResponse() }); |
| nested | const | 383 | no | const nested = await direct.runFetch(makeRequest(DIRECT+&#39;not-a-pwa-page&#39;,{mode:&#39;navigate&#39;})); |
| launch | const | 385 | no | const launch = await direct.runFetch(makeRequest(DIRECT,{mode:&#39;navigate&#39;})); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 5 | external |
| node:assert/strict | import | 6 | external |
| node:fs | import | 7 | external |
| node:vm | import | 8 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Unit coverage for the relay shell service worker. Runs the real sw.js in node:vm with a fake
// service-worker global (self, caches, fetch, clients) so every branch is exercised without a
// browser. It asserts the cache allowlist, network-first behaviour, the offline shell fallback,
// and that API/auth/mutation/cross-origin traffic is never intercepted or stored.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SW_SOURCE = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
// The cache name and the shell list are seeded from sw.js itself so a version bump or a new
// asset cannot silently desynchronise this suite from the worker it exercises.
const SW_CACHE = /^var CACHE = '([^']+)';$/m.exec(SW_SOURCE);
const SW_SHELL_PATHS = /var SHELL_PATHS = \[([^\]]*)\];/.exec(SW_SOURCE)[1]
  .match(/'([^']*)'/g).map((entry) => entry.slice(1, -1));
assert.ok(SW_CACHE, 'sw.js must declare the versioned shell cache name');
const CACHE = SW_CACHE[1];

const ROOT = 'https://phone.example/';
const DIRECT = 'https://box.tailnet-example.ts.net/mobile/';

const SHELL_FILES = [
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
```

_First 80 of 388 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
