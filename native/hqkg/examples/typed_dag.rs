//! cargo run --manifest-path research/rust-knowledge-graph/Cargo.toml --example typed_dag
//! An actual Rust consumer of the existing registry/scheduler, not a Host grant.
use hqkg::engine::{
    Budget, CancellationToken, ComputeEngine, EngineDescriptor, EngineOutput, EngineRegistry,
    EngineRequest,
};
use hqkg::typed_dag::{
    DagExecutor, GraphDomain, IncrementalCache, Namespace, RevisionToken, SourceBinding,
    TransformPlan, TransformStep, PURE_INTERFACE,
};
use hqkg::Result;
use std::sync::Arc;

struct LengthTransform;
impl ComputeEngine for LengthTransform {
    fn descriptor(&self) -> EngineDescriptor {
        EngineDescriptor::new("length", "builtin-length-v1", PURE_INTERFACE, &["length"])
    }
    fn execute(&self, request: &EngineRequest) -> Result<EngineOutput> {
        Ok(EngineOutput {
            data: request.data.len().to_string(),
        })
    }
}
fn main() -> Result<()> {
    let ns = Namespace {
        domain: GraphDomain::Development,
        owner: "hq-example".into(),
    };
    let epoch = RevisionToken {
        namespace: ns.clone(),
        graph_epoch: 1,
    };
    let registry = EngineRegistry::new();
    registry.install(Arc::new(LengthTransform), None)?;
    let plan = TransformPlan {
        namespace: ns.clone(),
        expected: epoch.clone(),
        steps: vec![TransformStep {
            id: "first".into(),
            engine: "length".into(),
            operation: "length".into(),
            input: "local-read-only-data".into(),
            after: Vec::new(),
            retry_io: 0,
            sources: vec![SourceBinding {
                namespace: ns,
                id: "fixture".into(),
                revision: 1,
                digest: "a".repeat(64),
                provenance: "example-only".into(),
            }],
        }],
    };
    let mut cache = IncrementalCache::new();
    let first = DagExecutor::new(&registry).run(
        &plan,
        &epoch,
        &mut cache,
        Budget::default(),
        &CancellationToken::new(),
    )?;
    let second = DagExecutor::new(&registry).run(
        &plan,
        &epoch,
        &mut cache,
        Budget::default(),
        &CancellationToken::new(),
    )?;
    println!(
        "first={:?} second={:?} effectAuthorized={}",
        first.outputs[0].state, second.outputs[0].state, first.effect_authorized
    );
    Ok(())
}
