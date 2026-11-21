#![windows_subsystem = "windows"]

use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, atomic::{AtomicBool,AtomicU8,Ordering}};
use std::thread;
use std::time::{Duration, Instant};
use std::net::{TcpStream,SocketAddr};
use std::io::Read;

use tauri::{Manager, State};

const HOST_HEALTH: &str = "http://127.0.0.1:43187/api/host/status";
/// Every VIVIM Host status reply is stamped with this schema. An unrelated process
/// that happens to own 127.0.0.1:43187 must never pass as the Host.
const HOST_STATUS_SCHEMA: &str = "vivim.host-status/1";
/// Native binaries the frozen packaging contract may stage
/// (tools/packaging/prepare-host-runtime.mjs PACKAGED_BINARIES). The native shell
/// reports which of these the installed runtime actually ships.
const APPROVED_BINARIES: [&str; 9] = [
    "hqkg-personal",
    "hqkg-chat-context",
    "hqkg-web-feed",
    "hqkg-import",
    "hqkg-development",
    "vivim-program-validate",
    "vivim-vec-project",
    "vivim-product-pure",
    "vivim-private-shares",
];

/// Where the Host runtime was found. Kept distinct so a missing bundle is never
/// reported as a working development fallback.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
enum RuntimeMode {
    Packaged,
    Workspace,
    Missing,
}

impl RuntimeMode {
    fn as_str(self) -> &'static str {
        match self {
            RuntimeMode::Packaged => "packaged",
            RuntimeMode::Workspace => "workspace",
            RuntimeMode::Missing => "missing",
        }
    }
}

#[derive(Debug)]
struct HostRuntime {
    mode: RuntimeMode,
    root: PathBuf,
    node: PathBuf,
    server: PathBuf,
}

/// Liveness of the child this shell actually owns, observed through the OS.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
enum ChildState {
    NotStarted,
    Running,
    Exited,
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
enum Readiness { NotChecked, Starting, Owned, Attached, Failed, Stopped }
impl Readiness {
    fn as_str(self) -> &'static str {
        match self {
            Self::NotChecked => "not_checked", Self::Starting => "starting",
            Self::Owned => "ready_owned", Self::Attached => "ready_existing",
            Self::Failed => "failed", Self::Stopped => "stopped",
        }
    }
}

// A native shell supervises only the single child it spawned. The Host
// remains the sole authority for effects, owner data and durable receipts.
const MAX_AUTO_RECOVERIES: u8 = 2;
struct HostProcess {
    child: std::sync::Mutex<Option<Child>>,
    exit_code: std::sync::Mutex<Option<i32>>,
    // Serializes setup, explicit restart, crash recovery and exit cleanup.
    lifecycle: std::sync::Mutex<()>,
    readiness: std::sync::Mutex<Readiness>,
    last_error: std::sync::Mutex<Option<String>>,
    auto_recoveries: AtomicU8,
    shutting_down: AtomicBool,
}

impl Default for HostProcess {
    fn default() -> Self {
        Self::new()
    }
}

/// This is a bounded structural admission, not a replacement for the
/// packaging tool's full SHA256 manifest verification or installer signing.
/// Never classify the generated resource placeholder as a release runtime.
fn packaged_runtime(root: &Path) -> Option<PathBuf> {
    let manifest_path = root.join("runtime.manifest.json");
    let metadata = std::fs::symlink_metadata(&manifest_path).ok()?;
    if !metadata.is_file() || metadata.file_type().is_symlink()
        || metadata.len() > 16 * 1024 * 1024 {
        return None;
    }
    let bytes = std::fs::read(&manifest_path).ok()?;
    let manifest: serde_json::Value = serde_json::from_slice(&bytes).ok()?;
    if manifest["schema"] != "arbor.host-runtime-manifest/1" {
        return None;
    }
    let entries = manifest["files"].as_array()?;
    let required = std::iter::once("node.exe".to_string())
        .chain(std::iter::once("apps/vivim-host/server.mjs".to_string()))
        .chain(APPROVED_BINARIES.iter().map(|bin| format!("native/bin/{bin}.exe")));
    if !required.into_iter().all(|rel| {
        let Some(entry) = entries.iter()
            .find(|file| file["path"].as_str() == Some(rel.as_str()))
        else { return false; };
        let Some(expected_size) = entry["bytes"].as_u64() else { return false; };
        let Some(expected_digest) = entry["sha256"].as_str() else { return false; };
        if expected_digest.len() != 64 ||
            !expected_digest.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b)) {
            return false;
        }
        // A symlink to an executable outside the frozen package must not be
        // misclassified as a staged native or Node binary. Size agreement is
        // an additional inexpensive check; full SHA256 remains the packaging
        // verifier's responsibility and is not claimed here.
        std::fs::symlink_metadata(root.join(&rel)).ok()
            .is_some_and(|meta| meta.is_file() && !meta.file_type().is_symlink()
                && meta.len() == expected_size)
    }) {
        return None;
    }
    if root.join("ARBOR-RUNTIME-PLACEHOLDER.txt").exists() {
        return None;
    }
    Some(root.to_path_buf())
}

