# File: packages/tierflow/src/visual-runtime/render/spatial-fallback.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/render/spatial-fallback.ts |
| Language | TypeScript |
| Kind | source |
| Size | 1063 B |
| Lines | 25 |
| Hash | 70be4309b135 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SpatialFallback | interface | 2 | yes | export interface SpatialFallback { |
| projectSpatialFallback | function | 9 | yes | export function projectSpatialFallback(views: unknown): SpatialFallback { |
| spatial | const | 10 | no | const spatial = Array.isArray(views) |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/render/dom.ts](./dom.ts.md) | ./spatial-fallback.ts |
| [packages/tierflow/tests/visual-runtime/render.test.ts](../../../tests/visual-runtime/render.test.ts.md) | ../../src/visual-runtime/render/spatial-fallback.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/** Pure, loss-aware accessible projection. Geometry is never UI identity or an action. */
export interface SpatialFallback {
  readonly present: boolean;
  readonly description: string;
  readonly lossCodes: readonly string[];
  readonly sourceViewCount: number;
}

export function projectSpatialFallback(views: unknown): SpatialFallback {
  const spatial = Array.isArray(views)
    ? views.filter((view) => view !== null && typeof view === "object" &&
      !Array.isArray(view) &&
      (Object.getOwnPropertyDescriptor(view, "kind")?.value === "spatial" ||
        Object.getOwnPropertyDescriptor(view, "type")?.value === "spatial"))
    : [];
  if (spatial.length === 0) {
    return { present: false, description: "", lossCodes: [], sourceViewCount: 0 };
  }
  return {
    present: true,
    description: "Spatial view is not interactive here. Use the accessible two-dimensional document; spatial geometry and outbound flows were not converted.",
    lossCodes: ["SPATIAL_UNSUPPORTED"],
    sourceViewCount: spatial.length,
  };
}
```

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
