import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openMemoryDb } from '../lib/schema.mjs';
import { getActiveProgram, listProgramVersions } from '../lib/wiki-program.mjs';
import {
  COMMENT_PROGRAM_SCHEMA, COMMAND_INTENT_SCHEMA, validateCommentProgram,
  previewCommentProgram, activateCommentProgram, rollbackCommentProgram,
  resolveWikiGesture, resolveWikiNaturalLanguage,
} from '../lib/comment-wiki-bridge.mjs';

const DDL = `CREATE TABLE IF NOT EXISTS wiki_program_version (
  id TEXT NOT NULL, version INTEGER NOT NULL, config TEXT NOT NULL,
  status TEXT NOT NULL, revision INTEGER NOT NULL,
  owner_confirmed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL, receipt TEXT, PRIMARY KEY (id, version)
);`;
const actions = [{ id: 'web.read.visit', domain: 'web', verb: 'read', object: 'visit',
  purpose: 'read visit', risk: 'low', mutates: false, actors: ['owner'],
  approval: false, status: 'wired', handler: { command: 'native-handler-only' } }];
const lookupSemantic = (id) => id === 'web.read.visit@1'
  ? { id, kind: 'action', status: 'current' } : null;
const opts = { actions, lookupSemantic, worldRevision: 6, catalogRevision: 3, audience: 'owner', scope: 'visits' };
const memoryDb = () => { const db = openMemoryDb(); db.exec(DDL); return db; };
function manifest() {
  return { schema: COMMENT_PROGRAM_SCHEMA, compilerVersion: '0.1.0',
    sourceMap: { path: 'src/recent-visits.ts', lineStart: 2, lineEnd: 11, digest: 'a'.repeat(64) },
    config: { id: 'recent-visits', version: 1, source: 'docs',
      filters: { kind: 'browser-visit' }, layout: { columns: ['name', 'date'], density: 'compact' },
      selection: { mode: 'recent', limit: 20 } },
    bindings: [{ id: 'open', event: 'click', actionId: 'web.read.visit@1',
      requiredScopes: ['owner-read@1'], args: { itemId: 'visit-123' } }], diagnostics: [] };
}
function commit(db, m) {
  const p = previewCommentProgram(db, m, opts);
  assert.equal(p.ok, true, JSON.stringify(p.errors));
  return activateCommentProgram(db, m, { ...opts, ownerConfirmed: true,
    expectedPreviewDigest: p.wiki.digest, expectedManifestDigest: p.manifestDigest,
    expectedRevision: p.expectedRevision });
}

// A frozen Rust output fixture: the compiler itself is owned by Lane 2.
test('frozen compiler manifest -> preview -> explicit activation -> revision -> undo', () => {
  const db = memoryDb(); const original = manifest();
  const preview = previewCommentProgram(db, JSON.stringify(original), opts);
  assert.equal(preview.ok, true);
  assert.equal(preview.wiki.activeVersion, null);
  assert.deepEqual(preview.wiki.diff.added, ['id', 'layout', 'selection', 'source', 'filters'].sort());
  assert.equal(getActiveProgram(db, original.config.id), null);
  assert.deepEqual(activateCommentProgram(db, original, opts), { ok: false, reason: 'owner_confirmation_required' });
  const first = commit(db, original);
  assert.equal(first.ok, true); assert.equal(first.version, 1);
  const updated = manifest(); updated.sourceMap.digest = 'b'.repeat(64);
  updated.config.filters.kind = ['browser-visit', 'bookmark'];
  const modifiedPreview = previewCommentProgram(db, updated, opts);
  assert.equal(modifiedPreview.sourceChanged, true);
  assert.deepEqual(modifiedPreview.wiki.diff.changed, ['filters']);
  const second = commit(db, updated);
  assert.equal(second.ok, true); assert.equal(second.version, 2);
  assert.deepEqual(rollbackCommentProgram(db, { id: 'recent-visits', toVersion: 1,
    expectedRevision: second.revision }), { ok: false, reason: 'owner_confirmation_required' });
  const undone = rollbackCommentProgram(db, { id: 'recent-visits', toVersion: 1,
    expectedRevision: second.revision, ownerConfirmed: true });
  assert.equal(undone.ok, true); assert.equal(undone.version, 3);
  assert.deepEqual(getActiveProgram(db, 'recent-visits').config.filters, original.config.filters);
  assert.deepEqual(listProgramVersions(db, { id: 'recent-visits' }).map((x) => x.status),
    ['superseded', 'superseded', 'active']);
  assert.equal(getActiveProgram(db, 'recent-visits').receipt.sourceMap.digest, 'a'.repeat(64));
  db.close();
});

