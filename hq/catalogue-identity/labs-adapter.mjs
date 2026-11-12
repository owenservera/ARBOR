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
