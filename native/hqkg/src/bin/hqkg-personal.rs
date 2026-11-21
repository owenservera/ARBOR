//! Host-invoked bounded adapter over the existing scoped graph and Journal.
//!
//! Durable ingestion has two modes that share one record parser and one change
//! set:
//!
//! * **complete projection** (`nodes`, no `deltas`): the packet is the caller's
//!   whole managed context snapshot, so a record the snapshot no longer carries
//!   is reconciled away.
//! * **explicit delta** (`deltas` + `baseRevision`): every record carries its
//!   own `put` / `delete` operation and the source revision it was projected
//!   from. Omission is never deletion here — only an explicit tombstone
//!   removes, and only while the live source has not moved past that revision.
//!
//! Neither mode is a receipt marker, a second source journal or a mutation
//! authority: identical observations are a no-op, stale revisions are refused,
//! and records owned by other personal capabilities survive.
use hqkg::{Error, Graph, Journal, Node, NodeKind};
use hqkg::graph_change_set::{ApplyLedger, GraphChangeSet};
use hqkg::scoped_graph::{self, Provenance};
use hqkg::managed_context::{check_managed_head, deletion_fence_manifest, project_managed_graph_selected};
use hqkg::typed_dag::{GraphDomain, Namespace, RevisionToken};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::{collections::{BTreeMap, BTreeSet}, fs, io::{self, Read}, path::PathBuf};
const MIB: u64 = 1024 * 1024;
// Per-batch bound on one authorized durable ingestion. It bounds one Host
// packet, not the durable graph: a projection larger than one batch is ingested
// in successive batches, and the graph itself stays bounded by the capacity
// checks below (20000 nodes / 16 MiB). Bounded retrieval stays at 8 items in
// `managed_context`, so ingestion is deliberately independent of the read window.
const MAX_CONTEXT_RECORDS: usize = 512;
const MAX_CONTEXT_DELTAS: usize = 512;
const MAX_MANAGED_JOURNAL_BYTES: u64 = 48*MIB;
fn managed_append_requires_compaction(current_bytes:u64,next_payload_bytes:u64)->bool {
    current_bytes>0 &&
        current_bytes.saturating_add(20).saturating_add(next_payload_bytes)>MAX_MANAGED_JOURNAL_BYTES
}
fn text<'a>(v: &'a Value, key: &str) -> Result<&'a str, String> { v[key].as_str().ok_or_else(|| format!("missing {key}")) }
fn hex(s: &str) -> bool { s.len()==64 && s.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b)) }
fn err(e: impl std::fmt::Display) -> String { e.to_string() }
// Engine Corrupt results mean the managed journal needs explicit recovery; the Host
// classifies on the RECOVERY_REQUIRED prefix (never auto-repairs or steals locks).
fn quarantine(e: Error) -> String { match e { Error::Corrupt(m) => format!("RECOVERY_REQUIRED {m}"), other => err(other) } }

// One authoritative managed observation, parsed once and shared by both
// ingestion modes so a delta and a complete projection admit exactly the same
// records through exactly the same validation.
struct ContextRecord {
    node: Node,
    local: String,
    kind: String,
    source_ref: String,
    digest: String,
    revision: u64,
    page: bool,
    link: Option<(String, u64)>,
    provenance: Provenance,
}
fn context_record(ns: &Namespace, n: &Value) -> Result<ContextRecord, String> {
    let kind = text(n, "kind")?;
    let id = text(n, "id")?;
    let valid_id = match kind {
        "wiki" => id.strip_prefix("vivim-context-w-"),
        "effect" => id.strip_prefix("vivim-context-e-"),
        _ => None,
    };
    if !valid_id.map_or(false, hex) { return Err("invalid managed context identity".into()); }
    let source_ref = text(n, "sourceRef")?;
    if source_ref.is_empty() || source_ref.len() > 128 ||
        !source_ref.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'.') {
        return Err("invalid context source identity".into());
    }
    let digest = text(n, "digest")?;
    let title = text(n, "title")?;
    let summary = text(n, "summary")?;
    let order = n["order"].as_u64().ok_or("invalid context order")?;
    let revision = n["revision"].as_u64().ok_or("invalid context revision")?;
    if !hex(digest) || revision == 0 || title.is_empty() || title.chars().count() > 100 ||
        summary.chars().count() > 120 || title.chars().any(char::is_control) ||
        summary.chars().any(char::is_control) || order == 0 {
        return Err("invalid bounded context observation".into());
    }
    let source_revision = match n.get("sourceRevision") {
        Some(Value::Null) if kind == "effect" => String::new(),
        Some(x) if x.as_u64().is_some() => x.as_u64().unwrap().to_string(),
        _ => return Err("invalid source revision".into()),
    };
    if kind == "wiki" && source_revision != revision.to_string() {
        return Err("Wiki source revision mismatch".into());
    }
    let source = if kind == "wiki" { "host-product-journal" } else { "host-control-receipt" };
    let provenance = Provenance { source: format!("{source}:{source_ref}"),
        revision, digest: digest.into() };
    let mut node = scoped_graph::node(ns, id, NodeKind::Concept, title, &provenance).map_err(err)?;
    for (key, value) in [
        ("vivim.context.kind", kind.to_string()),
        ("vivim.context.sourceRef", source_ref.to_string()),
        ("vivim.context.sourceRevision", source_revision),
        ("vivim.context.order", order.to_string()),
        ("vivim.context.summary", summary.to_string()),
    ] { node.properties.insert(key.into(), value); }
    let semantic_id = text(n, "semanticId")?;
    if semantic_id.is_empty() || semantic_id.len() > 512 || semantic_id.chars().any(char::is_control) {
        return Err("invalid semantic source identity".into());
    }
    node.properties.insert("vivim.context.semanticId".into(), semantic_id.into());
    let page = kind == "wiki" && semantic_id.starts_with("wiki:page:");
    if kind=="wiki" && n.get("receiptDigest").is_some() {
        return Err("Wiki source cannot carry a D4 receipt digest".into());
    }
    let mut link = None;
    if kind != "wiki" {
        let action_id = text(n, "actionId")?;
        if action_id.is_empty() || action_id.len() > 128 ||
            !action_id.bytes().all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || matches!(b,b'.'|b'_'|b'-')) {
            return Err("invalid semantic action identity".into());
        }
        node.properties.insert("vivim.context.actionId".into(), action_id.into());
        if let Some(value)=n.get("receiptDigest") {
            let fingerprint=value.as_str().ok_or("invalid D4 applied receipt digest")?;
            if !hex(fingerprint) {return Err("invalid D4 applied receipt digest".into());}
            node.properties.insert("vivim.context.receiptDigest".into(),fingerprint.into());
        }
        if let Some(l) = n.get("wikiLink").filter(|v| !v.is_null()) {
            let entry = text(l, "entryId")?;
            let linked_revision = l["wikiRevision"].as_u64().ok_or("invalid linked Wiki revision")?;
            if !matches!(action_id,"wiki.section.edit" | "wiki.capture.save") || entry.len() != 36 ||
                !entry.bytes().all(|b| b.is_ascii_hexdigit() || b == b'-') || linked_revision == 0 {
                return Err("invalid D4 Wiki receipt link".into());
            }
            node.properties.insert("vivim.context.wikiEntryId".into(), entry.into());
            node.properties.insert("vivim.context.wikiRevision".into(), linked_revision.to_string());
            link = Some((entry.to_string(), linked_revision));
        }
    }
    Ok(ContextRecord { node, local: id.to_string(), kind: kind.to_string(),
        source_ref: source_ref.to_string(), digest: digest.to_string(), revision, page, link, provenance })
}