test('wiki click and text create same typed intent, but never invoke native handler', () => {
  const db = memoryDb(); const m = manifest();
  assert.equal(commit(db, m).ok, true);
  const click = resolveWikiGesture(db, { programId: 'recent-visits', bindingId: 'open', event: 'click' }, opts);
  const spoken = resolveWikiNaturalLanguage(db, { programId: 'recent-visits', text: 'read visit' }, opts);
  for (const result of [click, spoken]) {
    assert.equal(result.schema, COMMAND_INTENT_SCHEMA);
    assert.equal(result.outcome, 'candidate');
    assert.equal(result.actionId, 'web.read.visit@1');
    assert.deepEqual(result.args, { itemId: 'visit-123' });
    assert.deepEqual(result.requiredScopes, ['owner-read@1']);
    assert.equal(result.worldRevision, 6); assert.equal(result.catalogRevision, 3);
    assert.equal(result.risk, 'low');
    assert.equal(result.effect, undefined);
  }
  assert.deepEqual({ ...click, provenance: undefined }, { ...spoken, provenance: undefined });
  assert.notEqual(click.provenance.surface, spoken.provenance.surface);
  db.close();
});

test('no gesture resolves before approved activation or after registry revocation', () => {
  const db = memoryDb();
  assert.equal(resolveWikiGesture(db, { programId: 'recent-visits', bindingId: 'open', event: 'click' }, opts).outcome, 'refused');
  commit(db, manifest());
  assert.equal(resolveWikiGesture(db, { programId: 'recent-visits', bindingId: 'missing', event: 'click' }, opts).outcome, 'refused');
  assert.equal(resolveWikiGesture(db, { programId: 'recent-visits', bindingId: 'open', event: 'click' },
    { ...opts, actions: actions.map((a) => ({ ...a, status: 'declared', handler: null })) }).outcome, 'refused');
  db.close();
});

test('stale preview, mismatched manifest digest and revision cannot activate', () => {
  const db = memoryDb(); const m = manifest(); const p = previewCommentProgram(db, m, opts);
  assert.equal(activateCommentProgram(db, m, { ...opts, ownerConfirmed: true, expectedRevision: 0,
    expectedPreviewDigest: p.wiki.digest, expectedManifestDigest: 'bad' }).reason, 'stale_or_unreviewed_preview');
  assert.equal(commit(db, m).ok, true);
  assert.equal(activateCommentProgram(db, m, { ...opts, ownerConfirmed: true, expectedRevision: 0,
    expectedPreviewDigest: p.wiki.digest, expectedManifestDigest: p.manifestDigest }).reason, 'stale_or_unreviewed_preview');
  assert.equal(rollbackCommentProgram(db, { id: 'recent-visits', toVersion: 1,
    ownerConfirmed: true, expectedRevision: 999 }).reason, 'stale_revision');
  db.close();
});

