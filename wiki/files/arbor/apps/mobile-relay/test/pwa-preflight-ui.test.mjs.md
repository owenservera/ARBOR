# File: apps/mobile-relay/test/pwa-preflight-ui.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/pwa-preflight-ui.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5891 B |
| Lines | 137 |
| Hash | 5411ac4dc8e9 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| FakeNode | class | 7 | no | class FakeNode { |
| constructor | method | 8 | yes | constructor(tag,ownerDocument){ |
| append | method | 14 | yes | append(...children){this.children.push(...children)} |
| replaceChildren | method | 15 | yes | replaceChildren(...children){this.children=children} |
| setAttribute | method | 16 | yes | setAttribute(k,v){this.attrs[k]=String(v);if(k===&#39;open&#39;)this.open=true} |
| removeAttribute | method | 17 | yes | removeAttribute(k){delete this.attrs[k];if(k===&#39;open&#39;)this.open=false} |
| addEventListener | method | 18 | yes | addEventListener(k,f){this.listeners[k]=f} |
| focus | method | 19 | yes | focus(){this.ownerDocument.activeElement=this} |
| showModal | method | 20 | yes | showModal(){this.open=true} |
| close | method | 21 | yes | close(){this.open=false;this.listeners.close?.()} |
| querySelectorAll | method | 24 | yes | querySelectorAll(selector){ |
| found | const | 25 | no | const found=[]; |
| check | function | 26 | no | const check=node=&gt;{ |
| querySelector | method | 33 | yes | querySelector(selector){return this.querySelectorAll(selector)[0]\|\|null} |
| fake | function | 35 | no | function fake(){ |
| document | const | 36 | no | const document={ |
| find | function | 44 | no | function find(node,condition,out=[]){ |
| memory | function | 49 | no | function memory(){ |
| map | const | 50 | no | const map=new Map(); |
| document | const | 55 | no | const document=fake(),called=[]; |
| state | variable | 56 | no | let state={mode:&#39;direct&#39;,paired:true,online:true,mediaVisible:true,controlRead:true}; |
| launcher | const | 57 | no | const launcher=mountCapabilityLauncher({ host:document.body,context:()=&gt;state,onActivate:x=&gt;called.push(x.id) }); |
| original | const | 60 | no | const original=document.createElement(&#39;button&#39;);document.body.append(original);original.focus(); |
| dialog | const | 62 | no | const dialog=find(document.body,x=&gt;x.tagName===&#39;DIALOG&#39;)[0]; |
| input | const | 64 | no | const input=find(dialog,x=&gt;x.tagName===&#39;INPUT&#39;)[0]; |
| result | const | 67 | no | const result=find(dialog,x=&gt;x.dataset?.id===&#39;media&#39;)[0]; |
| control | const | 77 | no | const control=find(dialog,x=&gt;x.dataset?.id===&#39;control&#39;)[0]; |
| document | const | 84 | no | const document=fake(),storage=memory(),copied=[]; |
| seq | variable | 85 | no | let seq=0; |
| files | const | 86 | no | const files=[]; |
| notes | const | 87 | no | const notes=mountLocalNotes({ host:document.body,storage, makeId:()=&gt; &#39;note-id-&#39;+(++seq),now:()=&gt;1700000000000, copyText:async text=&gt;{copied.push(text)}, saveFile:(name,contents)=&gt;files.push({name,co… |
| dialog | const | 95 | no | const dialog=find(document.body,x=&gt;x.tagName===&#39;DIALOG&#39;)[0]; |
| textarea | const | 97 | no | const textarea=find(dialog,x=&gt;x.tagName===&#39;TEXTAREA&#39;)[0]; |
| save | const | 99 | no | const save=find(dialog,x=&gt;x.textContent===&#39;Save on this device&#39;)[0]; |
| copy | const | 104 | no | const copy=find(dialog,x=&gt;x.textContent===&#39;Copy&#39;)[0]; |
| download | const | 107 | no | const download=find(dialog,x=&gt;x.textContent===&#39;Download JSON&#39;)[0]; |
| copyAll | const | 111 | no | const copyAll=find(dialog,x=&gt;x.textContent===&#39;Copy all saved notes&#39;)[0]; |
| clear | const | 114 | no | const clear=find(dialog,x=&gt;x.textContent===&#39;Delete all saved notes&#39;)[0]; |
| document | const | 124 | no | const document=fake(),storage=memory(); |
| notes | const | 125 | no | const notes=mountLocalNotes({ host:document.body,storage,makeId:()=&gt; &#39;safe-id-123456&#39;, now:()=&gt;1700000000000,copyText:async()=&gt;{} }); |
| dialog | const | 130 | no | const dialog=find(document.body,x=&gt;x.tagName===&#39;DIALOG&#39;)[0]; |
| textarea | const | 131 | no | const textarea=find(dialog,x=&gt;x.tagName===&#39;TEXTAREA&#39;)[0]; |
| paragraph | const | 134 | no | const paragraph=find(dialog,x=&gt;x.textContent===&#39;&lt;img src=x onerror=alert(1)&gt;&#39;)[0]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../ux/launcher-ui.mjs | import | 3 | [apps/mobile-relay/ux/launcher-ui.mjs](../ux/launcher-ui.mjs.md) |
| ../ux/local-notes-ui.mjs | import | 4 | [apps/mobile-relay/ux/local-notes-ui.mjs](../ux/local-notes-ui.mjs.md) |
| ../ux/local-notes.mjs | import | 5 | [apps/mobile-relay/ux/local-notes.mjs](../ux/local-notes.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mountCapabilityLauncher } from '../ux/launcher-ui.mjs';
import { mountLocalNotes } from '../ux/local-notes-ui.mjs';
import { NOTES_KEY } from '../ux/local-notes.mjs';

class FakeNode {
  constructor(tag,ownerDocument){
    this.tagName=tag.toUpperCase();this.ownerDocument=ownerDocument;
    this.children=[];this.listeners={};this.dataset={};this.attrs={};
    this.style={};this.textContent='';this.hidden=false;this.open=false;
    this.value='';this.disabled=false;this.isConnected=true;
  }
  append(...children){this.children.push(...children)}
  replaceChildren(...children){this.children=children}
  setAttribute(k,v){this.attrs[k]=String(v);if(k==='open')this.open=true}
  removeAttribute(k){delete this.attrs[k];if(k==='open')this.open=false}
  addEventListener(k,f){this.listeners[k]=f}
  focus(){this.ownerDocument.activeElement=this}
  showModal(){this.open=true}
  close(){this.open=false;this.listeners.close?.()}
  get className(){return this.attrs.class||this._class||''}
  set className(v){this._class=v}
  querySelectorAll(selector){
    const found=[];
    const check=node=>{
      if(selector==='button:not([disabled])'&&node.tagName==='BUTTON'&&!node.disabled)found.push(node);
      for(const child of node.children)if(child&&typeof child==='object')check(child);
    };
    check(this);
    return found;
  }
  querySelector(selector){return this.querySelectorAll(selector)[0]||null}
}
function fake(){
  const document={
    activeElement:null,
    createElement(tag){return new FakeNode(tag,document)}
  };
  document.body=document.createElement('body');
  document.activeElement=document.body;
  return document;
}
function find(node,condition,out=[]){
  if(condition(node))out.push(node);
  for(const child of node.children||[])if(child&&typeof child==='object')find(child,condition,out);
  return out;
}
function memory(){
  const map=new Map();
  return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),map};
}

test('capability launcher works with only local navigation and restores prior focus',()=>{
  const document=fake(),called=[];
  let state={mode:'direct',paired:true,online:true,mediaVisible:true,controlRead:true};
  const launcher=mountCapabilityLauncher({
    host:document.body,context:()=>state,onActivate:x=>called.push(x.id)
  });
  const original=document.createElement('button');document.body.append(original);original.focus();
  launcher.open();
  const dialog=find(document.body,x=>x.tagName==='DIALOG')[0];
  assert.equal(dialog.open,true);
  const input=find(dialog,x=>x.tagName==='INPUT')[0];
  assert.equal(document.activeElement,input);
  input.value='movie';input.listeners.input();
  const result=find(dialog,x=>x.dataset?.id==='media')[0];
  assert.ok(result);
  assert.equal(result.disabled,false);
  result.listeners.click();
  assert.deepEqual(called,['media']);
  assert.equal(dialog.open,false);
  assert.equal(document.activeElement,original);

  launcher.open();input.value='Control';input.listeners.input();
  state={mode:'direct',paired:false,online:false};
  const control=find(dialog,x=>x.dataset?.id==='control')[0];
  control.listeners.click();
  assert.deepEqual(called,['media'],'stale capability grants cannot act');
  launcher.close();
```

_First 80 of 138 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
