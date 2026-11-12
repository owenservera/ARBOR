// hq/aii/fixtures/HQ-025-imported-never-executed.mjs
// Scenario HQ-025 (group C): "Which modules are imported but never executed?"
// Engine: hq/lib/indexer.mjs -> importConsumers / executionEvidence
//
// Ground truth LOCKED 2026-11-11 from the live index (.hq/index.db) by running
// importConsumers(db, { target: 'hq/lib/kg-export.mjs' }) against the real
// engine module:
//   count: 3
//     hq/bin/hq.mjs                  test=0  kind=dynamic  line 1057  ../lib/kg-export.mjs
//     hq/lib/refresh.mjs             test=0  kind=dynamic  line  302  ./kg-export.mjs
//     hq/test/kg-export.test.mjs     test=1  kind=import   line   13  ../lib/kg-export.mjs
//
// The scenario asks which modules are imported but NEVER EXECUTED — a runtime
// verdict the source index alone cannot deliver, because a static import
// edge records only that the module is REFERENCED, not that its code ran.
// The engine therefore reports the evidence the index does hold: for each
// imported module, WHO imports it, whether that consumer is production code
// or a test fixture, and whether the edge is static (referenced) or dynamic
// (a runtime import() call site, i.e. an actual load).
//
// The locked invariant is therefore the EVIDENCE SHAPE for the module
// hq/lib/kg-export.mjs: it is imported by exactly three consumers, two of
// them production code reaching it through a DYNAMIC import() call site
// (a genuine runtime load), and one test fixture reaching it through a
// STATIC import. The never-executed determination is the caller's: a module
// whose only consumers are static edges in test fixtures has no verified
// runtime execution, which is exactly the shape this fixture pins for the
// third consumer.

import { defineFixture, finding } from './harness.mjs';
import { importConsumers } from '../../lib/indexer.mjs';
import { openDb } from '../../lib/schema.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const MODULE = 'hq/lib/kg-export.mjs';

const PROVENANCE = `Locked 2026-11-11 by running the real engine module importConsumers() from hq/lib/indexer.mjs
against the live index (.hq/index.db):
- importConsumers(db, { target: '${MODULE}' }) returned exactly 3 consumers:
    hq/bin/hq.mjs              test=0  kind=dynamic  line 1057  ../lib/kg-export.mjs
    hq/lib/refresh.mjs         test=0  kind=dynamic  line  302  ./kg-export.mjs
    hq/test/kg-export.test.mjs test=1  kind=import   line   13  ../lib/kg-export.mjs
- The shape locked here is the execution EVIDENCE: two PRODUCTION consumers reach the module through a DYNAMIC
  import() call site (a genuine runtime load) and one TEST fixture reaches it through a STATIC import (a
  reference, not proof of execution). A module whose only consumers are static edges in test fixtures has no
  verified runtime execution — that is the never-executed shape, and this fixture pins the per-consumer evidence
  the index proves so the distinction stays auditable.
Rerun this fixture to re-derive the findings live.`;

export default defineFixture({
  id: 'HQ-025',
  provenance: PROVENANCE,
  expected: [
    finding(`module ${MODULE} is imported by production consumer hq/bin/hq.mjs via a dynamic import() call site at line 1057`, 'hq/bin/hq.mjs:1057'),
    finding(`module ${MODULE} is imported by production consumer hq/lib/refresh.mjs via a dynamic import() call site at line 302`, 'hq/lib/refresh.mjs:302'),
    finding(`module ${MODULE} is imported only statically by the test fixture hq/test/kg-export.test.mjs at line 13`, 'hq/test/kg-export.test.mjs:13'),
    finding(`module ${MODULE} has 3 consumer edges, 2 of them dynamic runtime loads and 1 a static reference from a test fixture`, MODULE),
  ],
  run: async () => {
    const db = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const consumers = importConsumers(db, { target: MODULE });
      const findings = consumers.map((c) => finding(
        c.kind === 'dynamic'
          ? `module ${MODULE} is imported by ${c.fromIsTest === 1 ? 'test fixture' : 'production consumer'} ${c.from} via a dynamic import() call site at line ${c.line}`
          : `module ${MODULE} is imported only statically by the ${c.fromIsTest === 1 ? 'test fixture' : 'production consumer'} ${c.from} at line ${c.line}`,
        `${c.from}:${c.line}`,
      ));
      const dynamic = consumers.filter((c) => c.kind === 'dynamic');
      const staticTest = consumers.filter((c) => c.kind !== 'dynamic' && c.fromIsTest === 1);
      findings.push(finding(
        `module ${MODULE} has ${consumers.length} consumer edges, ${dynamic.length} of them dynamic runtime loads and ${staticTest.length} a static reference from a test fixture`,
        MODULE,
      ));
      return findings;
    } finally {
      db.close();
    }
  },
});
