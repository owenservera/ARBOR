import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('HOST_PREVIEW gate is strict and preview skips service worker registration', () => {
  assert.match(
    app,
    /const HOST_PREVIEW = new URLSearchParams\(location\.search\)\.get\('host-preview'\) === '1'\s*&& \['localhost', '127\.0\.0\.1', '\[::1\]'\]\.includes\(location\.hostname\)\s*&& location\.pathname\.startsWith\('\/mobile\/'\);/
  );
  assert.match(app, /if \(!HOST_PREVIEW && 'serviceWorker' in navigator\) \{/);
});

test('preview blocks send/update paths and renders read-only shell state', () => {
  assert.match(app, /if \(!S\.paired && !HOST_PREVIEW\) \{/);
  assert.match(
    app,
    /if \(HOST_PREVIEW\) \{\s*toast\('This is your phone preview\. Pair a phone or open Host Control to perform actions\.'\);\s*return;/
  );
  assert.match(app, /function updateSend\(\) \{\s*if \(HOST_PREVIEW \|\| !S\.paired\) \{ \$\('send'\)\.disabled = true; return; \}/);
  assert.match(app, /S\.paired = false;\s*S\.cmds = \[\]; S\.convs = \[\]; S\.active = null;/);
  assert.match(app, /setConn\('Desktop preview [^']*owner authorization required', true\);/);
});

test('preview exchanges one-use control-session hash and erases it from URL', () => {
  assert.match(app, /if \(fragment\.startsWith\('#control-session='\)\) \{/);
  assert.match(app, /history\.replaceState\(null, '', location\.pathname \+ location\.search\);/);
  assert.match(app, /const match = \/\^#control-session=\(\[a-f0-9\]\{64\}\)\$\/\.exec\(fragment\);/);
  assert.match(app, /await fetch\('\/api\/host\/control\/ui-exchange', \{/);
  assert.match(app, /'x-vivim-control': '1'/);
  assert.match(app, /body: JSON\.stringify\(\{ code: match\[1\] \}\)/);
});

test('host preview menu is built by installHostMenu with required links and attributes', () => {
  assert.match(app, /function installHostMenu\(\) \{/);
  assert.match(app, /section\.id = 'host-preview-menu';/);
  assert.match(app, /section\.setAttribute\('aria-label', 'Host utilities'\);/);
  for (const href of ['/onboarding', '/host/control', '/api/host/status']) {
    assert.ok(app.includes(`'${href}'`), `missing host menu link ${href}`);
  }
  assert.match(app, /\$\('gear'\)\.setAttribute\('aria-controls', section\.id\);/);
  // The menu is injected at runtime; a static duplicate in the document would drift.
  assert.doesNotMatch(html, /id="host-preview-menu"/);
});

test('start path uses preview init when HOST_PREVIEW is set', () => {
  assert.match(app, /if \(HOST_PREVIEW\) void startHostPreview\(\); else start\(\);/);
});
