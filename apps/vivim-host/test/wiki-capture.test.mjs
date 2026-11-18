import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createProductJournal,previewWikiCapture,projectPersonalCaptures,projectProgramSources} from '../chat/product-journal.mjs';
const input={capture_id:'capture-0001',kind:'task',content:'Call the supplier\nConfirm order'};
test('reviewed capture is one durable Wiki append, native source record, and cannot overwrite existing page',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'vivim-capture-'));
 try{
  const journal=createProductJournal({dataRoot:root,seedState:{chat:[]},seedWiki:{revision:0,pages:{}}});
  const before=await journal.readPhoneWiki(),draft=previewWikiCapture(before,input);
  assert.equal(before.revision,0);assert.equal(draft.edit.section,'Task');assert.match(draft.page,/^task-[a-f0-9]{32}$/);
  assert.equal((await journal.readPhoneWiki()).revision,0);
  const payload={kind:'wiki-edit',actor:'owner-browser',schemaVersion:1,expectedRevision:0,edit:draft.edit};
  const entry=await journal.append(payload),after=await journal.readPhoneWiki();
  assert.equal(after.revision,1);assert.equal(after.pages[draft.page].sections.Task,input.content);
  assert.equal(after.pages[draft.page].sections.Status,'Open');
  assert.equal(after.personalCaptures.items[0].status,'Open');
  assert.equal(after.autoWiki.items[0].entryId,entry.entryId);
  const native=await journal.readNativeKnowledge({nativeOnly:true});
  assert.equal(native.changes.items[0].content,input.content);
  await assert.rejects(journal.append(payload),/Stale Wiki revision/);
  assert.throws(()=>previewWikiCapture(after,{...input,content:'Overwrite'}),/Capture already exists/);
  assert.equal((await journal.readRecords()).length,1);
  const statusEdit={kind:'wiki-edit',actor:'owner-browser',schemaVersion:1,expectedRevision:1,edit:{action:'set-section',page:draft.page,section:'Status',content:'Done'}};
  await assert.rejects(journal.append({...statusEdit,edit:{...statusEdit.edit,content:'Unknown'}}),/Task status/);
  await journal.append(statusEdit);
  const done=await journal.readPhoneWiki();assert.equal(done.personalCaptures.items[0].status,'Done');assert.equal(done.personalCaptures.items[0].entryId,entry.entryId);
  await journal.append({...statusEdit,expectedRevision:2,edit:{...statusEdit.edit,content:'Open'}});
  assert.equal((await journal.readPhoneWiki()).personalCaptures.items[0].status,'Open');
 }finally{await rm(root,{recursive:true,force:true});}
});
test('reject malformed ids, blank or oversized text before a plan is saved',()=>{
 const wiki={revision:0,pages:{}};
 for(const bad of [{...input,capture_id:'../../x'},{...input,kind:'unknown'},{...input,content:'   '},{...input,content:'x'.repeat(1201)}])
   assert.throws(()=>previewWikiCapture(wiki,bad));
});

test('large capture histories retain exact totals and prioritize open tasks and notes without growing the client window',()=>{
 const records=[],pages={};for(let i=1;i<=400;i++){
  const kind=i<50?'task':i<100?'note':'task',page=kind+'-'+i.toString(16).padStart(32,'0'),section=kind==='note'?'Note':'Task';
  pages[page]={sections:{[section]:'Recorded '+i,...(kind==='task'?{Status:i<50?'Open':'Done'}:{})}};
  records.push({kind:'wiki-edit',entryId:'00000000-0000-0000-0000-'+String(i).padStart(12,'0'),expectedRevision:i-1,edit:{action:'capture-'+kind,page,section}});
 }
 const result=projectPersonalCaptures(records,{revision:400,pages});assert.equal(result.total,400);assert.equal(result.items.length,256);assert.equal(result.omitted,144);
 assert.deepEqual(result.counts,{notes:50,openTasks:49,doneTasks:301,unknownTasks:0});
 assert.equal(result.items.filter(r=>r.status==='Open').length,49);assert.equal(result.items.filter(r=>r.kind==='note').length,50);
});

