# Module: arbor/core

> Generated 2026-11-19 · 7 files · 66 symbols

## Files

| File | Language | Lines | Symbols |
| --- | --- | --- | --- |
| [core/programmability/Cargo.toml](../../files/arbor/core/programmability/Cargo.toml.md) | TOML | 16 | 0 |
| [core/programmability/GRAPH-INTEGRATION.md](../../files/arbor/core/programmability/GRAPH-INTEGRATION.md.md) | Markdown | 32 | 0 |
| [core/programmability/README.md](../../files/arbor/core/programmability/README.md.md) | Markdown | 20 | 0 |
| [core/programmability/src/bin/vivim-program-validate.rs](../../files/arbor/core/programmability/src/bin/vivim-program-validate.rs.md) | Rust | 16 | 1 |
| [core/programmability/src/lib.rs](../../files/arbor/core/programmability/src/lib.rs.md) | Rust | 480 | 47 |
| [core/programmability/src/lineage.rs](../../files/arbor/core/programmability/src/lineage.rs.md) | Rust | 79 | 5 |
| [core/programmability/src/wire.rs](../../files/arbor/core/programmability/src/wire.rs.md) | Rust | 170 | 13 |

## Symbols

| Symbol | Kind | Exported | Line |
| --- | --- | --- | --- |
| [DataClass](../../files/arbor/core/programmability/src/lib.rs.md) | enum | yes | 28 |
| [HQKG_DAG_CONTRACT](../../files/arbor/core/programmability/src/lib.rs.md) | const | yes | 22 |
| [HQKG_PURE_ENGINE_SLOT](../../files/arbor/core/programmability/src/lib.rs.md) | const | yes | 24 |
| [HQKG_PURE_INTERFACE](../../files/arbor/core/programmability/src/lib.rs.md) | const | yes | 23 |
| [MAX_DEPENDENCIES](../../files/arbor/core/programmability/src/lib.rs.md) | const | yes | 16 |
| [MAX_INPUTS](../../files/arbor/core/programmability/src/lib.rs.md) | const | yes | 15 |
| [MAX_STEPS](../../files/arbor/core/programmability/src/lib.rs.md) | const | yes | 14 |
| [PolicyLimits](../../files/arbor/core/programmability/src/lib.rs.md) | struct | yes | 78 |
| [Program](../../files/arbor/core/programmability/src/lib.rs.md) | struct | yes | 67 |
| [ProgramIdentity](../../files/arbor/core/programmability/src/lib.rs.md) | struct | yes | 258 |
| [PureSourceBinding](../../files/arbor/core/programmability/src/lib.rs.md) | struct | yes | 266 |
| [PureTransformProgram](../../files/arbor/core/programmability/src/lib.rs.md) | struct | yes | 291 |
| [PureTransformStep](../../files/arbor/core/programmability/src/lib.rs.md) | struct | yes | 276 |
| [Refusal](../../files/arbor/core/programmability/src/lib.rs.md) | enum | yes | 89 |
| [Request](../../files/arbor/core/programmability/src/wire.rs.md) | struct | no | 12 |
| [Risk](../../files/arbor/core/programmability/src/lib.rs.md) | enum | yes | 31 |
| [SCHEMA](../../files/arbor/core/programmability/src/lib.rs.md) | const | yes | 13 |
| [SCHEMA](../../files/arbor/core/programmability/src/lineage.rs.md) | const | yes | 8 |
| [SourceRef](../../files/arbor/core/programmability/src/lib.rs.md) | struct | yes | 34 |
| [TransformKind](../../files/arbor/core/programmability/src/lib.rs.md) | enum | yes | 43 |
| [TransformStep](../../files/arbor/core/programmability/src/lib.rs.md) | struct | yes | 55 |
| [ValidatedProgram](../../files/arbor/core/programmability/src/lib.rs.md) | struct | yes | 111 |
| [WirePolicy](../../files/arbor/core/programmability/src/wire.rs.md) | struct | no | 19 |
| [WireProgram](../../files/arbor/core/programmability/src/wire.rs.md) | struct | no | 15 |
| [WireSource](../../files/arbor/core/programmability/src/wire.rs.md) | struct | no | 28 |
| [WireStep](../../files/arbor/core/programmability/src/wire.rs.md) | struct | no | 24 |
| [class_cannot_exceed_policy](../../files/arbor/core/programmability/src/lib.rs.md) | function | no | 408 |
| [dependency_taint_cannot_be_downgraded](../../files/arbor/core/programmability/src/lib.rs.md) | function | no | 428 |
| [destination_requires_allowlist](../../files/arbor/core/programmability/src/lib.rs.md) | function | no | 413 |
| [digest_ok](../../files/arbor/core/programmability/src/lib.rs.md) | function | no | 127 |
| [duplicate_ids_refused](../../files/arbor/core/programmability/src/lib.rs.md) | function | no | 393 |
| [effect_candidates_never_become_pure_steps](../../files/arbor/core/programmability/src/lib.rs.md) | function | no | 456 |
| [effects_are_inert_and_default_refused](../../files/arbor/core/programmability/src/lib.rs.md) | function | no | 418 |
| [identifier](../../files/arbor/core/programmability/src/lib.rs.md) | function | no | 122 |
| [kind](../../files/arbor/core/programmability/src/wire.rs.md) | function | no | 38 |
| [limits](../../files/arbor/core/programmability/src/lib.rs.md) | function | no | 356 |
| [lineage](../../files/arbor/core/programmability/src/lib.rs.md) | module | no | 11 |
| [main](../../files/arbor/core/programmability/src/bin/vivim-program-validate.rs.md) | function | no | 4 |
| [malformed_sha_refused](../../files/arbor/core/programmability/src/lib.rs.md) | function | no | 433 |
| [missing_or_cyclic_dependencies_refused](../../files/arbor/core/programmability/src/lib.rs.md) | function | no | 388 |
| [name](../../files/arbor/core/programmability/src/wire.rs.md) | function | no | 86 |
| [no_user_content_or_grants_are_exported](../../files/arbor/core/programmability/src/lineage.rs.md) | function | no | 63 |
| [opaque](../../files/arbor/core/programmability/src/lineage.rs.md) | function | no | 9 |
| [parse](../../files/arbor/core/programmability/src/wire.rs.md) | function | no | 47 |
| [program](../../files/arbor/core/programmability/src/lib.rs.md) | function | no | 374 |
| [project](../../files/arbor/core/programmability/src/lineage.rs.md) | function | yes | 19 |
| [pure_contract_literals_match_the_hqkg_engine_contract](../../files/arbor/core/programmability/src/lib.rs.md) | function | no | 473 |
| [pure_operation](../../files/arbor/core/programmability/src/lib.rs.md) | method | yes | 242 |
| [pure_translation_preserves_identity_and_dependencies](../../files/arbor/core/programmability/src/lib.rs.md) | function | no | 438 |
| [refuse](../../files/arbor/core/programmability/src/wire.rs.md) | function | no | 106 |
| [risk](../../files/arbor/core/programmability/src/wire.rs.md) | function | no | 34 |
| [risk_cannot_exceed_policy](../../files/arbor/core/programmability/src/lib.rs.md) | function | no | 403 |
| [sorted_dag_is_stable_and_never_authorizes](../../files/arbor/core/programmability/src/lib.rs.md) | function | no | 379 |
| [source_taint_cannot_be_laundered_into_public](../../files/arbor/core/programmability/src/lib.rs.md) | function | no | 423 |
| [stale_policy_fails_closed](../../files/arbor/core/programmability/src/lib.rs.md) | function | no | 397 |
| [step](../../files/arbor/core/programmability/src/lib.rs.md) | function | no | 364 |
| [tests](../../files/arbor/core/programmability/src/lib.rs.md) | module | no | 354 |
| [tests](../../files/arbor/core/programmability/src/lineage.rs.md) | module | no | 59 |
| [tests](../../files/arbor/core/programmability/src/wire.rs.md) | module | no | 132 |
| [to_pure_transform_program](../../files/arbor/core/programmability/src/lib.rs.md) | function | yes | 301 |
| [unvalidated_programs_are_not_translated](../../files/arbor/core/programmability/src/lib.rs.md) | function | no | 466 |
| [validate_json](../../files/arbor/core/programmability/src/wire.rs.md) | function | yes | 112 |
| [validate_program](../../files/arbor/core/programmability/src/lib.rs.md) | function | yes | 136 |
| [visit](../../files/arbor/core/programmability/src/lib.rs.md) | function | no | 191 |
| [wire](../../files/arbor/core/programmability/src/lib.rs.md) | module | yes | 10 |
| [wire](../../files/arbor/core/programmability/src/wire.rs.md) | function | no | 134 |

