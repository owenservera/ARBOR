/**
 * Command-layer contract tests.
 *
 * These cover the promises an adapter relies on: a command is accepted or
 * refused as a whole, a stale compare-and-swap changes nothing, a repeated
 * command id replays instead of publishing twice, and a draft stays private
 * until it is committed. Every test uses a fresh on-disk store under a temporary
 * directory, because durability and revision numbering are part of the contract.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { UiCore, UiStateProjection, UiStateProjectionError } from "../src/ui/commands.ts";
import { openUiStore, type UiStore } from "../src/ui/store.ts";
import { defaultUiDocument, parseUiDocument } from "../src/ui/world.ts";
import type { UiCommand, UiCommandKind, UiDocument, UiErrorCode, UiResult, UiScalar } from "../src/ui/types.ts";

let root = "";
let store: UiStore;
let core: UiCore;
let sequence = 0;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "tierflow-ui-commands-"));
  store = openUiStore({ path: join(root, "state.db") });
  core = new UiCore({ store });
  sequence = 0;
});

afterEach(() => {
  store.close();
  rmSync(root, { recursive: true, force: true, maxRetries: 3 });
});

/** A fresh command id keeps unrelated commands from replaying each other. */
function command(
  kind: UiCommandKind,
  payload: Record<string, unknown> = {},
  extra: Partial<UiCommand> = {},
): UiCommand {
  sequence += 1;
  return { commandId: `cmd_${sequence}`, kind, actorId: "actor_test", payload, ...extra };
}

function expectValue<T>(result: UiResult<T>): T {
  if (!result.ok) throw new Error(`Expected a successful result, received ${result.code}: ${result.message}`);
  return result.value;
}

function expectFailure<T>(
  result: UiResult<T>,
  code: UiErrorCode,
): { code: UiErrorCode; message: string; currentRevision?: number } {
  if (result.ok) throw new Error(`Expected ${code}, but the command succeeded.`);
  expect(result.code).toBe(code);
  return result;
}

/** A valid custom document for one world id. */
function customDocument(worldId: string, title: string): UiDocument {
  const base = defaultUiDocument("custom");
  return parseUiDocument({
    ...base,
    world: { ...base.world, id: worldId, kind: "custom", title },
  });
}

async function publish(instance: UiCore, worldId: string, title: string, expectedRevision: number): Promise<void> {
  expectValue(
    await instance.submit(
      command("ui.publish", { document: customDocument(worldId, title) }, { expectedRevision }),
    ),
  );
}

async function createWorld(worldId: string): Promise<void> {
  expectValue(await core.submit(command("ui.world.create", { worldId, title: worldId })));
}

describe("command envelope", () => {
  test("an unknown command kind is refused with INVALID_COMMAND", async () => {
    const result = await core.submit({
      commandId: "cmd_unknown_kind",
      kind: "ui.nope" as UiCommandKind,
      actorId: "actor_test",
      payload: {},
    });
    expectFailure(result, "INVALID_COMMAND");
    expect(store.listWorlds()).toHaveLength(0);
  });

  test("a command without a commandId is refused", async () => {
    const result = await core.submit({ commandId: "", kind: "ui.publish", actorId: "actor_test", payload: {} });
    expectFailure(result, "INVALID_COMMAND");
  });

  test("a command without an actorId is refused", async () => {
    const result = await core.submit({ commandId: "cmd_no_actor", kind: "ui.publish", actorId: "", payload: {} });
    expectFailure(result, "INVALID_COMMAND");
  });
});

describe("ui.world.create", () => {
  test("creates a custom world at revision 1", async () => {
    const result = await core.submit(
      command("ui.world.create", { worldId: "w_lab", title: "Lab", accent: "#22d3ee" }),
    );
    const revision = expectValue(result);

    expect(revision.revision).toBe(1);
    expect(revision.document.world.id).toBe("w_lab");
    expect(revision.document.world.kind).toBe("custom");
    expect(revision.document.world.title).toBe("Lab");
    expect(revision.document.world.accent).toBe("#22d3ee");

    const worlds = core.worlds();
    expect(worlds.map((world) => world.worldId)).toContain("w_lab");
    const created = worlds.find((world) => world.worldId === "w_lab");
    expect(created?.revision).toBe(1);
    expect(created?.kind).toBe("custom");
    expect(created?.title).toBe("Lab");
    expect(core.current("w_lab")?.revision).toBe(1);
  });

  test("creating a world that already exists is refused with REVISION_CONFLICT", async () => {
    await createWorld("w_lab");

    const result = await core.submit(command("ui.world.create", { worldId: "w_lab", title: "Second" }));
    const failure = expectFailure(result, "REVISION_CONFLICT");

    expect(failure.currentRevision).toBe(1);
    expect(core.worlds().filter((world) => world.worldId === "w_lab")).toHaveLength(1);
    expect(core.current("w_lab")?.document.world.title).toBe("w_lab");
  });
});

