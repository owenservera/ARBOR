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
