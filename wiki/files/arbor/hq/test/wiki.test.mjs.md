# File: hq/test/wiki.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/wiki.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 19893 B |
| Lines | 493 |
| Hash | 9853e1b99794 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| addProject | function | 14 | no | function addProject(db, { name, dir, branch = &#39;main&#39;, head = &#39;deadbeefcafe&#39;, remote = null }) { |
| info | const | 15 | no | const info = db |
| addFile | function | 24 | no | function addFile(db, projectId, projectDir, relPath, content, options = {}) { |
| absPath | const | 25 | no | const absPath = join(projectDir, ...relPath.split(&#39;/&#39;)); |
| info | const | 28 | no | const info = db |
| addSymbol | function | 47 | no | function addSymbol(db, { fileId, projectId, name, kind = &#39;function&#39;, line = 1, sig = null, exported = 1, doc = null }) { |
| info | const | 48 | no | const info = db |
| addImport | function | 57 | no | function addImport(db, { fileId, projectId, specifier, kind = &#39;import&#39;, line = 1, resolvedFileId = null, resolvedProjectId = null }) { |
| addCommit | function | 64 | no | function addCommit(db, { sha, projectId, date, subject, type = null, scope = null }) { |
| addAnnotation | function | 71 | no | function addAnnotation(db, { fileId, projectId, line = 1, kind, text, owner = null, ref = null }) { |
| makeMainFixture | function | 77 | no | function makeMainFixture() { |
| root | const | 78 | no | const root = mkdtempSync(join(tmpdir(), &#39;hq-wiki-main-&#39;)); |
| db | const | 79 | no | const db = openMemoryDb(); |
| alphaDir | const | 80 | no | const alphaDir = join(root, &#39;alpha&#39;); |
| betaDir | const | 81 | no | const betaDir = join(root, &#39;beta&#39;); |
| alphaId | const | 85 | no | const alphaId = addProject(db, { name: &#39;alpha&#39;, dir: alphaDir, branch: &#39;main&#39;, head: &#39;aaaa1111bbbb2222&#39; }); |
| betaId | const | 86 | no | const betaId = addProject(db, { name: &#39;beta&#39;, dir: betaDir, branch: &#39;dev&#39;, head: &#39;cccc3333dddd4444&#39; }); |
| fileA | const | 89 | no | const fileA = addFile( db, alphaId, alphaDir, &#39;src/a.mjs&#39;, |
| fileB | const | 96 | no | const fileB = addFile(db, alphaId, alphaDir, &#39;src/b.mjs&#39;, &#39;export function beta() { return 1; }\\n&#39;); |
| fileGuide | const | 97 | no | const fileGuide = addFile(db, betaId, betaDir, &#39;docs/guide.md&#39;, &#39;# Guide &lt;script&gt;alert(1)&lt;/script&gt;\\n\\nBeta docs.\\n&#39;, { lang: &#39;markdown&#39;, kind: &#39;doc&#39;, }); |
| fileC | const | 101 | no | const fileC = addFile(db, betaId, betaDir, &#39;lib/c.ts&#39;, &#39;export function gamma() { return 2; }\\n&#39;, { lang: &#39;typescript&#39;, }); |
| fileD | const | 104 | no | const fileD = addFile(db, betaId, betaDir, &#39;lib/d.ts&#39;, &#39;export const delta = 3;\\n&#39;, { lang: &#39;typescript&#39; }); |
| buildFixture | function | 170 | no | function buildFixture(fixture, options = {}) { |
| readPage | function | 183 | no | function readPage(outDir, pagePath) { |
| assertLinksResolve | function | 188 | no | function assertLinksResolve(outDir, pages) { |
| text | const | 191 | no | const text = readPage(outDir, page.path).replace(/```[\\s\\S]*?```/g, &#39;&#39;); |
| re | const | 192 | no | const re = /\\]\\(([^)\\s]+)\\)/g; |
| target | const | 195 | no | const target = match[1]; |
| clean | const | 197 | no | const clean = target.split(&#39;#&#39;)[0]; |
| resolved | const | 199 | no | const resolved = posix.normalize(posix.join(posix.dirname(page.path), clean)); |
| fixture | const | 214 | no | const fixture = makeMainFixture(); |
| result | const | 216 | no | const result = buildFixture(fixture); |
| expected | const | 222 | no | const expected = [ |
| index | const | 254 | no | const index = readPage(fixture.outDir, &#39;index.md&#39;); |
| project | const | 259 | no | const project = readPage(fixture.outDir, &#39;projects/alpha.md&#39;); |
| docs | const | 264 | no | const docs = readPage(fixture.outDir, &#39;docs.md&#39;); |
| symbols | const | 268 | no | const symbols = readPage(fixture.outDir, &#39;symbols.md&#39;); |
| todos | const | 272 | no | const todos = readPage(fixture.outDir, &#39;todos.md&#39;); |
| deprecated | const | 276 | no | const deprecated = readPage(fixture.outDir, &#39;deprecated.md&#39;); |
| glossary | const | 280 | no | const glossary = readPage(fixture.outDir, &#39;glossary.md&#39;); |
| context | const | 286 | no | const context = readPage(fixture.outDir, &#39;context.md&#39;); |
| search | const | 293 | no | const search = JSON.parse(readPage(fixture.outDir, &#39;search.json&#39;)); |
| fixture | const | 310 | no | const fixture = makeMainFixture(); |
| first | const | 312 | no | const first = buildFixture(fixture); |
| second | const | 313 | no | const second = buildFixture(fixture); |
| third | const | 322 | no | const third = buildFixture(fixture); |
| filePage | const | 327 | no | const filePage = readPage(fixture.outDir, &#39;files/alpha/src/a.mjs.md&#39;); |
| symbols | const | 329 | no | const symbols = readPage(fixture.outDir, &#39;symbols.md&#39;); |
| root | const | 338 | no | const root = mkdtempSync(join(tmpdir(), &#39;hq-wiki-cap-&#39;)); |
| db | const | 339 | no | const db = openMemoryDb(); |
| projectDir | const | 341 | no | const projectDir = join(root, &#39;many&#39;); |
| projectId | const | 343 | no | const projectId = addProject(db, { name: &#39;many&#39;, dir: projectDir }); |
| name | const | 345 | no | const name = `f${String(i).padStart(3, &#39;0&#39;)}.mjs`; |
| result | const | 348 | no | const result = buildWiki({ db, root, projects: [{ name: &#39;many&#39;, path: projectDir }], outDir: join(root, &#39;wiki&#39;), |
| filePages | const | 355 | no | const filePages = result.pages.filter((page) =&gt; page.path.startsWith(&#39;files/&#39;)); |
| names | const | 357 | no | const names = filePages.map((page) =&gt; page.path.split(&#39;/&#39;).pop()).sort(); |
| root | const | 377 | no | const root = mkdtempSync(join(tmpdir(), &#39;hq-wiki-secret-&#39;)); |
| db | const | 378 | no | const db = openMemoryDb(); |
| projectDir | const | 380 | no | const projectDir = join(root, &#39;safe&#39;); |
| projectId | const | 382 | no | const projectId = addProject(db, { name: &#39;safe&#39;, dir: projectDir }); |
| okFile | const | 384 | no | const okFile = addFile(db, projectId, projectDir, &#39;src/ok.mjs&#39;, &#39;export function visible() { return 1; }\\n&#39;); |
| secrets | const | 387 | no | const secrets = [ |
| secretFileId | variable | 397 | no | let secretFileId = null; |
| fileId | const | 399 | no | const fileId = addFile(db, projectId, projectDir, relPath, content, { lang: &#39;other&#39;, kind: &#39;other&#39; }); |
| result | const | 405 | no | const result = buildWiki({ db, root, projects: [{ name: &#39;safe&#39;, path: projectDir }], outDir: join(root, &#39;wiki&#39;), |
| symbols | const | 417 | no | const symbols = readPage(join(root, &#39;wiki&#39;), &#39;symbols.md&#39;); |
| todos | const | 419 | no | const todos = readPage(join(root, &#39;wiki&#39;), &#39;todos.md&#39;); |
| search | const | 421 | no | const search = readPage(join(root, &#39;wiki&#39;), &#39;search.json&#39;); |
| index | const | 423 | no | const index = readPage(join(root, &#39;wiki&#39;), &#39;index.md&#39;); |
| fixture | const | 436 | no | const fixture = makeMainFixture(); |
| first | const | 439 | no | const first = buildFixture(fixture); |
| checkDir | const | 449 | no | const checkDir = mkdtempSync(join(tmpdir(), &#39;hq-wiki-poison-&#39;)); |
| checkBuild | const | 451 | no | const checkBuild = buildFixture(fixture, { outDir: checkDir, force: true, persistHashes: false }); |
| second | const | 460 | no | const second = buildFixture(fixture); |
| fixture | const | 470 | no | const fixture = makeMainFixture(); |
| first | const | 472 | no | const first = buildFixture(fixture); |
| orphanRel | const | 474 | no | const orphanRel = &#39;files/alpha/src/b.mjs.md&#39;; |
| orphanId | const | 476 | no | const orphanId = `file:alpha:src/b.mjs`; |
| second | const | 485 | no | const second = buildFixture(fixture); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| node:fs | import | 4 | external |
| node:os | import | 5 | external |
| node:path | import | 6 | external |
| ../lib/schema.mjs | import | 7 | [hq/lib/schema.mjs](../lib/schema.mjs.md) |
| ../lib/wiki.mjs | import | 8 | [hq/lib/wiki.mjs](../lib/wiki.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/test/wiki.test.mjs — deterministic, incremental wiki generation.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, posix } from 'node:path';
import { openMemoryDb } from '../lib/schema.mjs';
import { buildWiki } from '../lib/wiki.mjs';

// ---------------------------------------------------------------------------
// Synthetic index helpers
// ---------------------------------------------------------------------------

function addProject(db, { name, dir, branch = 'main', head = 'deadbeefcafe', remote = null }) {
  const info = db
    .prepare(
      `INSERT INTO projects(name, path, kind, remote, branch, head, file_count, symbol_count, added_at, indexed_at)
       VALUES (?, ?, 'dir', ?, ?, ?, 0, 0, '2026-01-01T00:00:00Z', '2026-01-06T00:00:00Z')`,
    )
    .run(name, dir, remote, branch, head);
  return Number(info.lastInsertRowid);
}

function addFile(db, projectId, projectDir, relPath, content, options = {}) {
  const absPath = join(projectDir, ...relPath.split('/'));
  mkdirSync(dirname(absPath), { recursive: true });
  writeFileSync(absPath, content, 'utf8');
  const info = db
    .prepare(
      `INSERT INTO files(project_id, path, abs_path, lang, kind, size, mtime_ms, hash, lines, is_test, is_generated, indexed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, '2026-01-06T00:00:00Z')`,
    )
    .run(
      projectId,
      relPath,
      absPath,
      options.lang || 'javascript',
      options.kind || 'source',
      Buffer.byteLength(content, 'utf8'),
      options.mtimeMs || 1767225600000,
      options.hash || `hash-${relPath}`,
      content.split(/\r?\n/).length,
    );
  return Number(info.lastInsertRowid);
}

function addSymbol(db, { fileId, projectId, name, kind = 'function', line = 1, sig = null, exported = 1, doc = null }) {
  const info = db
    .prepare(
      `INSERT INTO symbols(file_id, project_id, name, kind, line, end_line, signature, exported, doc)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(fileId, projectId, name, kind, line, line, sig || `function ${name}()`, exported ? 1 : 0, doc);
  return Number(info.lastInsertRowid);
}

function addImport(db, { fileId, projectId, specifier, kind = 'import', line = 1, resolvedFileId = null, resolvedProjectId = null }) {
  db.prepare(
    `INSERT INTO imports(file_id, project_id, specifier, kind, resolved_file_id, resolved_project_id, line)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(fileId, projectId, specifier, kind, resolvedFileId, resolvedProjectId, line);
}

function addCommit(db, { sha, projectId, date, subject, type = null, scope = null }) {
  db.prepare(
    `INSERT INTO commits(sha, project_id, author, date, subject, type, scope, files_changed, inserted_at)
     VALUES (?, ?, 'Owner', ?, ?, ?, ?, 0, '2026-01-06T00:00:00Z')`,
  ).run(sha, projectId, date, subject, type, scope);
}

function addAnnotation(db, { fileId, projectId, line = 1, kind, text, owner = null, ref = null }) {
  db.prepare(
    `INSERT INTO annotations(file_id, project_id, line, kind, text, owner, ref) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(fileId, projectId, line, kind, text, owner, ref);
}

function makeMainFixture() {
  const root = mkdtempSync(join(tmpdir(), 'hq-wiki-main-'));
  const db = openMemoryDb();
  const alphaDir = join(root, 'alpha');
```

_First 80 of 494 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
