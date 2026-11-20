# File: apps/vivim-host/test/direct-phone.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/direct-phone.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 23282 B |
| Lines | 332 |
| Hash | a3c882143918 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 19 | no | const root = mkdtempSync(path.join(os.tmpdir(), &#39;direct-phone-&#39;)); |
| origin | const | 20 | no | const origin = &#39;https://phone.example.ts.net&#39;; |
| runtime | const | 21 | no | const runtime = createBootstrapRuntime({ dataRoot: root }); |
| trustedPhonePresence | variable | 23 | no | let trustedPhonePresence = 0; |
| onboarding | const | 24 | no | const onboarding = { phoneSeen: () =&gt; { trustedPhonePresence++; }, primary: () =&gt; null }; |
| emptyStore | const | 28 | no | const emptyStore = mkdtempSync(path.join(os.tmpdir(), &#39;direct-phone-media-&#39;)); |
| mediaPlayback | const | 29 | no | const mediaPlayback = createMediaPlaybackService({ storeDir: emptyStore, filesRoot: emptyStore }); |
| server | const | 32 | no | const server = createHostServer({ dataRoot: root, bootstrap: runtime, onboarding, directPhone: { origin, user: &#39;owner@example.com&#39;, mediaPlayback } }); |
| headers | const | 37 | no | const headers = { host: &#39;phone.example.ts.net&#39;, &#39;x-forwarded-proto&#39;: &#39;https&#39;, &#39;tailscale-user-login&#39;: &#39;owner@example.com&#39; }; |
| deviceHeaders | variable | 38 | no | let deviceHeaders = {}; |
| call | function | 39 | no | const call = (url, { method = &#39;GET&#39;, headers: extra = {}, body } = {}) =&gt; new Promise((resolve, reject) =&gt; { const req = http.request({ host: &#39;127.0.0.1&#39;, port: server.address().port, path: url, meth… |
| req | const | 40 | no | const req = http.request({ host: &#39;127.0.0.1&#39;, port: server.address().port, path: url, method, headers: { ...headers, ...deviceHeaders, ...extra } }, res =&gt; { const chunks = []; res.on(&#39;data&#39;, c =&gt; ch… |
| chunks | const | 41 | no | const chunks = []; res.on(&#39;data&#39;, c =&gt; chunks.push(c)); res.on(&#39;end&#39;, () =&gt; resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() })); |
| publicKeyPem | const | 58 | no | const publicKeyPem = publicKey.export({ type: &#39;spki&#39;, format: &#39;pem&#39; }); |
| start | const | 59 | no | const start = JSON.parse((await call(&#39;/mobile/api/enrollment/start&#39;, { method: &#39;POST&#39;, headers: { &#39;content-type&#39;: &#39;application/json&#39; }, body: &#39;{}&#39; })).body); |
| transcript | const | 62 | no | const transcript = [&#39;vivim-enrollment-v1&#39;,start.challengeId,start.challenge,start.nonce,origin,&#39;owner@example.com&#39;].join(&#39;\\\\n&#39;); |
| proof | const | 63 | no | const proof = sign(&#39;sha256&#39;,Buffer.from(transcript),privateKey).toString(&#39;base64&#39;); |
| grant | const | 64 | no | const grant = JSON.parse((await call(&#39;/mobile/api/enrollment/prove&#39;, { method: &#39;POST&#39;, headers: { &#39;content-type&#39;: &#39;application/json&#39; }, body: JSON.stringify({challengeId:start.challengeId,publicKeyPe… |
| owner | const | 71 | no | const owner = createEnrollment({dataRoot:root,origin:null,user:null}); |
| nonce | const | 74 | no | const nonce = randomBytes(16).toString(&#39;hex&#39;), timestamp=Date.now(); |
| signedSession | const | 75 | no | const signedSession = [&#39;vivim-session-v1&#39;,grant.grantId,nonce,String(timestamp),origin,&#39;owner@example.com&#39;].join(&#39;\\\\n&#39;); |
| sessionProof | const | 76 | no | const sessionProof = sign(&#39;sha256&#39;,Buffer.from(signedSession),privateKey).toString(&#39;base64&#39;); |
| session | const | 77 | no | const session = JSON.parse((await call(&#39;/mobile/api/enrollment/session&#39;, { method:&#39;POST&#39;,headers:{&#39;content-type&#39;:&#39;application/json&#39;}, body:JSON.stringify({grantId:grant.grantId,nonce,timestamp,device… |
| falseAck | const | 82 | no | const falseAck={commandId:&#39;cmd-&#39;+&#39;b&#39;.repeat(16),messageId:&#39;msg-&#39;+&#39;b&#39;.repeat(16), |
| wikiRead | const | 90 | no | const wikiRead = await call(&#39;/mobile/api/wiki&#39;); |
| wiki | const | 92 | no | const wiki = JSON.parse(wikiRead.body); |
| graphRead | const | 97 | no | const graphRead=await call(&#39;/mobile/api/chat/context?focus=talk&#39;); |
| graphBody | const | 99 | no | const graphBody=JSON.parse(graphRead.body); |
| wikiGraphRead | const | 104 | no | const wikiGraphRead=await call(&#39;/mobile/api/chat/context?focus=wiki&#39;); |
| wikiGraph | const | 106 | no | const wikiGraph=JSON.parse(wikiGraphRead.body); |
| mediaRead | const | 115 | no | const mediaRead = await call(&#39;/mobile/api/media/library&#39;); |
| mediaView | const | 117 | no | const mediaView = JSON.parse(mediaRead.body); |
| connection | const | 143 | no | const connection = JSON.parse((await call(&#39;/mobile/connection.json&#39;)).body); |
| workerStatus | const | 159 | no | const workerStatus = JSON.parse((await call(&#39;/mobile/api/relay?path=agent%2Fstatus&#39;)).body); |
| status | const | 162 | no | const status = JSON.parse((await call(&#39;/mobile/api/relay?path=status&#39;)).body); |
| payload | const | 166 | no | const payload = JSON.stringify({ text: &#39;choose-preset&#39;, kind: &#39;command&#39;, consumer: &#39;bootstrap&#39;, mode: &#39;bootstrap&#39;, action: &#39;choose-preset&#39;, preset: &#39;tide&#39; }); |
| target | const | 167 | no | const target = &#39;/mobile/api/relay?path=commands&#39;; |
| bootstrapGrant | const | 172 | no | const bootstrapGrant = await call(target, { method: &#39;POST&#39;, headers: { origin, &#39;content-type&#39;: &#39;application/json&#39; }, body: JSON.stringify({ text: &#39;grant-visual&#39;, kind: &#39;command&#39;, consumer: &#39;bootstrap… |
| bridge | const | 174 | no | const bridge = createBridgeStore({ root }); |
| worker | const | 175 | no | const worker = createBootstrapCommandWorker({ root, runtime }); |
| created | const | 177 | no | const created = await call(target, { method: &#39;POST&#39;, headers: { origin, &#39;content-type&#39;: &#39;application/json&#39; }, body: payload }); |
| id | const | 179 | no | const id = JSON.parse(created.body).id; |
| projection | const | 185 | no | const projection = JSON.parse((await call(&#39;/mobile/api/relay?path=status&#39;)).body).snapshot.bootstrap; |
| db | const | 188 | no | const db = new DatabaseSync(runtime.file, { readOnly: true }); |
| beforeUi | const | 194 | no | const beforeUi = JSON.parse((await call(&#39;/mobile/api/relay?path=status&#39;)).body).snapshot.bootstrap; |
| beforeSurface | const | 196 | no | const beforeSurface = blankSurface(); |
| design | const | 197 | no | const design = { ...resolveBuildRequest({ request: &#39;Add a card called Research&#39;, surface: beforeSurface }), |
| postDesign | function | 202 | no | const postDesign = draft =&gt; call(target, { method: &#39;POST&#39;, headers: { origin, &#39;content-type&#39;: &#39;application/json&#39; }, body: JSON.stringify({ text: &#39;apply-proposal&#39;, kind: &#39;command&#39;, consumer: &#39;bootstra… |
| activated | const | 206 | no | const activated = await postDesign(design); |
| designId | const | 208 | no | const designId = JSON.parse(activated.body).id; |
| completed | const | 213 | no | const completed = JSON.parse((await call(&#39;/mobile/api/relay?path=commands%2F&#39; + designId)).body); |
| designCommitProof | const | 214 | no | const designCommitProof = committedUiRevision(completed, beforeSurface); |
| committed | const | 215 | no | const committed = JSON.parse((await call(&#39;/mobile/api/relay?path=status&#39;)).body).snapshot.bootstrap.uiRevision; |
| reopened | const | 221 | no | const reopened = createBootstrapRuntime({ dataRoot: root }); |
| undo | const | 225 | no | const undo = buildUndoProposal({ original: design, before: beforeSurface, committed: designCommitProof, live: committed.surface }); |
| undoQueued | const | 227 | no | const undoQueued = await postDesign(undo); |
| undoId | const | 229 | no | const undoId = JSON.parse(undoQueued.body).id; |
| undoResult | const | 231 | no | const undoResult = JSON.parse((await call(&#39;/mobile/api/relay?path=commands%2F&#39; + undoId)).body); |
| undoProof | const | 232 | no | const undoProof = committedUiRevision(undoResult, committed.surface); |
| restored | const | 233 | no | const restored = JSON.parse((await call(&#39;/mobile/api/relay?path=status&#39;)).body).snapshot.bootstrap.uiRevision; |
| reopenedAfterUndo | const | 237 | no | const reopenedAfterUndo = createBootstrapRuntime({ dataRoot: root }); |
| stale | const | 241 | no | const stale = await postDesign(design); |
| convo | const | 248 | no | const convo=&#39;c-&#39;+&#39;a&#39;.repeat(16); |
| chat | const | 249 | no | const chat = await call(target, {method:&#39;POST&#39;, headers:{origin,&#39;content-type&#39;:&#39;application/json&#39;}, body:JSON.stringify({text:&#39;private user prompt&#39;,kind:&#39;command&#39;,consumer:&#39;harness&#39;, mode:&#39;relay-chat… |
| chatId | const | 254 | no | const chatId=JSON.parse(chat.body).id; |
| firstLive | const | 255 | no | const firstLive=JSON.parse((await call(&#39;/mobile/api/relay?path=status&#39;)).body).snapshot.live; |
| messages | const | 256 | no | const messages=firstLive.conversations.find(c=&gt;c.id===convo)?.messages ?? []; |
| claimedLive | const | 261 | no | const claimedLive=JSON.parse((await call(&#39;/mobile/api/relay?path=status&#39;)).body).snapshot.live; |
| sessions | const | 265 | no | const sessions=JSON.parse((await call(&#39;/mobile/api/relay?path=sessions&#39;)).body); |
| legacySessions | const | 268 | no | const legacySessions=JSON.parse((await call(&#39;/mobile/api/relay?path=opencode%2Fsessions&#39;)).body); |
| phoneTranscript | const | 270 | no | const phoneTranscript=JSON.parse((await call(`/mobile/api/relay?path=sessions%2F${convo}%2Fmessages`)).body); |
| phoneMessageId | const | 273 | no | const phoneMessageId=&#39;msg_&#39;+&#39;f&#39;.repeat(32); |
| admitted | const | 274 | no | const admitted=await call(`/mobile/api/relay?path=sessions%2F${convo}%2Fprompt`,{ method:&#39;POST&#39;,headers:{origin,&#39;content-type&#39;:&#39;application/json&#39;}, body:JSON.stringify({id:phoneMessageId,text:&#39;second… |
| queued | const | 279 | no | const queued=bridge.list({consumer:&#39;harness&#39;,limit:20}).items.filter(r=&gt;r.mode===&#39;relay-chat&#39;&amp;&amp;r.messageId===phoneMessageId); |
| afterPrompt | const | 286 | no | const afterPrompt=JSON.parse((await call(`/mobile/api/relay?path=sessions%2F${convo}%2Fmessages`)).body); |
| repeated | const | 290 | no | const repeated=await call(`/mobile/api/relay?path=sessions%2F${convo}%2Fprompt`,{ method:&#39;POST&#39;,headers:{origin,&#39;content-type&#39;:&#39;application/json&#39;}, body:JSON.stringify({id:phoneMessageId,text:&#39;second… |
| seenBeforeRevokedRequest | const | 296 | no | const seenBeforeRevokedRequest=trustedPhonePresence; |
| source | const | 306 | no | const source=readFileSync(new URL(&#39;../direct-phone.mjs&#39;,import.meta.url),&#39;utf8&#39;); |
| host | const | 307 | no | const host=readFileSync(new URL(&#39;../server.mjs&#39;,import.meta.url),&#39;utf8&#39;); |
| direct | const | 321 | no | const direct=readFileSync(new URL(&#39;../direct-phone.mjs&#39;,import.meta.url),&#39;utf8&#39;); |
| host | const | 322 | no | const host=readFileSync(new URL(&#39;../server.mjs&#39;,import.meta.url),&#39;utf8&#39;); |
| app | const | 323 | no | const app=readFileSync(new URL(&#39;../../mobile-relay/app.js&#39;,import.meta.url),&#39;utf8&#39;); |

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
| node:sqlite | import | 9 | external |
| ../server.mjs | import | 10 | [apps/vivim-host/server.mjs](../server.mjs.md) |
| ../bootstrap/runtime.mjs | import | 11 | [apps/vivim-host/bootstrap/runtime.mjs](../bootstrap/runtime.mjs.md) |
| ../media/playback.mjs | import | 12 | [apps/vivim-host/media/playback.mjs](../media/playback.mjs.md) |
| ../../../studio/src/studio/bridge-commands.mjs | import | 13 | [studio/src/studio/bridge-commands.mjs](../../../studio/src/studio/bridge-commands.mjs.md) |
| ../bootstrap/command-worker.mjs | import | 14 | [apps/vivim-host/bootstrap/command-worker.mjs](../bootstrap/command-worker.mjs.md) |
| ../../mobile-relay/build-composer.mjs | import | 15 | [apps/mobile-relay/build-composer.mjs](../../mobile-relay/build-composer.mjs.md) |
| ../../mobile-relay/build-canvas.mjs | import | 16 | [apps/mobile-relay/build-canvas.mjs](../../mobile-relay/build-canvas.mjs.md) |

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
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createHostServer } from '../server.mjs';
import { createBootstrapRuntime } from '../bootstrap/runtime.mjs';
import { createMediaPlaybackService } from '../media/playback.mjs';
import { createBridgeStore } from '../../../studio/src/studio/bridge-commands.mjs';
import { createBootstrapCommandWorker } from '../bootstrap/command-worker.mjs';
import { resolveBuildRequest, blankSurface } from '../../mobile-relay/build-composer.mjs';
import { buildUndoProposal, committedUiRevision, matchesCommittedUiReadback } from '../../mobile-relay/build-canvas.mjs';

test('direct phone authenticates proxy, bounds routes and uses the shared queue', async t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'direct-phone-'));
  const origin = 'https://phone.example.ts.net';
  const runtime = createBootstrapRuntime({ dataRoot: root });
  assert.equal(runtime.state, 'ready');
  let trustedPhonePresence = 0;
  const onboarding = { phoneSeen: () => { trustedPhonePresence++; }, primary: () => null };
  // Pin an EMPTY media store. Without this the test reads the developer machine's
  // real store (C:/VIVIM/channel/vivim/torrent-store) and its assertions stop being
  // about the route contract at all.
  const emptyStore = mkdtempSync(path.join(os.tmpdir(), 'direct-phone-media-'));
  const mediaPlayback = createMediaPlaybackService({ storeDir: emptyStore, filesRoot: emptyStore });
  // mediaPlayback is spread from the directPhone options (server.mjs spreads
  // ...directPhone into createDirectPhoneHandler), so it belongs there.
  const server = createHostServer({ dataRoot: root, bootstrap: runtime, onboarding,
    directPhone: { origin, user: 'owner@example.com', mediaPlayback } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); runtime.close();
    rmSync(root, { recursive: true, force: true }); rmSync(emptyStore, { recursive: true, force: true }); });
  const headers = { host: 'phone.example.ts.net', 'x-forwarded-proto': 'https', 'tailscale-user-login': 'owner@example.com' };
  let deviceHeaders = {};
  const call = (url, { method = 'GET', headers: extra = {}, body } = {}) => new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: server.address().port, path: url, method, headers: { ...headers, ...deviceHeaders, ...extra } }, res => {
      const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() }));
    }); req.on('error', reject); req.end(body);
  });
  assert.equal((await call('/mobile/', { headers: { 'tailscale-user-login': 'other' } })).status, 403);
  assert.equal((await call('/mobile/', { headers: { 'tailscale-user-login': '' } })).status, 403);
  assert.equal((await call('/mobile/', { headers: { host: 'foreign.ts.net' } })).status, 403);
  assert.equal((await call('/mobile/', { headers: { 'x-forwarded-proto': 'http' } })).status, 403);
  assert.equal((await call('/api/host/status', { headers: { host: 'localhost' } })).status, 403);
  assert.equal((await call('/mobile/%2e%2e/server.mjs')).status, 404);
  assert.equal((await call('/mobile/lib/relay-core.mjs')).status, 404);
  assert.equal((await call('/mobile/api/relay?path=host%2Fpending')).status, 401);
  assert.equal((await call('/mobile/api/relay?path=session')).status, 401);
  assert.equal((await call('/mobile/api/media/library')).status, 401);
  assert.equal((await call('/mobile/api/chat/context?focus=talk')).status,401);
  assert.equal((await call('/mobile/api/wiki')).status, 401);
  assert.equal(trustedPhonePresence,0);
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
  const start = JSON.parse((await call('/mobile/api/enrollment/start', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}'
  })).body);
  const transcript = ['vivim-enrollment-v1',start.challengeId,start.challenge,start.nonce,origin,'owner@example.com'].join('\\n');
  const proof = sign('sha256',Buffer.from(transcript),privateKey).toString('base64');
  const grant = JSON.parse((await call('/mobile/api/enrollment/prove', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({challengeId:start.challengeId,publicKeyPem,signature:proof,
      signedTranscript:transcript,requestedScopes:['relay:read','relay:write','control:read','control:execute']})
  })).body);
  assert.equal(grant.status,'pending');
  assert.equal((await call('/mobile/api/relay?path=session')).status,401);
  const owner = createEnrollment({dataRoot:root,origin:null,user:null});
  owner.approveGrant({grantId:grant.grantId,approvedScopes:['relay:read','relay:write','control:read'],
    approvedBy:'desktop-owner'});
  const nonce = randomBytes(16).toString('hex'), timestamp=Date.now();
  const signedSession = ['vivim-session-v1',grant.grantId,nonce,String(timestamp),origin,'owner@example.com'].join('\\n');
  const sessionProof = sign('sha256',Buffer.from(signedSession),privateKey).toString('base64');
  const session = JSON.parse((await call('/mobile/api/enrollment/session', {
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({grantId:grant.grantId,nonce,timestamp,deviceKeyProof:sessionProof})
  })).body);
```

_First 80 of 333 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
