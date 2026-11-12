import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createDcbV2Planner } from '../../src/context/dcb-v2-planner.mjs';

const T='2026-11-10T06:00:00.000Z';
const sha=text=>createHash('sha256').update(text).digest('hex');
const audience={principalRef:'owner:one',projectRef:'project:one',
  destinationProvider:'claude',destinationModelVerified:true};
function fixture({ classification='source', sensitivity='internal' }={}) {
  let text='VIVIM decision: reuse the existing composer.';
  let revision='rev1';
  let lookupCount=0;
  let enabled=true,definitionRevision=1,mutateDefinitionOnRead=false;
  const ref='notes/context';
  const definitionStore={
    resolve:(id,{at})=>{
      assert.equal(at,T);
      return {bundleId:id,sourceRefs:[ref],flavorRefs:['project','research'],
        dependencies:[{ref:id,revision:definitionRevision}]};
    },
  };
  const sourceAdapters={
    resolveSources:async()=>{lookupCount++;
      return enabled?[{ref,revision,sha256:sha(text),classification,sensitivity,
        layer:'L3Entity',trust:'owner_confirmed',keywords:['decision','context'],
        principalRef:audience.principalRef,projectRef:audience.projectRef,
        updatedAt:T,priority:1}]:[];
    },
    readSource:async()=>{if(mutateDefinitionOnRead)definitionRevision++;
      return {revision,text,sha256:sha(text)};},
  };
  const planner=createDcbV2Planner({definitionStore,sourceAdapters});
  const scope={allowedRefs:[ref],allowedPrefixes:[],maxSensitivity:sensitivity};
  const request={bundleId:'dcb:demo',taskRef:'task:demo',taskText:'Research the decision',
    audience,scope,disclosure:null,profile:'continuum',purpose:'personal_continuum',
    maxInputTokens:1600,reservedForUserPrompt:200,reservedForOutput:200,now:T};
  return {planner,request,
    mutate:(next)=>{text=next;revision='rev2';},
    unavailable:()=>{enabled=false;},
    driftDefinition:()=>{mutateDefinitionOnRead=true;},
    count:()=>lookupCount,
  };
}

test('complete self-sufficient packet reuses v1 composer and binds v2 ancestry',async()=>{
  const {planner,request}=fixture();
  const out=await planner.plan(request);
  assert.equal(out.schema,'vivim.dynamic-context-packet/2');
  assert.equal(out.complete,true);
  assert.equal(out.transferable,true);
  assert.equal(out.isSendAuthorized,false);
  assert.equal(out.manifest.schema,'vivim.dynamic-context-bundle/1');
  assert.deepEqual(out.selectedFlavors,['project','research']);
  assert.deepEqual(out.definitionRevisions,[{ref:'dcb:demo',revision:1}]);
  assert.equal(out.preview.included[0].ref,'notes/context');
  assert.ok(out.fragment.includes('UNTRUSTED DATA'));
});
test('same source and task are deterministic, every request re-reads context',async()=>{
  const f=fixture();
  const first=await f.planner.plan(f.request);
  const replay=await f.planner.plan(f.request);
  assert.equal(first.packetDigest,replay.packetDigest);
  assert.equal(f.count(),2);
  const next=await f.planner.plan({...f.request,taskText:'Summarize the decision'});
  assert.notEqual(first.packetDigest,next.packetDigest);
  f.mutate('New verified decision: use VIVIM World authority.');
  const updated=await f.planner.plan(f.request);
  assert.notEqual(first.packetDigest,updated.packetDigest);
});
test('a mid-read definition update invalidates the packet before any send candidate exists',async()=>{
  const f=fixture();
  f.driftDefinition();
  await assert.rejects(f.planner.plan(f.request),{code:'DCB_V2_DEFINITION_DRIFT'});
});
test('source scope absent fails before reading private source content',async()=>{
  const f=fixture();
  await assert.rejects(f.planner.plan({...f.request,scope:{...f.request.scope,allowedRefs:[]}}),
    {code:'DCB_V2_SCOPE'});
  assert.equal(f.count(),0);
});
test('unavailable required source fails closed instead of silently dropping context',async()=>{
  const f=fixture();f.unavailable();
  await assert.rejects(f.planner.plan(f.request),{code:'DCB_V2_MISSING'});
});
test('private source without exact disclosure is incomplete, never transferable',async()=>{
  const f=fixture({classification:'personal',sensitivity:'private'});
  const denied=await f.planner.plan(f.request);
  assert.equal(denied.complete,false);
  assert.equal(denied.transferable,false);
  assert.ok(denied.preview.omissions.some(x=>x.reason==='disclosure_required'));
  const approved=await f.planner.plan({...f.request,disclosure:{approved:true,
    principalRef:audience.principalRef,destinationProvider:audience.destinationProvider,
    sourceRefs:['notes/context']}});
  assert.equal(approved.complete,true);
  assert.equal(approved.transferable,true);
});
test('unverified destination never becomes transferable or authorized',async()=>{
  const f=fixture();
  const result=await f.planner.plan({...f.request,audience:{...audience,destinationModelVerified:false}});
  assert.equal(result.transferable,false);
  assert.equal(result.isSendAuthorized,false);
});

