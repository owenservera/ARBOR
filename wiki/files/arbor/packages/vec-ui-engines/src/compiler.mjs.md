# File: packages/vec-ui-engines/src/compiler.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/vec-ui-engines/src/compiler.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2201 B |
| Lines | 33 |
| Hash | 5f535662fb52 |
| Test | no |
| Generated | no |
| Component | vec-ui-engines |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| UI_CONFIG_PROPOSAL_SCHEMA | const | 4 | yes | export const UI_CONFIG_PROPOSAL_SCHEMA=&#39;vivim.ui-config-proposal/1&#39;; |
| TARGET_ID | const | 5 | no | const TARGET_ID=/^[A-Za-z][A-Za-z0-9._:-]{0,95}$/; |
| MAX_SETTINGS | const | 6 | no | const MAX_SETTINGS=48; |
| compileUiConfiguration | function | 7 | yes | export function compileUiConfiguration({component,sourceSchema,baseRevision,changes}={}){ |
| reject | function | 8 | no | const reject=(code,detail)=&gt;({schema:UI_CONFIG_PROPOSAL_SCHEMA,outcome:&#39;refused&#39;,code, ...(detail?{detail}:{}),authorized:false,applied:false,persisted:false}); |
| seen | const | 14 | no | const seen=new Set(),edits=[]; |
| capability | const | 20 | no | const capability=getEngineCapability(item.capabilityId); |
| applicable | const | 22 | no | const applicable=inspectUiEngineApplicability({component,engineId:capability.id,sourceSchema}); |
| checked | const | 24 | no | const checked=validateEngineSetting(item); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./registry.mjs | import | 2 | [packages/vec-ui-engines/src/registry.mjs](./registry.mjs.md) |
| ./validators.mjs | import | 3 | [packages/vec-ui-engines/src/validators.mjs](./validators.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/vec-ui-engines/src/index.mjs](./index.mjs.md) | ./compiler.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Semantic UI style and behavior configuration compiler. No renderer writes.
import {getEngineCapability,inspectUiEngineApplicability,validateEngineSetting} from './registry.mjs';
import {plain,inertData} from './validators.mjs';
export const UI_CONFIG_PROPOSAL_SCHEMA='vivim.ui-config-proposal/1';
const TARGET_ID=/^[A-Za-z][A-Za-z0-9._:-]{0,95}$/;
const MAX_SETTINGS=48;
export function compileUiConfiguration({component,sourceSchema,baseRevision,changes}={}){
  const reject=(code,detail)=>({schema:UI_CONFIG_PROPOSAL_SCHEMA,outcome:'refused',code,
    ...(detail?{detail}:{}),authorized:false,applied:false,persisted:false});
  if(!plain(component)||typeof component.id!=='string'||!TARGET_ID.test(component.id)||
    !Number.isSafeInteger(baseRevision)||baseRevision<0||
    !Array.isArray(changes)||changes.length===0||changes.length>MAX_SETTINGS||
    !inertData(changes,2048))return reject('INVALID_CONFIG_REQUEST');
  const seen=new Set(),edits=[];
  for(const item of changes){
    if(!plain(item)||Object.keys(item).some(k=>!['capabilityId','value'].includes(k)))
      return reject('INVALID_CHANGE');
    if(typeof item.capabilityId!=='string'||seen.has(item.capabilityId))return reject('DUPLICATE_OR_INVALID_CAPABILITY');
    seen.add(item.capabilityId);
    const capability=getEngineCapability(item.capabilityId);
    if(!capability)return reject('UNKNOWN_CAPABILITY');
    const applicable=inspectUiEngineApplicability({component,engineId:capability.id,sourceSchema});
    if(!applicable.applicable)return reject('SEMANTICALLY_INAPPLICABLE',capability.id);
    const checked=validateEngineSetting(item);
    if(checked.outcome!=='valid')return reject(checked.code,capability.id);
    edits.push({engineId:capability.engineId,capabilityId:capability.id,value:checked.value,
      semanticTarget:component.id,kind:'typed-config'});
  }
  return {schema:UI_CONFIG_PROPOSAL_SCHEMA,outcome:'candidate',componentId:component.id,
    baseRevision,sourceSchema:sourceSchema??null,changes:edits,
    authorization:'required-from-Host',authorized:false,applied:false,persisted:false,
    rendererStatus:'NO_ADAPTER_INSTALLED',effect:'none',schemaVersion:1};
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
