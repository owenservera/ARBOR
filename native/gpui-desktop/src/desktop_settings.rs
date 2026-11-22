//! GPUI-only Windows preferences; presentation options, NOT canonical
//! product state. Host remains sole authority for input, effects and receipts.
use std::{env,fs,io,path::{Path,PathBuf}};
use serde_json::{json,Value};
const SCHEMA: &str = "vivim.gpui-desktop-preferences/1";
const LIMIT: u64 = 4096;

#[derive(Clone,Copy,Debug,Default,PartialEq,Eq)]
pub struct Preferences {
    /// Privacy-safe by default: do not reveal an in-progress phone draft
    /// even in the PC-only Devices tool without owner opt-in.
    pub show_phone_draft_in_devices: bool,
}
impl Preferences {
    pub fn project(self) -> Value {
        json!({"schema":SCHEMA,"showPhoneDraftInDevices":self.show_phone_draft_in_devices})
    }
    pub fn parse(value:&Value) -> Option<Self> {
        let map=value.as_object()?;
        if map.len()!=2 || value["schema"]!=SCHEMA {return None;}
        let show=value["showPhoneDraftInDevices"].as_bool()?;
        Some(Self{show_phone_draft_in_devices:show})
    }
}
pub fn path() -> io::Result<PathBuf> {
    let home=env::var_os("APPDATA").filter(|value|!value.is_empty())
        .ok_or_else(||io::Error::new(io::ErrorKind::NotFound,"APPDATA_UNAVAILABLE"))?;
    Ok(PathBuf::from(home).join("VIVIM").join("desktop-preferences.json"))
}
pub fn read_at(file:&Path) -> io::Result<Preferences> {
    let metadata=match fs::metadata(file) {
        Ok(metadata)=>metadata,
        Err(e) if e.kind()==io::ErrorKind::NotFound=>return Ok(Preferences::default()),
        Err(e)=>return Err(e)
    };
    if !metadata.is_file() || metadata.len()>LIMIT {
        return Err(io::Error::new(io::ErrorKind::InvalidData,"PREFERENCES_NOT_REGULAR"));
    }
    let bytes=fs::read(file)?;
    if bytes.len() as u64>LIMIT {
        return Err(io::Error::new(io::ErrorKind::InvalidData,"PREFERENCES_TOO_LARGE"));
    }
    let value:Value=serde_json::from_slice(&bytes)
        .map_err(|_|io::Error::new(io::ErrorKind::InvalidData,"PREFERENCES_INVALID_JSON"))?;
    Preferences::parse(&value)
        .ok_or_else(||io::Error::new(io::ErrorKind::InvalidData,"PREFERENCES_INVALID_SCHEMA"))
}
pub fn save_at(file:&Path,settings:Preferences) -> io::Result<()> {
    let parent=file.parent().ok_or_else(||
        io::Error::new(io::ErrorKind::InvalidInput,"PREFERENCES_PARENT_UNAVAILABLE"))?;
    fs::create_dir_all(parent)?;
    let bytes=serde_json::to_vec_pretty(&settings.project())
        .map_err(io::Error::other)?;
    if bytes.len() as u64>LIMIT {
        return Err(io::Error::new(io::ErrorKind::InvalidInput,"PREFERENCES_TOO_LARGE"));
    }
    fs::write(file,bytes)
}
pub fn load() -> io::Result<Preferences> {read_at(&path()?)}
pub fn save(settings:Preferences) -> io::Result<()> {save_at(&path()?,settings)}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime,UNIX_EPOCH};
    #[test]
    fn default_is_inert_and_private() {
        assert_eq!(Preferences::default().show_phone_draft_in_devices,false);
        assert_eq!(Preferences::parse(&json!({"schema":SCHEMA,
            "showPhoneDraftInDevices":false})),Some(Preferences::default()));
    }
    #[test]
    fn rejects_ambiguous_or_unknown_preferences() {
        assert!(Preferences::parse(&json!({"schema":SCHEMA})).is_none());
        assert!(Preferences::parse(&json!({"schema":SCHEMA,
            "showPhoneDraftInDevices":"true"})).is_none());
        assert!(Preferences::parse(&json!({"schema":SCHEMA,
            "showPhoneDraftInDevices":true,"token":"never"})).is_none());
    }
    #[test]
    fn local_setting_round_trips_without_host_state() {
        let nonce=SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();
        let dir=env::temp_dir().join(format!("vivim-desktop-preferences-{}-{nonce}",std::process::id()));
        let file=dir.join("desktop-preferences.json");
        assert_eq!(read_at(&file).unwrap(),Preferences::default());
        let enabled=Preferences{show_phone_draft_in_devices:true};
        save_at(&file,enabled).unwrap();
        assert_eq!(read_at(&file).unwrap(),enabled);
        fs::remove_dir_all(dir).unwrap();
    }
}
