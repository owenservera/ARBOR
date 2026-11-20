# File: packages/vec-ui-engines/src/index.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/vec-ui-engines/src/index.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 616 B |
| Lines | 8 |
| Hash | 9a3b4c2ac207 |
| Test | no |
| Generated | no |
| Component | vec-ui-engines |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ENGINE_CAPABILITIES | export | 2 | yes | export {ENGINE_FAMILIES,ENGINE_CAPABILITIES,ENGINE_CATALOG_SCHEMA} |
| ENGINE_CATALOG_SCHEMA | export | 2 | yes | export {ENGINE_FAMILIES,ENGINE_CAPABILITIES,ENGINE_CATALOG_SCHEMA} |
| ENGINE_FAMILIES | export | 2 | yes | export {ENGINE_FAMILIES,ENGINE_CAPABILITIES,ENGINE_CATALOG_SCHEMA} |
| inertData | export | 6 | yes | export {validateUiValue,inertData} |
| validateUiValue | export | 6 | yes | export {validateUiValue,inertData} |
| UI_CONFIG_PROPOSAL_SCHEMA | export | 7 | yes | export {UI_CONFIG_PROPOSAL_SCHEMA,compileUiConfiguration} |
| compileUiConfiguration | export | 7 | yes | export {UI_CONFIG_PROPOSAL_SCHEMA,compileUiConfiguration} |
| TOKEN_PACKAGE_SCHEMA | export | 8 | yes | export {TOKEN_PACKAGE_SCHEMA,resolveUiTokenPackage,resolveUiTokenReference} |
| resolveUiTokenPackage | export | 8 | yes | export {TOKEN_PACKAGE_SCHEMA,resolveUiTokenPackage,resolveUiTokenReference} |
| resolveUiTokenReference | export | 8 | yes | export {TOKEN_PACKAGE_SCHEMA,resolveUiTokenPackage,resolveUiTokenReference} |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./catalog.mjs | export_from | 2 | [packages/vec-ui-engines/src/catalog.mjs](./catalog.mjs.md) |
| ./registry.mjs | export_from | 3 | [packages/vec-ui-engines/src/registry.mjs](./registry.mjs.md) |
| ./validators.mjs | export_from | 6 | [packages/vec-ui-engines/src/validators.mjs](./validators.mjs.md) |
| ./compiler.mjs | export_from | 7 | [packages/vec-ui-engines/src/compiler.mjs](./compiler.mjs.md) |
| ./tokens.mjs | export_from | 8 | [packages/vec-ui-engines/src/tokens.mjs](./tokens.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/vec-ui-engines/test/engine-core.test.mjs](../test/engine-core.test.mjs.md) | ../src/index.mjs |
| [packages/vec-ui-engines/test/manifest.test.mjs](../test/manifest.test.mjs.md) | ../src/index.mjs |
| [packages/vec-ui-engines/test/tokens.test.mjs](../test/tokens.test.mjs.md) | ../src/index.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Public contract-only surface. No browser, Host or rendering dependencies.
export {ENGINE_FAMILIES,ENGINE_CAPABILITIES,ENGINE_CATALOG_SCHEMA} from './catalog.mjs';
export {ENGINE_COUNTS,listEngineFamilies,listEngineCapabilities,getEngineFamily,
  getEngineCapability,inspectUiEngineApplicability,validateEngineSetting,
  inspectEngineExtension} from './registry.mjs';
export {validateUiValue,inertData} from './validators.mjs';
export {UI_CONFIG_PROPOSAL_SCHEMA,compileUiConfiguration} from './compiler.mjs';
export {TOKEN_PACKAGE_SCHEMA,resolveUiTokenPackage,resolveUiTokenReference} from './tokens.mjs';
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
