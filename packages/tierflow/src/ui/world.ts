/**
 * World document model for the UI core.
 *
 * A document describes exactly one world: the infinite 3D canvas a user sees.
 * This module owns the document grammar and the semantic edits applied to it:
 * parsing, whole-document validation, the default world, content hashing, and
 * the operation log that turns a document into its next frozen revision.
 *
 * Everything here is pure. No I/O, no store, no transport, no adapter. A parsed
 * document is deeply frozen, so callers can share it across revisions without
 * defensive copying, and hashing it is deterministic. Validation is total:
 * `validateUiDocument` reports every problem with a path instead of stopping at
 * the first one, while `parseUiDocument` throws one typed error per document.
 */

import { contentHash } from "./hash.ts";
import {
  UI_LAYER_KINDS,
  UI_RELATIONSHIP_KINDS,
  UI_SCHEMA_VERSION,
  UI_SHAPE_KINDS,
  type UiDataFlow,
  type UiDocument,
  type UiFlowDirection,
  type UiLayerKind,
  type UiObject,
  type UiObjectKind,
  type UiRelationship,
  type UiRelationshipKind,
  type UiScalar,
  type UiShapeKind,
  type UiTransform,
  type UiVec3,
  type UiWorld,
  type UiWorldKind,
} from "./types.ts";

/** Ids are opaque, stable, and unique within one document. */
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/** `#rgb` or `#rrggbb`. */
const ACCENT_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Absolute state path under the exposed projection, no query, no expression. */
const STATE_PATH_PATTERN = /^\/[A-Za-z0-9_\-/.]*$/;

/** Property name a flow writes into an object. */
const PROP_NAME_PATTERN = /^[A-Za-z0-9_\-]{1,64}$/;

/** Longest accepted world title, object title and relationship label. */
const MAX_TITLE_LENGTH = 120;

/**
 * Deterministic transform names a data flow may reference.
 *
 * The set is closed on purpose: a renderer must be able to reproduce a value
 * from a path and a name alone, so no flow carries code, a function, or an
 * expression. An unregistered name is rejected rather than ignored.
 */
export const REGISTERED_TRANSFORMS: readonly string[] = Object.freeze([
  "identity",
  "count",
  "percent",
  "ratio",
  "duration",
  "label",
  "boolean",
  "currency",
]);

/** Stable failure codes of the world document model. */
export type UiWorldErrorCode =
  | "invalid_world"
  | "invalid_object"
  | "invalid_relationship"
  | "invalid_data_flow"
  | "invalid_transform"
  | "duplicate_id"
  | "missing_reference"
  | "cycle"
  | "invalid_layer"
  | "invalid_shape"
  | "invalid_kind"
  | "invalid_path"
  | "invalid_transform_name"
  | "invalid_operation";

/**
 * A document or edit the world model refused.
 *
 * `path` points at the offending element using the same syntax diagnostics use
 * (`world.accent`, `objects[2].layer`), and `code` is stable so a caller can map
 * the failure onto its own error vocabulary without parsing `message`.
 */
export class UiWorldError extends Error {
  readonly code: UiWorldErrorCode;
  readonly path: string;
  override name = "UiWorldError";

  constructor(code: UiWorldErrorCode, path: string, message: string) {
    super(message);
    this.code = code;
    this.path = path;
  }
}

/** One problem found while inspecting a document. */
export interface UiDocumentDiagnostic {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

/**
 * A semantic edit to a world document.
 *
 * Operations are declarative, ordered, and applied to a copy: the caller's
 * document is never mutated, and a rejected operation leaves no partial state
 * behind. Cross-object rules are checked once at the end, so an add followed by
 * a flow that feeds it is legal even though the intermediate state is not.
 */
export type UiOperation =
  | { op: "object.add"; object: UiObject }
  | { op: "object.remove"; objectId: string }
  | { op: "object.move"; objectId: string; transform: UiTransform }
  | { op: "object.setProp"; objectId: string; key: string; value: UiScalar | undefined }
  | { op: "object.setLayer"; objectId: string; layer: UiLayerKind }
  | { op: "object.setKind"; objectId: string; kind: UiObjectKind }
  | { op: "relationship.add"; relationship: UiRelationship }
  | { op: "relationship.remove"; relationshipId: string }
  | { op: "dataFlow.add"; dataFlow: UiDataFlow }
  | { op: "dataFlow.remove"; dataFlowId: string }
  | { op: "world.setTitle"; title: string };

/**
 * Mutable mirror of a readonly document type.
 *
 * Edits happen on a private copy so the input document, and everything already
 * published from it, stays untouched and frozen.
 */
type DeepMutable<T> = T extends readonly (infer U)[]
  ? DeepMutable<U>[]
  : T extends object
    ? { -readonly [K in keyof T]: DeepMutable<T[K]> }
    : T;

/** Diagnostics plus the error counter used to decide whether a value is valid. */
interface Collector {
  readonly diagnostics: UiDocumentDiagnostic[];
  errors: number;
}

interface Inspection {
  readonly diagnostics: UiDocumentDiagnostic[];
  /** Present only when `diagnostics` contains no error. */
  readonly document: DeepMutable<UiDocument> | null;
}

function fail(collector: Collector, code: UiWorldErrorCode, path: string, message: string): void {
  collector.diagnostics.push({ severity: "error", code, path, message });
  collector.errors += 1;
}

function warn(collector: Collector, code: string, path: string, message: string): void {
  collector.diagnostics.push({ severity: "warning", code, path, message });
}

function firstError(diagnostics: readonly UiDocumentDiagnostic[]): UiDocumentDiagnostic | undefined {
  return diagnostics.find((diagnostic) => diagnostic.severity === "error");
}

function throwFirstError(collector: Collector, fallbackPath: string): never {
  const failure = firstError(collector.diagnostics);
  if (failure === undefined) {
    throw new UiWorldError("invalid_object", fallbackPath, "value is not a valid document element");
  }
  throw new UiWorldError(failure.code as UiWorldErrorCode, failure.path, failure.message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isScalar(value: unknown): value is UiScalar {
  if (value === null) return true;
  switch (typeof value) {
    case "string":
    case "boolean":
      return true;
    case "number":
      return Number.isFinite(value);
    default:
      return false;
  }
}

function isLayerKind(value: unknown): value is UiLayerKind {
  return typeof value === "string" && (UI_LAYER_KINDS as readonly string[]).includes(value);
}

function isShapeKind(value: unknown): value is UiShapeKind {
  return typeof value === "string" && (UI_SHAPE_KINDS as readonly string[]).includes(value);
}

function isObjectKind(value: unknown): value is UiObjectKind {
  return value === "static" || value === "dynamic";
}

function isRelationshipKind(value: unknown): value is UiRelationshipKind {
  return typeof value === "string" && (UI_RELATIONSHIP_KINDS as readonly string[]).includes(value);
}

function isWorldKind(value: unknown): value is UiWorldKind {
  return value === "home" || value === "custom";
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}

function describeValue(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "object") return Array.isArray(value) ? "an array" : "an object";
  return String(value);
}

/** Define an own enumerable prop, so key `"__proto__"` stays data, not prototype. */
function defineProp(target: Record<string, UiScalar>, key: string, value: UiScalar): void {
  Object.defineProperty(target, key, { value, enumerable: true, writable: true, configurable: true });
}

function requireString(value: unknown, path: string, code: UiWorldErrorCode): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new UiWorldError(code, path, "must be a non-empty string");
  }
  return value;
}

