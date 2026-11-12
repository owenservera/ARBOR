// hq/aii/fixtures/HQ-085-critical-path-ownerless.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-085 (group J):
// "Which critical-path tasks have no active owner?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   bun hq/bin/hq.mjs pm --json
//     -> model.coverage = { tracked: 25, untracked: 575, withEvidence: 25,
//        withoutOwner: 25 } — every one of the 25 tracked items is cited by a
//        queue row that names NO seat or owner. buildPortfolio()
//        (hq/lib/pmo.mjs:530) computes coverage (hq/lib/pmo.mjs:646):
//        withoutOwner counts tracked items whose citing queue row names no
//        seat/owner; scanCitations() (hq/lib/pmo.mjs:371-416) names an owner
//        from the row's seat/owner column when it is not empty/'unbound'/'—'.
//   Seeded proof: a scored-table row citing SEED-001 with seat "chatgpt"
//   marks that item owned; a row with "unbound" marks it ownerless.
//
// The live answer — ALL tracked items lack a named owner (25 of 25) — is the
// pinned structural fact; the counts drift as lanes re-file the queue and are
// re-derived live.
import { defineFixture, finding, runHq } from './harness.mjs';
import { buildPortfolio } from '../../lib/pmo.mjs';
import { readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export default defineFixture({
  id: 'HQ-085',
  provenance: 'Locked 2026-11-11 on branch main from live output: bun hq/bin/hq.mjs pm --json printed model.coverage = { tracked: 25, untracked: 575, withEvidence: 25, withoutOwner: 25 } — every tracked item is cited by a queue row that names no seat or owner. buildPortfolio() (hq/lib/pmo.mjs:530) computes coverage at hq/lib/pmo.mjs:646: withoutOwner counts tracked items whose citing queue row names no seat or owner, and scanCitations() (hq/lib/pmo.mjs:371-416) names an owner only when the row\'s seat/owner column is non-empty and not "unbound"/"—"/"-". Seeded proof (no workspace writes): a scored-table row citing SEED-001 with seat "chatgpt" marks that item owned (namesOwner=true), while a row with "unbound" leaves namesOwner=false and the item counts into withoutOwner. The structural fact — tracked items exist and ALL of them lack a named owner in the live queue — is pinned; the concrete counts drift as lanes re-file the queue and are re-derived live.',
  expected: [
    { what: 'every tracked item in the live portfolio lacks a named owner (withoutOwner equals tracked)', where: 'hq/lib/pmo.mjs buildPortfolio' },
    { what: /^\d+ tracked items and \d+ untracked items in the live portfolio$/, where: 'hq/lib/pmo.mjs buildPortfolio' },
    { what: /^\d+ tracked items carry evidence$/, where: 'hq/lib/pmo.mjs buildPortfolio' },
    { what: /^\d+ tracked items have no active owner$/, where: 'hq/lib/pmo.mjs buildPortfolio' },
    { what: 'a queue row with a seat names the item\'s owner; an "unbound" row does not', where: 'hq/lib/pmo.mjs scanCitations' },
    { what: 'the pm CLI reports the ownerless coverage', where: 'hq/bin/hq.mjs pm --json' },
  ],
  run: async () => {
    const findings = [];

    const cli = runHq(['pm', '--json'], { cwd: ROOT });
    if (cli.exit !== 0) throw new Error(`hq pm --json failed: exit=${cli.exit} stderr=${cli.stderr}`);
    const emitted = JSON.parse(cli.stdout);
    const coverage = emitted.model?.coverage;
    if (!coverage) throw new Error('pm --json has no coverage');
    if (!coverage.tracked) throw new Error('pm --json reports 0 tracked items');
    if (coverage.withoutOwner !== coverage.tracked) {
      throw new Error(`expected withoutOwner === tracked, got ${JSON.stringify(coverage)}`);
    }
    findings.push(finding('every tracked item in the live portfolio lacks a named owner (withoutOwner equals tracked)', 'hq/lib/pmo.mjs buildPortfolio'));
    findings.push(finding('the pm CLI reports the ownerless coverage', 'hq/bin/hq.mjs pm --json'));

    const initiativesFile = join(ROOT, 'docs', 'integration', 'STRATEGIC-INITIATIVES.md');
    const tasksFile = 'C:/VIVIM/channel/tasks/active-tasks.md';
    const model = buildPortfolio({
      qeueDir: join(ROOT, 'qeue'),
      initiativesText: existsSync(initiativesFile) ? readFileSync(initiativesFile, 'utf8') : null,
      tasksText: existsSync(tasksFile) ? readFileSync(tasksFile, 'utf8') : null,
      now: Date.now(),
    });
    findings.push(finding(`${model.coverage.tracked} tracked items and ${model.coverage.untracked} untracked items in the live portfolio`, 'hq/lib/pmo.mjs buildPortfolio'));
    findings.push(finding(`${model.coverage.withEvidence} tracked items carry evidence`, 'hq/lib/pmo.mjs buildPortfolio'));
    findings.push(finding(`${model.coverage.withoutOwner} tracked items have no active owner`, 'hq/lib/pmo.mjs buildPortfolio'));

    // Seeded proof of owner resolution (no workspace writes).
    const qeueDir = { lanes: [{ lane: 'L', records: [
      { id: 'SEED-001', task: 'owned work', status: 'todo' },
      { id: 'SEED-002', task: 'ownerless work', status: 'todo' },
    ] }], notes: [] };
    const tasksText = [
      '## Scored', '',
      '| id | seat | score |', '|---|---|---|',
      '| SEED-001 | chatgpt | 3 |',
      '| SEED-002 | unbound | 1 |',
    ].join('\n');
    const seeded = buildPortfolio({ qeueDir, tasksText, now: Date.parse('2026-11-11T00:00:00.000Z') });
    const owned = seeded.items?.find((i) => i.id === 'SEED-001');
    const ownerless = seeded.items?.find((i) => i.id === 'SEED-002');
    if (!owned || owned.namesOwner !== true) throw new Error(`seeded owned item: ${JSON.stringify(owned)}`);
    if (!ownerless || ownerless.namesOwner !== false) throw new Error(`seeded ownerless item: ${JSON.stringify(ownerless)}`);
    if (seeded.coverage?.withoutOwner !== 1 || seeded.coverage?.tracked !== 2) {
      throw new Error(`unexpected seeded coverage: ${JSON.stringify(seeded.coverage)}`);
    }
    findings.push(finding('a queue row with a seat names the item\'s owner; an "unbound" row does not', 'hq/lib/pmo.mjs scanCitations'));

    return findings;
  },
});
