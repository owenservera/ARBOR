# File: studio/architecture/README.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/architecture/README.md |
| Language | Markdown |
| Kind | doc |
| Size | 1100 B |
| Lines | 14 |
| Hash | 12b08edf5830 |
| Test | no |
| Generated | no |
| Component | studio |

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
# VIVIM Harness Architecture Atlas

`components.json` declares ten stable logical architecture-stage identities and the code paths they own. Several stages legitimately share source files; stage counts **are not additive**.

Use `node scripts/architecture-inventory.mjs --json` for current, filesystem-derived counts and path coverage. Use `--check` in CI to ensure source paths remain owned by at least one stage. `atlas.html` is an offline interactive visualization and an initial source-footprint snapshot.

Maturity labels describe current evidence quality, not invented progress percentages:
- source-backed: implementation exists
- integrated-offline: source and synthetic/unit integration evidence
- live-partial: some genuine browser observations, not all acceptance gates
- integration-pending-live: source present; real provider full-loop proof pending
- live-accepted: only after dated reproducible runtime evidence

All new provenance and maturity claims must link to a real test/receipt and commit. The initial imported snapshot did not independently rerun the unit suite.
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
