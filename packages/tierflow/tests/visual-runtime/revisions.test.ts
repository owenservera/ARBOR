import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { UiRevisionFixtureStore } from '../../src/visual-runtime/revisions/fixture-store.ts';
import { commandEnvelopeHash } from '../../src/ui/hash.ts';
import type { VerifiedUiPrincipal, RevisionCommand } from '../../src/visual-runtime/revisions/port.ts';
const p: VerifiedUiPrincipal = {ownerRef:'own-a',actorRef:'alice',deviceRef:'pc-a',sessionRef:'s1',grantRef:'g1',policyRevision:'v1',scopes:['ui:read','ui:draft','ui:publish','ui:rollback']};
const other: VerifiedUiPrincipal = {...p,ownerRef:'own-b'};
const cmd = (id:string,digest:string,rev=0): RevisionCommand => ({commandId:id,documentId:'doc-a',draftId:'d1',documentDigest:digest,expectedRevision:rev,target:{actionId:'ui.publish',catalogVersion:'1'},sourceVersions:{kb:'1',policy:'v1'}});
function make(store: UiRevisionFixtureStore) {
 const d=store.createDraft(p,'d1','doc-a',{schema:'vivim.ui-document/1',title:'Alpha'});
 assert.equal(d.ok,true);if(!d.ok) throw Error('draft'); return d.value;
}
test('equal envelope duplicate returns one result, no second revision',()=>{
 const s=new UiRevisionFixtureStore();const d=make(s);const c=cmd('cmd-1',d.documentDigest);
 const first=s.publish(p,c), second=s.publish(p,c);
 assert.equal(first.ok,true); assert.equal(second.ok,true);
 if(!second.ok) throw Error('not replay'); assert.equal(second.replayed,true);
 const head=s.readCurrent(p,'doc-a');assert.equal(head.ok,true);if(head.ok) assert.equal(head.value?.revision,1);
});
test('changed actor owner device grant policy kind target expectedRevision source version all refuse replay',()=>{
 const s=new UiRevisionFixtureStore();const d=make(s);const c=cmd('cmd-2',d.documentDigest);assert.equal(s.publish(p,c).ok,true);
 const principals=[{...p,actorRef:'bob'},{...p,ownerRef:'other'},{...p,deviceRef:'phone-b'},{...p,grantRef:'g2'},{...p,policyRevision:'v2'}];
 for(const modified of principals){const result=s.publish(modified,c);assert.equal(result.ok,false);if(!result.ok) assert.equal(result.code,'IDEMPOTENCY_CONFLICT');}
 for(const modified of [{...c,expectedRevision:1},{...c,target:{actionId:'ui.rollback'}},{...c,sourceVersions:{kb:'2',policy:'v1'}},{...c,documentDigest:'sha256:changed'}]){
  const result=s.publish(p,modified);assert.equal(result.ok,false);if(!result.ok) assert.equal(result.code,'IDEMPOTENCY_CONFLICT');
 }
 const changedKind=s.rollback(p,{...c,targetRevision:1}); assert.equal(changedKind.ok,false);if(!changedKind.ok) assert.equal(changedKind.code,'IDEMPOTENCY_CONFLICT');
});
test('preview is pure; returned snapshot modifications cannot mutate store',()=>{
 const s=new UiRevisionFixtureStore();make(s);const before=JSON.stringify(s.snapshot());
 const shown=s.preview(p,'d1'); assert.equal(shown.ok,true);assert.equal(JSON.stringify(s.snapshot()),before);
 if(shown.ok)(shown.value.document as Record<string,unknown>).title='tampered';
 assert.equal(JSON.stringify(s.snapshot()),before);
});
test('foreign draft preview, missing scopes and stale CAS fail closed',()=>{
 const s=new UiRevisionFixtureStore();const d=make(s);
 assert.equal(s.preview(other,'d1').ok,false);
 assert.equal(s.publish({...p,scopes:['ui:read']},cmd('bad',d.documentDigest)).ok,false);
 assert.equal(s.publish(p,cmd('ok',d.documentDigest)).ok,true);
 const second=s.createDraft(p,'d2','doc-a',{schema:'vivim.ui-document/1',title:'Beta'});
 assert.equal(second.ok,true); if(!second.ok)throw Error('draft');
 assert.equal(s.publish(p,{...cmd('stale',second.value.documentDigest),draftId:'d2',expectedRevision:0}).ok,false);
 const h=s.readCurrent(p,'doc-a'); if(h.ok) assert.equal(h.value?.revision,1);
});
test('before-commit crash makes zero writes; post-commit ACK loss and restart reconcile one revision',()=>{
 const s=new UiRevisionFixtureStore();const d=make(s);const c=cmd('cmd-crash',d.documentDigest);
 s.injectOnce('beforeCommit');const before=s.publish(p,c);assert.equal(before.ok,false);assert.equal(s.readCurrent(p,'doc-a').ok,true);
 assert.equal(s.snapshot().commands.length,0);assert.equal(s.snapshot().documents.length,0);
 s.injectOnce('afterCommitAckLoss');const lost=s.publish(p,c);assert.equal(lost.ok,false);
 if(!lost.ok) assert.equal(lost.code,'UNCERTAIN');
 const restarted=new UiRevisionFixtureStore(s.snapshot());
 const reconciliation=restarted.getCommandOutcome(p,'publish',c);assert.equal(reconciliation.ok,true);
 const retried=restarted.publish(p,c);assert.equal(retried.ok,true);
 assert.equal(restarted.snapshot().documents[0]?.[1].history.length,1);
});
test('rollback appends immutable revision, serial CAS refuses concurrent writers',()=>{
 const s=new UiRevisionFixtureStore();const d=make(s);assert.equal(s.publish(p,cmd('first',d.documentDigest)).ok,true);
 const dr=s.createDraft(p,'d2','doc-a',{schema:'vivim.ui-document/1',title:'Beta'});
 if(!dr.ok) throw Error('draft');
 const edited=s.publish(p,{...cmd('second',dr.value.documentDigest,1),draftId:'d2'});assert.equal(edited.ok,true);
 const rolled=s.rollback(p,{commandId:'rollback',documentId:'doc-a',expectedRevision:2,targetRevision:1});assert.equal(rolled.ok,true);
 if(rolled.ok){assert.equal(rolled.value.revision,3);assert.equal((rolled.value.document as {title:string}).title,'Alpha');}
 const stale=s.rollback(p,{commandId:'stale-rollback',documentId:'doc-a',expectedRevision:2,targetRevision:1});assert.equal(stale.ok,false);
});
test('canonical envelope is order stable and rejects functions, cycles, NaN and oversize',()=>{
 assert.equal(commandEnvelopeHash({b:2,a:1},p),commandEnvelopeHash({a:1,b:2},p));
 assert.notEqual(commandEnvelopeHash({a:1,actorRef:'a'},p),commandEnvelopeHash({a:1,actorRef:'b'},p));
 assert.throws(()=>commandEnvelopeHash({a:()=>1},p));
 assert.throws(()=>commandEnvelopeHash({a:NaN},p));
 const cycle: Record<string,unknown>={};cycle.x=cycle;assert.throws(()=>commandEnvelopeHash(cycle,p));
 assert.throws(()=>commandEnvelopeHash({s:'x'.repeat(70000)},p));
});