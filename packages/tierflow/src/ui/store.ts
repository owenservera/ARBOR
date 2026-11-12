/**
 * Durable, world-scoped UI state store.
 *
 * This is the only authoritative home for published UI revisions, drafts,
 * command idempotency records and the audit trail. The server holds no
 * authoritative UI state in memory: every read comes from SQLite, so a process
 * restart resumes at each world's last published revision instead of a blank
 * document.
 *
 * State is keyed per world. Revisions are identified by `(world_id, revision)`
 * and `ui_current` holds one current-revision pointer per world, so the home
 * world and custom worlds advance independently without colliding.
 *
 * Durability choices:
 * - `journal_mode = WAL` keeps readers unblocked while a publish commits;
 * - `synchronous = FULL` fsyncs each commit, so a published revision survives a
 *   power loss, not only a process crash;
 * - `busy_timeout = 5000` lets a competing writer wait instead of failing fast;
 * - revisions are append-only, and a world's `ui_current` row is the compare-
 *   and-swap gate for that world's publishes and rollbacks.
 *
 * One process owns one database file. A `store_lock` row records the owning
 * instance; the same path is additionally tracked in-process so a second open
 * fails before SQLite ever sees it.
 *
 * Schema history:
 * - version 1 was single-world (`ui_revisions.revision` alone was the primary
 *   key) and its documents predate the world model. Version 1 files are refused
 *   with `UNSUPPORTED_VERSION` rather than migrated, because there is no world
 *   id or world-shaped document to carry forward.
 * - version 2 is the world-scoped schema created by this build.
 */

import { Database, type SQLQueryBindings } from "bun:sqlite";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { contentHash } from "./hash.ts";
import type { UiDocument, UiDraft, UiRevision, UiWorldKind } from "./types.ts";

/** Schema version this build writes. Bump only with a migration in `MIGRATIONS`. */
export const UI_STORE_SCHEMA_VERSION = 2 as const;

/** Default database location, relative to the store root. */
export const UI_STORE_DEFAULT_PATH = "runtime/state.db";

const BUSY_TIMEOUT_MS = 5000;

const DEFAULT_RETENTION = { revisions: 50, drafts: 20, commands: 500, audit: 1000 } as const;

/** Newest revisions returned by `listRevisions` when no limit is given. */
const DEFAULT_REVISION_LIMIT = 50;

/** Newest audit entries returned by `auditEntries` when no limit is given. */
const DEFAULT_AUDIT_LIMIT = 100;

export type UiStoreErrorCode =
  | "NOT_FOUND"
  | "REVISION_CONFLICT"
  | "STORE_LOCKED"
  | "UNSUPPORTED_VERSION"
  | "STORE_ERROR";

export interface UiStoreErrorOptions {
  /** The revision the store actually holds, set on `REVISION_CONFLICT`. */
  readonly currentRevision?: number;
  readonly cause?: unknown;
}

/**
 * Store failure with a stable code. Callers map `code` onto the UI error
 * vocabulary instead of parsing messages.
 */
export class UiStoreError extends Error {
  /** Stable failure category. */
  readonly code: UiStoreErrorCode;
  /** Actual revision, set when `code` is `REVISION_CONFLICT`. */
  readonly currentRevision: number | undefined;
  override name = "UiStoreError";

  constructor(code: UiStoreErrorCode, message: string, options: UiStoreErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.code = code;
    this.currentRevision = options.currentRevision;
  }
}

export interface UiStoreRetention {
  /** Newest revisions kept per world after each publish or rollback. Default 50. Never below the current one. */
  readonly revisions?: number;
  /** Newest drafts kept after each publish or rollback. Default 20. */
  readonly drafts?: number;
  /** Newest command idempotency records kept after each publish or rollback. Default 500. */
  readonly commands?: number;
  /** Newest audit entries kept after each publish or rollback. Default 1000. */
  readonly audit?: number;
}

export interface UiStoreOptions {
  /** Database file. Relative paths resolve against `root`. Default `runtime/state.db`. */
  readonly path?: string;
  /** Base directory for a relative `path`. Default `process.cwd()`. */
  readonly root?: string;
  readonly retention?: UiStoreRetention;
}

interface RevisionRow {
  world_id: string;
  revision: number;
  content_hash: string;
  document_json: string;
  actor_id: string;
  created_at: number;
}

interface DraftRow {
  draft_id: string;
  world_id: string;
  base_revision: number;
  draft_revision: number;
  content_hash: string;
  document_json: string;
  actor_id: string;
  updated_at: number;
}

interface WorldRow {
  world_id: string;
  kind: string;
  title: string;
  accent: string;
  created_at: number;
  revision: number | null;
}

interface CommandRow {
  payload_hash: string;
  result_json: string;
}

interface AuditRow {
  actor_id: string;
  op: string;
  resource: string;
  detail_json: string;
  created_at: number;
}

interface StoreLockRow {
  instance_id: string;
  pid: number;
  acquired_at: number;
}

interface WorldRegistration {
  readonly worldId: string;
  readonly kind: UiWorldKind;
  readonly title: string;
  readonly accent: string;
}