describe("ui.publish", () => {
  test("publishing a document allocates revision 1 and advances current", async () => {
    await publish(core, "w_canvas", "Canvas", 0);
    expect(core.current("w_canvas")?.revision).toBe(1);

    await publish(core, "w_canvas", "Canvas v2", 1);
    expect(core.current("w_canvas")?.revision).toBe(2);
    expect(core.current("w_canvas")?.document.world.title).toBe("Canvas v2");
  });

  test("publishing with a stale expectedRevision is refused and changes nothing", async () => {
    await publish(core, "w_canvas", "Canvas", 0);

    const stale = await core.submit(
      command("ui.publish", { document: customDocument("w_canvas", "Stale") }, { expectedRevision: 0 }),
    );
    const failure = expectFailure(stale, "REVISION_CONFLICT");

    expect(failure.currentRevision).toBe(1);
    expect(core.current("w_canvas")?.revision).toBe(1);
    expect(core.current("w_canvas")?.document.world.title).toBe("Canvas");
    expect(store.listRevisions("w_canvas")).toHaveLength(1);
  });

  test("an invalid document is refused with INVALID_DOCUMENT", async () => {
    const result = await core.submit(
      command("ui.publish", { document: { schemaVersion: 1 } }, { expectedRevision: 0 }),
    );
    const failure = expectFailure(result, "INVALID_DOCUMENT");

    expect(failure.message.length).toBeGreaterThan(0);
    expect(store.listWorlds()).toHaveLength(0);
    expect(store.listRevisions("w_canvas")).toHaveLength(0);
  });
});

describe("idempotency", () => {
  test("the same commandId with the same payload replays its result and publishes once", async () => {
    const document = customDocument("w_canvas", "Canvas");
    const first = expectValue(
      await core.submit({
        commandId: "cmd_replay",
        kind: "ui.publish",
        actorId: "actor_test",
        expectedRevision: 0,
        payload: { document },
      }),
    );

    const replay = expectValue(
      await core.submit({
        commandId: "cmd_replay",
        kind: "ui.publish",
        actorId: "actor_test",
        expectedRevision: 0,
        payload: { document },
      }),
    );

    expect(replay.revision).toBe(first.revision);
    expect(replay.contentHash).toBe(first.contentHash);
    expect(core.current("w_canvas")?.revision).toBe(1);
    expect(store.listRevisions("w_canvas")).toHaveLength(1);
  });

  test("the same commandId with a different payload is refused with IDEMPOTENCY_CONFLICT", async () => {
    expectValue(
      await core.submit({
        commandId: "cmd_reused",
        kind: "ui.publish",
        actorId: "actor_test",
        expectedRevision: 0,
        payload: { document: customDocument("w_canvas", "Canvas") },
      }),
    );

    const reused = await core.submit({
      commandId: "cmd_reused",
      kind: "ui.publish",
      actorId: "actor_test",
      expectedRevision: 1,
      payload: { document: customDocument("w_canvas", "Other") },
    });
    expectFailure(reused, "IDEMPOTENCY_CONFLICT");
    expect(core.current("w_canvas")?.revision).toBe(1);
  });
});

