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
  'first-contact-composer.ts',
  'agent-composer-adapter.ts',
  'transport.mjs',
  'visual-bootstrap.mjs',
  'control-phone.mjs',
  'private-shares-ui.mjs',
  'control-client.mjs',
  'control-chat.mjs',
  'control-language.mjs',
  'composer-assist.mjs',
  'provider-handoff.mjs',
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
  'vec-engines/rust-wasm.mjs',
  'wasm/vivim_programmability_core.wasm',
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
  'manifest.webmanifest',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'fonts/space-grotesk-latin-wght-normal.woff2',
  'fonts/geist-latin-wght-normal.woff2',
  'fonts/jetbrains-mono-latin-wght-normal.woff2'
];

const expectedKeys = (base) => new Set(SHELL_FILES.map((file) => new URL(file, base).href));

function shellResponse(body = 'shell', { ok = true, status = 200, type = 'basic', redirected = false } = {}) {
  return {
    ok,
    status,
    type,
    redirected,
    body,
    clone() {
      return shellResponse(body, { ok, status, type, redirected });
    }
  };
}

function createCache(name) {
  const entries = new Map();
  return {
    name,
    entries,
    async match(key) { return entries.get(String(key)); },
    async put(key, response) { entries.set(String(key), response); },
    async delete(key) { return entries.delete(String(key)); },
    async keys() { return [...entries.keys()]; }
  };
}

function createCacheStorage(names = []) {
  const store = new Map(names.map((name) => [name, createCache(name)]));
  return {
    store,
    get(name) { return store.get(name); },
    async open(name) {
      if (!store.has(name)) store.set(name, createCache(name));
      return store.get(name);
    },
    async keys() { return [...store.keys()]; },
    async delete(name) { return store.delete(name); }
  };
}

function makeRequest(url, { method = 'GET', mode = 'cors', headers = {} } = {}) {
  const h = new Headers();
  for (const [key, value] of Object.entries(headers)) h.set(key, value);
  return { url, method, mode, headers: h };
}

function loadWorker({ scope = ROOT, script, fetchImpl, existing = [] } = {}) {
  const listeners = new Map();
  const fetchCalls = [];
  const calls = { skipped: 0, claimed: 0, requests: [] };
  const caches = createCacheStorage(existing);
  const location = new URL(script || new URL('sw.js', scope).href);
  const self = {
    location,
    registration: { scope },
    addEventListener(type, handler) { listeners.set(type, handler); },
    skipWaiting() { calls.skipped += 1; return Promise.resolve(); },
    clients: { claim() { calls.claimed += 1; return Promise.resolve(); } }
  };
  const sandbox = {
    self,
    caches,
    URL,
    Promise,
    console,
    fetch(url, init) {
      fetchCalls.push({ url, init });
      calls.requests.push(url);
      return fetchImpl(url, init);
    }
  };
  vm.runInNewContext(SW_SOURCE, sandbox, { filename: 'sw.js' });

  const handler = (type) => {
    assert.ok(listeners.has(type), `sw.js must register a ${type} listener`);
    return listeners.get(type);
  };

  async function install() {
    let pending;
    handler('install')({ waitUntil(promise) { pending = promise; } });
    assert.ok(pending, 'install must call waitUntil');
    await pending;
  }

  async function activate() {
    let pending;
    handler('activate')({ waitUntil(promise) { pending = promise; } });
    assert.ok(pending, 'activate must call waitUntil');
    await pending;
  }

  async function runFetch(request) {
    const state = { responded: false, response: null, resolved: null, extra: [], request };
    handler('fetch')({
      request,
      respondWith(promise) { state.responded = true; state.response = promise; },
      waitUntil(promise) { if (promise) state.extra.push(promise); }
    });
    if (!state.responded) return state;
    state.resolved = await state.response.then((value) => ({ value }), (error) => ({ error }));
    // Let any waitUntil registered after respondWith settle before the assertions run.
    await new Promise((resolve) => setTimeout(resolve, 0));
    await Promise.all(state.extra.map((promise) => Promise.resolve(promise).catch(() => {})));
    return state;
  }

  return { self, caches, calls, fetchCalls, listeners, install, activate, runFetch };
}

