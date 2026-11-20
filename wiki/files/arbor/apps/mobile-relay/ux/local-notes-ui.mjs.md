# File: apps/mobile-relay/ux/local-notes-ui.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/ux/local-notes-ui.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9091 B |
| Lines | 158 |
| Hash | 448b0a60e9dd |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| mountLocalNotes | function | 5 | yes | export function mountLocalNotes({host,storage,copyText,saveFile,now,makeId,onCapture=null,canCapture=()=&gt;false}={}){ |
| notebook | const | 7 | no | const notebook=createLocalNotebook({storage,now,makeId}); |
| doc | const | 8 | no | const doc=host.ownerDocument; |
| make | function | 9 | no | const make=(tag,cls,text)=&gt;{ |
| n | const | 10 | no | const n=doc.createElement(tag);if(cls)n.className=cls; |
| dialog | const | 14 | no | const dialog=make(&#39;dialog&#39;,&#39;pwa-notes&#39;);dialog.id=&#39;pwa-local-notes&#39;; |
| bar | const | 16 | no | const bar=make(&#39;header&#39;,&#39;notes-head&#39;); |
| title | const | 17 | no | const title=make(&#39;h2&#39;,&#39;&#39;, &#39;Quick capture&#39;); |
| dismiss | const | 18 | no | const dismiss=make(&#39;button&#39;,&#39;btn sm&#39;,&#39;Close&#39;);dismiss.type=&#39;button&#39;; |
| notice | const | 20 | no | const notice=make(&#39;p&#39;,&#39;muted&#39;,&#39;Saved in unencrypted browser-local storage. Nothing is synced automatically. You can explicitly preview a saved note or task for Host approval.&#39;); |
| input | const | 21 | no | const input=make(&#39;textarea&#39;,&#39;notes-input&#39;); |
| controls | const | 25 | no | const controls=make(&#39;div&#39;,&#39;notes-actions&#39;); |
| save | const | 26 | no | const save=make(&#39;button&#39;,&#39;btn pri&#39;,&#39;Save on this device&#39;);save.type=&#39;button&#39;; |
| copy | const | 27 | no | const copy=make(&#39;button&#39;,&#39;btn sm&#39;,&#39;Copy draft&#39;);copy.type=&#39;button&#39;; |
| split | const | 28 | no | const split=make(&#39;button&#39;,&#39;btn sm&#39;,&#39;Review marked checklist items&#39;);split.type=&#39;button&#39;; |
| status | const | 30 | no | const status=make(&#39;p&#39;,&#39;muted&#39;);status.setAttribute(&#39;role&#39;,&#39;status&#39;); |
| count | const | 31 | no | const count=make(&#39;h3&#39;,&#39;&#39;,&#39;Saved on this browser&#39;); |
| items | const | 32 | no | const items=make(&#39;div&#39;,&#39;notes-list&#39;); |
| exportActions | const | 33 | no | const exportActions=make(&#39;div&#39;,&#39;notes-actions&#39;); |
| copyAll | const | 34 | no | const copyAll=make(&#39;button&#39;,&#39;btn sm&#39;,&#39;Copy all saved notes&#39;);copyAll.type=&#39;button&#39;; |
| download | const | 35 | no | const download=make(&#39;button&#39;,&#39;btn sm&#39;,&#39;Download JSON&#39;);download.type=&#39;button&#39;; |
| clear | const | 37 | no | const clear=make(&#39;button&#39;,&#39;btn sm&#39;,&#39;Delete all saved notes&#39;);clear.type=&#39;button&#39;; |
| taskReview | const | 38 | no | const taskReview=make(&#39;section&#39;,&#39;notes-list&#39;);taskReview.hidden=true; |
| previous | variable | 41 | no | let previous=null,confirmClear=false; |
| copyFn | const | 42 | no | const copyFn=copyText??(value=&gt;globalThis.navigator?.clipboard?.writeText(value)); |
| saveFn | const | 43 | no | const saveFn=saveFile??((filename,contents)=&gt;{ const content=new Blob([contents],{type:&#39;application/json&#39;}); const url=URL.createObjectURL(content); const anchor=doc.createElement(&#39;a&#39;); anchor.href=u… |
| content | const | 44 | no | const content=new Blob([contents],{type:&#39;application/json&#39;}); |
| url | const | 45 | no | const url=URL.createObjectURL(content); |
| anchor | const | 46 | no | const anchor=doc.createElement(&#39;a&#39;); |
| copyValue | function | 51 | no | async function copyValue(value){ |
| render | function | 57 | no | function render(){ |
| notes | variable | 59 | no | let notes=[]; |
| row | const | 64 | no | const row=make(&#39;section&#39;,&#39;notes-item&#39;); |
| text | const | 65 | no | const text=make(&#39;p&#39;,&#39;&#39;,note.text);text.style.whiteSpace=&#39;pre-wrap&#39;; |
| when | const | 66 | no | const when=make(&#39;small&#39;,&#39;muted&#39;,new Date(note.createdAt).toLocaleString()); |
| buttons | const | 67 | no | const buttons=make(&#39;div&#39;,&#39;notes-actions&#39;); |
| copyItem | const | 68 | no | const copyItem=make(&#39;button&#39;,&#39;btn sm&#39;,&#39;Copy&#39;);copyItem.type=&#39;button&#39;; |
| remove | const | 70 | no | const remove=make(&#39;button&#39;,&#39;btn sm&#39;,&#39;Delete&#39;);remove.type=&#39;button&#39;; |
| review | const | 77 | no | const review=make(&#39;button&#39;,&#39;btn sm&#39;,&#39;Review as Host &#39;+kind);review.type=&#39;button&#39;;review.addEventListener(&#39;click&#39;,()=&gt;{ if(!canCapture())return;let current;try{current=notebook.list().find(n=&gt;n.id===n… |
| clearTaskReview | function | 86 | no | function clearTaskReview(){taskReview.replaceChildren();taskReview.hidden=true;} |
| choices | const | 92 | no | const choices=rows.map(text=&gt;{const label=make(&#39;label&#39;,&#39;notes-item&#39;),check=make(&#39;input&#39;,&#39;&#39;);check.type=&#39;checkbox&#39;;check.checked=true; label.append(check,make(&#39;span&#39;,&#39;&#39;,text));taskReview.append(label)… |
| commit | const | 94 | no | const commit=make(&#39;button&#39;,&#39;btn pri&#39;,&#39;Save selected items locally&#39;);commit.type=&#39;button&#39;; |
| selected | const | 96 | no | const selected=choices.filter(x=&gt;x.check.checked).map(x=&gt;x.text);if(!selected.length)return; |
| draft | function | 101 | no | function draft(value){ |
| open | function | 105 | no | function open(){ |
| close | function | 112 | no | function close(){ |
| contents | const | 146 | no | const contents=notebook.exportAll(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./local-notes.mjs | import | 1 | [apps/mobile-relay/ux/local-notes.mjs](./local-notes.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/app.js](../app.js.md) | ./ux/local-notes-ui.mjs |
| [apps/mobile-relay/test/pwa-preflight-ui.test.mjs](../test/pwa-preflight-ui.test.mjs.md) | ../ux/local-notes-ui.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import {createLocalNotebook,MAX_NOTE_LENGTH,extractReviewedTasks} from './local-notes.mjs';

// Local-only notes drawer: the user explicitly saves each note and can export
// or delete it. No implicit replay or migration when phone pairing resumes.
export function mountLocalNotes({host,storage,copyText,saveFile,now,makeId,onCapture=null,canCapture=()=>false}={}){
  if(!host?.ownerDocument)throw new TypeError('LOCAL_NOTES_HOST_REQUIRED');
  const notebook=createLocalNotebook({storage,now,makeId});
  const doc=host.ownerDocument;
  const make=(tag,cls,text)=>{
    const n=doc.createElement(tag);if(cls)n.className=cls;
    if(text!==undefined)n.textContent=text;
    return n;
  };
  const dialog=make('dialog','pwa-notes');dialog.id='pwa-local-notes';
  dialog.setAttribute('aria-label','Quick capture on this device');
  const bar=make('header','notes-head');
  const title=make('h2','', 'Quick capture');
  const dismiss=make('button','btn sm','Close');dismiss.type='button';
  bar.append(title,dismiss);
  const notice=make('p','muted','Saved in unencrypted browser-local storage. Nothing is synced automatically. You can explicitly preview a saved note or task for Host approval.');
  const input=make('textarea','notes-input');
  input.rows=4;input.maxLength=MAX_NOTE_LENGTH;
  input.placeholder='A quick thought, idea or task…';
  input.setAttribute('aria-label','New local note');
  const controls=make('div','notes-actions');
  const save=make('button','btn pri','Save on this device');save.type='button';
  const copy=make('button','btn sm','Copy draft');copy.type='button';
  const split=make('button','btn sm','Review marked checklist items');split.type='button';
  controls.append(save,copy,split);
  const status=make('p','muted');status.setAttribute('role','status');
  const count=make('h3','','Saved on this browser');
  const items=make('div','notes-list');
  const exportActions=make('div','notes-actions');
  const copyAll=make('button','btn sm','Copy all saved notes');copyAll.type='button';
  const download=make('button','btn sm','Download JSON');download.type='button';
  exportActions.append(copyAll,download);
  const clear=make('button','btn sm','Delete all saved notes');clear.type='button';
  const taskReview=make('section','notes-list');taskReview.hidden=true;
  dialog.append(bar,notice,input,controls,status,taskReview,count,items,exportActions,clear);
  host.append(dialog);
  let previous=null,confirmClear=false;
  const copyFn=copyText??(value=>globalThis.navigator?.clipboard?.writeText(value));
  const saveFn=saveFile??((filename,contents)=>{
    const content=new Blob([contents],{type:'application/json'});
    const url=URL.createObjectURL(content);
    const anchor=doc.createElement('a');
    anchor.href=url;anchor.download=filename;
    host.append(anchor);anchor.click();anchor.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  });
  async function copyValue(value){
    try{
      if(typeof copyFn!=='function')throw new Error('Unavailable');
      await copyFn(value);status.textContent='Copied to clipboard. Nothing was sent.';
    }catch{status.textContent='Clipboard unavailable. Select and copy your note manually.'}
  }
  function render(){
    items.replaceChildren();
    let notes=[];
    try{notes=notebook.list()}catch{status.textContent='Saved notes could not be read. Existing storage was not overwritten; copying a new draft still works.'}
    count.textContent='Saved on this browser ('+notes.length+'/12)';
    if(!notes.length)items.append(make('p','ux-empty','No notes saved on this browser.'));
    for(const note of notes){
      const row=make('section','notes-item');
      const text=make('p','',note.text);text.style.whiteSpace='pre-wrap';
      const when=make('small','muted',new Date(note.createdAt).toLocaleString());
      const buttons=make('div','notes-actions');
      const copyItem=make('button','btn sm','Copy');copyItem.type='button';
      copyItem.addEventListener('click',()=>void copyValue(note.text));
      const remove=make('button','btn sm','Delete');remove.type='button';
      remove.addEventListener('click',()=>{
        try{notebook.remove(note.id);status.textContent='Note deleted from this browser.';render()}
        catch{status.textContent='Could not update browser storage.'}
      });
      buttons.append(copyItem,remove);
      if(typeof onCapture==='function'&&canCapture())for(const kind of ['note','task']){
        const review=make('button','btn sm','Review as Host '+kind);review.type='button';review.addEventListener('click',()=>{
          if(!canCapture())return;let current;try{current=notebook.list().find(n=>n.id===note.id);}catch{return;}
          if(!current||current.text!==note.text)return;
          if(onCapture({capture_id:current.id,kind,content:current.text})===true)close();
```

_First 80 of 159 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
