# File: hq/test/comment-program-integration.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/comment-program-integration.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12823 B |
| Lines | 243 |
| Hash | 77850d9ed686 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 21 | no | const root = fileURLToPath(new URL(&#39;../../&#39;, import.meta.url)); |
| crate | const | 22 | no | const crate = join(root, &#39;research/comment-program-rust&#39;); |
| sourceRoot | const | 23 | no | const sourceRoot = crate; |
| sourcePath | const | 24 | no | const sourcePath = &#39;examples/recent-visits.ts&#39;; |
| example | const | 25 | no | const example = join(crate, sourcePath); |
| registry | const | 26 | no | const registry = join(crate, &#39;examples/registry.json&#39;); |
| manifest | const | 27 | no | const manifest = join(crate, &#39;Cargo.toml&#39;); |
| cargo | const | 28 | no | const cargo = spawnSync(&#39;cargo&#39;, [&#39;--version&#39;], { encoding: &#39;utf8&#39; }); |
| crateReady | const | 32 | no | const crateReady = existsSync(manifest); |
| cargoReady | const | 33 | no | const cargoReady = cargo.status === 0 &amp;&amp; crateReady; |
| toolchainSkip | const | 34 | no | const toolchainSkip = cargo.status !== 0 |
| DDL | const | 37 | no | const DDL = `CREATE TABLE IF NOT EXISTS wiki_program_version ( id TEXT NOT NULL, version INTEGER NOT NULL, config TEXT NOT NULL, status TEXT NOT NULL, revision INTEGER NOT NULL, owner_confirmed INTEG… |
| dbOpen | function | 43 | no | const dbOpen = () =&gt; { const db = openMemoryDb(); db.exec(DDL); return db; }; |
| sha | function | 44 | no | const sha = bytes =&gt; createHash(&#39;sha256&#39;).update(bytes).digest(&#39;hex&#39;); |
| opts | const | 45 | no | const opts = { |
| runCompiler | function | 54 | no | function runCompiler(src = example, logicalPath = sourcePath, reg = registry) { |
| proc | const | 55 | no | const proc = spawnSync(&#39;cargo&#39;, [ &#39;run&#39;, &#39;--quiet&#39;, &#39;--manifest-path&#39;, manifest, &#39;--&#39;, &#39;compile&#39;, src, &#39;--language&#39;, &#39;ts&#39;, &#39;--path&#39;, logicalPath, &#39;--registry&#39;, reg, ], { cwd: root, encoding: &#39;utf8&#39;, … |
| parsed | const | 60 | no | const parsed = JSON.parse(proc.stdout); |
| db | const | 72 | no | const db = dbOpen(); |
| loaded | const | 74 | no | const loaded = loadRustCommentPrograms(JSON.stringify(parsed), { ...opts, db }); |
| count | function | 76 | no | const count = () =&gt; db.prepare(&#39;SELECT COUNT(*) AS n FROM wiki_program_version&#39;).get().n; |
| before | const | 77 | no | const before = count(); |
| preview | const | 78 | no | const preview = previewRustCommentPrograms(db, JSON.stringify(parsed), opts); |
| p | const | 83 | no | const p = preview.previews[0]; |
| approved | const | 93 | no | const approved = { |
| first | const | 97 | no | const first = activateRustCommentProgram(db, parsed, &#39;recent-visits&#39;, approved); |
| stored | const | 100 | no | const stored = getActiveProgram(db, &#39;recent-visits&#39;); |
| gesture | const | 106 | no | const gesture = resolveWikiGesture(db, { programId: &#39;recent-visits&#39;, bindingId: &#39;open&#39;, event: &#39;click&#39;, }, opts); |
| nextPreview | const | 114 | no | const nextPreview = previewRustCommentPrograms(db, parsed, opts).previews[0]; |
| second | const | 115 | no | const second = activateRustCommentProgram(db, parsed, &#39;recent-visits&#39;, { ...opts, ownerConfirmed: true, expectedRevision: nextPreview.expectedRevision, expectedPreviewDigest: nextPreview.wiki.digest,… |
| rolled | const | 120 | no | const rolled = rollbackRustCommentProgram(db, { id: &#39;recent-visits&#39;, toVersion: 1, expectedRevision: second.revision, ownerConfirmed: true, }); |
| dir | const | 134 | no | const dir = mkdtempSync(join(tmpdir(), &#39;m3-rust-&#39;)); |
| src | const | 137 | no | const src = join(dir, &#39;src&#39;, &#39;example.ts&#39;); |
| reg | const | 138 | no | const reg = join(dir, &#39;registry.json&#39;); |
| base | const | 144 | no | const base = [ |
| ok | const | 151 | no | const ok = runCompiler(src, &#39;src/example.ts&#39;, reg); |
| db | const | 153 | no | const db = dbOpen(); |
| trust | const | 154 | no | const trust = loadRustCommentPrograms(ok.parsed, { ...opts, sourceRoot: dir, db }); |
| rejected | const | 168 | no | const rejected = runCompiler(src, &#39;src/example.ts&#39;, reg); |
| invalid | const | 175 | no | const invalid = runCompiler(src, &#39;src/example.ts&#39;, reg); |
| dir | const | 189 | no | const dir = mkdtempSync(join(tmpdir(), &#39;m3-host-intent-&#39;)); |
| src | const | 192 | no | const src = join(dir, &#39;src/status.ts&#39;); |
| reg | const | 193 | no | const reg = join(dir, &#39;registry.json&#39;); |
| hostOpts | const | 207 | no | const hostOpts = { |
| db | const | 216 | no | const db = dbOpen(); |
| p | const | 218 | no | const p = previewRustCommentPrograms(db, parsed, hostOpts).previews[0]; |
| result | const | 219 | no | const result = activateRustCommentProgram(db, parsed, &#39;system-status&#39;, { ...hostOpts, ownerConfirmed: true, expectedRevision: p.expectedRevision, expectedPreviewDigest: p.wiki.digest, expectedManifes… |
| gesture | const | 224 | no | const gesture = resolveWikiGesture(db, { programId: &#39;system-status&#39;, bindingId: &#39;open&#39;, event: &#39;click&#39;, }, hostOpts); |
| hostFrozen | const | 229 | no | const hostFrozen = { schema: &#39;vivim.command-intent/0.1&#39;, |
| common | const | 231 | no | const common = { schema: gesture.schema, outcome: gesture.outcome, |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 4 | external |
| node:assert/strict | import | 5 | external |
| node:child_process | import | 6 | external |
| node:fs | import | 7 | external |
| node:crypto | import | 8 | external |
| node:fs | import | 9 | external |
| node:os | import | 10 | external |
| node:path | import | 11 | external |
| node:url | import | 12 | external |
| ../lib/schema.mjs | import | 13 | [hq/lib/schema.mjs](../lib/schema.mjs.md) |
| ../lib/wiki-program.mjs | import | 14 | [hq/lib/wiki-program.mjs](../lib/wiki-program.mjs.md) |
| ../lib/wiki-runtime/rust-comment-adapter.mjs | import | 15 | [hq/lib/wiki-runtime/rust-comment-adapter.mjs](../lib/wiki-runtime/rust-comment-adapter.mjs.md) |
| ../lib/comment-wiki-bridge.mjs | import | 19 | [hq/lib/comment-wiki-bridge.mjs](../lib/comment-wiki-bridge.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 244 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
