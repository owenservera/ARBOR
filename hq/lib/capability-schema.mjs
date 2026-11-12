// hq/lib/capability-schema.mjs — additive DDL for the capability registry.
// Kept separate so schema.mjs stays readable and the standalone export can
// reuse the exact same statements. No DDL here grants execution authority.
export const CAPABILITY_DDL = `
-- Capability registry: inventory, evidence, taxonomy, mapping and proposed
-- contracts. Candidate rows are observations, never approvals.
CREATE TABLE IF NOT EXISTS capability_source (
  id              TEXT PRIMARY KEY,
  project         TEXT,
  root            TEXT NOT NULL,
  package_manager TEXT,
  lockfile        TEXT,
  package_count   INTEGER NOT NULL DEFAULT 0,
  file_count      INTEGER NOT NULL DEFAULT 0,
  document_count  INTEGER NOT NULL DEFAULT 0,
  bytes           INTEGER NOT NULL DEFAULT 0,
  digest          TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'candidate',
  authority       TEXT NOT NULL DEFAULT 'candidate',
  scanned_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS capability_source_status ON capability_source(status);

-- manifest and lock_entry keep every declared field verbatim; the normalized
-- columns exist only to make the common fields queryable. A field that this
-- schema does not know about still survives in the JSON blob.
CREATE TABLE IF NOT EXISTS capability_package (
  source_id       TEXT NOT NULL,
  name            TEXT NOT NULL,
  version         TEXT NOT NULL,
  install_path    TEXT NOT NULL,
  license         TEXT,
  description     TEXT,
  main            TEXT,
  bin             TEXT,
  keywords        TEXT,
  dep_count       INTEGER NOT NULL DEFAULT 0,
  file_count      INTEGER NOT NULL DEFAULT 0,
  bytes           INTEGER NOT NULL DEFAULT 0,
  integrity       TEXT,
  manifest        TEXT,
  manifest_digest TEXT,
  manifest_fields INTEGER NOT NULL DEFAULT 0,
  lock_entry      TEXT,
  status          TEXT NOT NULL DEFAULT 'candidate',
  authority       TEXT NOT NULL DEFAULT 'candidate',
  PRIMARY KEY (source_id, install_path)
);
CREATE INDEX IF NOT EXISTS capability_package_name ON capability_package(name);
CREATE INDEX IF NOT EXISTS capability_package_license ON capability_package(license);

CREATE TABLE IF NOT EXISTS capability_dependency (
  source_id        TEXT NOT NULL,
  from_path        TEXT NOT NULL,
  to_name          TEXT NOT NULL,
  spec             TEXT,
  resolved_version TEXT,
  kind             TEXT NOT NULL DEFAULT 'runtime',
  PRIMARY KEY (source_id, from_path, to_name, kind)
);
CREATE INDEX IF NOT EXISTS capability_dependency_to ON capability_dependency(to_name);

CREATE TABLE IF NOT EXISTS capability_file (
  source_id    TEXT NOT NULL,
  install_path TEXT NOT NULL,
  path         TEXT NOT NULL,
  kind         TEXT NOT NULL DEFAULT 'code',
  sha256       TEXT NOT NULL,
  bytes        INTEGER NOT NULL DEFAULT 0,
  lines        INTEGER,
  lang         TEXT,
  PRIMARY KEY (source_id, path)
);
CREATE INDEX IF NOT EXISTS capability_file_package ON capability_file(install_path);
CREATE INDEX IF NOT EXISTS capability_file_kind ON capability_file(kind);

-- Every README, license, changelog and docs page, with its full text. This is
-- the documented detail layer: the KB can answer what a package says about
-- itself without executing or installing it.
CREATE TABLE IF NOT EXISTS capability_document (
  id           TEXT PRIMARY KEY,
  source_id    TEXT NOT NULL,
  install_path TEXT,
  path         TEXT NOT NULL,
  kind         TEXT NOT NULL,
  title        TEXT,
  body         TEXT NOT NULL,
  sha256       TEXT NOT NULL,
  bytes        INTEGER NOT NULL DEFAULT 0,
  lines        INTEGER,
  lang         TEXT,
  authority    TEXT NOT NULL DEFAULT 'candidate',
  observed_at  TEXT NOT NULL,
  UNIQUE(source_id, path)
);
CREATE INDEX IF NOT EXISTS capability_document_kind ON capability_document(kind);
CREATE INDEX IF NOT EXISTS capability_document_package ON capability_document(install_path);

CREATE VIRTUAL TABLE IF NOT EXISTS capability_document_fts USING fts5(
  source_id UNINDEXED,
  install_path UNINDEXED,
  path UNINDEXED,
  kind UNINDEXED,
  title,
  body,
  tokenize = "unicode61 tokenchars '_-.'",
  prefix = '2 3'
);

CREATE VIRTUAL TABLE IF NOT EXISTS capability_package_fts USING fts5(
  source_id UNINDEXED,
  install_path UNINDEXED,
  name,
  description,
  keywords,
  manifest,
  tokenize = "unicode61 tokenchars '_-.'",
  prefix = '2 3'
);

CREATE TABLE IF NOT EXISTS capability_evidence (
  id           TEXT PRIMARY KEY,
  source_id    TEXT NOT NULL,
  install_path TEXT,
  kind         TEXT NOT NULL,
  signal       TEXT NOT NULL,
  value        TEXT,
  path         TEXT,
  line         INTEGER,
  weight       REAL NOT NULL DEFAULT 1,
  authority    TEXT NOT NULL DEFAULT 'candidate',
  observed_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS capability_evidence_package ON capability_evidence(install_path);
CREATE INDEX IF NOT EXISTS capability_evidence_kind ON capability_evidence(kind);

CREATE TABLE IF NOT EXISTS capability_node (
  id          TEXT PRIMARY KEY,
  domain      TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  parent_id   TEXT,
  status      TEXT NOT NULL DEFAULT 'current',
  authority   TEXT NOT NULL DEFAULT 'project_observed'
);
CREATE INDEX IF NOT EXISTS capability_node_domain ON capability_node(domain, status);

CREATE TABLE IF NOT EXISTS capability_map (
  source_id    TEXT NOT NULL,
  install_path TEXT NOT NULL,
  node_id      TEXT NOT NULL,
  score        REAL NOT NULL,
  reasons      TEXT,
  status       TEXT NOT NULL DEFAULT 'candidate',
  authority    TEXT NOT NULL DEFAULT 'candidate',
  PRIMARY KEY (source_id, install_path, node_id)
);
CREATE INDEX IF NOT EXISTS capability_map_node ON capability_map(node_id, score);

CREATE TABLE IF NOT EXISTS capability_contract (
  id              TEXT NOT NULL,
  version         INTEGER NOT NULL DEFAULT 1,
  node_id         TEXT NOT NULL,
  source_id       TEXT,
  install_path    TEXT,
  title           TEXT NOT NULL,
  description     TEXT,
  effects         TEXT NOT NULL,
  scopes          TEXT NOT NULL,
  verification    TEXT,
  status          TEXT NOT NULL DEFAULT 'proposed',
  authority       TEXT NOT NULL DEFAULT 'candidate',
  owner_confirmed INTEGER NOT NULL DEFAULT 0,
  proposed_at     TEXT NOT NULL,
  receipt         TEXT,
  PRIMARY KEY (id, version)
);
CREATE INDEX IF NOT EXISTS capability_contract_status ON capability_contract(status, owner_confirmed);

CREATE VIEW IF NOT EXISTS capability_candidates AS
SELECT m.source_id, m.node_id, m.install_path, p.name, p.version, p.license,
       m.score, m.reasons, m.status
FROM capability_map m
JOIN capability_package p
  ON p.source_id = m.source_id AND p.install_path = m.install_path
WHERE m.status = 'candidate';

CREATE VIEW IF NOT EXISTS capability_contracts_open AS
SELECT id, version, node_id, title, effects, scopes, status, authority, owner_confirmed
FROM capability_contract
WHERE status = 'proposed';

CREATE VIEW IF NOT EXISTS capability_license_summary AS
SELECT source_id, license, COUNT(*) AS packages
FROM capability_package
GROUP BY source_id, license;
`;
