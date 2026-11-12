/** Build explicitly synthetic audit review samples. No donor code or private data. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { exportVersionComparison } from '../index.mjs';
// The relative output location may be repository-root dependent when vendored.
// Call with an absolute output dir for repeatability; no default writing into runtime.
const destination = process.argv[2];
if (!destination) throw new Error('Usage: node generate-samples.mjs <absolute-output-directory>');
mkdirSync(destination, {recursive:true});
for (const n of [2,3,5]) {
  const sourcePins = Array.from({length:n}, (_,i) => ({ pinId:'synthetic'+i, repoIdentity: `synthetic/repo${i}`,
    resolvedCommitSha:String(i+1).repeat(40), manifestDigest:'a'.repeat(64), completeness:i===0?'partial':'complete' }));
  const evidenceIndex = sourcePins.map((p,i) => ({id:'evidence'+i,type:'source_blob',commitSha:p.resolvedCommitSha,
    blobSha:'a'.repeat(40),path:`src/module-${i}.mjs`,lines:[10,20]}));
  const sample = {schema:'arbor.hvi.version-comparison/1', targetPinId:'synthetic'+(n-1), sourcePins, evidenceIndex,
    sourceDeltas:sourcePins.map((p,i)=>({id:'delta'+i,sourcePinId:p.pinId,category:i===0?'MISSING_AT_TARGET':i%2?'EXACT_RELOCATION':'SPLIT_CANDIDATE',
      sourcePath:`src/module-${i}.mjs`,targetPaths:i===0?[]:[`hq/relocated-${i}.mjs`],sourceBlob:'a'.repeat(40),sourceLines:[10,20],
      certainty:'candidate',similarityConfidence:0.5,owner:'hq',evidenceRefs:['evidence'+i]})),
    capabilityDeltas:[{id:'cap:synthetic',sourcePinId:'synthetic0',category:'DESIGN_ONLY',owner:'labs',sourcePath:'docs/plan.md',evidenceRefs:[]}],
    runtimeProof:[{id:'synthetic-node-test',state:'UNRUN'}] };
  const prefix=`SYNTHETIC-${n}PIN`;
  writeFileSync(resolve(destination, prefix+'.input.json'), JSON.stringify(sample,null,2)+'\n');
  writeFileSync(resolve(destination, prefix+'.report.json'), exportVersionComparison(sample,{format:'json',limit:20}));
  writeFileSync(resolve(destination, prefix+'.report.md'), exportVersionComparison(sample,{format:'markdown',limit:20}));
  writeFileSync(resolve(destination, prefix+'.review.csv'), exportVersionComparison(sample,{format:'csv',limit:20}));
}
console.log('generated synthetic 2/3/5 pin report samples into '+destination);
