# Module: arbor/native

> Generated 2026-11-19 · 85 files · 1215 symbols

## Files

| File | Language | Lines | Symbols |
| --- | --- | --- | --- |
| [native/hqkg/.gitignore](../../files/arbor/native/hqkg/.gitignore.md) | Other | 7 | 0 |
| [native/hqkg/Cargo.toml](../../files/arbor/native/hqkg/Cargo.toml.md) | TOML | 78 | 0 |
| [native/hqkg/MIGRATION.md](../../files/arbor/native/hqkg/MIGRATION.md.md) | Markdown | 43 | 0 |
| [native/hqkg/README.md](../../files/arbor/native/hqkg/README.md.md) | Markdown | 315 | 0 |
| [native/hqkg/examples/observability_probe.rs](../../files/arbor/native/hqkg/examples/observability_probe.rs.md) | Rust | 114 | 4 |
| [native/hqkg/examples/typed_dag.rs](../../files/arbor/native/hqkg/examples/typed_dag.rs.md) | Rust | 75 | 4 |
| [native/hqkg/src/adapters/dependency_manifest.rs](../../files/arbor/native/hqkg/src/adapters/dependency_manifest.rs.md) | Rust | 180 | 11 |
| [native/hqkg/src/adapters/mod.rs](../../files/arbor/native/hqkg/src/adapters/mod.rs.md) | Rust | 4 | 2 |
| [native/hqkg/src/adapters/research.rs](../../files/arbor/native/hqkg/src/adapters/research.rs.md) | Rust | 157 | 8 |
| [native/hqkg/src/algorithm_adapter.rs](../../files/arbor/native/hqkg/src/algorithm_adapter.rs.md) | Rust | 253 | 16 |
| [native/hqkg/src/apply_ledger.rs](../../files/arbor/native/hqkg/src/apply_ledger.rs.md) | Rust | 420 | 23 |
| [native/hqkg/src/bin/hqkg-chat-context.rs](../../files/arbor/native/hqkg/src/bin/hqkg-chat-context.rs.md) | Rust | 118 | 11 |
| [native/hqkg/src/bin/hqkg-control.rs](../../files/arbor/native/hqkg/src/bin/hqkg-control.rs.md) | Rust | 174 | 7 |
| [native/hqkg/src/bin/hqkg-deps.rs](../../files/arbor/native/hqkg/src/bin/hqkg-deps.rs.md) | Rust | 46 | 2 |
| [native/hqkg/src/bin/hqkg-import.rs](../../files/arbor/native/hqkg/src/bin/hqkg-import.rs.md) | Rust | 64 | 2 |
| [native/hqkg/src/bin/hqkg-personal.rs](../../files/arbor/native/hqkg/src/bin/hqkg-personal.rs.md) | Rust | 556 | 14 |
| [native/hqkg/src/bin/hqkg-research.rs](../../files/arbor/native/hqkg/src/bin/hqkg-research.rs.md) | Rust | 58 | 2 |
| [native/hqkg/src/bin/hqkg-wave1-query.rs](../../files/arbor/native/hqkg/src/bin/hqkg-wave1-query.rs.md) | Rust | 223 | 15 |
| [native/hqkg/src/bin/hqkg-web-feed.rs](../../files/arbor/native/hqkg/src/bin/hqkg-web-feed.rs.md) | Rust | 180 | 8 |
| [native/hqkg/src/builtins.rs](../../files/arbor/native/hqkg/src/builtins.rs.md) | Rust | 159 | 9 |
| [native/hqkg/src/context_retrieval.rs](../../files/arbor/native/hqkg/src/context_retrieval.rs.md) | Rust | 334 | 11 |
| [native/hqkg/src/control.rs](../../files/arbor/native/hqkg/src/control.rs.md) | Rust | 933 | 63 |
| [native/hqkg/src/database.rs](../../files/arbor/native/hqkg/src/database.rs.md) | Rust | 236 | 10 |
| [native/hqkg/src/durable_dag.rs](../../files/arbor/native/hqkg/src/durable_dag.rs.md) | Rust | 301 | 11 |
| [native/hqkg/src/engine.rs](../../files/arbor/native/hqkg/src/engine.rs.md) | Rust | 394 | 35 |
| [native/hqkg/src/graph_change_set.rs](../../files/arbor/native/hqkg/src/graph_change_set.rs.md) | Rust | 522 | 23 |
| [native/hqkg/src/import.rs](../../files/arbor/native/hqkg/src/import.rs.md) | Rust | 458 | 22 |
| [native/hqkg/src/invalidate.rs](../../files/arbor/native/hqkg/src/invalidate.rs.md) | Rust | 608 | 26 |
| [native/hqkg/src/lib.rs](../../files/arbor/native/hqkg/src/lib.rs.md) | Rust | 1205 | 90 |
| [native/hqkg/src/main.rs](../../files/arbor/native/hqkg/src/main.rs.md) | Rust | 123 | 3 |
| [native/hqkg/src/managed_context.rs](../../files/arbor/native/hqkg/src/managed_context.rs.md) | Rust | 157 | 8 |
| [native/hqkg/src/observability.rs](../../files/arbor/native/hqkg/src/observability.rs.md) | Rust | 1267 | 64 |
| [native/hqkg/src/observability/admission.rs](../../files/arbor/native/hqkg/src/observability/admission.rs.md) | Rust | 243 | 16 |
| [native/hqkg/src/observability/correlation.rs](../../files/arbor/native/hqkg/src/observability/correlation.rs.md) | Rust | 244 | 14 |
| [native/hqkg/src/observability/drift.rs](../../files/arbor/native/hqkg/src/observability/drift.rs.md) | Rust | 251 | 13 |
| [native/hqkg/src/observability/effects.rs](../../files/arbor/native/hqkg/src/observability/effects.rs.md) | Rust | 162 | 9 |
| [native/hqkg/src/observability/forecast.rs](../../files/arbor/native/hqkg/src/observability/forecast.rs.md) | Rust | 182 | 12 |
| [native/hqkg/src/observability/incidents.rs](../../files/arbor/native/hqkg/src/observability/incidents.rs.md) | Rust | 230 | 13 |
| [native/hqkg/src/observability/journey.rs](../../files/arbor/native/hqkg/src/observability/journey.rs.md) | Rust | 184 | 10 |
| [native/hqkg/src/observability/observer.rs](../../files/arbor/native/hqkg/src/observability/observer.rs.md) | Rust | 164 | 8 |
| [native/hqkg/src/observability/quality.rs](../../files/arbor/native/hqkg/src/observability/quality.rs.md) | Rust | 223 | 13 |
| [native/hqkg/src/observability/recovery.rs](../../files/arbor/native/hqkg/src/observability/recovery.rs.md) | Rust | 208 | 13 |
| [native/hqkg/src/observability/synthesis.rs](../../files/arbor/native/hqkg/src/observability/synthesis.rs.md) | Rust | 222 | 10 |
| [native/hqkg/src/reconcile.rs](../../files/arbor/native/hqkg/src/reconcile.rs.md) | Rust | 288 | 10 |
| [native/hqkg/src/scoped_graph.rs](../../files/arbor/native/hqkg/src/scoped_graph.rs.md) | Rust | 258 | 13 |
| [native/hqkg/src/typed_dag.rs](../../files/arbor/native/hqkg/src/typed_dag.rs.md) | Rust | 677 | 34 |
| [native/hqkg/src/utility_adapter.rs](../../files/arbor/native/hqkg/src/utility_adapter.rs.md) | Rust | 197 | 16 |
| [native/hqkg/src/web_memory.rs](../../files/arbor/native/hqkg/src/web_memory.rs.md) | Rust | 905 | 46 |
| [native/hqkg/tests/algorithm_adapter.rs](../../files/arbor/native/hqkg/tests/algorithm_adapter.rs.md) | Rust | 202 | 9 |
| [native/hqkg/tests/apply_ledger.rs](../../files/arbor/native/hqkg/tests/apply_ledger.rs.md) | Rust | 223 | 10 |
| [native/hqkg/tests/apply_ledger_locking.rs](../../files/arbor/native/hqkg/tests/apply_ledger_locking.rs.md) | Rust | 226 | 14 |
| [native/hqkg/tests/bench_vertical.rs](../../files/arbor/native/hqkg/tests/bench_vertical.rs.md) | Rust | 641 | 36 |
| [native/hqkg/tests/benchmark_typed_dag.rs](../../files/arbor/native/hqkg/tests/benchmark_typed_dag.rs.md) | Rust | 109 | 6 |
| [native/hqkg/tests/builtins.rs](../../files/arbor/native/hqkg/tests/builtins.rs.md) | Rust | 39 | 2 |
| [native/hqkg/tests/context_retrieval.rs](../../files/arbor/native/hqkg/tests/context_retrieval.rs.md) | Rust | 299 | 20 |
| [native/hqkg/tests/control.rs](../../files/arbor/native/hqkg/tests/control.rs.md) | Rust | 199 | 11 |
| [native/hqkg/tests/control_persistence.rs](../../files/arbor/native/hqkg/tests/control_persistence.rs.md) | Rust | 63 | 3 |
| [native/hqkg/tests/control_recovery.rs](../../files/arbor/native/hqkg/tests/control_recovery.rs.md) | Rust | 111 | 9 |
| [native/hqkg/tests/core.rs](../../files/arbor/native/hqkg/tests/core.rs.md) | Rust | 184 | 8 |
| [native/hqkg/tests/dependency_manifest.rs](../../files/arbor/native/hqkg/tests/dependency_manifest.rs.md) | Rust | 30 | 3 |
| [native/hqkg/tests/durable_dag.rs](../../files/arbor/native/hqkg/tests/durable_dag.rs.md) | Rust | 187 | 11 |
| [native/hqkg/tests/fixtures/web-memory-revision/revocation-cases.json](../../files/arbor/native/hqkg/tests/fixtures/web-memory-revision/revocation-cases.json.md) | JSON | 58 | 0 |
| [native/hqkg/tests/graph_change_set.rs](../../files/arbor/native/hqkg/tests/graph_change_set.rs.md) | Rust | 358 | 14 |
| [native/hqkg/tests/graph_indexes.rs](../../files/arbor/native/hqkg/tests/graph_indexes.rs.md) | Rust | 44 | 2 |
| [native/hqkg/tests/host_context_sync.rs](../../files/arbor/native/hqkg/tests/host_context_sync.rs.md) | Rust | 388 | 29 |
| [native/hqkg/tests/import.rs](../../files/arbor/native/hqkg/tests/import.rs.md) | Rust | 520 | 23 |
| [native/hqkg/tests/invalidate-revision.rs](../../files/arbor/native/hqkg/tests/invalidate-revision.rs.md) | Rust | 317 | 16 |
| [native/hqkg/tests/invalidate-revision.test.mjs](../../files/arbor/native/hqkg/tests/invalidate-revision.test.mjs.md) | JavaScript | 58 | 11 |
| [native/hqkg/tests/invalidate.rs](../../files/arbor/native/hqkg/tests/invalidate.rs.md) | Rust | 356 | 17 |
| [native/hqkg/tests/keeper_recovery_matrix.rs](../../files/arbor/native/hqkg/tests/keeper_recovery_matrix.rs.md) | Rust | 580 | 10 |
| [native/hqkg/tests/observability.rs](../../files/arbor/native/hqkg/tests/observability.rs.md) | Rust | 504 | 22 |
| [native/hqkg/tests/observability_extended.rs](../../files/arbor/native/hqkg/tests/observability_extended.rs.md) | Rust | 306 | 15 |
| [native/hqkg/tests/personal_lifecycle.rs](../../files/arbor/native/hqkg/tests/personal_lifecycle.rs.md) | Rust | 302 | 14 |
| [native/hqkg/tests/pilot_vertical.rs](../../files/arbor/native/hqkg/tests/pilot_vertical.rs.md) | Rust | 394 | 13 |
| [native/hqkg/tests/reconcile.rs](../../files/arbor/native/hqkg/tests/reconcile.rs.md) | Rust | 279 | 8 |
| [native/hqkg/tests/research_adapter.rs](../../files/arbor/native/hqkg/tests/research_adapter.rs.md) | Rust | 55 | 1 |
| [native/hqkg/tests/scoped_graph.rs](../../files/arbor/native/hqkg/tests/scoped_graph.rs.md) | Rust | 100 | 7 |
| [native/hqkg/tests/scoped_query_retrieval.rs](../../files/arbor/native/hqkg/tests/scoped_query_retrieval.rs.md) | Rust | 265 | 17 |
| [native/hqkg/tests/telemetry_export.rs](../../files/arbor/native/hqkg/tests/telemetry_export.rs.md) | Rust | 53 | 2 |
| [native/hqkg/tests/typed_dag.rs](../../files/arbor/native/hqkg/tests/typed_dag.rs.md) | Rust | 350 | 21 |
| [native/hqkg/tests/utility_adapter.rs](../../files/arbor/native/hqkg/tests/utility_adapter.rs.md) | Rust | 125 | 6 |
| [native/hqkg/tests/validated_pure_program.rs](../../files/arbor/native/hqkg/tests/validated_pure_program.rs.md) | Rust | 444 | 16 |
| [native/hqkg/tests/web_feed_process.rs](../../files/arbor/native/hqkg/tests/web_feed_process.rs.md) | Rust | 365 | 15 |
| [native/hqkg/tests/web_memory.rs](../../files/arbor/native/hqkg/tests/web_memory.rs.md) | Rust | 379 | 17 |
| [native/hqkg/tests/web_memory_revocation.rs](../../files/arbor/native/hqkg/tests/web_memory_revocation.rs.md) | Rust | 397 | 23 |

