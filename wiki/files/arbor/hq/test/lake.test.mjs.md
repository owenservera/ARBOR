# File: hq/test/lake.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/lake.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9015 B |
| Lines | 246 |
| Hash | 9ddcd16a72d2 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| gitAvailable | variable | 13 | no | let gitAvailable = true; |
| dir | variable | 20 | no | let dir = null; |
| db | variable | 21 | no | let db = null; |
| project | variable | 22 | no | let project = null; |
| git | function | 24 | no | function git(args, env = {}) { |
| write | function | 33 | no | function write(rel, content) { |
| abs | const | 34 | no | const abs = join(dir, rel); |
| commit | function | 39 | no | function commit(message, iso) { |
| first | const | 96 | no | const first = ingestProject(db, project); |
| second | const | 102 | no | const second = ingestProject(db, project); |
| secretRows | const | 107 | no | const secretRows = db.prepare(&#39;SELECT path FROM commit_files WHERE path LIKE ?&#39;).all(&#39;%env%&#39;); |
| all | const | 110 | no | const all = queryCommits(db, { project: &#39;alpha&#39; }); |
| all | const | 119 | no | const all = queryCommits(db, { project: &#39;alpha&#39; }); |
| fixes | const | 125 | no | const fixes = queryCommits(db, { project: &#39;alpha&#39;, type: &#39;fix&#39; }); |
| recent | const | 131 | no | const recent = queryCommits(db, { project: &#39;alpha&#39;, since: &#39;2024-01-04&#39; }); |
| touchingCore | const | 134 | no | const touchingCore = queryCommits(db, { project: &#39;alpha&#39;, path: &#39;src/core.js&#39; }); |
| first | const | 143 | no | const first = buildFeed(db, { root: dir, projects: [project] }); |
| second | const | 144 | no | const second = buildFeed(db, { root: dir, projects: [project] }); |
| ok | const | 156 | no | const ok = checkFeed(db, { root: dir, projects: [project], committedJson: first.json, committedMarkdown: first.markdown, |
| tamperedJson | const | 164 | no | const tamperedJson = first.json.replace(&#39;hq.feed/1&#39;, &#39;hq.feed/2&#39;); |
| badJson | const | 165 | no | const badJson = checkFeed(db, { root: dir, projects: [project], committedJson: tamperedJson, committedMarkdown: first.markdown, |
| tamperedMarkdown | const | 174 | no | const tamperedMarkdown = first.markdown.replace(latestSubject(first.feed), `${latestSubject(first.feed)}!`); |
| badMarkdown | const | 175 | no | const badMarkdown = checkFeed(db, { root: dir, projects: [project], committedJson: first.json, committedMarkdown: tamperedMarkdown, |
| latestSubject | function | 185 | no | function latestSubject(feed) { |
| result | const | 190 | no | const result = brief(db, { root: dir, projects: [project] }); |
| again | const | 198 | no | const again = brief(db, { root: dir, projects: [project] }); |
| result | const | 204 | no | const result = brief(db, { root: dir, projects: [project], audience: &#39;owner&#39; }); |
| result | const | 220 | no | const result = drift(db, { root: dir, projects: [project] }); |
| todo | const | 225 | no | const todo = result.todos.find((entry) =&gt; entry.path === &#39;src/core.js&#39;); |
| dirty | const | 232 | no | const dirty = result.dirty.find((entry) =&gt; entry.project === &#39;alpha&#39;); |
| projectRow | const | 236 | no | const projectRow = db.prepare(&#39;SELECT id FROM projects WHERE name = ?&#39;).get(&#39;alpha&#39;); |
| stale | const | 242 | no | const stale = drift(db, { root: dir, projects: [project] }); |
| entry | const | 243 | no | const entry = stale.staleIndex.find((item) =&gt; item.project === &#39;alpha&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| node:child_process | import | 4 | external |
| node:fs | import | 5 | external |
| node:os | import | 6 | external |
| node:path | import | 7 | external |
| ../lib/schema.mjs | import | 8 | [hq/lib/schema.mjs](../lib/schema.mjs.md) |
| ../lib/lake.mjs | import | 9 | [hq/lib/lake.mjs](../lib/lake.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 247 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
