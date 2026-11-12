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
