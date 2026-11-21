//! Native, inert revision-fenced actor composer proposals. Host remains the only authority.
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::BTreeSet;
use crate::live_system::{
    ChangeEvent, EditCandidate, Freshness, LiveSystemState, RegionKind,
};

pub const MAX_DRAFT_BYTES: usize = 4_000;
pub const PROPOSAL_SCHEMA: &str = "vivim.agent-composer-proposal/1";

/// This identity comes from an already authenticated Host context; a user
/// payload cannot create or grant it. Host MUST recheck live authorization.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ActorContext {
    pub actor_id: String,
    pub allowed_regions: BTreeSet<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum DraftOperation {
    Replace,
    Append,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct DraftIntent {
    pub epoch: String,
    pub region_id: String,
    pub pointer: String,
    pub expected_sequence: u64,
    pub expected_view_revision: u64,
    pub expected_source_revision: u64,
    pub correlation_id: String,
    pub operation: DraftOperation,
    pub text: String,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct DraftProposal {
    pub schema: String,
    pub actor_id: String,
    pub candidate: EditCandidate,
    /// A proposed edit is never an authority token or Host receipt.
    pub effect_performed: bool,
    pub execution_authorized: bool,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum DraftError {
    InvalidActor,
    ScopeDenied,
    InvalidIntent,
    WrongEpoch,
    Stale,
    MissingRegion,
    NotCurrent,
    WrongRegionKind,
    NotWritable,
    DraftTooLarge,
    NoChange,
    CoreRefused,
    UnverifiedOutcome,
}

fn identifier_ok(s: &str) -> bool {
    !s.is_empty() && s.len() <= 128 && s.bytes().all(|b| {
        b.is_ascii_alphanumeric() || matches!(b, b'.' | b':' | b'_' | b'-')
    })
}

/// Generates ONE inert edit by using the EXISTING LiveSystemState::admit_edit.
/// Never bypass this admission with an ad-hoc JSON mutation/DOM command.
pub fn prepare_draft(
    state: &LiveSystemState,
    actor: &ActorContext,
    intent: &DraftIntent,
) -> Result<DraftProposal, DraftError> {
    state.validate().map_err(|_| DraftError::InvalidIntent)?;
    if !identifier_ok(&actor.actor_id) { return Err(DraftError::InvalidActor); }
    if !actor.allowed_regions.contains(&intent.region_id) {
        return Err(DraftError::ScopeDenied);
    }
    if !identifier_ok(&intent.correlation_id) { return Err(DraftError::InvalidIntent); }
    if intent.epoch != state.epoch { return Err(DraftError::WrongEpoch); }
    if intent.expected_sequence != state.sequence { return Err(DraftError::Stale); }
    let region = state.regions.iter().find(|r| r.id == intent.region_id)
        .ok_or(DraftError::MissingRegion)?;
    if !matches!(region.kind, RegionKind::Input) { return Err(DraftError::WrongRegionKind); }
    if !matches!(region.freshness, Freshness::Current) { return Err(DraftError::NotCurrent); }
    if region.view_revision != intent.expected_view_revision ||
       region.source_revision != intent.expected_source_revision {
        return Err(DraftError::Stale);
    }
    if intent.pointer != "/draft" || !region.writable.iter().any(|f| f.pointer == intent.pointer && f.action_id == "pwa.composer.draft.set") {
        return Err(DraftError::NotWritable);
    }
    let old = region.data.pointer(&intent.pointer)
        .and_then(Value::as_str).ok_or(DraftError::NotWritable)?;
    let updated = match intent.operation {
        DraftOperation::Replace => intent.text.clone(),
        DraftOperation::Append => format!("{}{}", old, intent.text),
    };
    if updated.as_bytes().len() > MAX_DRAFT_BYTES || updated.contains('\0') {
        return Err(DraftError::DraftTooLarge);
    }
    if old == updated { return Err(DraftError::NoChange); }
    let mut edited = state.clone();
    let next = edited.regions.iter_mut().find(|r| r.id == region.id)
        .expect("region previously checked");
    *next.data.pointer_mut(&intent.pointer).ok_or(DraftError::NotWritable)? =
        Value::String(updated);
    let mut candidates = state.admit_edit(&edited, &intent.correlation_id)
        .map_err(|_| DraftError::CoreRefused)?;
    if candidates.len() != 1 { return Err(DraftError::CoreRefused); }
    let candidate = candidates.remove(0);
    Ok(DraftProposal {
        schema: PROPOSAL_SCHEMA.into(),
        actor_id: actor.actor_id.clone(),
        candidate,
        effect_performed: false,
        execution_authorized: false,
    })
}

/// A real Host receipt must be verified separately. This function ONLY
/// verifies a subsequent authoritative source observation and matching event.
pub fn verify_source_observation(
    before: &LiveSystemState,
    after: &LiveSystemState,
    event: &ChangeEvent,
    proposal: &DraftProposal,
) -> Result<(), DraftError> {
    before.validate().map_err(|_| DraftError::UnverifiedOutcome)?;
    after.validate().map_err(|_| DraftError::UnverifiedOutcome)?;
    let c = &proposal.candidate;
    if proposal.schema != PROPOSAL_SCHEMA ||
        proposal.effect_performed || proposal.execution_authorized ||
        before.epoch != after.epoch || event.epoch != after.epoch ||
        before.sequence != c.expected_system_sequence ||
        after.sequence <= before.sequence || after.sequence != event.sequence ||
        event.correlation_id != c.correlation_id || event.region_id != c.region_id {
        return Err(DraftError::UnverifiedOutcome);
    }
    let region = after.regions.iter().find(|r| r.id == c.region_id)
        .ok_or(DraftError::UnverifiedOutcome)?;
    if region.source_id != c.source_id ||
        region.source_revision <= c.expected_source_revision ||
        region.view_revision <= c.expected_region_revision ||
        region.view_revision != event.view_revision ||
        region.source_revision != event.source_revision ||
        region.digest != event.digest ||
        region.data.pointer(&c.pointer) != Some(&c.new_value) ||
        !matches!(region.freshness, Freshness::Current) {
        return Err(DraftError::UnverifiedOutcome);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use crate::live_system::{
        Exposure, Observation, Primitive, WritableField,
    };
    fn fixture() -> (LiveSystemState, ActorContext) {
        let state = LiveSystemState::new("owner-session").unwrap();
        let (state, _) = state.integrate(Observation {
            id:"phone.composer".into(), kind:RegionKind::Input,
            source_id:"phone-source".into(), source_revision:1,
            observed_at_ms:1, freshness:Freshness::Current,
            exposure:Exposure::Owner,
            data:json!({"draft":"hello"}),
            writable:vec![WritableField{
                pointer:"/draft".into(), primitive:Primitive::Text,
                action_id:"pwa.composer.draft.set".into(),
            }],
        }, "seed").unwrap();
        (state, ActorContext{actor_id:"agent:primary".into(),
            allowed_regions:["phone.composer".into()].into_iter().collect()})
    }
    fn intent(s:&LiveSystemState, op:DraftOperation, text:&str) -> DraftIntent {
        DraftIntent{
            epoch:s.epoch.clone(),region_id:"phone.composer".into(),
            pointer:"/draft".into(),expected_sequence:s.sequence,
            expected_view_revision:s.regions[0].view_revision,
            expected_source_revision:s.regions[0].source_revision,
            correlation_id:"agent-edit-001".into(),operation:op,text:text.into()
        }
    }
    #[test] fn replace_proposes_inert_existing_core_candidate() {
        let (s,a)=fixture();
        let p=prepare_draft(&s,&a,&intent(&s,DraftOperation::Replace,"world")).unwrap();
        assert_eq!(p.candidate.new_value,json!("world"));
        assert_eq!(p.candidate.old_value,json!("hello"));
        assert!(!p.effect_performed && !p.execution_authorized && !p.candidate.effect_performed);
        assert_eq!(s.regions[0].data["draft"],"hello"); // original untouched
    }
    #[test] fn append_is_revision_fenced() {
        let (s,a)=fixture();
        let p=prepare_draft(&s,&a,&intent(&s,DraftOperation::Append," there")).unwrap();
        assert_eq!(p.candidate.new_value,json!("hello there"));
        let mut stale=intent(&s,DraftOperation::Replace,"world");
        stale.expected_source_revision += 1;
        assert_eq!(prepare_draft(&s,&a,&stale),Err(DraftError::Stale));
    }
    #[test] fn denies_unscoped_non_input_and_oversize() {
        let (s,mut a)=fixture();
        a.allowed_regions.clear();
        assert_eq!(prepare_draft(&s,&a,&intent(&s,DraftOperation::Replace,"x")),
            Err(DraftError::ScopeDenied));
        a.allowed_regions.insert("phone.composer".into());
        assert_eq!(prepare_draft(&s,&a,&intent(&s,DraftOperation::Replace,&"x".repeat(4001))),
            Err(DraftError::DraftTooLarge));
        assert_eq!(prepare_draft(&s,&a,&intent(&s,DraftOperation::Replace,"hello")),
            Err(DraftError::NoChange));
    }
    #[test] fn source_observation_must_match_event_revision_and_value() {
        let (s,a)=fixture();
        let p=prepare_draft(&s,&a,&intent(&s,DraftOperation::Replace,"world")).unwrap();
        let (next,e)=s.integrate(Observation{
            id:"phone.composer".into(),kind:RegionKind::Input,
            source_id:"phone-source".into(),source_revision:2,
            observed_at_ms:2,freshness:Freshness::Current,exposure:Exposure::Owner,
            data:json!({"draft":"world"}),
            writable:s.regions[0].writable.clone()
        },"agent-edit-001").unwrap();
        let e=e.unwrap();
        assert_eq!(verify_source_observation(&s,&next,&e,&p),Ok(()));
        let mut wrong=e.clone();wrong.correlation_id="other".into();
        assert_eq!(verify_source_observation(&s,&next,&wrong,&p),Err(DraftError::UnverifiedOutcome));
    }
}
