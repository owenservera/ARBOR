import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createProductJournal,previewWikiStructure} from '../chat/product-journal.mjs';

test('structural Wiki records share revision CAS and survive reopening without altering section provenance',async t=>{
  const dataRoot=mkdtempSync(path.join(os.tmpdir(),'vivim-wiki-structure-'));
  t.after(()=>rmSync(dataRoot,{recursive:true,force:true}));
  const journal=createProductJournal({dataRoot});
  const start=await journal.readPhoneWiki();
  const append=(edit,expectedRevision)=>journal.append({kind:'wiki-structure',actor:'owner-browser',schemaVersion:1,edit,expectedRevision});
  await journal.append({kind:'wiki-edit',actor:'owner-browser',schemaVersion:1,expectedRevision:start.revision,
    edit:{action:'set-section',page:'Main',section:'About',content:'Preserve this content'}});
  await append({action:'create-page',page:'notes'},start.revision+1);
  await assert.rejects(append({action:'create-page',page:'NOTES'},start.revision+2));
  await assert.rejects(append({action:'create-page',page:'constructor'},start.revision+2));
  await assert.rejects(append({action:'link-pages',from:'Main',to:'notes'},start.revision+1),{status:409});
  await assert.rejects(append({action:'link-pages',from:'Main',to:'missing'},start.revision+2));
  await append({action:'link-pages',from:'Main',to:'notes'},start.revision+2);
  await assert.rejects(append({action:'link-pages',from:'Main',to:'notes'},start.revision+3));
  const snapshot=await journal.readPhoneWiki();
  const move=previewWikiStructure(snapshot,{action:'move-page',page:'NOTES',position:'top'});
  assert.equal(move.edit.page,'notes');
  assert.equal(move.expectedRevision,snapshot.revision);
  await append(move.edit,move.expectedRevision);
  const reopened=createProductJournal({dataRoot});
  const wiki=await reopened.readPhoneWiki();
  assert.deepEqual(Object.keys(wiki.pages),['notes','Main']);
  assert.equal(wiki.pages.Main.sections.About,'Preserve this content');
  assert.deepEqual(wiki.pages.Main.links,['notes']);
  assert.deepEqual(wiki.pages.notes.sections,{About:''});
  assert.equal(wiki.revision,start.revision+4);
  const native=await reopened.readNativeKnowledge();
  assert.equal(native.changes.items.length,1);
  assert.equal(native.changes.items[0].content,'Preserve this content');
  assert.equal((await reopened.readRecords()).length,4);
});