test('install precaches every shell asset from the network with cache reload', async () => {
  const failure = new URL('app.js', ROOT).href;
  const seen = [];
  const worker = loadWorker({
    fetchImpl: async (url, init) => {
      seen.push({ url, cache: init && init.cache });
      if (url === failure) throw new Error('network down');
      return shellResponse(url);
    }
  });
  await worker.install();

  const cache = worker.caches.get(CACHE);
  assert.ok(cache, 'install must create the versioned shell cache');
  const keys = new Set(await cache.keys());
  const expected = expectedKeys(ROOT);
  assert.equal(SHELL_FILES.length, expected.size, 'shell list has no duplicate entries');
  assert.equal(SHELL_FILES.length, 82);
  assert.deepEqual(SHELL_FILES, SW_SHELL_PATHS, 'the suite shell list must mirror sw.js SHELL_PATHS');
  expected.delete(failure);
  assert.deepEqual(keys, expected);

  const cachedFailure = [...keys].some((key) => key === failure);
  assert.equal(cachedFailure, false, 'a failed asset is not cached');

  assert.equal(seen.length, SHELL_FILES.length, 'every shell asset is fetched once');
  for (const call of seen) assert.equal(call.cache, 'reload', 'precache must bypass the HTTP cache');

  assert.equal(worker.calls.skipped, 1, 'install must skipWaiting even when one asset fails');
  assert.equal(worker.calls.claimed, 0, 'install must not claim clients');
});

test('install resolves shell paths against the worker scope, including the Direct Host mount', async () => {
  const seen = [];
  const worker = loadWorker({
    scope: DIRECT,
    script: new URL('sw.js', DIRECT).href,
    fetchImpl: async (url) => {
      seen.push(url);
      return shellResponse(url);
    }
  });
  await worker.install();

  const keys = new Set(await worker.caches.get(CACHE).keys());
  assert.deepEqual(keys, expectedKeys(DIRECT));
  assert.ok(keys.has(`${DIRECT}app.js`), 'direct shell keeps the /mobile/ prefix');
  assert.ok(keys.has(`${DIRECT}fonts/geist-latin-wght-normal.woff2`), 'direct shell caches the fonts');
  assert.ok(seen.every((url) => url.startsWith(DIRECT)), 'precache never leaves the worker scope');
  assert.equal(worker.calls.skipped, 1);
});

test('activate deletes older shell caches only and claims clients', async () => {
  const worker = loadWorker({
    existing: ['vivim-relay-shell-v0', 'vivim-relay-shell-v1', 'vivim-relay-shell-v2', 'vivim-mobile-shell-v5', 'unrelated-cache'],
    fetchImpl: async () => shellResponse()
  });
  await worker.activate();

  // Activate only deletes retired generations; it never opens the current cache.
  const remaining = new Set(await worker.caches.keys());
  assert.deepEqual(remaining, new Set(['vivim-mobile-shell-v5', 'unrelated-cache']));
  assert.ok(!remaining.has('vivim-relay-shell-v2'), 'the previous shell generation is deleted');
  assert.equal(worker.calls.claimed, 1, 'activate must claim clients');
});

test('fetch is network-first and refreshes the cached shell on success', async () => {
  const url = new URL('app.js', ROOT).href;
  const worker = loadWorker({ fetchImpl: async () => shellResponse('fresh-app') });
  const state = await worker.runFetch(makeRequest(url));

  assert.equal(state.responded, true);
  assert.equal(state.resolved.value.body, 'fresh-app');
  assert.equal(state.extra.length, 1, 'a cacheable response is written through waitUntil');

  const cached = await worker.caches.get(CACHE).match(url);
  assert.ok(cached, 'the shell response replaces the cached copy');
  assert.equal(cached.body, 'fresh-app');
});

test('fetch falls back to the cached shell when the network fails', async () => {
  const worker = loadWorker({ fetchImpl: async () => { throw new Error('offline'); } });
  const cache = await worker.caches.open(CACHE);
  await cache.put(new URL('', ROOT).href, shellResponse('last-shell'));
  await cache.put(new URL('index.html', ROOT).href, shellResponse('last-shell-index'));
  await cache.put(new URL('app.js', ROOT).href, shellResponse('cached-app'));

  const navigation = await worker.runFetch(makeRequest(ROOT, { mode: 'navigate' }));
  assert.equal(navigation.responded, true);
  assert.equal(navigation.resolved.value.body, 'last-shell', 'offline navigation renders the last shell');

  const startUrl = await worker.runFetch(makeRequest('https://phone.example/mobile', { mode: 'navigate' }));
  assert.equal(startUrl.resolved.value.body, 'last-shell-index', 'an unprecached start_url still falls back to the shell');

  const asset = await worker.runFetch(makeRequest(new URL('app.js', ROOT).href));
  assert.equal(asset.resolved.value.body, 'cached-app', 'a module request falls back to its own cached copy');
});

test('fetch rejects when the network fails and no shell is cached', async () => {
  const worker = loadWorker({ fetchImpl: async () => { throw new Error('offline'); } });
  const state = await worker.runFetch(makeRequest(new URL('app.js', ROOT).href));
  assert.equal(state.responded, true);
  assert.ok(state.resolved.error instanceof Error);
  assert.equal(state.resolved.error.message, 'offline');
});