/// Approved native binaries present under the runtime's frozen `native/bin` tree.
fn approved_binaries(root: &Path) -> Vec<(&'static str, bool)> {
    APPROVED_BINARIES
        .iter()
        .map(|name| {
            let present = root
                .join("native")
                .join("bin")
                .join(format!("{}.exe", name))
                .is_file();
            (*name, present)
        })
        .collect()
}

/// Approved binaries the frozen contract requires but the runtime does not ship.
fn missing_approved_binaries(root: &Path) -> Vec<&'static str> {
    approved_binaries(root)
        .into_iter()
        .filter(|(_, present)| !present)
        .map(|(name, _)| name)
        .collect()
}

/// True only for a reply that is actually this Host: the status schema plus an
/// online host state. This is what keeps an unrelated listener on the port from
/// being mistaken for a healthy VIVIM Host.
fn is_host_status(value: &serde_json::Value) -> bool {
    value.get("schema").and_then(|v| v.as_str()) == Some(HOST_STATUS_SCHEMA)
        && value
            .get("host")
            .and_then(|h| h.get("state"))
            .and_then(|v| v.as_str())
            == Some("online")
}

impl HostProcess {
    fn new() -> Self {
        Self {
            child: std::sync::Mutex::new(None),
            exit_code: std::sync::Mutex::new(None),
            lifecycle: std::sync::Mutex::new(()),
            readiness: std::sync::Mutex::new(Readiness::NotChecked),
            last_error: std::sync::Mutex::new(None),
            auto_recoveries: AtomicU8::new(0),
            shutting_down: AtomicBool::new(false),
        }
    }

    /// Resolve the actual Host runtime in a workspace or older Tauri target tree.
    fn repo_root() -> PathBuf {
        let host = Path::new("apps").join("vivim-host").join("server.mjs");
        if let Ok(exe) = std::env::current_exe() {
            for dir in exe.ancestors().skip(1).take(6) {
                if dir.join(&host).is_file() {
                    return dir.to_path_buf();
                }
            }
        }
        if let Ok(cwd) = std::env::current_dir() {
            for dir in cwd.ancestors().take(4) {
                if dir.join(&host).is_file() {
                    return dir.to_path_buf();
                }
            }
        }
        PathBuf::from(".")
    }

    /// Classify what is on disk: packaged bundle, workspace checkout, or neither.
    fn classify_runtime(packaged: Option<PathBuf>, root: PathBuf) -> HostRuntime {
        if let Some(root) = packaged {
            return HostRuntime {
                mode: RuntimeMode::Packaged,
                node: root.join("node.exe"),
                server: root.join("apps").join("vivim-host").join("server.mjs"),
                root,
            };
        }
        let server = root.join("apps").join("vivim-host").join("server.mjs");
        let mode = if server.is_file() {
            RuntimeMode::Workspace
        } else {
            RuntimeMode::Missing
        };
        HostRuntime {
            mode,
            node: PathBuf::from("node"),
            server,
            root,
        }
    }

    fn classify_launch_runtime(
        packaged: Option<PathBuf>, root: PathBuf, allow_workspace: bool
    ) -> HostRuntime {
        let mut runtime = Self::classify_runtime(packaged, root);
        // A release MSI must never silently execute arbitrary workspace Node
        // source if its packaged runtime is missing, partial or unverified.
        if !allow_workspace && runtime.mode == RuntimeMode::Workspace {
            runtime.mode = RuntimeMode::Missing;
        }
        runtime
    }

    fn resolve_runtime(app: &tauri::AppHandle) -> HostRuntime {
        let packaged = app
            .path()
            .resolve("runtime", tauri::path::BaseDirectory::Resource)
            .ok()
            .and_then(|root| packaged_runtime(&root));
        Self::classify_launch_runtime(packaged, Self::repo_root(), cfg!(debug_assertions))
    }

    fn start(
        app: &tauri::AppHandle,
    ) -> Result<Child, Box<dyn std::error::Error + Send + Sync>> {
        // Production MSI: run the staged Node binary and source packaged as app
        // resources. Development from checkout: use the workspace Node on PATH.
        let runtime = Self::resolve_runtime(app);
        if runtime.mode == RuntimeMode::Missing {
            return Err(format!(
                "VIVIM Host runtime missing: no packaged runtime and no checkout at {}",
                runtime.server.display()
            )
            .into());
        }
        let mut command = Command::new(&runtime.node);
        command
            .arg(&runtime.server)
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .current_dir(&runtime.root);
        // PWA first: the native shell does not discover, provision or launch
        // an APK, even if an unrelated resource file happens to exist.
        Ok(command.spawn()?)
    }

