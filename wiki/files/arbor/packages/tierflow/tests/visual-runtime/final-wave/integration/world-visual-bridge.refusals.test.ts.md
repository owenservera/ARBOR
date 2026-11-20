# File: packages/tierflow/tests/visual-runtime/final-wave/integration/world-visual-bridge.refusals.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/final-wave/integration/world-visual-bridge.refusals.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 419 B |
| Lines | 6 |
| Hash | caa795f9365a |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

_No symbols._

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 2 | external |
| ../../../../src/ui/hash.ts | import | 3 | [packages/tierflow/src/ui/hash.ts](../../../../src/ui/hash.ts.md) |
| ../../../../src/ui/world.ts | import | 4 | [packages/tierflow/src/ui/world.ts](../../../../src/ui/world.ts.md) |
| ../../../../src/visual-runtime/final-wave/integration/world-visual-bridge.ts | import | 5 | [packages/tierflow/src/visual-runtime/final-wave/integration/world-visual-bridge.ts](../../../../src/visual-runtime/final-wave/integration/world-visual-bridge.ts.md) |
| ../../../../src/ui/types.ts | import | 6 | [packages/tierflow/src/ui/types.ts](../../../../src/ui/types.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/// <reference types="bun-types" />
import { test, expect } from 'bun:test';
import { contentHash, canonicalJson } from '../../../../src/ui/hash.ts';
import { parseUiDocument } from '../../../../src/ui/world.ts';
import { projectWorldRevision } from '../../../../src/visual-runtime/final-wave/integration/world-visual-bridge.ts';
import type { UiDocument, UiRevision, UiObject } from '../../../../src/ui/types.ts';
```

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)
