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
