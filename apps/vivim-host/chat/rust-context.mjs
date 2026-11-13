// Host-owned, read-only adapter to the existing native HQKG graph.
// No local Rust binary or existing journal => report unavailable; never
// substitute synthetic context, accept client-selected graph IDs or spawn a shell.
import path from 'node:path';
import {execFile as execFileCb} from 'node:child_process';
import {promisify} from 'node:util';
const execFile=promisify(execFileCb);
export const CHAT_CONTEXT_SCHEMA='vivim.hqkg-chat-context/1';
const MAX_OUTPUT=32768;
const FOCUS=new Set(['today','talk','build','world','me','control']);
const unavailable=reason=>({
  schema:CHAT_CONTEXT_SCHEMA,state:'unavailable',core:'hqkg',authority:'read-only',
  reason,items:[]
});
export function createRustChatContext({
  env=process.env,execute=execFile
}={}){
  const binary=env.VIVIM_CHAT_CORE_BIN;
  const journal=env.VIVIM_CHAT_CORE_JOURNAL;
  const seed=env.VIVIM_CHAT_CORE_SEED;
  return async function readChatContext(focus='talk'){
    if(!FOCUS.has(focus))return unavailable('FOCUS_INVALID');
    if(typeof binary!=='string'||!path.isAbsolute(binary)||
       typeof journal!=='string'||!path.isAbsolute(journal)||
       typeof seed!=='string'||!seed||seed.length>120||/[\x00-\x1f\x7f]/.test(seed))
      return unavailable('RUST_CORE_NOT_CONFIGURED');
    let stdout;
    try{
      ({stdout}=await execute(binary,[journal,seed,'320'],{
        encoding:'utf8',shell:false,windowsHide:true,
        timeout:2500,maxBuffer:MAX_OUTPUT
      }));
    }catch{return unavailable('RUST_CORE_READ_FAILED');}
    if(typeof stdout!=='string'||Buffer.byteLength(stdout,'utf8')>MAX_OUTPUT)
      return unavailable('RUST_CORE_OUTPUT_INVALID');
    let data;try{data=JSON.parse(stdout)}catch{return unavailable('RUST_CORE_OUTPUT_INVALID')}
    if(data?.schema!==CHAT_CONTEXT_SCHEMA||data.state!=='source-backed'||
       data.core!=='hqkg'||data.authority!=='read-only'||data.seed!==seed||
       !Number.isSafeInteger(data.epoch)||data.epoch<0||
       !Number.isSafeInteger(data.tokensUsed)||data.tokensUsed>320||
       data.budgetTokens!==320||data.staleCount!==0||
       !Number.isSafeInteger(data.totalRetrieved)||data.totalRetrieved<0||
       typeof data.budgetExhausted!=='boolean'||!Array.isArray(data.items)||
       data.items.length>8||data.items.length>data.totalRetrieved)
      return unavailable('RUST_CORE_CONTRACT_INVALID');
    const items=[];
    for(const row of data.items){
      if(!row||typeof row.title!=='string'||row.title.length>100||
         /[\x00-\x1f\x7f]/.test(row.title)||
         !Number.isSafeInteger(row.depth)||row.depth<0||row.depth>3||
         !Number.isSafeInteger(row.revision)||row.revision<0||
         !Number.isSafeInteger(row.sourceCount)||row.sourceCount<0||
         !Number.isSafeInteger(row.estimatedTokens)||row.estimatedTokens<0||
         row.estimatedTokens>320)
        return unavailable('RUST_CORE_CONTRACT_INVALID');
      // Deliberately strip all Rust-provided unknown fields and file references.
      items.push({title:row.title,depth:row.depth,revision:row.revision,
        sourceCount:row.sourceCount,estimatedTokens:row.estimatedTokens});
    }
    return {
      schema:CHAT_CONTEXT_SCHEMA,state:'source-backed',core:'hqkg',
      authority:'read-only',focus,epoch:data.epoch,
      tokensUsed:data.tokensUsed,budgetTokens:320,staleCount:0,
      budgetExhausted:data.budgetExhausted,totalRetrieved:data.totalRetrieved,
      items,note:'Context is advisory. Host owns plans, approvals, execution and receipts.'
    };
  };
}
