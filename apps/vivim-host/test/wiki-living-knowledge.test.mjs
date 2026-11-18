import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createProductJournal,projectAppliedControlEffects} from '../chat/product-journal.mjs';
import {projectWikiSemantics,projectWikiStructure,pageId} from '../chat/wiki-semantics.mjs';
import {buildNativeKnowledge,buildNativeRelationships} from '../chat/rust-context.mjs';
import {selectRequestWiki} from '../control/request-context.mjs';

test('committed page graph is reconstructed, source-linked and exposed to authorized request context',async t=>{
  const root=mkdtempSync(join(tmpdir(),'vivim-living-wiki-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const journal=createProductJournal({dataRoot:root});
  const append=(edit,expectedRevision)=>journal.append({kind:'wiki-structure',actor:'owner-browser',schemaVersion:1,edit,expectedRevision});
  const initial=(await journal.readPhoneWiki()).revision;
  await append({action:'create-page',page:'project'},initial);
  const committed=await append({action:'link-pages',from:'Main',to:'project'},initial+1);
  const moved=await append({action:'move-page',page:'project',position:'top'},initial+2);
  const observed=await journal.append({kind:'chat-send',actor:'human',schemaVersion:1,text:'An unverified task statement',
    intent:{outcome:'candidate',candidate:{actionId:'wiki.page.move',args:{page:'PROJECT',position:'bottom'}}}});
  const reopened=createProductJournal({dataRoot:root});
  const context=await reopened.readWikiContext();
  const graph=context.semantics;
  assert.deepEqual(context,await journal.readWikiContext());
  const relation=graph.relationships.find(x=>x.kind==='wiki-page-link');
  assert.equal(relation.from,pageId('Main'));
  assert.equal(relation.to,pageId('project'));
  assert.equal(relation.source.ref,committed.entryId);
  assert.equal(relation.source.wikiRevision,committed.wikiRevision);
  assert.equal(relation.classification,'observed-state');
  assert.ok(graph.relationships.some(x=>x.kind==='moved-page'&&x.from==='journal:'+moved.entryId));
  assert.ok(graph.relationships.some(x=>x.kind==='candidate-target'&&x.from==='journal:'+observed.entryId&&x.classification==='inferred-relationship'));
  assert.ok(!graph.nodes.some(n=>n.kind==='project'||n.kind==='task'));
  const phone=await reopened.readPhoneWiki();
  assert.equal(phone.semantics,undefined);
  assert.ok(!JSON.stringify(phone.wikiStructure).includes('"sequence"'));
  assert.ok(!JSON.stringify(phone).includes('unverified task statement'));
  const request=selectRequestWiki(phone,{actionId:'wiki.section.read',outcome:'done',
    args:{page:'project',section:'About'},result:{wikiRevision:phone.revision}});
  const related=request.pages.find(p=>p.page==='Main');
  assert.equal(related.relationshipSource.ref,committed.entryId);
  assert.equal(related.relationshipSource.wikiRevision,committed.wikiRevision);
  const receipt={schema:'vivim.control-receipt/1',planId:'ctl-0123456789abcdef',actionId:'wiki.pages.link',
    risk:'R1',status:'applied',executionPerformed:true,approvedVia:'desktop-owner-token',
    planDigest:'a'.repeat(64),at:committed.receivedAt,
    result:{entryId:committed.entryId,sequence:committed.sequence,wikiRevision:committed.wikiRevision,
      previousRevision:committed.expectedRevision,edit:committed.edit}};
  const control={recent:()=>[{state:'applied',planId:receipt.planId,actionId:receipt.actionId,risk:'R1'}],
    status:()=>({state:'applied',receipt})};
  const effects=projectAppliedControlEffects(control,context.wikiChanges,context.wikiStructure);
  assert.equal(effects.items[0].structureLink.entryId,committed.entryId);
  assert.ok(projectWikiSemantics({...context,applicationEffects:effects}).relationships.some(r=>
    r.kind==='confirmed-change'&&r.to==='journal:'+committed.entryId));
  const snapshot=await reopened.readNativeKnowledge();
  const rows=buildNativeKnowledge(snapshot,effects);
  const edges=buildNativeRelationships(snapshot,rows);
  assert.equal(edges.length,1);
  assert.equal(edges[0].sourceRef,committed.entryId);
  assert.ok(rows.some(r=>r.id===edges[0].from&&r.semanticId===pageId('Main')));
  assert.ok(rows.some(r=>r.id===edges[0].to&&r.semanticId===pageId('project')&&r.sourceRevision===moved.wikiRevision));
  assert.ok(!JSON.stringify(rows).includes('unverified task statement'));
  receipt.result.edit={...receipt.result.edit,to:'wrong'};
  assert.equal(projectAppliedControlEffects(control,context.wikiChanges,context.wikiStructure).items.length,0);
  rmSync(reopened.journalPath);
  assert.equal((await reopened.readWikiContext()).wikiStructure.links.length,0);
  assert.equal((await reopened.readWikiContext()).semantics.nodes.length,0);
});

test('active links and latest page evidence survive bounded recent-history turnover',()=>{
  const wiki={revision:33,pages:{Main:{sections:{About:''},links:['project']},project:{sections:{About:''}}}};
  const event=(i,edit)=>({kind:'wiki-structure',entryId:String(i).padStart(36,'0'),
    sequence:i,expectedRevision:i,receivedAt:'2026-11-18T00:00:00Z',edit});
  const records=[event(1,{action:'create-page',page:'project'}),event(2,{action:'link-pages',from:'Main',to:'project'})];
  for(let i=3;i<=32;i++)records.push(event(i,{action:'move-page',page:'project',position:i%2?'top':'bottom'}));
  const structure=projectWikiStructure(records,wiki);
  assert.equal(structure.items.length,24);
  assert.equal(structure.links.length,1);
  assert.equal(structure.links[0].entryId,records[1].entryId);
  assert.equal(structure.pageSources.find(p=>p.page==='project').event.entryId,records.at(-1).entryId);
  assert.equal(structure.pageSources.find(p=>p.page==='Main').event.entryId,records[1].entryId);
  const without=projectWikiStructure(records,{...wiki,pages:{Main:{sections:{About:''}},project:{sections:{About:''}}}});
  assert.equal(without.links.length,0);
  const graph=projectWikiSemantics({revision:records.length,wikiRevision:wiki.revision,wikiStructure:structure});
  assert.ok(graph.nodes.length<=256&&graph.relationships.length<=256);
  assert.ok(graph.relationships.some(r=>r.kind==='wiki-page-link'));
  assert.ok(graph.relationships.every(r=>graph.nodes.some(n=>n.id===r.from)&&graph.nodes.some(n=>n.id===r.to)));
});
