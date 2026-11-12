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
  return parseUiDocument(homeDocument());
}

function worldError(run: () => unknown): UiWorldError {
  try {
    run();
  } catch (error) {
    if (error instanceof UiWorldError) return error;
    throw error;
  }
  throw new Error("expected UiWorldError, nothing was thrown");
}

describe("parseUiDocument", () => {
  test("accepts a valid home world and freezes every level", () => {
    const document = parseUiDocument(homeDocument());

    expect(document.schemaVersion).toBe(1);
    expect(document.world.id).toBe("w_home");
    expect(document.world.kind).toBe("home");
    expect(document.objects.map((object) => object.id)).toEqual(["obj_floor", "obj_runs"]);
    expect(document.relationships).toHaveLength(1);
    expect(document.dataFlows).toHaveLength(1);

    expect(Object.isFrozen(document)).toBe(true);
    expect(Object.isFrozen(document.world)).toBe(true);
    expect(Object.isFrozen(document.world.origin)).toBe(true);
    expect(Object.isFrozen(document.objects)).toBe(true);
    expect(Object.isFrozen(document.relationships)).toBe(true);
    expect(Object.isFrozen(document.dataFlows)).toBe(true);

    for (const object of document.objects) {
      expect(Object.isFrozen(object)).toBe(true);
      expect(Object.isFrozen(object.transform)).toBe(true);
      expect(Object.isFrozen(object.transform.position)).toBe(true);
      expect(Object.isFrozen(object.transform.rotation)).toBe(true);
      expect(Object.isFrozen(object.transform.scale)).toBe(true);
      if (object.props !== undefined) expect(Object.isFrozen(object.props)).toBe(true);
    }
    for (const relationship of document.relationships) expect(Object.isFrozen(relationship)).toBe(true);
    for (const flow of document.dataFlows) expect(Object.isFrozen(flow)).toBe(true);
  });

  test("rejects a non-object document and a wrong schema version", () => {
    for (const input of [null, undefined, 42, "world", [], true]) {
      const error = worldError(() => parseUiDocument(input));
      expect(error.code).toBe("invalid_world");
      expect(error.path).toBe("document");
    }

    const versioned = homeDocument();
    versioned.schemaVersion = 2;
    const error = worldError(() => parseUiDocument(versioned));
    expect(error.code).toBe("invalid_world");
    expect(error.path).toBe("schemaVersion");
  });

  test("rejects an unknown layer, shape or object kind with a path", () => {
    const layerInput = homeDocument();
    layerInput.objects[0].layer = "sky";
    const layerError = worldError(() => parseUiDocument(layerInput));
    expect(layerError.code).toBe("invalid_layer");
    expect(layerError.path).toBe("objects[0].layer");

    const shapeInput = homeDocument();
    shapeInput.objects[1].shape = "torus";
    const shapeError = worldError(() => parseUiDocument(shapeInput));
    expect(shapeError.code).toBe("invalid_shape");
    expect(shapeError.path).toBe("objects[1].shape");

    const kindInput = homeDocument();
    kindInput.objects[1].kind = "reactive";
    const kindError = worldError(() => parseUiDocument(kindInput));
    expect(kindError.code).toBe("invalid_kind");
    expect(kindError.path).toBe("objects[1].kind");
  });

  test("rejects duplicate ids, including ids shared across element kinds", () => {
    const objectsInput = homeDocument();
    objectsInput.objects[1].id = "obj_floor";
    const objectsError = worldError(() => parseUiDocument(objectsInput));
    expect(objectsError.code).toBe("duplicate_id");
    expect(objectsError.path).toBe("objects[1].id");

    const relationshipsInput = homeDocument();
    relationshipsInput.relationships[0].id = "obj_runs";
    const relationshipsError = worldError(() => parseUiDocument(relationshipsInput));
    expect(relationshipsError.code).toBe("duplicate_id");
    expect(relationshipsError.path).toBe("relationships[0].id");

    const flowsInput = homeDocument();
    flowsInput.dataFlows[0].id = "rel_1";
    const flowsError = worldError(() => parseUiDocument(flowsInput));
    expect(flowsError.code).toBe("duplicate_id");
    expect(flowsError.path).toBe("dataFlows[0].id");
  });

  test("rejects unresolved relationship endpoints and flow targets", () => {
    const endpointInput = homeDocument();
    endpointInput.relationships[0].to = "ghost";
    const endpointError = worldError(() => parseUiDocument(endpointInput));
    expect(endpointError.code).toBe("missing_reference");
    expect(endpointError.path).toBe("relationships[0].to");

    const targetInput = homeDocument();
    targetInput.dataFlows[0].targetObject = "ghost";
    const targetError = worldError(() => parseUiDocument(targetInput));
    expect(targetError.code).toBe("missing_reference");
    expect(targetError.path).toBe("dataFlows[0].targetObject");
  });

  test("rejects a contains cycle and names the chain", () => {
    const input = homeDocument();
    input.objects[1].kind = "static";
    input.dataFlows = [];
    input.relationships = [
      { id: "rel_1", from: "obj_floor", to: "obj_runs", kind: "contains" },
      { id: "rel_2", from: "obj_runs", to: "obj_floor", kind: "contains" },
    ];

    const error = worldError(() => parseUiDocument(input));
    expect(error.code).toBe("cycle");
    expect(error.path).toBe("relationships[1]");
    expect(error.message).toContain("obj_floor -> obj_runs -> obj_floor");
  });

  test("rejects a dynamic object without inbound flow and a static object with one", () => {
    const missingInbound = homeDocument();
    missingInbound.dataFlows = [];
    const missingError = worldError(() => parseUiDocument(missingInbound));
    expect(missingError.code).toBe("invalid_object");
    expect(missingError.path).toBe("objects[1].kind");
    expect(missingError.message).toContain("inbound");

    const staticInbound = homeDocument();
    staticInbound.dataFlows.push({
      id: "flow_2",
      path: "/runs/total",
      targetObject: "obj_floor",
      targetProp: "value",
      direction: "inbound",
    });
    const staticError = worldError(() => parseUiDocument(staticInbound));
    expect(staticError.code).toBe("invalid_object");
    expect(staticError.path).toBe("objects[0].kind");
  });

  test("rejects an invalid state path and an unregistered transform name", () => {
    for (const badPath of ["runs/live", "/runs/", "", "/runs live", "/runs/$live"]) {
      const input = homeDocument();
      input.dataFlows[0].path = badPath;
      const error = worldError(() => parseUiDocument(input));
      expect(error.code).toBe("invalid_path");
      expect(error.path).toBe("dataFlows[0].path");
    }

    const input = homeDocument();
    input.dataFlows[0].transform = "uppercase";
    const error = worldError(() => parseUiDocument(input));
    expect(error.code).toBe("invalid_transform_name");
    expect(error.path).toBe("dataFlows[0].transform");

    for (const name of REGISTERED_TRANSFORMS) {
      const registered = homeDocument();
      registered.dataFlows[0].transform = name;
      expect(parseUiDocument(registered).dataFlows[0]!.transform).toBe(name);
    }
  });

  test("rejects a zero scale component and non-finite transform values", () => {
    const zeroScale = homeDocument();
    zeroScale.objects[0].transform.scale.z = 0;
    const zeroError = worldError(() => parseUiDocument(zeroScale));
    expect(zeroError.code).toBe("invalid_transform");
    expect(zeroError.path).toBe("objects[0].transform.scale.z");

    const infinite = homeDocument();
    infinite.objects[0].transform.position.y = Number.POSITIVE_INFINITY;
    const infiniteError = worldError(() => parseUiDocument(infinite));
    expect(infiniteError.code).toBe("invalid_transform");
    expect(infiniteError.path).toBe("objects[0].transform.position.y");

    const notANumber = homeDocument();
    notANumber.objects[1].transform.rotation.x = Number.NaN;
    const nanError = worldError(() => parseUiDocument(notANumber));
    expect(nanError.code).toBe("invalid_transform");
    expect(nanError.path).toBe("objects[1].transform.rotation.x");
  });

  test("rejects a bad accent, unitsPerMeter, world kind, title or world id", () => {
    const accent = homeDocument();
    accent.world.accent = "#12";
    const accentError = worldError(() => parseUiDocument(accent));
    expect(accentError.code).toBe("invalid_world");
    expect(accentError.path).toBe("world.accent");

    const units = homeDocument();
    units.world.unitsPerMeter = 0;
    const unitsError = worldError(() => parseUiDocument(units));
    expect(unitsError.path).toBe("world.unitsPerMeter");

    const kind = homeDocument();
    kind.world.kind = "sandbox";
    const kindError = worldError(() => parseUiDocument(kind));
    expect(kindError.path).toBe("world.kind");

    const title = homeDocument();
    title.world.title = "   ";
    const titleError = worldError(() => parseUiDocument(title));
    expect(titleError.path).toBe("world.title");

    const id = homeDocument();
    id.world.id = "has space";
    const idError = worldError(() => parseUiDocument(id));
    expect(idError.path).toBe("world.id");
  });

  test("rejects props that are not scalars", () => {
    const nested = homeDocument();
    nested.objects[0].props = { meta: { a: 1 } };
    const nestedError = worldError(() => parseUiDocument(nested));
    expect(nestedError.code).toBe("invalid_object");
    expect(nestedError.path).toBe("objects[0].props.meta");

    const array = homeDocument();
    array.objects[0].props = { items: [1, 2] };
    const arrayError = worldError(() => parseUiDocument(array));
    expect(arrayError.path).toBe("objects[0].props.items");

    const notANumber = homeDocument();
    notANumber.objects[0].props = { count: Number.NaN };
    expect(worldError(() => parseUiDocument(notANumber)).path).toBe("objects[0].props.count");

    const callable = homeDocument();
    callable.objects[0].props = { onOpen: () => undefined };
    expect(worldError(() => parseUiDocument(callable)).path).toBe("objects[0].props.onOpen");
  });
});

