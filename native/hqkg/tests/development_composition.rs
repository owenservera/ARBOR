#![cfg(all(feature = "importer", feature = "native-program"))]

use hqkg::{Graph, Node, NodeKind, Edge};
use hqkg::import::{Exchange, Manifest};
use hqkg::development_engine::install_development_engine;
use hqkg::engine::{Budget, CancellationToken, EngineRegistry};
use hqkg::typed_dag::{GraphDomain, Namespace, RevisionToken, IncrementalCache, RunState, OutputState};
use vivim_programmability_core::{Program, PolicyLimits, TransformStep, SourceRef, TransformKind, DataClass, Risk};
use serde_json::Value;
use std::collections::BTreeMap;

fn graph() -> Graph {
    let mut nodes = BTreeMap::new();
    for id in ["root", "dependency", "consumer"] {
        let mut node = Node::new(id, NodeKind::Other("source-file".into()), id);
        node.properties.insert("hqkg.exchange.source".into(), "repos-hq.index".into());
        node.properties.insert("source_path".into(), format!("arbor/{id}.rs"));
        node.properties.insert("content_sha256".into(), "a".repeat(64));
        nodes.insert(id.into(), node);
    }
    let mut edges = BTreeMap::new();
    for (id, from, to) in [("root-import", "root", "dependency"), ("consumer-import", "consumer", "dependency")] {
        let mut edge = Edge::new(id, from, "imports", to);
        edge.properties.insert("hqkg.exchange.source".into(), "repos-hq.index".into());
        edges.insert(id.into(), edge);
    }
    let exchange = Exchange {
        manifest: Manifest { source: "repos-hq.index".into(), digest: String::new(), node_count: nodes.len(), edge_count: edges.len(), tombstone_count: 0, reconcile_edges: true },
        nodes, edges, tombstones: Default::default()
    };
    let mut graph = Graph::new();
    exchange.apply(&mut graph).unwrap();
    graph
}

fn task(graph: &Graph) -> (Program, PolicyLimits, RevisionToken) {
    let node = graph.node("root").unwrap();
    let source = SourceRef { source_id: node.id.clone(), revision: node.version, digest: node.properties["content_sha256"].clone(), data_class: DataClass::Internal };
    let step = |id: &str, kind, dependencies: Vec<String>, inputs: Vec<SourceRef>| TransformStep {
        id: id.into(), kind, dependencies, inputs, output_data_class: DataClass::Internal, risk: Risk::R0, destination: None
    };
    let program = Program { id: "novel-import-impact".into(), revision: 1, policy_id: "development-preview".into(), policy_revision: 1, steps: vec![
        step("impact", TransformKind::Evaluate, vec!["select".into()], vec![]),
        step("select", TransformKind::SelectContext, vec![], vec![source]),
        step("projection", TransformKind::Project, vec!["impact".into()], vec![]),
    ] };
    let policy = PolicyLimits { id: "development-preview".into(), revision: 1, max_risk: Risk::R0, max_input_class: DataClass::Internal, max_output_class: DataClass::Internal, allowed_destinations: Default::default(), allow_effect_candidates: false };
    let token = RevisionToken { namespace: Namespace { domain: GraphDomain::Development, owner: "local-hq".into() }, graph_epoch: graph.epoch() };
    (program, policy, token)
}

#[test]
fn selected_imports_are_bound_to_source_free_impact_and_projection() {
    let graph = graph();
    let (program, policy, token) = task(&graph);
    let registry = EngineRegistry::new();
    install_development_engine(&registry, graph.clone()).unwrap();
    let mut cache = IncrementalCache::new();
    let cancel = CancellationToken::new();
    let run = |cache: &mut IncrementalCache| hqkg::native_program::run_indexed_program(&graph, &token, &program, &policy, &registry, cache, Budget::default(), &cancel).unwrap();
    let report = run(&mut cache);
    assert_eq!(report.state, RunState::Complete, "{:?}", report.failure);
    assert!(!report.effect_authorized);
    let impact: Value = serde_json::from_str(&report.outputs[1].data).unwrap();
    assert_eq!(impact["sourceCount"], 2);
    assert_eq!(impact["derivedSourceBindings"]["dependency"][0], "select");
    assert!(impact["dependents"].as_array().unwrap().iter().any(|row| row["id"] == "consumer"));
    let projection: Value = serde_json::from_str(&report.outputs[2].data).unwrap();
    assert_eq!(projection["sourceCount"], 2);
    assert_eq!(projection["derivedSourceBindings"]["dependency"][0], "impact");
    assert_eq!(projection["executionAuthorized"], false);
    let warm = run(&mut cache);
    assert!(warm.outputs.iter().all(|out| out.state == OutputState::Reused));
    assert_eq!(warm.outputs[2].data, report.outputs[2].data);
}

