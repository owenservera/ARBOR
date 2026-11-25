import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Session } from '../../src/store/session.mjs';
import { rawDigest, domDigest, writeAcceptance, ACCEPTANCE_SCHEMA, EVALUATOR_VERSION, DEFAULT_RECIPE } from '../../src/capture/acceptance.mjs';
import { acceptedSessionToAdapterEvents } from '../../src/studio/adapter-accepted-session.mjs';
import { createTrustedManifestProvider, createStudioLearningPipeline } from '../../src/studio/adapter-learning-pipeline.mjs';
import { qualifyHoldout } from '../../src/studio/systems-probes.mjs';

const scope={siteId:'chatgpt',origin:'https://chatgpt.com',surface:'chat',accountRef:'fixture-account'};
const dirOf=t=>{const dir=mkdtempSync(path.join(tmpdir(),'studio-artifact-fixture-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));return dir;};
// Test-only generated raw and acceptance fixtures. NOT real browser acceptance or account proof.
async function fixture(dir,i){
  const session=Session.create(dir,{site:scope.siteId,meta:{target:{url:scope.origin+'/fixture'}}});
  session.raw.append({k:'lifecycle',event:'test-fixture-'+i,url:scope.origin});
  await session.raw.close();
  session.meta.status='complete'; session.saveMeta();
  session.kv.set('DOM_TURNS',[{role:'user',roleAttribute:'data-fixture-role',roleMatch:'exact',domId:'fixture-user'},
    {role:'assistant',roleAttribute:'data-fixture-role',roleMatch:'exact',domId:'fixture-assistant'}]);
  const doc={schema:ACCEPTANCE_SCHEMA,evaluator:{version:EVALUATOR_VERSION},evaluatedAt:new Date().toISOString(),
    binding:{rawDigest:rawDigest(session).digest,domDigest:domDigest(session),seqRange:[1,1],recipe:DEFAULT_RECIPE},
    gates:Object.fromEntries(['G1','G2','G3','G4','G5','G6','G7'].map(k=>[k,{value:'passed',reason:'synthetic fixture only'}])),
    verdict:'capture_accepted',reasons:[]};
  writeAcceptance(session,doc);
  return {session,doc};
}
test('manifest rechecks exact directory, complete status, evaluator and bound sequence',async t=>{
  const dir=dirOf(t), {session,doc}=await fixture(dir,1), p=createTrustedManifestProvider({sessionsDir:dir});
  assert.ok(p.verifySession(session.id));
  assert.equal(p.verifySession('latest'),null);
  assert.equal(p.verifySession('../'+session.id),null);
  assert.equal(p.verifySession(session.id.slice(0,-2)),null);
  writeAcceptance(session,{...doc,evaluator:{version:'obsolete'}});
  assert.equal(p.verifySession(session.id),null);
  writeAcceptance(session,{...doc,binding:{...doc.binding,seqRange:[1,2]}});
  assert.equal(p.verifySession(session.id),null);
  writeAcceptance(session,doc);
  session.meta.status='recording';session.saveMeta();
  assert.equal(p.verifySession(session.id),null);
});
test('accepted source must match producer, artifact, origin and account-claim boundary',async t=>{
  const dir=dirOf(t), {session}=await fixture(dir,2), p=createTrustedManifestProvider({sessionsDir:dir});
  const verified=p.verifySession(session.id);
  const [{source}]=acceptedSessionToAdapterEvents({scope,verified});
  assert.equal(await p.verifyCapture({scope,source}),true);
  assert.equal(source.accountBinding,'caller-scoped-unverified');
  for(const changed of [{producer:'caller'},{accountBinding:'core-verified'},{domDigest:'0'.repeat(64)},
    {sequence:2},{coverage:'partial'},{origin:'https://example.com'}]){
    assert.equal(await p.verifyCapture({scope,source:{...source,...changed}}),false);
  }
  assert.equal(await p.verifyCapture({scope:{...scope,siteId:'claude'},source}),false);
});
test('hydration hashes the actual DOM_TURNS object, not a stale earlier verified read',async t=>{
  const dir=dirOf(t), {session}=await fixture(dir,3), p=createTrustedManifestProvider({sessionsDir:dir});
  const verified=p.verifySession(session.id);
  session.kv.set('DOM_TURNS',[{role:'user',roleAttribute:'data-changed',domId:'changed'}]);
  assert.throws(()=>acceptedSessionToAdapterEvents({scope,verified}),{code:'DOM_TURNS_DIGEST_CHANGED'});
  assert.equal(p.verifySession(session.id),null);
});
test('remount under a new session id does not manufacture independent holdout lineage',async t=>{
  const dir=dirOf(t), {session}=await fixture(dir,4), p=createTrustedManifestProvider({sessionsDir:dir});
  const alias=session.id+'-remount';
  cpSync(session.dir,path.join(dir,alias),{recursive:true});
  const remount=Session.open(dir,alias);remount.meta.id=alias;remount.saveMeta();
  const manifests=await p.getTrustedManifests({scope,training:[session.id],heldout:[alias]});
  assert.equal(manifests.training[0].lineage,manifests.heldout[0].lineage);
  const result=qualifyHoldout({train:manifests.training,heldout:manifests.heldout,
    expectedScope:{siteId:scope.siteId,origin:scope.origin,account:scope.accountRef,surface:scope.surface}});
  assert.equal(result.reason,'EVIDENCE_LINEAGE_REUSED');
});
test('canonical ready proposal cannot CAS-promote after a heldout artifact changes',async t=>{
  const dir=dirOf(t), sessions=[];
  for(let i=0;i<5;i++)sessions.push((await fixture(dir,i)).session);
  let writes=0;
  const store={current:()=>null,load:()=>null,versions:()=>[],
    compareAndSave(){writes++;return {version:1,name:'fixture'};},compareAndRollback(){throw Error('unexpected rollback');}};
  const api=createStudioLearningPipeline({sessionsDir:dir,store});
  const proposal=await api.proposeFromSessions({scope,training:sessions.slice(0,3).map(s=>s.id),heldout:sessions.slice(3).map(s=>s.id)});
  assert.equal(proposal.status,'ready-for-read-only-promotion');
  sessions[4].kv.set('DOM_TURNS',[]);
  await assert.rejects(api.promote(proposal.proposalDigest),{code:'PROMOTION_SOURCE_STALE'});
  assert.equal(writes,0);
});
test('explicit read-only CAS remains compatible with unchanged accepted artifacts',async t=>{
  const dir=dirOf(t), sessions=[];
  for(let i=0;i<5;i++)sessions.push((await fixture(dir,i)).session);
  let writes=0;
  const store={current:()=>null,load:()=>null,versions:()=>[],
    compareAndSave(name,payload,opts){writes++;assert.equal(payload.sendPermission,false);assert.equal(opts.expectedVersion,null);return {version:1,name};},
    compareAndRollback(){throw Error('unexpected rollback');}};
  const api=createStudioLearningPipeline({sessionsDir:dir,store});
  const proposal=await api.proposeFromSessions({scope,training:sessions.slice(0,3).map(s=>s.id),heldout:sessions.slice(3).map(s=>s.id)});
  assert.equal(proposal.status,'ready-for-read-only-promotion');
  assert.equal((await api.promoteQualified(proposal)).status,'abstained');
  const saved=await api.promote(proposal.proposalDigest);
  assert.equal(saved.version,1);assert.equal(saved.sendPermission,false);assert.equal(writes,1);
});
