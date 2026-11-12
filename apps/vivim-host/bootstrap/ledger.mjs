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
     PRIMARY KEY (id, world_id)
   );
   CREATE TABLE IF NOT EXISTS relationships (
     id TEXT NOT NULL,
     world_id TEXT NOT NULL,
     label TEXT NOT NULL,
     relation TEXT,
     context TEXT,
     confidence REAL NOT NULL,
     sensitive INTEGER NOT NULL DEFAULT 0,
     provenance_id TEXT,
     created_at TEXT NOT NULL,
     PRIMARY KEY (id, world_id)
   );
   CREATE TABLE IF NOT EXISTS contradictions (
     id TEXT NOT NULL,
     world_id TEXT NOT NULL,
     claim_a TEXT NOT NULL,
     claim_b TEXT NOT NULL,
     resolution TEXT NOT NULL,
     note TEXT,
     created_at TEXT NOT NULL,
     PRIMARY KEY (id, world_id)
   );
   CREATE TABLE IF NOT EXISTS preferences (
     id TEXT NOT NULL,
     world_id TEXT NOT NULL,
     key TEXT NOT NULL,
     value TEXT NOT NULL,
     polarity TEXT NOT NULL,
     hard INTEGER NOT NULL DEFAULT 0,
     basis TEXT NOT NULL,
     source TEXT NOT NULL,
     scope TEXT NOT NULL,
     confidence REAL NOT NULL,
     updated_at TEXT NOT NULL,
     PRIMARY KEY (id, world_id)
   );
   CREATE TABLE IF NOT EXISTS passes (
     world_id TEXT NOT NULL,
     pass TEXT NOT NULL,
     status TEXT NOT NULL,
     coverage_json TEXT NOT NULL,
     request_id TEXT,
     updated_at TEXT NOT NULL,
     PRIMARY KEY (world_id, pass)
   );
   CREATE TABLE IF NOT EXISTS jobs (
     id TEXT NOT NULL,
     world_id TEXT NOT NULL,
     pass TEXT NOT NULL,
     status TEXT NOT NULL,
     request_id TEXT,
     attempt INTEGER NOT NULL DEFAULT 1,
     started_at TEXT NOT NULL,
     finished_at TEXT,
     receipt_json TEXT,
     PRIMARY KEY (id, world_id)
   );
   CREATE INDEX IF NOT EXISTS jobs_recent ON jobs (world_id, started_at DESC);
   CREATE TABLE IF NOT EXISTS schema_proposals (
     id TEXT NOT NULL,
     world_id TEXT NOT NULL,
     pass TEXT NOT NULL,
     type TEXT NOT NULL,
     fields_json TEXT NOT NULL,
     reason TEXT,
     consent TEXT NOT NULL,
     created_at TEXT NOT NULL,
     PRIMARY KEY (id, world_id)
   );`,
  // Idempotency receipts: a replayed provider reply returns its original receipt and
  // never creates another theme revision, claim set or job.
  `CREATE TABLE IF NOT EXISTS receipts (
     key TEXT PRIMARY KEY,
     world_id TEXT NOT NULL,
     pass TEXT NOT NULL,
     request_id TEXT NOT NULL,
     generation_id TEXT,
     digest TEXT NOT NULL,
     receipt_json TEXT NOT NULL,
     created_at TEXT NOT NULL
   );
   CREATE INDEX IF NOT EXISTS receipts_request ON receipts (world_id, pass, request_id);`,
  // GUI04: Host-owned committed UI surface revisions. A row is written only from a
  // validated vivim.ui-proposal/1 preview; the proposal itself is never re-executed here.
  `CREATE TABLE IF NOT EXISTS ui_revisions (
     id TEXT PRIMARY KEY,
     world_id TEXT NOT NULL,
     revision INTEGER NOT NULL,
     parent_revision INTEGER,
     change_id TEXT,
     catalog_version INTEGER,
     surface_json TEXT NOT NULL,
     source_json TEXT,
     decision_json TEXT,
     receipt_json TEXT,
     status TEXT NOT NULL DEFAULT 'active',
     created_at TEXT NOT NULL,
     active INTEGER NOT NULL DEFAULT 0,
     UNIQUE (world_id, revision)
   );
   CREATE INDEX IF NOT EXISTS ui_revisions_active ON ui_revisions (world_id, active, revision DESC);`,
  // L3: a source-linked projection in the existing Host SQLite ledger, not a second KB.
  `CREATE TABLE IF NOT EXISTS web_evidence (
    id TEXT NOT NULL, world_id TEXT NOT NULL, event_id TEXT NOT NULL,
    installation_id TEXT NOT NULL, site TEXT NOT NULL, safe_url TEXT NOT NULL,
    observed_at TEXT NOT NULL, source_ref TEXT NOT NULL, source_kind TEXT NOT NULL,
    digest TEXT NOT NULL, verified INTEGER NOT NULL DEFAULT 0,
    reduced INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (id, world_id)
   );
   CREATE INDEX IF NOT EXISTS web_evidence_recent ON web_evidence (world_id, observed_at DESC, id DESC);
   CREATE INDEX IF NOT EXISTS web_evidence_site ON web_evidence (world_id, site, observed_at DESC);
   CREATE TABLE IF NOT EXISTS web_retractions (
    world_id TEXT NOT NULL, id TEXT NOT NULL, retracted_at TEXT NOT NULL,
    PRIMARY KEY (world_id, id)
   );
   CREATE TABLE IF NOT EXISTS web_projection_status (
    world_id TEXT PRIMARY KEY, source_kind TEXT NOT NULL,
    refresh_at TEXT NOT NULL, cursor TEXT, coverage TEXT NOT NULL
   );`
];

function fail(reason) { throw new TypeError('Bootstrap ledger: ' + reason); }

export function openLedger({ file = ':memory:' } = {}) {
  if (typeof file !== 'string' || !file) fail('file path required');
  if (file !== ':memory:') mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });

  let DatabaseSync;
  try {
    ({ DatabaseSync } = createRequire(import.meta.url)('node:sqlite'));
  } catch {
    const error = new Error('Bootstrap ledger: node:sqlite is unavailable on this Node runtime (requires Node >= 22.5)');
    error.code = 'LEDGER_UNAVAILABLE';
    throw error;
  }

  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 4000');
  const version = Number(db.prepare('PRAGMA user_version').get().user_version);
  if (version < MIGRATIONS.length) {
    db.exec('BEGIN IMMEDIATE');
    try {
      for (let i = version; i < MIGRATIONS.length; i++) db.exec(MIGRATIONS[i]);
      db.exec(`PRAGMA user_version = ${MIGRATIONS.length}`);
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  }

  const run = (sql, ...args) => db.prepare(sql).run(...args);
  const all = (sql, ...args) => db.prepare(sql).all(...args);
  const one = (sql, ...args) => db.prepare(sql).get(...args) ?? null;

  const meta = {
    get: key => one('SELECT value FROM meta WHERE key = ?', String(key))?.value ?? null,
    set: (key, value) => run('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', String(key), String(value))
  };

  function transaction(fn) {
    db.exec('BEGIN IMMEDIATE');
    try { const out = fn(); db.exec('COMMIT'); return out; }
    catch (error) { db.exec('ROLLBACK'); throw error; }
  }

  const provenance = {
    put(p) {
      run(`INSERT INTO provenance (id, kind, request_id, generation_id, provider, thread_ref, observed_at, digest, basis)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET observed_at = excluded.observed_at, digest = excluded.digest`,
        p.id, p.kind, p.requestId ?? null, p.generationId ?? null, p.provider ?? 'chatgpt', p.threadRef ?? null, p.observedAt, p.digest ?? null, p.basis ?? null);
      return p.id;
    },
    get: id => one('SELECT * FROM provenance WHERE id = ?', id),
    count: () => Number(one('SELECT COUNT(*) AS n FROM provenance').n)
  };

  const themes = {
    insert(t) {
      run(`INSERT INTO themes (id, world_id, revision, status, source_kind, source_ref, palette_json, appearance, mood, texture, motion, density, render_json, request_id, provenance_id, created_at, active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        t.id, t.worldId, t.revision, t.status, t.sourceKind, t.sourceRef, JSON.stringify(t.palette),
        t.appearance, t.mood, t.texture, t.motion, t.density, JSON.stringify(t.render),
        t.requestId ?? null, t.provenanceId ?? null, t.createdAt, t.active ? 1 : 0);
      return t;
    },
    nextRevision(worldId) { return Number(one('SELECT COALESCE(MAX(revision), -1) + 1 AS n FROM themes WHERE world_id = ?', worldId).n); },
    byRevision(worldId, revision) { return one('SELECT * FROM themes WHERE world_id = ? AND revision = ?', worldId, revision); },
    active(worldId) { return one('SELECT * FROM themes WHERE world_id = ? AND active = 1 ORDER BY revision DESC LIMIT 1', worldId); },
    list(worldId, limit = 20) { return all('SELECT * FROM themes WHERE world_id = ? ORDER BY revision DESC LIMIT ?', worldId, limit); },
    activate(id) {
      const row = one('SELECT world_id FROM themes WHERE id = ?', id);
      if (!row) fail('unknown theme revision');
      run('UPDATE themes SET active = 0 WHERE world_id = ?', row.world_id);
      run('UPDATE themes SET active = 1 WHERE id = ?', id);
    },
    deactivateAll(worldId) { run('UPDATE themes SET active = 0 WHERE world_id = ?', worldId); },
    setStatus(id, status) { run('UPDATE themes SET status = ? WHERE id = ?', status, id); }
  };

  const claims = {
    upsert(c) {
      run(`INSERT INTO claims (id, world_id, pass, section, label, kind, freshness, basis, status, confidence, scope, statement, preference_json, provenance_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id, world_id) DO UPDATE SET
             status = CASE WHEN claims.status = 'owner-confirmed' THEN claims.status ELSE excluded.status END,
             confidence = CASE WHEN claims.status = 'owner-confirmed' THEN claims.confidence ELSE MAX(claims.confidence, excluded.confidence) END,
             statement = CASE WHEN claims.status = 'owner-confirmed' THEN claims.statement ELSE excluded.statement END,
             basis = CASE WHEN claims.status = 'owner-confirmed' THEN claims.basis ELSE excluded.basis END,
             preference_json = CASE WHEN claims.status = 'owner-confirmed' THEN claims.preference_json ELSE COALESCE(excluded.preference_json, claims.preference_json) END,
             provenance_id = CASE WHEN claims.status = 'owner-confirmed' THEN claims.provenance_id ELSE excluded.provenance_id END,
             updated_at = CASE WHEN claims.status = 'owner-confirmed' THEN claims.updated_at ELSE excluded.updated_at END`,
        c.id, c.worldId, c.pass, c.section, c.label, c.kind ?? null, c.freshness ?? null, c.basis, c.status,
        c.confidence, c.scope ?? null, c.statement, c.preference ? JSON.stringify(c.preference) : null,
        c.provenanceId ?? null, c.createdAt, c.updatedAt);
      return c.id;
    },
    list(worldId, { section = null, limit = 200 } = {}) {
      return section
        ? all('SELECT * FROM claims WHERE world_id = ? AND section = ? ORDER BY confidence DESC, updated_at DESC LIMIT ?', worldId, section, limit)
        : all('SELECT * FROM claims WHERE world_id = ? ORDER BY confidence DESC, updated_at DESC LIMIT ?', worldId, limit);
    },
    confirm(id, worldId) { run("UPDATE claims SET status = 'owner-confirmed', confidence = 1, updated_at = ? WHERE id = ? AND world_id = ?", new Date().toISOString(), id, worldId); },
    count(worldId) { return Number(one('SELECT COUNT(*) AS n FROM claims WHERE world_id = ?', worldId).n); }
  };

  const observations = {
    put(o) {
      run(`INSERT INTO observations (id, world_id, pass, category, body, confidence, sensitive, provenance_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id, world_id) DO UPDATE SET body = excluded.body, confidence = excluded.confidence`,
        o.id, o.worldId, o.pass, o.category, o.text, o.confidence, o.sensitive ? 1 : 0, o.provenanceId ?? null, o.createdAt);
      return o.id;
    },
    list(worldId, { pass = null, limit = 100 } = {}) {
      return pass
        ? all('SELECT * FROM observations WHERE world_id = ? AND pass = ? ORDER BY created_at DESC LIMIT ?', worldId, pass, limit)
        : all('SELECT * FROM observations WHERE world_id = ? ORDER BY created_at DESC LIMIT ?', worldId, limit);
    },
    count: worldId => Number(one('SELECT COUNT(*) AS n FROM observations WHERE world_id = ?', worldId).n)
  };

  const relationships = {
    put(r) {
      run(`INSERT INTO relationships (id, world_id, label, relation, context, confidence, sensitive, provenance_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id, world_id) DO UPDATE SET relation = excluded.relation, context = excluded.context`,
        r.id, r.worldId, r.label, r.relation ?? null, r.context ?? null, r.confidence, r.sensitive ? 1 : 0, r.provenanceId ?? null, r.createdAt);
    },
    count: worldId => Number(one('SELECT COUNT(*) AS n FROM relationships WHERE world_id = ?', worldId).n)
  };

  const contradictions = {
    put(c) {
      run(`INSERT INTO contradictions (id, world_id, claim_a, claim_b, resolution, note, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id, world_id) DO UPDATE SET resolution = excluded.resolution, note = excluded.note`,
        c.id, c.worldId, c.claimA, c.claimB, c.resolution, c.note ?? null, c.createdAt);
    },
    list: worldId => all('SELECT * FROM contradictions WHERE world_id = ? ORDER BY created_at DESC LIMIT 50', worldId)
  };

  const preferences = {
    upsert(p) {
      run(`INSERT INTO preferences (id, world_id, key, value, polarity, hard, basis, source, scope, confidence, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id, world_id) DO UPDATE SET
             value = CASE WHEN preferences.source = 'owner' THEN preferences.value ELSE excluded.value END,
             polarity = CASE WHEN preferences.source = 'owner' THEN preferences.polarity ELSE excluded.polarity END,
             hard = CASE WHEN preferences.source = 'owner' THEN preferences.hard ELSE excluded.hard END,
             basis = CASE WHEN preferences.source = 'owner' THEN preferences.basis ELSE excluded.basis END,
             source = CASE WHEN preferences.source = 'owner' THEN preferences.source ELSE excluded.source END,
             scope = CASE WHEN preferences.source = 'owner' THEN preferences.scope ELSE excluded.scope END,
             confidence = CASE WHEN preferences.source = 'owner' THEN preferences.confidence ELSE MAX(preferences.confidence, excluded.confidence) END,
             updated_at = CASE WHEN preferences.source = 'owner' THEN preferences.updated_at ELSE excluded.updated_at END`,
        p.id, p.worldId, p.key, p.value, p.polarity, p.hard ? 1 : 0, p.basis, p.source, p.scope, p.confidence, p.updatedAt);
      return p.id;
    },
    list: worldId => all('SELECT * FROM preferences WHERE world_id = ? ORDER BY hard DESC, confidence DESC LIMIT 100', worldId),
    get: (id, worldId) => one('SELECT * FROM preferences WHERE id = ? AND world_id = ?', id, worldId),
    remove(id, worldId) { return run('DELETE FROM preferences WHERE id = ? AND world_id = ?', id, worldId).changes > 0; }
  };

  const passes = {
    set(state) {
      run(`INSERT INTO passes (world_id, pass, status, coverage_json, request_id, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(world_id, pass) DO UPDATE SET status = excluded.status, coverage_json = excluded.coverage_json,
             request_id = COALESCE(excluded.request_id, passes.request_id), updated_at = excluded.updated_at`,
        state.worldId, state.pass, state.status, JSON.stringify(state.coverage ?? { areas: [] }), state.requestId ?? null, state.updatedAt);
    },
    get(worldId, pass) { return one('SELECT * FROM passes WHERE world_id = ? AND pass = ?', worldId, pass); },
    list: worldId => all('SELECT * FROM passes WHERE world_id = ? ORDER BY pass', worldId)
  };

  const jobs = {
    start(job) {
      run(`INSERT INTO jobs (id, world_id, pass, status, request_id, attempt, started_at, finished_at, receipt_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL)
           ON CONFLICT(id, world_id) DO NOTHING`,
        job.id, job.worldId, job.pass, job.status, job.requestId ?? null, job.attempt ?? 1, job.startedAt);
      return one('SELECT * FROM jobs WHERE id = ? AND world_id = ?', job.id, job.worldId);
    },
    finish(id, worldId, { status, receipt = null, finishedAt }) {
      run('UPDATE jobs SET status = ?, finished_at = ?, receipt_json = ? WHERE id = ? AND world_id = ?',
        status, finishedAt, receipt ? JSON.stringify(receipt) : null, id, worldId);
    },
    list: (worldId, limit = 25) => all('SELECT * FROM jobs WHERE world_id = ? ORDER BY started_at DESC LIMIT ?', worldId, limit),
    get: (id, worldId) => one('SELECT * FROM jobs WHERE id = ? AND world_id = ?', id, worldId)
  };

  const schemaProposals = {
    put(p) {
      run(`INSERT INTO schema_proposals (id, world_id, pass, type, fields_json, reason, consent, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id, world_id) DO UPDATE SET fields_json = excluded.fields_json, reason = excluded.reason`,
        p.id, p.worldId, p.pass, p.type, JSON.stringify(p.fields), p.reason ?? null, p.consent ?? 'required', p.createdAt);
    },
    list: worldId => all('SELECT * FROM schema_proposals WHERE world_id = ? ORDER BY created_at DESC LIMIT 20', worldId)
  };

  const uiRevisions = {
    insert(r) {
      run(`INSERT INTO ui_revisions (id, world_id, revision, parent_revision, change_id, catalog_version, surface_json, source_json, decision_json, receipt_json, status, created_at, active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        r.id, r.worldId, r.revision, r.parentRevision ?? null, r.changeId ?? null, r.catalogVersion ?? null,
        JSON.stringify(r.surface), JSON.stringify(r.source ?? null), JSON.stringify(r.decision ?? null),
        r.receipt ? JSON.stringify(r.receipt) : null, r.status ?? 'active', r.createdAt, r.active ? 1 : 0);
      return r;
    },
    nextRevision(worldId) { return Number(one('SELECT COALESCE(MAX(revision), -1) + 1 AS n FROM ui_revisions WHERE world_id = ?', worldId).n); },
    active(worldId) { return one('SELECT * FROM ui_revisions WHERE world_id = ? AND active = 1 ORDER BY revision DESC LIMIT 1', worldId); },
    byRevision(worldId, revision) { return one('SELECT * FROM ui_revisions WHERE world_id = ? AND revision = ?', worldId, revision); },
    list(worldId, limit = 20) { return all('SELECT * FROM ui_revisions WHERE world_id = ? ORDER BY revision DESC LIMIT ?', worldId, limit); },
    activate(id) {
      const row = one('SELECT world_id FROM ui_revisions WHERE id = ?', id);
      if (!row) fail('unknown ui revision');
      run('UPDATE ui_revisions SET active = 0 WHERE world_id = ?', row.world_id);
      run('UPDATE ui_revisions SET active = 1 WHERE id = ?', id);
    },
    deactivateAll(worldId) { run('UPDATE ui_revisions SET active = 0 WHERE world_id = ?', worldId); },
    setStatus(id, status) { run('UPDATE ui_revisions SET status = ? WHERE id = ?', status, id); }
  };

  const receipts = {
    get(key) { return one('SELECT * FROM receipts WHERE key = ?', String(key)); },
    put(r) {
      run(`INSERT INTO receipts (key, world_id, pass, request_id, generation_id, digest, receipt_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(key) DO NOTHING`,
        r.key, r.worldId, r.pass, r.requestId, r.generationId ?? null, r.digest, JSON.stringify(r.receipt), r.createdAt);
      return r.key;
    },
    count: worldId => Number(one('SELECT COUNT(*) AS n FROM receipts WHERE world_id = ?', worldId).n)
  };

  // Private projections may write only through this ledger's single Host transaction.
  const webVisits = {
    put(row) {
      if (one('SELECT id FROM web_retractions WHERE world_id = ? AND id = ?', row.worldId, row.id)) return 'retracted';
      const prior = one('SELECT digest FROM web_evidence WHERE world_id = ? AND id = ?', row.worldId, row.id);
      if (prior) {
        if (prior.digest !== row.digest) throw Object.assign(new Error('Web event ID conflicts with existing evidence'), { code: 'WEB_EVIDENCE_CONFLICT' });
        return 'duplicate';
      }
      run(`INSERT INTO web_evidence (id, world_id, event_id, installation_id, site, safe_url, observed_at,
          source_ref, source_kind, digest, verified, reduced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        row.id, row.worldId, row.eventId, row.installationId, row.site, row.url, row.observedAt,
        row.sourceRef, row.sourceKind, row.digest, row.verified ? 1 : 0, row.reduced ? 1 : 0);
      return 'inserted';
    },
    retract(worldId, ids, at) {
      for (const id of ids) {
        run('INSERT INTO web_retractions (world_id, id, retracted_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING', worldId, id, at);
        run('DELETE FROM web_evidence WHERE world_id = ? AND id = ?', worldId, id);
      }
    },
    status(worldId) { return one('SELECT * FROM web_projection_status WHERE world_id = ?', worldId); },
    mark(worldId, sourceKind, refreshAt, cursor, coverage) {
      run(`INSERT INTO web_projection_status (world_id, source_kind, refresh_at, cursor, coverage)
         VALUES (?, ?, ?, ?, ?) ON CONFLICT(world_id) DO UPDATE SET source_kind=excluded.source_kind,
         refresh_at=excluded.refresh_at, cursor=excluded.cursor, coverage=excluded.coverage`,
        worldId, sourceKind, refreshAt, cursor, coverage);
    },
    list(worldId, { since, before, site = null, limit = 30, cursorAt = null, cursorId = null } = {}) {
      return all(`SELECT id, event_id, installation_id, site, safe_url, observed_at, source_ref,
        source_kind, verified, reduced FROM web_evidence WHERE world_id = ?
        AND observed_at >= ? AND observed_at < ?
        AND (? IS NULL OR site = ?)
        AND (? IS NULL OR observed_at < ? OR (observed_at = ? AND id < ?))
        ORDER BY observed_at DESC, id DESC LIMIT ?`,
        worldId, since, before, site, site, cursorAt, cursorAt, cursorAt, cursorId, limit);
    },
    select(worldId, ids) {
      if (!ids.length) return [];
      return all(`SELECT id, site, safe_url, observed_at, source_ref, source_kind, verified
        FROM web_evidence WHERE world_id = ? AND id IN (${ids.map(() => '?').join(',')})`, worldId, ...ids);
    }
  };

  meta.set('schema', LEDGER_SCHEMA);
  return {
    schema: LEDGER_SCHEMA, file, meta, transaction,
    provenance, themes, claims, observations, relationships, contradictions, preferences, passes, jobs, schemaProposals, receipts, uiRevisions, webVisits,
    stats(worldId) {
      return {
        observations: observations.count(worldId), claims: claims.count(worldId),
        relationships: relationships.count(worldId), contradictions: contradictions.list(worldId).length,
        themes: themes.list(worldId, 100).length, preferences: preferences.list(worldId).length,
        passes: passes.list(worldId).length, jobs: jobs.list(worldId, 100).length,
        uiRevisions: uiRevisions.list(worldId, 100).length
      };
    },
    close() { try { db.close(); } catch { /* already closed */ } }
  };
}
