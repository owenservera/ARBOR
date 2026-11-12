#![windows_subsystem = "windows"]

use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

use tauri::{Manager, State};

const HOST_HEALTH: &str = "http://127.0.0.1:43187/api/host/status";

struct HostProcess {
    child: std::sync::Mutex<Option<std::process::Child>>,
}

impl Default for HostProcess {
    fn default() -> Self {
        Self::new()
    }
}

impl HostProcess {
    fn new() -> Self {
        Self {
            child: std::sync::Mutex::new(None),
        }
    }

    /// Resolve the repo root from the current executable:
    /// <repo>/src-tauri/target/debug/vivim-host.exe -> up 3 -> <repo>
    fn repo_root() -> PathBuf {
        let exe = std::env::current_exe().unwrap_or_else(|_| PathBuf::from("."));
        let mut p = exe.parent().unwrap_or(Path::new(".")).to_path_buf();
        for _ in 0..3 {
            p = match p.parent() {
                Some(parent) => parent.to_path_buf(),
                None => break,
            };
        }
        p
    }

    fn start(app: &tauri::App) -> Result<std::process::Child, Box<dyn std::error::Error + Send + Sync>> {
        // Production MSI: run the staged Node binary and source packaged as app resources.
        // Development from checkout: preserve the existing repo-root behavior.
        let bundled = app.path().resolve("runtime", tauri::path::BaseDirectory::Resource).ok();
        let packaged = bundled.as_ref().filter(|root| {
            root.join("node.exe").is_file()
                && root.join("apps").join("vivim-host").join("server.mjs").is_file()
        });
        let (root, node) = match packaged {
            Some(root) => (root.clone(), root.join("node.exe")),
            None => (Self::repo_root(), PathBuf::from("node")),
        };
        let server = root.join("apps").join("vivim-host").join("server.mjs");
        if !server.is_file() {
            return Err(format!("VIVIM Host runtime not found at {}", server.display()).into());
        }
        let mut command = Command::new(node);
        command.arg(server)
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .current_dir(&root);
        if packaged.is_some() {
            if let Ok(apk) = app.path().resolve("vivim.apk", tauri::path::BaseDirectory::Resource) {
                command.env("VIVIM_BUNDLED_APK", apk);
            }
            if let Ok(manifest) = app.path().resolve("vivim-release.manifest.json", tauri::path::BaseDirectory::Resource) {
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
                            std::env::var_os("LOCALAPPDATA").map(|x|
                                PathBuf::from(x).join("AION").join("capture-studio"))
                        } else {
                            std::env::var_os("XDG_DATA_HOME")
                                .filter(|x| Path::new(x).is_absolute())
                                .map(|x| PathBuf::from(x).join("aion-capture-studio"))
                                .or_else(|| std::env::var_os("HOME").map(|x|
                                    PathBuf::from(x).join(".local").join("share").join("aion-capture-studio")))
                        }
                    })?;
                std::fs::read_to_string(dir.join("bootstrap").join("owner-token"))
                    .ok().map(|s| s.trim().to_string()).filter(|s| s.len() >= 32)
            }
        }?;
        let client = reqwest::blocking::Client::builder()
            .timeout(Duration::from_secs(3)).build().ok()?;
        let response = client.post("http://127.0.0.1:43187/api/host/control/ui-session")
            .header("origin", "http://127.0.0.1:43187")
            .header("x-vivim-control", "1")
            .header("content-type", "application/json")
            .bearer_auth(token).body("{}").send().ok()?;
        if !response.status().is_success() { return None; }
        let response_text = response.text().ok()?;
        let reply: serde_json::Value = serde_json::from_str(&response_text).ok()?;
        let code = reply.get("code")?.as_str()?;
        if code.len() != 64 || !code.bytes().all(|b| b.is_ascii_hexdigit()) { return None; }
        Some(format!("http://127.0.0.1:43187/#control-session={}", code))
    }

    /// Block until the host health endpoint answers, up to `timeout`.
    fn wait_healthy(timeout: Duration) -> bool {
        let client = reqwest::blocking::Client::builder()
            .timeout(Duration::from_secs(2))
            .build()
            .unwrap();
        let deadline = Instant::now() + timeout;
        while Instant::now() < deadline {
            if client.get(HOST_HEALTH).send().map(|r| r.status().is_success()).unwrap_or(false) {
                return true;
            }
            thread::sleep(Duration::from_millis(300));
        }
        false
    }
}

#[tauri::command]
fn host_is_running(state: State<'_, HostProcess>) -> bool {
    state.child.lock().unwrap().is_some()
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
        .manage(HostProcess::new())
        .setup(|app| {
            let handle = app.handle().clone();
            let window = app.get_webview_window("main").unwrap();

            // Start the VIVIM Node host as a detached child (survives window close).
            match HostProcess::start(app) {
                Ok(child) => {
                    let _ = handle.state::<HostProcess>().child.lock().unwrap().insert(child);
                    // Wait for the host to answer before showing the webview.
                    let healthy = HostProcess::wait_healthy(Duration::from_secs(20));
                    if healthy {
                        let destination = HostProcess::desktop_launch_url()
                            .unwrap_or_else(|| "http://127.0.0.1:43187/".to_string());
                        // serde_json produces a safely quoted JavaScript string.
                        let script = format!("location.href = {};", serde_json::to_string(&destination).unwrap());
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
        .invoke_handler(tauri::generate_handler![host_is_running, app_version, validate_native_program])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
