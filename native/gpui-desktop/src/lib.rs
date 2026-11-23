//! @hq:capability vivim.gpui-host-overview@1
//! @hq:consumes vivim.host-pwa-view@1
//! @hq:consumes vivim.rust-wiki-read-model@1
//! Native adapter for the canonical VIVIM Host. No local journal or dispatcher.
pub mod control;
pub mod desktop_capture;
pub mod desktop_menu;
pub mod native_windows_menu;
pub mod desktop_settings;
pub mod first_contact;
pub mod live_delivery;
pub mod surface_registry;
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
    /// The existing Host bootstrap phone-safe ledger aggregates. Never a
    /// personal statement, user relationship or verified fact.
    pub oracle_progress: Option<OracleProgress>,
    /// The same read-only, hash-linked Studio outcome projection used by the PWA.
    /// No provider prompts/replies, browser ownership or native send authority.
    pub studio_activity: Option<StudioActivity>,
    /// Inert Studio capture and Drive activity from the same authorized Host owner view.
    pub studio_operations: Option<StudioOperations>,
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OracleProgress {
    pub claims: u64,
    pub observations: u64,
    pub contradictions: u64,
    pub complete_passes: u64,
    pub observed_passes: u64,
}
/// Only historical verified delivery metadata from the existing Host summary.
/// A missing, malformed, or unverified feed stays unavailable; never infer a
/// successful provider send from an installed adapter or an active session.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StudioActivity {
    pub revision: u64,
    pub total: u64,
    pub rows: Vec<String>,
}
/// No Studio browser/controller, provider driver, job runner or owner grant
/// is created in GPUI. This value is a validated read-only Host projection.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StudioOperations {
    pub capture: String,
    pub browser: String,
    pub drive: String,
    pub jobs: Vec<String>,
    pub capture_running: bool,
    pub capture_ready: bool,
    pub targets: Vec<StudioTarget>,
    pub sites: Vec<String>,
    pub cancelable_jobs: Vec<String>,
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StudioTarget {
    pub id: String,
    pub host: String,
}
fn project_studio_operations(snapshot:&Value)->Option<StudioOperations>{
    let value=&snapshot["studioOperations"];
    if value["schema"]!="vivim.studio-operations/1" ||
       value["authority"]!="read-only" ||
       !matches!(value["state"].as_str(),Some("source-backed"|"unavailable")){
        return None;
    }
    let capture=&value["capture"];
    let (capture_label,browser_label)=match capture["state"].as_str()?{
        "unavailable"=>("Capture source unavailable".to_owned(),
            "Browser source unavailable".to_owned()),
        "source-backed"=>{
            let state=capture["recorderState"].as_str()?;
            let browser=capture["browserState"].as_str()?;
            if !matches!(state,"idle"|"recording"|"stopping"|"paused"|"disconnected"|"error")||
               !matches!(browser,"available"|"not-running"|"profile-unverified")||
               !capture["browserVerified"].is_boolean(){return None}
            (format!("Capture · {state}"),format!("Provider browser · {browser} · {}",
                if capture["browserVerified"]==true && browser=="available"{
                    "owner verified"
                }else{"not ready"}))
        },
        _=>return None
    };
    // The read model exposes exact selection IDs only. No URLs, titles,
    // prompts, full profiles or provider browser operations enter GPUI.
    let targets_state=capture["targetsState"].as_str().unwrap_or("unavailable");
    if !matches!(targets_state,"source-backed"|"unavailable"){return None}
    let target_rows=capture["targets"].as_array();
    if target_rows.is_some_and(|items|items.len()>8) ||
       targets_state=="source-backed"&&target_rows.is_none() {return None}
    let mut targets=Vec::new();
    let mut target_seen=std::collections::BTreeSet::new();
    for t in target_rows.into_iter().flatten(){
        let id=t["id"].as_str()?;
        let host=t["host"].as_str()?;
        if !(16..=64).contains(&id.len())||!id.bytes().all(|b|
            b.is_ascii_alphanumeric()||b==b'_'||b==b'-')||
            host.is_empty()||host.len()>96||host.chars().any(char::is_control)||
            !target_seen.insert(id) {return None}
        targets.push(StudioTarget{id:id.to_owned(),host:host.to_owned()});
    }
    let capture_running=capture["state"]=="source-backed" &&
        capture["recorderState"]=="recording";
    let capture_ready=capture["state"]=="source-backed" &&
        capture["recorderState"]=="idle" &&
        capture["browserState"]=="available" &&
        capture["browserVerified"]==true;
    let drive=&value["drive"];
    let site_rows=drive["sites"].as_array();
    if site_rows.is_some_and(|items|items.len()>12){return None}
    let mut sites=Vec::new();
    let mut site_seen=std::collections::BTreeSet::new();
    for row in site_rows.into_iter().flatten() {
        let id=row.as_str()?;
        if !(2..=64).contains(&id.len())||
            !id.bytes().enumerate().all(|(i,b)|if i==0{b.is_ascii_lowercase()}
                else{b.is_ascii_lowercase()||b.is_ascii_digit()||b==b'_'||b==b'-'})||
            !site_seen.insert(id) {return None}
        sites.push(id.to_owned());
    }
    let mut cancelable_jobs=Vec::new();
    let (drive_label,rows)=match drive["state"].as_str()? {
        "unavailable"=>("Drive job source unavailable".to_owned(),Vec::new()),
        "source-backed"=>{
            let shown=drive["shown"].as_u64()?;
            let active=drive["active"].as_u64()?;
            let jobs=drive["jobs"].as_array()?;
            if shown>20||active>shown||jobs.len()>8||jobs.len() as u64>shown {
                return None;
            }
            let mut seen=std::collections::BTreeSet::new();
            let mut rows=Vec::new();
            for job in jobs {
                let id=job["id"].as_str()?;
                if id.len()!=36||!id.bytes().all(|b|
                    b.is_ascii_hexdigit()||b==b'-')||!seen.insert(id){return None}
                let state=job["state"].as_str()?;
                let mode=job["mode"].as_str()?;
                let dry=job["dryRun"].as_bool()?;
                if !matches!(state,"queued"|"running"|"done"|"failed"|"cancelled")||
                   !matches!(mode,"drive"|"campaign"){return None}
                if matches!(state,"queued"|"running"){cancelable_jobs.push(id.to_owned());}
                rows.push(format!("{mode} · {state} · {} · job {id}",
                    if dry{"dry run"}else{"effect status from Studio"}));
            }
            (format!("Drive · {shown} recent jobs · {active} active"),rows)
        },
        _=>return None
    };
    if value["state"]=="unavailable" &&
        (capture["state"]!="unavailable"||drive["state"]!="unavailable"){return None}
    Some(StudioOperations{capture:capture_label,browser:browser_label,
        drive:drive_label,jobs:rows,capture_running,capture_ready,
        targets,sites,cancelable_jobs})
}

