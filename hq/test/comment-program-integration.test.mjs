// M3 real Rust compiler → JS adapter → existing HQ wiki lifecycle integration.
// This test SKIPS when Cargo is unavailable; the smoke runner separately fails
// without Cargo so a fixture-only suite cannot masquerade as integration.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openMemoryDb } from '../lib/schema.mjs';
import { getActiveProgram, listProgramVersions } from '../lib/wiki-program.mjs';
import {
  loadRustCommentPrograms, previewRustCommentPrograms, activateRustCommentProgram,
  rollbackRustCommentProgram,
} from '../lib/wiki-runtime/rust-comment-adapter.mjs';
import { resolveWikiGesture } from '../lib/comment-wiki-bridge.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const crate = join(root, 'research/comment-program-rust');
const sourceRoot = crate;
const sourcePath = 'examples/recent-visits.ts';
const example = join(crate, sourcePath);
const registry = join(crate, 'examples/registry.json');
const manifest = join(crate, 'Cargo.toml');
const cargo = spawnSync('cargo', ['--version'], { encoding: 'utf8' });
// research/comment-program-rust/ is not present in this checkout (no commit in any
// branch ever added it), so no cargo run can produce compiler stdout. The live-toolchain
// tests stay gated on BOTH the toolchain and the crate, and report which one is missing.
const crateReady = existsSync(manifest);
const cargoReady = cargo.status === 0 && crateReady;
const toolchainSkip = cargo.status !== 0
  ? 'Cargo unavailable: live-toolchain gate PENDING'
  : 'research/comment-program-rust/Cargo.toml is absent from this checkout';
const DDL = `CREATE TABLE IF NOT EXISTS wiki_program_version (
  id TEXT NOT NULL, version INTEGER NOT NULL, config TEXT NOT NULL,
  status TEXT NOT NULL, revision INTEGER NOT NULL,
  owner_confirmed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL, receipt TEXT, PRIMARY KEY (id, version)
);`;
const dbOpen = () => { const db = openMemoryDb(); db.exec(DDL); return db; };
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const opts = {
  sourceRoot, activeScopes: ['owner-read@1'],
  actions: [{ id: 'web.visit.read', domain: 'web', verb: 'visit',
    object: 'read', purpose: 'visit read', risk: 'low', mutates: false,
    actors: ['owner'], approval: false, status: 'wired',
    handler: { command: 'host-owned-not-executed' } }],
  lookupSemantic: id => id === 'web.visit.read@1'
    ? { id, kind: 'action', status: 'current' } : null,
};
function runCompiler(src = example, logicalPath = sourcePath, reg = registry) {
  const proc = spawnSync('cargo', [
    'run', '--quiet', '--manifest-path', manifest, '--',
    'compile', src, '--language', 'ts', '--path', logicalPath, '--registry', reg,
  ], { cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024, timeout: 120000 });
  assert.equal(proc.error, undefined, String(proc.error));
  const parsed = JSON.parse(proc.stdout);
  return { parsed, status: proc.status, stderr: proc.stderr };
}

