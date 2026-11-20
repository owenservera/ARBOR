# Repos HQ — three-stream graph integration

**Canonical owner:** Repos HQ. **Status:** source implementation; actual Bun/Rust tests pending.

This layer augments the existing 1,582-node / 2,771-edge agentic knowledge
graph projection with the other two parallel research streams without claiming
that any research algorithm or language toolkit is an executable engine.

## Ownership: no parallel cores

- **Source data, scoring, taxonomy and original archives:** 
  [agentic-knowledge-graph](../agentic-knowledge-graph/)
- **30 KGSI research algorithms, 57-node method network:**
  [knowledge-base-network-graph-signal-intelligence](../knowledge-base-network-graph-signal-intelligence/)
- **30 NLP/language resources with distinct compute and reference data facets:**
  [language-enablers-top-30](../knowledge-base-network-graph-signal-intelligence/language-enablers-top-30/)
- **Shared native Rust kernel, hot swap, optional database drivers, lifecycle:**
  [rust-knowledge-graph](../rust-knowledge-graph/)

## Deterministic unified exchange

The exporter reads the **existing** agentic HQKGX1 export and its SHA-256
manifest, then adds research-only graph nodes and typed links for:
30 KGSI definitions, KGSI method taxonomy and 146 method-graph relations,
30 NLE language resources with data/compute facet metadata, agentic algorithm
definitions (already in the original graph), 217 score observations across
10 score families, 4 proposed placements and 3 inert resource-binding examples.

No raw archived instruction text, secrets, executable plugins or personal
datasets are copied. Bridge IDs remain stable SHA-256 identities. The unified crosswalk preserves **all** original-ID mappings and adds one mapping for every augmentation node and edge. Algorithm
definitions, engine generations and proposed placements remain distinct.

Run from Repos HQ root:

```sh
bun research/agentic-knowledge-graph/scripts/export-hqkg.mjs
bun research/graph-kernel-integration/scripts/export-unified-hqkg.mjs --check-only
bun research/graph-kernel-integration/scripts/export-unified-hqkg.mjs
bun test research/graph-kernel-integration/scripts/export-unified-hqkg.test.mjs
cargo test --manifest-path research/rust-knowledge-graph/Cargo.toml
cargo test --manifest-path research/rust-knowledge-graph/Cargo.toml --features importer
cargo run --manifest-path research/rust-knowledge-graph/Cargo.toml --features importer \
  --bin hqkg-import -- research/graph-kernel-integration/runtime/unified.hqj \
  research/graph-kernel-integration/runtime/unified-graph.v1.jsonl
```

All generated data under runtime/ is untracked and rebuildable. The Rust
importer never alters the live Bun/SQLite canonical store.

## Runtime and version protocols

See [CORE-RUNTIME-PROTOCOL.md](CORE-RUNTIME-PROTOCOL.md). The std-only core's
`control` module adds dependency resolution, strict versions, versioned
config CAS, telemetry, health and a guarded read-only execution supervisor.
The existing native `EngineRegistry` remains the sole in-process hot-swap
mechanism; language tools and optional databases integrate as adapters.

### Explicitly not yet implemented

Actual KGSI paper methods, the 30 external NLP libraries, verified model/data
assets, crash-atomic swap+journal transactions, a sandbox for untrusted native
code, an auto-updating dependency installer, and any replacement of the
operational HQ Bun/SQLite engine. These require separate conformance,
permissions, benchmarks and acceptance.


## Core lifecycle and local release gates

- [Core runtime protocol](CORE-RUNTIME-PROTOCOL.md) — versioned dependencies,
  telemetry, doctor, reprogrammable config, bounded safe repair and dev/prod mode.
- [Machine-readable control contract](contracts/core-runtime.v1.json)
- [Inert module dependency example](contracts/module-dependencies.example.v1.json)
- [Dev/prod verification runner](scripts/release-check.mjs) — no deployment.


## Query the integrated graph (read-only)

After exporting and importing the unified HQKGX1 journal, run:

```sh
cargo run --manifest-path research/rust-knowledge-graph/Cargo.toml --bin hqkg-research -- research/graph-kernel-integration/runtime/unified.hqj summary
cargo run --manifest-path research/rust-knowledge-graph/Cargo.toml --bin hqkg-research -- research/graph-kernel-integration/runtime/unified.hqj list_kgsi
cargo run --manifest-path research/rust-knowledge-graph/Cargo.toml --bin hqkg-research -- research/graph-kernel-integration/runtime/unified.hqj resource NLE-008
cargo run --manifest-path research/rust-knowledge-graph/Cargo.toml --bin hqkg-research -- research/graph-kernel-integration/runtime/unified.hqj score_file file:001
```

The adapter is a trusted **metadata reader** only. It does not implement
EdgeMem, Graphiti, SymSpell, any external NLP tool, or an execution owner.
