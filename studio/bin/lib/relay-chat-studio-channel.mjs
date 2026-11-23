// Studio-owned phone relay adapter for the EXISTING "studio chat ask" command.
// Reuses its verified single-site Drive transport, durable requestId receipt,
// native /c/<uuid> proof, Chrome profile and CDP lease. NO new browser driver.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CMD=/^relay-cmd-[0-9a-f]{16}$/;
const THREAD=/^chatgpt-c:[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const BIN=fileURLToPath(new URL('../studio.mjs',import.meta.url));
const MAX_OUTPUT=4*1024*1024;
const MAX_PROMPT=4000;

function runChild(exe,args,{cwd,env,timeoutMs=690000,spawnImpl=spawn}={}) {
  return new Promise((resolve,reject)=>{
    let child;
    try { child=spawnImpl(exe,args,{cwd,env,windowsHide:true,
      stdio:['ignore','pipe','pipe']}); }
    catch { reject(new Error('STUDIO_CHANNEL_EXEC_UNAVAILABLE')); return; }
    let stdout='',bytes=0,stderrBytes=0,closed=false;
    const timer=setTimeout(()=>{ if(!closed) child.kill(); },timeoutMs);
    const fail=code=>{if(closed)return;closed=true;clearTimeout(timer);reject(new Error(code));};
    child.stdout?.on('data',chunk=>{
      bytes+=chunk.length;
      if(bytes>MAX_OUTPUT){child.kill();fail('STUDIO_CHANNEL_OUTPUT_OVERSIZE');return;}
      stdout+=String(chunk);
    });
    child.stderr?.on('data',chunk=>{stderrBytes+=chunk.length;
      if(stderrBytes>MAX_OUTPUT){child.kill();fail('STUDIO_CHANNEL_STDERR_OVERSIZE');}
    });
    child.on('error',()=>fail('STUDIO_CHANNEL_EXEC_UNAVAILABLE'));
    child.on('close',(exitCode)=>{
      if(closed)return;
      closed=true;clearTimeout(timer);
      resolve({exitCode,stdout});
    });
  });
}
export async function runExistingStudioChatAsk({
  root,port,requestId,prompt,thread,run=runChild
}={}) {
  if (typeof root!=='string'||!path.isAbsolute(root)||
      !Number.isSafeInteger(port)||port<1||port>65535||
      !CMD.test(requestId??'')||
      typeof prompt!=='string'||!prompt.trim()||prompt.length>MAX_PROMPT||
      !(thread==='new'||THREAD.test(thread??'')))
    throw new TypeError('STUDIO_CHANNEL_INPUT_INVALID');

  // A receipt proves this key reached the existing Studio channel before.
  // Even an unreadable/failed receipt is not permission to re-dispatch it:
  // a prior effect may have happened, so preserve the no-retry boundary.
  const receiptPath=path.join(root,'channel','receipts',requestId+'.json');
  if (existsSync(receiptPath))
    throw new Error('STUDIO_CHANNEL_PRIOR_RECEIPT');
  const staging=path.join(root,'bridge','channel-staging');
  mkdirSync(staging,{recursive:true,mode:0o700});
  const file=path.join(staging,requestId+'.txt');
  writeFileSync(file,prompt,{flag:'wx',mode:0o600});
  try {
    const args=[BIN,'chat','ask','--site','chatgpt',
      '--thread',thread,'--prompt-file',file,'--request-id',requestId,
      '--isolated-thread','--timeout','600','--data-dir',root,
      '--port',String(port),'--json'];
    // The child can only invoke Studio. No model API, URL scraper, credentials
    // or ad-hoc CDP client is introduced by this relay layer.
    const {exitCode,stdout}=await run(process.execPath,args,{
      cwd:root,env:{...process.env,VIVIM_CHAT_TRANSPORT:'drive'}
    });
    let outcome;
    try {outcome=JSON.parse(stdout.trim());}
    catch{throw new Error('STUDIO_CHANNEL_RESULT_UNREADABLE');}
    if(outcome?.schema!=='vivim.chat-ask-result/1'||outcome.requestId!==requestId)
      throw new Error('STUDIO_CHANNEL_RESULT_MISMATCH');
    if(exitCode!==0||outcome.effect!=='OK')
      return {effect:outcome.effect==='FAILED'?'FAILED':'UNCERTAIN',
        reason:outcome.effect==='FAILED'?'STUDIO_CHANNEL_REFUSED':'STUDIO_CHANNEL_UNCERTAIN'};
    const resultThread=outcome.threadId;
    if(!THREAD.test(resultThread??'')||(thread!=='new'&&thread!==resultThread))
      throw new Error('STUDIO_CHANNEL_THREAD_UNVERIFIED');
    if(typeof outcome.reply!=='string'||!outcome.reply.trim()||
       typeof outcome.receiptId!=='string'||!outcome.receiptId)
      throw new Error('STUDIO_CHANNEL_REPLY_UNVERIFIED');

    let receipt;
    try { receipt=JSON.parse(readFileSync(receiptPath,'utf8')); }
    catch { throw new Error('STUDIO_CHANNEL_RECEIPT_MISSING'); }
    const digest='sha256:'+createHash('sha256').update(outcome.reply,'utf8').digest('hex');
    if(receipt?.schema!=='vivim.chat-receipt/1'||
       receipt.requestId!==requestId||receipt.receiptId!==outcome.receiptId||
       receipt.effect!=='OK'||receipt.thread?.after!==resultThread||
       receipt.replyDigest!==digest)
      throw new Error('STUDIO_CHANNEL_RECEIPT_UNVERIFIED');
    return {effect:'OK',threadId:resultThread,
      receiptId:receipt.receiptId,reply:outcome.reply};
  } finally {
    rmSync(file,{force:true});
  }
}
