// @hq:context Local deterministic performance probe, no network or production DB.
// @hq:owner repos-hq
// @hq:task VIVIM-WAVE-C4-LANE-B
import { performance } from 'node:perf_hooks';
import { buildCrosswalk } from '../crosswalk.mjs';
const counts=[1000,10000];
for (const n of counts) {
 const records=Array.from({length:n},(_,i)=>({source_id:'fixture',source_item_id:`F${i}`,type:'tracker',name:`Task t${i.toString(36)}x` }));
 const x={as_of:'2026-11-07T01:00:00Z',sources:[{id:'fixture',repository:'owenservera/fixture',revision:'a'.repeat(40),completeness:'partial',authority:'test'}],records};
 const start=performance.now();const y=buildCrosswalk(x); const time=Math.round(performance.now()-start);
 process.stdout.write(JSON.stringify({n,ms:time,heap_mb:Math.round(process.memoryUsage().heapUsed/1024/1024),
  output_records:y.records.length,candidate_pairs:y.duplicate_candidates.length,snapshot_sha256:y.snapshot_sha256})+'\n');
}
