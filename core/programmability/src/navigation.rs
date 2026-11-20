//! Exact local destination grammar shared across native and browser surfaces.
//! @hq:capability vivim.rust-local-navigation@1
//! Navigation is an inert UI selection, never a Host operation or permission.
use serde_json::{json,Value};

const ROUTES:&[(&str,&str)]=&[
    ("open today","today"),("go to today","today"),
    ("open wiki","wiki"),("open the wiki","wiki"),("go to wiki","wiki"),("show wiki","wiki"),
    ("open world","world"),("go to world","world"),("show media library","world"),
    ("open media library","world"),("open my media library","world"),
    ("open build","build"),("go to build","build"),
    ("open talk","talk"),("go to talk","talk"),
    ("open chat","talk"),("go to chat","talk"),
    ("open control","control"),("go to control","control"),
    ("open me","me"),("open my profile","me"),
    ("open pocket","pocket"),("capture a note","pocket"),
    ("open sharing","shares"),("open shares","shares"),
    ("show private shares","shares"),("show my shares","shares"),
    ("share a file","shares"),("open file sharing","shares")
];
pub fn destination(input:&Value)->Value{
    let text=input["text"].as_str().unwrap_or("");
    if text.len()>4096||text.chars().any(|c|c.is_control()&&!c.is_whitespace()){
        return json!({"schema":"vivim.local-destination/1","destination":null,"authority":"none"})
    }
    let normalized=text.split_whitespace()
        .flat_map(|word|word.chars().flat_map(char::to_lowercase).chain(std::iter::once(' ')))
        .collect::<String>();
    let key=normalized.trim_end();
    let tab=ROUTES.iter().find_map(|(phrase,tab)|(*phrase==key).then_some(*tab));
    json!({"schema":"vivim.local-destination/1","destination":tab,"authority":"none"})
}
