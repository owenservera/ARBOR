// hq/aii/fixtures/HQ-028-retirement-candidates.mjs — AII benchmark fixture (PRD HQ-PRD-AII-001).
// Scenario HQ-028 (group C): "Which components are candidates for retirement?"
// Ground truth locked from live outputs 2026-11-11:
//   bun hq/bin/hq.mjs dead --json
//     -> {"schema":"hq.dead/1","authority":"candidate_not_proof","candidates":[{project,path,line,name,kind,exported}]}
//        (cmdDead hq/bin/hq.mjs:3862-3878). Candidates are exported symbols with NO inbound imports
//        (hq/bin/hq.mjs:3866-3868). 100 candidates at lock time (default limit 100);
//        548 repos-hq candidates with --limit 1000.
//   bun hq/bin/hq.mjs dead --project repos-hq --limit 3 --json
//     -> the three VivimDemo/app/src/main/java/com/vivim/demo/MainActivity.kt symbols
//        MainActivity (class, line 25), onCreate (method, line 26), App (function, line 35).
//   bun hq/bin/hq.mjs impact <path> -> reverse-dependency dependents per module
//        (cmdImpact hq/bin/hq.mjs:688-701 -> graph.mjs impact).
// The candidate counts drift as concurrent lanes reindex the workspace, so the live counts are
// re-derived by run() and pinned by shape; the VivimDemo candidates are pinned exactly because
// that file is stable on disk.
import { defineFixture, finding, runHq } from './harness.mjs';

const VIVIMDEMO = 'VivimDemo/app/src/main/java/com/vivim/demo/MainActivity.kt';

export default defineFixture({
  id: 'HQ-028',
  provenance: 'Locked at authoring time 2026-11-11 from live command output: bun hq/bin/hq.mjs dead --json (schema hq.dead/1, authority candidate_not_proof, 100 candidates at lock time), bun hq/bin/hq.mjs dead --project repos-hq --limit 3 --json (the three VivimDemo MainActivity.kt symbols MainActivity class line 25, onCreate method line 26, App function line 35), and bun hq/bin/hq.mjs impact <path> (reverse-dependency dependents). Re-derived at run time by re-running those commands; candidate counts are re-derived live because concurrent lanes reindex the shared workspace.',
  expected: [
    { what: 'schema hq.dead/1', where: 'hq/bin/hq.mjs cmdDead' },
    { what: 'authority candidate_not_proof', where: 'hq/bin/hq.mjs cmdDead' },
    { what: /^\d+ retirement candidates are exported symbols with no inbound imports$/, where: 'hq/bin/hq.mjs dead' },
    { what: `repos-hq ${VIVIMDEMO} MainActivity class line 25`, where: 'hq/bin/hq.mjs dead --project repos-hq' },
    { what: `repos-hq ${VIVIMDEMO} onCreate method line 26`, where: 'hq/bin/hq.mjs dead --project repos-hq' },
    { what: `repos-hq ${VIVIMDEMO} App function line 35`, where: 'hq/bin/hq.mjs dead --project repos-hq' },
    { what: /^\d+ dependents returned by impact for a module$/, where: 'hq/bin/hq.mjs impact' },
  ],
  run: async () => {
    const findings = [];

    // hq dead --json: the retirement-candidate surface.
    const dead = runHq(['dead', '--json']);
    if (dead.exit !== 0) throw new Error(`hq dead failed: exit=${dead.exit} stderr=${dead.stderr}`);
    const deadJson = JSON.parse(dead.stdout);
    if (deadJson.schema !== 'hq.dead/1') throw new Error(`unexpected dead schema: ${deadJson.schema}`);
    findings.push(finding('schema hq.dead/1', 'hq/bin/hq.mjs cmdDead'));
    if (deadJson.authority !== 'candidate_not_proof') throw new Error(`unexpected dead authority: ${deadJson.authority}`);
    findings.push(finding('authority candidate_not_proof', 'hq/bin/hq.mjs cmdDead'));
    if (!Array.isArray(deadJson.candidates)) throw new Error('hq dead --json has no candidates array');
    findings.push(finding(`${deadJson.candidates.length} retirement candidates are exported symbols with no inbound imports`, 'hq/bin/hq.mjs dead'));

    // hq dead --project repos-hq: the stable VivimDemo candidates.
    const scoped = runHq(['dead', '--project', 'repos-hq', '--limit', '3', '--json']);
    if (scoped.exit !== 0) throw new Error(`hq dead --project failed: exit=${scoped.exit} stderr=${scoped.stderr}`);
    const scopedJson = JSON.parse(scoped.stdout);
    const byName = new Map(scopedJson.candidates.map((c) => [c.name, c]));
    for (const [name, kind, line] of [['MainActivity', 'class', 25], ['onCreate', 'method', 26], ['App', 'function', 35]]) {
      const c = byName.get(name);
      if (!c) throw new Error(`missing dead candidate ${name}`);
      if (c.path !== VIVIMDEMO) throw new Error(`${name} path drift: ${c.path}`);
      if (c.kind !== kind || c.line !== line) throw new Error(`${name} kind/line drift: ${c.kind}@${c.line}`);
      findings.push(finding(`repos-hq ${c.path} ${c.name} ${c.kind} line ${c.line}`, 'hq/bin/hq.mjs dead --project repos-hq'));
    }

    // hq impact: the reverse-dependency dependents behind a retirement decision.
    const impact = runHq(['impact', 'hq/lib/graph.mjs']);
    if (impact.exit !== 0) throw new Error(`hq impact failed: exit=${impact.exit} stderr=${impact.stderr}`);
    const impactHead = impact.stdout.split('\n')[0] ?? '';
    const depCount = /: (\d+) dependent\(s\)/.exec(impactHead);
    if (!depCount) throw new Error(`unexpected impact header: ${JSON.stringify(impactHead)}`);
    findings.push(finding(`${depCount[1]} dependents returned by impact for a module`, 'hq/bin/hq.mjs impact'));

    return findings;
  },
});
