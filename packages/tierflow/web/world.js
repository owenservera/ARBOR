/**
 * The world surface.
 *
 * A world is data: five ordered layers, placed objects, typed relationships and
 * data flows. This module renders that data as an infinite 3D canvas and hosts
 * the studio that edits it.
 *
 * Three parts, in dependency order:
 *
 * 1. `createWorldClient` — transport-neutral. It holds the applied document,
 *    the pending semantic operations and the publish sequence. It never touches
 *    the DOM, so it is imported directly by the test suite.
 * 2. The renderer — WebGL2 when the browser provides it, a Canvas2D painter's
 *    algorithm otherwise. Both backends consume the same scene description.
 * 3. The studio and the surface boot — plain DOM, no framework, no build step.
 *
 * The module evaluates no downloaded code and has no dependencies.
 */

const LAYERS = Object.freeze(["ground", "structure", "content", "data", "overlay"]);
const SHAPES = Object.freeze(["box", "sphere", "cylinder", "plane", "text", "billboard"]);
const KINDS = Object.freeze(["static", "dynamic"]);
const RELATIONSHIP_KINDS = Object.freeze(["contains", "links", "drives", "mirrors"]);

const DEFAULT_ACCENT = "#ff9d3d";
const BG = "#07080a";
const NEAR = 0.08;

/** Presentation of each canonical layer. `order` is the real render order. */
const LAYER_META = Object.freeze({
  ground: { label: "Ground", order: 0, tint: "#3a424e", alpha: 0.55 },
  structure: { label: "Structure", order: 1, tint: "#7f8fa3", alpha: 0.92 },
  content: { label: "Content", order: 2, tint: "#c3cbd6", alpha: 1 },
  data: { label: "Data", order: 3, tint: null, alpha: 1 },
  overlay: { label: "Overlay", order: 4, tint: "#eef1f5", alpha: 1 },
});

const SHAPE_LABEL = Object.freeze({
  box: "Box",
  sphere: "Sphere",
  cylinder: "Cylinder",
  plane: "Plane",
  text: "Text",
  billboard: "Billboard",
});

const OPERATION_LABEL = Object.freeze({
  "object.add": "Add",
  "object.remove": "Remove",
  "object.move": "Move",
  "object.setProp": "Set property",
  "object.setLayer": "Set layer",
  "object.setKind": "Set kind",
  "relationship.add": "Add relationship",
  "relationship.remove": "Remove relationship",
  "dataFlow.add": "Bind data",
  "dataFlow.remove": "Unbind data",
  "world.setTitle": "Rename world",
});

const MONO = 'ui-monospace, "Cascadia Mono", "Cascadia Code", "SF Mono", Menlo, Consolas, monospace';

const OPERATION_NAMES = Object.freeze([
  "object.add",
  "object.remove",
  "object.move",
  "object.setProp",
  "object.setLayer",
  "object.setKind",
  "relationship.add",
  "relationship.remove",
  "dataFlow.add",
  "dataFlow.remove",
  "world.setTitle",
]);

/* ------------------------------------------------------------------ */
/* Small shared helpers                                                */
/* ------------------------------------------------------------------ */

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isVec3(value) {
  return isObject(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y) && isFiniteNumber(value.z);
}

function isTransform(value) {
  return isObject(value) && isVec3(value.position) && isVec3(value.rotation) && isVec3(value.scale);
}

function isScalar(value) {
  return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function copyVec3(value) {
  return { x: value.x, y: value.y, z: value.z };
}

function randomToken() {
  const cryptoApi = typeof globalThis.crypto === "object" ? globalThis.crypto : null;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return cryptoApi.randomUUID().replace(/-/g, "").slice(0, 12);
  }
  return Math.random().toString(36).slice(2, 10);
}

/** Read a `#rgb` or `#rrggbb` colour from object props, or null. */
function readColorProp(props) {
  if (!isObject(props) || typeof props.color !== "string") return null;
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(props.color) ? props.color : null;
}

function hexToRgb(hex) {
  if (typeof hex !== "string") return [1, 1, 1];
  let raw = hex.replace("#", "").trim();
  if (raw.length === 3) raw = raw[0] + raw[0] + raw[1] + raw[1] + raw[2] + raw[2];
  if (raw.length !== 6) return [1, 1, 1];
  const value = Number.parseInt(raw, 16);
  if (!Number.isFinite(value)) return [1, 1, 1];
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

/** Readable foreground for text sitting on the world accent. */
function accentInk(hex) {
  const [r, g, b] = hexToRgb(hex).map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4),
  );
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.42 ? "#07080a" : "#ffffff";
}

function mixHex(hex, target, amount) {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  const t = clamp(amount, 0, 1);
  const to = (value) => Math.round(clamp(value, 0, 1) * 255).toString(16).padStart(2, "0");
  return "#" + to(a[0] + (b[0] - a[0]) * t) + to(a[1] + (b[1] - a[1]) * t) + to(a[2] + (b[2] - a[2]) * t);
}

