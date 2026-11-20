# File: docs/acceleration/r004/NEXT-QUEUE.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | docs/acceleration/r004/NEXT-QUEUE.md |
| Language | Markdown |
| Kind | doc |
| Size | 1743 B |
| Lines | 10 |
| Hash | 0673ca8a6463 |
| Test | no |
| Generated | no |
| Component | docs |

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
# R004 execution handoff → next verified frontier

1. **D local:** fetch the D-owned source already committed at `owenservera/ARBOR:work/arbor-r004-d` (`87c35576f142978a11071737b5815911308901a2`) into a clean R004 worktree. Run `node --test integration/scripts/r004-local-gate.test.mjs` under Node24; record exact exit and output. Run `pwsh -NoProfile -File integration/scripts/r004-local-gate.ps1 -Profile focused`. Confirm receipt SHA matches current checkout and every skipped/failing test is explicit. Address actual failures, do not fake green.
2. **A Host:** based on the focused receipts, close actual owner-session, Wiki revision, replay or journal failures within Lane A scope. Interprocess single-writer acceptance remains a distinct requirement.
3. **B Wiki:** cover the three read-only/proposed NL intents using the existing VEC and guarded Host routes. Do not activate A04 before A02 independent acceptance.
4. **E feedback:** demonstrate a real isolated Host failure producing one deterministic, source-pinned, review-only A00 candidate, not a fabricated demo observation.
5. **C context:** test bounded source/revision-scoped RDCB generation and selective invalidation through existing HQKG interfaces, no second graph authority.
6. **G keeper:** inspect five branches, run cross-lane integration test suite, retain a candidate rather than push `main` when any test is UNRUN or blocked, reconcile release ledger contradictions only with independent receipts.

External: GitHub Actions `startup_failure` with zero jobs is unresolved; establish approved Node24 execution independently. Windows MSI, Tailscale paired phone, provider sends, owner data and production effects are outside this sprint's sandbox authority.
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
