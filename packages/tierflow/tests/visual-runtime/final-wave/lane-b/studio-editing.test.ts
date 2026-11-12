/** Lane B real UiAtomicReplay + existing UiStore/WAL; external owner proof is a synthetic TEST broker. */
import {afterEach,expect,test} from 'bun:test';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openUiStore,type UiStore} from '../../../../src/ui/store.ts';
import {contentHash} from '../../../../src/ui/hash.ts';
import {UiAtomicReplay} from '../../../../src/visual-runtime/revisions/wave3-atomic-replay.ts';
import {UiRevisionFixtureStore} from '../../../../src/visual-runtime/revisions/fixture-store.ts';
import {StudioEditingAdapter,type Preview,type StudioReview} from '../../../../src/visual-runtime/final-wave/lane-b/studio-editing.ts';
import type {VerifiedUiPrincipal} from '../../../../src/visual-runtime/revisions/port.ts';
import type {UiDocument} from '../../../../src/ui/types.ts';

const roots:string[]=[];const stores:UiStore[]=[];const NOW=Date.parse('2026-11-07T00:00:00Z');
const owner:VerifiedUiPrincipal={ownerRef:'owner_a',actorRef:'actor_a',deviceRef:'pc_1',sessionRef:'session_1',
  grantRef:'grant_1',policyRevision:'policy_1',scopes:['ui:read','ui:draft','ui:publish','ui:rollback']};
function doc(title='Seed'):UiDocument {
 return {schemaVersion:1,world:{id:'world_a',kind:'custom',title,accent:'#f2b134',origin:{x:0,y:0,z:0},unitsPerMeter:1},
 objects:[{id:'card_a',layer:'content',kind:'static',shape:'box',title:'Blockers',
 transform:{position:{x:0,y:0,z:0},rotation:{x:0,y:0,z:0},scale:{x:1,y:1,z:1}}}],relationships:[],dataFlows:[]};
}
function setup(path?:string) {
 const dir=path??mkdtempSync(join(tmpdir(),'vivim-final-b-'));if(!path)roots.push(dir);
 const store=openUiStore({path:join(dir,'state.db')});stores.push(store);
 if(!path){const initial=doc();store.publish({worldId:'world_a',document:initial,contentHash:contentHash(initial),
   expectedRevision:0,actorId:'seed_owner'});}
 let active=true,clock=NOW,sequence=0;const proofs=new Set<string>();
 const verify=(p:VerifiedUiPrincipal)=>active&&p.ownerRef==='owner_a'&&p.sessionRef==='session_1'&&
   p.grantRef==='grant_1'&&p.policyRevision==='policy_1';
 const replay=new UiAtomicReplay({store,ownerRef:'owner_a',verifyPrincipal:verify});
 const editor=new StudioEditingAdapter({revisions:replay,verifyPrincipal:verify,
   consumeOwnerReview:(_p,r)=>proofs.delete(r.proofRef),
   readHistorical:(_p,id,revision)=>store.getRevision(id,revision)?.document??null,nowMs:()=>clock});
 const review=(v:Preview,p:VerifiedUiPrincipal=owner):StudioReview=>{
   const proofRef='trusted_'+ ++sequence;proofs.add(proofRef);
   return {schema:'vivim.studio-ui-review/1',decision:'approved',ownerRef:p.ownerRef,actorRef:p.actorRef,
     deviceRef:p.deviceRef,sessionRef:p.sessionRef,worldRef:v.worldRef,previewDigest:v.previewDigest,
     baseRevision:v.baseRevision,policyRevision:p.policyRevision,expiresAtMs:clock+60000,proofRef};
 };
 return {dir,store,replay,editor,review,revoke:()=>{active=false;},expire:()=>{clock+=120000;}};
}
function stage(f:ReturnType<typeof setup>,id='draft_a',title='Changed',p:VerifiedUiPrincipal=owner):Preview {
 const head=f.editor.load(p,'world_a');expect(head.ok).toBe(true);if(!head.ok)throw Error(head.code);
 expect(f.editor.begin(p,'world_a',id,head.value.revision).ok).toBe(true);
 expect(f.editor.edit(p,id,1,[{op:'world.setTitle',title}]).ok).toBe(true);
 const v=f.editor.preview(p,id);expect(v.ok).toBe(true);if(!v.ok)throw Error(v.code);
 return v.value;
}
afterEach(()=>{for(const store of stores.splice(0))store.close();
 for(const dir of roots.splice(0))rmSync(dir,{recursive:true,force:true});});

