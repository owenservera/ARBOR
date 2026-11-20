# File: apps/mobile-relay/ux/local-notes.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/ux/local-notes.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3894 B |
| Lines | 72 |
| Hash | 8fd36c43cf29 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NOTES_SCHEMA | const | 3 | yes | export const NOTES_SCHEMA=&#39;vivim.pwa-local-notes/1&#39;; |
| NOTES_KEY | const | 4 | yes | export const NOTES_KEY=&#39;vivim.pwa-local-notes.v1&#39;; |
| MAX_NOTE_LENGTH | const | 5 | yes | export const MAX_NOTE_LENGTH=1200; |
| MAX_NOTES | const | 6 | yes | export const MAX_NOTES=12; |
| safeText | function | 7 | no | function safeText(value){ |
| text | const | 9 | no | const text=value.replace(/[\\u0000-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]/g,&#39;&#39;).trim(); |
| extractReviewedTasks | function | 13 | yes | export function extractReviewedTasks(raw){ |
| source | const | 14 | no | const source=safeText(raw);if(!source)return []; |
| rows | const | 15 | no | const rows=[];for(const line of source.split(/\\r?\\n/)){ |
| value | const | 17 | no | const value=match&amp;&amp;safeText(match[1]);if(value&amp;&amp;!rows.includes(value))rows.push(value); |
| validId | function | 21 | no | const validId=s=&gt;typeof s===&#39;string&#39;&amp;&amp;/^[a-zA-Z0-9-]{8,80}$/.test(s); |
| read | function | 22 | no | function read(storage,key){ |
| raw | variable | 23 | no | let raw; |
| parsed | const | 27 | no | const parsed=JSON.parse(raw); |
| ids | const | 30 | no | const ids=new Set(); |
| createLocalNotebook | function | 40 | yes | export function createLocalNotebook({storage,key=NOTES_KEY,now=Date.now,makeId}={}){ |
| idFactory | const | 44 | no | const idFactory=makeId??(()=&gt;globalThis.crypto?.randomUUID?.()??&#39;n-&#39;+ Array.from(globalThis.crypto.getRandomValues(new Uint8Array(12)),b=&gt;b.toString(16).padStart(2,&#39;0&#39;)).join(&#39;&#39;)); |
| write | function | 46 | no | function write(notes){ |
| list | function | 50 | no | function list(){return read(storage,key)} |
| saveBatch | function | 51 | no | function saveBatch(raws){ |
| texts | const | 53 | no | const texts=raws.map(safeText);if(texts.some(x=&gt;!x))throw new Error(&#39;LOCAL_NOTE_EMPTY_OR_TOO_LONG&#39;); |
| previous | const | 54 | no | const previous=list();if(previous.length+texts.length&gt;MAX_NOTES)throw new Error(&#39;LOCAL_NOTES_FULL&#39;); |
| ids | const | 55 | no | const ids=new Set(previous.map(n=&gt;n.id));const createdAt=now(); |
| added | const | 57 | no | const added=texts.map(text=&gt;{const id=idFactory();if(!validId(id))throw new Error(&#39;LOCAL_NOTE_ID_INVALID&#39;);if(ids.has(id))throw new Error(&#39;LOCAL_NOTE_ID_COLLISION&#39;);ids.add(id);return {id,text,create… |
| save | function | 61 | no | function save(raw){return saveBatch([raw])[0];} |
| remove | function | 62 | no | function remove(id){ |
| before | const | 64 | no | const before=list(),after=before.filter(n=&gt;n.id!==id); |
| clear | function | 69 | no | function clear(){write([]);} |
| exportAll | function | 70 | no | function exportAll(){return JSON.stringify({schema:NOTES_SCHEMA,notes:list()},null,2);} |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/test/pwa-local-notes.test.mjs](../test/pwa-local-notes.test.mjs.md) | ../ux/local-notes.mjs |
| [apps/mobile-relay/test/pwa-preflight-ui.test.mjs](../test/pwa-preflight-ui.test.mjs.md) | ../ux/local-notes.mjs |
| [apps/mobile-relay/ux/local-notes-ui.mjs](./local-notes-ui.mjs.md) | ./local-notes.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Explicit browser-local quick notes. No Host, provider API, service worker
// storage, automatic sync or auto-send. This is not Android Pocket capture.
export const NOTES_SCHEMA='vivim.pwa-local-notes/1';
export const NOTES_KEY='vivim.pwa-local-notes.v1';
export const MAX_NOTE_LENGTH=1200;
export const MAX_NOTES=12;
function safeText(value){
  if(typeof value!=='string')return null;
  const text=value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'').trim();
  return text&&text.length<=MAX_NOTE_LENGTH?text:null;
}
// Only explicit TODO/checklist markers are candidates; ordinary speech is never inferred as a task.
export function extractReviewedTasks(raw){
  const source=safeText(raw);if(!source)return [];
  const rows=[];for(const line of source.split(/\r?\n/)){
    const match=/^\s*(?:[-*]\s*\[ \]\s*|(?:todo|task)\s*:\s*)(.+)$/i.exec(line);
    const value=match&&safeText(match[1]);if(value&&!rows.includes(value))rows.push(value);
  }
  return rows;
}
const validId=s=>typeof s==='string'&&/^[a-zA-Z0-9-]{8,80}$/.test(s);
function read(storage,key){
  let raw;
  try{raw=storage.getItem(key)}catch{throw new Error('LOCAL_NOTES_UNAVAILABLE')}
  if(raw==null)return [];
  try{
    const parsed=JSON.parse(raw);
    if(parsed?.schema!==NOTES_SCHEMA||!Array.isArray(parsed.notes)||
       parsed.notes.length>MAX_NOTES)throw new Error('LOCAL_NOTES_CORRUPT');
    const ids=new Set();
    return parsed.notes.map(n=>{
      if(!n||!validId(n.id)||ids.has(n.id)||safeText(n.text)!==n.text||
          !Number.isSafeInteger(n.createdAt)||n.createdAt<=0)
        throw new Error('LOCAL_NOTES_CORRUPT');
      ids.add(n.id);
      return {id:n.id,text:n.text,createdAt:n.createdAt};
    });
  }catch{throw new Error('LOCAL_NOTES_CORRUPT');}
}
export function createLocalNotebook({storage,key=NOTES_KEY,now=Date.now,makeId}={}){
  if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')
    throw new TypeError('LOCAL_NOTES_STORAGE_REQUIRED');
  if(typeof key!=='string'||key!==NOTES_KEY)throw new TypeError('LOCAL_NOTES_KEY_INVALID');
  const idFactory=makeId??(()=>globalThis.crypto?.randomUUID?.()??'n-'+
    Array.from(globalThis.crypto.getRandomValues(new Uint8Array(12)),b=>b.toString(16).padStart(2,'0')).join(''));
  function write(notes){
    try{storage.setItem(key,JSON.stringify({schema:NOTES_SCHEMA,notes}));}
    catch{throw new Error('LOCAL_NOTES_UNAVAILABLE')}
  }
  function list(){return read(storage,key)}
  function saveBatch(raws){
    if(!Array.isArray(raws)||!raws.length||raws.length>MAX_NOTES)throw new Error('LOCAL_NOTE_EMPTY_OR_TOO_LONG');
    const texts=raws.map(safeText);if(texts.some(x=>!x))throw new Error('LOCAL_NOTE_EMPTY_OR_TOO_LONG');
    const previous=list();if(previous.length+texts.length>MAX_NOTES)throw new Error('LOCAL_NOTES_FULL');
    const ids=new Set(previous.map(n=>n.id));const createdAt=now();
    if(!Number.isSafeInteger(createdAt)||createdAt<=0)throw new Error('LOCAL_NOTE_TIME_INVALID');
    const added=texts.map(text=>{const id=idFactory();if(!validId(id))throw new Error('LOCAL_NOTE_ID_INVALID');if(ids.has(id))throw new Error('LOCAL_NOTE_ID_COLLISION');ids.add(id);return {id,text,createdAt};});
    // One storage write after all validation; no partial batch or eviction.
    write([...added,...previous]);return added.map(({id,createdAt})=>({id,createdAt}));
  }
  function save(raw){return saveBatch([raw])[0];}
  function remove(id){
    if(!validId(id))return false;
    const before=list(),after=before.filter(n=>n.id!==id);
    if(after.length===before.length)return false;
    write(after);
    return true;
  }
  function clear(){write([]);}
  function exportAll(){return JSON.stringify({schema:NOTES_SCHEMA,notes:list()},null,2);}
  return Object.freeze({list,save,saveBatch,remove,clear,exportAll});
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
