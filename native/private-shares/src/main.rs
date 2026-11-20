//! VIVIM Direct private sharing: native authority for bytes, policy and persistence.
//! @hq:context Host-scoped secure private-share engine with durable file policy.
//! @hq:owner native-private-shares
//! @hq:capability vivim.private-shares-native@1
//! @hq:contract vivim.private-shares-request/1
//! @hq:effect host:local-storage
//! The Host alone verifies Tailscale identity, device grants and Origin/CSRF.
//! This binary accepts Host-only bounded JSON on stdin. No network or browser I/O.
//! Existing JS share records, SHA-256 capabilities and Node scrypt passcodes
//! remain compatible. One OS file lock serializes policy transitions across
//! concurrent Host processes and CLI invocations.
use chrono::{DateTime, Duration, SecondsFormat, Utc};
use fs2::FileExt;
use rand::{rngs::OsRng, RngCore};
use scrypt::{scrypt, Params};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::fs::{self, File, OpenOptions};
use std::io::{self, Read, Write};
use std::path::{Path, PathBuf};
use std::time::Duration as StdDuration;
#[cfg(unix)]
use std::os::unix::fs::{OpenOptionsExt, PermissionsExt};
use subtle::ConstantTimeEq;

const REQUEST: &str = "vivim.private-shares-request/1";
const RESPONSE: &str = "vivim.private-shares-result/1";
const RECORD: &str = "vivim.private-share-record/1";
const MAX_BYTES: u64 = 10 * 1024 * 1024;
const MAX_AGE_HOURS: f64 = 720.0;
const MAX_ALLOCATED: u64 = 250 * 1024 * 1024;
const MAX_INPUT: u64 = 32 * 1024;
const MAX_OUTPUT: usize = 128 * 1024;

