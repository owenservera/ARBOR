// Read-only projections over authorized Host response data. Never stored in a
// UI proposal, design context, service-worker cache, local notebook or provider prompt.
const SHA=/^[a-f0-9]{64}$/;
const UUID=/^[a-f0-9-]{36}$/;
const uint=n=>Number.isSafeInteger(n)&&n>=0;
const text=(s,n)=>typeof s==='string'?s.replace(/[\x00-\x1f\x7f-\x9f]/g,' ').replace(/\s+/g,' ').trim().slice(0,n).replace(/[\uD800-\uDBFF]$/,''):'';
const unavailable=()=>({state:'unavailable',items:[]});
const label=Object.freeze({reply_observed:'Reply observed',delivered:'Delivery acknowledged',
  uncertain:'Send uncertain',failed_before_send:'Failed before send',failed_after_send:'Possible send — review required'});
// The same checked capture projection feeds Wiki and all workspace collections.
export function readPersonalCaptures(wiki){
 const capture=wiki?.personalCaptures;
 if(capture?.schema!=='vivim.personal-captures/1'||capture.authority!=='committed-wiki-read-only'||
    !uint(wiki.revision)||capture.wikiRevision!==wiki.revision||!Array.isArray(capture.items)||capture.items.length>256||
    !wiki.pages||typeof wiki.pages!=='object')return null;
 const seen=new Set(),entries=new Set(),counts={notes:0,openTasks:0,doneTasks:0,unknownTasks:0};
 for(const row of capture.items){
   if(!row||!['task','note'].includes(row.kind)||typeof row.page!=='string'||seen.has(row.page)||
      !UUID.test(row.entryId??'')||entries.has(row.entryId)||!uint(row.createdRevision)||!row.createdRevision||row.createdRevision>wiki.revision||
      !Object.hasOwn(wiki.pages,row.page))return null;
   seen.add(row.page);entries.add(row.entryId);
   const sections=wiki.pages[row.page]?.sections;
   if(row.kind==='note'){
     if(!/^note-[a-f0-9]{32}$/.test(row.page)||row.section!=='Note'||typeof sections?.Note!=='string')return null;
     counts.notes++;continue;
   }
   const status=['Open','Done'].includes(sections?.Status)?sections.Status:'Unknown';
   if(!/^task-[a-f0-9]{32}$/.test(row.page)||row.section!=='Task'||typeof sections?.Task!=='string'||row.status!==status)return null;
   counts[status==='Open'?'openTasks':status==='Done'?'doneTasks':'unknownTasks']++;
 }
 // Legacy complete projections remain compatible. New partial views must account for
 // every omitted row with explicit Host counts; never infer zero from an incomplete window.
 const total=capture.total??capture.items.length,omitted=capture.omitted??0;
 if(!uint(total)||!uint(omitted)||total!==capture.items.length+omitted)return null;
 let full=counts;
 if(capture.counts!==undefined){
   const claimed=capture.counts,keys=Object.keys(counts);
   if(!claimed||typeof claimed!=='object'||Object.keys(claimed).length!==keys.length||
      keys.some(k=>!uint(claimed[k])||claimed[k]<counts[k])||
      keys.reduce((sum,k)=>sum+claimed[k],0)!==total)return null;
   full=Object.fromEntries(keys.map(k=>[k,claimed[k]]));
 }else if(omitted!==0)return null;
 return {items:[...capture.items].sort((a,b)=>b.createdRevision-a.createdRevision),counts:full,total,omitted};
}
function personalRows(wiki,kind,status=null){
 const source=readPersonalCaptures(wiki);if(!source)return unavailable();
 const rows=source.items.filter(row=>row.kind===kind&&(status===null||row.status===status)).map(row=>({
   label:text(wiki.pages[row.page].sections[row.section],80)||(kind==='note'?'Captured note':status+' task'),
   detail:(kind==='note'?'Committed note':status)+' · '+row.page+' · created rev '+row.createdRevision,sourceRef:row.entryId}));
 const total=source.counts[kind==='note'?'notes':status==='Open'?'openTasks':'doneTasks'];
 return {state:'source-backed',revision:wiki.revision,total,items:rows.slice(0,16)};
}
export const projectOpenTasks=wiki=>personalRows(wiki,'task','Open');
export const projectCompletedTasks=wiki=>personalRows(wiki,'task','Done');
export const projectRecentNotes=wiki=>personalRows(wiki,'note');
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
export function workspaceBindingData({wiki=null,outcomes=null}={}){
 return {'personal.open-tasks':projectOpenTasks(wiki),'personal.completed-tasks':projectCompletedTasks(wiki),'personal.recent-notes':projectRecentNotes(wiki),'studio.recent-outcomes':projectStudioActivity(outcomes)};
}
export function hasWorkspaceBinding(surface){
 const walk=n=>!!n&&(!!n.liveBinding||Array.isArray(n.children)&&n.children.some(walk));
 return walk(surface?.tree);
}