fn source_digest_hex(value:&Value)->bool {
    value.as_str().is_some_and(|text| text.len()==64 &&
        text.bytes().all(|b|b.is_ascii_digit()||(b'a'..=b'f').contains(&b)))
}
fn project_studio_activity(snapshot:&Value)->Option<StudioActivity>{
    let data=&snapshot["studioOutcomes"];
    if data["schema"]!="vivim.studio-outcomes/1" ||
       data["state"]!="source-backed" ||
       data["authority"]!="read-only-historical" {
        return None;
    }
    let revision=data["revision"].as_u64()?;
    let total=data["total"].as_u64()?;
    let items=data["items"].as_array()?;
    if items.len()>16 || total<items.len() as u64{return None}
    let mut seen=std::collections::BTreeSet::new();
    let mut rows=Vec::new();
    for item in items {
        let id=item["id"].as_str().filter(|s| !s.is_empty() && s.len()<=120)?;
        if !seen.insert(id){return None}
        let (label,source)=match item["state"].as_str()? {
            "reply_observed"=>("Reply observed","studio"),
            "delivered"=>("Delivery acknowledged","phone"),
            "uncertain"=>("Send uncertain","journal"),
            "failed_before_send"=>("Failed before send","journal"),
            "failed_after_send"=>("Possible send — review required","journal"),
            _=>return None
        };
        let sequence=item["sequence"].as_u64()?;
        let source_revision=item["sourceRevision"].as_u64()?;
        let timestamp=item["observedAt"].as_str().filter(|s|
            !s.is_empty()&&s.len()<=64&&s.contains('T')&&!s.chars().any(char::is_control))?;
        let _=timestamp;
        if sequence==0||sequence>revision||item["source"]!=source||
            item["authority"]!="historical-source-verified-event"||
            !source_digest_hex(&item["evidenceDigest"])||
            !source_digest_hex(&item["eventDigest"]) {return None}
        let provider=item["provider"].as_str().filter(|s|!s.is_empty())
            .map(|s|s.chars().take(32).collect::<String>())
            .unwrap_or_else(||"Provider".to_owned());
        rows.push(format!("{provider} · {label} · historical {source} source rev {source_revision}"));
    }
    Some(StudioActivity{revision,total,rows})
}

