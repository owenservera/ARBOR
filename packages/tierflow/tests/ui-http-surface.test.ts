/**
 * HTTP surface contract tests.
 *
 * The surface is exercised against an in-memory fake core so every route can be
 * checked without the SQLite store: each documented status, body shape and
 * command mapping is asserted directly.
 */

import { describe, expect, test } from "bun:test";
import {
  handleUiHttpRequest,
  uiWireMessages,
  type UiHttpOptions,
  type UiSurfaceCore,
} from "../src/surfaces/http.ts";
import { contentHash } from "../src/ui/hash.ts";
import {
  UI_SCHEMA_VERSION,
  type UiCommand,
  type UiCommandPort,
  type UiDocument,
  type UiDraft,
  type UiErrorCode,
  type UiResult,
  type UiRevision,
  type UiWorld,
} from "../src/ui/types.ts";

const HOME = "w_home";
const JSON_HEADERS = { "content-type": "application/json" };

function makeDocument(worldId: string, title: string): UiDocument {
  const world: UiWorld = {
    id: worldId,
    kind: worldId === HOME ? "home" : "custom",
    title,
    accent: "#f2b134",
    origin: { x: 0, y: 0, z: 0 },
    unitsPerMeter: 1,
  };
  return {
    schemaVersion: UI_SCHEMA_VERSION,
    world,
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
    relationships: [
      { id: "rel_1", from: "obj_floor", to: "obj_runs", kind: "contains" },
    ],
    dataFlows: [
      {
        id: "flow_1",
        path: "/runs/live",
        targetObject: "obj_runs",
        targetProp: "value",
        direction: "inbound",
      },
    ],
  };
}

function makeRevision(
  worldId: string,
  revision: number,
  title: string,
  actorId = "alice",
): UiRevision {
  const document = makeDocument(worldId, title);
  return {
    revision,
    document,
    contentHash: contentHash(document),
    createdAt: revision * 1_000,
    actorId,
  };
}

function makeDraft(
  worldId: string,
  draftId: string,
  actorId: string,
  baseRevision = 1,
): UiDraft {
  const document = makeDocument(worldId, `Draft ${draftId}`);
  return {
    draftId,
    worldId,
    baseRevision,
    draftRevision: 1,
    document,
    contentHash: contentHash(document),
    updatedAt: baseRevision * 100,
    actorId,
  };
}

interface WorldRow {
  worldId: string;
  kind: "home" | "custom";
  title: string;
  accent: string;
  revision: number;
  createdAt: number;
}

type InjectedFailure = {
  readonly code: UiErrorCode;
  readonly message: string;
  readonly currentRevision?: number;
};

class FakeCore implements UiSurfaceCore {
  readonly commands: UiCommand[] = [];
  readonly revisionsByWorld = new Map<string, UiRevision[]>();
  readonly draftsById = new Map<string, UiDraft>();
  readonly worldRows: WorldRow[] = [];
  readonly projectionValue: Record<string, unknown> = { "/runs/live": 2 };
  failure: InjectedFailure | null = null;
  previewOverride: unknown = null;
  #draftSeq = 0;
  #clock = 10_000;

  seedWorld(
    worldId: string,
    kind: "home" | "custom" = "custom",
    title = worldId,
    accent = "#f2b134",
  ): this {
    if (!this.worldRows.some((row) => row.worldId === worldId)) {
      this.worldRows.push({ worldId, kind, title, accent, revision: 0, createdAt: 1_000 });
    }
    return this;
  }

  seedRevision(
    worldId: string,
    revision: number,
    title: string,
    actorId = "alice",
  ): this {
    const log = this.revisionsByWorld.get(worldId) ?? [];
    log.push(makeRevision(worldId, revision, title, actorId));
    this.revisionsByWorld.set(worldId, log);
    this.seedWorld(worldId, worldId === HOME ? "home" : "custom", title);
    const row = this.worldRows.find((entry) => entry.worldId === worldId);
    if (row !== undefined) row.revision = revision;
    return this;
  }

  seedDraft(draft: UiDraft): this {
    this.draftsById.set(draft.draftId, draft);
    return this;
  }

  current(worldId: string): UiRevision | null {
    const log = this.revisionsByWorld.get(worldId);
    if (log === undefined || log.length === 0) return null;
    return log[log.length - 1] ?? null;
  }

  worlds(): WorldRow[] {
    return this.worldRows;
  }

