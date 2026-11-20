# File: harness/test/context/dcb-claims.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/context/dcb-claims.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3976 B |
| Lines | 69 |
| Hash | b42dc773e33c |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| T | const | 5 | no | const T=&#39;2026-11-10T06:00:00.000Z&#39;; |
| EARLY | const | 6 | no | const EARLY=&#39;2026-11-09T06:00:00.000Z&#39;; |
| LATER | const | 7 | no | const LATER=&#39;2026-11-11T06:00:00.000Z&#39;; |
| dig | function | 8 | no | const dig=t=&gt;createHash(&#39;sha256&#39;).update(t).digest(&#39;hex&#39;); |
| claim | function | 9 | no | const claim=(id,value,over={})=&gt;({id,subjectRef:&#39;product:one&#39;,predicate:&#39;launch&#39;, valueDigest:dig(value),sourceRef:&#39;source:one&#39;,sourceRevision:&#39;v1&#39;, evidenceClass:&#39;observed&#39;,observedAt:EARLY,supersed… |
| run | function | 12 | no | const run=(claims,allowedSourceRefs=[&#39;source:one&#39;,&#39;source:two&#39;])=&gt; |
| a | const | 15 | no | const a=claim(&#39;claim:a&#39;,&#39;yes&#39;); |
| b | const | 16 | no | const b=claim(&#39;claim:b&#39;,&#39;yes&#39;,{sourceRef:&#39;source:two&#39;,evidenceClass:&#39;verified&#39;}); |
| r | const | 17 | no | const r=run([a,b]); |
| r | const | 23 | no | const r=run([claim(&#39;claim:a&#39;,&#39;yes&#39;),claim(&#39;claim:b&#39;,&#39;no&#39;)]); |
| old | const | 29 | no | const old=claim(&#39;claim:old&#39;,&#39;yes&#39;); |
| next | const | 30 | no | const next=claim(&#39;claim:new&#39;,&#39;no&#39;,{evidenceClass:&#39;owner_confirmed&#39;,observedAt:T, supersedes:[&#39;claim:old&#39;]}); |
| r | const | 32 | no | const r=run([old,next]); |
| old | const | 37 | no | const old=claim(&#39;claim:old&#39;,&#39;yes&#39;,{evidenceClass:&#39;owner_confirmed&#39;}); |
| next | const | 38 | no | const next=claim(&#39;claim:ai&#39;,&#39;no&#39;,{evidenceClass:&#39;provider_reported&#39;,observedAt:T, supersedes:[&#39;claim:old&#39;]}); |
| old | const | 43 | no | const old=claim(&#39;claim:old&#39;,&#39;yes&#39;); |
| next | const | 44 | no | const next=claim(&#39;claim:new&#39;,&#39;no&#39;,{sourceRef:&#39;source:two&#39;,evidenceClass:&#39;owner_confirmed&#39;, observedAt:T,supersedes:[&#39;claim:old&#39;]}); |
| r | const | 46 | no | const r=run([old,next],[&#39;source:one&#39;]); |
| r | const | 51 | no | const r=run([claim(&#39;claim:past&#39;,&#39;yes&#39;,{validUntil:T}), claim(&#39;claim:revoked&#39;,&#39;no&#39;,{revoked:true}), claim(&#39;claim:future&#39;,&#39;maybe&#39;,{validFrom:LATER})]); |
| a | const | 58 | no | const a=claim(&#39;claim:a&#39;,&#39;yes&#39;,{supersedes:[&#39;claim:b&#39;]}); |
| b | const | 59 | no | const b=claim(&#39;claim:b&#39;,&#39;no&#39;,{supersedes:[&#39;claim:a&#39;]}); |
| rows | const | 67 | no | const rows=[claim(&#39;claim:a&#39;,&#39;yes&#39;),claim(&#39;claim:b&#39;,&#39;no&#39;),claim(&#39;claim:c&#39;,&#39;yes&#39;,{sourceRef:&#39;source:two&#39;})]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:crypto | import | 3 | external |
| ../../src/context/dcb-claims.mjs | import | 4 | [harness/src/context/dcb-claims.mjs](../../src/context/dcb-claims.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { reconcileDcbClaims } from '../../src/context/dcb-claims.mjs';
const T='2026-11-10T06:00:00.000Z';
const EARLY='2026-11-09T06:00:00.000Z';
const LATER='2026-11-11T06:00:00.000Z';
const dig=t=>createHash('sha256').update(t).digest('hex');
const claim=(id,value,over={})=>({id,subjectRef:'product:one',predicate:'launch',
  valueDigest:dig(value),sourceRef:'source:one',sourceRevision:'v1',
  evidenceClass:'observed',observedAt:EARLY,supersedes:[],...over});
const run=(claims,allowedSourceRefs=['source:one','source:two'])=>
  reconcileDcbClaims({claims,allowedSourceRefs,now:T});
test('same semantic claim from two sources deduplicates without losing canonical provenance',()=>{
  const a=claim('claim:a','yes');
  const b=claim('claim:b','yes',{sourceRef:'source:two',evidenceClass:'verified'});
  const r=run([a,b]);
  assert.deepEqual(r.selected.map(x=>x.id),['claim:b']);
  assert.deepEqual(r.duplicates,[{id:'claim:a',representedBy:'claim:b'}]);
  assert.equal(r.isSendAuthorized,false);
});
test('contradictory live claims persist as explicit conflicts, not false consensus',()=>{
  const r=run([claim('claim:a','yes'),claim('claim:b','no')]);
  assert.deepEqual(r.selected.map(x=>x.id),['claim:a','claim:b']);
  assert.deepEqual(r.contradictions[0].claimIds,['claim:a','claim:b']);
  assert.equal(r.contradictions[0].status,'unresolved_conflict');
});
test('owner-confirmed correction supersedes a previous observation only when declared',()=>{
  const old=claim('claim:old','yes');
  const next=claim('claim:new','no',{evidenceClass:'owner_confirmed',observedAt:T,
    supersedes:['claim:old']});
  const r=run([old,next]);
  assert.deepEqual(r.selected.map(x=>x.id),['claim:new']);
  assert.ok(r.excluded.some(x=>x.id==='claim:old'&&x.reason==='superseded'));
});
test('provider claim cannot replace stronger verified decision',()=>{
  const old=claim('claim:old','yes',{evidenceClass:'owner_confirmed'});
  const next=claim('claim:ai','no',{evidenceClass:'provider_reported',observedAt:T,
    supersedes:['claim:old']});
  assert.throws(()=>run([old,next]),{code:'DCB_CLAIM_UNTRUSTED_SUPERSESSION'});
});
test('source permissions filter claims before reconciliation and suppression',()=>{
  const old=claim('claim:old','yes');
  const next=claim('claim:new','no',{sourceRef:'source:two',evidenceClass:'owner_confirmed',
    observedAt:T,supersedes:['claim:old']});
  const r=run([old,next],['source:one']);
  assert.deepEqual(r.selected.map(x=>x.id),['claim:old']);
  assert.equal(r.filteredCount,1);
});
test('historical, revoked and future claims excluded without inventing current truth',()=>{
  const r=run([claim('claim:past','yes',{validUntil:T}),
    claim('claim:revoked','no',{revoked:true}),
    claim('claim:future','maybe',{validFrom:LATER})]);
  assert.deepEqual(r.selected,[]);
  assert.deepEqual(r.excluded.map(x=>x.reason),['not_yet_valid','historical','revoked']);
});
test('cycles, wrong-subject supersession, duplicate IDs and malformed evidence fail closed',()=>{
  const a=claim('claim:a','yes',{supersedes:['claim:b']});
  const b=claim('claim:b','no',{supersedes:['claim:a']});
  assert.throws(()=>run([a,b]),{code:'DCB_CLAIM_CYCLE'});
  assert.throws(()=>run([claim('claim:a','x'),claim('claim:a','y')]),{code:'DCB_CLAIM_ID_COLLISION'});
  assert.throws(()=>run([claim('claim:a','x',{evidenceClass:'untrusted'})]),{code:'DCB_CLAIM_EVIDENCE'});
  assert.throws(()=>run([claim('claim:a','x'),claim('claim:b','y',{
    subjectRef:'product:two',supersedes:['claim:a']})]),{code:'DCB_CLAIM_SUPERSESSION_SCOPE'});
});
test('permutation-invariant selected claims and contradictions',()=>{
  const rows=[claim('claim:a','yes'),claim('claim:b','no'),claim('claim:c','yes',{sourceRef:'source:two'})];
  assert.deepEqual(run(rows),run([...rows].reverse()));
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
