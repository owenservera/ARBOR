# File: core/programmability/src/lib.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | core/programmability/src/lib.rs |
| Language | Rust |
| Kind | source |
| Size | 20164 B |
| Lines | 480 |
| Hash | 2290c8e0d635 |
| Test | no |
| Generated | no |
| Component | core |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| wire | module | 10 | yes | pub mod wire; |
| lineage | module | 11 | no | mod lineage; |
| SCHEMA | const | 13 | yes | pub const SCHEMA: &amp;str = &quot;vivim.native-program/1&quot;; |
| MAX_STEPS | const | 14 | yes | pub const MAX_STEPS: usize = 64; |
| MAX_INPUTS | const | 15 | yes | pub const MAX_INPUTS: usize = 64; |
| MAX_DEPENDENCIES | const | 16 | yes | pub const MAX_DEPENDENCIES: usize = 64; |
| HQKG_DAG_CONTRACT | const | 22 | yes | pub const HQKG_DAG_CONTRACT: &amp;str = &quot;hqkg.typed-dag/1&quot;; |
| HQKG_PURE_INTERFACE | const | 23 | yes | pub const HQKG_PURE_INTERFACE: &amp;str = &quot;hqkg.transform.pure/1&quot;; |
| HQKG_PURE_ENGINE_SLOT | const | 24 | yes | pub const HQKG_PURE_ENGINE_SLOT: &amp;str = &quot;vlang.pure&quot;; |
| DataClass | enum | 28 | yes | pub enum DataClass { Public, Internal, Private, Sensitive, Secret } |
| Risk | enum | 31 | yes | pub enum Risk { R0, R1, R2, R3 } |
| SourceRef | struct | 34 | yes | pub struct SourceRef { |
| TransformKind | enum | 43 | yes | pub enum TransformKind { |
| TransformStep | struct | 55 | yes | pub struct TransformStep { |
| Program | struct | 67 | yes | pub struct Program { |
| PolicyLimits | struct | 78 | yes | pub struct PolicyLimits { |
| Refusal | enum | 89 | yes | pub enum Refusal { |
| ValidatedProgram | struct | 111 | yes | pub struct ValidatedProgram { |
| identifier | function | 122 | no | fn identifier(s: &amp;str) -&gt; bool { |
| digest_ok | function | 127 | no | fn digest_ok(s: &amp;str) -&gt; bool { |
| validate_program | function | 136 | yes | pub fn validate_program(program: &amp;Program, policy: &amp;PolicyLimits) -&gt; Result&lt;ValidatedProgram, Refusal&gt; { |
| visit | function | 191 | no | fn visit&lt;&#39;a&gt;( id: &amp;&#39;a str, index: &amp;BTreeMap&lt;&amp;&#39;a str, &amp;&#39;a TransformStep&gt;, visited: &amp;mut BTreeSet&lt;&amp;&#39;a str&gt;, visiting: &amp;mut BTreeSet&lt;&amp;&#39;a str&gt;, |
| pure_operation | method | 242 | yes | pub fn pure_operation(&amp;self) -&gt; Option&lt;&amp;&#39;static str&gt; { |
| ProgramIdentity | struct | 258 | yes | pub struct ProgramIdentity { |
| PureSourceBinding | struct | 266 | yes | pub struct PureSourceBinding { |
| PureTransformStep | struct | 276 | yes | pub struct PureTransformStep { |
| PureTransformProgram | struct | 291 | yes | pub struct PureTransformProgram { |
| to_pure_transform_program | function | 301 | yes | pub fn to_pure_transform_program( program: &amp;Program, policy: &amp;PolicyLimits, ) -&gt; Result&lt;PureTransformProgram, Refusal&gt; { |
| tests | module | 354 | no | mod tests { |
| limits | function | 356 | no | fn limits() -&gt; PolicyLimits { |
| step | function | 364 | no | fn step(id: &amp;str, deps: &amp;[&amp;str]) -&gt; TransformStep { |
| program | function | 374 | no | fn program(steps: Vec&lt;TransformStep&gt;) -&gt; Program { |
| sorted_dag_is_stable_and_never_authorizes | function | 379 | no | fn sorted_dag_is_stable_and_never_authorizes() { |
| missing_or_cyclic_dependencies_refused | function | 388 | no | fn missing_or_cyclic_dependencies_refused() { |
| duplicate_ids_refused | function | 393 | no | fn duplicate_ids_refused() { |
| stale_policy_fails_closed | function | 397 | no | fn stale_policy_fails_closed() { |
| risk_cannot_exceed_policy | function | 403 | no | fn risk_cannot_exceed_policy() { |
| class_cannot_exceed_policy | function | 408 | no | fn class_cannot_exceed_policy() { |
| destination_requires_allowlist | function | 413 | no | fn destination_requires_allowlist() { |
| effects_are_inert_and_default_refused | function | 418 | no | fn effects_are_inert_and_default_refused() { |
| source_taint_cannot_be_laundered_into_public | function | 423 | no | fn source_taint_cannot_be_laundered_into_public() { |
| dependency_taint_cannot_be_downgraded | function | 428 | no | fn dependency_taint_cannot_be_downgraded() { |
| malformed_sha_refused | function | 433 | no | fn malformed_sha_refused() { |
| pure_translation_preserves_identity_and_dependencies | function | 438 | no | fn pure_translation_preserves_identity_and_dependencies() { |
| effect_candidates_never_become_pure_steps | function | 456 | no | fn effect_candidates_never_become_pure_steps() { |
| unvalidated_programs_are_not_translated | function | 466 | no | fn unvalidated_programs_are_not_translated() { |
| pure_contract_literals_match_the_hqkg_engine_contract | function | 473 | no | fn pure_contract_literals_match_the_hqkg_engine_contract() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| std::collections::{BTreeMap, BTreeSet} | use | 8 | external |
| wire | use | 10 | external |
| lineage | use | 11 | external |
| super::* | use | 355 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! VIVIM product-native programmability primitives.
//!
//! PURE LIBRARY ONLY: no network, storage, timers, grants, Host effects,
//! scheduling, code loading or provider operations. This crate accepts
//! already-authenticated caller-supplied metadata; it does not authenticate it.
//! An accepted program is an INERT candidate, never an authorization token.

use std::collections::{BTreeMap, BTreeSet};

pub mod wire;
mod lineage;

pub const SCHEMA: &str = "vivim.native-program/1";
pub const MAX_STEPS: usize = 64;
pub const MAX_INPUTS: usize = 64;
pub const MAX_DEPENDENCIES: usize = 64;

/// Contract identifiers of the existing HQKG typed DAG this translation targets
/// (`native/hqkg/src/typed_dag.rs` + `native/hqkg/src/engine.rs`). This crate
/// stays dependency-free, so the literals are mirrored here and asserted equal
/// on both sides by their tests.
pub const HQKG_DAG_CONTRACT: &str = "hqkg.typed-dag/1";
pub const HQKG_PURE_INTERFACE: &str = "hqkg.transform.pure/1";
pub const HQKG_PURE_ENGINE_SLOT: &str = "vlang.pure";

/// Classification is ordered, so allowed disclosure never expands implicitly.
#[derive(Clone, Copy, Debug, Eq, PartialEq, Ord, PartialOrd)]
pub enum DataClass { Public, Internal, Private, Sensitive, Secret }

#[derive(Clone, Copy, Debug, Eq, PartialEq, Ord, PartialOrd)]
pub enum Risk { R0, R1, R2, R3 }

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SourceRef {
    pub source_id: String,
    pub revision: u64,
    /// SHA-256 hex of exact source bytes, NOT source authenticity.
    pub digest: String,
    pub data_class: DataClass,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum TransformKind {
    Normalize,
    SelectContext,
    Interpret,
    Compile,
    Evaluate,
    Project,
    /// Non-executing description of an effect to be submitted to Host.
    EffectCandidate,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TransformStep {
    pub id: String,
    pub kind: TransformKind,
    pub dependencies: Vec<String>,
    pub inputs: Vec<SourceRef>,
    pub output_data_class: DataClass,
    pub risk: Risk,
    /// Absent means internal local-only output, never implied provider access.
    pub destination: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Program {
    pub id: String,
    pub revision: u64,
    pub policy_id: String,
    pub policy_revision: u64,
    pub steps: Vec<TransformStep>,
}

/// Caller must supply CURRENT policy after checking owner, revocation & grants.
/// This snapshot is not permission to disclose or execute.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PolicyLimits {
    pub id: String,
    pub revision: u64,
```

_First 80 of 481 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
