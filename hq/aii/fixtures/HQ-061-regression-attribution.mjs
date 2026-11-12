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

  // An unrelated commit that touches no part of the failing module.
  write('src/unrelated.js', 'export const helper = 1;\n');
  commit('chore: add unrelated helper', '2024-01-03T10:00:00+00:00');

  // Known-bad: the regression is still present.
  write('src/math.js', 'export function add(a, b) { return a * b; }\n');
  commit('fix(math): still broken', '2024-01-04T10:00:00+00:00');
  const badSha = git(['rev-parse', 'HEAD']).trim();

  return { goodSha, culpritSha, badSha };
}

export default defineFixture({
  id: 'HQ-061',
  provenance: PROVENANCE,
  expected: [
    finding('culprit subject=fix(math): introduce regression', 'hq/lib/lake.mjs regressionAttribution'),
    finding('candidate commits touching src/math.js in (good, bad]=2', 'hq/lib/lake.mjs regressionAttribution'),
    finding('range ordered oldest-first: fix(math): introduce regression, fix(math): still broken', 'hq/lib/lake.mjs regressionAttribution'),
    finding('unrelated commit chore: add unrelated helper excluded from attribution', 'hq/lib/lake.mjs regressionAttribution'),
    finding('culprit is the first change to src/math.js after the known-good revision', 'hq/lib/lake.mjs regressionAttribution'),
    finding('queryCommits(path=src/math.js) sees 3 commits touching the failing module', 'hq/lib/lake.mjs queryCommits'),
  ],
  run: async () => {
    const root = mkdtempSync(join(tmpdir(), 'hq061-fixture-'));
    try {
      const { goodSha, culpritSha, badSha } = buildWorkspace(root);
      const db = openMemoryDb();
      try {
        const project = { name: 'demo', path: root };
        ingestProject(db, project);

        const result = regressionAttribution(db, {
          project, goodSha, badSha, path: 'src/math.js', limit: 50,
        });

        const findings = [];
        findings.push(finding(
          `culprit subject=${result.culpritSubject}`,
          'hq/lib/lake.mjs regressionAttribution',
        ));
        findings.push(finding(
          `candidate commits touching src/math.js in (good, bad]=${result.count}`,
          'hq/lib/lake.mjs regressionAttribution',
        ));
        findings.push(finding(
          `range ordered oldest-first: ${result.range.map((r) => r.subject).join(', ')}`,
          'hq/lib/lake.mjs regressionAttribution',
        ));

        // The unrelated commit must not be a candidate: attribution is scoped
        // to the failing path.
        const unrelated = result.range.find((r) => r.subject === 'chore: add unrelated helper');
        findings.push(finding(
          unrelated
            ? 'unrelated commit chore: add unrelated helper included in attribution'
            : 'unrelated commit chore: add unrelated helper excluded from attribution',
          'hq/lib/lake.mjs regressionAttribution',
        ));

        // The culprit is the FIRST change to the failing path after known-good.
        const firstTouch = result.range[0];
        findings.push(finding(
          firstTouch && firstTouch.sha === culpritSha
            ? 'culprit is the first change to src/math.js after the known-good revision'
            : `culprit is NOT the first change to src/math.js after the known-good revision (got ${firstTouch ? firstTouch.sha : 'none'})`,
          'hq/lib/lake.mjs regressionAttribution',
        ));

        // Cross-check against the pre-existing lake surface: the ingested lake
        // indexed by path sees the same failing module's history.
        const byPath = queryCommits(db, { project: 'demo', path: 'src/math.js', limit: 50 });
        findings.push(finding(
          `queryCommits(path=src/math.js) sees ${byPath.length} commits touching the failing module`,
          'hq/lib/lake.mjs queryCommits',
        ));

        return findings;
      } finally {
        db.close();
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  },
});
