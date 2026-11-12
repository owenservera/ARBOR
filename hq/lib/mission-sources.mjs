/**
 * @hq:context Read-only HQ mission snapshot from existing work orders, task JSONL,
 *   and supervisor lane files. No task DB, no dispatch, no authority over effects.
 * @hq:invariant Strict scan rejects corrupt supervisor files that readLaneFiles silently skips.
 * @hq:invariant Stable double-read is an observation, not a transaction/lease.
 */
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import { isAbsolute, join, basename } from 'node:path';
export const SNAPSHOT_SCHEMA='hq.mission-sources/1';
const hash=v=>createHash('sha256').update(v).digest('hex');
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/;
const LANE=/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
export class MissionSourceError extends Error{constructor(code,detail=code){super(detail);this.code=code;this.name='MissionSourceError';}}
const bad=(c,d)=>{throw new MissionSourceError(c,d)};
function pathCheck(p,label){if(typeof p!=='string'||!isAbsolute(p)||p.includes('\0'))bad('SOURCE_PATH_INVALID',`${label}: explicit absolute path required`);return p;}
function stableFile(p,label){
  pathCheck(p,label);let before,after,bytes;
  try{before=lstatSync(p)}catch(e){bad('SOURCE_MISSING',`${label}: ${e.code??'missing'}`)}
  if(!before.isFile()||before.isSymbolicLink()||before.size>8*1024*1024)bad('SOURCE_UNSAFE',`${label}: unsafe or oversized`);
  try{bytes=readFileSync(p);after=lstatSync(p)}catch(e){bad('SOURCE_UNAVAILABLE',`${label}: ${e.code??'unavailable'}`)}
  if(!after.isFile()||after.isSymbolicLink()||before.ino!==after.ino||before.dev!==after.dev||
     before.size!==after.size||bytes.length!==after.size)bad('SOURCE_CHANGED',`${label}: changed while reading`);
  return {bytes,digest:hash(bytes),ino:after.ino};
}
function scanLanes(dir){
  pathCheck(dir,'supervisorDir');const p=join(dir,'lanes');let st;
  try{st=lstatSync(p)}catch(e){bad('SOURCE_MISSING',`supervisor lanes: ${e.code??'missing'}`)}
  if(!st.isDirectory()||st.isSymbolicLink())bad('SOURCE_UNSAFE','supervisor lane directory unsafe');
  let names;try{names=readdirSync(p).filter(n=>n.endsWith('.json')).sort()}catch(e){bad('SOURCE_UNAVAILABLE',e.code)}
  if(names.length>10000)bad('SOURCE_TOO_LARGE','too many lane files');
  const files=[];
  for(const name of names){
    if(!LANE.test(name.slice(0,-5)))bad('SOURCE_UNSAFE',`invalid lane filename: ${name}`);
    const x=stableFile(join(p,name),'supervisor lane');let doc;
    try{doc=JSON.parse(x.bytes.toString('utf8'))}catch{bad('SOURCE_CORRUPT',`${name}: JSON invalid`)}
    if(doc?.laneId!==basename(name,'.json')||typeof doc.status!=='string')bad('SOURCE_CORRUPT',`${name}: identity invalid`);
    files.push({name,digest:x.digest,ino:x.ino,laneId:doc.laneId,status:doc.status});
  }
  return files;
}
const uniq=xs=>[...new Set(xs)];
export async function readMissionSources({mission,ordersFile,taskFile,supervisorDir,readers={}}={}){
  if(mission?.schema!=='hq.mission/1'||!ID.test(mission.id??'')||!Array.isArray(mission.steps))bad('MISSION_INVALID');
  const work=uniq(mission.steps.map(s=>s?.workOrderId).filter(Boolean)),tasks=uniq(mission.steps.map(s=>s?.taskId).filter(Boolean)),
    lanes=uniq(mission.steps.map(s=>s?.laneId).filter(Boolean));
  if(work.some(id=>!ID.test(id))||tasks.some(id=>!ID.test(id))||lanes.some(id=>!LANE.test(id)))bad('MISSION_LINK_INVALID');
  if(work.length)pathCheck(ordersFile,'ordersFile');
  if(tasks.length)pathCheck(taskFile,'taskFile');
  if(lanes.length)pathCheck(supervisorDir,'supervisorDir');
  const inputs=[work.length&&ordersFile,tasks.length&&taskFile,lanes.length&&supervisorDir].filter(Boolean);
  if(new Set(inputs).size!==inputs.length)bad('SOURCE_PATH_INVALID','source paths overlap');
  const initial={};
  if(work.length)initial.orders=stableFile(ordersFile,'ordersFile');
  if(tasks.length)initial.tasks=stableFile(taskFile,'taskFile');
  if(lanes.length)initial.lanes=scanLanes(supervisorDir);
  const validateDoc=readers.validateDoc??(await import('./work-orders.mjs')).validateDoc;
  const view=readers.view??(await import('./task-lifecycle.mjs')).view;
  const readLaneFiles=readers.readLaneFiles??(await import('../supervisor/supervisor.mjs')).readLaneFiles;
  let orders={schema:'hq.work-order/1',orders:[]}, taskView={schema:'hq.task-lifecycle-view/1',tasks:[]},laneViews=[];
  if(work.length){
    try{orders=JSON.parse(initial.orders.bytes.toString('utf8'))}catch{bad('SOURCE_CORRUPT','orders invalid JSON')}
    const v=validateDoc(orders);if(v?.ok!==true)bad('SOURCE_CORRUPT',`work order validation failed: ${(v?.errors??[]).join(',')}`);
  }
  if(tasks.length){
    if(!initial.tasks.bytes.length||initial.tasks.bytes.at(-1)!==10)bad('SOURCE_CORRUPT','truncated task JSONL tail');
    try{taskView=view({file:taskFile})}catch(e){bad('SOURCE_CORRUPT',e.code??e.message)}
    if(taskView?.ok!==true||taskView.schema!=='hq.task-lifecycle-view/1'||taskView.exists!==true)bad('SOURCE_CORRUPT','task view invalid');
  }
  if(lanes.length){
    try{laneViews=readLaneFiles(supervisorDir)}catch(e){bad('SOURCE_CORRUPT',e.code??e.message)}
    if(!Array.isArray(laneViews)||laneViews.length!==initial.lanes.length||
       new Set(laneViews.map(l=>l.laneId)).size!==laneViews.length)bad('SOURCE_CORRUPT','lane reader skipped/duplicated records');
    for(const l of laneViews){const s=initial.lanes.find(x=>x.laneId===l.laneId);
      if(!s||s.status!==l.status)bad('SOURCE_CHANGED','lane changed while reading')}
  }
  if(work.length&&stableFile(ordersFile,'ordersFile').digest!==initial.orders.digest)bad('SOURCE_CHANGED','orders changed');
  if(tasks.length&&stableFile(taskFile,'taskFile').digest!==initial.tasks.digest)bad('SOURCE_CHANGED','tasks changed');
  if(lanes.length){const again=scanLanes(supervisorDir);
    if(JSON.stringify(again)!==JSON.stringify(initial.lanes))bad('SOURCE_CHANGED','lanes changed');}
  if(new Set(orders.orders.map(o=>o.id)).size!==orders.orders.length)bad('SOURCE_CORRUPT','duplicate orders');
  if(new Set(taskView.tasks.map(t=>t.id)).size!==taskView.tasks.length)bad('SOURCE_CORRUPT','duplicate tasks');
  const fingerprints={...(work.length&&{orders:initial.orders.digest}),...(tasks.length&&{tasks:initial.tasks.digest}),
    ...(lanes.length&&{lanes:hash(initial.lanes.map(l=>l.name+'\0'+l.digest).join('\n'))})};
  return {schema:SNAPSHOT_SCHEMA,missionId:mission.id,stable:true,fingerprint:hash(JSON.stringify(fingerprints)),fingerprints,
    linked:{workOrders:work.length,tasks:tasks.length,lanes:lanes.length},
    workOrders:{schema:'hq.work-order/1',orders:orders.orders.filter(o=>work.includes(o.id)).map(o=>({id:o.id,status:o.status}))},
    taskView:{schema:'hq.task-lifecycle-view/1',tasks:taskView.tasks.filter(t=>tasks.includes(t.id)).map(t=>({id:t.id,state:t.state,since:t.since}))},
    lanes:laneViews.filter(l=>lanes.includes(l.laneId)).map(l=>({laneId:l.laneId,status:l.status,effect:l.effect,heartbeatAt:l.heartbeatAt,startedAt:l.startedAt}))};
}
