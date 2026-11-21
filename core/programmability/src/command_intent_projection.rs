//! Inert command-intent projection of a fresh Host-owned NLCL reading.
//! @hq:capability vivim.rust-command-intent-projection@1
//! NLCL, personal-rule binding and the catalog remain Host-owned. This module
//! does not parse natural language, grant approval, execute or persist effects.
use serde_json::{json, Map, Value};
use std::collections::BTreeMap;

const SCHEMA: &str = "vivim.command-intent-projection/1";
const INPUT: &str = "vivim.command-intent-projection-input/1";
const INTENT: &str = "vivim.command-intent/0.1";
const LANGUAGE: &str = "vivim.control-language/1";

fn result(intent: Value) -> Value {
    json!({"schema": SCHEMA, "outcome": "projected", "intent": intent,
        "authority": "none", "executionAuthorized": false, "effectPerformed": false})
}
fn refusal(input: &Value, code: &str, message: &str) -> Value {
    result(json!({"schema": INTENT, "outcome": "refused",
        "refusal": {"code": code, "message": message},
        "provenance": {"method": "deterministic-validation",
            "catalogRevision": input.get("catalogRevision").unwrap_or(&Value::Null),
            "worldRevision": input.get("worldRevision").unwrap_or(&Value::Null),
            "authority": "none"}}))
}
fn invalid(input: &Value) -> Value {
    refusal(input, "INVALID_CONTEXT", "Invalid or stale command context.")
}
fn valid_risk(value: &Value) -> bool {
    matches!(value.as_str(), Some("R0" | "R1" | "R2" | "R3"))
}
fn risk_rank(value: &Value) -> usize {
    match value.as_str() {
        Some("R1") => 1, Some("R2") => 2, Some("R3") => 3, _ => 0
    }
}
fn safe_text(value: &Value) -> bool {
    value.as_str().is_some_and(|s| !s.is_empty() && s == s.trim())
}
fn valid_specs(value: &Value) -> bool {
    let Some(specs) = value.as_object() else { return false };
    specs.iter().all(|(key, spec)| {
        if key.is_empty() || key.len() > 96 { return false }
        match spec["type"].as_str() {
            Some("enum") => spec["values"].as_array().is_some_and(|values| {
                !values.is_empty() && values.len() <= 256 &&
                values.iter().all(safe_text)
            }),
            Some("string") => matches!(
                (spec["min"].as_u64(), spec["max"].as_u64()),
                (Some(min), Some(max)) if min <= max && max <= 65536
            ),
            _ => false,
        }
    })
}
fn action_catalog(actions: &Value) -> Option<BTreeMap<String, &Value>> {
    let entries = actions.as_array()?;
    if entries.is_empty() || entries.len() > 512 { return None }
    let mut by_id = BTreeMap::new();
    for action in entries {
        let id = action["id"].as_str().filter(|id| !id.is_empty() && id.len() <= 96)?;
        if !safe_text(&action["title"]) || !safe_text(&action["owner"])
            || !safe_text(&action["readiness"]) || !valid_risk(&action["risk"])
            || !valid_specs(&action["args"]) { return None }
        if let Some(scopes) = action.get("requiredScopes") {
            if !scopes.as_array().is_some_and(|a| a.len() <= 64 && a.iter().all(safe_text)) {
                return None
            }
        }
        if by_id.insert(id.to_owned(), action).is_some() { return None }
    }
    Some(by_id)
}
fn checked_args(action: &Value, args: &Value) -> Option<Value> {
    let specs = action["args"].as_object()?;
    let values = args.as_object()?;
    if values.len() != specs.len() || values.keys().any(|k| !specs.contains_key(k)) {
        return None
    }
    let mut normalized = Map::new();
    for (key, spec) in specs {
        let value = values.get(key)?;
        let text = value.as_str().filter(|s| !s.is_empty() && *s == s.trim())?;
        let valid = match spec["type"].as_str() {
            Some("enum") => spec["values"].as_array()?.iter()
                .any(|choice| choice.as_str() == Some(text)),
            Some("string") => {
                let len = text.encode_utf16().count() as u64;
                len >= spec["min"].as_u64()? && len <= spec["max"].as_u64()?
            },
            _ => false,
        };
        if !valid { return None }
        normalized.insert(key.clone(), json!(text));
    }
    Some(Value::Object(normalized))
}
fn canonical(action_id: &str, args: &Value) -> Option<String> {
    let mut output = format!("/{action_id}");
    for (key, value) in args.as_object()? {
        output.push(' ');
        output.push_str(key);
        output.push('=');
        output.push_str(&serde_json::to_string(value).ok()?);
    }
    Some(output)
}
fn metadata(source: &Value, reading: &Value, personal: &Value,
    catalog_version: &Value, world_version: &Value) -> Value {
    let feedback = reading.get("feedback").unwrap_or(&Value::Null);
    let method = personal["method"].as_str().unwrap_or("deterministic-nlcl");
    let mut provenance = json!({
        "method": method,
        "engineVersion": feedback.get("nlclVersion").unwrap_or(&Value::Null),
        "catalogRevision": catalog_version,
        "worldRevision": world_version,
        "audience": source.get("audience").unwrap_or(&json!("owner")),
        "surface": source.get("scope").unwrap_or(&json!("text")),
        "confidence": feedback.get("confidence").unwrap_or(&Value::Null),
        "authority": "none"
    });
    let mut language = json!({});
    if let Some(feedback) = reading.get("feedback") { language["feedback"] = feedback.clone(); }
    if let Some(modifiers) = reading.get("ignoredModifiers") {
        language["ignoredModifiers"] = modifiers.clone();
    }
    if !personal.is_null() {
        language["personalRule"] = personal.clone();
        provenance["personalRule"] = personal.clone();
    }
    json!({"language": language, "provenance": provenance})
}
fn intent_with_meta(outcome: &str, mut fields: Value, meta: &Value) -> Value {
    let mut intent = json!({"schema": INTENT, "outcome": outcome});
    if let Some(map) = fields.as_object_mut() {
        for (key, value) in std::mem::take(map) {
            intent[key] = value;
        }
    }
    intent["language"] = meta["language"].clone();
    intent["provenance"] = meta["provenance"].clone();
    intent
}
fn check_reading(reading: &Value, source: &Value, personal: &Value, baseline: &Value) -> bool {
    if reading["schema"] != LANGUAGE ||
        !(reading["input"] == source["text"] ||
          reading["input"].as_str() == source["text"].as_str().map(str::trim)) {
        return false
    }
    let Some(outcome) = reading["outcome"].as_str() else { return false };
    if !matches!(outcome, "refused" | "clarification_required" | "incomplete" |
        "candidate" | "interpretation_required" | "empty") { return false }
    if let Some(feedback) = reading.get("feedback") {
        if !feedback.is_object() { return false }
    }
    if let Some(modifiers) = reading.get("ignoredModifiers") {
        if !modifiers.as_array().is_some_and(|m| m.len() <= 32 &&
            m.iter().all(safe_text)) { return false }
    }
    if !personal.is_null() {
        if baseline.as_str() != Some("interpretation_required") { return false }
        match personal["method"].as_str() {
            Some("accepted-personal-rule") if outcome == "candidate" => (),
            Some("personal-rule-conflict") if outcome == "clarification_required" => (),
            Some("personal-rule-refusal") if outcome == "refused" => (),
            _ => return false,
        }
    } else if baseline.as_str() != reading["outcome"].as_str() {
        return false
    }
    true
}

