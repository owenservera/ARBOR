# Module: arbor/vec-ui-engines

> Generated 2026-11-19 · 11 files · 135 symbols

## Files

| File | Language | Lines | Symbols |
| --- | --- | --- | --- |
| [packages/vec-ui-engines/package.json](../../files/arbor/packages/vec-ui-engines/package.json.md) | JSON | 18 | 0 |
| [packages/vec-ui-engines/src/catalog.mjs](../../files/arbor/packages/vec-ui-engines/src/catalog.mjs.md) | JavaScript | 12 | 4 |
| [packages/vec-ui-engines/src/compiler.mjs](../../files/arbor/packages/vec-ui-engines/src/compiler.mjs.md) | JavaScript | 33 | 9 |
| [packages/vec-ui-engines/src/enum-choices.mjs](../../files/arbor/packages/vec-ui-engines/src/enum-choices.mjs.md) | JavaScript | 4 | 2 |
| [packages/vec-ui-engines/src/index.mjs](../../files/arbor/packages/vec-ui-engines/src/index.mjs.md) | JavaScript | 8 | 10 |
| [packages/vec-ui-engines/src/registry.mjs](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | JavaScript | 88 | 28 |
| [packages/vec-ui-engines/src/tokens.mjs](../../files/arbor/packages/vec-ui-engines/src/tokens.mjs.md) | JavaScript | 65 | 21 |
| [packages/vec-ui-engines/src/validators.mjs](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | JavaScript | 132 | 28 |
| [packages/vec-ui-engines/test/engine-core.test.mjs](../../files/arbor/packages/vec-ui-engines/test/engine-core.test.mjs.md) | JavaScript | 143 | 14 |
| [packages/vec-ui-engines/test/manifest.test.mjs](../../files/arbor/packages/vec-ui-engines/test/manifest.test.mjs.md) | JavaScript | 63 | 11 |
| [packages/vec-ui-engines/test/tokens.test.mjs](../../files/arbor/packages/vec-ui-engines/test/tokens.test.mjs.md) | JavaScript | 39 | 8 |

## Symbols

| Symbol | Kind | Exported | Line |
| --- | --- | --- | --- |
| [ALIAS](../../files/arbor/packages/vec-ui-engines/src/tokens.mjs.md) | const | no | 7 |
| [BAD_KEYS](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | const | no | 8 |
| [DATA_FACETS](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | const | no | 31 |
| [ENGINE_CAPABILITIES](../../files/arbor/packages/vec-ui-engines/src/catalog.mjs.md) | const | yes | 12 |
| [ENGINE_CAPABILITIES](../../files/arbor/packages/vec-ui-engines/src/index.mjs.md) | export | yes | 2 |
| [ENGINE_CATALOG_SCHEMA](../../files/arbor/packages/vec-ui-engines/src/catalog.mjs.md) | const | yes | 5 |
| [ENGINE_CATALOG_SCHEMA](../../files/arbor/packages/vec-ui-engines/src/index.mjs.md) | export | yes | 2 |
| [ENGINE_CATALOG_SCHEMA](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | export | yes | 88 |
| [ENGINE_COUNTS](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | const | yes | 16 |
| [ENGINE_ENUM_CHOICES](../../files/arbor/packages/vec-ui-engines/src/enum-choices.mjs.md) | const | yes | 4 |
| [ENGINE_FAMILIES](../../files/arbor/packages/vec-ui-engines/src/catalog.mjs.md) | const | yes | 11 |
| [ENGINE_FAMILIES](../../files/arbor/packages/vec-ui-engines/src/index.mjs.md) | export | yes | 2 |
| [ENGINE_ID_SCHEMA](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | const | yes | 5 |
| [ID](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | const | no | 6 |
| [INPUT_FACETS](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | const | no | 30 |
| [LAYOUT_FACETS](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | const | no | 33 |
| [MAX_SETTINGS](../../files/arbor/packages/vec-ui-engines/src/compiler.mjs.md) | const | no | 6 |
| [RAW_ENUM_CHOICES](../../files/arbor/packages/vec-ui-engines/src/enum-choices.mjs.md) | const | no | 3 |
| [REF](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | const | no | 7 |
| [TARGET_ID](../../files/arbor/packages/vec-ui-engines/src/compiler.mjs.md) | const | no | 5 |
| [TEXT_FACETS](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | const | no | 32 |
| [TOKEN_NAME](../../files/arbor/packages/vec-ui-engines/src/tokens.mjs.md) | const | no | 6 |
| [TOKEN_PACKAGE_SCHEMA](../../files/arbor/packages/vec-ui-engines/src/index.mjs.md) | export | yes | 8 |
| [TOKEN_PACKAGE_SCHEMA](../../files/arbor/packages/vec-ui-engines/src/tokens.mjs.md) | const | yes | 5 |
| [TYPE_MAP](../../files/arbor/packages/vec-ui-engines/src/tokens.mjs.md) | const | no | 8 |
| [TYPE_SET](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | const | no | 4 |
| [UI_CONFIG_PROPOSAL_SCHEMA](../../files/arbor/packages/vec-ui-engines/src/compiler.mjs.md) | const | yes | 4 |
| [UI_CONFIG_PROPOSAL_SCHEMA](../../files/arbor/packages/vec-ui-engines/src/index.mjs.md) | export | yes | 7 |
| [VALUE_SCHEMA](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | const | yes | 3 |
| [allowed](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | const | no | 74 |
| [applicable](../../files/arbor/packages/vec-ui-engines/src/compiler.mjs.md) | const | no | 22 |
| [applicable](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | variable | no | 48 |
| [before](../../files/arbor/packages/vec-ui-engines/test/engine-core.test.mjs.md) | const | no | 88 |
| [bounded](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | function | no | 39 |
| [c](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | const | no | 68 |
| [c](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | const | no | 104 |
| [c](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | const | no | 112 |
| [c](../../files/arbor/packages/vec-ui-engines/test/engine-core.test.mjs.md) | const | no | 35 |
| [c](../../files/arbor/packages/vec-ui-engines/test/engine-core.test.mjs.md) | const | no | 132 |
| [c](../../files/arbor/packages/vec-ui-engines/test/manifest.test.mjs.md) | const | no | 9 |
| [c](../../files/arbor/packages/vec-ui-engines/test/manifest.test.mjs.md) | const | no | 33 |
| [capability](../../files/arbor/packages/vec-ui-engines/src/compiler.mjs.md) | const | no | 20 |
| [capability](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | const | no | 40 |
| [capability](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | const | no | 62 |
| [card](../../files/arbor/packages/vec-ui-engines/test/engine-core.test.mjs.md) | function | no | 12 |
| [cardKind](../../files/arbor/packages/vec-ui-engines/test/engine-core.test.mjs.md) | const | no | 11 |
| [checked](../../files/arbor/packages/vec-ui-engines/src/compiler.mjs.md) | const | no | 24 |
| [collect](../../files/arbor/packages/vec-ui-engines/src/tokens.mjs.md) | function | no | 19 |
| [compileUiConfiguration](../../files/arbor/packages/vec-ui-engines/src/compiler.mjs.md) | function | yes | 7 |
| [compileUiConfiguration](../../files/arbor/packages/vec-ui-engines/src/index.mjs.md) | export | yes | 7 |
| [container](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | const | no | 47 |
| [copy](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | const | no | 127 |
| [cycle](../../files/arbor/packages/vec-ui-engines/test/tokens.test.mjs.md) | const | no | 15 |
| [cyclic](../../files/arbor/packages/vec-ui-engines/test/engine-core.test.mjs.md) | const | no | 73 |
| [cyclic](../../files/arbor/packages/vec-ui-engines/test/tokens.test.mjs.md) | const | no | 30 |
| [d](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | const | no | 32 |
| [docs](../../files/arbor/packages/vec-ui-engines/test/manifest.test.mjs.md) | const | no | 22 |
| [entries](../../files/arbor/packages/vec-ui-engines/src/tokens.mjs.md) | const | no | 18 |
| [err](../../files/arbor/packages/vec-ui-engines/src/tokens.mjs.md) | const | no | 34 |
| [error](../../files/arbor/packages/vec-ui-engines/src/tokens.mjs.md) | const | no | 29 |
| [evil](../../files/arbor/packages/vec-ui-engines/test/tokens.test.mjs.md) | const | no | 28 |
| [fail](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | function | no | 72 |
| [fail](../../files/arbor/packages/vec-ui-engines/src/tokens.mjs.md) | function | no | 13 |
| [fail](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | function | yes | 11 |
| [familyFor](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | function | no | 34 |
| [first](../../files/arbor/packages/vec-ui-engines/test/manifest.test.mjs.md) | const | no | 60 |
| [fleet](../../files/arbor/packages/vec-ui-engines/test/manifest.test.mjs.md) | const | no | 17 |
| [freezeEngine](../../files/arbor/packages/vec-ui-engines/src/catalog.mjs.md) | function | no | 6 |
| [getEngineCapability](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | function | yes | 29 |
| [getEngineFamily](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | function | yes | 28 |
| [groupById](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | const | no | 6 |
| [hasData](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | const | no | 46 |
| [id](../../files/arbor/packages/vec-ui-engines/test/engine-core.test.mjs.md) | const | no | 80 |
| [ids](../../files/arbor/packages/vec-ui-engines/test/manifest.test.mjs.md) | const | no | 42 |
| [inertData](../../files/arbor/packages/vec-ui-engines/src/index.mjs.md) | export | yes | 6 |
| [inertData](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | function | yes | 16 |
| [input](../../files/arbor/packages/vec-ui-engines/test/tokens.test.mjs.md) | const | no | 6 |
| [inspectEngineExtension](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | function | yes | 71 |
| [inspectUiEngineApplicability](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | function | yes | 39 |
| [interactive](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | const | no | 44 |
| [json](../../files/arbor/packages/vec-ui-engines/test/manifest.test.mjs.md) | function | no | 7 |
| [keys](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | const | no | 25 |
| [keys](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | const | no | 58 |
| [kind](../../files/arbor/packages/vec-ui-engines/src/tokens.mjs.md) | const | no | 48 |
| [listEngineCapabilities](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | function | yes | 18 |
| [listEngineFamilies](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | function | yes | 17 |
| [malicious](../../files/arbor/packages/vec-ui-engines/test/engine-core.test.mjs.md) | const | no | 71 |
| [mismatch](../../files/arbor/packages/vec-ui-engines/test/tokens.test.mjs.md) | const | no | 17 |
| [normColor](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | function | no | 40 |
| [normLength](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | function | no | 52 |
| [normVector](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | function | no | 57 |
| [out](../../files/arbor/packages/vec-ui-engines/test/engine-core.test.mjs.md) | const | no | 37 |
| [out](../../files/arbor/packages/vec-ui-engines/test/engine-core.test.mjs.md) | const | no | 89 |
| [out](../../files/arbor/packages/vec-ui-engines/test/engine-core.test.mjs.md) | const | no | 122 |
| [path](../../files/arbor/packages/vec-ui-engines/src/tokens.mjs.md) | const | no | 23 |
| [pkg](../../files/arbor/packages/vec-ui-engines/test/tokens.test.mjs.md) | function | no | 4 |
| [plain](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | function | yes | 9 |
| [prev](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | variable | no | 101 |
| [raw](../../files/arbor/packages/vec-ui-engines/src/tokens.mjs.md) | variable | no | 42 |
| [reject](../../files/arbor/packages/vec-ui-engines/src/compiler.mjs.md) | function | no | 8 |
| [res](../../files/arbor/packages/vec-ui-engines/test/engine-core.test.mjs.md) | const | no | 111 |
| [resolve](../../files/arbor/packages/vec-ui-engines/src/tokens.mjs.md) | function | no | 36 |
| [resolveUiTokenPackage](../../files/arbor/packages/vec-ui-engines/src/index.mjs.md) | export | yes | 8 |
| [resolveUiTokenPackage](../../files/arbor/packages/vec-ui-engines/src/tokens.mjs.md) | function | yes | 12 |
| [resolveUiTokenReference](../../files/arbor/packages/vec-ui-engines/src/index.mjs.md) | export | yes | 8 |
| [resolveUiTokenReference](../../files/arbor/packages/vec-ui-engines/src/tokens.mjs.md) | function | yes | 58 |
| [result](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | const | no | 64 |
| [root](../../files/arbor/packages/vec-ui-engines/test/manifest.test.mjs.md) | const | no | 6 |
| [rot](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | const | no | 120 |
| [sc](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | const | no | 121 |
| [seen](../../files/arbor/packages/vec-ui-engines/src/compiler.mjs.md) | const | no | 14 |
| [seen](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | const | no | 17 |
| [source](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | const | no | 55 |
| [spec](../../files/arbor/packages/vec-ui-engines/test/manifest.test.mjs.md) | const | no | 41 |
| [target](../../files/arbor/packages/vec-ui-engines/src/tokens.mjs.md) | const | no | 44 |
| [text](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | const | no | 45 |
| [token](../../files/arbor/packages/vec-ui-engines/src/tokens.mjs.md) | const | no | 40 |
| [token](../../files/arbor/packages/vec-ui-engines/src/tokens.mjs.md) | const | no | 62 |
| [tr](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | const | no | 119 |
| [traits](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | const | no | 43 |
| [unknownChoices](../../files/arbor/packages/vec-ui-engines/test/engine-core.test.mjs.md) | const | no | 84 |
| [valid](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | const | no | 72 |
| [valid](../../files/arbor/packages/vec-ui-engines/test/engine-core.test.mjs.md) | const | no | 120 |
| [validGroup](../../files/arbor/packages/vec-ui-engines/src/tokens.mjs.md) | function | no | 11 |
| [validateEngineSetting](../../files/arbor/packages/vec-ui-engines/src/registry.mjs.md) | function | yes | 61 |
| [validateUiValue](../../files/arbor/packages/vec-ui-engines/src/index.mjs.md) | export | yes | 6 |
| [validateUiValue](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | function | yes | 62 |
| [value](../../files/arbor/packages/vec-ui-engines/src/tokens.mjs.md) | const | no | 50 |
| [valueObject](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | function | no | 12 |
| [visited](../../files/arbor/packages/vec-ui-engines/src/tokens.mjs.md) | const | no | 35 |
| [visiting](../../files/arbor/packages/vec-ui-engines/test/manifest.test.mjs.md) | const | no | 48 |
| [walk](../../files/arbor/packages/vec-ui-engines/src/validators.mjs.md) | function | no | 18 |
| [walk](../../files/arbor/packages/vec-ui-engines/test/manifest.test.mjs.md) | function | no | 49 |
| [x](../../files/arbor/packages/vec-ui-engines/test/tokens.test.mjs.md) | const | no | 8 |
| [x](../../files/arbor/packages/vec-ui-engines/test/tokens.test.mjs.md) | const | no | 35 |

## Dependencies

### Outgoing

| Target | Imports |
| --- | --- |
| external:node:assert | 3 |
| external:node:test | 3 |
| arbor/mobile-relay | 1 |
| external:node:fs | 1 |

### Incoming

_No incoming dependencies._

## Context annotations

_No context annotations in this module._

---

[HQ wiki](../../index.md) · [Symbols](../../symbols.md) · [Dependency graph](../../graph.md) · [Documentation](../../docs.md) · [Changes](../../changes.md) · [Open tasks](../../todos.md) · [Deprecated](../../deprecated.md) · [Agent annotation protocol](../../protocol.md) · [Glossary](../../glossary.md) · [Using HQ](../../context.md) · [Capabilities](../../capabilities.md) · [Search index](../../search.json) · [Browser view](../../index.html)
