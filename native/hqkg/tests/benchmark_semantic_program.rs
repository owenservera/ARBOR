//! Opt-in real graph latency benchmark. Use only an isolated authorized
//! development journal created from a known source archive, not a live store.
#![cfg(all(feature = "importer", feature = "native-program"))]

use hqkg::{Journal, native_program::{build_semantic_program, run_indexed_program, SemanticTask}};
use hqkg::development_engine::install_development_engine;
use hqkg::engine::{Budget, CancellationToken, EngineRegistry};
use hqkg::typed_dag::{GraphDomain, Namespace, RevisionToken, IncrementalCache, RunState, OutputState};
use vivim_programmability_core::{DataClass, PolicyLimits, Risk};
use serde_json::{json, Value};
use std::{path::PathBuf, time::Instant};

#[test]
#[ignore = "manual benchmark: requires an explicitly authorized isolated development journal"]
fn actual_semantic_cold_warm_latency() {
    let path = PathBuf::from(std::env::var("HQKG_BENCH_JOURNAL").expect("isolated journal path"));
    let semantic_id = std::env::var("HQKG_BENCH_SEMANTIC_ID").expect("exact versioned capability ID");
    let task = SemanticTask::parse(&std::env::var("HQKG_BENCH_TASK").expect("inspect or compose")).unwrap();
    let metadata = std::fs::symlink_metadata(&path).unwrap();
    assert!(path.is_absolute() && metadata.is_file() && !metadata.file_type().is_symlink());
    let start = Instant::now();
    let graph = Journal::new(&path).load().unwrap();
    graph.check_indexes().unwrap();
    let load_us = start.elapsed().as_micros();
    let expected = RevisionToken { namespace: Namespace { domain: GraphDomain::Development, owner: "benchmark".into() }, graph_epoch: graph.epoch() };
    let policy = PolicyLimits { id: "development-preview".into(), revision: 1, max_risk: Risk::R0,
        max_input_class: DataClass::Internal, max_output_class: DataClass::Internal,
        allowed_destinations: Default::default(), allow_effect_candidates: false };
    let start = Instant::now();
    let compiled = build_semantic_program(&graph, &expected, &semantic_id, task, &policy).unwrap();
    let plan_us = start.elapsed().as_micros();
    let start = Instant::now();
    let registry = EngineRegistry::new();
    install_development_engine(&registry, graph.clone()).unwrap();
    let install_us = start.elapsed().as_micros();
    let mut cache = IncrementalCache::new();
    let cancel = CancellationToken::new();
    let run = |cache: &mut IncrementalCache| run_indexed_program(&graph, &expected, &compiled.program, &policy, &registry, cache, Budget::default(), &cancel).unwrap();
    let start = Instant::now();
    let first = run(&mut cache);
    let cold_us = start.elapsed().as_micros();
    assert_eq!(first.state, RunState::Complete, "{:?}", first.failure);
    assert!(!first.effect_authorized);
    assert!(first.outputs.iter().all(|o| o.state == OutputState::Computed));
    for output in &first.outputs {
        let result: Value = serde_json::from_str(&output.data).unwrap();
        assert_eq!(result["truncated"], false, "benchmark requires complete bounded output");
        assert_eq!(result["executionAuthorized"], false);
        assert_eq!(result["effectPerformed"], false);
    }
    let mut samples = Vec::new();
    for _ in 0..31 {
        let start = Instant::now();
        let next = run(&mut cache);
        samples.push(start.elapsed().as_micros());
        assert_eq!(next.state, RunState::Complete);
        assert!(!next.effect_authorized);
        assert_eq!(next.outputs.len(), first.outputs.len());
        for (a,b) in first.outputs.iter().zip(&next.outputs) {
            assert_eq!(b.state, OutputState::Reused);
            assert_eq!(a.data,b.data);
            assert_eq!(a.provenance,b.provenance);
            assert_eq!(a.input_stamp,b.input_stamp);
        }
    }
    samples.sort_unstable();
    println!("{}",json!({
        "schema":"hqkg.real-semantic-benchmark/1","task":task.name(),"semanticId":semantic_id,
        "graphEpoch":graph.epoch(),"sourceDigest":compiled.anchor.content_digest,
        "loadAndCheckUs":load_us,"compileUs":plan_us,"engineInstallUs":install_us,
        "coldUs":cold_us,"warmMedianUs":samples[15],"warmP95Us":samples[29],
        "warmSamples":samples.len(),"cachedSteps":cache.len(),"cacheApproximateBytes":cache.approximate_bytes(),
        "llmCalls":0,"effects":0
    }));
}
