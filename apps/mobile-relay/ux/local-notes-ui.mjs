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
        });buttons.append(review);
      }
      row.append(text,when,buttons);items.append(row);
    }
  }
  function clearTaskReview(){taskReview.replaceChildren();taskReview.hidden=true;}
  input.addEventListener('input',clearTaskReview);
  split.addEventListener('click',()=>{
    clearTaskReview();const original=input.value,rows=extractReviewedTasks(original);
    if(!rows.length){status.textContent='Mark tasks with TODO: or - [ ] on separate lines. No task was inferred.';return;}
    if(rows.length>12){status.textContent='Review at most 12 checklist items at once.';return;}
    const choices=rows.map(text=>{const label=make('label','notes-item'),check=make('input','');check.type='checkbox';check.checked=true;
      label.append(check,make('span','',text));taskReview.append(label);return {check,text};});
    const commit=make('button','btn pri','Save selected items locally');commit.type='button';
    commit.addEventListener('click',()=>{if(input.value!==original){clearTaskReview();return;}
      const selected=choices.filter(x=>x.check.checked).map(x=>x.text);if(!selected.length)return;
      try{notebook.saveBatch(selected);clearTaskReview();render();status.textContent='Saved '+selected.length+' separate local notes. Review each as a Host task when ready. Original draft retained.';}
      catch{status.textContent='Cannot save the entire selection. Free space or reduce selection; nothing was overwritten.';}});
    taskReview.append(make('p','muted','Only marked lines. Select what to save; Host approval remains separate.'),commit);taskReview.hidden=false;
  });
  function draft(value){
    if(typeof value!=='string'||value.trim().length<1||value.length>MAX_NOTE_LENGTH)return false;
    open();clearTaskReview();input.value=value;input.focus();return true;
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
      input.value='';clearTaskReview();
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
  // Browser-local drafts have no Host journal. A shell upgrade must not silently
  // discard text left in Quick capture, even if the drawer was closed.
  return Object.freeze({open,close,draft,list:()=>notebook.list(),
    hasPendingLocalWork:()=>dialog.open||input.value.trim().length>0});
}
