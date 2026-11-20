# File: hq/catalogue-identity/test/benchmark.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/catalogue-identity/test/benchmark.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 955 B |
| Lines | 13 |
| Hash | 6eb9ef44ad27 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| counts | const | 6 | no | const counts=[1000,10000]; |
| records | const | 8 | no | const records=Array.from({length:n},(_,i)=&gt;({source_id:&#39;fixture&#39;,source_item_id:`F${i}`,type:&#39;tracker&#39;,name:`Task t${i.toString(36)}x` })); |
| x | const | 9 | no | const x={as_of:&#39;2026-11-07T01:00:00Z&#39;,sources:[{id:&#39;fixture&#39;,repository:&#39;owenservera/fixture&#39;,revision:&#39;a&#39;.repeat(40),completeness:&#39;partial&#39;,authority:&#39;test&#39;}],records}; |
| start | const | 10 | no | const start=performance.now();const y=buildCrosswalk(x); const time=Math.round(performance.now()-start); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:perf_hooks | import | 4 | external |
| ../crosswalk.mjs | import | 5 | [hq/catalogue-identity/crosswalk.mjs](../crosswalk.mjs.md) |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 1 | context | — | — | Local deterministic performance probe, no network or production DB. |
| 2 | owner | repos-hq | — | repos-hq |
| 3 | task | — | — | VIVIM-WAVE-C4-LANE-B |

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