#[test]
fn derived_graph_bindings_require_internal_policy_and_no_destination() {
    let graph = graph();
    let (mut program, mut policy, token) = task(&graph);
    program.steps[0].output_data_class = DataClass::Public;
    assert!(hqkg::native_program::bind_indexed_program(&graph, &token, &program, &policy).is_err());
    program.steps[0].output_data_class = DataClass::Internal;
    policy.allowed_destinations.insert("external".into());
    program.steps[0].destination = Some("external".into());
    assert!(hqkg::native_program::bind_indexed_program(&graph, &token, &program, &policy).is_err());
}

fn semantic_graph(ambiguous: bool, chain_len: usize, symbol_count: usize) -> Graph {
    let mut nodes = BTreeMap::new();
    let owned_node = |id: &str, kind: &str| {
        let mut n = Node::new(id, NodeKind::Other(kind.into()), id);
        n.properties.insert("hqkg.exchange.source".into(), "repos-hq.index".into());
        n
    };
    let owned_edge = |id: &str, from: &str, relation: &str, to: &str| {
        let mut e = Edge::new(id, from, relation, to);
        e.properties.insert("hqkg.exchange.source".into(), "repos-hq.index".into());
        e
    };
    let mut edges = BTreeMap::new();
    for i in 0..=chain_len {
        let id = format!("file-{i}");
        let mut n = owned_node(&id, "source-file");
        n.properties.insert("source_path".into(), format!("arbor/file-{i}.rs"));
        n.properties.insert("content_sha256".into(), "a".repeat(64));
        nodes.insert(id.clone(), n);
        if i > 0 {
            let edge_id = format!("import-{i}");
            edges.insert(edge_id.clone(), owned_edge(&edge_id, &format!("file-{}", i-1), "imports", &id));
        }
    }
    let mut identity = owned_node("identity", "semantic-id");
    identity.properties.insert("semantic_id".into(), "vivim.example-capability@1".into());
    nodes.insert("identity".into(), identity);
    for i in 0..=(if ambiguous { 1 } else { 0 }) {
        let id = format!("anchor-{i}");
        let mut anchor = owned_node(&id, "semantic-file-anchor");
        for (key, value) in [
            ("semantic_id", "vivim.example-capability@1"), ("annotation_kind", "capability"),
            ("status", "indexed-not-live-checked"), ("first_line", "1"), ("occurrence_count", "1"),
        ] { anchor.properties.insert(key.into(), value.into()); }
        anchor.properties.insert("source_path".into(), format!("arbor/file-{i}.rs"));
        anchor.properties.insert("content_sha256".into(), "a".repeat(64));
        nodes.insert(id.clone(), anchor);
        let link = format!("anchor-source-{i}");
        edges.insert(link.clone(), owned_edge(&link, &format!("file-{i}"), "has-semantic-anchor", &id));
        let link = format!("anchor-identity-{i}");
        edges.insert(link.clone(), owned_edge(&link, &id, "references-semantic-id", "identity"));
    }
    for i in 0..symbol_count {
        let id = format!("symbol-{i}");
        let mut n = owned_node(&id, "source-symbol");
        n.properties.insert("source_path".into(), "arbor/file-0.rs".into());
        n.properties.insert("content_sha256".into(), "a".repeat(64));
        n.properties.insert("symbol_name".into(), format!("symbol_{i}"));
        nodes.insert(id.clone(), n);
        let link = format!("symbol-edge-{i}");
        edges.insert(link.clone(), owned_edge(&link, "file-0", "contains-indexed-symbol", &id));
    }
    let exchange = Exchange {
        manifest: Manifest { source: "repos-hq.index".into(), digest: String::new(), node_count: nodes.len(), edge_count: edges.len(), tombstone_count: 0, reconcile_edges: true },
        nodes, edges, tombstones: Default::default()
    };
    let mut graph = Graph::new();
    exchange.apply(&mut graph).unwrap();
    graph
}