// One internal, scope-qualified guard for each removed managed source. This
// record is stored in the same graph/journal as its source, not a second store.
// It is never admitted as Wiki or effect knowledge by managed retrieval.
fn deletion_fence_local(local: &str) -> String {
    format!("vivim-context-t-{:x}", Sha256::digest(local.as_bytes()))
}
fn deletion_fence<'a>(g: &'a Graph, ns: &Namespace, local: &str)
    -> Result<Option<&'a Node>, String> {
    let id=scoped_graph::qualified_id(ns,&deletion_fence_local(local)).map_err(err)?;
    let Some(node)=g.node(&id) else { return Ok(None); };
    if node.properties.get("vivim.context.kind").map(String::as_str)!=Some("tombstone") ||
        node.properties.get("vivim.context.deletedId").map(String::as_str)!=Some(local) {
        return Err("RECOVERY_REQUIRED managed deletion fence identity conflict".into());
    }
    Ok(Some(node))
}

// Durable ingest of one authorized record. The change set comes back unchanged
// when the record is already current, which is the idempotency boundary: a
// replayed put stages nothing, so the journal bytes stay identical.
fn stage_record(g: &Graph, ns: &Namespace, changes: GraphChangeSet, record: &ContextRecord) -> Result<GraphChangeSet, String> {
    let node = &record.node;
    if let Some(fence)=deletion_fence(g,ns,&record.local)? {
        if fence.properties.get("vivim.context.deletedKind").map(String::as_str)
            !=Some(record.kind.as_str()) {
            return Err("RECOVERY_REQUIRED managed deletion fence kind conflict".into());
        }
        let high_water=fence.properties.get("hqkg.provenance.revision")
            .and_then(|s|s.parse::<u64>().ok())
            .ok_or("RECOVERY_REQUIRED managed deletion fence revision")?;
        // A stable Wiki identity may advance beyond its deletion high-water,
        // but a different semantic source may never claim its old graph key.
        if fence.properties.get("vivim.context.deletedSemanticId")
            .is_some_and(|id|record.node.properties.get("vivim.context.semanticId")!=Some(id)) {
            return Err("STALE_CONTEXT_SOURCE deleted semantic identity changed".into());
        }
        // Revoked applied receipts are never resurrected, even if a caller
        // supplies a later graph revision for the same plan identity.
        if record.kind=="effect" || record.revision<=high_water {
            return Err("STALE_CONTEXT_SOURCE durable deletion fence".into());
        }
    }
    if let Some(old) = g.node(&node.id) {
        if old.properties.get("vivim.context.kind").map(String::as_str) != Some(record.kind.as_str()) {
            return Err("managed context identity conflict".into());
        }
        // The deterministic Host ID is stable across Wiki content revisions:
        // a different page/section or receipt semantic key may never reuse an
        // existing graph identity simply by presenting a larger revision.
        if old.properties.get("vivim.context.semanticId") !=
            node.properties.get("vivim.context.semanticId") {
            return Err("STALE_CONTEXT_SOURCE managed semantic identity changed".into());
        }
        let old_revision = old.properties.get("hqkg.provenance.revision")
            .and_then(|v| v.parse::<u64>().ok()).ok_or("invalid prior source revision")?;
        let old_digest = old.properties.get("hqkg.provenance.digest").map(String::as_str);
        let old_ref = old.properties.get("vivim.context.sourceRef").map(String::as_str);
        // Backward-compatible one-way migration: a durable applied receipt
        // without a body fingerprint can acquire it. Once present the actual
        // immutable receipt bytes may not change under the same plan identity.
        let old_receipt_digest=old.properties.get("vivim.context.receiptDigest").map(String::as_str);
        let new_receipt_digest=node.properties.get("vivim.context.receiptDigest").map(String::as_str);
        if record.kind=="effect" && old_receipt_digest.is_some() {
            // The immutable D4 receipt cannot rebind its applied action or
            // target revision under the same verified body fingerprint.
            // Its current Wiki link and presentation may still be superseded.
            if old_receipt_digest!=new_receipt_digest ||
                old_revision!=record.revision ||
                ["vivim.context.actionId","vivim.context.semanticId",
                 "vivim.context.sourceRevision"].iter().any(|field|
                    old.properties.get(*field)!=node.properties.get(*field)) {
                return Err("STALE_CONTEXT_SOURCE immutable applied receipt changed".into());
            }
        }
        if (record.kind == "wiki" && (old_revision > record.revision ||
            (old_revision == record.revision && (old_digest != Some(record.digest.as_str()) ||
                old_ref != Some(record.source_ref.as_str()))))) ||
            (record.kind == "effect" && (old_digest != Some(record.digest.as_str()) ||
                old_ref != Some(record.source_ref.as_str()))) {
            return Err("STALE_CONTEXT_SOURCE or immutable source conflict".into());
        }
        if old.title == node.title && old.properties == node.properties && old.sources == node.sources {
            return Ok(changes);
        }
    }
    Ok(changes.put_node(node.clone()))
}

// Explicit tombstone. The record names its own source, its kind and the source
// revision at which it disappeared; omission never deletes. The namespace
// boundary is checked before any op is built. The deletion high-water is
// persisted as a scoped metadata node alongside the fenced remove, so journal
// compaction cannot resurrect older source puts. Absent-source replay is a no-op.
fn stage_tombstone(g: &Graph, ns: &Namespace, changes: GraphChangeSet, d: &Value,
    complete_high_water: Option<u64>)
    -> Result<(GraphChangeSet, bool), String> {
    let kind = text(d, "kind")?;
    let local = text(d, "id")?;
    let token = match kind {
        "wiki" => local.strip_prefix("vivim-context-w-"),
        "effect" => local.strip_prefix("vivim-context-e-"),
        _ => return Err("invalid tombstone kind".into()),
    };
    if !token.map_or(false, hex) { return Err("invalid managed tombstone identity".into()); }
    let revision = d["revision"].as_u64().ok_or("invalid tombstone revision")?;
    if revision == 0 { return Err("invalid tombstone revision".into()); }
    let id = scoped_graph::qualified_id(ns, local).map_err(err)?;
    scoped_graph::assert_in_namespace(ns, &id).map_err(err)?;
    match g.node(&id) {
        None => Ok((changes, false)),
        Some(old) => {
            if old.properties.get("vivim.context.kind").map(String::as_str) != Some(kind) {
                return Err("managed context identity conflict".into());
            }
            let old_revision = old.properties.get("hqkg.provenance.revision")
                .and_then(|v| v.parse::<u64>().ok()).ok_or("invalid prior source revision")?;
            if old_revision > revision { return Err("STALE_CONTEXT_SOURCE".into()); }
            if let Some(want) = d.get("digest").filter(|x| !x.is_null()) {
                let want = want.as_str().ok_or("invalid tombstone digest")?;
                if !hex(want) { return Err("invalid tombstone digest".into()); }
                if old.properties.get("hqkg.provenance.digest").map(String::as_str) != Some(want) {
                    return Err("STALE_CONTEXT_SOURCE".into());
                }
            }
            // A complete Host inventory proves absence only for Wiki sections,
            // never for bounded Wiki page records or applied D4 receipts.
            let high_water=if kind=="wiki" && old.properties.get("vivim.context.semanticId")
                .is_some_and(|id|id.starts_with("wiki:section:")) {
                complete_high_water.unwrap_or(revision)
            } else { revision };
            if high_water<old_revision {
                return Err("STALE_CONTEXT_SOURCE deletion high-water".into());
            }
            if let Some(prior)=deletion_fence(g,ns,local)? {
                if prior.properties.get("vivim.context.deletedKind").map(String::as_str)!=Some(kind) {
                    return Err("RECOVERY_REQUIRED managed deletion fence kind conflict".into());
                }
                let prior_revision=prior.properties.get("hqkg.provenance.revision")
                    .and_then(|s|s.parse::<u64>().ok())
                    .ok_or("RECOVERY_REQUIRED managed deletion fence revision")?;
                if high_water<=prior_revision {
                    return Err("STALE_CONTEXT_SOURCE deletion high-water regression".into());
                }
            }
            let prior_digest=old.properties.get("hqkg.provenance.digest")
                .ok_or("invalid prior managed source digest")?;
            let prior_source=old.properties.get("hqkg.provenance.source")
                .ok_or("invalid prior managed source provenance")?;
            let prior_ref=old.properties.get("vivim.context.sourceRef")
                .ok_or("invalid prior managed source identity")?;
            let provenance=Provenance {source:prior_source.clone(),
                revision:high_water,digest:prior_digest.clone()};
            let mut fence=scoped_graph::node(ns,&deletion_fence_local(local),
                NodeKind::Concept,"Managed deletion fence",&provenance).map_err(err)?;
            fence.properties.insert("vivim.context.kind".into(),"tombstone".into());
            fence.properties.insert("vivim.context.deletedId".into(),local.into());
            fence.properties.insert("vivim.context.deletedKind".into(),kind.into());
            let semantic=old.properties.get("vivim.context.semanticId")
                .ok_or("invalid prior managed semantic identity")?;
            fence.properties.insert("vivim.context.deletedSemanticId".into(),semantic.clone());
            fence.properties.insert("vivim.context.sourceRef".into(),prior_ref.clone());
            fence.properties.insert("vivim.context.deletedRevision".into(),old_revision.to_string());
            if let Some(body)=old.properties.get("vivim.context.receiptDigest") {
                fence.properties.insert("vivim.context.receiptDigest".into(),body.clone());
            }
            Ok((changes.remove_node_fenced(&id,revision,
                "Host explicit managed context tombstone",high_water)
                .put_node(fence),true))
        }
    }
}

