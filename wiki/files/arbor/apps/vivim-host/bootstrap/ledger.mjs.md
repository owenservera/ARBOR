# File: apps/vivim-host/bootstrap/ledger.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/bootstrap/ledger.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 26730 B |
| Lines | 522 |
| Hash | a7a7c2c47ee7 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| LEDGER_SCHEMA | const | 13 | yes | export const LEDGER_SCHEMA = &#39;vivim.bootstrap-ledger/1&#39;; |
| MIGRATIONS | const | 14 | no | const MIGRATIONS = [ |
| fail | function | 204 | no | function fail(reason) { throw new TypeError(&#39;Bootstrap ledger: &#39; + reason); } |
| openLedger | function | 206 | yes | export function openLedger({ file = &#39;:memory:&#39; } = {}) { |
| DatabaseSync | variable | 210 | no | let DatabaseSync; |
| error | const | 214 | no | const error = new Error(&#39;Bootstrap ledger: node:sqlite is unavailable on this Node runtime (requires Node &gt;= 22.5)&#39;); |
| db | const | 219 | no | const db = new DatabaseSync(file); |
| lockContention | function | 224 | no | const lockContention = error =&gt; /locked\|busy/i.test(String(error?.message ?? error?.code ?? error)); |
| sleepSync | function | 225 | no | const sleepSync = ms =&gt; Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); |
| execLocked | function | 229 | no | const execLocked = (sql, { budgetMs = 4000, delayMs = 20 } = {}) =&gt; { |
| deadline | const | 230 | no | const deadline = Date.now() + budgetMs; |
| last | variable | 231 | no | let last; |
| version | const | 245 | no | const version = Number(db.prepare(&#39;PRAGMA user_version&#39;).get().user_version); |
| run | function | 255 | no | const run = (sql, ...args) =&gt; db.prepare(sql).run(...args); |
| all | function | 256 | no | const all = (sql, ...args) =&gt; db.prepare(sql).all(...args); |
| one | function | 257 | no | const one = (sql, ...args) =&gt; db.prepare(sql).get(...args) ?? null; |
| meta | const | 259 | no | const meta = { |
| transaction | function | 264 | no | function transaction(fn) { |
| provenance | const | 272 | no | const provenance = { |
| themes | const | 284 | no | const themes = { |
| row | const | 298 | no | const row = one(&#39;SELECT world_id FROM themes WHERE id = ?&#39;, id); |
| claims | const | 307 | no | const claims = { |
| observations | const | 333 | no | const observations = { |
| relationships | const | 349 | no | const relationships = { |
| contradictions | const | 359 | no | const contradictions = { |
| preferences | const | 369 | no | const preferences = { |
| passes | const | 390 | no | const passes = { |
| jobs | const | 402 | no | const jobs = { |
| schemaProposals | const | 418 | no | const schemaProposals = { |
| uiRevisions | const | 428 | no | const uiRevisions = { |
| row | const | 442 | no | const row = one(&#39;SELECT world_id FROM ui_revisions WHERE id = ?&#39;, id); |
| receipts | const | 451 | no | const receipts = { |
| webVisits | const | 464 | no | const webVisits = { |
| prior | const | 467 | no | const prior = one(&#39;SELECT digest FROM web_evidence WHERE world_id = ? AND id = ?&#39;, row.worldId, row.id); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 9 | external |
| node:path | import | 10 | external |
| node:module | import | 11 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/bootstrap/runtime.mjs](./runtime.mjs.md) | ./ledger.mjs |
| [apps/vivim-host/bootstrap/web-memory.test.mjs](./web-memory.test.mjs.md) | ./ledger.mjs |
| [apps/vivim-host/test/bootstrap-grant.test.mjs](../test/bootstrap-grant.test.mjs.md) | ../bootstrap/ledger.mjs |
| [apps/vivim-host/test/bootstrap.test.mjs](../test/bootstrap.test.mjs.md) | ../bootstrap/ledger.mjs |
| [apps/vivim-host/test/hvi-source-grant.test.mjs](../test/hvi-source-grant.test.mjs.md) | ../bootstrap/ledger.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VIVIM bootstrap ledger: additive SQLite intelligence store on the owner's PC.
// It never replaces the existing JSON authorities (personal agent, World history,
// send journals). It holds only new relational bootstrap facts: observations,
// claims, provenance, preferences, relationships, contradictions, pass state and
// job receipts.
//
// Single writer: the Host process. Every mutation runs inside one immediate
// transaction; reads are plain statements. No SQL text ever comes from a model.
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

export const LEDGER_SCHEMA = 'vivim.bootstrap-ledger/1';
const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS meta (
     key TEXT PRIMARY KEY,
     value TEXT NOT NULL
   );
   CREATE TABLE IF NOT EXISTS provenance (
     id TEXT PRIMARY KEY,
     kind TEXT NOT NULL,
     request_id TEXT,
     generation_id TEXT,
     provider TEXT,
     thread_ref TEXT,
     observed_at TEXT NOT NULL,
     digest TEXT,
     basis TEXT
   );
   CREATE TABLE IF NOT EXISTS themes (
     id TEXT PRIMARY KEY,
     world_id TEXT NOT NULL,
     revision INTEGER NOT NULL,
     status TEXT NOT NULL,
     source_kind TEXT NOT NULL,
     source_ref TEXT NOT NULL,
     palette_json TEXT NOT NULL,
     appearance TEXT NOT NULL,
     mood TEXT NOT NULL,
     texture TEXT NOT NULL,
     motion TEXT NOT NULL,
     density TEXT NOT NULL,
     render_json TEXT NOT NULL,
     request_id TEXT,
     provenance_id TEXT,
     created_at TEXT NOT NULL,
     active INTEGER NOT NULL DEFAULT 0,
     UNIQUE (world_id, revision)
   );
   CREATE INDEX IF NOT EXISTS themes_active ON themes (world_id, active, revision DESC);
   CREATE TABLE IF NOT EXISTS claims (
     id TEXT NOT NULL,
     world_id TEXT NOT NULL,
     pass TEXT NOT NULL,
     section TEXT NOT NULL,
     label TEXT NOT NULL,
     kind TEXT,
     freshness TEXT,
     basis TEXT NOT NULL,
     status TEXT NOT NULL,
     confidence REAL NOT NULL,
     scope TEXT,
     statement TEXT NOT NULL,
     preference_json TEXT,
     provenance_id TEXT,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL,
     PRIMARY KEY (id, world_id)
   );
   CREATE INDEX IF NOT EXISTS claims_section ON claims (world_id, section, updated_at DESC);
   CREATE TABLE IF NOT EXISTS observations (
     id TEXT NOT NULL,
     world_id TEXT NOT NULL,
     pass TEXT NOT NULL,
     category TEXT NOT NULL,
     body TEXT NOT NULL,
     confidence REAL NOT NULL,
     sensitive INTEGER NOT NULL DEFAULT 0,
     provenance_id TEXT,
     created_at TEXT NOT NULL,
```

_First 80 of 523 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
