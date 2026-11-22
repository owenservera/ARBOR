//! @hq:capability vivim.gpui-host-overview@1
//! @hq:consumes vivim.host-pwa-view@1
//! @hq:consumes vivim.rust-wiki-read-model@1
//! Native adapter for the canonical VIVIM Host. No local journal or dispatcher.
pub mod control;
pub mod desktop_menu;
pub mod desktop_settings;
pub mod first_contact;
pub mod visual;
use reqwest::blocking::Client;
use serde_json::{Value,json};
use sha2::{Sha256,Digest};
use std::collections::BTreeMap;
use vivim_programmability_core::wiki_read::{self, Page as WikiPage, Captures as WikiCaptures, SearchDocument as WikiSearchDocument};
use vivim_programmability_core::development_projection::{self,ProjectionError};
use std::{time::Duration, io::Read};

const BASE: &str = "http://127.0.0.1:43187";
const LIMIT: u64 = 4 * 1024 * 1024;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Overview {
    pub observed_at: String,
    pub recent: Vec<String>,
    pub active_devices: u64,
    pub wiki_revision: u64,
    pub wiki_pages: Vec<String>,
    pub wiki_content: Vec<WikiPage>,
    pub wiki_digest: String,
    /// SHA256 of the canonical owner-authorized PWA snapshot, not a
    /// transactional watermark shared by the independently read sources.
    pub host_snapshot_digest: String,
    /// Owner-authorized in-process source for exact Rust deltas, never a client grant.
    pub wiki_source: Value,
    pub wiki_page_total: usize,
    pub wiki_captures: Option<WikiCaptures>,
    pub wiki_search_index: Vec<WikiSearchDocument>,
    pub wiki_indexed_pages: usize,
    pub wiki_index_truncated: bool,
}

/// The GPUI-only identity of one authorized read attempt. This does not
/// carry an owner credential, action grant or Host revision identity.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ObservationTicket {
    pub viewport_px: u32,
    pub viewport_epoch: u64,
    pub source_epoch: u64,
    /// A tab/device/viewport presentation change supersedes in-flight reads.
    pub presentation_epoch: u64,
}
impl ObservationTicket {
    pub fn matches(&self, width:u32, viewport_epoch:u64, source_epoch:u64, presentation_epoch:u64)->bool {
        self.viewport_px==width &&
            self.viewport_epoch==viewport_epoch &&
            self.source_epoch==source_epoch &&
            self.presentation_epoch==presentation_epoch
    }
}
/// Passive observation never runs while a command/receipt, uncertain effect
/// or pending exact Host approval is in flight.
pub fn passive_read_allowed(busy:bool, uncertain:bool, approval_pending:bool)->bool {
    !busy && !uncertain && !approval_pending
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ReadError {
    Offline, OwnerRequired, Unavailable, InvalidProjection, InvalidInput, SnapshotChanged,
}

/// A single validated, owner-authorized HQKG response. The epoch is supplied
/// by the existing graph journal, never synthesized by GPUI.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DevelopmentRead {
    pub epoch: u64,
    pub operation: String,
    pub requested_key: String,
    /// SHA256 of the validated query's substantive source response.
    pub source_digest: String,
    pub text: String,
    /// Derived only from the validated journal response. The rendered
    /// graph header itself is nonempty even when the query returned zero rows.
    pub result_empty: bool,
}

