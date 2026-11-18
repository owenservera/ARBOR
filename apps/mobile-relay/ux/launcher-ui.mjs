import {searchCapabilities} from './launcher.mjs';
import {listUiComponents,UI_TAXONOMY_COUNTS} from '../vec/ui-taxonomy/registry.mjs';
import {THEME_BINDINGS} from '../build-composer.mjs';
import {COMPONENT_PRESENTATION_BINDINGS} from '../generative-ui/catalog.mjs';
// The same reviewed engine registry used by Build. Missing relay assets are explicit unavailable.
const engineRegistry=()=>import(typeof process!=='undefined'&&process.versions?.node
  ? '../../../packages/vec-ui-engines/src/registry.mjs' : '../vec-engines/registry.mjs');

// Local navigation dialog. No dynamic HTML, web search, command invocation or
// external URLs; selections resolve again against *current* authorization.
export function mountCapabilityLauncher({host,context,onActivate,onInspect=()=>false,onDraft=()=>false}={}){
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
  const modes=make('div','launcher-modes');
  const buttons=['Features','VIEW ALL','Engines'].map(label=>{
    const button=make('button','btn sm',label);button.type='button';modes.append(button);return button;
  });
  dialog.append(head,modes,input,info,list);host.append(dialog);
  let previous=null,mode=0,generation=0,engines=null;
  for(const [i,button] of buttons.entries())button.addEventListener('click',()=>{
    mode=i;input.value='';render();input.focus();
  });
  function liveRows(snapshot,query){
    const q=query.toLowerCase();
    return (Array.isArray(snapshot.liveInstances)?snapshot.liveInstances:[]).filter(row=>
      !q||[row.instanceId,row.type,row.componentId].some(v=>typeof v==='string'&&v.toLowerCase().includes(q)));
  }
  function libraryRow(title,detail,state){
    const row=make('div','launcher-row');row.append(make('strong','',title),make('span','',detail),make('small','',state));return row;
  }
  function available(){
    let snapshot;try{snapshot=context()}catch{snapshot={}}
    return searchCapabilities(input.value,snapshot);
  }
  function render(){
    const epoch=++generation;
    list.replaceChildren();
    buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===mode)));
    input.placeholder=mode===0?'Search Talk, media, Build, controls…':mode===1?'Search live instances or component definitions…':'Search engine capabilities…';
    if(mode!==0){
      let snapshot;try{snapshot=context()}catch{snapshot={}}
      const query=input.value.trim().slice(0,100);
      if(mode===1){
        info.textContent='Inspect live instances and canonical definitions. Shell identity does not grant edit authority.';
        const live=liveRows(snapshot,query),definitions=listUiComponents({search:query});
        list.append(make('h3','',live.length+' live matching PWA instances'));
        for(const row of live){
          const button=make('button','launcher-row');button.type='button';
          button.append(make('strong','',row.instanceId+' · '+row.type),make('span','',row.componentId+(row.scope==='shell'?' · protected shell':' · revision '+row.revision)),
            make('small','',Object.entries(row.settings??{}).map(([k,v])=>k+': '+v).join(' · ')||'Select for inspection'));
          button.addEventListener('click',()=>{
            const current=liveRows(context(),'').find(x=>x.instanceId===row.instanceId&&x.surfaceId===row.surfaceId&&x.revision===row.revision);
            if(!current||!onInspect(current))return;closeDialog();
          });list.append(button);
          if(snapshot.visualDraftAllowed&&row.scope!=='shell'&&row.configurableProperties?.length){
            const details=make('details','launcher-row');details.append(make('summary','', 'Configure '+row.instanceId));
            const property=make('select','launcher-search');property.setAttribute('aria-label','Component property');
            for(const key of row.configurableProperties){const option=make('option','',key);option.value=key;property.append(option);}
            const value=make('input','launcher-search');value.setAttribute('aria-label','Component value');
            function configureValue(){const b=COMPONENT_PRESENTATION_BINDINGS[property.value];if(!b)return;
              value.type=b.type==='color'?'color':'number';value.value=String(row.settings?.[b.field]??(b.type==='color'?'#243146':b.min));
              if(b.type==='length'){value.min=String(b.min);value.max=String(b.max);value.step='1';}else{value.removeAttribute('min');value.removeAttribute('max');value.removeAttribute('step');}}
            property.addEventListener('change',configureValue);configureValue();
            const isCurrent=()=>{const live=context();return live.visualDraftAllowed&&liveRows(live,'').some(x=>x.instanceId===row.instanceId&&x.surfaceId===row.surfaceId&&x.revision===row.revision);};
            const draft=make('button','btn sm','Draft component change');draft.type='button';draft.addEventListener('click',()=>{
              if(!isCurrent()||!value.checkValidity())return;const b=COMPONENT_PRESENTATION_BINDINGS[property.value];if(!b)return;
              if(onDraft('set component '+row.instanceId+' at revision '+row.revision+' '+property.value+' to '+value.value+(b.type==='length'?'px':'')))closeDialog();});
            details.append(property,value,draft);
            if(row.configurableProperties.some(key=>Object.hasOwn(row.settings??{},COMPONENT_PRESENTATION_BINDINGS[key].field))){const reset=make('button','btn sm','Draft appearance reset');reset.type='button';reset.addEventListener('click',()=>{if(isCurrent()&&onDraft('reset component '+row.instanceId+' at revision '+row.revision+' appearance'))closeDialog();});details.append(reset);}
            list.append(details);
          }
        }
        list.append(make('h3','',definitions.length+' matching / '+UI_TAXONOMY_COUNTS.components+' declared types'));
        for(const row of definitions.slice(0,100)){
          const states=[...new Set(row.implementations.map(x=>x.status))].filter(Boolean);
          list.append(libraryRow(row.label,row.id,states.join(' · ')||'Declared only'));
        }
        if(definitions.length>100)list.append(make('p','muted','Showing first 100; narrow search to inspect others.'));
        return;
      }
      info.textContent='Canonical engine descriptions. Availability does not grant authority.';
      if(!engines){
        list.append(make('p','muted','Reading engine registry…'));
        void engineRegistry().then(registry=>{
          if(epoch!==generation)return;
          engines=registry;render();
        }).catch(()=>{if(epoch===generation)list.replaceChildren(make('p','muted','Engine registry unavailable on this connection.'));});
        return;
      }
      const capabilities=engines.listEngineCapabilities({search:query});
      list.append(make('h3','',capabilities.length+' matching / '+engines.ENGINE_COUNTS.capabilities+' declared capabilities'));
      for(const cap of capabilities.slice(0,100)){
        const mapped=Object.entries(THEME_BINDINGS).find(([,b])=>b.capabilityId===cap.id);
        const row=libraryRow(cap.name,cap.id+' · '+cap.valueSchema.type,mapped?'Reviewed Build and shell preview mapping; effect authority separate':'Described; installation not established');
        if(mapped&&snapshot.visualDraftAllowed){
          const [property,binding]=mapped;
          const value=make('input','launcher-search');value.type=binding.type==='color'?'color':'number';
          const existing=snapshot.visualTheme?.[binding.field];
          value.value=String(existing??(binding.type==='color'?'#111722':binding.min));
          if(binding.type!=='color'){value.min=String(binding.min);value.max=String(binding.max);value.step=binding.type==='length'?'1':'0.01';}
          value.setAttribute('aria-label',property);
          row.append(value);
          for(const [label,scope] of [['Draft Build change','app'],['Draft shell change','shell']]){
            const draft=make('button','btn sm',label);draft.type='button';
            draft.addEventListener('click',()=>{
              if(!context().visualDraftAllowed||!value.checkValidity())return;
              const raw=binding.type==='length'?value.value+'px':value.value;
              if(onDraft('set my '+scope+' '+property+' to '+raw))closeDialog();
            });row.append(draft);
          }
        }
        list.append(row);
      }
      if(capabilities.length>100)list.append(make('p','muted','Showing first 100; narrow search to inspect others.'));
      return;
    }
    info.textContent='Only existing app features. Nothing will be sent or executed.';
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
  function open({mode:initialMode=0,query=''}={}){
    if(dialog.open)return;
    previous=doc.activeElement;
    mode=[0,1,2].includes(initialMode)?initialMode:0;input.value=typeof query==='string'?query.slice(0,100):'';render();
    if(typeof dialog.showModal==='function')dialog.showModal();
    else dialog.setAttribute('open','');
    input.focus();
  }
  function closeDialog(){
    generation++;list.replaceChildren();
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
    if(event.key==='Enter'&&mode===0){
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
    generation++;list.replaceChildren();
    if(previous?.isConnected&&typeof previous.focus==='function')previous.focus();
    previous=null;
  });
  return Object.freeze({open,close:closeDialog,refresh:()=>{if(dialog.open)render()},
    isOpen:()=>dialog.open});
}