describe("validateUiDocument", () => {
  test("reports every problem with a path instead of throwing", () => {
    const input = homeDocument();
    input.world.accent = "#12";
    input.objects[0].layer = "sky";
    input.relationships[0].to = "ghost";
    input.dataFlows[0].path = "runs/live";

    const diagnostics = validateUiDocument(input);
    const errors = diagnostics.filter((diagnostic) => diagnostic.severity === "error");
    expect(errors.length).toBeGreaterThanOrEqual(4);

    const byPath = new Map(errors.map((diagnostic) => [diagnostic.path, diagnostic]));
    expect(byPath.get("world.accent")?.code).toBe("invalid_world");
    expect(byPath.get("objects[0].layer")?.code).toBe("invalid_layer");
    expect(byPath.get("relationships[0].to")?.code).toBe("missing_reference");
    expect(byPath.get("dataFlows[0].path")?.code).toBe("invalid_path");
    for (const diagnostic of diagnostics) expect(diagnostic.path.length).toBeGreaterThan(0);

    expect(() => validateUiDocument(null)).not.toThrow();
    expect(validateUiDocument(null)).toHaveLength(1);
  });

  test("warns without blocking: empty world, duplicate titles, upper-case path, empty label", () => {
    const input = homeDocument();
    input.objects = [
      {
        id: "obj_a",
        layer: "ground",
        kind: "static",
        shape: "plane",
        title: "Same",
        transform: transformAt(0, 0, 0),
        props: { grid: true },
      },
      {
        id: "obj_b",
        layer: "content",
        kind: "static",
        shape: "box",
        title: "Same",
        transform: transformAt(1, 0, 0),
      },
    ];
    input.relationships = [{ id: "rel_1", from: "obj_a", to: "obj_b", kind: "links", label: "" }];
    input.dataFlows = [
      { id: "flow_1", path: "/Runs/Live", targetObject: "obj_a", targetProp: "value", direction: "outbound" },
    ];

    const diagnostics = validateUiDocument(input);
    expect(diagnostics.every((diagnostic) => diagnostic.severity === "warning")).toBe(true);
    const codes = diagnostics.map((diagnostic) => diagnostic.code);
    expect(codes).toContain("duplicate_title");
    expect(codes).toContain("empty_relationship_label");
    expect(codes).toContain("uppercase_path_segment");
    expect(parseUiDocument(input).objects).toHaveLength(2);

    const empty = homeDocument();
    empty.objects = [];
    empty.relationships = [];
    empty.dataFlows = [];
    const emptyDiagnostics = validateUiDocument(empty);
    expect(emptyDiagnostics).toHaveLength(1);
    expect(emptyDiagnostics[0]!.severity).toBe("warning");
    expect(emptyDiagnostics[0]!.code).toBe("empty_world");
    expect(emptyDiagnostics[0]!.path).toBe("objects");
    expect(parseUiDocument(empty).objects).toHaveLength(0);
  });

  test("returns no diagnostics for a valid document", () => {
    expect(validateUiDocument(homeDocument())).toEqual([]);
    expect(validateUiDocument(defaultUiDocument())).toEqual([]);
  });
});

