//! NEXT:D02:scoped-query-retrieval — scoped, relevance-ordered native retrieval.
//!
//! Proves that retrieval selects by relevance inside an authorized scope rather
//! than by newest-eight recency, that the budget/item cap bounds output only,
//! and that the managed projection surfaces older relationship-linked evidence
//! with its revision and digest while keeping the durable graph unchanged.
use hqkg::context_retrieval::{query_scoped, ScopedQuery};
use hqkg::{Edge, Graph, Node, NodeKind};
use std::collections::BTreeSet;

fn node(id: &str, title: &str) -> Node {
    Node::new(id, NodeKind::Concept, title)
}

fn query(seeds: &[&str], scope: &str, budget: u64, max_items: usize) -> ScopedQuery {
    ScopedQuery {
        seeds: seeds.iter().map(|s| s.to_string()).collect(),
        scope: scope.to_string(),
        budget_tokens: budget,
        max_items,
        excluded: BTreeSet::new(),
        watermark: None,
    }
}

#[test]
fn scoped_query_ranks_seeds_by_caller_relevance_not_version_or_recency() {
    let mut graph = Graph::new();
    graph.put_node(node("s/new", "new")).unwrap();
    graph.put_node(node("s/old", "old")).unwrap();
    // Raise the older node's version so recency/version ranking would pick it
    // first; caller relevance still puts the newer seed first.
    for _ in 0..2 {
        graph.put_node(node("s/old", "old")).unwrap();
    }
    graph.put_node(node("s/deep", "deep")).unwrap();
    graph
        .put_edge(Edge::new("s-new-deep", "s/new", "relates", "s/deep"))
        .unwrap();

    let bundle = query_scoped(&graph, &query(&["s/new", "s/old"], "s/", 10_000, 8)).unwrap();
    let ids: Vec<&str> = bundle.items.iter().map(|i| i.id.as_str()).collect();
    assert_eq!(ids, ["s/new", "s/old", "s/deep"]);
    assert_eq!(bundle.items[0].depth, 0);
    assert_eq!(bundle.items[1].depth, 0);
    assert_eq!(bundle.items[2].depth, 1);
}

#[test]
fn scoped_query_never_leaves_the_authorized_scope() {
    let mut graph = Graph::new();
    graph.put_node(node("in/a", "a")).unwrap();
    graph.put_node(node("out/b", "b")).unwrap();
    graph
        .put_edge(Edge::new("in-a-out-b", "in/a", "relates", "out/b"))
        .unwrap();

    // Traversal from an in-scope seed cannot reach an out-of-scope neighbour.
    let bundle = query_scoped(&graph, &query(&["in/a"], "in/", 10_000, 8)).unwrap();
    let ids: Vec<&str> = bundle.items.iter().map(|i| i.id.as_str()).collect();
    assert_eq!(ids, ["in/a"]);
    assert!(bundle.edges.is_empty());

    // An out-of-scope seed fails closed instead of widening the scope.
    let err = query_scoped(&graph, &query(&["out/b"], "in/", 10_000, 8)).unwrap_err();
    assert!(matches!(err, hqkg::Error::Invalid(_)), "{err}");
}

#[test]
fn scoped_query_fails_closed_on_unbounded_arguments() {
    let mut graph = Graph::new();
    graph.put_node(node("in/a", "a")).unwrap();
    assert!(matches!(
        query_scoped(&graph, &query(&["in/a"], "", 100, 8)).unwrap_err(),
        hqkg::Error::Invalid(_)
    ));
    assert!(matches!(
        query_scoped(&graph, &query(&["in/a"], "in/", 0, 8)).unwrap_err(),
        hqkg::Error::Invalid(_)
    ));
    assert!(matches!(
        query_scoped(&graph, &query(&["in/a"], "in/", 100, 0)).unwrap_err(),
        hqkg::Error::Invalid(_)
    ));
    let mut excluded = query(&["in/a"], "in/", 100, 8);
    excluded.excluded.insert("in/a".into());
    assert!(matches!(
        query_scoped(&graph, &excluded).unwrap_err(),
        hqkg::Error::Invalid(_)
    ));
}