#[test]
fn semantic_identity_compiles_to_existing_program_and_refuses_ambiguous_or_stale_inputs() {
    use hqkg::native_program::{build_semantic_program, SemanticTask};
    let graph = semantic_graph(false, 1, 0);
    let (_, policy, mut token) = task(&graph_for_policy());
    token.graph_epoch = graph.epoch();
    let compiled = build_semantic_program(&graph, &token, "vivim.example-capability@1", SemanticTask::Compose, &policy).unwrap();
    assert_eq!(compiled.anchor.file_id, "file-0");
    assert!(compiled.program.steps.iter().filter(|s| s.id != "source").all(|s| s.inputs.is_empty()));
    let registry = EngineRegistry::new();
    install_development_engine(&registry, graph.clone()).unwrap();
    let report = hqkg::native_program::run_indexed_program(&graph, &token, &compiled.program, &policy, &registry,
        &mut IncrementalCache::new(), Budget::default(), &CancellationToken::new()).unwrap();
    assert_eq!(report.state, RunState::Complete, "{:?}", report.failure);
    let impact: Value = serde_json::from_str(&report.outputs.iter().find(|o| o.step_id == "impact").unwrap().data).unwrap();
    assert_eq!(impact["sourceCount"], 2);
    assert_eq!(impact["derivedSourceBindings"]["file-1"][0], "source");
    let mut stale = token.clone(); stale.graph_epoch += 1;
    assert!(build_semantic_program(&graph, &stale, "vivim.example-capability@1", SemanticTask::Inspect, &policy).is_err());
    let ambiguous = semantic_graph(true, 1, 0);
    token.graph_epoch = ambiguous.epoch();
    assert!(build_semantic_program(&ambiguous, &token, "vivim.example-capability@1", SemanticTask::Inspect, &policy).is_err());
    assert!(SemanticTask::parse("effect").is_err());
}

fn graph_for_policy() -> Graph { graph() }

#[test]
fn scoped_inspection_works_when_strict_import_composition_exceeds_depth() {
    use hqkg::native_program::{build_semantic_program, SemanticTask};
    let graph = semantic_graph(false, 5, 0);
    let (_, policy, mut token) = task(&graph_for_policy());
    token.graph_epoch = graph.epoch();
    let registry = EngineRegistry::new();
    install_development_engine(&registry, graph.clone()).unwrap();
    let execute = |task_kind| {
        let p = build_semantic_program(&graph, &token, "vivim.example-capability@1", task_kind, &policy).unwrap();
        hqkg::native_program::run_indexed_program(&graph, &token, &p.program, &policy, &registry,
            &mut IncrementalCache::new(), Budget::default(), &CancellationToken::new()).unwrap()
    };
    let composition = execute(SemanticTask::Compose);
    assert_eq!(composition.state, RunState::Failed);
    assert!(composition.failure.unwrap().contains("incomplete upstream"));
    let inspected = execute(SemanticTask::Inspect);
    assert_eq!(inspected.state, RunState::Complete);
    let meaning: Value = serde_json::from_str(&inspected.outputs[1].data).unwrap();
    assert_eq!(meaning["sourceCount"], 1);
    assert_eq!(meaning["truncated"], false);
    assert_eq!(meaning["semantics"][0]["semanticId"], "vivim.example-capability@1");
    let walk = hqkg::development_relations::imports(&graph, "file-0", false, 3).unwrap();
    assert!(walk.truncated && walk.depth_limited && !walk.result_limited);
}

#[test]
fn symbol_projection_reports_limit_instead_of_silently_omitting_rows() {
    use hqkg::native_program::{build_semantic_program, SemanticTask};
    let graph = semantic_graph(false, 1, 49);
    let (_, policy, mut token) = task(&graph_for_policy());
    token.graph_epoch = graph.epoch();
    let p = build_semantic_program(&graph, &token, "vivim.example-capability@1", SemanticTask::Inspect, &policy).unwrap();
    let registry = EngineRegistry::new();
    install_development_engine(&registry, graph.clone()).unwrap();
    let report = hqkg::native_program::run_indexed_program(&graph, &token, &p.program, &policy, &registry,
        &mut IncrementalCache::new(), Budget::default(), &CancellationToken::new()).unwrap();
    assert_eq!(report.state, RunState::Complete);
    let meaning: Value = serde_json::from_str(&report.outputs[1].data).unwrap();
    assert_eq!(meaning["symbolCount"], 48);
    assert_eq!(meaning["truncated"], true);
    assert!(meaning["limitsReached"].as_array().unwrap().iter().any(|x| x == "symbol-results"));
}

