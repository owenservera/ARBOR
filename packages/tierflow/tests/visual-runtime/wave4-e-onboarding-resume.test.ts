import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { projectWave4OnboardingResume, SAFE_QR_ACCESSIBLE_NAME, type Wave4OnboardingInput } from '../../src/visual-runtime/experience/wave4-onboarding-resume.ts';

const NOW = 1_790_000_000_000;
const principal = { ownerRef:'owner1', worldRef:'world1', deviceRef:'device1', sessionRef:'session1' } as const;
function fixture(): Wave4OnboardingInput {
  return {
    shell:'desktop', viewportPx:1280, nowMs:NOW, principal,
    installation:{ desktopReady:true, androidInstalled:true, dedicatedBrowserReady:true },
    host:{ source:'host', connected:true, principal, observedAtMs:NOW, worldRevision:'rev4',
      grant:{status:'active',ownerApproved:true,expiresAtMs:NOW+60000,scopes:['project:read','control:plan']} },
    pairing:{ source:'host', principal, enrollment:'active', enrollmentExpiresAtMs:NOW+60000,
      tokenStatus:'redeemed',tokenExpiresAtMs:NOW+60000 },
    provider:{source:'studio',proof:'provider_authenticated',observedAtMs:NOW},
    action:null, reconnect:null,
    founder:{ schema:'vivim.founder-journey-fixture/1', state:'ready',
      projects:[{stableId:'proj1',title:'Example project',summary:'Owner-scoped project overview',statusLabel:'Current',interactive:false}],
      document:{ok:true,document:{scope:{ownerRef:'owner1'}}},render:{status:'ready'},
      help:{visible:true,title:'Why is this available?',explanation:'Review the provenance and permission boundaries.'},
      onboarding:{cancelled:false,current:'discover'},
      recovery:{ automaticRetryAllowed:false }, effectInvoked:false,
    } as unknown as Wave4OnboardingInput['founder'],
    hostRead:{schema:'vivim.wave3-host-read-fixture/1',kind:'capability',state:'display_only',
      reasonCode:'READ_ONLY',canExecute:false,effectInvoked:false,automaticRetryAllowed:false,
    } as unknown as Wave4OnboardingInput['hostRead'],
  };
}
function project(change: (base: Wave4OnboardingInput) => Wave4OnboardingInput = x => x) {
  return projectWave4OnboardingResume(change(fixture()));
}
const patch = (x: Wave4OnboardingInput, changes: Partial<Wave4OnboardingInput>) => ({...x,...changes});

