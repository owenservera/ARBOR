// native/hqkg/tests/invalidate-revision.rs
//
// Partition 5 of roadmap item A06 (Incremental RDCB context with reuse receipts).
// Write scope: THIS FILE ONLY.
//
// Tests the partition-2 additions to native/hqkg/src/invalidate.rs:
//   CallerId, SourceRevision, store_with_caller_and_sources,
//   lookup_with_caller, seed_state_with_caller, invalidate_revision.
//
// Acceptance criteria covered:
//   - Revision-scoped invalidation: a changed source revision drops exactly the
//     bundles whose recorded source revisions touch it, and only those.
//   - Watermark fail-closed: a stale/absent watermark rejects the hit; no
//     stale-hit acceptance.
//   - Cross-user isolation: an entry stored for one caller is never served to
//     another caller (namespaces do not authenticate; caller identity is explicit).
//
// Modeled on tests/invalidate.rs (OVN-B lane 5) and tests/context_retrieval.rs
// (OVN-B lane 4).

use hqkg::context_retrieval::{retrieve, ContextBundle, ContextRequest};
use hqkg::graph_change_set::ApplyReport;
use hqkg::invalidate::{
    CallerId, InvalidateCache, SourceRevision,
};
use hqkg::scoped_graph::{gate_serve, Provenance};
use hqkg::typed_dag::{GraphDomain, Namespace, RevisionToken};
use hqkg::{Edge, Graph, Node, NodeKind};
use std::collections::{BTreeMap, BTreeSet};

fn ns(owner: &str) -> Namespace {
    Namespace {
        domain: GraphDomain::Development,
        owner: owner.into(),
    }
}

fn node(id: &str) -> Node {
    Node::new(id, NodeKind::Concept, id)
}

fn request(seeds: &[&str], budget: u64) -> ContextRequest {
    ContextRequest {
        seeds: seeds.iter().map(|s| s.to_string()).collect(),
        budget_tokens: budget,
        excluded: BTreeSet::new(),
        watermark: None,
    }
}

fn chain() -> Graph {
    let mut g = Graph::new();
    for id in ["a", "b", "c"] {
        g.put_node(node(id)).unwrap();
    }
    g.put_edge(Edge::new("e1", "a", "relates", "b")).unwrap();
    g.put_edge(Edge::new("e2", "b", "relates", "c")).unwrap();
    g
}

fn bundle_for(graph: &Graph, req: &ContextRequest) -> ContextBundle {
    retrieve(graph, req).unwrap()
}

fn caller_a() -> CallerId {
    CallerId::new("user-a", "ns-a")
}
fn caller_b() -> CallerId {
    CallerId::new("user-b", "ns-b")
}

fn source_rev(source: &str, revision: u64) -> SourceRevision {
    SourceRevision::new(source, revision, "0".repeat(64))
}

#[test]
fn revision_scoped_invalidation_drops_only_affected_bundles() {
    // Two disconnected components: bundles never share entities.
    let mut g = chain();
    g.put_node(node("z")).unwrap();

    let mut cache = InvalidateCache::new(8);
    let caller = caller_a();

    // Bundle A touches {a, b, e1}; bundle Z touches {z}.
    let req_a = request(&["a"], 10_000);
    let bundle_a = bundle_for(&g, &req_a);
    let rev_a = source_rev("apps/vivim-host/public/demo/controller.js", 1);
    cache.store_with_caller_and_sources(g.epoch(), caller.clone(), &req_a, &bundle_a, &[rev_a]);

    let req_z = request(&["z"], 10_000);
    let bundle_z = bundle_for(&g, &req_z);
    let rev_z = source_rev("apps/vivim-host/public/demo/demo.html", 1);
    cache.store_with_caller_and_sources(g.epoch(), caller.clone(), &req_z, &bundle_z, &[rev_z]);

    assert_eq!(cache.exact_len(), 2);

    // Change only controller.js: revision 2 invalidates bundle A only.
    let rev_a2 = source_rev("apps/vivim-host/public/demo/controller.js", 2);
    let report = ApplyReport {
        change_set_id: "cs".into(),
        duplicate: false,
        applied: 1,
        skipped: 0,
        invalidation_set: BTreeSet::from(["a".into(), "e1".into()]),
        tombstones: vec![],
    };
    cache.invalidate_revision(g.epoch(), &[rev_a2], &report);

    // Bundle A is gone (its source revision changed + its touched entities invalidated).
    assert!(cache
        .lookup_with_caller(g.epoch(), &caller, &BTreeMap::new(), &req_a)
        .is_none());
    // Bundle Z survives — its source revision and touched entities are untouched.
    let mark_z: BTreeMap<String, u64> = bundle_z
        .items
        .iter()
        .map(|i| (i.id.clone(), i.version))
        .collect();
    assert_eq!(
        cache
            .lookup_with_caller(g.epoch(), &caller, &mark_z, &req_z)
            .unwrap(),
        bundle_z
    );
    assert_eq!(cache.exact_len(), 1);
}

