# File: apps/vivim-host/test/mobile-first-entry.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/mobile-first-entry.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13523 B |
| Lines | 272 |
| Hash | f33a97297f0f |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| source | function | 9 | no | const source = relative =&gt; readFileSync(new URL(relative, import.meta.url), &#39;utf8&#39;); |
| root | const | 12 | no | const root = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-phone-first-&#39;)); |
| server | const | 13 | no | const server = createHostServer({ dataRoot: root }); |
| base | const | 16 | no | const base = &#39;http://127.0.0.1:&#39; + server.address().port; |
| home | const | 17 | no | const home = await fetch(base + &#39;/&#39;); |
| page | const | 19 | no | const page = await home.text(); |
| phone | const | 24 | no | const phone = await fetch(base + &#39;/mobile/?host-preview=1&#39;); |
| legacy | const | 32 | no | const legacy = await fetch(base + &#39;/host/control&#39;); |
| transport | const | 43 | no | const transport = source(&#39;../../mobile-relay/transport.mjs&#39;); |
| app | const | 44 | no | const app = source(&#39;../../mobile-relay/app.js&#39;); |
| wrapper | const | 45 | no | const wrapper = source(&#39;../public/mobile-first.js&#39;); |
| root | const | 55 | no | const root = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-pwa-dual-route-&#39;)); |
| server | const | 56 | no | const server = createHostServer({ dataRoot: root, directPhone: { origin: &#39;https://vivim.test.ts.net&#39;, user: &#39;owner@example.com&#39; } }); |
| base | const | 62 | no | const base = &#39;http://127.0.0.1:&#39; + server.address().port; |
| preview | const | 63 | no | const preview = await fetch(base + &#39;/mobile/?host-preview=1&#39;); |
| directGet | function | 77 | no | const directGet = (headers) =&gt; new Promise((resolve, reject) =&gt; { const req = http.request({ host: &#39;127.0.0.1&#39;, port: server.address().port, path: &#39;/mobile/&#39;, method: &#39;GET&#39;, headers }, res =&gt; { let b… |
| req | const | 78 | no | const req = http.request({ host: &#39;127.0.0.1&#39;, port: server.address().port, path: &#39;/mobile/&#39;, method: &#39;GET&#39;, headers }, res =&gt; { let body = &#39;&#39;; res.setEncoding(&#39;utf8&#39;); |
| body | variable | 81 | no | let body = &#39;&#39;; |
| phone | const | 90 | no | const phone = await directGet({ host: &#39;vivim.test.ts.net&#39;, &#39;x-forwarded-proto&#39;: &#39;https&#39;, &#39;tailscale-user-login&#39;: &#39;owner@example.com&#39; }); |
| wrongUser | const | 98 | no | const wrongUser = await directGet({ host: &#39;vivim.test.ts.net&#39;, &#39;x-forwarded-proto&#39;: &#39;https&#39;, &#39;tailscale-user-login&#39;: &#39;not-owner@example.com&#39; }); |
| html | const | 112 | no | const html = source(&#39;../../mobile-relay/index.html&#39;); |
| render | const | 113 | no | const render = source(&#39;../../mobile-relay/ux/render.mjs&#39;); |
| model | const | 114 | no | const model = source(&#39;../../mobile-relay/ux/model.mjs&#39;); |
| root | const | 129 | no | const root = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-pwa-owner-view-&#39;)); |
| ownerToken | const | 130 | no | const ownerToken = &#39;owner-unit-test-token-for-pwa-0001&#39;; |
| server | const | 131 | no | const server = createHostServer({ dataRoot: root, ownerToken }); |
| base | const | 134 | no | const base = &#39;http://127.0.0.1:&#39; + server.address().port; |
| route | const | 135 | no | const route = &#39;/api/host/control/pwa-view&#39;; |
| issue | const | 138 | no | const issue = await fetch(base + &#39;/api/host/control/ui-session&#39;, { method: &#39;POST&#39;, headers: { authorization: &#39;Bearer &#39; + ownerToken, origin: base, &#39;x-vivim-control&#39;: &#39;1&#39; } }); |
| exchange | const | 144 | no | const exchange = await fetch(base + &#39;/api/host/control/ui-exchange&#39;, { method: &#39;POST&#39;, headers: { origin: base, &#39;x-vivim-control&#39;: &#39;1&#39;, &#39;content-type&#39;: &#39;application/json&#39; }, body: JSON.stringify({ co… |
| cookie | const | 151 | no | const cookie = exchange.headers.get(&#39;set-cookie&#39;)?.split(&#39;;&#39;)[0]; |
| headers | const | 154 | no | const headers = { cookie }; |
| response | const | 157 | no | const response = await fetch(base + route, { headers }); |
| data | const | 160 | no | const data = await response.json(); |
| logOut | const | 171 | no | const logOut = await fetch(base + &#39;/api/host/control/ui-logout&#39;, { method: &#39;POST&#39;, headers: { ...headers, origin: base, &#39;x-vivim-control&#39;: &#39;1&#39;, &#39;x-vivim-ui-csrf&#39;: csrf } }); |
| app | const | 185 | no | const app = source(&#39;../../mobile-relay/app.js&#39;); |
| surface | const | 186 | no | const surface = source(&#39;../../mobile-relay/generative-ui/phone-surface.mjs&#39;); |
| model | const | 187 | no | const model = source(&#39;../../mobile-relay/ux/model.mjs&#39;); |
| app | const | 199 | no | const app = source(&#39;../../mobile-relay/app.js&#39;); |
| html | const | 200 | no | const html = source(&#39;../../mobile-relay/index.html&#39;); |
| direct | const | 213 | no | const direct = source(&#39;../direct-phone.mjs&#39;); |
| sw | const | 214 | no | const sw = source(&#39;../../mobile-relay/sw.js&#39;); |
| composer | const | 215 | no | const composer = source(&#39;../../mobile-relay/build-composer.mjs&#39;); |
| canvas | const | 216 | no | const canvas = source(&#39;../../mobile-relay/build-canvas.mjs&#39;); |
| html | const | 217 | no | const html = source(&#39;../../mobile-relay/index.html&#39;); |
| manifest | const | 218 | no | const manifest = JSON.parse(source(&#39;../../mobile-relay/manifest.webmanifest&#39;)); |
| manifest | const | 242 | no | const manifest=JSON.parse(source(&#39;../../mobile-relay/manifest.webmanifest&#39;)); |
| icons | const | 243 | no | const icons=[ |
| binary | const | 249 | no | const binary=readFileSync(new URL(&#39;../../mobile-relay/&#39;+item.name,import.meta.url)); |
| server | const | 264 | no | const server = source(&#39;../server.mjs&#39;); |
| app | const | 265 | no | const app = source(&#39;../../mobile-relay/app.js&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:http | import | 4 | external |
| node:os | import | 5 | external |
| node:path | import | 6 | external |
| ../server.mjs | import | 7 | [apps/vivim-host/server.mjs](../server.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createHostServer } from '../server.mjs';

const source = relative => readFileSync(new URL(relative, import.meta.url), 'utf8');

test('Host default loads only the actual mobile PWA, not legacy desktop modules', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'vivim-phone-first-'));
  const server = createHostServer({ dataRoot: root });
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;
    const home = await fetch(base + '/');
    assert.equal(home.status, 200);
    const page = await home.text();
    assert.match(page, /id="phone-surface"/);
    assert.match(page, /mobile-first\.js/);
    assert.doesNotMatch(page, /host\.js|control-panel\.js|onboarding\.js/);

    const phone = await fetch(base + '/mobile/?host-preview=1');
    assert.equal(phone.status, 200);
    assert.equal(phone.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.match(phone.headers.get('content-security-policy'), /frame-ancestors 'self'/);
    assert.match(await phone.text(), /id="v-talk"/);

    assert.equal((await fetch(base + '/mobile/')).status, 404);
    assert.equal((await fetch(base + '/mobile/api/relay?path=commands')).status, 404);
    const legacy = await fetch(base + '/host/control');
    assert.equal(legacy.status, 200);
    assert.match(await legacy.text(), /id="host-command-form"/);
    assert.equal((await fetch(base + '/onboarding')).status, 200);
  } finally {
    await new Promise(resolve => server.close(resolve));
    rmSync(root, { recursive: true, force: true });
  }
});

test('preview is local and cannot silently send or enroll a phone', () => {
  const transport = source('../../mobile-relay/transport.mjs');
  const app = source('../../mobile-relay/app.js');
  const wrapper = source('../public/mobile-first.js');
  assert.match(app, /HOST_PREVIEW/);
  assert.match(app, /if \(HOST_PREVIEW\) \{\s*toast\('This is your phone preview/);
  assert.match(app, /if \(HOST_PREVIEW\) void startHostPreview\(\); else start\(\)/);
  assert.match(wrapper, /\^#control-session=/);
  assert.match(transport, /x-vivim-device-session/);
});


test('desktop preview and trusted Direct phone remain separate when both are configured', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'vivim-pwa-dual-route-'));
  const server = createHostServer({
    dataRoot: root,
    directPhone: { origin: 'https://vivim.test.ts.net', user: 'owner@example.com' }
  });
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;
    const preview = await fetch(base + '/mobile/?host-preview=1');
    assert.equal(preview.status, 200);
    assert.equal(preview.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.match(await preview.text(), /id="v-talk"/);

    // The preview has static assets, never the authenticated phone APIs.
    assert.equal((await fetch(base + '/mobile/api/relay?path=commands')).status, 404);
    assert.equal((await fetch(base + '/mobile/api/enrollment/start', {
      method: 'POST',
      headers: { origin: base, 'content-type': 'application/json' },
      body: '{}'
    })).status, 405);

    // fetch() treats Host as a forbidden header, but the Direct handler routes on it.
    const directGet = (headers) => new Promise((resolve, reject) => {
      const req = http.request({
        host: '127.0.0.1', port: server.address().port, path: '/mobile/', method: 'GET', headers
      }, res => {
```

_First 80 of 273 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
