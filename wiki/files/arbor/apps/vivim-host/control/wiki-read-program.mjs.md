# File: apps/vivim-host/control/wiki-read-program.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/wiki-read-program.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12288 B |
| Lines | 136 |
| Hash | bff2a6f52ead |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WIKI_RECIPE_SCHEMA | const | 4 | yes | export const WIKI_RECIPE_SCHEMA=&#39;vivim.wiki-read-recipe/1&#39;; |
| READS | const | 5 | no | const READS=new Set([&#39;wiki.pages.list&#39;,&#39;wiki.section.read&#39;]); |
| canonical | function | 6 | no | const canonical=v=&gt;Array.isArray(v)?v.map(canonical):v&amp;&amp;typeof v===&#39;object&#39;?Object.fromEntries(Object.keys(v).sort().map(k=&gt;[k,canonical(v[k])])):v; |
| hash | function | 7 | no | const hash=v=&gt;createHash(&#39;sha256&#39;).update(JSON.stringify(canonical(v))).digest(&#39;hex&#39;); |
| compileWikiReadRecipe | function | 8 | yes | export function compileWikiReadRecipe(commands,planCommand,catalog){ |
| lines | const | 10 | no | const lines=commands.split(/\\r?\\n/).map(s=&gt;s.trim()); |
| plans | variable | 12 | no | let plans;try{plans=lines.map(planCommand)}catch{return null;} |
| steps | const | 14 | no | const steps=plans.map(p=&gt;({actionId:p.actionId,args:p.args})); |
| dependencies | const | 15 | no | const dependencies=[...new Set([&#39;program.read_wiki&#39;,...steps.map(p=&gt;p.actionId)])].sort().map(id=&gt;({id,digest:hash(catalog.actions.find(a=&gt;a.id===id)??null)})); |
| validWikiRecipe | function | 18 | yes | export function validWikiRecipe(recipe,commands,catalog){ |
| a | const | 22 | no | const a=catalog.actions.find(a=&gt;a.id===p.actionId);if(!a\|\|a.risk!==&#39;R0&#39;\|\|![&#39;source_wired&#39;,&#39;verified&#39;].includes(a.readiness)\|\|Object.keys(p.args).length!==Object.keys(a.args).length)return false; |
| expected | const | 24 | no | const expected=[...new Set([&#39;program.read_wiki&#39;,...recipe.steps.map(p=&gt;p.actionId)])].sort().map(id=&gt;({id,digest:hash(catalog.actions.find(a=&gt;a.id===id)??null)})); |
| refusal | function | 27 | no | const refusal=(reasonCode,outcome=&#39;refused&#39;)=&gt;({schema:&#39;vivim.wiki-read-program/1&#39;,outcome,reasonCode,effectPerformed:false,mutationPerformed:false}); |
| runWikiReadProgram | function | 28 | yes | export async function runWikiReadProgram({commands,planCommand,readWiki,nativeProgram,readAction,recipe=null,catalog=null,planTyped=null,stillCurrent=()=&gt;true,readEvidence=null,resolveTarget=null}={}… |
| lines | const | 30 | no | const lines=commands.split(/\\r?\\n/).map(s=&gt;s.trim()); |
| plans | variable | 32 | no | let plans; |
| wiki | variable | 41 | no | let wiki;try{wiki=await readWiki();}catch{return refusal(&#39;PROGRAM_WIKI_UNAVAILABLE&#39;,&#39;unavailable&#39;);} |
| digest | function | 43 | no | const digest=x=&gt;createHash(&#39;sha256&#39;).update(JSON.stringify(x)).digest(&#39;hex&#39;); |
| planDigest | const | 44 | no | const planDigest=digest(plans.map(p=&gt;({actionId:p.actionId,args:p.args}))); |
| targets | variable | 46 | no | let targets;try{targets=plans.map(p=&gt;{if(p.actionId!==&#39;wiki.section.read&#39;)return null;return typeof resolveTarget===&#39;function&#39;?resolveTarget(p,wiki):{page:p.args.page,section:p.args.section};});} |
| evidence | variable | 48 | no | let evidence=targets.map(()=&gt;null); |
| selected | const | 50 | no | const selected=targets.filter(Boolean);let response; |
| index | variable | 54 | no | let index=0;for(let i=0;i&lt;targets.length;i++){if(!targets[i])continue; |
| row | const | 55 | no | const row=response.items[index++],target=targets[i],source=row?.source; |
| snapshotDigest | const | 65 | no | const snapshotDigest=hash({wikiRevision:wiki.revision,pages:wiki.pages,planDigest,evidence}); |
| id | const | 66 | no | const id=&#39;wiki-read-&#39;+snapshotDigest.slice(0,24); |
| steps | const | 67 | no | const steps=plans.map((p,i)=&gt;({id:&#39;read-&#39;+(i+1),kind:&#39;evaluate&#39;,dependencies:i?[&#39;read-&#39;+i]:[], inputs:evidence[i]?[{source_id:evidence[i].entryId,revision:evidence[i].wikiRevision,digest:evidence[i].… |
| validated | variable | 70 | no | let validated;try{validated=await nativeProgram({program:JSON.stringify({id,revision:1,steps})});}catch{return refusal(&#39;PROGRAM_NATIVE_UNAVAILABLE&#39;,&#39;unavailable&#39;);} |
| latest | variable | 75 | no | let latest;try{latest=await readWiki();}catch{return refusal(&#39;PROGRAM_WIKI_UNAVAILABLE&#39;,&#39;unavailable&#39;);} |
| results | variable | 78 | no | let results;try{results=plans.map((p,i)=&gt;({stepId:steps[i].id,actionId:p.actionId,args:p.args,result:readAction(p,wiki),sourceEvidence:evidence[i]?{state:&#39;committed-section&#39;,...evidence[i]}:{state:&#39;s… |
| WIKI_WRITE_RECIPE_SCHEMA | const | 89 | yes | export const WIKI_WRITE_RECIPE_SCHEMA=&#39;vivim.wiki-write-recipe/1&#39;; |
| WRITES | const | 90 | no | const WRITES=new Set([&#39;wiki.page.create&#39;,&#39;wiki.section.edit&#39;,&#39;wiki.page.move&#39;,&#39;wiki.pages.link&#39;]); |
| wikiProgramSlug | function | 91 | yes | export const wikiProgramSlug=v=&gt;typeof v===&#39;string&#39;&amp;&amp;/^[a-z][a-z0-9-]{0,62}$/.test(v)&amp;&amp;![&#39;constructor&#39;,&#39;prototype&#39;,&#39;__proto__&#39;].includes(v); |
| writeDependencies | function | 92 | no | function writeDependencies(steps,catalog){ |
| writeArgsValid | function | 95 | no | function writeArgsValid(step,catalog){ |
| a | const | 97 | no | const a=catalog.actions.find(a=&gt;a.id===step.actionId); |
| hasPageSlot | function | 101 | no | function hasPageSlot(steps,page){ |
| compileWikiWriteRecipe | function | 105 | yes | export function compileWikiWriteRecipe(commands,planCommand,catalog,page=null){ |
| lines | const | 107 | no | const lines=commands.split(/\\r?\\n/).map(s=&gt;s.trim()); |
| plans | variable | 109 | no | let plans;try{plans=lines.map(planCommand);}catch{return null;} |
| steps | const | 111 | no | const steps=plans.map(p=&gt;({actionId:p.actionId,args:p.args})); |
| validWikiWriteRecipe | function | 116 | yes | export function validWikiWriteRecipe(recipe,commands,catalog){ |
| bindWikiWriteRecipe | function | 122 | yes | export function bindWikiWriteRecipe(recipe,commands,catalog,page=null){ |
| example | const | 126 | no | const example=recipe.slot.example,steps=recipe.steps.map(s=&gt;{ const args={...s.args}; for(const key of [&#39;page&#39;,&#39;from&#39;,&#39;to&#39;])if(typeof args[key]===&#39;string&#39;&amp;&amp;args[key].toLowerCase()===example)args[key]… |
| args | const | 127 | no | const args={...s.args}; |
| slash | const | 130 | no | const slash=args.target.indexOf(&#39;/&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 3 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/control/dispatcher.mjs](./dispatcher.mjs.md) | ./wiki-read-program.mjs |
| [apps/vivim-host/control/personal-semantics.mjs](./personal-semantics.mjs.md) | ./wiki-read-program.mjs |
| [apps/vivim-host/test/wiki-read-program.test.mjs](../test/wiki-read-program.test.mjs.md) | ../control/wiki-read-program.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Fixed local composition over incumbent typed Wiki reads. A native validation
// is not a grant. The dispatcher alone supplies authenticated read ports.
import {createHash} from 'node:crypto';
export const WIKI_RECIPE_SCHEMA='vivim.wiki-read-recipe/1';
const READS=new Set(['wiki.pages.list','wiki.section.read']);
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const hash=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
export function compileWikiReadRecipe(commands,planCommand,catalog){
  if(typeof commands!=='string'||commands.length>950)return null;
  const lines=commands.split(/\r?\n/).map(s=>s.trim());
  if(lines.length<2||lines.length>8||lines.some(s=>!s||s.length>240))return null;
  let plans;try{plans=lines.map(planCommand)}catch{return null;}
  if(plans.some(p=>p?.outcome!=='ready'||p.risk!=='R0'||p.origin!=='deterministic'||!READS.has(p.actionId)))return null;
  const steps=plans.map(p=>({actionId:p.actionId,args:p.args}));
  const dependencies=[...new Set(['program.read_wiki',...steps.map(p=>p.actionId)])].sort().map(id=>({id,digest:hash(catalog.actions.find(a=>a.id===id)??null)}));
  return {schema:WIKI_RECIPE_SCHEMA,steps,dependencies,commandDigest:hash(commands)};
}
export function validWikiRecipe(recipe,commands,catalog){
  if(!recipe||recipe.schema!==WIKI_RECIPE_SCHEMA||Object.keys(recipe).sort().join(',')!=='commandDigest,dependencies,schema,steps'||
    typeof commands!=='string'||commands.length>950||recipe.commandDigest!==hash(commands)||!Array.isArray(recipe.steps)||recipe.steps.length<2||recipe.steps.length>8||!Array.isArray(recipe.dependencies))return false;
  for(const p of recipe.steps){if(!p||Object.keys(p).sort().join(',')!=='actionId,args'||!READS.has(p.actionId)||!p.args||Array.isArray(p.args)||typeof p.args!=='object')return false;
    const a=catalog.actions.find(a=>a.id===p.actionId);if(!a||a.risk!=='R0'||!['source_wired','verified'].includes(a.readiness)||Object.keys(p.args).length!==Object.keys(a.args).length)return false;
    for(const [key,s] of Object.entries(a.args)){const v=p.args[key];if(typeof v!=='string'||v!==v.trim()||v.length<s.min||v.length>s.max)return false;}}
  const expected=[...new Set(['program.read_wiki',...recipe.steps.map(p=>p.actionId)])].sort().map(id=>({id,digest:hash(catalog.actions.find(a=>a.id===id)??null)}));
  return hash(recipe.dependencies)===hash(expected);
}
const refusal=(reasonCode,outcome='refused')=>({schema:'vivim.wiki-read-program/1',outcome,reasonCode,effectPerformed:false,mutationPerformed:false});
export async function runWikiReadProgram({commands,planCommand,readWiki,nativeProgram,readAction,recipe=null,catalog=null,planTyped=null,stillCurrent=()=>true,readEvidence=null,resolveTarget=null}={}){
  if(typeof commands!=='string'||commands.length>950)return refusal('PROGRAM_INPUT_INVALID');
  const lines=commands.split(/\r?\n/).map(s=>s.trim());
  if(lines.length<2||lines.length>8||lines.some(s=>!s||s.length>240))return refusal('PROGRAM_INPUT_INVALID');
  let plans;
  try{
    if(recipe){if(!catalog||!validWikiRecipe(recipe,commands,catalog)||typeof planTyped!=='function')return refusal('PROGRAM_RECIPE_STALE');
      plans=recipe.steps.map(step=>planTyped(step));
    }else plans=lines.map(text=>planCommand(text));
  }catch{return refusal('PROGRAM_CHILD_INVALID');}
  if(plans.some(p=>p?.outcome!=='ready'||p.risk!=='R0'||p.origin!==(recipe?'typed':'deterministic')||!READS.has(p.actionId)))
    return refusal('PROGRAM_CHILD_NOT_READ_ONLY');
  if(!stillCurrent())return refusal('PROGRAM_RECIPE_STALE');
  let wiki;try{wiki=await readWiki();}catch{return refusal('PROGRAM_WIKI_UNAVAILABLE','unavailable');}
  if(!Number.isSafeInteger(wiki?.revision)||!wiki.pages)return refusal('PROGRAM_WIKI_UNAVAILABLE','unavailable');
  const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
  const planDigest=digest(plans.map(p=>({actionId:p.actionId,args:p.args})));
  // Resolve canonical section names using the incumbent read function, without releasing contents.
  let targets;try{targets=plans.map(p=>{if(p.actionId!=='wiki.section.read')return null;return typeof resolveTarget==='function'?resolveTarget(p,wiki):{page:p.args.page,section:p.args.section};});}
  catch{return refusal('PROGRAM_WIKI_TARGET_UNKNOWN');}
  let evidence=targets.map(()=>null);
  if(typeof readEvidence==='function'){
    const selected=targets.filter(Boolean);let response;
    try{response=await readEvidence(selected,wiki.revision);}catch(error){return refusal(error?.status===409?'PROGRAM_WIKI_STALE':'PROGRAM_SOURCE_UNAVAILABLE','unavailable');}
    if(response?.schema!=='vivim.wiki-program-evidence/1'||response.authority!=='host-product-journal'||response.wikiRevision!==wiki.revision||
      !Array.isArray(response.items)||response.items.length!==selected.length)return refusal('PROGRAM_SOURCE_UNAVAILABLE','unavailable');
    let index=0;for(let i=0;i<targets.length;i++){if(!targets[i])continue;
      const row=response.items[index++],target=targets[i],source=row?.source;
      if(row?.page!==target.page||row.section!==target.section)return refusal('PROGRAM_SOURCE_UNAVAILABLE','unavailable');
      if(source!==null&&(!source||source.kind!=='committed-wiki-edit'||source.status!=='current-section-revision'||
        !/^[a-f0-9-]{36}$/.test(source.entryId??'')||!Number.isSafeInteger(source.wikiRevision)||source.wikiRevision<1||source.wikiRevision>wiki.revision||
        !/^[a-f0-9]{64}$/.test(source.contentDigest??'')||
        createHash('sha256').update(wiki.pages[target.page].sections[target.section],'utf8').digest('hex')!==source.contentDigest))
        return refusal('PROGRAM_SOURCE_UNAVAILABLE','unavailable');
      evidence[i]=source;
    }
  }
  const snapshotDigest=hash({wikiRevision:wiki.revision,pages:wiki.pages,planDigest,evidence});
  const id='wiki-read-'+snapshotDigest.slice(0,24);
  const steps=plans.map((p,i)=>({id:'read-'+(i+1),kind:'evaluate',dependencies:i?['read-'+i]:[],
    inputs:evidence[i]?[{source_id:evidence[i].entryId,revision:evidence[i].wikiRevision,digest:evidence[i].contentDigest,data_class:'private'}]:[],
    output_data_class:'private',risk:'R0',destination:null}));
  let validated;try{validated=await nativeProgram({program:JSON.stringify({id,revision:1,steps})});}catch{return refusal('PROGRAM_NATIVE_UNAVAILABLE','unavailable');}
  if(validated?.outcome!=='compiled')return refusal(validated?.reasonCode??'PROGRAM_NATIVE_UNAVAILABLE',validated?.outcome==='refused'?'refused':'unavailable');
  if(validated.programId!==id||validated.programRevision!==1||validated.executionAuthorized!==false||validated.effectPerformed!==false||
     !/^[a-f0-9]{64}$/.test(validated.programDigest??'')||(evidence.some(Boolean)&&validated.sourceReferencesVerified!==evidence.filter(Boolean).length)||
     JSON.stringify(validated.orderedStepIds)!==JSON.stringify(steps.map(s=>s.id)))return refusal('PROGRAM_NATIVE_CONTRACT_INVALID','unavailable');
  let latest;try{latest=await readWiki();}catch{return refusal('PROGRAM_WIKI_UNAVAILABLE','unavailable');}
  if(!stillCurrent())return refusal('PROGRAM_RECIPE_STALE');
  if(latest.revision!==wiki.revision||digest(latest.pages)!==digest(wiki.pages))return refusal('PROGRAM_WIKI_STALE');
  let results;try{results=plans.map((p,i)=>({stepId:steps[i].id,actionId:p.actionId,args:p.args,result:readAction(p,wiki),sourceEvidence:evidence[i]?{state:'committed-section',...evidence[i]}:{state:'snapshot-only'}}));}
  catch{return refusal('PROGRAM_WIKI_TARGET_UNKNOWN');}
  if(results.some(r=>r.result?.wikiRevision!==wiki.revision))return refusal('PROGRAM_WIKI_STALE');
```

_First 80 of 137 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