/// Bounded, inert per-query fence on the existing HQKG journal epoch.
/// An epoch is graph-global, but output identity is per operation and key.
/// No additional graph database, storage, journal, or network request exists.
#[derive(Default)]
pub struct DevelopmentRevisionGuard {
    high_epoch: Option<u64>,
    by_query: BTreeMap<(String,String),(u64,String,String)>,
}
impl DevelopmentRevisionGuard {
    pub fn accept(&mut self, next: &DevelopmentRead) -> Result<(), ReadError> {
        if !development_projection::valid_query(&next.operation,&next.requested_key)
            || next.source_digest.len()!=64 || !next.source_digest.bytes()
                .all(|b|b.is_ascii_digit()||(b'a'..=b'f').contains(&b)) {
            return Err(ReadError::InvalidProjection);
        }
        if self.high_epoch.is_some_and(|epoch| next.epoch < epoch) {
            return Err(ReadError::InvalidProjection);
        }
        let key=(next.operation.clone(),next.requested_key.clone());
        let text_digest=format!("{:x}",Sha256::digest(next.text.as_bytes()));
        if let Some((epoch,digest,text))=self.by_query.get(&key) {
            if *epoch==next.epoch
                && (digest!=&next.source_digest || text!=&text_digest) {
                return Err(ReadError::InvalidProjection);
            }
        }
        if self.high_epoch.is_some_and(|epoch| next.epoch > epoch) {
            // Old-epoch data is rejected by high_epoch even after eviction.
            self.by_query.clear();
        }
        self.high_epoch=Some(next.epoch);
        if !self.by_query.contains_key(&key) && self.by_query.len()>=32 {
            // A bounded session fence: never claim unbounded query history.
            self.by_query.pop_first();
        }
        self.by_query.insert(key,(next.epoch,next.source_digest.clone(),text_digest));
        Ok(())
    }
}
impl ReadError {
    pub fn label(&self) -> &'static str {
        match self {
            Self::Offline => "Host unavailable",
            Self::OwnerRequired => "Local owner authorization required",
            Self::Unavailable => "Host projection unavailable",
            Self::InvalidProjection => "Invalid Host projection",
            Self::InvalidInput => "Invalid command or plan identity",
            Self::SnapshotChanged => "Host sources changed during readback",
        }
    }
}

fn source_sha256(value:&Value)->Result<String,ReadError>{
    let bytes=serde_json::to_vec(value).map_err(|_|ReadError::InvalidProjection)?;
    Ok(format!("{:x}",Sha256::digest(&bytes)))
}

fn bounded_text(s: &str) -> String {
    s.chars().take(160).collect()
}

pub fn validate_health(v: &Value) -> Result<(), ReadError> {
    if v["schema"] == "vivim.host-status/1" && v["host"]["state"] == "online" {
        Ok(())
    } else { Err(ReadError::Offline) }
}

pub fn project(pwa: &Value, wiki: &Value) -> Result<Overview, ReadError> {
    if pwa["schema"] != "vivim.host-pwa-view/1" {
        return Err(ReadError::InvalidProjection);
    }
    if pwa["state"] != "source-backed" { return Err(ReadError::Unavailable); }
    let snapshot = &pwa["snapshot"];
    if snapshot["control"]["schema"] != "vivim.control-recent/1"
        || snapshot["devices"]["schema"] != "vivim.device-counts/1" {
        return Err(ReadError::InvalidProjection);
    }
    let observed_at = pwa["observedAt"].as_str().filter(|s| !s.is_empty())
        .ok_or(ReadError::InvalidProjection)?;
    let active_devices = snapshot["devices"]["active"].as_u64().ok_or(ReadError::InvalidProjection)?;
    let recent = snapshot["control"]["recent"].as_array().ok_or(ReadError::InvalidProjection)?
        .iter().take(12).map(|r| {
            let action = r["actionId"].as_str().ok_or(ReadError::InvalidProjection)?;
            let state = r["state"].as_str().ok_or(ReadError::InvalidProjection)?;
            let label = format!("{} · {}", bounded_text(action), bounded_text(state));
            // The Host owns these plan IDs. A valid reference is useful for
            // recovery after a desktop restart, but is not an approval token.
            Ok(match r["planId"].as_str().filter(|id| control::valid_id(id)) {
                Some(id) => format!("{label} · {id}"),
                None => label,
            })
        }).collect::<Result<Vec<_>, ReadError>>()?;
    let read = wiki_read::read(wiki).map_err(|_| ReadError::InvalidProjection)?;
    let wiki_pages = read.pages.iter().map(|page| page.name.clone()).collect();
    let host_snapshot_digest=source_sha256(snapshot)?;
    Ok(Overview {
        observed_at: bounded_text(observed_at), recent, active_devices,
        host_snapshot_digest,
        wiki_revision: read.revision, wiki_pages, wiki_content: read.pages,
        wiki_digest: read.digest, wiki_source: wiki.clone(), wiki_page_total: read.pages_total,
        wiki_captures: read.captures,
        wiki_search_index: read.search_index,
        wiki_indexed_pages: read.indexed_pages,
        wiki_index_truncated: read.index_truncated,
    })
}

// Reuse the canonical native Host owner capability loader, never a second
// Windows/Unix token path, and never an alternate approval authority.
fn owner_token() -> Result<String, ReadError> {
    vivim_host_supervisor::read_owner_token().map_err(|_|ReadError::OwnerRequired)
}