test('B01 authoritative World loaded from actual UiStore',()=>{
 const f=setup(),x=f.editor.load(owner,'world_a');expect(x.ok).toBe(true);if(x.ok)expect(x.value.documentDigest).toBe(contentHash(doc()));
});
test('B02 draft is retained by existing store, no publication',()=>{
 const f=setup(),v=stage(f);expect(f.store.listDrafts().length).toBe(1);
 expect(f.store.currentRevision('world_a')?.revision).toBe(1);expect(v.effectPerformed).toBe(false);
});
test('B03 diff hashes are redacted and 2D lossless bridge is not invented',()=>{
 const f=setup(),v=stage(f,'draft_a','Private secret');
 expect(JSON.stringify(v.changes)).not.toContain('Private secret');
 expect(v.changes.length).toBeGreaterThan(0);expect(v.visual2d).toBe('SCHEMA_BRIDGE_NOT_READY');
});
test('B04 reviewed CAS appends exactly one durable UI-only revision',()=>{
 const f=setup(),v=stage(f),x=f.editor.commit(owner,'command_1','draft_a',f.review(v));
 expect(x.ok).toBe(true);if(x.ok){expect(x.value.revision).toBe(2);expect(x.value.hostEffectReceipt).toBeNull();}
 expect(f.store.listRevisions('world_a',20).length).toBe(2);
});
test('B05 two devices editing same head: losing CAS cannot overwrite',()=>{
 const f=setup(),phone={...owner,deviceRef:'phone_1'};
 const a=stage(f,'draft_pc','PC',owner),b=stage(f,'draft_phone','Phone',phone);
 expect(f.editor.commit(owner,'cmd_pc','draft_pc',f.review(a)).ok).toBe(true);
 const rejected=f.editor.commit(phone,'cmd_phone','draft_phone',f.review(b,phone));
 expect(rejected.ok).toBe(false);if(!rejected.ok)expect(rejected.code).toBe('REVISION_CONFLICT');
 expect(f.store.currentRevision('world_a')?.document.world.title).toBe('PC');
});
test('B06 stale base revision rejected',()=>{
 const f=setup(),x=f.editor.begin(owner,'world_a','draft_a',0);
 expect(x.ok).toBe(false);if(!x.ok)expect(x.code).toBe('REVISION_CONFLICT');
});
test('B07 stale draft revision rejected',()=>{
 const f=setup();stage(f);const x=f.editor.edit(owner,'draft_a',1,[{op:'world.setTitle',title:'stale'}]);
 expect(x.ok).toBe(false);if(!x.ok)expect(x.code).toBe('REVISION_CONFLICT');
});
test('B08 changing draft after preview invalidates review',()=>{
 const f=setup(),v=stage(f),review=f.review(v);
 expect(f.editor.edit(owner,'draft_a',2,[{op:'world.setTitle',title:'new'}]).ok).toBe(true);
 const x=f.editor.commit(owner,'cmd_8','draft_a',review);expect(x.ok).toBe(false);
 if(!x.ok)expect(x.code).toBe('REVIEW_REQUIRED');
});
test('B09 foreign owner denied without draft disclosure',()=>{
 const f=setup();stage(f);const p={...owner,ownerRef:'other'};
 expect(f.editor.load(p,'world_a').ok).toBe(false);
 const x=f.editor.preview(p,'draft_a');expect(x.ok).toBe(false);if(!x.ok)expect(x.code).toBe('FORBIDDEN');
});
test('B10 phone cannot steal desktop-owned draft',()=>{
 const f=setup();stage(f);const x=f.editor.preview({...owner,deviceRef:'phone_1'},'draft_a');
 expect(x.ok).toBe(false);if(!x.ok)expect(x.code).toBe('NOT_FOUND');
});
test('B11 revoked broker grant denies commit',()=>{
 const f=setup(),v=stage(f),review=f.review(v);f.revoke();
 const x=f.editor.commit(owner,'cmd_11','draft_a',review);
 expect(x.ok).toBe(false);expect(f.store.currentRevision('world_a')?.revision).toBe(1);
});
test('B12 expired owner proof denies commit',()=>{
 const f=setup(),v=stage(f),review=f.review(v);f.expire();
 const x=f.editor.commit(owner,'cmd_12','draft_a',review);
 expect(x.ok).toBe(false);if(!x.ok)expect(x.code).toBe('REVIEW_EXPIRED');
});
test('B13 forged proof rejected by trusted broker',()=>{
 const f=setup(),v=stage(f),review=f.review(v);
 const x=f.editor.commit(owner,'cmd_13','draft_a',{...review,proofRef:'forged'});
 expect(x.ok).toBe(false);if(!x.ok)expect(x.code).toBe('REVIEW_DENIED');
});
test('B14 no owner proof means no publish',()=>{
 const f=setup();stage(f);
 const x=f.editor.commit(owner,'cmd_14','draft_a',null as unknown as StudioReview);
 expect(x.ok).toBe(false);if(!x.ok)expect(x.code).toBe('REVIEW_REQUIRED');
});
test('B15 lost ACK observed through durable journal, no resubmit',()=>{
 const f=setup(),v=stage(f);f.replay.injectOnce('afterCommitAckLoss');
 const x=f.editor.commit(owner,'cmd_ack','draft_a',f.review(v));
 expect(x.ok).toBe(false);if(!x.ok)expect(x.code).toBe('UNCERTAIN');
 const readback=f.editor.observePublish(owner,'cmd_ack',v);
 expect(readback.ok).toBe(true);if(readback.ok)expect(readback.value.replayed).toBe(true);
 expect(f.store.listRevisions('world_a',20).length).toBe(2);
});
test('B16 pre-commit crash has no phantom revision or journal',()=>{
 const f=setup(),v=stage(f);f.replay.injectOnce('beforeCommit');
 expect(f.editor.commit(owner,'cmd_crash','draft_a',f.review(v)).ok).toBe(false);
 expect(f.store.currentRevision('world_a')?.revision).toBe(1);expect(f.store.getCommand('cmd_crash')).toBeNull();
});
test('B17 restart reloads persisted revision from existing SQLite/WAL',()=>{
 const f=setup(),v=stage(f,'draft_a','Persisted');
 expect(f.editor.commit(owner,'cmd_a','draft_a',f.review(v)).ok).toBe(true);
 f.store.close();const restarted=setup(f.dir);
 expect(restarted.editor.load(owner,'world_a').ok).toBe(true);
 expect(restarted.store.currentRevision('world_a')?.document.world.title).toBe('Persisted');
});
test('B18 undo appends revision; does not claim reversal of Host effects',()=>{
 const f=setup(),v=stage(f);expect(f.editor.commit(owner,'cmd_a','draft_a',f.review(v)).ok).toBe(true);
 const u=f.editor.previewUndo(owner,'world_a',1);expect(u.ok).toBe(true);if(!u.ok)throw Error(u.code);
 const x=f.editor.undo(owner,'cmd_undo','world_a',1,f.review(u.value));
 expect(x.ok).toBe(true);if(x.ok){expect(x.value.revision).toBe(3);expect(x.value.hostEffectReceipt).toBeNull();}
 expect(f.store.currentRevision('world_a')?.document.world.title).toBe('Seed');
});
test('B19 reviewed revert-of-revert yields redo without new semantic registry',()=>{
 const f=setup(),v=stage(f,'draft_a','Saved');expect(f.editor.commit(owner,'cmd_a','draft_a',f.review(v)).ok).toBe(true);
 const u=f.editor.previewUndo(owner,'world_a',1);if(!u.ok)throw Error(u.code);
 expect(f.editor.undo(owner,'cmd_undo','world_a',1,f.review(u.value)).ok).toBe(true);
 const redo=f.editor.previewUndo(owner,'world_a',2);if(!redo.ok)throw Error(redo.code);
 expect(f.editor.undo(owner,'cmd_redo','world_a',2,f.review(redo.value)).ok).toBe(true);
 expect(f.store.currentRevision('world_a')?.revision).toBe(4);
});
test('B20 stale undo review rejected after another device commits',()=>{
 const f=setup(),v=stage(f,'draft_a','First');expect(f.editor.commit(owner,'cmd_a','draft_a',f.review(v)).ok).toBe(true);
 const undo=f.editor.previewUndo(owner,'world_a',1);if(!undo.ok)throw Error(undo.code);
 const next=stage(f,'draft_b','Second');expect(f.editor.commit(owner,'cmd_b','draft_b',f.review(next)).ok).toBe(true);
 const x=f.editor.undo(owner,'cmd_u','world_a',1,f.review(undo.value));expect(x.ok).toBe(false);
});
test('B21 unreviewed state dataflow edit denied',()=>{
 const f=setup();expect(f.editor.begin(owner,'world_a','draft_a',1).ok).toBe(true);
 const x=f.editor.edit(owner,'draft_a',1,[{op:'dataFlow.remove',dataFlowId:'flow_a'}]);
 expect(x.ok).toBe(false);if(!x.ok)expect(x.code).toBe('INVALID_OPERATION');
});
test('B22 unknown command cannot become new executor',()=>{
 const f=setup();f.editor.begin(owner,'world_a','draft_a',1);
 const x=f.editor.edit(owner,'draft_a',1,[{op:'exec.js'}] as unknown as Parameters<typeof f.editor.edit>[3]);
 expect(x.ok).toBe(false);expect(f.store.currentRevision('world_a')?.revision).toBe(1);
});
test('B23 HTML/script injection rejected before draft mutation',()=>{
 const f=setup();f.editor.begin(owner,'world_a','draft_a',1);
 const x=f.editor.edit(owner,'draft_a',1,[{op:'world.setTitle',title:'<script>alert(1)</script>'}]);
 expect(x.ok).toBe(false);if(!x.ok)expect(x.code).toBe('INVALID_OPERATION');
});
test('B24 2D document cannot be silently treated as existing World schema',()=>{
 const fixture=new UiRevisionFixtureStore();
 const raw={schema:'vivim.ui-document/1',documentId:'world_a',scope:{ownerRef:'owner_a',workspaceRef:'workspace_a'},revision:1,rootId:'root',nodes:[],bindings:[],views:[]};
 expect(fixture.createDraft(owner,'draft_bad','world_a',raw).ok).toBe(true);
 const adapter=new StudioEditingAdapter({revisions:fixture,verifyPrincipal:()=>true,consumeOwnerReview:()=>false,readHistorical:()=>null});
 const x=adapter.preview(owner,'draft_bad');expect(x.ok).toBe(false);if(!x.ok)expect(x.code).toBe('NOT_FOUND');
});
test('B25 durable ACK recovery across SQLite close and reopen',()=>{
 const f=setup(),v=stage(f,'draft_a','After ACK');f.replay.injectOnce('afterCommitAckLoss');
 f.editor.commit(owner,'cmd_lost','draft_a',f.review(v));f.store.close();
 const restarted=setup(f.dir),recovery=restarted.editor.observePublish(owner,'cmd_lost',v);
 expect(recovery.ok).toBe(true);if(recovery.ok)expect(recovery.value.replayed).toBe(true);
 expect(restarted.store.currentRevision('world_a')?.revision).toBe(2);
});
