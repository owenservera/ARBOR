# File: apps/mobile-relay/test/universal-control-chat.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/universal-control-chat.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 18271 B |
| Lines | 359 |
| Hash | af6a9ec95f20 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| Node | class | 7 | no | class Node { |
| constructor | method | 8 | yes | constructor(tag, doc) { |
| append | method | 14 | yes | append(...children) { this.children.push(...children); } |
| replaceChildren | method | 15 | yes | replaceChildren(...children) { this.children = children; } |
| addEventListener | method | 16 | yes | addEventListener(name, fn) { this.events[name] = fn; } |
| fixture | function | 18 | no | const fixture = () =&gt; { |
| document | const | 19 | no | const document = { |
| host | const | 23 | no | const host = new Node(&#39;div&#39;, document); |
| all | function | 26 | no | function all(node) { return [node, ...node.children.flatMap(all)]; } |
| buttons | function | 27 | no | const buttons = host =&gt; all(host).filter(x =&gt; x.tag === &#39;button&#39;); |
| displayed | function | 28 | no | const displayed = host =&gt; all(host).map(x =&gt; x.textContent).join(&#39; &#39;); |
| grant | const | 29 | no | const grant = { |
| plan | const | 33 | no | const plan = { |
| response | function | 38 | no | const response = (data,status=200)=&gt;({ok:status&gt;=200&amp;&amp;status&lt;300,status, json:async()=&gt;data}); |
| paths | const | 43 | no | const paths=[]; |
| fetchImpl | function | 44 | no | const fetchImpl = async (path,options)=&gt;{ |
| chat | const | 53 | no | const chat=createControlChat({host,transport:grant,fetchImpl}); |
| approve | const | 57 | no | const approve=buttons(host).find(x=&gt;x.textContent===&#39;Approve &amp; apply&#39;); |
| sent | const | 63 | no | const sent=paths.find(x=&gt;x[0].endsWith(&#39;/execute&#39;))[1]; |
| calls | variable | 70 | no | let calls=0; |
| chat | const | 72 | no | const chat=createControlChat({host,transport:{direct:false,deviceHeaders:()=&gt;null}, fetchImpl:async()=&gt;{calls++;throw Error(&#39;Cloud must not be called&#39;);}}); |
| executes | variable | 81 | no | let executes=0;const {host}=fixture(); |
| chat | const | 82 | no | const chat=createControlChat({host,transport:grant,fetchImpl:async path=&gt;{ if(path===&#39;/mobile/connection.json&#39;)return response({direct:true,directOnly:true,cloudEnabled:false}); if(path.endsWith(&#39;/pl… |
| executes | variable | 94 | no | let executes=0;const {host}=fixture(); |
| chat | const | 95 | no | const chat=createControlChat({host,transport:grant,fetchImpl:async path=&gt;{ if(path===&#39;/mobile/connection.json&#39;)return response({direct:true,directOnly:true,cloudEnabled:false}); if(path.endsWith(&#39;/pl… |
| executed | variable | 112 | no | let executed=0, statusReads=0; |
| receipt | const | 113 | no | const receipt={schema:&#39;vivim.control-receipt/1&#39;,planId:plan.planId, |
| chat | const | 115 | no | const chat=createControlChat({host,transport:grant,fetchImpl:async path=&gt;{ if(path===&#39;/mobile/connection.json&#39;)return response({direct:true,directOnly:true,cloudEnabled:false}); if(path.endsWith(&#39;/pl… |
| review | const | 126 | no | const review=buttons(host).find(x=&gt;x.textContent===&#39;Check PC receipt&#39;); |
| html | const | 138 | no | const html=readFileSync(new URL(&#39;../index.html&#39;,import.meta.url),&#39;utf8&#39;); |
| js | const | 139 | no | const js=readFileSync(new URL(&#39;../app.js&#39;,import.meta.url),&#39;utf8&#39;); |
| plans | variable | 152 | no | let plans=0, executed=0; |
| chat | const | 153 | no | const chat=createControlChat({host,transport:grant,fetchImpl:async path=&gt;{ if(path===&#39;/mobile/connection.json&#39;) return response({direct:true,directOnly:true,cloudEnabled:false}); if(path.endsWith(&#39;/p… |
| move | const | 160 | no | const move=buttons(host).find(x=&gt;x.textContent===&#39;Ask my AI instead&#39;); |
| calls | variable | 176 | no | let calls=0, pocket=0; |
| tabs | const | 177 | no | const tabs=[]; |
| chat | const | 178 | no | const chat=createControlChat({ host,transport:{direct:false,deviceHeaders:()=&gt;null}, onNavigate:tab=&gt;tabs.push(tab),onOpenPocket:()=&gt;pocket++, fetchImpl:async()=&gt;{calls++;throw Error(&#39;Navigation must… |
| client | const | 191 | no | const client=createControlClient({transport:{direct:true,deviceHeaders:()=&gt;null},fetchImpl: async()=&gt;response({direct:true,directOnly:true,cloudEnabled:false})}); |
| executed | variable | 198 | no | let executed=0; |
| chat | const | 199 | no | const chat=createControlChat({host,transport:grant,fetchImpl:async path=&gt;{ if(path===&#39;/mobile/connection.json&#39;)return response({direct:true,directOnly:true,cloudEnabled:false}); if(path.endsWith(&#39;/pl… |
| executed | variable | 213 | no | let executed=0; |
| chat | const | 214 | no | const chat=createControlChat({host,transport:grant,fetchImpl:async path=&gt;{ if(path===&#39;/mobile/connection.json&#39;)return response({direct:true,directOnly:true,cloudEnabled:false}); if(path.endsWith(&#39;/pl… |
| posts | const | 228 | no | const posts=[]; |
| second | const | 229 | no | const second={...plan,planId:&#39;ctl-&#39;+&#39;3&#39;.repeat(16),planDigest:&#39;4&#39;.repeat(64)}; |
| chat | const | 230 | no | const chat=createControlChat({host,transport:grant,fetchImpl:async(path,options)=&gt;{ if(path===&#39;/mobile/connection.json&#39;)return response({direct:true,directOnly:true,cloudEnabled:false}); if(path.ends… |
| choice | const | 242 | no | const choice=buttons(host).find(x=&gt;x.textContent===&#39;Set theme to dusk&#39;); |
| posts | const | 253 | no | const posts=[]; |
| undo | const | 254 | no | const undo={actionId:&#39;ui.theme.set_preset&#39;,args:{preset:&#39;day&#39;}}; |
| second | const | 255 | no | const second={...plan,planId:&#39;ctl-&#39;+&#39;5&#39;.repeat(16),planDigest:&#39;6&#39;.repeat(64),title:&#39;Undo theme&#39;}; |
| chat | const | 256 | no | const chat=createControlChat({host,transport:grant,fetchImpl:async(path,options)=&gt;{ if(path===&#39;/mobile/connection.json&#39;)return response({direct:true,directOnly:true,cloudEnabled:false}); if(path.ends… |
| undoBtn | const | 270 | no | const undoBtn=buttons(host).find(x=&gt;x.textContent===&#39;Undo this change&#39;); |
| planCalls | const | 274 | no | const planCalls=posts.filter(x=&gt;x[0]===&#39;plan&#39;); |
| surface | variable | 283 | no | let surface=&#39;today&#39;; |
| chat | const | 284 | no | const chat=createControlChat({host,transport:grant,getSurface:()=&gt;surface, fetchImpl:async path=&gt;{ if(path===&#39;/mobile/connection.json&#39;)return response({direct:true,directOnly:true,cloudEnabled:false}… |
| calls | const | 301 | no | const calls=[]; const drafts=[]; |
| chat | const | 302 | no | const chat=createControlChat({host,transport:grant, classifyBuild: text =&gt; { assert.equal(text,&#39;add a card called Research&#39;); return {domain:&#39;ui&#39;,outcome:&#39;candidate&#39;}; }, onBuildDraft: text =&gt; drafts… |
| chat | const | 321 | no | const chat=createControlChat({host,transport:grant, classifyBuild:()=&gt;{classified++;return {domain:&#39;ui&#39;,outcome:&#39;candidate&#39;};},onBuildDraft:()=&gt;assert.fail(&#39;no draft&#39;), fetchImpl:async path=&gt;path===&#39;… |
| posts | const | 334 | no | const posts=[]; |
| client | const | 335 | no | const client=createControlClient({transport:grant,fetchImpl:async(path,options)=&gt;{ if(path===&#39;/mobile/connection.json&#39;)return response({direct:true,directOnly:true,cloudEnabled:false}); posts.push([p… |
| meaning | const | 340 | no | const meaning=await client.interpret(&#39;list wiki pages&#39;); |
| chat | const | 348 | no | const chat=createControlChat({host,transport:grant,fetchImpl:async(path,options)=&gt;{ if(path===&#39;/mobile/connection.json&#39;)return response({direct:true,directOnly:true,cloudEnabled:false}); posts.push(J… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../control-chat.mjs | import | 3 | [apps/mobile-relay/control-chat.mjs](../control-chat.mjs.md) |
| ../control-client.mjs | import | 4 | [apps/mobile-relay/control-client.mjs](../control-client.mjs.md) |
| node:fs | import | 5 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createControlChat, resolveLocalDestination } from '../control-chat.mjs';
import { createControlClient } from '../control-client.mjs';
import { readFileSync } from 'node:fs';

class Node {
  constructor(tag, doc) {
    this.tag = tag; this.ownerDocument = doc;
    this.children = []; this.textContent = ''; this.className = '';
    this.events = {}; this.style = {}; this.scrollTop = 0; this.scrollHeight = 0;
    this.classList = { add: name => { this.className += ' ' + name; } };
  }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  addEventListener(name, fn) { this.events[name] = fn; }
}
const fixture = () => {
  const document = {
    createElement: tag => new Node(tag, document),
    createDocumentFragment: () => new Node('#fragment', document)
  };
  const host = new Node('div', document);
  return { host };
};
function all(node) { return [node, ...node.children.flatMap(all)]; }
const buttons = host => all(host).filter(x => x.tag === 'button');
const displayed = host => all(host).map(x => x.textContent).join(' ');
const grant = {
  direct:true,
  deviceHeaders:()=>({'x-vivim-grant-id':'a'.repeat(32),'x-vivim-device-session':'b'.repeat(32)})
};
const plan = {
  outcome:'approval_required', planId:'ctl-'+'1'.repeat(16), planDigest:'2'.repeat(64),
  expiresAt:'2099-01-01T00:00:00.000Z', title:'Set theme', actionId:'ui.theme.set_preset',
  risk:'R1', args:{preset:'dusk'}, liveAcceptance:'verified'
};
const response = (data,status=200)=>({ok:status>=200&&status<300,status,
  json:async()=>data});

test('Talk plans a command through existing Host control; approval is the only execution gate',async()=>{
  const {host}=fixture();
  const paths=[];
  const fetchImpl = async (path,options)=>{
    paths.push([path,options]);
    if(path==='/mobile/connection.json') return response({direct:true,directOnly:true,cloudEnabled:false});
    if(path==='/mobile/api/control/plan') return response(plan);
    if(path==='/mobile/api/control/execute') return response({
      schema:'vivim.control-receipt/1',planId:plan.planId,planDigest:plan.planDigest,actionId:plan.actionId,status:'applied'
    });
    throw Error('Unexpected: '+path);
  };
  const chat=createControlChat({host,transport:grant,fetchImpl});
  assert.equal(await chat.send('set my theme to dusk'),true);
  assert.match(displayed(host),/Set theme/);
  assert.equal(paths.filter(x=>x[0].endsWith('/execute')).length,0);
  const approve=buttons(host).find(x=>x.textContent==='Approve & apply');
  assert.ok(approve);
  approve.events.click();
  approve.events.click();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(paths.filter(x=>x[0].endsWith('/execute')).length,1);
  const sent=paths.find(x=>x[0].endsWith('/execute'))[1];
  assert.deepEqual(JSON.parse(sent.body),{planId:plan.planId,planDigest:plan.planDigest});
  assert.match(displayed(host),/Host receipt/);
  assert.equal(buttons(host).some(x=>x.textContent==='Approve & apply'),false);
});

test('Cloud cannot activate control, even with owner text in Talk',async()=>{
  let calls=0;
  const {host}=fixture();
  const chat=createControlChat({host,transport:{direct:false,deviceHeaders:()=>null},
    fetchImpl:async()=>{calls++;throw Error('Cloud must not be called');}});
  await chat.send('show status');
  assert.equal(calls,0);
  assert.match(displayed(host),/Direct connection/);
  assert.equal(buttons(host).some(x=>x.textContent==='Approve & apply'),false);
});

test('Invalid plan is refused before presenting an approval button',async()=>{
```

_First 80 of 360 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