interface Migration {
  readonly version: number;
  readonly up: (db: Database) => void;
}

const SCHEMA_V2 = `
CREATE TABLE IF NOT EXISTS ui_revisions (
  world_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  document_json TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (world_id, revision)
);
CREATE TABLE IF NOT EXISTS ui_current (
  world_id TEXT PRIMARY KEY,
  revision INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS ui_worlds (
  world_id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  accent TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS ui_drafts (
  draft_id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  base_revision INTEGER NOT NULL,
  draft_revision INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  document_json TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS commands (
  command_id TEXT PRIMARY KEY,
  payload_hash TEXT NOT NULL,
  result_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id TEXT NOT NULL,
  op TEXT NOT NULL,
  resource TEXT NOT NULL,
  detail_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS store_lock (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  instance_id TEXT NOT NULL,
  pid INTEGER NOT NULL,
  acquired_at INTEGER NOT NULL
);
`;

const MIGRATIONS: readonly Migration[] = [{ version: 2, up: (db) => db.exec(SCHEMA_V2) }];

/**
 * Database paths open in this process, keyed by normalised path. Windows paths
 * are case-insensitive, so the key is lowercased there.
 */
const OPEN_PATHS = new Map<string, string>();

function lockKey(path: string): string {
  const absolute = resolve(path);
  return process.platform === "win32" ? absolute.toLowerCase() : absolute;
}

function toStoreError(error: unknown, label: string): UiStoreError {
  if (error instanceof UiStoreError) return error;
  const message = error instanceof Error ? error.message : String(error);
  return new UiStoreError("STORE_ERROR", `${label}: ${message}`, { cause: error });
}

function normalizeLimit(limit: number | undefined, fallback: number): number {
  if (limit === undefined) return fallback;
  if (!Number.isFinite(limit)) return fallback;
  return Math.max(0, Math.floor(limit));
}

function retentionLimit(value: number | undefined, fallback: number, label: string): number {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || value < 1) {
    throw new UiStoreError("STORE_ERROR", `retention.${label} must be a positive integer, got ${value}`);
  }
  return value;
}

function encodeJson(value: unknown, label: string): string {
  try {
    return JSON.stringify(value) ?? "null";
  } catch (error) {
    throw new UiStoreError("STORE_ERROR", `${label} is not JSON-serialisable`, { cause: error });
  }
}

function decodeJson(text: string, label: string): unknown {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new UiStoreError("STORE_ERROR", `${label} is corrupt: ${text.slice(0, 80)}`, { cause: error });
  }
}

function isDocument(value: unknown): value is UiDocument {
  if (typeof value !== "object" || value === null) return false;
  const document = value as Record<string, unknown>;
  const world = document["world"];
  if (typeof world !== "object" || world === null) return false;
  const fields = world as Record<string, unknown>;
  return (
    typeof document["schemaVersion"] === "number" &&
    typeof fields["id"] === "string" &&
    (fields["kind"] === "home" || fields["kind"] === "custom") &&
    typeof fields["title"] === "string" &&
    typeof fields["accent"] === "string" &&
    Array.isArray(document["objects"]) &&
    Array.isArray(document["relationships"]) &&
    Array.isArray(document["dataFlows"])
  );
}

function parseDocument(text: string): UiDocument {
  const parsed = decodeJson(text, "stored document");
  if (!isDocument(parsed)) {
    throw new UiStoreError("STORE_ERROR", "stored document does not match the UiDocument shape");
  }
  return parsed;
}

function readUserVersion(db: Database): number {
  const row = db.query<{ user_version: number }, []>("PRAGMA user_version").get();
  return row?.user_version ?? 0;
}

function parseWorldKind(value: string): UiWorldKind {
  if (value === "home" || value === "custom") return value;
  throw new UiStoreError("STORE_ERROR", `stored world kind is invalid: ${value}`);
}

function isProcessAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // Windows and POSIX both report a missing process as ESRCH; EPERM means it
    // exists but is not ours, which still counts as alive.
    return (error as NodeJS.ErrnoException).code !== "ESRCH";
  }
}

/**
 * Apply connection pragmas and verify the ones durability depends on. A file
 * that cannot run in WAL or FULL synchronous mode is refused rather than
 * silently downgraded.
 */
function configureConnection(db: Database, path: string): void {
  const journal = db.query<{ journal_mode: string }, []>("PRAGMA journal_mode = WAL").get();
  const journalMode = journal?.journal_mode?.toLowerCase();
  if (journalMode !== "wal") {
    throw new UiStoreError("STORE_ERROR", `${path}: cannot enable WAL journal mode (got ${journalMode ?? "unknown"})`);
  }

  db.exec("PRAGMA synchronous = FULL");
  const synchronous = db.query<{ synchronous: number }, []>("PRAGMA synchronous").get()?.synchronous;
  if (synchronous !== 2) {
    throw new UiStoreError("STORE_ERROR", `${path}: cannot enable FULL synchronous mode (got ${synchronous ?? "unknown"})`);
  }

  db.exec(`PRAGMA busy_timeout = ${BUSY_TIMEOUT_MS}`);
  db.exec("PRAGMA foreign_keys = ON");
}

