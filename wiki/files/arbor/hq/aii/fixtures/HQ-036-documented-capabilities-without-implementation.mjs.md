# File: hq/aii/fixtures/HQ-036-documented-capabilities-without-implementation.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-036-documented-capabilities-without-implementation.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6873 B |
| Lines | 135 |
| Hash | c6290221b599 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| IMPL_SOURCE | const | 32 | no | const IMPL_SOURCE = `// Seeded implementation module |
| SEED_CAPABILITY | const | 34 | yes | export const SEED_CAPABILITY = &#39;seeded&#39;; |
| seedImplement | function | 35 | yes | export function seedImplement() { return SEED_CAPABILITY; } |
| IMPLEMENTED_DOC | const | 39 | no | const IMPLEMENTED_DOC = `# Seeded capability that is implemented |
| UNIMPLEMENTED_DOC | const | 47 | no | const UNIMPLEMENTED_DOC = `# Seeded capability with no implementation |
| CANON_TERMS | const | 53 | no | const CANON_TERMS = `# Seeded canon terms |
| DECISIONS_DOC | const | 59 | no | const DECISIONS_DOC = `# Seeded decisions |
| buildWorkspace | function | 66 | no | function buildWorkspace(root) { |
| put | function | 67 | no | const put = (rel, text) =&gt; { |
| abs | const | 68 | no | const abs = join(root, rel); |
| root | const | 107 | no | const root = mkdtempSync(join(tmpdir(), &#39;hq036-fixture-&#39;)); |
| unimplemented | const | 110 | no | const unimplemented = documentedCapabilitiesWithoutImplementation(root); |
| findings | const | 111 | no | const findings = []; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 23 | external |
| node:os | import | 24 | external |
| node:path | import | 25 | external |
| ../../lib/canon.mjs | import | 26 | [hq/lib/canon.mjs](../../lib/canon.mjs.md) |
| ./harness.mjs | import | 27 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 29 | invariant | — | — | annotation makes the canon term |
| 33 | invariant | — | — | seeded invariants are never violated |

## Excerpt

```javascript
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
```

_First 80 of 136 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
