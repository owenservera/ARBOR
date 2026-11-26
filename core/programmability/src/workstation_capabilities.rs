//! Native workstation capability crosswalk and exact edit preparation.
//! @hq:capability vivim.rust-workstation-operations@1
//! Pure deterministic computations only. Host owns scope, grants, filesystem
//! access, effect execution and receipts. No new action registry or dispatcher.
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;

const FORK_SHA: &str = "9a101b17e44577f0baefa4c7120f087881c5cc56";
const AUDIT_SCHEMA: &str = "vivim.workstation-coverage/1";
const EDIT_SCHEMA: &str = "vivim.workstation-edit-preview/1";
const MAX_TEXT: usize = 4 * 1024 * 1024;
const MAX_FRAGMENT: usize = MAX_TEXT;

// Reference inventory of the pinned MIT fork's src/server.ts ListTools handler.
// These proposed action IDs are migration requirements, NOT registrations.
const BASELINE: [(&str, &str, Option<&str>); 25] = [
    ("get_config", "configuration", Some("workstation.config.inspect")),
    ("set_config_value", "configuration", Some("workstation.config.propose")),
    ("read_file", "filesystem", Some("workstation.file.read")),
    ("read_multiple_files", "filesystem", Some("workstation.files.read")),
    ("write_file", "filesystem", Some("workstation.file.write")),
    ("write_pdf", "documents", Some("workstation.document.pdf")),
    ("create_directory", "filesystem", Some("workstation.directory.create")),
    ("list_directory", "filesystem", Some("workstation.directory.list")),
    ("move_file", "filesystem", Some("workstation.file.move")),
    ("start_search", "search", Some("workstation.search.start")),
    ("get_more_search_results", "search", Some("workstation.search.next")),
    ("stop_search", "search", Some("workstation.search.cancel")),
    ("list_searches", "search", Some("workstation.search.list")),
    ("get_file_info", "filesystem", Some("workstation.file.inspect")),
    ("edit_block", "editing", Some("workstation.file.edit")),
    ("start_process", "process", Some("workstation.session.start")),
    ("read_process_output", "process", Some("workstation.session.output")),
    ("interact_with_process", "process", Some("workstation.session.input")),
    ("force_terminate", "process", Some("workstation.session.cancel")),
    ("list_sessions", "process", Some("workstation.process.sessions")),
    ("list_processes", "process", Some("workstation.process.list")),
    ("kill_process", "process", Some("workstation.process.terminate")),
    ("get_usage_stats", "observability", Some("workstation.usage.inspect")),
    ("get_recent_tool_calls", "observability", Some("workstation.receipts.inspect")),
    ("give_feedback_to_desktop_commander", "vendor-specific", None),
];
fn refusal(schema: &str, code: &str) -> Value {
    json!({"schema":schema,"outcome":"refused","code":code,
        "authority":"none","executionAuthorized":false,"effectPerformed":false})
}
fn sha(text: &str) -> String {
    format!("{:x}", Sha256::digest(text.as_bytes()))
}
fn only_keys(v: &Value, expected: &[&str]) -> bool {
    v.as_object().is_some_and(|map| map.len()==expected.len() &&
        map.keys().all(|k| expected.contains(&k.as_str())))
}
fn id(s: &str) -> bool {
    !s.is_empty() && s.len()<=128 && s.bytes().all(|b| b.is_ascii_alphanumeric() || b"._:-".contains(&b))
}

