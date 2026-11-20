# File: packages/tierflow/tests/visual-runtime/wave4-e-onboarding-resume.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/wave4-e-onboarding-resume.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 13554 B |
| Lines | 227 |
| Hash | 78e938944f09 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NOW | const | 5 | no | const NOW = 1_790_000_000_000; |
| principal | const | 6 | no | const principal = { ownerRef:&#39;owner1&#39;, worldRef:&#39;world1&#39;, deviceRef:&#39;device1&#39;, sessionRef:&#39;session1&#39; } as const; |
| fixture | function | 7 | no | function fixture(): Wave4OnboardingInput { |
| project | function | 29 | no | function project(change: (base: Wave4OnboardingInput) =&gt; Wave4OnboardingInput = x =&gt; x) { |
| patch | function | 32 | no | const patch = (x: Wave4OnboardingInput, changes: Partial&lt;Wave4OnboardingInput&gt;) =&gt; ({...x,...changes}); |
| v | const | 36 | no | const v=project(x=&gt;patch(x,{shell,viewportPx:viewport})); |
| v | const | 50 | no | const v=project(x=&gt;patch(x,{installation:{...x.installation,desktopReady:false}})); |
| v | const | 54 | no | const v=project(x=&gt;patch(x,{provider:{source:&#39;studio&#39;,proof:&#39;tab_ready&#39;,observedAtMs:NOW}})); |
| v | const | 61 | no | const v=project(x=&gt;patch(x,{provider:{source:&#39;ui&#39;,proof:&#39;provider_authenticated&#39;,observedAtMs:NOW}})); |
| v | const | 65 | no | const v=project(x=&gt;patch(x,{provider:{source:&#39;studio&#39;,proof:&#39;provider_authenticated&#39;,observedAtMs:NOW-300001}})); |
| v | const | 69 | no | const v=project(x=&gt;patch(x,{pairing:{...x.pairing!,enrollment:&#39;enrollment-required&#39;,tokenStatus:&#39;redeemed&#39;}})); |
| secret | const | 74 | no | const secret=&#39;a&#39;.repeat(64); |
| input | const | 75 | no | const input=fixture(); |
| v | const | 76 | no | const v=projectWave4OnboardingResume({...input,pairing:{...input.pairing!,enrollment:&#39;none&#39;,tokenStatus:&#39;issued&#39;,tokenExpiresAtMs:NOW,token:secret} as Wave4OnboardingInput[&#39;pairing&#39;]}); |
| v | const | 84 | no | const v=project(x=&gt;patch(x,{pairing:{...x.pairing!,enrollment:&#39;none&#39;,tokenStatus:&#39;replayed&#39;}})); |
| v | const | 91 | no | const v=project(x=&gt;patch(x,{pairing:{...x.pairing!,principal:{...principal,[key]:&#39;foreign&#39;}}})); |
| v | const | 98 | no | const v=project(x=&gt;patch(x,{host:{...x.host!,...change}})); |
| v | const | 108 | no | const v=project(x=&gt;patch(x,{host:{...x.host!,grant:{...x.host!.grant,ownerApproved:false}}})); |
| v | const | 120 | no | const v=project(x=&gt;patch(x,{host:{...x.host!,grant}})); |
| input | const | 126 | no | const input=fixture(); |
| v | const | 127 | no | const v=projectWave4OnboardingResume({...input,founder:{...input.founder,help:{...input.founder.help,visible:false}}}); |
| input | const | 133 | no | const input=fixture(); |
| hostile | const | 134 | no | const hostile={...input.founder,projects:[{...input.founder.projects[0]!,title:&#39;&lt;script&gt;alert(1)&lt;/script&gt;&#39;,summary:&#39;javascript:alert(1)&#39;}], |
| v | const | 136 | no | const v=projectWave4OnboardingResume({...input,founder:hostile}); |
| input | const | 143 | no | const input=fixture(); |
| v | const | 144 | no | const v=projectWave4OnboardingResume({...input,founder:{...input.founder,document:{...input.founder.document,document:{...input.founder.document.document!,scope:{ownerRef:&#39;other&#39;}}}} as Wave4Onboardi… |
| v | const | 148 | no | const v=project(x=&gt;patch(x,{action:{source:&#39;host&#39;,principal,state:&#39;pending&#39;,worldRevision:&#39;rev4&#39;,observedAtMs:NOW,signatureState:&#39;unknown&#39;}})); |
| v | const | 156 | no | const v=project(x=&gt;patch(x,{action:{source:&#39;host&#39;,principal,state:&#39;pending&#39;,worldRevision:&#39;rev4&#39;,observedAtMs:NOW-60001,signatureState:&#39;unknown&#39;}})); |
| action | const | 162 | no | const action={source:&#39;host&#39; as const,principal,state:&#39;applied&#39; as const,worldRevision:&#39;rev4&#39;,observedAtMs:NOW, |
| v | const | 164 | no | const v=project(x=&gt;patch(x,{action})); |
| bad | const | 167 | no | const bad=project(x=&gt;patch(x,{action:{...action,worldRevision:&#39;rev3&#39;}})); |
| unsigned | const | 169 | no | const unsigned=project(x=&gt;patch(x,{action:{...action,signatureState:&#39;unsigned&#39;}})); |
| missing | const | 171 | no | const missing=project(x=&gt;patch(x,{action:{...action,receiptRef:undefined}})); |
| input | const | 175 | no | const input=fixture(); |
| v | const | 176 | no | const v=projectWave4OnboardingResume({...input, action:{source:&#39;host&#39;,principal,state:&#39;applied&#39;,worldRevision:&#39;rev4&#39;,observedAtMs:NOW,signatureState:&#39;verified&#39;,receiptRef:&#39;receipt1&#39;}, hostRead:{...in… |
| v | const | 182 | no | const v=project(x=&gt;patch(x,{ action:{source:&#39;host&#39;,principal,state:&#39;denied&#39;,worldRevision:&#39;rev4&#39;,observedAtMs:NOW,signatureState:&#39;unknown&#39;}, reconnect:{source:&#39;host&#39;,principal,state:&#39;reconciled&#39;,worl… |
| v | const | 194 | no | const v=project(x=&gt;patch(x,{reconnect:{source:&#39;host&#39;,principal,state:&#39;reconciled&#39;,worldRevision:&#39;rev3&#39;,observedAtMs:NOW}})); |
| input | const | 200 | no | const input=fixture(); |
| v | const | 201 | no | const v=projectWave4OnboardingResume({...input,founder:{...input.founder,onboarding:{...input.founder.onboarding,cancelled:true}}}); |
| input | const | 212 | no | const input=fixture(); |
| before | const | 213 | no | const before=JSON.stringify(input); |
| v1 | const | 214 | no | const v1=projectWave4OnboardingResume(input); |
| v2 | const | 215 | no | const v2=projectWave4OnboardingResume(input); |
| v | const | 223 | no | const v=project(x=&gt;patch(x,{reconnect:{source:&#39;host&#39;,principal,state:&#39;resnapshot-required&#39;,worldRevision:&#39;rev4&#39;,observedAtMs:NOW}})); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert | import | 2 | external |
| ../../src/visual-runtime/experience/wave4-onboarding-resume.ts | import | 3 | [packages/tierflow/src/visual-runtime/experience/wave4-onboarding-resume.ts](../../src/visual-runtime/experience/wave4-onboarding-resume.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 228 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
