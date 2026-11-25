// Native Craft runtime adapter: reuse the Rust donor without replacing Host authority.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash,randomUUID} from 'node:crypto';
import {mkdir,writeFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {verifyBrowserOwner} from '../chrome/browser-ownership.mjs';
import {listTargets,pickTarget} from '../cdp/discovery.mjs';
const exec=promisify(execFile);
const sha=b=>createHash('sha256').update(b).digest('hex');
async function invoke(executable,args){
  if(!path.isAbsolute(executable??'')||!(await stat(executable)).isFile())throw Error('CRAFT_EXECUTABLE_REQUIRED');
  const {stdout}=await exec(executable,args,{encoding:'utf8',windowsHide:true,timeout:30000,maxBuffer:16*1024*1024});
  const r=JSON.parse(stdout);if(r?.error)throw Error('CRAFT_TOOL_FAILED: '+(r.error.code??'unknown'));return r;
}
export async function craftCatalog(executable){
  const rows=await invoke(executable,['commands']);
  if(!Array.isArray(rows)||!rows.length||rows.some(x=>typeof x.command!=='string'||typeof x.toolset!=='string')||new Set(rows.map(x=>x.command)).size!==rows.length)throw Error('CRAFT_CATALOG_INVALID');
  return {schema:'vivim.craft-runtime-catalog/1',count:rows.length,commands:rows};
}
export function verifyCraftScreenshot(record,origin){
  const s=record?.result?.screenshot;
  if(record?.operation!=='web_page_screenshot_take'||!s||new URL(record.result.origin).origin!==origin)throw Error('CRAFT_EVIDENCE_SCOPE_MISMATCH');
  if(typeof s.base64!=='string'||!/^[a-f0-9]{64}$/.test(s.sha256??'')||s.media_type!=='image/png')throw Error('CRAFT_SCREENSHOT_INVALID');
  const bytes=Buffer.from(s.base64,'base64');
  if(bytes.length!==s.bytes||sha(bytes)!==s.sha256||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('CRAFT_SCREENSHOT_INTEGRITY');
  return {bytes,width:s.width,height:s.height,sha256:s.sha256};
}
export async function craftScreenshot({executable,profileDir,port,target,origin,evidenceRoot}){
  if(!target||!origin||new URL(origin).origin!==origin||!origin.startsWith('https://'))throw Error('CRAFT_EXPLICIT_TARGET_AND_ORIGIN_REQUIRED');
  const owner=await verifyBrowserOwner({profileDir,port});
  const page=pickTarget(await listTargets({port}),target);
  if(new URL(page.url).origin!==origin)throw Error('CRAFT_TARGET_ORIGIN_MISMATCH');
  const record=await invoke(executable,['--clean-room','web-page-screenshot-take','--json',JSON.stringify({cdp_endpoint:'http://127.0.0.1:'+port,target_id:page.id})]);
  const after=await verifyBrowserOwner({profileDir,port});
  const current=(await listTargets({port})).find(x=>x.id===page.id);
  if(!current||new URL(current.url).origin!==origin||owner.browserIdentity!==after.browserIdentity)throw Error('CRAFT_TARGET_CHANGED');
  const s=verifyCraftScreenshot(record,origin);
  const dir=path.join(evidenceRoot,randomUUID());
  await mkdir(dir,{recursive:true});
  await writeFile(path.join(dir,'screenshot.png'),s.bytes,{flag:'wx'});
  const receipt={schema:'vivim.craft-runtime-receipt/1',status:'observed',operation:record.operation,evidenceId:record.id,origin,targetId:page.id,bytes:s.bytes.length,width:s.width,height:s.height,sha256:s.sha256,evidenceDirectory:dir,source:'craft-anything-native',executionAuthorized:false};
  await writeFile(path.join(dir,'receipt.json'),JSON.stringify(receipt,null,2),{flag:'wx'});
  return receipt;
}
