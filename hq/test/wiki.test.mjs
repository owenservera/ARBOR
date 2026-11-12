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
  const betaDir = join(root, 'beta');
  mkdirSync(alphaDir, { recursive: true });
  mkdirSync(betaDir, { recursive: true });

  const alphaId = addProject(db, { name: 'alpha', dir: alphaDir, branch: 'main', head: 'aaaa1111bbbb2222' });
  const betaId = addProject(db, { name: 'beta', dir: betaDir, branch: 'dev', head: 'cccc3333dddd4444' });

  addFile(db, alphaId, alphaDir, 'README.md', '# Alpha\n\nDemo space.\n', { lang: 'markdown', kind: 'doc' });
  const fileA = addFile(
    db,
    alphaId,
    alphaDir,
    'src/a.mjs',
    "import { beta } from './b.mjs';\n\nexport function createAlpha() {\n  return beta();\n}\n",
  );
  const fileB = addFile(db, alphaId, alphaDir, 'src/b.mjs', 'export function beta() { return 1; }\n');
  const fileGuide = addFile(db, betaId, betaDir, 'docs/guide.md', '# Guide <script>alert(1)</script>\n\nBeta docs.\n', {
    lang: 'markdown',
    kind: 'doc',
  });
  const fileC = addFile(db, betaId, betaDir, 'lib/c.ts', 'export function gamma() { return 2; }\n', {
    lang: 'typescript',
  });
  const fileD = addFile(db, betaId, betaDir, 'lib/d.ts', 'export const delta = 3;\n', { lang: 'typescript' });

  addSymbol(db, { fileId: fileA, projectId: alphaId, name: 'createAlpha', kind: 'function', line: 3 });
  addSymbol(db, {
    fileId: fileA,
    projectId: alphaId,
    name: '<script>alert(1)</script>',
    kind: 'const',
    line: 1,
    sig: 'const danger = 1;',
  });
  addSymbol(db, { fileId: fileB, projectId: alphaId, name: 'beta', kind: 'function', line: 1 });
  addSymbol(db, { fileId: fileC, projectId: betaId, name: 'gamma', kind: 'function', line: 1 });
  addSymbol(db, { fileId: fileD, projectId: betaId, name: 'delta', kind: 'const', line: 1, sig: 'export const delta = 3;' });

  addImport(db, { fileId: fileA, projectId: alphaId, specifier: './b.mjs', resolvedFileId: fileB, line: 1 });
  addImport(db, {
    fileId: fileC,
    projectId: betaId,
    specifier: 'alpha/src/a.mjs',
    resolvedFileId: fileA,
    resolvedProjectId: alphaId,
    line: 1,
  });

  addCommit(db, {
    sha: 'a'.repeat(40),
    projectId: alphaId,
    date: '2026-01-04T10:00:00Z',
    subject: 'feat(alpha): first cut',
    type: 'feat',
    scope: 'alpha',
  });
  addCommit(db, {
    sha: 'b'.repeat(40),
    projectId: betaId,
    date: '2026-01-05T12:00:00Z',
    subject: 'fix(beta): guide <script> text',
    type: 'fix',
    scope: 'beta',
  });

  addAnnotation(db, { fileId: fileA, projectId: alphaId, line: 1, kind: 'context', text: 'Alpha entrypoint' });
  addAnnotation(db, { fileId: fileA, projectId: alphaId, line: 2, kind: 'todo', text: 'Add tests', owner: 'owner' });
  addAnnotation(db, {
    fileId: fileA,
    projectId: alphaId,
    line: 3,
    kind: 'deprecated',
    text: 'Use createAlphaV2',
    ref: 'src/b.mjs:1',
  });
  addAnnotation(db, { fileId: fileB, projectId: betaId, line: 1, kind: 'risk', text: 'Fails on empty input' });

  return {
    root,
    db,
    alphaId,
    betaId,
    alphaDir,
    betaDir,
    outDir: join(root, 'wiki'),
    files: { fileA, fileB, fileGuide, fileC, fileD },
  };
}

function buildFixture(fixture, options = {}) {
  return buildWiki({
    db: fixture.db,
    root: fixture.root,
    projects: [
      { name: 'alpha', path: fixture.alphaDir },
      { name: 'beta', path: fixture.betaDir },
    ],
    outDir: fixture.outDir,
    ...options,
  });
}

