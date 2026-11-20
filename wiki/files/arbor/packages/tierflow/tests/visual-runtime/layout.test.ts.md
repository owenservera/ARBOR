# File: packages/tierflow/tests/visual-runtime/layout.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/layout.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 5965 B |
| Lines | 105 |
| Hash | f53e6293c71b |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| responsive | const | 7 | no | const responsive = { mode: &quot;grid&quot; as const, minItemWidthPx: 160, maxColumns: 4, paddingPx: 16, gapPx: 12, motion: &quot;subtle&quot; as const }; |
| columns | const | 12 | no | const columns: number[] = []; |
| layout | const | 14 | no | const layout = resolveLayout(responsive, width, 8); |
| a | const | 26 | no | const a = resolveLayout({ mode: &quot;stack&quot; }, 1280, 8); |
| b | const | 27 | no | const b = resolveLayout({ mode: &quot;grid&quot; }, 320, 0); |
| normal | const | 32 | no | const normal = resolveLayout(responsive, 360, 2, false); |
| reduced | const | 33 | no | const reduced = resolveLayout(responsive, 360, 2, true); |
| result | const | 38 | no | const result = validateLayoutConstraints({ mode: &quot;grid&quot;, minItemWidthPx: 400 }); |
| result | const | 43 | no | const result = validateLayoutConstraints({ minItemWidthPx: 280, maxWidthPx: 120, paddingPx: 16 }); |
| original | const | 55 | no | const original = JSON.stringify(responsive); |
| a | const | 56 | no | const a = resolveLayout(responsive, 1280, 8); |
| b | const | 57 | no | const b = resolveLayout(responsive, 1280, 8); |
| nodes | const | 66 | no | const nodes = [ |
| focus | const | 71 | no | const focus = auditFocusOrder(nodes, &quot;root&quot;); |
| button | const | 76 | no | const button = { id: &quot;b&quot;, type: &quot;button&quot; as const, props: { label: &quot;Send&quot; } }; |
| nodes | const | 83 | no | const nodes = [ |
| focus | const | 88 | no | const focus = auditFocusOrder(nodes, &quot;root&quot;); |
| nodes | const | 93 | no | const nodes = [ |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/visual-runtime/components/layout.ts | import | 3 | [packages/tierflow/src/visual-runtime/components/layout.ts](../../src/visual-runtime/components/layout.ts.md) |
| ../../src/visual-runtime/components/accessibility.ts | import | 4 | [packages/tierflow/src/visual-runtime/components/accessibility.ts](../../src/visual-runtime/components/accessibility.ts.md) |
| ../../src/visual-runtime/components/catalog.ts | import | 5 | [packages/tierflow/src/visual-runtime/components/catalog.ts](../../src/visual-runtime/components/catalog.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveLayout, validateLayoutConstraints, RESPONSIVE_FIXTURE_WIDTHS } from "../../src/visual-runtime/components/layout.ts";
import { auditFocusOrder } from "../../src/visual-runtime/components/accessibility.ts";
import { inspectComponent } from "../../src/visual-runtime/components/catalog.ts";

const responsive = { mode: "grid" as const, minItemWidthPx: 160, maxColumns: 4, paddingPx: 16, gapPx: 12, motion: "subtle" as const };

test("320, 360, 1280 widths fit and change columns deterministically", () => {
  assert.deepEqual([...RESPONSIVE_FIXTURE_WIDTHS], [320, 360, 1280]);
  assert.equal(validateLayoutConstraints(responsive).ok, true);
  const columns: number[] = [];
  for (const width of RESPONSIVE_FIXTURE_WIDTHS) {
    const layout = resolveLayout(responsive, width, 8);
    assert.equal(layout.ok, true);
    if (layout.ok) {
      columns.push(layout.value.columns);
      assert.ok(layout.value.widthPx <= width);
      assert.ok(layout.value.itemWidthPx >= 160);
      assert.ok(layout.value.itemWidthPx * layout.value.columns + (layout.value.columns - 1) * 12 <= layout.value.contentWidthPx + 0.0001);
    }
  }
  assert.deepEqual(columns, [1, 1, 4]);
});
test("stack never makes hidden multiple columns and zero children remains valid", () => {
  const a = resolveLayout({ mode: "stack" }, 1280, 8);
  const b = resolveLayout({ mode: "grid" }, 320, 0);
  assert.equal(a.ok, true); assert.equal(b.ok, true);
  if (a.ok && b.ok) { assert.equal(a.value.columns, 1); assert.equal(b.value.columns, 1); }
});
test("reduced-motion fallback clears visual motion regardless of device width", () => {
  const normal = resolveLayout(responsive, 360, 2, false);
  const reduced = resolveLayout(responsive, 360, 2, true);
  assert.equal(normal.ok, true); assert.equal(reduced.ok, true);
  if (normal.ok && reduced.ok) { assert.equal(normal.value.motion, "subtle"); assert.equal(reduced.value.motion, "none"); }
});
test("small viewports refuse layout whose minimum child cannot fit", () => {
  const result = validateLayoutConstraints({ mode: "grid", minItemWidthPx: 400 });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "LAYOUT_OVERFLOW");
});
test("explicit max width cannot hide a horizontal overflow", () => {
  const result = validateLayoutConstraints({ minItemWidthPx: 280, maxWidthPx: 120, paddingPx: 16 });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "LAYOUT_OVERFLOW");
});
test("invalid geometry and arbitrary CSS/JS props are refused", () => {
  for (const input of [{ gapPx: -1 }, { paddingPx: 99 }, { maxColumns: 0 }, { maxColumns: 1.5 },
    { width: "100vw" }, { position: "absolute" }, { motion: "javascript:" }, { gapPx: Infinity }]) {
    assert.equal(validateLayoutConstraints(input).ok, false);
  }
  assert.equal(inspectComponent({ id: "layout", type: "grid", layout: { position: "fixed" } }).ok, false);
});
test("layout is pure and does not mutate caller objects", () => {
  const original = JSON.stringify(responsive);
  const a = resolveLayout(responsive, 1280, 8);
  const b = resolveLayout(responsive, 1280, 8);
  assert.deepEqual(a, b); assert.equal(JSON.stringify(responsive), original);
});
test("invalid viewport and count are refused without falling through to unsafe layout", () => {
  assert.equal(resolveLayout(responsive, NaN, 1).ok, false);
  assert.equal(resolveLayout(responsive, 200, 1).ok, false);
  assert.equal(resolveLayout(responsive, 320, 65).ok, false);
});
test("DOM child traversal determines focus order, not node array or geometry", () => {
  const nodes = [
    { id: "b", type: "button" as const, props: { label: "Second" } },
    { id: "root", type: "stack" as const, children: ["a", "b"] },
    { id: "a", type: "button" as const, props: { label: "First" } },
  ];
  const focus = auditFocusOrder(nodes, "root");
  assert.equal(focus.ok, true);
  if (focus.ok) assert.deepEqual(focus.value, ["a", "b"]);
});
test("focus audit refuses orphans, cycles, duplicated IDs, missing roots", () => {
  const button = { id: "b", type: "button" as const, props: { label: "Send" } };
  assert.equal(auditFocusOrder([button], "not_root").ok, false);
  assert.equal(auditFocusOrder([button, button], "b").ok, false);
  assert.equal(auditFocusOrder([{ id: "root", type: "stack" as const }, button], "root").ok, false);
  assert.equal(auditFocusOrder([{ id: "root", type: "stack" as const, children: ["root"] }], "root").ok, false);
```

_First 80 of 106 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
