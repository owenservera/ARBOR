//! Inert deterministic reducer for the Host-owned personal-rule store.
//! @hq:capability vivim.rust-personal-rule-transition@1
//! No filesystem, clocks, identity generation, approvals, receipts verification,
//! side effects or external authority. The Host supplies verified inputs and
//! independently compares the entire projection before its locked CAS write.
use serde_json::{json, Value};
use std::collections::{BTreeMap, BTreeSet};

const SCHEMA: &str = "vivim.personal-rule-transition/1";
const INPUT: &str = "vivim.personal-rule-transition-input/1";
const STORE: &str = "vivim.personal-semantic-store/1";
const RULE: &str = "vivim.personal-semantic-rule/1";
const MAX_SAFE: u64 = 9_007_199_254_740_991;
const MAX_RULES: usize = 500;
const MAX_HISTORY: usize = 500;

fn refused(code: &str) -> Value {
    json!({"schema":SCHEMA,"outcome":"refused","code":code,
        "authority":"none","executionAuthorized":false,"effectPerformed":false})
}
fn projected(next: Value, rule: Value) -> Value {
    json!({"schema":SCHEMA,"outcome":"projected","next":next,"rule":rule,
        "authority":"none","executionAuthorized":false,"effectPerformed":false})
}
fn valid_id(id: &str) -> bool {
    let Some(suffix) = id.strip_prefix("rule:") else { return false };
    let b = suffix.as_bytes();
    !b.is_empty() && b.len() <= 80
        && (b[0].is_ascii_lowercase() || b[0].is_ascii_digit())
        && b.iter().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit()
            || matches!(*c, b'.' | b'_' | b'-'))
}
fn valid_rule(rule: &Value) -> bool {
    rule["schema"] == RULE
        && rule["id"].as_str().is_some_and(valid_id)
        && rule["revision"].as_u64().is_some_and(|n| n > 0 && n <= MAX_SAFE)
        && matches!(rule["state"].as_str(),
            Some("observed" | "proposed" | "accepted" | "suspended" | "revoked"))
        && matches!(rule["source"].as_str(),
            Some("explicit-owner" | "system-observed"))
        && (rule["state"] != "accepted" || rule["source"] == "explicit-owner")
        && rule["catalogVersion"].as_u64().is_some_and(|n| n > 0 && n <= MAX_SAFE)
        && rule["phrase"].is_string() && rule["actionId"].is_string()
        && rule["args"].is_object() && rule["scope"].is_object()
}
fn valid_store(current: &Value) -> Option<u64> {
    if current["schema"] != STORE { return None; }
    let version = current["version"].as_u64().filter(|n| *n < MAX_SAFE)?;
    let entries = current["entries"].as_array().filter(|rows| rows.len() <= MAX_RULES)?;
    let history = current["history"].as_array().filter(|rows| rows.len() <= MAX_HISTORY)?;
    let mut ids = BTreeSet::new();
    for rule in entries {
        if !valid_rule(rule) || !ids.insert(rule["id"].as_str()?) { return None; }
    }
    for row in history {
        if !row.is_object()
            || !row["ruleId"].is_string()
            || !row["at"].is_string()
            || !row["version"].as_i64().is_some_and(|n| n.unsigned_abs() <= MAX_SAFE)
        { return None; }
    }
    Some(version)
}
fn existing<'a>(current: &'a Value, id: &str) -> Option<&'a Value> {
    current["entries"].as_array()?.iter().find(|row| row["id"] == id)
}
fn matching_previous<'a>(input: &Value, current: &'a Value, id: &str) -> Option<&'a Value> {
    let old = existing(current, id)?;
    if input["previous"] != *old { return None; }
    Some(old)
}
fn next_revision(old: &Value) -> Option<u64> {
    old["revision"].as_u64()?.checked_add(1).filter(|n| *n <= MAX_SAFE)
}
fn can_transition(from: &str, to: &str) -> bool {
    matches!((from, to),
        ("proposed", "accepted" | "revoked")
        | ("accepted", "suspended" | "revoked")
        | ("suspended", "accepted" | "revoked"))
}
fn assemble(input: &Value, current: &Value, version: u64,
            rule: Value, previous: Value, op: &str) -> Option<Value> {
    let id = rule["id"].as_str()?;
    let current_entries = current["entries"].as_array()?;
    let mut by_id: BTreeMap<String, Value> = BTreeMap::new();
    for entry in current_entries {
        let key = entry["id"].as_str()?.to_owned();
        if by_id.insert(key, entry.clone()).is_some() { return None; }
    }
    by_id.insert(id.to_owned(), rule.clone());
    if by_id.len() > MAX_RULES { return None; }

    // Host localeCompare is intentionally retained for existing record order;
    // validate an exact permutation, never accept missing or duplicate identities.
    let order = input["entryOrder"].as_array()?;
    if order.len() != by_id.len() { return None; }
    let mut entries = Vec::with_capacity(order.len());
    for key in order {
        entries.push(by_id.remove(key.as_str()?)?);
    }
    if !by_id.is_empty() { return None; }

    let at = input["at"].as_str().filter(|s| !s.is_empty())?;
    let mut event = json!({"version":version + 1,"ruleId":id,
        "revision":rule["revision"],"op":op,"before":previous,
        "after":rule,"at":at});
    // Receipt identifiers are opaque Host-owned data, not verifier inputs.
    // Preserve the incumbent serialized shape even for historic JSON payloads.
    if let Some(receipt) = input.get("ownerReceiptId") {
        event["ownerReceiptId"] = receipt.clone();
    }
    let mut history = current["history"].as_array()?.clone();
    history.push(event);
    if history.len() > MAX_HISTORY {
        history.drain(..history.len() - MAX_HISTORY);
    }
    let mut next = current.clone();
    next["version"] = json!(version + 1);
    next["entries"] = Value::Array(entries);
    next["history"] = Value::Array(history);
    Some(next)
}