#[derive(Clone, Copy)]
enum Endpoint { Health, Pwa, Wiki }
impl Endpoint {
    fn path(self) -> &'static str {
        match self {
            Self::Health => "/api/host/status",
            Self::Pwa => "/api/host/control/pwa-view",
            Self::Wiki => "/api/host/control/wiki-view",
        }
    }
}
fn get(client: &Client, endpoint: Endpoint, token: Option<&str>) -> Result<Value, ReadError> {
    let mut request = client.get(format!("{BASE}{}", endpoint.path()));
    if let Some(t) = token { request = request.bearer_auth(t); }
    let response = request.send().map_err(|_| ReadError::Offline)?;
    match response.status().as_u16() {
        401 | 403 => return Err(ReadError::OwnerRequired),
        200 => {},
        _ => return Err(ReadError::Unavailable),
    }
    let mut bytes = Vec::new();
    response.take(LIMIT + 1).read_to_end(&mut bytes).map_err(|_| ReadError::Unavailable)?;
    if bytes.len() as u64 > LIMIT { return Err(ReadError::InvalidProjection); }
    serde_json::from_slice(&bytes).map_err(|_| ReadError::InvalidProjection)
}
pub fn read_overview() -> Result<Overview, ReadError> {
    let client = Client::builder().no_proxy().redirect(reqwest::redirect::Policy::none())
        .timeout(Duration::from_secs(5)).connect_timeout(Duration::from_secs(2))
        .build().map_err(|_| ReadError::Unavailable)?;
    validate_health(&get(&client, Endpoint::Health, None)?)?;
    let token = owner_token()?;
    if !vivim_host_supervisor::verify_host_owner(&client,&token) {
        return Err(ReadError::OwnerRequired);
    }
    // Bracket a non-transactional Host summary GET between two authorized
    // Wiki reads. This proves only that the Wiki projection did not change
    // over this read window, not that all Host systems share a transaction.
    let before = get(&client, Endpoint::Wiki, Some(&token))?;
    let pwa_before = get(&client, Endpoint::Pwa, Some(&token))?;
    let pwa_after = get(&client, Endpoint::Pwa, Some(&token))?;
    let after = get(&client, Endpoint::Wiki, Some(&token))?;
    project_double_bracketed(&pwa_before,&pwa_after,&before,&after)
}

/// Conservatively refuse mixed Wiki observations, rather than presenting a
/// newer Host summary alongside a falsely coherent old Wiki state.
pub fn project_bracketed(pwa:&Value,before:&Value,after:&Value)->Result<Overview,ReadError>{
    // Exact equality is deliberate: a version-equivalent but changed source
    // object must not be silently treated as the same authorized readback.
    if before != after {return Err(ReadError::SnapshotChanged);}
    project(pwa,after)
}

/// Bracket the Host's nontransactional PWA summary between two Wiki reads.
/// Stable authoritative snapshots, not timestamps, are compared: each GET
/// legitimately receives a different observedAt. This bounds Wiki, control
/// and device drift without pretending there is a shared Host transaction.
pub fn project_double_bracketed(
    pwa_before:&Value,pwa_after:&Value,wiki_before:&Value,wiki_after:&Value
) -> Result<Overview,ReadError> {
    if pwa_before["schema"]!="vivim.host-pwa-view/1" ||
       pwa_after["schema"]!="vivim.host-pwa-view/1" {
        return Err(ReadError::InvalidProjection);
    }
    if pwa_before["state"]!=pwa_after["state"] ||
       pwa_before["snapshot"]!=pwa_after["snapshot"] {
        return Err(ReadError::SnapshotChanged);
    }
    project_bracketed(pwa_after,wiki_before,wiki_after)
}

