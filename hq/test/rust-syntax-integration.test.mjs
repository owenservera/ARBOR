// Real ARBOR Rust source -> native AST -> incumbent SQLite -> HQKG exchange.
// Set VIVIM_HQKG_BIN_DIR to the exact-source Rust build's target/debug.
// No mocked syntax extraction or invented graph.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { openMemoryDb } from '../lib/schema.mjs';
import { indexProject } from '../lib/indexer.mjs';
import { exportGraphExchange, importGraphExchange, acknowledgeGraphExport } from '../lib/kg-export.mjs';
import { indexedSemanticAnchors } from '../lib/semantic-registry.mjs';

test('actual AST annotation binds unique symbol and remains stable through edits', {
  skip:process.env.VIVIM_HQKG_BIN_DIR?false:'exact-source native binary directory required'
},t=>{
  const old=process.env.VIVIM_HQKG_RUST_SYNTAX;
  const root=mkdtempSync(join(tmpdir(),'arbor-ast-proof-')),project=join(root,'src');
  mkdirSync(project);
  const db=openMemoryDb();
  const src=join(project,'rust_syntax.rs');
  const original=readFileSync(new URL('../../native/hqkg/src/rust_syntax.rs',import.meta.url),'utf8');
  const capability='hqkg.rust-syntax-result@1';
  const statePath=join(root,'exchange-state.json'),outPath=join(root,'exchange.jsonl');
  const journal=join(root,'kg.hqj');
  const run=()=>indexProject({root,db,project:{name:'real-native',path:project},options:{useGit:false}});
  const query=()=>db.prepare("SELECT * FROM symbols WHERE qualified_name='extract'").get();
  const rows=()=>{
    const ex=exportGraphExchange({db,outPath,statePath});
    const imported=importGraphExchange({root,journal,exchange:outPath,expectedDigest:ex.digest,
      env:{...process.env,HQKG_IMPORT_MODE:'packaged'}});
    assert.equal(imported.ok,true,JSON.stringify(imported));
    assert.equal(acknowledgeGraphExport({statePath,digest:ex.digest,acknowledgment:imported}).acked,true);
    return readFileSync(outPath,'utf8').trim().split('\n').slice(1).map(JSON.parse);
  };
  const binding=rs=>{
    const anchor=rs.find(r=>r.kind==='semantic-file-anchor'&&r.metadata.semantic_id===capability);
    const sym=rs.find(r=>r.kind==='source-symbol'&&r.metadata.qualified_name==='extract');
    assert.ok(anchor&&sym);
    assert.equal(anchor.metadata.bound_symbol_id,sym.id);
    assert.equal(sym.metadata.assurance,'syntax-only');
    assert.ok(rs.some(r=>r.relation==='binds-indexed-symbol'&&r.from===anchor.id&&r.to===sym.id));
    return {anchor,sym};
  };
  try{
    process.env.VIVIM_HQKG_RUST_SYNTAX='1';
    writeFileSync(src,original);
    const initial=run();assert.deepEqual(initial.errors,[]);
    const a=query();assert.ok(a);
    const doc=db.prepare("SELECT * FROM annotations WHERE kind='v2:contract' AND ref=?").get(capability);
    assert.equal(doc.symbol_qualified_name,'extract');
    assert.equal(doc.symbol_kind,'function');
    assert.equal(db.prepare("SELECT count(*) AS n FROM annotations WHERE kind='v2:contract' AND ref=?").get(capability).n,1);
    const first=binding(rows());
    const file=db.prepare("SELECT id,hash,path FROM files WHERE path='rust_syntax.rs'").get();
    const anchor=indexedSemanticAnchors(db,{fileId:file.id,project:'real-native',path:file.path,hash:file.hash}).find(x=>x.semanticId===capability);
    assert.equal(anchor.syntaxBinding.qualifiedName,'extract');
    assert.equal(anchor.syntaxBinding.syntaxDigest,a.syntax_digest);
    assert.equal(run().changed,0);
    writeFileSync(src,'\n'+original);
    assert.deepEqual(run().errors,[]);
    const next=query(),second=binding(rows());
    assert.equal(next.line,a.line+1);
    assert.equal(next.syntax_digest,a.syntax_digest);
    assert.equal(next.signature_digest,a.signature_digest);
    assert.equal(second.sym.id,first.sym.id);
    assert.equal(second.anchor.id,first.anchor.id);
    assert.notEqual(second.sym.metadata.content_sha256,first.sym.metadata.content_sha256);
    // Removing only the real declaration's doc tag retracts the binding.
    writeFileSync(src,original.replace('/// @hq:contract '+capability,'/// Contract annotation removed.'));
    assert.deepEqual(run().errors,[]);
    const after=rows();
    assert.ok(after.some(r=>r.type==='tombstone'&&r.id===first.anchor.id));
    assert.ok(!after.some(r=>r.relation==='binds-indexed-symbol'&&r.from===first.anchor.id));
    assert.equal(query().signature_digest,a.signature_digest);
    // A parser outage cannot silently downgrade a project to regex extraction.
    delete process.env.VIVIM_HQKG_RUST_SYNTAX;
    assert.throws(run,/rust_syntax_required_for_existing_index/);
    assert.equal(query().qualified_name,'extract');
    t.diagnostic(JSON.stringify({symbolId:first.sym.id,anchorId:first.anchor.id,providerCalls:0,
      scope:'actual rust_syntax.rs; native syntax-only, not type/runtime verification'}));
  }finally{
    if(old===undefined)delete process.env.VIVIM_HQKG_RUST_SYNTAX;else process.env.VIVIM_HQKG_RUST_SYNTAX=old;
    db.close();rmSync(root,{recursive:true,force:true,maxRetries:5,retryDelay:100});
  }
});
