// hq/aii/fixtures/HQ-037-labs-designs-implemented-elsewhere.mjs
// AII build lane "p0-knowledge-implementation". Scenario HQ-037 (P0, group E):
// "Which designs in Labs have already been implemented elsewhere?"
//
// Engine: hq/lib/canon.mjs — labsDesignsImplementedElsewhere().
//
// Ground truth locked 2026-11-11 by running the live module against a seeded
// synthetic workspace (bun .tmp/aii-probe-seeded.mjs, since removed). A Labs
// or research design is "already implemented elsewhere" when it anchors at an
// implementation file outside its own tree — the main product already ships
// it. The anchor set is binds_to, which canon.mjs records only for paths that
// exist on disk, so every match is verified evidence. The seeded workspace
// pins all three branches:
//   anchored at a main-product source file → reported as implemented elsewhere
//   anchored only inside its own tree        → NOT reported (not elsewhere)
//   no anchor at all                         → NOT reported (not implemented)
// Re-derived live at run time. Read-only probe: synthetic seeded files in a
// temp dir, removed afterwards. No credentials, no private session content.
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { labsDesignsImplementedElsewhere } from '../../lib/canon.mjs';
import { defineFixture, finding } from './harness.mjs';

// The main-product implementation the seeded designs point at.
const IMPL_SOURCE = `// Seeded main-product implementation
export const SEED_IMPL = 'seeded';
`;

// A Labs design implemented by the main product.
const LAB_IMPLEMENTED = `# LAB#1 — Seeded dogfeed

The seeded lab design is realised by the main product.

@hq:see hq/lib/seed-impl.mjs
`;

// A Labs design with no implementation anywhere.
const LAB_UNIMPLEMENTED = `# LAB#2 — Seeded unbuilt

The seeded lab design has no implementation anywhere.
`;

// A research design implemented only inside its own tree — not "elsewhere".
const RESEARCH_OWN_TREE = `# Seeded own-tree research design

The design ships its own implementation.

@hq:see research/seed-own/README.md
`;

// A research design implemented by the main product.
const RESEARCH_ELSEWHERE = `# Seeded research design implemented elsewhere

The design is realised by the main product.

@hq:see hq/lib/seed-impl.mjs
`;

function buildWorkspace(root) {
  const put = (rel, text) => {
    const abs = join(root, rel);
    mkdirSync(join(abs, '..'), { recursive: true });
    writeFileSync(abs, text, 'utf8');
  };
  put('hq/lib/seed-impl.mjs', IMPL_SOURCE);
  put('docs/LABS/LAB-01-SEEDED-DOGFEED.md', LAB_IMPLEMENTED);
  put('docs/LABS/LAB-02-SEEDED-UNBUILT.md', LAB_UNIMPLEMENTED);
  put('research/seed-own/README.md', RESEARCH_OWN_TREE);
  put('research/seed-elsewhere/README.md', RESEARCH_ELSEWHERE);
}

export default defineFixture({
  id: 'HQ-037',
  provenance: `Locked 2026-11-11 from live engine output on branch main.
labsDesignsImplementedElsewhere() (hq/lib/canon.mjs) was run against a seeded
synthetic workspace (bun .tmp/aii-probe-seeded.mjs, since removed) holding a
main-product implementation (hq/lib/seed-impl.mjs) and four designs: a Labs
design anchored at that implementation (docs/LABS/LAB-01-SEEDED-DOGFEED.md), a
Labs design with no anchor (docs/LABS/LAB-02-SEEDED-UNBUILT.md), a research
design anchored only inside its own tree (research/seed-own/README.md), and a
research design anchored at the main product (research/seed-elsewhere/README.md).
Observed: 2 designs are implemented elsewhere — LAB#1 -> hq/lib/seed-impl.mjs and
the seeded research design -> hq/lib/seed-impl.mjs. The unbuilt Labs design and
the own-tree research design are both excluded: an own-tree anchor is not
"elsewhere", and no anchor is not an implementation. Implementation evidence is
binds_to, recorded by canon.mjs only for paths that exist on disk. Re-derived
live at run time. Read-only probe over seeded synthetic files; no credentials,
no private session content.`,
  expected: [
    { what: 'LAB#1 — Seeded dogfeed', where: 'docs/LABS/LAB-01-SEEDED-DOGFEED.md' },
    { what: 'Seeded research design implemented elsewhere', where: 'research/seed-elsewhere/README.md' },
    { what: '2 designs are already implemented elsewhere', where: 'hq/lib/canon.mjs' },
    { what: 'LAB#1 — Seeded dogfeed -> hq/lib/seed-impl.mjs', where: 'hq/lib/canon.mjs' },
    { what: 'unbuilt design excluded: docs/LABS/LAB-02-SEEDED-UNBUILT.md', where: 'hq/lib/canon.mjs' },
    { what: 'own-tree design excluded: research/seed-own/README.md', where: 'hq/lib/canon.mjs' },
  ],
  run: async () => {
    const root = mkdtempSync(join(tmpdir(), 'hq037-fixture-'));
    try {
      buildWorkspace(root);
      const implemented = labsDesignsImplementedElsewhere(root);
      const findings = [];
      for (const design of implemented) {
        findings.push(finding(design.design, design.where));
      }
      findings.push(finding(
        `${implemented.length} designs are already implemented elsewhere`,
        'hq/lib/canon.mjs',
      ));
      for (const design of implemented) {
        findings.push(finding(`${design.design} -> ${design.implementedBy}`, 'hq/lib/canon.mjs'));
      }
      // A design with no anchor at all is not an implementation.
      if (!implemented.some((d) => d.where === 'docs/LABS/LAB-02-SEEDED-UNBUILT.md')) {
        findings.push(finding('unbuilt design excluded: docs/LABS/LAB-02-SEEDED-UNBUILT.md', 'hq/lib/canon.mjs'));
      }
      // A design implemented inside its own tree is not implemented *elsewhere*.
      if (!implemented.some((d) => d.where === 'research/seed-own/README.md')) {
        findings.push(finding('own-tree design excluded: research/seed-own/README.md', 'hq/lib/canon.mjs'));
      }
      return findings;
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  },
});
