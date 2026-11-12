// hq/test/lake.test.mjs — lane E: commit lake, drift, brief, static feed.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openMemoryDb } from '../lib/schema.mjs';
import {
  brief, buildFeed, checkFeed, drift, ingestProject, queryCommits,
} from '../lib/lake.mjs';

let gitAvailable = true;
try {
  execFileSync('git', ['--version'], { stdio: 'ignore' });
} catch {
  gitAvailable = false;
}

let dir = null;
let db = null;
let project = null;

function git(args, env = {}) {
  return execFileSync('git', args, {
    cwd: dir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
  });
}

function write(rel, content) {
  const abs = join(dir, rel);
  mkdirSync(join(abs, '..'), { recursive: true });
  writeFileSync(abs, content, 'utf8');
}

function commit(message, iso) {
  git(['add', '-A']);
  git(['commit', '-q', '-m', message], {
    GIT_AUTHOR_DATE: iso,
    GIT_COMMITTER_DATE: iso,
  });
}

before(() => {
  if (!gitAvailable) return;
  dir = mkdtempSync(join(tmpdir(), 'hq-lake-'));

  git(['init', '-q', '-b', 'main']);
  git(['config', 'user.email', 'hq@example.test']);
  git(['config', 'user.name', 'HQ Test']);

  write('README.md', '# Alpha\n\nDemo project for the HQ lake tests.\n');
  write('AGENTS.md', '# Agent rules\n\n- Stay local.\n');
  write('src/core.js', [
    'export function add(a, b) {',
    '  // TODO: handle empty input',
    '  return a + b;',
    '}',
    '',
  ].join('\n'));
  commit('feat(core): add core module', '2024-01-01T10:00:00+00:00');

  write('src/util.js', 'export const twice = (n) => n * 2;\n');
  commit('feat(core): add util helpers', '2024-01-02T10:00:00+00:00');

  write('src/core.js', [
    'export function add(a, b) {',
    '  // TODO: handle empty input',
    '  if (a == null || b == null) return 0;',
    '  return a + b;',
    '}',
    '',
  ].join('\n'));
  commit('fix(core): guard empty input', '2024-01-03T10:00:00+00:00');

  write('.env.local', 'DEMO_TOKEN=placeholder\n');
  write('src/secret-reader.js', 'export const token = process.env.DEMO_TOKEN || null;\n');
  commit('chore: load local secrets', '2024-01-04T10:00:00+00:00');

  write('docs/guide.md', '# Guide\n\nSee @hq:see src/core.js for the entry point.\n');
  commit('docs: add usage guide', '2024-01-05T10:00:00+00:00');

  db = openMemoryDb();
  project = { name: 'alpha', path: dir };
});

after(() => {
  try { db?.close(); } catch { /* already closed */ }
  if (dir) rmSync(dir, { recursive: true, force: true });
});

test('ingestProject is idempotent and never stores secret paths', { skip: !gitAvailable }, () => {
  const first = ingestProject(db, project);
  assert.equal(first.project, 'alpha');
  assert.equal(first.commits, 5);
  assert.equal(first.inserted, 5);
  assert.equal(first.skipped, 0);

  const second = ingestProject(db, project);
  assert.equal(second.commits, 5);
  assert.equal(second.inserted, 0);
  assert.equal(second.skipped, 5);

  const secretRows = db.prepare('SELECT path FROM commit_files WHERE path LIKE ?').all('%env%');
  assert.deepEqual(secretRows, []);

  const all = queryCommits(db, { project: 'alpha' });
  assert.equal(all.length, 5);
  for (const row of all) {
    assert.ok(!row.files.includes('.env.local'));
    assert.ok(!row.files.includes('session.json'));
  }
});

test('queryCommits filters by project, type, since and path', { skip: !gitAvailable }, () => {
  const all = queryCommits(db, { project: 'alpha' });
  assert.equal(all.length, 5);
  for (let i = 1; i < all.length; i++) {
    assert.ok(all[i - 1].date >= all[i].date, 'newest first');
  }

  const fixes = queryCommits(db, { project: 'alpha', type: 'fix' });
  assert.equal(fixes.length, 1);
  assert.equal(fixes[0].type, 'fix');
  assert.equal(fixes[0].scope, 'core');
  assert.ok(fixes[0].subject.includes('guard empty input'));

  const recent = queryCommits(db, { project: 'alpha', since: '2024-01-04' });
  assert.equal(recent.length, 2);

  const touchingCore = queryCommits(db, { project: 'alpha', path: 'src/core.js' });
  assert.equal(touchingCore.length, 2);
  assert.ok(touchingCore.every((row) => row.files.includes('src/core.js')));

  assert.equal(queryCommits(db, { project: 'beta' }).length, 0);
  assert.equal(queryCommits(db, { project: 'alpha', limit: 2 }).length, 2);
});