/**
 * Bring `db` to `UI_STORE_SCHEMA_VERSION`.
 *
 * A file written by a newer build is refused. A version 1 file is refused too:
 * that schema had one global revision series and documents that predate the
 * world model, so there is no world id to migrate the data under. Fresh files
 * (version 0) and version 2 files open normally.
 */
function migrate(db: Database, path: string): void {
  const from = readUserVersion(db);
  if (from === UI_STORE_SCHEMA_VERSION) return;
  if (from > UI_STORE_SCHEMA_VERSION) {
    throw new UiStoreError(
      "UNSUPPORTED_VERSION",
      `${path}: schema version ${from} is newer than supported version ${UI_STORE_SCHEMA_VERSION}`,
    );
  }
  if (from === 1) {
    throw new UiStoreError(
      "UNSUPPORTED_VERSION",
      `${path}: schema version 1 is single-world and cannot be upgraded to world-scoped storage (version ${UI_STORE_SCHEMA_VERSION})`,
    );
  }

  const apply = db.transaction(() => {
    for (const migration of MIGRATIONS) {
      if (migration.version > from) migration.up(db);
    }
    db.exec(`PRAGMA user_version = ${UI_STORE_SCHEMA_VERSION}`);
  });
  apply.immediate();

  const to = readUserVersion(db);
  if (to !== UI_STORE_SCHEMA_VERSION) {
    throw new UiStoreError("STORE_ERROR", `${path}: migration from schema ${from} stopped at version ${to}`);
  }
}

function toRevision(row: RevisionRow): UiRevision {
  return {
    revision: row.revision,
    document: parseDocument(row.document_json),
    contentHash: row.content_hash,
    createdAt: row.created_at,
    actorId: row.actor_id,
  };
}

function toDraft(row: DraftRow): UiDraft {
  return {
    draftId: row.draft_id,
    worldId: row.world_id,
    baseRevision: row.base_revision,
    draftRevision: row.draft_revision,
    document: parseDocument(row.document_json),
    contentHash: row.content_hash,
    updatedAt: row.updated_at,
    actorId: row.actor_id,
  };
}

/**
 * One process, one connection, one lock row: the durable head of every world's
 * UI state.
 */
