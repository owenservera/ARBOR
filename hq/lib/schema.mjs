// hq/lib/schema.mjs — SQLite schema, migrations and transactions.
// Storage is machine-local and rebuildable: .hq/index.db (gitignored).
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { CAPABILITY_DDL } from './capability-schema.mjs';

export const SCHEMA_VERSION = 1;

// Per-revision test outcome store (HQ-048 engine surface, exercised from
// hq/lib/lake.mjs). Keyed by (sha, test_id); status is the recorded outcome
// for that test at that source revision. Outcomes are synthetic benchmark
// data supplied by the caller; the revision (commit sha) and its ordering
// come from real git history. Applied by migrate() on every db open, so
// lake.mjs needs no per-call CREATE.
const TEST_RESULTS_DDL = `
CREATE TABLE IF NOT EXISTS test_results (
  id           INTEGER PRIMARY KEY,
  project_id   INTEGER NOT NULL,
  sha          TEXT NOT NULL,
  test_id      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pass',
  file         TEXT,
  line         INTEGER,
  duration_ms  INTEGER,
  output       TEXT,
  recorded_at  TEXT NOT NULL,
  UNIQUE(sha, test_id)
);
CREATE INDEX IF NOT EXISTS test_results_project ON test_results(project_id);
CREATE INDEX IF NOT EXISTS test_results_sha ON test_results(sha);
CREATE INDEX IF NOT EXISTS test_results_test_id ON test_results(test_id);
`;