test('strict manifest validation: path, secrets, bindings, registry, config, diagnostics', () => {
  const variations = [
    [(m) => { m.schema = 'other'; }, 'invalid_schema'],
    [(m) => { m.sourceMap.path = '../.env'; }, 'invalid_source_map'],
    [(m) => { m.sourceMap.path = 'src/storage-state.json'; }, 'invalid_source_map'],
    [(m) => { m.sourceMap.digest = 'x'; }, 'invalid_source_map'],
    [(m) => { m.compilerVersion = 'nightly'; }, 'invalid_compiler_version'],
    [(m) => { m.config.source = 'https://example.com'; }, 'invalid_source'],
    [(m) => { m.config.command = 'exec'; }, 'forbidden_key'],
    [(m) => { m.bindings[0].actionId = 'unregistered@1'; }, 'unregistered_or_unwired_action'],
    [(m) => { m.bindings[0].requiredScopes = []; }, 'invalid_binding'],
    [(m) => { m.bindings[0].args = { command: 'rm -rf /' }; }, 'invalid_binding'],
    [(m) => { m.bindings.push({ ...m.bindings[0] }); }, 'duplicate_binding'],
    [(m) => { m.diagnostics = [{ code: 'broken', severity: 'error', message: 'bad' }]; }, 'unsafe_diagnostics'],
    [(m) => { m.shell = 'bash'; }, 'unknown_key'],
  ];
  for (const [change, code] of variations) {
    const m = manifest(); change(m);
    const result = validateCommentProgram(m, opts);
    assert.equal(result.ok, false, code);
    assert.ok(result.errors.some((e) => e.code === code), JSON.stringify(result.errors));
  }
  assert.equal(validateCommentProgram('{', opts).errors[0].code, 'invalid_json');
  assert.equal(validateCommentProgram(' '.repeat(262145), opts).errors[0].code, 'oversized_manifest');
});

test('compound, negated, missing, and ambiguous natural language fails closed', () => {
  const db = memoryDb(); commit(db, manifest());
  assert.equal(resolveWikiNaturalLanguage(db, { programId: 'recent-visits', text: 'do not read visit' }, opts).outcome, 'refused');
  assert.equal(resolveWikiNaturalLanguage(db, { programId: 'recent-visits', text: 'read visit and send message' }, opts).outcome, 'interpretation_required');
  assert.equal(resolveWikiNaturalLanguage(db, { programId: 'recent-visits', text: 'seahorse' }, opts).outcome, 'refused');
  assert.equal(resolveWikiNaturalLanguage(db, { programId: 'recent-visits', text: 'visit' }, opts).outcome, 'clarification_required');
  db.close();
});


// Real Lane 2 emitter shape, frozen from research/comment-program-rust/src/lib.rs.
import { loadRustCommentPrograms, previewRustCommentPrograms,
  activateRustCommentProgram, rollbackRustCommentProgram } from '../lib/wiki-runtime/rust-comment-adapter.mjs';
const rustSourceRoot = fileURLToPath(new URL('../../research/comment-program-rust/', import.meta.url));
// research/comment-program-rust/ is not present in this checkout (no commit in any
// branch ever added it). The affected suite is skipped loudly rather than failing the
// gate on an absent artifact, and stays here for the day the crate lands.
const RUST_CRATE = new URL('../../research/comment-program-rust/', import.meta.url);
const RUST_PRESENT = existsSync(new URL('examples/recent-visits.ts', RUST_CRATE));
const RUST_SKIP = RUST_PRESENT ? false
  : 'orphaned suite: research/comment-program-rust/examples/recent-visits.ts is absent from this checkout';
const rustExample = RUST_PRESENT
  ? readFileSync(new URL('../../research/comment-program-rust/examples/recent-visits.ts', import.meta.url))
  : '';