/// The caller re-computes the NLCL reading from the owner's text and checks
/// this entire projected intent against its incumbent representation before
/// admitting it. Caller-supplied catalog data is never an execution grant.
pub fn project(request: &Value) -> Value {
    let source = &request["input"];
    if request["schema"] != INPUT || !source.is_object()
        || !source["text"].as_str().is_some_and(|s| {
            !s.trim().is_empty() && s.encode_utf16().count() <= 1000
        })
        || !request["catalogVersion"].as_u64().is_some_and(|v| v > 0)
        || !request["worldRevision"].is_number()
        || (source.get("catalogRevision").is_some()
            && source["catalogRevision"] != request["catalogVersion"])
        || (source.get("worldRevision").is_some()
            && source["worldRevision"] != request["worldRevision"])
        || !source.get("audience").map_or(true, |v| v.as_str().is_some_and(
            |s| s.encode_utf16().count() <= 64))
        || !source.get("scope").map_or(true, |v| matches!(v.as_str(),
            Some("text" | "desktop" | "mobile" | "visual")))
    {
        return invalid(source)
    }
    let Some(actions) = action_catalog(&request["catalogActions"]) else {
        return invalid(source)
    };
    let reading = &request["reading"];
    let personal = &request["personalProvenance"];
    if !check_reading(reading, source, personal, &request["baselineOutcome"]) {
        return refusal(source, "INVALID_READING", "Host reading is malformed or contradictory.")
    }
    let meta = metadata(source, reading, personal,
        &request["catalogVersion"], &request["worldRevision"]);
    let projected = match reading["outcome"].as_str().unwrap_or("") {
        "refused" => {
            let found = &reading["refusal"];
            let code = found["code"].as_str().unwrap_or("UNSAFE_SYNTAX");
            let message = found["message"].as_str().unwrap_or("Command was refused.");
            if code.is_empty() || message.is_empty() {
                return refusal(source, "INVALID_READING", "Host reading is malformed or contradictory.")
            }
            intent_with_meta("refused",
                json!({"refusal": {"code": code, "message": message}}), &meta)
        },
        "clarification_required" => {
            let choices = match reading.get("choices") {
                None => vec![],
                Some(v) => match v.as_array() {
                    Some(a) => a.clone(), None => return refusal(source,
                        "INVALID_READING", "Host reading is malformed or contradictory."),
                },
            };
            let mut alternatives = vec![];
            let mut rank = 0;
            for id in choices.iter().take(8) {
                let Some(id) = id.as_str() else {
                    return refusal(source, "INVALID_READING", "Host reading is malformed or contradictory.")
                };
                let Some(action) = actions.get(id) else {
                    return refusal(source, "UNKNOWN_ACTION", "Action not in the Host catalog.")
                };
                rank = rank.max(risk_rank(&action["risk"]));
                alternatives.push(json!({"actionId": id, "title": action["title"],
                    "risk": action["risk"]}));
            }
            let risk = ["R0", "R1", "R2", "R3"][rank];
            intent_with_meta("clarification_required", json!({
                "question": reading["question"].as_str().unwrap_or("Which one do you mean?"),
                "alternatives": alternatives, "risk": risk
            }), &meta)
        },
        "incomplete" => {
            let missing = reading.get("missing").cloned().unwrap_or(json!([]));
            if !missing.as_array().is_some_and(|list| list.len() <= 64 &&
                list.iter().all(|m| m["arg"].as_str().is_some_and(|s| !s.is_empty()))) {
                return refusal(source, "INVALID_READING", "Host reading is malformed or contradictory.")
            }
            let mut alternatives = vec![];
            if let Some(id) = reading["candidate"]["actionId"].as_str() {
                let Some(action) = actions.get(id) else {
                    return refusal(source, "UNKNOWN_ACTION", "Action not in the Host catalog.")
                };
                alternatives.push(json!({"actionId": id, "title": action["title"],
                    "risk": action["risk"]}));
            }
            intent_with_meta("clarification_required", json!({
                "question": reading["question"].as_str().unwrap_or("Which argument is missing?"),
                "missing": missing, "alternatives": alternatives
            }), &meta)
        },
        "candidate" => {
            let Some(action_id) = reading["candidate"]["actionId"].as_str() else {
                return refusal(source, "UNKNOWN_ACTION", "Action not in the Host catalog.")
            };
            let Some(action) = actions.get(action_id) else {
                return refusal(source, "UNKNOWN_ACTION", "Action not in the Host catalog.")
            };
            let Some(args) = checked_args(action, &reading["candidate"]["args"]) else {
                return refusal(source, "INVALID_ARGS", "Candidate does not satisfy the catalog.")
            };
            let Some(expression) = canonical(action_id, &args) else {
                return refusal(source, "INVALID_ARGS", "Candidate does not satisfy the catalog.")
            };
            intent_with_meta("candidate", json!({
                "actionId": action_id, "args": args, "canonical": expression,
                "risk": action["risk"],
                "requiredScopes": action.get("requiredScopes")
                    .cloned().unwrap_or(json!([])),
                "owner": action["owner"], "readiness": action["readiness"]
            }), &meta)
        },
        _ => intent_with_meta("interpretation_required", json!({
            "refusal": {"code": "NO_DETERMINISTIC_MATCH",
                "message": "A catalog-bounded proposal or clarification is needed."}
        }), &meta),
    };
    result(projected)
}
