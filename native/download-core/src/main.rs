use anyhow::{Context, Result, ensure};
use std::path::PathBuf;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use vivim_download_core::{Command, Manager, Reply, Request, SCHEMA};

#[tokio::main]
async fn main() -> Result<()> {
    let mut args = std::env::args_os().skip(1);
    let root = PathBuf::from(args.next().context("usage: vivim-download-core ABSOLUTE_ROOT")?);
    ensure!(root.is_absolute() && args.next().is_none(), "absolute root required");
    let manager = Manager::open(&root, false).await?;
    let mut lines = BufReader::new(tokio::io::stdin()).lines();
    let mut out = tokio::io::stdout();
    while let Some(line) = lines.next_line().await? {
        let request: Request = match serde_json::from_str(&line) {
            Ok(r) => r,
            Err(_) => continue,
        };
        if request.id.len() > 128 || request.id.is_empty() { continue; }
        let shutdown = matches!(&request.command, Command::Shutdown);
        let result = if shutdown {
            manager.stop().await;
            Ok(serde_json::json!({"stopped":true}))
        } else {
            manager.execute(request.command).await
        };
        let reply = match result {
            Ok(value) => Reply { schema:SCHEMA, id:request.id, ok:true, result:Some(value), error:None },
            Err(_) => Reply { schema:SCHEMA, id:request.id, ok:false, result:None, error:Some("DOWNLOAD_OPERATION_FAILED") },
        };
        out.write_all(&serde_json::to_vec(&reply)?).await?;
        out.write_all(b"\n").await?;
        out.flush().await?;
        if shutdown { return Ok(()); }
    }
    manager.stop().await;
    Ok(())
}
