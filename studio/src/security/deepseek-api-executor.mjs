// Local-only provider adapter. Host remains the authority for external requests.
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {MODELS} from './deepseek-api-provision.mjs';
const helper=fileURLToPath(new URL('./deepseek-api-inference.ps1',import.meta.url));
const error=code=>Object.assign(new Error(code),{code});
export function prepareDeepSeekRequest({model='deepseek-flash',messages,maxTokens=256}={}){
  if(!MODELS.includes(model)||!Number.isInteger(maxTokens)||maxTokens<1||maxTokens>4096||
    !Array.isArray(messages)||messages.length<1||messages.length>64)throw error('DEEPSEEK_INVALID_REQUEST');
  const clean=messages.map(m=>{
    if(!m||!['system','user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>32768)
      throw error('DEEPSEEK_INVALID_MESSAGE');
    return {role:m.role,content:m.content};
  });
  const request={model,messages:clean,max_tokens:maxTokens};
  if(Buffer.byteLength(JSON.stringify(request),'utf8')>131072)throw error('DEEPSEEK_REQUEST_TOO_LARGE');
  return request;
}
export function projectDeepSeekResult(value,model){
  if(value?.state!=='completed'){
    const safe=['not_configured','invalid_request','invalid_response','provider_error'].includes(value?.state)?value.state:'invalid_response';
    return {state:safe,provider:'deepseek',...(Number.isInteger(value?.httpStatus)&&value.httpStatus>=100&&value.httpStatus<=599?{httpStatus:value.httpStatus}:{})};
  }
  if(value.model!==model||typeof value.content!=='string'||!['stop','length'].includes(value.finishReason)||
     !Number.isSafeInteger(value.usage?.inputTokens)||value.usage.inputTokens<0||
     !Number.isSafeInteger(value.usage?.outputTokens)||value.usage.outputTokens<0)throw error('DEEPSEEK_INVALID_RESPONSE');
  return {state:'completed',provider:'deepseek',model,content:value.content,finishReason:value.finishReason,
    usage:{inputTokens:value.usage.inputTokens,outputTokens:value.usage.outputTokens}};
}
export async function executeDeepSeek(input){
  const request=prepareDeepSeekRequest(input);
  if(process.platform!=='win32')throw error('WINDOWS_OWNER_SESSION_REQUIRED');
  return new Promise((resolve,reject)=>{
    const child=spawn('pwsh',['-NoLogo','-NoProfile','-File',helper],{windowsHide:true,stdio:['pipe','pipe','ignore']});
    let chunks=[],bytes=0,overflow=false;
    const timeout=setTimeout(()=>{child.kill();reject(error('DEEPSEEK_TIMEOUT_UNCERTAIN'));},75000);
    child.stdout.on('data',chunk=>{
      bytes+=chunk.length;
      if(bytes>1048576){overflow=true;child.kill();}else chunks.push(chunk);
    });
    child.stdin.on('error',()=>{});
    child.once('error',()=>{clearTimeout(timeout);reject(error('DEEPSEEK_HELPER_UNAVAILABLE'));});
    child.once('close',()=>{
      clearTimeout(timeout);
      if(overflow)return reject(error('DEEPSEEK_RESPONSE_TOO_LARGE'));
      try{resolve(projectDeepSeekResult(JSON.parse(Buffer.concat(chunks).toString('utf8')),request.model));}
      catch{reject(error('DEEPSEEK_INVALID_RESPONSE'));}
    });
    child.stdin.end(JSON.stringify(request));
  });
}
