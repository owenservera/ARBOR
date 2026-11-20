# File: hq/test/comment-wiki-bridge.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/comment-wiki-bridge.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 18319 B |
| Lines | 300 |
| Hash | 2d2704e38c59 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DDL | const | 16 | no | const DDL = `CREATE TABLE IF NOT EXISTS wiki_program_version ( id TEXT NOT NULL, version INTEGER NOT NULL, config TEXT NOT NULL, status TEXT NOT NULL, revision INTEGER NOT NULL, owner_confirmed INTEG… |
| actions | const | 22 | no | const actions = [{ id: &#39;web.read.visit&#39;, domain: &#39;web&#39;, verb: &#39;read&#39;, object: &#39;visit&#39;, |
| lookupSemantic | function | 25 | no | const lookupSemantic = (id) =&gt; id === &#39;web.read.visit@1&#39; |
| opts | const | 27 | no | const opts = { actions, lookupSemantic, worldRevision: 6, catalogRevision: 3, audience: &#39;owner&#39;, scope: &#39;visits&#39; }; |
| memoryDb | function | 28 | no | const memoryDb = () =&gt; { const db = openMemoryDb(); db.exec(DDL); return db; }; |
| manifest | function | 29 | no | function manifest() { |
| commit | function | 38 | no | function commit(db, m) { |
| p | const | 39 | no | const p = previewCommentProgram(db, m, opts); |
| db | const | 48 | no | const db = memoryDb(); const original = manifest(); |
| preview | const | 49 | no | const preview = previewCommentProgram(db, JSON.stringify(original), opts); |
| first | const | 55 | no | const first = commit(db, original); |
| updated | const | 57 | no | const updated = manifest(); updated.sourceMap.digest = &#39;b&#39;.repeat(64); |
| modifiedPreview | const | 59 | no | const modifiedPreview = previewCommentProgram(db, updated, opts); |
| second | const | 62 | no | const second = commit(db, updated); |
| undone | const | 66 | no | const undone = rollbackCommentProgram(db, { id: &#39;recent-visits&#39;, toVersion: 1, expectedRevision: second.revision, ownerConfirmed: true }); |
| db | const | 77 | no | const db = memoryDb(); const m = manifest(); |
| click | const | 79 | no | const click = resolveWikiGesture(db, { programId: &#39;recent-visits&#39;, bindingId: &#39;open&#39;, event: &#39;click&#39; }, opts); |
| spoken | const | 80 | no | const spoken = resolveWikiNaturalLanguage(db, { programId: &#39;recent-visits&#39;, text: &#39;read visit&#39; }, opts); |
| db | const | 97 | no | const db = memoryDb(); |
| db | const | 107 | no | const db = memoryDb(); const m = manifest(); const p = previewCommentProgram(db, m, opts); |
| variations | const | 119 | no | const variations = [ |
| m | const | 135 | no | const m = manifest(); change(m); |
| result | const | 136 | no | const result = validateCommentProgram(m, opts); |
| db | const | 145 | no | const db = memoryDb(); commit(db, manifest()); |
| rustSourceRoot | const | 157 | no | const rustSourceRoot = fileURLToPath(new URL(&#39;../../research/comment-program-rust/&#39;, import.meta.url)); |
| RUST_CRATE | const | 161 | no | const RUST_CRATE = new URL(&#39;../../research/comment-program-rust/&#39;, import.meta.url); |
| RUST_PRESENT | const | 162 | no | const RUST_PRESENT = existsSync(new URL(&#39;examples/recent-visits.ts&#39;, RUST_CRATE)); |
| RUST_SKIP | const | 163 | no | const RUST_SKIP = RUST_PRESENT ? false |
| rustExample | const | 165 | no | const rustExample = RUST_PRESENT |
| rustSourceHash | const | 168 | no | const rustSourceHash = createHash(&#39;sha256&#39;).update(rustExample).digest(&#39;hex&#39;); |
| rustOptions | const | 169 | no | const rustOptions = { sourceRoot: rustSourceRoot, activeScopes: [&#39;owner-read@1&#39;], actions: [{ id: &#39;web.visit.read&#39;, domain: &#39;web&#39;, verb: &#39;visit&#39;, object: &#39;read&#39;, |
| rustOutput | function | 173 | no | function rustOutput() { |
| hash | const | 174 | no | const hash = rustSourceHash; |
| db | const | 187 | no | const db = memoryDb(); const output = rustOutput(); |
| loaded | const | 188 | no | const loaded = loadRustCommentPrograms(JSON.stringify(output), { ...rustOptions, db }); |
| preview | const | 191 | no | const preview = previewRustCommentPrograms(db, output, rustOptions); |
| p | const | 196 | no | const p = preview.previews[0]; |
| result | const | 197 | no | const result = activateRustCommentProgram(db, output, &#39;recent-visits&#39;, { ...rustOptions, ownerConfirmed: true, expectedPreviewDigest: p.wiki.digest, expectedManifestDigest: p.manifestDigest, expected… |
| click | const | 201 | no | const click = resolveWikiGesture(db, { programId: &#39;recent-visits&#39;, bindingId: &#39;open&#39;, event: &#39;click&#39; }, rustOptions); |
| words | const | 202 | no | const words = resolveWikiNaturalLanguage(db, { programId: &#39;recent-visits&#39;, text: &#39;visit read&#39; }, rustOptions); |
| active | const | 206 | no | const active = getActiveProgram(db, &#39;recent-visits&#39;); |
| again | const | 209 | no | const again = previewRustCommentPrograms(db, output, rustOptions).previews[0]; |
| second | const | 210 | no | const second = activateRustCommentProgram(db, output, &#39;recent-visits&#39;, { ...rustOptions, ownerConfirmed: true, expectedPreviewDigest: again.wiki.digest, expectedManifestDigest: again.manifestDigest, … |
| undone | const | 214 | no | const undone = rollbackRustCommentProgram(db, { id: &#39;recent-visits&#39;, toVersion: 1, expectedRevision: second.revision, ownerConfirmed: true }); |
| variations | const | 223 | no | const variations = [ |
| m | const | 231 | no | const m = rustOutput(); change(m); |
| db | const | 237 | no | const db = memoryDb(); const output = rustOutput(); |
| missing | const | 238 | no | const missing = previewRustCommentPrograms(db, output, { ...rustOptions, sourceRoot: undefined }); |
| denied | const | 241 | no | const denied = activateRustCommentProgram(db, output, &#39;recent-visits&#39;, { ...rustOptions, sourceRoot: undefined, ownerConfirmed: true, }); |
| forged | const | 245 | no | const forged = structuredClone(output); |
| shifted | const | 250 | no | const shifted = structuredClone(output); |
| output | const | 258 | no | const output = rustOutput(); |
| removed | const | 263 | no | const removed = structuredClone(output); |
| exec | const | 267 | no | const exec = structuredClone(output); |
| dir | const | 273 | no | const dir = mkdtempSync(join(tmpdir(), &#39;m3-source-proof-&#39;)); |
| doc | const | 274 | no | const doc = rustOutput(); |
| db | const | 275 | no | const db = memoryDb(); |
| copied | const | 278 | no | const copied = join(dir, &#39;examples/recent-visits.ts&#39;); |
| valid | const | 280 | no | const valid = previewRustCommentPrograms(db, doc, { ...rustOptions, sourceRoot: dir }); |
| changed | const | 284 | no | const changed = previewRustCommentPrograms(memoryDb(), doc, { ...rustOptions, sourceRoot: dir }); |
| linked | const | 291 | no | const linked = previewRustCommentPrograms(memoryDb(), doc, { ...rustOptions, sourceRoot: dir }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:crypto | import | 3 | external |
| node:fs | import | 4 | external |
| node:os | import | 5 | external |
| node:path | import | 6 | external |
| node:url | import | 7 | external |
| ../lib/schema.mjs | import | 8 | [hq/lib/schema.mjs](../lib/schema.mjs.md) |
| ../lib/wiki-program.mjs | import | 9 | [hq/lib/wiki-program.mjs](../lib/wiki-program.mjs.md) |
| ../lib/comment-wiki-bridge.mjs | import | 10 | [hq/lib/comment-wiki-bridge.mjs](../lib/comment-wiki-bridge.mjs.md) |
| ../lib/wiki-runtime/rust-comment-adapter.mjs | import | 155 | [hq/lib/wiki-runtime/rust-comment-adapter.mjs](../lib/wiki-runtime/rust-comment-adapter.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 301 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
