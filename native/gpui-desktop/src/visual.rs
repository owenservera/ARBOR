//! Native projection reader. GPUI is an inert consumer of the canonical
//! TierFlow plan and its validated source; no local visual mutation/compiler.
use crate::{BASE, LIMIT, Endpoint, ReadError, get, owner_token, validate_health};
use reqwest::blocking::Client;
use serde_json::Value;
use std::{collections::HashSet, io::Read,time::Duration};

#[derive(Clone, Debug, PartialEq)]
pub struct Visual {
    pub surface_id:String,
    pub revision:u64,
    pub background:u32,
    pub secondary:u32,
    pub accent:u32,
    pub root:Node,
    pub fingerprint:String,
}
#[derive(Clone, Debug, PartialEq)]
pub struct Node {
    pub id:String, pub component:String, pub kind:String, pub label:Option<String>,
    pub detail:Option<String>, pub horizontal:bool, pub columns:u64,
    pub background:Option<u32>, pub padding:Option<f32>, pub gap:Option<f32>,
    pub radius:Option<f32>, pub font_size:Option<f32>,pub border:Option<u32>,pub border_width:Option<f32>,
    pub children:Vec<Node>,pub items:Vec<String>,
}
fn invalid<T>()->Result<T,ReadError>{Err(ReadError::InvalidProjection)}
fn str_at<'a>(v:&'a Value,k:&str)->Result<&'a str,ReadError>{
    v[k].as_str().filter(|s|!s.is_empty()).ok_or(ReadError::InvalidProjection)
}
fn color(v:&Value)->Result<u32,ReadError>{
    let h=v.as_str().and_then(|s|s.strip_prefix('#')).filter(|s|s.len()==6).ok_or(ReadError::InvalidProjection)?;
    u32::from_str_radix(h,16).map_err(|_|ReadError::InvalidProjection)
}
fn optional_color(v:&Value,k:&str)->Result<Option<u32>,ReadError>{
    if v.get(k).is_none(){Ok(None)}else{color(&v[k]).map(Some)}
}
fn number(v:&Value,k:&str,min:u64,max:u64)->Result<Option<f32>,ReadError>{
    if v.get(k).is_none(){return Ok(None)}
    v[k].as_u64().filter(|n|*n>=min&&*n<=max).map(|n|Some(n as f32)).ok_or(ReadError::InvalidProjection)
}
fn node(source:&Value,plan:&Value,identities:&Value,seen:&mut HashSet<String>,depth:usize)->Result<Node,ReadError>{
    let id=str_at(source,"id")?;
    if depth>7||seen.len()>=64||!seen.insert(id.into())||plan["id"]!=id{return invalid()}
    let kind=str_at(source,"type")?;
    if !matches!(kind,"stack"|"grid"|"text"|"card"|"profile-card"|"project-card"|"button"|"collection"|"timeline"|"chart"){return invalid()}
    let component=identities[id].as_str().filter(|s|!s.is_empty()).ok_or(ReadError::InvalidProjection)?;
    let props=&source["props"];
    let source_children=source["children"].as_array().ok_or(ReadError::InvalidProjection)?;
    let plan_children=plan["children"].as_array().ok_or(ReadError::InvalidProjection)?;
    let mut children=Vec::new();
    let mut items=Vec::new();
    let structured=matches!(kind,"collection"|"timeline"|"chart");
    if structured {
        let rows=props["items"].as_array().ok_or(ReadError::InvalidProjection)?;
        if !source_children.is_empty()||rows.len()!=plan_children.len()||rows.len()>16{return invalid()}
        for(i,row)in rows.iter().enumerate(){
            let label=str_at(row,"label")?;
            if plan_children[i]["id"]!=format!("{id}.item{i}")||plan_children[i]["text"]!=label{return invalid()}
            let detail=if kind=="chart"{row["value"].as_f64().map(|v|v.to_string())}
                else{row["detail"].as_str().map(str::to_owned)};
            items.push(match detail{Some(d)=>format!("{label} · {d}"),None=>label.to_owned()});
        }
        if let Some(binding)=source["liveBinding"].as_str(){
            items.push(format!("Read-only binding: {binding} · live rows not projected by native view"));
        }
    }else{
        if source_children.len()!=plan_children.len(){return invalid()}
        for(s,p)in source_children.iter().zip(plan_children){children.push(node(s,p,identities,seen,depth+1)?)}
    }
    let expected=match kind{"text"=>props["value"].as_str(),"button"=>props["label"].as_str(),"card"|"profile-card"|"project-card"|"collection"|"timeline"|"chart"=>props["title"].as_str(),_=>None};
    if expected!=plan["text"].as_str(){return invalid()}
    let columns=plan["layout"]["columns"].as_u64().filter(|n|*n>=1&&*n<=4).ok_or(ReadError::InvalidProjection)?;
    let pres=&source["presentation"];
    let gap=number(pres,"gapPx",0,24)?.or_else(||match props["gap"].as_str(){Some("sm")=>Some(8.),Some("md")=>Some(14.),Some("lg")=>Some(22.),_=>None});
    Ok(Node{id:id.into(),component:component.into(),kind:kind.into(),label:expected.map(str::to_owned),
        detail:props["description"].as_str().map(str::to_owned),horizontal:props["direction"]=="horizontal",
        columns,background:optional_color(pres,"background")?,padding:number(pres,"paddingPx",0,24)?,
        gap,radius:number(pres,"radiusPx",0,24)?,font_size:number(pres,"fontSizePx",13,32)?,
        border:optional_color(pres,"borderColor")?,border_width:number(pres,"borderWidthPx",0,4)?,
        children,items})
}
pub fn parse(v:&Value)->Result<Option<Visual>,ReadError>{
    if v["schema"]!="vivim.native-ui-view/1"||v["authority"]!="none"{return invalid()}
    match v["state"].as_str(){Some("absent")=>return Ok(None),Some("unavailable")=>return Err(ReadError::Unavailable),Some("source-backed")=>{},_=>return invalid()}
    let source=&v["source"];let plan=&v["plan"];
    let revision=source["revision"].as_u64().filter(|n|*n<=1_000_000_000).ok_or(ReadError::InvalidProjection)?;
    if source["schema"]!="vivim.ui-surface/1"||source["catalogVersion"]!=1
        ||plan["schema"]!="vivim.ui-render-plan/1"||plan["status"]!="ok"||plan["revision"].as_u64()!=Some(revision)
        ||plan["root"]["id"]!="render_root"||source["tree"]["id"]!="root"{return invalid()}
    let roots=plan["root"]["children"].as_array().filter(|a|a.len()==1).ok_or(ReadError::InvalidProjection)?;
    let mut seen=HashSet::new();
    let root=node(&source["tree"],&roots[0],&v["identities"],&mut seen,0)?;
    let traces=plan["trace"].as_array().ok_or(ReadError::InvalidProjection)?;
    let mut traced=HashSet::new();
    if traces.len()!=seen.len()||v["identities"].as_object().map(|m|m.len())!=Some(seen.len()){return invalid()}
    for t in traces{
        let id=str_at(t,"id")?;
        if t["sourceId"]!=id||t["outcome"]!="rendered"||!seen.contains(id)||!traced.insert(id){return invalid()}
    }
    let theme=&source["theme"];
    Ok(Some(Visual{surface_id:str_at(source,"surfaceId")?.into(),revision,root,
        background:color(&theme["background"])?,secondary:color(&theme["secondary"])?,accent:color(&theme["accent"])?,
        fingerprint:serde_json::to_string(source).map_err(|_|ReadError::InvalidProjection)?}))
}
#[derive(Default)]
pub struct RevisionGuard{ high:Option<(String,u64,String)> }
impl RevisionGuard{
    pub fn accept(&mut self,view:Option<Visual>)->Result<Option<Visual>,ReadError>{
        let Some(view)=view else{return Ok(None)};
        if let Some((id,rev,fp))=&self.high{
            if &view.surface_id!=id||view.revision<*rev||(view.revision==*rev&&&view.fingerprint!=fp){return invalid()}
        }
        self.high=Some((view.surface_id.clone(),view.revision,view.fingerprint.clone()));Ok(Some(view))
    }
}
pub fn read()->Result<Option<Visual>,ReadError>{
    let client=Client::builder().no_proxy().redirect(reqwest::redirect::Policy::none()).timeout(Duration::from_secs(8))
        .connect_timeout(Duration::from_secs(2)).build().map_err(|_|ReadError::Unavailable)?;
    validate_health(&get(&client,Endpoint::Health,None)?)?;
    let response=client.get(format!("{BASE}/api/host/control/native-ui-view?viewportPx=1000"))
        .bearer_auth(owner_token()?).send().map_err(|_|ReadError::Offline)?;
    match response.status().as_u16(){200=>{},401|403=>return Err(ReadError::OwnerRequired),_=>return Err(ReadError::Unavailable)}
    let mut bytes=Vec::new();response.take(LIMIT+1).read_to_end(&mut bytes).map_err(|_|ReadError::Unavailable)?;
    if bytes.len() as u64>LIMIT{return invalid()}
    parse(&serde_json::from_slice(&bytes).map_err(|_|ReadError::InvalidProjection)?)
}

