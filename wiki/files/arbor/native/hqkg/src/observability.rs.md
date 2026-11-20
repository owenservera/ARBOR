# File: native/hqkg/src/observability.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/src/observability.rs |
| Language | Rust |
| Kind | source |
| Size | 44786 B |
| Lines | 1267 |
| Hash | 3419d602b3d8 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| admission | module | 9 | yes | pub mod admission; |
| correlation | module | 10 | yes | pub mod correlation; |
| drift | module | 11 | yes | pub mod drift; |
| effects | module | 12 | yes | pub mod effects; |
| forecast | module | 13 | yes | pub mod forecast; |
| incidents | module | 14 | yes | pub mod incidents; |
| journey | module | 15 | yes | pub mod journey; |
| observer | module | 16 | yes | pub mod observer; |
| quality | module | 17 | yes | pub mod quality; |
| recovery | module | 18 | yes | pub mod recovery; |
| synthesis | module | 19 | yes | pub mod synthesis; |
| CONTRACT | const | 21 | yes | pub const CONTRACT: &amp;str = &quot;vivim.rust-observability/1&quot;; |
| MAX_EVENTS | const | 22 | no | const MAX_EVENTS: usize = 4_096; |
| MAX_EVIDENCE_REFS | const | 23 | no | const MAX_EVIDENCE_REFS: usize = 16; |
| EvidenceGrade | enum | 26 | yes | pub enum EvidenceGrade { |
| CommandStage | enum | 34 | yes | pub enum CommandStage { |
| Signal | enum | 43 | yes | pub enum Signal { |
| Observation | struct | 54 | yes | pub struct Observation { |
| ExpectationKind | enum | 68 | yes | pub enum ExpectationKind { |
| Expectation | struct | 75 | yes | pub struct Expectation { |
| Condition | enum | 83 | yes | pub enum Condition { |
| EvidenceStatus | enum | 91 | yes | pub enum EvidenceStatus { |
| NextStep | enum | 99 | yes | pub enum NextStep { |
| DiagnosticFinding | struct | 106 | yes | pub struct DiagnosticFinding { |
| finding | function | 116 | no | fn finding( condition: Condition, evidence_status: EvidenceStatus, code: &amp;&#39;static str, ids: &amp;[&amp;str], |
| safe_id | function | 138 | no | fn safe_id(v: &amp;str) -&gt; bool { |
| fresh | function | 144 | no | fn fresh(at: u64, now: u64, max_age: u64) -&gt; bool { |
| diagnose | function | 151 | yes | pub fn diagnose( exp: &amp;Expectation, input: &amp;[Observation], now_ms: u64, ) -&gt; Result&lt;DiagnosticFinding&gt; { |
| diagnose_metric_window | function | 473 | yes | pub fn diagnose_metric_window( telemetry: &amp;Telemetry, slot: &amp;str, minimum_samples: usize, latency_budget_ms: u128, |
| MetricCursor | struct | 529 | yes | pub struct MetricCursor { |
| at_current | method | 533 | yes | pub fn at_current(telemetry: &amp;Telemetry) -&gt; Self { |
| diagnose_metric_window_since | function | 542 | yes | pub fn diagnose_metric_window_since( telemetry: &amp;Telemetry, slot: &amp;str, cursor: MetricCursor, minimum_samples: usize, |
| QualityWindow | struct | 617 | yes | pub struct QualityWindow { |
| diagnose_quality | function | 624 | yes | pub fn diagnose_quality( baseline: &amp;QualityWindow, candidate: &amp;QualityWindow, minimum_trials: u32, permitted_drop_bps: u32, |
| diagnose_core_health | function | 678 | yes | pub fn diagnose_core_health( monitor: &amp;HealthMonitor, slot: &amp;str, was_observed: bool, ) -&gt; Result&lt;DiagnosticFinding&gt; { |
| CAUSAL_CONTRACT | const | 725 | yes | pub const CAUSAL_CONTRACT: &amp;str = &quot;vivim.rust-causal-attribution/1&quot;; |
| MAX_HYPOTHESES | const | 726 | no | const MAX_HYPOTHESES: usize = 128; |
| MAX_PREDICTIONS | const | 727 | no | const MAX_PREDICTIONS: usize = 32; |
| Hypothesis | struct | 732 | yes | pub struct Hypothesis { |
| Discrimination | struct | 740 | yes | pub struct Discrimination { |
| canonical_diagnostic_code | function | 745 | no | fn canonical_diagnostic_code(code: &amp;str) -&gt; bool { |
| validate_hypotheses | function | 769 | no | fn validate_hypotheses&lt;&#39;a&gt;( exp: &amp;Expectation, hypotheses: impl IntoIterator&lt;Item = &amp;&#39;a Hypothesis&gt;, ) -&gt; Result&lt;()&gt; { |
| validate_causal_observations | function | 796 | no | fn validate_causal_observations( exp: &amp;Expectation, input: &amp;[Observation], now_ms: u64, ) -&gt; Result&lt;DiagnosticFinding&gt; { |
| discriminate_evidence | function | 818 | yes | pub fn discriminate_evidence( a: &amp;Hypothesis, b: &amp;Hypothesis, exp: &amp;Expectation, input: &amp;[Observation], |
| CausalLink | struct | 869 | yes | pub struct CausalLink { |
| RootCause | struct | 885 | yes | pub struct RootCause { |
| RootCauseResult | enum | 895 | yes | pub enum RootCauseResult { |
| find_root_cause | function | 906 | yes | pub fn find_root_cause( exp: &amp;Expectation, input: &amp;[Observation], now_ms: u64, hypotheses: &amp;[Hypothesis], |
| tests | module | 988 | no | mod tests { |
| obs | function | 990 | no | fn obs(id: &amp;str, signal: Signal) -&gt; Observation { |
| exp_command | function | 1002 | no | fn exp_command(required: CommandStage) -&gt; Expectation { |
| hypothesis | function | 1010 | no | fn hypothesis(id: &amp;&#39;static str, codes: &amp;[&amp;&#39;static str]) -&gt; Hypothesis { |
| link | function | 1018 | no | fn link(id: &amp;str, hypothesis_id: &amp;&#39;static str) -&gt; CausalLink { |
| discriminator_present_under_only_one_hypothesis_is_reported | function | 1034 | no | fn discriminator_present_under_only_one_hypothesis_is_reported() { |
| observation_under_both_hypotheses_is_not_a_discriminator | function | 1054 | no | fn observation_under_both_hypotheses_is_not_a_discriminator() { |
| explicit_failure_yields_confirmed_root_cause_with_evidence_ids | function | 1080 | no | fn explicit_failure_yields_confirmed_root_cause_with_evidence_ids() { |
| no_confirmed_failure_returns_unresolved_hypotheses | function | 1108 | no | fn no_confirmed_failure_returns_unresolved_hypotheses() { |
| causal_regression_untrusted_observation_is_not_discriminating_evidence | function | 1130 | no | fn causal_regression_untrusted_observation_is_not_discriminating_evidence() { |
| causal_regression_invalid_discriminator_id_is_rejected | function | 1147 | no | fn causal_regression_invalid_discriminator_id_is_rejected() { |
| causal_regression_discriminator_budget_is_enforced | function | 1165 | no | fn causal_regression_discriminator_budget_is_enforced() { |
| competing_causal_links_remain_unresolved | function | 1181 | no | fn competing_causal_links_remain_unresolved() { |
| stale_weak_wrong_revision_or_incomplete_link_never_confirms | function | 1197 | no | fn stale_weak_wrong_revision_or_incomplete_link_never_confirms() { |
| discriminator_rejects_duplicate_future_sequence_and_vocabulary_errors | function | 1221 | no | fn discriminator_rejects_duplicate_future_sequence_and_vocabulary_errors() { |
| healthy_and_conflicting_diagnostics_never_construct_root_cause | function | 1251 | no | fn healthy_and_conflicting_diagnostics_never_construct_root_cause() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| crate::control::{HealthMonitor, HealthStatus, Telemetry} | use | 5 | external |
| crate::{Error, Result} | use | 6 | external |
| std::collections::{BTreeMap, BTreeSet} | use | 7 | external |
| admission | use | 9 | external |
| correlation | use | 10 | external |
| drift | use | 11 | external |
| effects | use | 12 | external |
| forecast | use | 13 | external |
| incidents | use | 14 | external |
| journey | use | 15 | external |
| observer | use | 16 | external |
| quality | use | 17 | external |
| recovery | use | 18 | external |
| synthesis | use | 19 | external |
| super::* | use | 989 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! Lane C: native, std-only, effect-free diagnostic reasoning inside HQKG.
//! This is not an observer daemon, telemetry writer, recovery executor, or Host status API.
//! Trusted host-side adapters retain authorization and source-verification responsibilities.
//! A hash, an ID or a reported grade alone does not authenticate a device or provider event.
use crate::control::{HealthMonitor, HealthStatus, Telemetry};
use crate::{Error, Result};
use std::collections::{BTreeMap, BTreeSet};

pub mod admission;
pub mod correlation;
pub mod drift;
pub mod effects;
pub mod forecast;
pub mod incidents;
pub mod journey;
pub mod observer;
pub mod quality;
pub mod recovery;
pub mod synthesis;

pub const CONTRACT: &str = "vivim.rust-observability/1";
const MAX_EVENTS: usize = 4_096;
const MAX_EVIDENCE_REFS: usize = 16;

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub enum EvidenceGrade {
    UntrustedHint,
    LocalMeasured,
    SourceVerified,
    IndependentVerified,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub enum CommandStage {
    Accepted,
    Authorized,
    SendObserved,
    ReplyObserved,
    PhoneDisplayed,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Signal {
    Command(CommandStage),
    ExplicitFailure,
    ObserverAvailable,
    ObserverUnavailable,
    ExpectedOffline,
    WorldHead(u64),
    DeviceHead(u64),
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Observation {
    pub evidence_id: String,
    pub subject: String,
    pub producer: String,
    pub producer_epoch: String,
    pub producer_sequence: u64,
    /// Milliseconds on the same clock supplied to diagnose().
    pub observed_ms: u64,
    /// Asserted by an already trusted adapter; NOT self-asserted by a browser or phone.
    pub grade: EvidenceGrade,
    pub signal: Signal,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ExpectationKind {
    Command(CommandStage),
    RevisionParity,
    ObserverLive,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Expectation {
    pub subject: String,
    pub kind: ExpectationKind,
    pub deadline_ms: u64,
    pub freshness_ms: u64,
}
```

_First 80 of 1268 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
