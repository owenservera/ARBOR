# File: packages/tierflow/src/visual-runtime/render/wave3-semantics.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/render/wave3-semantics.ts |
| Language | TypeScript |
| Kind | source |
| Size | 7521 B |
| Lines | 155 |
| Hash | 922344068639 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WAVE3_RENDER_SCHEMA | const | 14 | yes | export const WAVE3_RENDER_SCHEMA = &quot;vivim.wave3-render-semantics/1&quot; as const; |
| VersionedInertAction | interface | 16 | yes | export interface VersionedInertAction { |
| InertBindingProvenance | interface | 24 | yes | export interface InertBindingProvenance { |
| Wave3RenderResult | type | 34 | yes | export type Wave3RenderResult = Readonly&lt;{ |
| Wave3RenderOptions | interface | 45 | yes | export interface Wave3RenderOptions extends RenderOptions { |
| plain | function | 50 | no | function plain(value: unknown): value is Record&lt;string, unknown&gt; { |
| own | function | 54 | no | function own(value: Record&lt;string, unknown&gt;, field: string): unknown { |
| IDENTIFIER | const | 57 | no | const IDENTIFIER = /^(?!__proto__$\|prototype$\|constructor$)[A-Za-z][A-Za-z0-9._:-]{0,95}$/; |
| safeCatalog | function | 58 | no | function safeCatalog(input: unknown): input is readonly UiActionReference[] { |
| seen | const | 60 | no | const seen = new Set&lt;string&gt;(); |
| id | const | 64 | no | const id = own(value, &quot;id&quot;); |
| version | const | 65 | no | const version = own(value, &quot;version&quot;); |
| key | const | 68 | no | const key = `${id}@${version}`; |
| refuse | function | 74 | no | function refuse(code: string, viewportPx: number): Wave3RenderResult { |
| plan | const | 76 | no | const plan = renderUiDocument(null, { viewportPx }); |
| safePlan | const | 77 | no | const safePlan: RenderPlan = { |
| focusMatchesDomOrder | function | 89 | no | function focusMatchesDomOrder(document: UiDocument): boolean { |
| byId | const | 90 | no | const byId = new Map(document.nodes.map(node =&gt; [node.id, node] as const)); |
| focus | const | 91 | no | const focus: number[] = []; |
| visit | function | 92 | no | function visit(id: string): void { |
| node | const | 93 | no | const node = byId.get(id)!; |
| renderWave3Semantics | function | 112 | yes | export function renderWave3Semantics(input: unknown, options: Wave3RenderOptions): Wave3RenderResult { |
| viewportPx | const | 116 | no | const viewportPx = own(options, &quot;viewportPx&quot;); |
| validated | const | 119 | no | const validated: UiDocumentValidation = validateUiDocument(input, { knownActions: options.knownActions }); |
| document | const | 121 | no | const document = validated.document; |
| actions | const | 127 | no | const actions: VersionedInertAction[] = []; |
| nodes | const | 128 | no | const nodes = document.nodes.map((node, nodeIndex) =&gt; { const actionRefs = (node.actionRefs ?? []).map((ref, refIndex) =&gt; { // The alias intentionally contains no original action id/version and // ca… |
| actionRefs | const | 129 | no | const actionRefs = (node.actionRefs ?? []).map((ref, refIndex) =&gt; { // The alias intentionally contains no original action id/version and // cannot be resolved into a grant without the separate typed… |
| displayAlias | const | 132 | no | const displayAlias = `render_action_${nodeIndex}_${refIndex}`; |
| rendererInput | const | 139 | no | const rendererInput = { ...document, nodes }; |
| plan | const | 140 | no | const plan = renderUiDocument(rendererInput, { viewportPx }); |
| provenance | const | 145 | no | const provenance: InertBindingProvenance[] = document.bindings.map(binding =&gt; Object.freeze({ nodeId: binding.nodeId, bindingId: binding.id, bindingVersion: binding.version, provenanceRef: binding.pr… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../document/validate.ts | import | 9 | [packages/tierflow/src/visual-runtime/document/validate.ts](../document/validate.ts.md) |
| ../document/schema.ts | import | 10 | [packages/tierflow/src/visual-runtime/document/schema.ts](../document/schema.ts.md) |
| ./dom.ts | import | 11 | [packages/tierflow/src/visual-runtime/render/dom.ts](./dom.ts.md) |
| ./inspect.ts | import | 12 | [packages/tierflow/src/visual-runtime/render/inspect.ts](./inspect.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/device/wave4-desktop-adapter.ts](../device/wave4-desktop-adapter.ts.md) | ../render/wave3-semantics.ts |
| [packages/tierflow/src/visual-runtime/device/wave4-phone-adapter.ts](../device/wave4-phone-adapter.ts.md) | ../render/wave3-semantics.ts |
| [packages/tierflow/src/visual-runtime/final-wave/lane-f/existing-clients.ts](../final-wave/lane-f/existing-clients.ts.md) | ../../render/wave3-semantics.ts |
| [packages/tierflow/src/visual-runtime/integration-3/compose.ts](../integration-3/compose.ts.md) | ../render/wave3-semantics.ts |
| [packages/tierflow/src/visual-runtime/integration-4/compose.ts](../integration-4/compose.ts.md) | ../render/wave3-semantics.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/master.test.ts](../../../tests/visual-runtime/final-wave/integration/master.test.ts.md) | ../../../../src/visual-runtime/render/wave3-semantics.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-f/real-wave4b-regression.test.ts](../../../tests/visual-runtime/final-wave/lane-f/real-wave4b-regression.test.ts.md) | ../../../../src/visual-runtime/render/wave3-semantics.ts |
| [packages/tierflow/tests/visual-runtime/wave3-d-render.test.ts](../../../tests/visual-runtime/wave3-d-render.test.ts.md) | ../../src/visual-runtime/render/wave3-semantics.ts |
| [packages/tierflow/tests/visual-runtime/wave4-a-desktop-adapter.test.ts](../../../tests/visual-runtime/wave4-a-desktop-adapter.test.ts.md) | ../../src/visual-runtime/render/wave3-semantics.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Wave 3 Lane D: canonical A document -> existing inert D renderer.
 *
 * This is a display-only compatibility boundary, not a component registry,
 * KB authorization decision, Host action dispatcher or DOM implementation.
 * Exact versioned references are retained out-of-band; the old renderer sees
 * only locally generated, inert aliases. Nothing here grants an effect.
 */
import { validateUiDocument, type UiDocumentValidation } from "../document/validate.ts";
import { UI_DOCUMENT_SCHEMA, type UiActionReference, type UiDocument } from "../document/schema.ts";
import { renderUiDocument, type RenderOptions, type RenderPlan } from "./dom.ts";
import { inspectRenderPlan, type Inspection } from "./inspect.ts";

export const WAVE3_RENDER_SCHEMA = "vivim.wave3-render-semantics/1" as const;

export interface VersionedInertAction {
  readonly nodeId: string;
  readonly id: string;
  readonly version: number;
  /** An opaque reference, never a click handler or execution capability. */
  readonly displayAlias: string;
  readonly inert: true;
}
export interface InertBindingProvenance {
  readonly nodeId: string;
  readonly bindingId: string;
  readonly bindingVersion: number;
  readonly provenanceRef: string;
  readonly availability: string;
  readonly readScope: "owner";
  /** Describes a declaration; never establishes actual KB access. */
  readonly authorized: false;
}
export type Wave3RenderResult = Readonly<{
  schema: typeof WAVE3_RENDER_SCHEMA;
  readonly status: RenderPlan["status"];
  readonly plan: RenderPlan;
  readonly inspection: Inspection;
  readonly sourceSchema: typeof UI_DOCUMENT_SCHEMA | null;
  readonly actions: readonly VersionedInertAction[];
  readonly provenance: readonly InertBindingProvenance[];
  readonly refusalCode: string | null;
}>;

export interface Wave3RenderOptions extends RenderOptions {
  /** Trusted fixture catalog for A-validation only: NOT permission or Host authority. */
  readonly knownActions: readonly UiActionReference[];
}

function plain(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}
function own(value: Record<string, unknown>, field: string): unknown {
  return Object.getOwnPropertyDescriptor(value, field)?.value;
}
const IDENTIFIER = /^(?!__proto__$|prototype$|constructor$)[A-Za-z][A-Za-z0-9._:-]{0,95}$/;
function safeCatalog(input: unknown): input is readonly UiActionReference[] {
  if (!Array.isArray(input) || input.length > 64 || Object.keys(input).length !== input.length) return false;
  const seen = new Set<string>();
  for (const value of input) {
    if (!plain(value) || Reflect.ownKeys(value).length !== 2 ||
        !Object.hasOwn(value, "id") || !Object.hasOwn(value, "version")) return false;
    const id = own(value, "id");
    const version = own(value, "version");
    if (typeof id !== "string" || !IDENTIFIER.test(id) ||
        typeof version !== "number" || !Number.isSafeInteger(version) || version < 1 || version > 1e9) return false;
    const key = `${id}@${version}`;
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
}
function refuse(code: string, viewportPx: number): Wave3RenderResult {
  // Reuse Lane D's existing accessible, effect-free refusal projection.
  const plan = renderUiDocument(null, { viewportPx });
  const safePlan: RenderPlan = {
    ...plan,
    issues: Object.freeze([{ code }]),
    trace: Object.freeze(plan.trace.map(entry => Object.freeze({ ...entry, code }))),
```

_First 80 of 156 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
