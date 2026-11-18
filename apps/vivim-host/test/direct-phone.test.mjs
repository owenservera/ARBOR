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
  assert.ok(session.sessionId);
  const falseAck={commandId:'cmd-'+'b'.repeat(16),messageId:'msg-'+'b'.repeat(16),
    conversationId:'c-'+'b'.repeat(16),replyRevision:1};
  // Rendering a local status is never enough: without a verified reply,
  // even an authenticated phone cannot advance delivery.
  assert.equal((await call('/mobile/api/live/ack',{
    method:'POST',headers:{origin,'x-vivim-ack':'1','content-type':'application/json'},
    body:JSON.stringify(falseAck)})).status,401);
  deviceHeaders={'x-vivim-grant-id':grant.grantId,'x-vivim-device-session':session.sessionId};
  const wikiRead = await call('/mobile/api/wiki');
  assert.equal(wikiRead.status, 200);
  const wiki = JSON.parse(wikiRead.body);
  assert.ok(Number.isSafeInteger(wiki.revision));
  assert.ok(wiki.pages && typeof wiki.pages === 'object');
  assert.equal((await call('/mobile/api/wiki', { method:'POST' })).status, 405);
  assert.equal((await call('/mobile/api/wiki', { headers: { 'x-vivim-device-session': '0'.repeat(32) } })).status, 401);
  const graphRead=await call('/mobile/api/chat/context?focus=talk');
  assert.equal(graphRead.status,200);
  const graphBody=JSON.parse(graphRead.body);
  assert.equal(graphBody.schema,'vivim.hqkg-chat-context/1');
  assert.ok(['unavailable','source-backed'].includes(graphBody.state));
  assert.equal(graphBody.items instanceof Array,true);
  assert.equal(JSON.stringify(graphBody).includes('planDigest'),false);
  assert.equal((await call('/mobile/api/chat/context?focus=../secret')).status,400);
  assert.equal((await call('/mobile/api/chat/context?focus=talk&focus=world')).status,400);
  assert.equal((await call('/mobile/api/chat/context?focus=talk',{method:'POST'})).status,405);
  assert.equal(JSON.parse((await call('/mobile/api/relay?path=session')).body).paired,true);
  const mediaRead = await call('/mobile/api/media/library');
  assert.equal(mediaRead.status, 200);
  const mediaView = JSON.parse(mediaRead.body);
  assert.equal(mediaView.schema, 'vivim.media-library-summary/1');
  // This Host has an EMPTY pinned store, so the library summary is unavailable.
  // The route must report that honestly and hand back no items — the exact
  // vocabulary depends on why the store is unavailable (see media-library-summary
  // and media-playback suites), but it must never claim a ready, playable library.
  assert.equal(mediaView.state, 'unavailable');
  assert.ok(Array.isArray(mediaView.items));
  assert.equal(mediaView.items.length, 0);
  assert.equal(mediaView.total, 0);
  assert.notEqual(mediaView.playback, 'available');
  assert.equal((await call('/mobile/api/media/library?foreign=1')).status, 400);
  assert.equal((await call('/mobile/api/media/library?offset=0')).status, 200);
  assert.equal((await call('/mobile/api/media/library?offset=not-a-number')).status, 400);
  assert.equal((await call('/mobile/api/media/library?offset=100001')).status, 400);
  assert.equal((await call('/mobile/api/media/library', { method:'POST' })).status, 405);
  assert.equal((await call('/mobile/api/live/ack',{
    method:'POST',headers:{origin:'https://invalid.example','x-vivim-ack':'1',
      'content-type':'application/json'},
    body:JSON.stringify(falseAck)})).status,403);
  assert.equal((await call('/mobile/api/live/ack',{
    method:'POST',headers:{origin,'x-vivim-ack':'1','content-type':'application/json'},
    body:JSON.stringify(falseAck)})).status,409);

  assert.equal(trustedPhonePresence,1);
  assert.equal((await call('/mobile/api/control/execute', { method:'POST', headers:{origin,'x-vivim-control':'1','content-type':'application/json'},body:'{}' })).status,403);
  const connection = JSON.parse((await call('/mobile/connection.json')).body);
  assert.equal(connection.directOnly, true);
  assert.equal(connection.cloudEnabled, false);
  assert.equal((await call('/mobile/ux/model.mjs')).status, 200);
  assert.equal((await call('/mobile/ux/mission-experience.mjs')).status, 200);
  assert.equal((await call('/mobile/ux/render.mjs')).status, 200);
  assert.equal((await call('/mobile/control-client.mjs')).status, 200);
  assert.equal((await call('/mobile/control-chat.mjs')).status, 200);
  assert.equal((await call('/mobile/generative-ui/catalog.mjs')).status, 200);
  assert.equal((await call('/mobile/generative-ui/compiler.mjs')).status, 200);
  assert.equal((await call('/mobile/generative-ui/renderer.mjs')).status, 200);
  assert.equal((await call('/mobile/generative-ui/bootstrap-adapters.mjs')).status, 200);
  assert.equal((await call('/mobile/generative-ui/semantic-projection.mjs')).status, 200);
  assert.equal((await call('/mobile/generative-ui/portable-digest.mjs')).status, 200);
  assert.equal((await call('/mobile/grokbot.html')).status, 200);
  assert.equal((await call('/mobile/grokbot.js')).status, 200);
  const workerStatus = JSON.parse((await call('/mobile/api/relay?path=agent%2Fstatus')).body);
  assert.equal(workerStatus.transport, 'direct');
  assert.equal(workerStatus.nativeWorker.available, false);
  const status = JSON.parse((await call('/mobile/api/relay?path=status')).body);
  assert.deepEqual(status.snapshot.bootstrap.cards, []);
  assert.deepEqual(status.snapshot.bootstrap.preferences, []);
  assert.deepEqual(status.snapshot.bootstrap.hardNos, []);
  const payload = JSON.stringify({ text: 'choose-preset', kind: 'command', consumer: 'bootstrap', mode: 'bootstrap', action: 'choose-preset', preset: 'tide' });
  const target = '/mobile/api/relay?path=commands';
  assert.equal((await call(target, { method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, body: payload })).status, 403);
  assert.equal((await call(target, { method: 'POST', headers: { origin }, body: payload })).status, 415);
  assert.equal((await call(target, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: ' '.repeat(65537) })).status, 413);
  assert.equal((await call(target, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ text: 'personalize', kind: 'command', consumer: 'bootstrap', mode: 'bootstrap', action: 'personalize' }) })).status, 501);
  const bootstrapGrant = await call(target, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ text: 'grant-visual', kind: 'command', consumer: 'bootstrap', mode: 'bootstrap', action: 'grant-visual' }) });
  assert.equal(bootstrapGrant.status, 201);
  const bridge = createBridgeStore({ root });
  const worker = createBootstrapCommandWorker({ root, runtime });
  assert.equal(worker.tick()[0].status, 'done');
  const created = await call(target, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: payload });
  assert.equal(created.status, 201);
  const id = JSON.parse(created.body).id;
  assert.equal(bridge.list().items.length, 2);
  assert.equal(bridge.get(id).transport, 'direct');
  assert.equal(worker.tick()[0].status, 'done');
  assert.equal(worker.tick().length, 0);
  assert.equal(JSON.parse((await call(`/mobile/api/relay?path=commands%2F${id}`)).body).status, 'done');
  const projection = JSON.parse((await call('/mobile/api/relay?path=status')).body).snapshot.bootstrap;
  assert.equal(projection.source, 'owner-choice');
  assert.equal(projection.revision, 0);
  const db = new DatabaseSync(runtime.file, { readOnly: true });
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM themes WHERE request_id = ?').get('relay-' + id).count, 1);
  db.close();
  worker.close();
  // Actual Direct ingress must project only source-backed metadata, then reconcile
  // Studio claim on the next authenticated status poll. Never infer reply/delivery.
  const convo='c-'+'a'.repeat(16);
  const chat = await call(target, {method:'POST',
    headers:{origin,'content-type':'application/json'},
    body:JSON.stringify({text:'private user prompt',kind:'command',consumer:'harness',
      mode:'relay-chat',conversationId:convo,target:{provider:'chatgpt'}})});
  assert.equal(chat.status,201);
  const chatId=JSON.parse(chat.body).id;
  const firstLive=JSON.parse((await call('/mobile/api/relay?path=status')).body).snapshot.live;
  const messages=firstLive.conversations.find(c=>c.id===convo)?.messages ?? [];
  assert.equal(messages[0]?.state,'remote_queued');
  assert.equal(messages[0]?.delivered,false);
  assert.equal(JSON.stringify(firstLive).includes('private user prompt'),false);
  bridge.claim(chatId,{by:'harness'});
  const claimedLive=JSON.parse((await call('/mobile/api/relay?path=status')).body).snapshot.live;
  assert.equal(claimedLive.conversations.find(c=>c.id===convo).messages[0].state,'claimed');
  // The shipped phone session route is VIVIM-owned: it reads the canonical
  // ledger and queues a relay-chat command. It never starts a CLI.
  const sessions=JSON.parse((await call('/mobile/api/relay?path=sessions')).body);
  assert.ok(sessions.sessions.some(s=>s.id===convo));
  assert.equal(sessions.sessions.find(s=>s.id===convo).provider,'chatgpt');
  const legacySessions=JSON.parse((await call('/mobile/api/relay?path=opencode%2Fsessions')).body);
  assert.deepEqual(legacySessions.sessions,sessions.sessions);
  const phoneTranscript=JSON.parse((await call(`/mobile/api/relay?path=sessions%2F${convo}%2Fmessages`)).body);
  assert.equal(phoneTranscript.messages[0].type,'user');
  assert.equal(phoneTranscript.messages[0].text,'private user prompt');
  const phoneMessageId='msg_'+'f'.repeat(32);
  const admitted=await call(`/mobile/api/relay?path=sessions%2F${convo}%2Fprompt`,{
    method:'POST',headers:{origin,'content-type':'application/json'},
    body:JSON.stringify({id:phoneMessageId,text:'second question'})});
  assert.equal(admitted.status,200);
  assert.deepEqual(JSON.parse(admitted.body),{accepted:true,id:phoneMessageId,sessionId:convo});
  const queued=bridge.list({consumer:'harness',limit:20}).items.filter(r=>r.mode==='relay-chat'&&r.messageId===phoneMessageId);
  assert.equal(queued.length,1);
  assert.equal(queued[0].text,'@chatgpt second question');
  assert.equal(queued[0].status,'queued');
  // The owner message id is the phone session route's own channel: the relay
  // command route cannot inject one.
  assert.equal(bridge.get(chatId).messageId,undefined);
  const afterPrompt=JSON.parse((await call(`/mobile/api/relay?path=sessions%2F${convo}%2Fmessages`)).body);
  assert.equal(afterPrompt.messages[afterPrompt.messages.length-1].id,phoneMessageId);
  assert.equal(afterPrompt.messages[afterPrompt.messages.length-1].text,'second question');
  // An ambiguous repeat is refused, never queued twice.
  const repeated=await call(`/mobile/api/relay?path=sessions%2F${convo}%2Fprompt`,{
    method:'POST',headers:{origin,'content-type':'application/json'},
    body:JSON.stringify({id:phoneMessageId,text:'second question'})});
  assert.equal(repeated.status,409);
  assert.equal(bridge.list({consumer:'harness',limit:20}).items.filter(r=>r.messageId===phoneMessageId).length,1);
  owner.revokeGrant({grantId:grant.grantId,revokedBy:'desktop-owner'});
  const seenBeforeRevokedRequest=trustedPhonePresence;
  assert.equal((await call('/mobile/api/relay?path=session')).status,403);
  assert.equal((await call('/mobile/api/media/library')).status,403);
  assert.equal((await call('/mobile/api/chat/context?focus=talk')).status,403);
  assert.equal(trustedPhonePresence,seenBeforeRevokedRequest);
});