#[derive(Debug, Clone, Copy)]
struct Fault { status: u16, code: &'static str }
type R<T> = Result<T, Fault>;
fn fail<T>(status: u16, code: &'static str) -> R<T> { Err(Fault { status, code }) }
fn io_err(_: io::Error) -> Fault { Fault { status: 503, code: "SHARE_STORE_UNAVAILABLE" } }
fn json_err(_: serde_json::Error) -> Fault { Fault { status: 503, code: "SHARE_STORE_UNAVAILABLE" } }
fn is_hex(s: &str, len: usize) -> bool {
    s.len() == len && s.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}
fn hex(data: &[u8]) -> String {
    const DIGITS: &[u8; 16] = b"0123456789abcdef";
    let mut out = String::with_capacity(data.len() * 2);
    for &b in data { out.push(DIGITS[(b >> 4) as usize] as char); out.push(DIGITS[(b & 15) as usize] as char); }
    out
}
fn unhex(raw: &str) -> Option<Vec<u8>> {
    if raw.len() % 2 != 0 { return None; }
    let mut out = Vec::with_capacity(raw.len() / 2);
    for bytes in raw.as_bytes().chunks(2) {
        let d = |b: u8| match b {
            b'0'..=b'9' => Some(b - b'0'),
            b'a'..=b'f' => Some(b - b'a' + 10),
            _ => None,
        };
        out.push(d(bytes[0])? * 16 + d(bytes[1])?);
    }
    Some(out)
}
fn digest(bytes: &[u8]) -> String { hex(&Sha256::digest(bytes)) }
fn new_secret(n: usize) -> String {
    let mut bytes = vec![0; n];
    OsRng.fill_bytes(&mut bytes);
    hex(&bytes)
}
fn eq_hex(a: &str, b: &str) -> bool {
    match (unhex(a), unhex(b)) {
        (Some(x), Some(y)) if x.len() == y.len() => bool::from(x.as_slice().ct_eq(y.as_slice())),
        _ => false,
    }
}
fn supplied<'a>(value: &'a Value, name: &str) -> &'a str {
    value.get(name).and_then(Value::as_str).unwrap_or("")
}
fn timestamp() -> String { Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true) }
fn date(raw: &str) -> Option<DateTime<Utc>> {
    DateTime::parse_from_rfc3339(raw).ok().map(|d| d.with_timezone(&Utc))
}
fn row_path(root: &Path, id: &str) -> PathBuf { root.join(format!("{id}.json")) }
fn bytes_path(root: &Path, id: &str) -> PathBuf { root.join(format!("{id}.bin")) }
fn metadata(root: &Path, id: &str) -> R<Value> {
    if !is_hex(id, 32) { return fail(400, "SHARE_ID_INVALID"); }
    let bytes = fs::read(row_path(root, id)).map_err(|e| {
        if e.kind() == io::ErrorKind::NotFound {
            Fault { status: 404, code: "SHARE_NOT_FOUND" }
        } else { io_err(e) }
    })?;
    let row: Value = serde_json::from_slice(&bytes).map_err(json_err)?;
    if supplied(&row, "schema") != RECORD || supplied(&row, "id") != id {
        return fail(503, "SHARE_STORE_UNAVAILABLE");
    }
    Ok(row)
}
fn write_bytes(path: &Path, data: &[u8]) -> R<()> {
    let mut options = OpenOptions::new();
    options.write(true).create_new(true);
    #[cfg(unix)]
    options.mode(0o600);
    let mut file = options.open(path).map_err(io_err)?;
    file.write_all(data).map_err(io_err)?;
    file.sync_all().map_err(io_err)
}
fn save(root: &Path, row: &Value, first: bool) -> R<()> {
    let id = supplied(row, "id");
    if !is_hex(id, 32) { return fail(400, "SHARE_ID_INVALID"); }
    let bytes = serde_json::to_vec(row).map_err(json_err)?;
    if first { return write_bytes(&row_path(root, id), &bytes); }
    let tmp = root.join(format!("{}.{}.tmp", id, new_secret(8)));
    let written = write_bytes(&tmp, &bytes);
    if written.is_err() { let _ = fs::remove_file(&tmp); return written; }
    let result = fs::rename(&tmp, row_path(root, id)).map_err(io_err);
    if result.is_err() { let _ = fs::remove_file(tmp); }
    result
}
fn public(row: &Value) -> Value {
    json!({
        "schema":"vivim.private-share/1",
        "id":row["id"],"name":row["name"],"mime":row["mime"],
        "bytes":row["bytes"],"state":row["state"],
        "createdAt":row["createdAt"],"expiresAt":row["expiresAt"],
        "maxDownloads":row["maxDownloads"],"downloads":row["downloads"],
        "views":row["views"],"passcodeRequired":row["passHash"].is_string(),
        "revokedAt":row["revokedAt"],"sha256":row["sha256"]
    })
}
fn owners(root: &Path, owner: &str) -> R<Vec<Value>> {
    let mut rows = Vec::new();
    for entry in fs::read_dir(root).map_err(io_err)? {
        let entry = entry.map_err(io_err)?;
        let filename = entry.file_name().to_string_lossy().into_owned();
        let Some(id) = filename.strip_suffix(".json") else { continue };
        if !is_hex(id, 32) { continue; }
        if let Ok(row) = metadata(root, id) {
            if supplied(&row, "ownerDeviceId") == owner { rows.push(row); }
        }
    }
    rows.sort_by(|a, b| supplied(b, "createdAt").cmp(supplied(a, "createdAt")));
    Ok(rows)
}
fn checked_owner(owner: &str) -> R<()> {
    if is_hex(owner, 32) { Ok(()) } else { fail(403, "SHARE_OWNER_INVALID") }
}
fn checked_token(row: &Value, token: &str) -> R<()> {
    if !is_hex(token, 64) || !eq_hex(&digest(token.as_bytes()), supplied(row, "tokenDigest")) {
        return fail(404, "SHARE_NOT_FOUND");
    }
    Ok(())
}
fn active(row: &Value) -> R<()> {
    if row["revokedAt"].is_string() { return fail(404, "SHARE_NOT_FOUND"); }
    if date(supplied(row, "expiresAt")).map_or(true, |d| d <= Utc::now()) {
        return fail(410, "SHARE_EXPIRED");
    }
    if supplied(row, "state") != "ready" { return fail(409, "SHARE_NOT_READY"); }
    Ok(())
}
fn key(passcode: &str, salt: &str) -> R<String> {
    let salt = unhex(salt).ok_or(Fault { status: 503, code: "SHARE_STORE_UNAVAILABLE" })?;
    let params = Params::new(14, 8, 1, 32).map_err(|_| Fault { status: 503, code: "SHARE_STORE_UNAVAILABLE" })?;
    let mut result = [0u8; 32];
    scrypt(passcode.as_bytes(), &salt, &params, &mut result)
        .map_err(|_| Fault { status: 503, code: "SHARE_STORE_UNAVAILABLE" })?;
    Ok(hex(&result))
}
fn passcode(root: &Path, row: &mut Value, supplied_code: &str) -> R<()> {
    if !row["passHash"].is_string() { return Ok(()); }
    if date(supplied(row, "passcodeBlockedUntil")).is_some_and(|t| t > Utc::now()) {
        return fail(429, "SHARE_PASSCODE_RATE_LIMITED");
    }
    if supplied_code.is_empty() { return fail(401, "SHARE_PASSCODE_REQUIRED"); }
    let matches = supplied_code.chars().count() <= 128 && supplied_code.len() <= 512
        && eq_hex(&key(supplied_code, supplied(row, "passSalt"))?, supplied(row, "passHash"));
    if !matches {
        let attempts = row["failedPasscodes"].as_u64().unwrap_or(0).saturating_add(1);
        if attempts >= 5 {
            row["failedPasscodes"] = json!(0);
            row["passcodeBlockedUntil"] = json!((Utc::now() + Duration::minutes(15)).to_rfc3339_opts(SecondsFormat::Millis, true));
        } else { row["failedPasscodes"] = json!(attempts); }
        save(root, row, false)?;
        return fail(403, "SHARE_PASSCODE_INVALID");
    }
    if row["failedPasscodes"].as_u64().unwrap_or(0) != 0 || row["passcodeBlockedUntil"].is_string() {
        row["failedPasscodes"] = json!(0);
        row["passcodeBlockedUntil"] = Value::Null;
        save(root, row, false)?;
    }
    Ok(())
}
fn prune(root: &Path) -> R<Value> {
    let now = Utc::now();
    let mut purged = 0u64;
    let mut bytes_removed = 0u64;
    let mut abandoned = 0u64;
    for entry in fs::read_dir(root).map_err(io_err)? {
        let entry = entry.map_err(io_err)?;
        let name = entry.file_name().to_string_lossy().into_owned();
        // Uncommitted temporary records and content from an interrupted
        // process are never served. Reclaim them after an hour; the OS store
        // lock prevents this from racing a live native operation.
        if name.ends_with(".tmp") || name.ends_with(".upload") {
            let fields: Vec<&str> = name.split('.').collect();
            if fields.len() == 3 && is_hex(fields[0], 32) && is_hex(fields[1], 16) {
                if entry.metadata().ok().and_then(|meta| meta.modified().ok())
                    .and_then(|modified| modified.elapsed().ok())
                    .is_some_and(|elapsed| elapsed > StdDuration::from_secs(3600)) {
                    fs::remove_file(entry.path()).map_err(io_err)?;
                }
            }
            continue;
        }
        let Some(id) = name.strip_suffix(".json") else { continue };
        if !is_hex(id, 32) { continue; }
        let Ok(mut row) = metadata(root, id) else { continue };
        let expired = date(supplied(&row, "expiresAt")).is_some_and(|t| t <= now);
        let created = date(supplied(&row, "createdAt"));
        let old_upload = supplied(&row, "state") == "uploading"
            && created.is_some_and(|t| t + Duration::minutes(20) <= now);
        let terminal = expired || old_upload || row["revokedAt"].is_string()
            || matches!(supplied(&row, "state"), "expired" | "abandoned");
        if !terminal { continue; }
        let file = bytes_path(root, id);
        if let Ok(meta) = fs::metadata(&file) { bytes_removed += meta.len(); }
        match fs::remove_file(&file) {
            Ok(()) => {}, Err(e) if e.kind() == io::ErrorKind::NotFound => {},
            Err(e) => return Err(io_err(e)),
        }
        if old_upload { abandoned += 1; }
        if !row["revokedAt"].is_string() && !matches!(supplied(&row, "state"), "expired" | "abandoned") {
            row["state"] = json!(if expired { "expired" } else { "abandoned" });
            save(root, &row, false)?;
        }
        let terminal_at = date(supplied(&row, "revokedAt"))
            .or_else(|| if expired { date(supplied(&row, "expiresAt")) }
                      else { created.map(|x| x + Duration::minutes(20)) });
        if terminal_at.is_some_and(|t| t + Duration::days(30) <= now) {
            fs::remove_file(row_path(root, id)).map_err(io_err)?;
            purged += 1;
        }
    }
    let staged = root.join("staging");
    if staged.is_dir() {
        for entry in fs::read_dir(staged).map_err(io_err)? {
            let entry = entry.map_err(io_err)?;
            let name = entry.file_name().to_string_lossy().into_owned();
            let Some(base) = name.strip_suffix(".upload") else { continue };
            if !is_hex(base, 32) { continue; }
            let meta = entry.metadata().map_err(io_err)?;
            if meta.modified().ok().and_then(|t| t.elapsed().ok())
                .is_some_and(|elapsed| elapsed > StdDuration::from_secs(3600)) {
                fs::remove_file(entry.path()).map_err(io_err)?;
            }
        }
    }
    Ok(json!({"schema":"vivim.private-share-prune/1",
        "purged":purged,"bytesRemoved":bytes_removed,"abandoned":abandoned}))
}
fn reserve(root: &Path, input: &Value, owner: &str) -> R<Value> {
    checked_owner(owner)?;
    let options = input.as_object().ok_or(Fault { status:400, code:"SHARE_OPTIONS_INVALID" })?;
    for key in options.keys() {
        if !["name","mime","bytes","expiresInHours","maxDownloads","passcode"].contains(&key.as_str()) {
            return fail(400, "SHARE_OPTIONS_INVALID");
        }
    }
    let bytes = input["bytes"].as_u64().unwrap_or(0);
    if bytes == 0 || bytes > MAX_BYTES { return fail(413, "SHARE_SIZE_INVALID"); }
    let hours = if input.get("expiresInHours").is_some() {
        input["expiresInHours"].as_f64().ok_or(Fault { status: 400, code: "SHARE_EXPIRY_INVALID" })?
    } else { 24.0 };
    if !hours.is_finite() || !(1.0..=MAX_AGE_HOURS).contains(&hours) {
        return fail(400, "SHARE_EXPIRY_INVALID");
    }
    let max = if input.get("maxDownloads").is_some() {
        input["maxDownloads"].as_u64().ok_or(Fault { status: 400, code: "SHARE_DOWNLOAD_LIMIT_INVALID" })?
    } else { 5 };
    if !(1..=100).contains(&max) { return fail(400, "SHARE_DOWNLOAD_LIMIT_INVALID"); }
    let raw_name = supplied(input, "name").replace('\\', "/");
    let name = raw_name.rsplit('/').next().unwrap_or("").trim().chars().map(|c|
        if c.is_control() || "\"<>:|?*".contains(c) { '_' } else { c }
    ).collect::<String>();
    if name.is_empty() || name.chars().count() > 180 || matches!(name.as_str(), "." | "..") {
        return fail(400, "SHARE_FILENAME_INVALID");
    }
    let mime = if supplied(input, "mime").is_empty() { "application/octet-stream" }
               else { supplied(input, "mime") };
    let valid_mime = mime.len() <= 120 && mime.split('/').count() == 2
        && mime.split('/').all(|s| !s.is_empty() && s.bytes().all(|b|
            b.is_ascii_alphanumeric() || matches!(b, b'_' | b'.' | b'+' | b'-')));
    if !valid_mime { return fail(400, "SHARE_MIME_INVALID"); }
    let secret_pass = supplied(input, "passcode");
    if !secret_pass.is_empty() && !(6..=128).contains(&secret_pass.chars().count()) {
        return fail(400, "SHARE_PASSCODE_INVALID");
    }
    prune(root)?;
    let existing = owners(root, owner)?;
    let active_rows: Vec<_> = existing.iter().filter(|r|
        !r["revokedAt"].is_string() && date(supplied(r, "expiresAt")).is_some_and(|t| t > Utc::now())
    ).collect();
    let allocated: u64 = active_rows.iter().map(|r| r["bytes"].as_u64().unwrap_or(MAX_ALLOCATED)).sum();
    if active_rows.len() >= 100 || allocated.saturating_add(bytes) > MAX_ALLOCATED {
        return fail(507, "SHARE_STORAGE_QUOTA_REACHED");
    }
    let id = new_secret(16);
    let capability = new_secret(32);
    let salt = if secret_pass.is_empty() { Value::Null } else { json!(new_secret(16)) };
    let pass_hash = if secret_pass.is_empty() { Value::Null }
        else { json!(key(secret_pass, salt.as_str().unwrap_or(""))?) };
    let row = json!({
        "schema":RECORD,"id":id,"name":name,"mime":mime,"bytes":bytes,
        "state":"uploading","ownerDeviceId":owner,"tokenDigest":digest(capability.as_bytes()),
        "createdAt":timestamp(),
        "expiresAt":(Utc::now()+Duration::milliseconds((hours*3_600_000.0) as i64))
            .to_rfc3339_opts(SecondsFormat::Millis,true),
        "maxDownloads":max,"downloads":0,"views":0,"revokedAt":null,"sha256":null,
        "passSalt":salt,"passHash":pass_hash
    });
    save(root, &row, true)?;
    let mut result = public(&row);
    result["capability"] = json!(capability);
    Ok(result)
}
fn finish(root: &Path, input: &Value) -> R<Value> {
    let id = supplied(input, "id");
    let owner = supplied(input, "ownerDeviceId");
    checked_owner(owner)?;
    let mut row = metadata(root, id)?;
    if supplied(&row, "ownerDeviceId") != owner ||
       checked_token(&row, supplied(input, "capability")).is_err() {
        return fail(403, "SHARE_OWNER_DENIED");
    }
    if supplied(&row, "state") != "uploading" || row["revokedAt"].is_string() {
        return fail(409, "SHARE_ALREADY_FINALIZED");
    }
    if date(supplied(&row, "expiresAt")).map_or(true, |t| t <= Utc::now()) {
        return fail(410, "SHARE_EXPIRED");
    }
    let stage_name = supplied(input, "stagingName");
    let Some(base) = stage_name.strip_suffix(".upload") else {
        return fail(400, "SHARE_STAGING_INVALID");
    };
    if !is_hex(base, 32) { return fail(400, "SHARE_STAGING_INVALID"); }
    let staged = root.join("staging").join(stage_name);
    let info = fs::symlink_metadata(&staged).map_err(|_| Fault { status: 503, code: "SHARE_CONTENT_UNAVAILABLE" })?;
    let expected = row["bytes"].as_u64().unwrap_or(0);
    if !info.file_type().is_file() || info.len() != expected {
        return fail(400, "SHARE_LENGTH_MISMATCH");
    }
    let mut src = File::open(&staged).map_err(io_err)?;
    let mut hash = Sha256::new();
    let tmp = root.join(format!("{}.{}.upload", id, new_secret(8)));
    let result = (|| -> R<String> {
        let mut options = OpenOptions::new();
        options.create_new(true).write(true);
        #[cfg(unix)]
        options.mode(0o600);
        let mut out = options.open(&tmp).map_err(io_err)?;
        let mut buf = [0u8; 32 * 1024];
        let mut copied = 0u64;
        loop {
            let n = src.read(&mut buf).map_err(io_err)?;
            if n == 0 { break; }
            copied += n as u64;
            if copied > MAX_BYTES || copied > expected { return fail(413, "SHARE_SIZE_LIMIT"); }
            hash.update(&buf[..n]);
            out.write_all(&buf[..n]).map_err(io_err)?;
        }
        if copied != expected { return fail(400, "SHARE_LENGTH_MISMATCH"); }
        out.sync_all().map_err(io_err)?;
        Ok(hex(&hash.finalize()))
    })();
    if result.is_err() { let _ = fs::remove_file(&tmp); }
    let sha = result?;
    if let Err(e) = fs::rename(&tmp, bytes_path(root, id)) {
        let _ = fs::remove_file(&tmp); return Err(io_err(e));
    }
    row["state"] = json!("ready");
    row["sha256"] = json!(sha);
    save(root, &row, false)?;
    Ok(public(&row))
}
fn inspect(root: &Path, input: &Value, count_download: bool) -> R<Value> {
    let id = supplied(input, "id");
    let mut row = metadata(root, id)?;
    checked_token(&row, supplied(input, "capability"))?;
    active(&row)?;
    passcode(root, &mut row, supplied(input, "passcode"))?;
    if count_download {
        let used = row["downloads"].as_u64().unwrap_or(u64::MAX);
        let max = row["maxDownloads"].as_u64().unwrap_or(0);
        if used >= max { return fail(410, "SHARE_DOWNLOAD_LIMIT_REACHED"); }
        let file = bytes_path(root, id);
        let info = fs::symlink_metadata(&file).map_err(|_| Fault { status: 503, code: "SHARE_CONTENT_UNAVAILABLE" })?;
        if !info.file_type().is_file() || info.len() != row["bytes"].as_u64().unwrap_or(0) {
            return fail(503, "SHARE_CONTENT_UNAVAILABLE");
        }
        let mut reader = File::open(&file).map_err(io_err)?;
        let mut hash = Sha256::new();
        let mut buf = [0u8; 32 * 1024];
        loop {
            let n = reader.read(&mut buf).map_err(io_err)?;
            if n == 0 { break; }
            hash.update(&buf[..n]);
        }
        if !eq_hex(&hex(&hash.finalize()), supplied(&row, "sha256")) {
            return fail(409, "SHARE_CONTENT_INTEGRITY");
        }
        row["downloads"] = json!(used + 1);
        save(root, &row, false)?;
        let mut shown = public(&row);
        shown["file"] = json!(file.to_string_lossy().into_owned());
        Ok(shown)
    } else {
        row["views"] = json!(row["views"].as_u64().unwrap_or(0).saturating_add(1));
        save(root, &row, false)?;
        Ok(public(&row))
    }
}
fn revoke(root: &Path, input: &Value) -> R<Value> {
    let owner = supplied(input, "ownerDeviceId");
    let mut row = metadata(root, supplied(input, "id"))?;
    if supplied(&row, "ownerDeviceId") != owner { return fail(403, "SHARE_OWNER_DENIED"); }
    if !row["revokedAt"].is_string() {
        row["revokedAt"] = json!(timestamp());
        save(root, &row, false)?;
        let file = bytes_path(root, supplied(&row, "id"));
        match fs::remove_file(file) {
            Ok(()) => {}, Err(e) if e.kind() == io::ErrorKind::NotFound => {},
            Err(e) => return Err(io_err(e))
        }
    }
    Ok(public(&row))
}
fn dispatch(input: &Value) -> R<Value> {
    if input["schema"] != REQUEST { return fail(400, "SHARE_REQUEST_INVALID"); }
    let base = supplied(input, "dataRoot");
    if base.is_empty() || base.len() > 4096 || !Path::new(base).is_absolute() {
        return fail(400, "SHARE_ROOT_INVALID");
    }
    let root = PathBuf::from(base).join("private-shares");
    fs::create_dir_all(root.join("staging")).map_err(io_err)?;
    // Preserve the private 0700/0600 posture of the original Node store.
    #[cfg(unix)]
    {
        fs::set_permissions(&root, fs::Permissions::from_mode(0o700)).map_err(io_err)?;
        fs::set_permissions(root.join("staging"), fs::Permissions::from_mode(0o700)).map_err(io_err)?;
    }
    let mut lock_options = OpenOptions::new();
    lock_options.read(true).write(true).create(true);
    #[cfg(unix)]
    lock_options.mode(0o600);
    let lock = lock_options.open(root.join(".rust-store.lock")).map_err(io_err)?;
    lock.lock_exclusive().map_err(io_err)?;
    let owner = supplied(input, "ownerDeviceId");
    let result = match supplied(input, "operation") {
        "reserve" => reserve(&root, &input["options"], owner),
        "finish" => finish(&root, input),
        "list" => {
            checked_owner(owner)?;
            let rows = owners(&root, owner)?;
            Ok(json!({"schema":"vivim.private-shares/1",
                "items": rows.iter().map(public).collect::<Vec<_>>()}))
        }
        "inspect" => inspect(&root, input, false),
        "download" => inspect(&root, input, true),
        "revoke" => revoke(&root, input),
        "prune" => prune(&root),
        _ => fail(400, "SHARE_OPERATION_INVALID"),
    };
    let _ = FileExt::unlock(&lock);
    result
}
fn main() {
    let mut bytes = Vec::new();
    let input = io::stdin().lock().take(MAX_INPUT + 1).read_to_end(&mut bytes);
    let result = match input {
        Ok(_) if bytes.len() as u64 <= MAX_INPUT => match serde_json::from_slice::<Value>(&bytes) {
            Ok(payload) => dispatch(&payload),
            Err(_) => fail(400, "SHARE_REQUEST_INVALID"),
        },
        _ => fail(413, "SHARE_REQUEST_TOO_LARGE")
    };
    let response = match result {
        Ok(value) => json!({"schema":RESPONSE,"ok":true,"value":value}),
        Err(error) => json!({"schema":RESPONSE,"ok":false,
            "status":error.status,"code":error.code})
    };
    let mut out = serde_json::to_vec(&response).unwrap_or_default();
    if out.len() > MAX_OUTPUT {
        out = serde_json::to_vec(&json!({"schema":RESPONSE,"ok":false,
            "status":503,"code":"SHARE_NATIVE_RESPONSE_LIMIT"})).unwrap_or_default();
    }
    out.push(b'\n');
    let _ = io::stdout().write_all(&out);
}