test('exact program inputs resolve older current sections beyond the recent window, but refuse superseded content',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'vivim-program-source-'));
 try{
  const journal=createProductJournal({dataRoot:root,seedState:{chat:[]},seedWiki:{revision:0,pages:{}}});
  let first=null,page=null;
  for(let i=0;i<26;i++){
   const draft=previewWikiCapture(await journal.readPhoneWiki(),{capture_id:'program-source-'+i,kind:'note',content:'Note number '+i});
   const entry=await journal.append({kind:'wiki-edit',actor:'owner-browser',schemaVersion:1,expectedRevision:i,edit:draft.edit});
   if(i===0){first=entry;page=draft.page;}
  }
  const recent=await journal.readNativeKnowledge({nativeOnly:true});assert.equal(recent.changes.items.some(r=>r.entryId===first.entryId),false);
  const exact=await journal.readProgramSources([first.entryId]);assert.equal(exact.wikiRevision,26);assert.equal(exact.items.length,1);assert.equal(exact.items[0].wikiRevision,1);assert.equal(Object.hasOwn(exact.items[0],'content'),false);
  await journal.append({kind:'wiki-edit',actor:'owner-browser',schemaVersion:1,expectedRevision:26,edit:{action:'set-section',page,section:'Note',content:'Updated'}});
  assert.deepEqual((await journal.readProgramSources([first.entryId])).items,[]);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('program evidence distinguishes committed section identities from seed content without exporting raw data',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'vivim-program-evidence-'));
 try{const journal=createProductJournal({dataRoot:root,seedState:{chat:[]},seedWiki:{revision:0,pages:{main:{sections:{about:'Seed'}}}}});
 const targets=[{page:'main',section:'about'}];assert.equal((await journal.readProgramEvidence(targets,0)).items[0].source,null);
 const entry=await journal.append({kind:'wiki-edit',actor:'owner-browser',schemaVersion:1,expectedRevision:0,edit:{action:'set-section',page:'main',section:'about',content:'Committed'}});
 const view=await journal.readProgramEvidence(targets,1);assert.equal(view.items[0].source.entryId,entry.entryId);assert.equal(Object.hasOwn(view.items[0].source,'content'),false);
 await assert.rejects(journal.readProgramEvidence(targets,0),/Stale Wiki revision/);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('Wiki sequence preflights every ordinary record before writing any prefix',async()=>{
 const {previewWikiPayload}=await import('../chat/product-journal.mjs');const {createHash}=await import('node:crypto');
 const root=await mkdtemp(path.join(tmpdir(),'vivim-sequence-'));
 try{const journal=createProductJournal({dataRoot:root,seedState:{chat:[]},seedWiki:{revision:0,pages:{}}});
 const a={kind:'wiki-structure',actor:'owner-browser',schemaVersion:1,expectedRevision:0,edit:{action:'create-page',page:'research'}},b={kind:'wiki-edit',actor:'owner-browser',schemaVersion:1,expectedRevision:1,edit:{action:'set-section',page:'research',section:'About',content:'Notes'}};
 const before=await journal.readPhoneWiki(),projected=previewWikiPayload(previewWikiPayload(before,a),b),hash=createHash('sha256').update(JSON.stringify(projected.pages)).digest('hex');
 await assert.rejects(journal.appendWikiSequence([a,{...b,expectedRevision:7}],hash),/Stale Wiki revision/);assert.equal((await journal.readRecords()).length,0);
 await assert.rejects(journal.appendWikiSequence([a,b],'0'.repeat(64)),/projection mismatch/);assert.equal((await journal.readRecords()).length,0);
 const out=await journal.appendWikiSequence([a,b],hash);assert.equal(out.entries.length,2);assert.equal(out.wikiRevision,2);assert.equal((await journal.readPhoneWiki()).pages.research.sections.About,'Notes');
 }finally{await rm(root,{recursive:true,force:true});}
});

test('sequence correlation is stored-only metadata and exposes exact observed records without retry authority',async()=>{
 const {previewWikiPayload}=await import('../chat/product-journal.mjs');const {createHash}=await import('node:crypto');
 const root=await mkdtemp(path.join(tmpdir(),'vivim-sequence-proof-'));
 try{const journal=createProductJournal({dataRoot:root,seedState:{chat:[]},seedWiki:{revision:0,pages:{}}});
 const a={kind:'wiki-structure',actor:'owner-browser',schemaVersion:1,expectedRevision:0,edit:{action:'create-page',page:'research'}},b={kind:'wiki-edit',actor:'owner-browser',schemaVersion:1,expectedRevision:1,edit:{action:'set-section',page:'research',section:'About',content:'Notes'}};
 const binding={planId:'ctl-0123456789abcdef',planDigest:'a'.repeat(64)},before=await journal.readPhoneWiki(),projected=previewWikiPayload(previewWikiPayload(before,a),b),digest=createHash('sha256').update(JSON.stringify(projected.pages)).digest('hex');
 await assert.rejects(journal.append({...a,sequenceBinding:{...binding,step:1,total:2}}),/Invalid journal envelope/);
 await journal.appendWikiSequence([a,b],digest,binding);const observed=await journal.readWikiSequenceEvidence(binding.planId,binding.planDigest,[a,b]);assert.equal(observed.state,'all-records-observed');assert.equal(observed.observedSteps,2);assert.equal(observed.retryAuthorized,false);
 const phone=await journal.readPhoneWiki();assert.equal(JSON.stringify(phone).includes(binding.planId),false);assert.equal(JSON.stringify(phone).includes(binding.planDigest),false);
 await assert.rejects(journal.readWikiSequenceEvidence(binding.planId,'b'.repeat(64),[a,b]),/Sequence evidence mismatch/);
 await assert.rejects(journal.appendWikiSequence([a,b],digest,binding),/already has committed records/);
 }finally{await rm(root,{recursive:true,force:true});}
});
