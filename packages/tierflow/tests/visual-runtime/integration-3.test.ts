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
      semanticVersion:semanticId.split('@')[1]!,actionId,risk,
      argsSchemaSha256:descriptorArgsDigest({})!,hostCatalogSha256:catalogHash,
      hqRegistrySha256:sha(HQ),reviewed:true}],deviceSurface:phone?'phone':'desktop',
    currentVersions:{hostWorld:'world-1',policy:'policy-1',kb:'kb-1',uiRevision:'0'},
  };
  const command=(surface:typeof MODES[number])=>({
    commandId:'cmd_'+surface,source:{surface,inputDigest:HEX},
    ...(surface==='text'?{text:toExactText(semanticId,{})!}:
      {selection:{semanticId,args:{}}}),
    expectedVersions:{hostWorld:'world-1',policy:'policy-1'},
  });
  const hostActions:HostActionDescriptor[]=[
    {actionId,catalogVersion:6,risk,readiness:'source_wired',requiredScopes:['control:read'],
      argsSchema:{},evidence:'verified',prerequisites:[]},
  ];
  const hostOptions={actions:hostActions,catalogVersion:6,catalogDigest:catalogHash};
  const hostContext:TrustedFixtureHostContext={
    schema:'fixture.trusted-host-context/1',authenticated:true,ownerRef:'owner_a',
    actorRef:'actor_a',deviceRef:phone?'phone_1':'desktop_1',sessionRef:'session_1',
    worldRef:'world_a',surface:phone?'phone':'desktop',
    nowMs:NOW,sessionExpiresAtMs:NOW+600_000,worldRevision:'world-1',
    policyRevision:'policy-1',catalogVersion:6,catalogDigest:catalogHash,
    availabilityByAction:{[actionId]:'yes'},
    grant:{grantRef:'host_grant',status:'active',ownerRef:'owner_a',actorRef:'actor_a',
      deviceRef:phone?'phone_1':'desktop_1',sessionRef:'session_1',worldRef:'world_a',
      expiresAtMs:NOW+600_000,revision:'grant-rev-1',scopes:['control:read']},
  };
  const previewHost=createHostCapabilityFixture(hostOptions);
  const p=phone?{...principal,deviceRef:'phone_1'}:principal;
  const input:Integration3Input={
    feed,query:{schema:'vivim.knowledge-query/1',requestId:'i3_req',personalWorldRef:'world_a',
      surface:phone?'android':'pc',purpose:'task',entityRef:FIXTURE_IDS.alpha,limit:1},
    founder:{knowledgeBroker:auth.broker,knowledgeClient:client,host:previewHost,hostContext,
      workspaceRef:'workspace_a',documentId:'founder_workspace',requestId:'founder_req',
      projectStableIds:[FIXTURE_IDS.alpha],
      commandInput:command('text'),commandContext:{rows:[],descriptors:[],
        currentVersions:descriptor.currentVersions},
      hostCatalogDigest:catalogHash,onboardingState:newJourney(),onboardingEvidence:{
        provider:{source:'studio',proof:'tab_ready',observedAtMs:NOW},
        owner:{source:'other',selectionConfirmed:'yes'}},
      viewportPx:360,nowMs:NOW},
    display:{documentId:'founder_workspace',workspaceRef:'workspace_a',revision:0,
      selectedStableId:FIXTURE_IDS.alpha,action:{id:actionId,version:1}},
    descriptor,modalities:{text:command('text'),touch:command('touch'),keyboard:command('keyboard')},
    world:{store,principal:p,verifyPrincipal:permit,document:world('Reviewed UI layout'),
      draftId:'draft_i3',commandId:'cas_i3',
      reviewedUiPublish:overrides.reviewedUiPublish??true,
      ...(overrides.fixtureAckLoss?{fault:'afterCommitAckLoss' as const}:{})},
    host:{options:hostOptions,context:hostContext},
  };
  return {input,auth,client,feed,store,dir,hostContext,descriptor};
}
function success(result:Awaited<ReturnType<typeof composeIntegration3>>) {
  // Capture the refusal detail before the assertion narrows the union, so the
  // failure message keeps naming the phase and code.
  const refusal=result.ok?null:result;
  assert.equal(result.ok,true,JSON.stringify(result));
  if(refusal)throw Error(refusal.phase+':'+refusal.code);
  return result;
}
function blocked(result:Awaited<ReturnType<typeof composeIntegration3>>,phase:string) {
  assert.equal(result.ok,false,JSON.stringify(result));
  if(result.ok)throw Error('UNEXPECTED_SUCCESS');
  assert.equal(result.phase,phase);
  assert.equal(result.effectInvoked,false);
  assert.equal(result.automaticRetryAllowed,false);
  return result;
}