describe("draft lifecycle", () => {
  test("draft create then edit then commit publishes the edited document", async () => {
    await publish(core, "w_canvas", "Canvas", 0);

    const created = expectValue(
      await core.submit(command("ui.draft.create", { worldId: "w_canvas", draftId: "draft_1" })),
    );
    expect(created.revision).toBe(1);
    const seeded = store.getDraft("draft_1");
    expect(seeded?.baseRevision).toBe(1);
    expect(seeded?.draftRevision).toBe(1);
    expect(seeded?.document.world.title).toBe("Canvas");

    const edited = expectValue(
      await core.submit(
        command("ui.draft.edit", {
          draftId: "draft_1",
          expectedDraftRevision: 1,
          operations: [{ op: "world.setTitle", title: "Edited" }],
        }),
      ),
    );
    expect(edited.revision).toBe(1);
    expect(store.getDraft("draft_1")?.draftRevision).toBe(2);
    expect(store.getDraft("draft_1")?.document.world.title).toBe("Edited");

    const committed = expectValue(
      await core.submit(command("ui.draft.commit", { draftId: "draft_1" }, { expectedRevision: 1 })),
    );
    expect(committed.revision).toBe(2);
    expect(committed.document.world.title).toBe("Edited");
    expect(store.getDraft("draft_1")).toBeNull();
    expect(core.current("w_canvas")?.document.world.title).toBe("Edited");
  });

  test("draft edit with a stale expectedDraftRevision is refused", async () => {
    await publish(core, "w_canvas", "Canvas", 0);
    expectValue(await core.submit(command("ui.draft.create", { worldId: "w_canvas", draftId: "draft_1" })));
    expectValue(
      await core.submit(
        command("ui.draft.edit", {
          draftId: "draft_1",
          expectedDraftRevision: 1,
          operations: [{ op: "world.setTitle", title: "First" }],
        }),
      ),
    );

    const stale = await core.submit(
      command("ui.draft.edit", {
        draftId: "draft_1",
        expectedDraftRevision: 1,
        operations: [{ op: "world.setTitle", title: "Second" }],
      }),
    );
    expectFailure(stale, "REVISION_CONFLICT");
    expect(store.getDraft("draft_1")?.draftRevision).toBe(2);
    expect(store.getDraft("draft_1")?.document.world.title).toBe("First");
    expect(core.current("w_canvas")?.revision).toBe(1);
  });

  test("draft create on a world without a revision is refused with NOT_FOUND", async () => {
    const result = await core.submit(command("ui.draft.create", { worldId: "w_missing", draftId: "draft_1" }));
    expectFailure(result, "NOT_FOUND");
  });

  test("draft discard removes the draft and keeps the published revision", async () => {
    await publish(core, "w_canvas", "Canvas", 0);
    expectValue(await core.submit(command("ui.draft.create", { worldId: "w_canvas", draftId: "draft_1" })));

    const discarded = expectValue(
      await core.submit(command("ui.draft.discard", { draftId: "draft_1" })),
    );
    expect(discarded.revision).toBe(1);
    expect(store.getDraft("draft_1")).toBeNull();
    expect(core.drafts()).toHaveLength(0);
  });
});

describe("preview", () => {
  test("returns the candidate document and diagnostics without changing published state", async () => {
    await publish(core, "w_canvas", "Canvas", 0);
    expectValue(await core.submit(command("ui.draft.create", { worldId: "w_canvas", draftId: "draft_1" })));
    expectValue(
      await core.submit(
        command("ui.draft.edit", {
          draftId: "draft_1",
          expectedDraftRevision: 1,
          operations: [{ op: "world.setTitle", title: "Previewed" }],
        }),
      ),
    );

    const draftBefore = store.getDraft("draft_1");
    const preview = core.preview("draft_1");
    if (!preview.ok) throw new Error(`Expected a preview, received ${preview.code}: ${preview.message}`);

    expect(preview.value.document.world.id).toBe("w_canvas");
    expect(preview.value.document.world.title).toBe("Previewed");
    expect(preview.value.draft.draftId).toBe("draft_1");
    expect(preview.value.contentHash).toBe(draftBefore?.contentHash ?? "");
    expect(preview.value.diagnostics.filter((diagnostic) => diagnostic.severity === "error")).toHaveLength(0);

    // Preview is a read: neither the draft nor the published revision moved.
    expect(store.getDraft("draft_1")?.draftRevision).toBe(2);
    expect(core.current("w_canvas")?.revision).toBe(1);
    expect(store.listRevisions("w_canvas")).toHaveLength(1);
  });

  test("preview of a missing draft is refused with NOT_FOUND", () => {
    const preview = core.preview("draft_missing");
    if (preview.ok) throw new Error("Expected a refusal for a missing draft.");
    expect(preview.code).toBe("NOT_FOUND");
  });
});