export class UiStore {
  readonly #path: string;
  readonly #key: string;
  readonly #retention: Readonly<{
    revisions: number;
    drafts: number;
    commands: number;
    audit: number;
  }>;
  #db: Database | null = null;
  #instanceId: string | null = null;

  constructor(options: UiStoreOptions = {}) {
    const root = options.root === undefined ? process.cwd() : resolve(options.root);
    const requested = options.path ?? UI_STORE_DEFAULT_PATH;
    if (requested.trim() === "") {
      throw new UiStoreError("STORE_ERROR", "store path must not be empty");
    }
    this.#path = isAbsolute(requested) ? resolve(requested) : resolve(root, requested);
    this.#key = lockKey(this.#path);
    this.#retention = {
      revisions: retentionLimit(options.retention?.revisions, DEFAULT_RETENTION.revisions, "revisions"),
      drafts: retentionLimit(options.retention?.drafts, DEFAULT_RETENTION.drafts, "drafts"),
      commands: retentionLimit(options.retention?.commands, DEFAULT_RETENTION.commands, "commands"),
      audit: retentionLimit(options.retention?.audit, DEFAULT_RETENTION.audit, "audit"),
    };
  }

  /** Absolute database file this store owns. */
  get path(): string {
    return this.#path;
  }

  /** True between a successful `open()` and `close()`. */
  get isOpen(): boolean {
    return this.#db !== null;
  }

  /**
   * Open the database, configure it, migrate it and take the instance lock.
   * Throws `STORE_LOCKED` when this process or another live process already
   * holds the same file, and `UNSUPPORTED_VERSION` when the file was written by
   * a newer build or uses the retired single-world schema.
   */
  open(): void {
    if (this.#db) {
      throw new UiStoreError("STORE_ERROR", `${this.#path}: store is already open`);
    }
    const existing = OPEN_PATHS.get(this.#key);
    if (existing !== undefined) {
      throw new UiStoreError(
        "STORE_LOCKED",
        `${this.#path}: store is already open in this process (instance ${existing})`,
      );
    }

    try {
      mkdirSync(dirname(this.#path), { recursive: true });
    } catch (error) {
      throw toStoreError(error, `create directory for ${this.#path}`);
    }

    const db = new Database(this.#path, { create: true, readwrite: true });
    try {
      configureConnection(db, this.#path);
      migrate(db, this.#path);
      const instanceId = randomUUID();
      this.#acquireLock(db, instanceId);
      this.#db = db;
      this.#instanceId = instanceId;
      OPEN_PATHS.set(this.#key, instanceId);
    } catch (error) {
      try {
        db.close();
      } catch {
        // Closing a half-configured connection must not mask the real failure.
      }
      throw toStoreError(error, `open ${this.#path}`);
    }
  }

  /**
   * Delete this instance's lock row and close the connection. Idempotent: the
   * lock row is removed before the connection goes away so a later open in this
   * process or another one can take the file over.
   */
  close(): void {
    const db = this.#db;
    if (!db) return;
    this.#db = null;
    const instanceId = this.#instanceId;
    this.#instanceId = null;
    try {
      if (instanceId !== null) {
        db.query<unknown, [string]>("DELETE FROM store_lock WHERE id = 1 AND instance_id = ?").run(instanceId);
      }
    } catch {
      // A failed lock cleanup must not keep the connection open; the next open
      // treats a lock row from a dead process as stale.
    } finally {
      try {
        db.close();
      } finally {
        OPEN_PATHS.delete(this.#key);
      }
    }
  }

  /**
   * The revision `ui_current` points at for `worldId`, or null when that world
   * has never published.
   */
  currentRevision(worldId: string): UiRevision | null {
    const row = this.#row<RevisionRow>(
      `SELECT r.world_id, r.revision, r.content_hash, r.document_json, r.actor_id, r.created_at
         FROM ui_current c
         JOIN ui_revisions r ON r.world_id = c.world_id AND r.revision = c.revision
        WHERE c.world_id = ?`,
      [worldId],
    );
    return row ? toRevision(row) : null;
  }

  /** One immutable revision of `worldId`, or null when it was pruned or never existed. */
  getRevision(worldId: string, revision: number): UiRevision | null {
    const row = this.#row<RevisionRow>(
      `SELECT world_id, revision, content_hash, document_json, actor_id, created_at
         FROM ui_revisions WHERE world_id = ? AND revision = ?`,
      [worldId, revision],
    );
    return row ? toRevision(row) : null;
  }

  /** Revisions of `worldId`, newest first. Default limit 50. */
  listRevisions(worldId: string, limit?: number): UiRevision[] {
    const take = normalizeLimit(limit, DEFAULT_REVISION_LIMIT);
    if (take === 0) return [];
    return this.#rows<RevisionRow>(
      `SELECT world_id, revision, content_hash, document_json, actor_id, created_at
         FROM ui_revisions WHERE world_id = ? ORDER BY revision DESC LIMIT ?`,
      [worldId, take],
    ).map(toRevision);
  }

  /**
   * Every registered world with its current revision, oldest registration
   * first. A world that has never published reports revision 0.
   */
  listWorlds(): Array<{
    worldId: string;
    kind: UiWorldKind;
    title: string;
    accent: string;
    revision: number;
    createdAt: number;
  }> {
    return this.#rows<WorldRow>(
      `SELECT w.world_id, w.kind, w.title, w.accent, w.created_at, c.revision AS revision
         FROM ui_worlds w
         LEFT JOIN ui_current c ON c.world_id = w.world_id
        ORDER BY w.created_at ASC, w.world_id ASC`,
    ).map((row) => ({
      worldId: row.world_id,
      kind: parseWorldKind(row.kind),
      title: row.title,
      accent: row.accent,
      revision: row.revision ?? 0,
      createdAt: row.created_at,
    }));
  }

  /**
   * Register a world. Idempotent for the same id and kind; re-registering an id
   * with a different kind throws `STORE_ERROR`. Title and accent follow the
   * latest registration.
   */
  registerWorld(input: { worldId: string; kind: UiWorldKind; title: string; accent: string }): void {
    if (input.worldId.trim() === "") {
      throw new UiStoreError("STORE_ERROR", "world id must not be empty");
    }
    this.#transaction("register world", (db) => {
      this.#registerWorldRow(db, input, Date.now());
    });
  }

  /**
   * Create a draft at draft revision 1.
   *
   * The world and the base revision must both exist in that world. The
   * document's world id must equal `input.worldId`.
   */
  createDraft(input: {
    draftId: string;
    worldId: string;
    baseRevision: number;
    document: UiDocument;
    actorId: string;
  }): UiDraft {
    const documentWorldId = input.document.world?.id;
    if (documentWorldId !== input.worldId) {
      throw new UiStoreError(
        "STORE_ERROR",
        `draft document world ${documentWorldId ?? "unknown"} does not match world ${input.worldId}`,
      );
    }
    const documentJson = encodeJson(input.document, "draft document");
    const hash = contentHash(input.document);
    const updatedAt = Date.now();
    return this.#transaction("create draft", (db) => {
      const world = db
        .query<{ world_id: string }, SQLQueryBindings[]>("SELECT world_id FROM ui_worlds WHERE world_id = ?")
        .get(input.worldId);
      if (!world) {
        throw new UiStoreError("NOT_FOUND", `world ${input.worldId} does not exist`);
      }
      const base = db
        .query<{ revision: number }, SQLQueryBindings[]>(
          "SELECT revision FROM ui_revisions WHERE world_id = ? AND revision = ?",
        )
        .get(input.worldId, input.baseRevision);
      if (!base) {
        throw new UiStoreError(
          "NOT_FOUND",
          `revision ${input.baseRevision} does not exist in world ${input.worldId}`,
        );
      }
      const existing = db
        .query<{ draft_id: string }, SQLQueryBindings[]>("SELECT draft_id FROM ui_drafts WHERE draft_id = ?")
        .get(input.draftId);
      if (existing) {
        throw new UiStoreError("STORE_ERROR", `draft ${input.draftId} already exists`);
      }
      db.query<unknown, SQLQueryBindings[]>(
        `INSERT INTO ui_drafts
           (draft_id, world_id, base_revision, draft_revision, content_hash, document_json, actor_id, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(input.draftId, input.worldId, input.baseRevision, 1, hash, documentJson, input.actorId, updatedAt);
      return {
        draftId: input.draftId,
        worldId: input.worldId,
        baseRevision: input.baseRevision,
        draftRevision: 1,
        document: input.document,
        contentHash: hash,
        updatedAt,
        actorId: input.actorId,
      };
    });
  }

  /** One draft by id, including drafts created by other actors. */
  getDraft(draftId: string): UiDraft | null {
    const row = this.#row<DraftRow>(
      `SELECT draft_id, world_id, base_revision, draft_revision, content_hash, document_json, actor_id, updated_at
         FROM ui_drafts WHERE draft_id = ?`,
      [draftId],
    );
    return row ? toDraft(row) : null;
  }

  /**
   * Replace a draft's document, guarded by `expectedDraftRevision`. A stale
   * expectation throws `REVISION_CONFLICT` carrying the draft revision the
   * store actually holds. The document's world id must match the draft's world.
   */
  updateDraft(input: {
    draftId: string;
    expectedDraftRevision: number;
    document: UiDocument;
    actorId: string;
  }): UiDraft {
    const documentJson = encodeJson(input.document, "draft document");
    const hash = contentHash(input.document);
    return this.#transaction("update draft", (db) => {
      const row = db
        .query<DraftRow, SQLQueryBindings[]>(
          `SELECT draft_id, world_id, base_revision, draft_revision, content_hash, document_json, actor_id, updated_at
             FROM ui_drafts WHERE draft_id = ?`,
        )
        .get(input.draftId);
      if (!row) {
        throw new UiStoreError("NOT_FOUND", `draft ${input.draftId} does not exist`);
      }
      if (row.draft_revision !== input.expectedDraftRevision) {
        throw new UiStoreError(
          "REVISION_CONFLICT",
          `draft ${input.draftId} is at draft revision ${row.draft_revision}, expected ${input.expectedDraftRevision}`,
          { currentRevision: row.draft_revision },
        );
      }
      const documentWorldId = input.document.world?.id;
      if (documentWorldId !== row.world_id) {
        throw new UiStoreError(
          "STORE_ERROR",
          `draft document world ${documentWorldId ?? "unknown"} does not match draft world ${row.world_id}`,
        );
      }
      const draftRevision = row.draft_revision + 1;
      const updatedAt = Math.max(Date.now(), row.updated_at + 1);
      db.query<unknown, SQLQueryBindings[]>(
        `UPDATE ui_drafts
            SET draft_revision = ?, content_hash = ?, document_json = ?, actor_id = ?, updated_at = ?
          WHERE draft_id = ?`,
      ).run(draftRevision, hash, documentJson, input.actorId, updatedAt, input.draftId);
      return {
        draftId: row.draft_id,
        worldId: row.world_id,
        baseRevision: row.base_revision,
        draftRevision,
        document: input.document,
        contentHash: hash,
        updatedAt,
        actorId: input.actorId,
      };
    });
  }

  /** Remove a draft. Returns false when it was already gone. */
  deleteDraft(draftId: string): boolean {
    return this.#write("delete draft", () => this.#run("DELETE FROM ui_drafts WHERE draft_id = ?", [draftId]) > 0);
  }

  /**
   * Drafts newest updated first, optionally narrowed to one world, one actor, or
   * both.
   */
  listDrafts(filter: { worldId?: string; actorId?: string } = {}): UiDraft[] {
    const clauses: string[] = [];
    const params: SQLQueryBindings[] = [];
    if (filter.worldId !== undefined) {
      clauses.push("world_id = ?");
      params.push(filter.worldId);
    }
    if (filter.actorId !== undefined) {
      clauses.push("actor_id = ?");
      params.push(filter.actorId);
    }
    const where = clauses.length === 0 ? "" : ` WHERE ${clauses.join(" AND ")}`;
    return this.#rows<DraftRow>(
      `SELECT draft_id, world_id, base_revision, draft_revision, content_hash, document_json, actor_id, updated_at
         FROM ui_drafts${where}
        ORDER BY updated_at DESC, draft_id ASC`,
      params,
    ).map(toDraft);
  }

  /**
   * Publish a document as the next revision of `worldId`.
   *
   * Compare-and-swap: `expectedRevision` must equal that world's current
   * revision (0 before the world's first publish), otherwise nothing is written
   * and `REVISION_CONFLICT` reports the world's actual current revision. An
   * unknown world is registered from the document's world metadata. On success
   * the revision row, the `ui_current` pointer, the audit entry and retention
   * pruning commit in one transaction. `draftId` is recorded in the audit detail
   * only; the draft itself is left to the command layer to discard or keep.
   */
  publish(input: {
    worldId: string;
    draftId?: string;
    document: UiDocument;
    contentHash: string;
    expectedRevision: number;
    actorId: string;
  }): UiRevision {
    const world = input.document.world;
    const documentWorldId = world?.id;
    if (typeof documentWorldId !== "string" || documentWorldId.length === 0) {
      throw new UiStoreError("STORE_ERROR", "published document has no world id");
    }
    if (documentWorldId !== input.worldId) {
      throw new UiStoreError(
        "STORE_ERROR",
        `document world ${documentWorldId} does not match world ${input.worldId}`,
      );
    }
    const documentJson = encodeJson(input.document, "published document");
    const now = Date.now();
    return this.#transaction("publish revision", (db) => {
      const current = this.#currentRevisionNumber(db, input.worldId);
      if (current !== input.expectedRevision) {
        throw new UiStoreError(
          "REVISION_CONFLICT",
          `publish expected revision ${input.expectedRevision} in world ${input.worldId}, current revision is ${current}`,
          { currentRevision: current },
        );
      }
      this.#registerWorldRow(
        db,
        { worldId: documentWorldId, kind: world.kind, title: world.title, accent: world.accent },
        now,
      );
      const revision = current + 1;
      db.query<unknown, SQLQueryBindings[]>(
        `INSERT INTO ui_revisions (world_id, revision, content_hash, document_json, actor_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(input.worldId, revision, input.contentHash, documentJson, input.actorId, now);
      db.query<unknown, SQLQueryBindings[]>(
        `INSERT INTO ui_current (world_id, revision) VALUES (?, ?)
         ON CONFLICT(world_id) DO UPDATE SET revision = excluded.revision`,
      ).run(input.worldId, revision);
      this.#insertAudit(
        db,
        input.actorId,
        "ui.publish",
        `ui.world/${input.worldId}/revision/${revision}`,
        {
          worldId: input.worldId,
          revision,
          previousRevision: current,
          contentHash: input.contentHash,
          draftId: input.draftId ?? null,
        },
        now,
      );
      this.#prune(db);
      return {
        revision,
        document: input.document,
        contentHash: input.contentHash,
        createdAt: now,
        actorId: input.actorId,
      };
    });
  }

  /**
   * Restore the document of `targetRevision` in `worldId` as a brand new
   * revision of that world. History is append-only, so revisions between the
   * target and the head stay readable. Uses the same compare-and-swap gate as
   * `publish`, in one transaction.
   */
  rollback(input: {
    worldId: string;
    targetRevision: number;
    expectedRevision: number;
    actorId: string;
  }): UiRevision {
    const now = Date.now();
    return this.#transaction("rollback revision", (db) => {
      const target = db
        .query<RevisionRow, SQLQueryBindings[]>(
          `SELECT world_id, revision, content_hash, document_json, actor_id, created_at
             FROM ui_revisions WHERE world_id = ? AND revision = ?`,
        )
        .get(input.worldId, input.targetRevision);
      if (!target) {
        throw new UiStoreError(
          "NOT_FOUND",
          `revision ${input.targetRevision} does not exist in world ${input.worldId}`,
        );
      }
      const current = this.#currentRevisionNumber(db, input.worldId);
      if (current !== input.expectedRevision) {
        throw new UiStoreError(
          "REVISION_CONFLICT",
          `rollback expected revision ${input.expectedRevision} in world ${input.worldId}, current revision is ${current}`,
          { currentRevision: current },
        );
      }
      const revision = current + 1;
      db.query<unknown, SQLQueryBindings[]>(
        `INSERT INTO ui_revisions (world_id, revision, content_hash, document_json, actor_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(input.worldId, revision, target.content_hash, target.document_json, input.actorId, now);
      db.query<unknown, SQLQueryBindings[]>(
        `INSERT INTO ui_current (world_id, revision) VALUES (?, ?)
         ON CONFLICT(world_id) DO UPDATE SET revision = excluded.revision`,
      ).run(input.worldId, revision);
      this.#insertAudit(
        db,
        input.actorId,
        "ui.rollback",
        `ui.world/${input.worldId}/revision/${revision}`,
        {
          worldId: input.worldId,
          revision,
          targetRevision: input.targetRevision,
          previousRevision: current,
        },
        now,
      );
      this.#prune(db);
      return {
        revision,
        document: parseDocument(target.document_json),
        contentHash: target.content_hash,
        createdAt: now,
        actorId: input.actorId,
      };
    });
  }

  /**
   * Record the result of a command for idempotent replay. First write wins: a
   * repeat with the same command id keeps the original payload hash and result,
   * and the caller compares hashes to detect a conflicting replay.
   */
  recordCommand(commandId: string, payloadHash: string, result: unknown): void {
    const resultJson = encodeJson(result, "command result");
    const createdAt = Date.now();
    this.#write("record command", () => {
      this.#run(
        `INSERT INTO commands (command_id, payload_hash, result_json, created_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(command_id) DO NOTHING`,
        [commandId, payloadHash, resultJson, createdAt],
      );
    });
  }


  /**
   * Atomic command reservation, UI mutation, result and audit. The synchronous
   * callback may call this store's draft/CAS methods: Bun SQLite uses nested
   * savepoints. No command result can survive without its revision, or vice
   * versa. Not a transaction boundary for an injected external state writer.
   */
  runCommandAtomic<T>(input: {
    commandId: string;
    envelopeHash: string;
    actorId: string;
    kind: string;
    execute: () => {
      outcome: T;
      result: unknown;
      resource: string;
      detail: unknown;
    };
  }): { status: "committed"; outcome: T } | { status: "replayed"; result: unknown } | { status: "conflict" } {
    return this.#transaction("atomic UI command", (db) => {
      const previous = db.query<CommandRow, SQLQueryBindings[]>(
        "SELECT payload_hash, result_json FROM commands WHERE command_id = ?",
      ).get(input.commandId);
      if (previous) {
        if (previous.payload_hash !== input.envelopeHash) return { status: "conflict" as const };
        return { status: "replayed" as const, result: decodeJson(previous.result_json, "command result") };
      }
      const applied = input.execute();
      const resultJson = encodeJson(applied.result, "atomic command result");
      const auditJson = encodeJson(applied.detail, "atomic command audit");
      const now = Date.now();
      db.query<unknown, SQLQueryBindings[]>(
        "INSERT INTO commands (command_id, payload_hash, result_json, created_at) VALUES (?, ?, ?, ?)",
      ).run(input.commandId, input.envelopeHash, resultJson, now);
      db.query<unknown, SQLQueryBindings[]>(
        "INSERT INTO audit (actor_id, op, resource, detail_json, created_at) VALUES (?, ?, ?, ?, ?)",
      ).run(input.actorId, input.kind, applied.resource, auditJson, now);
      return { status: "committed" as const, outcome: applied.outcome };
    });
  }

  /** Stored command result, or null when the command id was never recorded. */
  getCommand(commandId: string): { payloadHash: string; result: unknown } | null {
    const row = this.#row<CommandRow>(
      "SELECT payload_hash, result_json FROM commands WHERE command_id = ?",
      [commandId],
    );
    if (!row) return null;
    return { payloadHash: row.payload_hash, result: decodeJson(row.result_json, "command result") };
  }

  /** Append an audit entry outside a publish or rollback. */
  audit(actorId: string, op: string, resource: string, detail: unknown): void {
    const createdAt = Date.now();
    this.#write("write audit entry", () => {
      this.#insertAudit(this.#requireDb(), actorId, op, resource, detail, createdAt);
    });
  }

  /** Audit entries, newest first. Default limit 100. */
  auditEntries(limit?: number): Array<{
    actorId: string;
    op: string;
    resource: string;
    detail: unknown;
    createdAt: number;
  }> {
    const take = normalizeLimit(limit, DEFAULT_AUDIT_LIMIT);
    if (take === 0) return [];
    return this.#rows<AuditRow>(
      `SELECT actor_id, op, resource, detail_json, created_at FROM audit ORDER BY id DESC LIMIT ?`,
      [take],
    ).map((row) => ({
      actorId: row.actor_id,
      op: row.op,
      resource: row.resource,
      detail: decodeJson(row.detail_json, "audit detail"),
      createdAt: row.created_at,
    }));
  }

  #requireDb(): Database {
    if (!this.#db) {
      throw new UiStoreError("STORE_ERROR", `${this.#path}: store is not open`);
    }
    return this.#db;
  }

  #row<Row>(sql: string, params: SQLQueryBindings[] = []): Row | null {
    return this.#requireDb().query<Row, SQLQueryBindings[]>(sql).get(...params) ?? null;
  }

  #rows<Row>(sql: string, params: SQLQueryBindings[] = []): Row[] {
    return this.#requireDb().query<Row, SQLQueryBindings[]>(sql).all(...params);
  }

  #run(sql: string, params: SQLQueryBindings[]): number {
    return this.#requireDb().query<unknown, SQLQueryBindings[]>(sql).run(...params).changes;
  }

  #write<T>(label: string, operation: () => T): T {
    try {
      return operation();
    } catch (error) {
      throw toStoreError(error, label);
    }
  }

  /** Run `operation` under `BEGIN IMMEDIATE`; any throw rolls back everything. */
  #transaction<T>(label: string, operation: (db: Database) => T): T {
    const db = this.#requireDb();
    try {
      return db.transaction(() => operation(db)).immediate();
    } catch (error) {
      throw toStoreError(error, label);
    }
  }

  #currentRevisionNumber(db: Database, worldId: string): number {
    const row = db
      .query<{ revision: number }, SQLQueryBindings[]>("SELECT revision FROM ui_current WHERE world_id = ?")
      .get(worldId);
    return row?.revision ?? 0;
  }

  /**
   * Insert a world, or refresh its title and accent. A known world id may not
   * change kind: `home` and `custom` are permanent for an id.
   */
  #registerWorldRow(db: Database, input: WorldRegistration, createdAt: number): void {
    if (input.kind !== "home" && input.kind !== "custom") {
      throw new UiStoreError(
        "STORE_ERROR",
        `world ${input.worldId} has an invalid kind: ${String(input.kind)}`,
      );
    }
    const existing = db
      .query<{ kind: string }, SQLQueryBindings[]>("SELECT kind FROM ui_worlds WHERE world_id = ?")
      .get(input.worldId);
    if (!existing) {
      db.query<unknown, SQLQueryBindings[]>(
        `INSERT INTO ui_worlds (world_id, kind, title, accent, created_at) VALUES (?, ?, ?, ?, ?)`,
      ).run(input.worldId, input.kind, input.title, input.accent, createdAt);
      return;
    }
    if (existing.kind !== input.kind) {
      throw new UiStoreError(
        "STORE_ERROR",
        `world ${input.worldId} is registered as ${existing.kind}, cannot re-register as ${input.kind}`,
      );
    }
    db.query<unknown, SQLQueryBindings[]>(
      "UPDATE ui_worlds SET title = ?, accent = ? WHERE world_id = ?",
    ).run(input.title, input.accent, input.worldId);
  }

  #insertAudit(
    db: Database,
    actorId: string,
    op: string,
    resource: string,
    detail: unknown,
    createdAt: number,
  ): void {
    db.query<unknown, SQLQueryBindings[]>(
      `INSERT INTO audit (actor_id, op, resource, detail_json, created_at) VALUES (?, ?, ?, ?, ?)`,
    ).run(actorId, op, resource, encodeJson(detail, "audit detail"), createdAt);
  }

  /**
   * Apply retention inside the publishing transaction.
   *
   * Revisions are pruned per world, and a world's current revision is excluded
   * by number so its `ui_current` pointer can never dangle. Drafts, commands and
   * audit rows are bounded globally.
   */
  #prune(db: Database): void {
    db.query<unknown, SQLQueryBindings[]>(
      `DELETE FROM ui_revisions
        WHERE revision <> (SELECT c.revision FROM ui_current c WHERE c.world_id = ui_revisions.world_id)
          AND rowid NOT IN (
            SELECT r.rowid FROM ui_revisions r
             WHERE r.world_id = ui_revisions.world_id
             ORDER BY r.revision DESC
             LIMIT ?
          )`,
    ).run(this.#retention.revisions);

    db.query<unknown, SQLQueryBindings[]>(
      `DELETE FROM ui_drafts
        WHERE draft_id NOT IN (
          SELECT draft_id FROM ui_drafts ORDER BY updated_at DESC, draft_id ASC LIMIT ?
        )`,
    ).run(this.#retention.drafts);

    db.query<unknown, SQLQueryBindings[]>(
      `DELETE FROM commands
        WHERE payload_hash NOT LIKE 'sha256:ui-envelope-v1:%'
          AND command_id NOT IN (
          SELECT command_id FROM commands ORDER BY created_at DESC, rowid DESC LIMIT ?
        )`,
    ).run(this.#retention.commands);

    db.query<unknown, SQLQueryBindings[]>(
      `DELETE FROM audit
        WHERE id NOT IN (SELECT id FROM audit ORDER BY id DESC LIMIT ?)`,
    ).run(this.#retention.audit);
  }

  /**
   * Take the single-instance lock row. The transaction serialises competing
   * opens across processes; a row held by a live process is refused, a row left
   * by a dead one is taken over.
   */
  #acquireLock(db: Database, instanceId: string): void {
    const pid = process.pid;
    const acquiredAt = Date.now();
    const processStartedAt = Date.now() - Math.round(process.uptime() * 1000) - 1000;
    const acquire = db.transaction(() => {
      const holder = db
        .query<StoreLockRow, []>("SELECT instance_id, pid, acquired_at FROM store_lock WHERE id = 1")
        .get();
      if (holder) {
        const heldByThisProcess = holder.pid === pid && holder.acquired_at >= processStartedAt;
        const heldByLiveProcess = holder.pid !== pid && isProcessAlive(holder.pid);
        if (heldByThisProcess || heldByLiveProcess) {
          throw new UiStoreError(
            "STORE_LOCKED",
            `${this.#path}: store is locked by instance ${holder.instance_id} (pid ${holder.pid})`,
          );
        }
      }
      db.query<unknown, SQLQueryBindings[]>(
        `INSERT INTO store_lock (id, instance_id, pid, acquired_at) VALUES (1, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           instance_id = excluded.instance_id,
           pid = excluded.pid,
           acquired_at = excluded.acquired_at`,
      ).run(instanceId, pid, acquiredAt);
    });
    try {
      acquire.immediate();
    } catch (error) {
      throw toStoreError(error, "acquire store lock");
    }
  }
}

/** Open a `UiStore` and return it ready for use. */
export function openUiStore(options: UiStoreOptions = {}): UiStore {
  const store = new UiStore(options);
  store.open();
  return store;
}