test('buildFeed is deterministic, clock-free and checkFeed detects drift', { skip: !gitAvailable }, () => {
  const first = buildFeed(db, { root: dir, projects: [project] });
  const second = buildFeed(db, { root: dir, projects: [project] });

  assert.equal(first.json, second.json);
  assert.equal(first.markdown, second.markdown);
  assert.equal(first.feed.schema, 'hq.feed/1');
  assert.ok(first.feed.throughHead);
  assert.equal(first.feed.throughDate, '2024-01-05T10:00:00.000Z');
  assert.ok(!first.json.includes(dir));
  assert.ok(!first.json.includes('.env.local'));
  assert.ok(!first.markdown.includes('.env.local'));
  assert.match(first.markdown, /sha256:[0-9a-f]{64}/);

  const ok = checkFeed(db, {
    root: dir,
    projects: [project],
    committedJson: first.json,
    committedMarkdown: first.markdown,
  });
  assert.equal(ok.ok, true, ok.reasons.join('; '));

  const tamperedJson = first.json.replace('hq.feed/1', 'hq.feed/2');
  const badJson = checkFeed(db, {
    root: dir,
    projects: [project],
    committedJson: tamperedJson,
    committedMarkdown: first.markdown,
  });
  assert.equal(badJson.ok, false);
  assert.ok(badJson.reasons.length > 0);

  const tamperedMarkdown = first.markdown.replace(latestSubject(first.feed), `${latestSubject(first.feed)}!`);
  const badMarkdown = checkFeed(db, {
    root: dir,
    projects: [project],
    committedJson: first.json,
    committedMarkdown: tamperedMarkdown,
  });
  assert.equal(badMarkdown.ok, false);
  assert.ok(badMarkdown.reasons.some((reason) => reason.startsWith('markdown:')));
});

function latestSubject(feed) {
  return feed.commits[0].subject;
}

test('brief text stays under 6000 bytes and names the project', { skip: !gitAvailable }, () => {
  const result = brief(db, { root: dir, projects: [project] });
  assert.ok(Buffer.byteLength(result.text, 'utf8') <= 6000);
  assert.ok(result.text.includes('alpha'));
  assert.ok(result.text.startsWith('# HQ brief'));
  assert.equal(result.data.workspace.projects, 1);
  assert.equal(result.data.projects[0].name, 'alpha');
  assert.equal(result.data.labels, undefined);

  const again = brief(db, { root: dir, projects: [project] });
  assert.equal(again.text, result.text);
  assert.deepEqual(again.data, result.data);
});

test('owner brief uses VIVIM headings', { skip: !gitAvailable }, () => {
  const result = brief(db, { root: dir, projects: [project], audience: 'owner' });
  assert.ok(result.text.startsWith('# Progress Report'));
  assert.ok(result.text.includes('## My Spaces'));
  assert.ok(result.text.includes('## Activity Record'));
  assert.equal(result.data.audience, 'owner');
  assert.deepEqual(result.data.labels, {
    sitrep: 'Progress Report',
    spaces: 'My Spaces',
    evidence: 'Activity Record',
  });
  assert.ok(Buffer.byteLength(result.text, 'utf8') <= 6000);
});

test('drift reports arrays, a TODO and a stale index', { skip: !gitAvailable }, () => {
  write('src/scratch.js', 'export const scratch = true;\n');

  const result = drift(db, { root: dir, projects: [project] });
  for (const key of ['staleIndex', 'dirty', 'aheadBehind', 'staleDocs', 'todos', 'missingDocs']) {
    assert.ok(Array.isArray(result[key]), `${key} is an array`);
  }

  const todo = result.todos.find((entry) => entry.path === 'src/core.js');
  assert.ok(todo, 'TODO in src/core.js found');
  assert.equal(todo.project, 'alpha');
  assert.equal(todo.kind, 'TODO');
  assert.ok(todo.line >= 1);
  assert.ok(todo.text.includes('handle empty input'));

  const dirty = result.dirty.find((entry) => entry.project === 'alpha');
  assert.ok(dirty);
  assert.ok(dirty.files.includes('src/scratch.js'));

  const projectRow = db.prepare('SELECT id FROM projects WHERE name = ?').get('alpha');
  db.prepare(`
    INSERT INTO files(project_id, path, abs_path, lang, kind, size, mtime_ms, indexed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(projectRow.id, 'src/core.js', join(dir, 'src/core.js'), 'javascript', 'source', 1, 0, '2000-01-01T00:00:00.000Z');

  const stale = drift(db, { root: dir, projects: [project] });
  const entry = stale.staleIndex.find((item) => item.project === 'alpha');
  assert.ok(entry, 'stale index entry');
  assert.ok(entry.changedSinceIndex >= 1);
});
