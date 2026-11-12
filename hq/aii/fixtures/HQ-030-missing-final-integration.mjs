// hq/aii/fixtures/HQ-030-missing-final-integration.mjs — AII benchmark fixture (PRD HQ-PRD-AII-001).
// Scenario HQ-030 (group C): "Which implemented features are missing only their final integration?"
// Ground truth locked from live outputs 2026-11-11:
//   bun hq/bin/hq.mjs dead --json  -> exported symbols with NO inbound imports = implemented but
//     not consumed/integrated (hq/bin/hq.mjs:3862-3878 cmdDead), authority candidate_not_proof.
//     100 candidates at lock time.
//   bun hq/bin/hq.mjs impact hq/lib/graph.mjs
//     -> "Impact of repos-hq/hq/lib/graph.mjs: 5 dependent(s)" then the reverse-dependency set
//        (hq/bin/hq.mjs:688-701 cmdImpact -> hq/lib/graph.mjs:143-151 impact), i.e. exactly the
//        "who consumes this module" half of the missing-integration judgement.
//   The contrast is the point: graph.mjs has 5 dependents (integrated) while dead candidates have
//   zero inbound imports (final integration missing).
// Counts drift as concurrent lanes reindex the shared workspace, so they are re-derived live and
// pinned by shape.
import { defineFixture, finding, runHq } from './harness.mjs';

export default defineFixture({
  id: 'HQ-030',
  provenance: 'Locked at authoring time 2026-11-11 from live command output: bun hq/bin/hq.mjs dead --json (100 exported symbols with no inbound imports at lock time, authority candidate_not_proof) and bun hq/bin/hq.mjs impact hq/lib/graph.mjs (5 dependents: hq/bin/hq.mjs, hq/lib/mcp.mjs, hq/test/graph.test.mjs, hq/test/mcp.test.mjs and graph.mjs itself at depth 0). Re-derived at run time by re-running both commands; counts are re-derived live because concurrent lanes reindex the shared workspace.',
  expected: [
    { what: 'authority candidate_not_proof', where: 'hq/bin/hq.mjs cmdDead' },
    { what: /^\d+ implemented symbols have no inbound imports \(final integration missing\)$/, where: 'hq/bin/hq.mjs cmdDead' },
    { what: 'every dead candidate carries exported=1', where: 'hq/bin/hq.mjs cmdDead' },
    { what: /^Impact of repos-hq\/hq\/lib\/graph\.mjs: \d+ dependent\(s\)$/, where: 'hq/bin/hq.mjs impact hq/lib/graph.mjs' },
    { what: 'repos-hq/hq/bin/hq.mjs consumes repos-hq/hq/lib/graph.mjs at depth 1', where: 'hq/bin/hq.mjs impact hq/lib/graph.mjs' },
    { what: 'repos-hq/hq/lib/mcp.mjs consumes repos-hq/hq/lib/graph.mjs at depth 1', where: 'hq/bin/hq.mjs impact hq/lib/graph.mjs' },
  ],
  run: async () => {
    const findings = [];

    // hq dead --json: implemented symbols with no inbound import edge at all.
    const dead = runHq(['dead', '--json']);
    if (dead.exit !== 0) throw new Error(`hq dead failed: exit=${dead.exit} stderr=${dead.stderr}`);
    const deadJson = JSON.parse(dead.stdout);
    if (deadJson.authority !== 'candidate_not_proof') throw new Error(`unexpected dead authority: ${deadJson.authority}`);
    findings.push(finding('authority candidate_not_proof', 'hq/bin/hq.mjs cmdDead'));
    if (!Array.isArray(deadJson.candidates)) throw new Error('hq dead --json has no candidates array');
    findings.push(finding(`${deadJson.candidates.length} implemented symbols have no inbound imports (final integration missing)`, 'hq/bin/hq.mjs cmdDead'));
    const notExported = deadJson.candidates.filter((c) => c.exported !== 1);
    if (notExported.length) throw new Error(`${notExported.length} dead candidates are not exported`);
    findings.push(finding('every dead candidate carries exported=1', 'hq/bin/hq.mjs cmdDead'));

    // hq impact: the consumed side, for contrast.
    const impact = runHq(['impact', 'hq/lib/graph.mjs']);
    if (impact.exit !== 0) throw new Error(`hq impact failed: exit=${impact.exit} stderr=${impact.stderr}`);
    const impactLines = impact.stdout.split('\n').filter(Boolean);
    const head = impactLines[0] ?? '';
    if (!/^Impact of repos-hq\/hq\/lib\/graph\.mjs: \d+ dependent\(s\)$/.test(head)) {
      throw new Error(`unexpected impact header: ${JSON.stringify(head)}`);
    }
    findings.push(finding(head, 'hq/bin/hq.mjs impact hq/lib/graph.mjs'));

    // The concrete consumers that prove graph.mjs IS integrated.
    const depLines = impactLines.slice(1);
    for (const consumer of ['repos-hq/hq/bin/hq.mjs', 'repos-hq/hq/lib/mcp.mjs']) {
      const row = depLines.find((l) => l.trim().startsWith(consumer) && l.includes('depth 1'));
      if (!row) throw new Error(`missing depth-1 consumer ${consumer} in impact output`);
      findings.push(finding(`${consumer} consumes repos-hq/hq/lib/graph.mjs at depth 1`, 'hq/bin/hq.mjs impact hq/lib/graph.mjs'));
    }

    return findings;
  },
});
