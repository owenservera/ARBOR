# File: harness/test/context/dcb-observation-intake.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/context/dcb-observation-intake.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4177 B |
| Lines | 78 |
| Hash | c34d554c5d9f |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| T | const | 6 | no | const T=&#39;2026-11-10T06:00:00.000Z&#39;; |
| SHA | const | 7 | no | const SHA=createHash(&#39;sha256&#39;).update(&#39;synthetic&#39;).digest(&#39;hex&#39;); |
| event | function | 8 | no | const event=(kind=&#39;source.observed&#39;,other={})=&gt;({ schema:DCB_OBSERVATION_SCHEMA,id:&#39;event:one&#39;,kind, principalRef:&#39;owner:one&#39;,sourceRef:&#39;context:one&#39;,sourceRevision:&#39;rev:one&#39;, sourceDigest:SHA,receip… |
| raw | const | 16 | no | const raw=event(&#39;source.observed&#39;,{text:&#39;private synthetic transcript&#39;, cookies:&#39;never-copy&#39;,accessToken:&#39;forbidden&#39;}); |
| normalized | const | 18 | no | const normalized=validateDcbObservation(raw); |
| delta | const | 21 | no | const delta=planDcbObservationIntegration({event:raw}); |
| previous | const | 27 | no | const previous={sourceRef:&#39;context:one&#39;,sourceRevision:&#39;rev:one&#39;, |
| result | const | 29 | no | const result=planDcbObservationIntegration({event:event(),previous}); |
| d | const | 37 | no | const d=planDcbObservationIntegration({event:event(&#39;claim.proposed&#39;,{ evidenceClass:&#39;provider_reported&#39;,providerRef:&#39;provider:claude&#39;, })}); |
| previous | const | 44 | no | const previous={sourceRef:&#39;context:one&#39;,sourceRevision:&#39;rev:one&#39;, |
| d | const | 46 | no | const d=planDcbObservationIntegration({previous,event:event(&#39;owner.corrected&#39;,{ evidenceClass:&#39;owner_confirmed&#39;,ownerProofRef:&#39;receipt:owner&#39;, })}); |
| revoked | const | 56 | no | const revoked=planDcbObservationIntegration({event:event(&#39;source.revoked&#39;,{ evidenceClass:&#39;owner_confirmed&#39;,ownerProofRef:&#39;receipt:owner&#39;, })}); |
| previous | const | 63 | no | const previous={sourceRef:&#39;context:one&#39;,sourceRevision:&#39;rev:one&#39;, |
| previous | const | 73 | no | const previous={sourceRef:&#39;context:one&#39;,sourceRevision:&#39;rev:one&#39;,sourceDigest:SHA, |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:crypto | import | 3 | external |
| ../../src/context/dcb-observation-intake.mjs | import | 4 | [harness/src/context/dcb-observation-intake.mjs](../../src/context/dcb-observation-intake.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