#[cfg(test)]
mod tests {
    use super::*;

    fn temporary() -> PathBuf {
        let root = std::env::temp_dir().join(format!("vivim-shares-native-{}", new_secret(8)));
        fs::create_dir_all(&root).expect("private native scratch dir");
        root
    }
    fn wire(root: &Path, operation: &str) -> Value {
        json!({"schema":REQUEST,"dataRoot":root.to_string_lossy(),"operation":operation})
    }
    #[test]
    fn scrypt_keeps_node_legacy_record_compatibility() {
        // Node 24 crypto.scryptSync('secret44', hex(salt), 32), N=16384,r=8,p=1.
        assert_eq!(key("secret44", "00112233445566778899aabbccddeeff").unwrap(),
            "2642a50224dd3d01c6096bb315ecf87866a1441979d409a7159740c3a8095f83");
    }
    #[test]
    fn actual_native_store_reserves_uploads_admits_once_and_revokes() {
        let root = temporary();
        let owner = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        let mut create = wire(&root, "reserve");
        create["ownerDeviceId"] = json!(owner);
        create["options"] = json!({"name":"notes.txt","mime":"text/plain","bytes":5,
            "expiresInHours":1,"maxDownloads":1,"passcode":"secret44"});
        let share = dispatch(&create).unwrap();
        let id = supplied(&share, "id").to_owned();
        let capability = supplied(&share, "capability").to_owned();
        assert!(is_hex(&id, 32) && is_hex(&capability, 64));
        let stored = metadata(&root.join("private-shares"), &id).unwrap();
        assert!(!stored.to_string().contains(&capability));
        assert!(!stored.to_string().contains("secret44"));
        let staging = root.join("private-shares/staging/0123456789abcdef0123456789abcdef.upload");
        fs::write(&staging, b"hello").unwrap();
        let mut complete = wire(&root, "finish");
        complete["id"] = json!(id);
        complete["capability"] = json!(capability);
        complete["ownerDeviceId"] = json!(owner);
        complete["stagingName"] = json!("0123456789abcdef0123456789abcdef.upload");
        assert_eq!(dispatch(&complete).unwrap()["state"],"ready");
        let mut meta = wire(&root, "inspect");
        meta["id"] = json!(id);
        meta["capability"] = json!(capability);
        meta["passcode"] = json!("secret44");
        assert_eq!(dispatch(&meta).unwrap()["views"],1);
        let mut read = meta.clone(); read["operation"] = json!("download");
        let result = dispatch(&read).unwrap();
        assert_eq!(result["downloads"],1);
        assert_eq!(fs::read(supplied(&result, "file")).unwrap(), b"hello");
        assert_eq!(dispatch(&read).unwrap_err().code,"SHARE_DOWNLOAD_LIMIT_REACHED");
        let mut revoke = wire(&root,"revoke");
        revoke["id"] = json!(id); revoke["ownerDeviceId"] = json!(owner);
        assert!(dispatch(&revoke).unwrap()["revokedAt"].is_string());
        assert_eq!(dispatch(&meta).unwrap_err().code,"SHARE_NOT_FOUND");
        fs::remove_dir_all(root).unwrap();
    }
    #[test]
    fn wrong_passcodes_lock_out_even_when_native_process_restarts() {
        let root=temporary();
        let owner="bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        let mut create=wire(&root,"reserve");
        create["ownerDeviceId"]=json!(owner);
        create["options"]=json!({"name":"locked.bin","bytes":5,"passcode":"secret44"});
        let share=dispatch(&create).unwrap();
        let id=supplied(&share,"id").to_owned();
        let salt=supplied(&metadata(&root.join("private-shares"),&id).unwrap(),"passSalt").to_owned();
        assert!(is_hex(&salt,32));
        let mut meta=wire(&root,"inspect");
        meta["id"]=share["id"].clone();meta["capability"]=share["capability"].clone();
        meta["passcode"]=json!("wrong-pass");
        // Pre-upload inspection intentionally refuses; lockout begins only for live shares.
        assert_eq!(dispatch(&meta).unwrap_err().code,"SHARE_NOT_READY");
        let staging=root.join("private-shares/staging/0123456789abcdef0123456789abcdef.upload");
        fs::write(&staging,b"hello").unwrap();
        let mut finish=wire(&root,"finish");
        finish["id"]=share["id"].clone();
        finish["capability"]=share["capability"].clone();
        finish["ownerDeviceId"]=json!(owner);
        finish["stagingName"]=json!("0123456789abcdef0123456789abcdef.upload");
        dispatch(&finish).unwrap();
        for _ in 0..5 {
            assert_eq!(dispatch(&meta).unwrap_err().code,"SHARE_PASSCODE_INVALID");
        }
        meta["passcode"]=json!("secret44");
        assert_eq!(dispatch(&meta).unwrap_err().code,"SHARE_PASSCODE_RATE_LIMITED");
        fs::remove_dir_all(root).unwrap();
    }
}
