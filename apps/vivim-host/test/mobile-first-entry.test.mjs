import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
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
