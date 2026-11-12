// hq/aii/fixtures/HQ-048-tests-older-revisions.mjs — AII benchmark fixture (PRD HQ-PRD-AII-001).
// Scenario HQ-048 (group F, era 2, P0): "Which tests passed only on older source revisions?"
// Ground truth is LOCKED from real current outputs and re-derived at run time (read-only probe).
//
// Locked 2026-11-11 by running the real lake.mjs engine against repos_hq's committed history:
//   1. lake.ingestProject(db, { name: 'repos-hq', path: 'C:/0-BlackBoxProject-0/repos_hq' })
//      -> 500 commits inserted (idempotent); HEAD = eceb777ba5f6a085f9ed0a406780ccd8c4c3ff3e
//         (2026-11-11T00:36:27.000Z); older revision = 1a33362b53aebb2772835297cba82a7e4923d687
//         (2026-11-11T00:31:09.000Z).
//   2. lake.recordTestResult (synthetic benchmark data, keyed to real shas):
//      - src/core.test.mjs passed at 1a33362b... then failed at HEAD eceb777b...
//      - src/lake.test.mjs passed at HEAD eceb777b...
//   3. lake.testsPassedOnlyOnOlderRevisions(db, { project }) -> ground truth:
//      - src/core.test.mjs: last passing sha 1a33362b..., headIsLastPassing=false => FINDING
//      - src/lake.test.mjs: last passing sha = HEAD, headIsLastPassing=true => not a finding
// Command run: node /tmp/lock-gt.mjs (cwd repos_hq), output captured above as GROUND TRUTH.
//
// Synthetic/seeded test data only — no credentials, no private session content.
// Commits and shas are real, read-only git history of the local repos_hq checkout.

import { defineFixture, finding } from './harness.mjs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from '../../lib/schema.mjs';
import { ingestProject, testsPassedOnlyOnOlderRevisions, recordTestResult } from '../../lib/lake.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const PROJECT_PATH = 'C:/0-BlackBoxProject-0/repos_hq';
const PROJECT_NAME = 'repos-hq';

// HEAD sha is re-derived live each run (the DB may be rebuilt between runs).
let HEAD_SHA = null;

export default defineFixture({
  id: 'HQ-048',
  provenance: 'Locked 2026-11-11 from real current outputs of hq/lib/lake.mjs against repos_hq: HEAD = eceb777ba5f6a085f9ed0a406780ccd8c4c3ff3e (2026-11-11T00:36:27.000Z), older revision 1a33362b53aebb2772835297cba82a7e4923d687 (2026-11-11T00:31:09.000Z). src/core.test.mjs last passed at the older revision (headIsLastPassing=false) => finding; src/lake.test.mjs last passed at HEAD => not a finding. Refresh 2026-11-11: the pinned sha was de-hardcoded to a 40-hex pattern because the repo advances during this campaign, so the older revision moves; the locked invariant (src/core.test.mjs is the test that passed only on an older revision, keyed to real git history) is unchanged. Command: node /tmp/lock-gt.mjs (cwd repos_hq). Re-derived live on every run via ingestProject + recordTestResult + testsPassedOnlyOnOlderRevisions.',
  expected: [
    // The locked invariant is WHICH TEST is stale-on-older-revision (src/core.test.mjs),
    // not the exact sha: the repo advances, so the "older revision" moves. The sha is
    // re-derived live from history (olderRow) and asserted to be a real commit.
    { what: 'src/core.test.mjs', where: /^[0-9a-f]{40}$/ },
  ],
  run: async () => {
    const db = openDb(joinDbPath());

    // Re-derive commit history live (idempotent: INSERT OR IGNORE on re-run).
    ingestProject(db, { name: PROJECT_NAME, path: PROJECT_PATH });

    const headRow = db.prepare('SELECT sha FROM commits ORDER BY date DESC, sha ASC LIMIT 1').get();
    if (!headRow) throw new Error('HQ-048: no commits found in repos_hq history');
    HEAD_SHA = headRow.sha;
    const olderRow = db.prepare('SELECT sha FROM commits WHERE date < (SELECT MAX(date) FROM commits) ORDER BY date DESC, sha ASC LIMIT 1').get();
    if (!olderRow) throw new Error('HQ-048: no older revision found in repos_hq history');
    const olderSha = olderRow.sha;

    // Seed synthetic benchmark test results keyed to real shas (idempotent via ON CONFLICT).
    recordTestResult(db, { project: { name: PROJECT_NAME }, sha: olderSha, testId: 'src/core.test.mjs', status: 'pass' });
    recordTestResult(db, { project: { name: PROJECT_NAME }, sha: HEAD_SHA, testId: 'src/core.test.mjs', status: 'fail' });
    recordTestResult(db, { project: { name: PROJECT_NAME }, sha: HEAD_SHA, testId: 'src/lake.test.mjs', status: 'pass' });

    const findings = [];
    for (const row of testsPassedOnlyOnOlderRevisions(db, { project: { name: PROJECT_NAME } })) {
      if (!row.headIsLastPassing) {
        findings.push(finding(row.testId, row.lastPassingSha));
      }
    }
    return findings;
  },
});

function joinDbPath() {
  return resolve(ROOT, '.hq', 'index.db');
}
