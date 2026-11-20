# File: hq/catalogue-identity/labs-adapter.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/catalogue-identity/labs-adapter.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1426 B |
| Lines | 29 |
| Hash | 85c0d2000e9a |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| labsSeedInput | function | 13 | yes | export function labsSeedInput({capabilities, labsSha, asOf, previous=null}) { |
| exportLabsSeed | function | 29 | yes | export const exportLabsSeed = args =&gt; buildCrosswalk(labsSeedInput(args)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./crosswalk.mjs | import | 7 | [hq/catalogue-identity/crosswalk.mjs](./crosswalk.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/catalogue-identity/cli.mjs](./cli.mjs.md) | ./labs-adapter.mjs |
| [hq/catalogue-identity/source-adapters.mjs](./source-adapters.mjs.md) | ./labs-adapter.mjs |
| [hq/catalogue-identity/test/crosswalk.test.mjs](./test/crosswalk.test.mjs.md) | ../labs-adapter.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Read-only adapter for Labs seed and Lane A source catalogue. |
| 3 | owner | repos-hq | — | repos-hq |
| 4 | task | — | — | VIVIM-WAVE-C4-LANE-B |
| 5 | invariant | — | — | Labs source IDs are evidence, not production certificates. |

## Excerpt

```javascript
// @ts-check
/** @hq:context Read-only adapter for Labs seed and Lane A source catalogue.
 * @hq:owner repos-hq
 * @hq:task VIVIM-WAVE-C4-LANE-B
 * @hq:invariant Labs source IDs are evidence, not production certificates.
 */
import { buildCrosswalk } from './crosswalk.mjs';

/** Import Labs capability records without altering their source authority.
 * A capability's source_refs are kept as evidence claims only; no file existence
 * or runtime consumer is inferred. Other lane adapters add their own rows later.
 */
export function labsSeedInput({capabilities, labsSha, asOf, previous=null}) {
  if (!Array.isArray(capabilities)) throw new Error('invalid_labs_capabilities');
  return {
    as_of: asOf,
    sources:[{id:'labs:capabilities',repository:'owenservera/vivim-labs',revision:labsSha,
      completeness:'partial',authority:'labs_seed_observation',lifecycle:'active'}],
    records: capabilities.map(cap=>({
      source_id:'labs:capabilities',source_item_id:cap.capability_id,
      type:'capability',name:cap.name,canonical_id:cap.capability_id,
      authority_claim:'labs_seed_observation',lifecycle:'active',
      evidence:[{kind:'source_record',ref:`owenservera/vivim-labs@${labsSha}:capability-observatory/data/capabilities.json#${cap.capability_id}`}],
      links:[],
    })),
    previous,
  };
}
export const exportLabsSeed = args => buildCrosswalk(labsSeedInput(args));
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
