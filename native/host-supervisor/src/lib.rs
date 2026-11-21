//! Shared native Host supervision. No effect, grant, journal or provider authority.
use reqwest::blocking::Client;
use serde_json::Value;
use sha2::{Digest, Sha256};
use hmac::{Hmac, Mac};
use std::{
    collections::HashSet,
    fs::{self, File},
    io::Read,
    net::{SocketAddr, TcpStream},
    path::{Component, Path, PathBuf},
    process::{Child, Command, Stdio},
    sync::{atomic::{AtomicBool, Ordering}, Arc, Mutex},
    thread,
    time::{Duration, Instant},
};
pub const HOST_ENTRY: &str = "apps/vivim-host/server.mjs";
const PORT: u16 = 43187;
const BINARIES: [&str; 9] = ["hqkg-personal","hqkg-chat-context","hqkg-web-feed",
    "hqkg-import","hqkg-development","vivim-program-validate","vivim-vec-project",
    "vivim-product-pure","vivim-private-shares"];
const MAX_RECOVERIES: u8 = 2;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Readiness { NotChecked, Starting, Owned, Attached, Failed, Exhausted }
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum RuntimeOrigin { Packaged, Workspace }
#[derive(Clone, Debug)]
pub struct Snapshot {
    pub readiness: Readiness,
    pub origin: Option<RuntimeOrigin>,
    pub pid: Option<u32>,
    pub recoveries: u8,
    pub error: Option<String>,
}
impl Snapshot {
    pub fn label(&self) -> String {
        format!("Host {:?}, runtime {:?}, owned PID {:?}, recoveries {}/{}{}",
            self.readiness,self.origin,self.pid,self.recoveries,MAX_RECOVERIES,
            self.error.as_deref().map(|s|format!(" · {s}")).unwrap_or_default())
    }
}
struct Inner { child: Option<Child>, status: Snapshot }
pub struct HostSupervisor { inner: Mutex<Inner>, started: AtomicBool }
impl Default for HostSupervisor { fn default() -> Self { Self::new() } }
impl HostSupervisor {
    pub fn new() -> Self {
        Self { inner: Mutex::new(Inner {
            child: None, status: Snapshot {readiness:Readiness::NotChecked,
                origin:None,pid:None,recoveries:0,error:None}
        }), started:AtomicBool::new(false)}
    }
    pub fn snapshot(&self) -> Snapshot {
        self.inner.lock().expect("Host state poisoned").status.clone()
    }
    fn fail(&self, error: String) -> String {
        let mut state=self.inner.lock().expect("Host state poisoned");
        state.status.readiness=Readiness::Failed;
        state.status.error=Some(error.clone());
        error
    }
    /// Start or attach only; never kill an unhealthy living child.
    /// This is a blocking method and must never be called on the GPUI UI thread.
    pub fn reconcile(&self) -> Result<(),String> {
        {
            let mut s=self.inner.lock().expect("Host state poisoned");
            if let Some(child)=s.child.as_mut() {
                if child.try_wait().map_err(|e|e.to_string())?.is_none() {
                    if health_online() {
                        s.status.readiness=Readiness::Owned;
                        s.status.error=None;
                        return Ok(())
                    }
                    s.status.readiness=Readiness::Failed;
                    s.status.error=Some("Living Host unhealthy; manual recovery required".into());
                    return Err(s.status.error.clone().unwrap());
                }
                s.child.take(); s.status.pid=None;
            }
            s.status.readiness=Readiness::Starting;s.status.error=None;
        }
        if health_online() {
            let mut s=self.inner.lock().expect("Host state poisoned");
            s.status.readiness=Readiness::Attached;
            return Ok(());
        }
        if listener_occupied() {
            return Err(self.fail("Foreign or unhealthy listener occupies Host port; spawn refused".into()));
        }
        let runtime=discover_runtime().map_err(|e|self.fail(e))?;
        let mut child=Command::new(&runtime.node).arg(&runtime.entry)
            .current_dir(&runtime.root).stdin(Stdio::null())
            .stdout(Stdio::null()).stderr(Stdio::null()).spawn()
            .map_err(|e|self.fail(format!("Host spawn failed: {e}")))?;
        let pid=child.id();
        let deadline=Instant::now()+Duration::from_secs(10);
        while Instant::now()<deadline {
            match child.try_wait() {
                Ok(Some(_)) => return Err(self.fail("Host child exited before readiness".into())),
                Err(e) => return Err(self.fail(format!("Host child state unknown: {e}"))),
                Ok(None) => {}
            }
            if health_online() {
                let mut s=self.inner.lock().expect("Host state poisoned");
                s.child=Some(child);
                s.status.readiness=Readiness::Owned;
                s.status.origin=Some(runtime.origin);
                s.status.pid=Some(pid);
                s.status.error=None;
                return Ok(());
            }
            thread::sleep(Duration::from_millis(300));
        }
        let _=child.kill();let _=child.wait();
        Err(self.fail("Host child did not become healthy within 10 seconds".into()))
    }
    /// Exactly one background supervisor per GPUI process. Recover only a child
    /// whose OS exit is observed; never retry an action or kill a live Host.
    pub fn run(self: Arc<Self>) {
        if self.started.swap(true,Ordering::AcqRel) { return; }
        if self.reconcile().is_err() { return; }
        loop {
            thread::sleep(Duration::from_secs(3));
            // An attached Host is not our child. Do not restart it if it
            // disappears; clearly invalidate readiness instead.
            if self.snapshot().readiness==Readiness::Attached && !health_online(){
                self.fail("Previously attached Host is now offline; no owned restart".into());
                return;
            }
            let recover={
                let mut s=self.inner.lock().expect("Host state poisoned");
                let exited=s.child.as_mut()
                    .and_then(|c|c.try_wait().ok()).flatten().is_some();
                if !exited { false }
                else {
                    s.child.take();s.status.pid=None;
                    if s.status.recoveries>=MAX_RECOVERIES {
                        s.status.readiness=Readiness::Exhausted;
                        s.status.error=Some("Owned Host exhausted bounded crash recovery".into());
                        return;
                    }
                    s.status.recoveries+=1;true
                }
            };
            if recover && self.reconcile().is_err() { return; }
        }
    }
}
struct Runtime { origin: RuntimeOrigin, root:PathBuf, node:PathBuf, entry:PathBuf }
pub fn valid_health(v:&Value)->bool {
    v["schema"]=="vivim.host-status/1" && v["host"]["state"]=="online"
}
pub fn health_online()->bool {
    let Ok(client)=Client::builder().no_proxy().redirect(reqwest::redirect::Policy::none())
        .connect_timeout(Duration::from_millis(500))
        .timeout(Duration::from_millis(1250)).build() else{return false};
    let Ok(response)=client.get("http://127.0.0.1:43187/api/host/status").send() else{return false};
    if !response.status().is_success(){return false}
    let mut bytes=Vec::new();
    if response.take(262145).read_to_end(&mut bytes).is_err()||bytes.len()>262144{return false}
    serde_json::from_slice::<Value>(&bytes).is_ok_and(|v|valid_health(&v))
}