test('adaptive selection includes explicit mandatory context but may omit irrelevant optional refs',async()=>{
  const mandatory='notes/launch', optional='notes/old';
  const bodies=new Map([[mandatory,'Current launch decision approved.'],[optional,'Historical unrelated discussion.']]);
  const dcb=createDcbV2Planner({
    definitionStore:{resolve:()=>({sourceRefs:[mandatory,optional],
      flavorRefs:['project','research'],dependencies:[{ref:'dcb:main',revision:1}]})},
    sourceAdapters:{
      resolveSources:async()=>[mandatory,optional].map(ref=>({
        ref,revision:'r1',sha256:sha(bodies.get(ref)),classification:'decision',
        sensitivity:'internal',layer:'LdDecisions',trust:'owner_confirmed',
        keywords:ref===mandatory?['launch','decision']:['historical'],
        principalRef:audience.principalRef,projectRef:audience.projectRef,updatedAt:T,
      })),
      readSource:async({ref})=>({text:bodies.get(ref),revision:'r1',sha256:sha(bodies.get(ref))}),
    },
  });
  const result=await dcb.plan({
    bundleId:'dcb:main',taskRef:'task:launch',taskText:'What is the launch decision?',
    now:T,profile:'continuum',purpose:'personal_continuum',audience,
    scope:{allowedRefs:[mandatory,optional],allowedPrefixes:[],maxSensitivity:'internal'},
    maxInputTokens:1600,reservedForUserPrompt:200,reservedForOutput:200,
    adaptiveSelection:{mandatorySourceRefs:[mandatory],maxSources:1},
  });
  assert.equal(result.complete,true);
  assert.equal(result.transferable,true);
  assert.equal(result.sourceSelectionMode,'adaptive');
  assert.equal(result.optionalSourcesOmitted,1);
  assert.deepEqual(result.manifest.sources.map(s=>s.ref),[mandatory]);
});
test('adaptive optional context outside explicit scope is never read or delivered',async()=>{
  const f=fixture();
  const result=await f.planner.plan({...f.request,
    scope:{allowedRefs:[],allowedPrefixes:[],maxSensitivity:'internal'},
    adaptiveSelection:{mandatorySourceRefs:[],maxSources:5}});
  assert.equal(result.sourceSelectionMode,'adaptive');
  assert.equal(result.complete,true);
  assert.deepEqual(result.manifest.sources,[]);
  assert.equal(result.optionalSourcesOmitted,0);
});
test('adaptive mandatory sources cannot bypass exact Host disclosure scope',async()=>{
  const f=fixture();
  await assert.rejects(f.planner.plan({...f.request,
    scope:{allowedRefs:[],allowedPrefixes:[],maxSensitivity:'internal'},
    adaptiveSelection:{mandatorySourceRefs:['notes/context'],maxSources:5}}),
    {code:'DCB_V2_SCOPE'});
});