/// Input schema: vivim.personal-rule-transition-input/1.
/// The Host provides current CAS state, deterministic entryOrder, a single
/// already-verified transition and Host-generated identity/time/receipt ID.
/// This function is never a proof of owner consent or a persistence grant.
pub fn reduce(input: &Value) -> Value {
    if input["schema"] != INPUT { return refused("PERSONAL_STORE_NATIVE_INVALID"); }
    let Some(version) = valid_store(&input["current"]) else {
        return refused("PERSONAL_STORE_NATIVE_INVALID");
    };
    if input["expectedVersion"].as_u64() != Some(version) {
        return refused("PERSONAL_STORE_STALE");
    }
    let Some(op) = input["mode"].as_str().filter(|s| matches!(
        *s, "propose" | "remember" | "transition" | "rollback"))
    else { return refused("PERSONAL_STORE_NATIVE_INVALID"); };
    let current = &input["current"];
    let (rule, previous) = match op {
        "propose" => {
            let candidate = &input["candidate"];
            if !valid_rule(candidate) || candidate["state"] != "proposed"
                || candidate["revision"] != 1
                || !input["previous"].is_null()
                || existing(current, candidate["id"].as_str().unwrap_or("")).is_some()
                || current["entries"].as_array().is_none_or(|e| e.len() >= MAX_RULES)
            { return refused("PERSONAL_STORE_INVALID_TRANSITION"); }
            (candidate.clone(), Value::Null)
        }
        "remember" => {
            let candidate = &input["candidate"];
            let Some(id) = input["ruleId"].as_str().filter(|s| valid_id(s))
            else { return refused("PERSONAL_STORE_NATIVE_INVALID"); };
            if !valid_rule(candidate) || candidate["state"] != "accepted"
                || candidate["source"] != "explicit-owner"
            { return refused("PERSONAL_STORE_INVALID_TRANSITION"); }
            // Host computed the incumbent NFKC phrase / JSON-scope match.
            // Preserve that exact compatibility policy, but reject claims
            // which contradict accepted identities in the current snapshot.
            let Some(matched) = input["matchingRuleIds"].as_array()
                .filter(|rows| rows.len() <= MAX_RULES)
            else { return refused("PERSONAL_STORE_NATIVE_INVALID"); };
            if matched.len() > 1 { return refused("PERSONAL_STORE_CONFLICT"); }
            if matched.iter().any(|row| !row.is_string()) {
                return refused("PERSONAL_STORE_NATIVE_INVALID");
            }
            let claimed = matched.first().and_then(Value::as_str);
            if claimed.is_some() && claimed != Some(id) {
                return refused("PERSONAL_STORE_CONFLICT");
            }
            // Defend independently against exact duplicate phrases/scopes.
            // Unicode-equivalent aliases remain governed by the Host's
            // existing NFKC matching above, not a new Rust grammar.
            if current["entries"].as_array().is_some_and(|rows| rows.iter().any(|row|
                row["state"] == "accepted"
                && row["phrase"] == candidate["phrase"]
                && row["scope"] == candidate["scope"]
                && row["id"].as_str() != Some(id)
            )) {
                return refused("PERSONAL_STORE_CONFLICT");
            }
            let previous = match existing(current, id) {
                Some(old) => {
                    if claimed != Some(id)
                        || input["previous"] != *old
                        || old["state"] != "accepted"
                        || old["scope"] != candidate["scope"]
                    {
                        return refused("PERSONAL_STORE_CONFLICT");
                    }
                    old.clone()
                }
                None => {
                    if claimed.is_some() || !input["previous"].is_null()
                        || current["entries"].as_array().is_none_or(|e| e.len() >= MAX_RULES)
                    { return refused("PERSONAL_STORE_CONFLICT"); }
                    Value::Null
                }
            };
            let revision = if previous.is_null() { 1 } else {
                let Some(n) = next_revision(&previous) else {
                    return refused("PERSONAL_STORE_INVALID_TRANSITION");
                };
                n
            };
            let mut changed = candidate.clone();
            changed["id"] = json!(id);
            changed["revision"] = json!(revision);
            (changed, previous)
        }
        "transition" => {
            let Some(id) = input["ruleId"].as_str() else {
                return refused("PERSONAL_STORE_NATIVE_INVALID");
            };
            let Some(old) = matching_previous(input, current, id) else {
                return refused("PERSONAL_STORE_STALE");
            };
            let Some(target) = input["nextState"].as_str() else {
                return refused("PERSONAL_STORE_NATIVE_INVALID");
            };
            if !can_transition(old["state"].as_str().unwrap_or(""), target) {
                return refused("PERSONAL_STORE_BAD_TRANSITION");
            }
            let Some(revision) = next_revision(old) else {
                return refused("PERSONAL_STORE_INVALID_TRANSITION");
            };
            let mut changed = old.clone();
            changed["revision"] = json!(revision);
            changed["state"] = json!(target);
            if target == "accepted" {
                changed["source"] = json!("explicit-owner");
            }
            (changed, old.clone())
        }
        "rollback" => {
            let Some(id) = input["ruleId"].as_str() else {
                return refused("PERSONAL_STORE_NATIVE_INVALID");
            };
            let Some(old) = matching_previous(input, current, id) else {
                return refused("PERSONAL_STORE_STALE");
            };
            let Some(to) = input["toRevision"].as_u64()
                .filter(|n| *n > 0 && *n <= MAX_SAFE) else {
                return refused("PERSONAL_STORE_UNKNOWN_REVISION");
            };
            let Some(past) = current["history"].as_array()
                .and_then(|history| history.iter().rev()
                    .find(|h| h["ruleId"] == id && h["after"]["revision"] == to))
                .map(|h| &h["after"])
                .filter(|r| valid_rule(r) && r["id"] == id)
            else { return refused("PERSONAL_STORE_UNKNOWN_REVISION"); };
            let Some(revision) = next_revision(old) else {
                return refused("PERSONAL_STORE_INVALID_TRANSITION");
            };
            let mut changed = past.clone();
            changed["revision"] = json!(revision);
            (changed, old.clone())
        }
        _ => return refused("PERSONAL_STORE_NATIVE_INVALID"),
    };
    if !valid_rule(&rule) { return refused("PERSONAL_STORE_INVALID_TRANSITION"); }
    let Some(next) = assemble(input, current, version, rule.clone(), previous, op)
    else { return refused("PERSONAL_STORE_NATIVE_INVALID"); };
    projected(next, rule)
}