function collectId(
  value: unknown,
  path: string,
  seen: Map<string, string>,
  code: UiWorldErrorCode,
  collector: Collector,
): string | null {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) {
    fail(collector, code, path, 'id must be 1-64 characters from A-Z, a-z, 0-9, "_" and "-"');
    return null;
  }
  const firstUse = seen.get(value);
  if (firstUse !== undefined) {
    fail(collector, "duplicate_id", path, `id ${JSON.stringify(value)} is already used by ${firstUse}`);
    return null;
  }
  seen.set(value, path);
  return value;
}

function collectVec3(
  value: unknown,
  path: string,
  code: UiWorldErrorCode,
  collector: Collector,
): DeepMutable<UiVec3> | null {
  if (!isRecord(value)) {
    fail(collector, code, path, "must be an object with finite numeric x, y and z");
    return null;
  }
  const before = collector.errors;
  const vector: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  const axes = ["x", "y", "z"] as const;
  for (const axis of axes) {
    const component = value[axis];
    if (typeof component !== "number" || !Number.isFinite(component)) {
      fail(collector, code, `${path}.${axis}`, "must be a finite number");
      continue;
    }
    vector[axis] = component;
  }
  return collector.errors === before ? vector : null;
}

function collectTransform(
  value: unknown,
  path: string,
  collector: Collector,
): DeepMutable<UiTransform> | null {
  if (!isRecord(value)) {
    fail(collector, "invalid_transform", path, "must be an object with position, rotation and scale");
    return null;
  }
  const before = collector.errors;
  const position = collectVec3(value["position"], `${path}.position`, "invalid_transform", collector);
  const rotation = collectVec3(value["rotation"], `${path}.rotation`, "invalid_transform", collector);
  const scale = collectVec3(value["scale"], `${path}.scale`, "invalid_transform", collector);

  if (scale !== null) {
    const axes = ["x", "y", "z"] as const;
    for (const axis of axes) {
      if (scale[axis] === 0) {
        fail(collector, "invalid_transform", `${path}.scale.${axis}`, "scale components must be non-zero");
      }
    }
  }

  if (position === null || rotation === null || scale === null || collector.errors > before) return null;
  return { position, rotation, scale };
}

function collectProps(
  value: unknown,
  path: string,
  collector: Collector,
): Record<string, UiScalar> | null {
  if (!isRecord(value)) {
    fail(collector, "invalid_object", path, "must be a plain object of scalar props");
    return null;
  }
  const before = collector.errors;
  const props: Record<string, UiScalar> = {};
  for (const key of Object.keys(value)) {
    const entry = value[key];
    if (!isScalar(entry)) {
      fail(collector, "invalid_object", `${path}.${key}`, "props must be a string, finite number, boolean or null");
      continue;
    }
    defineProp(props, key, entry);
  }
  return collector.errors === before ? props : null;
}

