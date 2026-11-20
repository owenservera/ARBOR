//! Pure VEC typed value normalization, ported from
//! packages/vec-ui-engines/src/validators.mjs.
//! @hq:capability vivim.rust-ui-value@1
//! Values remain inert; renderer support and Host approvals are separate.
use serde_json::{Value,json};
const BAD:[&str;3]=["__proto__","prototype","constructor"];
fn obj<'a>(v:&'a Value,allowed:&[&str])->Option<&'a serde_json::Map<String,Value>>{
    let o=v.as_object()?;
    if o.keys().all(|k|allowed.contains(&k.as_str())){Some(o)}else{None}
}
fn number(v:&Value,min:f64,max:f64)->bool{
    v.as_f64().is_some_and(|n|n.is_finite()&&n>=min&&n<=max)
}
fn integer(v:&Value,min:f64,max:f64)->bool{
    v.as_f64().is_some_and(|n|n.is_finite()&&n.fract()==0.&&n>=min&&n<=max&&
        n.abs()<=9_007_199_254_740_991.)
}
fn check_inert(value:&Value,depth:usize,visited:&mut usize)->bool{
    *visited+=1;
    if *visited>512||depth>12{return false}
    match value{
        Value::Null|Value::Bool(_)=>true,
        Value::String(s)=>s.encode_utf16().count()<=1024&&
            !s.chars().any(|c|c=='\u{7f}'||c<='\u{1f}'),
        Value::Number(n)=>n.as_f64().is_some_and(f64::is_finite),
        Value::Array(a)=>a.len()<=128&&a.iter().all(|v|check_inert(v,depth+1,visited)),
        Value::Object(o)=>o.len()<=256&&o.keys().all(|k|!BAD.contains(&k.as_str()))&&
            o.values().all(|v|check_inert(v,depth+1,visited))
    }
}
fn color(v:&Value)->Option<Value>{
    if let Some(s)=v.as_str(){
        let b=s.as_bytes();
        if (b.len()==7||b.len()==9)&&b[0]==b'#'&&
            b[1..].iter().all(u8::is_ascii_hexdigit){
            return Some(json!(s.to_ascii_lowercase()))
        }
        return None
    }
    let o=obj(v,&["colorSpace","components","alpha"])?;
    let space=o.get("colorSpace")?.as_str()?;
    if !matches!(space,"srgb"|"display-p3"|"oklch"){return None}
    let components=o.get("components")?.as_array()?;
    if components.len()!=3||!components.iter().enumerate().all(|(i,x)|
        if space=="oklch"{number(x,0.,if i==0{1.}else if i==1{0.4}else{360.})}
        else{number(x,0.,1.)}){return None}
    if let Some(alpha)=o.get("alpha"){if !number(alpha,0.,1.){return None}}
    let mut result=json!({"colorSpace":space,"components":components});
    if let Some(alpha)=o.get("alpha"){result["alpha"]=alpha.clone()}
    Some(result)
}
fn length(v:&Value)->Option<Value>{
    let o=obj(v,&["value","unit"])?;
    if !number(o.get("value")?,-4096.,4096.)||
        !matches!(o.get("unit")?.as_str()?,
            "px"|"rem"|"em"|"%"|"vw"|"vh"){return None}
    Some(json!({"value":o.get("value")?,"unit":o.get("unit")?}))
}
fn vector(v:&Value,n:usize)->Option<Value>{
    let names=if n==2{&["x","y"][..]}else{&["x","y","z"][..]};
    let o=obj(v,names)?;
    if o.len()!=n||!names.iter().all(|k|o.get(*k).is_some_and(|x|number(x,-1e6,1e6))){
        return None
    }
    Some(v.clone())
}
fn path_id(s:&str)->bool{
    let parts:Vec<_>=s.split('.').collect();
    !parts.is_empty()&&parts.len()<=16&&parts.iter().all(|part|{
        let b=part.as_bytes();
        !b.is_empty()&&b[0].is_ascii_lowercase()&&
        b[1..].iter().all(|x|x.is_ascii_lowercase()||x.is_ascii_digit()||
            *x==b'_'||*x==b'-')
    })
}
fn good_value(ty:&str,v:&Value,choices:Option<&Value>)->Result<Value,&'static str>{
    match ty{
        "color"=>color(v).ok_or("INVALID_COLOR"),
        "color-alpha"=>{
            let o=obj(v,&["color","alpha"]).ok_or("INVALID_COLOR_ALPHA")?;
            let c=color(o.get("color").ok_or("INVALID_COLOR_ALPHA")?)
                .ok_or("INVALID_COLOR_ALPHA")?;
            let a=o.get("alpha").ok_or("INVALID_COLOR_ALPHA")?;
            if !number(a,0.,1.){return Err("INVALID_COLOR_ALPHA")}
            Ok(json!({"color":c,"alpha":a}))
        }
        "boolean"=>if v.is_boolean(){Ok(v.clone())}else{Err("INVALID_BOOLEAN")},
        "number"=>if number(v,-1e9,1e9){Ok(v.clone())}else{Err("INVALID_NUMBER")},
        "integer"=>if integer(v,-1e6,1e6){Ok(v.clone())}else{Err("INVALID_NUMBER")},
        "duration"=>if integer(v,0.,600000.){Ok(v.clone())}else{Err("INVALID_NUMBER")},
        "length"=>length(v).ok_or("INVALID_LENGTH"),
        "vector2"=>vector(v,2).ok_or("INVALID_VECTOR"),
        "vector3"=>vector(v,3).ok_or("INVALID_VECTOR"),
        "range"=>{
            let o=obj(v,&["min","max","value","step"]).ok_or("INVALID_RANGE")?;
            let lo=o.get("min").ok_or("INVALID_RANGE")?;
            let hi=o.get("max").ok_or("INVALID_RANGE")?;
            let value=o.get("value").ok_or("INVALID_RANGE")?;
            if !number(lo,-1e9,1e9)||!number(hi,-1e9,1e9)||
                hi.as_f64()<=lo.as_f64()||
                !number(value,lo.as_f64().unwrap(),hi.as_f64().unwrap()){
                return Err("INVALID_RANGE")
            }
            if let Some(step)=o.get("step"){
                if !number(step,f64::EPSILON,hi.as_f64().unwrap()-lo.as_f64().unwrap()){
                    return Err("INVALID_RANGE")
                }
            }
            Ok(v.clone())
        }
        "token"|"ref"=>v.as_str().filter(|x|path_id(x))
            .map(|_|v.clone()).ok_or("INVALID_REFERENCE"),
        "enum"=>{
            let options=choices.and_then(Value::as_array).ok_or("ENUM_NOT_CLOSED_OR_VALUE_INVALID")?;
            if options.is_empty()||options.len()>64||
                !options.iter().all(|x|x.as_str().is_some_and(|s|
                    !s.is_empty()&&s.encode_utf16().count()<=80))||
                !options.contains(v)||!v.is_string(){
                return Err("ENUM_NOT_CLOSED_OR_VALUE_INVALID")
            }
            Ok(v.clone())
        }
        "gradient"=>{
            let o=obj(v,&["kind","angle","stops"]).ok_or("INVALID_GRADIENT")?;
            let kind=o.get("kind").and_then(Value::as_str).ok_or("INVALID_GRADIENT")?;
            if !matches!(kind,"linear"|"radial"){return Err("INVALID_GRADIENT")}
            if o.get("angle").is_some_and(|a|!number(a,-360.,360.)){
                return Err("INVALID_GRADIENT")
            }
            let stops=o.get("stops").and_then(Value::as_array).ok_or("INVALID_GRADIENT")?;
            if stops.len()<2||stops.len()>16{return Err("INVALID_GRADIENT")}
            let mut previous=-1.;let mut out=Vec::new();
            for stop in stops{
                let s=obj(stop,&["at","color"]).ok_or("INVALID_GRADIENT")?;
                let at=s.get("at").ok_or("INVALID_GRADIENT")?;
                if !number(at,0.,1.)||at.as_f64().unwrap()<previous{return Err("INVALID_GRADIENT")}
                let c=color(s.get("color").ok_or("INVALID_GRADIENT")?)
                    .ok_or("INVALID_GRADIENT")?;
                previous=at.as_f64().unwrap();
                out.push(json!({"at":at,"color":c}));
            }
            let mut result=json!({"kind":kind,"stops":out});
            if let Some(angle)=o.get("angle"){result["angle"]=angle.clone()}
            Ok(result)
        }
        "shadow"=>{
            let o=obj(v,&["color","offsetX","offsetY","blur","spread","inset"])
                .ok_or("INVALID_SHADOW")?;
            if o.get("inset").is_some_and(|x|!x.is_boolean()){return Err("INVALID_SHADOW")}
            let col=color(o.get("color").ok_or("INVALID_SHADOW")?)
                .ok_or("INVALID_SHADOW")?;
            let x=length(o.get("offsetX").ok_or("INVALID_SHADOW")?)
                .ok_or("INVALID_SHADOW")?;
            let y=length(o.get("offsetY").ok_or("INVALID_SHADOW")?)
                .ok_or("INVALID_SHADOW")?;
            let blur=length(o.get("blur").ok_or("INVALID_SHADOW")?)
                .ok_or("INVALID_SHADOW")?;
            let spread=length(o.get("spread").ok_or("INVALID_SHADOW")?)
                .ok_or("INVALID_SHADOW")?;
            if blur["value"].as_f64().is_none_or(|n|n<0.){return Err("INVALID_SHADOW")}
            Ok(json!({"color":col,"offsetX":x,"offsetY":y,"blur":blur,"spread":spread,
                "inset":o.get("inset").and_then(Value::as_bool).unwrap_or(false)}))
        }
        "transform"=>{
            let o=obj(v,&["translate","rotate","scale"]).ok_or("INVALID_TRANSFORM")?;
            let tr=o.get("translate").map(|v|vector(v,3))
                .unwrap_or_else(||Some(json!({"x":0,"y":0,"z":0})))
                .ok_or("INVALID_TRANSFORM")?;
            let rot=o.get("rotate").map(|v|vector(v,3))
                .unwrap_or_else(||Some(json!({"x":0,"y":0,"z":0})))
                .ok_or("INVALID_TRANSFORM")?;
            let sc=o.get("scale").map(|v|vector(v,3))
                .unwrap_or_else(||Some(json!({"x":1,"y":1,"z":1})))
                .ok_or("INVALID_TRANSFORM")?;
            if ["x","y","z"].iter().any(|k|sc[*k].as_f64()
                .is_none_or(|n|n<=0.||n>100.)){return Err("INVALID_TRANSFORM")}
            Ok(json!({"translate":tr,"rotate":rot,"scale":sc}))
        }
        "map"=>{
            let Some(o)=v.as_object()else{return Err("INVALID_MAP")};
            if o.len()>64||serde_json::to_string(v).is_err_or(|s|s.encode_utf16().count()>8192){
                return Err("INVALID_MAP")
            }
            Ok(v.clone())
        }
        _=>Err("TYPE_UNSUPPORTED")
    }
}
pub fn validate(input:&Value)->Value{
    let ty=input["type"].as_str().unwrap_or("");
    if !matches!(ty,"color"|"color-alpha"|"gradient"|"shadow"|"length"|
        "number"|"integer"|"duration"|"vector2"|"vector3"|"transform"|
        "range"|"boolean"|"enum"|"token"|"ref"|"map"){
        return json!({"ok":false,"code":"UNKNOWN_VALUE_TYPE"})
    }
    let Some(value)=input.get("value")else{
        return json!({"ok":false,"code":"NON_INERT_VALUE"})
    };
    let mut seen=0;
    if !check_inert(value,0,&mut seen){
        return json!({"ok":false,"code":"NON_INERT_VALUE"})
    }
    match good_value(ty,value,input.get("choices")){
        Ok(value)=>json!({"ok":true,"value":value}),
        Err(code)=>json!({"ok":false,"code":code})
    }
}
