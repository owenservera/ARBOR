// hq/aii/fixtures/HQ-069-agent-tool-coupling.mjs
// Scenario HQ-069 (group H): "Which development agent tools are accidentally coupled to product runtime code?"
// Engine: hq/lib/graph.mjs -> agentToolCoupling / classifyRole
//
// Ground truth LOCKED 2026-11-11 by running the real engine module
// agentToolCoupling() against the live index (.hq/index.db):
//
//   PRODUCTION coupling edges (3) — an agent-tool module imported by product
//   runtime code, in either direction:
//     repos-hq/.zcode/diag/diag-domain-f.mjs            -> repos-hq/hq/lib/channel-broker.mjs            (line 12)
//     vivim-web-harness/.zcode/diag/enroll-probe.mjs    -> vivim-web-harness/apps/vivim-host/server.mjs   (line 1)
//     vivim-web-harness/.zcode/diag/mobile-catalog-probe.mjs -> vivim-web-harness/apps/vivim-host/server.mjs (line 5)
//
//   ALL coupling edges including test files (5) — the two extra edges are a
//   TEST file importing an agent tool, which is the intended direction:
//     repos-hq/hq/test/opencode-plugin.test.mjs -> repos-hq/.opencode/plugins/hq/index.ts (lines 7 and 127)
//
// Role rule (hq/lib/graph.mjs classifyRole): an AGENT TOOL is a file at the
// top level of an agent-tool root — `.opencode/`, `.zcode/`, `plugins/`,
// `agents/`. The rule is top-level anchored on purpose: a nested `agents/`
// such as `studio/src/agents/` is product runtime code that happens to be
// about agents, and a name-based rule ("agent.ts") would misclassify product
// code as tooling. Coupling is reported only when the two sides of an import
// edge sit in DIFFERENT roles; edges within one role are normal and are not
// reported.
//
// The counts are pinned alongside the concrete edges so that a change in
// either the number or the identity of the couplings fails the fixture.

import { defineFixture, finding } from './harness.mjs';
import { agentToolCoupling } from '../../lib/graph.mjs';
import { openDb } from '../../lib/schema.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// Live production coupling edges, locked from the live index 2026-11-11.
const PRODUCTION_COUPLINGS = [
  ['repos-hq', '.zcode/diag/diag-domain-f.mjs', 'repos-hq', 'hq/lib/channel-broker.mjs', 12],
  ['vivim-web-harness', '.zcode/diag/enroll-probe.mjs', 'vivim-web-harness', 'apps/vivim-host/server.mjs', 1],
  ['vivim-web-harness', '.zcode/diag/mobile-catalog-probe.mjs', 'vivim-web-harness', 'apps/vivim-host/server.mjs', 5],
];

const PROVENANCE = `Locked 2026-11-11 by running the real engine module agentToolCoupling() from hq/lib/graph.mjs
against the live index (.hq/index.db; projects: repos-hq, openmausbot, vivim-ui, vivim-web-harness):
- agentToolCoupling(db, { includeTests: false }) returned exactly 3 PRODUCTION coupling edges — an agent-tool module
  imported across the role boundary with product runtime code:
    repos-hq/.zcode/diag/diag-domain-f.mjs -> repos-hq/hq/lib/channel-broker.mjs (line 12)
    vivim-web-harness/.zcode/diag/enroll-probe.mjs -> vivim-web-harness/apps/vivim-host/server.mjs (line 1)
    vivim-web-harness/.zcode/diag/mobile-catalog-probe.mjs -> vivim-web-harness/apps/vivim-host/server.mjs (line 5)
- agentToolCoupling(db, {}) returned 5 edges in total; the 2 extra edges are a TEST file importing an agent tool
  (hq/test/opencode-plugin.test.mjs -> .opencode/plugins/hq/index.ts at lines 7 and 127), which is the intended
  direction and not accidental coupling.
- The role rule is top-level anchored (hq/lib/graph.mjs classifyRole): only .opencode/, .zcode/, plugins/ and
  agents/ at the repository root count as agent tooling, so product code that merely is about agents (e.g.
  studio/src/agents/) is not misreported.
Rerun this fixture to re-derive the findings live.`;

export default defineFixture({
  id: 'HQ-069',
  provenance: PROVENANCE,
  expected: [
    ...PRODUCTION_COUPLINGS.map(([fromProject, from, toProject, to, line]) => finding(
      `agent tool ${fromProject}/${from} is coupled to product runtime code ${toProject}/${to} at line ${line}`,
      `${from}:${line}`,
    )),
    finding('production coupling edges between agent tools and product runtime code: 3', 'hq/lib/graph.mjs agentToolCoupling'),
  ],
  run: async () => {
    const db = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const couplings = agentToolCoupling(db, { includeTests: false, limit: 5000 });
      const findings = couplings.map((c) => finding(
        `agent tool ${c.fromProject}/${c.from} is coupled to product runtime code ${c.toProject}/${c.to} at line ${c.line}`,
        `${c.from}:${c.line}`,
      ));
      findings.push(finding(
        `production coupling edges between agent tools and product runtime code: ${couplings.length}`,
        'hq/lib/graph.mjs agentToolCoupling',
      ));
      return findings;
    } finally {
      db.close();
    }
  },
});
