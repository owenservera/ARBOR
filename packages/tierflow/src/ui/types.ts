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
}

/** One placed object on the canvas. */
export interface UiObject {
  readonly id: string;
  readonly layer: UiLayerKind;
  readonly kind: UiObjectKind;
  readonly shape: UiShapeKind;
  readonly title?: string;
  readonly transform: UiTransform;
  readonly props?: Readonly<Record<string, UiScalar>>;
}

/** A typed edge between two objects in the same world. */
export interface UiRelationship {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly kind: UiRelationshipKind;
  readonly label?: string;
}

/**
 * A binding between a state path and an object property.
 *
 * `inbound` pushes a value from the state projection into the object;
 * `outbound` writes an object value back into the state projection.
 */
export interface UiDataFlow {
  readonly id: string;
  readonly path: string;
  readonly targetObject: string;
  readonly targetProp: string;
  readonly direction: UiFlowDirection;
  /** Name of a registered, deterministic transform. */
  readonly transform?: string;
}

/** The space a document describes. */
export interface UiWorld {
  readonly id: string;
  readonly kind: UiWorldKind;
  readonly title: string;
  readonly accent: string;
  readonly origin: UiVec3;
  /** World units per meter. Fixed for a world so scale stays meaningful. */
  readonly unitsPerMeter: number;
}

/** The complete description of one world. */
export interface UiDocument {
  readonly schemaVersion: typeof UI_SCHEMA_VERSION;
  readonly world: UiWorld;
  readonly objects: readonly UiObject[];
  readonly relationships: readonly UiRelationship[];
  readonly dataFlows: readonly UiDataFlow[];
}

/** A published, immutable revision of a world document. */
export interface UiRevision {
  readonly revision: number;
  readonly document: UiDocument;
  readonly contentHash: string;
  readonly createdAt: number;
  readonly actorId: string;
}

/** A private, unpublished working copy of a world document. */
export interface UiDraft {
  readonly draftId: string;
  readonly worldId: string;
  readonly baseRevision: number;
  readonly draftRevision: number;
  readonly document: UiDocument;
  readonly contentHash: string;
  readonly updatedAt: number;
  readonly actorId: string;
}

/** Commands are the only way to change core state. */
export type UiCommandKind =
  | "ui.world.create"
  | "ui.draft.create"
  | "ui.draft.edit"
  | "ui.draft.commit"
  | "ui.draft.discard"
  | "ui.publish"
  | "ui.rollback"
  | "ui.state.set";

export interface UiCommand {
  /** Idempotency key. The same id with the same payload replays its result. */
  readonly commandId: string;
  readonly kind: UiCommandKind;
  readonly actorId: string;
  /** Required for every command that mutates published state. */
  readonly expectedRevision?: number;
  readonly payload?: Readonly<Record<string, unknown>>;
}

export type UiErrorCode =
  | "INVALID_DOCUMENT"
  | "INVALID_COMMAND"
  | "REVISION_CONFLICT"
  | "IDEMPOTENCY_CONFLICT"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "LIMIT_EXCEEDED";

export type UiResult<T> =
  | { readonly ok: true; readonly value: T }
  | {
      readonly ok: false;
      readonly code: UiErrorCode;
      readonly message: string;
      readonly currentRevision?: number;
    };

/**
 * The adapter seam.
 *
 * An adapter turns some external surface into UI commands and observes the
 * resulting revisions. The core implements this interface; adapters call it.
 */
export interface UiCommandPort {
  submit(command: UiCommand): Promise<UiResult<UiRevision>>;
}

export interface UiRevisionFeed {
  subscribe(listener: (revision: UiRevision) => void): () => void;
}

/** Resume cursor. `epoch` changes on every process start. */
export interface UiCursor {
  readonly epoch: string;
  readonly seq: number;
}

/**
 * The minimum event shape the core needs to replay a stream.
 *
 * The core defines this shape itself instead of borrowing a transport's event
 * type, so a surface can feed it any ordered event source.
 */
export interface UiEvent {
  readonly seq: number;
  readonly ts: number;
  readonly type: string;
}

/** An ordered event source whose retained window defines what can replay. */
export interface UiEventSource {
  /** Highest sequence number emitted so far. */
  readonly seq: number;
  /** Oldest sequence number still retained. */
  readonly oldestSeq: number;
  /** Most recent events, oldest first. */
  recent(limit?: number): readonly UiEvent[];
  /** Events after `seq`, oldest first. */
  since(seq: number): readonly UiEvent[];
}

/** Resynchronization payload returned when a client reconnects. */
export interface UiResync {
  readonly epoch: string;
  readonly oldestSeq: number;
  readonly latestSeq: number;
  /** True when the requested cursor can no longer be replayed. */
  readonly gap: boolean;
  readonly revision: number;
}