const DDL = `
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id           INTEGER PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,
  path         TEXT NOT NULL UNIQUE,
  kind         TEXT NOT NULL DEFAULT 'dir',
  remote       TEXT,
  branch       TEXT,
  head         TEXT,
  file_count   INTEGER NOT NULL DEFAULT 0,
  symbol_count INTEGER NOT NULL DEFAULT 0,
  added_at     TEXT NOT NULL,
  indexed_at   TEXT
);

CREATE TABLE IF NOT EXISTS files (
  id           INTEGER PRIMARY KEY,
  project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  path         TEXT NOT NULL,
  abs_path     TEXT NOT NULL,
  lang         TEXT NOT NULL DEFAULT 'other',
  kind         TEXT NOT NULL DEFAULT 'source',
  size         INTEGER NOT NULL DEFAULT 0,
  mtime_ms     INTEGER NOT NULL DEFAULT 0,
  hash         TEXT,
  lines        INTEGER NOT NULL DEFAULT 0,
  is_test      INTEGER NOT NULL DEFAULT 0,
  is_generated INTEGER NOT NULL DEFAULT 0,
  indexed_at   TEXT,
  UNIQUE(project_id, path)
);
CREATE INDEX IF NOT EXISTS files_project ON files(project_id);
CREATE INDEX IF NOT EXISTS files_lang ON files(lang);
CREATE INDEX IF NOT EXISTS files_hash ON files(hash);

CREATE TABLE IF NOT EXISTS symbols (
  id         INTEGER PRIMARY KEY,
  file_id    INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  kind       TEXT NOT NULL,
  line       INTEGER NOT NULL DEFAULT 0,
  end_line   INTEGER NOT NULL DEFAULT 0,
  signature  TEXT,
  exported   INTEGER NOT NULL DEFAULT 0,
  doc        TEXT
);
CREATE INDEX IF NOT EXISTS symbols_name ON symbols(name);
CREATE INDEX IF NOT EXISTS symbols_file ON symbols(file_id);
CREATE INDEX IF NOT EXISTS symbols_project ON symbols(project_id);
CREATE INDEX IF NOT EXISTS symbols_kind ON symbols(kind);

CREATE TABLE IF NOT EXISTS imports (
  id                  INTEGER PRIMARY KEY,
  file_id             INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  project_id          INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  specifier           TEXT NOT NULL,
  kind                TEXT NOT NULL DEFAULT 'import',
  resolved_file_id    INTEGER REFERENCES files(id) ON DELETE SET NULL,
  resolved_project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  line                INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS imports_file ON imports(file_id);
CREATE INDEX IF NOT EXISTS imports_resolved ON imports(resolved_file_id);
CREATE INDEX IF NOT EXISTS imports_project ON imports(project_id);

CREATE TABLE IF NOT EXISTS commits (
  sha            TEXT PRIMARY KEY,
  project_id     INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author         TEXT,
  date           TEXT NOT NULL,
  subject        TEXT NOT NULL,
  type           TEXT,
  scope          TEXT,
  files_changed  INTEGER NOT NULL DEFAULT 0,
  inserted_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS commits_project_date ON commits(project_id, date);
CREATE INDEX IF NOT EXISTS commits_date ON commits(date);

CREATE TABLE IF NOT EXISTS commit_files (
  sha    TEXT NOT NULL REFERENCES commits(sha) ON DELETE CASCADE,
  path   TEXT NOT NULL,
  status TEXT,
  PRIMARY KEY (sha, path)
);

CREATE TABLE IF NOT EXISTS events (
  id          TEXT PRIMARY KEY,
  project_id  INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL,
  key         TEXT,
  at          TEXT NOT NULL,
  data        TEXT NOT NULL,
  ingested_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS events_kind_at ON events(kind, at);
CREATE INDEX IF NOT EXISTS events_project ON events(project_id);

-- Instruction + skill routing (AGENTS.md, SKILL.md, context.md, opencode.json).
CREATE TABLE IF NOT EXISTS instructions (
  id         INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  path       TEXT NOT NULL,
  kind       TEXT NOT NULL,
  name       TEXT,
  title      TEXT,
  description TEXT,
  triggers   TEXT,
  body       TEXT,
  hash       TEXT,
  mtime_ms   INTEGER NOT NULL DEFAULT 0,
  UNIQUE(project_id, path)
);
CREATE INDEX IF NOT EXISTS instructions_project ON instructions(project_id);
CREATE INDEX IF NOT EXISTS instructions_kind ON instructions(kind);

-- Personal + agent memory. Tiers mirror VIVIM: now (Immediate),
-- later (Curated), canon (owner-confirmed). Provenance always survives.
CREATE TABLE IF NOT EXISTS notes (
  id         TEXT PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  tier       TEXT NOT NULL DEFAULT 'now',
  key        TEXT,
  text       TEXT NOT NULL,
  origin     TEXT NOT NULL DEFAULT 'user',
  confidence REAL NOT NULL DEFAULT 1.0,
  evidence   TEXT,
  status     TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version    INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS notes_tier ON notes(tier);
CREATE INDEX IF NOT EXISTS notes_project ON notes(project_id);
CREATE INDEX IF NOT EXISTS notes_status ON notes(status);

-- Evidence ledger: every context bundle / ask / brief records what it read.
CREATE TABLE IF NOT EXISTS receipts (
  id         TEXT PRIMARY KEY,
  kind       TEXT NOT NULL,
  task       TEXT,
  project    TEXT,
  sources    TEXT NOT NULL,
  digest     TEXT NOT NULL,
  bytes      INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS receipts_kind ON receipts(kind);
CREATE INDEX IF NOT EXISTS receipts_created ON receipts(created_at);

-- Structured agent annotations extracted from inline comments.
-- Protocol: @hq:context, @hq:why, @hq:invariant, @hq:see, @hq:todo,
-- @hq:owner, @hq:task, @hq:risk, @hq:deprecated.
CREATE TABLE IF NOT EXISTS annotations (
  id         INTEGER PRIMARY KEY,
  file_id    INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  line       INTEGER NOT NULL,
  kind       TEXT NOT NULL,
  text       TEXT NOT NULL,
  owner      TEXT,
  ref        TEXT
);
CREATE INDEX IF NOT EXISTS annotations_file ON annotations(file_id);
CREATE INDEX IF NOT EXISTS annotations_kind ON annotations(kind);

-- Wiki generation ledger for incremental rebuilds.
CREATE TABLE IF NOT EXISTS wiki_pages (
  id           TEXT PRIMARY KEY,
  input_hash   TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  bytes        INTEGER NOT NULL DEFAULT 0
);

-- Execution timing ledger. Every CLI command, MCP tool and automation run
-- records a span; budgets and priorities make optimization explicit.
CREATE TABLE IF NOT EXISTS timings (
  id          INTEGER PRIMARY KEY,
  operation   TEXT NOT NULL,
  project     TEXT,
  started_at  TEXT NOT NULL,
  duration_ms REAL NOT NULL,
  ok          INTEGER NOT NULL DEFAULT 1,
  bytes       INTEGER NOT NULL DEFAULT 0,
  tokens      INTEGER NOT NULL DEFAULT 0,
  meta        TEXT
);
CREATE INDEX IF NOT EXISTS timings_operation ON timings(operation, started_at);
CREATE INDEX IF NOT EXISTS timings_started ON timings(started_at);

-- Document intelligence: classify every doc by the AION 21-family taxonomy.
CREATE TABLE IF NOT EXISTS documents (
  id          INTEGER PRIMARY KEY,
  project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  path        TEXT NOT NULL,
  family      TEXT,
  family_name TEXT,
  role        TEXT,
  authority   TEXT,
  lifecycle   TEXT,
  origin_type TEXT,
  title       TEXT,
  owner       TEXT,
  hash        TEXT,
  mtime_ms    INTEGER NOT NULL DEFAULT 0,
  last_verified TEXT,
  binds_to    TEXT,
  UNIQUE(project_id, path)
);
CREATE INDEX IF NOT EXISTS documents_family ON documents(family);
CREATE INDEX IF NOT EXISTS documents_authority ON documents(authority);

-- Dated outcomes with authority, evidence and supersession.
CREATE TABLE IF NOT EXISTS decisions (
  id          TEXT PRIMARY KEY,
  project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_path TEXT,
  title       TEXT NOT NULL,
  status      TEXT NOT NULL,
  authority   TEXT NOT NULL,
  date        TEXT,
  rationale   TEXT,
  consequences TEXT,
  alternatives TEXT,
  supersedes  TEXT,
  evidence    TEXT,
  hash        TEXT,
  valid_from  TEXT,
  valid_to    TEXT,
  recorded_at TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS decisions_status ON decisions(status);
CREATE INDEX IF NOT EXISTS decisions_project ON decisions(project_id);

-- Bounded terminology with lifecycle, aliases and explicit non-equivalences.
CREATE TABLE IF NOT EXISTS canon_terms (
  id          TEXT PRIMARY KEY,
  project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  term        TEXT NOT NULL,
  definition  TEXT,
  status      TEXT NOT NULL,
  owner       TEXT,
  authority   TEXT,
  evidence    TEXT,
  aliases     TEXT,
  contrasts   TEXT,
  lifecycle   TEXT,
  source_path TEXT,
  hash        TEXT,
  valid_from  TEXT,
  valid_to    TEXT,
  recorded_at TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS canon_terms_status ON canon_terms(status);
CREATE INDEX IF NOT EXISTS canon_terms_project ON canon_terms(project_id);

-- Dogfeed: OpenCode 2.2.5 sessions, messages, parts, events, file touches, todos.
CREATE TABLE IF NOT EXISTS sessions (
  id                  TEXT PRIMARY KEY,
  project_id          INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  parent_id           TEXT,
  title               TEXT,
  directory           TEXT,
  agent               TEXT,
  model               TEXT,
  status              TEXT,
  outcome             TEXT,
  cost                REAL,
  tokens_input        INTEGER,
  tokens_output       INTEGER,
  tokens_reasoning    INTEGER,
  tokens_cache_read   INTEGER,
  tokens_cache_write  INTEGER,
  created_at          TEXT,
  updated_at          TEXT,
  ingested_at         TEXT,
  source              TEXT,
  raw_hash            TEXT
);
CREATE INDEX IF NOT EXISTS sessions_project ON sessions(project_id);
CREATE INDEX IF NOT EXISTS sessions_updated ON sessions(updated_at);

CREATE TABLE IF NOT EXISTS session_messages (
  id              TEXT PRIMARY KEY,
  session_id      TEXT NOT NULL,
  role            TEXT,
  type            TEXT,
  seq             INTEGER,
  agent           TEXT,
  model           TEXT,
  cost            REAL,
  tokens_input    INTEGER,
  tokens_output   INTEGER,
  text            TEXT,
  reasoning       TEXT,
  finish          TEXT,
  error           TEXT,
  created_at      TEXT,
  completed_at    TEXT,
  raw_hash        TEXT
);
CREATE INDEX IF NOT EXISTS session_messages_session ON session_messages(session_id, seq);

CREATE TABLE IF NOT EXISTS session_parts (
  id            INTEGER PRIMARY KEY,
  message_id    TEXT NOT NULL,
  session_id    TEXT NOT NULL,
  ordinal       INTEGER,
  type          TEXT,
  tool_name     TEXT,
  tool_state    TEXT,
  input         TEXT,
  output        TEXT,
  file_path     TEXT,
  error         TEXT,
  created_at    TEXT,
  completed_at  TEXT
);
CREATE INDEX IF NOT EXISTS session_parts_message ON session_parts(message_id, ordinal);
CREATE INDEX IF NOT EXISTS session_parts_session ON session_parts(session_id);

CREATE TABLE IF NOT EXISTS session_events (
  id          TEXT PRIMARY KEY,
  session_id  TEXT NOT NULL,
  seq         INTEGER,
  type        TEXT,
  at          TEXT,
  data        TEXT,
  durable     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS session_events_session ON session_events(session_id, seq);

CREATE TABLE IF NOT EXISTS session_files (
  session_id  TEXT NOT NULL,
  path        TEXT NOT NULL,
  action      TEXT NOT NULL,
  message_id  TEXT,
  PRIMARY KEY (session_id, path, action, message_id)
);

CREATE TABLE IF NOT EXISTS session_todos (
  session_id  TEXT NOT NULL,
  id          TEXT,
  content     TEXT,
  status      TEXT,
  priority    TEXT,
  PRIMARY KEY (session_id, id)
);

CREATE VIRTUAL TABLE IF NOT EXISTS session_fts USING fts5(
  session_id,
  kind,
  text,
  tokenize = "unicode61 tokenchars '_-.'",
  prefix = '2 3'
);

CREATE VIRTUAL TABLE IF NOT EXISTS content_fts USING fts5(
  path,
  content,
  project UNINDEXED,
  lang UNINDEXED,
  tokenize = "unicode61 tokenchars '_-.'",
  prefix = '2 3'
);

-- VIVIM feed alignment projection (read-only, rebuilt on every sync).
CREATE TABLE IF NOT EXISTS vivim_records (
  kind       TEXT NOT NULL,   -- goal|phase|capability|task|journey|gap|requirement|route
  id         TEXT NOT NULL,
  project_id INTEGER,
  title      TEXT,
  status     TEXT,            -- record-specific state (decisionState / roadmap status / journey status)
  priority   TEXT,            -- P0|P1|P2|UNTRIAGED or gap priority
  parent     TEXT,            -- capability id, phase id, step id
  links      TEXT,            -- JSON array of related ids
  payload    TEXT NOT NULL,   -- JSON record, canonical key order
  digest     TEXT,            -- sha256 of payload
  synced_at  TEXT NOT NULL,
  PRIMARY KEY (kind, id)
);
CREATE INDEX IF NOT EXISTS vivim_records_kind ON vivim_records(kind, status);
CREATE INDEX IF NOT EXISTS vivim_records_priority ON vivim_records(kind, priority);

-- Semantic kernel registry: versioned stable IDs for types, capabilities,
-- actions, schemas, effects, events and contracts. A registered ID is a
-- vocabulary entry, never an execution grant.
CREATE TABLE IF NOT EXISTS semantic_id (
  id          TEXT PRIMARY KEY,
  kind        TEXT NOT NULL,
  name        TEXT NOT NULL,
  version     TEXT NOT NULL,
  label       TEXT,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'proposed',
  authority   TEXT NOT NULL DEFAULT 'project_observed',
  provenance  TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS semantic_id_kind ON semantic_id(kind, status);

CREATE TABLE IF NOT EXISTS semantic_alias (
  alias     TEXT NOT NULL,
  target_id TEXT NOT NULL,
  kind      TEXT,
  PRIMARY KEY (alias, target_id)
);
CREATE INDEX IF NOT EXISTS semantic_alias_target ON semantic_alias(target_id);

CREATE TABLE IF NOT EXISTS semantic_link (
  id           TEXT PRIMARY KEY,
  semantic_id  TEXT NOT NULL,
  path         TEXT NOT NULL,
  line         INTEGER,
  symbol       TEXT,
  content_hash TEXT,
  kind         TEXT,
  status       TEXT NOT NULL DEFAULT 'current',
  observed_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS semantic_link_semantic ON semantic_link(semantic_id);

-- Bounded wiki program configurations: versioned, reversible, data only.
CREATE TABLE IF NOT EXISTS wiki_program_version (
  id              TEXT NOT NULL,
  version         INTEGER NOT NULL,
  config          TEXT NOT NULL,
  status          TEXT NOT NULL,
  revision        INTEGER NOT NULL,
  owner_confirmed INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL,
  receipt         TEXT,
  PRIMARY KEY (id, version)
);
CREATE INDEX IF NOT EXISTS wiki_program_status ON wiki_program_version(id, status);

${TEST_RESULTS_DDL}
${CAPABILITY_DDL}
`;

