# File: hq/lib/mission-sources.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/mission-sources.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7030 B |
| Lines | 90 |
| Hash | 87ad26cf1884 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SNAPSHOT_SCHEMA | const | 10 | yes | export const SNAPSHOT_SCHEMA=&#39;hq.mission-sources/1&#39;; |
| hash | function | 11 | no | const hash=v=&gt;createHash(&#39;sha256&#39;).update(v).digest(&#39;hex&#39;); |
| ID | const | 12 | no | const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/; |
| LANE | const | 13 | no | const LANE=/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/; |
| MissionSourceError | class | 14 | yes | export class MissionSourceError extends Error{constructor(code,detail=code){super(detail);this.code=code;this.name=&#39;MissionSourceError&#39;;}} |
| bad | function | 15 | no | const bad=(c,d)=&gt;{throw new MissionSourceError(c,d)}; |
| pathCheck | function | 16 | no | function pathCheck(p,label){if(typeof p!==&#39;string&#39;\|\|!isAbsolute(p)\|\|p.includes(&#39;\\0&#39;))bad(&#39;SOURCE_PATH_INVALID&#39;,`${label}: explicit absolute path required`);return p;} |
| stableFile | function | 17 | no | function stableFile(p,label){ |
| scanLanes | function | 26 | no | function scanLanes(dir){ |
| names | variable | 30 | no | let names;try{names=readdirSync(p).filter(n=&gt;n.endsWith(&#39;.json&#39;)).sort()}catch(e){bad(&#39;SOURCE_UNAVAILABLE&#39;,e.code)} |
| files | const | 32 | no | const files=[]; |
| x | const | 35 | no | const x=stableFile(join(p,name),&#39;supervisor lane&#39;);let doc; |
| uniq | function | 42 | no | const uniq=xs=&gt;[...new Set(xs)]; |
| readMissionSources | function | 43 | yes | export async function readMissionSources({mission,ordersFile,taskFile,supervisorDir,readers={}}={}){ |
| work | const | 45 | no | const work=uniq(mission.steps.map(s=&gt;s?.workOrderId).filter(Boolean)),tasks=uniq(mission.steps.map(s=&gt;s?.taskId).filter(Boolean)), |
| inputs | const | 51 | no | const inputs=[work.length&amp;&amp;ordersFile,tasks.length&amp;&amp;taskFile,lanes.length&amp;&amp;supervisorDir].filter(Boolean); |
| initial | const | 53 | no | const initial={}; |
| validateDoc | const | 57 | no | const validateDoc=readers.validateDoc??(await import(&#39;./work-orders.mjs&#39;)).validateDoc; |
| view | const | 58 | no | const view=readers.view??(await import(&#39;./task-lifecycle.mjs&#39;)).view; |
| readLaneFiles | const | 59 | no | const readLaneFiles=readers.readLaneFiles??(await import(&#39;../supervisor/supervisor.mjs&#39;)).readLaneFiles; |
| orders | variable | 60 | no | let orders={schema:&#39;hq.work-order/1&#39;,orders:[]}, taskView={schema:&#39;hq.task-lifecycle-view/1&#39;,tasks:[]},laneViews=[]; |
| v | const | 63 | no | const v=validateDoc(orders);if(v?.ok!==true)bad(&#39;SOURCE_CORRUPT&#39;,`work order validation failed: ${(v?.errors??[]).join(&#39;,&#39;)}`); |
| fingerprints | const | 83 | no | const fingerprints={...(work.length&amp;&amp;{orders:initial.orders.digest}),...(tasks.length&amp;&amp;{tasks:initial.tasks.digest}), |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 7 | external |
| node:fs | import | 8 | external |
| node:path | import | 9 | external |
| ./work-orders.mjs | dynamic | 57 | [hq/lib/work-orders.mjs](./work-orders.mjs.md) |
| ./task-lifecycle.mjs | dynamic | 58 | [hq/lib/task-lifecycle.mjs](./task-lifecycle.mjs.md) |
| ../supervisor/supervisor.mjs | dynamic | 59 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/lib/mission-evaluator.mjs](./mission-evaluator.mjs.md) | ./mission-sources.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Read-only HQ mission snapshot from existing work orders, task JSONL, |
| 4 | invariant | — | — | Strict scan rejects corrupt supervisor files that readLaneFiles silently skips. |
| 5 | invariant | — | — | Stable double-read is an observation, not a transaction/lease. |

## Excerpt

```javascript
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
```

_First 80 of 91 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
