//! @hq:capability vivim.download.torrent@1
//! Device-local transport engine. The caller (Host or Android service) owns authorization.
use anyhow::{Context, Result, anyhow, ensure};
use fs2::FileExt;
use librqbit::{AddTorrent, AddTorrentOptions, ManagedTorrent, Session, SessionOptions,
    SessionPersistenceConfig, api::TorrentIdOrHash};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::{fs::{self, File, OpenOptions}, path::Path, sync::Arc};

pub const SCHEMA: &str = "vivim.download-worker/1";
pub const MAX_MAGNET: usize = 8192;
pub const MAX_METAINFO: usize = 1024 * 1024;

#[derive(Debug, Deserialize)]
#[serde(tag = "op", rename_all = "snake_case", deny_unknown_fields)]
pub enum Command {
    List,
    AddMagnet { magnet: String },
    AddFile { metainfo: Vec<u8> },
    Pause { hash: String },
    Resume { hash: String },
    Remove { hash: String },
    Shutdown,
}
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Request {
    pub id: String,
    pub command: Command,
}
#[derive(Debug, Serialize)]
pub struct Reply {
    pub schema: &'static str,
    pub id: String,
    pub ok: bool,
    pub result: Option<Value>,
    pub error: Option<&'static str>,
}

pub struct Manager {
    session: Arc<Session>,
    _lock: File,
}
impl Manager {
    pub async fn open(root: &Path, offline: bool) -> Result<Self> {
        fs::create_dir_all(root)?;
        let root = root.canonicalize()?;
        let lock = OpenOptions::new().read(true).write(true).create(true)
            .truncate(false).open(root.join("engine.lock"))?;
        FileExt::try_lock_exclusive(&lock).context("download root already in use")?;
        let payload = root.join("payload");
        let state = root.join("session");
        fs::create_dir_all(&payload)?;
        fs::create_dir_all(&state)?;
        let session = Session::new_with_opts(payload, SessionOptions {
            persistence: Some(SessionPersistenceConfig::Json { folder: Some(state) }),
            fastresume: false, // Recheck pieces rather than trust a stale fast-resume map.
            disable_dht: offline,
            disable_dht_persistence: true,
            enable_upnp_port_forwarding: false,
            listen_port_range: if offline { None } else { Some(42000..42100) },
            ..Default::default()
        }).await?;
        Ok(Self { session, _lock: lock })
    }
    pub fn list(&self) -> Value {
        self.session.with_torrents(|it| {
            let mut rows: Vec<_> = it.map(|(_, h)| row(h)).collect();
            rows.sort_by(|a,b| a["hash"].as_str().cmp(&b["hash"].as_str()));
            let total = rows.len();
            rows.truncate(100);
            json!({"device":"local","total":total,"items":rows})
        })
    }
    fn find(&self, hash: &str) -> Result<Arc<ManagedTorrent>> {
        ensure!(hash.len() == 40 && hash.bytes().all(|c|c.is_ascii_hexdigit()), "invalid hash");
        self.session.get(TorrentIdOrHash::parse(hash)?).context("unknown torrent")
    }
    async fn add(&self, source: AddTorrent<'_>) -> Result<Value> {
        let handle = self.session.add_torrent(source, Some(AddTorrentOptions {
            overwrite: false,
            ..Default::default()
        })).await?.into_handle().context("no managed torrent")?;
        Ok(row(&handle))
    }
    pub async fn execute(&self, command: Command) -> Result<Value> {
        match command {
            Command::List => Ok(self.list()),
            Command::AddMagnet { magnet } => {
                validate_magnet(&magnet)?;
                self.add(AddTorrent::from_url(magnet)).await
            }
            Command::AddFile { metainfo } => {
                ensure!(!metainfo.is_empty() && metainfo.len() <= MAX_METAINFO, "invalid metainfo size");
                self.add(AddTorrent::from_bytes(metainfo)).await
            }
            Command::Pause { hash } => {
                let h = self.find(&hash)?;
                if !h.is_paused() { self.session.pause(&h).await?; }
                Ok(row(&h))
            }
            Command::Resume { hash } => {
                let h = self.find(&hash)?;
                if h.is_paused() { self.session.unpause(&h).await?; }
                Ok(row(&h))
            }
            Command::Remove { hash } => {
                let h = self.find(&hash)?;
                let id = TorrentIdOrHash::from(h.info_hash());
                self.session.delete(id, false).await?;
                ensure!(self.session.get(id).is_none(), "remove readback failed");
                Ok(json!({"hash":hash,"removed":true,"filesDeleted":false}))
            }
            Command::Shutdown => Err(anyhow!("shutdown is transport-owned")),
        }
    }
    pub async fn stop(&self) { self.session.stop().await; }
}

