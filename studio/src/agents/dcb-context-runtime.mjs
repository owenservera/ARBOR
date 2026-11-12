// Lane A Host integration facade: one entry point over existing VIVIM components.
// No independent process, server, schedule, browser driver, memory authority or
// provider sender. The Host must invoke these methods inside trusted workflows.
import { createDcbDefinitionStore } from './dcb-definition-store.mjs';
import { createDcbV2Planner } from '../../../harness/src/context/dcb-v2-planner.mjs';
import { createDcbDispatchGate } from '../../../harness/src/context/dcb-dispatch-gate.mjs';
import {
  createDcbMaintenanceState,reduceDcbMaintenance,
  recoverDcbMaintenance,pendingDcbMaintenance,
} from '../../../harness/src/context/dcb-maintenance.mjs';
import { planDcbInvalidations } from '../../../harness/src/context/dcb-invalidation.mjs';
import { planDcbObservationIntegration } from '../../../harness/src/context/dcb-observation-intake.mjs';
import { projectDcbGraphLineage } from '../../../harness/src/context/dcb-graph-lineage.mjs';

export const DCB_HOST_FACADE_SCHEMA='vivim.dcb-host-facade/1';
const fail=(code,message)=>Object.assign(new Error(message),{code});

// Never expose this facade directly over an unauthenticated HTTP endpoint.
// Each callback MUST be backed by the existing Host's current authenticated
// source/target/authorization evidence, not by caller-supplied boolean flags.
export function createDcbHostContextRuntime({
  paths,ownerRef,definitionStore=null,sourceAdapters,
  verifyTarget,authorizeSourceDisclosure,
  flavorPolicies,clock=()=>new Date().toISOString(),
}={}) {
  if(typeof verifyTarget!=='function'||typeof authorizeSourceDisclosure!=='function')
    throw fail('DCB_HOST_AUTH','Host-owned exact-target and disclosure validators required');
  if(!sourceAdapters||typeof sourceAdapters.resolveSources!=='function'
    ||typeof sourceAdapters.readSource!=='function')
    throw fail('DCB_HOST_SOURCES','Canonical source adapters required');
  const definitions=definitionStore??createDcbDefinitionStore({paths,ownerRef,clock});
  const planner=createDcbV2Planner({definitionStore:definitions,sourceAdapters,flavorPolicies});
  const gate=createDcbDispatchGate({planner,verifyTarget,authorizeSourceDisclosure});
  const at=()=>clock();
  function newMaintenanceState(now=at()) {
    return createDcbMaintenanceState({at:now});
  }
  function applyHostEvent(state,event) {
    // The event's authenticity, monotonic source journal and durable CAS write
    // are the Host caller's responsibility. Reducer validates sequence/replay.
    return reduceDcbMaintenance(state,event,{definitionStore:definitions});
  }
  function recoverLocalMaintenance(state,now=at()) {
    return recoverDcbMaintenance(state,{at:now});
  }
  function pendingLocalMaintenance(state,options) {
    return pendingDcbMaintenance(state,options);
  }
  function previewInvalidations(change) {
    return planDcbInvalidations({definitionStore:definitions,...change,at:change?.at??at()});
  }
  return Object.freeze({
    schema:DCB_HOST_FACADE_SCHEMA,
    definitions,
    previewContext:options=>planner.plan(options),
    prepareJournalCandidate:options=>gate.prepare(options),
    revalidateBeforeEffect:(previous,options)=>gate.revalidate(previous,options),
    newMaintenanceState,applyHostEvent,recoverLocalMaintenance,pendingLocalMaintenance,
    previewInvalidations,
    // Host owns authenticating every observation receipt and committing the
    // resulting delta to its canonical World and event log.
    previewObservationDelta:options=>planDcbObservationIntegration(options),
    previewDependencyGraph: ({bundleId,at:observedAt=at()}={}) =>
      projectDcbGraphLineage({definitionStore:definitions,bundleId,ownerRef,at:observedAt}),
    // This facade intentionally has no provider send, replay or grant-creation method.
    isEffectOwner:false,
  });
}
