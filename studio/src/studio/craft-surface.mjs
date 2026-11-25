// Structural inspection of one Studio-owned page. Uses incumbent CDP for the read
// that upstream Craft clean-room does not support; no mutation, script-source or storage read.
import { CdpConnection } from '../cdp/client.mjs';
import { browserVersion, listTargets, pickTarget } from '../cdp/discovery.mjs';
import { verifyBrowserOwner } from '../chrome/browser-ownership.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const ROLES=new Set(['button','link','menu','menubar','menuitem','menuitemcheckbox','menuitemradio','tab','tablist','dialog','alertdialog','combobox','listbox','option','checkbox','radio','switch','textbox','searchbox','slider','spinbutton','tree','treeitem','navigation','toolbar']);
const STATES=new Set(['disabled','expanded','checked','selected','pressed','required','readonly','focused','hasPopup']);
const KNOWN=/^(?:settings|personalization|apps|plugins|connectors|developer mode|advanced settings|manage apps|active tools|tools|refresh|refresh tools|refresh metadata|refresh tool catalog|reconnect|connected apps|vivim arbor|vivim|search|search apps|close|cancel|back|next|done|account|profile|log in|sign in|log out|new chat|projects|library|work|chatgpt|configuration|ajustes|configuración|aplicaciones|herramientas activas|actualizar|cerrar|iniciar sesión)$/i;
const TOOL=/^vivim_[a-z0-9_]{1,96}$/;
export function projectVisibleControls(nodes){
  if(!Array.isArray(nodes))throw Error('SURFACE_AX_INVALID');
  const controls=[],counts={};let unnamed=0;
  for(const n of nodes){
    const role=n?.role?.value;
    if(n?.ignored!==false||!ROLES.has(role))continue;
    const raw=typeof n.name?.value==='string'?n.name.value.trim():'';
    // Do not persist conversation titles, account names, messages, field values or arbitrary labels.
    const label=KNOWN.test(raw)||TOOL.test(raw)?raw:null;
    const state={};
    for(const p of n.properties??[]){
      const v=p?.value?.value;
      if(STATES.has(p?.name)&&(typeof v==='boolean'||['true','false','mixed','menu','listbox','tree','grid','dialog'].includes(v)))state[p.name]=v;
    }
    counts[role]=(counts[role]??0)+1;
    if(!label)unnamed++;
    if(controls.length<5000)controls.push({role,label,state});
  }
  return {controls,counts,redactedLabels:unnamed,truncated:Object.values(counts).reduce((a,b)=>a+b,0)>controls.length};
}
export async function captureSurface({profileDir,port,target,origin,evidenceRoot}){
  if(!target||!origin||new URL(origin).origin!==origin||!origin.startsWith('https://'))throw Error('SURFACE_EXPLICIT_TARGET_AND_ORIGIN_REQUIRED');
  const version=await browserVersion({port});
  const owner=await verifyBrowserOwner({profileDir,port,version});
  const t=pickTarget(await listTargets({port}),target);
  if(new URL(t.url).origin!==origin)throw Error('SURFACE_ORIGIN_MISMATCH');
  const connection=await CdpConnection.connect(version.webSocketDebuggerUrl,{requestTimeoutMs:12000});
  let session;
  try{
    session=await connection.attach(t.id);
    const originOf=async()=> (await session.send('Runtime.evaluate',{expression:'location.origin',returnByValue:true})).result?.value;
    if(await originOf()!==origin)throw Error('SURFACE_ORIGIN_MISMATCH');
    const result=await session.send('Accessibility.getFullAXTree',{});
    if(await originOf()!==origin)throw Error('SURFACE_ORIGIN_CHANGED');
    const after=await verifyBrowserOwner({profileDir,port});
    const current=(await listTargets({port})).find(x=>x.id===t.id);
    if(after.browserIdentity!==owner.browserIdentity||!current||current.url!==t.url)throw Error('SURFACE_TARGET_CHANGED');
    const projection=projectVisibleControls(result.nodes);
    const dir=path.join(evidenceRoot,randomUUID());
    await mkdir(dir,{recursive:true});
    const receipt={schema:'vivim.craft-surface/1',origin,targetId:t.id,source:'studio-accessibility',coverage:'current-accessibility-tree-only',executionAuthorized:false,evidenceDirectory:dir,...projection};
    await writeFile(path.join(dir,'surface.json'),JSON.stringify(receipt,null,2),{flag:'wx'});
    return receipt;
  }finally{
    try{if(session)await connection.detach(session.sessionId)}finally{connection.close()}
  }
}