#[test]
fn unchanged_revision_serves_bundle_via_lookup_with_caller() {
    let g = chain();
    let mut cache = InvalidateCache::new(8);
    let caller = caller_a();
    let req = request(&["a"], 10_000);
    let bundle = bundle_for(&g, &req);
    let rev = source_rev("apps/vivim-host/public/demo/poll-round.mjs", 1);

    cache.store_with_caller_and_sources(g.epoch(), caller.clone(), &req, &bundle, &[rev]);

    // Build a watermark that confirms every retrieved node version.
    let mark: BTreeMap<String, u64> = bundle.items.iter().map(|i| (i.id.clone(), i.version)).collect();
    let hit = cache.lookup_with_caller(g.epoch(), &caller, &mark, &req);
    assert_eq!(hit.unwrap(), bundle);
    assert_eq!(cache.exact_len(), 1);
}

#[test]
fn caller_mismatch_rejects_reuse_fail_closed() {
    let g = chain();
    let mut cache = InvalidateCache::new(8);
    let req = request(&["a"], 10_000);
    let bundle = bundle_for(&g, &req);
    let rev = source_rev("apps/vivim-host/public/demo/controller.js", 1);

    // Stored for caller A.
    cache.store_with_caller_and_sources(g.epoch(), caller_a(), &req, &bundle, &[rev]);

    let mark: BTreeMap<String, u64> = bundle.items.iter().map(|i| (i.id.clone(), i.version)).collect();

    // Caller B must never be served caller A's bundle. A failed lookup drops
    // the entry (no stale-hit acceptance), so exact_len goes to 0 after this.
    assert!(cache
        .lookup_with_caller(g.epoch(), &caller_b(), &mark, &req)
        .is_none());
    assert_eq!(cache.exact_len(), 0); // entry dropped by the failed cross-caller lookup
}

#[test]
fn stale_watermark_rejects_and_drops_entry() {
    let mut g = chain();
    // Bump "b" to version 2 so a caller claiming version 1 is stale.
    let mut b = node("b");
    b.title = "b".into();
    g.put_node(b).unwrap();

    let mut cache = InvalidateCache::new(8);
    let caller = caller_a();
    let req = request(&["a"], 10_000);
    let bundle = bundle_for(&g, &req);
    let rev = source_rev("apps/vivim-host/public/demo/controller.js", 1);
    cache.store_with_caller_and_sources(g.epoch(), caller.clone(), &req, &bundle, &[rev]);

    // Stale watermark: claims "b" at version 1, graph is at version 2.
    let mut stale = BTreeMap::new();
    for item in &bundle.items {
        stale.insert(
            item.id.clone(),
            if item.id == "b" { 1 } else { item.version },
        );
    }
    assert!(cache
        .lookup_with_caller(g.epoch(), &caller, &stale, &req)
        .is_none());
    assert_eq!(cache.exact_len(), 0); // entry dropped, not left behind
}

#[test]
fn absent_watermark_never_hits_fail_closed() {
    let g = chain();
    let mut cache = InvalidateCache::new(8);
    let caller = caller_a();
    let req = request(&["a"], 10_000);
    let bundle = bundle_for(&g, &req);
    let rev = source_rev("apps/vivim-host/public/demo/controller.js", 1);
    cache.store_with_caller_and_sources(g.epoch(), caller.clone(), &req, &bundle, &[rev]);

    // A caller with no confirmed view (empty watermark) can never validate a hit.
    assert!(cache
        .lookup_with_caller(g.epoch(), &caller, &BTreeMap::new(), &req)
        .is_none());
    assert_eq!(cache.exact_len(), 0);
}