## Symbols

| Symbol | Kind | Exported | Line |
| --- | --- | --- | --- |
| [ACK_SCHEMA](../../files/arbor/native/hqkg/src/web_memory.rs.md) | const | yes | 11 |
| [ADJECTIVES](../../files/arbor/native/hqkg/tests/bench_vertical.rs.md) | const | no | 62 |
| [ALGORITHMS](../../files/arbor/native/hqkg/src/algorithm_adapter.rs.md) | const | yes | 28 |
| [ALGORITHM_INTERFACE](../../files/arbor/native/hqkg/src/algorithm_adapter.rs.md) | const | yes | 16 |
| [Acc](../../files/arbor/native/hqkg/src/observability/correlation.rs.md) | struct | no | 36 |
| [AdmissionPolicy](../../files/arbor/native/hqkg/src/observability/admission.rs.md) | struct | yes | 31 |
| [AlgorithmCompute](../../files/arbor/native/hqkg/src/algorithm_adapter.rs.md) | struct | yes | 184 |
| [AlgorithmDriver](../../files/arbor/native/hqkg/src/algorithm_adapter.rs.md) | trait | yes | 177 |
| [AlgorithmSpec](../../files/arbor/native/hqkg/src/algorithm_adapter.rs.md) | struct | yes | 20 |
| [ApplyLedger](../../files/arbor/native/hqkg/src/graph_change_set.rs.md) | struct | yes | 173 |
| [ApplyReport](../../files/arbor/native/hqkg/src/graph_change_set.rs.md) | struct | yes | 194 |
| [Budget](../../files/arbor/native/hqkg/src/engine.rs.md) | struct | yes | 292 |
| [CATALOG_SOURCE](../../files/arbor/native/hqkg/src/algorithm_adapter.rs.md) | const | yes | 17 |
| [CAUSAL_CONTRACT](../../files/arbor/native/hqkg/src/observability.rs.md) | const | yes | 725 |
| [CHANGESET_PUT_EDGES](../../files/arbor/native/hqkg/tests/bench_vertical.rs.md) | const | no | 37 |
| [CHANGESET_PUT_NODES](../../files/arbor/native/hqkg/tests/bench_vertical.rs.md) | const | no | 36 |
| [COMMUNICATION](../../files/arbor/native/hqkg/src/bin/hqkg-wave1-query.rs.md) | const | no | 8 |
| [CONTRACT](../../files/arbor/native/hqkg/src/observability.rs.md) | const | yes | 21 |
| [CONTRACT](../../files/arbor/native/hqkg/src/typed_dag.rs.md) | const | yes | 14 |
| [COUNTER](../../files/arbor/native/hqkg/tests/bench_vertical.rs.md) | const | no | 247 |
| [CacheRepair](../../files/arbor/native/hqkg/tests/control_recovery.rs.md) | struct | no | 24 |
| [Cached](../../files/arbor/native/hqkg/src/typed_dag.rs.md) | struct | no | 229 |
| [CallerId](../../files/arbor/native/hqkg/src/invalidate.rs.md) | struct | yes | 70 |
| [CancellationToken](../../files/arbor/native/hqkg/src/engine.rs.md) | struct | yes | 269 |
| [CausalLink](../../files/arbor/native/hqkg/src/observability.rs.md) | struct | yes | 869 |
| [CauseHypothesis](../../files/arbor/native/hqkg/src/observability/correlation.rs.md) | struct | yes | 24 |
| [ChangeOp](../../files/arbor/native/hqkg/src/graph_change_set.rs.md) | enum | yes | 33 |
| [CommandStage](../../files/arbor/native/hqkg/src/observability.rs.md) | enum | yes | 34 |
| [CommitReceipt](../../files/arbor/native/hqkg/src/durable_dag.rs.md) | struct | yes | 19 |
| [ComputeEngine](../../files/arbor/native/hqkg/src/engine.rs.md) | trait | yes | 50 |
| [Condition](../../files/arbor/native/hqkg/src/observability.rs.md) | enum | yes | 83 |
| [ConfigPatch](../../files/arbor/native/hqkg/src/control.rs.md) | struct | yes | 264 |
| [ConfigReceipt](../../files/arbor/native/hqkg/src/control.rs.md) | struct | yes | 274 |
| [ContextBundle](../../files/arbor/native/hqkg/src/context_retrieval.rs.md) | struct | yes | 96 |
| [ContextEdge](../../files/arbor/native/hqkg/src/context_retrieval.rs.md) | struct | yes | 86 |
| [ContextItem](../../files/arbor/native/hqkg/src/context_retrieval.rs.md) | struct | yes | 43 |
| [ContextRecord](../../files/arbor/native/hqkg/src/bin/hqkg-personal.rs.md) | struct | no | 43 |
| [ContextRequest](../../files/arbor/native/hqkg/src/context_retrieval.rs.md) | struct | yes | 28 |
| [CoreConfig](../../files/arbor/native/hqkg/src/control.rs.md) | struct | yes | 239 |
| [CoreSupervisor](../../files/arbor/native/hqkg/src/control.rs.md) | struct | yes | 752 |
| [DEFAULT_LOCK_TTL_MS](../../files/arbor/native/hqkg/src/apply_ledger.rs.md) | const | yes | 111 |
| [DELTA_FRAME](../../files/arbor/native/hqkg/src/lib.rs.md) | const | no | 626 |
| [DIGEST](../../files/arbor/native/hqkg/tests/scoped_query_retrieval.rs.md) | const | no | 132 |
| [DagExecutor](../../files/arbor/native/hqkg/src/typed_dag.rs.md) | struct | yes | 418 |
| [DagReport](../../files/arbor/native/hqkg/src/typed_dag.rs.md) | struct | yes | 217 |
| [DataTable](../../files/arbor/native/hqkg/src/database.rs.md) | struct | yes | 127 |
| [DatabaseCompute](../../files/arbor/native/hqkg/src/builtins.rs.md) | struct | yes | 99 |
| [DatabaseKind](../../files/arbor/native/hqkg/src/database.rs.md) | enum | yes | 6 |
| [DatabaseSpec](../../files/arbor/native/hqkg/src/database.rs.md) | struct | yes | 26 |
| [Dependency](../../files/arbor/native/hqkg/src/control.rs.md) | struct | yes | 91 |
| [DependencyPlan](../../files/arbor/native/hqkg/src/control.rs.md) | struct | yes | 101 |
| [DiagnosticFinding](../../files/arbor/native/hqkg/src/observability.rs.md) | struct | yes | 106 |
| [Discrimination](../../files/arbor/native/hqkg/src/observability.rs.md) | struct | yes | 740 |
| [DriftAssessment](../../files/arbor/native/hqkg/src/observability/drift.rs.md) | struct | yes | 49 |
| [DriftPolicy](../../files/arbor/native/hqkg/src/observability/drift.rs.md) | struct | yes | 15 |
| [DriftWindow](../../files/arbor/native/hqkg/src/observability/drift.rs.md) | struct | yes | 39 |
| [DuplicateCandidate](../../files/arbor/native/hqkg/src/reconcile.rs.md) | struct | yes | 55 |
| [DuplicateSignal](../../files/arbor/native/hqkg/src/reconcile.rs.md) | enum | yes | 43 |
| [DurableRun](../../files/arbor/native/hqkg/src/durable_dag.rs.md) | struct | yes | 12 |
| [ENTRY](../../files/arbor/native/hqkg/tests/host_context_sync.rs.md) | const | no | 8 |
| [EVENT_ID](../../files/arbor/native/hqkg/tests/web_feed_process.rs.md) | const | no | 14 |
| [EVENT_ID](../../files/arbor/native/hqkg/tests/web_memory.rs.md) | const | no | 222 |
| [EVENT_ID](../../files/arbor/native/hqkg/tests/web_memory_revocation.rs.md) | const | no | 17 |
| [Echo](../../files/arbor/native/hqkg/tests/control.rs.md) | struct | no | 139 |
| [Echo](../../files/arbor/native/hqkg/tests/core.rs.md) | struct | no | 64 |
| [Edge](../../files/arbor/native/hqkg/src/lib.rs.md) | struct | yes | 142 |
| [EffectClaim](../../files/arbor/native/hqkg/src/observability/effects.rs.md) | struct | yes | 16 |
| [EffectKind](../../files/arbor/native/hqkg/src/observability/effects.rs.md) | enum | yes | 8 |
| [Engine](../../files/arbor/native/hqkg/tests/control_recovery.rs.md) | struct | no | 9 |
| [EngineDescriptor](../../files/arbor/native/hqkg/src/engine.rs.md) | struct | yes | 25 |
| [EngineLease](../../files/arbor/native/hqkg/src/engine.rs.md) | struct | yes | 59 |
| [EngineOutput](../../files/arbor/native/hqkg/src/engine.rs.md) | struct | yes | 47 |
| [EnginePolicy](../../files/arbor/native/hqkg/src/control.rs.md) | struct | yes | 745 |
| [EngineRegistry](../../files/arbor/native/hqkg/src/engine.rs.md) | struct | yes | 86 |
| [EngineRequest](../../files/arbor/native/hqkg/src/engine.rs.md) | struct | yes | 42 |
| [Error](../../files/arbor/native/hqkg/src/lib.rs.md) | enum | yes | 43 |
| [EvidenceGrade](../../files/arbor/native/hqkg/src/observability.rs.md) | enum | yes | 26 |
| [EvidenceStatus](../../files/arbor/native/hqkg/src/observability.rs.md) | enum | yes | 91 |
| [ExactEntry](../../files/arbor/native/hqkg/src/invalidate.rs.md) | struct | no | 132 |
| [Exchange](../../files/arbor/native/hqkg/src/import.rs.md) | struct | yes | 42 |
| [Expectation](../../files/arbor/native/hqkg/src/observability.rs.md) | struct | yes | 75 |
| [ExpectationKind](../../files/arbor/native/hqkg/src/observability.rs.md) | enum | yes | 68 |
| [FRAME](../../files/arbor/native/hqkg/src/lib.rs.md) | const | no | 624 |
| [FileApplyLedger](../../files/arbor/native/hqkg/src/apply_ledger.rs.md) | struct | yes | 239 |
| [Fingerprint](../../files/arbor/native/hqkg/src/invalidate.rs.md) | struct | no | 108 |
| [Generation](../../files/arbor/native/hqkg/src/engine.rs.md) | struct | no | 54 |
| [Graph](../../files/arbor/native/hqkg/src/lib.rs.md) | struct | yes | 186 |
| [GraphChangeSet](../../files/arbor/native/hqkg/src/graph_change_set.rs.md) | struct | yes | 82 |
| [GraphCompute](../../files/arbor/native/hqkg/src/builtins.rs.md) | struct | yes | 8 |
| [GraphDomain](../../files/arbor/native/hqkg/src/typed_dag.rs.md) | enum | yes | 17 |
| [HANDOFF_CONTRACT](../../files/arbor/native/hqkg/src/observability/recovery.rs.md) | const | yes | 5 |
| [HELD_LOCKS](../../files/arbor/native/hqkg/src/apply_ledger.rs.md) | const | no | 119 |
| [HQKG](../../files/arbor/native/hqkg/tests/invalidate-revision.test.mjs.md) | const | no | 14 |
| [HealingController](../../files/arbor/native/hqkg/src/control.rs.md) | struct | yes | 661 |
| [HealthMonitor](../../files/arbor/native/hqkg/src/control.rs.md) | struct | yes | 591 |
| [HealthStatus](../../files/arbor/native/hqkg/src/control.rs.md) | enum | yes | 562 |
| [Hypothesis](../../files/arbor/native/hqkg/src/observability.rs.md) | struct | yes | 732 |
| [INPUT_SCHEMA](../../files/arbor/native/hqkg/src/web_memory.rs.md) | const | yes | 9 |
| [INSTALLATION](../../files/arbor/native/hqkg/tests/web_feed_process.rs.md) | const | no | 13 |
| [INSTALLATION](../../files/arbor/native/hqkg/tests/web_memory.rs.md) | const | no | 221 |
| [INSTALLATION](../../files/arbor/native/hqkg/tests/web_memory_revocation.rs.md) | const | no | 16 |
| [IO_retry_is_opt_in_bounded_and_pure_only](../../files/arbor/native/hqkg/tests/typed_dag.rs.md) | function | no | 271 |
| [ITERS](../../files/arbor/native/hqkg/tests/bench_vertical.rs.md) | const | no | 35 |
| [Impact](../../files/arbor/native/hqkg/src/observability/recovery.rs.md) | enum | yes | 8 |
| [ImportStats](../../files/arbor/native/hqkg/src/import.rs.md) | struct | yes | 52 |
| [IncidentPolicy](../../files/arbor/native/hqkg/src/observability/incidents.rs.md) | struct | yes | 7 |
| [IncidentReduction](../../files/arbor/native/hqkg/src/observability/incidents.rs.md) | struct | yes | 63 |
| [IncidentState](../../files/arbor/native/hqkg/src/observability/incidents.rs.md) | struct | yes | 23 |
| [IncidentTransition](../../files/arbor/native/hqkg/src/observability/incidents.rs.md) | enum | yes | 48 |
| [IncrementalCache](../../files/arbor/native/hqkg/src/typed_dag.rs.md) | struct | yes | 237 |
| [IntelligenceLane](../../files/arbor/native/hqkg/src/observability/quality.rs.md) | enum | yes | 10 |
| [InvalidateCache](../../files/arbor/native/hqkg/src/invalidate.rs.md) | struct | yes | 263 |
| [JOURNAL_CONTRACT](../../files/arbor/native/hqkg/src/durable_dag.rs.md) | const | yes | 10 |
| [Journal](../../files/arbor/native/hqkg/src/lib.rs.md) | struct | yes | 801 |
| [JournalCompactionReceipt](../../files/arbor/native/hqkg/src/lib.rs.md) | struct | yes | 1122 |
| [JournalStatus](../../files/arbor/native/hqkg/src/lib.rs.md) | struct | yes | 793 |
| [JourneyEvidence](../../files/arbor/native/hqkg/src/observability/journey.rs.md) | struct | yes | 20 |
| [KIND_KEY](../../files/arbor/native/hqkg/src/import.rs.md) | const | no | 17 |
| [Lcg](../../files/arbor/native/hqkg/tests/bench_vertical.rs.md) | struct | no | 45 |
| [LengthTransform](../../files/arbor/native/hqkg/examples/typed_dag.rs.md) | struct | no | 14 |
| [Lru](../../files/arbor/native/hqkg/src/invalidate.rs.md) | struct | no | 167 |
| [MAX_BATCH](../../files/arbor/native/hqkg/src/web_memory.rs.md) | const | yes | 20 |
| [MAX_BODY](../../files/arbor/native/hqkg/src/web_memory.rs.md) | const | yes | 21 |
| [MAX_BYTES](../../files/arbor/native/hqkg/src/import.rs.md) | const | yes | 11 |
| [MAX_CONTEXT_DELTAS](../../files/arbor/native/hqkg/src/bin/hqkg-personal.rs.md) | const | no | 32 |
| [MAX_CONTEXT_RECORDS](../../files/arbor/native/hqkg/src/bin/hqkg-personal.rs.md) | const | no | 31 |
| [MAX_DEPTH](../../files/arbor/native/hqkg/src/context_retrieval.rs.md) | const | yes | 23 |
| [MAX_DRIFT_SAMPLES](../../files/arbor/native/hqkg/src/observability/drift.rs.md) | const | yes | 6 |
| [MAX_EDGES](../../files/arbor/native/hqkg/src/bin/hqkg-wave1-query.rs.md) | const | no | 7 |
| [MAX_EDGES](../../files/arbor/native/hqkg/src/import.rs.md) | const | yes | 13 |
| [MAX_EVENTS](../../files/arbor/native/hqkg/src/observability.rs.md) | const | no | 22 |
| [MAX_EVIDENCE_REFS](../../files/arbor/native/hqkg/src/observability.rs.md) | const | no | 23 |
| [MAX_FRAME](../../files/arbor/native/hqkg/src/lib.rs.md) | const | no | 627 |
| [MAX_HYPOTHESES](../../files/arbor/native/hqkg/src/observability.rs.md) | const | no | 726 |
| [MAX_ID_BYTES](../../files/arbor/native/hqkg/src/apply_ledger.rs.md) | const | no | 90 |
| [MAX_INPUT_BYTES](../../files/arbor/native/hqkg/src/utility_adapter.rs.md) | const | no | 9 |
| [MAX_ITEMS](../../files/arbor/native/hqkg/src/bin/hqkg-chat-context.rs.md) | const | no | 13 |
| [MAX_ITEMS](../../files/arbor/native/hqkg/src/managed_context.rs.md) | const | no | 12 |
| [MAX_JOURNAL_BYTES](../../files/arbor/native/hqkg/src/bin/hqkg-chat-context.rs.md) | const | no | 12 |
| [MAX_JOURNAL_BYTES](../../files/arbor/native/hqkg/src/managed_context.rs.md) | const | no | 11 |
| [MAX_MANIFEST_BYTES](../../files/arbor/native/hqkg/src/adapters/dependency_manifest.rs.md) | const | no | 12 |
| [MAX_MATCHES](../../files/arbor/native/hqkg/src/bin/hqkg-wave1-query.rs.md) | const | no | 6 |
| [MAX_NODES](../../files/arbor/native/hqkg/src/import.rs.md) | const | yes | 12 |
| [MAX_NUMBERS](../../files/arbor/native/hqkg/src/utility_adapter.rs.md) | const | no | 14 |
| [MAX_OUTPUT_BYTES](../../files/arbor/native/hqkg/src/utility_adapter.rs.md) | const | no | 10 |
| [MAX_PREDICTIONS](../../files/arbor/native/hqkg/src/observability.rs.md) | const | no | 727 |
| [MAX_REASON](../../files/arbor/native/hqkg/src/web_memory.rs.md) | const | yes | 23 |
| [MAX_REQUIREMENTS](../../files/arbor/native/hqkg/src/adapters/dependency_manifest.rs.md) | const | no | 13 |
| [MAX_STATEMENTS](../../files/arbor/native/hqkg/src/utility_adapter.rs.md) | const | no | 11 |
| [MAX_SYMPTOMS](../../files/arbor/native/hqkg/src/observability/correlation.rs.md) | const | no | 7 |
| [MAX_TOMBSTONES](../../files/arbor/native/hqkg/src/import.rs.md) | const | yes | 14 |
| [MAX_TREND_SAMPLES](../../files/arbor/native/hqkg/src/observability/forecast.rs.md) | const | no | 6 |
| [MAX_VARIABLES](../../files/arbor/native/hqkg/src/utility_adapter.rs.md) | const | no | 12 |
| [MAX_VARIABLE_NAME](../../files/arbor/native/hqkg/src/utility_adapter.rs.md) | const | no | 13 |
| [MAX_VISITS](../../files/arbor/native/hqkg/src/observability/correlation.rs.md) | const | no | 8 |
| [MIB](../../files/arbor/native/hqkg/src/bin/hqkg-personal.rs.md) | const | no | 25 |
| [Manifest](../../files/arbor/native/hqkg/src/import.rs.md) | struct | yes | 29 |
| [MaterializedOutput](../../files/arbor/native/hqkg/src/typed_dag.rs.md) | struct | yes | 206 |
| [MetricCursor](../../files/arbor/native/hqkg/src/observability.rs.md) | struct | yes | 529 |
| [MetricEvent](../../files/arbor/native/hqkg/src/control.rs.md) | struct | yes | 449 |
| [MetricSummary](../../files/arbor/native/hqkg/src/control.rs.md) | struct | yes | 459 |
| [Mode](../../files/arbor/native/hqkg/src/control.rs.md) | enum | yes | 226 |
| [ModuleManifest](../../files/arbor/native/hqkg/src/adapters/dependency_manifest.rs.md) | struct | yes | 16 |
| [NEXT](../../files/arbor/native/hqkg/tests/host_context_sync.rs.md) | const | no | 9 |
| [NOUNS](../../files/arbor/native/hqkg/tests/bench_vertical.rs.md) | const | no | 76 |
| [NeighborCount](../../files/arbor/native/hqkg/tests/algorithm_adapter.rs.md) | struct | no | 10 |
| [NextStep](../../files/arbor/native/hqkg/src/observability.rs.md) | enum | yes | 99 |
| [Node](../../files/arbor/native/hqkg/src/lib.rs.md) | struct | yes | 113 |
| [NodeKind](../../files/arbor/native/hqkg/src/lib.rs.md) | enum | yes | 76 |
| [NotificationAdvice](../../files/arbor/native/hqkg/src/observability/incidents.rs.md) | enum | yes | 56 |
| [ORDER](../../files/arbor/native/hqkg/src/observability/journey.rs.md) | const | no | 11 |
| [OTHER](../../files/arbor/native/hqkg/tests/web_memory_revocation.rs.md) | const | no | 315 |
| [OWNER_KEY](../../files/arbor/native/hqkg/src/import.rs.md) | const | no | 15 |
| [Observation](../../files/arbor/native/hqkg/src/observability.rs.md) | struct | yes | 54 |
| [ObserverSnapshot](../../files/arbor/native/hqkg/src/observability/observer.rs.md) | struct | yes | 7 |
| [Outcome](../../files/arbor/native/hqkg/src/control.rs.md) | enum | yes | 442 |
| [OutputState](../../files/arbor/native/hqkg/src/typed_dag.rs.md) | enum | yes | 201 |
| [PURE_ENGINE_SLOT](../../files/arbor/native/hqkg/src/engine.rs.md) | const | yes | 12 |
| [PURE_INTERFACE](../../files/arbor/native/hqkg/src/engine.rs.md) | const | yes | 10 |
| [PURE_OPERATIONS](../../files/arbor/native/hqkg/src/engine.rs.md) | const | yes | 15 |
| [Phase](../../files/arbor/native/hqkg/src/import.rs.md) | enum | no | 22 |
| [ProgramIdentity](../../files/arbor/native/hqkg/src/typed_dag.rs.md) | struct | yes | 52 |
| [Properties](../../files/arbor/native/hqkg/src/lib.rs.md) | type | yes | 73 |
| [Provenance](../../files/arbor/native/hqkg/src/scoped_graph.rs.md) | struct | yes | 10 |
| [Pure](../../files/arbor/native/hqkg/tests/typed_dag.rs.md) | struct | no | 14 |
| [PureTransformEngine](../../files/arbor/native/hqkg/src/engine.rs.md) | struct | yes | 174 |
| [QUERY_SCHEMA](../../files/arbor/native/hqkg/src/web_memory.rs.md) | const | yes | 10 |
| [QualityAssessment](../../files/arbor/native/hqkg/src/observability/quality.rs.md) | struct | yes | 45 |
| [QualityPolicy](../../files/arbor/native/hqkg/src/observability/quality.rs.md) | struct | yes | 27 |
| [QualitySuite](../../files/arbor/native/hqkg/src/observability/quality.rs.md) | struct | yes | 16 |
| [QualityWindow](../../files/arbor/native/hqkg/src/observability.rs.md) | struct | yes | 617 |
| [Query](../../files/arbor/native/hqkg/src/web_memory.rs.md) | struct | yes | 899 |
| [RECORD_CONTRACT](../../files/arbor/native/hqkg/src/scoped_graph.rs.md) | const | yes | 8 |
| [RELATIONS](../../files/arbor/native/hqkg/tests/bench_vertical.rs.md) | const | no | 90 |
| [RESERVED_PROPERTY_PREFIX](../../files/arbor/native/hqkg/src/lib.rs.md) | const | yes | 174 |
| [RETRIEVE_BUDGET](../../files/arbor/native/hqkg/tests/bench_vertical.rs.md) | const | no | 39 |
| [RETRIEVE_SEEDS](../../files/arbor/native/hqkg/tests/bench_vertical.rs.md) | const | no | 38 |
| [REVOCATION_PREFIX](../../files/arbor/native/hqkg/src/web_memory.rs.md) | const | yes | 17 |
| [REVOCATION_SCHEMA](../../files/arbor/native/hqkg/src/web_memory.rs.md) | const | yes | 13 |
| [REVOCATION_SCHEMA_ID](../../files/arbor/native/hqkg/tests/web_memory_revocation.rs.md) | const | no | 15 |
| [ROOT](../../files/arbor/native/hqkg/tests/invalidate-revision.test.mjs.md) | const | no | 13 |
| [Receipt](../../files/arbor/native/hqkg/src/web_memory.rs.md) | struct | yes | 450 |
| [RecoveryAdvice](../../files/arbor/native/hqkg/src/observability/recovery.rs.md) | enum | yes | 17 |
| [RecoveryCandidate](../../files/arbor/native/hqkg/src/observability/recovery.rs.md) | struct | yes | 26 |
| [RecoveryPlan](../../files/arbor/native/hqkg/src/control.rs.md) | enum | yes | 585 |
| [RepairAdapter](../../files/arbor/native/hqkg/src/control.rs.md) | trait | yes | 645 |
| [RepairReceipt](../../files/arbor/native/hqkg/src/control.rs.md) | struct | yes | 653 |
| [RepairScope](../../files/arbor/native/hqkg/src/control.rs.md) | enum | yes | 640 |
| [RequiredCapability](../../files/arbor/native/hqkg/src/observability/synthesis.rs.md) | struct | yes | 7 |
| [ResearchCatalogCompute](../../files/arbor/native/hqkg/src/adapters/research.rs.md) | struct | yes | 8 |
| [Resource](../../files/arbor/native/hqkg/src/control.rs.md) | struct | yes | 80 |
| [ResourceKind](../../files/arbor/native/hqkg/src/control.rs.md) | enum | yes | 71 |
| [Result](../../files/arbor/native/hqkg/src/lib.rs.md) | type | yes | 52 |
| [RevisionToken](../../files/arbor/native/hqkg/src/typed_dag.rs.md) | struct | yes | 43 |
| [RevocationReceipt](../../files/arbor/native/hqkg/src/web_memory.rs.md) | struct | yes | 402 |
| [RevocationRequest](../../files/arbor/native/hqkg/src/web_memory.rs.md) | struct | yes | 387 |
| [RootCause](../../files/arbor/native/hqkg/src/observability.rs.md) | struct | yes | 885 |
| [RootCauseResult](../../files/arbor/native/hqkg/src/observability.rs.md) | enum | yes | 895 |
| [RunState](../../files/arbor/native/hqkg/src/typed_dag.rs.md) | enum | yes | 193 |
| [SCHEMA](../../files/arbor/native/hqkg/src/adapters/dependency_manifest.rs.md) | const | no | 11 |
| [SCHEMA](../../files/arbor/native/hqkg/src/bin/hqkg-chat-context.rs.md) | const | no | 11 |
| [SCHEMA](../../files/arbor/native/hqkg/src/import.rs.md) | const | yes | 10 |
| [SCHEMA](../../files/arbor/native/hqkg/src/managed_context.rs.md) | const | no | 10 |
| [SCHEMA_KEY](../../files/arbor/native/hqkg/src/import.rs.md) | const | no | 16 |
| [SCOPE](../../files/arbor/native/hqkg/tests/host_context_sync.rs.md) | const | no | 7 |
| [SCOPE](../../files/arbor/native/hqkg/tests/scoped_query_retrieval.rs.md) | const | no | 131 |
| [SCOPE_A](../../files/arbor/native/hqkg/tests/personal_lifecycle.rs.md) | const | no | 11 |
| [SCOPE_B](../../files/arbor/native/hqkg/tests/personal_lifecycle.rs.md) | const | no | 12 |
| [SECOND_EVENT_ID](../../files/arbor/native/hqkg/tests/web_feed_process.rs.md) | const | no | 15 |
| [SECRET](../../files/arbor/native/hqkg/src/web_memory.rs.md) | const | no | 138 |
| [SERIAL](../../files/arbor/native/hqkg/tests/durable_dag.rs.md) | const | no | 8 |
| [SHARED_NEIGHBOR_THRESHOLD](../../files/arbor/native/hqkg/src/reconcile.rs.md) | const | no | 62 |
| [SOURCE](../../files/arbor/native/hqkg/src/bin/hqkg-wave1-query.rs.md) | const | no | 5 |
| [Sandbox](../../files/arbor/native/hqkg/tests/personal_lifecycle.rs.md) | struct | no | 14 |
| [Scheduler](../../files/arbor/native/hqkg/src/engine.rs.md) | struct | yes | 314 |
| [ScopedQuery](../../files/arbor/native/hqkg/src/context_retrieval.rs.md) | struct | yes | 68 |
| [SeedEntry](../../files/arbor/native/hqkg/src/invalidate.rs.md) | struct | no | 155 |
| [ServiceHealth](../../files/arbor/native/hqkg/src/control.rs.md) | struct | yes | 568 |
| [ShortOutput](../../files/arbor/native/hqkg/tests/benchmark_typed_dag.rs.md) | struct | no | 12 |
| [Signal](../../files/arbor/native/hqkg/src/observability.rs.md) | enum | yes | 43 |
| [SourceBinding](../../files/arbor/native/hqkg/src/observability/admission.rs.md) | struct | yes | 22 |
| [SourceBinding](../../files/arbor/native/hqkg/src/typed_dag.rs.md) | struct | yes | 164 |
| [SourceRevision](../../files/arbor/native/hqkg/src/invalidate.rs.md) | struct | yes | 88 |
| [SourceRole](../../files/arbor/native/hqkg/src/observability/admission.rs.md) | enum | yes | 12 |
| [Stats](../../files/arbor/native/hqkg/tests/bench_vertical.rs.md) | struct | no | 179 |
| [SupervisedOutput](../../files/arbor/native/hqkg/src/control.rs.md) | struct | yes | 740 |
| [SupervisedReceipt](../../files/arbor/native/hqkg/src/control.rs.md) | struct | yes | 729 |
| [SwapReceipt](../../files/arbor/native/hqkg/src/engine.rs.md) | struct | yes | 80 |
| [Symptom](../../files/arbor/native/hqkg/src/observability/correlation.rs.md) | struct | yes | 18 |
| [SymptomKind](../../files/arbor/native/hqkg/src/observability/correlation.rs.md) | enum | yes | 11 |

