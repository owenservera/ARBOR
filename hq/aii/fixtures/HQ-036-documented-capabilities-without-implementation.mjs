// hq/aii/fixtures/HQ-036-documented-capabilities-without-implementation.mjs
// AII build lane "p0-knowledge-implementation". Scenario HQ-036 (P0, group E):
// "Which documented capabilities have no matching implementation?"
//
// Engine: hq/lib/canon.mjs — documentedCapabilitiesWithoutImplementation().
//
// Ground truth locked 2026-11-11 by running the live module against a seeded
// synthetic workspace (bun .tmp/aii-probe-hq036.mjs, since removed): a canon
// document, a canon term and a canon decision each state a capability, and the
// engine reports only those whose documented claim has no implementation
// anchor. Implementation evidence is the document's own binds_to set, and
// binds_to records a path only when that file exists on disk — so an anchor is
// verified evidence, not a guess. The seeded workspace pins every branch:
//   implemented  → anchor on an existing source file  → excluded
//   unimplemented→ no anchor at all                    → reported
// Observed: 5 documented capabilities have no matching implementation — the
// unanchored capability document, the canon-terms document and its term, and
// the decisions document and its decision. The anchored capability document and
// the invariant term extracted from the implementation source are both
// excluded, each already having an implementation.
// Re-derived live at run time. Read-only probe: synthetic seeded files in a
// temp dir, removed afterwards. No credentials, no private session content.
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { documentedCapabilitiesWithoutImplementation } from '../../lib/canon.mjs';
import { defineFixture, finding } from './harness.mjs';

// The seeded implementation. The @hq:invariant annotation makes the canon term
// extractor read a term out of this source file, which then counts as
// implemented by that very file.
const IMPL_SOURCE = `// Seeded implementation module
// @hq:invariant seeded invariants are never violated
export const SEED_CAPABILITY = 'seeded';
export function seedImplement() { return SEED_CAPABILITY; }
`;

// A documented capability whose implementation exists.
const IMPLEMENTED_DOC = `# Seeded capability that is implemented

This document states a capability and anchors at the source that realises it.

@hq:see hq/lib/seed-impl.mjs
`;

// A documented capability with no implementation anywhere.
const UNIMPLEMENTED_DOC = `# Seeded capability with no implementation

This document states a capability that no source file in the tree realises.
`;

// A canon term naming a capability, defined in a canon path.
const CANON_TERMS = `# Seeded canon terms

- **Seeded term capability** — A capability claimed by a canon term only.
`;

// A decision about a capability, in a decisions table.
const DECISIONS_DOC = `# Seeded decisions

| ID | Decision | Status | Date |
| --- | --- | --- | --- |
| DEC-SEED-001 | Seeded decision capability stays provisional | proposed | 2026-11-11 |
`;

function buildWorkspace(root) {
  const put = (rel, text) => {
    const abs = join(root, rel);
    mkdirSync(join(abs, '..'), { recursive: true });
    writeFileSync(abs, text, 'utf8');
  };
  put('hq/lib/seed-impl.mjs', IMPL_SOURCE);
  put('docs/CAPABILITY-SEEDED-IMPLEMENTED.md', IMPLEMENTED_DOC);
  put('docs/CAPABILITY-SEEDED-UNIMPLEMENTED.md', UNIMPLEMENTED_DOC);
  put('docs/canon/seeded-terms.md', CANON_TERMS);
  put('docs/decisions/SEEDED-DECISIONS.md', DECISIONS_DOC);
}

export default defineFixture({
  id: 'HQ-036',
  provenance: `Locked 2026-11-11 from live engine output on branch main.
documentedCapabilitiesWithoutImplementation() (hq/lib/canon.mjs) was run against a
seeded synthetic workspace (bun .tmp/aii-probe-seeded.mjs, since removed) holding
one implementation module (hq/lib/seed-impl.mjs), one capability document that
anchors at it (docs/CAPABILITY-SEEDED-IMPLEMENTED.md), one capability document
with no anchor (docs/CAPABILITY-SEEDED-UNIMPLEMENTED.md), a canon term naming a
capability (docs/canon/seeded-terms.md) and a decision about a capability
(docs/decisions/SEEDED-DECISIONS.md). Observed: the anchored document and the
invariant term extracted from the implementation source are both excluded — each
already has an implementation — and the unanchored document, the canon term and
the decision are reported as documented capabilities with no matching
implementation. Implementation evidence is binds_to, which canon.mjs records only
for paths that exist on disk, so every anchor is verified. Re-derived live at run
time. Read-only probe over seeded synthetic files; no credentials, no private
session content.`,
  expected: [
    { what: 'Seeded capability with no implementation', where: 'docs/CAPABILITY-SEEDED-UNIMPLEMENTED.md' },
    { what: 'Seeded canon terms', where: 'docs/canon/seeded-terms.md' },
    { what: 'Seeded decisions', where: 'docs/decisions/SEEDED-DECISIONS.md' },
    { what: 'Seeded term capability', where: 'docs/canon/seeded-terms.md' },
    { what: 'Seeded decision capability stays provisional', where: 'docs/decisions/SEEDED-DECISIONS.md' },
    { what: '5 documented capabilities have no matching implementation', where: 'hq/lib/canon.mjs' },
    { what: 'implemented capability excluded: docs/CAPABILITY-SEEDED-IMPLEMENTED.md -> hq/lib/seed-impl.mjs', where: 'hq/lib/canon.mjs' },
    { what: 'implemented term excluded: hq/lib/seed-impl.mjs', where: 'hq/lib/canon.mjs' },
  ],
  run: async () => {
    const root = mkdtempSync(join(tmpdir(), 'hq036-fixture-'));
    try {
      buildWorkspace(root);
      const unimplemented = documentedCapabilitiesWithoutImplementation(root);
      const findings = [];
      for (const claim of unimplemented) {
        findings.push(finding(claim.claim, claim.where));
      }
      findings.push(finding(
        `${unimplemented.length} documented capabilities have no matching implementation`,
        'hq/lib/canon.mjs',
      ));
      // The implemented capability and the term extracted from the implementation
      // source must NOT appear among the unimplemented claims.
      if (!unimplemented.some((c) => c.where === 'docs/CAPABILITY-SEEDED-IMPLEMENTED.md')) {
        findings.push(finding(
          'implemented capability excluded: docs/CAPABILITY-SEEDED-IMPLEMENTED.md -> hq/lib/seed-impl.mjs',
          'hq/lib/canon.mjs',
        ));
      }
      if (!unimplemented.some((c) => c.where === 'hq/lib/seed-impl.mjs')) {
        findings.push(finding('implemented term excluded: hq/lib/seed-impl.mjs', 'hq/lib/canon.mjs'));
      }
      return findings;
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  },
});