describe("defaultUiDocument", () => {
  test("builds a valid, minimal home world", () => {
    const document = defaultUiDocument("home");

    expect(document.schemaVersion).toBe(1);
    expect(document.world).toEqual({
      id: "home",
      kind: "home",
      title: "Home",
      accent: "#f2b134",
      origin: { x: 0, y: 0, z: 0 },
      unitsPerMeter: 1,
    });
    expect(document.objects).toHaveLength(1);
    expect(document.objects[0]!.id).toBe("ground");
    expect(document.objects[0]!.layer).toBe("ground");
    expect(document.objects[0]!.kind).toBe("static");
    expect(document.objects[0]!.shape).toBe("plane");
    expect(document.objects[0]!.title).toBe("Ground");
    expect(document.objects[0]!.props).toEqual({ grid: true });
    expect(document.relationships).toEqual([]);
    expect(document.dataFlows).toEqual([]);
    expect(Object.isFrozen(document)).toBe(true);
    expect(parseUiDocument(document).world.id).toBe("home");
    expect(defaultUiDocument().world.id).toBe("home");
  });

  test("builds a valid custom world", () => {
    const document = defaultUiDocument("custom");
    expect(document.world.id).toBe("custom");
    expect(document.world.kind).toBe("custom");
    expect(document.world.title).toBe("Custom");
    expect(validateUiDocument(document)).toEqual([]);
    expect(parseUiDocument(document).world.kind).toBe("custom");
    expect(uiDocumentHash(document)).toBe(uiDocumentHash(defaultUiDocument("custom")));
    expect(uiDocumentHash(document)).not.toBe(uiDocumentHash(defaultUiDocument("home")));
  });

  test("rejects an unknown world kind", () => {
    const error = worldError(() => defaultUiDocument("sandbox" as unknown as UiWorldKind));
    expect(error.code).toBe("invalid_world");
    expect(error.path).toBe("world.kind");
  });
});