const rustSourceHash = createHash('sha256').update(rustExample).digest('hex');
const rustOptions = { sourceRoot: rustSourceRoot, activeScopes: ['owner-read@1'], actions: [{ id: 'web.visit.read', domain: 'web', verb: 'visit', object: 'read',
  purpose: 'visit read', risk: 'low', mutates: false, actors: ['owner'],
  approval: false, status: 'wired', handler: { command: 'native-only' } }],
lookupSemantic: (id) => id === 'web.visit.read@1' ? { id, kind: 'action', status: 'current' } : null };
function rustOutput() {
  const hash = rustSourceHash;
  return { schema: 'hq.comment-program/0.1', compilerVersion: '0.1.0', ok: true,
    source: { path: 'examples/recent-visits.ts', digest: hash, language: 'ts' }, diagnostics: [],
    programs: [{ id: 'recent-visits', declarationVersion: '0.1',
      sourceMap: { path: 'examples/recent-visits.ts', line: 4, digest: hash },
      wikiProgram: { schema: 'hq.wiki-program/1', config: {
        id: 'recent-visits', version: 1, source: 'docs', filters: { kind: 'browser-visit' },
        layout: { columns: '3', density: 'compact' }, selection: { mode: 'recent', limit: 20 } } },
      bindings: [{ event: 'open', actionId: 'web.visit.read@1', requires: ['owner-read@1'], inert: true,
        authorized: false }], requires: ['owner-read@1'], evidence: ['test:wiki-recent-visits'] }] };
}

test('real Rust compiler JSON shape previews, activates and produces equivalent inert intents', { skip: RUST_SKIP }, () => {
  const db = memoryDb(); const output = rustOutput();
  const loaded = loadRustCommentPrograms(JSON.stringify(output), { ...rustOptions, db });
  assert.equal(loaded.ok, true, JSON.stringify(loaded.errors));
  assert.equal(loaded.verifiedSourceBytes, false);
  const preview = previewRustCommentPrograms(db, output, rustOptions);
  assert.equal(preview.ok, true);
  assert.equal(preview.verifiedSourceBytes, true);
  assert.equal(preview.sourceVerification.digest, rustSourceHash);
  assert.equal(preview.previews.length, 1);
  const p = preview.previews[0];
  const result = activateRustCommentProgram(db, output, 'recent-visits', { ...rustOptions,
    ownerConfirmed: true, expectedPreviewDigest: p.wiki.digest,
    expectedManifestDigest: p.manifestDigest, expectedRevision: p.expectedRevision });
  assert.equal(result.ok, true);
  const click = resolveWikiGesture(db, { programId: 'recent-visits', bindingId: 'open', event: 'click' }, rustOptions);
  const words = resolveWikiNaturalLanguage(db, { programId: 'recent-visits', text: 'visit read' }, rustOptions);
  assert.equal(click.outcome, 'candidate'); assert.equal(words.outcome, 'candidate');
  assert.equal(click.actionId, 'web.visit.read@1');
  assert.deepEqual({ ...click, provenance: null }, { ...words, provenance: null });
  const active = getActiveProgram(db, 'recent-visits');
  assert.equal(active.receipt.sourceMap.digest, rustSourceHash);
  assert.equal(active.receipt.manifestDigest, p.manifestDigest);
  const again = previewRustCommentPrograms(db, output, rustOptions).previews[0];
  const second = activateRustCommentProgram(db, output, 'recent-visits', { ...rustOptions,
    ownerConfirmed: true, expectedPreviewDigest: again.wiki.digest,
    expectedManifestDigest: again.manifestDigest, expectedRevision: again.expectedRevision });
  assert.equal(second.version, 2);
  const undone = rollbackRustCommentProgram(db, { id: 'recent-visits', toVersion: 1,
    expectedRevision: second.revision, ownerConfirmed: true });
  assert.equal(undone.ok, true);
  assert.equal(undone.version, 3);
  assert.equal(getActiveProgram(db, 'recent-visits').receipt.sourceMap.digest, rustSourceHash);
  db.close();
});

test('Rust compiler errors, unauthorized bindings, drift and unsafe events are refused', () => {
  const variations = [
    m => { m.ok = false; m.diagnostics.push({ code: 'invalid_source', path: 'source', line: 1 }); },
    m => { m.programs[0].bindings[0].authorized = true; },
    m => { m.programs[0].sourceMap.digest = 'd'.repeat(64); },
    m => { m.programs[0].bindings[0].event = 'shell'; },
    m => { m.programs.push(structuredClone(m.programs[0])); },
  ];
  for (const change of variations) {
    const m = rustOutput(); change(m);
    assert.equal(loadRustCommentPrograms(m, rustOptions).ok, false);
  }
});