#[test]
fn scoped_query_budget_and_item_cap_bound_output_only() {
    let mut graph = Graph::new();
    for index in 1..=6 {
        let mut n = node(&format!("b/n{index}"), "0123456789abcdef");
        n.title = "0123456789abcdef".into();
        graph.put_node(n).unwrap();
    }
    graph
        .put_edge(Edge::new("b-n1-n2", "b/n1", "relates", "b/n2"))
        .unwrap();
    let seeds: Vec<String> = (1..=6).map(|i| format!("b/n{i}")).collect();
    let seed_refs: Vec<&str> = seeds.iter().map(String::as_str).collect();

    // Item cap: two seeds fit, the remaining ranked seeds are dropped, and the
    // edge is kept only because both endpoints were selected.
    let capped = query_scoped(&graph, &query(&seed_refs, "b/", 10_000, 2)).unwrap();
    assert_eq!(capped.items.len(), 2);
    assert_eq!(capped.tokens_used, capped.items.iter().map(|i| i.tokens).sum::<u64>());
    assert!(capped.budget_exhausted);
    assert_eq!(capped.edges.len(), 1);

    // Token budget: one 5-token seed fits; the relationship loses an endpoint.
    let bounded = query_scoped(&graph, &query(&seed_refs, "b/", 5, 8)).unwrap();
    assert_eq!(bounded.items.len(), 1);
    assert_eq!(bounded.tokens_used, bounded.items[0].tokens);
    assert!(bounded.budget_exhausted);
    assert!(bounded.edges.is_empty());
}

#[cfg(feature = "importer")]
mod managed {
    use super::*;
    use hqkg::graph_change_set::{ApplyLedger, GraphChangeSet};
    use hqkg::managed_context::project_managed_graph;
    use hqkg::scoped_graph::{self, Provenance};
    use hqkg::typed_dag::{GraphDomain, Namespace, RevisionToken};

    const SCOPE: &str = "abababababababababababababababababababababababababababababababab";
    const DIGEST: &str = "3333333333333333333333333333333333333333333333333333333333333333";

    fn ns() -> Namespace {
        Namespace { domain: GraphDomain::Personal, owner: format!("pk-{SCOPE}") }
    }

    fn provenance(source: &str, revision: u64) -> Provenance {
        Provenance { source: source.into(), revision, digest: DIGEST.into() }
    }

    /// Stage scoped records through the existing change-set/apply path, exactly
    /// like the durable importer; no second graph or writer is introduced.
    fn apply(graph: &mut Graph, nodes: Vec<Node>, edges: Vec<Edge>) {
        let epoch = graph.epoch();
        let prefix = scoped_graph::prefix(&ns()).unwrap();
        let mut changes = GraphChangeSet::new(format!("{prefix}test-managed"), "host-context");
        for node in nodes {
            changes = changes.put_node(node);
        }
        for edge in edges {
            changes = changes.put_edge(edge);
        }
        scoped_graph::apply_scoped(graph, &ns(),
            &RevisionToken { namespace: ns(), graph_epoch: epoch },
            &changes, &mut ApplyLedger::new()).unwrap();
    }

    #[allow(clippy::too_many_arguments)]
    fn wiki(index: u64, title: &str, order: u64, revision: u64, semantic: &str, summary: &str) -> Node {
        let local = format!("vivim-context-w-{index:064x}");
        let source_ref = format!("entry-{index}");
        let mut n = scoped_graph::node(&ns(), &local, NodeKind::Concept, title,
            &provenance(&format!("host-product-journal:{source_ref}"), revision)).unwrap();
        n.properties.insert("vivim.context.kind".into(), "wiki".into());
        n.properties.insert("vivim.context.sourceRef".into(), source_ref);
        n.properties.insert("vivim.context.sourceRevision".into(), revision.to_string());
        n.properties.insert("vivim.context.order".into(), order.to_string());
        n.properties.insert("vivim.context.summary".into(), summary.into());
        n.properties.insert("vivim.context.semanticId".into(), semantic.into());
        n
    }

    fn link(from: u64, to: u64) -> Edge {
        let from_id = scoped_graph::qualified_id(&ns(), &format!("vivim-context-w-{from:064x}")).unwrap();
        let to_id = scoped_graph::qualified_id(&ns(), &format!("vivim-context-w-{to:064x}")).unwrap();
        let local = format!("vivim-context-p-{:064x}", from * 1000 + to);
        let mut e = scoped_graph::edge(&ns(), &local, &from_id, "wiki-page-link", &to_id,
            &provenance("host-product-journal:link", 3)).unwrap();
        e.properties.insert("vivim.context.kind".into(), "wiki-page-link".into());
        e.properties.insert("vivim.context.sourceRef".into(), "entry-link".into());
        e
    }