/// Owner-only development graph read, from the same Host endpoint used by PWA.
/// Neither a graph reference nor a symbol name is an execution credential.
pub fn read_development(operation:&str,key:&str)->Result<DevelopmentRead,ReadError>{
    if !development_projection::valid_query(operation,key){return Err(ReadError::InvalidInput)}
    let client=Client::builder().no_proxy().redirect(reqwest::redirect::Policy::none())
        .timeout(Duration::from_secs(12)).connect_timeout(Duration::from_secs(2))
        .build().map_err(|_|ReadError::Unavailable)?;
    validate_health(&get(&client,Endpoint::Health,None)?)?;
    let token=owner_token()?;
    if !vivim_host_supervisor::verify_host_owner(&client,&token) {
        return Err(ReadError::OwnerRequired);
    }
    let response=client.get(format!("{BASE}/api/host/control/development/graph"))
        .bearer_auth(token).query(&[("operation",operation),("key",key)])
        .send().map_err(|_|ReadError::Offline)?;
    match response.status().as_u16(){
        401|403=>return Err(ReadError::OwnerRequired),
        200=>{},
        _=>return Err(ReadError::Unavailable),
    }
    let mut bytes=Vec::new();
    response.take(256*1024+1).read_to_end(&mut bytes).map_err(|_|ReadError::Unavailable)?;
    if bytes.len()>256*1024{return Err(ReadError::InvalidProjection)}
    let data:Value=serde_json::from_slice(&bytes).map_err(|_|ReadError::InvalidProjection)?;
    project_development(operation,key,&data)
}

