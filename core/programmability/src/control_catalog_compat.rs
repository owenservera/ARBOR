//! Strict compatibility of an owner-reviewed personal rule with the current
//! Host action catalog. Only two fingerprinted additive changes are permitted.
//! @hq:capability vivim.rust-control-catalog-compatibility@1
//! No catalog migration, rule update, approval or execution occurs here.
use serde_json::{json, Value};
use sha2::{Digest, Sha256};

const SCHEMA: &str = "vivim.control-catalog-compatibility/1";
const VERSION_13_DIGEST: &str = "422f499257f8828ffe22779a896008549966fdcc89bdcdaa2dc89803de7ae967";
const VERSION_14_DIGEST: &str = "c2c2e6d53a709beca16fb81052206c7ea14bd52a010d996088b662083f24d504";
const MAX_SAFE_INTEGER: u64 = 9_007_199_254_740_991;

fn decision(outcome: &str, compatible: bool) -> Value {
    json!({"schema":SCHEMA, "outcome":outcome, "compatible":compatible,
        "authority":"none","executionAuthorized":false,"effectPerformed":false})
}
fn fail() -> Value { decision("refused", false) }

fn fingerprint(catalog: &Value) -> Option<String> {
    // serde_json::Map uses ordered string keys by default, matching the
    // incumbent recursive JSON-key canonicalization of the catalog payload.
    let bytes = serde_json::to_vec(catalog).ok()?;
    let digest = Sha256::digest(&bytes);
    Some(format!("{digest:x}"))
}
fn predecessor(catalog: &Value, version: u64, removed: &str) -> Option<Value> {
    let mut previous = catalog.clone();
    let actions = previous.get_mut("actions")?.as_array_mut()?;
    actions.retain(|action| action["id"].as_str() != Some(removed));
    previous["version"] = json!(version);
    Some(previous)
}
fn compatible(rule_version: u64, action_id: &str, catalog: &Value) -> bool {
    let Some(version) = catalog["version"].as_u64() else { return false };
    if rule_version == version { return true; }
    if version == 15 && (rule_version == 13 || rule_version == 14)
        && action_id != "program.write_wiki" {
        if catalog["actions"].as_array().is_none_or(|items| items.len() != 38) {
            return false;
        }
        let Some(prior) = predecessor(catalog, 14, "program.write_wiki") else {
            return false;
        };
        if fingerprint(&prior).as_deref() != Some(VERSION_14_DIGEST) {
            return false;
        }
        return compatible(rule_version, action_id, &prior);
    }
    if rule_version != 13 || version != 14 || action_id == "program.read_wiki" {
        return false;
    }
    let Some(current) = catalog["actions"].as_array() else { return false };
    if current.len() != 37 { return false; }
    let Some(previous) = predecessor(catalog, 13, "program.read_wiki") else {
        return false;
    };
    if previous["actions"].as_array().is_none_or(|items| items.len() != 36) {
        return false;
    }
    fingerprint(&previous).as_deref() == Some(VERSION_13_DIGEST)
}
pub fn assess(input: &Value) -> Value {
    if input["schema"] != "vivim.control-catalog-compatibility-input/1" {
        return fail();
    }
    let Some(rule_version) = input["ruleCatalogVersion"].as_u64()
        .filter(|v| *v > 0 && *v <= MAX_SAFE_INTEGER) else { return fail() };
    let Some(action_id) = input["actionId"].as_str()
        .filter(|s| !s.is_empty() && s.len() <= 128) else { return fail() };
    let catalog = &input["catalog"];
    if !catalog.is_object() ||
        !catalog["version"].as_u64().is_some_and(|v| v > 0 && v <= MAX_SAFE_INTEGER) ||
        !catalog["actions"].as_array().is_some_and(|actions| actions.len() <= 3000) {
        return fail();
    }
    let allowed = compatible(rule_version, action_id, catalog);
    decision(if allowed { "compatible" } else { "stale" }, allowed)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn does_not_treat_arbitrary_catalog_changes_as_compatible() {
        let catalog = json!({"version":15,"actions":[{"id":"wiki.page.create"}]});
        let answer = assess(&json!({"schema":"vivim.control-catalog-compatibility-input/1",
            "ruleCatalogVersion":14,"actionId":"wiki.page.create","catalog":catalog}));
        assert_eq!(answer["outcome"], "stale");
        assert_eq!(answer["executionAuthorized"], false);
    }
    #[test]
    fn matching_version_is_inert_and_not_an_approval() {
        let catalog = json!({"version":15,"actions":[]});
        let answer = assess(&json!({"schema":"vivim.control-catalog-compatibility-input/1",
            "ruleCatalogVersion":15,"actionId":"wiki.page.create","catalog":catalog}));
        assert_eq!(answer["compatible"], true);
        assert_eq!(answer["authority"], "none");
        assert_eq!(answer["effectPerformed"], false);
    }
}
