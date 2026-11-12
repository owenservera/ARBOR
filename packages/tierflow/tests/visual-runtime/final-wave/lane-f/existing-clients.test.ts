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
  const x=patch(input(),v=>{v.canonical.rootId='render_root';});
  assert.equal(diagnoseWave4BRoot(x.canonical,x.rendered).compatibility,'UNDECLARED_ROOT');
});
test('additional synthetic wrapper children fail closed',()=>{
  const x=patch(input(),v=>{v.rendered.plan.root.children.push({id:'spatial_fallback',children:[]});});
  assert.equal(diagnoseWave4BRoot(x.canonical,x.rendered).compatibility,'EXTRA_RENDER_CHILDREN');
});
test('duplicate render id rejects hostile nested alias',()=>{
  const x=patch(input(),v=>{v.rendered.plan.root.children[0].children[0].id='root';});
  assert.equal(diagnoseWave4BRoot(x.canonical,x.rendered).compatibility,'DUPLICATE_RENDER_ID');
});
test('inert denied or stale rendered plan is never accepted',()=>{
  const x=patch(input(),v=>{v.rendered.refusalCode='BOUND_DATA_UNAVAILABLE';});
  assert.equal(diagnoseWave4BRoot(x.canonical,x.rendered).compatibility,'RENDER_REFUSED');
});
test('Windows refusal survives a positive phone fixture',()=>{
  const x=patch(ready(),v=>{v.desktop={ok:false,code:'HOST_DENIED'};});
  assert.equal(assessExistingClientParity(x).refusal,'WINDOWS_REFUSED');
});
test('phone offline or revoked never inherits desktop readiness',()=>{
  for(const status of ['offline','denied','unpaired']) {
    const x=patch(ready(),v=>{v.phone.status=status;});
    assert.equal(assessExistingClientParity(x).refusal,'PHONE_REFUSED');
  }
});
test('cross owner/world pairing and identity mismatch are refused',()=>{
  for(const change of [
    (x:any)=>{x.phone.identity.ownerRef='foreign';},
    (x:any)=>{x.phoneInput.pairing.worldRef='foreign';},
    (x:any)=>{x.phone.identity.deviceRef='other';},
  ]) assert.equal(assessExistingClientParity(patch(ready(),change)).refusal,'FOREIGN_SCOPE');
});
test('stale revision across restart is a resnapshot not automatic retry',()=>{
  for(const change of [
    (x:any)=>{x.phone.revision=2;},
    (x:any)=>{x.desktop.view.identity.revision=2;},
    (x:any)=>{x.phoneInput.host.documentRevision=4;},
  ]) {const r=assessExistingClientParity(patch(ready(),change));
    assert.equal(r.refusal,'STALE_REVISION');assert.equal(r.retryEffectAutomatically,false);}
});
test('320/360 phone and 1280 desktop parity is supported only as synthetic projection',()=>{
  for(const width of [320,360]) {
    const x=patch(ready(),v=>{v.phone.viewportPx=width;v.phoneInput.shell.viewportPx=width;});
    assert.equal(assessExistingClientParity(x).fixtureParity,'matched');
  }
  for(const width of [200,400]) {
    const x=patch(ready(),v=>{v.phone.viewportPx=width;v.phoneInput.shell.viewportPx=width;});
    assert.equal(assessExistingClientParity(x).refusal,'UNSUPPORTED_VIEWPORT');
  }
});
test('desktop viewport drift or small window blocks parity',()=>{
  for(const width of [640,1400]){
    const x=patch(ready(),v=>{v.windowsViewportPx=width;});
    assert.equal(assessExistingClientParity(x).refusal,'UNSUPPORTED_VIEWPORT');
  }
});
test('focus and TalkBack semantics must agree exactly',()=>{
  const x=patch(ready(),v=>{v.phone.focusOrder=['forged'];});
  assert.equal(assessExistingClientParity(x).refusal,'FOCUS_MISMATCH');
});
test('disabled, named, 44px touch target and single-column access are mandatory',()=>{
  for(const change of [
    (x:any)=>{x.phone.root.children[0].disabled=false;},
    (x:any)=>{x.phone.root.children[0].touchTargetPx=20;},
    (x:any)=>{x.phone.root.children[0].label='';},
    (x:any)=>{x.phone.root.children[0].columns=2;},
    (x:any)=>{x.phone.root.children[0].description='Proceed';},
  ]) assert.equal(assessExistingClientParity(patch(ready(),change)).refusal,'UNSAFE_ACCESSIBILITY');
});
test('publisher spoofing remains blocked and no second APK identity appears',()=>{
  const x=patch(ready(),v=>{v.phone.publisher='other';});
  assert.equal(assessExistingClientParity(x).refusal,'DUPLICATE_PUBLISHER');
  assert.equal(EXISTING_CLIENT_IDENTITIES.android,'inc.vivim.app');
  assert.equal(EXISTING_CLIENT_IDENTITIES.windows,'com.vivim.host');
});
test('release proof checklist is explicit; module never manufactures device GO',()=>{
  const proofs=requiredNativeProofs();assert.equal(proofs.length,7);
  assert.ok(proofs.some(s=>s.includes('talkback')));
  assert.ok(proofs.some(s=>s.includes('R2-phone-denial')));
  assert.equal(assessExistingClientParity(ready()).nativeAcceptance,'UNRUN');
});
