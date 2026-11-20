# File: apps/mobile-relay/composer-assist.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/composer-assist.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 17927 B |
| Lines | 302 |
| Hash | 719302421e93 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| COMPOSER_SCHEMA | const | 6 | yes | export const COMPOSER_SCHEMA=&#39;vivim.composer-assist/1&#39;; |
| LIMIT | const | 7 | no | const LIMIT=6; |
| NAVIGATION | const | 8 | no | const NAVIGATION=[&#39;open Today&#39;,&#39;open Talk&#39;,&#39;open Build&#39;,&#39;open World&#39;,&#39;open Wiki&#39;,&#39;open Me&#39;,&#39;open Control&#39;,&#39;open Pocket&#39;]; |
| compact | function | 9 | no | const compact=text=&gt;String(text??&#39;&#39;).trim().slice(0,180); |
| safeName | function | 10 | no | const safeName=s=&gt;typeof s===&#39;string&#39;&amp;&amp;/^[a-z][a-z0-9_-]{0,62}$/i.test(s); |
| ready | function | 11 | no | const ready=action=&gt;[&#39;source_wired&#39;,&#39;verified&#39;].includes(action?.readiness); |
| composeDraftHints | function | 16 | yes | export function composeDraftHints(text,{meaning,catalog,wiki,interpret}={}){ |
| actions | const | 18 | no | const actions=new Map((catalog?.actions\|\|[]).filter(ready).map(a=&gt;[a.actionId,a])); |
| out | const | 19 | no | const out=[],seen=new Set(); |
| lower | const | 20 | no | const lower=text.toLowerCase(); |
| add | function | 21 | no | function add(draft,actionId,source,partial=false){ |
| value | const | 26 | no | const value=text+draft.slice(text.length); |
| parsed | const | 28 | no | const parsed=interpret(value); |
| pages | const | 36 | no | const pages=Object.keys(wiki.pages).filter(safeName).slice(0,64); |
| needsWikiDraftContext | function | 63 | yes | export function needsWikiDraftContext(text,meaning){ |
| value | const | 68 | no | const value=text.toLowerCase(); |
| semanticDraftSlots | function | 75 | yes | export function semanticDraftSlots(text,meaning,action){ |
| args | const | 78 | no | const args=meaning.candidate.args??{},missing=new Set((meaning.missing??[]).map(x=&gt;x.arg)); |
| value | const | 80 | no | const value=Object.hasOwn(args,key)&amp;&amp;typeof args[key]===&#39;string&#39;?args[key]:null; |
| span | variable | 81 | no | let span=null; |
| start | const | 84 | no | const start=text.indexOf(value); |
| correctedSlotDraft | function | 91 | yes | export function correctedSlotDraft(text,slot,value){ |
| next | const | 97 | no | const next=text.slice(0,start)+value+text.slice(end); |
| matchesSlotCorrection | function | 100 | yes | export function matchesSlotCorrection(before,after,key,value){ |
| a | const | 103 | no | const a=before.candidate.args,b=after.candidate.args; |
| composerResponse | function | 111 | yes | export function composerResponse(text,meaning,{catalog,wiki,interpret,source}={}){ |
| actions | const | 112 | no | const actions=(catalog?.actions\|\|[]).filter(a=&gt;!source\|\|!Array.isArray(a.surfaces)\|\|a.surfaces.includes(source)); |
| selected | const | 113 | no | const selected=actions.find(a=&gt;a.actionId===meaning?.candidate?.actionId); |
| describeDraft | function | 122 | yes | export function describeDraft(text,meaning,{compileUi,hostRequired=true}={}){ |
| route | const | 124 | no | const route=resolveProductRoute(text,{hostMeaning:meaning,compileUi,hostRequired}); |
| m | const | 127 | no | const m=route.meaning; |
| action | const | 129 | no | const action=m.composer?.authority===&#39;none&#39;&amp;&amp;m.composer.action?.id===m.candidate?.actionId?m.composer.action:null; |
| detail | const | 138 | no | const detail=route.reading.detail; |
| draftSuggestions | function | 148 | yes | export function draftSuggestions(text,meaning){ |
| envelope | const | 149 | no | const envelope=meaning?.composer; |
| seen | const | 151 | no | const seen=new Set(); |
| mountComposerAssist | function | 162 | yes | export function mountComposerAssist({field,host,interpret,getScope,onDraft=()=&gt;{},compileUi,getUiDraftCandidates=()=&gt;[],delay=300,hostRequired=true}={}){ |
| doc | const | 165 | no | const doc=field.ownerDocument; |
| generation | variable | 166 | no | let generation=0,timer=null,expiry=null,inFlight=false,queued=null,shown=null,selected=-1,disposed=false; |
| node | function | 169 | no | const node=(tag,text)=&gt;{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;return n}; |
| hide | function | 170 | no | function hide(){clearTimeout(expiry);expiry=null;shown=null;selected=-1;host.replaceChildren();host.hidden=true;} |
| reset | function | 171 | no | function reset(){generation++;clearTimeout(timer);timer=null;queued=null;hide();} |
| current | function | 172 | no | function current(job){return !disposed&amp;&amp;job.generation===generation&amp;&amp;field.value===job.text&amp;&amp;getScope()===job.scope&amp;&amp;!!job.scope;} |
| validShown | function | 173 | no | function validShown(){return shown&amp;&amp;current(shown.job)&amp;&amp;!field.disabled&amp;&amp;Date.now()-shown.at&lt;15000;} |
| apply | function | 174 | no | function apply(index){ |
| item | const | 176 | no | const item=shown.suggestions[index]; |
| correct | function | 180 | no | async function correct(slot,value){ |
| previous | const | 182 | no | const previous=shown,job=previous.job,next=correctedSlotDraft(job.text,slot,value); |
| checked | const | 186 | no | const checked=await interpret(next); |
| note | const | 190 | no | const note=node(&#39;p&#39;,&#39;Correction could not be verified. Edit the draft text directly.&#39;);note.setAttribute(&#39;role&#39;,&#39;status&#39;);host.append(note);return; |
| render | function | 196 | no | function render(){ |
| status | const | 200 | no | const status=node(&#39;p&#39;,description.label+&#39; — &#39;+description.detail); |
| envelope | const | 202 | no | const envelope=shown.meaning?.composer; |
| slots | const | 204 | no | const slots=node(&#39;div&#39;);slots.className=&#39;semantic-draft-slots&#39;; |
| row | const | 207 | no | const row=node(&#39;div&#39;);row.dataset.state=slot.state; |
| title | const | 208 | no | const title=node(&#39;span&#39;,slot.key+&#39; · &#39;+slot.state+(typeof slot.value===&#39;string&#39;?&#39; · &#39;+slot.value:&#39;&#39;)); |
| edit | const | 211 | no | const edit=node(&#39;input&#39;);edit.type=&#39;text&#39;;edit.value=slot.value;edit.maxLength=1000; |
| list | const | 220 | no | const list=node(&#39;div&#39;); |
| button | const | 222 | no | const button=node(&#39;button&#39;,s.text);button.type=&#39;button&#39;;button.className=&#39;chip&#39;; |
| hint | const | 227 | no | const hint=node(&#39;small&#39;,selected&lt;0?&#39;Tab to select · Tab again to insert · Esc to dismiss&#39;:&#39;Tab to insert · ↑/↓ to choose · Esc to dismiss&#39;); |
| pump | function | 232 | no | async function pump(){ |
| job | const | 234 | no | const job=queued;queued=null; |
| destination | const | 240 | no | const destination=resolveLocalDestination(job.text); |
| meaning | const | 241 | no | const meaning=destination?null:await interpret(job.text); |
| desc | const | 244 | no | const desc=describeDraft(job.text,meaning,{compileUi,hostRequired}); |
| suggestions | const | 246 | no | const suggestions=draftSuggestions(job.text,meaning); |
| candidates | variable | 249 | no | let candidates=[];try{candidates=getUiDraftCandidates()}catch{} |
| candidate | const | 253 | no | const candidate=compileUi?.(text); |
| schedule | function | 268 | no | function schedule(){ |
| text | const | 270 | no | const text=field.value,scope=getScope(); |
| job | const | 272 | no | const job={text,scope,generation}; |
| keydown | function | 275 | no | function keydown(event){ |
| composing | variable | 286 | no | let composing=false; |
| onInput | function | 287 | no | const onInput=()=&gt;{if(!composing)schedule();else reset()}; |
| compositionStart | function | 288 | no | const compositionStart=()=&gt;{composing=true;reset()}; |
| compositionEnd | function | 289 | no | const compositionEnd=()=&gt;{composing=false;schedule()}; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./control-language.mjs | import | 4 | [apps/mobile-relay/control-language.mjs](./control-language.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/app.js](./app.js.md) | ./composer-assist.mjs |
| [apps/mobile-relay/build-canvas.mjs](./build-canvas.mjs.md) | ./composer-assist.mjs |
| [apps/mobile-relay/test/composer-assist.test.mjs](./test/composer-assist.test.mjs.md) | ../composer-assist.mjs |
| [apps/vivim-host/direct-phone.mjs](../vivim-host/direct-phone.mjs.md) | ../mobile-relay/composer-assist.mjs |
| [apps/vivim-host/server.mjs](../vivim-host/server.mjs.md) | ../mobile-relay/composer-assist.mjs |
| [apps/vivim-host/test/chat-command-surface.test.mjs](../vivim-host/test/chat-command-surface.test.mjs.md) | ../../mobile-relay/composer-assist.mjs |
| [apps/vivim-host/test/wiki-visual-contract.test.mjs](../vivim-host/test/wiki-visual-contract.test.mjs.md) | ../../mobile-relay/composer-assist.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
  if(meaning?.candidate?.actionId?.startsWith('wiki.')||
     meaning?.choices?.some(id=>id.startsWith('wiki.')))return true;
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
```

_First 80 of 303 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