test('VR3: actual F-A-B-D-G-C-H-E, scoped source, canonical identities, accessible 3 viewports and SQLite CAS',async()=>{
  const f=setup();
  const x=success(await composeIntegration3(f.input));
  assert.deepEqual(x.trace,['F','A','B','D','G','C','H','E']);
  assert.equal(x.evidenceClass,'synthetic-real-modules-not-live-acceptance');
  assert.equal(x.identity.exact,true);
  assert.equal(x.identity.canonicalNodes,3);
  assert.ok(x.identity.mappedNodes>=3);
  assert.equal(x.identity.actions,1);
  assert.equal(x.identity.bindings,1);
  assert.deepEqual(x.viewports.map(x=>x.viewportPx),[320,360,1280]);
  assert.ok(x.viewports.every(v=>v.status!=='unavailable' && v.rootTag==='main' && v.focusCount===1));
  assert.equal(x.command.actionId,'ui.theme.show');
  assert.equal(x.command.authorized,false);
  assert.deepEqual(x.command.modalities,MODES);
  assert.equal(x.world.schema,'UiDocument/1');
  assert.equal(x.world.committed,true);
  assert.equal(x.world.revision,2);
  assert.equal(x.world.replayVerified,true);
  assert.equal(f.store.currentRevision('world_a')?.revision,2);
  assert.equal(f.store.listRevisions('world_a',10).length,2);
  assert.equal(x.host.state,'display_only');
  assert.equal(x.host.effectInvoked,false);
  assert.equal(x.experience.helpVisible,true);
  assert.equal(x.experience.cancel,true);
  assert.equal(x.experience.resume,true);
  assert.equal(x.experience.focusReturn,'onboarding-current-step');
  assert.equal(x.automaticRetryAllowed,false);
  assert.equal(x.effectInvoked,false);
});

test('VR3: lost acknowledgement is reconciled through the durable journal without a second effect or retry',async()=>{
  const f=setup({fixtureAckLoss:true});
  const x=success(await composeIntegration3(f.input));
  assert.equal(x.world.ackLost,true);
  assert.equal(x.world.replayVerified,true);
  assert.equal(f.store.listRevisions('world_a',10).length,2);
  const replay=new UiAtomicReplay({store:f.store,ownerRef:'owner_a',verifyPrincipal:permit});
  assert.equal(replay.readCurrent(principal,'world_a').ok,true);
  assert.equal(replay.createDraft(principal,'duplicate_guard','world_a',
    {schema:'vivim.ui-document/1'}).ok,false);
});

test('VR3: precommit failure is not silently retried, no revision or command receipt written',async()=>{
  const f=setup();
  const failed=blocked(await composeIntegration3({...f.input,
    world:{...f.input.world,fault:'beforeCommit'}}),'C');
  assert.equal(failed.code,'NOT_FOUND');
  assert.equal(f.store.currentRevision('world_a')?.revision,1);
  assert.equal(f.store.getCommand('cas_i3'),null);
});

test('VR3: revoked and wrong-owner KB fail before creating a draft or a Host effect',async()=>{
  for(const contextDelta of [{revoked:true},{ownerRef:'owner_b'},{personalWorldRef:'world_b'},
    {deviceRef:'other_device'},{grantExpiresAt:NOW-1}]) {
    const f=setup();
    f.auth.setContext(fixtureTrustedContext({policyRevision:'policy-1',
      sessionExpiresAt:NOW+600_000,grantExpiresAt:NOW+600_000,...contextDelta}));
    const x=blocked(await composeIntegration3(f.input),'SCOPE');
    assert.equal(f.store.listDrafts().length,0);
    assert.equal(f.store.currentRevision('world_a')?.revision,1);
    assert.equal(x.effectInvoked,false);
  }
});

test('VR3: tombstone and gap require a resnapshot; no stale binding is elevated to display authority',async()=>{
  const f=setup();
  f.client.applyFixtureSourceEvent({type:'tombstone',stableId:FIXTURE_IDS.alpha});
  const removed=blocked(await composeIntegration3(f.input),'F');
  assert.equal(removed.code,'PRESENT_SCOPED_CARD_REQUIRED');
  const g=setup();
  g.feed.notice({sequence:3,kind:'changed'});
  const gap=blocked(await composeIntegration3(g.input),'F');
  assert.equal(gap.code,'KNOWLEDGE_RESNAPSHOT-REQUIRED');
  assert.equal(g.store.listDrafts().length,0);
});

