# File: packages/tierflow/tests/visual-runtime/wave4-b-phone-adapter.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/wave4-b-phone-adapter.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 14865 B |
| Lines | 240 |
| Hash | 6fef018e3dd2 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| fixture | function | 8 | no | function fixture(width = 320): PhoneProjectionInput { |
| root | const | 9 | no | const root = { |
| mutable | function | 51 | no | function mutable(width=320): PhoneProjectionInput { |
| set | function | 54 | no | function set&lt;T extends object,K extends keyof T&gt;(object:T,key:K,value:T[K]):void { |
| absent | function | 57 | no | function absent(input:PhoneProjectionInput,code:string):void { |
| v | const | 58 | no | const v=projectWave4PhoneAdapter(input); |
| value | const | 71 | no | const value=projectWave4PhoneAdapter(fixture(width)); |
| button | const | 78 | no | const button=value.root.children[1]!; |
| input | const | 95 | no | const input=fixture(),view=projectWave4PhoneAdapter(input); |
| touch | const | 96 | no | const touch=projectWave4PhoneEvent(input,view,{kind:&#39;touch&#39;,eventId:&#39;evt_touch&#39;,nodeId:&#39;preview&#39;,risk:&#39;R1&#39;}); |
| talkback | const | 97 | no | const talkback=projectWave4PhoneEvent(input,view,{kind:&#39;talkback&#39;,eventId:&#39;evt_talkback&#39;,nodeId:&#39;preview&#39;,risk:&#39;R1&#39;}); |
| input | const | 109 | no | const input=fixture(), view=projectWave4PhoneAdapter(input); |
| r | const | 110 | no | const r=projectWave4PhoneEvent(input,view,{kind:&#39;back&#39;,eventId:&#39;evt_back&#39;}); |
| replay | const | 116 | no | const replay=mutable();set(replay.pairing,&#39;receivedSequence&#39;,50);absent(replay,&#39;PAIRING_REPLAY&#39;); |
| gap | const | 117 | no | const gap=mutable();set(gap.pairing,&#39;receivedSequence&#39;,55);absent(gap,&#39;RESNAPSHOT_REQUIRED&#39;); |
| unpaired | const | 118 | no | const unpaired=mutable();set(unpaired.pairing,&#39;state&#39;,&#39;unpaired&#39;);absent(unpaired,&#39;PAIRING_REQUIRED&#39;); |
| revoked | const | 119 | no | const revoked=mutable();set(revoked.pairing,&#39;state&#39;,&#39;revoked&#39;);absent(revoked,&#39;PAIRING_REQUIRED&#39;); |
| x | const | 124 | no | const x=mutable();set(x.pairing,changed,&#39;foreign&#39;);absent(x,&#39;PAIRING_IDENTITY_MISMATCH&#39;); |
| epoch | const | 126 | no | const epoch=mutable();set(epoch.pairing,&#39;epoch&#39;,2);absent(epoch,&#39;PAIRING_IDENTITY_MISMATCH&#39;); |
| withToken | const | 130 | no | const withToken=mutable();(withToken.pairing as unknown as Record&lt;string,unknown&gt;).pairingToken=&#39;a&#39;.repeat(64); |
| withSecret | const | 132 | no | const withSecret=mutable();(withSecret.host as unknown as Record&lt;string,unknown&gt;).grantId=&#39;b&#39;.repeat(32); |
| withQr | const | 134 | no | const withQr=mutable();(withQr.rendered.plan.root.children[0] as unknown as {text:string}).text=&#39;c&#39;.repeat(64); |
| withLink | const | 136 | no | const withLink=mutable();(withLink.rendered.plan.root.children[0] as unknown as {text:string}).text=&#39;vivim://pair?token=123&#39;; |
| expired | const | 141 | no | const expired=mutable();set(expired.pairing,&#39;expiresAtMs&#39;,100000);absent(expired,&#39;PAIRING_EXPIRED&#39;); |
| stale | const | 142 | no | const stale=mutable();set(stale.host,&#39;grantExpiresAtMs&#39;,100000);absent(stale,&#39;STALE_AUTHORIZATION&#39;); |
| stalePolicy | const | 143 | no | const stalePolicy=mutable();set(stalePolicy.host,&#39;policyRevision&#39;,-1);absent(stalePolicy,&#39;STALE_AUTHORIZATION&#39;); |
| denied | const | 147 | no | const denied=mutable();set(denied.host,&#39;denied&#39;,true);absent(denied,&#39;HOST_DENIED&#39;); |
| offline | const | 148 | no | const offline=mutable();set(offline.host,&#39;state&#39;,&#39;offline&#39;);absent(offline,&#39;HOST_OFFLINE&#39;); |
| disconnected | const | 149 | no | const disconnected=mutable();set(disconnected.host,&#39;state&#39;,&#39;disconnected&#39;);absent(disconnected,&#39;HOST_OFFLINE&#39;); |
| view | const | 150 | no | const view=projectWave4PhoneAdapter(fixture()); |
| deniedEvent | const | 151 | no | const deniedEvent=projectWave4PhoneEvent(denied,view,{kind:&#39;touch&#39;,eventId:&#39;evt_a&#39;,nodeId:&#39;preview&#39;,risk:&#39;R1&#39;}); |
| staleHost | const | 156 | no | const staleHost=mutable();set(staleHost.host,&#39;documentRevision&#39;,8);absent(staleHost,&#39;STALE_DOCUMENT&#39;); |
| staleRender | const | 157 | no | const staleRender=mutable();set(staleRender.rendered.plan,&#39;revision&#39;,8);absent(staleRender,&#39;RENDER_REFUSED&#39;); |
| mismatchedViewport | const | 158 | no | const mismatchedViewport=mutable();set(mismatchedViewport.rendered.plan,&#39;viewportPx&#39;,360);absent(mismatchedViewport,&#39;RENDER_REFUSED&#39;); |
| badAction | const | 162 | no | const badAction=mutable();set(badAction.rendered.actions[0]!,&#39;version&#39;,2);absent(badAction,&#39;CANONICAL_MISMATCH&#39;); |
| badProvenance | const | 163 | no | const badProvenance=mutable();set(badProvenance.rendered.provenance[0]!,&#39;provenanceRef&#39;,&#39;wrong&#39;);absent(badProvenance,&#39;CANONICAL_MISMATCH&#39;); |
| badAuthorization | const | 164 | no | const badAuthorization=mutable();(badAuthorization.rendered.provenance[0]! as unknown as {authorized:boolean}).authorized=true;absent(badAuthorization,&#39;CANONICAL_MISMATCH&#39;); |
| input | const | 168 | no | const input=fixture(),view=projectWave4PhoneAdapter(input); |
| candidate | const | 170 | no | const candidate=mutable();set(candidate.host.actionRisks[0]!,&#39;risk&#39;,risk); |
| current | const | 171 | no | const current=projectWave4PhoneAdapter(candidate); |
| r | const | 173 | no | const r=projectWave4PhoneEvent(candidate,current,{kind:&#39;talkback&#39;,eventId:&#39;evt_&#39;+risk,nodeId:&#39;preview&#39;,risk:&#39;R1&#39;}); |
| input | const | 179 | no | const input=fixture(),view=projectWave4PhoneAdapter(input); |
| event | const | 180 | no | const event={kind:&#39;touch&#39;,eventId:&#39;evt_123&#39;,nodeId:&#39;preview&#39;,risk:&#39;R1&#39;} as const; |
| r | const | 182 | no | const r=projectWave4PhoneEvent(input,view,event,[&#39;evt_123&#39;]); |
| input | const | 188 | no | const input=fixture(),view=projectWave4PhoneAdapter(input); |
| r | const | 193 | no | const r=projectWave4PhoneEvent(input,view,event); |
| second | const | 200 | no | const second=mutable();set(second.shell,&#39;publisher&#39;,&#39;independent&#39; as &#39;harness&#39;);absent(second,&#39;DUPLICATE_PUBLISHER&#39;); |
| secondApk | const | 201 | no | const secondApk=mutable();set(secondApk.shell,&#39;app&#39;,&#39;another-apk&#39; as &#39;existing-vivim-apk&#39;);absent(secondApk,&#39;WRONG_SHELL&#39;); |
| wrongOwner | const | 202 | no | const wrongOwner=mutable();set(wrongOwner.canonical.scope,&#39;ownerRef&#39;,&#39;owner_b&#39;);absent(wrongOwner,&#39;PAIRING_IDENTITY_MISMATCH&#39;); |
| handler | const | 206 | no | const handler=mutable();(handler.rendered.plan.root.attributes as unknown as Record&lt;string,unknown&gt;).onclick=&#39;evil&#39;;absent(handler,&#39;UNSAFE_RENDER&#39;); |
| markup | const | 207 | no | const markup=mutable();(markup.rendered.plan.root.children[0] as unknown as {text:string}).text=&#39;&lt;img src=x onerror=alert(1)&gt;&#39;; |
| talkback | const | 209 | no | const talkback=mutable();(talkback.rendered.plan.root.children[1]!.attributes as unknown as Record&lt;string,unknown&gt;)[&#39;aria-label&#39;]=&#39;javascript:alert(1)&#39;; |
| touch | const | 214 | no | const touch=mutable();set(touch.rendered.plan.root.children[1]!.layout,&#39;minTargetPx&#39;,20);absent(touch,&#39;UNSAFE_RENDER&#39;); |
| focus | const | 215 | no | const focus=mutable();set(focus.rendered.plan,&#39;focusOrder&#39;,[&#39;project&#39;]);absent(focus,&#39;CANONICAL_MISMATCH&#39;); |
| input | const | 220 | no | const input=mutable();set(input.host.actionRisks[0]!,&#39;risk&#39;,risk); |
| view | const | 221 | no | const view=projectWave4PhoneAdapter(input); |
| result | const | 222 | no | const result=projectWave4PhoneEvent(input,view,{kind:&#39;touch&#39;,eventId:&#39;evt_forge&#39;+risk,nodeId:&#39;preview&#39;,risk:&#39;R0&#39;}); |
| missing | const | 226 | no | const missing=mutable();set(missing.host,&#39;actionRisks&#39;,[]);absent(missing,&#39;CANONICAL_MISMATCH&#39;); |
| policy | const | 227 | no | const policy=mutable();set(policy.host.actionRisks[0]!,&#39;policyRevision&#39;,8);absent(policy,&#39;STALE_AUTHORIZATION&#39;); |
| mismatch | const | 228 | no | const mismatch=fixture(),view=projectWave4PhoneAdapter(mismatch); |
| action | const | 229 | no | const action=projectWave4PhoneEvent(mismatch,view,{kind:&#39;touch&#39;,eventId:&#39;evt_wrong&#39;,nodeId:&#39;preview&#39;,risk:&#39;R0&#39;}); |
| input | const | 234 | no | const input=fixture();const output=projectWave4PhoneAdapter(input); |
| action | const | 235 | no | const action=projectWave4PhoneEvent(input,output,{kind:&#39;touch&#39;,eventId:&#39;evt_safe&#39;,nodeId:&#39;preview&#39;,risk:&#39;R1&#39;}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/visual-runtime/device/wave4-phone-adapter.ts | import | 3 | [packages/tierflow/src/visual-runtime/device/wave4-phone-adapter.ts](../../src/visual-runtime/device/wave4-phone-adapter.ts.md) |
| ../../src/visual-runtime/device/wave4-phone-adapter.ts | import | 5 | [packages/tierflow/src/visual-runtime/device/wave4-phone-adapter.ts](../../src/visual-runtime/device/wave4-phone-adapter.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 241 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
