// DCB v2 read-only adapter for the existing DCB v1 materializer.
// Every request is composed fresh: NEVER assume prior provider delivery implies memory.
// No browser control, provider APIs, grant creation, journal writes or auto-sending.
import { createHash } from 'node:crypto';
import { createDCBComposer } from './dcb-composer.mjs';
import { composeDcbFlavors, INITIAL_FLAVOR_POLICIES } from './dcb-flavors.mjs';
import { selectDcbSources } from './dcb-source-selection.mjs';

export const DCB_V2_PACKET_SCHEMA='vivim.dynamic-context-packet/2';
const fail=(code,message)=>Object.assign(new Error(message),{code});
const hash=s=>createHash('sha256').update(s).digest('hex');
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'
  ?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const digest=x=>hash(JSON.stringify(stable(x)));

export function createDcbV2Planner({ definitionStore, sourceAdapters,
  flavorPolicies=INITIAL_FLAVOR_POLICIES }={}) {
  if(typeof definitionStore?.resolve!=='function'||typeof sourceAdapters?.resolveSources!=='function'
    ||typeof sourceAdapters?.readSource!=='function')
    throw fail('DCB_V2_DEPENDENCY','Existing definition store and source adapters required');
  async function plan({ bundleId, taskRef, taskText='', audience, scope, disclosure,
    profile='continuum', purpose='personal_continuum', maxInputTokens=1800,
    reservedForUserPrompt=400, reservedForOutput=500, sourceHead=null,
    now, deliveryPolicyVersion='v2', adaptiveSelection=null }={}) {
    if(typeof now!=='string'||!Number.isFinite(Date.parse(now))
      ||new Date(now).toISOString()!==now) throw fail('DCB_V2_TIME','Pinned timestamp required');
    if(typeof taskText!=='string'||taskText.length>10000) throw fail('DCB_V2_TASK','Invalid task text');
    if(!audience||typeof audience.principalRef!=='string'||!audience.principalRef
      ||typeof audience.destinationProvider!=='string'||!audience.destinationProvider)
      throw fail('DCB_V2_AUDIENCE','Exact destination and owner required');
    // Either a real project or a non-project activity may own context.
    // The composer validates the exact audience; never fabricate a project.
    if(!(typeof audience.projectRef==='string'&&audience.projectRef)
      && !(typeof audience.activityRef==='string'&&audience.activityRef))
      throw fail('DCB_V2_AUDIENCE','Project or activity scope required');
    if(!scope||!Array.isArray(scope.allowedRefs)||!Array.isArray(scope.allowedPrefixes))
      throw fail('DCB_V2_SCOPE','Host-approved source scope required');
    const resolution=definitionStore.resolve(bundleId,{at:now});
    const flavors=composeDcbFlavors({selected:resolution.flavorRefs,policies:flavorPolicies});
    // Full mode is backward compatible: every declared source is mandatory.
    // Adaptive mode is explicitly Host-selected: only mandatory refs are
    // required; other sources compete for bounded relevance/budget.
    if(adaptiveSelection!==null && (!adaptiveSelection || typeof adaptiveSelection!=='object'
      || Array.isArray(adaptiveSelection) || !Array.isArray(adaptiveSelection.mandatorySourceRefs)
      || !Number.isSafeInteger(adaptiveSelection.maxSources)))
      throw fail('DCB_V2_SELECTION','Invalid adaptive selection contract');
    const permitted=new Set(scope.allowedRefs);
    const absent=resolution.sourceRefs.filter(x=>!permitted.has(x));
    if(adaptiveSelection===null && absent.length)
      throw fail('DCB_V2_SCOPE','Requested DCB sources lack exact Host scope');
    if(adaptiveSelection && adaptiveSelection.mandatorySourceRefs.some(x=>!permitted.has(x)))
      throw fail('DCB_V2_SCOPE','Mandatory DCB sources lack exact Host scope');
    let selection=null;
    const resolveSources=async params=>{
      const candidates=await sourceAdapters.resolveSources({...params,principalRef:audience.principalRef});
      if(!Array.isArray(candidates)) throw fail('DCB_V2_SOURCES','Resolver returned invalid candidates');
      let required;
      if(adaptiveSelection){
        selection=selectDcbSources({
          bundleSourceRefs:resolution.sourceRefs.filter(x=>permitted.has(x)),
          sourceCandidates:candidates.filter(x=>permitted.has(x?.ref)),
          taskText,mandatorySourceRefs:adaptiveSelection.mandatorySourceRefs,
          maxSources:adaptiveSelection.maxSources,
          flavorComposition:flavors,now,
        });
        required=new Set(selection.selectedRefs);
      } else {
        required=new Set(resolution.sourceRefs);
      }
      const byRef=new Map();
      for(const c of candidates) if(required.has(c?.ref)) {
        if(byRef.has(c.ref)) throw fail('DCB_V2_SOURCES','Ambiguous canonical source reference');
        byRef.set(c.ref,c);
      }
      if(byRef.size!==required.size) throw fail('DCB_V2_MISSING','Requested context source unavailable');
      return [...byRef.values()];
    };
    const composer=createDCBComposer({
      resolveSources,readSource:sourceAdapters.readSource,
    });
    const bundled=await composer.compose({
      taskRef,taskText,audience,scope,disclosure,profile,purpose,
      maxInputTokens,reservedForUserPrompt,reservedForOutput,sourceHead,
      policyVersion:deliveryPolicyVersion,now,
    });
    // A definition can change during asynchronous source reads. Refuse a
    // packet that was built from an obsolete ancestry, even on the first send.
    // The Host still owns independent source-byte and disclosure freshness.
    const current=definitionStore.resolve(bundleId,{at:now});
    const ancestry=x=>digest({
      sourceRefs:x.sourceRefs,flavorRefs:x.flavorRefs,dependencies:x.dependencies,
    });
    if(ancestry(current)!==ancestry(resolution))
      throw fail('DCB_V2_DEFINITION_DRIFT','DCB ancestry changed during materialization');
    const included=new Set(bundled.manifest.sources.map(s=>s.ref));
    const mandatory=selection?.mandatoryRefs??resolution.sourceRefs;
    const omitted=mandatory.filter(ref=>!included.has(ref));
    const complete=omitted.length===0;
    const packetInfo={
      schema:DCB_V2_PACKET_SCHEMA,
      bundleId,definitionRevisions:resolution.dependencies,
      selectedFlavors:flavors.selected,flavorVersions:flavors.versions,
      flavorCompositionDigest:digest(flavors),
      taskRef,taskTextDigest:hash(taskText),destinationProvider:audience.destinationProvider,
      providerModelVerified:audience.destinationModelVerified===true,
      materializedManifestDigest:bundled.manifest.manifestDigest,
      omittedRequiredRefs:omitted,
      sourceSelectionMode:selection?'adaptive':'full',
      sourceSelectionDigest:selection?digest(selection):null,
      optionalSourcesOmitted:selection?selection.omissions.length+
        selection.selectedRefs.filter(ref=>!included.has(ref)&&!mandatory.includes(ref)).length:0,
    };
    const packetDigest=digest(packetInfo);
    return Object.freeze({
      ...packetInfo,packetDigest,
      manifest:bundled.manifest,fragment:bundled.fragment,preview:bundled.preview,
      complete,transferable:complete&&bundled.transferable,
      // This planning object never authorizes or performs a Host effect.
      authority:'read_only_projection',isSendAuthorized:false,
    });
  }
  return Object.freeze({schema:DCB_V2_PACKET_SCHEMA,plan});
}
