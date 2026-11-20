# File: apps/vivim-host/control/native-program.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/native-program.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8105 B |
| Lines | 97 |
| Hash | 61da9e1a5561 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SCHEMA | const | 7 | no | const SCHEMA=&#39;vivim.native-program/1&#39;; |
| POLICY | const | 8 | no | const POLICY=Object.freeze({id:&#39;host-local-preview&#39;,revision:1,max_risk:&#39;R0&#39;, max_input_class:&#39;private&#39;,max_output_class:&#39;private&#39;, allowed_destinations:Object.freeze([]),allow_effect_candidates:fals… |
| ID | const | 11 | no | const ID=/^[A-Za-z0-9._:-]{1,128}$/; |
| SHA | const | 12 | no | const SHA=/^[a-f0-9]{64}$/; |
| MAX_OUTPUT | const | 13 | no | const MAX_OUTPUT=128*1024; |
| fail | function | 14 | no | const fail=(outcome,reasonCode)=&gt;({schema:SCHEMA,outcome,reasonCode,executionAuthorized:false,effectPerformed:false}); |
| keys | function | 16 | no | const keys=(x,allowed)=&gt;record(x)&amp;&amp;Object.keys(x).every(k=&gt;allowed.includes(k)); |
| uuid | const | 17 | no | const uuid=/^[0-9a-f-]{36}$/; |
| kinds | const | 18 | no | const kinds=new Set([&#39;normalize&#39;,&#39;select_context&#39;,&#39;interpret&#39;,&#39;compile&#39;,&#39;evaluate&#39;,&#39;project&#39;]); |
| runNative | function | 19 | no | function runNative(binary,wire){ |
| child | const | 21 | no | const child=spawn(binary,[],{stdio:[&#39;pipe&#39;,&#39;pipe&#39;,&#39;pipe&#39;],shell:false,windowsHide:true}); |
| output | variable | 22 | no | let output=[],size=0,settled=false; |
| finish | function | 23 | no | const finish=(err,value)=&gt;{if(settled)return;settled=true;clearTimeout(timer);err?reject(err):resolve(value);}; |
| timer | const | 24 | no | const timer=setTimeout(()=&gt;{child.kill();finish(Error(&#39;NATIVE_PROGRAM_TIMEOUT&#39;));},2500); |
| createNativeProgramValidator | function | 33 | yes | export function createNativeProgramValidator({productJournal=null,resolveBinary=()=&gt;resolveBundledRustBinary(&#39;vivim-program-validate&#39;),run=runNative}={}){ |
| draft | variable | 36 | no | let draft;try{draft=JSON.parse(program);}catch{return fail(&#39;refused&#39;,&#39;PROGRAM_INPUT_INVALID&#39;);} |
| refs | const | 40 | no | const refs=[]; |
| checkedWikiRevision | variable | 56 | no | let checkedWikiRevision=null; |
| sourceIds | const | 57 | no | const sourceIds=[...new Set(refs.map(ref=&gt;ref.source_id))]; |
| checkedSources | function | 59 | no | async function checkedSources(){ |
| snapshot | const | 60 | no | const snapshot=await productJournal?.readProgramSources(sourceIds); |
| current | const | 63 | no | const current=new Map(); |
| snapshot | variable | 69 | no | let snapshot;try{snapshot=await checkedSources();}catch{return fail(&#39;unavailable&#39;,&#39;PROGRAM_SOURCE_UNAVAILABLE&#39;);} |
| binary | variable | 72 | no | let binary;try{binary=resolveBinary();}catch{return fail(&#39;unavailable&#39;,&#39;NATIVE_PROGRAM_NOT_PACKAGED&#39;);}if(!binary)return fail(&#39;unavailable&#39;,&#39;NATIVE_PROGRAM_NOT_PACKAGED&#39;); |
| wire | const | 73 | no | const wire=JSON.stringify({schema:SCHEMA,program:{...draft,policy_id:POLICY.id,policy_revision:POLICY.revision},policy:POLICY}); |
| result | variable | 74 | no | let result; |
| ordered | const | 79 | no | const ordered=result.orderedStepIds; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 4 | external |
| node:crypto | import | 5 | external |
| ../chat/rust-context.mjs | import | 6 | [apps/vivim-host/chat/rust-context.mjs](../chat/rust-context.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/control/dispatcher.mjs](./dispatcher.mjs.md) | ./native-program.mjs |
| [apps/vivim-host/test/native-program.test.mjs](../test/native-program.test.mjs.md) | ../control/native-program.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Host broker for the EXISTING Rust validator. Inputs are inert metadata only.
// Host supplies a deliberately restrictive read-only policy; a caller cannot choose
// a policy, binary, destination or grant. No program execution is implemented here.
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolveBundledRustBinary} from '../chat/rust-context.mjs';
const SCHEMA='vivim.native-program/1';
const POLICY=Object.freeze({id:'host-local-preview',revision:1,max_risk:'R0',
  max_input_class:'private',max_output_class:'private',
  allowed_destinations:Object.freeze([]),allow_effect_candidates:false});
const ID=/^[A-Za-z0-9._:-]{1,128}$/;
const SHA=/^[a-f0-9]{64}$/;
const MAX_OUTPUT=128*1024;
const fail=(outcome,reasonCode)=>({schema:SCHEMA,outcome,reasonCode,executionAuthorized:false,effectPerformed:false});
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const keys=(x,allowed)=>record(x)&&Object.keys(x).every(k=>allowed.includes(k));
const uuid=/^[0-9a-f-]{36}$/;
const kinds=new Set(['normalize','select_context','interpret','compile','evaluate','project']);
function runNative(binary,wire){
  return new Promise((resolve,reject)=>{
    const child=spawn(binary,[],{stdio:['pipe','pipe','pipe'],shell:false,windowsHide:true});
    let output=[],size=0,settled=false;
    const finish=(err,value)=>{if(settled)return;settled=true;clearTimeout(timer);err?reject(err):resolve(value);};
    const timer=setTimeout(()=>{child.kill();finish(Error('NATIVE_PROGRAM_TIMEOUT'));},2500);
    child.on('error',error=>finish(error));
    child.stdout.on('data',chunk=>{size+=chunk.length;if(size>MAX_OUTPUT){child.kill();finish(Error('NATIVE_PROGRAM_OUTPUT_LIMIT'));}else output.push(chunk);});
    child.stderr.on('data',()=>{}); // never expose native process stderr or private inputs
    child.stdin.on('error',error=>finish(error));
    child.on('close',code=>finish(code!==0?Error('NATIVE_PROGRAM_FAILED'):null,Buffer.concat(output).toString('utf8')));
    child.stdin.end(wire,'utf8');
  });
}
export function createNativeProgramValidator({productJournal=null,resolveBinary=()=>resolveBundledRustBinary('vivim-program-validate'),run=runNative}={}){
  return async function validate({program}={}){
    if(typeof program!=='string'||Buffer.byteLength(program,'utf8')>8000)return fail('refused','PROGRAM_INPUT_INVALID');
    let draft;try{draft=JSON.parse(program);}catch{return fail('refused','PROGRAM_INPUT_INVALID');}
    if(!keys(draft,['id','revision','steps'])||!ID.test(draft.id??'')||typeof draft.id!=='string'||
      !Number.isSafeInteger(draft.revision)||draft.revision<1||!Array.isArray(draft.steps)||!draft.steps.length||draft.steps.length>64)
      return fail('refused','PROGRAM_INPUT_INVALID');
    const refs=[];
    for(const step of draft.steps){
      if(!keys(step,['id','kind','dependencies','inputs','output_data_class','risk','destination'])||
        typeof step.id!=='string'||!ID.test(step.id)||!Array.isArray(step.dependencies)||step.dependencies.length>64||
        !Array.isArray(step.inputs)||step.inputs.length>24||step.destination!=null||
        step.risk!=='R0'||!kinds.has(step.kind)||!['public','internal','private'].includes(step.output_data_class)||
        step.dependencies.some(dep=>typeof dep!=='string'||!ID.test(dep)))return fail('refused','PROGRAM_POLICY_REFUSED');
      for(const input of step.inputs){
        if(!keys(input,['source_id','revision','digest','data_class'])||typeof input.source_id!=='string'||!uuid.test(input.source_id)||
          !Number.isSafeInteger(input.revision)||input.revision<1||!SHA.test(input.digest??'')||input.data_class!=='private')
          return fail('refused','PROGRAM_SOURCE_INVALID');
        refs.push(input);
      }
    }
    // Only current committed Wiki source records may substantiate a referenced input.
    // No caller-asserted evidence, raw source data or unrelated graph records accepted.
    let checkedWikiRevision=null;
    const sourceIds=[...new Set(refs.map(ref=>ref.source_id))];
    if(sourceIds.length>64)return fail('refused','PROGRAM_SOURCE_LIMIT');
    async function checkedSources(){
      const snapshot=await productJournal?.readProgramSources(sourceIds);
      if(snapshot?.schema!=='vivim.program-wiki-sources/1'||snapshot.authority!=='host-product-journal'||!Array.isArray(snapshot.items)||
          snapshot.items.length>sourceIds.length||!Number.isSafeInteger(snapshot.wikiRevision)||snapshot.wikiRevision<0)throw Error('PROGRAM_SOURCE_UNAVAILABLE');
      const current=new Map();
      for(const row of snapshot.items){if(!sourceIds.includes(row?.entryId)||current.has(row.entryId)||row.kind!=='committed-wiki-edit'||
        row.status!=='current-section-revision'||!Number.isSafeInteger(row.wikiRevision)||row.wikiRevision<1||row.wikiRevision>snapshot.wikiRevision||!SHA.test(row.contentDigest??''))throw Error('PROGRAM_SOURCE_UNAVAILABLE');current.set(row.entryId,row);}
      return {wikiRevision:snapshot.wikiRevision,matching:refs.every(ref=>{const row=current.get(ref.source_id);return row&&row.wikiRevision===ref.revision&&row.contentDigest===ref.digest;})};
    }
    if(refs.length){
      let snapshot;try{snapshot=await checkedSources();}catch{return fail('unavailable','PROGRAM_SOURCE_UNAVAILABLE');}
      if(!snapshot.matching)return fail('refused','PROGRAM_SOURCE_STALE');checkedWikiRevision=snapshot.wikiRevision;
    }
    let binary;try{binary=resolveBinary();}catch{return fail('unavailable','NATIVE_PROGRAM_NOT_PACKAGED');}if(!binary)return fail('unavailable','NATIVE_PROGRAM_NOT_PACKAGED');
    const wire=JSON.stringify({schema:SCHEMA,program:{...draft,policy_id:POLICY.id,policy_revision:POLICY.revision},policy:POLICY});
    let result;
    try{const raw=await run(binary,wire);if(typeof raw!=='string'||Buffer.byteLength(raw,'utf8')>MAX_OUTPUT)throw Error('OUTPUT_LIMIT');result=JSON.parse(raw);}
    catch{return fail('unavailable','NATIVE_PROGRAM_READ_FAILED');}
    if(result?.schema!==SCHEMA||result.executionAuthorized!==false||result.effectPerformed!==false)return fail('unavailable','NATIVE_PROGRAM_CONTRACT_INVALID');
    if(result.outcome==='refused')return fail('refused',typeof result.reasonCode==='string'&&/^[A-Z_]{1,80}$/.test(result.reasonCode)?result.reasonCode:'NATIVE_PROGRAM_REFUSED');
    const ordered=result.orderedStepIds;
    if(result.outcome!=='compiled'||result.programId!==draft.id||result.programRevision!==draft.revision||result.policyRevision!==POLICY.revision||
```

_First 80 of 98 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
