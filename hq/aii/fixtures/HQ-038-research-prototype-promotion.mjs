// hq/aii/fixtures/HQ-038-research-prototype-promotion.mjs
// AII build lane "p0-knowledge-implementation". Scenario HQ-038 (P0, group E):
// "Which research prototypes should be promoted into the main product?"
//
// Engine: hq/lib/canon.mjs — prototypePromotionCandidates().
//
// Ground truth locked 2026-11-11 by running the live module against a seeded
// synthetic workspace (bun .tmp/aii-probe-seeded.mjs, since removed). The
// recommendation uses three signals, each read from verified on-disk evidence:
//   maturity  → the prototype's own tree ships implementation code
//   reachability → main-product source already points at the prototype
//   duplication   → the main product already implements it
// A prototype is recommended for promotion when it is mature and not already
// duplicated. The anchor set is binds_to, which canon.mjs records only for
// paths that exist on disk, so every signal is verified. The seeded workspace
// pins all branches: a mature, reachable, not-duplicated prototype (promoted),
// a prototype the product already implements (not promoted — duplicated), and
// a prototype with no implementation at all (not promoted — nascent).
// Re-derived live at run time. Read-only probe: synthetic seeded files in a
// temp dir, removed afterwards. No credentials, no private session content.
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prototypePromotionCandidates } from '../../lib/canon.mjs';
import { defineFixture, finding } from './harness.mjs';

// The main-product implementation. Its @hq:see annotation makes the product's
// own source point at the seeded prototype, which is the reachability signal.
const PRODUCT_SOURCE = `// Seeded main-product source
// @hq:see research/seed-promotable/README.md
export const SEED_PRODUCT = 'seeded';
`;

// A prototype with its own implementation, referenced by the product, and not
// yet implemented by the product: a promotion candidate.
const PROMOTABLE = `# Seeded promotable prototype

The prototype ships its own implementation and the product points at it.

@hq:see research/seed-promotable/impl.mjs
`;

// A prototype the main product already implements: duplicated, not promotable.
const DUPLICATED = `# Seeded duplicated prototype

The prototype is already implemented by the main product.

@hq:see hq/lib/seed-impl.mjs
`;

// A prototype with no implementation at all: nascent, not promotable.
const NASCENT = `# Seeded nascent prototype

The prototype has no implementation anywhere.
`;

function buildWorkspace(root) {
  const put = (rel, text) => {
    const abs = join(root, rel);
    mkdirSync(join(abs, '..'), { recursive: true });
    writeFileSync(abs, text, 'utf8');
  };
  put('hq/lib/seed-product.mjs', PRODUCT_SOURCE);
  put('hq/lib/seed-impl.mjs', `export const SEED_IMPL = 'seeded';\n`);
  put('research/seed-promotable/README.md', PROMOTABLE);
  put('research/seed-promotable/impl.mjs', `export const SEED_PROTOTYPE = 'seeded';\n`);
  put('research/seed-duplicated/README.md', DUPLICATED);
  put('research/seed-nascent/README.md', NASCENT);
}

export default defineFixture({
  id: 'HQ-038',
  provenance: `Locked 2026-11-11 from live engine output on branch main.
prototypePromotionCandidates() (hq/lib/canon.mjs) was run against a seeded
synthetic workspace (bun .tmp/aii-probe-seeded.mjs, since removed) holding a
main-product source that points at a prototype (hq/lib/seed-product.mjs),
another main-product implementation (hq/lib/seed-impl.mjs), and three research
prototypes: one that ships its own implementation and is referenced by the
product (research/seed-promotable/README.md), one the product already implements
(research/seed-duplicated/README.md), and one with no implementation
(research/seed-nascent/README.md). Observed: 1 prototype is recommended for
promotion — the seeded promotable prototype, mature (own implementation) and
reachable (referenced by product source) and not duplicated. The duplicated
prototype is excluded because the product already implements it, and the nascent
prototype is excluded because it ships no implementation. Every signal is read
from binds_to anchors, which canon.mjs records only for paths that exist on
disk. Re-derived live at run time. Read-only probe over seeded synthetic files;
no credentials, no private session content.`,
  expected: [
    { what: 'Seeded promotable prototype', where: 'research/seed-promotable/README.md' },
    { what: '1 research prototype is recommended for promotion', where: 'hq/lib/canon.mjs' },
    { what: 'Seeded promotable prototype: mature, reachable, not duplicated', where: 'hq/lib/canon.mjs' },
    { what: 'duplicated prototype excluded: research/seed-duplicated/README.md -> hq/lib/seed-impl.mjs', where: 'hq/lib/canon.mjs' },
    { what: 'nascent prototype excluded: research/seed-nascent/README.md', where: 'hq/lib/canon.mjs' },
  ],
  run: async () => {
    const root = mkdtempSync(join(tmpdir(), 'hq038-fixture-'));
    try {
      buildWorkspace(root);
      const candidates = prototypePromotionCandidates(root);
      const findings = [];
      for (const candidate of candidates) {
        findings.push(finding(candidate.design, candidate.where));
      }
      const promoted = candidates.filter((c) => c.recommendPromotion);
      findings.push(finding(
        `${promoted.length} research prototype is recommended for promotion`,
        'hq/lib/canon.mjs',
      ));
      for (const candidate of promoted) {
        findings.push(finding(
          `${candidate.design}: ${candidate.maturity}, ${candidate.reachable ? 'reachable' : 'not reachable'}, ${candidate.duplicated ? 'duplicated' : 'not duplicated'}`,
          'hq/lib/canon.mjs',
        ));
      }
      // A prototype the product already implements must not be promoted again.
      const dup = candidates.find((c) => c.where === 'research/seed-duplicated/README.md');
      if (dup && !dup.recommendPromotion) {
        findings.push(finding(
          `duplicated prototype excluded: ${dup.where} -> ${dup.duplicated}`,
          'hq/lib/canon.mjs',
        ));
      }
      // A prototype with no implementation at all is not promotable.
      const nascent = candidates.find((c) => c.where === 'research/seed-nascent/README.md');
      if (nascent && !nascent.recommendPromotion) {
        findings.push(finding(`nascent prototype excluded: ${nascent.where}`, 'hq/lib/canon.mjs'));
      }
      return findings;
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  },
});
