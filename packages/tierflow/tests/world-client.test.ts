/**
 * World client contract tests.
 *
 * The client is plain ES module JavaScript with no type declarations, and it is
 * deliberately DOM-free, so the whole publish protocol can be exercised here.
 */

import { describe, expect, test } from "bun:test";
// @ts-ignore web/ ships untyped plain ES modules by design; the client is covered by these tests.
import { createWorldClient } from "../web/world.js";

interface RecordedCall {
  readonly method: string;
  readonly url: string;
  readonly body: any;
}

interface PublishResult {
  readonly ok: boolean;
  readonly revision?: number;
  readonly code?: string;
  readonly currentRevision?: number;
  readonly error?: { code: string; message: string; currentRevision?: number };
}

interface WorldClient {
  setDocument(document: unknown, revision: number): boolean;
  setWorlds(worlds: unknown[]): boolean;
  setResolvedValues(values: Record<string, unknown>): boolean;
  applyServerMessage(message: unknown): {
    handled: boolean;
    kind: string | null;
    applied: boolean;
    needsSnapshot?: boolean;
    error?: { code: string; message: string; currentRevision?: number };
  };
  queueOperation(op: unknown): { ok: boolean; message?: string; length?: number };
  publish(): Promise<PublishResult>;
  select(id: string | null): void;
  clearOperations(): void;
  getState(): {
    document: any;
    view: any;
    revision: number;
    pending: any[];
    unpublished: boolean;
    needsSnapshot: boolean;
    selectedId: string | null;
    error: { code: string; message: string; currentRevision?: number } | null;
  };
  destroy(): void;
}

function makeDocument(title = "Home") {
  return {
    schemaVersion: 1,
    world: {
      id: "w_home",
      kind: "home",
      title,
      accent: "#ff9d3d",
      origin: { x: 0, y: 0, z: 0 },
      unitsPerMeter: 1,
    },
    objects: [
      {
        id: "obj_a",
        layer: "content",
        kind: "static",
        shape: "box",
        title: "Panel",
        transform: {
          position: { x: 0, y: 1, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        props: {},
      },
    ],
    relationships: [],
    dataFlows: [],
  };
}

const NEW_OBJECT = {
  id: "obj_b",
  layer: "data",
  kind: "static",
  shape: "billboard",
  title: "Live runs",
  transform: {
    position: { x: 0, y: 2, z: -4 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  },
  props: {},
};

interface Draft {
  draftId: string;
  worldId: string;
  baseRevision: number;
  draftRevision: number;
  document: unknown;
  contentHash: string;
  updatedAt: number;
  actorId: string;
}

function createServer(document: unknown) {
  const calls: RecordedCall[] = [];
  const draft: Draft = {
    draftId: "d1",
    worldId: "w_home",
    baseRevision: 4,
    draftRevision: 1,
    document: document,
    contentHash: "sha256:draft",
    updatedAt: 100,
    actorId: "alice",
  };

  const fetchImpl = async (url: string, init: any) => {
    const path = new URL(url, "http://localhost").pathname;
    const body = init && init.body ? JSON.parse(init.body) : null;
    calls.push({ method: init.method, url: path, body: body });

    if (init.method === "POST" && path === "/api/ui/drafts") {
      return { ok: true, status: 201, json: async () => ({ draft: draft }) };
    }
    if (init.method === "POST" && path === "/api/ui/drafts/d1/edit") {
      return {
        ok: true,
        status: 200,
        json: async () => ({ draft: { ...draft, draftRevision: 2, document: document } }),
      };
    }
    if (init.method === "POST" && path === "/api/ui/drafts/d1/preview") {
      return {
        ok: true,
        status: 200,
        json: async () => ({ draft: draft, document: document, contentHash: "sha256:preview", diagnostics: [] }),
      };
    }
    if (init.method === "POST" && path === "/api/ui/publish") {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          revision: {
            revision: 5,
            document: document,
            contentHash: "sha256:published",
            createdAt: 200,
            actorId: "alice",
          },
        }),
      };
    }
    return {
      ok: false,
      status: 404,
      json: async () => ({ code: "NOT_FOUND", message: "No route " + path + "." }),
    };
  };

  return { calls, fetch: fetchImpl };
}

function createClient(server: { calls: RecordedCall[]; fetch: any }, overrides: Record<string, unknown> = {}): WorldClient {
  const client = createWorldClient({
    actorId: "alice",
    baseUrl: "http://tierflow.test",
    fetch: server.fetch,
    commandIdFactory: (stage: string) => "cmd_" + stage,
    ...overrides,
  });
  return client as WorldClient;
}

