# File: contracts/interop/v1/README.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | contracts/interop/v1/README.md |
| Language | Markdown |
| Kind | doc |
| Size | 1342 B |
| Lines | 11 |
| Hash | c91ce2033d8b |
| Test | no |
| Generated | no |
| Component | contracts |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```markdown
# Wave 1F interoperable READ/PROJECTION contract
These files are **pure vocabulary and guards**, not an alternate Host catalog/World, a new scheduler, provider API, or source identity mint. Version 1 mirrors source-backed Host journal states `planned/approved/uncertain/applied/failed` and keeps UI projections inert. A `claimed` event without a receipt projects `uncertain`, never auto-retry or applied.

- `protocol.schema.json`: declarative reference shape, not an authorization policy.
- `types.ts`, `types.rs`: minimal transport mirrors; the Rust mirror is **not wired** until Lane A/G runs `rustc --test contracts/interop/v1/types.rs` and Cargo integration.
- `validate.mjs`: fail-closed read/projection helpers, never approval/execute.
- Host action IDs/risk labels live only in `apps/vivim-host/control/action-catalog.v1.json` once Lane B lands. `tests/compatibility/host-actions.baseline.v1.json` is TEST ONLY.
- HQ semantic IDs remain HQ scoped; personal source refs require owner binding. Neither a UI frame nor a DCB is an effect grant.
- Node 0 event type descriptions are a beta minimum; do not treat these as a complete native InputSnapshot implementation.

See `tests/migration/W01-F-ledger.v1.json` for donor SHA, exact imported files and evidence conditions. No private user data is needed to run these fixtures.
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
