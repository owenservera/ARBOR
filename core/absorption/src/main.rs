use std::{io::{self, Read}, path::Path};
use serde_json::{Value, json};
use vivim_absorption::{discovery::Scope, store::Inbox};
const LIMIT: usize = 4 * 1024 * 1024;
fn run() -> Result<Value, &'static str> {
    let args: Vec<_> = std::env::args().skip(1).collect();
    if args.len() != 2 { return Err("USAGE_INTAKE_OR_READ_STORE"); }
    let store = Inbox::open(Path::new(&args[1]))?;
    let mut input = Vec::new();
    io::stdin().take((LIMIT + 1) as u64).read_to_end(&mut input).map_err(|_| "INPUT_FAILED")?;
    if input.len() > LIMIT { return Err("SIZE_LIMIT"); }
    if args[0] == "uia-facebook" {
        return store.ingest_facebook_uia(&input,&Scope{site_id:"facebook".into(),origin:"https://www.facebook.com".into()});
    }
    let v: Value = serde_json::from_slice(&input).map_err(|_| "INPUT_INVALID")?;
    match args[0].as_str() {
        "intake" => {
            let scope: Scope = serde_json::from_value(v.get("scope").cloned().ok_or("SCOPE_REQUIRED")?)
                .map_err(|_| "SCOPE_INVALID")?;
            let projection = serde_json::to_vec(v.get("projection").ok_or("PROJECTION_REQUIRED")?).map_err(|_| "INPUT_INVALID")?;
            store.ingest(&projection, &scope)
        },
        "read" => store.read(v.get("id").and_then(Value::as_str).ok_or("ID_REQUIRED")?),
        _ => Err("UNKNOWN_OPERATION"),
    }
}
fn main() {
    match run() {
        Ok(v) => println!("{}", v),
        Err(code) => { println!("{}", json!({"status":"rejected","code":code})); std::process::exit(1); }
    }
}