    /// A one-time browser code is minted by the Host only after presenting the
    /// protected owner capability from the native desktop process. We NEVER inject
    /// the permanent owner capability into the webview or any URL.
    fn desktop_launch_url() -> Option<String> {
        let token = match std::env::var("VIVIM_BOOTSTRAP_TOKEN") {
            Ok(v) if v.len() >= 32 => Some(v),
            _ => {
                let dir = std::env::var_os("VIVIM_HOST_DATA_DIR")
                    .or_else(|| std::env::var_os("CAPTURE_STUDIO_HOME"))
                    .map(PathBuf::from)
                    .or_else(|| {
                        if cfg!(windows) {
                            std::env::var_os("LOCALAPPDATA").map(|x| {
                                PathBuf::from(x).join("AION").join("capture-studio")
                            })
                        } else {
                            std::env::var_os("XDG_DATA_HOME")
                                .filter(|x| Path::new(x).is_absolute())
                                .map(|x| PathBuf::from(x).join("aion-capture-studio"))
                                .or_else(|| {
                                    std::env::var_os("HOME").map(|x| {
                                        PathBuf::from(x)
                                            .join(".local")
                                            .join("share")
                                            .join("aion-capture-studio")
                                    })
                                })
                        }
                    })?;
                std::fs::read_to_string(dir.join("bootstrap").join("owner-token"))
                    .ok()
                    .map(|s| s.trim().to_string())
                    .filter(|s| s.len() >= 32)
            }
        }?;
        let client = reqwest::blocking::Client::builder()
            .no_proxy().redirect(reqwest::redirect::Policy::none())
            .connect_timeout(Duration::from_secs(1))
            .timeout(Duration::from_secs(3)).build()
            .ok()?;
        let response = client
            .post("http://127.0.0.1:43187/api/host/control/ui-session")
            .header("origin", "http://127.0.0.1:43187")
            .header("x-vivim-control", "1")
            .header("content-type", "application/json")
            .bearer_auth(token)
            .body("{}")
            .send()
            .ok()?;
        if !response.status().is_success() {
            return None;
        }
        let mut bytes=Vec::new();
        if response.take(4097).read_to_end(&mut bytes).is_err() || bytes.len()>4096 {
            return None;
        }
        let reply:serde_json::Value=serde_json::from_slice(&bytes).ok()?;
        let code = reply.get("code")?.as_str()?;
        if code.len() != 64 || !code.bytes().all(|b| b.is_ascii_hexdigit()) {
            return None;
        }
        Some(format!(
            "http://127.0.0.1:43187/#control-session={}",
            code
        ))
    }

    /// One identity-checked health probe against the Host status endpoint.
    fn probe_health(client: &reqwest::blocking::Client) -> bool {
        let response = match client.get(HOST_HEALTH).send() {
            Ok(response) => response,
            Err(_) => return false,
        };
        if !response.status().is_success() {
            return false;
        }
        // A listener on this port is not by itself a trusted Host. Bound
        // its response before the existing schema/online-state validation.
        let mut bytes=Vec::new();
        // A genuine Host status includes bounded service, journey and
        // bootstrap diagnostics; allow a complete response while retaining a
        // hard upper bound against unrelated loopback listeners.
        const MAX_HEALTH_BYTES:usize=256 * 1024;
        if response.take((MAX_HEALTH_BYTES + 1) as u64).read_to_end(&mut bytes).is_err()
            || bytes.len()>MAX_HEALTH_BYTES {return false;}
        let body:serde_json::Value=match serde_json::from_slice(&bytes) {
            Ok(body)=>body,
            Err(_)=>return false,
        };
        is_host_status(&body)
    }

    fn health_online() -> bool {
        let client = match reqwest::blocking::Client::builder()
            .no_proxy()
            .redirect(reqwest::redirect::Policy::none())
            .timeout(Duration::from_millis(1250))
            .connect_timeout(Duration::from_millis(500))
            .build() {
                Ok(client) => client,
                Err(_) => return false,
            };
        Self::probe_health(&client)
    }

    /// Refuse to launch a second Host when the fixed loopback port is already
    /// held by something that failed the Host schema/online identity check.
    fn listener_occupied() -> bool {
        let addr = SocketAddr::from(([127, 0, 0, 1], 43187));
        TcpStream::connect_timeout(&addr, Duration::from_millis(300)).is_ok()
    }

    fn wait_owned_healthy(&self, timeout: Duration) -> bool {
        let deadline=Instant::now()+timeout;
        while Instant::now()<deadline && !self.shutting_down.load(Ordering::Acquire) {
            // Do not adopt a different process's health after our child exits.
            if self.probe_child()!=ChildState::Running { return false; }
            if Self::health_online() { return true; }
            thread::sleep(Duration::from_millis(300));
        }
        false
    }

