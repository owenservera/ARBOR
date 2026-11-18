import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createProductJournal,previewWikiCapture} from '../chat/product-journal.mjs';
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
  assert.equal(after.autoWiki.items[0].entryId,entry.entryId);
  const native=await journal.readNativeKnowledge({nativeOnly:true});
  assert.equal(native.changes.items[0].content,input.content);
  await assert.rejects(journal.append(payload),/Stale Wiki revision/);
  assert.throws(()=>previewWikiCapture(after,{...input,content:'Overwrite'}),/Capture already exists/);
  assert.equal((await journal.readRecords()).length,1);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('reject malformed ids, blank or oversized text before a plan is saved',()=>{
 const wiki={revision:0,pages:{}};
 for(const bad of [{...input,capture_id:'../../x'},{...input,kind:'unknown'},{...input,content:'   '},{...input,content:'x'.repeat(1201)}])
   assert.throws(()=>previewWikiCapture(wiki,bad));
});
