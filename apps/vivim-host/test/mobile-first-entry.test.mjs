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
        let body = '';
        res.setEncoding('utf8');
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, text: body }));
      });
      req.on('error', reject);
      req.end();
    });

    const phone = await directGet({
      host: 'vivim.test.ts.net',
      'x-forwarded-proto': 'https',
      'tailscale-user-login': 'owner@example.com'
    });
    assert.equal(phone.status, 200);
    assert.match(phone.text, /id="v-talk"/);

    const wrongUser = await directGet({
      host: 'vivim.test.ts.net',
      'x-forwarded-proto': 'https',
      'tailscale-user-login': 'not-owner@example.com'
    });
    assert.equal(wrongUser.status, 403);
  } finally {
    await new Promise(resolve => server.close(resolve));
    rmSync(root, { recursive: true, force: true });
  }
});


test('the phone shell exposes all canonical sections and Today launches existing surfaces', () => {
  const html = source('../../mobile-relay/index.html');
  const render = source('../../mobile-relay/ux/render.mjs');
  const model = source('../../mobile-relay/ux/model.mjs');
  for (const tab of ['today', 'talk', 'build', 'world', 'me', 'control']) {
    assert.ok(html.includes('data-tab="' + tab + '"'), 'navigation for ' + tab);
    assert.ok(model.includes("'" + tab + "'"), 'canonical tab ' + tab);
  }
  for (const tab of ['talk', 'build', 'world', 'me', 'control']) {
    assert.ok(render.includes("['" + tab + "'"), 'Today shortcut for ' + tab);
  }
  assert.match(render, /options\.onNavigate\(tab\)/);
  assert.match(html, /\.ux-surface-tiles/);
  assert.match(html, /id="v-soon" hidden aria-hidden="true"/);
});


test('PWA Host view is scoped to the owner browser session and never exposes device credentials', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'vivim-pwa-owner-view-'));
  const ownerToken = 'owner-unit-test-token-for-pwa-0001';
  const server = createHostServer({ dataRoot: root, ownerToken });
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;
    const route = '/api/host/control/pwa-view';
    assert.equal((await fetch(base + route)).status, 401);
    assert.equal((await fetch(base + route, { method: 'POST' })).status, 401);
    const order = source('../server.mjs').split("if (route === 'pwa-view') {")[1];
    assert.ok(order.indexOf("if(!verifyOwnerToken") < order.indexOf("const media = await"),
      'unauthorized callers must not trigger private reads');
    const issue = await fetch(base + '/api/host/control/ui-session', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + ownerToken, origin: base, 'x-vivim-control': '1' }
    });
    assert.equal(issue.status, 201);
    const { code } = await issue.json();
    const exchange = await fetch(base + '/api/host/control/ui-exchange', {
      method: 'POST',
      headers: { origin: base, 'x-vivim-control': '1', 'content-type': 'application/json' },
      body: JSON.stringify({ code })
    });
    assert.equal(exchange.status, 200);
    const { csrf } = await exchange.json();
    const cookie = exchange.headers.get('set-cookie')?.split(';')[0];
    assert.ok(/^vivim_control_ui=[a-f0-9]{64}$/.test(cookie || ''), 'the session cookie is HttpOnly');
    assert.match(exchange.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
    const headers = { cookie };
    assert.equal((await fetch(base + route, { headers: { ...headers, origin: 'https://evil.invalid' } })).status, 403);
    assert.equal((await fetch(base + route, { method: 'POST', headers })).status, 405);
    const response = await fetch(base + route, { headers });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    const data = await response.json();
    assert.equal(data.schema, 'vivim.host-pwa-view/1');
    assert.equal(data.snapshot.control.schema, 'vivim.control-recent/1');
    assert.ok(Array.isArray(data.snapshot.control.recent));
    assert.ok(Array.isArray(data.snapshot.bootstrap.cards));
    assert.deepEqual(data.snapshot.bootstrap.preferences, []);
    assert.deepEqual(data.snapshot.bootstrap.hardNos, []);
    assert.equal(data.snapshot.devices.total, 0);
    assert.equal(JSON.stringify(data).includes(ownerToken), false);
    assert.equal(JSON.stringify(data).includes('sessionId'), false);
    assert.equal(JSON.stringify(data).includes('grantId'), false);
    const logOut = await fetch(base + '/api/host/control/ui-logout', {
      method: 'POST',
      headers: { ...headers, origin: base, 'x-vivim-control': '1', 'x-vivim-ui-csrf': csrf }
    });
    assert.equal(logOut.status, 200);
    assert.equal((await fetch(base + route, { headers })).status, 401);
  } finally {
    await new Promise(resolve => server.close(resolve));
    rmSync(root, { recursive: true, force: true });
  }
});


