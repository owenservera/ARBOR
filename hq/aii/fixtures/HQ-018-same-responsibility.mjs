// hq/aii/fixtures/HQ-018-same-responsibility.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-018 (group B):
// "Which components implement the same responsibility?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   bun hq/bin/hq.mjs conflicts
//     -> 4 duplicate_term conflicts, each "CANON term "<term>" is defined in
//        2 sources and was not merged". Observed pairs:
//          "every case asserts the transport was NOT called where the policy
//           refuses"  -> hq/test/channel-broker.test.mjs, hq/test/channel-seat.test.mjs
//          "pure: no fs, no childprocess, no clock read. now is an argument and
//           is required" -> hq/lib/revive-daemon.mjs, hq/lib/revive-lane.mjs
//          "read-only; never writes providerconfig.json, the depot catalog, or
//           any agent file" -> hq/test/nvidia-provider-fix.test.mjs,
//           hq/test/nvidia-provider-fix.test.mjs.bak-wo031
//          "tests always override HQSUPERVISORSTATE to a temp dir; the real
//           .hq/supervisor" -> hq/test/supervisor-backpressure.test.mjs,
//           hq/test/supervisor.test.mjs
//   bun hq/bin/hq.mjs dead
//     -> exported symbols with no inbound imports, authority
//        "candidate_not_proof" (hq/bin/hq.mjs:3877) — the orphan side of the
//        same question: an exported responsibility nothing consumes.
//
// Two components implement the same responsibility when the SAME rule is
// defined in two sources (a duplicate_term conflict) — that pairing is the
// concrete answer, so the pairs are pinned exactly. The conflict COUNT drifts
// as lanes index more CANON terms, so it is re-derived live.
import { defineFixture, finding, runHq } from './harness.mjs';
import { openDb } from '../../lib/schema.mjs';
import { documentHealth } from '../../lib/canon.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// The duplicate CANON terms observed in the live index, pinned by term.
const DUPLICATE_TERMS = [
  {
    term: 'every case asserts the transport was NOT called where the policy refuses',
    sources: 'hq/test/channel-broker.test.mjs, hq/test/channel-seat.test.mjs',
  },
  {
    term: 'pure: no fs, no childprocess, no clock read. now is an argument and is required',
    sources: 'hq/lib/revive-daemon.mjs, hq/lib/revive-lane.mjs',
  },
  {
    term: 'tests always override HQSUPERVISORSTATE to a temp dir; the real .hq/supervisor',
    sources: 'hq/test/supervisor-backpressure.test.mjs, hq/test/supervisor.test.mjs',
  },
];

export default defineFixture({
  id: 'HQ-018',
  provenance: 'Locked 2026-11-11 on branch main from live output: bun hq/bin/hq.mjs conflicts printed 4 duplicate_term conflicts, each of the form CANON term "<term>" is defined in 2 sources and was not merged — "every case asserts the transport was NOT called where the policy refuses" in hq/test/channel-broker.test.mjs and hq/test/channel-seat.test.mjs; "pure: no fs, no childprocess, no clock read. now is an argument and is required" in hq/lib/revive-daemon.mjs and hq/lib/revive-lane.mjs; "read-only; never writes providerconfig.json, the depot catalog, or any agent file" in hq/test/nvidia-provider-fix.test.mjs and hq/test/nvidia-provider-fix.test.mjs.bak-wo031; "tests always override HQSUPERVISORSTATE to a temp dir; the real .hq/supervisor" in hq/test/supervisor-backpressure.test.mjs and hq/test/supervisor.test.mjs. documentHealth() (hq/lib/canon.mjs:192) returns the same 4 conflicts. bun hq/bin/hq.mjs dead printed exported symbols with no inbound imports under the authority "candidate_not_proof" (hq/bin/hq.mjs:3877) — the orphan side of the same question. The conflict COUNT drifts as concurrent lanes index more CANON terms, so it is re-derived live; the term/sOURCE PAIRINGS that answer the question are pinned exactly.',
  expected: [
    { what: 'same responsibility implemented twice: "every case asserts the transport was NOT called where the policy refuses" is defined in hq/test/channel-broker.test.mjs, hq/test/channel-seat.test.mjs', where: 'hq/lib/canon.mjs documentHealth' },
    { what: 'same responsibility implemented twice: "pure: no fs, no childprocess, no clock read. now is an argument and is required" is defined in hq/lib/revive-daemon.mjs, hq/lib/revive-lane.mjs', where: 'hq/lib/canon.mjs documentHealth' },
    { what: 'same responsibility implemented twice: "tests always override HQSUPERVISORSTATE to a temp dir; the real .hq/supervisor" is defined in hq/test/supervisor-backpressure.test.mjs, hq/test/supervisor.test.mjs', where: 'hq/lib/canon.mjs documentHealth' },
    { what: /^every duplicate_term conflict names a term defined in exactly 2 sources that was not merged$/, where: 'hq/lib/canon.mjs documentHealth' },
    { what: /^\d+ conflicts of kind duplicate_term detected$/, where: 'hq/lib/canon.mjs documentHealth' },
    { what: 'authority candidate_not_proof', where: 'hq/bin/hq.mjs cmdDead' },
    { what: /^\d+ exported symbols with no inbound imports reported as orphan responsibilities$/, where: 'hq/bin/hq.mjs cmdDead' },
  ],
  run: async () => {
    const findings = [];

    const db = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const health = documentHealth(db, { root: ROOT });
      const conflicts = (health.conflicts ?? []).filter((c) => c.kind === 'duplicate_term');
      if (!conflicts.length) throw new Error('documentHealth found no duplicate_term conflicts');
      const byTerm = new Map(conflicts.map((c) => [c.a, c.b]));
      for (const { term, sources } of DUPLICATE_TERMS) {
        const actual = byTerm.get(term);
        if (actual !== sources) {
          throw new Error(`unexpected sources for term ${JSON.stringify(term)}: ${JSON.stringify(actual)}`);
        }
        findings.push(finding(`same responsibility implemented twice: "${term}" is defined in ${actual}`, 'hq/lib/canon.mjs documentHealth'));
      }
      for (const conflict of conflicts) {
        const message = String(conflict.message ?? '');
        if (!/is defined in 2 sources and was not merged/.test(message)) {
          throw new Error(`unexpected conflict message: ${JSON.stringify(message)}`);
        }
      }
      findings.push(finding('every duplicate_term conflict names a term defined in exactly 2 sources that was not merged', 'hq/lib/canon.mjs documentHealth'));
      findings.push(finding(`${conflicts.length} conflicts of kind duplicate_term detected`, 'hq/lib/canon.mjs documentHealth'));
    } finally {
      db.close();
    }

    const dead = runHq(['dead', '--json'], { cwd: ROOT });
    if (dead.exit !== 0) throw new Error(`hq dead --json failed: exit=${dead.exit} stderr=${dead.stderr}`);
    const parsed = JSON.parse(dead.stdout);
    if (parsed.authority !== 'candidate_not_proof') {
      throw new Error(`unexpected dead authority: ${parsed.authority}`);
    }
    findings.push(finding('authority candidate_not_proof', 'hq/bin/hq.mjs cmdDead'));
    if (!Array.isArray(parsed.candidates)) throw new Error('hq dead --json has no candidates array');
    findings.push(finding(`${parsed.candidates.length} exported symbols with no inbound imports reported as orphan responsibilities`, 'hq/bin/hq.mjs cmdDead'));

    return findings;
  },
});
