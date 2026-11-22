import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=(path)=>readFileSync(new URL(path,import.meta.url),'utf8');
const html=source('../index.html'),app=source('../app.js');
const direct=source('../../vivim-host/direct-phone.mjs');
const server=source('../../vivim-host/server.mjs');
const rust=source('../../vivim-host/chat/rust-context.mjs');

test('the universal controller reuses exactly one real composer and send path',()=>{
 assert.equal((html.match(/class="composer" id="chat-composer"/g)||[]).length,1);
 assert.equal((html.match(/id="text" rows="1"/g)||[]).length,1);
 assert.equal((html.match(/id="send" class="round"/g)||[]).length,1);
 assert.match(app,/\$\('app'\)\.append\(\$\('chat-composer'\)\)/);
 assert.match(app,/if\(S\.tab!=='talk'\)goTab\('talk'\);\s*void send\(\)/);
 assert.match(app,/mountUniversalDock\(\);/);
 assert.match(app,/dockExpanded=false;\s*chatContextEpoch\+\+/);
 assert.match(app,/if \(N\.target === 'vivim'\)/);
 assert.match(source('../control-chat.mjs'),/client\.preview\(text\)/); // existing Host planner
});
test('L0 and L1 navigate existing Talk modes and source-backed focused surfaces only',()=>{
 for(const id of ['dock-home','dock-recents','dock-focus','dock-feed']){
   assert.ok(html.includes('id="'+id+'"'));
 }
 for(const target of ['vivim','harness','phone'])assert.ok(html.includes('data-chat-target="'+target+'"'));
 assert.match(app,/N\.target!=='harness'/);
  assert.ok(app.includes("const CHAT_FOCUS = Object.freeze(['today','talk','build','world','wiki','me','control'])"));
 assert.match(app,/current\.mission\?\.schema==='vivim\.mission-card\/1'/);
 assert.match(html,/No invented ETA/);
});
test('Direct to Rust context is read-only, grant-bound and never an approval token',()=>{
 assert.match(direct,/if \(route === 'api\/chat\/context'\)/);
 assert.match(direct,/authorizeDevice\(req,'control:read'\)/);
  assert.ok(server.includes('chatContext: nativeContext'));
  assert.ok(server.includes('const nativeContext = createRustChatContext({dataRoot:path.resolve(dataRoot),productJournal,control:controlFor})'));
 assert.match(rust,/shell:false,windowsHide:true/);
 assert.match(rust,/RUST_CORE_NOT_CONFIGURED/);
 assert.match(app,/chatContextEpoch\+\+;/);
 assert.match(app,/transport\.deviceHeaders\?\.\(\)/);
 assert.doesNotMatch(rust,/execSync|spawn\(|fetch\(/);
 assert.doesNotMatch(direct,/chatContext\([^)]*\).*\.execute\(/);
});
test('microphone button and local recorder cannot issue Host or AI requests',()=>{
 const voice=source('../ux/voice-capture.mjs');
 assert.match(html,/id="dock-mic"/);
  assert.ok(app.includes('mountVoiceCapture({host:document.body,onReviewedText:text=>localNotes?.draft(text)??false})'));
 assert.match(voice,/getUserMedia\(\{audio:true\}\)/);
 assert.match(voice,/Download or explicitly discard the recording/);
  assert.match(voice,/createLocalDictation\(/);
  assert.doesNotMatch(voice,/fetch\(|WebSocket|XMLHttpRequest|sendToHost/);
});

test('combined inbox is source-backed aggregation only, never implicit multi-send',()=>{
 assert.match(app,/let combinedInbox = true/);
 assert.match(app,/combinedInbox\s*\?\s*'Combined inbox/);
 assert.match(app,/combined\.dataset\.combined='1'/);
 assert.match(app,/All conversations\. Sends only to the selected provider/);
 assert.match(app,/if\(e\.target\.closest\('\[data-combined\]'\)\)/);
 assert.match(app,/combinedInbox=false/);
 assert.doesNotMatch(app,/Promise\.all\(providers\(\)\.map/);
});

test('revoking a device immediately invalidates Rust context and browser checks',()=>{
  assert.match(app,/isInvalidDeviceSession\(data\?\.reason\|\|data\?\.code\)/);
  assert.match(app,/isInvalidDeviceSession\(result\?\.reason\|\|result\?\.code\)/);
  assert.match(app,/clearPrivatePhoneState\(\)/);
  assert.match(app,/transport\.setDeviceSession\(null\)/);
});
