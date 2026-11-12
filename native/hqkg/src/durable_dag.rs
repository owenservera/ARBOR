//! Durable, redacted *descriptions* of graph computation, reusing HQKG's
//! existing HQD1 graph Journal. This is not a new execution log or store.
//! Computed payloads are deliberately NOT serialized. After restart, the
//! owner may replay the pure DAG against verified source revisions; it must
//! not interpret a journal description as an effect or as cached output.
use crate::typed_dag::{DagReport, Namespace, RunState, CONTRACT};
use crate::{Error, Graph, Journal, Node, NodeKind, Result};
use std::collections::BTreeMap;

pub const JOURNAL_CONTRACT: &str = "hqkg.execution-descriptor/1";
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DurableRun {
    pub run_id: String,
    pub state: String,
    pub steps: Vec<String>,
    pub failed_step: Option<String>,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct CommitReceipt {
    pub run_id: String,
    pub new_nodes: usize,
    pub total_bytes: u64,
}

fn run_segment(id: &str) -> Result<()> {
    if id.is_empty()
        || id.len() > 64
        || !id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
    {
        return Err(Error::Invalid(
            "run id must be 1..64 ASCII letters/digits/-/_".into(),
        ));
    }
    Ok(())
}
fn scope_id(ns: &Namespace) -> String {
    format!("dag-scope:{}", ns.label())
}
fn run_id(ns: &Namespace, run: &str) -> String {
    format!("dag-run:{}:{}", ns.label(), run)
}
fn step_id(ns: &Namespace, run: &str, step: &str) -> String {
    format!("dag-step:{}:{}:{}", ns.label(), run, step)
}
fn validate_path_identity(ns: &Namespace, run: &str, report: Option<&DagReport>) -> Result<()> {
    ns.validate()?;
    run_segment(run)?;
    if run_id(ns, run).len() > 256 || scope_id(ns).len() > 256 {
        return Err(Error::Invalid(
            "durable identity exceeds graph limit".into(),
        ));
    }
    if let Some(r) = report {
        if r.schema != CONTRACT
            || r.namespace != *ns
            || r.revision.namespace != *ns
            || r.effect_authorized
        {
            return Err(Error::Conflict(
                "durable report/revision or effect-authority mismatch".into(),
            ));
        }
        if r.state == RunState::Complete && (r.failed_step.is_some() || r.failure.is_some()) {
            return Err(Error::Invalid("complete run cannot contain failure".into()));
        }
        let mut ids = std::collections::BTreeSet::new();
        for step in &r.outputs {
            if !ids.insert(step.step_id.as_str())
                || step.step_id.is_empty()
                || step.step_id.len() > 80
                || !step
                    .step_id
                    .bytes()
                    .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
                || step_id(ns, run, &step.step_id).len() > 256
            {
                return Err(Error::Invalid(
                    "unsafe, duplicate or oversized durable step id".into(),
                ));
            }
            if step.engine.is_empty()
                || step.engine.len() > 80
                || step.engine.chars().any(char::is_control)
            {
                return Err(Error::Invalid("unsafe durable engine slot".into()));
            }
        }
        if let Some(id) = &r.failed_step {
            if id.is_empty()
                || id.len() > 80
                || !id
                    .bytes()
                    .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
            {
                return Err(Error::Invalid("unsafe failed-step reference".into()));
            }
        }
    }
    Ok(())
}
fn ensure_scope(graph: &Graph, ns: &Namespace) -> Result<()> {
    for node in graph.nodes() {
        if node.kind == NodeKind::Other("dag-scope".into())
            && (node.id != scope_id(ns) || node.properties.get("namespace") != Some(&ns.label()))
        {
            return Err(Error::Conflict("foreign DAG namespace in journal".into()));
        }
    }
    match graph.node(&scope_id(ns)) {
        Some(marker)
            if marker.kind == NodeKind::Other("dag-scope".into())
                && marker.properties.get("namespace") == Some(&ns.label()) =>
        {
            Ok(())
        }
        Some(_) => Err(Error::Conflict("DAG scope marker identity mismatch".into())),
        None if graph.node_count() > 0 => Err(Error::Conflict(
            "existing journal is unscoped; explicit owner migration required".into(),
        )),
        None => Ok(()),
    }
}
/// Append one complete metadata batch as a single verified HQD1 frame.
/// Caller MUST supply a dedicated domain journal path; a crash before sync
/// leaves a torn tail that requires explicit operator repair.
pub fn commit_report(
    journal: &Journal,
    ns: &Namespace,
    run: &str,
    r: &DagReport,
) -> Result<CommitReceipt> {
    validate_path_identity(ns, run, Some(r))?;
    let status = journal.status()?;
    if status.trailing_bytes != 0 {
        return Err(Error::Corrupt(
            "journal has torn tail; explicit repair required".into(),
        ));
    }
    let existing = journal.load()?;
    ensure_scope(&existing, ns)?;
    let event_id = run_id(ns, run);
    if existing.node(&event_id).is_some() {
        return Err(Error::Conflict(
            "run descriptor already committed; do not duplicate".into(),
        ));
    }
    let mut delta = Graph::new();
    let mut nodes = 0;
    if existing.node(&scope_id(ns)).is_none() {
        let mut scope = Node::new(
            &scope_id(ns),
            NodeKind::Other("dag-scope".into()),
            "DAG scope",
        );
        scope.properties.insert("namespace".into(), ns.label());
        scope
            .properties
            .insert("contract".into(), JOURNAL_CONTRACT.into());
        delta.put_node(scope)?;
        nodes += 1;
    }
    let mut run_node = Node::new(
        &event_id,
        NodeKind::Other("dag-run".into()),
        "DAG execution descriptor",
    );
    run_node
        .properties
        .insert("contract".into(), JOURNAL_CONTRACT.into());
    run_node
        .properties
        .insert("state".into(), format!("{:?}", r.state));
    run_node
        .properties
        .insert("step_count".into(), r.outputs.len().to_string());
    run_node
        .properties
        .insert("graph_epoch".into(), r.revision.graph_epoch.to_string());
    if let Some(step) = &r.failed_step {
        run_node
            .properties
            .insert("failed_step".into(), step.clone());
    }
    run_node
        .properties
        .insert("effect_authorized".into(), "false".into());
    delta.put_node(run_node)?;
    nodes += 1;
    for output in &r.outputs {
        let id = step_id(ns, run, &output.step_id);
        if existing.node(&id).is_some() {
            return Err(Error::Conflict("step descriptor collision".into()));
        }
        let mut node = Node::new(
            &id,
            NodeKind::Other("dag-step".into()),
            "Pure transform result",
        );
        node.properties.insert("run_id".into(), run.into());
        node.properties
            .insert("step_id".into(), output.step_id.clone());
        node.properties
            .insert("engine_slot".into(), output.engine.clone());
        node.properties
            .insert("engine_generation".into(), output.generation.to_string());
        node.properties
            .insert("output_bytes".into(), output.data.len().to_string());
        node.properties
            .insert("output_state".into(), format!("{:?}", output.state));
        // No input_stamp, output bytes, source IDs, digests, or private provenance.
        delta.put_node(node)?;
        nodes += 1;
    }
    let total_bytes = journal.append_delta(&delta, status.total_bytes)?;
    Ok(CommitReceipt {
        run_id: run.into(),
        new_nodes: nodes,
        total_bytes,
    })
}
/// Restart recovery: returns redacted run descriptions, NOT executable
/// outputs, effect receipts, or an authorization to skip recomputation.
pub fn recover_descriptions(journal: &Journal, ns: &Namespace) -> Result<Vec<DurableRun>> {
    ns.validate()?;
    let status = journal.status()?;
    if status.trailing_bytes != 0 {
        return Err(Error::Corrupt("journal contains torn tail".into()));
    }
    let graph = journal.load()?;
    ensure_scope(&graph, ns)?;
    let prefix = format!("dag-run:{}:", ns.label());
    let step_prefix = format!("dag-step:{}:", ns.label());
    let mut runs = BTreeMap::<String, DurableRun>::new();
    for node in graph.nodes() {
        if node.kind != NodeKind::Other("dag-run".into()) || !node.id.starts_with(&prefix) {
            continue;
        }
        let run = node.id[prefix.len()..].to_string();
        run_segment(&run)?;
        let state = node
            .properties
            .get("state")
            .cloned()
            .ok_or_else(|| Error::Corrupt("run missing state".into()))?;
        if ![
            "Complete",
            "Cancelled",
            "Failed",
            "StaleGeneration",
            "Backpressure",
        ]
        .contains(&state.as_str())
        {
            return Err(Error::Corrupt("run has unknown state".into()));
        }
        runs.insert(
            run.clone(),
            DurableRun {
                run_id: run,
                state,
                steps: Vec::new(),
                failed_step: node.properties.get("failed_step").cloned(),
            },
        );
    }
    for node in graph.nodes() {
        if node.kind != NodeKind::Other("dag-step".into()) || !node.id.starts_with(&step_prefix) {
            continue;
        }
        let run = node
            .properties
            .get("run_id")
            .ok_or_else(|| Error::Corrupt("step missing run id".into()))?;
        let step = node
            .properties
            .get("step_id")
            .ok_or_else(|| Error::Corrupt("step missing id".into()))?;
        let matching = step_id(ns, run, step);
        if matching != node.id {
            return Err(Error::Corrupt("step descriptor identity mismatch".into()));
        }
        let record = runs
            .get_mut(run)
            .ok_or_else(|| Error::Corrupt("orphan step descriptor".into()))?;
        record.steps.push(step.clone());
    }
    for (id, run) in &runs {
        let name = run_id(ns, id);
        let expected = graph
            .node(&name)
            .and_then(|n| n.properties.get("step_count"))
            .and_then(|n| n.parse::<usize>().ok())
            .ok_or_else(|| Error::Corrupt("run missing expected step count".into()))?;
        if expected != run.steps.len() {
            return Err(Error::Corrupt("run/step descriptor count mismatch".into()));
        }
    }
    Ok(runs.into_values().collect())
}