    fn set_readiness(&self, value:Readiness, error:Option<String>) {
        *self.readiness.lock().unwrap()=value;
        *self.last_error.lock().unwrap()=error;
    }

    /// Caller holds lifecycle. A healthy existing Host is attached but never
    /// adopted as a child. Failed owned starts are terminated/reaped, and all
    /// retries are bounded. This is process health only, never Host approval.
    fn ensure_ready_locked(&self, app:&tauri::AppHandle, max_attempts:u8) -> Result<(),String> {
        if self.shutting_down.load(Ordering::Acquire) {
            return Err("Native shell is shutting down".into());
        }
        self.set_readiness(Readiness::Starting,None);
        if Self::health_online() {
            let owned=self.probe_child()==ChildState::Running;
            if !owned { self.stop_owned(); }
            self.set_readiness(if owned {Readiness::Owned}else{Readiness::Attached},None);
            return Ok(());
        }
        if Self::listener_occupied() {
            let error="Host port occupied by an unverified or unavailable listener; refusing duplicate Host".to_owned();
            self.set_readiness(Readiness::Failed,Some(error.clone()));
            return Err(error);
        }
        // Never spawn over a still-running owned process whose health is
        // degraded: it may have an in-flight Host effect or uncertain receipt.
        if self.probe_child()==ChildState::Running {
            let error="Owned Host process is running but unhealthy; manual recovery required".to_owned();
            self.set_readiness(Readiness::Failed,Some(error.clone()));
            return Err(error);
        }
        let mut last_error=String::from("Host launch did not complete");
        for attempt in 0..max_attempts {
            if self.shutting_down.load(Ordering::Acquire) { break; }
            match Self::start(app) {
                Ok(child)=>{
                    self.store_child(child);
                    if self.wait_owned_healthy(Duration::from_secs(10)) {
                        self.set_readiness(Readiness::Owned,None);
                        return Ok(());
                    }
                    last_error=format!("Host child failed to become healthy (attempt {} of {})",attempt+1,max_attempts);
                    self.stop_owned();
                }
                Err(error)=>{
                    last_error=format!("Host child could not start: {error}");
                }
            }
            // A competing listener may have arrived after the first spawn.
            if Self::listener_occupied() {break;}
        }
        self.set_readiness(Readiness::Failed,Some(last_error.clone()));
        Err(last_error)
    }

    /// Observe the child through the OS, never through handle presence alone.
    /// `Ok(None)` means alive; `Ok(Some)` means exited and reaped, and the handle
    /// keeps the cached status so repeated probes report the same exit.
    fn probe_child(&self) -> ChildState {
        let mut guard = self.child.lock().unwrap();
        match guard.as_mut() {
            None => ChildState::NotStarted,
            Some(child) => match child.try_wait() {
                Ok(None) => ChildState::Running,
                Ok(Some(status)) => {
                    *self.exit_code.lock().unwrap() = status.code();
                    ChildState::Exited
                }
                Err(_) => ChildState::Exited,
            },
        }
    }

    /// Stop only the child this shell spawned. A live child is terminated and
    /// waited on; an already-exited child is reaped by `probe_child`. Owner data
    /// lives in the data directory and is never touched here.
    fn stop_owned(&self) {
        let mut guard = self.child.lock().unwrap();
        if let Some(mut child) = guard.take() {
            if child.try_wait().ok().flatten().is_none() {
                let _ = child.kill();
                let _ = child.wait();
            }
        }
    }

    /// Ordinary shell exit must not interrupt a durable Host effect. Dropping
    /// our process handle leaves the existing PWA-first Host running; another
    /// shell will attach on its next launch rather than spawning a duplicate.
    fn relinquish_owned(&self) {
        let _=self.child.lock().unwrap().take();
    }

    /// Adopt a freshly spawned child, stopping any earlier child this shell still
    /// owns so a second setup pass cannot leak a live process.
    fn store_child(&self, child: Child) {
        self.stop_owned();
        *self.exit_code.lock().unwrap() = None;
        *self.child.lock().unwrap() = Some(child);
    }

