// Shared draft assistance for Talk, Build and desktop Chat/Wiki.
// All suggestions are inert text. Only the existing submit path can plan,
// send or approve an effect. No draft persistence or provider calls here.
import { resolveLocalDestination, resolveProductRoute } from './control-language.mjs';

export const COMPOSER_SCHEMA='vivim.composer-assist/1';
const LIMIT=6;
const NAVIGATION=['open Today','open Talk','open Build','open World','open Wiki','open Me','open Control','open Pocket'];
const compact=text=>String(text??'').trim().slice(0,180);
const safeName=s=>typeof s==='string'&&/^[a-z][a-z0-9_-]{0,62}$/i.test(s);
const ready=action=>['source_wired','verified'].includes(action?.readiness);

// Completion generation is not another interpreter: candidates come from
// catalog examples and the known Wiki action grammar, and complete commands
// are checked by the incumbent compiler. Never replace text the user typed.
export function composeDraftHints(text,{meaning,catalog,wiki,interpret}={}){
  if(typeof text!=='string'||text.length>1000||!text.trim()||meaning?.outcome==='refused')return [];
  const actions=new Map((catalog?.actions||[]).filter(ready).map(a=>[a.actionId,a]));
  const out=[],seen=new Set();
  const lower=text.toLowerCase();
  function add(draft,actionId,source,partial=false){
    if(out.length>=LIMIT||typeof draft!=='string'||draft.length>1000||
      draft.length<=text.length||!draft.toLowerCase().startsWith(lower)||
      /[\x00-\x1f\x7f]/.test(draft)||seen.has(draft.toLowerCase()))return;
    if(actionId&&!actions.has(actionId))return;
    const value=text+draft.slice(text.length);
    if(!partial&&actionId&&typeof interpret==='function'){
      const parsed=interpret(value);
      if(parsed?.outcome!=='candidate'||parsed.candidate?.actionId!==actionId)return;
    }
    seen.add(draft.toLowerCase());
    out.push({text:value,actionId,source,partial});
  }
  for(const draft of NAVIGATION)if(resolveLocalDestination(draft))add(draft,null,'navigation');
  if(wiki?.pages&&Number.isSafeInteger(wiki.revision)){
    const pages=Object.keys(wiki.pages).filter(safeName).slice(0,64);
    // These are actual authorized targets, not catalog demonstration names.
    for(const page of pages){
      for(const section of Object.keys(wiki.pages[page]?.sections||{}).filter(safeName).slice(0,24)){
        add('read wiki page '+page+' in section '+section,'wiki.section.read','wiki');
        add('edit wiki section '+page+'/'+section+' saying ','wiki.section.edit','wiki',true);
      }
      for(const position of ['top','bottom','up','down'])
        add('move wiki page '+page+' to '+position,'wiki.page.move','wiki');
      for(const other of pages){
        if(out.length>=LIMIT)break;
        if(page!==other&&!wiki.pages[page].links?.includes(other))
          add('link wiki pages from '+page+' to '+other,'wiki.pages.link','wiki');
      }
      if(out.length>=LIMIT)break;
    }
  }
  for(const a of actions.values()){
    // Do not suggest fictional page names, arbitrary mutation content, device
    // identifiers or preference values from demonstration examples.
    if(a.risk!=='R0'||a.requiredArgs?.length||Object.keys(a.args||{}).length)continue;
    if(a.actionId.startsWith('wiki.')&&a.actionId!=='wiki.pages.list')continue;
    for(const example of a.examples||[])add(example,a.actionId,'catalog');
  }
  return out;
}

export function needsWikiDraftContext(text,meaning){
  if(typeof text!=='string'||!text.trim()||meaning?.outcome==='refused')return false;
  // Host responses are advisory. A malformed candidate/choice must never
  // throw during typing or turn an untrusted value into a Wiki read trigger.
  const actionId=meaning?.candidate?.actionId;
  if((typeof actionId==='string'&&actionId.startsWith('wiki.'))||
     (Array.isArray(meaning?.choices)&&meaning.choices.some(
       id=>typeof id==='string'&&id.startsWith('wiki.'))))return true;
  // Prefix matching only gates the cost of a read, never determines meaning.
  const value=text.toLowerCase();
  return value.length>=5&&[
    'read wiki page ','edit wiki section ','move wiki page ','link wiki pages from '
  ].some(prefix=>prefix.startsWith(value)||value.startsWith(prefix));
}

