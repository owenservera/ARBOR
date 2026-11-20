//! @hq:capability vivim.gpui-host-overview@1
//! @hq:consumes vivim.host-pwa-view@1
//! @hq:consumes vivim.rust-wiki-read-model@1
//! Native adapter for the canonical VIVIM Host. No local journal or dispatcher.
pub mod control;
pub mod visual;
use reqwest::blocking::Client;
use serde_json::Value;
use vivim_programmability_core::wiki_read::{self, Page as WikiPage};
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
    pub wiki_page_total: usize,
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
        wiki_digest: read.digest, wiki_page_total: read.pages_total,
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
    if !matches!(operation,"symbols"|"compute"|"wiring")||key.is_empty()||key.len()>180
        ||key.chars().any(char::is_control) {return Err(ReadError::InvalidInput)}
    if matches!(operation,"compute"|"wiring") {
        let digest=key.strip_prefix("hqg1:").ok_or(ReadError::InvalidInput)?;
        if digest.len()!=64||!digest.bytes().all(|b|b.is_ascii_digit()||(b'a'..=b'f').contains(&b)){
            return Err(ReadError::InvalidInput)
        }
    }
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
    if data["schema"]!="hqkg.development-query/1"||data["authority"]!="read-only"
        ||data["operation"]!=operation||!data["epoch"].is_u64(){
        return Err(ReadError::InvalidProjection)
    }
    let mut lines=vec![format!("HQKG · {} · epoch {} · indexed observations only",operation,
        data["epoch"].as_u64().unwrap_or(0))];
    match operation{
        "symbols"=>{
            if data["state"]!="indexed-snapshot"{return Err(ReadError::Unavailable)}
            let rows=data["result"]["symbols"].as_array().ok_or(ReadError::InvalidProjection)?;
            lines.push(format!("{} indexed matching symbols",rows.len()));
            for row in rows.iter().take(30){
                let name=row["name"].as_str().ok_or(ReadError::InvalidProjection)?;
                let path=row["path"].as_str().ok_or(ReadError::InvalidProjection)?;
                let id=row["id"].as_str().ok_or(ReadError::InvalidProjection)?;
                let file_id=row["fileId"].as_str().ok_or(ReadError::InvalidProjection)?;
                lines.push(format!("{} · {}:{} · symbol {} · file {}",
                    bounded_text(name),bounded_text(path),
                    row["line"].as_u64().unwrap_or(0),bounded_text(id),bounded_text(file_id)));
            }
            lines.push("Use the displayed file ID with Compute or Wiring, not the symbol ID.".into());
        }
        "wiring"=>{
            if data["state"]!="indexed-snapshot"{return Err(ReadError::Unavailable)}
            let view=&data["result"];
            let source=view["source"]["path"].as_str().ok_or(ReadError::InvalidProjection)?;
            lines.push(format!("Source: {}",bounded_text(source)));
            let groups=[("Resolved transitive imports","imports"),("Reverse import dependents","dependents"),
                ("Observed semantic identities","semanticObservations"),("Possible producer/consumer wiring","potentialWiring")];
            for (title,key) in groups{
                let rows=view[key].as_array().ok_or(ReadError::InvalidProjection)?;
                lines.push(format!("{} · {}",title,rows.len()));
                for row in rows.iter().take(16){
                    let path=row["peerPath"].as_str().or_else(||row["path"].as_str());
                    let semantic=row["semanticId"].as_str();
                    let label=match (path,semantic){
                        (Some(p),Some(id))=>format!("{} · {}",bounded_text(id),bounded_text(p)),
                        (Some(p),None)=>bounded_text(p),
                        (None,Some(id))=>bounded_text(id),
                        _=>String::new()
                    };
                    if !label.is_empty(){lines.push(format!("  {}",label));}
                }
            }
            if view["truncated"]==true{lines.push("Some static relationships were omitted at traversal bounds".into());}
        }
        "compute"=>{
            if data["state"]!="computed"||data["executionAuthorized"]!=false||
                data["effectPerformed"]!=false||data["computation"]!="source-backed-graph"{
                return Err(ReadError::InvalidProjection)
            }
            let rows=data["outputs"].as_array().ok_or(ReadError::InvalidProjection)?;
            for row in rows.iter().take(8){
                let result=&row["result"];
                if result["schema"]!="hqkg.development-transform/1"||result["authority"]!="none"{
                    return Err(ReadError::InvalidProjection)
                }
                lines.push(format!("{} · {} · {} sources · {} imports · {} symbols · {} semantics · {} reverse dependencies",
                    bounded_text(row["stepId"].as_str().unwrap_or("unknown")),
                    bounded_text(result["operation"].as_str().unwrap_or("unknown")),
                    result["sourceCount"].as_u64().unwrap_or(0),result["importCount"].as_u64().unwrap_or(0),
                    result["symbolCount"].as_u64().unwrap_or(0),result["semanticCount"].as_u64().unwrap_or(0),
                    result["dependentCount"].as_u64().unwrap_or(0)));
                if let Some(wires)=result["potentialWiring"].as_array(){
                    for wire in wires.iter().take(12){
                        lines.push(format!("  Possible {} · {} · {}",
                            bounded_text(wire["role"].as_str().unwrap_or("connection")),
                            bounded_text(wire["semanticId"].as_str().unwrap_or("semantic ID")),
                            bounded_text(wire["peerPath"].as_str().unwrap_or("source"))));
                    }
                }
                if result["truncated"]==true{
                    lines.push("  Dependency traversal capped; result is partial".into());
                }
                if let Some(sources)=result["sources"].as_array(){
                    for source in sources.iter().take(4){
                        if let Some(path)=source["path"].as_str(){lines.push(format!("  {}",bounded_text(path)));}
                    }
                }
            }
        }
        _=>return Err(ReadError::InvalidInput),
    }
    Ok(lines.join("\n"))
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
