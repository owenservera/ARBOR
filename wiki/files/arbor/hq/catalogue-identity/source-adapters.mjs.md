# File: hq/catalogue-identity/source-adapters.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/catalogue-identity/source-adapters.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4023 B |
| Lines | 68 |
| Hash | 5e6bf768e32f |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| LABS | const | 7 | no | const LABS=&#39;labs:capabilities&#39;,ATOMIC=&#39;harness:atomic&#39;,JOURNEY=&#39;harness:journey&#39;,ALGORITHMS=&#39;hq:algorithms&#39;,FILES=&#39;hq:inventory&#39;; |
| e | function | 8 | no | const e=(repo,sha,path,item)=&gt;[{kind:&#39;source_record&#39;,ref:`${repo}@${sha}:${path}#${item}`}]; |
| source | function | 9 | no | const source=(id,repository,revision,authority,lifecycle=&#39;active&#39;)=&gt;({id,repository,revision,completeness:&#39;partial&#39;,authority,lifecycle}); |
| adaptKnownCatalogues | function | 29 | yes | export function adaptKnownCatalogues({asOf,labs,labSha,atomic,harnessSha,journey, algorithms,inventory,hqSha,previous=null}) { |
| labRows | const | 33 | no | const labRows=labsSeedInput({capabilities:labs,labsSha:labSha,asOf}).records; |
| records | const | 35 | no | const records=[...labRows]; |
| h | const | 36 | no | const h=&#39;owenservera/vivim-web-harness&#39;,q=&#39;owenservera/repos-hq&#39;; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./labs-adapter.mjs | import | 6 | [hq/catalogue-identity/labs-adapter.mjs](./labs-adapter.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/catalogue-identity/cli.mjs](./cli.mjs.md) | ./source-adapters.mjs |
| [hq/catalogue-identity/test/crosswalk.test.mjs](./test/crosswalk.test.mjs.md) | ../source-adapters.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Pure source-owned catalogue adapters. No code-presence or production inference. |
| 3 | owner | repos-hq | — | repos-hq |
| 4 | task | — | — | VIVIM-WAVE-C4-LANE-B |

## Excerpt

```javascript
// @ts-check
/** @hq:context Pure source-owned catalogue adapters. No code-presence or production inference.
 * @hq:owner repos-hq
 * @hq:task VIVIM-WAVE-C4-LANE-B
 */
import { labsSeedInput } from './labs-adapter.mjs';
const LABS='labs:capabilities',ATOMIC='harness:atomic',JOURNEY='harness:journey',ALGORITHMS='hq:algorithms',FILES='hq:inventory';
const e=(repo,sha,path,item)=>[{kind:'source_record',ref:`${repo}@${sha}:${path}#${item}`}];
const source=(id,repository,revision,authority,lifecycle='active')=>({id,repository,revision,completeness:'partial',authority,lifecycle});
/**
 * @typedef {object} AdapterRecord
 * @property {string} source_id catalogue source the row belongs to
 * @property {string} source_item_id source-native id
 * @property {string} type crosswalk record type
 * @property {string} name source name
 * @property {string} [canonical_id] explicit canonical identity — present only when
 *   the source declares one (crosswalk policy: explicit_source_declared_only);
 *   tracker/algorithm/inventory rows legitimately carry none
 * @property {string} authority_claim
 * @property {string} lifecycle
 * @property {{kind: string, ref: string}[]} evidence
 * @property {{target_source_id: string, target_item_id: string, relation: string}[]} links
 */
/**
 * Convert the five verified catalogues (not their operational effects) to one
 * discovery batch. Other lanes may supply additional rows and links. Source
 * revisions must be repository *commit* SHAs; blob SHA remains evidence detail.
 */
export function adaptKnownCatalogues({asOf,labs,labSha,atomic,harnessSha,journey,
  algorithms,inventory,hqSha,previous=null}) {
  if (!Array.isArray(labs)||!Array.isArray(atomic?.items)||!Array.isArray(journey?.entries)||
      !Array.isArray(algorithms)||!Array.isArray(inventory)) throw new Error('missing_catalogue');
  const labRows=labsSeedInput({capabilities:labs,labsSha:labSha,asOf}).records;
  /** @type {AdapterRecord[]} */
  const records=[...labRows];
  const h='owenservera/vivim-web-harness',q='owenservera/repos-hq';
  for (const x of atomic.items) records.push({
    source_id:ATOMIC,source_item_id:x.id,type:'tracker',name:x.title,lifecycle:'active',
    authority_claim:'harness_atomic_registry_not_roadmap_status',
    evidence:e(h,harnessSha,'docs/capabilities/atomic-registry.json',x.id),
    links:[],
  });
  for (const x of journey.entries) records.push({
    source_id:JOURNEY,source_item_id:x.journeyId,type:'tracker',name:`Journey ${x.journeyId}: ${x.source}`,
    lifecycle:'active',authority_claim:'harness_journey_candidate_link_not_verified_behavior',
    evidence:e(h,harnessSha,'docs/capabilities/journey-capability-crosswalk.v1.json',x.journeyId),
    links:[...(x.atomicCandidateIds??[]),...(x.strongerSymbolCandidateIds??[])]
      .filter((id,i,a)=>a.indexOf(id)===i).map(id=>({target_source_id:ATOMIC,target_item_id:id,relation:'references'})),
  });
  for (const x of algorithms) records.push({
    source_id:ALGORITHMS,source_item_id:x.id,type:'algorithm',name:x.name,
    lifecycle:x.status?.startsWith('implemented')?'active':'research',
    authority_claim:'hq_algorithm_inventory_status_only',
    evidence:e(q,hqSha,'research/agentic-knowledge-graph/algorithms.json',x.id),links:[],
  });
  for (const x of inventory) records.push({
    source_id:FILES,source_item_id:x.id,type:'catalogue',
    name:`${x.repository}:${x.path}`,lifecycle:'historical',
    authority_claim:'hq_agentic_file_inventory_not_live_code',
    evidence:e(q,hqSha,'research/agentic-knowledge-graph/file-inventory.json',x.id),links:[],
  });
  return {as_of:asOf,sources:[
    source(LABS,'owenservera/vivim-labs',labSha,'labs_seed_observation'),
    source(ATOMIC,h,harnessSha,'harness_atomic_registry'),
    source(JOURNEY,h,harnessSha,'harness_journey_registry'),
    source(ALGORITHMS,q,hqSha,'hq_algorithm_inventory'),
    source(FILES,q,hqSha,'hq_historical_inventory','historical')],records,previous};
}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