describe("uiDocumentHash", () => {
  test("is stable for equal documents and changes when a transform moves", () => {
    const first = parsedHome();
    const second = parseUiDocument(homeDocument());
    expect(uiDocumentHash(first)).toBe(uiDocumentHash(second));
    expect(uiDocumentHash(first)).toMatch(/^sha256:[0-9a-f]{64}$/);

    const moved = applyUiOperations(first, [
      { op: "object.move", objectId: "obj_floor", transform: transformAt(0, 1, 0) },
    ]);
    expect(uiDocumentHash(moved)).not.toBe(uiDocumentHash(first));
    expect(uiDocumentHash(first)).toBe(uiDocumentHash(second));
  });
});

describe("applyUiOperations", () => {
  test("object.add appends a static object and leaves the input untouched", () => {
    const input = parsedHome();
    const before = uiDocumentHash(input);

    const result = applyUiOperations(input, [
      {
        op: "object.add",
        object: {
          id: "obj_panel",
          layer: "structure",
          kind: "static",
          shape: "box",
          title: "Panel",
          transform: transformAt(2, 1, 0),
          props: { width: 2 },
        },
      },
    ]);

    expect(result.objects.map((object) => object.id)).toEqual(["obj_floor", "obj_runs", "obj_panel"]);
    expect(result.objects[2]!.props).toEqual({ width: 2 });
    expect(input.objects).toHaveLength(2);
    expect(uiDocumentHash(input)).toBe(before);
  });

  test("object.add rejects a duplicate id and a dynamic object without an inbound flow", () => {
    const duplicate = worldError(() =>
      applyUiOperations(parsedHome(), [
        {
          op: "object.add",
          object: { id: "obj_floor", layer: "content", kind: "static", shape: "box", transform: transformAt(0, 0, 0) },
        },
      ]),
    );
    expect(duplicate.code).toBe("duplicate_id");
    expect(duplicate.path).toBe("operations[0].object.id");

    const orphan = worldError(() =>
      applyUiOperations(parsedHome(), [
        {
          op: "object.add",
          object: { id: "obj_live", layer: "data", kind: "dynamic", shape: "billboard", transform: transformAt(0, 3, 0) },
        },
      ]),
    );
    expect(orphan.code).toBe("invalid_object");
    expect(orphan.path).toBe("objects[2].kind");
  });

  test("object.add followed by dataFlow.add in one batch satisfies the dynamic rule", () => {
    const operations: UiOperation[] = [
      {
        op: "object.add",
        object: {
          id: "obj_live",
          layer: "data",
          kind: "dynamic",
          shape: "billboard",
          transform: transformAt(0, 3, 0),
          props: { value: 0 },
        },
      },
      {
        op: "dataFlow.add",
        dataFlow: {
          id: "flow_live",
          path: "/runs/count",
          targetObject: "obj_live",
          targetProp: "value",
          direction: "inbound",
          transform: "count",
        },
      },
    ];

    const result = applyUiOperations(parsedHome(), operations);
    expect(result.objects).toHaveLength(3);
    expect(result.dataFlows).toHaveLength(2);
    expect(result.dataFlows[1]!.transform).toBe("count");
  });

  test("object.remove drops the object, its relationships and its data flows", () => {
    const input = parsedHome();
    const result = applyUiOperations(input, [{ op: "object.remove", objectId: "obj_runs" }]);

    expect(result.objects.map((object) => object.id)).toEqual(["obj_floor"]);
    expect(result.relationships).toHaveLength(0);
    expect(result.dataFlows).toHaveLength(0);
    expect(validateUiDocument(result)).toEqual([]);

    expect(input.objects).toHaveLength(2);
    expect(input.relationships).toHaveLength(1);
    expect(input.dataFlows).toHaveLength(1);
  });

  test("object.move replaces the transform", () => {
    const result = applyUiOperations(parsedHome(), [
      {
        op: "object.move",
        objectId: "obj_runs",
        transform: {
          position: { x: 1, y: 2, z: 3 },
          rotation: { x: 0, y: 45, z: 0 },
          scale: { x: 1, y: 1, z: 2 },
        },
      },
    ]);
    expect(result.objects[1]!.transform.position).toEqual({ x: 1, y: 2, z: 3 });
    expect(Object.isFrozen(result.objects[1]!.transform.position)).toBe(true);
  });

  test("object.setProp adds a prop and undefined removes it", () => {
    const added = applyUiOperations(parsedHome(), [
      { op: "object.setProp", objectId: "obj_runs", key: "label", value: "Live" },
    ]);
    expect(added.objects[1]!.props).toEqual({ value: 0, label: "Live" });

    const removed = applyUiOperations(added, [
      { op: "object.setProp", objectId: "obj_runs", key: "value", value: undefined },
    ]);
    expect(removed.objects[1]!.props).toEqual({ label: "Live" });

    const cleared = applyUiOperations(removed, [
      { op: "object.setProp", objectId: "obj_runs", key: "label", value: undefined },
    ]);
    expect(cleared.objects[1]!.props).toBeUndefined();
  });

  test("object.setLayer moves an object to another canonical layer", () => {
    const result = applyUiOperations(parsedHome(), [
      { op: "object.setLayer", objectId: "obj_floor", layer: "structure" },
    ]);
    expect(result.objects[0]!.layer).toBe("structure");

    const error = worldError(() =>
      applyUiOperations(parsedHome(), [
        { op: "object.setLayer", objectId: "obj_floor", layer: "sky" as unknown as "ground" },
      ]),
    );
    expect(error.code).toBe("invalid_layer");
    expect(error.path).toBe("operations[0].layer");
  });

  test("object.setKind enforces the inbound-flow rule after the switch", () => {
    // Dropping the flow and switching to static must be one batch: either edit
    // alone leaves an invalid document, which is exactly what the final check
    // is for.
    const result = applyUiOperations(parsedHome(), [
      { op: "dataFlow.remove", dataFlowId: "flow_1" },
      { op: "object.setKind", objectId: "obj_runs", kind: "static" },
    ]);
    expect(result.objects[1]!.kind).toBe("static");
    expect(result.dataFlows).toHaveLength(0);

    const error = worldError(() =>
      applyUiOperations(parsedHome(), [{ op: "object.setKind", objectId: "obj_floor", kind: "dynamic" }]),
    );
    expect(error.code).toBe("invalid_object");
    expect(error.path).toBe("objects[0].kind");
  });

  test("relationship.add and relationship.remove edit only the edge list", () => {
    const added = applyUiOperations(parsedHome(), [
      { op: "relationship.add", relationship: { id: "rel_2", from: "obj_runs", to: "obj_floor", kind: "links" } },
    ]);
    expect(added.relationships.map((relationship) => relationship.id)).toEqual(["rel_1", "rel_2"]);

    const removed = applyUiOperations(added, [{ op: "relationship.remove", relationshipId: "rel_1" }]);
    expect(removed.relationships.map((relationship) => relationship.id)).toEqual(["rel_2"]);

    const missing = worldError(() =>
      applyUiOperations(parsedHome(), [
        { op: "relationship.add", relationship: { id: "rel_3", from: "obj_floor", to: "ghost", kind: "links" } },
      ]),
    );
    expect(missing.code).toBe("missing_reference");
    expect(missing.path).toBe("operations[0].relationship.to");
  });

  test("dataFlow.add and dataFlow.remove edit only the flow list", () => {
    const added = applyUiOperations(parsedHome(), [
      {
        op: "dataFlow.add",
        dataFlow: {
          id: "flow_2",
          path: "/selection/count",
          targetObject: "obj_floor",
          targetProp: "highlighted",
          direction: "outbound",
          transform: "count",
        },
      },
    ]);
    expect(added.dataFlows.map((flow) => flow.id)).toEqual(["flow_1", "flow_2"]);

    const removed = applyUiOperations(added, [{ op: "dataFlow.remove", dataFlowId: "flow_2" }]);
    expect(removed.dataFlows.map((flow) => flow.id)).toEqual(["flow_1"]);

    const badTransform = worldError(() =>
      applyUiOperations(parsedHome(), [
        {
          op: "dataFlow.add",
          dataFlow: {
            id: "flow_3",
            path: "/runs/count",
            targetObject: "obj_runs",
            targetProp: "value",
            direction: "inbound",
            transform: "uppercase",
          },
        },
      ]),
    );
    expect(badTransform.code).toBe("invalid_transform_name");
    expect(badTransform.path).toBe("operations[0].dataFlow.transform");
  });

  test("world.setTitle renames the world and rejects an empty title", () => {
    const result = applyUiOperations(parsedHome(), [{ op: "world.setTitle", title: "Studio" }]);
    expect(result.world.title).toBe("Studio");

    const error = worldError(() => applyUiOperations(parsedHome(), [{ op: "world.setTitle", title: "   " }]));
    expect(error.code).toBe("invalid_world");
    expect(error.path).toBe("operations[0].title");
  });

  test("an unknown operation is rejected", () => {
    const error = worldError(() =>
      applyUiOperations(parsedHome(), [{ op: "object.explode" } as unknown as UiOperation]),
    );
    expect(error.code).toBe("invalid_operation");
    expect(error.path).toBe("operations[0].op");
  });

  test("a failing batch is atomic and the input document is unchanged", () => {
    const input = parsedHome();
    const before = uiDocumentHash(input);

    const error = worldError(() =>
      applyUiOperations(input, [
        { op: "object.move", objectId: "obj_runs", transform: transformAt(1, 2, 3) },
        { op: "object.remove", objectId: "ghost" },
      ]),
    );

    expect(error.code).toBe("missing_reference");
    expect(uiDocumentHash(input)).toBe(before);
    expect(input.objects[1]!.transform.position).toEqual({ x: 0, y: 2, z: -4 });
    expect(input.objects).toHaveLength(2);
  });

  test("an empty batch returns a new frozen document with the same hash", () => {
    const input = parsedHome();
    const result = applyUiOperations(input, []);

    expect(result).not.toBe(input);
    expect(uiDocumentHash(result)).toBe(uiDocumentHash(input));
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.objects)).toBe(true);
    expect(Object.isFrozen(result.objects[0]!.transform.scale)).toBe(true);
  });

  test("the result is frozen at every level after an edit", () => {
    const result = applyUiOperations(parsedHome(), [
      { op: "object.setProp", objectId: "obj_floor", key: "grid", value: false },
    ]);

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.world)).toBe(true);
    expect(Object.isFrozen(result.world.origin)).toBe(true);
    expect(Object.isFrozen(result.objects)).toBe(true);
    expect(Object.isFrozen(result.objects[0])).toBe(true);
    expect(Object.isFrozen(result.objects[0]!.transform)).toBe(true);
    expect(Object.isFrozen(result.objects[0]!.transform.scale)).toBe(true);
    expect(Object.isFrozen(result.objects[0]!.props)).toBe(true);
    expect(Object.isFrozen(result.relationships)).toBe(true);
    expect(Object.isFrozen(result.dataFlows)).toBe(true);
  });
});