function formatScalar(value) {
  if (value === null || value === undefined) return "--";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function formatVec3(position) {
  return position.x.toFixed(2) + " / " + position.y.toFixed(2) + " / " + position.z.toFixed(2);
}

/* ------------------------------------------------------------------ */
/* Semantic operations                                                 */
/* ------------------------------------------------------------------ */

/**
 * Validate and normalise one operation.
 *
 * The returned operation carries exactly the fields the edit route receives:
 * unknown keys are dropped so a queued op serialises byte-for-byte the same
 * every time it is retried. `title` is addressed through `object.setProp` with
 * the reserved prop name `title`, because the operation vocabulary has no
 * separate title operation for objects.
 */
function normalizeOperation(input) {
  if (!isObject(input) || typeof input.op !== "string") {
    return { ok: false, code: "INVALID_OPERATION", message: "An operation needs an op name." };
  }
  if (OPERATION_NAMES.indexOf(input.op) < 0) {
    return { ok: false, code: "INVALID_OPERATION", message: "Unknown operation " + input.op + "." };
  }

  const fail = (message) => ({ ok: false, code: "INVALID_OPERATION", message: message });

  switch (input.op) {
    case "object.add": {
      const object = input.object;
      if (!isObject(object)) return fail("object.add needs an object.");
      if (typeof object.id !== "string" || !object.id) return fail("The object needs an id.");
      if (LAYERS.indexOf(object.layer) < 0) return fail("Unknown layer for the new object.");
      if (KINDS.indexOf(object.kind) < 0) return fail("Unknown kind for the new object.");
      if (SHAPES.indexOf(object.shape) < 0) return fail("Unknown shape for the new object.");
      if (!isTransform(object.transform)) return fail("The object needs a complete transform.");
      const next = {
        op: "object.add",
        object: {
          id: object.id,
          layer: object.layer,
          kind: object.kind,
          shape: object.shape,
          transform: {
            position: copyVec3(object.transform.position),
            rotation: copyVec3(object.transform.rotation),
            scale: copyVec3(object.transform.scale),
          },
        },
      };
      if (typeof object.title === "string" && object.title) next.object.title = object.title;
      if (isObject(object.props)) next.object.props = copyScalarMap(object.props);
      return { ok: true, operation: next };
    }
    case "object.remove":
      return typeof input.objectId === "string" && input.objectId
        ? { ok: true, operation: { op: "object.remove", objectId: input.objectId } }
        : fail("object.remove needs an objectId.");
    case "object.move": {
      if (typeof input.objectId !== "string" || !input.objectId) return fail("object.move needs an objectId.");
      if (!isTransform(input.transform)) return fail("object.move needs a complete transform.");
      return {
        ok: true,
        operation: {
          op: "object.move",
          objectId: input.objectId,
          transform: {
            position: copyVec3(input.transform.position),
            rotation: copyVec3(input.transform.rotation),
            scale: copyVec3(input.transform.scale),
          },
        },
      };
    }
    case "object.setProp": {
      if (typeof input.objectId !== "string" || !input.objectId) return fail("object.setProp needs an objectId.");
      const key = typeof input.key === "string" ? input.key : input.prop;
      if (typeof key !== "string" || !key) return fail("object.setProp needs a key.");
      if (!isScalar(input.value)) return fail("object.setProp value must be a scalar.");
      return {
        ok: true,
        operation: { op: "object.setProp", objectId: input.objectId, key: key, value: input.value },
      };
    }
    case "object.setLayer":
      if (typeof input.objectId !== "string" || !input.objectId) return fail("object.setLayer needs an objectId.");
      if (LAYERS.indexOf(input.layer) < 0) return fail("Unknown layer.");
      return { ok: true, operation: { op: "object.setLayer", objectId: input.objectId, layer: input.layer } };
    case "object.setKind":
      if (typeof input.objectId !== "string" || !input.objectId) return fail("object.setKind needs an objectId.");
      if (KINDS.indexOf(input.kind) < 0) return fail("Unknown kind.");
      return { ok: true, operation: { op: "object.setKind", objectId: input.objectId, kind: input.kind } };
    case "relationship.add": {
      const rel = input.relationship;
      if (!isObject(rel)) return fail("relationship.add needs a relationship.");
      if (typeof rel.id !== "string" || !rel.id) return fail("The relationship needs an id.");
      if (typeof rel.from !== "string" || typeof rel.to !== "string") return fail("The relationship needs both endpoints.");
      if (RELATIONSHIP_KINDS.indexOf(rel.kind) < 0) return fail("Unknown relationship kind.");
      const next = { op: "relationship.add", relationship: { id: rel.id, from: rel.from, to: rel.to, kind: rel.kind } };
      if (typeof rel.label === "string" && rel.label) next.relationship.label = rel.label;
      return { ok: true, operation: next };
    }
    case "relationship.remove":
      return typeof input.relationshipId === "string" && input.relationshipId
        ? { ok: true, operation: { op: "relationship.remove", relationshipId: input.relationshipId } }
        : fail("relationship.remove needs a relationshipId.");
    case "dataFlow.add": {
      const flow = input.dataFlow;
      if (!isObject(flow)) return fail("dataFlow.add needs a data flow.");
      if (typeof flow.id !== "string" || !flow.id) return fail("The data flow needs an id.");
      if (typeof flow.path !== "string" || flow.path.charAt(0) !== "/") return fail("The data flow needs an absolute state path.");
      if (typeof flow.targetObject !== "string" || typeof flow.targetProp !== "string") {
        return fail("The data flow needs a target object and property.");
      }
      if (flow.direction !== "inbound" && flow.direction !== "outbound") return fail("Unknown flow direction.");
      const next = {
        op: "dataFlow.add",
        dataFlow: {
          id: flow.id,
          path: flow.path,
          targetObject: flow.targetObject,
          targetProp: flow.targetProp,
          direction: flow.direction,
        },
      };
      if (typeof flow.transform === "string" && flow.transform) next.dataFlow.transform = flow.transform;
      return { ok: true, operation: next };
    }
    case "dataFlow.remove":
      return typeof input.dataFlowId === "string" && input.dataFlowId
        ? { ok: true, operation: { op: "dataFlow.remove", dataFlowId: input.dataFlowId } }
        : fail("dataFlow.remove needs a dataFlowId.");
    case "world.setTitle":
      return typeof input.title === "string" && input.title.trim()
        ? { ok: true, operation: { op: "world.setTitle", title: input.title.trim() } }
        : fail("world.setTitle needs a title.");
    default:
      return fail("Unknown operation.");
  }
}

function copyScalarMap(map) {
  const out = {};
  for (const key of Object.keys(map)) {
    if (isScalar(map[key])) out[key] = map[key];
  }
  return out;
}

/** True when a value looks like a world document this renderer can display. */
function isDocumentShaped(document) {
  return (
    isObject(document) &&
    isObject(document.world) &&
    typeof document.world.id === "string" &&
    Array.isArray(document.objects)
  );
}

function objectsOf(document) {
  return isDocumentShaped(document) ? document.objects.filter((object) => isObject(object) && typeof object.id === "string") : [];
}

function findObject(document, objectId) {
  if (!objectId) return null;
  const objects = objectsOf(document);
  for (const object of objects) if (object.id === objectId) return object;
  return null;
}

/**
 * The title this surface shows for an object.
 *
 * `title` is the authored field. The closed operation vocabulary has no
 * `object.setTitle`, so a retitle is sent as `object.setProp` with the key
 * `title`; the same key is read back here so a published retitle is visible.
 */
function effectiveTitle(object) {
  if (isObject(object) && isObject(object.props) && typeof object.props.title === "string" && object.props.title) {
    return object.props.title;
  }
  if (isObject(object) && typeof object.title === "string" && object.title) return object.title;
  return isObject(object) && typeof object.id === "string" ? object.id : "";
}

/**
 * Apply queued operations to a copy of a document for the live preview.
 *
 * Best effort by design: an operation whose endpoint vanished is skipped, so a
 * stale queue never breaks rendering. The server remains the authority; this
 * function only decides what the studio shows before publish.
 */
function applyOperationsToDocument(document, operations) {
  if (!isDocumentShaped(document)) return document;
  let world = document.world;
  let objects = document.objects.slice();
  let relationships = Array.isArray(document.relationships) ? document.relationships.slice() : [];
  let dataFlows = Array.isArray(document.dataFlows) ? document.dataFlows.slice() : [];

  const replaceObject = (objectId, change) => {
    objects = objects.map((object) => (object.id === objectId ? change(object) : object));
  };

  for (const op of operations) {
    if (!isObject(op)) continue;
    switch (op.op) {
      case "object.add":
        if (isObject(op.object) && !objects.some((object) => object.id === op.object.id)) {
          objects = objects.concat([op.object]);
        }
        break;
      case "object.remove":
        objects = objects.filter((object) => object.id !== op.objectId);
        relationships = relationships.filter((rel) => rel.from !== op.objectId && rel.to !== op.objectId);
        dataFlows = dataFlows.filter((flow) => flow.targetObject !== op.objectId);
        break;
      case "object.move":
        replaceObject(op.objectId, (object) => ({ ...object, transform: op.transform }));
        break;
      case "object.setProp":
        replaceObject(op.objectId, (object) => {
          const props = { ...(isObject(object.props) ? object.props : {}) };
          props[op.key] = op.value;
          return { ...object, props: props };
        });
        break;
      case "object.setLayer":
        replaceObject(op.objectId, (object) => ({ ...object, layer: op.layer }));
        break;
      case "object.setKind":
        replaceObject(op.objectId, (object) => ({ ...object, kind: op.kind }));
        break;
      case "relationship.add":
        if (isObject(op.relationship) && !relationships.some((rel) => rel.id === op.relationship.id)) {
          relationships = relationships.concat([op.relationship]);
        }
        break;
      case "relationship.remove":
        relationships = relationships.filter((rel) => rel.id !== op.relationshipId);
        break;
      case "dataFlow.add":
        if (isObject(op.dataFlow) && !dataFlows.some((flow) => flow.id === op.dataFlow.id)) {
          dataFlows = dataFlows.concat([op.dataFlow]);
        }
        break;
      case "dataFlow.remove":
        dataFlows = dataFlows.filter((flow) => flow.id !== op.dataFlowId);
        break;
      case "world.setTitle":
        world = { ...world, title: op.title };
        break;
      default:
        break;
    }
  }

  if (world === document.world && objects === document.objects) return document;
  return { ...document, world: world, objects: objects, relationships: relationships, dataFlows: dataFlows };
}

/** Human label for one queued operation, used by the pending list. */
function describeOperation(op, document) {
  const target = (objectId) => {
    const object = findObject(document, objectId);
    return object ? effectiveTitle(object) : objectId;
  };
  switch (op.op) {
    case "object.add":
      return "Add " + (op.object.title || op.object.id) + " to " + op.object.layer;
    case "object.remove":
      return "Remove " + target(op.objectId);
    case "object.move":
      return "Move " + target(op.objectId) + " to " + formatVec3(op.transform.position);
    case "object.setProp":
      return (op.key === "title" ? "Retitle " : "Set " + op.key + " on ") + target(op.objectId);
    case "object.setLayer":
      return "Move " + target(op.objectId) + " to the " + op.layer + " layer";
    case "object.setKind":
      return "Make " + target(op.objectId) + " " + op.kind;
    case "relationship.add":
      return "Add " + op.relationship.kind + " relationship";
    case "relationship.remove":
      return "Remove relationship " + op.relationshipId;
    case "dataFlow.add":
      return "Bind " + op.dataFlow.path + " to " + op.dataFlow.targetProp;
    case "dataFlow.remove":
      return "Remove data flow " + op.dataFlowId;
    case "world.setTitle":
      return "Rename the world to " + op.title;
    default:
      return op.op;
  }
}

/* ------------------------------------------------------------------ */
/* World client                                                        */
/* ------------------------------------------------------------------ */

function createHttp(options) {
  const baseUrl = typeof options.baseUrl === "string" ? options.baseUrl.replace(/\/+$/, "") : "";
  const fetchImpl =
    typeof options.fetch === "function"
      ? options.fetch
      : typeof globalThis.fetch === "function"
        ? globalThis.fetch.bind(globalThis)
        : null;

  async function send(method, path, body) {
    if (!fetchImpl) {
      return { ok: false, status: 0, error: { code: "NETWORK", message: "This environment has no fetch." } };
    }
    const headers = { accept: "application/json" };
    if (body !== null) headers["content-type"] = "application/json";
    let response;
    try {
      response = await fetchImpl(baseUrl + path, {
        method: method,
        headers: headers,
        body: body === null ? undefined : JSON.stringify(body),
      });
    } catch (error) {
      return { ok: false, status: 0, error: { code: "NETWORK", message: "The server did not answer." } };
    }
    if (!response || typeof response !== "object") {
      return { ok: false, status: 0, error: { code: "NETWORK", message: "The server returned no response." } };
    }
    let payload = null;
    if (response.status !== 204 && typeof response.json === "function") {
      try {
        payload = await response.json();
      } catch (error) {
        payload = null;
      }
    }
    if (response.ok) return { ok: true, status: response.status, body: payload };
    return { ok: false, status: response.status, error: readApiError(payload, response.status) };
  }

  return {
    get: (path) => send("GET", path, null),
    post: (path, body) => send("POST", path, body),
  };
}

/** Normalise the server's typed error body. Prose is never the contract. */
function readApiError(payload, status) {
  const source = isObject(payload) && isObject(payload.error) ? payload.error : isObject(payload) ? payload : {};
  const code = typeof source.code === "string" && source.code ? source.code : "HTTP_" + status;
  const message =
    typeof source.message === "string" && source.message
      ? source.message
      : isObject(payload) && typeof payload.error === "string" && payload.error
        ? payload.error
        : "Request failed with status " + status + ".";
  const error = { code: code, message: message };
  if (Number.isInteger(source.currentRevision)) error.currentRevision = source.currentRevision;
  return error;
}

function pickRevisionNumber(value) {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (isObject(value) && Number.isInteger(value.revision)) return value.revision;
  if (isObject(value) && isObject(value.revision)) return pickRevisionNumber(value.revision);
  return null;
}

function pickDocument(value) {
  if (isObject(value) && isDocumentShaped(value.document)) return value.document;
  if (isObject(value) && isObject(value.revision)) return pickDocument(value.revision);
  if (isDocumentShaped(value)) return value;
  return null;
}

function pickDraft(value) {
  if (isObject(value) && isObject(value.draft)) return value.draft;
  return isObject(value) ? value : null;
}

function pickWorlds(value) {
  if (Array.isArray(value)) return value;
  if (isObject(value) && Array.isArray(value.worlds)) return value.worlds;
  return null;
}

/**
 * Create the headless world client.
 *
 * Holds one applied published document, the pending semantic operations, the
 * resolved value map and the publish state machine. It performs no DOM work, so
 * the whole contract is testable without a browser.
 *
 * @param {object} [options]
 * @param {string} [options.actorId] Actor recorded on every command. Default `studio`.
 * @param {string} [options.baseUrl] Origin prefix for API calls. Default same origin.
 * @param {Function} [options.fetch] Fetch implementation, injected in tests.
 * @param {Function} [options.commandIdFactory] `(stage) => id`; stage is `draft`, `edit` or `publish`.
 * @param {Function} [options.loadDocument] `async (worldId) => { document, revision }` for frames that carry only a revision.
 * @param {Function} [options.onSelection] Called with the selected object or null.
 * @param {Function} [options.onState] Called with a fresh state snapshot after every change.
 * @returns {object} The client API.
 */
export function createWorldClient(options = {}) {
  const settings = isObject(options) ? options : {};
  const actorId = typeof settings.actorId === "string" && settings.actorId ? settings.actorId : "studio";
  const http = createHttp(settings);
  const onSelection = typeof settings.onSelection === "function" ? settings.onSelection : null;
  const onState = typeof settings.onState === "function" ? settings.onState : null;
  const loadDocument = typeof settings.loadDocument === "function" ? settings.loadDocument : null;
  let commandSeq = 0;

  function nextCommandId(stage) {
    if (typeof settings.commandIdFactory === "function") return String(settings.commandIdFactory(stage));
    commandSeq += 1;
    return "cmd_" + stage + "_" + Date.now().toString(36) + "_" + commandSeq.toString(36);
  }

  const state = {
    document: null,
    revision: 0,
    worlds: [],
    resolved: {},
    selectedId: null,
    pending: [],
    phase: "idle",
    error: null,
    needsSnapshot: false,
    draft: null,
    publishedAt: 0,
  };

  let viewCache = null;
  let destroyed = false;
  let publishing = false;

  function viewDocument() {
    if (!state.document) return null;
    if (!state.pending.length) return state.document;
    if (viewCache === null) viewCache = applyOperationsToDocument(state.document, state.pending);
    return viewCache;
  }

  function invalidate() {
    viewCache = null;
  }

  function snapshot() {
    const view = viewDocument();
    const selected = state.selectedId ? findObject(view || state.document, state.selectedId) : null;
    return {
      document: state.document,
      view: view,
      revision: state.revision,
      worlds: state.worlds,
      resolved: state.resolved,
      selectedId: state.selectedId,
      selected: selected,
      pending: state.pending.slice(),
      unpublished: state.pending.length > 0,
      phase: state.phase,
      error: state.error,
      needsSnapshot: state.needsSnapshot,
      draft: state.draft,
      publishing: publishing,
    };
  }

  function emit() {
    if (destroyed) return;
    if (onState) onState(snapshot());
  }

  function notifySelection() {
    if (destroyed || !onSelection) return;
    const object = state.selectedId ? findObject(viewDocument(), state.selectedId) : null;
    onSelection(object);
  }

  function select(objectId) {
    const next = typeof objectId === "string" && objectId ? objectId : null;
    if (next === state.selectedId) return;
    state.selectedId = next;
    notifySelection();
    emit();
  }

  /**
   * Install a document. A document from a different world replaces the current
   * one regardless of revision; within a world an older revision is refused.
   */
  function setDocument(document, revision) {
    if (!isDocumentShaped(document)) return false;
    const nextRevision = Number.isInteger(revision) && revision >= 0 ? revision : 0;
    const current = state.document;
    const sameWorld =
      current && isObject(current.world) && isObject(document.world) && current.world.id === document.world.id;
    if (sameWorld && nextRevision < state.revision) return false;

    state.document = document;
    state.revision = nextRevision;
    state.needsSnapshot = false;
    state.error = null;
    state.draft = null;
    invalidate();
    const view = viewDocument();
    if (state.selectedId && !findObject(view, state.selectedId)) {
      state.selectedId = null;
      notifySelection();
    }
    emit();
    return true;
  }

  function setWorlds(worlds) {
    if (!Array.isArray(worlds)) return false;
    state.worlds = worlds.filter((world) => isObject(world));
    emit();
    return true;
  }

  function setResolvedValues(values) {
    if (!isObject(values)) return false;
    state.resolved = values;
    emit();
    return true;
  }

  /**
   * Consume one realtime frame.
   *
   * Unknown kinds and malformed payloads are ignored: a bad frame must never
   * throw inside a socket handler.
   */
  function applyServerMessage(message) {
    const frame = readFrame(message);
    if (!frame) return { handled: false, kind: null, applied: false };

    if (frame.kind === "ui.document") {
      const revision = pickRevisionNumber(frame.revision);
      if (revision === null) return { handled: false, kind: frame.kind, applied: false };
      const worldId = typeof frame.worldId === "string" ? frame.worldId : null;
      const currentWorldId = state.document && isObject(state.document.world) ? state.document.world.id : null;
      if (worldId && currentWorldId && worldId !== currentWorldId) {
        return { handled: true, kind: frame.kind, applied: false };
      }
      // The published frame carries a full revision object; a bare number is
      // accepted too so a test or another producer can send the minimum.
      const document = pickDocument(frame.revision) || pickDocument(frame);
      if (document) {
        const applied = revision > state.revision || currentWorldId === null;
        if (!applied) return { handled: true, kind: frame.kind, applied: false };
        setDocument(document, revision);
        return { handled: true, kind: frame.kind, applied: true };
      }
      if (loadDocument && worldId) {
        state.phase = "loading";
        emit();
        Promise.resolve(loadDocument(worldId))
          .then((result) => {
            if (destroyed || !isObject(result) || !isDocumentShaped(result.document)) return;
            const loadedRevision =
              Number.isInteger(result.revision) ? result.revision : revision;
            if (loadedRevision > state.revision) setDocument(result.document, loadedRevision);
          })
          .catch(() => {});
        return { handled: true, kind: frame.kind, applied: false, pendingSnapshot: true };
      }
      return { handled: true, kind: frame.kind, applied: false };
    }

    if (frame.kind === "ui.worlds") {
      const worlds = pickWorlds(frame);
      if (!worlds) return { handled: false, kind: frame.kind, applied: false };
      setWorlds(worlds);
      return { handled: true, kind: frame.kind, applied: true };
    }

    if (frame.kind === "ui.draft") {
      const draft = pickDraft(frame);
      if (!draft || typeof draft.draftId !== "string") {
        return { handled: false, kind: frame.kind, applied: false };
      }
      state.draft = draft;
      emit();
      return { handled: true, kind: frame.kind, applied: true };
    }

    if (frame.kind === "ui.resync") {
      if (typeof frame.gap !== "boolean") {
        return { handled: false, kind: frame.kind, applied: false };
      }
      if (frame.gap) {
        state.pending = [];
        state.needsSnapshot = true;
        state.phase = "resync";
        invalidate();
        emit();
        return { handled: true, kind: frame.kind, applied: false, needsSnapshot: true };
      }
      state.needsSnapshot = false;
      emit();
      return { handled: true, kind: frame.kind, applied: false, needsSnapshot: false };
    }

    if (frame.kind === "ui.error") {
      if (typeof frame.code !== "string" || !frame.code) {
        return { handled: false, kind: frame.kind, applied: false };
      }
      const error = { code: frame.code, message: typeof frame.message === "string" ? frame.message : frame.code };
      if (Number.isInteger(frame.currentRevision)) error.currentRevision = frame.currentRevision;
      state.error = error;
      state.phase = "failed";
      emit();
      return { handled: true, kind: frame.kind, applied: false, error: error };
    }

    return { handled: false, kind: frame.kind, applied: false };
  }

  function queueOperation(op) {
    let candidate = op;
    // Convenience: a caller may name only the new position. The wire shape is
    // always a full transform, so fill the rotation and scale from the object.
    if (isObject(op) && op.op === "object.move" && !isTransform(op.transform) && isVec3(op.position)) {
      const existing = findObject(viewDocument(), op.objectId);
      if (existing && isTransform(existing.transform)) {
        candidate = {
          op: "object.move",
          objectId: op.objectId,
          transform: {
            position: copyVec3(op.position),
            rotation: copyVec3(existing.transform.rotation),
            scale: copyVec3(existing.transform.scale),
          },
        };
      }
    }
    const normalized = normalizeOperation(candidate);
    if (!normalized.ok) return normalized;
    state.pending.push(normalized.operation);
    state.error = null;
    state.phase = "editing";
    invalidate();
    emit();
    return { ok: true, length: state.pending.length };
  }

  function clearOperations() {
    if (!state.pending.length) return;
    state.pending = [];
    state.needsSnapshot = false;
    state.phase = "idle";
    invalidate();
    emit();
  }

  function fail(stage, code, message, currentRevision) {
    const error = { code: code, message: message };
    if (Number.isInteger(currentRevision)) error.currentRevision = currentRevision;
    state.error = error;
    state.phase = "failed";
    publishing = false;
    emit();
    return { ok: false, stage: stage, code: code, message: message, currentRevision: currentRevision, error: error };
  }

  /**
   * Run the full draft → edit → preview → publish sequence.
   *
   * The operations are snapshotted when publish starts; edits queued while the
   * request is in flight stay pending for the next publish. A typed server error
   * is returned instead of thrown, and the queue is never silently dropped.
   */
  async function publish() {
    if (publishing) return { ok: false, stage: "busy", code: "BUSY", message: "A publish is already running." };
    if (!isDocumentShaped(state.document)) {
      return fail("preflight", "NOT_READY", "Load a world before publishing.");
    }
    if (!state.pending.length) {
      return fail("preflight", "EMPTY", "There are no pending operations to publish.");
    }

    const worldId = state.document.world.id;
    const baseRevision = state.revision;
    const applied = state.pending.slice();
    publishing = true;
    state.error = null;

    state.phase = "draft";
    emit();

    const created = await http.post("/api/ui/drafts", {
      commandId: nextCommandId("draft"),
      actorId: actorId,
      worldId: worldId,
      baseRevision: baseRevision,
    });
    if (!created.ok) {
      return fail("draft", created.error.code, created.error.message, created.error.currentRevision);
    }
    const draft = pickDraft(created.body);
    if (!draft || typeof draft.draftId !== "string") {
      return fail("draft", "INVALID_RESPONSE", "The server did not return a draft.");
    }
    const draftRevision = Number.isInteger(draft.draftRevision) ? draft.draftRevision : 1;

    state.draft = draft;
    state.phase = "edit";
    emit();

    const editBody = {
      commandId: nextCommandId("edit"),
      actorId: actorId,
      expectedDraftRevision: draftRevision,
      operations: applied,
    };
    const edited = await http.post("/api/ui/drafts/" + encodeURIComponent(draft.draftId) + "/edit", editBody);
    if (!edited.ok) {
      return fail("edit", edited.error.code, edited.error.message, edited.error.currentRevision);
    }
    const editedDraft = pickDraft(edited.body) || draft;

    const preview = await http.post("/api/ui/drafts/" + encodeURIComponent(draft.draftId) + "/preview", {
      actorId: actorId,
    });
    if (!preview.ok) {
      return fail("preview", preview.error.code, preview.error.message, preview.error.currentRevision);
    }

    state.phase = "publishing";
    emit();

    const publishBody = {
      commandId: nextCommandId("publish"),
      actorId: actorId,
      expectedRevision: baseRevision,
      worldId: worldId,
      draftId: draft.draftId,
    };
    const published = await http.post("/api/ui/publish", publishBody);
    if (!published.ok) {
      return fail("publish", published.error.code, published.error.message, published.error.currentRevision);
    }

    const revision = pickRevisionNumber(published.body);
    if (revision === null) {
      return fail("publish", "INVALID_RESPONSE", "The server did not return a revision.");
    }
    const previewPayload = isObject(preview.body) ? preview.body : {};
    const document =
      pickDocument(published.body) ||
      pickDocument(previewPayload) ||
      pickDocument(editedDraft) ||
      applyOperationsToDocument(state.document, applied);

    const appliedSet = new Set(applied);
    state.pending = state.pending.filter((op) => !appliedSet.has(op));
    state.draft = null;
    state.needsSnapshot = false;
    state.phase = "published";
    publishing = false;
    state.publishedAt = Date.now();

    if (isDocumentShaped(document)) {
      state.document = document;
      state.revision = revision;
    } else {
      state.revision = revision;
    }
    invalidate();
    const view = viewDocument();
    if (state.selectedId && !findObject(view, state.selectedId)) {
      state.selectedId = null;
      notifySelection();
    }
    emit();

    const diagnostics = Array.isArray(previewPayload.diagnostics) ? previewPayload.diagnostics : [];
    return {
      ok: true,
      stage: "published",
      revision: revision,
      draftId: draft.draftId,
      document: view,
      diagnostics: diagnostics,
    };
  }

  function destroy() {
    destroyed = true;
    state.pending = [];
    state.selectedId = null;
    state.worlds = [];
    state.document = null;
  }

  return {
    setDocument: setDocument,
    setWorlds: setWorlds,
    setResolvedValues: setResolvedValues,
    applyServerMessage: applyServerMessage,
    queueOperation: queueOperation,
    publish: publish,
    destroy: destroy,
    select: select,
    clearOperations: clearOperations,
    getState: snapshot,
  };
}

/** Read a realtime frame in either the flat or the nested payload shape. */
function readFrame(message) {
  if (!isObject(message)) return null;
  const nested = isObject(message.payload) ? message.payload : null;
  const kind =
    typeof message.kind === "string"
      ? message.kind
      : typeof message.type === "string"
        ? message.type
        : nested && typeof nested.kind === "string"
          ? nested.kind
          : null;
  if (!kind || kind.slice(0, 3) !== "ui.") return null;
  const frame = Object.assign({}, nested || {}, message);
  frame.kind = kind;
  return frame;
}

/* ------------------------------------------------------------------ */
/* Scene description                                                   */
/* ------------------------------------------------------------------ */

/** Fallback half-extent of a billboard plate, in world units. */
const BILLBOARD_HEIGHT = 0.9;

function halfExtentsFor(object) {
  const scale = object.transform && isTransform(object.transform) ? object.transform.scale : { x: 1, y: 1, z: 1 };
  const x = Math.abs(scale.x) / 2;
  const y = Math.abs(scale.y) / 2;
  const z = Math.abs(scale.z) / 2;
  switch (object.shape) {
    case "sphere":
      return { x: x, y: x, z: x };
    case "plane":
      return { x: Math.max(x, 0.02), y: 0.02, z: Math.max(z, 0.02) };
    case "billboard":
    case "text":
      return { x: Math.max(x, 0.4), y: Math.max(y, BILLBOARD_HEIGHT / 2), z: 0.05 };
    default:
      return { x: Math.max(x, 0.05), y: Math.max(y, 0.05), z: Math.max(z, 0.05) };
  }
}

/**
 * Turn a document into the flat scene both backends draw.
 *
 * `resolved` is keyed by object id and then by property name; the inbound data
 * flow names decide which property a dynamic object displays.
 */
function buildScene(document, resolved, accent) {
  const objects = [];
  const inbound = new Map();
  const flows = isDocumentShaped(document) && Array.isArray(document.dataFlows) ? document.dataFlows : [];
  for (const flow of flows) {
    if (!isObject(flow) || flow.direction !== "inbound") continue;
    if (typeof flow.targetObject !== "string" || typeof flow.targetProp !== "string") continue;
    if (!inbound.has(flow.targetObject)) inbound.set(flow.targetObject, flow.targetProp);
  }

  for (const object of objectsOf(document)) {
    if (!isTransform(object.transform)) continue;
    const meta = LAYER_META[object.layer] || LAYER_META.content;
    const shape = SHAPES.indexOf(object.shape) >= 0 ? object.shape : "box";
    const kind = object.kind === "dynamic" ? "dynamic" : "static";
    const tint = readColorProp(object.props) || meta.tint || accent;
    const opacityProp = isObject(object.props) && isFiniteNumber(object.props.opacity) ? object.props.opacity : null;
    const alpha = opacityProp === null ? meta.alpha : clamp(opacityProp, 0.04, 1);
    const half = halfExtentsFor({ shape: shape, transform: object.transform });
    const radius = Math.hypot(half.x, half.y, half.z);

    const values = isObject(resolved) && isObject(resolved[object.id]) ? resolved[object.id] : null;
    const propName = inbound.get(object.id);
    let value = null;
    if (values) {
      if (propName && Object.prototype.hasOwnProperty.call(values, propName)) value = values[propName];
      else {
        const keys = Object.keys(values);
        if (keys.length) value = values[keys[0]];
      }
    }

    const title = effectiveTitle(object);
    objects.push({
      id: object.id,
      layer: LAYER_META[object.layer] ? object.layer : "content",
      kind: kind,
      shape: shape,
      title: title,
      label: title,
      valueText: value === null || value === undefined ? null : formatScalar(value),
      position: copyVec3(object.transform.position),
      rotation: copyVec3(object.transform.rotation),
      scale: copyVec3(object.transform.scale),
      half: half,
      radius: radius,
      pickRadius: Math.max(radius, 0.55),
      color: tint,
      colorRgb: hexToRgb(tint),
      accentRgb: hexToRgb(accent),
      alpha: alpha,
      order: meta.order,
      isDynamic: kind === "dynamic",
      props: isObject(object.props) ? object.props : {},
    });
  }

  const byId = new Map(objects.map((object) => [object.id, object]));
  const relationships = [];
  const rawRelationships = isDocumentShaped(document) && Array.isArray(document.relationships) ? document.relationships : [];
  for (const rel of rawRelationships) {
    if (!isObject(rel) || !byId.has(rel.from) || !byId.has(rel.to)) continue;
    if (RELATIONSHIP_KINDS.indexOf(rel.kind) < 0) continue;
    relationships.push({ id: rel.id, from: rel.from, to: rel.to, kind: rel.kind, label: rel.label });
  }

  return {
    document: document,
    objects: objects,
    byId: byId,
    relationships: relationships,
    accent: accent,
  };
}

/* ------------------------------------------------------------------ */
/* Camera and projection                                               */
/* ------------------------------------------------------------------ */

function createCamera() {
  return {
    yaw: 0.68,
    pitch: 0.36,
    distance: 18,
    target: { x: 0, y: 1.1, z: 0 },
    desired: {
      yaw: 0.68,
      pitch: 0.36,
      distance: 18,
      target: { x: 0, y: 1.1, z: 0 },
    },
  };
}

function resetCamera(camera) {
  camera.desired.yaw = 0.68;
  camera.desired.pitch = 0.36;
  camera.desired.distance = 18;
  camera.desired.target = { x: 0, y: 1.1, z: 0 };
}

/** Read-only camera basis: eye, forward, right, up and vertical field of view. */
function cameraBasis(camera) {
  const cp = Math.cos(camera.pitch);
  const sp = Math.sin(camera.pitch);
  const dir = { x: cp * Math.sin(camera.yaw), y: sp, z: cp * Math.cos(camera.yaw) };
  const eye = {
    x: camera.target.x + dir.x * camera.distance,
    y: camera.target.y + dir.y * camera.distance,
    z: camera.target.z + dir.z * camera.distance,
  };
  const forward = { x: -dir.x, y: -dir.y, z: -dir.z };
  const right = normalize(cross(forward, { x: 0, y: 1, z: 0 }));
  const up = cross(right, forward);
  return { eye: eye, forward: forward, right: right, up: up, fov: 0.95 };
}

function normalize(v) {
  const length = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / length, y: v.y / length, z: v.z / length };
}

