//! Shared managed context projection. Native retrieval is reused by both
//! existing CLIs; neither creates a second graph or authorizes Host effects.
use crate::{Error, Graph, Journal, JournalStatus, Result};
use crate::context_retrieval::{query_scoped, ScopedQuery};
use crate::scoped_graph;
use crate::typed_dag::{GraphDomain, Namespace};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::{collections::{BTreeMap, BTreeSet}, fs, path::Path};

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

// A compacted journal carries each managed deletion fence as native graph
// metadata. Validate every fence before serving any source projection; a
// corrupted or cross-kind fence must never be silently skipped because it is
// not itself eligible for the eight-item presentation window. Hash the whole
// fence set independently from the currently selected source manifest.
pub fn deletion_fence_manifest(graph: &Graph, prefix: &str) -> Result<(usize,String)> {
    let mut proof=Vec::new();
    for node in graph.nodes().filter(|n|
        n.id.starts_with(&format!("{prefix}vivim-context-t-")) ||
        (n.id.starts_with(&format!("{prefix}vivim-context-")) &&
         n.properties.get("vivim.context.kind").map(String::as_str)==Some("tombstone"))) {
        let p=&node.properties;
        let invalid=||Error::Corrupt("invalid durable managed deletion fence".into());
        let local=p.get("vivim.context.deletedId").ok_or_else(invalid)?;
        let kind=p.get("vivim.context.deletedKind").ok_or_else(invalid)?;
        let good_id=match kind.as_str() {
            "wiki"=>local.strip_prefix("vivim-context-w-"),
            "effect"=>local.strip_prefix("vivim-context-e-"),
            _=>None,
        };
        if !good_id.is_some_and(|part|part.len()==64 &&
            part.bytes().all(|b|b.is_ascii_digit() || (b'a'..=b'f').contains(&b))) ||
            node.id != format!("{prefix}vivim-context-t-{:x}",Sha256::digest(local.as_bytes())) ||
            p.get("vivim.context.kind").map(String::as_str)!=Some("tombstone") {
            return Err(invalid());
        }
        let high=p.get("hqkg.provenance.revision")
            .and_then(|v|v.parse::<u64>().ok()).ok_or_else(invalid)?;
        let deleted=p.get("vivim.context.deletedRevision")
            .and_then(|v|v.parse::<u64>().ok()).ok_or_else(invalid)?;
        let source_ref=p.get("vivim.context.sourceRef").ok_or_else(invalid)?;
        let source=p.get("hqkg.provenance.source").ok_or_else(invalid)?;
        let digest=p.get("hqkg.provenance.digest").ok_or_else(invalid)?;
        let semantic=p.get("vivim.context.deletedSemanticId");
        if semantic.is_some_and(|id|if kind=="wiki" {
            !id.starts_with("wiki:section:") && !id.starts_with("wiki:page:")
        } else { !id.starts_with("receipt:") }) {
            return Err(invalid());
        }
        if let Some(body)=p.get("vivim.context.receiptDigest") {
            if kind!="effect" || body.len()!=64 ||
                !body.bytes().all(|b|b.is_ascii_digit() || (b'a'..=b'f').contains(&b)) {
                return Err(invalid());
            }
        }
        let expected_source=if kind=="wiki"{"host-product-journal:"}
            else {"host-control-receipt:"};
        if high==0 || deleted==0 || high<deleted ||
            source!=&format!("{expected_source}{source_ref}") ||
            digest.len()!=64 ||
            !digest.bytes().all(|b|b.is_ascii_digit() || (b'a'..=b'f').contains(&b)) {
            return Err(invalid());
        }
        if let Some(live)=graph.node(&format!("{prefix}{local}")) {
            let revision=live.properties.get("hqkg.provenance.revision")
                .and_then(|v|v.parse::<u64>().ok()).ok_or_else(invalid)?;
            if kind=="effect" || revision<=high ||
                live.properties.get("vivim.context.kind")!=Some(kind) {
                return Err(invalid());
            }
        }
        proof.push(json!([local,kind,source_ref,digest,high,deleted,
            semantic,p.get("vivim.context.receiptDigest")]));
    }
    let encoded=serde_json::to_vec(&proof)
        .map_err(|e|Error::Invalid(format!("deletion fence proof encoding: {e}")))?;
    Ok((proof.len(),format!("{:x}",Sha256::digest(&encoded))))
}

