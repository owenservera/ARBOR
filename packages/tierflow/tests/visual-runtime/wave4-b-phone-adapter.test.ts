import test from 'node:test';
import assert from 'node:assert/strict';
import { PHONE_MIN_TOUCH_PX, projectWave4PhoneAdapter, projectWave4PhoneEvent } from
  '../../src/visual-runtime/device/wave4-phone-adapter.ts';
import type { PhoneProjectionInput } from '../../src/visual-runtime/device/wave4-phone-adapter.ts';

/** Contract-shaped fixtures, NOT an installed APK or an authenticated Host. */
function fixture(width = 320): PhoneProjectionInput {
  const root = {
    id: 'root', tag: 'main', attributes: {role:'main', 'aria-label':'Founder Workspace'},
    layout: {display:'flex', columns:1, minTargetPx:0}, children: [
      {id:'project', tag:'section', attributes:{role:'region', 'aria-label':'Project status'},
        text:'Project status', layout:{display:'block', columns:1,minTargetPx:0},children:[]},
      {id:'preview', tag:'section', attributes:{role:'button', 'aria-label':'Preview action',
        'aria-disabled':'true', 'aria-description':'Read-only preview. No action can be performed here.',tabindex:'0'},
        text:'Preview action',layout:{display:'block',columns:1,minTargetPx:44},children:[]},
    ],
  } as const;
  return {
    canonical: {
      schema:'vivim.ui-document/1', documentId:'founder_workspace', revision:7,
      scope:{ownerRef:'owner_a',workspaceRef:'workspace_a'},rootId:'root',
      nodes:[
        {id:'root',type:'stack',props:{direction:'vertical'},children:['project','preview'],a11y:{role:'main',name:'Founder Workspace'}},
        {id:'project',type:'project-card',props:{title:'Project status'},children:[],
          bindingRefs:['source'],a11y:{role:'group',name:'Project status'}},
        {id:'preview',type:'button',props:{label:'Preview action'},children:[],
          actionRefs:[{id:'fixture.preview',version:1}],a11y:{role:'button',name:'Preview action',focusOrder:1}},
      ],
      bindings:[{id:'source',version:2,nodeId:'project',field:'title',knowledgeRef:'kb_a',
        provenanceRef:'provenance_a',readScope:'owner',availability:'present'}],
      views:[{id:'phone',version:1,kind:'2d',viewport:'phone'},
        {id:'desktop',version:1,kind:'2d',viewport:'desktop'}],
    },
    rendered:{ schema:'vivim.wave3-render-semantics/1',status:'ok',sourceSchema:'vivim.ui-document/1',
      refusalCode:null, actions:[{nodeId:'preview',id:'fixture.preview',version:1,displayAlias:'render_action_2_0',inert:true}],
      provenance:[{nodeId:'project',bindingId:'source',bindingVersion:2,provenanceRef:'provenance_a',
        availability:'present',readScope:'owner',authorized:false}],
      plan:{schema:'vivim.ui-render-plan/1',documentId:'founder_workspace',revision:7,viewportPx:width,
        status:'ok',root,focusOrder:['preview'],issues:[],trace:[],
        spatial:{present:false} as PhoneProjectionInput['rendered']['plan']['spatial']},
      inspection:{} as PhoneProjectionInput['rendered']['inspection'] },
    shell:{app:'existing-vivim-apk',relay:'existing-mobile-relay',publisher:'harness',viewportPx:width},
    pairing:{state:'paired',ownerRef:'owner_a',worldRef:'world_a',deviceRef:'phone_a',sessionRef:'session_a',
      epoch:3,receivedSequence:51,lastAcceptedSequence:50,expiresAtMs:200000},
    host:{state:'online',ownerRef:'owner_a',worldRef:'world_a',deviceRef:'phone_a',sessionRef:'session_a',
      pairingEpoch:3,policyRevision:9,nowMs:100000,grantExpiresAtMs:160000,documentRevision:7,denied:false,
      actionRisks:[{nodeId:'preview',id:'fixture.preview',version:1,risk:'R1',policyRevision:9}]},
  };
}
function mutable(width=320): PhoneProjectionInput {
  return structuredClone(fixture(width));
}
function set<T extends object,K extends keyof T>(object:T,key:K,value:T[K]):void {
  (object as {-readonly [P in keyof T]:T[P]})[key]=value;
}
function absent(input:PhoneProjectionInput,code:string):void {
  const v=projectWave4PhoneAdapter(input);
  assert.equal(v.refusalCode,code);
  assert.notEqual(v.status,'ready');
  assert.equal(v.identity,null);
  assert.deepEqual(v.focusOrder,[]);
  assert.equal(v.effectInvoked,false);
  assert.equal(v.automaticRetryAllowed,false);
  assert.ok(!JSON.stringify(v).includes('Project status'));
  assert.ok(!JSON.stringify(v).includes('provenance_a'));
}

