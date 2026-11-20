# File: hq/aii/fixtures/HQ-037-labs-designs-implemented-elsewhere.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-037-labs-designs-implemented-elsewhere.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6057 B |
| Lines | 127 |
| Hash | b06f0c8f6cd3 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| IMPL_SOURCE | const | 26 | no | const IMPL_SOURCE = `// Seeded main-product implementation |
| SEED_IMPL | const | 27 | yes | export const SEED_IMPL = &#39;seeded&#39;; |
| LAB_IMPLEMENTED | const | 31 | no | const LAB_IMPLEMENTED = `# LAB#1 — Seeded dogfeed |
| LAB_UNIMPLEMENTED | const | 39 | no | const LAB_UNIMPLEMENTED = `# LAB#2 — Seeded unbuilt |
| RESEARCH_OWN_TREE | const | 45 | no | const RESEARCH_OWN_TREE = `# Seeded own-tree research design |
| RESEARCH_ELSEWHERE | const | 53 | no | const RESEARCH_ELSEWHERE = `# Seeded research design implemented elsewhere |
| buildWorkspace | function | 60 | no | function buildWorkspace(root) { |
| put | function | 61 | no | const put = (rel, text) =&gt; { |
| abs | const | 62 | no | const abs = join(root, rel); |
| root | const | 99 | no | const root = mkdtempSync(join(tmpdir(), &#39;hq037-fixture-&#39;)); |
| implemented | const | 102 | no | const implemented = labsDesignsImplementedElsewhere(root); |
| findings | const | 103 | no | const findings = []; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 19 | external |
| node:os | import | 20 | external |
| node:path | import | 21 | external |
| ../../lib/canon.mjs | import | 22 | [hq/lib/canon.mjs](../../lib/canon.mjs.md) |
| ./harness.mjs | import | 23 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 128 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
