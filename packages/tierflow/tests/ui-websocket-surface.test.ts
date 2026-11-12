/**
 * WebSocket surface contract tests.
 *
 * The failure this guards against is silent: a reconnecting client that applies
 * a stale or unreplayable cursor would render old state forever. Every resume
 * path is therefore exercised against a real `EventBus` and `RealtimeSession`,
 * and the command paths are checked for capability refusal, typed errors and
 * the ack/document/worlds sequence a client depends on.
 */

import { describe, expect, test } from "bun:test";
import { EventBus } from "../src/bus.ts";
import type { Capability } from "../src/security.ts";
import { RealtimeSession, ResumeEpoch } from "../src/ui/realtime.ts";
import type { UiCommand, UiDocument, UiRevision, UiResult } from "../src/ui/types.ts";
import { UI_SCHEMA_VERSION } from "../src/ui/types.ts";
import {
  cursorFromMessage,
  UiSocketSession,
  type UiSocketCore,
  type UiSocketFrame,
  type UiSocketWorld,
} from "../src/surfaces/websocket.ts";

const HOME_WORLD: UiSocketWorld = {
  worldId: "home",
  kind: "home",
  title: "Home",
  accent: "#7aa2ff",
  revision: 0,
  createdAt: 1_700_000_000_000,
};

const GARDEN_WORLD: UiSocketWorld = {
  worldId: "garden",
  kind: "custom",
  title: "Garden",
  accent: "#88ddaa",
  revision: 0,
  createdAt: 1_700_000_001_000,
};

const WRITE_AUTHORITIES: ReadonlySet<Capability> = new Set<Capability>(["read", "surface.write"]);
const READ_ONLY_AUTHORITIES: ReadonlySet<Capability> = new Set<Capability>(["read"]);

type Respond = (command: UiCommand) => UiResult<UiRevision>;

interface FakeCore extends UiSocketCore {
  readonly calls: readonly UiCommand[];
}

interface FakeCoreOptions {
  worlds?: UiSocketWorld[];
  revision?: UiRevision | null;
  respond?: Respond;
}

/**
 * Minimal core double.
 *
 * Only `submit` is stateful: it records every command so a test can prove a
 * refused command never reached the core. Reads are pure views over the
 * configured revision.
 */
function fakeCore(options: FakeCoreOptions = {}): FakeCore {
  const calls: UiCommand[] = [];
  const worlds = options.worlds ?? [HOME_WORLD, GARDEN_WORLD];
  const revision = options.revision ?? null;
  const respond: Respond =
    options.respond ??
    (() => ({ ok: true, value: revision ?? revisionOf("home", 1) }));

  return {
    calls,
    async submit(command: UiCommand): Promise<UiResult<UiRevision>> {
      calls.push(command);
      return respond(command);
    },
    current(worldId: string): UiRevision | null {
      return revision !== null && revision.document.world.id === worldId ? revision : null;
    },
    worlds() {
      return worlds.map((world) => ({ ...world }));
    },
    drafts(filter) {
      const drafts = [
        { draftId: "draft-a", worldId: "home" },
        { draftId: "draft-b", worldId: "garden" },
      ];
      return drafts
        .filter((entry) => filter?.worldId === undefined || entry.worldId === filter.worldId)
        .map((entry) => draftOf(entry.draftId, entry.worldId));
    },
  };
}

interface ConnectOptions {
  core: UiSocketCore;
  events?: number;
  ring?: number;
  epoch?: string;
  authorities?: ReadonlySet<Capability>;
}

interface Harness {
  readonly bus: EventBus;
  readonly session: RealtimeSession;
  readonly socket: UiSocketSession;
  readonly frames: UiSocketFrame[];
}

/**
 * Build one connection over a real bus and a real resume session.
 *
 * Event count and ring size are inputs so the retained-window boundary can be
 * placed exactly where a test needs it.
 */
function connect(options: ConnectOptions): Harness {
  const bus = new EventBus(options.ring ?? 50);
  const events = options.events ?? 0;
  for (let i = 0; i < events; i += 1) {
    bus.emit({ tier: 1, type: "system.note", sessionId: "s" });
  }
  const session = new RealtimeSession({
    bus,
    epoch: new ResumeEpoch(options.epoch ?? "proc-a"),
    revisionOf: () => 3,
  });
  const frames: UiSocketFrame[] = [];
  const socket = new UiSocketSession({
    core: options.core,
    session,
    actorId: "phone",
    send: (frame) => {
      frames.push(frame);
    },
    ...(options.authorities === undefined ? {} : { authorities: options.authorities }),
  });
  return { bus, session, socket, frames };
}