// Reconcile Host-supplied source observations into the existing personal graph.
// Identical observations are a no-op, stale or conflicting sources are refused,
// and records owned by other personal capabilities survive.
fn sync_context(v: &Value, ns: &Namespace, journal: &Journal, g: &mut Graph,
    before: u64, scope: &str) -> Result<Value, String> {
    let view=if v["op"]=="sync-context-read" {
        let view=text(v,"view")?;
        if !matches!(view,"wiki"|"owner") {return Err("invalid managed context view".into());}
        Some(view)
    } else {
        if v.get("view").is_some() {return Err("view requires sync-context-read".into());}
        None
    };
    // Explicit delta batches name their own operations. The source revision the
    // batch was projected from is mandatory, so a lagging or replayed delta is
    // fenced before any graph op is built.
    let deltas=match v.get("deltas") {
        None | Some(Value::Null) => None,
        Some(x) => {
            let list=x.as_array().ok_or("deltas must be an array")?;
            if list.len()>MAX_CONTEXT_DELTAS { return Err("POLICY_LIMIT context deltas".into()); }
            Some(list)
        }
    };
    let base_revision=match v.get("baseRevision") {
        None | Some(Value::Null) => None,
        Some(x) => Some(x.as_u64().ok_or("invalid base revision")?),
    };
    if deltas.is_some() && base_revision.is_none() {
        return Err("delta ingestion requires baseRevision".into());
    }
    // The Host's last verified durable epoch is an optional exact CAS fence.
    // Legacy delta tools retain their source-revision fence; the live Host
    // supplies both so concurrent readers cannot silently overwrite a view.
    if let Some(value)=v.get("baseEpoch") {
        if deltas.is_none() || value.as_u64()!=Some(g.epoch()) {
            return Err("STALE_CONTEXT_EPOCH".into());
        }
    }
    let active_ids:Option<BTreeSet<String>>=match v.get("activeIds") {
        None => None,
        Some(Value::Array(ids)) if view.is_some() && ids.len()<=8192 => {
            let mut selected=BTreeSet::new();
            for value in ids {
                let id=value.as_str().ok_or("invalid active context id")?;
                let valid=id.strip_prefix("vivim-context-w-")
                    .or_else(||id.strip_prefix("vivim-context-e-"));
                if !valid.is_some_and(hex) || !selected.insert(id.to_string()) {
                    return Err("invalid active context source identity".into());
                }
            }
            Some(selected)
        }
        _ => return Err("active context scope requires bounded managed read".into()),
    };
    // Only this exact Host-provided complete Wiki-section inventory is allowed
    // to reconcile omission, including after a cold restart. Bounded source
    // deltas alone never infer deletion. Reconciliation requires an explicit
    // current Wiki high-water, a native journal epoch CAS, and a scoped read.
    let complete_wiki_revision=match v.get("completeWikiRevision") {
        None=>None,
        Some(value)=>{
            let revision=value.as_u64().ok_or("invalid complete Wiki revision")?;
            if revision==0 || view.is_none() || deltas.is_none() ||
                v.get("baseEpoch").is_none() || active_ids.is_none() {
                return Err("complete Wiki inventory requires epoch-fenced scoped delta read".into());
            }
            Some(revision)
        }
    };
    let active_relationships:Option<BTreeSet<String>>=match v.get("activeRelationshipIds") {
        None => None,
        Some(Value::Array(ids)) if view.is_some() && active_ids.is_some() && ids.len()<=24 => {
            let mut selected=BTreeSet::new();
            for value in ids {
                let id=value.as_str().ok_or("invalid active Wiki link id")?;
                if !id.strip_prefix("vivim-context-p-").is_some_and(hex) ||
                    !selected.insert(id.to_string()) {
                    return Err("invalid active Wiki relationship identity".into());
                }
            }
            Some(selected)
        }
        _ => return Err("active Wiki link selection requires scoped context read".into()),
    };
    let nodes = v["nodes"].as_array().ok_or("context nodes required")?;
    if nodes.len() > MAX_CONTEXT_RECORDS { return Err("POLICY_LIMIT context nodes".into()); }
    let prefix = scoped_graph::prefix(ns).map_err(err)?;
    let managed_prefix = format!("{prefix}vivim-context-");
    // A standalone delta without graph-epoch CAS keeps its conservative
    // whole-graph high-water fence. When the Host supplies exact baseEpoch,
    // that durable graph CAS and per-record revision/digest guards are stronger:
    // an unrelated historical receipt with a higher revision must not block
    // a valid lower-revision Wiki source or an empty scoped read.
    if let Some(base)=base_revision.filter(|_|v.get("baseEpoch").is_none()) {
        let head=g.nodes()
            .filter(|n|n.id.starts_with(&managed_prefix) &&
                matches!(n.properties.get("vivim.context.kind").map(String::as_str),Some("wiki"|"effect"|"tombstone")))
            .filter_map(|n|n.properties.get("hqkg.provenance.revision").and_then(|r|r.parse::<u64>().ok()))
            .max().unwrap_or(0);
        if base<head { return Err("STALE_CONTEXT_SOURCE".into()); }
    }
    let mut wanted = BTreeSet::new();
    let mut wiki_nodes = BTreeMap::new();
    let mut wiki_page_nodes = BTreeMap::new();
    // A delta can link a newly applied D4 receipt to a Wiki source that was
    // committed in a previous batch. Reuse the durable, namespace-validated
    // source index; never require the Wiki section to be resent just to link it.
    // Complete projections remain batch-local by design.
    if deltas.is_some() {
        for n in g.nodes() {
            if !n.id.starts_with(&managed_prefix) ||
                n.properties.get("vivim.context.kind").map(String::as_str)!=Some("wiki") {
                continue;
            }
            let revision=n.properties.get("hqkg.provenance.revision")
                .and_then(|r|r.parse::<u64>().ok()).ok_or("invalid prior source revision")?;
            let source_ref=n.properties.get("vivim.context.sourceRef")
                .ok_or("invalid durable Wiki source identity")?;
            if wiki_nodes.insert(source_ref.clone(),(n.id.clone(),revision)).is_some() {
                return Err("duplicate durable Wiki source identity".into());
            }
            if n.properties.get("vivim.context.semanticId")
                .map_or(false,|s|s.starts_with("wiki:page:")) {
                if let Some(local)=n.id.strip_prefix(&prefix) {
                    wiki_page_nodes.insert(local.to_string(),revision);
                }
            }
        }
    }
    let mut effect_links = Vec::new();
    let mut changes = GraphChangeSet::new(format!("{prefix}sync-host-context"), "host-context");
    let mut tombstoned = 0usize;
    let mut ingested = 0usize;
    let mut deleted = BTreeSet::new();
    // Deletes are staged before puts so a batch that writes and deletes one
    // identity is refused instead of being silently ordered.
    if let Some(list)=deltas {
        for d in list {
            match text(d,"op")? {
                "delete" | "revoke" => {
                    let local=scoped_graph::qualified_id(ns,text(d,"id")?).map_err(err)?;
                    if !deleted.insert(local.clone()) { return Err("duplicate managed context delta".into()); }
                    if let Some(old)=g.node(&local) {
                        if old.properties.get("vivim.context.kind").map(String::as_str)==Some("wiki") {
                            let old_ref=old.properties.get("vivim.context.sourceRef")
                                .ok_or("invalid durable Wiki source identity")?;
                            wiki_nodes.remove(old_ref);
                            wiki_page_nodes.remove(local.strip_prefix(&prefix).unwrap_or(""));
                        }
                    }
                    let (next,applied)=stage_tombstone(g,ns,changes,d,complete_wiki_revision)?;
                    changes=next;
                    if applied { tombstoned+=1; }
                }
                "put" => {}
                _ => return Err("invalid context delta op".into()),
            }
        }
    }
    let mut records = Vec::new();
    for n in nodes { records.push(context_record(ns,n)?); }
    if let Some(list)=deltas {
        for d in list { if text(d,"op")?=="put" { records.push(context_record(ns,d)?); } }
    }
    for record in &records {
        if !wanted.insert(record.node.id.clone()) { return Err("duplicate context identity".into()); }
        if deleted.contains(&record.node.id) { return Err("duplicate managed context delta".into()); }
        if record.page { wiki_page_nodes.insert(record.local.clone(),record.revision); }
        if record.kind=="wiki" {
            // A revised section replaces the prior entry identity at the same
            // stable node ID. The old source can no longer authorize a D4 edge.
            if let Some(old)=g.node(&record.node.id) {
                let old_ref=old.properties.get("vivim.context.sourceRef")
                    .ok_or("invalid durable Wiki source identity")?;
                if old_ref!=&record.source_ref { wiki_nodes.remove(old_ref); }
            }
            if wiki_nodes.get(&record.source_ref)
                .is_some_and(|(id,_)|id!=&record.node.id) {
                return Err("duplicate Wiki source identity".into());
            }
            wiki_nodes.insert(record.source_ref.clone(),(record.node.id.clone(),record.revision));
        }
        changes=stage_record(g,ns,changes,record)?;
        ingested+=1;
        if let Some((entry,wiki_revision))=&record.link {
            effect_links.push((record.local.clone(),record.node.id.clone(),entry.clone(),
                *wiki_revision,record.provenance.clone()));
        }
    }
    // Only link an applied receipt to the exact current D4 source entry and
    // revision. Historical receipt metadata stays historical after supersession.
    let mut wanted_edges = BTreeSet::new();
    for (local, from, entry, revision, provenance) in effect_links {
        if let Some((to, current_revision)) = wiki_nodes.get(&entry) {
            if *current_revision != revision { continue; }
            let local_edge = format!("vivim-context-l-{}", &local["vivim-context-e-".len()..]);
            let mut edge = scoped_graph::edge(ns, &local_edge, &from, "committed-wiki-change",
                to, &provenance).map_err(err)?;
            edge.properties.insert("vivim.context.kind".into(), "effect-wiki-link".into());
            wanted_edges.insert(edge.id.clone());
            if let Some(old) = g.edge(&edge.id) {
                if old.properties.get("vivim.context.kind").map(String::as_str) != Some("effect-wiki-link") {
                    return Err("managed context edge identity conflict".into());
                }
                if old == &edge { continue; }
            }
            changes = changes.put_edge(edge);
        }
    }
    // If a previously linked receipt loses its current Wiki link in the
    // source projection, its historical node remains while its stale edge is
    // explicitly removed. An unchanged receipt omitted from a delta is never
    // interpreted as revocation.
    if deltas.is_some() {
        for record in &records {
            if record.kind!="effect" {continue;}
            let local_edge=format!("vivim-context-l-{}",
                &record.local["vivim-context-e-".len()..]);
            let edge_id=scoped_graph::qualified_id(ns,&local_edge).map_err(err)?;
            if g.edge(&edge_id).is_some() && !wanted_edges.contains(&edge_id) {
                changes=changes.remove_edge(&edge_id,
                    "D4 current Wiki evidence no longer linked",record.revision);
            }
        }
    }
    // Only Host-supplied evidence over two selected managed Wiki page nodes.
    // Omitted or removed structure is reconciled in the same change set.
    let mut page_edges = BTreeSet::new();
    let mut relationship_puts:Vec<&Value>=Vec::new();
    if let Some(value)=v.get("relationships") {
        let relations=value.as_array().ok_or("invalid Wiki relationships")?;
        relationship_puts.extend(relations.iter());
    }
    // Unlike a complete projection, a delta never treats omission as deletion.
    // Every removed link carries its old digest and revision fence.
    let mut removed_page_edges=BTreeSet::new();
    if let Some(value)=v.get("relationshipDeltas") {
        if deltas.is_none() { return Err("Wiki relationship deltas require source deltas".into()); }
        let changes_list=value.as_array().ok_or("invalid Wiki relationship deltas")?;
        if changes_list.len()>24 { return Err("POLICY_LIMIT Wiki relationship deltas".into()); }
        for change in changes_list {
            match text(change,"op")? {
                "put" => relationship_puts.push(change),
                "delete" => {
                    let local=text(change,"id")?;
                    if !local.strip_prefix("vivim-context-p-").is_some_and(hex) {
                        return Err("invalid Wiki relationship tombstone".into());
                    }
                    let revision=change["revision"].as_u64().ok_or("invalid link tombstone revision")?;
                    let digest=text(change,"digest")?;
                    if revision==0 || !hex(digest) {return Err("invalid link tombstone provenance".into());}
                    let id=scoped_graph::qualified_id(ns,local).map_err(err)?;
                    if !removed_page_edges.insert(id.clone()) {
                        return Err("duplicate Wiki relationship tombstone".into());
                    }
                    if let Some(old)=g.edge(&id) {
                        let old_revision=old.properties.get("hqkg.provenance.revision")
                            .and_then(|s|s.parse::<u64>().ok()).ok_or("invalid prior link revision")?;
                        if old.properties.get("vivim.context.kind").map(String::as_str)!=Some("wiki-page-link") ||
                            old_revision>revision ||
                            old.properties.get("hqkg.provenance.digest").map(String::as_str)!=Some(digest) {
                            return Err("STALE_CONTEXT_SOURCE Wiki relationship".into());
                        }
                        changes=changes.remove_edge(&id,"Host committed Wiki link invalidation",revision);
                    }
                }
                _ => return Err("invalid Wiki relationship delta op".into()),
            }
        }
    }
    if relationship_puts.len()>24 { return Err("POLICY_LIMIT Wiki relationships".into()); }
    for item in relationship_puts {
            let id = text(item, "id")?;
            let from = text(item, "from")?;
            let to = text(item, "to")?;
            let source = text(item, "sourceRef")?;
            let digest = text(item, "digest")?;
            let revision = item["revision"].as_u64().ok_or("invalid Wiki relationship revision")?;
            let canonical_id=format!("vivim-context-p-{:x}",Sha256::digest(
                serde_json::to_string(&[from,to]).map_err(err)?.as_bytes()));
            if id != canonical_id.as_str() ||
                !wiki_page_nodes.get(from).map_or(false,|r| *r>=revision) ||
                !wiki_page_nodes.get(to).map_or(false,|r| *r>=revision) ||
                deleted.contains(&scoped_graph::qualified_id(ns,from).map_err(err)?) ||
                deleted.contains(&scoped_graph::qualified_id(ns,to).map_err(err)?) || from == to ||
                text(item, "kind")? != "wiki-page-link" || !hex(digest) || revision == 0 ||
                source.len() != 36 || !source.bytes().all(|b| b.is_ascii_hexdigit() || b == b'-') {
                return Err("invalid Wiki page relationship".into());
            }
            let from = scoped_graph::qualified_id(ns, from).map_err(err)?;
            let to = scoped_graph::qualified_id(ns, to).map_err(err)?;
            let provenance = Provenance {source:format!("host-product-journal:{source}"),revision,digest:digest.into()};
            let mut edge = scoped_graph::edge(ns,id,&from,"wiki-page-link",&to,&provenance).map_err(err)?;
            edge.properties.insert("vivim.context.kind".into(),"wiki-page-link".into());
            edge.properties.insert("vivim.context.sourceRef".into(),source.into());
            if !page_edges.insert(edge.id.clone()) || removed_page_edges.contains(&edge.id) {
                return Err("duplicate Wiki relationship".into());
            }
            if let Some(old) = g.edge(&edge.id) {
                if old.properties.get("vivim.context.kind").map(String::as_str) != Some("wiki-page-link") ||
                    old.from != edge.from || old.to != edge.to {
                    return Err("managed Wiki relationship identity conflict".into());
                }
                let old_revision = old.properties.get("hqkg.provenance.revision")
                    .and_then(|v| v.parse::<u64>().ok()).ok_or("invalid prior link revision")?;
                if old_revision > revision || (old_revision == revision && old != &edge) {
                    return Err("STALE_CONTEXT_SOURCE or immutable Wiki link conflict".into());
                }
                if old == &edge { continue; }
            }
            changes = changes.put_edge(edge);
    }
    // Updating a Wiki section invalidates any previously linked D4 receipt
    // whose exact entry/revision no longer identifies that current section.
    // Historical receipt nodes remain untouched: only the relationship loses
    // its claim to current Wiki lineage.
    if deltas.is_some() {
        for edge in g.edges().filter(|e|e.id.starts_with(&format!("{prefix}vivim-context-l-")) &&
            e.properties.get("vivim.context.kind").map(String::as_str)==Some("effect-wiki-link")) {
            let Some(updated)=records.iter().find(|r|r.node.id==edge.to) else {continue};
            let effect=g.node(&edge.from).ok_or("missing linked D4 receipt")?;
            let linked_ref=effect.properties.get("vivim.context.wikiEntryId").map(String::as_str);
            let linked_revision=effect.properties.get("vivim.context.wikiRevision")
                .and_then(|s|s.parse::<u64>().ok());
            if linked_ref!=Some(updated.source_ref.as_str()) || linked_revision!=Some(updated.revision) {
                changes=changes.remove_edge(&edge.id,"D4 Wiki source superseded",updated.revision);
            }
        }
    }
    // An explicit *complete Wiki-section inventory* is different from a
    // bounded delta. The Host replays and validates the entire product journal,
    // then binds all surviving current sections to activeIds and the source Wiki
    // high-water. This handles a page or section deleted while Host was down:
    // the old section must not persist forever just because the process forgot
    // its last RAM snapshot. Never target historical D4 effects, Wiki page
    // structure, unrelated namespace nodes, or newer source revisions.
    let mut reconciled_sections=0usize;
    let mut reconciled_relationships=0usize;
    if let Some(wiki_revision)=complete_wiki_revision {
        let current=active_ids.as_ref().ok_or("missing complete Wiki inventory")?;
        for old in g.nodes() {
            if !old.id.starts_with(&managed_prefix) ||
                old.properties.get("vivim.context.kind").map(String::as_str)!=Some("wiki") ||
                !old.properties.get("vivim.context.semanticId")
                    .is_some_and(|s|s.starts_with("wiki:section:")) ||
                deleted.contains(&old.id) {
                continue;
            }
            let local=old.id.strip_prefix(&prefix)
                .ok_or("invalid complete Wiki inventory scope")?;
            if current.contains(local) {continue;}
            let old_revision=old.properties.get("hqkg.provenance.revision")
                .and_then(|s|s.parse::<u64>().ok())
                .ok_or("invalid historical Wiki section revision")?;
            if old_revision>wiki_revision {
                return Err("STALE_CONTEXT_SOURCE complete Wiki inventory".into());
            }
            let prior_digest=old.properties.get("hqkg.provenance.digest")
                .ok_or("invalid historical Wiki section digest")?;
            let exact=json!({"kind":"wiki","id":local,
                "revision":old_revision,"digest":prior_digest});
            let (next,deleted_one)=stage_tombstone(g,ns,changes,&exact,Some(wiki_revision))?;
            changes=next;
            if deleted_one {reconciled_sections+=1;}
        }
        // The committed Wiki high-water also advances already-deleted section
        // fences. Otherwise an absent section deleted at revision 2 could be
        // resurrected by a delayed revision 3 delta after Host verified that
        // it was still absent at revision 20. This updates metadata only, using
        // the same durable graph CAS and without inventing source content.
        for old in g.nodes() {
            if !old.id.starts_with(&managed_prefix) ||
                old.properties.get("vivim.context.kind").map(String::as_str)!=Some("tombstone") ||
                old.properties.get("vivim.context.deletedKind").map(String::as_str)!=Some("wiki") ||
                !old.properties.get("vivim.context.deletedSemanticId")
                    .is_some_and(|id|id.starts_with("wiki:section:")) {
                continue;
            }
            let local=old.properties.get("vivim.context.deletedId")
                .ok_or("invalid durable section fence identity")?;
            if current.contains(local) {continue;}
            let previous=old.properties.get("hqkg.provenance.revision")
                .and_then(|v|v.parse::<u64>().ok())
                .ok_or("invalid durable section fence high-water")?;
            if previous>wiki_revision {
                return Err("STALE_CONTEXT_SOURCE complete Wiki deletion high-water".into());
            }
            if previous<wiki_revision {
                let mut updated=old.clone();
                updated.properties.insert("hqkg.provenance.revision".into(),
                    wiki_revision.to_string());
                changes=changes.put_node(updated);
            }
        }
        // Omission can invalidate an old page link only when both endpoints
        // belong to the exact committed Wiki view. Historical out-of-window
        // edges remain durable and cannot be pruned by a bounded selection.
        if let Some(current_links)=&active_relationships {
            for old in g.edges() {
                if !old.id.starts_with(&format!("{prefix}vivim-context-p-")) ||
                    old.properties.get("vivim.context.kind").map(String::as_str)!=Some("wiki-page-link") ||
                    page_edges.contains(&old.id) || removed_page_edges.contains(&old.id) {
                    continue;
                }
                let local=old.id.strip_prefix(&prefix)
                    .ok_or("invalid durable Wiki relationship scope")?;
                let from=old.from.strip_prefix(&prefix)
                    .ok_or("invalid durable Wiki relationship endpoint")?;
                let to=old.to.strip_prefix(&prefix)
                    .ok_or("invalid durable Wiki relationship endpoint")?;
                if current_links.contains(local) || !current.contains(from) || !current.contains(to) {
                    continue;
                }
                let old_revision=old.properties.get("hqkg.provenance.revision")
                    .and_then(|s|s.parse::<u64>().ok())
                    .ok_or("invalid historical Wiki relationship revision")?;
                if old_revision>wiki_revision {
                    return Err("STALE_CONTEXT_SOURCE complete Wiki relationship inventory".into());
                }
                changes=changes.remove_edge(&old.id,
                    "Host complete committed Wiki relationship invalidation",wiki_revision);
                reconciled_relationships+=1;
            }
        }
    }
    // Only a complete projection reconciles generic omission. A bounded
    // delta never infers deletion: the inventory above is separately
    // authorized, revision-fenced, and limited to current Wiki sections.
    if deltas.is_none() {
        for old in g.edges() {
            if old.id.starts_with(&format!("{prefix}vivim-context-p-")) &&
                old.properties.get("vivim.context.kind").map(String::as_str) == Some("wiki-page-link") &&
                !page_edges.contains(&old.id) {
                changes = changes.remove_edge(&old.id, "Committed Wiki page link absent from current projection", 0);
            }
            if old.id.starts_with(&format!("{prefix}vivim-context-l-")) &&
                old.properties.get("vivim.context.kind").map(String::as_str) == Some("effect-wiki-link") &&
                !wanted_edges.contains(&old.id) {
                changes = changes.remove_edge(&old.id, "D4 committed Wiki relationship invalidated", 0);
            }
        }
        for old in g.nodes() {
            if old.id.starts_with(&managed_prefix) &&
                matches!(old.properties.get("vivim.context.kind").map(String::as_str), Some("wiki" | "effect")) &&
                !wanted.contains(&old.id) {
                let local=old.id.strip_prefix(&prefix)
                        .ok_or("invalid complete managed source scope")?;
                    let revision=old.properties.get("hqkg.provenance.revision")
                        .and_then(|s|s.parse::<u64>().ok())
                        .ok_or("invalid prior managed source revision")?;
                    let digest=old.properties.get("hqkg.provenance.digest")
                        .ok_or("invalid prior managed source digest")?;
                    let exact=json!({"kind":old.properties.get("vivim.context.kind"),
                        "id":local,"revision":revision,"digest":digest});
                    let (next,_)=stage_tombstone(g,ns,changes,&exact,None)?;
                    changes=next;
            }
        }
    }
    let epoch = g.epoch();
    let changed = !changes.ops.is_empty();
    if changed {
        scoped_graph::apply_scoped(g, ns, &RevisionToken { namespace: ns.clone(), graph_epoch: epoch },
            &changes, &mut ApplyLedger::new()).map_err(err)?;
    }
    // Validate proposed active-source and link identities against the *new
    // in-memory graph* before any checked journal write or compaction. A bad
    // retrieval scope may never commit source changes then fail after saving.
    if view.is_some() {
        if let Some(ids)=&active_ids {
            for local in ids {
                let id=scoped_graph::qualified_id(ns,local).map_err(err)?;
                let node=g.node(&id).ok_or("active context source missing from projected graph")?;
                let kind=node.properties.get("vivim.context.kind").map(String::as_str);
                if !matches!(kind,Some("wiki"|"effect")) ||
                    (view==Some("wiki") && kind!=Some("wiki")) {
                    return Err("invalid projected active source kind for view".into());
                }
            }
        }
        if let Some(ids)=&active_relationships {
            for local in ids {
                let id=scoped_graph::qualified_id(ns,local).map_err(err)?;
                let edge=g.edge(&id).ok_or("active Wiki link missing from projected graph")?;
                if edge.properties.get("vivim.context.kind").map(String::as_str)
                    !=Some("wiki-page-link") {
                    return Err("invalid projected active Wiki link kind".into());
                }
            }
        }
    }
    // Native managed retrieval has additional view, bounded link and D4
    // lineage checks beyond active-ID existence. Run those checks against
    // the proposed graph BEFORE any append or verified compaction, so a
    // semantically invalid candidate cannot leave a committed frame behind.
    // Re-project from the durable replay after save as a separate readback
    // attestation; the in-memory candidate is never returned directly.
    if let Some(selected_view)=view {
        project_managed_graph_selected(g,scope,g.epoch(),selected_view,
            active_ids.as_ref(),active_relationships.as_ref()).map_err(quarantine)?;
    }
    // Even write-only delta batches must validate the complete internal
    // deletion-fence proof before creating a persistent graph revision.
    deletion_fence_manifest(g,&prefix,None).map_err(quarantine)?;
    let mut compacted=false;
    if changed || before == 0 {
        let bytes = hqkg::serialize(g).map_err(err)?;
        if bytes.len() as u64 > 16*MIB || g.node_count() > 20000 || g.edge_count() > 50000 {
            return Err("CAPACITY_HELD graph".into());
        }
        let mut checked_bytes=before;
        if managed_append_requires_compaction(before,bytes.len() as u64) {
            // Native HQKG saves a verified full snapshot per batch; many
            // legitimate small deltas eventually fill the append-only journal
            // even when the live graph itself is well below 16 MiB.
            // Compact the *previous durable head*, not the uncommitted graph,
            // through the existing epoch+byte-CAS recovery-safe engine.
            // A crash here leaves the previous graph (not a partial new batch).
            let receipt=journal.compact_verified(before,epoch).map_err(quarantine)?;
            if receipt.old_bytes!=before || receipt.epoch!=epoch ||
                receipt.new_bytes==0 {
                return Err("RECOVERY_REQUIRED invalid managed compaction receipt".into());
            }
            checked_bytes=receipt.new_bytes;
            compacted=true;
        }
        if checked_bytes.saturating_add(20).saturating_add(bytes.len() as u64)>
            MAX_MANAGED_JOURNAL_BYTES {
            return Err("COMPACTION_REQUIRED".into());
        }
        journal.save_checked(g,checked_bytes,epoch).map_err(quarantine)?;
    }
    let (durable,status)=journal.load_with_status().map_err(quarantine)?;
    if status.trailing_bytes != 0 || status.epoch != g.epoch() {
        return Err("stale or torn synchronized graph".into());
    }
    // The read uses the verified durable replay. Keep the existing independent
    // reader semantics, but avoid launching it and loading the same head again.
    let mut packet=json!({"schema":"vivim.hqkg-personal/1","scope":scope,"op":v["op"],
        "epoch":status.epoch,"bytes":status.total_bytes,"synced":wanted.len(),
        "syncedRelationships":page_edges.len(),"changed":changed,
        "compacted":compacted,
        "mode":if deltas.is_some(){"delta"}else{"projection"},
        "ingested":ingested,"tombstoned":tombstoned,
        "reconciledSections":reconciled_sections,
        "reconciledRelationships":reconciled_relationships});
    if let Some(view)=view {
        check_managed_head(journal.path(),&status).map_err(quarantine)?;
        if let Some(ids)=&active_ids {
            for local in ids {
                let id=scoped_graph::qualified_id(ns,local).map_err(err)?;
                let node=durable.node(&id).ok_or("active context source missing from durable graph")?;
                if !matches!(node.properties.get("vivim.context.kind").map(String::as_str),Some("wiki"|"effect")) {
                    return Err("invalid active context source kind".into());
                }
            }
        }
        if let Some(ids)=&active_relationships {
            for local in ids {
                let id=scoped_graph::qualified_id(ns,local).map_err(err)?;
                let edge=durable.edge(&id).ok_or("active Wiki link missing from durable graph")?;
                if edge.properties.get("vivim.context.kind").map(String::as_str)!=Some("wiki-page-link") {
                    return Err("invalid active Wiki link kind".into());
                }
            }
        }
        packet["context"]=project_managed_graph_selected(&durable,scope,status.epoch,
            view,active_ids.as_ref(),active_relationships.as_ref()).map_err(quarantine)?;
        // Preserve the standalone reader's final on-disk epoch/length check.
        let after=journal.status().map_err(quarantine)?;
        if after.epoch!=status.epoch || after.total_bytes!=status.total_bytes || after.trailing_bytes!=0 {
            return Err("managed graph changed while reading".into());
        }
        check_managed_head(journal.path(),&after).map_err(quarantine)?;
    }
    Ok(packet)
}