for (const [shell, viewport] of [['desktop',1280],['android',360],['android',320]] as const) {
  test("positive " + shell + " at " + viewport + ": same canonical project and safe, accessible help", () => {
    const v=project(x=>patch(x,{shell,viewportPx:viewport}));
    assert.equal(v.stage,'help');
    assert.deepEqual(v.projectCards,[{stableId:'proj1',title:'Example project',summary:'Owner-scoped project overview',statusLabel:'Current'}]);
    assert.deepEqual(v.readiness,{tabReady:'yes',paired:'yes',signedIn:'yes',permitted:'yes',verified:'no'});
    assert.equal(v.help.visible,true);
    assert.equal(v.help.runnable,false);
    assert.equal(v.layout,viewport===1280?'wide':'compact');
    assert.deepEqual(v.actions.map(a=>a.intent),['open-contextual-help','return-to-workspace','cancel-local']);
    assert.equal(v.effectInvoked,false);
    assert.equal(v.storeCreated,false);
    assert.equal(v.publisherCreated,false);
  });
}
test('install readiness blocks journey before showing pairing',()=>{
  const v=project(x=>patch(x,{installation:{...x.installation,desktopReady:false}}));
  assert.equal(v.stage,'install');
});
test('tab-ready is not signed-in and cannot imply verified, even when paired',()=>{
  const v=project(x=>patch(x,{provider:{source:'studio',proof:'tab_ready',observedAtMs:NOW}}));
  assert.equal(v.readiness.tabReady,'yes');
  assert.equal(v.readiness.signedIn,'no');
  assert.equal(v.readiness.verified,'no');
  assert.equal(v.stage,'readiness');
});
test('signed-in proof from UI is refused as trusted Studio evidence',()=>{
  const v=project(x=>patch(x,{provider:{source:'ui',proof:'provider_authenticated',observedAtMs:NOW}}));
  assert.equal(v.readiness.signedIn,'no');
});
test('expired Studio evidence is not reusable',()=>{
  const v=project(x=>patch(x,{provider:{source:'studio',proof:'provider_authenticated',observedAtMs:NOW-300001}}));
  assert.equal(v.readiness.signedIn,'no');
});
test('QR redemption starts enrollment; it never proves paired status',()=>{
  const v=project(x=>patch(x,{pairing:{...x.pairing!,enrollment:'enrollment-required',tokenStatus:'redeemed'}}));
  assert.equal(v.readiness.paired,'no');
  assert.equal(v.stage,'pair');
});
test('issued token expires exactly at TTL; no leaked code and safe regeneration',()=>{
  const secret='a'.repeat(64);
  const input=fixture();
  const v=projectWave4OnboardingResume({...input,pairing:{...input.pairing!,enrollment:'none',tokenStatus:'issued',tokenExpiresAtMs:NOW,token:secret} as Wave4OnboardingInput['pairing']});
  assert.equal(v.pairing.tokenStatus,'expired');
  assert.equal(v.pairing.needsNewToken,true);
  assert.equal(v.pairing.qrAccessibleName,SAFE_QR_ACCESSIBLE_NAME);
  assert.equal(JSON.stringify(v).includes(secret),false);
  assert.equal(v.stage,'pair');
});
test('replayed pairing token does not grant enrollment and never enters labels',()=>{
  const v=project(x=>patch(x,{pairing:{...x.pairing!,enrollment:'none',tokenStatus:'replayed'}}));
  assert.equal(v.pairing.needsNewToken,true);
  assert.equal(v.readiness.paired,'no');
  assert.equal(v.stage,'pair');
});
test('wrong device and wrong World cannot pair or see projects',()=>{
  for (const key of ['deviceRef','worldRef','ownerRef','sessionRef'] as const) {
    const v=project(x=>patch(x,{pairing:{...x.pairing!,principal:{...principal,[key]:'foreign'}}}));
    assert.equal(v.readiness.paired,'no',key);
    assert.equal(v.projectCards.length,0,key);
  }
});
test('Host identity mismatch or old heartbeat disconnects and hides projects',()=>{
  for (const change of [{principal:{...principal,ownerRef:'wrong'}},{observedAtMs:NOW-30001},{connected:false}]) {
    const v=project(x=>patch(x,{host:{...x.host!,...change}}));
    assert.equal(v.stage,'disconnect');
    assert.equal(v.readiness.paired,'unknown');
    assert.equal(v.readiness.permitted,'unknown');
    assert.equal(v.projectCards.length,0);
    assert.equal(v.worldRevision,null);
    assert.equal(v.recovery.automaticRetryAllowed,false);
  }
});
test('no Host permission: paired/sign-in not mistaken for permission',()=>{
  const v=project(x=>patch(x,{host:{...x.host!,grant:{...x.host!.grant,ownerApproved:false}}}));
  assert.equal(v.readiness.permitted,'no');
  assert.equal(v.stage,'readiness');
  assert.equal(v.projectCards.length,0);
  assert.equal(v.help.visible,false);
});
test('no Host-approved scopes and expired grant refuse project or command access',()=>{
  for (const grant of [
    {...fixture().host!.grant,scopes:['project:read']},
    {...fixture().host!.grant,expiresAtMs:NOW},
    {...fixture().host!.grant,status:'revoked' as const},
  ]) {
    const v=project(x=>patch(x,{host:{...x.host!,grant}}));
    assert.equal(v.readiness.permitted,'no');
    assert.equal(v.projectCards.length,0);
  }
});
test('inaccessible or restricted contextual help has a safe return route',()=>{
  const input=fixture();
  const v=projectWave4OnboardingResume({...input,founder:{...input.founder,help:{...input.founder.help,visible:false}}});
  assert.equal(v.help.visible,false);
  assert.match(v.help.explanation,/safe workspace/);
  assert.equal(v.actions.some(a=>a.intent==='return-to-workspace'),true);
});
test('unsafe label, QR URL or injected script never enters rendered journey',()=>{
  const input=fixture();
  const hostile={...input.founder,projects:[{...input.founder.projects[0]!,title:'<script>alert(1)</script>',summary:'javascript:alert(1)'}],
    help:{...input.founder.help,explanation:'https://example.invalid/#'+'a'.repeat(64)}};
  const v=projectWave4OnboardingResume({...input,founder:hostile});
  assert.equal(v.projectCards.length,0);
  assert.equal(v.help.visible,false);
  assert.equal(JSON.stringify(v).includes('<script>'),false);
  assert.equal(JSON.stringify(v).includes('javascript:'),false);
});
test('foreign validated UI document never produces project cards',()=>{
  const input=fixture();
  const v=projectWave4OnboardingResume({...input,founder:{...input.founder,document:{...input.founder.document,document:{...input.founder.document.document!,scope:{ownerRef:'other'}}}} as Wave4OnboardingInput['founder']});
  assert.equal(v.projectCards.length,0);
});
test('pending action without final receipt stays pending and never retries',()=>{
  const v=project(x=>patch(x,{action:{source:'host',principal,state:'pending',worldRevision:'rev4',observedAtMs:NOW,signatureState:'unknown'}}));
  assert.equal(v.action.state,'pending');
  assert.equal(v.action.receiptVerified,false);
  assert.equal(v.recovery.needed,true);
  assert.equal(v.action.automaticRetryAllowed,false);
  assert.equal(v.actions.some(a=>a.intent==='inspect-host-status'),true);
});
test('stuck pending action degrades to uncertain and triggers accessible recovery',()=>{
  const v=project(x=>patch(x,{action:{source:'host',principal,state:'pending',worldRevision:'rev4',observedAtMs:NOW-60001,signatureState:'unknown'}}));
  assert.equal(v.action.state,'uncertain');
  assert.equal(v.accessibility.focusTarget,'recovery-heading');
  assert.equal(v.action.automaticRetryAllowed,false);
});
test('verified applied outcome requires same revision, scope, signed receipt and readiness',()=>{
  const action={source:'host' as const,principal,state:'applied' as const,worldRevision:'rev4',observedAtMs:NOW,
    signatureState:'verified' as const,receiptRef:'receipt1'};
  const v=project(x=>patch(x,{action}));
  assert.equal(v.action.state,'applied-verified');
  assert.equal(v.readiness.verified,'yes');
  const bad=project(x=>patch(x,{action:{...action,worldRevision:'rev3'}}));
  assert.equal(bad.action.receiptVerified,false);
  const unsigned=project(x=>patch(x,{action:{...action,signatureState:'unsigned'}}));
  assert.equal(unsigned.action.state,'uncertain');
  const missing=project(x=>patch(x,{action:{...action,receiptRef:undefined}}));
  assert.equal(missing.action.state,'uncertain');
});
test('Wave 3 H invalid observation downgrades trusted applied assertion',()=>{
  const input=fixture();
  const v=projectWave4OnboardingResume({...input,
    action:{source:'host',principal,state:'applied',worldRevision:'rev4',observedAtMs:NOW,signatureState:'verified',receiptRef:'receipt1'},
    hostRead:{...input.hostRead,kind:'receipt',receipt:{reportedStatus:'applied',signatureState:'invalid',verification:'synthetic_test_only'}} as Wave4OnboardingInput['hostRead']});
  assert.equal(v.action.state,'uncertain');
});
test('denial survives reconnect/reconciled resume; no new grant or auto retry',()=>{
  const v=project(x=>patch(x,{
    action:{source:'host',principal,state:'denied',worldRevision:'rev4',observedAtMs:NOW,signatureState:'unknown'},
    reconnect:{source:'host',principal,state:'reconciled',worldRevision:'rev4',observedAtMs:NOW},
  }));
  assert.equal(v.stage,'resume');
  assert.equal(v.recovery.resumeAllowed,true);
  assert.equal(v.action.state,'denied');
  assert.equal(v.action.automaticRetryAllowed,false);
  assert.equal(v.actions.some(a=>a.intent==='resume-from-authority'),true);
  assert.equal(v.actions.some(a=>(a.intent as string).includes('execute')),false);
});
test('reconnect with wrong revision requires resnapshot; cannot silently resume',()=>{
  const v=project(x=>patch(x,{reconnect:{source:'host',principal,state:'reconciled',worldRevision:'rev3',observedAtMs:NOW}}));
  assert.equal(v.recovery.mustResnapshot,true);
  assert.equal(v.recovery.resumeAllowed,false);
  assert.equal(v.stage,'resume');
});
test('cancelled Wave 3 journey is not independently un-cancelled by adapter',()=>{
  const input=fixture();
  const v=projectWave4OnboardingResume({...input,founder:{...input.founder,onboarding:{...input.founder.onboarding,cancelled:true}}});
  assert.equal(v.recovery.needed,true);
  assert.deepEqual(v.actions.map(a=>a.intent),['resume-from-authority']);
  assert.equal(input.founder.onboarding.cancelled,false);
});
test('malformed principal, invalid width and unsupported shell refuse without sensitive errors',()=>{
  assert.throws(()=>project(x=>patch(x,{principal:{...principal,deviceRef:'../bad'}})),/Invalid Wave 4 E projection input/);
  assert.throws(()=>project(x=>patch(x,{viewportPx:319})),/Invalid Wave 4 E projection input/);
  assert.throws(()=>project(x=>patch(x,{shell:'tablet' as 'desktop'})),/Invalid Wave 4 E projection input/);
});
test('read-only projector is repeatable, does not modify source, and has no effect entrypoint',()=>{
  const input=fixture();
  const before=JSON.stringify(input);
  const v1=projectWave4OnboardingResume(input);
  const v2=projectWave4OnboardingResume(input);
  assert.deepEqual(v1,v2);
  assert.equal(JSON.stringify(input),before);
  assert.equal('dispatch' in v1,false);
  assert.equal('execute' in v1,false);
  assert.equal('pairingToken' in v1,false);
});
test('resnapshot-required hides previously visible projects without inventing an independent cache',()=>{
  const v=project(x=>patch(x,{reconnect:{source:'host',principal,state:'resnapshot-required',worldRevision:'rev4',observedAtMs:NOW}}));
  assert.equal(v.recovery.mustResnapshot,true);
  assert.equal(v.projectCards.length,0);
  assert.equal(v.help.visible,true); // generic contextual help remains available under current grant
});