/// Fresh nonce proof before a native client transmits a permanent owner bearer.
/// This is read-only disclosure preflight, NOT complete OS process attestation.
pub const OWNER_PROOF_SCHEMA: &str = "vivim.host-owner-proof/1";
fn lowercase_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}
fn decode_hex_32(input: &str) -> Option<[u8; 32]> {
    if input.len() != 64 { return None; }
    let mut output = [0_u8; 32];
    fn nibble(b: u8) -> Option<u8> {
        match b {
            b'0'..=b'9' => Some(b - b'0'),
            b'a'..=b'f' => Some(b - b'a' + 10),
            _ => None,
        }
    }
    for (i, pair) in input.as_bytes().chunks_exact(2).enumerate() {
        output[i] = (nibble(pair[0])? << 4) | nibble(pair[1])?;
    }
    Some(output)
}
pub fn owner_proof_matches(challenge: &str, token: &str, mac: &str) -> bool {
    if token.len() < 32 || decode_hex_32(challenge).is_none() { return false; }
    let Some(digest) = decode_hex_32(mac) else { return false; };
    let Ok(mut verifier) = Hmac::<Sha256>::new_from_slice(token.as_bytes()) else { return false; };
    verifier.update(OWNER_PROOF_SCHEMA.as_bytes());
    verifier.update(b"\n");
    verifier.update(challenge.as_bytes());
    verifier.verify_slice(&digest).is_ok()
}
pub fn verify_host_owner(client: &Client, owner_token: &str) -> bool {
    if owner_token.len() < 32 { return false; }
    let mut nonce = [0_u8; 32];
    if getrandom::fill(&mut nonce).is_err() { return false; }
    let challenge = lowercase_hex(&nonce);
    let url = format!("http://127.0.0.1:43187/api/host/native-owner-proof?challenge={challenge}");
    let Ok(response) = client.get(url).header("accept", "application/json").send() else {
        return false;
    };
    if response.status().as_u16() != 200 { return false; }
    let mut bytes = Vec::new();
    if response.take(4097).read_to_end(&mut bytes).is_err() || bytes.len() > 4096 {
        return false;
    }
    let Ok(reply) = serde_json::from_slice::<Value>(&bytes) else { return false; };
    reply["schema"] == OWNER_PROOF_SCHEMA &&
        reply["challenge"].as_str() == Some(challenge.as_str()) &&
        reply["mac"].as_str().is_some_and(|mac| owner_proof_matches(&challenge, owner_token, mac))
}