fn row(h: &ManagedTorrent) -> Value {
    let s = h.stats();
    json!({
        "hash": TorrentIdOrHash::from(h.info_hash()).to_string(),
        "name": h.name().map(|s|s.chars().take(160).collect::<String>()),
        "paused": h.is_paused(),
        "state": s.state,
        "downloadedBytes": s.progress_bytes,
        "totalBytes": s.total_bytes,
        "uploadedBytes": s.uploaded_bytes,
        "finished": s.finished,
        "hasError": s.error.is_some()
    })
}
pub fn validate_magnet(magnet: &str) -> Result<()> {
    ensure!(magnet.len() <= MAX_MAGNET && !magnet.chars().any(char::is_control), "invalid magnet");
    let query = magnet.strip_prefix("magnet:?").context("magnet scheme required")?;
    let mut hashes = query.split('&').filter_map(|p| p.strip_prefix("xt=urn:btih:"));
    let hash = hashes.next().context("BitTorrent v1 hash required")?;
    ensure!(hashes.next().is_none(), "ambiguous magnet");
    ensure!((hash.len() == 40 && hash.bytes().all(|b| b.is_ascii_hexdigit())) ||
        (hash.len() == 32 && hash.bytes().all(|b| matches!(b.to_ascii_uppercase(),b'A'..=b'Z'|b'2'..=b'7'))),
        "invalid BitTorrent hash");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn input_validation() {
        assert!(validate_magnet("magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567").is_ok());
        assert!(validate_magnet("https://example.org/file").is_err());
        assert!(validate_magnet("magnet:?xt=urn:btih:bad").is_err());
    }
    #[tokio::test]
    async fn real_session_lock_and_empty_readback() {
        let root = tempfile::tempdir().unwrap();
        let manager = Manager::open(root.path(), true).await.unwrap();
        assert_eq!(manager.execute(Command::List).await.unwrap()["total"], 0);
        assert!(Manager::open(root.path(), true).await.is_err());
        manager.stop().await;
        drop(manager);
        let restored = Manager::open(root.path(), true).await.unwrap();
        assert_eq!(restored.list()["total"], 0);
        restored.stop().await;
    }
    #[tokio::test]
    async fn real_metainfo_and_remove_preserves_files() {
        let root = tempfile::tempdir().unwrap();
        let manager = Manager::open(root.path(), true).await.unwrap();
        // A real v1 metainfo for the five bytes "hello"; no external trackers.
        let mut meta = b"d4:infod6:lengthi5e4:name9:hello.txt12:piece lengthi16384e6:pieces20:".to_vec();
        meta.extend_from_slice(&[0xaa,0xf4,0xc6,0x1d,0xdc,0xc5,0xe8,0xa2,0xda,0xbe,0xde,0x0f,0x3b,0x48,0x2c,0xd9,0xae,0xa9,0x43,0x4d]);
        meta.extend_from_slice(b"ee");
        let added = manager.execute(Command::AddFile { metainfo: meta }).await.unwrap();
        let hash = added["hash"].as_str().unwrap().to_owned();
        assert_eq!(manager.list()["total"], 1);
        let removed = manager.execute(Command::Remove { hash }).await.unwrap();
        assert_eq!(removed["filesDeleted"], false);
        assert_eq!(manager.list()["total"], 0);
        manager.stop().await;
    }
}
