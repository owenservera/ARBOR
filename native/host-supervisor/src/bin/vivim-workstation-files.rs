//! Host-owned scoped native UTF-8 workspace operations.
//! Reparse points refused. Writes compare expected digest before rename;
//! independent external writers are not serialized by the Host.
use serde_json::{json,Value};
use sha2::{Sha256,Digest};
use std::{fs::{self,File,OpenOptions,Metadata},io::{self,Read,Write},path::{Path,PathBuf}};
use vivim_programmability_core::workstation_capabilities::edit_preview;
type R<T>=Result<T,String>;
const MAX:usize=4*1024*1024;
const MAX_REQUEST:usize=64*1024*1024;
fn err(s:&str)->String{s.into()}
fn sha(b:&[u8])->String{format!("{:x}",Sha256::digest(b))}
fn string<'a>(v:&'a Value,k:&str)->R<&'a str>{v.get(k).and_then(Value::as_str).ok_or(err("INVALID_REQUEST"))}
fn reparse(m:&Metadata)->bool{
 if m.file_type().is_symlink(){return true;}
 #[cfg(windows)] {use std::os::windows::fs::MetadataExt;if m.file_attributes()&0x400!=0{return true;}}
 false
}
fn component(s:&str)->bool{
 if s.is_empty()||s=="."||s==".."||s.len()>240||s.ends_with('.')||s.ends_with(' ')||
 s.chars().any(|c|c.is_control()||"\\:<>\"|?*".contains(c)){return false;}
 let n=s.to_ascii_lowercase();let stem=n.split('.').next().unwrap_or("");
 if [".git",".ssh","owner-token",".env","grant.json"].contains(&n.as_str())||n.starts_with(".env.")||
 n.starts_with(".vivim-write-")||n.ends_with(".pem")||n.ends_with(".key"){return false;}
 !["con","prn","aux","nul","com1","com2","com3","com4","com5","com6","com7","com8","com9","lpt1","lpt2","lpt3","lpt4","lpt5","lpt6","lpt7","lpt8","lpt9"].contains(&stem)
}
fn checked(root:&Path,relative:&str,missing:bool,root_ok:bool)->R<PathBuf>{
 if !root.is_absolute(){return Err(err("ROOT_INVALID"));}
 let root=fs::canonicalize(root).map_err(|_|err("ROOT_INVALID"))?;
 let m=fs::symlink_metadata(&root).map_err(|_|err("ROOT_INVALID"))?;
 if !m.is_dir()||reparse(&m){return Err(err("ROOT_INVALID"));}
 if relative=="."&&root_ok{return Ok(root);}
 if relative.len()>1024||relative.starts_with('/')||relative.ends_with('/'){return Err(err("PATH_INVALID"));}
 let parts:Vec<_>=relative.split('/').collect();if parts.len()>32||parts.iter().any(|s|!component(s)){return Err(err("PATH_INVALID"));}
 let mut p=root;
 for(i,part)in parts.iter().enumerate(){p.push(part);match fs::symlink_metadata(&p){
  Ok(m)=>{if reparse(&m)||i+1<parts.len()&&!m.is_dir(){return Err(err("PATH_ESCAPE"));}},
  Err(e) if e.kind()==io::ErrorKind::NotFound&&missing&&i+1==parts.len()=>{},
  Err(_)=>return Err(err("PATH_NOT_FOUND")),
 }}
 Ok(p)
}
fn bytes(p:&Path)->R<Vec<u8>>{
 let m=fs::symlink_metadata(p).map_err(|_|err("PATH_NOT_FOUND"))?;
 if reparse(&m)||!m.is_file()||m.len()>MAX as u64{return Err(err("FILE_UNSUPPORTED_OR_TOO_LARGE"));}
 let mut b=Vec::new();File::open(p).map_err(|_|err("READ_FAILED"))?.take(MAX as u64+1).read_to_end(&mut b).map_err(|_|err("READ_FAILED"))?;
 if b.len()>MAX{return Err(err("FILE_UNSUPPORTED_OR_TOO_LARGE"));}Ok(b)
}
fn utf8(b:&[u8])->R<&str>{let s=std::str::from_utf8(b).map_err(|_|err("NOT_UTF8"))?;if s.contains('\0'){return Err(err("NOT_TEXT"));}Ok(s)}
fn info(p:&Path)->R<Value>{
 let m=fs::symlink_metadata(p).map_err(|_|err("PATH_NOT_FOUND"))?;
 if reparse(&m){return Err(err("PATH_ESCAPE"));}
 let mut v=json!({"kind":if m.is_dir(){"directory"}else if m.is_file(){"file"}else{"other"},"bytes":m.len()});
 if m.is_file()&&m.len()<=MAX as u64{v["digest"]=json!(sha(&bytes(p)?));}Ok(v)
}
fn list(p:&Path)->R<Value>{
 if !p.is_dir(){return Err(err("NOT_DIRECTORY"));}
 let mut entries=Vec::new();let mut truncated=false;
 for(i,e)in fs::read_dir(p).map_err(|_|err("READ_FAILED"))?.enumerate(){
  if i>=2048{truncated=true;break;}
  let e=e.map_err(|_|err("READ_FAILED"))?;let Some(name)=e.file_name().to_str().map(str::to_owned)else{continue};
  if !component(&name){continue;}
  let m=fs::symlink_metadata(e.path()).map_err(|_|err("READ_FAILED"))?;
  if reparse(&m){continue;}entries.push(json!({"name":name,"kind":if m.is_dir(){"directory"}else if m.is_file(){"file"}else{"other"},"bytes":m.len()}));
 }
 entries.sort_by(|a,b|a["name"].as_str().cmp(&b["name"].as_str()));
 if entries.len()>100{entries.truncate(100);truncated=true;}
 Ok(json!({"entries":entries,"truncated":truncated}))
}
struct Temp(PathBuf);
impl Drop for Temp{fn drop(&mut self){let _=fs::remove_file(&self.0);}}
fn write_atomic(root:&Path,relative:&str,expected:&str,new:&[u8])->R<()>{
 let p=checked(root,relative,true,false)?;
 let parent=p.parent().ok_or(err("PATH_INVALID"))?;
 let mut random=[0u8;16];getrandom::fill(&mut random).map_err(|_|err("STAGE_FAILED"))?;
 let suffix=random.iter().map(|b|format!("{b:02x}")).collect::<String>();
 let tmp=Temp(parent.join(format!(".vivim-write-{suffix}")));
 let mut f=OpenOptions::new().write(true).create_new(true).open(&tmp.0).map_err(|_|err("STAGE_FAILED"))?;
 f.write_all(new).and_then(|_|f.sync_all()).map_err(|_|err("STAGE_FAILED"))?;drop(f);
 let target=checked(root,relative,true,false)?;
 if target!=p{return Err(err("PATH_ESCAPE"));}
 if expected=="absent"{
  if fs::symlink_metadata(&target).is_ok(){return Err(err("STALE_DIGEST"));}
  fs::hard_link(&tmp.0,&target).map_err(|_|err("CREATE_FAILED"))?;
 }else{
  if sha(&bytes(&target)?)!=expected{return Err(err("STALE_DIGEST"));}
  let perms=fs::metadata(&target).map_err(|_|err("STALE_DIGEST"))?.permissions();
  fs::set_permissions(&tmp.0,perms).map_err(|_|err("STAGE_FAILED"))?;
  fs::rename(&tmp.0,&target).map_err(|_|err("REPLACE_FAILED"))?;
 }
 if bytes(&target).map(|b|sha(&b)).ok()!=Some(sha(new)){return Err(err("OUTCOME_UNCERTAIN"));}
 Ok(())
}
// The selection is explicit and bounded: no recursive walk, ambient paths,
// or disclosure of a partially accepted batch. The live files are not a snapshot.
fn selected_files(root:&Path,base:&str,v:&Value)->R<Vec<(String,Vec<u8>)>>{
 let directory=checked(root,base,false,true)?;
 if !directory.is_dir(){return Err(err("NOT_DIRECTORY"));}
 let paths=v.as_array().filter(|a|!a.is_empty()&&a.len()<=8).ok_or(err("INVALID_SELECTION"))?;
 let mut seen=std::collections::BTreeSet::new();let mut result=Vec::new();let mut total=0usize;
 for item in paths{
  let rel=item.as_str().ok_or(err("INVALID_SELECTION"))?;
  if rel.len()>1024||rel.split('/').any(|c|!component(c)){return Err(err("PATH_INVALID"));}
  let key=if cfg!(windows){rel.to_lowercase()}else{rel.to_owned()};
  if !seen.insert(key){return Err(err("INVALID_SELECTION"));}
  let combined=if base=="."{rel.to_owned()}else{format!("{base}/{rel}")};
  let p=checked(root,&combined,false,false)?;
  let b=bytes(&p)?;utf8(&b)?;
  total=total.checked_add(b.len()).ok_or(err("BATCH_LIMIT"))?;
  if total>MAX{return Err(err("BATCH_LIMIT"));}
  result.push((combined,b));
 }
 Ok(result)
}
fn read_selection(root:&Path,base:&str,op:&str,v:&Value)->R<Value>{
 let files=selected_files(root,base,&v["paths"])?;
 if op=="read-many"{
  let rows=files.iter().map(|(path,b)|Ok(json!({"path":path,"digest":sha(b),"bytes":b.len(),"text":utf8(b)?}))).collect::<R<Vec<_>>>()?;
  return Ok(json!({"files":rows,"consistency":"individual-live-reads"}));
 }
 let literal=string(v,"literal")?;
 if literal.is_empty()||literal.len()>160||literal.chars().any(char::is_control){return Err(err("INVALID_LITERAL"));}
 let mut matches=Vec::new();let mut truncated=false;
 let sources:Vec<_>=files.iter().map(|(p,b)|json!({"path":p,"digest":sha(b),"bytes":b.len()})).collect();
 'files:for (path,b) in &files{
  for (line,text) in utf8(b)?.split('\n').enumerate(){
   if let Some(column)=text.find(literal){
    if matches.len()==100{truncated=true;break 'files;}
    matches.push(json!({"path":path,"line":line+1,"columnByte":column+1}));
   }
  }
 }
 Ok(json!({"sources":sources,"matches":matches,"truncated":truncated,
  "matchMode":"case-sensitive-literal-first-per-line","consistency":"individual-live-reads"}))
}