function collectObject(
  value: unknown,
  path: string,
  seen: Map<string, string>,
  collector: Collector,
): DeepMutable<UiObject> | null {
  if (!isRecord(value)) {
    fail(collector, "invalid_object", path, "must be an object");
    return null;
  }
  const before = collector.errors;

  const id = collectId(value["id"], `${path}.id`, seen, "invalid_object", collector);

  const layerValue = value["layer"];
  let layer: UiLayerKind | null = null;
  if (isLayerKind(layerValue)) {
    layer = layerValue;
  } else {
    fail(collector, "invalid_layer", `${path}.layer`, `must be one of ${UI_LAYER_KINDS.join(", ")}`);
  }

  const kindValue = value["kind"];
  let kind: UiObjectKind | null = null;
  if (isObjectKind(kindValue)) {
    kind = kindValue;
  } else {
    fail(collector, "invalid_kind", `${path}.kind`, 'must be "static" or "dynamic"');
  }

  const shapeValue = value["shape"];
  let shape: UiShapeKind | null = null;
  if (isShapeKind(shapeValue)) {
    shape = shapeValue;
  } else {
    fail(collector, "invalid_shape", `${path}.shape`, `must be one of ${UI_SHAPE_KINDS.join(", ")}`);
  }

  let title: string | undefined;
  const titleValue = value["title"];
  if (titleValue !== undefined) {
    if (typeof titleValue !== "string" || titleValue.length > MAX_TITLE_LENGTH) {
      fail(collector, "invalid_object", `${path}.title`, `must be a string of at most ${MAX_TITLE_LENGTH} characters`);
    } else {
      title = titleValue;
    }
  }

  const transform = collectTransform(value["transform"], `${path}.transform`, collector);

  let props: Record<string, UiScalar> | undefined;
  const propsValue = value["props"];
  if (propsValue !== undefined) {
    const collected = collectProps(propsValue, `${path}.props`, collector);
    if (collected !== null) props = collected;
  }

  if (id === null || layer === null || kind === null || shape === null || transform === null) return null;
  if (collector.errors > before) return null;

  const object: DeepMutable<UiObject> = { id, layer, kind, shape, transform };
  if (title !== undefined) object.title = title;
  if (props !== undefined) object.props = props;
  return object;
}

function collectReference(
  value: unknown,
  path: string,
  objectIds: ReadonlySet<string> | null,
  code: UiWorldErrorCode,
  collector: Collector,
): string | null {
  if (typeof value !== "string") {
    fail(collector, code, path, "must be an object id string");
    return null;
  }
  if (objectIds !== null && !objectIds.has(value)) {
    fail(collector, "missing_reference", path, `object ${JSON.stringify(value)} does not exist in this document`);
    return null;
  }
  return value;
}

function collectRelationship(
  value: unknown,
  path: string,
  seen: Map<string, string>,
  objectIds: ReadonlySet<string> | null,
  collector: Collector,
): DeepMutable<UiRelationship> | null {
  if (!isRecord(value)) {
    fail(collector, "invalid_relationship", path, "must be an object");
    return null;
  }
  const before = collector.errors;

  const id = collectId(value["id"], `${path}.id`, seen, "invalid_relationship", collector);
  const from = collectReference(value["from"], `${path}.from`, objectIds, "invalid_relationship", collector);
  const to = collectReference(value["to"], `${path}.to`, objectIds, "invalid_relationship", collector);

  const kindValue = value["kind"];
  let kind: UiRelationshipKind | null = null;
  if (isRelationshipKind(kindValue)) {
    kind = kindValue;
  } else {
    fail(collector, "invalid_relationship", `${path}.kind`, `must be one of ${UI_RELATIONSHIP_KINDS.join(", ")}`);
  }

  let label: string | undefined;
  const labelValue = value["label"];
  if (labelValue !== undefined) {
    if (typeof labelValue !== "string" || labelValue.length > MAX_TITLE_LENGTH) {
      fail(collector, "invalid_relationship", `${path}.label`, `must be a string of at most ${MAX_TITLE_LENGTH} characters`);
    } else {
      label = labelValue;
      if (labelValue.length === 0) {
        warn(collector, "empty_relationship_label", `${path}.label`, "label is empty; omit it instead");
      }
    }
  }

  if (id === null || from === null || to === null || kind === null) return null;
  if (collector.errors > before) return null;

  const relationship: DeepMutable<UiRelationship> = { id, from, to, kind };
  if (label !== undefined) relationship.label = label;
  return relationship;
}

function collectDataFlow(
  value: unknown,
  path: string,
  seen: Map<string, string>,
  objectIds: ReadonlySet<string> | null,
  collector: Collector,
): DeepMutable<UiDataFlow> | null {
  if (!isRecord(value)) {
    fail(collector, "invalid_data_flow", path, "must be an object");
    return null;
  }
  const before = collector.errors;

  const id = collectId(value["id"], `${path}.id`, seen, "invalid_data_flow", collector);

  const pathValue = value["path"];
  let statePath: string | null = null;
  if (typeof pathValue !== "string" || !STATE_PATH_PATTERN.test(pathValue) || pathValue.endsWith("/")) {
    fail(collector, "invalid_path", `${path}.path`, 'must be an absolute state path such as "/runs/live" with no trailing slash');
  } else {
    statePath = pathValue;
    const segments = statePath.slice(1).split("/");
    if (segments.some((segment) => /[A-Z]/.test(segment))) {
      warn(collector, "uppercase_path_segment", `${path}.path`, "state paths are lower-case by convention");
    }
  }

  const targetObject = collectReference(value["targetObject"], `${path}.targetObject`, objectIds, "invalid_data_flow", collector);

  const targetPropValue = value["targetProp"];
  let targetProp: string | null = null;
  if (typeof targetPropValue !== "string" || !PROP_NAME_PATTERN.test(targetPropValue)) {
    fail(collector, "invalid_data_flow", `${path}.targetProp`, 'must be 1-64 characters from A-Z, a-z, 0-9, "_" and "-"');
  } else {
    targetProp = targetPropValue;
  }

  const directionValue = value["direction"];
  let direction: UiFlowDirection | null = null;
  if (directionValue === "inbound" || directionValue === "outbound") {
    direction = directionValue;
  } else {
    fail(collector, "invalid_data_flow", `${path}.direction`, 'must be "inbound" or "outbound"');
  }

  let transformName: string | undefined;
  const transformValue = value["transform"];
  if (transformValue !== undefined) {
    if (typeof transformValue !== "string" || !REGISTERED_TRANSFORMS.includes(transformValue)) {
      fail(
        collector,
        "invalid_transform_name",
        `${path}.transform`,
        `must be one of ${REGISTERED_TRANSFORMS.join(", ")}`,
      );
    } else {
      transformName = transformValue;
    }
  }

  if (id === null || statePath === null || targetObject === null || targetProp === null || direction === null) return null;
  if (collector.errors > before) return null;

  const flow: DeepMutable<UiDataFlow> = { id, path: statePath, targetObject, targetProp, direction };
  if (transformName !== undefined) flow.transform = transformName;
  return flow;
}

