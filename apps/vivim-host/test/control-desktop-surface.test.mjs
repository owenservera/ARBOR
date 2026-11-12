import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import { createHostServer } from '../server.mjs';
import { createBootstrapRuntime } from '../bootstrap/runtime.mjs';
import { createControlDispatcher } from '../control/dispatcher.mjs';

const root = fileURLToPath(new URL('../public/', import.meta.url));

test('desktop command UI is linked from the Host root and uses a shared typed plan/execute API', () => {
  const html = readFileSync(path.join(root, 'index.html'), 'utf8');
  const script = readFileSync(path.join(root, 'control-panel.js'), 'utf8');
  for (const id of ['host-command-form', 'host-command-text',
    'host-command-submit', 'host-control-catalog', 'host-control-result', 'host-control-recent'])
    assert.match(html, new RegExp('id="' + id + '"'));
  assert.match(html, /src="\/control-panel\.js"/);
  assert.match(script, /api\('plan', body\)/);
  assert.match(script, /api\('execute', expected\)/);
  assert.match(script, /api\('plans\/'/);
  assert.match(script, /api\('catalog'/);
  assert.match(script, /plan\(\{ actionId: a\.actionId/);
  assert.match(script, /csrfProof = null/);
  assert.match(script, /ui-exchange/);
  assert.match(script, /ui-state/);
  assert.doesNotMatch(html, /id="host-owner-secret"/);
  assert.doesNotMatch(script, /localStorage|sessionStorage|document\.cookie|innerHTML|Bearer/);
  assert.doesNotMatch(html, /value="Bearer |owner-token/);
});

test('source-bound approval and sensitive phone fail-closed preserve the same Host journal', t => {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-control-surfaces-'));
  const runtime = createBootstrapRuntime({ dataRoot, file: ':memory:' });
  runtime.grantBootstrap({ scope: 'full-bootstrap' });
  t.after(() => { runtime.close(); rmSync(dataRoot, { recursive: true, force: true }); });
  const c = createControlDispatcher({ dataRoot, runtime });
  const phoneSensitive = c.plan({ text: 'Never mention my former employer' }, { source: 'mobile' });
  assert.equal(phoneSensitive.actionId, 'privacy.hard_no.add');
  assert.equal(phoneSensitive.outcome, 'unavailable');
  assert.match(phoneSensitive.precondition, /PC owner/);
  assert.equal(c.recent().length, 0, 'unavailable phone commands never create a journal plan');
  const mobile = c.plan({ text: 'set my theme to dusk' }, { source: 'mobile' });
  assert.equal(mobile.outcome, 'approval_required');
  assert.throws(() => c.execute({ planId: mobile.planId, planDigest: mobile.planDigest,
    approval: { channel: 'desktop-owner-token', actor: 'owner' } }), /CONTROL_APPROVAL_SOURCE_MISMATCH/);
  assert.equal(c.status(mobile.planId).state, 'planned');
  assert.equal(c.execute({ planId: mobile.planId, planDigest: mobile.planDigest,
    approval: { channel: 'direct-phone', actor: 'owner@example.com' } }).status, 'applied');
  const desktop = c.plan({ actionId: 'ui.theme.set_preset', args: { preset: 'ember' } }, { source: 'desktop' });
  assert.equal(desktop.outcome, 'approval_required');
  assert.throws(() => c.execute({ planId: desktop.planId, planDigest: desktop.planDigest,
    approval: { channel: 'direct-phone', actor: 'owner@example.com' } }), /CONTROL_APPROVAL_SOURCE_MISMATCH/);
  assert.equal(c.execute({ planId: desktop.planId, planDigest: desktop.planDigest,
    approval: { channel: 'desktop-owner-token', actor: 'owner' } }).status, 'applied');
  const pcSensitive = c.plan({ text: 'Never mention my former employer' }, { source: 'desktop' });
  assert.equal(pcSensitive.outcome, 'approval_required');
  assert.equal(c.execute({ planId: pcSensitive.planId, planDigest: pcSensitive.planDigest,
    approval: { channel: 'desktop-owner-token', actor: 'owner' } }).status, 'applied');
});

test('Host serves desktop panel but never hands out authorization to unauthenticated browsers', async t => {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-control-web-'));
  const server = createHostServer({ dataRoot, ownerToken: 'test-owner-secret-not-for-browser' });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); rmSync(dataRoot, { recursive: true, force: true }); });
  const base = 'http://127.0.0.1:' + server.address().port;
  const asset = await fetch(base + '/control-panel.js');
  assert.equal(asset.status, 200);
  const content = await asset.text();
  assert.match(content, /Host dispatcher/);
  assert.doesNotMatch(content, /test-owner-secret-not-for-browser/);
  assert.equal((await fetch(base + '/api/host/control/catalog')).status, 401);
  const authenticated = await fetch(base + '/api/host/control/catalog',
    { headers: { authorization: 'Bearer test-owner-secret-not-for-browser' } });
  assert.equal(authenticated.status, 200);
  assert.ok((await authenticated.json()).actions.length >= 10);
  assert.equal((await fetch(base + '/api/host/control/plan', {
    method: 'POST', headers: { authorization: 'Bearer test-owner-secret-not-for-browser',
      origin: 'https://evil.example', 'x-vivim-control': '1', 'content-type': 'application/json' },
    body: JSON.stringify({ text: 'set theme to dusk' })
  })).status, 403);
});
