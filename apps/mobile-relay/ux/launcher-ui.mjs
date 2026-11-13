import {searchCapabilities} from './launcher.mjs';

// Local navigation dialog. No dynamic HTML, web search, command invocation or
// external URLs; selections resolve again against *current* authorization.
export function mountCapabilityLauncher({host,context,onActivate}={}){
  if (!host?.ownerDocument || typeof context!=='function' || typeof onActivate!=='function')
    throw new TypeError('Capability launcher needs a host and local callbacks');
  const doc=host.ownerDocument, make=(tag,cls,content)=>{
    const node=doc.createElement(tag);
    if(cls)node.className=cls;
    if(content!==undefined)node.textContent=content;
    return node;
  };
  const dialog=make('dialog','pwa-launcher');
  dialog.id='pwa-launcher';
  dialog.setAttribute('aria-label','Find something in VIVIM');
  const head=make('header','launcher-head');
  const title=make('h2','', 'Find something in VIVIM');
  const close=make('button','btn sm','Close');close.type='button';
  head.append(title,close);
  const input=make('input','launcher-search');
  input.type='search';input.maxLength=100;
  input.placeholder='Search Talk, media, Build, controls…';
  input.setAttribute('aria-label','Find a VIVIM capability');
  input.setAttribute('autocomplete','off');
  const info=make('p','muted launcher-info','Only existing app features. Nothing will be sent or executed.');
  const list=make('div','launcher-results');
  list.setAttribute('role','group');list.setAttribute('aria-label','Matching capabilities');
  dialog.append(head,input,info,list);host.append(dialog);
  let previous=null;
  function available(){
    let snapshot;try{snapshot=context()}catch{snapshot={}}
    return searchCapabilities(input.value,snapshot);
  }
  function render(){
    list.replaceChildren();
    const hits=available();
    if(!hits.length){list.append(make('p','ux-empty','No matching feature. Try another phrase.'));return}
    for(const hit of hits){
      const row=make('button','launcher-row'+(hit.available?'':' unavailable'));
      row.type='button';row.disabled=!hit.available;row.dataset.id=hit.id;
      const label=make('strong','',hit.title);
      const description=make('span','',hit.detail);
      const state=make('small','',hit.reason);
      row.append(label,description,state);
      row.addEventListener('click',()=>{
        // A grant might have been revoked *while* this dialog was open.
        const current=searchCapabilities('',context()).find(x=>x.id===hit.id);
        if(!current?.available)return;
        closeDialog();
        onActivate(current);
      });
      list.append(row);
    }
  }
  function open(){
    if(dialog.open)return;
    previous=doc.activeElement;
    input.value='';render();
    if(typeof dialog.showModal==='function')dialog.showModal();
    else dialog.setAttribute('open','');
    input.focus();
  }
  function closeDialog(){
    if(typeof dialog.close==='function'&&dialog.open)dialog.close();
    else dialog.removeAttribute('open');
    if(previous?.isConnected && typeof previous.focus==='function')previous.focus();
    previous=null;
  }
  close.addEventListener('click',closeDialog);
  input.addEventListener('input',render);
  input.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();closeDialog();return}
    if(event.key==='ArrowDown'){event.preventDefault();
      list.querySelector('button:not([disabled])')?.focus();
    }
    if(event.key==='Enter'){
      const first=list.querySelector('button:not([disabled])');
      if(first){event.preventDefault();first.click();}
    }
  });
  list.addEventListener('keydown',event=>{
    if(!['ArrowDown','ArrowUp'].includes(event.key))return;
    const all=Array.from(list.querySelectorAll('button:not([disabled])'));
    const at=all.indexOf(doc.activeElement);
    if(at<0||!all.length)return;
    event.preventDefault();
    all[(at+(event.key==='ArrowDown'?1:-1)+all.length)%all.length].focus();
  });
  dialog.addEventListener('close',()=>{
    if(previous?.isConnected&&typeof previous.focus==='function')previous.focus();
    previous=null;
  });
  return Object.freeze({open,close:closeDialog,refresh:()=>{if(dialog.open)render()},
    isOpen:()=>dialog.open});
}
