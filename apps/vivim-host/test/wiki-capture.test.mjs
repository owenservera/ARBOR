import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createProductJournal,previewWikiCapture,projectPersonalCaptures} from '../chat/product-journal.mjs';
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
