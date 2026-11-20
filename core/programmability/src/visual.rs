//! Shared, pure native visual projection admission, independent of renderer and transport.
//! @hq:type vivim.native-ui-view@1
//! @hq:capability vivim.native-visual-validation@1
//! @hq:consumes vivim.ui-render-plan@1
//! @hq:consumes vivim.ui-surface@1
//! Source validation and revision fencing do not confer execution authority.
use serde_json::Value;
use std::collections::{BTreeMap, HashSet};
use sha2::{Digest, Sha256};

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum VisualError { InvalidProjection, Unavailable }

/// WCAG contrast choice, shared by native renderer and future Rust consumers.
pub fn contrast_ink(c:u32)->u32{
    let channel=|shift|{let s=((c>>shift)&255u32) as f32/255.;if s<=0.04045{s/12.92}else{((s+0.055)/1.055).powf(2.4)}};
    if 0.2126*channel(16)+0.7152*channel(8)+0.0722*channel(0)>0.179{0}else{0xffffff}
}
/// Signed chart geometry uses a shared zero axis, including zero-only data.
#[derive(Debug,Clone,PartialEq)]
pub struct ChartBar {pub label:String,pub value:f64,pub zero:f64,pub start:f64,pub extent:f64}
pub fn chart_bars(values:&[(String,f64)])->Result<Vec<ChartBar>,VisualError>{
    if values.len()>16||values.iter().any(|(_,v)|!v.is_finite()||v.abs()>1e9){return Err(VisualError::InvalidProjection)}
    let min=values.iter().fold(0.0_f64,|a,(_,v)|a.min(*v));let max=values.iter().fold(0.0_f64,|a,(_,v)|a.max(*v));
    let range=max-min;let zero=if range==0.{0.5}else{-min/range};
    Ok(values.iter().map(|(label,value)|{let extent=if range==0.{0.}else{value.abs()/range};ChartBar{label:label.clone(),value:*value,zero,start:if *value<0.{zero-extent}else{zero},extent}}).collect())
}

