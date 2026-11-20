# HQKG operational kernel — contract v1

**Canonical owner:** Repos HQ · **Control protocol:** hqkg.control-contract/1
**Status:** complete initial source implementation; no production activation.
This is the cross-workstream runtime seam for the 217-file agentic graph, 30 KGSI
algorithm definitions and 30 NLE language resources. The three research
catalogs stay data-only until explicitly verified/installed as trusted adapters.

## 1. What belongs inside the core

The dependency-free Rust graph provides identity, versioned edges, adjacency
indexes, graph traversal, persistent journal, CAS engine generations, pinned
engine leases, deterministic version checks, dependency DAG planning, config
CAS revisions, bounded telemetry, readiness/health, quarantine and
verified local-tail repair.

**Adapters own** parsing/lexicons/corpus/model weights, external database
protocols, language-specific algorithms, metadata extraction, SQLite FTS,
embedding/vector storage, dataset hash verification, server monitoring and
external API/OS execution. Do not introduce a second engine registry,
scheduler, knowledge authority, taxonomy owner or provider action controller.

The optional HQKGX1 importer is already an adapter (serde_json + sha2, disabled
by default). SQLite and PostgreSQL remain optional. The unified exporter
merges research data **before** it reaches Rust; no new runtime format is
necessary.

## 2. Typed dependency protocol

`Version` parses strict numeric `major.minor.patch` only; `VersionRange` is
`[min_inclusive, max_exclusive)`. There is no ambiguous fallback on invalid
versions or unknown major protocols.

`Resource` = {id, kind, version, ready, sha256?, generation?}.
`Dependency` = {id, kind, version range, required, expected_sha256?, after[]}.
Kinds: Engine / Database / Dataset / Capability / Schema / Other.

`resolve_dependencies` validates unique IDs, graph ordering and cycles,
presence, readiness, kind, version, exact digest requirements, production
pins, and optional omissions. It yields a deterministic plan with ordering
and resource pins. It **does not install, download, activate or authorize
anything**.

Production requires a valid 64-byte lowercase hexadecimal SHA-256 for
Dataset/Schema and a concrete generation for Engine. This Rust core checks
digest *claims* and their match; a trusted asset adapter must hash actual
bytes and hold an immutable handle for the entire lease. A live, mutable
SQLite/PostgreSQL connection is **not** an immutable content snapshot.

An engine lease pins its code generation; a separately versioned corpus
must also be held immutably by the adapter. Replacing data should install a
new engine generation using the existing CAS hot-swap registry. Old leases
remain pinned to the old verified bytes. A graph edge alone is **not**
a runtime data pin.

The machine-readable [contract](contracts/core-runtime.v1.json)
and [inert module example](contracts/module-dependencies.example.v1.json)
are reference schemas, not executable registration files.

## 3. Core telemetry

`Telemetry` holds up to 2,048 events by default (configurable 16–100,000).
It records sequence, bounded slot/operation identifier, outcome,
elapsed_ms, pinned engine generation and config revision, with bounded
p50/p95/max/failed-count rollups and dropped-event accounting.

Preflight dependency/policy failures produce `Rejected` events, and actual
engine failures produce `Failed`. Raw request strings, output payloads,
session content, tokens, SQL text, credentials and error details never
enter the core event schema. Label characters are restricted to ASCII
identifier punctuation to reduce accidental personal-text leakage.

`Telemetry::export_tsv` produces a std-only, versioned, redacted local
snapshot (not a live daemon or cloud exporter). Persistent SQLite/JSONL
telemetry and OTel compatibility are future optional adapters. Report
tail-window percentiles as **window-limited**, not full historical SLAs.

Minimum performance baselines: count, p50, p95, max, memory peak,
journal bytes, import no-op ratio, graph path correctness, dataset digest
coverage, engine generation churn, quarantine rate and healing receipts.

## 4. Health and bounded self-healing

`HealthMonitor` states: Ready -> Degraded -> Quarantined (default three
consecutive failures). A quarantined engine cannot execute until an
independent, successful operator readiness probe is reported. Config
validation, dependency pins, production acceptance, available engine
generation and quarantine are prerequisites for `readiness`.

`HealingController` can invoke explicitly registered trusted
`RepairAdapter` implementations **only** for `EphemeralCache`, with
at most two unattended attempts per slot. Repairs must be idempotent and
bounded; the controller independently probes success and records receipts.
The original failed operation is **never** automatically retried, so a
slow/corrupt operation cannot accidentally repeat a send or write.
Derived-file rebuild, external service restart, SQL mutation, journal trim,
browser/provider state and privilege changes require a separate approved
host/operator repair path.

The journal `status` reports a verified prefix and untrusted trailing
bytes. The `repair_torn_tail` operation requires an expected epoch, the
single-writer lock and explicit `--apply`. It only truncates the *unverified
suffix*, never a valid committed frame. A fully corrupt journal or stale
lock fails closed.

Engine install, graph lineage and journal save are **not** one crash-atomic
transaction. A future supervisor adapter must reconcile installed
generations with durable lineage before exposing them as ready after
restart. The synchronous scheduler cannot preempt hung native code;
untrusted or long-running execution requires an isolated worker process.

