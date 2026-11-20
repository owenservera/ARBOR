# File: packages/tierflow/tests/visual-runtime/components.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/components.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 6396 B |
| Lines | 104 |
| Hash | d34cb6644a9d |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| button | function | 6 | no | const button = () =&gt; ({ id: &quot;confirm_1&quot;, type: &quot;button&quot;, props: { label: &quot;Review changes&quot; }, actionRefs: [&quot;ui_review_1&quot;] }); |
| refused | function | 7 | no | function refused(input: unknown, code: string): void { |
| result | const | 8 | no | const result = inspectComponent(input); |
| inspected | const | 15 | no | const inspected = inspectComponent(button()); |
| fixtures | const | 27 | no | const fixtures = [ |
| status | const | 80 | no | const status = inspectComponent({ id: &quot;state&quot;, type: &quot;status&quot;, props: { message: &quot;Still awaiting Host&quot;, state: &quot;uncertain&quot; } }); |
| cycle | const | 87 | no | const cycle: Record&lt;string, unknown&gt; = { ...button() }; cycle.loop = cycle; |
| accessed | variable | 98 | no | let accessed = 0; |
| forged | const | 99 | no | const forged: Record&lt;string, unknown&gt; = { id: &quot;x&quot;, type: &quot;button&quot; }; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/visual-runtime/components/catalog.ts | import | 3 | [packages/tierflow/src/visual-runtime/components/catalog.ts](../../src/visual-runtime/components/catalog.ts.md) |
| ../../src/visual-runtime/components/accessibility.ts | import | 4 | [packages/tierflow/src/visual-runtime/components/accessibility.ts](../../src/visual-runtime/components/accessibility.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
import { test } from "node:test";
import assert from "node:assert/strict";
import { COMPONENT_TYPES, inspectComponent } from "../../src/visual-runtime/components/catalog.ts";
import { validateAccessibility } from "../../src/visual-runtime/components/accessibility.ts";

const button = () => ({ id: "confirm_1", type: "button", props: { label: "Review changes" }, actionRefs: ["ui_review_1"] });
function refused(input: unknown, code: string): void {
  const result = inspectComponent(input);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, code);
}

test("catalog is closed and includes noninteractive and accessible interactive controls", () => {
  assert.deepEqual([...COMPONENT_TYPES], ["stack", "grid", "card", "text", "heading", "button", "status", "field", "divider"]);
  const inspected = inspectComponent(button());
  assert.equal(inspected.ok, true);
  if (inspected.ok) {
    assert.equal(inspected.value.a11y.role, "button");
    assert.equal(inspected.value.a11y.name, "Review changes");
    assert.equal(inspected.value.a11y.tabIndex, 0);
    assert.equal(inspected.value.a11y.touchTargetPx, 44);
    assert.deepEqual(inspected.value.actionRefs, ["ui_review_1"]);
  }
});

test("all catalog types have fixtures without executable values", () => {
  const fixtures = [
    { type: "stack" }, { type: "grid" }, { type: "card", props: { title: "Evidence" } },
    { type: "text", props: { text: "Synthetic source" } },
    { type: "heading", props: { text: "Evidence", level: 2 } },
    { type: "button", props: { label: "Preview", disabled: true } },
    { type: "status", props: { message: "Permission unknown", state: "uncertain" } },
    { type: "field", props: { label: "Search", readOnly: true, value: "safe" } },
    { type: "divider" },
  ];
  for (const [index, input] of fixtures.entries()) assert.equal(inspectComponent({ id: `n_${index}`, ...input }).ok, true);
});

test("unknown component is unavailable, never silently executed or imported", () => refused({ ...button(), type: "script" }, "UNREGISTERED_COMPONENT"));
test("event handlers and raw HTML prop are refused", () => {
  refused({ ...button(), props: { label: "Go", onClick: "steal()" } }, "UNSAFE_PROP");
  refused({ ...button(), props: { label: "Go", dangerouslySetInnerHTML: { __html: "<img>" } } }, "UNSAFE_PROP");
  refused({ ...button(), props: { label: "Go", href: "javascript:alert(1)" } }, "UNSAFE_PROP");
});
test("privileged node metadata and dynamic functions are rejected", () => {
  refused({ ...button(), approval: true }, "UNSAFE_PROP");
  refused({ ...button(), props: { label: () => "hi" } }, "INVALID_COMPONENT");
  refused({ ...button(), executor: "host" }, "UNSAFE_PROP");
});
test("unsafe markup in display text is refused; safe literal text retained", () => {
  refused({ id: "text", type: "text", props: { text: "<svg onload=alert(1)>" } }, "UNSAFE_PROP");
  assert.equal(inspectComponent({ id: "text", type: "text", props: { text: "42 ≥ 10 & accurate" } }).ok, true);
});
test("missing or duplicate action references cannot create active buttons", () => {
  refused({ ...button(), actionRefs: [] }, "INVALID_COMPONENT");
  refused({ ...button(), actionRefs: ["run", "run"] }, "INVALID_COMPONENT");
  refused({ ...button(), actionRefs: ["run", "other"] }, "INVALID_COMPONENT");
  refused({ id: "text", type: "text", props: { text: "Hey" }, actionRefs: ["send"] }, "UNSAFE_PROP");
});
test("binding IDs are inert opaque refs, not arbitrary paths or URLs", () => {
  refused({ ...button(), bindingRefs: ["/private/record"] }, "INVALID_COMPONENT");
  refused({ ...button(), bindingRefs: ["https://example.com/?secret=x"] }, "INVALID_COMPONENT");
  assert.equal(inspectComponent({ ...button(), bindingRefs: ["evidence_a1"] }).ok, true);
});
test("nested children accepted only by container components", () => {
  refused({ ...button(), children: ["another"] }, "INVALID_COMPONENT");
  assert.equal(inspectComponent({ id: "root", type: "stack", children: ["row_a", "row_b"] }).ok, true);
});
test("read-only input must be labelled; cannot masquerade as a writable form", () => {
  refused({ id: "field", type: "field", props: { label: "Query", readOnly: false } }, "UNSAFE_PROP");
  refused({ id: "field", type: "field", props: { label: "", readOnly: true } }, "UNSAFE_PROP");
});
test("accessible roles cannot change button semantics or remove keyboard focus", () => {
  refused({ ...button(), a11y: { role: "presentation" } }, "INVALID_A11Y");
  refused({ ...button(), a11y: { tabIndex: -1 } }, "INVALID_A11Y");
  refused({ ...button(), a11y: { touchTargetPx: 30 } }, "INVALID_A11Y");
  refused({ ...button(), a11y: { name: "<img>" } }, "INVALID_A11Y");
});
test("status must announce uncertainty rather than claim success", () => {
  const status = inspectComponent({ id: "state", type: "status", props: { message: "Still awaiting Host", state: "uncertain" } });
```

_First 80 of 105 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