describe("ui.rollback", () => {
  test("creates a new revision whose document equals the earlier one", async () => {
    await publish(core, "w_canvas", "First", 0);
    await publish(core, "w_canvas", "Second", 1);

    const rolled = expectValue(
      await core.submit(
        command("ui.rollback", { worldId: "w_canvas", targetRevision: 1 }, { expectedRevision: 2 }),
      ),
    );

    expect(rolled.revision).toBe(3);
    expect(rolled.document.world.title).toBe("First");
    expect(rolled.contentHash).toBe(store.getRevision("w_canvas", 1)?.contentHash ?? "");
    expect(core.current("w_canvas")?.revision).toBe(3);
    expect(store.listRevisions("w_canvas").map((revision) => revision.revision)).toEqual([3, 2, 1]);
  });

  test("a stale expectedRevision is refused and history is untouched", async () => {
    await publish(core, "w_canvas", "First", 0);
    await publish(core, "w_canvas", "Second", 1);

    const stale = await core.submit(
      command("ui.rollback", { worldId: "w_canvas", targetRevision: 1 }, { expectedRevision: 1 }),
    );
    expectFailure(stale, "REVISION_CONFLICT");
    expect(core.current("w_canvas")?.revision).toBe(2);
    expect(store.listRevisions("w_canvas")).toHaveLength(2);
  });
});

describe("UiStateProjection", () => {
  test("resolves a path, refuses unknown paths and refuses non-scalar values", () => {
    const projection = new UiStateProjection({ runs: { live: 4, label: "live" }, theme: "dark" });

    expect(projection.get("/runs/live")).toBe(4);
    expect(projection.get("/runs/label")).toBe("live");
    expect(projection.get("/theme")).toBe("dark");
    expect(projection.get("/runs/missing")).toBeUndefined();
    expect(projection.get("runs/live")).toBeUndefined();

    expectRefusal(() => projection.set("/runs/missing", 1), "NOT_FOUND");
    expectRefusal(() => projection.set("/new/path", 1), "NOT_FOUND");
    expectRefusal(() => projection.set("/runs/live", { nested: true } as unknown as UiScalar), "INVALID_COMMAND");
    expect(projection.get("/runs/live")).toBe(4);

    projection.set("/runs/live", 9);
    expect(projection.get("/runs/live")).toBe(9);
    expect(projection.snapshot()).toEqual({ "/runs/live": 9, "/runs/label": "live", "/theme": "dark" });
  });

  test("ui.state.set writes through the writer and keeps the published revision", async () => {
    const projection = new UiStateProjection({ runs: { live: 0 } });
    const stateCore = new UiCore({ store, state: projection });
    await publish(stateCore, "w_canvas", "Canvas", 0);

    const written = expectValue(
      await stateCore.submit(command("ui.state.set", { worldId: "w_canvas", path: "/runs/live", value: 7 })),
    );
    expect(written.revision).toBe(1);
    expect(projection.get("/runs/live")).toBe(7);
    expect(stateCore.current("w_canvas")?.revision).toBe(1);

    const refused = await stateCore.submit(
      command("ui.state.set", { worldId: "w_canvas", path: "/runs/missing", value: 1 }),
    );
    expectFailure(refused, "NOT_FOUND");
    expect(projection.get("/runs/missing")).toBeUndefined();
  });

  test("a core without a state writer refuses ui.state.set with FORBIDDEN", async () => {
    await publish(core, "w_canvas", "Canvas", 0);
    const result = await core.submit(command("ui.state.set", { worldId: "w_canvas", path: "/runs/live", value: 1 }));
    expectFailure(result, "FORBIDDEN");
  });
});

describe("revision feed", () => {
  test("fires on publish and on rollback, and stops after unsubscribe", async () => {
    const seen: number[] = [];
    const unsubscribe = core.onRevision((revision) => {
      seen.push(revision.revision);
    });

    await publish(core, "w_canvas", "First", 0);
    expect(seen).toEqual([1]);

    expectValue(
      await core.submit(
        command("ui.rollback", { worldId: "w_canvas", targetRevision: 1 }, { expectedRevision: 1 }),
      ),
    );
    expect(seen).toEqual([1, 2]);

    unsubscribe();
    await publish(core, "w_canvas", "Third", 2);
    expect(seen).toEqual([1, 2]);
  });

  test("a draft edit does not fire the feed", async () => {
    const seen: number[] = [];
    core.onRevision((revision) => {
      seen.push(revision.revision);
    });

    await publish(core, "w_canvas", "Canvas", 0);
    expectValue(await core.submit(command("ui.draft.create", { worldId: "w_canvas", draftId: "draft_1" })));
    expectValue(
      await core.submit(
        command("ui.draft.edit", {
          draftId: "draft_1",
          expectedDraftRevision: 1,
          operations: [{ op: "world.setTitle", title: "Edited" }],
        }),
      ),
    );

    expect(seen).toEqual([1]);
  });
});