function documentOf(worldId: string, kind: "home" | "custom" = "home"): UiDocument {
  return {
    schemaVersion: UI_SCHEMA_VERSION,
    world: {
      id: worldId,
      kind,
      title: kind === "home" ? "Home" : worldId,
      accent: "#7aa2ff",
      origin: { x: 0, y: 0, z: 0 },
      unitsPerMeter: 1,
    },
    objects: [],
    relationships: [],
    dataFlows: [],
  };
}

function revisionOf(worldId: string, revision = 1): UiRevision {
  return {
    revision,
    document: documentOf(worldId),
    contentHash: `hash-${worldId}-${revision}`,
    createdAt: 1_700_000_002_000,
    actorId: "tester",
  };
}

function draftOf(draftId: string, worldId: string) {
  return {
    draftId,
    worldId,
    baseRevision: 0,
    draftRevision: 1,
    document: documentOf(worldId),
    contentHash: `draft-hash-${draftId}`,
    updatedAt: 1_700_000_003_000,
    actorId: "phone",
  };
}

/** Commands resolve asynchronously; one timer turn lets the surface answer. */
async function flush(): Promise<void> {
  await Bun.sleep(1);
}

function kinds(frames: readonly UiSocketFrame[]): string[] {
  return frames.map((frame) => frame.kind);
}

function only<T extends UiSocketFrame["kind"]>(
  frames: readonly UiSocketFrame[],
  kind: T,
): Extract<UiSocketFrame, { kind: T }> {
  const matching = frames.filter((frame) => frame.kind === kind);
  if (matching.length !== 1) {
    throw new Error(`expected exactly one ${kind} frame, saw ${matching.length}`);
  }
  return matching[0] as Extract<UiSocketFrame, { kind: T }>;
}

function seqsOf(frame: Extract<UiSocketFrame, { kind: "ui.resync" }>): number[] {
  return frame.events.map((event) => event.seq);
}

describe("UiSocketSession resume", () => {
  test("a cursor frame produces a ui.resync frame", () => {
    const { frames, socket } = connect({ core: fakeCore(), events: 5 });

    socket.handleInbound({ op: "cursor", epoch: "proc-a", seq: 2 });

    expect(frames).toHaveLength(1);
    const frame = only(frames, "ui.resync");
    expect(frame.gap).toBe(false);
    expect(frame.epoch).toBe("proc-a");
    expect(frame.oldestSeq).toBe(1);
    expect(frame.latestSeq).toBe(5);
    expect(frame.revision).toBe(3);
    expect(seqsOf(frame)).toEqual([3, 4, 5]);
  });

  test("a cursor from a different epoch produces gap true and no events", () => {
    const { frames, socket } = connect({ core: fakeCore(), events: 4 });

    socket.handleInbound({ op: "cursor", epoch: "proc-before-restart", seq: 3 });

    const frame = only(frames, "ui.resync");
    expect(frame.gap).toBe(true);
    expect(frame.events).toEqual([]);
    expect(frame.epoch).toBe("proc-a");
    expect(frame.latestSeq).toBe(4);
  });

  test("a cursor inside the retained window replays the events after it", () => {
    const { frames, socket } = connect({ core: fakeCore(), events: 6, ring: 4 });
    expect(frames).toHaveLength(0);

    socket.handleInbound({ op: "cursor", epoch: "proc-a", seq: 2 });

    const frame = only(frames, "ui.resync");
    expect(frame.gap).toBe(false);
    expect(frame.oldestSeq).toBe(3);
    expect(seqsOf(frame)).toEqual([3, 4, 5, 6]);
  });

  test("a cursor below the retained window produces gap true, never a partial stream", () => {
    const { frames, socket } = connect({ core: fakeCore(), events: 6, ring: 4 });

    socket.handleInbound({ op: "cursor", epoch: "proc-a", seq: 0 });

    const frame = only(frames, "ui.resync");
    expect(frame.gap).toBe(true);
    expect(frame.events).toEqual([]);
    expect(frame.oldestSeq).toBe(3);
    expect(frame.latestSeq).toBe(6);
  });

  test("a malformed cursor is reported, not resumed", () => {
    const { frames, socket } = connect({ core: fakeCore(), events: 2 });

    socket.handleInbound({ op: "cursor", epoch: "", seq: 1 });

    const error = only(frames, "ui.error");
    expect(error.code).toBe("INVALID_COMMAND");
    expect(frames.some((frame) => frame.kind === "ui.resync")).toBe(false);
  });
});

