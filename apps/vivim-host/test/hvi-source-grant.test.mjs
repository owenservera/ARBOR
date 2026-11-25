// Synthetic-only tests for the HVI development-source grant and its Host binding.
// No real repository, no network, no provider, no browser and no personal data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { openLedger } from '../bootstrap/ledger.mjs';
import { createHviSourceGrantStore, createHviSourceGrantVerifier,
  HVI_SOURCE_GRANT_REASONS, HVI_SOURCE_GRANT_MAX_REPOS,
  HVI_SOURCE_GRANT_KEY } from '../control/hvi-source-grant.mjs';
import { createHviHostReadPort, HVI_HOST_REQUEST_SCHEMA } from '../control/hvi-capability.mjs';
import { syntheticSource } from '../../../hq/version-intelligence/sources/fixtures.mjs';

const clock=(start='2026-11-13T00:00:00.000Z')=>{let t=Date.parse(start);
  return { now:()=>new Date(t).toISOString(), advanceMs:(ms)=>{t+=ms;} };};
const openStore=c=>createHviSourceGrantStore({ledger:openLedger({file:':memory:'}),now:c.now});
const REPO='synthetic/grant-repo';

test('a granted repository is authorized and an ungranted one is refused',()=>{
  const c=clock();const store=openStore(c);
  store.issue({actorId:'owner',repoIdentities:[REPO]});
  assert.equal(store.verify({repoIdentity:REPO}).ok,true);
  const denied=store.verify({repoIdentity:'synthetic/other-repo'});
  assert.equal(denied.ok,false);
  assert.equal(denied.code,HVI_SOURCE_GRANT_REASONS.scope);
});

test('no grant at all fails closed',()=>{
  const store=openStore(clock());
  const out=store.verify({repoIdentity:REPO});
  assert.equal(out.ok,false);
  assert.equal(out.code,HVI_SOURCE_GRANT_REASONS.notGranted);
});

test('revocation is immediate and keeps a tombstone distinct from never granted',()=>{
  const c=clock();const store=openStore(c);
  store.issue({actorId:'owner',repoIdentities:[REPO]});
  assert.equal(store.verify({repoIdentity:REPO}).ok,true);
  store.revoke({actorId:'owner'});
  const out=store.verify({repoIdentity:REPO});
  assert.equal(out.ok,false);
  assert.equal(out.code,HVI_SOURCE_GRANT_REASONS.revoked);
  // Revoked is NOT the same refusal as never granted.
  const fresh=openStore(clock());
  assert.equal(fresh.verify({repoIdentity:REPO}).code,HVI_SOURCE_GRANT_REASONS.notGranted);
  assert.notEqual(out.code,fresh.verify({repoIdentity:REPO}).code);
});

test('an expired grant fails closed at the moment of expiry',()=>{
  const c=clock();const store=openStore(c);
  store.issue({actorId:'owner',repoIdentities:[REPO],expiresInMs:60_000});
  assert.equal(store.verify({repoIdentity:REPO}).ok,true);
  c.advanceMs(60_000);
  const out=store.verify({repoIdentity:REPO});
  assert.equal(out.ok,false);
  assert.equal(out.code,HVI_SOURCE_GRANT_REASONS.expired);
});

test('an absent or unreadable expiry fails closed',()=>{
  const c=clock();const store=openStore(c);
  store.issue({actorId:'owner',repoIdentities:[REPO]});
  // A grant record without a readable absolute expiry is not evidence of live authority.
  const ledger=store.status();
  assert.equal(ledger.granted,true);
  const raw=openLedger({file:':memory:'});
  raw.meta.set(HVI_SOURCE_GRANT_KEY,JSON.stringify({id:'hsg-legacy',repoIdentities:[REPO],
    at:'2026-11-13T00:00:00.000Z'}));
  const legacy=createHviSourceGrantStore({ledger:raw,now:c.now});
  assert.equal(legacy.verify({repoIdentity:REPO}).code,HVI_SOURCE_GRANT_REASONS.expired);
  raw.meta.set(HVI_SOURCE_GRANT_KEY,JSON.stringify({id:'hsg-bad',repoIdentities:[REPO],
    at:'2026-11-13T00:00:00.000Z',expiresAt:'not-a-date'}));
  const unreadable=createHviSourceGrantStore({ledger:raw,now:c.now});
  assert.equal(unreadable.verify({repoIdentity:REPO}).code,HVI_SOURCE_GRANT_REASONS.expired);
});

test('issue bounds are enforced',()=>{
  const store=openStore(clock());
  assert.throws(()=>store.issue({actorId:'owner',repoIdentities:[]}),/HVI_SOURCE_GRANT_INVALID/);
  assert.throws(()=>store.issue({actorId:'owner',
    repoIdentities:Array.from({length:HVI_SOURCE_GRANT_MAX_REPOS+1},(_,i)=>'synthetic/repo'+i)}),
    /HVI_SOURCE_GRANT_INVALID/);
  assert.throws(()=>store.issue({actorId:'owner',repoIdentities:[REPO],expiresInMs:25*3600000}),
    /HVI_SOURCE_GRANT_INVALID/);
  assert.throws(()=>store.issue({actorId:'',repoIdentities:[REPO]}),/HVI_SOURCE_GRANT_INVALID/);
  assert.throws(()=>store.issue({actorId:'owner',repoIdentities:['../escape']}),/SOURCE_UNAUTHORIZED/);
});

