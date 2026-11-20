//! Typed namespace/provenance boundary over the *existing* Graph and
//! GraphChangeSet. No independent graph, policy engine, journal or store.
//! Caller-provided provenance is structurally checked, NOT authenticated.
use crate::graph_change_set::{apply, ApplyLedger, ApplyReport, ChangeOp, GraphChangeSet};
use crate::typed_dag::{Namespace, RevisionToken};
use crate::{Edge, Error, Graph, Node, NodeKind, Result};

pub const RECORD_CONTRACT: &str = "hqkg.scoped-record/1";
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Provenance {
    pub source: String,
    pub revision: u64,
    pub digest: String,
}
impl Provenance {
    pub fn validate(&self) -> Result<()> {
        if self.source.is_empty()
            || self.source.len() > 256
            || self.source.chars().any(char::is_control)
            || self.revision == 0
            || self.digest.len() != 64
            || !self
                .digest
                .bytes()
                .all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase())
        {
            return Err(Error::Invalid("invalid source provenance record".into()));
        }
        Ok(())
    }
}
pub fn prefix(ns: &Namespace) -> Result<String> {
    ns.validate()?;
    let tag = match ns.domain {
        crate::typed_dag::GraphDomain::Development => "development",
        crate::typed_dag::GraphDomain::Personal => "personal",
    };
    let value = format!("{}:{}:{}/", tag, ns.owner.len(), ns.owner);
    if value.len() > 180 {
        return Err(Error::Invalid("scope prefix too long".into()));
    }
    Ok(value)
}
pub fn qualified_id(ns: &Namespace, local: &str) -> Result<String> {
    if local.is_empty() || local.len() > 120 || local.chars().any(char::is_control) {
        return Err(Error::Invalid("invalid scoped local identity".into()));
    }
    let id = format!("{}{}", prefix(ns)?, local);
    if id.len() > 256 {
        return Err(Error::Invalid("qualified identity too long".into()));
    }
    Ok(id)
}
/// The single namespace boundary for graph identities. Every authorized
/// mutation path — the scoped apply below and the host-facing delta ingest —
/// routes its entity ids through this, so an id outside the caller's namespace
/// is refused in exactly one place.
pub fn assert_in_namespace(ns: &Namespace, id: &str) -> Result<()> {
    if !id.starts_with(&prefix(ns)?) || id.len() > 256 {
        return Err(Error::Conflict(
            "graph identity outside requested namespace".into(),
        ));
    }
    Ok(())
}
fn stamp_properties(props: &mut crate::Properties, ns: &Namespace, p: &Provenance) -> Result<()> {
    p.validate()?;
    props.insert("hqkg.contract".into(), RECORD_CONTRACT.into());
    props.insert("hqkg.namespace".into(), ns.label());
    props.insert("hqkg.provenance.source".into(), p.source.clone());
    props.insert("hqkg.provenance.revision".into(), p.revision.to_string());
    props.insert("hqkg.provenance.digest".into(), p.digest.clone());
    Ok(())
}
fn valid_record(props: &crate::Properties, ns: &Namespace) -> Result<()> {
    let source = props
        .get("hqkg.provenance.source")
        .ok_or_else(|| Error::Invalid("missing provenance source".into()))?;
    let revision = props
        .get("hqkg.provenance.revision")
        .and_then(|s| s.parse::<u64>().ok())
        .unwrap_or(0);
    let digest = props
        .get("hqkg.provenance.digest")
        .ok_or_else(|| Error::Invalid("missing provenance digest".into()))?;
    Provenance {
        source: source.clone(),
        revision,
        digest: digest.clone(),
    }
    .validate()?;
    if props.get("hqkg.contract").map(String::as_str) != Some(RECORD_CONTRACT)
        || props.get("hqkg.namespace").map(String::as_str) != Some(ns.label().as_str())
    {
        return Err(Error::Conflict(
            "wrong graph record contract or namespace".into(),
        ));
    }
    Ok(())
}
pub fn node(
    ns: &Namespace,
    local: &str,
    kind: NodeKind,
    title: &str,
    provenance: &Provenance,
) -> Result<Node> {
    let mut n = Node::new(&qualified_id(ns, local)?, kind, title);
    stamp_properties(&mut n.properties, ns, provenance)?;
    n.sources.insert(provenance.source.clone());
    Ok(n)
}
pub fn edge(
    ns: &Namespace,
    local: &str,
    from: &str,
    relation: &str,
    to: &str,
    provenance: &Provenance,
) -> Result<Edge> {
    assert_in_namespace(ns, from)?;
    assert_in_namespace(ns, to)?;
    let mut e = Edge::new(&qualified_id(ns, local)?, from, relation, to);
    stamp_properties(&mut e.properties, ns, provenance)?;
    Ok(e)
}
/// Validate that every record already held in `graph` belongs to `ns` and
/// carries a well-formed scoped provenance record. This is the namespace
/// lifecycle check: it is what makes an unscoped or foreign graph fail closed
/// before any authorized change is applied, and it is reusable by callers that
/// must fence a namespace without applying a change set.
pub fn validate_scope(graph: &Graph, ns: &Namespace) -> Result<()> {
    for n in graph.nodes() {
        assert_in_namespace(ns, &n.id)?;
        valid_record(&n.properties, ns)?;
    }
    for e in graph.edges() {
        assert_in_namespace(ns, &e.id)?;
        assert_in_namespace(ns, &e.from)?;
        assert_in_namespace(ns, &e.to)?;
        valid_record(&e.properties, ns)?;
    }
    Ok(())
}

