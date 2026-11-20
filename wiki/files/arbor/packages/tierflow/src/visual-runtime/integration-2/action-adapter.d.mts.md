# File: packages/tierflow/src/visual-runtime/integration-2/action-adapter.d.mts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/integration-2/action-adapter.d.mts |
| Language | TypeScript |
| Kind | source |
| Size | 849 B |
| Lines | 26 |
| Hash | b82479e5a393 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| InertActionVersionEntry | interface | 8 | yes | export interface InertActionVersionEntry { |
| InertActionProjection | interface | 16 | yes | export interface InertActionProjection { |
| projectInertActionRefs | function | 26 | yes | export declare function projectInertActionRefs(document: unknown): InertActionProjection; |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Type surface for the committed synthetic-only A -> B/D action-ref adapter.
 * The runtime implementation is `action-adapter.mjs`; this file only describes
 * its shape so TypeScript can check callers. It adds no runtime behaviour.
 */
export declare const ADAPTER_SCHEMA: string;

export interface InertActionVersionEntry {
  readonly alias: string;
  readonly nodeId: string;
  readonly id: string;
  readonly version: number;
  readonly inert: true;
}

export interface InertActionProjection {
  readonly schema: string;
  readonly synthetic: true;
  readonly actionVersionTable: readonly InertActionVersionEntry[];
  readonly rendererDocument: {
    readonly schema: string;
    readonly nodes: readonly unknown[];
  };
}

export declare function projectInertActionRefs(document: unknown): InertActionProjection;
```

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
