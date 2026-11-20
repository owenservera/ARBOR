# File: hq/test/nomenclature.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/nomenclature.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2543 B |
| Lines | 64 |
| Hash | 51fc4500f83e |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| md | const | 41 | no | const md = glossaryMarkdown(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| ../lib/nomenclature.mjs | import | 4 | [hq/lib/nomenclature.mjs](../lib/nomenclature.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/test/nomenclature.test.mjs — VIVIM taxonomy bridge invariants.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  VIVIM_TAXONOMY, userTerm, engineeringTerm, memoryTierLabel, annotationLabel,
  sitrepHeading, apertureHeading, glossaryMarkdown, authorityNotice,
} from '../lib/nomenclature.mjs';

test('user terms match the VIVIM concept glossary', () => {
  assert.equal(userTerm('world'), 'My World');
  assert.equal(userTerm('space'), 'Space');
  assert.equal(userTerm('personalAgent'), 'My Agent');
  assert.equal(userTerm('fleet'), 'My AI Team');
  assert.equal(userTerm('swarm'), 'Team Session');
  assert.equal(userTerm('sitrep'), 'Progress Report');
  assert.equal(userTerm('evidence'), 'Activity Record');
  assert.equal(userTerm('aperture'), 'Discover');
  assert.equal(userTerm('forge'), 'Build');
});

test('memory tiers are Recent / Saved Knowledge / Core Memory', () => {
  assert.equal(memoryTierLabel('now'), 'Recent');
  assert.equal(memoryTierLabel('later'), 'Saved Knowledge');
  assert.equal(memoryTierLabel('canon'), 'Core Memory');
});

test('annotation labels are owner-readable', () => {
  assert.equal(annotationLabel('why'), 'Why this exists');
  assert.equal(annotationLabel('invariant'), 'Invariant');
  assert.equal(annotationLabel('todo'), 'Open task');
});

test('audience headings switch between owner and engineering language', () => {
  assert.equal(sitrepHeading('owner'), 'Progress Report');
  assert.equal(sitrepHeading('agent'), 'SITREP');
  assert.equal(apertureHeading('owner'), 'Discover');
  assert.equal(apertureHeading('agent'), 'Aperture bundle');
});

test('glossary includes terms, tiers and invariants', () => {
  const md = glossaryMarkdown();
  assert.match(md, /My World/);
  assert.match(md, /Saved Knowledge/);
  assert.match(md, /Memory is not authority/);
  assert.match(md, /Capability is not authorization/);
  assert.match(md, /Evidence is not inference/);
});

test('the taxonomy carries every VIVIM invariant', () => {
  assert.deepEqual(VIVIM_TAXONOMY.invariants, [
    'Memory is not authority.',
    'Capability is not authorization.',
    'Evidence is not inference.',
    'One effect owner.',
    'No silent sends.',
    'Journal before effect.',
    'Owner confirmation for Core Memory.',
  ]);
});

test('engineering terms never claim authority', () => {
  assert.match(authorityNotice(), /read-only/i);
  assert.match(engineeringTerm('genome'), /references only/i);
});
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