/// Stages the existing change-set algorithm on a cloned graph and ledger.
/// This prevents partial in-memory mutations on validation or apply error;
/// durability still requires the owner's accepted graph-journal transaction.
/// Deliberately not a replacement for apply_durable or Host approvals.
pub fn apply_scoped(
    graph: &mut Graph,
    ns: &Namespace,
    expected: &RevisionToken,
    changes: &GraphChangeSet,
    ledger: &mut ApplyLedger,
) -> Result<ApplyReport> {
    if expected.namespace != *ns || expected.graph_epoch != graph.epoch() {
        return Err(Error::Conflict(
            "stale or cross-namespace graph revision".into(),
        ));
    }
    let p = prefix(ns)?;
    if !changes.change_set_id.starts_with(&p) {
        return Err(Error::Conflict("change-set id is outside namespace".into()));
    }
    // An unscoped or foreign graph must be migrated by its owner explicitly.
    validate_scope(graph, ns)?;
    for op in &changes.ops {
        match op {
            ChangeOp::PutNode(n) => {
                assert_in_namespace(ns, &n.id)?;
                valid_record(&n.properties, ns)?;
                if !n
                    .properties
                    .get("hqkg.provenance.source")
                    .map_or(false, |source| n.sources.contains(source))
                {
                    return Err(Error::Invalid(
                        "node provenance not present in source evidence".into(),
                    ));
                }
            }
            ChangeOp::PutEdge(e) => {
                assert_in_namespace(ns, &e.id)?;
                assert_in_namespace(ns, &e.from)?;
                assert_in_namespace(ns, &e.to)?;
                valid_record(&e.properties, ns)?;
            }
            ChangeOp::RemoveNode { entity_id, .. }
            | ChangeOp::RemoveNodeFenced { entity_id, .. }
            | ChangeOp::RemoveEdge { entity_id, .. } => {
                assert_in_namespace(ns, entity_id)?;
            }
            ChangeOp::MergeNodes {
                duplicate_id,
                canonical_id,
                ..
            } => {
                assert_in_namespace(ns, duplicate_id)?;
                assert_in_namespace(ns, canonical_id)?;
            }
            ChangeOp::SplitNode {
                source_id,
                new_node,
                edge_ids,
                ..
            } => {
                assert_in_namespace(ns, source_id)?;
                assert_in_namespace(ns, &new_node.id)?;
                valid_record(&new_node.properties, ns)?;
                if !new_node
                    .properties
                    .get("hqkg.provenance.source")
                    .map_or(false, |source| new_node.sources.contains(source))
                {
                    return Err(Error::Invalid(
                        "split node missing provenance evidence".into(),
                    ));
                }
                for id in edge_ids {
                    assert_in_namespace(ns, id)?;
                }
            }
        }
    }
    let mut staged = graph.clone();
    let mut pending = ledger.clone();
    let report = apply(&mut staged, changes, &mut pending)?;
    staged.check_indexes()?;
    *graph = staged;
    *ledger = pending;
    Ok(report)
}

/// Gate serving a cached context bundle to a caller.
///
/// Fail-closed: the caller namespace (explicit identity — namespaces do not
/// authenticate), the provenance record {source, revision, digest}, and the
/// revision token must all validate and agree. Any mismatch rejects the serve,
/// so false, cross-user or unauthorized context reuse is never served. A valid
/// gate returns Ok and the caller may proceed to serve the bundle.
pub fn gate_serve(
    caller: &Namespace,
    provenance: &Provenance,
    expected: &RevisionToken,
) -> Result<()> {
    caller.validate()?;
    provenance.validate()?;
    if provenance.revision == 0 {
        return Err(Error::Conflict("provenance revision must be non-zero".into()));
    }
    if expected.namespace != *caller {
        return Err(Error::Conflict(
            "revision token namespace does not match caller identity".into(),
        ));
    }
    Ok(())
}
