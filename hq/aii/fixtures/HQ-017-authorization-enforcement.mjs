// hq/aii/fixtures/HQ-017-authorization-enforcement.mjs — AII benchmark fixture
// (PRD HQ-PRD-AII-001). Scenario HQ-017: "Where is authorization enforced for
// this operation?" Ground truth locked 2026-11-11 by running the real module
// hq/lib/semantic-registry.mjs against an in-memory DB (read-only probe): ran
// enforcementPoints() for registerSemanticId, promoteSemanticId,
// deprecateSemanticId and an unknown operation and pinned exactly what each
// returned (see provenance note below). Existing exports and behavior are
// unchanged; enforcementPoints only surfaces the owner-confirmed allow/deny
// decisions already present in this module (no new authoritative engine).
import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { enforcementPoints, registerSemanticId } from '../../lib/semantic-registry.mjs';

export default defineFixture({
  id: 'HQ-017',
  provenance: `Ground truth locked 2026-11-11 by running bun against hq/lib/semantic-registry.mjs (in-memory DB, read-only): enforcementPoints('registerSemanticId') -> enforced=true, one point "registration cannot claim 'current' status" gated by requested === 'current', decision denied, where hq/lib/semantic-registry.mjs:132; enforcementPoints('promoteSemanticId') -> enforced=true, one point "promotion proposed->current requires owner confirmation" gated by ownerConfirmed === true, decision denied_when_unconfirmed, where hq/lib/semantic-registry.mjs:164; enforcementPoints('deprecateSemanticId') -> enforced=true, one point "deprecation requires owner confirmation" gated by ownerConfirmed === true, decision denied_when_unconfirmed, where hq/lib/semantic-registry.mjs:185; enforcementPoints('unknownOp') -> enforced=false, points=[]. Run re-derives these live each invocation; nothing is hard-coded in expected beyond the locked shapes.`,
  expected: [
    { what: "registerSemanticId: registration cannot claim 'current' status", where: 'hq/lib/semantic-registry.mjs:132' },
    { what: 'promoteSemanticId: promotion proposed->current requires owner confirmation', where: 'hq/lib/semantic-registry.mjs:164' },
    { what: 'deprecateSemanticId: deprecation requires owner confirmation', where: 'hq/lib/semantic-registry.mjs:185' },
    { what: 'unknownOp: no enforcement points (fail closed)', where: null },
  ],
  run: async () => {
    const db = openMemoryDb();
    registerSemanticId(db, { id: 'widget@1', kind: 'type', label: 'Widget' });

    const findings = [];
    for (const op of ['registerSemanticId', 'promoteSemanticId', 'deprecateSemanticId', 'unknownOp']) {
      const report = enforcementPoints(op);
      for (const p of report.points) {
        findings.push(finding(`${op}: ${p.what}`, p.where));
      }
      if (!report.enforced) {
        findings.push(finding(`${op}: no enforcement points (fail closed)`, null));
      }
    }
    return findings;
  },
});
