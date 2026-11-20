# File: .coordination/README.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../projects/arbor.md) |
| Path | .coordination/README.md |
| Language | Markdown |
| Kind | doc |
| Size | 2405 B |
| Lines | 28 |
| Hash | 4c4e079d082c |
| Test | no |
| Generated | no |
| Component | .coordination |

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
# .coordination/ — ARBOR joint working folder (oracle-managed)

Owner directive 2026-11-14: a working folder the coordinator (oracle) manages that BOTH workstream lanes access for joint build artifacts and docs. Coordinator infra — not product; roadmap-gate canon does not gate it, but the reuse-first + one-Host canons bind its contents.

## Contract

| Path | Owner | Who writes | Purpose |
|---|---|---|---|
| `README.md` | oracle | oracle only | this contract |
| `pdr/` | oracle | oracle synthesizes; lanes drop INPUT DRAFTS into `pdr/input-roadmap.md` / `pdr/input-demo.md` | PDR sections: lane inputs + oracle synthesis + owner-gated skeleton |
| `artifacts/roadmap/` | arbor-roadmap lane | keeper lane | roadmap-side joint build artifacts (L2 item texts, gate-evidence rules, def hole-prompt revisions) |
| `artifacts/demo/` | arbor-demo lane | demo lane | demo-side joint build artifacts (route/asset inventory, draft-evolution spec, JSONL migration plan) |
| `artifacts/joint/` | shared | both lanes, non-overlapping filenames | artifacts both lanes produce together (schemas, contracts) |
| `status/roadmap.md` | arbor-roadmap lane | keeper lane | one-screen lane status, updated each turn |
| `status/demo.md` | arbor-demo lane | demo lane | one-screen lane status, updated each turn |

## Rules

1. Oracle manages the root and `pdr/`; lanes own their `artifacts/<lane>/` + `status/<lane>.md` subtrees. No lane writes into another lane's subtree.
2. Filenames carry a round/version suffix (`-r2`, `-v2`) — append-only within a round, never overwrite another seat's file.
3. Long artifacts live HERE, not in bus message bodies — the bus carries pointers (path + one-line gist) + decisions + acks.
4. The refinement ledger stays at `.zcode/workflows/arbor-3page-refinement.v1.md` (oracle-owned, facilitator-automated) — this folder hosts the JOINT ARTIFACTS, not the round log.
5. Consensus-first still binds: everything here is consensus input or coordinator infra until the owner gates the decisions. Nothing in this folder is product code; product surfaces come only through oracle ack windows.
6. Anything sensitive (credentials, tokens, personal identifiers) never enters this folder.

## Current round

Round 2 in flight (see ledger). Expected first artifacts: `pdr/input-roadmap.md` (keeper), `pdr/input-demo.md` (demo), both referenced on the bus with their round-2 critiques.
```

---

[HQ wiki](../../../index.md) · [Symbols](../../../symbols.md) · [Dependency graph](../../../graph.md) · [Documentation](../../../docs.md) · [Changes](../../../changes.md) · [Open tasks](../../../todos.md) · [Deprecated](../../../deprecated.md) · [Agent annotation protocol](../../../protocol.md) · [Glossary](../../../glossary.md) · [Using HQ](../../../context.md) · [Capabilities](../../../capabilities.md) · [Search index](../../../search.json) · [Browser view](../../../index.html)