test('Rust compiler output cannot activate with missing root, tampered bytes or forged position', { skip: RUST_SKIP }, () => {
  const db = memoryDb(); const output = rustOutput();
  const missing = previewRustCommentPrograms(db, output, { ...rustOptions, sourceRoot: undefined });
  assert.equal(missing.ok, false);
  assert.equal(missing.errors[0].code, 'trusted_source_root_required');
  const denied = activateRustCommentProgram(db, output, 'recent-visits', {
    ...rustOptions, sourceRoot: undefined, ownerConfirmed: true,
  });
  assert.equal(denied.reason, 'source_not_verified');
  const forged = structuredClone(output);
  forged.source.digest = 'a'.repeat(64);
  forged.programs[0].sourceMap.digest = forged.source.digest;
  assert.equal(loadRustCommentPrograms(forged, rustOptions).ok, true); // shape alone is not authority
  assert.equal(previewRustCommentPrograms(db, forged, rustOptions).errors[0].code, 'source_digest_mismatch');
  const shifted = structuredClone(output);
  shifted.programs[0].sourceMap.line += 1;
  assert.equal(previewRustCommentPrograms(db, shifted, rustOptions).errors[0].code, 'source_position_mismatch');
  assert.equal(getActiveProgram(db, 'recent-visits'), null);
  db.close();
});

test('Rust adapter refuses scope deletion, mutating actions and arbitrary handlers', () => {
  const output = rustOutput();
  assert.equal(loadRustCommentPrograms(output, { ...rustOptions, activeScopes: [] }).errors[0].code, 'missing_active_scope');
  assert.equal(loadRustCommentPrograms(output, { ...rustOptions, actions: [
    { ...rustOptions.actions[0], mutates: true },
  ] }).errors[0].code, 'read_only_action_required');
  const removed = structuredClone(output);
  removed.programs[0].requires = [];
  removed.programs[0].bindings[0].requires = [];
  assert.equal(loadRustCommentPrograms(removed, rustOptions).ok, false);
  const exec = structuredClone(output);
  exec.programs[0].bindings[0].event = 'shell';
  assert.equal(loadRustCommentPrograms(exec, rustOptions).ok, false);
});

test('trusted source-byte gate rejects disk edits and symlinks, not just forged hashes', { skip: RUST_SKIP }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'm3-source-proof-'));
  const doc = rustOutput();
  const db = memoryDb();
  try {
    mkdirSync(join(dir, 'examples'));
    const copied = join(dir, 'examples/recent-visits.ts');
    writeFileSync(copied, rustExample);
    const valid = previewRustCommentPrograms(db, doc,
      { ...rustOptions, sourceRoot: dir });
    assert.equal(valid.ok, true, JSON.stringify(valid.errors));
    writeFileSync(copied, Buffer.concat([rustExample, Buffer.from('\n// changed\n')]));
    const changed = previewRustCommentPrograms(memoryDb(), doc,
      { ...rustOptions, sourceRoot: dir });
    assert.equal(changed.ok, false);
    assert.equal(changed.errors[0].code, 'source_digest_mismatch');
    rmSync(copied);
    try {
      symlinkSync(join(rustSourceRoot, 'examples/recent-visits.ts'), copied);
      const linked = previewRustCommentPrograms(memoryDb(), doc,
        { ...rustOptions, sourceRoot: dir });
      assert.equal(linked.ok, false);
      assert.equal(linked.errors[0].code, 'unsafe_source_path');
    } catch (err) {
      // Windows without Developer Mode may disallow symlink creation.
      if (!['EPERM', 'EACCES', 'ENOTSUP'].includes(err.code)) throw err;
    }
  } finally { db.close(); rmSync(dir, { recursive: true, force: true }); }
});
