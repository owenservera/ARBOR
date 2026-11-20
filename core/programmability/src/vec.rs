//! Pure VEC visual IR: explicit rendering semantics over the Host-admitted
//! TierFlow read model. No Host actions, grants, external data, UI mutation.
//! @hq:capability vivim.native-vec-visual-ir@1
//! @hq:consumes vivim.native-visual-validation@1
//! @hq:consumes vivim.ui-render-plan@1
use crate::visual::{self, Visual, Node, VisualError};
use serde::Serialize;
use serde_json::{Value,json};
use std::collections::BTreeSet;
pub const SCHEMA:&str="vivim.vec-visual-ir/1";
#[derive(Clone,Debug,Serialize,PartialEq)]
#[serde(rename_all="camelCase")]
pub struct Style{
    pub background:Option<String>,pub foreground:Option<String>,
    pub border_color:Option<String>,pub border_width_px:f32,
    pub padding_px:f32,pub gap_px:f32,
    pub radius_px:Option<f32>,pub font_size_px:Option<f32>,
}
#[derive(Clone,Debug,Serialize,PartialEq)]
#[serde(rename_all="camelCase")]
pub struct Bar{
    pub label:String,pub value:f64,pub zero:f64,pub start:f64,pub extent:f64,
}
#[derive(Clone,Debug,Serialize,PartialEq)]
#[serde(rename_all="camelCase")]
pub struct Element{
    pub id:String,pub component_id:String,pub kind:String,
    pub role:&'static str,pub layout:&'static str,pub columns:u8,
    pub label:Option<String>,pub detail:Option<String>,
    pub style:Style,pub items:Vec<String>,pub bars:Vec<Bar>,
    pub children:Vec<Element>,
    /// A button is a display-only preview here, not an executable action.
    pub preview_only:bool,
}
#[derive(Clone,Debug,Serialize,PartialEq)]
#[serde(rename_all="camelCase")]
pub struct View{
    pub schema:&'static str,pub state:&'static str,pub authority:&'static str,
    pub surface_id:String,pub revision:u64,
    pub background:String,pub foreground:String,
    pub secondary:String,pub accent:String,
    pub root:Element,pub node_count:usize,pub chart_count:usize,
    pub preview_action_ids:Vec<String>,pub live_binding_ids:Vec<String>,
    pub execution_authorized:bool,pub effect_performed:bool,
}
fn hex(n:u32)->String{format!("#{n:06x}")}
fn scalar(v:f32)->bool{v.is_finite()&&v>=0.&&v<=128.}
fn element(node:&Node,view:&Visual,seen:&mut BTreeSet<String>,
           actions:&mut Vec<String>,charts:&mut usize,depth:usize)->Result<Element,VisualError>{
    if depth>7||seen.len()>=64||node.children.len()>24||node.columns==0||node.columns>4
       ||!seen.insert(node.id.clone()){return Err(VisualError::InvalidProjection)}
    let role=match node.kind.as_str(){
        "stack"|"grid"=>"layout","text"=>"text",
        "card"|"profile-card"|"project-card"=>"group",
        "button"=>"preview-action","collection"|"timeline"=>"list",
        "chart"=>"chart",_=>return Err(VisualError::InvalidProjection),
    };
    let card=matches!(node.kind.as_str(),"card"|"profile-card"|"project-card");
    let bg=node.background.or(if card{Some(view.secondary)}else{None});
    let padding=node.padding.unwrap_or(if card{12.}else{2.});
    let gap=node.gap.unwrap_or(8.);
    let border_width=node.border_width.unwrap_or(if node.border.is_some(){1.}else{0.});
    if !scalar(padding)||!scalar(gap)||!scalar(border_width)
        ||node.radius.is_some_and(|x|!scalar(x))
        ||node.font_size.is_some_and(|x|!scalar(x)){return Err(VisualError::InvalidProjection)}
    let style=Style{
        background:bg.map(hex),foreground:bg.map(|x|hex(visual::contrast_ink(x))),
        border_color:if border_width>0.{Some(hex(node.border.unwrap_or(view.accent)))}else{None},
        border_width_px:border_width,padding_px:padding,gap_px:gap,
        radius_px:node.radius,font_size_px:node.font_size,
    };
    let layout=if node.kind=="grid"{"grid"}else if node.horizontal{"row"}
        else if node.children.is_empty(){"intrinsic"}else{"column"};
    let preview_only=node.kind=="button";
    if preview_only{
        if node.label.as_deref().unwrap_or("").is_empty(){
            return Err(VisualError::InvalidProjection)
        }
        actions.push(node.id.clone());
    }
    if node.kind=="chart"{*charts+=1;}
    let bars=node.bars.iter().map(|b|Bar{
        label:b.label.clone(),value:b.value,zero:b.zero,start:b.start,extent:b.extent
    }).collect();
    let mut children=Vec::with_capacity(node.children.len());
    for child in &node.children{
        children.push(element(child,view,seen,actions,charts,depth+1)?);
    }
    Ok(Element{id:node.id.clone(),component_id:node.component.clone(),
        kind:node.kind.clone(),role,layout,columns:node.columns as u8,
        label:node.label.clone(),detail:node.detail.clone(),
        style,items:node.items.clone(),bars,children,preview_only})
}
pub fn compile(view:&Visual)->Result<View,VisualError>{
    let mut seen=BTreeSet::new();let mut actions=Vec::new();let mut charts=0;
    let root=element(&view.root,view,&mut seen,&mut actions,&mut charts,0)?;
    Ok(View{schema:SCHEMA,state:"compiled",authority:"none",
        surface_id:view.surface_id.clone(),revision:view.revision,
        background:hex(view.background),foreground:hex(visual::contrast_ink(view.background)),
        secondary:hex(view.secondary),accent:hex(view.accent),
        root,node_count:seen.len(),chart_count:charts,preview_action_ids:actions,
        live_binding_ids:view.binding_watermarks.keys().cloned().collect(),
        execution_authorized:false,effect_performed:false})
}
/// Strict JSON entry point. The original Host UI revision and TierFlow plan
/// must first pass the existing native visual admission logic.
pub fn compile_projection(projection:&Value)->Result<Value,VisualError>{
    match visual::parse(projection)?{
        Some(view)=>serde_json::to_value(compile(&view)?)
            .map_err(|_|VisualError::InvalidProjection),
        None=>Ok(json!({"schema":SCHEMA,"state":"absent","authority":"none",
            "executionAuthorized":false,"effectPerformed":false})),
    }
}
