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
  assert.equal(status.ok, true);
  if (status.ok) assert.equal(status.value.a11y.live, "polite");
  refused({ id: "state", type: "status", props: { message: "Pending", state: "pending" }, a11y: { live: "off" } }, "INVALID_A11Y");
});
test("malformed object prototypes, cycles, oversized nodes and identifiers are refused", () => {
  refused(Object.assign(Object.create({ hacked: true }), button()), "INVALID_COMPONENT");
  const cycle: Record<string, unknown> = { ...button() }; cycle.loop = cycle;
  refused(cycle, "INVALID_COMPONENT");
  refused({ id: "a", type: "text", props: { text: "a".repeat(6000) } }, "INVALID_COMPONENT");
  refused({ ...button(), id: "../../" }, "INVALID_COMPONENT");
});
test("unknown a11y fields and silent focus hides are refused", () => {
  refused({ ...button(), a11y: { hidden: true } }, "INVALID_A11Y");
  assert.equal(validateAccessibility("button", { name: "Review" }, undefined).ok, true);
});

test("hostile object getters and toJSON hooks are never invoked", () => {
  let accessed = 0;
  const forged: Record<string, unknown> = { id: "x", type: "button" };
  Object.defineProperty(forged, "props", { enumerable: true, get() { accessed += 1; throw new Error("executed getter"); } });
  refused(forged, "INVALID_COMPONENT");
  refused({ ...button(), toJSON() { accessed += 1; return button(); } }, "INVALID_COMPONENT");
  assert.equal(accessed, 0);
});
