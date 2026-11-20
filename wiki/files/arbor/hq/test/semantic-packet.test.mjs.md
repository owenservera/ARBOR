# File: hq/test/semantic-packet.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/semantic-packet.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2233 B |
| Lines | 41 |
| Hash | 807d44a20d65 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ids | const | 6 | no | const ids=[&#39;test.action@1&#39;,&#39;test.contract@1&#39;]; |
| candidate | function | 7 | no | const candidate=(ref,values,cost=100,state=&#39;indexed&#39;,resolution=&#39;current&#39;)=&gt;({ ref,estimatedTokens:cost,contentHash:&#39;a&#39;.repeat(64), semanticReferences:values.map((semanticId,line)=&gt;({semanticId,line:… |
| a | const | 14 | no | const a=candidate(&#39;p:a.mjs&#39;,[ids[0]]); |
| b | const | 15 | no | const b=candidate(&#39;p:b.mjs&#39;,[ids[1]]); |
| c | const | 16 | no | const c=candidate(&#39;p:c.mjs&#39;,ids,20); |
| exact | const | 17 | no | const exact=20+estimateTokens(JSON.stringify(semanticPacketManifest(ids,[c]))); |
| result | const | 19 | no | const result=selectMandatorySources(order,ids,{capacity:exact,maxFiles:3}); |
| insufficient | const | 23 | no | const insufficient=selectMandatorySources([a,b,c],ids,{capacity:exact-1,maxFiles:3}); |
| result | const | 32 | no | const result=selectMandatorySources([candidate(&#39;p:a&#39;,[ids[0]]),bad],ids,{capacity:10000,maxFiles:3}); |
| manifest | const | 37 | no | const manifest=semanticPacketManifest(ids,[candidate(&#39;p:a&#39;,ids)]); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../lib/context.mjs | import | 3 | [hq/lib/context.mjs](../lib/context.mjs.md) |
| ../lib/util.mjs | import | 4 | [hq/lib/util.mjs](../lib/util.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { selectMandatorySources, semanticPacketManifest } from '../lib/context.mjs';
import { estimateTokens } from '../lib/util.mjs';

const ids=['test.action@1','test.contract@1'];
const candidate=(ref,values,cost=100,state='indexed',resolution='current')=>({
  ref,estimatedTokens:cost,contentHash:'a'.repeat(64),
  semanticReferences:values.map((semanticId,line)=>({semanticId,line:line+1,annotationKind:'consumes',
    resolution,semanticAnchor:{state,anchorId:ref+':'+semanticId,fingerprint:'b'.repeat(64)}}))
});

test('mandatory coverage precedes relevance and selects deterministic minimum cost including manifest',()=>{
  const a=candidate('p:a.mjs',[ids[0]]);
  const b=candidate('p:b.mjs',[ids[1]]);
  const c=candidate('p:c.mjs',ids,20);
  const exact=20+estimateTokens(JSON.stringify(semanticPacketManifest(ids,[c])));
  for(const order of [[a,b,c],[c,b,a],[b,a,c]]){
    const result=selectMandatorySources(order,ids,{capacity:exact,maxFiles:3});
    assert.equal(result.status,'complete');
    assert.deepEqual(result.selected,[c]);
  }
  const insufficient=selectMandatorySources([a,b,c],ids,{capacity:exact-1,maxFiles:3});
  assert.equal(insufficient.status,'budget_exceeded');
  assert.deepEqual(insufficient.selected,[]);
  assert.equal(selectMandatorySources([a,b],ids,{capacity:10000,maxFiles:1}).status,'budget_exceeded');
});

test('missing, ambiguous and deprecated dependencies cannot be presented as complete',()=>{
  for(const bad of [candidate('p:bad',[ids[1]],20,'ambiguous'),candidate('p:bad',[ids[1]],20,'indexed','deprecated'),
    candidate('p:bad',[ids[1]],20,'indexed','invalid_kind')]){
    const result=selectMandatorySources([candidate('p:a',[ids[0]]),bad],ids,{capacity:10000,maxFiles:3});
    assert.equal(result.status,'incomplete');
    assert.deepEqual(result.missing,[ids[1]]);
    assert.deepEqual(result.selected,[]);
  }
  const manifest=semanticPacketManifest(ids,[candidate('p:a',ids)]);
  assert.equal(manifest.planningEligible,false);
  assert.equal(manifest.mandatoryConstraints.status,'incomplete');
  assert.equal(manifest.sourceTextTreatment,'untrusted-data');
});
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
