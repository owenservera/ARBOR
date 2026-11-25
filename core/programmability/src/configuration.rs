//! Declarative, pure configuration metadata; never confers runtime authority.
use serde::Deserialize;
use std::collections::{BTreeMap,BTreeSet};
const SOURCE:&str=include_str!("configuration.v1.json");
#[derive(Clone,Debug,Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Descriptor{
 pub id:String,pub label:String,pub category:String,pub domain:String,pub scope:String,
 pub kind:String,#[serde(rename="default")]pub default_value:String,pub options:Vec<String>,
 pub status:String,pub apply:String,pub description:String,
}
#[derive(Debug,Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Registry{pub schema:String,pub settings:Vec<Descriptor>}
impl Descriptor{
 pub fn accepts(&self,v:&str)->bool{self.kind=="choice"&&self.options.iter().any(|x|x==v)}
 pub fn local_menu(&self)->bool{self.status=="local-menu"}
}
impl Registry{
 pub fn embedded()->Result<Self,String>{Self::parse(SOURCE)}
 pub fn parse(source:&str)->Result<Self,String>{
  let r:Self=serde_json::from_str(source).map_err(|_|"INVALID_REGISTRY")?;
  if r.schema!="vivim.configuration-registry/1"||r.settings.len()>4096{return Err("INVALID_REGISTRY".into());}
  let mut ids=BTreeSet::new();
  for d in &r.settings{
   if d.id.is_empty()||d.id.len()>128||!d.id.bytes().all(|c|c.is_ascii_lowercase()||c.is_ascii_digit()||matches!(c,b'.'|b'-'|b'_'))
    ||!ids.insert(&d.id)||d.label.is_empty()||d.domain.is_empty()||d.category.is_empty()
    ||!matches!(d.scope.as_str(),"device"|"owner"|"workspace"|"session")
    ||!matches!(d.status.as_str(),"local-menu"|"pending")
    ||!matches!(d.apply.as_str(),"immediate"|"restart"|"next-launch"|"approval")
    ||!d.accepts(&d.default_value)||d.options.iter().collect::<BTreeSet<_>>().len()!=d.options.len()
    ||(d.local_menu()&&(!d.id.starts_with("ui.menu.bar-")||d.id=="ui.menu.bar-settings"||d.scope!="device"||d.default_value!="visible"||d.options.len()!=2||!d.accepts("hidden")))
   {return Err("INVALID_DESCRIPTOR".into());}
  }
  Ok(r)
 }
 pub fn get(&self,id:&str)->Option<&Descriptor>{self.settings.iter().find(|d|d.id==id)}
 pub fn effective_local<'a>(&'a self,id:&str,values:&'a BTreeMap<String,String>)->Option<&'a str>{
  let d=self.get(id)?;if !d.local_menu(){return None;}
  Some(values.get(id).filter(|v|d.accepts(v)).map(String::as_str).unwrap_or(&d.default_value))
 }
 pub fn validate_local(&self,values:&BTreeMap<String,String>)->bool{
  values.iter().all(|(id,v)|self.get(id).is_some_and(|d|d.local_menu()&&d.accepts(v)))
 }
 pub fn set_local(&self,values:&mut BTreeMap<String,String>,id:&str,value:&str)->Result<(),String>{
  let d=self.get(id).ok_or("UNKNOWN_SETTING")?;
  if !d.local_menu(){return Err("NO_LOCAL_ADAPTER".into());}
  if !d.accepts(value){return Err("INVALID_VALUE".into());}
  if d.default_value==value{values.remove(id);}else{values.insert(id.into(),value.into());}
  Ok(())
 }
}
#[cfg(test)]
mod tests{
 use super::*;
 use serde_json::Value;
 #[test]fn local_and_pending_are_distinct(){
  let r=Registry::embedded().unwrap();let mut v=BTreeMap::new();
  assert!(r.get("ui.menu.bar-settings").is_none());
  assert_eq!(r.effective_local("ui.menu.bar-developer",&v),Some("visible"));
  r.set_local(&mut v,"ui.menu.bar-developer","hidden").unwrap();
  assert_eq!(r.effective_local("ui.menu.bar-developer",&v),Some("hidden"));
  assert!(r.validate_local(&v));
  assert!(r.set_local(&mut v,"ui.menu.bar-developer","enabled").is_err());
  assert!(r.set_local(&mut v,"runtime.studio.chrome.window","headless").is_err());
  assert!(r.effective_local("runtime.studio.chrome.window",&v).is_none());
  r.set_local(&mut v,"ui.menu.bar-developer","visible").unwrap();assert!(v.is_empty());
 }
 #[test]fn invalid_descriptors_rejected(){
  let mut v:Value=serde_json::from_str(SOURCE).unwrap();
  let first=v["settings"][0].clone();v["settings"].as_array_mut().unwrap().push(first);
  assert!(Registry::parse(&v.to_string()).is_err());
  let mut v:Value=serde_json::from_str(SOURCE).unwrap();
  v["settings"][0]["id"]=Value::String("ui.menu.bar-settings".into());
  assert!(Registry::parse(&v.to_string()).is_err());
 }
}
