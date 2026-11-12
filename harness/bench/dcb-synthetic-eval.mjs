// Fully synthetic benchmark for DCB v2 adaptive retrieval policy.
// Runs locally; no network, provider, private memory or status mutation.
// Reports SOURCE SELECTION ONLY, not full model/task-quality acceptance.
import { performance } from 'node:perf_hooks';
import { selectDcbSources } from '../src/context/dcb-source-selection.mjs';
export const DCB_BENCH_SCHEMA='vivim.dcb-synthetic-benchmark/1';
const FLAVORS=[
  ['project','implementation','project'],
  ['personal','routine','personal'],
  ['professional','client','source'],
  ['learning','lesson','source'],
  ['research','evidence','source'],
  ['life-planning','appointment','source'],
];
const AT='2026-11-10T06:00:00.000Z';
const round=n=>Math.round(n*1e4)/1e4;
const pctl=(xs,p)=>xs.length?xs[Math.min(xs.length-1,Math.ceil(xs.length*p)-1)]:0;
export function runDcbSyntheticBenchmark({iterations=120,maxSources=8}={}) {
  if(!Number.isSafeInteger(iterations)||iterations<1||iterations>2000
    ||!Number.isSafeInteger(maxSources)||maxSources<1||maxSources>64)
    throw new RangeError('Bounded synthetic benchmark parameters required');
  const candidates=[];
  for(let i=0;i<32;i++)for(const [flavor,topic,classification] of FLAVORS) {
    const ref=`source:${flavor}:${i}`;
    candidates.push({ref,keywords:[flavor,topic,`case-${i}`],classification,
      trust:i%7===0?'owner_confirmed':'sourced',updatedAt:AT,
      entityRef:`entity:${flavor}:${i}`,
      status:i%47===0?'revoked':'active'});
  }
  const available=candidates.map(c=>c.ref);
  const ms=[],results={correct:0,retrieved:0,irrelevant:0,forbidden:0,omissions:0};
  for(let k=0;k<iterations;k++) {
    const f=FLAVORS[k%FLAVORS.length],idx=1+(Math.floor(k/FLAVORS.length)%31);
    const target=`source:${f[0]}:${idx}`;
    const query=`${f[0]} ${f[1]} case-${idx}`;
    const start=performance.now();
    const output=selectDcbSources({
      bundleSourceRefs:available,sourceCandidates:candidates,
      taskText:query,maxSources,now:AT,
    });
    ms.push(performance.now()-start);
    results.correct+=Number(output.selectedRefs.includes(target));
    results.retrieved+=output.selectedRefs.length;
    results.irrelevant+=output.selectedRefs.filter(x=>!x.startsWith(`source:${f[0]}:`)).length;
    results.forbidden+=output.selectedRefs.filter(x=>candidates.find(c=>c.ref===x).status==='revoked').length;
    results.omissions+=output.omissions.length;
  }
  ms.sort((a,b)=>a-b);
  return {
    schema:DCB_BENCH_SCHEMA,kind:'synthetic_source_selection_only',
    cases:iterations,availableSources:candidates.length,maxSources,
    targetRecallAtK:round(results.correct/iterations),
    irrelevantSelectedFraction:round(results.retrieved?results.irrelevant/results.retrieved:0),
    forbiddenSelectedCount:results.forbidden,
    averageOmittedSources:round(results.omissions/iterations),
    latencyMs:{p50:round(pctl(ms,0.5)),p95:round(pctl(ms,0.95)),
      maximum:round(ms[ms.length-1])},
    disclaimer:'Synthetic metadata only. Not evidence of physical Host/Android or provider task success.',
  };
}
if(import.meta.url===`file://${process.argv[1]}`) {
  console.log(JSON.stringify(runDcbSyntheticBenchmark(),null,2));
}