test('same canonical document yields 320/360 inert semantic layouts and 44px touch targets',()=>{
  for(const width of [320,360]) {
    const value=projectWave4PhoneAdapter(fixture(width));
    assert.equal(value.status,'ready');
    assert.equal(value.documentId,'founder_workspace');
    assert.equal(value.revision,7);
    assert.equal(value.viewportPx,width);
    assert.deepEqual(value.focusOrder,['preview']);
    assert.equal(value.root.role,'main');
    const button=value.root.children[1]!;
    assert.equal(button.role,'button');
    assert.equal(button.disabled,true);
    assert.ok(button.touchTargetPx>=PHONE_MIN_TOUCH_PX);
    assert.equal(button.columns,1);
    assert.match(button.description??'',/Host review/);
    assert.equal(value.publisher,'harness');
    assert.equal(value.effectInvoked,false);
    assert.equal(value.canApproveOnPhone,false);
    assert.deepEqual(value.identity,{ownerRef:'owner_a',worldRef:'world_a',deviceRef:'phone_a'});
    assert.ok(!JSON.stringify(value).includes('kb_a'));
    assert.ok(!JSON.stringify(value).includes('provenance_a'));
    assert.ok(!JSON.stringify(value).includes('session_a'));
  }
});

test('touch and TalkBack produce only matching, inert, revision-bound candidate',()=>{
  const input=fixture(),view=projectWave4PhoneAdapter(input);
  const touch=projectWave4PhoneEvent(input,view,{kind:'touch',eventId:'evt_touch',nodeId:'preview',risk:'R1'});
  const talkback=projectWave4PhoneEvent(input,view,{kind:'talkback',eventId:'evt_talkback',nodeId:'preview',risk:'R1'});
  assert.equal(touch.ok,true); assert.equal(talkback.ok,true);
  if(touch.ok && talkback.ok) {
    assert.deepEqual(touch.action,talkback.action);
    assert.deepEqual(touch.action,{id:'fixture.preview',version:1,nodeId:'preview'});
    assert.equal(touch.revision,7);
    assert.equal(touch.effectInvoked,false);
    assert.equal(touch.automaticRetryAllowed,false);
  }
});

test('Android Back is only a Host-owned navigation request, never an effect',()=>{
  const input=fixture(), view=projectWave4PhoneAdapter(input);
  const r=projectWave4PhoneEvent(input,view,{kind:'back',eventId:'evt_back'});
  assert.equal(r.ok,true);
  if(r.ok) { assert.equal(r.kind,'back-request'); assert.equal(r.action,null); assert.equal(r.canApproveOnPhone,false); }
});

test('pairing replay, out of order frame and missing pairing refuse with no cached content',()=>{
  const replay=mutable();set(replay.pairing,'receivedSequence',50);absent(replay,'PAIRING_REPLAY');
  const gap=mutable();set(gap.pairing,'receivedSequence',55);absent(gap,'RESNAPSHOT_REQUIRED');
  const unpaired=mutable();set(unpaired.pairing,'state','unpaired');absent(unpaired,'PAIRING_REQUIRED');
  const revoked=mutable();set(revoked.pairing,'state','revoked');absent(revoked,'PAIRING_REQUIRED');
});

test('forged pair identity, epoch and session cross-bindings fail closed',()=>{
  for(const changed of ['ownerRef','worldRef','deviceRef','sessionRef'] as const){
    const x=mutable();set(x.pairing,changed,'foreign');absent(x,'PAIRING_IDENTITY_MISMATCH');
  }
  const epoch=mutable();set(epoch.pairing,'epoch',2);absent(epoch,'PAIRING_IDENTITY_MISMATCH');
});

