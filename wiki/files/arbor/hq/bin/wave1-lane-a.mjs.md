# File: hq/bin/wave1-lane-a.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/bin/wave1-lane-a.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5246 B |
| Lines | 67 |
| Hash | f2d984f7b78b |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| repoRoot | const | 8 | no | const repoRoot=resolve(dirname(fileURLToPath(import.meta.url)),&#39;..&#39;,&#39;..&#39;); |
| argv | const | 9 | no | const argv=process.argv.slice(2); |
| cmd | const | 10 | no | const cmd=argv[0]; |
| flag | function | 11 | no | function flag(name){const index=argv.indexOf(name);return index&lt;0?undefined:argv[index+1];} |
| hash | function | 12 | no | const hash=text=&gt;createHash(&#39;sha256&#39;).update(text).digest(&#39;hex&#39;); |
| emit | function | 13 | no | const emit=value=&gt;process.stdout.write(JSON.stringify(value,null,2)+&#39;\\n&#39;); |
| main | function | 14 | no | async function main(){ |
| intent | const | 16 | no | const intent=validateIntent(JSON.parse(readFileSync(resolve(flag(&#39;--manifest&#39;)),&#39;utf8&#39;))); |
| roots | const | 17 | no | const roots=verifyRoots(intent); |
| intentDigest | const | 18 | no | const intentDigest=hash(JSON.stringify(intent)); |
| oldDb | const | 19 | no | const oldDb=join(repoRoot,&#39;.hq&#39;,&#39;index.db&#39;); |
| previousHQIndex | const | 20 | no | const previousHQIndex=existsSync(oldDb)?{exists:true,sizeBytes:statSync(oldDb).size}:{exists:false}; |
| out | const | 26 | no | const out=checkOutputDirectory(repoRoot,flag(&#39;--out&#39;)); |
| marker | const | 27 | no | const marker=join(out,&#39;scope.json&#39;); |
| previous | const | 30 | no | const previous=JSON.parse(readFileSync(marker,&#39;utf8&#39;)); |
| db | const | 40 | no | const db=openDb(join(out,&#39;index.db&#39;)); |
| foreign | const | 42 | no | const foreign=db.prepare(&#39;SELECT name FROM projects&#39;).all().filter(p=&gt;!roots.some(r=&gt;r.id===p.name)); |
| runs | const | 44 | no | const runs=[]; |
| secretIgnores | const | 45 | no | const secretIgnores=[&#39;.env&#39;,&#39;.env.*&#39;,&#39;*.env&#39;,&#39;*.pem&#39;,&#39;*.p12&#39;,&#39;*.keystore&#39;,&#39;session.json&#39;,&#39;storage-state.json&#39;,&#39;release-profile.json&#39;,&#39;cookies&#39;,&#39;login data&#39;]; |
| candidates | const | 47 | no | const candidates=discoverFiles(root.path,{extraIgnores:[...root.ignores,...secretIgnores]}); |
| physical | const | 49 | no | const physical=realpathSync(file.abs); |
| rel | const | 50 | no | const rel=relative(root.path,physical); |
| result | const | 53 | no | const result=indexProject({root:repoRoot,db,project:{name:root.id,path:root.path},options:{ignores:[...root.ignores,...secretIgnores]}}); |
| records | const | 58 | no | const records=projectIndex(db,intent,roots,{readSource:readFileSync,parseV2:parseAnnotationV2}); |
| receipt | const | 60 | no | const receipt={schema:&#39;vivim.wave1.lane-a.reset-receipt/1&#39;,strategy:&#39;isolated-new-db&#39;,oldRunResetPerformed:false,oldRunArchived:false,previousHQIndex,previousHQIndexModified:false,durableKBDeleted:fa… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 3 | external |
| node:path | import | 4 | external |
| node:url | import | 5 | external |
| node:crypto | import | 6 | external |
| ../lib/live-graph/wave1/lane-a.mjs | import | 7 | [hq/lib/live-graph/wave1/lane-a.mjs](../lib/live-graph/wave1/lane-a.mjs.md) |
| ../lib/schema.mjs | dynamic | 35 | [hq/lib/schema.mjs](../lib/schema.mjs.md) |
| ../lib/indexer.mjs | dynamic | 36 | [hq/lib/indexer.mjs](../lib/indexer.mjs.md) |
| ../lib/annotation-v2.mjs | dynamic | 37 | [hq/lib/annotation-v2.mjs](../lib/annotation-v2.mjs.md) |
| ../lib/walk.mjs | dynamic | 38 | [hq/lib/walk.mjs](../lib/walk.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
/** Wave 1 Lane A isolated local runner. No destructive reset or canonical writes. */
import {readFileSync,writeFileSync,mkdirSync,existsSync,readdirSync,statSync,realpathSync} from 'node:fs';
import {resolve,join,dirname,relative,isAbsolute,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {validateIntent,verifyRoots,checkOutputDirectory,projectIndex} from '../lib/live-graph/wave1/lane-a.mjs';
const repoRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..','..');
const argv=process.argv.slice(2);
const cmd=argv[0];
function flag(name){const index=argv.indexOf(name);return index<0?undefined:argv[index+1];}
const hash=text=>createHash('sha256').update(text).digest('hex');
const emit=value=>process.stdout.write(JSON.stringify(value,null,2)+'\n');
async function main(){
  if(!['preflight','run'].includes(cmd)||!flag('--manifest'))throw Error('USAGE: node hq/bin/wave1-lane-a.mjs preflight|run --manifest ABS_MANIFEST [--out ABS_DEV_RUN]');
  const intent=validateIntent(JSON.parse(readFileSync(resolve(flag('--manifest')),'utf8')));
  const roots=verifyRoots(intent);
  const intentDigest=hash(JSON.stringify(intent));
  const oldDb=join(repoRoot,'.hq','index.db');
  const previousHQIndex=existsSync(oldDb)?{exists:true,sizeBytes:statSync(oldDb).size}:{exists:false};
  if(cmd==='preflight'){
    emit({status:'READY_FOR_ISOLATED_DEV_INDEX',projectId:intent.projectId,intentRevision:intent.revision,intentDigest,roots:roots.map(r=>({id:r.id,headSha:r.headSha,role:r.role})),previousHQIndex,previousHQIndexModified:false,oldRunResetPerformed:false});
    return;
  }
  if(!flag('--out'))throw Error('OUTPUT_REQUIRED');
  const out=checkOutputDirectory(repoRoot,flag('--out'));
  const marker=join(out,'scope.json');
  if(existsSync(out)&&!existsSync(marker)&&readdirSync(out).length)throw Error('OUTPUT_ALREADY_OCCUPIED');
  if(existsSync(marker)){
    const previous=JSON.parse(readFileSync(marker,'utf8'));
    if(previous.projectId!==intent.projectId||previous.intentDigest!==intentDigest||previous.roots.join(',')!==roots.map(r=>r.id).join(','))throw Error('RUN_SCOPE_CONFLICT');
  }
  mkdirSync(out,{recursive:true});
  const [{openDb},{indexProject},{parseAnnotationV2},{discoverFiles}]=await Promise.all([
    import('../lib/schema.mjs'),
    import('../lib/indexer.mjs'),
    import('../lib/annotation-v2.mjs'),
    import('../lib/walk.mjs')
  ]);
  const db=openDb(join(out,'index.db'));
  try{
    const foreign=db.prepare('SELECT name FROM projects').all().filter(p=>!roots.some(r=>r.id===p.name));
    if(foreign.length)throw Error('ISOLATED_INDEX_OLD_ROOT_CONTAMINATION');
    const runs=[];
    const secretIgnores=['.env','.env.*','*.env','*.pem','*.p12','*.keystore','session.json','storage-state.json','release-profile.json','cookies','login data'];
    for(const root of roots){
      const candidates=discoverFiles(root.path,{extraIgnores:[...root.ignores,...secretIgnores]});
      for(const file of candidates){
        const physical=realpathSync(file.abs);
        const rel=relative(root.path,physical);
        if(rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel))throw Error('INDEX_SYMLINK_OUTSIDE_ROOT:'+root.id);
      }
      const result=indexProject({root:repoRoot,db,project:{name:root.id,path:root.path},options:{ignores:[...root.ignores,...secretIgnores]}});
      runs.push({rootId:root.id,headSha:root.headSha,added:result.added,changed:result.changed,unchanged:result.unchanged,removed:result.removed,symbols:result.symbols,imports:result.imports,annotations:result.annotations,errors:result.errors});
      if(result.errors.length)throw Error('INDEX_ERRORS:'+root.id+':'+result.errors.length);
    }
    verifyRoots(intent); // refuse if indexed sources became dirty or HEAD moved during scan
    const records=projectIndex(db,intent,roots,{readSource:readFileSync,parseV2:parseAnnotationV2});
    if(records.diagnostics.some(d=>d.code==='FILE_UNTRUSTED_SCOPE_OR_HASH'||d.code==='SOURCE_CHANGED_SINCE_INDEX'))throw Error('INDEX_SOURCE_INTEGRITY_FAILED');
    const receipt={schema:'vivim.wave1.lane-a.reset-receipt/1',strategy:'isolated-new-db',oldRunResetPerformed:false,oldRunArchived:false,previousHQIndex,previousHQIndexModified:false,durableKBDeleted:false,projectId:intent.projectId,intentDigest,roots:roots.map(r=>({id:r.id,headSha:r.headSha})),outputDigest:records.digest,counts:records.counts,indexRuns:runs,claims:{staticImportsAreRuntimeCommunications:false,annotationsGrantPermissions:false,graphImported:false,wikiIntegrated:false}};
    writeFileSync(join(out,'observations.json'),JSON.stringify(records,null,2)+'\n');
    writeFileSync(join(out,'reset-receipt.json'),JSON.stringify(receipt,null,2)+'\n');
    writeFileSync(marker,JSON.stringify({projectId:intent.projectId,intentDigest,roots:roots.map(r=>r.id)},null,2)+'\n');
    emit({status:'DEV_INDEX_ONLY',outputDirectory:out,digest:records.digest,counts:records.counts,runs,graphImported:false,wikiIntegrated:false});
  }finally{db.close();}
}
main().catch(error=>{console.error(JSON.stringify({status:'BLOCKED',error:String(error.message||error)}));process.exitCode=1;});
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