/// Reuse the Host's existing bootstrap.progress; no new endpoint or local store.
fn project_oracle_progress(bootstrap:&Value)->Result<Option<OracleProgress>,ReadError>{
    let p=&bootstrap["progress"];
    if p.is_null(){return Ok(None);}
    if bootstrap["schema"]!="vivim.bootstrap-phone/1" {return Err(ReadError::InvalidProjection);}
    let claims=p["claims"].as_u64().ok_or(ReadError::InvalidProjection)?;
    let observations=p["observations"].as_u64().ok_or(ReadError::InvalidProjection)?;
    let contradictions=p["contradictions"].as_u64().ok_or(ReadError::InvalidProjection)?;
    let passes=p["passes"].as_array().ok_or(ReadError::InvalidProjection)?;
    if passes.len()>7 {return Err(ReadError::InvalidProjection);}
    let mut ids=std::collections::BTreeSet::new();
    let mut complete_passes=0_u64;
    for pass in passes {
        let id=pass["pass"].as_str().ok_or(ReadError::InvalidProjection)?;
        if !matches!(id,"F02"|"F01"|"D03"|"D04"|"D05"|"D06"|"D07")
            || !ids.insert(id) || pass["status"].as_str().is_none() {
            return Err(ReadError::InvalidProjection);
        }
        if pass["status"]=="complete" {complete_passes+=1;}
    }
    Ok(Some(OracleProgress{claims,observations,contradictions,
        complete_passes,observed_passes:passes.len() as u64}))
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
    let oracle_progress=project_oracle_progress(&snapshot["bootstrap"])?;
    let studio_activity=project_studio_activity(snapshot);
    let studio_operations=project_studio_operations(snapshot);
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
        oracle_progress,studio_activity,studio_operations,
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
    // The Host refreshes bootstrap.observedAt for every read even when the
    // authoritative bootstrap state and all other source fields are unchanged.
    // Exclude only that ephemeral observation timestamp from the coherence
    // bracket; changes to phase, generation, approvals, devices, control, or
    // Wiki still invalidate the mixed read.
    fn stable_snapshot(pwa:&Value)->Value {
        let mut snapshot=pwa["snapshot"].clone();
        if let Some(bootstrap)=snapshot["bootstrap"].as_object_mut() {
            bootstrap.remove("observedAt");
        }
        snapshot
    }
    if pwa_before["state"]!=pwa_after["state"] ||
       stable_snapshot(pwa_before)!=stable_snapshot(pwa_after) {
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
    #[test] fn gpui_reads_only_studio_capture_and_drive_metadata(){
        let mut p=pwa();
        let wiki=json!({"revision":1,"pages":{}});
        assert_eq!(project(&p,&wiki).unwrap().studio_operations,None);
        p["snapshot"]["studioOperations"]=json!({
            "schema":"vivim.studio-operations/1",
            "authority":"read-only","state":"source-backed",
            "capture":{"state":"source-backed","recorderState":"recording",
              "browserState":"available","browserVerified":true,
              "targetsState":"source-backed",
              "targets":[{"id":"0123456789abcdef0123456789abcdef","host":"chatgpt.com"}]},
            "drive":{"state":"source-backed","shown":1,"active":1,
              "sites":["chatgpt"],
              "jobs":[{"id":"11111111-1111-4111-8111-111111111111",
                "mode":"drive","state":"running","dryRun":true,
                "privatePrompt":"never print raw content"}]}
        });
        let view=project(&p,&wiki).unwrap().studio_operations.unwrap();
        assert!(view.capture.contains("recording"));
        assert!(view.browser.contains("owner verified"));
        assert!(view.drive.contains("1 active"));
        assert!(view.jobs[0].contains("dry run"));
        assert!(view.capture_running);
        assert!(!view.capture_ready);
        assert_eq!(view.targets.len(),1);
        assert_eq!(view.targets[0].host,"chatgpt.com");
        assert_eq!(view.sites,vec!["chatgpt".to_owned()]);
        assert_eq!(view.cancelable_jobs.len(),1);
        assert!(!format!("{view:?}").contains("privatePrompt"));
        let mut conflict=p.clone();
        conflict["snapshot"]["studioOperations"]["drive"]["jobs"][0]["state"]=json!("sent");
        assert_eq!(project(&conflict,&wiki).unwrap().studio_operations,None);
        conflict=p;
        conflict["snapshot"]["studioOperations"]["capture"]["browserState"]=json!("verified");
        assert_eq!(project(&conflict,&wiki).unwrap().studio_operations,None);
    }
    #[test] fn gpui_reuses_verified_studio_history_without_provider_messages(){
        let mut p=pwa();
        let wiki=json!({"revision":1,"pages":{}});
        assert_eq!(project(&p,&wiki).unwrap().studio_activity,None);
        p["snapshot"]["studioOutcomes"]=json!({
            "schema":"vivim.studio-outcomes/1",
            "state":"source-backed","authority":"read-only-historical",
            "revision":3,"total":1,
            "items":[{
                "id":"event-1","state":"reply_observed","sequence":3,
                "source":"studio","sourceRevision":5,
                "evidenceDigest":"a".repeat(64),"eventDigest":"b".repeat(64),
                "authority":"historical-source-verified-event",
                "observedAt":"2026-11-23T12:00:00Z","provider":"chatgpt",
                "privateText":"this field must never appear"
            }]
        });
        let activity=project(&p,&wiki).unwrap().studio_activity.unwrap();
        assert_eq!((activity.revision,activity.total),(3,1));
        assert!(activity.rows[0].contains("Reply observed"));
        assert!(!activity.rows[0].contains("this field"));
        let mut conflict=p.clone();
        conflict["snapshot"]["studioOutcomes"]["items"][0]["source"]=json!("phone");
        assert_eq!(project(&conflict,&wiki).unwrap().studio_activity,None);
        conflict=p;
        conflict["snapshot"]["studioOutcomes"]["items"][0]["eventDigest"]=json!("fake");
        assert_eq!(project(&conflict,&wiki).unwrap().studio_activity,None);
    }
    #[test] fn native_oracle_progress_uses_host_ledger_metadata_only() {
        let mut p=pwa();
        p["snapshot"]["bootstrap"]=json!({
            "schema":"vivim.bootstrap-phone/1",
            "progress":{"claims":8,"observations":12,"contradictions":1,
                "passes":[{"pass":"F02","status":"complete"},
                          {"pass":"F01","status":"complete"},
                          {"pass":"D03","status":"queued"}]}
        });
        let wiki=json!({"revision":1,"pages":{}});
        let overview=project(&p,&wiki).unwrap();
        let status=overview.oracle_progress.unwrap();
        assert_eq!((status.claims,status.observations,status.contradictions),(8,12,1));
        assert_eq!((status.complete_passes,status.observed_passes),(2,3));
        let mut malformed=p.clone();
        malformed["snapshot"]["bootstrap"]["progress"]["passes"][1]["pass"]=json!("F02");
        assert_eq!(project(&malformed,&wiki),Err(ReadError::InvalidProjection));
        malformed=p;
        malformed["snapshot"]["bootstrap"]["progress"]["claims"]=json!("user raw chat");
        assert_eq!(project(&malformed,&wiki),Err(ReadError::InvalidProjection));
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
    #[test] fn bootstrap_observation_clock_is_not_authoritative_state_drift() {
        let wiki=json!({"revision":7,"pages":{"work":{"sections":{}}}});
        let mut before=pwa();
        before["snapshot"]["bootstrap"]=json!({
            "schema":"vivim.bootstrap-onboarding/1",
            "generationId":"gen-1","phase":"deepening",
            "observedAt":"2026-11-22T16:00:00.000Z"
        });
        let mut after=before.clone();
        after["snapshot"]["bootstrap"]["observedAt"]=
            json!("2026-11-22T16:00:00.350Z");
        assert!(project_double_bracketed(&before,&after,&wiki,&wiki).is_ok());

        // Only the observation clock is transient. Never ignore a genuine
        // onboarding generation, phase, approval, or other source change.
        after["snapshot"]["bootstrap"]["phase"]=json!("ready");
        assert_eq!(project_double_bracketed(&before,&after,&wiki,&wiki),
            Err(ReadError::SnapshotChanged));
        after=before.clone();
        after["snapshot"]["bootstrap"]["generationId"]=json!("gen-2");
        assert_eq!(project_double_bracketed(&before,&after,&wiki,&wiki),
            Err(ReadError::SnapshotChanged));
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
