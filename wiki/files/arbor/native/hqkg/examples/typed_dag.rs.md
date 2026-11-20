# File: native/hqkg/examples/typed_dag.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/examples/typed_dag.rs |
| Language | Rust |
| Kind | source |
| Size | 2459 B |
| Lines | 75 |
| Hash | 9812907e21d7 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| LengthTransform | struct | 14 | no | struct LengthTransform; |
| descriptor | method | 16 | no | fn descriptor(&amp;self) -&gt; EngineDescriptor { |
| execute | method | 19 | no | fn execute(&amp;self, request: &amp;EngineRequest) -&gt; Result&lt;EngineOutput&gt; { |
| main | function | 25 | no | fn main() -&gt; Result&lt;()&gt; { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::engine::{ | use | 3 | external |
| hqkg::typed_dag::{ | use | 7 | external |
| hqkg::Result | use | 11 | external |
| std::sync::Arc | use | 12 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
