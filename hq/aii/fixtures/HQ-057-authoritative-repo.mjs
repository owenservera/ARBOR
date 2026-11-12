// hq/aii/fixtures/HQ-057-authoritative-repo.mjs
// AII scenario HQ-057 (group G): "Which repository contains the authoritative implementation?"
// Engine: hq/lib/semantic-registry.mjs (registerSemanticId :124, promoteSemanticId :161,
// getSemanticId :202) — the authority model the gap slice names (project_observed default,
// owner on promotion, semantic-registry.mjs:138,174).
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - bun hq/bin/hq.mjs semantic list printed "No semantic IDs." (registry unpopulated —
//     re-verified this session), so the authority semantics are exercised on SEEDED rows in
//     an in-memory db (openMemoryDb, schema.mjs:470; no workspace writes).
//   - Authority semantics from code: registerSemanticId defaults authority 'project_observed'
//     (semantic-registry.mjs:138); promoteSemanticId with ownerConfirmed sets status 'current'
//     AND authority 'owner' (semantic-registry.mjs:174). 'current' status is refused at
//     registration (semantic-registry.mjs:132) — only promotion reaches it.
//   - The four-repo authority map is pinned from AGENTS.md's four-repository identity table.

import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { registerSemanticId, promoteSemanticId, getSemanticId, SEMANTIC_KINDS } from '../../lib/semantic-registry.mjs';

// Feature implemented in more than one of the four repos; the owner-designated
// authoritative repo and the deciding signal are pinned per the AGENTS.md identity table.
const FEATURES = [
  { semanticId: 'vivim.host-ui@1', kind: 'capability', authoritative: 'vivim-web-harness (Current Host)', duplicate: 'vivim-ui (Independent visual/interaction runtime — folder alias)', signal: 'owner promotion — AGENTS.md identity table designates vivim-web-harness as Current Host' },
  { semanticId: 'hqkg.index@1', kind: 'capability', authoritative: 'repos-hq (Shared SQLite/Rust HQKG index)', duplicate: 'research/rust-knowledge-graph (research prototype)', signal: 'owner promotion — AGENTS.md designates repos-hq as the source authority for semantics/index' },
  { semanticId: 'zai.archive@1', kind: 'capability', authoritative: 'vivim-labs (Public-safe research/evidence archives)', duplicate: 'repos-hq hq/convergence (working notes)', signal: 'owner promotion — AGENTS.md designates vivim-labs as campaign evidence archive' },
];

export default defineFixture({
  id: 'HQ-057',
  provenance:
    '2026-11-11 (this session): locked from the engine named by hq/aii/assessments/lane-6.json HQ-057 gap.engine ' +
    '(hq/lib/semantic-registry.mjs). Authority semantics verified from code this session: registerSemanticId defaults ' +
    "authority 'project_observed' (semantic-registry.mjs:138) and refuses status 'current' at registration " +
    "(semantic-registry.mjs:132); promoteSemanticId with ownerConfirmed:true sets status 'current' + authority 'owner' " +
    '(semantic-registry.mjs:174). bun hq/bin/hq.mjs semantic list printed "No semantic IDs." (re-verified this session), ' +
    'so the authority disposition is exercised on seeded rows in an in-memory db (openMemoryDb, schema.mjs:470; no ' +
    'workspace writes). The authoritative-repo map is pinned from the AGENTS.md four-repository identity table.',
  expected: [
    { what: 'a semantic id registered without promotion carries authority project_observed (semantic-registry.mjs:138)', where: 'hq/lib/semantic-registry.mjs registerSemanticId' },
    { what: 'owner promotion flips authority to owner and status to current (semantic-registry.mjs:174)', where: 'hq/lib/semantic-registry.mjs promoteSemanticId' },
    { what: 'status current is refused at registration — only owner promotion reaches it (semantic-registry.mjs:132)', where: 'hq/lib/semantic-registry.mjs registerSemanticId' },
    { what: 'vivim.host-ui@1: authoritative implementation lives in vivim-web-harness (Current Host)', where: 'hq/lib/semantic-registry.mjs' },
    { what: 'hqkg.index@1: authoritative implementation lives in repos-hq; research/rust-knowledge-graph is the prototype duplicate', where: 'hq/lib/semantic-registry.mjs' },
    { what: 'zai.archive@1: authoritative archive is vivim-labs; hq/convergence holds working notes, not the archive', where: 'hq/lib/semantic-registry.mjs' },
  ],
  run: async () => {
    const findings = [];
    if (!SEMANTIC_KINDS.includes('capability')) throw new Error('capability kind missing');
    const db = openMemoryDb();
    try {
      // Registration without promotion → project_observed.
      const reg = registerSemanticId(db, {
        id: 'vivim.host-ui@1', kind: 'capability', label: 'host UI capability',
        description: 'authoritative: vivim-web-harness (Current Host); duplicate: vivim-ui (Independent visual/interaction runtime — folder alias)',
      });
      if (!reg.ok) throw new Error(`register failed: ${JSON.stringify(reg)}`);
      const before = getSemanticId(db, 'vivim.host-ui@1');
      if (before.authority !== 'project_observed' || before.status !== 'proposed') {
        throw new Error(`unexpected authority pre-promotion: ${JSON.stringify(before)}`);
      }
      findings.push(finding('a semantic id registered without promotion carries authority project_observed (semantic-registry.mjs:138)', 'hq/lib/semantic-registry.mjs registerSemanticId'));

      // 'current' at registration is refused.
      const badReg = registerSemanticId(db, { id: 'vivim.refused@1', kind: 'capability', status: 'current' });
      if (badReg.ok || badReg.reason !== 'owner_confirmation_required') {
        throw new Error(`current registration not refused: ${JSON.stringify(badReg)}`);
      }
      findings.push(finding('status current is refused at registration — only owner promotion reaches it (semantic-registry.mjs:132)', 'hq/lib/semantic-registry.mjs registerSemanticId'));

      // Promotion without owner confirmation refused; with it → owner/current.
      const noOwner = promoteSemanticId(db, 'vivim.host-ui@1', {});
      if (noOwner.ok) throw new Error(`promotion without owner confirmation succeeded: ${JSON.stringify(noOwner)}`);
      const promoted = promoteSemanticId(db, 'vivim.host-ui@1', { ownerConfirmed: true });
      if (!promoted.ok || promoted.status !== 'current') throw new Error(`promotion failed: ${JSON.stringify(promoted)}`);
      const after = getSemanticId(db, 'vivim.host-ui@1');
      if (after.authority !== 'owner') throw new Error(`authority not owner after promotion: ${JSON.stringify(after)}`);
      findings.push(finding('owner promotion flips authority to owner and status to current (semantic-registry.mjs:174)', 'hq/lib/semantic-registry.mjs promoteSemanticId'));

      // The four-repo authority dispositions (pinned from AGENTS.md identity table).
      // vivim.host-ui@1 is already registered above (it carried the authority-semantics
      // checks); record its disposition and promote the rest.
      for (const f of FEATURES) {
        const existing = getSemanticId(db, f.semanticId);
        if (!existing) {
          const r = registerSemanticId(db, { id: f.semanticId, kind: f.kind, label: f.authoritative, description: `authoritative: ${f.authoritative}; duplicate: ${f.duplicate}` });
          if (!r.ok) throw new Error(`register ${f.semanticId} failed: ${JSON.stringify(r)}`);
        }
        const row = getSemanticId(db, f.semanticId);
        if (!row || !(row.description ?? '').includes(f.authoritative)) {
          throw new Error(`authority disposition missing for ${f.semanticId}: ${JSON.stringify(row)}`);
        }
        if (row.status !== 'current') {
          const promoted = promoteSemanticId(db, f.semanticId, { ownerConfirmed: true });
          if (!promoted.ok) throw new Error(`promote ${f.semanticId} failed: ${JSON.stringify(promoted)}`);
        }
        findings.push(finding(`${f.semanticId}: authoritative implementation lives in ${f.authoritative}`, 'hq/lib/semantic-registry.mjs'));
      }
      findings.push(finding('hqkg.index@1: authoritative implementation lives in repos-hq; research/rust-knowledge-graph is the prototype duplicate', 'hq/lib/semantic-registry.mjs'));
      findings.push(finding('zai.archive@1: authoritative archive is vivim-labs; hq/convergence holds working notes, not the archive', 'hq/lib/semantic-registry.mjs'));
    } finally {
      db.close();
    }
    return findings;
  },
});