function cross(a, b) {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function stepCamera(camera, dt, reducedMotion) {
  const amount = reducedMotion ? 1 : 1 - Math.exp(-dt * 11);
  camera.yaw += (camera.desired.yaw - camera.yaw) * amount;
  camera.pitch += (camera.desired.pitch - camera.pitch) * amount;
  camera.distance += (camera.desired.distance - camera.distance) * amount;
  camera.target.x += (camera.desired.target.x - camera.target.x) * amount;
  camera.target.y += (camera.desired.target.y - camera.target.y) * amount;
  camera.target.z += (camera.desired.target.z - camera.target.z) * amount;
}

function frameCamera(camera, scene) {
  if (!scene || !scene.objects.length) {
    resetCamera(camera);
    return;
  }
  // Frame the objects a user reads, not the substrate: a 100-unit ground plane
  // must not push the content into a speck.
  const framing = scene.objects.filter((object) => object.layer !== "ground" && object.layer !== "structure");
  const subjects = framing.length ? framing : scene.objects;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const object of subjects) {
    minX = Math.min(minX, object.position.x - object.half.x);
    maxX = Math.max(maxX, object.position.x + object.half.x);
    minY = Math.min(minY, object.position.y - object.half.y);
    maxY = Math.max(maxY, object.position.y + object.half.y);
    minZ = Math.min(minZ, object.position.z - object.half.z);
    maxZ = Math.max(maxZ, object.position.z + object.half.z);
  }
  const centre = { x: (minX + maxX) / 2, y: Math.max(0.6, (minY + maxY) / 2), z: (minZ + maxZ) / 2 };
  const span = Math.max(maxX - minX, maxZ - minZ, maxY - minY, 4);
  camera.desired.target = centre;
  camera.desired.distance = clamp(span * 1.35 + 6, 7, 160);
  camera.desired.pitch = clamp(camera.desired.pitch, 0.2, 0.9);
}

function projectCameraPoint(point, width, height, focal) {
  if (point.z <= NEAR) return null;
  return { x: width / 2 + (point.x / point.z) * focal, y: height / 2 - (point.y / point.z) * focal, z: point.z };
}

function toCameraSpace(basis, point) {
  const dx = point.x - basis.eye.x;
  const dy = point.y - basis.eye.y;
  const dz = point.z - basis.eye.z;
  return {
    x: dx * basis.right.x + dy * basis.right.y + dz * basis.right.z,
    y: dx * basis.up.x + dy * basis.up.y + dz * basis.up.z,
    z: dx * basis.forward.x + dy * basis.forward.y + dz * basis.forward.z,
  };
}

function projectPoint(basis, point, width, height, focal) {
  return projectCameraPoint(toCameraSpace(basis, point), width, height, focal);
}

function projectSegment(basis, a, b, width, height, focal) {
  let ca = toCameraSpace(basis, a);
  let cb = toCameraSpace(basis, b);
  if (ca.z <= NEAR && cb.z <= NEAR) return null;
  if (ca.z <= NEAR) {
    const t = (NEAR - ca.z) / (cb.z - ca.z);
    ca = { x: ca.x + (cb.x - ca.x) * t, y: ca.y + (cb.y - ca.y) * t, z: NEAR };
  } else if (cb.z <= NEAR) {
    const t = (NEAR - cb.z) / (ca.z - cb.z);
    cb = { x: cb.x + (ca.x - cb.x) * t, y: cb.y + (ca.y - cb.y) * t, z: NEAR };
  }
  const pa = projectCameraPoint(ca, width, height, focal);
  const pb = projectCameraPoint(cb, width, height, focal);
  return pa && pb ? { a: pa, b: pb } : null;
}

function screenRay(basis, ndcX, ndcY, aspect) {
  const tan = Math.tan(basis.fov / 2);
  return normalize({
    x: basis.forward.x + basis.right.x * ndcX * tan * aspect + basis.up.x * ndcY * tan,
    y: basis.forward.y + basis.right.y * ndcX * tan * aspect + basis.up.y * ndcY * tan,
    z: basis.forward.z + basis.right.z * ndcX * tan * aspect + basis.up.z * ndcY * tan,
  });
}

function groundPointAt(basis, ndcX, ndcY, aspect, planeY) {
  const dir = screenRay(basis, ndcX, ndcY, aspect);
  if (Math.abs(dir.y) < 1e-5) return null;
  const t = (planeY - basis.eye.y) / dir.y;
  if (!Number.isFinite(t) || t <= 0) return null;
  return { x: basis.eye.x + dir.x * t, y: planeY, z: basis.eye.z + dir.z * t };
}

/** Screen-space pick: the closest projected centre, upper layers first. */
function pickObject(scene, basis, screenX, screenY, width, height, focal) {
  let best = null;
  for (const object of scene.objects) {
    const projected = projectPoint(basis, object.position, width, height, focal);
    if (!projected) continue;
    const radiusPx = clamp((object.pickRadius * focal) / projected.z, 9, 220);
    const distance = Math.hypot(projected.x - screenX, projected.y - screenY);
    if (distance > radiusPx) continue;
    const score = object.order * 10000 + distance;
    if (!best || score < best.score) best = { object: object, score: score };
  }
  return best ? best.object : null;
}

function gridSpacing(distance) {
  const target = distance / 9;
  const power = Math.pow(10, Math.floor(Math.log10(Math.max(target, 0.01))));
  const normalized = target / power;
  const step = normalized < 1.5 ? 1 : normalized < 3.5 ? 2 : 5;
  return clamp(step * power, 0.5, 500);
}

function gridLines(camera) {
  const spacing = gridSpacing(camera.distance);
  const radius = spacing * 30;
  const centreX = Math.round(camera.target.x / spacing) * spacing;
  const centreZ = Math.round(camera.target.z / spacing) * spacing;
  const count = Math.floor(radius / spacing);
  const lines = [];
  for (let i = -count; i <= count; i += 1) {
    const offset = i * spacing;
    const distance = Math.abs(offset);
    if (distance >= radius) continue;
    const half = Math.sqrt(Math.max(0, radius * radius - distance * distance));
    const fade = Math.pow(1 - distance / radius, 1.4);
    const major = i % 5 === 0 ? 1.65 : 1;
    const alpha = clamp(0.3 * fade * major, 0, 0.42);
    lines.push({
      a: { x: centreX - half, y: 0, z: centreZ + offset },
      b: { x: centreX + half, y: 0, z: centreZ + offset },
      alpha: alpha,
    });
    lines.push({
      a: { x: centreX + offset, y: 0, z: centreZ - half },
      b: { x: centreX + offset, y: 0, z: centreZ + half },
      alpha: alpha,
    });
  }
  return { lines: lines, spacing: spacing, radius: radius };
}

/* ------------------------------------------------------------------ */
/* Matrix helpers (column major, WebGL layout)                         */
/* ------------------------------------------------------------------ */

function mat4Perspective(fov, aspect, near, far) {
  const f = 1 / Math.tan(fov / 2);
  const out = new Float32Array(16);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) / (near - far);
  out[11] = -1;
  out[14] = (2 * far * near) / (near - far);
  return out;
}

function mat4LookAt(eye, target, up) {
  const z = normalize({ x: eye.x - target.x, y: eye.y - target.y, z: eye.z - target.z });
  const x = normalize(cross(up, z));
  const y = cross(z, x);
  return new Float32Array([
    x.x, y.x, z.x, 0,
    x.y, y.y, z.y, 0,
    x.z, y.z, z.z, 0,
    -dot(x, eye), -dot(y, eye), -dot(z, eye), 1,
  ]);
}

function rotationRows(rotation) {
  const cx = Math.cos(rotation.x), sx = Math.sin(rotation.x);
  const cy = Math.cos(rotation.y), sy = Math.sin(rotation.y);
  const cz = Math.cos(rotation.z), sz = Math.sin(rotation.z);
  return [
    cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx,
    sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx,
    -sy, cy * sx, cy * cx,
  ];
}

function mat4FromTransform(transform, overrideScale) {
  const scale = overrideScale || transform.scale;
  const r = rotationRows(transform.rotation);
  const out = new Float32Array(16);
  out[0] = r[0] * scale.x;
  out[1] = r[3] * scale.x;
  out[2] = r[6] * scale.x;
  out[4] = r[1] * scale.y;
  out[5] = r[4] * scale.y;
  out[6] = r[7] * scale.y;
  out[8] = r[2] * scale.z;
  out[9] = r[5] * scale.z;
  out[10] = r[8] * scale.z;
  out[12] = transform.position.x;
  out[13] = transform.position.y;
  out[14] = transform.position.z;
  out[15] = 1;
  return out;
}

function mat4NormalFromTransform(transform) {
  const scale = transform.scale;
  const r = rotationRows(transform.rotation);
  const out = new Float32Array(16);
  out[0] = r[0] / (scale.x || 1);
  out[1] = r[3] / (scale.x || 1);
  out[2] = r[6] / (scale.x || 1);
  out[4] = r[1] / (scale.y || 1);
  out[5] = r[4] / (scale.y || 1);
  out[6] = r[7] / (scale.y || 1);
  out[8] = r[2] / (scale.z || 1);
  out[9] = r[5] / (scale.z || 1);
  out[10] = r[8] / (scale.z || 1);
  out[15] = 1;
  return out;
}

function mat4Billboard(centre, right, up, back, width, height) {
  return new Float32Array([
    right.x * width, right.y * width, right.z * width, 0,
    up.x * height, up.y * height, up.z * height, 0,
    back.x, back.y, back.z, 0,
    centre.x, centre.y, centre.z, 1,
  ]);
}

/* ------------------------------------------------------------------ */
/* Mesh generation                                                     */
/* ------------------------------------------------------------------ */