#[cfg(test)]
mod tests{
    use super::*;use serde_json::json;
    fn fixture()->Value{json!({"schema":"vivim.native-ui-view/1","state":"source-backed","authority":"none",
       "source":{"schema":"vivim.ui-surface/1","catalogVersion":1,"surfaceId":"my-space","revision":2,"theme":{"background":"#111722","secondary":"#243146","accent":"#78b8f6"},
       "tree":{"id":"root","type":"stack","props":{"direction":"vertical"},"children":[]}},
       "identities":{"root":"vivim.component.stack@1"},
       "plan":{"schema":"vivim.ui-render-plan/1","revision":2,"status":"ok","root":{"id":"render_root","children":[{"id":"root","layout":{"columns":1},"children":[]}]},"trace":[{"id":"root","sourceId":"root","outcome":"rendered"}]}})}
    #[test]fn source_plan_trace_match(){let p=parse(&fixture()).unwrap().unwrap();assert_eq!(p.revision,2);assert_eq!(p.root.id,"root");}
    #[test]fn rejects_conflicting_plan(){let mut f=fixture();f["plan"]["revision"]=json!(3);assert!(parse(&f).is_err());}
    #[test]fn rejects_missing_trace(){let mut f=fixture();f["plan"]["trace"]=json!([]);assert!(parse(&f).is_err());}
    #[test]fn revision_guard_retains_high_water(){let mut g=RevisionGuard::default();let v=parse(&fixture()).unwrap().unwrap();g.accept(Some(v.clone())).unwrap();g.accept(None).unwrap();let mut old=v;old.revision=1;assert!(g.accept(Some(old)).is_err());}
    #[test]fn no_committed_surface_is_not_a_blank_success(){assert!(parse(&json!({"schema":"vivim.native-ui-view/1","authority":"none","state":"absent"})).unwrap().is_none());}
}