/// Compare against the caller's current canonical Host catalog, not a second
/// catalog. Even a "verified" declaration is not an installed/live receipt.
pub fn coverage(input: &Value) -> Value {
    if !only_keys(input, &["catalog"]) {
        return refusal(AUDIT_SCHEMA,"INVALID_INPUT");
    }
    let catalog=&input["catalog"];
    let Some(version)=catalog["version"].as_u64().filter(|n| *n>0 && *n<=9_007_199_254_740_991) else {
        return refusal(AUDIT_SCHEMA,"INVALID_CATALOG");
    };
    let Some(actions)=catalog["actions"].as_array().filter(|a| a.len()<=3000) else {
        return refusal(AUDIT_SCHEMA,"INVALID_CATALOG");
    };
    if catalog["schema"]!="vivim.control-action-catalog/1" {
        return refusal(AUDIT_SCHEMA,"INVALID_CATALOG");
    }
    let mut index=BTreeMap::new();
    for action in actions {
        let Some(action_id)=action["id"].as_str().filter(|s| id(s)) else {
            return refusal(AUDIT_SCHEMA,"INVALID_CATALOG");
        };
        let Some(readiness)=action["readiness"].as_str().filter(|s|
            matches!(*s,"adapter_pending"|"enforcement_missing"|"unsupported"|"source_wired"|"verified")) else {
            return refusal(AUDIT_SCHEMA,"INVALID_CATALOG");
        };
        if index.insert(action_id,readiness).is_some() {
            return refusal(AUDIT_SCHEMA,"DUPLICATE_CATALOG_ACTION");
        }
    }
    let mut registered=0;
    let rows: Vec<Value>=BASELINE.iter().map(|(name,group,target)| {
        let declared=target.and_then(|key| index.get(key).copied());
        if declared.is_some() { registered+=1; }
        json!({"referenceTool":name,"family":group,"proposedHostActionId":target,
            "declaredReadiness":declared,
            "status":if target.is_none() {"vendor-specific-replace-with-local-feedback"}
                else if declared.is_some() {"catalog-declared-not-live-attested"}
                else {"not-registered"},
            "nativeProof":if *name=="edit_block" {"exact-edit-preview-implemented"}else{"not-assessed"},
            "liveAccepted":false})
    }).collect();
    json!({"schema":AUDIT_SCHEMA,"outcome":"computed",
        "reference":{"repository":"owenservera/DesktopCommanderMCP-VIVIM",
            "revision":FORK_SHA,"source":"src/server.ts","license":"MIT"},
        "hostCatalogVersion":version,"hostCatalogActions":actions.len(),
        "referenceTools":BASELINE.len(),"proposedOperations":24,
        "catalogRegistered":registered,"liveAccepted":0,
        "rows":rows,
        "authority":"none","executionAuthorized":false,"effectPerformed":false})
}

/// Exact replacement preview, no fuzzy guessing or implicit writes. A Host
/// executor must independently recheck the grant, source identity, version,
/// digest and current file bytes at the write boundary. The preview itself
/// cannot act as approval. No path, shell command or credential is accepted.
pub fn edit_preview(input: &Value) -> Value {
    if !only_keys(input,&["sourceId","expectedDigest","text","oldText","newText"]) {
        return refusal(EDIT_SCHEMA,"INVALID_INPUT");
    }
    let Some(source_id)=input["sourceId"].as_str().filter(|s| id(s)) else {
        return refusal(EDIT_SCHEMA,"INVALID_SOURCE");
    };
    let (Some(expected),Some(text),Some(old),Some(new))=(input["expectedDigest"].as_str(),
        input["text"].as_str(),input["oldText"].as_str(),input["newText"].as_str()) else {
        return refusal(EDIT_SCHEMA,"INVALID_INPUT");
    };
    if text.len()>MAX_TEXT || old.is_empty() || old.len()>MAX_FRAGMENT ||
        new.len()>MAX_FRAGMENT || [text,old,new].iter().any(|s|s.contains('\0')) {
        return refusal(EDIT_SCHEMA,"TEXT_LIMIT");
    }
    let before=sha(text);
    if before!=expected {
        return refusal(EDIT_SCHEMA,"SOURCE_DIGEST_MISMATCH");
    }
    if old==new { return refusal(EDIT_SCHEMA,"NO_CHANGE"); }
    let Some(start)=text.find(old) else {return refusal(EDIT_SCHEMA,"MATCH_NOT_FOUND");};
    // Start after the first UTF-8 scalar, not the whole match: overlapping
    // matches are still ambiguous.
    let next=start+old.chars().next().unwrap().len_utf8();
    if text[next..].contains(old) {return refusal(EDIT_SCHEMA,"MATCH_AMBIGUOUS");}
    let end=start+old.len();
    if text.len()-old.len()+new.len()>MAX_TEXT {
        return refusal(EDIT_SCHEMA,"TEXT_LIMIT");
    }
    let mut edited=String::with_capacity(text.len()-old.len()+new.len());
    edited.push_str(&text[..start]);edited.push_str(new);edited.push_str(&text[end..]);
    let after=sha(&edited);
    json!({"schema":EDIT_SCHEMA,"outcome":"prepared","sourceId":source_id,
        "beforeDigest":before,"afterDigest":after,"startByte":start,"endByte":end,
        "previewText":edited,"authority":"none","executionAuthorized":false,"effectPerformed":false})
}

