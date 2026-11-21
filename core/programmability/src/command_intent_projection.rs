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
const MAX_SAFE: u64 = 9_007_199_254_740_991;

// ECMAScript String.prototype.trim does not use the exact same whitespace
// table as Rust str::trim: notably U+FEFF is trimmed by JS, while U+0085
// is not. Use Host semantics for source text and catalog argument parity.
fn js_whitespace(ch: char) -> bool {
    matches!(ch,
        '\u{0009}'..='\u{000D}' | '\u{0020}' | '\u{00A0}' |
        '\u{1680}' | '\u{2000}'..='\u{200A}' |
        '\u{2028}'..='\u{2029}' | '\u{202F}' |
        '\u{205F}' | '\u{3000}' | '\u{FEFF}')
}
fn js_trim(text: &str) -> &str {
    text.trim_matches(js_whitespace)
}

fn catalog_id(id: &str) -> bool {
    let b = id.as_bytes();
    (3..=96).contains(&b.len()) && b[0].is_ascii_lowercase() &&
        b[1..].iter().all(|x| x.is_ascii_lowercase() || x.is_ascii_digit() ||
            matches!(*x, b'.' | b'_' | b'-'))
}
fn catalog_arg_key(key: &str) -> bool {
    let b = key.as_bytes();
    (1..=96).contains(&b.len()) && b[0].is_ascii_lowercase() &&
        b[1..].iter().all(|x| x.is_ascii_lowercase() || x.is_ascii_digit() ||
            matches!(*x, b'.' | b'_' | b'-'))
}
fn valid_readiness(value: &Value) -> bool {
    matches!(value.as_str(),
        Some("adapter_pending" | "enforcement_missing" | "unsupported" |
            "source_wired" | "verified"))
}

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
    value.as_str().is_some_and(|s| !s.is_empty() && s == js_trim(s))
}
fn valid_specs(value: &Value) -> bool {
    let Some(specs) = value.as_object() else { return false };
    specs.iter().all(|(key, spec)| {
        if !catalog_arg_key(key) { return false }
        match spec["type"].as_str() {
            Some("enum") => spec["values"].as_array().is_some_and(|values| {
                !values.is_empty() && values.len() <= 256 &&
                values.iter().all(safe_text)
            }),
            Some("string") => matches!(
                (spec["min"].as_u64(), spec["max"].as_u64()),
                (Some(min), Some(max)) if min >= 1 && min <= max && max <= 8000
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
        let id = action["id"].as_str().filter(|id| catalog_id(id))?;
        if !safe_text(&action["title"]) || !safe_text(&action["owner"])
            || !valid_readiness(&action["readiness"]) || !valid_risk(&action["risk"])
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
        let text = value.as_str().filter(|s| !s.is_empty() && *s == js_trim(s))?;
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
fn personal_provenance_valid(personal: &Value, catalog_version: &Value) -> bool {
    if personal.is_null() { return true }
    let Some(fields) = personal.as_object() else { return false };
    // Provenance is evidence of a past Host binder decision, never a grant.
    if fields.contains_key("authorization") || fields.contains_key("approval") ||
        fields.contains_key("authority") || fields.contains_key("executionAuthorized") ||
        fields.contains_key("effectPerformed") {
        return false
    }
    match personal["method"].as_str() {
        Some("accepted-personal-rule") => {
            personal["ruleId"].as_str().is_some_and(|s|
                s.starts_with("rule:") && (6..=85).contains(&s.len()) &&
                s.as_bytes()[5..].iter().all(|c| c.is_ascii_lowercase() ||
                    c.is_ascii_digit() || matches!(*c, b'.' | b'_' | b'-'))) &&
            personal["ruleRevision"].as_u64().is_some_and(|v| v > 0 && v <= MAX_SAFE) &&
            personal["catalogRevision"] == *catalog_version &&
            personal["semanticScope"].as_object().is_some_and(|scope| {
                scope.len() <= 4 && scope.iter().all(|(key, value)| {
                    matches!(key.as_str(), "surface" | "workspaceId" | "activity" | "providerId") &&
                    value.as_str().is_some_and(|v| !v.is_empty() && v.len() <= 128)
                })
            })
        },
        Some("personal-rule-conflict") => personal["ruleIds"].as_array().is_some_and(|ids| {
            !ids.is_empty() && ids.len() <= 500 && ids.iter().all(|id|
                id.as_str().is_some_and(|s| s.starts_with("rule:") &&
                    (6..=85).contains(&s.len()))) &&
            ids.windows(2).all(|pair| pair[0].as_str() < pair[1].as_str())
        }),
        Some("personal-rule-refusal") => personal["reason"].as_str()
            .is_some_and(|s| !s.is_empty() && s.len() <= 128),
        _ => false,
    }
}
fn check_reading(reading: &Value, source: &Value, personal: &Value,
    baseline: &Value, catalog_version: &Value) -> bool {
    if reading["schema"] != LANGUAGE ||
        !(reading["input"] == source["text"] ||
          reading["input"].as_str() == source["text"].as_str().map(js_trim)) {
        return false
    }
    let Some(baseline_outcome) = baseline.as_str() else { return false };
    if !matches!(baseline_outcome, "refused" | "clarification_required" |
        "incomplete" | "candidate" | "interpretation_required" | "empty") {
        return false
    }
    let Some(outcome) = reading["outcome"].as_str() else { return false };
    if !matches!(outcome, "refused" | "clarification_required" | "incomplete" |
        "candidate" | "interpretation_required" | "empty") { return false }
    // The incumbent NLCL always stamps every returned reading with the
    // compiler version, bounded confidence, and the exact Host world revision.
    // Missing evidence is not a validated reading. Do not infer provenance.
    let Some(feedback) = reading.get("feedback").and_then(Value::as_object) else {
        return false
    };
    if !feedback.get("nlclVersion").and_then(Value::as_str)
        .is_some_and(|s| !s.is_empty() && s.len() <= 128) {
        return false
    }
    if !feedback.get("confidence").and_then(Value::as_f64)
        .is_some_and(|n| n.is_finite() && (0.0..=1.0).contains(&n)) {
        return false
    }
    let Some(world_stamp) = feedback.get("worldV").and_then(Value::as_u64)
        .filter(|v| *v <= MAX_SAFE) else {
        return false
    };
    if source.get("worldRevision").is_some() &&
        source["worldRevision"].as_u64() != Some(world_stamp) {
        return false
    }
    if let Some(modifiers) = reading.get("ignoredModifiers") {
        if !modifiers.as_array().is_some_and(|m| m.len() <= 32 &&
            m.iter().all(safe_text)) { return false }
    }
    if outcome == "candidate" && personal.is_null() &&
        (!reading["candidate"].is_object() || reading.get("refusal").is_some() ||
         reading.get("missing").is_some() || reading.get("choices").is_some()) {
        // A canonical NLCL candidate never coexists with a refusal or
        // unresolved slots. The personal resolver has separate precedence.
        return false
    }
    if outcome == "refused" &&
        (!reading["refusal"]["code"].as_str().is_some_and(|s| !s.is_empty()) ||
         !reading["refusal"]["message"].as_str().is_some_and(|s| !s.is_empty())) {
        return false
    }
    if !personal.is_null() {
        if baseline.as_str() != Some("interpretation_required") ||
            !personal_provenance_valid(personal, catalog_version) {
            return false
        }
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
            !js_trim(s).is_empty() && s.encode_utf16().count() <= 1000
        })
        || !request["catalogVersion"].as_u64().is_some_and(|v| v > 0 && v <= MAX_SAFE)
        || !request["worldRevision"].as_u64().is_some_and(|v| v <= MAX_SAFE)
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
    if !check_reading(reading, source, personal, &request["baselineOutcome"],
        &request["catalogVersion"]) ||
        reading["feedback"]["worldV"].as_i64().is_some_and(|v| {
            request["worldRevision"].as_i64() != Some(v)
        }) {
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
            for (i, id) in choices.iter().enumerate() {
                let Some(id) = id.as_str() else {
                    return refusal(source, "INVALID_READING", "Host reading is malformed or contradictory.")
                };
                let Some(action) = actions.get(id) else {
                    return refusal(source, "UNKNOWN_ACTION", "Action not in the Host catalog.")
                };
                if i < 8 {
                    rank = rank.max(risk_rank(&action["risk"]));
                    alternatives.push(json!({"actionId": id, "title": action["title"],
                        "risk": action["risk"]}));
                }
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


#[cfg(test)]
mod host_whitespace_tests {
    use super::{js_trim, safe_text};
    use serde_json::json;

    #[test]
    fn ecmascript_whitespace_exactly_matches_host_for_known_unicode_edges() {
        assert_eq!(js_trim("\u{FEFF} wiki \u{FEFF}"), "wiki");
        assert_eq!(js_trim("\u{00A0}theme\u{2028}"), "theme");
        assert_eq!(js_trim("\u{0085}theme\u{0085}"), "\u{0085}theme\u{0085}");
        assert!(safe_text(&json!("theme\u{0085}")));
        assert!(!safe_text(&json!("theme\u{FEFF}")));
    }
}

#[cfg(test)]
mod canonical_catalog_tests {
    use super::{action_catalog, checked_args};
    use serde_json::{json, Value};

    #[test]
    fn native_projector_accepts_real_host_catalog_without_external_registry() {
        let catalog: Value = serde_json::from_str(include_str!(
            "../../../apps/vivim-host/control/action-catalog.v1.json"
        )).expect("checked-in Host action catalog JSON");
        assert!(catalog["version"].as_u64().is_some_and(|v| v > 0));
        let rows = catalog["actions"].as_array().expect("real Host actions");
        let actions = action_catalog(&catalog["actions"])
            .expect("canonical Host action metadata must be accepted by native projector");
        assert_eq!(actions.len(), rows.len());
        for action in rows {
            let id = action["id"].as_str().expect("Host action id");
            assert_eq!(actions.get(id).map(|a| a["risk"].clone()), Some(action["risk"].clone()));
            assert_eq!(actions.get(id).map(|a| a["readiness"].clone()),
                Some(action["readiness"].clone()));
            if action["args"].as_object().is_some_and(|a| a.is_empty()) {
                assert_eq!(checked_args(action, &json!({})), Some(json!({})));
            }
        }
    }
}