function collectWorld(value: unknown, collector: Collector): DeepMutable<UiWorld> | null {
  if (!isRecord(value)) {
    fail(collector, "invalid_world", "world", "must be an object");
    return null;
  }
  const before = collector.errors;

  const id = collectId(value["id"], "world.id", new Map<string, string>(), "invalid_world", collector);

  const kindValue = value["kind"];
  let kind: UiWorldKind | null = null;
  if (isWorldKind(kindValue)) {
    kind = kindValue;
  } else {
    fail(collector, "invalid_world", "world.kind", 'must be "home" or "custom"');
  }

  let title: string | null = null;
  const titleValue = value["title"];
  if (typeof titleValue !== "string") {
    fail(collector, "invalid_world", "world.title", "must be a string");
  } else {
    const trimmed = titleValue.trim();
    if (trimmed.length < 1 || trimmed.length > MAX_TITLE_LENGTH) {
      fail(collector, "invalid_world", "world.title", `must be 1-${MAX_TITLE_LENGTH} characters after trimming`);
    } else {
      title = titleValue;
    }
  }

  const accentValue = value["accent"];
  let accent: string | null = null;
  if (typeof accentValue !== "string" || !ACCENT_PATTERN.test(accentValue)) {
    fail(collector, "invalid_world", "world.accent", 'must be "#rgb" or "#rrggbb"');
  } else {
    accent = accentValue;
  }

  const origin = collectVec3(value["origin"], "world.origin", "invalid_world", collector);

  const unitsValue = value["unitsPerMeter"];
  let unitsPerMeter: number | null = null;
  if (typeof unitsValue !== "number" || !Number.isFinite(unitsValue) || unitsValue <= 0) {
    fail(collector, "invalid_world", "world.unitsPerMeter", "must be a finite number greater than zero");
  } else {
    unitsPerMeter = unitsValue;
  }

  if (id === null || kind === null || title === null || accent === null || origin === null || unitsPerMeter === null) return null;
  if (collector.errors > before) return null;

  return { id, kind, title, accent, origin, unitsPerMeter };
}

/**
 * Report every `contains` cycle once, with the chain of object ids that closes it.
 *
 * `contains` describes ownership, so a cycle has no valid interpretation: an
 * object would be its own ancestor. The diagnostic names the closing edge and
 * prints the path, which is what a user needs to break the loop.
 */
function reportContainsCycles(
  relationships: ReadonlyArray<{ relation: DeepMutable<UiRelationship>; index: number } | null>,
  objectIds: ReadonlySet<string>,
  collector: Collector,
): void {
  const adjacency = new Map<string, Array<{ to: string; index: number }>>();
  for (const entry of relationships) {
    if (entry === null || entry.relation.kind !== "contains") continue;
    const edge = { to: entry.relation.to, index: entry.index };
    const edges = adjacency.get(entry.relation.from);
    if (edges === undefined) adjacency.set(entry.relation.from, [edge]);
    else edges.push(edge);
  }

  const state = new Map<string, 1 | 2>();
  const idPath: string[] = [];
  const pathIndex = new Map<string, number>();
  const frames: Array<{ node: string; edges: ReadonlyArray<{ to: string; index: number }>; cursor: number }> = [];

  const enter = (node: string): void => {
    state.set(node, 1);
    pathIndex.set(node, idPath.length);
    idPath.push(node);
    frames.push({ node, edges: adjacency.get(node) ?? [], cursor: 0 });
  };

  for (const root of adjacency.keys()) {
    if (state.get(root) !== undefined) continue;
    enter(root);
    while (frames.length > 0) {
      const frame = frames[frames.length - 1]!;
      if (frame.cursor >= frame.edges.length) {
        frames.pop();
        idPath.pop();
        pathIndex.delete(frame.node);
        state.set(frame.node, 2);
        continue;
      }
      const edge = frame.edges[frame.cursor]!;
      frame.cursor += 1;
      if (!objectIds.has(edge.to)) continue;
      const visited = state.get(edge.to);
      if (visited === 1) {
        const start = pathIndex.get(edge.to) ?? 0;
        const chain = [...idPath.slice(start), edge.to].join(" -> ");
        fail(collector, "cycle", `relationships[${edge.index}]`, `contains relationships form a cycle: ${chain}`);
        return;
      }
      if (visited === 2) continue;
      enter(edge.to);
    }
  }
}

/**
 * Check the rules that span several elements.
 *
 * These are the invariants a single element cannot prove on its own: a dynamic
 * object needs an inbound flow to have anything to show, a static object must
 * stay authored, and `contains` must remain a forest.
 */
