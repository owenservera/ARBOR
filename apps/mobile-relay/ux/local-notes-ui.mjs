import {createLocalNotebook,MAX_NOTE_LENGTH} from './local-notes.mjs';

// Local-only notes drawer: the user explicitly saves each note and can export
// or delete it. No implicit replay or migration when phone pairing resumes.
export function mountLocalNotes({host,storage,copyText,saveFile,now,makeId}={}){
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
  const notice=make('p','muted','Saved only in this browser, as unencrypted local storage. Not synced, imported or sent to your PC or an AI.');
  const input=make('textarea','notes-input');
  input.rows=4;input.maxLength=MAX_NOTE_LENGTH;
  input.placeholder='A quick thought, idea or task…';
  input.setAttribute('aria-label','New local note');
  const controls=make('div','notes-actions');
  const save=make('button','btn pri','Save on this device');save.type='button';
  const copy=make('button','btn sm','Copy draft');copy.type='button';
  controls.append(save,copy);
  const status=make('p','muted');status.setAttribute('role','status');
  const count=make('h3','','Saved on this browser');
  const items=make('div','notes-list');
  const exportActions=make('div','notes-actions');
  const copyAll=make('button','btn sm','Copy all saved notes');copyAll.type='button';
  const download=make('button','btn sm','Download JSON');download.type='button';
  exportActions.append(copyAll,download);
  const clear=make('button','btn sm','Delete all saved notes');clear.type='button';
  dialog.append(bar,notice,input,controls,status,count,items,exportActions,clear);
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
    try{notes=notebook.list()}catch{status.textContent='Browser storage unavailable; copying still works.'}
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
      buttons.append(copyItem,remove);row.append(text,when,buttons);items.append(row);
    }
  }
  function open(){
    if(dialog.open)return;
    previous=doc.activeElement;status.textContent='';
    render();if(typeof dialog.showModal==='function')dialog.showModal();
    else dialog.setAttribute('open','');
    input.focus();
  }
  function close(){
    if(dialog.open&&typeof dialog.close==='function')dialog.close();
    else dialog.removeAttribute('open');
    if(previous?.isConnected&&typeof previous.focus==='function')previous.focus();
    previous=null;
  }
  dismiss.addEventListener('click',close);
  dialog.addEventListener('close',()=>{
    if(previous?.isConnected&&typeof previous.focus==='function')previous.focus();
    previous=null;
  });
  save.addEventListener('click',()=>{
    try{
      notebook.save(input.value);
      input.value='';
      confirmClear=false;
      clear.textContent='Delete all saved notes';
      status.textContent='Saved on this browser only. Nothing was sent.';
      render();
    }catch(error){
      status.textContent=error?.message==='LOCAL_NOTE_EMPTY_OR_TOO_LONG'
        ? 'Write 1–'+MAX_NOTE_LENGTH+' characters before saving.'
        :error?.message==='LOCAL_NOTES_FULL'
        ? '12 notes are saved here. Export or delete one before saving more.'
        :'Could not save this note in browser storage.';
    }
  });
  copy.addEventListener('click',()=>void copyValue(input.value));
  copyAll.addEventListener('click',()=>{
    try{void copyValue(notebook.exportAll());}
    catch{status.textContent='Could not read browser-local notes for copying.'}
  });
  download.addEventListener('click',()=>{
    try{
      const contents=notebook.exportAll();
      saveFn('vivim-quick-notes.json',contents);
      status.textContent='Export started in this browser. No Host or AI received your notes.';
    }catch{status.textContent='Could not export notes in this browser.'}
  });
  clear.addEventListener('click',()=>{
    if(!confirmClear){confirmClear=true;clear.textContent='Confirm: delete all saved notes';return}
    try{notebook.clear();confirmClear=false;clear.textContent='Delete all saved notes';
      status.textContent='All saved notes were deleted from this browser.';render();
    }catch{status.textContent='Could not clear browser storage.'}
  });
  return Object.freeze({open,close,list:()=>notebook.list()});
}