#[test]
fn persistent_session_reuses_mixed_programs_and_refuses_stale_scope_and_policy() {
    use hqkg::native_program::{DevelopmentSession, SemanticTask};
    let graph = semantic_graph(false, 1, 0);
    let (_, policy, mut token) = task(&graph_for_policy());
    token.graph_epoch = graph.epoch();
    let mut session = DevelopmentSession::new(graph, token.clone()).unwrap();
    let cancel = CancellationToken::new();
    let key = "vivim.example-capability@1";
    let (_, first) = session.execute_semantic(&token,key,SemanticTask::Inspect,&policy,Budget::default(),&cancel).unwrap();
    assert_eq!(first.state,RunState::Complete);
    assert!(first.outputs.iter().all(|o|o.state==OutputState::Computed));
    let (_, impact) = session.execute_semantic(&token,key,SemanticTask::Impact,&policy,Budget::default(),&cancel).unwrap();
    assert_eq!(impact.state,RunState::Complete);
    assert_eq!(session.cache_entries(),5);
    let (_, repeated) = session.execute_semantic(&token,key,SemanticTask::Inspect,&policy,Budget::default(),&cancel).unwrap();
    assert!(repeated.outputs.iter().all(|o|o.state==OutputState::Reused));
    assert_eq!(repeated.outputs.iter().map(|o|&o.data).collect::<Vec<_>>(),first.outputs.iter().map(|o|&o.data).collect::<Vec<_>>());
    let mut stale=token.clone();stale.graph_epoch+=1;
    assert!(session.execute_semantic(&stale,key,SemanticTask::Inspect,&policy,Budget::default(),&cancel).is_err());
    stale=token.clone();stale.namespace.owner="another-owner".into();
    assert!(session.execute_semantic(&stale,key,SemanticTask::Inspect,&policy,Budget::default(),&cancel).is_err());
    let mut denied=policy.clone();denied.max_input_class=DataClass::Public;
    assert!(session.execute_semantic(&token,key,SemanticTask::Inspect,&denied,Budget::default(),&cancel).is_err());
    let cancelled=CancellationToken::new();cancelled.cancel();
    assert!(session.execute_semantic(&token,key,SemanticTask::Inspect,&policy,Budget::default(),&cancelled).is_err());
    assert_eq!(session.cache_entries(),5);
}

#[test]
fn finite_batch_cli_reuses_mixed_programs_and_never_emits_partial_response() {
    use std::{io::Write,process::{Command,Stdio}};
    use serde_json::json;
    let graph=semantic_graph(false,1,0);
    let path=std::env::temp_dir().join(format!("hqkg-semantic-batch-{}.hqj",std::process::id()));
    let _=std::fs::remove_file(&path);
    hqkg::Journal::new(&path).save(&graph).unwrap();
    let invoke=|epoch:u64,request:Value|{
        let mut child=Command::new(env!("CARGO_BIN_EXE_hqkg-development"))
            .arg(&path).arg("semantic-batch").arg(epoch.to_string())
            .stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::piped()).spawn().unwrap();
        child.stdin.take().unwrap().write_all(request.to_string().as_bytes()).unwrap();
        child.wait_with_output().unwrap()
    };
    let key="vivim.example-capability@1";
    let inspect=json!({"semanticId":key,"task":"inspect"});
    let impact=json!({"semanticId":key,"task":"impact"});
    let request=json!({"schema":"hqkg.semantic-batch/1","requests":[inspect.clone(),impact,inspect.clone()]});
    let output=invoke(graph.epoch(),request.clone());
    assert!(output.status.success(),"{}",String::from_utf8_lossy(&output.stderr));
    let body:Value=serde_json::from_slice(&output.stdout).unwrap();
    assert_eq!(body["complete"],true);
    assert_eq!(body["executionAuthorized"],false);
    assert_eq!(body["effectPerformed"],false);
    assert!(body["results"][2]["outputs"].as_array().unwrap().iter().all(|o|o["state"]=="reused"));
    for (a,b) in body["results"][0]["outputs"].as_array().unwrap().iter().zip(body["results"][2]["outputs"].as_array().unwrap()){
        assert_eq!(a["result"],b["result"]);
    }
    let invalid=[
        (graph.epoch()+1,request),
        (graph.epoch(),json!({"schema":"hqkg.semantic-batch/1","requests":[inspect.clone(),{"semanticId":"missing@1","task":"inspect"}]})),
        (graph.epoch(),json!({"schema":"hqkg.semantic-batch/1","requests":[{"semanticId":key,"task":"inspect","extra":true}]})),
        (graph.epoch(),json!({"schema":"hqkg.semantic-batch/1","requests":vec![inspect.clone();33]})),
        (graph.epoch(),json!({"schema":"hqkg.semantic-batch/1","requests":[{"semanticId":key,"task":"effect"}]})),
    ];
    for(epoch,body)in invalid{
        let rejected=invoke(epoch,body);
        assert!(!rejected.status.success());
        assert!(rejected.stdout.is_empty(),"must not emit partial output");
    }
    std::fs::remove_file(&path).unwrap();
}

