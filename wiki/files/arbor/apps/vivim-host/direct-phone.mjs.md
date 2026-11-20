# File: apps/vivim-host/direct-phone.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/vivim-host/direct-phone.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 46731 B |
| Lines | 717 |
| Hash | 83ec77969d36 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 25 | no | const root = fileURLToPath(new URL(&#39;../mobile-relay/&#39;, import.meta.url)); |
| assets | const | 26 | no | const assets = new Map(Object.entries({ &#39;&#39;: [&#39;index.html&#39;, &#39;text/html; charset=utf-8&#39;], &#39;index.html&#39;: [&#39;index.html&#39;, &#39;text/html; charset=utf-8&#39;], &#39;app.js&#39;: [&#39;app.js&#39;, &#39;text/javascript; charset=utf-8&#39;… |
| PHONE_ASSETS | const | 101 | yes | export const PHONE_ASSETS = assets; |
| readPhoneAsset | function | 102 | no | async function readPhoneAsset(asset) { |
| filename | const | 103 | no | const filename = path.join(root, asset[0]); |
| serveLoopbackPhoneAsset | function | 112 | yes | export async function serveLoopbackPhoneAsset(req, res, pathname) { |
| relative | const | 117 | no | const relative = pathname.slice(&#39;/mobile/&#39;.length); |
| asset | const | 121 | no | const asset = assets.get(relative); |
| content | const | 130 | no | const content = await readPhoneAsset(asset); |
| json | function | 139 | no | const json = (res, status, body) =&gt; { res.setHeader(&#39;content-type&#39;, &#39;application/json; charset=utf-8&#39;); res.writeHead(status); res.end(JSON.stringify(body)); }; |
| failure | function | 140 | no | const failure = (status, message) =&gt; Object.assign(new Error(message), { status }); |
| PHONE_SESSION_ID | const | 144 | no | const PHONE_SESSION_ID = &#39;c-[a-f0-9]{16}&#39;; |
| PHONE_SESSIONS | const | 145 | no | const PHONE_SESSIONS = new RegExp(`^(?:opencode/)?sessions(?:/${PHONE_SESSION_ID}/(?:messages\|prompt))?$`); |
| RELAY_PATH | const | 146 | no | const RELAY_PATH = new RegExp(`^(?:session\|commands\|commands/cmd-[0-9a-f]{16}\|status\|agent/status\|(?:opencode/)?sessions(?:/${PHONE_SESSION_ID}/(?:messages\|prompt))?)$`); |
| readBody | function | 148 | no | async function readBody(req) { |
| size | variable | 150 | no | let size = 0, oversized = false; const chunks = []; |
| createDirectPhoneHandler | function | 156 | yes | export function createDirectPhoneHandler({ origin, user, dataRoot, worldId = &#39;world-local&#39;, projection, control = null, apkRegistry = null, pairingStore = null, onPhoneSeen = () =&gt; {}, primary = () =… |
| url | variable | 158 | no | let url; |
| bridge | const | 161 | no | const bridge = createBridgeStore({ root: dataRoot }); |
| live | const | 163 | no | const live = createSourceVerifiedLiveProjection({dataRoot,worldId}); |
| secret | const | 164 | no | const secret = randomBytes(32).toString(&#39;hex&#39;); |
| media | const | 165 | no | const media = mediaPlayback ?? createMediaPlaybackService(); |
| mediaTickets | const | 170 | no | const mediaTickets = new Map(); |
| MEDIA_COOKIE | const | 171 | no | const MEDIA_COOKIE = &#39;vivim_media_stream&#39;; |
| mediaTtlMs | const | 172 | no | const mediaTtlMs = 4 * 60 * 60_000; |
| pruneMediaTickets | function | 173 | no | const pruneMediaTickets = () =&gt; { |
| now | const | 174 | no | const now = Date.now(); |
| mediaCookie | function | 178 | no | const mediaCookie = req =&gt; String(req.headers.cookie \|\| &#39;&#39;).split(&#39;;&#39;) |
| store | const | 181 | no | const store = { |
| chat | const | 187 | no | const chat = { ...Object.fromEntries([&#39;mode&#39;, &#39;conversationId&#39;, &#39;newChat&#39;, &#39;target&#39;, &#39;attachments&#39;, &#39;action&#39;, &#39;preset&#39;, &#39;proposal&#39;, &#39;messageId&#39;].filter(k =&gt; record[k] !== undefined).map(k =&gt; [k, reco… |
| phoneCards | const | 198 | no | const phoneCards = Array.isArray(cards) ? cards.slice(0, 3).map(({ id, title, basis }) =&gt; ({ id, title, basis })) : []; |
| liveSummary | variable | 201 | no | let liveSummary = {schema:&#39;vivim.world-conversation-timeline/1&#39;,state:&#39;unavailable&#39;,conversations:[]}; |
| reconciliation | const | 203 | no | const reconciliation=await live.reconcileBridgeClaims(); |
| studio | const | 204 | no | const studio=await live.reconcileStudioJournal(); |
| timeline | const | 205 | no | const timeline=live.worldTimeline(); |
| verifiedDisplays | const | 206 | no | const verifiedDisplays=new Set(studio.verifiedReplyDisplayCommands); |
| providerRecords | variable | 223 | no | let providerRecords=[]; |
| manifest | const | 225 | no | const manifest=projectChatProviders(providerRecords); |
| relay | const | 231 | no | const relay = createRelay({ store, env: { VIVIM_RELAY_PAIR_SECRET: secret } }); |
| phoneSessions | const | 234 | no | const phoneSessions = createPhoneSessions({ dataRoot, worldId, bridge, live, store }); |
| apk | const | 235 | no | const apk = apkRegistry ?? createApkRegistry({ dataRoot }); |
| pairing | const | 236 | no | const pairing = pairingStore ?? createPairingStore({ dataRoot }); |
| enrollment | const | 237 | no | const enrollment = createEnrollment({ dataRoot, origin, user }); |
| authorizeDevice | function | 240 | no | const authorizeDevice = (req, scope) =&gt; { |
| grantId | const | 241 | no | const grantId = req.headers[&#39;x-vivim-grant-id&#39;]; |
| sessionId | const | 242 | no | const sessionId = req.headers[&#39;x-vivim-device-session&#39;]; |
| grant | const | 244 | no | const grant = enrollment.validateGrant({ grantId, sessionId }); |
| remote | const | 250 | no | const remote = req.socket.remoteAddress; |
| rawPath | const | 253 | no | const rawPath = (req.url \|\| &#39;&#39;).split(&#39;?&#39;)[0]; |
| route | const | 256 | no | const route = rawPath.slice(&#39;/mobile/&#39;.length); |
| wiki | const | 268 | no | const wiki = await wikiProjection(); |
| status | const | 273 | no | const status = error.status \|\| 503; |
| device | const | 288 | no | const device=authorizeDevice(req,&#39;relay:write&#39;); |
| body | const | 289 | no | const body=await readBody(req); |
| receipt | const | 293 | no | const receipt=await live.recordPhoneDelivery({ commandId:body.commandId,messageId:body.messageId, conversationId:body.conversationId,replyRevision:body.replyRevision, deviceId:device.deviceId }); |
| code | const | 302 | no | const code=error.code??&#39;PHONE_ACK_UNAVAILABLE&#39;; |
| status | const | 303 | no | const status=/_(?:INVALID\|FIELDS_INVALID\|ID_INVALID)$/.test(code)?400: |
| result | const | 318 | no | const result=await providerRefresh(); |
| query | const | 334 | no | const query = [...new URL(req.url,origin).searchParams.entries()]; |
| result | const | 338 | no | const result=chatContext |
| params | const | 358 | no | const params = readMemoryParams(new URL(req.url, origin).searchParams); |
| device | const | 371 | no | const device = authorizeDevice(req,&#39;control:read&#39;); |
| body | const | 374 | no | const body = await readBody(req); |
| mediaId | const | 378 | no | const mediaId = body.mediaId; |
| info | const | 379 | no | const info = await media.resolve(mediaId); |
| ticket | const | 390 | no | const ticket = randomBytes(32).toString(&#39;hex&#39;); |
| expiresAt | const | 391 | no | const expiresAt = Date.now() + mediaTtlMs; |
| streamId | const | 430 | no | const streamId = /^api\\/media\\/stream\\/([a-f0-9]{32})$/.exec(route); |
| info | variable | 435 | no | let info = null; |
| ticket | const | 439 | no | const ticket = mediaCookie(req); |
| grant | const | 444 | no | const grant = enrollment.validateGrant({grantId:record.grantId,sessionId:record.sessionId}); |
| bytes | variable | 448 | no | let bytes; |
| reader | const | 470 | no | const reader = info.handle.createReadStream({ start:bytes.start,end:bytes.end,autoClose:true }); |
| guard | const | 475 | no | const guard = createMediaStreamGrantGuard({ validateGrant: args =&gt; enrollment.validateGrant(args), grantId: record.grantId, sessionId: record.sessionId }); |
| query | const | 494 | no | const query = [...new URL(req.url, origin).searchParams.entries()]; |
| rawOffset | const | 497 | no | const rawOffset = query.length ? query[0][1] : &#39;0&#39;; |
| sub | const | 516 | no | const sub = route.slice(&#39;api/control/&#39;.length); |
| planMatch | const | 517 | no | const planMatch = sub.match(/^plans\\/(ctl-[a-f0-9]{16})$/); |
| reads | const | 518 | no | const reads = { catalog: 1, world: 1, language: 1, lexicon: 1, recent: 1, programs: 1 }; |
| c | const | 520 | no | const c = control ? control() : null; |
| device | const | 521 | no | const device = authorizeDevice(req, &#39;control:read&#39;); |
| planner | const | 524 | no | const planner = c ?? createControlPlanner(); |
| body | const | 537 | no | const body = await readBody(req); |
| planner | const | 542 | no | const planner = c ?? createControlPlanner(); |
| interpret | function | 544 | no | const interpret=text=&gt;c?c.interpret(text,{source:&#39;mobile&#39;}):planner.interpretText(text,{source:&#39;mobile&#39;}); |
| meaning | const | 545 | no | const meaning=interpret(body.text); |
| wiki | variable | 547 | no | let wiki=null; |
| authorizeProgram | function | 558 | no | const authorizeProgram=scope=&gt;{const live=authorizeDevice(req,scope);if(live.deviceId!==device.deviceId)throw failure(403,&#39;DEVICE_SCOPE_DENIED&#39;);return live;}; |
| plan | const | 559 | no | const plan = await c.plan(body, { source: &#39;mobile&#39;, actor: device.deviceId,grantId:req.headers[&#39;x-vivim-grant-id&#39;],authorizeProgram }); |
| result | const | 562 | no | const result = await attachRequestContext(plan,{text:body.text,readWiki:wikiProjection}); |
| currentDevice | const | 570 | no | const currentDevice=authorizeDevice(req,&#39;control:execute&#39;); |
| receipt | const | 571 | no | const receipt=await c.execute({ planId: body.planId, planDigest: body.planDigest, approval: { channel:&#39;direct-phone&#39;,actor:currentDevice.deviceId,grantId:req.headers[&#39;x-vivim-grant-id&#39;] } },{authoriz… |
| params | const | 581 | no | const params = new URL(req.url, origin).searchParams; |
| relayPath | const | 583 | no | const relayPath = params.get(&#39;path&#39;); |
| body | const | 589 | no | const body = req.method === &#39;POST&#39; ? await readBody(req) : {}; |
| queued | const | 592 | no | const queued = bridge.list({consumer:&#39;grokbot&#39;,limit:200}).items; |
| health | variable | 593 | no | let health=null; |
| h | const | 595 | no | const h=JSON.parse(await readFile(path.join(dataRoot,&#39;bridge&#39;,&#39;grokbot-worker.json&#39;),&#39;utf8&#39;)); |
| out | const | 606 | no | const out = await relay({ method: req.method, path: relayPath, req: { headers: { cookie: `${COOKIE}=${sessionValue(secret)}` } }, body }); |
| sub | const | 614 | no | const sub = route.slice(&#39;api/enrollment/&#39;.length); |
| params | const | 624 | no | const params = new URL(req.url, origin).searchParams; |
| body | const | 652 | no | const body = await readBody(req); |
| token | const | 653 | no | const token = body &amp;&amp; typeof body === &#39;object&#39; &amp;&amp; !Array.isArray(body) ? body.token : undefined; |
| challenge | const | 657 | no | const challenge = enrollment.startChallenge({ deviceHint: &#39;android-qr&#39; }); |
| reason | const | 660 | no | const reason = error.code \|\| error.message; |
| known | const | 661 | no | const known = { TOKEN_REQUIRED: 400, TOKEN_UNKNOWN: 404, TOKEN_EXPIRED: 410, TOKEN_ALREADY_USED: 409, ALREADY_PAIRED: 409 }; |
| status | const | 662 | no | const status = known[reason] \|\| error.status \|\| 500; |
| params | const | 678 | no | const params = new URL(req.url, origin).searchParams; |
| releaseId | const | 679 | no | const releaseId = params.get(&#39;releaseId&#39;); |
| stream | const | 690 | no | const stream = createReadStream(filePath); |
| asset | const | 712 | no | const asset = assets.get(route); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 2 | external |
| node:fs/promises | import | 3 | external |
| node:fs | import | 4 | external |
| node:stream/promises | import | 5 | external |
| node:url | import | 6 | external |
| node:crypto | import | 7 | external |
| node:module | import | 8 | external |
| ../mobile-relay/lib/relay-core.mjs | import | 9 | [apps/mobile-relay/lib/relay-core.mjs](../mobile-relay/lib/relay-core.mjs.md) |
| ../../studio/src/studio/bridge-commands.mjs | import | 10 | [studio/src/studio/bridge-commands.mjs](../../studio/src/studio/bridge-commands.mjs.md) |
| ./conversations/live-projection.mjs | import | 11 | [apps/vivim-host/conversations/live-projection.mjs](./conversations/live-projection.mjs.md) |
| ./phone-sessions.mjs | import | 12 | [apps/vivim-host/phone-sessions.mjs](./phone-sessions.mjs.md) |
| ./control/intent-planner.mjs | import | 13 | [apps/vivim-host/control/intent-planner.mjs](./control/intent-planner.mjs.md) |
| ./control/request-context.mjs | import | 14 | [apps/vivim-host/control/request-context.mjs](./control/request-context.mjs.md) |
| ../mobile-relay/composer-assist.mjs | import | 15 | [apps/mobile-relay/composer-assist.mjs](../mobile-relay/composer-assist.mjs.md) |
| ./apk/registry.mjs | import | 16 | [apps/vivim-host/apk/registry.mjs](./apk/registry.mjs.md) |
| ./apk/enrollment.mjs | import | 17 | [apps/vivim-host/apk/enrollment.mjs](./apk/enrollment.mjs.md) |
| ./apk/pairing.mjs | import | 18 | [apps/vivim-host/apk/pairing.mjs](./apk/pairing.mjs.md) |
| ./bootstrap/web-memory.mjs | import | 19 | [apps/vivim-host/bootstrap/web-memory.mjs](./bootstrap/web-memory.mjs.md) |
| ./media/playback.mjs | import | 20 | [apps/vivim-host/media/playback.mjs](./media/playback.mjs.md) |
| ./media/stream-guard.mjs | import | 21 | [apps/vivim-host/media/stream-guard.mjs](./media/stream-guard.mjs.md) |
| ./chat/provider-projection.mjs | import | 22 | [apps/vivim-host/chat/provider-projection.mjs](./chat/provider-projection.mjs.md) |
| ./control/http-status.mjs | import | 23 | [apps/vivim-host/control/http-status.mjs](./control/http-status.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/bootstrap/web-memory-phone-auth.test.mjs](./bootstrap/web-memory-phone-auth.test.mjs.md) | ../direct-phone.mjs |
| [apps/vivim-host/server.mjs](./server.mjs.md) | ./direct-phone.mjs |
| [apps/vivim-host/test/host-preview.test.mjs](./test/host-preview.test.mjs.md) | ../direct-phone.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Direct phone traffic is accepted only behind a trusted local Tailscale Serve proxy.
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';
import { createRelay, COOKIE, sessionValue } from '../mobile-relay/lib/relay-core.mjs';
import { createBridgeStore } from '../../studio/src/studio/bridge-commands.mjs';
import { createSourceVerifiedLiveProjection } from './conversations/live-projection.mjs';
import { createPhoneSessions } from './phone-sessions.mjs';
import { createControlPlanner } from './control/intent-planner.mjs';
import { attachRequestContext } from './control/request-context.mjs';
import { composerResponse, needsWikiDraftContext } from '../mobile-relay/composer-assist.mjs';
import { createApkRegistry } from './apk/registry.mjs';
import { createEnrollment } from './apk/enrollment.mjs';
import { createPairingStore } from './apk/pairing.mjs';
import { readMemoryParams } from './bootstrap/web-memory.mjs';
import { createMediaPlaybackService, parseMediaRange } from './media/playback.mjs';
import { createMediaStreamGrantGuard } from './media/stream-guard.mjs';
import { projectChatProviders } from './chat/provider-projection.mjs';
import { controlErrorStatus } from './control/http-status.mjs';

const root = fileURLToPath(new URL('../mobile-relay/', import.meta.url));
const assets = new Map(Object.entries({
  '': ['index.html', 'text/html; charset=utf-8'],
  'index.html': ['index.html', 'text/html; charset=utf-8'],
  'app.js': ['app.js', 'text/javascript; charset=utf-8'],
  // app.js imports these two canonical Today/World/Me modules; Direct must serve them.
  'ux/model.mjs': ['ux/model.mjs', 'text/javascript; charset=utf-8'],
  'ux/mission-experience.mjs': ['ux/mission-experience.mjs', 'text/javascript; charset=utf-8'],
  'ux/render.mjs': ['ux/render.mjs', 'text/javascript; charset=utf-8'],
  'ux/readiness.mjs': ['ux/readiness.mjs', 'text/javascript; charset=utf-8'],
  'ux/launcher.mjs': ['ux/launcher.mjs', 'text/javascript; charset=utf-8'],
  'ux/launcher-ui.mjs': ['ux/launcher-ui.mjs', 'text/javascript; charset=utf-8'],
  'ux/shell-inspection.mjs': ['ux/shell-inspection.mjs', 'text/javascript; charset=utf-8'],
  'ux/shell-presentation.mjs': ['ux/shell-presentation.mjs', 'text/javascript; charset=utf-8'],
  'ux/local-notes.mjs': ['ux/local-notes.mjs', 'text/javascript; charset=utf-8'],
  'ux/local-notes-ui.mjs': ['ux/local-notes-ui.mjs', 'text/javascript; charset=utf-8'],
  'ux/voice-capture.mjs': ['ux/voice-capture.mjs', 'text/javascript; charset=utf-8'],
  'ux/local-dictation.mjs': ['ux/local-dictation.mjs', 'text/javascript; charset=utf-8'],
  'pairing-link.mjs': ['pairing-link.mjs', 'text/javascript; charset=utf-8'],
  'device-enrollment.mjs': ['device-enrollment.mjs', 'text/javascript; charset=utf-8'],
  'browser-device-key.mjs': ['browser-device-key.mjs', 'text/javascript; charset=utf-8'],
  'control-phone.mjs': ['control-phone.mjs', 'text/javascript; charset=utf-8'],
  'control-client.mjs': ['control-client.mjs', 'text/javascript; charset=utf-8'],
  'control-chat.mjs': ['control-chat.mjs', 'text/javascript; charset=utf-8'],
  'control-language.mjs': ['control-language.mjs', 'text/javascript; charset=utf-8'],
  'composer-assist.mjs': ['composer-assist.mjs', 'text/javascript; charset=utf-8'],
  'wiki-source-view.mjs': ['wiki-source-view.mjs', 'text/javascript; charset=utf-8'],
  ...Object.fromEntries(['frames','grammar','ground','index','interpret','lexer','project','recognize','symbols','text','types']
    .map(n => [`nlcl/${n}.mjs`, [`nlcl/${n}.mjs`, 'text/javascript; charset=utf-8']])),
  'grokbot.html': ['grokbot.html', 'text/html; charset=utf-8'],
  'grokbot.js': ['grokbot.js', 'text/javascript; charset=utf-8'],
  'sw.js': ['sw.js', 'text/javascript; charset=utf-8'],
  'transport.mjs': ['transport.mjs', 'text/javascript; charset=utf-8'],
  'transport.js': ['transport.js', 'text/javascript; charset=utf-8'],
  'visual-bootstrap.mjs': ['visual-bootstrap.mjs', 'text/javascript; charset=utf-8'],
  'visual-theme.mjs': ['visual-theme.mjs', 'text/javascript; charset=utf-8'],
  'bootstrap-phone.mjs': ['bootstrap-phone.mjs', 'text/javascript; charset=utf-8'],
  'build-composer.mjs': ['build-composer.mjs', 'text/javascript; charset=utf-8'],
  'build-canvas.mjs': ['build-canvas.mjs', 'text/javascript; charset=utf-8'],
  'vec/compiler.mjs': ['vec/compiler.mjs', 'text/javascript; charset=utf-8'],
  'vec/ui-adapter.mjs': ['vec/ui-adapter.mjs', 'text/javascript; charset=utf-8'],
  // Serve the reviewed VEC engine sources verbatim, not a duplicated browser compiler.
  ...Object.fromEntries(['compiler','registry','catalog','validators','enum-choices']
    .map(n => [`vec-engines/${n}.mjs`,
      [`../../packages/vec-ui-engines/src/${n}.mjs`, 'text/javascript; charset=utf-8']])),
  // Same TierFlow source for local and authorized Direct PWA, with types erased.
  'tierflow-runtime/document/schema.ts': ['../../packages/tierflow/src/visual-runtime/document/schema.ts', 'text/javascript; charset=utf-8'],
  'tierflow-runtime/document/validate.ts': ['../../packages/tierflow/src/visual-runtime/document/validate.ts', 'text/javascript; charset=utf-8'],
  'tierflow-runtime/document/import-legacy.ts': ['../../packages/tierflow/src/visual-runtime/document/import-legacy.ts', 'text/javascript; charset=utf-8'],
  'tierflow-runtime/render/dom.ts': ['../../packages/tierflow/src/visual-runtime/render/dom.ts', 'text/javascript; charset=utf-8'],
  'tierflow-runtime/final-wave/lane-c/templates.ts': ['../../packages/tierflow/src/visual-runtime/final-wave/lane-c/templates.ts','text/javascript; charset=utf-8'],
  'tierflow-runtime/render/spatial-fallback.ts': ['../../packages/tierflow/src/visual-runtime/render/spatial-fallback.ts', 'text/javascript; charset=utf-8'],
  'vec/ui-taxonomy/catalog.mjs': ['vec/ui-taxonomy/catalog.mjs', 'text/javascript; charset=utf-8'],
  'vec/ui-taxonomy/registry.mjs': ['vec/ui-taxonomy/registry.mjs', 'text/javascript; charset=utf-8'],
  'welcome.mjs': ['welcome.mjs', 'text/javascript; charset=utf-8'],
  'generative-ui/design-composer.mjs': ['generative-ui/design-composer.mjs', 'text/javascript; charset=utf-8'],
```

_First 80 of 718 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
