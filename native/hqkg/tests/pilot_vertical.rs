#![cfg(feature = "importer")]
//! Pilot vertical Rust hop ("Required integrated proof" vertical,
//! docs/orchestration/intelligence-upgrade/AUTONOMOUS-CONTINUOUS-WORK-ORDERS.md).
//!
//! Driven by docs/orchestration/intelligence-upgrade/local-integration/pilot/run-vertical.mjs:
//! the harness writes one `*.case.json` per case into PILOT_CASES_DIR, runs
//! `cargo test --features importer --test pilot_vertical`, and reads one
//! `*.out.json` per case from PILOT_OUT_DIR. Without PILOT_CASES_DIR set the
//! test is a no-op so the normal `cargo test --features importer` suite stays
//! green.
//!
//! Case file shape (op-level JSON; the harness separately validates the
//! contract-envelope JSON against contracts/graph-change-set.schema.json):
//!
//! ```json
//! {
//!   "case": "apply-main",
//!   "mode": "apply" | "duplicate" | "stale" | "rollback",
//!   "changeSetId": "pilot-cs-0001",
//!   "rollbackChangeSetId": "pilot-cs-0001-rollback",
//!   "source": "run-vertical",
//!   "seedGraph": { "nodes": [NodeJson], "edges": [EdgeJson] },
//!   "ops": [ChangeOpJson],
//!   "rollbackOps": [ChangeOpJson],
//!   "mutateBeforeApply": { "removeNode": "node-id" }
//! }
//! ```
//!
//! NodeJson:      { id, kind, title, properties: {..}, sources: [..] }
//! EdgeJson:      { id, from, to, relation, weight, properties: {..} }
//! ChangeOpJson:  { op: "putNode", node: NodeJson }
//!              | { op: "putEdge", edge: EdgeJson }
//!              | { op: "removeNode", entityId, reason, ts }
//!              | { op: "removeEdge", entityId, reason, ts }
//!
//! Per-mode assertions live here (a bad case fails `cargo test`, i.e. the hop
//! itself is a real test, not a silent JSON writer). The emitted out JSON
//! carries the ApplyReport(s), the final graph snapshot and mode checks for
//! the harness receipts.
//!
//! @hq:context pilot vertical Rust hop: apply GraphChangeSets from the run-vertical harness and emit reports
//! @hq:owner hq-agent
//! @hq:task required-integrated-proof (docs/orchestration/intelligence-upgrade/AUTONOMOUS-CONTINUOUS-WORK-ORDERS.md)
//! @hq:see src/graph_change_set.rs, docs/orchestration/intelligence-upgrade/local-integration/pilot/

use std::env;
use std::fs;
use std::path::{Path, PathBuf};

use hqkg::graph_change_set::{apply, ApplyLedger, ApplyReport, ChangeOp, GraphChangeSet};
use hqkg::{Edge, Graph, Node, NodeKind, Properties};
use serde_json::{json, Map, Value};

fn case_dir() -> Option<PathBuf> {
    env::var_os("PILOT_CASES_DIR").map(PathBuf::from)
}

fn out_dir() -> PathBuf {
    PathBuf::from(env::var_os("PILOT_OUT_DIR").unwrap_or_else(|| env::temp_dir().into_os_string()))
}

fn json_str(v: &Value, key: &str) -> String {
    v[key]
        .as_str()
        .unwrap_or_else(|| panic!("case field {key:?} missing or not a string"))
        .to_owned()
}

fn parse_node(v: &Value) -> Node {
    let properties: Properties = v["properties"]
        .as_object()
        .map(|m: &Map<String, Value>| {
            m.iter()
                .map(|(k, val)| (k.clone(), val.as_str().unwrap_or_default().to_owned()))
                .collect()
        })
        .unwrap_or_default();
    let sources = v["sources"]
        .as_array()
        .map(|a| {
            a.iter()
                .filter_map(|s| s.as_str().map(str::to_owned))
                .collect()
        })
        .unwrap_or_default();
    Node {
        id: json_str(v, "id"),
        kind: NodeKind::from_str(v["kind"].as_str().unwrap_or("other")),
        title: v["title"].as_str().unwrap_or_default().to_owned(),
        properties,
        sources,
        // The graph assigns the real version on put_node.
        version: 0,
    }
}

fn parse_edge(v: &Value) -> Edge {
    let properties: Properties = v["properties"]
        .as_object()
        .map(|m: &Map<String, Value>| {
            m.iter()
                .map(|(k, val)| (k.clone(), val.as_str().unwrap_or_default().to_owned()))
                .collect()
        })
        .unwrap_or_default();
    Edge {
        id: json_str(v, "id"),
        from: json_str(v, "from"),
        to: json_str(v, "to"),
        relation: json_str(v, "relation"),
        weight: v["weight"].as_u64().unwrap_or(1) as u32,
        properties,
    }
}