function collectCrossRules(
  objects: ReadonlyArray<DeepMutable<UiObject> | null>,
  relationships: ReadonlyArray<{ relation: DeepMutable<UiRelationship>; index: number } | null>,
  dataFlows: ReadonlyArray<{ flow: DeepMutable<UiDataFlow>; index: number } | null>,
  objectIds: ReadonlySet<string> | null,
  collector: Collector,
): void {
  if (objectIds === null) return;

  const inbound = new Map<string, number>();
  for (const entry of dataFlows) {
    if (entry === null || entry.flow.direction !== "inbound") continue;
    inbound.set(entry.flow.targetObject, (inbound.get(entry.flow.targetObject) ?? 0) + 1);
  }

  for (let index = 0; index < objects.length; index += 1) {
    const object = objects[index] ?? null;
    if (object === null) continue;
    const count = inbound.get(object.id) ?? 0;
    if (object.kind === "dynamic" && count === 0) {
      fail(
        collector,
        "invalid_object",
        `objects[${index}].kind`,
        `dynamic object ${JSON.stringify(object.id)} needs at least one inbound data flow`,
      );
    }
    if (object.kind === "static" && count > 0) {
      fail(
        collector,
        "invalid_object",
        `objects[${index}].kind`,
        `static object ${JSON.stringify(object.id)} must not have an inbound data flow`,
      );
    }
  }

  reportContainsCycles(relationships, objectIds, collector);
}

/**
 * Inspect untrusted input once, collecting diagnostics and a normalised copy.
 *
 * Elements that fail their own checks are dropped from the copy, but every
 * problem is still reported, so a caller can fix a document in one pass instead
 * of one error per attempt.
 */
function inspectDocument(input: unknown): Inspection {
  const collector: Collector = { diagnostics: [], errors: 0 };

  if (!isRecord(input)) {
    fail(collector, "invalid_world", "document", "document must be an object");
    return { diagnostics: collector.diagnostics, document: null };
  }

  if (input["schemaVersion"] !== UI_SCHEMA_VERSION) {
    fail(collector, "invalid_world", "schemaVersion", `must be ${UI_SCHEMA_VERSION}`);
  }

  const world = collectWorld(input["world"], collector);
  const seen = new Map<string, string>();

  const objectsValue = input["objects"];
  const objects: Array<DeepMutable<UiObject> | null> = [];
  let objectIds: Set<string> | null = null;
  if (!Array.isArray(objectsValue)) {
    fail(collector, "invalid_object", "objects", "must be an array");
  } else {
    for (let index = 0; index < objectsValue.length; index += 1) {
      objects.push(collectObject(objectsValue[index], `objects[${index}]`, seen, collector));
    }
    objectIds = new Set<string>();
    for (const object of objects) {
      if (object !== null) objectIds.add(object.id);
    }
    if (objects.length === 0) {
      warn(collector, "empty_world", "objects", "a world with no objects renders nothing");
    }
  }

  const titles = new Map<string, string>();
  for (let index = 0; index < objects.length; index += 1) {
    const object = objects[index] ?? null;
    if (object === null || object.title === undefined || object.title.length === 0) continue;
    const firstUse = titles.get(object.title);
    if (firstUse === undefined) {
      titles.set(object.title, `objects[${index}].title`);
    } else {
      warn(
        collector,
        "duplicate_title",
        `objects[${index}].title`,
        `title ${JSON.stringify(object.title)} is already used by ${firstUse}`,
      );
    }
  }

  const relationshipsValue = input["relationships"];
  const relationships: Array<{ relation: DeepMutable<UiRelationship>; index: number } | null> = [];
  if (!Array.isArray(relationshipsValue)) {
    fail(collector, "invalid_relationship", "relationships", "must be an array");
  } else {
    for (let index = 0; index < relationshipsValue.length; index += 1) {
      const relation = collectRelationship(
        relationshipsValue[index],
        `relationships[${index}]`,
        seen,
        objectIds,
        collector,
      );
      relationships.push(relation === null ? null : { relation, index });
    }
  }

  const dataFlowsValue = input["dataFlows"];
  const dataFlows: Array<{ flow: DeepMutable<UiDataFlow>; index: number } | null> = [];
  if (!Array.isArray(dataFlowsValue)) {
    fail(collector, "invalid_data_flow", "dataFlows", "must be an array");
  } else {
    for (let index = 0; index < dataFlowsValue.length; index += 1) {
      const flow = collectDataFlow(dataFlowsValue[index], `dataFlows[${index}]`, seen, objectIds, collector);
      dataFlows.push(flow === null ? null : { flow, index });
    }
  }

  collectCrossRules(objects, relationships, dataFlows, objectIds, collector);

  if (collector.errors > 0 || world === null) {
    return { diagnostics: collector.diagnostics, document: null };
  }

  return {
    diagnostics: collector.diagnostics,
    document: {
      schemaVersion: UI_SCHEMA_VERSION,
      world,
      objects: objects.filter(isPresent),
      relationships: relationships.filter(isPresent).map((entry) => entry.relation),
      dataFlows: dataFlows.filter(isPresent).map((entry) => entry.flow),
    },
  };
}

function freezeVec3(vector: DeepMutable<UiVec3>): UiVec3 {
  return Object.freeze({ x: vector.x, y: vector.y, z: vector.z });
}

function freezeTransform(transform: DeepMutable<UiTransform>): UiTransform {
  return Object.freeze({
    position: freezeVec3(transform.position),
    rotation: freezeVec3(transform.rotation),
    scale: freezeVec3(transform.scale),
  });
}

function copyProps(props: Readonly<Record<string, UiScalar>>): Record<string, UiScalar> {
  const copy: Record<string, UiScalar> = {};
  for (const key of Object.keys(props)) {
    const value = props[key];
    if (value === undefined) continue;
    defineProp(copy, key, value);
  }
  return copy;
}