## Dependencies

### Outgoing

| Target | Imports |
| --- | --- |
| external:super::* | 3 |
| external:crate::{DataClass, PolicyLimits, Program, Refusal, Risk, SourceRef, | 1 |
| external:crate::{DataClass,TransformKind,TransformStep,Risk,SourceRef} | 1 |
| external:crate::{Program,ValidatedProgram} | 1 |
| external:lineage | 1 |
| external:serde::Deserialize | 1 |
| external:serde_json::{json, Value} | 1 |
| external:serde_json::{json,Value} | 1 |
| external:sha2::{Digest,Sha256} | 1 |
| external:std::collections::BTreeSet | 1 |
| external:std::collections::{BTreeMap, BTreeSet} | 1 |
| external:std::collections::{BTreeMap,BTreeSet} | 1 |
| external:std::io::{self, Read, Write} | 1 |
| external:wire | 1 |

### Incoming

_No incoming dependencies._

## Context annotations

_No context annotations in this module._

---

[HQ wiki](../../index.md) · [Symbols](../../symbols.md) · [Dependency graph](../../graph.md) · [Documentation](../../docs.md) · [Changes](../../changes.md) · [Open tasks](../../todos.md) · [Deprecated](../../deprecated.md) · [Agent annotation protocol](../../protocol.md) · [Glossary](../../glossary.md) · [Using HQ](../../context.md) · [Capabilities](../../capabilities.md) · [Search index](../../search.json) · [Browser view](../../index.html)