#[test]
fn partitioned_coverage_expands_beyond_strict_depth_with_explicit_bounds() {
    use hqkg::development_relations::{imports,partitioned_imports};
    let graph=semantic_graph(false,20,0);
    let old=imports(&graph,"file-0",false,3).unwrap();
    assert!(old.truncated);
    let coverage=partitioned_imports(&graph,"file-0",false).unwrap();
    assert_eq!(coverage["complete"],true);
    assert_eq!(coverage["sourceCount"],20);
    assert_eq!(coverage["partitionCount"],2);
    assert_eq!(coverage["executionAuthorized"],false);
    let rows=coverage["partitions"].as_array().unwrap().iter()
        .flat_map(|p|p["sources"].as_array().unwrap()).collect::<Vec<_>>();
    assert_eq!(rows.len(),20);
    for (i,row) in rows.iter().enumerate(){
        assert_eq!(row["depth"],i+1);
        assert_eq!(row["id"],format!("file-{}",i+1));
        let node=graph.node(row["id"].as_str().unwrap()).unwrap();
        assert_eq!(row["digest"],node.properties["content_sha256"]);
        assert_eq!(row["revision"],node.version);
    }
    let reverse=partitioned_imports(&graph,"file-20",true).unwrap();
    assert_eq!(reverse["complete"],true);
    assert_eq!(reverse["sourceCount"],20);
    let larger=semantic_graph(false,33,0);
    let limited=partitioned_imports(&larger,"file-0",false).unwrap();
    assert_eq!(limited["complete"],false);
    assert_eq!(limited["depthLimited"],true);
    assert_eq!(limited["sourceCount"],32);
}

#[test]
fn closure_interpretation_executes_all_partition_sources_and_reuses_exact_materializations(){
    use hqkg::native_program::DevelopmentSession;
    let graph=semantic_graph(false,20,0);
    let (_,policy,mut token)=task(&graph_for_policy());
    token.graph_epoch=graph.epoch();
    let mut session=DevelopmentSession::new(graph,token.clone()).unwrap();
    let cancel=CancellationToken::new();
    let key="vivim.example-capability@1";
    let report=session.interpret_closure(&token,key,false,&policy,Budget::default(),&cancel).unwrap();
    assert_eq!(report["sourceCount"],21);
    assert_eq!(report["partitionCount"],2);
    assert_eq!(report["coverageComplete"],true);
    assert_eq!(report["complete"],true);
    assert_eq!(report["effectPerformed"],false);
    let rows=|v:&Value|v["partitions"].as_array().unwrap().iter().flat_map(|p|p["sources"].as_array().unwrap().iter().cloned()).collect::<Vec<_>>();
    let first=rows(&report);
    assert!(first.iter().all(|r|r["state"]=="computed"));
    assert_eq!(first[0]["semanticCount"],1);
    assert_eq!(session.cache_entries(),21);
    let warm=session.interpret_closure(&token,key,false,&policy,Budget::default(),&cancel).unwrap();
    let repeated=rows(&warm);
    for (a,b) in first.iter().zip(repeated.iter()){
        assert_eq!(b["state"],"reused");
        let mut a=a.clone();a["state"]=serde_json::json!("reused");assert_eq!(&a,b);
    }
    let denied=Budget{max_tasks:20,..Budget::default()};
    assert!(session.interpret_closure(&token,key,false,&policy,denied,&cancel).is_err());
    let mut stale=token.clone();stale.graph_epoch+=1;
    assert!(session.interpret_closure(&stale,key,false,&policy,Budget::default(),&cancel).is_err());
    let graph=semantic_graph(false,33,0);
    token.graph_epoch=graph.epoch();
    let mut session=DevelopmentSession::new(graph,token.clone()).unwrap();
    assert!(session.interpret_closure(&token,key,false,&policy,Budget::default(),&cancel).is_err());
    assert_eq!(session.cache_entries(),0);
}

#[test]
fn closure_distinguishes_complete_dependency_coverage_from_limited_interpretation(){
    use hqkg::native_program::DevelopmentSession;
    let graph=semantic_graph(false,1,49);
    let (_,policy,mut token)=task(&graph_for_policy());
    token.graph_epoch=graph.epoch();
    let mut session=DevelopmentSession::new(graph,token.clone()).unwrap();
    let report=session.interpret_closure(&token,"vivim.example-capability@1",false,&policy,Budget::default(),&CancellationToken::new()).unwrap();
    assert_eq!(report["coverageComplete"],true);
    assert_eq!(report["complete"],false);
    assert_eq!(report["truncatedSources"],1);
    assert_eq!(report["partitions"][0]["sources"][0]["limitsReached"][0],"symbol-results");
}
