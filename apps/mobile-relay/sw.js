// VIVIM relay shell service worker. It caches ONLY the read-only app shell so a repeat open is
// served from disk and an offline open still renders the last shell. API traffic, auth-bearing
// requests, mutations and cross-origin requests are never intercepted, cached or replayed: the
// existing "no replayed writes" invariant is unchanged. Network-first, so a PC edit is picked up
// on the next load; the cache is only the fallback. ES5 syntax on purpose: older Android WebViews
// can run this file, and it deliberately avoids optional chaining, nullish coalescing, arrow
// functions and top-level await.
var CACHE = 'vivim-relay-shell-v48';
var CACHE_PREFIX = 'vivim-relay-shell-';
// Paths are relative to the worker's scope, so the same file serves both the Direct Host mount
// (scope /mobile/, files at /mobile/app.js) and the cloud deployment (scope /, files at /app.js).
var SHELL_PATHS = [
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

// The scope is the registration scope when the platform exposes it, otherwise the script folder,
// which is the default scope for a worker registered without options.
function resolveBase() {
  var scope = '';
  try {
    if (self.registration && typeof self.registration.scope === 'string') scope = self.registration.scope;
  } catch (error) { scope = ''; }
  if (!scope) {
    try { scope = new URL('.', self.location.href).href; } catch (error) { scope = ''; }
  }
  try { return new URL(scope); } catch (error) { return null; }
}

var BASE = resolveBase();
var ORIGIN = BASE ? BASE.origin : '';
var SHELL = {};
var INDEX_PATH = '';
var i;

if (BASE) {
  for (i = 0; i < SHELL_PATHS.length; i += 1) {
    try { SHELL[new URL(SHELL_PATHS[i], BASE).pathname] = true; } catch (error) { /* skip malformed entry */ }
  }
  try { INDEX_PATH = new URL('index.html', BASE).pathname; } catch (error) { INDEX_PATH = ''; }
}

// Cache keys are absolute URLs so install and fetch always agree on the same entry.
function cacheKey(pathname) {
  try { return new URL(pathname, BASE).href; } catch (error) { return pathname; }
}

// Only a real, same-origin, successful document/script/font response may enter the shell cache.
// Opaque, redirected-away, error and partial responses are never stored.
function isCacheableShell(response) {
  return !!response && response.ok === true && response.type === 'basic' && response.redirected !== true;
}

// Never replace a known-good offline shell with an installation lacking its entrypoints.
// Optional secondary assets may fail; the document and its boot script may not.
function isCriticalShell(entry) {
  return entry === '' || entry === 'index.html' || entry === 'app.js';
}

function hasHeader(request, name) {
  try {
    if (!request.headers || typeof request.headers.get !== 'function') return false;
    return !!request.headers.get(name);
  } catch (error) { return true; }
}

// True only for a request this worker is allowed to answer: GET, same origin, not API, not
// auth-bearing, not a range read, and either a navigation or an exact shell asset.
function handles(request) {
  if (!BASE || !request) return false;
  if (request.method !== 'GET') return false;
  var url;
  try { url = new URL(request.url); } catch (error) { return false; }
  if (url.origin !== ORIGIN) return false;
  if (url.pathname.indexOf('/api/') !== -1) return false;
  // A pairing link must reach the PC to redeem its token; an offline shell must never pretend it did.
  try { if (url.searchParams && url.searchParams.has('token')) return false; } catch (error) { return true; }
  if (hasHeader(request, 'authorization') || hasHeader(request, 'range') ||
      hasHeader(request, 'x-vivim-grant-id') || hasHeader(request, 'x-vivim-device-session')) return false;
  if (request.mode === 'navigate') {
    // Offline HTML fallback belongs only to the real PWA entrypoints. Never
    // return the phone shell for unrelated same-origin pages on Cloud.
    return url.pathname === BASE.pathname || url.pathname === INDEX_PATH ||
      (BASE.pathname === '/' && (url.pathname === '/mobile' || url.pathname === '/pair'));
  }
  return SHELL[url.pathname] === true;
}

self.addEventListener('install', function (event) {
  event.waitUntil((function () {
    if (!BASE) return Promise.resolve();
    return caches.open(CACHE).then(function (cache) {
      var jobs = [];
      var path;
      for (var n = 0; n < SHELL_PATHS.length; n += 1) {
        path = SHELL_PATHS[n];
        jobs.push((function (entry) {
          var target;
          try { target = new URL(entry, BASE).href; } catch (error) { return Promise.resolve(); }
          // cache: 'reload' bypasses the HTTP cache so an upgrade never precaches an old copy.
          var critical = isCriticalShell(entry);
          return fetch(target, { cache: 'reload', credentials: 'same-origin' }).then(function (response) {
            if (!isCacheableShell(response)) {
              if (critical) throw new Error('Critical PWA shell asset was not cacheable: ' + entry);
              return null;
            }
            return cache.put(cacheKey(new URL(target).pathname), response);
          }).catch(function (error) {
            if (critical) throw error;
            return null;
          });
        }(path)));
      }
      // Optional assets are best effort; a missing core entrypoint rejects this update.
      return Promise.all(jobs).then(function () { return null; });
    });
  }()).then(function () {
    return self.skipWaiting();
  }).catch(function (error) {
    // Reject the broken generation rather than activate it and delete the last good cache.
    return caches.delete(CACHE).catch(function () { return false; }).then(function () {
      throw error;
    });
  }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    var jobs = [];
    for (var n = 0; n < keys.length; n += 1) {
      if (keys[n].indexOf(CACHE_PREFIX) === 0 && keys[n] !== CACHE) jobs.push(caches.delete(keys[n]));
    }
    return Promise.all(jobs);
  }).then(function () {
    return self.clients.claim();
  }));
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (!handles(request)) return; // APIs, mutations, auth and cross-origin traffic go straight to the network
  event.respondWith(new Promise(function (resolve, reject) {
    var url;
    try { url = new URL(request.url); } catch (error) { reject(error); return; }
    var pathname = url.pathname;
    Promise.resolve().then(function () {
      return caches.open(CACHE).catch(function () { return null; });
    }).then(function (cache) {
      fetch(request).then(function (response) {
        if (cache && isCacheableShell(response)) {
          var copy;
          try { copy = response.clone(); } catch (error) { copy = null; }
          if (copy) {
            try {
              var stored = cache.put(cacheKey(pathname), copy);
              if (stored && typeof stored.catch === 'function') stored.catch(function () { return null; });
              if (typeof event.waitUntil === 'function') event.waitUntil(stored);
            } catch (error) { /* a failed write never fails the response */ }
          }
        }
        resolve(response); // errors, redirects and 4xx/5xx pass through uncached
      }).catch(function (error) {
        if (!cache) { reject(error); return; }
        // Any same-origin navigation falls back to the last shell document, even when the exact
        // pathname was never precached (for example the /mobile start_url rewrite).
        var fallback = SHELL[pathname] === true ? pathname : INDEX_PATH;
        cache.match(cacheKey(fallback)).then(function (cached) {
          if (cached) { resolve(cached); return; }
          reject(error);
        }, function () { reject(error); });
      });
    });
  }));
});
