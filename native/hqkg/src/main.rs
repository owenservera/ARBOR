//! Small CLI for persisted graph nodes and edges, paths and optional database queries.
use hqkg::{DatabaseKind, DatabaseSpec, Edge, Error, Graph, Journal, Node, NodeKind, Result};
fn usage() -> &'static str {
    "hqkg <journal> init|stats|nodes|edges|add-node <id> <kind> <title>|add-edge <id> <from> <relation> <to>|path <from> <to>|search <text>|symbol-sources <exact-name>|semantic-sources <name@version>|semantic-impact <name@version> <depth>|rank|db-add <id> <sqlite|postgres> <locator> [CREDENTIAL_ENV]|db-query <id> <max_rows> <SELECT...>\nExamples:\n  hqkg ./graph.hqj init\n  hqkg ./graph.hqj add-node research:1 document 'source paper'\n  hqkg ./graph.hqj db-add db:local sqlite ./example.db\n  cargo run --features sqlite -- ./graph.hqj db-query db:local 20 'SELECT * FROM example'"
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
        "symbol-sources" => {
            if args.len()!=3{return Err(Error::Invalid(usage().into()))}
            let rows=hqkg::semantic_source::symbols(&g,&args[2])?;
            println!("epoch={} authority=indexed-symbol-occurrence-only matches={}",g.epoch(),rows.len());
            for row in rows {
                println!("{}\t{}\t{}\t{}\t{}\t{}\t{}",row.path,row.first_line,row.kind,row.state,row.occurrence_count,row.content_digest,row.id);
            }
        }
        "semantic-sources" => {
            if args.len()!=3{return Err(Error::Invalid(usage().into()))}
            let report=hqkg::semantic_source::sources(&g,&args[2])?;
            println!("epoch={} authority=annotation-occurrence-only matches={}",report.epoch,report.anchors.len());
            for row in report.anchors {
                println!("{}\t{}\t{}\t{}\t{}\t{}",row.path,row.first_line,row.annotation_kind,row.state,row.content_digest,row.anchor_id);
            }
        }
        "semantic-impact" => {
            if args.len()!=4{return Err(Error::Invalid(usage().into()))}
            let depth=args[3].parse().map_err(|_|Error::Invalid("invalid depth".into()))?;
            let report=hqkg::semantic_source::impact(&g,&args[2],depth)?;
            println!("epoch={} authority=static-impact-only truncated={} files={}",report.epoch,report.truncated,report.files.len());
            for (path,depth) in report.files {println!("{depth}\t{path}");}
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
                id: args[2].clone(),
                kind: DatabaseKind::parse(&args[3])?,
                locator: args[4].clone(),
                credential_env: args.get(5).cloned(),
            };
            g.put_node(spec.to_node()?)?;
            changed = true;
        }
        "db-query" => {
            if args.len() != 5 {
                return Err(Error::Invalid(usage().into()));
            }
            let n = g
                .node(&args[2])
                .ok_or_else(|| Error::Missing(args[2].clone()))?;
            let spec = DatabaseSpec::from_node(n)?;
            let max: usize = args[3]
                .parse()
                .map_err(|_| Error::Invalid("invalid max_rows".into()))?;
            let table = spec.query(&args[4], max)?;
            println!("{}", table.columns.join("\t"));
            for row in table.rows {
                println!("{}", row.join("\t"));
            }
            if table.truncated {
                eprintln!("result truncated at {max} rows");
            }
        }
        _ => return Err(Error::Invalid(usage().into())),
    }
    if changed {
        db.save(&g)?;
        println!("saved epoch {}", g.epoch());
    }
    Ok(())
}
fn main() {
    let args = std::env::args().skip(1).collect::<Vec<_>>();
    if let Err(e) = command(&args) {
        eprintln!("hqkg: {e}");
        std::process::exit(2);
    }
}
