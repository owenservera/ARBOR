# File: packages/tierflow/tests/visual-runtime/final-wave/lane-f/existing-clients.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/final-wave/lane-f/existing-clients.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 10234 B |
| Lines | 161 |
| Hash | 787ba8b6c4ac |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| input | function | 7 | no | function input(): ClientParityInput { |
| doc | const | 8 | no | const doc = { schema:&#39;vivim.ui-document/1&#39;, documentId:&#39;world_a&#39;, revision:3, |
| inner | const | 13 | no | const inner = {id:&#39;root&#39;,tag:&#39;main&#39;,attributes:{role:&#39;main&#39;,&#39;aria-label&#39;:&#39;Workspace&#39;}, |
| wrapper | const | 17 | no | const wrapper = { id:&#39;render_root&#39;,tag:&#39;main&#39;,attributes:{role:&#39;main&#39;,&#39;aria-label&#39;:&#39;Read only&#39;}, |
| rendered | const | 19 | no | const rendered = {sourceSchema:&#39;vivim.ui-document/1&#39;,status:&#39;ok&#39;,refusalCode:null, |
| desktop | const | 23 | no | const desktop = {ok:true,view:{native:{existingPublisher:&#39;harness&#39;},identity:{ownerRef:&#39;owner_a&#39;, |
| phone | const | 26 | no | const phone = {status:&#39;unavailable&#39;,refusalCode:&#39;UNSAFE_RENDER&#39;,publisher:&#39;harness&#39;, |
| phoneInput | const | 28 | no | const phoneInput = {shell:{publisher:&#39;harness&#39;,viewportPx:360},pairing:{worldRef:&#39;workspace_a&#39;,deviceRef:&#39;phone_1&#39;}, |
| patch | function | 32 | no | const patch = (x:ClientParityInput, fn:(draft:any)=&gt;void):ClientParityInput =&gt; { const next=structuredClone(x); fn(next); return next; }; |
| ready | function | 33 | no | const ready = ():ClientParityInput =&gt; patch(input(),x=&gt;{ x.rendered.plan.root = x.rendered.plan.root.children[0]; x.phone = {status:&#39;ready&#39;,refusalCode:null,publisher:&#39;harness&#39;,viewportPx:360, revisi… |
| x | const | 44 | no | const x=input();const r=diagnoseWave4BRoot(x.canonical,x.rendered); |
| p | const | 52 | no | const p=assessExistingClientParity(x);assert.equal(p.refusal,&#39;RENDER_ROOT_BLOCKED&#39;); |
| x | const | 59 | no | const x=patch(input(),v=&gt;{ v.phone={status:&#39;ready&#39;,refusalCode:null,publisher:&#39;harness&#39;,viewportPx:360, revision:3,documentId:&#39;world_a&#39;,focusOrder:[&#39;preview&#39;], identity:{ownerRef:&#39;owner_a&#39;,worldRef:&#39;… |
| p | const | 67 | no | const p=assessExistingClientParity(x); |
| r | const | 75 | no | const r=assessExistingClientParity(ready());assert.equal(r.refusal,&#39;NONE&#39;); |
| x | const | 81 | no | const x=patch(input(),v=&gt;{v.canonical.rootId=&#39;render_root&#39;;}); |
| x | const | 85 | no | const x=patch(input(),v=&gt;{v.rendered.plan.root.children.push({id:&#39;spatial_fallback&#39;,children:[]});}); |
| x | const | 89 | no | const x=patch(input(),v=&gt;{v.rendered.plan.root.children[0].children[0].id=&#39;root&#39;;}); |
| x | const | 93 | no | const x=patch(input(),v=&gt;{v.rendered.refusalCode=&#39;BOUND_DATA_UNAVAILABLE&#39;;}); |
| x | const | 97 | no | const x=patch(ready(),v=&gt;{v.desktop={ok:false,code:&#39;HOST_DENIED&#39;};}); |
| x | const | 102 | no | const x=patch(ready(),v=&gt;{v.phone.status=status;}); |
| x | const | 123 | no | const x=patch(ready(),v=&gt;{v.phone.viewportPx=width;v.phoneInput.shell.viewportPx=width;}); |
| x | const | 127 | no | const x=patch(ready(),v=&gt;{v.phone.viewportPx=width;v.phoneInput.shell.viewportPx=width;}); |
| x | const | 133 | no | const x=patch(ready(),v=&gt;{v.windowsViewportPx=width;}); |
| x | const | 138 | no | const x=patch(ready(),v=&gt;{v.phone.focusOrder=[&#39;forged&#39;];}); |
| x | const | 151 | no | const x=patch(ready(),v=&gt;{v.phone.publisher=&#39;other&#39;;}); |
| proofs | const | 157 | no | const proofs=requiredNativeProofs();assert.equal(proofs.length,7); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../../../src/visual-runtime/final-wave/lane-f/existing-clients.ts | import | 3 | [packages/tierflow/src/visual-runtime/final-wave/lane-f/existing-clients.ts](../../../../src/visual-runtime/final-wave/lane-f/existing-clients.ts.md) |
| ../../../../src/visual-runtime/final-wave/lane-f/existing-clients.ts | import | 5 | [packages/tierflow/src/visual-runtime/final-wave/lane-f/existing-clients.ts](../../../../src/visual-runtime/final-wave/lane-f/existing-clients.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import { assessExistingClientParity, diagnoseWave4BRoot, requiredNativeProofs,
  EXISTING_CLIENT_IDENTITIES } from '../../../../src/visual-runtime/final-wave/lane-f/existing-clients.ts';
import type { ClientParityInput } from '../../../../src/visual-runtime/final-wave/lane-f/existing-clients.ts';

function input(): ClientParityInput {
  const doc = { schema:'vivim.ui-document/1', documentId:'world_a', revision:3,
    scope:{ownerRef:'owner_a',workspaceRef:'workspace_a'}, rootId:'root',
    nodes:[{id:'root',type:'stack',props:{},a11y:{role:'main',name:'Workspace'},children:['preview']},
      {id:'preview',type:'button',props:{label:'Preview'},a11y:{role:'button',name:'Preview',focusOrder:1},children:[]}],
    bindings:[],views:[] } as ClientParityInput['canonical'];
  const inner = {id:'root',tag:'main',attributes:{role:'main','aria-label':'Workspace'},
    layout:{display:'flex',columns:1,minTargetPx:0},children:[{
      id:'preview',tag:'section',attributes:{role:'button','aria-label':'Preview','aria-disabled':'true'},
      layout:{display:'block',columns:1,minTargetPx:44},children:[]}]};
  const wrapper = { id:'render_root',tag:'main',attributes:{role:'main','aria-label':'Read only'},
    layout:{display:'block',columns:1,minTargetPx:0},children:[inner] };
  const rendered = {sourceSchema:'vivim.ui-document/1',status:'ok',refusalCode:null,
    plan:{schema:'vivim.ui-render-plan/1',documentId:'world_a',revision:3,viewportPx:360,
      status:'ok',root:wrapper,focusOrder:['preview'],spatial:{present:false},issues:[],trace:[]},
    actions:[],provenance:[] } as unknown as ClientParityInput['rendered'];
  const desktop = {ok:true,view:{native:{existingPublisher:'harness'},identity:{ownerRef:'owner_a',
    worldRef:'workspace_a',documentId:'world_a',revision:3},focus:{order:['preview']},
    plan:{viewportPx:1280}}} as unknown as ClientParityInput['desktop'];
  const phone = {status:'unavailable',refusalCode:'UNSAFE_RENDER',publisher:'harness',
    viewportPx:360,revision:null,documentId:null,focusOrder:[],identity:null,root:{children:[]}} as unknown as ClientParityInput['phone'];
  const phoneInput = {shell:{publisher:'harness',viewportPx:360},pairing:{worldRef:'workspace_a',deviceRef:'phone_1'},
    host:{documentRevision:3}} as unknown as ClientParityInput['phoneInput'];
  return {canonical:doc,rendered,desktop,phone,phoneInput,windowsViewportPx:1280};
}
const patch = (x:ClientParityInput, fn:(draft:any)=>void):ClientParityInput => { const next=structuredClone(x); fn(next); return next; };
const ready = ():ClientParityInput => patch(input(),x=>{
  x.rendered.plan.root = x.rendered.plan.root.children[0];
  x.phone = {status:'ready',refusalCode:null,publisher:'harness',viewportPx:360,
    revision:3,documentId:'world_a',focusOrder:['preview'],
    identity:{ownerRef:'owner_a',worldRef:'workspace_a',deviceRef:'phone_1'},
    root:{id:'root',role:'main',label:'Workspace',disabled:false,columns:1,touchTargetPx:0,children:[{
      id:'preview',role:'button',label:'Preview',description:'Host review required.',disabled:true,
      columns:1,touchTargetPx:44,children:[]}]}};
});

test('real Wave3 wrapper pattern is diagnosed and the owner patch is applied, never promoted to GO',()=>{
  const x=input();const r=diagnoseWave4BRoot(x.canonical,x.rendered);
  assert.equal(r.compatibility,'WAVE4B_WRAPPER_DEFECT');
  // The owner-authorized Wave 4 B repair is applied by the master integration, so the
  // repaired guard accepts this render shape and no owner patch is outstanding.
  assert.equal(r.repairedGuardAccepts,true);
  assert.equal(r.requiresWave4BOwnerPatch,false);
  // The fixture still reports the phone refusing UNSAFE_RENDER, so parity stays blocked
  // and native acceptance stays UNRUN. No device claim is manufactured.
  const p=assessExistingClientParity(x);assert.equal(p.refusal,'RENDER_ROOT_BLOCKED');
  assert.equal(p.fixtureParity,'blocked');assert.equal(p.nativeAcceptance,'UNRUN');
});
test('the wrapper shape alone no longer blocks parity when the real phone projection is ready',()=>{
  // Same real Wave 3 wrapper shape, but the phone projection is now READY because the
  // owner-authorized Wave 4 B repair accepts a DECLARED canonical root present in the
  // sanitized render tree. Everything else still has to pass.
  const x=patch(input(),v=>{
    v.phone={status:'ready',refusalCode:null,publisher:'harness',viewportPx:360,
      revision:3,documentId:'world_a',focusOrder:['preview'],
      identity:{ownerRef:'owner_a',worldRef:'workspace_a',deviceRef:'phone_1'},
      root:{id:'root',role:'main',label:'Workspace',disabled:false,columns:1,touchTargetPx:0,children:[{
        id:'preview',role:'button',label:'Preview',description:'Host review required.',disabled:true,
        columns:1,touchTargetPx:44,children:[]}]}};
  });
  const p=assessExistingClientParity(x);
  assert.equal(p.root.compatibility,'WAVE4B_WRAPPER_DEFECT');
  assert.equal(p.refusal,'NONE');assert.equal(p.fixtureParity,'matched');
  assert.equal(p.nativeAcceptance,'UNRUN');
  assert.equal(p.canPublish,false);assert.equal(p.canApprove,false);
  assert.equal(p.canExecute,false);assert.equal(p.retryEffectAutomatically,false);
});
test('canonical direct root has effect-free matched fixture parity only',()=>{
  const r=assessExistingClientParity(ready());assert.equal(r.refusal,'NONE');
  assert.equal(r.fixtureParity,'matched');assert.equal(r.nativeAcceptance,'UNRUN');
  assert.equal(r.canPublish,false);assert.equal(r.canApprove,false);
  assert.equal(r.canExecute,false);assert.equal(r.retryEffectAutomatically,false);
});
test('an alias posing as the document root is not treated as repair',()=>{
```

_First 80 of 162 lines._

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)
