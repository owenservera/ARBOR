//! Read-only chat context projection from the **existing** HQKG journal.
 // No graph writes, browser calls, provider sends, authorization decisions, or second engine.
use hqkg::context_retrieval::{retrieve, ContextRequest};
use hqkg::{Error, Journal, Result};
use hqkg::scoped_graph;
use hqkg::typed_dag::{GraphDomain, Namespace};
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
// Managed mode selects only source-backed nodes in the Host's existing
// personal namespace. The phone view excludes owner-only receipt observations.
fn project_managed(journal: &Path, scope: &str, epoch: u64, view: &str) -> Result<Value> {
    if !journal.is_absolute() || scope.len() != 64 ||
        !scope.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b)) ||
        !matches!(view, "wiki" | "owner") {
        return Err(Error::Invalid("invalid managed context arguments".into()));
    }
    let ns = Namespace { domain: GraphDomain::Personal, owner: format!("pk-{scope}") };
    let prefix = scoped_graph::prefix(&ns)?;
    let store = Journal::new(journal);
    let stat = fs::symlink_metadata(journal)?;
    if !stat.is_file() || stat.file_type().is_symlink() || stat.len() > MAX_JOURNAL_BYTES ||
        journal.with_extension("hqkg.lock").exists() ||
        journal.with_extension("hqkg.compact.tmp").exists() ||
        journal.with_extension("hqkg.preflight.tmp").exists() {
        return Err(Error::Invalid("managed journal unavailable or unsafe".into()));
    }
    let before = store.status()?;
    if before.epoch != epoch || before.trailing_bytes != 0 {
        return Err(Error::Conflict("stale managed graph head".into()));
    }
    let graph = store.load()?;
    graph.check_indexes()?;
    if graph.epoch() != epoch ||
        graph.nodes().any(|n| !n.id.starts_with(&prefix) ||
            n.properties.get("hqkg.namespace") != Some(&ns.label())) ||
        graph.edges().any(|e| !e.id.starts_with(&prefix)) {
        return Err(Error::Conflict("managed graph scope or epoch mismatch".into()));
    }
    let mut candidates = Vec::new();
    for node in graph.nodes() {
        let kind = node.properties.get("vivim.context.kind").map(String::as_str);
        if !node.id.starts_with(&format!("{prefix}vivim-context-")) ||
            !(kind == Some("wiki") || (view == "owner" && kind == Some("effect"))) {
            continue;
        }
        let order = node.properties.get("vivim.context.order")
            .and_then(|v| v.parse::<u64>().ok()).ok_or_else(|| Error::Corrupt("context order".into()))?;
        candidates.push((order, node.id.clone()));
    }
    candidates.sort_by(|a,b| b.0.cmp(&a.0).then(a.1.cmp(&b.1)));
    let total = candidates.len();
    let seeds: Vec<String> = candidates.into_iter().take(MAX_ITEMS).map(|(_, id)| id).collect();
    let included: BTreeSet<String> = seeds.iter().cloned().collect();
    let mut items = Vec::new();
    let mut tokens = 0;
    let mut exhausted = total > MAX_ITEMS;
    if !seeds.is_empty() {
        let excluded = graph.nodes().filter(|n| !included.contains(&n.id)).map(|n| n.id.clone()).collect();
        let bundle = retrieve(&graph, &ContextRequest { seeds, budget_tokens: 320,
            excluded, watermark: None })?;
        if bundle.stale_count != 0 || bundle.epoch != epoch { return Err(Error::Conflict("stale managed context".into())); }
        tokens = bundle.tokens_used;
        exhausted |= bundle.budget_exhausted;
        for item in bundle.items {
            let node = graph.node(&item.id).ok_or_else(|| Error::Corrupt("context source missing".into()))?;
            let p = &node.properties;
            let revision = p.get("hqkg.provenance.revision").and_then(|v| v.parse::<u64>().ok())
                .ok_or_else(|| Error::Corrupt("context revision".into()))?;
            let source_revision = p.get("vivim.context.sourceRevision").and_then(|v| v.parse::<u64>().ok());
            items.push(json!({"title":safe_title(&item.title),"depth":item.depth,"revision":revision,
                "sourceCount":item.sources.len(),"estimatedTokens":item.tokens,
                "kind":p.get("vivim.context.kind"),"sourceRef":p.get("vivim.context.sourceRef"),
                "sourceDigest":p.get("hqkg.provenance.digest"),"sourceRevision":source_revision,
                "summary":p.get("vivim.context.summary")}));
        }
    }
    let after = store.status()?;
    if after.epoch != epoch || after.total_bytes != before.total_bytes || after.trailing_bytes != 0 {
        return Err(Error::Conflict("managed graph changed while reading".into()));
    }
    Ok(json!({"schema":SCHEMA,"state":"source-backed","core":"hqkg","authority":"read-only",
        "seed":format!("managed:{view}"),"epoch":epoch,"tokensUsed":tokens,"budgetTokens":320,
        "budgetExhausted":exhausted,"staleCount":0,"totalRetrieved":total,"items":items}))
}

fn run() -> Result<Value> {
    let args = std::env::args().skip(1).collect::<Vec<_>>();
    if args.len() == 5 && args[1] == "--managed" {
        let epoch = args[3].parse::<u64>().map_err(|_| Error::Invalid("invalid graph epoch".into()))?;
        return project_managed(Path::new(&args[0]), &args[2], epoch, &args[4]);
    }
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
