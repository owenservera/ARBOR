//! Adapter to the existing ARBOR semantic_observation::aggregate Rust contract.
//! It does NOT infer intent, validate external receipts or activate a rule.
//! Caller (Host) MUST verify event/receipt provenance and scope before invoking.
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::{HashMap, HashSet};

pub const CONFIRMED_SCHEMA: &str = "vivim.confirmed-behavior-mapping/1";
pub const TARGET_INPUT_SCHEMA: &str = "vivim.semantic-observation-aggregation-input/1";
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LearnError {
    InvalidSchema,
    InvalidEvidence,
    InvalidBound,
    ReceiptCollision,
    NoConfirmations,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ConfirmedMapping {
    pub schema: String,
    pub event_id: String,
    pub host_receipt_id: String,
    pub group_key: String,
    pub meaning_key: String,
    pub phrase: String,
    pub action_id: String,
    pub args: Value,
    pub scope: Value,
    pub explicitly_confirmed: bool,
}
fn id(s: &str) -> bool {
    !s.is_empty()
        && s.len() <= 128
        && s.bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"._:-".contains(&b))
}
fn digest(s: &str) -> bool {
    s.len() == 64
        && s.bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}
/// Emits input for ARBOR's *existing* aggregate; no alternative learner.
/// No inferred positive feedback: only verified, unique Host receipt events.
pub fn prepare_confirmed_input(
    verified_by_host: &[ConfirmedMapping],
    minimum: u64,
    catalog_version: u64,
) -> Result<Value, LearnError> {
    if !(2..=20).contains(&minimum) || catalog_version == 0 || verified_by_host.len() > 2000 {
        return Err(LearnError::InvalidBound);
    }
    let mut receipts: HashMap<&str, &str> = HashMap::new();
    let mut seen_events = HashSet::new();
    let mut rows = Vec::new();
    for m in verified_by_host {
        if m.schema != CONFIRMED_SCHEMA {
            return Err(LearnError::InvalidSchema);
        }
        if !m.explicitly_confirmed
            || !id(&m.event_id)
            || !id(&m.host_receipt_id)
            || !digest(&m.group_key)
            || !digest(&m.meaning_key)
            || !id(&m.action_id)
            || m.phrase.is_empty()
            || m.phrase.encode_utf16().count() > 200
            || !m.args.is_object()
            || !m.scope.is_object()
        {
            return Err(LearnError::InvalidEvidence);
        }
        if !seen_events.insert(m.event_id.as_str()) {
            return Err(LearnError::InvalidEvidence);
        }
        if receipts
            .insert(m.host_receipt_id.as_str(), m.event_id.as_str())
            .is_some()
        {
            return Err(LearnError::ReceiptCollision);
        }
        rows.push(json!({"groupKey":m.group_key,"meaningKey":m.meaning_key,
           "phrase":m.phrase,"actionId":m.action_id,"args":m.args,"scope":m.scope}));
    }
    if rows.is_empty() {
        return Err(LearnError::NoConfirmations);
    }
    Ok(json!({"schema":TARGET_INPUT_SCHEMA,"validatedEvents":rows,
        "minConfirmations":minimum,"catalogVersion":catalog_version,
        "considered":rows.len(),"skipped":0}))
}
#[cfg(test)]
mod tests {
    use super::*;
    fn m(id: &str, receipt: &str) -> ConfirmedMapping {
        ConfirmedMapping {
            schema: CONFIRMED_SCHEMA.into(),
            event_id: id.into(),
            host_receipt_id: receipt.into(),
            group_key: "a".repeat(64),
            meaning_key: "b".repeat(64),
            phrase: "search wiki".into(),
            action_id: "wiki.search".into(),
            args: json!({"query":"status"}),
            scope: json!({"surface":"wiki"}),
            explicitly_confirmed: true,
        }
    }
    #[test]
    fn matches_existing_aggregation_schema_without_effect() {
        let x = prepare_confirmed_input(&[m("a", "r1"), m("b", "r2")], 2, 1).unwrap();
        assert_eq!(x["schema"], TARGET_INPUT_SCHEMA);
        assert_eq!(x["validatedEvents"].as_array().unwrap().len(), 2);
        assert!(x.get("executionAuthorized").is_none());
    }
    #[test]
    fn repeats_of_one_receipt_are_not_two_confirmations() {
        assert_eq!(
            prepare_confirmed_input(&[m("a", "r1"), m("b", "r1")], 2, 1),
            Err(LearnError::ReceiptCollision)
        );
    }
    #[test]
    fn no_unreviewed_feedback() {
        let mut x = m("a", "r1");
        x.explicitly_confirmed = false;
        assert_eq!(
            prepare_confirmed_input(&[x], 2, 1),
            Err(LearnError::InvalidEvidence)
        );
    }
    #[test]
    fn no_unsourced_or_unbounded_mapping() {
        let mut x = m("a", "r1");
        x.group_key = "bogus".into();
        assert_eq!(
            prepare_confirmed_input(&[x], 2, 1),
            Err(LearnError::InvalidEvidence)
        );
        assert_eq!(
            prepare_confirmed_input(&[m("a", "r1")], 1, 1),
            Err(LearnError::InvalidBound)
        );
    }
}
