# File: apps/vivim-host/test/control-desktop-surface.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/control-desktop-surface.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5403 B |
| Lines | 84 |
| Hash | 40b05a7851ff |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 11 | no | const root = fileURLToPath(new URL(&#39;../public/&#39;, import.meta.url)); |
| html | const | 14 | no | const html = readFileSync(path.join(root, &#39;index.html&#39;), &#39;utf8&#39;); |
| script | const | 15 | no | const script = readFileSync(path.join(root, &#39;control-panel.js&#39;), &#39;utf8&#39;); |
| dataRoot | const | 34 | no | const dataRoot = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-control-surfaces-&#39;)); |
| runtime | const | 35 | no | const runtime = createBootstrapRuntime({ dataRoot, file: &#39;:memory:&#39; }); |
| c | const | 38 | no | const c = createControlDispatcher({ dataRoot, runtime }); |
| phoneSensitive | const | 39 | no | const phoneSensitive = c.plan({ text: &#39;Never mention my former employer&#39; }, { source: &#39;mobile&#39; }); |
| mobile | const | 44 | no | const mobile = c.plan({ text: &#39;set my theme to dusk&#39; }, { source: &#39;mobile&#39; }); |
| desktop | const | 51 | no | const desktop = c.plan({ actionId: &#39;ui.theme.set_preset&#39;, args: { preset: &#39;ember&#39; } }, { source: &#39;desktop&#39; }); |
| pcSensitive | const | 57 | no | const pcSensitive = c.plan({ text: &#39;Never mention my former employer&#39; }, { source: &#39;desktop&#39; }); |
| dataRoot | const | 64 | no | const dataRoot = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-control-web-&#39;)); |
| server | const | 65 | no | const server = createHostServer({ dataRoot, ownerToken: &#39;test-owner-secret-not-for-browser&#39; }); |
| base | const | 68 | no | const base = &#39;http://127.0.0.1:&#39; + server.address().port; |
| asset | const | 69 | no | const asset = await fetch(base + &#39;/control-panel.js&#39;); |
| content | const | 71 | no | const content = await asset.text(); |
| authenticated | const | 75 | no | const authenticated = await fetch(base + &#39;/api/host/control/catalog&#39;, { headers: { authorization: &#39;Bearer test-owner-secret-not-for-browser&#39; } }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:url | import | 4 | external |
| node:os | import | 5 | external |
| node:path | import | 6 | external |
| ../server.mjs | import | 7 | [apps/vivim-host/server.mjs](../server.mjs.md) |
| ../bootstrap/runtime.mjs | import | 8 | [apps/vivim-host/bootstrap/runtime.mjs](../bootstrap/runtime.mjs.md) |
| ../control/dispatcher.mjs | import | 9 | [apps/vivim-host/control/dispatcher.mjs](../control/dispatcher.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 85 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
