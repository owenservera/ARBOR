//! Pure winner selection for already validated, accepted personal command rules.
//! @hq:capability vivim.rust-personal-rule-selection@1
//! The incumbent NLCL grammar, catalog checks, recipe bindings and Host approval
//! remain authoritative. This module never learns a rule or authorizes an effect.
use serde_json::{json, Value};
use std::collections::BTreeSet;

const SCHEMA: &str = "vivim.personal-rule-selection/1";
const DECISION_SCHEMA: &str = "vivim.personal-resolution/1";

fn result(outcome: &str, decision: Value) -> Value {
    json!({"schema":SCHEMA,"outcome":outcome,"decision":decision,
        "authority":"none","executionAuthorized":false,"effectPerformed":false})
}
fn refused() -> Value {
    json!({"schema":SCHEMA,"outcome":"refused","code":"INVALID_SELECTION_INPUT",
        "authority":"none","executionAuthorized":false,"effectPerformed":false})
}
fn clarification(reason: &str, ids: Vec<String>) -> Value {
    result("clarification_required", json!({
        "schema":DECISION_SCHEMA,"outcome":"clarification_required",
        "executionAuthorized":false,"reason":reason,"ruleIds":ids
    }))
}

/// Input matches have already passed Host validation, scope matching, stale
/// dependency checks and typed argument binding. They are ordered by Host's
/// existing rule-id comparator so stable tie provenance remains unchanged.
/// The `meaning` field holds the bound write-recipe steps for program aliases
/// and the bound typed arguments for ordinary aliases.
pub fn select(input: &Value) -> Value {
    if input["schema"] != "vivim.personal-rule-selection-input/1"
        || input["catalogVersion"].as_u64().is_none()
        || !input["scope"].is_object()
        || !input["text"].as_str().is_some_and(|s| !s.is_empty() && s.encode_utf16().count() <= 1000)
    {
        return refused();
    }
    let Some(entries) = input["matches"].as_array() else { return refused() };
    if entries.is_empty() || entries.len() > 500 { return refused(); }

    let mut ids = BTreeSet::new();
    for entry in entries {
        let Some(id) = entry["ruleId"].as_str().filter(|s| !s.is_empty() && s.len() <= 96) else {
            return refused();
        };
        if !ids.insert(id.to_owned())
            || !entry["ruleRevision"].as_u64().is_some_and(|v| v > 0)
            || !entry["actionId"].as_str().is_some_and(|s| !s.is_empty() && s.len() <= 96)
            || !entry["scopeKeys"].as_u64().is_some_and(|n| n <= 4)
            || !entry["template"].is_boolean()
            || !entry["writeProgram"].is_boolean()
            || !(entry["args"].is_object() || entry["args"].is_null())
            || !(entry["meaning"].is_object() || entry["meaning"].is_array() || entry["meaning"].is_null())
            || (entry["args"].is_object() && entry["meaning"].is_null())
        {
            return refused();
        }
    }
    let sorted_ids: Vec<String> = ids.into_iter().collect();
    if entries.iter().any(|e| e["args"].is_null()) {
        return clarification("TEMPLATE_PARAMETER_REQUIRED", sorted_ids);
    }

    let highest = entries.iter().filter_map(|e| e["scopeKeys"].as_u64())
        .max().unwrap_or(0);
    let most_specific: Vec<&Value> = entries.iter()
        .filter(|e| e["scopeKeys"].as_u64() == Some(highest)).collect();
    let mut meanings = BTreeSet::new();
    for entry in &most_specific {
        let signature = serde_json::to_string(&json!([
            entry["actionId"].as_str().unwrap_or(""), entry["meaning"]
        ]));
        let Ok(signature) = signature else { return refused() };
        meanings.insert(signature);
    }
    if meanings.len() > 1 {
        let mut conflict_ids: Vec<String> = most_specific.iter()
            .filter_map(|e| e["ruleId"].as_str().map(str::to_owned)).collect();
        conflict_ids.sort();
        return clarification("CONFLICTING_PERSONAL_RULES", conflict_ids);
    }

    // The Host sent entries in its existing localeCompare order; the first
    // equally specific rule is the stable, owner-approved provenance source.
    let Some(chosen) = most_specific.first() else { return refused() };
    let Some(rule_id) = chosen["ruleId"].as_str() else { return refused() };
    let Some(action_id) = chosen["actionId"].as_str() else { return refused() };
    let mut provenance = json!({
        "method":"accepted-personal-rule",
        "ruleId":rule_id,
        "ruleRevision":chosen["ruleRevision"],
        "catalogRevision":input["catalogVersion"],
        "semanticScope":input["scope"]
    });
    if chosen["writeProgram"] == true {
        provenance["reuse"] = json!("typed-write-recipe");
        provenance["invocation"] = input["text"].clone();
    } else if chosen["template"] == true {
        provenance["reuse"] = json!("parameterized-template");
        provenance["templateSchema"] = json!("vivim.personal-command-template/1");
        provenance["invocation"] = input["text"].clone();
    }
    result("selected", json!({
        "schema":DECISION_SCHEMA,"outcome":"candidate","executionAuthorized":false,
        "candidate":{"actionId":action_id,"args":chosen["args"]},
        "provenance":provenance
    }))
}
