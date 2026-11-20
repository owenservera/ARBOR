# File: harness/src/context/dcb-v2-planner.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/context/dcb-v2-planner.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7411 B |
| Lines | 123 |
| Hash | 91d5a720e5b9 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DCB_V2_PACKET_SCHEMA | const | 9 | yes | export const DCB_V2_PACKET_SCHEMA=&#39;vivim.dynamic-context-packet/2&#39;; |
| fail | function | 10 | no | const fail=(code,message)=&gt;Object.assign(new Error(message),{code}); |
| hash | function | 11 | no | const hash=s=&gt;createHash(&#39;sha256&#39;).update(s).digest(&#39;hex&#39;); |
| stable | function | 12 | no | const stable=x=&gt;Array.isArray(x)?x.map(stable):x&amp;&amp;typeof x===&#39;object&#39; |
| digest | function | 14 | no | const digest=x=&gt;hash(JSON.stringify(stable(x))); |
| createDcbV2Planner | function | 16 | yes | export function createDcbV2Planner({ definitionStore, sourceAdapters, flavorPolicies=INITIAL_FLAVOR_POLICIES }={}) { |
| plan | function | 21 | no | async function plan({ bundleId, taskRef, taskText=&#39;&#39;, audience, scope, disclosure, profile=&#39;continuum&#39;, purpose=&#39;personal_continuum&#39;, maxInputTokens=1800, reservedForUserPrompt=400, reservedForOutput… |
| resolution | const | 38 | no | const resolution=definitionStore.resolve(bundleId,{at:now}); |
| flavors | const | 39 | no | const flavors=composeDcbFlavors({selected:resolution.flavorRefs,policies:flavorPolicies}); |
| permitted | const | 47 | no | const permitted=new Set(scope.allowedRefs); |
| absent | const | 48 | no | const absent=resolution.sourceRefs.filter(x=&gt;!permitted.has(x)); |
| selection | variable | 53 | no | let selection=null; |
| resolveSources | function | 54 | no | const resolveSources=async params=&gt;{ |
| candidates | const | 55 | no | const candidates=await sourceAdapters.resolveSources({...params,principalRef:audience.principalRef}); |
| required | variable | 57 | no | let required; |
| byRef | const | 70 | no | const byRef=new Map(); |
| composer | const | 78 | no | const composer=createDCBComposer({ resolveSources,readSource:sourceAdapters.readSource, }); |
| bundled | const | 81 | no | const bundled=await composer.compose({ taskRef,taskText,audience,scope,disclosure,profile,purpose, maxInputTokens,reservedForUserPrompt,reservedForOutput,sourceHead, policyVersion:deliveryPolicyVersi… |
| current | const | 89 | no | const current=definitionStore.resolve(bundleId,{at:now}); |
| ancestry | function | 90 | no | const ancestry=x=&gt;digest({ sourceRefs:x.sourceRefs,flavorRefs:x.flavorRefs,dependencies:x.dependencies, }); |
| included | const | 95 | no | const included=new Set(bundled.manifest.sources.map(s=&gt;s.ref)); |
| mandatory | const | 96 | no | const mandatory=selection?.mandatoryRefs??resolution.sourceRefs; |
| omitted | const | 97 | no | const omitted=mandatory.filter(ref=&gt;!included.has(ref)); |
| complete | const | 98 | no | const complete=omitted.length===0; |
| packetInfo | const | 99 | no | const packetInfo={ |
| packetDigest | const | 113 | no | const packetDigest=digest(packetInfo); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 4 | external |
| ./dcb-composer.mjs | import | 5 | [harness/src/context/dcb-composer.mjs](./dcb-composer.mjs.md) |
| ./dcb-flavors.mjs | import | 6 | [harness/src/context/dcb-flavors.mjs](./dcb-flavors.mjs.md) |
| ./dcb-source-selection.mjs | import | 7 | [harness/src/context/dcb-source-selection.mjs](./dcb-source-selection.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/test/context/dcb-universal-activity.test.mjs](../../test/context/dcb-universal-activity.test.mjs.md) | ../../src/context/dcb-v2-planner.mjs |
| [harness/test/context/dcb-v2-planner.test.mjs](../../test/context/dcb-v2-planner.test.mjs.md) | ../../src/context/dcb-v2-planner.mjs |
| [studio/src/agents/dcb-context-runtime.mjs](../../../studio/src/agents/dcb-context-runtime.mjs.md) | ../../../harness/src/context/dcb-v2-planner.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 124 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