describe("UiSocketSession commands", () => {
  test("a command with the surface.write capability is acked and published", async () => {
    const revision = revisionOf("home", 2);
    const core = fakeCore({ revision, respond: () => ({ ok: true, value: revision }) });
    const { frames, socket } = connect({ core, authorities: WRITE_AUTHORITIES });

    socket.handleInbound({
      op: "command",
      command: {
        commandId: "cmd-publish-1",
        kind: "ui.publish",
        actorId: "someone-else",
        expectedRevision: 1,
        payload: { worldId: "home" },
      },
    });
    await flush();

    expect(kinds(frames)).toEqual(["ui.ack", "ui.document", "ui.worlds"]);
    expect(only(frames, "ui.ack").commandId).toBe("cmd-publish-1");
    expect(only(frames, "ui.document")).toMatchObject({ worldId: "home", revision });
    expect(only(frames, "ui.worlds").worlds.map((world) => world.worldId)).toEqual(["home", "garden"]);

    expect(core.calls).toHaveLength(1);
    expect(core.calls[0]?.commandId).toBe("cmd-publish-1");
    expect(core.calls[0]?.kind).toBe("ui.publish");
    // The connection's actor wins over anything the client claims.
    expect(core.calls[0]?.actorId).toBe("phone");
  });

  test("a command without the capability is refused and the core is not called", async () => {
    const core = fakeCore();
    const { frames, socket } = connect({ core, authorities: READ_ONLY_AUTHORITIES });

    socket.handleInbound({
      op: "command",
      command: { commandId: "cmd-denied", kind: "ui.publish", actorId: "phone", expectedRevision: 1 },
    });
    await flush();

    expect(frames).toHaveLength(1);
    const error = only(frames, "ui.error");
    expect(error.code).toBe("FORBIDDEN");
    expect(error.message).toBe("denied: surface.write capability required");
    expect(core.calls).toHaveLength(0);
  });

  test("a core failure is reported with its typed code and current revision", async () => {
    const core = fakeCore({
      respond: () => ({
        ok: false,
        code: "REVISION_CONFLICT",
        message: "expected revision 4, current revision 7",
        currentRevision: 7,
      }),
    });
    const { frames, socket } = connect({ core, authorities: WRITE_AUTHORITIES });

    socket.handleInbound({
      op: "command",
      command: { commandId: "cmd-conflict", kind: "ui.publish", actorId: "phone", expectedRevision: 4 },
    });
    await flush();

    expect(frames).toHaveLength(1);
    const error = only(frames, "ui.error");
    expect(error.code).toBe("REVISION_CONFLICT");
    expect(error.message).toBe("expected revision 4, current revision 7");
    expect(error.currentRevision).toBe(7);
    expect(frames.some((frame) => frame.kind === "ui.ack")).toBe(false);
  });

  test("a command without a commandId is reported as INVALID_COMMAND", async () => {
    const core = fakeCore();
    const { frames, socket } = connect({ core, authorities: WRITE_AUTHORITIES });

    socket.handleInbound({ op: "command", command: { kind: "ui.publish", actorId: "phone" } });
    await flush();

    const error = only(frames, "ui.error");
    expect(error.code).toBe("INVALID_COMMAND");
    expect(core.calls).toHaveLength(0);
  });

  test("a command envelope that is not an object is reported as INVALID_COMMAND", async () => {
    const core = fakeCore();
    const { frames, socket } = connect({ core, authorities: WRITE_AUTHORITIES });

    socket.handleInbound({ op: "command" });
    await flush();

    const error = only(frames, "ui.error");
    expect(error.code).toBe("INVALID_COMMAND");
    expect(core.calls).toHaveLength(0);
  });
});

