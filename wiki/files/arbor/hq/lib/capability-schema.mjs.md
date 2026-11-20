# File: hq/lib/capability-schema.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/capability-schema.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7257 B |
| Lines | 197 |
| Hash | 8ab0ab116f72 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CAPABILITY_DDL | const | 4 | yes | export const CAPABILITY_DDL = ` |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/lib/capabilities.mjs](./capabilities.mjs.md) | ./capability-schema.mjs |
| [hq/lib/schema.mjs](./schema.mjs.md) | ./capability-schema.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 198 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