function freezeObject(object: DeepMutable<UiObject>): UiObject {
  const frozen: {
    id: string;
    layer: UiLayerKind;
    kind: UiObjectKind;
    shape: UiShapeKind;
    title?: string;
    transform: UiTransform;
    props?: Readonly<Record<string, UiScalar>>;
  } = {
    id: object.id,
    layer: object.layer,
    kind: object.kind,
    shape: object.shape,
    transform: freezeTransform(object.transform),
  };
  if (object.title !== undefined) frozen.title = object.title;
  if (object.props !== undefined) frozen.props = Object.freeze(copyProps(object.props));
  return Object.freeze(frozen);
}

function freezeRelationship(relationship: DeepMutable<UiRelationship>): UiRelationship {
  const frozen: { id: string; from: string; to: string; kind: UiRelationshipKind; label?: string } = {
    id: relationship.id,
    from: relationship.from,
    to: relationship.to,
    kind: relationship.kind,
  };
  if (relationship.label !== undefined) frozen.label = relationship.label;
  return Object.freeze(frozen);
}

function freezeDataFlow(flow: DeepMutable<UiDataFlow>): UiDataFlow {
  const frozen: {
    id: string;
    path: string;
    targetObject: string;
    targetProp: string;
    direction: UiFlowDirection;
    transform?: string;
  } = {
    id: flow.id,
    path: flow.path,
    targetObject: flow.targetObject,
    targetProp: flow.targetProp,
    direction: flow.direction,
  };
  if (flow.transform !== undefined) frozen.transform = flow.transform;
  return Object.freeze(frozen);
}

function freezeWorld(world: DeepMutable<UiWorld>): UiWorld {
  return Object.freeze({
    id: world.id,
    kind: world.kind,
    title: world.title,
    accent: world.accent,
    origin: freezeVec3(world.origin),
    unitsPerMeter: world.unitsPerMeter,
  });
}

/** Freeze `document` and every object it contains, bottom up. */
function freezeDocument(document: DeepMutable<UiDocument>): UiDocument {
  return Object.freeze({
    schemaVersion: UI_SCHEMA_VERSION,
    world: freezeWorld(document.world),
    objects: Object.freeze(document.objects.map(freezeObject)),
    relationships: Object.freeze(document.relationships.map(freezeRelationship)),
    dataFlows: Object.freeze(document.dataFlows.map(freezeDataFlow)),
  });
}

function cloneVec3(vector: UiVec3): DeepMutable<UiVec3> {
  return { x: vector.x, y: vector.y, z: vector.z };
}

function cloneObject(object: UiObject): DeepMutable<UiObject> {
  const clone: DeepMutable<UiObject> = {
    id: object.id,
    layer: object.layer,
    kind: object.kind,
    shape: object.shape,
    transform: {
      position: cloneVec3(object.transform.position),
      rotation: cloneVec3(object.transform.rotation),
      scale: cloneVec3(object.transform.scale),
    },
  };
  if (object.title !== undefined) clone.title = object.title;
  if (object.props !== undefined) clone.props = copyProps(object.props);
  return clone;
}

function cloneRelationship(relationship: UiRelationship): DeepMutable<UiRelationship> {
  const clone: DeepMutable<UiRelationship> = {
    id: relationship.id,
    from: relationship.from,
    to: relationship.to,
    kind: relationship.kind,
  };
  if (relationship.label !== undefined) clone.label = relationship.label;
  return clone;
}

function cloneDataFlow(flow: UiDataFlow): DeepMutable<UiDataFlow> {
  const clone: DeepMutable<UiDataFlow> = {
    id: flow.id,
    path: flow.path,
    targetObject: flow.targetObject,
    targetProp: flow.targetProp,
    direction: flow.direction,
  };
  if (flow.transform !== undefined) clone.transform = flow.transform;
  return clone;
}

/** Deep, mutable copy of a frozen document; the operation log edits this copy. */
function cloneDocument(document: UiDocument): DeepMutable<UiDocument> {
  return {
    schemaVersion: UI_SCHEMA_VERSION,
    world: {
      id: document.world.id,
      kind: document.world.kind,
      title: document.world.title,
      accent: document.world.accent,
      origin: cloneVec3(document.world.origin),
      unitsPerMeter: document.world.unitsPerMeter,
    },
    objects: document.objects.map(cloneObject),
    relationships: document.relationships.map(cloneRelationship),
    dataFlows: document.dataFlows.map(cloneDataFlow),
  };
}

function hasDocumentId(document: DeepMutable<UiDocument>, id: string): boolean {
  return (
    document.objects.some((object) => object.id === id) ||
    document.relationships.some((relationship) => relationship.id === id) ||
    document.dataFlows.some((flow) => flow.id === id)
  );
}

function objectIndex(document: DeepMutable<UiDocument>, objectId: string, path: string): number {
  const index = document.objects.findIndex((object) => object.id === objectId);
  if (index < 0) {
    throw new UiWorldError("missing_reference", path, `object ${JSON.stringify(objectId)} does not exist`);
  }
  return index;
}

function addObject(document: DeepMutable<UiDocument>, value: unknown, path: string): void {
  const collector: Collector = { diagnostics: [], errors: 0 };
  const object = collectObject(value, `${path}.object`, new Map<string, string>(), collector);
  if (collector.errors > 0) throwFirstError(collector, `${path}.object`);
  if (object === null) throw new UiWorldError("invalid_object", `${path}.object`, "object is invalid");
  if (hasDocumentId(document, object.id)) {
    throw new UiWorldError("duplicate_id", `${path}.object.id`, `id ${JSON.stringify(object.id)} is already used in this document`);
  }
  document.objects.push(object);
}

function removeObject(document: DeepMutable<UiDocument>, objectIdValue: unknown, path: string): void {
  const objectId = requireString(objectIdValue, `${path}.objectId`, "invalid_object");
  const index = objectIndex(document, objectId, `${path}.objectId`);
  document.objects.splice(index, 1);
  document.relationships = document.relationships.filter(
    (relationship) => relationship.from !== objectId && relationship.to !== objectId,
  );
  document.dataFlows = document.dataFlows.filter((flow) => flow.targetObject !== objectId);
}

