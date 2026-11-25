//! Fixed native workstation probe. Not a general command runner or authority.
//! Host must own the approved plan and one-shot claim before invoking this binary.
use std::{ffi::OsString, path::PathBuf, time::{Duration, Instant}, thread};
use vivim_host_supervisor::workstation_process::{LocalProcessSpec,OwnedProcess};
fn run()->Result<(),()>{
 let args:Vec<OsString>=std::env::args_os().skip(1).collect();
 if args.len()!=2||args[0]!="--node-version"{return Err(());}
 let input=PathBuf::from(&args[1]);
 if !input.is_absolute(){return Err(());}
 let node=input.canonicalize().map_err(|_|())?;
 let expected=if cfg!(windows){"node.exe"}else{"node"};
 if !node.file_name().and_then(|s|s.to_str()).is_some_and(|s|s.eq_ignore_ascii_case(expected)){return Err(());}
 let workspace=node.parent().ok_or(())?.to_path_buf();
 let mut environment=vec![];
 if cfg!(windows){if let Some(value)=std::env::var_os("SystemRoot"){environment.push(("SystemRoot".into(),value));}}
 let mut child=OwnedProcess::start(LocalProcessSpec{executable:node,workspace,args:vec!["--version".into()],
  environment,tail_bytes:1024}).map_err(|_|())?;
 let Some(status)=child.wait_for(Duration::from_secs(5)).map_err(|_|())? else {
  child.cancel().map_err(|_|())?;return Err(());
 };
 if !status.success(){return Err(());}
 let started=Instant::now();
 let version=loop{
  let (out,err)=child.output().map_err(|_|())?;
  if out.closed&&err.closed{
   if out.read_failed||err.read_failed||out.observed_bytes>1024||err.observed_bytes!=0{return Err(());}
   let text=String::from_utf8(out.bytes).map_err(|_|())?;
   let version=text.trim().to_owned();
   if version.len()>80||!version.starts_with('v')||!version.bytes().all(|b|b.is_ascii_alphanumeric()||b".-+".contains(&b)){return Err(());}
   break version;
  }
  if started.elapsed()>Duration::from_secs(2){return Err(());}
  thread::sleep(Duration::from_millis(10));
 };
 println!("{}",serde_json::json!({"schema":"vivim.workstation-probe/1","recipe":"node-version","exitCode":0,"version":version}));
 Ok(())
}
fn main(){if run().is_err(){eprintln!("WORKSTATION_PROBE_FAILED");std::process::exit(1);}}
