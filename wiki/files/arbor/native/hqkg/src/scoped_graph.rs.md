# File: native/hqkg/src/scoped_graph.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/src/scoped_graph.rs |
| Language | Rust |
| Kind | source |
| Size | 9567 B |
| Lines | 258 |
| Hash | 003d29fcb8b3 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| RECORD_CONTRACT | const | 8 | yes | pub const RECORD_CONTRACT: &amp;str = &quot;hqkg.scoped-record/1&quot;; |
| Provenance | struct | 10 | yes | pub struct Provenance { |
| validate | method | 16 | yes | pub fn validate(&amp;self) -&gt; Result&lt;()&gt; { |
| prefix | function | 32 | yes | pub fn prefix(ns: &amp;Namespace) -&gt; Result&lt;String&gt; { |
| qualified_id | function | 44 | yes | pub fn qualified_id(ns: &amp;Namespace, local: &amp;str) -&gt; Result&lt;String&gt; { |
| assert_in_namespace | function | 58 | yes | pub fn assert_in_namespace(ns: &amp;Namespace, id: &amp;str) -&gt; Result&lt;()&gt; { |
| stamp_properties | function | 66 | no | fn stamp_properties(props: &amp;mut crate::Properties, ns: &amp;Namespace, p: &amp;Provenance) -&gt; Result&lt;()&gt; { |
| valid_record | function | 75 | no | fn valid_record(props: &amp;crate::Properties, ns: &amp;Namespace) -&gt; Result&lt;()&gt; { |
| node | function | 101 | yes | pub fn node( ns: &amp;Namespace, local: &amp;str, kind: NodeKind, title: &amp;str, |
| edge | function | 113 | yes | pub fn edge( ns: &amp;Namespace, local: &amp;str, from: &amp;str, relation: &amp;str, |
| validate_scope | function | 132 | yes | pub fn validate_scope(graph: &amp;Graph, ns: &amp;Namespace) -&gt; Result&lt;()&gt; { |
| apply_scoped | function | 150 | yes | pub fn apply_scoped( graph: &amp;mut Graph, ns: &amp;Namespace, expected: &amp;RevisionToken, changes: &amp;GraphChangeSet, |
| gate_serve | function | 242 | yes | pub fn gate_serve( caller: &amp;Namespace, provenance: &amp;Provenance, expected: &amp;RevisionToken, ) -&gt; Result&lt;()&gt; { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| crate::graph_change_set::{apply, ApplyLedger, ApplyReport, ChangeOp, GraphChangeSet} | use | 4 | external |
| crate::typed_dag::{Namespace, RevisionToken} | use | 5 | external |
| crate::{Edge, Error, Graph, Node, NodeKind, Result} | use | 6 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
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
```

_First 80 of 259 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
