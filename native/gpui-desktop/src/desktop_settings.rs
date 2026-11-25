//! GPUI-only Windows preferences; presentation options, NOT canonical
//! product state. Host remains sole authority for input, effects and receipts.
use std::{env,fs,io,collections::BTreeMap,path::{Path,PathBuf},sync::atomic::{AtomicU64,Ordering},io::Write};
use vivim_programmability_core::configuration::Registry;
use serde_json::{json,Value};
const SCHEMA: &str = "vivim.gpui-desktop-preferences/2";
const LEGACY: &str = "vivim.gpui-desktop-preferences/1";
static TEMP:AtomicU64=AtomicU64::new(0);
const LIMIT: u64 = 4096;

#[derive(Clone,Debug,Default,PartialEq,Eq)]
pub struct Preferences {
    /// Privacy-safe by default: do not reveal an in-progress phone draft
    /// even in the PC-only Devices tool without owner opt-in.
    pub show_phone_draft_in_devices: bool,
    pub configuration:BTreeMap<String,String>,
}
impl Preferences {
    pub fn project(&self)->Value{
        json!({"schema":SCHEMA,"showPhoneDraftInDevices":self.show_phone_draft_in_devices,"configuration":self.configuration})
    }
    pub fn parse(value:&Value)->Option<Self>{
        let map=value.as_object()?;
        let show=value["showPhoneDraftInDevices"].as_bool()?;
        if map.len()==2&&value["schema"]==LEGACY{return Some(Self{show_phone_draft_in_devices:show,..Self::default()});}
        if map.len()!=3||value["schema"]!=SCHEMA{return None;}
        let configuration=serde_json::from_value(value["configuration"].clone()).ok()?;
        if !Registry::embedded().ok()?.validate_local(&configuration){return None;}
        Some(Self{show_phone_draft_in_devices:show,configuration})
    }
    pub fn menu_visible(&self,key:&str)->bool{
        Registry::embedded().ok().and_then(|r|r.effective_local(&format!("ui.menu.{key}"),&self.configuration).map(str::to_owned)).as_deref()!=Some("hidden")
    }
    pub fn toggle_menu(&mut self,key:&str)->Result<(),String>{
        let id=format!("ui.menu.{key}");
        let next=if self.menu_visible(key){"hidden"}else{"visible"};
        Registry::embedded()?.set_local(&mut self.configuration,&id,next)
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
    if file.exists(){read_at(file)?;}
    if Preferences::parse(&settings.project()).is_none(){return Err(io::Error::new(io::ErrorKind::InvalidInput,"INVALID_PREFERENCES"));}
    let temp=parent.join(format!(".desktop-preferences-{}-{}.tmp",std::process::id(),TEMP.fetch_add(1,Ordering::Relaxed)));
    let mut out=fs::OpenOptions::new().write(true).create_new(true).open(&temp)?;
    let result=(||{out.write_all(&bytes)?;out.sync_all()?;drop(out);fs::rename(&temp,file)})();
    if result.is_err(){let _=fs::remove_file(&temp);}
    result
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
        assert_eq!(Preferences::parse(&json!({"schema":LEGACY,
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
        let mut enabled=Preferences{show_phone_draft_in_devices:true,..Preferences::default()};
        enabled.toggle_menu("bar-developer").unwrap();
        assert!(!enabled.menu_visible("bar-developer"));
        assert!(enabled.toggle_menu("bar-settings").is_err());
        save_at(&file,enabled.clone()).unwrap();
        assert_eq!(read_at(&file).unwrap(),enabled);
        fs::remove_dir_all(dir).unwrap();
    }
}