function readPage(outDir, pagePath) {
  return readFileSync(join(outDir, ...pagePath.split('/')), 'utf8');
}

// Every relative Markdown link must point at a generated file.
function assertLinksResolve(outDir, pages) {
  for (const page of pages) {
    if (!page.path.endsWith('.md')) continue;
    const text = readPage(outDir, page.path).replace(/```[\s\S]*?```/g, '');
    const re = /\]\(([^)\s]+)\)/g;
    let match;
    while ((match = re.exec(text))) {
      const target = match[1];
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      const clean = target.split('#')[0];
      if (!clean) continue;
      const resolved = posix.normalize(posix.join(posix.dirname(page.path), clean));
      assert.ok(!resolved.startsWith('..'), `link escapes wiki root: ${target} in ${page.path}`);
      assert.ok(
        existsSync(join(outDir, ...resolved.split('/'))),
        `broken link ${target} in ${page.path} (resolved ${resolved})`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test('builds the complete wiki, escapes unsafe text and links every page', () => {
  const fixture = makeMainFixture();
  try {
    const result = buildFixture(fixture);
    assert.deepEqual(Object.keys(result).sort(), ['bytes', 'ms', 'pages', 'removed', 'skipped', 'total', 'written']);
    assert.equal(result.written, result.total);
    assert.equal(result.skipped, 0);
    assert.ok(result.bytes > 0);

    const expected = [
      'index.md',
      'projects/alpha.md',
      'projects/beta.md',
      'modules/alpha/root.md',
      'modules/alpha/src.md',
      'modules/beta/docs.md',
      'modules/beta/lib.md',
      'files/alpha/README.md.md',
      'files/alpha/src/a.mjs.md',
      'files/alpha/src/b.mjs.md',
      'files/beta/docs/guide.md.md',
      'files/beta/lib/c.ts.md',
      'files/beta/lib/d.ts.md',
      'symbols.md',
      'graph.md',
      'docs.md',
      'changes.md',
      'todos.md',
      'deprecated.md',
      'protocol.md',
      'glossary.md',
      'context.md',
      'search.json',
      'index.html',
    ];
    for (const pagePath of expected) {
      assert.ok(existsSync(join(fixture.outDir, ...pagePath.split('/'))), `missing page ${pagePath}`);
      assert.ok(result.pages.some((page) => page.path === pagePath), `result missing ${pagePath}`);
    }
    assertLinksResolve(fixture.outDir, result.pages);

    const index = readPage(fixture.outDir, 'index.md');
    assert.match(index, /^# HQ wiki/);
    assert.match(index, /todos\.md/);
    assert.match(index, /glossary\.md/);

    const project = readPage(fixture.outDir, 'projects/alpha.md');
    assert.match(project, /^# Project: alpha/);
    assert.match(project, /\*\*Space\*\*/);
    assert.match(project, /Engineering headings keep "Project"/);

    const docs = readPage(fixture.outDir, 'docs.md');
    assert.match(docs, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.ok(!docs.includes('<script>'), 'docs page must not contain a raw script tag');

    const symbols = readPage(fixture.outDir, 'symbols.md');
    assert.match(symbols, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.ok(!symbols.includes('<script>'), 'symbols page must not contain a raw script tag');

    const todos = readPage(fixture.outDir, 'todos.md');
    assert.match(todos, /Add tests/);
    assert.match(todos, /owner/);

    const deprecated = readPage(fixture.outDir, 'deprecated.md');
    assert.match(deprecated, /Use createAlphaV2/);
    assert.match(deprecated, /src\/b\.mjs:1/);

    const glossary = readPage(fixture.outDir, 'glossary.md');
    assert.match(glossary, /^# VIVIM \+ HQ glossary/);
    assert.match(glossary, /Space/);
    assert.match(glossary, /Discover/);
    assert.match(glossary, /Build/);

    const context = readPage(fixture.outDir, 'context.md');
    assert.match(context, /glossary\.md/);
    assert.match(context, /Discover/);
    assert.match(context, /Progress Report/);
    assert.match(context, /Activity Record/);
    assert.match(context, /Build/);

    const search = JSON.parse(readPage(fixture.outDir, 'search.json'));
    assert.ok(search.some((entry) => entry.id === 'glossary'));
    assert.ok(search.some((entry) => entry.id === 'todos'));
    assert.ok(search.some((entry) => entry.id === 'deprecated'));
    for (const entry of search) {
      assert.ok(entry.tokens.length <= 60, `too many tokens for ${entry.id}`);
      assert.ok(entry.title.length > 0);
    }

    assert.match(readPage(fixture.outDir, 'index.html'), /search\.json/);
  } finally {
    fixture.db.close();
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('second identical run writes nothing; a symbol change rewrites only affected pages', () => {
  const fixture = makeMainFixture();
  try {
    const first = buildFixture(fixture);
    const second = buildFixture(fixture);
    assert.equal(second.written, 0);
    assert.equal(second.skipped, second.total);
    assert.equal(second.bytes, first.bytes);
    assert.ok(second.pages.every((page) => page.generated === false));

    fixture.db
      .prepare('UPDATE symbols SET name = ? WHERE project_id = ? AND name = ?')
      .run('createAlphaRenamed', fixture.alphaId, 'createAlpha');
    const third = buildFixture(fixture);
    assert.ok(third.written > 0, 'expected some pages to be rewritten');
    assert.ok(third.written < third.total, 'expected some pages to be skipped');
    assert.ok(third.pages.filter((page) => page.generated).length === third.written);

    const filePage = readPage(fixture.outDir, 'files/alpha/src/a.mjs.md');
    assert.match(filePage, /createAlphaRenamed/);
    const symbols = readPage(fixture.outDir, 'symbols.md');
    assert.match(symbols, /createAlphaRenamed/);
  } finally {
    fixture.db.close();
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('caps per-file pages at maxFilePages', () => {
  const root = mkdtempSync(join(tmpdir(), 'hq-wiki-cap-'));
  const db = openMemoryDb();
  try {
    const projectDir = join(root, 'many');
    mkdirSync(projectDir, { recursive: true });
    const projectId = addProject(db, { name: 'many', dir: projectDir });
    for (let i = 1; i <= 100; i++) {
      const name = `f${String(i).padStart(3, '0')}.mjs`;
      addFile(db, projectId, projectDir, name, 'export const x = 1;\n');
    }
    const result = buildWiki({
      db,
      root,
      projects: [{ name: 'many', path: projectDir }],
      outDir: join(root, 'wiki'),
      maxFilePages: 10,
    });
    const filePages = result.pages.filter((page) => page.path.startsWith('files/'));
    assert.equal(filePages.length, 10);
    const names = filePages.map((page) => page.path.split('/').pop()).sort();
    assert.deepEqual(names, [
      'f001.mjs.md',
      'f002.mjs.md',
      'f003.mjs.md',
      'f004.mjs.md',
      'f005.mjs.md',
      'f006.mjs.md',
      'f007.mjs.md',
      'f008.mjs.md',
      'f009.mjs.md',
      'f010.mjs.md',
    ]);
  } finally {
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('never emits secret paths or their symbols', () => {
  const root = mkdtempSync(join(tmpdir(), 'hq-wiki-secret-'));
  const db = openMemoryDb();
  try {
    const projectDir = join(root, 'safe');
    mkdirSync(projectDir, { recursive: true });
    const projectId = addProject(db, { name: 'safe', dir: projectDir });

    const okFile = addFile(db, projectId, projectDir, 'src/ok.mjs', 'export function visible() { return 1; }\n');
    addSymbol(db, { fileId: okFile, projectId, name: 'visible' });

    const secrets = [
      ['.env', 'SECRET=1\n'],
      ['.env.local', 'SECRET=2\n'],
      ['config/session.json', '{"token":"x"}\n'],
      ['certs/app.keystore', 'binary-ish\n'],
      ['state/storage-state.json', '{}\n'],
      ['release-profile.json', '{}\n'],
      ['Cookies', 'cookie\n'],
      ['Login Data', 'login\n'],
    ];
    let secretFileId = null;
    for (const [relPath, content] of secrets) {
      const fileId = addFile(db, projectId, projectDir, relPath, content, { lang: 'other', kind: 'other' });
      if (!secretFileId) secretFileId = fileId;
    }
    addSymbol(db, { fileId: secretFileId, projectId, name: 'ENV_SECRET' });
    addAnnotation(db, { fileId: secretFileId, projectId, kind: 'todo', text: 'leaked task', owner: 'nobody' });

    const result = buildWiki({
      db,
      root,
      projects: [{ name: 'safe', path: projectDir }],
      outDir: join(root, 'wiki'),
    });

    for (const page of result.pages) {
      for (const secret of ['.env', 'session.json', 'storage-state.json', 'release-profile.json', 'keystore', 'cookies', 'login data']) {
        assert.ok(!page.path.toLowerCase().includes(secret), `secret path leaked into page ${page.path}`);
      }
    }
    const symbols = readPage(join(root, 'wiki'), 'symbols.md');
    assert.ok(!symbols.includes('ENV_SECRET'), 'secret file symbol leaked');
    const todos = readPage(join(root, 'wiki'), 'todos.md');
    assert.ok(!todos.includes('leaked task'), 'secret file annotation leaked');
    const search = readPage(join(root, 'wiki'), 'search.json');
    assert.ok(!search.includes('.env'), 'secret path leaked into search.json');
    const index = readPage(join(root, 'wiki'), 'index.md');
    assert.ok(!index.includes('.env'), 'secret path leaked into index.md');
  } finally {
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Hash-cache integrity + orphan cleanup (Z.ai R2 regression fixtures)
// ---------------------------------------------------------------------------

test('wiki --check style builds never poison the hash cache: a foreign outDir does not upsert hashes', () => {
  const fixture = makeMainFixture();
  try {
    // 1. Canonical build — writes pages and hash rows.
    const first = buildFixture(fixture);
    assert.ok(first.written > 0);

    // 2. Model changes (a project reindexes) but disk pages are NOT updated.
    fixture.db
      .prepare('UPDATE projects SET indexed_at = ? WHERE name = ?')
      .run('2026-02-02T00:00:00.000Z', 'alpha');

    // 3. A check-style build renders the new content into a THROWAWAY dir.
    //    With persistHashes:false it must not touch wiki_pages.
    const checkDir = mkdtempSync(join(tmpdir(), 'hq-wiki-poison-'));
    try {
      const checkBuild = buildFixture(fixture, { outDir: checkDir, force: true, persistHashes: false });
      assert.ok(checkBuild.written > 0);
    } finally {
      rmSync(checkDir, { recursive: true, force: true });
    }

    // 4. The canonical incremental build must still see the stale page and
    //    rewrite it. (With the R1 bug the check build had already upserted
    //    the new hash, this build skipped, and wiki --check failed forever.)
    const second = buildFixture(fixture);
    assert.ok(second.written > 0, 'the stale canonical page is rewritten, not skipped');
    assert.match(readPage(fixture.outDir, 'projects/alpha.md'), /2026-02-02T00:00:00.000Z/);
  } finally {
    fixture.db.close();
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('canonical builds delete orphaned pages whose sources disappeared', () => {
  const fixture = makeMainFixture();
  try {
    const first = buildFixture(fixture);
    assert.ok(first.written > 0);
    const orphanRel = 'files/alpha/src/b.mjs.md';
    assert.ok(existsSync(join(fixture.outDir, ...orphanRel.split('/'))));
    const orphanId = `file:alpha:src/b.mjs`;
    assert.ok(fixture.db.prepare('SELECT 1 FROM wiki_pages WHERE id = ?').get(orphanId));

    // The source file leaves the index (deleted from the workspace model).
    fixture.db.prepare('DELETE FROM symbols WHERE file_id = ?').run(fixture.files.fileB);
    fixture.db.prepare('DELETE FROM imports WHERE file_id = ? OR resolved_file_id = ?')
      .run(fixture.files.fileB, fixture.files.fileB);
    fixture.db.prepare('DELETE FROM files WHERE id = ?').run(fixture.files.fileB);

    const second = buildFixture(fixture);
    assert.ok((second.removed || 0) >= 1, 'the orphan page is reported as removed');
    assert.ok(!existsSync(join(fixture.outDir, ...orphanRel.split('/'))), 'the orphan page file is deleted');
    assert.ok(!fixture.db.prepare('SELECT 1 FROM wiki_pages WHERE id = ?').get(orphanId), 'the orphan hash row is deleted');
  } finally {
    fixture.db.close();
    rmSync(fixture.root, { recursive: true, force: true });
  }
});
