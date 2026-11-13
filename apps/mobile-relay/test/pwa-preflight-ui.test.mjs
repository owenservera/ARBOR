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
  let state={mode:'direct',paired:true,online:true,mediaVisible:true};
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
});

test('offline notes save only on explicit click, copy text and delete all after confirmation',async()=>{
  const document=fake(),storage=memory(),copied=[];
  let seq=0;
  const notes=mountLocalNotes({
    host:document.body,storage,
    makeId:()=> 'note-id-'+(++seq),now:()=>1700000000000,
    copyText:async text=>{copied.push(text)}
  });
  assert.equal(storage.map.has(NOTES_KEY),false);
  notes.open();
  const dialog=find(document.body,x=>x.tagName==='DIALOG')[0];
  assert.equal(dialog.open,true);
  const textarea=find(dialog,x=>x.tagName==='TEXTAREA')[0];
  textarea.value='An offline idea';
  const save=find(dialog,x=>x.textContent==='Save on this device')[0];
  save.listeners.click();
  assert.equal(notes.list().length,1);
  assert.equal(notes.list()[0].text,'An offline idea');
  assert.equal(textarea.value,'');
  const copy=find(dialog,x=>x.textContent==='Copy')[0];
  await copy.listeners.click();
  assert.deepEqual(copied,['An offline idea']);
  const clear=find(dialog,x=>x.textContent==='Delete all saved notes')[0];
  clear.listeners.click();
  assert.equal(notes.list().length,1,'one click must not delete all');
  clear.listeners.click();
  assert.deepEqual(notes.list(),[]);
  notes.close();
  assert.equal(dialog.open,false);
});

test('local note markup is rendered as text nodes, never as HTML',()=>{
  const document=fake(),storage=memory();
  const notes=mountLocalNotes({
    host:document.body,storage,makeId:()=> 'safe-id-123456',
    now:()=>1700000000000,copyText:async()=>{}
  });
  notes.open();
  const dialog=find(document.body,x=>x.tagName==='DIALOG')[0];
  const textarea=find(dialog,x=>x.tagName==='TEXTAREA')[0];
  textarea.value='<img src=x onerror=alert(1)>';
  find(dialog,x=>x.textContent==='Save on this device')[0].listeners.click();
  const paragraph=find(dialog,x=>x.textContent==='<img src=x onerror=alert(1)>')[0];
  assert.ok(paragraph);
  assert.equal(find(dialog,x=>x.tagName==='IMG').length,0);
});
