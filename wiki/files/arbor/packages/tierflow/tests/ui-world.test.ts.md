# File: packages/tierflow/tests/ui-world.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/ui-world.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 28599 B |
| Lines | 734 |
| Hash | 4e0be0ffa3cd |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MutableDocument | type | 24 | no | type MutableDocument = Record&lt;string, any&gt;; |
| transformAt | function | 26 | no | function transformAt(x: number, y: number, z: number) { |
| homeDocument | function | 34 | no | function homeDocument(): MutableDocument { |
| parsedHome | function | 80 | no | function parsedHome(): UiDocument { |
| worldError | function | 84 | no | function worldError(run: () =&gt; unknown): UiWorldError { |
| document | const | 96 | no | const document = parseUiDocument(homeDocument()); |
| error | const | 126 | no | const error = worldError(() =&gt; parseUiDocument(input)); |
| versioned | const | 131 | no | const versioned = homeDocument(); |
| error | const | 133 | no | const error = worldError(() =&gt; parseUiDocument(versioned)); |
| layerInput | const | 139 | no | const layerInput = homeDocument(); |
| layerError | const | 141 | no | const layerError = worldError(() =&gt; parseUiDocument(layerInput)); |
| shapeInput | const | 145 | no | const shapeInput = homeDocument(); |
| shapeError | const | 147 | no | const shapeError = worldError(() =&gt; parseUiDocument(shapeInput)); |
| kindInput | const | 151 | no | const kindInput = homeDocument(); |
| kindError | const | 153 | no | const kindError = worldError(() =&gt; parseUiDocument(kindInput)); |
| objectsInput | const | 159 | no | const objectsInput = homeDocument(); |
| objectsError | const | 161 | no | const objectsError = worldError(() =&gt; parseUiDocument(objectsInput)); |
| relationshipsInput | const | 165 | no | const relationshipsInput = homeDocument(); |
| relationshipsError | const | 167 | no | const relationshipsError = worldError(() =&gt; parseUiDocument(relationshipsInput)); |
| flowsInput | const | 171 | no | const flowsInput = homeDocument(); |
| flowsError | const | 173 | no | const flowsError = worldError(() =&gt; parseUiDocument(flowsInput)); |
| endpointInput | const | 179 | no | const endpointInput = homeDocument(); |
| endpointError | const | 181 | no | const endpointError = worldError(() =&gt; parseUiDocument(endpointInput)); |
| targetInput | const | 185 | no | const targetInput = homeDocument(); |
| targetError | const | 187 | no | const targetError = worldError(() =&gt; parseUiDocument(targetInput)); |
| input | const | 193 | no | const input = homeDocument(); |
| error | const | 201 | no | const error = worldError(() =&gt; parseUiDocument(input)); |
| missingInbound | const | 208 | no | const missingInbound = homeDocument(); |
| missingError | const | 210 | no | const missingError = worldError(() =&gt; parseUiDocument(missingInbound)); |
| staticInbound | const | 215 | no | const staticInbound = homeDocument(); |
| staticError | const | 223 | no | const staticError = worldError(() =&gt; parseUiDocument(staticInbound)); |
| input | const | 230 | no | const input = homeDocument(); |
| error | const | 232 | no | const error = worldError(() =&gt; parseUiDocument(input)); |
| input | const | 237 | no | const input = homeDocument(); |
| error | const | 239 | no | const error = worldError(() =&gt; parseUiDocument(input)); |
| registered | const | 244 | no | const registered = homeDocument(); |
| zeroScale | const | 251 | no | const zeroScale = homeDocument(); |
| zeroError | const | 253 | no | const zeroError = worldError(() =&gt; parseUiDocument(zeroScale)); |
| infinite | const | 257 | no | const infinite = homeDocument(); |
| infiniteError | const | 259 | no | const infiniteError = worldError(() =&gt; parseUiDocument(infinite)); |
| notANumber | const | 263 | no | const notANumber = homeDocument(); |
| nanError | const | 265 | no | const nanError = worldError(() =&gt; parseUiDocument(notANumber)); |
| accent | const | 271 | no | const accent = homeDocument(); |
| accentError | const | 273 | no | const accentError = worldError(() =&gt; parseUiDocument(accent)); |
| units | const | 277 | no | const units = homeDocument(); |
| unitsError | const | 279 | no | const unitsError = worldError(() =&gt; parseUiDocument(units)); |
| kind | const | 282 | no | const kind = homeDocument(); |
| kindError | const | 284 | no | const kindError = worldError(() =&gt; parseUiDocument(kind)); |
| title | const | 287 | no | const title = homeDocument(); |
| titleError | const | 289 | no | const titleError = worldError(() =&gt; parseUiDocument(title)); |
| id | const | 292 | no | const id = homeDocument(); |
| idError | const | 294 | no | const idError = worldError(() =&gt; parseUiDocument(id)); |
| nested | const | 299 | no | const nested = homeDocument(); |
| nestedError | const | 301 | no | const nestedError = worldError(() =&gt; parseUiDocument(nested)); |
| array | const | 305 | no | const array = homeDocument(); |
| arrayError | const | 307 | no | const arrayError = worldError(() =&gt; parseUiDocument(array)); |
| notANumber | const | 310 | no | const notANumber = homeDocument(); |
| callable | const | 314 | no | const callable = homeDocument(); |
| input | const | 322 | no | const input = homeDocument(); |
| diagnostics | const | 328 | no | const diagnostics = validateUiDocument(input); |
| errors | const | 329 | no | const errors = diagnostics.filter((diagnostic) =&gt; diagnostic.severity === &quot;error&quot;); |
| byPath | const | 332 | no | const byPath = new Map(errors.map((diagnostic) =&gt; [diagnostic.path, diagnostic])); |
| input | const | 344 | no | const input = homeDocument(); |
| diagnostics | const | 369 | no | const diagnostics = validateUiDocument(input); |
| codes | const | 371 | no | const codes = diagnostics.map((diagnostic) =&gt; diagnostic.code); |
| empty | const | 377 | no | const empty = homeDocument(); |
| emptyDiagnostics | const | 381 | no | const emptyDiagnostics = validateUiDocument(empty); |
| document | const | 397 | no | const document = defaultUiDocument(&quot;home&quot;); |
| document | const | 423 | no | const document = defaultUiDocument(&quot;custom&quot;); |
| error | const | 434 | no | const error = worldError(() =&gt; defaultUiDocument(&quot;sandbox&quot; as unknown as UiWorldKind)); |
| first | const | 442 | no | const first = parsedHome(); |
| second | const | 443 | no | const second = parseUiDocument(homeDocument()); |
| moved | const | 447 | no | const moved = applyUiOperations(first, [ { op: &quot;object.move&quot;, objectId: &quot;obj_floor&quot;, transform: transformAt(0, 1, 0) }, ]); |
| input | const | 457 | no | const input = parsedHome(); |
| before | const | 458 | no | const before = uiDocumentHash(input); |
| result | const | 460 | no | const result = applyUiOperations(input, [ { op: &quot;object.add&quot;, object: { id: &quot;obj_panel&quot;, |
| duplicate | const | 482 | no | const duplicate = worldError(() =&gt; applyUiOperations(parsedHome(), [ { op: &quot;object.add&quot;, object: { id: &quot;obj_floor&quot;, layer: &quot;content&quot;, kind: &quot;static&quot;, shape: &quot;box&quot;, transform: transformAt(0, 0, 0) }, |
| orphan | const | 493 | no | const orphan = worldError(() =&gt; applyUiOperations(parsedHome(), [ { op: &quot;object.add&quot;, object: { id: &quot;obj_live&quot;, layer: &quot;data&quot;, kind: &quot;dynamic&quot;, shape: &quot;billboard&quot;, transform: transformAt(0, 3, 0) }, |
| operations | const | 506 | no | const operations: UiOperation[] = [ |
| result | const | 531 | no | const result = applyUiOperations(parsedHome(), operations); |
| input | const | 538 | no | const input = parsedHome(); |
| result | const | 539 | no | const result = applyUiOperations(input, [{ op: &quot;object.remove&quot;, objectId: &quot;obj_runs&quot; }]); |
| result | const | 552 | no | const result = applyUiOperations(parsedHome(), [ { op: &quot;object.move&quot;, objectId: &quot;obj_runs&quot;, transform: { |
| added | const | 568 | no | const added = applyUiOperations(parsedHome(), [ { op: &quot;object.setProp&quot;, objectId: &quot;obj_runs&quot;, key: &quot;label&quot;, value: &quot;Live&quot; }, ]); |
| removed | const | 573 | no | const removed = applyUiOperations(added, [ { op: &quot;object.setProp&quot;, objectId: &quot;obj_runs&quot;, key: &quot;value&quot;, value: undefined }, ]); |
| cleared | const | 578 | no | const cleared = applyUiOperations(removed, [ { op: &quot;object.setProp&quot;, objectId: &quot;obj_runs&quot;, key: &quot;label&quot;, value: undefined }, ]); |
| result | const | 585 | no | const result = applyUiOperations(parsedHome(), [ { op: &quot;object.setLayer&quot;, objectId: &quot;obj_floor&quot;, layer: &quot;structure&quot; }, ]); |
| error | const | 590 | no | const error = worldError(() =&gt; applyUiOperations(parsedHome(), [ { op: &quot;object.setLayer&quot;, objectId: &quot;obj_floor&quot;, layer: &quot;sky&quot; as unknown as &quot;ground&quot; }, ]), ); |
| result | const | 603 | no | const result = applyUiOperations(parsedHome(), [ { op: &quot;dataFlow.remove&quot;, dataFlowId: &quot;flow_1&quot; }, { op: &quot;object.setKind&quot;, objectId: &quot;obj_runs&quot;, kind: &quot;static&quot; }, ]); |
| error | const | 610 | no | const error = worldError(() =&gt; applyUiOperations(parsedHome(), [{ op: &quot;object.setKind&quot;, objectId: &quot;obj_floor&quot;, kind: &quot;dynamic&quot; }]), ); |
| added | const | 618 | no | const added = applyUiOperations(parsedHome(), [ { op: &quot;relationship.add&quot;, relationship: { id: &quot;rel_2&quot;, from: &quot;obj_runs&quot;, to: &quot;obj_floor&quot;, kind: &quot;links&quot; } }, ]); |
| removed | const | 623 | no | const removed = applyUiOperations(added, [{ op: &quot;relationship.remove&quot;, relationshipId: &quot;rel_1&quot; }]); |
| missing | const | 626 | no | const missing = worldError(() =&gt; applyUiOperations(parsedHome(), [ { op: &quot;relationship.add&quot;, relationship: { id: &quot;rel_3&quot;, from: &quot;obj_floor&quot;, to: &quot;ghost&quot;, kind: &quot;links&quot; } }, ]), ); |
| added | const | 636 | no | const added = applyUiOperations(parsedHome(), [ { op: &quot;dataFlow.add&quot;, dataFlow: { id: &quot;flow_2&quot;, |
| removed | const | 651 | no | const removed = applyUiOperations(added, [{ op: &quot;dataFlow.remove&quot;, dataFlowId: &quot;flow_2&quot; }]); |
| badTransform | const | 654 | no | const badTransform = worldError(() =&gt; applyUiOperations(parsedHome(), [ { op: &quot;dataFlow.add&quot;, dataFlow: { |
| result | const | 674 | no | const result = applyUiOperations(parsedHome(), [{ op: &quot;world.setTitle&quot;, title: &quot;Studio&quot; }]); |
| error | const | 677 | no | const error = worldError(() =&gt; applyUiOperations(parsedHome(), [{ op: &quot;world.setTitle&quot;, title: &quot; &quot; }])); |
| error | const | 683 | no | const error = worldError(() =&gt; applyUiOperations(parsedHome(), [{ op: &quot;object.explode&quot; } as unknown as UiOperation]), ); |
| input | const | 691 | no | const input = parsedHome(); |
| before | const | 692 | no | const before = uiDocumentHash(input); |
| error | const | 694 | no | const error = worldError(() =&gt; applyUiOperations(input, [ { op: &quot;object.move&quot;, objectId: &quot;obj_runs&quot;, transform: transformAt(1, 2, 3) }, { op: &quot;object.remove&quot;, objectId: &quot;ghost&quot; }, ]), |
| input | const | 708 | no | const input = parsedHome(); |
| result | const | 709 | no | const result = applyUiOperations(input, []); |
| result | const | 719 | no | const result = applyUiOperations(parsedHome(), [ { op: &quot;object.setProp&quot;, objectId: &quot;obj_floor&quot;, key: &quot;grid&quot;, value: false }, ]); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 10 | external |
| ../src/ui/world.ts | import | 11 | [packages/tierflow/src/ui/world.ts](../src/ui/world.ts.md) |
| ../src/ui/types.ts | import | 21 | [packages/tierflow/src/ui/types.ts](../src/ui/types.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * World document model contract tests.
 *
 * These tests pin the properties the rest of the UI core relies on: a valid
 * world parses deeply frozen, every invalid element is rejected with a stable
 * code and a path, diagnostics collect all problems in one pass, and semantic
 * edits are atomic so a rejected batch never leaves a half-edited document.
 */

import { describe, expect, test } from "bun:test";
import {
  REGISTERED_TRANSFORMS,
  applyUiOperations,
  defaultUiDocument,
  parseUiDocument,
  UiWorldError,
  uiDocumentHash,
  validateUiDocument,
  type UiOperation,
} from "../src/ui/world.ts";
import type { UiDocument, UiWorldKind } from "../src/ui/types.ts";

/** Fixture documents are mutated per test, so they are deliberately loose. */
type MutableDocument = Record<string, any>;

function transformAt(x: number, y: number, z: number) {
  return {
    position: { x, y, z },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  };
}

function homeDocument(): MutableDocument {
  return {
    schemaVersion: 1,
    world: {
      id: "w_home",
      kind: "home",
      title: "Home",
      accent: "#f2b134",
      origin: { x: 0, y: 0, z: 0 },
      unitsPerMeter: 1,
    },
    objects: [
      {
        id: "obj_floor",
        layer: "ground",
        kind: "static",
        shape: "plane",
        title: "Floor",
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 100, y: 100, z: 1 },
        },
        props: { grid: true },
      },
      {
        id: "obj_runs",
        layer: "data",
        kind: "dynamic",
        shape: "billboard",
        title: "Live runs",
        transform: {
          position: { x: 0, y: 2, z: -4 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        props: { value: 0 },
      },
    ],
    relationships: [{ id: "rel_1", from: "obj_floor", to: "obj_runs", kind: "contains" }],
    dataFlows: [
      { id: "flow_1", path: "/runs/live", targetObject: "obj_runs", targetProp: "value", direction: "inbound" },
    ],
  };
}

function parsedHome(): UiDocument {
```

_First 80 of 735 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