#[derive(Clone, Debug, PartialEq)]
pub struct Visual {
    pub surface_id:String,
    pub revision:u64,
    pub background:u32,
    pub secondary:u32,
    pub accent:u32,
    pub root:Node,
    pub fingerprint:String,
    pub binding_watermarks:BTreeMap<String,(u64,String)>,
}
#[derive(Clone, Debug, PartialEq)]
pub struct Node {
    pub id:String, pub component:String, pub kind:String, pub label:Option<String>,
    pub detail:Option<String>, pub horizontal:bool, pub columns:u64,
    pub background:Option<u32>, pub padding:Option<f32>, pub gap:Option<f32>,
    pub radius:Option<f32>, pub font_size:Option<f32>,pub border:Option<u32>,pub border_width:Option<f32>,
    pub children:Vec<Node>,pub items:Vec<String>,pub bars:Vec<ChartBar>,
}
fn invalid<T>()->Result<T,VisualError>{Err(VisualError::InvalidProjection)}
fn str_at<'a>(v:&'a Value,k:&str)->Result<&'a str,VisualError>{
    v[k].as_str().filter(|s|!s.is_empty()).ok_or(VisualError::InvalidProjection)
}
fn color(v:&Value)->Result<u32,VisualError>{
    let h=v.as_str().and_then(|s|s.strip_prefix('#')).filter(|s|s.len()==6).ok_or(VisualError::InvalidProjection)?;
    u32::from_str_radix(h,16).map_err(|_|VisualError::InvalidProjection)
}
fn optional_color(v:&Value,k:&str)->Result<Option<u32>,VisualError>{
    if v.get(k).is_none(){Ok(None)}else{color(&v[k]).map(Some)}
}
fn number(v:&Value,k:&str,min:u64,max:u64)->Result<Option<f32>,VisualError>{
    if v.get(k).is_none(){return Ok(None)}
    v[k].as_u64().filter(|n|*n>=min&&*n<=max).map(|n|Some(n as f32)).ok_or(VisualError::InvalidProjection)
}
fn live_rows(binding:&str,v:&Value)->Result<Vec<String>,VisualError>{
    if !matches!(binding,"personal.open-tasks"|"personal.completed-tasks"|"personal.recent-notes"|"studio.recent-outcomes"){return invalid()}
    if v.is_null()||v["state"]=="unavailable"{return Ok(vec![format!("Read-only binding: {binding} · source unavailable")])}
    if v["state"]!="source-backed"{return invalid()}
    let revision=v["revision"].as_u64().ok_or(VisualError::InvalidProjection)?;
    let total=v["total"].as_u64().ok_or(VisualError::InvalidProjection)?;
    let rows=v["items"].as_array().filter(|a|a.len()<=16&&a.len() as u64<=total).ok_or(VisualError::InvalidProjection)?;
    let mut output=vec![format!("Read-only binding · source revision {revision} · {total} total · {} shown",rows.len())];
    for row in rows{
        let label=str_at(row,"label")?;let detail=str_at(row,"detail")?;
        if label.chars().count()>100||detail.chars().count()>512||label.chars().any(char::is_control)||detail.chars().any(char::is_control){return invalid()}
        output.push(format!("{label} · {detail}"));
    }
    Ok(output)
}
fn node(source:&Value,plan:&Value,identities:&Value,bindings:&Value,seen:&mut HashSet<String>,depth:usize)->Result<Node,VisualError>{
    let id=str_at(source,"id")?;
    if depth>7||seen.len()>=64||!seen.insert(id.into())||plan["id"]!=id{return invalid()}
    let kind=str_at(source,"type")?;
    if !matches!(kind,"stack"|"grid"|"text"|"card"|"profile-card"|"project-card"|"button"|"collection"|"timeline"|"chart"){return invalid()}
    let component=identities[id].as_str().filter(|s|!s.is_empty()).ok_or(VisualError::InvalidProjection)?;
    let props=&source["props"];
    let source_children=source["children"].as_array().ok_or(VisualError::InvalidProjection)?;
    let plan_children=plan["children"].as_array().ok_or(VisualError::InvalidProjection)?;
    let mut children=Vec::new();
    let mut items=Vec::new();
    let mut values=Vec::new();
    let structured=matches!(kind,"collection"|"timeline"|"chart");
    if structured {
        let rows=props["items"].as_array().ok_or(VisualError::InvalidProjection)?;
        if !source_children.is_empty()||rows.len()!=plan_children.len()||rows.len()>16{return invalid()}
        for(i,row)in rows.iter().enumerate(){
            let label=str_at(row,"label")?;
            if plan_children[i]["id"]!=format!("{id}.item{i}")||plan_children[i]["text"]!=label{return invalid()}
            let detail=if kind=="chart"{let value=row["value"].as_f64().ok_or(VisualError::InvalidProjection)?;values.push((label.to_owned(),value));Some(value.to_string())}
                else{row["detail"].as_str().map(str::to_owned)};
            items.push(match detail{Some(d)=>format!("{label} · {d}"),None=>label.to_owned()});
        }
        if let Some(binding)=source["liveBinding"].as_str(){
            items.extend(live_rows(binding,&bindings[binding])?);
        }
    }else{
        if source_children.len()!=plan_children.len(){return invalid()}
        for(s,p)in source_children.iter().zip(plan_children){children.push(node(s,p,identities,bindings,seen,depth+1)?)}
    }
    let expected=match kind{"text"=>props["value"].as_str(),"button"=>props["label"].as_str(),"card"|"profile-card"|"project-card"|"collection"|"timeline"|"chart"=>props["title"].as_str(),_=>None};
    if expected!=plan["text"].as_str(){return invalid()}
    let columns=plan["layout"]["columns"].as_u64().filter(|n|*n>=1&&*n<=4).ok_or(VisualError::InvalidProjection)?;
    let pres=&source["presentation"];
    let gap=number(pres,"gapPx",0,24)?.or_else(||match props["gap"].as_str(){Some("sm")=>Some(8.),Some("md")=>Some(14.),Some("lg")=>Some(22.),_=>None});
    Ok(Node{id:id.into(),component:component.into(),kind:kind.into(),label:expected.map(str::to_owned),
        detail:props["description"].as_str().map(str::to_owned),horizontal:props["direction"]=="horizontal",
        columns,background:optional_color(pres,"background")?,padding:number(pres,"paddingPx",0,24)?,
        gap,radius:number(pres,"radiusPx",0,24)?,font_size:number(pres,"fontSizePx",13,32)?,
        border:optional_color(pres,"borderColor")?,border_width:number(pres,"borderWidthPx",0,4)?,
        children,items,bars:chart_bars(&values)?})
}
pub fn parse(v:&Value)->Result<Option<Visual>,VisualError>{
    if v["schema"]!="vivim.native-ui-view/1"||v["authority"]!="none"{return invalid()}
    match v["state"].as_str(){Some("absent")=>return Ok(None),Some("unavailable")=>return Err(VisualError::Unavailable),Some("source-backed")=>{},_=>return invalid()}
    let source=&v["source"];let plan=&v["plan"];
    let revision=source["revision"].as_u64().filter(|n|*n<=1_000_000_000).ok_or(VisualError::InvalidProjection)?;
    if source["schema"]!="vivim.ui-surface/1"||source["catalogVersion"]!=1
        ||plan["schema"]!="vivim.ui-render-plan/1"||plan["status"]!="ok"||plan["revision"].as_u64()!=Some(revision)
        ||plan["root"]["id"]!="render_root"||source["tree"]["id"]!="root"{return invalid()}
    let roots=plan["root"]["children"].as_array().filter(|a|a.len()==1).ok_or(VisualError::InvalidProjection)?;
    let mut seen=HashSet::new();
    let root=node(&source["tree"],&roots[0],&v["identities"],&v["liveBindings"],&mut seen,0)?;
    let traces=plan["trace"].as_array().ok_or(VisualError::InvalidProjection)?;
    let mut traced=HashSet::new();
    if traces.len()!=seen.len()||v["identities"].as_object().map(|m|m.len())!=Some(seen.len()){return invalid()}
    for t in traces{
        let id=str_at(t,"id")?;
        if t["sourceId"]!=id||t["outcome"]!="rendered"||!seen.contains(id)||!traced.insert(id){return invalid()}
    }
    // Each live projection has its own revision domain, independent of the
    // committed design. Retain only revision and digest for session fencing.
    let mut binding_watermarks=BTreeMap::new();
    if let Some(bindings)=v["liveBindings"].as_object(){
        for (key, value) in bindings{
            live_rows(key,value)?;
            if value["state"]=="source-backed"{
                let revision=value["revision"].as_u64().ok_or(VisualError::InvalidProjection)?;
                let bytes=serde_json::to_vec(value).map_err(|_|VisualError::InvalidProjection)?;
                binding_watermarks.insert(key.clone(),(revision,format!("{:x}",Sha256::digest(&bytes))));
            }
        }
    }
    let theme=&source["theme"];
    Ok(Some(Visual{surface_id:str_at(source,"surfaceId")?.into(),revision,root,
        background:color(&theme["background"])?,secondary:color(&theme["secondary"])?,accent:color(&theme["accent"])?,
        fingerprint:serde_json::to_string(source).map_err(|_|VisualError::InvalidProjection)?,binding_watermarks}))
}
#[derive(Default)]
pub struct RevisionGuard{ high:Option<(String,u64,String)>, bindings:BTreeMap<String,(u64,String)> }
impl RevisionGuard{
    pub fn accept(&mut self,view:Option<Visual>)->Result<Option<Visual>,VisualError>{
        let Some(view)=view else{return Ok(None)};
        if let Some((id,rev,fp))=&self.high{
            if &view.surface_id!=id||view.revision<*rev||(view.revision==*rev&&&view.fingerprint!=fp){return invalid()}
        }
        for (key,(rev,digest)) in &view.binding_watermarks{
            if let Some((high,previous))=self.bindings.get(key){
                if rev<high||(rev==high&&digest!=previous){return invalid()}
            }
        }
        // Advance only after every domain passes. Unavailability does not erase
        // a high-water mark; a later lower revision is still refused.
        self.bindings.extend(view.binding_watermarks.clone());
        self.high=Some((view.surface_id.clone(),view.revision,view.fingerprint.clone()));Ok(Some(view))
    }
}
#[cfg(test)]
mod tests{
    use super::*;use serde_json::json;
    fn fixture()->Value{json!({"schema":"vivim.native-ui-view/1","state":"source-backed","authority":"none",
       "source":{"schema":"vivim.ui-surface/1","catalogVersion":1,"surfaceId":"my-space","revision":2,"theme":{"background":"#111722","secondary":"#243146","accent":"#78b8f6"},
       "tree":{"id":"root","type":"stack","props":{"direction":"vertical"},"children":[]}},
       "identities":{"root":"vivim.component.stack@1"},
       "plan":{"schema":"vivim.ui-render-plan/1","revision":2,"status":"ok","root":{"id":"render_root","children":[{"id":"root","layout":{"columns":1},"children":[]}]},"trace":[{"id":"root","sourceId":"root","outcome":"rendered"}]}})}
    #[test]fn chart_zero_axis_and_contrast(){
        assert_eq!(contrast_ink(0xffffff),0);assert_eq!(contrast_ink(0),0xffffff);
        let b=chart_bars(&[("negative".into(),-10.),("positive".into(),30.)]).unwrap();
        assert_eq!(b[0].zero,0.25);assert_eq!(b[0].start,0.);assert_eq!(b[1].extent,0.75);
        assert!(chart_bars(&[("invalid".into(),f64::NAN)]).is_err());
    }
    #[test]fn source_plan_trace_match(){let p=parse(&fixture()).unwrap().unwrap();assert_eq!(p.revision,2);assert_eq!(p.root.id,"root");}
    #[test]fn rejects_conflicting_plan(){let mut f=fixture();f["plan"]["revision"]=json!(3);assert!(parse(&f).is_err());}
    #[test]fn rejects_missing_trace(){let mut f=fixture();f["plan"]["trace"]=json!([]);assert!(parse(&f).is_err());}
    #[test]fn revision_guard_retains_high_water(){let mut g=RevisionGuard::default();let v=parse(&fixture()).unwrap().unwrap();g.accept(Some(v.clone())).unwrap();g.accept(None).unwrap();let mut old=v;old.revision=1;assert!(g.accept(Some(old)).is_err());}
    #[test]fn binding_rows_require_source_and_explicit_counts(){
        let row=json!({"state":"source-backed","revision":7,"total":3,"items":[{"label":"Task","detail":"Open · revision 2","sourceRef":"x"}]});
        let rows=live_rows("personal.open-tasks",&row).unwrap();
        assert_eq!(rows.len(),2);assert!(rows[0].contains("3 total"));assert!(rows[1].contains("Task"));
        let mut bad=row.clone();bad["total"]=json!(0);assert!(live_rows("personal.open-tasks",&bad).is_err());
        assert!(live_rows("unknown",&row).is_err());
        assert!(live_rows("personal.open-tasks",&Value::Null).unwrap()[0].contains("unavailable"));
    }
    #[test]fn independent_live_binding_revision_fence(){
        let mut guard=RevisionGuard::default();
        let mut view=parse(&fixture()).unwrap().unwrap();
        view.binding_watermarks.insert("personal.open-tasks".into(),(7,"a".into()));
        guard.accept(Some(view.clone())).unwrap();
        let mut unavailable=view.clone();unavailable.binding_watermarks.clear();
        guard.accept(Some(unavailable)).unwrap();
        let mut rollback=view.clone();rollback.binding_watermarks.insert("personal.open-tasks".into(),(6,"b".into()));
        assert!(guard.accept(Some(rollback)).is_err());
        let mut conflict=view.clone();conflict.binding_watermarks.insert("personal.open-tasks".into(),(7,"b".into()));
        assert!(guard.accept(Some(conflict)).is_err());
        view.binding_watermarks.insert("personal.open-tasks".into(),(8,"c".into()));
        assert!(guard.accept(Some(view)).is_ok());
    }
    #[test]fn no_committed_surface_is_not_a_blank_success(){assert!(parse(&json!({"schema":"vivim.native-ui-view/1","authority":"none","state":"absent"})).unwrap().is_none());}
}