test('the verifier adapter never widens a refusal',()=>{
  const c=clock();const store=openStore(c);
  const verify=createHviSourceGrantVerifier(store);
  store.issue({actorId:'owner',repoIdentities:[REPO]});
  assert.equal(verify({repoIdentity:REPO}),true);
  assert.equal(verify({repoIdentity:'synthetic/other-repo'}),false);
  store.revoke({actorId:'owner'});
  assert.equal(verify({repoIdentity:REPO}),false);
});

test('the Host read port denies an ungranted or revoked repository before any source read',async()=>{
  const c=clock();const store=openStore(c);
  const fixture=syntheticSource();
  const request={schema:HVI_HOST_REQUEST_SCHEMA,targetIndex:2,
    sources:['v1','v2','v3'].map(ref=>({repo:'synthetic/g2-fixture',ref}))};
  const port=overrides=>createHviHostReadPort({actorId:'synthetic-owner',sessionId:'synthetic-local',
    approvedRepositories:['synthetic/g2-fixture'],verifySession:()=>true,
    verifyGrant:createHviSourceGrantVerifier(store),enabled:true,...overrides});
  // No grant yet: the port must refuse before it reads a Git object.
  await assert.rejects(port().invoke(request,{adapter:fixture.adapter}),{code:'SOURCE_UNAUTHORIZED'});
  assert.equal(fixture.calls.refs.length,0);
  // Grant the repository: the analysis now runs.
  store.issue({actorId:'synthetic-owner',repoIdentities:['synthetic/g2-fixture']});
  const out=await port().invoke(request,{adapter:fixture.adapter});
  assert.equal(out.report.sourcePins.length,3);
  // Revoke it: the next read is denied immediately, with no stale cached authority.
  store.revoke({actorId:'synthetic-owner'});
  await assert.rejects(port().invoke(request,{adapter:fixture.adapter}),{code:'SOURCE_UNAUTHORIZED'});
});

test('the Host read port observes the UI revision instead of trusting a caller',async()=>{
  const store=openStore(clock());
  store.issue({actorId:'synthetic-owner',repoIdentities:['synthetic/g2-fixture']});
  const fixture=syntheticSource();
  const request={schema:HVI_HOST_REQUEST_SCHEMA,targetIndex:2,
    sources:['v1','v2','v3'].map(ref=>({repo:'synthetic/g2-fixture',ref}))};
  const seen=[];
  const port=createHviHostReadPort({actorId:'synthetic-owner',sessionId:'synthetic-local',
    approvedRepositories:['synthetic/g2-fixture'],verifySession:()=>true,
    verifyGrant:createHviSourceGrantVerifier(store),enabled:true,
    observeUiRevision:()=>{seen.push('observed');return {revision:7,status:'applied',at:'2026-11-13T00:00:00.000Z'};}});
  const out=await port.invoke(request,{adapter:fixture.adapter});
  assert.deepEqual(out.uiRevision,{revision:7,status:'applied',observedAt:'2026-11-13T00:00:00.000Z'});
  assert.equal(seen.length,1);
  // The request schema is closed, so no caller can smuggle in its own revision.
  assert.equal(out.remoteAccepted,false);
  assert.equal(out.runtimeAccepted,false);
});

test('a workstation read cannot inherit a replacement grant for the same repository',()=>{
  const c=clock();const store=openStore(c);const verify=createHviSourceGrantVerifier(store);
  const first=store.issue({actorId:'owner',repoIdentities:[REPO]});
  const ctx={repoIdentity:REPO,sourceGrantRef:first.id,workstationReadOperation:'files'};
  assert.equal(verify(ctx),true);
  assert.equal(verify({...ctx,sourceGrantRef:undefined}),false);
  assert.equal(verify({...ctx,sourceGrantRef:null}),false);
  store.revoke({actorId:'owner'});
  assert.equal(verify(ctx),false);
  const second=store.issue({actorId:'owner',repoIdentities:[REPO]});
  assert.notEqual(second.id,first.id);
  assert.equal(verify(ctx),false);
  assert.equal(verify({...ctx,sourceGrantRef:second.id}),true);
  assert.equal(verify({repoIdentity:REPO,sourceGrantRef:first.id}),false);
  assert.equal(verify({repoIdentity:REPO}),true);
  assert.equal(verify({repoIdentity:REPO,sourceGrantRef:null}),true);
  c.advanceMs(24*3600000);
  assert.equal(verify({...ctx,sourceGrantRef:second.id}),false);
});
