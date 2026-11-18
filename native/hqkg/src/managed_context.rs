//! Shared managed context projection. Native retrieval is reused by both
//! existing CLIs; neither creates a second graph or authorizes Host effects.
use crate::{Error, Graph, Journal, JournalStatus, Result};
use crate::context_retrieval::{retrieve, ContextRequest};
use crate::scoped_graph;
use crate::typed_dag::{GraphDomain, Namespace};
use serde_json::{json, Value};
use std::{collections::BTreeSet, fs, path::Path};

const SCHEMA: &str = "vivim.hqkg-chat-context/1";
const MAX_JOURNAL_BYTES: u64 = 64 * 1024 * 1024;
const MAX_ITEMS: usize = 8;
fn safe_title(raw: &str) -> String {
    raw.chars().filter(|c| !c.is_control()).take(100).collect()
}

fn scope_prefix(scope: &str, view: &str) -> Result<(Namespace,String)> {
    if scope.len() != 64 ||
       !scope.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b)) ||
       !matches!(view, "wiki" | "owner") {
        return Err(Error::Invalid("invalid managed context arguments".into()));
    }
    let ns=Namespace { domain:GraphDomain::Personal,owner:format!("pk-{scope}") };
    let prefix=scoped_graph::prefix(&ns)?;
    Ok((ns,prefix))
}

pub fn check_managed_head(journal: &Path, expected: &JournalStatus) -> Result<()> {
    let stat=fs::symlink_metadata(journal)?;
    if !journal.is_absolute() || !stat.is_file() || stat.file_type().is_symlink() ||
        stat.len()>MAX_JOURNAL_BYTES || stat.len()!=expected.total_bytes ||
        expected.trailing_bytes!=0 ||
        journal.with_extension("hqkg.lock").exists() ||
        journal.with_extension("hqkg.compact.tmp").exists() ||
        journal.with_extension("hqkg.preflight.tmp").exists() {
        return Err(Error::Conflict("managed journal unavailable or changed".into()));
    }
    Ok(())
}

// Project the actual replayed durable graph, not the requested input packet.
pub fn project_managed_graph(graph: &Graph, scope: &str, epoch:u64, view:&str) -> Result<Value> {
    let (ns,prefix)=scope_prefix(scope,view)?;
    graph.check_indexes()?;
    if graph.epoch()!=epoch ||
        graph.nodes().any(|n| !n.id.starts_with(&prefix) ||
            n.properties.get("hqkg.namespace")!=Some(&ns.label())) ||
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
        let bundle = retrieve(graph, &ContextRequest { seeds, budget_tokens: 320,
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
    let mut page_relationships = Vec::new();
    for edge in graph.edges() {
        if !edge.id.starts_with(&format!("{prefix}vivim-context-p-")) ||
            edge.properties.get("vivim.context.kind").map(String::as_str) != Some("wiki-page-link") {
            continue;
        }
        let from = graph.node(&edge.from).ok_or_else(|| Error::Corrupt("Wiki link endpoint missing".into()))?;
        let to = graph.node(&edge.to).ok_or_else(|| Error::Corrupt("Wiki link endpoint missing".into()))?;
        for node in [from,to] {
            if node.properties.get("vivim.context.kind").map(String::as_str) != Some("wiki") ||
                !node.properties.get("vivim.context.semanticId").map_or(false, |s| s.starts_with("wiki:page:")) {
                return Err(Error::Corrupt("Wiki link endpoint invalid".into()));
            }
        }
        let revision = edge.properties.get("hqkg.provenance.revision").and_then(|s| s.parse::<u64>().ok())
            .ok_or_else(|| Error::Corrupt("Wiki link revision missing".into()))?;
        page_relationships.push(json!({
            "id":edge.id.strip_prefix(prefix.as_str()),"from":edge.from.strip_prefix(prefix.as_str()),"to":edge.to.strip_prefix(prefix.as_str()),
            "kind":edge.relation,"sourceRef":edge.properties.get("vivim.context.sourceRef"),
            "revision":revision,"digest":edge.properties.get("hqkg.provenance.digest")
        }));
    }
    if page_relationships.len()>24 {
        return Err(Error::Corrupt("Wiki link bound exceeded".into()));
    }
    page_relationships.sort_by(|a,b| a["id"].as_str().cmp(&b["id"].as_str()));
    Ok(json!({"schema":SCHEMA,"state":"source-backed","core":"hqkg","authority":"read-only",
        "seed":format!("managed:{view}"),"epoch":epoch,"tokensUsed":tokens,"budgetTokens":320,
        "budgetExhausted":exhausted,"staleCount":0,"totalRetrieved":total,"items":items,
        "pageRelationships":page_relationships}))
}

// Retain the standalone read-only CLI contract for existing callers.
pub fn project_managed(journal: &Path, scope:&str, epoch:u64, view:&str) -> Result<Value> {
    scope_prefix(scope,view)?;
    let stat=fs::symlink_metadata(journal)?;
    if !journal.is_absolute() || !stat.is_file() || stat.file_type().is_symlink() ||
        stat.len()>MAX_JOURNAL_BYTES {
        return Err(Error::Invalid("managed journal unavailable or unsafe".into()));
    }
    let store=Journal::new(journal);
    let (graph,before)=store.load_with_status()?;
    if before.epoch!=epoch || before.total_bytes!=stat.len() || before.trailing_bytes!=0 {
        return Err(Error::Conflict("stale managed graph head".into()));
    }
    check_managed_head(journal,&before)?;
    let projection=project_managed_graph(&graph,scope,epoch,view)?;
    let after=store.status()?;
    if after.epoch!=epoch || after.total_bytes!=before.total_bytes || after.trailing_bytes!=0 {
        return Err(Error::Conflict("managed graph changed while reading".into()));
    }
    check_managed_head(journal,&after)?;
    Ok(projection)
}