    fn status_payload(&self, runtime: &HostRuntime) -> serde_json::Value {
        let child = match self.probe_child() {
            ChildState::Running => "running",
            ChildState::Exited => "exited",
            ChildState::NotStarted => "not_started",
        };
        let healthy=Self::health_online();
        let readiness=*self.readiness.lock().unwrap();
        // A cached readiness cannot outlive the owned child it describes.
        // An attached external Host remains separately reported as unowned.
        let effective_ready=healthy && match readiness {
            Readiness::Owned => child=="running",
            Readiness::Attached => child!="running",
            _ => false,
        };
        let approved = approved_binaries(&runtime.root);
        let missing: Vec<&str> = approved
            .iter()
            .filter(|(_, present)| !present)
            .map(|(name, _)| *name)
            .collect();
        serde_json::json!({
            "schema": "vivim.native-host-status/1",
            "child": child,
            "exitCode": *self.exit_code.lock().unwrap(),
            "readiness": readiness.as_str(),
            "verifiedHostOnline": healthy,
            "ready": effective_ready,
            "ownedChild": child=="running",
            "autoRecoveryAttempts": self.auto_recoveries.load(Ordering::Relaxed),
            "autoRecoveryLimit": MAX_AUTO_RECOVERIES,
            "lastStartError": self.last_error.lock().unwrap().clone(),
            "runtime": runtime.mode.as_str(),
            "runtimeRoot": runtime.root.display().to_string(),
            "server": runtime.server.display().to_string(),
            "approvedBinaries": approved
                .iter()
                .map(|(name, present)| serde_json::json!({ "name": name, "present": present }))
                .collect::<Vec<_>>(),
            "missingApprovedBinaries": missing,
        })
    }
}

/// Real child state, not retained handle presence.
#[tauri::command]
async fn host_is_running(state: State<'_, Arc<HostProcess>>) -> bool {
    // OS child state and independent attached-Host state are both observed.
    // Neither cached handles nor unauthenticated successful TCP connects
    // count as readiness. Network health never blocks the Tauri UI thread.
    let state=state.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        match state.probe_child() {
            ChildState::Running => HostProcess::health_online(),
            ChildState::Exited|ChildState::NotStarted => {
                // An exited owned child is not "running" merely because a
                // different process answered the status port. Only a
                // deliberate attachment may report independent Host health.
                *state.readiness.lock().unwrap()==Readiness::Attached &&
                    HostProcess::health_online()
            }
        }
    }).await.unwrap_or(false)
}

/// Native supervisor view: real child state, runtime origin and approved
/// binaries actually shipped by this install.
#[tauri::command]
async fn host_status(app: tauri::AppHandle,
                     state: State<'_, Arc<HostProcess>>) -> Result<serde_json::Value,String> {
    // status_payload includes a live identity-checked HTTP probe, so report
    // the same source-backed payload from a blocking worker, not the UI loop.
    let state=state.inner().clone();
    tauri::async_runtime::spawn_blocking(move ||
        state.status_payload(&HostProcess::resolve_runtime(&app))
    ).await.map_err(|error|error.to_string())
}

/// Clean restart of the Host this shell owns. Only our own child is stopped;
/// the Host journal and owner data on disk are preserved.
///
/// The wait for health can take up to 20s, so the work runs on a blocking task:
/// a synchronous Tauri command would run inline on the main thread and freeze
/// the window for the whole restart.
#[tauri::command]
async fn host_restart(
    app: tauri::AppHandle,
    state: State<'_, Arc<HostProcess>>,
) -> Result<serde_json::Value, String> {
    let state = state.inner().clone();
    let task_state = state.clone();
    let task_app = app.clone();
    match tauri::async_runtime::spawn_blocking(move || restart_blocking(&task_app, &task_state)).await
    {
        Ok(payload) => Ok(payload),
        Err(_) => {
            let mut payload = state.status_payload(&HostProcess::resolve_runtime(&app));
            payload["ok"] = serde_json::json!(false);
            payload["error"] = serde_json::json!("restart task did not complete");
            Ok(payload)
        }
    }
}

fn reconcile_blocking(app:&tauri::AppHandle, state:&HostProcess,
                      stop_owned:bool, attempts:u8) -> serde_json::Value {
    let _lifecycle=state.lifecycle.lock().unwrap();
    if stop_owned {
        // An explicit restart may stop only our own process, never an existing
        // independent Host. Its journal and durable receipts stay untouched.
        state.stop_owned();
        state.auto_recoveries.store(0,Ordering::Release);
    }
    let result=state.ensure_ready_locked(app,attempts);
    let mut payload=state.status_payload(&HostProcess::resolve_runtime(app));
    payload["ok"]=serde_json::json!(result.is_ok());
    if let Err(error)=result {payload["error"]=serde_json::json!(error);}
    payload
}