/** Assert a direct state write is refused with a specific typed code. */
function expectRefusal(action: () => void, code: UiErrorCode): void {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(UiStateProjectionError);
    expect((error as UiStateProjectionError).code).toBe(code);
    return;
  }
  throw new Error(`Expected a ${code} refusal, but the write was accepted.`);
}


describe("Lane C whole-envelope replay and authenticated fixture authority", () => {
  test("same payload with changed actor, kind, revision, target, grant or policy never returns prior result", async () => {
    const base = command("ui.publish", { document: customDocument("w_secure", "Secret") }, { expectedRevision: 0 });
    const accepted = await core.submit(base);
    expect(accepted.ok).toBe(true);
    const variations: UiCommand[] = [
      { ...base, actorId: "other_actor" },
      { ...base, kind: "ui.rollback" },
      { ...base, expectedRevision: 1 },
      { ...base, target: { actionId: "different" } } as UiCommand,
      { ...base, grantRef: "revoked" } as UiCommand,
      { ...base, policyRevision: "new" } as UiCommand,
      { ...base, deviceRef: "different-phone" } as UiCommand,
    ];
    for (const variation of variations) {
      const refused = await core.submit(variation);
      expectFailure(refused, "IDEMPOTENCY_CONFLICT");
      if (!refused.ok) expect(refused.message).not.toContain("Secret");
    }
    expect(store.listRevisions("w_secure")).toHaveLength(1);
  });

  test("trusted broker identity, policy and grant bind replay; a missing grant refuses without mutation", async () => {
    let principal = {
      ownerRef: "owner-a", actorRef: "actor_test", deviceRef: "pc-a",
      sessionRef: "session-a", grantRef: "grant-1", policyRevision: "policy-1",
      scopes: ["ui:publish"] as readonly string[],
    };
    const secured = new UiCore({ store, resolvePrincipal: () => principal });
    const issued = command("ui.publish", { document: customDocument("w_secure", "Private") }, { expectedRevision: 0 });
    expectValue(await secured.submit(issued));
    expectValue(await secured.submit(issued));
    principal = { ...principal, grantRef: "grant-2" };
    expectFailure(await secured.submit(issued), "IDEMPOTENCY_CONFLICT");
    principal = { ...principal, ownerRef: "owner-b" };
    expectFailure(await secured.submit(issued), "IDEMPOTENCY_CONFLICT");
    principal = { ...principal, scopes: [] };
    expectFailure(await secured.submit(command("ui.publish", { document: customDocument("w_other", "No") }, { expectedRevision: 0 })), "FORBIDDEN");
    expect(store.listRevisions("w_secure")).toHaveLength(1);
    expect(core.current("w_other")).toBeNull();
  });

  test("durable command journal survives a process restart and suppresses another publish", async () => {
    const issued = command("ui.publish", { document: customDocument("w_restart", "Persisted") }, { expectedRevision: 0 });
    expectValue(await core.submit(issued));
    store.close();
    store = openUiStore({ path: join(root, "state.db") });
    core = new UiCore({ store });
    expectValue(await core.submit(issued));
    expect(store.listRevisions("w_restart")).toHaveLength(1);
  });

  test("two competing different IDs with the same expected revision have one CAS winner", async () => {
    const a = command("ui.publish", { document: customDocument("w_race", "First") }, { expectedRevision: 0 });
    const b = command("ui.publish", { document: customDocument("w_race", "Second") }, { expectedRevision: 0 });
    const [one, two] = await Promise.all([core.submit(a), core.submit(b)]);
    expect([one.ok, two.ok].filter(Boolean)).toHaveLength(1);
    expect(store.listRevisions("w_race")).toHaveLength(1);
  });

  test("malformed cyclic and non-finite envelopes are refused before any write", async () => {
    const cyclic: Record<string, unknown> = {};
    cyclic["self"] = cyclic;
    const bad = command("ui.publish", cyclic, { expectedRevision: 0 });
    expectFailure(await core.submit(bad), "INVALID_COMMAND");
    const nonFinite = command("ui.world.create", { worldId: "w_bad", weight: Number.NaN });
    expectFailure(await core.submit(nonFinite), "INVALID_COMMAND");
    expect(store.listWorlds()).toHaveLength(0);
  });
});
