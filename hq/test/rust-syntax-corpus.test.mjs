// Opt-in, source-pinned corpus experiment. It indexes real tracked ARBOR
// implementation trees using the production HQ index and exchange, not
// constructed symbol fixtures. No production database, provider or Host effects.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cpSync,mkdirSync,mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {performance} from 'node:perf_hooks';
import {openMemoryDb} from '../lib/schema.mjs';
import {indexProject} from '../lib/indexer.mjs';
import {exportGraphExchange,importGraphExchange,acknowledgeGraphExport} from '../lib/kg-export.mjs';

const rootSource=fileURLToPath(new URL('../../',import.meta.url));
test('real HQKG and programmability Rust corpus: syntax indexing, no-op and native journal', {
  skip:process.env.VIVIM_HQKG_BIN_DIR?false:'exact-source hqkg-rust-syntax and hqkg-import binaries required'
},t=>{
  const root=mkdtempSync(join(tmpdir(),'arbor-rust-corpus-'));
  const project=join(root,'actual-source');
  const db=openMemoryDb(),legacy=openMemoryDb();
  const prior=process.env.VIVIM_HQKG_RUST_SYNTAX;
  const name='arbor-native-corpus';
  const rustCount=db=>db.prepare("SELECT count(*) AS n FROM files WHERE lang='rust'").get().n;
  const symbolCount=db=>db.prepare("SELECT count(*) AS n FROM symbols").get().n;
  const run=db=>{
    const start=performance.now();
    const result=indexProject({root,db,project:{name,path:project},options:{useGit:false}});
    return {...result,elapsedMs:Number((performance.now()-start).toFixed(2))};
  };
  const outPath=join(root,'exchange.jsonl'),statePath=join(root,'state.json'),journal=join(root,'corpus.hqj');
  try{
    for(const path of ['native/hqkg/src','core/programmability/src',
      'native/hqkg/Cargo.toml','core/programmability/Cargo.toml']){
      const target=join(project,path);mkdirSync(dirname(target),{recursive:true});
      cpSync(join(rootSource,path),target,{recursive:true});
    }
    delete process.env.VIVIM_HQKG_RUST_SYNTAX;
    const baseline=run(legacy);
    assert.deepEqual(baseline.errors,[]);
    process.env.VIVIM_HQKG_RUST_SYNTAX='1';
    const initial=run(db);
    t.diagnostic(JSON.stringify({stage:'initial',legacyMs:baseline.elapsedMs,syntaxMs:initial.elapsedMs,
      rustFiles:rustCount(db),legacyRustFiles:rustCount(legacy),errors:initial.errors}));
    assert.deepEqual(initial.errors,[]);
    assert.equal(initial.semanticChangeComplete,true);
    assert.equal(rustCount(db),rustCount(legacy));
    assert.ok(rustCount(db)>20);
    const syntaxSymbols=db.prepare("SELECT count(*) AS n FROM symbols WHERE qualified_name IS NOT NULL").get().n;
    assert.ok(syntaxSymbols>0);
    const first=exportGraphExchange({db,outPath,statePath});
    const imported=importGraphExchange({root,journal,exchange:outPath,expectedDigest:first.digest,
      env:{...process.env,HQKG_IMPORT_MODE:'packaged'}});
    assert.equal(imported.ok,true,JSON.stringify(imported));
    assert.equal(acknowledgeGraphExport({statePath,digest:first.digest,acknowledgment:imported}).acked,true);
    const next=run(db);
    assert.deepEqual(next.errors,[]);
    assert.equal(next.changed,0);
    assert.equal(next.added,0);
    assert.equal(next.removed,0);
    const second=exportGraphExchange({db,outPath,statePath});
    const replay=importGraphExchange({root,journal,exchange:outPath,expectedDigest:second.digest,
      env:{...process.env,HQKG_IMPORT_MODE:'packaged'}});
    assert.equal(replay.ok,true,JSON.stringify(replay));
    assert.equal(replay.epochBefore,replay.epochAfter);
    assert.equal(first.digest,second.digest);
    const rows=readFileSync(outPath,'utf8').trim().split('\n').slice(1).map(JSON.parse);
    t.diagnostic(JSON.stringify({stage:'measured',rustFiles:rustCount(db),legacySymbols:symbolCount(legacy),
      syntaxSymbols,legacyMs:baseline.elapsedMs,syntaxInitialMs:initial.elapsedMs,syntaxNoOpMs:next.elapsedMs,
      nodes:first.stats.nodes,edges:first.stats.edges,syntaxBindings:rows.filter(r=>r.relation==='binds-indexed-symbol').length,
      providerCalls:0,epoch:replay.epochAfter,scope:'native/hqkg/src + core/programmability/src only; lexical syntax, not rustc resolution'}));
  }finally{
    if(prior===undefined)delete process.env.VIVIM_HQKG_RUST_SYNTAX;else process.env.VIVIM_HQKG_RUST_SYNTAX=prior;
    db.close();legacy.close();rmSync(root,{recursive:true,force:true,maxRetries:5,retryDelay:100});
  }
});
