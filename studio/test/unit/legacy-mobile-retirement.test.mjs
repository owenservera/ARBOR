import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { retireMobileShell } from '../../src/studio/ui/mobile.mjs';

const file = name => readFileSync(new URL('../../src/studio/' + name, import.meta.url), 'utf8');

test('Studio mobile remains usable as a recovery view without installing another VIVIM PWA', () => {
  const html = file('ui/mobile.html');
  const studio = file('server.mjs');
  const module = file('ui/mobile.mjs');
  assert.doesNotMatch(html, /<link[^>]+rel=["']manifest["']/i);
  assert.doesNotMatch(module, /serviceWorker\.register\(/);
  assert.match(studio, /STUDIO_MOBILE_PWA_RETIRED/);
  assert.match(studio, /return send\(res, 410, \{ code: 'STUDIO_MOBILE_PWA_RETIRED' \}\)/);
  assert.match(studio, /'\/mobile-sw\.js'/, 'old clients can load the de-registration worker');
  assert.match(studio, /url\.pathname === '\/mobile'/, 'legacy capability view is still a compatibility route');
  assert.match(studio, /if \(!url\.pathname\.startsWith\('\/api\/'\)\)/, 'existing Studio API dispatch survives');
});

test('retireMobileShell unregisters only the exact old worker and never registers another', async () => {
  let unregistered = 0, registrationLookups = 0, registered = 0;
  const own = { active: { scriptURL: 'http://localhost:38730/mobile-sw.js' },
    unregister: async () => { unregistered++; return true; } };
  const nav = { serviceWorker: {
    getRegistration: async () => { registrationLookups++; return own; },
    register: () => { registered++; throw new Error('must not register'); }
  } };
  assert.equal(await retireMobileShell(nav, false), false);
  assert.equal(registrationLookups, 0);
  assert.equal(await retireMobileShell(nav, true), true);
  assert.equal(unregistered, 1);
  assert.equal(registered, 0);
  const foreign = { serviceWorker: { getRegistration: async () =>
    ({ active: { scriptURL: 'http://localhost:38730/not-vivim-sw.js' },
      unregister: async () => { throw new Error('foreign worker must not be removed'); } }) } };
  assert.equal(await retireMobileShell(foreign, true), false);
  assert.equal(await retireMobileShell({ serviceWorker: { getRegistration: async () => { throw Error('offline'); } } }, true), false);
});

test('retirement worker clears only Studio shell caches, unregisters, and intercepts zero fetches', async () => {
  const source = file('ui/mobile-sw.js');
  const handlers = new Map(), deleted = [], cacheKeys = [
    'vivim-mobile-shell-v4', 'vivim-mobile-shell-v5', 'other-app-shell'
  ];
  let unregisters = 0, skipped = 0;
  const scope = {
    self: {
      addEventListener(type, handler) { handlers.set(type, handler); },
      skipWaiting() { skipped++; return Promise.resolve(); },
      registration: { unregister() { unregisters++; return Promise.resolve(true); } }
    },
    caches: {
      keys: async () => cacheKeys,
      delete: async key => { deleted.push(key); return true; }
    }
  };
  vm.runInNewContext(source, scope, { timeout: 1000 });
  assert.deepEqual([...handlers.keys()], ['install', 'activate'], 'no fetch interception or effect replay');
  let installed, activated;
  handlers.get('install')({ waitUntil: promise => { installed = promise; } });
  await installed;
  handlers.get('activate')({ waitUntil: promise => { activated = promise; } });
  await activated;
  assert.equal(skipped, 1);
  assert.deepEqual(deleted, ['vivim-mobile-shell-v4', 'vivim-mobile-shell-v5']);
  assert.equal(unregisters, 1);
});