fn run() -> Result<Value, String> {
    let mut args=std::env::args().skip(1);
    if args.next().as_deref()!=Some("--journal") { return Err("Host --journal argument required".into()); }
    let path=PathBuf::from(args.next().ok_or("missing journal path")?);
    if !path.is_absolute() || args.next().is_some() { return Err("absolute Host journal path required".into()); }
    let mut input=Vec::new(); io::stdin().take(MIB+1).read_to_end(&mut input).map_err(err)?;
    if input.len() as u64 > MIB { return Err("POLICY_LIMIT proposal".into()); }
    let v:Value=serde_json::from_slice(&input).map_err(err)?;
    if v["schema"]!="vivim.hqkg-personal/1" { return Err("schema mismatch".into()); }
    let scope=text(&v,"scope")?; if !hex(scope) { return Err("invalid scope".into()); }
    let ns=Namespace { domain:GraphDomain::Personal, owner:format!("pk-{scope}") };
    let journal=Journal::new(&path);
    let before=match fs::symlink_metadata(&path) { Ok(m)=>{if !m.is_file() || m.file_type().is_symlink() {return Err("unsafe journal".into());} m.len()}, Err(e) if e.kind()==io::ErrorKind::NotFound=>0, Err(e)=>return Err(err(e)) };
    if before>64*MIB {return Err("CAPACITY_HELD journal".into());}
    if path.with_extension("hqkg.lock").exists() || path.with_extension("hqkg.compact.tmp").exists() || path.with_extension("hqkg.preflight.tmp").exists() { return Err("RECOVERY_REQUIRED artifact".into()); }
    let (mut g,status)=journal.load_with_status().map_err(quarantine)?;
    if status.trailing_bytes!=0 {return Err("RECOVERY_REQUIRED torn journal".into());}
    let prefix=scoped_graph::prefix(&ns).map_err(err)?;
    if g.nodes().any(|n| !n.id.starts_with(&prefix) || n.properties.get("hqkg.namespace")!=Some(&ns.label())) || g.edges().any(|e| !e.id.starts_with(&prefix)) {return Err("namespace conflict".into());}
    g.check_indexes().map_err(err)?;
    let op=text(&v,"op")?;
    if matches!(op,"sync-context"|"sync-context-read") {
        if status.epoch != g.epoch() || status.total_bytes != before {
            return Err("stale synchronized graph head".into());
        }
        return sync_context(&v, &ns, &journal, &mut g, before, scope);
    }
    // Operation ID is a caller-defined bounded identity (engine local-id rules), not
    // necessarily hex; the payload digest remains a strict sha256 requirement.
    let valid_local=|id:&str| !id.is_empty() && id.len()<=120 && !id.chars().any(char::is_control);
    let marker_id=if let Some(id)=v["opId"].as_str() {if !valid_local(id) {return Err("invalid opId".into());} Some(scoped_graph::qualified_id(&ns,&format!("commit-{id}")).map_err(err)?)} else {None};
    if op=="inspect" || op=="query" {
        let marker=marker_id.as_ref().and_then(|id|g.node(id)).map(|n|json!({"opId":n.properties.get("personal.opId"),"payloadDigest":n.properties.get("personal.payloadDigest"),"epoch":g.epoch()}));
        let nodes:Vec<Value>=if op=="query" {g.nodes().filter(|n|!n.properties.contains_key("personal.opId") &&
                    n.properties.get("vivim.context.kind").map(String::as_str)!=Some("tombstone")).map(|n|json!({"id":n.id,"title":n.title,"properties":n.properties})).collect()} else {Vec::new()};
        return Ok(json!({"schema":"vivim.hqkg-personal/1","scope":scope,"epoch":g.epoch(),"bytes":before,"marker":marker,"nodes":nodes}));
    }
    if !["apply","erase","preflight","compact","erase-effects"].contains(&op) {return Err("unknown operation".into());}
    // Preflight is a read-only projection against the live head: it neither consumes
    // nor enforces the caller's expected epoch/bytes. The authoritative staleness
    // recheck happens immediately before mutation (apply/erase/compact).
    if op!="preflight" && (v["expectedEpoch"].as_u64()!=Some(g.epoch()) || v["expectedBytes"].as_u64()!=Some(before)) {return Err("stale epoch/bytes".into());}
    if op=="compact" {let r=journal.compact_verified(before,g.epoch()).map_err(quarantine)?; return Ok(json!({"scope":scope,"epoch":r.epoch,"beforeBytes":r.old_bytes,"bytes":r.new_bytes}));}
    let id=text(&v,"opId")?; let payload=text(&v,"payloadDigest")?; if !hex(payload) {return Err("invalid payload digest".into());}
    let marker_id=marker_id.ok_or("missing opId")?;
    // Targeted fenced erase of one revoked committed effect: removes exactly the
    // recorded proposal nodes/edges plus that effect's marker, then compacts so the
    // removed bytes leave all managed frames. Runs before duplicate handling because
    // the committed marker must not short-circuit the erase.
    if op=="erase-effects" {
        if g.node(&marker_id).is_none() {return Err("EFFECT_NOT_COMMITTED".into());}
        let provenance=Provenance{source:format!("personal:{scope}"),revision:g.epoch()+1,digest:payload.into()};
        let mut changes=GraphChangeSet::new(format!("{prefix}change-revoke-erase-{id}"),&provenance.source);
        if let Some(ids)=v["nodeIds"].as_array() {for n in ids {let local=n.as_str().ok_or("nodeIds must be strings")?;let q=scoped_graph::qualified_id(&ns,local).map_err(err)?;if g.node(&q).is_some() {changes=changes.remove_node(&q,"Host fenced revoked-effect erase",0);}}}
        if let Some(ids)=v["edgeIds"].as_array() {for e in ids {let local=e.as_str().ok_or("edgeIds must be strings")?;let q=scoped_graph::qualified_id(&ns,local).map_err(err)?;if g.edge(&q).is_some() {changes=changes.remove_edge(&q,"Host fenced revoked-effect erase",0);}}}
        changes=changes.remove_node(&marker_id,"Host fenced revoked-effect erase",0);
        let epoch=g.epoch(); scoped_graph::apply_scoped(&mut g,&ns,&RevisionToken{namespace:ns.clone(),graph_epoch:epoch},&changes,&mut ApplyLedger::new()).map_err(err)?;
        let bytes=hqkg::serialize(&g).map_err(err)?;
        if bytes.len() as u64>16*MIB || g.node_count()>20000 || g.edge_count()>50000 {return Err("CAPACITY_HELD graph".into());}
        if journal.status().map_err(quarantine)?.total_bytes!=before {return Err("journal growth conflict".into());}
        journal.save(&g).map_err(quarantine)?;
        // Every erase mandates compaction irrespective of thresholds.
        let s=journal.status().map_err(err)?;
        let r=journal.compact_verified(s.total_bytes,g.epoch()).map_err(quarantine)?;
        let s=journal.status().map_err(quarantine)?; let reopened=journal.load().map_err(quarantine)?; reopened.check_indexes().map_err(err)?;
        if s.trailing_bytes!=0 || s.total_bytes!=r.new_bytes || s.total_bytes!=20+bytes.len() as u64 || reopened.epoch()!=g.epoch() || reopened.node(&marker_id).is_some() {return Err("ERASING_NEEDS_RECOVERY verification".into());}
        return Ok(json!({"schema":"vivim.hqkg-personal/1","scope":scope,"epoch":g.epoch(),"bytes":s.total_bytes,"verificationDigest":format!("{:x}",Sha256::digest(&bytes)),"marker":{"opId":id,"payloadDigest":payload},"erased":true}));
    }
    // Idempotent duplicate handling is for committed effects (apply/erase); preflight
    // always projects the full candidate and never short-circuits on an old marker.
    if op!="preflight" {
        if let Some(n)=g.node(&marker_id) {
            if n.properties.get("personal.payloadDigest").map(String::as_str)!=Some(payload) {
                // A new erase fence (fresh opId/digest) subsumes every prior marker;
                // it removes all historical frames including the old one below.
                if op!="erase" {return Err("marker conflict".into());}
            } else { return Ok(json!({"scope":scope,"epoch":g.epoch(),"bytes":before,"marker":{"opId":id,"payloadDigest":payload},"duplicate":true})); }
        }
    }
    let provenance=Provenance{source:format!("personal:{scope}"),revision:g.epoch()+1,digest:payload.into()};
    let mut changes=GraphChangeSet::new(format!("{prefix}change-{id}"),&provenance.source);
    if op=="erase" {
        let ids:Vec<String>=g.nodes().map(|n|n.id.clone()).collect();
        for id in ids { changes=changes.remove_node(&id,"Host fenced scope erase",0); }
    } else {
        let nodes=v["nodes"].as_array().ok_or("nodes required")?;
        for n in nodes {
            if serde_json::to_vec(n).map_err(err)?.len()>512*1024 {return Err("POLICY_LIMIT object".into());}
            let mut node=scoped_graph::node(&ns,text(n,"id")?,NodeKind::from_str(n["kind"].as_str().unwrap_or("concept")),text(n,"title")?,&provenance).map_err(err)?;
            if let Some(props)=n["properties"].as_object() {for (k,v) in props {if k.starts_with("hqkg.") || k.starts_with("personal.") {return Err("reserved property".into());} node.properties.insert(k.clone(),v.as_str().ok_or("property must be string")?.into());}}
            changes=changes.put_node(node);
        }
        if let Some(edges)=v["edges"].as_array() {for e in edges {let from=scoped_graph::qualified_id(&ns,text(e,"from")?).map_err(err)?;let to=scoped_graph::qualified_id(&ns,text(e,"to")?).map_err(err)?;changes=changes.put_edge(scoped_graph::edge(&ns,text(e,"id")?,&from,text(e,"relation")?,&to,&provenance).map_err(err)?);}}
    }
    let mut marker=scoped_graph::node(&ns,&format!("commit-{id}"),NodeKind::Concept,"Host commit marker",&provenance).map_err(err)?;
    marker.properties.insert("personal.opId".into(),id.into()); marker.properties.insert("personal.payloadDigest".into(),payload.into());
    changes=changes.put_node(marker);
    let epoch=g.epoch(); scoped_graph::apply_scoped(&mut g,&ns,&RevisionToken{namespace:ns.clone(),graph_epoch:epoch},&changes,&mut ApplyLedger::new()).map_err(err)?;
    let bytes=hqkg::serialize(&g).map_err(err)?;
    if bytes.len() as u64>16*MIB || g.node_count()>20000 || g.edge_count()>50000 {return Err("CAPACITY_HELD graph".into());}
    let projected=before+20+bytes.len() as u64;
    if projected>64*MIB {return Err("CAPACITY_HELD journal".into());}
    if op=="preflight" {
        // Exact frame-accurate serialization through a disposable private bounded
        // preflight snapshot written at a Host-side sibling path; the real journal is
        // never created or grown. Cleanup failure holds the operation (PREFLIGHT_CLEANUP_HELD).
        let tmp=path.with_extension("hqkg.preflight.tmp");
        let snapshot=Journal::new(&tmp);
        if let Err(e)=snapshot.save(&g) { let _=fs::remove_file(&tmp); return Err(err(e)); }
        let snap_status=match snapshot.status() { Ok(s)=>s, Err(e)=>{let _=fs::remove_file(&tmp);return Err(err(e));} };
        if snap_status.trailing_bytes!=0 || snap_status.total_bytes!=20+bytes.len() as u64 {
            let _=fs::remove_file(&tmp);
            return Err("PREFLIGHT_SNAPSHOT_INVALID".into());
        }
        if fs::remove_file(&tmp).is_err() { return Err("PREFLIGHT_CLEANUP_HELD".into()); }
        return Ok(json!({"scope":scope,"epoch":epoch,"candidateEpoch":g.epoch(),"payloadBytes":bytes.len(),"projectedBytes":projected,"snapshotBytes":snap_status.total_bytes}));
    }
    // Cadence is explicit: Host journals intent before requesting compaction.
    if op!="erase" && projected>48*MIB {return Err("COMPACTION_REQUIRED".into());}
    if journal.status().map_err(quarantine)?.total_bytes!=before {return Err("journal growth conflict".into());}
    journal.save(&g).map_err(err)?;
    if op=="erase" {
        let s=journal.status().map_err(err)?;
        let r=journal.compact_verified(s.total_bytes,g.epoch()).map_err(quarantine)?;
        let s=journal.status().map_err(quarantine)?; let reopened=journal.load().map_err(quarantine)?; reopened.check_indexes().map_err(err)?;
        if s.trailing_bytes!=0 || s.total_bytes!=r.new_bytes || s.total_bytes!=20+bytes.len() as u64 || reopened.epoch()!=g.epoch() || reopened.node_count()!=1 || reopened.edge_count()!=0 {return Err("ERASING_NEEDS_RECOVERY verification".into());}
    }
    let s=journal.status().map_err(err)?;
    Ok(json!({"schema":"vivim.hqkg-personal/1","scope":scope,"epoch":g.epoch(),"bytes":s.total_bytes,"verificationDigest":format!("{:x}",Sha256::digest(&bytes)),"marker":{"opId":id,"payloadDigest":payload}}))
}
fn main() {match run(){Ok(v)=>println!("{v}"),Err(e)=>{println!("{}",json!({"schema":"vivim.hqkg-personal/1","error":e}));std::process::exit(1);}}}

#[cfg(test)]
mod managed_compaction_cadence_tests {
    use super::*;
    #[test]
    fn append_threshold_is_bounded_and_overflow_safe() {
        assert!(!managed_append_requires_compaction(0,MAX_MANAGED_JOURNAL_BYTES));
        assert!(!managed_append_requires_compaction(
            MAX_MANAGED_JOURNAL_BYTES-20-100,100));
        assert!(managed_append_requires_compaction(
            MAX_MANAGED_JOURNAL_BYTES-20-100,101));
        assert!(managed_append_requires_compaction(u64::MAX,100));
    }
}
