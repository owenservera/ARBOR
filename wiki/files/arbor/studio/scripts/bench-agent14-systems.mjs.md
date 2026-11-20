# File: studio/scripts/bench-agent14-systems.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/bench-agent14-systems.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3546 B |
| Lines | 43 |
| Hash | a1707caea30c |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| fixture | const | 5 | no | const fixture = JSON.parse(readFileSync(new URL(&#39;../test/unit/fixtures/systems-fixtures.json&#39;, import.meta.url), &#39;utf8&#39;)); |
| clone | const | 6 | no | const clone = structuredClone; |
| env | const | 7 | no | const env = {node:process.version,platform:process.platform,arch:process.arch,synthetic:true, |
| measure | function | 9 | no | function measure(name, fn, samples = 15) { |
| runs | const | 10 | no | const runs=[];let example, cpu=[]; |
| c | const | 13 | no | const c=process.cpuUsage(), t=performance.now(); |
| u | const | 15 | no | const u=process.cpuUsage(c);cpu.push((u.user+u.system)/1000); |
| sorted | const | 17 | no | const sorted=runs.toSorted((a,b)=&gt;a-b), cpuSorted=cpu.toSorted((a,b)=&gt;a-b); |
| p | function | 18 | no | const p=(a,n)=&gt;+a[Math.ceil(a.length*n)-1].toFixed(3); |
| base | const | 21 | no | const base=clone(fixture.train[0]), scope=fixture.scope; |
| train | const | 22 | no | const train=Array.from({length:300},(_,i)=&gt;({...clone(base),id:`train-${i}`,lineage:`raw-train-${i}`,sourceDigest:`sha256:${i}`})); |
| heldout | const | 23 | no | const heldout=Array.from({length:100},(_,i)=&gt;({...clone(base),id:`test-${i}`,lineage:`raw-test-${i}`,sourceDigest:`sha256:h${i}`})); |
| holdout | const | 24 | no | const holdout=measure(&#39;heldout_lineage_300_train_100_validation&#39;,()=&gt;qualifyHoldout({train,heldout,expectedScope:scope})); |
| observations | const | 25 | no | const observations=Array.from({length:120},(_,i)=&gt;({scope,session:`session-${i}`,lineage:`raw-${i}`,window:10+i%3, candidate:i%2?&#39;.candidate&#39;:&#39;.prior&#39;,outcome:i%2?&#39;present&#39;:&#39;absent&#39;,coverage:&#39;complet… |
| drift | const | 27 | no | const drift=measure(&#39;drift_120_qualified_votes&#39;,()=&gt;assessDrift({scope,incumbent:&#39;.prior&#39;,proposal:&#39;.candidate&#39;,observations})); |
| binding | const | 28 | no | const binding=fixture.binding; |
| events | const | 29 | no | const events=[&#39;intent&#39;,&#39;dispatch&#39;,&#39;delivery&#39;].map((type,i)=&gt;({...binding,type,seq:i+1})); |
| effect | const | 30 | no | const effect=measure(&#39;intent_trace_1000_reviews&#39;,()=&gt;{let result;for(let i=0;i&lt;1000;i++)result=auditEffectTrace({binding,events});return result;}); |
| provenance | const | 31 | no | const provenance=measure(&#39;provenance_1000_reviewed_qualifications&#39;,()=&gt;{let r;for(let i=0;i&lt;1000;i++)r=qualifyProvenance({acceptance:fixture.acceptance,validatedByCore:true,source:fixture.source,expe… |
| STREAMS | const | 32 | no | const STREAMS=32, EVENTS=20000, text=&#39;a&#39;.repeat(16384), sk=scopeKey(scope); |
| stream | const | 33 | no | const stream=measure(&#39;long_stream_20000_updates_32_streams&#39;,()=&gt;{ const p=createBoundedProjection({maxStreams:STREAMS,maxChars:4096}); for(let i=0;i&lt;EVENTS;i++)p.offer({scopeKey:sk,streamId:`stream-$… |
| p | const | 34 | no | const p=createBoundedProjection({maxStreams:STREAMS,maxChars:4096}); |
| s | const | 36 | no | const s=p.snapshot();return {rawUpdates:EVENTS,projectionItems:s.streams.length, |
| races | const | 40 | no | const races=exploreAdmissionSchedules(); |
| output | const | 41 | no | const output={races,schema:&#39;aion.systems-s1-bench/1&#39;,env,measurements:[holdout,drift,effect,provenance,stream], |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:perf_hooks | import | 2 | external |
| node:fs | import | 3 | external |
| ../src/studio/systems-probes.mjs | import | 4 | [studio/src/studio/systems-probes.mjs](../src/studio/systems-probes.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
/** Deterministic synthetic S1 microbenchmarks: no live browser, DB or product imports. */
import { performance } from 'node:perf_hooks';
import { readFileSync } from 'node:fs';
import { qualifyHoldout, assessDrift, auditEffectTrace, createBoundedProjection, qualifyProvenance, scopeKey, exploreAdmissionSchedules } from '../src/studio/systems-probes.mjs';
const fixture = JSON.parse(readFileSync(new URL('../test/unit/fixtures/systems-fixtures.json', import.meta.url), 'utf8'));
const clone = structuredClone;
const env = {node:process.version,platform:process.platform,arch:process.arch,synthetic:true,
  isolation:'standalone S1 implementation; not production Studio or Windows accepted'};
function measure(name, fn, samples = 15) {
  const runs=[];let example, cpu=[];
  fn();
  for(let i=0;i<samples;i++) {
    const c=process.cpuUsage(), t=performance.now();
    example=fn();runs.push(performance.now()-t);
    const u=process.cpuUsage(c);cpu.push((u.user+u.system)/1000);
  }
  const sorted=runs.toSorted((a,b)=>a-b), cpuSorted=cpu.toSorted((a,b)=>a-b);
  const p=(a,n)=>+a[Math.ceil(a.length*n)-1].toFixed(3);
  return {name,samples,p50_ms:p(sorted,0.5),p95_ms:p(sorted,0.95),cpu_p50_ms:p(cpuSorted,0.5),example};
}
const base=clone(fixture.train[0]), scope=fixture.scope;
const train=Array.from({length:300},(_,i)=>({...clone(base),id:`train-${i}`,lineage:`raw-train-${i}`,sourceDigest:`sha256:${i}`}));
const heldout=Array.from({length:100},(_,i)=>({...clone(base),id:`test-${i}`,lineage:`raw-test-${i}`,sourceDigest:`sha256:h${i}`}));
const holdout=measure('heldout_lineage_300_train_100_validation',()=>qualifyHoldout({train,heldout,expectedScope:scope}));
const observations=Array.from({length:120},(_,i)=>({scope,session:`session-${i}`,lineage:`raw-${i}`,window:10+i%3,
  candidate:i%2?'.candidate':'.prior',outcome:i%2?'present':'absent',coverage:'complete',sourceQualified:true,coreAccepted:true}));
const drift=measure('drift_120_qualified_votes',()=>assessDrift({scope,incumbent:'.prior',proposal:'.candidate',observations}));
const binding=fixture.binding;
const events=['intent','dispatch','delivery'].map((type,i)=>({...binding,type,seq:i+1}));
const effect=measure('intent_trace_1000_reviews',()=>{let result;for(let i=0;i<1000;i++)result=auditEffectTrace({binding,events});return result;});
const provenance=measure('provenance_1000_reviewed_qualifications',()=>{let r;for(let i=0;i<1000;i++)r=qualifyProvenance({acceptance:fixture.acceptance,validatedByCore:true,source:fixture.source,expectedScope:scope,refs:fixture.refs});return r;});
const STREAMS=32, EVENTS=20000, text='a'.repeat(16384), sk=scopeKey(scope);
const stream=measure('long_stream_20000_updates_32_streams',()=>{
  const p=createBoundedProjection({maxStreams:STREAMS,maxChars:4096});
  for(let i=0;i<EVENTS;i++)p.offer({scopeKey:sk,streamId:`stream-${i%STREAMS}`,revision:Math.floor(i/STREAMS),text});
  const s=p.snapshot();return {rawUpdates:EVENTS,projectionItems:s.streams.length,
    retainedChars:s.streams.reduce((a,x)=>a+x.text.length,0),
    naiveEventTextChars:EVENTS*text.length,declaredUiGaps:s.metrics.uiGaps,cap:s.cap};
},9);
const races=exploreAdmissionSchedules();
const output={races,schema:'aion.systems-s1-bench/1',env,measurements:[holdout,drift,effect,provenance,stream],
  note:'Synthetic isolated probe speed, not Studio end-to-end throughput. UI preview truncations are explicit and raw log unaffected. Hardware and load determine timings.'};
console.log(JSON.stringify(output,null,2));
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
