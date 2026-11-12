/**
 * UiStore durability contract tests for the world-scoped store.
 *
 * The store is the authoritative home of UI state, so these tests pin the
 * properties the rest of the system relies on: schema stamping, one writer per
 * file, per-world revision series with independent compare-and-swap gates,
 * append-only rollback, draft isolation by world, command idempotency across
 * restarts, bounded retention and a world-scoped audit trail.
 *
 * Every test gets a fresh temporary directory; stores are closed and files
 * removed after each test so a failure cannot leak a lock into the next one.
 */

import { Database } from "bun:sqlite";
import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { contentHash } from "../src/ui/hash.ts";
import { openUiStore, UiStore, UiStoreError, type UiStoreRetention } from "../src/ui/store.ts";
import type { UiDocument, UiRevision, UiWorldKind } from "../src/ui/types.ts";

const HOME_WORLD = "w_home";
const LAB_WORLD = "w_lab";

const roots: string[] = [];
const stores: UiStore[] = [];

function tempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "tierflow-ui-store-"));
  roots.push(root);
  return root;
}

function storeAt(root: string, retention?: UiStoreRetention): UiStore {
  const options = retention === undefined ? { path: join(root, "state.db") } : { path: join(root, "state.db"), retention };
  const store = new UiStore(options);
  store.open();
  stores.push(store);
  return store;
}

function documentFor(
  worldId: string,
  title: string,
  options: { kind?: UiWorldKind; accent?: string } = {},
): UiDocument {
  return {
    schemaVersion: 1,
    world: {
      id: worldId,
      kind: options.kind ?? (worldId === HOME_WORLD ? "home" : "custom"),
      title,
      accent: options.accent ?? "#f2b134",
      origin: { x: 0, y: 0, z: 0 },
      unitsPerMeter: 1,
    },
    objects: [],
    relationships: [],
    dataFlows: [],
  };
}

function publish(
  store: UiStore,
  worldId: string,
  title: string,
  expectedRevision: number,
  actorId = "alice",
): UiRevision {
  const document = documentFor(worldId, title);
  return store.publish({ worldId, document, contentHash: contentHash(document), expectedRevision, actorId });
}

function storeError(run: () => unknown): UiStoreError {
  try {
    run();
  } catch (error) {
    if (error instanceof UiStoreError) return error;
    throw error;
  }
  throw new Error("expected UiStoreError, nothing was thrown");
}