test('desktop PWA reads Host owner view without granting any phone or Build effect', () => {
  const app = source('../../mobile-relay/app.js');
  const surface = source('../../mobile-relay/generative-ui/phone-surface.mjs');
  const model = source('../../mobile-relay/ux/model.mjs');
  assert.match(app, /fetch\('\/api\/host\/control\/pwa-view'/);
  assert.match(app, /credentials: 'same-origin', cache: 'no-store'/);
  assert.match(app, /if \(build\) build\.clear\(\)/);
  assert.match(app, /S\.tab = 'talk'; N\.target = 'vivim'; N\.pending = null/);
  assert.match(app, /readOnly: HOST_PREVIEW/);
  assert.match(app, /\$\('control-preview'\)\.disabled = true/);
  assert.match(surface, /if \(readOnly \|\| pending \|\| !surface/);
  assert.match(model, /Local Host owner view/);
});

test('PWA-first pairing keeps one-use QR in browser and exposes approval/revocation states', () => {
  const app = source('../../mobile-relay/app.js');
  const html = source('../../mobile-relay/index.html');
  assert.match(app, /function showBrowserPairHelp\(problem\)/);
  assert.doesNotMatch(app, /vivim:\/\/pair\?pairUrl=/);
  assert.match(app, /No pairing code has been consumed/);
  assert.match(app, /showPairingState\('pending'\)/);
  assert.match(app, /showPairingState\(device\.status\)/);
  assert.match(app, /showPairingState\('error'/);
  assert.match(app, /if \(transport\.direct\) \$\('pair-legacy'\)\.hidden = true/);
  assert.match(html, /id="pair-check"/);
  assert.match(html, /id="pair-legacy"/);
});

test('Build VEC modules are served through the PWA shell and Direct Host', () => {
  const direct = source('../direct-phone.mjs');
  const sw = source('../../mobile-relay/sw.js');
  const composer = source('../../mobile-relay/build-composer.mjs');
  const canvas = source('../../mobile-relay/build-canvas.mjs');
  const html = source('../../mobile-relay/index.html');
  const manifest = JSON.parse(source('../../mobile-relay/manifest.webmanifest'));
  for (const module of ['vec/compiler.mjs', 'vec/ui-adapter.mjs',
    'vec/ui-taxonomy/catalog.mjs', 'vec/ui-taxonomy/registry.mjs']) {
    assert.ok(direct.includes("'" + module + "':"), module + ' in Direct allowlist');
    assert.ok(sw.includes("'" + module + "'"), module + ' in shell cache');
  }
  assert.match(composer, /resolveBuildRequest/);
  assert.match(canvas, /local\.outcome === 'candidate'/);
  assert.match(html, /rel="manifest" href="manifest.webmanifest"/);
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.icons[0].src, './icon.svg');
  assert.deepEqual(manifest.icons.slice(1).map(icon => [icon.src,icon.sizes,icon.purpose]), [
    ['./icon-192.png','192x192','any'],
    ['./icon-512.png','512x512','any'],
    ['./icon-maskable-512.png','512x512','maskable']
  ]);
  for (const filename of ['icon-192.png','icon-512.png','icon-maskable-512.png']) {
    assert.match(direct,new RegExp("'"+filename.replace('.','\\.')+"'\\s*:\\s*\\['"));
    assert.ok(sw.includes("'"+filename+"'"));
  }
});

test('installable PNG icons have exact PNG dimensions and safe manifest roles', () => {
  const manifest=JSON.parse(source('../../mobile-relay/manifest.webmanifest'));
  const icons=[
    {name:'icon-192.png',size:192,purpose:'any'},
    {name:'icon-512.png',size:512,purpose:'any'},
    {name:'icon-maskable-512.png',size:512,purpose:'maskable'}
  ];
  for(const item of icons){
    const binary=readFileSync(new URL('../../mobile-relay/'+item.name,import.meta.url));
    assert.ok(binary.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
    assert.equal(binary.toString('ascii',12,16),'IHDR');
    assert.equal(binary.readUInt32BE(16),item.size);
    assert.equal(binary.readUInt32BE(20),item.size);
    assert.equal(binary[24],2); // 2-bit indexed palette, bounded tiny offline asset
    assert.equal(binary[25],3); // indexed color
    assert.ok(binary.length>1000);
    const record=manifest.icons.find(icon=>icon.src==='./'+item.name);
    assert.equal(record.sizes,item.size+'x'+item.size);
    assert.equal(record.purpose,item.purpose);
  }
});

test('owner desktop PWA uses the same read-only HQ media summary and clears private state', () => {
  const server = source('../server.mjs');
  const app = source('../../mobile-relay/app.js');
  assert.match(server, /const media = await createMediaPlaybackService\(\)\.list\(\)/);
  assert.match(server, /schema: 'vivim.host-pwa-view\/1', observedAt: new Date\(\)\.toISOString\(\),\s*media,/);
  assert.match(app, /function clearPrivatePhoneState\(\)/);
  assert.match(app, /if \(device\.status !== 'active'\) \{\s*clearPrivatePhoneState\(\)/);
  assert.ok(app.includes('const sameGrant=()=>generation===mediaGeneration&&S.paired&&'));
  assert.ok(app.includes('if(!sameGrant())return;'));
  assert.match(app, /S\.media = data\.media\?\.schema === 'vivim.media-library-summary\/1'/);
});
