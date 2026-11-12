//! Wave 1 Lane E: pure, read-only provenance queries over the existing HQKG journal.
//! No imports, engine execution, SQLite/Host access or authorization decisions.
use hqkg::{Error, Graph, Journal, Node, Result};
use serde_json::{json, Value};
const SOURCE: &str = "repos-hq/vivim-wave1-lane-e";
const MAX_MATCHES: usize = 32;
const MAX_EDGES: usize = 256;
const COMMUNICATION: &[&str] = &[
    "IMPORTS",
    "CALLS",
    "EMITS",
    "CONSUMES",
    "IPC",
    "WEBSOCKET",
    "TRANSPORT",
    "TALKS_TO",
];

fn pick<'a>(graph: &'a Graph, key: &str) -> Result<Vec<&'a Node>> {
    if key.len() > 256 || key.is_empty() || key.chars().any(char::is_control) {
        return Err(Error::Invalid("query identity missing or unsafe".into()));
    }
    let mut found = graph
        .nodes()
        .filter(|n| {
            n.properties.get("hqkg.exchange.source").map(String::as_str) == Some(SOURCE)
                && (n.id == key
                    || n.properties.get("source_id").map(String::as_str) == Some(key)
                    || n.properties.get("semantic_id").map(String::as_str) == Some(key))
        })
        .collect::<Vec<_>>();
    found.sort_by(|a, b| a.id.cmp(&b.id));
    if found.len() > MAX_MATCHES {
        return Err(Error::Invalid(
            "ambiguous query exceeds 32 bounded matches".into(),
        ));
    }
    if found.is_empty() {
        return Err(Error::Missing("no exact graph identity match".into()));
    }
    Ok(found)
}
fn basic(n: &Node) -> Value {
    json!({"id":n.id,"kind":n.kind.as_str(),"title":n.title,"revision":n.version,
      "sourceId":n.properties.get("source_id"),"sourceLane":n.properties.get("source_lane"),
      "semanticId":n.properties.get("semantic_id"),"status":n.properties.get("status"),
      "sourcePath":n.properties.get("source_path"),"sourceCommit":n.properties.get("source_commit"),
      "contentSha256":n.properties.get("content_sha256"),"sourceLine":n.properties.get("source_line"),
      "sourceRoot":n.properties.get("source_root")})
}
fn linked(g: &Graph, n: &Node, communication_only: bool) -> Value {
    let mut rows = Vec::new();
    for e in g.edges() {
        if e.from != n.id && e.to != n.id {
            continue;
        }
        if communication_only && !COMMUNICATION.contains(&e.relation.as_str()) {
            continue;
        }
        if e.properties.get("hqkg.exchange.source").map(String::as_str) != Some(SOURCE) {
            continue;
        }
        let other = if e.from == n.id { &e.to } else { &e.from };
        let Some(target) = g.node(other) else {
            continue;
        };
        rows.push(
            json!({"edgeId":e.id,"direction":if e.from==n.id{"out"}else{"in"},
          "relation":e.relation,"evidenceClass":e.properties.get("evidence_class"),
          "evidence":e.properties.get("evidence"),"other":basic(target)}),
        );
        if rows.len() == MAX_EDGES {
            break;
        }
    }
    Value::Array(rows)
}
fn query(g: &Graph, command: &str, key: &str) -> Result<Value> {
    if !["where", "what", "talks-to", "gap"].contains(&command) {
        return Err(Error::Invalid(
            "usage: hqkg-wave1-query <journal.hqj> where|what|talks-to|gap <exact-id>".into(),
        ));
    }
    let nodes = pick(g, key)?;
    let mut matches = Vec::new();
    for node in nodes {
        let mut row = basic(node);
        match command {
            "where" => {}
            "what" => {
                row["metadata"] = json!(node
                    .properties
                    .iter()
                    .filter(|(k, _)| !k.starts_with("hqkg."))
                    .collect::<std::collections::BTreeMap<_, _>>());
                row["links"] = linked(g, node, false);
            }
            "talks-to" => {
                row["communication"] = linked(g, node, true);
                row["observationCaveat"]=json!("Only explicit source-linked static or observed edges are shown; absence does not prove no communication");
            }
            "gap" => {
                row["expected"] = json!(node.properties.get("target_state"));
                row["observed"] = json!(node.properties.get("status"));
                row["confidence"] = json!(node.properties.get("confidence"));
                row["evidence"] = linked(g, node, false);
                row["verdict"] = json!(if node.properties.get("target_state").is_none() {
                    "UNKNOWN_TARGET"
                } else if node.properties.get("status") == node.properties.get("target_state") {
                    "REPORTED_MATCH_NOT_RUNTIME_PROOF"
                } else {
                    "REPORTED_GAP_UNVERIFIED"
                });
            }
            _ => unreachable!(),
        }
        matches.push(row);
    }
    Ok(
        json!({"schema":"vivim.wave1.query/1","query":command,"exactKey":key,"journalEpoch":g.epoch(),"matches":matches}),
    )
}
fn run() -> Result<()> {
    let args = std::env::args().skip(1).collect::<Vec<_>>();
    if args.len() != 3 {
        return Err(Error::Invalid(
            "usage: hqkg-wave1-query <journal.hqj> where|what|talks-to|gap <exact-id>".into(),
        ));
    }
    let journal = Journal::new(&args[0]);
    let graph = journal.load()?;
    let result = query(&graph, &args[1], &args[2])?;
    println!(
        "{}",
        serde_json::to_string_pretty(&result).map_err(|e| Error::Invalid(e.to_string()))?
    );
    Ok(())
}
fn main() {
    if let Err(e) = run() {
        eprintln!("hqkg-wave1-query: {e}");
        std::process::exit(2);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use hqkg::import::{Exchange, Manifest};
    use hqkg::{Edge, NodeKind};
    fn graph() -> Graph {
        // Fixture records go through the real importer path: public
        // put_node/put_edge refuse to mint reserved hqkg.exchange.* keys.
        let mut nodes = std::collections::BTreeMap::new();
        for (id, key, status) in [
            ("hqg1:a", "a:file", "current"),
            ("hqg1:b", "b:capability", "current"),
            ("hqg1:c", "c:command", "wired"),
        ] {
            let mut n = Node::new(id, NodeKind::Other("semantic".into()), key);
            n.properties
                .insert("hqkg.exchange.source".into(), SOURCE.into());
            n.properties.insert("source_id".into(), key.into());
            n.properties.insert("status".into(), status.into());
            nodes.insert(id.to_string(), n);
        }
        let mut edge = Edge::new("hqg1:d", "hqg1:a", "CALLS", "hqg1:c");
        edge.properties
            .insert("hqkg.exchange.source".into(), SOURCE.into());
        edge.properties
            .insert("evidence_class".into(), "static".into());
        let edges = std::collections::BTreeMap::from([("hqg1:d".to_string(), edge)]);
        let manifest = Manifest {
            source: SOURCE.into(),
            digest: String::new(),
            node_count: nodes.len(),
            edge_count: edges.len(),
            tombstone_count: 0,
            reconcile_edges: false,
        };
        let mut graph = Graph::new();
        Exchange {
            manifest,
            nodes,
            edges,
            tombstones: Default::default(),
        }
        .apply(&mut graph)
        .unwrap();
        graph
    }
    #[test]
    fn where_and_what_resolve_provenance() {
        let g = graph();
        let found = query(&g, "where", "a:file").unwrap();
        assert_eq!(found["matches"][0]["sourceId"], "a:file");
        assert_eq!(
            query(&g, "what", "a:file").unwrap()["matches"][0]["links"]
                .as_array()
                .unwrap()
                .len(),
            1
        );
    }
    #[test]
    fn calls_are_static_not_observed() {
        let g = graph();
        let result = query(&g, "talks-to", "a:file").unwrap();
        assert_eq!(
            result["matches"][0]["communication"][0]["evidenceClass"],
            "static"
        );
    }
    #[test]
    fn unknown_ids_refuse_and_missing_targets_remain_unknown() {
        let g = graph();
        assert!(query(&g, "where", "missing").is_err());
        assert_eq!(
            query(&g, "gap", "c:command").unwrap()["matches"][0]["verdict"],
            "UNKNOWN_TARGET"
        );
    }
}
