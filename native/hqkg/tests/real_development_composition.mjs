// Opt-in source-backed benchmark. Never run on a live Host data directory.
// Usage: node real_development_composition.mjs <exact archive root> <new sibling data dir> <native bin dir>
// Explicit bounded control-subtree task; whole-host selection exceeds the current closure limit.
// This is a scope-specific demonstration, not a whole-repository completeness benchmark.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';

const [archiveArg, dataArg, binArg] = process.argv.slice(2);
assert(archiveArg && dataArg && binArg, 'exact archive, new data directory and bin directory required');
const archive = realpathSync(archiveArg);
const root = realpathSync(join(archive, 'apps', 'vivim-host', 'control'));
const data = resolve(dataArg);
assert(!existsSync(data), 'benchmark requires new data directory');
process.env.HQKG_IMPORT_MODE = 'packaged';
process.env.VIVIM_HQKG_BIN_DIR = realpathSync(binArg);
const { createDevIntelligence } = await import(pathToFileURL(join(archive, 'hq/lib/arbor-service.mjs')));
const { queryDevelopmentGraph } = await import(pathToFileURL(join(archive, 'hq/lib/kg-export.mjs')));
const service = createDevIntelligence({ dataDir:data, approvedRoots:[root], mode:'diagnostic' });
service.registerSource({name:'arbor-control',path:root});
const startIndex=performance.now();
const index=service.index({force:true,useGit:false});
const sync=service.syncNativeGraph();
assert.equal(sync.state,'source-backed',JSON.stringify(sync));
const indexMs=performance.now()-startIndex;
const journal=join(data,'.hq','kg-journal.hqj');
const semanticId='vivim.product-pure-host-bridge@2';
// The read port must accept real versioned capability IDs, but never controls.
for (const key of [semanticId+'\u0000',semanticId+'\u001f',semanticId+'\u007f']) {
  assert.throws(()=>service.nativeGraphQuery({operation:'sources',key}),/HQ_GRAPH_QUERY_INVALID/);
}
const anchorResult=service.nativeGraphQuery({operation:'sources',key:semanticId});
assert.equal(anchorResult.state,'indexed-snapshot',JSON.stringify(anchorResult));
const anchor=anchorResult.result.anchors.find(a=>a.path==='arbor-control/native-product-pure.mjs');
assert(anchor,'real capability anchor missing');
const policy={id:'development-preview',revision:1,max_risk:'R0',max_input_class:'internal',max_output_class:'internal',allowed_destinations:[],allow_effect_candidates:false};
const step=(id,kind,dependencies,inputs)=>({id,kind,dependencies,inputs,output_data_class:'internal',risk:'R0',destination:null});
const program=JSON.stringify({schema:'vivim.native-program/1',policy,program:{
  id:'inspect-bridge-import-impact',revision:1,policy_id:policy.id,policy_revision:policy.revision,
  steps:[
    step('impact','evaluate',['select'],[]),
    step('meaning','interpret',['select'],[]),
    step('select','select_context',[],[{source_id:anchor.fileId,revision:anchor.revision,digest:anchor.digest,data_class:'internal'}])
  ]
}});
const run=()=>queryDevelopmentGraph({root:data,journal,operation:'program',key:anchorResult.epoch,program});
const t=performance.now();
const computed=run();
const coldMs=performance.now()-t;
assert.equal(computed.state,'computed',JSON.stringify(computed));
assert.equal(computed.executionAuthorized,false);
assert.equal(computed.effectPerformed,false);
const select=computed.outputs.find(o=>o.stepId==='select').result;
const impact=computed.outputs.find(o=>o.stepId==='impact').result;
const meaning=computed.outputs.find(o=>o.stepId==='meaning').result;
assert(!select.truncated && !impact.truncated && !meaning.truncated,'incomplete result is not a pass');
// Independent verifier: walk exported canonical edge records, not Rust result rows.
const records=readFileSync(join(data,'.hq','kg-exchange.jsonl'),'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);
const files=new Map(records.filter(r=>r.type==='node'&&r.kind==='source-file').map(r=>[r.id,r]));
const edges=records.filter(r=>r.type==='edge'&&r.relation==='imports'&&files.has(r.from)&&files.has(r.to));
function closure(rootId, reverse) {
  const visited=new Set([rootId]), q=[[rootId,0]], result=new Set();
  for(let i=0;i<q.length;i++){
    const [id,d]=q[i];if(d===3)continue;
    for(const edge of edges){
      const [from,to]=reverse?[edge.to,edge.from]:[edge.from,edge.to];
      if(from!==id||visited.has(to))continue;
      visited.add(to);result.add(to);q.push([to,d+1]);
    }
  }
  return result;
}
const expectedSources=new Set([anchor.fileId,...closure(anchor.fileId,false)]);
assert(expectedSources.size>1,'no actual dependency selected');
const expectedImpact=new Set([...expectedSources].flatMap(id=>[...closure(id,true)]));
assert(expectedImpact.size>0,'no actual dependents selected');
const ids=rows=>rows.map(row=>row.id).sort();
assert.deepEqual(ids(impact.sources),[...expectedSources].sort());
assert.deepEqual(ids(meaning.sources),[...expectedSources].sort());
assert.deepEqual(ids(impact.dependents),[...expectedImpact].sort());
for(const row of impact.sources){
  const file=files.get(row.id);
  assert.equal(row.path,file.metadata.source_path);
  const bytes=readFileSync(join(root,row.path.slice('arbor-control/'.length)));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),row.digest);
  assert(impact.derivedSourceBindings[row.id].includes('select'));
}
assert(meaning.semantics.some(row=>row.semanticId===semanticId),'actual semantic annotation missing');
assert(impact.dependents.some(row=>row.path==='arbor-control/agent-composer-bridge.mjs'),'known real consumer missing');
const timings=[];
for(let i=0;i<5;i++){
 const before=performance.now();const again=run();timings.push(performance.now()-before);
 assert.deepEqual(again,computed,'same-source independent subprocess result differs');
}
console.log(JSON.stringify({schema:'arbor.real-development-composition/1',result:'PASS',scope:'exact archived apps/vivim-host/control only',semanticId,anchor,graphEpoch:sync.epoch,indexMs,coldSubprocessMs:coldMs,repeatedSubprocessMs:timings,sourceCount:impact.sourceCount,dependentCount:impact.dependentCount,semanticCount:meaning.semanticCount,verifiedSourcePaths:impact.sources.map(r=>r.path),knownConsumer:'arbor-control/agent-composer-bridge.mjs',llmCalls:0,effects:0,note:'Repeated subprocesses have separate in-process caches. No LLM baseline, full repository completeness or natural-language resolver acceptance claimed.'}));