/// Preserve the same native projection validation before exposing the journal
/// epoch as a typed field. A requested key is an attribution, not graph truth.
pub fn project_development(operation:&str,key:&str,data:&Value)->Result<DevelopmentRead,ReadError>{
    if !development_projection::valid_query(operation,key) {
        return Err(ReadError::InvalidInput);
    }
    // The existing HQKG native adapter echoes the exact key for indexed
    // queries. File computations instead identify their source through
    // programId=dev.<file-id>. A plausible operation/epoch from another
    // request must never be attributed to this user's selected source.
    let source_matches=if operation=="compute" {
        data["programId"].as_str()==Some(format!("dev.{key}").as_str())
    } else {
        data["key"].as_str()==Some(key)
    };
    if !source_matches { return Err(ReadError::InvalidProjection); }
    let text=development_projection::render(operation,data).map_err(|error|match error{
        ProjectionError::Unavailable=>ReadError::Unavailable,
        ProjectionError::InvalidInput=>ReadError::InvalidInput,
        ProjectionError::InvalidProjection=>ReadError::InvalidProjection,
    })?;
    let epoch=data["epoch"].as_u64().ok_or(ReadError::InvalidProjection)?;
    let result=&data["result"];
    let result_empty=match operation {
        "symbols"=>result["symbols"].as_array().is_some_and(Vec::is_empty),
        "sources"=>result["anchors"].as_array().is_some_and(Vec::is_empty),
        "impact"=>result["files"].as_array().is_some_and(Vec::is_empty),
        "compute"=>data["outputs"].as_array().is_some_and(Vec::is_empty),
        "wiring"=>["imports","dependents","semanticObservations","potentialWiring"]
            .iter().all(|name|result[*name].as_array().is_some_and(Vec::is_empty)),
        _=>false,
    };
    // The journal epoch and stable substantive response identify the read.
    // Request time or other transient transport metadata are not part of it.
    let substantive=json!({
        "state":data["state"],"result":data["result"],
        "operation":data["operation"],"key":data["key"],
        "programId":data["programId"],"programRevision":data["programRevision"],
        "outputs":data["outputs"],"computation":data["computation"]
    });
    let source_digest=source_sha256(&substantive)?;
    Ok(DevelopmentRead{epoch,operation:operation.to_owned(),
        requested_key:key.to_owned(),source_digest,text,result_empty})
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    fn pwa() -> Value {
        json!({"schema":"vivim.host-pwa-view/1","state":"source-backed","observedAt":"2026-11-20T00:00:00Z",
            "snapshot":{"control":{"schema":"vivim.control-recent/1","recent":[{"actionId":"wiki.page.create","state":"applied"}]},
            "devices":{"schema":"vivim.device-counts/1","active":2}}})
    }
    #[test] fn read_ticket_refuses_resize_a_b_a_and_host_effect_overlap() {
        let request=ObservationTicket{viewport_px:960,viewport_epoch:8,source_epoch:3,presentation_epoch:4};
        assert!(request.matches(960,8,3,4));
        assert!(!request.matches(720,8,3,4));
        assert!(!request.matches(960,10,3,4)); // A -> B -> A
        assert!(!request.matches(960,8,4,4)); // Host effect began
        assert!(!request.matches(960,8,3,5)); // Panel A -> B -> A
    }
    #[test] fn passive_observation_never_crosses_owner_approval() {
        assert!(passive_read_allowed(false,false,false));
        assert!(!passive_read_allowed(true,false,false));
        assert!(!passive_read_allowed(false,true,false));
        assert!(!passive_read_allowed(false,false,true));
    }
    #[test] fn rejects_unrelated_listener() {
        assert_eq!(validate_health(&json!({"host":{"state":"online"}})), Err(ReadError::Offline));
        assert!(validate_health(&json!({"schema":"vivim.host-status/1","host":{"state":"online"}})).is_ok());
    }
    #[test] fn projects_host_readback() {
        let result = project(&pwa(), &json!({"revision":7,"pages":{"work":{"sections":{}}}})).unwrap();
        assert_eq!(result.wiki_revision,7);
        assert_eq!(result.active_devices,2);
        assert_eq!(result.host_snapshot_digest.len(),64);
        assert_eq!(result.wiki_pages, vec!["work".to_string()]);
        assert_eq!(result.recent, vec!["wiki.page.create · applied".to_string()]);
    }
    #[test] fn fails_closed() {
        let mut p = pwa(); p["state"] = json!("unavailable");
        assert_eq!(project(&p, &json!({})), Err(ReadError::Unavailable));
        assert_eq!(project(&pwa(), &json!({"revision":-1,"pages":{}})), Err(ReadError::InvalidProjection));
    }
    #[test] fn bracket_rejects_mid_read_wiki_mutation() {
        let one=json!({"revision":7,"pages":{"work":{"sections":{}}}});
        let mut next=one.clone();
        next["revision"]=json!(8);
        assert_eq!(project_bracketed(&pwa(),&one,&next),Err(ReadError::SnapshotChanged));
        let accepted=project_bracketed(&pwa(),&one,&one).unwrap();
        assert_eq!(accepted.wiki_revision,7);
    }
    #[test] fn development_epoch_fence_rejects_rollback_and_same_epoch_conflict() {
        let source=json!({
            "schema":"hqkg.development-query/1","authority":"read-only",
            "operation":"symbols","key":"work","epoch":7,"state":"indexed-snapshot",
            "result":{"symbols":[]}
        });
        let first=project_development("symbols","work",&source).unwrap();
        assert_eq!(first.epoch,7);
        let mut guard=DevelopmentRevisionGuard::default();
        assert!(guard.accept(&first).is_ok());
        assert!(guard.accept(&first).is_ok());
        let mut rollback=first.clone();
        rollback.epoch=6;
        assert_eq!(guard.accept(&rollback),Err(ReadError::InvalidProjection));
        let mut conflict=first.clone();
        conflict.text.push_str(" altered");
        assert_eq!(guard.accept(&conflict),Err(ReadError::InvalidProjection));
        let mut other_source=source.clone();
        other_source["key"]=json!("other");
        let another=project_development("symbols","other",&other_source).unwrap();
        assert!(guard.accept(&another).is_ok());
        // Switching queries must not forget a previously seen same-epoch
        // query: otherwise an A/B/A read could accept contradictory source.
        assert_eq!(guard.accept(&conflict),Err(ReadError::InvalidProjection));
        let mut advance=source;
        advance["epoch"]=json!(8);
        let newer=project_development("symbols","work",&advance).unwrap();
        assert!(guard.accept(&newer).is_ok());
        assert!(guard.accept(&first).is_err());
    }
    #[test] fn graph_query_fence_is_bounded_and_retains_high_epoch() {
        let source=json!({
            "schema":"hqkg.development-query/1","authority":"read-only",
            "operation":"symbols","key":"work","epoch":7,"state":"indexed-snapshot",
            "result":{"symbols":[]}
        });
        let mut guard=DevelopmentRevisionGuard::default();
        for index in 0..40 {
            let key=format!("source-{index}");
            let mut scoped=source.clone();
            scoped["key"]=json!(key);
            guard.accept(&project_development("symbols",&key,&scoped).unwrap()).unwrap();
        }
        assert_eq!(guard.by_query.len(),32);
        assert_eq!(guard.high_epoch,Some(7));
        let mut scoped=source.clone();
        scoped["key"]=json!("source-39");
        let mut old=project_development("symbols","source-39",&scoped).unwrap();
        old.epoch=6;
        assert!(guard.accept(&old).is_err());
        let mut forged=project_development("symbols","source-39",&scoped).unwrap();
        forged.source_digest="wrong".into();
        assert!(guard.accept(&forged).is_err());
    }
    #[test] fn source_digest_detects_same_epoch_changed_graph_payload() {
        let source=json!({
            "schema":"hqkg.development-query/1","authority":"read-only",
            "operation":"symbols","key":"work","epoch":7,"state":"indexed-snapshot",
            "result":{"symbols":[]}
        });
        let mut guard=DevelopmentRevisionGuard::default();
        let one=project_development("symbols","work",&source).unwrap();
        guard.accept(&one).unwrap();
        let mut changed=source;
        changed["result"]["symbols"]=json!([{
            "name":"x","path":"path","line":1,
            "id":"id","fileId":"file"
        }]);
        let two=project_development("symbols","work",&changed).unwrap();
        assert_ne!(one.source_digest,two.source_digest);
        assert!(guard.accept(&two).is_err());
    }
    #[test] fn double_bracket_detects_control_and_device_drift_but_not_observation_time() {
        let wiki=json!({"revision":7,"pages":{"work":{"sections":{}}}});
        let before=pwa();
        let mut after=before.clone();
        after["observedAt"]=json!("2026-11-20T00:00:02Z");
        assert!(project_double_bracketed(&before,&after,&wiki,&wiki).is_ok());
        after["snapshot"]["devices"]["active"]=json!(3);
        assert_eq!(project_double_bracketed(&before,&after,&wiki,&wiki),Err(ReadError::SnapshotChanged));
        after=before.clone();
        after["snapshot"]["control"]["recent"]=json!([]);
        assert_eq!(project_double_bracketed(&before,&after,&wiki,&wiki),Err(ReadError::SnapshotChanged));
        let mut altered_wiki=wiki.clone();
        altered_wiki["revision"]=json!(8);
        assert_eq!(project_double_bracketed(&before,&before,&wiki,&altered_wiki),Err(ReadError::SnapshotChanged));
    }
    #[test] fn exact_development_source_key_cannot_be_substituted() {
        let mut response=json!({
            "schema":"hqkg.development-query/1","authority":"read-only",
            "operation":"symbols","key":"a","epoch":5,"state":"indexed-snapshot",
            "result":{"symbols":[]}
        });
        assert!(project_development("symbols","a",&response).is_ok());
        assert_eq!(project_development("symbols","b",&response),Err(ReadError::InvalidProjection));
        response.as_object_mut().unwrap().remove("key");
        assert_eq!(project_development("symbols","a",&response),Err(ReadError::InvalidProjection));
    }
    #[test] fn exact_computed_source_program_id_is_required() {
        let file_id=format!("hqg1:{}", "a".repeat(64));
        let mut response=json!({
            "schema":"hqkg.development-query/1","authority":"read-only",
            "operation":"compute","state":"computed","epoch":11,
            "computation":"source-backed-graph",
            "programId":format!("dev.{file_id}"),"programRevision":2,
            "outputs":[],"executionAuthorized":false,"effectPerformed":false
        });
        let valid=project_development("compute",&file_id,&response).unwrap();
        assert_eq!(valid.epoch,11);
        response["programId"]=json!(format!("dev.hqg1:{}", "b".repeat(64)));
        assert_eq!(project_development("compute",&file_id,&response),
            Err(ReadError::InvalidProjection));
    }
    #[test] fn graph_empty_is_source_derived_not_render_text_length() {
        let source=json!({
            "schema":"hqkg.development-query/1","authority":"read-only",
            "operation":"symbols","key":"work","epoch":11,"state":"indexed-snapshot",
            "result":{"symbols":[]}
        });
        let empty=project_development("symbols","work",&source).unwrap();
        assert!(empty.result_empty);
        assert!(!empty.text.is_empty());
        let mut filled=source;
        filled["result"]["symbols"]=json!([{"name":"test","path":"src/main.rs","line":1,"id":"x","fileId":"hqg1:a"}]);
        assert!(!project_development("symbols","work",&filled).unwrap().result_empty);
    }
    #[test] fn only_fixed_read_paths() {
        for e in [Endpoint::Health, Endpoint::Pwa, Endpoint::Wiki] {
            assert!(!e.path().contains("execute"));
            assert!(e.path().starts_with("/api/host/"));
        }
    }
}