_Showing 250 of 1215 symbols._

## Dependencies

### Outgoing

| Target | Imports |
| --- | --- |
| external:super::* | 16 |
| external:crate::{Error, Result} | 15 |
| external:std::collections::{BTreeMap, BTreeSet} | 13 |
| external:serde_json::{json, Value} | 10 |
| external:std::collections::BTreeSet | 9 |
| external:std::fs | 9 |
| external:hqkg::{Edge, Graph, Node, NodeKind} | 8 |
| external:std::io::Write | 8 |
| external:std::sync::{Arc, RwLock} | 8 |
| external:sha2::{Digest, Sha256} | 6 |
| external:std::collections::BTreeMap | 6 |
| external:hqkg::Result | 4 |
| external:hqkg::typed_dag::{GraphDomain, Namespace, RevisionToken} | 4 |
| external:hqkg::{ | 4 |
| external:std::collections::{BTreeMap, BTreeSet, VecDeque} | 4 |
| external:std::path::PathBuf | 4 |
| external:std::path::{Path, PathBuf} | 4 |
| external:std::sync::Arc | 4 |
| external:std::time::Instant | 4 |
| external:super::{finding, safe_id, Condition, DiagnosticFinding, EvidenceStatus, NextStep} | 4 |
| external:crate::engine::{ComputeEngine, EngineDescriptor, EngineOutput, EngineRequest} | 3 |
| external:hqkg::context_retrieval::{retrieve, ContextBundle, ContextRequest} | 3 |
| external:hqkg::control::* | 3 |
| external:hqkg::engine::{ | 3 |
| external:hqkg::graph_change_set::{ApplyLedger, GraphChangeSet} | 3 |
| external:hqkg::typed_dag::* | 3 |
| external:hqkg::{Error, Journal, Result} | 3 |
| external:hqkg::{Graph, Journal, Node, NodeKind} | 3 |
| external:std::sync::{ | 3 |
| external:std::time::{SystemTime, UNIX_EPOCH} | 3 |
| external:super::{ | 3 |
| external:crate::{Edge, Error, Graph, Node, NodeKind, Result} | 2 |
| external:crate::{Error, Graph, Node, NodeKind, Result} | 2 |
| external:crate::{Error, Graph, Result} | 2 |
| external:hqkg::Journal | 2 |
| external:hqkg::adapters::dependency_manifest::parse_manifest | 2 |
| external:hqkg::adapters::research::ResearchCatalogCompute | 2 |
| external:hqkg::apply_ledger::{apply_durable, FileApplyLedger} | 2 |
| external:hqkg::context_retrieval::{retrieve, ContextRequest} | 2 |
| external:hqkg::control::{ConfigPatch, CoreConfig, Mode} | 2 |
| external:hqkg::invalidate::InvalidateCache | 2 |
| external:hqkg::observability::* | 2 |
| external:hqkg::scoped_graph::{self, Provenance} | 2 |
| external:hqkg::typed_dag::{ | 2 |
| external:hqkg::web_memory::{parse_batch, Query, WebMemory} | 2 |
| external:hqkg::{Error, Result} | 2 |
| external:serde_json::{Map, Value} | 2 |
| external:std::fs::{self, OpenOptions} | 2 |
| external:std::process::{Command, Stdio} | 2 |
| external:super::super::{finding, NextStep} | 2 |
| external:super::{safe_id, Condition, DiagnosticFinding, EvidenceStatus} | 2 |
| external:adapters | 1 |
| external:admission | 1 |
| external:algorithm_adapter | 1 |
| external:algorithm_adapter::{ | 1 |
| external:apply_ledger | 1 |
| external:builtins | 1 |
| external:context_retrieval | 1 |
| external:control | 1 |
| external:correlation | 1 |
| external:crate::context_retrieval::{ContextBundle, ContextRequest} | 1 |
| external:crate::context_retrieval::{query_scoped, ScopedQuery} | 1 |
| external:crate::control::{ | 1 |
| external:crate::control::{HealthMonitor, HealthStatus, Telemetry} | 1 |
| external:crate::engine::{Budget, CancellationToken, EngineRegistry, Scheduler, Task} | 1 |
| external:crate::engine::{ComputeEngine, EngineDescriptor, EngineOutput, EngineRequest, SwapReceipt} | 1 |
| external:crate::engine::{EngineOutput, EngineRegistry, EngineRequest} | 1 |
| external:crate::engine::{PURE_ENGINE_SLOT, PURE_INTERFACE, PURE_OPERATIONS} | 1 |
| external:crate::graph_change_set::ApplyReport | 1 |
| external:crate::graph_change_set::GraphChangeSet | 1 |
| external:crate::graph_change_set::{apply, ApplyLedger, ApplyReport, ChangeOp, GraphChangeSet} | 1 |
| external:crate::graph_change_set::{apply, ApplyReport} | 1 |
| external:crate::scoped_graph | 1 |
| external:crate::typed_dag::{DagReport, Namespace, RunState, CONTRACT} | 1 |
| external:crate::typed_dag::{GraphDomain, Namespace} | 1 |
| external:crate::typed_dag::{Namespace, RevisionToken} | 1 |
| external:crate::{DataTable, DatabaseKind, DatabaseSpec, Error, Graph, Result} | 1 |
| external:crate::{Edge, Error, Graph, Journal, Node, NodeKind, Result} | 1 |
| external:crate::{Edge, Error, Graph, Node, NodeKind, Properties, Result} | 1 |
| external:crate::{Edge, Error, Graph, Node, Result} | 1 |
| external:crate::{Edge, Node, NodeKind} | 1 |
| external:crate::{Error, Graph, Journal, JournalStatus, Result} | 1 |
| external:crate::{Error, Graph, Journal, Node, NodeKind, Result} | 1 |
| external:crate::{Error, Graph, Node, Result} | 1 |
| external:crate::{Error, Graph, NodeKind, Result} | 1 |
| external:crate::{Error, Node, NodeKind, Result} | 1 |
| external:database | 1 |
| external:database::{DataTable, DatabaseKind, DatabaseSpec} | 1 |
| external:dependency_manifest | 1 |
| external:drift | 1 |
| external:durable_dag | 1 |
| external:effects | 1 |
| external:engine | 1 |
| external:engine::{ | 1 |
| external:forecast | 1 |
| external:graph_change_set | 1 |
| external:hqkg::apply_ledger::{FileApplyLedger, DEFAULT_LOCK_TTL_MS} | 1 |
| external:hqkg::builtins::{DatabaseCompute, GraphCompute} | 1 |
| external:hqkg::context_retrieval::{query_scoped, ScopedQuery} | 1 |
| external:hqkg::control::{CoreConfig, CoreSupervisor, EnginePolicy} | 1 |
| external:hqkg::control::{HealthMonitor, MetricEvent, Outcome, Telemetry} | 1 |
| external:hqkg::control::{MetricEvent, Outcome, Telemetry} | 1 |
| external:hqkg::durable_dag::* | 1 |
| external:hqkg::engine::* | 1 |
| external:hqkg::graph_change_set::GraphChangeSet | 1 |
| external:hqkg::graph_change_set::{ | 1 |
| external:hqkg::graph_change_set::{ApplyLedger, ApplyReport, GraphChangeSet} | 1 |
| external:hqkg::graph_change_set::{apply, ApplyLedger, ApplyReport, ChangeOp, GraphChangeSet} | 1 |
| external:hqkg::graph_change_set::{apply, ApplyLedger, ApplyReport, GraphChangeSet} | 1 |
| external:hqkg::graph_change_set::{apply, ApplyLedger, GraphChangeSet} | 1 |
| external:hqkg::graph_change_set::{apply, ApplyLedger} | 1 |
| external:hqkg::import::{Exchange, Manifest} | 1 |
| external:hqkg::import::{parse, Exchange, ImportStats, Manifest} | 1 |
| external:hqkg::import::{parse, Exchange, Manifest} | 1 |
| external:hqkg::import::{parse, MAX_BYTES} | 1 |
| external:hqkg::invalidate::{ | 1 |
| external:hqkg::managed_context::project_managed | 1 |
| external:hqkg::managed_context::project_managed_graph | 1 |
| external:hqkg::managed_context::{check_managed_head, project_managed_graph} | 1 |
| external:hqkg::observability::admission::* | 1 |
| external:hqkg::observability::correlation::* | 1 |
| external:hqkg::observability::drift::* | 1 |
| external:hqkg::observability::effects::* | 1 |
| external:hqkg::observability::incidents::* | 1 |
| external:hqkg::observability::quality::* | 1 |
| external:hqkg::observability::recovery::* | 1 |
| external:hqkg::observability::synthesis::* | 1 |
| external:hqkg::observability::{ | 1 |
| external:hqkg::reconcile::{find_duplicates, find_orphans, reconciliation_plan, DuplicateSignal} | 1 |
| external:hqkg::scoped_graph::* | 1 |
| external:hqkg::scoped_graph::{gate_serve, Provenance} | 1 |
| external:hqkg::utility_adapter::UtilityCompute | 1 |
| external:hqkg::web_memory::WebMemory | 1 |
| external:hqkg::web_memory::{parse_batch, Query, RevocationRequest, WebMemory, MAX_BODY} | 1 |
| external:hqkg::{Budget, Scheduler, Task} | 1 |
| external:hqkg::{ComputeEngine, Edge, EngineRegistry, EngineRequest, Graph, Node, NodeKind} | 1 |
| external:hqkg::{ComputeEngine, EngineRegistry, EngineRequest, Graph, Node, NodeKind} | 1 |
| external:hqkg::{ComputeEngine, EngineRegistry, EngineRequest} | 1 |
| external:hqkg::{DatabaseKind, DatabaseSpec, Edge, Error, Graph, Journal, Node, NodeKind, Result} | 1 |
| external:hqkg::{DatabaseKind, DatabaseSpec, Edge, Error, Graph, Journal, Node, NodeKind} | 1 |
| external:hqkg::{DatabaseKind, DatabaseSpec} | 1 |
| external:hqkg::{Edge, Error, Graph, Journal, Node, NodeKind} | 1 |
| external:hqkg::{Edge, Graph, Journal, Node, NodeKind} | 1 |
| external:hqkg::{Edge, Graph, Node, NodeKind, Properties} | 1 |
| external:hqkg::{Edge, NodeKind} | 1 |
| external:hqkg::{EngineRegistry, EngineRequest, Error, Journal, Result} | 1 |
| external:hqkg::{EngineRegistry, EngineRequest} | 1 |
| external:hqkg::{Error, Graph, Journal, Node, NodeKind} | 1 |
| external:hqkg::{Error, Graph, Journal, Node, Result} | 1 |
| external:hqkg::{Error, Journal, NodeKind, Result} | 1 |
| external:hqkg::{Graph, Journal} | 1 |
| external:hqkg::{Graph, Node, NodeKind, Journal} | 1 |
| external:hqkg::{Graph, Node, NodeKind} | 1 |
| external:hqkg::{deserialize, serialize, Edge, Graph, Node, NodeKind} | 1 |
| external:hqkg::{serialize, Edge, Error, Graph, Journal, Node, NodeKind} | 1 |
| external:import | 1 |
| external:incidents | 1 |
| external:invalidate | 1 |
| external:journey | 1 |
| external:managed_context | 1 |
| external:node:assert | 1 |
| external:node:child_process | 1 |
| external:node:path | 1 |
| external:node:test | 1 |
| external:node:url | 1 |
| external:observability | 1 |
| external:observer | 1 |
| external:postgres::{Client, NoTls, SimpleQueryMessage} | 1 |
| external:quality | 1 |
| external:reconcile | 1 |
| external:recovery | 1 |
| external:research | 1 |
| external:rusqlite::{types::ValueRef, Connection, OpenFlags} | 1 |
| external:scoped_graph | 1 |
| external:serde_json::{json, Map, Value} | 1 |
| external:std::env | 1 |
| external:std::fmt | 1 |
| external:std::fs::OpenOptions | 1 |
| external:std::io | 1 |
| external:std::io::Write as _ | 1 |
| external:std::io::{self, BufRead, Read, Write} | 1 |
| external:std::io::{self, Cursor, Read, Seek, SeekFrom, Write} | 1 |
| external:std::io::{self, Write} | 1 |
| external:std::os::unix::fs::OpenOptionsExt | 1 |
| external:std::path::Path | 1 |
| external:std::sync::Mutex | 1 |
| external:std::sync::atomic::{AtomicBool, Ordering} | 1 |
| external:std::sync::atomic::{AtomicU64, Ordering} | 1 |
| external:std::{collections::BTreeMap, fs, path::Path} | 1 |
| external:std::{collections::{BTreeMap, BTreeSet}, fs, io::{self, Read}, path::PathBuf} | 1 |
| external:std::{fs, io::Write, path::PathBuf, time::Instant} | 1 |
| external:std::{fs, io::Write, path::{Path, PathBuf}, process::{Command, Stdio}, time::{SystemTime, UNIX_EPOCH}} | 1 |
| external:std::{fs, path::PathBuf} | 1 |
| external:super::admission::AdmissionPolicy | 1 |
| external:super::safe_id | 1 |
| external:super::super::admission::{SourceBinding, SourceRole} | 1 |
| external:super::super::finding | 1 |
| external:super::super::{Condition, EvidenceStatus, ExpectationKind} | 1 |
| external:super::{safe_id, Condition, DiagnosticFinding, EvidenceStatus, NextStep} | 1 |
| external:synthesis | 1 |
| external:typed_dag | 1 |
| external:utility_adapter | 1 |
| external:web_memory | 1 |

### Incoming

_No incoming dependencies._

## Context annotations

| Kind | File | Line | Owner | Text |
| --- | --- | --- | --- | --- |
| context | native/hqkg/src/adapters/dependency_manifest.rs | 1 | — | Optional versioned JSON manifest adapter for HQKG&#39;s std-only dependency protocol. |
| context | native/hqkg/src/adapters/research.rs | 1 | — | Data-only compute adapter exposing three research catalogs as bounded read-only queries. |
| context | native/hqkg/src/algorithm_adapter.rs | 1 | — | Algorithm-as-node adapter for HQKG&#39;s existing compute engine runtime. |
| context | native/hqkg/src/apply_ledger.rs | 75 | — | durable cross-process idempotency for HQKG change sets |
| context | native/hqkg/src/bin/hqkg-control.rs | 1 | — | Explicit operator interface to inspect/revise core config and check journal health. |
| context | native/hqkg/src/bin/hqkg-deps.rs | 1 | — | Operator inspection for versioned dependency manifests; no runtime registration. |
| context | native/hqkg/src/bin/hqkg-import.rs | 1 | — | Opt-in, bounded, journal-once importer for Repos HQ canonical graph projections. |
| context | native/hqkg/src/bin/hqkg-research.rs | 1 | — | Read-only one-command research explorer for the unified graph journal. |
| context | native/hqkg/src/bin/hqkg-web-feed.rs | 1 | — | Metadata-only web observation intake and versioned readback over HQKG journal. |
| context | native/hqkg/src/control.rs | 1 | — | HQKG&#39;s std-only operational contract: dependencies, config, telemetry, health and guarded execution. |
| context | native/hqkg/src/graph_change_set.rs | 14 | — | incremental source change sets, tombstones and lineage for HQKG (OVN-B lane 2) |
| context | native/hqkg/src/import.rs | 1 | — | Deterministic HQKGX1 JSONL importer; optional dependencies stay out of std-only kernel. |
| context | native/hqkg/src/reconcile.rs | 33 | — | orphan/duplicate detection and merge planning for HQKG (OVN-B lane 3) |
| context | native/hqkg/src/web_memory.rs | 1 | — | Incremental, source-grounded, metadata-only web observations in the existing HQKG graph. |
| context | native/hqkg/tests/apply_ledger.rs | 9 | — | durable cross-process idempotency for HQKG change sets |
| context | native/hqkg/tests/apply_ledger_locking.rs | 13 | — | cross-process writer lock for the durable apply ledger |
| context | native/hqkg/tests/pilot_vertical.rs | 41 | — | pilot vertical Rust hop: apply GraphChangeSets from the run-vertical harness and emit reports |
| context | native/hqkg/tests/reconcile.rs | 6 | — | reconciliation tests for HQKG (OVN-B lane 3) |
| context | native/hqkg/tests/web_feed_process.rs | 2 | — | Process-boundary proof: the real hqkg-web-feed binary accepts one Studio batch, ACKs it, |
| context | native/hqkg/tests/web_memory.rs | 2 | — | Recovery, dedupe, query and scale proof for browser metadata deltas. |
| context | native/hqkg/tests/web_memory_revocation.rs | 2 | — | Revocation contract for browser metadata: a revoked visit must be absent |
| invariant | native/hqkg/src/adapters/dependency_manifest.rs | 3 | — | Parsing untrusted metadata does not approve runtime execution or install anything. |
| invariant | native/hqkg/src/adapters/research.rs | 3 | — | Research data is inert metadata. This adapter never runs papers, tools, models or provider actions. |
| invariant | native/hqkg/src/algorithm_adapter.rs | 3 | — | Reuse native EngineRegistry/EngineLease; never start a parallel scheduler. |
| invariant | native/hqkg/src/algorithm_adapter.rs | 4 | — | Catalog nodes are inert research metadata until a driver is installed. |
| invariant | native/hqkg/src/algorithm_adapter.rs | 5 | — | The canonical graph stays the owner of identities and evidence. |
| invariant | native/hqkg/src/bin/hqkg-control.rs | 3 | — | No browser/provider actions; no silent recovery; CAS revision and --apply fences. |
| invariant | native/hqkg/src/bin/hqkg-import.rs | 3 | — | Never change the canonical Bun/SQLite store or activate any compute engine. |
| invariant | native/hqkg/src/bin/hqkg-import.rs | 4 | — | The applied source namespace is reported on stdout so a packaged |
| invariant | native/hqkg/src/bin/hqkg-research.rs | 3 | — | Prints data-only catalog records; never installs, sends or activates research methods. |
| invariant | native/hqkg/src/bin/hqkg-web-feed.rs | 3 | — | Never ACK before durable fsync; no provider, browser, or Host effects. |
| invariant | native/hqkg/src/context_retrieval.rs | 16 | — | Unknown or excluded seed, or a zero budget, fails closed. |
| invariant | native/hqkg/src/context_retrieval.rs | 17 | — | Items are a prefix of the ranked list; never truncated mid-item. |
| invariant | native/hqkg/src/control.rs | 3 | — | This layer wraps the existing EngineRegistry. It does not create a competing scheduler. |
| invariant | native/hqkg/src/control.rs | 4 | — | Graph metadata and research catalogs never grant provider, OS or browser permissions. |
| invariant | native/hqkg/src/import.rs | 3 | — | Data-only transport cannot install engines, approve actions or overwrite manually owned nodes. |
| invariant | native/hqkg/src/import.rs | 4 | — | Validate all transport bytes before changing the graph; one journal snapshot per accepted import. |
| invariant | native/hqkg/src/invalidate.rs | 60 | — | A hit must be provably current: epoch equality plus every |
| invariant | native/hqkg/src/utility_adapter.rs | 3 | — | No sockets, SQL, filesystem access, external libraries, or persistent mutable state. |
| invariant | native/hqkg/src/utility_adapter.rs | 4 | — | Use the existing ComputeEngine/EngineRegistry; never create a second scheduler. |
| invariant | native/hqkg/src/web_memory.rs | 3 | — | Acknowledgements follow durable writes; this module never controls a browser. |
| invariant | native/hqkg/tests/bench_vertical.rs | 22 | — | No src/ changes: landed modules are consumed via public API only. |
| invariant | native/hqkg/tests/web_feed_process.rs | 5 | — | No injected spawn, no mocked ingress: this test only talks to the built binary. |
| invariant | native/hqkg/tests/web_memory_revocation.rs | 6 | — | Revocation is an additive tombstone in the same journal; it never rewrites |
| owner | native/hqkg/src/adapters/dependency_manifest.rs | 2 | repos-hq | repos-hq |
| owner | native/hqkg/src/adapters/research.rs | 2 | repos-hq | repos-hq |
| owner | native/hqkg/src/algorithm_adapter.rs | 2 | hq-rust-knowledge-graph | hq-rust-knowledge-graph |
| owner | native/hqkg/src/apply_ledger.rs | 76 | hq-agent | hq-agent |
| owner | native/hqkg/src/bin/hqkg-control.rs | 2 | repos-hq | repos-hq |
| owner | native/hqkg/src/bin/hqkg-deps.rs | 2 | repos-hq | repos-hq |
| owner | native/hqkg/src/bin/hqkg-import.rs | 2 | repos-hq | repos-hq |
| owner | native/hqkg/src/bin/hqkg-research.rs | 2 | repos-hq | repos-hq |
| owner | native/hqkg/src/bin/hqkg-web-feed.rs | 2 | repos-hq | repos-hq |
| owner | native/hqkg/src/context_retrieval.rs | 12 | hq-agent | hq-agent |
| owner | native/hqkg/src/control.rs | 2 | repos-hq | repos-hq |
| owner | native/hqkg/src/graph_change_set.rs | 15 | hq-agent | hq-agent |
| owner | native/hqkg/src/import.rs | 2 | repos-hq | repos-hq |
| owner | native/hqkg/src/invalidate.rs | 55 | hq-agent | hq-agent |
| owner | native/hqkg/src/reconcile.rs | 34 | hq-agent | hq-agent |
| owner | native/hqkg/src/utility_adapter.rs | 2 | repos-hq | repos-hq |

---

[HQ wiki](../../index.md) · [Symbols](../../symbols.md) · [Dependency graph](../../graph.md) · [Documentation](../../docs.md) · [Changes](../../changes.md) · [Open tasks](../../todos.md) · [Deprecated](../../deprecated.md) · [Agent annotation protocol](../../protocol.md) · [Glossary](../../glossary.md) · [Using HQ](../../context.md) · [Capabilities](../../capabilities.md) · [Search index](../../search.json) · [Browser view](../../index.html)
