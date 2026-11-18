//! A bounded stdio entry point to the existing deterministic native validator.
//! No file paths, network, effect execution or policy grants.
use std::io::{self, Read, Write};
fn main() -> io::Result<()> {
    let mut bytes = Vec::new();
    io::stdin().lock().take(65_537).read_to_end(&mut bytes)?;
    let result = match std::str::from_utf8(&bytes) {
        Ok(input) => vivim_programmability_core::wire::validate_json(input),
        Err(_) => serde_json::json!({"schema":vivim_programmability_core::SCHEMA,
            "outcome":"refused","reasonCode":"INVALID_UTF8",
            "executionAuthorized":false,"effectPerformed":false}),
    };
    let mut out = io::stdout().lock();
    serde_json::to_writer(&mut out, &result).map_err(io::Error::other)?;
    out.write_all(b"\n")
}