test('REAL cargo stdout → verified source → wiki preview → approval → versioned rollback', {
  skip: !cargoReady && toolchainSkip,
}, () => {
  const { parsed, status, stderr } = runCompiler();
  assert.equal(status, 0, stderr);
  assert.equal(parsed.schema, 'hq.comment-program/0.1');
  assert.equal(parsed.source.digest, sha(readFileSync(example)));
  assert.equal(parsed.programs[0].sourceMap.path, sourcePath);
  const db = dbOpen();
  try {
    const loaded = loadRustCommentPrograms(JSON.stringify(parsed), { ...opts, db });
    assert.equal(loaded.ok, true, JSON.stringify(loaded.errors));
    const count = () => db.prepare('SELECT COUNT(*) AS n FROM wiki_program_version').get().n;
    const before = count();
    const preview = previewRustCommentPrograms(db, JSON.stringify(parsed), opts);
    assert.equal(preview.ok, true, JSON.stringify(preview.errors));
    assert.equal(preview.verifiedSourceBytes, true);
    assert.equal(preview.sourceVerification.digest, parsed.source.digest);
    assert.equal(count(), before, 'preview must not write');
    const p = preview.previews[0];
    assert.deepEqual(p.wiki.plan.order, [
      'resolve-source', 'apply-filters', 'apply-selection', 'apply-layout', 'render-projections',
    ]);
    assert.ok(p.wiki.diff.added.length <= 8);
    assert.equal(activateRustCommentProgram(db, parsed, 'recent-visits', {
      ...opts, expectedRevision: p.expectedRevision,
      expectedPreviewDigest: p.wiki.digest, expectedManifestDigest: p.manifestDigest,
    }).reason, 'owner_confirmation_required');
    assert.equal(count(), before);
    const approved = {
      ...opts, ownerConfirmed: true, expectedRevision: p.expectedRevision,
      expectedPreviewDigest: p.wiki.digest, expectedManifestDigest: p.manifestDigest,
    };
    const first = activateRustCommentProgram(db, parsed, 'recent-visits', approved);
    assert.equal(first.ok, true, JSON.stringify(first));
    assert.equal(first.version, 1);
    const stored = getActiveProgram(db, 'recent-visits');
    assert.equal(stored.receipt.sourceMap.digest, parsed.source.digest);
    assert.equal(stored.receipt.manifestDigest, p.manifestDigest);
    assert.equal(stored.ownerConfirmed, true);
    assert.equal(activateRustCommentProgram(db, parsed, 'recent-visits', approved)
      .reason, 'stale_or_unreviewed_preview');
    const gesture = resolveWikiGesture(db, {
      programId: 'recent-visits', bindingId: 'open', event: 'click',
    }, opts);
    assert.equal(gesture.schema, 'vivim.command-intent/0.1');
    assert.equal(gesture.outcome, 'candidate');
    assert.equal(gesture.actionId, 'web.visit.read@1');
    assert.deepEqual(gesture.requiredScopes, ['owner-read@1']);
    assert.equal(gesture.effect, undefined, 'Host owns all effects');
    const nextPreview = previewRustCommentPrograms(db, parsed, opts).previews[0];
    const second = activateRustCommentProgram(db, parsed, 'recent-visits', {
      ...opts, ownerConfirmed: true, expectedRevision: nextPreview.expectedRevision,
      expectedPreviewDigest: nextPreview.wiki.digest, expectedManifestDigest: nextPreview.manifestDigest,
    });
    assert.equal(second.version, 2);
    const rolled = rollbackRustCommentProgram(db, {
      id: 'recent-visits', toVersion: 1, expectedRevision: second.revision, ownerConfirmed: true,
    });
    assert.equal(rolled.ok, true);
    assert.equal(rolled.version, 3);
    assert.deepEqual(listProgramVersions(db, { id: 'recent-visits' })
      .map(r => r.status), ['superseded', 'superseded', 'active']);
    assert.equal(getActiveProgram(db, 'recent-visits').receipt.sourceMap.digest, parsed.source.digest);
  } finally { db.close(); }
});

