# File: native/hqkg/src/observability/effects.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | native/hqkg/src/observability/effects.rs |
| Language | Rust |
| Kind | source |
| Size | 5215 B |
| Lines | 162 |
| Hash | 55eebd3e1093 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| EffectKind | enum | 8 | yes | pub enum EffectKind { |
| EffectClaim | struct | 16 | yes | pub struct EffectClaim&lt;&#39;a&gt; { |
| audit_effect_uniqueness | function | 25 | yes | pub fn audit_effect_uniqueness( command_id: &amp;str, kind: EffectKind, claims: &amp;[EffectClaim&lt;&#39;_&gt;], ) -&gt; Result&lt;DiagnosticFinding&gt; { |
| tests | module | 110 | no | mod tests { |
| receipt | function | 112 | no | fn receipt&lt;&#39;a&gt;(id: &amp;&#39;a str, effect: &amp;&#39;a str, verified: bool) -&gt; EffectClaim&lt;&#39;a&gt; { |
| same_effect_multiple_acks_are_idempotent | function | 122 | no | fn same_effect_multiple_acks_are_idempotent() { |
| two_distinct_verified_effects_are_confirmed_violation | function | 132 | no | fn two_distinct_verified_effects_are_confirmed_violation() { |
| hint_cannot_certify_the_second_effect | function | 144 | no | fn hint_cannot_certify_the_second_effect() { |
| nothing_observed_does_not_mean_no_effect | function | 154 | no | fn nothing_observed_does_not_mean_no_effect() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| super::{finding, safe_id, Condition, DiagnosticFinding, EvidenceStatus, NextStep} | use | 3 | external |
| crate::{Error, Result} | use | 4 | external |
| std::collections::{BTreeMap, BTreeSet} | use | 5 | external |
| super::* | use | 111 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! Detects duplicate Host-owned effects from authenticated durable receipts.
//! Repeated acknowledgement of the SAME effect is not a second send. Never retry.
use super::{finding, safe_id, Condition, DiagnosticFinding, EvidenceStatus, NextStep};
use crate::{Error, Result};
use std::collections::{BTreeMap, BTreeSet};

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub enum EffectKind {
    ProviderSend,
    WorldPublish,
    FileWrite,
    OtherHostEffect,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct EffectClaim<'a> {
    pub command_id: &'a str,
    pub effect_id: &'a str,
    pub receipt_id: &'a str,
    pub kind: EffectKind,
    /// True only when the Host source adapter authenticated a durable effect claim.
    pub source_verified: bool,
}

pub fn audit_effect_uniqueness(
    command_id: &str,
    kind: EffectKind,
    claims: &[EffectClaim<'_>],
) -> Result<DiagnosticFinding> {
    if !safe_id(command_id) || claims.len() > 4_096 {
        return Err(Error::Invalid(
            "invalid effect audit budget or command".into(),
        ));
    }
    let mut effect_refs: BTreeMap<&str, BTreeSet<&str>> = BTreeMap::new();
    let mut hint = false;
    let mut seen_receipts = BTreeSet::new();
    for claim in claims {
        if !safe_id(claim.command_id)
            || !safe_id(claim.effect_id)
            || !safe_id(claim.receipt_id)
            || !seen_receipts.insert(claim.receipt_id)
        {
            return Err(Error::Invalid(
                "invalid or duplicate effect receipt id".into(),
            ));
        }
        if claim.command_id != command_id || claim.kind != kind {
            continue;
        }
        if claim.source_verified {
            effect_refs
                .entry(claim.effect_id)
                .or_default()
                .insert(claim.receipt_id);
        } else {
            hint = true;
        }
    }
    if effect_refs.len() > 1 {
        let refs = effect_refs
            .values()
            .filter_map(|set| set.iter().next())
            .take(16)
            .copied()
            .collect::<Vec<_>>();
        return Ok(finding(
            Condition::Failed,
            EvidenceStatus::Confirmed,
            "multiple_verified_host_effects",
            &refs,
            &[],
            NextStep::OperatorReview,
        ));
    }
    if hint {
        return Ok(finding(
            Condition::Unknown,
            EvidenceStatus::Insufficient,
            "effect_claims_not_all_verified",
```

_First 80 of 163 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