    #[test]
    fn older_linked_source_is_returned_without_newest_eight_selection() {
        let mut graph = Graph::new();
        // Oldest source (order 1) is linked by the newest page (order 91).
        let mut nodes = vec![wiki(1, "Old committed page", 1, 3, "wiki:page:Old", "Older committed text")];
        for index in 2..=10u64 {
            let semantic = if index == 10 { "wiki:page:Recent" } else { "wiki:section:Main/Recent" };
            nodes.push(wiki(index, "Recent page", 100 - index, 3,
                semantic, "Recent committed text"));
        }
        apply(&mut graph, nodes, vec![link(10, 1)]);
        let epoch = graph.epoch();

        let value = project_managed_graph(&graph, SCOPE, epoch, "wiki").unwrap();
        assert_eq!(value["epoch"], epoch);
        assert_eq!(value["totalRetrieved"], 10);
        assert_eq!(value["budgetTokens"], 320);
        let items = value["items"].as_array().unwrap();
        assert!(!items.is_empty() && items.len() <= 8, "{}", value);
        assert!(items.iter().all(|i| i["depth"] == 0 && i["sourceCount"] == 1));
        // The older linked source is retrieved even though recency alone would
        // rank it last of ten; no unlinked newer page displaces it.
        assert_eq!(items[0]["sourceRef"], "entry-1", "{value}");
        assert_eq!(items[0]["revision"], 3);
        assert_eq!(items[0]["sourceDigest"], DIGEST);
        assert_eq!(items[0]["summary"], "Older committed text");
        let selected: Vec<&str> = items.iter().map(|i| i["sourceRef"].as_str().unwrap()).collect();
        assert!(selected.iter().all(|r| *r == "entry-1" || *r == "entry-10"), "{value}");
        // Output budget bounds the projection; the durable count is unchanged.
        assert!(value["tokensUsed"].as_u64().unwrap() <= 320);
        assert_eq!(value["tokensUsed"],
            items.iter().map(|i| i["estimatedTokens"].as_u64().unwrap()).sum::<u64>());
        // Bounded relationships keep their revision and digest.
        let links = value["pageRelationships"].as_array().unwrap();
        assert_eq!(links.len(), 1);
        assert_eq!(links[0]["revision"], 3);
        assert_eq!(links[0]["digest"], DIGEST);
        assert_eq!(links[0]["to"], format!("vivim-context-w-{:064x}", 1));
    }

    #[test]
    fn no_links_degenerates_to_recency_and_stays_bounded() {
        let mut graph = Graph::new();
        let nodes = (1..=10u64).map(|index| wiki(index, "Recent page", index, 3,
            "wiki:section:Main/Recent", "Recent committed text")).collect();
        apply(&mut graph, nodes, vec![]);
        let epoch = graph.epoch();
        let value = project_managed_graph(&graph, SCOPE, epoch, "wiki").unwrap();
        assert_eq!(value["totalRetrieved"], 10);
        let items = value["items"].as_array().unwrap();
        assert!(items.len() <= 8, "{}", value);
        assert_eq!(items[0]["sourceRef"], "entry-10");
        assert!(value["budgetExhausted"].as_bool().unwrap());
        assert!(value["pageRelationships"].as_array().unwrap().is_empty());
    }

    #[test]
    fn owner_view_includes_effects_and_wiki_view_does_not() {
        let local = format!("vivim-context-e-{:064x}", 2);
        let mut effect = scoped_graph::node(&ns(), &local, NodeKind::Concept, "Applied effect",
            &provenance("host-control-receipt:ctl-1", 2)).unwrap();
        effect.properties.insert("vivim.context.kind".into(), "effect".into());
        effect.properties.insert("vivim.context.sourceRef".into(), "ctl-1".into());
        effect.properties.insert("vivim.context.sourceRevision".into(), "2".into());
        effect.properties.insert("vivim.context.order".into(), "3".into());
        effect.properties.insert("vivim.context.summary".into(), "Historical receipt".into());
        effect.properties.insert("vivim.context.semanticId".into(), "receipt:ctl-1".into());
        let mut graph = Graph::new();
        apply(&mut graph,
            vec![wiki(1, "Committed page", 2, 2, "wiki:page:Main", "Committed text"), effect],
            vec![]);
        let epoch = graph.epoch();

        let phone = project_managed_graph(&graph, SCOPE, epoch, "wiki").unwrap();
        assert_eq!(phone["totalRetrieved"], 1);
        assert_eq!(phone["items"][0]["kind"], "wiki");
        let owner = project_managed_graph(&graph, SCOPE, epoch, "owner").unwrap();
        assert_eq!(owner["totalRetrieved"], 2);
        assert!(owner["items"].as_array().unwrap().iter().any(|i| i["kind"] == "effect"));
    }
}