fn restart_blocking(app: &tauri::AppHandle, state: &HostProcess) -> serde_json::Value {
    let _lifecycle=state.lifecycle.lock().unwrap();
    // Never terminate a process during shutdown or take ownership of one
    // that was started by another shell. Explicit restart stops only our own
    // child; no Host effect or receipt is replayed by the native shell.
    let result=if state.shutting_down.load(Ordering::Acquire) {
        Err("Native shell is shutting down; restart refused".to_owned())
    } else {
        state.stop_owned();
        state.auto_recoveries.store(0,Ordering::Release);
        if HostProcess::health_online() {
            // An independent Host now holds the port. It remains healthy,
            // but no restart occurred; a success receipt would be dishonest.
            state.set_readiness(Readiness::Attached,None);
            Err("Existing independent Host is online; no owned restart performed".to_owned())
        } else if HostProcess::listener_occupied() {
            let e="Host port occupied by unverified listener; restart refused".to_owned();
            state.set_readiness(Readiness::Failed,Some(e.clone()));Err(e)
        } else {
            // Direct owned start is serialized with setup and crash recovery.
            match HostProcess::start(app) {
                Ok(child)=>{
                    state.store_child(child);
                    if state.wait_owned_healthy(Duration::from_secs(10)) {
                        state.set_readiness(Readiness::Owned,None);Ok(())
                    } else {
                        state.stop_owned();
                        let e="Restarted Host did not become healthy; child reaped".to_owned();
                        state.set_readiness(Readiness::Failed,Some(e.clone()));Err(e)
                    }
                }
                Err(err)=>{
                    let e=format!("Host restart refused: {err}");
                    state.set_readiness(Readiness::Failed,Some(e.clone()));Err(e)
                }
            }
        }
    };
    let mut payload=state.status_payload(&HostProcess::resolve_runtime(app));
    payload["ok"]=serde_json::json!(result.is_ok());
    if let Err(error)=result {payload["error"]=serde_json::json!(error);}
    payload
}

#[tauri::command]
fn app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Pure native validation only. Never executes a Host action or accepts grants.
#[tauri::command]
fn validate_native_program(request: serde_json::Value) -> serde_json::Value {
    vivim_programmability_core::wire::validate_json(&request.to_string())
}

