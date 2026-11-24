//! Existing Host-owned Direct HTTPS GPUI pixel ferry, Windows native peer.
//!
//! There is ONE renderer: GPUI. This module never renders a product screen,
//! starts a new listener, authorizes a Host effect, or auto-captures the PC.
//! The caller must explicitly request a window frame and verify privacy.
//! Pairing remains in the incumbent Node Host, not in this Rust process.
//! All owner-bearing requests are loopback-only; the exact Direct proxy
//! Host/user headers bind to the preexisting authenticated Host configuration.
use crate::remote_viewport_contract::{TextPhase,Touch};
use reqwest::{blocking::Client,header::{AUTHORIZATION,CONTENT_TYPE,HOST},redirect::Policy,Url};
use serde_json::Value;
use std::{env,time::Duration};

pub const MAX_FRAME_BYTES:usize=4*1024*1024;
const BASE:&str="http://127.0.0.1:43187";
const MAX_SAFE_INTEGER:u64=9_007_199_254_740_991;

#[derive(Debug,Clone,PartialEq,Eq)]
pub struct DirectHostConfig {
    pub host:String,
    pub user:String,
}
impl DirectHostConfig {
    pub fn parse(origin:&str,user:&str)->Result<Self,&'static str>{
        let url=Url::parse(origin).map_err(|_|"DIRECT_ORIGIN_INVALID")?;
        if url.scheme()!="https" || url.username()!="" ||
            url.password().is_some() || url.path()!="/" ||
            url.query().is_some() || url.fragment().is_some(){
            return Err("DIRECT_ORIGIN_INVALID");
        }
        let Some(host)=url.host_str() else{return Err("DIRECT_ORIGIN_INVALID")};
        if !host.ends_with(".ts.net")||host.len()<8 || host.bytes().any(|ch|
            !(ch.is_ascii_lowercase()||ch.is_ascii_digit()||ch==b'.'||ch==b'-'))
            ||url.port().is_some(){
            return Err("DIRECT_ORIGIN_INVALID");
        }
        if user.trim()!=user||user.is_empty()||user.len()>256||
            user.bytes().any(|ch|ch<0x21 || ch>=0x7f){
            return Err("DIRECT_USER_INVALID");
        }
        Ok(Self{host:host.to_owned(),user:user.to_owned()})
    }
    pub fn from_env()->Result<Self,&'static str>{
        let origin=env::var("VIVIM_DIRECT_ORIGIN").map_err(|_|"DIRECT_ORIGIN_UNCONFIGURED")?;
        let user=env::var("VIVIM_DIRECT_USER").map_err(|_|"DIRECT_USER_UNCONFIGURED")?;
        Self::parse(&origin,&user)
    }
}
#[derive(Debug,Clone,PartialEq,Eq)]
pub enum RemoteInput {
    Pointer(Touch),
    Text {session:u128,revision:u64,sequence:u64,phase:TextPhase,text:String},
}
fn session_from_hex(value:&str)->Result<u128,&'static str>{
    if value.len()!=32||!value.bytes().all(|c|c.is_ascii_hexdigit()&&
        (c.is_ascii_digit()||c.is_ascii_lowercase())){
        return Err("GPUI_INPUT_SESSION_INVALID");
    }
    u128::from_str_radix(value,16).map_err(|_|"GPUI_INPUT_SESSION_INVALID")
}
fn valid_u64(value:&Value)->Result<u64,&'static str>{
    value.as_u64().filter(|number|*number<=MAX_SAFE_INTEGER)
        .ok_or("GPUI_INPUT_NUMBER_INVALID")
}
pub fn parse_native_input(reply:&Value)->Result<RemoteInput,&'static str>{
    if reply["schema"]!="vivim.gpui-native-input/1"||
       reply["state"]!="unverified"{
        return Err("GPUI_NATIVE_REPLY_UNVERIFIED");
    }
    let packet=&reply["input"];
    let session=session_from_hex(packet["session"].as_str()
        .ok_or("GPUI_INPUT_SESSION_INVALID")?)?;
    let revision=valid_u64(&packet["revision"])?;
    if revision==0{return Err("GPUI_INPUT_REVISION_INVALID");}
    let sequence=valid_u64(&packet["sequence"])?;
    match packet["kind"].as_str(){
        Some("vivim.gpui.pointer/1")=>{
            if packet["phase"]!="down"{
                return Err("GPUI_POINTER_PHASE_INVALID");
            }
            let x=u32::try_from(valid_u64(&packet["x"])?)
                .map_err(|_|"GPUI_POINTER_COORD_INVALID")?;
            let y=u32::try_from(valid_u64(&packet["y"])?)
                .map_err(|_|"GPUI_POINTER_COORD_INVALID")?;
            Ok(RemoteInput::Pointer(Touch{session,revision,sequence,x,y}))
        }
        Some("vivim.gpui.text/1")=>{
            let phase=TextPhase::from_wire(packet["phase"].as_str()
                .ok_or("GPUI_TEXT_PHASE_INVALID")?)
                .ok_or("GPUI_TEXT_PHASE_INVALID")?;
            let text=packet["text"].as_str()
                .ok_or("GPUI_TEXT_MISSING")?;
            if text.encode_utf16().count()>1024 ||
                text.chars().any(|ch|ch=='\0'||ch=='\r'||
                    ch.is_control() && ch!='\n' && ch!='\t'){
                return Err("GPUI_TEXT_INVALID");
            }
            Ok(RemoteInput::Text{session,revision,sequence,phase,
                text:text.to_owned()})
        }
        _=>Err("GPUI_INPUT_KIND_INVALID"),
    }
}
pub fn session_wire(session:u128)->String{format!("{session:032x}")}

