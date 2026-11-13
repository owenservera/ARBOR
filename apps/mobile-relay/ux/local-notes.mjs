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
  function save(raw){
    const text=safeText(raw);
    if(!text)throw new Error('LOCAL_NOTE_EMPTY_OR_TOO_LONG');
    const id=idFactory();
    if(!validId(id))throw new Error('LOCAL_NOTE_ID_INVALID');
    const previous=list();
    if(previous.length>=MAX_NOTES)throw new Error('LOCAL_NOTES_FULL');
    if(previous.some(n=>n.id===id))throw new Error('LOCAL_NOTE_ID_COLLISION');
    const note={id,text,createdAt:now()};
    write([note,...previous]);
    return {id:note.id,createdAt:note.createdAt};
  }
  function remove(id){
    if(!validId(id))return false;
    const before=list(),after=before.filter(n=>n.id!==id);
    if(after.length===before.length)return false;
    write(after);
    return true;
  }
  function clear(){write([]);}
  function exportAll(){return JSON.stringify({schema:NOTES_SCHEMA,notes:list()},null,2);}
  return Object.freeze({list,save,remove,clear,exportAll});
}
