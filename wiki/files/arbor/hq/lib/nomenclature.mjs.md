# File: hq/lib/nomenclature.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/nomenclature.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4060 B |
| Lines | 125 |
| Hash | 3d77a54bc8e4 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| VIVIM_TAXONOMY | const | 4 | yes | export const VIVIM_TAXONOMY = Object.freeze({ version: 1, source: &#39;vivim-web-harness/docs/VIVIM-CONCEPT.md&#39;, userTerms: { world: &#39;My World&#39;, |
| userTerm | function | 76 | yes | export function userTerm(key) { |
| engineeringTerm | function | 80 | yes | export function engineeringTerm(key) { |
| memoryTierLabel | function | 84 | yes | export function memoryTierLabel(tier) { |
| annotationLabel | function | 88 | yes | export function annotationLabel(kind) { |
| sitrepHeading | function | 92 | yes | export function sitrepHeading(audience = &#39;owner&#39;) { |
| apertureHeading | function | 96 | yes | export function apertureHeading(audience = &#39;owner&#39;) { |
| glossaryMarkdown | function | 100 | yes | export function glossaryMarkdown() { |
| lines | const | 101 | no | const lines = [ |
| authorityNotice | function | 123 | yes | export function authorityNotice() { |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/nomenclature.mjs |
| [hq/lib/context.mjs](./context.mjs.md) | ./nomenclature.mjs |
| [hq/lib/home.mjs](./home.mjs.md) | ./nomenclature.mjs |
| [hq/lib/lake.mjs](./lake.mjs.md) | ./nomenclature.mjs |
| [hq/lib/memory.mjs](./memory.mjs.md) | ./nomenclature.mjs |
| [hq/lib/protocol.mjs](./protocol.mjs.md) | ./nomenclature.mjs |
| [hq/lib/vivim.mjs](./vivim.mjs.md) | ./nomenclature.mjs |
| [hq/lib/wiki.mjs](./wiki.mjs.md) | ./nomenclature.mjs |
| [hq/test/nomenclature.test.mjs](../test/nomenclature.test.mjs.md) | ../lib/nomenclature.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/nomenclature.mjs — VIVIM taxonomy bridge.
// User surfaces speak VIVIM. Engineering surfaces keep precise internal terms.
// Source of truth: vivim-web-harness/docs/VIVIM-CONCEPT.md (glossary + invariants).
export const VIVIM_TAXONOMY = Object.freeze({
  version: 1,
  source: 'vivim-web-harness/docs/VIVIM-CONCEPT.md',
  userTerms: {
    world: 'My World',
    space: 'Space',
    personalAgent: 'My Agent',
    fleet: 'My AI Team',
    swarm: 'Team Session',
    role: 'Specialty',
    genome: 'Agent DNA',
    memory: 'Memory',
    work: 'Task',
    sitrep: 'Progress Report',
    capability: 'Ability',
    authority: 'Permissions',
    evidence: 'Activity Record',
    aperture: 'Discover',
    forge: 'Build',
    host: 'VIVIM on my computer',
    studio: 'Advanced panel',
    bridge: 'Phone Connection',
    context: 'Context',
    index: 'Map',
  },
  engineeringTerms: {
    world: 'workspace registry + local index',
    space: 'registered project',
    personalAgent: 'owner-scoped agent surface',
    fleet: 'registered agent roster',
    swarm: 'parallel agent session',
    role: 'agent specialty',
    genome: 'agent manifest (references only, never credentials)',
    memory: 'notes table with tiers + provenance',
    work: 'task / handoff bundle',
    sitrep: 'brief',
    capability: 'CLI command or MCP tool',
    authority: 'scope + approval boundary',
    evidence: 'receipts ledger',
    aperture: 'context bundle',
    forge: 'wiki generation',
    host: 'local HQ runtime',
    studio: 'CLI',
    bridge: 'MCP / CLI transport',
  },
  memoryTiers: {
    now: 'Recent',
    later: 'Saved Knowledge',
    canon: 'Core Memory',
  },
  annotationLabels: {
    context: 'Purpose',
    why: 'Why this exists',
    invariant: 'Invariant',
    see: 'See also',
    todo: 'Open task',
    owner: 'Owner',
    task: 'Task link',
    risk: 'Risk',
    deprecated: 'Deprecated',
  },
  invariants: [
    'Memory is not authority.',
    'Capability is not authorization.',
    'Evidence is not inference.',
    'One effect owner.',
    'No silent sends.',
    'Journal before effect.',
    'Owner confirmation for Core Memory.',
  ],
});

export function userTerm(key) {
  return VIVIM_TAXONOMY.userTerms[key] || key;
}

export function engineeringTerm(key) {
```

_First 80 of 126 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
