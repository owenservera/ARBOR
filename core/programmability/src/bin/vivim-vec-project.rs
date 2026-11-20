//! Bounded stdio projection of the already admitted TierFlow Host view.
//! @hq:capability vivim.native-vec-stdio@1
//! @hq:consumes vivim.native-vec-visual-ir@1
//! Never reads files, opens a network listener or executes UI commands.
use std::io::{self,Read,Write};
use serde_json::{Value,json};
const MAX_INPUT:u64=2*1024*1024;
fn unavailable(code:&str)->Value{
    json!({"schema":vivim_programmability_core::vec::SCHEMA,
        "state":"unavailable","authority":"none","code":code,
        "executionAuthorized":false,"effectPerformed":false})
}
fn main()->io::Result<()>{
    let mut bytes=Vec::new();
    io::stdin().lock().take(MAX_INPUT+1).read_to_end(&mut bytes)?;
    let result=if bytes.len() as u64>MAX_INPUT{unavailable("INPUT_TOO_LARGE")}
    else if let Ok(value)=serde_json::from_slice::<Value>(&bytes){
        match vivim_programmability_core::vec::compile_projection(&value){
            Ok(value)=>value,
            Err(vivim_programmability_core::visual::VisualError::Unavailable)=>
                unavailable("HOST_VISUAL_UNAVAILABLE"),
            Err(vivim_programmability_core::visual::VisualError::InvalidProjection)=>
                unavailable("HOST_VISUAL_INVALID"),
        }
    }else{unavailable("INVALID_JSON")};
    let mut out=io::stdout().lock();
    serde_json::to_writer(&mut out,&result).map_err(io::Error::other)?;
    out.write_all(b"\n")
}