test('VR3: bad persisted World schema / foreign world fails; never coerces Lane A document into SQLite',async()=>{
  const f=setup();
  const wrong=blocked(await composeIntegration3({...f.input,
    world:{...f.input.world,document:{schema:'vivim.ui-document/1',revision:0}}}),'C');
  assert.equal(wrong.code,'DISTINCT_WORLD_SCHEMA_REQUIRED');
  assert.equal(f.store.currentRevision('world_a')?.revision,1);
  const foreign=blocked(await composeIntegration3({...f.input,
    world:{...f.input.world,document:world('Foreign','world_other')}}),'C');
  assert.equal(foreign.code,'WRONG_WORLD');
  assert.equal(f.store.listDrafts().length,0);
});

test('VR3: tri-modal descriptor pins, identity and R2 phone policy refuse before a World write',async()=>{
  const f=setup();
  blocked(await composeIntegration3({...f.input,
    descriptor:{...f.descriptor,currentVersions:{...f.descriptor.currentVersions,policy:'policy-old'}}}),'G');
  assert.equal(f.store.listDrafts().length,0);
  const b=setup();
  blocked(await composeIntegration3({...b.input,
    display:{...b.input.display,action:{id:'ui.theme.mismatch',version:1}}}),'G');
  const phone=setup({phone:true,actionId:'privacy.hard_no.add',
    semanticId:'privacy.hard_no.add@1',risk:'R2'});
  const r=blocked(await composeIntegration3(phone.input),'G');
  assert.equal(r.code,'R2_DESKTOP_REQUIRED');
  assert.equal(phone.store.currentRevision('world_a')?.revision,1);
});

test('VR3: signed status cannot be forged from unsigned or missing Host receipt; recovery is non-executable',async()=>{
  const f=setup({reviewedUiPublish:false});
  const claim:HostClaimSnapshot={planId:'ctl-1',planDigest:HEX,actionId:'ui.theme.show',
    ownerRef:'owner_a',actorRef:'actor_a',deviceRef:'desktop_1',sessionRef:'session_1',
    worldRef:'world_a',worldRevision:'world-1',state:'claimed'};
  const receipt:HostReceiptObservation={receipt:{schema:'vivim.control-receipt/1',
    planId:'ctl-1',planDigest:HEX,actionId:'ui.theme.show',status:'applied',
    receiptRef:'receipt-1',worldRevision:'world-1'},
    evidence:{kind:'unsigned-general-journal'}};
  const unsigned=success(await composeIntegration3({...f.input,host:{...f.input.host,claim,observation:receipt}}));
  assert.equal(unsigned.world.committed,false);
  assert.equal(unsigned.host.receiptState,'uncertain');
  assert.equal(unsigned.host.receiptReasonCode,'UNSIGNED_RECEIPT_NOT_AUTHORITATIVE');
  const missing=success(await composeIntegration3({...f.input,host:{...f.input.host,claim,observation:null}}));
  assert.equal(missing.host.receiptState,'uncertain');
  assert.equal(missing.host.receiptReasonCode,'CLAIM_WITHOUT_RECEIPT');
  assert.equal(f.store.currentRevision('world_a')?.revision,1);
});

test('VR3: unsafe KB HTML/URL cannot be promoted to canonical Founder display; E denies before CAS',async()=>{
  const rows=canonicalKnowledgeFixtures().map(r=>r.stableId!==FIXTURE_IDS.alpha?r:
    {...r,label:'<img src=x onerror=alert(1)>',summary:'javascript:alert(1)'});
  const f=setup({rows});
  // Lane F escapes the HTML label, but the `javascript:` summary survives the
  // projection, so Lane A's own document grammar refuses it first (UNSAFE_VALUE).
  // The refusal is therefore at phase A: hostile KB text never becomes a
  // canonical Founder display document at all, which is strictly earlier than
  // the E preflight the original expectation assumed.
  const refused=blocked(await composeIntegration3(f.input),'A');
  assert.equal(refused.code,'INVALID_DOCUMENT');
  assert.equal(f.store.listDrafts().length,0);
  assert.equal(f.store.currentRevision('world_a')?.revision,1);
  // Lane E independently refuses the same hostile source, so the E-denies
  // property holds on its own and not only as a consequence of the A refusal.
  const journey=await projectFounderWorkspaceJourney(f.input.founder);
  assert.equal(journey.state,'empty');
  assert.equal(journey.projects.length,0);
  const serialized=JSON.stringify(journey);
  assert.ok(!serialized.includes('<img'),'hostile HTML must not reach the journey projection');
  assert.ok(!serialized.includes('javascript:'),'hostile URL must not reach the journey projection');
});

test('VR3: existing SQLite/WAL writer exclusivity remains in force; no second store',()=>{
  const f=setup();
  const other=new UiStore({path:join(f.dir,'ui.db')});
  assert.throws(()=>other.open(),(e:unknown)=>e instanceof UiStoreError&&e.code==='STORE_LOCKED');
  assert.equal(f.store.currentRevision('world_a')?.revision,1);
});
