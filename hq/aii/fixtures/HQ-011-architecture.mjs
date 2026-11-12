// hq/aii/fixtures/HQ-011-architecture.mjs — AII benchmark fixture (PRD HQ-PRD-AII-001).
// Scenario HQ-011 (group B): "Explain the architecture we actually have, not the architecture we designed."
// Ground truth locked from live outputs 2026-11-11 (session state: 4 indexed projects, 10582 files):
//   bun hq/bin/hq.mjs deps hq/bin/hq.mjs --depth 2
//     -> header "forward deps for repos-hq/hq/bin/hq.mjs" then "  repos-hq/<path>  via <specifier>"
//        lines resolved from real imports (hq/bin/hq.mjs:671-686 cmdDeps -> graph.mjs deps).
//        70 repos-hq/ dependency nodes at lock time.
//   bun hq/bin/hq.mjs dead
//     -> exported symbols with no inbound imports (hq/bin/hq.mjs:3862-3877 cmdDead), authority
//        "candidate_not_proof" (hq/bin/hq.mjs:3877). 100 candidates at lock time.
// The exact dep/candidate counts drift as concurrent lanes reindex the shared workspace, so the
// expectations pin the observed SHAPE (header text, edge format, authority) and the live
// counts are re-derived by run().
import { defineFixture, finding, runHq } from './harness.mjs';

export default defineFixture({
  id: 'HQ-011',
  provenance: 'Locked at authoring time 2026-11-11 from live command output: bun hq/bin/hq.mjs deps hq/bin/hq.mjs --depth 2 (forward dependency edges resolved from imports; 70 repos-hq/ nodes at lock time) and bun hq/bin/hq.mjs dead (exported symbols with no inbound imports, authority candidate_not_proof; 100 candidates at lock time). Re-derived at run time by re-running both commands; counts are re-derived live because concurrent lanes reindex the shared workspace.',
  expected: [
    { what: 'forward deps for repos-hq/hq/bin/hq.mjs', where: 'hq/bin/hq.mjs deps hq/bin/hq.mjs --depth 2' },
    { what: /^\d+ repos-hq\/ dependency nodes resolved from real imports$/, where: 'hq/bin/hq.mjs deps hq/bin/hq.mjs --depth 2' },
    { what: 'authority candidate_not_proof', where: 'hq/bin/hq.mjs cmdDead' },
    { what: /^\d+ dead-code candidates reported as exported symbols with no inbound imports$/, where: 'hq/bin/hq.mjs dead' },
  ],
  run: async () => {
    const findings = [];

    const deps = runHq(['deps', 'hq/bin/hq.mjs', '--depth', '2']);
    if (deps.exit !== 0) throw new Error(`hq deps failed: exit=${deps.exit} stderr=${deps.stderr}`);
    const depLines = deps.stdout.split('\n').map((l) => l.trim()).filter(Boolean);
    const header = depLines[0] ?? '';
    if (header !== 'forward deps for repos-hq/hq/bin/hq.mjs') {
      throw new Error(`unexpected deps header: ${JSON.stringify(header)}`);
    }
    findings.push(finding(header, 'hq/bin/hq.mjs deps hq/bin/hq.mjs --depth 2'));
    const nodes = depLines.slice(1).filter((l) => l.startsWith('repos-hq/') && l.includes('  via '));
    if (!nodes.length) throw new Error('no resolved dependency edges in hq deps output');
    findings.push(finding(`${nodes.length} repos-hq/ dependency nodes resolved from real imports`, 'hq/bin/hq.mjs deps hq/bin/hq.mjs --depth 2'));

    const dead = runHq(['dead', '--json']);
    if (dead.exit !== 0) throw new Error(`hq dead failed: exit=${dead.exit} stderr=${dead.stderr}`);
    const deadJson = JSON.parse(dead.stdout);
    if (deadJson.authority !== 'candidate_not_proof') {
      throw new Error(`unexpected dead authority: ${deadJson.authority}`);
    }
    findings.push(finding('authority candidate_not_proof', 'hq/bin/hq.mjs cmdDead'));
    if (!Array.isArray(deadJson.candidates)) throw new Error('hq dead --json has no candidates array');
    findings.push(finding(`${deadJson.candidates.length} dead-code candidates reported as exported symbols with no inbound imports`, 'hq/bin/hq.mjs dead'));

    return findings;
  },
});
