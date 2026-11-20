//! Deterministic source-byte SHA-256 over exactly UTF-8 input.
//! @hq:capability vivim.rust-source-digest@1
//! A digest is an identity check, not authenticity, provenance or a Host grant.
use serde_json::{json,Value};
use sha2::{Digest,Sha256};

pub fn digest_utf8(input:&Value)->Value{
    let Some(text)=input["text"].as_str()else{
        return json!({"schema":"vivim.sha256-utf8/1","outcome":"refused",
            "code":"INVALID_TEXT","authority":"none"})
    };
    if text.len()>256*1024{
        return json!({"schema":"vivim.sha256-utf8/1","outcome":"refused",
            "code":"INPUT_TOO_LARGE","authority":"none"})
    }
    json!({"schema":"vivim.sha256-utf8/1","outcome":"computed",
        "digest":format!("{:x}",Sha256::digest(text.as_bytes())),
        "authority":"none"})
}
