//! Exact committed-Wiki semantic target lookup. Port of the pure
//! resolveSemanticWikiTarget algorithm, not a Wiki writer or inferred linker.
//! @hq:capability vivim.rust-wiki-target@1
use serde_json::{Value,json};

fn segment(s:&str)->bool{
    let b=s.as_bytes();
    !b.is_empty()&&b.len()<=79&&b[0].is_ascii_alphanumeric()&&
    b[1..].iter().all(|x|x.is_ascii_alphanumeric()||*x==b'_'||*x==b'-')
}
pub fn resolve(input:&Value)->Value{
    let wiki=&input["wiki"];
    let intent=&input["intent"];
    if intent["outcome"]!="candidate"||intent["candidate"]["actionId"]!="wiki.section.edit"{
        return Value::Null
    }
    let Some(target)=intent["candidate"]["args"]["target"].as_str()else{
        return Value::Null
    };
    let parts:Vec<_>=target.split('/').collect();
    if parts.len()!=2||!segment(parts[0])||!segment(parts[1]){return Value::Null}
    let Some(pages)=wiki["pages"].as_object()else{return Value::Null};
    let matched:Vec<_>=pages.keys().filter(|name|name.to_lowercase()==parts[0].to_lowercase()).collect();
    if matched.len()!=1{return Value::Null}
    let page=matched[0];
    let Some(sections)=pages[page]["sections"].as_object()else{return Value::Null};
    let matched:Vec<_>=sections.keys().filter(|name|name.to_lowercase()==parts[1].to_lowercase()).collect();
    if matched.len()!=1{return Value::Null}
    let section=matched[0];
    if !sections[section].is_string(){return Value::Null}
    json!({"page":page,"section":section})
}