#[test]
fn seed_state_with_caller_is_caller_scoped() {
    let g = chain();
    let mut cache = InvalidateCache::new(8);
    let req = request(&["a"], 10_000);
    let bundle = bundle_for(&g, &req);
    let rev = source_rev("apps/vivim-host/public/demo/poll-round.mjs", 1);
    cache.store_with_caller_and_sources(g.epoch(), caller_a(), &req, &bundle, &[rev]);

    let mark: BTreeMap<String, u64> = bundle.items.iter().map(|i| (i.id.clone(), i.version)).collect();

    assert!(cache.seed_state_with_caller(g.epoch(), &caller_a(), &mark, "a").is_some());
    // Caller B's probe on caller A's contribution is rejected.
    assert!(cache.seed_state_with_caller(g.epoch(), &caller_b(), &mark, "a").is_none());
}

#[test]
fn gate_serve_rejects_cross_namespace_and_stale_provenance() {
    let caller = ns("owner-a");
    let other = ns("owner-b");
    let prov = Provenance {
        source: "trusted-file".into(),
        revision: 1,
        digest: "0".repeat(64),
    };
    let token = RevisionToken {
        namespace: caller.clone(),
        graph_epoch: 1,
    };

    // Valid gate succeeds.
    assert!(gate_serve(&caller, &prov, &token).is_ok());

    // Cross-namespace revision token is rejected.
    let foreign_token = RevisionToken {
        namespace: other.clone(),
        graph_epoch: 1,
    };
    assert!(gate_serve(&caller, &prov, &foreign_token).is_err());

    // Zero revision is rejected.
    let bad_prov = Provenance {
        source: "trusted-file".into(),
        revision: 0,
        digest: "0".repeat(64),
    };
    assert!(gate_serve(&caller, &bad_prov, &token).is_err());

    // Empty source is rejected.
    let empty_source = Provenance {
        source: "".into(),
        revision: 1,
        digest: "0".repeat(64),
    };
    assert!(gate_serve(&caller, &empty_source, &token).is_err());
}

#[test]
fn invalidate_revision_entity_set_only_affects_touched_bundles() {
    // Bundle A touches {a, b, e1}; bundle Z touches {z}.
    let mut g = chain();
    g.put_node(node("z")).unwrap();

    let mut cache = InvalidateCache::new(8);
    let caller = caller_a();
    let rev = source_rev("apps/vivim-host/public/demo/controller.js", 1);

    let req_a = request(&["a"], 10_000);
    let bundle_a = bundle_for(&g, &req_a);
    cache.store_with_caller_and_sources(g.epoch(), caller.clone(), &req_a, &bundle_a, &[rev.clone()]);

    let req_z = request(&["z"], 10_000);
    let bundle_z = bundle_for(&g, &req_z);
    cache.store_with_caller_and_sources(g.epoch(), caller.clone(), &req_z, &bundle_z, &[rev]);

    assert_eq!(cache.exact_len(), 2);

    // Entity invalidation scoped to an entity only A touched: Z survives.
    let report = ApplyReport {
        change_set_id: "cs".into(),
        duplicate: false,
        applied: 1,
        skipped: 0,
        invalidation_set: BTreeSet::from(["b".into()]),
        tombstones: vec![],
    };
    cache.invalidate_revision(g.epoch(), &[], &report);

    assert!(cache
        .lookup_with_caller(g.epoch(), &caller, &BTreeMap::new(), &req_a)
        .is_none());
    let mark_z: BTreeMap<String, u64> = bundle_z
        .items
        .iter()
        .map(|i| (i.id.clone(), i.version))
        .collect();
    assert_eq!(
        cache
            .lookup_with_caller(g.epoch(), &caller, &mark_z, &req_z)
            .unwrap(),
        bundle_z
    );
    assert_eq!(cache.exact_len(), 1);
}
