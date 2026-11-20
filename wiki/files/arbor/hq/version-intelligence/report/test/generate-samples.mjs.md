# File: hq/version-intelligence/report/test/generate-samples.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | hq/version-intelligence/report/test/generate-samples.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2337 B |
| Lines | 27 |
| Hash | 0c24e2af616b |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| destination | const | 7 | no | const destination = process.argv[2]; |
| sourcePins | const | 11 | no | const sourcePins = Array.from({length:n}, (_,i) =&gt; ({ pinId:&#39;synthetic&#39;+i, repoIdentity: `synthetic/repo${i}`, resolvedCommitSha:String(i+1).repeat(40), manifestDigest:&#39;a&#39;.repeat(64), completeness:i=… |
| evidenceIndex | const | 13 | no | const evidenceIndex = sourcePins.map((p,i) =&gt; ({id:&#39;evidence&#39;+i,type:&#39;source_blob&#39;,commitSha:p.resolvedCommitSha, blobSha:&#39;a&#39;.repeat(40),path:`src/module-${i}.mjs`,lines:[10,20]})); |
| sample | const | 15 | no | const sample = {schema:&#39;arbor.hvi.version-comparison/1&#39;, targetPinId:&#39;synthetic&#39;+(n-1), sourcePins, evidenceIndex, |
| prefix | const | 21 | no | const prefix=`SYNTHETIC-${n}PIN`; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 2 | external |
| node:path | import | 3 | external |
| ../index.mjs | import | 4 | [hq/version-intelligence/report/index.mjs](../index.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
