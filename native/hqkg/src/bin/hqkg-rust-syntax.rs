//! Read bounded Rust source from stdin; emit inert AST observations to stdout.
use std::io::{self,Read};
fn main() {
    let result = (|| -> hqkg::Result<serde_json::Value> {
        if std::env::args_os().len()!=1 {
            return Err(hqkg::Error::Invalid("usage: hqkg-rust-syntax < source.rs".into()));
        }
        let mut source=String::new();
        io::stdin().lock().take(hqkg::rust_syntax::MAX_SOURCE_BYTES as u64+1).read_to_string(&mut source)?;
        hqkg::rust_syntax::extract(&source)
    })();
    match result {
        Ok(value)=>println!("{value}"),
        Err(e)=>{eprintln!("hqkg-rust-syntax: {e}");std::process::exit(2);}
    }
}
