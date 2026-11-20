//! @hq:capability vivim.gpui-host-overview@1
//! @hq:consumes vivim.host-pwa-view@1
//! @hq:consumes vivim.rust-wiki-read-model@1
//! Native adapter for the canonical VIVIM Host. No local journal or dispatcher.
pub mod control;
pub mod visual;
use reqwest::blocking::Client;
use serde_json::Value;
use vivim_programmability_core::wiki_read::{self, Page as WikiPage, Captures as WikiCaptures, SearchDocument as WikiSearchDocument};
use vivim_programmability_core::development_projection::{self,ProjectionError};
use std::{path::{Path, PathBuf}, time::Duration, io::Read};

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
    /// Owner-authorized in-process source for exact Rust deltas, never a client grant.
    pub wiki_source: Value,
    pub wiki_page_total: usize,
    pub wiki_captures: Option<WikiCaptures>,
    pub wiki_search_index: Vec<WikiSearchDocument>,
    pub wiki_indexed_pages: usize,
    pub wiki_index_truncated: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ReadError {
    Offline, OwnerRequired, Unavailable, InvalidProjection, InvalidInput,
}
impl ReadError {
    pub fn label(&self) -> &'static str {
        match self {
            Self::Offline => "Host unavailable",
            Self::OwnerRequired => "Local owner authorization required",
            Self::Unavailable => "Host projection unavailable",
            Self::InvalidProjection => "Invalid Host projection",
            Self::InvalidInput => "Invalid command or plan identity",
        }
    }
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
    Ok(Overview {
        observed_at: bounded_text(observed_at), recent, active_devices,
        wiki_revision: read.revision, wiki_pages, wiki_content: read.pages,
        wiki_digest: read.digest, wiki_source: wiki.clone(), wiki_page_total: read.pages_total,
        wiki_captures: read.captures,
        wiki_search_index: read.search_index,
        wiki_indexed_pages: read.indexed_pages,
        wiki_index_truncated: read.index_truncated,
    })
}

// Same owner-token path convention as the existing Tauri native shell.
fn owner_dir() -> Option<PathBuf> {
    if let Some(p) = std::env::var_os("VIVIM_HOST_DATA_DIR").or_else(|| std::env::var_os("CAPTURE_STUDIO_HOME")) {
        return Some(p.into());
    }
    if cfg!(windows) {
        std::env::var_os("LOCALAPPDATA").map(|p| PathBuf::from(p).join("AION").join("capture-studio"))
    } else {
        std::env::var_os("XDG_DATA_HOME").filter(|p| Path::new(p).is_absolute())
            .map(|p| PathBuf::from(p).join("aion-capture-studio"))
            .or_else(|| std::env::var_os("HOME").map(|p| PathBuf::from(p).join(".local/share/aion-capture-studio")))
    }
}
fn owner_token() -> Result<String, ReadError> {
    if let Ok(t) = std::env::var("VIVIM_BOOTSTRAP_TOKEN") {
        if t.len() >= 32 { return Ok(t); }
    }
    let dir = owner_dir().ok_or(ReadError::OwnerRequired)?;
    let t = std::fs::read_to_string(dir.join("bootstrap/owner-token")).map_err(|_| ReadError::OwnerRequired)?;
    let t = t.trim();
    if t.len() < 32 { return Err(ReadError::OwnerRequired); }
    Ok(t.to_owned())
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
    let pwa = get(&client, Endpoint::Pwa, Some(&token))?;
    let wiki = get(&client, Endpoint::Wiki, Some(&token))?;
    project(&pwa, &wiki)
}

/// Owner-only development graph read, from the same Host endpoint used by PWA.
/// Neither a graph reference nor a symbol name is an execution credential.
pub fn read_development(operation:&str,key:&str)->Result<String,ReadError>{
    if !development_projection::valid_query(operation,key){return Err(ReadError::InvalidInput)}
    let client=Client::builder().no_proxy().redirect(reqwest::redirect::Policy::none())
        .timeout(Duration::from_secs(12)).connect_timeout(Duration::from_secs(2))
        .build().map_err(|_|ReadError::Unavailable)?;
    validate_health(&get(&client,Endpoint::Health,None)?)?;
    let token=owner_token()?;
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
    development_projection::render(operation,&data).map_err(|error|match error{
        ProjectionError::Unavailable=>ReadError::Unavailable,
        ProjectionError::InvalidInput=>ReadError::InvalidInput,
        ProjectionError::InvalidProjection=>ReadError::InvalidProjection,
    })
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
    #[test] fn rejects_unrelated_listener() {
        assert_eq!(validate_health(&json!({"host":{"state":"online"}})), Err(ReadError::Offline));
        assert!(validate_health(&json!({"schema":"vivim.host-status/1","host":{"state":"online"}})).is_ok());
    }
    #[test] fn projects_host_readback() {
        let result = project(&pwa(), &json!({"revision":7,"pages":{"work":{"sections":{}}}})).unwrap();
        assert_eq!(result.wiki_revision,7);
        assert_eq!(result.active_devices,2);
        assert_eq!(result.wiki_pages, vec!["work".to_string()]);
        assert_eq!(result.recent, vec!["wiki.page.create · applied".to_string()]);
    }
    #[test] fn fails_closed() {
        let mut p = pwa(); p["state"] = json!("unavailable");
        assert_eq!(project(&p, &json!({})), Err(ReadError::Unavailable));
        assert_eq!(project(&pwa(), &json!({"revision":-1,"pages":{}})), Err(ReadError::InvalidProjection));
    }
    #[test] fn only_fixed_read_paths() {
        for e in [Endpoint::Health, Endpoint::Pwa, Endpoint::Wiki] {
            assert!(!e.path().contains("execute"));
            assert!(e.path().starts_with("/api/host/"));
        }
    }
}