export function openDb(dbPath) {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  try {
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA synchronous = NORMAL');
    db.exec('PRAGMA foreign_keys = ON');
    db.exec('PRAGMA busy_timeout = 5000');
    migrate(db);
    return db;
  } catch (error) {
    // A failed open must not leak the handle: the caller never receives the db
    // object, so nothing else can close it, and the file stays locked (EBUSY on
    // Windows) which breaks disposable-index cleanup.
    try { db.close(); } catch { /* handle is already unusable */ }
    throw error;
  }
}

export function openMemoryDb() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  migrate(db);
  return db;
}

function migrate(db) {
  db.exec(DDL);
  // Forward-compatible columns for rebuildable v1 databases.
  const ensureColumn = (table, column, decl) => {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all();
    if (!cols.some((c) => c.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${decl}`);
    }
  };
  ensureColumn('symbols', 'qualified_name', 'TEXT');
  ensureColumn('symbols', 'syntax_digest', 'TEXT');
  ensureColumn('symbols', 'signature_digest', 'TEXT');
  ensureColumn('annotations', 'symbol_qualified_name', 'TEXT');
  ensureColumn('annotations', 'symbol_kind', 'TEXT');
  ensureColumn('documents', 'binds_to', 'TEXT');
  ensureColumn('decisions', 'valid_from', 'TEXT');
  ensureColumn('decisions', 'valid_to', 'TEXT');
  ensureColumn('decisions', 'recorded_at', 'TEXT');
  ensureColumn('canon_terms', 'valid_from', 'TEXT');
  ensureColumn('canon_terms', 'valid_to', 'TEXT');
  ensureColumn('canon_terms', 'recorded_at', 'TEXT');
  const row = db.prepare("SELECT value FROM meta WHERE key = 'schema_version'").get();
  if (!row) {
    db.prepare('INSERT INTO meta(key, value) VALUES (?, ?)').run('schema_version', String(SCHEMA_VERSION));
    db.prepare('INSERT INTO meta(key, value) VALUES (?, ?)').run('created_at', new Date().toISOString());
  } else if (Number(row.value) !== SCHEMA_VERSION) {
    throw new Error(`hq: database schema v${row.value} != expected v${SCHEMA_VERSION}; run "hq index --force" or delete .hq/index.db`);
  }
}

export function transaction(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch { /* already rolled back */ }
    throw error;
  }
}

export function getMeta(db, key, fallback = null) {
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get(key);
  return row ? row.value : fallback;
}

export function setMeta(db, key, value) {
  db.prepare('INSERT INTO meta(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, String(value));
}