#[cfg(test)]
mod tests {
    use super::*;
    fn rule(id: &str, revision: u64, state: &str) -> Value {
        json!({"schema":RULE,"id":id,"revision":revision,"phrase":"my rule",
            "actionId":"ui.theme.set_preset","args":{"preset":"dusk"},
            "scope":{},"state":state,"source":"explicit-owner","catalogVersion":15})
    }
    fn current() -> Value {
        json!({"schema":STORE,"version":0,"entries":[],"history":[]})
    }
    fn input(mode: &str, current: Value) -> Value {
        json!({"schema":INPUT,"mode":mode,"expectedVersion":current["version"],
            "current":current,"previous":null,"candidate":null,
            "ruleId":null,"nextState":null,"toRevision":null,
            "entryOrder":["rule:a"],"ownerReceiptId":null,
            "at":"2026-11-21T00:00:00.000Z"})
    }
    #[test]
    fn proposes_then_transitions_only_with_matching_previous() {
        let mut q = input("propose", current());
        q["candidate"] = rule("rule:a", 1, "proposed");
        let proposed = reduce(&q);
        assert_eq!(proposed["outcome"], "projected");
        assert_eq!(proposed["next"]["version"], 1);
        assert_eq!(proposed["next"]["history"][0]["before"], Value::Null);
        let mut transition = input("transition", proposed["next"].clone());
        transition["previous"] = proposed["rule"].clone();
        transition["ruleId"] = json!("rule:a");
        transition["nextState"] = json!("accepted");
        let accepted = reduce(&transition);
        assert_eq!(accepted["outcome"], "projected");
        assert_eq!(accepted["rule"]["revision"], 2);
        assert_eq!(accepted["rule"]["source"], "explicit-owner");
        transition["previous"]["revision"] = json!(900);
        assert_eq!(reduce(&transition)["outcome"], "refused");
    }
    #[test]
    fn rollback_appends_revision_and_remains_inert() {
        let mut q = input("propose", current());
        q["candidate"] = rule("rule:a", 1, "proposed");
        let proposed = reduce(&q);
        let mut rollback = input("rollback", proposed["next"].clone());
        rollback["ruleId"] = json!("rule:a");
        rollback["previous"] = proposed["rule"].clone();
        rollback["toRevision"] = json!(1);
        let result = reduce(&rollback);
        assert_eq!(result["outcome"], "projected");
        assert_eq!(result["rule"]["revision"], 2);
        assert_eq!(result["next"]["history"].as_array().unwrap().len(), 2);
        assert_eq!(result["executionAuthorized"], false);
        assert_eq!(result["authority"], "none");
    }
    #[test]
    fn refuses_identity_collision_and_stale_versions() {
        let mut q = input("propose", current());
        q["candidate"] = rule("rule:a", 1, "proposed");
        let first = reduce(&q);
        let mut second = input("propose", first["next"].clone());
        second["candidate"] = rule("rule:a", 1, "proposed");
        assert_eq!(reduce(&second)["outcome"], "refused");
        second["expectedVersion"] = json!(0);
        assert_eq!(reduce(&second)["code"], "PERSONAL_STORE_STALE");
    }
    #[test]
    fn remember_requires_matching_accepted_identity_and_rejects_duplicates() {
        let mut q = input("remember", current());
        q["candidate"] = rule("rule:validation", 1, "accepted");
        q["matchingRuleIds"] = json!([]);
        let fresh = reduce(&q);
        assert_eq!(fresh["outcome"], "projected");
        assert_eq!(fresh["rule"]["id"], "rule:a");
        assert_eq!(fresh["rule"]["revision"], 1);

        let mut replace = input("remember", fresh["next"].clone());
        replace["candidate"] = rule("rule:validation", 1, "accepted");
        replace["matchingRuleIds"] = json!(["rule:a"]);
        replace["previous"] = fresh["rule"].clone();
        let updated = reduce(&replace);
        assert_eq!(updated["outcome"], "projected");
        assert_eq!(updated["rule"]["revision"], 2);

        replace["matchingRuleIds"] = json!([]);
        assert_eq!(reduce(&replace)["code"], "PERSONAL_STORE_CONFLICT");
        replace["matchingRuleIds"] = json!(["rule:a", "rule:b"]);
        assert_eq!(reduce(&replace)["code"], "PERSONAL_STORE_CONFLICT");
        replace["matchingRuleIds"] = json!(["rule:a"]);
        replace["previous"]["revision"] = json!(9);
        assert_eq!(reduce(&replace)["code"], "PERSONAL_STORE_CONFLICT");
    }
    #[test]
    fn history_is_bounded_and_order_is_exact() {
        let mut q = input("propose", current());
        q["candidate"] = rule("rule:a", 1, "proposed");
        let first = reduce(&q);
        let mut previous = first["next"].clone();
        let row = previous["history"][0].clone();
        previous["history"] = Value::Array(vec![row; MAX_HISTORY]);
        let mut transition = input("transition", previous);
        transition["previous"] = first["rule"].clone();
        transition["ruleId"] = json!("rule:a");
        transition["nextState"] = json!("accepted");
        let result = reduce(&transition);
        assert_eq!(result["outcome"], "projected");
        assert_eq!(result["next"]["history"].as_array().unwrap().len(), MAX_HISTORY);
        transition["entryOrder"] = json!(["rule:a", "rule:a"]);
        assert_eq!(reduce(&transition)["outcome"], "refused");
    }
}
