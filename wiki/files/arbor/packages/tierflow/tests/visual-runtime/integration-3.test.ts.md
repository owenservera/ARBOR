# File: packages/tierflow/tests/visual-runtime/integration-3.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/integration-3.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 17402 B |
| Lines | 301 |
| Hash | 045e0177cad1 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NOW | const | 27 | no | const NOW=Date.parse(&#39;2026-11-06T17:00:00.000Z&#39;); |
| sha | function | 28 | no | const sha=(s:string)=&gt;createHash(&#39;sha256&#39;).update(s).digest(&#39;hex&#39;); |
| HQ | const | 29 | no | const HQ=&#39;fixture HQ registry bytes; no live action-registry claim&#39;; |
| HEX | const | 30 | no | const HEX=&#39;a&#39;.repeat(64); |
| MODES | const | 31 | no | const MODES=[&#39;text&#39;,&#39;touch&#39;,&#39;keyboard&#39;] as const; |
| dirs | const | 32 | no | const dirs:string[]=[]; |
| stores | const | 33 | no | const stores:UiStore[]=[]; |
| principal | const | 34 | no | const principal:VerifiedUiPrincipal={ownerRef:&#39;owner_a&#39;,actorRef:&#39;actor_a&#39;,deviceRef:&#39;desktop_1&#39;, |
| permit | function | 37 | no | const permit=(p:VerifiedUiPrincipal)=&gt;p.grantRef===&#39;ui_grant&#39; &amp;&amp; |
| world | function | 39 | no | function world(title:string,id=&#39;world_a&#39;):WorldDocument { |
| setup | function | 45 | no | function setup( overrides:Readonly&lt;{ rows?:CanonicalKnowledgeRecord[]; actionId?:string; semanticId?:string; |
| dir | const | 56 | no | const dir=mkdtempSync(join(tmpdir(),&#39;tierflow-i3-&#39;));dirs.push(dir); |
| store | const | 57 | no | const store=openUiStore({path:join(dir,&#39;ui.db&#39;)});stores.push(store); |
| seed | const | 58 | no | const seed=world(&#39;Seed&#39;); |
| phone | const | 61 | no | const phone=overrides.phone===true; |
| actionId | const | 62 | no | const actionId=overrides.actionId??&#39;ui.theme.show&#39;; |
| semanticId | const | 63 | no | const semanticId=overrides.semanticId??&#39;ui.theme.show@1&#39;; |
| risk | const | 64 | no | const risk=overrides.risk??&#39;R0&#39;; |
| context | const | 65 | no | const context=fixtureTrustedContext({policyRevision:&#39;policy-1&#39;, surface:phone?&#39;android&#39;:&#39;pc&#39;,deviceRef:phone?&#39;phone_1&#39;:&#39;desktop_1&#39;, sessionExpiresAt:NOW+600_000,grantExpiresAt:NOW+600_000}); |
| auth | const | 68 | no | const auth=mutableFixtureBroker(context); |
| client | const | 69 | no | const client=createFixtureKnowledgeClient(overrides.rows??canonicalKnowledgeFixtures(),auth.broker,{now:()=&gt;NOW}); |
| feed | const | 70 | no | const feed=createScopedKnowledgeFeed(client,auth.broker,{now:()=&gt;NOW}); |
| actions | const | 71 | no | const actions=[{id:actionId,risk,readiness:&#39;source_wired&#39; as const,args:{}}]; |
| catalogText | const | 72 | no | const catalogText=JSON.stringify({schema:&#39;vivim.control-action-catalog/1&#39;,version:6, policy:{allUserFacingActionsRequireTextPath:true,uiSharesTypedExecutor:true, unverifiedActionsAreNotAvailable:true… |
| catalogHash | const | 76 | no | const catalogHash=sha(catalogText); |
| descriptor | const | 77 | no | const descriptor:DescriptorProofContext={ |
| command | function | 86 | no | const command=(surface:typeof MODES[number])=&gt;({ commandId:&#39;cmd_&#39;+surface,source:{surface,inputDigest:HEX}, ...(surface===&#39;text&#39;?{text:toExactText(semanticId,{})!}: {selection:{semanticId,args:{}}}),… |
| hostActions | const | 92 | no | const hostActions:HostActionDescriptor[]=[ |
| hostOptions | const | 96 | no | const hostOptions={actions:hostActions,catalogVersion:6,catalogDigest:catalogHash}; |
| hostContext | const | 97 | no | const hostContext:TrustedFixtureHostContext={ |
| previewHost | const | 108 | no | const previewHost=createHostCapabilityFixture(hostOptions); |
| p | const | 109 | no | const p=phone?{...principal,deviceRef:&#39;phone_1&#39;}:principal; |
| input | const | 110 | no | const input:Integration3Input={ |
| success | function | 133 | no | function success(result:Awaited&lt;ReturnType&lt;typeof composeIntegration3&gt;&gt;) { |
| refusal | const | 136 | no | const refusal=result.ok?null:result; |
| blocked | function | 141 | no | function blocked(result:Awaited&lt;ReturnType&lt;typeof composeIntegration3&gt;&gt;,phase:string) { |
| f | const | 151 | no | const f=setup(); |
| x | const | 152 | no | const x=success(await composeIntegration3(f.input)); |
| f | const | 182 | no | const f=setup({fixtureAckLoss:true}); |
| x | const | 183 | no | const x=success(await composeIntegration3(f.input)); |
| replay | const | 187 | no | const replay=new UiAtomicReplay({store:f.store,ownerRef:&#39;owner_a&#39;,verifyPrincipal:permit}); |
| f | const | 194 | no | const f=setup(); |
| failed | const | 195 | no | const failed=blocked(await composeIntegration3({...f.input, world:{...f.input.world,fault:&#39;beforeCommit&#39;}}),&#39;C&#39;); |
| f | const | 205 | no | const f=setup(); |
| x | const | 208 | no | const x=blocked(await composeIntegration3(f.input),&#39;SCOPE&#39;); |
| f | const | 216 | no | const f=setup(); |
| removed | const | 218 | no | const removed=blocked(await composeIntegration3(f.input),&#39;F&#39;); |
| g | const | 220 | no | const g=setup(); |
| gap | const | 222 | no | const gap=blocked(await composeIntegration3(g.input),&#39;F&#39;); |
| f | const | 228 | no | const f=setup(); |
| wrong | const | 229 | no | const wrong=blocked(await composeIntegration3({...f.input, world:{...f.input.world,document:{schema:&#39;vivim.ui-document/1&#39;,revision:0}}}),&#39;C&#39;); |
| foreign | const | 233 | no | const foreign=blocked(await composeIntegration3({...f.input, world:{...f.input.world,document:world(&#39;Foreign&#39;,&#39;world_other&#39;)}}),&#39;C&#39;); |
| f | const | 240 | no | const f=setup(); |
| b | const | 244 | no | const b=setup(); |
| phone | const | 247 | no | const phone=setup({phone:true,actionId:&#39;privacy.hard_no.add&#39;, semanticId:&#39;privacy.hard_no.add@1&#39;,risk:&#39;R2&#39;}); |
| r | const | 249 | no | const r=blocked(await composeIntegration3(phone.input),&#39;G&#39;); |
| f | const | 255 | no | const f=setup({reviewedUiPublish:false}); |
| claim | const | 256 | no | const claim:HostClaimSnapshot={planId:&#39;ctl-1&#39;,planDigest:HEX,actionId:&#39;ui.theme.show&#39;, |
| receipt | const | 259 | no | const receipt:HostReceiptObservation={receipt:{schema:&#39;vivim.control-receipt/1&#39;, |
| unsigned | const | 263 | no | const unsigned=success(await composeIntegration3({...f.input,host:{...f.input.host,claim,observation:receipt}})); |
| missing | const | 267 | no | const missing=success(await composeIntegration3({...f.input,host:{...f.input.host,claim,observation:null}})); |
| rows | const | 274 | no | const rows=canonicalKnowledgeFixtures().map(r=&gt;r.stableId!==FIXTURE_IDS.alpha?r: {...r,label:&#39;&lt;img src=x onerror=alert(1)&gt;&#39;,summary:&#39;javascript:alert(1)&#39;}); |
| f | const | 276 | no | const f=setup({rows}); |
| refused | const | 282 | no | const refused=blocked(await composeIntegration3(f.input),&#39;A&#39;); |
| journey | const | 288 | no | const journey=await projectFounderWorkspaceJourney(f.input.founder); |
| serialized | const | 291 | no | const serialized=JSON.stringify(journey); |
| f | const | 297 | no | const f=setup(); |
| other | const | 298 | no | const other=new UiStore({path:join(f.dir,&#39;ui.db&#39;)}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 4 | external |
| node:assert/strict | import | 5 | external |
| node:crypto | import | 6 | external |
| node:fs | import | 7 | external |
| node:path | import | 8 | external |
| node:os | import | 9 | external |
| ../../src/visual-runtime/integration-3/compose.ts | import | 10 | [packages/tierflow/src/visual-runtime/integration-3/compose.ts](../../src/visual-runtime/integration-3/compose.ts.md) |
| ../../src/visual-runtime/knowledge/client.ts | import | 11 | [packages/tierflow/src/visual-runtime/knowledge/client.ts](../../src/visual-runtime/knowledge/client.ts.md) |
| ../../src/visual-runtime/knowledge/fixtures.ts | import | 12 | [packages/tierflow/src/visual-runtime/knowledge/fixtures.ts](../../src/visual-runtime/knowledge/fixtures.ts.md) |
| ../../src/visual-runtime/knowledge/wave3-feed-projection.ts | import | 13 | [packages/tierflow/src/visual-runtime/knowledge/wave3-feed-projection.ts](../../src/visual-runtime/knowledge/wave3-feed-projection.ts.md) |
| ../../src/visual-runtime/host/fixture.ts | import | 14 | [packages/tierflow/src/visual-runtime/host/fixture.ts](../../src/visual-runtime/host/fixture.ts.md) |
| ../../src/visual-runtime/command/wave3-descriptor-proof.ts | import | 15 | [packages/tierflow/src/visual-runtime/command/wave3-descriptor-proof.ts](../../src/visual-runtime/command/wave3-descriptor-proof.ts.md) |
| ../../src/visual-runtime/command/wave3-descriptor-proof.ts | import | 16 | [packages/tierflow/src/visual-runtime/command/wave3-descriptor-proof.ts](../../src/visual-runtime/command/wave3-descriptor-proof.ts.md) |
| ../../src/visual-runtime/command/compile.ts | import | 17 | [packages/tierflow/src/visual-runtime/command/compile.ts](../../src/visual-runtime/command/compile.ts.md) |
| ../../src/visual-runtime/experience/onboarding.ts | import | 18 | [packages/tierflow/src/visual-runtime/experience/onboarding.ts](../../src/visual-runtime/experience/onboarding.ts.md) |
| ../../src/visual-runtime/experience/wave3-journey-fixture.ts | import | 19 | [packages/tierflow/src/visual-runtime/experience/wave3-journey-fixture.ts](../../src/visual-runtime/experience/wave3-journey-fixture.ts.md) |
| ../../src/ui/store.ts | import | 20 | [packages/tierflow/src/ui/store.ts](../../src/ui/store.ts.md) |
| ../../src/ui/hash.ts | import | 21 | [packages/tierflow/src/ui/hash.ts](../../src/ui/hash.ts.md) |
| ../../src/visual-runtime/revisions/wave3-atomic-replay.ts | import | 22 | [packages/tierflow/src/visual-runtime/revisions/wave3-atomic-replay.ts](../../src/visual-runtime/revisions/wave3-atomic-replay.ts.md) |
| ../../src/ui/types.ts | import | 23 | [packages/tierflow/src/ui/types.ts](../../src/ui/types.ts.md) |
| ../../src/visual-runtime/revisions/port.ts | import | 24 | [packages/tierflow/src/visual-runtime/revisions/port.ts](../../src/visual-runtime/revisions/port.ts.md) |
| ../../src/visual-runtime/host/port.ts | import | 25 | [packages/tierflow/src/visual-runtime/host/port.ts](../../src/visual-runtime/host/port.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/** Integration 3 closure: real A-H modules, synthetic EXTERNAL KB/Host source,
 * real single-writer UiStore on SQLite/WAL. No mocked lane modules or live effects.
 */
import test, {afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {composeIntegration3, type Integration3Input} from '../../src/visual-runtime/integration-3/compose.ts';
import {createFixtureKnowledgeClient, type CanonicalKnowledgeRecord} from '../../src/visual-runtime/knowledge/client.ts';
import {canonicalKnowledgeFixtures,FIXTURE_IDS,fixtureTrustedContext,mutableFixtureBroker} from '../../src/visual-runtime/knowledge/fixtures.ts';
import {createScopedKnowledgeFeed} from '../../src/visual-runtime/knowledge/wave3-feed-projection.ts';
import {createHostCapabilityFixture} from '../../src/visual-runtime/host/fixture.ts';
import {descriptorArgsDigest, type DescriptorProofContext} from '../../src/visual-runtime/command/wave3-descriptor-proof.ts';
import {compileDescriptorProof} from '../../src/visual-runtime/command/wave3-descriptor-proof.ts';
import {toExactText} from '../../src/visual-runtime/command/compile.ts';
import {newJourney} from '../../src/visual-runtime/experience/onboarding.ts';
import {projectFounderWorkspaceJourney} from '../../src/visual-runtime/experience/wave3-journey-fixture.ts';
import {openUiStore,UiStore,UiStoreError} from '../../src/ui/store.ts';
import {contentHash} from '../../src/ui/hash.ts';
import {UiAtomicReplay} from '../../src/visual-runtime/revisions/wave3-atomic-replay.ts';
import type {UiDocument as WorldDocument} from '../../src/ui/types.ts';
import type {VerifiedUiPrincipal} from '../../src/visual-runtime/revisions/port.ts';
import type {HostActionDescriptor,TrustedFixtureHostContext,HostClaimSnapshot,HostReceiptObservation} from '../../src/visual-runtime/host/port.ts';

const NOW=Date.parse('2026-11-06T17:00:00.000Z');
const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
const HQ='fixture HQ registry bytes; no live action-registry claim';
const HEX='a'.repeat(64);
const MODES=['text','touch','keyboard'] as const;
const dirs:string[]=[];
const stores:UiStore[]=[];
const principal:VerifiedUiPrincipal={ownerRef:'owner_a',actorRef:'actor_a',deviceRef:'desktop_1',
  sessionRef:'session_1',grantRef:'ui_grant',policyRevision:'policy-1',
  scopes:['ui:read','ui:draft','ui:publish','ui:rollback']};
const permit=(p:VerifiedUiPrincipal)=>p.grantRef==='ui_grant' &&
  p.sessionRef==='session_1' && p.policyRevision==='policy-1';
function world(title:string,id='world_a'):WorldDocument {
  return {schemaVersion:1,world:{id,kind:'custom',title,accent:'#f2b134',
    origin:{x:0,y:0,z:0},unitsPerMeter:1},objects:[],relationships:[],dataFlows:[]};
}
afterEach(()=>{for(const store of stores.splice(0))store.close();
  for(const dir of dirs.splice(0))rmSync(dir,{recursive:true,force:true});});
function setup(
  overrides:Readonly<{
    rows?:CanonicalKnowledgeRecord[];
    actionId?:string;
    semanticId?:string;
    risk?:'R0'|'R1'|'R2'|'R3';
    phone?:boolean;
    fixtureAckLoss?:boolean;
    reviewedUiPublish?:boolean;
  }>={},
) {
  const dir=mkdtempSync(join(tmpdir(),'tierflow-i3-'));dirs.push(dir);
  const store=openUiStore({path:join(dir,'ui.db')});stores.push(store);
  const seed=world('Seed');
  store.publish({worldId:'world_a',document:seed,contentHash:contentHash(seed),
    expectedRevision:0,actorId:'trusted-seed'});
  const phone=overrides.phone===true;
  const actionId=overrides.actionId??'ui.theme.show';
  const semanticId=overrides.semanticId??'ui.theme.show@1';
  const risk=overrides.risk??'R0';
  const context=fixtureTrustedContext({policyRevision:'policy-1',
    surface:phone?'android':'pc',deviceRef:phone?'phone_1':'desktop_1',
    sessionExpiresAt:NOW+600_000,grantExpiresAt:NOW+600_000});
  const auth=mutableFixtureBroker(context);
  const client=createFixtureKnowledgeClient(overrides.rows??canonicalKnowledgeFixtures(),auth.broker,{now:()=>NOW});
  const feed=createScopedKnowledgeFeed(client,auth.broker,{now:()=>NOW});
  const actions=[{id:actionId,risk,readiness:'source_wired' as const,args:{}}];
  const catalogText=JSON.stringify({schema:'vivim.control-action-catalog/1',version:6,
    policy:{allUserFacingActionsRequireTextPath:true,uiSharesTypedExecutor:true,
      unverifiedActionsAreNotAvailable:true,modelRole:'candidate_only',
      sourceWiredIsNotLiveAcceptance:true},actions});
  const catalogHash=sha(catalogText);
  const descriptor:DescriptorProofContext={
    schema:'vivim.descriptor-proof-context-fixture/1',catalogText,
    expectedCatalogSha256:catalogHash,hqRegistryText:HQ,expectedHqRegistrySha256:sha(HQ),
    reviews:[{schema:'vivim.reviewed-host-binding-fixture/1',semanticId,
```

_First 80 of 302 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
