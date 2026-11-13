//! Read-only chat context projection from the **existing** HQKG journal.
 // No graph writes, browser calls, provider sends, authorization decisions, or second engine.
use hqkg::context_retrieval::{retrieve, ContextRequest};
use hqkg::{Error, Journal, Result};
use serde_json::{json, Value};
use std::collections::BTreeSet;
use std::fs;
use std::path::Path;

const SCHEMA: &str = "vivim.hqkg-chat-context/1";
const MAX_JOURNAL_BYTES: u64 = 64 * 1024 * 1024;
const MAX_ITEMS: usize = 8;

fn safe_title(raw: &str) -> String {
    raw.chars().filter(|c| !c.is_control()).take(100).collect()
}
fn project(journal: &Path, seed: &str, budget: u64) -> Result<Value> {
    if !journal.is_absolute() || seed.is_empty() || seed.len() > 120 ||
        seed.chars().any(char::is_control) || !(1..=1024).contains(&budget) {
        return Err(Error::Invalid("unsafe chat context argument".into()));
    }
    let stat = fs::symlink_metadata(journal)?;
    if !stat.is_file() || stat.file_type().is_symlink() || stat.len() > MAX_JOURNAL_BYTES {
        return Err(Error::Invalid("chat context journal unavailable or unsafe".into()));
    }
    // The Rust graph owns deterministic retrieval; the Host owns who can view it.
    let graph = Journal::new(journal).load()?;
    graph.check_indexes()?;
    let request = ContextRequest {
        seeds: vec![seed.to_string()],
        budget_tokens: budget,
        excluded: BTreeSet::new(),
        watermark: None
    };
    let bundle = retrieve(&graph, &request)?;
    if bundle.stale_count != 0 {
        return Err(Error::Invalid("stale context is not disclosed".into()));
    }
    let items = bundle.items.iter().take(MAX_ITEMS).map(|item| {
        json!({
            "title": safe_title(&item.title),
            "depth": item.depth,
            "revision": item.version,
            "sourceCount": item.sources.len(),
            "estimatedTokens": item.tokens
        })
    }).collect::<Vec<_>>();
    Ok(json!({
        "schema": SCHEMA,
        "state": "source-backed",
        "core": "hqkg",
        "authority": "read-only",
        "seed": seed,
        "epoch": bundle.epoch,
        "tokensUsed": bundle.tokens_used,
        "budgetTokens": budget,
        "budgetExhausted": bundle.budget_exhausted,
        "staleCount": 0,
        "totalRetrieved": bundle.items.len(),
        "items": items,
        "note": "Native graph context is advisory. Host must plan, approve and receipt every effect."
    }))
}
fn run() -> Result<Value> {
    let args = std::env::args().skip(1).collect::<Vec<_>>();
    if args.len() != 3 {
        return Err(Error::Invalid("usage: hqkg-chat-context <absolute-journal.hqj> <host-selected-seed> <token-budget>".into()));
    }
    let budget = args[2].parse::<u64>().map_err(|_| Error::Invalid("invalid token budget".into()))?;
    project(Path::new(&args[0]), &args[1], budget)
}
fn main() {
    match run() {
        Ok(value) => println!("{value}"),
        Err(error) => {
            eprintln!("hqkg-chat-context: {error}");
            std::process::exit(2);
        }
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    use hqkg::{Graph, Node, NodeKind, Journal};
    fn temp() -> std::path::PathBuf {
        std::env::temp_dir().join(format!("hqkg-chat-{}-{}.hqj", std::process::id(),
          std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()))
    }
    #[test]
    fn bounded_source_backed_projection() {
        let file = temp();
        let mut graph = Graph::new();
        graph.put_node(Node::new("world:local", NodeKind::Concept, "Local World")).unwrap();
        Journal::new(&file).save(&graph).unwrap();
        let value = project(&file,"world:local",128).unwrap();
        assert_eq!(value["schema"],SCHEMA);
        assert_eq!(value["state"],"source-backed");
        assert_eq!(value["authority"],"read-only");
        assert_eq!(value["items"][0]["title"],"Local World");
        assert!(value["items"][0].get("properties").is_none());
        assert!(value.get("planId").is_none());
        assert!(project(&file,"missing",128).is_err());
        assert!(project(&file,"world:local",0).is_err());
        let _ = fs::remove_file(file);
    }
    #[test]
    fn invalid_input_does_not_disclose_content() {
        assert!(project(Path::new("relative.hqj"),"world:local",64).is_err());
        assert!(project(Path::new("/unavailable.hqj"),"a\nb",64).is_err());
        assert_eq!(safe_title("owner\nprivate\ttext"),"ownerprivatetext");
    }
}