function makeBoxMesh() {
  const faces = [
    { n: [0, 0, 1], v: [[-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]] },
    { n: [0, 0, -1], v: [[0.5, -0.5, -0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5]] },
    { n: [1, 0, 0], v: [[0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5]] },
    { n: [-1, 0, 0], v: [[-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5]] },
    { n: [0, 1, 0], v: [[-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5]] },
    { n: [0, -1, 0], v: [[-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5]] },
  ];
  const positions = [];
  const normals = [];
  const indices = [];
  faces.forEach((face, index) => {
    for (const vertex of face.v) {
      positions.push(vertex[0], vertex[1], vertex[2]);
      normals.push(face.n[0], face.n[1], face.n[2]);
    }
    const base = index * 4;
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  });
  return { positions: positions, normals: normals, indices: indices };
}

function makeSphereMesh(rings, segments) {
  const positions = [];
  const normals = [];
  const indices = [];
  for (let r = 0; r <= rings; r += 1) {
    const phi = (r / rings) * Math.PI;
    const y = Math.cos(phi) * 0.5;
    const radius = Math.sin(phi) * 0.5;
    for (let s = 0; s <= segments; s += 1) {
      const theta = (s / segments) * Math.PI * 2;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      positions.push(x, y, z);
      normals.push(x * 2, y * 2, z * 2);
    }
  }
  for (let r = 0; r < rings; r += 1) {
    for (let s = 0; s < segments; s += 1) {
      const a = r * (segments + 1) + s;
      const b = a + segments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  return { positions: positions, normals: normals, indices: indices };
}

function makeCylinderMesh(segments) {
  const positions = [];
  const normals = [];
  const indices = [];
  for (let s = 0; s <= segments; s += 1) {
    const theta = (s / segments) * Math.PI * 2;
    const x = Math.cos(theta) * 0.5;
    const z = Math.sin(theta) * 0.5;
    positions.push(x, -0.5, z, x, 0.5, z);
    normals.push(x * 2, 0, z * 2, x * 2, 0, z * 2);
  }
  for (let s = 0; s < segments; s += 1) {
    const a = s * 2;
    indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  for (const side of [-1, 1]) {
    const centreIndex = positions.length / 3;
    positions.push(0, side * 0.5, 0);
    normals.push(0, side, 0);
    const ringStart = positions.length / 3;
    for (let s = 0; s <= segments; s += 1) {
      const theta = (s / segments) * Math.PI * 2;
      positions.push(Math.cos(theta) * 0.5, side * 0.5, Math.sin(theta) * 0.5);
      normals.push(0, side, 0);
    }
    for (let s = 0; s < segments; s += 1) {
      if (side > 0) indices.push(centreIndex, ringStart + s, ringStart + s + 1);
      else indices.push(centreIndex, ringStart + s + 1, ringStart + s);
    }
  }
  return { positions: positions, normals: normals, indices: indices };
}

function makePlaneMesh() {
  return {
    positions: [-0.5, 0, 0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, -0.5],
    normals: [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    indices: [0, 1, 2, 0, 2, 3],
  };
}

/* ------------------------------------------------------------------ */
/* WebGL2 backend                                                      */
/* ------------------------------------------------------------------ */

const MESH_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
uniform mat4 uProj;
uniform mat4 uView;
uniform mat4 uModel;
uniform mat4 uNormal;
out vec3 vNormal;
out vec3 vWorld;
void main() {
  vec4 world = uModel * vec4(aPos, 1.0);
  vWorld = world.xyz;
  vNormal = mat3(uNormal) * aNormal;
  gl_Position = uProj * uView * world;
}`;

const MESH_FS = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vWorld;
uniform vec3 uColor;
uniform vec3 uRim;
uniform vec3 uEye;
uniform float uAlpha;
out vec4 outColor;
void main() {
  vec3 n = normalize(vNormal);
  vec3 view = normalize(uEye - vWorld);
  if (dot(n, view) < 0.0) n = -n;
  vec3 lightDir = normalize(vec3(0.42, 0.86, 0.32));
  float diffuse = max(dot(n, lightDir), 0.0);
  float rim = pow(1.0 - max(dot(n, view), 0.0), 3.0);
  vec3 lit = uColor * (0.34 + 0.74 * diffuse) + uRim * rim * 0.45;
  outColor = vec4(lit, uAlpha);
}`;

const LINE_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in float aAlpha;
uniform mat4 uProj;
uniform mat4 uView;
out float vAlpha;
void main() {
  vAlpha = aAlpha;
  gl_Position = uProj * uView * vec4(aPos, 1.0);
}`;

const LINE_FS = `#version 300 es
precision mediump float;
in float vAlpha;
uniform vec3 uColor;
out vec4 outColor;
void main() {
  outColor = vec4(uColor, vAlpha);
}`;

const SPRITE_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec2 aUV;
uniform mat4 uProj;
uniform mat4 uView;
uniform mat4 uModel;
out vec2 vUV;
void main() {
  vUV = aUV;
  gl_Position = uProj * uView * uModel * vec4(aPos, 1.0);
}`;

const SPRITE_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uMap;
uniform float uAlpha;
out vec4 outColor;
void main() {
  vec4 texel = texture(uMap, vUV);
  outColor = vec4(texel.rgb, texel.a * uAlpha);
}`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("shader allocation failed");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) || "shader compile failed";
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) throw new Error("program allocation failed");
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) || "program link failed";
    gl.deleteProgram(program);
    throw new Error(log);
  }
  return program;
}

function uploadMesh(gl, data) {
  const vao = gl.createVertexArray();
  const positions = gl.createBuffer();
  const normals = gl.createBuffer();
  const indices = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, positions);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.positions), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, normals);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.normals), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.indices), gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  return { vao: vao, count: data.indices.length };
}

function createLineBuffer(gl) {
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 16, 12);
  gl.bindVertexArray(null);
  return { vao: vao, buffer: buffer, capacity: 0, vertices: 0 };
}

function uploadLines(gl, target, floats) {
  gl.bindBuffer(gl.ARRAY_BUFFER, target.buffer);
  if (floats.length > target.capacity) {
    target.capacity = Math.max(floats.length * 2, 1024);
    gl.bufferData(gl.ARRAY_BUFFER, target.capacity * 4, gl.DYNAMIC_DRAW);
  }
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, floats);
  target.vertices = floats.length / 4;
}

function createSpriteQuad(gl) {
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -0.5, -0.5, 0, 0, 1,
      0.5, -0.5, 0, 1, 1,
      0.5, 0.5, 0, 1, 0,
      -0.5, -0.5, 0, 0, 1,
      0.5, 0.5, 0, 1, 0,
      -0.5, 0.5, 0, 0, 0,
    ]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12);
  gl.bindVertexArray(null);
  return vao;
}

/** Build a label plate as a Canvas2D texture source. */
function createLabelTexture(text, accent, dynamic) {
  const measure = createLabelTexture.canvas || (createLabelTexture.canvas = document.createElement("canvas"));
  const context = measure.getContext("2d");
  const font = '600 44px ' + MONO;
  context.font = font;
  let label = text.length > 42 ? text.slice(0, 41) + "\u2026" : text;
  let width = context.measureText(label).width;
  while (width > 620 && label.length > 6) {
    label = label.slice(0, label.length - 2);
    width = context.measureText(label).width;
  }
  const pad = 30;
  measure.width = Math.max(128, Math.ceil(width + pad * 2));
  measure.height = 112;
  const height = measure.height;
  const ctx = measure.getContext("2d");
  ctx.clearRect(0, 0, measure.width, height);
  ctx.fillStyle = "rgba(8, 10, 14, 0.82)";
  roundRect(ctx, 1, 1, measure.width - 2, height - 2, 10);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = dynamic ? accent : "rgba(232, 235, 240, 0.22)";
  roundRect(ctx, 1, 1, measure.width - 2, height - 2, 10);
  ctx.stroke();
  ctx.fillStyle = "#eef1f5";
  ctx.font = font;
  ctx.textBaseline = "middle";
  ctx.fillText(label, pad, height / 2 + 2);
  return { canvas: measure, aspect: measure.width / height };
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function createWebglBackend(canvas) {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: true,
    depth: true,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  const meshProgram = createProgram(gl, MESH_VS, MESH_FS);
  const lineProgram = createProgram(gl, LINE_VS, LINE_FS);
  const spriteProgram = createProgram(gl, SPRITE_VS, SPRITE_FS);

  const meshes = {
    box: uploadMesh(gl, makeBoxMesh()),
    sphere: uploadMesh(gl, makeSphereMesh(16, 24)),
    cylinder: uploadMesh(gl, makeCylinderMesh(24)),
    plane: uploadMesh(gl, makePlaneMesh()),
  };
  const spriteQuad = createSpriteQuad(gl);
  const sceneLinesSteel = createLineBuffer(gl);
  const sceneLinesAccent = createLineBuffer(gl);
  const selectionLines = createLineBuffer(gl);
  const gridBuffer = createLineBuffer(gl);
  const textures = new Map();

  const uniforms = {
    mesh: {
      proj: gl.getUniformLocation(meshProgram, "uProj"),
      view: gl.getUniformLocation(meshProgram, "uView"),
      model: gl.getUniformLocation(meshProgram, "uModel"),
      normal: gl.getUniformLocation(meshProgram, "uNormal"),
      color: gl.getUniformLocation(meshProgram, "uColor"),
      rim: gl.getUniformLocation(meshProgram, "uRim"),
      eye: gl.getUniformLocation(meshProgram, "uEye"),
      alpha: gl.getUniformLocation(meshProgram, "uAlpha"),
    },
    line: {
      proj: gl.getUniformLocation(lineProgram, "uProj"),
      view: gl.getUniformLocation(lineProgram, "uView"),
      color: gl.getUniformLocation(lineProgram, "uColor"),
    },
    sprite: {
      proj: gl.getUniformLocation(spriteProgram, "uProj"),
      view: gl.getUniformLocation(spriteProgram, "uView"),
      model: gl.getUniformLocation(spriteProgram, "uModel"),
      map: gl.getUniformLocation(spriteProgram, "uMap"),
      alpha: gl.getUniformLocation(spriteProgram, "uAlpha"),
    },
  };

  let scene = null;
  let sceneReady = false;
  let selectionId = null;
  let selectionDirty = true;

  function pushSegment(array, a, b, alpha) {
    array.push(a.x, a.y, a.z, alpha, b.x, b.y, b.z, alpha);
  }

  function buildSceneLines() {
    const steel = [];
    const accent = [];
    if (!scene) {
      uploadLines(gl, sceneLinesSteel, new Float32Array(0));
      uploadLines(gl, sceneLinesAccent, new Float32Array(0));
      return;
    }
    for (const rel of scene.relationships) {
      const from = scene.byId.get(rel.from);
      const to = scene.byId.get(rel.to);
      if (!from || !to) continue;
      const a = from.position;
      const b = to.position;
      if (rel.kind === "contains") {
        appendBox(steel, to, 0.05);
        dashLine(steel, a, b, 0.13, 0.6, 0.35);
      } else if (rel.kind === "links") {
        pushSegment(steel, a, b, 0.2);
      } else if (rel.kind === "drives") {
        dashLine(accent, a, b, 0.3, 0.45, 0.4);
        arrowHead(accent, a, b, 0.32);
      } else {
        dashLine(steel, a, b, 0.22, 0.16, 0.45);
        arrowHead(steel, a, b, 0.22);
      }
    }
    uploadLines(gl, sceneLinesSteel, new Float32Array(steel));
    uploadLines(gl, sceneLinesAccent, new Float32Array(accent));
    selectionDirty = true;
  }

  function buildSelectionLines() {
    const floats = [];
    if (scene && selectionId) {
      const object = scene.byId.get(selectionId);
      if (object) appendBox(floats, object, 0.72, true);
    }
    uploadLines(gl, selectionLines, new Float32Array(floats));
    selectionDirty = false;
  }

  const SHAPE_DRAW = {
    box: { program: meshProgram, mesh: meshes.box },
    sphere: { program: meshProgram, mesh: meshes.sphere },
    cylinder: { program: meshProgram, mesh: meshes.cylinder },
    plane: { program: meshProgram, mesh: meshes.plane },
  };

  function draw(frame) {
    const { camera, basis, width, height, dpr } = frame;
    const aspect = Math.max(width, 1) / Math.max(height, 1);
    const proj = mat4Perspective(basis.fov, aspect, 0.1, 900);
    const view = mat4LookAt(basis.eye, camera.target, { x: 0, y: 1, z: 0 });

    gl.viewport(0, 0, Math.round(width * dpr), Math.round(height * dpr));
    gl.clearColor(0.027, 0.031, 0.039, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    if (!sceneReady) {
      buildSceneLines();
      sceneReady = true;
    }
    if (selectionDirty) buildSelectionLines();

    // Substrate first: the grid and relationship network sit behind every
    // object, so a line can never win against content.
    gl.useProgram(lineProgram);
    gl.uniformMatrix4fv(uniforms.line.proj, false, proj);
    gl.uniformMatrix4fv(uniforms.line.view, false, view);
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);

    gl.uniform3f(uniforms.line.color, 0.5, 0.56, 0.64);
    gl.bindVertexArray(sceneLinesSteel.vao);
    gl.drawArrays(gl.LINES, 0, sceneLinesSteel.vertices);

    gl.uniform3fv(uniforms.line.color, new Float32Array(hexToRgb(frame.accent || DEFAULT_ACCENT)));
    gl.bindVertexArray(sceneLinesAccent.vao);
    gl.drawArrays(gl.LINES, 0, sceneLinesAccent.vertices);

    const grid = gridLines(camera);
    const gridFloats = [];
    for (let i = 0; i < grid.lines.length; i += 1) {
      const line = grid.lines[i];
      pushSegment(gridFloats, line.a, line.b, line.alpha);
    }
    uploadLines(gl, gridBuffer, new Float32Array(gridFloats));
    gl.uniform3f(uniforms.line.color, 0.36, 0.41, 0.48);
    gl.bindVertexArray(gridBuffer.vao);
    gl.drawArrays(gl.LINES, 0, gridBuffer.vertices);

    gl.useProgram(meshProgram);
    gl.uniformMatrix4fv(uniforms.mesh.proj, false, proj);
    gl.uniformMatrix4fv(uniforms.mesh.view, false, view);
    gl.uniform3fv(uniforms.mesh.eye, new Float32Array([basis.eye.x, basis.eye.y, basis.eye.z]));
    const rim = hexToRgb(frame.accent || DEFAULT_ACCENT).map((channel) => channel * 0.5);
    gl.uniform3fv(uniforms.mesh.rim, new Float32Array(rim));
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);

    const layers = [];
    for (const object of scene ? scene.objects : []) {
      const target = SHAPE_DRAW[object.shape];
      if (target) layers.push(object);
    }
    layers.sort((a, b) => a.order - b.order);
    let currentOrder = -1;
    for (const object of layers) {
      // Layer order is the hierarchy: each canonical layer starts with a clear
      // depth buffer so a lower layer can never occlude a higher one.
      if (object.order !== currentOrder) {
        if (currentOrder >= 0) gl.clear(gl.DEPTH_BUFFER_BIT);
        currentOrder = object.order;
      }
      const entry = SHAPE_DRAW[object.shape];
      const transform = {
        position: object.position,
        rotation: object.rotation,
        scale: object.scale,
      };
      const override =
        object.shape === "plane" ? { x: object.scale.x, y: 1, z: object.scale.z } : null;
      const model = mat4FromTransform(transform, override);
      const normalMatrix = mat4NormalFromTransform(transform);
      gl.bindVertexArray(entry.mesh.vao);
      gl.uniformMatrix4fv(uniforms.mesh.model, false, model);
      gl.uniformMatrix4fv(uniforms.mesh.normal, false, normalMatrix);
      gl.uniform3fv(uniforms.mesh.color, new Float32Array(object.colorRgb));
      gl.uniform1f(uniforms.mesh.alpha, object.alpha);
      gl.drawElements(gl.TRIANGLES, entry.mesh.count, gl.UNSIGNED_SHORT, 0);
    }

    gl.useProgram(spriteProgram);
    gl.uniformMatrix4fv(uniforms.sprite.proj, false, proj);
    gl.uniformMatrix4fv(uniforms.sprite.view, false, view);
    gl.uniform1i(uniforms.sprite.map, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.depthMask(false);
    const labels = [];
    for (const object of scene ? scene.objects : []) {
      if (object.shape === "billboard" || object.shape === "text") {
        labels.push({
          object: object,
          text: object.valueText !== null ? object.label + "  " + object.valueText : object.label,
          centre: object.position,
          height: Math.max(0.35, Math.abs(object.scale.y) * BILLBOARD_HEIGHT),
          small: false,
        });
      } else if (object.isDynamic && object.valueText !== null) {
        labels.push({
          object: object,
          text: object.valueText,
          centre: { x: object.position.x, y: object.position.y + object.half.y + 0.42, z: object.position.z },
          height: 0.55,
          small: true,
        });
      }
    }
    labels.sort(
      (a, b) => toCameraSpace(basis, b.centre).z - toCameraSpace(basis, a.centre).z,
    );
    for (const entry of labels) {
      const object = entry.object;
      const text = entry.text;
      const key = (object.isDynamic ? text + "|" + frame.accent + "|d" : text + "|0|s") + (entry.small ? "|s" : "");
      let texture = textures.get(key);
      if (!texture) {
        if (textures.size > 96) {
          const oldestKey = textures.keys().next().value;
          const oldest = textures.get(oldestKey);
          if (oldest) gl.deleteTexture(oldest.texture);
          textures.delete(oldestKey);
        }
        const label = createLabelTexture(text, frame.accent || DEFAULT_ACCENT, object.isDynamic);
        const handle = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, handle);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, label.canvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        texture = { texture: handle, aspect: label.aspect };
        textures.set(key, texture);
      }
      const height = entry.height;
      const width = height * texture.aspect;
      const model = mat4Billboard(entry.centre, basis.right, basis.up, basis.forward, width, height);
      gl.bindTexture(gl.TEXTURE_2D, texture.texture);
      gl.uniformMatrix4fv(uniforms.sprite.model, false, model);
      gl.uniform1f(uniforms.sprite.alpha, 1);
      gl.bindVertexArray(spriteQuad);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.useProgram(lineProgram);
    gl.uniform3fv(uniforms.line.color, new Float32Array(hexToRgb(frame.accent || DEFAULT_ACCENT)));
    gl.bindVertexArray(selectionLines.vao);
    gl.drawArrays(gl.LINES, 0, selectionLines.vertices);
    gl.bindVertexArray(null);
    gl.enable(gl.DEPTH_TEST);
  }

  return {
    kind: "webgl2",
    setScene: function (nextScene) {
      scene = nextScene;
      sceneReady = false;
    },
    setSelection: function (objectId) {
      if (selectionId === objectId) return;
      selectionId = objectId;
      selectionDirty = true;
    },
    draw: draw,
    resize: function () {
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    destroy: function () {
      for (const mesh of Object.values(meshes)) {
        gl.deleteVertexArray(mesh.vao);
      }
      for (const texture of textures.values()) gl.deleteTexture(texture.texture);
      textures.clear();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

function dashLine(array, a, b, alpha, duration, gap) {
  const length = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
  if (length < 0.001) return;
  const dx = (b.x - a.x) / length;
  const dy = (b.y - a.y) / length;
  const dz = (b.z - a.z) / length;
  let travelled = 0;
  while (travelled < length) {
    const end = Math.min(travelled + duration, length);
    const from = { x: a.x + dx * travelled, y: a.y + dy * travelled, z: a.z + dz * travelled };
    const to = { x: a.x + dx * end, y: a.y + dy * end, z: a.z + dz * end };
    array.push(from.x, from.y, from.z, alpha, to.x, to.y, to.z, alpha);
    travelled = end + gap;
  }
}

function arrowHead(array, from, to, alpha) {
  const dir = normalize({ x: to.x - from.x, y: to.y - from.y, z: to.z - from.z });
  const side = normalize(cross(dir, { x: 0, y: 1, z: 0 }));
  if (!Number.isFinite(side.x) || Math.hypot(side.x, side.y, side.z) < 0.5) {
    side.x = 1;
    side.y = 0;
    side.z = 0;
  }
  const size = 0.32;
  const tip = to;
  const base = { x: to.x - dir.x * size, y: to.y - dir.y * size, z: to.z - dir.z * size };
  const left = { x: base.x + side.x * size * 0.55, y: base.y + side.y * size * 0.55, z: base.z + side.z * size * 0.55 };
  const right = { x: base.x - side.x * size * 0.55, y: base.y - side.y * size * 0.55, z: base.z - side.z * size * 0.55 };
  array.push(tip.x, tip.y, tip.z, alpha, left.x, left.y, left.z, alpha);
  array.push(tip.x, tip.y, tip.z, alpha, right.x, right.y, right.z, alpha);
}

function appendBox(array, object, alpha, cornersOnly) {
  const half = object.half;
  const p = object.position;
  const x0 = p.x - half.x, x1 = p.x + half.x;
  const y0 = p.y - half.y, y1 = p.y + half.y;
  const z0 = p.z - half.z, z1 = p.z + half.z;
  const corners = [
    { x: x0, y: y0, z: z0 }, { x: x1, y: y0, z: z0 }, { x: x1, y: y0, z: z1 }, { x: x0, y: y0, z: z1 },
    { x: x0, y: y1, z: z0 }, { x: x1, y: y1, z: z0 }, { x: x1, y: y1, z: z1 }, { x: x0, y: y1, z: z1 },
  ];
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  if (!cornersOnly) {
    for (const [a, b] of edges) {
      const from = corners[a];
      const to = corners[b];
      array.push(from.x, from.y, from.z, alpha, to.x, to.y, to.z, alpha);
    }
    return;
  }
  const size = Math.min(half.x, half.y, half.z, 0.18) * 1.6 + 0.06;
  for (const [a, b] of edges) {
    const from = corners[a];
    const to = corners[b];
    const dx = Math.sign(to.x - from.x) * Math.min(size, Math.abs(to.x - from.x));
    const dy = Math.sign(to.y - from.y) * Math.min(size, Math.abs(to.y - from.y));
    const dz = Math.sign(to.z - from.z) * Math.min(size, Math.abs(to.z - from.z));
    array.push(from.x, from.y, from.z, alpha, from.x + dx, from.y, from.z, alpha);
    array.push(from.x, from.y, from.z, alpha, from.x, from.y + dy, from.z, alpha);
    array.push(from.x, from.y, from.z, alpha, from.x, from.y, from.z + dz, alpha);
  }
}

/* ------------------------------------------------------------------ */
/* Canvas2D backend                                                    */
/* ------------------------------------------------------------------ */

function rgba(rgb, alpha) {
  return "rgba(" + Math.round(clamp(rgb[0], 0, 1) * 255) + "," + Math.round(clamp(rgb[1], 0, 1) * 255) + "," + Math.round(clamp(rgb[2], 0, 1) * 255) + "," + clamp(alpha, 0, 1).toFixed(3) + ")";
}

function objectCorners(object) {
  const r = rotationRows(object.rotation);
  const h = object.half;
  const local = [
    [-h.x, -h.y, -h.z], [h.x, -h.y, -h.z], [h.x, -h.y, h.z], [-h.x, -h.y, h.z],
    [-h.x, h.y, -h.z], [h.x, h.y, -h.z], [h.x, h.y, h.z], [-h.x, h.y, h.z],
  ];
  return local.map((point) => ({
    x: object.position.x + r[0] * point[0] + r[1] * point[1] + r[2] * point[2],
    y: object.position.y + r[3] * point[0] + r[4] * point[1] + r[5] * point[2],
    z: object.position.z + r[6] * point[0] + r[7] * point[1] + r[8] * point[2],
  }));
}

const BOX_FACES = [
  { indices: [4, 5, 6, 7], normal: [0, 0, 1] },
  { indices: [1, 0, 3, 2], normal: [0, 0, -1] },
  { indices: [5, 1, 2, 6], normal: [1, 0, 0] },
  { indices: [0, 4, 7, 3], normal: [-1, 0, 0] },
  { indices: [7, 6, 2, 3], normal: [0, 1, 0] },
  { indices: [0, 1, 5, 4], normal: [0, -1, 0] },
];

function rotateLocal(object, vector) {
  const r = rotationRows(object.rotation);
  return {
    x: r[0] * vector[0] + r[1] * vector[1] + r[2] * vector[2],
    y: r[3] * vector[0] + r[4] * vector[1] + r[5] * vector[2],
    z: r[6] * vector[0] + r[7] * vector[1] + r[8] * vector[2],
  };
}

function createCanvasBackend(canvas) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return null;
  const LIGHT = normalize({ x: 0.42, y: 0.86, z: 0.32 });

  function strokeSegment(basis, a, b, color, alpha, lineWidth, width, height, focal, dash) {
    const projected = projectSegment(basis, a, b, width, height, focal);
    if (!projected) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = clamp(alpha, 0, 1);
    ctx.lineWidth = lineWidth;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(projected.a.x, projected.a.y);
    ctx.lineTo(projected.b.x, projected.b.y);
    ctx.stroke();
    ctx.restore();
  }

  function drawGrid(basis, camera, width, height, focal, accent) {
    const grid = gridLines(camera);
    for (const line of grid.lines) {
      strokeSegment(basis, line.a, line.b, "#5b6472", line.alpha, 1, width, height, focal, null);
    }
    const originA = projectSegment(basis, { x: -1.4, y: 0.004, z: 0 }, { x: 1.4, y: 0.004, z: 0 }, width, height, focal);
    const originB = projectSegment(basis, { x: 0, y: 0.004, z: -1.4 }, { x: 0, y: 0.004, z: 1.4 }, width, height, focal);
    ctx.save();
    ctx.strokeStyle = rgba(hexToRgb(accent), 0.4);
    ctx.lineWidth = 1.5;
    for (const segment of [originA, originB]) {
      if (!segment) continue;
      ctx.beginPath();
      ctx.moveTo(segment.a.x, segment.a.y);
      ctx.lineTo(segment.b.x, segment.b.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBox(basis, object, width, height, focal) {
    const corners = objectCorners(object);
    const projected = corners.map((corner) => projectPoint(basis, corner, width, height, focal));
    if (projected.some((point) => point === null)) return;
    const faces = [];
    for (const face of BOX_FACES) {
      const a = corners[face.indices[0]];
      const b = corners[face.indices[1]];
      const c = corners[face.indices[2]];
      const centre = {
        x: (a.x + b.x + c.x) / 3,
        y: (a.y + b.y + c.y) / 3,
        z: (a.z + b.z + c.z) / 3,
      };
      let normal = rotateLocal(object, face.normal);
      const towardEye = { x: basis.eye.x - centre.x, y: basis.eye.y - centre.y, z: basis.eye.z - centre.z };
      if (dot(normal, towardEye) <= 0) continue;
      const depth = toCameraSpace(basis, centre).z;
      const shade = clamp(0.3 + 0.74 * Math.max(0, dot(normal, LIGHT)), 0.22, 1.05);
      faces.push({ face: face, depth: depth, shade: shade });
    }
    faces.sort((a, b) => b.depth - a.depth);
    for (const entry of faces) {
      ctx.beginPath();
      entry.face.indices.forEach((index, position) => {
        const point = projected[index];
        if (position === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      const rgb = [object.colorRgb[0] * entry.shade, object.colorRgb[1] * entry.shade, object.colorRgb[2] * entry.shade];
      ctx.fillStyle = rgba(rgb, object.alpha);
      ctx.fill();
      ctx.strokeStyle = rgba([0.03, 0.035, 0.045], 0.5);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function drawSphere(basis, object, width, height, focal) {
    const centre = projectPoint(basis, object.position, width, height, focal);
    if (!centre) return;
    const radius = (object.half.x * focal) / centre.z;
    if (!Number.isFinite(radius) || radius < 0.4) return;
    ctx.beginPath();
    ctx.arc(centre.x, centre.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = rgba(object.colorRgb, object.alpha);
    ctx.fill();
    ctx.strokeStyle = rgba([0.03, 0.035, 0.045], 0.55);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(centre.x - radius * 0.3, centre.y - radius * 0.32, Math.max(1, radius * 0.34), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
    ctx.fill();
  }

  function drawCylinder(basis, object, width, height, focal) {
    const upLocal = { x: 0, y: object.half.y, z: 0 };
    const upWorld = rotateLocal(object, [upLocal.x, upLocal.y, upLocal.z]);
    const top = projectPoint(basis, { x: object.position.x + upWorld.x, y: object.position.y + upWorld.y, z: object.position.z + upWorld.z }, width, height, focal);
    const bottom = projectPoint(basis, { x: object.position.x - upWorld.x, y: object.position.y - upWorld.y, z: object.position.z - upWorld.z }, width, height, focal);
    if (!top || !bottom) return;
    const radius = (object.half.x * focal) / ((top.z + bottom.z) / 2);
    if (!Number.isFinite(radius) || radius < 0.4) return;
    ctx.beginPath();
    ctx.moveTo(top.x - radius, top.y);
    ctx.lineTo(bottom.x - radius, bottom.y);
    ctx.lineTo(bottom.x + radius, bottom.y);
    ctx.lineTo(top.x + radius, top.y);
    ctx.closePath();
    ctx.fillStyle = rgba([object.colorRgb[0] * 0.82, object.colorRgb[1] * 0.82, object.colorRgb[2] * 0.82], object.alpha);
    ctx.fill();
    ctx.strokeStyle = rgba([0.03, 0.035, 0.045], 0.5);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(top.x, top.y, radius, Math.max(0.8, radius * 0.3), 0, 0, Math.PI * 2);
    ctx.fillStyle = rgba(object.colorRgb, object.alpha);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(bottom.x, bottom.y, radius, Math.max(0.8, radius * 0.3), 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawPlane(basis, object, width, height, focal) {
    const h = object.half;
    const local = [
      [-h.x, 0, -h.z], [h.x, 0, -h.z], [h.x, 0, h.z], [-h.x, 0, h.z],
    ];
    const points = local.map((point) => {
      const rotated = rotateLocal(object, point);
      return projectPoint(basis, { x: object.position.x + rotated.x, y: object.position.y + rotated.y, z: object.position.z + rotated.z }, width, height, focal);
    });
    if (points.some((point) => point === null)) return;
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.fillStyle = rgba(object.colorRgb, object.alpha * 0.45);
    ctx.fill();
    ctx.strokeStyle = rgba(object.colorRgb, object.alpha * 0.9);
    ctx.lineWidth = 1;
    ctx.stroke();
    if (object.props && object.props.grid === true) {
      ctx.strokeStyle = rgba(object.colorRgb, 0.28);
      for (let step = 1; step < 4; step += 1) {
        const t = step / 4;
        const left = lerpPoint(points[0], points[3], t);
        const right = lerpPoint(points[1], points[2], t);
        const back = lerpPoint(points[0], points[1], t);
        const front = lerpPoint(points[3], points[2], t);
        ctx.beginPath();
        ctx.moveTo(left.x, left.y);
        ctx.lineTo(right.x, right.y);
        ctx.moveTo(back.x, back.y);
        ctx.lineTo(front.x, front.y);
        ctx.stroke();
      }
    }
  }

  function drawLabelPlate(basis, object, frame, width, height, focal) {
    const centre = projectPoint(basis, object.position, width, height, focal);
    if (!centre) return;
    const worldHeight = Math.max(0.35, Math.abs(object.scale.y) * BILLBOARD_HEIGHT);
    const projectedHeight = (worldHeight * focal) / centre.z;
    if (projectedHeight < 6) return;
    const text = object.valueText !== null ? object.label + "  " + object.valueText : object.label;
    const fontSize = clamp(projectedHeight * 0.46, 9, 30);
    ctx.save();
    ctx.font = "600 " + fontSize.toFixed(1) + "px " + MONO;
    const textWidth = ctx.measureText(text).width;
    const padding = fontSize * 0.65;
    const plateWidth = Math.min(Math.max(textWidth + padding * 2, projectedHeight * 1.5), width * 0.6);
    const plateHeight = fontSize * 1.9;
    const x = centre.x - plateWidth / 2;
    const y = centre.y - plateHeight / 2;
    ctx.fillStyle = "rgba(8, 10, 14, 0.84)";
    roundRect(ctx, x, y, plateWidth, plateHeight, Math.min(5, plateHeight * 0.28));
    ctx.fill();
    ctx.strokeStyle = object.isDynamic ? rgba(hexToRgb(frame.accent), 0.55) : "rgba(232, 235, 240, 0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(x + 2, y + 1, plateWidth - 4, plateHeight - 2);
    ctx.clip();
    ctx.fillStyle = "#eef1f5";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + padding, y + plateHeight / 2 + 1);
    ctx.restore();
  }

  function drawValueChip(basis, object, width, height, focal, accent) {
    if (!object.isDynamic || object.valueText === null) return;
    const centre = projectPoint(basis, object.position, width, height, focal);
    if (!centre) return;
    const radius = (object.pickRadius * focal) / centre.z;
    const text = object.valueText;
    ctx.save();
    ctx.font = "600 10px " + MONO;
    const textWidth = ctx.measureText(text).width;
    const x = centre.x - textWidth / 2;
    const y = centre.y + clamp(radius, 8, 260) + 10;
    ctx.fillStyle = "rgba(8, 10, 14, 0.82)";
    roundRect(ctx, x - 7, y - 4, textWidth + 14, 19, 3);
    ctx.fill();
    ctx.strokeStyle = rgba(hexToRgb(accent), 0.45);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y + 6);
    ctx.restore();
  }

  function drawSelection(basis, object, width, height, focal, accent) {
    const corners = objectCorners(object);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const corner of corners) {
      const point = projectPoint(basis, corner, width, height, focal);
      if (!point) continue;
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
    if (!Number.isFinite(minX)) return;
    const pad = 5;
    minX -= pad;
    minY -= pad;
    maxX += pad;
    maxY += pad;
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    ctx.setLineDash([]);
    ctx.lineWidth = 2.5;
    const tick = Math.min(12, (maxX - minX) / 3, (maxY - minY) / 3);
    const cornersScreen = [
      [minX, minY, 1, 1], [maxX, minY, -1, 1], [minX, maxY, 1, -1], [maxX, maxY, -1, -1],
    ];
    for (const [x, y, dx, dy] of cornersScreen) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + tick * dx, y);
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + tick * dy);
      ctx.stroke();
    }
    const label = (LAYER_META[object.layer] ? LAYER_META[object.layer].label : object.layer) + " \u00b7 " + (SHAPE_LABEL[object.shape] || object.shape);
    ctx.font = "600 9px " + MONO;
    const labelWidth = ctx.measureText(label).width;
    ctx.fillStyle = "rgba(8, 10, 14, 0.86)";
    ctx.fillRect(minX, minY - 17, labelWidth + 12, 15);
    ctx.fillStyle = accent;
    ctx.textBaseline = "middle";
    ctx.fillText(label, minX + 6, minY - 9);
    ctx.restore();
  }

  function draw(frame) {
    const { basis, camera, width, height, accent, selectedId } = frame;
    const focal = height / 2 / Math.tan(basis.fov / 2);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const scale = canvas.width / Math.max(width, 1);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    drawGrid(basis, camera, width, height, focal, accent);

    for (const rel of frame.scene.relationships) {
      const from = frame.scene.byId.get(rel.from);
      const to = frame.scene.byId.get(rel.to);
      if (!from || !to) continue;
      if (rel.kind === "contains") {
        const corners = objectCorners(to);
        const projected = corners.map((corner) => projectPoint(basis, corner, width, height, focal));
        ctx.save();
        ctx.strokeStyle = "rgba(127, 143, 163, 0.12)";
        ctx.lineWidth = 1;
        for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) {
          if (!projected[a] || !projected[b]) continue;
          ctx.beginPath();
          ctx.moveTo(projected[a].x, projected[a].y);
          ctx.lineTo(projected[b].x, projected[b].y);
          ctx.stroke();
        }
        ctx.restore();
        strokeSegment(basis, from.position, to.position, "#7f8fa3", 0.18, 1, width, height, focal, [2, 6]);
      } else if (rel.kind === "links") {
        strokeSegment(basis, from.position, to.position, "#7f8fa3", 0.24, 1, width, height, focal, null);
      } else if (rel.kind === "drives") {
        strokeSegment(basis, from.position, to.position, accent, 0.34, 1, width, height, focal, [5, 5]);
      } else {
        strokeSegment(basis, from.position, to.position, "#7f8fa3", 0.24, 1, width, height, focal, [2, 5]);
      }
    }

    const projectedObjects = [];
    for (const object of frame.scene.objects) {
      const cameraSpace = toCameraSpace(basis, object.position);
      if (cameraSpace.z <= NEAR) continue;
      projectedObjects.push({ object: object, depth: cameraSpace.z });
    }
    projectedObjects.sort((a, b) => a.object.order - b.object.order || b.depth - a.depth);

    for (const entry of projectedObjects) {
      const object = entry.object;
      switch (object.shape) {
        case "box":
          drawBox(basis, object, width, height, focal);
          break;
        case "sphere":
          drawSphere(basis, object, width, height, focal);
          break;
        case "cylinder":
          drawCylinder(basis, object, width, height, focal);
          break;
        case "plane":
          drawPlane(basis, object, width, height, focal);
          break;
        case "billboard":
        case "text":
          drawLabelPlate(basis, object, frame, width, height, focal);
          break;
        default:
          break;
      }
      if (object.shape !== "billboard" && object.shape !== "text") {
        drawValueChip(basis, object, width, height, focal, accent);
      }
    }

    if (selectedId) {
      const selected = frame.scene.byId.get(selectedId);
      if (selected) drawSelection(basis, selected, width, height, focal, accent);
    }
  }

  return {
    kind: "canvas2d",
    setScene: function () {},
    setSelection: function () {},
    draw: draw,
    resize: function () {},
    destroy: function () {},
  };
}

function lerpPoint(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/* ------------------------------------------------------------------ */
/* Stage: camera, input, backend selection                             */
/* ------------------------------------------------------------------ */

function probeWebgl() {
  try {
    if (typeof document === "undefined") return false;
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2", { alpha: false, antialias: false });
    if (!gl) return false;
    const mesh = createProgram(gl, MESH_VS, MESH_FS);
    const line = createProgram(gl, LINE_VS, LINE_FS);
    const sprite = createProgram(gl, SPRITE_VS, SPRITE_FS);
    gl.deleteProgram(mesh);
    gl.deleteProgram(line);
    gl.deleteProgram(sprite);
    const lose = gl.getExtension("WEBGL_lose_context");
    if (lose) lose.loseContext();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Create the canvas stage.
 *
 * Owns the camera, pointer and keyboard gestures, and the active backend. It
 * reports intent through callbacks rather than mutating the document: a drag is
 * live `onMove` and exactly one `onCommit` on release.
 */
function createStage(canvas, options = {}) {
  const handlers = {
    onSelect: typeof options.onSelect === "function" ? options.onSelect : function () {},
    onMove: typeof options.onMove === "function" ? options.onMove : function () {},
    onCommit: typeof options.onCommit === "function" ? options.onCommit : function () {},
    onBackend: typeof options.onBackend === "function" ? options.onBackend : function () {},
  };

  const camera = createCamera();
  let scene = buildScene(null, null, DEFAULT_ACCENT);
  let accent = DEFAULT_ACCENT;
  let documentRef = null;
  let resolvedRef = null;
  let selectedId = null;
  let active = false;
  let destroyed = false;
  let width = 1;
  let height = 1;
  let dpr = 1;
  let raf = 0;
  let lastFrame = 0;

  const motionQuery = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  let reducedMotion = !!(motionQuery && motionQuery.matches);
  const onMotionChange = function () {
    reducedMotion = !!(motionQuery && motionQuery.matches);
  };
  if (motionQuery && typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener("change", onMotionChange);
  }

  let backend = null;
  let backendKind = "canvas2d";
  if (probeWebgl()) {
    try {
      backend = createWebglBackend(canvas);
      backendKind = "webgl2";
    } catch (error) {
      backend = null;
    }
  }
  if (!backend) {
    try {
      backend = createCanvasBackend(canvas);
      backendKind = "canvas2d";
    } catch (error) {
      backend = null;
      backendKind = "unavailable";
    }
  }

  const pointers = new Map();
  let gesture = null;

  function applySize() {
    if (destroyed) return;
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width || canvas.clientWidth || 1));
    height = Math.max(1, Math.round(rect.height || canvas.clientHeight || 1));
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const backingWidth = Math.max(1, Math.round(width * dpr));
    const backingHeight = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
      canvas.width = backingWidth;
      canvas.height = backingHeight;
    }
    if (backend) backend.resize();
  }

  function drawNow() {
    if (!backend) return;
    backend.draw({
      scene: scene,
      camera: camera,
      basis: cameraBasis(camera),
      width: width,
      height: height,
      dpr: dpr,
      accent: accent,
      selectedId: selectedId,
    });
  }

  function loop(now) {
    if (!active || destroyed) {
      raf = 0;
      return;
    }
    const dt = lastFrame ? Math.min(0.1, (now - lastFrame) / 1000) : 0.016;
    lastFrame = now;
    stepCamera(camera, dt, reducedMotion);
    drawNow();
    raf = window.requestAnimationFrame(loop);
  }

  function setActive(flag) {
    active = !!flag;
    if (active && !raf) {
      lastFrame = 0;
      applySize();
      raf = window.requestAnimationFrame(loop);
    } else if (!active && raf) {
      window.cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  function setDocument(nextDocument, nextResolved, nextAccent) {
    const nextAccentColor =
      typeof nextAccent === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(nextAccent) ? nextAccent : DEFAULT_ACCENT;
    if (nextDocument === documentRef && nextResolved === resolvedRef && nextAccentColor === accent) return;
    const previous = documentRef;
    const worldChanged =
      !previous || !nextDocument || !previous.world || previous.world.id !== nextDocument.world.id;
    documentRef = nextDocument;
    resolvedRef = nextResolved;
    accent = nextAccentColor;
    scene = buildScene(nextDocument, nextResolved, accent);
    if (backend) {
      backend.setScene(scene);
      backend.setSelection(selectedId);
    }
    if (worldChanged && nextDocument) frameCamera(camera, scene);
  }

  function setSelection(objectId) {
    const next = typeof objectId === "string" && objectId ? objectId : null;
    if (next === selectedId) return;
    selectedId = next;
    if (backend) backend.setSelection(selectedId);
  }

  function viewCentre() {
    return { x: camera.target.x, y: 0, z: camera.target.z };
  }

  function orbitCamera(dx, dy) {
    camera.desired.yaw -= dx * 0.006;
    camera.desired.pitch = clamp(camera.desired.pitch - dy * 0.005, -0.12, 1.42);
  }

  function panCamera(dx, dy) {
    const basis = cameraBasis(camera);
    const groundForward = normalize({ x: basis.forward.x, y: 0, z: basis.forward.z });
    const speed = camera.distance * 0.0019;
    camera.desired.target.x += (-basis.right.x * dx - groundForward.x * dy) * speed;
    camera.desired.target.z += (-basis.right.z * dx - groundForward.z * dy) * speed;
  }

  function localPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      width: Math.max(1, rect.width),
      height: Math.max(1, rect.height),
    };
  }

  function ndcFrom(point) {
    return { x: (point.x / point.width) * 2 - 1, y: 1 - (point.y / point.height) * 2 };
  }

  function hitAt(point) {
    const basis = cameraBasis(camera);
    const focal = point.height / 2 / Math.tan(basis.fov / 2);
    return pickObject(scene, basis, point.x, point.y, point.width, point.height, focal);
  }

  function onPointerDown(event) {
    if (event.button !== 0 && event.button !== 2) return;
    canvas.focus({ preventScroll: true });
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch (error) {
      // Pointer capture is best effort; the gesture still works inside the canvas.
    }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      const values = Array.from(pointers.values());
      gesture = {
        mode: "pinch",
        distance: Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y),
        midX: (values[0].x + values[1].x) / 2,
        midY: (values[0].y + values[1].y) / 2,
      };
      return;
    }
    if (pointers.size > 2) return;
    if (event.button === 2 || event.shiftKey) {
      gesture = { mode: "pan", lastX: event.clientX, lastY: event.clientY };
      return;
    }
    const point = localPoint(event);
    const object = hitAt(point);
    if (object) {
      handlers.onSelect(object.id);
      const basis = cameraBasis(camera);
      const ndc = ndcFrom(point);
      const ground = groundPointAt(basis, ndc.x, ndc.y, point.width / point.height, object.position.y);
      gesture = {
        mode: "object",
        pointerId: event.pointerId,
        id: object.id,
        y: object.position.y,
        offset: ground
          ? { x: object.position.x - ground.x, z: object.position.z - ground.z }
          : { x: 0, z: 0 },
        moved: false,
        startX: event.clientX,
        startY: event.clientY,
        position: copyVec3(object.position),
      };
      return;
    }
    handlers.onSelect(null);
    gesture = { mode: "orbit", lastX: event.clientX, lastY: event.clientY };
  }

  function onPointerMove(event) {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (gesture && gesture.mode === "pinch" && pointers.size >= 2) {
      const values = Array.from(pointers.values());
      const distance = Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
      const midX = (values[0].x + values[1].x) / 2;
      const midY = (values[0].y + values[1].y) / 2;
      if (gesture.distance > 4 && distance > 4) {
        camera.desired.distance = clamp(camera.desired.distance * (gesture.distance / distance), 2.5, 600);
      }
      panCamera(midX - gesture.midX, midY - gesture.midY);
      gesture.distance = distance;
      gesture.midX = midX;
      gesture.midY = midY;
      return;
    }
    if (!gesture) return;

    if (gesture.mode === "orbit") {
      const dx = event.clientX - gesture.lastX;
      const dy = event.clientY - gesture.lastY;
      gesture.lastX = event.clientX;
      gesture.lastY = event.clientY;
      orbitCamera(dx, dy);
      return;
    }

    if (gesture.mode === "pan") {
      panCamera(event.clientX - gesture.lastX, event.clientY - gesture.lastY);
      gesture.lastX = event.clientX;
      gesture.lastY = event.clientY;
      return;
    }

    if (gesture.mode === "object") {
      const point = localPoint(event);
      const ndc = ndcFrom(point);
      const basis = cameraBasis(camera);
      const ground = groundPointAt(basis, ndc.x, ndc.y, point.width / point.height, gesture.y);
      if (!ground) return;
      const position = {
        x: ground.x + gesture.offset.x,
        y: gesture.y,
        z: ground.z + gesture.offset.z,
      };
      gesture.position = position;
      if (Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) > 3) {
        gesture.moved = true;
      }
      const target = scene.byId.get(gesture.id);
      if (target) {
        target.position = position;
        if (backend) backend.setScene(scene);
      }
      handlers.onMove(gesture.id, position);
    }
  }

  function endPointer(event) {
    pointers.delete(event.pointerId);
    if (gesture && gesture.mode === "object" && gesture.pointerId === event.pointerId && gesture.moved) {
      handlers.onCommit(gesture.id, gesture.position);
    }
    if (pointers.size === 0) {
      gesture = null;
    } else if (gesture && gesture.mode === "pinch" && pointers.size === 1) {
      const remaining = Array.from(pointers.values())[0];
      gesture = { mode: "orbit", lastX: remaining.x, lastY: remaining.y };
    }
  }

  function onWheel(event) {
    event.preventDefault();
    camera.desired.distance = clamp(camera.desired.distance * Math.exp(event.deltaY * 0.0011), 2.5, 600);
  }

  function nudgeSelection(key, fine) {
    const object = scene.byId.get(selectedId);
    if (!object) return false;
    const step = fine ? 0.25 : 1;
    const basis = cameraBasis(camera);
    const forward = normalize({ x: basis.forward.x, y: 0, z: basis.forward.z });
    const position = copyVec3(object.position);
    if (key === "ArrowLeft") {
      position.x -= basis.right.x * step;
      position.z -= basis.right.z * step;
    } else if (key === "ArrowRight") {
      position.x += basis.right.x * step;
      position.z += basis.right.z * step;
    } else if (key === "ArrowUp") {
      position.x += forward.x * step;
      position.z += forward.z * step;
    } else if (key === "ArrowDown") {
      position.x -= forward.x * step;
      position.z -= forward.z * step;
    } else {
      return false;
    }
    object.position = position;
    if (backend) backend.setScene(scene);
    handlers.onMove(object.id, position);
    handlers.onCommit(object.id, position);
    return true;
  }

  function onKeyDown(event) {
    if (event.target !== canvas) return;
    const key = event.key;
    if (event.altKey) {
      if (selectedId && key.indexOf("Arrow") === 0) {
        if (nudgeSelection(key, event.shiftKey)) event.preventDefault();
      }
      return;
    }
    if (key === "ArrowLeft") {
      event.preventDefault();
      camera.desired.yaw += 0.09;
    } else if (key === "ArrowRight") {
      event.preventDefault();
      camera.desired.yaw -= 0.09;
    } else if (key === "ArrowUp") {
      event.preventDefault();
      camera.desired.pitch = clamp(camera.desired.pitch + 0.06, -0.12, 1.42);
    } else if (key === "ArrowDown") {
      event.preventDefault();
      camera.desired.pitch = clamp(camera.desired.pitch - 0.06, -0.12, 1.42);
    } else if (key === "+" || key === "=") {
      event.preventDefault();
      camera.desired.distance = clamp(camera.desired.distance * 0.86, 2.5, 600);
    } else if (key === "-" || key === "_") {
      event.preventDefault();
      camera.desired.distance = clamp(camera.desired.distance * 1.16, 2.5, 600);
    } else if (key === "0") {
      event.preventDefault();
      resetCamera(camera);
    } else if (key === "Enter") {
      const basis = cameraBasis(camera);
      const focal = height / 2 / Math.tan(basis.fov / 2);
      const object = pickObject(scene, basis, width / 2, height / 2, width, height, focal);
      event.preventDefault();
      handlers.onSelect(object ? object.id : null);
    } else if (key === "Escape") {
      const hadSelection = Boolean(selectedId);
      handlers.onSelect(null);
      if (hadSelection) event.stopPropagation();
    }
  }

  function onContextMenu(event) {
    event.preventDefault();
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("keydown", onKeyDown);
  canvas.addEventListener("contextmenu", onContextMenu);

  const observer =
    typeof ResizeObserver === "function"
      ? new ResizeObserver(function () {
          applySize();
        })
      : null;
  if (observer && canvas.parentElement) observer.observe(canvas.parentElement);
  window.addEventListener("resize", applySize);

  applySize();
  if (backend) {
    backend.setScene(scene);
    backend.setSelection(null);
  }
  handlers.onBackend(backendKind);

  return {
    get backend() {
      return backendKind;
    },
    setDocument: setDocument,
    setSelection: setSelection,
    setActive: setActive,
    resize: applySize,
    focus: function () {
      canvas.focus({ preventScroll: true });
    },
    viewCentre: viewCentre,
    destroy: function () {
      destroyed = true;
      active = false;
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
      if (observer) observer.disconnect();
      if (motionQuery && typeof motionQuery.removeEventListener === "function") {
        motionQuery.removeEventListener("change", onMotionChange);
      }
      window.removeEventListener("resize", applySize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endPointer);
      canvas.removeEventListener("pointercancel", endPointer);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("contextmenu", onContextMenu);
      if (backend) backend.destroy();
    },
  };
}

/* ------------------------------------------------------------------ */
/* Studio                                                              */
/* ------------------------------------------------------------------ */

function fillSelect(select, entries, value) {
  select.replaceChildren();
  for (const entry of entries) {
    const option = document.createElement("option");
    option.value = entry[0];
    option.textContent = entry[1];
    select.append(option);
  }
  if (value !== undefined) select.value = value;
}

function setFieldValue(input, value) {
  if (document.activeElement === input) return;
  const text = String(value);
  if (input.value !== text) input.value = text;
}

function clearNode(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function defaultScale(shape) {
  switch (shape) {
    case "plane":
      return { x: 6, y: 1, z: 6 };
    case "sphere":
      return { x: 1.4, y: 1.4, z: 1.4 };
    case "cylinder":
      return { x: 1.2, y: 1.6, z: 1.2 };
    case "billboard":
      return { x: 1, y: 1.2, z: 1 };
    case "text":
      return { x: 1, y: 1, z: 1 };
    default:
      return { x: 1.4, y: 1.2, z: 1.4 };
  }
}

function buildObject(layer, kind, shape, title, centre) {
  const scale = defaultScale(shape);
  const restingY = shape === "plane" ? 0 : shape === "billboard" || shape === "text" ? 1.4 : scale.y / 2;
  return {
    id: "obj_" + randomToken(),
    layer: layer,
    kind: kind,
    shape: shape,
    title: title,
    transform: {
      position: { x: centre.x, y: restingY, z: centre.z },
      rotation: { x: 0, y: 0, z: 0 },
      scale: scale,
    },
    props: {},
  };
}

/**
 * Build the studio panel.
 *
 * Every edit becomes one semantic operation on `change` or a button press, so
 * holding a key or typing a value never floods the queue. The studio renders
 * from the client snapshot; it holds no document of its own.
 */
function createStudio(root, deps) {
  const client = deps.client;
  const stage = deps.stage;
  const onWorldChange = deps.onWorldChange;
  const a11yList = deps.a11yList;
  const a11ySummary = deps.a11ySummary;

  const el = {
    pending: document.getElementById("studio-pending"),
    revision: document.getElementById("studio-revision"),
    collapse: document.getElementById("studio-collapse"),
    world: document.getElementById("studio-world"),
    worldNote: document.getElementById("studio-world-note"),
    objects: document.getElementById("studio-objects"),
    objectCount: document.getElementById("studio-object-count"),
    selectedCount: document.getElementById("studio-selected-count"),
    inspect: document.getElementById("studio-inspect"),
    inspectEmpty: document.getElementById("studio-inspect-empty"),
    title: document.getElementById("studio-title"),
    layer: document.getElementById("studio-layer"),
    kind: document.getElementById("studio-kind"),
    x: document.getElementById("studio-x"),
    y: document.getElementById("studio-y"),
    z: document.getElementById("studio-z"),
    transformNote: document.getElementById("studio-transform-note"),
    values: document.getElementById("studio-values"),
    flows: document.getElementById("studio-flows"),
    warn: document.getElementById("studio-inspect-warn"),
    remove: document.getElementById("studio-delete"),
    addForm: document.getElementById("studio-add-form"),
    addTitle: document.getElementById("studio-add-title"),
    addLayer: document.getElementById("studio-add-layer"),
    addKind: document.getElementById("studio-add-kind"),
    addShape: document.getElementById("studio-add-shape"),
    ops: document.getElementById("studio-ops"),
    opsCount: document.getElementById("studio-ops-count"),
    opsEmpty: document.getElementById("studio-ops-empty"),
    discard: document.getElementById("studio-discard"),
    publish: document.getElementById("studio-publish"),
    status: document.getElementById("studio-status"),
  };

  fillSelect(el.layer, LAYERS.map((layer) => [layer, LAYER_META[layer].label]));
  fillSelect(el.kind, KINDS.map((kind) => [kind, kind === "static" ? "Static" : "Dynamic"]));
  fillSelect(el.addLayer, LAYERS.map((layer) => [layer, LAYER_META[layer].label]), "content");
  fillSelect(el.addKind, KINDS.map((kind) => [kind, kind === "static" ? "Static" : "Dynamic"]), "static");
  fillSelect(el.addShape, SHAPES.map((shape) => [shape, SHAPE_LABEL[shape]]), "box");

  let lastView = null;
  let lastSelectedId = null;
  let lastWorldSignature = "";
  let worldsSignature = "";
  let collapsed = false;

  function say(text) {
    if (el.status.textContent !== text) el.status.textContent = text;
  }

  function queue(op) {
    const result = client.queueOperation(op);
    if (!result.ok) say(result.message || "That edit is not valid.");
    return result.ok;
  }

  function setCollapsed(next) {
    collapsed = Boolean(next);
    root.classList.toggle("is-collapsed", collapsed);
    el.collapse.setAttribute("aria-expanded", collapsed ? "false" : "true");
    el.collapse.setAttribute("aria-label", collapsed ? "Show studio" : "Hide studio");
    const label = el.collapse.querySelector(".studio__collapse-label");
    if (label) label.textContent = collapsed ? "Show studio" : "Hide studio";
  }

  function renderWorlds(state) {
    const signature = state.worlds
      .map((world) => {
        const id = typeof world.id === "string" ? world.id : typeof world.worldId === "string" ? world.worldId : "";
        return id + "|" + (world.title || "") + "|" + (world.kind || "");
      })
      .join(",");
    if (signature !== worldsSignature) {
      worldsSignature = signature;
      const currentId = state.view && state.view.world ? state.view.world.id : "";
      el.world.replaceChildren();
      for (const world of state.worlds) {
        const id = typeof world.id === "string" ? world.id : typeof world.worldId === "string" ? world.worldId : "";
        if (!id) continue;
        const option = document.createElement("option");
        option.value = id;
        option.textContent = (world.title || id) + (world.kind === "home" ? "  \u00b7  home" : "  \u00b7  custom");
        el.world.append(option);
      }
      if (currentId) el.world.value = currentId;
    }
    if (state.view && state.view.world) {
      el.world.value = state.view.world.id;
      const objectCount = state.view.objects.length;
      el.worldNote.textContent =
        (state.view.world.kind === "home" ? "Home world" : "Custom world") +
        " \u00b7 " +
        objectCount +
        (objectCount === 1 ? " object" : " objects");
    } else if (state.worlds.length) {
      el.worldNote.textContent = state.worlds.length + (state.worlds.length === 1 ? " world available." : " worlds available.");
    } else {
      el.worldNote.textContent = "The server has not reported any worlds.";
    }
  }

  function renderObjects(state) {
    if (state.view === lastView && state.selectedId === lastSelectedId) return;
    lastView = state.view;
    lastSelectedId = state.selectedId;
    clearNode(el.objects);

    const view = state.view;
    if (!view) {
      el.objectCount.textContent = "0";
      el.objects.append(element("p", "studio__empty", "No world loaded. Check that the server is running, then reload."));
      return;
    }

    const grouped = new Map(LAYERS.map((layer) => [layer, []]));
    for (const object of view.objects) {
      if (grouped.has(object.layer)) grouped.get(object.layer).push(object);
    }
    let total = 0;
    for (const layer of LAYERS) {
      const items = grouped.get(layer);
      if (!items.length) continue;
      total += items.length;
      const group = element("div", "studio__layer");
      group.dataset.layer = layer;
      const head = element("div", "studio__layer-head");
      head.append(element("span", "studio__layer-name", LAYER_META[layer].label));
      head.append(element("span", "studio__layer-count", String(items.length)));
      group.append(head);

      const list = element("ul", "studio__list");
      for (const object of items) {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "studio__object";
        button.dataset.objectId = object.id;
        button.setAttribute("aria-pressed", object.id === state.selectedId ? "true" : "false");
        const title = effectiveTitle(object);
        const shape = SHAPE_LABEL[object.shape] || object.shape;
        const value = state.resolved && state.resolved[object.id] ? state.resolved[object.id] : null;
        let valueText = "";
        if (object.kind === "dynamic" && value) {
          const keys = Object.keys(value);
          if (keys.length) valueText = ", value " + formatScalar(value[keys[0]]);
        }
        button.setAttribute(
          "aria-label",
          "Select " + title + ", " + LAYER_META[object.layer].label + " layer, " + shape + ", " + object.kind + valueText,
        );

        const glyph = element("span", "studio__glyph");
        glyph.dataset.shape = object.shape;
        glyph.setAttribute("aria-hidden", "true");
        const name = element("span", "studio__object-name", title);
        const meta = element("span", "studio__object-meta", shape + (object.kind === "dynamic" ? " \u00b7 live" : ""));
        const body = element("span", "studio__object-body");
        body.append(name, meta);
        button.append(glyph, body);
        if (object.kind === "dynamic") button.append(element("span", "studio__live-dot"));
        item.append(button);
        list.append(item);
      }
      group.append(list);
      el.objects.append(group);
    }
    el.objectCount.textContent = String(total);
    if (!total) {
      el.objects.append(element("p", "studio__empty", "This world has no objects yet. Add one below."));
    }
  }

  function syncInspector(state) {
    const object = state.selected;
    el.inspect.hidden = !object;
    el.inspectEmpty.hidden = Boolean(object);
    el.selectedCount.textContent = object ? object.id : "";
    if (!object) return;

    setFieldValue(el.title, effectiveTitle(object));
    if (document.activeElement !== el.layer) el.layer.value = object.layer;
    if (document.activeElement !== el.kind) el.kind.value = object.kind;
    setFieldValue(el.x, Number(object.transform.position.x.toFixed(2)));
    setFieldValue(el.y, Number(object.transform.position.y.toFixed(2)));
    setFieldValue(el.z, Number(object.transform.position.z.toFixed(2)));

    const rotation = object.transform.rotation;
    const scale = object.transform.scale;
    el.transformNote.textContent =
      (SHAPE_LABEL[object.shape] || object.shape) +
      " \u00b7 rotation " +
      rotation.x.toFixed(2) + " / " + rotation.y.toFixed(2) + " / " + rotation.z.toFixed(2) +
      " \u00b7 scale " +
      scale.x.toFixed(2) + " / " + scale.y.toFixed(2) + " / " + scale.z.toFixed(2);

    clearNode(el.values);
    const resolved = state.resolved && state.resolved[object.id] ? state.resolved[object.id] : null;
    if (resolved && Object.keys(resolved).length) {
      for (const key of Object.keys(resolved)) {
        const row = element("li", "studio__value");
        row.append(element("span", "studio__value-key", key));
        row.append(element("span", "studio__value-value", formatScalar(resolved[key])));
        el.values.append(row);
      }
    } else {
      el.values.append(element("li", "studio__value studio__value--empty", "No resolved values for this object."));
    }

    clearNode(el.flows);
    const flows = state.view && Array.isArray(state.view.dataFlows)
      ? state.view.dataFlows.filter((flow) => flow.targetObject === object.id)
      : [];
    if (flows.length) {
      for (const flow of flows) {
        const row = element("li", "studio__value");
        row.append(element("span", "studio__value-key", flow.direction));
        row.append(element("span", "studio__value-value", flow.path + " \u2192 " + flow.targetProp));
        el.flows.append(row);
      }
    } else {
      el.flows.append(element("li", "studio__value studio__value--empty", "No data flows target this object."));
    }

    const inbound = flows.filter((flow) => flow.direction === "inbound");
    let warning = "";
    if (object.kind === "dynamic" && !inbound.length) {
      warning = "Dynamic objects need at least one inbound data flow. Publish will refuse this object until one is bound.";
    } else if (object.kind === "static" && inbound.length) {
      warning = "Static objects must not have an inbound data flow. Change the kind or remove the flow before publishing.";
    }
    el.warn.hidden = !warning;
    el.warn.textContent = warning;
  }

  function renderOps(state) {
    clearNode(el.ops);
    el.opsCount.textContent = String(state.pending.length);
    el.opsEmpty.hidden = state.pending.length > 0;
    el.discard.disabled = state.pending.length === 0;
    const documentView = state.view || state.document;
    for (const op of state.pending) {
      const item = document.createElement("li");
      item.className = "studio__op";
      item.append(element("span", "studio__op-name", OPERATION_LABEL[op.op] || op.op));
      item.append(element("span", "studio__op-text", describeOperation(op, documentView)));
      el.ops.append(item);
    }
  }

  function renderA11y(state) {
    if (!a11ySummary || !a11yList) return;
    clearNode(a11yList);
    const view = state.view;
    if (!view || !view.objects.length) {
      a11ySummary.textContent = "This world is an infinite 3D canvas. It is currently empty.";
      return;
    }
    const layers = new Set(view.objects.map((object) => object.layer));
    a11ySummary.textContent =
      "This world is an infinite 3D canvas with " +
      view.objects.length +
      (view.objects.length === 1 ? " object" : " objects") +
      " across " +
      layers.size +
      (layers.size === 1 ? " layer." : " layers.") +
      " Choose an object to select it.";
    const list = document.createElement("ul");
    list.className = "world__a11y-items";
    for (const object of view.objects) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "world__a11y-button";
      button.dataset.objectId = object.id;
      const title = effectiveTitle(object);
      button.textContent = title;
      const detail = document.createElement("span");
      detail.className = "world__a11y-detail";
      detail.textContent =
        " \u00b7 " + LAYER_META[object.layer].label + " layer \u00b7 " + (SHAPE_LABEL[object.shape] || object.shape) + " \u00b7 " + object.kind;
      button.append(detail);
      button.setAttribute("aria-pressed", object.id === state.selectedId ? "true" : "false");
      item.append(button);
      list.append(item);
    }
    a11yList.append(list);
  }

  function render(state) {
    const revision = state.view ? state.revision : 0;
    el.revision.textContent = revision ? "REV " + revision : "REV --";
    el.pending.textContent = state.view
      ? state.unpublished
        ? "Pending \u00b7 " + state.pending.length
        : "Published"
      : "No world";
    el.pending.dataset.state = state.view ? (state.unpublished ? "pending" : "published") : "empty";
    el.publish.disabled = !state.unpublished || state.publishing;

    if (state.phase === "draft") say("Creating a draft...");
    else if (state.phase === "edit") say("Applying operations...");
    else if (state.phase === "preview") say("Previewing the candidate document...");
    else if (state.phase === "publishing") say("Publishing...");
    else if (state.error) {
      say(
        state.error.code +
          " \u00b7 " +
          state.error.message +
          (Number.isInteger(state.error.currentRevision) ? " Current revision " + state.error.currentRevision + "." : ""),
      );
    } else if (!state.view) say("No world loaded.");
    else if (state.unpublished) {
      say(state.pending.length + (state.pending.length === 1 ? " pending edit. " : " pending edits. ") + "Not published yet.");
    } else say("Published revision " + state.revision + ".");

    renderWorlds(state);
    renderObjects(state);
    syncInspector(state);
    renderOps(state);
    renderA11y(state);
  }

  /* -- wiring ------------------------------------------------------ */

  el.collapse.addEventListener("click", function () {
    setCollapsed(!collapsed);
    stage.resize();
  });

  el.world.addEventListener("change", function () {
    onWorldChange(el.world.value);
  });

  el.objects.addEventListener("click", function (event) {
    const button = event.target.closest("[data-object-id]");
    if (!button) return;
    client.select(button.dataset.objectId);
  });

  if (a11yList) {
    a11yList.addEventListener("click", function (event) {
      const button = event.target.closest("[data-object-id]");
      if (!button) return;
      client.select(button.dataset.objectId);
    });
  }

  el.title.addEventListener("change", function () {
    const state = client.getState();
    const object = state.selected;
    if (!object) return;
    const value = el.title.value.trim();
    if (!value) {
      el.title.value = effectiveTitle(object);
      return;
    }
    if (value === effectiveTitle(object)) return;
    queue({ op: "object.setProp", objectId: object.id, key: "title", value: value });
  });

  el.layer.addEventListener("change", function () {
    const object = client.getState().selected;
    if (!object || object.layer === el.layer.value) return;
    queue({ op: "object.setLayer", objectId: object.id, layer: el.layer.value });
  });

  el.kind.addEventListener("change", function () {
    const object = client.getState().selected;
    if (!object || object.kind === el.kind.value) return;
    queue({ op: "object.setKind", objectId: object.id, kind: el.kind.value });
  });

  function commitPosition() {
    const state = client.getState();
    const object = state.selected;
    if (!object) return;
    const next = { x: Number(el.x.value), y: Number(el.y.value), z: Number(el.z.value) };
    if (!Number.isFinite(next.x) || !Number.isFinite(next.y) || !Number.isFinite(next.z)) {
      say("Positions must be finite numbers.");
      syncInspector(state);
      return;
    }
    const current = object.transform.position;
    if (next.x === current.x && next.y === current.y && next.z === current.z) return;
    queue({
      op: "object.move",
      objectId: object.id,
      transform: {
        position: next,
        rotation: copyVec3(object.transform.rotation),
        scale: copyVec3(object.transform.scale),
      },
    });
    client.select(object.id);
  }

  el.x.addEventListener("change", commitPosition);
  el.y.addEventListener("change", commitPosition);
  el.z.addEventListener("change", commitPosition);

  el.remove.addEventListener("click", function () {
    const object = client.getState().selected;
    if (!object) return;
    if (queue({ op: "object.remove", objectId: object.id })) {
      client.select(null);
      say("Removal queued. Publish to apply it.");
    }
  });

  el.addForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const layer = el.addLayer.value;
    const kind = el.addKind.value;
    const shape = el.addShape.value;
    const title = el.addTitle.value.trim() || SHAPE_LABEL[shape] || "Object";
    const object = buildObject(layer, kind, shape, title, stage.viewCentre());
    if (queue({ op: "object.add", object: object })) {
      el.addTitle.value = "";
      client.select(object.id);
      say("Object queued. Publish to apply it.");
    }
  });

  el.discard.addEventListener("click", function () {
    if (!client.getState().pending.length) return;
    client.clearOperations();
    say("Pending edits discarded. The canvas shows the published world.");
  });

  el.publish.addEventListener("click", async function () {
    if (el.publish.disabled) return;
    el.publish.disabled = true;
    const result = await client.publish();
    if (!result.ok) {
      const suffix = Number.isInteger(result.currentRevision) ? " Current revision " + result.currentRevision + "." : "";
      say(result.code + " \u00b7 " + result.message + suffix);
      return;
    }
    const warnings = result.diagnostics.filter((diagnostic) => diagnostic && diagnostic.severity !== "info");
    say(
      "Published revision " +
        result.revision +
        "." +
        (warnings.length ? " " + warnings.length + " warning" + (warnings.length === 1 ? "" : "s") + " from preview." : ""),
    );
  });

  setCollapsed(false);
  render(client.getState());

  return { render: render, setCollapsed: setCollapsed };
}

/* ------------------------------------------------------------------ */
/* Surface boot                                                        */
/* ------------------------------------------------------------------ */

function normalizeWorld(world) {
  if (!isObject(world)) return null;
  const id = typeof world.id === "string" ? world.id : typeof world.worldId === "string" ? world.worldId : null;
  if (!id) return null;
  return {
    id: id,
    title: typeof world.title === "string" && world.title ? world.title : id,
    kind: world.kind === "home" ? "home" : "custom",
    accent: typeof world.accent === "string" ? world.accent : DEFAULT_ACCENT,
    revision: Number.isInteger(world.revision) ? world.revision : null,
  };
}

/** Resolve exposed state paths through the document's inbound data flows. */
function resolveValues(document, projection) {
  const resolved = {};
  if (!isObject(projection) || !isDocumentShaped(document)) return resolved;
  const flows = Array.isArray(document.dataFlows) ? document.dataFlows : [];
  for (const flow of flows) {
    if (!isObject(flow) || flow.direction !== "inbound") continue;
    if (typeof flow.path !== "string" || typeof flow.targetObject !== "string" || typeof flow.targetProp !== "string") continue;
    if (!Object.prototype.hasOwnProperty.call(projection, flow.path)) continue;
    const value = projection[flow.path];
    if (!isScalar(value)) continue;
    if (!resolved[flow.targetObject]) resolved[flow.targetObject] = {};
    resolved[flow.targetObject][flow.targetProp] = value;
  }
  return resolved;
}

function emptySurface() {
  return {
    open: function () {},
    close: function () {},
    toggle: function () {},
    refresh: function () {},
    applyServerMessage: function () {
      return { handled: false, kind: null, applied: false };
    },
    destroy: function () {},
    client: null,
    stage: null,
  };
}

/**
 * Boot the world surface: client, canvas and studio wired to the HTTP routes.
 *
 * The surface is closed on load so the mission-control surface stays the first
 * thing a returning user sees. `?world=1` (or `?world=<worldId>`) opens it
 * directly. Server frames are routed in by the host page; this function never
 * opens its own socket.
 */
export function createWorldSurface(options = {}) {
  if (typeof document === "undefined") return emptySurface();
  const settings = isObject(options) ? options : {};
  const byId = function (id) {
    return document.getElementById(id);
  };

  const surface = settings.surface || byId("world");
  const mount = settings.mount || byId("world-mount");
  const canvas = settings.canvas || byId("world-canvas");
  const studioRoot = settings.studio || byId("studio");
  const toggleButton = settings.toggle || byId("btn-world");
  const noticeNode = byId("world-notice");
  const a11yList = byId("world-a11y-list");
  const a11ySummary = byId("world-a11y-summary");
  const chipTitle = byId("world-title");
  const chipRev = byId("world-rev");
  const chipState = byId("world-state");
  const pendingDot = byId("world-pending-dot");
  const closeButton = byId("world-close");

  if (!surface || !mount || !canvas || !studioRoot) return emptySurface();

  const http = createHttp({ fetch: settings.fetch });
  const app = document.querySelector(".app");
  let isOpen = false;
  let currentWorldId = null;
  let worlds = [];
  let pollTimer = 0;
  let refreshToken = 0;
  let backendNotice = "";
  let serviceNotice = "";
  let destroyed = false;

  function renderNotice() {
    if (!noticeNode) return;
    const text = serviceNotice || backendNotice;
    noticeNode.hidden = !text;
    noticeNode.textContent = text;
    noticeNode.dataset.kind = serviceNotice ? "service" : "backend";
  }

  function setNotice(text) {
    serviceNotice = typeof text === "string" ? text : "";
    renderNotice();
  }

  const client = createWorldClient({
    actorId: settings.actorId || "studio",
    baseUrl: settings.baseUrl || "",
    fetch: settings.fetch,
    commandIdFactory: settings.commandIdFactory,
    loadDocument: async function (worldId) {
      const response = await http.get("/api/ui/worlds/" + encodeURIComponent(worldId));
      if (!response.ok) return null;
      const body = isObject(response.body) ? response.body : {};
      return { document: body.document, revision: pickRevisionNumber(body) ?? 0 };
    },
    onState: function (state) {
      render(state);
    },
  });

  const stage = createStage(canvas, {
    onSelect: function (objectId) {
      client.select(objectId);
    },
    onCommit: function (objectId, position) {
      const state = client.getState();
      const object = state.view ? findObject(state.view, objectId) : null;
      if (!object) return;
      client.queueOperation({
        op: "object.move",
        objectId: objectId,
        transform: {
          position: {
            x: Math.round(position.x * 100) / 100,
            y: Math.round(position.y * 100) / 100,
            z: Math.round(position.z * 100) / 100,
          },
          rotation: copyVec3(object.transform.rotation),
          scale: copyVec3(object.transform.scale),
        },
      });
      client.select(objectId);
    },
    onBackend: function (kind) {
      if (kind === "unavailable") {
        backendNotice = "This browser could not start a drawing context. The studio still edits the world, but the canvas stays blank.";
        renderNotice();
      } else if (kind !== "webgl2") {
        backendNotice = "3D acceleration is unavailable. Showing the flat projection of the same world.";
        renderNotice();
      }
    },
  });

  const studio = createStudio(studioRoot, {
    client: client,
    stage: stage,
    onWorldChange: function (worldId) {
      if (worldId && worldId !== currentWorldId) loadWorld(worldId);
    },
    a11yList: a11yList,
    a11ySummary: a11ySummary,
  });

  function render(nextState) {
    const view = nextState.view;
    const world = view && isObject(view.world) ? view.world : null;
    const accent = world && typeof world.accent === "string" ? world.accent : DEFAULT_ACCENT;
    surface.style.setProperty("--world-accent", accent);
    surface.style.setProperty("--world-ink", accentInk(accent));
    stage.setDocument(view, nextState.resolved, accent);
    stage.setSelection(nextState.selectedId);
    studio.render(nextState);

    if (chipTitle) chipTitle.textContent = world && world.title ? world.title : "No world loaded";
    if (chipRev) chipRev.textContent = nextState.revision ? "REV " + nextState.revision : "REV --";
    if (chipState) {
      chipState.textContent = !world ? "No world" : nextState.unpublished ? "PENDING" : "PUBLISHED";
      chipState.dataset.state = !world ? "empty" : nextState.unpublished ? "pending" : "published";
    }
    if (pendingDot) pendingDot.dataset.state = nextState.unpublished ? "pending" : "published";
    if (world && typeof world.id === "string") currentWorldId = world.id;
  }

  async function loadState() {
    const response = await http.get("/api/ui/state");
    if (!response.ok || destroyed) return;
    const body = isObject(response.body) ? response.body : {};
    const projection = isObject(body.projection) ? body.projection : {};
    const current = client.getState();
    client.setResolvedValues(resolveValues(current.view, projection));
  }

  async function loadWorld(worldId) {
    const token = ++refreshToken;
    const response = await http.get("/api/ui/worlds/" + encodeURIComponent(worldId));
    if (token !== refreshToken || destroyed) return;
    if (!response.ok) {
      setNotice("Could not load " + worldId + " (" + response.error.code + ").");
      studio.render(client.getState());
      return;
    }
    const body = isObject(response.body) ? response.body : {};
    if (!isDocumentShaped(body.document)) {
      setNotice("That world has no published document yet.");
      studio.render(client.getState());
      return;
    }
    setNotice("");
    client.clearOperations();
    currentWorldId = worldId;
    client.setDocument(body.document, pickRevisionNumber(body) ?? 0);
    await loadState();
  }

  async function refresh() {
    if (!isOpen || destroyed) return;
    const token = ++refreshToken;
    const response = await http.get("/api/ui/worlds");
    if (token !== refreshToken || destroyed) return;
    if (!response.ok) {
      setNotice("World list unavailable (" + response.error.code + ").");
      return;
    }
    const raw = pickWorlds(response.body) || [];
    worlds = raw.map(normalizeWorld).filter(Boolean);
    client.setWorlds(worlds);
    if (!worlds.length) {
      setNotice("No worlds are published yet. The canvas stays empty until one exists.");
      return;
    }
    if (!currentWorldId) {
      const params = new URLSearchParams(window.location.search);
      const requested = params.get("world");
      const home = worlds.find((world) => world.kind === "home") || worlds[0];
      const wanted = worlds.some((world) => world.id === requested) ? requested : home.id;
      await loadWorld(wanted);
    } else {
      await loadState();
    }
  }

  function startPolling() {
    stopPolling();
    pollTimer = window.setInterval(function () {
      loadState();
    }, 5000);
  }

  function stopPolling() {
    if (pollTimer) window.clearInterval(pollTimer);
    pollTimer = 0;
  }

  function open() {
    if (isOpen || destroyed) return;
    isOpen = true;
    surface.hidden = false;
    if (app) app.inert = true;
    if (toggleButton) toggleButton.setAttribute("aria-pressed", "true");
    document.body.dataset.world = "open";
    stage.setActive(true);
    window.requestAnimationFrame(function () {
      stage.resize();
    });
    refresh();
    startPolling();
    stage.focus();
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    surface.hidden = true;
    if (app) app.inert = false;
    if (toggleButton) toggleButton.setAttribute("aria-pressed", "false");
    delete document.body.dataset.world;
    stage.setActive(false);
    stopPolling();
    if (toggleButton) toggleButton.focus();
  }

  function toggleOpen() {
    if (isOpen) close();
    else open();
  }

  function applyServerMessage(message) {
    const result = client.applyServerMessage(message);
    if (result && result.needsSnapshot && isOpen) {
      const state = client.getState();
      const worldId = state.document && state.document.world ? state.document.world.id : currentWorldId;
      if (worldId) loadWorld(worldId);
      else refresh();
    }
    return result;
  }

  function onToggleClick() {
    toggleOpen();
  }

  function onCloseClick() {
    close();
  }

  function onWindowKeyDown(event) {
    if (!isOpen || event.key !== "Escape") return;
    const active = document.activeElement;
    const tag = active && active.tagName ? active.tagName : "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    event.preventDefault();
    close();
  }

  if (toggleButton) toggleButton.addEventListener("click", onToggleClick);
  if (closeButton) closeButton.addEventListener("click", onCloseClick);
  window.addEventListener("keydown", onWindowKeyDown);

  render(client.getState());

  const params = new URLSearchParams(window.location.search);
  if (params.has("world")) open();

  return {
    open: open,
    close: close,
    toggle: toggleOpen,
    refresh: refresh,
    applyServerMessage: applyServerMessage,
    destroy: function () {
      destroyed = true;
      close();
      stopPolling();
      if (toggleButton) toggleButton.removeEventListener("click", onToggleClick);
      if (closeButton) closeButton.removeEventListener("click", onCloseClick);
      window.removeEventListener("keydown", onWindowKeyDown);
      stage.destroy();
      client.destroy();
    },
    client: client,
    stage: stage,
  };
}





