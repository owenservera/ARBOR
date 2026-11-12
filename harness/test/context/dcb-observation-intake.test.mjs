import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { validateDcbObservation,planDcbObservationIntegration,
  DCB_OBSERVATION_SCHEMA } from '../../src/context/dcb-observation-intake.mjs';
const T='2026-11-10T06:00:00.000Z';
const SHA=createHash('sha256').update('synthetic').digest('hex');
const event=(kind='source.observed',other={})=>({
  schema:DCB_OBSERVATION_SCHEMA,id:'event:one',kind,
  principalRef:'owner:one',sourceRef:'context:one',sourceRevision:'rev:one',
  sourceDigest:SHA,receiptRef:'receipt:one',subjectRef:'subject:one',
  activityRef:'activity:one',providerRef:null,observedAt:T,
  evidenceClass:'observed',sensitivity:'private',...other,
});
test('source observations become metadata deltas only, never raw transcripts',()=>{
  const raw=event('source.observed',{text:'private synthetic transcript',
    cookies:'never-copy',accessToken:'forbidden'});
  const normalized=validateDcbObservation(raw);
  assert.ok(!JSON.stringify(normalized).includes('private synthetic transcript'));
  assert.ok(!JSON.stringify(normalized).includes('never-copy'));
  const delta=planDcbObservationIntegration({event:raw});
  assert.deepEqual(delta.changedSourceRefs,['context:one']);
  assert.equal(delta.rawBodyStored,false);
  assert.equal(delta.isSendAuthorized,false);
});
test('identical existing source is idempotently recognized without rewriting memory',()=>{
  const previous={sourceRef:'context:one',sourceRevision:'rev:one',
    sourceDigest:SHA,observedAt:T,revoked:false};
  const result=planDcbObservationIntegration({event:event(),previous});
  assert.equal(result.action,'no_change');
  assert.deepEqual(result.changedSourceRefs,[]);
});
test('provider report can never declare owner-confirmed truth',()=>{
  assert.throws(()=>validateDcbObservation(event('source.observed',{
    providerRef:'provider:claude',evidenceClass:'owner_confirmed',
  })),{code:'DCB_OBSERVATION_PROMOTION'});
  const d=planDcbObservationIntegration({event:event('claim.proposed',{
    evidenceClass:'provider_reported',providerRef:'provider:claude',
  })});
  assert.equal(d.action,'unconfirmed_claim');
  assert.equal(d.canPromoteAutomatically,false);
});
test('owner correction with exact evidence remains a proposal even if source hash unchanged',()=>{
  const previous={sourceRef:'context:one',sourceRevision:'rev:one',
    sourceDigest:SHA,observedAt:T,revoked:false};
  const d=planDcbObservationIntegration({previous,event:event('owner.corrected',{
    evidenceClass:'owner_confirmed',ownerProofRef:'receipt:owner',
  })});
  assert.equal(d.action,'owner_correction_proposal');
  assert.deepEqual(d.changedSourceRefs,['context:one']);
});
test('source revocation requires proof and creates dependency invalidation tombstone',()=>{
  assert.throws(()=>validateDcbObservation(event('source.revoked',{
    evidenceClass:'owner_confirmed',
  })),{code:'DCB_OBSERVATION_REVOKE'});
  const revoked=planDcbObservationIntegration({event:event('source.revoked',{
    evidenceClass:'owner_confirmed',ownerProofRef:'receipt:owner',
  })});
  assert.equal(revoked.action,'tombstone');
  assert.deepEqual(revoked.revokedSourceRefs,['context:one']);
});
test('once revoked, older provider observations cannot silently restore a source',()=>{
  const previous={sourceRef:'context:one',sourceRevision:'rev:one',
    sourceDigest:SHA,observedAt:T,revoked:true};
  assert.throws(()=>planDcbObservationIntegration({
    previous,event:event('source.observed',{observedAt:T}),
  }),{code:'DCB_OBSERVATION_TOMBSTONE'});
});
test('source revision old evidence and malformed content digests are rejected',()=>{
  assert.throws(()=>validateDcbObservation(event('source.observed',{
    sourceDigest:'not-a-digest',
  })),{code:'DCB_OBSERVATION_INVALID'});
  const previous={sourceRef:'context:one',sourceRevision:'rev:one',sourceDigest:SHA,
    observedAt:T,revoked:false};
  assert.throws(()=>planDcbObservationIntegration({previous,event:event('source.observed',{
    observedAt:'2026-11-09T06:00:00.000Z',
  })}),{code:'DCB_OBSERVATION_TIME'});
});