test('fetch never intercepts APIs, auth, mutations, ranges or cross-origin traffic', async () => {
  const worker = loadWorker({ fetchImpl: async () => shellResponse() });
  const cases = [
    ['cloud API read', makeRequest('https://phone.example/api/relay?path=session')],
    ['direct API read', makeRequest('https://phone.example/mobile/api/relay?path=session')],
    ['direct control API', makeRequest('https://phone.example/mobile/api/control/world')],
    ['API navigation', makeRequest('https://phone.example/api/relay?path=session', { mode: 'navigate' })],
    ['cross-origin shell path', makeRequest('https://other.example/app.js')],
    ['cross-origin font', makeRequest('https://fonts.example/fonts/geist-latin-wght-normal.woff2')],
    ['POST mutation', makeRequest('https://phone.example/mobile/api/relay?path=commands', { method: 'POST' })],
    ['POST to a shell path', makeRequest(new URL('app.js', ROOT).href, { method: 'POST' })],
    ['bearer request', makeRequest(new URL('app.js', ROOT).href, { headers: { authorization: 'Bearer secret' } })],
    ['device grant request', makeRequest(new URL('app.js', ROOT).href, { headers: { 'x-vivim-grant-id': 'private-grant' } })],
    ['device session request', makeRequest(new URL('app.js', ROOT).href, { headers: { 'x-vivim-device-session': 'private-session' } })],
    ['range request', makeRequest(new URL('app.js', ROOT).href, { headers: { range: 'bytes=0-99' } })],
    ['pairing token link', makeRequest('https://phone.example/pair?token=one-time', { mode: 'navigate' })]
  ];
  for (const [label, request] of cases) {
    const state = await worker.runFetch(request);
    assert.equal(state.responded, false, `${label} must reach the network untouched`);
    assert.equal(state.extra.length, 0, `${label} must not schedule a cache write`);
  }
  const cache = worker.caches.get(CACHE);
  assert.equal(cache, undefined, 'no cache entry is created for skipped traffic');
});

test('fetch does not cache error or opaque responses', async () => {
  const url = new URL('app.js', ROOT).href;
  const serverError = loadWorker({ fetchImpl: async () => shellResponse('boom', { ok: false, status: 500 }) });
  const failed = await serverError.runFetch(makeRequest(url));
  assert.equal(failed.resolved.value.status, 500, 'the live error is returned unchanged');
  const errorKeys = await serverError.caches.get(CACHE).keys();
  assert.deepEqual(errorKeys, [], 'a 500 response is never cached');

  const opaque = loadWorker({ fetchImpl: async () => shellResponse('opaque', { type: 'opaque' }) });
  const unknown = await opaque.runFetch(makeRequest(url));
  assert.equal(unknown.resolved.value.type, 'opaque');
  const opaqueKeys = await opaque.caches.get(CACHE).keys();
  assert.deepEqual(opaqueKeys, [], 'an opaque response is never cached');

  const redirect = loadWorker({ fetchImpl: async () => shellResponse('redirected', { redirected: true }) });
  await redirect.runFetch(makeRequest(url));
  const redirectKeys = await redirect.caches.get(CACHE).keys();
  assert.deepEqual(redirectKeys, [], 'a redirected response is not stored as the shell');
});

test('sw.js stays ES5-safe for older Android WebViews', () => {
  // No arrow functions, no template literals, no const/let, no optional chaining, no nullish
  // coalescing, no top-level await. Promises are the only modern primitive used.
  assert.equal(/=>/.test(SW_SOURCE), false, 'no arrow functions');
  assert.equal(/`/.test(SW_SOURCE), false, 'no template literals');
  assert.equal(/\b(?:const|let)\b/.test(SW_SOURCE), false, 'no block-scoped declarations');
  assert.equal(/(\?\.)|(\?\?)/.test(SW_SOURCE), false, 'no optional chaining or nullish coalescing');
  assert.equal(/^\s*await\b/m.test(SW_SOURCE), false, 'no top-level await');
  assert.equal(/async\s+(?:function|\()/.test(SW_SOURCE), false, 'no async functions');
});


test('unrelated HTML navigations never masquerade as the offline PWA', async () => {
  const worker = loadWorker({ fetchImpl: async () => shellResponse('should not cache') });
  for (const route of ['/host/control','/admin','/docs/unrelated','/mobile/other']) {
    const state = await worker.runFetch(makeRequest('https://phone.example'+route,{mode:'navigate'}));
    assert.equal(state.responded,false,'unrelated navigation '+route);
  }
  const direct = loadWorker({ scope:DIRECT, fetchImpl: async () => shellResponse() });
  const nested = await direct.runFetch(makeRequest(DIRECT+'not-a-pwa-page',{mode:'navigate'}));
  assert.equal(nested.responded,false);
  const launch = await direct.runFetch(makeRequest(DIRECT,{mode:'navigate'}));
  assert.equal(launch.responded,true);
});
