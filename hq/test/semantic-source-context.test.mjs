import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDevIntelligence } from '../lib/arbor-service.mjs';
import { openDb } from '../lib/schema.mjs';
import { searchSemanticReferences } from '../lib/search.mjs';
import { registerSemanticId, deprecateSemanticId, getSemanticId } from '../lib/semantic-registry.mjs';
import { sha256 } from '../lib/util.mjs';

test('real approved source -> HQ index -> semantic search -> verified context', () => {
  const root = mkdtempSync(join(tmpdir(), 'hq-semantic-source-'));
  const project = join(root, 'source');
  const dataDir = join(root, 'data');
  const id = 'hq.source.digest@1';
  const legacy = 'hq.source.legacy@1';
  const unknown = 'hq.source.unknown@1';
  mkdirSync(project);
  const file = join(project, 'util.mjs');
  // Annotate real executable HQ source, not a synthetic semantic store.
  const original = readFileSync(new URL('../lib/util.mjs', import.meta.url), 'utf8');
  const annotation = '// @hq:capability ' + id;
  const source = original.replace('export function sha256(value)', annotation + '\nexport function sha256(value)')
    + '\n// @hq:context ordinary v1 tag\n'
    + '// @hq:capability ' + unknown + '\n'
    + '// @hq:capability ' + legacy + '\n'
    + '// @hq:contract ' + id + '\n'
    + '// @hq:capability duplicate.sample@1 @hq:capability duplicate.sample@1\n'
    + '// @hq:capability malformed\n'
    + 'const fake = "// @hq:capability fake.sample@1";\n';
  const line = source.split('\n').indexOf(annotation) + 1;
  writeFileSync(file, source);
  writeFileSync(join(project, 'incidental.mjs'), 'export const mention = "' + id + '";\n');
  mkdirSync(join(project, '.env-local'));
  writeFileSync(join(project, '.env-local', 'private.mjs'), annotation);
  let db;
  const open = () => openDb(join(dataDir, '.hq', 'index.db'));
  try {
    const hq = createDevIntelligence({ dataDir, approvedRoots: [project], mode: 'diagnostic' });
    hq.registerSource({ name: 'actual-hq', path: project });
    db = open();
    assert.equal(registerSemanticId(db, { id, kind: 'capability' }).ok, true);
    assert.equal(registerSemanticId(db, { id: legacy, kind: 'capability' }).ok, true);
    assert.equal(deprecateSemanticId(db, legacy, { ownerConfirmed: true }).ok, true);
    db.close(); db = null;
    const denied = createDevIntelligence({
      dataDir, approvedRoots: [project], mode: 'host', actorId: 'owner', sessionId: 'test',
      authorize: () => false,
    });
    assert.throws(() => denied.index(), /HQ_HOST_PERMISSION_DENIED/);
    const firstIndex=hq.index();
    assert.equal(firstIndex.errors.length, 0);
    assert.equal(firstIndex.projects[0].semanticChangeComplete,true);
    const firstAnchor=firstIndex.projects[0].semanticChanges.find(c=>c.semanticId===id&&c.annotationKind==='capability');
    assert.equal(firstAnchor.change,'added');
    const results = hq.search({ query: id, project: 'actual-hq' }).results;
    assert.equal(results[0].path, 'util.mjs');
    assert.equal(results[0].line, line);
    assert.equal(results[0].semanticReferences[0].semanticId, id);
    assert.equal(results[0].semanticReferences[0].resolution, 'proposed');
    assert.equal(results[0].semanticReferences[0].contentHash, sha256(source));
    assert.equal(results[0].semanticReferences[0].semanticAnchor.anchorId,firstAnchor.anchorId);
    assert.equal(results[0].semanticReferences[0].semanticAnchor.fingerprint,firstAnchor.fingerprint);
    assert.ok(results[0].snippet.includes('export function sha256'));
    assert.ok(results.some(hit => hit.path === 'incidental.mjs'));
    assert.equal(hq.search({ query: id, project: 'missing' }).results.length, 0);
    const bundle = hq.context({ task: 'inspect ' + id, project: 'actual-hq', budgetTokens: 3000, maxFiles: 1 });
    assert.equal(bundle.sources[0].path, 'util.mjs');
    assert.equal(bundle.sources[0].contentHash, sha256(source));
    assert.ok(bundle.fragment.includes('export function sha256'));
    assert.equal(hq.verifyContext(bundle).valid, true);
    assert.equal(hq.context({ task: id, project: 'actual-hq', budgetTokens: 80 }).sources.length, 0);
    db = open();
    const query = query => searchSemanticReferences(db, { query, project: 'actual-hq' }).results;
    assert.equal(query(unknown)[0].resolution, 'unknown');
    assert.equal(query(legacy)[0].resolution, 'deprecated');
    assert.ok(query(id).some(hit => hit.resolution === 'invalid_kind'));
    assert.equal(query('duplicate.sample@1').length, 1);
    assert.equal(query('fake.sample@1').length, 0);
    assert.equal(db.prepare("SELECT count(*) AS n FROM annotations WHERE kind='v2:capability' AND text='malformed'").get().n, 0);
    assert.equal(db.prepare("SELECT count(*) AS n FROM annotations WHERE kind='context' AND text='ordinary v1 tag'").get().n, 1);
    assert.equal(db.prepare("SELECT count(*) AS n FROM files WHERE path LIKE '.env-local/%'").get().n, 0);
    assert.equal(getSemanticId(db, id).status, 'proposed');
    assert.equal(getSemanticId(db, unknown), null);
    assert.equal(db.prepare('SELECT count(*) AS n FROM semantic_link').get().n, 0);
    db.close(); db = null;
    const unchanged=hq.index().projects[0];
    assert.equal(unchanged.annotations,0);
    assert.deepEqual(unchanged.semanticChanges,[]);
    // Simulate opening a pre-v2 index: unchanged source is backfilled once.
    db = open();
    db.exec("DELETE FROM annotations WHERE kind LIKE 'v2:%'; DELETE FROM meta WHERE key LIKE 'annotation_v2:%'");
    db.close(); db = null;
    assert.equal(hq.index().projects[0].changed, 2);
    assert.equal(hq.search({ query: id, project: 'actual-hq' }).results[0].semanticReferences[0].contentHash, sha256(source));
    assert.equal(hq.index().projects[0].changed, 0);
    // A change outside the selected excerpt invalidates full-file evidence.
    const edited = source + '\nexport const revision = 2;\n';
    writeFileSync(file, edited);
    assert.equal(hq.verifyContext(bundle).valid, false);
    const editedIndex=hq.index();
    assert.equal(editedIndex.errors.length,0);
    const delta=editedIndex.projects[0].semanticChanges.find(c=>c.anchorId===firstAnchor.anchorId);
    assert.equal(delta.change,'changed');
    assert.notEqual(delta.fingerprint,firstAnchor.fingerprint);
    assert.equal(hq.search({ query: id, project: 'actual-hq' }).results[0].semanticReferences[0].contentHash, sha256(edited));
    const changed = edited.replace(annotation, '// removed annotation').replace('// @hq:contract ' + id, '// removed contract');
    writeFileSync(file, changed);
    const removed=hq.index().projects[0].semanticChanges;
    assert.ok(removed.some(c=>c.anchorId===firstAnchor.anchorId&&c.change==='removed'&&c.fingerprint===null));
    assert.equal(hq.search({ query: id, project: 'actual-hq' }).results.some(hit => hit.semanticReferences?.length), false);
    unlinkSync(file);
    hq.index();
    assert.equal(hq.search({ query: legacy, project: 'actual-hq' }).results.some(hit => hit.semanticReferences?.length), false);
  } finally {
    if (db) db.close();
    rmSync(root, { recursive: true, force: true });
  }
});
