# File: apps/vivim-host/test/control-wiki-phone.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/control-wiki-phone.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13520 B |
| Lines | 217 |
| Hash | c304fd9ce683 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| dataRoot | const | 13 | no | const dataRoot = mkdtempSync(path.join(os.tmpdir(), &#39;arbor-wiki-phone-&#39;)); |
| origin | const | 14 | no | const origin = &#39;https://wiki-phone.example.ts.net&#39;; |
| user | const | 15 | no | const user = &#39;owner@example.com&#39;; |
| runtime | const | 16 | no | const runtime = createBootstrapRuntime({ dataRoot }); |
| server | const | 17 | no | const server = createHostServer({ dataRoot, bootstrap: runtime, onboarding: { phoneSeen() {}, primary: () =&gt; null }, directPhone: { origin, user } }); |
| port | const | 27 | no | const port = server.address().port; |
| headers | const | 28 | no | const headers = { host: &#39;wiki-phone.example.ts.net&#39;, |
| deviceHeaders | variable | 30 | no | let deviceHeaders = {}; |
| call | function | 31 | no | const call = (route, { method = &#39;GET&#39;, body, extra = {} } = {}) =&gt; |
| req | const | 33 | no | const req = httpRequest({ host: &#39;127.0.0.1&#39;, port, path: route, method, headers: { ...headers, ...deviceHeaders, ...extra } }, res =&gt; { let response = &#39;&#39;; res.on(&#39;data&#39;, chunk =&gt; { response += chunk;… |
| response | variable | 35 | no | let response = &#39;&#39;; |
| publicKeyPem | const | 53 | no | const publicKeyPem = publicKey.export({ type: &#39;spki&#39;, format: &#39;pem&#39; }); |
| challenge | const | 54 | no | const challenge = (await call(&#39;/mobile/api/enrollment/start&#39;, { method: &#39;POST&#39;, extra: { &#39;content-type&#39;: &#39;application/json&#39; }, body: {} })).body; |
| transcript | const | 57 | no | const transcript = [&#39;vivim-enrollment-v1&#39;, challenge.challengeId, |
| grant | const | 59 | no | const grant = (await call(&#39;/mobile/api/enrollment/prove&#39;, { method: &#39;POST&#39;, extra: { &#39;content-type&#39;: &#39;application/json&#39; }, body: { challengeId: challenge.challengeId, publicKeyPem, signature: sign(&#39;s… |
| owner | const | 66 | no | const owner = createEnrollment({ dataRoot, origin: null, user: null }); |
| nonce | const | 69 | no | const nonce = randomBytes(16).toString(&#39;hex&#39;), timestamp = Date.now(); |
| signedSession | const | 70 | no | const signedSession = [&#39;vivim-session-v1&#39;, grant.grantId, nonce, String(timestamp), origin, user].join(&#39;\\\\n&#39;); |
| device | const | 71 | no | const device = (await call(&#39;/mobile/api/enrollment/session&#39;, { method: &#39;POST&#39;, extra: { &#39;content-type&#39;: &#39;application/json&#39; }, body: { grantId: grant.grantId, nonce, timestamp, deviceKeyProof: sign(&#39;s… |
| readCommand | function | 80 | no | const readCommand = body =&gt; call(&#39;/mobile/api/control/plan&#39;, { method: &#39;POST&#39;, extra: { origin, &#39;x-vivim-control&#39;: &#39;1&#39;, &#39;content-type&#39;: &#39;application/json&#39; }, body }); |
| before | const | 83 | no | const before = await call(&#39;/mobile/api/wiki&#39;); |
| listed | const | 85 | no | const listed = await readCommand({ actionId: &#39;wiki.pages.list&#39;, args: {} }); |
| initial | const | 92 | no | const initial = await readCommand({ actionId: &#39;wiki.section.read&#39;, args: { page: &#39;main&#39;, section: &#39;about&#39; } }); |
| nlList | const | 95 | no | const nlList = await readCommand({ text: &#39;list wiki pages&#39; }); |
| nlRead | const | 100 | no | const nlRead = await readCommand({ text: &#39;read wiki page main in section about&#39; }); |
| incomplete | const | 104 | no | const incomplete = await readCommand({ text: &#39;read wiki page main&#39; }); |
| missing | const | 107 | no | const missing = await readCommand({ actionId: &#39;wiki.section.read&#39;, args: { page: &#39;missing&#39;, section: &#39;about&#39; } }); |
| preview | const | 111 | no | const preview = await call(&#39;/mobile/api/control/plan&#39;, { method: &#39;POST&#39;, extra: { origin, &#39;x-vivim-control&#39;: &#39;1&#39;, &#39;content-type&#39;: &#39;application/json&#39; }, body: { text: &#39;edit wiki section main/about say… |
| binding | const | 118 | no | const binding=preview.body.approvalMeaning; |
| execute | function | 130 | no | const execute = () =&gt; call(&#39;/mobile/api/control/execute&#39;, { method: &#39;POST&#39;, extra: { origin, &#39;x-vivim-control&#39;: &#39;1&#39;, &#39;content-type&#39;: &#39;application/json&#39; }, body: { planId: preview.body.planId, planDig… |
| receipt | const | 139 | no | const receipt = await execute(); |
| after | const | 145 | no | const after = await call(&#39;/mobile/api/wiki&#39;); |
| readback | const | 150 | no | const readback = await readCommand({ actionId: &#39;wiki.section.read&#39;, args: { page: &#39;MAIN&#39;, section: &#39;ABOUT&#39; } }); |
| nlReadback | const | 152 | no | const nlReadback = await readCommand({ text: &#39;read wiki page main in section about&#39; }); |
| create | const | 157 | no | const create=await readCommand({text:&#39;create wiki page sprint-notes&#39;}); |
| approveStructure | function | 161 | no | const approveStructure=p=&gt;call(&#39;/mobile/api/control/execute&#39;,{ method:&#39;POST&#39;,extra:{origin,&#39;x-vivim-control&#39;:&#39;1&#39;,&#39;content-type&#39;:&#39;application/json&#39;}, body:{planId:p.planId,planDigest:p.planDigest} }); |
| linked | const | 168 | no | const linked=await readCommand({text:&#39;link wiki pages from main to sprint-notes&#39;}); |
| move | const | 169 | no | const move=await readCommand({text:&#39;move wiki page sprint-notes to top&#39;}); |
| freshMove | const | 178 | no | const freshMove=await readCommand({actionId:&#39;wiki.page.move&#39;,args:{page:&#39;sprint-notes&#39;,position:&#39;top&#39;}}); |
| structured | const | 180 | no | const structured=(await call(&#39;/mobile/api/wiki&#39;)).body; |
| related | const | 186 | no | const related=await readCommand({actionId:&#39;wiki.section.read&#39;,args:{page:&#39;sprint-notes&#39;,section:&#39;About&#39;}}); |
| editNew | const | 188 | no | const editNew=await readCommand({text:&#39;edit wiki section sprint-notes/about saying Actual sprint notes&#39;}); |
| reread | const | 191 | no | const reread=await readCommand({text:&#39;read wiki page sprint-notes in section about&#39;}); |
| assist | function | 200 | no | const assist=()=&gt;call(&#39;/mobile/api/control/interpret&#39;,{ method:&#39;POST&#39;,extra:{origin,&#39;x-vivim-control&#39;:&#39;1&#39;,&#39;content-type&#39;:&#39;application/json&#39;}, body:{text:&#39;read wiki page sprint-notes in section &#39;,comp… |
| beforeAssist | const | 203 | no | const beforeAssist=(await call(&#39;/mobile/api/wiki&#39;)).body; |
| hinted | const | 204 | no | const hinted=await assist(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:http | import | 3 | external |
| node:crypto | import | 4 | external |
| node:fs | import | 5 | external |
| node:os | import | 6 | external |
| node:path | import | 7 | external |
| ../server.mjs | import | 8 | [apps/vivim-host/server.mjs](../server.mjs.md) |
| ../bootstrap/runtime.mjs | import | 9 | [apps/vivim-host/bootstrap/runtime.mjs](../bootstrap/runtime.mjs.md) |
| ../apk/enrollment.mjs | import | 10 | [apps/vivim-host/apk/enrollment.mjs](../apk/enrollment.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { request as httpRequest } from 'node:http';
import { generateKeyPairSync, sign, randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHostServer } from '../server.mjs';
import { createBootstrapRuntime } from '../bootstrap/runtime.mjs';
import { createEnrollment } from '../apk/enrollment.mjs';

test('paired Direct phone: NL Wiki preview -> device approval -> durable Host state', async t => {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'arbor-wiki-phone-'));
  const origin = 'https://wiki-phone.example.ts.net';
  const user = 'owner@example.com';
  const runtime = createBootstrapRuntime({ dataRoot });
  const server = createHostServer({
    dataRoot, bootstrap: runtime, onboarding: { phoneSeen() {}, primary: () => null },
    directPhone: { origin, user }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    runtime.close();
    rmSync(dataRoot, { recursive: true, force: true });
  });
  const port = server.address().port;
  const headers = { host: 'wiki-phone.example.ts.net',
    'x-forwarded-proto': 'https', 'tailscale-user-login': user };
  let deviceHeaders = {};
  const call = (route, { method = 'GET', body, extra = {} } = {}) =>
    new Promise((resolve, reject) => {
      const req = httpRequest({ host: '127.0.0.1', port, path: route, method,
        headers: { ...headers, ...deviceHeaders, ...extra } }, res => {
        let response = '';
        res.on('data', chunk => { response += chunk; });
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(response) }); }
          catch { reject(new Error('Unexpected non-JSON Host response: ' + route)); }
        });
      });
      req.on('error', reject);
      req.end(body === undefined ? undefined : JSON.stringify(body));
    });

  assert.equal((await call('/mobile/api/wiki')).status, 401);
  assert.equal((await call('/mobile/api/control/plan', {
    method: 'POST', extra: { origin, 'x-vivim-control': '1', 'content-type': 'application/json' },
    body: { text: 'edit wiki section main/about saying Updated from Phone' }
  })).status, 401);

  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
  const challenge = (await call('/mobile/api/enrollment/start', {
    method: 'POST', extra: { 'content-type': 'application/json' }, body: {}
  })).body;
  const transcript = ['vivim-enrollment-v1', challenge.challengeId,
    challenge.challenge, challenge.nonce, origin, user].join('\\n');
  const grant = (await call('/mobile/api/enrollment/prove', {
    method: 'POST', extra: { 'content-type': 'application/json' },
    body: { challengeId: challenge.challengeId, publicKeyPem,
      signature: sign('sha256', Buffer.from(transcript), privateKey).toString('base64'),
      signedTranscript: transcript, requestedScopes: ['control:read', 'control:execute'] }
  })).body;
  assert.equal(grant.status, 'pending');
  const owner = createEnrollment({ dataRoot, origin: null, user: null });
  owner.approveGrant({ grantId: grant.grantId,
    approvedScopes: ['control:read', 'control:execute'], approvedBy: 'desktop-owner' });
  const nonce = randomBytes(16).toString('hex'), timestamp = Date.now();
  const signedSession = ['vivim-session-v1', grant.grantId, nonce, String(timestamp), origin, user].join('\\n');
  const device = (await call('/mobile/api/enrollment/session', {
    method: 'POST', extra: { 'content-type': 'application/json' },
    body: { grantId: grant.grantId, nonce, timestamp,
      deviceKeyProof: sign('sha256', Buffer.from(signedSession), privateKey).toString('base64') }
  })).body;
  assert.ok(device.sessionId);
  deviceHeaders = { 'x-vivim-grant-id': grant.grantId,
    'x-vivim-device-session': device.sessionId };

  const readCommand = body => call('/mobile/api/control/plan', {
```

_First 80 of 218 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