  revisions(worldId: string, limit?: number): UiRevision[] {
    const log = this.revisionsByWorld.get(worldId) ?? [];
    if (limit === undefined) return [...log];
    return log.slice(-limit);
  }

  drafts(filter?: { worldId?: string; actorId?: string }): UiDraft[] {
    return [...this.draftsById.values()].filter(
      (draft) =>
        (filter?.worldId === undefined || draft.worldId === filter.worldId) &&
        (filter?.actorId === undefined || draft.actorId === filter.actorId),
    );
  }

  preview(draftId: string): unknown {
    if (this.previewOverride !== null) return this.previewOverride;
    const draft = this.draftsById.get(draftId);
    if (draft === undefined) return null;
    return {
      document: draft.document,
      contentHash: draft.contentHash,
      diagnostics: [{ severity: "warning", code: "demo", path: "", message: "demo warning" }],
    };
  }

  projection(): Readonly<Record<string, unknown>> {
    return this.projectionValue;
  }

  draft(draftId: string): UiDraft | null {
    return this.draftsById.get(draftId) ?? null;
  }

  async submit(command: UiCommand): Promise<UiResult<UiRevision>> {
    this.commands.push(command);
    if (this.failure !== null) return { ok: false, ...this.failure };

    const payload = command.payload ?? {};
    switch (command.kind) {
      case "ui.world.create": {
        const worldId =
          typeof payload["worldId"] === "string"
            ? payload["worldId"]
            : `w_custom_${this.worldRows.length + 1}`;
        const title = typeof payload["title"] === "string" ? payload["title"] : worldId;
        const accent = typeof payload["accent"] === "string" ? payload["accent"] : "#4fd1c5";
        this.seedWorld(worldId, "custom", title, accent);
        return { ok: true, value: this.#publish(worldId, title, command.actorId) };
      }

      case "ui.draft.create": {
        const worldId = typeof payload["worldId"] === "string" ? payload["worldId"] : HOME;
        const requestedBase = payload["baseRevision"];
        const baseRevision =
          typeof requestedBase === "number"
            ? requestedBase
            : (this.current(worldId)?.revision ?? 0);
        const document = this.current(worldId)?.document ?? makeDocument(worldId, "Draft base");
        this.#draftSeq += 1;
        const draft: UiDraft = {
          draftId: `draft_${this.#draftSeq}`,
          worldId,
          baseRevision,
          draftRevision: 1,
          document,
          contentHash: contentHash(document),
          updatedAt: this.#tick(),
          actorId: command.actorId,
        };
        this.draftsById.set(draft.draftId, draft);
        return { ok: true, value: this.#stamp(worldId, command.actorId) };
      }

      case "ui.draft.edit": {
        const draftId = String(payload["draftId"] ?? "");
        const draft = this.draftsById.get(draftId);
        if (draft === undefined) {
          return { ok: false, code: "NOT_FOUND", message: `draft "${draftId}" does not exist.` };
        }
        const expected = payload["expectedDraftRevision"];
        if (typeof expected === "number" && expected !== draft.draftRevision) {
          return {
            ok: false,
            code: "REVISION_CONFLICT",
            message: "draft moved",
            currentRevision: draft.draftRevision,
          };
        }
        this.draftsById.set(draftId, {
          ...draft,
          draftRevision: draft.draftRevision + 1,
          updatedAt: this.#tick(),
        });
        return { ok: true, value: this.#stamp(draft.worldId, command.actorId) };
      }

      case "ui.draft.discard": {
        const draftId = String(payload["draftId"] ?? "");
        const draft = this.draftsById.get(draftId);
        if (draft === undefined) {
          return { ok: false, code: "NOT_FOUND", message: `draft "${draftId}" does not exist.` };
        }
        this.draftsById.delete(draftId);
        return { ok: true, value: this.#stamp(draft.worldId, command.actorId) };
      }

      case "ui.draft.commit": {
        const draftId = String(payload["draftId"] ?? "");
        const draft = this.draftsById.get(draftId);
        if (draft === undefined) {
          return { ok: false, code: "NOT_FOUND", message: `draft "${draftId}" does not exist.` };
        }
        const worldId = typeof payload["worldId"] === "string" ? payload["worldId"] : draft.worldId;
        this.draftsById.delete(draftId);
        return {
          ok: true,
          value: this.#publishDocument(worldId, draft.document, command.actorId),
        };
      }

      case "ui.publish": {
        const worldId = typeof payload["worldId"] === "string" ? payload["worldId"] : HOME;
        const document = payload["document"];
        if (typeof document !== "object" || document === null) {
          return { ok: false, code: "INVALID_DOCUMENT", message: "document missing" };
        }
        return {
          ok: true,
          value: this.#publishDocument(worldId, document as UiDocument, command.actorId),
        };
      }

      case "ui.rollback": {
        const worldId = typeof payload["worldId"] === "string" ? payload["worldId"] : HOME;
        const target = Number(payload["targetRevision"] ?? 0);
        const prior = (this.revisionsByWorld.get(worldId) ?? []).find(
          (entry) => entry.revision === target,
        );
        if (prior === undefined) {
          return { ok: false, code: "NOT_FOUND", message: `revision ${target} does not exist.` };
        }
        return {
          ok: true,
          value: this.#publishDocument(worldId, prior.document, command.actorId),
        };
      }

      case "ui.state.set": {
        const path = String(payload["path"] ?? "");
        this.projectionValue[path] = payload["value"];
        return { ok: true, value: this.#stamp(HOME, command.actorId) };
      }
    }
  }

  #publish(worldId: string, title: string, actorId: string): UiRevision {
    return this.#publishDocument(worldId, makeDocument(worldId, title), actorId);
  }

  #publishDocument(worldId: string, document: UiDocument, actorId: string): UiRevision {
    const revision: UiRevision = {
      revision: (this.current(worldId)?.revision ?? 0) + 1,
      document,
      contentHash: contentHash(document),
      createdAt: this.#tick(),
      actorId,
    };
    const log = this.revisionsByWorld.get(worldId) ?? [];
    log.push(revision);
    this.revisionsByWorld.set(worldId, log);

    this.seedWorld(worldId, worldId === HOME ? "home" : "custom", document.world.title);
    const row = this.worldRows.find((entry) => entry.worldId === worldId);
    if (row !== undefined) row.revision = revision.revision;
    return revision;
  }

  #stamp(worldId: string, actorId: string): UiRevision {
    return this.current(worldId) ?? makeRevision(worldId, 0, "Empty", actorId);
  }

  #tick(): number {
    this.#clock += 1;
    return this.#clock;
  }
}

async function call(
  core: UiSurfaceCore,
  method: string,
  path: string,
  payload?: unknown,
  options: Partial<UiHttpOptions> = {},
): Promise<Response | null> {
  const init: RequestInit = { method };
  if (payload !== undefined) {
    init.headers = JSON_HEADERS;
    init.body = typeof payload === "string" ? payload : JSON.stringify(payload);
  }
  return handleUiHttpRequest(new Request(`http://tierflow.test${path}`, init), {
    core,
    ...options,
  });
}

async function send(
  core: UiSurfaceCore,
  method: string,
  path: string,
  payload?: unknown,
  options: Partial<UiHttpOptions> = {},
): Promise<Response> {
  const response = await call(core, method, path, payload, options);
  if (response === null) throw new Error(`expected a UI route for ${method} ${path}`);
  return response;
}

async function body(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

const STATE = {
  commandId: "cmd_state",
  actorId: "alice",
  path: "/runs/live",
  value: 7,
};

describe("UI HTTP surface", () => {
  test("GET /api/ui/worlds lists every world with its published revision", async () => {
    const core = new FakeCore().seedWorld(HOME, "home", "Home").seedRevision(HOME, 1, "Base");
    const response = await send(core, "GET", "/api/ui/worlds");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await body(response)).toEqual({
      worlds: [
        {
          worldId: HOME,
          kind: "home",
          title: "Home",
          accent: "#f2b134",
          revision: 1,
          createdAt: 1_000,
        },
      ],
    });
  });

  test("POST /api/ui/worlds creates a custom world", async () => {
    const core = new FakeCore();
    const response = await send(core, "POST", "/api/ui/worlds", {
      commandId: "cmd_world",
      actorId: "alice",
      worldId: "w_lab",
      title: "Lab",
      accent: "#4fd1c5",
    });
    expect(response.status).toBe(200);

    const revision = (await body(response))["revision"] as UiRevision;
    expect(revision.revision).toBe(1);
    expect(revision.document.world.id).toBe("w_lab");
    expect(revision.document.world.kind).toBe("custom");
    expect(core.commands[0]).toEqual({
      commandId: "cmd_world",
      kind: "ui.world.create",
      actorId: "alice",
      payload: { worldId: "w_lab", title: "Lab", accent: "#4fd1c5" },
    });
  });

  test("GET /api/ui/worlds/:worldId returns the world's published document", async () => {
    const core = new FakeCore().seedRevision(HOME, 2, "Operations", "bob");
    const payload = await body(await send(core, "GET", `/api/ui/worlds/${HOME}`));
    expect(payload["worldId"]).toBe(HOME);
    expect(payload["revision"]).toBe(2);
    expect(payload["contentHash"]).toBe(contentHash(makeDocument(HOME, "Operations")));
    expect((payload["document"] as UiDocument).world.id).toBe(HOME);
  });

  test("GET /api/ui/worlds/:worldId is 404 when the world has no document", async () => {
    const core = new FakeCore().seedWorld("w_empty", "custom", "Empty");
    const response = await send(core, "GET", "/api/ui/worlds/w_empty");
    expect(response.status).toBe(404);
    expect(await body(response)).toMatchObject({ code: "NOT_FOUND" });
  });

  test("GET /api/ui/worlds/:worldId/revisions lists history without documents", async () => {
    const core = new FakeCore()
      .seedRevision(HOME, 1, "One", "alice")
      .seedRevision(HOME, 2, "Two", "bob")
      .seedRevision(HOME, 3, "Three", "alice");
    const payload = await body(
      await send(core, "GET", `/api/ui/worlds/${HOME}/revisions?limit=2`),
    );
    const revisions = payload["revisions"] as Array<Record<string, unknown>>;
    expect(revisions).toHaveLength(2);
    expect(revisions[1]).toEqual({
      revision: 3,
      contentHash: contentHash(makeDocument(HOME, "Three")),
      createdAt: 3_000,
      actorId: "alice",
    });
    expect(revisions[0]).not.toHaveProperty("document");
  });

  test("GET /api/ui/worlds/:worldId/revisions rejects a non-integer limit", async () => {
    const core = new FakeCore().seedRevision(HOME, 1, "One");
    const response = await send(core, "GET", `/api/ui/worlds/${HOME}/revisions?limit=nope`);
    expect(response.status).toBe(400);
    expect(await body(response)).toMatchObject({ code: "INVALID_COMMAND" });
  });

  test("GET /api/ui/drafts filters by the worldId and actorId query parameters", async () => {
    const core = new FakeCore()
      .seedDraft(makeDraft(HOME, "draft_a", "alice"))
      .seedDraft(makeDraft(HOME, "draft_b", "bob"))
      .seedDraft(makeDraft("w_lab", "draft_c", "alice"));

    const all = (await body(await send(core, "GET", "/api/ui/drafts")))["drafts"] as UiDraft[];
    expect(all.map((draft) => draft.draftId).sort()).toEqual(["draft_a", "draft_b", "draft_c"]);

    const byWorld = (await body(
      await send(core, "GET", `/api/ui/drafts?worldId=${HOME}`),
    ))["drafts"] as UiDraft[];
    expect(byWorld.map((draft) => draft.draftId).sort()).toEqual(["draft_a", "draft_b"]);

    const byActor = (await body(
      await send(core, "GET", "/api/ui/drafts?actorId=alice"),
    ))["drafts"] as UiDraft[];
    expect(byActor.map((draft) => draft.draftId).sort()).toEqual(["draft_a", "draft_c"]);

    const both = (await body(
      await send(core, "GET", `/api/ui/drafts?worldId=${HOME}&actorId=alice`),
    ))["drafts"] as UiDraft[];
    expect(both.map((draft) => draft.draftId)).toEqual(["draft_a"]);
  });

  test("POST /api/ui/drafts creates a draft and returns it", async () => {
    const core = new FakeCore().seedRevision(HOME, 3, "Operations");
    const response = await send(core, "POST", "/api/ui/drafts", {
      commandId: "cmd_create",
      actorId: "alice",
      worldId: HOME,
      baseRevision: 3,
    });
    expect(response.status).toBe(200);

    const draft = (await body(response))["draft"] as UiDraft;
    expect(draft.draftId).toBe("draft_1");
    expect(draft.worldId).toBe(HOME);
    expect(draft.actorId).toBe("alice");
    expect(draft.baseRevision).toBe(3);
    expect(core.commands[0]).toEqual({
      commandId: "cmd_create",
      kind: "ui.draft.create",
      actorId: "alice",
      expectedRevision: 3,
      payload: { worldId: HOME, baseRevision: 3 },
    });
  });

  test("POST /api/ui/drafts requires a worldId", async () => {
    const core = new FakeCore();
    const response = await send(core, "POST", "/api/ui/drafts", {
      commandId: "cmd_create",
      actorId: "alice",
    });
    expect(response.status).toBe(400);
    expect(await body(response)).toMatchObject({ code: "INVALID_COMMAND" });
    expect(core.commands).toHaveLength(0);
  });

  test("GET /api/ui/drafts/:id returns the draft and 404 for an unknown id", async () => {
    const core = new FakeCore().seedDraft(makeDraft(HOME, "draft_a", "alice"));
    const found = await body(await send(core, "GET", "/api/ui/drafts/draft_a"));
    expect((found["draft"] as UiDraft).draftId).toBe("draft_a");

    const missing = await send(core, "GET", "/api/ui/drafts/nope");
    expect(missing.status).toBe(404);
    expect(await body(missing)).toMatchObject({ code: "NOT_FOUND" });
  });

  test("DELETE /api/ui/drafts/:id discards the draft", async () => {
    const core = new FakeCore().seedDraft(makeDraft(HOME, "draft_a", "alice"));
    const response = await send(core, "DELETE", "/api/ui/drafts/draft_a", {
      commandId: "cmd_discard",
      actorId: "alice",
    });
    expect(response.status).toBe(200);
    expect(await body(response)).toEqual({ deleted: true });
    expect(core.commands[0]).toMatchObject({
      kind: "ui.draft.discard",
      payload: { draftId: "draft_a" },
    });
  });

  test("POST /api/ui/drafts/:id/edit forwards the operations and returns the draft", async () => {
    const core = new FakeCore().seedDraft(makeDraft(HOME, "draft_a", "alice"));
    const operations = [{ op: "object.setProp", objectId: "obj_runs", prop: "value", value: 3 }];
    const response = await send(core, "POST", "/api/ui/drafts/draft_a/edit", {
      commandId: "cmd_edit",
      actorId: "alice",
      expectedDraftRevision: 1,
      operations,
    });
    expect(response.status).toBe(200);
    expect((await body(response))["draft"]).toMatchObject({
      draftId: "draft_a",
      draftRevision: 2,
    });
    expect(core.commands[0]).toMatchObject({
      kind: "ui.draft.edit",
      payload: { draftId: "draft_a", expectedDraftRevision: 1, operations },
    });
  });

  test("POST /api/ui/drafts/:id/preview returns the candidate render data", async () => {
    const core = new FakeCore().seedDraft(makeDraft(HOME, "draft_a", "alice"));
    const payload = await body(
      await send(core, "POST", "/api/ui/drafts/draft_a/preview", { actorId: "alice" }),
    );
    expect(payload["draft"]).toMatchObject({ draftId: "draft_a" });
    expect((payload["document"] as UiDocument).world.id).toBe(HOME);
    expect(payload["contentHash"]).toBe(contentHash(makeDocument(HOME, "Draft draft_a")));
    expect(payload["diagnostics"]).toHaveLength(1);
    expect(core.commands).toHaveLength(0);
  });

  test("POST /api/ui/drafts/:id/preview requires an actorId", async () => {
    const core = new FakeCore().seedDraft(makeDraft(HOME, "draft_a", "alice"));
    const response = await send(core, "POST", "/api/ui/drafts/draft_a/preview", {});
    expect(response.status).toBe(400);
    expect(await body(response)).toMatchObject({ code: "INVALID_COMMAND" });
  });

  test("preview accepts a UiResult envelope and maps its failure", async () => {
    const core = new FakeCore().seedDraft(makeDraft(HOME, "draft_a", "alice"));
    const document = makeDocument(HOME, "Preview");
    core.previewOverride = {
      ok: true,
      value: {
        draft: makeDraft(HOME, "draft_a", "alice"),
        document,
        contentHash: contentHash(document),
        diagnostics: [],
      },
    };
    const payload = await body(
      await send(core, "POST", "/api/ui/drafts/draft_a/preview", { actorId: "alice" }),
    );
    expect((payload["document"] as UiDocument).world.title).toBe("Preview");
    expect(payload["contentHash"]).toBe(contentHash(document));
    expect(payload["diagnostics"]).toEqual([]);

    core.previewOverride = {
      ok: false,
      code: "INVALID_DOCUMENT",
      message: "Document rejected: object obj_runs has no inbound flow.",
    };
    const refused = await send(core, "POST", "/api/ui/drafts/draft_a/preview", {
      actorId: "alice",
    });
    expect(refused.status).toBe(400);
    expect(await body(refused)).toEqual({
      error: "Document rejected: object obj_runs has no inbound flow.",
      code: "INVALID_DOCUMENT",
    });
  });

  test("POST /api/ui/publish commits a draft when a draftId is given", async () => {
    const core = new FakeCore()
      .seedRevision(HOME, 3, "Operations")
      .seedDraft(makeDraft(HOME, "draft_a", "alice"));
    const payload = await body(
      await send(core, "POST", "/api/ui/publish", {
        commandId: "cmd_publish",
        actorId: "alice",
        expectedRevision: 3,
        worldId: HOME,
        draftId: "draft_a",
      }),
    );
    expect((payload["revision"] as UiRevision).revision).toBe(4);
    expect(core.commands[0]).toMatchObject({
      kind: "ui.draft.commit",
      expectedRevision: 3,
      payload: { worldId: HOME, draftId: "draft_a" },
    });
  });

  test("POST /api/ui/publish publishes a document directly", async () => {
    const core = new FakeCore().seedRevision(HOME, 3, "Operations");
    const document = makeDocument(HOME, "Direct");
    const payload = await body(
      await send(core, "POST", "/api/ui/publish", {
        commandId: "cmd_publish",
        actorId: "alice",
        expectedRevision: 3,
        worldId: HOME,
        document,
      }),
    );
    expect((payload["revision"] as UiRevision).revision).toBe(4);
    expect((payload["revision"] as UiRevision).document).toEqual(document);
    expect(core.commands[0]).toMatchObject({
      kind: "ui.publish",
      expectedRevision: 3,
      payload: { worldId: HOME, document },
    });
  });

  test("POST /api/ui/publish rejects a missing or doubled payload and a missing worldId", async () => {
    const core = new FakeCore();
    const base = { commandId: "cmd_publish", actorId: "alice", expectedRevision: 0 };

    const neither = await send(core, "POST", "/api/ui/publish", { ...base, worldId: HOME });
    expect(neither.status).toBe(400);
    expect(await body(neither)).toMatchObject({ code: "INVALID_COMMAND" });

    const both = await send(core, "POST", "/api/ui/publish", {
      ...base,
      worldId: HOME,
      draftId: "draft_a",
      document: makeDocument(HOME, "Direct"),
    });
    expect(both.status).toBe(400);
    expect(await body(both)).toMatchObject({ code: "INVALID_COMMAND" });

    const noWorld = await send(core, "POST", "/api/ui/publish", {
      ...base,
      document: makeDocument(HOME, "Direct"),
    });
    expect(noWorld.status).toBe(400);
    expect(await body(noWorld)).toMatchObject({ code: "INVALID_COMMAND" });
    expect(core.commands).toHaveLength(0);
  });

  test("POST /api/ui/rollback republishes the target revision", async () => {
    const core = new FakeCore()
      .seedRevision(HOME, 1, "Original")
      .seedRevision(HOME, 2, "Current");
    const payload = await body(
      await send(core, "POST", "/api/ui/rollback", {
        commandId: "cmd_rollback",
        actorId: "alice",
        expectedRevision: 2,
        worldId: HOME,
        targetRevision: 1,
      }),
    );
    const revision = payload["revision"] as UiRevision;
    expect(revision.revision).toBe(3);
    expect(revision.document.world.title).toBe("Original");
    expect(core.commands[0]).toMatchObject({
      kind: "ui.rollback",
      expectedRevision: 2,
      payload: { worldId: HOME, targetRevision: 1 },
    });
  });

  test("GET /api/ui/state returns the projection", async () => {
    const core = new FakeCore();
    expect(await body(await send(core, "GET", "/api/ui/state"))).toEqual({
      projection: { "/runs/live": 2 },
    });
  });

  test("POST /api/ui/state writes one value and echoes it", async () => {
    const core = new FakeCore();
    const payload = await body(await send(core, "POST", "/api/ui/state", STATE));
    expect(payload).toEqual({ path: "/runs/live", value: 7 });
    expect(core.commands[0]).toMatchObject({
      kind: "ui.state.set",
      payload: { path: "/runs/live", value: 7 },
    });
  });

  test("POST /api/ui/state targets the home world unless one is named", async () => {
    const core = new FakeCore().seedWorld(HOME, "home", "Home").seedWorld("w_lab", "custom", "Lab");
    await send(core, "POST", "/api/ui/state", STATE);
    expect(core.commands[0]?.payload).toEqual({ path: "/runs/live", value: 7, worldId: HOME });

    await send(core, "POST", "/api/ui/state", { ...STATE, worldId: "w_lab" });
    expect(core.commands[1]?.payload).toEqual({ path: "/runs/live", value: 7, worldId: "w_lab" });
  });

  test("an unauthorized request is refused with 403", async () => {
    const core = new FakeCore().seedRevision(HOME, 1, "Base");
    const response = await send(core, "GET", "/api/ui/worlds", undefined, {
      authorize: () => false,
    });
    expect(response.status).toBe(403);
    expect(await body(response)).toEqual({ error: "unauthorized", code: "FORBIDDEN" });
    expect(core.commands).toHaveLength(0);
  });

  test("a malformed body is a 400 INVALID_COMMAND", async () => {
    const core = new FakeCore();
    const malformed = await send(core, "POST", "/api/ui/publish", "{not json");
    expect(malformed.status).toBe(400);
    expect(await body(malformed)).toMatchObject({ code: "INVALID_COMMAND" });

    const arrayBody = await send(core, "POST", "/api/ui/state", "[1,2,3]");
    expect(arrayBody.status).toBe(400);
    expect(await body(arrayBody)).toMatchObject({ code: "INVALID_COMMAND" });
    expect(core.commands).toHaveLength(0);
  });

  test("a missing commandId or actorId is a 400 INVALID_COMMAND", async () => {
    const core = new FakeCore();
    const noCommandId = await send(core, "POST", "/api/ui/publish", {
      actorId: "alice",
      expectedRevision: 0,
      worldId: HOME,
      document: makeDocument(HOME, "Direct"),
    });
    expect(noCommandId.status).toBe(400);
    expect(await body(noCommandId)).toMatchObject({ code: "INVALID_COMMAND" });

    const noActorId = await send(core, "POST", "/api/ui/state", {
      commandId: "cmd_state",
      path: "/runs/live",
      value: 1,
    });
    expect(noActorId.status).toBe(400);
    expect(await body(noActorId)).toMatchObject({ code: "INVALID_COMMAND" });
    expect(core.commands).toHaveLength(0);
  });

  test("REVISION_CONFLICT maps to 409 with the current revision", async () => {
    const core = new FakeCore();
    core.failure = {
      code: "REVISION_CONFLICT",
      message: "expected revision 3, current revision 7",
      currentRevision: 7,
    };
    const response = await send(core, "POST", "/api/ui/publish", {
      commandId: "cmd_publish",
      actorId: "alice",
      expectedRevision: 3,
      worldId: HOME,
      document: makeDocument(HOME, "Direct"),
    });
    expect(response.status).toBe(409);
    expect(await body(response)).toEqual({
      error: "expected revision 3, current revision 7",
      code: "REVISION_CONFLICT",
      currentRevision: 7,
    });
  });

  test("IDEMPOTENCY_CONFLICT maps to 409", async () => {
    const core = new FakeCore();
    core.failure = { code: "IDEMPOTENCY_CONFLICT", message: "commandId reused with another payload" };
    const response = await send(core, "POST", "/api/ui/state", STATE);
    expect(response.status).toBe(409);
    expect(await body(response)).toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
  });

  test("NOT_FOUND maps to 404", async () => {
    const core = new FakeCore().seedDraft(makeDraft(HOME, "draft_a", "alice"));
    core.failure = { code: "NOT_FOUND", message: "draft removed" };
    const response = await send(core, "DELETE", "/api/ui/drafts/draft_a", {
      commandId: "cmd_discard",
      actorId: "alice",
    });
    expect(response.status).toBe(404);
    expect(await body(response)).toMatchObject({ code: "NOT_FOUND" });
  });

  test("remaining core codes map to their documented status", async () => {
    const cases: ReadonlyArray<{ readonly code: UiErrorCode; readonly status: number }> = [
      { code: "INVALID_COMMAND", status: 400 },
      { code: "INVALID_DOCUMENT", status: 400 },
      { code: "FORBIDDEN", status: 403 },
      { code: "LIMIT_EXCEEDED", status: 429 },
    ];
    for (const entry of cases) {
      const core = new FakeCore();
      core.failure = { code: entry.code, message: `core refused: ${entry.code}` };
      const response = await send(core, "POST", "/api/ui/state", STATE);
      expect(response.status, entry.code).toBe(entry.status);
      expect(await body(response)).toMatchObject({ error: `core refused: ${entry.code}`, code: entry.code });
    }
  });

  test("a path that is not a UI route returns null", async () => {
    const core = new FakeCore();
    expect(await call(core, "GET", "/api/state")).toBeNull();
    expect(await call(core, "GET", "/healthz")).toBeNull();
    expect(await call(core, "GET", "/api/ui")).toBeNull();
    expect(await call(core, "GET", "/api/ui/unknown")).toBeNull();
    expect(await call(core, "GET", "/api/ui/drafts/draft_a/extra")).toBeNull();
    expect(await call(core, "GET", `/api/ui/worlds/${HOME}/extra`)).toBeNull();
    expect(await call(core, "GET", `/api/ui/worlds/${HOME}/revisions/extra`)).toBeNull();
  });

  test("a wrong method on a UI route returns 405 with an allow header", async () => {
    const core = new FakeCore();

    const worlds = await send(core, "PUT", "/api/ui/worlds", {});
    expect(worlds.status).toBe(405);
    expect(worlds.headers.get("allow")).toBe("GET, POST");
    expect(await body(worlds)).toMatchObject({ code: "METHOD_NOT_ALLOWED" });

    const world = await send(core, "DELETE", `/api/ui/worlds/${HOME}`, {});
    expect(world.status).toBe(405);
    expect(world.headers.get("allow")).toBe("GET");

    const draft = await send(core, "PUT", "/api/ui/drafts/draft_a", {});
    expect(draft.status).toBe(405);
    expect(draft.headers.get("allow")).toBe("GET, DELETE");

    const publish = await send(core, "GET", "/api/ui/publish");
    expect(publish.status).toBe(405);
    expect(publish.headers.get("allow")).toBe("POST");

    const state = await send(core, "PATCH", "/api/ui/state", {});
    expect(state.status).toBe(405);
    expect(state.headers.get("allow")).toBe("GET, POST");
  });

  test("optional core members degrade instead of failing", async () => {
    const current = makeRevision(HOME, 2, "Base");
    const draft = makeDraft(HOME, "draft_a", "alice");
    const bare: UiSurfaceCore = {
      submit: async (): Promise<UiResult<UiRevision>> => ({ ok: true, value: current }),
      current: (worldId) => (worldId === HOME ? current : null),
      worlds: () => [],
      drafts: () => [draft],
      preview: () => null,
    };

    const history = await body(await send(bare, "GET", `/api/ui/worlds/${HOME}/revisions`));
    expect(history).toEqual({
      revisions: [
        {
          revision: 2,
          contentHash: current.contentHash,
          createdAt: 2_000,
          actorId: "alice",
        },
      ],
    });

    expect(await body(await send(bare, "GET", "/api/ui/state"))).toEqual({ projection: {} });

    const found = await body(await send(bare, "GET", "/api/ui/drafts/draft_a"));
    expect((found["draft"] as UiDraft).draftId).toBe("draft_a");
  });

  test("uiWireMessages frames the document then the world list", async () => {
    const core = new FakeCore().seedWorld(HOME, "home", "Home");
    core.seedRevision(HOME, 4, "Operations", "alice");
    const revision = core.current(HOME);
    if (revision === null) throw new Error("seed failed");

    const frames = uiWireMessages(core, revision, HOME);
    expect(frames.map((frame) => frame.kind)).toEqual(["ui.document", "ui.worlds"]);

    const document = frames[0];
    expect(document).toMatchObject({ kind: "ui.document", worldId: HOME });
    if (document?.kind !== "ui.document") throw new Error("expected a document frame");
    expect(document.revision.revision).toBe(4);

    const worlds = frames[1];
    if (worlds?.kind !== "ui.worlds") throw new Error("expected a worlds frame");
    expect(worlds.worlds).toEqual([
      {
        worldId: HOME,
        kind: "home",
        title: "Home",
        accent: "#f2b134",
        revision: 4,
        createdAt: 1_000,
      },
    ]);
  });

  test("uiWireMessages accepts a plain command port", async () => {
    const revision = makeRevision(HOME, 1, "Base");
    const port: UiCommandPort = {
      submit: async (): Promise<UiResult<UiRevision>> => ({ ok: true, value: revision }),
    };
    const frames = uiWireMessages(port, revision, HOME);
    expect(frames.map((frame) => frame.kind)).toEqual(["ui.document"]);
  });
});