// Project the incumbent typed reading; no second grammar or action authority.
export function semanticDraftSlots(text,meaning,action){
  if(typeof text!=='string'||!action||!ready(action)||action.actionId!==meaning?.candidate?.actionId||
    !['candidate','incomplete'].includes(meaning.outcome))return [];
  const args=meaning.candidate.args??{},missing=new Set((meaning.missing??[]).map(x=>x.arg));
  return Object.entries(action.args??{}).slice(0,32).map(([key,schema])=>{
    const value=Object.hasOwn(args,key)&&typeof args[key]==='string'?args[key]:null;
    let span=null;
    // Only edit a uniquely occurring literal; validate the entire proposed reading again before insertion.
    if(value&&value.length<=1000){
      const start=text.indexOf(value);
      if(start>=0&&text.indexOf(value,start+1)<0)span={start,end:start+value.length};
    }
    return {key,type:schema.type,state:value!==null?'interpreted':missing.has(key)?'missing':'unresolved',
      value,span,...(schema.type==='enum'&&Array.isArray(schema.values)?{choices:schema.values.slice(0,32)}:{})};
  });
}
export function correctedSlotDraft(text,slot,value){
  if(typeof value!=='string'||!value.trim()||value!==value.trim()||value.length>1000||
    /[\x00-\x1f\x7f]/.test(value)||!slot?.span||slot.state!=='interpreted')return null;
  const {start,end}=slot.span;
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||end>text.length||
    text.slice(start,end)!==slot.value||(slot.choices&&!slot.choices.includes(value)))return null;
  const next=text.slice(0,start)+value+text.slice(end);
  return next.length<=1000?next:null;
}
export function matchesSlotCorrection(before,after,key,value){
  if(before?.outcome!=='candidate'||after?.outcome!=='candidate'||
    before.candidate?.actionId!==after.candidate?.actionId)return false;
  const a=before.candidate.args,b=after.candidate.args;
  return !!(a&&b&&Object.hasOwn(a,key)&&Object.keys(a).length===Object.keys(b).length&&
    Object.keys(a).every(k=>Object.hasOwn(b,k)&&b[k]===(k===key?value:a[k]))&&
    before.composer?.catalogVersion===after.composer?.catalogVersion&&
    before.composer?.wikiRevision===after.composer?.wikiRevision&&
    before.feedback?.worldV===after.feedback?.worldV);
}

export function composerResponse(text,meaning,{catalog,wiki,interpret,source}={}){
  const actions=(catalog?.actions||[]).filter(a=>!source||!Array.isArray(a.surfaces)||a.surfaces.includes(source));
  const selected=actions.find(a=>a.actionId===meaning?.candidate?.actionId);
  return {...meaning,composer:{schema:COMPOSER_SCHEMA,authority:'none',
    ...(selected?{action:{id:selected.actionId,risk:selected.risk,readiness:selected.readiness}}:{}),
    catalogVersion:catalog?.version??null,
    slots:semanticDraftSlots(text,meaning,selected),
    wikiRevision:Number.isSafeInteger(wiki?.revision)?wiki.revision:null,
    suggestions:composeDraftHints(text,{meaning,catalog:{actions},wiki,interpret})}};
}

export function describeDraft(text,meaning,{compileUi,hostRequired=true}={}){
  if(!text.trim())return null;
  const route=resolveProductRoute(text,{hostMeaning:meaning,compileUi,hostRequired});
  if(route.kind==='navigate')return {kind:'navigate',label:'Navigation · '+route.tab,detail:'Opens a screen only when submitted.'};
  if(route.kind==='host'){
    const m=route.meaning;
    if(m.outcome==='candidate'){
      const action=m.composer?.authority==='none'&&m.composer.action?.id===m.candidate?.actionId?m.composer.action:null;
      if(action&&!ready(action))return {kind:'unavailable',label:'Recognized · '+compact(m.candidate?.actionId),
        detail:'This action is not source-wired for the current catalog. Nothing was executed.'};
      return {kind:'candidate',label:'Typed · '+compact(m.candidate?.actionId)+(action?' · '+compact(action.risk):''),
        detail:'Interpretation only. Submit for a fresh Host plan; changes require approval.'};
    }
    return {kind:'clarify',label:'More information needed',detail:compact(m.question)||'Complete the request before submitting.'};
  }
  if(route.kind==='ui'){
    const detail=route.reading.detail;
    return {kind:'ui',label:route.reading.outcome==='candidate'?'Visual edit recognized':'Visual target needs clarification',
      detail:detail?.capabilityId?'Typed '+detail.property+' · '+detail.value+' · '+detail.capabilityId+' · revision '+detail.baseRevision+'. Preview before Activate.':
        'Review the exact proposed UI before Activate.'};
  }
  if(route.kind==='refused')return {kind:'refused',label:'Not a safe command',detail:compact(route.meaning?.refusal?.message||route.reading?.code)};
  if(route.kind==='provider')return {kind:'provider',label:'No deterministic match',detail:'Choose an AI explicitly after submitting; nothing is sent while typing.'};
  return {kind:'unavailable',label:'Host interpretation unavailable',detail:'Draft preserved. No action was executed.'};
}