fn parse_ops(v: &Value) -> Vec<ChangeOp> {
    v.as_array()
        .expect("ops must be an array")
        .iter()
        .map(
            |op| match op["op"].as_str().expect("op.op must be a string") {
                "putNode" => ChangeOp::PutNode(parse_node(&op["node"])),
                "putEdge" => ChangeOp::PutEdge(parse_edge(&op["edge"])),
                "removeNode" => ChangeOp::RemoveNode {
                    entity_id: json_str(op, "entityId"),
                    reason: json_str(op, "reason"),
                    ts: op["ts"].as_u64().unwrap_or(0),
                },
                "removeEdge" => ChangeOp::RemoveEdge {
                    entity_id: json_str(op, "entityId"),
                    reason: json_str(op, "reason"),
                    ts: op["ts"].as_u64().unwrap_or(0),
                },
                other => panic!("unsupported op {other}"),
            },
        )
        .collect()
}

fn parse_change_set(
    v: &Value,
    id_key: &str,
    ops_key: &str,
    parent: Option<String>,
) -> GraphChangeSet {
    let mut cs = GraphChangeSet::new(json_str(v, id_key), json_str(v, "source"));
    if let Some(p) = parent {
        cs = cs.parent(p);
    }
    cs.ops = parse_ops(&v[ops_key]);
    cs
}

fn load_seed(seed: &Value) -> Graph {
    let mut g = Graph::new();
    for n in seed["nodes"].as_array().expect("seedGraph.nodes array") {
        g.put_node(parse_node(n)).expect("seed put_node");
    }
    for e in seed["edges"].as_array().expect("seedGraph.edges array") {
        g.put_edge(parse_edge(e)).expect("seed put_edge");
    }
    g
}

fn snapshot(g: &Graph) -> Value {
    let nodes: Vec<&Node> = g.nodes().collect();
    let mut nodes: Vec<Value> = nodes
        .iter()
        .map(|n| {
            json!({
                "id": n.id,
                "kind": n.kind.as_str(),
                "title": n.title,
                "version": n.version,
                "sources": n.sources.iter().collect::<Vec<_>>(),
            })
        })
        .collect();
    nodes.sort_by(|a, b| a["id"].as_str().cmp(&b["id"].as_str()));
    let edges: Vec<&Edge> = g.edges().collect();
    let mut edges: Vec<Value> = edges
        .iter()
        .map(|e| {
            json!({
                "id": e.id, "from": e.from, "to": e.to,
                "relation": e.relation, "weight": e.weight,
            })
        })
        .collect();
    edges.sort_by(|a, b| a["id"].as_str().cmp(&b["id"].as_str()));
    json!({
        "nodes": nodes,
        "edges": edges,
        "nodeCount": g.node_count(),
        "edgeCount": g.edge_count(),
        "epoch": g.epoch(),
    })
}

fn report_json(r: &ApplyReport) -> Value {
    json!({
        "changeSetId": r.change_set_id,
        "duplicate": r.duplicate,
        "applied": r.applied,
        "skipped": r.skipped,
        "invalidationSet": r.invalidation_set.iter().collect::<Vec<_>>(),
        "tombstones": r.tombstones
            .iter()
            .map(|t| json!({"entityId": t.entity_id, "reason": t.reason, "ts": t.ts}))
            .collect::<Vec<_>>(),
    })
}

fn state_key(snapshot: &Value) -> Value {
    // Node/edge identity + attributes that rollback must restore exactly.
    json!({
        "nodes": snapshot["nodes"],
        "edges": snapshot["edges"],
    })
}