function moveObject(document: DeepMutable<UiDocument>, objectIdValue: unknown, transformValue: unknown, path: string): void {
  const objectId = requireString(objectIdValue, `${path}.objectId`, "invalid_object");
  const index = objectIndex(document, objectId, `${path}.objectId`);
  const collector: Collector = { diagnostics: [], errors: 0 };
  const transform = collectTransform(transformValue, `${path}.transform`, collector);
  if (collector.errors > 0) throwFirstError(collector, `${path}.transform`);
  if (transform === null) throw new UiWorldError("invalid_transform", `${path}.transform`, "transform is invalid");
  document.objects[index]!.transform = transform;
}

function setObjectProp(
  document: DeepMutable<UiDocument>,
  objectIdValue: unknown,
  keyValue: unknown,
  value: unknown,
  path: string,
): void {
  const objectId = requireString(objectIdValue, `${path}.objectId`, "invalid_object");
  const key = requireString(keyValue, `${path}.key`, "invalid_object");
  const object = document.objects[objectIndex(document, objectId, `${path}.objectId`)]!;

  if (value === undefined) {
    if (object.props !== undefined) {
      delete object.props[key];
      if (Object.keys(object.props).length === 0) object.props = undefined;
    }
    return;
  }

  if (!isScalar(value)) {
    throw new UiWorldError("invalid_object", `${path}.value`, "value must be a string, finite number, boolean or null");
  }
  const props = object.props ?? {};
  defineProp(props, key, value);
  object.props = props;
}

function setObjectLayer(document: DeepMutable<UiDocument>, objectIdValue: unknown, layerValue: unknown, path: string): void {
  const objectId = requireString(objectIdValue, `${path}.objectId`, "invalid_object");
  const object = document.objects[objectIndex(document, objectId, `${path}.objectId`)]!;
  if (!isLayerKind(layerValue)) {
    throw new UiWorldError("invalid_layer", `${path}.layer`, `must be one of ${UI_LAYER_KINDS.join(", ")}`);
  }
  object.layer = layerValue;
}

function setObjectKind(document: DeepMutable<UiDocument>, objectIdValue: unknown, kindValue: unknown, path: string): void {
  const objectId = requireString(objectIdValue, `${path}.objectId`, "invalid_object");
  const object = document.objects[objectIndex(document, objectId, `${path}.objectId`)]!;
  if (!isObjectKind(kindValue)) {
    throw new UiWorldError("invalid_kind", `${path}.kind`, 'must be "static" or "dynamic"');
  }
  object.kind = kindValue;
}

function addRelationship(document: DeepMutable<UiDocument>, value: unknown, path: string): void {
  const collector: Collector = { diagnostics: [], errors: 0 };
  const objectIds = new Set(document.objects.map((object) => object.id));
  const relationship = collectRelationship(value, `${path}.relationship`, new Map<string, string>(), objectIds, collector);
  if (collector.errors > 0) throwFirstError(collector, `${path}.relationship`);
  if (relationship === null) throw new UiWorldError("invalid_relationship", `${path}.relationship`, "relationship is invalid");
  if (hasDocumentId(document, relationship.id)) {
    throw new UiWorldError(
      "duplicate_id",
      `${path}.relationship.id`,
      `id ${JSON.stringify(relationship.id)} is already used in this document`,
    );
  }
  document.relationships.push(relationship);
}

function removeRelationship(document: DeepMutable<UiDocument>, relationshipIdValue: unknown, path: string): void {
  const relationshipId = requireString(relationshipIdValue, `${path}.relationshipId`, "invalid_relationship");
  const index = document.relationships.findIndex((relationship) => relationship.id === relationshipId);
  if (index < 0) {
    throw new UiWorldError(
      "missing_reference",
      `${path}.relationshipId`,
      `relationship ${JSON.stringify(relationshipId)} does not exist`,
    );
  }
  document.relationships.splice(index, 1);
}

function addDataFlow(document: DeepMutable<UiDocument>, value: unknown, path: string): void {
  const collector: Collector = { diagnostics: [], errors: 0 };
  const objectIds = new Set(document.objects.map((object) => object.id));
  const flow = collectDataFlow(value, `${path}.dataFlow`, new Map<string, string>(), objectIds, collector);
  if (collector.errors > 0) throwFirstError(collector, `${path}.dataFlow`);
  if (flow === null) throw new UiWorldError("invalid_data_flow", `${path}.dataFlow`, "data flow is invalid");
  if (hasDocumentId(document, flow.id)) {
    throw new UiWorldError("duplicate_id", `${path}.dataFlow.id`, `id ${JSON.stringify(flow.id)} is already used in this document`);
  }
  document.dataFlows.push(flow);
}

function removeDataFlow(document: DeepMutable<UiDocument>, dataFlowIdValue: unknown, path: string): void {
  const dataFlowId = requireString(dataFlowIdValue, `${path}.dataFlowId`, "invalid_data_flow");
  const index = document.dataFlows.findIndex((flow) => flow.id === dataFlowId);
  if (index < 0) {
    throw new UiWorldError("missing_reference", `${path}.dataFlowId`, `data flow ${JSON.stringify(dataFlowId)} does not exist`);
  }
  document.dataFlows.splice(index, 1);
}