pub fn listener_occupied()->bool {
    TcpStream::connect_timeout(&SocketAddr::from(([127,0,0,1],PORT)),
        Duration::from_millis(300)).is_ok()
}
fn valid_rel(s:&str)->Option<PathBuf>{
    if s.is_empty()||s.contains('\\')||s.contains(':')||
        s.split('/').any(|component|component.is_empty()||component=="."||component==".."){return None}
    let p=PathBuf::from(s);
    if !p.components().all(|c|matches!(c,Component::Normal(_))){return None}
    Some(p)
}
/// Validates complete frozen runtime payload against the original manifest,
/// not merely filenames/sizes. node_modules integrity is governed by bun.lock.
pub fn verify_frozen_runtime(root:&Path)->Result<(),String>{
    let mf=root.join("runtime.manifest.json");
    let meta=fs::symlink_metadata(&mf).map_err(|e|e.to_string())?;
    if !meta.is_file()||meta.file_type().is_symlink()||meta.len()>16*1024*1024 {
        return Err("Host manifest not a regular bounded file".into());
    }
    if root.join("ARBOR-RUNTIME-PLACEHOLDER.txt").exists(){
        return Err("Host runtime placeholder is not a release".into());
    }
    let m:Value=serde_json::from_slice(&fs::read(mf).map_err(|e|e.to_string())?)
        .map_err(|e|e.to_string())?;
    if m["schema"]!="arbor.host-runtime-manifest/1"{
        return Err("Unknown Host manifest schema".into())
    }
    let entries=m["files"].as_array().ok_or("Manifest files missing")?;
    let mut paths=HashSet::new(); let mut folded=HashSet::new();
    for e in entries{
        let name=e["path"].as_str().ok_or("Manifest path missing")?;
        let rel=valid_rel(name).ok_or("Unsafe manifest path")?;
        if !paths.insert(name.to_string())||!folded.insert(name.to_ascii_lowercase()){
            return Err("Duplicate manifest path".into())
        }
        let expected=e["bytes"].as_u64().ok_or("Manifest size missing")?;
        let digest=e["sha256"].as_str().ok_or("Manifest SHA256 missing")?;
        if digest.len()!=64||!digest.bytes().all(|x|x.is_ascii_digit()||(b'a'..=b'f').contains(&x)){
            return Err("Invalid manifest hash".into())
        }
        let path=root.join(rel);
        let meta=fs::symlink_metadata(&path).map_err(|_|format!("Missing file {name}"))?;
        if !meta.is_file()||meta.file_type().is_symlink()||meta.len()!=expected{
            return Err(format!("File metadata mismatch: {name}"))
        }
        let mut file=File::open(path).map_err(|e|e.to_string())?;
        let mut hasher=Sha256::new();let mut chunk=[0u8;32768];
        loop{
            let n=file.read(&mut chunk).map_err(|e|e.to_string())?;
            if n==0{break}hasher.update(&chunk[..n]);
        }
        if format!("{:x}",hasher.finalize())!=digest{
            return Err(format!("Frozen file hash mismatch: {name}"))
        }
    }
    // Reject unlisted files or symlinks outside node_modules, matching the
    // frozen packager's source closure contract.
    fn check_tree(root:&Path, dir:&Path, prefix:&str,listed:&HashSet<String>)->Result<(),String>{
        for item in fs::read_dir(dir).map_err(|e|e.to_string())?{
            let item=item.map_err(|e|e.to_string())?;
            let name=item.file_name().to_string_lossy().to_string();
            if name=="node_modules"||name=="runtime.manifest.json"{continue}
            let rel=format!("{prefix}{name}");
            let meta=fs::symlink_metadata(item.path()).map_err(|e|e.to_string())?;
            if meta.file_type().is_symlink(){return Err(format!("Runtime symlink refused: {rel}"))}
            if meta.is_dir(){check_tree(root,&item.path(),&format!("{rel}/"),listed)?}
            else if !meta.is_file()||!listed.contains(&rel){return Err(format!("Unlisted runtime file: {rel}"))}
        }
        let _=root;
        Ok(())
    }
    check_tree(root,root,"",&paths)?;
    for path in std::iter::once("node.exe".to_owned())
        .chain(std::iter::once(HOST_ENTRY.to_owned()))
        .chain(BINARIES.map(|name|format!("native/bin/{name}.exe"))){
        if !paths.contains(&path){return Err(format!("Missing required Host executable: {path}"))}
    }
    Ok(())
}
fn discover_runtime()->Result<Runtime,String>{
    let exe=std::env::current_exe().map_err(|e|e.to_string())?;
    if let Some(dir)=exe.parent(){
        let bundled=dir.join("runtime");
        if bundled.exists(){
            verify_frozen_runtime(&bundled)?;
            return Ok(Runtime{origin:RuntimeOrigin::Packaged,
                node:bundled.join("node.exe"),
                entry:bundled.join(HOST_ENTRY),root:bundled});
        }
    }
    if cfg!(debug_assertions){
        let mut candidates=Vec::new();
        if let Some(dir)=exe.parent(){candidates.extend(dir.ancestors().take(9).map(Path::to_path_buf));}
        if let Ok(cwd)=std::env::current_dir(){candidates.extend(cwd.ancestors().take(6).map(Path::to_path_buf));}
        if let Some(root)=candidates.into_iter().find(|p|p.join(HOST_ENTRY).is_file()){
            return Ok(Runtime{origin:RuntimeOrigin::Workspace,node:PathBuf::from("node"),
                entry:root.join(HOST_ENTRY),root})
        }
    }
    Err("Frozen Host runtime missing; release cannot execute workspace Node".into())
}
#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    #[test] fn unrelated_listener_not_host(){
        assert!(!valid_health(&json!({"schema":"other","host":{"state":"online"}})));
        assert!(!valid_health(&json!({"schema":"vivim.host-status/1","host":{"state":"offline"}})));
        assert!(valid_health(&json!({"schema":"vivim.host-status/1","host":{"state":"online"}})));
    }
    #[test] fn unsafe_paths_rejected(){
        for path in ["","../x","/x","./x","c:x","a\\b","a/../b"] {
            assert!(valid_rel(path).is_none(),"{path}");
        }
        assert!(valid_rel("native/bin/hqkg-import.exe").is_some());
    }
    #[test] fn hmac_matches_host_protocol_and_fails_closed() {
        let challenge = "ab".repeat(32);
        let token = "owner-proof-test-secret-0123456789-abcdefghijklmnopqrstuvwxyz";
        let good = "fc438125c163da8107b5a391e62157b8819ed152da83ddd60b7a4a81892ab9eb";
        assert!(owner_proof_matches(&challenge, token, good));
        assert!(!owner_proof_matches(&challenge, "different-owner-proof-key-0123456789abcdef", good));
        assert!(!owner_proof_matches(&"ba".repeat(32), token, good));
        assert!(!owner_proof_matches(&challenge, token, &good.to_ascii_uppercase()));
        assert!(!owner_proof_matches(&challenge, token, "short"));
        assert!(!owner_proof_matches(&challenge[..63], token, good));
    }
    #[test] fn inert_state_does_not_start_effects(){
        let s=HostSupervisor::new().snapshot();
        assert_eq!(s.readiness,Readiness::NotChecked);
        assert!(s.pid.is_none());
    }
}
