// Real source snapshot -> incumbent SQLite index -> HQKG exchange -> native
// importer/journal -> native development query. No fake graph or mocked importer.
// Opt in with ARBOR_HQKG_PROOF_BIN_DIR pointing at binaries built from this SHA.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { openMemoryDb } from '../lib/schema.mjs';
import { indexProject } from '../lib/indexer.mjs';
import { exportGraphExchange, importGraphExchange, acknowledgeGraphExport,
  IMPORT_MODE_ENV, IMPORTER_BIN_DIR_ENV } from '../lib/kg-export.mjs';

const binDir = process.env.ARBOR_HQKG_PROOF_BIN_DIR;
const repo = fileURLToPath(new URL('../../', import.meta.url));
const ext = process.platform === 'win32' ? '.exe' : '';
const capability = 'hqkg.semantic-source-query@1';
const src = 'src/semantic_source.rs';
const consumer = 'src/bin/hqkg-development.rs';
const unrelated = 'src/observability.rs';
const projectName = 'actual-hqkg';
const pathOf = path => projectName + '/' + path;

test('real Rust source changes preserve identity and refresh the existing native graph',
  { skip: binDir ? false : 'set ARBOR_HQKG_PROOF_BIN_DIR to exact-source importer and development binaries' }, t => {
    const root = mkdtempSync(join(tmpdir(), 'arbor-actual-semantic-'));
    const project = join(root, 'source');
    const env = { ...process.env, [IMPORT_MODE_ENV]: 'packaged', [IMPORTER_BIN_DIR_ENV]: resolve(binDir) };
    const native = join(resolve(binDir), 'hqkg-development' + ext);
    assert.ok(existsSync(native), 'exact-source development binary required');
    assert.ok(existsSync(join(resolve(binDir),'hqkg-import'+ext)), 'exact-source importer required');
    const db = openMemoryDb();
    const clean = openMemoryDb();
    const metrics = [];
    const query = (journal, op, key, extra = []) => JSON.parse(execFileSync(native,
      [journal, op, key, ...extra], { encoding: 'utf8', timeout: 30_000 }));
    const copy = relative => {
      const target = join(project, relative);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, readFileSync(join(repo, 'native/hqkg', relative)));
    };
    const refresh = (database, label, journal, state) => {
      const started = performance.now();
      const indexed = indexProject({ root, db: database, project: {name: projectName,path: project},
        options:{useGit:false} });
      const indexMs = performance.now() - started;
      assert.deepEqual(indexed.errors, []);
      assert.deepEqual(indexed.incomplete, []);
      assert.equal(indexed.semanticChangeComplete,true);
      const outPath = join(root, label + '.jsonl');
      const exported = exportGraphExchange({db:database,outPath,statePath:state});
      const imported = importGraphExchange({root,journal,exchange:outPath,expectedDigest:exported.digest,env});
      assert.equal(imported.ok,true,JSON.stringify(imported));
      assert.equal(acknowledgeGraphExport({statePath:state,digest:exported.digest,acknowledgment:imported}).acked,true);
      metrics.push({label,indexMs:Math.round(indexMs*100)/100,
        totalMs:Math.round((performance.now()-started)*100)/100,
        added:indexed.added,changed:indexed.changed,unchanged:indexed.unchanged,
        graphEpoch:imported.epochAfter,stats:imported.statsLine});
      return {indexed,exported};
    };
    const journal=join(root,'incremental.hqj'), state=join(root,'incremental.json');
    const sourceView = () => query(journal,'sources',capability).result.anchors
      .find(a=>a.path===pathOf(src)&&a.annotation==='capability');
    const sourceSymbol = () => query(journal,'symbols','sources').result.symbols
      .find(s=>s.path===pathOf(src)&&s.kind==='function');
    try {
      // Actual tracked Rust source; a deliberately bounded slice, not a claim
      // that every import of the full workspace has been resolved.
      for (const path of ['Cargo.toml','src/lib.rs',src,consumer,unrelated]) copy(path);
      refresh(db,'baseline',journal,state);
      const first=sourceView(), symbol=sourceSymbol();
      assert.ok(first&&symbol,'real annotation and real indexed symbol must exist');
      assert.equal(first.state,'indexed-not-live-checked');
      assert.equal(symbol.state,'indexed-not-live-checked');
      const relations=query(journal,'wiring',first.fileId).result;
      assert.ok(relations.dependents.some(r=>r.path===pathOf(consumer)));
      const impact=query(journal,'impact',capability,['3']).result;
      assert.ok(impact.files.some(r=>r.path===pathOf(consumer)));
      assert.ok(!impact.files.some(r=>r.path===pathOf(unrelated)));
      const unchanged=refresh(db,'unchanged',journal,state);
      assert.equal(unchanged.indexed.changed,0);
      assert.deepEqual(sourceView(),first);
      const original=readFileSync(join(project,src),'utf8');
      assert.ok(original.includes('const MAX_MATCHES: usize = 512;'));
      writeFileSync(join(project,src),original.replace('const MAX_MATCHES: usize = 512;',
        'const MAX_MATCHES: usize = 513;'));
      const edited=refresh(db,'edited',journal,state);
      assert.equal(edited.indexed.changed,1);
      const next=sourceView(), nextSymbol=sourceSymbol();
      assert.equal(next.anchorId,first.anchorId);
      assert.equal(next.fileId,first.fileId);
      assert.notEqual(next.digest,first.digest);
      assert.ok(next.revision>first.revision);
      assert.equal(nextSymbol.id,symbol.id);
      assert.notEqual(nextSymbol.digest,symbol.digest);
      assert.deepEqual(query(journal,'impact',capability,['3']).result,impact);
      const independentBefore=sourceView();
      const unrelatedText=readFileSync(join(project,unrelated),'utf8');
      writeFileSync(join(project,unrelated),unrelatedText+'\n// independent source edit\n');
      const other=refresh(db,'unrelated-edit',journal,state);
      assert.equal(other.indexed.changed,1);
      assert.deepEqual(sourceView(),independentBefore,'unrelated source does not advance capability revision');
      assert.deepEqual(sourceSymbol(),nextSymbol);
      // A clean index must export the same semantic graph content, excluding
      // journal-local revision numbers and the exchange state history.
      const cleanJournal=join(root,'clean.hqj');
      const cleanResult=refresh(clean,'clean',cleanJournal,join(root,'clean.json'));
      assert.equal(cleanResult.exported.digest,other.exported.digest);
      assert.deepEqual(query(cleanJournal,'impact',capability,['3']).result,impact);
      const cleanAnchor=query(cleanJournal,'sources',capability).result.anchors
        .find(a=>a.path===pathOf(src)&&a.annotation==='capability');
      assert.equal(cleanAnchor.anchorId,next.anchorId);
      assert.equal(cleanAnchor.digest,next.digest);
      t.diagnostic(JSON.stringify({scope:'five actual tracked files; static source observations only',metrics,
        providerCalls:0,capability,anchorId:next.anchorId,symbolId:nextSymbol.id}));
    } finally {
      db.close(); clean.close(); rmSync(root,{recursive:true,force:true,maxRetries:5,retryDelay:200});
    }
  });
