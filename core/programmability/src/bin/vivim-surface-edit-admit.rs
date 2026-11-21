//! Offline admission tool for a future Host-owned live surface file watcher.
//! This tool NEVER executes PWA actions or effects. It emits INERT candidates.
use serde_json::json;
use std::{env, fs, process::ExitCode};
use vivim_programmability_core::live_surface::{admit_json_edit, LiveSurfaceDocument};

fn main() -> ExitCode {
    let mut args = env::args().skip(1);
    let Some(canonical_path) = args.next() else {
        return usage();
    };
    let Some(edited_path) = args.next() else {
        return usage();
    };
    if args.next().is_some() {
        return usage();
    }
    let run = || -> Result<serde_json::Value, String> {
        let bytes = fs::read(canonical_path).map_err(|e| format!("read canonical: {e}"))?;
        let current: LiveSurfaceDocument =
            serde_json::from_slice(&bytes).map_err(|e| format!("parse canonical: {e}"))?;
        let edited = fs::read(edited_path).map_err(|e| format!("read edited: {e}"))?;
        let candidates =
            admit_json_edit(&current, &edited).map_err(|e| format!("admission: {e:?}"))?;
        Ok(json!({
            "schema": "vivim.live-surface-admission/1",
            "status": "candidate",
            "commands": candidates,
            "effectPerformed": false,
            "authority": "none"
        }))
    };
    match run() {
        Ok(value) => {
            println!(
                "{}",
                serde_json::to_string_pretty(&value).expect("serializable output")
            );
            ExitCode::SUCCESS
        }
        Err(message) => {
            eprintln!(
                "{}",
                json!({"status":"refused","reason":message,"effectPerformed":false})
            );
            ExitCode::from(2)
        }
    }
}
fn usage() -> ExitCode {
    eprintln!("usage: vivim-surface-edit-admit <host-canonical.json> <edited-file.json>");
    ExitCode::from(64)
}
