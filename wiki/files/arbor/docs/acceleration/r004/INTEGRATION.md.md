# File: docs/acceleration/r004/INTEGRATION.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | docs/acceleration/r004/INTEGRATION.md |
| Language | Markdown |
| Kind | doc |
| Size | 2306 B |
| Lines | 18 |
| Hash | e5bf7494e172 |
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
# ARBOR R004 — Keeper G Partial Sprint Status

**R004_PARTIAL_LANES_COMMITTED.** This file is a local handoff, not a canonical keeper acceptance or GitHub merge receipt.

Connected GitHub `main` was read at `6f3fb8509ce6b5814b44de36e687b838462f677f` on 2026-11-15. GitHub Actions run `43739690454` reports startup_failure; no Node24 jobs observed. ARBOR's locally executed full Host and Windows PWA evidence is **UNRUN** in this environment.

Lane D source is committed to `work/arbor-r004-d` at `87c35576f142978a11071737b5815911308901a2`, exactly one ahead of the pinned main with four additive D-owned files. It has authored a fixed-command, read-only local gate and negative tests. **14/14 actual Node22 isolated fixture tests passed**, including real child-process exits and timeouts. Its additive Git patch passed `git apply --check`, clean application and a second Node test pass in a synthetic empty repository. PowerShell, Node24 real Host, Cargo/Bun source closure, physical Chrome/Android, and independent owner acceptance remain **UNRUN**.

Lanes A, B, C and E have **not been run in this environment**. Keeper G has not merged a lane into an integration candidate or touched GitHub `main`; the D source is on its isolated GitHub branch and also in the transferable execution bundle pending local ZCode checkout/inspection. No user data was accessed, no provider effect executed, no release gate changed, no beta acceptance granted.

## Handoff

1. The local ZCode coordinator must pin fresh `origin/main` and inspect any prior R004 worktrees before pulling `origin/work/arbor-r004-d`. The included patch is an offline fallback and must not be applied again to the same branch.
2. Run the D runner unit suite in the real checkout under Node24, commit the reviewed patch on `work/arbor-r004-d`, then execute the focused runner and review receipts.
3. Feed actual failures to A/B/C/E within their R004 exclusive scopes; do not label their work completed merely because R004 has a bundle.
4. Keeper G independently enforces disjoint changed-path ownership, exact commit ancestry, stable main lease, actual combined tests and fail-closed release flags. Keep a candidate branch when evidence is missing.

**Measured acceleration on a subsequent verified task: NOT_YET_MEASURED.**
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
