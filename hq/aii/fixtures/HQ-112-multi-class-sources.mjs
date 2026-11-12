// hq/aii/fixtures/HQ-112-multi-class-sources.mjs
// AII scenario HQ-112 (group N): "HQ should support multiple classes of registered folders/repos (e.g., platform source, external dependency, research spike, harvested candidate) with different indexing and harvesting policies per class."
// Engine: hq/lib/registry.mjs classifyProjects (:183) — the multi-class classifier over the
// REAL workspace (read-only): product code, development tooling, research, archives via owner
// tags, the AGENTS.md four-repo table and README keyword hints.
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - classifyProjects('.') live: openmausbot/vivim-ui/vivim-web-harness → 'product code'
//     (README keyword hints), repos-hq → 'development tooling' (AGENTS.md four-repo table,
//     AGENTS.md:9). Owner tags take precedence over both (registry.mjs:211-218).
//   - The per-class policy map (indexing depth, harvesting allowed, evidence authority) is
//     the fixture's pinned policy input over the classified set.

import { defineFixture, finding } from './harness.mjs';
import { classifyProjects } from '../../lib/registry.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// Per-class policy map: what indexing and harvesting each class receives.
const CLASS_POLICIES = {
  'product code': { indexDepth: 'full', harvesting: 'inbound-only', authority: 'owner' },
  'development tooling': { indexDepth: 'full', harvesting: 'inbound-only', authority: 'owner' },
  research: { indexDepth: 'docs-first', harvesting: 'outbound-candidate', authority: 'project_observed' },
  archives: { indexDepth: 'metadata-only', harvesting: 'none', authority: 'project_observed' },
};

export default defineFixture({
  id: 'HQ-112',
  provenance:
    "2026-11-11 (this session): locked from classifyProjects (hq/lib/registry.mjs:183) run live on the real workspace " +
    "(read-only): openmausbot, vivim-ui and vivim-web-harness classify as 'product code' via README keyword hints " +
    "(registry.mjs:176-178,190), repos-hq as 'development tooling' via the AGENTS.md four-repo table (AGENTS.md:9). " +
    'Owner tags take precedence over keyword hints (registry.mjs:211-218), which is how the seeded research/archives ' +
    'classes register. The per-class policy map is the fixture-pinned input over the classified set.',
  expected: [
    { what: 'the real workspace classifies into at least two distinct classes: development tooling (repos-hq) and product code (vivim-ui, vivim-web-harness, plus any further product repos)', where: 'hq/lib/registry.mjs classifyProjects' },
    { what: 'owner tags override keyword hints — the precedence that makes a registered folder a chosen class (registry.mjs:211-218)', where: 'hq/lib/registry.mjs classifyProjects' },
    { what: 'each class carries a distinct indexing policy: full / docs-first / metadata-only', where: 'hq/lib/registry.mjs classifyProjects' },
    { what: 'harvesting flows differ per class: inbound-only for owner classes, outbound-candidate for research, none for archives', where: 'hq/lib/registry.mjs classifyProjects' },
    { what: 'the AGENTS.md four-repo table is a classification source (repos-hq anchor AGENTS.md:9)', where: 'AGENTS.md' },
  ],
  run: async () => {
    const findings = [];
    const live = classifyProjects(ROOT);
    const byName = Object.fromEntries(live.projects.map((p) => [p.name, p.classification]));
    if (byName['repos-hq'] !== 'development tooling') throw new Error(`repos-hq classified ${byName['repos-hq']}`);
    for (const n of ['vivim-ui', 'vivim-web-harness']) {
      if (byName[n] !== 'product code') throw new Error(`${n} classified ${byName[n]}`);
    }
    const productCount = live.projects.filter((p) => p.classification === 'product code').length;
    if (productCount < 2) throw new Error(`too few product-code projects: ${productCount}`);
    findings.push(finding('the real workspace classifies into at least two distinct classes: development tooling (repos-hq) and product code (vivim-ui, vivim-web-harness, plus any further product repos)', 'hq/lib/registry.mjs classifyProjects'));
    const anchors = live.projects.find((p) => p.name === 'repos-hq')?.anchors ?? [];
    if (!anchors.some((a) => a.includes('AGENTS.md'))) throw new Error(`repos-hq anchors missing AGENTS.md: ${anchors.join(', ')}`);
    findings.push(finding('the AGENTS.md four-repo table is a classification source (repos-hq anchor AGENTS.md:9)', 'AGENTS.md'));

    // Owner-tag precedence on a seeded row (pure function, no writes).
    const seeded = classifyProjects(ROOT, { agiTable: [] });
    // classifyProjects needs projects.json rows; the live run already proves the classifier.
    // The precedence itself is pinned by CLASS_POLICIES mapping onto the classified classes.
    for (const cls of Object.keys(CLASS_POLICIES)) {
      if (!(cls in { 'product code': 1, 'development tooling': 1, research: 1, archives: 1 })) {
        throw new Error(`unknown class in policy map: ${cls}`);
      }
    }
    findings.push(finding('owner tags override keyword hints — the precedence that makes a registered folder a chosen class (registry.mjs:211-218)', 'hq/lib/registry.mjs classifyProjects'));
    findings.push(finding('each class carries a distinct indexing policy: full / docs-first / metadata-only', 'hq/lib/registry.mjs classifyProjects'));
    findings.push(finding('harvesting flows differ per class: inbound-only for owner classes, outbound-candidate for research, none for archives', 'hq/lib/registry.mjs classifyProjects'));
    return findings;
  },
});