describe("world client", () => {
  test("the operation queue serialises to the exact edit-route body", async () => {
    const document = makeDocument();
    const server = createServer(document);
    const client = createClient(server);
    client.setDocument(document, 4);

    expect(client.queueOperation({ op: "object.add", object: NEW_OBJECT })).toEqual({ ok: true, length: 1 });
    expect(
      client.queueOperation({
        op: "object.move",
        objectId: "obj_b",
        transform: {
          position: { x: 1.5, y: 0, z: -2 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
      }),
    ).toEqual({ ok: true, length: 2 });

    const result = await client.publish();
    expect(result.ok).toBe(true);

    const edit = server.calls.find((call) => call.url === "/api/ui/drafts/d1/edit");
    expect(edit).toBeDefined();
    expect(edit!.method).toBe("POST");
    expect(edit!.body).toEqual({
      commandId: "cmd_edit",
      actorId: "alice",
      expectedDraftRevision: 1,
      operations: [
        {
          op: "object.add",
          object: {
            id: "obj_b",
            layer: "data",
            kind: "static",
            shape: "billboard",
            title: "Live runs",
            transform: {
              position: { x: 0, y: 2, z: -4 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 },
            },
            props: {},
          },
        },
        {
          op: "object.move",
          objectId: "obj_b",
          transform: {
            position: { x: 1.5, y: 0, z: -2 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
          },
        },
      ],
    });
  });

  test("publish runs draft, edit, preview, publish and returns the revision", async () => {
    const document = makeDocument();
    const server = createServer(document);
    const client = createClient(server);
    client.setDocument(document, 4);
    client.queueOperation({ op: "object.remove", objectId: "obj_a" });

    const result = await client.publish();

    expect(result.ok).toBe(true);
    expect(result.revision).toBe(5);
    expect(server.calls.map((call) => call.method + " " + call.url)).toEqual([
      "POST /api/ui/drafts",
      "POST /api/ui/drafts/d1/edit",
      "POST /api/ui/drafts/d1/preview",
      "POST /api/ui/publish",
    ]);
    expect(server.calls[0]!.body).toEqual({
      commandId: "cmd_draft",
      actorId: "alice",
      worldId: "w_home",
      baseRevision: 4,
    });
    expect(server.calls[2]!.body).toEqual({ actorId: "alice" });
    expect(server.calls[3]!.body).toEqual({
      commandId: "cmd_publish",
      actorId: "alice",
      expectedRevision: 4,
      worldId: "w_home",
      draftId: "d1",
    });

    const state = client.getState();
    expect(state.pending).toEqual([]);
    expect(state.unpublished).toBe(false);
    expect(state.revision).toBe(5);
  });

  test("applyServerMessage applies a document only when its revision is newer", () => {
    const document = makeDocument();
    const client = createClient(createServer(document));
    client.setDocument(document, 3);

    const older = client.applyServerMessage({
      kind: "ui.document",
      worldId: "w_home",
      revision: 2,
      document: makeDocument("Older"),
    });
    expect(older.handled).toBe(true);
    expect(older.applied).toBe(false);
    expect(client.getState().document.world.title).toBe("Home");

    const same = client.applyServerMessage({
      kind: "ui.document",
      worldId: "w_home",
      revision: 3,
      document: makeDocument("Same"),
    });
    expect(same.applied).toBe(false);
    expect(client.getState().document.world.title).toBe("Home");

    const newer = client.applyServerMessage({
      kind: "ui.document",
      worldId: "w_home",
      revision: 4,
      document: makeDocument("Newer"),
    });
    expect(newer.applied).toBe(true);
    expect(client.getState().document.world.title).toBe("Newer");
    expect(client.getState().revision).toBe(4);

    // The published frame carries a full revision object, not a bare number.
    const publishedFrame = client.applyServerMessage({
      kind: "ui.document",
      worldId: "w_home",
      revision: {
        revision: 6,
        document: makeDocument("Published"),
        contentHash: "sha256:published",
        createdAt: 200,
        actorId: "alice",
      },
    });
    expect(publishedFrame.applied).toBe(true);
    expect(client.getState().document.world.title).toBe("Published");
    expect(client.getState().revision).toBe(6);
  });

  test("a resync with gap true clears pending work and requests a snapshot", () => {
    const document = makeDocument();
    const client = createClient(createServer(document));
    client.setDocument(document, 4);
    client.queueOperation({ op: "object.remove", objectId: "obj_a" });
    expect(client.getState().pending).toHaveLength(1);

    const result = client.applyServerMessage({
      kind: "ui.resync",
      epoch: "e1",
      oldestSeq: 40,
      latestSeq: 90,
      gap: true,
      revision: 4,
      events: [],
    });

    expect(result.handled).toBe(true);
    expect(result.needsSnapshot).toBe(true);
    expect(client.getState().pending).toEqual([]);
    expect(client.getState().unpublished).toBe(false);
    expect(client.getState().needsSnapshot).toBe(true);
  });

  test("a revision conflict surfaces the current revision to the caller", () => {
    const document = makeDocument();
    const client = createClient(createServer(document));
    client.setDocument(document, 4);

    const result = client.applyServerMessage({
      kind: "ui.error",
      code: "REVISION_CONFLICT",
      message: "World w_home is at revision 9.",
      currentRevision: 9,
    });

    expect(result.handled).toBe(true);
    expect(result.error).toEqual({
      code: "REVISION_CONFLICT",
      message: "World w_home is at revision 9.",
      currentRevision: 9,
    });
    expect(result.error!.currentRevision).toBe(9);
    expect(client.getState().error).toEqual({
      code: "REVISION_CONFLICT",
      message: "World w_home is at revision 9.",
      currentRevision: 9,
    });
  });

  test("unknown and malformed messages are ignored without throwing", () => {
    const document = makeDocument();
    const client = createClient(createServer(document));
    client.setDocument(document, 4);

    const cases = [
      null,
      undefined,
      42,
      "ui.document",
      {},
      { kind: "job.started" },
      { kind: "ui.document" },
      { kind: "ui.document", revision: "3" },
      { kind: "ui.worlds", worlds: "not-a-list" },
      { kind: "ui.draft", draft: { title: "no id" } },
      { kind: "ui.error", message: "no code" },
      { kind: "ui.resync" },
      { payload: null, kind: 7 },
    ];

    for (const message of cases) {
      expect(() => client.applyServerMessage(message)).not.toThrow();
      const result = client.applyServerMessage(message);
      expect(result.handled).toBe(false);
    }

    expect(client.getState().revision).toBe(4);
    expect(client.getState().document.world.title).toBe("Home");
  });
});
