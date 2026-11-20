# File: packages/tierflow/src/ui/store.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/ui/store.ts |
| Language | TypeScript |
| Kind | source |
| Size | 42366 B |
| Lines | 1167 |
| Hash | 82bc9dd49368 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| UI_STORE_SCHEMA_VERSION | const | 42 | yes | export const UI_STORE_SCHEMA_VERSION = 2 as const; |
| UI_STORE_DEFAULT_PATH | const | 45 | yes | export const UI_STORE_DEFAULT_PATH = &quot;runtime/state.db&quot;; |
| BUSY_TIMEOUT_MS | const | 47 | no | const BUSY_TIMEOUT_MS = 5000; |
| DEFAULT_RETENTION | const | 49 | no | const DEFAULT_RETENTION = { revisions: 50, drafts: 20, commands: 500, audit: 1000 } as const; |
| DEFAULT_REVISION_LIMIT | const | 52 | no | const DEFAULT_REVISION_LIMIT = 50; |
| DEFAULT_AUDIT_LIMIT | const | 55 | no | const DEFAULT_AUDIT_LIMIT = 100; |
| UiStoreErrorCode | type | 57 | yes | export type UiStoreErrorCode = |
| UiStoreErrorOptions | interface | 64 | yes | export interface UiStoreErrorOptions { |
| UiStoreError | class | 74 | yes | export class UiStoreError extends Error { |
| constructor | method | 81 | yes | constructor(code: UiStoreErrorCode, message: string, options: UiStoreErrorOptions = {}) { |
| UiStoreRetention | interface | 88 | yes | export interface UiStoreRetention { |
| UiStoreOptions | interface | 99 | yes | export interface UiStoreOptions { |
| RevisionRow | interface | 107 | no | interface RevisionRow { |
| DraftRow | interface | 116 | no | interface DraftRow { |
| WorldRow | interface | 127 | no | interface WorldRow { |
| CommandRow | interface | 136 | no | interface CommandRow { |
| AuditRow | interface | 141 | no | interface AuditRow { |
| StoreLockRow | interface | 149 | no | interface StoreLockRow { |
| WorldRegistration | interface | 155 | no | interface WorldRegistration { |
| Migration | interface | 162 | no | interface Migration { |
| SCHEMA_V2 | const | 167 | no | const SCHEMA_V2 = ` |
| MIGRATIONS | const | 220 | no | const MIGRATIONS: readonly Migration[] = [{ version: 2, up: (db) =&gt; db.exec(SCHEMA_V2) }]; |
| OPEN_PATHS | const | 226 | no | const OPEN_PATHS = new Map&lt;string, string&gt;(); |
| lockKey | function | 228 | no | function lockKey(path: string): string { |
| absolute | const | 229 | no | const absolute = resolve(path); |
| toStoreError | function | 233 | no | function toStoreError(error: unknown, label: string): UiStoreError { |
| message | const | 235 | no | const message = error instanceof Error ? error.message : String(error); |
| normalizeLimit | function | 239 | no | function normalizeLimit(limit: number \| undefined, fallback: number): number { |
| retentionLimit | function | 245 | no | function retentionLimit(value: number \| undefined, fallback: number, label: string): number { |
| encodeJson | function | 253 | no | function encodeJson(value: unknown, label: string): string { |
| decodeJson | function | 261 | no | function decodeJson(text: string, label: string): unknown { |
| isDocument | function | 269 | no | function isDocument(value: unknown): value is UiDocument { |
| document | const | 271 | no | const document = value as Record&lt;string, unknown&gt;; |
| world | const | 272 | no | const world = document[&quot;world&quot;]; |
| fields | const | 274 | no | const fields = world as Record&lt;string, unknown&gt;; |
| parseDocument | function | 287 | no | function parseDocument(text: string): UiDocument { |
| parsed | const | 288 | no | const parsed = decodeJson(text, &quot;stored document&quot;); |
| readUserVersion | function | 295 | no | function readUserVersion(db: Database): number { |
| row | const | 296 | no | const row = db.query&lt;{ user_version: number }, []&gt;(&quot;PRAGMA user_version&quot;).get(); |
| parseWorldKind | function | 300 | no | function parseWorldKind(value: string): UiWorldKind { |
| isProcessAlive | function | 305 | no | function isProcessAlive(pid: number): boolean { |
| configureConnection | function | 322 | no | function configureConnection(db: Database, path: string): void { |
| journal | const | 323 | no | const journal = db.query&lt;{ journal_mode: string }, []&gt;(&quot;PRAGMA journal_mode = WAL&quot;).get(); |
| journalMode | const | 324 | no | const journalMode = journal?.journal_mode?.toLowerCase(); |
| synchronous | const | 330 | no | const synchronous = db.query&lt;{ synchronous: number }, []&gt;(&quot;PRAGMA synchronous&quot;).get()?.synchronous; |
| migrate | function | 347 | no | function migrate(db: Database, path: string): void { |
| apply | const | 363 | no | const apply = db.transaction(() =&gt; { for (const migration of MIGRATIONS) { if (migration.version &gt; from) migration.up(db); } db.exec(`PRAGMA user_version = ${UI_STORE_SCHEMA_VERSION}`); |
| to | const | 371 | no | const to = readUserVersion(db); |
| toRevision | function | 377 | no | function toRevision(row: RevisionRow): UiRevision { |
| toDraft | function | 387 | no | function toDraft(row: DraftRow): UiDraft { |
| UiStore | class | 404 | yes | export class UiStore { |
| constructor | method | 416 | yes | constructor(options: UiStoreOptions = {}) { |
| root | const | 417 | no | const root = options.root === undefined ? process.cwd() : resolve(options.root); |
| requested | const | 418 | no | const requested = options.path ?? UI_STORE_DEFAULT_PATH; |
| open | method | 448 | yes | open(): void { |
| existing | const | 452 | no | const existing = OPEN_PATHS.get(this.#key); |
| db | const | 466 | no | const db = new Database(this.#path, { create: true, readwrite: true }); |
| instanceId | const | 470 | no | const instanceId = randomUUID(); |
| close | method | 490 | yes | close(): void { |
| db | const | 491 | no | const db = this.#db; |
| instanceId | const | 494 | no | const instanceId = this.#instanceId; |
| currentRevision | method | 516 | yes | currentRevision(worldId: string): UiRevision \| null { |
| row | const | 517 | no | const row = this.#row&lt;RevisionRow&gt;( `SELECT r.world_id, r.revision, r.content_hash, r.document_json, r.actor_id, r.created_at FROM ui_current c JOIN ui_revisions r ON r.world_id = c.world_id AND r.re… |
| getRevision | method | 528 | yes | getRevision(worldId: string, revision: number): UiRevision \| null { |
| row | const | 529 | no | const row = this.#row&lt;RevisionRow&gt;( `SELECT world_id, revision, content_hash, document_json, actor_id, created_at FROM ui_revisions WHERE world_id = ? AND revision = ?`, [worldId, revision], ); |
| listRevisions | method | 538 | yes | listRevisions(worldId: string, limit?: number): UiRevision[] { |
| take | const | 539 | no | const take = normalizeLimit(limit, DEFAULT_REVISION_LIMIT); |
| listWorlds | method | 552 | yes | listWorlds(): Array&lt;{ |
| registerWorld | method | 580 | yes | registerWorld(input: { worldId: string; kind: UiWorldKind; title: string; accent: string }): void { |
| createDraft | method | 595 | yes | createDraft(input: { draftId: string; worldId: string; baseRevision: number; document: UiDocument; |
| documentWorldId | const | 602 | no | const documentWorldId = input.document.world?.id; |
| documentJson | const | 609 | no | const documentJson = encodeJson(input.document, &quot;draft document&quot;); |
| hash | const | 610 | no | const hash = contentHash(input.document); |
| updatedAt | const | 611 | no | const updatedAt = Date.now(); |
| world | const | 613 | no | const world = db |
| base | const | 619 | no | const base = db |
| existing | const | 630 | no | const existing = db |
| getDraft | method | 655 | yes | getDraft(draftId: string): UiDraft \| null { |
| row | const | 656 | no | const row = this.#row&lt;DraftRow&gt;( `SELECT draft_id, world_id, base_revision, draft_revision, content_hash, document_json, actor_id, updated_at FROM ui_drafts WHERE draft_id = ?`, [draftId], ); |
| updateDraft | method | 669 | yes | updateDraft(input: { draftId: string; expectedDraftRevision: number; document: UiDocument; actorId: string; |
| documentJson | const | 675 | no | const documentJson = encodeJson(input.document, &quot;draft document&quot;); |
| hash | const | 676 | no | const hash = contentHash(input.document); |
| row | const | 678 | no | const row = db |
| documentWorldId | const | 694 | no | const documentWorldId = input.document.world?.id; |
| draftRevision | const | 701 | no | const draftRevision = row.draft_revision + 1; |
| updatedAt | const | 702 | no | const updatedAt = Math.max(Date.now(), row.updated_at + 1); |
| deleteDraft | method | 722 | yes | deleteDraft(draftId: string): boolean { |
| listDrafts | method | 730 | yes | listDrafts(filter: { worldId?: string; actorId?: string } = {}): UiDraft[] { |
| clauses | const | 731 | no | const clauses: string[] = []; |
| params | const | 732 | no | const params: SQLQueryBindings[] = []; |
| publish | method | 761 | yes | publish(input: { worldId: string; draftId?: string; document: UiDocument; contentHash: string; |
| world | const | 769 | no | const world = input.document.world; |
| documentWorldId | const | 770 | no | const documentWorldId = world?.id; |
| documentJson | const | 780 | no | const documentJson = encodeJson(input.document, &quot;published document&quot;); |
| now | const | 781 | no | const now = Date.now(); |
| current | const | 783 | no | const current = this.#currentRevisionNumber(db, input.worldId); |
| revision | const | 796 | no | const revision = current + 1; |
| rollback | method | 836 | yes | rollback(input: { worldId: string; targetRevision: number; expectedRevision: number; actorId: string; |
| now | const | 842 | no | const now = Date.now(); |
| target | const | 844 | no | const target = db |
| current | const | 856 | no | const current = this.#currentRevisionNumber(db, input.worldId); |
| revision | const | 864 | no | const revision = current + 1; |
| recordCommand | method | 902 | yes | recordCommand(commandId: string, payloadHash: string, result: unknown): void { |
| resultJson | const | 903 | no | const resultJson = encodeJson(result, &quot;command result&quot;); |
| createdAt | const | 904 | no | const createdAt = Date.now(); |
| runCommandAtomic | method | 921 | yes | runCommandAtomic&lt;T&gt;(input: { commandId: string; envelopeHash: string; actorId: string; kind: string; |
| previous | const | 934 | no | const previous = db.query&lt;CommandRow, SQLQueryBindings[]&gt;( &quot;SELECT payload_hash, result_json FROM commands WHERE command_id = ?&quot;, ).get(input.commandId); |
| applied | const | 941 | no | const applied = input.execute(); |
| resultJson | const | 942 | no | const resultJson = encodeJson(applied.result, &quot;atomic command result&quot;); |
| auditJson | const | 943 | no | const auditJson = encodeJson(applied.detail, &quot;atomic command audit&quot;); |
| now | const | 944 | no | const now = Date.now(); |
| getCommand | method | 956 | yes | getCommand(commandId: string): { payloadHash: string; result: unknown } \| null { |
| row | const | 957 | no | const row = this.#row&lt;CommandRow&gt;( &quot;SELECT payload_hash, result_json FROM commands WHERE command_id = ?&quot;, [commandId], ); |
| audit | method | 966 | yes | audit(actorId: string, op: string, resource: string, detail: unknown): void { |
| createdAt | const | 967 | no | const createdAt = Date.now(); |
| auditEntries | method | 974 | yes | auditEntries(limit?: number): Array&lt;{ |
| take | const | 981 | no | const take = normalizeLimit(limit, DEFAULT_AUDIT_LIMIT); |
| db | const | 1024 | no | const db = this.#requireDb(); |
| row | const | 1033 | no | const row = db |
| existing | const | 1050 | no | const existing = db |
| pid | const | 1129 | no | const pid = process.pid; |
| acquiredAt | const | 1130 | no | const acquiredAt = Date.now(); |
| processStartedAt | const | 1131 | no | const processStartedAt = Date.now() - Math.round(process.uptime() * 1000) - 1000; |
| acquire | const | 1132 | no | const acquire = db.transaction(() =&gt; { const holder = db .query&lt;StoreLockRow, []&gt;(&quot;SELECT instance_id, pid, acquired_at FROM store_lock WHERE id = 1&quot;) .get(); if (holder) { |
| holder | const | 1133 | no | const holder = db |
| heldByThisProcess | const | 1137 | no | const heldByThisProcess = holder.pid === pid &amp;&amp; holder.acquired_at &gt;= processStartedAt; |
| heldByLiveProcess | const | 1138 | no | const heldByLiveProcess = holder.pid !== pid &amp;&amp; isProcessAlive(holder.pid); |
| openUiStore | function | 1163 | yes | export function openUiStore(options: UiStoreOptions = {}): UiStore { |
| store | const | 1164 | no | const store = new UiStore(options); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:sqlite | import | 34 | external |
| node:crypto | import | 35 | external |
| node:fs | import | 36 | external |
| node:path | import | 37 | external |
| ./hash.ts | import | 38 | [packages/tierflow/src/ui/hash.ts](./hash.ts.md) |
| ./types.ts | import | 39 | [packages/tierflow/src/ui/types.ts](./types.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/ui/commands.ts](./commands.ts.md) | ./store.ts |
| [packages/tierflow/src/ui/commands.ts](./commands.ts.md) | ./store.ts |
| [packages/tierflow/src/visual-runtime/revisions/wave3-atomic-replay.ts](../visual-runtime/revisions/wave3-atomic-replay.ts.md) | ../../ui/store.ts |
| [packages/tierflow/tests/ui-commands.test.ts](../../tests/ui-commands.test.ts.md) | ../src/ui/store.ts |
| [packages/tierflow/tests/ui-store.test.ts](../../tests/ui-store.test.ts.md) | ../src/ui/store.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-b/studio-editing.test.ts](../../tests/visual-runtime/final-wave/lane-b/studio-editing.test.ts.md) | ../../../../src/ui/store.ts |
| [packages/tierflow/tests/visual-runtime/integration-3.test.ts](../../tests/visual-runtime/integration-3.test.ts.md) | ../../src/ui/store.ts |
| [packages/tierflow/tests/visual-runtime/wave3-c-replay.test.ts](../../tests/visual-runtime/wave3-c-replay.test.ts.md) | ../../src/ui/store.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 1168 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
