// L03 O05 — source-linked correction/readback safety, fixture-only.
// No live Host, account, personal corpus, grants, provider send or effect.
import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createProductJournal} from '../chat/product-journal.mjs';
import {closeNativeProductKernel} from '../control/native-product-kernel.mjs';

after(()=>closeNativeProductKernel());
const source=(text,revision)=>({
 kind:'wiki-edit',actor:'owner-browser',schemaVersion:1,
 expectedRevision:revision,
 edit:{action:'set-section',page:'Inbox',section:'About',content:text}
});
const create=async()=> {
 const dataRoot=await mkdtemp(path.join(tmpdir(),'l03-wiki-correction-'));
 const journal=createProductJournal({
  dataRoot,seedState:{chat:[]},
  seedWiki:{revision:0,pages:{Inbox:{sections:{About:'seed fixture'},links:[]}}}
 });
 return {journal,dataRoot};
};

test('correction invalidates superseded source IDs without leaking previous body',async()=>{
 const {journal,dataRoot}=await create();
 const initial='PRIVATE-SYNTHETIC-INITIAL';
 const corrected='PRIVATE-SYNTHETIC-CORRECTED';
 try{
  const first=await journal.append(source(initial,0));
  const firstEvidence=await journal.readProgramSources([first.entryId]);
  assert.equal(firstEvidence.wikiRevision,1);
  assert.equal(firstEvidence.items.length,1);
  assert.equal(firstEvidence.items[0].entryId,first.entryId);
  assert.equal(firstEvidence.items[0].contentDigest,createHash('sha256').update(initial).digest('hex'));
  assert.equal(Object.hasOwn(firstEvidence.items[0],'content'),false);

  const second=await journal.append(source(corrected,1));
  const current=await journal.readProgramSources([first.entryId,second.entryId]);
  assert.equal(current.wikiRevision,2);
  assert.equal(current.items.length,1);
  assert.equal(current.items[0].entryId,second.entryId);
  assert.equal(current.items[0].status,'current-section-revision');
  assert.equal(current.items[0].contentDigest,createHash('sha256').update(corrected).digest('hex'));
  assert.equal(JSON.stringify(current).includes('PRIVATE-SYNTHETIC'),false);

  const exact=await journal.readProgramEvidence([{page:'Inbox',section:'About'}],2);
  assert.equal(exact.schema,'vivim.wiki-program-evidence/1');
  assert.equal(exact.authority,'host-product-journal');
  assert.equal(exact.wikiRevision,2);
  assert.equal(exact.items.length,1);
  assert.equal(exact.items[0].source.entryId,second.entryId);
  assert.equal(JSON.stringify(exact).includes('PRIVATE-SYNTHETIC'),false);

  const phone=await journal.readPhoneWiki();
  assert.equal(phone.revision,2);
  assert.equal(phone.pages.Inbox.sections.About,corrected);
 } finally {await rm(dataRoot,{recursive:true,force:true});}
});

test('stale revision evidence and conflicting corrections do not create new source receipts',async()=>{
 const {journal,dataRoot}=await create();
 try{
  const first=await journal.append(source('synthetic original',0));
  const second=await journal.append(source('synthetic current',1));
  await assert.rejects(
   journal.readProgramEvidence([{page:'Inbox',section:'About'}],1),
   error=>error?.status===409||/Stale Wiki revision/.test(String(error))
  );
  await assert.rejects(journal.append(source('stale replay',1)),/Stale Wiki revision/);
  const records=await journal.readRecords();
  assert.equal(records.length,2);
  assert.deepEqual(records.map(r=>r.entryId),[first.entryId,second.entryId]);
  const live=await journal.readProgramSources([first.entryId,second.entryId]);
  assert.equal(live.items.length,1);
  assert.equal(live.items[0].entryId,second.entryId);
 }finally{await rm(dataRoot,{recursive:true,force:true});}
});
