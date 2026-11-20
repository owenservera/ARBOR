# File: packages/tierflow/src/ui/types.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/ui/types.ts |
| Language | TypeScript |
| Kind | source |
| Size | 7723 B |
| Lines | 251 |
| Hash | 60942c5d710a |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| UI_SCHEMA_VERSION | const | 21 | yes | export const UI_SCHEMA_VERSION = 1 as const; |
| UI_LAYER_KINDS | const | 31 | yes | export const UI_LAYER_KINDS = [ |
| UiLayerKind | type | 39 | yes | export type UiLayerKind = (typeof UI_LAYER_KINDS)[number]; |
| UI_SHAPE_KINDS | const | 42 | yes | export const UI_SHAPE_KINDS = [ |
| UiShapeKind | type | 51 | yes | export type UiShapeKind = (typeof UI_SHAPE_KINDS)[number]; |
| UI_RELATIONSHIP_KINDS | const | 54 | yes | export const UI_RELATIONSHIP_KINDS = [&quot;contains&quot;, &quot;links&quot;, &quot;drives&quot;, &quot;mirrors&quot;] as const; |
| UiRelationshipKind | type | 56 | yes | export type UiRelationshipKind = (typeof UI_RELATIONSHIP_KINDS)[number]; |
| UiObjectKind | type | 59 | yes | export type UiObjectKind = &quot;static&quot; \| &quot;dynamic&quot;; |
| UiWorldKind | type | 62 | yes | export type UiWorldKind = &quot;home&quot; \| &quot;custom&quot;; |
| UiFlowDirection | type | 65 | yes | export type UiFlowDirection = &quot;inbound&quot; \| &quot;outbound&quot;; |
| UiScalar | type | 67 | yes | export type UiScalar = string \| number \| boolean \| null; |
| UiVec3 | interface | 70 | yes | export interface UiVec3 { |
| UiTransform | interface | 77 | yes | export interface UiTransform { |
| UiObject | interface | 84 | yes | export interface UiObject { |
| UiRelationship | interface | 95 | yes | export interface UiRelationship { |
| UiDataFlow | interface | 109 | yes | export interface UiDataFlow { |
| UiWorld | interface | 120 | yes | export interface UiWorld { |
| UiDocument | interface | 131 | yes | export interface UiDocument { |
| UiRevision | interface | 140 | yes | export interface UiRevision { |
| UiDraft | interface | 149 | yes | export interface UiDraft { |
| UiCommandKind | type | 161 | yes | export type UiCommandKind = |
| UiCommand | interface | 171 | yes | export interface UiCommand { |
| UiErrorCode | type | 181 | yes | export type UiErrorCode = |
| UiResult | type | 190 | yes | export type UiResult&lt;T&gt; = |
| UiCommandPort | interface | 205 | yes | export interface UiCommandPort { |
| UiRevisionFeed | interface | 209 | yes | export interface UiRevisionFeed { |
| UiCursor | interface | 214 | yes | export interface UiCursor { |
| UiEvent | interface | 225 | yes | export interface UiEvent { |
| UiEventSource | interface | 232 | yes | export interface UiEventSource { |
| UiResync | interface | 244 | yes | export interface UiResync { |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/surfaces/http.ts](../surfaces/http.ts.md) | ../ui/types.ts |
| [packages/tierflow/src/surfaces/websocket.ts](../surfaces/websocket.ts.md) | ../ui/types.ts |
| [packages/tierflow/src/ui/hash.ts](./hash.ts.md) | ./types.ts |
| [packages/tierflow/src/ui/realtime.ts](./realtime.ts.md) | ./types.ts |
| [packages/tierflow/src/ui/store.ts](./store.ts.md) | ./types.ts |
| [packages/tierflow/src/visual-runtime/final-wave/integration/world-visual-bridge.ts](../visual-runtime/final-wave/integration/world-visual-bridge.ts.md) | ../../../ui/types.ts |
| [packages/tierflow/src/visual-runtime/final-wave/lane-b/studio-editing.ts](../visual-runtime/final-wave/lane-b/studio-editing.ts.md) | ../../../ui/types.ts |
| [packages/tierflow/src/visual-runtime/revisions/wave3-atomic-replay.ts](../visual-runtime/revisions/wave3-atomic-replay.ts.md) | ../../ui/types.ts |
| [packages/tierflow/tests/ui-commands.test.ts](../../tests/ui-commands.test.ts.md) | ../src/ui/types.ts |
| [packages/tierflow/tests/ui-http-surface.test.ts](../../tests/ui-http-surface.test.ts.md) | ../src/ui/types.ts |
| [packages/tierflow/tests/ui-store.test.ts](../../tests/ui-store.test.ts.md) | ../src/ui/types.ts |
| [packages/tierflow/tests/ui-websocket-surface.test.ts](../../tests/ui-websocket-surface.test.ts.md) | ../src/ui/types.ts |
| [packages/tierflow/tests/ui-websocket-surface.test.ts](../../tests/ui-websocket-surface.test.ts.md) | ../src/ui/types.ts |
| [packages/tierflow/tests/ui-world.test.ts](../../tests/ui-world.test.ts.md) | ../src/ui/types.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/world-visual-bridge.refusals.test.ts](../../tests/visual-runtime/final-wave/integration/world-visual-bridge.refusals.test.ts.md) | ../../../../src/ui/types.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/world-visual-bridge.test.ts](../../tests/visual-runtime/final-wave/integration/world-visual-bridge.test.ts.md) | ../../../../src/ui/types.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-b/studio-editing.test.ts](../../tests/visual-runtime/final-wave/lane-b/studio-editing.test.ts.md) | ../../../../src/ui/types.ts |
| [packages/tierflow/tests/visual-runtime/integration-3.test.ts](../../tests/visual-runtime/integration-3.test.ts.md) | ../../src/ui/types.ts |
| [packages/tierflow/tests/visual-runtime/wave3-c-replay.test.ts](../../tests/visual-runtime/wave3-c-replay.test.ts.md) | ../../src/ui/types.ts |
| [packages/tierflow/tests/visual-runtime/wave4-d-session-reconcile.test.ts](../../tests/visual-runtime/wave4-d-session-reconcile.test.ts.md) | ../../src/ui/types.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Shared UI-core types.
 *
 * The UI core owns a **world**: an infinite 3D canvas described as data.
 * Every user-facing surface — a phone app, a browser studio, a conversational
 * adapter, a future external host — submits `UiCommand`s to the core and
 * observes revisions. The core never imports an adapter and knows nothing
 * about any particular client.
 *
 * Core vocabulary:
 * - **canonical layers** — a fixed, ordered set of semantic layers every
 *   world uses, so an object means the same thing in any world;
 * - **objects** — static (fixed) or dynamic (driven by data flows);
 * - **relationships** — typed edges between objects;
 * - **data flows** — typed bindings between state paths and object
 *   properties, in both directions;
 * - **worlds** — one home world plus any number of custom worlds.
 */

/** Schema version of the world document. Independent of any wire protocol. */
export const UI_SCHEMA_VERSION = 1 as const;

/**
 * Canonical layers, in render order.
 *
 * Every world uses exactly these layers. `ground` is the spatial substrate,
 * `structure` holds layout and framing, `content` holds the primary objects a
 * user reads, `data` holds live instrumentation, and `overlay` holds chrome
 * that floats above everything else.
 */
export const UI_LAYER_KINDS = [
  "ground",
  "structure",
  "content",
  "data",
  "overlay",
] as const;

export type UiLayerKind = (typeof UI_LAYER_KINDS)[number];

/** Closed shape vocabulary. Custom geometry is not user-executable code. */
export const UI_SHAPE_KINDS = [
  "box",
  "sphere",
  "cylinder",
  "plane",
  "text",
  "billboard",
] as const;

export type UiShapeKind = (typeof UI_SHAPE_KINDS)[number];

/** Typed edges between objects. `contains` must stay acyclic. */
export const UI_RELATIONSHIP_KINDS = ["contains", "links", "drives", "mirrors"] as const;

export type UiRelationshipKind = (typeof UI_RELATIONSHIP_KINDS)[number];

/** Static objects never change; dynamic objects are driven by data flows. */
export type UiObjectKind = "static" | "dynamic";

/** The home world is the default; custom worlds are user-created spaces. */
export type UiWorldKind = "home" | "custom";

/** Direction of a data flow. */
export type UiFlowDirection = "inbound" | "outbound";

export type UiScalar = string | number | boolean | null;

/** A point or vector in world space. Unbounded on an infinite canvas. */
export interface UiVec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** Placement of an object in world space. */
export interface UiTransform {
  readonly position: UiVec3;
  readonly rotation: UiVec3;
  readonly scale: UiVec3;
```

_First 80 of 252 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
