# File: packages/tierflow/tests/visual-runtime/final-wave/lane-b/studio-editing.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/final-wave/lane-b/studio-editing.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 12734 B |
| Lines | 189 |
| Hash | cd4ce629ec49 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| roots | const | 14 | no | const roots:string[]=[];const stores:UiStore[]=[];const NOW=Date.parse(&#39;2026-11-07T00:00:00Z&#39;); |
| owner | const | 15 | no | const owner:VerifiedUiPrincipal={ownerRef:&#39;owner_a&#39;,actorRef:&#39;actor_a&#39;,deviceRef:&#39;pc_1&#39;,sessionRef:&#39;session_1&#39;, |
| doc | function | 17 | no | function doc(title=&#39;Seed&#39;):UiDocument { |
| setup | function | 22 | no | function setup(path?:string) { |
| dir | const | 23 | no | const dir=path??mkdtempSync(join(tmpdir(),&#39;vivim-final-b-&#39;));if(!path)roots.push(dir); |
| store | const | 24 | no | const store=openUiStore({path:join(dir,&#39;state.db&#39;)});stores.push(store); |
| active | variable | 27 | no | let active=true,clock=NOW,sequence=0;const proofs=new Set&lt;string&gt;(); |
| verify | function | 28 | no | const verify=(p:VerifiedUiPrincipal)=&gt;active&amp;&amp;p.ownerRef===&#39;owner_a&#39;&amp;&amp;p.sessionRef===&#39;session_1&#39;&amp;&amp; |
| replay | const | 30 | no | const replay=new UiAtomicReplay({store,ownerRef:&#39;owner_a&#39;,verifyPrincipal:verify}); |
| editor | const | 31 | no | const editor=new StudioEditingAdapter({revisions:replay,verifyPrincipal:verify, consumeOwnerReview:(_p,r)=&gt;proofs.delete(r.proofRef), readHistorical:(_p,id,revision)=&gt;store.getRevision(id,revision)?.… |
| review | function | 34 | no | const review=(v:Preview,p:VerifiedUiPrincipal=owner):StudioReview=&gt;{ |
| proofRef | const | 35 | no | const proofRef=&#39;trusted_&#39;+ ++sequence;proofs.add(proofRef); |
| stage | function | 42 | no | function stage(f:ReturnType&lt;typeof setup&gt;,id=&#39;draft_a&#39;,title=&#39;Changed&#39;,p:VerifiedUiPrincipal=owner):Preview { |
| head | const | 43 | no | const head=f.editor.load(p,&#39;world_a&#39;);expect(head.ok).toBe(true);if(!head.ok)throw Error(head.code); |
| v | const | 46 | no | const v=f.editor.preview(p,id);expect(v.ok).toBe(true);if(!v.ok)throw Error(v.code); |
| f | const | 53 | no | const f=setup(),x=f.editor.load(owner,&#39;world_a&#39;);expect(x.ok).toBe(true);if(x.ok)expect(x.value.documentDigest).toBe(contentHash(doc())); |
| f | const | 56 | no | const f=setup(),v=stage(f);expect(f.store.listDrafts().length).toBe(1); |
| f | const | 60 | no | const f=setup(),v=stage(f,&#39;draft_a&#39;,&#39;Private secret&#39;); |
| f | const | 65 | no | const f=setup(),v=stage(f),x=f.editor.commit(owner,&#39;command_1&#39;,&#39;draft_a&#39;,f.review(v)); |
| f | const | 70 | no | const f=setup(),phone={...owner,deviceRef:&#39;phone_1&#39;}; |
| a | const | 71 | no | const a=stage(f,&#39;draft_pc&#39;,&#39;PC&#39;,owner),b=stage(f,&#39;draft_phone&#39;,&#39;Phone&#39;,phone); |
| rejected | const | 73 | no | const rejected=f.editor.commit(phone,&#39;cmd_phone&#39;,&#39;draft_phone&#39;,f.review(b,phone)); |
| f | const | 78 | no | const f=setup(),x=f.editor.begin(owner,&#39;world_a&#39;,&#39;draft_a&#39;,0); |
| f | const | 82 | no | const f=setup();stage(f);const x=f.editor.edit(owner,&#39;draft_a&#39;,1,[{op:&#39;world.setTitle&#39;,title:&#39;stale&#39;}]); |
| f | const | 86 | no | const f=setup(),v=stage(f),review=f.review(v); |
| x | const | 88 | no | const x=f.editor.commit(owner,&#39;cmd_8&#39;,&#39;draft_a&#39;,review);expect(x.ok).toBe(false); |
| f | const | 92 | no | const f=setup();stage(f);const p={...owner,ownerRef:&#39;other&#39;}; |
| x | const | 94 | no | const x=f.editor.preview(p,&#39;draft_a&#39;);expect(x.ok).toBe(false);if(!x.ok)expect(x.code).toBe(&#39;FORBIDDEN&#39;); |
| f | const | 97 | no | const f=setup();stage(f);const x=f.editor.preview({...owner,deviceRef:&#39;phone_1&#39;},&#39;draft_a&#39;); |
| f | const | 101 | no | const f=setup(),v=stage(f),review=f.review(v);f.revoke(); |
| x | const | 102 | no | const x=f.editor.commit(owner,&#39;cmd_11&#39;,&#39;draft_a&#39;,review); |
| f | const | 106 | no | const f=setup(),v=stage(f),review=f.review(v);f.expire(); |
| x | const | 107 | no | const x=f.editor.commit(owner,&#39;cmd_12&#39;,&#39;draft_a&#39;,review); |
| f | const | 111 | no | const f=setup(),v=stage(f),review=f.review(v); |
| x | const | 112 | no | const x=f.editor.commit(owner,&#39;cmd_13&#39;,&#39;draft_a&#39;,{...review,proofRef:&#39;forged&#39;}); |
| f | const | 116 | no | const f=setup();stage(f); |
| x | const | 117 | no | const x=f.editor.commit(owner,&#39;cmd_14&#39;,&#39;draft_a&#39;,null as unknown as StudioReview); |
| f | const | 121 | no | const f=setup(),v=stage(f);f.replay.injectOnce(&#39;afterCommitAckLoss&#39;); |
| x | const | 122 | no | const x=f.editor.commit(owner,&#39;cmd_ack&#39;,&#39;draft_a&#39;,f.review(v)); |
| readback | const | 124 | no | const readback=f.editor.observePublish(owner,&#39;cmd_ack&#39;,v); |
| f | const | 129 | no | const f=setup(),v=stage(f);f.replay.injectOnce(&#39;beforeCommit&#39;); |
| f | const | 134 | no | const f=setup(),v=stage(f,&#39;draft_a&#39;,&#39;Persisted&#39;); |
| f | const | 141 | no | const f=setup(),v=stage(f);expect(f.editor.commit(owner,&#39;cmd_a&#39;,&#39;draft_a&#39;,f.review(v)).ok).toBe(true); |
| u | const | 142 | no | const u=f.editor.previewUndo(owner,&#39;world_a&#39;,1);expect(u.ok).toBe(true);if(!u.ok)throw Error(u.code); |
| x | const | 143 | no | const x=f.editor.undo(owner,&#39;cmd_undo&#39;,&#39;world_a&#39;,1,f.review(u.value)); |
| f | const | 148 | no | const f=setup(),v=stage(f,&#39;draft_a&#39;,&#39;Saved&#39;);expect(f.editor.commit(owner,&#39;cmd_a&#39;,&#39;draft_a&#39;,f.review(v)).ok).toBe(true); |
| u | const | 149 | no | const u=f.editor.previewUndo(owner,&#39;world_a&#39;,1);if(!u.ok)throw Error(u.code); |
| redo | const | 151 | no | const redo=f.editor.previewUndo(owner,&#39;world_a&#39;,2);if(!redo.ok)throw Error(redo.code); |
| f | const | 156 | no | const f=setup(),v=stage(f,&#39;draft_a&#39;,&#39;First&#39;);expect(f.editor.commit(owner,&#39;cmd_a&#39;,&#39;draft_a&#39;,f.review(v)).ok).toBe(true); |
| undo | const | 157 | no | const undo=f.editor.previewUndo(owner,&#39;world_a&#39;,1);if(!undo.ok)throw Error(undo.code); |
| next | const | 158 | no | const next=stage(f,&#39;draft_b&#39;,&#39;Second&#39;);expect(f.editor.commit(owner,&#39;cmd_b&#39;,&#39;draft_b&#39;,f.review(next)).ok).toBe(true); |
| x | const | 159 | no | const x=f.editor.undo(owner,&#39;cmd_u&#39;,&#39;world_a&#39;,1,f.review(undo.value));expect(x.ok).toBe(false); |
| f | const | 162 | no | const f=setup();expect(f.editor.begin(owner,&#39;world_a&#39;,&#39;draft_a&#39;,1).ok).toBe(true); |
| x | const | 163 | no | const x=f.editor.edit(owner,&#39;draft_a&#39;,1,[{op:&#39;dataFlow.remove&#39;,dataFlowId:&#39;flow_a&#39;}]); |
| f | const | 167 | no | const f=setup();f.editor.begin(owner,&#39;world_a&#39;,&#39;draft_a&#39;,1); |
| x | const | 168 | no | const x=f.editor.edit(owner,&#39;draft_a&#39;,1,[{op:&#39;exec.js&#39;}] as unknown as Parameters&lt;typeof f.editor.edit&gt;[3]); |
| f | const | 172 | no | const f=setup();f.editor.begin(owner,&#39;world_a&#39;,&#39;draft_a&#39;,1); |
| x | const | 173 | no | const x=f.editor.edit(owner,&#39;draft_a&#39;,1,[{op:&#39;world.setTitle&#39;,title:&#39;&lt;script&gt;alert(1)&lt;/script&gt;&#39;}]); |
| fixture | const | 177 | no | const fixture=new UiRevisionFixtureStore(); |
| raw | const | 178 | no | const raw={schema:&#39;vivim.ui-document/1&#39;,documentId:&#39;world_a&#39;,scope:{ownerRef:&#39;owner_a&#39;,workspaceRef:&#39;workspace_a&#39;},revision:1,rootId:&#39;root&#39;,nodes:[],bindings:[],views:[]}; |
| adapter | const | 180 | no | const adapter=new StudioEditingAdapter({revisions:fixture,verifyPrincipal:()=&gt;true,consumeOwnerReview:()=&gt;false,readHistorical:()=&gt;null}); |
| x | const | 181 | no | const x=adapter.preview(owner,&#39;draft_bad&#39;);expect(x.ok).toBe(false);if(!x.ok)expect(x.code).toBe(&#39;NOT_FOUND&#39;); |
| f | const | 184 | no | const f=setup(),v=stage(f,&#39;draft_a&#39;,&#39;After ACK&#39;);f.replay.injectOnce(&#39;afterCommitAckLoss&#39;); |
| restarted | const | 186 | no | const restarted=setup(f.dir),recovery=restarted.editor.observePublish(owner,&#39;cmd_lost&#39;,v); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../../../../src/ui/store.ts | import | 6 | [packages/tierflow/src/ui/store.ts](../../../../src/ui/store.ts.md) |
| ../../../../src/ui/hash.ts | import | 7 | [packages/tierflow/src/ui/hash.ts](../../../../src/ui/hash.ts.md) |
| ../../../../src/visual-runtime/revisions/wave3-atomic-replay.ts | import | 8 | [packages/tierflow/src/visual-runtime/revisions/wave3-atomic-replay.ts](../../../../src/visual-runtime/revisions/wave3-atomic-replay.ts.md) |
| ../../../../src/visual-runtime/revisions/fixture-store.ts | import | 9 | [packages/tierflow/src/visual-runtime/revisions/fixture-store.ts](../../../../src/visual-runtime/revisions/fixture-store.ts.md) |
| ../../../../src/visual-runtime/final-wave/lane-b/studio-editing.ts | import | 10 | [packages/tierflow/src/visual-runtime/final-wave/lane-b/studio-editing.ts](../../../../src/visual-runtime/final-wave/lane-b/studio-editing.ts.md) |
| ../../../../src/visual-runtime/revisions/port.ts | import | 11 | [packages/tierflow/src/visual-runtime/revisions/port.ts](../../../../src/visual-runtime/revisions/port.ts.md) |
| ../../../../src/ui/types.ts | import | 12 | [packages/tierflow/src/ui/types.ts](../../../../src/ui/types.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 190 lines._

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)
