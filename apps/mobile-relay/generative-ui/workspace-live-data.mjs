// Read-only projections over authorized Host response data. Never stored in a
// UI proposal, design context, service-worker cache, local notebook or provider prompt.
const SHA=/^[a-f0-9]{64}$/;
const UUID=/^[a-f0-9-]{36}$/;
const uint=n=>Number.isSafeInteger(n)&&n>=0;
const text=(s,n)=>typeof s==='string'?s.replace(/[\x00-\x1f\x7f-\x9f]/g,' ').replace(/\s+/g,' ').trim().slice(0,n).replace(/[\uD800-\uDBFF]$/,''):'';
const unavailable=()=>({state:'unavailable',items:[]});
const label=Object.freeze({reply_observed:'Reply observed',delivered:'Delivery acknowledged',
  uncertain:'Send uncertain',failed_before_send:'Failed before send',failed_after_send:'Possible send — review required'});
export function projectOpenTasks(wiki){
 const capture=wiki?.personalCaptures;
 if(capture?.schema!=='vivim.personal-captures/1'||capture.authority!=='committed-wiki-read-only'||
    !uint(wiki.revision)||capture.wikiRevision!==wiki.revision||!Array.isArray(capture.items)||capture.items.length>256||
    !wiki.pages||typeof wiki.pages!=='object')return unavailable();
 const seen=new Set(),rows=[];
 for(const row of capture.items){
   if(!row||!['task','note'].includes(row.kind)||typeof row.page!=='string'||seen.has(row.page)||
      !UUID.test(row.entryId??'')||!uint(row.createdRevision)||!row.createdRevision||row.createdRevision>wiki.revision||
      !Object.hasOwn(wiki.pages,row.page))return unavailable();
   seen.add(row.page);
   if(row.kind!=='task')continue;
   const sections=wiki.pages[row.page]?.sections;
   if(!/^task-[a-f0-9]{32}$/.test(row.page)||row.section!=='Task'||
      !sections||typeof sections.Task!=='string'||!['Open','Done'].includes(row.status)||sections.Status!==row.status)return unavailable();
   if(row.status==='Open')rows.push({label:text(sections.Task,80)||'Open task',detail:'Open · '+row.page+' · created rev '+row.createdRevision,
      sourceRef:row.entryId});
 }
 return {state:'source-backed',revision:wiki.revision,total:rows.length,items:rows.slice(0,16)};
}
export function projectStudioActivity(outcomes){
 if(outcomes?.schema!=='vivim.studio-outcomes/1'||outcomes.authority!=='read-only-historical'||outcomes.state!=='source-backed'||
   !uint(outcomes.revision)||!uint(outcomes.total)||!Array.isArray(outcomes.items)||outcomes.items.length>16||
   outcomes.total<outcomes.items.length)return unavailable();
 const seen=new Set(),rows=[];
 for(const row of outcomes.items){
  if(!row||typeof row.id!=='string'||!row.id||seen.has(row.id)||!Object.hasOwn(label,row.state)||
    !uint(row.sequence)||!row.sequence||row.sequence>outcomes.revision||!uint(row.sourceRevision)||
    !SHA.test(row.evidenceDigest??'')||!SHA.test(row.eventDigest??'')||
    !['studio','journal','phone'].includes(row.source)||!Number.isFinite(Date.parse(row.observedAt))||
    row.authority!=='historical-source-verified-event')return unavailable();
  if(row.source!==({reply_observed:'studio',delivered:'phone',uncertain:'journal',failed_before_send:'journal',failed_after_send:'journal'})[row.state])return unavailable();
  seen.add(row.id);rows.push({label:(text(row.provider,32)||'Provider')+' · '+label[row.state],
    detail:'Historical '+row.source+' evidence · '+row.observedAt+' · rev '+row.sourceRevision,
    sourceRef:row.eventDigest});
 }
 return {state:'source-backed',revision:outcomes.revision,total:outcomes.total,items:rows};
}
export function projectRecentNotes(wiki){
 // Reuse the same revision, authority and source-record validation as the task projection.
 if(projectOpenTasks(wiki).state!=='source-backed')return unavailable();
 const rows=[];
 for(const row of wiki.personalCaptures.items){
   if(row.kind!=='note')continue;
   const sections=wiki.pages[row.page]?.sections;
   if(!/^note-[a-f0-9]{32}$/.test(row.page)||row.section!=='Note'||typeof sections?.Note!=='string')return unavailable();
   rows.push({label:text(sections.Note,80)||'Captured note',detail:'Committed note · '+row.page+' · created rev '+row.createdRevision,sourceRef:row.entryId,createdRevision:row.createdRevision});
 }
 rows.sort((a,b)=>b.createdRevision-a.createdRevision);
 return {state:'source-backed',revision:wiki.revision,total:rows.length,items:rows.slice(0,16).map(({createdRevision,...row})=>row)};
}
export function workspaceBindingData({wiki=null,outcomes=null}={}){
 return {'personal.open-tasks':projectOpenTasks(wiki),'personal.recent-notes':projectRecentNotes(wiki),'studio.recent-outcomes':projectStudioActivity(outcomes)};
}
export function hasWorkspaceBinding(surface){
 const walk=n=>!!n&&(!!n.liveBinding||Array.isArray(n.children)&&n.children.some(walk));
 return walk(surface?.tree);
}
