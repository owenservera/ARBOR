//! Trusted-local stdio worker for Host-owned workstation sessions. No network,
//! policy, remote caller authority or arbitrary external PID control.
use serde_json::{Value,json};
use std::{collections::BTreeMap,ffi::OsString,io::{self,BufRead,Write},path::PathBuf,
 sync::mpsc,thread,time::{Duration,Instant}};
use vivim_host_supervisor::workstation_process::{LocalProcessSpec,OwnedProcess,OutputTail};
const MAX_RUNNING:usize=8;
const MAX_RETAINED:usize=64;
const RETENTION:Duration=Duration::from_secs(600);
struct Session{child:OwnedProcess,started:Instant,deadline:Duration,finished:Option<Instant>,timed_out:bool,cancelled:bool}
fn capacity(running:usize,retained:usize)->bool{running<MAX_RUNNING&&retained<MAX_RETAINED}
fn error(code:&str)->Result<Value,String>{Err(code.into())}
fn text<'a>(v:&'a Value,k:&str)->Result<&'a str,String>{v.get(k).and_then(Value::as_str).ok_or("INVALID_REQUEST".into())}
fn number(v:&Value,k:&str)->Result<u64,String>{v.get(k).and_then(Value::as_u64).ok_or("INVALID_REQUEST".into())}
fn keys(v:&Value,allowed:&[&str])->bool{v.as_object().is_some_and(|o|o.keys().all(|k|allowed.contains(&k.as_str())))}
fn valid_id(id:&str)->bool{id.len()==20&&id.starts_with("ctl-")&&id[4..].bytes().all(|b|b.is_ascii_hexdigit()&&!b.is_ascii_uppercase())}
fn hex(bytes:&[u8])->String{let mut out=String::with_capacity(bytes.len()*2);const H:&[u8]=b"0123456789abcdef";for b in bytes{out.push(H[(b>>4)as usize]as char);out.push(H[(b&15)as usize]as char);}out}
fn page(t:OutputTail,cursor:u64)->Result<Value,String>{
 if cursor>t.observed_bytes{return error("CURSOR_FUTURE");}
 let first=t.observed_bytes.saturating_sub(t.bytes.len()as u64);
 let start=cursor.max(first);let offset=(start-first)as usize;let end=(offset+4096).min(t.bytes.len());
 let bytes=&t.bytes[offset..end];
 Ok(json!({"first":first,"requested":cursor,"next":first+end as u64,"observed":t.observed_bytes,
 "gap":cursor<first,"hex":hex(bytes),"text":String::from_utf8_lossy(bytes),"closed":t.closed,"readFailed":t.read_failed}))
}
impl Session{
 fn update(&mut self)->Result<(),String>{
  if self.child.poll().map_err(|_|"POLL_FAILED")?.is_none()&&self.started.elapsed()>=self.deadline{
   self.child.cancel().map_err(|_|"CANCEL_UNCERTAIN")?;self.timed_out=true;
  }
  if self.child.poll().map_err(|_|"POLL_FAILED")?.is_some()&&self.finished.is_none(){self.finished=Some(Instant::now());self.child.close_input();}
  Ok(())
 }
 fn status(&mut self,id:&str)->Result<Value,String>{
  self.update()?;let status=self.child.poll().map_err(|_|"POLL_FAILED")?;
  Ok(json!({"sessionId":id,"state":if self.timed_out{"timed-out"}else if status.is_some(){"exited"}else{"running"},
   "containment":if cfg!(windows){"windows-job"}else{"direct-child"},"cancelled":self.cancelled,"exitCode":status.and_then(|s|s.code()),"success":status.map(|s|s.success()&&!self.cancelled&&!self.timed_out),"elapsedMs":self.finished.unwrap_or_else(Instant::now).duration_since(self.started).as_millis().min(u64::MAX as u128)as u64}))
 }
}
fn execute(v:&Value,sessions:&mut BTreeMap<String,Session>)->Result<Value,String>{
 let op=text(v,"op")?;
 if op=="inventory"{
  if !keys(v,&["id","op"]){return error("INVALID_REQUEST");}
  let mut rows=Vec::new();let mut running=0;let mut unsettled=0;
  for (id,session) in sessions.iter_mut(){
   let status=session.status(id)?;
   let (stdout,stderr)=session.child.output().map_err(|_|"OUTPUT_FAILED")?;
   if status["state"]=="running"{running+=1;}
   if !stdout.closed||!stderr.closed||stdout.read_failed||stderr.read_failed{unsettled+=1;}
   rows.push(json!({"status":status,"stdoutClosed":stdout.closed,"stderrClosed":stderr.closed,
    "stdoutReadFailed":stdout.read_failed,"stderrReadFailed":stderr.read_failed}));
  }
  return Ok(json!({"schema":"vivim.workstation-session-inventory/1","running":running,
   "retained":rows.len(),"unsettledOutput":unsettled,"maxRunning":MAX_RUNNING,
   "maxRetained":MAX_RETAINED,"sessions":rows}));
 }
 let id=text(v,"sessionId")?;if !valid_id(id){return error("INVALID_SESSION");}
 if op=="start"{
  if !keys(v,&["id","op","sessionId","executable","workspace","args","environment","interactive","timeoutMs"])||sessions.contains_key(id){return error("SESSION_LIMIT_OR_DUPLICATE");}
  // Completed sessions retain their output without consuming a running slot.
  // A separate retained bound prevents unbounded output memory usage.
  let running=sessions.values().filter(|s|s.finished.is_none()).count();
  if !capacity(running,sessions.len()){return error("SESSION_LIMIT_OR_DUPLICATE");}
  let args=v.get("args").and_then(Value::as_array).ok_or("INVALID_ARGS")?;
  let env=v.get("environment").and_then(Value::as_object).ok_or("INVALID_ENV")?;
  if args.len()>64||env.len()>32{return error("INVALID_SPEC");}
  let mut argv=Vec::<OsString>::new();for a in args{let a=a.as_str().ok_or("INVALID_ARGS")?;if a.len()>16384||a.contains('\0'){return error("INVALID_ARGS");}argv.push(a.into());}
  let mut environment=Vec::<(OsString,OsString)>::new();for(k,val)in env{let val=val.as_str().ok_or("INVALID_ENV")?;if k.is_empty()||k.contains('=')||k.contains('\0')||val.len()>32768||val.contains('\0'){return error("INVALID_ENV");}environment.push((k.into(),val.into()));}
  let ttl=number(v,"timeoutMs")?;if !(100..=1_800_000).contains(&ttl){return error("INVALID_TIMEOUT");}
  let interactive=v.get("interactive").and_then(Value::as_bool).ok_or("INVALID_REQUEST")?;
  let child=OwnedProcess::start_with_input(LocalProcessSpec{executable:PathBuf::from(text(v,"executable")?),workspace:PathBuf::from(text(v,"workspace")?),args:argv,environment,tail_bytes:65536},interactive).map_err(|_|"SPAWN_FAILED")?;
  let mut session=Session{child,started:Instant::now(),deadline:Duration::from_millis(ttl),finished:None,timed_out:false,cancelled:false};
  let result=session.status(id);sessions.insert(id.into(),session);return result;
 }
 let session=sessions.get_mut(id).ok_or("SESSION_UNKNOWN")?;
 match op{
  "output" if keys(v,&["id","op","sessionId","stdoutCursor","stderrCursor"])=>{
   let status=session.status(id)?;let (out,err)=session.child.output().map_err(|_|"OUTPUT_FAILED")?;
   Ok(json!({"status":status,"stdout":page(out,number(v,"stdoutCursor")?)?,"stderr":page(err,number(v,"stderrCursor")?)?}))
  }
  "status" if keys(v,&["id","op","sessionId"])=>session.status(id),
  "cancel" if keys(v,&["id","op","sessionId"])=>{if session.child.poll().map_err(|_|"POLL_FAILED")?.is_none(){session.child.cancel().map_err(|_|"CANCEL_UNCERTAIN")?;session.cancelled=true;}session.status(id)}
  "input" if keys(v,&["id","op","sessionId","input"])=>{session.update()?;let input=text(v,"input")?;session.child.send_input(input.as_bytes().to_vec()).map_err(|_|"INPUT_NOT_QUEUED")?;Ok(json!({"sessionId":id,"queuedBytes":input.len()}))}
  _=>error("INVALID_REQUEST")
 }
}
fn main(){
 let(tx,rx)=mpsc::sync_channel::<String>(64);
 thread::spawn(move||{let stdin=io::stdin();for line in stdin.lock().lines(){match line{Ok(s) if s.len()<=262144=>{if tx.send(s).is_err(){break;}},_=>break}}});
 let mut sessions=BTreeMap::new();let mut out=io::stdout().lock();
 loop{
  // Expiry is evaluated even when the remote client disconnects or is idle.
  sessions.retain(|_,s:&mut Session|{let _=s.update();s.finished.is_none_or(|t|t.elapsed()<RETENTION)});
  match rx.recv_timeout(Duration::from_millis(100)){
   Ok(line)=>{let v:Value=match serde_json::from_str(&line){Ok(v)=>v,Err(_)=>break};
    let Some(id)=v.get("id").and_then(Value::as_u64)else{break};
    let response=match execute(&v,&mut sessions){Ok(result)=>json!({"id":id,"ok":true,"result":result}),Err(code)=>json!({"id":id,"ok":false,"code":code})};
    if writeln!(out,"{}",response).and_then(|_|out.flush()).is_err(){break;}
   }
   Err(mpsc::RecvTimeoutError::Timeout)=>{}
   Err(mpsc::RecvTimeoutError::Disconnected)=>break
  }
 }
 // Dropping the Windows job handles terminates owned descendant trees.
 // Non-Windows platforms currently reap only directly owned children.
}
#[cfg(test)]mod tests{use super::*;
 #[test]fn inventory_is_observation_not_process_admission(){
  let mut sessions=BTreeMap::new();
  let r=execute(&json!({"id":1,"op":"inventory"}),&mut sessions).unwrap();
  assert_eq!(r["running"],0);assert_eq!(r["retained"],0);assert_eq!(r["unsettledOutput"],0);
  assert_eq!(r["maxRunning"],8);assert_eq!(r["maxRetained"],64);
  assert!(execute(&json!({"id":1,"op":"inventory","pid":1}),&mut sessions).is_err());
 }

 #[test]fn completed_sessions_do_not_consume_running_capacity(){assert!(capacity(0,8));assert!(capacity(7,63));assert!(!capacity(8,8));assert!(!capacity(0,64));}
 #[test]fn output_cursor_preserves_exact_bytes_across_pages(){let mut bytes=vec![b'x';4095];bytes.extend_from_slice("é".as_bytes());let t=OutputTail{observed_bytes:bytes.len()as u64,bytes,closed:true,read_failed:false};let a=page(t.clone(),0).unwrap();let b=page(t,4096).unwrap();assert_eq!(a["next"],4096);assert!(a["hex"].as_str().unwrap().ends_with("c3"));assert_eq!(b["hex"],"a9");assert_eq!(b["next"],4097);}
 #[test]fn cursor_gap_and_paging(){let t=OutputTail{bytes:vec![65,66,67],observed_bytes:10,closed:true,read_failed:false};let p=page(t.clone(),0).unwrap();assert_eq!(p["gap"],true);assert_eq!(p["first"],7);assert_eq!(p["next"],10);assert_eq!(p["hex"],"414243");assert!(page(t,11).is_err());}
 #[test]fn unknown_and_foreign_pid_refused(){let mut s=BTreeMap::new();assert!(execute(&json!({"id":1,"op":"cancel","sessionId":"ctl-0123456789abcdef","pid":1}),&mut s).is_err());assert!(execute(&json!({"id":2,"op":"cancel","sessionId":"123"}),&mut s).is_err());}
}
