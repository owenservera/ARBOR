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
