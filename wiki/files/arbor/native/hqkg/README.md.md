# File: native/hqkg/README.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | native/hqkg/README.md |
| Language | Markdown |
| Kind | doc |
| Size | 18652 B |
| Lines | 315 |
| Hash | 90952f3a39ce |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

````markdown
> **Canonical owner:** [Repos HQ](https://github.com/owenservera/repos-hq/tree/main/research/rust-knowledge-graph). This remains an isolated experiment, not the operational Bun HQ indexer.

# HQKG — Rust knowledge graph with hot-swappable compute and database nodes

A self-contained Rust crate under HQ, intentionally **not coupled to PC HQ runtime state** or other project-specific application logic. This is a portable research/prototype kernel, not an installed host service. Uses only Rust's standard library with default features. It does **not** require SQLite, PostgreSQL, Tokio, serde, network access, or a cloud service just to compile the core.

## Architecture

```text
   Knowledge nodes: Fact / Concept / Document / Dataset / Custom
       | typed, directed, weighted, provenance-bearing edges
       v
   Graph (in-memory BTreeMap, stable IDs, revision counters)
       | BFS / reachability / Dijkstra / topo / PageRank / search
       v
   Journal (append-only full snapshots, checksum, replay, crash-tail recovery)
       |
       +-- EngineSlot nodes ---- active_engine ---> ComputeEngine generation nodes
       |       |  Arc pin (old jobs keep running on old implementation)
       |       +-- CAS hot-swap + interface/capability compatibility
       |       +-- generations linked with "supersedes" history
       |
       +-- Database nodes: SQLite / PostgreSQL
               | references only; never embed credentials in graph
               +-- SQLite adapter (opt-in rusqlite)
               +-- PostgreSQL adapter (opt-in postgres)
```

## Build and test

```sh
cargo test                         # std-only; core needs no external crate
cargo run -- ./graph.hqj init
cargo run -- ./graph.hqj add-node paper:1 document "Original paper"
cargo run -- ./graph.hqj add-node concept:1 concept "Knowledge graph"
cargo run -- ./graph.hqj add-edge relation:1 paper:1 supports concept:1
cargo run -- ./graph.hqj path paper:1 concept:1
cargo run -- ./graph.hqj rank
cargo test --features databases     # downloads/compiles the two optional adapters
```

### Entire SQLite database as a node

```sh
cargo run --features sqlite -- ./graph.hqj db-add db:docs sqlite ./docs.sqlite
cargo run --features sqlite -- ./graph.hqj db-query db:docs 50 "SELECT name FROM sqlite_master"
```

The SQLite connection is opened with READ_ONLY flags; only SELECT/WITH is accepted, and rows are bounded. This is a *reference to the whole database*, not an import of all rows into graph memory. Refer to individual entities with graph edges as desired.

### Entire PostgreSQL database as a node

```sh
export HQKG_PG_DSN='host=localhost dbname=kb user=kb_readonly password=...'
cargo run --features postgres -- ./graph.hqj db-add db:warehouse postgres - HQKG_PG_DSN
cargo run --features postgres -- ./graph.hqj db-query db:warehouse 30 "SELECT tablename FROM pg_catalog.pg_tables"
```

The graph stores the *environment variable name*, not its secret value. PostgreSQL queries run in a READ ONLY transaction, with a 5s server statement timeout and bounded cursor fetch. Provision a **least-privilege read-only PostgreSQL role** in addition to these application guards.

## Built-in executable compute nodes

Both built-ins implement the same `ComputeEngine` interface, so you can swap
or replace implementations while keeping callers bound to logical slots:

- `builtins::GraphCompute`: operations `path`, `neighbors`, `reachable`,
  `topological`, `rank`, `search`, and `stats`. Shares a graph through
  `Arc<RwLock<Graph>>` and never requires external dependencies.
- `builtins::DatabaseCompute`: operations `query`, `catalog`, and `health`.
  SQLite/PostgreSQL use their optional feature-gated database adapters.
  The graph can attach this compute engine node to a database node using a
  `queries_database` relationship; slot identity is `database:<node-id>`.

## Universal algorithm node adapter (30 research engines)

The `algorithm_adapter` module adds a **native**, std-only extension for graph
algorithms. It reuses HQKG's existing `ComputeEngine`, `EngineRegistry`,
`EngineLease`, and `Graph::record_engine_swap`; there is **no parallel
registry, scheduler, or graph writer**.
````

_First 80 of 316 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
