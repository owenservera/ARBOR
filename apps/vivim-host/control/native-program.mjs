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
        step.risk!=='R0'||step.kind==='effect_candidate')return fail('refused','PROGRAM_POLICY_REFUSED');
      for(const input of step.inputs){
        if(!keys(input,['source_id','revision','digest','data_class'])||typeof input.source_id!=='string'||!uuid.test(input.source_id)||
          !Number.isSafeInteger(input.revision)||!SHA.test(input.digest??'')||input.data_class!=='private')
          return fail('refused','PROGRAM_SOURCE_INVALID');
        refs.push(input);
      }
    }
    // Only current committed Wiki source records may substantiate a referenced input.
    // No caller-asserted evidence, raw source data or unrelated graph records accepted.
    if(refs.length){
      let snapshot;try{snapshot=await productJournal?.readNativeKnowledge({nativeOnly:true});}catch{return fail('unavailable','PROGRAM_SOURCE_UNAVAILABLE');}
      if(!Array.isArray(snapshot?.changes?.items))return fail('unavailable','PROGRAM_SOURCE_UNAVAILABLE');
      const current=new Map(snapshot.changes.items.filter(x=>x.status==='current-section-revision'&&
        x.kind==='committed-wiki-edit'&&typeof x.content==='string'&&
        createHash('sha256').update(x.content,'utf8').digest('hex')===x.contentDigest).map(x=>[x.entryId,x]));
      if(refs.some(ref=>{const source=current.get(ref.source_id);return !source||source.wikiRevision!==ref.revision||source.contentDigest!==ref.digest;}))
        return fail('refused','PROGRAM_SOURCE_STALE');
    }
    const binary=resolveBinary();if(!binary)return fail('unavailable','NATIVE_PROGRAM_NOT_PACKAGED');
    const wire=JSON.stringify({schema:SCHEMA,program:{...draft,policy_id:POLICY.id,policy_revision:POLICY.revision},policy:POLICY});
    let result;
    try{const raw=await run(binary,wire);if(typeof raw!=='string'||Buffer.byteLength(raw,'utf8')>MAX_OUTPUT)throw Error('OUTPUT_LIMIT');result=JSON.parse(raw);}
    catch{return fail('unavailable','NATIVE_PROGRAM_READ_FAILED');}
    if(result?.schema!==SCHEMA||result.executionAuthorized!==false||result.effectPerformed!==false)return fail('unavailable','NATIVE_PROGRAM_CONTRACT_INVALID');
    if(result.outcome==='refused')return fail('refused',typeof result.reasonCode==='string'&&/^[A-Z_]{1,80}$/.test(result.reasonCode)?result.reasonCode:'NATIVE_PROGRAM_REFUSED');
    const ordered=result.orderedStepIds;
    if(result.outcome!=='compiled'||result.programId!==draft.id||result.programRevision!==draft.revision||result.policyRevision!==POLICY.revision||
      !Array.isArray(ordered)||ordered.length!==draft.steps.length||new Set(ordered).size!==ordered.length||
      draft.steps.some(step=>!ordered.includes(step.id)||step.dependencies.some(dep=>ordered.indexOf(dep)<0||ordered.indexOf(dep)>=ordered.indexOf(step.id)))||
      result.lineage?.schema!=='vivim.native-transform-lineage/1'||result.lineage.executionAuthorized!==false||result.lineage.effectPerformed!==false||
      !Array.isArray(result.lineage.nodes)||!Array.isArray(result.lineage.edges))
      return fail('unavailable','NATIVE_PROGRAM_CONTRACT_INVALID');
    return {schema:SCHEMA,outcome:'compiled',programId:draft.id,programRevision:draft.revision,policyRevision:POLICY.revision,
      orderedStepIds:ordered,sourceReferencesVerified:refs.length,sourceScope:refs.length?'current-committed-wiki':'no-source-references',
      programDigest:createHash('sha256').update(wire,'utf8').digest('hex'),
      lineage:{schema:result.lineage.schema,nodes:result.lineage.nodes.length,edges:result.lineage.edges.length,authority:'read-only'},
      executionAuthorized:false,effectPerformed:false};
  };
}