afterEach(() => {
  for (const store of stores.splice(0)) store.close();
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("UiStore schema", () => {
  test("opening creates the world-scoped schema and stamps user_version 2", () => {
    const root = tempRoot();
    const path = join(root, "state.db");
    const store = storeAt(root);
    expect(store.isOpen).toBe(true);
    expect(store.path).toBe(path);
    expect(store.currentRevision(HOME_WORLD)).toBeNull();
    store.close();

    const db = new Database(path);
    const version = db.query<{ user_version: number }, []>("PRAGMA user_version").get();
    expect(version?.user_version).toBe(2);
    const journal = db.query<{ journal_mode: string }, []>("PRAGMA journal_mode").get();
    expect(journal?.journal_mode).toBe("wal");
    const tables = db
      .query<{ name: string }, []>("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all()
      .map((row) => row.name);
    expect(tables).toEqual([
      "audit",
      "commands",
      "sqlite_sequence",
      "store_lock",
      "ui_current",
      "ui_drafts",
      "ui_revisions",
      "ui_worlds",
    ]);
    db.close();
  });

  test("a second open of the same file fails with STORE_LOCKED", () => {
    const root = tempRoot();
    const first = storeAt(root);
    const second = new UiStore({ path: join(root, "state.db") });

    const error = storeError(() => second.open());
    expect(error.code).toBe("STORE_LOCKED");
    expect(second.isOpen).toBe(false);
    expect(first.isOpen).toBe(true);
  });

  test("a database written by a newer build is refused", () => {
    const root = tempRoot();
    const path = join(root, "state.db");
    const first = new UiStore({ path });
    first.open();
    first.close();

    const raw = new Database(path);
    raw.exec("PRAGMA user_version = 99");
    raw.close();

    const store = new UiStore({ path });
    const error = storeError(() => store.open());
    expect(error.code).toBe("UNSUPPORTED_VERSION");
    expect(store.isOpen).toBe(false);
  });

  test("a version 1 file is refused cleanly instead of being migrated", () => {
    const root = tempRoot();
    const path = join(root, "state.db");
    const raw = new Database(path);
    raw.exec("CREATE TABLE ui_revisions (revision INTEGER PRIMARY KEY)");
    raw.exec("PRAGMA user_version = 1");
    raw.close();

    const store = new UiStore({ path });
    const error = storeError(() => store.open());
    expect(error.code).toBe("UNSUPPORTED_VERSION");
    expect(store.isOpen).toBe(false);
  });
});

describe("UiStore worlds and revisions", () => {
  test("registerWorld then listWorlds reports the world", () => {
    const store = storeAt(tempRoot());
    store.registerWorld({ worldId: HOME_WORLD, kind: "home", title: "Home", accent: "#f2b134" });
    store.registerWorld({ worldId: LAB_WORLD, kind: "custom", title: "Lab", accent: "#4ad9ff" });
    store.registerWorld({ worldId: LAB_WORLD, kind: "custom", title: "Lab", accent: "#4ad9ff" });

    const worlds = store.listWorlds();
    expect(worlds.map((world) => world.worldId)).toEqual([HOME_WORLD, LAB_WORLD]);
    expect(worlds[0]).toMatchObject({
      worldId: HOME_WORLD,
      kind: "home",
      title: "Home",
      accent: "#f2b134",
      revision: 0,
    });
    expect(worlds[1]).toMatchObject({ worldId: LAB_WORLD, kind: "custom", title: "Lab", revision: 0 });
    expect(worlds[0]?.createdAt).toBeGreaterThan(0);
  });

  test("registerWorld refuses a kind change for an existing world id", () => {
    const store = storeAt(tempRoot());
    store.registerWorld({ worldId: LAB_WORLD, kind: "custom", title: "Lab", accent: "#4ad9ff" });

    const error = storeError(() =>
      store.registerWorld({ worldId: LAB_WORLD, kind: "home", title: "Lab", accent: "#4ad9ff" }),
    );
    expect(error.code).toBe("STORE_ERROR");
    expect(store.listWorlds()[0]?.kind).toBe("custom");
  });

  test("publish allocates revision 1 independently in each world", () => {
    const store = storeAt(tempRoot());
    const homeFirst = publish(store, HOME_WORLD, "home one", 0);
    const labFirst = publish(store, LAB_WORLD, "lab one", 0);
    const homeSecond = publish(store, HOME_WORLD, "home two", 1);

    expect([homeFirst.revision, labFirst.revision, homeSecond.revision]).toEqual([1, 1, 2]);
    expect(store.currentRevision(HOME_WORLD)?.document.world.title).toBe("home two");
    expect(store.currentRevision(LAB_WORLD)?.document.world.title).toBe("lab one");
    expect(store.listRevisions(HOME_WORLD, 10).map((revision) => revision.revision)).toEqual([2, 1]);
    expect(store.listRevisions(LAB_WORLD, 10).map((revision) => revision.revision)).toEqual([1]);

    const revisions = store.listWorlds().map((world) => [world.worldId, world.revision]);
    expect(revisions).toEqual([
      [HOME_WORLD, 2],
      [LAB_WORLD, 1],
    ]);
  });

  test("publish with a stale expectedRevision changes nothing in either world", () => {
    const store = storeAt(tempRoot());
    publish(store, HOME_WORLD, "home one", 0);
    publish(store, LAB_WORLD, "lab one", 0);

    const error = storeError(() => publish(store, HOME_WORLD, "stale", 0));
    expect(error.code).toBe("REVISION_CONFLICT");
    expect(error.currentRevision).toBe(1);
    expect(store.currentRevision(HOME_WORLD)?.revision).toBe(1);
    expect(store.currentRevision(HOME_WORLD)?.document.world.title).toBe("home one");
    expect(store.listRevisions(HOME_WORLD, 10).length).toBe(1);
    expect(store.currentRevision(LAB_WORLD)?.revision).toBe(1);
    expect(store.listRevisions(LAB_WORLD, 10).length).toBe(1);
    expect(store.auditEntries(10).length).toBe(2);
  });

  test("rollback creates a new revision whose document matches the target", () => {
    const store = storeAt(tempRoot());
    const first = publish(store, HOME_WORLD, "one", 0);
    const second = publish(store, HOME_WORLD, "two", 1);

    const rolled = store.rollback({ worldId: HOME_WORLD, targetRevision: 1, expectedRevision: 2, actorId: "bob" });

    expect(rolled.revision).toBe(3);
    expect(rolled.document).toEqual(first.document);
    expect(rolled.contentHash).toBe(first.contentHash);
    expect(rolled.actorId).toBe("bob");
    expect(store.currentRevision(HOME_WORLD)?.revision).toBe(3);
    expect(store.listRevisions(HOME_WORLD, 10).map((revision) => revision.revision)).toEqual([3, 2, 1]);
    expect(store.getRevision(HOME_WORLD, 1)).toEqual(first);
    expect(store.getRevision(HOME_WORLD, 2)).toEqual(second);
  });

  test("rollback is scoped to one world and keeps its compare-and-swap gate", () => {
    const store = storeAt(tempRoot());
    publish(store, HOME_WORLD, "one", 0);
    publish(store, HOME_WORLD, "two", 1);
    publish(store, LAB_WORLD, "lab one", 0);

    const crossWorld = storeError(() =>
      store.rollback({ worldId: LAB_WORLD, targetRevision: 2, expectedRevision: 1, actorId: "bob" }),
    );
    expect(crossWorld.code).toBe("NOT_FOUND");
    expect(store.currentRevision(LAB_WORLD)?.revision).toBe(1);

    const stale = storeError(() =>
      store.rollback({ worldId: HOME_WORLD, targetRevision: 1, expectedRevision: 1, actorId: "bob" }),
    );
    expect(stale.code).toBe("REVISION_CONFLICT");
    expect(stale.currentRevision).toBe(2);

    const rolled = store.rollback({ worldId: LAB_WORLD, targetRevision: 1, expectedRevision: 1, actorId: "bob" });
    expect(rolled.revision).toBe(2);
    expect(store.currentRevision(HOME_WORLD)?.revision).toBe(2);
    expect(store.currentRevision(LAB_WORLD)?.revision).toBe(2);
  });
});

describe("UiStore drafts", () => {
  test("drafts create, read and update under the draft revision", () => {
    const store = storeAt(tempRoot());
    publish(store, HOME_WORLD, "base", 0);

    const draft = documentFor(HOME_WORLD, "draft");
    const created = store.createDraft({
      draftId: "draft-1",
      worldId: HOME_WORLD,
      baseRevision: 1,
      document: draft,
      actorId: "alice",
    });
    expect(created.worldId).toBe(HOME_WORLD);
    expect(created.draftRevision).toBe(1);
    expect(created.baseRevision).toBe(1);
    expect(created.contentHash).toBe(contentHash(draft));
    expect(store.getDraft("draft-1")).toEqual(created);

    const updated = store.updateDraft({
      draftId: "draft-1",
      expectedDraftRevision: 1,
      document: documentFor(HOME_WORLD, "draft-v2"),
      actorId: "alice",
    });
    expect(updated.draftRevision).toBe(2);
    expect(updated.baseRevision).toBe(1);
    expect(updated.document.world.title).toBe("draft-v2");

    const stale = storeError(() =>
      store.updateDraft({
        draftId: "draft-1",
        expectedDraftRevision: 1,
        document: documentFor(HOME_WORLD, "stale"),
        actorId: "alice",
      }),
    );
    expect(stale.code).toBe("REVISION_CONFLICT");
    expect(stale.currentRevision).toBe(2);
    expect(store.getDraft("draft-1")?.document.world.title).toBe("draft-v2");

    const missing = storeError(() =>
      store.updateDraft({
        draftId: "ghost",
        expectedDraftRevision: 1,
        document: documentFor(HOME_WORLD, "x"),
        actorId: "alice",
      }),
    );
    expect(missing.code).toBe("NOT_FOUND");
  });

  test("drafts are listed by world and by actor, and deleted once", () => {
    const store = storeAt(tempRoot());
    publish(store, HOME_WORLD, "home base", 0);
    publish(store, LAB_WORLD, "lab base", 0);
    store.createDraft({
      draftId: "draft-a",
      worldId: HOME_WORLD,
      baseRevision: 1,
      document: documentFor(HOME_WORLD, "a"),
      actorId: "alice",
    });
    Bun.sleepSync(2);
    store.createDraft({
      draftId: "draft-b",
      worldId: LAB_WORLD,
      baseRevision: 1,
      document: documentFor(LAB_WORLD, "b"),
      actorId: "bob",
    });

    expect(store.listDrafts().map((draft) => draft.draftId)).toEqual(["draft-b", "draft-a"]);
    expect(store.listDrafts({ worldId: HOME_WORLD }).map((draft) => draft.draftId)).toEqual(["draft-a"]);
    expect(store.listDrafts({ worldId: LAB_WORLD }).map((draft) => draft.draftId)).toEqual(["draft-b"]);
    expect(store.listDrafts({ actorId: "alice" }).map((draft) => draft.draftId)).toEqual(["draft-a"]);
    expect(store.listDrafts({ actorId: "bob" }).map((draft) => draft.draftId)).toEqual(["draft-b"]);
    expect(store.listDrafts({ worldId: HOME_WORLD, actorId: "bob" })).toEqual([]);

    expect(store.deleteDraft("draft-a")).toBe(true);
    expect(store.deleteDraft("draft-a")).toBe(false);
    expect(store.getDraft("draft-a")).toBeNull();
  });

  test("createDraft requires an existing world and base revision", () => {
    const store = storeAt(tempRoot());
    const unknownWorld = storeError(() =>
      store.createDraft({
        draftId: "draft-1",
        worldId: LAB_WORLD,
        baseRevision: 1,
        document: documentFor(LAB_WORLD, "x"),
        actorId: "alice",
      }),
    );
    expect(unknownWorld.code).toBe("NOT_FOUND");

    store.registerWorld({ worldId: LAB_WORLD, kind: "custom", title: "Lab", accent: "#4ad9ff" });
    const unknownBase = storeError(() =>
      store.createDraft({
        draftId: "draft-1",
        worldId: LAB_WORLD,
        baseRevision: 1,
        document: documentFor(LAB_WORLD, "x"),
        actorId: "alice",
      }),
    );
    expect(unknownBase.code).toBe("NOT_FOUND");
    expect(store.getDraft("draft-1")).toBeNull();
  });

  test("a draft whose document names another world is refused", () => {
    const store = storeAt(tempRoot());
    publish(store, HOME_WORLD, "base", 0);

    const mismatch = storeError(() =>
      store.createDraft({
        draftId: "draft-bad",
        worldId: HOME_WORLD,
        baseRevision: 1,
        document: documentFor(LAB_WORLD, "wrong world"),
        actorId: "alice",
      }),
    );
    expect(mismatch.code).toBe("STORE_ERROR");
    expect(store.getDraft("draft-bad")).toBeNull();

    store.createDraft({
      draftId: "draft-ok",
      worldId: HOME_WORLD,
      baseRevision: 1,
      document: documentFor(HOME_WORLD, "ok"),
      actorId: "alice",
    });
    const updateMismatch = storeError(() =>
      store.updateDraft({
        draftId: "draft-ok",
        expectedDraftRevision: 1,
        document: documentFor(LAB_WORLD, "wrong world"),
        actorId: "alice",
      }),
    );
    expect(updateMismatch.code).toBe("STORE_ERROR");
    expect(store.getDraft("draft-ok")?.worldId).toBe(HOME_WORLD);
  });
});

describe("UiStore commands and durability", () => {
  test("commands, drafts and both worlds survive a restart", () => {
    const root = tempRoot();
    const first = storeAt(root);
    publish(first, HOME_WORLD, "home durable", 0);
    publish(first, LAB_WORLD, "lab durable", 0);
    first.recordCommand("cmd-1", "sha256:payload", { ok: true, worldId: HOME_WORLD });
    first.createDraft({
      draftId: "draft-durable",
      worldId: LAB_WORLD,
      baseRevision: 1,
      document: documentFor(LAB_WORLD, "lab draft"),
      actorId: "alice",
    });
    first.close();

    const second = storeAt(root);
    expect(second.currentRevision(HOME_WORLD)?.revision).toBe(1);
    expect(second.currentRevision(HOME_WORLD)?.document.world.title).toBe("home durable");
    expect(second.currentRevision(LAB_WORLD)?.revision).toBe(1);
    expect(second.currentRevision(LAB_WORLD)?.document.world.title).toBe("lab durable");
    expect(second.listRevisions(HOME_WORLD, 10).length).toBe(1);
    expect(second.listRevisions(LAB_WORLD, 10).length).toBe(1);
    expect(second.getCommand("cmd-1")).toEqual({
      payloadHash: "sha256:payload",
      result: { ok: true, worldId: HOME_WORLD },
    });
    expect(second.getCommand("cmd-missing")).toBeNull();
    expect(second.getDraft("draft-durable")?.worldId).toBe(LAB_WORLD);
    expect(second.listWorlds().map((world) => world.worldId)).toEqual([HOME_WORLD, LAB_WORLD]);
  });

  test("recording a command id twice keeps the first result", () => {
    const store = storeAt(tempRoot());
    store.recordCommand("cmd-1", "sha256:first", { ok: true });
    store.recordCommand("cmd-1", "sha256:second", { ok: false });

    expect(store.getCommand("cmd-1")).toEqual({ payloadHash: "sha256:first", result: { ok: true } });
  });

  test("closing releases the lock for a new store on the same file", () => {
    const root = tempRoot();
    const path = join(root, "state.db");
    const first = new UiStore({ path });
    first.open();
    publish(first, HOME_WORLD, "one", 0);
    first.close();

    const second = new UiStore({ path });
    second.open();
    stores.push(second);
    expect(second.currentRevision(HOME_WORLD)?.revision).toBe(1);

    const third = new UiStore({ path });
    expect(storeError(() => third.open()).code).toBe("STORE_LOCKED");
  });
});

describe("UiStore retention and audit", () => {
  test("retention prunes revisions per world and never the current one", () => {
    const store = storeAt(tempRoot(), { revisions: 2 });
    for (let index = 0; index < 4; index += 1) publish(store, HOME_WORLD, `home-${index + 1}`, index);
    for (let index = 0; index < 3; index += 1) publish(store, LAB_WORLD, `lab-${index + 1}`, index);

    expect(store.listRevisions(HOME_WORLD, 10).map((revision) => revision.revision)).toEqual([4, 3]);
    expect(store.listRevisions(LAB_WORLD, 10).map((revision) => revision.revision)).toEqual([3, 2]);
    expect(store.getRevision(HOME_WORLD, 1)).toBeNull();
    expect(store.getRevision(LAB_WORLD, 1)).toBeNull();
    expect(store.currentRevision(HOME_WORLD)?.revision).toBe(4);
    expect(store.currentRevision(LAB_WORLD)?.revision).toBe(3);
  });

  test("retention never prunes a world's current revision", () => {
    const store = storeAt(tempRoot(), { revisions: 1 });
    publish(store, HOME_WORLD, "one", 0);
    publish(store, HOME_WORLD, "two", 1);
    publish(store, HOME_WORLD, "three", 2);

    expect(store.listRevisions(HOME_WORLD, 10).map((revision) => revision.revision)).toEqual([3]);
    expect(store.getRevision(HOME_WORLD, 3)).not.toBeNull();
    expect(store.currentRevision(HOME_WORLD)?.revision).toBe(3);
    expect(store.currentRevision(HOME_WORLD)?.document.world.title).toBe("three");
  });

  test("retention prunes drafts, commands and audit entries after a publish", () => {
    const store = storeAt(tempRoot(), { drafts: 1, commands: 1, audit: 2 });
    publish(store, HOME_WORLD, "one", 0);

    store.createDraft({
      draftId: "draft-a",
      worldId: HOME_WORLD,
      baseRevision: 1,
      document: documentFor(HOME_WORLD, "a"),
      actorId: "alice",
    });
    Bun.sleepSync(2);
    store.createDraft({
      draftId: "draft-b",
      worldId: HOME_WORLD,
      baseRevision: 1,
      document: documentFor(HOME_WORLD, "b"),
      actorId: "alice",
    });
    store.recordCommand("cmd-1", "sha256:one", { ok: true });
    Bun.sleepSync(2);
    store.recordCommand("cmd-2", "sha256:two", { ok: true });

    publish(store, HOME_WORLD, "two", 1);

    expect(store.listDrafts().map((draft) => draft.draftId)).toEqual(["draft-b"]);
    expect(store.getCommand("cmd-1")).toBeNull();
    expect(store.getCommand("cmd-2")).not.toBeNull();
    expect(store.auditEntries(10).length).toBe(2);
    expect(store.auditEntries(10).map((entry) => (entry.detail as { revision: number }).revision)).toEqual([2, 1]);

    publish(store, HOME_WORLD, "three", 2);
    expect(store.auditEntries(10).map((entry) => (entry.detail as { revision: number }).revision)).toEqual([3, 2]);
  });

  test("publish and rollback write world-scoped audit entries", () => {
    const store = storeAt(tempRoot());
    publish(store, HOME_WORLD, "one", 0);
    publish(store, LAB_WORLD, "lab one", 0);
    store.rollback({ worldId: HOME_WORLD, targetRevision: 1, expectedRevision: 1, actorId: "bob" });

    const entries = store.auditEntries(10);
    expect(entries.map((entry) => entry.op)).toEqual(["ui.rollback", "ui.publish", "ui.publish"]);

    const [rollbackEntry, labPublish, homePublish] = entries;
    expect(rollbackEntry?.actorId).toBe("bob");
    expect(rollbackEntry?.resource).toBe(`ui.world/${HOME_WORLD}/revision/2`);
    expect(rollbackEntry?.detail).toEqual({
      worldId: HOME_WORLD,
      revision: 2,
      targetRevision: 1,
      previousRevision: 1,
    });
    expect(labPublish?.resource).toBe(`ui.world/${LAB_WORLD}/revision/1`);
    expect(homePublish?.resource).toBe(`ui.world/${HOME_WORLD}/revision/1`);
    expect(homePublish?.detail).toEqual({
      worldId: HOME_WORLD,
      revision: 1,
      previousRevision: 0,
      contentHash: contentHash(documentFor(HOME_WORLD, "one")),
      draftId: null,
    });
    expect(rollbackEntry?.createdAt).toBeGreaterThan(0);

    store.audit("carol", "ui.draft.discard", "ui.draft/draft-9", { draftId: "draft-9" });
    expect(store.auditEntries(1)[0]).toMatchObject({
      actorId: "carol",
      op: "ui.draft.discard",
      resource: "ui.draft/draft-9",
      detail: { draftId: "draft-9" },
    });
  });
});

describe("openUiStore", () => {
  test("returns an open store on an empty directory", () => {
    const root = tempRoot();
    const store = openUiStore({ path: join(root, "nested", "state.db") });
    stores.push(store);

    expect(store.isOpen).toBe(true);
    expect(store.currentRevision(HOME_WORLD)).toBeNull();
    const revision = publish(store, HOME_WORLD, "fresh", 0);
    expect(revision.revision).toBe(1);
  });
});


describe("Lane C atomic command/revision crash safety", () => {
  test("a crash after nested publish but before the outcome record rolls the entire revision back", () => {
    const store = storeAt(tempRoot());
    const doc = documentFor(HOME_WORLD, "uncommitted");
    expect(() => store.runCommandAtomic({
      commandId: "atomic-crash", envelopeHash: "sha256:ui-envelope-v1:crash",
      actorId: "alice", kind: "ui.publish",
      execute: () => {
        store.publish({ worldId: HOME_WORLD, document: doc, contentHash: contentHash(doc), expectedRevision: 0, actorId: "alice" });
        throw new Error("simulated crash before durable receipt");
      },
    })).toThrow();
    expect(store.currentRevision(HOME_WORLD)).toBeNull();
    expect(store.listRevisions(HOME_WORLD)).toHaveLength(0);
    expect(store.getCommand("atomic-crash")).toBeNull();
    expect(store.auditEntries(10)).toHaveLength(0);
  });

  test("identical atomic receipt replays and changed envelope conflicts without a second revision", () => {
    const store = storeAt(tempRoot());
    const doc = documentFor(HOME_WORLD, "one");
    let calls = 0;
    const input = {
      commandId: "atomic-one", envelopeHash: "sha256:ui-envelope-v1:first",
      actorId: "alice", kind: "ui.publish",
      execute: () => {
        calls++;
        const rev = store.publish({ worldId: HOME_WORLD, document: doc, contentHash: contentHash(doc), expectedRevision: 0, actorId: "alice" });
        return { outcome: rev, result: { ok: true, value: rev }, resource: "ui.world/home", detail: { commandId: "atomic-one" } };
      },
    };
    expect(store.runCommandAtomic(input).status).toBe("committed");
    expect(store.runCommandAtomic(input).status).toBe("replayed");
    expect(store.runCommandAtomic({ ...input, envelopeHash: "sha256:ui-envelope-v1:changed" }).status).toBe("conflict");
    expect(calls).toBe(1);
    expect(store.listRevisions(HOME_WORLD)).toHaveLength(1);
  });
});
