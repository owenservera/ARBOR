# File: studio/src/agents/dcb-context-runtime.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/agents/dcb-context-runtime.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3863 B |
| Lines | 68 |
| Hash | 2be5aa3600b9 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DCB_HOST_FACADE_SCHEMA | const | 15 | yes | export const DCB_HOST_FACADE_SCHEMA=&#39;vivim.dcb-host-facade/1&#39;; |
| fail | function | 16 | no | const fail=(code,message)=&gt;Object.assign(new Error(message),{code}); |
| createDcbHostContextRuntime | function | 21 | yes | export function createDcbHostContextRuntime({ paths,ownerRef,definitionStore=null,sourceAdapters, verifyTarget,authorizeSourceDisclosure, flavorPolicies,clock=()=&gt;new Date().toISOString(), }={}) { |
| definitions | const | 31 | no | const definitions=definitionStore??createDcbDefinitionStore({paths,ownerRef,clock}); |
| planner | const | 32 | no | const planner=createDcbV2Planner({definitionStore:definitions,sourceAdapters,flavorPolicies}); |
| gate | const | 33 | no | const gate=createDcbDispatchGate({planner,verifyTarget,authorizeSourceDisclosure}); |
| at | function | 34 | no | const at=()=&gt;clock(); |
| newMaintenanceState | function | 35 | no | function newMaintenanceState(now=at()) { |
| applyHostEvent | function | 38 | no | function applyHostEvent(state,event) { |
| recoverLocalMaintenance | function | 43 | no | function recoverLocalMaintenance(state,now=at()) { |
| pendingLocalMaintenance | function | 46 | no | function pendingLocalMaintenance(state,options) { |
| previewInvalidations | function | 49 | no | function previewInvalidations(change) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./dcb-definition-store.mjs | import | 4 | [studio/src/agents/dcb-definition-store.mjs](./dcb-definition-store.mjs.md) |
| ../../../harness/src/context/dcb-v2-planner.mjs | import | 5 | [harness/src/context/dcb-v2-planner.mjs](../../../harness/src/context/dcb-v2-planner.mjs.md) |
| ../../../harness/src/context/dcb-dispatch-gate.mjs | import | 6 | [harness/src/context/dcb-dispatch-gate.mjs](../../../harness/src/context/dcb-dispatch-gate.mjs.md) |
| ../../../harness/src/context/dcb-maintenance.mjs | import | 7 | [harness/src/context/dcb-maintenance.mjs](../../../harness/src/context/dcb-maintenance.mjs.md) |
| ../../../harness/src/context/dcb-invalidation.mjs | import | 11 | [harness/src/context/dcb-invalidation.mjs](../../../harness/src/context/dcb-invalidation.mjs.md) |
| ../../../harness/src/context/dcb-observation-intake.mjs | import | 12 | [harness/src/context/dcb-observation-intake.mjs](../../../harness/src/context/dcb-observation-intake.mjs.md) |
| ../../../harness/src/context/dcb-graph-lineage.mjs | import | 13 | [harness/src/context/dcb-graph-lineage.mjs](../../../harness/src/context/dcb-graph-lineage.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/capture/conversation-runtime.mjs](../capture/conversation-runtime.mjs.md) | ../agents/dcb-context-runtime.mjs |
| [studio/src/studio/conversation-api.mjs](../studio/conversation-api.mjs.md) | ../agents/dcb-context-runtime.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