/// The native peer is NEVER a long-lived bearer for external networks:
/// requests are sent to 127.0.0.1 only with redirects forbidden and system
/// proxies disabled. The Host itself checks owner token, Direct identity,
/// frame revision and current paired-device approval.
pub struct NativeHostPeer{
    client:Client,
    config:DirectHostConfig,
    owner_token:String,
}
impl NativeHostPeer{
    pub fn from_current_owner()->Result<Self,&'static str>{
        let config=DirectHostConfig::from_env()?;
        let owner_token=vivim_host_supervisor::read_owner_token()
            .map_err(|_|"GPUI_OWNER_TOKEN_UNAVAILABLE")?;
        if owner_token.len()<32{return Err("GPUI_OWNER_TOKEN_INVALID");}
        let client=Client::builder().no_proxy()
            .redirect(Policy::none())
            .connect_timeout(Duration::from_millis(750))
            .timeout(Duration::from_secs(4))
            .build().map_err(|_|"GPUI_NATIVE_CLIENT_UNAVAILABLE")?;
        if !vivim_host_supervisor::verify_host_owner(&client,&owner_token){
            return Err("GPUI_HOST_OWNER_NOT_PROVEN");
        }
        Ok(Self{client,config,owner_token})
    }
    fn request(&self,method:reqwest::Method,path:&str)->reqwest::blocking::RequestBuilder{
        self.client.request(method,format!("{BASE}/mobile/api/gpui/{path}"))
            .header(HOST,self.config.host.as_str())
            .header("x-forwarded-proto","https")
            .header("tailscale-user-login",self.config.user.as_str())
            .header(AUTHORIZATION,format!("Bearer {}",self.owner_token))
            .header("x-vivim-gpui-native","1")
    }
    pub fn publish_png(&self,session:u128,revision:u64,width:u32,height:u32,
        png:&[u8])->Result<(),&'static str>{
        if revision==0||revision>MAX_SAFE_INTEGER||
            !(240..=4096).contains(&width)||!(240..=4096).contains(&height)||
            png.len()<58||png.len()>MAX_FRAME_BYTES||
            !png.starts_with(&[137,80,78,71,13,10,26,10]){
            return Err("GPUI_NATIVE_FRAME_INVALID");
        }
        let response=self.request(reqwest::Method::POST,"native-frame")
            .header(CONTENT_TYPE,"image/png")
            .header("x-vivim-gpui-session",session_wire(session))
            .header("x-vivim-gpui-revision",revision.to_string())
            .header("x-vivim-gpui-width",width.to_string())
            .header("x-vivim-gpui-height",height.to_string())
            .body(png.to_vec()).send()
            .map_err(|_|"GPUI_FRAME_UPLOAD_UNAVAILABLE")?;
        if response.status()!=reqwest::StatusCode::ACCEPTED{
            return Err("GPUI_FRAME_UPLOAD_REFUSED");
        }
        let receipt:Value=response.json().map_err(|_|"GPUI_FRAME_RECEIPT_INVALID")?;
        if receipt["schema"]!="vivim.gpui-native-frame-receipt/1"||
            receipt["state"]!="published"||
            receipt["session"]!=session_wire(session)||
            receipt["revision"].as_u64()!=Some(revision){
            return Err("GPUI_FRAME_RECEIPT_INVALID");
        }
        Ok(())
    }
    /// Explicit owner Stop scrubs Host pixels/queued input immediately.
    /// There is no automatic retry of an uncertain stop request.
    pub fn stop_native_share(&self)->Result<(),&'static str>{
        let response=self.request(reqwest::Method::POST,"native-stop")
            .header("content-length","0")
            .body(Vec::<u8>::new()).send()
            .map_err(|_|"GPUI_NATIVE_STOP_UNCERTAIN")?;
        if response.status()!=reqwest::StatusCode::OK{
            return Err("GPUI_NATIVE_STOP_REFUSED");
        }
        let receipt:Value=response.json().map_err(|_|"GPUI_NATIVE_STOP_RECEIPT_INVALID")?;
        if receipt["schema"]!="vivim.gpui-owner-stop/1"||
            receipt["state"]!="stopped"{
            return Err("GPUI_NATIVE_STOP_RECEIPT_INVALID");
        }
        Ok(())
    }
    pub fn next_input(&self)->Result<Option<RemoteInput>,&'static str>{
        let response=self.request(reqwest::Method::GET,"native-input")
            .send().map_err(|_|"GPUI_INPUT_READ_UNAVAILABLE")?;
        if response.status()==reqwest::StatusCode::NO_CONTENT{return Ok(None);}
        if response.status()!=reqwest::StatusCode::OK{
            return Err("GPUI_INPUT_READ_REFUSED");
        }
        let value:Value=response.json().map_err(|_|"GPUI_INPUT_REPLY_INVALID")?;
        Ok(Some(parse_native_input(&value)?))
    }
}