#[cfg(test)]
mod tests {
    use super::*;
    fn catalog()->Value {
        serde_json::from_str(include_str!("../../../apps/vivim-host/control/action-catalog.v1.json")).unwrap()
    }
    fn request(text:&str,old:&str,new:&str)->Value {
        json!({"sourceId":"source.file:1","expectedDigest":sha(text),"text":text,"oldText":old,"newText":new})
    }
    #[test]
    fn actual_catalog_and_all_reference_tools_report_truthfully() {
        let c=catalog();
        let r=coverage(&json!({"catalog":c}));
        assert_eq!(r["referenceTools"],25);
        assert_eq!(r["proposedOperations"],24);
        let expected=BASELINE.iter().filter(|(_,_,target)| target.is_some_and(|id| c["actions"].as_array().unwrap().iter().any(|a|a["id"]==id))).count();
        assert_eq!(r["catalogRegistered"],expected);
        assert_eq!(r["hostCatalogActions"],c["actions"].as_array().unwrap().len());
        let rows=r["rows"].as_array().unwrap();
        assert_eq!(rows.iter().map(|row|row["referenceTool"].as_str().unwrap()).collect::<std::collections::BTreeSet<_>>().len(),25);
        assert_eq!(r["executionAuthorized"],false);
        assert_eq!(r["liveAccepted"],0);
    }
    #[test]
    fn catalog_declaration_never_promotes_live_acceptance() {
        let mut c=catalog();
        let baseline=coverage(&json!({"catalog":c.clone()}))["catalogRegistered"].as_u64().unwrap();
        c["actions"].as_array_mut().unwrap().push(json!({"id":"workstation.document.pdf","readiness":"verified"}));
        let r=coverage(&json!({"catalog":c}));
        assert_eq!(r["catalogRegistered"],baseline+1);
        assert_eq!(r["liveAccepted"],0);
        assert!(r["rows"].as_array().unwrap().iter().all(|x|x["liveAccepted"]==false));
    }
    #[test]
    fn duplicate_catalog_action_is_refused() {
        let mut c=catalog();let a=c["actions"][0].clone();
        c["actions"].as_array_mut().unwrap().push(a);
        assert_eq!(coverage(&json!({"catalog":c}))["code"],"DUPLICATE_CATALOG_ACTION");
    }
    #[test]
    fn exact_unicode_edit_preserves_other_bytes() {
        let r=edit_preview(&request("á\r\nMallorca\r\n","Mallorca","VIVIM"));
        assert_eq!(r["outcome"],"prepared");assert_eq!(r["startByte"],4);
        assert_eq!(r["previewText"],"á\r\nVIVIM\r\n");
        assert_eq!(r["afterDigest"],sha("á\r\nVIVIM\r\n"));
        assert_eq!(r["executionAuthorized"],false);assert_eq!(r["effectPerformed"],false);
    }
    #[test]
    fn stale_missing_and_ambiguous_matches_refused() {
        let mut stale=request("one","one","two");stale["expectedDigest"]=json!("0".repeat(64));
        assert_eq!(edit_preview(&stale)["code"],"SOURCE_DIGEST_MISMATCH");
        assert_eq!(edit_preview(&request("one","absent","two"))["code"],"MATCH_NOT_FOUND");
        assert_eq!(edit_preview(&request("aaa","aa","b"))["code"],"MATCH_AMBIGUOUS");
        assert_eq!(edit_preview(&request("ééé","éé","b"))["code"],"MATCH_AMBIGUOUS");
        assert_eq!(edit_preview(&request("same","same","same"))["code"],"NO_CHANGE");
    }
    #[test]
    fn unknown_fields_and_oversized_inputs_refused() {
        let mut r=request("one","one","two");r["path"]=json!("untrusted");
        assert_eq!(edit_preview(&r)["code"],"INVALID_INPUT");
        assert_eq!(edit_preview(&request(&"a".repeat(MAX_TEXT+1),"a","b"))["code"],"TEXT_LIMIT");
        assert_eq!(edit_preview(&request("a","a","\0"))["code"],"TEXT_LIMIT");
    }
    #[test]
    fn existing_product_kernel_dispatches_both_operations() {
        let k=crate::product_kernel::dispatch(&json!({"schema":"vivim.product-pure-request/1",
            "operation":"workstation-coverage","input":{"catalog":catalog()}}));
        assert_eq!(k["state"],"computed");assert_eq!(k["result"]["referenceTools"],25);
        let k=crate::product_kernel::dispatch(&json!({"schema":"vivim.product-pure-request/1",
            "operation":"workstation-edit-preview","input":request("a","a","b")}));
        assert_eq!(k["result"]["previewText"],"b");assert_eq!(k["executionAuthorized"],false);
    }
}