fn main() {
    tauri::Builder::default()
        .manage(Arc::new(HostProcess::new()))
        .setup(|app| {
            let handle = app.handle().clone();
            let window = app.get_webview_window("main").unwrap();

            // Do not block the GUI thread for a Host boot timeout. There is
            // one serialized supervisor for this shell; it never owns an
            // already-running Host and never starts a second background Host.
            let state=handle.state::<Arc<HostProcess>>().inner().clone();
            thread::spawn(move || {
                let report=reconcile_blocking(&handle,&state,false,2);
                if report["ok"]==true {
                    if let Some(destination)=HostProcess::desktop_launch_url() {
                        let script=format!("location.href = {};",
                            serde_json::to_string(&destination).unwrap());
                        let _=window.eval(&script);
                        let _=window.set_focus();
                    } else {
                        // Do not substitute an uncredentialed control URL when
                        // the Host refused the exact owner browser session.
                        eprintln!("VIVIM Host online but owner UI session unavailable");
                    }
                } else {
                    eprintln!("VIVIM Host startup not ready: {}",report["error"]);
                }

                // Crash recovery is deliberately narrow. Only an owned child
                // observed exited by the OS is restarted, at most twice per
                // shell lifetime. A live but unhealthy Host is *not* killed
                // automatically: it may still be processing an effect.
                loop {
                    thread::sleep(Duration::from_secs(3));
                    if state.shutting_down.load(Ordering::Acquire) {break;}
                    if state.probe_child()!=ChildState::Exited {continue;}
                    let used=state.auto_recoveries.load(Ordering::Acquire);
                    if used>=MAX_AUTO_RECOVERIES {
                        state.set_readiness(Readiness::Failed,
                            Some("Owned Host exhausted bounded crash recovery".into()));
                        break;
                    }
                    state.auto_recoveries.fetch_add(1,Ordering::AcqRel);
                    let recovery=reconcile_blocking(&handle,&state,false,1);
                    if recovery["ok"]!=true {
                        eprintln!("VIVIM Host crash recovery refused: {}",recovery["error"]);
                        break;
                    }
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            host_is_running,
            host_status,
            host_restart,
            app_version,
            validate_native_program
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|handle,event| {
            if let tauri::RunEvent::Exit = event {
                let state=handle.state::<Arc<HostProcess>>();
                state.shutting_down.store(true,Ordering::Release);
                let _lifecycle=state.lifecycle.lock().unwrap();
                // Closing a companion window cannot abort a Host effect.
                // Manual restart is the only shell path which stops the child.
                state.relinquish_owned();
                state.set_readiness(Readiness::Stopped,None);
            }
        });
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU64, Ordering};

    fn scratch_dir(tag: &str) -> PathBuf {
        static COUNTER: AtomicU64 = AtomicU64::new(0);
        let dir = std::env::temp_dir().join(format!(
            "vivim-native-health-{}-{}-{}",
            std::process::id(),
            tag,
            COUNTER.fetch_add(1, Ordering::Relaxed)
        ));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn touch(path: &Path) {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).unwrap();
        }
        std::fs::write(path, b"").unwrap();
    }

    fn spawn_exit(code: i32) -> Child {
        let mut command = if cfg!(windows) {
            let mut command = Command::new("cmd");
            command.args(["/c", &format!("exit {}", code)]);
            command
        } else {
            let mut command = Command::new("sh");
            command.args(["-c", &format!("exit {}", code)]);
            command
        };
        command.stdout(Stdio::null()).stderr(Stdio::null());
        command.spawn().expect("spawn exiting probe process")
    }

    fn spawn_lived() -> Child {
        let mut command = if cfg!(windows) {
            let mut command = Command::new("ping");
            command.args(["-n", "30", "127.0.0.1"]);
            command
        } else {
            let mut command = Command::new("sleep");
            command.arg("30");
            command
        };
        command.stdout(Stdio::null()).stderr(Stdio::null());
        command.spawn().expect("spawn long-lived probe process")
    }

    fn wait_until(mut predicate: impl FnMut() -> bool, timeout: Duration) -> bool {
        let deadline = Instant::now() + timeout;
        while Instant::now() < deadline {
            if predicate() {
                return true;
            }
            thread::sleep(Duration::from_millis(25));
        }
        predicate()
    }

    #[test]
    fn exited_child_is_reported_and_exit_code_recorded() {
        let state = HostProcess::new();
        *state.child.lock().unwrap() = Some(spawn_exit(7));
        assert!(
            wait_until(|| state.probe_child() == ChildState::Exited, Duration::from_secs(10)),
            "probe must observe the exited child"
        );
        assert_eq!(*state.exit_code.lock().unwrap(), Some(7));
        assert_ne!(state.probe_child(), ChildState::Running);
        // Re-probing an exited child must stay exited, not fall back to "not started".
        assert_eq!(state.probe_child(), ChildState::Exited);
    }

    #[test]
    fn live_child_is_reported_running() {
        let state = HostProcess::new();
        *state.child.lock().unwrap() = Some(spawn_lived());
        assert_eq!(state.probe_child(), ChildState::Running);
        state.stop_owned();
        assert_eq!(state.probe_child(), ChildState::NotStarted);
    }

    #[test]
    fn stop_owned_is_repeatable() {
        let state = HostProcess::new();
        *state.child.lock().unwrap() = Some(spawn_lived());
        state.stop_owned();
        state.stop_owned();
        assert!(state.child.lock().unwrap().is_none());
        assert_eq!(state.probe_child(), ChildState::NotStarted);
    }

    fn stage_manifest_contract(root: &Path) {
        let paths: Vec<String> = std::iter::once("node.exe".to_string())
            .chain(std::iter::once("apps/vivim-host/server.mjs".to_string()))
            .chain(APPROVED_BINARIES.iter().map(|bin| format!("native/bin/{bin}.exe")))
            .collect();
        for rel in &paths { touch(&root.join(rel)); }
        let files: Vec<_> = paths.iter()
            .map(|p| serde_json::json!({"path":p,"bytes":0,"sha256":"0".repeat(64)}))
            .collect();
        std::fs::write(root.join("runtime.manifest.json"),
            serde_json::json!({"schema":"arbor.host-runtime-manifest/1","files":files}).to_string())
            .unwrap();
    }

    #[test]
    fn packaged_runtime_requires_complete_staged_manifest_and_binaries() {
        let bundle = scratch_dir("bundle");
        touch(&bundle.join("node.exe"));
        touch(&bundle.join("apps/vivim-host/server.mjs"));
        assert_eq!(packaged_runtime(&bundle), None);
        stage_manifest_contract(&bundle);
        assert_eq!(packaged_runtime(&bundle), Some(bundle.clone()));
        std::fs::write(bundle.join("node.exe"), b"changed-size").unwrap();
        assert_eq!(packaged_runtime(&bundle), None);
        touch(&bundle.join("node.exe"));
        assert_eq!(packaged_runtime(&bundle), Some(bundle.clone()));
        std::fs::remove_file(bundle.join("native/bin/hqkg-import.exe")).unwrap();
        assert_eq!(packaged_runtime(&bundle), None);
        touch(&bundle.join("native/bin/hqkg-import.exe"));
        let manifest_path = bundle.join("runtime.manifest.json");
        let original = std::fs::read_to_string(&manifest_path).unwrap();
        let mut malformed:serde_json::Value=serde_json::from_str(&original).unwrap();
        malformed["files"][0]["sha256"]=serde_json::json!("invalid");
        std::fs::write(&manifest_path,malformed.to_string()).unwrap();
        assert_eq!(packaged_runtime(&bundle), None);
        std::fs::write(&manifest_path,original).unwrap();
        touch(&bundle.join("ARBOR-RUNTIME-PLACEHOLDER.txt"));
        assert_eq!(packaged_runtime(&bundle), None);

        let partial = scratch_dir("partial");
        touch(&partial.join("node.exe"));
        assert_eq!(packaged_runtime(&partial), None);

        let empty = scratch_dir("empty");
        assert_eq!(packaged_runtime(&empty), None);
    }

    #[test]
    fn runtime_classification_distinguishes_packaged_workspace_and_missing() {
        let bundle = scratch_dir("classify-packaged");
        stage_manifest_contract(&bundle);
        let runtime = HostProcess::classify_runtime(packaged_runtime(&bundle), scratch_dir("unused"));
        assert_eq!(runtime.mode, RuntimeMode::Packaged);
        assert_eq!(runtime.node, bundle.join("node.exe"));
        assert_eq!(
            runtime.server,
            bundle.join("apps/vivim-host/server.mjs")
        );

        let workspace = scratch_dir("classify-workspace");
        touch(&workspace.join("apps/vivim-host/server.mjs"));
        let runtime = HostProcess::classify_runtime(None, workspace.clone());
        assert_eq!(runtime.mode, RuntimeMode::Workspace);
        assert_eq!(HostProcess::classify_launch_runtime(None, workspace.clone(), true).mode,
            RuntimeMode::Workspace);
        assert_eq!(HostProcess::classify_launch_runtime(None, workspace, false).mode,
            RuntimeMode::Missing);
        assert_eq!(HostProcess::classify_launch_runtime(Some(bundle), scratch_dir("other"),
            false).mode, RuntimeMode::Packaged);

        let missing = scratch_dir("classify-missing");
        let runtime = HostProcess::classify_runtime(None, missing);
        assert_eq!(runtime.mode, RuntimeMode::Missing);
    }

    #[test]
    fn approved_binary_discovery_reports_only_the_frozen_contract() {
        let root = scratch_dir("approved");
        let bin = root.join("native").join("bin");
        touch(&bin.join("hqkg-personal.exe"));
        touch(&bin.join("unapproved.exe"));

        let approved = approved_binaries(&root);
        assert_eq!(approved.len(), APPROVED_BINARIES.len());
        let present: Vec<&str> = approved
            .iter()
            .filter(|(_, present)| *present)
            .map(|(name, _)| *name)
            .collect();
        assert_eq!(present, vec!["hqkg-personal"]);

        let missing = missing_approved_binaries(&root);
        assert_eq!(missing.len(), APPROVED_BINARIES.len() - 1);
        assert!(!missing.contains(&"hqkg-personal"));
        assert!(!missing.contains(&"unapproved"));
    }

    #[test]
    fn status_payload_reports_real_child_state_and_runtime() {
        let state = HostProcess::new();
        *state.child.lock().unwrap() = Some(spawn_lived());
        let runtime = HostProcess::classify_runtime(None, scratch_dir("status"));
        assert_eq!(
            state.status_payload(&runtime)["child"],
            serde_json::json!("running")
        );
        assert_eq!(
            state.status_payload(&runtime)["runtime"],
            serde_json::json!("missing")
        );
        assert_eq!(
            state.status_payload(&runtime)["schema"],
            serde_json::json!("vivim.native-host-status/1")
        );
        assert_eq!(state.status_payload(&runtime)["autoRecoveryLimit"],
            serde_json::json!(MAX_AUTO_RECOVERIES));
        assert_eq!(state.status_payload(&runtime)["readiness"],
            serde_json::json!("not_checked"));

        if let Some(child) = state.child.lock().unwrap().as_mut() {
            let _ = child.kill();
        }
        assert!(
            wait_until(
                || state.status_payload(&runtime)["child"] == serde_json::json!("exited"),
                Duration::from_secs(10)
            ),
            "status payload must flip to exited once the child dies"
        );
    }

    #[test]
    fn readiness_and_shutdown_do_not_imply_host_authority() {
        let state=HostProcess::new();
        assert_eq!(state.readiness.lock().unwrap().as_str(),"not_checked");
        state.set_readiness(Readiness::Failed,Some("not ready".into()));
        assert_eq!(state.readiness.lock().unwrap().as_str(),"failed");
        assert_eq!(state.last_error.lock().unwrap().as_deref(),Some("not ready"));
        state.shutting_down.store(true,Ordering::Release);
        assert!(state.shutting_down.load(Ordering::Acquire));
        assert_eq!(MAX_AUTO_RECOVERIES,2);
    }

    #[test]
    fn health_identity_rejects_unrelated_listeners() {
        let host = serde_json::json!({
            "schema": "vivim.host-status/1",
            "host": { "state": "online" }
        });
        assert!(is_host_status(&host));

        let unrelated = serde_json::json!({ "ok": true });
        assert!(!is_host_status(&unrelated));

        let degraded = serde_json::json!({
            "schema": "vivim.host-status/1",
            "host": { "state": "degraded" }
        });
        assert!(!is_host_status(&degraded));
    }
}