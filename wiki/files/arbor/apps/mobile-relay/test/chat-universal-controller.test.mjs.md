# File: apps/mobile-relay/test/chat-universal-controller.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/chat-universal-controller.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3674 B |
| Lines | 66 |
| Hash | c97c710afe7e |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| source | function | 4 | no | const source=(path)=&gt;readFileSync(new URL(path,import.meta.url),&#39;utf8&#39;); |
| html | const | 5 | no | const html=source(&#39;../index.html&#39;),app=source(&#39;../app.js&#39;); |
| direct | const | 6 | no | const direct=source(&#39;../../vivim-host/direct-phone.mjs&#39;); |
| server | const | 7 | no | const server=source(&#39;../../vivim-host/server.mjs&#39;); |
| rust | const | 8 | no | const rust=source(&#39;../../vivim-host/chat/rust-context.mjs&#39;); |
| voice | const | 43 | no | const voice=source(&#39;../ux/voice-capture.mjs&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
 assert.match(app,/\['today','talk','build','world','me','control'\]/);
 assert.match(app,/current\.mission\?\.schema==='vivim\.mission-card\/1'/);
 assert.match(html,/No invented ETA/);
});
test('Direct to Rust context is read-only, grant-bound and never an approval token',()=>{
 assert.match(direct,/if \(route === 'api\/chat\/context'\)/);
 assert.match(direct,/authorizeDevice\(req,'control:read'\)/);
 assert.match(server,/chatContext: createRustChatContext\(\)/);
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
 assert.match(app,/mountVoiceCapture\(\{host:document\.body\}\)/);
 assert.match(voice,/getUserMedia\(\{audio:true\}\)/);
 assert.match(voice,/Download or explicitly discard the recording/);
 assert.doesNotMatch(voice,/fetch\(|WebSocket|XMLHttpRequest|SpeechRecognition|sendToHost/);
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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
