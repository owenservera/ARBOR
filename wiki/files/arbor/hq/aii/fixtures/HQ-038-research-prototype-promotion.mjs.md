# File: hq/aii/fixtures/HQ-038-research-prototype-promotion.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-038-research-prototype-promotion.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6746 B |
| Lines | 134 |
| Hash | 6dc5969c4f6a |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PRODUCT_SOURCE | const | 29 | no | const PRODUCT_SOURCE = `// Seeded main-product source |
| SEED_PRODUCT | const | 31 | yes | export const SEED_PRODUCT = &#39;seeded&#39;; |
| PROMOTABLE | const | 36 | no | const PROMOTABLE = `# Seeded promotable prototype |
| DUPLICATED | const | 44 | no | const DUPLICATED = `# Seeded duplicated prototype |
| NASCENT | const | 52 | no | const NASCENT = `# Seeded nascent prototype |
| buildWorkspace | function | 57 | no | function buildWorkspace(root) { |
| put | function | 58 | no | const put = (rel, text) =&gt; { |
| abs | const | 59 | no | const abs = join(root, rel); |
| root | const | 97 | no | const root = mkdtempSync(join(tmpdir(), &#39;hq038-fixture-&#39;)); |
| candidates | const | 100 | no | const candidates = prototypePromotionCandidates(root); |
| findings | const | 101 | no | const findings = []; |
| promoted | const | 105 | no | const promoted = candidates.filter((c) =&gt; c.recommendPromotion); |
| dup | const | 117 | no | const dup = candidates.find((c) =&gt; c.where === &#39;research/seed-duplicated/README.md&#39;); |
| nascent | const | 125 | no | const nascent = candidates.find((c) =&gt; c.where === &#39;research/seed-nascent/README.md&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 21 | external |
| node:os | import | 22 | external |
| node:path | import | 23 | external |
| ../../lib/canon.mjs | import | 24 | [hq/lib/canon.mjs](../../lib/canon.mjs.md) |
| ./harness.mjs | import | 25 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 27 | see | — | — | annotation makes the product&#39;s |
| 30 | see | — | research/seed-promotable/README.md | research/seed-promotable/README.md |

## Excerpt

```javascript
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
```

_First 80 of 135 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
