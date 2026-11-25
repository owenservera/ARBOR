//! Local durable discovery inbox. Not an execution registry or graph writer.
use crate::discovery::{ingest_craft, Scope};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::{fs, io::Write, path::{Path, PathBuf}, sync::atomic::{AtomicU64, Ordering}};

static SEQUENCE: AtomicU64 = AtomicU64::new(0);
const LIMIT: usize = 4 * 1024 * 1024;
fn digest(b: &[u8]) -> String { format!("{:x}", Sha256::digest(b)) }
fn valid_id(s: &str) -> bool { s.len() == 64 && s.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b)) }
fn bounded_read(p: &Path) -> Result<Vec<u8>, &'static str> {
    use std::io::Read;
    let f = fs::File::open(p).map_err(|_| "READ_FAILED")?;
    let mut b = Vec::new();
    f.take((LIMIT + 1) as u64).read_to_end(&mut b).map_err(|_| "READ_FAILED")?;
    if b.len() > LIMIT { return Err("SIZE_LIMIT"); }
    Ok(b)
}
pub struct Inbox { root: PathBuf }
impl Inbox {
    pub fn open(root: &Path) -> Result<Self, &'static str> {
        if !root.is_absolute() { return Err("ABSOLUTE_STORE_REQUIRED"); }
        fs::create_dir_all(root).map_err(|_| "STORE_CREATE_FAILED")?;
        Ok(Self { root: fs::canonicalize(root).map_err(|_| "STORE_OPEN_FAILED")? })
    }
    fn object(&self, id: &str) -> Result<PathBuf, &'static str> {
        if !valid_id(id) { return Err("INVALID_ID"); }
        Ok(self.root.join(format!("{id}.json")))
    }
    pub fn ingest(&self, projection: &[u8], scope: &Scope) -> Result<Value, &'static str> {
        let d = ingest_craft(projection, scope).map_err(|_| "DISCOVERY_REJECTED")?;
        let record = json!({"schema":"vivim.absorption-observation/1", "discovery":d,
            "authority":{"executionAuthorized":false,"activationPermitted":false,"sendPermission":false}});
        let bytes = serde_json::to_vec(&record).map_err(|_| "ENCODE_FAILED")?;
        if bytes.len() > LIMIT { return Err("SIZE_LIMIT"); }
        let id = digest(&bytes);
        let dest = self.object(&id)?;
        let mut created = false;
        if !dest.exists() {
            let tmp = self.root.join(format!(".pending-{}-{}", std::process::id(), SEQUENCE.fetch_add(1, Ordering::Relaxed)));
            let mut f = fs::OpenOptions::new().write(true).create_new(true).open(&tmp).map_err(|_| "STAGE_FAILED")?;
            let result = (|| {
                f.write_all(&bytes).map_err(|_| "WRITE_FAILED")?;
                f.sync_all().map_err(|_| "SYNC_FAILED")?;
                drop(f);
                match fs::hard_link(&tmp, &dest) {
                    Ok(()) => { created = true; Ok(()) },
                    Err(_) if dest.exists() => Ok(()),
                    Err(_) => Err("PUBLISH_FAILED"),
                }
            })();
            let _ = fs::remove_file(&tmp);
            result?;
        }
        if bounded_read(&dest)? != bytes { return Err("DIGEST_COLLISION_OR_CORRUPTION"); }
        Ok(json!({"schema":"vivim.absorption-intake-receipt/1","id":id,"created":created,
            "scope":scope,"evidenceCount":d.evidence.len(),"executionAuthorized":false}))
    }
    pub fn read(&self, id: &str) -> Result<Value, &'static str> {
        let bytes = bounded_read(&self.object(id)?)?;
        if digest(&bytes) != id { return Err("DIGEST_MISMATCH"); }
        serde_json::from_slice(&bytes).map_err(|_| "RECORD_INVALID")
    }
}
