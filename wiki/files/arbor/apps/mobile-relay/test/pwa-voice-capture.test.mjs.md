# File: apps/mobile-relay/test/pwa-voice-capture.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/pwa-voice-capture.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4940 B |
| Lines | 90 |
| Hash | 646d7510d280 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| Node | class | 5 | no | class Node { |
| constructor | method | 6 | yes | constructor(tag,doc){this.tagName=tag.toUpperCase();this.ownerDocument=doc; |
| append | method | 9 | yes | append(...xs){this.children.push(...xs)} |
| setAttribute | method | 10 | yes | setAttribute(k,v){this.attrs[k]=String(v);if(k===&#39;open&#39;)this.open=true} |
| removeAttribute | method | 11 | yes | removeAttribute(k){delete this.attrs[k];if(k===&#39;open&#39;)this.open=false} |
| addEventListener | method | 12 | yes | addEventListener(k,cb){this.listeners[k]=cb} |
| showModal | method | 13 | yes | showModal(){this.open=true} |
| close | method | 14 | yes | close(){this.open=false} |
| focus | method | 15 | yes | focus(){this.ownerDocument.activeElement=this} |
| find | method | 16 | yes | find(text){if(this.textContent===text)return this; |
| fixture | function | 19 | no | function fixture(){ |
| doc | const | 20 | no | const doc={createElement(tag){return new Node(tag,doc)},addEventListener(k,cb){this[k]=cb}}; |
| Recorder | class | 24 | no | class Recorder { |
| isTypeSupported | method | 25 | yes | static isTypeSupported(){return true} |
| constructor | method | 26 | yes | constructor(stream){this.stream=stream;this.state=&#39;inactive&#39;;this.mimeType=&#39;audio/webm&#39;} |
| start | method | 27 | yes | start(){this.state=&#39;recording&#39;} |
| stop | method | 28 | yes | stop(){ |
| doc | const | 36 | no | const doc=fixture(),files=[],stopped=[],urls=[]; |
| capture | const | 37 | no | const capture=mountVoiceCapture({ host:doc.body,Recorder,BlobCtor:Blob, devices:{async getUserMedia(args){assert.deepEqual(args,{audio:true});return { getTracks:()=&gt;[{stop:()=&gt;stopped.push(&#39;microphon… |
| dialog | const | 48 | no | const dialog=doc.body.children[0]; |
| doc | const | 69 | no | const doc=fixture(),capture=mountVoiceCapture({host:doc.body,devices:null,Recorder:null}); |
| doc | const | 76 | no | const doc=fixture();let finish,requests=0,stops=0; |
| capture | const | 77 | no | const capture=mountVoiceCapture({host:doc.body,Recorder,BlobCtor:Blob,devices:{getUserMedia(){requests++;return new Promise(r=&gt;finish=r);}},urlApi:{createObjectURL:()=&gt; &#39;blob:test&#39;,revokeObjectURL(){… |
| doc | const | 86 | no | const doc=fixture();let active;class BrokenRecorder extends Recorder{constructor(stream){super(stream);active=this;}} |
| capture | const | 87 | no | const capture=mountVoiceCapture({host:doc.body,Recorder:BrokenRecorder,BlobCtor:Blob,devices:{async getUserMedia(){return {getTracks:()=&gt;[{stop(){}}]};}},urlApi:{createObjectURL:()=&gt; &#39;blob:test&#39;,revo… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../ux/voice-capture.mjs | import | 3 | [apps/mobile-relay/ux/voice-capture.mjs](../ux/voice-capture.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {mountVoiceCapture,MAX_VOICE_MS,MAX_VOICE_BYTES} from '../ux/voice-capture.mjs';

class Node {
  constructor(tag,doc){this.tagName=tag.toUpperCase();this.ownerDocument=doc;
    this.children=[];this.listeners={};this.attrs={};this.style={};this.textContent='';
    this.hidden=false;this.open=false;this.isConnected=true;}
  append(...xs){this.children.push(...xs)}
  setAttribute(k,v){this.attrs[k]=String(v);if(k==='open')this.open=true}
  removeAttribute(k){delete this.attrs[k];if(k==='open')this.open=false}
  addEventListener(k,cb){this.listeners[k]=cb}
  showModal(){this.open=true}
  close(){this.open=false}
  focus(){this.ownerDocument.activeElement=this}
  find(text){if(this.textContent===text)return this;
    for(const child of this.children){const found=child.find?.(text);if(found)return found}return null}
}
function fixture(){
  const doc={createElement(tag){return new Node(tag,doc)},addEventListener(k,cb){this[k]=cb}};
  doc.body=doc.createElement('body');doc.activeElement=doc.body;
  return doc;
}
class Recorder {
  static isTypeSupported(){return true}
  constructor(stream){this.stream=stream;this.state='inactive';this.mimeType='audio/webm'}
  start(){this.state='recording'}
  stop(){
    if(this.state!=='recording')return;
    this.state='inactive';
    this.ondataavailable?.({data:new Blob(['voice bytes'],{type:'audio/webm'})});
    this.onstop?.();
  }
}
test('recording starts only after explicit click, stays local and downloads only by owner action',async()=>{
 const doc=fixture(),files=[],stopped=[],urls=[];
 const capture=mountVoiceCapture({
   host:doc.body,Recorder,BlobCtor:Blob,
   devices:{async getUserMedia(args){assert.deepEqual(args,{audio:true});return {
     getTracks:()=>[{stop:()=>stopped.push('microphone stopped')}]
   }}},
   urlApi:{createObjectURL:()=>{const id='blob:test'+urls.length;urls.push(id);return id},
     revokeObjectURL:()=>{}},
   downloadFile:(name,blob)=>files.push({name,blob})
 });
 assert.equal(capture.available,true);
 assert.equal(MAX_VOICE_MS,30000);assert.equal(MAX_VOICE_BYTES,6*1024*1024);
 const dialog=doc.body.children[0];
 assert.equal(dialog.open,false);
 assert.equal(files.length,0);
 capture.open();assert.equal(dialog.open,true);
 dialog.find('Start recording').listeners.click();
 for(let i=0;i<4;i++)await Promise.resolve();
 assert.equal(capture.isRecording(),true);
 assert.equal(files.length,0);
 dialog.find('Stop recording').listeners.click();
 assert.equal(capture.isRecording(),false);
 assert.ok(stopped.length>0);
 assert.equal(files.length,0);
 assert.ok(dialog.find('Download audio').hidden===false);
 capture.close();
 assert.equal(dialog.open,true,'unsaved clip cannot be closed or silently discarded');
 dialog.find('Download audio').listeners.click();
 assert.equal(files.length,1);
 assert.equal(files[0].name,'vivim-voice-note.webm');
 capture.close();assert.equal(dialog.open,false);
});
test('unsupported microphone cannot start or request access',()=>{
 const doc=fixture(),capture=mountVoiceCapture({host:doc.body,devices:null,Recorder:null});
 assert.equal(capture.available,false);
 assert.equal(capture.open(),false);
});

test('pending microphone permission cannot start recording after close, cancel or hidden page',async()=>{
 for(const mode of ['close','cancel','hidden']){
  const doc=fixture();let finish,requests=0,stops=0;
  const capture=mountVoiceCapture({host:doc.body,Recorder,BlobCtor:Blob,devices:{getUserMedia(){requests++;return new Promise(r=>finish=r);}},urlApi:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}}});
  capture.open();const dialog=doc.body.children[0],click=dialog.find('Start recording').listeners.click;
  click();click();assert.equal(requests,1,'one pending permission request');
  if(mode==='close')capture.close();else if(mode==='cancel')dialog.listeners.cancel({preventDefault(){}});else{doc.hidden=true;doc.visibilitychange();}
```

_First 80 of 91 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