fn execute(v:&Value)->R<Value>{
 let root=PathBuf::from(string(v,"root")?);let rel=string(v,"path")?;let op=string(v,"op")?;let phase=string(v,"phase")?;
 if ["read-many","search-selected"].contains(&op){
  if phase!="read"{return Err(err("INVALID_REQUEST"));}
  return read_selection(&root,rel,op,v);
 }
 if ["read","inspect","list"].contains(&op){
  if phase!="read"{return Err(err("INVALID_REQUEST"));}
  let p=checked(&root,rel,false,op=="list"||op=="inspect")?;
  return match op{"read"=>{let b=bytes(&p)?;Ok(json!({"digest":sha(&b),"bytes":b.len(),"text":utf8(&b)?}))},"inspect"=>info(&p),_=>list(&p)};
 }
 if !["preview","apply"].contains(&phase){return Err(err("INVALID_REQUEST"));}
 let p=checked(&root,rel,true,false)?;
 if op=="mkdir"{
  if fs::symlink_metadata(&p).is_ok(){return Err(err("TARGET_EXISTS"));}
  if phase=="apply"{fs::create_dir(&p).map_err(|_|err("CREATE_FAILED"))?;let m=fs::symlink_metadata(&p).map_err(|_|err("OUTCOME_UNCERTAIN"))?;if !m.is_dir()||reparse(&m){return Err(err("OUTCOME_UNCERTAIN"));}}
  return Ok(json!({"operation":op,"beforeDigest":"absent","afterDigest":"directory"}));
 }
 let expected=string(v,"expectedDigest")?;
 if expected!="absent"&&(expected.len()!=64||!expected.bytes().all(|b|b.is_ascii_hexdigit()&&!b.is_ascii_uppercase())){return Err(err("INVALID_DIGEST"));}
 let before=if expected=="absent"{if fs::symlink_metadata(&p).is_ok(){return Err(err("STALE_DIGEST"));}Vec::new()}else{let b=bytes(&p)?;if sha(&b)!=expected{return Err(err("STALE_DIGEST"));}b};
 let content=match op{
  "write"=>string(v,"content")?.to_owned(),
  "edit" if expected!="absent"=>{
   let result=edit_preview(&json!({"sourceId":format!("file:{}",sha(rel.as_bytes())),"expectedDigest":expected,"text":utf8(&before)?,"oldText":string(v,"oldText")?,"newText":string(v,"newText")?}));
   if result["outcome"]!="prepared"{return Err(result["code"].as_str().unwrap_or("EDIT_REFUSED").to_owned());}
   result["previewText"].as_str().ok_or(err("EDIT_REFUSED"))?.to_owned()
  }
  _=>return Err(err("INVALID_REQUEST"))
 };
 if content.len()>MAX||content.contains('\0'){return Err(err("TEXT_LIMIT"));}
 let after=sha(content.as_bytes());
 if phase=="apply"{write_atomic(&root,rel,expected,content.as_bytes())?;}
 Ok(json!({"operation":op,"beforeDigest":expected,"afterDigest":after,"bytes":content.len()}))
}
fn main(){
 let mut input=Vec::new();let reply=if io::stdin().take(MAX_REQUEST as u64+1).read_to_end(&mut input).is_ok()&&input.len()<=MAX_REQUEST{
  match serde_json::from_slice::<Value>(&input){Ok(v)=>match execute(&v){Ok(result)=>json!({"schema":"vivim.workstation-file-native/1","ok":true,"result":result}),Err(code)=>json!({"schema":"vivim.workstation-file-native/1","ok":false,"code":code})},Err(_)=>json!({"schema":"vivim.workstation-file-native/1","ok":false,"code":"INVALID_REQUEST"})}
 }else{json!({"schema":"vivim.workstation-file-native/1","ok":false,"code":"REQUEST_LIMIT"})};
 println!("{}",reply);
}
#[cfg(test)]mod tests{use super::*;
 #[test]fn selected_read_and_search_are_bounded_and_reject_escape(){
  let mut random=[0u8;16];getrandom::fill(&mut random).unwrap();
  let root=std::env::temp_dir().join(format!("vivim-selection-{}",sha(&random)));
  fs::create_dir(&root).unwrap();
  struct Cleanup(PathBuf);impl Drop for Cleanup{fn drop(&mut self){let _=fs::remove_dir_all(&self.0);}}
  let _cleanup=Cleanup(root.clone());
  fs::write(root.join("a.txt"),"é needle\r\nneedle\n").unwrap();
  fs::write(root.join("b.txt"),"NEEDLE").unwrap();
  let q=json!({"paths":["a.txt","b.txt"],"literal":"needle"});
  let r=read_selection(&root,".","read-many",&q).unwrap();
  assert_eq!(r["files"][0]["text"],"é needle\r\nneedle\n");
  let s=read_selection(&root,".","search-selected",&q).unwrap();
  assert_eq!(s["matches"].as_array().unwrap().len(),2);
  assert_eq!(s["matches"][0]["columnByte"],4);
  assert_eq!(s["matches"][1]["line"],2);
  assert!(read_selection(&root,".","read-many",&json!({"paths":["a.txt","../b.txt"]})).is_err());
  assert!(read_selection(&root,".","read-many",&json!({"paths":["a.txt","a.txt"]})).is_err());
  fs::write(root.join("large.txt"),vec![b'x';MAX]).unwrap();
  assert!(read_selection(&root,".","read-many",&json!({"paths":["a.txt","large.txt"]})).is_err());
 }

 #[test]fn path_components(){for s in ["..","a\\b","C:","NUL.txt",".git",".env.local","x.","x ","owner-token"]{assert!(!component(s),"{s}");}assert!(component("src"));assert!(component("Cargo.toml"));}
}
