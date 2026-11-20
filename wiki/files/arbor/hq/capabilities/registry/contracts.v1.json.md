# File: hq/capabilities/registry/contracts.v1.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/capabilities/registry/contracts.v1.json |
| Language | JSON |
| Kind | config |
| Size | 9410 B |
| Lines | 215 |
| Hash | 07fc712beb1d |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```json
{
  "schema": "hq.capability-contracts/1",
  "version": 1,
  "description": "Proposed, typed action contracts derived from candidate capabilities. Every contract starts proposed and unapproved; none may execute until the owner confirms it and a native HQ implementation passes its verification.",
  "contracts": [
    {
      "id": "cap.discovery.glob",
      "version": 1,
      "nodeId": "discovery.glob",
      "title": "Match paths with a glob pattern",
      "description": "Return the bounded set of paths under an approved root that match one glob pattern.",
      "effects": ["fs:read"],
      "scopes": ["workspace:read"],
      "verification": "Fixture with three files: pattern *.js returns exactly the expected set, sorted; no writes and no spawn.",
      "status": "proposed",
      "authority": "candidate",
      "ownerConfirmed": false
    },
    {
      "id": "cap.discovery.walk",
      "version": 1,
      "nodeId": "discovery.walk",
      "title": "Enumerate a directory tree",
      "description": "Return sorted relative paths under an approved root with explicit ignore rules and a hard file cap.",
      "effects": ["fs:read"],
      "scopes": ["workspace:read"],
      "verification": "Fixture tree returns the exact sorted path list; a symlink loop does not recurse; the file cap is reported.",
      "status": "proposed",
      "authority": "candidate",
      "ownerConfirmed": false
    },
    {
      "id": "cap.discovery.resolve",
      "version": 1,
      "nodeId": "discovery.resolve",
      "title": "Resolve a path or module",
      "description": "Resolve one path or module name to an absolute location, or return a typed not-found result.",
      "effects": ["fs:read"],
      "scopes": ["workspace:read"],
      "verification": "Known and missing fixtures both return typed results; resolution never spawns a process or touches the network.",
      "status": "proposed",
      "authority": "candidate",
      "ownerConfirmed": false
    },
    {
      "id": "cap.discovery.frontmatter",
      "version": 1,
      "nodeId": "discovery.frontmatter",
      "title": "Split front matter from a document",
      "description": "Parse structured front matter and return data plus body without evaluating the body.",
      "effects": [],
      "scopes": [],
      "verification": "Valid fixture yields data and body; invalid YAML returns a diagnostic rather than throwing an untyped error.",
      "status": "proposed",
      "authority": "candidate",
      "ownerConfirmed": false
    },
    {
      "id": "cap.config.argv",
      "version": 1,
      "nodeId": "configuration.argv",
      "title": "Parse argv into typed options",
      "description": "Parse a bounded argv array with declared flags, aliases and defaults.",
      "effects": [],
      "scopes": [],
      "verification": "Fixture argv yields defaults, aliases and unknown-flag diagnostics; environment variables are not mutated.",
      "status": "proposed",
      "authority": "candidate",
      "ownerConfirmed": false
    },
    {
      "id": "cap.config.schema",
      "version": 1,
      "nodeId": "configuration.schema",
      "title": "Normalize an object against a schema",
      "description": "Apply declared normalizers and validators to a plain object and return a canonical object.",
      "effects": [],
      "scopes": [],
      "verification": "Fixture object normalizes deterministically; an invalid value returns a typed field error; a second pass is idempotent.",
      "status": "proposed",
```

_First 80 of 216 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