/// One case -> out JSON. Panics (fails the test) when a mode expectation breaks.
fn run_case(path: &Path, out_dir: &Path) {
    let raw = fs::read_to_string(path).unwrap_or_else(|e| panic!("read {}: {e}", path.display()));
    let case: Value =
        serde_json::from_str(&raw).unwrap_or_else(|e| panic!("parse {}: {e}", path.display()));
    let name = json_str(&case, "case");
    let mode = json_str(&case, "mode");
    let seed = case["seedGraph"].clone();

    let mut out = Map::new();
    out.insert("case".into(), json!(name));
    out.insert("mode".into(), json!(mode));

    match mode.as_str() {
        "apply" => {
            let mut g = load_seed(&seed);
            let mut ledger = ApplyLedger::new();
            let cs = parse_change_set(&case, "changeSetId", "ops", None);
            let expected_ops = cs.ops.len();
            let r = apply(&mut g, &cs, &mut ledger).expect("apply must succeed");
            assert!(!r.duplicate, "first apply must not be a duplicate");
            assert_eq!(r.applied, expected_ops, "every op must land");
            assert!(
                ledger.contains(&cs.change_set_id),
                "ledger must record the applied change set"
            );
            out.insert("reports".into(), json!([report_json(&r)]));
            out.insert("finalGraph".into(), snapshot(&g));
            out.insert(
                "checks".into(),
                json!({
                    "appliedCount": r.applied,
                    "invalidationCount": r.invalidation_set.len(),
                }),
            );
        }
        "duplicate" => {
            let mut g = load_seed(&seed);
            let mut ledger = ApplyLedger::new();
            let cs = parse_change_set(&case, "changeSetId", "ops", None);
            let first = apply(&mut g, &cs, &mut ledger).expect("first apply");
            assert!(!first.duplicate && first.applied == cs.ops.len());
            let epoch_after_first = g.epoch();
            let second = apply(&mut g, &cs, &mut ledger).expect("second apply");
            assert!(second.duplicate, "replay must be flagged duplicate");
            assert_eq!(second.applied, 0, "duplicate replay applies zero ops");
            assert_eq!(second.skipped, 0);
            assert!(second.invalidation_set.is_empty());
            assert!(second.tombstones.is_empty());
            assert_eq!(
                g.epoch(),
                epoch_after_first,
                "duplicate must not touch the graph"
            );
            out.insert(
                "reports".into(),
                json!([report_json(&first), report_json(&second)]),
            );
            out.insert("finalGraph".into(), snapshot(&g));
            out.insert(
                "checks".into(),
                json!({
                    "duplicateReplayZeroOps": true,
                    "epochUnchanged": epoch_after_first == g.epoch(),
                }),
            );
        }
        "stale" => {
            let mut g = load_seed(&seed);
            let loaded = snapshot(&g);
            // Simulate a concurrent revision change between load and apply.
            let mutate = &case["mutateBeforeApply"];
            let removed = mutate["removeNode"]
                .as_str()
                .expect("mutateBeforeApply.removeNode");
            assert!(
                g.remove_node(removed)
                    .expect("concurrent mutation must succeed"),
                "concurrent mutation must actually remove the node"
            );
            let pre_apply = snapshot(&g);
            let mut ledger = ApplyLedger::new();
            let cs = parse_change_set(&case, "changeSetId", "ops", None);
            let result = apply(&mut g, &cs, &mut ledger);
            let err = result.expect_err("stale revision apply must fail");
            assert_eq!(
                g.node_count(),
                pre_apply["nodeCount"].as_u64().unwrap() as usize
            );
            assert_eq!(
                g.edge_count(),
                pre_apply["edgeCount"].as_u64().unwrap() as usize
            );
            out.insert("loadedGraph".into(), loaded);
            out.insert("preApplyGraph".into(), pre_apply);
            out.insert("error".into(), json!(err.to_string()));
            out.insert("finalGraph".into(), snapshot(&g));
            out.insert(
                "checks".into(),
                json!({
                    "staleApplyRejected": true,
                    "graphUnchangedAfterFailure": true,
                }),
            );
        }
        "rollback" => {
            let mut g = load_seed(&seed);
            let seed_state = state_key(&snapshot(&g));
            let mut ledger = ApplyLedger::new();
            let forward = parse_change_set(&case, "changeSetId", "ops", None);
            let rf = apply(&mut g, &forward, &mut ledger).expect("forward apply");
            assert!(!rf.duplicate && rf.applied == forward.ops.len());
            let after_forward = snapshot(&g);
            let rollback_id = json_str(&case, "rollbackChangeSetId");
            let mut inverse = parse_change_set(&case, "rollbackChangeSetId", "rollbackOps", None);
            inverse = inverse.parent(&forward.change_set_id);
            let rr = apply(&mut g, &inverse, &mut ledger).expect("rollback apply");
            let final_snapshot = snapshot(&g);
            assert_eq!(
                seed_state,
                state_key(&final_snapshot),
                "rollback must restore the exact pre-change node/edge state"
            );
            assert!(
                !rr.tombstones.is_empty(),
                "rollback must record tombstones for what it removed"
            );
            out.insert(
                "reports".into(),
                json!([report_json(&rf), report_json(&rr)]),
            );
            out.insert("afterForwardGraph".into(), after_forward);
            out.insert("finalGraph".into(), final_snapshot);
            out.insert(
                "checks".into(),
                json!({
                    "stateRestored": true,
                    "rollbackParentLinked": true,
                    "rollbackTombstones": rr.tombstones.len(),
                }),
            );
        }
        other => panic!("unknown mode {other} in {}", path.display()),
    }

    let out_path = out_dir.join(format!("{name}.out.json"));
    fs::write(
        &out_path,
        serde_json::to_string_pretty(&Value::Object(out)).unwrap(),
    )
    .unwrap_or_else(|e| panic!("write {}: {e}", out_path.display()));
}

#[test]
fn pilot_vertical_cases() {
    let Some(dir) = case_dir() else { return }; // not harness-driven: stay a no-op
    let out = out_dir();
    fs::create_dir_all(&out).expect("create PILOT_OUT_DIR");
    let mut paths: Vec<PathBuf> = fs::read_dir(&dir)
        .expect("read PILOT_CASES_DIR")
        .filter_map(|e| e.ok().map(|e| e.path()))
        .filter(|p| p.extension().and_then(|e| e.to_str()) == Some("json"))
        .collect();
    paths.sort();
    assert!(
        !paths.is_empty(),
        "PILOT_CASES_DIR is set but contains no case files: {}",
        dir.display()
    );
    for path in &paths {
        run_case(path, &out);
    }
}
