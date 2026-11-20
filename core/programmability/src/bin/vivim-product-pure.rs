//! Shared Rust kernel transport: bounded one-shot (legacy) and persistent NDJSON.
//! @hq:capability vivim.product-kernel-transport@1
//! Both modes execute inert pure computations, no Host authority.
use std::io::{self,BufRead,Read,Write};
use serde_json::Value;
use vivim_programmability_core::product_kernel::{
    dispatch_json,refuse,MAX_WIRE_BYTES
};
const MAX_FRAME:usize=MAX_WIRE_BYTES+256;
fn write_response<W:Write>(out:&mut W,response:&str)->io::Result<()>{
    out.write_all(response.as_bytes())?;
    out.write_all(b"\n")?;
    out.flush()
}
fn frame<R:BufRead>(reader:&mut R)->io::Result<Option<Vec<u8>>>{
    let mut data=Vec::new();
    loop{
        let chunk=reader.fill_buf()?;
        if chunk.is_empty(){
            return if data.is_empty(){Ok(None)}
            else{Err(io::Error::new(io::ErrorKind::UnexpectedEof,"incomplete kernel frame"))}
        }
        let line_end=chunk.iter().position(|b|*b==b'\n');
        let len=line_end.map(|n|n+1).unwrap_or(chunk.len());
        let too_large=data.len().saturating_add(len)>MAX_FRAME;
        if !too_large{data.extend_from_slice(&chunk[..len]);}
        reader.consume(len);
        if too_large{
            return Err(io::Error::new(io::ErrorKind::InvalidData,"kernel frame too large"))
        }
        if line_end.is_some(){return Ok(Some(data))}
    }
}
fn serve()->io::Result<()>{
    let stdin=io::stdin();let mut reader=stdin.lock();
    let stdout=io::stdout();let mut writer=stdout.lock();
    while let Some(bytes)=frame(&mut reader)?{
        let response=match serde_json::from_slice::<Value>(&bytes){
            Ok(request)=>{
                let id=request["requestId"].as_str().unwrap_or("");
                let valid=!id.is_empty()&&id.len()<=64&&id.bytes().all(|b|
                    b.is_ascii_alphanumeric()||b==b'_'||b==b'-');
                if !valid{
                    refuse("","INVALID_REQUEST_ID").to_string()
                }else{
                    let mut result=serde_json::from_str::<Value>(&dispatch_json(
                        std::str::from_utf8(&bytes).unwrap_or("")
                    )).unwrap_or_else(|_|refuse("","INVALID_JSON"));
                    result["requestId"]=Value::String(id.to_owned());
                    let encoded=result.to_string();
                    if encoded.len()>MAX_FRAME{
                        let mut fallback=refuse("","NATIVE_RESULT_TOO_LARGE");
                        fallback["requestId"]=Value::String(id.to_owned());
                        fallback.to_string()
                    }else{encoded}
                }
            }
            Err(_)=>refuse("","INVALID_JSON").to_string()
        };
        write_response(&mut writer,&response)?;
    }
    Ok(())
}
fn main()->io::Result<()>{
    if std::env::args().nth(1).as_deref()==Some("--serve"){return serve()}
    let mut data=Vec::new();
    io::stdin().lock().take((MAX_WIRE_BYTES+1)as u64).read_to_end(&mut data)?;
    let result=if data.len()>MAX_WIRE_BYTES{refuse("","INPUT_TOO_LARGE").to_string()}
    else{
        match std::str::from_utf8(&data){
            Ok(raw)=>dispatch_json(raw),
            Err(_)=>refuse("","INVALID_JSON").to_string()
        }
    };
    write_response(&mut io::stdout().lock(),&result)
}
