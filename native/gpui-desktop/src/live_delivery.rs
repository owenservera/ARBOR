//! Read-only native GPUI inspection of the SAME Host PWA delivery identity.
//! No second launcher, local state writer, API provider, browser UI or effect.
use crate::ReadError;
use reqwest::blocking::Client;
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::{io::Read, time::Duration};

const HOST: &str = "http://127.0.0.1:43187";
const MANIFEST_LIMIT: u64 = 16 * 1024;
const MODULE_LIMIT: u64 = 64 * 1024;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DeliveryObservation {
    /// Manifest-declared ARBOR source. The module SHA is independently checked.
    pub declared_pwa_source: String,
    /// Host backend source is a declaration, NOT an acceptance proof.
    pub declared_host_source: String,
    pub observed_at: String,
    pub module_verified: bool,
}
impl DeliveryObservation {
    pub fn status(&self) -> String {
        format!(
            "PWA source {} · Host source {} (declared) · AI module {} · observed {} · phone acceptance unproven",
            &self.declared_pwa_source[..12], &self.declared_host_source[..12],
            if self.module_verified { "SHA-256 verified" } else { "NOT verified" },
            self.observed_at
        )
    }
}

fn lowercase_hex(value: &str, len: usize) -> bool {
    value.len() == len
        && value.bytes().all(|ch| ch.is_ascii_digit() || (b'a'..=b'f').contains(&ch))
}

/// The native app and PWA independently check identical Host-served evidence.
/// This verifies module bytes, not a signed source provenance or remote phone paint.
pub fn project_delivery(manifest: &Value, module: &[u8]) -> Result<DeliveryObservation, ReadError> {
    if module.len() > MODULE_LIMIT as usize {
        return Err(ReadError::InvalidProjection);
    }
    let stamp = &manifest["vivim_delivery"];
    if stamp["schema"] != "vivim.delivery-stamp/1"
        || stamp["module"] != "provider-handoff.mjs" {
        return Err(ReadError::InvalidProjection);
    }
    let pwa = stamp["sourceSha"].as_str().ok_or(ReadError::InvalidProjection)?;
    let host = stamp["hostSourceSha"].as_str().ok_or(ReadError::InvalidProjection)?;
    let expected = stamp["moduleSha256"].as_str().ok_or(ReadError::InvalidProjection)?;
    let at = stamp["observedAt"].as_str().ok_or(ReadError::InvalidProjection)?;
    if !lowercase_hex(pwa, 40) || !lowercase_hex(host, 40)
        || !lowercase_hex(expected, 64) || at.len() > 40
        || !at.as_bytes().get(0..4).is_some_and(|date| date.iter().all(u8::is_ascii_digit))
        || !at.contains('T') {
        return Err(ReadError::InvalidProjection);
    }
    let actual = format!("{:x}", Sha256::digest(module));
    Ok(DeliveryObservation {
        declared_pwa_source: pwa.to_owned(),
        declared_host_source: host.to_owned(),
        observed_at: at.to_owned(),
        module_verified: actual == expected,
    })
}

fn get_static(client: &Client, path: &str, limit: u64) -> Result<Vec<u8>, ReadError> {
    let response = client.get(format!("{HOST}/mobile/{path}"))
        .send().map_err(|_| ReadError::Offline)?;
    if response.status().as_u16() != 200 {
        return Err(ReadError::Unavailable);
    }
    let mut bytes = Vec::new();
    response.take(limit + 1).read_to_end(&mut bytes)
        .map_err(|_| ReadError::Unavailable)?;
    if bytes.len() as u64 > limit {
        return Err(ReadError::InvalidProjection);
    }
    Ok(bytes)
}

/// Explicit Developer-menu action only; no automatic observation, retry or send.
pub fn inspect_live_delivery() -> Result<DeliveryObservation, ReadError> {
    let client = Client::builder().no_proxy()
        .redirect(reqwest::redirect::Policy::none())
        .timeout(Duration::from_secs(5))
        .connect_timeout(Duration::from_secs(2))
        .build().map_err(|_| ReadError::Unavailable)?;
    let bytes = get_static(&client, "manifest.webmanifest", MANIFEST_LIMIT)?;
    let manifest: Value = serde_json::from_slice(&bytes)
        .map_err(|_| ReadError::InvalidProjection)?;
    let module = get_static(&client, "provider-handoff.mjs", MODULE_LIMIT)?;
    project_delivery(&manifest, &module)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn manifest(bytes: &[u8]) -> Value {
        json!({"vivim_delivery":{
            "schema":"vivim.delivery-stamp/1",
            "sourceSha":"a".repeat(40),"hostSourceSha":"b".repeat(40),
            "module":"provider-handoff.mjs",
            "moduleSha256":format!("{:x}",Sha256::digest(bytes)),
            "observedAt":"2026-11-22T21:38:53Z"
        }})
    }
    #[test]
    fn live_host_served_module_is_sha_checked_in_native_rust() {
        let bytes = b"export const verified = true;";
        let projected = project_delivery(&manifest(bytes), bytes).unwrap();
        assert!(projected.module_verified);
        assert_eq!(projected.declared_pwa_source, "a".repeat(40));
        assert!(projected.status().contains("phone acceptance unproven"));
    }
    #[test]
    fn stale_or_modified_module_cannot_be_reported_verified() {
        let projected = project_delivery(&manifest(b"old"), b"new").unwrap();
        assert!(!projected.module_verified);
        assert!(projected.status().contains("NOT verified"));
    }
    #[test]
    fn spoofed_schema_or_source_and_oversized_module_are_refused() {
        let bytes = b"module";
        let mut stamp = manifest(bytes);
        stamp["vivim_delivery"]["module"] = json!("../private");
        assert_eq!(project_delivery(&stamp, bytes),Err(ReadError::InvalidProjection));
        let mut stamp = manifest(bytes);
        stamp["vivim_delivery"]["sourceSha"] = json!("bad");
        assert_eq!(project_delivery(&stamp, bytes),Err(ReadError::InvalidProjection));
        let mut stamp = manifest(bytes);
        stamp["vivim_delivery"]["observedAt"] = json!("bogus");
        assert_eq!(project_delivery(&stamp, bytes),Err(ReadError::InvalidProjection));
        assert_eq!(project_delivery(&manifest(bytes),&vec![0u8;MODULE_LIMIT as usize + 1]),
            Err(ReadError::InvalidProjection));
    }
}