test('no QR bearer, token/key field or 64-character hex can leak into TalkBack',()=>{
  const withToken=mutable();(withToken.pairing as unknown as Record<string,unknown>).pairingToken='a'.repeat(64);
  absent(withToken,'SECRET_FIELD_PRESENT');
  const withSecret=mutable();(withSecret.host as unknown as Record<string,unknown>).grantId='b'.repeat(32);
  absent(withSecret,'SECRET_FIELD_PRESENT');
  const withQr=mutable();(withQr.rendered.plan.root.children[0] as unknown as {text:string}).text='c'.repeat(64);
  absent(withQr,'UNSAFE_RENDER');
  const withLink=mutable();(withLink.rendered.plan.root.children[0] as unknown as {text:string}).text='vivim://pair?token=123';
  absent(withLink,'UNSAFE_RENDER');
});

test('expired pairing or stale authorization never reuses offline authority',()=>{
  const expired=mutable();set(expired.pairing,'expiresAtMs',100000);absent(expired,'PAIRING_EXPIRED');
  const stale=mutable();set(stale.host,'grantExpiresAtMs',100000);absent(stale,'STALE_AUTHORIZATION');
  const stalePolicy=mutable();set(stalePolicy.host,'policyRevision',-1);absent(stalePolicy,'STALE_AUTHORIZATION');
});

test('Host denial and disconnected/offline states blank stale content and deny action',()=>{
  const denied=mutable();set(denied.host,'denied',true);absent(denied,'HOST_DENIED');
  const offline=mutable();set(offline.host,'state','offline');absent(offline,'HOST_OFFLINE');
  const disconnected=mutable();set(disconnected.host,'state','disconnected');absent(disconnected,'HOST_OFFLINE');
  const view=projectWave4PhoneAdapter(fixture());
  const deniedEvent=projectWave4PhoneEvent(denied,view,{kind:'touch',eventId:'evt_a',nodeId:'preview',risk:'R1'});
  assert.deepEqual(deniedEvent,{ok:false,code:'STALE_REVISION',effectInvoked:false,automaticRetryAllowed:false,canApproveOnPhone:false});
});

test('stale Host or D revision is refused and forces a fresh resnapshot',()=>{
  const staleHost=mutable();set(staleHost.host,'documentRevision',8);absent(staleHost,'STALE_DOCUMENT');
  const staleRender=mutable();set(staleRender.rendered.plan,'revision',8);absent(staleRender,'RENDER_REFUSED');
  const mismatchedViewport=mutable();set(mismatchedViewport.rendered.plan,'viewportPx',360);absent(mismatchedViewport,'RENDER_REFUSED');
});

test('cross-lane action and binding provenance mismatch is never silently remapped',()=>{
  const badAction=mutable();set(badAction.rendered.actions[0]!,'version',2);absent(badAction,'CANONICAL_MISMATCH');
  const badProvenance=mutable();set(badProvenance.rendered.provenance[0]!,'provenanceRef','wrong');absent(badProvenance,'CANONICAL_MISMATCH');
  const badAuthorization=mutable();(badAuthorization.rendered.provenance[0]! as unknown as {authorized:boolean}).authorized=true;absent(badAuthorization,'CANONICAL_MISMATCH');
});

test('R2 phone approval and R3 action are always denied, even under an online Host',()=>{
  const input=fixture(),view=projectWave4PhoneAdapter(input);
  for(const [risk,code] of [['R2','R2_PHONE_FORBIDDEN'],['R3','R3_PHONE_FORBIDDEN']] as const){
    const candidate=mutable();set(candidate.host.actionRisks[0]!,'risk',risk);
    const current=projectWave4PhoneAdapter(candidate);
    assert.equal(current.status,'ready');
    const r=projectWave4PhoneEvent(candidate,current,{kind:'talkback',eventId:'evt_'+risk,nodeId:'preview',risk:'R1'});
    assert.equal(r.ok,false);if(!r.ok){assert.equal(r.code,code);assert.equal(r.effectInvoked,false);}
  }
});