/// A cryptographically random native renderer session. The OS chooses every
/// byte; a clock/PID fingerprint is NOT adequate for phone frame replay fences.
#[cfg(windows)]
pub fn new_native_session()->Result<u128,&'static str>{
    use std::ffi::c_void;
    #[link(name="bcrypt")]
    unsafe extern "system"{
        fn BCryptGenRandom(algorithm:*mut c_void,bytes:*mut u8,len:u32,flags:u32)->i32;
    }
    let mut bytes=[0u8;16];
    // BCRYPT_USE_SYSTEM_PREFERRED_RNG; NTSTATUS success equals 0.
    let result=unsafe{BCryptGenRandom(std::ptr::null_mut(),bytes.as_mut_ptr(),16,2)};
    if result!=0{return Err("GPUI_SESSION_ENTROPY_UNAVAILABLE");}
    Ok(u128::from_be_bytes(bytes))
}
#[cfg(not(windows))]
pub fn new_native_session()->Result<u128,&'static str>{
    Err("GPUI_NATIVE_WINDOWS_ONLY")
}

#[cfg(test)]
mod tests{
    use super::*;
    use serde_json::json;
    fn packet(kind:&str)->Value{
        json!({"schema":"vivim.gpui-native-input/1","state":"unverified",
            "input":{"kind":kind,"phase":"down",
                "session":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                "revision":3,"sequence":7,"x":10,"y":20}})
    }
    #[test] fn direct_config_is_exact_https_tailnet_and_owner_login(){
        let good=DirectHostConfig::parse("https://pc.tailnet.ts.net","owner@example.test").unwrap();
        assert_eq!(good.host,"pc.tailnet.ts.net");
        for bad in ["http://pc.tailnet.ts.net","https://evil.example",
            "https://attacker@pc.tailnet.ts.net",
            "https://pc.tailnet.ts.net/extra","https://pc.tailnet.ts.net?x=1",
            "https://pc.tailnet.ts.net:3000","https://pc.tailnet.ts.net#x"]{
            assert!(DirectHostConfig::parse(bad,"owner@example.test").is_err());
        }
        for bad in [""," owner@example.test","owner@example.test\r\nHost: forged"]{
            assert!(DirectHostConfig::parse("https://pc.tailnet.ts.net",bad).is_err());
        }
    }
    #[test] fn parse_inert_pointer_binds_native_session_and_integer_coordinates(){
        let result=parse_native_input(&packet("vivim.gpui.pointer/1")).unwrap();
        assert_eq!(result,RemoteInput::Pointer(Touch{
            session:u128::from_str_radix(&"a".repeat(32),16).unwrap(),
            revision:3,sequence:7,x:10,y:20}));
        assert_eq!(session_wire(1),"00000000000000000000000000000001");
    }
    #[test] fn parser_rejects_fake_host_effects_and_unauthenticated_receipts(){
        assert_eq!(parse_native_input(&packet("vivim.host.effect/1")),
            Err("GPUI_INPUT_KIND_INVALID"));
        let mut value=packet("vivim.gpui.pointer/1");
        value["state"]=json!("executed");
        assert_eq!(parse_native_input(&value),Err("GPUI_NATIVE_REPLY_UNVERIFIED"));
        value["state"]=json!("unverified");
        value["input"]["phase"]=json!("up");
        assert_eq!(parse_native_input(&value),Err("GPUI_POINTER_PHASE_INVALID"));
    }
    #[test] fn parser_rejects_unbounded_sequence_revision_and_coordinates(){
        let mut value=packet("vivim.gpui.pointer/1");
        value["input"]["sequence"]=json!(u64::MAX);
        assert!(parse_native_input(&value).is_err());
        value["input"]["sequence"]=json!(3);
        value["input"]["x"]=json!(u64::MAX);
        assert!(parse_native_input(&value).is_err());
        value["input"]["x"]=json!(1);
        value["input"]["revision"]=json!(0);
        assert!(parse_native_input(&value).is_err());
    }
    #[test] fn unicode_ime_preserved_exactly_without_native_focus_authority(){
        let mut value=packet("vivim.gpui.text/1");
        value["input"]["phase"]=json!("ime-commit");
        value["input"]["text"]=json!("日本語🔹");
        assert_eq!(parse_native_input(&value),Ok(RemoteInput::Text{
            session:u128::from_str_radix(&"a".repeat(32),16).unwrap(),
            revision:3,sequence:7,phase:TextPhase::ImeCommit,
            text:"日本語🔹".into()}));
        value["input"]["text"]=json!("\u{0}");
        assert!(parse_native_input(&value).is_err());
        value["input"]["text"]=json!("🔹".repeat(513));
        assert!(parse_native_input(&value).is_err());
    }
    #[test] fn invalid_browser_phase_does_not_become_native_ime(){
        let mut value=packet("vivim.gpui.text/1");
        value["input"]["text"]=json!("hello");
        for phase in ["host-approve","","IME-COMMIT","ime-paste"]{
            value["input"]["phase"]=json!(phase);
            assert!(parse_native_input(&value).is_err());
        }
    }
    #[cfg(windows)]
    #[test] fn native_session_uses_os_entropy_not_clock_or_process_id(){
        let a=new_native_session().unwrap();
        let b=new_native_session().unwrap();
        assert_ne!(a,b);
        assert_eq!(session_wire(a).len(),32);
    }
}