test('REAL compiler refuses unknown actions, missing scopes, forbidden effects and invalid registry', {
  skip: !cargoReady && toolchainSkip,
}, () => {
  const dir = mkdtempSync(join(tmpdir(), 'm3-rust-'));
  try {
    mkdirSync(join(dir, 'src'));
    const src = join(dir, 'src', 'example.ts');
    const reg = join(dir, 'registry.json');
    writeFileSync(reg, JSON.stringify({
      schema: 'hq.comment-registry/0.1',
      actions: [{ id: 'web.visit.read@1', status: 'active', effect: 'read' }],
      scopes: [{ id: 'owner-read@1', status: 'active' }],
    }));
    const base = [
      '// @hq:wiki visits@0.1',
      '// @hq:source docs',
      '// @hq:bind open=web.visit.read@1',
      '// @hq:requires owner-read@1',
    ];
    writeFileSync(src, base.join('\n') + '\n');
    const ok = runCompiler(src, 'src/example.ts', reg);
    assert.equal(ok.status, 0, ok.stderr);
    const db = dbOpen();
    const trust = loadRustCommentPrograms(ok.parsed, { ...opts,
      sourceRoot: dir, db });
    assert.equal(trust.ok, true, JSON.stringify(trust.errors));
    db.close();
    // The read-only compiler's output never contains executable handlers.
    assert.equal(ok.parsed.programs[0].bindings[0].inert, true);
    assert.equal(ok.parsed.programs[0].bindings[0].authorized, false);
    for (const [change, expected] of [
      [lines => lines.filter(l => !l.includes('@hq:requires')), 'missing_requirement'],
      [lines => lines.map(l => l.replace('web.visit.read@1', 'web.visit.unknown@1')), 'unregistered_action'],
      [lines => lines.map(l => l.replace('open=', 'shell=')), 'unsafe_binding'],
      [lines => [...lines, '// @hq:filter query=https://evil.example'], 'invalid_field'],
    ]) {
      writeFileSync(src, change(base).join('\n') + '\n');
      const rejected = runCompiler(src, 'src/example.ts', reg);
      assert.equal(rejected.status, 2, rejected.stderr);
      assert.equal(rejected.parsed.ok, false);
      assert.ok(rejected.parsed.diagnostics.some(d => d.code === expected), JSON.stringify(rejected.parsed));
    }
    writeFileSync(src, base.join('\n') + '\n');
    writeFileSync(reg, JSON.stringify({ schema: 'invalid', actions: [], scopes: [] }));
    const invalid = runCompiler(src, 'src/example.ts', reg);
    assert.equal(invalid.status, 2);
    assert.ok(invalid.parsed.diagnostics.some(d => d.code === 'invalid_registry'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

/**
 * Frozen from Host apps/vivim-host/control/corpus.v1.json: "status" maps to
 * vivim.status.show with empty args. Validate the shared typed semantics ONLY.
 * Host risk R0/provenance/owner/readiness are intentionally not invented by HQ.
 */
test('REAL wiki gesture matches a frozen Host V0.1 text command on shared typed identity', {
  skip: !cargoReady && toolchainSkip,
}, () => {
  const dir = mkdtempSync(join(tmpdir(), 'm3-host-intent-'));
  try {
    mkdirSync(join(dir, 'src'));
    const src = join(dir, 'src/status.ts');
    const reg = join(dir, 'registry.json');
    writeFileSync(src, [
      '// @hq:wiki system-status@0.1',
      '// @hq:source docs',
      '// @hq:bind open=vivim.status.show@1',
      '// @hq:requires owner-read@1',
    ].join('\n') + '\n');
    writeFileSync(reg, JSON.stringify({
      schema: 'hq.comment-registry/0.1',
      actions: [{ id: 'vivim.status.show@1', status: 'active', effect: 'read' }],
      scopes: [{ id: 'owner-read@1', status: 'active' }],
    }));
    const { parsed, status, stderr } = runCompiler(src, 'src/status.ts', reg);
    assert.equal(status, 0, stderr);
    const hostOpts = {
      sourceRoot: dir, activeScopes: ['owner-read@1'],
      actions: [{ id: 'vivim.status.show', domain: 'vivim', verb: 'show',
        object: 'status', purpose: 'show status', risk: 'low', mutates: false,
        actors: ['owner'], status: 'wired', approval: false,
        handler: { command: 'host-owned-only' } }],
      lookupSemantic: id => id === 'vivim.status.show@1'
        ? { id, kind: 'action', status: 'current' } : null,
    };
    const db = dbOpen();
    try {
      const p = previewRustCommentPrograms(db, parsed, hostOpts).previews[0];
      const result = activateRustCommentProgram(db, parsed, 'system-status', {
        ...hostOpts, ownerConfirmed: true, expectedRevision: p.expectedRevision,
        expectedPreviewDigest: p.wiki.digest, expectedManifestDigest: p.manifestDigest,
      });
      assert.equal(result.ok, true, JSON.stringify(result));
      const gesture = resolveWikiGesture(db, {
        programId: 'system-status', bindingId: 'open', event: 'click',
      }, hostOpts);
      // Host's frozen text command: {text:'status', outcome:'candidate',
      // actionId:'vivim.status.show', args:{}}.
      const hostFrozen = { schema: 'vivim.command-intent/0.1',
        outcome: 'candidate', actionId: 'vivim.status.show', args: {} };
      const common = { schema: gesture.schema, outcome: gesture.outcome,
        actionId: gesture.actionId.replace(/@1$/, ''), args: gesture.args };
      assert.deepEqual(common, hostFrozen);
      // This proves no permission or effect equivalence. Host has R0 and
      // zero scopes; wiki adds an explicit owner-read@1 requirement.
      assert.equal(gesture.risk, 'low');
      assert.deepEqual(gesture.requiredScopes, ['owner-read@1']);
      assert.equal(gesture.effect, undefined);
    } finally { db.close(); }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test.todo('Full Host V0.1 envelope compatibility: catalog-backed risk, canonical, provenance, owner, readiness and scope crosswalk');