test('event replay is denied against the caller-owned monotonic dedupe ledger',()=>{
  const input=fixture(),view=projectWave4PhoneAdapter(input);
  const event={kind:'touch',eventId:'evt_123',nodeId:'preview',risk:'R1'} as const;
  assert.equal(projectWave4PhoneEvent(input,view,event).ok,true);
  const r=projectWave4PhoneEvent(input,view,event,['evt_123']);
  assert.equal(r.ok,false);if(!r.ok)assert.equal(r.code,'DUPLICATE_EVENT');
  assert.equal(r.effectInvoked,false);
});

test('effect cannot be dispatched from painted button, unknown focus or unsupported risk',()=>{
  const input=fixture(),view=projectWave4PhoneAdapter(input);
  for(const event of [
    {kind:'touch',eventId:'evt_unlisted',nodeId:'project',risk:'R1'},
    {kind:'touch',eventId:'evt_unlisted',nodeId:'preview'},
  ] as const){
    const r=projectWave4PhoneEvent(input,view,event);
    assert.equal(r.ok,false);
    assert.equal(r.effectInvoked,false);
  }
});

test('duplicate publisher, fake shell and mismatched owner are refused',()=>{
  const second=mutable();set(second.shell,'publisher','independent' as 'harness');absent(second,'DUPLICATE_PUBLISHER');
  const secondApk=mutable();set(secondApk.shell,'app','another-apk' as 'existing-vivim-apk');absent(secondApk,'WRONG_SHELL');
  const wrongOwner=mutable();set(wrongOwner.canonical.scope,'ownerRef','owner_b');absent(wrongOwner,'PAIRING_IDENTITY_MISMATCH');
});

test('injected handler, hostile markup and unsafe accessibility labels fail closed',()=>{
  const handler=mutable();(handler.rendered.plan.root.attributes as unknown as Record<string,unknown>).onclick='evil';absent(handler,'UNSAFE_RENDER');
  const markup=mutable();(markup.rendered.plan.root.children[0] as unknown as {text:string}).text='<img src=x onerror=alert(1)>';
  absent(markup,'UNSAFE_RENDER');
  const talkback=mutable();(talkback.rendered.plan.root.children[1]!.attributes as unknown as Record<string,unknown>)['aria-label']='javascript:alert(1)';
  absent(talkback,'UNSAFE_RENDER');
});

test('missing accessible button name/44px target or forged focus is refused',()=>{
  const touch=mutable();set(touch.rendered.plan.root.children[1]!.layout,'minTargetPx',20);absent(touch,'UNSAFE_RENDER');
  const focus=mutable();set(focus.rendered.plan,'focusOrder',['project']);absent(focus,'CANONICAL_MISMATCH');
});

test('forged lower risk, missing risk pin and stale descriptor policy fail closed',()=>{
  for (const risk of ['R2','R3'] as const) {
    const input=mutable();set(input.host.actionRisks[0]!,'risk',risk);
    const view=projectWave4PhoneAdapter(input);
    const result=projectWave4PhoneEvent(input,view,{kind:'touch',eventId:'evt_forge'+risk,nodeId:'preview',risk:'R0'});
    assert.equal(result.ok,false);
    if(!result.ok) assert.equal(result.code,risk+'_PHONE_FORBIDDEN');
  }
  const missing=mutable();set(missing.host,'actionRisks',[]);absent(missing,'CANONICAL_MISMATCH');
  const policy=mutable();set(policy.host.actionRisks[0]!,'policyRevision',8);absent(policy,'STALE_AUTHORIZATION');
  const mismatch=fixture(),view=projectWave4PhoneAdapter(mismatch);
  const action=projectWave4PhoneEvent(mismatch,view,{kind:'touch',eventId:'evt_wrong',nodeId:'preview',risk:'R0'});
  assert.equal(action.ok,false);if(!action.ok)assert.equal(action.code,'RISK_MISMATCH');
});

test('no automatic network or UI state effects; return values are JSON data only',()=>{
  const input=fixture();const output=projectWave4PhoneAdapter(input);
  const action=projectWave4PhoneEvent(input,output,{kind:'touch',eventId:'evt_safe',nodeId:'preview',risk:'R1'});
  assert.doesNotThrow(()=>structuredClone(output));
  assert.doesNotThrow(()=>structuredClone(action));
  assert.ok(!JSON.stringify({output,action}).match(/onIntent|fetch\(|sendProposal|grantId|sessionId/));
  assert.equal(action.effectInvoked,false);
});