## 5. Core configuration and reprogrammability

`CoreConfig::default` uses Production, no experimental algorithms,
pinned-data requirement, 30-second call budget, 4 MiB output limit,
2,048 telemetry samples and three failures before quarantine.
Development allows selected experiments via a *separate explicit config
change*. Production cannot enable experiments or disable pinned data.

Typed `ConfigPatch` requires expected revision (CAS), bounds checking
and an explicit proposal/application action. No-op patches do not bump
revision. Immutable `config:core:N` nodes preserve history in the same
graph journal, with a one-snapshot update. The newest valid snapshot
can restore core config on restart.

This is the same deterministic action contract that a future NL or GUI
layer must call. A language model may interpret a desired change, but
cannot bypass preview/CAS, source governance or Host permissions.

Operator commands from Repos HQ root:

```sh
cargo run --manifest-path research/rust-knowledge-graph/Cargo.toml --bin hqkg-control -- runtime/graph.hqj doctor
cargo run --manifest-path research/rust-knowledge-graph/Cargo.toml --bin hqkg-control -- runtime/graph.hqj config show
cargo run --manifest-path research/rust-knowledge-graph/Cargo.toml --bin hqkg-control -- runtime/graph.hqj config propose 1 mode=development
cargo run --manifest-path research/rust-knowledge-graph/Cargo.toml --bin hqkg-control -- runtime/graph.hqj config apply 1 mode=development --apply
```

The doctor never executes source documents or provider actions.

## 6. Versioning model

- Rust crate: `Cargo.toml` SemVer (currently 0.1.0)
- Graph import: `repos-hq.hqkg-exchange/1` and full SHA-256 payload
- Control-plane contract: `hqkg.control-contract/1` (fail unknown major)
- Engine interface: `EngineDescriptor.interface`, generation CAS and
  capability-superset replacement
- Dataset version: content-addressed SHA-256 + semantic version, source,
  license/sensitivity and signed-off immutable asset verification
- Canonical source: original archive SHA, crosswalk and evidence IDs
- Config: CAS revision, immutable graph snapshot
- Journal: graph epoch, not global multi-writer consistency
- Deployment: dev vs release build, independent of effective runtime mode

Do not conflate an algorithm definition with engine implementation, engine
generation with data revision, research placement with execution authority,
or release compilation with production approval.

## 7. Dev/prod release matrix

| Lane | Dev mode | Production mode |
| --- | --- | --- |
| Build | Cargo debug + source tests | Cargo release + optional driver conformance |
| Research definitions | Inert; trusted experiments opt-in | Inert until explicit validation |
| Assets | Nonproduction unverified prototype allowed | Verified immutable digest required |
| Dep failures | Required missing fails; optional omitted | Same plus strict pin readiness |
| Telemetry | Local bounded ring and TSV | Same, with redaction and retention review |
| Repair | Only trusted ephemeral in-memory cache | Same; never auto-mutate external state |
| Config | CAS patch and immutable history | CAS with stricter policy |
| Rollout | Side-by-side with live Bun HQ | G1–G6 parity/acceptance before cutover |

A **production release** must have the full tested build, reviewed Cargo.lock,
the effective Production config, healthy dependencies, and an explicit owner
acceptance receipt. The release verifier does not deploy anything.

```sh
bun research/graph-kernel-integration/scripts/release-check.mjs --dev
bun research/graph-kernel-integration/scripts/release-check.mjs --prod
```

Receipt format is `hqkg.release-verification/1`, written to ignored
`research/graph-kernel-integration/runtime/`. The production command
**intentionally fails** without a reviewed Cargo.lock.

## 8. Verified vs outstanding gates

Confirmed by GitHub source checks: ownership on Repos HQ main, the original
agentic 1,582/2,771 graph, the three source catalogs, and deterministic
structural graph assembly 1,930 nodes/3,496 edges/5,426 crosswalk records
using an emulated Node runtime. The original-to-target Rust source migration
was Git blob-verified.

**Not executed here:** native Bun source tests, Rust cargo build/tests, actual
SHA-256 end-to-end export (emulation used test hashing), optional live SQLite/
PostgreSQL adapter tests, side-by-side traversal parity, fault injection,
cold-start/restart recovery, 1k/10k/100k benchmarks, asset byte-pinning,
production deployment. No claim of SOTA production readiness until these pass.

## Optional machine-readable dependency manifest adapter

The `importer` Cargo feature now also enables `adapters::dependency_manifest`,
which validates `hqkg.module-dependencies/1` JSON and maps it into the
**existing** typed `Dependency` objects. Duplicate IDs, unknown protocols,
invalid versions, cycles and invalid SHA-256 claims are rejected. A manifest's
own `production_ready` flag never authorizes execution: the adapter exposes
an explicitly unapproved engine policy until the runtime owner separately
reviews and approves it.

```sh
cargo run --manifest-path research/rust-knowledge-graph/Cargo.toml --features importer --bin hqkg-deps -- research/graph-kernel-integration/contracts/module-dependencies.example.v1.json
```

This is a parsing/inspection surface, not a package installer or module loader.
