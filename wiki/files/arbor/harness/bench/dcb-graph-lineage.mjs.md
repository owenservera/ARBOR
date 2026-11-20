# File: harness/bench/dcb-graph-lineage.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | harness/bench/dcb-graph-lineage.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1611 B |
| Lines | 29 |
| Hash | a8702095acf6 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ownerRef | const | 4 | no | const ownerRef=&#39;owner:synthetic&#39;, at=&#39;2026-11-10T06:00:00.000Z&#39;; |
| defs | const | 5 | no | const defs=new Map(); |
| id | const | 7 | no | const id=`dcb:l${i}`; |
| parents | const | 10 | no | const parents=[...defs.keys()]; |
| id | const | 12 | no | const id=`dcb:c${i}`; |
| dependencies | const | 16 | no | const dependencies=[...defs.values()].map(d=&gt;({ref:d.id,revision:d.revision})); |
| sourceRefs | const | 17 | no | const sourceRefs=Array.from({length:250},(_,i)=&gt;`fact:s${i}`); |
| definitionStore | const | 18 | no | const definitionStore={get:id=&gt;defs.get(id),resolve:()=&gt;({sourceRefs,flavorRefs:[],dependencies})}; |
| input | const | 19 | no | const input={definitionStore,bundleId:&#39;dcb:c248&#39;,ownerRef,at}; |
| rounds | const | 21 | no | const rounds=50,t0=performance.now(); |
| result | variable | 22 | no | let result; |
| meanMs | const | 24 | no | const meanMs=(performance.now()-t0)/rounds; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:perf_hooks | import | 2 | external |
| ../src/context/dcb-graph-lineage.mjs | import | 3 | [harness/src/context/dcb-graph-lineage.mjs](../src/context/dcb-graph-lineage.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Deterministic synthetic worst-bound lineage projection: no personal contents.
import { performance } from 'node:perf_hooks';
import { projectDcbGraphLineage } from '../src/context/dcb-graph-lineage.mjs';
const ownerRef='owner:synthetic', at='2026-11-10T06:00:00.000Z';
const defs=new Map();
for(let i=0;i<250;i++) {
  const id=`dcb:l${i}`;
  defs.set(id,{id,ownerRef,mode:'persistent',revision:1,status:'active',sourceRefs:[`fact:s${i}`],parentRefs:[]});
}
const parents=[...defs.keys()];
for(let i=0;i<249;i++) {
  const id=`dcb:c${i}`;
  defs.set(id,{id,ownerRef,mode:'composite',revision:1,status:'active',sourceRefs:[],parentRefs:parents.slice(i,i+2)});
  parents.push(id);
}
const dependencies=[...defs.values()].map(d=>({ref:d.id,revision:d.revision}));
const sourceRefs=Array.from({length:250},(_,i)=>`fact:s${i}`);
const definitionStore={get:id=>defs.get(id),resolve:()=>({sourceRefs,flavorRefs:[],dependencies})};
const input={definitionStore,bundleId:'dcb:c248',ownerRef,at};
for(let i=0;i<5;i++) projectDcbGraphLineage(input);
const rounds=50,t0=performance.now();
let result;
for(let i=0;i<rounds;i++) result=projectDcbGraphLineage(input);
const meanMs=(performance.now()-t0)/rounds;
if(result.nodes.length!==749||result.edges.length!==748||result.effectsAuthorized!==false)
  throw new Error('DCB graph benchmark projection shape drifted');
console.log(JSON.stringify({schema:'vivim.dcb-graph-benchmark/1',node:process.version,
  definitions:defs.size,nodes:result.nodes.length,edges:result.edges.length,rounds,
  meanMs:Number(meanMs.toFixed(3)),synthetic:true}));
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
