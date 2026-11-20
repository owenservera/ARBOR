# File: harness/src/context/dcb-claims.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/context/dcb-claims.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7719 B |
| Lines | 130 |
| Hash | e69be6ff73f0 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DCB_CLAIMS_SCHEMA | const | 4 | yes | export const DCB_CLAIMS_SCHEMA=&#39;vivim.dcb-claim-reconciliation/1&#39;; |
| REF | const | 5 | no | const REF=/^[A-Za-z0-9][A-Za-z0-9_.:/@#-]{0,191}$/; |
| SHA | const | 6 | no | const SHA=/^[a-f0-9]{64}$/; |
| VALID_STATES | const | 7 | no | const VALID_STATES=new Set([&#39;verified&#39;,&#39;owner_confirmed&#39;,&#39;observed&#39;,&#39;inferred&#39;,&#39;proposed&#39;,&#39;provider_reported&#39;]); |
| TRUST | const | 8 | no | const TRUST={owner_confirmed:6,verified:5,observed:4,inferred:2,proposed:1,provider_reported:1}; |
| fail | function | 9 | no | const fail=(code,msg)=&gt;Object.assign(new Error(msg),{code}); |
| check | function | 10 | no | const check=(value,name)=&gt;{if(typeof value!==&#39;string&#39;\|\|!REF.test(value))throw fail(&#39;DCB_CLAIM_REF&#39;,&#39;Invalid &#39;+name);return value}; |
| utc | function | 11 | no | const utc=(s,name)=&gt;{if(s===null)return null;if(typeof s!==&#39;string&#39;\|\|!Number.isFinite(Date.parse(s))\|\|new Date(s).toISOString()!==s)throw fail(&#39;DCB_CLAIM_TIME&#39;,&#39;Invalid &#39;+name);return s}; |
| unique | function | 12 | no | const unique=x=&gt;[...new Set(x)].sort(); |
| normalize | function | 13 | no | function normalize(row) { |
| id | const | 15 | no | const id=check(row.id,&#39;claim id&#39;),subjectRef=check(row.subjectRef,&#39;subject&#39;), |
| observedAt | const | 20 | no | const observedAt=utc(row.observedAt,&#39;observedAt&#39;), validFrom=utc(row.validFrom??null,&#39;validFrom&#39;), |
| supersedes | const | 24 | no | const supersedes=unique((row.supersedes??[]).map(x=&gt;check(x,&#39;supersession claim&#39;))); |
| score | function | 31 | no | function score(a,b) { |
| reconcileDcbClaims | function | 35 | yes | export function reconcileDcbClaims({claims=[],allowedSourceRefs=[],now,maxClaims=500}={}) { |
| permitted | const | 42 | no | const permitted=new Set(allowedSourceRefs.map(x=&gt;check(x,&#39;allowed source&#39;))); |
| normalized | const | 43 | no | const normalized=claims.map(normalize); |
| byId | const | 44 | no | const byId=new Map(); |
| eligible | const | 55 | no | const eligible=[...byId.values()].filter(x=&gt;permitted.has(x.sourceRef)); |
| eligibleMap | const | 56 | no | const eligibleMap=new Map(eligible.map(x=&gt;[x.id,x])); |
| superseded | const | 57 | no | const superseded=new Map(), prior=new Map(); |
| target | const | 60 | no | const target=eligibleMap.get(old); |
| arr | const | 67 | no | const arr=prior.get(row.id)??[]; |
| color | const | 72 | no | const color=new Map(); |
| visit | function | 73 | no | function visit(id) { |
| target | const | 82 | no | const target=eligibleMap.get(old); |
| set | const | 88 | no | const set=superseded.get(old)??new Set();set.add(row.id);superseded.set(old,set); |
| groups | const | 90 | no | const groups=new Map(),excluded=[]; |
| reason | variable | 92 | no | let reason=null; |
| key | const | 98 | no | const key=JSON.stringify([row.subjectRef,row.predicate]); |
| selected | const | 102 | no | const selected=[],duplicates=[],contradictions=[]; |
| values | const | 104 | no | const values=new Map(); |
| arr | const | 106 | no | const arr=values.get(row.valueDigest)??[];arr.push(row);values.set(row.valueDigest,arr); |
| winners | const | 108 | no | const winners=[]; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [harness/test/context/dcb-claims.test.mjs](../../test/context/dcb-claims.test.mjs.md) | ../../src/context/dcb-claims.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// DCB v2 claim reconciliation. Pure canonical-graph projection: never writes facts,
// permissions, personal memory, or sends a provider request.
// Claim IDs and value hashes come from Host-owned source adapters, not this module.
export const DCB_CLAIMS_SCHEMA='vivim.dcb-claim-reconciliation/1';
const REF=/^[A-Za-z0-9][A-Za-z0-9_.:/@#-]{0,191}$/;
const SHA=/^[a-f0-9]{64}$/;
const VALID_STATES=new Set(['verified','owner_confirmed','observed','inferred','proposed','provider_reported']);
const TRUST={owner_confirmed:6,verified:5,observed:4,inferred:2,proposed:1,provider_reported:1};
const fail=(code,msg)=>Object.assign(new Error(msg),{code});
const check=(value,name)=>{if(typeof value!=='string'||!REF.test(value))throw fail('DCB_CLAIM_REF','Invalid '+name);return value};
const utc=(s,name)=>{if(s===null)return null;if(typeof s!=='string'||!Number.isFinite(Date.parse(s))||new Date(s).toISOString()!==s)throw fail('DCB_CLAIM_TIME','Invalid '+name);return s};
const unique=x=>[...new Set(x)].sort();
function normalize(row) {
  if(!row||typeof row!=='object'||Array.isArray(row))throw fail('DCB_CLAIM_INVALID','Claim record required');
  const id=check(row.id,'claim id'),subjectRef=check(row.subjectRef,'subject'),
    predicate=check(row.predicate,'predicate'),sourceRef=check(row.sourceRef,'source');
  if(typeof row.valueDigest!=='string'||!SHA.test(row.valueDigest))throw fail('DCB_CLAIM_DIGEST','Invalid value digest');
  if(!VALID_STATES.has(row.evidenceClass))throw fail('DCB_CLAIM_EVIDENCE','Unknown evidence class');
  if(typeof row.sourceRevision!=='string'||!REF.test(row.sourceRevision))throw fail('DCB_CLAIM_REVISION','Source revision required');
  const observedAt=utc(row.observedAt,'observedAt'), validFrom=utc(row.validFrom??null,'validFrom'),
    validUntil=utc(row.validUntil??null,'validUntil');
  if(!observedAt||(validUntil&&validFrom&&validUntil<=validFrom))throw fail('DCB_CLAIM_TIME','Invalid temporal interval');
  if(row.supersedes!==undefined&&!Array.isArray(row.supersedes))throw fail('DCB_CLAIM_SUPERSEDES','Invalid supersession');
  const supersedes=unique((row.supersedes??[]).map(x=>check(x,'supersession claim')));
  if(supersedes.includes(id))throw fail('DCB_CLAIM_CYCLE','Claim cannot supersede itself');
  if(row.revoked!==undefined&&typeof row.revoked!=='boolean')throw fail('DCB_CLAIM_REVOKED','Invalid revocation flag');
  return {id,subjectRef,predicate,valueDigest:row.valueDigest,sourceRef,
    sourceRevision:row.sourceRevision,evidenceClass:row.evidenceClass,observedAt,
    validFrom,validUntil,supersedes,revoked:row.revoked===true};
}
function score(a,b) {
  return TRUST[b.evidenceClass]-TRUST[a.evidenceClass]||
    b.observedAt.localeCompare(a.observedAt)||a.id.localeCompare(b.id);
}
export function reconcileDcbClaims({claims=[],allowedSourceRefs=[],now,maxClaims=500}={}) {
  if(typeof now!=='string')throw fail('DCB_CLAIM_TIME','Pinned time required');
  utc(now,'now');
  if(!Array.isArray(claims)||claims.length>maxClaims||!Number.isSafeInteger(maxClaims)
    ||maxClaims<1||maxClaims>5000)throw fail('DCB_CLAIM_LIMIT','Invalid claim count');
  if(!Array.isArray(allowedSourceRefs)||allowedSourceRefs.length>5000)
    throw fail('DCB_CLAIM_SCOPE','Exact permitted source refs required');
  const permitted=new Set(allowedSourceRefs.map(x=>check(x,'allowed source')));
  const normalized=claims.map(normalize);
  const byId=new Map();
  for(const row of normalized) {
    if(byId.has(row.id)) {
      if(JSON.stringify(byId.get(row.id))!==JSON.stringify(row))
        throw fail('DCB_CLAIM_ID_COLLISION','Conflicting payloads share claim identity');
      continue;
    }
    byId.set(row.id,row);
  }
  // Never infer an authorization from a flavor or bundle. Only exact permitted
  // source IDs can enter even the metadata-only reconciliation result.
  const eligible=[...byId.values()].filter(x=>permitted.has(x.sourceRef));
  const eligibleMap=new Map(eligible.map(x=>[x.id,x]));
  const superseded=new Map(), prior=new Map();
  for(const row of eligible) {
    for(const old of row.supersedes) {
      const target=eligibleMap.get(old);
      if(!target) {
        // Unknown/filtered ancestry is NOT permission to rewrite or suppress it.
        continue;
      }
      if(target.subjectRef!==row.subjectRef||target.predicate!==row.predicate)
        throw fail('DCB_CLAIM_SUPERSESSION_SCOPE','Supersession must address same subject and predicate');
      const arr=prior.get(row.id)??[];
      arr.push(old); prior.set(row.id,arr);
    }
  }
  // Traverse declared supersession to detect cycles before suppressing anything.
  const color=new Map();
  function visit(id) {
    if(color.get(id)===1)throw fail('DCB_CLAIM_CYCLE','Cyclic supersession');
    if(color.get(id)===2)return;
    color.set(id,1);for(const v of prior.get(id)??[])visit(v);color.set(id,2);
  }
  for(const row of eligible)visit(row.id);
  // A proposed or provider-reported observation cannot supersede an owner-
  // confirmed or verified fact, even when it explicitly names its predecessor.
```

_First 80 of 131 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
