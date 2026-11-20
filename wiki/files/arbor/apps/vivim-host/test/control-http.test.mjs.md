# File: apps/vivim-host/test/control-http.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/control-http.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11252 B |
| Lines | 152 |
| Hash | 4b1ef8d45400 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 12 | no | const root = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-control-http-&#39;)); |
| origin | const | 13 | no | const origin = &#39;https://control.example.ts.net&#39;; |
| ownerToken | const | 14 | no | const ownerToken = &#39;owner-test-token-&#39;.repeat(3); |
| server | const | 15 | no | const server = createHostServer({ dataRoot: root, ownerToken, directPhone: { origin, user: &#39;owner@example.com&#39; } }); |
| call | function | 18 | no | function call(url, { method = &#39;GET&#39;, headers = {}, body } = {}) { |
| req | const | 20 | no | const req = http.request({ hostname: &#39;127.0.0.1&#39;, port: server.address().port, path: url, method, headers: { host: &#39;localhost&#39;, ...headers } }, res =&gt; { const chunks = []; res.on(&#39;data&#39;, x =&gt; chunks.… |
| chunks | const | 22 | no | const chunks = []; res.on(&#39;data&#39;, x =&gt; chunks.push(x)); |
| bearer | const | 28 | no | const bearer = { authorization: &#39;Bearer &#39; + ownerToken }; |
| desk | const | 29 | no | const desk = { ...bearer, origin: &#39;http://localhost&#39;, &#39;x-vivim-control&#39;: &#39;1&#39;, &#39;content-type&#39;: &#39;application/json&#39; }; |
| post | function | 30 | no | const post = (url, headers, obj) =&gt; call(url, { method: &#39;POST&#39;, headers, body: JSON.stringify(obj) }); |
| catalog | const | 34 | no | const catalog = await call(&#39;/api/host/control/catalog&#39;, { headers: bearer }); |
| grant | const | 42 | no | const grant = await post(&#39;/api/host/bootstrap/grant&#39;, { ...bearer, origin: &#39;http://localhost&#39;, &#39;x-vivim-bootstrap&#39;: &#39;1&#39;, &#39;content-type&#39;: &#39;application/json&#39; }, { scope: &#39;onboarding-visual&#39; }); |
| plan | const | 44 | no | const plan = await post(&#39;/api/host/control/plan&#39;, desk, { text: &#39;Set my theme to dusk&#39; }); |
| receipt | const | 50 | no | const receipt = await post(&#39;/api/host/control/execute&#39;, desk, { planId: plan.json.planId, planDigest: plan.json.planDigest }); |
| wikiBefore | const | 58 | no | const wikiBefore = await call(&#39;/api/wiki&#39;); |
| nlWiki | const | 61 | no | const nlWiki = await post(&#39;/api/host/control/plan&#39;, desk, { text: &#39;Edit wiki section Main/HowTo saying Updated instructions&#39; }); |
| wikiReceipt | const | 71 | no | const wikiReceipt = await post(&#39;/api/host/control/execute&#39;, desk, { planId: nlWiki.json.planId, planDigest: nlWiki.json.planDigest }); |
| wikiReplay | const | 77 | no | const wikiReplay = await post(&#39;/api/host/control/execute&#39;, desk, { planId: nlWiki.json.planId, planDigest: nlWiki.json.planDigest }); |
| staleWiki | const | 81 | no | const staleWiki = await post(&#39;/api/host/control/plan&#39;, desk, { actionId: &#39;wiki.section.edit&#39;, args: { target: &#39;Main/HowTo&#39;, content: &#39;stale plan&#39; } }); |
| newerWiki | const | 83 | no | const newerWiki = await post(&#39;/api/host/control/plan&#39;, desk, { actionId: &#39;wiki.section.edit&#39;, args: { target: &#39;Main/HowTo&#39;, content: &#39;newer content&#39; } }); |
| proxy | const | 96 | no | const proxy = { host: &#39;control.example.ts.net&#39;, &#39;x-forwarded-proto&#39;: &#39;https&#39;, &#39;tailscale-user-login&#39;: &#39;owner@example.com&#39; }; |
| publicKeyPem | const | 104 | no | const publicKeyPem = publicKey.export({ type: &#39;spki&#39;, format: &#39;pem&#39; }); |
| enrollment | const | 105 | no | const enrollment = createEnrollment({ dataRoot: root, origin: null, user: null }); |
| start | const | 108 | no | const start = (await call(&#39;/mobile/api/enrollment/start&#39;, { method: &#39;POST&#39;, headers: { ...proxy, &#39;content-type&#39;: &#39;application/json&#39; }, body: &#39;{}&#39; })).json; |
| transcript | const | 111 | no | const transcript = [&#39;vivim-enrollment-v1&#39;, start.challengeId, start.challenge, start.nonce, origin, &#39;owner@example.com&#39;].join(&#39;\\\\n&#39;); |
| proof | const | 112 | no | const proof = sign(&#39;sha256&#39;, Buffer.from(transcript), privateKey).toString(&#39;base64&#39;); |
| deviceGrant | const | 113 | no | const deviceGrant = (await call(&#39;/mobile/api/enrollment/prove&#39;, { method: &#39;POST&#39;, headers: { ...proxy, &#39;content-type&#39;: &#39;application/json&#39; }, body: JSON.stringify({ challengeId: start.challengeId, pub… |
| nonce | const | 122 | no | const nonce = randomBytes(16).toString(&#39;hex&#39;); |
| timestamp | const | 123 | no | const timestamp = Date.now(); |
| signedSession | const | 124 | no | const signedSession = [&#39;vivim-session-v1&#39;, deviceGrant.grantId, nonce, String(timestamp), origin, &#39;owner@example.com&#39;].join(&#39;\\\\n&#39;); |
| sessionProof | const | 125 | no | const sessionProof = sign(&#39;sha256&#39;, Buffer.from(signedSession), privateKey).toString(&#39;base64&#39;); |
| session | const | 126 | no | const session = (await call(&#39;/mobile/api/enrollment/session&#39;, { method: &#39;POST&#39;, headers: { ...proxy, &#39;content-type&#39;: &#39;application/json&#39; }, body: JSON.stringify({ grantId: deviceGrant.grantId, nonce, … |
| device | const | 131 | no | const device = { &#39;x-vivim-grant-id&#39;: deviceGrant.grantId, &#39;x-vivim-device-session&#39;: session.sessionId }; |
| phone | const | 132 | no | const phone = { ...proxy, ...device, origin, &#39;x-vivim-control&#39;: &#39;1&#39;, &#39;content-type&#39;: &#39;application/json&#39; }; |
| mobileCatalog | const | 133 | no | const mobileCatalog = await call(&#39;/mobile/api/control/catalog&#39;, { headers: { ...proxy, ...device } }); |
| pack | const | 135 | no | const pack = await call(&#39;/mobile/api/control/language&#39;, { headers: { ...proxy, ...device } }); |
| mobilePlan | const | 138 | no | const mobilePlan = await post(&#39;/mobile/api/control/plan&#39;, phone, { text: &#39;Set my theme to ember&#39; }); |
| mobileReceipt | const | 141 | no | const mobileReceipt = await post(&#39;/mobile/api/control/execute&#39;, phone, { planId: mobilePlan.json.planId, planDigest: mobilePlan.json.planDigest }); |
| replay | const | 144 | no | const replay = await post(&#39;/mobile/api/control/execute&#39;, phone, { planId: mobilePlan.json.planId, planDigest: mobilePlan.json.planDigest }); |
| ambiguous | const | 146 | no | const ambiguous = await post(&#39;/mobile/api/control/plan&#39;, phone, { text: &#39;stop all traffic&#39; }); |
| read | const | 148 | no | const read = await post(&#39;/mobile/api/control/plan&#39;, phone, { text: &#39;show my theme&#39; }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:http | import | 3 | external |
| node:crypto | import | 4 | external |
| ../apk/enrollment.mjs | import | 5 | [apps/vivim-host/apk/enrollment.mjs](../apk/enrollment.mjs.md) |
| node:fs | import | 6 | external |
| node:os | import | 7 | external |
| node:path | import | 8 | external |
| ../server.mjs | import | 9 | [apps/vivim-host/server.mjs](../server.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { generateKeyPairSync, sign, randomBytes } from 'node:crypto';
import { createEnrollment } from '../apk/enrollment.mjs';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHostServer } from '../server.mjs';

test('desktop and Direct mobile share one dispatcher with separate real authentication', async t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'vivim-control-http-'));
  const origin = 'https://control.example.ts.net';
  const ownerToken = 'owner-test-token-'.repeat(3);
  const server = createHostServer({ dataRoot: root, ownerToken, directPhone: { origin, user: 'owner@example.com' } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); try { rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 }); } catch { /* leftover temp: enrollment sqlite handle lingers on Windows */ } });
  function call(url, { method = 'GET', headers = {}, body } = {}) {
    return new Promise((resolve, reject) => {
      const req = http.request({ hostname: '127.0.0.1', port: server.address().port, path: url, method,
        headers: { host: 'localhost', ...headers } }, res => {
          const chunks = []; res.on('data', x => chunks.push(x));
          res.on('end', () => { const text = Buffer.concat(chunks).toString('utf8'); let json = null; try { json = JSON.parse(text); } catch { /* not json */ } resolve({ status: res.statusCode, json }); });
        });
      req.on('error', reject); req.end(body);
    });
  }
  const bearer = { authorization: 'Bearer ' + ownerToken };
  const desk = { ...bearer, origin: 'http://localhost', 'x-vivim-control': '1', 'content-type': 'application/json' };
  const post = (url, headers, obj) => call(url, { method: 'POST', headers, body: JSON.stringify(obj) });

  // --- desktop authentication ---
  assert.equal((await call('/api/host/control/catalog')).status, 401);
  const catalog = await call('/api/host/control/catalog', { headers: bearer });
  assert.equal(catalog.status, 200);
  assert.equal(catalog.json.status, 'plan_and_dispatch');
  assert.equal((await post('/api/host/control/plan', { ...bearer, 'content-type': 'application/json' }, { text: 'Set my theme to dusk' })).status, 403);
  assert.equal((await post('/api/host/control/plan', { ...desk, origin: 'https://evil.invalid' }, { text: 'Set my theme to dusk' })).status, 403);
  assert.equal((await call('/api/host/control/nope', { headers: bearer })).status, 404);

  // --- plan is not an effect; execution needs the exact digest ---
  const grant = await post('/api/host/bootstrap/grant', { ...bearer, origin: 'http://localhost', 'x-vivim-bootstrap': '1', 'content-type': 'application/json' }, { scope: 'onboarding-visual' });
  assert.equal(grant.status, 200);
  const plan = await post('/api/host/control/plan', desk, { text: 'Set my theme to dusk' });
  assert.equal(plan.status, 200);
  assert.equal(plan.json.actionId, 'ui.theme.set_preset');
  assert.equal(plan.json.outcome, 'approval_required');
  assert.equal(plan.json.executionPerformed, false);
  assert.equal((await post('/api/host/control/execute', desk, { planId: plan.json.planId, planDigest: '0'.repeat(64) })).status, 409);
  const receipt = await post('/api/host/control/execute', desk, { planId: plan.json.planId, planDigest: plan.json.planDigest });
  assert.equal(receipt.status, 200);
  assert.equal(receipt.json.status, 'applied');
  assert.equal(receipt.json.approvedVia, 'desktop-owner-token');
  assert.equal((await call('/api/host/control/plans/' + plan.json.planId, { headers: bearer })).json.state, 'applied');

  // --- Actual mounted HTTP → Host Control → product Wiki journal ---
  // Host Wiki is mutated only after approved Control plan and remains projected from disk.
  const wikiBefore = await call('/api/wiki');
  assert.equal(wikiBefore.status, 200);
  assert.equal(wikiBefore.json.revision, 1);
  const nlWiki = await post('/api/host/control/plan', desk,
    { text: 'Edit wiki section Main/HowTo saying Updated instructions' });
  assert.equal(nlWiki.status, 200, JSON.stringify(nlWiki.json));
  assert.equal(nlWiki.json.actionId, 'wiki.section.edit');
  assert.equal(nlWiki.json.outcome, 'approval_required');
  assert.deepEqual(nlWiki.json.preview, {
    target: 'Main/HowTo', before: wikiBefore.json.pages.Main.sections.HowTo,
    after: 'Updated instructions', expectedRevision: 1
  });
  assert.deepEqual((await call('/api/wiki')).json, wikiBefore.json, 'preview alone must never mutate');
  const wikiReceipt = await post('/api/host/control/execute', desk,
    { planId: nlWiki.json.planId, planDigest: nlWiki.json.planDigest });
  assert.equal(wikiReceipt.status, 200, JSON.stringify(wikiReceipt.json));
  assert.equal(wikiReceipt.json.status, 'applied');
  assert.equal(wikiReceipt.json.result.wikiRevision, 2);
  assert.equal((await call('/api/wiki')).json.pages.Main.sections.HowTo, 'Updated instructions');
  const wikiReplay = await post('/api/host/control/execute', desk,
    { planId: nlWiki.json.planId, planDigest: nlWiki.json.planDigest });
  assert.equal(wikiReplay.json.replayed, true);
  assert.equal((await call('/api/wiki')).json.revision, 2, 'replay must not append again');
```

_First 80 of 153 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