describe("UiSocketSession framing safety", () => {
  test("malformed JSON and unknown ops are ignored without throwing", () => {
    const { frames, socket } = connect({ core: fakeCore() });
    const junk: unknown[] = ["{not json", "{]", "", 42, null, undefined, [], { op: "mystery" }, { op: 7 }];

    for (const raw of junk) {
      expect(() => socket.handleInbound(raw)).not.toThrow();
    }
    expect(frames).toEqual([]);
  });

  test("an unknown op carrying a commandId is acknowledged", () => {
    const { frames, socket } = connect({ core: fakeCore() });

    socket.handleInbound({ op: "mystery", commandId: "cmd-unknown" });

    expect(only(frames, "ui.ack").commandId).toBe("cmd-unknown");
  });

  test("a hostile object never throws", () => {
    const { frames, socket } = connect({ core: fakeCore() });
    const hostile = {
      get op(): string {
        throw new Error("boom");
      },
    };

    expect(() => socket.handleInbound(hostile)).not.toThrow();
    expect(frames).toEqual([]);
  });

  test("sendInitial publishes the world list, then the home document", () => {
    const revision = revisionOf("home", 4);
    const { frames, socket } = connect({ core: fakeCore({ revision }) });

    socket.sendInitial();

    expect(kinds(frames)).toEqual(["ui.worlds", "ui.document"]);
    const worlds = only(frames, "ui.worlds").worlds;
    expect(worlds.map((world) => world.worldId)).toEqual(["home", "garden"]);
    expect(worlds.map((world) => world.kind)).toEqual(["home", "custom"]);
    const document = only(frames, "ui.document");
    expect(document.worldId).toBe("home");
    expect(document.revision.revision).toBe(4);
  });

  test("sendInitial sends only the list when the home world has no revision", () => {
    const { frames, socket } = connect({ core: fakeCore({ revision: null }) });

    socket.sendInitial();

    expect(kinds(frames)).toEqual(["ui.worlds"]);
  });

  test("sendResync without a cursor replays the recent window", () => {
    const { frames, socket } = connect({ core: fakeCore(), events: 3, epoch: "proc-a" });

    socket.sendResync(null);

    const frame = only(frames, "ui.resync");
    expect(frame.gap).toBe(false);
    expect(seqsOf(frame)).toEqual([1, 2, 3]);
  });

  test("broadcastRevision hints the world from the revision document", () => {
    const { frames, socket } = connect({ core: fakeCore() });
    const revision = revisionOf("garden", 9);

    socket.broadcastRevision(revision);

    const document = only(frames, "ui.document");
    expect(document.worldId).toBe("garden");
    expect(document.revision).toBe(revision);
  });

  test("a throwing writer cannot break inbound handling", () => {
    const session = new RealtimeSession({
      bus: new EventBus(8),
      epoch: new ResumeEpoch("proc-a"),
    });
    const socket = new UiSocketSession({
      core: fakeCore(),
      session,
      actorId: "phone",
      send: () => {
        throw new Error("socket closed");
      },
    });

    expect(() => socket.handleInbound({ op: "cursor", epoch: "proc-a", seq: 0 })).not.toThrow();
    expect(() => socket.sendInitial()).not.toThrow();
  });
});

describe("cursorFromMessage", () => {
  test("reads a top-level cursor", () => {
    expect(cursorFromMessage({ op: "cursor", epoch: "proc-a", seq: 3 })).toEqual({ epoch: "proc-a", seq: 3 });
  });

  test("reads a nested cursor", () => {
    expect(cursorFromMessage({ op: "cursor", cursor: { epoch: "proc-a", seq: 1 } })).toEqual({
      epoch: "proc-a",
      seq: 1,
    });
  });

  test("returns null when the cursor is absent or malformed", () => {
    const rejected: unknown[] = [
      null,
      undefined,
      "cursor",
      42,
      [],
      {},
      { op: "cursor" },
      { op: "cursor", epoch: "proc-a" },
      { op: "cursor", epoch: "proc-a", seq: -1 },
      { op: "cursor", epoch: "proc-a", seq: 1.5 },
      { op: "cursor", epoch: "", seq: 1 },
      { op: "cursor", cursor: "proc-a" },
    ];
    for (const input of rejected) {
      expect(cursorFromMessage(input)).toBeNull();
    }
  });
});
