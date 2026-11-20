# File: packages/tierflow/src/visual-runtime/components/layout.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/components/layout.ts |
| Language | TypeScript |
| Kind | source |
| Size | 6106 B |
| Lines | 116 |
| Hash | 0c4689e1bee2 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| LayoutConstraints | interface | 4 | yes | export interface LayoutConstraints { |
| LayoutResult | type | 14 | yes | export type LayoutResult&lt;T&gt; = |
| ResolvedLayout | interface | 18 | yes | export interface ResolvedLayout { |
| KEYS | const | 29 | no | const KEYS = new Set([&quot;mode&quot;, &quot;gapPx&quot;, &quot;paddingPx&quot;, &quot;minItemWidthPx&quot;, &quot;maxColumns&quot;, &quot;maxWidthPx&quot;, &quot;motion&quot;]); |
| FIXTURE_VIEWPORTS | const | 30 | no | const FIXTURE_VIEWPORTS = [320, 360, 1280] as const; |
| plain | function | 32 | no | function plain(value: unknown): value is Record&lt;string, unknown&gt; { |
| integer | function | 36 | no | function integer(value: unknown, low: number, high: number): value is number { |
| invalid | function | 39 | no | function invalid(reason: string): LayoutResult&lt;never&gt; { |
| validateLayoutConstraints | function | 43 | yes | export function validateLayoutConstraints(input: unknown): LayoutResult&lt;LayoutConstraints&gt; { |
| value | const | 54 | no | const value: LayoutConstraints = { |
| resolved | const | 64 | no | const resolved = resolveLayout(value, viewport, 1, true); |
| resolveLayout | function | 71 | yes | export function resolveLayout( constraints: LayoutConstraints, viewportPx: number, childCount: number, prefersReducedMotion = false, |
| padding | const | 90 | no | const padding = constraints.paddingPx ?? 16; |
| gap | const | 91 | no | const gap = constraints.gapPx ?? 12; |
| width | const | 92 | no | const width = Math.min(viewportPx, constraints.maxWidthPx ?? 1120); |
| content | const | 93 | no | const content = width - padding * 2; |
| minItem | const | 94 | no | const minItem = constraints.minItemWidthPx ?? 160; |
| possible | const | 98 | no | const possible = Math.floor((content + gap) / (minItem + gap)); |
| columns | const | 99 | no | const columns = constraints.mode === &quot;grid&quot; |
| itemWidth | const | 102 | no | const itemWidth = (content - (columns - 1) * gap) / columns; |
| RESPONSIVE_FIXTURE_WIDTHS | const | 116 | yes | export const RESPONSIVE_FIXTURE_WIDTHS = FIXTURE_VIEWPORTS; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/components/catalog.ts](./catalog.ts.md) | ./layout.ts |
| [packages/tierflow/src/visual-runtime/components/wave3-canonical-map.ts](./wave3-canonical-map.ts.md) | ./layout.ts |
| [packages/tierflow/src/visual-runtime/integration-2/compose.ts](../integration-2/compose.ts.md) | ../components/layout.ts |
| [packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts](../../../tests/visual-runtime/integration-2/real-a-h.test.ts.md) | ../../../src/visual-runtime/components/layout.ts |
| [packages/tierflow/tests/visual-runtime/layout.test.ts](../../../tests/visual-runtime/layout.test.ts.md) | ../../src/visual-runtime/components/layout.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/** Pure 2D constraints for nodes in the Wave 2 vivim.ui-document/1 fixture.
 * No CSS, DOM, storage, device API, or action execution takes place here.
 */
export interface LayoutConstraints {
  readonly mode?: "stack" | "grid";
  readonly gapPx?: number;
  readonly paddingPx?: number;
  readonly minItemWidthPx?: number;
  readonly maxColumns?: number;
  readonly maxWidthPx?: number;
  readonly motion?: "none" | "subtle";
}

export type LayoutResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly code: "INVALID_LAYOUT" | "LAYOUT_OVERFLOW"; readonly reason: string };

export interface ResolvedLayout {
  readonly viewportPx: number;
  readonly widthPx: number;
  readonly contentWidthPx: number;
  readonly columns: number;
  readonly itemWidthPx: number;
  readonly gapPx: number;
  readonly paddingPx: number;
  readonly motion: "none" | "subtle";
}

const KEYS = new Set(["mode", "gapPx", "paddingPx", "minItemWidthPx", "maxColumns", "maxWidthPx", "motion"]);
const FIXTURE_VIEWPORTS = [320, 360, 1280] as const;

function plain(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}
function integer(value: unknown, low: number, high: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= low && value <= high;
}
function invalid(reason: string): LayoutResult<never> {
  return { ok: false, code: "INVALID_LAYOUT", reason };
}

export function validateLayoutConstraints(input: unknown): LayoutResult<LayoutConstraints> {
  if (input === undefined) return { ok: true, value: {} };
  if (!plain(input)) return invalid("layout must be a plain object");
  for (const key of Object.keys(input)) if (!KEYS.has(key)) return invalid(`unknown layout field: ${key}`);
  if (input.mode !== undefined && input.mode !== "stack" && input.mode !== "grid") return invalid("mode must be stack or grid");
  if (input.motion !== undefined && input.motion !== "none" && input.motion !== "subtle") return invalid("motion must be none or subtle");
  if (input.gapPx !== undefined && !integer(input.gapPx, 0, 32)) return invalid("gapPx must be 0..32 integer");
  if (input.paddingPx !== undefined && !integer(input.paddingPx, 0, 32)) return invalid("paddingPx must be 0..32 integer");
  if (input.minItemWidthPx !== undefined && !integer(input.minItemWidthPx, 44, 1080)) return invalid("minItemWidthPx must be 44..1080 integer");
  if (input.maxColumns !== undefined && !integer(input.maxColumns, 1, 6)) return invalid("maxColumns must be 1..6 integer");
  if (input.maxWidthPx !== undefined && !integer(input.maxWidthPx, 44, 1280)) return invalid("maxWidthPx must be 44..1280 integer");
  const value: LayoutConstraints = {
    ...(input.mode === undefined ? {} : { mode: input.mode as "stack" | "grid" }),
    ...(input.gapPx === undefined ? {} : { gapPx: input.gapPx as number }),
    ...(input.paddingPx === undefined ? {} : { paddingPx: input.paddingPx as number }),
    ...(input.minItemWidthPx === undefined ? {} : { minItemWidthPx: input.minItemWidthPx as number }),
    ...(input.maxColumns === undefined ? {} : { maxColumns: input.maxColumns as number }),
    ...(input.maxWidthPx === undefined ? {} : { maxWidthPx: input.maxWidthPx as number }),
    ...(input.motion === undefined ? {} : { motion: input.motion as "none" | "subtle" }),
  };
  for (const viewport of FIXTURE_VIEWPORTS) {
    const resolved = resolveLayout(value, viewport, 1, true);
    if (!resolved.ok) return resolved;
  }
  return { ok: true, value };
}

/** A deterministic measuring plan; the renderer must preserve DOM/source order. */
export function resolveLayout(
  constraints: LayoutConstraints,
  viewportPx: number,
  childCount: number,
  prefersReducedMotion = false,
): LayoutResult<ResolvedLayout> {
  if (!integer(viewportPx, 240, 3840) || !integer(childCount, 0, 64)) {
    return invalid("invalid viewport or child count");
  }
  if (!plain(constraints) ||
```

_First 80 of 117 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