export function draftSuggestions(text,meaning){
  const envelope=meaning?.composer;
  if(envelope?.schema!==COMPOSER_SCHEMA||envelope.authority!=='none'||!Array.isArray(envelope.suggestions))return [];
  const seen=new Set();
  return envelope.suggestions.filter(s=>{
    if(!s||typeof s.text!=='string'||s.text.length>1000||s.text.length<=text.length||
       !s.text.startsWith(text)||/[\x00-\x1f\x7f]/.test(s.text)||
       !['navigation','wiki','catalog'].includes(s.source)||seen.has(s.text))return false;
    seen.add(s.text);return true;
  }).slice(0,LIMIT);
}

// Latest-input-wins, one read in flight. Session/target changes clear private
// text immediately. Tab selects, second Tab fills; Enter retains normal send.
export function mountComposerAssist({field,host,interpret,getScope,onDraft=()=>{},compileUi,getUiDraftCandidates=()=>[],delay=300,hostRequired=true}={}){
  if(!field||!host||typeof interpret!=='function'||typeof getScope!=='function')
    throw TypeError('Composer assistance requires an input and read-only interpreter');
  const doc=field.ownerDocument;
  let generation=0,timer=null,expiry=null,inFlight=false,queued=null,shown=null,selected=-1,disposed=false;
  host.hidden=true;
  host.setAttribute('role','region');host.setAttribute('aria-label','Draft interpretation and completions');
  const node=(tag,text)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;return n};
  function hide(){clearTimeout(expiry);expiry=null;shown=null;selected=-1;host.replaceChildren();host.hidden=true;}
  function reset(){generation++;clearTimeout(timer);timer=null;queued=null;hide();}
  function current(job){return !disposed&&job.generation===generation&&field.value===job.text&&getScope()===job.scope&&!!job.scope;}
  function validShown(){return shown&&current(shown.job)&&!field.disabled&&Date.now()-shown.at<15000;}
  function apply(index){
    if(!validShown())return reset();
    const item=shown.suggestions[index];
    if(!item)return;
    reset();field.value=item.text;field.focus();onDraft(item.text);schedule();
  }
  async function correct(slot,value){
    if(!validShown()||inFlight)return;
    const previous=shown,job=previous.job,next=correctedSlotDraft(job.text,slot,value);
    if(!next||next===job.text)return;
    inFlight=true;
    try{
      const checked=await interpret(next);
      if(!current(job)||!validShown()||shown!==previous)return;
      if(checked?.schema!=='vivim.control-language/1'||checked.input!==next||
        !matchesSlotCorrection(previous.meaning,checked,slot.key,value)){
        const note=node('p','Correction could not be verified. Edit the draft text directly.');note.setAttribute('role','status');host.append(note);return;
      }
      reset();field.value=next;field.focus();onDraft(next);schedule();
    }catch{if(current(job)&&shown===previous){const note=node('p','Correction unavailable. Original draft preserved.');note.setAttribute('role','status');host.append(note);}}
    finally{inFlight=false;if(queued)void pump();}
  }
  function render(){
    if(!validShown())return hide();
    const {description,suggestions}=shown;
    host.dataset.kind=description.kind||'unavailable';
    const status=node('p',description.label+' — '+description.detail);
    status.setAttribute('role','status');host.replaceChildren(status);
    const envelope=shown.meaning?.composer;
    if(envelope?.schema===COMPOSER_SCHEMA&&envelope.authority==='none'&&Array.isArray(envelope.slots)&&envelope.slots.length){
      const slots=node('div');slots.className='semantic-draft-slots';
      for(const slot of envelope.slots.slice(0,32)){
        if(typeof slot?.key!=='string'||!['interpreted','missing','unresolved'].includes(slot.state))continue;
        const row=node('div');row.dataset.state=slot.state;
        const title=node('span',slot.key+' · '+slot.state+(typeof slot.value==='string'?' · '+slot.value:''));
        row.append(title);
        if(slot.state==='interpreted'&&slot.span&&shown.meaning.outcome==='candidate'){
          const edit=node('input');edit.type='text';edit.value=slot.value;edit.maxLength=1000;
          edit.setAttribute('aria-label','Correct '+slot.key);const use=node('button','Check correction');use.type='button';
          use.addEventListener('click',()=>void correct(slot,edit.value));row.append(edit,use);
        }else if(Array.isArray(slot.choices))row.append(node('small','Allowed: '+slot.choices.join(', ')));
        slots.append(row);
      }
      host.append(slots);
    }
    if(suggestions.length){
      const list=node('div');
      for(const [i,s] of suggestions.entries()){
        const button=node('button',s.text);button.type='button';button.className='chip';
        button.setAttribute('aria-pressed',String(selected===i));
        button.title=s.source==='wiki'?'Current Wiki target · draft only':'Insert draft only';
        button.addEventListener('click',()=>apply(i));list.append(button);
      }
      const hint=node('small',selected<0?'Tab to select · Tab again to insert · Esc to dismiss':'Tab to insert · ↑/↓ to choose · Esc to dismiss');
      host.append(list,hint);
    }
    host.hidden=false;
  }
  async function pump(){
    if(inFlight||!queued||disposed)return;
    const job=queued;queued=null;
    if(!current(job))return;
    inFlight=true;
    try{
      // A fully recognized local navigation needs no network. Every other
      // interpretation is advisory and uses the existing read-only endpoint.
      const destination=resolveLocalDestination(job.text);
      const meaning=destination?null:await interpret(job.text);
      if(!current(job))return;
      if(!destination&&(meaning?.schema!=='vivim.control-language/1'||meaning.input!==job.text))throw Error('Invalid interpretation response');
      const desc=describeDraft(job.text,meaning,{compileUi,hostRequired});
      if(!desc)return;
      const suggestions=draftSuggestions(job.text,meaning);
      // Use current installed Build mappings only when local/Host route permits.
      if(desc.kind==='ui'||desc.kind==='provider'){
        let candidates=[];try{candidates=getUiDraftCandidates()}catch{}
        for(const text of candidates){
          if(suggestions.length>=LIMIT)break;
          if(typeof text!=='string'||!text.startsWith(job.text)||text.length<=job.text.length||suggestions.some(s=>s.text===text))continue;
          const candidate=compileUi?.(text);
          if(candidate?.outcome==='candidate')suggestions.push({text,source:'visual'});
        }
      }
      shown={job,meaning,description:desc,suggestions,at:Date.now()};
      selected=-1;render();
      expiry=setTimeout(()=>{if(shown?.job===job)hide();},15000);
    }catch{
      if(current(job)){
        shown={job,description:{label:'Host assistance unavailable',detail:'Draft preserved; no action was executed.'},suggestions:[],at:Date.now()};
        selected=-1;render();
        expiry=setTimeout(()=>{if(shown?.job===job)hide();},15000);
      }
    }finally{inFlight=false;if(queued)void pump();}
  }
  function schedule(){
    reset();
    const text=field.value,scope=getScope();
    if(disposed||!scope||field.disabled||typeof text!=='string'||!text.trim()||text.length>1000)return;
    const job={text,scope,generation};
    timer=setTimeout(()=>{timer=null;if(current(job)){queued=job;void pump();}},delay);
  }
  function keydown(event){
    if(event.isComposing)return;
    if(event.key==='Escape'&&shown){event.preventDefault();reset();return;}
    if(!validShown()||!shown.suggestions.length)return;
    if(event.key==='Tab'&&!event.shiftKey&&!event.ctrlKey&&!event.altKey&&!event.metaKey){
      event.preventDefault();
      if(selected<0){selected=0;render();}else apply(selected);
    }else if(selected>=0&&['ArrowDown','ArrowUp'].includes(event.key)){
      event.preventDefault();selected=(selected+(event.key==='ArrowDown'?1:-1)+shown.suggestions.length)%shown.suggestions.length;render();
    }
  }
  let composing=false;
  const onInput=()=>{if(!composing)schedule();else reset()};
  const compositionStart=()=>{composing=true;reset()};
  const compositionEnd=()=>{composing=false;schedule()};
  field.addEventListener('input',onInput);
  field.addEventListener('focus',schedule);
  field.addEventListener('keydown',keydown);
  field.addEventListener('compositionstart',compositionStart);
  field.addEventListener('compositionend',compositionEnd);
  return {reset,refresh:schedule,dispose(){
    disposed=true;reset();
    field.removeEventListener('input',onInput);field.removeEventListener('focus',schedule);
    field.removeEventListener('keydown',keydown);
    field.removeEventListener('compositionstart',compositionStart);
    field.removeEventListener('compositionend',compositionEnd);
  }};
}