test('chat context is a strictly bounded read-only Host-owned native projection',()=>{
  const source=readFileSync(new URL('../direct-phone.mjs',import.meta.url),'utf8');
  const host=readFileSync(new URL('../server.mjs',import.meta.url),'utf8');
  assert.match(source,/if \(route === 'api\/chat\/context'\)/);
  assert.match(source,/authorizeDevice\(req,'control:read'\)/);
  assert.match(source,/req\.method !== 'GET'/);
  assert.match(source,/CHAT_FOCUS_INVALID/);
  assert.match(source,/chatContext\(query\[0\]\[1\]\)/);
  assert.match(source,/cache-control','private, no-store'/);
  assert.match(host,/createRustChatContext\(\)/);
  assert.match(host,/chatContext: createRustChatContext\(\)/);
});


test('manual provider discovery is explicit, owner-scoped and never a provider send',()=>{
  const direct=readFileSync(new URL('../direct-phone.mjs',import.meta.url),'utf8');
  const host=readFileSync(new URL('../server.mjs',import.meta.url),'utf8');
  const app=readFileSync(new URL('../../mobile-relay/app.js',import.meta.url),'utf8');
  assert.match(direct,/route === 'api\/chat\/providers\/refresh'/);
  assert.match(direct,/authorizeDevice\(req,'control:read'\)/);
  assert.match(direct,/req\.headers\.origin!==origin/);
  assert.match(direct,/x-vivim-providers/);
  assert.match(host,/onboardingService\.check\(id\)/);
  assert.match(app,/dock-provider-refresh/);
  assert.match(app,/method:'POST',cache:'no-store',credentials:'same-origin'/);
  assert.doesNotMatch(host,/providerRefresh:[\s\S]{0,500}sendOnce\(/);
});