function setWorldTitle(document: DeepMutable<UiDocument>, value: unknown, path: string): void {
  if (typeof value !== "string") {
    throw new UiWorldError("invalid_world", `${path}.title`, "must be a string");
  }
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > MAX_TITLE_LENGTH) {
    throw new UiWorldError("invalid_world", `${path}.title`, `must be 1-${MAX_TITLE_LENGTH} characters after trimming`);
  }
  document.world.title = value;
}

function applyOperation(document: DeepMutable<UiDocument>, operation: unknown, path: string): void {
  if (!isRecord(operation)) {
    throw new UiWorldError("invalid_operation", path, "operation must be an object with an op field");
  }
  switch (operation["op"]) {
    case "object.add":
      addObject(document, operation["object"], path);
      return;
    case "object.remove":
      removeObject(document, operation["objectId"], path);
      return;
    case "object.move":
      moveObject(document, operation["objectId"], operation["transform"], path);
      return;
    case "object.setProp":
      setObjectProp(document, operation["objectId"], operation["key"], operation["value"], path);
      return;
    case "object.setLayer":
      setObjectLayer(document, operation["objectId"], operation["layer"], path);
      return;
    case "object.setKind":
      setObjectKind(document, operation["objectId"], operation["kind"], path);
      return;
    case "relationship.add":
      addRelationship(document, operation["relationship"], path);
      return;
    case "relationship.remove":
      removeRelationship(document, operation["relationshipId"], path);
      return;
    case "dataFlow.add":
      addDataFlow(document, operation["dataFlow"], path);
      return;
    case "dataFlow.remove":
      removeDataFlow(document, operation["dataFlowId"], path);
      return;
    case "world.setTitle":
      setWorldTitle(document, operation["title"], path);
      return;
    default:
      throw new UiWorldError("invalid_operation", `${path}.op`, `unknown operation ${describeValue(operation["op"])}`);
  }
}

/**
 * Parse and validate a world document, returning it deeply frozen.
 *
 * Every document that enters the core goes through here, so a published
 * revision is canonical: known keys only, validated ids, resolvable references,
 * and a `contains` forest. The thrown {@link UiWorldError} carries the first
 * problem with a path, which is what an editor needs to highlight it.
 *
 * @throws UiWorldError `schemaVersion`, world, object, relationship, flow,
 *   transform, reference, duplicate-id or cycle failure.
 */
export function parseUiDocument(input: unknown): UiDocument {
  const inspection = inspectDocument(input);
  const failure = firstError(inspection.diagnostics);
  if (failure !== undefined) {
    throw new UiWorldError(failure.code as UiWorldErrorCode, failure.path, failure.message);
  }
  if (inspection.document === null) {
    throw new UiWorldError("invalid_world", "document", "document could not be constructed");
  }
  return freezeDocument(inspection.document);
}

/**
 * Collect every problem in a world document without throwing.
 *
 * Errors block publication; warnings do not. Each diagnostic carries a path
 * into the document, so a caller can surface them against an editor tree or a
 * preview without re-running validation per field.
 */
export function validateUiDocument(input: unknown): UiDocumentDiagnostic[] {
  return inspectDocument(input).diagnostics;
}

/**
 * A valid, minimal world.
 *
 * `home` is the world a user opens into; `custom` is the shape a new user-built
 * world starts from. Both contain one static ground plane and nothing else, so
 * the document is immediately renderable and immediately valid.
 */
export function defaultUiDocument(kind: UiWorldKind = "home"): UiDocument {
  if (!isWorldKind(kind)) {
    throw new UiWorldError("invalid_world", "world.kind", 'must be "home" or "custom"');
  }
  return parseUiDocument({
    schemaVersion: UI_SCHEMA_VERSION,
    world: {
      id: kind === "home" ? "home" : "custom",
      kind,
      title: kind === "home" ? "Home" : "Custom",
      accent: "#f2b134",
      origin: { x: 0, y: 0, z: 0 },
      unitsPerMeter: 1,
    },
    objects: [
      {
        id: "ground",
        layer: "ground",
        kind: "static",
        shape: "plane",
        title: "Ground",
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 100, y: 100, z: 1 },
        },
        props: { grid: true },
      },
    ],
    relationships: [],
    dataFlows: [],
  });
}

/**
 * Content hash of a world document.
 *
 * The hash is the identity a publish compares against, so it must be stable for
 * equal documents and sensitive to every semantic change, including a moved
 * transform. It delegates to the shared canonical serializer.
 */
export function uiDocumentHash(document: UiDocument): string {
  return contentHash(document);
}

/**
 * Apply semantic edits atomically, returning a new frozen document.
 *
 * The input document is never mutated: operations edit a private copy, and the
 * result is re-validated as a whole before it is frozen and returned. Any
 * failing operation throws and the caller keeps the document it passed in.
 * Cross-object rules are checked at the end, so `dataFlow.add` may follow the
 * `object.add` it feeds in the same batch.
 *
 * @throws UiWorldError `invalid_operation` for an unknown op, or the document
 *   error the edit caused.
 */
export function applyUiOperations(document: UiDocument, operations: UiOperation[]): UiDocument {
  if (!Array.isArray(operations)) {
    throw new UiWorldError("invalid_operation", "operations", "operations must be an array");
  }
  const draft = cloneDocument(parseUiDocument(document));
  for (let index = 0; index < operations.length; index += 1) {
    applyOperation(draft, operations[index], `operations[${index}]`);
  }

  const inspection = inspectDocument(draft);
  const failure = firstError(inspection.diagnostics);
  if (failure !== undefined) {
    throw new UiWorldError(failure.code as UiWorldErrorCode, failure.path, failure.message);
  }
  if (inspection.document === null) {
    throw new UiWorldError("invalid_world", "document", "edited document could not be constructed");
  }
  return freezeDocument(inspection.document);
}
