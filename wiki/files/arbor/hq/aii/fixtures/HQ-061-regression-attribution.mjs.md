# File: hq/aii/fixtures/HQ-061-regression-attribution.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-061-regression-attribution.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8017 B |
| Lines | 167 |
| Hash | 3cda02770584 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PROVENANCE | const | 23 | no | const PROVENANCE = `Ground truth locked 2026-11-11 by running the real hq/lib/lake.mjs |
| buildWorkspace | function | 50 | no | function buildWorkspace(root) { |
| git | function | 51 | no | const git = (args, opts = {}) =&gt; execFileSync(&#39;git&#39;, args, { cwd: root, encoding: &#39;utf8&#39;, stdio: [&#39;pipe&#39;, &#39;pipe&#39;, &#39;pipe&#39;], ...opts, }); |
| write | function | 54 | no | const write = (rel, content) =&gt; { |
| abs | const | 55 | no | const abs = join(root, rel); |
| commit | function | 59 | no | const commit = (message, iso) =&gt; { |
| goodSha | const | 75 | no | const goodSha = git([&#39;rev-parse&#39;, &#39;HEAD&#39;]).trim(); |
| culpritSha | const | 80 | no | const culpritSha = git([&#39;rev-parse&#39;, &#39;HEAD&#39;]).trim(); |
| badSha | const | 89 | no | const badSha = git([&#39;rev-parse&#39;, &#39;HEAD&#39;]).trim(); |
| root | const | 106 | no | const root = mkdtempSync(join(tmpdir(), &#39;hq061-fixture-&#39;)); |
| db | const | 109 | no | const db = openMemoryDb(); |
| project | const | 111 | no | const project = { name: &#39;demo&#39;, path: root }; |
| result | const | 114 | no | const result = regressionAttribution(db, { project, goodSha, badSha, path: &#39;src/math.js&#39;, limit: 50, }); |
| findings | const | 118 | no | const findings = []; |
| unrelated | const | 134 | no | const unrelated = result.range.find((r) =&gt; r.subject === &#39;chore: add unrelated helper&#39;); |
| firstTouch | const | 143 | no | const firstTouch = result.range[0]; |
| byPath | const | 153 | no | const byPath = queryCommits(db, { project: &#39;demo&#39;, path: &#39;src/math.js&#39;, limit: 50 }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 15 | external |
| node:fs | import | 16 | external |
| node:os | import | 17 | external |
| node:path | import | 18 | external |
| ../../lib/schema.mjs | import | 19 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/lake.mjs | import | 20 | [hq/lib/lake.mjs](../../lib/lake.mjs.md) |
| ./harness.mjs | import | 21 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-061-regression-attribution.mjs — AII benchmark fixture
// (PRD HQ-PRD-AII-001). Scenario HQ-061 (group G): "Which upstream change most
// likely caused this regression?"
//
// Engine: hq/lib/lake.mjs `regressionAttribution` (added by lane
// p1-regression-merge-evidence). Ground truth locked 2026-11-11 by running the
// real module against a synthetic git workspace (see PROVENANCE). The fixture
// re-derives every finding live at run time; nothing is hard-coded from a
// stored copy of the output.
//
// Synthetic/seeded data only: a throwaway git repo in the OS temp dir with
// fixed author/committer dates. No credentials, no private session content,
// no provider messages, no Host-world writes — the probe only reads git
// history through lake.mjs and writes to a temp directory.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openMemoryDb } from '../../lib/schema.mjs';
import { ingestProject, queryCommits, regressionAttribution } from '../../lib/lake.mjs';
import { defineFixture, finding } from './harness.mjs';

const PROVENANCE = `Ground truth locked 2026-11-11 by running the real hq/lib/lake.mjs
regressionAttribution() against a synthetic git workspace (the same one this
fixture rebuilds at run time), and pinning exactly what it returned:

  bun C:/Users/VIVIM.inc/AppData/Local/Temp/probe-hq061.mjs
    ingest: {"project":"demo","inserted":4,"skipped":0,"commits":4}
    likelyCulprit    : 89b857db4572591ddb660dd632ca78089b15e033
    culpritSubject   : fix(math): introduce regression
    count            : 2
    range subjects   : ["fix(math): introduce regression","fix(math): still broken"]
    culprit==expected: true

The workspace is a 4-commit history over src/math.js with a known-good
revision, one commit that introduces the regression, one unrelated commit, and
a known-bad revision. The pinned ground truth is the semantic attribution
(culprit subject, candidate count, oldest-first ordering) rather than the raw
SHA, because the commit SHA is not stable across machines — the fixture
re-derives it live and asserts the culprit is exactly the commit whose subject
is "fix(math): introduce regression" and that it is the OLDEST commit in
(good, bad] that touched src/math.js.

Cross-check against the pre-existing lake surface queryCommits(): filtering the
ingested lake by path src/math.js returns 3 commits (add module / introduce
regression / still broken); the culprit is the one immediately after the
known-good revision, i.e. the 2nd of those 3 newest-first. Re-derive live to
confirm.`;

function buildWorkspace(root) {
  const git = (args, opts = {}) => execFileSync('git', args, {
    cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...opts,
  });
  const write = (rel, content) => {
    const abs = join(root, rel);
    mkdirSync(join(abs, '..'), { recursive: true });
    writeFileSync(abs, content, 'utf8');
  };
  const commit = (message, iso) => {
    git(['add', '-A']);
    git(['commit', '-q', '-m', message], {
      env: { ...process.env, GIT_AUTHOR_DATE: iso, GIT_COMMITTER_DATE: iso },
    });
  };

  git(['init', '-q', '-b', 'main']);
  git(['config', 'user.email', 'hq@example.test']);
  git(['config', 'user.name', 'HQ Fixture']);

  // Known-good: the module still computes the right answer.
  write('README.md', '# Demo\n');
  write('AGENTS.md', '# Agent rules\n');
  write('src/math.js', 'export function add(a, b) { return a + b; }\n');
  commit('feat(math): add module', '2024-01-01T10:00:00+00:00');
  const goodSha = git(['rev-parse', 'HEAD']).trim();

  // The upstream change that introduces the regression.
  write('src/math.js', 'export function add(a, b) { return a - b; }\n');
  commit('fix(math): introduce regression', '2024-01-02T10:00:00+00:00');
  const culpritSha = git(['rev-parse', 'HEAD']).trim();
```

_First 80 of 168 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
