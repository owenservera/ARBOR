#![windows_subsystem = "windows"]

use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Arc;
use std::thread;
use std::time::{Duration, Instant};

use tauri::{Manager, State};

const HOST_HEALTH: &str = "http://127.0.0.1:43187/api/host/status";
/// Every VIVIM Host status reply is stamped with this schema. An unrelated process
/// that happens to own 127.0.0.1:43187 must never pass as the Host.
const HOST_STATUS_SCHEMA: &str = "vivim.host-status/1";
/// Native binaries the frozen packaging contract may stage
/// (tools/packaging/prepare-host-runtime.mjs PACKAGED_BINARIES). The native shell
/// reports which of these the installed runtime actually ships.
const APPROVED_BINARIES: [&str; 6] = [
    "hqkg-personal",
    "hqkg-chat-context",
    "hqkg-web-feed",
    "hqkg-import",
    "vivim-program-validate",
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

struct HostProcess {
    child: std::sync::Mutex<Option<Child>>,
    exit_code: std::sync::Mutex<Option<i32>>,
}

impl Default for HostProcess {
    fn default() -> Self {
        Self::new()
    }
}

/// A staged bundle only counts as packaged when it can actually launch the Host:
/// the staged node.exe and the Host entry point must both be present.
fn packaged_runtime(root: &Path) -> Option<PathBuf> {
    let node = root.join("node.exe");
    let server = root.join("apps").join("vivim-host").join("server.mjs");
    if node.is_file() && server.is_file() {
        Some(root.to_path_buf())
    } else {
        None
    }
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

    fn resolve_runtime(app: &tauri::AppHandle) -> HostRuntime {
        let packaged = app
            .path()
            .resolve("runtime", tauri::path::BaseDirectory::Resource)
            .ok()
            .and_then(|root| packaged_runtime(&root));
        Self::classify_runtime(packaged, Self::repo_root())
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
        if runtime.mode == RuntimeMode::Packaged {
            if let Ok(apk) = app
                .path()
                .resolve("vivim.apk", tauri::path::BaseDirectory::Resource)
            {
                command.env("VIVIM_BUNDLED_APK", apk);
            }
            if let Ok(manifest) = app
                .path()
                .resolve("vivim-release.manifest.json", tauri::path::BaseDirectory::Resource)
            {
                command.env("VIVIM_BUNDLED_APK_MANIFEST", manifest);
            }
        }
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
            .timeout(Duration::from_secs(3))
            .build()
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
        let response_text = response.text().ok()?;
        let reply: serde_json::Value = serde_json::from_str(&response_text).ok()?;
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
        let body: serde_json::Value = match response.json() {
            Ok(body) => body,
            Err(_) => return false,
        };
        is_host_status(&body)
    }

    /// Block until the Host health endpoint answers, up to `timeout`.
    fn wait_healthy(timeout: Duration) -> bool {
        let client = match reqwest::blocking::Client::builder()
            .timeout(Duration::from_secs(2))
            .build()
        {
            Ok(client) => client,
            Err(_) => return false,
        };
        let deadline = Instant::now() + timeout;
        while Instant::now() < deadline {
            if Self::probe_health(&client) {
                return true;
            }
            thread::sleep(Duration::from_millis(300));
        }
        false
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

    /// Adopt a freshly spawned child, stopping any earlier child this shell still
    /// owns so a second setup pass cannot leak a live process.
    fn store_child(&self, child: Child) {
        self.stop_owned();
        *self.child.lock().unwrap() = Some(child);
    }

    fn status_payload(&self, runtime: &HostRuntime) -> serde_json::Value {
        let child = match self.probe_child() {
            ChildState::Running => "running",
            ChildState::Exited => "exited",
            ChildState::NotStarted => "not_started",
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
fn host_is_running(state: State<'_, Arc<HostProcess>>) -> bool {
    state.probe_child() == ChildState::Running
}

/// Native supervisor view: real child state, runtime origin and approved
/// binaries actually shipped by this install.
#[tauri::command]
fn host_status(app: tauri::AppHandle, state: State<'_, Arc<HostProcess>>) -> serde_json::Value {
    state.status_payload(&HostProcess::resolve_runtime(&app))
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

fn restart_blocking(app: &tauri::AppHandle, state: &HostProcess) -> serde_json::Value {
    state.stop_owned();
    match HostProcess::start(app) {
        Ok(child) => {
            state.store_child(child);
            let healthy = HostProcess::wait_healthy(Duration::from_secs(20));
            let mut payload = state.status_payload(&HostProcess::resolve_runtime(app));
            payload["ok"] = serde_json::json!(healthy);
            payload
        }
        Err(error) => {
            let mut payload = state.status_payload(&HostProcess::resolve_runtime(app));
            payload["ok"] = serde_json::json!(false);
            payload["error"] = serde_json::json!(error.to_string());
            payload
        }
    }
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

            // Start the VIVIM Node host as a detached child (survives window close).
            match HostProcess::start(app.handle()) {
                Ok(child) => {
                    handle.state::<Arc<HostProcess>>().store_child(child);
                    let runtime = HostProcess::resolve_runtime(app.handle());
                    if runtime.mode == RuntimeMode::Packaged {
                        let missing = missing_approved_binaries(&runtime.root);
                        if !missing.is_empty() {
                            eprintln!(
                                "VIVIM packaged runtime missing approved binaries: {}",
                                missing.join(", ")
                            );
                        }
                    }
                    // Wait for the host to answer before showing the webview.
                    let healthy = HostProcess::wait_healthy(Duration::from_secs(20));
                    if healthy {
                        let destination = HostProcess::desktop_launch_url()
                            .unwrap_or_else(|| "http://127.0.0.1:43187/".to_string());
                        // serde_json produces a safely quoted JavaScript string.
                        let script = format!(
                            "location.href = {};",
                            serde_json::to_string(&destination).unwrap()
                        );
                        let _ = window.eval(&script);
                        let _ = window.set_focus();
                    } else {
                        eprintln!("VIVIM host did not become healthy at {}", HOST_HEALTH);
                    }
                }
                Err(e) => eprintln!("VIVIM host start failed: {}", e),
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            host_is_running,
            host_status,
            host_restart,
            app_version,
            validate_native_program
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
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

    #[test]
    fn packaged_runtime_requires_node_and_host_entry() {
        let bundle = scratch_dir("bundle");
        touch(&bundle.join("node.exe"));
        touch(&bundle.join("apps/vivim-host/server.mjs"));
        assert_eq!(packaged_runtime(&bundle), Some(bundle.clone()));

        let partial = scratch_dir("partial");
        touch(&partial.join("node.exe"));
        assert_eq!(packaged_runtime(&partial), None);

        let empty = scratch_dir("empty");
        assert_eq!(packaged_runtime(&empty), None);
    }

    #[test]
    fn runtime_classification_distinguishes_packaged_workspace_and_missing() {
        let bundle = scratch_dir("classify-packaged");
        touch(&bundle.join("node.exe"));
        touch(&bundle.join("apps/vivim-host/server.mjs"));
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