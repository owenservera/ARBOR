# File: native/hqkg/src/main.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/src/main.rs |
| Language | Rust |
| Kind | source |
| Size | 4723 B |
| Lines | 123 |
| Hash | 085919fed940 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| usage | function | 3 | no | fn usage() -&gt; &amp;&#39;static str { |
| command | function | 6 | no | fn command(args: &amp;[String]) -&gt; Result&lt;()&gt; { |
| main | function | 117 | no | fn main() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::{DatabaseKind, DatabaseSpec, Edge, Error, Graph, Journal, Node, NodeKind, Result} | use | 2 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! Small CLI for persisted graph nodes and edges, paths and optional database queries.
use hqkg::{DatabaseKind, DatabaseSpec, Edge, Error, Graph, Journal, Node, NodeKind, Result};
fn usage() -> &'static str {
    "hqkg <journal> init|stats|nodes|edges|add-node <id> <kind> <title>|add-edge <id> <from> <relation> <to>|path <from> <to>|search <text>|rank|db-add <id> <sqlite|postgres> <locator> [CREDENTIAL_ENV]|db-query <id> <max_rows> <SELECT...>\nExamples:\n  hqkg ./graph.hqj init\n  hqkg ./graph.hqj add-node research:1 document 'source paper'\n  hqkg ./graph.hqj db-add db:local sqlite ./example.db\n  cargo run --features sqlite -- ./graph.hqj db-query db:local 20 'SELECT * FROM example'"
}
fn command(args: &[String]) -> Result<()> {
    if args.len() < 2 {
        return Err(Error::Invalid(usage().into()));
    }
    let db = Journal::new(&args[0]);
    let command = args[1].as_str();
    let mut g = db.load()?;
    let mut changed = false;
    match command {
        "init" => {
            if !db.path().exists() {
                db.save(&Graph::new())?;
            }
            println!("initialized {}", db.path().display());
            return Ok(());
        }
        "stats" => println!(
            "epoch={} nodes={} edges={}",
            g.epoch(),
            g.node_count(),
            g.edge_count()
        ),
        "nodes" => {
            for n in g.nodes() {
                println!("{}\t{}\t{}\tv{}", n.id, n.kind.as_str(), n.title, n.version);
            }
        }
        "edges" => {
            for e in g.edges() {
                println!("{}\t{}\t{}\t{}", e.id, e.from, e.relation, e.to);
            }
        }
        "add-node" => {
            if args.len() != 5 {
                return Err(Error::Invalid(usage().into()));
            }
            g.put_node(Node::new(&args[2], NodeKind::from_str(&args[3]), &args[4]))?;
            changed = true;
        }
        "add-edge" => {
            if args.len() != 6 {
                return Err(Error::Invalid(usage().into()));
            }
            g.put_edge(Edge::new(&args[2], &args[3], &args[4], &args[5]))?;
            changed = true;
        }
        "path" => {
            if args.len() != 4 {
                return Err(Error::Invalid(usage().into()));
            }
            match g.shortest_path(&args[2], &args[3], None)? {
                Some(path) => println!("{}", path.join(" -> ")),
                None => println!("no path"),
            }
        }
        "search" => {
            if args.len() != 3 {
                return Err(Error::Invalid(usage().into()));
            }
            for n in g.search(&args[2], 100) {
                println!("{}\t{}", n.id, n.title);
            }
        }
        "rank" => {
            let mut ranks = g.page_rank(40, 0.85)?.into_iter().collect::<Vec<_>>();
            ranks.sort_by(|a, b| b.1.total_cmp(&a.1));
            for (id, rank) in ranks.iter().take(30) {
                println!("{rank:.6}\t{id}");
            }
        }
        "db-add" => {
            if args.len() != 5 && args.len() != 6 {
                return Err(Error::Invalid(usage().into()));
            }
            let spec = DatabaseSpec {
```

_First 80 of 124 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
