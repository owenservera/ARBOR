import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {closeNativeProductKernel} from '../control/native-product-kernel.mjs';

import {createProductJournal,previewWikiCapture,projectAppliedControlEffects} from '../chat/product-journal.mjs';
import {buildNativeKnowledge} from '../chat/rust-context.mjs';

// The pure Rust kernel persists in production; test hosts explicitly close it.
after(()=>closeNativeProductKernel());
test('committed capture creates a durable page/section and matching native receipt link',async()=>{
 const dataRoot=await mkdtemp(path.join(tmpdir(),'native-capture-'));
 try{
  const journal=createProductJournal({dataRoot,seedState:{chat:[]},seedWiki:{revision:0,pages:{}}});
  const draft=previewWikiCapture(await journal.readPhoneWiki(),{capture_id:'note-0001',kind:'task',content:'Ship the revised view'});
  const entry=await journal.append({kind:'wiki-edit',actor:'owner-browser',schemaVersion:1,expectedRevision:0,edit:draft.edit});
  const receipt={schema:'vivim.control-receipt/1',planId:'ctl-0123456789abcdef',planDigest:'a'.repeat(64),actionId:'wiki.capture.save',risk:'R1',source:'mobile',status:'applied',executionPerformed:true,approvedVia:'direct-phone',at:entry.receivedAt,
   result:{page:draft.page,section:draft.section,entryId:entry.entryId,sequence:entry.sequence,previousRevision:0,wikiRevision:1,content:draft.edit.content}};
  const ctl={recent:()=>[{planId:receipt.planId,actionId:receipt.actionId,risk:'R1',state:'applied',source:'mobile'}],
    status:()=>({state:'applied',receipt})};
  let snapshot=await journal.readNativeKnowledge({nativeOnly:true});
  let effects=projectAppliedControlEffects(ctl,snapshot.context.wikiChanges,snapshot.context.wikiStructure);
  const rows=buildNativeKnowledge(snapshot,effects);
  assert.equal(rows.length,3);assert.equal(rows.find(r=>r.kind==='effect').wikiLink.entryId,entry.entryId);
  assert.equal(rows.find(r=>r.semanticId.startsWith('wiki:page:')).sourceRef,entry.entryId+'.page');
  await journal.append({kind:'wiki-edit',actor:'owner-browser',schemaVersion:1,expectedRevision:1,edit:{action:'set-section',page:draft.page,section:'Task',content:'Revised task'}});
  snapshot=await journal.readNativeKnowledge({nativeOnly:true});
  const after=buildNativeKnowledge(snapshot,projectAppliedControlEffects(ctl,snapshot.context.wikiChanges,snapshot.context.wikiStructure));
  assert.equal(after.find(r=>r.semanticId.startsWith('wiki:page:')).sourceRef,entry.entryId+'.page');
  assert.equal(after.find(r=>r.semanticId.startsWith('wiki:section:')).revision,2);
 }finally{await rm(dataRoot,{recursive:true,force:true})}
});
