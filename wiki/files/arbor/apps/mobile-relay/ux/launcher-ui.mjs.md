# File: apps/mobile-relay/ux/launcher-ui.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/ux/launcher-ui.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 14962 B |
| Lines | 224 |
| Hash | a5599246e7ef |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| engineRegistry | function | 6 | no | const engineRegistry=()=&gt;import(typeof process!==&#39;undefined&#39;&amp;&amp;process.versions?.node ? &#39;../../../packages/vec-ui-engines/src/registry.mjs&#39; : &#39;../vec-engines/registry.mjs&#39;); |
| mountCapabilityLauncher | function | 11 | yes | export function mountCapabilityLauncher({host,context,onActivate,onInspect=()=&gt;false,onDraft=()=&gt;false}={}){ |
| doc | const | 14 | no | const doc=host.ownerDocument, make=(tag,cls,content)=&gt;{ |
| node | const | 15 | no | const node=doc.createElement(tag); |
| dialog | const | 20 | no | const dialog=make(&#39;dialog&#39;,&#39;pwa-launcher&#39;); |
| head | const | 23 | no | const head=make(&#39;header&#39;,&#39;launcher-head&#39;); |
| title | const | 24 | no | const title=make(&#39;h2&#39;,&#39;&#39;, &#39;Find something in VIVIM&#39;); |
| close | const | 25 | no | const close=make(&#39;button&#39;,&#39;btn sm&#39;,&#39;Close&#39;);close.type=&#39;button&#39;; |
| input | const | 27 | no | const input=make(&#39;input&#39;,&#39;launcher-search&#39;); |
| info | const | 32 | no | const info=make(&#39;p&#39;,&#39;muted launcher-info&#39;,&#39;Only existing app features. Nothing will be sent or executed.&#39;); |
| list | const | 33 | no | const list=make(&#39;div&#39;,&#39;launcher-results&#39;); |
| modes | const | 35 | no | const modes=make(&#39;div&#39;,&#39;launcher-modes&#39;); |
| buttons | const | 36 | no | const buttons=[&#39;Features&#39;,&#39;VIEW ALL&#39;,&#39;Engines&#39;,&#39;Templates&#39;].map(label=&gt;{ const button=make(&#39;button&#39;,&#39;btn sm&#39;,label);button.type=&#39;button&#39;;modes.append(button);return button; }); |
| button | const | 37 | no | const button=make(&#39;button&#39;,&#39;btn sm&#39;,label);button.type=&#39;button&#39;;modes.append(button);return button; |
| previous | variable | 40 | no | let previous=null,mode=0,generation=0,engines=null; |
| liveRows | function | 44 | no | function liveRows(snapshot,query){ |
| q | const | 45 | no | const q=query.toLowerCase(); |
| libraryRow | function | 49 | no | function libraryRow(title,detail,state){ |
| row | const | 50 | no | const row=make(&#39;div&#39;,&#39;launcher-row&#39;);row.append(make(&#39;strong&#39;,&#39;&#39;,title),make(&#39;span&#39;,&#39;&#39;,detail),make(&#39;small&#39;,&#39;&#39;,state));return row; |
| available | function | 52 | no | function available(){ |
| snapshot | variable | 53 | no | let snapshot;try{snapshot=context()}catch{snapshot={}} |
| render | function | 56 | no | function render(){ |
| epoch | const | 57 | no | const epoch=++generation; |
| snapshot | variable | 62 | no | let snapshot;try{snapshot=context()}catch{snapshot={}} |
| query | const | 63 | no | const query=input.value.trim().slice(0,100); |
| rows | const | 66 | no | const rows=listWorkspaceTemplates().filter(t=&gt;!query\|\|[t.title,t.summary,t.templateId].some(v=&gt;v.toLowerCase().includes(query.toLowerCase()))); |
| row | const | 69 | no | const row=libraryRow(t.title,t.summary,t.liveBinding?&#39;Live binding: &#39;+t.liveBinding:&#39;Layout only · source data not assumed&#39;); |
| draft | const | 71 | no | const draft=make(&#39;button&#39;,&#39;btn sm&#39;,&#39;Draft template&#39;);draft.type=&#39;button&#39;;draft.addEventListener(&#39;click&#39;,()=&gt;{ const latest=context();if(!latest.visualDraftAllowed\|\|latest.visualRevision!==snapshot.vi… |
| latest | const | 72 | no | const latest=context();if(!latest.visualDraftAllowed\|\|latest.visualRevision!==snapshot.visualRevision)return; |
| live | const | 80 | no | const live=liveRows(snapshot,query),definitions=listUiComponents({search:query}); |
| button | const | 83 | no | const button=make(&#39;button&#39;,&#39;launcher-row&#39;);button.type=&#39;button&#39;; |
| current | const | 87 | no | const current=liveRows(context(),&#39;&#39;).find(x=&gt;x.instanceId===row.instanceId&amp;&amp;x.surfaceId===row.surfaceId&amp;&amp;x.revision===row.revision); |
| details | const | 91 | no | const details=make(&#39;details&#39;,&#39;launcher-row&#39;);details.append(make(&#39;summary&#39;,&#39;&#39;, &#39;Configure &#39;+row.instanceId)); |
| property | const | 92 | no | const property=make(&#39;select&#39;,&#39;launcher-search&#39;);property.setAttribute(&#39;aria-label&#39;,&#39;Component property&#39;); |
| value | const | 94 | no | const value=make(&#39;input&#39;,&#39;launcher-search&#39;);value.setAttribute(&#39;aria-label&#39;,&#39;Component value&#39;); |
| configureValue | function | 95 | no | function configureValue(){const b=COMPONENT_PRESENTATION_BINDINGS[property.value];if(!b)return; |
| isCurrent | function | 99 | no | const isCurrent=()=&gt;{const live=context();return live.visualDraftAllowed&amp;&amp;liveRows(live,&#39;&#39;).some(x=&gt;x.instanceId===row.instanceId&amp;&amp;x.surfaceId===row.surfaceId&amp;&amp;x.revision===row.revision);}; |
| draft | const | 100 | no | const draft=make(&#39;button&#39;,&#39;btn sm&#39;,&#39;Draft component change&#39;);draft.type=&#39;button&#39;;draft.addEventListener(&#39;click&#39;,()=&gt;{ if(!isCurrent()\|\|!value.checkValidity())return;const b=COMPONENT_PRESENTATION_BIN… |
| details | const | 108 | no | const details=make(&#39;details&#39;,&#39;launcher-row&#39;);details.append(make(&#39;summary&#39;,&#39;&#39;, &#39;Connect data source · &#39;+row.instanceId)); |
| source | const | 109 | no | const source=make(&#39;select&#39;,&#39;launcher-search&#39;);source.setAttribute(&#39;aria-label&#39;,&#39;Read-only data source&#39;); |
| draft | const | 112 | no | const draft=make(&#39;button&#39;,&#39;btn sm&#39;,&#39;Draft data-source change&#39;);draft.type=&#39;button&#39;; |
| states | const | 120 | no | const states=[...new Set(row.implementations.map(x=&gt;x.status))].filter(Boolean); |
| capabilities | const | 135 | no | const capabilities=engines.listEngineCapabilities({search:query}); |
| mapped | const | 138 | no | const mapped=Object.entries(THEME_BINDINGS).find(([,b])=&gt;b.capabilityId===cap.id); |
| row | const | 139 | no | const row=libraryRow(cap.name,cap.id+&#39; · &#39;+cap.valueSchema.type,mapped?&#39;Reviewed Build and shell preview mapping; effect authority separate&#39;:&#39;Described; installation not established&#39;); |
| value | const | 142 | no | const value=make(&#39;input&#39;,&#39;launcher-search&#39;);value.type=binding.type===&#39;color&#39;?&#39;color&#39;:&#39;number&#39;; |
| existing | const | 143 | no | const existing=snapshot.visualTheme?.[binding.field]; |
| draft | const | 149 | no | const draft=make(&#39;button&#39;,&#39;btn sm&#39;,label);draft.type=&#39;button&#39;; |
| raw | const | 152 | no | const raw=binding.type===&#39;length&#39;?value.value+&#39;px&#39;:value.value; |
| hits | const | 163 | no | const hits=available(); |
| row | const | 166 | no | const row=make(&#39;button&#39;,&#39;launcher-row&#39;+(hit.available?&#39;&#39;:&#39; unavailable&#39;)); |
| label | const | 168 | no | const label=make(&#39;strong&#39;,&#39;&#39;,hit.title); |
| description | const | 169 | no | const description=make(&#39;span&#39;,&#39;&#39;,hit.detail); |
| state | const | 170 | no | const state=make(&#39;small&#39;,&#39;&#39;,hit.reason); |
| current | const | 174 | no | const current=searchCapabilities(&#39;&#39;,context()).find(x=&gt;x.id===hit.id); |
| open | function | 182 | no | function open({mode:initialMode=0,query=&#39;&#39;}={}){ |
| closeDialog | function | 190 | no | function closeDialog(){ |
| first | const | 205 | no | const first=list.querySelector(&#39;button:not([disabled])&#39;); |
| all | const | 211 | no | const all=Array.from(list.querySelectorAll(&#39;button:not([disabled])&#39;)); |
| at | const | 212 | no | const at=all.indexOf(doc.activeElement); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./launcher.mjs | import | 1 | [apps/mobile-relay/ux/launcher.mjs](./launcher.mjs.md) |
| ../vec/ui-taxonomy/registry.mjs | import | 2 | [apps/mobile-relay/vec/ui-taxonomy/registry.mjs](../vec/ui-taxonomy/registry.mjs.md) |
| ../build-composer.mjs | import | 3 | [apps/mobile-relay/build-composer.mjs](../build-composer.mjs.md) |
| ../generative-ui/catalog.mjs | import | 4 | [apps/mobile-relay/generative-ui/catalog.mjs](../generative-ui/catalog.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/app.js](../app.js.md) | ./ux/launcher-ui.mjs |
| [apps/mobile-relay/test/pwa-preflight-ui.test.mjs](../test/pwa-preflight-ui.test.mjs.md) | ../ux/launcher-ui.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import {searchCapabilities} from './launcher.mjs';
import {listUiComponents,UI_TAXONOMY_COUNTS} from '../vec/ui-taxonomy/registry.mjs';
import {THEME_BINDINGS,listWorkspaceTemplates} from '../build-composer.mjs';
import {COMPONENT_PRESENTATION_BINDINGS,LIVE_UI_BINDINGS} from '../generative-ui/catalog.mjs';
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
  const buttons=['Features','VIEW ALL','Engines','Templates'].map(label=>{
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
    input.placeholder=mode===0?'Search Talk, media, Build, controls…':mode===1?'Search live instances or component definitions…':mode===2?'Search engine capabilities…':'Search reusable workspace templates…';
    if(mode!==0){
      let snapshot;try{snapshot=context()}catch{snapshot={}}
      const query=input.value.trim().slice(0,100);
      if(mode===3){
        info.textContent='Existing TierFlow templates. Insertion is a normal Host-reviewed Build proposal, never an automatic write.';
        const rows=listWorkspaceTemplates().filter(t=>!query||[t.title,t.summary,t.templateId].some(v=>v.toLowerCase().includes(query.toLowerCase())));
        if(!rows.length)list.append(make('p','muted','No matching template or template library unavailable.'));
        for(const t of rows){
          const row=libraryRow(t.title,t.summary,t.liveBinding?'Live binding: '+t.liveBinding:'Layout only · source data not assumed');
          if(snapshot.visualDraftAllowed&&Number.isSafeInteger(snapshot.visualRevision)){
            const draft=make('button','btn sm','Draft template');draft.type='button';draft.addEventListener('click',()=>{
              const latest=context();if(!latest.visualDraftAllowed||latest.visualRevision!==snapshot.visualRevision)return;
              if(onDraft('instantiate template '+t.templateId+' at revision '+snapshot.visualRevision))closeDialog();
            });row.append(draft);
          }list.append(row);
        }return;
      }
      if(mode===1){
        info.textContent='Inspect live instances and canonical definitions. Shell identity does not grant edit authority.';
        const live=liveRows(snapshot,query),definitions=listUiComponents({search:query});
```

_First 80 of 225 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