// Project the actual replayed durable graph, not the requested input packet.
// Candidate selection is relevance-driven, not recency-driven: every context
// node of this view stays retrievable, and the scoped query budget bounds the
// output rather than the reachable set.
pub fn project_managed_graph(graph: &Graph, scope: &str, epoch:u64, view:&str) -> Result<Value> {
    project_managed_graph_selected(graph,scope,epoch,view,None,None)
}

/// Limit retrieval to the exact currently verified Host source identities.
/// The complete durable graph is never rewritten just to change the read window.
/// This is a selection fence, not a grant: scope, namespace and source admission
/// remain mandatory, and only graph-backed records can be returned.
pub fn project_managed_graph_selected(
    graph: &Graph, scope: &str, epoch:u64, view:&str,
    active: Option<&BTreeSet<String>>,
    active_links: Option<&BTreeSet<String>>
) -> Result<Value> {
    let (ns,prefix)=scope_prefix(scope,view)?;
    graph.check_indexes()?;
    scoped_graph::validate_scope(graph,&ns)?;
    if graph.epoch()!=epoch ||
        graph.nodes().any(|n| !n.id.starts_with(&prefix) ||
            n.properties.get("hqkg.namespace")!=Some(&ns.label())) ||
        graph.edges().any(|e| !e.id.starts_with(&prefix)) {
        return Err(Error::Conflict("managed graph scope or epoch mismatch".into()));
    }
    let (deletion_fences_total,deletion_fences_digest)=
        deletion_fence_manifest(graph,&prefix)?;
    let mut candidates = Vec::new();
    let mut orders: BTreeMap<String,u64> = BTreeMap::new();
    for node in graph.nodes() {
        let kind = node.properties.get("vivim.context.kind").map(String::as_str);
        let typed_id=match kind {
            Some("wiki")=>node.id.starts_with(&format!("{prefix}vivim-context-w-")),
            Some("effect")=>node.id.starts_with(&format!("{prefix}vivim-context-e-")),
            _=>false,
        };
        if !typed_id || !(kind == Some("wiki") || (view == "owner" && kind == Some("effect"))) ||
            active.is_some_and(|ids| !ids.contains(node.id.strip_prefix(&prefix).unwrap_or(""))) {
            continue;
        }
        let order = node.properties.get("vivim.context.order")
            .and_then(|v| v.parse::<u64>().ok()).ok_or_else(|| Error::Corrupt("context order".into()))?;
        orders.insert(node.id.clone(), order);
        candidates.push(node.id.clone());
    }
    let total = candidates.len();
    // The bounded display (eight items) is not sufficient to attest to the
    // thousands of admitted source records below it. Hash *every* selected
    // durable source, including current semantic identity, owner receipt body
    // fingerprint, revision and source digest. The Host reconstructs this
    // manifest directly from its committed sources and requires an exact hash.
    // BTreeMap order is canonical qualified-ID order; every ID shares one
    // namespace prefix, so the Host's local-ID order is identical.
    let manifest:Vec<Value>=orders.keys().map(|id| {
        let node=graph.node(id).ok_or_else(||
            Error::Corrupt("active context manifest node missing".into()))?;
        let p=&node.properties;
        let local=id.strip_prefix(&prefix).ok_or_else(||
            Error::Corrupt("active context manifest scope mismatch".into()))?;
        let revision=p.get("hqkg.provenance.revision")
            .and_then(|s|s.parse::<u64>().ok()).ok_or_else(||
                Error::Corrupt("active context manifest revision missing".into()))?;
        let source_revision=p.get("vivim.context.sourceRevision")
            .and_then(|s|s.parse::<u64>().ok());
        let wiki_revision=p.get("vivim.context.wikiRevision")
            .and_then(|s|s.parse::<u64>().ok());
        Ok(json!([
            local,p.get("vivim.context.kind"),
            p.get("vivim.context.sourceRef"),
            p.get("hqkg.provenance.digest"),
            revision,source_revision,orders[id],node.title.as_str(),
            p.get("vivim.context.summary"),
            p.get("vivim.context.semanticId"),
            p.get("vivim.context.actionId"),
            p.get("vivim.context.receiptDigest"),
            p.get("vivim.context.wikiEntryId"),wiki_revision
        ]))
    }).collect::<Result<Vec<_>>>()?;
    let manifest_bytes=serde_json::to_vec(&manifest)
        .map_err(|e|Error::Invalid(format!("active context manifest encoding: {e}")))?;
    let manifest_digest=format!("{:x}",Sha256::digest(&manifest_bytes));
    // One bounded relationship scan feeds both relevance and the emitted page
    // relationships; every relationship keeps its revision and digest.
    let mut inbound: BTreeMap<String,u64> = candidates.iter().map(|id| (id.clone(),0)).collect();
    let mut outbound: BTreeMap<String,u64> = candidates.iter().map(|id| (id.clone(),0)).collect();
    let mut page_relationships = Vec::new();
    for edge in graph.edges() {
        if !edge.id.starts_with(&format!("{prefix}vivim-context-p-")) ||
            edge.properties.get("vivim.context.kind").map(String::as_str) != Some("wiki-page-link") {
            continue;
        }
        // A stale page-link edge cannot bring an inactive source back into a
        // phone or owner context view by its relationship endpoints.
        if active.is_some() && (!orders.contains_key(&edge.from) || !orders.contains_key(&edge.to)) {
            continue;
        }
        if active_links.is_some_and(|ids|
            !ids.contains(edge.id.strip_prefix(&prefix).unwrap_or(""))) {
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
        if let Some(count)=outbound.get_mut(edge.from.as_str()) { *count+=1; }
        if let Some(count)=inbound.get_mut(edge.to.as_str()) { *count+=1; }
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
    // D4 effect lineage is owner-only and sourced from the existing durable
    // graph edges, never inferred from matching titles or journal recency.
    // Omitted or superseded links remain historical, not live Wiki authority.
    let mut effect_relationships=Vec::new();
    if view=="owner" {
        for edge in graph.edges() {
            if !edge.id.starts_with(&format!("{prefix}vivim-context-l-")) ||
                edge.properties.get("vivim.context.kind").map(String::as_str)!=Some("effect-wiki-link") {
                continue;
            }
            if active.is_some() && (!orders.contains_key(&edge.from) || !orders.contains_key(&edge.to)) {
                continue;
            }
            let receipt=graph.node(&edge.from)
                .ok_or_else(||Error::Corrupt("D4 receipt endpoint missing".into()))?;
            let wiki=graph.node(&edge.to)
                .ok_or_else(||Error::Corrupt("D4 Wiki endpoint missing".into()))?;
            if receipt.properties.get("vivim.context.kind").map(String::as_str)!=Some("effect") ||
                wiki.properties.get("vivim.context.kind").map(String::as_str)!=Some("wiki") ||
                edge.relation!="committed-wiki-change" {
                return Err(Error::Corrupt("invalid D4 lineage edge".into()));
            }
            let expected_ref=receipt.properties.get("vivim.context.wikiEntryId");
            let source_ref=wiki.properties.get("vivim.context.sourceRef");
            let expected_rev=receipt.properties.get("vivim.context.wikiRevision")
                .and_then(|s|s.parse::<u64>().ok());
            let source_rev=wiki.properties.get("hqkg.provenance.revision")
                .and_then(|s|s.parse::<u64>().ok());
            if expected_ref!=source_ref || expected_rev.is_none() || expected_rev!=source_rev {
                continue; // a historical superseded edge is not current lineage
            }
            let receipt_ref=receipt.properties.get("vivim.context.sourceRef")
                .ok_or_else(||Error::Corrupt("missing D4 receipt identity".into()))?;
            let receipt_digest=receipt.properties.get("hqkg.provenance.digest")
                .ok_or_else(||Error::Corrupt("missing D4 receipt digest".into()))?;
            let body_digest=receipt.properties.get("vivim.context.receiptDigest");
            effect_relationships.push(json!({
                "id":edge.id.strip_prefix(prefix.as_str()),
                "from":edge.from.strip_prefix(prefix.as_str()),
                "to":edge.to.strip_prefix(prefix.as_str()),
                "kind":edge.relation,"sourceRef":receipt_ref,
                "sourceDigest":receipt_digest,"receiptDigest":body_digest,
                "wikiEntryId":source_ref,
                "wikiRevision":source_rev
            }));
        }
    }
    effect_relationships.sort_by(|a,b|a["id"].as_str().cmp(&b["id"].as_str()));
    // Hash *all* active lineage edges in canonical order, not merely the
    // bounded presentation subset. The Host independently constructs this
    // proof from admitted current section and applied receipt identities.
    let effect_proof: Vec<Value> = effect_relationships.iter().map(|e|json!([
        e["id"],e["from"],e["to"],e["kind"],e["sourceRef"],
        e["sourceDigest"],e["receiptDigest"],e["wikiEntryId"],e["wikiRevision"]
    ])).collect();
    let effect_bytes=serde_json::to_vec(&effect_proof)
        .map_err(|e|Error::Invalid(format!("D4 lineage encoding: {e}")))?;
    let effect_digest=format!("{:x}",Sha256::digest(&effect_bytes));
    let effect_total=effect_relationships.len();
    let omitted_effects=effect_total.saturating_sub(24);
    effect_relationships.truncate(24);
    // Relevance decides seed order: pages other pages point at (inbound
    // relationships) are the most relevant, then pages that point at others,
    // then recency. Newest-eight selection and excluded-node traversal are gone.
    candidates.sort_by(|a,b| inbound[b.as_str()].cmp(&inbound[a.as_str()])
        .then(outbound[b.as_str()].cmp(&outbound[a.as_str()]))
        .then(orders[b.as_str()].cmp(&orders[a.as_str()])).then(a.cmp(b)));
    let mut items = Vec::new();
    let mut tokens = 0;
    if !candidates.is_empty() {
        // Only out-of-view graph nodes stay excluded; every candidate is a
        // seed, so an older source is retrievable on its own relevance.
        let excluded = graph.nodes().filter(|n| !orders.contains_key(&n.id)).map(|n| n.id.clone()).collect();
        let bundle = query_scoped(graph, &ScopedQuery { seeds: candidates, scope: prefix.clone(),
            budget_tokens: 320, max_items: MAX_ITEMS, excluded, watermark: None })?;
        if bundle.stale_count != 0 || bundle.epoch != epoch { return Err(Error::Conflict("stale managed context".into())); }
        tokens = bundle.tokens_used;
        for item in bundle.items {
            let node = graph.node(&item.id).ok_or_else(|| Error::Corrupt("context source missing".into()))?;
            let p = &node.properties;
            let revision = p.get("hqkg.provenance.revision").and_then(|v| v.parse::<u64>().ok())
                .ok_or_else(|| Error::Corrupt("context revision".into()))?;
            let source_revision = p.get("vivim.context.sourceRevision").and_then(|v| v.parse::<u64>().ok());
            let mut presented=json!({"title":safe_title(&item.title),"depth":item.depth,"revision":revision,
                "sourceCount":item.sources.len(),"estimatedTokens":item.tokens,
                "kind":p.get("vivim.context.kind"),"sourceRef":p.get("vivim.context.sourceRef"),
                "sourceDigest":p.get("hqkg.provenance.digest"),"sourceRevision":source_revision,
                "summary":p.get("vivim.context.summary")});
            if let Some(receipt_body)=p.get("vivim.context.receiptDigest") {
                presented["receiptDigest"]=json!(receipt_body);
            }
            items.push(presented);
        }
    }
    let exhausted = total > items.len();
    let mut result=json!({"schema":SCHEMA,"state":"source-backed","core":"hqkg","authority":"read-only",
        "seed":format!("managed:{view}"),"epoch":epoch,"tokensUsed":tokens,"budgetTokens":320,
        "budgetExhausted":exhausted,"staleCount":0,"totalRetrieved":total,"items":items,
        "activeSourcesTotal":total,"activeSourcesDigest":manifest_digest,
        "deletionFencesTotal":deletion_fences_total,
        "deletionFencesDigest":deletion_fences_digest,
        "pageRelationships":page_relationships});
    if view=="owner" {
        result["effectRelationships"]=json!(effect_relationships);
        result["effectRelationshipsTotal"]=json!(effect_total);
        result["effectRelationshipsDigest"]=json!(effect_digest);
        result["omittedEffectRelationships"]=json!(omitted_effects);
    }
    Ok(result)
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
